import { app, Menu } from "electron";
import { WindowAgentsManager } from "../windows/WindowAgentsManager";
import { IpcManagerOnMainProcess } from "./IpcManagerOnMainProcess";
import { ChannelAgentsManager } from "../channel/ChannelAgentsManager";
import { Profile } from "../profile/Profile";
import { WsPvServer } from "./WsPvServer";
// import { MainProcesses } from "../mainProcesses/MainProcesses";
import { Log } from "../log/Log";
import { websocketPvServerPort } from "../global/GlobalVariables";
import { SshClient, type_sshServerConfig } from "./SshClient";
import { CaSnooperServer } from "./CaSnooperServer";
import { CaswServer } from "./CaswServer";
import { Sql } from "../archive/Sql";
import { type_args } from "./IpcEventArgType";
import * as path from "path";
import { EdlFileConverterThread } from "../file/EdlFileConverterThread";
import { WsOpenerServer } from "./WsOpenerServer";
import { WebServer } from "./WebServer";
import { ApplicationMenu } from "./ApplicationMenu";
import { Profiles } from "../profile/Profiles";
import * as fs from "fs";
import { LocalFontsReader } from "../file/LocalFontsReader";
import { openTdlFileAsRequestedByAnotherInstance } from "../global/GlobalMethods";

/**
 * Represents a main process.
 * 
 * Each main process is an independently running TDM environment with 
 *  - main window
 *  - display windows
 *  - channel and PV access management system that bridges the GUI and the CA/PVA client
 *  - websocket PV server for PV read/write via websocket protocol
 *  - CA snooper service
 *  - CA server watcher service
 *  - SQL client for communicating to archive
 *
 * @param mainProcesses The MainProcesses object that manages all main processes
 * 
 * @param processId The id of this MainProcess, it is assigned by MainProcesses, a string of "0", "1", ...
 * 
 * @param callback The callback function after the main window is created
 * 
 * @param mainProcessMode The mode of this main process, it is mostly the same as the mode of MainProcesses, but
 *                        with one more mode: "ssh-client"
 * 
 * @param sshServerConfig The ssh server configuration, only needed in "ssh-server" mode
 *
 */
export class MainProcess {
    // private _mainProcesses: MainProcesses;

    // manages all windows
    private readonly _windowAgentsManager: WindowAgentsManager;

    // manages all channels, including CA, PVA, and virtual channels
    private readonly _channelAgentsManager: ChannelAgentsManager;

    // manages all messages from GUI windows via the MainProcesses websocket IPC channel
    // it does not create or manage the websocket IPC channel, that is done by MainProcesses
    private readonly _ipcManager;

    // a websocket server that can do PV read/write
    private readonly _wsPvServer: WsPvServer;

    // main process id, a string of "0", "1", ...
    // private readonly _processId: string;

    // is is mostly like the main process mode defined in MainProcesses, but
    // with one more mode: "ssh-client"
    private _mainProcessMode: "desktop" | "web" | "ssh-server" | "ssh-client";

    // the ssh client
    private _sshClient: SshClient | undefined = undefined;

    // CA snooper service
    // it listens to the search messages from CA client
    private _caSnooperServer: CaSnooperServer | undefined = undefined;

    // CA server watcher service
    // it listens to the beacon messages from CA server
    private _caswServer: CaswServer | undefined = undefined;

    // SQL client for communicating to archive
    private _sql: Sql | undefined = undefined;

    // EDL file converter thread, may be used for converting EDL files to TDL files
    // private _edlFileConverterThread: Worker | undefined = undefined;

    private _edlFileConverterThread: EdlFileConverterThread = new EdlFileConverterThread(this);

    // servers
    // websocket server for opening TDL files in this TDM instance from command line
    private _wsOpenerServer: WsOpenerServer;
    // web server for web mode, in non-web mode, this is undefined
    private _webServer: WebServer | undefined = undefined;

    // gui
    // menubar on top of the window or top of the screen, it only shows in desktop mode
    private _applicationMenu: ApplicationMenu;
    // fonts available on the local system
    private _localFontNames: string[] = [];

    // command line args, should not be changed
    private readonly _rawArgs: type_args;

    // profiles
    private readonly _profiles: Profiles;

    // log stream for writing to file
    private _logStream: undefined | fs.WriteStream = undefined;

