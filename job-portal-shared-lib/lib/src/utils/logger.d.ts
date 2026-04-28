export type LogLevel = "debug" | "info" | "warn" | "error";
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
export declare function createLogger(options?: LoggerOptions): {
    debug: (msg: string, meta?: Record<string, unknown>) => void;
    info: (msg: string, meta?: Record<string, unknown>) => void;
    warn: (msg: string, meta?: Record<string, unknown>) => void;
    error: (msg: string, meta?: Record<string, unknown>) => void;
    child: (childContext: string, overrides?: Omit<LoggerOptions, "context">) => /*elided*/ any;
};
export declare const logger: {
    debug: (msg: string, meta?: Record<string, unknown>) => void;
    info: (msg: string, meta?: Record<string, unknown>) => void;
    warn: (msg: string, meta?: Record<string, unknown>) => void;
    error: (msg: string, meta?: Record<string, unknown>) => void;
    child: (childContext: string, overrides?: Omit<LoggerOptions, "context">) => /*elided*/ any;
};
//# sourceMappingURL=logger.d.ts.map