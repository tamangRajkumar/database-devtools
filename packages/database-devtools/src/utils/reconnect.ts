export type ReconnectOptions = {
  baseMs?: number;
  maxMs?: number;
  jitterMs?: number;
};

const DEFAULT_BASE_MS = 1_000;
const DEFAULT_MAX_MS = 30_000;
const DEFAULT_JITTER_MS = 500;

export function calculateBackoffDelay(attempt: number, options: ReconnectOptions = {}): number {
  const baseMs = options.baseMs ?? DEFAULT_BASE_MS;
  const maxMs = options.maxMs ?? DEFAULT_MAX_MS;
  const jitterMs = options.jitterMs ?? DEFAULT_JITTER_MS;

  const exponential = baseMs * 2 ** attempt;
  const capped = Math.min(exponential, maxMs);
  const jitter = Math.floor(Math.random() * jitterMs);

  return capped + jitter;
}

export type ReconnectSchedulerOptions = ReconnectOptions & {
  onReconnect: () => void;
};

export class ReconnectScheduler {
  private attempt = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly onReconnect: () => void;
  private readonly options: ReconnectOptions;

  constructor({ onReconnect, ...options }: ReconnectSchedulerOptions) {
    this.onReconnect = onReconnect;
    this.options = options;
  }

  schedule(): void {
    if (this.timer !== null) {
      return;
    }

    const delay = calculateBackoffDelay(this.attempt, this.options);
    this.attempt += 1;

    this.timer = setTimeout(() => {
      this.timer = null;
      this.onReconnect();
    }, delay);
  }

  reset(): void {
    this.attempt = 0;
    this.cancel();
  }

  cancel(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
