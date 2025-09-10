import { MainProcess } from "../mainProcess/MainProcess";
import { WsOpenerServer } from "./WsOpenerServer";
import { Log } from "../log/Log";
import { app } from "electron";
import { IpcManagerOnMainProcesses } from "./IpcManagerOnMainProcesses";
import { WebServer } from "./WebServer";
import { type_sshServerConfig } from "./SshClient";
import { ApplicationMenu } from "./ApplicationMenu";
import { LocalFontsReader } from "../file/LocalFontsReader";
import * as fs from "fs";
import { Profiles } from "../profile/Profiles";
import path from "path";
import { type_args } from "../mainProcess/IpcEventArgType";

/**
 * MainProcesses creates and manages 
 *  - all main processes, 
 *  - the websocket opener server, for opening new process in this TDM instance from external
 *  - the websocket based ipc manager, for communication between main process and renderer process
 *  - profiles, which stores all profiles read from the profiles file
 *  - the http server (if in web mode)
 *  - the log file
 *
 * This is the very first class being created in TDM.
 *
 * @param args command line arguments
 */
export class MainProcesses {

    // all processes
    private _processes: MainProcess[] = [];

    // servers
    // websocket server for opening TDL files in this TDM instance from command line
    private _wsOpenerServer: WsOpenerServer;
    // web server for web mode, in non-web mode, this is undefined
    private _webServer: WebServer | undefined = undefined;

    // ipc manager
    // for communication between main process and renderer process
    private _ipcManager: IpcManagerOnMainProcesses;

    // gui
    // menubar on top of the window or top of the screen, it only shows in desktop mode
    private _applicationMenu: ApplicationMenu;
    // fonts available on the local system
    private _localFontNames: string[] = [];

    // command line args, should not be changed
    private readonly _rawArgs: type_args;

    // profiles
    private readonly _profiles: Profiles;

    // log
    // log stream for writing to file
    private _logStream: undefined | fs.WriteStream = undefined;

    constructor(args: type_args) {
        this._rawArgs = args;

        // websocket opener server
        this._wsOpenerServer = new WsOpenerServer(this, args["attach"], args["flexibleAttach"]);

        // websocket IPC manager
        this._ipcManager = new IpcManagerOnMainProcesses(this);

        // Create a custom menu template
        this._applicationMenu = new ApplicationMenu(this);

        // profiles
        // create an empty first, then read the profiles file and update the profiles
        this._profiles = new Profiles(args["settings"], {});
        this._profiles.createProfiles(args["settings"]);

        // main-process-mode specific initialization
        if (args["mainProcessMode"] === "web") {
            // web server port must be the one that we assigned, if it is not available, quit TDM
            this._webServer = new WebServer(this, args["httpServerPort"]);
        } else if (args["mainProcessMode"] === "desktop") {
            // only show in desktop mode
            this.getApplicationMenu().createApplicationMenu()
        } else if (args["mainProcessMode"] === "ssh-server") {
            // self destruction count down until tcp server heartbeat starts to run
            this.getIpcManager().createSshServer();
        } else {
            throw new Error(`Unrecognized mode ${args["mainProcessMode"]}`);
        }
    }

    /**
     * Remove a MainProcess from the `MainProcess[]` list.
     * 
     * It is part of the MainProcess.quit() operation.
     * 
     * @param processId the ID fo the main process to be removed
     */
    removeProcessFromList = (processId: string) => {
        for (let ii = 0; ii < this.getProcesses().length; ii++) {
            const process = this.getProcesses()[ii];
            if (processId === process.getProcessId()) {
                this.getProcesses().splice(ii, 1);
                return;
            }
        }
    };

    /**
     * Create a MainProcess.
     *
     * In "web" mode, there is only one main process that can be created.
     *
     * @param callback a function to be executed after the main window gui is created. It is not executed in web mode.
     * 
     * @param mainProcessMode the main process mode, "desktop", "web", "ssh-server" or "ssh-client"
     * 
     * @param mainProcessId the ID of the main process, only for `ssh-server` mode. 
     *                      If undefined, it will be automatically assigned.
     * 
     * @param sshServerConfig the ssh server configuration, only used in "ssh-client" mode
     */
    createProcess = (
        callback: ((mainProcess: MainProcess, args: type_args) => any) | undefined = undefined,
        mainProcessMode: "desktop" | "web" | "ssh-server" | "ssh-client" = "desktop",
        mainProcessId?: string | undefined,
        sshServerConfig?: type_sshServerConfig & { callingProcessId: string }
    ) => {
        // there should be only one main process in "web" mode
        if (mainProcessMode === "web") {
            if (this.getProcesses().length >= 1) {
                Log.info('-1', "The web mode only host one process");
                return this.getProcesses()[0];
            }
        }

        // assign process ID
        let processIds: string[] = [];
        for (let ii = 0; ii < this.getProcesses().length; ii++) {
            const process = this.getProcesses()[ii];
            processIds.push(process.getProcessId());
        }
        let newProcessId = "0";
        if (mainProcessId === undefined) {
            // automatically assign
            let maxId = -1;
            for (let existingProcessId of processIds) {
                maxId = Math.max(maxId, parseInt(existingProcessId));
            }
            newProcessId = `${maxId + 1}`;
        } else {
            // todo: id collission, occurs in ssh client mode
            newProcessId = mainProcessId;
        }
        Log.info('-1', `Creating TDM process #${newProcessId} in ${mainProcessMode} mode`);

        this.readLocalFontNames();

        const newProcess = new MainProcess(this, newProcessId, callback, mainProcessMode, sshServerConfig);
        this.getProcesses().push(newProcess);
        return newProcess;
    };


