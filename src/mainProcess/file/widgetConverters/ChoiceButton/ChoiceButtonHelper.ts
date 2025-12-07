import { GlobalVariables } from "../../../../common/GlobalVariables";
import { BobPropertyConverter } from "../../../windows/DisplayWindow/BobPropertyConverter";
import { type_rules_tdl, BaseWidgetHelper, type_BaseWidget_tdl } from "../BaseWidget/BaseWidgetHelper";
import * as GlobalMethods from "../../../../common/GlobalMethods";
import { rgbaArrayToRgbaStr, rgbaStrToRgbaArray } from "../../../../common/GlobalMethods";
import { EdlConverter } from "../../../windows/DisplayWindow/EdlConverter";
import { v4 as uuidv4 } from "uuid";

export type type_ChoiceButton_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
    itemLabels: string[];
    itemValues: (number | string | number[] | string[] | undefined)[];
};

export class ChoiceButtonHelper extends BaseWidgetHelper {
    // override BaseWidget
    static _defaultTdl: type_ChoiceButton_tdl = {
        type: "ChoiceButton",
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
            backgroundColor: "rgba(128, 255, 255, 0)",
            // angle
            transform: "rotate(0deg)",
            // font
            color: "rgba(0,0,0,1)",
            fontFamily: GlobalVariables.defaultFontFamily,
            fontSize: GlobalVariables.defaultFontSize,
            fontStyle: GlobalVariables.defaultFontStyle,
            fontWeight: GlobalVariables.defaultFontWeight,
            // border, it is different from the alarmBorder below
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
            // colors
            selectedBackgroundColor: "rgba(218, 218, 218, 1)",
            unselectedBackgroundColor: "rgba(200, 200, 200, 1)",
            useChannelItems: true,
            invisibleInOperation: false,
            direction: "horizontal",
            // "contemporary" | "traditional"
            appearance: "traditional",
            alarmText: false,
            alarmBackground: false,
            alarmLevel: "MINOR",
            confirmOnWrite: false,
            confirmOnWriteUsePassword: false,
            confirmOnWritePassword: "",
        },
        channelNames: [],
        groupNames: [],
        rules: [],
        // could be more than two labels
        itemLabels: ["Label 0", "Label 1"],
        itemValues: [0, 1],
    };

    // override
    static generateDefaultTdl = (type: string): type_ChoiceButton_tdl => {
        // defines type, widgetKey, and key
        const result = super.generateDefaultTdl(type);
        result.style = JSON.parse(JSON.stringify(this._defaultTdl.style));
        result.text = JSON.parse(JSON.stringify(this._defaultTdl.text));
        result.channelNames = JSON.parse(JSON.stringify(this._defaultTdl.channelNames));
        result.groupNames = JSON.parse(JSON.stringify(this._defaultTdl.groupNames));
        result.itemLabels = JSON.parse(JSON.stringify(this._defaultTdl.itemLabels));
        result.itemValues = JSON.parse(JSON.stringify(this._defaultTdl.itemValues));
        return result as type_ChoiceButton_tdl;
    };

    static convertEdlToTdl = (edl: Record<string, string>): type_ChoiceButton_tdl => {
        console.log("\n------------", `Parsing "Choice Button"`, "------------------\n");
        console.log(edl)
        const tdl = this.generateDefaultTdl("ChoiceButton") as type_ChoiceButton_tdl;

        const propertyNames: string[] = [
            "beginObjectProperties", // not in tdm
            "major", // not in tdm
            "minor", // not in tdm
            "release", // not in tdm
            "x",
            "y",
            "w",
            "h",
            "fgColor",
            "fgAlarm",
            "bgColor",
            "selectColor",
            "inconsistentColor", // ! what is it?
            "topShadowColor", // not in tdm
            "botShadowColor", // not in tdm
            "controlPv",
            "indicatorPv", // ! not in tdm, "Reacback PV", if controlPv does not exist, use it
            "font",
            "visPv",
            "visMin",
            "visMax",
            "colorPv",
            "orientation",
            "endObjectProperties", // not in tdm
        ];

        const alarmPropertyNames: string[] = [];

        // default differences
        tdl["text"]["alarmBorder"] = true;
        tdl["text"]["showUnit"] = true;
        tdl["text"]["direction"] = "vertical";

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
                    // it is a control-type widget, only use real channel name, i.e. "val0" or "loc://abc"
                    tdl["channelNames"].push(EdlConverter.convertEdlPv(propertyValue, true, true));
                } else if (propertyName === "indicatorPv") {
                    if (edl["controlPv"] === undefined || edl["controlPv"].trim() === "") {
                        tdl["channelNames"].push(EdlConverter.convertEdlPv(propertyValue, true, true));
                    }
                } else if (propertyName === "fgColor") {
                    tdl["style"]["color"] = EdlConverter.convertEdlColor(
                        propertyValue
                        // EdlConverter.convertEdlPv(edl["controlPv"]),
                        // "Text Color",
                        // tdl
                    );
                } else if (propertyName === "bgColor") {
                    tdl["text"]["unselectedBackgroundColor"] = EdlConverter.convertEdlColor(
                        propertyValue,
                        EdlConverter.convertEdlPv(edl["colorPv"]),
                        "Unselected BG Color",
                        tdl
                    );
                } else if (propertyName === "selectColor") {
                    // does not honor ruled-color
                    tdl["text"]["selectedBackgroundColor"] = EdlConverter.convertEdlColor(propertyValue);
                } else if (propertyName === "fgAlarm") {
                    alarmPropertyNames.push(propertyName);
                } else if (propertyName === "orientation") {
                    tdl["text"]["direction"] = propertyValue.includes("horizontal") ? "horizontal" : "vertical";
                } else if (propertyName === "visPv") {
                    tdl["text"]["invisibleInOperation"] = EdlConverter.convertEdlVisPv(
                        EdlConverter.convertEdlPv(propertyValue),
                        edl["visMmin"],
                        edl["visMax"],
                        edl["visInvert"]
                    );
                } else if (propertyName === "font") {
                    const { fontFamily, fontWeight, fontSize, fontStyle } = EdlConverter.convertEdlFont(propertyValue);
                    tdl["style"]["fontFamily"] = fontFamily;
                    tdl["style"]["fontStyle"] = fontStyle;
                    tdl["style"]["fontSize"] = fontSize;
                    tdl["style"]["fontWeight"] = fontWeight;
                } else {
                    console.log("Skip property", `"${propertyName}"`);
                }
            }
        }

        // all alarm-sensitive rules override others
        for (let alarmPropertyName of alarmPropertyNames) {
            if (alarmPropertyName === "fgAlarm") {
                const newRules_Labels = EdlConverter.convertEdlColorAlarm(
                    EdlConverter.convertEdlPv(edl["controlPv"]),
                    1,
                    "Text Color"
                ) as type_rules_tdl;
                tdl["rules"].push(...newRules_Labels);
            }
            // else if (alarmPropertyName === "lineAlarm") {
            // the border is not shown at all in operating mode
            // const newRules_border = EdlConverter.convertEdlColorAlarm(edl["indicatorPv"], 1, "Border Color") as type_rules_tdl;
            // tdl["rules"].push(...newRules_border);
            // }
            else {
                console.log("Skip alarm-sensitive property", alarmPropertyName);
            }
        }
        if (edl["controlPv"] !== undefined) {
            tdl["rules"].push({
                boolExpression: EdlConverter.generatePvUndefinedExpression(edl["controlPv"]),
                propertyName: "Invisible in Operation",
                propertyValue: "true",
                id: uuidv4(),
            });
        }
        if (edl["colorPv"] !== undefined) {
            tdl["rules"].push({
                boolExpression: EdlConverter.generatePvUndefinedExpression(edl["colorPv"]),
                propertyName: "Invisible in Operation",
                propertyValue: "true",
                id: uuidv4(),
            });
        }

        return tdl;
    };


    static convertBobToTdl = (bobWidgetJson: Record<string, any>): type_ChoiceButton_tdl => {
        console.log("\n------------", `Parsing "choice"`, "------------------\n");
        const tdl = this.generateDefaultTdl("ChoiceButton") as type_ChoiceButton_tdl;
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
            "font",
            "foreground_color",
            "background_color",
            "selected_color",
            "items",
            "items_from_pv",
            "horizontal",
            "enabled", // not in tdm
            "confirm_dialog", // not in tdm
            "confirm_message", // not in tdm
            "password", // not in tdm
        ];

        tdl["text"]["useChannelItems"] = false;

        tdl["style"]["left"] = 0;
        tdl["style"]["top"] = 0;
        tdl["style"]["width"] = 100;
        tdl["style"]["height"] = 43;
        tdl["itemLabels"] = ["Item 1", "Item 2"];
        tdl["text"]["appearance"] = "contemporary";

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
                } else if (propertyName === "font") {
                    const data = BobPropertyConverter.convertBobFont(propertyValue);
                    tdl["style"]["fontSize"] = data["fontSize"];
                    tdl["style"]["fontFamily"] = data["fontFamily"];
                    tdl["style"]["fontStyle"] = data["fontStyle"];
                    tdl["style"]["fontWeight"] = data["fontWeight"];
                } else if (propertyName === "foreground_color") {
                    tdl["style"]["color"] = BobPropertyConverter.convertBobColor(propertyValue);
                } else if (propertyName === "background_color") {
                    tdl["style"]["backgroundColor"] = BobPropertyConverter.convertBobColor(propertyValue);
                } else if (propertyName === "selected_color") {
                    tdl["text"]["selectedBackgroundColor"] = BobPropertyConverter.convertBobColor(propertyValue);
                } else if (propertyName === "items") {
                    tdl["itemLabels"] = BobPropertyConverter.convertBobStrings(propertyValue, "item");
                } else if (propertyName === "items_from_pv") {
                    tdl["text"]["useChannelItems"] = BobPropertyConverter.convertBobColor(propertyValue);
                } else if (propertyName === "horizontal") {
                    const isHorizontal = BobPropertyConverter.convertBobBoolean(propertyValue);
                    tdl["text"]["direction"] = isHorizontal === true ? "horizontal" : "vertical";
                } else {
                    console.log("Skip property", `"${propertyName}"`);
                }
            }
        }

        tdl["itemValues"] = [];
        for (let ii = 0; ii < tdl["itemLabels"].length; ii++) {
            tdl["itemValues"].push(ii);
        }

        return tdl;
    };
}
