import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { GroupSelectionSidebar2 } from "./GroupSelectionSidebar2";
import { TextUpdate } from "../../widgets/TextUpdate/TextUpdate";
import { g_flushWidgets } from "../Root/Root";
import { BaseWidget } from "../../widgets/BaseWidget/BaseWidget";
import { type_widget } from "../../global/Widgets";
import { Group } from "../../widgets/Group/Group";
import { Log } from "../../global/Log";
import { Canvas } from "../Canvas/Canvas";

/**
 * Rerpesents the selected widgets. These widgets are grouped inside this virtual widget. <br>
 * A widget must be a BaseWidget to be selected. <br>
 * Whenever a widget is selected, it is moved to this group. The entry value in g_widgets1._widgets is set to null. <br>
 * This widget is always the last entry in g_widgets1._widgets. In this way, the selected widgets are on top of others. <br>
 * This widget is not in JSON object of the display window.
 */
export class GroupSelection2 {
    private _type: string;
    private _widgetKey: string;

    // style for this widget, not about the virtual widget
    private _style: Record<string, any>;
    private _sidebar: GroupSelectionSidebar2;

    // any selected widgets are placed in this map, their values in g_widgets1 are set to null
    private _widgets: Map<string, BaseWidget> = new Map();

    // virtual dimensions saved before we resize
    // they are used in this.resize(), changed in this.reset() and this.saveInitValues()
    private _left0: number = 10000;
    private _top0: number = 10000;
    private _right0: number = -10000;
    private _bottom0: number = -10000;
    private _width0: number = -10000;
    private _height0: number = -10000;
    private _cursorX0: number = -10000;
    private _cursorY0: number = -10000;
    private _membersLeft0: Record<string, any> = {};
    private _membersTop0: Record<string, any> = {};
    private _membersWidth0: Record<string, any> = {};
    private _membersHeight0: Record<string, any> = {};

    // the absolute boundaries for all widgets current shown
    public _leftShown: number = 10000;
    public _topShown: number = 10000;
    public _widthShown: number = -10000;
    public _heightShown: number = -10000;

    // grid move

    // the "implicit" group top and left when we use the grid move
    _leftImplicitShown = 0;
    _topImplicitShown = 0;
    // total cursor move coordinates since mouse down
    _moveTotalX = 0;
    _moveTotalY = 0;

    constructor(widgetTdl: Record<string, any>) {
        this._type = widgetTdl.type;
        this._widgetKey = widgetTdl.widgetKey;
        //todo: combine with default style
        this._style = JSON.parse(JSON.stringify(widgetTdl.style));
        this._sidebar = new GroupSelectionSidebar2(this);
    }

    // --------------------- geometric operations -----------------------------
    /**
     * Move a widget from g_widgets1._widgets to GroupSelection2._widgets <br>
     * The value in map g_widgets1._widgets becomes null <br>
     * A new entry is created for this widget in map GroupSelection2._widgets
     * @param {string} widgetKey The widget key of this widget
     * @throws {Error<string>} when the widget is not a BaseWidget object
     */
    migrateWidget = (widgetKey: string) => {
        const widget = g_widgets1.getWidget(widgetKey);
        if (widget === null || widget === undefined) {
            return;
        }
        if (widget instanceof BaseWidget) {
            // speical treatment for Group widget: move this widget to the bottom of this._widgets 
            // so that all its inbound widgets can be shown. This solves the problem that 
            // when we selecte a Group widget by moving mouse, the Group widget background is
            // always the last to be selected, making it on the top, masking all its inbound widgets.
            if (widget instanceof Group) {
                const keys = [...this.getWidgets().keys()];
                const values = [...this.getWidgets().values()];
                keys.unshift(widgetKey);
                values.unshift(widget);
                this.getWidgets().clear();
                for (let ii = 0; ii < keys.length; ii++) {
                    const key = keys[ii];
                    const value = values[ii];
                    this.getWidgets().set(key, value);
                }
                // this.getWidgets().set(widgetKey, widget);
                g_widgets1.getWidgets().set(widgetKey, undefined);
            } else {
                this.getWidgets().set(widgetKey, widget);
                g_widgets1.getWidgets().set(widgetKey, undefined);
            }
        } else {
            const errMsg = `${widget.getWidgetKey()} should not be selected.`;
            throw new Error(errMsg);
        }
    };

