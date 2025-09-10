import { app, Menu } from "electron";
import { FileReader } from "../file/FileReader";
import { WindowAgentsManager } from "../windows/WindowAgentsManager";
import { Profiles } from "../profile/Profiles";
import { IpcManagerOnMainProcess } from "./IpcManagerOnMainProcess";
import { ChannelAgentsManager } from "../channel/ChannelAgentsManager";
import { Profile } from "../profile/Profile";
import { WsPvServer } from "./WsPvServer";
import { MainProcesses } from "../mainProcesses/MainProcesses";
import { Log } from "../log/Log";
import { websocketPvServerPort } from "../global/GlobalVariables";
import { SshClient, type_sshServerConfig } from "../mainProcesses/SshClient";
import { CaSnooperServer } from "./CaSnooperServer";
import { CaswServer } from "./CaswServer";
import { Sql } from "../archive/Sql";
import * as fs from "fs";
import { Worker } from 'worker_threads';
import { DisplayWindowAgent } from "../windows/DisplayWindow/DisplayWindowAgent";
import { type_args } from "./IpcEventArgType";
const path = require('path');

/**
 * Represents the main process <br>
 *
 */
export class MainProcess {
    private _windowAgentsManager: WindowAgentsManager;
    // dummy to silent TypeScript
    private _channelAgentsManager: ChannelAgentsManager;
    private _ipcManager;
    private _wsPvServer: WsPvServer;
    private readonly _processId: string;
    private _mainProcesses: MainProcesses;
    private _mainProcessMode: "desktop" | "web" | "ssh-server" | "ssh-client";
    private _sshClient: SshClient | undefined = undefined;
    private _caSnooperServer: CaSnooperServer | undefined = undefined;
    private _caswServer: CaswServer | undefined = undefined;
    private _sql: Sql | undefined = undefined;


    /**
     * Config this main process by providing a file containing multiple profiles
     *
     * @param {sring} profilesFileName JSON file name that contains profiles. On local disk or network. <br/>
     *
     * @param {number} processId The id number in MainProcesses object <br/>
     *
     * @param {((mainProcess: MainProcess) => any) | undefined } callback The callback function after the main window is created
     */
    constructor(
        mainProcesses: MainProcesses,
        processId: string,
        callback: ((mainProcess: MainProcess, args: type_args) => any) | undefined = undefined,
        mainProcessMode: "web" | "desktop" | "ssh-server" | "ssh-client" = "desktop",
        sshServerConfig?: type_sshServerConfig & { callingProcessId: string }
    ) {
        this._mainProcesses = mainProcesses;
        this._mainProcessMode = mainProcessMode;
        this._ipcManager = new IpcManagerOnMainProcess(this);
        this._channelAgentsManager = new ChannelAgentsManager(new Profile("tmp", {}), this);
        this._ipcManager.startToListen();
        this._wsPvServer = new WsPvServer(this, websocketPvServerPort);
        this._processId = processId;
        this._windowAgentsManager = new WindowAgentsManager(this);

        // hide menu bar for all renderer windows
        // this.hideMenubar();

        // ignore ssl error
        app.commandLine.appendSwitch("ignore-certificate-errors");
        app.commandLine.appendSwitch("allow-insecure-localhost", "true");

        // 3 modes: ssh-client, desktop, and web
        if (this.getMainProcessMode() === "ssh-client") {
            if (sshServerConfig !== undefined) {
                this.setWindowAgentsManager(this._windowAgentsManager);
                let callingProcessId = sshServerConfig["callingProcessId"];
                this._sshClient = new SshClient(this, sshServerConfig, callingProcessId)
            } else {
                Log.error(this.getProcessId(), "Input for MainProcess constructor error: sshServerConfig cannot be undefined in ssh-client mode");
            }
        } else {
            this.setWindowAgentsManager(this._windowAgentsManager);
            // this.createProfilesFromFile();
            app.whenReady().then(async () => {
                if (this.getMainProcessMode() === "desktop") {
                    await this.getWindowAgentsManager().createMainWindow();
                    if (callback !== undefined) {
                        const rawArgs = this.getMainProcesses().getRawArgs();
                        callback(this, rawArgs);
                    }
                } else if (this.getMainProcessMode() === "web") {
                    // do not open main window in web mode

                    // the 1st, not the 0th, profile should be selected
                    const profiles = this.getMainProcesses().getProfiles();
                    const profileNames = profiles.getProfileNames();
                    let profileName = "";
                    for (const profileNameTmp of profileNames) {
                        if (profileNameTmp !== "For All Profiles") {
                            profileName = profileNameTmp;
                            break;
                        }
                    }

                    // only prepare the server-side stuff: update selected profile name, create Channel Access Context
                    // copied from this.getIpcManager().handleProfileSelected()
                    profiles.setSelectedProfileName(profileName);
                    const selectedProfile = profiles.getSelectedProfile();
                    if (selectedProfile === undefined) {
                        Log.error(this.getProcessId(), `Profile ${profileName} does not exist`);
                        return;
                    }

                    const channelAgentsManager = new ChannelAgentsManager(selectedProfile, this);
                    await channelAgentsManager.createAndInitContext();
                    this.setChannelAgentsManager(channelAgentsManager);
                    Log.debug(this.getProcessId(), "Main process for web mode started. Profile is", profileName);
                } else if (this.getMainProcessMode() === "ssh-server") {
                    await this.getWindowAgentsManager().createMainWindow();
                    // no need to run callback in ssh-server mode, it is about the manually select profile
                }

            });

        }
    }

