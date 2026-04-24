console.log(`[${Math.round(performance.now())}]`, "[INFO]\n  ", "Start to load modules.")

import ReactDOM from "react-dom/client";
import { g_widgets1, getBasePath } from "../../../rendererProcess/global/GlobalVariables";
import { Canvas } from "../../../rendererProcess/helperWidgets/Canvas/Canvas";
import { IpcManagerOnDisplayWindow } from "./IpcManagerOnDisplayWindow";
import { FontsData } from "../../../rendererProcess/global/FontsData";
import { Keyboard } from "../../../rendererProcess/keyboard/Keyboard";
import { ActionHistory } from "../../../rendererProcess/history/ActionHistory";
import { VideoRecorder } from "../../../rendererProcess/helperWidgets/VideoRecorder/VideoRecorder";
import { Log, type_log_levels } from "../../../common/Log";
import { ContextMenu } from "./ContextMenu";
import { PromptOnDisplayWindow } from "../../../rendererProcess/helperWidgets/Prompt/PromptOnDisplayWindow";

// this path is the path inside src/when webpack transpiles this tsx file
// so we cannot use "../../../webpack/resources/...", but using the path in `src/`
import '../../../common/resources/css/katex.min.css'

// there is no typescrit def for this lib, I created a wrapper at dom-to-image-more.d.ts
import { toBlob } from "dom-to-image-more";
import { ChannelNameHint } from "../../../rendererProcess/helperWidgets/ChannelNameHint/ChannelNameHint";
import { SymbolGallery } from "../../helperWidgets/SymbolGallery/SymbolGallery";
import { disableImageDragging } from "../../global/disableImageDragging";
import { DisplayWindowFile } from "./DisplayWindowFile";
import { DisplayWindowEvent } from "./DisplayWindowEvent";

console.log(`[${Math.round(performance.now())}]`, "[INFO]\n  ", "Finished loading modules.")

/**
 * . <br>
 * └── DisplayWindowClient <br>
 *     ├── IpcManager <br>
 *     ├── Root <br>
 *     │   └── Widgets (g_widgets1) <br>
 *     │       ├── Widget <br>
 *     │       └── WidgetSidebar <br>
 *     └── window_title <br>
 *
 * The DisplayWindowClient corresponds to the renderer window. <br>
 *
 * The IpcManager is responsible for receving the messages from main process, i.e. IpcManagerOnMainProcess. <br>
 *
 * The window_title is the window title. <br>
 *
 * Each Root has a lifecycle of the tdl file. If the tdl file is loaded/reloaded, the Root object must
 * be created/re-created. The Widgets object is for all the widgets. Each Widget has a widget body and
 * a sidebar. <br>
 *
 */
export class DisplayWindowClient {
    private _windowId: string = "";
    // full path of the tdl file
    private _tdlFileName: string = "";
    private _root: ReactDOM.Root;
    private _windowTitleType: "file-name" | "window-name" | "uuid";
    private _ipcManager: IpcManagerOnDisplayWindow;
    private _keyboard: Keyboard;
    private _actionHistory: ActionHistory;
    private _videoRecorder: VideoRecorder;
    private _site: string = "";

    private _profileContents: Record<string, any> = {};


    private _processId: string = "";

    private _webGlSupported: boolean = false;

    private _contextMenu: ContextMenu;

    private _hostname: string = "127.0.0.1";

    private _prompt: PromptOnDisplayWindow;
    private _symbolGallery: SymbolGallery;
    private _channelNameHint: ChannelNameHint;

    private _displayWindowFile: DisplayWindowFile;
    private _displayWindowEvent: DisplayWindowEvent;

