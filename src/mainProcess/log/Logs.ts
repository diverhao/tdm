import { MainProcesses } from "../mainProcess/MainProcesses";

// import { type_log_levels } from "./Log";

export type type_logViewer = {
    displayWindowId: string,
    widgetKey: string
};

export enum type_log_levels {
    "trace",
    "debug",
    "info",
    "warn",
    "error",
    "fatal",
};

// export type type_log_levels = "fatal" | "error" | "warn" | "info" | "debug" | "trace";

/**
 * A simple logger for main process
 * 
 * 3 places: 
 * 
 * (1) standard output
 * 
 * (2) log file
 * 
 * (3) LogViewer widget
 * 
 * [time stamp]              [profile name]  [type]  content
 * [2024-07-04 15:23:15.123] [SNS Operation] [error] Main process is created
 */
export class Logs {
    // private _logs: Record<string, Log> = {};
    private _logViewers: type_logViewer[] = [];
    private _logLevel: type_log_levels = type_log_levels.info;
    private _logFile: string | undefined = undefined;

    private _mainProcesses: MainProcesses | undefined;

    // 3-bit number, 0 means not masked, 1 means masked
    // 0th bit: mask standard output
    // 1st bit: mask file
    // 2nd bit: mask LogViewer
    // using it we can temporarily change the destinations
    private _modeMask: number = 0;

    constructor() {
    }

    /**
     * mainProcesId: "-1" means the main main processes
     */
    printLog = (mainProcessId: string, type: type_log_levels, ...args: any) => {
        const timeMsSinceEpoch = Date.now();
        const timeStr = new Date(timeMsSinceEpoch).toISOString();

        // skip this for efficiency
        // let profileName = "N/A";
        // if (mainProcessId === "-1") {
        //     profileName = "Main Processes";
        // } else {
        //     const mainProcesses = this.getMainProcesses();
        //     if (mainProcesses !== undefined) {
        //         const mainProcess = mainProcesses.getProcess(mainProcessId);
        //         if (mainProcess !== undefined) {
        //             profileName = "Main Process " + mainProcessId;
        //             const selectedProfile = mainProcess.getProfiles().getSelectedProfile();
        //             if (selectedProfile !== undefined) {
        //                 profileName = selectedProfile._name;
        //             }
        //         }
        //     }
        // }
        // const logMeta = `[${timeStr}] [${profileName}] [${type_log_levels[type]}]`;
        
        const logMeta = `[${timeStr}] [${mainProcessId}] [${type_log_levels[type]}]`;
        // (1) standard output
        if (((this.getModeMask() >> 0) & 1) === 0) {
            console.log(logMeta, ...args);
        }
        // todo: (2) log file
        if (((this.getModeMask() >> 1) & 1) === 0) {
        }
        // (3) LogViewer
        if (((this.getModeMask() >> 2) & 1) === 0) {
            this.sendToLogViewers({
                timeMsSinceEpoch: timeMsSinceEpoch,
                // profileName: profileName,
                profileName: mainProcessId,
                type: type,
                args: args,
            });
        }
    }

    // print log

    fatal = (mainProcessId: string, ...args: any[]) => {
        if (type_log_levels.fatal >= this.getLogLevel()) {
            this.printLog(mainProcessId, type_log_levels.fatal, ...args)
        }
    };

    error = (mainProcessId: string, ...args: any[]) => {
        if (type_log_levels.error >= this.getLogLevel()) {
            this.printLog(mainProcessId, type_log_levels.error, ...args)
        }
    };

    warn = (mainProcessId: string, ...args: any[]) => {
        if (type_log_levels.warn >= this.getLogLevel()) {
            this.printLog(mainProcessId, type_log_levels.warn, ...args)
        }
    };

    info = (mainProcessId: string, ...args: any[]) => {
        if (type_log_levels.info >= this.getLogLevel()) {
            this.printLog(mainProcessId, type_log_levels.info, ...args)
        }
    };

    debug = (mainProcessId: string, ...args: any[]) => {
        if (type_log_levels.debug >= this.getLogLevel()) {
            this.printLog(mainProcessId, type_log_levels.debug, ...args)
        }
    };

    trace = (mainProcessId: string, ...args: any[]) => {
        if (type_log_levels.trace >= this.getLogLevel()) {
            this.printLog(mainProcessId, type_log_levels.trace, ...args)
        }
    };

    // LogViewer
    registerLogViewer = (newViewer: type_logViewer) => {
        for (let logViewer of this.getLogViewers()) {
            if (logViewer["displayWindowId"] === newViewer["displayWindowId"] && logViewer["widgetKey"] === newViewer["widgetKey"]) {
                return;
            }
        }
        this.getLogViewers().push(newViewer);
    }

    unregisterLogViewer = (oldViewer: type_logViewer) => {
        for (let ii = 0; ii < this.getLogViewers().length; ii++) {
            const logViewer = this.getLogViewers()[ii];
            if (logViewer["displayWindowId"] === oldViewer["displayWindowId"] && logViewer["widgetKey"] === oldViewer["widgetKey"]) {
                this.getLogViewers().splice(ii, 1);
                return;
            }
        }
    }

    /**
     * Send to renderer process log viewer
     */
    sendToLogViewers = (data: {
        timeMsSinceEpoch: number,
        profileName: string,
        type: type_log_levels,
        args: any[],
    }) => {
        const mainProcesses = this.getMainProcesses()
        if (mainProcesses === undefined) {
            return;
        } else {
            for (let logViewer of this.getLogViewers()) {
                const displayWindowId = logViewer["displayWindowId"];
                const widgetKey = logViewer["widgetKey"];
                const processId = displayWindowId.split("-")[0];
                const mainProcess = mainProcesses.getProcess(processId);
                if (mainProcess !== undefined) {
                    const windowAgentsManager = mainProcess.getWindowAgentsManager();
                    const displayWindowAgent = windowAgentsManager.getAgent(displayWindowId);
                    // do not use "instanceof DisplayWindowAgent", in that case Logs is contaminated by electron API
                    // causing issues in the FileConverter thread 
                    if (displayWindowAgent !== undefined) {
                        // we temporarily disable the log mechanism inside sendFromMainProcess() to 
                        // avoid recursively calling logs.xxx() and sendFromMainProcess() which
                        // causes stack overflow
                        displayWindowAgent.sendFromMainProcess("new-log",
                            {
                                widgetKey: widgetKey,
                                ...data
                            },
                            "temporarily-disable-log-mechanism");
                    }
                }
            }
        }
    }

    // getters
    getMainProcesses = () => {
        return this._mainProcesses;
    }
    getLogViewers = () => {
        return this._logViewers;
    }
    getLogLevel = () => {
        return this._logLevel;
    }
    getLogFile = () => {
        return this._logFile;
    }

    getModeMask = () => {
        return this._modeMask;
    }

    // setters

    setLogLevel = (newLevel: type_log_levels) => {
        this._logLevel = newLevel;
    }
    setLogFile = (fileName: string) => {
        this._logFile = fileName;
    }
    setMainProcesses = (mainProcesses: MainProcesses) => {
        this._mainProcesses = mainProcesses;
    }

    setModeMask = (newMask: number) => {
        this._modeMask = newMask & 7;
    }
}
