import { BobPropertyConverter } from "../../BobPropertyConverter";
import { Log } from "../../../../common/Log";
import { type_rules_tdl, BaseWidgetHelper } from "../BaseWidget/BaseWidgetHelper";
import { generateWidgetKey, rgbaArrayToRgbaStr, rgbaStrToRgbaArray } from "../../../../common/GlobalMethods";
import { EdlConverter } from "../../EdlConverter";
import { v4 as uuidv4 } from "uuid";
import { defaultArcTdl, type_Arc_tdl } from "../../../../common/types/type_widget_tdl";

export class ArcHelper extends BaseWidgetHelper {
    static generateDefaultTdl = (): type_Arc_tdl => {
        const widgetKey = generateWidgetKey(defaultArcTdl.type);
        return structuredClone({
            ...defaultArcTdl,
            widgetKey: widgetKey,
        });
    };

    static convertEdlToTdl = (edl: Record<string, string>, type: "Arc" | "Circle"): type_Arc_tdl => {
        Log.info("\n------------", `Parsing ${type}`, "------------------\n");
        const tdl = this.generateDefaultTdl() as type_Arc_tdl;
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
            "lineWidth",
            "lineStyle",
            "lineAlarm",
            "fill",
            "fillAlarm",
            "fillColor",
            "alarmPv",
            "visPv",
            "visMin",
            "visMax",
            "visInvert",
            "startAngle",
            "totalAngle",
            "endObjectProperties", // not in tdm
        ];

        // default differences
        tdl["text"]["showRadius"] = "none";
        tdl["text"]["alarmBorder"] = false;
        tdl["text"]["lineWidth"] = 1;
        tdl["text"]["fill"] = false;
        if (type === "Circle") {
            tdl["text"]["angleRange"] = 359;
        } else {
            tdl["text"]["angleRange"] = 180;
        }

        const alarmPropertyNames: string[] = [];

        for (const propertyName of propertyNames) {
            const propertyValue = edl[propertyName];
            if (propertyValue === undefined) {
                Log.info("Property", `"${propertyName}"`, "is not in edl file");
                continue;
            } else {
                if (propertyName === "x") {
                    // the definition of x/y/w/h is different from TextUpdate or Rectangle
                    tdl["style"]["left"] = EdlConverter.convertEdlXorY(propertyValue, edl["lineWidth"], true);
                } else if (propertyName === "y") {
                    tdl["style"]["top"] = EdlConverter.convertEdlXorY(propertyValue, edl["lineWidth"], true);
                } else if (propertyName === "w") {
                    tdl["style"]["width"] = EdlConverter.convertEdlWorH(propertyValue, edl["lineWidth"], true);
                } else if (propertyName === "h") {
                    tdl["style"]["height"] = EdlConverter.convertEdlWorH(propertyValue, edl["lineWidth"], true);
                } else if (propertyName === "lineColor") {
                    tdl["text"]["lineColor"] = EdlConverter.convertEdlColor(propertyValue, EdlConverter.convertEdlPv(edl["alarmPv"]), "Line Color", tdl);
                } else if (propertyName === "fill") {
                    tdl["text"]["fill"] = EdlConverter.convertEdlBoolean(propertyValue);
                } else if (propertyName === "fillColor") {
                    tdl["text"]["fillColor"] = EdlConverter.convertEdlColor(propertyValue, EdlConverter.convertEdlPv(edl["alarmPv"]), "Fill Color", tdl);
                } else if (propertyName === "lineWidth") {
                    tdl["text"]["lineWidth"] = EdlConverter.convertEdlNumber(propertyValue);
                } else if (propertyName === "lineStyle") {
                    tdl["text"]["lineStyle"] = EdlConverter.convertEdlLineStyle(propertyValue);
                } else if (propertyName === "startAngle") {
                    tdl["text"]["angleStart"] = EdlConverter.convertEdlNumber(propertyValue);
                } else if (propertyName === "totalAngle") {
                    tdl["text"]["angleRange"] = EdlConverter.convertEdlNumber(propertyValue);
                } else if (propertyName === "visPv") {
                    const newRules = EdlConverter.convertEdlVisPv(EdlConverter.convertEdlPv(edl["visPv"]), edl["visMin"], edl["visMax"], edl["visInvert"]) as type_rules_tdl;
                    tdl["rules"].push(...newRules);
                } else if (propertyName === "lineAlarm") {
                    alarmPropertyNames.push(propertyName);
                } else if (propertyName === "fillAlarm") {
                    alarmPropertyNames.push(propertyName);
                } else {
                    Log.info("Skip property", `"${propertyName}"`);
                }
            }
        }

        // all alarm-sensitive rules override others
        for (let alarmPropertyName of alarmPropertyNames) {
            if (alarmPropertyName === "lineAlarm") {
                const newRules = EdlConverter.convertEdlLineAlarm(EdlConverter.convertEdlPv(edl["alarmPv"]), 1) as type_rules_tdl;
                tdl["rules"].push(...newRules);
            } else if (alarmPropertyName === "fillAlarm") {
                const newRules = EdlConverter.convertEdlFillAlarm(EdlConverter.convertEdlPv(edl["alarmPv"]), 1) as type_rules_tdl;
                tdl["rules"].push(...newRules);
            } else {
                Log.info("Skip alarm-sensitive property", alarmPropertyName);
            }
        }

