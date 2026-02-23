import * as GlobalMethods from "../../../common/GlobalMethods";
import * as React from "react";
import { GlobalVariables, calcSidebarWidth, getWindowHorizontalScrollBarWidth, type_dbrData } from "../../../common/GlobalVariables";
import { g_widgets1 } from "../../global/GlobalVariables";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { DataViewerSidebar } from "./DataViewerSidebar";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { DataViewerPlot } from "./DataViewerPlot";
import { DataViewerSettings } from "./DataViewerSettings";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { type_LocalChannel_data } from "../../../common/GlobalVariables";

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

export class DataViewer extends BaseWidget {

    showSettingsPage: number = -100;
    _plot: DataViewerPlot;
    _settings: DataViewerSettings;
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

            if (this.getPlot().tracingIsMoving === true) {
                // update this.getPlot().xAxis.valMin and valMax
                const DT = this.getPlot().xAxis.valMax - this.getPlot().xAxis.valMin;
                this.getPlot().xAxis.valMax = Date.now();
                this.getPlot().xAxis.valMin = Date.now() - DT;
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
        this._settings = new DataViewerSettings(this);
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

    getSettings = () => {
        return this._settings;
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
                    {this.getShowSettingsPage() === -1 && (!g_widgets1.isEditing()) ? this.getSettings().getElement() : null}
                    {this.getSettings().getElementTraceSetting(this.getShowSettingsPage())}
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
                {g_widgets1.isEditing() ? <this._ElementMask></this._ElementMask> : this.getPlot().getElement()}
            </div>
        );
    };

    _ElementMask = () => {
        return (<div style={{
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(255,0,0,0)"
        }}>
        </div>)
    }

    // concretize abstract method
    _Element = React.memo(this._ElementRaw, () => this._useMemoedElement());
    _ElementArea = React.memo(this._ElementAreaRaw, () => this._useMemoedElement());

    // -------------------- helper functions ----------------

    setShowSettingsPage = (index: number) => {
        this.showSettingsPage = index;
    }

    getShowSettingsPage = () => {
        return this.showSettingsPage;
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