    // if there is no display window, quit
    quit = () => {
        // ssh server
        if (this.getMainProcessMode() === "ssh-server") {
            this.getMainProcesses().getIpcManager().getSshServer()?.quit();
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
        this.getMainProcesses().removeProcessFromList(this.getProcessId());
        // if there is no MainProcess running
        if (this.getMainProcesses().getProcesses().length === 0) {
            this.getMainProcesses().quit();
        }

        /** 
         * ssh-server only has one TDM process
         */
        if (this.getMainProcessMode() === "ssh-server") {
            this.getMainProcesses().quit();
        }
    };
    
    // ------------------------ windows --------------------------

    getWindowAgentsManager = () => {
        return this._windowAgentsManager;
    };
    setWindowAgentsManager = (newManager: WindowAgentsManager) => {
        this._windowAgentsManager = newManager;
    };

    hideMenubar = () => {
        Menu.setApplicationMenu(Menu.buildFromTemplate([]));
        // Menu.setApplicationMenu(null)
    };

    // ----------------- channels ----------------------------
    getChannelAgentsManager = () => {
        return this._channelAgentsManager;
    };
    setChannelAgentsManager = (newManager: ChannelAgentsManager) => {
        this._channelAgentsManager = newManager;
    };

    getIpcManager = () => {
        return this._ipcManager;
    };

    // ------------------ WebSocket server ------------------

    getWsPvServer = () => {
        return this._wsPvServer;
    };

    // ------------------ thumbnail gallery -----------------
    // ------------------ process Id ------------------------

    getMainProcesses = () => {
        return this._mainProcesses;
    };

    getProcessId = () => {
        return this._processId;
    };
    // ---------------- websocket opener --------------------

    updateWsOpenerPort = (newPort: number) => {
        const mainWindowAgent = this.getWindowAgentsManager().getMainWindowAgent();
        if (mainWindowAgent !== undefined) {
            mainWindowAgent.sendFromMainProcess("update-ws-opener-port",
                {
                    newPort: newPort
                }
            );
        } else {
            Log.error(this.getProcessId(), "Main window agent does not exist");
        }
    };

    // ------------------ DisplayWindow-xx.html file -------------------------

    displayWindowHtmlIndices: number[] = [];

    /**
     * Find an available DisplayWindow-index.html file for the new display window. <br>
     *
     * The reason is Chrome zooms all windows from same origin, that means if we start
     * the display windows from one DisplayWindow.html file, the zoom operation will
     * apply to all display windows. So we generate 500 DisplayWindow-xxx.html files,
     * and load a different html file for each display window. In this way, each
     * display window can be zoomed independently. <br>
     *
     * @returns {string | undefined} The process ID and available display window html file index connected by hypher, e.g. `1-22`.
     */
    obtainDisplayWindowHtmlIndex = (): string => {
        const maxWindowId = this.getMainProcessMode() === "web" ? 100000 : 500;
        for (let ii = 0; ii < maxWindowId; ii++) {
            if (!this.displayWindowHtmlIndices.includes(ii)) {
                this.displayWindowHtmlIndices.push(ii);
                return `${this.getProcessId()}-${ii}`;
            }
        }
        Log.error(
            this.getProcessId(),
            `You have used up indices in DisplayWindow-index.html. There are 500 of them, are you opening 500 display windows?`
        );
        return "";
    };

    // release the display window ID when the window is closed
    // input is a string like "1-22"
    releaseDisplayWindowHtmlIndex = (displayWindowId: string) => {
        const index = this.displayWindowHtmlIndices.indexOf(parseInt(displayWindowId.split("-")[1]));
        if (index !== -1) {
            this.displayWindowHtmlIndices.splice(index, 1);
        } else {
            Log.error(this.getProcessId(), `Display window html file index ${displayWindowId} was not registered, so it cannot be released`);
        }
    };

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
        const profile = this.getMainProcesses().getProfiles().getSelectedProfile();
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
                Log.error(this.getProcessId(), "Archive cannot be connected");
            }
        }
    }

    _edlFileConverterThread: Worker | undefined = undefined;

    getEdlFileConverterThread = () => {
        return this._edlFileConverterThread;
    }

    setEdlFileConverterThread = (newWorker: Worker | undefined) => {
        this._edlFileConverterThread = newWorker;
    }

    stopEdlFileConverterThread = (reason: string = "") => {
        Log.debug(this.getProcessId(), "File converter thread stopped:", reason);
        const worker = this.getEdlFileConverterThread();
        if (worker !== undefined) {
            worker.terminate();
            this.setEdlFileConverterThread(undefined);
        }
    }

    startEdlFileConverterThread = (options: {
        command: "start",
        src: string,
        dest: string,
        depth: number,
        displayWindowId: string,
        widgetKey: string,
    }) => {
        // if there is already a worker thread running, do not start
        let worker = this.getEdlFileConverterThread();
        if (worker !== undefined) {
            const displayWindowAgent = this.getWindowAgentsManager().getAgent(options["displayWindowId"]);
            if (displayWindowAgent instanceof DisplayWindowAgent) {
                displayWindowAgent.sendFromMainProcess("file-converter-command", {
                    type: "all-file-conversion-finished",
                    status: "failed",
                    widgetKey: options["widgetKey"],
                });

                displayWindowAgent.sendFromMainProcess("dialog-show-message-box", {
                    info: {
                        messageType: "error",
                        humanReadableMessages: [`There is already a file converter session running.`, "TDM can only run one file converter at a time"],
                        rawMessages: [],
                    }
                })
            }
            return;
        }

        this.setEdlFileConverterThread(new Worker(path.join(__dirname, '../helpers/EdlFileConverterThread.js'), {
            workerData: options,
            stdout: true, // Ignore stdout
            stderr: true, // Ignore stderr
        }));

        worker = this.getEdlFileConverterThread();
        if (worker === undefined) {
            return;
        }

        // Communicate with the worker
        worker.on('message', (message) => {
            Log.debug(this.getProcessId(), "Received message from file converter thread:", message);
            const displayWindowAgent = this.getWindowAgentsManager().getAgent(options["displayWindowId"]);
            if (!(displayWindowAgent instanceof DisplayWindowAgent)) {
                // the display window is closed, quit the thread
                this.stopEdlFileConverterThread("File Convertr window closed");
                return;
            }
            if (message["type"] === "one-file-conversion-started") {
                // started
                // {
                //     type: "file-conversion-started",
                //     srcFileName: fileAndFolderFullName, 
                //     destFileName: destFileName,
                //     status: "converting",
                // }
                displayWindowAgent.sendFromMainProcess("file-converter-command", { ...message, widgetKey: options["widgetKey"] });
            } else if (message["type"] === "one-file-conversion-finished") {
                // finished one file
                // send to renderer process
                // {
                //     type: "file-conversion-finished",
                //     srcFileName: fileAndFolderFullName, 
                //     destFileName: destFileName,
                //     status: "success",
                //     timeDurationMs: t1 - t0, // ms
                //     numWidgetsOrig: 100, // number of widgets in edl file
                //     numWidgetsTdl: 100, // number of widgets in tdl file
                // }
                displayWindowAgent.sendFromMainProcess("file-converter-command", { ...message, widgetKey: options["widgetKey"] });
            } else if (message["type"] === "all-files-conversion-finished") {
                // successfully finished
                // same as when the thread successfully quits
                this.stopEdlFileConverterThread("All files converted, quit file converter thread");
                displayWindowAgent.sendFromMainProcess("file-converter-command", {
                    type: "all-file-conversion-finished",
                    status: "success",
                    widgetKey: options["widgetKey"],
                });
                displayWindowAgent.sendFromMainProcess("dialog-show-message-box", {
                    info: {
                        messageType: "info",
                        humanReadableMessages: [`All files successfully converted.`],
                        rawMessages: [],
                    }
                })
            } else {
            }
        });

        worker.on('error', (error) => {
            Log.error(this.getProcessId(), 'File converter thread error:', error);
            this.stopEdlFileConverterThread("Error in file converter thread");
            const displayWindowAgent = this.getWindowAgentsManager().getAgent(options["displayWindowId"]);
            if (!(displayWindowAgent instanceof DisplayWindowAgent)) {
                // the display window is closed, quit the thread
                this.stopEdlFileConverterThread("File converter window closed");
                return;
            }
            displayWindowAgent.sendFromMainProcess("file-converter-command", {
                type: "all-file-conversion-finished",
                status: "failed",
                widgetKey: options["widgetKey"],
            });

            displayWindowAgent.sendFromMainProcess("dialog-show-message-box", {
                info: {
                    messageType: "error",
                    humanReadableMessages: [`File converter tool quits unexpectedly.`],
                    rawMessages: [`${error}`],
                }
            })
        });

        worker.on('exit', (code) => {
            const displayWindowAgent = this.getWindowAgentsManager().getAgent(options["displayWindowId"]);
            if (!(displayWindowAgent instanceof DisplayWindowAgent)) {
                // the display window is closed, quit the thread
                this.stopEdlFileConverterThread("File converter window closed");
                return;
            }
            if (code !== 1) {
                // successfully finished
                // same as receving "all-file-conversion-finished" message from thread
                this.stopEdlFileConverterThread("All files converted, quit file converter thread");
                displayWindowAgent.sendFromMainProcess("file-converter-command", {
                    type: "all-file-conversion-finished",
                    status: "success",
                    widgetKey: options["widgetKey"],
                });
                displayWindowAgent.sendFromMainProcess("dialog-show-message-box", {
                    info: {
                        messageType: "info",
                        humanReadableMessages: [`All files successfully converted.`],
                        rawMessages: [],
                    }
                })
            } else {
                // externally terminated, code === 1, i.e. the Stop button is clicked
                this.stopEdlFileConverterThread("User request to quit file converter thread");
                displayWindowAgent.sendFromMainProcess("file-converter-command", {
                    type: "all-file-conversion-finished",
                    status: "failed",
                    widgetKey: options["widgetKey"],
                });
            }
        });

        // Sending a message to the worker
        // worker.postMessage({
        //     command: "start",
        // });
    }
}
