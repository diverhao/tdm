import { GlobalVariables } from "../../../common/GlobalVariables";
import { BobPropertyConverter } from "../../../mainProcess/windows/DisplayWindow/BobPropertyConverter";
import { type_rules_tdl, BaseWidgetHelper } from "../BaseWidget/BaseWidgetHelper";
import * as GlobalMethods from "../../../common/GlobalMethods";
import { rgbaArrayToRgbaStr, rgbaStrToRgbaArray } from "../../../common/GlobalMethods";
import { EdlConverter } from "../../../mainProcess/windows/DisplayWindow/EdlConverter";
import { v4 as uuidv4 } from "uuid";
import path from "path";

export type type_Image_roi = {
    xPv: string;
    yPv: string;
    widthPv: string;
    heightPv: string;
    color: string;
}

export type type_Image_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
    regionsOfInterest: type_Image_roi[];
};

export class ImageHelper extends BaseWidgetHelper {


    static _defaultTdl: type_Image_tdl = {
        type: "Image",
        widgetKey: "", // "key" is a reserved keyword
        key: "",
        style: {
            // basics
            position: "absolute",
            display: "inline-flex",
            // dimensions
            left: 100,
            top: 100,
            width: 100,
            height: 100,
            backgroundColor: "rgba(240, 240, 240, 1)",
            // angle
            transform: "rotate(0deg)",
            // border, it is different from the "alarmBorder" below,
            borderStyle: "solid",
            borderWidth: 0,
            borderColor: "rgba(0, 0, 0, 1)",
            // font
            color: "rgba(0,0,0,1)",
            fontFamily: GlobalVariables.defaultFontFamily,
            fontSize: GlobalVariables.defaultFontSize,
            fontStyle: GlobalVariables.defaultFontStyle,
            fontWeight: GlobalVariables.defaultFontWeight,
            // shows when the widget is selected
            outlineStyle: "none",
            outlineWidth: 1,
            outlineColor: "black",
        },
        text: {
            // text
            horizontalAlign: "flex-start",
            verticalAlign: "flex-start",
            wrapWord: false,
            showUnit: true,
            invisibleInOperation: false,
            // default, decimal, exponential, hexadecimal
            format: "default",
            // scale, >= 0
            scale: 0,
            // actually "alarm outline"
            alarmBorder: true,
            alarmText: false,
            alarmBackground: false,
            alarmLevel: "MINOR",
            colorMap: "parula", // "jet", "gray", ...
            autoZ: true,
            initialAutoXY: true,
            zMin: 0,
            zMax: 100,
            xMin: 0,
            xMax: 255,
            yMin: 0,
            yMax: 255,
            // roiX1ChannelName: "loc://aaa",
            // roiX2ChannelName: "loc://bbb",
            // roiY1ChannelName: "loc://ccc",
            // roiY2ChannelName: "loc://ddd",
        },
        channelNames: [],
        groupNames: [],
        rules: [],
        regionsOfInterest: [],
    };

    // not getDefaultTdl(), always generate a new key
    static generateDefaultTdl = (type: string): type_Image_tdl => {
        const result = super.generateDefaultTdl(type);
        result.style = JSON.parse(JSON.stringify(this._defaultTdl.style));
        result.text = JSON.parse(JSON.stringify(this._defaultTdl.text));
        result.channelNames = JSON.parse(JSON.stringify(this._defaultTdl.channelNames));
        result.groupNames = JSON.parse(JSON.stringify(this._defaultTdl.groupNames));
        result.regionsOfInterest = JSON.parse(JSON.stringify(this._defaultTdl.regionsOfInterest))
        return result as type_Image_tdl;
    };

    static convertBobToTdl = (bobWidgetJson: Record<string, any>): type_Image_tdl => {
        console.log("\n------------", `Parsing "image"`, "------------------\n");
        const tdl = this.generateDefaultTdl("Image");
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
            "pv_name",
            "border_alarm_sensitive",
            "background_color",
            "foreground_color",
            "show_toolbar", // not in tdm
            "color_map",
            "color_bar", // not in tdm
            "x_axis", // not in tdm
            "y_axis", // not in tdm
            "limits_from_pv", // not in tdm
            "data_width", // not in tdm
            "data_height", // not in tdm
            "interpolation", // not in tdm
            "color_mode", // not in tdm
            "unsigned", // not in tdm
            "autoscale",
            "logscale", // not in tdm
            "minimum",
            "maximum",
            "cursor_info_pv", // not in tdm
            "x_pv", // todo: not in tdm yet
            "y_pv", // todo: not in tdm yet
            "cursor_info", // not in tdm
            "cursor_crosshair", // not in tdm
            "crosshair_location", // not in tdm
            "rois", // todo: not in tdm yet
            "configure", // not in tdm

            // Color Bar Properties (within color_bar):
            // visible
            // bar_size
            // scale_font

            // X/Y Axis Properties (within x_axis and y_axis):
            // visible
            // title
            // minimum
            // maximum
            // title_font
            // scale_font

            // ROI Properties (within rois array):
            // name
            // color
            // visible
            // interactive
            // x_pv
            // y_pv
            // width_pv
            // height_pv
            // file
            // x_value
            // y_value
            // width_value
            // height_value

        ];

        let confirmDialog = false;
        let confirmMessage = "";
        let password = "";
        let isTransparent = false;

        tdl["style"]["left"] = 0;
        tdl["style"]["top"] = 0;
        tdl["style"]["width"] = 400;
        tdl["style"]["height"] = 300;
        tdl["style"]["backgroundColor"] = "rgba(255, 255, 255, 1)";
        tdl["text"]["colorMap"] = "viridis";

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
                } else if (propertyName === "pv_name") {
                    tdl["channelNames"].push(BobPropertyConverter.convertBobString(propertyValue));
                } else if (propertyName === "border_alarm_sensitive") {
                    tdl["text"]["alarmBorder"] = BobPropertyConverter.convertBobBoolean(propertyValue);
                } else if (propertyName === "foreground_color") {
                    tdl["style"]["color"] = BobPropertyConverter.convertBobColor(propertyValue);
                } else if (propertyName === "background_color") {
                    tdl["style"]["backgroundColor"] = BobPropertyConverter.convertBobColor(propertyValue);
                } else if (propertyName === "color_map") {
                    tdl["text"]["colorMap"] = BobPropertyConverter.convertBobColorMap(propertyValue);
                } else if (propertyName === "autoscale") {
                    tdl["text"]["autoZ"] = BobPropertyConverter.convertBobBoolean(propertyValue);
                } else if (propertyName === "minimum") {
                    tdl["text"]["zMin"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "maximum") {
                    tdl["text"]["zMax"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else {
                    console.log("Skip property", `"${propertyName}"`);
                }
            }
        }
        

        return tdl;
    };
}
