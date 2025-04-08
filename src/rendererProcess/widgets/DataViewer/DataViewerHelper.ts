import { BobPropertyConverter } from "../../../mainProcess/windows/DisplayWindow/BobPropertyConverter";
import { type_rules_tdl, BaseWidgetHelper } from "../BaseWidget/BaseWidgetHelper";
import * as GlobalMethods from "../../global/GlobalMethods";
import { rgbaArrayToRgbaStr, rgbaStrToRgbaArray } from "../../global/GlobalMethods";
import { EdlConverter } from "../../../mainProcess/windows/DisplayWindow/EdlConverter";
import { v4 as uuidv4 } from "uuid";
import { GlobalVariables } from "../../global/GlobalVariables";


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


type type_yAxis = {
    label: string;
    valMin: number;
    valMax: number;
    lineWidth: number;
    lineColor: string;
    // ticks and ticksText are not used in the plot, we simply divide the valMin and valMax to 5 intervals
    ticks: number[];
    ticksText: (number | string)[];
    show: boolean;
    bufferSize: number;
    displayScale: "Linear" | "Log10";
};

type type_xAxis = {
    label: string;
    valMin: number;
    valMax: number;
    ticks: number[];
    ticksText: string[]
};


export class DataViewerHelper extends BaseWidgetHelper {

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

    static generateDefaultYAxis = (): type_yAxis => {
        return {
            label: "",
            valMin: 0, // updated every time
            valMax: 10, // updated every time
            lineWidth: 2,
            lineColor: `rgba(255, 0, 0, 1)`,
            ticks: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // updated every time
            ticksText: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // updated every time
            show: true,
            bufferSize: 50000,
            displayScale: "Linear",
        }
    }


