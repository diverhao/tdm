import * as React from "react";
import { GlobalVariables, g_widgets1 } from "../../global/GlobalVariables";
import { type_widget } from "../../global/Widgets";
import { g_setWidgets1 } from "../../global/GlobalVariables";
import { Widgets, rendererWindowStatus } from "../../global/Widgets";
import { TextUpdate } from "../../widgets/TextUpdate/TextUpdate";
import { Canvas } from "../Canvas/Canvas";
import { DisplayWindowClient } from "../../../mainProcess/windows/DisplayWindow/DisplayWindowClient";
import { type_tdl } from "../../../mainProcess/file/FileReader";
import { Log } from "../../../mainProcess/log/Log";
import { ActionButton } from "../../widgets/ActionButton/ActionButton";

/**
 * Update the widgets.
 */
export let g_flushWidgets: any = undefined;

// todo: macros
/**
 * Represents the root JSX elements. All widgets, including `Canvas`, `BaseWidget` and `GroupSelection2`, are
 * its children. <br>
 *
 * This object is re-created whenever a new tdl file arrives at display window
 */
export class Root {
    /**
     * Update widgets <br>
     *
     * Stolen from _Element
     */
    private _setWidgets: any = undefined;
    private _displayWindowClient: DisplayWindowClient;

    /**
     * The inital mode of this display window: editing or operating.
     */
    private readonly _initialMode: rendererWindowStatus.editing | rendererWindowStatus.operating;

    /**
     * If this display window editable.
     */
    private readonly _editable: boolean;

    /**
     * Macros set by upper-level window
     */
    private _externalMacros: [string, string][] = [];
    private _useExternalMacros: boolean;

    isNewTdl: boolean = true;

    // (1) create g_widgets1: Widgets object according to the tdl file,
    //     if there is no "Canvas" object, create it
    // (2) assign macros to Canvas, move to Widgets
    // (3) set external macros, move to Widgets
    // (4) create GroupSelection2, it is not explicitly in tdl, move to Widgets
    // (5) define g_flushWidgets function
    // (6) start listeners
    // (7) context menu
    constructor(
        tdl: type_tdl,
        displayWindowClient: DisplayWindowClient,
        initialMode: rendererWindowStatus.editing | rendererWindowStatus.operating,
        editable: boolean,
        externalMacros: [string, string][], // go to Canvas
        useExternalMacros: boolean // go to Canvas
    ) {
        this._displayWindowClient = displayWindowClient;
        this._initialMode = initialMode;
        this._editable = editable;
        this._externalMacros = JSON.parse(JSON.stringify(externalMacros));
        this._useExternalMacros = useExternalMacros;
        g_setWidgets1(new Widgets(tdl, this));
        g_flushWidgets = this._flushWidgets;

        // this.startToListen();
    }

    // ------------------- mouse event -----------------------


    // ------------------------ elements -------------------------
    private _flushWidgets = (notMemoedWidgets: string[] = []) => {
        try {
            for (let widgetKey of notMemoedWidgets) {
                g_widgets1.addToForceUpdateWidgets(widgetKey);
            }
            if (this._setWidgets !== undefined) {
                this._setWidgets([...g_widgets1.getWidgets().values()]);
            }
        } catch (e) {
            Log.error(e);
        }
    };

    // singleton class
    private _Element = () => {
        // synchronize with an object g_widgets
        const [widgets, setWidgets] = React.useState<(type_widget | undefined)[]>([...g_widgets1.getWidgets().values()]);

        // always use brutal force!
        this._setWidgets = setWidgets;

        if (this.isNewTdl) {
            Log.info("Start to render new tdl", this.getDisplayWindowClient().getTdlFileName());
        }


        React.useEffect(() => {
            if (this.isNewTdl) {
                this.isNewTdl = false;
                const displayWindowClient = this.getDisplayWindowClient();
                const displayWindowId = displayWindowClient.getWindowId();
                const ipcManager = displayWindowClient.getIpcManager();
                const canvas = g_widgets1.getWidget2("Canvas") as Canvas;
                const windowName = canvas.getWindowName();
                const tdlFileName = g_widgets1.getTdlFileName();
                const mode = g_widgets1.isEditing() ? "editing" : "operating";
                ipcManager.sendFromRendererProcess("new-tdl-rendered",
                    {
                        displayWindowId: displayWindowId,
                        windowName: windowName,
                        tdlFileName: tdlFileName,
                        mode: mode
                    }
                );
                Log.info("New tdl", this.getDisplayWindowClient().getTdlFileName(), "rendered")
                if (this.getDisplayWindowClient().getMainProcessMode() === "web") {
                    this.getDisplayWindowClient().savePageData();
                    Log.info("Saved page data for refresh");
                }

                // lazy render ActionButtons
                setTimeout(() => {
                    for (const widget of widgets) {
                        if (widget !== undefined && widget instanceof ActionButton && widget.getActions().length > 1) {
                            widget.setDropDownActivated((value: any) => {
                                return true;
                            })
                        }
                    }
                }, 200 + 0.1 * widgets.length);
            }
            // todo: history
            // g_widgets1.getEditorHistory().setIsValidHistory(true);
            // g_widgets1.addToHistories([...g_widgets1.getWidgets().keys()], g_widgets1.getWidgetsIndices([...g_widgets1.getWidgets().keys()]));
        }, []);

        // "Root" does not need a size, it is the parent of "Canvas" and any widgets
        // we only need to change the size of "Canvas"
        return (
            <div
                style={{
                    // default font
                    fontSize: GlobalVariables.defaultFontSize,
                    fontFamily: GlobalVariables.defaultFontFamily,
                    fontStyle: GlobalVariables.defaultFontStyle,
                    fontWeight: GlobalVariables.defaultFontWeight,
                }}
            >
                {widgets.map((widget: any) => {
                    // widget is null when it is selected and stored in GroupSelection2._widgets
                    // In this case, this widget is rendered under GroupSelection2 widget
                    if (widget === undefined) {
                        return null;
                    }

                    return widget.getElement();
                })}
            </div>
        );
    };

    // ------------------------ getters and setters -------------------------
    getExternalMacros = () => {
        return this._externalMacros;
    };

    getUseExternalMacros = () => {
        return this._useExternalMacros;
    };

    setExternalMacros = (newMacros: [string, string][]) => {
        this._externalMacros = JSON.parse(JSON.stringify(newMacros));
    };

    setUseExternalMacros = (use: boolean) => {
        this._useExternalMacros = use;
    };

    getDisplayWindowClient = () => {
        return this._displayWindowClient;
    };

    getEditable = () => {
        return this._editable;
    };

    getElement = (): React.JSX.Element => {
        return <this._Element></this._Element>;
    };

    getInitialMode = () => {
        return this._initialMode;
    };
}
