import { dialog } from "electron";
import { BrowserView, BrowserWindow } from "electron";
import { MainProcess } from "../mainProcess/MainProcess";
import { Profiles } from "../profile/Profiles";
import { ChannelAgentsManager } from "../channel/ChannelAgentsManager";
import { type_tdl } from "../file/FileReader";
import { type_options_createDisplayWindow } from "../windows/WindowAgentsManager";
import * as fs from "fs";
import { DisplayWindowAgent } from "../windows/DisplayWindow/DisplayWindowAgent";
import { type_dbrData } from "../../rendererProcess/global/GlobalVariables";
import { Channel_DBR_TYPES } from "../../rendererProcess/global/GlobalVariables";
import { CaChannelAgent } from "../channel/CaChannelAgent";
import { LocalChannelAgent, type_LocalChannel_data } from "../channel/LocalChannelAgent";
import { FileReader } from "../file/FileReader";
import path from "path";
import { type_args } from "../arg/ArgParser";
import { Log } from "../log/Log";
import { type_sshServerConfig } from "./SshClient";
import * as os from "os";
import { MainWindowAgent } from "../windows/MainWindow/MainWindowAgent";
import pidusage from "pidusage";
import { spawn } from "child_process";
import { SqlState } from "../archive/Sql";
import { Environment, type_network_stats } from "epics-tca";

/**
 * Manage IPC messages sent from renderer process.
 */
export class IpcManagerOnMainProcess {
    private _mainProcess: MainProcess;

    constructor(mainProcess: MainProcess) {
        this._mainProcess = mainProcess;
    }

    getMainProcess = () => {
        return this._mainProcess;
    };

    getMainProcessId = () => {
        return this.getMainProcess().getProcessId();
    };

    setMainProcess = (mainProcess: MainProcess) => {
        this._mainProcess = mainProcess;
    };

    eventListeners: Record<string, (event: any, ...args: any) => any> = {};
    getEventListeners = () => {
        return this.eventListeners;
    };

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
        // ------------------ tdl file ----------------------
        // open a tdl file, which creates a new display window
        this.ipcMain.on("open-tdl-file", this.handleOpenTdlFiles);
        // load tdl file, which does not create display window
        this.ipcMain.on("load-tdl-file", this.handleReloadTdlFile);
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
        // tca put
        this.ipcMain.on("tca-put", this.handleTcaPut);
        // tca put meta
        // ipcMain.on("tca-put-meta", this.handleTcaPutMeta);
        // tca monitor
        this.ipcMain.on("tca-monitor", this.handleTcaMonitor);
        // tca destroy channel
        this.ipcMain.on("tca-destroy", this.handleTcaDestroy);

        // context menu
        this.ipcMain.on("show-context-menu", this.handleShowContextMenu);
        this.ipcMain.on("show-context-menu-sidebar", this.handleShowContextMenuSidebar);
        this.ipcMain.on("duplicate-display", this.handleDuplicateDisplay);
        this.ipcMain.on("main-window-show-context-menu", this.handleMainWindowShowContextMenu);

        // utility window
        this.ipcMain.on("create-utility-display-window", this.createUtilityDisplayWindow);
        this.ipcMain.on("data-viewer-export-data", this.handleDataViewerExportData);
        this.ipcMain.on("processes-info", this.handleProcessesInfo);
        this.ipcMain.on("epics-stats", this.handleEpicsStats);
        this.ipcMain.on("ca-snooper-command", this.handleCaSnooperCommand);
        this.ipcMain.on("ca-sw-command", this.handleCaswCommand);

