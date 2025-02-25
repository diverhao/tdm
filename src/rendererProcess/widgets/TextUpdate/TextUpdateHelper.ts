import { BobPropertyConverter } from "../../../mainProcess/windows/DisplayWindow/BobPropertyConverter";
import { type_rules_tdl, BaseWidgetHelper } from "../BaseWidget/BaseWidgetHelper";
import * as GlobalMethods from "../../global/GlobalMethods";
import { rgbaArrayToRgbaStr, rgbaStrToRgbaArray } from "../../global/GlobalMethods";
import { EdlConverter } from "../../../mainProcess/windows/DisplayWindow/EdlConverter";
import { v4 as uuidv4 } from "uuid";
import { GlobalVariables } from "../../global/GlobalVariables";

export type type_TextUpdate_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
};

export class TextUpdateHelper extends BaseWidgetHelper {
    static _defaultTdl: type_TextUpdate_tdl = {
        type: "TextUpdate",
        widgetKey: "", // "key" is a reserved keyword
        key: "",
        style: {
            // basics
            position: "absolute",
            display: "inline-block",
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
            // default, decimal, exponential, hexadecimal
            format: "default",
            // scale, >= 0
            scale: 0,
            // actually "alarm outline"
            alarmBorder: true,
            alarmText: false,
            alarmBackground: false,
            alarmLevel: "MINOR",
        },
        channelNames: [],
        groupNames: [],
        rules: [],
    };

    // not getDefaultTdl(), always generate a new key
    static generateDefaultTdl = (type: string): type_TextUpdate_tdl => {
        const result = super.generateDefaultTdl(type) as type_TextUpdate_tdl;
        result.style = JSON.parse(JSON.stringify(this._defaultTdl.style));
        result.text = JSON.parse(JSON.stringify(this._defaultTdl.text));
        result.channelNames = JSON.parse(JSON.stringify(this._defaultTdl.channelNames));
        result.groupNames = JSON.parse(JSON.stringify(this._defaultTdl.groupNames));
        return result;
    };