    /**
     * Move a widget from GroupSelection2._widget to g_widgets1._widgets, as opposed to migrateWidget() <br>
     * The corresponding entry in GroupSelection2._widget is removed <br>
     * The original value in g_widgets1._widgets is null
     * @param {string} widgetKey The widget key of this widget
     */
    migrateWidgetBack = (widgetKey: string) => {
        const widget = this.getWidgets().get(widgetKey);
        g_widgets1.getWidgets().set(widgetKey, widget);
        this.getWidgets().delete(widgetKey);
    };

    // move the widget, the widgets inside of it are moved together
    // (1) update style
    // (2) add this widget to  forceUpdate
    // (3) flush
    move = (dx: number, dy: number, flush: boolean) => {
        Log.debug("Group moved by", dx, dy)
        // (1)
        if (dx === 0 && dy === 0) {
            return;
        }

        let dx1 = dx;
        let dy1 = dy;
        try {
            const canvas = g_widgets1.getWidget2("Canvas");
            if (canvas instanceof Canvas) {
                const xGridSize = canvas.getXGridSize();
                const yGridSize = canvas.getYGridSize();
                if (xGridSize !== undefined && yGridSize !== undefined && xGridSize > 1.5 && yGridSize > 1.5) {
                    // grid move
                    this.calcSizes2();

                    this._moveTotalX = this._moveTotalX + dx;
                    dx1 = - (this._leftImplicitShown) + Math.round((this._leftImplicitShown + this._moveTotalX) / xGridSize) * xGridSize;
                    if (dx1 !== 0) {
                        this._moveTotalX = this._moveTotalX - dx1;
                    }
                    this._moveTotalY = this._moveTotalY + dy;
                    dy1 = - (this._topImplicitShown) + Math.round((this._topImplicitShown + this._moveTotalY) / yGridSize) * yGridSize;
                    if (dy1 !== 0) {
                        this._moveTotalY = this._moveTotalY - dy1;
                    }
                }
            }
        } catch (e) {
            Log.error(e);
        }

        this.getStyle().left = this.getStyle().left + dx1;
        this.getStyle().top = this.getStyle().top + dy1;

        // (2)
        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        // (3)
        if (flush) {
            g_flushWidgets();
        }
    };

    /**
     * Calculate the size 
     */
    calcSizes2 = () => {
        let groupLeft = 10000;
        let groupTop = 10000;
        let groupRight = -10000;
        let groupDown = -10000;
        // (1)
        for (let widget1 of this.getWidgets().values()) {
            //todo: more generic
            const widget = widget1 as BaseWidget;

            let widgetLeft = widget.getStyle().left;
            let widgetTop = widget.getStyle().top;
            let widgetRight = widgetLeft + widget.getStyle().width;
            let widgetDown = widgetTop + widget.getStyle().height;

            groupLeft = Math.min(groupLeft, widgetLeft);
            groupTop = Math.min(groupTop, widgetTop);
            groupRight = Math.max(groupRight, widgetRight);
            groupDown = Math.max(groupDown, widgetDown);
        }

        // (2)
        // this is the only place to change this._xxxShown, they are the absolute boundaries of widgets
        // currently shown on the screen
        this._leftImplicitShown = groupLeft + this.getStyle().left;
        this._topImplicitShown = groupTop + this.getStyle().top;
    };

