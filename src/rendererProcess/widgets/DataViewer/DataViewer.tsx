import * as GlobalMethods from "../../../common/GlobalMethods";
import * as React from "react";
import { GlobalVariables, calcSidebarWidth, getWindowHorizontalScrollBarWidth, type_dbrData } from "../../../common/GlobalVariables";
import { g_widgets1 } from "../../global/GlobalVariables";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { DataViewerSidebar } from "./DataViewerSidebar";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { DataViewerPlot, defaultTicksInfo, defaultYAxis, settingsIndexChoices, type_yAxis } from "./DataViewerPlot";
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
    yAxes: type_yAxis[];
};



export class DataViewer extends BaseWidget {

    _plot: DataViewerPlot;
    _mainSettings: DataViewerMainSettings;
    _traceSettings: DataViewerTraceSettings;
    updateInterval: any = undefined;

    constructor(widgetTdl: type_DataViewer_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this.setReadWriteType("write");

        // plot region
        this._plot = new DataViewerPlot(this);
        const yAxes: type_yAxis[] = [];
        for (const yAxis of widgetTdl.yAxes) {
            yAxes.push(GlobalMethods.deepMerge(defaultYAxis, yAxis));
        }
        this._plot.setYAxes(yAxes);

        // 2 setting pages
        this._mainSettings = new DataViewerMainSettings(this);
        this._traceSettings = new DataViewerTraceSettings(this);

        // the Settings page needs side bar component
        this.createSidebar();

        this.startUpdateInterval();

        // single-window DataViewer does not use "100%" for width or height
        // it needs explicit dimension for proper plotting of traces
        // when the window is resized
        this.registerUtilityWindowResizeCallback((event: any) => {
            this.updatePlot();
        })
    }

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

        // invoked upon the widget rendered for the first time
        React.useEffect(() => {
            const plot = this.getPlot();
            let ii = 0;
            for (const yAxis of Object.values(plot.yAxes)) {
                const channelName = yAxis["label"];
                plot.renameTrace(ii, channelName, false, true);
                ii++;
            }
            this.getPlot().setSelectedTraceIndex(0);
            plot.updatePlot(true);
        }, [])

        const overflow = this.getText().overflowVisible ? "visible" : "hidden";
        const flexDirection = "column";
        const fontFamily = this.getStyle().fontFamily;
        const fontSize = this.getStyle().fontSize;
        const fontStyle = this.getStyle().fontStyle;
        const whiteSpace = "nowrap";

        return (
            <div
                style={{
                    display: "inline-flex",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    userSelect: "none",
                    overflow: overflow,
                    flexDirection: flexDirection,
                    fontFamily: fontFamily,
                    fontSize: fontSize,
                    fontStyle: fontStyle,
                    whiteSpace: whiteSpace,
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

    startUpdateInterval = () => {
        clearInterval(this.updateInterval);
        this.updateInterval = setInterval(() => {
            if (g_widgets1.isEditing()) {
                return;
            }
            const plot = this.getPlot();
            const xAxis = plot.xAxis;
            if (plot.traceIsMoving === true) {
                const DT = xAxis.valMax - xAxis.valMin;
                xAxis.valMax = Date.now();
                xAxis.valMin = Date.now() - DT;
            }
            this.updatePlot(true);
        }, this.getText()["updatePeriod"] * 1000);

        // ensure there is one update after 1 second
        setTimeout(() => {
            if (g_widgets1 === undefined) {
                return;
            }

            if (g_widgets1.isEditing()) {
                return;
            }
            const plot = this.getPlot();
            const xAxis = plot.xAxis;
            if (plot.traceIsMoving === true) {
                const DT = xAxis.valMax - xAxis.valMin;
                xAxis.valMax = Date.now();
                xAxis.valMin = Date.now() - DT;
            }
            this.updatePlot(true);

        }, 1000)
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

    // ----------------- getters and setters ------------------

    getMainSettings = () => {
        return this._mainSettings;
    };
    getTraceSettings = () => {
        return this._traceSettings;
    };

    setSettingsIndex = (newIndex: settingsIndexChoices) => {
        this.getPlot().setSettingsIndex(newIndex);
    }

    getSettingsIndex = () => {
        return this.getPlot().getSettingsIndex();
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
            rules: [],
            yAxes: [],
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
        result.style["borderWidth"] = 0;
        result.channelNames = utilityOptions.channelNames as string[];
        return result;
    };

    getTdlCopy(newKey: boolean = true): Record<string, any> {
        const result = super.getTdlCopy(newKey);
        result["yAxes"] = this.getPlot().yAxes.map(({ xData, yData, ticksInfo, ...rest }) => {
            return JSON.parse(JSON.stringify(rest));
        });
        result["yAxes"].map((yAxis: type_yAxis) => {
            yAxis["xData"] = [];
            yAxis["yData"] = [];
            yAxis["ticksInfo"] = JSON.parse(JSON.stringify(defaultTicksInfo));
        })
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
