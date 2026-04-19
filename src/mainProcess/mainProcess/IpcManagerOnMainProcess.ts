import { BrowserView, BrowserWindow, app, dialog } from "electron";
import { MainProcess } from "../mainProcess/MainProcess";
import { DisplayWindowAgent } from "../windows/DisplayWindow/DisplayWindowAgent";
import path from "path";
import { Log } from "../../common/Log";
import { MainWindowAgent } from "../windows/MainWindow/MainWindowAgent";
import { IpcEventArgType } from "../../common/IpcEventArgType";
import { generateKeyAndCert } from "../global/GlobalMethods";
import { SshServer } from "./SshServer";
import https from "https";
import { WebSocketServer, WebSocket, RawData } from "ws";
import { IncomingMessage } from "http";
import { FileReader } from "../file/FileReader";

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
        this.createWebSocketIpcServer();
        this.startToListen();
    }


    /**
     * Create the websocket IPC server. 
     * 
     * This websocket server is attached to a https server, which has no role in anywhere.
     */
    createWebSocketIpcServer = () => {
        Log.info(`Creating WebSocket IPC server on port ${this.getPort()}`);

        const mainProcess = this.getMainProcess();
        const mainProcessMode = mainProcess.getMainProcessMode();
        let websocketServer: undefined | WebSocketServer = undefined;
        if (mainProcessMode === "desktop") {
            websocketServer = this.createWebSocketIpcServerDesktopMode();
        } else if (mainProcessMode === "web") {
            websocketServer = this.createWebSocketIpcServerWebMode();
        } else {
            Log.error("Not supported mode ...............");
            return;
        }

        if (websocketServer === undefined) {
            Log.error("Failed to create websocket server for IPC");
            return;
        }

        /**
         * if the port is occupied, try the next port
         */
        websocketServer.on("error", (err: Error) => {
            if (err["message"].includes("EADDRINUSE")) {
                Log.info('-1', `IPC: Port ${this.getPort()} is occupied, try port ${this.getPort() + 1} for websocket IPC server`);
                // httpsServer.close();
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
        websocketServer.on("connection", (wsClient: WebSocket, request: IncomingMessage) => {
            Log.info(`WebSocket IPC Server got a connection from ${request.socket.remoteAddress}:${request.socket.remotePort}`);

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

    createWebSocketIpcServerWebMode = () => {

        const mainProcess = this.getMainProcess();

        const webServer = mainProcess.getWebServer();
        if (webServer === undefined) {
            return;
        }
        const httpServer = webServer.getHttpServer();
        if (httpServer === undefined) {
            return;
        }

        const websocketServer = new WebSocketServer({
            server: httpServer,
            path: webServer.withBasePath("/ipc"),
        });

        return websocketServer;
    }


    createWebSocketIpcServerDesktopMode = () => {
        const websocketServer = new WebSocketServer({ host: "127.0.0.1", port: this.getPort() });
        return websocketServer;
    }


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

    private registerClient = (client: WebSocket | string, windowId: string) => {
        const mainProcessMode = this.getMainProcess().getMainProcessMode();
        Log.info("register window", windowId, "for WebSocket IPC");
        if (mainProcessMode === "desktop" || mainProcessMode === "web") {
            // desktop mode: websocket client on main/display window
            this.getClients()[windowId] = client;
        } else if (mainProcessMode === "ssh-server") {
            // ssh-server mode: an arbitrary string
            // in this way the DisplayWindowAgent.sendFromMainProcess() or MainWindowAgent.sendFromMainProcess()
            // on the calling process won't send message to the windows
            this.getClients()[windowId] = windowId;
        }

    }



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


    // ------------------------- event listeners ------------------------

    eventListeners: Record<string, (event: any, ...args: any) => any> = {};

    ipcMain = {
        on: (channel: string, callback: (event: any, ...args: any) => void) => {
            this.eventListeners[channel] = callback;
        },
    };



    startToListen = () => {
        // ------------------------- main process ------------------------
        this.ipcMain.on("new-tdm-process", this.handleNewTdmProcess);
        this.ipcMain.on("quit-tdm-process", this.handleQuitTdmProcess);
        this.ipcMain.on("websocket-ipc-connected-on-display-window", this.handleWebsocketIpcConnectedOnDisplayWindow);
        this.ipcMain.on("websocket-ipc-connected-on-main-window", this.handleWebsocketIpcConnectedOnMainWindow);

        // ------------------------- profiles ------------------------
        this.ipcMain.on("open-profiles", this.handleOpenProfiles);
        this.ipcMain.on("save-profiles", this.handleSaveProfiles);
        this.ipcMain.on("save-profiles-as", this.handleSaveProfilesAs);
        this.ipcMain.on("profile-selected", this.handleProfileSelected);
        this.ipcMain.on("update-profiles", this.handleUpdateProfiles);

        // ------------------------- window agents ------------------------
        this.ipcMain.on("bring-up-main-window", this.handleBringUpMainWindow);
        this.ipcMain.on("open-default-display-windows", this.handleOpenDefaultDisplayWindows);
        this.ipcMain.on("create-blank-display-window", this.handleCreateBlankDisplayWindow);
        this.ipcMain.on("focus-window", this.handleFocusWindow);
        this.ipcMain.on("close-window", this.handleCloseWindow);

        // ------------------------- window lifecycle ------------------------
        this.ipcMain.on("main-window-will-be-closed", this.handleMainWindowWillBeClosed);
        this.ipcMain.on("set-window-title", this.handleSetWindowTitle);
        this.ipcMain.on("window-will-be-closed-user-select", this.handleWindowWillBeClosedUserSelect);
        this.ipcMain.on("new-tdl-rendered", this.handleNewTdlRendered);
        this.ipcMain.on("zoom-window", this.handleZoomWindow);
        this.ipcMain.on("move-window", this.handleMoveWindow);
        this.ipcMain.on("set-window-always-on-top", this.handleSetWindowAlwaysOnTop);
        this.ipcMain.on("duplicate-display", this.handleDuplicateDisplay);
        this.ipcMain.on("window-attached-script", this.handleWindowAttachedScript);
        this.ipcMain.on("ping", this.handlePing);

        // ------------------------- display window files ------------------------
        this.ipcMain.on("open-tdl-file", this.handleOpenTdlFiles);
        this.ipcMain.on("reload-tdl-file", this.handleReloadTdlFile);
        this.ipcMain.on("save-tdl-file", this.handleSaveTdlFile);
        this.ipcMain.on("load-db-file-contents", this.handleLoadDbFileContents);
        this.ipcMain.on("save-data-to-file", this.handleSaveDataToFile);
        this.ipcMain.on("input-file-path", this.handleInputFilePath);
        this.ipcMain.on("select-a-file", this.handleSelectAFile);
        this.ipcMain.on("fetch-folder-content", this.handleFetchFolderContent);
        this.ipcMain.on("file-browser-command", this.handleFileBrowserCommand);
        this.ipcMain.on("fetch-thumbnail", this.handleFetchThumbnail);
        this.ipcMain.on("file-converter-command", this.handleFileConverterCommand);
        this.ipcMain.on("save-video-file", this.handleSaveVideoFile);
        this.ipcMain.on("get-media-content", this.handleGetMediaContent);
        this.ipcMain.on("save-text-file", this.handleSaveTextFile);
        this.ipcMain.on("open-text-file", this.handleOpenTextFile);

        // ------------------------- main process resources ------------------------
        this.ipcMain.on("get-symbol-gallery", this.handleGetSymbolGallery);

        // ------------------------- embedded display ------------------------
        this.ipcMain.on("read-embedded-display-tdl", this.handleReadEmbeddedDisplayTdl);
        this.ipcMain.on("obtain-iframe-uuid", this.handleObtainIframeUuid);
        this.ipcMain.on("close-iframe-display", this.handleCloseIframeDisplay);
        this.ipcMain.on("switch-iframe-display-tab", this.handleSwitchIframeDisplayTab);

        // ------------------------- channel access ------------------------
        this.ipcMain.on("tca-get", this.handleTcaGet);
        this.ipcMain.on("tca-get-meta", this.handleTcaGetMeta);
        this.ipcMain.on("fetch-pva-type", this.handleFetchPvaType);
        this.ipcMain.on("tca-put", this.handleTcaPut);
        this.ipcMain.on("tca-monitor", this.handleTcaMonitor);
        this.ipcMain.on("tca-destroy", this.handleTcaDestroy);
        this.ipcMain.on("request-archive-data", this.handleRequestArchiveData);

        // ------------------------- EPICS services ------------------------
        this.ipcMain.on("epics-stats", this.handleEpicsStats);
        this.ipcMain.on("ca-snooper-command", this.handleCaSnooperCommand);
        this.ipcMain.on("request-epics-dbd", this.handleRequestEpicsDbd);
        this.ipcMain.on("ca-sw-command", this.handleCaswCommand);

        // ------------------------- context menu ------------------------
        this.ipcMain.on("show-context-menu", this.handleShowContextMenu);
        this.ipcMain.on("show-context-menu-sidebar", this.handleShowContextMenuSidebar);
        this.ipcMain.on("main-window-show-context-menu", this.handleMainWindowShowContextMenu);

        // ------------------------- utilities ------------------------
        this.ipcMain.on("create-utility-display-window", this.createUtilityDisplayWindow);
        this.ipcMain.on("processes-info", this.handleProcessesInfo);
        this.ipcMain.on("terminal-command", this.handleTerminalCommand);
        this.ipcMain.on("take-screenshot", this.handleTakeScreenShot);
        this.ipcMain.on("print-display-window", this.handlePrintDisplayWindow);
        this.ipcMain.on("register-log-viewer", this.handleRegisterLogViewer);
        this.ipcMain.on("unregister-log-viewer", this.handleUnregisterLogViewer);

        // ------------------------- actions ------------------------
        this.ipcMain.on("open-webpage", this.handleOpenWebpage);
        this.ipcMain.on("execute-command", this.handleExecuteCommand);

        // ------------------------- ssh ------------------------
        this.ipcMain.on("ssh-password-prompt-result", this.handleSshPasswordPromptResult);
        this.ipcMain.on("cancel-ssh-connection", this.handleCancelSshConnection);
    };

    // ------------------------- main process ------------------------
    /**
     * IPC handler for `"new-tdm-process"` requests from a renderer window or a
     * websocket IPC client.
     *
     * Flow:
     * Renderer main window path
     * `MainWindowProfileRunPage`
     *   -> `newTdmProcess()`
     *   -> `sendFromRendererProcess("new-tdm-process", {})`
     *   -> `handleNewTdmProcess()`
     *   -> `MainProcess.spawnNewTdmProcess()`
     *   -> new detached TDM process starts its own main-process lifecycle
     *   -> the new process establishes its own renderer/websocket IPC connections
     *
     * Notes:
     * - In the renderer, `newTdmProcess()` is wired to the `"New TDM process"`
     *   action on the main window profile/run page.
     * - That action is removed in `"ssh-client"` mode, so renderer-originated
     *   requests come from non-SSH main windows.
     * - This handler performs no local validation and does not send a reply. It
     *   only delegates process creation to `spawnNewTdmProcess()`.
     *
     * @param event The websocket client or string identifier representing the event source.
     * @param options Payload for `"new-tdm-process"`; currently unused.
     */
    handleNewTdmProcess = (event: WebSocket | string, options: IpcEventArgType["new-tdm-process"]) => {
        this.getMainProcess().spawnNewTdmProcess();
    };

    /**
     * IPC handler for `"quit-tdm-process"` requests from a renderer window or a
     * websocket IPC client.
     *
     * Flow:
     * `MainWindowProfileRunPage`
     *   -> `quitTdmProcess()`
     *   -> `sendFromRendererProcess("quit-tdm-process", { confirmToQuit: false })`
     *   -> `handleQuitTdmProcess()`
     *   -> `MainProcess.requestQuitTdmProcess(false)`
     *   -> main process either quits immediately or starts quit confirmation flow
     *
     * Renderer confirmation path
     * `IpcManagerOnMainWindow` or `IpcManagerOnDisplayWindow`
     *   -> user confirms `"quit-tdm-process-confirm"` dialog
     *   -> `sendFromRendererProcess("quit-tdm-process", { confirmToQuit: true })`
     *   -> `handleQuitTdmProcess()`
     *   -> `MainProcess.requestQuitTdmProcess(true)`
     *   -> main process quits the current TDM process
     *
     * Notes:
     * - In the renderer, `quitTdmProcess()` is wired to the quit action on the
     *   main window profile/run page.
     * - This handler performs no local validation and does not send a reply. It
     *   only delegates quit orchestration to `requestQuitTdmProcess()`.
     * - `requestQuitTdmProcess()` decides whether to quit immediately or show
     *   modified-window confirmation based on `confirmToQuit` and the current
     *   main process mode.
     *
     * @param event The websocket client or string identifier representing the event source.
     * @param option Payload for `"quit-tdm-process"` containing the quit confirmation state.
     */
    handleQuitTdmProcess = (event: WebSocket | string, option: IpcEventArgType["quit-tdm-process"]) => {
        let { confirmToQuit } = option;
        this.getMainProcess().requestQuitTdmProcess(confirmToQuit);
    }

    // ------------------------- main process connections ------------------------
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
        const mainProcess = this.getMainProcess();
        const windowId = data["windowId"];
        const reconnect = data["reconnect"];
        this.registerClient(event, windowId);

        if (reconnect === true) {
            Log.debug("Reconnect for window", windowId);
            return;
        }

        const windowAgent = mainProcess.getWindowAgentsManager().getAgent(windowId);
        if (!(windowAgent instanceof DisplayWindowAgent)) {
            Log.error("Window", windowId, "is not a Display Window");
            return;
        }

        // lift the block in create window in DisplayWindowLifeCycleManager.createBrowserWindow()
        const lifeCycleManager = windowAgent.getDisplayWindowLifeCycleManager();
        const resolve = lifeCycleManager.getWebsocketIpcConnectedResolve();
        if (resolve === undefined) {
            Log.error(`Display window ${windowId} WebSocket IPC connected with no pending resolver.`);
        } else {
            resolve();
        }
    };

    handleWebsocketIpcConnectedOnMainWindow = (event: WebSocket | string, data: IpcEventArgType["websocket-ipc-connected-on-main-window"]) => {

        // the main processes' ipc manager
        const mainProcess = this.getMainProcess();
        const windowId = data["windowId"];
        const reconnect = data["reconnect"];
        Log.info("register window", windowId, "for WebSocket IPC");

        this.registerClient(event, windowId);

        if (reconnect === true) {
            return;
        }

        const windowAgent = mainProcess.getWindowAgentsManager().getAgent(windowId);
        if (!(windowAgent instanceof MainWindowAgent)) {
            return;
        }

        // lift the block in create window in MainWindowLifeCycleManager.createBrowserWindow()
        const lifeCycleManager = windowAgent.getMainWindowLifeCycleManager();
        const resolve = lifeCycleManager.websocketIpcConnectedResolve;
        lifeCycleManager.websocketIpcConnectedResolve = undefined;
        if (resolve === undefined) {
            Log.error(`Main window ${windowId} WebSocket IPC connected with no pending resolver.`);
        } else {
            resolve();
        }
    };

    // ------------------------- profiles ------------------------

    /**
     * Manually open a profiles file via GUI dialog <br>
     *
     * If more than one files are selected, pop up a message box. <br>
     *
     * Only invoked in main window in startup page.
     */
    handleOpenProfiles = async (event: WebSocket | string, options: IpcEventArgType["open-profiles"]) => {
        const mainWindowAgent = this.getMainProcess().getWindowAgentsManager().getMainWindowAgent();
        if (mainWindowAgent === undefined) {
            return;
        }
        await mainWindowAgent.getMainWindowFile().openProfiles(options);
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
    handleSaveProfiles = async (event: WebSocket | string, options: IpcEventArgType["save-profiles"]): Promise<boolean> => {
        const mainWindowAgent = this.getMainProcess().getWindowAgentsManager().getMainWindowAgent();
        if (mainWindowAgent === undefined) {
            return false;
        }
        return await mainWindowAgent.getMainWindowFile().saveProfiles(options);
    };

    // create new Profiles object
    handleSaveProfilesAs = async (event: WebSocket | string, options: IpcEventArgType["save-profiles-as"]): Promise<boolean> => {
        const mainWindowAgent = this.getMainProcess().getWindowAgentsManager().getMainWindowAgent();
        if (mainWindowAgent === undefined) {
            return false;
        }
        return await mainWindowAgent.getMainWindowFile().saveProfilesAs(options);
    };

    /**
     * Invoked upon the profile is selected. <br>
     */
    handleProfileSelected = async (event: WebSocket | string, option: IpcEventArgType["profile-selected"]): Promise<any> => {
        const { selectedProfileName, args } = option;
        const mainProcess = this.getMainProcess();
        mainProcess.initializeFromProfile(selectedProfileName, args);
    };

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
            );
        } else {
            Log.error("update-profiles can only be request by main window");
        }
    };

    // ------------------------- window agents ------------------------

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
        await this.getMainProcess().getWindowAgentsManager().bringUpMainWindow();
    };

    /**
     * Basically the same as profile-selected handler
     */
    handleOpenDefaultDisplayWindows = async (event: WebSocket | string, options: IpcEventArgType["open-default-display-windows"]) => {
        await this.getMainProcess().getWindowAgentsManager().openDefaultDisplayWindows(options["windowId"]);
    };

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

    // ------------------------- window lifecycle ------------------------

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
    };

    handleMainWindowWillBeClosed = (event: WebSocket | string, data: IpcEventArgType["main-window-will-be-closed"]) => {
        const mainWindowAgent = this.getMainProcess().getWindowAgentsManager().getMainWindowAgent();
        if (mainWindowAgent instanceof MainWindowAgent) {
            mainWindowAgent.getMainWindowLifeCycleManager().handleWindowWillBeClosed(data);
        } else {
            Log.error(`No main window agent. Cancel closing main window ${data["mainWindowId"]}.`);
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

        if (!(displayWindowAgent instanceof DisplayWindowAgent)) {
            Log.error(`No such display window ${displayWindowId}. Cancel handling new TDL rendered event.`);
            return;
        }
        const lifeCycleManager = displayWindowAgent.getDisplayWindowLifeCycleManager();
        const resolve = lifeCycleManager.getNewTdlRenderedResolve();
        lifeCycleManager.setNewTdlRenderedResolve(undefined);
        if (resolve === undefined) {
            Log.error(`Display window ${displayWindowId} new TDL rendered with no pending resolver.`);
        } else {
            resolve({ windowName, tdlFileName });
        }
    };

    // ------------------------- display window files ------------------------

    /**
     * Handle open tdl files request from MainWindow and DisplayWindow
     * 
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
    handleOpenTdlFiles = async (event: WebSocket | string, data: IpcEventArgType["open-tdl-file"]) => {

        const { options } = data;
        let { tdl, tdlFileNames, windowId, mode, editable, macros, replaceMacros, currentTdlFolder } = options;
        const windowAgentsManager = this.getMainProcess().getWindowAgentsManager();

        const selectedProfile = this.getMainProcess().getProfiles().getSelectedProfile();
        if (selectedProfile === undefined) {
            Log.error("Profile not selected!");
            return;
        }

        let windowAgent: MainWindowAgent | DisplayWindowAgent | undefined = windowAgentsManager.getAgent(windowId);

        if (windowAgent === undefined) {
            Log.error(`Cannot find window with ID ${windowId}. Cancel opening TDL file.`);
            return;
        } else if (windowAgent instanceof DisplayWindowAgent) {
            await windowAgent.getDisplayWindowFile().openTdlFiles(data);
            return;
        } else if (windowAgent instanceof MainWindowAgent) {
            await windowAgent.getMainWindowFile().openTdlFiles(data);
            return;
        } else {
            Log.error(`Unsupported window agent type for window ${windowId}. Cancel opening TDL file.`);
        }
    };


    handleReloadTdlFile = async (event: WebSocket | string, data: IpcEventArgType["reload-tdl-file"]) => {

        const { displayWindowId, tdlFileName, mode, editable, externalMacros, replaceMacros } = data;

        const windowAgentsManager = this.getMainProcess().getWindowAgentsManager();

        const selectedProfile = this.getMainProcess().getProfiles().getSelectedProfile();
        if (selectedProfile === undefined) {
            Log.error("Profile not selected!");
            return;
        }

        let displayWindowAgent = windowAgentsManager.getAgent(displayWindowId);

        if (displayWindowAgent instanceof DisplayWindowAgent) {
            displayWindowAgent.getDisplayWindowFile().reloadTdlFile(data, selectedProfile);
        } else {
            Log.error(`Unsupported window agent type for window ${displayWindowId}. Cancel opening TDL file.`);
        }
    };

    handleLoadDbFileContents = async (event: WebSocket | string, data: IpcEventArgType["load-db-file-contents"]) => {
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(data["displayWindowId"]);
        if (!(displayWindowAgent instanceof DisplayWindowAgent)) {
            Log.error(`No such display window ${data["displayWindowId"]}. Cancel loading db file contents.`);
            return;
        }

        await displayWindowAgent.getDisplayWindowFile().loadDbFileContents(data);
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
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(options["displayWindowId"]);
        if (!(displayWindowAgent instanceof DisplayWindowAgent)) {
            Log.error(`No such display window ${options["displayWindowId"]}. Cancel saving file.`);
            return;
        }
        displayWindowAgent.getDisplayWindowFile().saveDataToFile(options);
    };

    // ------------------------- text editor ------------------------

    handleSaveTextFile = (event: WebSocket | string, data: IpcEventArgType["save-text-file"]): boolean => {
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(data["displayWindowId"]);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            return displayWindowAgent.getDisplayWindowTextEditor().handleSaveTextFile(data);
        } else {
            Log.error(`No such display window ${data["displayWindowId"]}. Cancel saving text file ${data["fileName"]}.`);
            return false;
        }
    };

    handleOpenTextFile = async (event: WebSocket | string, options: IpcEventArgType["open-text-file"]) => {
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(options["displayWindowId"]);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            await displayWindowAgent.getDisplayWindowTextEditor().handleOpenTextFile(options);
        } else {
            Log.error(`No such display window ${options["displayWindowId"]}. Cancel opening text file ${options["fileName"]}.`);
        }
    };

    // ------------------------- display window state ------------------------

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
                });
            } else {
                Log.error(`No browser window for display window ${displayWindowId}. Cancel moving window.`);
            }
        } else {
            Log.error(`No such display window ${displayWindowId}. Cancel moving window.`);
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
            } else {
                Log.error(`No browser window for display window ${displayWindowId}. Cancel setting always on top.`);
            }
        } else {
            Log.error(`No such display window ${displayWindowId}. Cancel setting always on top.`);
        }
    }

    /**
     * script is full path or empty string
     */
    handleWindowAttachedScript = (event: WebSocket | string, data: IpcEventArgType["window-attached-script"]) => {
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(data["displayWindowId"]);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            displayWindowAgent.getDisplayWindowAttachedScript().handleWindowAttachedScript(data);
        } else {
            Log.error("Cannot set mode for a non-display-window");
        }
    };

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

    /**
     * client sends a ping every 10 seconds or when a new tdl is rendered
     * 
     * if the server does not receive the ping in 30 seconds, it will clear the resource
     */
    handlePing = (event: WebSocket | string, data: IpcEventArgType["ping"]) => {
        const { displayWindowId } = data;
        const windowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(displayWindowId);
        if (windowAgent instanceof DisplayWindowAgent) {
            windowAgent.updateHeartBeat();
            windowAgent.sendFromMainProcess("pong", data)
        } else if (windowAgent === undefined) {
            Log.error(`No such display window ${displayWindowId}. Cancel ping response.`);
        } else {
            Log.error(`Cannot respond to ping for non-display window ${displayWindowId}.`);
        }
    }

    // ------------------------- channel access ------------------------

    /**
     * Get the data, always time out <br>
     *
     * It should be invoked after the meta data is obtained, otherwise we do not know the
     */
    handleTcaGet = async (event: WebSocket | string, options: IpcEventArgType["tca-get"]) => {
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(options["displayWindowId"]);
        if (!(displayWindowAgent instanceof DisplayWindowAgent)) {
            Log.error(`No such display window ${options["displayWindowId"]}. Cancel TCA GET for ${options["channelName"]}.`);
            return;
        }
        return await displayWindowAgent.getDisplayWindowChannel().handleTcaGet(options);
    };

    /**
     * Get the meta data, it is assumed
     */
    handleTcaGetMeta = async (event: WebSocket | string, options: IpcEventArgType["tca-get-meta"]) => {
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(options["displayWindowId"]);
        if (!(displayWindowAgent instanceof DisplayWindowAgent)) {
            Log.error(`No such display window ${options["displayWindowId"]}. Cancel TCA GET META for ${options["channelName"]}.`);
            return;
        }
        await displayWindowAgent.getDisplayWindowChannel().handleTcaGetMeta(options);
    };

    handleFetchPvaType = async (event: WebSocket | string, options: IpcEventArgType["fetch-pva-type"]) => {
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(options["displayWindowId"]);
        if (!(displayWindowAgent instanceof DisplayWindowAgent)) {
            Log.error(`No such display window ${options["displayWindowId"]}. Cancel fetching PVA type for ${options["channelName"]}.`);
            return;
        }
        await displayWindowAgent.getDisplayWindowChannel().handleFetchPvaType(options);
    };

    handleTcaMonitor = (event: WebSocket | string, options: IpcEventArgType["tca-monitor"]) => {
        const { displayWindowId, channelName } = options;
        const windowAgentsManager = this.getMainProcess().getWindowAgentsManager();
        const displayWindowAgent = windowAgentsManager.getAgent(displayWindowId);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            displayWindowAgent.tcaMonitor(channelName);
        } else {
            Log.error(`No such display window ${displayWindowId}. Cancel TCA MONITOR for ${channelName}.`);
        }
    };

    handleTcaDestroy = (event: WebSocket | string, options: IpcEventArgType["tca-destroy"]) => {
        const { displayWindowId, channelName } = options;
        const windowAgentsManager = this.getMainProcess().getWindowAgentsManager();
        const displayWindowAgent = windowAgentsManager.getAgent(displayWindowId);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            displayWindowAgent.removeChannel(channelName);
        } else {
            Log.error(`No such display window ${displayWindowId}. Cancel TCA DESTROY for ${channelName}.`);
        }
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
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(options["displayWindowId"]);
        if (!(displayWindowAgent instanceof DisplayWindowAgent)) {
            Log.error(`No such display window ${options["displayWindowId"]}. Cancel TCA PUT for ${options["channelName"]}.`);
            return;
        }
        return await displayWindowAgent.getDisplayWindowChannel().handleTcaPut(options);
    };

    // ------------------------- utility window factory ------------------------

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
        const { utilityType, utilityOptions, windowId } = options;
        this.getMainProcess().getWindowAgentsManager().getUtilityWindowFactory().createUtilityDisplayWindow(utilityType, utilityOptions, windowId);
    };

    // ------------------------- context menu ------------------------

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

    handleMainWindowShowContextMenu = (event: WebSocket | string, options: IpcEventArgType["main-window-show-context-menu"]) => {
        const { menu } = options;
        const mainWidowAgent = this.getMainProcess().getWindowAgentsManager().getMainWindowAgent();
        if (mainWidowAgent !== undefined) {
            mainWidowAgent.showContextMenu(menu);
        } else {
            Log.error("No main window agent. Cancel showing main window context menu.");
        }
    };

    // ------------------------- display window file tools ------------------------

    /**
     * Handle the file path input from the renderer process. <br>
     *
     * This is typically invoked when the user manually types in a file path (e.g. in SSH server mode)
     * instead of using a native file dialog. <br>
     *
     * It resolves the pending file selection promise on the corresponding window file helper
     * with the provided file name.
     *
     * @param {string} windowId The ID of the window that requested the file path input.
     * @param {string} fileName The file path entered by the user.
     */
    handleInputFilePath = (event: WebSocket | string, data: IpcEventArgType["input-file-path"]) => {
        const { windowId, fileName } = data;
        const windowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(windowId);
        if (windowAgent instanceof MainWindowAgent) {
            const resolveFunc = windowAgent.getMainWindowFile().selectFileInputResolve;
            resolveFunc(fileName);
        } else if (windowAgent instanceof DisplayWindowAgent) {
            const resolveFunc = windowAgent.getDisplayWindowFile().selectFileInputResolve;
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

        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(displayWindowId);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            displayWindowAgent.getDisplayWindowFile().selectAFile(data);
        } else {
            Log.error(`No such display window ${displayWindowId}. Cancel selecting file.`);
        }
    };

    handleFetchFolderContent = (event: WebSocket | string, options: IpcEventArgType["fetch-folder-content"]) => {

        const { displayWindowId } = options;
        console.log("options ----------------------", options)
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(displayWindowId);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            displayWindowAgent.getDisplayWindowFile().readFolder(options);
        } else {
            Log.error(`No such display window ${displayWindowId}. Cancel reading folder content.`);
        }
    };

    handleFileBrowserCommand = (event: WebSocket | string, message: IpcEventArgType["file-browser-command"]) => {
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(message["displayWindowId"]);
        if (!(displayWindowAgent instanceof DisplayWindowAgent)) {
            return;
        }
        displayWindowAgent.getDisplayWindowFileBrowser().executeFileBrowserCommand(message);
    };

    handleFetchThumbnail = async (event: WebSocket | string, message: IpcEventArgType["fetch-thumbnail"]) => {
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(message["displayWindowId"]);
        if (!(displayWindowAgent instanceof DisplayWindowAgent)) {
            Log.error(`No such display window ${message["displayWindowId"]}. Cancel fetching thumbnail.`);
            return;
        }

        await displayWindowAgent.getDisplayWindowFileBrowser().fetchThumbnail(message);
    };

    handleFileConverterCommand = (event: WebSocket | string, options: IpcEventArgType["file-converter-command"]) => {
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(options["displayWindowId"]);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            displayWindowAgent.getDisplayWindowFile().executeFileConverterCommand(options);
        } else {
            Log.error(`No such display window ${options["displayWindowId"]}. Cancel file converter command.`);
        }
    };

    handleSaveVideoFile = (event: WebSocket | string, data: IpcEventArgType["save-video-file"]) => {
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(data["displayWindowId"]);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            displayWindowAgent.getDisplayWindowFile().saveVideoFile(data);
        }
    };

    handleGetMediaContent = (event: WebSocket | string, options: IpcEventArgType["get-media-content"]) => {
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(options["displayWindowId"]);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            displayWindowAgent.getDisplayWindowFile().getMediaContent(options);
        } else {
            Log.error(`No such display window ${options["displayWindowId"]}. Cancel getting media content for ${options["fullFileName"]}.`);
        }
    };

    // ------------------------- main process resources ------------------------

    handleGetSymbolGallery = (event: WebSocket | string, options: IpcEventArgType["get-symbol-gallery"]) => {
        this.getMainProcess().getSymbolGallery().handleGetSymbolGallery(options);
    };

    // ------------------------- embedded display ------------------------

    handleReadEmbeddedDisplayTdl = async (event: WebSocket | string, data: IpcEventArgType["read-embedded-display-tdl"]) => {
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(data["displayWindowId"]);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            await displayWindowAgent.getDisplayWindowEmbeddedDisplay().handleReadEmbeddedDisplayTdl(data);
        } else {
            Log.info("Cannot find Display Window Agent for", data["displayWindowId"]);
        }
    };

    /**
     * do not show any error message in display window
     */
    handleObtainIframeUuid = async (event: WebSocket | string, options: IpcEventArgType["obtain-iframe-uuid"],) => {
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(options["displayWindowId"]);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            await displayWindowAgent.getDisplayWindowEmbeddedDisplay().handleObtainIframeUuid(options);
        } else {
            Log.error(`Cannot find display window ${options["displayWindowId"]} to obtain iframe uuid.`);
        }
    };

    handleSwitchIframeDisplayTab = async (event: WebSocket | string, options: IpcEventArgType["switch-iframe-display-tab"],) => {
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(options["displayWindowId"]);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            await displayWindowAgent.getDisplayWindowEmbeddedDisplay().handleSwitchIframeDisplayTab(options);
        } else {
            Log.error(`Cannot find display window ${options["displayWindowId"]} to switch iframe display tab.`);
        }
    };

    handleCloseIframeDisplay = (event: WebSocket | string, options: IpcEventArgType["close-iframe-display"]) => {
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(options["displayWindowId"]);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            displayWindowAgent.getDisplayWindowEmbeddedDisplay().handleCloseIframeDisplay();
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
        this.getMainProcess().getRpc().executeCommand(data);
    }


    // ------------------------- utilities ------------------------

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

    // ------------------------- EPICS services ------------------------

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

    // ------------------------- ssh ------------------------

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

    // ------------------------- display window utilities ------------------------

    handleTerminalCommand = (event: WebSocket | string, data: IpcEventArgType["terminal-command"]) => {
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(data["displayWindowId"]);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            displayWindowAgent.getDisplayWindowTerminal().executeTerminalCommand(data);
        } else {
            Log.error(`No such display window ${data["displayWindowId"]}. Cancel terminal command ${data["command"]}.`);
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

    // ------------------------- archive ------------------------

    handleRequestArchiveData = async (event: WebSocket | string, options: IpcEventArgType["request-archive-data"]) => {
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(options["displayWindowId"]);
        if (!(displayWindowAgent instanceof DisplayWindowAgent)) {
            return;
        }
        const sql = this.getMainProcess().getSql();
        if (sql === undefined) {
            Log.error("Cannot obtain archive data for", options["channelName"], "from", options["startTime"], "to", options["endTime"]);
            return;
        }
        const result = await sql.requestArchiveData(options["channelName"], options["startTime"], options["endTime"]);
        if (result !== undefined) {
            // do not process data in main process, the resouce is more precious in the main process
            displayWindowAgent.sendFromMainProcess("new-archive-data", {
                ...options,
                archiveData: result,
            });
        }
    }

    // ------------------------- log viewer ------------------------

    handleRegisterLogViewer = (event: WebSocket | string, options: IpcEventArgType["register-log-viewer"]) => {
        // logs.registerLogViewer(info);
    }
    handleUnregisterLogViewer = (event: WebSocket | string, options: IpcEventArgType["unregister-log-viewer"]) => {
        // logs.unregisterLogViewer(info);
    }


    // ------------------------- getters and setters ------------------------

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
