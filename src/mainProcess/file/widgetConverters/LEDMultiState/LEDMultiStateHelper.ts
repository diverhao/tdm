import { generateWidgetKey } from "../../../../common/GlobalMethods";
import { Log } from "../../../../common/Log";
import { defaultLEDMultiStateTdl, type_LEDMultiState_tdl } from "../../../../common/types/type_widget_tdl";
import { BobPropertyConverter } from "../../BobPropertyConverter";
import { BaseWidgetHelper } from "../BaseWidget/BaseWidgetHelper";

export class LEDMultiStateHelper extends BaseWidgetHelper {

    static generateDefaultTdl = (): type_LEDMultiState_tdl => {
        const widgetKey = generateWidgetKey(defaultLEDMultiStateTdl.type);
        return structuredClone({
            ...defaultLEDMultiStateTdl,
            widgetKey: widgetKey,
        });
    };

    static convertBobToTdl = (bobWidgetJson: Record<string, any>): type_LEDMultiState_tdl => {
        Log.info("\n------------", `Parsing "led multi-state"`, "------------------\n");
        const tdl = this.generateDefaultTdl();
        // all properties for this widget
        const propertyNames: string[] = [
            "actions", // not in tdm
            "border_alarm_sensitive",
            "class", // not in tdm
            "color",
            "fallback_color",
            "fallback_label",
            "font",
            "foreground_color",
            "height",
            "label",
            "line_color",
            "name", // not in tdm
            "pv_name",
            "rules",
            "scripts", // not in tdm
            "square",
            "states",
            "tooltip", // not in tdm
            "type", // not in tdm
            "value",
            "visible",
            "width",
            "x",
            "y",
        ];

        tdl["style"]["top"] = 0;
        tdl["style"]["left"] = 0;
        tdl["style"]["width"] = 20;
        tdl["style"]["height"] = 20;
        tdl["itemNames"][0] = "State 1";
        tdl["itemNames"][1] = "State 2";
        
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
                if (propertyName === "bit") {
                    tdl["text"]["bit"] = BobPropertyConverter.convertBobNum(propertyValue);
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
                } else if (propertyName === "labels_from_pv") {
                    tdl["text"]["useChannelItems"] = BobPropertyConverter.convertBobBoolean(propertyValue);
                } else if (propertyName === "fallback_color") {
                    tdl["text"]["fallbackColor"] = BobPropertyConverter.convertBobColor(propertyValue);
                } else if (propertyName === "fallback_label") {
                    tdl["text"]["fallbackText"] = BobPropertyConverter.convertBobString(propertyValue);
                } else if (propertyName === "line_color") {
                    tdl["text"]["lineColor"] = BobPropertyConverter.convertBobColor(propertyValue);
                } else if (propertyName === "off_color") {
                    tdl["itemColors"][0] = BobPropertyConverter.convertBobColor(propertyValue);
                } else if (propertyName === "on_color") {
                    tdl["itemColors"][1] = BobPropertyConverter.convertBobColor(propertyValue);
                } else if (propertyName === "off_label") {
                    tdl["itemNames"][0] = BobPropertyConverter.convertBobString(propertyValue);
                } else if (propertyName === "on_label") {
                    tdl["itemNames"][1] = BobPropertyConverter.convertBobString(propertyValue);
                } else if (propertyName === "pv_name") {
                    tdl["channelNames"].push(BobPropertyConverter.convertBobString(propertyValue));
                } else if (propertyName === "rules") {
                    tdl["rules"] = BobPropertyConverter.convertBobRules(propertyValue);
                } else if (propertyName === "square") {
                    const isSquare = BobPropertyConverter.convertBobBoolean(propertyValue);
                    tdl["text"]["shape"] = isSquare === true ? "square" : "round";
                } else if (propertyName === "states") {
                    const statesData = BobPropertyConverter.convertBobStates(propertyValue);
                    tdl["itemColors"] = statesData["itemColors"];
                    tdl["itemNames"] = statesData["itemNames"];
                    tdl["itemValues"] = statesData["itemValues"];
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
