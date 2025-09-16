import { MainWindowAgent } from "./MainWindow/MainWindowAgent";
import { DisplayWindowAgent } from "./DisplayWindow/DisplayWindowAgent";
import { dialog, app, BrowserWindow, Menu, MenuItem } from "electron";
import { MainProcess } from "../mainProcess/MainProcess";
import { v4 as uuid } from "uuid";
import { UtilityWindow } from "./UtilityWindow/UtilityWindow";
import { type_tdl } from "../file/FileReader";
import { FileReader } from "../file/FileReader";
import { Log } from "../log/Log";
import { spawn } from "child_process";
import path from "path";

export type type_options_createDisplayWindow = {
    tdl: type_tdl;
    mode: "editing" | "operating";
    editable: boolean;
    tdlFileName: string;
    macros: [string, string][];
    replaceMacros: boolean;
    hide: boolean;
    utilityType?: string;
    utilityOptions?: Record<string, any>;
    // postCommand?: string;
    isPreviewDisplayWindow?: boolean;
    windowId?: string;
};

export class WindowAgentsManager {
    private _agents: Record<string, MainWindowAgent | DisplayWindowAgent> = {};
    private _mainProcess: MainProcess;

    /**
     * The pre-loaded display window. It is hidden. When it is available, its type is DisplayWindowAgent;
     * when it is not available, the type is undefined. <br>
     *
     * this.replacePreloadedDisplayWindow() replaces (update/re-read/read) the tdl for this window if
     * the preloadedDisplayWindowAgent is available. If not, it will create a new window.
     */
    preloadedDisplayWindowAgent: DisplayWindowAgent | undefined = undefined;
    previewDisplayWindowAgent: DisplayWindowAgent | undefined = undefined;
    // preloadedEmbeddedDisplayAgent: DisplayWindowAgent | undefined = undefined;
    creatingPreloadedDisplayWindow: boolean = false;
    creatingPreviewDisplayWindow: boolean = false;
    /**
     * Embedded display
     */
    creatingEmbeddedDisplayMask: string[] = [];
    creatingEmbeddedDisplayBackdrop: string[] = [];
    // private _mainProcessId: string;

    constructor(mainProcess: MainProcess) {
        this._mainProcess = mainProcess;
        // this._mainProcessId = mainProcess.getProcessId();
        // this.createPreviewDisplayWindow();
    }

    // ------------------- tmp, will be formal ----------------------------------

    // -------------------- profile ---------------------------

    // ------------------ channel -------------------------

    // -------------------- display window agent --------------------------------

    // a display window can be opened/created in following ways:
    // (1) when we start the tdm, open the default tdl files, in operating mode, non-editable
    //     createDefaultDisplayWindows() is automatically invoked in handleProfileSelected()
    // (2) open a tdl file in an existing display window, the new window is in operating mode, and it inherites the editable from its parent window
    //     it is realized by handleOpenTdlFiles()
    // (3) create a blank window, editable, and in editing mode
    //     it is realized by handleOpenTdlFiles()
    // (4) manually a tdl file, editable, in operating mode
    //     it is realized by handleOpenTdlFiles()

    generateDisplayWindowId = (): string => {
        // epoch time (ms) + uuid
        return `${Date.now().toString()}-${uuid()}`;
    };

    createDisplayWindowAgent = (options: type_options_createDisplayWindow, displayWindowId: string): DisplayWindowAgent => {
        const displayWindowAgent = new DisplayWindowAgent(this, options, displayWindowId);

        const ids = Object.keys(this._agents);
        // const newId = this.generateDisplayWindowId();
        const newId = displayWindowAgent.getId();
        if (!ids.includes(newId)) {
            // to avoid duplicated window, catched in MainProcess.openDisplayWindow()
            // read tdl, throw upon error
            // this._agents[newId] = new DisplayWindowAgent(this, newId, options);
            this._agents[newId] = displayWindowAgent;
            return this.getAgent(newId) as DisplayWindowAgent;
        } else {
            throw new Error("Cannot create display window agent");
        }
    };

    // -------- below is about createDisplayWindow() -------

    // handleDuplicateDisplayInEditingMode = (event: IpcMainEvent, tdl: type_tdl) => {
    // 	// fileName === "" ensures that when we save the file, it is a "save as"
    // 	this.createDisplayWindow(tdl, "editing", true, "", [], false);
    // };

    getMainProcess = (): MainProcess => {
        return this._mainProcess;
    };