    constructor(
        // mainProcesses: MainProcesses,
        args: type_args,
        // processId: string,
        callback: ((mainProcess: MainProcess, args: type_args) => any) | undefined = undefined,
        mainProcessMode: "web" | "desktop" | "ssh-server" | "ssh-client" = "desktop",
        sshServerConfig?: type_sshServerConfig & { callingProcessId: string }
    ) {

        this._rawArgs = args;
        // websocket opener server
        this._wsOpenerServer = new WsOpenerServer(this, args["attach"], args["flexibleAttach"]);

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
        } else if (args["mainProcessMode"] === "ssh-client") {
        } else {
            throw new Error(`Unrecognized mode ${args["mainProcessMode"]}`);
        }


        // this._mainProcesses = mainProcesses;
        // this._processId = processId;

        // may be different from the mode in MainProcesses if it is "ssh-client"
        this._mainProcessMode = mainProcessMode;

        // it is part of websocket IPC channel in MainProcesses
        // start to "listen" to messages from renderer processes: basically letting the 
        // MainProcesses websocket IPC channel to forward messages to it
        this._ipcManager = new IpcManagerOnMainProcess(this);

        // create a dummy first to silent TypeScript
        // to make it usable, we must createAndInitContext(), this is done
        // after the profile is selected
        this._channelAgentsManager = new ChannelAgentsManager(new Profile("tmp", {}), this);

        // create a websocket server listening to messages for reading/writing PVs
        this._wsPvServer = new WsPvServer(this, websocketPvServerPort);

        // manage all windows
        this._windowAgentsManager = new WindowAgentsManager(this);

        // ignore ssl error
        app.commandLine.appendSwitch("ignore-certificate-errors");
        app.commandLine.appendSwitch("allow-insecure-localhost", "true");

        this.readLocalFontNames();
        this.enableLogToFile();

