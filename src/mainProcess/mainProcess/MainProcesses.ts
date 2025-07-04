import { MainProcess } from "./MainProcess";
import { WsOpenerServer } from "../wsOpener/WsOpenerServer";
import { type_args } from "../arg/ArgParser";
import { sshTcpServerPort, httpServerPort } from "../global/GlobalVariables";
import { Log } from "../log/Log";
import { app, BrowserWindow, Menu } from "electron";
import { IpcManagerOnMainProcesses } from "./IpcManagerOnMainProcesses";
import { websocketIpcServerPort, websocketOpenerServerPort } from "../global/GlobalVariables";
import { HttpServer } from "./HttpServer";
import { type_sshServerConfig } from "./SshClient";
import { ApplicationMenu } from "./ApplicationMenu";
import { LocalFontsReader } from "../file/LocalFontsReader";
import * as fs from "fs";
import { Profiles } from "../profile/Profiles";
import { FileReader } from "../file/FileReader";
import path from "path";

export class MainProcesses {
    _processes: MainProcess[] = [];
    readonly _profilesFileName: string;
    _wsOpenerServer: WsOpenerServer;
    _ipcManager: IpcManagerOnMainProcesses;
    _httpServer: HttpServer | undefined = undefined;
    _applicationMenu: ApplicationMenu;
    _localFontNames: string[] = [];
    _sshServerSelfDestructionCountDown: NodeJS.Timeout | undefined = undefined;
    readonly _site: string;

    writingToLog: string = "";
    logStream: undefined | fs.WriteStream = undefined;

    constructor(args: type_args) {
        this._site = args["site"];
        this._profilesFileName = args["settings"];
        // if this profile is not found, show profile-selection page
        // 9527 is the starting port for opener server, if this port is being used, increase it until there is an available one
        this._wsOpenerServer = new WsOpenerServer(this, websocketOpenerServerPort);
        // menubar on top of the window or top of the screen
        this._applicationMenu = new ApplicationMenu(this);

        // unlike above websocket ports which are dynamically assigned, the http server port is static
        if (args["mainProcessMode"] === "web") {
            // this port is not dynamically assigned, if this port is not available, quit
            let port = args["httpServerPort"];
            if (typeof port !== "number") {
                port = httpServerPort; // default 3000
            }
            this._httpServer = new HttpServer(this, port);
            this._httpServer.createServer();

            // in web mode, the websocket (wss://) server port must be the same as the https port
            const websocketIpcServerPort = port;
            this._ipcManager = new IpcManagerOnMainProcesses(this, websocketIpcServerPort, this._httpServer.getHttpsServer());

        } else if (args["mainProcessMode"] === "desktop") {
            this._ipcManager = new IpcManagerOnMainProcesses(this, websocketIpcServerPort);
            // Create a custom menu template
            this.getApplicationMenu().createApplicationMenu()
        } else if (args["mainProcessMode"] === "ssh-server") {
            this._ipcManager = new IpcManagerOnMainProcesses(this, websocketIpcServerPort);
            // self destruction count down until tcp server heartbeat starts to run
            this.startSshServerSelfDestructionCountDown();
            this.getIpcManager().createSshServer();
            // if this port is occupied, use the next available one
            // it will retry 100 times
            this.getIpcManager().getSshServer()?.createTcpServer(sshTcpServerPort);
        } else {
            throw new Error(`Unrecognized mode ${args["mainProcessMode"]}`);
        }
    }

    quit = () => {
        Log.debug("-1", "------------------------ quit main processes ------------------------------");
        // quit Websocket Opener Server
        this.getWsOpenerServer().quit();
        // quit electron
        app.quit();
        // better not be used
        process.exit();
    };
    removeProcess = (processId: string) => {
        for (let ii = 0; ii < this.getProcesses().length; ii++) {
            const process = this.getProcesses()[ii];
            if (processId === process.getProcessId()) {
                this.getProcesses().splice(ii, 1);
                return;
            }
        }
    };

