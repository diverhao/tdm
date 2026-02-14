
import * as React from "react";
import { MouseEvent } from "react";
import { Channel_ACCESS_RIGHTS, getMouseEventClientX, getMouseEventClientY, GlobalVariables } from "../../../common/GlobalVariables";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { GroupSelection2 } from "../../helperWidgets/GroupSelection/GroupSelection2";
import * as GlobalMethods from "../../../common/GlobalMethods";
import { ChannelSeverity, TcaChannel } from "../../channel/TcaChannel";
import { Canvas } from "../../helperWidgets/Canvas/Canvas";
import { BaseWidgetSidebar } from "./BaseWidgetSidebar";
import { rendererWindowStatus } from "../../global/Widgets";
import { BaseWidgetRules, type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { Log } from "../../../common/Log";
import { evaluate } from "mathjs";

export type type_BaseWidget_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
};

/**
 * Border styles that correspond to `enum ChannelSeverity`
 */
export enum AlarmOutlineStyle {
    "none",
    "solid 1.5px red",
    "double red medium",
    "dashed 1.5px rgba(255,0,255,1)",
    "dotted 1.5px rgba(200,0,200,1)",
}

export enum AlarmBackgroundStyle {
    "rgba(0,0,0,0)",
    "rgba(255,128,0,1)",
    "rgba(255,0,0,1)",
    "rgba(255,0,255,1)",
    "rgba(200,0,200,1)",
}

export enum AlarmTextStyle {
    "rgba(0,0,0,0)",
    "rgba(255,128,0,1)",
    "rgba(255,0,0,1)",
    "rgba(255,0,255,1)",
    "rgba(200,0,200,1)",
}

export enum AlarmShapeStyle {
    "rgba(0,0,0,0)",
    "rgba(255,128,0,1)",
    "rgba(255,0,0,1)",
    "rgba(255,0,255,1)",
    "rgba(200,0,200,1)",
}

export enum AlarmFillStyle {
    "rgba(0,0,0,0)",
    "rgba(255,128,0,1)",
    "rgba(255,0,0,1)",
    "rgba(255,0,255,1)",
    "rgba(200,0,200,1)",
}

export enum AlarmPointerStyle {
    "rgba(0,0,0,0)",
    "rgba(255,128,0,1)",
    "rgba(255,0,0,1)",
    "rgba(255,0,255,1)",
    "rgba(200,0,200,1)",
}

export enum AlarmDialStyle {
    "rgba(0,0,0,0)",
    "rgba(255,128,0,1)",
    "rgba(255,0,0,1)",
    "rgba(255,0,255,1)",
    "rgba(200,0,200,1)",
}

export enum AlarmContainerStyle {
    "rgba(0,0,0,0)",
    "rgba(255,128,0,1)",
    "rgba(255,0,0,1)",
    "rgba(255,0,255,1)",
    "rgba(200,0,200,1)",
}

export enum AlarmSelectedBackgroundStyle {
    "rgba(0,0,0,0)",
    "rgba(255,128,0,1)",
    "rgba(255,0,0,1)",
    "rgba(255,0,255,1)",
    "rgba(200,0,200,1)",
}

/**
 * Abstract base class for regular widgets, e.g. TextUpdate and Probe <br>
 *
 * 3 widgets are not derived from this class: Canvas, MouseSelectionRegion, and GroupSelection2 <br>
 *
 * To add a new widget, e.g. `NewWidget`: <br>
 *
 * (1) Create a folder `src/rendererProcess/widgets/NewWidget` <br>
 *
 * (2) Create two files `NewWidget.tsx` and `NewWidgetSidebar.tsx`, and define corresponding classes in these two files.
 * Pay attention to widgetTdl related variables and methods. <br>
 *
 * (3) Update `IpcManagerOnDisplayWindow.ts`, add the new widget's contextmenu event
 *
 * (4) Update `ContextMenu.ts` and `ContextMenuDesktop.ts`, add the new widget's contextmenu entry
 *
 * (5) Modify `Widgets.ts`, update variable `type_widgetType`, functions `initWidgetTdl()` and `createWidget()`. For
 * a regular widget, there are 9 places to update.
 */
export abstract class BaseWidget {
    // top level properties in tdl file
    _type: string;
    _widgetKey: string;
    _style: Record<string, any> = {};
    _text: Record<string, any> = {};
    // _channelNames: string[];
    _groupNames: string[] = [];
    _rules: BaseWidgetRules | undefined;

    _allStyle: Record<string, any> = {};
    _allText: Record<string, any> = {};

    // _expandedChannelNames: string[] = [];

    // sidebar
    _sidebar: BaseWidgetSidebar | undefined;

    // tmp methods
    _tmp_mouseMoveOnResizerListener: any = undefined;
    _tmp_mouseUpOnResizerListener: any = undefined;

    // used in the situation when shift key is pressed and mouse is down on a selected widget,
    // so that when the mouse is up, this widget is de-selected
    // its value is changed in 3 places: this.select2(), this._handleMouseMove() and this._handleMouseUp()
    _readyToDeselect: boolean = false;

    // type of the widget: a readback type, or write type
    // if it is a "read" type, in operating mode, the mouse events are ignored, but the right click still works (if there is no "write" element behind it)
    _readWriteType: "read" | "write" = "write";

    // setTimeout and setInterval in this widget
    _schedules: (NodeJS.Timeout | NodeJS.Timer)[] = [];

    // style and text computed from rule
    // todo: they are updated at each re-rendering and applied to when??
    _rulesStyle: Record<string, any> = {};
    _rulesText: Record<string, any> = {};

    /**
     * Guard the widget so that it won't be re-rendered 
     * when it is being rendered
     */
    widgetBeingRendered = false;

    /**
     * regular channel name or formula channel, without any touch
     * 
     * channel names from widgetTdl.channelNames
     */
    _channelNamesLevel0: string[] = [];
    /**
     * no touch 
     * 
     * it includes: regular channel name, channel names in rules, formula channel names
     * all higher level channel names are based on this
     */
    _channelNamesLevel1: string[] = [];
    /**
     * macro/windowId not expanded, meta data removed
     */
    _channelNamesLevel2: string[] = [];
    /**
     * macro/windowId expanded, meta data kept
     */
    _channelNamesLevel3: string[] = [];
    /**
     * macro/windowId expanded, meta data removed
     */
    _channelNamesLevel4: string[] = [];

    /**
     * inside an EmbeddedDisplay, the parent widget's key
     */
    _embeddedDisplayWidgetKey: string = "";

    /**
     * Formula channel
     */
    _eqChannelArray: (string | number)[] = [];
    _eqChannelNameIndices: number[] = [];


    _macros: [string, string][] = [];

    constructor(widgetTdl: type_BaseWidget_tdl) {
        this._type = widgetTdl.type;
        this._widgetKey = widgetTdl.widgetKey;

        this._channelNamesLevel0 = JSON.parse(JSON.stringify(widgetTdl.channelNames));
        this._groupNames = JSON.parse(JSON.stringify(widgetTdl.groupNames));
    }

    // ------------------------ mouse events ----------------------------

