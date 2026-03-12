import { nativeImage, BrowserWindow, MenuItem, Menu, dialog, clipboard, desktopCapturer, webFrame, webContents, Tray, screen } from "electron";
import * as path from "path";
import { type_options_createDisplayWindow, WindowAgentsManager } from "../../windows/WindowAgentsManager";
import { CaChannelAgent } from "../../channel/CaChannelAgent";
import { type_dbrData, Channel_DBR_TYPES, type_LocalChannel_data } from "../../../common/GlobalVariables";
import { ContextMenuDesktop } from "./ContextMenuDesktop";
import fs, { read } from "fs";
import { LocalChannelAgent } from "../../channel/LocalChannelAgent";
import { homedir } from "os";
import { WebSocket } from "ws";
import { Worker } from "worker_threads";
import * as child_process from "child_process";
import { Log } from "../../../common/Log";
import { v4 as uuidv4 } from "uuid";
import { generateAboutInfo } from "../../global/GlobalMethods";
import pidusage from "pidusage";
import { getCurrentDateTimeStr } from "../../global/GlobalMethods";
import { Promises, type_pva_status, type_pva_value } from "epics-tca";
import { IpcEventArgType2 } from "../../../common/IpcEventArgType";
import { DisplayWindowChannelsManager } from "./DisplayWindowChannelsManager";
import { DisplayWindowFile } from "./DisplayWindowFile";
import { DisplayWindowLifeCycleManager } from "./DisplayWindowLifeCycleManager";

/**
 * The main process side representation of a display window. <br>
 *
 * Its lifecycle comes along with the display window.
 */
export class DisplayWindowAgent {
    /**
     * tdl JSON object, read only
     */
    private _tdl: Record<string, any> = {};

    /**
     * tdl file name. If the tdl JSON object has no corresponding tdl file, it is `""` <br>
     *
     * If the display window (tdl file) is saved as another file, this field is updated.
     */
    private _tdlFileName: string;
    private _windowName: string = "";

    /**
     * UUID, read only
     */
    private readonly _id: string;

    /**
     * Browser window object
     */
    private _browserWindow: any; //BrowserWindow | undefined;

    /**
     * Manager of this agent
     */
    private _windowAgentsManager: WindowAgentsManager;

    /**
     * External macros and other options. The internal macros are defined in tdl file.
     */
    private readonly _options: Record<string, any>;

    _takeThumbnailInterval: NodeJS.Timeout | undefined = undefined;

    /**
     * The context menu is initiated on display window in renderer process, but it is configured and realized in main process.
     */
    private _contextMenu: ContextMenuDesktop;

    private _modified: boolean = false;

    /**
     * base64 image of the thumbnail
     */
    thumbnail: string = "";

    webSocketMonitorClient: WebSocket | undefined;
    webSocketMonitorChannelNames: string[] = [];


    private forFileBrowserWindowId: string = '';
    private forFileBrowserWidgetKey: string = '';

    private readonly _displayWindowFile: DisplayWindowFile;

    private readonly _displayWindowChannelsManager: DisplayWindowChannelsManager;

    private readonly _displayWindowLifeCycleManager: DisplayWindowLifeCycleManager;

    // private _htmlIndex: string = "";

    /**
     * EmbeddedDisplay stuff
     */
    // _parentDisplayWindowId: string | undefined = undefined;
    // _parentWidgetKey: string | undefined = undefined;
    // -100 means it is a regular display window
    // -1 means it is an embedded display mask
    // >= 0 means it is a regular embedded display
    // 10000 means it is the preloaded embedded display
    // _embeddedDisplayIndex: number = -100;
    _isWebpage: boolean = false;
    _boundValues: { x: number; y: number; width: number; height: number } = {
        x: 0,
        y: 0,
        width: 1,
        height: 1,
    };

    getBoundValues = () => {
        return this._boundValues;
    };
    setBoundValues = (newValues: { x: number; y: number; width: number; height: number }) => {
        this._boundValues = structuredClone(newValues);
    };

    // private _mainProcessId: string;

    /**
     * This window is hidden. It is changed to true by this.show()
     */
    hiddenWindow: boolean;

    _macros: [string, string][];
    _isUtilityWindow: boolean;

    private _editable: boolean;
    // if this display window is reloadable, if not, the "Reload" in context menu is gone
    private _reloadable: boolean = true;

    creationResolve: any;
    creationReject: any;
    creationPromise: Promise<string> = new Promise((resolve, reject) => {
        this.creationResolve = resolve;
        this.creationReject = reject;
    });

    promises: Promises = new Promises();

    _initialMode: "operating" | "editing";
    _replaceMacros: boolean;
    _utilityType: string | undefined;
    _utilityOptions: Record<string, any> | undefined;

    getInitialMode = () => {
        return this._initialMode;
    }

    getReplaceMacros = () => {
        return this._replaceMacros;
    }

    getUtilityType = () => {
        return this._utilityType;
    }

    getUtilityOptions = () => {
        return this._utilityOptions;
    }



