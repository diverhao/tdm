import { Log } from "../../../../common/Log";
import { BobPropertyConverter } from "../../../windows/DisplayWindow/BobPropertyConverter";
import { type_rules_tdl, BaseWidgetHelper } from "../BaseWidget/BaseWidgetHelper";
import { EdlConverter } from "../../../windows/DisplayWindow/EdlConverter";
import { v4 as uuidv4 } from "uuid";
import { defaultComboBoxTdl, type_ComboBox_tdl } from "../../../../common/types/type_widget_tdl";
import { generateWidgetKey } from "../../../../common/GlobalMethods";


export class ComboBoxHelper extends BaseWidgetHelper {
   

    static generateDefaultTdl = (): type_ComboBox_tdl => {
        const widgetKey = generateWidgetKey(defaultComboBoxTdl.type);
        return structuredClone({
            ...defaultComboBoxTdl,
            widgetKey: widgetKey,
        });
    };

    static convertEdlToTdl = (edl: Record<string, string>): type_ComboBox_tdl => {
        Log.info("\n------------", `Parsing "Menu Button"`, "------------------\n");
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
            "fgColor",
            "fgAlarm",
            "bgColor",
            "inconsistentColor",
            "topShadowColor", // not in tdm
            "botShadowColor", // not in tdm
            "controlPv",
            "indicatorPv", // ! not in tdm
            "font",
            "visPv",
            "visMin",
            "visMax",
            "colorPv",
            "endObjectProperties", // not in tdm
        ];

        // default differences
        tdl["text"]["alarmBorder"] = false;
        tdl["text"]["useChannelItems"] = true;

        const alarmPropertyNames: string[] = [];

        for (const propertyName of propertyNames) {
            const propertyValue = edl[propertyName];
            if (propertyValue === undefined) {
                Log.info("Property", `"${propertyName}"`, "is not in edl file");
                continue;
            } else {
                if (propertyName === "x") {
                    tdl["style"]["left"] = EdlConverter.convertEdlXorY(propertyValue, undefined);
                } else if (propertyName === "y") {
                    tdl["style"]["top"] = EdlConverter.convertEdlXorY(propertyValue, undefined);
                } else if (propertyName === "w") {
                    tdl["style"]["width"] = EdlConverter.convertEdlWorH(propertyValue, undefined);
                } else if (propertyName === "h") {
                    tdl["style"]["height"] = EdlConverter.convertEdlWorH(propertyValue, undefined);
                } else if (propertyName === "controlPv") {
                    tdl["channelNames"].push(EdlConverter.convertEdlPv(propertyValue, true, true));
                } else if (propertyName === "fgColor") {
                    tdl["style"]["color"] = EdlConverter.convertEdlColor(propertyValue, edl["colorPv"], "Text Color", tdl);
                } else if (propertyName === "fgAlarm") {
                    alarmPropertyNames.push(propertyName);
                } else if (propertyName === "bgColor") {
                    tdl["style"]["backgroundColor"] = EdlConverter.convertEdlColor(propertyValue, edl["colorPv"], "Background Color", tdl);
                } else if (propertyName === "font") {
                    const { fontFamily, fontWeight, fontSize, fontStyle } = EdlConverter.convertEdlFont(propertyValue);
                    tdl["style"]["fontFamily"] = fontFamily;
                    tdl["style"]["fontStyle"] = fontStyle;
                    tdl["style"]["fontSize"] = fontSize;
                    tdl["style"]["fontWeight"] = fontWeight;
                } else if (propertyName === "visPv") {
                    const newRules = EdlConverter.convertEdlVisPv(EdlConverter.convertEdlPv(propertyValue), edl["visMin"], edl["visMax"], edl["visInvert"]) as type_rules_tdl;
                    tdl["rules"].push(...newRules);
                } else {
                    Log.info("Skip property", `"${propertyName}"`);
                }
            }
        }

        // all alarm-sensitive rules override others
        for (let alarmPropertyName of alarmPropertyNames) {
            if (alarmPropertyName === "fgAlarm") {
                const newRules = EdlConverter.convertEdlFgAlarm(edl["controlPv"], 0) as type_rules_tdl;
                tdl["rules"].push(...newRules);
            } else {
                Log.info("Skip alarm-sensitive property", alarmPropertyName);
            }
        }

        if (edl["controlPv"] !== undefined) {
            tdl["rules"].push({
                boolExpression: `[${edl["controlPv"].replaceAll(`"`, "").trim()}] == undefined`,
                propertyName: "Invisible in Operation",
                propertyValue: "true",
                id: uuidv4(),
            })
            tdl["rules"].push({
                boolExpression: `[${edl["controlPv"].replaceAll(`"`, "").trim()}] == undefined`,
                propertyName: "Alarm Border",
                propertyValue: "true",
                id: uuidv4(),
            })
        }