        if (edl["fill"] === "false" || edl["fill"] === undefined) {
            const colorArray = rgbaStrToRgbaArray(tdl["text"]["fillColor"]);
            colorArray[3] = 0;
            const colorStr = rgbaArrayToRgbaStr(colorArray);
            tdl["text"]["fillColor"] = colorStr;
        }


        // if alarmPv exists in edl setting, but its value is not available in operation, the widget becomes invisible
        // These behaviors override the alarm-sensitive
        // in EDM Circle widget, the "alarmPv" is not set anywhere in GUI, but it exists in the edl file
        // Its value is always a space. We should ignore this case.
        if (edl["alarmPv"] !== undefined && edl["alarmPv"].replaceAll('"', "").trim() !== "") {
            tdl["rules"].push({
                boolExpression: `${EdlConverter.generatePvUndefinedExpression(edl["alarmPv"])} == undefined`,
                propertyName: "Invisible in Operation",
                propertyValue: "true",
                id: uuidv4(),
            });
            tdl["rules"].push({
                boolExpression: `${EdlConverter.generatePvUndefinedExpression(edl["alarmPv"])} == undefined`,
                propertyName: "Alarm Border",
                propertyValue: "true",
                id: uuidv4(),
            });

        }
        // if visPv exists in edl setting, but its value is not available in operation, the widget becomes invisible
        // These behaviors override the alarm-sensitive
        if (edl["visPv"] !== undefined) {
            tdl["rules"].push({
                boolExpression: `${EdlConverter.generatePvUndefinedExpression(edl["visPv"])} == undefined`,
                propertyName: "Invisible in Operation",
                propertyValue: "true",
                id: uuidv4(),
            });
            tdl["rules"].push({
                boolExpression: `${EdlConverter.generatePvUndefinedExpression(edl["visPv"])} == undefined`,
                propertyName: "Alarm Border",
                propertyValue: "true",
                id: uuidv4(),
            });

        }
        return tdl;
    };

    static convertBobToTdl = (bobWidgetJson: Record<string, any>, type: "ellipse" | "arc"): type_Arc_tdl => {
        Log.info("\n------------", `Parsing ${type}`, "------------------\n");
        const tdl = this.generateDefaultTdl();
        // all properties for this widget
        const propertyNames: string[] = [
            "actions", // not in tdm
            "background_color",
            "class", // not in tdm
            "height",
            "line_color",
            "line_style",
            "line_width",
            "macros", // not in tdm
            "name", // not in tdm
            "rules",
            "scripts", // not in tdm
            "start_angle",
            "total_angle",
            "tooltip", // not in tdm
            "transparent",
            "type", // not in tdm
            "visible",
            "width",
            "x",
            "y",
        ];

        tdl["style"]["top"] = 0;
        tdl["style"]["left"] = 0;
        tdl["style"]["backgroundColor"] = "rgba(0,0,0,0)";

        if (type === "arc") {
            tdl["text"]["angleRange"] = 90;
            tdl["style"]["width"] = 100;
            tdl["style"]["height"] = 100;
        } else if (type === "ellipse") {
            tdl["style"]["width"] = 100;
            tdl["style"]["height"] = 50;
            tdl["text"]["angleRange"] = 359;
            tdl["text"]["showRadius"] = "none";
        }

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
                if (propertyName === "line_style") {
                    tdl["text"]["lineStyle"] = BobPropertyConverter.convertBobLineStyle(propertyValue);
                } else if (propertyName === "line_color") {
                    tdl["text"]["lineColor"] = BobPropertyConverter.convertBobColor(propertyValue);
                } else if (propertyName === "line_width") {
                    tdl["text"]["lineWidth"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "x") {
                    tdl["style"]["left"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "y") {
                    tdl["style"]["top"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "width") {
                    tdl["style"]["width"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "height") {
                    tdl["style"]["height"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "start_angle") {
                    tdl["text"]["angleStart"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "total_angle") {
                    tdl["text"]["angleRange"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "transparent") {
                    tdl["text"]["fill"] = BobPropertyConverter.convertBobBoolean(propertyValue);
                    tdl["text"]["showRadius"] = "none";
                } else if (propertyName === "visible") {
                    tdl["text"]["invisibleInOperation"] = !BobPropertyConverter.convertBobBoolean(propertyValue);
                } else if (propertyName === "background_color") {
                    const rgbaColor = BobPropertyConverter.convertBobColor(propertyValue);
                    tdl["text"]["fillColor"] = rgbaColor;
                } else if (propertyName === "rules") {
                    tdl["rules"] = BobPropertyConverter.convertBobRules(propertyValue);
                } else {
                    Log.info("Skip property", `"${propertyName}"`);
                }
            }
        }
        if (type === "ellipse") {
            tdl["text"]["angleStart"] = 0;
            tdl["text"]["angleRange"] = 360;
            tdl["text"]["showRadius"] = "none";
        }
        return tdl;


    }
}
