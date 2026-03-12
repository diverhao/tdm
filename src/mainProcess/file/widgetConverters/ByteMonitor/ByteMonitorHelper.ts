import { Log } from "../../../../common/Log";
import { BobPropertyConverter } from "../../BobPropertyConverter";
import { BaseWidgetHelper } from "../BaseWidget/BaseWidgetHelper";
import * as GlobalMethods from "../../../../common/GlobalMethods";
import { rgbaArrayToRgbaStr, rgbaStrToRgbaArray } from "../../../../common/GlobalMethods";
import { EdlConverter } from "../../EdlConverter";
import { defaultByteMonitorTdl, type_ByteMonitor_tdl } from "../../../../common/types/type_widget_tdl";

export class ByteMonitorHelper extends BaseWidgetHelper {

    static generateDefaultTdl = (): type_ByteMonitor_tdl => {
        const widgetKey = GlobalMethods.generateWidgetKey(defaultByteMonitorTdl.type);
        return structuredClone({
            ...defaultByteMonitorTdl,
            widgetKey: widgetKey,
        });
    };

    static convertEdlToTdl = (edl: Record<string, string>): type_ByteMonitor_tdl => {
        Log.info("\n------------", `Parsing "Byte"`, "------------------\n");
        const tdl = this.generateDefaultTdl() as type_ByteMonitor_tdl;
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
                Log.info("Property", `"${propertyName}"`, "is not in edl file");
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
                        const [colorValue0, colorValue1] = Object.values(dynamicColorRules) as [number, number, number][];
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
                    Log.info("Skip property", `"${propertyName}"`);
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
        Log.info("\n------------", `Parsing "byte_monitor"`, "------------------\n");
        const tdl = this.generateDefaultTdl();
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

        tdl["style"]["top"] = 0;
        tdl["style"]["left"] = 0;
        tdl["style"]["width"] = 160;
        tdl["style"]["height"] = 20;

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
                    Log.info("Skip property", `"${propertyName}"`);
                }
            }
        }
        return tdl;
    };
}
