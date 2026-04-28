export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  [key: string]: unknown;
}

export interface LoggerOptions {
  minLevel?: LogLevel;
  context?: string;
  pretty?: boolean;
}

function serialize(entry: LogEntry, pretty: boolean): string {
  return pretty ? JSON.stringify(entry, null, 2) : JSON.stringify(entry);
}

export function createLogger(options: LoggerOptions = {}) {
  const { minLevel = "info", context, pretty = false } = options;

  function log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    if (LEVELS[level] < LEVELS[minLevel]) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(context && { context }),
      ...meta,
    };

    const output = serialize(entry, pretty);
    if (level === "error" || level === "warn") {
      console.error(output);
    } else {
      console.log(output);
    }
  }

  return {
    debug: (msg: string, meta?: Record<string, unknown>) => log("debug", msg, meta),
    info:  (msg: string, meta?: Record<string, unknown>) => log("info",  msg, meta),
    warn:  (msg: string, meta?: Record<string, unknown>) => log("warn",  msg, meta),
    error: (msg: string, meta?: Record<string, unknown>) => log("error", msg, meta),
    child: (childContext: string, overrides?: Omit<LoggerOptions, "context">) =>
      createLogger({ minLevel, pretty, ...overrides, context: childContext }),
  };
}

export const logger = createLogger({
  minLevel: (process.env["LOG_LEVEL"] as LogLevel | undefined) ?? "info",
  pretty: process.env["NODE_ENV"] === "development",
});