        // main process mode specific initializations
        // 4 modes: ssh-client, desktop, web, and ssh-server mode
        if (this.getMainProcessMode() === "ssh-client") {
            app.whenReady().then(async () => {
                // create the main window that loads from local, its purpose is to provide
                // a GUI interface for user to input password
                await this.getWindowAgentsManager().createMainWindow();
                // todo:
                // if (sshServerConfig !== undefined) {
                this._sshClient = new SshClient(this, sshServerConfig as any)
                // } else {
                // Log.error(0, "Input for MainProcess constructor error: sshServerConfig cannot be undefined in ssh-client mode");
                // todo: quit
                // }
            })

        } else if (this.getMainProcessMode() === "desktop") {
            /**
             * (1) wait for the app ready, 
             * (2) create main window
             * (3) run the callback function if it is defined
             */
            // (1)
            app.whenReady().then(async () => {
                // (2)
                await this.getWindowAgentsManager().createMainWindow();
                // (3)
                // if the user selected files to be opened
                // todo: eliminate it
                // if (callback !== undefined) {
                //     callback(this, this.getRawArgs());
                // }
                // if (args["attach"] === -1) {
                if (args["fileNames"][0] !== undefined) {
                    openTdlFileAsRequestedByAnotherInstance(args["fileNames"][0], this);
                }
                // }
            })
        } else if (this.getMainProcessMode() === "web") {
            /**
             * (1) wait for the app ready, 
             * (2) find the first profile and set it as the selected profile
             * (3) create and initialize the context
             */
            // (1)
            const firstProfileName = this.getProfiles().getFirstProfileName();
            this.getIpcManager().handleProfileSelected(undefined, {
                selectedProfileName: firstProfileName,
            })
        } else if (this.getMainProcessMode() === "ssh-server") {
            /**
             * (1) wait for the app ready, 
             * (2) create ssh server,  self destruction count down until tcp server heartbeat starts to run
             * (3) create main window, the callback will run after the profile is selected from client side
             */

            // (1)
            app.whenReady().then(async () => {
                // (2)
                console.log("creating ssh server on tdm")
                this.getIpcManager().createSshServer();
                // (3)
                await this.getWindowAgentsManager().createMainWindow();
            })
        } else {
            // no such mode
            Log.error("No such a mode", this.getMainProcessMode(), "Quit ...")
            this.quit();
        }
    }


    createCaSnooperServer = (displayWindowId: string) => {
        const caSnooperServer = this.getCaSnooperServer();
        if (caSnooperServer === undefined) {
            this._caSnooperServer = new CaSnooperServer(this, displayWindowId);
            this._caSnooperServer.createServer();
        } else {
            caSnooperServer.addDisplayWindowId(displayWindowId);
        }
    }

    createCaswServer = (displayWindowId: string) => {
        const caswServer = this.getCaswServer();
        if (caswServer === undefined) {
            this._caswServer = new CaswServer(this, displayWindowId);
            this._caswServer.createServer();
        } else {
            caswServer.addDisplayWindowId(displayWindowId);
        }
    }

    /**
     * Create sql client
     * 
     * todo: use config from file
     */
    createSql = () => {
        const profile = this.getProfiles().getSelectedProfile();
        if (profile !== undefined) {
            const password = profile.getEntry("Archive", "Oracle database password")
            const userName = profile.getEntry("Archive", "Oracle database username");
            const connectionString = profile.getEntry("Archive", "Oracle database connection string");
            if (password !== undefined && userName !== undefined) {
                this.setSql(new Sql({
                    userName: userName,
                    password: password,
                    connectionString: connectionString,
                }));
            } else {
                Log.error(0, "Archive cannot be connected");
            }
        }
    }


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




    // if there is no display window, quit
    quit = () => {
        // ssh server
        if (this.getMainProcessMode() === "ssh-server") {
            this.getIpcManager().getSshServer()?.quit();
        }

        // SshClient
        if (this.getMainProcessMode() === "ssh-client") {
            const sshClient = this.getSshClient();
            if (sshClient !== undefined) {
                sshClient.quit();
            }
        }

        // close all opened windows
        const windowAgentsManager = this.getWindowAgentsManager();
        for (let windowAgent of Object.values(windowAgentsManager.getAgents())) {
            // ! don't ask if we want to save the file in ssh-client mode
            // ! need to be fixed
            if (this.getMainProcessMode() === "ssh-client") {
                // close the window forcefully
                windowAgent.readyToClose = true;
            }
            windowAgent.getBrowserWindow()?.close();
        }

        // CA snooper server
        const caSnooperServer = this.getCaSnooperServer();
        if (caSnooperServer !== undefined) {
            caSnooperServer.stopCaSnooperServer("", true);
        }

        // CASW server
        const caswServer = this.getCaswServer();
        if (caswServer !== undefined) {
            caswServer.stopCaswServer("", true);
        }


        // Sql
        const sql = this.getSql();
        if (sql !== undefined) {
            sql.quit();
        }

        // quit channel access client
        const channelAgentsManager = this.getChannelAgentsManager();
        if (channelAgentsManager !== undefined) {
            const context = channelAgentsManager.getContext();
            if (context !== undefined) {
                context.destroyHard();
            }
        }
        // quit Websocket PV Server
        this.getWsPvServer().quit();
        // remove this MainProcess object
        // this.getMainProcesses().removeProcessFromList(this.getProcessId());
        // if there is no MainProcess running
        // if (this.getMainProcesses().getProcesses().length === 0) {
        //     this.getMainProcesses().quit();
        // }

        /** 
         * ssh-server only has one TDM process
         */
        // if (this.getMainProcessMode() === "ssh-server") {
        //     this.getMainProcesses().quit();
        // }
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




    // ------------------- getters and setters --------------------

    getMainProcessMode = () => {
        return this._mainProcessMode;
    };

    getSshClient = () => {
        return this._sshClient;
    }

    getCaSnooperServer = () => {
        return this._caSnooperServer;
    }

    getCaswServer = () => {
        return this._caswServer;
    }

    getSql = () => {
        return this._sql;
    }

    setSql = (newSql: Sql) => {
        this._sql = newSql;
    }

    getWindowAgentsManager = () => {
        return this._windowAgentsManager;
    };


    getChannelAgentsManager = () => {
        return this._channelAgentsManager;
    };

    getIpcManager = () => {
        return this._ipcManager;
    };

    getWsPvServer = () => {
        return this._wsPvServer;
    };

    // getMainProcesses = () => {
    //     return this._mainProcesses;
    // };

    // getProcessId = () => {
    //     return this._processId;
    // };

    getEdlFileConverterThread = () => {
        return this._edlFileConverterThread;
    }

    setEdlFileConverterThread = (newEdlFileConverterThread: EdlFileConverterThread) => {
        this._edlFileConverterThread = newEdlFileConverterThread;
    }

    getApplicationMenu = () => {
        return this._applicationMenu;
    }

    getLocalFontNames = () => {
        return this._localFontNames;
    }

    setLocalFontNames = (newLocalFontNames: string[]) => {
        this._localFontNames = newLocalFontNames;
    }

    getRawArgs = () => {
        return this._rawArgs;
    }

    setLogStream = (newLogStream: fs.WriteStream) => {
        this._logStream = newLogStream;
    }

    getLogStream = () => {
        return this._logStream;
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

    getWsOpenerServer = () => {
        return this._wsOpenerServer;
    }

    getWebServer = () => {
        return this._webServer;
    }

}
