import * as GlobalMethods from "../../../common/GlobalMethods";
import * as React from "react";
import { GlobalVariables, calcSidebarWidth, getWindowHorizontalScrollBarWidth, type_dbrData } from "../../../common/GlobalVariables";
import { g_widgets1 } from "../../global/GlobalVariables";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { DataViewerSidebar } from "./DataViewerSidebar";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { DataViewerPlot } from "./DataViewerPlot";
import { DataViewerMainSettings } from "./DataViewerMainSettings";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { type_LocalChannel_data } from "../../../common/GlobalVariables";
import { DataViewerTraceSettings } from "./DataViewerTraceSettings";

export type type_DataViewer_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
    // Data Viewer specific
    yAxes: Record<string, any>[];
};


export enum settingsIndexChoices {
    NONE = -2,
    MAIN = -1,
    TRACE_0 = 0,
    TRACE_1,
    TRACE_2,
    TRACE_3,
    TRACE_4,
    TRACE_5,
    TRACE_6,
    TRACE_7,
    TRACE_8,
    TRACE_9,
    TRACE_10,
    TRACE_11,
    TRACE_12,
    TRACE_13,
    TRACE_14,
    TRACE_15,
    TRACE_16,
    TRACE_17,
    TRACE_18,
    TRACE_19,
    TRACE_20,
    TRACE_21,
    TRACE_22,
    TRACE_23,
    TRACE_24,
    TRACE_25,
    TRACE_26,
    TRACE_27,
    TRACE_28,
    TRACE_29,
    TRACE_30,
    TRACE_31,
    TRACE_32,
    TRACE_33,
    TRACE_34,
    TRACE_35,
    TRACE_36,
    TRACE_37,
    TRACE_38,
    TRACE_39,
    TRACE_40,
    TRACE_41,
    TRACE_42,
    TRACE_43,
    TRACE_44,
    TRACE_45,
    TRACE_46,
    TRACE_47,
    TRACE_48,
    TRACE_49,
}


export class DataViewer extends BaseWidget {

    _settingsIndex: settingsIndexChoices = settingsIndexChoices.NONE;
    _plot: DataViewerPlot;
    _mainSettings: DataViewerMainSettings;
    _traceSettings: DataViewerTraceSettings;
    updateInterval: any = undefined;

    constructor(widgetTdl: type_DataViewer_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this.setReadWriteType("write");

        // update plot every "updatePeriod" time
        this.updateInterval = setInterval(() => {
            if (g_widgets1.isEditing()) {
                return;
            }

            const plot = this.getPlot();
            const xAxis = plot.xAxis;
            if (plot.tracingIsMoving === true) {
                const DT = xAxis.valMax - xAxis.valMin;
                xAxis.valMax = Date.now();
                xAxis.valMin = Date.now() - DT;
            }

            this.updatePlot(true);

            // fetch archive data if needed
            // this.getPlot().fetchArchiveData();
        }, this.getText()["updatePeriod"] * 1000);


        setTimeout(() => {
            if (this._plot === undefined) {
                this._plot = new DataViewerPlot(this);
                this.getPlot().setYAxes(JSON.parse(JSON.stringify(widgetTdl.yAxes)));
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
        this.getPlot().setYAxes(JSON.parse(JSON.stringify(widgetTdl.yAxes)));
        this._mainSettings = new DataViewerMainSettings(this);
        this._traceSettings = new DataViewerTraceSettings(this);

        // the Settings page needs side bar component
        this.createSidebar();
    }

    restartUpdateInterval = () => {
        clearInterval(this.updateInterval);
        this.updateInterval = setInterval(() => {
            if (g_widgets1.isEditing()) {
                return;
            }

            if (this.getPlot().tracingIsMoving === true) {
                // update this.getPlot().xAxis.valMin and valMax
                const DT = this.getPlot().xAxis.valMax - this.getPlot().xAxis.valMin;
                this.getPlot().xAxis.valMax = Date.now();
                this.getPlot().xAxis.valMin = Date.now() - DT;
            }
            this.updatePlot(true);
        }, this.getText()["updatePeriod"] * 1000);

        if (g_widgets1.isEditing()) {
            return;
        }

        if (this.getPlot().tracingIsMoving === true) {
            // update this.getPlot().xAxis.valMin and valMax
            const DT = this.getPlot().xAxis.valMax - this.getPlot().xAxis.valMin;
            this.getPlot().xAxis.valMax = Date.now();
            this.getPlot().xAxis.valMin = Date.now() - DT;
        }
        this.updatePlot(true);

    }

    mapDbrDataWitNewData = (newDbrData: Record<string, type_dbrData | type_dbrData[] | type_LocalChannel_data | undefined>) => {
        this.getPlot().mapDbrDataWitNewData(newDbrData);
    };

    mapDbrDataWitNewArchiveData = (data: {
        displayWindowId: string,
        widgetKey: string,
        channelName: string,
        startTime: number, // ms since epoch // "2024-01-01 01:23:45", no ms
        endTime: number,
        archiveData: [number[], number[]],
    }) => {
        this.getPlot().mapDbrDataWitNewArchiveData(data);
    };

    updatePlot = (doFlush: boolean = true) => {
        this.getPlot().updatePlot(doFlush);
    };

    getMainSettings = () => {
        return this._mainSettings;
    };
    getTraceSettings = () => {
        return this._traceSettings;
    };

    // ------------------------------ elements ---------------------------------

    // concretize abstract method
    _ElementRaw = () => {

        this.setAllStyle({ ...this.getStyle(), ...this.getRulesStyle() });
        this.setAllText({ ...this.getText(), ...this.getRulesText() });

        // the web mode needs this to adjust the plot area in the beginning
        React.useEffect(() => {
            const mainProcessMode = g_widgets1.getRoot().getDisplayWindowClient().getMainProcessMode();
            if (mainProcessMode === "web") {
                var resizeEvent = new Event('resize');
                // Dispatch the event to the window object
                window.dispatchEvent(resizeEvent);
            }
        }, [])

        return (
            <ErrorBoundary style={this.getStyle()} widgetKey={this.getWidgetKey()}>
                <div
                    style={
                        this.getElementBodyRawStyle()
                    }
                    id="DataViewer"
                >
                    <this._ElementArea></this._ElementArea>
                    {this.showResizers() ? <this._ElementResizer /> : null}
                    {this.getMainSettings().getElement()}
                    {this.getTraceSettings().getElement()}
                </div>
                {this.showSidebar() ? this.getSidebar()?.getElement() : null}
            </ErrorBoundary>
        );
    };

    _ElementAreaRaw = ({ }: any): React.JSX.Element => {

        React.useEffect(() => {
            const plot = this.getPlot();
            let ii = 0;
            for (const yAxis of Object.values(plot.yAxes)) {
                const channelName = yAxis["label"];
                plot.renameTrace(ii, channelName, false, true);
                ii++;
            }
            plot.updatePlot(true);

        }, [])

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
                    fontFamily: this.getStyle().fontFamily,
                    fontSize: this.getStyle().fontSize,
                    fontStyle: this.getStyle().fontStyle,
                    whiteSpace: "nowrap",
                }}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                {this.getPlot().getElement()}
            </div>
        );
    };