    static convertEdlToTdl = (edl: Record<string, string>, type: "Text Update" | "Reg Text Update"): type_TextUpdate_tdl => {
        console.log("\n------------", `Parsing ${type}`, "------------------\n");
        const tdl = this.generateDefaultTdl("TextUpdate") as type_TextUpdate_tdl;
        // all properties for this widget

        const propertyNames: string[] = [
            "major", // not in tdm
            "minor", // not in tdm
            "release", // not in tdm
            "x",
            "y",
            "w",
            "h",
            "controlPv",
            "displayMode",
            "precision",
            "fgColor",
            "fgAlarm", // not in tdm, when it is false, nothing happens. When it is true, the text
            // color becomes yellow when the serverity of "controlPv" (not colorPv) is MINOR
            // and red for MAJOR. Otherwise the text color is the original setting
            // alreadyimplemented a rule for it
            "bgColor",
            "colorPv", // ! not in tdm. Looks like it does not do anything
            "fill",
            "font",
            "fontAlign",
            "useAlarmBorder", // alarm border
            "lineWidth", // ! The line width can be set to any value in editing panel, and the
            // ! border width is shown as the value. However, when we execute the edm screen,
            // ! the border width fall backs to a maximum 10 value. Our converter does not
            // ! include this behavior.
            "lineAlarm", // not in tdm, not the alarmBorder. When false, it simply shows the original border
            // when true, the border is hidden when severity is NO_ALARM, and the
            // border becomes yellow when the severity is MINOR and rend for MAJOR
            // already implemented a rule for it.
        ];

        // default differences
        tdl["text"]["verticalAlign"] = "center";
        tdl["text"]["wrapWord"] = false;
        tdl["text"]["alarmBorder"] = false;
        // ! In Depending on the displayMode, the unit may not be shown by default
        tdl["text"]["showUnit"] = false;

        const alarmPropertyNames: string[] = [];

        for (const propertyName of propertyNames) {
            const propertyValue = edl[propertyName];
            if (propertyValue === undefined) {
                console.log("Property", `"${propertyName}"`, "is not in edl file");
                continue;
            } else {
                if (propertyName === "x") {
                    tdl["style"]["left"] = EdlConverter.convertEdlXorY(propertyValue, edl["lineWidth"]);
                } else if (propertyName === "y") {
                    tdl["style"]["top"] = EdlConverter.convertEdlXorY(propertyValue, edl["lineWidth"]);
                } else if (propertyName === "w") {
                    tdl["style"]["width"] = EdlConverter.convertEdlWorH(propertyValue, edl["lineWidth"]);
                } else if (propertyName === "h") {
                    tdl["style"]["height"] = EdlConverter.convertEdlWorH(propertyValue, edl["lineWidth"]);
                } else if (propertyName === "controlPv") {
                    tdl["channelNames"].push(EdlConverter.convertEdlPv(propertyValue, true));
                } else if (propertyName === "fgColor") {
                    // the text color honors the ruled-color
                    tdl["style"]["color"] = EdlConverter.convertEdlColor(
                        propertyValue,
                        EdlConverter.convertEdlPv(edl["controlPv"]),
                        "Text Color",
                        tdl
                    );
                    // edm border color does not honor the ruled-color, it uses the default color if it is
                    // set as ruled-color
                    tdl["style"]["borderColor"] = EdlConverter.convertEdlColor(propertyValue);
                } else if (propertyName === "bgColor") {
                    // edm background border color does not honor the ruled-color, it used the default color if it is
                    // set as ruled-color
                    tdl["style"]["backgroundColor"] = EdlConverter.convertEdlColor(propertyValue);
                } else if (propertyName === "font") {
                    const { fontFamily, fontWeight, fontSize, fontStyle } = EdlConverter.convertEdlFont(propertyValue);
                    tdl["style"]["fontFamily"] = fontFamily;
                    tdl["style"]["fontStyle"] = fontStyle;
                    tdl["style"]["fontSize"] = fontSize;
                    tdl["style"]["fontWeight"] = fontWeight;
                } else if (propertyName === "fontAlign") {
                    tdl["text"]["horizontalAlign"] = EdlConverter.convertEdlFontAlign(propertyValue);
                } else if (propertyName === "lineWidth") {
                    tdl["style"]["borderWidth"] = EdlConverter.convertEdlNumber(propertyValue);
                } else if (propertyName === "lineAlarm") {
                    alarmPropertyNames.push(propertyName);
                } else if (propertyName === "fgAlarm") {
                    alarmPropertyNames.push(propertyName);
                } else if (propertyName === "displayMode") {
                    tdl["text"]["format"] = EdlConverter.convertEdlDisplayMode(propertyValue);
                } else if (propertyName === "precision") {
                    tdl["text"]["scale"] = EdlConverter.convertEdlPrecision(propertyValue);
                } else if (propertyName === "bgAlarm") {
                    alarmPropertyNames.push(propertyName);
                } else {
                    console.log("Skip property", `"${propertyName}"`);
                }
            }
        }

        // when displayFormat is default, show unit
        if (edl["displayMode"] === undefined || edl["displayMode"].includes("default")) {
            tdl["text"]["showUnit"] = true;
        }

        // all alarm-sensitive rules override others
        for (let alarmPropertyName of alarmPropertyNames) {
            if (alarmPropertyName === "lineAlarm") {
                const newRules = EdlConverter.convertEdlColorAlarm(EdlConverter.convertEdlPv(edl["controlPv"]), 0, "Border Color") as type_rules_tdl;
                // const newRules = EdlConverter.convertEdlBorderAlarm(edl["controlPv"], 0) as type_rules_tdl;
                tdl["rules"].push(...newRules);
                if (edl["controlPv"] !== undefined) {
                    const severityPv = `${EdlConverter.convertEdlPv(edl["controlPv"]).split(".")[0]}.SEVR`;
                    tdl["rules"].push({
                        boolExpression: `[${severityPv}] < 0.5`,
                        propertyName: "Border Width",
                        propertyValue: "0",
                        id: uuidv4(),
                    });
                }
            } else if (alarmPropertyName === "fgAlarm") {
                // const newRules = EdlConverter.convertEdlFgAlarm(edl["controlPv"], 0) as type_rules_tdl;
                const newRules = EdlConverter.convertEdlColorAlarm(EdlConverter.convertEdlPv(edl["controlPv"]), 0, "Text Color") as type_rules_tdl;
                tdl["rules"].push(...newRules);
                // if controlPv exists in edl setting, but its value is not available in operation, the widget becomes invisible
                // These behaviors override the alarm-sensitive
                if (edl["controlPv"] !== undefined) {
                    tdl["rules"].push({
                        boolExpression: EdlConverter.generatePvUndefinedExpression(edl["controlPv"]),
                        propertyName: "Text Color",
                        propertyValue: "rgba(255,255,255,1)",
                        id: uuidv4(),
                    });
                }
            } else if (alarmPropertyName === "bgAlarm") {
                // only "Text Monitor" has it
                const newRules = EdlConverter.convertEdlBgAlarm(EdlConverter.convertEdlPv(edl["controlPv"]), 0) as type_rules_tdl;
                tdl["rules"].push(...newRules);
            } else {
                console.log("Skip alarm-sensitive property", alarmPropertyName);
            }
        }

        if (edl["fill"] === "false" || edl["fill"] === undefined) {
            const colorArray = rgbaStrToRgbaArray(tdl["style"]["backgroundColor"]);
            colorArray[3] = 0;
            const colorStr = rgbaArrayToRgbaStr(colorArray);
            tdl["style"]["backgroundColor"] = colorStr;
        }

        // if alarmPv exists in edl setting, but its value is not available in operation, the widget becomes invisible
        // These behaviors override the alarm-sensitive
        if (edl["colorPv"] !== undefined) {
            tdl["rules"].push({
                boolExpression: EdlConverter.generatePvUndefinedExpression(edl["colorPv"]),
                propertyName: "Text Color",
                propertyValue: "rgba(255,255,255,1)",
                id: uuidv4(),
            });
            // tdl["rules"].push({
            // 	boolExpression: `[${edl["colorPv"].replaceAll(`"`, "")}] == undefined`,
            // 	propertyName: "Background Color",
            // 	propertyValue: "rgba(255,255,255,0)",
            // 	id: uuidv4(),
            // });
            // tdl["rules"].push({
            // 	boolExpression: `[${edl["colorPv"].replaceAll(`"`, "")}] == undefined`,
            // 	propertyName: "Border Width",
            // 	propertyValue: "1",
            // 	id: uuidv4(),
            // });
            // tdl["rules"].push({
            // 	boolExpression: `[${edl["colorPv"].replaceAll(`"`, "")}] == undefined`,
            // 	propertyName: "Border Color",
            // 	propertyValue: "rgba(255,255,255,1)",
            // 	id: uuidv4(),
            // });
        }
        return tdl;
    };

