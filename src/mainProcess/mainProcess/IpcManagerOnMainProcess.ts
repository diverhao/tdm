import { dialog } from "electron";
import { BrowserView, BrowserWindow } from "electron";
import { MainProcess } from "../mainProcess/MainProcess";
import { Profiles } from "../profile/Profiles";
import { ChannelAgentsManager } from "../channel/ChannelAgentsManager";
import { type_options_createDisplayWindow } from "../windows/WindowAgentsManager";
import * as fs from "fs";
import { DisplayWindowAgent } from "../windows/DisplayWindow/DisplayWindowAgent";
import { FileReader } from "../file/FileReader";
import path from "path";
import { Log } from "../log/Log";
import { type_sshServerConfig } from "../mainProcesses/SshClient";
import * as os from "os";
import { MainWindowAgent } from "../windows/MainWindow/MainWindowAgent";
import pidusage from "pidusage";
import { spawn } from "child_process";
import { SqlState } from "../archive/Sql";
import { Environment, type_network_stats } from "epics-tca";
import { IpcEventArgType, type_DialogMessageBox } from "./IpcEventArgType";
import { generateKeyAndCert } from "../global/GlobalMethods";
import { SshServer } from "../mainProcesses/SshServer";
import https from "https";
import { WebSocketServer, WebSocket, RawData } from "ws";
import { IncomingMessage } from "http";

/**
 * Manage IPC messages sent from renderer process.
 * 
 * It contains all the listener callbacks for all the events from renderer process, i.e. sendFromRendererProcess('event-name', option: {...})
 */
export class IpcManagerOnMainProcess {
    private _mainProcess: MainProcess;
    private _wsServer: WebSocketServer | undefined;
    private _port: number = 4000 + Math.floor(Math.random() * 1000);
    private _sshServer: SshServer | undefined = undefined;
    private keyAndCert = generateKeyAndCert();
    private clients: Record<string, WebSocket | string> = {};

    constructor(mainProcess: MainProcess) {
        this._mainProcess = mainProcess;
        this.createWsServer();
        this.startToListen();
    }


    /**
     * Create the secure websocket server. This websocket is attached to a https server.
     */
    createWsServer = () => {
        Log.info('-1', `Creating WebSocket IPC server on port ${this.getPort()}`);

        // create a https server for the websocket server to attach to
        const httpsServer = https.createServer({
            key: this.keyAndCert.private,
            cert: this.keyAndCert.cert
        });
        this._wsServer = new WebSocketServer({ server: httpsServer });

        // listen to localhost ipv4 only
        httpsServer.listen(this.getPort(), "127.0.0.1", () => {
            Log.info('-1', `IPC: WebSocket server is listening on port ${this.getPort()}`);
        });

        /**
         * if the port is occupied, try the next port
         */
        this._wsServer.on("error", (err: Error) => {
            if (err["message"].includes("EADDRINUSE")) {
                Log.info('-1', `IPC: Port ${this.getPort()} is occupied, try port ${this.getPort() + 1} for websocket IPC server`);
                httpsServer.close();
                let newPort = this.getPort() + 1;
                this.setPort(newPort);
                this.createWsServer();
            }
        });

        /**
         * listen to connection from renderer process, each wsClient is a renderer window
         * 
         * the renderer process will try to connect this websocket server when the display window becomes operating mode
         */
        this._wsServer.on("connection", (wsClient: WebSocket, request: IncomingMessage) => {
            Log.info('-1', `WebSocket IPC Server got a connection from ${request.socket.remoteAddress}:${request.socket.remotePort}`);

            wsClient.on("message", (messageBuffer: RawData) => {
                const message = JSON.parse(messageBuffer.toString(),
                    (key, value) =>
                        value === null ? undefined : value
                );
                Log.debug("-1", "IPC websocket server received message", message);
                this.handleMessage(wsClient, message);
            });

            wsClient.on("error", (err: Error) => {
                Log.error("-1", "WebSocket IPC client got an error", err)
                Log.error("-1", "close connection (as well as the renderer process window)");
                // same as "close" event below
                const index = Object.values(this.getClients()).indexOf(wsClient);
                if (index !== -1) {
                    const id = Object.keys(this.getClients())[index];
                    const processId = id.split("-")[0];
                    if (typeof processId === "string") {
                        const mainProcess = this.getMainProcess();
                        if (mainProcess instanceof MainProcess) {
                            const mainProcessMode = mainProcess.getMainProcessMode();
                            const windowAgent = mainProcess.getWindowAgentsManager().getAgent(id);
                            // in ssh-client, we must first tell the tcp-server to close
                            // the handleWindowClosed() may prevent this message sending out
                            if (mainProcessMode === "ssh-client") {
                                const sshClient = mainProcess.getSshClient();
                                if (sshClient !== undefined) {
                                    sshClient.quit();
                                }
                            }
                            if (windowAgent !== undefined) {
                                windowAgent.handleWindowClosed();
                            }

                        }
                    }
                }
            });

            // for whatever reason the websocket connection is closed, clean up the server side
            wsClient.on("close", (code: number, reason: Buffer) => {
                Log.info("-1", "WebSocket client closed.", code, reason);

                // same as "error" event below
                const index = Object.values(this.getClients()).indexOf(wsClient);
                if (index !== -1) {
                    const id = Object.keys(this.getClients())[index];
                    const processId = id.split("-")[0];
                    if (typeof processId === "string") {
                        const mainProcess = this.getMainProcess();
                        if (mainProcess instanceof MainProcess) {
                            const windowAgent = mainProcess.getWindowAgentsManager().getAgent(id);
                            const mainProcessMode = mainProcess.getMainProcessMode();
                            // in ssh-client, we must first tell the tcp-server to close
                            // the handleWindowClosed() may prevent this message sending out
                            if (mainProcessMode === "ssh-client") {
                                const sshClient = mainProcess.getSshClient();
                                if (sshClient !== undefined) {
                                    // do not quit, quit only when there is an error as in above "error" event handler
                                    // sshClient.quit();
                                }
                            }
                            if (windowAgent !== undefined) {
                                windowAgent.handleWindowClosed();
                            }
                        }
                    }
                }
            });
        });
    };


    handleMessage = (wsClient: WebSocket | string, message: { processId: string; windowId: string; eventName: string; data: any[] }) => {
        const processId = message["processId"];
        const eventName = message["eventName"];
        const windowId = message["windowId"];

        const mainProcess = this.getMainProcess();
        const mainProcessMode = mainProcess.getMainProcessMode();

        /**
         * 4 possible modes: "desktop", "web", "ssh-server", "ssh-client"
         */
        if (mainProcessMode === "ssh-client") {
            // todo: not tested yet
            // messages that must be on client side
            // do not call callbacks, forward message to tcp server
            // add one more layer:
            // {command: string, data: websocket-ipc-data}
            // they are intercepted here
            // "show-context-menu" 
            // "show-context-menu-sidebar" 
            // "main-window-show-context-menu"
            // "new-tdl-rendered": take screenshots, send local fonts names
            // "close-window": close the window, same as clicking the close button
            // "focus-window": focus the window, initiated by mosue down event on thumbnail
            // "processes-info": request processes info (CPU, memory) from renderer process
            if (
                eventName === "show-context-menu"
                || eventName === "show-context-menu-sidebar"
                || eventName === "main-window-show-context-menu"
                || eventName === "new-tdl-rendered"
                || eventName === "close-window"
                || eventName === "focus-window"
                || eventName === "zoom-window"
                || eventName === "processes-info"
                || eventName === "close-iframe-display"
                || eventName === "bring-up-main-window"
            ) {
                const eventListeners = mainProcess.getIpcManager().getEventListeners();
                const callback = eventListeners[eventName];
                if (callback !== undefined) {
                    // invoke callback
                    const data = message["data"];
                    callback(wsClient, ...data);
                }
                return;
            }

            let fullWindowId = windowId;
            // same as desktoip or web mode, always register the websocket client
            // also forward the message to to ssh server, so that the window can be registered
            if (this.getClients()[fullWindowId] === undefined) {
                Log.debug("-1", "register window", windowId, "for WebSocket IPC");
                this.getClients()[fullWindowId] = wsClient;
                // lift the block in create window method
                // const windowAgent = mainProcess.getWindowAgentsManager().getAgent(windowId);
                // if (windowAgent instanceof MainWindowAgent || windowAgent instanceof DisplayWindowAgent) {
                //     console.log("lift block for", windowId);
                //     windowAgent.creationResolve("");
                // }
            }
            // forward the message to remote ssh server
            const sshClient = mainProcess.getSshClient();
            const tcpMessage = {
                command: "forward-to-websocket-ipc",
                data: message,
            }
            if (sshClient !== undefined) {
                sshClient.sendToTcpServer(tcpMessage);
            } else {
                Log.error("-1", "Error: the main process", processId, "is not a ssh client");
            }
        } else if (mainProcessMode === "desktop" || mainProcessMode === "web" || mainProcessMode === "ssh-server") {
            // find callback for this event
            const callback = this.getEventListeners()[eventName];
            if (callback !== undefined) {
                // invoke callback
                const data = message["data"];
                callback(wsClient, ...data);
            }
        } else {
            // should never happen
        }
    };



    createSshServer = () => {
        this._sshServer = new SshServer(this);
        this._sshServer.createTcpServer();
    }


    /**
     * "1-22"
     *
     * (1) terminate the connection with the client, do not use close() as the client may have been closed <br>
     *
     * (2) remove the WebSocket object from client list <br>
     */
    removeClient = (id: string) => {
        // (1)
        const wsClient = this.getClients()[id];
        if (wsClient !== undefined && typeof wsClient !== "string") {
            wsClient.terminate();
        }
        // (2)
        delete this.getClients()[id];
        Log.info("-1", "Remove websocket IPC client", id);
    };


    // ----------------------- --------------------------

    eventListeners: Record<string, (event: any, ...args: any) => any> = {};

    ipcMain = {
        on: (channel: string, callback: (event: any, ...args: any) => any) => {
            this.eventListeners[channel] = callback;
        },
    };



    startToListen = () => {
        // -------------- main process -------------------------
        this.ipcMain.on("new-tdm-process", this.handleNewTdmProcess);
        this.ipcMain.on("quit-tdm-process", this.handleQuitTdmProcess);
        this.ipcMain.on("websocket-ipc-connected", this.handleWebsocketIpcConnected);
        // ------------------ main window ----------------------
        // we we select a profile
        this.ipcMain.on("profile-selected", this.handleProfileSelected);
        // show main window
        this.ipcMain.on("bring-up-main-window", this.handleBringUpMainWindow);
        this.ipcMain.on("focus-window", this.handleFocusWindow);
        this.ipcMain.on("close-window", this.handleCloseWindow);
        // ------------------- display window ------------------
        // set title
        this.ipcMain.on("set-window-title", this.handleSetWindowTitle);
        this.ipcMain.on("window-will-be-closed", this.handleWindowWillBeClosed);
        this.ipcMain.on("main-window-will-be-closed", this.handleMainWindowWillBeClosed);
        this.ipcMain.on("open-default-display-windows", this.handleOpenDefaultDisplayWindows);
        this.ipcMain.on("create-blank-display-window", this.handleCreateBlankDisplayWindow);
        this.ipcMain.on("zoom-window", this.handleZoomWindow);
        this.ipcMain.on("move-window", this.handleMoveWindow)
        this.ipcMain.on("set-window-always-on-top", this.handleSetWindowAlwaysOnTop)
        this.ipcMain.on("duplicate-display", this.handleDuplicateDisplay);

        // ------------------ tdl file ----------------------
        // open a tdl file, which creates a new display window
        this.ipcMain.on("open-tdl-file", this.handleOpenTdlFiles);
        // load tdl file, which does not create display window
        this.ipcMain.on("load-tdl-file", this.handleLoadTdlFile);
        // save tdl
        this.ipcMain.on("save-tdl-file", this.handleSaveTdlFile);
        // save serialized data to a file, e.g. .json data
        this.ipcMain.on("save-data-to-file", this.handleSaveDataToFile);
        this.ipcMain.on("new-tdl-rendered", this.handleNewTdlRendered);
        this.ipcMain.on("window-attached-script", this.handleWindowAttachedScript);
        // ------------- channel operations --------------------
        // tca get
        this.ipcMain.on("tca-get", this.handleTcaGet);
        // tca get meta
        this.ipcMain.on("tca-get-meta", this.handleTcaGetMeta);
        this.ipcMain.on("fetch-pva-type", this.handleFetchPvaType);
        // tca put
        this.ipcMain.on("tca-put", this.handleTcaPut);
        // tca monitor
        this.ipcMain.on("tca-monitor", this.handleTcaMonitor);
        // tca destroy channel
        this.ipcMain.on("tca-destroy", this.handleTcaDestroy);

        // ------------------- context menu ----------------------
        this.ipcMain.on("show-context-menu", this.handleShowContextMenu);
        this.ipcMain.on("show-context-menu-sidebar", this.handleShowContextMenuSidebar);
        this.ipcMain.on("main-window-show-context-menu", this.handleMainWindowShowContextMenu);

        // utility window
        this.ipcMain.on("create-utility-display-window", this.createUtilityDisplayWindow);
        this.ipcMain.on("data-viewer-export-data", this.handleDataViewerExportData);
        this.ipcMain.on("processes-info", this.handleProcessesInfo);
        this.ipcMain.on("epics-stats", this.handleEpicsStats);
        this.ipcMain.on("ca-snooper-command", this.handleCaSnooperCommand);
        this.ipcMain.on("request-epics-dbd", this.handleRequestEpicsDbd);
        this.ipcMain.on("ca-sw-command", this.handleCaswCommand);
        this.ipcMain.on("fetch-folder-content", this.handleFetchFolderContent);
        this.ipcMain.on("file-browser-command", this.handleFileBrowserCommand);
        this.ipcMain.on("fetch-thumbnail", this.handleFetchThumbnail)

        // profiles
        this.ipcMain.on("open-profiles", this.handleOpenProfiles);
        // message from main window before profile is slected
        this.ipcMain.on("save-profiles", this.handleSaveProfiles);
        this.ipcMain.on("save-profiles-as", this.handleSaveProfilesAs);

        // ---------------- file -------------------------
        this.ipcMain.on("select-a-file", this.handleSelectAFile);
        // ----------------- embedded display ------------------
        this.ipcMain.on("obtain-iframe-uuid", this.handleObtainIframeUuid);
        this.ipcMain.on("close-iframe-display", this.handleCloseIframeDisplay);
        this.ipcMain.on("switch-iframe-display-tab", this.handleSwitchIframeDisplayTab);

        // -------------------- actions --------------------
        this.ipcMain.on("open-webpage", this.handleOpenWebpage);
        this.ipcMain.on("execute-command", this.handleExecuteCommand);

        // ------------------- ssh login -------------------
        this.ipcMain.on("ssh-password-prompt-result", this.handleSshPasswordPromptResult);
        this.ipcMain.on("cancel-ssh-connection", this.handleCancelSshConnection)

        // -------------------- terminal widget ---------------------
        this.ipcMain.on("terminal-command", this.handleTerminalCommand)

        // ------------------ screenshot ----------------------------
        this.ipcMain.on("take-screenshot", this.handleTakeScreenShot)
        this.ipcMain.on("print-display-window", this.handlePrintDisplayWindow)

        // -------------------- archive -----------------------------
        this.ipcMain.on("request-archive-data", this.handleRequestArchiveData)

        // ----------------- Text editor -------------------------
        this.ipcMain.on("open-text-file-in-text-editor", this.handleOpenTextFileInTextEditor)
        this.ipcMain.on("save-text-file", this.handleSaveTextFile)

        // ------------------ log viewer -------------------------
        this.ipcMain.on("register-log-viewer", this.handleRegisterLogViewer)
        this.ipcMain.on("unregister-log-viewer", this.handleUnregisterLogViewer)

        // --------------- file converter ------------------------
        this.ipcMain.on("file-converter-command", this.handleFileConverterCommand)

        // ----------------- video file --------------------------
        this.ipcMain.on("save-video-file", this.handleSaveVideoFile)
    };

    // ---------------- TDM process ----------------------------

    handleNewTdmProcess = (event: any, options: IpcEventArgType["new-tdm-process"]) => {
        // const mainProcesses = this.getMainProcess().getMainProcesses();
        // mainProcesses.createProcess();
        // todo: spawn a new tdm process
    };

