import * as React from "react";
import { Log } from "../../../common/Log";
import {
    getMouseEventClientX,
    getMouseEventClientY,
    getScrollTop,
    GlobalVariables,
    calcSidebarWidth,
    getWindowVerticalScrollBarWidth,
} from "../../../common/GlobalVariables";
import { g_widgets1 } from "../../global/GlobalVariables";
import { CanvasSidebar } from "./CanvasSidebar";
import { g_flushWidgets } from "../Root/Root";
import { rgbaArrayToRgbaStr } from "../../../common/GlobalMethods";
import { rendererWindowStatus } from "../../global/Widgets";

/**
 * ! Note: this type is defined in 3 places: (1) here, (2) widgetConverters/CanvasHelper.ts, and (3) common/GlobalVariables
 * !       These 3 places must be synchronized
 */
export type type_Canvas_tdl = Record<string, any> & {
    type: "Canvas";
    widgetKey: "Canvas";
    // key: "Canvas";
    style: Record<string, number | string>;
    macros: [string, string][];
    // replaceMacros: boolean;
    windowName: string;
    script: string;
    xGridSize: number;
    yGridSize: number;
    gridColor: string;
    showGrid: boolean;
    isUtilityWindow: boolean;
};

export class Canvas {
    private _type: string;
    private _widgetKey: string;
    private _style: Record<string, any>;

    // macros for this tdl is managed by Canvas
    // internal macros
    private _macros: [string, string][];

    // if the duplicated internal macros should be replaced by external macros
    // private _replaceMacros: boolean;
    private _windowName: string = "";
    private _script: string = "";

    private _sidebar: CanvasSidebar;

    private _xGridSize: number;
    private _yGridSize: number;

    private _gridColor: string;
    private _showGrid: boolean;
    private _isUtilityWindow: boolean;

    constructor(widgetTdl: Record<string, any>) {
        this._type = widgetTdl.type;
        this._widgetKey = widgetTdl.widgetKey;

        this._style = { ...Canvas._defaultTdl.style, ...widgetTdl.style };
        this._macros = JSON.parse(JSON.stringify(widgetTdl.macros));
        // this._replaceMacros = widgetTdl.replaceMacros;
        this._windowName = widgetTdl.windowName === undefined ? "" : widgetTdl.windowName;

        this._xGridSize = widgetTdl["xGridSize"] === undefined ? 1 : widgetTdl["xGridSize"];
        this._yGridSize = widgetTdl["yGridSize"] === undefined ? 1 : widgetTdl["yGridSize"];

        this._script = widgetTdl.script === undefined ? "" : widgetTdl.script;

        this._sidebar = new CanvasSidebar(this);

        this._gridColor = widgetTdl["gridColor"] === undefined ? "rgba(128,128,128,0.15)" : widgetTdl["gridColor"];
        this._showGrid = widgetTdl["showGrid"] === undefined ? false : widgetTdl["showGrid"];
        this._isUtilityWindow = widgetTdl["isUtilityWindow"] === undefined ? false : widgetTdl["isUtilityWindow"];

        // listen to window resize event
        this.startListeners();

    }

    // -------------------- events ------------------------

    startListeners = () => {
        window.addEventListener("resize", this.handleWindowResize);
    };

    getUpdateFromWidget = () => {
        return this._sidebar.updateFromWidget;
    };

    // defined in widget, invoked in sidebar
    updateFromSidebar = (
        event: any,
        propertyName: string,
        propertyValue: number | string | number[] | string[] | Record<string, string> | [string, string][]
    ) => {
        if (event) {
            event.preventDefault();
        }
        const mainProcessMode = g_widgets1.getRoot().getDisplayWindowClient().getMainProcessMode();
        switch (propertyName) {
            case "width":
                if (mainProcessMode === "web") {
                    this.getStyle()["width"] = propertyValue as number;

                } else {
                    window.resizeBy((propertyValue as number) - this._style.width, 0);
                }
                break;
            case "height":
                if (mainProcessMode === "web") {
                    this.getStyle()["height"] = propertyValue as number;
                } else {
                    window.resizeBy(0, (propertyValue as number) - this._style.height);
                }
                break;
            case "macros":
                this._macros = propertyValue as [string, string][];
                break;
            case "windowName":
                this.setWindowName(propertyValue as string);
                // update title if the title type is "window-name"
                const root = g_widgets1.getRoot();
                const displayWindowClient = root.getDisplayWindowClient();
                const windowTitleType = displayWindowClient.getWindowTitleType();
                if (windowTitleType === "window-name") {
                    displayWindowClient.updateWindowTitle();
                }
                break;
            case "background-color":
                const styleName = "backgroundColor";
                const newPropertyValue = rgbaArrayToRgbaStr(propertyValue as number[]);
                const oldPropertyValue = this.getStyle()[styleName];
                if (newPropertyValue !== oldPropertyValue) {
                    this.getStyle()[styleName] = newPropertyValue;
                    // this is an undoable action
                    // todo: too many undo steps if we drag the mouse on color picker
                    // g_widgets1.addToHistories([this.getWidgetKey()], [g_widgets1.getWidgetIndex(this.getWidgetKey())]);
                }
                break;

            default:
                Log.error("Unknown property from sidebar: ", propertyName);
                return;
        }
        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_flushWidgets();
    };

