import type { WebSocket } from 'ws';
import {
  createMessage,
  DevToolsRole,
  MessageType,
  type BeginTransactionMessage,
  type BeginTransactionRequestMessage,
  type CommitTransactionMessage,
  type CommitTransactionRequestMessage,
  type ExecuteWriteMessage,
  type RollbackTransactionMessage,
  type RollbackTransactionRequestMessage,
  type TransactionAckMessage,
  type TransactionStatusMessage,
  type WriteAckMessage,
  type WriteErrorCode,
  type WriteErrorMessage,
  type WriteRequestMessage,
  type WriteResultMessage,
} from '../types/protocol';
import { logger } from '../utils/logger';
import type { ConnectionManager } from './connectionManager';
import type { MessageRouter } from './messageRouter';
import type { WriteSessionManager } from './writeSessionManager';

export class WriteCoordinator {
  constructor(
    private readonly connectionManager: ConnectionManager,
    private readonly router: MessageRouter,
    private readonly sessions: WriteSessionManager,
  ) {}

  handleBeginTransactionRequest(
    browserSocket: WebSocket,
    message: BeginTransactionRequestMessage,
  ): void {
    const browser = this.connectionManager.getBySocket(browserSocket);

    if (!browser || browser.role !== DevToolsRole.BROWSER) {
      return;
    }

    const mobile = this.connectionManager.getByDeviceId(message.deviceId);

    if (!mobile) {
      this.sendWriteError(browser.connectionId, {
        transactionId: message.transactionId,
        code: 'DEVICE_OFFLINE',
        message: `Device ${message.deviceId} is not connected`,
      });
      return;
    }

    if (this.sessions.getActiveForDevice(message.deviceId)) {
      this.sendWriteError(browser.connectionId, {
        transactionId: message.transactionId,
        code: 'TRANSACTION_BUSY',
        message: 'A transaction is already open for this device',
      });
      return;
    }

    this.sessions.create({
      transactionId: message.transactionId,
      deviceId: message.deviceId,
      browserConnectionId: browser.connectionId,
    });

    logger.syncStarted(message.transactionId, message.deviceId);

    this.router.sendToMobile(
      message.deviceId,
      createMessage<BeginTransactionMessage>({
        type: MessageType.BEGIN_TRANSACTION,
        transactionId: message.transactionId,
      }),
    );
  }

  handleCommitTransactionRequest(
    browserSocket: WebSocket,
    message: CommitTransactionRequestMessage,
  ): void {
    const browser = this.connectionManager.getBySocket(browserSocket);
    const session = this.sessions.get(message.transactionId);

    if (!browser || browser.role !== DevToolsRole.BROWSER || !session) {
      return;
    }

    if (session.browserConnectionId !== browser.connectionId) {
      return;
    }

    if (session.state !== 'open') {
      this.sendWriteError(browser.connectionId, {
        transactionId: message.transactionId,
        code: 'NO_TRANSACTION',
        message: 'Transaction is not open',
      });
      return;
    }

    this.sessions.setState(message.transactionId, 'committing');

    this.router.sendToMobile(
      session.deviceId,
      createMessage<CommitTransactionMessage>({
        type: MessageType.COMMIT_TRANSACTION,
        transactionId: message.transactionId,
      }),
    );
  }

  handleRollbackTransactionRequest(
    browserSocket: WebSocket,
    message: RollbackTransactionRequestMessage,
  ): void {
    const browser = this.connectionManager.getBySocket(browserSocket);
    const session = this.sessions.get(message.transactionId);

    if (!browser || browser.role !== DevToolsRole.BROWSER || !session) {
      return;
    }

    if (session.browserConnectionId !== browser.connectionId) {
      return;
    }

    if (session.state !== 'open' && session.state !== 'committing') {
      this.sendWriteError(browser.connectionId, {
        transactionId: message.transactionId,
        code: 'NO_TRANSACTION',
        message: 'Transaction is not open',
      });
      return;
    }

    this.sessions.setState(message.transactionId, 'rolling_back');

    this.router.sendToMobile(
      session.deviceId,
      createMessage<RollbackTransactionMessage>({
        type: MessageType.ROLLBACK_TRANSACTION,
        transactionId: message.transactionId,
      }),
    );
  }

