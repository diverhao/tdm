import * as React from "react";
import { GlobalVariables, calcSidebarWidth, g_widgets1, getWindowHorizontalScrollBarWidth } from "../../global/GlobalVariables";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { DataViewerSidebar } from "./DataViewerSidebar";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { DataViewerPlot } from "./DataViewerPlot";
import { DataViewerSettings } from "./DataViewerSettings";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";

export type type_DataViewer_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    yAxes: Record<string, any>[];
    rules: type_rules_tdl;
};

export class DataViewer extends BaseWidget {
    // todo: more pre-defined color,
    // when the predefined colors are used up, getNewColor() will generate random colors

    showSettingsPage: boolean = false;

    _plot: DataViewerPlot;
    _settings: DataViewerSettings;

    updateInterval: any = undefined;

    getPlot = () => {
        return this._plot;
    };

    reCalcPlot: boolean = false;

    getReCalcPlot = () => {
        return this.reCalcPlot;
    }

    setReCalcPlot = (newValue: boolean) => {
        this.reCalcPlot = newValue;
    }

    // updatingByInterval: boolean = true;
    constructor(widgetTdl: type_DataViewer_tdl) {
        super(widgetTdl);

        this.setStyle({ ...DataViewer._defaultTdl.style, ...widgetTdl.style });
        this.setText({ ...DataViewer._defaultTdl.text, ...widgetTdl.text });

        // assign the sidebar
        this._sidebar = new DataViewerSidebar(this);

        // this.tracesInitialized = false;

        // setTimeout(() => {
        //     const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();

        //     const startTime = GlobalMethods.getLocalOffsetMsTimeString(-20*60*1000).split(".")[0];
        //     const endTime = GlobalMethods.getLocalOffsetMsTimeString(-1*60*1000).split(".")[0];
        //     // const endTime = `${Date.now() - 15* 1000}`.replace("T", " ").replace("Z", "");
        //     displayWindowClient.getIpcManager().sendFromRendererProcess("request-archive-data", {
        //         displayWindowId: displayWindowClient.getWindowId(),
        //         widgetKey: this.getWidgetKey(),
        //         channelName: "RTBT_Diag:BCM25I:Power60",
        //         // startTime: "2024-05-21 00:00:00", // "2024-01-01 01:23:45", no ms
        //         // endTime: "2013-05-21 01:00:00",
        //         startTime: startTime,
        //         endTime: endTime,

        //     })
        // }, 10000)

        this.updateInterval = setInterval(() => {
            // update plot every "updatePeriod" time
            if (g_widgets1.isEditing()) {
                return;
            }
            this.setReCalcPlot(false);
            this.updatePlot(true, true, true);
            // fetch archive data if needed
            // this.getPlot().fetchArchiveData();
        }, this.getText()["updatePeriod"] * 1000);


        setTimeout(() => {
            if (this._plot === undefined) {
                this._plot = new DataViewerPlot(this);
                this.getPlot().setYAxes([...DataViewer._defaultTdl.yAxes, ...widgetTdl.yAxes]);
            }
        }, 0);

        window.addEventListener("resize", () => {
            if (this.getText().singleWidget === false) {
                return;
            }
            if (g_widgets1.isEditing()) {
                this.getStyle().width = window.innerWidth - calcSidebarWidth() - getWindowHorizontalScrollBarWidth();
                this.getStyle().height = window.innerHeight;
                this.getText().singleWidget = false;
            } else {
                this.getStyle().width = window.innerWidth;
                this.getStyle().height = window.innerHeight;
            }
            this.updatePlot();
        });

        this._plot = new DataViewerPlot(this);
        this.getPlot().setYAxes([...DataViewer._defaultTdl.yAxes, ...widgetTdl.yAxes]);
        this._settings = new DataViewerSettings(this);
    }

    restartUpdateInterval = () => {
        clearInterval(this.updateInterval);
        this.updateInterval = setInterval(() => {
            if (g_widgets1.isEditing()) {
                return;
            }
            this.setReCalcPlot(false);
            this.updatePlot(true, true, true);
        }, this.getAllText()["updatePeriod"] * 1000);
    }

    mapDbrDataWitNewData = (newChannelNames: string[]) => {
        this.getPlot().mapDbrDataWitNewData(newChannelNames);
    };

    mapDbrDataWitNewArchiveData = (data: {
        displayWindowId: string,
        widgetKey: string,
        channelName: string,
        startTime: string, // "2024-01-01 01:23:45", no ms
        endTime: string,
        archiveData: any
    }) => {
        this.getPlot().mapDbrDataWitNewArchiveData(data);
    };