    handleWindowResize = (event: any) => {

        // if in web mode, do not do anything
        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
        const mainProcessMode = displayWindowClient.getMainProcessMode();
        if (mainProcessMode === "web") {
            return;
        }

        // update canvas
        const newWidth = this._calcWidth();
        const newHeight = this._calcHeight();
        this._style.width = newWidth;
        this._style.height = newHeight;

        // update sidebar
        // undefined in operating mode
        if (this.getUpdateFromWidget() !== undefined) {
            this.getUpdateFromWidget()(undefined, "width", newWidth);
            this.getUpdateFromWidget()(undefined, "height", newHeight);
        }


        if (g_widgets1.getSelectedWidgetKeys().length === 1) {
            g_widgets1.addToForceUpdateWidgets(g_widgets1.getSelectedWidgetKeys()[0]);
        } else {
            g_widgets1.addToForceUpdateWidgets("GroupSelection2");
        }

        // Canvas is not memorized, always re-render
        g_flushWidgets();
    };

    // this event is never removed!
    // mouseDown event on
    // select a widget:
    // (1) left button down on Canvas
    // (2) move the mouse cursor with button down
    // (3) when the mouse cursor is over the Canvas, show the selection region
    //     when the mouse cursor is over the widget, continue to show the selection region
    private _handleMouseDown = (event: React.MouseEvent) => {
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

        // console.log("continue", "event.button", event.button, g_widgets1.getRendererWindowStatus(), rendererWindowStatus.editing);

        // left button = 0
        // middle button = 1
        // right button = 2
        if (event.button === 0) {
            if (g_widgets1.getRendererWindowStatus() === rendererWindowStatus.editing) {
                // (1) deselect all widgets, including "GroupSelection2", and update sidebar
                // (2) create "mouse selection region" widget
                // (3) change window status to "selecting-widget"
                // (4) flush
                // (1)
                Log.debug("deselect all widgets");
                g_widgets1.deselectAllWidgets(false);
                // (2)
                const widgetTdl = g_widgets1.initWidgetTdl("MouseSelectionRegion", getMouseEventClientX(event), getMouseEventClientY(event), 0, 0);
                g_widgets1.createWidget(widgetTdl, false);
                // (3)
                g_widgets1.setRendererWindowStatus(rendererWindowStatus.selectingWidget);
                // (4)
                g_flushWidgets();
            }
        } else if (event.button == 2) {
            if (g_widgets1.isEditing()) {
                // (1) deselect all widgets, update sidebar, and flush
                // (2) tell main process to show context menu

                // (1)
                g_widgets1.deselectAllWidgets(true);
                // (2)
                g_widgets1.getRoot().getDisplayWindowClient().showContextMenu(this.getWidgetKey(), [event.clientX, event.clientY]);
            } else {
                // g_widgets1.getRoot().getDisplayWindowClient().showContextMenu(this.getWidgetKey());
            }
        }
    };

    // ------------------- elements ---------------------

    // not a .memo()
    private _Element = () => {
        return (
            <>
                <this._BodyElement></this._BodyElement>
                {this._showSidebar() ? this._sidebar.getElement() : null}
            </>
        );
    };

    private _BodyElement = () => {
        const mainProcesMode = g_widgets1?.getRoot().getDisplayWindowClient().getMainProcessMode();
        return <div style={{
            ...this._style,
            backgroundImage: this.getShowGrid() === true && g_widgets1.isEditing() && this.getXGridSize() > 2.5 && this.getYGridSize() > 2.5 ? `repeating-linear-gradient(${this.getGridColor()} 0 1px, transparent 1px 100%), repeating-linear-gradient(90deg, ${this.getGridColor()} 0 1px, transparent 1px 100%)` : "",
            backgroundSize: `${this.getXGridSize()}px ${this.getYGridSize()}px`,
            outline: mainProcesMode === "web" ? "1px solid black" : "none",
        }}
            onMouseDown={this._handleMouseDown}
        >
        </div>;
    };

    // --------------------- style and tdl -------------------------

    private static _defaultTdl: type_Canvas_tdl = {
        type: "Canvas",
        widgetKey: "Canvas",
        key: "Canvas",
        style: {
            // basics
            position: "fixed",
            display: "inline-block",
            // dimensions
            left: 0,
            top: 0,
            height: 500,
            width: 500,
            backgroundColor: `rgba(255, 255, 255, 1)`,
            // others
            margin: 0,
            border: 0,
            padding: 0,
            overflow: "hidden",
        },
        macros: [],
        replaceMacros: false,
        windowName: "",
        script: "",
        xGridSize: 1,
        yGridSize: 1,
        gridColor: "rgba(128,128,128,1)",
        showGrid: true,
        isUtilityWindow: false,
    };

    // not getDefaultTdl(), always generate a new key
    static generateDefaultTdl = (): type_Canvas_tdl => {
        const result = JSON.parse(JSON.stringify(this._defaultTdl));
        return result;
    };