    constructor(displayWindowId: string, ipcServerPort: number | undefined, hostname: string | undefined = undefined) {
        // set log level
        Log.setLogLevel(type_log_levels.info);
        disableImageDragging();

        Log.debug("Start to create DisplayWindowClient object");
        this._loadCustomFonts();
        // do it first
        this.setWindowId(displayWindowId);

        // in web mode, the server does not provide the ipcServerPort, the websocket server
        // uses the https port (default 443)
        if (this.getMainProcessMode() === "web") {
            // websocket port is same as http port
            const httpPort = parseInt(window.location.port);
            ipcServerPort = httpPort;
        } else {
            // in desktop, ssh-server, ssh-client modes, there must be an ipcServerPort
            if (ipcServerPort === -1 || ipcServerPort === undefined || isNaN(ipcServerPort)) {
                throw new Error(`Failed to obatain the ipcServerPort, ${ipcServerPort}`);
            }
        }

        this._ipcManager = new IpcManagerOnDisplayWindow(this, ipcServerPort);
        this._ipcManager.connectIpcServer();

        this._root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
        this._windowTitleType = "window-name";
        this._keyboard = new Keyboard(this);
        this._actionHistory = new ActionHistory(this);
        this._videoRecorder = new VideoRecorder(this);

        this._contextMenu = new ContextMenu(this);

        this.getIpcManager().startToListen();
        this.getIpcManager().startToListenDragAndDrop();
        this.getKeyboard().startToListen();

        this._prompt = new PromptOnDisplayWindow(this);
        this._symbolGallery = new SymbolGallery(this);
        this._channelNameHint = new ChannelNameHint();

        if (hostname === undefined) {
            this._hostname = "127.0.0.1";
        } else {
            this._hostname = hostname;
        }

        this.checkWebGLSupported();


        // if there is a `nav` parameter, remove it, it is for preventing refresh/back/forward
        const url = new URL(window.location.href);
        url.searchParams.delete("nav");
        history.replaceState(null, "", url.toString());

        this._displayWindowFile = new DisplayWindowFile(this);
        this._displayWindowEvent = new DisplayWindowEvent(this);
        this._displayWindowEvent.startToListenMouseEvents();

        Log.debug("Finished creating DisplayWindowClient object");
    }

    // ---------------------- window ----------------------------



    moveWindow = (dx: number, dy: number) => {
        this.getIpcManager().sendFromRendererProcess("move-window", {
            displayWindowId: this.getWindowId(),
            dx: dx,
            dy: dy,
        })
    }


    /**
     * Window title is stored in Canvas <br>
     * 
     * Priority: current window title type > window-name > file-name > uuid
     */
    updateWindowTitle = () => {

        let hostname = this.getHostname();
        if (hostname === "127.0.0.1") {
            hostname = "";
        } else {
            hostname = `${hostname}:`;
        }

        const canvas = g_widgets1.getWidget2("Canvas") as Canvas;
        if (canvas === undefined) {
            return;
        }
        const windowName = canvas.getWindowName();
        const windowTitleType = this.getWindowTitleType();
        const modified = this.getActionHistory().getModified() === true ? " [Modified]" : "";
        let titleContents = "";

        if (windowTitleType === "window-name") {
            if (windowName === "") {
                titleContents = `[Empty window name]${modified}`
            } else {
                titleContents = `${windowName}${modified}`
            }
            // replace with macros
            const canvas = g_widgets1.getWidget2("Canvas");
            if (canvas instanceof Canvas) {
                const macros = canvas.getAllMacros();
                for (let macro of macros) {
                    const name = macro[0];
                    const value = macro[1];
                    titleContents = titleContents.replaceAll("${" + name + "}", value).replaceAll("$(" + name + ")", value).replaceAll(`"`, "");
                }
            }
        } else if (windowTitleType === "file-name") {
            if (this.getTdlFileName() === "") {
                titleContents = `[Empty file name]${modified}`
            } else {
                titleContents = `${this.getTdlFileName()}${modified}`
            }
        } else if (windowTitleType === "uuid") {
            titleContents = `${this.getWindowId()}${modified}`;
        } else {
            Log.error("Winow title type cannot be", windowTitleType);
        }

        titleContents = `${hostname}${titleContents}`

        if (this.getMainProcessMode() === "desktop") {
            this.getIpcManager().sendFromRendererProcess("set-window-title",
                {
                    windowId: this.getWindowId(),
                    newTitle: titleContents,
                    modified: modified
                }
            );
        } else {
            document.title = titleContents;
        }

        // update url by adding file name in browser address bar
        if (this.getMainProcessMode() === "web") {
            // const currentSite = `https://${window.location.host}/`;
            // const currentSite = `${window.location.origin}/`;
            const httpScheme = window.location.protocol;
            const webPath = this.getWebPath();
            const newUrl = `${httpScheme}//${webPath}/DisplayWindow.html?displayWindowId=${this.getWindowId()}&file=${this.getTdlFileName()}`;
            window.history.replaceState({}, '', newUrl);
        }
    };