    static convertEdlToTdl_TextControl = (
        edl: Record<string, string>,
        type: "Text Control" | "Text Monitor" = "Text Control"
    ): type_TextUpdate_tdl => {
        console.log("\n------------", `parsing ${type}`, "------------------\n");
        const tdl = this.generateDefaultTdl("TextUpdate") as type_TextUpdate_tdl;
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
            "format", // ! not in tdm
            "font",
            "fgColor",
            "fgAlarm", // Boolean
            // When it is true, the text color is overridden: when the "controlPv" is in
            // MAJOR or MINOR severity, the text color becomes red, otherwise it is green
            // There is no border for this widget
            // already realized by a rule
            "bgColor",
            "bgAlarm", // Boolean
            // When it is true, the background color is overridden: when the "controlPv" is
            // in MAJOR or MINOR severity, the background color is red, otherwise it is green
            // already realized by a rule
            "editable", // when "true", it should be a "TextEntry", when "false", it should be a "TextUpdate"
            "autoHeight", // not in tdm
            "motifWidget", // not in tdm
            "limitsFromDb", // ! not in tdm
            "fieldLen", // ! what is it?
            "nullPv", // ! not in tdm, a PV name
            // ! when it is set, the text color is taken control by it when the "controlPv" is in NO_ALARM
            // ! severity. If the below "nullCondition" is satisfied, the text color becomes the
            // ! "nullColor", if not satisfied, the text color is the regular text color.
            // ! in summary
            // ! valid nullPv + nullCondition satisified + bgAlarm true + NO_ALARM controlPv ==> nullColor
            // ! valid nullPv + nullCondition satisified + bgAlarm true + MAJOR/MINOR controlPv ==> red
            // ! valid nullPv + nullCondition satisified + bgAlarm false + NO_ALARM controlPv ==> nullColor
            // ! valid nullPv + nullCondition satisified + bgAlarm false + MAJOR/MINOR controlPv ==> nullColor
            // ! valid nullPv + nullCondition not satisified + bgAlarm true + NO_ALARM controlPv ==> bgColor
            // ! valid nullPv + nullCondition not satisified + bgAlarm true + MAJOR/MINOR controlPv ==> bgColor
            // ! valid nullPv + nullCondition not satisified + bgAlarm false + NO_ALARM controlPv ==> bgColor
            // ! valid nullPv + nullCondition not satisified + bgAlarm false + MAJOR/MINOR controlPv ==> bgColor
            // ! not valid nullPv + nullCondition satisified + bgAlarm true + NO_ALARM controlPv ==> bgColor
            // ! not valid nullPv + nullCondition satisified + bgAlarm true + MAJOR/MINOR controlPv ==> red
            // ! not valid nullPv + nullCondition satisified + bgAlarm false + NO_ALARM controlPv ==> bgColor
            // ! not valid nullPv + nullCondition satisified + bgAlarm false + MAJOR/MINOR controlPv ==> bgColor
            // ! not valid nullPv + nullCondition not satisified + bgAlarm true + NO_ALARM controlPv ==> bgColor
            // ! not valid nullPv + nullCondition not satisified + bgAlarm true + MAJOR/MINOR controlPv ==> red
            // ! not valid nullPv + nullCondition not satisified + bgAlarm false + NO_ALARM controlPv ==> bgColor
            // ! not valid nullPv + nullCondition not satisified + bgAlarm false + MAJOR/MINOR controlPv ==> bgColor
            // ! the above can be realized in rules
            "nullColor", // ! not in tdm
            "nullCondition", // ! not in tdm
            "colorPv", // for controlling ruled-colors
            "smartRefresh", // not in tdm
            "useKp", // not in tdm, use keypad
            "useDisplayBg",
            "showUnits",
            "changeValOnLoseFocus", // not in tdm
            "fastUpdate", // not in tdm
            "date", // not in tdm
            "file", // not in tdm
            "defDir", // not in tdm
            "pattern", // not in tdm
            "autoSelect", // not in tdm
            "fontAlign",
            "updatePvOnDrop", // not in tdm
            "useHexPrefix", // not in tdm
            "fileComponent", // not in tdm
            "dateAsFileName", // not in tdm
            "useAlarmBorder", // alarm border
            // if it is true and the "fgAlarm" is "true", a 2 pixel width red color border appears when the
            // "controlPv" is in MAJOR or MINOR severity
            // already realized using rules
            "newPos", // not in tdm, what is it?
            "inputFocusUpdates", // not in tdm
            "objType", // not in tdm
            "clipToDspLimits", // not in tdm
            "changeCallback", // not in tdm
            "isPassword", // not in tdm
            "characterMode", // not in tdm
            "noExecuteClipMask", // not in tdm
            "endObjectProperties", // not in tdm
        ];