    constructor(windowAgentsManager: WindowAgentsManager, options: type_options_createDisplayWindow, id: string) {
        this._windowAgentsManager = windowAgentsManager;
        this._tdl = structuredClone(options)["tdl"];
        this._isUtilityWindow = this._tdl["Canvas"]["isUtilityWindow"] === undefined ? false : this._tdl["Canvas"]["isUtilityWindow"];

        this._initialMode = options["mode"];
        this._replaceMacros = options["replaceMacros"];
        this._utilityType = options["utilityType"];
        this._utilityOptions = options["utilityOptions"];


        this._tdlFileName = structuredClone(options)["tdlFileName"];
        this._macros = structuredClone(options["macros"]);
        this.updateHash();

        // for a regular display window, editable means it can be switched to Editing mode, and in operating mode, it only has 
        // "Save As" choice. 
        // for a Utility window, it can never go to Editing mode, in operating mode, editable means some Utility windows have
        // "Save" option because they contain runtime data
        this._editable = options["editable"];
        // mode bit "editing" overrides the "editable" bit
        if (options["mode"] === "editing") {
            this._editable = true;
        }

        this._options = options;
        this.hiddenWindow = options["hide"];
        this._contextMenu = new ContextMenuDesktop(this);
        this._displayWindowFile = new DisplayWindowFile(this);
        this._displayWindowChannelsManager = new DisplayWindowChannelsManager(this);
        this._displayWindowLifeCycleManager = new DisplayWindowLifeCycleManager(this);
        // this._mainProcessId = this.getWindowAgentsManager().getMainProcess().getProcessId();
        // obtain and assign display window ID
        // this.setHtmlIndex(this.getWindowAgentsManager().getMainProcess().obtainDisplayWindowHtmlIndex());
        // if (id === undefined) {
        // 	this._id = this.getHtmlIndex();
        // } else {
        this._id = id;
        // }
        this._displayWindowChannelsManager.startChannelsDataInterval();

        this.promises.appendPromise("tca-get-meta", false);
        this.promises.appendPromise("fetch-pva-type", false);
    }


    // ---------------- web socket PV server ---------------------
    setWebSocketMonitorClient = (webSocketMonitorClient: WebSocket | undefined) => {
        this.webSocketMonitorClient = webSocketMonitorClient;
    };

    getWebSocketMonitorClient = () => {
        return this.webSocketMonitorClient;
    };

    getWebSocketMonitorChannelNames = () => {
        return this.webSocketMonitorChannelNames;
    };

    setWebSocketMonitorChannelNames = (newNames: string[]) => {
        this.webSocketMonitorChannelNames = newNames;
    };

    addWebSocketMonitorChannelName = (newName: string) => {
        this.setWebSocketMonitorChannelNames([...new Set([...this.webSocketMonitorChannelNames, newName])]);
    };

    webSocketClientThread: Worker | child_process.ChildProcess | undefined;

    windowAttachedScriptName: string = "";
    windowAttachedScriptPid: number | undefined = undefined;

    // invoked when the display window is switched to editing mode and the display window is a "real" window (not preloaded)
    createWebSocketClientThread = (port: number, script: string) => {
        if (!(script.endsWith(".py") || script.endsWith(".js"))) {
            Log.debug("0", `Script ${script} won't run for window ${this.getId()}.`);
            this.sendFromMainProcess("dialog-show-message-box", {
                info: {
                    // command?: string | undefined,
                    messageType: "error", // | "warning" | "info", // symbol
                    humanReadableMessages: [`Failed to execute command "${script} from from this window".`, `We can only run python or node.js scripts.`], // each string has a new line
                    rawMessages: [``], // computer generated messages
                    // buttons?: type_DialogMessageBoxButton[] | undefined,
                    // attachment?: any,
                }
            })
            return;
        }
        if (this.webSocketClientThread !== undefined) {
            this.terminateWebSocketClientThread();
        }

        if (
            this.getWindowAgentsManager().preloadedDisplayWindowAgent === this
            // || this.getWindowAgentsManager().preloadedEmbeddedDisplayAgent === this
        ) {
            Log.debug("0", "This is a preloaded display window, skip creating websocket client thread");
            return;
        }

        // once the thread is created, it never sends data back to main process via the thread model.
        // instead, it talks to the main process via WebSocket
        try {
            if (script.endsWith(".py")) {
                Log.info("0", `Create new Python thread for display window ${this.getId()}`);
                const selectedProfile = this.getWindowAgentsManager().getMainProcess().getProfiles().getSelectedProfile();
                if (selectedProfile !== undefined) {
                    const pythonCommand = selectedProfile.getEntry("EPICS Custom Environment", "Python Command");
                    if (pythonCommand !== undefined) {
                        this.webSocketClientThread = child_process.spawn(pythonCommand, [script, `${port}`, this.getId()], {
                            stdio: "inherit", // not pipe!
                        });
                        if (this.webSocketClientThread instanceof child_process.ChildProcess) {
                            this.windowAttachedScriptName = script;
                            this.windowAttachedScriptPid = this.webSocketClientThread.pid;
                        }
                        // output
                        this.webSocketClientThread.stdout?.on("data", (data) => {
                            Log.debug("0", `Python stdout: ${data}`);
                        });
                        this.webSocketClientThread.stderr?.on("data", (data) => {
                            Log.error("0", `Python stderr: ${data}`);
                        });

                    }
                }
            } else if (script.endsWith(".js")) {
                Log.debug("0", `Create new Javascript thread on display window ${this.getId()}`);
                this.webSocketClientThread = new Worker(script, {
                    workerData: {
                        mainProcessId: "0",
                        displayWindowId: this.getId(),
                        port: port,
                        script: script,
                    },
                });
                this.windowAttachedScriptName = script;
                this.windowAttachedScriptPid = process.pid;
            }
        } catch (e) {
            Log.error("0", e);
        }

        // prevent popup window upon error
        this.webSocketClientThread?.on("error", (err: Error) => {
            Log.error("0", err);
            this.sendFromMainProcess("dialog-show-message-box", {
                info: {
                    // command?: string | undefined,
                    messageType: "error", // | "warning" | "info", // symbol
                    humanReadableMessages: [`Failed to execute command "${script}"`], // each string has a new line
                    rawMessages: [`${err}`], // computer generated messages
                    // buttons?: type_DialogMessageBoxButton[] | undefined,
                    // attachment?: any,
                }
            })
        });
    };

