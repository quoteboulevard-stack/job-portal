"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.createLogger = createLogger;
const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
function serialize(entry, pretty) {
    return pretty ? JSON.stringify(entry, null, 2) : JSON.stringify(entry);
}
function createLogger(options = {}) {
    const { minLevel = "info", context, pretty = false } = options;
    function log(level, message, meta) {
        if (LEVELS[level] < LEVELS[minLevel])
            return;
        const entry = Object.assign(Object.assign({ timestamp: new Date().toISOString(), level,
            message }, (context && { context })), meta);
        const output = serialize(entry, pretty);
        if (level === "error" || level === "warn") {
            console.error(output);
        }
        else {
            console.log(output);
        }
    }
    return {
        debug: (msg, meta) => log("debug", msg, meta),
        info: (msg, meta) => log("info", msg, meta),
        warn: (msg, meta) => log("warn", msg, meta),
        error: (msg, meta) => log("error", msg, meta),
        child: (childContext, overrides) => createLogger(Object.assign(Object.assign({ minLevel, pretty }, overrides), { context: childContext })),
    };
}
exports.logger = createLogger({
    minLevel: (_a = process.env["LOG_LEVEL"]) !== null && _a !== void 0 ? _a : "info",
    pretty: process.env["NODE_ENV"] === "development",
});
//# sourceMappingURL=logger.js.map