    /**
     * Create a MainProcess. <br>
     *
     * In "web" mode, there is only one main process that can be created.
     *
     * The callback function is executed after the main window gui is created. <br>
     *
     * The callback is not invoked in web mode <br>
     */
    createProcess = (
        callback: ((mainProcess: MainProcess) => any) | undefined = undefined,
        mainProcessMode: "desktop" | "web" | "ssh-server" | "ssh-client" = "desktop",
        mainProcessId: string | undefined = undefined,
        sshServerConfig?: type_sshServerConfig & { callingProcessId: string }
    ) => {
        // there should be only one main process in "web" mode
        if (mainProcessMode === "web") {
            if (this.getProcesses().length >= 1) {
                Log.info('-1', "The web mode only host one process");
                return this.getProcesses()[0];
            }
        }

        // process ID
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
            // todo: id collission
            newProcessId = mainProcessId;
        }
        Log.info('-1', `Creating TDM process #${newProcessId} in ${mainProcessMode} mode`);

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
                this._localFontNames.push(fullFontName);
            }
            this._localFontNames = [...new Set(this._localFontNames)].sort();
        })

        const newProcess = new MainProcess(this, newProcessId, this.getProfilesFileName(), callback, mainProcessMode, sshServerConfig);
        this.getProcesses().push(newProcess);
        return newProcess;
    };

    // getters

    getProcesses = () => {
        return this._processes;
    };

    getProfilesFileName = () => {
        return this._profilesFileName;
    };

    getWsOpenerServer = () => {
        return this._wsOpenerServer;
    };

    getProcess = (processId: string): MainProcess | undefined => {
        for (let process of this._processes) {
            if (processId === process.getProcessId()) {
                return process;
            }
        }
        return undefined;
    };

    getIpcManager = () => {
        return this._ipcManager;
    };

    getHttpServer = () => {
        return this._httpServer;
    };

    getApplicationMenu = () => {
        return this._applicationMenu;
    }

    getLocalFontNames = () => {
        return this._localFontNames;
    }
    startSshServerSelfDestructionCountDown = () => {
        // self destruct after 15 seconds unless it is cleared by http 
        this._sshServerSelfDestructionCountDown = setTimeout(() => {
            this.quit();
        }, 15 * 1000);
    }
    clearSshServerSelfDestructionCountDown = () => {
        clearTimeout(this._sshServerSelfDestructionCountDown);
    }

    /**
     * For web mode reading the profiles file content
     */
    readProfilesJsonFromFileSync = (): Record<string, any> => {
        // test if file exists
        const filePath = this._profilesFileName;
        const fileExists = fs.existsSync(filePath);
        if (fileExists) {
            try {
                // (1)
                let profilesFileContents: Record<string, any> = FileReader.readJSONsync(filePath, false);
                // throws an exception, re-throw below
                Profiles.validateProfiles(profilesFileContents);
                return profilesFileContents
            } catch (e) {
                // (2)
                throw new Error("This is not a valid profiles file");
            }
        } else {
            throw new Error("Profiles file does not exist.");
        }
    };

    // ------------------------- log ----------------------------

    readLogFileName = (): string => {

        // try to read TDM setting first, and make sure it is a legitimate file name
        try {
            const profilesFileContents = this.readProfilesJsonFromFileSync();

            const logFileNameInTdm = profilesFileContents["For All Profiles"]["Log"]["General Log File"]["value"];
            if (this.logFileOkToUse(`${logFileNameInTdm}`)) {
                return logFileNameInTdm;
            }
        } catch (e) {
            // do nothing
        }

        // // try to read system settings
        // try {
        //     const logFileNameInOs = process.env["TDM_LOG"];
        //     if (this.logFileOkToUse(`${logFileNameInOs}`)) {
        //         return `${logFileNameInOs}`;
        //     }
        // } catch(e) {
        //     // do nothing
        // }

        return "";

    }

    private logFileOkToUse = (logFile: string): boolean => {

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
     * The log is written to TDM_LOG system environment by default. If the "Log file" is defined
     * in the profile, it will write to this file after the profile is started.
     * 
     * Write log to the log file if it is accessible.
     * 
     * This should be done as early as possible.
     */
    enableLogToFile = () => {
        const logFile = this.readLogFileName();

        // no change
        if (logFile === this.writingToLog && this.writingToLog !== "")  {
            return;
        }

        if (logFile !== "") {
            // continue
        } else {
            Log.info("Log file is not accessible. Log will only be shown in standard output.");
            this.writingToLog = "";
            return;
        }

        const oldLogStream = this.logStream;

        const originalStdoutWrite = process.stdout.write.bind(process.stdout);
        try {
            
            if (oldLogStream instanceof fs.WriteStream) {
                Log.info("Log file changed, close old log stream");
                oldLogStream.close();
            }

            // create a stream writing to file, remove excessive spaces
            const logStream = fs.createWriteStream(logFile.trim(), { flags: 'a' });
            
            logStream.on("error", (err: any) => {
                Log.error(err);
                // do nothing
            })
            this.logStream = logStream;

            // overriding `process.stdout.write`, so that we can both printout and write to log file
            process.stdout.write = ((chunk: string | Uint8Array, encoding: BufferEncoding, callback: (err: Error | null | undefined) => void): boolean => {
                logStream.write(chunk, encoding, callback); // Write to file
                return originalStdoutWrite(chunk, encoding, callback); // Return boolean
            }) as typeof process.stdout.write;
            this.writingToLog = logFile;
            Log.info("Log is being written to file", logFile);
            return;
        } catch (e) {
            Log.error("Error logging to log file", logFile);
            Log.error(e);
            this.writingToLog = "";
            return;
        }
    }

    getSite = () => {
        return this._site;
    }

}