        if (edl["colorPv"] !== undefined) {
            tdl["rules"].push({
                boolExpression: `[${edl["colorPv"].replaceAll(`"`, "").trim()}] == undefined`,
                propertyName: "Invisible in Operation",
                propertyValue: "true",
                id: uuidv4(),
            })
            tdl["rules"].push({
                boolExpression: `[${edl["colorPv"].replaceAll(`"`, "").trim()}] == undefined`,
                propertyName: "Alarm Border",
                propertyValue: "true",
                id: uuidv4(),
            })
        }
        if (edl["indicatorPv"] !== undefined) {
            tdl["rules"].push({
                boolExpression: `[${edl["indicatorPv"].replaceAll(`"`, "").trim()}] == undefined`,
                propertyName: "Invisible in Operation",
                propertyValue: "true",
                id: uuidv4(),
            })
            tdl["rules"].push({
                boolExpression: `[${edl["indicatorPv"].replaceAll(`"`, "").trim()}] == undefined`,
                propertyName: "Alarm Border",
                propertyValue: "true",
                id: uuidv4(),
            })
        }
        if (edl["visPv"] !== undefined) {
            tdl["rules"].push({
                boolExpression: `[${edl["visPv"].replaceAll(`"`, "").trim()}] == undefined`,
                propertyName: "Invisible in Operation",
                propertyValue: "true",
                id: uuidv4(),
            })
            tdl["rules"].push({
                boolExpression: `[${edl["visPv"].replaceAll(`"`, "").trim()}] == undefined`,
                propertyName: "Alarm Border",
                propertyValue: "true",
                id: uuidv4(),
            })
        }

        return tdl;
    };


    /**
     * Convert very simple "Menu Mux" that only has one value for each item. It does not
     * handle the case where each item has multiple values
     */
    static convertEdlToTdl_Menu_Mux = (edl: Record<string, any>): type_ComboBox_tdl => {
        Log.info("\n------------", `Parsing "Menu Mux"`, "------------------\n");
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
            "fgColor",
            "fgAlarm",
            "bgColor",
            "topShadowColor", // not in tdm
            "botShadowColor", // not in tdm
            "controlPv",
            "font",
            "symbolTag",
            "value0",
            "endObjectProperties", // not in tdm
        ];

        // default differences
        tdl["text"]["alarmBorder"] = false;
        tdl["text"]["useChannelItems"] = false;
        tdl["itemNames"] = [];
        tdl["itemValues"] = [];

        const alarmPropertyNames: string[] = [];

        for (const propertyName of propertyNames) {
            const propertyValue = edl[propertyName];
            if (propertyValue === undefined) {
                Log.info("Property", `"${propertyName}"`, "is not in edl file");
                continue;
            } else {
                if (propertyName === "x") {
                    tdl["style"]["left"] = EdlConverter.convertEdlXorY(propertyValue, undefined);
                } else if (propertyName === "y") {
                    tdl["style"]["top"] = EdlConverter.convertEdlXorY(propertyValue, undefined);
                } else if (propertyName === "w") {
                    tdl["style"]["width"] = EdlConverter.convertEdlWorH(propertyValue, undefined);
                } else if (propertyName === "h") {
                    tdl["style"]["height"] = EdlConverter.convertEdlWorH(propertyValue, undefined);
                } else if (propertyName === "controlPv") {
                    tdl["channelNames"].push(EdlConverter.convertEdlPv(propertyValue, true, true));
                } else if (propertyName === "fgColor") {
                    tdl["style"]["color"] = EdlConverter.convertEdlColor(propertyValue, edl["colorPv"], "Text Color", tdl);
                } else if (propertyName === "fgAlarm") {
                    alarmPropertyNames.push(propertyName);
                } else if (propertyName === "symbolTag") {
                    tdl["itemNames"] = EdlConverter.convertMenuMuxSymbolTag(propertyValue);
                } else if (propertyName === "value0") {
                    tdl["itemValues"] = EdlConverter.convertMenuMuxValue0(propertyValue);
                } else if (propertyName === "bgColor") {
                    tdl["style"]["backgroundColor"] = EdlConverter.convertEdlColor(propertyValue, edl["colorPv"], "Background Color", tdl);
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
                const newRules = EdlConverter.convertEdlFgAlarm(edl["controlPv"], 0) as type_rules_tdl;
                tdl["rules"].push(...newRules);
            } else {
                Log.info("Skip alarm-sensitive property", alarmPropertyName);
            }
        }

        if (edl["controlPv"] !== undefined) {
            tdl["rules"].push({
                boolExpression: EdlConverter.generatePvUndefinedExpression(edl["controlPv"]),
                propertyName: "Invisible in Operation",
                propertyValue: "true",
                id: uuidv4(),
            })
            tdl["rules"].push({
                boolExpression: EdlConverter.generatePvUndefinedExpression(edl["controlPv"]),
                propertyName: "Alarm Border",
                propertyValue: "true",
                id: uuidv4(),
            })
        }


        return tdl;
    };


    static convertBobToTdl = (bobWidgetJson: Record<string, any>): type_ComboBox_tdl => {
        Log.info("\n------------", `Parsing "combo"`, "------------------\n");
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
            "items",
            "items_from_pv",
            "editable",  // not in tdm
            "enabled", // not in tdm
            "confirm_dialog", // not in tdm
            "confirm_message", // not in tdm
            "password", // not in tdm
        ];

        tdl["style"]["top"] = 0;
        tdl["style"]["left"] = 0;
        tdl["style"]["width"] = 100;
        tdl["style"]["height"] = 30;
        tdl["itemNames"] = ["item 0"];
        tdl["itemValues"] = [0];
        tdl["text"]["useChannelItems"] = true;

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
                } else if (propertyName === "items") {
                    tdl["itemNames"] = BobPropertyConverter.convertBobStrings(propertyValue, "item");
                } else if (propertyName === "items_from_pv") {
                    tdl["text"]["useChannelItems"] = BobPropertyConverter.convertBobBoolean(propertyValue);
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
