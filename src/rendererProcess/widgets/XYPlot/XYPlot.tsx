import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { GlobalVariables } from "../../../common/GlobalVariables";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { XYPlotSidebar } from "./XYPlotSidebar";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { type_xAxis, type_yAxis, XYPlotPlot } from "./XYPlotPlot";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { deepMerge } from "../../../common/GlobalMethods";

export type type_XYPlot_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[]; // x and y axes channel names, x channel name might be an empty string ""
    groupNames: string[];
    xAxis: type_xAxis;
    yAxes: type_yAxis[];
    rules: type_rules_tdl;
};

export class XYPlot extends BaseWidget {

    showSettingsPage: boolean = false;

    _plot: XYPlotPlot;

    getPlot = () => {
        return this._plot;
    };

    // updatingByInterval: boolean = true;
    constructor(widgetTdl: type_XYPlot_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this.setReadWriteType("write");

        this._plot = new XYPlotPlot(this);
        this.getPlot().setXAxis(deepMerge(this.generateDefaultTdl().xAxis, widgetTdl.xAxis));
        this.getPlot().setYAxes(deepMerge(this.generateDefaultTdl().yAxes, widgetTdl.yAxes));

        // assign the sidebar
        this._sidebar = new XYPlotSidebar(this);
    }

    mapDbrDataWitNewData = (newChannelNames: string[]) => {
        this.getPlot().mapDbrDataWitNewData(newChannelNames);
    };
    
    // ------------------------------ elements ---------------------------------

    // concretize abstract method
    _ElementRaw = () => {
        // guard the widget from double rendering
        this.widgetBeingRendered = true;
        React.useEffect(() => {
            this.widgetBeingRendered = false;
        });
        g_widgets1.removeFromForceUpdateWidgets(this.getWidgetKey());

        this.updateAllStyleAndText();

        return (
            <ErrorBoundary style={this.getStyle()} widgetKey={this.getWidgetKey()}>
                <>
                    <this._ElementBody></this._ElementBody>
                    {this._showSidebar() ? this.getSidebar()?.getElement() : null}
                </>
            </ErrorBoundary>
        );
    };

    _ElementBodyRaw = (): React.JSX.Element => {
        return (
            <div
                id="XYPlot"
                style={
                    this.getElementBodyRawStyle()
                }
            >
                <this._ElementArea></this._ElementArea>
                {this._showResizers() ? <this._ElementResizer /> : null}
                {this.showSettings ? this.getPlot().getElementSettings() : null}
            </div>
        );
    };

    showSettings: boolean = false;

    // only shows the text, all other style properties are held by upper level _ElementBodyRaw
    _ElementAreaRaw = ({ }: any): React.JSX.Element => {
        const xData = [-0.8, -0.4, 0.0, 0.4, 0.8];
        const yData = [-0.5, 0.5, 0.0, -0.5, 0.5];

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
                {this.getPlot().getElement()}
                {/* <this._ElementWebGlPlot xData={xData} yData={yData}></this._ElementWebGlPlot> */}
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


    static generateDefaultTdl = () => {
        const defaultTdl = {
            type: "XYPlot",
            widgetKey: "", // "key" is a reserved keyword
            key: "",
            // the style for outmost div
            // these properties are explicitly defined in style because they are
            // (1) different from default CSS settings, or
            // (2) they may be modified
            style: {
                position: "absolute",
                display: "inline-flex",
                backgroundColor: "rgba(255, 255,255, 1)",
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
                borderWidth: 0,
                borderColor: "rgba(0, 0, 0, 1)",
                fontFamily: GlobalVariables.defaultFontFamily,
                fontSize: GlobalVariables.defaultFontSize,
                fontStyle: GlobalVariables.defaultFontStyle,
                fontWeight: GlobalVariables.defaultFontWeight,
            },
            // the ElementBody style
            text: {
                showLegend: false,
                showFrame: true,
            },
            channelNames: [],
            groupNames: [],
            xAxis: {
                label: "x",
                valMin: 0,
                valMax: 100,
                ticks: [0, 50, 100],
                ticksText: ["0", "50", "100"],
                autoScale: false,
                showGrid: true,
                numGrids: 10,
            },
            yAxes: [],
            rules: [],
        };
        return JSON.parse(JSON.stringify(defaultTdl));
    };

    generateDefaultTdl = XYPlot.generateDefaultTdl;

    // static method for generating a widget tdl with external PV name
    static generateWidgetTdl = (utilityOptions: Record<string, any>): type_XYPlot_tdl => {
        const result = this.generateDefaultTdl();
        result.channelNames = utilityOptions.channelNames as string[];
        return result;
    };

    // override, has 'yAxes' property
    getTdlCopy(newKey: boolean = true): Record<string, any> {
        const result = super.getTdlCopy(newKey);
        result["xAxis"] = JSON.parse(JSON.stringify(this.getPlot().xAxis));
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
    // --------------------- sidebar --------------------------
    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new XYPlotSidebar(this);
        }
    }

    jobsAsOperatingModeBegins() {
        super.jobsAsOperatingModeBegins();
        // the super.jobsAsEditingModeBegins() runs this.processChannelNames()
        // in here we should not remove duplicates
        this.processChannelNames([], false);
        this.getPlot().initXY();
    }

}