    /**
     * file-name --> uuid --> window-name
     */
    toggleWindowTitle = () => {
        const canvas = g_widgets1.getWidget2("Canvas") as Canvas;
        if (canvas === undefined) {
            return;
        }

        if (this.getWindowTitleType() === "file-name") {
            this.setWindowTitleType("uuid");
        } else if (this.getWindowTitleType() === "uuid") {
            this.setWindowTitleType("window-name");
        } else if (this.getWindowTitleType() === "window-name") {
            this.setWindowTitleType("file-name");
        } else {
            this.setWindowTitleType("uuid");
        }
        this.updateWindowTitle();
    };

    getWindowTitleType = (): "file-name" | "window-name" | "uuid" => {
        return this._windowTitleType;
    };
    setWindowTitleType = (newType: "file-name" | "window-name" | "uuid") => {
        this._windowTitleType = newType;
    };

    /**
     * Print from renderer process or web browser
     */
    print = () => {
        window.print();
    }

    takeScreenshot = async () => {
        if (this.getMainProcessMode() !== "web") {
            return;
        }
        try {
            const blob = await toBlob(document.body);
            if (blob !== null) {
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({
                            'image/png': blob
                        })
                    ]);
                } catch (err) {
                    Log.error('Error copying to clipboard:', err);
                }
            }
        } catch (err) {
            Log.error('Error capturing screenshot:', err);
        }
    }

    // -------------------- context menu -------------------------

    /**
     * Callback when we click right button. Show context menu. <br>
     *
     * It sends the necessary info, including renderer window status, window ID and right click location to main
     * process. The main process handles the rest. <br>
     *
     * The click could be on either one or more widget or Canvas.
     * The display window status could be in editing mode or operating mode.
     *
     * @param {string} widgetKey The widget key where the right click occurs.
     */
    showContextMenu = (widgetKey: string, [x, y]: [number, number], options: Record<string, any> = {}) => {
        if (g_widgets1 !== undefined) {
            g_widgets1.setContextMenuCursorPosition(x, y);
        }
        this.getContextMenu().show(widgetKey, [x, y], options);
    };

    inPageContextMenu: HTMLDivElement | undefined = undefined;

    // --------------------------- custom fonts ------------------------------------
    private _loadCustomFonts = () => {
        for (let font of Object.values(FontsData.g_fonts)) {
            for (let fontFace of Object.values(font)) {
                fontFace.load().then(() => {
                    document.fonts.add(fontFace);
                }).catch((reason: any) => {
                    Log.error(reason)
                });
            }
        }
    };

    // ------------------------ getters and setters --------------------------------

    getDisplayWindowFile = () => {
        return this._displayWindowFile;
    }

    getDisplayWindowEvent = () => {
        return this._displayWindowEvent;
    }

    getRoot = () => {
        return this._root;
    };

    setRoot = (newRoot: ReactDOM.Root) => {
        this._root = newRoot;
    };

    getWindowId = () => {
        return this._windowId;
    };

    /**
     * Set _windowId (e.g. "1-22") and processId (e.g. 1). The processId is contained in window ID
     */
    setWindowId = (newId: string) => {
        this._windowId = newId;
        // process ID, part of display window
        const newIdArray = newId.split("-");
        if (newIdArray.length === 2) {
            if (this.getProcessId() === "") {
                this.setProcessId(newIdArray[0]);
            }
        }
    };

    getIpcManager = () => {
        return this._ipcManager;
    };

    getTdlFileName = () => {
        return this._tdlFileName;
    };

    setTdlFileName = (newName: string) => {
        this._tdlFileName = newName;
    };

    getKeyboard = () => {
        return this._keyboard;
    };

    getActionHistory = () => {
        return this._actionHistory;
    };

    getVideoRecorder = () => {
        return this._videoRecorder;
    };

    getProcessId = () => {
        return this._processId;
    };
    setProcessId = (newId: string) => {
        this._processId = newId;
    };

    getMainProcessMode = (): "desktop" | "web" | "ssh-client" => {
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.indexOf(' electron/') > -1) {
            if (this.getHostname() === "127.0.0.1") {
                return "desktop"
            } else {
                return "ssh-client";
            }
        } else {
            return "web"
        }
    }

    getOsType = () => {
        const platform = navigator.platform.toLowerCase();
        // keep the same as os.platform()
        if (platform.includes('win')) return 'win32';
        if (platform.includes('mac')) return 'darwin';
        if (platform.includes('linux')) return 'linux';
        return "unknown";
    }

    getContextMenu = () => {
        return this._contextMenu;
    }

    getHostname = () => {
        return this._hostname;
    }

    getIsUtilityWindow = () => {
        if (g_widgets1 === undefined) {
            return false;
        }
        const canvas = g_widgets1.getWidget("Canvas");
        if (!(canvas instanceof Canvas)) {
            return false;
        }
        return canvas.isUtilityWindow();
    }

    getPrompt = () => {
        return this._prompt;
    }

    getSymbolGallery = () => {
        return this._symbolGallery;
    }

    getProfileContents = () => {
        return this._profileContents
    }

    setProfileContents = (newContents: Record<string, any>) => {
        this._profileContents = newContents;
    }


    getProfileCategory = (categoryName: string) => {
        return this._profileContents[categoryName];
    };

    getProfileEntry = (categoryName: string, entryName: string) => {
        const category = this.getProfileCategory(categoryName);
        if (category !== undefined) {
            const entry = category[entryName];
            if (entry !== undefined) {
                return entry["value"];
            }
        }
        return undefined;
    };

    allowPut = () => {
        const disablePut = this.getProfileEntry("EPICS Custom Environment", "Disable PUT");
        if (`${disablePut}`.toLowerCase() === "yes") {
            return false;
        } else {
            return true;
        }
    }

    getSite = () => {
        return this._site;
    }

    setSite = (newSite: string) => {
        this._site = newSite;
    }


    checkWebGLSupported = () => {
        try {
            const canvas = document.createElement('canvas');
            this._webGlSupported = !!(window.WebGLRenderingContext &&
                (canvas.getContext('webgl') || canvas.getContext('experimental-web-gl')));
        } catch (e) {
            this._webGlSupported = false;
        }
    }

    canUseWebGl = () => {
        return this._webGlSupported;
    }


    setWindowAlwaysOnTop = (state: boolean) => {
        this.getIpcManager().sendFromRendererProcess("set-window-always-on-top", {
            displayWindowId: this.getWindowId(),
            state: state,
        })
    }

    getChannelNameHint = () => {
        return this._channelNameHint;
    }

    generateChannelLookupQuery = (channelNamesStr: string) => {
        const channelFinderAddress = this.getProfileEntry("EPICS Custom Environment", "Channel Lookup Server Address");
        if (channelFinderAddress !== undefined && channelFinderAddress.trim() !== "") {
            const channelNames = channelNamesStr.split(" ");
            const channelNamesObj: Record<string, string> = {};
            for (let ii = 0; ii < channelNames.length; ii++) {
                const channelName = channelNames[ii];
                if (channelName.trim() !== "") {
                    channelNamesObj[`keyword${ii + 1}`] = channelName.trim();
                }
            }
            if (Object.keys(channelNamesObj).length > 0) {
                const params = new URLSearchParams(channelNamesObj);
                return `${channelFinderAddress}/search?${params}`;
            }
        }
        return "";
    }

    /**
     * abc.com/def
     */
    getWebPath = () => {
        const basePath = getBasePath();
        return `${window.location.host}${basePath}`;
    }
}


(window as any).DisplayWindowClientClass = DisplayWindowClient;