        // default differences

        // default differences
        tdl["text"]["verticalAlign"] = "center";
        tdl["text"]["wrapWord"] = false;
        tdl["text"]["alarmBorder"] = false;
        tdl["text"]["showUnit"] = false;

        const alarmPropertyNames: string[] = [];

        for (const propertyName of propertyNames) {
            const propertyValue = edl[propertyName];
            if (propertyValue === undefined) {
                console.log("Property", `"${propertyName}"`, "is not in edl file");
                continue;
            } else {
                if (propertyName === "x") {
                    tdl["style"]["left"] = EdlConverter.convertEdlNumber(propertyValue);
                } else if (propertyName === "y") {
                    tdl["style"]["top"] = EdlConverter.convertEdlNumber(propertyValue);
                } else if (propertyName === "w") {
                    tdl["style"]["width"] = EdlConverter.convertEdlNumber(propertyValue);
                } else if (propertyName === "h") {
                    tdl["style"]["height"] = EdlConverter.convertEdlNumber(propertyValue);
                } else if (propertyName === "controlPv") {
                    tdl["channelNames"].push(EdlConverter.convertEdlPv(propertyValue, true));
                } else if (propertyName === "fgColor") {
                    tdl["style"]["color"] = EdlConverter.convertEdlColor(propertyValue, EdlConverter.convertEdlPv(edl["colorPv"]), "Text Color", tdl);
                } else if (propertyName === "bgColor") {
                    tdl["style"]["backgroundColor"] = EdlConverter.convertEdlColor(
                        propertyValue,
                        EdlConverter.convertEdlPv(edl["colorPv"]),
                        "Background Color",
                        tdl
                    );
                } else if (propertyName === "showUnits") {
                    tdl["text"]["showUnit"] = EdlConverter.convertEdlBoolean(propertyValue);
                } else if (propertyName === "font") {
                    const { fontFamily, fontWeight, fontSize, fontStyle } = EdlConverter.convertEdlFont(propertyValue);
                    tdl["style"]["fontFamily"] = fontFamily;
                    tdl["style"]["fontStyle"] = fontStyle;
                    tdl["style"]["fontSize"] = fontSize;
                    tdl["style"]["fontWeight"] = fontWeight;
                } else if (propertyName === "fontAlign") {
                    tdl["text"]["horizontalAlign"] = EdlConverter.convertEdlFontAlign(propertyValue);
                } else if (propertyName === "fgAlarm") {
                    alarmPropertyNames.push(propertyName);
                } else if (propertyName === "useAlarmBorder") {
                    // in "Text Monitor", the useAlarmBorder seems not honored
                    if (type === "Text Control") {
                        tdl["text"]["alarmBorder"] = true;
                    }
                } else if (propertyName === "bgAlarm") {
                    alarmPropertyNames.push(propertyName);
                } else {
                    console.log("Skip property", `"${propertyName}"`);
                }
            }
        }

