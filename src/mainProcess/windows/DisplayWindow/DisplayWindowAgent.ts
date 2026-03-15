import { type_options_createDisplayWindow, WindowAgentsManager } from "../../windows/WindowAgentsManager";
import { CaChannelAgent } from "../../channel/CaChannelAgent";
import { type_dbrData, Channel_DBR_TYPES, type_LocalChannel_data } from "../../../common/GlobalVariables";
import { LocalChannelAgent } from "../../channel/LocalChannelAgent";
import { WebSocket } from "ws";
import { v4 as uuidv4 } from "uuid";
import { Promises, type_pva_status, type_pva_value } from "epics-tca";
import { IpcEventArgType2 } from "../../../common/IpcEventArgType";
import { DisplayWindowAttachedScript } from "./DisplayWindowAttachedScript";
import { DisplayWindowChannel } from "./DisplayWindowChannel";
import { DisplayWindowChannelsManager } from "./DisplayWindowChannelsManager";
import { DisplayWindowEmbeddedDisplay } from "./DisplayWindowEmbeddedDisplay";
import { DisplayWindowFile } from "./DisplayWindowFile";
import { DisplayWindowFileBrowser } from "./DisplayWindowFileBrowser";
import { DisplayWindowIpc } from "./DisplayWindowIpc";
import { DisplayWindowLifeCycleManager } from "./DisplayWindowLifeCycleManager";
import { DisplayWindowTerminal } from "./DisplayWindowTerminal";
import { DisplayWindowTextEditor } from "./DisplayWindowTextEditor";
import { DisplayWindowUtilities } from "./DisplayWindowUtilities";

