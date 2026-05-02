import { BobPropertyConverter } from "../../BobPropertyConverter";
import { Log } from "../../../../common/Log";
import { type_rules_tdl, BaseWidgetHelper } from "../BaseWidget/BaseWidgetHelper";
import * as GlobalMethods from "../../../../common/GlobalMethods";
import { rgbaArrayToRgbaStr, rgbaStrToRgbaArray } from "../../../../common/GlobalMethods";
import { EdlConverter } from "../../EdlConverter";
import { v4 as uuidv4 } from "uuid";
import { defaultPolylineTdl, type_Polyline_tdl } from "../../../../common/types/type_widget_tdl";

export class PolylineHelper extends BaseWidgetHelper {

    static generateDefaultTdl = (): type_Polyline_tdl => {
        const widgetKey = GlobalMethods.generateWidgetKey(defaultPolylineTdl["type"]);
        return structuredClone({
            ...defaultPolylineTdl,
            widgetKey: widgetKey,
        })
    };

    static convertEdlToTdl = (edl: Record<string, any>): type_Polyline_tdl | undefined => {
        Log.info("\n------------", `Parsing "Lines"`, "------------------\n");
        const tdl = this.generateDefaultTdl();
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
            "lineAlarm", // not in tdm, boolean
            // when it is true, the line color is overridden. When the "alamrPv" is
            // in MAJOR severity, the line color is red, when MINOR, it is yellow, when the "alarmPv"
            // is in NO_ALARM severity, the line color is green.
            // Can be realized in a rule
            "fill",
            "fillColor",
            "fillAlarm", // not in tdm, boolean
            // Similar to "lineAlarm": when the "alarmPv" is in MAJOR or MINOR severity
            // and the "fill" is "true", the fill color is red or yellow. Otherwise
            // the fill color is green.
            // Can be realized in a rule
            "lineWidth",
            "lineStyle",
            "alarmPv", // not in tdm
            // the PV to control "lineAlarm" and "fillAlarm" above
            "visPv",
            "visMin",
            "visMax",
            "closePolygon",
            "arrows",
            "numPoints", // not in tdm
            "xPoints",
            "yPoints",
            "endObjectProperties", // not in tdm
        ];

        const alarmPropertyNames: string[] = [];

        // default differences
        tdl["text"]["lineWidth"] = 1;
        tdl["text"]["lineColor"] = "rgba(0,0,0,1)";