    // invoked when (1) the display window closed, or (2) the display window is switched to editing mode
    terminateWebSocketClientThread = () => {
        Log.debug("0", `Terminate websocket client thread for display window ${this.getId()}`);

        if (this.webSocketClientThread instanceof Worker) {
            this.webSocketClientThread.terminate();
        } else if (this.webSocketClientThread instanceof child_process.ChildProcess) {
            this.webSocketClientThread.kill();
        } else {
            Log.debug("0", "There was no worker thread for WebSocket client");
        }
    };

    removeWebSocketMonitorChannels = () => {
        for (const channelName of this.getWebSocketMonitorChannelNames()) {
            this.removeChannel(channelName);
        }
    }

    // -----------------------------------------------


    // -------------------- channels -----------------------
    tcaGet = async (channelName: string, ioTimeout: number | undefined, dbrType: Channel_DBR_TYPES | undefined | string): Promise<type_dbrData | type_pva_value | { value: undefined }> => {
        return await this.getDisplayWindowChannelsManager().tcaGet(channelName, ioTimeout, dbrType);
    };

    tcaGetMeta = async (channelName: string, ioTimeout: number | undefined): Promise<type_dbrData | type_LocalChannel_data | { value: undefined }> => {
        return await this.getDisplayWindowChannelsManager().tcaGetMeta(channelName, ioTimeout);
    };

    fetchPvaType = async (channelName: string, ioTimeout: number | undefined): Promise<Record<string, any> | undefined> => {
        return await this.getDisplayWindowChannelsManager().fetchPvaType(channelName, ioTimeout);
    };

    tcaPutMeta = (
        channelName: string,
        dbrMetaData: {
            value: number | string | undefined;
            type: "number" | "string" | "enum";
            strings: string[];
        }
    ): void => {
        this.getDisplayWindowChannelsManager().tcaPutMeta(channelName, dbrMetaData);
    };

    tcaPut = async (channelName: string, dbrData: type_dbrData | type_LocalChannel_data, ioTimeout: number, pvaValueField: string, waitNotify: boolean): Promise<number | undefined | type_pva_status> => {
        return await this.getDisplayWindowChannelsManager().tcaPut(channelName, dbrData, ioTimeout, pvaValueField, waitNotify);
    };

    tcaMonitor = async (channelName: string): Promise<boolean> => {
        return await this.getDisplayWindowChannelsManager().tcaMonitor(channelName);
    };

    removeAllChannels = () => {
        this.getDisplayWindowChannelsManager().removeAllChannels();
    };

    removeChannel = (channelName: string) => {
        this.getDisplayWindowChannelsManager().removeChannel(channelName);
    };

    checkChannelOperations = (channelName: string): boolean => {
        return this.getDisplayWindowChannelsManager().checkChannelOperations(channelName);
    };

    addAndConnectChannel = async (channelName: string, ioTimeout: number | undefined = undefined): Promise<boolean> => {
        return await this.getDisplayWindowChannelsManager().addAndConnectChannel(channelName, ioTimeout);
    };

    addAndConnectLocalChannel = (channelName: string): boolean => {
        return this.getDisplayWindowChannelsManager().addAndConnectLocalChannel(channelName);
    };

    addChannelAgent = (agent: CaChannelAgent | LocalChannelAgent) => {
        this.getDisplayWindowChannelsManager().addChannelAgent(agent);
    };

    removeChannelAgent = (agent: CaChannelAgent | LocalChannelAgent) => {
        this.getDisplayWindowChannelsManager().removeChannelAgent(agent);
    };

    addNewChannelData = (channelName: string, newData: type_dbrData | type_LocalChannel_data | type_pva_value) => {
        this.getDisplayWindowChannelsManager().addNewChannelData(channelName, newData);
    };

    checkChannelsState = () => {
        this.getDisplayWindowChannelsManager().checkChannelsState();
    };

