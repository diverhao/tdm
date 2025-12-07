import { BobPropertyConverter } from "../../../windows/DisplayWindow/BobPropertyConverter";
import { type_rules_tdl, BaseWidgetHelper } from "../BaseWidget/BaseWidgetHelper";
import * as GlobalMethods from "../../../../common/GlobalMethods";
import { rgbaArrayToRgbaStr, rgbaStrToRgbaArray } from "../../../../common/GlobalMethods";
import { EdlConverter } from "../../../windows/DisplayWindow/EdlConverter";
import { v4 as uuidv4 } from "uuid";

export type type_Polyline_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
    pointsX: number[];
    pointsY: number[];
};

export class PolylineHelper extends BaseWidgetHelper {
    static _defaultTdl: type_Polyline_tdl = {
        type: "Polyline",
        widgetKey: "", // "key" is a reserved keyword
        key: "",
        style: {
            // basics
            position: "absolute",
            display: "inline-flex",
            // dimensions
            left: 0,
            top: 0,
            width: 100,
            height: 100,
            backgroundColor: "rgba(0,0,0,0)",
            // angle
            transform: "rotate(0deg)",
            // line color, not text color
            color: "rgba(0,0,255,1)",
            // border
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
            // line styles
            lineWidth: 3,
            lineStyle: "solid",
            lineColor: "rgba(0,0,255,1)",
            // arrows, length and width are in unit of line width
            arrowLength: 6,
            arrowWidth: 3,
            showArrowHead: false,
            showArrowTail: false,
            // curve
            smootherize: false,
            // when fill === true and closed === true, it is a polygon
            fill: false,
            closed: false,
            fillColor: "rgba(50,50,255,1)",
            invisibleInOperation: false,
            alarmBorder: false,
            alarmBackground: false,
            alarmText: false,
            alarmFill: false,
            alarmLevel: "MINOR",
        },
        channelNames: [],
        groupNames: [],
        rules: [],
        pointsX: [],
        pointsY: [],
    };

    // not getDefaultTdl(), always generate a new key
    static generateDefaultTdl = (type: string): type_Polyline_tdl => {
        // defines type, widgetKey, and key
        const result = super.generateDefaultTdl(type) as type_Polyline_tdl;
        result.style = JSON.parse(JSON.stringify(this._defaultTdl.style));
        result.text = JSON.parse(JSON.stringify(this._defaultTdl.text));
        result.channelNames = JSON.parse(JSON.stringify(this._defaultTdl.channelNames));
        result.groupNames = JSON.parse(JSON.stringify(this._defaultTdl.groupNames));
        result.pointsX = JSON.parse(JSON.stringify(this._defaultTdl.pointsX));
        result.pointsY = JSON.parse(JSON.stringify(this._defaultTdl.pointsY));
        return result;
    };

    static convertEdlToTdl = (edl: Record<string, any>): type_Polyline_tdl | undefined => {
        console.log("\n------------", `Parsing "Lines"`, "------------------\n");
        const tdl = this.generateDefaultTdl("Polyline") as type_Polyline_tdl;
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

        // console.log("edl", edl, alarmPropertyNames, tdl)

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
                    console.log("Skip property", `"${propertyName}"`);
                }
            }
        }
        console.log("edl", edl, alarmPropertyNames, tdl)

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
                console.log("Skip alarm-sensitive property", alarmPropertyName);
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
        console.log("\n------------", `Parsing "polyline"`, "------------------\n");
        const tdl = this.generateDefaultTdl("Polyline");
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
            tdl["text"]["arrowLength"] = 20;
            tdl["text"]["arrowWidth"] = 4;
        }

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
                    tdl["text"]["arrowLength"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "arrows") {
                    const arrwoData = BobPropertyConverter.convertBobArrows(propertyValue);
                    tdl["text"]["showArrowHead"] = arrwoData["showArrowHead"];
                    tdl["text"]["showArrowTail"] = arrwoData["showArrowTail"];
                } else if (propertyName === "points") {
                    const points = BobPropertyConverter.convertBobPoints(propertyValue);
                    tdl["pointsX"] = points["pointsX"];
                    tdl["pointsY"] = points["pointsY"];
                } else {
                    console.log("Skip property", `"${propertyName}"`);
                }
            }
        }


        if (transparent === true) {
            tdl["text"]["fill"] = false;
        }

        // the arrow length is in unit of line width
        if (tdl["text"]["lineWidth"] !== 0) {
            tdl["text"]["arrowLength"] = tdl["text"]["arrowLength"] / tdl["text"]["lineWidth"];
        } else {
            tdl["text"]["arrowLength"] = tdl["text"]["arrowLength"] / 3;
        }


        return tdl;
    };
}