    // ------------------------------------- create display window ----------------------------------

    /**
     * Create a display window. <br>
     *
     * For the input, the TDL file name should be an absolute path. <br>
     *
     * @param {type_tdl} tdl TDL file contents, represented by an object <br>
     *
     * @param {string} tdlFileName Full path of the tdl file. If the TDL file name is a blank string,
     * we may be creating for preloaded display window. <br>
     *
     * @param {[string, string][]} macros The external macros <br>
     *
     * @param {boolean} replaceMacros If the external macros overrides the TDL-defined macros <br>
     *
     * @param {"editing" | "operating"} mode The initial mode for the display window <br>
     *
     * @param {boolean} editable If the display window is editable <br>
     *
     * @param {boolean} hide If the display window would be hidden. Usually the preloaded display window is hidden.
     *
     * @returns {Promise<DisplayWindowAgent | undefined>} If success, return Promise<DisplayWindowAgent> object; if not, return Promise<undefined>.
     *
     * (0) open the TDL in preloaded display window if it exists; if not, do the below steps. <br>
     *
     * (1) create display window agents, read tdl file, throw upon fail <br>
     *
     * (2) create electron.js browser window in "blocking" mode <br>
     *
     * (3) after the display window is created, send this window's uuid and the main process ID to the display window. <br>
     * 
     * (4) send the current profile contents, the renderer process may use it
     *
     * (5) send the tdl, macros, mode, tdl file name, and other info to display window, so that it can displays the TDL <br>
     *
     */
    createDisplayWindow = async (options: type_options_createDisplayWindow): Promise<undefined | DisplayWindowAgent> => {
        let { tdl, mode, editable, tdlFileName, macros, replaceMacros, hide, windowId } = options;

        const mainProcessMode = this.getMainProcess().getMainProcessMode();
        if (mainProcessMode === "ssh-client") {

            // todo: test it
            // check if the window already exist
            const exisitedDisplayWindow = this.checkExistedDisplayWindow(tdlFileName, macros);
            if (exisitedDisplayWindow !== undefined) {
                Log.debug("0", `File ${tdlFileName} is already opened.`);
                // bring up this window if in desktop mode
                // if (this.get) {
                exisitedDisplayWindow.show();
                // }
                return;
            }

            const displayWindowId = this.obtainDisplayWindowId();

            const displayWindowAgent = this.createDisplayWindowAgent(options, displayWindowId);
            // only the browser window is managed by ssh-client, all others are managed by ssh-server
            displayWindowAgent.createBrowserWindow();
            return undefined;
        } else {
            // web, desktop, or ssh-server mode

            // check if the window already exist for desktop mode
            if (mainProcessMode === "desktop") {
                const exisitedDisplayWindow = this.checkExistedDisplayWindow(tdlFileName, macros);
                if (exisitedDisplayWindow !== undefined) {
                    Log.debug("0", `File ${tdlFileName} is already opened.`);
                    // bring up this window if in desktop mode
                    exisitedDisplayWindow.show();
                    return undefined;
                }
            }
            Log.debug(
                "0",
                `Try to create a new display window for ${tdlFileName === "" ? "<blank string>" : tdlFileName} in  mode`
            );
            // (0)
            // preloaded window only for desktop mode, always create a new display if modal === true
            if ((mainProcessMode !== "web" && options["isPreviewDisplayWindow"] !== true) && !(options["utilityOptions"] !== undefined && options["utilityOptions"]["modal"] === true)) {
                // ssh-server does not have preloaded display window
                if (mainProcessMode !== "ssh-server") {
                    let displayWindowAgent = this.replacePreloadedDisplayWindow(options);
                    if (displayWindowAgent !== undefined) {
                        Log.debug("0", `Preloaded display window is consumed, created a new one.`);
                        this.createPreloadedDisplayWindow();
                        return displayWindowAgent;
                    } else {
                        if (this.creatingPreloadedDisplayWindow === true) {
                            Log.debug("0", `Preloaded display window does not exist, but it is being created.`);
                        } else {
                            Log.debug("0", `Preloaded display window does not exist, create one in background.`);
                            this.createPreloadedDisplayWindow();
                        }
                    }
                }
            }

            try {
                // (1)
                const displayWindowId = this.obtainDisplayWindowId();
                const displayWindowAgent = await this.createDisplayWindowAgent(options, displayWindowId);
                // (2)
                await displayWindowAgent.createBrowserWindow(options);
                return displayWindowAgent;
            } catch (e) {
                Log.error("0", e);
                return undefined;
            }
        }
    };