        // all alarm-sensitive rules override others
        for (let alarmPropertyName of alarmPropertyNames) {
            if (alarmPropertyName === "bgAlarm") {
                const newRules = EdlConverter.convertEdlBgAlarm(EdlConverter.convertEdlPv(edl["controlPv"]), 1) as type_rules_tdl;
                tdl["rules"].push(...newRules);
            } else if (alarmPropertyName === "fgAlarm") {
                // const newRules = EdlConverter.convertEdlFgAlarm(edl["controlPv"], 1) as type_rules_tdl;
                if (type === "Text Monitor") {
                    if (edl["useAlarmBorder"] !== "true") {
                        const newRules = EdlConverter.convertEdlColorAlarm(
                            EdlConverter.convertEdlPv(edl["controlPv"]),
                            1,
                            "Text Color"
                        ) as type_rules_tdl;
                        tdl["rules"].push(...newRules);
                    } 
                    // else {
                    //     const newRules = EdlConverter.convertEdlColorAlarm(edl["controlPv"], 1, "Text Color") as type_rules_tdl;
                    //     tdl["rules"].push(...newRules);
                    // }
                } else {
                    // const newRules = EdlConverter.convertEdlColorAlarm(edl["controlPv"], 1, "Text Color") as type_rules_tdl;
                    // tdl["rules"].push(...newRules);
                    if (edl["useAlarmBorder"] !== "true") {
                        const newRules = EdlConverter.convertEdlColorAlarm(
                            EdlConverter.convertEdlPv(edl["controlPv"]),
                            1,
                            "Text Color"
                        ) as type_rules_tdl;
                        tdl["rules"].push(...newRules);
                    }
                }
            } else {
                console.log("Skip alarm-sensitive property", alarmPropertyName);
            }
        }

        // special rules for TextControl
        if (edl["useAlarmBorder"] === "true" && edl["fgAlarm"] === "true") {
            const newRules = EdlConverter.convertEdlBorderAlarm(edl["controlPv"], 0) as type_rules_tdl;
            tdl["rules"].push(...newRules);
            if (edl["controlPv"] !== undefined) {
                tdl["rules"].push({
                    boolExpression: `[${EdlConverter.convertEdlPv(edl["controlPv"]).split(".")[0]}.SEVR] > 0.5`,
                    propertyName: "Border Width",
                    propertyValue: "2",
                    id: uuidv4(),
                });
            }
        }

