console.log(`[${Math.round(performance.now())}]`, "[INFO]\n  ", "Start to load modules.")

import ReactDOM from "react-dom/client";
import { getMouseEventClientX, getMouseEventClientY, g_widgets1, GlobalVariables } from "../../../rendererProcess/global/GlobalVariables";
import { Canvas } from "../../../rendererProcess/helperWidgets/Canvas/Canvas";
import { IpcManagerOnDisplayWindow } from "./IpcManagerOnDisplayWindow";
import { type_tdl } from "../../file/FileReader";
import { rendererWindowStatus } from "../../../rendererProcess/global/Widgets";
import { DataViewer } from "../../../rendererProcess/widgets/DataViewer/DataViewer";
import { PvTable } from "../../../rendererProcess/widgets/PvTable/PvTable";
import { ProfilesViewer } from "../../../rendererProcess/widgets/ProfilesViewer/ProfilesViewer";
import { Root } from "../../../rendererProcess/helperWidgets/Root/Root";
import { Probe } from "../../../rendererProcess/widgets/Probe/Probe";
import { FontsData } from "../../../rendererProcess/global/FontsData";
import { Keyboard } from "../../../rendererProcess/keyboard/Keyboard";
import { TdlViewer } from "../../../rendererProcess/widgets/TdlViewer/TdlViewer";
import { ActionHistory } from "../../../rendererProcess/history/ActionHistory";
import { BaseWidget } from "../../../rendererProcess/widgets/BaseWidget/BaseWidget";
import { VideoRecorder } from "../../../rendererProcess/helperWidgets/VideoRecorder/VideoRecorder";
import { XYPlot } from "../../../rendererProcess/widgets/XYPlot/XYPlot";
import { Terminal } from "../../../rendererProcess/widgets/Terminal/Terminal";
import { Calculator } from "../../../rendererProcess/widgets/Calculator/Calculator";
import { ChannelGraph } from "../../../rendererProcess/widgets/ChannelGraph/ChannelGraph";
import { Log, type_log_levels } from "../../log/Log";
import { LogViewer } from "../../../rendererProcess/widgets/LogViewer/LogViewer";
import { ContextMenu } from "./ContextMenu";
import { PromptOnDisplayWindow } from "../../../rendererProcess/helperWidgets/Prompt/PromptOnDisplayWindow";
import { TextEntry } from "../../../rendererProcess/widgets/TextEntry/TextEntry";
import { CaSnooper } from "../../../rendererProcess/widgets/CaSnooper/CaSnooper";
import { TextUpdate } from "../../../rendererProcess/widgets/TextUpdate/TextUpdate";
import { PvMonitor } from "../../../rendererProcess/widgets/PvMonitor/PvMonitor";
import { Casw } from "../../../rendererProcess/widgets/Casw/Casw";
import { TextEditor } from "../../../rendererProcess/widgets/TextEditor/TextEditor";
import html2canvas from "html2canvas";
import { convertEpochTimeToString } from "../../../rendererProcess/global/GlobalMethods";
import { FileConverter } from "../../../rendererProcess/widgets/FileConverter/FileConverter";
import path from "path";

