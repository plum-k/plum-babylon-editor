/* eslint-disable no-console */
/**
 * Logger used throughout the application to allow configuration of
 * the log level required for the messages.
 */
export class Logger {
    static _CheckLimit(message, limit) {
        let entry = Logger._LogLimitOutputs[message];
        if (!entry) {
            entry = { limit, current: 1 };
            Logger._LogLimitOutputs[message] = entry;
        }
        else {
            entry.current++;
        }
        return entry.current <= entry.limit;
    }
    static _GenerateLimitMessage(message, level = 1) {
        const entry = Logger._LogLimitOutputs[message];
        if (!entry || !Logger.MessageLimitReached) {
            return;
        }
        const type = this._Levels[level];
        if (entry.current === entry.limit) {
            Logger[type.name](Logger.MessageLimitReached.replace(/%LIMIT%/g, "" + entry.limit).replace(/%TYPE%/g, type.name ?? ""));
        }
    }
    static _AddLogEntry(entry) {
        Logger._LogCache = entry + Logger._LogCache;
        if (Logger.OnNewCacheEntry) {
            Logger.OnNewCacheEntry(entry);
        }
    }
    static _FormatMessage(message) {
        const padStr = (i) => (i < 10 ? "0" + i : "" + i);
        const date = new Date();
        return "[" + padStr(date.getHours()) + ":" + padStr(date.getMinutes()) + ":" + padStr(date.getSeconds()) + "]: " + message;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static _LogDisabled(message, limit) {
        // nothing to do
    }
    static _LogEnabled(level = 1, message, limit) {
        // take first message if array
        const msg = Array.isArray(message) ? message[0] : message;
        if (limit !== undefined && !Logger._CheckLimit(msg, limit)) {
            return;
        }
        const formattedMessage = Logger._FormatMessage(msg);
        const type = this._Levels[level];
        const optionals = Array.isArray(message) ? message.slice(1) : [];
        type.logFunc && type.logFunc("BJS - " + formattedMessage, ...optionals);
        const entry = `<div style='color:${type.color}'>${formattedMessage}</div><br>`;
        Logger._AddLogEntry(entry);
        Logger._GenerateLimitMessage(msg, level);
    }
    /**
     * Gets current log cache (list of logs)
     */
    static get LogCache() {
        return Logger._LogCache;
    }
    /**
     * Clears the log cache
     */
    static ClearLogCache() {
        Logger._LogCache = "";
        Logger._LogLimitOutputs = {};
        Logger.errorsCount = 0;
    }
    /**
     * Sets the current log level. This property is a bit field, allowing you to combine different levels (MessageLogLevel / WarningLogLevel / ErrorLogLevel).
     * Use NoneLogLevel to disable logging and AllLogLevel for a quick way to enable all levels.
     */
    static set LogLevels(level) {
        Logger.Log = Logger._LogDisabled;
        Logger.Warn = Logger._LogDisabled;
        Logger.Error = Logger._LogDisabled;
        [Logger.MessageLogLevel, Logger.WarningLogLevel, Logger.ErrorLogLevel].forEach((l) => {
            if ((level & l) === l) {
                const type = this._Levels[l];
                Logger[type.name] = Logger._LogEnabled.bind(Logger, l);
            }
        });
    }
}
/**
 * No log
 */
Logger.NoneLogLevel = 0;
/**
 * Only message logs
 */
Logger.MessageLogLevel = 1;
/**
 * Only warning logs
 */
Logger.WarningLogLevel = 2;
/**
 * Only error logs
 */
Logger.ErrorLogLevel = 4;
/**
 * All logs
 */
Logger.AllLogLevel = 7;
/**
 * Message to display when a message has been logged too many times
 */
Logger.MessageLimitReached = "Too many %TYPE%s (%LIMIT%), no more %TYPE%s will be reported for this message.";
Logger._LogCache = "";
Logger._LogLimitOutputs = {};
// levels according to the (binary) numbering.
Logger._Levels = [
    {},
    { color: "white", logFunc: console.log, name: "Log" },
    { color: "orange", logFunc: console.warn, name: "Warn" },
    {},
    { color: "red", logFunc: console.error, name: "Error" },
];
/**
 * Gets a value indicating the number of loading errors
 * @ignorenaming
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
Logger.errorsCount = 0;
/**
 * Log a message to the console
 */
Logger.Log = Logger._LogEnabled.bind(Logger, Logger.MessageLogLevel);
/**
 * Write a warning message to the console
 */
Logger.Warn = Logger._LogEnabled.bind(Logger, Logger.WarningLogLevel);
/**
 * Write an error message to the console
 */
Logger.Error = Logger._LogEnabled.bind(Logger, Logger.ErrorLogLevel);
//# sourceMappingURL=logger.js.map