    updatePlot = (useNewestTime: boolean = false, doFlush: boolean = true, dynamicUpdate: boolean = false) => {
        this.getPlot().updatePlot(useNewestTime, doFlush, dynamicUpdate);
    };

    getSettings = () => {
        return this._settings;
    };
    // ------------------ hard coded dimensions ------------------------

    // ------------------------- event ---------------------------------
    // concretize abstract method
    updateFromSidebar = (event: any, propertyName: string, propertyValue: number | string | number[] | string[] | boolean | undefined) => { };

    // defined in super class
    // _handleMouseDown()
    // _handleMouseMove()
    // _handleMouseUp()
    // _handleMouseDownOnResizer()
    // _handleMouseMoveOnResizer()
    // _handleMouseUpOnResizer()
    // _handleMouseDoubleClick()

    // ----------------------------- geometric operations ----------------------------

    // defined in super class
    // simpleSelect()
    // selectGroup()
    // select()
    // simpleDeSelect()
    // deselectGroup()
    // deSelect()
    // move()
    // resize()

    // ------------------------------ group ------------------------------------

    // defined in super class
    // addToGroup()
    // removeFromGroup()

    // ---------------------------- trace manipulation ----------------------------------
    // hide/show/remove/insert trace


    // --------------------------- getters --------------------------------------

    // ------------------------------ elements ---------------------------------

    // concretize abstract method
    _ElementRaw = () => {
        // must do it for every widget
        React.useEffect(() => {
            //! this widget is always rendered each time to avoid trace discontinunity 
            //! when the plot is moved horizontally
            // g_widgets1.removeFromForceUpdateWidgets(this.getWidgetKey());
        });

        // the web mode needs this to adjust the plot area in the beginning
        React.useEffect(() => {
            const mainProcessMode = g_widgets1.getRoot().getDisplayWindowClient().getMainProcessMode();
            if (mainProcessMode === "web") {
                var resizeEvent = new Event('resize');
                // Dispatch the event to the window object
                window.dispatchEvent(resizeEvent);
            }
        })

        return (
            <ErrorBoundary style={this.getStyle()} widgetKey={this.getWidgetKey()}>
                <>
                    <this._ElementBody></this._ElementBody>
                    {this._showSidebar() ? this.getSidebar()?.getElement() : null}
                </>
            </ErrorBoundary>
        );
    };

    _ElementBodyRaw = (): JSX.Element => {
        return (
            <div
                style={
                    this.getElementBodyRawStyle()
                }
            >
                <this._ElementArea></this._ElementArea>
                {this._showResizers() ? <this._ElementResizer /> : null}
                {this.showSettingsPage && (!g_widgets1.isEditing()) ? this.getSettings().getElement() : null}
            </div>
        );
    };

    // only shows the text, all other style properties are held by upper level _ElementBodyRaw
    _ElementAreaRaw = ({ }: any): JSX.Element => {
        if (g_widgets1.isEditing() === true) {
            this.getPlot().wasEditing = true;
        }

        if ((g_widgets1.isEditing() === false && this.getPlot().wasEditing === true) || this.getPlot().tracesInitialized === false) {
            // changed from editing to operating mode
            this.getPlot().initTraces();
            // in case the update period is too long, update 0.5 second later
            setTimeout(() => {
                // move the time to Date.now()
                // this.updatingByInterval = true;
                this.updatePlot(true);
                // this.updatingByInterval = false;
            }, 500);
        }

        return (
            <div
                style={{
                    display: "inline-flex",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    userSelect: "none",
                    // different from regular widget
                    overflow: this.getText().overflowVisible ? "visible" : "hidden",
                    flexDirection: "column",
                    // whiteSpace: this.getText().wrapWord ? "pre-line" : "nowrap",
                    // justifyContent: this.getText().horizontalAlign,
                    // alignItems: this.getText().verticalAlign,
                    fontFamily: this.getStyle().fontFamily,
                    fontSize: this.getStyle().fontSize,
                    fontStyle: this.getStyle().fontStyle,
                    // outline: this._getElementAreaRawOutlineStyle(),
                    whiteSpace: "nowrap",
                }}
                // title={"tooltip"}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                {/* <this.PlotWrapper></this.PlotWrapper> */}
                {this.getPlot().getElement()}
            </div>
        );
    };

    // concretize abstract method
    _Element = React.memo(this._ElementRaw, () => this._useMemoedElement());
    _ElementArea = React.memo(this._ElementAreaRaw, () => this._useMemoedElement());
    _ElementBody = React.memo(this._ElementBodyRaw, () => this._useMemoedElement());

