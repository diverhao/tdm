import { BobPropertyConverter } from "../../BobPropertyConverter";
import { Log } from "../../../../common/Log";
import { type_rules_tdl, BaseWidgetHelper } from "../BaseWidget/BaseWidgetHelper";
import { generateWidgetKey, rgbaArrayToRgbaStr, rgbaStrToRgbaArray } from "../../../../common/GlobalMethods";
import { EdlConverter } from "../../EdlConverter";
import { v4 as uuidv4 } from "uuid";
import { defaultRectangleTdl, type_Rectangle_tdl } from "../../../../common/types/type_widget_tdl";


export class RectangleHelper extends BaseWidgetHelper {

    static generateDefaultTdl = (): type_Rectangle_tdl => {
        const widgetKey = generateWidgetKey(defaultRectangleTdl.type);
        return structuredClone({
            ...defaultRectangleTdl,
            widgetKey: widgetKey,
        });
    };

    // ------------------------- Converter ------------------------

    static convertEdlToTdl = (edl: Record<string, any>): type_Rectangle_tdl => {
        Log.info("\n------------", `Parsing "Rectangle"`, "------------------\n");
        const tdl = this.generateDefaultTdl() as type_Rectangle_tdl;
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
            "lineColor",
            "lineAlarm",
            // if it is true, the original "lineColor" (border) is overridden
            // when the "alarmPv" is in MINOR severity, the line becomes yellow
            // when MAJOR, it is red
            // when not, the line is green
            // it is already realized in a rule
            "fill",
            "fillColor",
            "fillAlarm",
            // similar to "lineAlarm", the original "fillColor" is overridden
            // it is already realized by a rule
            "lineWidth",
            "lineStyle",
            "invisible", // hide the widget in operation
            "alarmPv",
            "visPv", // already done in rule
            "visInvert", // invert the "visPv"
            "visMin",
            "visMax",
            "endObjectProperties", // not in tdm
        ];

        const alarmPropertyNames: string[] = [];

