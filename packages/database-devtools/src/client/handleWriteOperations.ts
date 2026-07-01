import type { DatabaseAdapter } from '../types/adapter';
import { isEditableDatabaseAdapter } from '../types/adapter';
import type {
  BeginTransactionMessage,
  CommitTransactionMessage,
  ExecuteWriteMessage,
  RollbackTransactionMessage,
  TransactionAckMessage,
  WriteAckMessage,
} from '../types/protocol';

export type TransactionAckReporter = (
  message: Omit<TransactionAckMessage, 'timestamp' | 'type'>,
) => void;
export type WriteAckReporter = (message: Omit<WriteAckMessage, 'timestamp' | 'type'>) => void;

export async function handleBeginTransaction(
  adapter: DatabaseAdapter | undefined,
  message: BeginTransactionMessage,
  report: TransactionAckReporter,
): Promise<void> {
  if (!isEditableDatabaseAdapter(adapter)) {
    report({
      transactionId: message.transactionId,
      action: 'begin',
      ok: false,
      message: 'Database adapter does not support writes',
    });
    return;
  }

  try {
    await adapter.beginTransaction();
    report({
      transactionId: message.transactionId,
      action: 'begin',
      ok: true,
    });
  } catch (error) {
    report({
      transactionId: message.transactionId,
      action: 'begin',
      ok: false,
      message: error instanceof Error ? error.message : 'Failed to begin transaction',
    });
  }
}

export async function handleCommitTransaction(
  adapter: DatabaseAdapter | undefined,
  message: CommitTransactionMessage,
  report: TransactionAckReporter,
): Promise<void> {
  if (!isEditableDatabaseAdapter(adapter)) {
    report({
      transactionId: message.transactionId,
      action: 'commit',
      ok: false,
      message: 'Database adapter does not support writes',
    });
    return;
  }

  try {
    await adapter.commitTransaction();
    report({
      transactionId: message.transactionId,
      action: 'commit',
      ok: true,
    });
  } catch (error) {
    report({
      transactionId: message.transactionId,
      action: 'commit',
      ok: false,
      message: error instanceof Error ? error.message : 'Failed to commit transaction',
    });
  }
}

export async function handleRollbackTransaction(
  adapter: DatabaseAdapter | undefined,
  message: RollbackTransactionMessage,
  report: TransactionAckReporter,
): Promise<void> {
  if (!isEditableDatabaseAdapter(adapter)) {
    report({
      transactionId: message.transactionId,
      action: 'rollback',
      ok: false,
      message: 'Database adapter does not support writes',
    });
    return;
  }

  try {
    await adapter.rollbackTransaction();
    report({
      transactionId: message.transactionId,
      action: 'rollback',
      ok: true,
    });
  } catch (error) {
    report({
      transactionId: message.transactionId,
      action: 'rollback',
      ok: false,
      message: error instanceof Error ? error.message : 'Failed to roll back transaction',
    });
  }
}

export async function handleExecuteWrite(
  adapter: DatabaseAdapter | undefined,
  message: ExecuteWriteMessage,
  report: WriteAckReporter,
): Promise<void> {
  if (!isEditableDatabaseAdapter(adapter)) {
    report({
      writeId: message.writeId,
      transactionId: message.transactionId,
      ok: false,
      message: 'Database adapter does not support writes',
    });
    return;
  }

  try {
    const result = await adapter.executeWrite(message.operation);
    report({
      writeId: message.writeId,
      transactionId: message.transactionId,
      ok: true,
      rowsAffected: result.rowsAffected,
    });
  } catch (error) {
    report({
      writeId: message.writeId,
      transactionId: message.transactionId,
      ok: false,
      message: error instanceof Error ? error.message : 'Write operation failed',
    });
  }
}