    static convertStpToTdl = (edl: Record<string, string>, type: "Data Viewer"): type_DataViewer_tdl => {
        console.log("\n------------", `Parsing ${type}`, "------------------\n");
        const tdl = this.generateDefaultTdl("DataViewer") as type_DataViewer_tdl;
        // all properties for this widget

        const propertyNames: string[] = [
            "StripConfig",                   // 1.2, ignore
            "Strip.Time.Timespan",           // 3600, ignore
            "Strip.Time.NumSamples",         // 7200,                      -> yAxes[ii]["bufferSize"]
            "Strip.Time.SampleInterval",     // 2.000000, ignore
            "Strip.Time.RefreshInterval",    // 2.000000, ignore
            "Strip.Color.Background",        // 65535     65535     65535  -> style["backgroundColor"]
            "Strip.Color.Foreground",        // 0         0         0      -> style["color"]
            "Strip.Color.Grid",              // 48891     48891     48891  -> ignore
            "Strip.Color.Color1",            // 0         0         65535  -> color for first curve
            "Strip.Color.Color2",            // 0         0         65535  -> ignore
            "Strip.Color.Color3",            // 0         0         65535  -> ignore
            "Strip.Color.Color4",            // 0         0         65535  -> ignore
            "Strip.Color.Color5",            // 0         0         65535  -> ignore
            "Strip.Color.Color6",            // 0         0         65535  -> ignore
            "Strip.Color.Color7",            // 0         0         65535  -> ignore
            "Strip.Color.Color8",            // 0         0         65535  -> ignore
            "Strip.Color.Color9",            // 0         0         65535  -> ignore
            "Strip.Color.Color10",            // 0         0         65535  -> ignore
            "Strip.Option.GridXon",          // 2                          -> ignore
            "Strip.Option.GridYon",          // 2                          -> ignore
            "Strip.Option.AxisYcolorStat",   // 1                          -> ignore
            "Strip.Option.GraphLineWidth",   // 2                          -> yAxes[ii]["lineWidth"]
            // 0 -- 9
            "Strip.Curve.0.Name",            // CHL_2KCB:FT41170:Flw       -> channelNames[ii]
            "Strip.Curve.0.Units",           // g/s                        -> ignore
            "Strip.Curve.0.Comment",         // 2KCB Disch Flow            -> ignore
            "Strip.Curve.0.Precision",       // 2                          -> ignore
            "Strip.Curve.0.Min",             //  0.00                      -> yAxis[ii]["valMin"]
            "Strip.Curve.0.Max",             //  200.00                    -> yAxis[ii]["valMax"]
            "Strip.Curve.0.Scale",           // 0                          -> yAxis[ii]["displayScale"]
            "Strip.Curve.0.PlotStatus",      // 1                          -> yAxis[ii]["show"]

            "Strip.Curve.1.Name",            // CHL_2KCB:FT41170:Flw       -> channelNames[ii]
            "Strip.Curve.1.Units",           // g/s                        -> ignore
            "Strip.Curve.1.Comment",         // 2KCB Disch Flow            -> ignore
            "Strip.Curve.1.Precision",       // 2                          -> ignore
            "Strip.Curve.1.Min",             //  0.00                      -> yAxis[ii]["valMin"]
            "Strip.Curve.1.Max",             //  200.00                    -> yAxis[ii]["valMax"]
            "Strip.Curve.1.Scale",           // 0                          -> yAxis[ii]["displayScale"]
            "Strip.Curve.1.PlotStatus",      // 1                          -> yAxis[ii]["show"]

            "Strip.Curve.2.Name",            // CHL_2KCB:FT41170:Flw       -> channelNames[ii]
            "Strip.Curve.2.Units",           // g/s                        -> ignore
            "Strip.Curve.2.Comment",         // 2KCB Disch Flow            -> ignore
            "Strip.Curve.2.Precision",       // 2                          -> ignore
            "Strip.Curve.2.Min",             //  0.00                      -> yAxis[ii]["valMin"]
            "Strip.Curve.2.Max",             //  200.00                    -> yAxis[ii]["valMax"]
            "Strip.Curve.2.Scale",           // 0                          -> yAxis[ii]["displayScale"]
            "Strip.Curve.2.PlotStatus",      // 1                          -> yAxis[ii]["show"]

            "Strip.Curve.3.Name",            // CHL_2KCB:FT41170:Flw       -> channelNames[ii]
            "Strip.Curve.3.Units",           // g/s                        -> ignore
            "Strip.Curve.3.Comment",         // 2KCB Disch Flow            -> ignore
            "Strip.Curve.3.Precision",       // 2                          -> ignore
            "Strip.Curve.3.Min",             //  0.00                      -> yAxis[ii]["valMin"]
            "Strip.Curve.3.Max",             //  200.00                    -> yAxis[ii]["valMax"]
            "Strip.Curve.3.Scale",           // 0                          -> yAxis[ii]["displayScale"]
            "Strip.Curve.3.PlotStatus",      // 1                          -> yAxis[ii]["show"]

            "Strip.Curve.4.Name",            // CHL_2KCB:FT41170:Flw       -> channelNames[ii]
            "Strip.Curve.4.Units",           // g/s                        -> ignore
            "Strip.Curve.4.Comment",         // 2KCB Disch Flow            -> ignore
            "Strip.Curve.4.Precision",       // 2                          -> ignore
            "Strip.Curve.4.Min",             //  0.00                      -> yAxis[ii]["valMin"]
            "Strip.Curve.4.Max",             //  200.00                    -> yAxis[ii]["valMax"]
            "Strip.Curve.4.Scale",           // 0                          -> yAxis[ii]["displayScale"]
            "Strip.Curve.4.PlotStatus",      // 1                          -> yAxis[ii]["show"]

            "Strip.Curve.5.Name",            // CHL_2KCB:FT41170:Flw       -> channelNames[ii]
            "Strip.Curve.5.Units",           // g/s                        -> ignore
            "Strip.Curve.5.Comment",         // 2KCB Disch Flow            -> ignore
            "Strip.Curve.5.Precision",       // 2                          -> ignore
            "Strip.Curve.5.Min",             //  0.00                      -> yAxis[ii]["valMin"]
            "Strip.Curve.5.Max",             //  200.00                    -> yAxis[ii]["valMax"]
            "Strip.Curve.5.Scale",           // 0                          -> yAxis[ii]["displayScale"]
            "Strip.Curve.5.PlotStatus",      // 1                          -> yAxis[ii]["show"]

            "Strip.Curve.6.Name",            // CHL_2KCB:FT41170:Flw       -> channelNames[ii]
            "Strip.Curve.6.Units",           // g/s                        -> ignore
            "Strip.Curve.6.Comment",         // 2KCB Disch Flow            -> ignore
            "Strip.Curve.6.Precision",       // 2                          -> ignore
            "Strip.Curve.6.Min",             //  0.00                      -> yAxis[ii]["valMin"]
            "Strip.Curve.6.Max",             //  200.00                    -> yAxis[ii]["valMax"]
            "Strip.Curve.6.Scale",           // 0                          -> yAxis[ii]["displayScale"]
            "Strip.Curve.6.PlotStatus",      // 1                          -> yAxis[ii]["show"]

            "Strip.Curve.7.Name",            // CHL_2KCB:FT41170:Flw       -> channelNames[ii]
            "Strip.Curve.7.Units",           // g/s                        -> ignore
            "Strip.Curve.7.Comment",         // 2KCB Disch Flow            -> ignore
            "Strip.Curve.7.Precision",       // 2                          -> ignore
            "Strip.Curve.7.Min",             //  0.00                      -> yAxis[ii]["valMin"]
            "Strip.Curve.7.Max",             //  200.00                    -> yAxis[ii]["valMax"]
            "Strip.Curve.7.Scale",           // 0                          -> yAxis[ii]["displayScale"]
            "Strip.Curve.7.PlotStatus",      // 1                          -> yAxis[ii]["show"]

            "Strip.Curve.8.Name",            // CHL_2KCB:FT41170:Flw       -> channelNames[ii]
            "Strip.Curve.8.Units",           // g/s                        -> ignore
            "Strip.Curve.8.Comment",         // 2KCB Disch Flow            -> ignore
            "Strip.Curve.8.Precision",       // 2                          -> ignore
            "Strip.Curve.8.Min",             //  0.00                      -> yAxis[ii]["valMin"]
            "Strip.Curve.8.Max",             //  200.00                    -> yAxis[ii]["valMax"]
            "Strip.Curve.8.Scale",           // 0                          -> yAxis[ii]["displayScale"]
            "Strip.Curve.8.PlotStatus",      // 1                          -> yAxis[ii]["show"]

            "Strip.Curve.9.Name",            // CHL_2KCB:FT41170:Flw       -> channelNames[ii]
            "Strip.Curve.9.Units",           // g/s                        -> ignore
            "Strip.Curve.9.Comment",         // 2KCB Disch Flow            -> ignore
            "Strip.Curve.9.Precision",       // 2                          -> ignore
            "Strip.Curve.9.Min",             //  0.00                      -> yAxis[ii]["valMin"]
            "Strip.Curve.9.Max",             //  200.00                    -> yAxis[ii]["valMax"]
            "Strip.Curve.9.Scale",           // 0                          -> yAxis[ii]["displayScale"]
            "Strip.Curve.9.PlotStatus",      // 1                          -> yAxis[ii]["show"]

        ];

        let bufferSize = 5000;
        let lineWidth = 2;
        tdl.text.singleWidget = true;
        tdl.style.boxSizing = "border-box";
        tdl.style.padding = 5;

        for (const propertyName of propertyNames) {
            const propertyValue = edl[propertyName];
            console.log(propertyName, propertyName.match(/^Strip.Curve\.\d\.[a-zA-Z0-9]+$/), propertyValue)
            if (propertyValue === undefined) {
                console.log("Property", `"${propertyName}"`, "is not in stp file");
                continue;
            } else {
                if (propertyName === "Strip.Time.NumSamples") {
                    if (!isNaN(parseInt(propertyValue))) {
                        bufferSize = parseInt(propertyValue);
                    }
                } else if (propertyName === "Strip.Color.Background") {
                    const valueArray = propertyValue.trim().split(/[\s\t]+/);
                    if (valueArray.length === 3) {
                        const redValue = parseInt(valueArray[0]);
                        const blueValue = parseInt(valueArray[1]);
                        const greenValue = parseInt(valueArray[2]);
                        if (!isNaN(redValue) && !isNaN(greenValue) && !isNaN(blueValue)) {
                            tdl["style"]["backgroundColor"] = `rgba(${redValue / 65535 * 255}, ${greenValue / 65535 * 255}, ${blueValue / 65535 * 255}, 100)`;
                        }
                    }

                } else if (propertyName === "Strip.Color.Foreground") {
                    const valueArray = propertyValue.trim().split(/[\s\t]+/);
                    if (valueArray.length === 3) {
                        const redValue = parseInt(valueArray[0]);
                        const blueValue = parseInt(valueArray[1]);
                        const greenValue = parseInt(valueArray[2]);
                        if (!isNaN(redValue) && !isNaN(greenValue) && !isNaN(blueValue)) {
                            tdl["style"]["color"] = `rgba(${redValue / 65535 * 255}, ${greenValue / 65535 * 255}, ${blueValue / 65535 * 255}, 100)`;
                        }
                    }
                } else if (propertyName === "Strip.Option.GraphLineWidth") {
                    if (!isNaN(parseInt(propertyValue))) {
                        lineWidth = parseInt(propertyValue);
                    }
                } else if (propertyName.match(/^Strip.Curve\.\d\.[a-zA-Z0-9]+$/) !== null) {
                    const propertyNameReduced = propertyName.replace("Strip.Curve.", "");
                    const propertyNameReducedArray = propertyNameReduced.trim().split(".");
                    console.log("propertyNameReducedArray = ", propertyNameReducedArray)
                    if (propertyNameReducedArray.length === 2) {
                        const index = parseInt(propertyNameReducedArray[0]);
                        const name = propertyNameReducedArray[1];
                        if (!isNaN(index)) {
                            if (tdl["yAxes"][index] === undefined) {
                                tdl["yAxes"][index] = this.generateDefaultYAxis();
                            }
                            if (tdl["channelNames"][index] === undefined) {
                                tdl["channelNames"][index] = "";
                            }
                            // properties in Strip.Curve.ii
                            if (name === "Name") {
                                tdl["channelNames"][index] = propertyValue.trim();
                            } else if (name === "Min") {
                                const value = parseFloat(propertyValue);
                                if (!isNaN(value)) {
                                    tdl["yAxes"][index]["valMin"] = value;
                                }
                            } else if (name === "Max") {
                                const value = parseFloat(propertyValue);
                                if (!isNaN(value)) {
                                    tdl["yAxes"][index]["valMax"] = value;
                                }
                            } else if (name === "Scale") {
                                const value = parseFloat(propertyValue);
                                if (!isNaN(value)) {
                                    tdl["yAxes"][index]["displayScale"] = value === 0 ? "Linear" : "Log10";
                                }
                            } else if (name === "PlotStatus") {
                                const value = parseFloat(propertyValue);
                                if (!isNaN(value)) {
                                    tdl["yAxes"][index]["show"] = value === 1 ? true : false;
                                }
                            }
                        }
                    }
                }
            }
        }

        // find the color for each curve
        for (const colorPropertyName of propertyNames) {
            const propertyValue = edl[colorPropertyName];
            if (colorPropertyName.match(/^Strip.Color.Color[0-9]+/)) {
                const colorIndex = parseInt(colorPropertyName.replace("Strip.Color.Color", ""));
                if (!isNaN(colorIndex)) {
                    const index = colorIndex - 1;
                    if (tdl["yAxes"][index] !== undefined) {
                        const valueArray = propertyValue.trim().split(/[\s\t]+/);
                        if (valueArray.length === 3) {
                            const redValue = parseInt(valueArray[0]);
                            const blueValue = parseInt(valueArray[1]);
                            const greenValue = parseInt(valueArray[2]);
                            if (!isNaN(redValue) && !isNaN(greenValue) && !isNaN(blueValue)) {
                                tdl["yAxes"][index]["lineColor"] = `rgba(${redValue / 65535 * 255}, ${greenValue / 65535 * 255}, ${blueValue / 65535 * 255}, 100)`;
                            }
                        }
                    }
                }
            }
        }
        
        for (let ii = 0; ii < tdl["yAxes"].length; ii++) {
            if (tdl["yAxes"][ii] === undefined) {
                tdl["yAxes"][ii] = this.generateDefaultYAxis();
            }
            const yAxis = tdl["yAxes"][ii];
            yAxis["lineWidth"] = lineWidth;
            yAxis["bufferSize"] = bufferSize;
        }
        for (let ii = 0; ii < tdl["channelNames"].length; ii++) {
            if (tdl["channelNames"][ii] === undefined) {
                tdl["channelNames"][ii] = "";
            }
        }

        // console.log("===", tdl)
        return tdl;
    };


}