        // profiles
        this.ipcMain.on("open-profiles", this.handleOpenProfiles);
        // message from main window before profile is slected
        this.ipcMain.on("save-profiles", this.handleSaveProfiles);
        this.ipcMain.on("save-profiles-as", this.handleSaveProfilesAs);
        // not blank-profile
        // this.ipcMain.on("create-blank-profiles", this.handleCreateBlankProfiles);
        // ---------------- messages ----------------
        // this.ipcMain.on("show-message-box", this.handleShowMessageBox);
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
    };

    // ---------------- TDM process ----------------------------

    handleNewTdmProcess = (event: any) => {
        const mainProcesses = this.getMainProcess().getMainProcesses();
        mainProcesses.createProcess();
    };

    /**
     * Quit this process, initiated from main window
     */
    handleQuitTdmProcess = (event: any, confirmToQuit: boolean | undefined = undefined) => {
        if (this.getMainProcess().getMainProcessMode() === "ssh-server") {
            const sshServer = this.getMainProcess().getMainProcesses().getIpcManager().getSshServer();
            sshServer?.sendToTcpClient(JSON.stringify(
                { command: "quit-tdm-process" }));
        }
        // we have confirmed in the message box to quit
        if (confirmToQuit === true) {
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

            });
            return;
            // }
        } else {
            this.getMainProcess().quit()
        }
        // const mainProcesses = this.getMainProcess().getMainProcesses();
        // mainProcesses.quit();
    }

    handleWebsocketIpcConnected = (event: any, data: {
        processId: string,
        windowId: string,
    }) => {
        // the main processes' ipc manager
        const ipcManager = this.getMainProcess().getMainProcesses().getIpcManager();
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
            if (mainProcess !== undefined) {
                const windowId = data["windowId"];
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
                    Log.error("-1", "There is no display window agent for this window ID on server side, stop.");
                    delete ipcManager.getClients()[windowId];
                }
            } else {
                Log.error("-1", "There is no such a main process on server side, stop.");
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
    handleOpenProfiles = async (event: any, profilesFileName1: string = "") => {
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
                                messageType: "error",
                                humanReadableMessages: ["Only one file can be selected"],
                                rawMessages: [],
                            }
                        )
                    } else {
                        profilesFileName = profilesFileNames[0];
                    }
                } catch (e) {
                    mainWindowAgent.sendFromMainProcess("dialog-show-message-box",
                        {
                            messageType: "error",
                            humanReadableMessages: [`${e}`],
                            rawMessages: [],
                        }
                    )
                    return;
                }
            } else if (this.getMainProcess().getMainProcessMode() === "ssh-server") {
                mainWindowAgent.sendFromMainProcess("dialog-show-input-box",
                    {
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
                    })
                return;
            }
        }
        try {
            // read file
            const newProfiles = await this.getMainProcess().createProfilesFromFile(profilesFileName);

            // read default and OS-defined EPICS environment variables
            // in main window editing page, we need env default and env os
            const env = Environment.getTempInstance();
            const envDefault = env.getEnvDefault();
            const envOs = env.getEnvOs();

            // tell main window to update
            mainWindowAgent.sendFromMainProcess("after-main-window-gui-created", newProfiles.serialize(), profilesFileName, envDefault, envOs);
        } catch (e) {
            mainWindowAgent.sendFromMainProcess("dialog-show-message-box",
                {
                    messageType: "error",
                    humanReadableMessages: [`${profilesFileName} is not a valid TDM profiles file, or it cannot be opened or created.`],
                    rawMessages: [],
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
    handleSaveProfiles = (event: any, modifiedProfiles: Record<string, any>, filePath1: string = ""): boolean => {
        const mainProcessMode = this.getMainProcess().getMainProcessMode();
        if (mainProcessMode === "web") {
            // do not save to web server
            return false;
        }

        let filePath: string | undefined = this.getMainProcess().getProfilesFileName();
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
                    Log.info(this.getMainProcessId(), "No Profiles file selected, cancel saving");
                    return false;
                }
            } else if (this.getMainProcess().getMainProcessMode() === "ssh-server") {

                mainWindowAgent.sendFromMainProcess("dialog-show-input-box",
                    {
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
                );
                return false;
            }
        }

        const newProfiles = new Profiles(modifiedProfiles);
        newProfiles.setFilePath(filePath);

        try {
            // save first
            newProfiles.save();
            this.getMainProcess().setProfiles(newProfiles);
        } catch (e) {
            Log.error(this.getMainProcessId(), e);
            mainWindowAgent.sendFromMainProcess("dialog-show-message-box",
                {
                    messageType: "error",
                    humanReadableMessages: [`Error save file to ${filePath}.`],
                    rawMessages: [],
                }
            )

            return false;
        }
        return true;
    };

    // create new Profiles object
    handleSaveProfilesAs = (event: any, modifiedProfiles: Record<string, any>, filePath1: string = ""): boolean => {
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
                    Log.error(this.getMainProcessId(), "No file selected, cancel saving Profiles file.");
                    return false;
                }
            } else if (this.getMainProcess().getMainProcessMode() === "ssh-server") {

                mainWindowAgent.sendFromMainProcess("dialog-show-input-box",
                    {
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
                );
                return false;
            }
        }
        const newProfiles = new Profiles(modifiedProfiles);
        newProfiles.setFilePath(filePath);

        try {
            // save first
            newProfiles.save();
            this.getMainProcess().setProfiles(newProfiles);
        } catch (e) {
            Log.error(this.getMainProcessId(), e);
            mainWindowAgent.sendFromMainProcess("dialog-show-message-box",
                {
                    messageType: "error",
                    humanReadableMessages: [`Error save file to ${filePath}.`],
                    rawMessages: [],
                }
            )

            return false;
        }
        return true;
    };

    /**
     * Create an in-memory blank profiles.
     */
    // handleCreateBlankProfiles = async (event: IpcMainEvent) => {
    //     const mainWindowAgent = this._mainProcess.getWindowAgentsManager().getMainWindowAgent();
    //     if (mainWindowAgent === undefined) {
    //         Log.error(this.getMainProcessId(), "MainWindowAgent not found, cannot create blank profile");
    //         return;
    //     }

    //     // read file
    //     const newProfiles = await this.getMainProcess().createProfilesFromObj({});
    //     // tell main window to update
    //     mainWindowAgent.sendFromMainProcess("main-window-created", newProfiles.serialize(), newProfiles.getFilePath());
    // };
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

    handleBringUpMainWindow = async () => {
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
                    mainWindowAgent.sendFromMainProcess("after-profile-selected", selectedProfileName);

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

    handleFocusWindow = async (event: any, displayWindowId: string) => {
        const windowAgentsManager = this.getMainProcess().getWindowAgentsManager();
        const displayWindowAgent = windowAgentsManager.getAgent(displayWindowId);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            displayWindowAgent.focus();
        }
    };

    handleCloseWindow = async (event: any, displayWindowId: string) => {
        const windowAgentsManager = this.getMainProcess().getWindowAgentsManager();
        const windowAgent = windowAgentsManager.getAgent(displayWindowId);
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
    handleSetWindowTitle = (event: any, windowId: string, newTitle: string, modified: " [Modified]" | "" | undefined) => {
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
    handleWindowWillBeClosed = (
        event: any,
        data: {
            displayWindowId: string;
            close: boolean;
            tdlFileName?: string;
            tdl?: type_tdl;
            // try to save the contents if we are closing a TextEditor utility window
            textEditorFileName?: string;
            textEditorContents?: string;
            widgetKey?: string;
            saveConfirmation?: "Save" | "Don't Save" | "Cancel",
        }
    ) => {
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
                    const sshServer = this.getMainProcess().getMainProcesses().getIpcManager().getSshServer();
                    // fs.writeFileSync("/Users/haohao/tdm.log", `window will be closed, tell the ssh-client to close window =====================\n`, { flag: "a" });
                    if (sshServer !== undefined) {
                        // this is a tcp command, not websocket
                        // fs.writeFileSync("/Users/haohao/tdm.log", `window will be closed, tell the ssh-client to close window B =====================\n`, { flag: "a" });
                        sshServer.sendToTcpClient(JSON.stringify(
                            {
                                command: "close-browser-window",
                                data: {
                                    mainProcessId: this.getMainProcess().getWindowAgentsManager().getMainProcess().getProcessId(),
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
                    windowAgentsManager.preloadedDisplayWindowAgent !== displayWindowAgent &&
                    // embedded displays don't need to be saved
                    windowAgentsManager.preloadedEmbeddedDisplayAgent !== displayWindowAgent)
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
                                    );
                                    return;
                                }
                            }
                            if (tdlFileName !== undefined) {
                                // save file
                                fs.writeFile(tdlFileName, JSON.stringify(data["tdl"]), (err) => {
                                    if (err) {
                                        // error when saving file, do not close the window
                                        Log.error(this.getMainProcessId(), err);
                                        displayWindowAgent.sendFromMainProcess("dialog-show-message-box", {
                                            // command?: string | undefined,
                                            messageType: "error", // | "warning" | "info", // symbol
                                            humanReadableMessages: [`Error saving file ${tdlFileName}`], // each string has a new line
                                            rawMessages: [`${err}`], // computer generated messages
                                            // buttons?: type_DialogMessageBoxButton[] | undefined,
                                            // attachment?: any,

                                        })
                                        displayWindowAgent.readyToClose = false;
                                    } else {
                                        // update tdlFileName on client side, absolute path
                                        displayWindowAgent.sendFromMainProcess("tdl-file-saved", tdlFileName);
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
                                command: "window-will-be-closed-confirm",
                                messageType: "warning",
                                humanReadableMessages: [`Do you want to save the changes you made? Your changes will be lost if you don't save them.`],
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

    handleMainWindowWillBeClosed = (event: any, data: {
        mainWindowId: string,
        close: boolean,
    }) => {
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
                    const sshServer = this.getMainProcess().getMainProcesses().getIpcManager().getSshServer();
                    // fs.writeFileSync("/Users/haohao/tdm.log", `window will be closed, tell the ssh-client to close window =====================\n`, { flag: "a" });
                    if (sshServer !== undefined) {
                        // this is a tcp command, not websocket
                        // fs.writeFileSync("/Users/haohao/tdm.log", `window will be closed, tell the ssh-client to close window B =====================\n`, { flag: "a" });
                        sshServer.sendToTcpClient(JSON.stringify(
                            {
                                command: "close-browser-window",
                                data: {
                                    mainProcessId: this.getMainProcess().getWindowAgentsManager().getMainProcess().getProcessId(),
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
    handleProfileSelected = async (
        event: any,
        selectedProfileName: string,
        args: type_args | undefined = undefined,
        httpResponse: any = undefined,
        openDefaultDisplayWindows: boolean = true,
    ) => {
        this.getMainProcess().getProfiles().setSelectedProfileName(selectedProfileName);
        const selectedProfile = this.getMainProcess().getProfiles().getSelectedProfile();
        // select to run a new process as ssh-client mode, it can only be started from desktop mode
        if (this.getMainProcess().getMainProcessMode() === "desktop" && selectedProfile !== undefined && selectedProfile.isSshConfig()) {

            // connect to remote
            const mainProcesses = this.getMainProcess().getMainProcesses();
            const sshConfigRaw = selectedProfile.getCategory("SSH Configuration");
            const sshServerConfig: type_sshServerConfig = {
                ip: sshConfigRaw["Host Name/IP Address"]["value"],
                port: parseInt(sshConfigRaw["Port"]["value"]),
                userName: sshConfigRaw["User Name"]["value"],
                privateKeyFile: sshConfigRaw["Private Key File"]["value"],
                tdmCommand: sshConfigRaw["TDM Command"]["value"],
            };
            Log.info(this.getMainProcessId(), "We are going to run a new process on remote ssh using config", sshServerConfig)

            if (typeof sshServerConfig.ip === "string" && !isNaN(sshServerConfig.port) && typeof sshServerConfig.userName === "string" && typeof sshServerConfig.privateKeyFile === "string") {
                const callingProcessId = this.getMainProcess().getProcessId();
                mainProcesses.createProcess(
                    // the callback is invoked in MainProcess constructor, providing the calling main process ID
                    // to SshClient, so that the calling process is terminated at "main-window-create-browser-window" stage
                    // which happens after the remote ssh TCP server is successfully connected.
                    // (mainProcess: MainProcess) => {
                    //     return callingProcessId;
                    // },
                    undefined,
                    "ssh-client", undefined, { ...sshServerConfig, callingProcessId: callingProcessId });
            } else {
                Log.error(this.getMainProcessId(), "Profiles file error: Cannot create main process for ssh config", selectedProfileName);
            }
        } else  // regular profile
        {
            if (httpResponse === undefined) { // non-web mode
                // (1)
                this.getMainProcess().getProfiles().setSelectedProfileName(selectedProfileName);
                // (2)
                const selectedProfile = this.getMainProcess().getProfiles().getSelectedProfile();
                if (selectedProfile === undefined) {
                    Log.error(this.getMainProcessId(), `Profile ${selectedProfileName} does not exist`);
                    return;
                }
                const channelAgentsManager = new ChannelAgentsManager(selectedProfile, this.getMainProcess());
                await channelAgentsManager.createAndInitContext();
                this.getMainProcess().setChannelAgentsManager(channelAgentsManager);

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
                Log.error(this.getMainProcessId(), `Profile ${selectedProfileName} does not exist`);
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
                if (path.extname(tdlFileName) === ".tdl" || path.extname(tdlFileName) === ".bob" || path.extname(tdlFileName) === ".edl") {
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
                                Log.error(this.getMainProcessId(), `Cannot read file ${tdlFileName}`);
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
                    this.createUtilityDisplayWindow(undefined, "PvTable", { channelNames: channelNames });
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
                mainWindowAgent.sendFromMainProcess("after-profile-selected", selectedProfileName);
            }
        }
    }


    /**
     * Basically the same as profile-selected handler <br>
     */
    handleOpenDefaultDisplayWindows = (event: any) => {
        const selectedProfile = this.getMainProcess().getProfiles().getSelectedProfile();
        if (selectedProfile === undefined) {
            Log.error(this.getMainProcessId(), `Profile not selected yet`);
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
            if (path.extname(tdlFileName) === ".tdl" || path.extname(tdlFileName) === ".bob" || path.extname(tdlFileName) === ".edl") {
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
                        Log.error(this.getMainProcessId(), `Cannot read file ${tdlFileName}`);
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
                this.createUtilityDisplayWindow(undefined, "PvTable", { channelNames: channelNames });
            }
        }
    };

    handleCreateBlankDisplayWindow = (event: any, options: {
        displayWindowId: string,
    }) => {
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
    handleOpenTdlFiles = (
        event: any,
        options: {
            tdl?: type_tdl;
            tdlStr?: string; // for web mode only, the web mode reads contents of the file (.tdl or .db), but it cannot parse the file contents in browser
            tdlFileNames?: string[];
            mode: "editing" | "operating";
            editable: boolean;
            // external macros: user-provided and parent display macros
            macros: [string, string][];
            replaceMacros: boolean;
            currentTdlFolder?: string;
            windowId?: string;
            postCommand?: string;
            sendContentsToWindow?: boolean; // whether to send the file contents back to the display window, for Channel Graph window
        },
        httpResponse: any = undefined
    ) => {
        const windowAgentsManager = this.getMainProcess().getWindowAgentsManager();
        const selectedProfile = this.getMainProcess().getProfiles().getSelectedProfile();
        if (selectedProfile === undefined) {
            Log.error(this.getMainProcessId(), "Profile not selected!");
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

            if (path.extname(tdlFileName) === ".tdl" || path.extname(tdlFileName) === ".bob" || path.extname(tdlFileName) === ".edl") {
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
                this.createUtilityDisplayWindow(undefined, "PvTable", { channelNames: channelNames }, httpResponse);
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
                            filters: [{ name: "tdl", extensions: ["tdl", "json", "bob", "edl", "db", "template"] }],
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

                        windowAgent.sendFromMainProcess("dialog-show-input-box", {
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
                        });
                        return;
                    }

                    if (tdlFileNames === undefined) {
                        return;
                    }
                }
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
                for (let tdlFileName of tdlFileNames) {
                    // .tdl, .edl, or .bob
                    if (path.extname(tdlFileName) === ".tdl" || path.extname(tdlFileName) === ".bob" || path.extname(tdlFileName) === ".edl") {
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
                                Log.error(this.getMainProcessId(), `Cannot read tdl file ${tdlFileName}`);
                                if (windowAgent !== undefined) {
                                    windowAgent.sendFromMainProcess("dialog-show-message-box", {
                                        // command?: string | undefined;
                                        messageType: "error", // | "warning" | "info";
                                        humanReadableMessages: [`Failed to open file ${tdlFileName}`],
                                        rawMessages: [],
                                        // buttons?: type_DialogMessageBoxButton[] | undefined;
                                        // attachment?: any;
                                    })
                                }
                            }
                        });
                    } else if (path.extname(tdlFileName) === ".db" || path.extname(tdlFileName) === ".template") {
                        const db = FileReader.readDb(tdlFileName, selectedProfile, options["currentTdlFolder"]);
                        if (options["sendContentsToWindow"] === true) {
                            // for ChannelGraph
                            const displayWindowId = options["windowId"];
                            if (displayWindowId !== undefined) {
                                const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(displayWindowId);
                                if (displayWindowAgent instanceof DisplayWindowAgent) {
                                    displayWindowAgent.sendFromMainProcess("db-file-contents", {
                                        displayWindowId: options["windowId"],
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
                            this.createUtilityDisplayWindow(undefined, "PvTable", { channelNames: channelNames });
                        }
                    } else {
                        if (windowAgent !== undefined) {
                            windowAgent.sendFromMainProcess("dialog-show-message-box", {
                                // command?: string | undefined;
                                messageType: "error", // | "warning" | "info";
                                humanReadableMessages: [`${tdlFileName} is not a .tdl, .edl .db, or .template file`],
                                rawMessages: [],
                                // buttons?: type_DialogMessageBoxButton[] | undefined;
                                // attachment?: any;
                            })
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
            Log.error(this.getMainProcessId(), e);
            if (windowAgent !== undefined) {
                windowAgent.sendFromMainProcess("dialog-show-message-box", {
                    // command?: string | undefined;
                    messageType: "error", // | "warning" | "info";
                    humanReadableMessages: [`Failed to open file ${tdlFileNames}`],
                    rawMessages: [`${e}`],
                    // buttons?: type_DialogMessageBoxButton[] | undefined;
                    // attachment?: any;

                })
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
    handleReloadTdlFile = (
        event: any,
        options: {
            displayWindowId: string;
            tdlFileName: string;
            mode: "editing" | "operating";
            editable: boolean;
            externalMacros: [string, string][];
            replaceMacros: boolean;
            currentTdlFolder?: string;
        }
    ) => {
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
            Log.error(this.getMainProcessId(), "Profile not selected.");
            return;
        }
        try {
            const displayWindowAgent = windowAgentsManager.getAgent(windowId);
            if (displayWindowAgent === undefined) {
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
                        Log.error(this.getMainProcessId(), "tdl cannot be read");
                    }
                });
            }
        } catch (e) {
            Log.error(this.getMainProcessId(), e);
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
    handleSaveTdlFile = (event: any, windowId: string, tdl: type_tdl, tdlFileName1: string) => {
        const mainProcessMode = this.getMainProcess().getMainProcessMode();
        if (mainProcessMode === "web") {
            // do not save to web server
            return;
        }
        // if tdlFileName is not "", then it must be the resolved full path of this tdl file
        let tdlFileName: string | undefined = tdlFileName1;
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(windowId);
        if (!(displayWindowAgent instanceof DisplayWindowAgent)) {
            Log.error(this.getMainProcessId(), `No such display window ${windowId}. Cancel saving file.`);
            return;
        }
        Log.debug(this.getMainProcessId(), "We are going to save TDL", tdlFileName1);
        try {
            // save as if the tdl is an in-memory display, or edl, or bob file
            if (tdlFileName === "" || tdlFileName.endsWith(".edl") || tdlFileName.endsWith(".bob")) {
                if (this.getMainProcess().getMainProcessMode() === "desktop") {

                    tdlFileName = dialog.showSaveDialogSync({ title: "Save tdl file", filters: [{ name: "tdl", extensions: ["tdl", "json"] }] });
                } else if (this.getMainProcess().getMainProcessMode() === "ssh-server") {
                    displayWindowAgent.sendFromMainProcess("dialog-show-input-box",
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
                    );
                    return;
                }
            }
            // cancel
            if (tdlFileName === undefined) {
                Log.debug(this.getMainProcessId(), "Did not select TDL file name, cancel saving tdl");
                return;
            }

            fs.writeFile(tdlFileName, JSON.stringify(tdl), (err) => {
                if (err) {
                    Log.error(this.getMainProcessId(), err);
                    displayWindowAgent.sendFromMainProcess("dialog-show-message-box", {
                        // messageType: "error" | "warning" | "info",
                        // humanReadableMessages: string[],
                        // rawMessages: string[],
                        messageType: "error",
                        humanReadableMessages: [`Failed to save ${tdlFileName}`, "Please check the file permission."],
                        rawMessages: ["Below is the raw message:", `${err}`],
                    })

                } else {
                    Log.info(this.getMainProcessId(), `Saved tdl to file ${tdlFileName}`);
                    displayWindowAgent.sendFromMainProcess("tdl-file-saved", tdlFileName);
                }
            });
        } catch (e) {
            // errors should have been catched in callback
        }
    };

    /**
     * Save any type of data to a file
     */
    handleSaveDataToFile = (event: any,
        options: {
            displayWindowId: string,
            // this data must be serializable, e.g. a regular object
            data: any,
            preferredFileTypes: string[],
            fileName?: string,
        }
    ) => {
        const mainProcessMode = this.getMainProcess().getMainProcessMode();
        if (mainProcessMode === "web") {
            // do not save to web server
            return;
        }

        const { displayWindowId, data, preferredFileTypes } = options;
        Log.debug(this.getMainProcessId(), "We are going to save a file");
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(displayWindowId);
        if (!(displayWindowAgent instanceof DisplayWindowAgent)) {
            Log.error(this.getMainProcessId(), `No such display window ${displayWindowId}. Cancel saving file.`);
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
                    );
                    return;
                }
            }

            if (fileName === undefined) {
                displayWindowAgent.sendFromMainProcess("dialog-show-message-box", {
                    messageType: "error", // | "warning" | "info",
                    humanReadableMessages: [`Failed to save file: file not selected`],
                    // rawMessages: ["Below is the raw message:", `${err}`],
                });
                return;
            }

            fs.writeFile(fileName, JSON.stringify(data), (err) => {
                if (err) {
                    Log.error(this.getMainProcessId(), err);
                    displayWindowAgent.sendFromMainProcess("dialog-show-message-box", {
                        // messageType: "error" | "warning" | "info",
                        // humanReadableMessages: string[],
                        // rawMessages: string[],
                        messageType: "error",
                        humanReadableMessages: [`Failed to save ${fileName}`, "Please check the file permission."],
                        rawMessages: ["Below is the raw message:", `${err}`],
                    })

                } else {
                    Log.info(this.getMainProcessId(), `Saved tdl to file ${fileName}`);
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
    handleNewTdlRendered = (event: any, displayWindowId: string, windowName: string, tdlFileName: string, mode: string) => {
        const windowAgentsManager = this.getMainProcess().getWindowAgentsManager();
        const displayWindowAgent = windowAgentsManager.getAgent(displayWindowId);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            // ignore the preloaded display window's new TDL, and ignore the iframe embedded display
            if (displayWindowAgent !== windowAgentsManager.preloadedDisplayWindowAgent && displayWindowAgent.getBrowserWindow() !== undefined) {
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
                displayWindowAgent.sendFromMainProcess("local-font-names", this.getMainProcess().getMainProcesses().getLocalFontNames());
            }
        }

    };

    handleZoomWindow = (event: any, displayWindowId: string, zoomDirection: "in" | "out") => {
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

    /**
     * script is full path or empty string
     */
    handleWindowAttachedScript = (event: any, data: { displayWindowId: string; action: "run" | "terminate"; script: string }) => {
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(data["displayWindowId"]);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            // editing
            if (data["action"] === "terminate") {
                Log.debug(this.getMainProcessId(), "Terminate script", data["script"], "for window", data["displayWindowId"]);
                displayWindowAgent.terminateWebSocketClientThread();
            } else if (data["action"] === "run") {
                // operating
                Log.debug(this.getMainProcessId(), "Run script", data["script"], "for window", data["displayWindowId"]);
                const port = this.getMainProcess().getWsPvServer().getPort();
                displayWindowAgent.createWebSocketClientThread(port, data["script"]);
            } else {
                Log.error(this.getMainProcessId(), "window-attached-script event error: action must be either run or terminate");
            }
        } else {
            Log.error(this.getMainProcessId(), "Cannot set mode for a non-display-window");
        }
    };

    handleMainWindowShowContextMenu = (event: any, menu: ("copy" | "cut" | "paste")[]) => {
        const mainWidowAgent = this.getMainProcess().getWindowAgentsManager().getMainWindowAgent();
        if (mainWidowAgent !== undefined) {
            mainWidowAgent.showContextMenu(menu);
        }
    }

    handleDuplicateDisplay = (
        event: any,
        options: {
            tdl: type_tdl;
            mode: "operating" | "editing";
            externalMacros: [string, string][];
        },
        httpResponse: any = undefined
    ) => {
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
    handleTcaGet = async (
        event: any,
        channelName: string,
        displayWindowId: string,
        widgetKey: string | undefined,
        ioId: number,
        ioTimeout: number,
        dbrType: Channel_DBR_TYPES | undefined,
        useInterval: boolean
    ) => {
        // (1)
        const windowAgentsManager = this.getMainProcess().getWindowAgentsManager();
        const displayWindowAgent = windowAgentsManager.getAgent(displayWindowId) as DisplayWindowAgent;
        if (displayWindowAgent === undefined) {
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
        displayWindowAgent.sendFromMainProcess("tca-get-result", ioId, widgetKey, data);
    };

    /**
     * Get the meta data, it is assumed
     */
    handleTcaGetMeta = async (event: any, channelName: string, displayWindowId: string, widgetKey: string | undefined, ioId: number) => {
        // (1)
        const windowAgentsManager = this.getMainProcess().getWindowAgentsManager();
        const displayWindowAgent = windowAgentsManager.getAgent(displayWindowId) as DisplayWindowAgent;
        if (displayWindowAgent === undefined) {
            return;
        }

        let data = await displayWindowAgent.tcaGetMeta(channelName);
        // ! attention
        // send twice: use periodic and the "tca-get-result" to ensure all the widgets in newly created window are updated
        // in the first place. Otherwise the race condition may happen, the widget key is removed from the forceUpdateWidgets list
        // after the widget is first rendered, causing this widget cannot update. If there is new dbrData pending for this
        // widget, this widget has a second chance to refresh.
        displayWindowAgent.addNewChannelData(channelName, data);
        // (2)
        // ioId and widgetKey are bounced back
        Log.debug(this.getMainProcessId(), "tca-get-meta result for", channelName, "is", data);
        if (channelName.startsWith("pva://")) {
            displayWindowAgent.sendFromMainProcess("tca-get-pva-type-result", channelName, widgetKey, data);
        } else {
            displayWindowAgent.sendFromMainProcess("tca-get-result", ioId, widgetKey, data);
        }
    };

    handleTcaMonitor = (event: any, displayWindowId: string, channelName: string) => {
        const windowAgentsManager = this.getMainProcess().getWindowAgentsManager();
        const displayWindowAgent = windowAgentsManager.getAgent(displayWindowId) as DisplayWindowAgent;
        // if channel does not exist, create it
        displayWindowAgent.tcaMonitor(channelName);
    };

    handleTcaDestroy = (event: any, displayWindowId: string, channelName: string) => {
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
    handleTcaPut = async (
        event: any,
        channelName: string,
        displayWindowId: string,
        dbrData: type_dbrData | type_LocalChannel_data,
        ioTimeout: number, // second
        pvaValueField: string,
    ) => {

        const mainProcess = this.getMainProcess();
        const windowAgentsManager = mainProcess.getWindowAgentsManager();
        const channelAgentsManager = mainProcess.getChannelAgentsManager();

        const windowAgent = windowAgentsManager.getAgent(displayWindowId) as DisplayWindowAgent;
        if (windowAgent === undefined) {
            const errMsg = `Cannot find window with ID ${displayWindowId}`;
            throw new Error(errMsg);
        }
        const success = windowAgent.tcaPut(channelName, dbrData, ioTimeout, pvaValueField);

        // let channelAgent = channelAgentsManager.getChannelAgent(channelName);
        // if (!(channelAgent instanceof CaChannelAgent)) {
        //     return;
        // }
        // if (channelAgent === undefined) {
        //     channelAgent = channelAgentsManager.createChannelAgent(channelName);
        // }
        // if (!(channelAgent instanceof CaChannelAgent)) {
        //     return;
        // }
        // channelAgent.put(displayWindowId, dbrData, ioTimeout);
    };

    // ------------------------------------------------------------

    createUtilityDisplayWindow = (
        event: any,
        utilityType: "Probe" | "PvTable" | "DataViewer" | "ProfilesViewer" | "LogViewer" | "TdlViewer" | "TextEditor" | "Terminal" | "Calculator" | "ChannelGraph" | "CaSnooper" | "Casw" | "Help" | "PvMonitor" | "FileConverter",
        utilityOptions: Record<string, any>,
        httpResponse: any = undefined
    ) => {
        const windowAgentsManager = this.getMainProcess().getWindowAgentsManager();
        if (utilityType === "ProfilesViewer") {
            utilityOptions = {};
            utilityOptions["profiles"] = this.getMainProcess().getProfiles().serialize();
            utilityOptions["profilesFileName"] = this.getMainProcess().getMainProcesses().getProfilesFileName();
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
                            Log.error(this.getMainProcessId(), "Cannot read script file", scriptFullFileName, e);
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
            utilityOptions["profilesFileName"] = this.getMainProcess().getMainProcesses().getProfilesFileName();
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
            utilityOptions["profilesFileName"] = this.getMainProcess().getMainProcesses().getProfilesFileName();
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
        }


        windowAgentsManager.createUtilityDisplayWindow(utilityType, utilityOptions, httpResponse);
    };

    // ----------------------- context menu -----------------

    handleShowContextMenu = (event: any, mode: string, displayWindowId: string, widgetKeys: string[], options: Record<string, any> = {}) => {
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(displayWindowId);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            displayWindowAgent.showContextMenu(mode, widgetKeys, options);
        }
    };


    handleShowContextMenuSidebar = (event: any, mode: string, displayWindowId: string, widgetKeys: string[], options: Record<string, any> = {}) => {
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(displayWindowId);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            displayWindowAgent.showContextMenuSidebar(mode, widgetKeys, options);
        }
    };

    // ---------------------- general file --------------------------
    handleSelectAFile = (event: any, options: Record<string, any>, fileName1: string = "") => {

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
                    ? [{ name: "tdl", extensions: ["tdl", "edl", "bob", "db", "template"] }]
                    : options["filterType"] === "media"
                        ? [{ name: "media", extensions: ["jpg", "jpeg", "png", "gif", "svg", "bmp", "pdf", "mp4", "ogg", "webm", "mp3", "mov"] }]
                        : options["filterType"] === "script"
                            ? [{ name: "script", extensions: ["py", "js"] }]
                            : [{ name: "picture", extensions: ["jpg", "jpeg", "png", "gif", "svg", "bmp"] }];
                // default to open file
                const properties = options["properties"] === undefined ? ["openFile"] : options["properties"];
                fileNames = dialog.showOpenDialogSync({
                    title: "Select a file",
                    filters: fileFilters,
                    properties: properties,
                });
            } else if (this.getMainProcess().getMainProcessMode() === "ssh-server" || this.getMainProcess().getMainProcessMode() === "web") {
                displayWindowAgent.sendFromMainProcess("dialog-show-input-box", {
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
                })
                return;
            }
        }
        if (fileNames !== undefined) {
            const fileName = fileNames[0];
            if (fileName !== undefined) {
                // bounce back options
                displayWindowAgent.sendFromMainProcess("select-a-file", options, fileName);
            }
        }
    };

    // -------------------- embedded display events ----------------------

    /**
     * (1) create display window agent
     */
    handleObtainIframeUuid = (
        event: any,
        options: {
            displayWindowId: string;
            widgetKey: string;
            mode: "editing" | "operating";
            tdlFileName: string;
            macros: [string, string][];
            currentTdlFolder: string;
            replaceMacros: boolean;
        }
    ) => {

        const selectedProfile = this.getMainProcess().getProfiles().getSelectedProfile();
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
    };

    handleSwitchIframeDisplayTab = (
        event: any,
        options: {
            displayWindowId: string;
            widgetKey: string;
            mode: "editing" | "operating";
            tdlFileName: string;
            macros: [string, string][];
            currentTdlFolder: string;
            // old iframe display id
            iframeDisplayId: string;
        }
    ) => {
        Log.debug(this.getMainProcessId(), "try to obtain iframe uuid");
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

    handleCloseIframeDisplay = (
        event: any,
        options: {
            displayWindowId: string;
        }
    ) => {
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(options["displayWindowId"]);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            displayWindowAgent.handleWindowClosed();
        }
    };

    // ------------------------- actions ------------------------

    handleOpenWebpage = (event: any, url: string) => {
        const windowAgentsManager = this.getMainProcess().getWindowAgentsManager();
        windowAgentsManager.createWebDisplayWindow(url);
    };

    handleExecuteCommand = (event: any, data: {
        displayWindowId: string,
        command: string,
    }) => {
        try {
            const command = data["command"];
            const commandArray = command.split(" ");
            if (commandArray.length >= 1) {
                const commandHead = commandArray[0];
                commandArray.shift();
                // spawn a new process from main process
                const childProcess = spawn(commandHead, commandArray);

                childProcess.stdout.on("data", (data) => {
                    Log.info(this.getMainProcessId(), `stdout: ${data}`);
                });

                childProcess.stderr.on("data", (data) => {
                    Log.info(this.getMainProcessId(), `stderr: ${data}`);
                });

                childProcess.on("close", (code) => {
                    Log.info(this.getMainProcessId(), `child process exited with code ${code}`);
                });

                childProcess.on("error", (err) => {
                    // a failed spawn is not catched, but in the error event
                    const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(data["displayWindowId"]);
                    if (displayWindowAgent instanceof DisplayWindowAgent) {
                        displayWindowAgent.sendFromMainProcess("dialog-show-message-box", {
                            // command?: string | undefined,
                            messageType: "error", // | "warning" | "info", // symbol
                            humanReadableMessages: [`Failed to execute command "${data["command"]}"`], // each string has a new line
                            rawMessages: [`${err}`], // computer generated messages
                            // buttons?: type_DialogMessageBoxButton[] | undefined,
                            // attachment?: any,
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
                    // command?: string | undefined,
                    messageType: "error", // | "warning" | "info", // symbol
                    humanReadableMessages: [`Failed to execute command "${data["command"]}"`], // each string has a new line
                    rawMessages: [`${e}`], // computer generated messages
                    // buttons?: type_DialogMessageBoxButton[] | undefined,
                    // attachment?: any,
                })
            }
        }
    }


    // --------------------- dataviewer ---------------------------
    handleDataViewerExportData = (
        event: any,
        displayWindowId: string,
        data: Record<
            string,
            {
                Time: string[];
                Data: number[];
            }
        >,
        fileName1: string = "",
    ) => {
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
                        );
                        return;
                    }
                }
                try {
                    fs.writeFileSync(fileName, JSON.stringify(data));
                    Log.debug(this.getMainProcessId(), "Successfully saved DataViewer data to", fileName);
                } catch (e) {
                    Log.error(this.getMainProcessId(), `Cannot save DataViewer data to file ${fileName}`);
                    displayWindowAgent.sendFromMainProcess("dialog-show-message-box", {
                        // command?: string | undefined,
                        messageType: "error", // | "warning" | "info", // symbol
                        humanReadableMessages: [`Cannot save DataViewer data to file ${fileName}`], // each string has a new line
                        rawMessages: [`${e}`], // computer generated messages
                        // buttons?: type_DialogMessageBoxButton[] | undefined,
                        // attachment?: any,
                    })
                }
            }
        }
    };

    handleProcessesInfo = async (event: any, data: {
        displayWindowId: string,
        widgetKey: string,
        withThumbnail: boolean
    }) => {
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

    handleEpicsStats = async (event: any, data: {
        displayWindowId: string,
        widgetKey: string,
    }) => {

        const channelAgentsManager = this.getMainProcess().getChannelAgentsManager();
        const epicsContext = channelAgentsManager.getContext();
        if (epicsContext !== undefined) {
            const epicsStats: {
                udp: type_network_stats,
                tcp: Record<string, type_network_stats>
            } = epicsContext.getNetworkStats();

            const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(data["displayWindowId"]);
            if (displayWindowAgent instanceof DisplayWindowAgent) {
                displayWindowAgent.sendFromMainProcess("epics-stats", {
                    widgetKey: data["widgetKey"],
                    epicsStats: epicsStats,
                });
            }

        }

    }

    handleCaSnooperCommand = (event: any, options: {
        command: "start" | "stop";
        displayWindowId: string;
        widgetKey: string;
    }) => {
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

    handleCaswCommand = (event: any, options: {
        command: "start" | "stop";
        displayWindowId: string;
        widgetKey: string;
    }) => {
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

    // --------------------- ssh login ----------------------
    handleSshPasswordPromptResult = (event: any, result: {
        password: string,
        sshMainProcessId: string,
    }) => {
        Log.info(this.getMainProcessId(), result)
        const sshMainProcess = this.getMainProcess().getMainProcesses().getProcess(result["sshMainProcessId"]);
        if (sshMainProcess instanceof MainProcess) {
            sshMainProcess.getSshClient()?._passwordPromptResolve({
                password: result["password"],
            });
        } else {
            Log.error(this.getMainProcessId(), "Cannot find main process", result["sshMainProcessId"]);
        }
    }

    handleCancelSshConnection = (event: any, data: {
        sshMainProcessId: string,
    }) => {
        const sshMainProcess = this.getMainProcess().getMainProcesses().getProcess(data["sshMainProcessId"]);
        if (sshMainProcess instanceof MainProcess) {
            // simply quit
            sshMainProcess.quit();
        } else {
            Log.error(this.getMainProcessId(), "Cannot find main process", data["sshMainProcessId"]);
        }

    }

    handleTerminalCommand = (event: any, data: {
        displayWindowId: string,
        // bounce back
        widgetKey: string,
        ioId: number,
        // command 
        command: "os.homedir" | "os.userInfo" | "fs.readdir" | "fs.stat" | "fs.isDirectory",
        args: any[],
    }) => {
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

    handleTakeScreenShot = (event: any, options: {
        displayWindowId: string,
        destination: "file" | "clipboard" | "folder",
    }) => {
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

    handlePrintDisplayWindow = (event: any, options: {
        displayWindowId: string,
    }) => {
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(options["displayWindowId"]);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            displayWindowAgent.print();
        }
    }

    handleRequestArchiveData = async (event: any, options: {
        displayWindowId: string,
        widgetKey: string,
        channelName: string,
        startTime: string, // "2024-01-01 01:23:45", no ms
        endTime: string,
    }) => {
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(options["displayWindowId"]);
        if (displayWindowAgent === undefined) {
            return;
        }
        let result = undefined;
        const sql = this.getMainProcess().getSql();
        if (sql !== undefined) {
            if (sql.getState() === SqlState.CONNECTED) {
                result = await sql.getChannelData(options["channelName"], options["startTime"], options["endTime"]);
            }
        }
        if (result !== undefined) {
            // do not process data in main process, the resouce is more precious in the main process
            displayWindowAgent.sendFromMainProcess("new-archive-data", {
                ...options,
                archiveData: result,
            });
        } else {
            Log.error(this.getMainProcessId(), "Cannot obtain archive data for", options["channelName"], "from", options["startTime"], "to", options["endTime"]);
        }
    }

    /**
     * Open a text file from an existing TextEditor window
     * 
     * This event is only initiated from TextEditor window
     * 
     * It is for opening a new TextEditor window, which is done in create-utility-display-window event
     */
    handleOpenTextFileInTextEditor = async (event: any, options: {
        displayWindowId: string,
        widgetKey: string,
        fileName: string, // when "", do not open anything, when not "", open whatever we have
        manualOpen: boolean, // use dialog to open, valid only when fileName is empty (""), if true, open the dialog to choose file, if false, open whatever we have
        openNewWindow: boolean, // open in new TextEditor window, without using the dialog
        largeFileConfirmOpen?: "Yes" | "No", // if the file is large, confirm to open it
    }) => {
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
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            // open a new window, fall back to `createUtilityDisplayWindow()`
            // do this before tthe "fileName" and manualOpen""
            if (openNewWindow) {
                this.createUtilityDisplayWindow(undefined, "TextEditor", {
                    fileName: fileName
                })
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
                                command: "open-text-file-large-confirm",
                                messageType: "warning",
                                humanReadableMessages: [`This file is large (` + `${Math.round(fileSize / 1024 / 1024)}` + ` MB). You will not be able to edit it. And it may be slow to open. Do you still want to open it?`],
                                rawMessages: [],
                                buttons: [{ text: "Yes" }, { text: "No" }],
                                attachment: { ...options, fileName: fileName },
                            });
                            return;
                        }
                    }
                } else if (fileSize >= 10 * 1024 * 1024) {
                    const browserWindow = displayWindowAgent.getBrowserWindow();
                    if (browserWindow !== undefined) {
                        displayWindowAgent.sendFromMainProcess('dialog-show-message-box', {
                            messageType: "error",
                            humanReadableMessages: [`This file is too large (` + `${Math.round(fileSize / 1024 / 1024)}` + ` MB) to open. Please select a smaller file.`],
                            rawMessages: [],
                            buttons: [{ text: "OK" }],
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
                    messageType: "error",
                    humanReadableMessages: [`Error opening file ${fileName}`],
                    rawMessages: [`${e}`],
                })
            }
        }
    }

    /**
     * @returns {boolean} true upon successfully saved, false upon failed
     */

    handleSaveTextFile = (event: any, data: {
        displayWindowId: string,
        widgetKey: string,
        fileName: string, // if "", it is "save as"
        fileContents: string,
    }): boolean => {
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
                    messageType: "error",
                    humanReadableMessages: [`Error saving file ${fileName}`],
                    rawMessages: [`${e}`],
                })
                Log.error(this.getMainProcessId(), e);
                return false;
            }
        }
        return false;
    }

    handleRegisterLogViewer = (event: any) => {
        // logs.registerLogViewer(info);
    }
    handleUnregisterLogViewer = (event: any) => {
        // logs.unregisterLogViewer(info);
    }

    handleFileConverterCommand = (event: any, options:
        {
            command: "start",
            src: string,
            dest: string,
            depth: number,
            displayWindowId: string,
            widgetKey: string,
        } |
        {
            command: "stop",
        }
    ) => {

        if (options["command"] === "start") {
            const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(options["displayWindowId"]);
            if (!(displayWindowAgent instanceof DisplayWindowAgent)) {
                return;
            }

            if (!fs.existsSync(options["src"])) {
                displayWindowAgent.sendFromMainProcess("dialog-show-message-box", {
                    messageType: "error",
                    humanReadableMessages: [`Source folder/file does not exist.`],
                    rawMessages: [],
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
                    messageType: "error",
                    humanReadableMessages: [`Destination folder/file does not exist.`],
                    rawMessages: [],
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
                    messageType: "error",
                    humanReadableMessages: [`File search depath wrong: should be between 1 and 50 (both inclusive).`],
                    rawMessages: [],
                }
                );
                displayWindowAgent.sendFromMainProcess("file-converter-command", {
                    type: "all-file-conversion-finished",
                    status: "failed",
                    widgetKey: options["widgetKey"],
                });
                return;
            }
            this.getMainProcess().startEdlFileConverterThread(options);
        } else if (options["command"] === "stop") {
            this.getMainProcess().stopEdlFileConverterThread();
        }
    }
}