    /**
     * Scan over local fonts and read their names
     * 
     * It first reads that metadata of local fonts, then extract their family names.
     */
    readLocalFontNames = () => {
        // read local fonts
        LocalFontsReader.readLocalFontsMeta().then((fontsMeta: {
            family: string;
            subFamily: string;
            postscriptName: string;
            fontFullFileName: string;
        }[]) => {
            for (let fontMeta of fontsMeta) {
                // const fullFontName = fontMeta["family"] + " " + fontMeta["subFamily"];
                const fullFontName = fontMeta["family"];
                if (fullFontName.startsWith(".")) {
                    continue;
                }
                this.getLocalFontNames().push(fullFontName);
            }
            this.setLocalFontNames([...new Set(this.getLocalFontNames())].sort());
        })
    }


    /**
     * quit the TDM application in both graceful and brutal forces
     */
    quit = () => {
        Log.info("-1", "------------------------ quit main processes ------------------------------");
        // quit Websocket Opener Server
        this.getWsOpenerServer().quit();
        // quit electron
        app.quit();
        // better not be used
        process.exit();
    };

    // ------------------------- log ----------------------------

    /**
     * Get the log file name defined in TDM settings file. The TDM settings file
     * is the only place where the log file name is defined.
     * 
     * The log is started before the user selects the profile to use. 
     * So the log file name must be defined at the level higher than the profile.
     * 
     * @returns the log file name defined in TDM settings file, or "" if not defined or not accessible
     */
    getLogFileName = (): string => {
        // try to read TDM setting first, and make sure it is a legitimate file name
        try {
            const profilesFileName = this.getProfiles().getFilePath();
            const profilesJson = Profiles.readProfilesJsonSync(profilesFileName);

            if (profilesJson === undefined) {
                return "";
            }

            const logFileNameInTdm = profilesJson["For All Profiles"]["Log"]["General Log File"]["value"];
            if (this.verifyLogFile(`${logFileNameInTdm}`)) {
                return logFileNameInTdm;
            }
        } catch (e) {
            // do nothing
        }
        return "";
    }

    /**
     * Verify if the log file is accessible, i.e., it is an absolute path and the directory is writable.
     * 
     * @returns true if the log file is accessible, false otherwise
     */
    private verifyLogFile = (logFile: string): boolean => {

        let ok = path.isAbsolute(logFile) && fs.existsSync(path.dirname(logFile));
        if (ok === false) {
            return false;
        }
        try {
            fs.accessSync(path.dirname(logFile), fs.constants.W_OK)
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Create or replace the log file stream, and override `process.stdout.write` to write to both standard output and the log file.
     * 
     * If the log file is not defined or not accessible, do nothing.
     * 
     * This should be done as early as possible.
     */
    enableLogToFile = () => {
        const logFileName = this.getLogFileName();

        if (logFileName !== "") {
            // continue
        } else {
            Log.info(`Log file is not defined or not accessible. Log will only be shown in standard output.`);
            return;
        }

        const oldLogStream = this.getLogStream();

        const originalStdoutWrite = process.stdout.write.bind(process.stdout);
        try {

            if (oldLogStream instanceof fs.WriteStream) {
                Log.info("Log file changed, close old log stream");
                oldLogStream.close();
            }

            // create a stream writing to file, remove excessive spaces
            const logStream = fs.createWriteStream(logFileName.trim(), { flags: 'a' });

            logStream.on("error", (err: any) => {
                Log.error(err);
                // do nothing
            })
            this.setLogStream(logStream);

            // overriding `process.stdout.write`, so that we can both printout and write to log file
            process.stdout.write = ((chunk: string | Uint8Array, encoding: BufferEncoding, callback: (err: Error | null | undefined) => void): boolean => {
                logStream.write(chunk, encoding, callback); // Write to file
                return originalStdoutWrite(chunk, encoding, callback); // Return boolean
            }) as typeof process.stdout.write;
            Log.info("Log is being written to file", logFileName);
            return;
        } catch (e) {
            Log.error("Error logging to log file", logFileName);
            Log.error(e);
            return;
        }
    }


    // ---------------- getters and setters ----------------------

    getProcesses = () => {
        return this._processes;
    };

    getWsOpenerServer = () => {
        return this._wsOpenerServer;
    };

    getIpcManager = () => {
        return this._ipcManager;
    };


    getWebServer = () => {
        return this._webServer;
    };

    getApplicationMenu = () => {
        return this._applicationMenu;
    }

    /**
     * Get MainProcess by ID
     * 
     * @returns when not found, return undefined; when found, return the MainProcess
     */
    getProcess = (processId: string): MainProcess | undefined => {
        for (let process of this._processes) {
            if (processId === process.getProcessId()) {
                return process;
            }
        }
        return undefined;
    };

    getLocalFontNames = () => {
        return this._localFontNames;
    }

    setLocalFontNames = (fontNames: string[]) => {
        this._localFontNames = fontNames;
    }

    getRawArgs = () => {
        return this._rawArgs;
    }

    getProfiles = () => {
        return this._profiles;
    }

    /**
     * Get site for this TDM 
     * 
     * Since the "site" is never changed, it is safe to directly read from the raw args.
     */
    getSite = () => {
        return this.getRawArgs()["site"];
    }

    /**
     * Get main process mode for this TDM
     * 
     * Since the "mainProcessMode" is never changed for a TDM instance, it is safe to directly read from the raw args.
     */
    getMainProcessMode = () => {
        return this.getRawArgs()["mainProcessMode"];
    }

    getLogStream = () => {
        return this._logStream;
    }

    setLogStream = (logStream: fs.WriteStream | undefined) => {
        this._logStream = logStream;
    }

}

