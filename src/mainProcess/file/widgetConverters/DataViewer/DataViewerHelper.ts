import { BobPropertyConverter } from "../../BobPropertyConverter";
import { Log } from "../../../../common/Log";
import { BaseWidgetHelper } from "../BaseWidget/BaseWidgetHelper";
import * as GlobalMethods from "../../../../common/GlobalMethods";
import path from "path";
import { FileReader } from "../../../file/FileReader";
import { defaultDataViewerTdl, defaultDataViewerTicksInfo, defaultDataViewerYAxis, type_DataViewer_tdl, type_DataViewer_yAxis } from "../../../../common/types/type_widget_tdl";

export class DataViewerHelper extends BaseWidgetHelper {

    static generateDefaultTdl = (): type_DataViewer_tdl => {
        const widgetKey = GlobalMethods.generateWidgetKey(defaultDataViewerTdl.type);
        return structuredClone({
            ...defaultDataViewerTdl,
            widgetKey: widgetKey,
        });
    };

    static convertStpToTdl = (edl: Record<string, string>, type: "Data Viewer"): type_DataViewer_tdl => {
        Log.info("\n------------", `Parsing ${type}`, "------------------\n");
        const tdl = this.generateDefaultTdl();
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
        // tdl.style.boxSizing = "border-box";
        // tdl.style.padding = 5;

        for (const propertyName of propertyNames) {
            const propertyValue = edl[propertyName];
            Log.info(propertyName, propertyName.match(/^Strip.Curve\.\d\.[a-zA-Z0-9]+$/), propertyValue)
            if (propertyValue === undefined) {
                Log.info("Property", `"${propertyName}"`, "is not in stp file");
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
                    Log.info("propertyNameReducedArray = ", propertyNameReducedArray)
                    if (propertyNameReducedArray.length === 2) {
                        const index = parseInt(propertyNameReducedArray[0]);
                        const name = propertyNameReducedArray[1];
                        if (!isNaN(index)) {
                            if (tdl["yAxes"][index] === undefined) {
                                tdl["yAxes"][index] = structuredClone(defaultDataViewerYAxis);
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
                tdl["yAxes"][ii] = structuredClone(defaultDataViewerYAxis);
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

        // Log.info("===", tdl)
        return tdl;
    };


    static convertBobToTdl = async (bobWidgetJson: Record<string, any>, type: "stripchart" | "databrowser", fullTdlFileName: string): Promise<type_DataViewer_tdl> => {
        Log.info("\n------------", `Parsing "stripchart"`, "------------------\n");
        const tdl = this.generateDefaultTdl();
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
            "show_grid",
            "title",
            "title_font", // not in tdm
            "label_font", // not in tdm
            "scale_font",
            "show_toolbar", // not in tdm
            "show_legend", // not in tdm
            "start", // not in tdm
            "end", // not in tdm
            "y_axes",
            // title
            // autoscale
            // logscale
            // minimum
            // maximum
            // grid
            // visible
            // color
            "traces",
            // name
            // y_pv
            // y_axis
            // trace_type
            // color
            // width
            // point_type
            // point_size
            // visible
            "configure", // not in tdm
            "open_full", // not in tdm
            "refresh_plot", // not in tdm

            // below are in databrowser
            "file",
            "show_toolbar", // not in tdm
            "selection_value_pv", // not in tdm
        ];

        let showGrid = true;
        let bobYAxes: any[] = [];

        for (const propertyName of propertyNames) {
            const propertyValue = bobWidgetJson[propertyName];
            if (propertyValue === undefined) {
                if (propertyName === "widget") {
                    Log.info(`There are one or more widgets inside "display"`);
                } else {
                    Log.info("Property", `"${propertyName}"`, "is not in bob file");
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
                    // tdl["text"]["invisibleInOperation"] = !BobPropertyConverter.convertBobBoolean(propertyValue);
                } else if (propertyName === "foreground_color") {
                    tdl["style"]["color"] = BobPropertyConverter.convertBobColor(propertyValue);
                } else if (propertyName === "background_color") {
                    tdl["style"]["backgroundColor"] = BobPropertyConverter.convertBobColor(propertyValue);
                } else if (propertyName === "show_grid") {
                    showGrid = BobPropertyConverter.convertBobBoolean(propertyValue);
                } else if (propertyName === "title") {
                    tdl["text"]["title"] = BobPropertyConverter.convertBobString(propertyValue);
                } else if (propertyName === "scale_font") {
                    const data = BobPropertyConverter.convertBobFont(propertyValue);
                    tdl["style"]["fontSize"] = data["fontSize"];
                    tdl["style"]["fontFamily"] = data["fontFamily"];
                    tdl["style"]["fontStyle"] = data["fontStyle"];
                    tdl["style"]["fontWeight"] = data["fontWeight"];
                } else if (propertyName === "traces") {
                    tdl["yAxes"] = BobPropertyConverter.convertBobStripchartTraces(propertyValue);
                } else if (propertyName === "y_axes") {
                    bobYAxes = BobPropertyConverter.convertBobStripchartYAxes(propertyValue);
                } else if (propertyName === "file") {
                    // read the file for DataBrowser
                    const fileName = BobPropertyConverter.convertBobString(propertyValue);
                    const currentFolder = path.dirname(fullTdlFileName);
                    const childTdlData = await FileReader.readTdlFile(fileName, undefined, currentFolder);
                    if (childTdlData !== undefined) {
                        const dataViewerWidgetTdl = Object.values(childTdlData["tdl"])[1];
                        tdl["yAxes"] = dataViewerWidgetTdl["yAxes"];
                        tdl["channelNames"] = dataViewerWidgetTdl["channelNames"];
                    }
                } else {
                    Log.info("Skip property", `"${propertyName}"`);
                }
            }
        }

        if (type === "stripchart") {
            for (const yAxis of tdl["yAxes"]) {
                // channel name is the "label"
                const channelName = yAxis["label"].trim();
                tdl["channelNames"].push(channelName);

                const bobYAxisIndex = (yAxis as any)["axis"];
                const bobYAxis = bobYAxes[bobYAxisIndex];
                if (bobYAxis !== undefined) {
                    yAxis["valMin"] = bobYAxis["valMin"];
                    yAxis["valMax"] = bobYAxis["valMax"];
                    yAxis["displayScale"] = bobYAxis["displayScale"];
                }
                delete (yAxis as any)["axis"];
            }
        } else if (type === "databrowser") {
            tdl.text.singleWidget = false;
            // tdl.style.boxSizing = "border-box";
            // tdl.style.padding = 0;
        }

        return tdl;
    };


    /**
     * it converts the contents inside <databrowser> ... </databrowser> to a DataViewer widget
     */
    static convertBobToTdl_databrowser = (bobWidgetJson: Record<string, any>): type_DataViewer_tdl => {
        Log.info("\n------------", `Parsing "databrowser"`, "------------------\n");
        const tdl = this.generateDefaultTdl();
        // all properties for this widget
        const propertyNames: string[] = [
            "title",
            "show_toolbar", // not in tdm
            "update_period",
            "scroll_step", // not in tdm
            "scroll", // not in tdm
            "start", // not in tdm
            "end", // not in tdm
            "archive_rescale", // not in tdm
            "foreground", // not in tdm
            "background",
            "title_font", // not in tdm
            "label_font", // not in tdm
            "scale_font",
            "legend_font", // not in tdm
            "axes",
            "annotations",  // not in tdm
            "pvlist",
        ];

        let bobAxes: {
            valMin: number,
            valMax: number,
            // ticks: number[],
            // ticksText: number[],
            show: boolean,
            displayScale: "Log10" | "Linear",
        }[] = [];

        let bobPvs: {
            label: string,
            lineWidth: number,
            lineColor: string,
            bufferSize: number,
            axisIndex: number,
            channelName: string,
        }[] = [];

        for (const propertyName of propertyNames) {
            const propertyValue = bobWidgetJson[propertyName];
            if (propertyValue === undefined) {
                if (propertyName === "widget") {
                    Log.info(`There are one or more widgets inside "display"`);
                } else {
                    Log.info("Property", `"${propertyName}"`, "is not in bob file");
                }
                continue;
            } else {
                if (propertyName === "title") {
                    tdl["text"]["title"] = BobPropertyConverter.convertBobString(propertyValue);
                } else if (propertyName === "update_period") {
                    tdl["text"]["updatePeriod"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "background") {
                    const redValue = BobPropertyConverter.convertBobNum(propertyValue[0]["red"]);
                    const greenValue = BobPropertyConverter.convertBobNum(propertyValue[0]["green"]);
                    const blueValue = BobPropertyConverter.convertBobNum(propertyValue[0]["blue"]);
                    tdl["style"]["backgroundColor"] = `rgba(${redValue}, ${greenValue}, ${blueValue}, 1)`;
                } else if (propertyName === "scale_font") {
                    const data = BobPropertyConverter.convertBobFont(propertyValue);
                    tdl["style"]["fontSize"] = data["fontSize"];
                    tdl["style"]["fontFamily"] = data["fontFamily"];
                    tdl["style"]["fontStyle"] = data["fontStyle"];
                    tdl["style"]["fontWeight"] = data["fontWeight"];
                } else if (propertyName === "axes") {
                    bobAxes = BobPropertyConverter.convertBobDataBrowserAxes(propertyValue);
                } else if (propertyName === "pvlist") {
                    bobPvs = BobPropertyConverter.convertBobDataBrowserPvlist(propertyValue);
                } else {
                    Log.info("Skip property", `"${propertyName}"`);
                }
            }
        }

        const yAxes: type_DataViewer_yAxis[] = [];

        for (const bobPv of bobPvs) {
            const axisIndex = bobPv["axisIndex"];
            const axisData = bobAxes[axisIndex];
            if (axisData !== undefined) {
                const yAxisTmp = { ...bobPv, ...axisData };
                const yAxis: type_DataViewer_yAxis = {
                    label: yAxisTmp["label"],
                    valMin: yAxisTmp["valMin"],
                    valMax: yAxisTmp["valMax"],
                    lineWidth: yAxisTmp["lineWidth"],
                    lineColor: yAxisTmp["lineColor"],
                    show:yAxisTmp["show"],
                    bufferSize: yAxisTmp["bufferSize"],
                    displayScale: yAxisTmp["displayScale"],
                    xData: [],
                    yData: [],
                    ticksInfo: structuredClone(defaultDataViewerTicksInfo),
                }
                yAxes.push(yAxis);
                tdl["channelNames"].push(bobPv["channelName"]);
                delete (bobPv as any)["axisIndex"];
                delete (bobPv as any)["channelName"];
            }
        }

        tdl["yAxes"] = yAxes;


        return tdl;
    };


}