    getTdlCopy = (newKey: boolean = true): type_Canvas_tdl => {
        const result: type_Canvas_tdl = {
            type: "Canvas",
            widgetKey: "Canvas",
            key: "Canvas",
            style: JSON.parse(JSON.stringify(this.getStyle())),
            macros: JSON.parse(JSON.stringify(this.getMacros())),
            // replaceMacros: this.getReplaceMacros(),
            windowName: this.getWindowName(),
            script: this.getScript(),
            xGridSize: this.getXGridSize(),
            yGridSize: this.getYGridSize(),
            gridColor: this.getGridColor(),
            showGrid: this.getShowGrid(),
            isUtilityWindow: this.isUtilityWindow(),
        };
        return result;
    };

    // ---------------- setters --------------------------

    // ------------------ getters -------------------------

    getElement = () => {
        return <this._Element key={this._widgetKey}></this._Element>;
    };

    getType = (): string => {
        return this._type;
    };

    getWidgetKey = (): string => {
        return this._widgetKey;
    };
    getStyle = (): Record<string, any> => {
        return this._style;
    };

    getSidebar = (): CanvasSidebar => {
        return this._sidebar;
    };
    getMacros = (): [string, string][] => {
        return this._macros;
    };

    isUtilityWindow = () => {
        return this._isUtilityWindow;
    }


    // -------------------- helper methods ---------------------------

    // calcualte Canvas width
    private _calcWidth = () => {
        // window.innerWidth includes the scrollbar width
        // return window.innerWidth - calcSidebarTotalWidth() * (g_widgets1.getRendererWindowStatus() === rendererWindowStatus.operating ? 0 : 1);
        if (g_widgets1.getRendererWindowStatus() === rendererWindowStatus.operating) {
            return window.innerWidth;
        } else {
            return window.innerWidth - calcSidebarWidth() - getWindowVerticalScrollBarWidth();
        }
    };

    // calcualte Canvas height
    private _calcHeight = () => {
        return window.innerHeight;
    };

    // only show the sidebar of widget g_widgets1.sidebarWidgetKey
    private _showSidebar = (): boolean => {
        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();

        const result = g_widgets1.isEditing() && g_widgets1.getSidebarWidgetKey() === this.getWidgetKey();
        return result;
    };

    // -------------------- getters and setters ---------------------------

    // 2 types of macros (1) internal, defined inside tdl file (2) external, provided by caller

    // setExternalMacros = (externalMacros: [string, string][]) => {
    // 	this._externalMacros = JSON.parse(JSON.stringify(externalMacros));
    // };

    // getExternalMacros = (): [string, string][] => {
    // 	return this._externalMacros;
    // };

    // getReplaceMacros = () => {
    // 	return this._replaceMacros;
    // };

    // setExternalReplaceMacros = (externalReplaceMacros: boolean) => {
    // 	this._externalReplaceMacros = externalReplaceMacros;
    // };
    // getExternalReplaceMacros = () => {
    // 	return this._externalReplaceMacros;
    // };

    /**
     * For a widget, the macros are expanded from furtheset to nearest, if there
     * is any duplicated macros, the nearest one will be used.
     *  - macros provided externally by users
     *  - widget's own macros if there is one, it is in widgetTdl["macros"]
     *  - macros from its parent widget, these macros may be the parent's own macros, or the 
     *    macros inherited from somewhere else. These macros are passed to this current widget
     *    as a whole
     *  - macros from the Canvas in this display window, this is the lowest priority
     * 
     * external macros must be a set of fully expanded macros, e.g S=SYS, not S=${S1}
     */
    getAllMacros = () => {
        // todo
        const useExternalMacros = g_widgets1.getRoot().getUseExternalMacros();
        // user-provided macros, may contain the parent window macros
        const externalMacros = g_widgets1.getRoot().getExternalMacros();
        // the BaseWidget.expandChannelName() picks the macro that appears first in macros array
        return [...externalMacros, ...this.getMacros()];
    };


    getWindowName = () => {
        return this._windowName;
    };

    handleSelectAFile = (options: Record<string, any>, fileName: string) => {
        this.getSidebar()?.updateFromWidget(undefined, "select-a-file", fileName);
    };

    setWindowName = (newName: string) => {
        this._windowName = newName;
    };
    getChannelNames = (): string[] => {
        return [];
    };

    getScript = () => {
        return this._script;
    };

    setScript = (newScript: string) => {
        this._script = newScript;
    };

    getXGridSize = () => {
        return this._xGridSize;
    }

    setXGridSize = (newSize: number) => {
        this._xGridSize = newSize;
    }

    getYGridSize = () => {
        return this._yGridSize;
    }

    setYGridSize = (newSize: number) => {
        this._yGridSize = newSize;
    }

    getGridColor = () => {
        return this._gridColor;
    }

    setGridColor = (newColor: string) => {
        this._gridColor = newColor;
    }

    getShowGrid = () => {
        return this._showGrid;
    }

    setShowGrid = (newSetting: boolean) => {
        this._showGrid = newSetting;
    }
}