    // (1) calculate
    //     (i) top, left, width and height of all containing widgets on the screen (not inside GroupSelection2)
    //     (ii) which widget's sidebar should be shown
    //     (iii) how many widgets inside this group
    // (2) update absolute boundaries of all widgets inside GroupSelection2
    calcSizes = () => {
        let groupLeft = 10000;
        let groupTop = 10000;
        let groupRight = -10000;
        let groupDown = -10000;
        // (1)
        for (let widget1 of this.getWidgets().values()) {
            const widget = widget1 as BaseWidget;

            let widgetLeft = widget.getStyle().left;
            let widgetTop = widget.getStyle().top;
            let widgetRight = widgetLeft + widget.getStyle().width;
            let widgetDown = widgetTop + widget.getStyle().height;

            groupLeft = Math.min(groupLeft, widgetLeft);
            groupTop = Math.min(groupTop, widgetTop);
            groupRight = Math.max(groupRight, widgetRight);
            groupDown = Math.max(groupDown, widgetDown);
        }

        // (2)
        // this is the only place to change this._xxxShown, they are the absolute boundaries of widgets
        // currently shown on the screen
        this._leftShown = groupLeft + this.getStyle().left;
        this._topShown = groupTop + this.getStyle().top;
        this._widthShown = groupRight - groupLeft;
        this._heightShown = groupDown - groupTop;

        return {
            // which widget's sidebar should be displayed
            widgetKey: this.getWidgets().size === 0 ? "Canvas" : this.getWidgets().size === 1 ? [...this.getWidgets().keys()][0] : "GroupSelection2",
            count: this.getWidgets().size,
            left: groupLeft + this.getStyle().left,
            top: groupTop + this.getStyle().top,
            width: groupRight - groupLeft,
            height: groupDown - groupTop,
        };
    };

    /**
     * Set the display sidebar <br>
     * If no widget is selected, show Canvas sidebar <br>
     * If one widget is selected, show this widget's sidebar <br>
     * If multiple widgets are selected, show GroupSelection2 sidebar <br>
     * Procedures: <br>
     * (1) calculate sizes of all elements <br>
     * (2) set the sidebar depending on which widgets are selected <br>
     * (3) update sidebar <br>
     * (4) add this widget to g_widgets1.forceUpdateWidgets() <br>
     * (5) if there was only one widget selected, we must render this widget again to hide its sidebar <br>
     * (6) flush
     */
    calcAndSetSidebar = (doFlush: boolean) => {
        // (1)
        const result = this.calcSizes();
        // (2)
        g_widgets1.setSidebarWidgetKey(result.widgetKey, false);
        // (3)
        if (result.count >= 1) {
            const widget = g_widgets1.getWidget2(result.widgetKey);
            if (widget instanceof BaseWidget || widget instanceof GroupSelection2) {
                const updateFromWidget = widget.getUpdateFromWidget();
                if (updateFromWidget) {
                    updateFromWidget(undefined, "left", result.left);
                    updateFromWidget(undefined, "top", result.top);
                    updateFromWidget(undefined, "width", result.width);
                    updateFromWidget(undefined, "height", result.height);
                }
            }
        }
        // (4)
        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        // (5)
        // it is OK for "key" to be undefined, the g_flushWidgets() can handle this
        const key = [...this.getWidgets().keys()][0];
        g_widgets1.addToForceUpdateWidgets(key);
        // (6)
        if (doFlush) {
            g_flushWidgets();
        }
    };

    // invoked when the mouse-down and mouse-up on widget or widget resizer
    // (1) move this widget back to (left, top) = (0, 0)
    // (2) reset virtual style values for resizing
    // (3) add this widget to forceUpdateWidgets
    // (4) flush
    reset = (flush: boolean) => {
        // (1)
        this.getStyle().top = 0;
        this.getStyle().left = 0;
        // (2)
        this._left0 = 10000;
        this._top0 = 10000;
        this._right0 = -10000;
        this._bottom0 = -10000;
        this._width0 = -10000;
        this._height0 = -10000;
        this._cursorX0 = -10000;
        this._cursorY0 = -10000;
        this._membersLeft0 = {};
        this._membersTop0 = {};
        this._membersWidth0 = {};
        this._membersHeight0 = {};
        // (3)
        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());