import '../../resources/css/katex.min.css';
import { Talhk } from "../../../rendererProcess/widgets/Talhk/Talhk";
import { FileBrowser } from "../../../rendererProcess/widgets/FileBrowser/FileBrowser";
import { SeqGraph } from "../../../rendererProcess/widgets/SeqGraph/SeqGraph";
// import '../../resources/css/simple.css';


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

    private _textEditorModified: boolean = false;

    constructor(displayWindowId: string, ipcServerPort: number | undefined, hostname: string | undefined = undefined) {
        // set log level
        Log.setLogLevel(type_log_levels.info);

        Log.debug("Start to create DisplayWindowClient object");
        this._loadCustomFonts();
        // do it first
        this.setWindowId(displayWindowId);

        // in web mode, the server does not provide the ipcServerPort, the websocket server
        // uses the https port (default 443)
        if (this.getMainProcessMode() === "web") {
            const host = window.location.host;
            if (ipcServerPort === -1 || ipcServerPort === undefined || isNaN(ipcServerPort)) {
                ipcServerPort = parseInt(host.split(":")[1]);
            }
            // we may be using the default https port
            if (isNaN(ipcServerPort)) {
                ipcServerPort = 443;
            }
        } else {
            // in desktop, ssh-server, ssh-client modes, there must be an ipcServerPort
            if (ipcServerPort === -1 || ipcServerPort === undefined || isNaN(ipcServerPort)) {
                throw new Error(`Failed to obatain the ipcServerPort, ${ipcServerPort}`);
            }
        }

        this._ipcManager = new IpcManagerOnDisplayWindow(this, ipcServerPort);

        // web mode refresh
        if (this.getMainProcessMode() === "web") {
            // we use displayWindowId to identify the web mode sessionStorage
            // because iframe shares the same sessionStorage, after the parent page is loaded
            // the iframe page uses the parent's session storage to initialize, which may
            // cause infinite loop. We use this trick that whenever the sessionStorage.displayWindowId is 
            // not matched with this window's display ID, we consider it as a freshly opened window
            // in this way, the iframe can be correctly loaded
            // However, the window cannot be properly refreshed. See EmbeddedDisplay.tsx for details
            if (sessionStorage.getItem("displayWindowId") !== this.getWindowId()) {
                sessionStorage.clear();
                sessionStorage.setItem("counter", `0`);
                sessionStorage.setItem("displayWindowId", `${this.getWindowId()}`);
            } else {
                sessionStorage.setItem("counter", `${parseInt(sessionStorage.getItem("counter") as string) + 1}`);
            }
            if (parseInt(sessionStorage.getItem("counter") as string) % 2 === 0) {
                this._ipcManager.connectIpcServer();
            }
            if (parseInt(sessionStorage.getItem("counter") as string) % 2 === 1) {
                this.handlePageRefresh();
            }
        } else {
            this._ipcManager.connectIpcServer();
        }


        this._root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
        this._windowTitleType = "window-name";
        this._keyboard = new Keyboard(this);
        this._actionHistory = new ActionHistory(this);
        this._videoRecorder = new VideoRecorder(this);

        this._contextMenu = new ContextMenu(this);

        this.getIpcManager().startToListen();
        this.getIpcManager().startToListenDragAndDrop();
        this.getKeyboard().startToListen();
        this.startToListenMouseEvents();

        this._prompt = new PromptOnDisplayWindow(this);

        if (hostname === undefined) {
            this._hostname = "127.0.0.1";
        } else {
            this._hostname = hostname;
        }

        this.checkWebGLSupported();

        Log.debug("Finished creating DisplayWindowClient object");
    }


    savePageData = () => {
        // save page data only once
        if (sessionStorage.getItem("pageData") !== null) {
            return;
        }

        const tdlFileName = this.getTdlFileName();
        const mode = g_widgets1.getRendererWindowStatusStr();
        const editable = g_widgets1.getRoot().getEditable();

        const canvas = g_widgets1.getWidget("Canvas") as Canvas;
        const macros = canvas.getAllMacros();

        const replaceMacros = false;

        const currentTdlFolder = path.dirname(tdlFileName);
        const openInSameWindow = true;
        const pageData = {
            tdlFileNames: [tdlFileName],
            mode: mode,
            editable: editable,
            macros: macros,
            replaceMacros: replaceMacros, // not used
            currentTdlFolder: currentTdlFolder,
            openInSameWindow: openInSameWindow,
            windowId: g_widgets1.getRoot().getDisplayWindowClient().getWindowId(),
        };
        sessionStorage.setItem("pageData", JSON.stringify(pageData));
    }

    /**
     * After the window refreshed and the websocket is connected
     */
    handlePageRefresh = async () => {
        const pageDataStr = sessionStorage.getItem("pageData");

        if (this.getMainProcessMode() === "web" && pageDataStr !== null) {
            Log.info("Refresh web page.")
            const currentSite = `https://${window.location.host}/`;
            const pageData = JSON.parse(pageDataStr);

            const response = await this.getIpcManager().sendPostRequestCommand(
                "open-tdl-file", { ...pageData, count: sessionStorage.getItem("counter") }
            )

            const data = await response.json() as any;
            const ipcServerPort = data["ipcServerPort"];
            // it may come back a new display window ID
            const displayWindowId = data["displayWindowId"];
            const href = `${currentSite}DisplayWindow.html?displayWindowId=${displayWindowId}`;
            window.location.href = href;
        }
    }

    moveWindow = (dx: number, dy: number) => {
        this.getIpcManager().sendFromRendererProcess("move-window", {
            displayWindowId: this.getWindowId(),
            dx: dx,
            dy: dy,
        })
    }


    // mid or right button down on the window
    // the left-button down event is handled in each widget in a more efficient way
    startToListenMouseEvents = () => {

        const hasNonEmptyChannelName = (channelNames: string[]) => {
            for (let channelName of channelNames) {
                if (channelName.trim() !== "" && isNaN(parseFloat(channelName))) {
                    return true;
                }
            }
            return false;
        }

        const getFirstNonEmptyChannelName = (channelNames: string[]) => {
            for (let channelName of channelNames) {
                if (channelName.trim() !== "" && isNaN(parseFloat(channelName))) {
                    return channelName;
                }
            }
            return "";
        }

        window.addEventListener("contextmenu", (event: MouseEvent) => {
            // prevent all kinds of default context menus
            if (this.getMainProcessMode() === "web") {
                event.preventDefault();
            }
        })

        /**
         * Move window using mid button
         */
        if (this.getMainProcessMode() === "desktop" && this.isInIframe() === false) {
            window.addEventListener('mousedown', (e) => {

                if ((e.button === 1)) { // middle button

                    // set always on top
                    // this.setWindowAlwaysOnTop(true);

                    const handleMouseMove = (event: MouseEvent) => {
                        // remove the "Channel Name Peek Div"
                        if (g_widgets1 === undefined) {
                            return;
                        }
                        g_widgets1.removeChannelNamePeekDiv();

                        const dx = event.movementX;
                        const dy = event.movementY;
                        this.moveWindow(dx, dy);
                    };

                    const handleMouseUp = () => {
                        console.log("mouse is up")
                        // this.setWindowAlwaysOnTop(false);
                        // cancel always on top
                        window.removeEventListener('mousemove', handleMouseMove);
                        window.removeEventListener('mouseup', handleMouseUp);

                        document.body.removeEventListener('mouseenter', handleMouseUp);
                        document.body.removeEventListener('mouseleave', handleMouseUp);
                    };

                    window.addEventListener('mousemove', handleMouseMove);
                    window.addEventListener('mouseup', handleMouseUp);

                    document.body.addEventListener('mouseenter', handleMouseUp);
                    document.body.addEventListener('mouseleave', handleMouseUp);

                }
            });
        }


        // the right button down in operating mode is handled by this callback function
        // In operating mode, all the mouse events on the readback-type widgets are ignored.
        // We do this for the purpose of allowing widgets stacking on top of each other, while
        // let the write-type widgets controllable even there is a readback-type widget on top of it.
        // However, we still want the right mouse button event, this function is for that purpose.
        // All the right-button-down events are disabled on BaseWidget and Canvas.
        window.addEventListener("mousedown", (event: MouseEvent) => {
            // if this window is inside an iframe, focus this iframe first, so, focus it anyway
            // const thisWindowIsInIframe = window.frameElement !== null;
            window.focus();

            if (event.button !== 1 && event.button !== 2) {
                return;
            }

            if (g_widgets1 === undefined) {
                return;
            }

            if (g_widgets1.isEditing()) {
                return;
            }

            /**
             * In operating mode:
             * 
             * right button down
             *  - penetrate over the widgets, find channel names for each widget, if the first channel
             *    is empty, try to find the next one, if failed, try the next widget. Then show the widget's channel names
             * 
             * right button down:
             *  - always show default context menu: from "Edit Display" to "Help"
             *  - if over <input /> or <textarea /> element, show copy/paste/cut
             *  - if over special element, e.g. "Scaled Slider", show widget-specific option, e.g. "Settings"
             */

            let widgetKeyResult = "";
            const pointerX = getMouseEventClientX(event);
            const pointerY = getMouseEventClientY(event);

            // find the first widget that has at least one channel
            event.preventDefault();

            // intercept the event if on the Prompt element


            let eventElement = event.target;
            const promptElement = document.getElementById(this.getPrompt().getId());

            while (true) {
                if (eventElement === null) {
                    break;
                }
                if (!(eventElement instanceof HTMLElement || eventElement instanceof SVGElement)) {
                    break;
                }
                if (event.button !== 2) {
                    break;
                }
                if (eventElement === promptElement) {
                    const selection = window.getSelection();
                    const textSelected = selection === null ? false : selection.toString().length > 0 ? true : false;
                    const selectedText = selection === null ? undefined : selection.toString();
                    const contextMenuOptions = {
                        textSelected: textSelected,
                        selectedText: selectedText,
                    }
                    this.showContextMenu("Canvas", [event.clientX, event.clientY], contextMenuOptions);
                    return;
                } else if (eventElement.id.startsWith("DataViewerPlot-")) {
                    // right button down on DataViewer Plot region is blocked
                    // it is handled in the widget for pan plot up/down
                    return;
                }
                eventElement = eventElement.parentElement;
            }

            const widgets = [...g_widgets1.getWidgets().values()];
            for (let ii = widgets.length - 1; ii >= 0; ii--) {
                const widget = widgets[ii];
                if (widget instanceof BaseWidget) {
                    if ((this.getIsUtilityWindow() === true)) {
                        // utility window, only one widget, always select it
                        const widgetKey = widget.getWidgetKey();
                        widgetKeyResult = widgetKey;
                        break;
                    } else if (
                        (pointerX >= widget.getStyle()["left"] &&
                            pointerX <= widget.getStyle()["left"] + widget.getStyle()["width"] &&
                            pointerY >= widget.getStyle()["top"] &&
                            pointerY <= widget.getStyle()["top"] + widget.getStyle()["height"])
                    ) {
                        const widgetKey = widget.getWidgetKey();
                        // read and write types widgets are treated the same by mid and right buttons
                        // so that the mid button and Probe show the same PV
                        if (hasNonEmptyChannelName(widget.getChannelNames())
                            || widget instanceof ChannelGraph
                            || widget instanceof PvMonitor
                            || widget instanceof Probe
                        ) {
                            // only when this widget has a channel
                            widgetKeyResult = widgetKey;
                            break;
                        }
                    }
                }
            }

            // for mid button down, we have found a widget that has non-empty channel names
            // show the channel name peek div
            if (event.button === 1) {
                // mid button
                if (widgetKeyResult !== "") {
                    // found a widget
                    // mid button down
                    // prevent focusing the input box, e.g. the TextEntry widget
                    // control key is pressed
                    const widget = g_widgets1.getWidget2(widgetKeyResult);
                    if ((widget instanceof BaseWidget) && !(widget instanceof PvTable)) {
                        const channelNames = widget.getChannelNames();
                        let channelName: string | string[] = getFirstNonEmptyChannelName(channelNames);
                        // copy all channel names for XYPlot, it does not have rule
                        if (widget instanceof XYPlot) {
                            channelName = channelNames;
                        }

                        // the window ID for virtual PV is annoying
                        if (typeof channelName === "string") {
                            if (channelName.includes("@")) {
                                channelName = channelName.split("@")[0];
                            }
                        }

                        // const left = event.clientX;
                        // const top = event.clientY;
                        const left = getMouseEventClientX(event);
                        const top = getMouseEventClientY(event);
                        // mid button down: channel name peek
                        g_widgets1.createChannelNamePeekDiv(left, top, channelName);
                    }
                    return;
                } else {
                    // no widget found, do nothing
                    return;
                }
            } else if (event.button === 2) {
                // right button
                let contextMenuOptions: Record<string, any> = {};
                if (this.getMainProcessMode() === "web") {
                    // keep selected text
                    event.preventDefault();
                }

                // right click on input area, copy/paste/cut, no matter if a widget is found
                if ((event.target instanceof HTMLInputElement) || (event.target instanceof HTMLTextAreaElement)) {
                    contextMenuOptions = {
                        inputElementFocused: true,
                    }
                    event.preventDefault();
                    this.showContextMenu(widgetKeyResult, [event.clientX, event.clientY], contextMenuOptions);
                    return;
                }

                if (widgetKeyResult !== "") {
                    // widget found

                    // widget-specific options
                    const widget = g_widgets1.getWidget2(widgetKeyResult);

                    if ((widget instanceof TdlViewer) ||
                        (widget instanceof TextEditor) ||
                        (widget instanceof ProfilesViewer) ||
                        (widget instanceof SeqGraph)
                    ) {
                        const selection = window.getSelection();
                        const textSelected = selection === null ? false : selection.toString().length > 0 ? true : false;
                        const selectedText = selection === null ? undefined : selection.toString();
                        contextMenuOptions = {
                            textSelected: textSelected,
                            selectedText: selectedText,
                        }
                        this.showContextMenu(widgetKeyResult, [event.clientX, event.clientY], contextMenuOptions);
                        return;
                    } else if (
                        (widget instanceof PvMonitor)
                        || (widget instanceof FileConverter)
                    ) {
                        // Context menu for Table area of LogViewer, PvMonitor, Casw, and CaSnooper,
                        // Operations of copy/save data

                        if (widget.mouseEventInsideTable(pointerX, pointerY)) {
                            contextMenuOptions = {
                                contextMenuTexts: Object.keys(widget.mouseRightButtonDownContextMenuActions),
                            }
                            this.showContextMenu(widgetKeyResult, [event.clientX, event.clientY], contextMenuOptions);
                            return;
                        }
                    } else if ((widget instanceof LogViewer)
                        || (widget instanceof CaSnooper)
                        || (widget instanceof Casw)

                    ) {
                        // Context menu for Table area of LogViewer, PvMonitor, Casw, and CaSnooper,
                        // Operations of copy/save data
                        const selection = window.getSelection();
                        const textSelected = selection === null ? false : selection.toString().length > 0 ? true : false;
                        const selectedText = selection === null ? undefined : selection.toString();
                        contextMenuOptions = {
                            textSelected: textSelected,
                            selectedText: selectedText,
                        }

                        if (widget.mouseEventInsideTable(pointerX, pointerY)) {
                            if ((widget instanceof CaSnooper && widget.bottomView !== "raw-data")
                                || widget instanceof Casw && widget.bottomView !== "raw-data"
                            ) {
                                // do not copy
                            } else {
                                contextMenuOptions = {
                                    contextMenuTexts: Object.keys(widget.mouseRightButtonDownContextMenuActions),
                                }
                            }
                        }
                        this.showContextMenu(widgetKeyResult, [event.clientX, event.clientY], contextMenuOptions);
                        return;
                    } else if (widget instanceof ChannelGraph) {
                        contextMenuOptions = {
                            showChannelGraphOptions: true,
                        }
                        this.showContextMenu(widgetKeyResult, [event.clientX, event.clientY], contextMenuOptions);
                        return;
                    } else if (widget instanceof DataViewer && this.getIsUtilityWindow() === true) {
                        contextMenuOptions = {
                            isUtilityWindow: true,
                        }
                        this.showContextMenu(widgetKeyResult, [event.clientX, event.clientY], contextMenuOptions);
                        return;

                    } else {
                        // any other type of widgets, no special action
                        this.showContextMenu(widgetKeyResult, [event.clientX, event.clientY], {});
                        return;
                    }
                } else {
                    // no widget found, no additional action
                }
            }

            // fallback case: Canvas
            this.showContextMenu("Canvas", [event.clientX, event.clientY], {});
            return;
        });

        window.addEventListener("mousemove", (event: MouseEvent) => {
            if (g_widgets1 === undefined) {
                return;
            }
            const channelNamePeekDivId = g_widgets1.getChannelNamePeekDivId();
            if (channelNamePeekDivId !== "") {
                const channelNamePeekDiv = document.getElementById(channelNamePeekDivId);

                if (channelNamePeekDiv !== null) {
                    // const left = event.clientX;
                    // const top = event.clientY;
                    const left = getMouseEventClientX(event);
                    const top = getMouseEventClientY(event);
                    const width = channelNamePeekDiv.offsetWidth;
                    const height = channelNamePeekDiv.offsetHeight;
                    channelNamePeekDiv.style.left = `${Math.max(left - width / 2, 0)}px`;
                    channelNamePeekDiv.style.top = `${Math.max(top - height, 0)}px`;
                }
            }
        });

        window.addEventListener("mouseup", (event: MouseEvent) => {
            // remove the "Channel Name Peek Div"
            if (g_widgets1 === undefined) {
                return;
            }
            g_widgets1.removeChannelNamePeekDiv();

            // mid-button down causes the input element focused in e.g. TextEntry widget
            // blur this element upon button up
            if (event.button === 1) {
                const focusedElement = document.activeElement;
                if (focusedElement instanceof HTMLInputElement) {
                    focusedElement.blur()
                }
            }
        });

        // zoom window with Ctrl + wheel
        window.addEventListener("wheel", (event: WheelEvent) => {
            // scroll up is negative, zoom in; scroll down is positive, zoom out
            Log.debug("scrolling", event.deltaX, event.deltaY);
            let eventElement = event.target;

            // prevent the zoom in/out for DataViewer Plot region
            // ctrl + wheel is for vertical zoom in/out for the plot
            while (true) {
                if (eventElement === null) {
                    break;
                }
                if (event.ctrlKey === false) {
                    // if ctrl key is not down, skip check
                    break;
                }
                if (!(eventElement instanceof HTMLElement || eventElement instanceof SVGElement)) {
                    break;
                }
                if (eventElement.id.startsWith("DataViewerPlot-")) {
                    console.log("caught in data viewer plot")
                    return;
                }
                eventElement = eventElement.parentElement;
            }

            if (event.ctrlKey && this.getWindowId() !== "") {
                if (event.deltaY > 0) {
                    this.getIpcManager().sendFromRendererProcess("zoom-window",
                        {
                            displayWindowId: this.getWindowId(),
                            zoomDirection: "out"
                        }
                    );
                }
                else if (event.deltaY < 0) {
                    this.getIpcManager().sendFromRendererProcess("zoom-window",
                        {
                            displayWindowId: this.getWindowId(),
                            zoomDirection: "in"
                        }
                    );
                }
            }
        })
    };
    // ----------------------- tdl ------------------------------------

    /**
     * After the renderer window is created, the main process immediately sends the tdl file to
     * this window for rendering. Or, when the window reloads, the tdl is re-sent from main process. <br>
     *
     * (1) if it is a utility window which has a fixed format, append the utility widget to the tdl, the original tdl should be a blank Canvas <br>
     *
     * (2) create the Root object for this display window, g_widgets1 is also created with all widgets defined in the tdl <br>
     *
     * (3) render the page with Root._Element, with initialMode mode (g_widgets1._rendererWindowStatus's initial value)
     *     but the channels are not created yet <br>
     *
     * (4) set mode to the initialMode ("editing" | "operating"), the TCA channels do not need to be destroyed, they should have been
     *     take care of in previous step, i.e. in the load-tdl-file event sent from renderer process to main process.
     *     if necessary, the channels are created at this step <br>
     *
     * (5) set window title. If the "window name" is empty, switch to "file name"<br>
     *
     * (6) clean and update history
     */
    updateTdl = (
        newTdl: type_tdl,
        tdlFileName: string,
        initialModeStr: "editing" | "operating",
        editable: boolean,
        externalMacros: [string, string][],
        useExternalMacros: boolean,
        utilityType?: "Probe" | "PvTable" | "DataViewer" | "ProfilesViewer" | "LogViewer" | "TdlViewer" | "TextEditor" | "Terminal" | "Calculator" | "ChannelGraph" | "Help" | "CaSnooper" | "Casw" | "PvMonitor" | "FileConverter" | "Talhk" | "FileBrowser" | "SeqGraph" | undefined,
        utilityOptions?: Record<string, any>
    ) => {
        Log.info("new tdl ", newTdl, utilityType, editable)
        this.setTdlFileName(tdlFileName);
        // (1)
        let initialMode: rendererWindowStatus.editing | rendererWindowStatus.operating = rendererWindowStatus.editing;
        if (initialModeStr === "editing") {
            initialMode = rendererWindowStatus.editing;
        } else {
            initialMode = rendererWindowStatus.operating;
        }

        if (
            utilityType === "Probe" ||
            utilityType === "PvTable" ||
            utilityType === "DataViewer" ||
            utilityType === "ProfilesViewer" ||
            utilityType === "LogViewer" ||
            utilityType === "TdlViewer" ||
            utilityType === "TextEditor" ||
            utilityType === "Calculator" ||
            utilityType === "Terminal" ||
            utilityType === "ChannelGraph" ||
            utilityType === "CaSnooper" ||
            utilityType === "Casw" ||
            utilityType === "PvMonitor" ||
            utilityType === "FileConverter" ||
            utilityType === "Help" ||
            utilityType === "FileBrowser" ||
            utilityType === "Talhk" ||
            utilityType === "SeqGraph"
        ) {
            if (utilityOptions !== undefined) {
                this._appendUtilityWidgetTdl(newTdl, utilityType, utilityOptions);
                initialMode = rendererWindowStatus.operating;
            }
        }
        // (2)
        const rootElement = new Root(newTdl, this, initialMode, editable, externalMacros, useExternalMacros);
        // (3)
        this.getRoot().render(rootElement.getElement());
        // (4)
        g_widgets1.setMode(initialMode, true, false);
        // (5)
        this.setWindowTitleType("window-name");
        this.updateWindowTitle();
        const canvasTdl = newTdl["Canvas"];
        if (canvasTdl["windowName"].trim() === "") {
            this.setWindowTitleType("file-name");
            this.updateWindowTitle();
        }
        // (6)
        this.getActionHistory().clearHistory();
        // the tdl is read from hard drive, the modified bit must be false (as the runtime TDL is the same as the saved TDL file)
        this.getActionHistory().setModified(false);
        this.getActionHistory().registerAction(true);
        Log.info("Data structure for new tdl created.")
    };

    undo = () => {
        if (!g_widgets1.isEditing()) {
            return;
        }
        const oldTdl = this.getActionHistory().popTdl();
        if (oldTdl === undefined) {
            return;
        }
        const mode = rendererWindowStatus.editing;
        const editable = g_widgets1.getRoot().getEditable();
        const externalMacros = g_widgets1.getRoot().getExternalMacros();
        const useExternalMacros = g_widgets1.getRoot().getUseExternalMacros();
        const rootElement = new Root(oldTdl, this, mode, editable, externalMacros, useExternalMacros);
        this.getRoot().render(rootElement.getElement());
        // the window is resized to fit the Canvas size
        g_widgets1.setMode(rendererWindowStatus.editing, true, false);
        // window title, anyway
        if (this.getWindowTitleType() === "window-name") {
            this.updateWindowTitle();
        }
    };

    redo = () => {
        if (!g_widgets1.isEditing()) {
            return;
        }
        const nextTdl = this.getActionHistory().unpopTdl();
        if (nextTdl === undefined) {
            return;
        }
        const mode = rendererWindowStatus.editing;
        const editable = g_widgets1.getRoot().getEditable();
        const externalMacros = g_widgets1.getRoot().getExternalMacros();
        const useExternalMacros = g_widgets1.getRoot().getUseExternalMacros();
        const rootElement = new Root(nextTdl, this, mode, editable, externalMacros, useExternalMacros);
        this.getRoot().render(rootElement.getElement());
        g_widgets1.setMode(rendererWindowStatus.editing, true, false);
        if (this.getWindowTitleType() === "window-name") {
            this.updateWindowTitle();
        }
    };

    /**
     * Append the utility widget to a tdl JSON object
     */
    private _appendUtilityWidgetTdl = (
        tdl: type_tdl,
        utilityType: "Probe" | "PvTable" | "DataViewer" | "ProfilesViewer" | "LogViewer" | "TdlViewer" | "TextEditor" | "Terminal" | "Calculator" | "ChannelGraph" | "Help" | "CaSnooper" | "Casw" | "PvMonitor" | "FileConverter" | "Talhk" | "FileBrowser" | "SeqGraph",
        utilityOptions: Record<string, any>
    ) => {
        console.log("tdl", utilityType)
        if (utilityType === "Probe") {
            // todo: this window should not be editable, in editing mode, it is a mess
            const widgetTdl = Probe.generateWidgetTdl(utilityOptions);
            const widgetKey = widgetTdl.widgetKey;
            widgetTdl.style.width = "100%";
            widgetTdl.style.height = "100%";
            widgetTdl.style.boxSizing = "border-box";
            widgetTdl.style.padding = "20px";
            tdl[widgetKey] = widgetTdl;
            tdl["Canvas"].style.backgroundColor = "rgba(255, 255, 255, 1)";
        } else if (utilityType === "PvMonitor") {
            const widgetTdl = PvMonitor.generateWidgetTdl(utilityOptions);
            const widgetKey = widgetTdl.widgetKey;
            widgetTdl.style.width = "100%";
            widgetTdl.style.height = "100%";
            widgetTdl.style.boxSizing = "border-box";
            widgetTdl.style.padding = "20px";
            widgetTdl.style.paddingRight = "0px";
            widgetTdl.text.alarmBorder = false;
            widgetTdl.style.borderWidth = 0;
            tdl[widgetKey] = widgetTdl;
            tdl["Canvas"].style.backgroundColor = "rgba(255, 255, 255, 1)";
        } else if (utilityType === "PvTable") {
            //todo:
            // newTdl["PvTable"] = PvTable.generateWidgetTdl(utilityOptions);

            // todo: this window should not be editable, in editing mode, it is a mess
            const widgetTdl = PvTable.generateWidgetTdl(utilityOptions);
            const widgetKey = widgetTdl.widgetKey;
            widgetTdl.style.width = "100%";
            widgetTdl.style.height = "100%";
            widgetTdl.style.boxSizing = "border-box";
            widgetTdl.style.padding = "20px";
            tdl[widgetKey] = widgetTdl;
            tdl["Canvas"].style.backgroundColor = "rgba(255, 255, 255, 1)";
        } else if (utilityType === "DataViewer") {
            // todo: this window should not be editable, in editing mode, it is a mess
            const widgetTdl = DataViewer.generateWidgetTdl(utilityOptions);
            const widgetKey = widgetTdl.widgetKey;
            widgetTdl.text.singleWidget = true;
            widgetTdl.style.boxSizing = "border-box";
            widgetTdl.style.padding = 5;
            tdl[widgetKey] = widgetTdl;
            tdl["Canvas"].style.backgroundColor = "rgba(255, 255, 255, 1)";
        } else if (utilityType === "ProfilesViewer") {
            const widgetTdl = ProfilesViewer.generateWidgetTdl(utilityOptions);
            const widgetKey = widgetTdl.widgetKey;
            // widgetTdl.text.singleWidget = true;
            // widgetTdl.style.boxSizing = "border-box";
            // widgetTdl.style.padding = 5;
            tdl[widgetKey] = widgetTdl;
            tdl["Canvas"].style.backgroundColor = "rgba(255, 255, 255, 1)";
        } else if (utilityType === "LogViewer") {
            const widgetTdl = LogViewer.generateWidgetTdl(utilityOptions);
            const widgetKey = widgetTdl.widgetKey;
            // widgetTdl.text.singleWidget = true;
            // widgetTdl.style.boxSizing = "border-box";
            // widgetTdl.style.padding = 5;
            widgetTdl.style.width = "100%";
            widgetTdl.style.height = "100%";
            widgetTdl.style.boxSizing = "border-box";
            widgetTdl.style.padding = "20px";
            widgetTdl.style.paddingRight = "0px";
            widgetTdl.text.alarmBorder = false;
            widgetTdl.style.borderWidth = 0;
            tdl[widgetKey] = widgetTdl;
            tdl["Canvas"].style.backgroundColor = "rgba(255, 255, 255, 1)";
        } else if (utilityType === "TdlViewer") {
            const widgetTdl = TdlViewer.generateWidgetTdl(utilityOptions);
            const widgetKey = widgetTdl.widgetKey;
            // widgetTdl.text.singleWidget = true;
            // widgetTdl.style.boxSizing = "border-box";
            // widgetTdl.style.padding = 5;
            tdl[widgetKey] = widgetTdl;
            tdl["Canvas"].style.backgroundColor = "rgba(255, 0, 255, 1)";
        } else if (utilityType === "TextEditor") {
            const widgetTdl = TextEditor.generateWidgetTdl(utilityOptions);
            const widgetKey = widgetTdl.widgetKey;
            // widgetTdl.text.singleWidget = true;
            // widgetTdl.style.boxSizing = "border-box";
            // widgetTdl.style.padding = 5;
            tdl[widgetKey] = widgetTdl;
            tdl["Canvas"].style.backgroundColor = "rgba(255, 0, 255, 1)";
        } else if (utilityType === "FileConverter") {
            const widgetTdl = FileConverter.generateWidgetTdl(utilityOptions);
            const widgetKey = widgetTdl.widgetKey;
            widgetTdl.style.width = "100%";
            widgetTdl.style.height = "100%";
            // widgetTdl.text.singleWidget = true;
            widgetTdl.style.boxSizing = "border-box";
            widgetTdl.style.padding = 20;
            tdl[widgetKey] = widgetTdl;
            tdl["Canvas"].style.backgroundColor = "rgba(255, 0, 255, 1)";
        } else if (utilityType === "Terminal") {
            // default size is 100%
            const widgetTdl = Terminal.generateWidgetTdl(utilityOptions);
            const widgetKey = widgetTdl.widgetKey;
            // widgetTdl.text.singleWidget = true;
            // widgetTdl.style.boxSizing = "border-box";
            // widgetTdl.style["top"] = 0;
            tdl[widgetKey] = widgetTdl;
            tdl["Canvas"].style.backgroundColor = "rgba(0, 0, 0, 1)";
        } else if (utilityType === "Calculator") {
            // default size is 100%
            const widgetTdl = Calculator.generateWidgetTdl(utilityOptions);
            const widgetKey = widgetTdl.widgetKey;
            // widgetTdl.text.singleWidget = true;
            // widgetTdl.style.boxSizing = "border-box";
            // widgetTdl.style["top"] = 0;
            tdl[widgetKey] = widgetTdl;
            // tdl["Canvas"].style.backgroundColor = "rgba(0, 0, 0, 1)";
        } else if (utilityType === "ChannelGraph") {
            // default size is 100%
            const widgetTdl = ChannelGraph.generateWidgetTdl(utilityOptions);
            const widgetKey = widgetTdl.widgetKey;
            widgetTdl.style.width = "100%";
            widgetTdl.style.height = "100%";
            // widgetTdl.style.boxSizing = "border-box";
            // widgetTdl.style.padding = "20px";

            // widgetTdl.text.singleWidget = true;
            // widgetTdl.style.boxSizing = "border-box";
            // widgetTdl.style["top"] = 0;
            tdl[widgetKey] = widgetTdl;
            // tdl["Canvas"].style.backgroundColor = "rgba(0, 0, 0, 1)";
        } else if (utilityType === "SeqGraph") {
            // default size is 100%
            const widgetTdl = SeqGraph.generateWidgetTdl(utilityOptions);
            const widgetKey = widgetTdl.widgetKey;
            widgetTdl.style.width = "100%";
            widgetTdl.style.height = "100%";
            // widgetTdl.style.boxSizing = "border-box";
            // widgetTdl.style.padding = "20px";

            // widgetTdl.text.singleWidget = true;
            // widgetTdl.style.boxSizing = "border-box";
            // widgetTdl.style["top"] = 0;
            tdl[widgetKey] = widgetTdl;
            // tdl["Canvas"].style.backgroundColor = "rgba(0, 0, 0, 1)";
        } else if (utilityType === "FileBrowser") {
            // default size is 100%
            const widgetTdl = FileBrowser.generateWidgetTdl(utilityOptions);
            const widgetKey = widgetTdl.widgetKey;
            widgetTdl.style.width = "100%";
            widgetTdl.style.height = "100%";
            // widgetTdl.style.boxSizing = "border-box";
            // widgetTdl.style.padding = "20px";

            // widgetTdl.text.singleWidget = true;
            // widgetTdl.style.boxSizing = "border-box";
            // widgetTdl.style["top"] = 0;
            tdl[widgetKey] = widgetTdl;
            // tdl["Canvas"].style.backgroundColor = "rgba(0, 0, 0, 1)";
        } else if (utilityType === "CaSnooper") {
            // default size is 100%
            const widgetTdl = CaSnooper.generateWidgetTdl(utilityOptions);
            const widgetKey = widgetTdl.widgetKey;
            widgetTdl.style.width = "100%";
            widgetTdl.style.height = "100%";
            widgetTdl.style.boxSizing = "border-box";
            widgetTdl.style.padding = "20px";

            // ca snooper has a XYPlot (not DataViewer):
            const widgetTdl2 = XYPlot.generateDefaultTdl("XYPlot");
            const widgetKey2 = widgetTdl2.widgetKey;
            // will be lively updated upon window resize and view switch
            widgetTdl2.style.width = 666;
            widgetTdl2.style.height = 333;
            widgetTdl2.channelNames = ["loc://histX<number[]>([1,2,3])", "loc://histY<number[]>([1,2,3])"];
            widgetTdl2.xAxis["label"] = "t [second]";
            widgetTdl2.xAxis["valMin"] = -100;
            widgetTdl2.xAxis["valMax"] = 0;
            widgetTdl2.yAxes.push(
                {
                    label: `Count`,
                    valMin: 0,
                    valMax: 50,
                    lineWidth: 2,
                    lineColor: "rgba(255,0,0,1)",
                    ticks: [0, 50, 100],
                    ticksText: [0, 50, 100],
                    autoScale: false,
                    lineStyle: "solid",
                    pointType: "none",
                    pointSize: 5,
                    showGrid: true,
                    numGrids: 5,
                    displayScale: "Linear",
                }
            )
            // put CaSnooper on top of XYPlot, so that the mouse click/down reaches CaSnooper
            tdl[widgetKey2] = widgetTdl2;
            tdl[widgetKey] = widgetTdl;
        } else if (utilityType === "Talhk") {
            // default size is 100%
            const widgetTdl = Talhk.generateWidgetTdl(utilityOptions); // set server address from utilityOptions
            widgetTdl.style.width = "100%";
            widgetTdl.style.height = "100%";
            widgetTdl.style.boxSizing = "border-box";
            tdl["Canvas"].style.backgroundColor = "rgba(255, 255, 255, 1)";

            // widgetTdl.style.padding = "20px";
            const widgetKey = widgetTdl.widgetKey;
            tdl[widgetKey] = widgetTdl;
        } else if (utilityType === "Casw") {
            // default size is 100%
            const widgetTdl = Casw.generateWidgetTdl(utilityOptions);
            const widgetKey = widgetTdl.widgetKey;
            widgetTdl.style.width = "100%";
            widgetTdl.style.height = "100%";
            widgetTdl.style.boxSizing = "border-box";
            widgetTdl.style.padding = "20px";

            // ca snooper has a XYPlot (not DataViewer):
            const widgetTdl2 = XYPlot.generateDefaultTdl("XYPlot");
            const widgetKey2 = widgetTdl2.widgetKey;
            // will be lively updated upon window resize and view switch
            widgetTdl2.style.width = 666;
            widgetTdl2.style.height = 333;
            widgetTdl2.channelNames = ["loc://histX<number[]>([1,2,3])", "loc://histY<number[]>([1,2,3])"];
            widgetTdl2.xAxis["label"] = "t [second]";
            widgetTdl2.xAxis["valMin"] = -100;
            widgetTdl2.xAxis["valMax"] = 0;
            widgetTdl2.yAxes.push(
                {
                    label: `Count`,
                    valMin: 0,
                    valMax: 50,
                    lineWidth: 2,
                    lineColor: "rgba(255,0,0,1)",
                    ticks: [0, 50, 100],
                    ticksText: [0, 50, 100],
                    autoScale: false,
                    lineStyle: "solid",
                    pointType: "none",
                    pointSize: 5,
                    showGrid: true,
                    numGrids: 5,
                    displayScale: "Linear",
                }
            )
            // put Casw on top of XYPlot, so that the mouse click/down reaches Casw
            tdl[widgetKey2] = widgetTdl2;
            tdl[widgetKey] = widgetTdl;
        }
    };

    /**
     * Generate JSON object for this display window. <br>
     * 2 special widgets, GroupSelection2 and MouseSelectionRegion, are not included. <br>
     *
     * @returns {Record<string, any>} JSON object that represent this display.
     * @throws {Error<string>} when there is an error
     */
    generateTdl = (): Record<string, any> => {
        let result: Record<string, any> = {};
        try {
            const specialWidgetKeys = ["GroupSelection2", "MouseSelectionRegion"];
            for (let [widgetKey, widget] of g_widgets1.getWidgets2()) {
                if (!specialWidgetKeys.includes(widgetKey)) {
                    result[widgetKey] = widget.getTdlCopy(false);
                }
            }
        } catch (e) {
            Log.error(e);
            const errMsg = "Failed to generate tdl JSON object for this display.";
            throw new Error(errMsg);
        }
        return result;
    };

    showTdlFileContents = () => {
        const tdl = this.generateTdl();
        const externalMacros = g_widgets1.getRoot().getExternalMacros();
        const tdlFileName = this.getTdlFileName();
        if (this.getMainProcessMode() === "desktop" || this.getMainProcessMode() === "ssh-client") {
            this.getIpcManager().sendFromRendererProcess("create-utility-display-window",
                {
                    utilityType: "TdlViewer",
                    utilityOptions: {
                        tdl: tdl,
                        externalMacros: externalMacros,
                        tdlFileName: tdlFileName,
                    }
                }
            );
        } else {
            // web mode
            const currentSite = `https://${window.location.host}/`;

            this.getIpcManager().sendPostRequestCommand("create-utility-display-window", {
                utilityType: "TdlViewer", utilityOptions: {
                    tdl: tdl,
                    externalMacros: externalMacros,
                    tdlFileName: tdlFileName,
                }
            }).then((response: any) => {
                // decode string
                return response.json()
            }).then(data => {
                const ipcServerPort = data["ipcServerPort"];
                const displayWindowId = data["displayWindowId"];
                window.open(`${currentSite}DisplayWindow.html?ipcServerPort=${ipcServerPort}&displayWindowId=${displayWindowId}`)
            })

        }
    };

    /**
     * Save tdl file at the current display window state. <br>
     *
     * The JSON object is generated and sent to main process to save on disk.
     *
     * @param {string} tdlFileName The file name that will be saved.
     * An empty file name "" means it is saved as. In this case, a prompt will pop up.
     */
    saveTdl = (tdlFileName: string) => {
        if (this.getMainProcessMode() === "web") {
            if (tdlFileName === "") {
                // save tdl to local computer
                const tdl = this.generateTdl();
                const blob = new Blob([JSON.stringify(tdl, null, 4)], { type: 'text/json' });
                this.downloadData(blob, tdlFileName);
                return;
            } else {
                // save to server, the server will make sure the file is allowed to be saved
                if (this.getActionHistory().getModified() === true) {
                    this.getIpcManager().sendFromRendererProcess("save-tdl-file",
                        {
                            windowId: this.getWindowId(),
                            tdl: this.generateTdl() as type_tdl,
                            tdlFileName1: tdlFileName
                        }
                    );
                }
            }
        } else {
            if (this.getActionHistory().getModified() === true) {
                Log.debug("We are going to save TDL", tdlFileName)
                this.getIpcManager().sendFromRendererProcess("save-tdl-file",
                    {
                        windowId: this.getWindowId(),
                        tdl: this.generateTdl() as type_tdl,
                        tdlFileName1: tdlFileName
                    }
                );
            } else {
                if (this.getIsUtilityWindow() === true) {
                    // always save utility window (in editing mode)
                    this.getIpcManager().sendFromRendererProcess("save-tdl-file",
                        {
                            windowId: this.getWindowId(),
                            tdl: this.generateTdl() as type_tdl,
                            tdlFileName1: tdlFileName
                        }
                    );
                    return;
                }
                if (tdlFileName === "") {
                    Log.info("We are going to save this new TDL");
                    this.getIpcManager().sendFromRendererProcess("save-tdl-file",
                        {
                            windowId: this.getWindowId(),
                            tdl: this.generateTdl() as type_tdl,
                            tdlFileName1: tdlFileName
                        }
                    );
                } else {
                    Log.debug("TDL file", tdlFileName, "is not changed, no need to save");
                }
            }
        }
    };

    downloadData = async (blob: Blob, suggestedName: string, description: string = "", applicationKey: string = "application/json", applicationValue: string[] = [".tdl", ".json"]) => {
        if (this.getMainProcessMode() !== "web") {
            return;
        }
        try {
            const accept: Record<string, any> = {};
            accept[applicationKey] = applicationValue;

            // showSaveFilePicker is not recognized by window object
            if ((window as any).showSaveFilePicker !== undefined) {
                const fileHandle = await (window as any).showSaveFilePicker({
                    suggestedName: suggestedName, // Default file name
                    types: [
                        {
                            description: description,
                            accept: accept,
                        },
                    ],
                });
                const writable = await fileHandle.createWritable();
                await writable.write(blob);
                await writable.close();
            } else {
                // safari, firefox, or opera does not support the showSaveFilePicker API
                Log.debug("there is no showSaveFilePicker API, directly download the tdl file");
                const downloadLink = document.createElement('a');
                downloadLink.href = URL.createObjectURL(blob);
                downloadLink.download = 'Untitled.tdl';
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
                this.getIpcManager().handleDialogShowMessageBox(undefined,
                    {
                        info: {
                            messageType: "info",
                            humanReadableMessages: ["You have successfully downloaded the data or file.",
                                "However, this web browser does not support naming this file.",
                                `According to the context, you may want to rename the file to ${suggestedName}.`,
                                "Using Chromium-based web browser can help to solve this issue."
                            ],
                            rawMessages: [],
                        }
                    }
                )
            }
        } catch (e) {
            // "AbortError" is not an error, we just canceled it
            if (`${e}`.includes("AbortError")) {
                return;
            }
            Log.error("Error on saving data file", e);
            this.getIpcManager().handleDialogShowMessageBox(undefined,
                {
                    info: {
                        messageType: "error",
                        humanReadableMessages: ["Failed to save data or file."],
                        rawMessages: [`${e}`],
                    }
                }
            )
        }

    }

    downloadScreenshot = async () => {
        if (this.getMainProcessMode() !== "web") {
            return;
        }
        try {
            const canvas = await html2canvas(document.body);
            canvas.toBlob(async (blob: Blob | null) => {
                if (blob !== null) {
                    const dateNowStr = convertEpochTimeToString(Date.now());
                    const suggestedName = `TDM-screenshot-${dateNowStr}.png`;
                    const description = 'Screenshot Image';
                    const applicationKey = "application/image";
                    const applicationValue = [".png"];
                    this.downloadData(blob, suggestedName, description, applicationKey, applicationValue);
                }
            });
        } catch (err) {
            Log.error('Error capturing screenshot:', err);
        }
    }

    /**
     * In web mode, open a local file in web browser.
     */
    openTdlFileInWebMode = (fileName: string | undefined = undefined, fileBlob: Blob | undefined = undefined) => {
        if (this.getMainProcessMode() !== "web") {
            return;
        }
        if (fileName !== undefined && fileBlob !== undefined) {
            const tdlFileName = fileName;
            // we supply the file blob
            Log.debug("Open TDL file", fileBlob);
            const reader = new FileReader();
            reader.onload = (event: any) => {
                const fileContents = event.target.result;
                const currentSite = `https://${window.location.host}/`;
                const tdlStr = event.target.result;
                this.getIpcManager().sendPostRequestCommand("open-tdl-file", {
                    tdlStr: tdlStr,
                    tdlFileNames: [tdlFileName],
                    mode: g_widgets1.isEditing() ? "editing" : "operating",
                    editable: true,
                    // external macros: user-provided and parent display macros
                    macros: [],
                    replaceMacros: true,
                    currentTdlFolder: undefined,
                },
                ).then((response: any) => {
                    // decode string
                    return response.json()
                }).then(data => {
                    const ipcServerPort = data["ipcServerPort"];
                    const displayWindowId = data["displayWindowId"];
                    window.open(`${currentSite}DisplayWindow.html?ipcServerPort=${ipcServerPort}&displayWindowId=${displayWindowId}`)
                })
                    ;
            };
            reader.readAsText(fileBlob);

        } else {
            // manually select the file
            const inputElement = document.createElement("input");
            inputElement.type = "file";
            inputElement.style.display = "none";
            inputElement.addEventListener("change", (event: any) => {
                const tdlFileNameBlob = event.target.files[0];
                const tdlFileName = tdlFileNameBlob["name"];
                const reader = new FileReader();
                reader.onload = (event: any) => {
                    const currentSite = `https://${window.location.host}/`;
                    // may be tdl or db file
                    const tdlStr = event.target.result;
                    this.getIpcManager().sendPostRequestCommand("open-tdl-file", {
                        tdlStr: tdlStr,
                        tdlFileNames: [tdlFileName],
                        mode: g_widgets1.isEditing() ? "editing" : "operating",
                        editable: true,
                        // external macros: user-provided and parent display macros
                        macros: [],
                        replaceMacros: true,
                        currentTdlFolder: undefined,
                    },
                    ).then((response: any) => {
                        // decode string
                        return response.json()
                    }).then(data => {
                        const ipcServerPort = data["ipcServerPort"];
                        const displayWindowId = data["displayWindowId"];
                        window.open(`${currentSite}DisplayWindow.html?ipcServerPort=${ipcServerPort}&displayWindowId=${displayWindowId}`)
                    })
                        ;
                };
                reader.readAsText(tdlFileNameBlob);
                event.target.remove();
            })
            document.body.appendChild(inputElement);
            inputElement.click();
        }
    }

    /**
     * Open a text file inside 
     */
    openTextFileInTextEditorInWebMode = (widget: TextEditor, fileName: string | undefined = undefined, fileBlob: Blob | undefined = undefined) => {
        if (fileName === undefined) {
            // manually open a local file
            const inputElement = document.createElement("input");
            inputElement.type = "file";
            inputElement.style.display = "none";
            inputElement.addEventListener("change", (event: any) => {
                const fileName = event.target.files[0];
                Log.debug("TextEditor reads file", fileName);
                const reader = new FileReader();
                reader.onload = (event: any) => {
                    const fileContents = event.target.result;
                    widget.loadFileContents({
                        fileName: fileName,
                        fileContents: fileContents,
                        readable: true,
                        writable: true,
                    })
                };
                reader.readAsText(fileName);
                event.target.remove();
            })
            document.body.appendChild(inputElement);
            inputElement.click();
        } else if (fileName !== undefined && fileBlob !== undefined) {
            // drag-and-drop a file to the browser window
            Log.debug("TextEditor reads file", fileName, fileBlob);
            const reader = new FileReader();
            reader.onload = (event: any) => {
                const fileContents = event.target.result;
                widget.loadFileContents({
                    fileName: fileName,
                    fileContents: fileContents,
                    readable: true,
                    writable: true,
                })
            };
            reader.readAsText(fileBlob);
        }
    }

    /**
     * Pop up file selector.
     */
    manualOpenTdl = (status: rendererWindowStatus) => {
        const statusStr = rendererWindowStatus[status];
        // this.getIpcManager().sendFromRendererProcess("open-tdl-file", undefined, statusStr, false, [], false);
        // this.getIpcManager().sendFromRendererProcess("open-tdl-file", {
        //     // tdlFileNames?: string[];
        //     mode: statusStr,
        //     editable: false,
        //     macros: [],
        //     replaceMacros: false,
        //     // currentTdlFolder?: string;
        // });

        this.getIpcManager().sendFromRendererProcess("open-tdl-file",
            {
                options: {
                    // tdlFileNames?: string[];
                    mode: statusStr as "operating" | "editing", // seems like it is disgarded
                    editable: false, // seems like it is disgarded
                    macros: [],
                    replaceMacros: false,
                    // currentTdlFolder?: string;
                    windowId: this.getWindowId(),
                }
            });

    };

    // ---------------------- window title ----------------------------

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
            const canvas = await html2canvas(document.body);
            canvas.toBlob(async (blob: Blob | null) => {
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
            });
        } catch (err) {
            Log.error('Error capturing screenshot:', err);
        }
    }



    reloadDisplay = () => {
        location.reload();
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
        // process ID, part of display window ID
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

    getTextEditorModified = () => {
        return this._textEditorModified;
    }

    setTextEditorModified = (newState: boolean) => {
        this._textEditorModified = newState;
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
                (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        } catch (e) {
            this._webGlSupported = false;
        }
    }

    canUseWebGl = () => {
        return this._webGlSupported;
    }

    isInIframe = () => {
        return window.self !== window.top;
    }

    setWindowAlwaysOnTop = (state: boolean) => {
        this.getIpcManager().sendFromRendererProcess("set-window-always-on-top", {
            displayWindowId: this.getWindowId(),
            state: state,
        })
    }

}


(window as any).DisplayWindowClientClass = DisplayWindowClient;