    checkExistedDisplayWindow = (tdlFileName: string, macros: [string, string][]): DisplayWindowAgent | undefined => {
        const hash = DisplayWindowAgent.calcHash(tdlFileName, macros);
        for (let displayWindowAgent of Object.values(this.getAgents())) {
            if (displayWindowAgent instanceof DisplayWindowAgent) {
                if (hash === displayWindowAgent.getHash()) {
                    return displayWindowAgent;
                }
            }
        }
        return undefined;
    }

    createIframeDisplay = async (options: type_options_createDisplayWindow, widgetKey: string, parentDisplayWindowId: string) => {

        let { tdl, mode, editable, tdlFileName, macros, replaceMacros, hide } = options;

        if (this.getMainProcess().getMainProcessMode() === "ssh-client") {
            // a simple place holder for context menu and lifecycle management
            // there is no BrowserWindow in iframe display, it is an iframe in web browser
            const displayWindowId = this.obtainDisplayWindowId();
            const displayWindowAgent = await this.createDisplayWindowAgent(options, displayWindowId);
            return undefined;
        } else {


            // Log.debug("0", `Try to create a new display window for ${tdlFileName === "" ? "<blank string>" : tdlFileName}`);
            // // (0)
            // let displayWindowAgent = this.replacePreloadedDisplayWindow(options);
            // if (displayWindowAgent !== undefined) {
            // 	Log.debug("0", `Preloaded display window is consumed, created a new one.`);
            // 	this.createPreloadedDisplayWindow();
            // 	return displayWindowAgent;
            // } else {
            // 	if (this.creatingPreloadedDisplayWindow === true) {
            // 		Log.debug("0", `Preloaded display window does not exist, but it is being created.`);
            // 	} else {
            // 		Log.debug("0", `Preloaded display window does not exist, create one in background.`);
            // 		this.createPreloadedDisplayWindow();
            // 	}
            // }
            try {
                // (1)
                const displayWindowId = this.obtainDisplayWindowId();

                const displayWindowAgent = await this.createDisplayWindowAgent(options, displayWindowId);
                // (2) do it on client side
                //! await displayWindowAgent.createBrowserWindow();
                // (3)
                // GUI is created
                // the uuid and process ID on client side are obtained from the html file name, e.g. "DisplayWindow-1-22.html"

                // block lifted when the websocket connection is established
                const parentDisplayWindowAgent = this.getAgent(parentDisplayWindowId);
                if (parentDisplayWindowAgent instanceof DisplayWindowAgent) {
                    const backgroundColor = tdl["Canvas"]["style"]["backgroundColor"];
                    if (typeof backgroundColor === "string") {
                        parentDisplayWindowAgent.sendFromMainProcess("obtained-iframe-uuid", {
                            widgetKey: widgetKey,
                            iframeDisplayId: displayWindowId,
                            tdlBackgroundColor: backgroundColor,
                        });
                    }
                }
                const mainProcessMode = this.getMainProcess().getMainProcessMode()

                if (mainProcessMode === "ssh-server") {
                    // tell client to create a GUI window
                    const sshServer = this.getMainProcess().getIpcManager().getSshServer();
                    if (sshServer !== undefined) {
                        sshServer.sendToTcpClient(JSON.stringify({
                            command: "create-iframe-display-step-2", data: {
                                options: options,
                                widgetKey: widgetKey,
                                parentDisplayWindowId: parentDisplayWindowId,
                            }
                        }))
                    }
                }
                Log.info("0", "we have obtained ifram uuid", displayWindowId);
                await displayWindowAgent.creationPromise;
                Log.debug("0", "lifted", displayWindowAgent.getId());

                // (4)
                const selectedProfile = this.getMainProcess().getProfiles().getSelectedProfile();
                if (selectedProfile === undefined) {
                    Log.error("0", "Profile not selected!");
                    return undefined;
                }
                displayWindowAgent.sendFromMainProcess("selected-profile-contents",
                    { contents: selectedProfile.getContents() }
                );


                // (5)
                displayWindowAgent.sendFromMainProcess("new-tdl", {
                    newTdl: tdl,
                    tdlFileName: tdlFileName,
                    initialModeStr: mode,
                    editable: editable,
                    externalMacros: macros,
                    useExternalMacros: replaceMacros,
                    utilityType: options["utilityType"] as any,
                    utilityOptions: options["utilityOptions"] === undefined ? {} : options["utilityOptions"],
                });

                Log.debug(
                    "0",
                    `Created display window ${displayWindowAgent.getId()} for ${tdlFileName === "" ? "<blank string>" : tdlFileName}`
                );
                return displayWindowAgent;
            } catch (e) {
                Log.error("0", e);
                return undefined;
            }
        }
    };