    /**
     * handler for mouse down event on this widget
     * left mouse button down (button code 0)
     * (1) select the widget according to the widget's status, no flush yet, sidebar is updated if needed
     * (2) change window status to "movingWidget"
     * (3) let the window to listen to "mouse move" and "mouse up" events
     * (4) reset real and virtual styles of this widget, flush
     * right mouse button down (button code 2)
     * (1) select this widget or whole group, flush widgets
     * (2) tell main process to show context menu
     */
    _handleMouseDown = (event: React.MouseEvent): void => {
        // hide context menu
        g_widgets1.getRoot().getDisplayWindowClient().getContextMenu().hideElement();

        // do not preventDefault in operating mode, otherwise the input box cannot be blurred
        if (g_widgets1.isEditing()) {
            event.preventDefault();
        }


        // do nothing when we are creating widget
        if (g_widgets1.getRendererWindowStatus() === rendererWindowStatus.creatingWidget) {
            return;
        }


        if (event.button == 0) {
            if (g_widgets1.isEditing()) {

                // do nothing in operation mode
                if (g_widgets1.getRendererWindowStatus() === rendererWindowStatus.operating) {
                    return;
                }
                // (1)
                this.selectOnMouseDown(false, event.shiftKey);
                // (2)
                g_widgets1.setRendererWindowStatus(rendererWindowStatus.movingWidget);
                // (3)
                window.addEventListener("mousemove", this._handleMouseMove);
                window.addEventListener("mouseup", this._handleMouseUp);
                // (4)
                let group = g_widgets1.getGroupSelection2();
                group.reset(true);
            } else {
                // do nothing
            }
        } else if (event.button === 2) {
            if (g_widgets1.isEditing()) {
                if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.creatingWidget) {
                    // (1)
                    this.selectOnMouseDown(true, event.shiftKey);
                    // (2)
                    g_widgets1.getRoot().getDisplayWindowClient().showContextMenu(this.getWidgetKey(), [event.clientX, event.clientY]);
                } else {
                    // do nothing
                }
            } else {
                // handled in Root.startToListen()
                // In some displays, several widgets are overlayed together. Some read-type widgets, such as Label, TextUpdate, and Rectangle, are
                // on top of control-type widgets. In this case, the read-type widgets block the left-button event for the control-type widgets.
                // To solve this problem, we set all the non-control-type widgets, basically the CSS "Graphics" and "Monitors" widgets, to
                // ignore all mouse events in operating mode by using `pointerEvents: g_widgets1.isEditing() ? "auto" : "none"`
                // However, this causes an issue that the right-mouse button down events on these widgets are ignored in operating mode.
                // To solve this problem, we fire up the mouse right-button event using a global function in Root.
                // It iterates through all widgets reversely, compare the mouse position and the widget's dimension, determine
                // if the mouse right-click is on this widget.
                // This mechanism applies to Canvas and all BaseWidgets.
                // g_widgets1.getRoot().getDisplayWindowClient().showContextMenu(this.getWidgetKey());
            }
        } else {
            // todo other buttons
        }
    };

    // handler when this widget is being moved by mouse, the window state should be "movingWidget"
    // the mouse left button has been pushed down
    // (1) set the this._readyToDeselect bit to false: once the widget moves, the widget is not deselected when shift is pressed down
    // (2) move "GroupSelection2" as a whole, do not flush
    // (3) udpate sidebar with flush
    _handleMouseMove = (event: any) => {
        event.preventDefault();

        if (!(g_widgets1.getRendererWindowStatus() === rendererWindowStatus.movingWidget)) {
            return;
        }

        // (1)
        this._readyToDeselect = false;
        // (2)
        let group: GroupSelection2 = g_widgets1.getGroupSelection2();
        let dx = event.movementX;
        let dy = event.movementY;
        group.move(dx, dy, false);

        // (3)
        g_widgets1.updateSidebar(true);
    };

    // handler for
    // (1) set window status back to "editing"
    // (2) remove "mouse move" and "mouse up" event listeners
    // (3) if shift key is being pressed and this widget is slected, deselect it
    // (4) update individual widgets' coordinates, do not flush
    // (5) reset real and virtual styles of the GroupSelection2, do not flush
    // (6) update sidebar with flush
    // (7) save history if widgets are moved
    _handleMouseUp = (event: any) => {
        event.preventDefault();
        // (1)
        g_widgets1.setRendererWindowStatus(rendererWindowStatus.editing);
        // (2)
        window.removeEventListener("mousemove", this._handleMouseMove);
        window.removeEventListener("mouseup", this._handleMouseUp);

        //
        const channelNamePeekDivId = g_widgets1.getChannelNamePeekDivId();
        g_widgets1.setChannelNamePeekDivId("");
        const channelNamePeekDiv = document.getElementById(channelNamePeekDivId);
        channelNamePeekDiv?.remove();

        // (3)
        if (this._readyToDeselect) {
            this.simpleDeselect(false);
            this._readyToDeselect = false;
        }

        // (4)
        let group: GroupSelection2 = g_widgets1.getGroupSelection2();
        const dx = group.getStyle().left;
        const dy = group.getStyle().top;
        [...group.getWidgets().values()].map((widget: any) => {
            (widget as BaseWidget).move(dx, dy, false);
        });
        // (5)
        group.reset(false);
        // (6)
        g_widgets1.updateSidebar(true);
        // (7)
        if (dx !== 0 || dy !== 0) {
            const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
            history.registerAction();
        }
    };

    _handleMouseDoubleClickOnResizer = (event: MouseEvent) => {
        event.preventDefault();
        this._handleMouseDoubleClick(event);
    }

    // (1) set window state to "resizingX"
    // (2) create the custom "mouse move" and "mouse up" listener functions
    // (3) let the window to listen to "mouse move" and "mouse up" events
    // (4) reset real and virtual styles of GroupSelection2, no flush,
    // (5) save init virtual values in GroupSelection2, ready to resize
    //     no flush in this function
    _handleMouseDownOnResizer(event: MouseEvent, index: "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H") {
        event.preventDefault();
        if (event.ctrlKey === true && event.button === 0) {
            this._handleMouseDown(event);
            return;
        }
        if (event.button === 2) { // right click on resizer
            this._handleMouseDown(event)
            return;
        }


        // (1)
        g_widgets1.setRendererWindowStatus(rendererWindowStatus[`resizingWidget${index}`]);
        // (2)
        // they are set back to undefined upon mouseUpOnResizer
        if (this._tmp_mouseMoveOnResizerListener === undefined && this._tmp_mouseUpOnResizerListener === undefined) {
            this._tmp_mouseMoveOnResizerListener = (event: any) => this._handleMouseMoveOnResizer(event, index);
            this._tmp_mouseUpOnResizerListener = (event: any) => this._handleMouseUpOnResizer(event, index);
        }
        // (3)
        window.addEventListener("mousemove", this._tmp_mouseMoveOnResizerListener);
        window.addEventListener("mouseup", this._tmp_mouseUpOnResizerListener);
        // (4)
        let group = g_widgets1.getGroupSelection2();
        group.reset(false);
        // (5)
        // group.saveInitValues(event.clientX, event.clientY);
        group.saveInitValues(getMouseEventClientX(event), getMouseEventClientY(event));
    }


    // (1) resize all elements in GroupSelection2
    // (2) update sidebar with flush
    _handleMouseMoveOnResizer = (event: any, index: "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H") => {
        event.preventDefault();

        if (!rendererWindowStatus[g_widgets1.getRendererWindowStatus()].includes("resizingWidget")) {
            return;
        }

        // (1)
        let group = g_widgets1.getGroupSelection2();
        // group.resize(event.clientX, event.clientY, index, false);
        group.resize(getMouseEventClientX(event), getMouseEventClientY(event), index, false);
        // (2)
        g_widgets1.updateSidebar(true);
    };

    // (1) set window state to "editing"
    // (2) remove "mouse move" and "mouse up" listeners
    // (3) set the "mouse move" and "mouse up" listener functions to undefined
    // (4) reset real and virtual styles of the GroupSelection2, do not flush
    // (5) update sidebar with flush
    // (6) if the mouse is moved, add this event to history
    _handleMouseUpOnResizer(event: any, index: "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H") {
        event.preventDefault();
        // (1)
        g_widgets1.setRendererWindowStatus(rendererWindowStatus.editing);
        // (2)
        // this step must be before next step
        window.removeEventListener("mousemove", this._tmp_mouseMoveOnResizerListener);
        window.removeEventListener("mouseup", this._tmp_mouseUpOnResizerListener);
        // (3)
        this._tmp_mouseMoveOnResizerListener = undefined;
        this._tmp_mouseUpOnResizerListener = undefined;
        // (4)
        let group = g_widgets1.getGroupSelection2();
        group.reset(false);
        // (5)
        g_widgets1.updateSidebar(true);
        // (6)
        // if (group.getCursorX0() !== event.clientX || group.getCursorY0() !== event.clientY) {
        if (group.getCursorX0() !== getMouseEventClientX(event) || group.getCursorY0() !== getMouseEventClientY(event)) {
            const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
            history.registerAction();
        }
    }

    _handleMouseDoubleClick = (event: MouseEvent): void => {
        if (g_widgets1.isEditing()) {
            this.selectOnMouseDoubleClick(true);
        } else {
            // do nothing
        }
    };

    // ----------------------------- select/deselect widget ----------------------------

    /**
     * Select this widget without updating sidebar.
     *
     * (1) change style inside widget
     *
     * (2) migrate this widget from g_widgets1._widgets to GroupSelection2._widgets
     *
     * (3) add this widget to forceUpdate list
     *
     * (4) flush widgets, do not touch others
     */
    simpleSelect = (doFlush: boolean) => {
        // (1)
        if (this.isSelected()) {
            // already selected
            return;
        } else {
            this.getStyle().outlineStyle = "solid";
        }
        // (4)
        const group = g_widgets1.getGroupSelection2();
        group.migrateWidget(this.getWidgetKey());
        // (3)
        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        if (doFlush) {
            // (3)
            g_flushWidgets();
        }
    };

    /**
     * Deselect this widget without updating sidebar.
     *
     * Sidebar is not updated.
     *
     * (1) change style inside widget
     *
     * (2) migrate this widget back to g_widgets1._widgets
     *
     * (3) add this widget to forceUpdate list
     *
     * (4) flush widgets, do not touch others
     * @param {boolean} doFlush If flush the widgets
     */
    simpleDeselect = (doFlush: boolean) => {
        // (1)
        if (!this.isSelected()) {
            return;
        } else {
            this.getStyle().outlineStyle = "none";
        }
        // (2)
        const group = g_widgets1.getGroupSelection2();
        group.migrateWidgetBack(this.getWidgetKey());
        // (3)
        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        if (doFlush) {
            // (4)
            g_flushWidgets();
        }
    };

    /**
     * Delect all widgets in the top group that this widget belongs to.
     *
     * Note: Sidebar is not updated.
     *
     * (1) get all widgets inside the top group, each widget must have a group property.
     *
     * (2) select all widgets in this group.
     */
    simpleSelectGroup = (doFlush: boolean) => {
        if (!this.isInGroup()) {
            return;
        }
        // (1)
        const topGroupName = this.getTopGroupName();
        for (let [, widget] of g_widgets1.getWidgets2()) {
            if (widget instanceof BaseWidget && widget.getTopGroupName() === topGroupName) {
                widget.simpleSelect(doFlush);
            }
        }
    };

    /**
     * Deselect all widgets in the top group that this widget belongs to.
     *
     * Note: Sidebar is not updated.
     *
     * (1) get all widgets inside this group, each widget must have a group property.
     *
     * (2) deselect all widgets in this group.
     */
    simpleDeselectGroup = (doFlush: boolean) => {
        if (!this.isInGroup()) {
            return;
        }
        const topGroupName = this.getTopGroupName();
        // (1)
        for (let [, widget] of g_widgets1.getWidgets2()) {
            if (widget instanceof BaseWidget && widget.getTopGroupName() === topGroupName) {
                widget.simpleDeselect(doFlush);
            }
        }
    };

    /**
     * Select the widget when the mouse is moving
     *
     * Invoked in MouseSelectionRegion._updateSelection()
     *
     * Whether to select this widget or the whole group is determined in MouseSelectionRegion._updateSelection()
     */
    selectOnMouseMove() {
        const thisWidgetSelected = this.isSelected();
        if (this.isInGroup()) {
            this.simpleSelectGroup(false);
        } else {
            this.simpleSelect(false);
        }
        // flush is handled in MouseSelectionRegion.updateSelection()
    }

    /**
     * Select the widget when the mouse left button is pressed <br>
     *
     * When we select a widget, depending on how we select it and the widget's status, there may be side effects.<br>
     *
     * e.g. when the mouse is moving and shift key is pressed down, or when the mouse is pressed down and this widget is in a group.
     * Another example is if a widget belongs to a group, and this group belongs to another group, when we select this widget, all
     * widgets in top-most group must be selected as a whole. <br>
     *
     * (i) mouse status: mouse-move, mouse-down, and mouse-double-click <br>
     *
     * (ii) shift key is pressed <br>
     *
     * (iii) this widget is in one or multiple groups
     * @param {boolean} doFlush If the widgets are flushed.
     * @param {boolean} shiftKeyIsDown If the shift key is pressed.
     */
    selectOnMouseDown(doFlush: boolean = true, shiftKeyIsDown: boolean = false) {
        const thisWidgetSelected = this.isSelected();
        if (this.isInGroup()) {
            if (shiftKeyIsDown) {
                if (thisWidgetSelected) {
                    // mouse-down + widget in group + shift key down + widget already selected --> deselect this group without touching others

                    // desele all widgets in this group, do not touch anybody else
                    this.simpleDeselectGroup(false);
                } else {
                    // mouse-down + widget in group + shift key down + widget not selected --> select this group without touching others

                    // select all widgets in this group, do not touch anybody else
                    this.simpleSelectGroup(false);
                }
            } else {
                if (thisWidgetSelected) {
                    // mouse-down + widget in group + shift key up + widget already selected --> do nothing
                    return;
                } else {
                    // mouse-down + widget in group + shift key up + widget not selected --> select this group only

                    // deselect all widgets
                    g_widgets1.deselectAllWidgets(false);
                    // select all widgets in this group
                    this.simpleSelectGroup(false);
                }
            }
        } else {
            // 2 dimensions, totally 4 cases
            // (1) shift key pressed or not
            // (2) this widget has been selected or not

            if (shiftKeyIsDown) {
                if (thisWidgetSelected) {
                    // the behavior is deferred, depending on the mouse motion afterward:
                    // mouse-down + widget not group + shift key down + widget already selected + mouse moves afterward --> select this widget
                    // mouse-down + widget not group + shift key down + widget already selected + mouse up afterward --> deselect this widget

                    // ready to deselect this widget
                    // it is used in this._handleMouseMove() and this._handleMouseUp() to decide the behavior
                    this._readyToDeselect = true;
                    return;
                } else {
                    // mouse-down + widget not group + shift key down + widget not selected --> select this widget

                    // select the widget
                    this.simpleSelect(false);
                }
            } else {
                if (thisWidgetSelected) {
                    // mouse-down + widget not group + shift key up + widget already selected --> do nothing
                    return;
                } else {
                    // mouse-down + widget not group + shift key up + widget not selected --> select this widget only

                    // de-select all other widgets, do not flush
                    g_widgets1.deselectAllWidgets(false);
                    // select this widget without updating the sidebar or flush
                    this.simpleSelect(false);
                }
            }
        }

        // update sidebar
        g_widgets1.updateSidebar(doFlush);
        if (doFlush) {
            g_flushWidgets();
        }
    }

    /**
     * Select the widget when the mouse left button double clicks, select and only select this widget.
     *
     * The shift key is ignore
     *
     * The group is ignored
     */
    selectOnMouseDoubleClick = (doFlush: boolean = true) => {
        // deselect all widget
        g_widgets1.deselectAllWidgets(false);
        // select this widget only
        this.simpleSelect(doFlush);
        // update sidebar
        g_widgets1.updateSidebar(doFlush);
    };

    /**
     * Move this widget on Canvas. It does not update sidebar. To update sidebar, g_widgets1.updateSidebar()
     * should be invoked.
     *
     * (1) update style
     *
     * (2) add to forceUpdateWidgets
     *
     * (3) flush
     * @param {number} dx Number of pixels in x-direction
     * @param {number} dy Number of pixels in y-directions
     * @param {number} flush If we want to flush the widgets
     */
    move = (dx: number, dy: number, flush: boolean) => {
        // (1)
        if (dx === 0 && dy === 0) {
            return;
        }
        this.getStyle().left = this.getStyle().left + dx;
        this.getStyle().top = this.getStyle().top + dy;
        // (2)
        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        // (3)
        if (flush) {
            g_flushWidgets();
        }
    };

    /**
     * Resize the widget <br>
     *
     * (1) update style <br>
     *
     * (2) add to forceUpdateWidgets <br>
     *
     * (3) flush <br>
     * @param {number} left New left
     * @param {number} top New top
     * @param {number} width New width
     * @param {number} height New height
     * @param {boolean} flush If we want to flush the widgets
     *
     */
    resize = (left: number, top: number, width: number, height: number, flush: boolean) => {
        // (1)
        this.getStyle().left = left;
        this.getStyle().top = top;
        this.getStyle().width = width;
        this.getStyle().height = height;
        // (2)
        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        // (3)
        if (flush) {
            g_flushWidgets();
        }
    };

    // ------------------------------ group ------------------------------------

    // group operations are only applied to the highest level group

    addToGroup = (groupName: string) => {
        this.getGroupNames().push(groupName);
    };

    // remove from the top group
    removeFromGroup = (): void => {
        this.getGroupNames().pop();
    };

    // ------------------------------ elements ---------------------------------

    // element = <> body (area + resizer) + sidebar </>

    // Body + sidebar
    abstract _ElementRaw: () => React.JSX.Element;
    abstract _Element: React.MemoExoticComponent<() => React.JSX.Element>;

    // resizers are available for all widgets
    // 8 resizers, consumes a lot of resources when rendering
    // abstract _ElementResizerRaw: () => React.JSX.Element;
    _ElementResizerRaw = (): React.JSX.Element => {
        return (
            <>
                {/* order is important: BDFH -> ACEG */}
                <div style={this.getResizerStyles().B} onMouseDown={(event: any) => this._handleMouseDownOnResizer(event, "B")} onDoubleClick={this._handleMouseDoubleClickOnResizer} onContextMenu={(event) => { event?.preventDefault() }}></div>
                <div style={this.getResizerStyles().D} onMouseDown={(event: any) => this._handleMouseDownOnResizer(event, "D")} onDoubleClick={this._handleMouseDoubleClickOnResizer} onContextMenu={(event) => { event?.preventDefault() }}></div>
                <div style={this.getResizerStyles().F} onMouseDown={(event: any) => this._handleMouseDownOnResizer(event, "F")} onDoubleClick={this._handleMouseDoubleClickOnResizer} onContextMenu={(event) => { event?.preventDefault() }}></div>
                <div style={this.getResizerStyles().H} onMouseDown={(event: any) => this._handleMouseDownOnResizer(event, "H")} onDoubleClick={this._handleMouseDoubleClickOnResizer} onContextMenu={(event) => { event?.preventDefault() }}></div>
                <div style={this.getResizerStyles().A} onMouseDown={(event: any) => this._handleMouseDownOnResizer(event, "A")} onDoubleClick={this._handleMouseDoubleClickOnResizer} onContextMenu={(event) => { event?.preventDefault() }}></div>
                <div style={this.getResizerStyles().C} onMouseDown={(event: any) => this._handleMouseDownOnResizer(event, "C")} onDoubleClick={this._handleMouseDoubleClickOnResizer} onContextMenu={(event) => { event?.preventDefault() }}></div>
                <div style={this.getResizerStyles().E} onMouseDown={(event: any) => this._handleMouseDownOnResizer(event, "E")} onDoubleClick={this._handleMouseDoubleClickOnResizer} onContextMenu={(event) => { event?.preventDefault() }}></div>
                <div style={this.getResizerStyles().G} onMouseDown={(event: any) => this._handleMouseDownOnResizer(event, "G")} onDoubleClick={this._handleMouseDoubleClickOnResizer} onContextMenu={(event) => { event?.preventDefault() }}></div>
            </>
        );
    };
    _ElementResizer = React.memo(this._ElementResizerRaw, () => this._useMemoedElement());

    _ElementFallback = () => {
        let left = 0;
        let top = 0;
        let width = 100;
        let height = 100;
        let widgetKey = this.getWidgetKey();
        const style = this.getStyle();
        if (style !== undefined && style !== null) {
            left = this.getStyle()["left"];
            top = this.getStyle()["top"];
            width = this.getStyle()["width"];
            height = this.getStyle()["height"];
        }
        return (
            <div
                style={{
                    position: "absolute",
                    display: "inline-flex",
                    alignItems: "flex-start",
                    justifyContent: "flex-start",
                    // dimensions
                    left: left,
                    top: top,
                    width: width,
                    height: height,
                    backgroundColor: "rgba(255, 255, 0, 1)",
                    // angle
                    transform: "rotate(0deg)",
                    // border, it is different from the "alarmBorder" below,
                    borderStyle: "solid",
                    borderWidth: 1,
                    borderColor: "rgba(255, 0, 0, 1)",
                    // font
                    color: "rgba(255,0,0,1)",
                    fontFamily: GlobalVariables.defaultFontFamily,
                    fontSize: GlobalVariables.defaultFontSize,
                    fontStyle: GlobalVariables.defaultFontStyle,
                    fontWeight: GlobalVariables.defaultFontWeight,
                    // shows when the widget is selected
                    outlineStyle: "none",
                    outlineWidth: 1,
                    outlineColor: "black",
                }}
            >
                TDM internal error on widget {widgetKey}
            </div>
        );
    };

    getElementFallbackFunction = () => {
        return this._ElementFallback;
    };

    getElement = () => {
        return <this._Element key={this.getWidgetKey()}></this._Element>;
    };

    getSidebarElement = () => {
        return this.getSidebar()?.getElement();
    };

    // -------------------- helper functions ----------------

    showSidebar = (): boolean => {
        const result = g_widgets1.isEditing() && g_widgets1.getSidebarWidgetKey() === this.getWidgetKey();
        return result;
    };

    showResizers = (): boolean => {
        return this.isSelected();
    };

    _useMemoedElement(): boolean {
        if (g_widgets1.getForceUpdateWidgets().has(this.getWidgetKey()) === true || this.widgetBeingRendered === true) {
            return false;
        } else {
            return true;
        }
    }

    hasChannel = (channelName: string): boolean => {
        return this.getChannelNames().includes(channelName);
    };

    isInGroup = (): boolean => {
        return this.getGroupNames().length !== 0;
    };

    isSelected = (): boolean => {
        return this.getStyle().outlineStyle === "none" ? false : true;
    };
    // ----------------------- styles -----------------------

    private _resizerStyle: Record<string, number | string> = {
        backgroundColor: "transparent",
        position: "absolute",
        opacity: 1,
        width: 10,
        height: 10,
        display: "inline-flex",
    };

    _resizerStyles: Record<string, any> = {
        A: {
            backgroundColor: "transparent",
            position: "absolute",
            opacity: 1,
            width: 10,
            height: 10,
            display: "inline-flex",
            left: -5,
            top: -5,
            cursor: "nwse-resize",
        },
        B: {
            backgroundColor: "transparent",
            position: "absolute",
            opacity: 1,
            // width: 10,
            height: 10,
            left: 5,
            top: -5,
            width: "100%",
            cursor: "ns-resize",
        },
        C: {
            backgroundColor: "transparent",
            position: "absolute",
            opacity: 1,
            width: 10,
            height: 10,
            right: -5,
            top: -5,
            cursor: "nesw-resize",
        },
        D: {
            backgroundColor: "transparent",
            position: "absolute",
            opacity: 1,
            width: 10,
            // height: 10,
            right: -5,
            top: 5,
            cursor: "ew-resize",
            height: "100%",
        },
        E: {
            backgroundColor: "transparent",
            position: "absolute",
            opacity: 1,
            width: 10,
            height: 10,
            right: -5,
            bottom: -5,
            cursor: "nwse-resize",
        },
        F: {
            backgroundColor: "transparent",
            position: "absolute",
            opacity: 1,
            // width: 10,
            height: 10,
            left: 5,
            bottom: -5,
            cursor: "ns-resize",
            width: "100%",
        },
        G: {
            backgroundColor: "transparent",
            position: "absolute",
            opacity: 1,
            width: 10,
            height: 10,
            left: -5,
            bottom: -5,
            cursor: "nesw-resize",
        },
        H: {
            backgroundColor: "transparent",
            position: "absolute",
            opacity: 1,
            width: 10,
            // height: 10,
            top: 5,
            left: -5,
            cursor: "ew-resize",
            height: "100%",
        },
    };

    private _resizerStyles0: Record<string, any> = {
        A: {
            ...this._resizerStyle,
            left: -5,
            top: -5,
            cursor: "nwse-resize",
        },
        B: {
            ...this._resizerStyle,
            left: 5,
            top: -5,
            width: "100%",
            cursor: "ns-resize",
        },
        C: {
            ...this._resizerStyle,
            right: -5,
            top: -5,
            cursor: "nesw-resize",
        },
        D: {
            ...this._resizerStyle,
            right: -5,
            top: 5,
            cursor: "ew-resize",
            height: "100%",
        },
        E: {
            ...this._resizerStyle,
            right: -5,
            bottom: -5,
            cursor: "nwse-resize",
        },
        F: {
            ...this._resizerStyle,
            left: 5,
            bottom: -5,
            cursor: "ns-resize",
            width: "100%",
        },
        G: {
            ...this._resizerStyle,
            left: -5,
            bottom: -5,
            cursor: "nesw-resize",
        },
        H: {
            ...this._resizerStyle,
            top: 5,
            left: -5,
            cursor: "ew-resize",
            height: "100%",
        },
    };


    // -------------------------- tdl -------------------------------
    abstract generateDefaultTdl: () => any;

    /**
     * Verify if a tdl object is valid by comparing the provided tdl and the
     * widget's default tdl
     * 
     * This verification is minimum: for each widget type, the 
     * 
     * The tdl properties should be reasonable, e.g. the width should be reasonable number
     */
    verifyWidgetTdl(tdl: Record<string, any>) {

        if (typeof (tdl["type"]) !== "string") {
            return false;
        }
        if (typeof (tdl["widgetKey"]) !== "string") {
            return false;
        }
        if (typeof (tdl["key"]) !== "string") {
            return false;
        }

        // tdl["style"]
        const style = tdl["style"];
        if (typeof (style) !== "object") {
            return false;
        }
        if (typeof (style["position"]) !== "string") {
            return false;
        }
        if (typeof (style["display"]) !== "string") {
            return false;
        }
        if (typeof (style["left"]) !== "number") {
            return false;
        }
        if (typeof (style["top"]) !== "number") {
            return false;
        }
        if (typeof (style["width"]) !== "number" && style["width"] !== "100%") {
            return false;
        }
        if (typeof (style["height"]) !== "number" && style["height"] !== "100%") {
            return false;
        }
        // the widget must be in visible region
        if (style["width"] !== "100%" && style["height"] !== "100%") {
            if (style["left"] + style["width"] <= 0) {
                return false;
            }
            if (style["top"] + style["height"] <= 0) {
                return false;
            }
        }
        if (!GlobalMethods.isValidRgbaColor(style["backgroundColor"])) {
            return false;
        }
        if (!GlobalMethods.isValidRgbaColor(style["color"])) {
            return false;
        }
        if (typeof (style["fontFamily"]) !== "string") {
            return false;
        }
        if (typeof (style["fontSize"]) !== "number") {
            return false;
        }
        // font size should be reasonable
        if (style["fontSize"] < 5 || style["fontSize"] > 150) {
            return false;
        }
        if (typeof (style["fontWeight"]) !== "string") {
            return false;
        }
        if (typeof (style["fontStyle"]) !== "string") {
            return false;
        }
        if (typeof (style["position"]) !== "string") {
            return false;
        }

        // tdl["text"]
        if (typeof (tdl["text"]) !== "object") {
            return false;
        }

        // tdl["channelNames"]
        if (!GlobalMethods.isStringArray(tdl["channelNames"])) {
            return false;
        }

        // tdl["groupNames"]
        if (!GlobalMethods.isStringArray(tdl["groupNames"])) {
            return false;
        }

        // tdl["rules"]
        if (!GlobalMethods.isRuleElementArray(tdl["rules"])) {
            return false;
        }

        return true;
    }

    initStyle = (widgetTdl: Record<string, any>) => {
        this.setStyle(GlobalMethods.deepMerge(this.generateDefaultTdl().style, widgetTdl.style));
    }

    initText = (widgetTdl: Record<string, any>) => {
        this.setText(GlobalMethods.deepMerge(this.generateDefaultTdl().text, widgetTdl.text));
    }

    /**
     * Generate the JSON representation for this widget
     * @param {boolean} newKey if given a new widget key
     * @returns {Record<string, any>} JSON representation of this widget
     */
    getTdlCopy(newKey: boolean = true): Record<string, any> {
        const result: Record<string, any> = {
            type: this.getType(),
            widgetKey: this.getWidgetKey(),
            key: this.getWidgetKey(),
            style: JSON.parse(JSON.stringify(this.getStyle())),
            text: JSON.parse(JSON.stringify(this.getText())),
            // channelNames: [...this.getChannelNames()],
            // the un-processed channel names
            channelNames: [...this.getChannelNamesLevel0()],
            groupNames: [...this.getGroupNames()],
            rules: JSON.parse(JSON.stringify(this.getRulesTdl())),
        };
        // deselect tdl
        result.style.outlineStyle = "none";
        // new key
        if (newKey) {
            const widgetKey = this.getType() + "_" + GlobalMethods.generateNewWidgetKey();
            result.widgetKey = widgetKey;
            result.key = widgetKey;
        }
        return result;
    }

    /**
     * Combining original style and the rules style, for read-only purpose. Do not modify it. <br>
     *
     * Rules style, this._rulesStyle, is updated everytime the widget is re-rendered.
     *
     */
    getAllStyle = () => {
        // return { ...this.getStyle(), ...this.getRulesStyle() };
        return this._allStyle;
    };

    /**
     * Combining original text and the rules text, for read-only purpose. Do not modify it. <br>
     *
     * Rules text, this._rulesText, is updated everytime the widget is re-rendered.
     *
     */
    getAllText() {
        // return { ...this.getText(), ...this.getRulesText() };
        return this._allText;
    }

    /**
     * Update this._allText and this._allStyle based on new rules
     */
    updateAllStyleAndText = () => {
        this.setRulesStyle({});
        this.setRulesText({});
        const rulesValues = this.getRules()?.getValues();
        if (rulesValues !== undefined) {
            this.setRulesStyle(rulesValues["style"]);
            this.setRulesText(rulesValues["text"]);
        }
        this.setAllStyle({ ...this.getStyle(), ...this.getRulesStyle() });
        this.setAllText({ ...this.getText(), ...this.getRulesText() });
    }

    getElementBodyRawStyle = () => {
        const allStyle = this.getAllStyle();
        const allText = this.getAllText();
        const result: Record<string, any> = {
            ...allStyle,

            left: allStyle["left"] - allStyle["borderWidth"],
            top: allStyle["top"] - allStyle["borderWidth"],
            opacity: allText["invisibleInOperation"] === true && !g_widgets1.isEditing() ? 0 : 1,
            // if it is a readback-type widget, we skip the mouse left-button-down event in operating mode, 
            // the "read" type widget is transparent to any mouse button
            // the right/mid-button-down event is handled in a global function in DisplayWindowClient
            pointerEvents: this.getReadWriteType() === "read" && !g_widgets1.isEditing() ? "none" : "auto",
        };
        return result;
    };

    // --------------------- getters -------------------------
    getChannelNamesLevel0 = () => {
        return this._channelNamesLevel0;
    }
    getChannelNamesLevel1 = () => {
        return this._channelNamesLevel1;
    }
    getChannelNamesLevel2 = () => {
        return this._channelNamesLevel2;
    }
    getChannelNamesLevel3 = () => {
        return this._channelNamesLevel3;
    }
    getChannelNamesLevel4 = () => {
        return this._channelNamesLevel4;
    }

    getType = (): string => {
        return this._type;
    };

    getWidgetKey = (): string => {
        return this._widgetKey;
    };

    getStyle = () => {
        return this._style;
    };

    getText = (): Record<string, any> => {
        return this._text;
    };

    getSidebar = (): BaseWidgetSidebar | undefined => {
        return this._sidebar;
    };


    // the highest level group it belongs to
    getTopGroupName = (): string | undefined => {
        return this._groupNames[this._groupNames.length - 1];
    };

    getGroupNames = () => {
        return this._groupNames;
    };

    // defined in sidebar, invoked in main widget (actually somewhere else)
    // use a function call to obtain this._sidebar.updateFromWidget as the useState hook may change in the sidebar
    getUpdateFromWidget = () => {
        return this.getSidebar()?.updateFromWidget;
    };

    getResizerStyle = () => {
        return this._resizerStyle;
    };

    // todo: improve efficiency
    getResizerStyles = () => {
        let result = JSON.parse(JSON.stringify(this._resizerStyles));
        let w0 = this.getStyle()["borderWidth"];
        // for borderType === "inside", they do not have style["borderWidth"] property
        if (w0 === undefined) {
            w0 = 0;
        }
        const rW = `${100 * (1 + (2 * w0) / this.getStyle()["width"])}%`;
        const rH = `${100 * (1 + (2 * w0) / this.getStyle()["height"])}%`;

        result["A"]["left"] = -5 - w0;
        result["G"]["left"] = -5 - w0;
        result["H"]["left"] = -5 - w0;
        result["B"]["left"] = -5 - w0;
        result["F"]["left"] = -5 - w0;
        result["A"]["top"] = -5 - w0;
        result["B"]["top"] = -5 - w0;
        result["C"]["top"] = -5 - w0;
        result["D"]["top"] = -5 - w0;
        result["H"]["top"] = -5 - w0;
        result["C"]["right"] = -5 - w0;
        result["D"]["right"] = -5 - w0;
        result["E"]["right"] = -5 - w0;
        result["E"]["bottom"] = -5 - w0;
        result["F"]["bottom"] = -5 - w0;
        result["G"]["bottom"] = -5 - w0;
        result["B"]["width"] = rW;
        result["F"]["width"] = rW;
        result["D"]["height"] = rH;
        result["H"]["height"] = rH;
        return result;
    };

    getReadWriteType = () => {
        return this._readWriteType;
    };
    setReadWriteType = (newType: "read" | "write") => {
        this._readWriteType = newType;
    };

    getRulesStyle = () => {
        return this._rulesStyle;
    };

    getRulesText = () => {
        return this._rulesText;
    };

    getEmbeddedDisplayWidgetKey = () => {
        return this._embeddedDisplayWidgetKey;
    }

    setEmbeddedDisplayWidgetKey = (newKey: string) => {
        this._embeddedDisplayWidgetKey = newKey;
    }
    // ---------------------- setters -------------------------

    setStyle = (newStyle: Record<string, any>) => {
        this._style = newStyle;
    };

    setText = (newText: Record<string, any>) => {
        this._text = newText;
    };

    setAllStyle = (newAllStyle: Record<string, any>) => {
        this._allStyle = newAllStyle;
    }

    setAllText = (newAllText: Record<string, any>) => {
        this._allText = newAllText;
    }


    setRulesStyle = (newStyle: Record<string, any>) => {
        this._rulesStyle = newStyle;
    };

    setRulesText = (newText: Record<string, any>) => {
        this._rulesText = newText;
    };

    // -------------------------------------- channel names ---------------------------------

    setChannelNamesLevel0 = (newNames: string[]) => {
        this._channelNamesLevel0 = newNames;
    }


    /**
     * Starting from level-0 channel names, update level-1/2/3 channel names from
     * the up-to-date macros
     * 
     * @param [widgetMacros=[]] the externally provided macros, this does not include the Canvas-provided 
     *                          macros. This macros could be from users, parent widget, and others.
     */
    processChannelNames(widgetMacros: [string, string][] = [], removeDuplicated: boolean = true) {
        this._channelNamesLevel1 = [];
        this._channelNamesLevel2 = [];
        this._channelNamesLevel3 = [];
        this._channelNamesLevel4 = [];
        if (g_widgets1.isEditing()) {
            return;
        }
        const canvas = g_widgets1.getWidget2("Canvas");
        if (!(canvas instanceof Canvas)) {
            const errMsg = "No Canvas widget";
            throw new Error(errMsg);
        }
        // const macros = [...widgetMacros, ...canvas.getAllMacros()];
        const macros = this.getAllMacros();

        // ------------ level 1 --------------
        // (1) formula channel name or regular channel name
        let resultLevel1: string[] = [];
        let isCalcChanenl = false;
        // obtain regular channel name from formula channel
        if (this.getChannelNamesLevel0()[0] !== undefined
            && this.getChannelNamesLevel0()[0].includes("[")
            && this.getChannelNamesLevel0()[0].includes("]")
            && !this.getChannelNamesLevel0()[0].includes("loc://")
            && !this.getChannelNamesLevel0()[0].includes("glb://")
            // ! improve: be able to use local channels
            // && TcaChannel.checkChannelName(this.getChannelNamesLevel0()[0]) !== "loc://" 
            // && TcaChannel.checkChannelName(this.getChannelNamesLevel0()[0]) !== "glb://"
        ) {
            // isCalcChanenl = true;
            // this is a formula-based PV, like "[val0] + 5", "=[val0] / 2"
            // only the first one is used
            let eqChannelStr = this.getChannelNamesLevel0()[0];
            const stringResult = this.parseString(eqChannelStr);
            this.setEqChannelArray(stringResult["result"]);
            this.setEqChannelNameIndices(stringResult["indices"]);
            resultLevel1 = [...stringResult["pvNames"]];
        } else {
            // regular channel name: epics or local
            for (const channelName of this.getChannelNamesLevel0()) {
                resultLevel1.push(channelName);
            }
        }
        // (2) rules channel name
        const rules = this.getRules();
        if (rules !== undefined) {
            // the .SEVR channel becomes its original channel name
            resultLevel1 = [...resultLevel1, ...rules.getRawChannelNames()];
        }

        // special case: .SEVR channel, append it base channel name. In case the server does not reply
        // the GET request for .SEVR, we can use the "severity" field value of dbr data in the base channel
        // for (const channelNameLevel1 of resultLevel1) {
        // for (let ii = 0; ii < resultLevel1.length; ii++) {
        //     const channelNameLevel1 = resultLevel1[ii];
        //     if (channelNameLevel1.endsWith(".SEVR")) {
        //         const rawChannelName = channelNameLevel1.replaceAll(".SEVR", "");
        //         this.getChannelNamesLevel0().push(rawChannelName);
        //         resultLevel1[ii] = rawChannelName;
        //     }
        // }

        if (removeDuplicated && !isCalcChanenl) {
            const resultSet = new Set(resultLevel1);
            this._channelNamesLevel1 = [...resultSet];
        } else {
            // do not remove duplicated channels if the main channel name is calc type
            this._channelNamesLevel1 = resultLevel1;
        }

        // ------------ level 2 --------------
        for (let channelNameLevel1 of this.getChannelNamesLevel1()) {
            const channelNameLevel2 = BaseWidget.extractLocalChannelName(channelNameLevel1);
            this.getChannelNamesLevel2().push(channelNameLevel2);
        }
        // ------------ level 3 --------------
        for (let channelNameLevel1 of this.getChannelNamesLevel1()) {
            const channelNameLevel3 = BaseWidget.expandChannelName(channelNameLevel1, macros, true);
            this.getChannelNamesLevel3().push(channelNameLevel3);
        }
        // ------------ level 4 --------------
        for (let channelNameLevel3 of this.getChannelNamesLevel3()) {
            const channelNameLevel4 = BaseWidget.extractLocalChannelName(channelNameLevel3);
            this.getChannelNamesLevel4().push(channelNameLevel4);
        }
    }

    static channelNameLevel3to4 = (channelNameLevel3: string) => {
        const channelNameLevel4 = BaseWidget.extractLocalChannelName(channelNameLevel3);
        return channelNameLevel4;
    }

    static channelNameLevel0to4 = (channelNameLevel0: string, macros: [string, string][] = []) => {
        // 0 --> 3
        const channelNameLevel3 = BaseWidget.expandChannelName(channelNameLevel0, macros, true);
        // 3 --> 4
        const channelNameLevel4 = this.channelNameLevel3to4(channelNameLevel3);
        return channelNameLevel4;
    }


    getChannelNames(): string[] {
        if (g_widgets1.getRendererWindowStatus() === rendererWindowStatus.operating) {
            return this.getChannelNamesLevel4();
        } else {
            return this.getChannelNamesLevel0();
        }
    }

    // ---------------------- formula channels ------------------------
    /**
     * Get channel names in this widget. <br>
     *
     * There are two places that channels reside: (1) channelNames; (2) rules <br>
     *
     * @returns {string[]} If the display is in editing mode, returns the raw channel names;
     * in operating mode, returns expanded names from macros.
     */

    parseString = (str: string) => {
        let inside = false;
        let pvName = "";
        let rest = "";
        let pvNames: string[] = [];
        let result: (string | number)[] = [];
        let indices: number[] = [];
        let bracketCount = 0;

        for (let ii = 0; ii < str.length; ii++) {
            const c = str[ii];
            if (c === "[") {
                bracketCount++;
                inside = true;
                if (rest !== "") {
                    result.push(rest);
                    rest = "";
                }
                continue;
            } else if (c === "]") {
                bracketCount--;
                inside = false;
                pvNames.push(pvName);
                pvName = "";
                result.push(pvNames.length - 1);
                indices.push(result.length - 1);
                continue;
            } else {
                if (inside) {
                    pvName = `${pvName}${c}`;
                } else {
                    rest = `${rest}${c}`;
                }
            }
        }
        // unbalanced pv names
        if (bracketCount !== 0) {
            return {
                pvNames: [],
                result: [],
                indices: [],
            };
        }
        result.push(rest);
        return {
            pvNames: pvNames,
            result: result,
            indices: indices,
        };
    };

    evaluateEqChannel = (): number | undefined => {
        if (g_widgets1.isEditing()) {
            return undefined;
        }
        const tmp: any[] = [...this.getEqChannelArray()];
        const channelNames = this.getChannelNamesLevel4();
        console.log("getEqChannelArray = ", this.getEqChannelArray())

        for (let index = 0; index < channelNames.length; index++) {
            const channelName = channelNames[index];
            // in some cases channelName is just a number
            if (!isNaN(parseFloat(channelName))) {
                tmp[this.getEqChannelNameIndices()[index]] = `${parseFloat(channelName)}`;
                continue;
            }
            try {
                // the val0.SEVR is a real channel on renderer and main processes
                // but it is interpreted as val0, and the value is the dbrData["severity"]
                const value = g_widgets1.getChannelValue(channelName, true);
                // if value === undefined, the channel value is a string "undefined",
                // i.e. the "[val0a]" is replaced by "undefined".
                // In this way we can write the rule like "[val0a] == undefined" to
                // determine if this channel exists, then apply the rules, e.g. hiding the widget
                // tmp[this._channelNameIndicesInBoolExpression[index]] = `${value}`;
                tmp[this.getEqChannelNameIndices()[index]] = `${value}`;
            } catch (e) {
                Log.error(e);
                return undefined;
            }
        }

        try {
            const result = evaluate(tmp.join(""));
            if (typeof result === "boolean") {
                return result === true ? 1 : 0;
            } else {
                return result;
            }
        } catch (e) {
            return undefined;
        }
    };

    getEqChannelArray = () => {
        return this._eqChannelArray;
    };
    getEqChannelNameIndices = () => {
        return this._eqChannelNameIndices;
    };
    setEqChannelArray = (newArray: (string | number)[]) => {
        this._eqChannelArray = newArray;
    };
    setEqChannelNameIndices = (newIndices: number[]) => {
        this._eqChannelNameIndices = newIndices;
    };

    // ----------------------------- static methods for channel names -------------------------------

    static extractLocalChannelName = (localChannelName: string) => {
        if (TcaChannel.checkChannelName(localChannelName) === "local" || TcaChannel.checkChannelName(localChannelName) === "global") {
            // return localChannelName.split(/[\(<]+/)[0];
            return localChannelName.split(/(=)|(:[\s]*\[)/)[0].trim()
        } else {
            return localChannelName;
        }
    };


    /**
     * Input could be: abc$(SYS), loc://abc$(SYS), loc://abc$(SYS)<number[]>, loc://abc$(SYS)<string>(ABC), glb://abc$(SYS)<string>(ABC)
     * 
     * The macro on at the beginning of macros array will be picked. <br>
     *
     * The macros may propagate, e.g. ["SYS", "${RNG}"], we have to expand it resursively.
     * 
     * The local/global channel name should not contain any initial value or type def
     */
    static expandChannelName(str: string, macros: [string, string][], honorDisplayWindowId: boolean = true) {
        try {
            let strTmp = str;
            let count = 0;
            const macros1 = [...macros];
            if (honorDisplayWindowId) {
                // const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
                // const displayWindowId = displayWindowClient.getWindowId();
                // macros1.push(["DID", displayWindowId]);
            }
            // local channel, add window ID: "@window_x-y"
            if (TcaChannel.checkChannelName(strTmp) === "local") {
                const displayWindowId = g_widgets1.getRoot().getDisplayWindowClient().getWindowId();
                // if the local channel is not addressed, add address (display window ID)
                // to prevent user mistakes, replace text after the first "@" to the current display window ID
                let tmp0 = this.extractLocalChannelName(strTmp);
                let tmp1 = tmp0.replace(/@.*/, "") + `@window_${displayWindowId}`;
                strTmp = strTmp.replace(tmp0, tmp1);
            }

            // loop no more than 10 times, this is practically enough for a value of macro is macro, 
            // like [["ABC", "$(DEF)"], ["DEF", "$(GHI)"], ["GHI", "Ring"]]
            for (let ii = 0; ii < 10; ii++) {
                for (const macro of macros) {
                    const name = macro[0];
                    const value = macro[1];
                    strTmp = strTmp.replaceAll("${" + name + "}", value).replaceAll("$(" + name + ")", value);
                }
                if ((!strTmp.includes("(")) && (!strTmp.includes("(")) && (!strTmp.includes("{")) && (!strTmp.includes("}"))) {
                    break;
                }
            }
            return strTmp;
        }
        catch (e) {
            Log.error(e);
            return str;
        }
    }

    // ------------------------- getters ----------------------------------------


    /**
     * Get all macros for this widget.
     * 
     * TDM does not provide macros option for a widget, a widget's macros come from (Priority high to low:)
     *  (1) the user-provided, stored in Root
     *  (2) upper-level provided, for now, it is only servicing widgets inside EmbeddedDisplay,
     *      e.g. passed down from EmbeddedDisplay widget's item macros, or
     *      the Canvas macros defined in TDL file
     *      it is obtain via BaseWidget.getMacros()
     *  (3) the Canvas definition, stored in Canvas
     * 
     * 
     */
    getAllMacros = () => {

        const canvas = g_widgets1.getWidget("Canvas");
        if (!(canvas instanceof Canvas)) {
            return [];
        }
        // macros defined in Canvas
        const canvasMacros = canvas.getMacros();

        // user-provided macros, may contain the parent window macros
        const externalMacros = g_widgets1.getRoot().getExternalMacros();

        // Higher priority macros appears first
        return [...externalMacros, ...this.getMacros(), ...canvasMacros];
    }



    /**
     * get widget-specific macros. For now, it is only servicing widgets inside EmbeddedDisplay TDL file
     * 
     * If this widget is not inside any EmbeddedDisplay, then the _macros should be empty
     * 
     * If this widget is inside an EmbeddedDisplay, its _macros contains
     *  - the EmbeddedDisplay widget's item macros
     *  - the Canvas macros defined in the EmbeddedDisplay widget's TDL file
     * 
     * If this widget is an EmbeddedDisplay widget, its _macros is passed 
     * down to all the widgets in its TDL file. This work is done in "read-embedded-display-tdl" event's request and reply
     */
    getMacros = () => {
        return this._macros;
    }

    setMacros = (newMacros: [string, string][]) => {
        this._macros = newMacros;
    }

    _getElementAreaRawOutlineStyle = (): string => {

        const severity = this._getChannelSeverity();
        // if this channel is not connected, always show alarm border
        if (severity === ChannelSeverity.NOT_CONNECTED) {
            return AlarmOutlineStyle[ChannelSeverity.NOT_CONNECTED];
        }

        // this is a function used in operation mode, use getAllText()
        const alarmBorder = this.getAllText().alarmBorder;
        if (g_widgets1.isEditing()) {
            return AlarmOutlineStyle[ChannelSeverity.NO_ALARM];
        }

        if (alarmBorder === true) {
            // return AlarmOutlineStyle[severity];
            // alarmLevel may not be defined in some widgets
            let alarmLevelStr = this.getText()["alarmLevel"];
            if (alarmLevelStr === undefined) {
                alarmLevelStr = "MINOR";
            }
            const alarmLevel = ChannelSeverity[alarmLevelStr as keyof typeof ChannelSeverity];
            if (severity >= alarmLevel) {
                return AlarmOutlineStyle[severity];
            }
        }
        return AlarmOutlineStyle[ChannelSeverity.NO_ALARM];
    };

    _getElementAreaRawBackgroundStyle = (): string => {
        const severity = this._getChannelSeverity();
        // this is a function used in operation mode, use getAllText()
        const alarmBackground = this.getAllText().alarmBackground;
        if (g_widgets1.isEditing()) {
            return this.getStyle()["backgroundColor"];
        }

        if (alarmBackground === true) {
            const alarmLevelStr = this.getText()["alarmLevel"];
            const alarmLevel = ChannelSeverity[alarmLevelStr as keyof typeof ChannelSeverity];
            if (severity >= alarmLevel) {
                return AlarmBackgroundStyle[severity];
            }
        }
        return this.getAllStyle()["backgroundColor"];
    };

    _getElementAreaRawTextStyle = (): string => {
        const severity = this._getChannelSeverity();
        const alarmText = this.getText().alarmText;
        if (g_widgets1.isEditing()) {
            return this.getStyle()["color"];
        }

        if (alarmText === true) {
            const alarmLevelStr = this.getText()["alarmLevel"];
            const alarmLevel = ChannelSeverity[alarmLevelStr as keyof typeof ChannelSeverity];
            if (severity >= alarmLevel) {
                return AlarmTextStyle[severity];
            }
        }
        return this.getAllStyle()["color"];
    }


    _getElementAreaRawShapeStyle = (): string => {
        const severity = this._getChannelSeverity();
        const alarmShape = this.getText().alarmShape;
        if (g_widgets1.isEditing()) {
            return this.getText()["lineColor"];
        }

        if (alarmShape === true) {
            const alarmLevelStr = this.getText()["alarmLevel"];
            const alarmLevel = ChannelSeverity[alarmLevelStr as keyof typeof ChannelSeverity];

            if (severity >= alarmLevel) {
                return AlarmShapeStyle[severity];
            }
        }
        return this.getAllText()["lineColor"];
    }


    _getElementAreaRawFillStyle = (): string => {
        const severity = this._getChannelSeverity();
        const alarmFill = this.getText().alarmFill;
        if (g_widgets1.isEditing()) {
            return this.getText()["fillColor"];
        }

        if (alarmFill === true) {
            const alarmLevelStr = this.getText()["alarmLevel"];
            const alarmLevel = ChannelSeverity[alarmLevelStr as keyof typeof ChannelSeverity];
            if (severity >= alarmLevel) {
                return AlarmFillStyle[severity];
            }
        }
        return this.getAllText()["fillColor"];
    }

    _getElementAreaRawPointerStyle = (): string => {
        const severity = this._getChannelSeverity();
        const alarmPointer = this.getText().alarmPointer;
        if (g_widgets1.isEditing()) {
            return this.getText()["pointerColor"];
        }

        if (alarmPointer === true) {
            const alarmLevelStr = this.getText()["alarmLevel"];
            const alarmLevel = ChannelSeverity[alarmLevelStr as keyof typeof ChannelSeverity];
            if (severity >= alarmLevel) {
                return AlarmPointerStyle[severity];
            }
        }
        return this.getAllText()["pointerColor"];
    }


    _getElementAreaRawDialStyle = (): string => {
        const severity = this._getChannelSeverity();
        const alarmDial = this.getText().alarmDial;
        if (g_widgets1.isEditing()) {
            return this.getText()["dialColor"];
        }

        if (alarmDial === true) {
            const alarmLevelStr = this.getText()["alarmLevel"];
            const alarmLevel = ChannelSeverity[alarmLevelStr as keyof typeof ChannelSeverity];
            if (severity >= alarmLevel) {
                return AlarmDialStyle[severity];
            }
        }
        return this.getAllText()["dialColor"];
    }

    _getElementAreaRawContainerStyle = (): string => {
        const severity = this._getChannelSeverity();
        const alarmContainer = this.getText().alarmContainer;
        if (g_widgets1.isEditing()) {
            return this.getText()["containerColor"];
        }

        if (alarmContainer === true) {
            const alarmLevelStr = this.getText()["alarmLevel"];
            const alarmLevel = ChannelSeverity[alarmLevelStr as keyof typeof ChannelSeverity];
            if (severity >= alarmLevel) {
                return AlarmContainerStyle[severity];
            }
        }
        return this.getAllText()["containerColor"];
    }

    _getElementAreaRawSelectedBackgroundStyle = (): string => {
        const severity = this._getChannelSeverity();
        const alarmSelectedBackground = this.getText().alarmBackground;
        if (g_widgets1.isEditing()) {
            return this.getText()["selectedBackgroundColor"];
        }

        if (alarmSelectedBackground === true) {
            const alarmLevelStr = this.getText()["alarmLevel"];
            const alarmLevel = ChannelSeverity[alarmLevelStr as keyof typeof ChannelSeverity];
            if (severity >= alarmLevel) {
                return AlarmSelectedBackgroundStyle[severity];
            }
        }
        return this.getAllText()["selectedBackgroundColor"];
    }


    /**
     * Show a thick light gray outline when mouse enters the write widget
     */
    hanldeMouseEnterWriteWidget = (event: any, elementRef: any) => {
        event.preventDefault();
        if (!g_widgets1.isEditing() && elementRef.current !== null) {
            elementRef.current.style["outlineStyle"] = "solid";
            elementRef.current.style["outlineWidth"] = "3px";
            elementRef.current.style["outlineColor"] = "rgba(105,105,105,1)";
            if (this._getChannelAccessRight() < Channel_ACCESS_RIGHTS.READ_WRITE) {
                elementRef.current.style["cursor"] = "not-allowed";
            } else {
                elementRef.current.style["cursor"] = "pointer";
            }
        }
    };

    /**
     * hide the thick light gray outline when mouse leaves the write widget
     */
    handleMouseLeaveWriteWidget = (event: any, elementRef: any) => {
        event.preventDefault();
        if (!g_widgets1.isEditing() && elementRef.current !== null) {
            // elementRef.current.style["outline"] = calcOutline();
            elementRef.current.style["outline"] = "none";
            elementRef.current.style["cursor"] = "default";
        }
    };

    // ------------------- first channel stuff -------------------

    _getChannelSeverity = () => {
        return this._getFirstChannelSeverity();
    }

    _getChannelUnit = () => {
        return this._getFirstChannelUnit();
    }

    _getChannelValue = (raw?: boolean): number | number[] | string | string[] | undefined => {
        return this._getFirstChannelValue(raw);
    }

    _getChannelPrecision = () => {
        return this._getFirstChannelPrecision();
    }

    _getChannelAccessRight = () => {
        return this._getFirstChannelAccessRight();
    }

    /**
     * Get the first channel's value, this channel may be a ca://, pva://, loc://, glb://, or a formula channel
     * 
     * If in editing mode, return the channel name
     */
    _getFirstChannelValue = (raw: boolean = false): string | number | string[] | number[] | undefined => {
        const channelName = this.getChannelNames()[0];

        if (channelName === undefined) {
            return channelName;
        }

        if (g_widgets1.isEditing()) {
            return channelName;
        }

        if (TcaChannel.checkChannelName(channelName) !== undefined) {
            // regular TCA channel
            return g_widgets1.getChannelValue(channelName, raw);
        } else {
            // may be a formula channel
            if (this.getEqChannelArray().length > 0) {
                const value = this.evaluateEqChannel();
                if (value !== undefined) {
                    return value;
                }
            }
            return channelName;
        }
    };

    /**
     * Most widgets has only one channel, invoke this function in these widgets' getChannelSeverity() method
     */
    _getFirstChannelSeverity = (): ChannelSeverity => {
        if (this.getChannelNames().length === 0) {
            return ChannelSeverity.NO_ALARM;
        }
        const channelName = this.getChannelNames()[0];
        if (channelName === undefined) {
            return ChannelSeverity.NO_ALARM;
        } else {
            return g_widgets1.getChannelSeverity(channelName);
        }
    };

    _getFirstChannelUnit = (): string => {
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return "";
        }
        if (this.getChannelNames().length === 0) {
            return "";
        }
        const channelName = this.getChannelNames()[0];
        return g_widgets1.getChannelUnit(channelName);
    };

    _getFirstChannelAccessRight = (): Channel_ACCESS_RIGHTS => {
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return Channel_ACCESS_RIGHTS.NOT_AVAILABLE;
        }
        if (this.getChannelNames().length === 0) {
            return Channel_ACCESS_RIGHTS.NOT_AVAILABLE;
        }
        const channelName = this.getChannelNames()[0];
        return g_widgets1.getChannelAccessRight(channelName);
    };


    /**
     * Actually the scale, not precision. Default 0
     */
    _getFirstChannelPrecision = (): number => {
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return 0;
        }
        if (this.getChannelNames().length === 0) {
            return 0;
        }
        const channelName = this.getChannelNames()[0];
        return g_widgets1.getChannelPrecision(channelName);
    };

    // this function is used in monitor widgets: TextUpdate, ProgressBar, Meter, Tank, Thermometer, LED, LEDMultiState, ByteMonitor
    getChannelValueForMonitorWidget = (raw: boolean = false) => {
        let value = this._getFirstChannelValue(raw);

        if (this.getEqChannelArray().length > 0) {
            value = this.evaluateEqChannel();
        }

        if (value === undefined) {
            return this.getChannelNamesLevel0()[0];
        } else {
            return value;
        }
    };

    /**
     * Parse one scalar value to the desired format
     * 
     * For "number" type scalar data, format it to the desired format, e.g. decimal, exponential ...
     * 
     * For all other type scalar data, simply stringify it
     */
    formatScalarValue = (scalarValue: number | string | boolean | undefined): string => {
        // text["scale"] is ignored if its value < 0
        if (typeof scalarValue === "number") {

            const allText = this.getAllText();
            const format = allText["format"];

            const precisionFromWidget = allText["scale"];
            const precisionFromChannel = this._getChannelPrecision();
            let precision = precisionFromChannel;
            if (precisionFromWidget >= 0) {
                precision = precisionFromWidget;
            }
            if (precision === undefined) {
                precision = 0;
            }

            if (format === "default") {
                return scalarValue.toFixed(precision);
            } else if (format === "decimal") {
                return scalarValue.toFixed(precision);
            } else if (format === "exponential") {
                return scalarValue.toExponential(precision);
            } else if (format === "hexadecimal") {
                return `0x${scalarValue.toString(16)}`;
            } else if (format === "string") {
                // use a number array to represent a string
                // MacOS ignores the non-displayable characters, but Linux shows rectangle for these characters
                if (scalarValue >= 32 && scalarValue <= 126) {
                    return `${String.fromCharCode(scalarValue)}`;
                } else {
                    return "";
                }
            } else {
                return scalarValue.toFixed(precision);
            }
        } else {
            return `${scalarValue}`;
        }
    }

    formatArrayValue = (arrayValue: number[] | string[] | boolean[]): string => {
        const result: string[] = [];
        for (const element of arrayValue) {
            result.push(this.formatScalarValue(element));
        }
        return result.join(", ");
    }

    /**
     * Get the formatted channel value (in string format)
     */
    getFormattedChannelValue = (withUnit: boolean = false) => {
        const value = this._getChannelValue();

        let unit = "";
        if (withUnit) {
            const unitRaw = this._getChannelUnit();
            unit = unitRaw === "" ? "" : ` ${unitRaw}`;
        }

        if (Array.isArray(value)) {
            return `${this.formatArrayValue(value)}${unit}`;
        } else {
            return `${this.formatScalarValue(value)}${unit}`;
        }
    }


    /**
     * calculate the first PV's limits for display
     * 
     * the widget must have minPvValue, maxPvValue and usePvLimits fields
     * 
     * default return value is [0, 100]
     */
    calcPvLimits = (): [number, number] => {
        const allText = this.getAllText();

        let minPvValue = allText["minPvValue"];
        let maxPvValue = allText["maxPvValue"];
        const usePvLimits = allText["usePvLimits"];

        if (typeof minPvValue !== "number" || typeof maxPvValue !== "number" || typeof usePvLimits !== "boolean") {
            return [0, 100];
        }

        if (usePvLimits === true) {
            const channelName = this.getChannelNames()[0];
            try {
                const channel = g_widgets1.getTcaChannel(channelName);
                const upper_display_limit = channel.getUpperDisplayLimit();
                if (typeof upper_display_limit === "number") {
                    maxPvValue = upper_display_limit;
                }
                const lower_display_limit = channel.getLowerDisplayLimit();
                if (typeof lower_display_limit === "number") {
                    minPvValue = lower_display_limit;
                }
            } catch (e) {
                Log.error(e);
            }

        }

        return [minPvValue, maxPvValue];
    };


    /**
     * Find the index that corresponds to the current channel value within a list of item values
     * 
     * The widget must contain a "bit" field
     * 
     * Supports two modes based on the "bit" property:
     * - If bit < 0: compares the entire channel value against the item values list
     * - If bit >= 0: extracts a specific bit from the channel value and compares it
     * 
     * @param itemValues - array of values to search for the channel value
     * @returns the index of the matching value, or undefined if no match is found
     */
    calcItemIndex = (itemValues: number[]): number | undefined => {
        const channelValue = this._getChannelValue(true);
        // if bit < 0, use whole number
        // if bit >= 0, use this bit
        const bit = this.getAllText()["bit"];
        if (typeof bit !== "number") {
            return undefined;
        }
        if (typeof channelValue === "number") {
            if (bit < 0) {
                // use whole value
                const index = itemValues.indexOf(channelValue);
                if (index >= 0) {
                    return index;
                } else {
                    return undefined;
                }
            } else {
                const value = (Math.floor(Math.abs(channelValue)) >> bit) & 0x1;
                const index = itemValues.indexOf(value);
                if (index >= 0) {
                    return index;
                } else {
                    return undefined;
                }
            }
        }
        return undefined;
    };

    /**
     * calculate the 3d button style
     * 
     * this is used for widgets with traditional button, such as BooleanButton, ActionButton
     */
    get3dButtonStyle = (buttonPressed: boolean) => {
        const allText = this.getAllText();
        const allStyle = this.getAllStyle();
        const appearance = allText["appearance"];
        console.log("appearance", appearance)
        if (appearance !== "traditional") {
            return {
                width: "",
                height: "",
                borderBottom: "none",
                borderTop: "none",
                borderRight: "none",
                borderLeft: "none",

            };
        }

        const shadowWidth = 2;
        const highlightColor = "rgba(255,255,255,1)";
        const shadowColor = "rgba(100,100,100,1)";


        let width = allStyle["width"] - 2 * shadowWidth;
        let height = allStyle["height"] - 2 * shadowWidth;

        let borderBottomAndRight = "none";
        let borderTopAndLeft = "none";
        // dark border
        const border0 = `solid ${shadowWidth}px ${shadowColor}`;
        // bright border
        const border1 = `solid ${shadowWidth}px ${highlightColor}`;

        if (buttonPressed) {
            borderBottomAndRight = border1;
        } else {
            borderBottomAndRight = border0;
        }

        if (borderBottomAndRight === border1) {
            borderTopAndLeft = border0;
        } else if (borderBottomAndRight === border0) {
            borderTopAndLeft = border1;
        }

        return {
            width: width,
            height: height,
            borderBottom: borderBottomAndRight,
            borderTop: borderTopAndLeft,
            borderRight: borderBottomAndRight,
            borderLeft: borderTopAndLeft,
        }

    }


    // -------------------- putters ----------------------------------

    /**
     * Put channel value
     */
    putChannelValue = (channelName: string, value: string | number | string[] | number[] | undefined, text?: Record<string, any>) => {
        if (g_widgets1.isEditing()) {
            return;
        }

        if (value === undefined) {
            return;
        }

        if (typeof channelName !== "string") {
            return;
        }

        if (value === undefined) {
            return;
        }

        if (text === undefined) {
            text = this.getAllText();
        }


        try {
            const tcaChannel = g_widgets1.getTcaChannel(channelName);
            // if user includes the unit, the put() should be able to parseInt() or praseFloat()
            // the text before unit
            const displayWindowId = g_widgets1.getRoot().getDisplayWindowClient().getWindowId();


            // intercepted by confirm write
            if (text["confirmOnWrite"] === true) {
                const ipcManager = g_widgets1.getRoot().getDisplayWindowClient().getIpcManager();
                const humanReadableMessage1 = "You are about to change " + channelName + " to " + `${value}`;
                // requires password
                if (text["confirmOnWriteUsePassword"] === true) {
                    const humanReadableMessage2 = "A password is required."
                    const password = text["confirmOnWritePassword"];
                    ipcManager.handleDialogShowInputBox(undefined,
                        {
                            info: {
                                command: "write-pv-confirmation-with-password",
                                humanReadableMessages: [humanReadableMessage1, humanReadableMessage2],
                                buttons: [
                                    {
                                        text: "OK",
                                        handleClick: (dialogInputText?: string) => {
                                            // console.log("pass word is ", dialogInputText, "...")
                                            if (dialogInputText !== password) {
                                                // password does not match
                                                // console.log("pass word does notmatch")
                                                ipcManager.handleDialogShowMessageBox(undefined,
                                                    {
                                                        info: {
                                                            command: "write-pv-confirmation-wit-password-failed",
                                                            humanReadableMessages: ["Wrong password."],
                                                            buttons: [
                                                                {
                                                                    text: "OK",
                                                                    handleClick: () => {
                                                                    },
                                                                },
                                                            ],
                                                            messageType: "error",
                                                            rawMessages: [],
                                                            attachment: undefined,
                                                        }
                                                    }
                                                )

                                                return;
                                            }
                                            try {
                                                tcaChannel.put(displayWindowId, { value: value }, 1);
                                            } catch (e) {
                                                Log.error(e);
                                            }
                                        },
                                    }
                                ],
                                defaultInputText: "",
                                attachment: undefined,
                            }
                        }
                    )
                } else {
                    // password not required
                    const humanReadableMessage2 = "Are you sure to continue?"
                    ipcManager.handleDialogShowMessageBox(undefined,
                        {
                            info: {
                                command: "write-pv-confirmation-without-password",
                                humanReadableMessages: [humanReadableMessage1, humanReadableMessage2],
                                buttons: [
                                    {
                                        text: "Yes",
                                        handleClick: () => {
                                            try {
                                                tcaChannel.put(displayWindowId, { value: value }, 1);
                                            } catch (e) {
                                                Log.error(e);
                                            }
                                        },
                                    },
                                    {
                                        text: "No",
                                        handleClick: () => {
                                        },
                                    }
                                ],
                                messageType: "info",
                                rawMessages: [],
                                attachment: undefined,
                            }
                        }
                    )

                }
                return;
            }
            Log.info("put channel value ===========", tcaChannel.getChannelName())
            tcaChannel.put(displayWindowId, { value: value }, 1);
        } catch (e) {
            Log.error(e);
        }
    }

    // ------------------------ z direction --------------------------

    // do not need to touch GroupSelection2, only operate on g_widgets1._widgets
    // even the widget is null
    // (1) obtain the index of this widget in g_widgets1._widgets (might be null)
    // (2) calculate the new index this widget will be moved to, and obtain the new neighbor's
    //     widgetKey, will flush it
    // (3) delete this widget from g_widgets1._widgets, it does not matter if the value of this entry is null or not, we only care about the order
    // (4) insert this widget to new postion in g_widgets1._widgets
    // (5) add this widget and the neighbor to g_widgets1.forceFlushWidgets
    // (6) flush
    moveInZ = (direction: "forward" | "backward" | "front" | "back", doFlush: boolean) => {
        // (1)
        const widgetKeys = [...g_widgets1.getWidgets().keys()];
        const widgetKey = this.getWidgetKey();
        const currentIndex = widgetKeys.indexOf(widgetKey);
        // there is 1 element in front of it: GroupSelecton2
        if ((direction === "forward" || direction === "front") && currentIndex === widgetKeys.length - 2) {
            Log.debug("Already on top, cannot move forward/front");
            return;
        }
        // there is 1 elements behind it: Canvas
        if ((direction === "backward" || direction === "back") && currentIndex === 1) {
            Log.debug("Already on bottom, cannot move backward/back");
            return;
        }
        // (2)
        const newIndex =
            direction === "forward"
                ? currentIndex + 1
                : direction === "backward"
                    ? currentIndex - 1
                    : direction === "front"
                        ? widgetKeys.length - 2
                        : 1;
        const theOtherWidgetKey = widgetKeys[newIndex];
        // (3)
        const [, widget] = GlobalMethods.deleteFromMap(g_widgets1.getWidgets(), currentIndex);
        // (4)
        GlobalMethods.insertToMap(g_widgets1.getWidgets(), newIndex, widgetKey, widget);
        // (5)
        g_widgets1.addToForceUpdateWidgets(widgetKey);
        g_widgets1.addToForceUpdateWidgets(theOtherWidgetKey);
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");
        // (6)
        if (doFlush) {
            g_flushWidgets();
        }
    };

    // ------------------- rules --------------------

    activateRules = () => {
        let rules = this.getRules();
        if (rules !== undefined) {
            rules.activate();
        }
    };
    deactivateRules = () => {
        let rules = this.getRules();
        if (rules !== undefined) {
            rules.deactivate();
        }
    };

    getRules = (): BaseWidgetRules | undefined => {
        return this._rules;
    };

    getRulesTdl = (): type_rules_tdl => {
        const rules = this.getRules();
        if (rules !== undefined) {
            return rules.getRulesTdl();
        } else {
            return [];
        }
    };

    // -------------------- mode ------------------------
    setMode(oldMode: rendererWindowStatus, newMode: rendererWindowStatus) { }
    jobsAsEditingModeBegins() {
        this.deactivateRules();
        this.processChannelNames();
        this.createSidebar();
    }
    jobsAsOperatingModeBegins() {
        this.activateRules();
        this.processChannelNames();
    }

    // ----------------- sidebar ------------------------

    abstract createSidebar: () => void;

    // ---------------- intervals and timeouts ---------

    getSchedules = () => {
        return this._schedules;
    }

    addSchedule = (newSchedule: NodeJS.Timeout | NodeJS.Timer) => {
        this._schedules.push(newSchedule);
    }

    clearSchedule = () => {
        for (let schedule of this.getSchedules()) {
            clearTimeout(schedule as any);
            clearInterval(schedule as any);
        }
    }


}
