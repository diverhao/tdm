import { GlobalVariables } from "../../global/GlobalVariables";
import { BobPropertyConverter } from "../../../mainProcess/windows/DisplayWindow/BobPropertyConverter";
import { type_rules_tdl, BaseWidgetHelper } from "../BaseWidget/BaseWidgetHelper";
import * as GlobalMethods from "../../global/GlobalMethods";
import { rgbaArrayToRgbaStr, rgbaStrToRgbaArray } from "../../global/GlobalMethods";
import { EdlConverter } from "../../../mainProcess/windows/DisplayWindow/EdlConverter";

export type type_ByteMonitor_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
    bitNames: string[];
    itemColors: string[];
};

export class ByteMonitorHelper extends BaseWidgetHelper {
    static _defaultTdl: type_ByteMonitor_tdl = {
        type: "ByteMonitor",
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
            // clear background, use "itemColors"
            backgroundColor: "rgba(0, 0, 0, 0)",
            // angle
            transform: "rotate(0deg)",
            // font
            color: "rgba(0,0,0,1)",
            fontFamily: GlobalVariables.defaultFontFamily,
            fontSize: GlobalVariables.defaultFontSize,
            fontStyle: GlobalVariables.defaultFontStyle,
            fontWeight: GlobalVariables.defaultFontWeight,
            // border, it is different from the "alarmBorder" below,
            borderStyle: "solid",
            borderWidth: 0,
            borderColor: "rgba(0, 0, 0, 1)",
            // shows when the widget is selected
            outlineStyle: "none",
            outlineWidth: 1,
            outlineColor: "black",
        },
        // the ElementBody style
        text: {
            horizontalAlign: "flex-start",
            verticalAlign: "flex-start",
            wrapWord: false,
            showUnit: false,
            alarmBorder: true,
            // line style for each bit
            lineWidth: 2,
            lineStyle: "solid",
            lineColor: "rgba(0, 0, 0, 1)",
            // shape, round/square
            shape: "round",
            bitStart: 0,
            bitLength: 8,
            direction: "horizontal", // vs "vertical"
            sequence: "positive", // vs "reverse"
            // if the value is not valid
            fallbackColor: "rgba(255,0,255,1)",
            invisibleInOperation: false,
        },
        channelNames: [],
        groupNames: [],
        rules: [],
        bitNames: [],
        itemColors: ["rgba(60, 100, 60, 1)", "rgba(60, 255, 60, 1)"],
    };

    // not getDefaultTdl(), always generate a new key
    static generateDefaultTdl = (type: string): type_ByteMonitor_tdl => {
        // defines type, widgetKey, and key
        const result = super.generateDefaultTdl(type) as type_ByteMonitor_tdl;
        result.style = JSON.parse(JSON.stringify(this._defaultTdl.style));
        result.text = JSON.parse(JSON.stringify(this._defaultTdl.text));
        result.channelNames = JSON.parse(JSON.stringify(this._defaultTdl.channelNames));
        result.groupNames = JSON.parse(JSON.stringify(this._defaultTdl.groupNames));
        result.bitNames = JSON.parse(JSON.stringify(this._defaultTdl.bitNames));
        result.itemColors = JSON.parse(JSON.stringify(this._defaultTdl.itemColors));
        return result;
    };

    static convertEdlToTdl = (edl: Record<string, string>): type_ByteMonitor_tdl => {
        console.log("\n------------", `Parsing "Byte"`, "------------------\n");
        const tdl = this.generateDefaultTdl("ByteMonitor") as type_ByteMonitor_tdl;
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
            "controlPv",
            "lineColor",
            "onColor",
            "offColor",
            "lineWidth",
            "lineStyle",
            "endian",
            "numBits",
            "shift",
            "endObjectProperties", // not in tdm
        ];

        // default differences
        tdl["text"]["lineWidth"] = 1;
        tdl["text"]["shape"] = "square";
        tdl["text"]["bitLength"] = 16;
        let onColorIsRuledColor = false;

        for (const propertyName of propertyNames) {
            const propertyValue = edl[propertyName];

            if (propertyValue === undefined) {
                console.log("Property", `"${propertyName}"`, "is not in edl file");
                continue;
            } else {
                if (propertyName === "x") {
                    tdl["style"]["left"] = parseInt(propertyValue);
                } else if (propertyName === "y") {
                    tdl["style"]["top"] = parseInt(propertyValue);
                } else if (propertyName === "w") {
                    tdl["style"]["width"] = parseInt(propertyValue);
                } else if (propertyName === "h") {
                    tdl["style"]["height"] = parseInt(propertyValue);
                } else if (propertyName === "controlPv") {
                    tdl["channelNames"].push(EdlConverter.convertEdlPv(propertyValue, true, true));
                } else if (propertyName === "lineColor") {
                    tdl["text"]["lineColor"] = EdlConverter.convertEdlColor(propertyValue);
                } else if (propertyName === "onColor") {
                    // ! seems like if the onColor is a ruled-color, then the offColor is overriden
                    // ! if the onColor is a regular color, then the offColor can be converted using regular method
                    const indexStr = propertyValue.split(" ")[1].replaceAll(`"`, "").trim();
                    if (EdlConverter.isRuledColor(indexStr)) {
                        // then tdl["itermColors"][0] and [1] are determined by this property
                        const dynamicColorRules = EdlConverter.ruledColors[indexStr];
                        const colorValue0 = Object.values(dynamicColorRules)[0];
                        const colorValue1 = Object.values(dynamicColorRules)[1];
                        tdl["itemColors"][0] = rgbaArrayToRgbaStr([...colorValue0, 100]);
                        tdl["itemColors"][1] = rgbaArrayToRgbaStr([...colorValue1, 100]);
                        onColorIsRuledColor = true;
                    } else {
                        tdl["itemColors"][1] = EdlConverter.convertEdlColor(propertyValue);
                    }
                } else if (propertyName === "offColor") {
                    if (onColorIsRuledColor === false) {
                        tdl["itemColors"][0] = EdlConverter.convertEdlColor(propertyValue);
                    }
                } else if (propertyName === "lineWidth") {
                    tdl["text"]["lineWidth"] = EdlConverter.convertEdlNumber(propertyValue);
                } else if (propertyName === "lineStyle") {
                    tdl["text"]["lineStyle"] = EdlConverter.convertEdlLineStyle(propertyValue);
                } else if (propertyName === "endian") {
                    tdl["text"]["sequence"] = EdlConverter.convertEdlEndian(propertyValue);
                } else if (propertyName === "numBits") {
                    tdl["text"]["bitLength"] = EdlConverter.convertEdlNumber(propertyValue);
                } else if (propertyName === "shift") {
                    tdl["text"]["bitStart"] = EdlConverter.convertEdlNumber(propertyValue);
                } else {
                    console.log("Skip property", `"${propertyName}"`);
                }
            }
        }

        // if (tdl["channelNames"].length >= 1) {
        //     // there is a control pv, controlling colors
        //     const onColorPropertyValue = edl["onColor"];
        //     if (onColorPropertyValue !== undefined) {
        //         const controlPv = tdl["channelNames"];
        //         EdlConverter.convertEdlColor(onColorPropertyValue, controlPv[0], "Background Color", tdl);
        //     }
        // }

        if (tdl["style"]["width"] > tdl["style"]["height"]) {
            tdl["text"]["direction"] = "horizontal";
        } else {
            tdl["text"]["direction"] = "vertical";
        }

        return tdl;
    };

    static convertBobToTdl = (bobWidgetJson: Record<string, any>): type_ByteMonitor_tdl => {
        console.log("\n------------", `Parsing "byte_monitor"`, "------------------\n");
        const tdl = this.generateDefaultTdl("ByteMonitor");
        // all properties for this widget
        const propertyNames: string[] = [
            "actions", // not in tdm
            "bitReverse",
            "border_alarm_sensitive",
            "class", // not in tdm
            "font",
            "foreground_color",
            "height",
            "horizontal",
            "labels",
            "name", // not in tdm
            "numBits",
            "off_color",
            "on_color",
            "pv_name",
            "rules",
            "scripts", // not in tdm
            "square",
            "startBit",
            "tooltip", // not in tdm
            "type", // not in tdm
            "visible",
            "width",
            "x",
            "y",
        ];


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
                if (propertyName === "bitReverse") {
                    const sequencePositive = BobPropertyConverter.convertBobBoolean(propertyValue);
                    tdl["text"]["sequence"] = sequencePositive === true ? "positive" : "reverse";
                } else if (propertyName === "border_alarm_sensitive") {
                    tdl["text"]["alarmBorder"] = BobPropertyConverter.convertBobBoolean(propertyValue);
                } else if (propertyName === "font") {
                    const font = BobPropertyConverter.convertBobFont(propertyValue);
                    tdl["style"]["fontSize"] = font["fontSize"];
                    tdl["style"]["fontFamily"] = font["fontFamily"];
                    tdl["style"]["fontStyle"] = font["fontStyle"];
                    tdl["style"]["fontWeight"] = font["fontWeight"];
                } else if (propertyName === "foreground_color") {
                    tdl["style"]["color"] = BobPropertyConverter.convertBobColor(propertyValue);
                } else if (propertyName === "x") {
                    tdl["style"]["left"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "y") {
                    tdl["style"]["top"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "width") {
                    tdl["style"]["width"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "height") {
                    tdl["style"]["height"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "horizontal") {
                    const horizontalDirection = BobPropertyConverter.convertBobBoolean(propertyValue);
                    tdl["text"]["direction"] = horizontalDirection === true ? "horizontal" : "vertical";
                } else if (propertyName === "labels") {
                    tdl["bitNames"] =  BobPropertyConverter.convertBobStrings(propertyValue, "text");
                } else if (propertyName === "numBits") {
                    tdl["text"]["bitLength"] =  BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "startBit") {
                    tdl["text"]["bitStart"] =  BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "off_color") {
                    tdl["itemColors"][0] =  BobPropertyConverter.convertBobColor(propertyValue);
                } else if (propertyName === "on_color") {
                    tdl["itemColors"][1] =  BobPropertyConverter.convertBobColor(propertyValue);
                } else if (propertyName === "pv_name") {
                    tdl["channelNames"].push(BobPropertyConverter.convertBobString(propertyValue));
                } else if (propertyName === "rules") {
                    tdl["rules"] = BobPropertyConverter.convertBobRules(propertyValue);
                } else if (propertyName === "square") {
                    const isSquare = BobPropertyConverter.convertBobBoolean(propertyValue);
                    tdl["text"]["shape"] = isSquare === true? "square" : "round";
                } else if (propertyName === "visible") {
                    tdl["text"]["invisibleInOperation"] = !BobPropertyConverter.convertBobBoolean(propertyValue);
                } else {
                    console.log("Skip property", `"${propertyName}"`);
                }
            }
        }
        return tdl;
    };
}