        if (edl["useDisplayBg"] === "true") {
            const rgbaArray = rgbaStrToRgbaArray(tdl["style"]["backgroundColor"]);
            rgbaArray[3] = 0;
            const rgbaStr = rgbaArrayToRgbaStr(rgbaArray);
            tdl["style"]["backgroundColor"] = rgbaStr;
        }

        // if colorPv exists in edl setting, but its value is not available in operation, the widget becomes invisible
        // These behaviors override the alarm-sensitive
        if (edl["colorPv"] !== undefined) {
            tdl["rules"].push({
                boolExpression: EdlConverter.generatePvUndefinedExpression(edl["colorPv"]),
                propertyName: "Invisible in Operation",
                propertyValue: "true",
                id: uuidv4(),
            });
            tdl["rules"].push({
                boolExpression: EdlConverter.generatePvUndefinedExpression(edl["colorPv"]),
                propertyName: "Alarm Border",
                propertyValue: "true",
                id: uuidv4(),
            });
        }
        if (edl["controlPv"] !== undefined) {
            tdl["rules"].push({
                boolExpression: EdlConverter.generatePvUndefinedExpression(edl["controlPv"]),
                propertyName: "Invisible in Operation",
                propertyValue: "true",
                id: uuidv4(),
            });
            tdl["rules"].push({
                boolExpression: EdlConverter.generatePvUndefinedExpression(edl["controlPv"]),
                propertyName: "Alarm Border",
                propertyValue: "true",
                id: uuidv4(),
            });
        }
        if (edl["nullPv"] !== undefined) {
            tdl["rules"].push({
                boolExpression: `[${edl["nullPv"].replaceAll(`"`, "")}] == undefined`,
                propertyName: "Invisible in Operation",
                propertyValue: "true",
                id: uuidv4(),
            });
            tdl["rules"].push({
                boolExpression: `[${edl["nullPv"].replaceAll(`"`, "")}] == undefined`,
                propertyName: "Alarm Border",
                propertyValue: "true",
                id: uuidv4(),
            });
        }
        // if controlPv is empty, the whole widget is invisible
        if (edl["controlPv"] === undefined) {
            tdl["rules"].push({
                boolExpression: `true`,
                propertyName: "Invisible in Operation",
                propertyValue: "true",
                id: uuidv4(),
            });
        }