/**
 * Owns the main-process state and coordination for a single display window.
 *
 * A `DisplayWindowAgent` is created when the application opens a display and
 * stays alive for as long as that window exists. It holds the window's TDL,
 * runtime options, macros, editability flags, and helper managers, and it
 * coordinates the work that has to happen on the main-process side while the
 * renderer is running.
 *
 * Its lifecycle matches the lifecycle of the display window it represents.
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
     * Manager of this agent
     */
    private _windowAgentsManager: WindowAgentsManager;

    /**
     * External macros and other options. The internal macros are defined in tdl file.
     */
    private readonly _options: Record<string, any>;

    private _modified: boolean = false;

    private forFileBrowserWindowId: string = '';
    private forFileBrowserWidgetKey: string = '';

    private readonly _displayWindowAttachedScript: DisplayWindowAttachedScript;

    private readonly _displayWindowChannel: DisplayWindowChannel;

    private readonly _displayWindowEmbeddedDisplay: DisplayWindowEmbeddedDisplay;

    private readonly _displayWindowFile: DisplayWindowFile;

    private readonly _displayWindowFileBrowser: DisplayWindowFileBrowser;

    private readonly _displayWindowIpc: DisplayWindowIpc;

    private readonly _displayWindowChannelsManager: DisplayWindowChannelsManager;

    private readonly _displayWindowLifeCycleManager: DisplayWindowLifeCycleManager;

    private readonly _displayWindowTerminal: DisplayWindowTerminal;

    private readonly _displayWindowTextEditor: DisplayWindowTextEditor;

    private readonly _displayWindowUtilities: DisplayWindowUtilities;

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

    // private _mainProcessId: string;

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
    _hash: string = uuidv4();

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
        this._displayWindowLifeCycleManager = new DisplayWindowLifeCycleManager(this);
        this.hiddenWindow = options["hide"];
        this._displayWindowAttachedScript = new DisplayWindowAttachedScript(this);
        this._displayWindowChannel = new DisplayWindowChannel(this);
        this._displayWindowEmbeddedDisplay = new DisplayWindowEmbeddedDisplay(this);
        this._displayWindowFile = new DisplayWindowFile(this);
        this._displayWindowFileBrowser = new DisplayWindowFileBrowser(this);
        this._displayWindowIpc = new DisplayWindowIpc(this);
        this._displayWindowChannelsManager = new DisplayWindowChannelsManager(this);
        this._displayWindowTerminal = new DisplayWindowTerminal(this);
        this._displayWindowTextEditor = new DisplayWindowTextEditor(this);
        this._displayWindowUtilities = new DisplayWindowUtilities(this);
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

    // --------------------- options ------------------

    getInitialMode = () => {
        return this._initialMode;
    };

    setInitialMode = (newMode: "operating" | "editing") => {
        this._initialMode = newMode;
    }

    getReplaceMacros = () => {
        return this._replaceMacros;
    };


    setReplaceMacros = (replace: boolean) => {
        this._replaceMacros = replace;
    };

    getUtilityType = () => {
        return this._utilityType;
    };

    setUtilityType = (newType: string | undefined) => {
        this._utilityType = newType;
    };

    getUtilityOptions = () => {
        return this._utilityOptions;
    };

    setUtilityOptions = (newOptions: Record<string, any> | undefined) => {
        this._utilityOptions = newOptions;
    };

    // --------------------- embedded display ---------

    getBoundValues = () => {
        return this._boundValues;
    };

    setBoundValues = (newValues: { x: number; y: number; width: number; height: number }) => {
        this._boundValues = structuredClone(newValues);
    };

    setIsWebpage = () => {
        this._isWebpage = true;
    };

    isWebpage = () => {
        return this._isWebpage;
    };

    // --------------------- attached script ----------

    createWebSocketClientThread = (port: number, script: string) => {
        this.getDisplayWindowAttachedScript().createWebSocketClientThread(port, script);
    };

    terminateWebSocketClientThread = () => {
        this.getDisplayWindowAttachedScript().terminateWebSocketClientThread();
    };

    // --------------------- web socket monitor ------

    setWebSocketMonitorClient = (webSocketMonitorClient: WebSocket | undefined) => {
        this.getDisplayWindowIpc().setWebSocketMonitorClient(webSocketMonitorClient);
    };

    getWebSocketMonitorClient = () => {
        return this.getDisplayWindowIpc().getWebSocketMonitorClient();
    };

    getWebSocketMonitorChannelNames = () => {
        return this.getDisplayWindowIpc().getWebSocketMonitorChannelNames();
    };

    setWebSocketMonitorChannelNames = (newNames: string[]) => {
        this.getDisplayWindowIpc().setWebSocketMonitorChannelNames(newNames);
    };

    addWebSocketMonitorChannelName = (newName: string) => {
        this.getDisplayWindowIpc().addWebSocketMonitorChannelName(newName);
    };

    removeWebSocketMonitorChannels = () => {
        this.getDisplayWindowIpc().removeWebSocketMonitorChannels();
    };

    // --------------------- channels -----------------

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

    getChannelAgents = () => {
        return this.getDisplayWindowChannelsManager().getChannelAgents();
    };

    getChannelAgent = (channelName: string) => {
        return this.getDisplayWindowChannelsManager().getChannelAgent(channelName);
    };

    // getChannelAgentsManager = () => {
    // 	const windowAgentsManager = this.getWindowAgentsManager();
    // 	const mainProcess = windowAgentsManager.getMainProcess();
    // 	return mainProcess.getChannelAgentsManager();
    // };

    checkChannelsState = () => {
        this.getDisplayWindowChannelsManager().checkChannelsState();
    };

    // --------------------- context menu --------------

    showContextMenu = (mode: string, widgetKeys: string[], options: Record<string, any>) => {
        this.getDisplayWindowUtilities().showContextMenu(mode, widgetKeys, options);
    };

    showContextMenuSidebar = (mode: string, widgetKeys: string[], options: Record<string, any>) => {
        this.getDisplayWindowUtilities().showContextMenuSidebar(mode, widgetKeys, options);
    };

    getContextMenu = () => {
        return this.getDisplayWindowUtilities().getContextMenu();
    };

    // --------------------- utilities ----------------

    printToPdf = async () => {
        await this.getDisplayWindowUtilities().printToPdf();
    };

    showNotification = (info: IpcEventArgType2["dialog-show-message-box"]["info"]): void => {
        this.getDisplayWindowUtilities().showNotification(info);
    };

    showInputBox = (info: IpcEventArgType2["dialog-show-input-box"]["info"]): void => {
        this.getDisplayWindowUtilities().showInputBox(info);
    };

    showError = (
        humanReadableMessages: string[],
        rawMessages: string[] = [],
        extraInfo: Omit<Partial<IpcEventArgType2["dialog-show-message-box"]["info"]>, "messageType" | "humanReadableMessages" | "rawMessages"> = {},
    ): void => {
        this.getDisplayWindowUtilities().showError(humanReadableMessages, rawMessages, extraInfo);
    };

    showInfo = (
        humanReadableMessages: string[],
        rawMessages: string[] = [],
        extraInfo: Omit<Partial<IpcEventArgType2["dialog-show-message-box"]["info"]>, "messageType" | "humanReadableMessages" | "rawMessages"> = {},
    ): void => {
        this.getDisplayWindowUtilities().showInfo(humanReadableMessages, rawMessages, extraInfo);
    };

    showWarning = (
        humanReadableMessages: string[],
        rawMessages: string[] = [],
        extraInfo: Omit<Partial<IpcEventArgType2["dialog-show-message-box"]["info"]>, "messageType" | "humanReadableMessages" | "rawMessages"> = {},
    ): void => {
        this.getDisplayWindowUtilities().showWarning(humanReadableMessages, rawMessages, extraInfo);
    };

    takeScreenshot = () => {
        this.getDisplayWindowUtilities().takeScreenshot();
    };

    takeScreenshotToFolder = () => {
        this.getDisplayWindowUtilities().takeScreenshotToFolder();
    };

    takeScreenshotToClipboard = () => {
        this.getDisplayWindowUtilities().takeScreenshotToClipboard();
    };

    updateThumbnail = (
        displayWindowId: string,
        imageBase64: string | undefined,
        windowName: string | undefined = undefined,
        tdlFileName: string | undefined = undefined
    ) => {
        this.getDisplayWindowUtilities().updateThumbnail(displayWindowId, imageBase64, windowName, tdlFileName);
    };

    removeThumbnail = (displayWindowId: string) => {
        this.getDisplayWindowUtilities().removeThumbnail(displayWindowId);
    };

    getThumbnail = () => {
        return this.getDisplayWindowUtilities().getThumbnail();
    };

    takeThumbnail = async (windowName: string | undefined = undefined, tdlFileName: string | undefined = undefined) => {
        await this.getDisplayWindowUtilities().takeThumbnail(windowName, tdlFileName);
    };

    startThumbnailInterval = () => {
        this.getDisplayWindowUtilities().startThumbnailInterval();
    };

    stopThumbnailInterval = () => {
        this.getDisplayWindowUtilities().stopThumbnailInterval();
    };

    print = () => {
        this.getDisplayWindowUtilities().print();
    };

    showAboutTdm = () => {
        this.getDisplayWindowUtilities().showAboutTdm();
    };

    getZoomFactor = (): number => {
        return this.getDisplayWindowUtilities().getZoomFactor();
    };

    setZoomFactor = (level: number) => {
        this.getDisplayWindowUtilities().setZoomFactor(level);
    };

    startRecordVideo = () => {
        this.getDisplayWindowUtilities().startRecordVideo();
    };

    getProcessInfo = async (withThumbnail: boolean) => {
        return await this.getDisplayWindowUtilities().getProcessInfo(withThumbnail);
    };

    // ---------------------- IPC ----------------------

    /**
     * send a message from main process IPC websocket server to renderer process websocket client
     * 
     * It is invoked by Logs.sendToLogViewers(), we have to temporarily disable the log mechanism 
     * to avoid stack overflow. In this case, we only send the message out to the renderer process.
    */

    sendFromMainProcess = <T extends keyof IpcEventArgType2>(channel: T, arg: IpcEventArgType2[T]): void => {
        this.getDisplayWindowIpc().sendFromMainProcess(channel, arg);
    };

    // --------------------- window lifecycle ---------

    createBrowserWindow = async (options: any = undefined) => {
        await this.getDisplayWindowLifeCycleManager().createBrowserWindow(options);
    };

    createWebBrowserWindow = async (url: string) => {
        await this.getDisplayWindowLifeCycleManager().createWebBrowserWindow(url);
    };

    handleWindowClose = () => {
        this.getDisplayWindowLifeCycleManager().handleWindowClose();
    };

    handleWindowClosed = () => {
        this.getDisplayWindowLifeCycleManager().handleWindowClosed();
    };

    // --------------------- window visibility --------

    /**
     * Bring up to front
     */
    show = () => {
        this.getDisplayWindowLifeCycleManager().show();
    };

    focus = () => {
        this.getDisplayWindowLifeCycleManager().focus();
    };

    close = () => {
        this.getDisplayWindowLifeCycleManager().close();
    };

    // --------------------- display data --------------

    getTdl = (): Record<string, any> => {
        return this._tdl;
    };

    setTdl = (newTdl: Record<string, any>) => {
        this._tdl = newTdl;
    };

    getTdlFileName = () => {
        return this._tdlFileName;
    };

    /**
     * set tdl file name, and update hash
     */
    setTdlFileName = (newFileName: string) => {
        this._tdlFileName = newFileName;
        this.updateHash();
    };

    getMacros = () => {
        return this._macros;
    };

    /**
     * set new macros (hard copy), and update hash.
     */
    setMacros = (newMacros: [string, string][]) => {
        this._macros = structuredClone(newMacros);
        this.updateHash();
    };

    getId = () => {
        return this._id;
    };

    getWindowName = () => {
        return this._windowName;
    };

    setWindowName = (newName: string) => {
        this._windowName = newName;
    };

    // --------------------- browser state ------------

    getBrowserWindow = () => {
        return this.getDisplayWindowLifeCycleManager().getBrowserWindow();
    };

    setBrowserWindow = (newBrowserWindow: any) => {
        this.getDisplayWindowLifeCycleManager().setBrowserWindow(newBrowserWindow);
    };

    /**
     * This window is hidden. It is changed to false by this.show()
     */
    get hiddenWindow(): boolean {
        return this.getDisplayWindowLifeCycleManager().isHiddenWindow();
    }

    set hiddenWindow(newHiddenWindow: boolean) {
        this.getDisplayWindowLifeCycleManager().setHiddenWindow(newHiddenWindow);
    }

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
    };

    getForFileBrowserWindowId = () => {
        return this.forFileBrowserWindowId;
    };

    setForFileBrowserWidgetKey = (newKey: string) => {
        this.forFileBrowserWidgetKey = newKey;
    };

    getForFileBrowserWidgetKey = () => {
        return this.forFileBrowserWidgetKey;
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

    // --------------------- state flags --------------

    isEditable = () => {
        return this._editable;
    };

    isReloadable = () => {
        return this._reloadable;
    };

    setEditable = (editable: boolean) => {
        this._editable = editable;
        this.getContextMenu().updateEditable();
    };

    setReloadable = (reloadable: boolean) => {
        this._reloadable = reloadable;
        this.getContextMenu().updateReloadable();
    };

    isModified = () => {
        return this._modified;
    };

    setModified = (newStatus: boolean) => {
        this._modified = newStatus;
    };

    isUtilityWindow = () => {
        return this._isUtilityWindow;
    };

    setIsUtilityWindow = (newValue: boolean) => {
        this._isUtilityWindow = newValue;
    };

    // --------------------- managers ------------------

    getWindowAgentsManager = () => {
        return this._windowAgentsManager;
    };

    getDisplayWindowFile = () => {
        return this._displayWindowFile;
    };

    getDisplayWindowFileBrowser = () => {
        return this._displayWindowFileBrowser;
    };

    getDisplayWindowIpc = () => {
        return this._displayWindowIpc;
    };

    getDisplayWindowChannelsManager = () => {
        return this._displayWindowChannelsManager;
    };

    getDisplayWindowAttachedScript = () => {
        return this._displayWindowAttachedScript;
    };

    getDisplayWindowChannel = () => {
        return this._displayWindowChannel;
    };

    getDisplayWindowEmbeddedDisplay = () => {
        return this._displayWindowEmbeddedDisplay;
    };

    getDisplayWindowLifeCycleManager = () => {
        return this._displayWindowLifeCycleManager;
    };

    getDisplayWindowTerminal = () => {
        return this._displayWindowTerminal;
    };

    getDisplayWindowTextEditor = () => {
        return this._displayWindowTextEditor;
    };

    getDisplayWindowUtilities = () => {
        return this._displayWindowUtilities;
    };

    // --------------------- hash ----------------------

    updateHash = () => {
        this.setHash(DisplayWindowUtilities.calcHash(this._tdlFileName, this._macros));
    };

    setHash = (newHash: string) => {
        this._hash = newHash;
    };

    getHash = () => {
        return this._hash;
    };
}