    /**
     * Clean up the server side for the display window or embedded iframe display.
     *
     * Invoked when we close the display window (event emitted by Electron.js),
     * or the websocket IPC connection is closed (typically for embedded display when its host window
     * is closed). <br>
     *
     * (1) remove all channels, if the channel is not used by any other windows,
     *     it is destroyed. <br>
     *
     * (2) clear interval, stop sending data to this display window <br>
     *
     * (3) remove this DisplayWindowAgent from WindowAgentsManager <br>
     *
     * (6) terminate the websocket IPC connection, and remove the WebSocket client object from server
     * 
     * (8) remove casnooper registration for this window. Shut down ca snooper server if there is no window registered.
     * 
     * (9) update macos dock
     */
    handleWindowClosed = () => {
        Log.info("0", "close display window", this.getId())
        // (7)
        // this.getWindowAgentsManager().getMainProcess().releaseDisplayWindowHtmlIndex(this.getId());
        // (1) and (2)
        this.getDisplayWindowChannelsManager().handleWindowClosed();
        // (3)
        this.getWindowAgentsManager().removeAgent(this.getId());
        // (4)
        clearInterval(this._takeThumbnailInterval);
        this.removeThumbnail(this.getId());

        // (5) terminate websocket thread
        this.terminateWebSocketClientThread();

        const hasPreloadedBrowserWindow = this.getWindowAgentsManager().preloadedDisplayWindowAgent === undefined ? 0 : 1;
        const hasPreviewBrowserWindow = this.getWindowAgentsManager().previewDisplayWindowAgent === undefined ? 0 : 1;
        const numBrowserWindows = Object.keys(this.getWindowAgentsManager().getAgents()).length;

        if (numBrowserWindows - hasPreloadedBrowserWindow - hasPreviewBrowserWindow <= 0) {
            if (this.getWindowAgentsManager().getMainProcess().getMainProcessMode() === "desktop" || this.getWindowAgentsManager().getMainProcess().getMainProcessMode() === "ssh-client") {
                this.getWindowAgentsManager().getMainProcess().quit();
            }
        }

        const ipcManager = this.getWindowAgentsManager().getMainProcess().getIpcManager();
        ipcManager.removeClient(this.getId());

        const mainProcess = this.getWindowAgentsManager().getMainProcess();
        const caSnooperServer = mainProcess.getCaSnooperServer();
        if (caSnooperServer !== undefined) {
            caSnooperServer.stopCaSnooperServer(this.getId());
        }
        const caswServer = mainProcess.getCaswServer();
        if (caswServer !== undefined) {
            caswServer.stopCaswServer(this.getId());
        }

        this.getWindowAgentsManager().setDockMenu();
    };

    // --------------------- context menu --------------

    showContextMenu = (mode: string, widgetKeys: string[], options: Record<string, any>) => {
        const contextMenuTemplate = this.getContextMenu().getTemplate(mode, widgetKeys, options);
        if (contextMenuTemplate !== undefined) {
            const menu = Menu.buildFromTemplate(contextMenuTemplate);
            menu.popup();
        } else {
            Log.error("0", "Cannot show context menu");
        }
    };

    showContextMenuSidebar = (mode: string, widgetKeys: string[], options: Record<string, any>) => {
        // const contextMenuTemplate = this.getContextMenu().getTemplate(mode, widgetKeys, options);
        const hasSelection = options["hasSelection"];
        let contextMenuTemplate = [
            {
                label: "Copy",
                accelerator: "CmdOrCtrl+c",
                role: "copy" as any,
                // greg out when there is nothing selected, does not work on macos
                enabled: hasSelection,
            },
            {
                label: "Cut",
                accelerator: "CmdOrCtrl+x",
                role: "cut" as any,
                enabled: hasSelection,
            },
            {
                label: "Paste",
                accelerator: "CmdOrCtrl+v",
                role: "paste" as any,
            },
        ];
        // work around the grey out issue on macos
        if (process.platform === "darwin") {
            if (!hasSelection) {
                contextMenuTemplate = [
                    {
                        label: "Paste",
                        accelerator: "CmdOrCtrl+v",
                        role: "paste" as any,
                    },
                ];
            }
        }
        if (contextMenuTemplate !== undefined) {
            const menu = Menu.buildFromTemplate(contextMenuTemplate);
            menu.popup();
        } else {
            Log.error("0", "Cannot show context menu");
        }
    };

    printToPdf = async () => {
        const browserWindow = this.getBrowserWindow();
        let pdfContentsBufferPromise: any;
        if (browserWindow instanceof BrowserWindow) {
            try {
                let promiseResolved = false;

                const timeoutPromise = new Promise((resolve, reject) => {
                    setTimeout(() => {
                        reject("time out after 1 s");
                    }, 1000);
                });
                // if the pdf cannot be generated in 1 second, consider the printToPDF is problematic
                pdfContentsBufferPromise = browserWindow.webContents.printToPDF({ printBackground: true, pageSize: "Letter" });

                const pdfContentsBuffer = await Promise.race([timeoutPromise, pdfContentsBufferPromise]);

                if (pdfContentsBuffer instanceof Buffer) {
                    // .then((pdfContents: Buffer) => {
                    let pdfFileName = dialog.showSaveDialogSync({ title: "save pdf file", filters: [{ name: "pdf", extensions: ["pdf"] }] });
                    if (pdfFileName === undefined) {
                        Log.debug("0", "pdf file not selected.");
                        return;
                    }
                    fs.writeFile(pdfFileName, pdfContentsBuffer as Uint8Array, (err) => {
                        if (err) {
                            this.sendFromMainProcess("dialog-show-message-box",
                                {
                                    info: {
                                        messageType: "error",
                                        humanReadableMessages: [`Failed saving pdf as ${pdfFileName}`],
                                        rawMessages: [err.toString()]
                                    }
                                }
                            )
                        }
                    });
                }
            } catch (e) {
                Log.error("0", e);
            }
            // });
        }
    };

    takeScreenshot = () => {
        const browserWindow = this.getBrowserWindow();
        if (browserWindow === undefined) {
            Log.error("0", "Browser window does not exist");
            return;
        }
        const webContents = browserWindow.webContents;
        webContents.capturePage().then((image: Electron.NativeImage) => {
            let imageFileName = dialog.showSaveDialogSync({
                title: "save image",
                filters: [{ name: "Image Files", extensions: ["png"] }],
            });
            if (imageFileName === undefined) {
                Log.debug("0", "Image file not selected, image not saved");
                return;
            }
            fs.writeFile(imageFileName, image.toPNG() as Uint8Array, (err) => {
                if (err) {
                    this.sendFromMainProcess("dialog-show-message-box",
                        {
                            info: {
                                messageType: "error",
                                humanReadableMessages: [`Failed saving screenshot to folder ${imageFileName}`],
                                rawMessages: [err.toString()]
                            }
                        }
                    );
                }
            });
        });
    };