    // _Element = React.memo(this._ElementRaw, () => {return false});
    // _ElementArea = React.memo(this._ElementAreaRaw, () => {return false});
    // _ElementBody = React.memo(this._ElementBodyRaw, () => {return false});

    // defined in super class
    // getElement()
    // getSidebarElement()

    // -------------------- helper functions ----------------

    // defined in super class
    // _showSidebar()
    // _showResizers()
    // _useMemoedElement()
    // hasChannel()
    // isInGroup()
    // isSelected()
    // _getElementAreaRawOutlineStyle()

    _getChannelValue = () => {
        return this._getFirstChannelValue();
    };
    _getChannelSeverity = () => {
        return this._getFirstChannelSeverity();
    };
    _getChannelUnit = () => {
        return this._getFirstChannelUnit();
    };

    // ----------------------- styles -----------------------

    // defined in super class

    // _resizerStyle
    // _resizerStyles
    // StyledToolTipText
    // StyledToolTip

    // -------------------------- tdl -------------------------------

    // override BaseWidget
    static _defaultTdl: type_DataViewer_tdl = {
        type: "DataViewer",
        widgetKey: "", // "key" is a reserved keyword
        key: "",
        // the style for outmost div
        // these properties are explicitly defined in style because they are
        // (1) different from default CSS settings, or
        // (2) they may be modified
        style: {
            position: "absolute",
            display: "inline-block",
            backgroundColor: "rgba(255, 255, 255, 1)",
            left: 0,
            top: 0,
            width: 500,
            height: 300,
            outlineStyle: "none",
            outlineWidth: 1,
            outlineColor: "black",
            transform: "rotate(0deg)",
            color: "rgba(0,0,0,1)",
            borderStyle: "solid",
            borderWidth: 1,
            borderColor: "rgba(0, 0, 0, 1)",
            horizontalAlign: "flex-start",
            verticalAlign: "flex-start",
            fontFamily: GlobalVariables.defaultFontFamily,
            fontSize: GlobalVariables.defaultFontSize,
            fontStyle: GlobalVariables.defaultFontStyle,
            fontWeight: GlobalVariables.defaultFontWeight,
        },
        // the ElementBody style
        text: {
            wrapWord: true,
            showUnit: false,
            alarmBorder: true,
            highlightBackgroundColor: "rgba(255, 255, 0, 1)",
            overflowVisible: true,
            singleWidget: false,
            title: "Title",
            updatePeriod: 1, // second
        },
        channelNames: [],
        groupNames: [],
        yAxes: [],
        rules: [],
    };

    // override
    static generateDefaultTdl = (type: string) => {
        // defines type, widgetKey, and key
        const result = super.generateDefaultTdl(type) as type_DataViewer_tdl;
        result.style = JSON.parse(JSON.stringify(this._defaultTdl.style));
        result.text = JSON.parse(JSON.stringify(this._defaultTdl.text));
        result.channelNames = JSON.parse(JSON.stringify(this._defaultTdl.channelNames));
        result.groupNames = JSON.parse(JSON.stringify(this._defaultTdl.groupNames));
        result.yAxes = JSON.parse(JSON.stringify(this._defaultTdl.yAxes));
        return result;
    };

    /** 
     * Static method for generating a widget tdl with external PV name <br>
     * 
     * Used in creating utility window, which is borderless
     * 
    */
    static generateWidgetTdl = (utilityOptions: Record<string, any>): type_DataViewer_tdl => {
        const result = this.generateDefaultTdl("DataViewer");
        // 
        result.style["borderWidth"] = 0;
        result.channelNames = utilityOptions.channelNames as string[];
        return result;
    };

    // override, has 'yAxes' property
    getTdlCopy(newKey: boolean = true): Record<string, any> {
        const result = super.getTdlCopy(newKey);
        result["yAxes"] = JSON.parse(JSON.stringify(this.getPlot().yAxes));
        return result;
    }

    // --------------------- getters -------------------------

    // defined in super class
    // getType()
    // getWidgetKey()
    // getStyle()
    // getText()
    // getSidebar()
    // getGroupName()
    // getGroupNames()
    // getupdateFromWidget()
    // getResizerStyle()
    // getResizerStyles()

    getYAxes = () => {
        return this.getPlot().yAxes;
    };

    // ---------------------- setters -------------------------

    // ---------------------- channels ------------------------

    // defined in super class

    // getChannelNames()
    // expandChannelNames()
    // getExpandedChannelNames()
    // setExpandedChannelNames()
    // expandChannelNameMacro()

    // ------------------------ z direction --------------------------

    // defined in super class
    // moveInZ()

    // ------------------------ customized plot --------------------------
    // -------------------------- sidebar ---------------------------
    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new DataViewerSidebar(this);
        }
    }
}