    /**
     * Create one or more display windows based on file names.
     * 
     * Note: in web mode, this method only works if the 
     * 
     * @param {string[]} tdlFileNames The tdl file names. They can be .tdl, .edl, .bob, .db, or .template files. Must be non-empty string array.
     * 
     * @param {"operating" | "editing"} mode The initial mode for the display windows.
     * 
     * @param {boolean} editable If the display windows are editable.
     * 
     * @param {[string, string][]} macros The macros provided for the display windows from outside.
     * 
     * @param {string | undefined} currentTdlFolder The current tdl folder. It is used to resolve relative path of the tdl files.
     * 
     */
    createDisplayWindows = async (tdlFileNames: string[], mode: "operating" | "editing", editable: boolean, macros: [string, string][], currentTdlFolder: string | undefined, windowId: string | undefined) => {
        if (tdlFileNames.length === 0) {
            return;
        }

        const profiles = this.getMainProcess().getProfiles();
        const selectedProfile = profiles.getSelectedProfile();
        const ipcManager = this.getMainProcess().getIpcManager();
        const mainProcessMode = this.getMainProcess().getMainProcessMode();

        for (let tdlFileName of tdlFileNames) {

            if (path.extname(tdlFileName) === ".tdl" || path.extname(tdlFileName) === ".bob" || path.extname(tdlFileName) === ".edl" || path.extname(tdlFileName) === ".stp") {
                // regular display window, .tdl, .edl, or .bob

                const tdlResult = await FileReader.readTdlFile(tdlFileName, selectedProfile, currentTdlFolder)
                if (tdlResult !== undefined) {
                    const tdl = tdlResult["tdl"];
                    const fullTdlFileName = tdlResult["fullTdlFileName"];
                    const options: type_options_createDisplayWindow = {
                        tdl: tdl,
                        mode: mode,
                        editable: editable,
                        tdlFileName: fullTdlFileName,
                        macros: macros,
                        replaceMacros: false,
                        hide: false,
                        windowId: windowId,
                    };
                    await this.createDisplayWindow(options);
                } else {
                    Log.error("0", `Cannot read file ${tdlFileName}`);
                }

            } else if (path.extname(tdlFileName) === ".db" || path.extname(tdlFileName) === ".template") {
                // utility window
                if (windowId === undefined) {
                    // utility window must have a initiate window
                    return;
                }
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
                ipcManager.createUtilityDisplayWindow(undefined, {
                    utilityType: "PvTable",
                    utilityOptions: { channelNames: channelNames },
                    windowId: windowId,
                });
            }
        }

    }