    takeScreenshotToFolder = () => {
        const browserWindow = this.getBrowserWindow();
        if (browserWindow === undefined) {
            Log.error("0", "Browser window does not exist");
            return;
        }
        let saveFolder = homedir();
        const webContents = browserWindow.webContents;
        webContents.capturePage().then((image: Electron.NativeImage) => {

            const selectedProfile = this.getWindowAgentsManager().getMainProcess().getProfiles().getSelectedProfile();
            if (selectedProfile !== undefined) {
                try {
                    const saveFolderTmp = selectedProfile.getEntry("EPICS Custom Environment", "Video Saving Folder");
                    if (saveFolderTmp === undefined) {
                        throw new Error("Cannot find Video Saving Folder setting");
                    }
                    if (fs.existsSync(saveFolderTmp)) {
                        fs.accessSync(saveFolderTmp, fs.constants.W_OK);
                        saveFolder = saveFolderTmp;
                    }
                } catch (e) {
                    Log.error("0", e);
                }
            }

            const imageFileName = path.join(saveFolder, "TDM-screenshot-" + getCurrentDateTimeStr(true) + ".png");
            fs.writeFile(imageFileName, image.toPNG() as Uint8Array, (err) => {
                if (err) {
                    this.sendFromMainProcess("dialog-show-message-box",
                        {
                            info: {
                                messageType: "error",
                                humanReadableMessages: [`Failed saving screenshot to folder ${saveFolder}`],
                                rawMessages: [err.toString()]
                            }
                        }
                    )
                } else {
                    Log.info("Save screenshot to", imageFileName);
                }
            });
        }).catch((err: any) => {
            Log.error("0", err)
            this.sendFromMainProcess("dialog-show-message-box",
                {
                    info: {
                        messageType: "error",
                        humanReadableMessages: [`Failed saving screenshot to folder ${saveFolder}`],
                        rawMessages: [err.toString()]
                    }
                }
            )
        });
    };

    takeScreenshotToClipboard = () => {
        const browserWindow = this.getBrowserWindow();
        if (browserWindow === undefined) {
            Log.error("0", "Browser window does not exist");
            return;
        }
        const webContents = browserWindow.webContents;
        webContents.capturePage().then((image: Electron.NativeImage) => {
            clipboard.writeImage(image);
        });
    };

    updateThumbnail = (
        displayWindowId: string,
        imageBase64: string | undefined,
        windowName: string | undefined = undefined,
        tdlFileName: string | undefined = undefined
    ) => {
        const mainWindowAgent = this.getWindowAgentsManager().getMainWindowAgent();
        const result: Record<
            string,
            {
                image: string;
                windowName?: string;
                tdlFileName?: string;
            } | null
        > = {};
        if (imageBase64 !== undefined) {
            this.thumbnail = imageBase64;
            const data: {
                image: string;
                windowName?: string;
                tdlFileName?: string;
            } = { image: imageBase64 };
            result[displayWindowId] = data;
            if (windowName !== undefined) {
                data["windowName"] = windowName;
            }
            if (windowName !== undefined) {
                data["tdlFileName"] = tdlFileName;
            }
        } else {
            this.thumbnail = "";
            result[displayWindowId] = null;
        }
        if (mainWindowAgent !== undefined && this.hiddenWindow === false) {
            mainWindowAgent.sendFromMainProcess("new-thumbnail",
                {
                    data: result
                }
            );
        } else {
            Log.error("0", "Main window not ready");
        }
    };

    removeThumbnail = (displayWindowId: string) => {
        this.updateThumbnail(displayWindowId, undefined);
    };

    getThumbnail = () => {
        return this.thumbnail;
    }

    takeThumbnail = async (windowName: string | undefined = undefined, tdlFileName: string | undefined = undefined) => {
        try {
            const browserWindow = this.getBrowserWindow();
            if (browserWindow instanceof BrowserWindow) {
                const webContents = browserWindow.webContents;
                // console.log("=================== take thumbnail ================\n");
                const image: Electron.NativeImage = await webContents.capturePage();
                const size = image.getSize();
                let resizedImage: Electron.NativeImage = image;


                if (this.hiddenWindow === true) {
                    const bounds = browserWindow.getBounds(); // Get window's bounds (position and size)
                    const display = screen.getDisplayMatching(bounds); // Find matching display
                    const factor = display.scaleFactor;

                    resizedImage = resizedImage.crop({
                        x: 0,
                        y: 0,
                        width: size.width - 200 * factor, // why 400, sidebar is 200
                        height: size.height,
                    })
                }

                const maxSize = this.getForFileBrowserWindowId() === "" ? 100 : 800;
                if (size.height > maxSize || size.width > maxSize) {
                    if (size.height > size.width) {
                        resizedImage = resizedImage.resize({
                            height: maxSize
                        });
                    } else {
                        resizedImage = resizedImage.resize({
                            width: maxSize,
                        });
                    }
                }
                const imageBuffer = resizedImage.toPNG();
                const imageBase64 = imageBuffer.toString("base64");
                const displayWindowId = this.getId();
                if (this.getDisplayWindowLifeCycleManager().isReadyToClose() === false) {
                    this.updateThumbnail(displayWindowId, `data:image/png;base64,${imageBase64}`, windowName, tdlFileName);
                }
                ;
            }
        } catch (e) {
            // ! When the app quits, it may cause an unexpected error that pops up in GUI.
            // ! The worst part is I cannot catch it, as it happens in the worker thread.
            Log.error("0", e);
        }
    };