    _Element = React.memo(this._ElementRaw, () => this._useMemoedElement());
    _ElementArea = React.memo(this._ElementAreaRaw, () => this._useMemoedElement());

    // -------------------- helper functions ----------------

    setSettingsIndex = (newIndex: settingsIndexChoices) => {
        this._settingsIndex = newIndex;
    }

    getSettingsIndex = () => {
        return this._settingsIndex;
    }
    
    hasData = () => {
        for (const yAxis of this.getPlot().yAxes) {
            if (yAxis["xData"].length > 0 && yAxis["yData"].length > 0) {
                return true;
            }
        }
        return false;

    }

    getPlot = () => {
        return this._plot;
    };

    getYAxes = () => {
        return this.getPlot().yAxes;
    };

    // -------------------------- tdl -------------------------------


    static generateDefaultTdl = () => {

        const defaultTdl: type_DataViewer_tdl = {
            type: "DataViewer",
            widgetKey: "", // "key" is a reserved keyword
            key: "",
            // the style for outmost div
            // these properties are explicitly defined in style because they are
            // (1) different from default CSS settings, or
            // (2) they may be modified
            style: {
                position: "absolute",
                display: "inline-flex",
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
                axisZoomFactor: 1.25,
            },
            channelNames: [],
            groupNames: [],
            yAxes: [],
            rules: [],
        };
        defaultTdl["widgetKey"] = GlobalMethods.generateWidgetKey(defaultTdl["type"]);
        return JSON.parse(JSON.stringify(defaultTdl));
    };

    generateDefaultTdl: () => any = DataViewer.generateDefaultTdl;

    /** 
     * Static method for generating a widget tdl with external PV name <br>
     * 
     * Used in creating utility window, which is borderless
     * 
    */
    static generateWidgetTdl = (utilityOptions: Record<string, any>): type_DataViewer_tdl => {
        const result = this.generateDefaultTdl();
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

    // -------------------------- sidebar ---------------------------
    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new DataViewerSidebar(this);
        }
    }

    jobsAsEditingModeBegins() {
        super.jobsAsEditingModeBegins();
        // clear traces data
        for (const yAxis of this.getPlot().yAxes) {
            yAxis['xData'].length = 0;
            yAxis['yData'].length = 0;
        }
    }


    jobsAsOperatingModeBegins() {
        super.jobsAsOperatingModeBegins();
        // clear traces data
        for (const yAxis of this.getPlot().yAxes) {
            yAxis['xData'].length = 0;
            yAxis['yData'].length = 0;
        }
    }
}
