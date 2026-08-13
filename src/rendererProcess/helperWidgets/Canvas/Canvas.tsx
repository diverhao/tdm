import * as React from "react";
import { Log } from "../../../common/Log";
import { g_widgets1, getMouseEventClientX, getMouseEventClientY, getScrollTop, calcSidebarWidth, getWindowVerticalScrollBarWidth } from "../../global/GlobalVariables";
import { CanvasSidebar } from "./CanvasSidebar";
import { g_flushWidgets } from "../Root/Root";
import { rgbaArrayToRgbaStr } from "../../../common/GlobalMethods";
import { rendererWindowStatus } from "../../global/Widgets";
import { Macros } from "../../../common/Macros";
import { defaultCanvasTdl, type_Canvas_tdl, verifyWidgetTdl } from "../../../common/types/type_widget_tdl";

export class Canvas {
    private _type: string;
    private _widgetKey: string;
    private _style: Record<string, any>;

    // macros for this tdl is managed by Canvas
    // internal macros
    private _macros: Macros;

    private _windowName: string = "";
    private _script: string = "";

    private _sidebar: CanvasSidebar;

    private _xGridSize: number;
    private _yGridSize: number;
    private _gridColor: string;
    private _showGrid: boolean;

    private _widgetEdgeSnapSize: number;

    private _isUtilityWindow: boolean;

    // verifyWidgetTdl(widgetTdl) is success
    inputTdlVerifyResult: string = "";

    constructor(widgetTdl: Record<string, any>) {
        // throws if there is any error
        const normalizedTdl: type_Canvas_tdl = {
            ...structuredClone(defaultCanvasTdl),
            ...widgetTdl,
            style: {
                ...defaultCanvasTdl.style,
                ...widgetTdl.style,
            },
        };

        verifyWidgetTdl(normalizedTdl);

        this._type = widgetTdl.type;
        this._widgetKey = widgetTdl.widgetKey;

        this._style = { ...defaultCanvasTdl.style, ...widgetTdl.style };
        this._macros = new Macros(widgetTdl.macros);
        this._windowName = widgetTdl.windowName === undefined ? "" : widgetTdl.windowName;

        this._xGridSize = normalizedTdl["xGridSize"];
        this._yGridSize = normalizedTdl["yGridSize"];

        this._widgetEdgeSnapSize = normalizedTdl["widgetEdgeSnapSize"];

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
        event: React.SyntheticEvent | null | undefined,
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
                this._macros = new Macros(propertyValue as [string, string][]);
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

    handleWindowResize = (_event: UIEvent) => {

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
                {this.showSidebar() ? this._sidebar.getElement() : null}
            </>
        );
    };

    private _BodyElement = () => {
        React.useEffect(() => {
            if (this.inputTdlVerifyResult !== "") {
                // show an error prompt
                const prompt = g_widgets1.getRoot().getDisplayWindowClient().getPrompt();
                prompt.createElement("dialog-message-box", {
                    // command?: string,
                    messageType: "error", // | "warning" | "info", // symbol
                    humanReadableMessages: [
                        "The Canvas definition in this TDL file is invalid.",
                        "TDM has loaded the default Canvas instead.",
                        "Check and correct the Canvas in the TDL file.",
                    ], rawMessages: [this.inputTdlVerifyResult], // computer generated messages
                    // buttons?: type_DialogMessageBoxButton[],
                    // attachment?: any,
                });
            }
        }, []);
        const mainProcesMode = g_widgets1?.getRoot().getDisplayWindowClient().getMainProcessMode();
        return <div style={{
            ...this._style,
            backgroundImage: this.gridLineImage(),
            backgroundSize: `${this.getXGridSize()}px ${this.getYGridSize()}px`,
            outline: mainProcesMode === "web" ? "1px solid black" : "none",
        }}
            onMouseDown={this._handleMouseDown}
        >
        </div>;
    };

    // --------------------- style and tdl -------------------------

    // grid line background
    gridLineImage = (): string => {
        if (!this.getShowGrid() || !g_widgets1.isEditing()) {
            return "";
        }

        const gridLines: string[] = [];
        const gridColor = this.getGridColor();

        // xGridSize is the horizontal spacing, so it produces vertical lines.
        if (this.getXGridSize() > 2.5) {
            gridLines.push(`repeating-linear-gradient(90deg, ${gridColor} 0 1px, transparent 1px 100%)`);
        }

        // yGridSize is the vertical spacing, so it produces horizontal lines.
        if (this.getYGridSize() > 2.5) {
            gridLines.push(`repeating-linear-gradient(${gridColor} 0 1px, transparent 1px 100%)`);
        }

        return gridLines.join(", ");
    };

    // not getDefaultTdl(), always generate a new key
    static generateDefaultTdl = (): type_Canvas_tdl => {
        const result = structuredClone(defaultCanvasTdl);
        return result;
    };

    getTdlCopy = (newKey: boolean = true): type_Canvas_tdl => {
        const result: type_Canvas_tdl = {
            type: "Canvas",
            widgetKey: "Canvas",
            key: "Canvas",
            style: structuredClone(this.getStyle()) as type_Canvas_tdl["style"],
            macros: structuredClone(this.getMacros().getArr()),
            windowName: this.getWindowName(),
            script: this.getScript(),
            xGridSize: this.getXGridSize(),
            yGridSize: this.getYGridSize(),
            gridColor: this.getGridColor(),
            showGrid: this.getShowGrid(),
            widgetEdgeSnapSize: this.getWidgetEdgeSnapSize(),
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
    getMacros = (): Macros => {
        return this._macros;
    };

    getWidgetEdgeSnapSize = () => {
        return this._widgetEdgeSnapSize;
    }

    setWidgetEdgeSnapSize = (newSize: number) => {
        return this._widgetEdgeSnapSize = newSize;
    }

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
    private showSidebar = (): boolean => {
        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();

        const result = g_widgets1.isEditing() && g_widgets1.getSidebarWidgetKey() === this.getWidgetKey();
        return result;
    };

    // -------------------- getters and setters ---------------------------
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
        const useExternalMacros = g_widgets1.getRoot().getUseExternalMacros();
        // user-provided macros, may contain the parent window macros
        const externalMacros = g_widgets1.getRoot().getExternalMacros();
        const internalMacros = this.getMacros();
        if (useExternalMacros) {
            return Macros.fromMacros(externalMacros, internalMacros);
        } else {
            return Macros.fromMacros(internalMacros, externalMacros);
        }

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