  handleWriteRequest(browserSocket: WebSocket, message: WriteRequestMessage): void {
    const browser = this.connectionManager.getBySocket(browserSocket);
    const session = this.sessions.get(message.transactionId);

    if (!browser || browser.role !== DevToolsRole.BROWSER || !session) {
      return;
    }

    if (session.browserConnectionId !== browser.connectionId) {
      return;
    }

    if (session.state !== 'open') {
      this.sendWriteError(browser.connectionId, {
        transactionId: message.transactionId,
        writeId: message.writeId,
        code: 'NO_TRANSACTION',
        message: 'Transaction is not open',
      });
      return;
    }

    const mobile = this.connectionManager.getByDeviceId(session.deviceId);

    if (!mobile) {
      this.sendWriteError(browser.connectionId, {
        transactionId: message.transactionId,
        writeId: message.writeId,
        code: 'DEVICE_OFFLINE',
        message: `Device ${session.deviceId} is not connected`,
      });
      return;
    }

    this.sessions.incrementPendingWrites(message.transactionId);

    this.router.sendToMobile(
      session.deviceId,
      createMessage<ExecuteWriteMessage>({
        type: MessageType.EXECUTE_WRITE,
        writeId: message.writeId,
        transactionId: message.transactionId,
        operation: message.operation,
      }),
    );
  }

  handleTransactionAck(message: TransactionAckMessage): void {
    const session = this.sessions.get(message.transactionId);

    if (!session) {
      return;
    }

    if (!message.ok) {
      this.sessions.setState(message.transactionId, 'failed');
      this.sendWriteError(session.browserConnectionId, {
        transactionId: message.transactionId,
        code: message.action === 'begin' ? 'ADAPTER_ERROR' : 'WRITE_FAILED',
        message: message.message ?? `Transaction ${message.action} failed`,
      });
      this.sessions.remove(message.transactionId);
      return;
    }

    if (message.action === 'begin') {
      this.sendTransactionStatus(session.browserConnectionId, {
        transactionId: message.transactionId,
        deviceId: session.deviceId,
        state: 'open',
      });
      return;
    }

    if (message.action === 'commit') {
      this.sendTransactionStatus(session.browserConnectionId, {
        transactionId: message.transactionId,
        deviceId: session.deviceId,
        state: 'idle',
      });
      this.sessions.remove(message.transactionId);
      return;
    }

    this.sendTransactionStatus(session.browserConnectionId, {
      transactionId: message.transactionId,
      deviceId: session.deviceId,
      state: 'idle',
      message: message.message,
    });
    this.sessions.remove(message.transactionId);
  }

  handleWriteAck(message: WriteAckMessage): void {
    const session = this.sessions.get(message.transactionId);

    if (!session) {
      return;
    }

    this.sessions.decrementPendingWrites(message.transactionId);

    if (!message.ok) {
      this.sendWriteError(session.browserConnectionId, {
        transactionId: message.transactionId,
        writeId: message.writeId,
        code: 'WRITE_FAILED',
        message: message.message ?? 'Write operation failed',
      });
      return;
    }

    this.router.sendToBrowser(
      session.browserConnectionId,
      createMessage<WriteResultMessage>({
        type: MessageType.WRITE_RESULT,
        writeId: message.writeId,
        transactionId: message.transactionId,
        rowsAffected: message.rowsAffected ?? 0,
      }),
    );
  }

  checkTimeouts(): void {
    for (const session of this.sessions.getExpired()) {
      logger.syncFailed(session.transactionId, 'TIMEOUT', 'Write transaction timed out');

      this.sendWriteError(session.browserConnectionId, {
        transactionId: session.transactionId,
        code: 'TIMEOUT',
        message: 'Write transaction timed out',
      });

      this.router.sendToMobile(
        session.deviceId,
        createMessage<RollbackTransactionMessage>({
          type: MessageType.ROLLBACK_TRANSACTION,
          transactionId: session.transactionId,
        }),
      );

      this.sessions.remove(session.transactionId);
    }
  }

  private sendTransactionStatus(
    browserConnectionId: string,
    payload: Omit<TransactionStatusMessage, 'type' | 'timestamp'>,
  ): void {
    this.router.sendToBrowser(
      browserConnectionId,
      createMessage<TransactionStatusMessage>({
        type: MessageType.TRANSACTION_STATUS,
        ...payload,
      }),
    );
  }

  private sendWriteError(
    browserConnectionId: string,
    payload: {
      transactionId: string;
      writeId?: string;
      code: WriteErrorCode;
      message: string;
    },
  ): void {
    this.router.sendToBrowser(
      browserConnectionId,
      createMessage<WriteErrorMessage>({
        type: MessageType.WRITE_ERROR,
        ...payload,
      }),
    );
  }
}
