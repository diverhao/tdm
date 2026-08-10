import { app } from "electron";
import { WindowAgentsManager } from "../windows/WindowAgentsManager";
import { IpcManagerOnMainProcess } from "./IpcManagerOnMainProcess";
import { ChannelAgentsManager } from "../channel/ChannelAgentsManager";
import { Profile } from "../profile/Profile";
import { WsPvServer } from "./WsPvServer";
// import { MainProcesses } from "../mainProcesses/MainProcesses";
import { Log } from "../../common/Log";
import { websocketPvServerPort } from "../global/GlobalVariables";
import { CaSnooperServer } from "./CaSnooperServer";
import { CaswServer } from "./CaswServer";
import { Sql } from "../archive/Sql";
import { IpcEventArgType, type_args } from "../../common/IpcEventArgType";
import * as path from "path";
import { EdlFileConverterThread } from "../file/EdlFileConverterThread";
import { WsOpenerServer } from "./WsOpenerServer";
import { WebServer } from "./WebServer";
import { ApplicationMenu } from "./ApplicationMenu";
import { Profiles } from "../profile/Profiles";
import * as fs from "fs";
import { LocalFontsReader } from "../file/LocalFontsReader";
import { openTdlFileAsRequestedByAnotherInstance } from "../global/GlobalMethods";
import { spawn } from "child_process";
import pidusage from "pidusage";
import { DisplayWindowAgent } from "../windows/DisplayWindow/DisplayWindowAgent";
import { MainWindowAgent } from "../windows/MainWindow/MainWindowAgent";
import { SymbolGallery } from "./SymbolGallery";
import { Rpc } from "./Rpc";
import { ArchiverAppliances } from "../archive/ArchiverAppliances";
import { type_MainProcessMode } from "../../common/types/type_widget_tdl";
import { Macros } from "../../common/Macros";

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
    private _mainProcessMode: type_MainProcessMode;

    // CA snooper service
    // it listens to the search messages from CA client
    private _caSnooperServer: CaSnooperServer | undefined = undefined;

    // CA server watcher service
    // it listens to the beacon messages from CA server
    private _caswServer: CaswServer | undefined = undefined;

    // SQL client for communicating to archive
    private _sql: Sql | undefined = undefined;

    private _archiverAppliances: ArchiverAppliances = new ArchiverAppliances([]);


    // EDL file converter thread, may be used for converting EDL files to TDL files
    // private _edlFileConverterThread: Worker | undefined = undefined;

    private _edlFileConverterThread: EdlFileConverterThread = new EdlFileConverterThread(this);

    // servers
    // websocket server for opening TDL files in this TDM instance from command line
    private _wsOpenerServer: WsOpenerServer;
    // web server for web mode, in non-web mode, this is undefined
    private _webServer: WebServer | undefined = undefined;

    // fonts available on the local system
    private _localFontNames: string[] = [];

    // command line args, should not be changed
    private readonly _rawArgs: type_args;

    // profiles
    private _profiles: Profiles;

    // symbol gallery cache and request handling
    private readonly _symbolGallery: SymbolGallery;

    // rpc handlers owned by this main process
    private readonly _rpc: Rpc;

    // log stream for writing to file
    private _logStream: undefined | fs.WriteStream = undefined;

    // we are connecting to ssh
    private _connectingToSsh: boolean = false;

    constructor(
        // mainProcesses: MainProcesses,
        args: type_args,
        // processId: string,
        callback: ((mainProcess: MainProcess, args: type_args) => any) | undefined = undefined,
        mainProcessMode: type_MainProcessMode = "desktop",
    ) {

        this._rawArgs = args;
        // websocket opener server
        this._wsOpenerServer = new WsOpenerServer(this, args["attach"], args["flexibleAttach"]);


        // profiles
        // create an empty first, then read the profiles file and update the profiles
        this._profiles = new Profiles(args["settings"], {});
        this._profiles.createProfiles(args["settings"]);
        this._symbolGallery = new SymbolGallery(this);
        this._rpc = new Rpc(this);

        // main-process-mode specific initialization
        if (args["mainProcessMode"] === "web") {
            // web server port must be the one that we assigned, if it is not available, quit TDM
            const basePath = args["httpServerBasePath"];
            this._webServer = new WebServer(this, args["httpServerPort"], basePath);
        } else if (args["mainProcessMode"] === "desktop") {
            // only show in desktop mode
            // Create a custom menu template
            // menubar on top of the window or top of the screen, it only shows in desktop mode
            const applicationMenu = new ApplicationMenu(this);
            applicationMenu.createApplicationMenu()
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
        if (this.getMainProcessMode() === "desktop") {
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
            this.getIpcManager().handleProfileSelected("", {
                selectedProfileName: firstProfileName,
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
                Log.error("Archive cannot be connected");
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
        // close all opened windows
        const windowAgentsManager = this.getWindowAgentsManager();
        for (let windowAgent of Object.values(windowAgentsManager.getAgents())) {
            // ! don't ask if we want to save the file in ssh-client mode
            // ! need to be fixed
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
            Log.error(e);
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

    /**
     * 
     * Start a new detached TDM process using the current executable and arguments.
     *
     * The child process is launched with ignored stdio and unreferenced so it can
     * continue running independently of the current process.
     */
    spawnNewTdmProcess = () => {
        const args = process.argv;

        const newProcess = spawn(args[0], args.slice(1), {
            detached: true,    // Key option for detachment
            stdio: 'ignore',   // Important: detach from parent's stdio
        });

        // Unref the child process to allow parent to exit independently
        newProcess.unref();
        Log.info("Creating a new TDM instance with args:", args);
    };

    /**
     * Requests this TDM process to quit.
     * 
     * This request is only initiated from main window.
     *
     * In `ssh-client` mode this is handled by the remote ssh server, so no local
     * action is taken. When `confirmToQuit` is `true`, the process quits
     * immediately. Otherwise, this checks for modified display windows and shows
     * a confirmation dialog before quitting when needed.
     *
     * @param confirmToQuit Whether the user has already confirmed that the
     * process should quit.
     */
    requestQuitTdmProcess = (confirmToQuit: boolean) => {

        const mainProcessMode = this.getMainProcessMode();

        // we have confirmed in the message box to quit
        if (confirmToQuit === true) {
            this.quit()
            return;
        }

        // check if there is any modified windows
        const windowAgentsManager = this.getWindowAgentsManager();
        const mainWindowAgent = windowAgentsManager.getMainWindowAgent();
        if (mainWindowAgent === undefined) {
            return;
        }
        const modifiedDisplayWindows = windowAgentsManager.getModifiedDisplayWindows();
        if (modifiedDisplayWindows.length > 0) {
            let message = `${modifiedDisplayWindows.length === 1 ? "This" : "These"} display window${modifiedDisplayWindows.length === 1 ? "" : "s"}s ${modifiedDisplayWindows.length === 1 ? "is" : "are"} modified\n`;
            for (let windowName of modifiedDisplayWindows) {
                message = message + "\n" + windowName + "\n";
            }
            message = message + "\n" + `Do you want to continue to exit?`;
            mainWindowAgent.sendFromMainProcess("dialog-show-message-box", {
                info: {
                    // the callback fro buttons is added according to the command
                    command: "quit-tdm-process-confirm",
                    messageType: "warning",
                    humanReadableMessages: [message],
                    rawMessages: [],
                    buttons: [
                        {
                            text: "OK",
                        },
                        {
                            text: "Cancel",
                        }
                    ]
                }
            });
            return;
        } else {
            this.quit()
        }
    }


    getRuntimeInfo = async (data: IpcEventArgType["processes-info"]) => {
        const processesInfo: {
            "Type": string;
            "Window ID": string;
            "Visible": string;
            "TDL file name": string;
            "Window name": string;
            "Editable": string;
            "Uptime [second]": number;
            "Process ID": number;
            "CPU usage [%]": number;
            "Memory usage [MB]": number;
            "Thumbnail": string;
            "Script": string;
            "Script PID": string;
        }[] = [];

        /**
         * the CPU usage for the process in electron.js is not correct
         * 
         * the memory usage given in electron.js process API is the compressed memory. 
         * at least in macos, the memory usage given by pidUsage is uncompressed, which is more than twice the size of compressed memory.
         * the pidUsage's memroy is consistent with ps and htop. So we choose to use its result.
         * 
         * uptime in both electron process API and pidUsage is correct
         * 
         * Conclusion: use pidUsage in both main and renderer processes for consistency
         */
        const mainProcessUsage = await new Promise<{
            "CPU usage [%]": number,
            "Memory usage [MB]": number,
            "Uptime [s]": number,
        }>((resolve, reject) => {
            pidusage(process.pid, (err: any, stats: any) => {
                if (err) {
                    resolve({
                        "CPU usage [%]": -1,
                        "Memory usage [MB]": -1,
                        "Uptime [s]": -1,
                    });
                } else {
                    resolve({
                        "CPU usage [%]": stats["cpu"],
                        "Memory usage [MB]": Math.round(stats["memory"] / 1024 / 1024),
                        "Uptime [s]": Math.round(stats["elapsed"] / 1000),
                    })
                }
            })
        })

        const mainProcessInfo = {
            "Type": "Main Process",
            "Window ID": "Not available",
            "Visible": "No",
            "TDL file name": "Not available",
            "Window name": "Not available",
            "Editable": "No",
            "Uptime [second]": mainProcessUsage["Uptime [s]"],
            "Process ID": process.pid,
            "CPU usage [%]": mainProcessUsage["CPU usage [%]"],
            "Memory usage [MB]": mainProcessUsage["Memory usage [MB]"],
            "Thumbnail": "",
            "Script": "",
            "Script PID": "N/A",
        }

        processesInfo.push(mainProcessInfo);

        // get display windows info
        for (let windowAgent of Object.values(this.getWindowAgentsManager().getAgents())) {
            if ((windowAgent instanceof DisplayWindowAgent) || (windowAgent instanceof MainWindowAgent)) {
                const processInfo = await windowAgent.getProcessInfo(data["withThumbnail"]);
                processesInfo.push(processInfo);
            }
        }

        return processesInfo;

    }



    /**
     * Invoked upon the profile is selected. <br>
     *
     * In desktop mode, this method is invoked by "profile-selected" event. In web mode, this method is invoked by
     * /command/profile-selected POST request.
     * 
     * The profile may be a local profile or a ssh configuration <br>
     *
     * (1) set the selected profile name in Profiles object <br>
     *
     * (2) create ChannelAgentsManger and CA Context according to the selected profile info, set the channel agent manager variable in main process object <br>
     *
     * (3) open default display windows in this profile <br>
     *
     * (4) create preloaded display window and preloaded embedded display <br>
     *
     * (4) refresh main window contents to run mode
     *
     * @param {string} selectedProfileName The profile name
     *
     * @param {string} args The command line arguments. We can select the profile from command line.
     */
    initializeFromProfile = async (profileName: string, args: type_args | undefined): Promise<any> => {

        const mainProcess = this;
        const mainProcessMode = mainProcess.getMainProcessMode();
        const profiles = mainProcess.getProfiles();
        const windowAgentsManager = mainProcess.getWindowAgentsManager();

        profiles.setSelectedProfileName(profileName);
        const selectedProfile = profiles.getSelectedProfile();
        if (selectedProfile === undefined) {
            return;
        }
        Log.info("Main process for", mainProcessMode, "mode started. Profile is", profileName);


        if (mainProcessMode === "web") {
            // create epcis-tca CA and PVA context
            // do not open default wind
            await mainProcess.getChannelAgentsManager().createAndInitContext();
        } else if (mainProcessMode === "desktop") {

            /**
             * (1) create epics-tca CA and PVA context 
             * 
             * (2) create SQL
             * 
             * (3) open default TDL files
             * 
             * (4) prepare main window, i.e. change title, telling main window to switch to run mode, etc
             */

            // (1)
            await this.getChannelAgentsManager().createAndInitContext();
            // (2)
            this.createSql();

            const aaAddresses = selectedProfile.getEntry("EPICS Custom Environment", "Archiver Appliance Retrieval Address");
            if (Array.isArray(aaAddresses)) {
                this._archiverAppliances = new ArchiverAppliances(aaAddresses);
            }

            // (3)
            let tdlFileNames: string[] = selectedProfile.getEntry("EPICS Custom Environment", "Default TDL Files");
            let macros = selectedProfile.getMacros();
            let currentTdlFolder: undefined | string = undefined;
            if (args !== undefined) {
                currentTdlFolder = args["cwd"] === "" ? undefined : args["cwd"];
                if (args["alsoOpenDefaults"]) {
                    tdlFileNames.push(...args["fileNames"]);
                } else {
                    tdlFileNames = args["fileNames"];
                }

                // args["macros"] overrides profile-defined macros
                // macros = refineMacros([...args["macros"], ...macros]);
                macros = Macros.fromMacros(new Macros(args["macros"]), new Macros(macros)).getArr();
            }

            const mode = selectedProfile.getMode() as "editing" | "operating";
            const editable = selectedProfile.getEditable();
            windowAgentsManager.createDisplayWindows(tdlFileNames, mode, editable, macros, currentTdlFolder, undefined);


            /**
             * (4) For Main Window in desktop mode:
             * 
             * (a) wait for the main window URL to be loaded
             *     the event is emitted when the .loadURL() is done when creating the BrowserWindow in MainWindowAgent
             * 
             * (b) wait for the main window's websocket IPC established
             *     the event is emitted when the websocket-ipc-connected is received in main process from main window
             * 
             * (c) change main window title with selected profile name
             * 
             * (d) tell main window to switch to run mode by sending "after-profile-selected" to main window
             * 
             * (e) create preview Display Window for File Browser, it is an invisible Display Window dedicated
             *     for the File Browser utility window
             */
            const mainWindowAgent = windowAgentsManager.getMainWindowAgent();
            if (mainWindowAgent instanceof MainWindowAgent) {
                // (a)
                await mainWindowAgent.loadURLPromise;
                // (b)
                await mainWindowAgent.getMainWindowLifeCycleManager().websocketIpcConnectedPromise;
                // (c)
                const oldTitle = mainWindowAgent.getTitle();
                const newTitle = oldTitle + " -- " + profileName;
                mainWindowAgent.setTitle(newTitle);
                // (d)
                mainWindowAgent.sendFromMainProcess("after-profile-selected", {
                    profileName: profileName,
                });
                // (e)
                windowAgentsManager.createPreviewDisplayWindow();
            } else {
                Log.error("Main window agent does not exist");
            }
        } else {
            Log.error("No such mode", mainProcessMode);
        }
    }


    // ------------------- getters and setters --------------------

    getMainProcessMode = () => {
        return this._mainProcessMode;
    };

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

    getRpc = () => {
        return this._rpc;
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

    setProfiles = (newProfiles: Profiles) => {
        this._profiles = newProfiles;
    }

    getSymbolGallery = () => {
        return this._symbolGallery;
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

    isConnectingToSsh = () => {
        return this._connectingToSsh;
    }

    setConnectingToSsh = (newStatus: boolean) => {
        this._connectingToSsh = newStatus;
    }

    getArchiverAppliances = () => {
        return this._archiverAppliances;
    }
}
