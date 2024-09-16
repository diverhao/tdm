import { logLevel, logLevels } from "./GlobalVariables";

/**
 * A simple wrapper of console.log for client output in browser window.
 *
 * fatal, error, info, debug, trace
 */
export class Log {
	constructor() {}

	static fatal = (...message: any[]) => {
		if (logLevel <= logLevels.fatal) {
			this.printLog("FATAL", message);
		}
	};

	static error = (...message: any[]) => {
		if (logLevel <= logLevels.error) {
			this.printLog("ERROR", message);
		}
	};

	static info = (...message: any[]) => {
		if (logLevel <= logLevels.info) {
			this.printLog("INFO", message);
		}
	};

	static debug = (...message: any[]) => {
		if (logLevel <= logLevels.debug) {
			this.printLog("DEBUG", message);
		}
	};

	static trace = (...message: any[]) => {
		if (logLevel <= logLevels.trace) {
			this.printLog("TRACE", message);
		}
	};

	static printLog = (type: string, message: any[]) => {
		console.log(`[${Math.round(performance.now())}]`, type, "\n  ", ...message);
	};
}
