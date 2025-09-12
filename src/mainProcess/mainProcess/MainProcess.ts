import { app, Menu } from "electron";
import { WindowAgentsManager } from "../windows/WindowAgentsManager";
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
import { Worker } from 'worker_threads';
import { DisplayWindowAgent } from "../windows/DisplayWindow/DisplayWindowAgent";
import { type_args } from "./IpcEventArgType";
import * as path from "path";
import { EdlFileConverterThread } from "../file/EdlFileConverterThread";

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
    private _mainProcesses: MainProcesses;

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
    private readonly _processId: string;

    // is is mostly like the main process mode defined in MainProcesses, but
    // with one more mode: "ssh-client"
    private _mainProcessMode: "desktop" | "web" | "ssh-server" | "ssh-client";

    // the ssh client
    private _sshClient: SshClient | undefined = undefined;

    // CA snooper service
    // it listens to the search messages from CA client
    // todo: make it permanent
    private _caSnooperServer: CaSnooperServer | undefined = undefined;

    // CA server watcher service
    // it listens to the beacon messages from CA server
    // todo: make it permanent
    private _caswServer: CaswServer | undefined = undefined;

    // SQL client for communicating to archive
    private _sql: Sql | undefined = undefined;

    // EDL file converter thread, may be used for converting EDL files to TDL files
    // private _edlFileConverterThread: Worker | undefined = undefined;

    private _edlFileConverterThread: EdlFileConverterThread = new EdlFileConverterThread(this);

    constructor(
        mainProcesses: MainProcesses,
        processId: string,
        callback: ((mainProcess: MainProcess, args: type_args) => any) | undefined = undefined,
        mainProcessMode: "web" | "desktop" | "ssh-server" | "ssh-client" = "desktop",
        sshServerConfig?: type_sshServerConfig & { callingProcessId: string }
    ) {
        this._mainProcesses = mainProcesses;
        this._processId = processId;

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

        // main process mode specific initializations
        // 4 modes: ssh-client, desktop, web, and ssh-server mode
        /**
         * todo: more test and optimize
         */
        if (this.getMainProcessMode() === "ssh-client") {
            if (sshServerConfig !== undefined) {
                let callingProcessId = sshServerConfig["callingProcessId"];
                this._sshClient = new SshClient(this, sshServerConfig, callingProcessId)
            } else {
                Log.error(this.getProcessId(), "Input for MainProcess constructor error: sshServerConfig cannot be undefined in ssh-client mode");
            }
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
                // todo: eliminate it
                if (callback !== undefined) {
                    callback(this, this.getMainProcesses().getRawArgs());
                }
            })
        } if (this.getMainProcessMode() === "web") {
            /**
             * (1) wait for the app ready, 
             * (2) find the first profile and set it as the selected profile
             * (3) create and initialize the context
             */
            // (1)
            app.whenReady().then(async () => {
                // (2)
                const profiles = this.getMainProcesses().getProfiles();
                const firstProfile = profiles.getFirstProfile();
                if (firstProfile === undefined) {
                    Log.error(this.getProcessId(), "No profile is defined, cannot start TDM in web mode");
                    app.quit();
                    return;
                }
                profiles.setSelectedProfileName(firstProfile.getName());
                // (3)
                await this.getChannelAgentsManager().createAndInitContext();
                Log.info(this.getProcessId(), "Main process for web mode started. Profile is", firstProfile.getName());
            })
        } else if (this.getMainProcessMode() === "ssh-server") {
            /**
             * (1) wait for the app ready, 
             * (2) create main window, the callback will run after the profile is selected from client side
             */
            // (1)
            app.whenReady().then(async () => {
                // (2)
                await this.getWindowAgentsManager().createMainWindow();
            })
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

    getMainProcesses = () => {
        return this._mainProcesses;
    };

    getProcessId = () => {
        return this._processId;
    };

    getEdlFileConverterThread = () => {
        return this._edlFileConverterThread;
    }

    setEdlFileConverterThread = (newEdlFileConverterThread: EdlFileConverterThread) => {
        this._edlFileConverterThread = newEdlFileConverterThread;
    }

}
