import { GlobalVariables } from "../../../../common/GlobalVariables";
import { BobPropertyConverter } from "../../../windows/DisplayWindow/BobPropertyConverter";
import { type_rules_tdl, BaseWidgetHelper } from "../BaseWidget/BaseWidgetHelper";
import * as GlobalMethods from "../../../../common/GlobalMethods";
import { rgbaArrayToRgbaStr, rgbaStrToRgbaArray } from "../../../../common/GlobalMethods";
import { EdlConverter } from "../../../windows/DisplayWindow/EdlConverter";
import { v4 as uuidv4 } from "uuid";

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

export type type_yAxis = {
    label: string;
    valMin: number;
    valMax: number;
    lineWidth: number;
    lineColor: string;
    ticks: number[];
    ticksText: (number | string)[];
    autoScale: boolean;
    lineStyle: string;
    pointType: string;
    pointSize: number;
    showGrid: boolean;
    numGrids: number;
    displayScale: "Linear" | "Log10",
};

export type type_xAxis = {
    label: string;
    valMin: number;
    valMax: number;
    ticks: number[];
    ticksText: (number | string)[];
    autoScale: boolean;
    showGrid: boolean;
    numGrids: number;
};

export class XYPlotHelper extends BaseWidgetHelper {
    // override BaseWidget
    static _defaultTdl: type_XYPlot_tdl = {
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
            numGrids: 5,
        },
        yAxes: [],
        rules: [],
    };

    // override
    static generateDefaultTdl = (type: string): type_XYPlot_tdl => {
        // defines type, widgetKey, and key
        const result = super.generateDefaultTdl(type) as type_XYPlot_tdl;
        result.style = JSON.parse(JSON.stringify(this._defaultTdl.style));
        result.text = JSON.parse(JSON.stringify(this._defaultTdl.text));
        result.channelNames = JSON.parse(JSON.stringify(this._defaultTdl.channelNames));
        result.groupNames = JSON.parse(JSON.stringify(this._defaultTdl.groupNames));
        result.xAxis = JSON.parse(JSON.stringify(this._defaultTdl.xAxis));
        result.yAxes = JSON.parse(JSON.stringify(this._defaultTdl.yAxes));
        return result;
    };


    static readonly presetColors: string[] = [
        "rgba(0, 0, 0, 1)",
        "rgba(255, 0, 0, 1)",
        "rgba(0, 0, 255, 1)",
        "rgba(0, 128, 0, 1)",
        "rgba(128, 128, 0, 1)",
        "rgba(0, 128, 128, 1)",
        "rgba(128, 0, 128, 1)",
        "rgba(255, 128, 0, 1)",
    ];

    static getANewColor = (len: number) => {
        // const len = this.yAxes.length;
        const index = len % this.presetColors.length;
        return this.presetColors[index];
    };


    static generateDefaultYAxis = (index: number): type_yAxis => {
        return {
            label: `y${index}`,
            valMin: 0,
            valMax: 100,
            lineWidth: 2,
            lineColor: this.getANewColor(index),
            ticks: [0, 50, 100],
            ticksText: [0, 50, 100],
            autoScale: false,
            lineStyle: "solid",
            pointType: "none",
            pointSize: 2,
            showGrid: true,
            numGrids: 5,
            displayScale: "Linear",
        };
    };

    static convertEdlToTdl = (edl: Record<string, any>): type_XYPlot_tdl => {
        console.log("\n------------", `Parsing "X-Y Graph"`, "------------------\n");
        const tdl = this.generateDefaultTdl("XYPlot") as type_XYPlot_tdl;
        // all properties for this widget

        const propertyNames: string[] = [
            "beginObjectProperties", // not in tdm
            "major", // not in tdm
            "minor", // not in tdm
            "release", // not in tdm
            "x",
            "y",
            "w",
            "h",
            "border",
            "plotAreaBorder", // not in tdm
            "autoScaleBothDirections", // ! not in tdm, what is it?
            "graphTitle", // not in tdm
            "xLabel",
            "yLabel",
            "y2Label",
            "fgColor",
            "bgColor",
            "gridColor", // not in tdm
            "font",
            "plotMode", // ! not in tdm, what is it? below 2 are realted to it
            "nPts", // ! not in tdm
            "updateTimerMs", // ! not in tdm
            "traceCtlPv", // ! not in tdm
            "triggerPv", // ! not in tdm
            "resetPv", // ! not in tdm
            "showXAxis",
            "xAxisSrc",
            "xMax",
            "showYAxis",
            "yAxisSrc",
            "yMax",
            "showY2Axis", // not in tdm
            "y2AxisSrc",
            "y2Max",
            "numTraces", // not in tdm
            "xPv",
            "yPv",
            "nPv", // ! not in tdm, what is it?
            "plotColor",
            "lineThickness",
            "lineStyle",
            "plotStyle", // ! not in tdm, wha tis the difference with lineStyle, line/needle/dot/singledot vs solid/dash?
            "plotSymbolType",
            "xAxisStyle", // nothing means "Linear", "log10" means "Log10"
            "yAxisStyle", // nothing means "Linear", "log10" means "Log10"
            "y2AxisStyle", // nothing means "Linear", "log10" means "Log10"
            "endObjectProperties", // not in tdm
        ];

        tdl["text"]["showFrame"] = false;

        for (const propertyName of propertyNames) {
            const propertyValue = edl[propertyName];
            if (propertyValue === undefined) {
                console.log("Property", `"${propertyName}"`, "is not in edl file");
                continue;
            } else {
                if (propertyName === "x") {
                    tdl["style"]["left"] = EdlConverter.convertEdlXorY(propertyValue, edl["lineWidth"]);
                } else if (propertyName === "y") {
                    tdl["style"]["top"] = EdlConverter.convertEdlXorY(propertyValue, edl["lineWidth"]);
                } else if (propertyName === "w") {
                    tdl["style"]["width"] = EdlConverter.convertEdlWorH(propertyValue, edl["lineWidth"]);
                } else if (propertyName === "h") {
                    tdl["style"]["height"] = EdlConverter.convertEdlWorH(propertyValue, edl["lineWidth"]);
                } else if (propertyName === "h") {
                    tdl["style"]["height"] = EdlConverter.convertEdlWorH(propertyValue, edl["lineWidth"]);
                } else if (propertyName === "border") {
                    if (EdlConverter.convertEdlBoolean(propertyValue) === true) {
                        tdl["style"]["borderWidth"] = 1;
                    }
                } else if (propertyName === "showXAxis") {
                    if (EdlConverter.convertEdlBoolean(propertyValue) === true) {
                        tdl["text"]["showFrame"] = true;
                    }
                } else if (propertyName === "showYAxis") {
                    if (EdlConverter.convertEdlBoolean(propertyValue) === true) {
                        tdl["text"]["showFrame"] = true;
                    }
                } else if (propertyName === "xLabel") {
                    tdl["xAxis"]["label"] = propertyValue.replaceAll(`"`, "");
                } else if (propertyName === "fgColor") {
                    tdl["style"]["color"] = EdlConverter.convertEdlColor(propertyValue);
                } else if (propertyName === "bgColor") {
                    tdl["style"]["backgroundColor"] = EdlConverter.convertEdlColor(propertyValue);
                } else if (propertyName === "font") {
                    const { fontFamily, fontWeight, fontSize, fontStyle } = EdlConverter.convertEdlFont(propertyValue);
                    tdl["style"]["fontFamily"] = fontFamily;
                    tdl["style"]["fontStyle"] = fontStyle;
                    tdl["style"]["fontSize"] = fontSize;
                    tdl["style"]["fontWeight"] = fontWeight;
                } else if (propertyName === "xPv") {
                    EdlConverter.convertEdlXYGraphXYPv("x", propertyValue, edl, tdl);
                } else if (propertyName === "yPv") {
                    EdlConverter.convertEdlXYGraphXYPv("y", propertyValue, edl, tdl);
                } else if (propertyName === "plotColor") {
                    EdlConverter.convertEdlXYGraphPlotColor(propertyValue, edl, tdl);
                } else if (propertyName === "lineThickness") {
                    EdlConverter.convertEdlXYGraphLineThickness(propertyValue, edl, tdl);
                } else if (propertyName === "lineStyle") {
                    EdlConverter.convertEdlXYGraphLineStyle(propertyValue, edl, tdl);
                } else if (propertyName === "plotSymbolType") {
                    EdlConverter.convertEdlXYGraphPlotSymbolType(propertyValue, edl, tdl);
                } else if (propertyName === "plotStyle") {
                    EdlConverter.convertEdlXYGraphPlotStyle(propertyValue, edl, tdl);
                } else {
                    console.log("Skip property", `"${propertyName}"`);
                }
            }
        }

        // must be invoked after yAxes is filled
        EdlConverter.convertEdlXYGraphXYMinMaxVal(edl, tdl);
        EdlConverter.convertEdlXYGraphXYY2AxisSrc(edl, tdl);
        EdlConverter.convertEdlXYGraphYY2Label(edl, tdl);
        EdlConverter.convertEdlXYGraphXYY2AxisStyle(edl, tdl);

        return tdl;
    };


    static convertBobToTdl = (bobWidgetJson: Record<string, any>): type_XYPlot_tdl => {
        console.log("\n------------", `Parsing "xyplot"`, "------------------\n");
        const tdl = this.generateDefaultTdl("XYPlot");
        // all properties for this widget
        const propertyNames: string[] = [
            "type", // not in tdm
            "name", // not in tdm
            "class", // not in tdm
            "x",
            "y",
            "width",
            "height",
            "actions", // not in tdm
            "rules",
            "scripts", // not in tdm
            "visible",
            "tooltip", // not in tdm
            "foreground_color",
            "background_color",
            "title", // not in tdm
            "title_font", // not in tdm
            "show_toolbar", // not in tdm
            "show_legend",
            "x_axis",
            "y_axes",
            "traces",
            "markers", // not in tdm
            "configure", // not in tdm

            // X-Axis Properties (within x_axis):
            // visible
            // title
            // autoscale
            // logscale
            // minimum
            // maximum
            // grid
            // title_font
            // scale_font

            // Y-Axis Properties (within y_axes array):
            // visible
            // title
            // autoscale
            // logscale
            // minimum
            // maximum
            // grid
            // title_font
            // scale_font
            // color

            // Trace Properties (within traces array):
            // name
            // x_pv
            // y_pv
            // y_axis
            // trace_type
            // color
            // width
            // point_type
            // point_size
            // visible

            // Marker Properties (within markers array):
            // color
            // pv
            // interactive
            // value

        ];
        tdl["style"]["width"] = 100;
        tdl["style"]["height"] = 30;

        let bobYAxes: any[] = [];

        for (const propertyName of propertyNames) {
            const propertyValue = bobWidgetJson[propertyName];
            if (propertyValue === undefined) {
                if (propertyName === "widget") {
                    console.log(`There are one or more widgets inside "display"`);
                } else {
                    console.log("Property", `"${propertyName}"`, "is not in bob file");
                }
                continue;
            } else {
                if (propertyName === "x") {
                    tdl["style"]["left"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "y") {
                    tdl["style"]["top"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "width") {
                    tdl["style"]["width"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "height") {
                    tdl["style"]["height"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "rules") {
                    tdl["rules"] = BobPropertyConverter.convertBobRules(propertyValue);
                } else if (propertyName === "visible") {
                    tdl["text"]["invisibleInOperation"] = !BobPropertyConverter.convertBobBoolean(propertyValue);
                } else if (propertyName === "foreground_color") {
                    tdl["style"]["color"] = BobPropertyConverter.convertBobColor(propertyValue);
                } else if (propertyName === "background_color") {
                    tdl["style"]["backgroundColor"] = BobPropertyConverter.convertBobColor(propertyValue);
                } else if (propertyName === "show_legend") {
                    tdl["text"]["showLegend"] = BobPropertyConverter.convertBobBoolean(propertyValue);
                } else if (propertyName === "x_axis") {
                    tdl["xAxis"] = BobPropertyConverter.convertBobXYPlotXAxis(propertyValue);
                } else if (propertyName === "y_axes") {
                    bobYAxes = BobPropertyConverter.convertBobXYPlotYAxes(propertyValue);
                } else if (propertyName === "traces") {
                    tdl["yAxes"] = BobPropertyConverter.convertBobXYPlotTraces(propertyValue);
                } else {
                    console.log("Skip property", `"${propertyName}"`);
                }
            }
        }
        for (const yAxis of tdl["yAxes"]) {
            // channel name is the "label"
            const xPv = (yAxis as any)["xPv"].trim();
            const yPv = (yAxis as any)["yPv"].trim();
            tdl["channelNames"].push(xPv);
            tdl["channelNames"].push(yPv);

            const bobYAxisIndex = (yAxis as any)["axis"];
            const bobYAxis = bobYAxes[bobYAxisIndex];
            if (bobYAxis !== undefined) {
                yAxis["valMin"] = bobYAxis["valMin"];
                yAxis["valMax"] = bobYAxis["valMax"];
                yAxis["displayScale"] = bobYAxis["displayScale"];
                yAxis["ticks"] = bobYAxis["ticks"];
                yAxis["ticksText"] = bobYAxis["ticks"];
                yAxis["autoScale"] = bobYAxis["autoScale"];
                yAxis["showGrid"] = bobYAxis["showGrid"];
            }
            delete (yAxis as any)["xPv"];
            delete (yAxis as any)["yPv"];
            delete (yAxis as any)["axis"];
        }

        return tdl;
    };
}
