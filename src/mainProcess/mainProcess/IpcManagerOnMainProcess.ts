import { BrowserView, BrowserWindow, app, dialog } from "electron";
import { MainProcess } from "../mainProcess/MainProcess";
import { type_options_createDisplayWindow } from "../windows/WindowAgentsManager";
import * as fs from "fs";
import { DisplayWindowAgent } from "../windows/DisplayWindow/DisplayWindowAgent";
import { FileReader } from "../file/FileReader";
import { type_tdl } from "../../common/GlobalVariables";
import path from "path";
import { Log } from "../../common/Log";
import { type_sshServerConfig } from "./SshClient";
import * as os from "os";
import { MainWindowAgent } from "../windows/MainWindow/MainWindowAgent";
import { spawn } from "child_process";
import { Environment } from "epics-tca";
import { IpcEventArgType, type_DialogMessageBox } from "../../common/IpcEventArgType";
import { fileToDataUri, generateKeyAndCert } from "../global/GlobalMethods";
import { SshServer } from "./SshServer";
import https from "https";
import { WebSocketServer, WebSocket, RawData } from "ws";
import { IncomingMessage } from "http";
import { TextEditorHandlers } from "../ipc/TextEditor/TextEditorHandlers";

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

    private _textEditorHandlers: TextEditorHandlers;

    constructor(mainProcess: MainProcess) {
        this._mainProcess = mainProcess;
        this._textEditorHandlers = new TextEditorHandlers(this);

        this.createWebSocketIpcServer();
        this.startToListen();

    }

    getTextEditorHandlers = () => {
        return this._textEditorHandlers;
    }


    /**
     * Create the websocket IPC server. 
     * 
     * This websocket server is attached to a https server, which has no role in anywhere.
     */
    createWebSocketIpcServer = () => {
        Log.info('-1', `Creating WebSocket IPC server on port ${this.getPort()}`);

        const key = this.getMainProcess().getMainProcessMode() === "web" ? this.getMainProcess().getWebServer()?.getHttpsOptions()?.key : this.keyAndCert.private;
        const cert = this.getMainProcess().getMainProcessMode() === "web" ? this.getMainProcess().getWebServer()?.getHttpsOptions()?.cert : this.keyAndCert.cert;
        // create a https server for the websocket server to attach to
        const httpsServer = https.createServer({
            key: key,
            cert: cert,
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
                this.createWebSocketIpcServer();
            } else {
                Log.error("WebSocket for IPC error:", err)
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
                Log.debug("IPC websocket server received message", message);
                this.handleMessage(wsClient, message);
            });

            wsClient.on("error", (err: Error) => {
                Log.error("WebSocket IPC client got an error", err)
            });

            // websocket connection closed, do nothing
            // if the display window is still alive, it will try to reconnect
            wsClient.on("close", (code: number, reason: Buffer) => {
                Log.info("WebSocket client closed.", code, reason.toString());
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
            // messages that are processed on client side, do not forward message to tcp server
            // "show-context-menu" 
            // "show-context-menu-sidebar" 
            // "main-window-show-context-menu"
            // "new-tdl-rendered": take screenshots, send local fonts names
            // "close-window": close the window, same as clicking the close button
            // "focus-window": focus the window, initiated by mosue down event on thumbnail
            // "processes-info": request processes info (CPU, memory) from renderer process
            // "bring-up-main-window": all info needed by main window are stored
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
                || eventName === "websocket-ipc-connected-on-main-window"
                || eventName === "ssh-password-prompt-result"
                || eventName === "take-screenshot"
                || eventName === "fetch-thumbnail"
            ) {
                const eventListeners = mainProcess.getIpcManager().getEventListeners();
                const callback = eventListeners[eventName];
                if (callback !== undefined) {
                    // invoke callback
                    const data = message["data"];
                    callback(wsClient, ...data);
                }
                return;
            } else {
                let fullWindowId = windowId;
                // same as desktoip or web mode, always register the websocket client
                // also forward the message to to ssh server, so that the window can be registered
                if (this.getClients()[fullWindowId] === undefined) {
                    Log.debug("register window", windowId, "for WebSocket IPC");
                    this.getClients()[fullWindowId] = wsClient;
                    // lift the block in create window method
                    // const windowAgent = mainProcess.getWindowAgentsManager().getAgent(windowId);
                    // if (windowAgent instanceof MainWindowAgent || windowAgent instanceof DisplayWindowAgent) {
                    //     console.log("lift block for", windowId);
                    //     windowAgent.creationResolve("");
                    // }
                }
                // normally, we forward the message to remote ssh server via TCP
                const sshClient = mainProcess.getSshClient();
                const tcpMessage = {
                    command: "forward-to-websocket-ipc",
                    data: message,
                }
                if (sshClient !== undefined) {
                    sshClient.sendToTcpServer(message);
                    // sshClient.sendToTcpServer(tcpMessage);
                } else {
                    Log.error("Error: the main process", processId, "is not a ssh client");
                }
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
        Log.info("Remove websocket IPC client", id);
    };


    // ----------------------- --------------------------

    eventListeners: Record<string, (event: any, ...args: any) => any> = {};

    ipcMain = {
        on: (channel: string, callback: (event: any, ...args: any) => void) => {
            this.eventListeners[channel] = callback;
        },
    };



    startToListen = () => {
        // -------------- main process -------------------------
        this.ipcMain.on("new-tdm-process", this.handleNewTdmProcess);
        this.ipcMain.on("quit-tdm-process", this.handleQuitTdmProcess);
        this.ipcMain.on("websocket-ipc-connected-on-display-window", this.handleWebsocketIpcConnectedOnDisplayWindow); // done
        this.ipcMain.on("websocket-ipc-connected-on-main-window", this.handleWebsocketIpcConnectedOnMainWindow); // done
        // ------------------ main window ----------------------
        // we we select a profile
        this.ipcMain.on("profile-selected", this.handleProfileSelected);
        this.ipcMain.on("update-profiles", this.handleUpdateProfiles);
        // show main window
        this.ipcMain.on("bring-up-main-window", this.handleBringUpMainWindow);
        this.ipcMain.on("focus-window", this.handleFocusWindow);
        this.ipcMain.on("close-window", this.handleCloseWindow);
        this.ipcMain.on("main-window-will-be-closed", this.handleMainWindowWillBeClosed);
        // ------------------- display window ------------------

        this.ipcMain.on("set-window-title", this.handleSetWindowTitle);
        this.ipcMain.on("window-will-be-closed-user-select", this.handleWindowWillBeClosedUserSelect);
        this.ipcMain.on("open-default-display-windows", this.handleOpenDefaultDisplayWindows);
        this.ipcMain.on("create-blank-display-window", this.handleCreateBlankDisplayWindow); // done
        this.ipcMain.on("zoom-window", this.handleZoomWindow);
        this.ipcMain.on("move-window", this.handleMoveWindow)
        this.ipcMain.on("set-window-always-on-top", this.handleSetWindowAlwaysOnTop)
        this.ipcMain.on("duplicate-display", this.handleDuplicateDisplay);
        this.ipcMain.on("ping", this.handlePing);

        // ------------------ tdl file ----------------------
        this.ipcMain.on("open-tdl-file", this.handleOpenTdlFiles); // done
        this.ipcMain.on("load-tdl-file", this.handleLoadTdlFile); // done
        this.ipcMain.on("save-tdl-file", this.handleSaveTdlFile);
        // save serialized data to a file, e.g. .json data
        this.ipcMain.on("save-data-to-file", this.handleSaveDataToFile);
        this.ipcMain.on("new-tdl-rendered", this.handleNewTdlRendered);
        this.ipcMain.on("window-attached-script", this.handleWindowAttachedScript);
        this.ipcMain.on("load-db-file-contents", this.handleLoadDbFileContents);
        this.ipcMain.on("read-embedded-display-tdl", this.handleReadEmbeddedDisplayTdl)
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

        // ---------------- utility window -----------------------
        this.ipcMain.on("create-utility-display-window", this.createUtilityDisplayWindow); // done
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
        this.ipcMain.on("input-file-path", this.handleInputFilePath);
        this.ipcMain.on("select-a-file", this.handleSelectAFile);
        this.ipcMain.on("get-symbol-gallery", this.handleGetSymbolGallery);
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
        this.ipcMain.on("save-text-file", this.getTextEditorHandlers().handleSaveTextFile)
        this.ipcMain.on("open-text-file", this.getTextEditorHandlers().handleOpenTextFile)

        // ------------------ log viewer -------------------------
        this.ipcMain.on("register-log-viewer", this.handleRegisterLogViewer)
        this.ipcMain.on("unregister-log-viewer", this.handleUnregisterLogViewer)

        // --------------- file converter ------------------------
        this.ipcMain.on("file-converter-command", this.handleFileConverterCommand)

        // ----------------- video file --------------------------
        this.ipcMain.on("save-video-file", this.handleSaveVideoFile)
        this.ipcMain.on("get-media-content", this.handleGetMediaContent)
    };

    // ---------------- TDM process ----------------------------
    /**
     * IPC handler for requests to open a new TDM instance.
     *
     * Delegates process creation to `MainProcess.spawnNewTdmProcess()`.
     */
    handleNewTdmProcess = (event: WebSocket | string, options: IpcEventArgType["new-tdm-process"]) => {
        this.getMainProcess().spawnNewTdmProcess();
    };

    /**
     * Quit this process
     */
    handleQuitTdmProcess = (event: WebSocket | string, option: IpcEventArgType["quit-tdm-process"]) => {
        let { confirmToQuit } = option;
        this.getMainProcess().requestQuitTdmProcess(confirmToQuit);
    }

    /**
     * The renderer process window has connected to the websocket IPC server.
     * 
     * This is the first communication between the renderer process and the main process via websocket-based
     * IPC mechanism.
     * 
     * If the renderer process is a Display Window, the main process sends
     *  - current profile JSON
     *  - site info
     *  - TDL file JSON
     * to the Display Window. These steps are the same for any mode, including deskop and web modes.
     * 
     * If the renderer proces is a Main Window, the main proces sends
     *  - ws opener port
     *  - all profiles JSON
     *  - site info
     *  - profiles file name
     *  - log file name
     *  - environment variables
     * to the Main Window. These info are for Main Window startup page.
     * 
     */
    handleWebsocketIpcConnectedOnDisplayWindow = async (event: WebSocket | string, data: IpcEventArgType["websocket-ipc-connected-on-display-window"]) => {
        // the main processes' ipc manager
        const ipcManager = this.getMainProcess().getIpcManager();
        const mainProcess = this.getMainProcess();
        const mainProcessMode = mainProcess.getMainProcessMode();
        const windowId = data["windowId"];
        const reconnect = data["reconnect"];
        Log.info("register window", windowId, "for WebSocket IPC");
        if (mainProcessMode === "desktop" || mainProcessMode === "web") {
            // desktop mode: websocket client on main/display window

            ipcManager.getClients()[windowId] = event;
        } else if (mainProcessMode === "ssh-server") {
            // ssh-server mode: an arbitrary string
            // in this way the DisplayWindowAgent.sendFromMainProcess() or MainWindowAgent.sendFromMainProcess()
            // on the calling process won't send message to the windows
            ipcManager.getClients()[windowId] = windowId;
        }

        if (reconnect === true) {
            return;
        }

        // lift the block in create window method
        const windowAgent = mainProcess.getWindowAgentsManager().getAgent(windowId);
        if (!(windowAgent instanceof DisplayWindowAgent)) {
            return;
        }
        const selectedProfile = this.getMainProcess().getProfiles().getSelectedProfile();
        if (selectedProfile === undefined) {
            Log.error("Profile not selected!");
            return undefined;
        }
        windowAgent.sendFromMainProcess("selected-profile-contents",
            {
                contents: selectedProfile.getContents()
            }
        );
        const site = this.getMainProcess().getSite();
        windowAgent.sendFromMainProcess("site-info", { site: site });


        const tdl = windowAgent.getTdl() as type_tdl;
        const tdlFileName = windowAgent.getTdlFileName();
        const mode = windowAgent.getInitialMode();
        const editable = windowAgent.isEditable();
        const macros = windowAgent.getMacros();
        const replaceMacros = windowAgent.getReplaceMacros();
        const utilityType = windowAgent.getUtilityType();
        const utilityOptions = windowAgent.getUtilityOptions();

        windowAgent.sendFromMainProcess("new-tdl", {
            newTdl: tdl,
            tdlFileName: tdlFileName,
            initialModeStr: mode,
            editable: editable,
            externalMacros: macros,
            useExternalMacros: replaceMacros,
            utilityType: utilityType as any, //options["utilityType"] as any,
            utilityOptions: utilityOptions === undefined ? {} : utilityOptions, //options["utilityOptions"] === undefined ? {} : options["utilityOptions"],
        });


        // windowAgent.sendFromMainProcess("preset-colors", selectedProfile.getCategory("Preset Colors"));



        // } else if (windowAgent === undefined) {
        //     // a client connects to the websocket IPC server, and provides a process ID and a window ID
        //     // however, there is no such resource (i.e. DisplayWindowAgent) for this window ID
        //     // this is a non-legit client, it may come from refreshing a web page
        //     // we need to undo the above operation
        //     // no need to disconnec the websocket connection, the client 
        //     // will close the connection when the web page closes
        //     Log.error("There is no display window agent for this window ID", data["windowId"], "on server side, stop.");
        //     delete ipcManager.getClients()[windowId];
        // }

    }



    handleWebsocketIpcConnectedOnMainWindow = (event: WebSocket | string, data: IpcEventArgType["websocket-ipc-connected-on-main-window"]) => {

        // the main processes' ipc manager
        const ipcManager = this.getMainProcess().getIpcManager();
        const mainProcess = this.getMainProcess();
        const mainProcessMode = mainProcess.getMainProcessMode();
        const windowId = data["windowId"];
        const reconnect = data["reconnect"];
        Log.info("register window", windowId, "for WebSocket IPC");

        if (mainProcessMode === "desktop" || mainProcessMode === "web" || mainProcessMode === "ssh-client") {
            // desktop mode: websocket client on main/display window
            ipcManager.getClients()[windowId] = event;
        } else if (mainProcessMode === "ssh-server") {
            // ssh-server mode: an arbitrary string
            // in this way the DisplayWindowAgent.sendFromMainProcess() or MainWindowAgent.sendFromMainProcess()
            // on the calling process won't send message to the windows
            ipcManager.getClients()[windowId] = windowId;
        }

        if (reconnect === true) {
            return;
        }

        // lift the block in create window method
        const windowAgent = mainProcess.getWindowAgentsManager().getAgent(windowId);

        if (!(windowAgent instanceof MainWindowAgent)) {
            return;
        }

        // ws opener server port
        const wsOpenerServer = this.getMainProcess().getWsOpenerServer();
        const wsOpenerPort = wsOpenerServer.getPort();
        windowAgent.sendFromMainProcess("update-ws-opener-port", { newPort: wsOpenerPort });

        // read default and OS-defined EPICS environment variables
        // in main window editing page, we need env default and env os
        const env = Environment.getTempInstance();
        let envDefault = env.getEnvDefault();
        let envOs = env.getEnvOs();

        if (typeof envDefault !== "object") {
            envDefault = {};
        }
        if (typeof envOs !== "object") {
            envOs = {};
        }

        const site = this.getMainProcess().getSite();

        windowAgent.sendFromMainProcess(
            "after-main-window-gui-created",
            {
                profiles: this.getMainProcess().getProfiles().serialize(),
                profilesFileName: this.getMainProcess().getProfiles().getFilePath(),
                envDefault: envDefault,
                envOs: envOs,
                logFileName: this.getMainProcess().getLogFileName(),
                site: site,
            }
        );

        // "Emitted when the application is activated"
        app.on("activate", async () => {
            // On macOS it's common to re-create a window in the app when the
            // dock icon is clicked and there are no other windows open.
            if (BrowserWindow.getAllWindows().length === 0) {
                // must be async
                await windowAgent.createBrowserWindow();
                // mainWindowAgent.sendFromMainProcess("uuid", processId);
                windowAgent.sendFromMainProcess(
                    "after-main-window-gui-created",
                    {
                        profiles: this.getMainProcess().getProfiles().serialize(),
                        profilesFileName: this.getMainProcess().getProfiles().getFilePath(),
                        envDefault: envDefault,
                        envOs: envOs,
                        logFileName: this.getMainProcess().getLogFileName(),
                        site,
                    }
                );

                // if (cmdLineSelectedProfile !== "") {
                // 	mainWindowAgent.sendFromMainProcess("cmd-line-selected-profile", cmdLineSelectedProfile);
                // }
            }
        });
        windowAgent.websocketIpcConnectedResolve();
    }

    // ----------------------- Profiles ------------------------

    /**
     * Manually open a profiles file via GUI dialog <br>
     *
     * If more than one files are selected, pop up a message box. <br>
     *
     * Only invoked in main window in startup page.
     */
    handleOpenProfiles = async (event: WebSocket | string, options: IpcEventArgType["open-profiles"]) => {
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
                        mainWindowAgent.showError(["Only one file can be selected"]);
                    } else {
                        profilesFileName = profilesFileNames[0];
                    }
                } catch (e) {
                    mainWindowAgent.showError([`${e}`]);
                    return;
                }
            } else if (this.getMainProcess().getMainProcessMode() === "ssh-server") {
                mainWindowAgent.showInputBox({
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
                });
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
            mainWindowAgent.showError([`${profilesFileName} is not a valid TDM profiles file, or it cannot be opened or created.`]);
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
    handleSaveProfiles = (event: WebSocket | string, options: IpcEventArgType["save-profiles"]): boolean => {
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
                    Log.info("No Profiles file selected, cancel saving");
                    return false;
                }
            } else if (this.getMainProcess().getMainProcessMode() === "ssh-server") {

                mainWindowAgent.showInputBox({
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
                });
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
            Log.error(e);
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
    handleSaveProfilesAs = (event: WebSocket | string, options: IpcEventArgType["save-profiles-as"]): boolean => {
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
                    Log.error("No file selected, cancel saving Profiles file.");
                    return false;
                }
            } else if (this.getMainProcess().getMainProcessMode() === "ssh-server") {

                mainWindowAgent.showInputBox({
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
                });
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
            Log.error(e);
            mainWindowAgent.showError([`Error save file to ${filePath}.`], [`${e}`]);

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
    handleBringUpMainWindow = async (event: WebSocket | string, options: IpcEventArgType["bring-up-main-window"]) => {
        const windowAgentsManager = this.getMainProcess().getWindowAgentsManager();
        let mainWindowAgent = windowAgentsManager.getMainWindowAgent();
        if (mainWindowAgent instanceof MainWindowAgent) {
            mainWindowAgent.focus();
        } else {
            const mainProcessMode = this.getMainProcess().getMainProcessMode();
            if (mainProcessMode === "desktop" || mainProcessMode === "ssh-client") {
                // re-create main window
                await windowAgentsManager.createMainWindow();
                mainWindowAgent = windowAgentsManager.getMainWindowAgent();
                if (!(mainWindowAgent instanceof MainWindowAgent)) {
                    return;
                }
                const selectedProfileName = this.getMainProcess().getProfiles().getSelectedProfileName();
                mainWindowAgent?.sendFromMainProcess("after-profile-selected", {
                    profileName: selectedProfileName
                });

                // if (mainProcessMode === "desktop") {
                //     // update thumbnails immediately for desktop
                //     const displayWindowAgents = windowAgentsManager.getAgents();
                //     for (let displayWindowId of Object.keys(displayWindowAgents)) {
                //         const displayWindowAgent = displayWindowAgents[displayWindowId];
                //         // not main window
                //         if (displayWindowAgent instanceof DisplayWindowAgent) {
                //             // not pre-loaded display window
                //             if (displayWindowAgent !== windowAgentsManager.preloadedDisplayWindowAgent) {
                //                 // must be a display window, not embedded window: (-1, 0, 1, ..., 10000)
                //                 const windowName = displayWindowAgent.getWindowName();
                //                 const tdlFileName = displayWindowAgent.getTdlFileName();
                //                 displayWindowAgent.takeThumbnail(windowName, tdlFileName);
                //             }
                //         }
                //     }
                // }
            }
        }
    };

    handleFocusWindow = async (event: WebSocket | string, options: IpcEventArgType["focus-window"]) => {
        const windowAgentsManager = this.getMainProcess().getWindowAgentsManager();
        const displayWindowAgent = windowAgentsManager.getAgent(options["displayWindowId"]);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            displayWindowAgent.focus();
        }
    };

    /**
     * Try to close the window GUI. 
     * 
     * This is the first step in closing a window. 
     * All the related data are handled in later events emitted by BrowserWindow such as "window-will-be-closed"
     */
    handleCloseWindow = async (event: WebSocket | string, options: IpcEventArgType["close-window"]) => {
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
    handleSetWindowTitle = (event: WebSocket | string, options: IpcEventArgType["set-window-title"]) => {
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

    handleWindowWillBeClosedUserSelect = (event: WebSocket, data: IpcEventArgType["window-will-be-closed-user-select"]) => {
        const windowAgentsManager = this.getMainProcess().getWindowAgentsManager();
        const displayWindowAgent = windowAgentsManager.getAgent(data["displayWindowId"]);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            displayWindowAgent.getDisplayWindowLifeCycleManager().handleWindowWillBeClosedUserSelect(data);
        }
    }

    handleMainWindowWillBeClosed = (event: WebSocket | string, data: IpcEventArgType["main-window-will-be-closed"]) => {
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
    handleProfileSelected = async (event: WebSocket | string, option: IpcEventArgType["profile-selected"]): Promise<any> => {
        const { selectedProfileName, args, openDefaultDisplayWindows } = option;

        const mainProcess = this.getMainProcess();
        const mainProcessMode = mainProcess.getMainProcessMode();
        const profiles = mainProcess.getProfiles();
        const windowAgentsManager = mainProcess.getWindowAgentsManager();

        profiles.setSelectedProfileName(selectedProfileName);
        const selectedProfile = profiles.getSelectedProfile();
        if (selectedProfile === undefined) {
            return;
        }
        Log.info("Main process for", mainProcessMode, "mode started. Profile is", selectedProfileName);


        // todo: what is this?
        // select to run a new process as ssh-client mode, it can only be started from desktop mode
        if (mainProcessMode === "desktop" && selectedProfile !== undefined && selectedProfile.isSshConfig()) {

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
            Log.info("We are going to run a new process on remote ssh using config", sshServerConfig)

            if (typeof sshServerConfig.ip === "string" && !isNaN(sshServerConfig.port) && typeof sshServerConfig.userName === "string" && typeof sshServerConfig.privateKeyFile === "string") {
                // const callingProcessId = this.getMainProcess().getMain();
                const callingProcessId = "0";
                const args = this.getMainProcess().getRawArgs();
                new MainProcess(args, undefined, "ssh-client", { ...sshServerConfig, callingProcessId: callingProcessId });
            } else {
                Log.error("Profiles file error: Cannot create main process for ssh config", selectedProfileName);
            }
        } else if (mainProcessMode === "web") {

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
            await this.getMainProcess().getChannelAgentsManager().createAndInitContext();
            // (2)
            this.getMainProcess().createSql();

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
                macros = [...args["macros"], ...macros];
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
                await mainWindowAgent.websocketIpcConnectedPromise;
                // (c)
                const oldTitle = mainWindowAgent.getTitle();
                const newTitle = oldTitle + " -- " + selectedProfileName;
                mainWindowAgent.setTitle(newTitle);
                // (d)
                mainWindowAgent.sendFromMainProcess("after-profile-selected", {
                    profileName: selectedProfileName,
                });
                // (e)
                windowAgentsManager.createPreviewDisplayWindow();
            }
        } else if (mainProcessMode === "ssh-server") {

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
            await this.getMainProcess().getChannelAgentsManager().createAndInitContext();
            // (2)
            this.getMainProcess().createSql();

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
                macros = [...args["macros"], ...macros];
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
                // the websocket is never connected in ssh server 
                // await mainWindowAgent.websocketIpcConnectedPromise;
                // (c)
                const oldTitle = mainWindowAgent.getTitle();
                const newTitle = oldTitle + " -- " + selectedProfileName;
                mainWindowAgent.setTitle(newTitle);
                // (d)
                mainWindowAgent.sendFromMainProcess("after-profile-selected", {
                    profileName: selectedProfileName,
                });
                // (e)
                // do not create preview display window in ssh client
                // windowAgentsManager.createPreviewDisplayWindow();
            }
        }
    }

    /**
     * The main window asks for to update the profiles content from main process. 
     * The main process will provide the up-to-date profiles content.
     */
    handleUpdateProfiles = (event: WebSocket | string, options: IpcEventArgType["update-profiles"]) => {
        const { windowId } = options;

        const windowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(windowId);

        if (windowAgent instanceof MainWindowAgent) {
            const profiles = this.getMainProcess().getWindowAgentsManager().getMainProcess().getProfiles();
            const profilesJson = profiles.getProfiles();
            const profilesFullFileName = profiles.getFilePath();

            windowAgent.sendFromMainProcess(
                "update-profiles",
                {
                    windowId: windowId,
                    profilesJson: profilesJson,
                    profilesFullFileName: profilesFullFileName
                }
            )
        } else {
            Log.error("update-profiles can only be request by main window");
        }
    }

    /**
     * Basically the same as profile-selected handler 
     */
    handleOpenDefaultDisplayWindows = (event: WebSocket | string, options: IpcEventArgType["open-default-display-windows"]) => {
        const selectedProfile = this.getMainProcess().getProfiles().getSelectedProfile();
        if (selectedProfile === undefined) {
            Log.error(`Profile not selected yet`);
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
                        Log.error(`Cannot read file ${tdlFileName}. FileReader.readTdlFile() returned undefined.`);
                    }
                }).catch((e) => {
                    Log.error(`Cannot read file ${tdlFileName}`, e);
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
                this.createUtilityDisplayWindow("", {
                    utilityType: "PvTable",
                    utilityOptions: { channelNames: channelNames },
                    windowId: options["windowId"],
                });
            }
        }
    };

    // ---------------------- tdl file ---------------------

    /**
     * Open one or more TDL files, create Display Window for each TDL file.
     * 
     * A TDL file may be .tdl, .db, .bob, .edl, .stp, and .template
     * 
     *  - for desktop mode, it create an electron.js BrowserWindow (or replace the preloaded BrowserWindow)
     *  - for web mode, it opens new tab for the first tdl file
     * 
     * There are 4 cases depending on parameters `tdl` and `tdlFileNames`
     * 
     *  (1) if `tdl` is defined, open the new display window with this tdl content
     * 
     *  (2) if `tdlFileNames` is undefined, show file open prompt, let the user select one or more
     *    TDL files to open
     * 
     *  (3) if `tdlFileNames` is an empty array, create a blank display window, with editing mode
     * 
     *  (4) if `tdlFileNames` is a non-empty string array, the strings are considered as TDL file names
     *    open each one in separate Display Window
     * 
     * @param tdl the JSON object that represents the TDL
     * 
     * @param tdlFileNames undefined or string array, TDL file names, can be absolute or relative
     * 
     * @param mode editing or operating
     * 
     * @param editable if the display is editable
     * 
     * @param macros the externally provided macros, it will append to the profile-provided macros
     *               but it may be overridden by the TDL-provided macros
     * 
     * @param replaceMacros whether to replace the macros 
     * 
     * @param currentTdlFolder a folder that is used for resolving the TDL file absolute path
     *                         it has the highest priority in TDL path resolution
     * 
     * @param windowId the window ID that initiated this TDL file open
     * 
     * @param sendContentsToWindow whether to send file back to display window, only used by .db 
     */
    handleOpenTdlFiles = (event: WebSocket | string, data: IpcEventArgType["open-tdl-file"]) => {
        const { options } = data;
        let { tdl, tdlFileNames, windowId, mode, editable, macros, replaceMacros, currentTdlFolder } = options;
        const windowAgentsManager = this.getMainProcess().getWindowAgentsManager();
        const selectedProfile = this.getMainProcess().getProfiles().getSelectedProfile();
        if (selectedProfile === undefined) {
            Log.error("Profile not selected!");
            return;
        }

        let windowAgent: MainWindowAgent | DisplayWindowAgent | undefined = undefined;
        if (windowId !== undefined) {
            windowAgent = windowAgentsManager.getAgent(windowId);
        }

        try {
            if (tdl !== undefined) { // the tdl content is provided, skip reading files from hard drive, available in all modes
                // (1)
                const tdlFileName = tdlFileNames === undefined ? "" : tdlFileNames[0];
                windowAgentsManager.createDisplayWindow(
                    {
                        tdl: tdl,
                        mode: mode,
                        editable: editable,
                        tdlFileName: tdlFileName,
                        macros: macros,
                        replaceMacros: replaceMacros,
                        hide: false,
                        windowId: windowId,
                    },
                );
            } else if (tdlFileNames === undefined) { // manually select the file, only available in desktop mode
                // (2)
                let defaultPath = "";
                if (currentTdlFolder !== undefined && fs.existsSync(currentTdlFolder)) {
                    defaultPath = currentTdlFolder;
                }
                // modify tdlFileNames to a string array
                tdlFileNames = dialog.showOpenDialogSync({
                    title: "open tdl file",
                    filters: [{ name: "tdl", extensions: ["tdl", "json", "bob", "edl", "stp", "db", "template"] }],
                    defaultPath: defaultPath,
                    // properties: ["openFile", "openDirectory","multiSelections"],
                    properties: ["openFile", "multiSelections"],
                });

                // at this point, the tdlFileNames must not be empty
                if (!(Array.isArray(tdlFileNames) === true && tdlFileNames.length > 0)) {
                    return;
                }

                // todo: ssh server mode, how to handle this situation
                if (this.getMainProcess().getMainProcessMode() === "ssh-server") {

                    if (windowId === undefined) {
                        return;
                    }
                    if (windowAgent === undefined) {
                        return;
                    }

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

                // the manually opened TDL file's editing permission and its mode are determined by Profile
                editable = selectedProfile.getEditable();
                mode = selectedProfile.getManuallyOpenedTdlMode();
                if (mode === "editing") {
                    editable = true;
                }

                windowAgentsManager.createDisplayWindows(tdlFileNames, mode, editable, options["macros"], options["currentTdlFolder"], windowId);

            } else if (tdlFileNames.length === 0) { // create a blank window, available in all modes
                // (3)
                windowAgentsManager.createBlankDisplayWindow(options["windowId"]);
            } else if (tdlFileNames.length > 0) { // open all the files, available in all modes
                // (4)
                windowAgentsManager.createDisplayWindows(tdlFileNames, mode, editable, options["macros"], options["currentTdlFolder"], windowId);
            }
        } catch (e) {
            Log.error(e);
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

    handleLoadDbFileContents = async (event: WebSocket | string, data: IpcEventArgType["load-db-file-contents"]) => {
        const { widgetKey, displayWindowId, dbFileName } = data;
        const windowAgentsManager = this.getMainProcess().getWindowAgentsManager();
        const selectedProfile = this.getMainProcess().getProfiles().getSelectedProfile();
        if (selectedProfile === undefined) {
            Log.error("Profile not selected!");
            return;
        }

        const windowAgent = windowAgentsManager.getAgent(displayWindowId);
        if (!(windowAgent instanceof DisplayWindowAgent)) {
            return;
        }

        try {
            if (dbFileName === undefined) { // manually select the file, only available in desktop mode
                // (2)
                // modify tdlFileNames to a string array
                const dbFileNames = dialog.showOpenDialogSync({
                    title: "open tdl file",
                    filters: [{ name: "tdl", extensions: ["db", "template"] }],
                    // defaultPath: defaultPath,
                    // properties: ["openFile", "openDirectory","multiSelections"],
                    properties: ["openFile", "multiSelections"],
                });

                // at this point, the tdlFileNames must not be empty
                if (!(Array.isArray(dbFileNames) === true && dbFileNames.length > 0)) {
                    return;
                }

                const dbFileName = dbFileNames[0];

                // do it asynchronously to speed up
                const dbFileContents = await FileReader.readDb(dbFileName, selectedProfile, undefined);
                if (dbFileContents === undefined) {
                    return;
                }
                // send back the contents
                windowAgent.sendFromMainProcess("load-db-file-contents", {
                    dbFileName: dbFileNames[0],
                    displayWindowId: displayWindowId,
                    widgetKey: widgetKey,
                    dbFileContents: dbFileContents,
                })
            } else {
                // (4)
            }
        } catch (e) {
            Log.error(e);
            if (windowAgent !== undefined) {
                const dialogInfo: { info: type_DialogMessageBox } = {
                    info: {
                        // command?: string | undefined;
                        messageType: "error", // | "warning" | "info";
                        humanReadableMessages: [`Failed to open db file`],
                        rawMessages: [`${e}`],
                        // buttons?: type_DialogMessageBoxButton[] | undefined;
                        // attachment?: any;
                    }
                };
                if (windowAgent instanceof MainWindowAgent) {
                    // windowAgent.sendFromMainProcess("dialog-show-message-box", dialogInfo);
                } else if (windowAgent instanceof DisplayWindowAgent) {
                    windowAgent.sendFromMainProcess("dialog-show-message-box", dialogInfo);
                }

            }
        }
    };

    handleReadEmbeddedDisplayTdl = async (event: WebSocket | string, data: IpcEventArgType["read-embedded-display-tdl"]) => {
        const { displayWindowId, widgetKey, tdlFileName, currentTdlFolder, macros, widgetWidth, widgetHeight, resize } = data;

        const selectedProfile = this.getMainProcess().getProfiles().getSelectedProfile();
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(displayWindowId);
        if (displayWindowAgent instanceof DisplayWindowAgent) {

            FileReader.readTdlFile(tdlFileName, selectedProfile, currentTdlFolder).then((tdlResult) => {
                if (tdlResult !== undefined) {
                    const tdl = tdlResult["tdl"];
                    const fullTdlFileName = tdlResult["fullTdlFileName"];
                    displayWindowAgent.sendFromMainProcess("read-embedded-display-tdl", {
                        displayWindowId: displayWindowId,
                        widgetKey: widgetKey,
                        tdl: tdl,
                        macros: macros,
                        fullTdlFileName: fullTdlFileName,
                        widgetWidth: widgetWidth,
                        widgetHeight: widgetHeight,
                        resize: resize,
                        tdlFileName: tdlFileName,
                    })
                } else {
                    Log.error(`Cannot read file ${tdlFileName}`);
                    displayWindowAgent.sendFromMainProcess("read-embedded-display-tdl", {
                        displayWindowId: displayWindowId,
                        widgetKey: widgetKey,
                        macros: macros,
                        widgetWidth: widgetWidth,
                        widgetHeight: widgetHeight,
                        resize: resize,
                        tdlFileName: tdlFileName,
                        // no tdl and no fullTdlFileName mean file does not exist
                        // tdl: tdl,
                        // fullTdlFileName: "file-does-not-exist",
                    })
                }
            })
        } else {
            Log.info("Cannot find Display Window Agent for", displayWindowId);
        }

    }

    /**
     * create a blank display window, the same effect as the handleOpenTdlFile() with tdlFileNames = []
     * 
     * @param displayWindowId the window ID that initiated the creation of blank display window
     */
    handleCreateBlankDisplayWindow = (event: WebSocket | string, options: IpcEventArgType["create-blank-display-window"]) => {
        const windowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(options["windowId"]);
        if ((windowAgent instanceof DisplayWindowAgent) || windowAgent instanceof MainWindowAgent) {
            windowAgent.getWindowAgentsManager().createBlankDisplayWindow(options["windowId"]);
        }
    }

    /**
     * Re-read or read a tdl file and update the existing display window with the new TDL file. 
     * It is similar to `open-tdl-file`, but it does not create a new Display Window.
     * 
     * This method does not accept TDL json as input argument.
     * 
     * @param {string} displayWindowId Display window ID, this display window will be updated.
     * 
     * @param {string} tdlFileName The absolute tdl file name that will be read/re-read. Can be an absolute
     *                             file path or an empty string. If the empty string, we will load an blank TDL.
     * 
     * @param {"editing" | "operating"} mode The display window status (mode) of this display window
     * 
     * @param {boolean} editable If this display window is editable
     * 
     * @param {[string, string][]} macros Externally provided macros
     * 
     * @param {boolean} replaceMacros If the externally provided macros should replace internally defined macros
     */
    handleLoadTdlFile = async (event: WebSocket | string, options: IpcEventArgType["load-tdl-file"],) => {
        const { displayWindowId } = options;
        const windowAgentsManager = this.getMainProcess().getWindowAgentsManager();
        try {
            const displayWindowAgent = windowAgentsManager.getAgent(displayWindowId);
            if (!(displayWindowAgent instanceof DisplayWindowAgent)) {
                const errMsg = `Display window ${displayWindowId} does not exists`;
                throw new Error(errMsg);
            }
            await displayWindowAgent.getDisplayWindowFile().loadTdlFile(options);
        } catch (e) {
            Log.error(e);
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
    handleSaveTdlFile = (event: WebSocket | string, options: IpcEventArgType["save-tdl-file"]) => {
        const { windowId } = options;
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(windowId);
        if (!(displayWindowAgent instanceof DisplayWindowAgent)) {
            Log.error(`No such display window ${windowId}. Cancel saving file.`);
            return;
        }

        displayWindowAgent.getDisplayWindowFile().saveTdlFile(options);
    };

    /**
     * Save any type of data to a file
     */
    handleSaveDataToFile = (event: WebSocket | string, options: IpcEventArgType["save-data-to-file"]) => {
        const mainProcessMode = this.getMainProcess().getMainProcessMode();
        if (mainProcessMode === "web") {
            // do not save to web server
            return;
        }

        const { displayWindowId, data, preferredFileTypes } = options;
        Log.debug("We are going to save a file");
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(displayWindowId);
        if (!(displayWindowAgent instanceof DisplayWindowAgent)) {
            Log.error(`No such display window ${displayWindowId}. Cancel saving file.`);
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
                displayWindowAgent.showError([`Failed to save file: file not selected`], [""]);
                return;
            }

            fs.writeFile(fileName, JSON.stringify(data, null, 4), (err) => {
                if (err) {
                    Log.error(err);
                    displayWindowAgent.showError([`Failed to save ${fileName}`, "Please check the file permission."], ["Below is the raw message:", `${err}`]);

                } else {
                    Log.info(`Saved tdl to file ${fileName}`);
                }
            });
        } catch (e) {
            // errors should have been catched in callback
            Log.error(e);
        }
    };


    /**
     * When the Root element of the new TDL in display window is rendered for the first time
     * The display window sends back this message to notify the main
     * process to show the pre-loaded window and update various fields. In this way, the pre-loaded window
     * does not flash.
     */
    handleNewTdlRendered = async (event: WebSocket | string, options: IpcEventArgType["new-tdl-rendered"]) => {

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
                displayWindowAgent.startThumbnailInterval();

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

    handleZoomWindow = (event: WebSocket | string, options: IpcEventArgType["zoom-window"]) => {
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

    handleMoveWindow = (event: WebSocket | string, data: IpcEventArgType["move-window"]) => {
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

    handleSetWindowAlwaysOnTop = (event: WebSocket | string, data: IpcEventArgType["set-window-always-on-top"]) => {
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
    handleWindowAttachedScript = (event: WebSocket | string, data: IpcEventArgType["window-attached-script"]) => {
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(data["displayWindowId"]);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            // editing
            if (data["action"] === "terminate") {
                Log.debug("Terminate script", data["script"], "for window", data["displayWindowId"]);
                displayWindowAgent.terminateWebSocketClientThread();
                displayWindowAgent.removeWebSocketMonitorChannels();
            } else if (data["action"] === "run") {
                // operating
                Log.debug("Run script", data["script"], "for window", data["displayWindowId"]);
                const port = this.getMainProcess().getWsPvServer().getPort();
                displayWindowAgent.createWebSocketClientThread(port, data["script"]);
            } else {
                Log.error("window-attached-script event error: action must be either run or terminate");
            }
        } else {
            Log.error("Cannot set mode for a non-display-window");
        }
    };

    handleMainWindowShowContextMenu = (event: WebSocket | string, options: IpcEventArgType["main-window-show-context-menu"]) => {
        const { menu } = options;
        const mainWidowAgent = this.getMainProcess().getWindowAgentsManager().getMainWindowAgent();
        if (mainWidowAgent !== undefined) {
            mainWidowAgent.showContextMenu(menu);
        }
    }

    handleDuplicateDisplay = (event: WebSocket | string, data: IpcEventArgType["duplicate-display"],) => {
        const { options } = data;
        const { windowId, tdl, mode, externalMacros } = options;
        const windowAgentsManager = this.getMainProcess().getWindowAgentsManager();
        windowAgentsManager.createDisplayWindow(
            {
                tdl: tdl,
                mode: mode,
                // always editable
                editable: true,
                tdlFileName: "",
                macros: externalMacros,
                replaceMacros: true,
                hide: false,
                windowId: windowId,
            },
        );
    };

    handlePing = (event: WebSocket | string, data: IpcEventArgType["ping"]) => {
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(data["displayWindowId"]);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            displayWindowAgent.sendFromMainProcess("pong", data)
        }
    }

    // -------------------- channel ------------------------

    /**
     * Get the data, always time out <br>
     *
     * It should be invoked after the meta data is obtained, otherwise we do not know the
     */
    handleTcaGet = async (event: WebSocket | string, options: IpcEventArgType["tca-get"]) => {
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
            if (typeof data === "object" && data !== null && "value" in data) {
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
    handleTcaGetMeta = async (event: WebSocket | string, options: IpcEventArgType["tca-get-meta"]) => {
        const { channelName,
            displayWindowId,
            widgetKey,
            ioId,
            timeout } = options;
        // (1)
        const windowAgentsManager = this.getMainProcess().getWindowAgentsManager();
        const channelAgentsManager = this.getMainProcess().getChannelAgentsManager();
        const displayWindowAgent = windowAgentsManager.getAgent(displayWindowId) as DisplayWindowAgent;
        if (displayWindowAgent === undefined) {
            return;
        }
        // in pva, meta data is actually pva type, which does not contain data
        let data = await displayWindowAgent.tcaGetMeta(channelName, timeout);
        if (channelAgentsManager.determineChannelType(channelName) === "pva") {
            // ! attention
            // send twice: use periodic and the "tca-get-result" to ensure all the widgets in newly created window are updated
            // in the first place. Otherwise the race condition may happen, the widget key is removed from the forceUpdateWidgets list
            // after the widget is first rendered, causing this widget cannot update. If there is new dbrData pending for this
            // widget, this widget has a second chance to refresh.
            displayWindowAgent.addNewChannelData(channelName, data);
        }
        // (2)
        // ioId and widgetKey are bounced back
        Log.debug("tca-get-meta result for", channelName, "is", data);
        if (channelAgentsManager.determineChannelType(channelName) === "pva") {
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

    handleFetchPvaType = async (event: WebSocket | string, options: IpcEventArgType["fetch-pva-type"]) => {
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
        Log.debug("fetch Pva Type for", channelName, "is", data);
        displayWindowAgent.sendFromMainProcess("fetch-pva-type",
            {
                channelName, widgetKey, fullPvaType: data, ioId
            }
        );
    };

    handleTcaMonitor = (event: WebSocket | string, options: IpcEventArgType["tca-monitor"]) => {
        const { displayWindowId, channelName } = options;
        const windowAgentsManager = this.getMainProcess().getWindowAgentsManager();
        const displayWindowAgent = windowAgentsManager.getAgent(displayWindowId) as DisplayWindowAgent;
        // if channel does not exist, create it
        displayWindowAgent.tcaMonitor(channelName);
    };

    handleTcaDestroy = (event: WebSocket | string, options: IpcEventArgType["tca-destroy"]) => {
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
    handleTcaPut = async (event: WebSocket | string, options: IpcEventArgType["tca-put"],) => {
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

    /**
     * Create a utility window. 
     * 
     * Applicable to desktop and web mode.
     * 
     * @param utilityType "Probe" | "PvTable" | "DataViewer" | "ProfilesViewer" | "LogViewer" | "TdlViewer" | "TextEditor" | "Terminal" | "Calculator" | "ChannelGraph" | "CaSnooper" | "Casw" | "Help" | "PvMonitor" | "FileConverter" | "Talhk" | "FileBrowser" | "SeqGraph"
     * 
     * @param utilityOptions The option for this utility
     * 
     * @param windowId The display or main window ID that initiates the creation of utility window
    */
    createUtilityDisplayWindow = (event: WebSocket | string, options: IpcEventArgType["create-utility-display-window"]) => {
        let { utilityType, utilityOptions, windowId } = options;
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
                            Log.error("Cannot read script file", scriptFullFileName, e);
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

        windowAgentsManager.createUtilityDisplayWindow(utilityType, utilityOptions, windowId);
    };

    // ----------------------- context menu -----------------

    handleShowContextMenu = (event: WebSocket | string, data: IpcEventArgType["show-context-menu"]) => {
        let { mode, displayWindowId, widgetKeys, options } = data;
        if (options === undefined) {
            options = {};
        }
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(displayWindowId);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            displayWindowAgent.showContextMenu(mode, widgetKeys, options);
        }
    };


    handleShowContextMenuSidebar = (event: WebSocket | string, data: IpcEventArgType["show-context-menu-sidebar"]) => {
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


    /**
     * Handle the file path input from the renderer process. <br>
     *
     * This is typically invoked when the user manually types in a file path (e.g. in SSH server mode)
     * instead of using a native file dialog. <br>
     *
     * It resolves the pending file selection promise on the corresponding Display Window's
     * `DisplayWindowFile` object by calling its `selectFileInputResolve` with the provided file name,
     * then resets the resolve function to a no-op to prevent duplicate invocations.
     *
     * @param {string} displayWindowId The ID of the display window that requested the file path input.
     * @param {string} fileName The file path entered by the user.
     */
    handleInputFilePath = (event: WebSocket | string, data: IpcEventArgType["input-file-path"]) => {
        const { displayWindowId, fileName } = data;
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(displayWindowId);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            const resolveFunc = displayWindowAgent.getDisplayWindowFile().selectFileInputResolve;
            resolveFunc(fileName);
        } else {
            Log.error();
        }
    };

    /**
     * Handle a file selection request from the renderer process. <br>
     *
     * This validates that the request includes a target display window ID, normalizes the optional
     * initial file name to an empty string, and forwards the request to the corresponding
     * `DisplayWindowFile` helper for native file selection handling.
     *
     * @param {WebSocket | string} event The IPC event source. Included for handler signature consistency.
     * @param {IpcEventArgType["select-a-file"]} data The file selection request payload.
     */
    handleSelectAFile = (event: WebSocket | string, data: IpcEventArgType["select-a-file"]) => {
        let { options, fileName1, } = data;
        if (fileName1 === undefined) {
            fileName1 = "";
        }

        const displayWindowId = options["displayWindowId"];
        if (displayWindowId === undefined) {
            Log.error("select-a-file request missing displayWindowId. Cancel selecting file.");
            return;
        }

        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(displayWindowId) as DisplayWindowAgent;
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            displayWindowAgent.getDisplayWindowFile().selectAFile(data);
        } else {
            Log.error(`No such display window ${displayWindowId}. Cancel selecting file.`);
        }
    };

    handleGetSymbolGallery = (event: WebSocket | string, options: IpcEventArgType["get-symbol-gallery"]) => {
        this.getMainProcess().getSymbolGallery().handleGetSymbolGallery(options);
    }

    // -------------------- embedded display events ----------------------

    /**
     * do not show any error message in display window
     */
    handleObtainIframeUuid = async (event: WebSocket | string, options: IpcEventArgType["obtain-iframe-uuid"],) => {

        const selectedProfile = this.getMainProcess().getProfiles().getSelectedProfile();

        let { tdl, tdlFileName, currentTdlFolder, mode, macros, replaceMacros, displayWindowId, widgetKey } = options;
        if (tdl === undefined) {
            try {
                const tdlResult = await FileReader.readTdlFile(tdlFileName, selectedProfile, currentTdlFolder);
                if (tdlResult === undefined) {
                    Log.error(`Cannot read file ${tdlFileName}`);
                    return;
                } else {
                    ({ tdl, fullTdlFileName: tdlFileName } = tdlResult);
                }
            } catch (e) {
                Log.error(`Cannot read file ${tdlFileName}`, e);
                return;
            }
        }

        this.getMainProcess().getWindowAgentsManager().createIframeDisplay(
            {
                tdl: tdl,
                mode: mode,
                editable: false,
                tdlFileName: tdlFileName,
                macros: macros,
                replaceMacros: replaceMacros,
                hide: false,
                utilityType: undefined,
                utilityOptions: undefined,
            },
            widgetKey,
            displayWindowId,
        );
    };

    handleSwitchIframeDisplayTab = async (event: WebSocket | string, options: IpcEventArgType["switch-iframe-display-tab"],) => {
        Log.debug("try to obtain iframe uuid");
        let { mode, tdlFileName, macros, displayWindowId, widgetKey, currentTdlFolder } = options;
        const selectedProfile = this.getMainProcess().getProfiles().getSelectedProfile();
        try {
            const tdlResult = await FileReader.readTdlFile(tdlFileName, selectedProfile, currentTdlFolder);
            if (tdlResult === undefined) {
                Log.error(`Cannot read file ${tdlFileName}`);
                return;
            }
            const { tdl, fullTdlFileName } = tdlResult;

            // do not block (await)
            this.getMainProcess().getWindowAgentsManager().createIframeDisplay(
                {
                    tdl: tdl,
                    mode: options["mode"],
                    editable: false,
                    tdlFileName: fullTdlFileName,
                    macros: macros,
                    replaceMacros: false,
                    hide: false,
                    utilityType: undefined,
                    utilityOptions: undefined,
                },
                widgetKey,
                displayWindowId
            );
        } catch (e) {
            Log.error(`Failed to switch iframe display tab for widget ${widgetKey} in display window ${displayWindowId} using TDL ${tdlFileName}.`, e);
            // we are not really closing the display window, just closing the iframe's window agent
            const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(options["iframeDisplayId"]);
            if (displayWindowAgent instanceof DisplayWindowAgent) {
                displayWindowAgent.handleWindowClosed();
            } else {
                Log.error(`Cannot find iframe display window ${options["iframeDisplayId"]} after switch-iframe-display-tab failure.`);
            }
        }
    };

    handleCloseIframeDisplay = (event: WebSocket | string, options: IpcEventArgType["close-iframe-display"]) => {
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(options["displayWindowId"]);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            displayWindowAgent.handleWindowClosed();
        } else {
            Log.error(`Cannot find iframe display window ${options["displayWindowId"]} to close.`);
        }
    };

    // ------------------------- actions ------------------------

    handleOpenWebpage = (event: WebSocket | string, options: IpcEventArgType["open-webpage"]) => {
        let { url } = options;
        // replace ${tdm_root} with the root path of TDM
        url = url.replace("${tdm_root}", path.join(__dirname, "..", "..", ".."));
        const windowAgentsManager = this.getMainProcess().getWindowAgentsManager();
        windowAgentsManager.createWebDisplayWindow(url);
    };

    handleExecuteCommand = (event: WebSocket | string, data: IpcEventArgType["execute-command"]) => {
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
                    Log.info(`stdout: ${data}`);
                });

                childProcess.stderr.on("data", (data) => {
                    Log.info(`stderr: ${data}`);
                });

                childProcess.on("close", (code) => {
                    Log.info(`child process exited with code ${code}`);
                });

                childProcess.on("error", (err) => {
                    // a failed spawn is not catched, but in the error event
                    const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(data["displayWindowId"]);
                    if (displayWindowAgent instanceof DisplayWindowAgent) {
                        displayWindowAgent.showError([`Failed to execute command "${data["command"]}"`], [`${err}`]);
                    }
                });
            }
        } catch (e) {
            // just in case the spawn throws an exception
            // spawn failed
            const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(data["displayWindowId"]);
            if (displayWindowAgent instanceof DisplayWindowAgent) {
                displayWindowAgent.showError([`Failed to execute command "${data["command"]}"`], [`${e}`]);
            }
        }
    }


    // --------------------- dataviewer ---------------------------
    handleDataViewerExportData = (
        event: WebSocket | string,
        options: IpcEventArgType["data-viewer-export-data"]
    ) => {
        let { displayWindowId } = options;

        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(displayWindowId);
        if (!(displayWindowAgent instanceof DisplayWindowAgent)) {
            Log.error(`Cannot find window agent for ${displayWindowId}`)
            return;
        }
        displayWindowAgent.getDisplayWindowFile().saveDataViewerData(options);
    };

    handleProcessesInfo = async (event: WebSocket | string, data: IpcEventArgType["processes-info"]) => {
        const processesInfo = await this.getMainProcess().getRuntimeInfo(data);

        // send back 
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(data["displayWindowId"]);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            displayWindowAgent.sendFromMainProcess("processes-info", {
                widgetKey: data["widgetKey"],
                processesInfo: processesInfo,
            });
        }
    }

    handleEpicsStats = async (event: WebSocket | string, data: IpcEventArgType["epics-stats"]) => {

        const channelAgentsManager = this.getMainProcess().getChannelAgentsManager();
        const epicsContext = channelAgentsManager.getContext();
        if (epicsContext === undefined) {
            Log.error("EPICS context not initialized");
            return;
        }

        const epicsStats = channelAgentsManager.generateEpicsStats();

        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(data["displayWindowId"]);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            displayWindowAgent.sendFromMainProcess("epics-stats", {
                widgetKey: data["widgetKey"],
                epicsStats: epicsStats as any,
            });
        }
    }

    handleCaSnooperCommand = (event: WebSocket | string, options: IpcEventArgType["ca-snooper-command"]) => {
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

    handleRequestEpicsDbd = (event: WebSocket | string, options: IpcEventArgType["request-epics-dbd"]) => {
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



    handleCaswCommand = (event: WebSocket | string, options: IpcEventArgType["ca-sw-command"]) => {
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

    handleFetchFolderContent = (event: WebSocket | string, options: IpcEventArgType["fetch-folder-content"]) => {

        const { displayWindowId } = options;
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(displayWindowId);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            displayWindowAgent.getDisplayWindowFile().readFolder(options);
        } else {
            Log.error(`No such display window ${displayWindowId}. Cancel reading folder content.`);
        }
    }

    handleFileBrowserCommand = (event: WebSocket | string, message: IpcEventArgType["file-browser-command"]) => {
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
                    displayWindowAgent.showError([`You are not allowed to ${message["command"].replaceAll("-", " ")} for ${folderPath}.`]);
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
                    displayWindowAgent.showError([`Failed to change file name from ${oldName} to ${newName}`, `Reason: ${err}`]);

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
                displayWindowAgent.showError([`Failed to create file ${fullFileName}`, `Reason ${e}`]);
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
                displayWindowAgent.showError([`Failed to create file ${fullFolderName}`, `Reason: ${e}`]);
                displayWindowAgent.sendFromMainProcess("file-browser-command", {
                    ...message,
                    success: false,
                })
            }
        }
    }

    handleFetchThumbnail = async (event: WebSocket | string, message: IpcEventArgType["fetch-thumbnail"]) => {
        // open this tdl file in preview display window
        if (this.getMainProcess().getMainProcessMode() !== "desktop") {
            return;
        }

        const windowAgentsManager = this.getMainProcess().getWindowAgentsManager();
        const selectedProfile = this.getMainProcess().getProfiles().getSelectedProfile();
        if (selectedProfile === undefined) {
            Log.error("Profile not selected!");
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
                    Log.error(`Cannot read tdl file ${tdlFileName}`);
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
                Log.error(`Cannot read tdl file ${tdlFileName}`);
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
    handleSshPasswordPromptResult = (event: WebSocket | string, result: IpcEventArgType["ssh-password-prompt-result"]) => {
        Log.info(result)
        const sshMainProcess = this.getMainProcess(); //.getMainProcesses().getProcess(result["sshMainProcessId"]);
        if (sshMainProcess instanceof MainProcess) {
            sshMainProcess.getSshClient()?._passwordPromptResolve({
                password: result["password"],
            });
        } else {
            Log.error("Cannot find main process", result["sshMainProcessId"]);
        }
    }

    handleCancelSshConnection = (event: WebSocket | string, data: IpcEventArgType["cancel-ssh-connection"]) => {
        const sshMainProcess = this.getMainProcess(); //.getMainProcesses().getProcess(data["sshMainProcessId"]);
        if (sshMainProcess instanceof MainProcess) {
            // simply quit
            sshMainProcess.quit();
        } else {
            Log.error("Cannot find main process", data["sshMainProcessId"]);
        }

    }

    handleTerminalCommand = (event: WebSocket | string, data: IpcEventArgType["terminal-command"]) => {
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
                        Log.error(e);
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

    handleTakeScreenShot = (event: WebSocket | string, options: IpcEventArgType["take-screenshot"]) => {
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(options["displayWindowId"]);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            if (options['destination'] === "file") {
                displayWindowAgent.takeScreenshot();
            } else if (options["destination"] === "clipboard") {
                displayWindowAgent.takeScreenshotToClipboard();
            } else if (options["destination"] === "folder") {
                displayWindowAgent.takeScreenshotToFolder();
            } else {
                Log.error(`Unsupported screenshot destination ${options["destination"]} for display window ${options["displayWindowId"]}. Cancel taking screenshot.`);
            }
        } else {
            Log.error(`No such display window ${options["displayWindowId"]}. Cancel taking screenshot.`);
        }
    }

    handlePrintDisplayWindow = (event: WebSocket | string, options: IpcEventArgType["print-display-window"]) => {
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(options["displayWindowId"]);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            displayWindowAgent.print();
        }
    }

    handleRequestArchiveData = async (event: WebSocket | string, options: IpcEventArgType["request-archive-data"]) => {
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
                Log.error("FAiled to request archive data", e);
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
            Log.error("Cannot obtain archive data for", options["channelName"], "from", options["startTime"], "to", options["endTime"]);
        }
    }

    handleRegisterLogViewer = (event: WebSocket | string, options: IpcEventArgType["register-log-viewer"]) => {
        // logs.registerLogViewer(info);
    }
    handleUnregisterLogViewer = (event: WebSocket | string, options: IpcEventArgType["unregister-log-viewer"]) => {
        // logs.unregisterLogViewer(info);
    }

    handleFileConverterCommand = (event: WebSocket | string, options: IpcEventArgType["file-converter-command"]) => {
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(options["displayWindowId"]);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            displayWindowAgent.getDisplayWindowFile().executeFileConverterCommand(options);
        } else {
            Log.error(`No such display window ${options["displayWindowId"]}. Cancel file converter command.`);
        }
    }

    handleSaveVideoFile = (event: WebSocket | string, data: IpcEventArgType["save-video-file"]) => {
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(data["displayWindowId"]);
        if (displayWindowAgent instanceof DisplayWindowAgent) {

            // Convert Base64 to Buffer
            const base64Data = data["fileContents"];
            const buffer = Buffer.from(base64Data, "base64");

            fs.writeFile(data["fileName"], buffer as Uint8Array, (err) => {
                if (err) {
                    displayWindowAgent.showError([`Failed to save video to ${data["fileName"]}`], [err.toString()]);
                } else {
                    displayWindowAgent.showInfo([`Video file saved to ${data["fileName"]}`]);
                }
            });
        }
    }

    handleGetMediaContent = (event: WebSocket | string, options: IpcEventArgType["get-media-content"]) => {
        const { fullFileName, displayWindowId, widgetKey } = options;
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(displayWindowId);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            try {
                // size limit 10 MB
                const fileBase64Str = fileToDataUri(fullFileName, 10240);
                displayWindowAgent.sendFromMainProcess("get-media-content", {
                    content: fileBase64Str,
                    displayWindowId: displayWindowId,
                    widgetKey: widgetKey,
                })

            } catch (e) {
                Log.error("Cannot read file", fullFileName)
            }
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