        return tdl;
    };

    static convertBobToTdl = (bob: Record<string, any>): type_TextUpdate_tdl => {
        console.log("\n------------", `Parsing "textupdate"`, "------------------\n");
        const tdl = this.generateDefaultTdl("TextUpdate");
        // all properties for this widget
        const propertyNames: string[] = [
            "actions", // not in tdm
            "background_color",
            "border_alarm_sensitive",
            "border_color",
            "border_width",
            "class", // not in tdm
            "font",
            "foreground_color",
            "format", // not in tdm
            "height",
            "horizontal_alignment",
            "interactive", // not in tdm
            "name", // not in tdm
            "precision", // not in tdm
            "pv_name",
            "rotation_step",
            "rules", // not in tdm
            "scripts", // not in tdm
            "show_units",
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

        for (const propertyName of propertyNames) {
            const propertyValue = bob[propertyName];
            if (propertyValue === undefined) {
                if (propertyName === "widget") {
                    console.log(`There are one or more widgets inside "display"`);
                } else {
                    console.log("Property", `"${propertyName}"`, "is not in bob file");
                }
                continue;
            } else {
                if (propertyName === "x") {
                    tdl["style"]["left"] = parseInt(propertyValue);
                } else if (propertyName === "y") {
                    tdl["style"]["top"] = parseInt(propertyValue);
                } else if (propertyName === "width") {
                    tdl["style"]["width"] = parseInt(propertyValue);
                } else if (propertyName === "height") {
                    tdl["style"]["height"] = parseInt(propertyValue);
                } else if (propertyName === "background_color") {
                    const rgbaColor = BobPropertyConverter.convertBobColor(propertyValue, undefined);
                    tdl["style"]["backgroundColor"] = rgbaColor;
                } else if (propertyName === "font") {
                    const font = BobPropertyConverter.convertBobFont(propertyValue);
                    tdl["style"]["fontSize"] = font["fontSize"];
                    tdl["style"]["fontFamily"] = font["fontFamily"];
                    tdl["style"]["fontStyle"] = font["fontStyle"];
                    tdl["style"]["fontWeight"] = font["fontWeight"];
                } else if (propertyName === "foreground_color") {
                    const rgbaColor = BobPropertyConverter.convertBobColor(propertyValue, undefined);
                    tdl["style"]["color"] = rgbaColor;
                } else if (propertyName === "border_color") {
                    const rgbaColor = BobPropertyConverter.convertBobColor(propertyValue, undefined);
                    tdl["style"]["borderColor"] = rgbaColor;
                } else if (propertyName === "border_width") {
                    tdl["style"]["borderWidth"] = parseInt(propertyValue);
                } else if (propertyName === "wrap_words") {
                    tdl["text"]["wrapWord"] = BobPropertyConverter.convertBobBoolean(propertyValue);
                } else if (propertyName === "show_units") {
                    tdl["text"]["showUnit"] = BobPropertyConverter.convertBobBoolean(propertyValue);
                } else if (propertyName === "horizontal_alignment") {
                    tdl["text"]["horizontalAlign"] = BobPropertyConverter.convertBobHorizontalAlign(propertyValue);
                } else if (propertyName === "vertical_alignment") {
                    tdl["text"]["verticalAlign"] = BobPropertyConverter.convertBobHorizontalAlign(propertyValue);
                } else if (propertyName === "pv_name") {
                    tdl["channelNames"].push(propertyValue);
                } else if (propertyName === "text") {
                    tdl["text"]["text"] = propertyValue;
                } else if (propertyName === "line_color") {
                    const rgbaColor = BobPropertyConverter.convertBobColor(propertyValue, undefined);
                    tdl["text"]["lineColor"] = rgbaColor;
                } else if (propertyName === "line_width") {
                    tdl["text"]["lineWidth"] = parseInt(propertyValue);
                } else if (propertyName === "line_style") {
                    let borderStyles = ["solid", "dashed", "dotted", "dash-dot", "dash-dot-dot"];
                    tdl["text"]["lineStyle"] = borderStyles[parseInt(propertyValue)];
                } else if (propertyName === "corner_width") {
                    tdl["text"]["cornerWidth"] = parseInt(propertyValue);
                } else if (propertyName === "corner_height") {
                    tdl["text"]["cornerHeight"] = parseInt(propertyValue);
                } else if (propertyName === "border_alarm_sensitive") {
                    tdl["text"]["alarmBorder"] = BobPropertyConverter.convertBobBoolean(propertyValue);
                } else {
                    console.log("Skip property", `"${propertyName}"`);
                }
            }
        }

        // handle the situation that the "background_color" is not explicitly shown in bob file
        // while the "transparent" is explicitly shown
        // default transparent is "false"
        if (bob["transparent"] === "true") {
            const rgbaArray = GlobalMethods.rgbaStrToRgbaArray(tdl["style"]["backgroundColor"]);
            rgbaArray[3] = 0;
            const rgbaString = GlobalMethods.rgbaArrayToRgbaStr(rgbaArray);
            tdl["style"]["backgroundColor"] = rgbaString;
        }

        // special treatment for rotation
        if (Object.keys(bob).includes("rotation_step")) {
            const propertyValue = bob["rotation_step"];
            const left = parseInt(bob["x"]);
            const top = parseInt(bob["y"]);
            const width = parseInt(bob["width"]);
            const height = parseInt(bob["height"]);
            const result = BobPropertyConverter.convertBobRotationStep(propertyValue, left, top, width, height);
            tdl["style"]["transform"] = result["transform"];
            tdl["style"]["left"] = result["newLeft"];
            tdl["style"]["top"] = result["newTop"];
            tdl["style"]["width"] = result["newWidth"];
            tdl["style"]["height"] = result["newHeight"];
        }

        return tdl;
    };
}
