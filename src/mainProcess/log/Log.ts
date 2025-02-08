export enum type_log_levels {
    "trace",
    "debug",
    "info",
    "warn",
    "error",
    "fatal",
};

/**
 * A simple logger for main process and renderer process
 * 
 * 6 log levels:
 *  - trace
 *  - debug
 *  - info
 *  - warn
 *  - error
 *  - fatal
 * 
 * The log level can be set in command line startup option: --log-level ...
 * 
 * We can set to print the stack trace for all logs by presenting the --log-stack-trace option in command line
 * 
 * Format:
 * [2024-07-04 15:23:15.123] [info] -1 Main process is created
 */
export class Log {
    private static _logLevel: type_log_levels = type_log_levels.error;
    private static _useStackTrace: boolean = false;

    private static _inBrowser: boolean = (() => {
        if (typeof window !== "undefined" && typeof window.document !== "undefined") {
            console.log("Running in a browser");
            return true;
        } else if (typeof global !== "undefined" && typeof process !== "undefined") {
            console.log("Running in Node.js");
            return false;
        }
        return false;
    })();

    private static t0: number = performance.now();

    constructor() {
    }

    /**
     * mainProcesId: "-1" means the main main processes
     */
    static printLog = (type: type_log_levels, ...args: any) => {

        let logMeta = "";

        if (this.isInBrowser()) {
            // in renderer process
            // [time since window created] [log level] [...args]
            const timeSinceStartup = performance.now() - this.t0;
            logMeta = `[${timeSinceStartup}] [${type_log_levels[type]}]`;
        } else {
            // in main process
            // [time stamp] [main process ID] [log level] [...args]
            const timeMsSinceEpoch = Date.now();
            const timeStr = new Date(timeMsSinceEpoch).toISOString();
            logMeta = `[${timeStr}] [${type_log_levels[type]}]`;
        }

        if (this.getUseStackTrace()) {
            console.trace(logMeta, ...args);
        } else {
            console.log(logMeta, ...args);
        }
    }

    static fatal = (...args: any[]) => {
        if (type_log_levels.fatal >= this.getLogLevel()) {
            this.printLog(type_log_levels.fatal, ...args)
        }
    };

    static error = (...args: any[]) => {
        if (type_log_levels.error >= this.getLogLevel()) {
            this.printLog(type_log_levels.error, ...args)
        }
    };

    static warn = (...args: any[]) => {
        if (type_log_levels.warn >= this.getLogLevel()) {
            this.printLog(type_log_levels.warn, ...args)
        }
    };

    static info = (...args: any[]) => {
        if (type_log_levels.info >= this.getLogLevel()) {
            this.printLog(type_log_levels.info, ...args)
        }
    };

    static debug = (...args: any[]) => {
        if (type_log_levels.debug >= this.getLogLevel()) {
            this.printLog(type_log_levels.debug, ...args)
        }
    };

    static trace = (...args: any[]) => {
        if (type_log_levels.trace >= this.getLogLevel()) {
            this.printLog(type_log_levels.trace, ...args)
        }
    };
    static getLogLevel = () => {
        return this._logLevel;
    }

    static setLogLevel = (newLevel: type_log_levels) => {
        this._logLevel = newLevel;
    }

    static getUseStackTrace = () => {
        return this._useStackTrace;
    }

    static setUseStackTrace = (use: boolean) => {
        this._useStackTrace = use;
    }

    static isInBrowser = () => {
        return this._inBrowser;
    }
}