    /**
     * Replace the preloaded display window. If the preloaded display window doest not exist, return undefined. <br>
     *
     * The preloaded display window is a display window is a hidden window
     * (realized by the "hide" bit in options) and opened with a blank TDL. <br>
     *
     * After the preloaded display window is replaced, the tdl is updated, and this window should be shown.
     * This is realized after the new tdl is first time rendered. <br>
     *
     * When the reploaded display window is replaced, the TDL is updated, together with
     * other option parameters, i.e. mode, tdlFileName, macros, and others. <br>
     *
     * (1) undefine this.preloadedDisplayWindowAgent so that only one TDL is reloaded for the preloaded display window <br>
     *
     * (2) create a new preloaded window asynchronously, the creation process won't block <br>
     *
     * (3) update meta data in display window agent, i.e. tdl file name <br>
     *
     * (4) update TDL of the display window. No need to send profile, we already sent when the preloaded window was created <br>
     * 
     */
    private replacePreloadedDisplayWindow = (options: type_options_createDisplayWindow): DisplayWindowAgent | undefined => {
        // return undefined if we do not want to replace the preloaded display window
        // useful for debug
        // return undefined;

        let { mode, editable, tdl, tdlFileName, macros, replaceMacros } = options;
        Log.debug("0", `Trying to replace preloaded display window with ${tdlFileName}.`);
        // (1)
        let displayWindowAgent = this.preloadedDisplayWindowAgent;
        if (displayWindowAgent === undefined) {
            return undefined;
        }
        this.preloadedDisplayWindowAgent = undefined;

        // (3)
        displayWindowAgent.setTdlFileName(tdlFileName);
        displayWindowAgent.setMacros(macros);
        // displayWindowAgent.show() // for debug
        // context menu for desktop mode is also updated
        displayWindowAgent.setEditable(editable);
        if (options["utilityType"] !== undefined) {
            displayWindowAgent.setReloadable(false);
        }
        const isUtilityWindow = tdl["Canvas"]["isUtilityWindow"];
        displayWindowAgent.setIsUtilityWindow(isUtilityWindow);
        if (isUtilityWindow === true) {
            displayWindowAgent.setEditable(editable);
        }

        // (4)
        displayWindowAgent.sendFromMainProcess("new-tdl", {
            newTdl: tdl,
            tdlFileName: tdlFileName,
            initialModeStr: mode,
            editable: editable,
            externalMacros: macros,
            useExternalMacros: replaceMacros,
            utilityType: options["utilityType"] as any,
            utilityOptions: options["utilityOptions"] === undefined ? {} : options["utilityOptions"],
        });
        Log.info("0", `Replaced preloaded display window ${displayWindowAgent.getId()} with new TDL: ${options["tdlFileName"]}`);
        return displayWindowAgent;
    };