        // default differences
        // tdl["text"]["verticalAlign"] = "center";
        // tdl["text"]["wrapWord"] = false;
        tdl["text"]["alarmBorder"] = false;
        tdl["text"]["lineWidth"] = 1;
        tdl["text"]["fill"] = false;

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
                } else if (propertyName === "lineColor") {
                    tdl["text"]["lineColor"] = EdlConverter.convertEdlColor(
                        propertyValue,
                        EdlConverter.convertEdlPv(edl["alarmPv"]),
                        "Line Color",
                        tdl
                    );
                } else if (propertyName === "lineWidth") {
                    tdl["text"]["lineWidth"] = EdlConverter.convertEdlNumber(propertyValue);
                } else if (propertyName === "lineStyle") {
                    tdl["text"]["lineStyle"] = EdlConverter.convertEdlLineStyle(propertyValue);
                } else if (propertyName === "fillColor") {
                    tdl["text"]["fillColor"] = EdlConverter.convertEdlColor(
                        propertyValue,
                        EdlConverter.convertEdlPv(edl["alarmPv"]),
                        "Fill Color",
                        tdl
                    );
                } else if (propertyName === "fill") {
                    tdl["text"]["fill"] = EdlConverter.convertEdlBoolean(propertyValue);
                    // -------------- rules ------------------
                } else if (propertyName === "lineAlarm") {
                    alarmPropertyNames.push(propertyName);
                } else if (propertyName === "fillAlarm") {
                    alarmPropertyNames.push(propertyName);
                } else if (propertyName === "visPv") {
                    const newRules = EdlConverter.convertEdlVisPv(
                        EdlConverter.convertEdlPv(propertyValue),
                        edl["visMin"],
                        edl["visMax"],
                        edl["visInvert"]
                    ) as type_rules_tdl;
                    tdl["rules"].push(...newRules);
                } else if (propertyName === "invisible") {
                    tdl["text"]["invisibleInOperation"] = true;
                    // const newRules = EdlConverter.convertEdlInvisible(propertyValue) as type_rules_tdl;
                    // tdl["rules"].push(...newRules);
                } else {
                    Log.info("Skip property", `"${propertyName}"`);
                }
            }
        }

        // definition of dimensions are different
        if (edl["lineWidth"] !== undefined) {
            const lineWidth = EdlConverter.convertEdlNumber(edl["lineWidth"]);
            const rawLeft = EdlConverter.convertEdlNumber(edl["x"]);
            const rawTop = EdlConverter.convertEdlNumber(edl["y"]);
            const rawWidth = EdlConverter.convertEdlNumber(edl["w"]);
            const rawHeight = EdlConverter.convertEdlNumber(edl["h"]);
            const left = rawLeft - lineWidth / 2;
            const top = rawTop - lineWidth / 2;
            const width = rawWidth + lineWidth;
            const height = rawHeight + lineWidth;
            tdl["style"]["left"] = left;
            tdl["style"]["top"] = top;
            tdl["style"]["width"] = width;
            tdl["style"]["height"] = height;
        }

        if (edl["fill"] === undefined) {
            const rgbaArray = rgbaStrToRgbaArray(tdl["text"]["fillColor"]);
            rgbaArray[3] = 0;
            const rgbaStr = rgbaArrayToRgbaStr(rgbaArray);
            Log.info("new fill color", rgbaStr);
            tdl["text"]["fillColor"] = rgbaStr;
        }

        // all alarm-sensitive rules override others
        for (let alarmPropertyName of alarmPropertyNames) {
            if (alarmPropertyName === "fillAlarm") {
                if (edl["alarmPv"] === undefined) {
                    tdl["rules"].push({
                        boolExpression: `true`,
                        propertyName: "Fill Color",
                        propertyValue: "rgba(0, 255, 0, 1)",
                        id: uuidv4(),
                    });
                } else {
                    const newRules = EdlConverter.convertEdlFillAlarm(EdlConverter.convertEdlPv(edl["alarmPv"]), 2) as type_rules_tdl;
                    tdl["rules"].push(...newRules);
                }
            } else if (alarmPropertyName === "lineAlarm") {
                // if the lineAlarm is true, but the alarmPv is not set in edl setting, the line color is white
                if (edl["alarmPv"] === undefined) {
                    tdl["rules"].push({
                        boolExpression: `true`,
                        propertyName: "Line Color",
                        propertyValue: "rgba(0, 255, 0, 1)",
                        id: uuidv4(),
                    });
                } else {
                    const newRules = EdlConverter.convertEdlLineAlarm(EdlConverter.convertEdlPv(edl["alarmPv"]), 1) as type_rules_tdl;
                    tdl["rules"].push(...newRules);
                }
            } else {
                Log.info("Skip alarm-sensitive property", alarmPropertyName);
            }
        }

        // if alarmPv exists in edl setting, but its value is not available in operation, the widget becomes invisible
        // These behaviors override the alarm-sensitive
        if (edl["alarmPv"] !== undefined) {
            tdl["rules"].push({
                boolExpression: EdlConverter.generatePvUndefinedExpression(edl["alarmPv"]),
                propertyName: "Invisible in Operation",
                propertyValue: "true",
                id: uuidv4(),
            });
            tdl["rules"].push({
                boolExpression: EdlConverter.generatePvUndefinedExpression(edl["alarmPv"]),
                propertyName: "Alarm Border",
                propertyValue: "true",
                id: uuidv4(),
            });
        }
        // if visPv exists in edl setting, but its value is not available in operation, the widget becomes invisible
        // These behaviors override the alarm-sensitive
        if (edl["visPv"] !== undefined) {
            tdl["rules"].push({
                boolExpression: EdlConverter.generatePvUndefinedExpression(edl["visPv"]),
                propertyName: "Invisible in Operation",
                propertyValue: "true",
                id: uuidv4(),
            });
            tdl["rules"].push({
                boolExpression: EdlConverter.generatePvUndefinedExpression(edl["visPv"]),
                propertyName: "Alarm Border",
                propertyValue: "true",
                id: uuidv4(),
            });
        }

        return tdl;
    };
    static convertBobToTdl = (bobWidgetJson: Record<string, any>): type_Rectangle_tdl => {
        Log.info("\n------------", `Parsing "rectangle"`, "------------------\n");
        const tdl = this.generateDefaultTdl() as type_Rectangle_tdl;
        // all properties for this widget
        const propertyNames: string[] = [
            "actions", // not in tdm
            "background_color",
            "class", // not in tdm
            "corner_height",
            "corner_width",
            "height",
            "line_color",
            "line_style",
            "line_width",
            "macros", // not in tdm
            "name", // not in tdm
            "rules",
            "scripts", // not in tdm
            "tooltip", // not in tdm
            "transparent",
            "type", // not in tdm
            "visible",
            "width",
            "x",
            "y",
        ];

        let transparent = false;

        tdl["style"]["top"] = 0;
        tdl["style"]["left"] = 0;
        tdl["style"]["width"] = 100;
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
                if (propertyName === "background_color") {
                    const rgbaColor = BobPropertyConverter.convertBobColor(propertyValue);
                    tdl["text"]["fillColor"] = rgbaColor;
                } else if (propertyName === "corner_height") {
                    tdl["text"]["cornerHeight"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "corner_width") {
                    tdl["text"]["cornerWidth"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "x") {
                    tdl["style"]["left"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "y") {
                    tdl["style"]["top"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "width") {
                    tdl["style"]["width"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "height") {
                    tdl["style"]["height"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "line_color") {
                    tdl["text"]["lineColor"] = BobPropertyConverter.convertBobColor(propertyValue);
                } else if (propertyName === "line_style") {
                    tdl["text"]["lineStyle"] = BobPropertyConverter.convertBobLineStyle(propertyValue);
                } else if (propertyName === "line_width") {
                    tdl["text"]["lineWidth"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "rules") {
                    tdl["rules"] = BobPropertyConverter.convertBobRules(propertyValue);
                } else if (propertyName === "transparent") {
                    transparent = BobPropertyConverter.convertBobBoolean(propertyValue);
                } else if (propertyName === "visible") {
                    tdl["text"]["invisibleInOperation"] = !BobPropertyConverter.convertBobBoolean(propertyValue);
                } else {
                    Log.info("Skip property", `"${propertyName}"`);
                }
            }
        }


        if (transparent === true) {
            tdl["text"]["fill"] = false;
        }


        return tdl;
    };
}
