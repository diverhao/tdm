import { Log } from "../../../../common/Log";
import { BobPropertyConverter } from "../../../windows/DisplayWindow/BobPropertyConverter";
import { type_rules_tdl, BaseWidgetHelper } from "../BaseWidget/BaseWidgetHelper";
import { EdlConverter } from "../../../windows/DisplayWindow/EdlConverter";
import { v4 as uuidv4 } from "uuid";
import { defaultChoiceButtonTdl, type_ChoiceButton_tdl } from "../../../../common/types/type_widget_tdl";
import { generateWidgetKey } from "../../../../common/GlobalMethods";


export class ChoiceButtonHelper extends BaseWidgetHelper {

    static generateDefaultTdl = (): type_ChoiceButton_tdl => {
        const widgetKey = generateWidgetKey(defaultChoiceButtonTdl.type);
        return structuredClone({
            ...defaultChoiceButtonTdl,
            widgetKey: widgetKey,
        });
    };

    static convertEdlToTdl = (edl: Record<string, string>): type_ChoiceButton_tdl => {
        Log.info("\n------------", `Parsing "Choice Button"`, "------------------\n");
        Log.info(edl)
        const tdl = this.generateDefaultTdl();

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
                    const newRules = EdlConverter.convertEdlVisPv(EdlConverter.convertEdlPv(propertyValue), edl["visMin"], edl["visMax"], edl["visInvert"]) as type_rules_tdl;
                    tdl["rules"].push(...newRules);
                } else if (propertyName === "font") {
                    const { fontFamily, fontWeight, fontSize, fontStyle } = EdlConverter.convertEdlFont(propertyValue);
                    tdl["style"]["fontFamily"] = fontFamily;
                    tdl["style"]["fontStyle"] = fontStyle;
                    tdl["style"]["fontSize"] = fontSize;
                    tdl["style"]["fontWeight"] = fontWeight;
                } else {
                    Log.info("Skip property", `"${propertyName}"`);
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
                Log.info("Skip alarm-sensitive property", alarmPropertyName);
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
        Log.info("\n------------", `Parsing "choice"`, "------------------\n");
        const tdl = this.generateDefaultTdl();
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
        tdl["itemNames"] = ["Item 1", "Item 2"];
        tdl["text"]["appearance"] = "contemporary";

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
                    tdl["itemNames"] = BobPropertyConverter.convertBobStrings(propertyValue, "item");
                } else if (propertyName === "items_from_pv") {
                    tdl["text"]["useChannelItems"] = BobPropertyConverter.convertBobBoolean(propertyValue);
                } else if (propertyName === "horizontal") {
                    const isHorizontal = BobPropertyConverter.convertBobBoolean(propertyValue);
                    tdl["text"]["direction"] = isHorizontal === true ? "horizontal" : "vertical";
                } else {
                    Log.info("Skip property", `"${propertyName}"`);
                }
            }
        }

        tdl["itemValues"] = [];
        for (let ii = 0; ii < tdl["itemNames"].length; ii++) {
            tdl["itemValues"].push(ii);
        }

        return tdl;
    };
}