        // Log.info("edl", edl, alarmPropertyNames, tdl)

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
                    tdl["style"]["width"] = Math.max(parseInt(propertyValue), 5);
                } else if (propertyName === "h") {
                    tdl["style"]["height"] = Math.max(parseInt(propertyValue), 5);
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
                } else if (propertyName === "closePolygon") {
                    tdl["text"]["closed"] = EdlConverter.convertEdlBoolean(propertyValue);
                } else if (propertyName === "arrows") {
                    const [arrowTail, arrowHead] = EdlConverter.convertEdlArrows(propertyValue);
                    tdl["text"]["showArrowHead"] = arrowHead;
                    tdl["text"]["showArrowTail"] = arrowTail;
                } else if (propertyName === "lineAlarm") {
                    alarmPropertyNames.push(propertyName);
                } else if (propertyName === "fillAlarm") {
                    alarmPropertyNames.push(propertyName);
                } else if (propertyName === "xPoints") {
                    const array = EdlConverter.convertEdl2dArray(propertyValue);
                    const left = EdlConverter.convertEdlNumber(edl["x"]);
                    if (array[1].length <= 1) {
                        return undefined;
                    }
                    for (let ii = 0; ii < array[1].length; ii++) {
                        array[1][ii] = array[1][ii] - left * 0;
                    }
                    const xmin = Math.min(...array[1]);
                    for (let x of array[1]) {
                        tdl["pointsX"].push(x - xmin);
                    }
                    tdl["style"]["left"] = xmin;
                } else if (propertyName === "yPoints") {
                    const array = EdlConverter.convertEdl2dArray(propertyValue);
                    const top = EdlConverter.convertEdlNumber(edl["y"]);
                    if (array[1].length <= 1) {
                        return undefined;
                    }
                    for (let ii = 0; ii < array[1].length; ii++) {
                        array[1][ii] = array[1][ii] - top * 0;
                    }
                    const ymin = Math.min(...array[1]);
                    for (let y of array[1]) {
                        tdl["pointsY"].push(y - ymin);
                    }
                    tdl["style"]["top"] = ymin;
                    // tdl["pointsY"] = array[1];
                } else if (propertyName === "visPv") {
                    const newRules = EdlConverter.convertEdlVisPv(EdlConverter.convertEdlPv(propertyValue), edl["visMin"], edl["visMax"], edl["visInvert"]) as type_rules_tdl;
                    if (newRules.length > 0) {
                        tdl["rules"].push(...newRules);
                    }
                } else {
                    Log.info("Skip property", `"${propertyName}"`);
                }
            }
        }
        Log.info("edl", edl, alarmPropertyNames, tdl)

        for (let alarmPropertyName of alarmPropertyNames) {
            if (alarmPropertyName === "lineAlarm") {
                const newRules = EdlConverter.convertEdlLineAlarm(EdlConverter.convertEdlPv(edl["alarmPv"]), 1) as type_rules_tdl;
                tdl["rules"].push(...newRules);
                // special case for EDM "Lines" widget
                // if the lineAlarm is "true", and the alarmPv is not set in tdl setting page (undefined),
                // the above newRules are empty, and the line color will be the default color
                // However, for "Lines" widget, the line color and fill color become yellow in this case
                if (edl["alarmPv"] === undefined) {
                    tdl["rules"].push({
                        boolExpression: `true`,
                        propertyName: "Line Color",
                        propertyValue: "rgba(255, 255, 0, 1)",
                        id: uuidv4(),
                    });
                }
            } else if (alarmPropertyName === "fillAlarm") {
                const newRules = EdlConverter.convertEdlFillAlarm(EdlConverter.convertEdlPv(edl["alarmPv"]), 1) as type_rules_tdl;
                tdl["rules"].push(...newRules);
                // special case for EDM "Lines" widget
                // see above "lineAlarm"
                if (edl["alarmPv"] === undefined) {
                    tdl["rules"].push({
                        boolExpression: `true`,
                        propertyName: "Fill Color",
                        propertyValue: "rgba(255, 255, 0, 1)",
                        id: uuidv4(),
                    });
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

    static convertBobToTdl = (bobWidgetJson: Record<string, any>, type: "polygon" | "polyline"): type_Polyline_tdl => {
        Log.info("\n------------", `Parsing "polyline"`, "------------------\n");
        const tdl = this.generateDefaultTdl();
        // all properties for this widget
        const propertyNames: string[] = [
            "actions", // not in tdm
            "arrow_length", // polyline only
            "arrows", // polyline only
            "background_color", // polygon only
            "transparent", // polygon only
            "class", // not in tdm
            "height",
            "line_color",
            "line_style",
            "line_width",
            "macros", // not in tdm
            "name", // not in tdm
            "points",
            "rules",
            "scripts", // not in tdm
            "tooltip", // not in tdm
            "type", // not in tdm
            "visible",
            "width",
            "x",
            "y",
        ];

        let transparent = false;
        let arrowLengthRaw = -1;

        tdl["style"]["top"] = 0;
        tdl["style"]["left"] = 0;
        tdl["style"]["width"] = 100;
        tdl["style"]["height"] = 20;
        tdl["text"]["lineColor"] = "rgba(0,0,255,1)";
        if (type === "polygon") {
            tdl["text"]["fillColor"] = "rgba(0,0,255,1)";
            tdl["text"]["closed"] = true;
            tdl["text"]["fill"] = true;
        } else if (type === "polyline") {
            tdl["text"]["fill"] = false;
            tdl["text"]["lineWidth"] = 3;
            tdl["text"]["arrowLength"] = 20 / 3 + 2.56;
            tdl["text"]["arrowWidth"] = tdl["text"]["arrowLength"] / 2;
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
                if (propertyName === "background_color") {
                    const rgbaColor = BobPropertyConverter.convertBobColor(propertyValue);
                    tdl["text"]["fillColor"] = rgbaColor;
                } else if (propertyName === "transparent") {
                    transparent = BobPropertyConverter.convertBobBoolean(propertyValue);
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
                } else if (propertyName === "line_width") {
                    tdl["text"]["lineWidth"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "line_style") {
                    tdl["text"]["lineStyle"] = BobPropertyConverter.convertBobLineStyle(propertyValue);
                } else if (propertyName === "visible") {
                    tdl["text"]["invisibleInOperation"] = !BobPropertyConverter.convertBobBoolean(propertyValue);
                } else if (propertyName === "arrow_length") {
                    arrowLengthRaw = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "arrows") {
                    const arrwoData = BobPropertyConverter.convertBobArrows(propertyValue);
                    tdl["text"]["showArrowHead"] = arrwoData["showArrowHead"];
                    tdl["text"]["showArrowTail"] = arrwoData["showArrowTail"];
                } else if (propertyName === "points") {
                    const points = BobPropertyConverter.convertBobPoints(propertyValue);
                    tdl["pointsX"] = points["pointsX"];
                    tdl["pointsY"] = points["pointsY"];
                } else {
                    Log.info("Skip property", `"${propertyName}"`);
                }
            }
        }


        if (transparent === true) {
            tdl["text"]["fill"] = false;
        }

        if (arrowLengthRaw !== -1) {
            tdl["text"]["arrowLength"] = arrowLengthRaw / tdl["text"]["lineWidth"] + 2.56;
            tdl["text"]["arrowWidth"] = tdl["text"]["arrowLength"] / 2;
        }

        return tdl;
    };
}
