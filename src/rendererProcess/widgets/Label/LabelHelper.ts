import { GlobalVariables } from "../../../common/GlobalVariables";
import { BobPropertyConverter } from "../../../mainProcess/windows/DisplayWindow/BobPropertyConverter";
import { type_rules_tdl, BaseWidgetHelper } from "../BaseWidget/BaseWidgetHelper";
import * as GlobalMethods from "../../../common/GlobalMethods";
import { rgbaArrayToRgbaStr, rgbaStrToRgbaArray } from "../../../common/GlobalMethods";
import { EdlConverter } from "../../../mainProcess/windows/DisplayWindow/EdlConverter";
import { v4 as uuidv4 } from "uuid";

export type type_Label_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
};

export class LabelHelper extends BaseWidgetHelper {
    static _defaultTdl: type_Label_tdl = {
        type: "Label",
        widgetKey: "",
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
            backgroundColor: "rgba(255,255,255,0)",
            // angle
            transform: "rotate(0deg)",
            // border
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
            // text contents
            text: "Label text",
            // text align
            horizontalAlign: "flex-start",
            verticalAlign: "flex-start",
            wrapWord: false,
            invisibleInOperation: false,
            alarmBorder: true,
            alarmBackground: false,
            alarmText: false,
            alarmLevel: "MINOR",
        },
        channelNames: [],
        groupNames: [],
        rules: [],
    };

    // not getDefaultTdl(), always generate a new key
    static generateDefaultTdl = (type: string): type_Label_tdl => {
        const result = super.generateDefaultTdl(type) as type_Label_tdl;
        result.style = JSON.parse(JSON.stringify(this._defaultTdl.style));
        result.text = JSON.parse(JSON.stringify(this._defaultTdl.text));
        result.channelNames = JSON.parse(JSON.stringify(this._defaultTdl.channelNames));
        result.groupNames = JSON.parse(JSON.stringify(this._defaultTdl.groupNames));
        return result;
    };

    static convertEdlToTdl = (edl: Record<string, any>): type_Label_tdl => {
        console.log("\n------------", `Parsing "Static Text"`, "------------------\n");
        const tdl = this.generateDefaultTdl("Label") as type_Label_tdl;
        // all properties for this widget
        const propertyNames: string[] = [
            "object", // not in tdm
            "beginObjectProperties", // not in tdm
            "major", // not in tdm
            "minor", // not in tdm
            "release", // not in tdm
            "x",
            "y",
            "w",
            "h",
            "font",
            "fgColor",
            "fgAlarm", // it is a boolean, if true, and if the "alarmPv" is in MINOR or MAJOR, the
            // text is red, otherwise the text color is green. The text color is overriden.
            // this is different from "Text Update", in which the text color is retained
            // as the original color
            "bgColor",
            "bgAlarm", // not in tdm, boolean, if true, and if the "alarmPv" is in MINOR or MAJOR severity,
            // the background color is red, otherwise the background color is green. The original
            // background color is overridden
            "alarmPv", // the color PV in GUI
            "visPv",
            "visMin",
            "visMax",
            "value",
            "autoSize", // not in tdm
            "border",
            "lineWidth",
            "fontAlign",
            "useDisplayBg",
            "endObjectProperties", // not in tdm
            // Text w. Reg. Expr.
            "regExpr", // not in tdm
        ];

        const alarmPropertyNames: string[] = [];

        // default differences
        tdl["text"]["verticalAlign"] = "center";
        tdl["text"]["wrapWord"] = false;
        tdl["text"]["alarmBorder"] = false;
        tdl["text"]["text"] = "";

        for (const propertyName of propertyNames) {
            const propertyValue = edl[propertyName]
            console.log("propertyName", propertyName, propertyValue);
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
                } else if (propertyName === "font") {
                    const { fontFamily, fontWeight, fontSize, fontStyle } = EdlConverter.convertEdlFont(propertyValue);
                    tdl["style"]["fontFamily"] = fontFamily;
                    tdl["style"]["fontStyle"] = fontStyle;
                    tdl["style"]["fontSize"] = fontSize;
                    tdl["style"]["fontWeight"] = fontWeight;
                } else if (propertyName === "fgColor") {
                    tdl["style"]["color"] = EdlConverter.convertEdlColor(propertyValue, EdlConverter.convertEdlPv(edl["alarmPv"]), "Text Color", tdl);
                    tdl["style"]["borderColor"] = EdlConverter.convertEdlColor(propertyValue, EdlConverter.convertEdlPv(edl["alarmPv"]), "Border Color", tdl);
                } else if (propertyName === "bgColor") {
                    // when useDisplayBg is set, the alarmPv is ignored for background color
                    if (edl["useDisplayBg"] === undefined) {
                        tdl["style"]["backgroundColor"] = EdlConverter.convertEdlColor(propertyValue, EdlConverter.convertEdlPv(edl["alarmPv"]), "Background Color", tdl);
                    }
                } else if (propertyName === "value") {
                    tdl["text"]["text"] = EdlConverter.convertEdlTextValue(propertyValue);
                } else if (propertyName === "fontAlign") {
                    tdl["text"]["horizontalAlign"] = EdlConverter.convertEdlFontAlign(propertyValue);
                    // } else if (propertyName === "lineWidth") {
                    // 	// meaningful only when the "border" is "true"
                    // 	if (propertyNames.includes("border") && edl["border"] === "true") {
                    // 		tdl["style"]["borderWidth"] = parseInt(propertyValue);
                    // 	}
                } else if (propertyName === "border") {
                    // meaningful only when the "border" is "true"
                    let borderWidth = 1;
                    if (propertyNames.includes("lineWidth")) {
                        borderWidth = EdlConverter.convertEdlNumber(edl["lineWidth"]);
                    }
                    tdl["style"]["borderWidth"] = EdlConverter.convertEdlNumber(propertyValue);
                } else if (propertyName === "visPv") {
                    // if the visPv is INVALID, normally edm will hide this widget, but for Static Text, it shows the text as white
                    const newRules = EdlConverter.convertEdlVisPv(EdlConverter.convertEdlPv(propertyValue), edl["visMin"], edl["visMax"], edl["visInvert"], true) as type_rules_tdl;
                    if (newRules.length > 0) {
                        tdl["rules"].push(...newRules);
                    }
                } else if (propertyName === "fgAlarm") {
                    alarmPropertyNames.push(propertyName);
                } else if (propertyName === "bgAlarm") {
                    alarmPropertyNames.push(propertyName);
                } else {
                    console.log("Skip property", `"${propertyName}"`);
                }
            }
        }

        if (edl["border"] !== undefined && edl["border"] === "true") {
            let borderWidth = 1;
            if (edl["lineWidth"] !== undefined) {
                borderWidth = EdlConverter.convertEdlNumber(edl["lineWidth"]);
            }

            const rawLeft = EdlConverter.convertEdlNumber(edl["x"]);
            const rawTop = EdlConverter.convertEdlNumber(edl["y"]);
            const rawWidth = EdlConverter.convertEdlNumber(edl["w"]);
            const rawHeight = EdlConverter.convertEdlNumber(edl["h"]);
            const left = rawLeft + borderWidth;
            const top = rawTop + borderWidth;
            const width = rawWidth - 2 * borderWidth;
            const height = rawHeight - 2 * borderWidth;
            tdl["style"]["left"] = left;
            tdl["style"]["top"] = top;
            tdl["style"]["width"] = width;
            tdl["style"]["height"] = height;
            tdl["style"]["borderWidth"] = borderWidth;
            tdl["style"]["borderColor"] = tdl["style"]["color"];
        }

        if (edl["useDisplayBg"] === "true") {
            const rgbaArray = rgbaStrToRgbaArray(tdl["style"]["backgroundColor"]);
            rgbaArray[3] = 0;
            const rgbaStr = rgbaArrayToRgbaStr(rgbaArray);
            tdl["style"]["backgroundColor"] = rgbaStr;
        }

        for (let alarmPropertyName of alarmPropertyNames) {
            if (alarmPropertyName === "fgAlarm") {
                // if the alarmPv is not set in tdl setting
                if (edl["alarmPv"] === undefined) {
                    tdl["rules"].push({
                        boolExpression: `true`,
                        propertyName: "Border Color",
                        propertyValue: "rgba(0, 255, 0, 1)",
                        id: uuidv4(),
                    });
                    tdl["rules"].push({
                        boolExpression: `true`,
                        propertyName: "Text Color",
                        propertyValue: "rgba(0, 255, 0, 1)",
                        id: uuidv4(),
                    });
                } else {
                    const newRules_Text = EdlConverter.convertEdlFgAlarm(EdlConverter.convertEdlPv(edl["alarmPv"]), 1) as type_rules_tdl;
                    tdl["rules"].push(...newRules_Text);
                    const newRules_Border = EdlConverter.convertEdlBorderAlarm(EdlConverter.convertEdlPv(edl["alarmPv"]), 1) as type_rules_tdl;
                    tdl["rules"].push(...newRules_Border);
                }
            } else if (alarmPropertyName === "bgAlarm") {
                if (edl["useDisplayBg"] === undefined) {
                    if (edl["alarmPv"] === undefined) {
                        tdl["rules"].push({
                            boolExpression: `true`,
                            propertyName: "Background Color",
                            propertyValue: "rgba(0, 255, 0, 1)",
                            id: uuidv4(),
                        });
                    } else {
                        const newRules = EdlConverter.convertEdlBgAlarm(EdlConverter.convertEdlPv(edl["alarmPv"]), 1) as type_rules_tdl;
                        tdl["rules"].push(...newRules);
                    }
                }
            } else {
                console.log("Skip alarm-sensitive property", alarmPropertyName);
            }
        }

        // if visPv exists in edl setting, but its value is not available in operation, the text color
        // becomes white, the border and background disappear. These behaviors override the visPv default behavior
        // This behavior is different from the regular behavior in which the widget just becomes invisible, such as in Rectangle
        if (edl["visPv"] !== undefined) {
            tdl["rules"].push({
                boolExpression: EdlConverter.generatePvUndefinedExpression(edl["visPv"]),
                propertyName: "Text Color",
                propertyValue: "rgba(255,255,255,1)",
                id: uuidv4(),
            });
            tdl["rules"].push({
                boolExpression: EdlConverter.generatePvUndefinedExpression(edl["visPv"]),
                propertyName: "Border Width",
                propertyValue: "0",
                id: uuidv4(),
            });
            tdl["rules"].push({
                boolExpression: EdlConverter.generatePvUndefinedExpression(edl["visPv"]),
                propertyName: "Background Color",
                propertyValue: "rgba(0,0,0,0)",
                id: uuidv4(),
            });
        }

        // if alarmPv exists in edl setting, but its value is not available in operation, the text color
        // becomes white, the border and background disappear. These behaviors override the alarm-sensitive
        // This behavior is different from the regular behavior in which the widget just becomes invisible, such as in Rectangle
        if (edl["alarmPv"] !== undefined) {
            tdl["rules"].push({
                boolExpression: EdlConverter.generatePvUndefinedExpression(edl["alarmPv"]),
                propertyName: "Text Color",
                propertyValue: "rgba(255,255,255,1)",
                id: uuidv4(),
            });
            tdl["rules"].push({
                boolExpression: EdlConverter.generatePvUndefinedExpression(edl["alarmPv"]),
                propertyName: "Border Width",
                propertyValue: "0",
                id: uuidv4(),
            });
            tdl["rules"].push({
                boolExpression: EdlConverter.generatePvUndefinedExpression(edl["alarmPv"]),
                propertyName: "Background Color",
                propertyValue: "rgba(0,0,0,0)",
                id: uuidv4(),
            });
        }
        return tdl;
    };

    static convertBobToTdl = (bobWidgetJson: Record<string, any>): type_Label_tdl => {
        console.log("\n------------", `Parsing "label"`, "------------------\n");
        const tdl = this.generateDefaultTdl("Label");
        // all properties for this widget
        const propertyNames: string[] = [
            "actions", // not in tdm
            "auto_size", // not in tdm
            "background_color",
            "border_color",
            "border_width",
            "class", // not in tdm
            "font",
            "foreground_color",
            "height",
            "horizontal_alignment",
            "macros", // not in tdm
            "name", // not in tdm
            "rotation_step",
            "rules", //not in tdm
            "scripts", // not in tdm
            "text",
            "tooltip", // not in tdm
            "transparent",
            "type", // not in tdm
            "vertical_alignment",
            "visible", // not in tdm
            "width",
            "wrap_words",
            "x",
            "y",
        ];

        let transparent = true;
        tdl["text"]["wrapWord"] = true;
        tdl["style"]["top"] = 0;
        tdl["style"]["left"] = 0;
        tdl["style"]["width"] = 100;
        tdl["style"]["height"] = 20;
        tdl["style"]["backgroundColor"] = "rgba(255,255,255,0)";

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
                } else if (propertyName === "visible") {
                    tdl["text"]["invisibleInOperation"] = !BobPropertyConverter.convertBobBoolean(propertyValue);
                } else if (propertyName === "background_color") {
                    const rgbaColor = BobPropertyConverter.convertBobColor(propertyValue);
                    tdl["style"]["backgroundColor"] = rgbaColor;
                } else if (propertyName === "border_color") {
                    const rgbaColor = BobPropertyConverter.convertBobColor(propertyValue);
                    tdl["style"]["borderColor"] = rgbaColor;
                } else if (propertyName === "foreground_color") {
                    const rgbaColor = BobPropertyConverter.convertBobColor(propertyValue);
                    tdl["style"]["color"] = rgbaColor;
                } else if (propertyName === "horizontal_alignment") {
                    tdl["text"]["horizontalAlign"] = BobPropertyConverter.convertBobAlignment(propertyValue);
                } else if (propertyName === "vertical_alignment") {
                    tdl["text"]["verticalAlign"] = BobPropertyConverter.convertBobAlignment(propertyValue);
                } else if (propertyName === "rotation_step") {
                    tdl["style"]["transform"] = BobPropertyConverter.convertBobAngle(propertyValue);
                } else if (propertyName === "text") {
                    tdl["text"]["text"] = BobPropertyConverter.convertBobString(propertyValue);
                } else if (propertyName === "transparent") {
                    transparent = BobPropertyConverter.convertBobBoolean(propertyValue);
                } else if (propertyName === "font") {
                    const font = BobPropertyConverter.convertBobFont(propertyValue);
                    tdl["style"]["fontSize"] = font["fontSize"];
                    tdl["style"]["fontWeight"] = font["fontWeight"];
                    tdl["style"]["fontStyle"] = font["fontStyle"];
                    tdl["style"]["fontFamily"] = font["fontFamily"];
                } else if (propertyName === "border_width") {
                    tdl["style"]["borderWidth"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "wrap_words") {
                    tdl["text"]["wrapWord"] = BobPropertyConverter.convertBobBoolean(propertyValue);
                } else if (propertyName === "rules") {
                    tdl["rules"] = BobPropertyConverter.convertBobRules(propertyValue);
                } else {
                    console.log("Skip property", `"${propertyName}"`);
                }
            }
        }

        // the TDM default font is slightly wider
        tdl["style"]["fontSize"] = tdl["style"]["fontSize"] - 1;

        if (transparent === true) {
            const originalRgbaColor = tdl["style"]["backgroundColor"];
            const rgbaColorArray = originalRgbaColor.split(",");
            rgbaColorArray[3] = "0)";
            tdl["style"]["backgroundColor"] = rgbaColorArray.join(",");
        }

        if (tdl["style"]["transform"].includes("rotate(270deg)") || tdl["style"]["transform"].includes("rotate(90deg)")) {
            // modify the x, y, width and height
            const x = tdl["style"]["left"];
            const y = tdl["style"]["top"];
            const w = tdl["style"]["width"];
            const h = tdl["style"]["height"];

            tdl["style"]["width"] = h
            tdl["style"]["height"] = w;
            tdl["style"]["left"] = x + (w - h) / 2;
            tdl["style"]["top"] = y - (w - h) / 2;
        }

        return tdl;
    };
}