        this._moveTotalX = 0;
        this._moveTotalY = 0;
        // (4)
        if (flush) {
            g_flushWidgets();
        }
    };

    saveInitValues = (cursorX: number, cursorY: number) => {
        for (let widget of [...this.getWidgets().values()]) {
            const widgetLeft = widget.getStyle().left;
            const widgetTop = widget.getStyle().top;
            const widgetRight = widget.getStyle().left + widget.getStyle().width;
            const widgetBottom = widget.getStyle().top + widget.getStyle().height;
            this._left0 = Math.min(widgetLeft, this._left0);
            this._top0 = Math.min(widgetTop, this._top0);
            this._right0 = Math.max(widgetRight, this._right0);
            this._bottom0 = Math.max(widgetBottom, this._bottom0);
            this._membersLeft0[widget.getWidgetKey()] = widget.getStyle().left;
            this._membersTop0[widget.getWidgetKey()] = widget.getStyle().top;
            this._membersWidth0[widget.getWidgetKey()] = widget.getStyle().width;
            this._membersHeight0[widget.getWidgetKey()] = widget.getStyle().height;
        }
        this._width0 = this._right0 - this._left0;
        this._height0 = this._bottom0 - this._top0;
        this._cursorX0 = cursorX;
        this._cursorY0 = cursorY;
    };

    // (1) calcualte the new left, top, width and height for all the widgets inside GroupSelection2,
    //     the saved boundaries before resizing are used
    // (2) set the new left, top, width and height in each selected widget,
    //     add the selected widgets to forceUpdateWidgets list, do not flush
    // (3) flush
    resize = (cursorX: number, cursorY: number, index: "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H", flush: boolean) => {


        let diffX = 0;
        let diffY = 0;

        if (index === "C" || index === "D" || index === "E") {
            diffX = this._width0 + this._left0 - this._cursorX0;
        } else if (index === "A" || index === "G" || index === "H") {
            diffX = this._left0 - this._cursorX0;
        }

        if (index === "A" || index === "B" || index === "C") {
            diffY = this._top0 - this._cursorY0;
        } else if (index === "E" || index === "F" || index === "G") {
            diffY = this._height0 + this._top0 - this._cursorY0;
        }

        let cursorX1 = cursorX;
        let cursorY1 = cursorY;
        try {
            const canvas = g_widgets1.getWidget2("Canvas");
            if (canvas instanceof Canvas) {
                const xGridSize = canvas.getXGridSize();
                const yGridSize = canvas.getYGridSize();
                if (xGridSize !== undefined && yGridSize !== undefined && xGridSize > 1.5 && yGridSize > 1.5) {
                    // grid resize
                    cursorX1 = Math.round((cursorX) / xGridSize) * xGridSize - diffX;
                    cursorY1 = Math.round(cursorY / yGridSize) * yGridSize - diffY;
                }
            }
        } catch (e) {
            Log.error(e);
        }

        // (1)
        const ratioX = 1 + ((cursorX1 - this._cursorX0) / this._width0) * this._resizeFactors[index].dWidth;
        const ratioY = 1 + ((cursorY1 - this._cursorY0) / this._height0) * this._resizeFactors[index].dHeight;

        for (let widget of [...this.getWidgets().values()]) {
            // (1) continued
            let dx = 0;
            if (index === "A" || index === "H" || index === "G") {
                const x10 = this._membersLeft0[widget.getWidgetKey()];
                const x00 = this._left0;
                const x31 = this._right0;
                const x30 = this._right0;
                const x01 = x00 + cursorX1 - this._cursorX0;
                dx = ((x10 - x00) * (x31 - x01)) / (x30 - x00) + x01 - x10;
            } else if (index === "C" || index === "D" || index === "E") {
                const x10 = this._membersLeft0[widget.getWidgetKey()];
                const x00 = this._left0;
                const x31 = this._right0 + cursorX1 - this._cursorX0; // diff
                const x30 = this._right0;
                const x01 = x00; // diff
                dx = ((x10 - x00) * (x31 - x01)) / (x30 - x00) + x01 - x10;
            } else {
                dx = 0;
            }

            let dy = 0;
            if (index === "A" || index === "B" || index === "C") {
                const y10 = this._membersTop0[widget.getWidgetKey()];
                const y00 = this._top0;
                const y31 = this._bottom0;
                const y30 = this._bottom0;
                const y01 = y00 + cursorY1 - this._cursorY0;
                dy = ((y10 - y00) * (y31 - y01)) / (y30 - y00) + y01 - y10;
            } else if (index === "E" || index === "F" || index === "G") {
                const y10 = this._membersTop0[widget.getWidgetKey()];
                const y00 = this._top0;
                const y31 = this._bottom0 + cursorY1 - this._cursorY0; // diff
                const y30 = this._bottom0;
                const y01 = y00; // diff
                dy = ((y10 - y00) * (y31 - y01)) / (y30 - y00) + y01 - y10;
            } else {
                dy = 0;
            }

            let left = Math.round(this._membersLeft0[widget.getWidgetKey()] + dx);
            let top = Math.round(this._membersTop0[widget.getWidgetKey()] + dy);
            let width = Math.round(this._membersWidth0[widget.getWidgetKey()] * ratioX);
            let height = Math.round(this._membersHeight0[widget.getWidgetKey()] * ratioY);

            g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());

            // (2)
            (widget as BaseWidget).resize(left, top, width, height, false);
        }
        // (3)
        if (flush) {
            g_flushWidgets();
        }
    };

    private _resizeFactors: Record<string, any> = {
        A: {
            dWidth: -1,
            dHeight: -1,
        },
        B: {
            dWidth: 0,
            dHeight: -1,
        },
        C: {
            dWidth: 1,
            dHeight: -1,
        },
        D: {
            dWidth: 1,
            dHeight: 0,
        },
        E: {
            dWidth: 1,
            dHeight: 1,
        },
        F: {
            dWidth: 0,
            dHeight: 1,
        },
        G: {
            dWidth: -1,
            dHeight: 1,
        },
        H: {
            dWidth: -1,
            dHeight: 0,
        },
    };

    // -------------------------- sidebar ----------------------------------

    // defined in widget, invoked in sidebar
    // (1) determine which style should be updated
    // (2) calculate new value
    // (3) assign new value
    // (4) reset the intermediate quantities (not including this._leftShown, this._widthShown ...)
    // (5) update sidebar (basically update this._leftShown ...) and flush
    public updateFromSidebar = (event: any, propertyName: string, propertyValue: number | string | number[] | string[] | boolean) => {
        if (event) {
            // do not perventDefault for checkbox
            if (propertyName !== "text-wrap-word") {
                event.preventDefault();
            }
        }
        let styleName = "";
        let newVal = undefined;
        let oldVal = undefined;

        // (1)
        // (2)
        switch (propertyName) {
            case "left":
                // (3)
                styleName = "left";
                newVal = propertyValue as number;
                // _leftShown stores the current virtual boundary
                oldVal = this._leftShown;
                if (newVal === oldVal) {
                    return;
                }
                // (4)
                const dx = newVal - oldVal;
                [...this.getWidgets().values()].map((widget: any) => {
                    (widget as BaseWidget).move(dx, 0, false);
                });
                break;
            case "top":
                // (3)
                styleName = "top";
                newVal = propertyValue as number;
                // _leftShown stores the current virtual boundary
                oldVal = this._topShown;
                if (newVal === oldVal) {
                    return;
                }
                // (4)
                const dy = newVal - oldVal;
                [...this.getWidgets().values()].map((widget: any) => {
                    (widget as BaseWidget).move(0, dy, false);
                });
                break;
            case "width":
                // (3)
                styleName = "width";
                newVal = propertyValue as number;
                // _leftShown stores the current virtual boundary
                oldVal = this._widthShown;
                if (newVal === oldVal) {
                    return;
                }
                // (4)
                // simulate mouse-down-on-resizer --> mouse-move-on-resize
                this.reset(false);
                this.saveInitValues(0, 0);
                this.resize(newVal - oldVal, 0, "D", false);
                break;
            case "height":
                // (3)
                styleName = "height";
                newVal = propertyValue as number;
                // _leftShown stores the current virtual boundary
                oldVal = this._heightShown;
                if (newVal === oldVal) {
                    return;
                }
                // (4)
                // simulate mouse-down-on-resizer --> mouse-move-on-resize
                // the mouse cursor position is moved from (0,0) to (0,newVal-oldVal)
                this.reset(false);
                this.saveInitValues(0, 0);
                this.resize(0, newVal - oldVal, "F", false);
                break;
            default:
                Log.error("Unknown property from sidebar: ", propertyName);
                return;
        }
        // simulate mouse-up-on-resizer
        this.reset(false);
        this.calcAndSetSidebar(true);
    };

    // --------------------- elements --------------------------

    private _ElementRaw = () => {
        React.useEffect(() => {
            g_widgets1.removeFromForceUpdateWidgets(this.getWidgetKey());
        });

        return (
            <>
                <div style={{ ...this.getStyle() }}>
                    {[...this.getWidgets().values()].map((widget: any) => {
                        return (widget as BaseWidget).getElement();
                    })}
                </div>
                {this._showSidebar() ? this.getSidebarElement() : null}
            </>
        );
    };

    private _useMemoedElement = (): boolean => {
        return g_widgets1.getForceUpdateWidgets().has(this.getWidgetKey()) ? false : true;
    };

    private _Element = React.memo(this._ElementRaw, () => this._useMemoedElement());

    getSidebarElement = () => {
        return this.getSidebar().getElement();
    };

    getElement = () => {
        return <this._Element key={this._widgetKey}></this._Element>;
    };

    // -------------------- helper functions --------------------

    private _showSidebar = (): boolean => {
        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();

        const result = g_widgets1.isEditing() && g_widgets1.getSidebarWidgetKey() === this.getWidgetKey();
        return result;
    };

    getUpdateFromWidget = () => {
        return this.getSidebar().updateFromWidget;
    };

    // --------------------- getters ----------------------------
    getType = (): string => {
        return this._type;
    };

    getWidgetKey = (): string => {
        return this._widgetKey;
    };

    getSidebar = () => {
        return this._sidebar;
    };

    getStyle = () => {
        return this._style;
    };

    getWidgets = () => {
        return this._widgets;
    };

    getWidget = (widgetKey: string): type_widget | undefined => {
        return this._widgets.get(widgetKey);
    };

    getCursorX0 = () => {
        return this._cursorX0;
    };
    getCursorY0 = () => {
        return this._cursorY0;
    };

    // --------------------- tdl -------------------
    private static _defaultTdl: Record<string, any> = {
        type: "GroupSelection2",
        widgetKey: "GroupSelection2",
        key: "GroupSelection2",
        style: {
            display: "inline-block",
            position: "absolute",
            top: 0,
            left: 0,
            width: 0,
            height: 0,
            backgroundColor: "red",
        },
    };

    // do not produce a new key
    static generateDefaultTdl = (): Record<string, any> => {
        return JSON.parse(JSON.stringify(this._defaultTdl));
    };

    getTdlCopy = (newKey: boolean = true): Record<string, any> => {
        const result: Record<string, any> = {
            type: this.getType(),
            widgetKey: this.getWidgetKey(),
            key: this.getWidgetKey(),
            style: { ...this.getStyle() },
        };
        return result;
    };

    getChannelNames = (): string[] => {
        return [];
    };
}