    print = () => {
        const browserWindow = this.getBrowserWindow();
        if (browserWindow === undefined) {
            Log.error("0", "Browser window does not exist");
            return;
        }
        browserWindow.webContents.print({
            printBackground: true,
            color: true,
        });
    };

    // ---------------------- IPC ----------------------

    /**
     * send a message from main process IPC websocket server to renderer process websocket client
     * 
     * It is invoked by Logs.sendToLogViewers(), we have to temporarily disable the log mechanism 
     * to avoid stack overflow. In this case, we only send the message out to the renderer process.
     */

    sendFromMainProcess = <T extends keyof IpcEventArgType2>(channel: T, arg: IpcEventArgType2[T]): void => {
        // if (args[args.length - 1] === "temporarily-disable-log-mechanism") {
        //     args.splice(args.length - 1, 1);
        // }

        // const processId = this.getWindowAgentsManager().getMainProcess().getProcessId();
        const ipcManager = this.getWindowAgentsManager().getMainProcess().getIpcManager();

        const mainProcessMode = this.getWindowAgentsManager().getMainProcess().getMainProcessMode();

        if (mainProcessMode === "ssh-server") {
            // forward all messages to tcp client in ssh-server mode
            const ipcManagerOnMainProcesses = this.getWindowAgentsManager().getMainProcess().getIpcManager();
            const sshServer = ipcManagerOnMainProcesses.getSshServer();
            if (sshServer !== undefined) {
                // const args = Object.values(arg);
                // console.log("args ===", args)
                sshServer.sendToTcpClient(JSON.stringify({ processId: "0", windowId: this.getId(), eventName: channel, data: [arg] }));
            }
        } else {

            const wsClient = ipcManager.getClients()[this.getId()];

            if (wsClient === undefined) {
                // temporarily disable writing the LogViewer to avoid stack overflow
                Log.debug("0", "Cannot find WebSocket IPC client for window", this.getId());
                return;
            }

            try {
                // add processId
                // this._browserWindow?.webContents.send(channel, processId, ...args);
                // wsClient.send(channel, ...[processId, ...args]);
                Log.debug("0", "send from main process:", { processId: "0", windowId: this.getId(), eventName: channel, data: [arg] })
                if (typeof wsClient !== "string") {
                    const str = JSON.stringify({ processId: "0", windowId: this.getId(), eventName: channel, data: [arg] });
                    wsClient.send(str);
                }

                if (channel === "new-channel-data") {
                    const webSocketMonitorClient = this.getWebSocketMonitorClient();

                    const webSocketMonitorData: Record<string, any> = {};
                    const dbrData = (arg as any)["newDbrData"];
                    if (dbrData === undefined) {
                        return;
                    }
                    if (webSocketMonitorClient !== undefined) {
                        for (let channelName of Object.keys(dbrData)) {
                            if (this.getWebSocketMonitorChannelNames().includes(channelName)) {
                                webSocketMonitorData[channelName] = { ...dbrData[channelName], channelName: channelName };
                            }
                        }
                        if (Object.keys(webSocketMonitorData).length > 0) {
                            webSocketMonitorClient.send(JSON.stringify({ command: "MONITOR", dbrDataObj: webSocketMonitorData }));
                        }
                    }
                }
            } catch (e) {
                Log.error("0", e);
            }
        }
    }


    // --------------------- window --------------------

    startRecordVideo = () => {
        let saveFolder = homedir();
        const selectedProfile = this.getWindowAgentsManager().getMainProcess().getProfiles().getSelectedProfile();
        if (selectedProfile !== undefined) {
            try {
                const saveFolderTmp = selectedProfile.getEntry("EPICS Custom Environment", "Video Saving Folder");
                if (saveFolderTmp === undefined) {
                    throw new Error("Cannot find Video Saving Folder setting");
                }
                if (fs.existsSync(saveFolderTmp)) {
                    fs.accessSync(saveFolderTmp, fs.constants.W_OK);
                    saveFolder = saveFolderTmp;
                }
            } catch (e) {
                Log.error("0", e);
            }
        }

        const browserWindow = this.getBrowserWindow();
        if (browserWindow instanceof BrowserWindow) {
            const windowTitle = browserWindow.getTitle();
            desktopCapturer.getSources({ types: ["window"] }).then(async (sources: Electron.DesktopCapturerSource[]) => {
                for (const source of sources) {
                    Log.debug("0", source.name);
                    // if there are multiple windows that have the same title, the
                    // first one will be picked. This one is the one that
                    // we initiate the context menu
                    if (source.name === windowTitle) {
                        this.sendFromMainProcess("start-record-video",
                            {
                                sourceId: source.id,
                                folder: saveFolder
                            }
                        );
                        break;
                    }
                }
            });
        }
    };

    createBrowserWindow = async (options: any = undefined) => {
        await this.getDisplayWindowLifeCycleManager().createBrowserWindow(options);
    };

    showAboutTdm = () => {
        if (this.getWindowAgentsManager().getMainProcess().getMainProcessMode() === "desktop") {
            // Record<string, string[]>
            this.sendFromMainProcess("show-about-tdm",
                {
                    info: generateAboutInfo()
                }
            )
        }
    }