    /**
     * Crate a hidden preloaded display window opening a blank TDL. <br>
     *
     * @return {DisplayWindowAgent} The display window agent.
     *
     * (0) this.preloadedDisplayWindowAgent must be undefined. During this function, this variable
     * is undefined, which causes this.createDisplayWindow() method using a new display window. <br>
     *
     * (1) generate a blank TDL <br>
     *
     * (2) create a display window with this blank TDL and other default options "synchronously". The TDL file name
     * is "" <br>
     *
     * (3) update this.preloadedDisplayWindowAgent
     */
    private createPreloadedDisplayWindow = async () => {
        // (0)
        if (this.preloadedDisplayWindowAgent !== undefined) {
            return this.preloadedDisplayWindowAgent;
        }
        // guard
        this.creatingPreloadedDisplayWindow = true;
        // (1)
        const tdl = FileReader.getBlankWhiteTdl();
        // (2)
        const options: type_options_createDisplayWindow = {
            tdl: tdl,
            mode: "operating" as "operating" | "editing",
            editable: true,
            tdlFileName: "",
            macros: [],
            replaceMacros: false,
            hide: true,
        };
        const displayWindowAgent = await this.createDisplayWindow(options);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            Log.info("0", `Created preload display window ${displayWindowAgent.getId()}`);
            // (3)
            this.preloadedDisplayWindowAgent = displayWindowAgent;
            this.creatingPreloadedDisplayWindow = false;
            return displayWindowAgent;
        } else {
            Log.error("0", `Failed to create preloaded display window`);
            this.creatingPreloadedDisplayWindow = false;
            return undefined;
        }
    };


    createPreviewDisplayWindow = async () => {
        // (0)
        if (this.previewDisplayWindowAgent !== undefined) {
            return this.previewDisplayWindowAgent;
        }
        // guard
        this.creatingPreviewDisplayWindow = true;
        // (1)
        const tdl = FileReader.getBlankWhiteTdl();
        // (2)
        const options: type_options_createDisplayWindow = {
            tdl: tdl,
            mode: "operating" as "operating" | "editing",
            editable: false,
            tdlFileName: "",
            macros: [],
            replaceMacros: false,
            hide: true,
            isPreviewDisplayWindow: true,
        };
        const displayWindowAgent = await this.createDisplayWindow(options);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            Log.info("0", `Created preview display window ${displayWindowAgent.getId()}`);
            // (3)
            this.previewDisplayWindowAgent = displayWindowAgent;
            this.creatingPreviewDisplayWindow = false;
            return displayWindowAgent;
        } else {
            Log.error("0", `Failed to create preview display window`);
            this.creatingPreviewDisplayWindow = false;
            return undefined;
        }
    };

    /**
     * Create a blank display window.
     * 
     * The window will be in editing mode and editable.
     * 
     * It will inherit the profile's macros. The caller won't be able to provide any macros.
     */
    createBlankDisplayWindow = async (windowId: string) => {
        const mainProcessMode = this.getMainProcess().getMainProcessMode();
        if (mainProcessMode === "desktop" || mainProcessMode === "web" || mainProcessMode === "ssh-server") {
            const tdl: type_tdl = FileReader.getBlankWhiteTdl();
            const selectedProfile = this.getMainProcess().getProfiles().getSelectedProfile();
            const macros = selectedProfile?.getMacros();
            const options: type_options_createDisplayWindow = {
                tdl: tdl,
                mode: "editing" as "operating" | "editing",
                editable: true,
                // empty tdl file name, means it is not saved
                tdlFileName: "",
                macros: macros === undefined ? [] : macros,
                replaceMacros: true,
                hide: false,
                windowId: windowId,
            };
            await this.createDisplayWindow(options);
        } else if (mainProcessMode === "ssh-client") {
            // todo: verify if it is correct
            const windowAgent = this.getAgent(windowId);
            if (windowAgent !== undefined) {
                // const windowId = windowAgent.getId();
                const sshClient = this.getMainProcess().getSshClient();
                if (sshClient !== undefined) {
                    sshClient.routeToRemoteWebsocketIpcServer({
                        windowId: windowId,
                        eventName: "open-tdl-file",
                        data: [{
                            tdlFileNames: [],
                            mode: "editing",
                            editable: true,
                            macros: [],
                            replaceMacros: false,
                            // currentTdlFolder?: string;
                            windowId: windowAgent.getId(),
                        }]
                    })
                }
            }
        }
    };

    // ----------------------- utility display window --------------------

    // almost the same as this.createDisplayWindow()
    // options are from the "create-utility-display-window" event, they are simply bounced back
    createUtilityDisplayWindow = async (
        utilityType: "Probe" | "PvTable" | "DataViewer" | "ProfilesViewer" | "LogViewer" | "TdlViewer" | "TextEditor" | "Terminal" | "Calculator" | "ChannelGraph" | "CaSnooper" | "Casw" | "PvMonitor" | "Help" | "FileConverter" | "Talhk" | "FileBrowser" | "SeqGraph",
        utilityOptions: Record<string, any>,
        windowId: string,
    ) => {
        try {
            if (utilityType === "Probe" || utilityType === "ChannelGraph") {
                // utilityOptions["recordTypesFieldNames"] = this.getMainProcess().getDbdFiles().getAllRecordTypeFieldNames();
                // utilityOptions["recordTypesMenus"] = this.getMainProcess().getDbdFiles().getAllMenusChoices();
                utilityOptions["recordTypes"] = this.getMainProcess().getChannelAgentsManager().getDbdFiles().getRecordTypes();
                utilityOptions["menus"] = this.getMainProcess().getChannelAgentsManager().getDbdFiles().getMenus();
            }

            // normally a utility window is not editable, but the DataViewer's editable means it can 
            // have "Save" in context menu. But still, it does not have "Edit Display" in context menu
            let editable = false;
            if (utilityType === "DataViewer" || utilityType === "Probe" || utilityType === "ChannelGraph" || utilityType === "PvTable" || utilityType === "PvMonitor" || utilityType === "SeqGraph") {
                editable = true;
            }

            // (1)
            const tdl = UtilityWindow.creatUtilityBlankTdl(utilityType) as type_tdl;
            const windowOptions: type_options_createDisplayWindow = {
                tdl: tdl,
                mode: "operating" as "editing" | "operating",
                editable: editable,
                tdlFileName: "",
                macros: [],
                replaceMacros: false,
                hide: false,
                utilityType: utilityType,
                utilityOptions: utilityOptions,
                windowId: windowId,
            };

            const displayWindowAgent = await this.createDisplayWindow(windowOptions);

            if (displayWindowAgent === undefined) {
                Log.error("0", `Cannot create display window for utility ${utilityType}`);
                return;
            }
        } catch (e) {
            Log.error("0", e);
        }
    };

    // ----------------------- web display window -------------------------------

    /**
     * Create a window displaying webpage
     */
    createWebDisplayWindow = async (url: string) => {
        try {
            const tdl: type_tdl = {
                Canvas: {
                    type: "Canvas",
                    widgetKey: "Canvas",
                    style: {},
                    macros: [],
                    windowName: "",
                    script: "",
                    xGridSize: 1,
                    yGridSize: 1,
                    gridColor: "rgba(128,128,128,1)",
                    showGrid: true,
                    isUtilityWindow: false,
                },
            };

            const options: type_options_createDisplayWindow = {
                tdl: tdl,
                mode: "operating" as "editing" | "operating",
                editable: false,
                tdlFileName: "",
                macros: [],
                replaceMacros: false,
                hide: false,
            };
            const displayWindowId = this.obtainDisplayWindowId();

            const displayWindowAgent = await this.createDisplayWindowAgent(options, displayWindowId);
            await displayWindowAgent.createWebBrowserWindow(url);
        } catch (e) {
            Log.error("0", e);
        }
    };

    // ------------------ main window ----------------------

    /**
     * Create main window, including the frontend and backend. Then send the
     * profiles to the GUI window so that it can render according to the profiles. <br>
     */
    createMainWindow = async () => {

        if (this.getMainProcess().getMainProcessMode() === "ssh-client") {
            const mainWindowAgent = this.createMainWindowAgent();
            // create the real browser window
            mainWindowAgent.createBrowserWindow();
            return mainWindowAgent;
        } else {

            const mainWindowAgent = this.createMainWindowAgent();

            await mainWindowAgent.createBrowserWindow();


            // the uuid of the main window is the `${processId}-mainWindow",
            // the process ID is obtained from the html file name, e.g. "MainWindow-1.html"

            //! the websocket ipc server port can only be sent through webcontents
            //! in the TDM web version, the ipc server port is a fixed number
            // const ipcServerPort = this.getMainProcess().getMainProcesses().getIpcManager().getPort();
            // mainWindowAgent.getWebContents()?.send("websocket-ipc-server-port", ipcServerPort);
            return mainWindowAgent;
            // block lifted when we receive "websocket-ipc-connected" message
            // await mainWindowAgent.creationPromise;
            // // writeFileSync("/Users/haohao/tdm.log", `createMainWindow ===================== lifted\n`, {flag: "a"});

            // // ws opener server port
            // const wsOpenerServer = this.getMainProcess().getWsOpenerServer();
            // const wsOpenerPort = wsOpenerServer.getPort();
            // mainWindowAgent.sendFromMainProcess("update-ws-opener-port", { newPort: wsOpenerPort });

            // // read default and OS-defined EPICS environment variables
            // // in main window editing page, we need env default and env os
            // const env = Environment.getTempInstance();
            // let envDefault = env.getEnvDefault();
            // let envOs = env.getEnvOs();

            // if (typeof envDefault !== "object") {
            //     envDefault = {};
            // }
            // if (typeof envOs !== "object") {
            //     envOs = {};
            // }

            // const site = this.getMainProcess().getSite();
            // mainWindowAgent.sendFromMainProcess(
            //     "after-main-window-gui-created",
            //     {
            //         profiles: this.getMainProcess().getProfiles().serialize(),
            //         profilesFileName: this.getMainProcess().getProfiles().getFilePath(),
            //         envDefault: envDefault,
            //         envOs: envOs,
            //         logFileName: this.getMainProcess().getLogFileName(),
            //         site: site,
            //     }
            // );

            // // "Emitted when the application is activated"
            // app.on("activate", async () => {
            //     // On macOS it's common to re-create a window in the app when the
            //     // dock icon is clicked and there are no other windows open.
            //     if (BrowserWindow.getAllWindows().length === 0) {
            //         // must be async
            //         await mainWindowAgent.createBrowserWindow();
            //         // mainWindowAgent.sendFromMainProcess("uuid", processId);
            //         mainWindowAgent.sendFromMainProcess(
            //             "after-main-window-gui-created",
            //             {
            //                 profiles: this.getMainProcess().getProfiles().serialize(),
            //                 profilesFileName: this.getMainProcess().getProfiles().getFilePath(),
            //                 envDefault: envDefault,
            //                 envOs: envOs,
            //                 logFileName: this.getMainProcess().getLogFileName(),
            //                 site,
            //             }
            //         );

            //         // if (cmdLineSelectedProfile !== "") {
            //         // 	mainWindowAgent.sendFromMainProcess("cmd-line-selected-profile", cmdLineSelectedProfile);
            //         // }
            //     }
            // });
            // // at this moment the main window is ready for selecting profile
            // mainWindowAgent.creationResolve2();
        }
    };

    createMainWindowAgent = (): MainWindowAgent => {
        let mainWindowAgent = this.getMainWindowAgent();
        if (mainWindowAgent === undefined) {
            mainWindowAgent = new MainWindowAgent(this);
            // this.getAgents()["mainWindow"] = mainWindowAgent;
            const mainWindowId = mainWindowAgent.getId();
            this.getAgents()[mainWindowId] = mainWindowAgent;
        }
        return mainWindowAgent as MainWindowAgent;
    };

    // ------------------ agents ----------------------

    getAgents = (): Record<string, MainWindowAgent | DisplayWindowAgent> => {
        return this._agents;
    };

    removeAgent = (id: string) => {
        delete this._agents[id];
    };

    getAgent = (id: string): MainWindowAgent | DisplayWindowAgent | undefined => {
        return this._agents[id];
    };

    /**
     * Get main window agent
     *
     * @returns {MainWindowAgent | undefined} If not exist, return undefined.
     */
    getMainWindowAgent = (): MainWindowAgent | undefined => {
        if (this._agents[`${"0"}`] === undefined) {
            return undefined;
        }
        return this._agents[`${"0"}`] as MainWindowAgent;
    };

    // getMainProcessId = () => {
    //     return this._mainProcessId;
    // };

    getModifiedDisplayWindows = () => {
        const result: string[] = [];
        for (let displayWindowAgent of Object.values(this.getAgents())) {
            if (displayWindowAgent instanceof DisplayWindowAgent) {
                if (displayWindowAgent.isModified()) {
                    let tdlFileName = displayWindowAgent.getTdlFileName();
                    if (tdlFileName === "") {
                        tdlFileName = displayWindowAgent.getId();
                    }
                    result.push(tdlFileName);
                }
            }
        }
        return result;
    }

    /**
     * Set dock menu for MacOS
     * 
     * This method is invoked after
     * 
     * (1) new-tdl-rendered event arrives
     * 
     * (2) main window is created, the main window does not emit new-tdl-rendered event
     * 
     * (3) a BrowserWindow is closed
     */
    setDockMenu = () => {
        if (process.platform === "darwin") {
            const menuItems: (Electron.MenuItem | Electron.MenuItemConstructorOptions)[] = [];

            for (let windowAgent of Object.values(this._agents)) {
                if (windowAgent !== this.preloadedDisplayWindowAgent) {
                    let name = ""; // windowAgent.getWindowName().trim();
                    if (name === "" || name === undefined) {
                        name = windowAgent.getTdlFileName();
                    }
                    if (name === "") {
                        name = "File not saved " + "[" + windowAgent.getId() + "]";
                    }
                    menuItems.push(
                        {
                            label: name,
                            click: () => { windowAgent.focus() }
                        }
                    )
                } else {
                }
            }

            menuItems.push({
                type: "separator",
            })

            menuItems.push({
                label: "New TDM",
                click: () => {
                    const appPath = process.execPath;
                    Log.info("Open a new TDM instance from MacOS dock", appPath);
                    if (appPath !== "" && typeof appPath === "string") {
                        spawn(appPath, [], {
                            detached: true,
                            stdio: "ignore"
                        }).unref();
                    }
                }
            })

            app.dock?.setMenu(Menu.buildFromTemplate(menuItems));
        }
    }


    /**
     * Obtain a display window ID, in form of `${mainProcessId}-${index}`, like `1-3`.
     * 
     * Maximum index is 500 for desktop mode, and 100000 for web mode.
     * 
     * The main window always has the window ID `0`
     *
     * @returns {string} The display window ID if we can obtain one. Otherwise, return "".
     */
    obtainDisplayWindowId = (): string => {

        const maxWindowId = this.getMainProcess().getMainProcessMode() === "web" ? 100000 : 500;
        const mainProcessId = "0"; // this.getMainProcess().getProcessId();
        const ids: number[] = [];
        for (const agent of Object.values(this.getAgents())) {
            if (agent instanceof DisplayWindowAgent) {
                const displayWindowId = agent.getId();
                const displayWindowIdNum = parseInt(displayWindowId.split("-")[1]);
                if (!isNaN(displayWindowIdNum)) {
                    ids.push(displayWindowIdNum);
                }
            }
        }
        ids.sort((a, b) => a - b);


        for (let ii = 0; ii < maxWindowId; ii++) {
            if (!ids.includes(ii)) {
                return `${mainProcessId}-${ii}`;
            }
        }
        Log.error(
            mainProcessId,
            `You have used up indices in DisplayWindow-index.html. There are 500 of them, are you opening 500 display windows?`
        );
        return "";
    };

}
