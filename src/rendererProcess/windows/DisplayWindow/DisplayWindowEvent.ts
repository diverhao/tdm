import { getMouseEventClientX, getMouseEventClientY } from "../../../common/GlobalVariables";
import { Log } from "../../../common/Log";
import { g_widgets1 } from "../../global/GlobalVariables";
import { Table } from "../../widgets/Table/Table";
import { BaseWidget } from "../../widgets/BaseWidget/BaseWidget";
import { CaSnooper } from "../../widgets/CaSnooper/CaSnooper";
import { Casw } from "../../widgets/Casw/Casw";
import { ChannelGraph } from "../../widgets/ChannelGraph/ChannelGraph";
import { DataViewer } from "../../widgets/DataViewer/DataViewer";
import { FileConverter } from "../../widgets/FileConverter/FileConverter";
import { LogViewer } from "../../widgets/LogViewer/LogViewer";
import { Probe } from "../../widgets/Probe/Probe";
import { ProfilesViewer } from "../../widgets/ProfilesViewer/ProfilesViewer";
import { PvMonitor } from "../../widgets/PvMonitor/PvMonitor";
import { PvTable } from "../../widgets/PvTable/PvTable";
import { SeqGraph } from "../../widgets/SeqGraph/SeqGraph";
import { TdlViewer } from "../../widgets/TdlViewer/TdlViewer";
import { TextEditor } from "../../widgets/TextEditor/TextEditor";
import { XYPlot } from "../../widgets/XYPlot/XYPlot";
import { DisplayWindowClient } from "./DisplayWindowClient";


export class DisplayWindowEvent {
    private readonly _displayWindowClient: DisplayWindowClient;

    constructor(displayWindowClient: DisplayWindowClient) {
        this._displayWindowClient = displayWindowClient;
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
            if (this.getDisplayWindowClient().getMainProcessMode() === "web") {
                event.preventDefault();
            }
        })

        /**
         * Move window using mid button
         */
        if (this.getDisplayWindowClient().getMainProcessMode() === "desktop" && this.getDisplayWindowClient().isInIframe() === false) {
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
                        this.getDisplayWindowClient().moveWindow(dx, dy);
                    };

                    const handleMouseUp = () => {
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
            const promptElement = document.getElementById(this.getDisplayWindowClient().getPrompt().getId());

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
                    this.getDisplayWindowClient().showContextMenu("Canvas", [event.clientX, event.clientY], contextMenuOptions);
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
                    if ((this.getDisplayWindowClient().getIsUtilityWindow() === true)) {
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
                if (this.getDisplayWindowClient().getMainProcessMode() === "web") {
                    // keep selected text
                    event.preventDefault();
                }

                // right click on input area, copy/paste/cut, no matter if a widget is found
                if ((event.target instanceof HTMLInputElement) || (event.target instanceof HTMLTextAreaElement)) {
                    contextMenuOptions = {
                        inputElementFocused: true,
                    }
                    event.preventDefault();
                    this.getDisplayWindowClient().showContextMenu(widgetKeyResult, [event.clientX, event.clientY], contextMenuOptions);
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
                        this.getDisplayWindowClient().showContextMenu(widgetKeyResult, [event.clientX, event.clientY], contextMenuOptions);
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
                            this.getDisplayWindowClient().showContextMenu(widgetKeyResult, [event.clientX, event.clientY], contextMenuOptions);
                            return;
                        }

                    } else if ((widget instanceof LogViewer)
                        || (widget instanceof CaSnooper)
                        || (widget instanceof Casw)
                        || (widget instanceof Table)
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
                        this.getDisplayWindowClient().showContextMenu(widgetKeyResult, [event.clientX, event.clientY], contextMenuOptions);
                        return;
                    } else if (widget instanceof ChannelGraph) {
                        contextMenuOptions = {
                            showChannelGraphOptions: true,
                        }
                        this.getDisplayWindowClient().showContextMenu(widgetKeyResult, [event.clientX, event.clientY], contextMenuOptions);
                        return;
                    } else if (widget instanceof DataViewer && this.getDisplayWindowClient().getIsUtilityWindow() === true) {
                        contextMenuOptions = {
                            isUtilityWindow: true,
                        }
                        this.getDisplayWindowClient().showContextMenu(widgetKeyResult, [event.clientX, event.clientY], contextMenuOptions);
                        return;

                    } else {
                        // any other type of widgets, no special action
                        this.getDisplayWindowClient().showContextMenu(widgetKeyResult, [event.clientX, event.clientY], {});
                        return;
                    }
                } else {
                    // no widget found, no additional action
                }
            }

            // fallback case: Canvas
            this.getDisplayWindowClient().showContextMenu("Canvas", [event.clientX, event.clientY], {});
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
                    return;
                }
                eventElement = eventElement.parentElement;
            }

            if (event.ctrlKey && this.getDisplayWindowClient().getWindowId() !== "") {
                if (event.deltaY > 0) {
                    this.getDisplayWindowClient().getIpcManager().sendFromRendererProcess("zoom-window",
                        {
                            displayWindowId: this.getDisplayWindowClient().getWindowId(),
                            zoomDirection: "out"
                        }
                    );
                }
                else if (event.deltaY < 0) {
                    this.getDisplayWindowClient().getIpcManager().sendFromRendererProcess("zoom-window",
                        {
                            displayWindowId: this.getDisplayWindowClient().getWindowId(),
                            zoomDirection: "in"
                        }
                    );
                }
            }
        })
    };
    getDisplayWindowClient = () => {
        return this._displayWindowClient;
    };

}