    /**
     * When the close button is clicked or webContents.close() invoked for the first time, or app.quit() is invoked. <br>
     * 
     * If above actions are called for the second time, close the window.
     *
     * The preloaded windows are closed immediately, without any cleanup. <br>
     *
     * It tells the display window that it will be close, so that some actions can be prepared,
     * e.g. pop up the save tdl prompt. <br>
     */
    handleWindowClose = () => {
        if (
            this.getWindowAgentsManager().preloadedDisplayWindowAgent === this
        ) {
            this.getBrowserWindow()?.webContents.close();
            Log.error("0", `You are trying to close a preloaded display window or preloaded embedded display`);
            return;
        }
        this.sendFromMainProcess("window-will-be-closed", {});
    };

    getZoomFactor = (): number => {
        const browserWindow = this.getBrowserWindow();
        if (browserWindow instanceof BrowserWindow) {
            return browserWindow.webContents.getZoomFactor();
        } else {
            return 1;
        }
    };

    setZoomFactor = (level: number) => {
        const browserWindow = this.getBrowserWindow();
        if (browserWindow instanceof BrowserWindow) {
            Log.debug("0", this.getId());
            browserWindow.webContents.setZoomFactor(level);
        } else {
            // do nothing
        }
    };

    createWebBrowserWindow = async (url: string) => {

        const mainProcesMode = this.getWindowAgentsManager().getMainProcess().getMainProcessMode();
        if (mainProcesMode === "ssh-server") {
            // tell client to create a GUI window
            const sshServer = this.getWindowAgentsManager().getMainProcess().getIpcManager().getSshServer();
            if (sshServer !== undefined) {
                sshServer.sendToTcpClient(JSON.stringify({ command: "create-web-display-window-step-2", data: { url: url, displayWindowId: this.getId() } }))
            }
        } else {

            let width = 1200;
            let height = 1100;
            let resizable = true;
            const windowOptions = {
                width: width,
                height: height,
                backgroundColor: `rgb(255, 255, 255)`,
                title: "TDM Display Window",
                resizable: resizable,
                // with chrome
                frame: true,
                autoHideMenuBar: true,
                minWidth: 200,
                minHeight: 100,
                show: true,
                webPreferences: {
                    // do not use node.js
                    // nodeIntegration: true,
                    // contextIsolation: false,
                    // nodeIntegrationInWorker: true,
                    // sandbox: false,
                    // webviewTag: true,
                    // backgroundThrottling: false,
                },
            };
            const window = new BrowserWindow(windowOptions);

            // open development tools
            // const webContents = this._window.webContents;
            // window.webContents.openDevTools({ mode: "right" });

            this._browserWindow = window;
            // window.setMenu(null);

            await window.loadURL(url);

            this._browserWindow.on("closed", this.handleWindowClosed);

            var menu = new Menu();
            menu.append(
                new MenuItem({
                    label: "Back",
                    click: () => {
                        if (window.webContents.canGoBack()) {
                            window.webContents.goBack();
                        }
                    },
                })
            );
            menu.append(
                new MenuItem({
                    label: "Forward",
                    click: () => {
                        if (window.webContents.canGoForward()) {
                            window.webContents.goForward();
                        }
                    },
                })
            );
            menu.append(
                new MenuItem({
                    label: "Reload",
                    click: () => {
                        window.webContents.reloadIgnoringCache();
                    },
                })
            );
            menu.append(
                new MenuItem({
                    label: "Copy",
                    click: () => {
                        window.webContents.copy();
                    },
                })
            );
            menu.append(
                new MenuItem({
                    label: "Paste",
                    click: () => {
                        window.webContents.paste();
                    },
                })
            );

            window.webContents.on("context-menu", (event: any, click: any) => {
                event.preventDefault();
                menu.popup();
            });
        }
    };

    // ------------------ embedded window (BrowserView) ------------------

    /**
     * Bring up to front
     */
    show = () => {
        const browserWindow = this.getBrowserWindow();
        if (browserWindow instanceof BrowserWindow) {
            Log.debug("0", `Show display window ${this.getId()} with ${this.getTdlFileName()}`);
            this.hiddenWindow = false;
            browserWindow.show();
        } else {
            Log.error("0", `Error: cannot show window ${this.getId()}`);
        }
    };

    focus = () => {
        const browserWindow = this.getBrowserWindow();
        if (browserWindow instanceof BrowserWindow) {
            if (browserWindow.isMinimized()) {
                browserWindow.restore();
            }
            browserWindow.focus();
        } else {
            Log.error("0", `Error: cannot focus window ${this.getId()}`);
        }
    };

    close = () => {
        this.getDisplayWindowLifeCycleManager().close();
    };

    // ----------------- getters and setters ------------------------

    getWindowAgentsManager = () => {
        return this._windowAgentsManager;
    };
    // getChannelAgentsManager = () => {
    // 	const windowAgentsManager = this.getWindowAgentsManager();
    // 	const mainProcess = windowAgentsManager.getMainProcess();
    // 	return mainProcess.getChannelAgentsManager();
    // };
    getChannelAgents = () => {
        return this.getDisplayWindowChannelsManager().getChannelAgents();
    };
    getChannelAgent = (channelName: string) => {
        return this.getDisplayWindowChannelsManager().getChannelAgent(channelName);
    };
    getTdl = (): Record<string, any> => {
        return this._tdl;
    };

    getTdlFileName = () => {
        return this._tdlFileName;
    };

    getId = () => {
        return this._id;
    };

