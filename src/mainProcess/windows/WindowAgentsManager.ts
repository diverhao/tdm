import { MainWindowAgent } from "./MainWindow/MainWindowAgent";
import { DisplayWindowAgent } from "./DisplayWindow/DisplayWindowAgent";
import { dialog, app, BrowserWindow, BrowserView } from "electron";
import { MainProcess } from "../mainProcess/MainProcess";
import { v4 as uuid } from "uuid";
import { UtilityWindow } from "./UtilityWindow/UtilityWindow";
import { type_tdl } from "../file/FileReader";
import { FileReader } from "../file/FileReader";
import { logs } from "../global/GlobalVariables";
import { write, writeFileSync } from "fs";

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
    preloadedEmbeddedDisplayAgent: DisplayWindowAgent | undefined = undefined;
    creatingPreloadedDisplayWindow: boolean = false;
    /**
     * Embedded display
     */
    creatingEmbeddedDisplayMask: string[] = [];
    creatingEmbeddedDisplayBackdrop: string[] = [];
    private _mainProcessId: string;

    constructor(mainProcess: MainProcess) {
        this._mainProcess = mainProcess;
        this._mainProcessId = mainProcess.getProcessId();
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
     * (4) send the tdl, macros, mode, tdl file name, and other info to display window, so that it can displays the TDL <br>
     *
     * (5) send preset colors to display window
     */
    createDisplayWindow = async (options: type_options_createDisplayWindow, httpResponse: any = undefined) => {
        // writeFileSync("/Users/haohao/tdm.log", `createDisplayWindow ===================== ${JSON.stringify(options)}\n`, {flag: "a"});
        let { tdl, mode, editable, tdlFileName, macros, replaceMacros, hide } = options;
        if (this.getMainProcess().getMainProcessMode() === "ssh-client") {

            // todo: test it
            // check if the window already exist
            const exisitedDisplayWindow = this.checkExistedDisplayWindow(tdlFileName, macros);
            if (exisitedDisplayWindow !== undefined) {
                logs.debug(this.getMainProcessId(), `File ${tdlFileName} is already opened.`);
                // bring up this window if in desktop mode
                if (httpResponse === undefined) {
                    exisitedDisplayWindow.show();
                }
                return;
            }

            const displayWindowId = this.getMainProcess().obtainDisplayWindowHtmlIndex();

            const displayWindowAgent = this.createDisplayWindowAgent(options, displayWindowId);
            // only the browser window is managed by ssh-client, all others are managed by ssh-server
            displayWindowAgent.createBrowserWindow(httpResponse);
            return undefined;
        } else {
            // web, desktop, or ssh-server mode

            // check if the window already exist for desktop mode
            if (this.getMainProcess().getMainProcessMode() === "desktop") {
                const exisitedDisplayWindow = this.checkExistedDisplayWindow(tdlFileName, macros);
                // writeFileSync("/Users/haohao/tdm.log", `--------------------- createDisplayWindow() A0.5 ${exisitedDisplayWindow}\n`, {flag: "a"});
                if (exisitedDisplayWindow !== undefined) {
                    logs.debug(this.getMainProcessId(), `File ${tdlFileName} is already opened.`);
                    // bring up this window if in desktop mode
                    if (httpResponse === undefined) {
                        exisitedDisplayWindow.show();
                    }
                    return;
                }
            }
            // writeFileSync("/Users/haohao/tdm.log", `--------------------- createDisplayWindow() A1 ${tdlFileName}\n`, {flag: "a"});

            logs.debug(
                this.getMainProcessId(),
                `Try to create a new display window for ${tdlFileName === "" ? "<blank string>" : tdlFileName} in ${httpResponse === undefined ? "desktop" : "web"
                } mode`
            );
            // (0)
            // preloaded window only for desktop mode
            if (httpResponse === undefined) {
                // ssh-server does not have preloaded display window
                if (this.getMainProcess().getMainProcessMode() !== "ssh-server") {
                    let displayWindowAgent = this.replacePreloadedDisplayWindow(options);
                    if (displayWindowAgent !== undefined) {
                        logs.debug(this.getMainProcessId(), `Preloaded display window is consumed, created a new one.`);
                        this.createPreloadedDisplayWindow();
                        return displayWindowAgent;
                    } else {
                        if (this.creatingPreloadedDisplayWindow === true) {
                            logs.debug(this.getMainProcessId(), `Preloaded display window does not exist, but it is being created.`);
                        } else {
                            logs.debug(this.getMainProcessId(), `Preloaded display window does not exist, create one in background.`);
                            this.createPreloadedDisplayWindow();
                        }
                    }
                }
            }
            // writeFileSync("/Users/haohao/tdm.log", `--------------------- createDisplayWindow() B ${tdlFileName}\n`, {flag: "a"});

            try {
                // (1)
                const displayWindowId = this.getMainProcess().obtainDisplayWindowHtmlIndex();
                const displayWindowAgent = await this.createDisplayWindowAgent(options, displayWindowId);
                // (2)
                await displayWindowAgent.createBrowserWindow(httpResponse);
                // (3)
                // GUI is created
                // the uuid and process ID on client side are obtained from the html file name, e.g. "DisplayWindow-1-22.html"
                // writeFileSync("/Users/haohao/tdm.log", `--------------------- createDisplayWindow() C ${tdlFileName} ${displayWindowAgent.getId()}\n`, {flag: "a"});

                // block lifted when the websocket connection is established
                // for ssh-server, resolved when websocket-ipc-connected is received in IpcManagerOnMainProcess
                // it means the ssh-client's display window has connected to its own websocket IPC
                await displayWindowAgent.creationPromise;

                // (4)
                displayWindowAgent.sendFromMainProcess("new-tdl", {
                    newTdl: tdl,
                    tdlFileName: tdlFileName,
                    initialModeStr: mode,
                    editable: editable,
                    externalMacros: macros,
                    useExternalMacros: replaceMacros,
                    utilityType: options["utilityType"],
                    utilityOptions: options["utilityOptions"] === undefined ? {} : options["utilityOptions"],
                });
                // (5)
                const selectedProfile = this.getMainProcess().getProfiles().getSelectedProfile();
                if (selectedProfile === undefined) {
                    logs.error(this.getMainProcessId(), "Profile not selected!");
                    return undefined;
                }
                displayWindowAgent.sendFromMainProcess("preset-colors", selectedProfile.getCategory("Preset Colors"));
                logs.debug(
                    this.getMainProcessId(),
                    `Created display window ${displayWindowAgent.getId()} for ${tdlFileName === "" ? "<blank string>" : tdlFileName}`
                );
                return displayWindowAgent;
            } catch (e) {
                logs.error(this.getMainProcessId(), e);
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
            const displayWindowId = this.getMainProcess().obtainDisplayWindowHtmlIndex();
            const displayWindowAgent = await this.createDisplayWindowAgent(options, displayWindowId);
            return undefined;
        } else {


            // logs.debug(this.getMainProcessId(), `Try to create a new display window for ${tdlFileName === "" ? "<blank string>" : tdlFileName}`);
            // // (0)
            // let displayWindowAgent = this.replacePreloadedDisplayWindow(options);
            // if (displayWindowAgent !== undefined) {
            // 	logs.debug(this.getMainProcessId(), `Preloaded display window is consumed, created a new one.`);
            // 	this.createPreloadedDisplayWindow();
            // 	return displayWindowAgent;
            // } else {
            // 	if (this.creatingPreloadedDisplayWindow === true) {
            // 		logs.debug(this.getMainProcessId(), `Preloaded display window does not exist, but it is being created.`);
            // 	} else {
            // 		logs.debug(this.getMainProcessId(), `Preloaded display window does not exist, create one in background.`);
            // 		this.createPreloadedDisplayWindow();
            // 	}
            // }
            try {
                // (1)
                const displayWindowId = this.getMainProcess().obtainDisplayWindowHtmlIndex();

                const displayWindowAgent = await this.createDisplayWindowAgent(options, displayWindowId);
                // (2) do it on client side
                //! await displayWindowAgent.createBrowserWindow();
                // (3)
                // GUI is created
                // the uuid and process ID on client side are obtained from the html file name, e.g. "DisplayWindow-1-22.html"

                // block lifted when the websocket connection is established
                const parentDisplayWindowAgent = this.getAgent(parentDisplayWindowId);
                if (parentDisplayWindowAgent instanceof DisplayWindowAgent) {
                    parentDisplayWindowAgent.sendFromMainProcess("obtained-iframe-uuid", {
                        widgetKey: widgetKey,
                        iframeDisplayId: displayWindowId,
                    });
                }
                const mainProcessMode = this.getMainProcess().getMainProcessMode()

                if (mainProcessMode === "ssh-server") {
                    // tell client to create a GUI window
                    const sshServer = this.getMainProcess().getMainProcesses().getIpcManager().getSshServer();
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
                logs.debug(this.getMainProcessId(), "we have obtained ifram uuid", displayWindowId);
                await displayWindowAgent.creationPromise;
                logs.debug(this.getMainProcessId(), "lifted", displayWindowAgent.getId());

                // (4)
                displayWindowAgent.sendFromMainProcess("new-tdl", {
                    newTdl: tdl,
                    tdlFileName: tdlFileName,
                    initialModeStr: mode,
                    editable: editable,
                    externalMacros: macros,
                    useExternalMacros: replaceMacros,
                    utilityType: options["utilityType"],
                    utilityOptions: options["utilityOptions"] === undefined ? {} : options["utilityOptions"],
                });
                // (5)
                const selectedProfile = this.getMainProcess().getProfiles().getSelectedProfile();
                if (selectedProfile === undefined) {
                    logs.error(this.getMainProcessId(), "Profile not selected!");
                    return undefined;
                }
                displayWindowAgent.sendFromMainProcess("preset-colors", selectedProfile.getCategory("Preset Colors"));
                logs.debug(
                    this.getMainProcessId(),
                    `Created display window ${displayWindowAgent.getId()} for ${tdlFileName === "" ? "<blank string>" : tdlFileName}`
                );
                return displayWindowAgent;
            } catch (e) {
                logs.error(this.getMainProcessId(), e);
                return undefined;
            }
        }
    };

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
     * (4) update TDL of the display window. <br>
     */
    private replacePreloadedDisplayWindow = (options: type_options_createDisplayWindow): DisplayWindowAgent | undefined => {
        // return undefined if we do not want to replace the preloaded display window
        // useful for debug
        // return undefined;

        let { mode, editable, tdl, tdlFileName, macros, replaceMacros } = options;
        logs.debug(this.getMainProcessId(), `Trying to replace preloaded display window with ${tdlFileName}.`);
        // (1)
        let displayWindowAgent = this.preloadedDisplayWindowAgent;
        if (displayWindowAgent === undefined) {
            return undefined;
        }
        this.preloadedDisplayWindowAgent = undefined;
        // (3)
        displayWindowAgent.setTdlFileName(tdlFileName);
        displayWindowAgent.setMacros(macros);
        // context menu for desktop mode is also updated
        displayWindowAgent.setEditable(editable);
        if (options["utilityType"] !== undefined) {
            displayWindowAgent.setReloadable(false);
        }
        // (4)
        displayWindowAgent.sendFromMainProcess("new-tdl", {
            newTdl: tdl,
            tdlFileName: tdlFileName,
            initialModeStr: mode,
            editable: editable,
            externalMacros: macros,
            useExternalMacros: replaceMacros,
            utilityType: options["utilityType"],
            utilityOptions: options["utilityOptions"] === undefined ? {} : options["utilityOptions"],
        });
        logs.info(this.getMainProcessId(), `Replaced preloaded display window ${displayWindowAgent.getId()} with new TDL: ${options["tdlFileName"]}`);
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
            logs.info(this.getMainProcessId(), `Created preload display window ${displayWindowAgent.getId()}`);
            // (3)
            this.preloadedDisplayWindowAgent = displayWindowAgent;
            this.creatingPreloadedDisplayWindow = false;
            return displayWindowAgent;
        } else {
            logs.error(this.getMainProcessId(), `Failed to create preloaded display window`);
            this.creatingPreloadedDisplayWindow = false;
            return undefined;
        }
    };

    /**
     * Create a blank display window.
     */
    createBlankDisplayWindow = async (httpResponse: any = undefined, windowAgent?: DisplayWindowAgent) => {
        const mainProcessMode = this.getMainProcess().getMainProcessMode();
        if (mainProcessMode === "desktop" || mainProcessMode === "web" || mainProcessMode === "ssh-server") {
            const tdl: type_tdl = FileReader.getBlankWhiteTdl();
            const options: type_options_createDisplayWindow = {
                tdl: tdl,
                mode: "editing" as "operating" | "editing",
                editable: true,
                // empty tdl file name, means it is not saved
                tdlFileName: "",
                macros: [],
                replaceMacros: false,
                hide: false,
            };
            await this.createDisplayWindow(options, httpResponse);
        } else if (mainProcessMode === "ssh-client") {
            if (windowAgent !== undefined) {
                const windowId = windowAgent.getId();
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
        utilityType: "Probe" | "PvTable" | "DataViewer" | "ProfilesViewer" | "LogViewer" | "TdlViewer" | "TextEditor" | "Terminal" | "Calculator" | "ChannelGraph" | "CaSnooper" | "Casw" | "PvMonitor" | "Help" | "FileConverter",
        utilityOptions: Record<string, any>,
        httpResponse: any = undefined,
    ) => {
        try {
            if (utilityType === "Probe") {
                // utilityOptions["recordTypesFieldNames"] = this.getMainProcess().getDbdFiles().getAllRecordTypeFieldNames();
                // utilityOptions["recordTypesMenus"] = this.getMainProcess().getDbdFiles().getAllMenusChoices();
                utilityOptions["recordTypes"] = this.getMainProcess().getChannelAgentsManager().getDbdFiles().getRecordTypes();
                utilityOptions["menus"] = this.getMainProcess().getChannelAgentsManager().getDbdFiles().getMenus();
            }

            // (1)
            const tdl = UtilityWindow.creatUtilityBlankTdl(utilityType) as type_tdl;
            const windowOptions: type_options_createDisplayWindow = {
                tdl: tdl,
                mode: "operating" as "editing" | "operating",
                editable: false,
                tdlFileName: "",
                macros: [],
                replaceMacros: false,
                hide: false,
                utilityType: utilityType,
                utilityOptions: utilityOptions,
            };
            const displayWindowAgent = await this.createDisplayWindow(windowOptions, httpResponse);

            if (displayWindowAgent === undefined) {
                logs.error(this.getMainProcessId(), `Cannot create display window for utility ${utilityType}`);
                return;
            }

            // const displayWindowAgent = await this.createDisplayWindowAgent(windowOptions);
            // (2)
            // await displayWindowAgent.createBrowserWindow();
            // (3)
            // const processId = this.getMainProcess().getProcessId();
            // displayWindowAgent.sendFromMainProcess("uuid", processId, displayWindowAgent.getId());
            // (4)
            // if (utilityType === "Probe") {
            // 	// utilityOptions["recordTypesFieldNames"] = this.getMainProcess().getDbdFiles().getAllRecordTypeFieldNames();
            // 	// utilityOptions["recordTypesMenus"] = this.getMainProcess().getDbdFiles().getAllMenusChoices();
            // 	utilityOptions["recordTypes"] = this.getMainProcess().getChannelAgentsManager().getDbdFiles().getRecordTypes();
            // 	utilityOptions["menus"] = this.getMainProcess().getChannelAgentsManager().getDbdFiles().getMenus();
            // }
            // displayWindowAgent.sendFromMainProcess("new-tdl", {
            // 	newTdl: tdl,
            // 	tdlFileName: "",
            // 	initialModeStr: "operating",
            // 	editable: false,
            // 	externalMacros: [],
            // 	useExternalMacros: false,
            // 	utilityType: utilityType,
            // 	utilityOptions: utilityOptions,
            // });
            // (5)
            // const selectedProfile = this.getMainProcess().getProfiles().getSelectedProfile();
            // if (selectedProfile === undefined) {
            // 	return;
            // }

            // displayWindowAgent.sendFromMainProcess("preset-colors", selectedProfile.getCategory("Preset Colors"));
        } catch (e) {
            logs.error(this.getMainProcessId(), e);
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
            const displayWindowId = this.getMainProcess().obtainDisplayWindowHtmlIndex();

            const displayWindowAgent = await this.createDisplayWindowAgent(options, displayWindowId);
            await displayWindowAgent.createWebBrowserWindow(url);
        } catch (e) {
            logs.error(this.getMainProcessId(), e);
        }
    };

    // ------------------ main window ----------------------

    /**
     * Create main window, including the frontend and backend. Then send the
     * profiles to the GUI window so that it can render according to the profiles. <br>
     */
    createMainWindow = async (httpResponse: any = undefined) => {

        if (this.getMainProcess().getMainProcessMode() === "ssh-client") {
            const mainWindowAgent = this.createMainWindowAgent();
            // create the real browser window
            mainWindowAgent.createBrowserWindow(httpResponse);
        } else {

            const mainWindowAgent = this.createMainWindowAgent();

            await mainWindowAgent.createBrowserWindow(httpResponse);

            // GUI is created
            const processId = this.getMainProcess().getProcessId();

            // the uuid of the main window is the `${processId}-mainWindow",
            // the process ID is obtained from the html file name, e.g. "MainWindow-1.html"

            //! the websocket ipc server port can only be sent through webcontents
            //! in the TDM web version, the ipc server port is a fixed number
            // const ipcServerPort = this.getMainProcess().getMainProcesses().getIpcManager().getPort();
            // mainWindowAgent.getWebContents()?.send("websocket-ipc-server-port", ipcServerPort);

            // block lifted when we receive "websocket-ipc-connected" message
            await mainWindowAgent.creationPromise;
            // writeFileSync("/Users/haohao/tdm.log", `createMainWindow ===================== lifted\n`, {flag: "a"});

            // ws opener server port
            const wsOpenerServer = this.getMainProcess().getMainProcesses().getWsOpenerServer();
            const wsOpenerPort = wsOpenerServer.getPort();
            mainWindowAgent.sendFromMainProcess("update-ws-opener-port", wsOpenerPort);

            mainWindowAgent.sendFromMainProcess(
                "after-main-window-gui-created",
                this.getMainProcess().getProfiles().serialize(),
                this.getMainProcess().getProfilesFileName()
            );

            // "Emitted when the application is activated"
            app.on("activate", async () => {
                // On macOS it's common to re-create a window in the app when the
                // dock icon is clicked and there are no other windows open.
                if (BrowserWindow.getAllWindows().length === 0) {
                    // must be async
                    await mainWindowAgent.createBrowserWindow();
                    mainWindowAgent.sendFromMainProcess("uuid", processId);
                    mainWindowAgent.sendFromMainProcess(
                        "after-main-window-gui-created",
                        this._mainProcess.getProfiles().serialize(),
                        this._mainProcess.getProfilesFileName()
                    );
                    // if (cmdLineSelectedProfile !== "") {
                    // 	mainWindowAgent.sendFromMainProcess("cmd-line-selected-profile", cmdLineSelectedProfile);
                    // }
                }
            });
            // at this moment the main window is ready for selecting profile
            mainWindowAgent.creationResolve2();
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
        if (this._agents[`${this.getMainProcessId()}`] === undefined) {
            return undefined;
        }
        return this._agents[`${this.getMainProcessId()}`] as MainWindowAgent;
    };
    getMainProcessId = () => {
        return this._mainProcessId;
    };

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
}