    /**
     * Quit this process, initiated from main window
     */
    handleQuitTdmProcess = (event: any, option: IpcEventArgType["quit-tdm-process"]) => {
        if (this.getMainProcess().getMainProcessMode() === "ssh-server") {
            const sshServer = this.getMainProcess().getIpcManager().getSshServer();
            sshServer?.sendToTcpClient(JSON.stringify(
                { command: "quit-tdm-process" }));
        }
        // we have confirmed in the message box to quit
        if (option["confirmToQuit"] === true) {
            this.getMainProcess().quit()
            return;
        }
        // check if there is any modified windows
        const windowAgentsManager = this.getMainProcess().getWindowAgentsManager();
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
            // }
        } else {
            this.getMainProcess().quit()
        }
        // const mainProcesses = this.getMainProcess().getMainProcesses();
        // mainProcesses.quit();
    }

    handleWebsocketIpcConnected = (event: any, data: IpcEventArgType["websocket-ipc-connected"]) => {
        // the main processes' ipc manager
        const ipcManager = this.getMainProcess().getIpcManager();
        const mainProcess = this.getMainProcess();
        const mainProcessMode = mainProcess.getMainProcessMode();
        const windowId = data["windowId"];
        if (ipcManager.getClients()[windowId] === undefined) {
            Log.debug("-1", "register window", windowId, "for WebSocket IPC");
            if (mainProcessMode === "desktop" || mainProcessMode === "web") {
                // desktop mode: websocket client on main/display window

                ipcManager.getClients()[windowId] = event;
            } else if (mainProcessMode === "ssh-server") {
                // ssh-server mode: an arbitrary string
                // in this way the DisplayWindowAgent.sendFromMainProcess() or MainWindowAgent.sendFromMainProcess()
                // on the calling process won't send message to the windows
                ipcManager.getClients()[windowId] = windowId;
            }
            // const mainProcess = this.getIpcManager().getMainProcesses().getProcess(data["mainProcessId"]);
            // fs.writeFileSync("/Users/haohao/tdm.log", `handleMainWidowBrowserWindowCreated ===================== ${JSON.stringify(data)}\n`, { flag: "a" });

            // lift the block in create window method
            const windowAgent = mainProcess.getWindowAgentsManager().getAgent(windowId);
            if ((windowAgent instanceof MainWindowAgent) || (windowAgent instanceof DisplayWindowAgent)) {
                // fs.writeFileSync("/Users/haohao/tdm.log", `handleMainWidowBrowserWindowCreated ===================== lift ${JSON.stringify(data)}\n`, { flag: "a" });
                Log.debug("-1", "lift window creation block for window", windowId);
                windowAgent.creationResolve("");
            } else if (windowAgent === undefined) {
                // a client connects to the websocket IPC server, and provides a process ID and a window ID
                // however, there is no such resource (i.e. DisplayWindowAgent) for this window ID
                // this is a non-legit client, it may come from refreshing a web page
                // we need to undo the above operation
                // no need to disconnec the websocket connection, the client 
                // will close the connection when the web page closes
                Log.error("-1", "There is no display window agent for this window ID", data["windowId"], "on server side, stop.");
                delete ipcManager.getClients()[windowId];
            }

        } else {
            Log.error("-1", "There is already a websocket client with this window ID", windowId, "stop proceeding.")
        }
    }
    // ----------------------- Profiles ------------------------

    /**
     * Manually open a profiles file via GUI dialog <br>
     *
     * If more than one files are selected, pop up a message box. <br>
     *
     * Only invoked in main window.
     */
    handleOpenProfiles = async (event: any, options: IpcEventArgType["open-profiles"]) => {
        let { profilesFileName1 } = options;
        if (profilesFileName1 === undefined) {
            profilesFileName1 = "";
        }
        const mainWindowAgent = this.getMainProcess().getWindowAgentsManager().getMainWindowAgent();
        if (mainWindowAgent === undefined) {
            return;
        }
        // open dialog and select file
        let profilesFileName = profilesFileName1;
        if (profilesFileName === "") {
            if (this.getMainProcess().getMainProcessMode() === "desktop") {
                try {
                    const profilesFileNames = dialog.showOpenDialogSync({ title: "Open JSON file", filters: [{ name: "json", extensions: ["json"] }] });
                    if (profilesFileNames === undefined) {
                        // canceled
                        return;
                    }
                    if (profilesFileNames.length !== 1) {
                        mainWindowAgent.sendFromMainProcess("dialog-show-message-box",
                            {
                                info: {
                                    messageType: "error",
                                    humanReadableMessages: ["Only one file can be selected"],
                                    rawMessages: [],
                                }
                            }
                        )
                    } else {
                        profilesFileName = profilesFileNames[0];
                    }
                } catch (e) {
                    mainWindowAgent.sendFromMainProcess("dialog-show-message-box",
                        {
                            info: {
                                messageType: "error",
                                humanReadableMessages: [`${e}`],
                                rawMessages: [],
                            }
                        }
                    )
                    return;
                }
            } else if (this.getMainProcess().getMainProcessMode() === "ssh-server") {
                mainWindowAgent.sendFromMainProcess("dialog-show-input-box",
                    {
                        info: {
                            command: "open-profiles",
                            humanReadableMessages: ["Open profiles file"], // each string has a new line
                            buttons: [
                                {
                                    text: "OK",
                                },
                                {
                                    text: "Cancel",
                                }
                            ],
                            defaultInputText: "",
                            // attachment: {}
                        }
                    })
                return;
            }
        }
        try {
            const profiles = this.getMainProcess().getProfiles();
            profiles.createProfiles(profilesFileName);

            // we are manually loading a profiles file, so we need to update the log file
            this.getMainProcess().enableLogToFile();

            // read default and OS-defined EPICS environment variables
            // in main window editing page, we need env default and env os
            const env = Environment.getTempInstance();
            let envDefault = env.getEnvDefault();
            let envOs = env.getEnvOs();
            if (typeof envOs !== "object") {
                envOs = {};
            }

            if (typeof envDefault !== "object") {
                envDefault = {};
            }

            const site = this.getMainProcess().getSite();

            // tell main window to update
            mainWindowAgent.sendFromMainProcess("after-main-window-gui-created",
                {
                    profiles: profiles.serialize(),
                    profilesFileName: profilesFileName,
                    envDefault: envDefault,
                    envOs: envOs,
                    logFileName: this.getMainProcess().getLogFileName(),
                    site: site,
                }
            );
        } catch (e) {
            mainWindowAgent.sendFromMainProcess("dialog-show-message-box",
                {
                    info: {
                        messageType: "error",
                        humanReadableMessages: [`${profilesFileName} is not a valid TDM profiles file, or it cannot be opened or created.`],
                        rawMessages: [],
                    }
                }
            )
        }
    };

    /**
     * Save a JSON format profiles file, and update corresponding data structure in main process. <br>
     *
     * If we are using an in-memory profiles object, save the profile as.
     *
     * @param {IpcMainEvent} event The IPC event.
     * @param {Record<string, any>} modifiedProfiles The JSON format profile
     * @returns {boolean} `true` if successfully save; `false` if failed.
     */
    handleSaveProfiles = (event: any, options: IpcEventArgType["save-profiles"]): boolean => {
        const profiles = this.getMainProcess().getProfiles();
        let { filePath1, modifiedProfiles } = options;
        if (filePath1 === undefined) {
            filePath1 = "";
        }
        const mainProcessMode = this.getMainProcess().getMainProcessMode();
        if (mainProcessMode === "web") {
            // do not save to web server
            return false;
        }

        let filePath: string | undefined = profiles.getFilePath();
        if (filePath === "") {
            // try the external file path
            filePath = filePath1;
        }
        const mainWindowAgent = this.getMainProcess().getWindowAgentsManager().getMainWindowAgent()
        if (mainWindowAgent === undefined) {
            return false;
        }
        if (filePath === "") {
            // save as
            if (this.getMainProcess().getMainProcessMode() === "desktop") {
                filePath = dialog.showSaveDialogSync({
                    title: "Select a file to save to",
                });
                if (filePath === undefined) {
                    Log.info("0", "No Profiles file selected, cancel saving");
                    return false;
                }
            } else if (this.getMainProcess().getMainProcessMode() === "ssh-server") {

                mainWindowAgent.sendFromMainProcess("dialog-show-input-box",
                    {
                        info: {
                            command: "save-profiles",
                            humanReadableMessages: ["Save profiles to"], // each string has a new line
                            buttons: [
                                {
                                    text: "OK",
                                },
                                {
                                    text: "Cancel",
                                }
                            ],
                            defaultInputText: "",
                            attachment: {
                                modifiedProfiles: modifiedProfiles,
                                filePath1: filePath1,
                            }
                        }
                    }
                );
                return false;
            }
        }


        try {
            // save first
            const profiles = this.getMainProcess().getProfiles();
            profiles.updateProfiles(filePath, modifiedProfiles);
            profiles.save();

            // update log
            this.getMainProcess().enableLogToFile();
            // always tell main window the log file name, if the log file is not accessible, it is ""
            mainWindowAgent.sendFromMainProcess("log-file-name",
                {
                    logFileName: this.getMainProcess().getLogFileName()
                }
            );
        } catch (e) {
            Log.error("0", e);
            mainWindowAgent.sendFromMainProcess("dialog-show-message-box",
                {
                    info: {
                        messageType: "error",
                        humanReadableMessages: [`Error save file to ${filePath}.`],
                        rawMessages: [],
                    }
                }
            )

            return false;
        }
        return true;
    };

    // create new Profiles object
    handleSaveProfilesAs = (event: any, options: IpcEventArgType["save-profiles-as"]): boolean => {
        let { filePath1, modifiedProfiles } = options;
        if (filePath1 === undefined) {
            filePath1 = "";
        }
        const mainProcessMode = this.getMainProcess().getMainProcessMode();
        if (mainProcessMode === "web") {
            // do not save to web server
            return false;
        }

        const mainWindowAgent = this.getMainProcess().getWindowAgentsManager().getMainWindowAgent();
        if (mainWindowAgent === undefined) {
            return false;
        }
        let filePath = filePath1;
        if (filePath1 === "") {
            if (this.getMainProcess().getMainProcessMode() === "desktop") {
                let filePath = dialog.showSaveDialogSync({
                    title: "Select a file to save to",
                });
                if (filePath === undefined) {
                    Log.error("0", "No file selected, cancel saving Profiles file.");
                    return false;
                }
            } else if (this.getMainProcess().getMainProcessMode() === "ssh-server") {

                mainWindowAgent.sendFromMainProcess("dialog-show-input-box",
                    {
                        info: {
                            command: "save-profiles-as",
                            humanReadableMessages: ["Save profiles to"], // each string has a new line
                            buttons: [
                                {
                                    text: "OK",
                                },
                                {
                                    text: "Cancel",
                                }
                            ],
                            defaultInputText: "",
                            attachment: {
                                modifiedProfiles: modifiedProfiles,
                                filePath1: filePath1,
                            }
                        }
                    }
                );
                return false;
            }
        }

        // always tell main window the log file name, if the log file is not accessible, it is ""
        mainWindowAgent.sendFromMainProcess("log-file-name",
            {
                logFileName: this.getMainProcess().getLogFileName()
            }
        );

        try {
            // save first
            const profiles = this.getMainProcess().getProfiles();
            profiles.updateProfiles(filePath, modifiedProfiles);
            profiles.save();

            // update log
            this.getMainProcess().enableLogToFile();
        } catch (e) {
            Log.error("0", e);
            mainWindowAgent.sendFromMainProcess("dialog-show-message-box",
                {
                    info: {
                        messageType: "error",
                        humanReadableMessages: [`Error save file to ${filePath}.`],
                        rawMessages: [],
                    }
                }
            )

            return false;
        }
        return true;
    };


    // ----------------------- windows -------------------------

    /**
     * Bring up main window <br>
     *
     * If main window is still opened, bring it to front. <br>
     *
     * If main window is closed, re-create the window. <br>
     *
     * (1) create main window's browser window, like in this.createMainWindow() <br>
     *
     * (2) send profiles to main window, like in this.createMainWindow() <br>
     *
     * (3) tell main window to show this profile's page, like this.handleProfileSelected(). Ignore command line parameters. <br>
     *
     */

    handleBringUpMainWindow = async (event: any, options: IpcEventArgType["bring-up-main-window"]) => {
        const windowAgentsManager = this.getMainProcess().getWindowAgentsManager();
        let mainWindowAgent = windowAgentsManager.getMainWindowAgent();
        if (mainWindowAgent instanceof MainWindowAgent) {
            mainWindowAgent.focus();
        } else {
            if (this.getMainProcess().getMainProcessMode() === "desktop" || this.getMainProcess().getMainProcessMode() === "ssh-server") {
                // re-create main window
                await windowAgentsManager.createMainWindow();
                mainWindowAgent = windowAgentsManager.getMainWindowAgent();
                if (mainWindowAgent instanceof MainWindowAgent) {
                    const selectedProfileName = this.getMainProcess().getProfiles().getSelectedProfileName();
                    mainWindowAgent.sendFromMainProcess("after-profile-selected", {
                        profileName: selectedProfileName
                    });

                    if (this.getMainProcess().getMainProcessMode() === "desktop") {
                        // update thumbnails immediately for desktop
                        const displayWindowAgents = windowAgentsManager.getAgents();
                        for (let displayWindowId of Object.keys(displayWindowAgents)) {
                            const displayWindowAgent = displayWindowAgents[displayWindowId];
                            // not main window
                            if (displayWindowAgent instanceof DisplayWindowAgent) {
                                // not pre-loaded display window
                                if (displayWindowAgent !== windowAgentsManager.preloadedDisplayWindowAgent) {
                                    // must be a display window, not embedded window: (-1, 0, 1, ..., 10000)
                                    const windowName = displayWindowAgent.getWindowName();
                                    const tdlFileName = displayWindowAgent.getTdlFileName();
                                    displayWindowAgent.takeThumbnail(windowName, tdlFileName);
                                }
                            }
                        }
                    }
                }
            } else if (this.getMainProcess().getMainProcessMode() === "ssh-client") {
                const sshClient = this.getMainProcess().getSshClient();
                const displayWindowAgents = windowAgentsManager.getAgents();
                // find an available display window, send out the bring-up-main-window event from this window
                if (Object.values(displayWindowAgents).length > 0) {
                    const displayWindowAgent = Object.values(displayWindowAgents)[0];
                    if (displayWindowAgent instanceof DisplayWindowAgent) {
                        const dislayWindowId = displayWindowAgent.getId();
                        if (sshClient !== undefined) {
                            sshClient.routeToRemoteWebsocketIpcServer({
                                windowId: dislayWindowId,
                                eventName: "bring-up-main-window",
                                data: [],
                            })
                            // take thumbnails as soon as possible, 2 seconds is a reasonable time
                            setTimeout(() => {
                                const displayWindowAgents = windowAgentsManager.getAgents();
                                for (let displayWindowId of Object.keys(displayWindowAgents)) {
                                    const displayWindowAgent = displayWindowAgents[displayWindowId];
                                    // not main window
                                    if (displayWindowAgent instanceof DisplayWindowAgent) {
                                        // not pre-loaded display window
                                        if (displayWindowAgent !== windowAgentsManager.preloadedDisplayWindowAgent) {
                                            // must be a display window, not embedded window: (-1, 0, 1, ..., 10000)
                                            const windowName = displayWindowAgent.getWindowName();
                                            const tdlFileName = displayWindowAgent.getTdlFileName();
                                            displayWindowAgent.takeThumbnail(windowName, tdlFileName);
                                        }
                                    }
                                }
                            }, 2000);
                        }
                    }
                }
            }
        }
    };

    handleFocusWindow = async (event: any, options: IpcEventArgType["focus-window"]) => {
        const windowAgentsManager = this.getMainProcess().getWindowAgentsManager();
        const displayWindowAgent = windowAgentsManager.getAgent(options["displayWindowId"]);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            displayWindowAgent.focus();
        }
    };

    handleCloseWindow = async (event: any, options: IpcEventArgType["close-window"]) => {
        const windowAgentsManager = this.getMainProcess().getWindowAgentsManager();
        const windowAgent = windowAgentsManager.getAgent(options["displayWindowId"]);
        if ((windowAgent instanceof DisplayWindowAgent) || (windowAgent instanceof MainWindowAgent)) {
            windowAgent.close();
        }
    };

    /**
     * Set display/main window title
     *
     * @param {string} windowId Window ID
     * @param {string} newTitle New title
     */
    handleSetWindowTitle = (event: any, options: IpcEventArgType["set-window-title"]) => {
        const { windowId, newTitle, modified } = options;
        const windowAgentsManager = this.getMainProcess().getWindowAgentsManager();
        const displayWindowAgent = windowAgentsManager.getAgent(windowId);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            if (typeof modified === "string" && modified.length > 0) {
                displayWindowAgent.setModified(true);
            } else {
                displayWindowAgent.setModified(false);
            }
            const browserWindow = displayWindowAgent.getBrowserWindow();
            if (browserWindow !== undefined && !(browserWindow instanceof BrowserView)) {
                browserWindow.setTitle(newTitle);
            }
        }
    };

    /**
     * display window will be closed
     * 
     * If we choose not to close the window immediately, set the readyToClose back to false.
     */
    handleWindowWillBeClosed = (event: any, data: IpcEventArgType["window-will-be-closed"]) => {
        const windowAgentsManager = this.getMainProcess().getWindowAgentsManager();
        const displayWindowAgent = windowAgentsManager.getAgent(data["displayWindowId"]);
        // close browser window in desktop mode or ssh-server mode
        const closeBrowserWindow = () => {
            const mode = this.getMainProcess().getMainProcessMode();
            if (displayWindowAgent instanceof DisplayWindowAgent) {
                // the DisplayWindowAgent.handleWindowClosed() won't e called
                displayWindowAgent.readyToClose = true;
                const browserWindow = displayWindowAgent.getBrowserWindow();
                if (mode === "desktop") {
                    if (browserWindow !== undefined) {
                        browserWindow.webContents.close();
                    }
                } else if (mode === "ssh-server") {
                    // (1) clean up the local stuff
                    displayWindowAgent.handleWindowClosed();
                    // (2) tell the ssh-client to close the window
                    const sshServer = this.getMainProcess().getIpcManager().getSshServer();
                    // fs.writeFileSync("/Users/haohao/tdm.log", `window will be closed, tell the ssh-client to close window =====================\n`, { flag: "a" });
                    if (sshServer !== undefined) {
                        // this is a tcp command, not websocket
                        // fs.writeFileSync("/Users/haohao/tdm.log", `window will be closed, tell the ssh-client to close window B =====================\n`, { flag: "a" });
                        sshServer.sendToTcpClient(JSON.stringify(
                            {
                                command: "close-browser-window",
                                data: {
                                    mainProcessId: "0",
                                    displayWindowId: data["displayWindowId"],
                                }
                            }
                        ))
                    }
                }
            }
        }

        if (displayWindowAgent instanceof DisplayWindowAgent) {
            const browserWindow = displayWindowAgent.getBrowserWindow();
            const mode = this.getMainProcess().getMainProcessMode();
            if (
                mode === "ssh-server" ||
                // real display window need to be saved
                (browserWindow instanceof BrowserWindow &&
                    // preloaded displays don't need to be saved
                    windowAgentsManager.preloadedDisplayWindowAgent !== displayWindowAgent
                    // embedded displays don't need to be saved
                    // && windowAgentsManager.preloadedEmbeddedDisplayAgent !== displayWindowAgent
                )
            ) {
                // desktop mode and ssh-client mode 
                // 
                // no save, the client determines that this window do not need to be saved:
                // (1) it is a utility window, or
                // (2) it is not modified since opening
                if (data["close"]) {
                    // it emits "close" event, readyToClose is used to prevent recursive invocation of
                    // "close" event handler
                    closeBrowserWindow();
                    // fs.writeFileSync("/Users/haohao/tdm.log", `window is closed =====================\n`, { flag: "a" });
                } else {
                    if (data["saveConfirmation"] === "Save") {
                        // TextEditor utility window has unsaved contents
                        if (data["textEditorFileName"] !== undefined
                            && data["displayWindowId"] !== undefined
                            && data["widgetKey"] !== undefined
                            && data["textEditorContents"]) {
                            const saveSuccess = this.handleSaveTextFile(undefined, {
                                displayWindowId: data["displayWindowId"],
                                widgetKey: data["widgetKey"],
                                fileContents: data["textEditorContents"],
                                fileName: data["textEditorFileName"],
                            });
                            if (saveSuccess) {
                                closeBrowserWindow();
                            } else {
                                // failed to save, restore state
                                displayWindowAgent.readyToClose = false;
                            }
                        } else if (data["widgetKey"] !== undefined && data["widgetKey"].startsWith("DataViewer") && data["dataViewerData"] !== undefined) {
                            // save DataViewer data
                            // const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(displayWindowId);

                            let fileName = "";

                            if (browserWindow instanceof BrowserWindow) {
                                if (this.getMainProcess().getMainProcessMode() === "desktop") {
                                    fileName = dialog.showSaveDialogSync(browserWindow, {
                                        title: "Select a file to save to",
                                        filters: [
                                            {
                                                name: "json",
                                                extensions: ["json"],
                                            },
                                        ],
                                    });
                                } else if (this.getMainProcess().getMainProcessMode() === "ssh-server") {
                                    // todo
                                    // displayWindowAgent.sendFromMainProcess("dialog-show-input-box",
                                    //     {
                                    //         command: "data-viewer-export-data",
                                    //         humanReadableMessages: ["Save file to"], // each string has a new line
                                    //         buttons: [
                                    //             {
                                    //                 text: "OK",
                                    //             },
                                    //             {
                                    //                 text: "Cancel",
                                    //             }
                                    //         ],
                                    //         defaultInputText: "",
                                    //         attachment: {
                                    //             displayWindowId: displayWindowId,
                                    //             data: data,
                                    //             fileName1: fileName1,
                                    //         }
                                    //     }
                                    // );
                                    // return;
                                }
                            }
                            try {
                                fs.writeFileSync(fileName, JSON.stringify(data["dataViewerData"], null, 4));
                                Log.debug("0", "Successfully saved DataViewer data to", fileName);
                                closeBrowserWindow();
                            } catch (e) {
                                // if Cancel or error, do not close the window
                                Log.error("0", `Cannot save DataViewer data to file ${fileName}`);
                                displayWindowAgent.readyToClose = false;

                                // displayWindowAgent.sendFromMainProcess("dialog-show-message-box", {
                                //     // command?: string | undefined,
                                //     messageType: "error", // | "warning" | "info", // symbol
                                //     humanReadableMessages: [`Cannot save DataViewer data to file ${fileName}`], // each string has a new line
                                //     rawMessages: [`${e}`], // computer generated messages
                                //     // buttons?: type_DialogMessageBoxButton[] | undefined,
                                //     // attachment?: any,
                                // })
                            }
                            return;
                        } else {
                            // any other types of window
                            let tdlFileName: string | undefined = data["tdlFileName"];
                            // Save as: it is an in-memory display
                            if (tdlFileName === "") {
                                if (this.getMainProcess().getMainProcessMode() === "desktop") {

                                    // a in-memory display, save as
                                    tdlFileName = dialog.showSaveDialogSync({
                                        title: "Save",
                                        defaultPath: path.dirname(tdlFileName),
                                        filters: [{ name: "tdl", extensions: ["tdl", "json"] }],
                                    });
                                } else if (this.getMainProcess().getMainProcessMode() === "ssh-server") {
                                    displayWindowAgent.sendFromMainProcess("dialog-show-input-box",
                                        {
                                            info:
                                            {
                                                command: "window-will-be-closed",
                                                humanReadableMessages: ["Save diaplay to"], // each string has a new line
                                                buttons: [
                                                    {
                                                        text: "OK",
                                                    },
                                                    {
                                                        text: "Cancel",
                                                    }
                                                ],
                                                defaultInputText: "",
                                                attachment: data,
                                            }
                                        }
                                    );
                                    return;
                                }
                            }
                            if (tdlFileName !== undefined) {
                                // save file
                                fs.writeFile(tdlFileName, JSON.stringify(data["tdl"], null, 4), (err) => {
                                    if (err) {
                                        // error when saving file, do not close the window
                                        Log.error("0", err);
                                        displayWindowAgent.sendFromMainProcess("dialog-show-message-box", {
                                            info: {
                                                // command?: string | undefined,
                                                messageType: "error", // | "warning" | "info", // symbol
                                                humanReadableMessages: [`Error saving file ${tdlFileName}`], // each string has a new line
                                                rawMessages: [`${err}`], // computer generated messages
                                                // buttons?: type_DialogMessageBoxButton[] | undefined,
                                                // attachment?: any,
                                            }
                                        })
                                        displayWindowAgent.readyToClose = false;
                                    } else {
                                        // update tdlFileName on client side, absolute path
                                        displayWindowAgent.sendFromMainProcess("tdl-file-saved",
                                            {
                                                newTdlFileName: tdlFileName
                                            }
                                        );
                                        closeBrowserWindow();

                                    }
                                });
                            } else {
                                // cancel the file saving dialog, do not close the window
                                displayWindowAgent.readyToClose = false;
                            }
                        }
                    } else if (data["saveConfirmation"] === "Don't Save") {
                        // Don't Save
                        closeBrowserWindow();
                        return;
                    } else if (data["saveConfirmation"] === "Cancel") {
                        // Cancel
                        displayWindowAgent.readyToClose = false;
                        return;
                    } else {
                        displayWindowAgent.sendFromMainProcess("dialog-show-message-box",
                            {
                                info:
                                {
                                    command: "window-will-be-closed-confirm",
                                    messageType: "warning",
                                    humanReadableMessages:
                                        data["widgetKey"] !== undefined && data["widgetKey"].startsWith("DataViewer_") ?
                                            [`Do you want to save the data? They will be lost if you don't save them.`]
                                            :
                                            [`Do you want to save the changes you made? Your changes will be lost if you don't save them.`],
                                    rawMessages: [],
                                    buttons: [
                                        {
                                            text: "Save",
                                        },
                                        {
                                            text: "Don't Save",
                                        },
                                        {
                                            text: "Cancel",
                                        }
                                    ],
                                    // on render window, this is modified and sent back
                                    // the saveConfirmation is changed from undefined to 
                                    // "Save", "Don't Save", or "Cancel"
                                    attachment: data,
                                }
                            }
                        );
                        return;
                    }
                }
            } else if (browserWindow === undefined) {
                // // ssh-server mode
                // fs.writeFileSync("/Users/haohao/tdm.log", `window will be closed ===================== B ${displayWindowAgent.getId()}\n`, { flag: "a" });
                // // DisplayWindowAgent.browserWindow is undefined, we are in ssh-server mode 
                // const sshServer = this.getMainProcess().getMainProcesses().getIpcManager().getSshServer();
                // if (sshServer !== undefined) {
                //     sshServer.sendToTcpClient(JSON.stringify(
                //         {
                //             command: "close-webcontents-in-ssh",
                //             data: {
                //                 mainProcessId: this.getMainProcess().getWindowAgentsManager().getMainProcess().getProcessId(),
                //                 displayWindowId: data["displayWindowId"],
                //             }
                //         }
                //     ))
                // }
            }
        }
    };

    handleMainWindowWillBeClosed = (event: any, data: IpcEventArgType["main-window-will-be-closed"]) => {
        const mainWindowAgent = this.getMainProcess().getWindowAgentsManager().getMainWindowAgent();
        const closeBrowserWindow = () => {
            const mode = this.getMainProcess().getMainProcessMode();
            if (mainWindowAgent instanceof MainWindowAgent) {
                const browserWindow = mainWindowAgent.getBrowserWindow();
                if (mode === "desktop") {
                    if (browserWindow !== undefined) {
                        browserWindow.webContents.close();
                    }
                } else if (mode === "ssh-server") {
                    // (1) clean up the local stuff
                    mainWindowAgent.handleWindowClosed();
                    // (2) tell the ssh-client to close the window
                    const sshServer = this.getMainProcess().getIpcManager().getSshServer();
                    // fs.writeFileSync("/Users/haohao/tdm.log", `window will be closed, tell the ssh-client to close window =====================\n`, { flag: "a" });
                    if (sshServer !== undefined) {
                        // this is a tcp command, not websocket
                        // fs.writeFileSync("/Users/haohao/tdm.log", `window will be closed, tell the ssh-client to close window B =====================\n`, { flag: "a" });
                        sshServer.sendToTcpClient(JSON.stringify(
                            {
                                command: "close-browser-window",
                                data: {
                                    mainProcessId: "0",
                                    mainWindowId: data["mainWindowId"],
                                }
                            }
                        ))
                    }
                }
            }
        }
        closeBrowserWindow();
        // fs.writeFileSync("/Users/haohao/tdm.log", `handleMainWindowWillBeClosed A =====================\n`, { flag: "a" });
        // const mainProcessMode = this.getMainProcess().getMainProcessMode();
        // if (mainProcessMode === "desktop") {
        //     // do nothing
        // } else if (mainProcessMode === "ssh-server") {
        //     const mainWindowAgent = this.getMainProcess().getWindowAgentsManager().getMainWindowAgent();
        //     if (mainWindowAgent instanceof MainWindowAgent) {
        //         fs.writeFileSync("/Users/haohao/tdm.log", `handleMainWindowWillBeClosed =====================\n`, { flag: "a" });
        //         mainWindowAgent.handleWindowClosed();
        //     }
        // }

    }


    // ----------------------- Profile ------------------------

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
    handleProfileSelected = async (event: any, option: IpcEventArgType["profile-selected"]) => {
        const { selectedProfileName, args, httpResponse, openDefaultDisplayWindows } = option;

        this.getMainProcess().getProfiles().setSelectedProfileName(selectedProfileName);
        const selectedProfile = this.getMainProcess().getProfiles().getSelectedProfile();
        // select to run a new process as ssh-client mode, it can only be started from desktop mode
        if (this.getMainProcess().getMainProcessMode() === "desktop" && selectedProfile !== undefined && selectedProfile.isSshConfig()) {

            // connect to remote
            // const mainProcesses = this.getMainProcess().getMainProcesses();
            const sshConfigRaw = selectedProfile.getCategory("SSH Configuration");
            const sshServerConfig: type_sshServerConfig = {
                ip: sshConfigRaw["Host Name/IP Address"]["value"],
                port: parseInt(sshConfigRaw["Port"]["value"]),
                userName: sshConfigRaw["User Name"]["value"],
                privateKeyFile: sshConfigRaw["Private Key File"]["value"],
                tdmCommand: sshConfigRaw["TDM Command"]["value"],
            };
            Log.info("0", "We are going to run a new process on remote ssh using config", sshServerConfig)

            if (typeof sshServerConfig.ip === "string" && !isNaN(sshServerConfig.port) && typeof sshServerConfig.userName === "string" && typeof sshServerConfig.privateKeyFile === "string") {
                // const callingProcessId = this.getMainProcess().getMain();
                const callingProcessId = "0";
                const args = this.getMainProcess().getRawArgs();
                new MainProcess(args, undefined, "ssh-client", { ...sshServerConfig, callingProcessId: callingProcessId });
                // mainProcesses.createProcess(
                //     // the callback is invoked in MainProcess constructor, providing the calling main process ID
                //     // to SshClient, so that the calling process is terminated at "main-window-create-browser-window" stage
                //     // which happens after the remote ssh TCP server is successfully connected.
                //     // (mainProcess: MainProcess) => {
                //     //     return callingProcessId;
                //     // },
                //     undefined,
                //     "ssh-client", undefined, { ...sshServerConfig, callingProcessId: callingProcessId });
            } else {
                Log.error("0", "Profiles file error: Cannot create main process for ssh config", selectedProfileName);
            }
        } else  // regular profile
        {
            if (httpResponse === undefined) { // non-web mode
                // (1)
                this.getMainProcess().getProfiles().setSelectedProfileName(selectedProfileName);
                // (2)
                const selectedProfile = this.getMainProcess().getProfiles().getSelectedProfile();
                if (selectedProfile === undefined) {
                    Log.error("0", `Profile ${selectedProfileName} does not exist`);
                    return;
                }

                await this.getMainProcess().getChannelAgentsManager().createAndInitContext();


                // change main window title
                const mainWindowAgent = this.getMainProcess().getWindowAgentsManager().getMainWindowAgent();
                if (mainWindowAgent !== undefined) {
                    const oldTitle = mainWindowAgent.getTitle();
                    const newTitle = oldTitle + " -- " + selectedProfile.getName();
                    mainWindowAgent.setTitle(newTitle);
                }
            }
            const selectedProfile = this.getMainProcess().getProfiles().getSelectedProfile();
            if (selectedProfile === undefined) {
                Log.error("0", `Profile ${selectedProfileName} does not exist`);
                return;
            }
            // create SQL to talk to archive
            this.getMainProcess().createSql();

            // (3)
            const windowAgentsManager = this.getMainProcess().getWindowAgentsManager();
            // get default tdls
            let tdlFileNames: string[] = selectedProfile.getEntry("EPICS Custom Environment", "Default TDL Files");
            let macros = selectedProfile.getMacros();
            let currentTdlFolder: undefined | string = undefined;

            // command line args
            if (args !== undefined) {
                currentTdlFolder = args["cwd"] === "" ? undefined : args["cwd"];
                if (args["alsoOpenDefaults"]) {
                    tdlFileNames.push(...args["fileNames"]);
                } else {
                    tdlFileNames = args["fileNames"];
                }

                // args["macros"] overrides profile-defined macros
                macros = [...args["macros"], ...macros];
            }
            // end command line

            const mode = selectedProfile.getMode();
            const editable = selectedProfile.getEditable();

            for (let tdlFileName of tdlFileNames) {
                // .tdl, .edl, or .bob
                if (path.extname(tdlFileName) === ".tdl" || path.extname(tdlFileName) === ".bob" || path.extname(tdlFileName) === ".edl" || path.extname(tdlFileName) === ".stp") {
                    if (path.extname(tdlFileName) !== ".tdl") {
                        // we are able to edit ".edl" files, however, when we save them, the saving dialog is shown to "save as"
                        // editable = false;
                    }

                    // only read the first tdl file in web mode
                    if (this.getMainProcess().getMainProcessMode() === "web" && tdlFileName !== tdlFileNames[0]) {
                        break;
                    }

                    FileReader.readTdlFile(tdlFileName, selectedProfile, currentTdlFolder).then(
                        (tdlResult) => {
                            if (tdlResult !== undefined) {
                                const tdl = tdlResult["tdl"];
                                const fullTdlFileName = tdlResult["fullTdlFileName"];
                                const options: type_options_createDisplayWindow = {
                                    tdl: tdl,
                                    mode: mode as "editing" | "operating",
                                    editable: editable,
                                    tdlFileName: fullTdlFileName,
                                    macros: macros,
                                    replaceMacros: false,
                                    hide: false,
                                };
                                windowAgentsManager.createDisplayWindow(options, httpResponse);
                            } else {
                                Log.error("0", `Cannot read file ${tdlFileName}`);
                            }
                        }
                    )



                } else if (path.extname(tdlFileName) === ".db" || path.extname(tdlFileName) === ".template") {
                    const db = FileReader.readDb(tdlFileName, selectedProfile, currentTdlFolder);
                    const channelNames: string[] = [];
                    if (db !== undefined) {
                        for (let ii = 0; ii < db.length; ii++) {
                            const channelName = db[ii]["NAME"];
                            if (channelName !== undefined) {
                                channelNames.push(channelName);
                            }
                        }
                    }
                    this.createUtilityDisplayWindow(undefined, {
                        utilityType: "PvTable",
                        utilityOptions: { channelNames: channelNames }
                    });
                }
            }

            // (4)
            // windowAgentsManager.createPreloadedDisplayWindow();
            // (5)
            const mainWindowAgent = windowAgentsManager.getMainWindowAgent();

            if (mainWindowAgent === undefined) {
            } else {
                await mainWindowAgent.loadURLPromise;
                // the main window has received all the necessary information to switch to run page
                await mainWindowAgent.creationPromise2;
                mainWindowAgent.sendFromMainProcess("after-profile-selected", {
                    profileName: selectedProfileName,
                });
                // create the preview window for file browser
                windowAgentsManager.createPreviewDisplayWindow();
            }
        }
    }


    /**
     * Basically the same as profile-selected handler <br>
     */
    handleOpenDefaultDisplayWindows = (event: any, options: IpcEventArgType["open-default-display-windows"]) => {
        const selectedProfile = this.getMainProcess().getProfiles().getSelectedProfile();
        if (selectedProfile === undefined) {
            Log.error("0", `Profile not selected yet`);
            return;
        }

        const windowAgentsManager = this.getMainProcess().getWindowAgentsManager();
        // get default tdls
        let tdlFileNames: string[] = selectedProfile.getEntry("EPICS Custom Environment", "Default TDL Files");
        let macros = selectedProfile.getMacros();
        let currentTdlFolder: undefined | string = undefined;

        const mode = selectedProfile.getMode();
        const editable = selectedProfile.getEditable();

        for (let tdlFileName of tdlFileNames) {
            // .tdl, .edl, or .bob
            if (path.extname(tdlFileName) === ".tdl" || path.extname(tdlFileName) === ".bob" || path.extname(tdlFileName) === ".edl" || path.extname(tdlFileName) === ".stp") {
                if (path.extname(tdlFileName) !== ".tdl") {
                    // we are able to edit ".edl" files, however, when we save them, the saving dialog is shown to "save as"
                    // editable = false;
                }

                FileReader.readTdlFile(tdlFileName, selectedProfile, currentTdlFolder).then((tdlResult) => {
                    if (tdlResult !== undefined) {
                        const tdl = tdlResult["tdl"];
                        const fullTdlFileName = tdlResult["fullTdlFileName"];
                        const options: type_options_createDisplayWindow = {
                            tdl: tdl,
                            mode: mode as "editing" | "operating",
                            editable: editable,
                            tdlFileName: fullTdlFileName,
                            macros: macros,
                            replaceMacros: false,
                            hide: false,
                        };
                        windowAgentsManager.createDisplayWindow(options);
                    } else {
                        Log.error("0", `Cannot read file ${tdlFileName}`);
                    }
                });

            } else if (path.extname(tdlFileName) === ".db" || path.extname(tdlFileName) === ".template") {
                const db = FileReader.readDb(tdlFileName, selectedProfile, currentTdlFolder);
                const channelNames: string[] = [];
                if (db !== undefined) {
                    for (let ii = 0; ii < db.length; ii++) {
                        const channelName = db[ii]["NAME"];
                        if (channelName !== undefined) {
                            channelNames.push(channelName);
                        }
                    }
                }
                this.createUtilityDisplayWindow(undefined, {
                    utilityType: "PvTable",
                    utilityOptions: { channelNames: channelNames }
                });
            }
        }
    };

    handleCreateBlankDisplayWindow = (event: any, options: IpcEventArgType["create-blank-display-window"]) => {
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(options["displayWindowId"]);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            displayWindowAgent.getWindowAgentsManager().createBlankDisplayWindow();
        }
    }

    // ---------------------- tdl file ---------------------
    // There is no standalone tdl file class, the basic operations to tdl files are defined here.

    /**
     * Automatically or manually open one or multiple tdl files, then create display window to show them; or
     * open a blank display window. <br>
     * 
     * The duplication opened window detection is realized by comparing file name and macros.
     *
     * @param {string[] | undefined} tdlFileNames The tdl file to be opened. If it is `undefined`,
     * use dialog to manually open file; if an empty string array, then create a blank window.
     * @param {"editing" | "operating"} mode The initial mode of the display window.
     * @param {boolean} editable If the display window editable
     * @param {Array<Array<string, string>>} macros Externally provided macros
     * @param {boolean} replaceMacros If the externally provided macros replace the internally defined macros
     * @returns {void}
     *
     */
    handleOpenTdlFiles = (event: any, data: IpcEventArgType["open-tdl-file"]) => {
        const { options, httpResponse } = data;
        const windowAgentsManager = this.getMainProcess().getWindowAgentsManager();
        const selectedProfile = this.getMainProcess().getProfiles().getSelectedProfile();
        if (selectedProfile === undefined) {
            Log.error("0", "Profile not selected!");
            return;
        }

        let editable = options["editable"];
        let mode = options["mode"];
        const windowId = options["windowId"];
        let windowAgent: MainWindowAgent | DisplayWindowAgent | undefined = undefined;
        if (windowId !== undefined) {
            windowAgent = windowAgentsManager.getAgent(windowId);
        }

        // open a local tdl file from web page, the "tdl" field is not empty
        if (options["tdlStr"] !== undefined && options["tdlFileNames"]?.length === 1 && httpResponse !== undefined) {
            const tdlFileName = options["tdlFileNames"][0];
            const tdlStr = options["tdlStr"];
            // let editable = selectedProfile.getManuallyOpenedTdlEditable();

            if (path.extname(tdlFileName) === ".tdl" || path.extname(tdlFileName) === ".bob" || path.extname(tdlFileName) === ".edl" || path.extname(tdlFileName) === ".stp") {
                if (path.extname(tdlFileName) !== ".tdl") {
                    // we are able to edit ".edl" files, however, when we save them, the saving dialog is shown to "save as"
                    // editable = false;
                }

                const editableForManuallyOpenedFiles = selectedProfile.getCategory("EPICS Custom Environment")["Manually Opened TDL Editable"];
                if (editableForManuallyOpenedFiles !== undefined) {
                    if (editableForManuallyOpenedFiles["value"] === "Yes") {
                        editable = true;
                    } else {
                        editable = false;
                    }
                }

                const modeForManuallyOpenedFiles = selectedProfile.getCategory("EPICS Custom Environment")["Manually Opened TDL Mode"];
                if (modeForManuallyOpenedFiles !== undefined) {
                    if (modeForManuallyOpenedFiles["value"] === "operating") {
                        mode = "operating";
                    } else {
                        mode = "editing";
                        // "editing" mode overrides "editable"
                        editable = true;
                    }
                }
                // parse file contents
                const tdl = JSON.parse(tdlStr);
                windowAgentsManager.createDisplayWindow(
                    {
                        tdl: tdl,
                        mode: mode,
                        editable: editable,
                        tdlFileName: options["tdlFileNames"][0],
                        macros: options["macros"],
                        replaceMacros: options["replaceMacros"],
                        hide: false,
                        postCommand: options["postCommand"],
                    },
                    httpResponse
                );
            } else if (path.extname(tdlFileName) === ".db" || path.extname(tdlFileName) === ".template") {
                const db = FileReader.parseDb(tdlStr);
                // const db = FileReader.readDb(tdlFileName, selectedProfile, options["currentTdlFolder"]);
                const channelNames: string[] = [];
                if (db !== undefined) {
                    for (let ii = 0; ii < db.length; ii++) {
                        const channelName = db[ii]["NAME"];
                        if (channelName !== undefined) {
                            channelNames.push(channelName);
                        }
                    }
                }
                this.createUtilityDisplayWindow(undefined, {
                    utilityType: "PvTable",
                    utilityOptions: { channelNames: channelNames },
                    httpResponse: httpResponse
                });
            } else {

            }

            return;
        }

        // desktop mode and ssh mode
        let tdlFileNames = options["tdlFileNames"];
        try {
            if (tdlFileNames === undefined || tdlFileNames.length > 0) {

                // open dialog to select tdl files
                // in this case, the file is manually opened
                if (tdlFileNames === undefined) {
                    let defaultPath = "";
                    if (options["currentTdlFolder"] !== undefined && fs.existsSync(options["currentTdlFolder"])) {
                        defaultPath = options["currentTdlFolder"];
                    }
                    if (this.getMainProcess().getMainProcessMode() === "desktop") {
                        tdlFileNames = dialog.showOpenDialogSync({
                            title: "open tdl file",
                            filters: [{ name: "tdl", extensions: ["tdl", "json", "bob", "edl", "stp", "db", "template"] }],
                            defaultPath: defaultPath,
                            // properties: ["openFile", "openDirectory","multiSelections"],
                            properties: ["openFile", "multiSelections"],
                        });
                    }

                    if (windowId === undefined) {
                        return;
                    }
                    if (windowAgent === undefined) {
                        return;
                    }

                    if (this.getMainProcess().getMainProcessMode() === "ssh-server") {

                        const dialogInfo = {
                            info: {
                                command: "open-tdl-file",
                                humanReadableMessages: ["Open TDL file"], // each string has a new line
                                buttons: [
                                    {
                                        text: "OK",
                                    },
                                    {
                                        text: "Cancel",
                                    }
                                ],
                                defaultInputText: "",
                                attachment: options,
                            }
                        };
                        if (windowAgent instanceof MainWindowAgent) {
                            windowAgent.sendFromMainProcess("dialog-show-input-box", dialogInfo);
                        } else if (windowAgent instanceof DisplayWindowAgent) {
                            windowAgent.sendFromMainProcess("dialog-show-input-box", dialogInfo);
                        }
                        return;
                    }

                    if (tdlFileNames === undefined) {
                        return;
                    }

                    // the manually opened TDL file's editing permission and its mode are determined by Profile

                    // this file's editable is determined by the profile setting
                    const editableForManuallyOpenedFiles = selectedProfile.getCategory("EPICS Custom Environment")["Manually Opened TDL Editable"];
                    if (editableForManuallyOpenedFiles !== undefined) {
                        if (editableForManuallyOpenedFiles["value"] === "Yes") {
                            editable = true;
                        } else {
                            editable = false;
                        }
                    }

                    const modeForManuallyOpenedFiles = selectedProfile.getCategory("EPICS Custom Environment")["Manually Opened TDL Mode"];
                    if (modeForManuallyOpenedFiles !== undefined) {
                        if (modeForManuallyOpenedFiles["value"] === "operating") {
                            mode = "operating";
                        } else {
                            mode = "editing";
                            // "editing" mode overrides "editable"
                            editable = true;
                        }
                    }
                }

                for (let tdlFileName of tdlFileNames) {
                    // .tdl, .edl, or .bob
                    if (path.extname(tdlFileName) === ".tdl" || path.extname(tdlFileName) === ".bob" || path.extname(tdlFileName) === ".edl" || path.extname(tdlFileName) === ".stp") {
                        if (path.extname(tdlFileName) !== ".tdl") {
                            // we are able to edit ".edl" files, however, when we save them, the saving dialog is shown to "save as"
                            // editable = false;
                        }

                        FileReader.readTdlFile(tdlFileName, selectedProfile, options["currentTdlFolder"]).then((tdlFileResult) => {
                            if (tdlFileResult !== undefined) {
                                const tdl = tdlFileResult["tdl"];
                                windowAgentsManager.createDisplayWindow(
                                    {
                                        tdl: tdl,
                                        mode: mode,
                                        editable: editable,
                                        tdlFileName: tdlFileResult["fullTdlFileName"],
                                        macros: options["macros"],
                                        replaceMacros: options["replaceMacros"],
                                        hide: false,
                                        postCommand: options["postCommand"],
                                    },
                                    httpResponse
                                );
                            } else {
                                Log.error("0", `Cannot read tdl file ${tdlFileName}`);
                                if (windowAgent !== undefined) {
                                    const dialogInfo: { info: type_DialogMessageBox } = {
                                        info: {
                                            // command?: string | undefined;
                                            messageType: "error", // | "warning" | "info";
                                            humanReadableMessages: [`Failed to open file ${tdlFileName}`],
                                            rawMessages: [],
                                            // buttons?: type_DialogMessageBoxButton[] | undefined;
                                            // attachment?: any;
                                        }
                                    };
                                    if (windowAgent instanceof MainWindowAgent) {
                                        windowAgent.sendFromMainProcess("dialog-show-message-box", dialogInfo);
                                    } else if (windowAgent instanceof DisplayWindowAgent) {
                                        windowAgent.sendFromMainProcess("dialog-show-message-box", dialogInfo);
                                    }

                                }
                            }
                        });
                    } else if (path.extname(tdlFileName) === ".db" || path.extname(tdlFileName) === ".template") {
                        const db = FileReader.readDb(tdlFileName, selectedProfile, options["currentTdlFolder"]);
                        if (options["sendContentsToWindow"] === true) {
                            // for ChannelGraph
                            const displayWindowId = options["windowId"];

                            if (displayWindowId !== undefined && db !== undefined) {
                                const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(displayWindowId);
                                if (displayWindowAgent instanceof DisplayWindowAgent) {
                                    displayWindowAgent.sendFromMainProcess("db-file-contents", {
                                        displayWindowId: displayWindowId,
                                        fileName: tdlFileName,
                                        db: db, // array of objects, each object is a channel, e.g. channel name is NAME entry
                                    })
                                }
                            }
                        } else {
                            // for PvTable
                            const channelNames: string[] = [];
                            if (db !== undefined) {
                                for (let ii = 0; ii < db.length; ii++) {
                                    const channelName = db[ii]["NAME"];
                                    if (channelName !== undefined) {
                                        channelNames.push(channelName);
                                    }
                                }
                            }
                            this.createUtilityDisplayWindow(undefined, {
                                utilityType: "PvTable",
                                utilityOptions: { channelNames: channelNames }
                            });
                        }
                    } else {
                        if (windowAgent !== undefined) {
                            const dialogInfo: { info: type_DialogMessageBox } = {
                                info: {
                                    // command?: string | undefined;
                                    messageType: "error", // | "warning" | "info";
                                    humanReadableMessages: [`${tdlFileName} is not a .tdl, .edl .stp .db, or .template file`],
                                    rawMessages: [],
                                    // buttons?: type_DialogMessageBoxButton[] | undefined;
                                    // attachment?: any;
                                }
                            };
                            if (windowAgent instanceof MainWindowAgent) {
                                windowAgent.sendFromMainProcess("dialog-show-message-box", dialogInfo);
                            } else if (windowAgent instanceof DisplayWindowAgent) {
                                windowAgent.sendFromMainProcess("dialog-show-message-box", dialogInfo);
                            }

                        }

                    }
                }
                // windowAgentsManager.createDisplayWindows(tdlFileNames, mode, editable, macros, replaceMacros, currentTdlFolder);
            } else if (tdlFileNames.length === 0) {
                windowAgentsManager.createBlankDisplayWindow();
            }
            // else {
            // 	windowAgentsManager.createDisplayWindows(tdlFileNames, mode, editable, macros, replaceMacros, currentTdlFolder);
            // }
        } catch (e) {
            Log.error("0", e);
            if (windowAgent !== undefined) {
                const dialogInfo: { info: type_DialogMessageBox } = {
                    info: {
                        // command?: string | undefined;
                        messageType: "error", // | "warning" | "info";
                        humanReadableMessages: [`Failed to open file ${tdlFileNames}`],
                        rawMessages: [`${e}`],
                        // buttons?: type_DialogMessageBoxButton[] | undefined;
                        // attachment?: any;
                    }
                };
                if (windowAgent instanceof MainWindowAgent) {
                    windowAgent.sendFromMainProcess("dialog-show-message-box", dialogInfo);
                } else if (windowAgent instanceof DisplayWindowAgent) {
                    windowAgent.sendFromMainProcess("dialog-show-message-box", dialogInfo);
                }

            }
        }
    };


    /**
     * Re-read or read a tdl file and update display window. <br>
     *
     * We only provide the tdl file name. The tdl contents are read from this file. <br>
     *
     * The display window is not closed.
     *
     * @param {string} windowId Display window ID, this display window will be updated
     * @param {string} tdlFileName The tdl file that will be read/re-read
     * @param {"editing" | "operating"} mode The display window status (mode) of this display window
     * @param {boolean} editable If this display window is editable
     * @param {Array<Array<string, string>>} macros Externally provided macros
     * @param {boolean} replaceMacros If the externally provided macros should replace internally defined macros
     */
    // actually handle(Re)LoadTdlFile()
    handleLoadTdlFile = (event: any, options: IpcEventArgType["load-tdl-file"],) => {
        const windowId = options["displayWindowId"];
        const tdlFileName = options["tdlFileName"];
        const mode = options["mode"];
        const editable = options["editable"];
        const macros = options["externalMacros"];
        const replaceMacros = options["replaceMacros"];
        const currentTdlFolder = options["currentTdlFolder"];

        const windowAgentsManager = this.getMainProcess().getWindowAgentsManager();
        const selectedProfile = this.getMainProcess().getProfiles().getSelectedProfile();
        if (selectedProfile === undefined) {
            Log.error("0", "Profile not selected.");
            return;
        }
        try {
            const displayWindowAgent = windowAgentsManager.getAgent(windowId);
            if (!(displayWindowAgent instanceof DisplayWindowAgent)) {
                const errMsg = `Display window ${windowId} does not exists`;
                throw new Error(errMsg);
            }
            if (tdlFileName === "") {
                // load blank tdl
                displayWindowAgent.sendFromMainProcess("new-tdl", {
                    newTdl: FileReader.getBlankWhiteTdl(),
                    tdlFileName: "",
                    initialModeStr: mode,
                    editable: editable,
                    externalMacros: macros,
                    useExternalMacros: replaceMacros,
                    utilityType: undefined,
                    utilityOptions: {},
                });
            } else {
                // non-blocking, expand macros
                FileReader.readTdlFile(tdlFileName, selectedProfile, currentTdlFolder).then((result) => {
                    if (result !== undefined) {
                        displayWindowAgent.sendFromMainProcess("new-tdl", {
                            newTdl: result["tdl"],
                            tdlFileName: result["fullTdlFileName"],
                            initialModeStr: mode,
                            editable: editable,
                            externalMacros: macros,
                            useExternalMacros: replaceMacros,
                            utilityType: undefined,
                            utilityOptions: {},
                        });
                    } else {
                        Log.error("0", "tdl cannot be read");
                    }
                });
            }
        } catch (e) {
            Log.error("0", e);
        }
    };

    /**
     * Manually or automatically tdl file. <br>
     *
     * If saved successfully, always tell the display window about the saved tdl file name, as it may be changed.
     *
     * @param {type_tdl} tdl The JSON-style object
     * @param {string} tdlFileName The file name to be saved. If the file name is empty, use dialog to save as.
     */
    handleSaveTdlFile = (event: any, options: IpcEventArgType["save-tdl-file"]) => {
        const { windowId, tdl, tdlFileName1 } = options;
        const mainProcessMode = this.getMainProcess().getMainProcessMode();
        if (mainProcessMode === "web") {
            // make sure the file is allowed to save
            const bookmarks = this.getMainProcess().getProfiles().getSelectedProfile()?.getEntry("EPICS Custom Environment", "File Browser Bookmarks");
            let allowToSave = false;
            if (Array.isArray(bookmarks)) {
                for (const bookmark of bookmarks) {
                    const bookmarkFolder = bookmark[0];
                    const permissionToWrite = bookmark[1];
                    if (tdlFileName1.includes(bookmarkFolder) && typeof permissionToWrite === "string" && permissionToWrite.toLowerCase() === "yes") {
                        allowToSave = true;
                        break;
                    }
                }
            }
            if (allowToSave === false) {
                const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(windowId);
                if (displayWindowAgent instanceof DisplayWindowAgent) {
                    displayWindowAgent.sendFromMainProcess("dialog-show-message-box", {
                        info: {
                            // command?: string | undefined;
                            messageType: "error", // | "warning" | "info";
                            humanReadableMessages: [`You are not allowed to visit ${tdlFileName1}.`],
                            rawMessages: [],
                            // buttons?: type_DialogMessageBoxButton[] | undefined;
                            // attachment?: any;
                        }
                    })
                }
                return;
            }
        }
        // if tdlFileName is not "", then it must be the resolved full path of this tdl file
        let tdlFileName: string | undefined = tdlFileName1;
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(windowId);
        if (!(displayWindowAgent instanceof DisplayWindowAgent)) {
            Log.error("0", `No such display window ${windowId}. Cancel saving file.`);
            return;
        }
        Log.debug("0", "We are going to save TDL", tdlFileName1);
        try {
            // save as if the tdl is an in-memory display, or edl, or bob file
            if (tdlFileName === "" || tdlFileName.endsWith(".edl") || tdlFileName.endsWith(".stp") || tdlFileName.endsWith(".bob")) {
                if (this.getMainProcess().getMainProcessMode() === "desktop") {

                    tdlFileName = dialog.showSaveDialogSync({ title: "Save tdl file", filters: [{ name: "tdl", extensions: ["tdl", "json"] }] });
                } else if (this.getMainProcess().getMainProcessMode() === "ssh-server") {
                    displayWindowAgent.sendFromMainProcess("dialog-show-input-box",
                        {
                            info:
                            {
                                command: "save-tdl-file",
                                humanReadableMessages: ["Save display to"], // each string has a new line
                                buttons: [
                                    {
                                        text: "OK",
                                    },
                                    {
                                        text: "Cancel",
                                    }
                                ],
                                defaultInputText: "",
                                attachment: {
                                    windowId: windowId,
                                    tdl: tdl,
                                    tdlFileName1: "",
                                }
                            }
                        }
                    );
                    return;
                }
            }
            // cancel
            if (tdlFileName === undefined) {
                Log.debug("0", "Did not select TDL file name, cancel saving tdl");
                return;
            }

            fs.writeFile(tdlFileName, JSON.stringify(tdl, null, 4), (err) => {
                if (err) {
                    Log.error("0", err);
                    displayWindowAgent.sendFromMainProcess("dialog-show-message-box", {
                        info: {
                            // messageType: "error" | "warning" | "info",
                            // humanReadableMessages: string[],
                            // rawMessages: string[],
                            messageType: "error",
                            humanReadableMessages: [`Failed to save ${tdlFileName}`, "Please check the file permission."],
                            rawMessages: ["Below is the raw message:", `${err}`],
                        }
                    })

                } else {
                    Log.info("0", `Saved tdl to file ${tdlFileName}`);
                    if (tdlFileName !== undefined) {
                        displayWindowAgent.sendFromMainProcess("tdl-file-saved", {
                            newTdlFileName: tdlFileName
                        });
                    }
                }
            });
        } catch (e) {
            // errors should have been catched in callback
        }
    };

    /**
     * Save any type of data to a file
     */
    handleSaveDataToFile = (event: any, options: IpcEventArgType["save-data-to-file"]) => {
        const mainProcessMode = this.getMainProcess().getMainProcessMode();
        if (mainProcessMode === "web") {
            // do not save to web server
            return;
        }

        const { displayWindowId, data, preferredFileTypes } = options;
        Log.debug("0", "We are going to save a file");
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(displayWindowId);
        if (!(displayWindowAgent instanceof DisplayWindowAgent)) {
            Log.error("0", `No such display window ${displayWindowId}. Cancel saving file.`);
            return;
        }
        try {

            let fileName = options["fileName"];
            if (fileName === undefined) {
                if (this.getMainProcess().getMainProcessMode() === "desktop") {
                    fileName = dialog.showSaveDialogSync({ title: "Save data to file", filters: [{ name: "", extensions: preferredFileTypes }] });
                } else if (this.getMainProcess().getMainProcessMode() === "ssh-server") {
                    displayWindowAgent.sendFromMainProcess("dialog-show-input-box",
                        {
                            info:
                            {
                                command: "save-data-to-file",
                                humanReadableMessages: ["Save file to"], // each string has a new line
                                buttons: [
                                    {
                                        text: "OK",
                                    },
                                    {
                                        text: "Cancel",
                                    }
                                ],
                                defaultInputText: "",
                                attachment: options
                            }
                        }
                    );
                    return;
                }
            }

            if (fileName === undefined) {
                displayWindowAgent.sendFromMainProcess("dialog-show-message-box", {
                    info: {
                        messageType: "error", // | "warning" | "info",
                        humanReadableMessages: [`Failed to save file: file not selected`],
                        rawMessages: [""],
                    }
                });
                return;
            }

            fs.writeFile(fileName, JSON.stringify(data, null, 4), (err) => {
                if (err) {
                    Log.error("0", err);
                    displayWindowAgent.sendFromMainProcess("dialog-show-message-box", {
                        info: {
                            // messageType: "error" | "warning" | "info",
                            // humanReadableMessages: string[],
                            // rawMessages: string[],
                            messageType: "error",
                            humanReadableMessages: [`Failed to save ${fileName}`, "Please check the file permission."],
                            rawMessages: ["Below is the raw message:", `${err}`],
                        }
                    })

                } else {
                    Log.info("0", `Saved tdl to file ${fileName}`);
                }
            });
        } catch (e) {
            // errors should have been catched in callback
        }
    };


    /**
     * When the Root element of the new TDL in display window is rendered for the first time
     * The display window sends back this message to notify the main
     * process to show the pre-loaded window and update various fields. In this way, the pre-loaded window
     * does not flash.
     */
    handleNewTdlRendered = async (event: any, options: IpcEventArgType["new-tdl-rendered"]) => {
        const { displayWindowId, windowName, tdlFileName, mode } = options;

        const windowAgentsManager = this.getMainProcess().getWindowAgentsManager();
        const displayWindowAgent = windowAgentsManager.getAgent(displayWindowId);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            // ignore the preloaded display window's new TDL, and ignore the iframe embedded display
            if (displayWindowAgent !== windowAgentsManager.preloadedDisplayWindowAgent
                && displayWindowAgent !== windowAgentsManager.previewDisplayWindowAgent
                && displayWindowAgent.getBrowserWindow() !== undefined) {
                displayWindowAgent.show();
                // displayWindowAgent.setTdlFileName(tdlFileName);
                displayWindowAgent.setWindowName(windowName);

                // regular display window: start to take thumnail now, 1 s later, 3 s later, and every 5 s
                // if not an embedded window, take a thumbnail
                // take thumbnail only for regular window, not for embedded window
                // pre-loaded display does not take thumbnail
                displayWindowAgent._takeThumbnailInterval = setInterval(() => {
                    displayWindowAgent.takeThumbnail();
                }, 5000);

                displayWindowAgent.takeThumbnail(windowName, tdlFileName);
                setTimeout(() => {
                    displayWindowAgent.takeThumbnail(windowName, tdlFileName);
                }, 1000);
                setTimeout(() => {
                    displayWindowAgent.takeThumbnail(windowName, tdlFileName);
                }, 3000);
                // send local font names to display window
                displayWindowAgent.sendFromMainProcess("local-font-names",
                    {
                        localFontNames: this.getMainProcess().getLocalFontNames()
                    }
                );

                this.getMainProcess().getWindowAgentsManager().setDockMenu();
            } else if (displayWindowAgent === windowAgentsManager.previewDisplayWindowAgent) {
                await displayWindowAgent.takeThumbnail();
                const tdlFileName = displayWindowAgent.getTdlFileName();
                const fileBrowserDisplayWindowId = displayWindowAgent.getForFileBrowserWindowId();
                const fileBrowserWidgetKey = displayWindowAgent.getForFileBrowserWidgetKey();
                if (fileBrowserDisplayWindowId !== "" && fileBrowserWidgetKey !== "") {
                    const fileBrowserDisplayWindowAgent = windowAgentsManager.getAgent(fileBrowserDisplayWindowId);
                    if (fileBrowserDisplayWindowAgent instanceof DisplayWindowAgent) {
                        fileBrowserDisplayWindowAgent.sendFromMainProcess("fetch-thumbnail", {
                            widgetKey: fileBrowserWidgetKey,
                            tdlFileName: tdlFileName,
                            image: displayWindowAgent.getThumbnail(),
                        });
                        displayWindowAgent.setForFileBrowserWindowId("");
                        displayWindowAgent.setForFileBrowserWidgetKey("");
                    }
                }
            }
        }

    };

    handleZoomWindow = (event: any, options: IpcEventArgType["zoom-window"]) => {
        const { displayWindowId, zoomDirection } = options;
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(displayWindowId);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            const zoomFactor = displayWindowAgent.getZoomFactor();
            if (zoomDirection === "in") {
                displayWindowAgent.setZoomFactor(Math.min(zoomFactor + 0.05, 2));
            } else if (zoomDirection === "out") {
                displayWindowAgent.setZoomFactor(Math.max(zoomFactor - 0.05, 0.25));
            }
        }
    };

    handleMoveWindow = (event: any, data: IpcEventArgType["move-window"]) => {
        const displayWindowId = data["displayWindowId"];
        const dx = data["dx"];
        const dy = data["dy"];
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(displayWindowId);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            const browserWindow = displayWindowAgent.getBrowserWindow();
            if (browserWindow instanceof BrowserWindow) {
                const bounds = browserWindow.getBounds();
                browserWindow.setBounds({
                    x: bounds.x + dx,
                    y: bounds.y + dy,
                    width: bounds.width,
                    height: bounds.height
                })
            }
        }
    }

    handleSetWindowAlwaysOnTop = (event: any, data: IpcEventArgType["set-window-always-on-top"]) => {
        const displayWindowId = data["displayWindowId"];
        const state = data["state"];
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(displayWindowId);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            const browserWindow = displayWindowAgent.getBrowserWindow();
            if (browserWindow instanceof BrowserWindow) {
                browserWindow.setAlwaysOnTop(state);
            }
        }
    }

    /**
     * script is full path or empty string
     */
    handleWindowAttachedScript = (event: any, data: IpcEventArgType["window-attached-script"]) => {
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(data["displayWindowId"]);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            // editing
            if (data["action"] === "terminate") {
                Log.debug("0", "Terminate script", data["script"], "for window", data["displayWindowId"]);
                displayWindowAgent.terminateWebSocketClientThread();
                displayWindowAgent.removeWebSocketMonitorChannels();
            } else if (data["action"] === "run") {
                // operating
                Log.debug("0", "Run script", data["script"], "for window", data["displayWindowId"]);
                const port = this.getMainProcess().getWsPvServer().getPort();
                displayWindowAgent.createWebSocketClientThread(port, data["script"]);
            } else {
                Log.error("0", "window-attached-script event error: action must be either run or terminate");
            }
        } else {
            Log.error("0", "Cannot set mode for a non-display-window");
        }
    };

    handleMainWindowShowContextMenu = (event: any, options: IpcEventArgType["main-window-show-context-menu"]) => {
        const { menu } = options;
        const mainWidowAgent = this.getMainProcess().getWindowAgentsManager().getMainWindowAgent();
        if (mainWidowAgent !== undefined) {
            mainWidowAgent.showContextMenu(menu);
        }
    }

    handleDuplicateDisplay = (event: any, data: IpcEventArgType["duplicate-display"],) => {
        const { options, httpResponse } = data;
        const windowAgentsManager = this.getMainProcess().getWindowAgentsManager();
        // create a new display window
        windowAgentsManager.createDisplayWindow(
            {
                tdl: options["tdl"],
                mode: options["mode"],
                // always editable
                editable: true,
                tdlFileName: "",
                macros: options["externalMacros"],
                replaceMacros: true,
                hide: false,
            },
            httpResponse
        );
    };

    // -------------------- channel ------------------------

    /**
     * Get the data, always time out <br>
     *
     * It should be invoked after the meta data is obtained, otherwise we do not know the
     */
    handleTcaGet = async (event: any, options: IpcEventArgType["tca-get"]) => {
        const { channelName,
            displayWindowId,
            widgetKey,
            ioId,
            ioTimeout,
            dbrType,
            useInterval } = options;

        // (1)
        const windowAgentsManager = this.getMainProcess().getWindowAgentsManager();
        const displayWindowAgent = windowAgentsManager.getAgent(displayWindowId);
        if (!(displayWindowAgent instanceof DisplayWindowAgent)) {
            return;
        }

        let data = await displayWindowAgent.tcaGet(channelName, ioTimeout, dbrType);

        // (2)
        if (useInterval) {
            if (data["value"] !== undefined) {
                displayWindowAgent.addNewChannelData(channelName, data);
            }
        }
        // ioId and widgetKey are bounced back
        displayWindowAgent.sendFromMainProcess("tca-get-result",
            {
                ioId: ioId,
                widgetKey: widgetKey,
                newDbrData: data
            }
        );
        return data;
    };

    /**
     * Get the meta data, it is assumed
     */
    handleTcaGetMeta = async (event: any, options: IpcEventArgType["tca-get-meta"]) => {
        const { channelName,
            displayWindowId,
            widgetKey,
            ioId,
            timeout } = options;
        // (1)
        const windowAgentsManager = this.getMainProcess().getWindowAgentsManager();
        const displayWindowAgent = windowAgentsManager.getAgent(displayWindowId) as DisplayWindowAgent;
        if (displayWindowAgent === undefined) {
            return;
        }
        // in pva, meta data is actually pva type, which does not contain data
        let data = await displayWindowAgent.tcaGetMeta(channelName, timeout);
        if (channelName.startsWith("pva://") === false) {
            // ! attention
            // send twice: use periodic and the "tca-get-result" to ensure all the widgets in newly created window are updated
            // in the first place. Otherwise the race condition may happen, the widget key is removed from the forceUpdateWidgets list
            // after the widget is first rendered, causing this widget cannot update. If there is new dbrData pending for this
            // widget, this widget has a second chance to refresh.
            displayWindowAgent.addNewChannelData(channelName, data);
        }
        // (2)
        // ioId and widgetKey are bounced back
        Log.debug("0", "tca-get-meta result for", channelName, "is", data);
        if (channelName.startsWith("pva://")) {
            displayWindowAgent.sendFromMainProcess("fetch-pva-type",
                {
                    channelName: channelName,
                    widgetKey: widgetKey,
                    fullPvaType: data,
                    ioId: ioId,
                }
            );
        } else {
            displayWindowAgent.sendFromMainProcess("tca-get-result",
                {
                    ioId: ioId,
                    widgetKey: widgetKey,
                    newDbrData: data
                }
            );
        }
    };

    handleFetchPvaType = async (event: any, options: IpcEventArgType["fetch-pva-type"]) => {
        const { channelName,
            displayWindowId,
            widgetKey,
            ioId,
            timeout } = options;
        // (1)
        const windowAgentsManager = this.getMainProcess().getWindowAgentsManager();
        const displayWindowAgent = windowAgentsManager.getAgent(displayWindowId) as DisplayWindowAgent;
        if (displayWindowAgent === undefined) {
            return;
        }
        // in pva, meta data is actually pva type, which does not contain data
        let data = await displayWindowAgent.fetchPvaType(channelName, timeout);
        // (2)
        // ioId and widgetKey are bounced back
        Log.info("0", "fetch Pva Type for", channelName, "is", data);
        displayWindowAgent.sendFromMainProcess("fetch-pva-type",
            {
                channelName, widgetKey, fullPvaType: data, ioId
            }
        );
    };

    handleTcaMonitor = (event: any, options: IpcEventArgType["tca-monitor"]) => {
        const { displayWindowId, channelName } = options;
        const windowAgentsManager = this.getMainProcess().getWindowAgentsManager();
        const displayWindowAgent = windowAgentsManager.getAgent(displayWindowId) as DisplayWindowAgent;
        // if channel does not exist, create it
        displayWindowAgent.tcaMonitor(channelName);
    };

    handleTcaDestroy = (event: any, options: IpcEventArgType["tca-destroy"]) => {
        const { displayWindowId, channelName } = options;
        const windowAgentsManager = this.getMainProcess().getWindowAgentsManager();
        const displayWindowAgent = windowAgentsManager.getAgent(displayWindowId) as DisplayWindowAgent;
        displayWindowAgent.removeChannel(channelName);
    };

    /**
     * Put value.  <br>
     *
     * If this channel already exists, use the existing one. If not, create a temporary one. <br>
     *
     * (1) Create a temporary channel if necessary. <br>
     *
     * (2) PUT operation. If the timeout is `undefined`, it never times out. <br>
     *
     * (3) if the channel is temporary, destroy it softly (if other display windows are using it, then don't destroy)
     *
     * @param {type_dbrData} dbrData The data that will be put
     * @param {string} channelName Channel name
     * @param {number | undefined} ioTimeout Timeout [second]. If `undefined`, never time out.
     */
    handleTcaPut = async (event: any, options: IpcEventArgType["tca-put"],) => {
        let { channelName,
            displayWindowId,
            dbrData,
            ioTimeout,
            pvaValueField,
            ioId,
            waitNotify } = options;
        if (waitNotify === undefined) {
            waitNotify = false;
        }

        if (ioId === undefined) {
            ioId = -1;
        }


        const mainProcess = this.getMainProcess();
        const windowAgentsManager = mainProcess.getWindowAgentsManager();
        const channelAgentsManager = mainProcess.getChannelAgentsManager();

        const windowAgent = windowAgentsManager.getAgent(displayWindowId) as DisplayWindowAgent;
        if (windowAgent === undefined) {
            const errMsg = `Cannot find window with ID ${displayWindowId}`;
            throw new Error(errMsg);
        }
        const status = await windowAgent.tcaPut(channelName, dbrData, ioTimeout, pvaValueField, waitNotify);

        if (waitNotify === true) {
            const displayWindowAgent = windowAgentsManager.getAgent(displayWindowId);
            if (displayWindowAgent instanceof DisplayWindowAgent) {
                displayWindowAgent.sendFromMainProcess("tca-put-result", {
                    channelName: channelName,
                    displayWindowId: displayWindowId,
                    ioId: ioId,
                    waitNotify: waitNotify,
                    status: status,
                })
            }
        }

    };

    // ------------------------------------------------------------

    createUtilityDisplayWindow = (event: any, options: IpcEventArgType["create-utility-display-window"]) => {
        let { utilityType, utilityOptions, httpResponse } = options;
        const windowAgentsManager = this.getMainProcess().getWindowAgentsManager();
        if (utilityType === "ProfilesViewer") {
            utilityOptions = {};
            utilityOptions["profiles"] = this.getMainProcess().getProfiles().serialize();
            utilityOptions["profilesFileName"] = this.getMainProcess().getProfiles().getFilePath();
            const context = this.getMainProcess().getChannelAgentsManager().getContext();
            if (context === undefined) {
                utilityOptions["epics-ca-env"] = {};
            } else {
                const envInstance = context.getEnvInstance();
                if (envInstance !== undefined) {
                    utilityOptions["epics-ca-env"] = {
                        "Values used in TDM runtime": envInstance.getEnv(),
                        "TDM uses": envInstance.getEnvSource(),
                        "User defined": envInstance.getEnvUser(),
                        "Operating system defined": envInstance.getEnvOs(),
                        "EPICS default": envInstance.getEnvDefault(),
                    };
                } else {
                    utilityOptions["epics-ca-env"] = {};
                }
            }
            utilityOptions["selected-profile-name"] = { "Selected profile": this.getMainProcess().getProfiles().getSelectedProfileName() };
            utilityOptions["log-file-name"] = this.getMainProcess().getLogFileName();
            utilityOptions["log-file-name-in-profiles"] = this.getMainProcess().getProfiles().getLogFile();
        } else if (utilityType === "TdlViewer") {
            // read script
            // options:
            // {
            //     tdl: tdl,
            //     externalMacros: externalMacros,
            //     tdlFileName: tdlFileName,
            // }
            const tdl = utilityOptions["tdl"];
            let scriptFullFileName = "";
            let scriptFileContents = "";
            if (tdl !== undefined) {
                const canvasTdl = tdl["Canvas"];
                if (canvasTdl !== undefined) {
                    const scriptFileName = canvasTdl["script"];
                    if (scriptFileName !== undefined && scriptFileName.trim() !== "" && (scriptFileName.trim().endsWith(".py") || scriptFileName.trim().endsWith(".js"))) {
                        if (path.isAbsolute(scriptFileName)) {
                            scriptFullFileName = scriptFileName;
                        } else {
                            scriptFullFileName = path.join(utilityOptions["tdlFileName"], scriptFileName);
                        }
                        // try to read the script file
                        try {
                            scriptFileContents = fs.readFileSync(scriptFullFileName, "utf-8");
                        } catch (e) {
                            Log.error("0", "Cannot read script file", scriptFullFileName, e);
                        }
                    } else if ((!scriptFileName.trim().endsWith(".py") || !scriptFileName.trim().endsWith(".js"))) {
                        scriptFullFileName = scriptFileName;
                        scriptFileContents = "TDM can only run Python or JavaScript script."
                    }
                }
            }
            utilityOptions["scriptFullFileName"] = scriptFullFileName;
            utilityOptions["scriptFileContents"] = scriptFileContents;
        } else if (utilityType === "CaSnooper") {
            let port = -1;
            utilityOptions = {};
            utilityOptions["profiles"] = this.getMainProcess().getProfiles().serialize();
            utilityOptions["profilesFileName"] = this.getMainProcess().getProfiles().getFilePath();
            const context = this.getMainProcess().getChannelAgentsManager().getContext();
            if (context !== undefined) {
                const envInstance = context.getEnvInstance();
                if (envInstance !== undefined) {
                    const env = envInstance.getEnv();
                    if (typeof env !== "number" && typeof env !== "string" && !Array.isArray(env) && env !== undefined) {
                        const portTmp = env["EPICS_CA_SERVER_PORT"];
                        if (typeof portTmp === "number") {
                            port = portTmp;
                        }
                    }
                }
            }
            utilityOptions["EPICS_CA_SERVER_PORT"] = port;
        } else if (utilityType === "Casw") {
            let port = -1;
            utilityOptions = {};
            utilityOptions["profiles"] = this.getMainProcess().getProfiles().serialize();
            utilityOptions["profilesFileName"] = this.getMainProcess().getProfiles().getFilePath();
            const context = this.getMainProcess().getChannelAgentsManager().getContext();
            if (context !== undefined) {
                const envInstance = context.getEnvInstance();
                if (envInstance !== undefined) {
                    const env = envInstance.getEnv();
                    if (typeof env !== "number" && typeof env !== "string" && !Array.isArray(env) && env !== undefined) {
                        const portTmp = env["EPICS_CA_REPEATER_PORT"];
                        if (typeof portTmp === "number") {
                            port = portTmp;
                        }
                    }
                }
            }
            utilityOptions["EPICS_CA_REPEATER_PORT"] = port;
        } else if (utilityType === "Talhk") {
            // utilityOptions
            // { serverAddress: "http://localhost:4000" }
        } else if (utilityType === "FileBrowser") {
            // type of utilityOptions: {path: string, parentDisplayWindowId: string, modal: boolean}
            if (utilityOptions["path"] === "$HOME") {
                utilityOptions["path"] = os.homedir();
            }
        }

        windowAgentsManager.createUtilityDisplayWindow(utilityType, utilityOptions, httpResponse);
    };

    // ----------------------- context menu -----------------

    handleShowContextMenu = (event: any, data: IpcEventArgType["show-context-menu"]) => {
        let { mode, displayWindowId, widgetKeys, options } = data;
        if (options === undefined) {
            options = {};
        }
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(displayWindowId);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            displayWindowAgent.showContextMenu(mode, widgetKeys, options);
        }
    };


    handleShowContextMenuSidebar = (event: any, data: IpcEventArgType["show-context-menu-sidebar"]) => {
        let { mode, widgetKeys, options, displayWindowId } = data;
        if (options === undefined) {
            options = {};
        }
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(displayWindowId);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            displayWindowAgent.showContextMenuSidebar(mode, widgetKeys, options);
        }
    };

    // ---------------------- general file --------------------------
    handleSelectAFile = (event: any, data: IpcEventArgType["select-a-file"]) => {
        let { options, fileName1, } = data;
        if (fileName1 === undefined) {
            fileName1 = "";
        }

        const displayWindowId = options["displayWindowId"];
        if (displayWindowId === undefined) {
            return;
        }
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(displayWindowId) as DisplayWindowAgent;
        let fileNames: string[] | undefined = undefined;
        if (fileName1 !== "") {
            fileNames = [fileName1];
        } else if (fileName1 === "") {
            if (this.getMainProcess().getMainProcessMode() === "desktop") {
                const fileFilters = options["filterType"] === "tdl"
                    ? [{ name: "tdl", extensions: ["tdl", "edl", "stp", "bob", "db", "template"] }]
                    : options["filterType"] === "media"
                        ? [{ name: "media", extensions: ["jpg", "jpeg", "png", "gif", "svg", "bmp", "pdf", "mp4", "ogg", "webm", "mp3", "mov"] }]
                        : options["filterType"] === "script"
                            ? [{ name: "script", extensions: ["py", "js"] }]
                            : options["filterType"] === "file-converter"
                                ? [{ name: "EDM Files", extensions: ["edl"] }]
                                : [{ name: "picture", extensions: ["jpg", "jpeg", "png", "gif", "svg", "bmp"] }];
                // default to open file
                let properties = options["properties"] === undefined ? ["openFile"] : options["properties"];
                // ! linux cannot select any file if properties is set, if it is not set, we cannot select folder
                // ! file-converter is the only
                if (options["filterType"] === "file-converter" && os.platform() === "linux") {
                    properties = undefined;
                }
                fileNames = dialog.showOpenDialogSync({
                    title: "Select a file",
                    filters: fileFilters,
                    properties: properties,
                });
            } else if (this.getMainProcess().getMainProcessMode() === "ssh-server" || this.getMainProcess().getMainProcessMode() === "web") {
                displayWindowAgent.sendFromMainProcess("dialog-show-input-box", {
                    info: {
                        command: "select-a-file",
                        humanReadableMessages: ["Select a file"], // each string has a new line
                        buttons: [
                            {
                                text: "OK",
                            },
                            {
                                text: "Cancel",
                            }
                        ],
                        defaultInputText: "",
                        attachment: options
                    }
                })
                return;
            }
        }
        if (fileNames !== undefined) {
            const fileName = fileNames[0];
            if (fileName !== undefined) {
                // bounce back options
                displayWindowAgent.sendFromMainProcess("select-a-file", {
                    options, fileName
                });
            }
        }
    };

    // -------------------- embedded display events ----------------------

    /**
     * (1) create display window agent
     */
    handleObtainIframeUuid = (event: any, options: IpcEventArgType["obtain-iframe-uuid"],) => {

        const selectedProfile = this.getMainProcess().getProfiles().getSelectedProfile();

        if (options["tdl"] === undefined) {

            FileReader.readTdlFile(options["tdlFileName"], selectedProfile, options["currentTdlFolder"]).then((tdlFileResult) => {
                if (tdlFileResult !== undefined) {
                    const tdl = tdlFileResult.tdl;
                    // do not block (await)
                    this.getMainProcess().getWindowAgentsManager().createIframeDisplay(
                        {
                            tdl: tdl,
                            mode: options["mode"],
                            editable: false,
                            // tdlFileName: options["tdlFileName"],
                            tdlFileName: tdlFileResult["fullTdlFileName"],
                            macros: options["macros"],
                            replaceMacros: options["replaceMacros"],
                            hide: false,
                            utilityType: undefined,
                            utilityOptions: undefined,
                        },
                        options["widgetKey"],
                        options["displayWindowId"]
                    );
                }
            });
        } else {
            const tdl = options["tdl"];
            this.getMainProcess().getWindowAgentsManager().createIframeDisplay(
                {
                    tdl: tdl,
                    mode: options["mode"],
                    editable: false,
                    tdlFileName: options["tdlFileName"],
                    macros: options["macros"],
                    replaceMacros: options["replaceMacros"],
                    hide: false,
                    utilityType: undefined,
                    utilityOptions: undefined,
                },
                options["widgetKey"],
                options["displayWindowId"]
            );
        }
    };

    handleSwitchIframeDisplayTab = (event: any, options: IpcEventArgType["switch-iframe-display-tab"],) => {
        Log.debug("0", "try to obtain iframe uuid");
        const selectedProfile = this.getMainProcess().getProfiles().getSelectedProfile();
        FileReader.readTdlFile(options["tdlFileName"], selectedProfile, options["currentTdlFolder"])
            .then((tdlFileResult) => {
                if (tdlFileResult !== undefined) {
                    const tdl = tdlFileResult.tdl;
                    // do not block (await)
                    this.getMainProcess().getWindowAgentsManager().createIframeDisplay(
                        {
                            tdl: tdl,
                            mode: options["mode"],
                            editable: false,
                            tdlFileName: tdlFileResult["fullTdlFileName"],
                            macros: options["macros"],
                            replaceMacros: false,
                            hide: false,
                            utilityType: undefined,
                            utilityOptions: undefined,
                        },
                        options["widgetKey"],
                        options["displayWindowId"]
                    );
                }
            })
            .finally(() => {
                const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(options["iframeDisplayId"]);
                if (displayWindowAgent instanceof DisplayWindowAgent) {
                    displayWindowAgent.handleWindowClosed();
                }
            });
    };

    handleCloseIframeDisplay = (event: any, options: IpcEventArgType["close-iframe-display"]) => {
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(options["displayWindowId"]);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            displayWindowAgent.handleWindowClosed();
        }
    };

    // ------------------------- actions ------------------------

    handleOpenWebpage = (event: any, options: IpcEventArgType["open-webpage"]) => {
        let { url } = options;
        // replace ${tdm_root} with the root path of TDM
        url = url.replace("${tdm_root}", path.join(__dirname, "..", "..", ".."));
        const windowAgentsManager = this.getMainProcess().getWindowAgentsManager();
        windowAgentsManager.createWebDisplayWindow(url);
    };

    handleExecuteCommand = (event: any, data: IpcEventArgType["execute-command"]) => {
        try {
            const command = data["command"];
            let commandArray = command.split(" ");

            if (command.startsWith(`"`)) {
                // find the second \"
                const tmp = command.split(`"`);
                const commandHead = tmp[1];
                tmp.shift();
                tmp.shift();
                commandArray = [commandHead, ...tmp.join(`"`).split(" ")];
            }

            if (commandArray.length >= 1) {
                const commandHead = commandArray[0];
                commandArray.shift();
                // spawn a new process from main process
                const childProcess = spawn(commandHead, commandArray);

                childProcess.stdout.on("data", (data) => {
                    Log.info("0", `stdout: ${data}`);
                });

                childProcess.stderr.on("data", (data) => {
                    Log.info("0", `stderr: ${data}`);
                });

                childProcess.on("close", (code) => {
                    Log.info("0", `child process exited with code ${code}`);
                });

                childProcess.on("error", (err) => {
                    // a failed spawn is not catched, but in the error event
                    const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(data["displayWindowId"]);
                    if (displayWindowAgent instanceof DisplayWindowAgent) {
                        displayWindowAgent.sendFromMainProcess("dialog-show-message-box", {
                            info: {
                                // command?: string | undefined,
                                messageType: "error", // | "warning" | "info", // symbol
                                humanReadableMessages: [`Failed to execute command "${data["command"]}"`], // each string has a new line
                                rawMessages: [`${err}`], // computer generated messages
                                // buttons?: type_DialogMessageBoxButton[] | undefined,
                                // attachment?: any,
                            }
                        })
                    }
                });
            }
        } catch (e) {
            // just in case the spawn throws an exception
            // spawn failed
            const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(data["displayWindowId"]);
            if (displayWindowAgent instanceof DisplayWindowAgent) {
                displayWindowAgent.sendFromMainProcess("dialog-show-message-box", {
                    info: {
                        // command?: string | undefined,
                        messageType: "error", // | "warning" | "info", // symbol
                        humanReadableMessages: [`Failed to execute command "${data["command"]}"`], // each string has a new line
                        rawMessages: [`${e}`], // computer generated messages
                        // buttons?: type_DialogMessageBoxButton[] | undefined,
                        // attachment?: any,
                    }
                })
            }
        }
    }


    // --------------------- dataviewer ---------------------------
    handleDataViewerExportData = (
        event: any,
        options: IpcEventArgType["data-viewer-export-data"]
    ) => {
        let { fileName1, displayWindowId, data } = options;
        if (fileName1 === undefined) {
            fileName1 = "";
        }
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(displayWindowId);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            const browserWindow = displayWindowAgent.getBrowserWindow();
            if (browserWindow instanceof BrowserWindow) {
                let fileName = fileName1;

                if (fileName === "") {
                    if (this.getMainProcess().getMainProcessMode() === "desktop") {
                        fileName = dialog.showSaveDialogSync(browserWindow, {
                            title: "Select a file to save to",
                            filters: [
                                {
                                    name: "json",
                                    extensions: ["json"],
                                },
                            ],
                        });
                    } else if (this.getMainProcess().getMainProcessMode() === "ssh-server") {
                        displayWindowAgent.sendFromMainProcess("dialog-show-input-box",
                            {
                                info: {
                                    command: "data-viewer-export-data",
                                    humanReadableMessages: ["Save file to"], // each string has a new line
                                    buttons: [
                                        {
                                            text: "OK",
                                        },
                                        {
                                            text: "Cancel",
                                        }
                                    ],
                                    defaultInputText: "",
                                    attachment: {
                                        displayWindowId: displayWindowId,
                                        data: data,
                                        fileName1: fileName1,
                                    }
                                }
                            }
                        );
                        return;
                    }
                }
                try {
                    fs.writeFileSync(fileName, JSON.stringify(data, null, 4));
                    Log.debug("0", "Successfully saved DataViewer data to", fileName);
                } catch (e) {
                    Log.error("0", `Cannot save DataViewer data to file ${fileName}`);
                    displayWindowAgent.sendFromMainProcess("dialog-show-message-box", {
                        info: {
                            // command?: string | undefined,
                            messageType: "error", // | "warning" | "info", // symbol
                            humanReadableMessages: [`Cannot save DataViewer data to file ${fileName}`], // each string has a new line
                            rawMessages: [`${e}`], // computer generated messages
                            // buttons?: type_DialogMessageBoxButton[] | undefined,
                            // attachment?: any,
                        }
                    })
                }
            }
        }
    };

    handleProcessesInfo = async (event: any, data: IpcEventArgType["processes-info"]) => {
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
        for (let windowAgent of Object.values(this.getMainProcess().getWindowAgentsManager().getAgents())) {
            if ((windowAgent instanceof DisplayWindowAgent) || (windowAgent instanceof MainWindowAgent)) {
                const processInfo = await windowAgent.getProcessInfo(data["withThumbnail"]);
                processesInfo.push(processInfo);
            }
        }

        // send back to the window
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(data["displayWindowId"]);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            displayWindowAgent.sendFromMainProcess("processes-info", {
                widgetKey: data["widgetKey"],
                processesInfo: processesInfo,
            });
        }
    }

    handleEpicsStats = async (event: any, data: IpcEventArgType["epics-stats"]) => {

        const channelAgentsManager = this.getMainProcess().getChannelAgentsManager();
        const epicsContext = channelAgentsManager.getContext();
        if (epicsContext !== undefined) {
            const epicsStats = channelAgentsManager.generateEpicsStats();

            const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(data["displayWindowId"]);
            if (displayWindowAgent instanceof DisplayWindowAgent) {
                displayWindowAgent.sendFromMainProcess("epics-stats", {
                    widgetKey: data["widgetKey"],
                    epicsStats: epicsStats as any,
                });
            }

        }

    }

    handleCaSnooperCommand = (event: any, options: IpcEventArgType["ca-snooper-command"]) => {
        if (options["command"] === "start") {
            // start ca snooper server if not exist yet
            this.getMainProcess().createCaSnooperServer(options["displayWindowId"]);
        } else if (options["command"] === "stop") {
            const caSnooperServer = this.getMainProcess().getCaSnooperServer();
            if (caSnooperServer !== undefined) {
                caSnooperServer.stopCaSnooperServer(options["displayWindowId"]);
            }
        }
    }

    handleRequestEpicsDbd = (event: any, options: IpcEventArgType["request-epics-dbd"]) => {
        const dbdFiles = this.getMainProcess().getChannelAgentsManager().getDbdFiles();
        const menus = dbdFiles.getMenus();
        const recordTypes = dbdFiles.getRecordTypes();
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(options["displayWindowId"]);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            displayWindowAgent.sendFromMainProcess("request-epics-dbd", {
                widgetKey: options["widgetKey"],
                menus: menus,
                recordTypes: recordTypes,
            })
        }
    }



    handleCaswCommand = (event: any, options: IpcEventArgType["ca-sw-command"]) => {
        if (options["command"] === "start") {
            // start ca sw server if not exist yet
            this.getMainProcess().createCaswServer(options["displayWindowId"]);
        } else if (options["command"] === "stop") {
            const caswServer = this.getMainProcess().getCaswServer();
            if (caswServer !== undefined) {
                caswServer.stopCaswServer(options["displayWindowId"]);
            }
        }
    }

    handleFetchFolderContent = (event: any, options: IpcEventArgType["fetch-folder-content"]) => {

        // web mode: only the folders and their sub-folders explicitly defined in bookmarks can be visited
        if (this.getMainProcess().getMainProcessMode() === "web") {
            const folderPath = options["folderPath"];
            let allowToRead = false;
            const selectedProfile = this.getMainProcess().getProfiles().getSelectedProfile();
            if (selectedProfile !== undefined) {
                const bookmarks = selectedProfile.getEntry("EPICS Custom Environment", "File Browser Bookmarks");
                if (bookmarks !== undefined) {
                    for (const bookmark of bookmarks) {
                        const bookmarkFolder = bookmark[0];
                        if (typeof bookmarkFolder === "string") {
                            if (folderPath.includes(bookmarkFolder)) {
                                allowToRead = true;
                                break;
                            }
                        }
                    }
                }
            }
            if (allowToRead === false) {
                const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(options["displayWindowId"]);
                if (displayWindowAgent instanceof DisplayWindowAgent) {
                    displayWindowAgent.sendFromMainProcess("dialog-show-message-box", {
                        info: {
                            // command?: string | undefined;
                            messageType: "error", // | "warning" | "info";
                            humanReadableMessages: [`You are not allowed to visit ${folderPath}.`],
                            rawMessages: [],
                            // buttons?: type_DialogMessageBoxButton[] | undefined;
                            // attachment?: any;
                        }
                    })
                }
                return;
            }
        }


        try {
            // read the folder
            const folderPath = options["folderPath"];
            const rawResult = fs.readdirSync(folderPath);
            const result: {
                name: string, // only the name
                type: "file" | "folder",
                size: number,
                timeModified: number,
            }[] = [];
            for (const name of rawResult) {
                const fullPath = path.join(folderPath, name);
                const stats = fs.statSync(fullPath);
                const type = stats.isDirectory() ? "folder" : "file";
                const size = stats.size; // byte
                const timeModified = stats.mtime; // Date 
                result.push({
                    name: name,
                    type: type,
                    size: size,
                    timeModified: timeModified.getTime(),
                });
            }
            // send back
            const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(options["displayWindowId"]);
            if (displayWindowAgent instanceof DisplayWindowAgent) {
                displayWindowAgent.sendFromMainProcess("fetch-folder-content", {
                    widgetKey: options["widgetKey"],
                    folderContent: result,
                })
            }
        } catch (e) {
            Log.error("0", `File Browser -- Failed to read folder ${options["folderPath"]}`);
            const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(options["displayWindowId"]);
            if (displayWindowAgent instanceof DisplayWindowAgent) {
                displayWindowAgent.sendFromMainProcess("dialog-show-message-box", {
                    info: {
                        // command?: string | undefined;
                        messageType: "error", // | "warning" | "info";
                        humanReadableMessages: [`Failed to read folder ${options["folderPath"]}.`],
                        rawMessages: [],
                        // buttons?: type_DialogMessageBoxButton[] | undefined;
                        // attachment?: any;
                    }
                })
                // let 
                displayWindowAgent.sendFromMainProcess("fetch-folder-content", {
                    widgetKey: options["widgetKey"],
                    folderContent: [],
                    success: false,
                })
            }
        }

    }

    handleFileBrowserCommand = (event: any, message: IpcEventArgType["file-browser-command"]) => {
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(message["displayWindowId"]);
        if (!(displayWindowAgent instanceof DisplayWindowAgent)) {
            return;
        }
        // need explicit write permission in web mode
        if (this.getMainProcess().getMainProcessMode() === "web") {
            const folderPath = typeof message["folder"] === "string" ? message["folder"] : typeof message["fullFileName"] === "string" ? message["fullFileName"] : typeof message["fullFolderName"] === "string" ? message["fullFolderName"] : "";
            let allowToWrite = false;
            const selectedProfile = this.getMainProcess().getProfiles().getSelectedProfile();
            if (selectedProfile !== undefined) {
                const bookmarks = selectedProfile.getEntry("EPICS Custom Environment", "File Browser Bookmarks");
                if (bookmarks !== undefined) {
                    for (const bookmark of bookmarks) {
                        const bookmarkFolder = bookmark[0];
                        const permissionToWrite = bookmark[1];
                        if (typeof bookmarkFolder === "string" && typeof permissionToWrite === "string") {
                            if (folderPath.includes(bookmarkFolder) && permissionToWrite.toLowerCase() === "yes") {
                                allowToWrite = true;
                                break;
                            }
                        }
                    }
                }
            }
            if (allowToWrite === false) {
                const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(message["displayWindowId"]);
                if (displayWindowAgent instanceof DisplayWindowAgent) {
                    displayWindowAgent.sendFromMainProcess("dialog-show-message-box", {
                        info: {
                            // command?: string | undefined;
                            messageType: "error", // | "warning" | "info";
                            humanReadableMessages: [`You are not allowed to ${message["command"].replaceAll("-", " ")} for ${folderPath}.`],
                            rawMessages: [],
                            // buttons?: type_DialogMessageBoxButton[] | undefined;
                            // attachment?: any;
                        }
                    })
                }
                return;
            }
        }




        if (message["command"] === "change-item-name") {
            const folder = message["folder"];
            const oldName = message["oldName"];
            const newName = message["newName"];
            if (folder === undefined || oldName === undefined || newName === undefined) {
                return;
            }
            const fullOldFileName = path.join(folder, oldName);
            const fullNewFileName = path.join(folder, newName);
            if (path.isAbsolute(fullOldFileName) && path.isAbsolute(fullNewFileName)) {
                try {
                    if (fs.existsSync(fullNewFileName)) {
                        throw new Error(`File ${fullNewFileName} already exists`);
                    }

                    fs.renameSync(fullOldFileName, fullNewFileName);
                    displayWindowAgent.sendFromMainProcess("file-browser-command", {
                        ...message,
                        success: true,
                    })
                } catch (err) {
                    Log.error('Error renaming file:', err);
                    // send error message to renderer process
                    displayWindowAgent.sendFromMainProcess("dialog-show-message-box", {
                        info: {
                            // command?: string | undefined;
                            messageType: "error", // | "warning" | "info";
                            humanReadableMessages: [`Failed to change file name from ${oldName} to ${newName}`, `Reason: ${err}`],
                            rawMessages: [],
                            // buttons?: type_DialogMessageBoxButton[] | undefined;
                            // attachment?: any;
                        }
                    })

                    displayWindowAgent.sendFromMainProcess("file-browser-command", {
                        ...message,
                        success: false,
                    })
                }
            }
        } else if (message["command"] === "create-tdl-file") {
            const fullFileName = message["fullFileName"];
            if (fullFileName === undefined) {
                return;
            }
            // create empty tdl file
            const tdl = FileReader.getBlankWhiteTdl();
            try {
                fs.writeFileSync(fullFileName, JSON.stringify(tdl, null, 4));
                displayWindowAgent.sendFromMainProcess("file-browser-command", {
                    ...message,
                    success: true,
                })

            } catch (e) {
                displayWindowAgent.sendFromMainProcess("dialog-show-message-box", {
                    info: {
                        // command?: string | undefined;
                        messageType: "error", // | "warning" | "info";
                        humanReadableMessages: [`Failed to create file ${fullFileName}`, `Reason ${e}`],
                        rawMessages: [],
                        // buttons?: type_DialogMessageBoxButton[] | undefined;
                        // attachment?: any;
                    }
                })
                displayWindowAgent.sendFromMainProcess("file-browser-command", {
                    ...message,
                    success: false,
                })
            }
        } else if (message["command"] === "create-folder") {
            const fullFolderName = message["fullFolderName"];
            if (fullFolderName === undefined) {
                return;
            }
            // create empty tdl file
            try {
                fs.mkdirSync(fullFolderName);
                displayWindowAgent.sendFromMainProcess("file-browser-command", {
                    ...message,
                    success: true,
                })

            } catch (e) {
                displayWindowAgent.sendFromMainProcess("dialog-show-message-box", {
                    info: {
                        // command?: string | undefined;
                        messageType: "error", // | "warning" | "info";
                        humanReadableMessages: [`Failed to create file ${fullFolderName}`, `Reason: ${e}`],
                        rawMessages: [],
                        // buttons?: type_DialogMessageBoxButton[] | undefined;
                        // attachment?: any;
                    }
                })
                displayWindowAgent.sendFromMainProcess("file-browser-command", {
                    ...message,
                    success: false,
                })
            }
        }
    }

    handleFetchThumbnail = async (event: any, message: IpcEventArgType["fetch-thumbnail"]) => {
        // open this tdl file in preview display window
        if (this.getMainProcess().getMainProcessMode() === "web") {
            return;
        }

        const windowAgentsManager = this.getMainProcess().getWindowAgentsManager();
        const selectedProfile = this.getMainProcess().getProfiles().getSelectedProfile();
        if (selectedProfile === undefined) {
            Log.error("0", "Profile not selected!");
            return;
        }

        let editable = false;
        const mode = "editing";
        const fileBrowserDisplayWindowId = message["displayWindowId"];
        let fileBrowserDisplayWindowAgent: MainWindowAgent | DisplayWindowAgent | undefined = undefined;
        if (fileBrowserDisplayWindowId !== undefined) {
            fileBrowserDisplayWindowAgent = windowAgentsManager.getAgent(fileBrowserDisplayWindowId);
        }

        const tdlFileName = message["tdlFileName"];

        FileReader.readTdlFile(tdlFileName, selectedProfile).then((tdlFileResult) => {
            if (tdlFileResult !== undefined) {
                const tdl = tdlFileResult["tdl"];
                const previewDisplayWindowAgent = this.getMainProcess().getWindowAgentsManager().previewDisplayWindowAgent;
                if (previewDisplayWindowAgent instanceof DisplayWindowAgent) {
                    // todo: race condition, 2 requests at the same time
                    previewDisplayWindowAgent.setForFileBrowserWindowId(fileBrowserDisplayWindowId);
                    previewDisplayWindowAgent.setForFileBrowserWidgetKey(message["widgetKey"]);

                    previewDisplayWindowAgent.sendFromMainProcess("new-tdl", {
                        newTdl: tdl,
                        tdlFileName: tdlFileName,
                        initialModeStr: mode,
                        editable: editable,
                        externalMacros: [],
                        useExternalMacros: false,
                        // utilityType: options["utilityType"],
                        // utilityOptions: options["utilityOptions"] === undefined ? {} : options["utilityOptions"],
                    });
                } else {
                    Log.error("0", `Cannot read tdl file ${tdlFileName}`);
                    if (fileBrowserDisplayWindowAgent instanceof DisplayWindowAgent) {
                        fileBrowserDisplayWindowAgent.sendFromMainProcess("dialog-show-message-box", {
                            info: {
                                // command?: string | undefined;
                                messageType: "error", // | "warning" | "info";
                                humanReadableMessages: [`The hidden preview display is not ready.`],
                                rawMessages: [],
                                // buttons?: type_DialogMessageBoxButton[] | undefined;
                                // attachment?: any;
                            }
                        })
                    }
                }
            } else {
                Log.error("0", `Cannot read tdl file ${tdlFileName}`);
                if (fileBrowserDisplayWindowAgent instanceof DisplayWindowAgent) {
                    fileBrowserDisplayWindowAgent.sendFromMainProcess("dialog-show-message-box", {
                        info: {
                            // command?: string | undefined;
                            messageType: "error", // | "warning" | "info";
                            humanReadableMessages: [`Failed to open file ${tdlFileName}`],
                            rawMessages: [],
                            // buttons?: type_DialogMessageBoxButton[] | undefined;
                            // attachment?: any;
                        }
                    })
                }
            }
        })


        // take screenshot for this window
        // send back
    }

    // --------------------- ssh login ----------------------
    handleSshPasswordPromptResult = (event: any, result: IpcEventArgType["ssh-password-prompt-result"]) => {
        Log.info("0", result)
        const sshMainProcess = this.getMainProcess(); //.getMainProcesses().getProcess(result["sshMainProcessId"]);
        if (sshMainProcess instanceof MainProcess) {
            sshMainProcess.getSshClient()?._passwordPromptResolve({
                password: result["password"],
            });
        } else {
            Log.error("0", "Cannot find main process", result["sshMainProcessId"]);
        }
    }

    handleCancelSshConnection = (event: any, data: IpcEventArgType["cancel-ssh-connection"]) => {
        const sshMainProcess = this.getMainProcess(); //.getMainProcesses().getProcess(data["sshMainProcessId"]);
        if (sshMainProcess instanceof MainProcess) {
            // simply quit
            sshMainProcess.quit();
        } else {
            Log.error("0", "Cannot find main process", data["sshMainProcessId"]);
        }

    }

    handleTerminalCommand = (event: any, data: IpcEventArgType["terminal-command"]) => {
        let result: any = [];
        if (data["command"] === "os.homedir") {
            result = [os.homedir()];
        } else if (data["command"] === "os.userInfo") {
            result = [os.userInfo()];
        } else if (data["command"] === "fs.readdir") {
            // result = [os.userInfo()];
            const dirName = data["args"][0];
            fs.readdir(dirName, {},
                (err, result) => {
                    if (err) {
                        return;
                    }
                    const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(data["displayWindowId"]);
                    if (displayWindowAgent instanceof DisplayWindowAgent) {
                        displayWindowAgent.sendFromMainProcess("terminal-command-result", {
                            widgetKey: data["widgetKey"],
                            ioId: data["ioId"],
                            command: data["command"],
                            result: [result],
                        })
                    }
                })
            return;
        } else if (data["command"] === "fs.stat") {
            // result = [os.userInfo()];
            const dirOrFileName = data["args"][0];
            fs.stat(dirOrFileName, {},
                (err, result) => {
                    if (err) {
                        return;
                    }
                    const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(data["displayWindowId"]);
                    if (displayWindowAgent instanceof DisplayWindowAgent) {
                        displayWindowAgent.sendFromMainProcess("terminal-command-result", {
                            widgetKey: data["widgetKey"],
                            ioId: data["ioId"],
                            command: data["command"],
                            result: [result],
                        })
                    }
                })
            return;
        } else if (data["command"] === "fs.isDirectory") {
            // result = [os.userInfo()];
            const dirOrFileName = data["args"][0];
            fs.stat(dirOrFileName, {},
                (err, stats) => {
                    if (err) {
                        return;
                    }
                    try {
                        const result = stats.isDirectory();
                        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(data["displayWindowId"]);
                        if (displayWindowAgent instanceof DisplayWindowAgent) {
                            displayWindowAgent.sendFromMainProcess("terminal-command-result", {
                                widgetKey: data["widgetKey"],
                                ioId: data["ioId"],
                                command: data["command"],
                                result: [result],
                            })
                        }
                    } catch (e) {
                        // do nothing, the timeout on TerminalIo will handle it
                    }
                })
            return;
        }

        // synchronous command
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(data["displayWindowId"]);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            displayWindowAgent.sendFromMainProcess("terminal-command-result", {
                widgetKey: data["widgetKey"],
                ioId: data["ioId"],
                command: data["command"],
                result: result,
            })
        }
    }

    handleTakeScreenShot = (event: any, options: IpcEventArgType["take-screenshot"]) => {
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(options["displayWindowId"]);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            if (options['destination'] === "file") {
                displayWindowAgent.takeScreenshot();
            } else if (options["destination"] === "clipboard") {
                displayWindowAgent.takeScreenshotToClipboard();
            } else if (options["destination"] === "folder") {
                displayWindowAgent.takeScreenshotToFolder();
            }
        } else {

        }
    }

    handlePrintDisplayWindow = (event: any, options: IpcEventArgType["print-display-window"]) => {
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(options["displayWindowId"]);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            displayWindowAgent.print();
        }
    }

    handleRequestArchiveData = async (event: any, options: IpcEventArgType["request-archive-data"]) => {
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(options["displayWindowId"]);
        if (!(displayWindowAgent instanceof DisplayWindowAgent)) {
            return;
        }
        let result: [number[], number[]] | undefined = undefined;
        const sql = this.getMainProcess().getSql();
        if (sql !== undefined) {
            try {
                // result = await sql.getChannelData(options["channelName"], options["startTime"], options["endTime"]);
                result = await sql.getChannelDataForDataViewer(options["channelName"], options["startTime"], options["endTime"]);
            } catch (e) {
                Log.error(-1, "FAiled to request archive data", e);
                return;
            }
        }
        if (result !== undefined) {
            // do not process data in main process, the resouce is more precious in the main process
            displayWindowAgent.sendFromMainProcess("new-archive-data", {
                ...options,
                archiveData: result,
            });
        } else {
            Log.error("0", "Cannot obtain archive data for", options["channelName"], "from", options["startTime"], "to", options["endTime"]);
        }
    }

    /**
     * Open a text file from an existing TextEditor window
     * 
     * This event is only initiated from TextEditor window
     * 
     * It is for opening a new TextEditor window, which is done in create-utility-display-window event
     */
    handleOpenTextFileInTextEditor = async (event: any, options: IpcEventArgType["open-text-file-in-text-editor"]) => {


        // todo: control access to file in web mode

        let manualOpen = false;
        let openNewWindow = false;
        if (options["manualOpen"] === true) {
            manualOpen = true;
        }
        if (options["openNewWindow"] === true) {
            openNewWindow = true;
        }
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(options["displayWindowId"]);
        let fileName = options["fileName"];


        if (options["fileName"] === "" && options["fileContents"] !== undefined) {
            if (displayWindowAgent instanceof DisplayWindowAgent) {

                displayWindowAgent.sendFromMainProcess("text-file-contents", {
                    ...options,
                    fileName: fileName,
                    fileContents: options["fileContents"],
                    readable: true,
                    writable: true,
                }
                )
            }
            return;
        }

        if (displayWindowAgent instanceof DisplayWindowAgent) {
            // open a new window, fall back to `createUtilityDisplayWindow()`
            // do this before tthe "fileName" and manualOpen""
            if (openNewWindow) {
                this.createUtilityDisplayWindow(undefined,
                    {
                        utilityType: "TextEditor",
                        utilityOptions: {
                            fileName: fileName
                        }
                    }
                )
                return;
            }
            try {
                let readable = false;
                let writable = false;
                // user chooses the file, otherwise automatically open the file
                if (fileName === "") {
                    if (manualOpen === false) {
                        return;
                    } else {
                        try {
                            if (this.getMainProcess().getMainProcessMode() === "desktop") {
                                const fileNames = dialog.showOpenDialogSync({ title: "Open text file" });
                                if (fileNames === undefined) {
                                    // cancel, do nothing
                                    return;
                                }
                                if (fileNames !== undefined && fileNames.length > 0) {
                                    fileName = fileNames[0];
                                }
                            } else if (this.getMainProcess().getMainProcessMode() === "ssh-server" || this.getMainProcess().getMainProcessMode() === "web") {

                                displayWindowAgent.sendFromMainProcess("dialog-show-input-box",
                                    {
                                        info: {
                                            command: "open-text-file",
                                            humanReadableMessages: ["Open a file"], // each string has a new line
                                            buttons: [
                                                {
                                                    text: "OK",
                                                },
                                                {
                                                    text: "Cancel",
                                                }
                                            ],
                                            defaultInputText: "",
                                            attachment: options,
                                        }
                                    }
                                )
                                return;
                            }
                        } catch (e) {
                            return;
                        }
                    }
                }
                // if file does not exist, throws an error
                fs.accessSync(fileName, fs.constants.F_OK);
                // if file is not readble, throws an error
                fs.accessSync(fileName, fs.constants.R_OK);
                readable = true;
                // if file is not writable, it is ok
                try {
                    fs.accessSync(fileName, fs.constants.W_OK);
                    writable = true;
                } catch (e) {
                    writable = false;
                }

                // if the file is too large, give a warning or refuse to open
                const fileStats = fs.statSync(fileName);
                const fileSize = fileStats.size;
                if (fileSize > 2.5 * 1024 * 1024 && fileSize < 10 * 1024 * 1024) {
                    const browserWindow = displayWindowAgent.getBrowserWindow();
                    if (browserWindow !== undefined) {
                        if (options["largeFileConfirmOpen"] === "Yes") {
                            // continue to open the large file
                        } else if (options["largeFileConfirmOpen"] === "No") {
                            // interrupt here
                            return;
                        } else {
                            // ask user to determine if open or not
                            displayWindowAgent.sendFromMainProcess('dialog-show-message-box', {
                                info: {
                                    command: "open-text-file-large-confirm",
                                    messageType: "warning",
                                    humanReadableMessages: [`This file is large (` + `${Math.round(fileSize / 1024 / 1024)}` + ` MB). You will not be able to edit it. And it may be slow to open. Do you still want to open it?`],
                                    rawMessages: [],
                                    buttons: [{ text: "Yes" }, { text: "No" }],
                                    attachment: { ...options, fileName: fileName },
                                }
                            });
                            return;
                        }
                    }
                } else if (fileSize >= 10 * 1024 * 1024) {
                    const browserWindow = displayWindowAgent.getBrowserWindow();
                    if (browserWindow !== undefined) {
                        displayWindowAgent.sendFromMainProcess('dialog-show-message-box', {
                            info: {
                                messageType: "error",
                                humanReadableMessages: [`This file is too large (` + `${Math.round(fileSize / 1024 / 1024)}` + ` MB) to open. Please select a smaller file.`],
                                rawMessages: [],
                                buttons: [{ text: "OK" }],
                            }
                        })
                        return;
                    }
                }

                const fileContents = fs.readFileSync(fileName, "utf-8");
                displayWindowAgent.sendFromMainProcess("text-file-contents", {
                    ...options,
                    fileName: fileName,
                    fileContents: fileContents,
                    readable: readable,
                    writable: writable,
                }
                )

            } catch (e) {
                displayWindowAgent.sendFromMainProcess("dialog-show-message-box", {
                    info: {
                        messageType: "error",
                        humanReadableMessages: [`Error opening file ${fileName}`],
                        rawMessages: [`${e}`],
                    }
                })
            }
        }
    }

    /**
     * @returns {boolean} true upon successfully saved, false upon failed
     */

    handleSaveTextFile = (event: any, data: IpcEventArgType["save-text-file"]): boolean => {
        const mainProcessMode = this.getMainProcess().getMainProcessMode();
        if (mainProcessMode === "web") {
            // do not save in web server
            return false;
        }
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(data["displayWindowId"]);
        let fileName: string | undefined = data["fileName"];
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            try {
                // save as
                if (fileName === "") {
                    if (this.getMainProcess().getMainProcessMode() === "desktop") {
                        fileName = dialog.showSaveDialogSync({
                            title: "Save file to",
                        });
                        // cancel the dialog, return immediately
                        if (fileName === undefined) {
                            return false;
                        }
                    } else if (this.getMainProcess().getMainProcessMode() === "ssh-server") {
                        displayWindowAgent.sendFromMainProcess("dialog-show-input-box",
                            {
                                info: {
                                    command: "save-text-file",
                                    humanReadableMessages: ["Save file to"], // each string has a new line
                                    buttons: [
                                        {
                                            text: "OK",
                                        },
                                        {
                                            text: "Cancel",
                                        }
                                    ],
                                    defaultInputText: "",
                                    attachment: data,
                                }
                            }
                        );

                        return false;
                    }

                }
                fs.writeFileSync(fileName, data["fileContents"]);
                // tell the display window the file name (if save-as)
                displayWindowAgent.sendFromMainProcess("save-text-file-status", {
                    displayWindowId: data["displayWindowId"],
                    widgetKey: data["widgetKey"],
                    status: "success",
                    fileName: fileName,
                })
                return true;
            } catch (e) {
                displayWindowAgent.sendFromMainProcess("dialog-show-message-box", {
                    info: {
                        messageType: "error",
                        humanReadableMessages: [`Error saving file ${fileName}`],
                        rawMessages: [`${e}`],
                    }
                })
                Log.error("0", e);
                return false;
            }
        }
        return false;
    }

    handleRegisterLogViewer = (event: any, options: IpcEventArgType["register-log-viewer"]) => {
        // logs.registerLogViewer(info);
    }
    handleUnregisterLogViewer = (event: any, options: IpcEventArgType["unregister-log-viewer"]) => {
        // logs.unregisterLogViewer(info);
    }

    handleFileConverterCommand = (event: any, options: IpcEventArgType["file-converter-command"]) => {

        if (options["command"] === "start") {
            const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(options["displayWindowId"]);
            if (!(displayWindowAgent instanceof DisplayWindowAgent)) {
                return;
            }

            if (!fs.existsSync(options["src"])) {
                displayWindowAgent.sendFromMainProcess("dialog-show-message-box", {
                    info: {
                        messageType: "error",
                        humanReadableMessages: [`Source folder/file does not exist.`],
                        rawMessages: [],
                    }
                }
                );
                displayWindowAgent.sendFromMainProcess("file-converter-command", {
                    type: "all-file-conversion-finished",
                    status: "failed",
                    widgetKey: options["widgetKey"],
                });
                return;
            }
            if (!fs.existsSync(options["dest"])) {
                displayWindowAgent.sendFromMainProcess("dialog-show-message-box", {
                    info: {
                        messageType: "error",
                        humanReadableMessages: [`Destination folder/file does not exist.`],
                        rawMessages: [],
                    }
                }
                );
                displayWindowAgent.sendFromMainProcess("file-converter-command", {
                    type: "all-file-conversion-finished",
                    status: "failed",
                    widgetKey: options["widgetKey"],
                });
                return;
            }
            if (options["depth"] > 50 || options["depth"] < 1) {
                displayWindowAgent.sendFromMainProcess("dialog-show-message-box", {
                    info: {
                        messageType: "error",
                        humanReadableMessages: [`File search depath wrong: should be between 1 and 50 (both inclusive).`],
                        rawMessages: [],
                    }
                }
                );
                displayWindowAgent.sendFromMainProcess("file-converter-command", {
                    type: "all-file-conversion-finished",
                    status: "failed",
                    widgetKey: options["widgetKey"],
                });
                return;
            }
            this.getMainProcess().getEdlFileConverterThread().startThread(options);
        } else if (options["command"] === "stop") {
            this.getMainProcess().getEdlFileConverterThread().stopThread();
        }
    }

    handleSaveVideoFile = (event: any, data: IpcEventArgType["save-video-file"]) => {
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(data["displayWindowId"]);
        if (displayWindowAgent instanceof DisplayWindowAgent) {

            // Convert Base64 to Buffer
            const base64Data = data["fileContents"];
            const buffer = Buffer.from(base64Data, "base64");

            fs.writeFile(data["fileName"], buffer as Uint8Array, (err) => {
                if (err) {
                    displayWindowAgent.sendFromMainProcess("dialog-show-message-box",
                        {
                            info: {
                                messageType: "error",
                                humanReadableMessages: [`Failed to save video to ${data["fileName"]}`],
                                rawMessages: [err.toString()]
                            }
                        }
                    )
                } else {
                    displayWindowAgent.sendFromMainProcess("dialog-show-message-box",
                        {
                            info: {
                                messageType: "info",
                                humanReadableMessages: [`Video file saved to ${data["fileName"]}`],
                                rawMessages: []
                            }
                        }
                    )
                }
            });
        }
    }


    // --------------- getters and setters ----------------------

    getMainProcess = () => {
        return this._mainProcess;
    };

    // getMainProcessId = () => {
    //     return this.getMainProcess().getProcessId();
    // };

    getEventListeners = () => {
        return this.eventListeners;
    };

    setMainProcess = (mainProcess: MainProcess) => {
        this._mainProcess = mainProcess;
    };

    getWsServer = () => {
        return this._wsServer;
    };

    getPort = () => {
        return this._port;
    };

    setPort = (newPort: number) => {
        this._port = newPort;
    };


    getClients = () => {
        return this.clients;
    };

    getSshServer = () => {
        return this._sshServer;
    }
}