    getBrowserWindow = () => {
        return this._browserWindow;
    };

    setBrowserWindow = (newBrowserWindow: any) => {
        this._browserWindow = newBrowserWindow;
    };

    getContextMenu = () => {
        return this._contextMenu;
    };

    getDisplayWindowFile = () => {
        return this._displayWindowFile;
    };

    getDisplayWindowChannelsManager = () => {
        return this._displayWindowChannelsManager;
    };

    getDisplayWindowLifeCycleManager = () => {
        return this._displayWindowLifeCycleManager;
    };

    setIsWebpage = () => {
        this._isWebpage = true;
    };

    isWebpage = () => {
        return this._isWebpage;
    };

    setTdl = (newTdl: Record<string, any>) => {
        this._tdl = newTdl;
    };

    /**
     * set tdl file name, and update hash
     */
    setTdlFileName = (newFileName: string) => {
        this._tdlFileName = newFileName;
        this.updateHash();
    };

    /**
     * set new macros (hard copy), and update hash.
     */
    setMacros = (newMacros: [string, string][]) => {
        this._macros = structuredClone(newMacros);
        this.updateHash();
    }

    getMacros = () => {
        return this._macros;
    }

    setWindowName = (newName: string) => {
        this._windowName = newName;
    };
    getWindowName = () => {
        return this._windowName;
    };



    // getMainProcessId = () => {
    //     return this._mainProcessId;
    // };

    // getHtmlIndex = () => {
    // 	return this._htmlIndex;
    // };

    // setHtmlIndex = (newIndex: string) => {
    // 	this._htmlIndex = newIndex;
    // };

    getWebContents = () => {
        const browserWindow = this.getBrowserWindow();
        if (browserWindow !== undefined) {
            return browserWindow.webContents;
        } else {
            return undefined;
        }
    };

    setForFileBrowserWindowId = (newId: string) => {
        this.forFileBrowserWindowId = newId;
    }

    getForFileBrowserWindowId = () => {
        return this.forFileBrowserWindowId;
    }

    setForFileBrowserWidgetKey = (newKey: string) => {
        this.forFileBrowserWidgetKey = newKey;
    }

    getForFileBrowserWidgetKey = () => {
        return this.forFileBrowserWidgetKey;
    }

    // ------------------------- hash ----------------------------
    /**
     * Calculate hash for this display window based on file name and macros.<br>
     * 
     * If this file name is "", the hash is a random uuid. <br>
     * 
     * When the file name or macros is changed, update the hash.
     */
    static calcHash = (fullTdlFileName: string, macros: [string, string][]) => {
        if (fullTdlFileName === "") {
            return uuidv4();
        } else {
            return fullTdlFileName + JSON.stringify(macros);
        }
    }

    updateHash = () => {
        this.setHash(DisplayWindowAgent.calcHash(this._tdlFileName, this._macros));
    }


    setHash = (newHash: string) => {
        this._hash = newHash;
    }

    _hash: string = uuidv4();

    getHash = () => {
        return this._hash;
    }

    // --------------------------- editable and reloadable ---------------------------

    isEditable = () => {
        return this._editable;
    }
    isReloadable = () => {
        return this._reloadable;
    }

    setEditable = (editable: boolean) => {
        this._editable = editable;
        this.getContextMenu().updateEditable();
    }
    setReloadable = (reloadable: boolean) => {
        this._reloadable = reloadable;
        this.getContextMenu().updateReloadable();
    }

    isModified = () => {
        return this._modified;
    }

    setModified = (newStatus: boolean) => {
        this._modified = newStatus;
    }

    isUtilityWindow = () => {
        return this._isUtilityWindow;
    }

    setIsUtilityWindow = (newValue: boolean) => {
        this._isUtilityWindow = newValue;
    }




    // ---------------------- process info ---------------------------
    getProcessInfo = async (withThumbnail: boolean) => {
        const visible = (this.getWindowAgentsManager().preloadedDisplayWindowAgent === this
            // || this.getWindowAgentsManager().preloadedEmbeddedDisplayAgent === this
        ) ? "No" : "Yes";

        const webContents = this.getWebContents();
        let pid = -1;
        if (webContents !== undefined) {
            pid = webContents.getOSProcessId();
        }

        let usage = {
            "CPU usage [%]": -1,
            "Memory usage [MB]": -1,
            "Uptime [s]": -1,
        }
        if (pid !== -1) {
            usage = await new Promise<{
                "CPU usage [%]": number,
                "Memory usage [MB]": number,
                "Uptime [s]": number,
            }>((resolve, reject) => {
                pidusage(pid, (err: any, stats: any) => {
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
        }


        // embedded display is webpage-like, cannot be edited, not in the scope of electron.js renderer process system
        const result = {
            "Type": "Display Window",
            "Window ID": this.getId(),
            "Visible": visible,
            "TDL file name": this.getTdlFileName(),
            "Window name": this.getWindowName(),
            "Editable": this.isEditable() === true ? "Yes" : "No",
            "Uptime [second]": usage["Uptime [s]"],
            "Process ID": pid,
            "CPU usage [%]": usage["CPU usage [%]"],
            "Memory usage [MB]": usage["Memory usage [MB]"],
            "Thumbnail": withThumbnail ? this.getThumbnail() : "",
            "Script": this.windowAttachedScriptName,
            "Script PID": this.windowAttachedScriptPid === undefined ? "N/A" : `${this.windowAttachedScriptPid}`,
        };
        return result;
    }


}
