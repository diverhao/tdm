import { GlobalVariables } from "../../../../common/GlobalVariables";
import { Log } from "../../../../common/Log";
import { BobPropertyConverter } from "../../../windows/DisplayWindow/BobPropertyConverter";
import { type_rules_tdl, BaseWidgetHelper } from "../BaseWidget/BaseWidgetHelper";
import { EdlConverter } from "../../../windows/DisplayWindow/EdlConverter";
import { v4 as uuidv4 } from "uuid";
import { defaultLEDTdl, type_LED_tdl } from "../../../../common/types/type_widget_tdl";
import { generateWidgetKey } from "../../../../common/GlobalMethods";

/**
 * edm does not have LED widget, but its Button widget may come with 
 * visPv which shows the status of another PV, we generate a regular
 * button and a LED for this edm Button widget
 */
export class LEDHelper extends BaseWidgetHelper {

    static generateDefaultTdl = (): type_LED_tdl => {
        const widgetKey = generateWidgetKey(defaultLEDTdl.type);
        return structuredClone({
            ...defaultLEDTdl,
            widgetKey: widgetKey,
        });
    };

    // if a edm Button has indicatorPv, we convert this widget to a BooleanButton and a LED
    // the Boolean Button is invisible, laying on the top, the LED shows the indicatorPv
    // edl does not have LED widget type, this type in edlJSON is simply a copy of edl Button
    static convertEdlToTdl_Button = (edl: Record<string, any>, type: "Button"): type_LED_tdl | undefined => {
        Log.info("\n------------", `Parsing "Button"`, "------------------\n");
        const tdl = this.generateDefaultTdl() as type_LED_tdl;
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
            //  if true, the text color is overridden. When the "controlPv" is MINOR severity, text color is yellow,
            //  MAJOR is red, otherwise is green
            //  already implemented a rule to for it
            "onColor",
            "offColor",
            "inconsistentColor",
            "topShadowColor", // not in tdm
            "botShadowColor", // not in tdm
            "controlPv",
            "indicatorPv", // ! not in tdm. The "Reacback PV" on edl setting page. If this is set, the background 3d effect is controled by
            // ! this PV. It uses the "readBitPos" below
            // ! can be realized by rule
            "readBitPos", // ! not in tdm, it is the bit # of above "indicatorPv"
            "onLabel",
            "offLabel",
            "labelType",
            "buttonType", // "Button" specific, "push and reset" or nothing ("toggle")
            "toggle", // "MessageButton" specific, true ("toggle") or nothing (could be "push and reset", "push no reset", or "push nothing and set")
            "invisible",
            "font",
            "objType", // ! not in tdm, what is it?
            "visPv",
            "visMin",
            "visMax",
            "visInvert",
            "colorPv", // it controls the ruled-color for background and text
            "controlBitPos",
            "endObjectProperties", // not in tdm
            // Message button specific
            "pressValue", // corresponds to onLabel, onColor
            "releaseValue", // corresponds to offLabe, offColor
            "useEnumNumeric", // ! not in tdm, looks like not working
        ];

        tdl["text"]["alarmBorder"] = false;
        tdl["text"]["bit"] = -1;
        tdl["text"]["shape"] = "square";
        tdl["text"]["useChannelItems"] = true;

        if (edl["indicatorPv"] === undefined || type !== "Button") {
            return undefined;
        }

        const alarmPropertyNames: string[] = [];

        let hasPressValue = false;
        let hasReleaseValue = false;

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
                } else if (propertyName === "fgColor") {
                    tdl["style"]["color"] = EdlConverter.convertEdlColor(propertyValue, EdlConverter.convertEdlPv(edl["colorPv"]), "Text Color", tdl);
                } else if (propertyName === "inconsistentColor") {
                    tdl["text"]["fallbackColor"] = EdlConverter.convertEdlColor(propertyValue);
                } else if (propertyName === "onColor") {
                    tdl["itemColors"][1] = EdlConverter.convertEdlColor(propertyValue);
                } else if (propertyName === "offColor") {
                    tdl["itemColors"][0] = EdlConverter.convertEdlColor(propertyValue);
                } else if (propertyName === "onLabel" && edl["labelType"]?.replaceAll(`"`, "") === "literal" && type === "Button") {
                    tdl["itemNames"][1] = propertyValue.replaceAll(`"`, "");
                } else if (propertyName === "offLabel" && edl["labelType"]?.replaceAll(`"`, "") === "literal" && type === "Button") {
                    tdl["itemNames"][0] = propertyValue.replaceAll(`"`, "");
                } else if (propertyName === "labelType") {
                    tdl["text"]["useChannelItems"] = edl["labelType"]?.replaceAll(`"`, "") === "literal" ? false : true;
                } else if (propertyName === "indicatorPv") {
                    tdl["channelNames"].push(EdlConverter.convertEdlPv(propertyValue, true, true));
                } else if (propertyName === "font") {
                    const { fontFamily, fontWeight, fontSize, fontStyle } = EdlConverter.convertEdlFont(propertyValue);
                    tdl["style"]["fontFamily"] = fontFamily;
                    tdl["style"]["fontStyle"] = fontStyle;
                    tdl["style"]["fontSize"] = fontSize;
                    tdl["style"]["fontWeight"] = fontWeight;
                } else if (propertyName === "controlBitPos") {
                    tdl["text"]["bit"] = EdlConverter.convertEdlNumber(propertyValue);
                } else if (propertyName === "visPv") {
                    const newRules = EdlConverter.convertEdlVisPv(
                        EdlConverter.convertEdlPv(propertyValue),
                        edl["visMin"],
                        edl["visMax"],
                        edl["visInvert"]
                    ) as type_rules_tdl;
                    if (newRules.length > 0) {
                        tdl["rules"].push(...newRules);
                    }
                } else if (propertyName === "fgAlarm") {
                    alarmPropertyNames.push(propertyName);
                    // Message button specific
                } else if (propertyName === "invisible") {
                    const newRules = EdlConverter.convertEdlInvisible(propertyValue) as type_rules_tdl;
                    tdl["rules"].push(...newRules);
                } else {
                    Log.info("Skip property", `"${propertyName}"`);
                }
            }
        }

        // for (let alarmPropertyName of alarmPropertyNames) {
        //     // only for Button, not for "Message Button"
        //     if (alarmPropertyName === "fgAlarm") {
        //         // if the fgAlarm === "true", the text color becomes green if there is no additional rule
        //         // we are not going to change the tdl["tyle"]["color"], instead, we add a rule
        //         // so that in editing mode, we still have the default color
        //         tdl["rules"].push({
        //             boolExpression: `true`,
        //             propertyName: "Text Color",
        //             propertyValue: "rgba(0,255,0,1)",
        //             id: uuidv4(),
        //         });
        //         const newRules = EdlConverter.convertEdlFgAlarm(EdlConverter.convertEdlPv(edl["controlPv"]), 1) as type_rules_tdl;
        //         tdl["rules"].push(...newRules);
        //     } else {
        //         Log.info("Skip alarm-sensitive property", alarmPropertyName);
        //     }
        // }

        // // if alarmPv exists in edl setting, but its value is not available in operation, the widget becomes invisible
        // // These behaviors override the alarm-sensitive
        // if (edl["colorPv"] !== undefined) {
        //     tdl["rules"].push({
        //         boolExpression: EdlConverter.generatePvUndefinedExpression(edl["colorPv"]),
        //         propertyName: "Invisible in Operation",
        //         propertyValue: "true",
        //         id: uuidv4(),
        //     });
        //     tdl["rules"].push({
        //         boolExpression: EdlConverter.generatePvUndefinedExpression(edl["colorPv"]),
        //         propertyName: "Alarm Border",
        //         propertyValue: "true",
        //         id: uuidv4(),
        //     });
        // }

        // if visPv exists in edl setting, but its value is not available in operation, the widget becomes invisible
        // These behaviors override the alarm-sensitive
        // this behavior is only for Button, not for "Message Button"
        if (edl["indicatorPv"] !== undefined && type === "Button") {
            tdl["rules"].push({
                boolExpression: EdlConverter.generatePvUndefinedExpression(edl["indicatorPv"]),
                propertyName: "Invisible in Operation",
                propertyValue: "true",
                id: uuidv4(),
            });
            // tdl["rules"].push({
            //     boolExpression: EdlConverter.generatePvUndefinedExpression(edl["visPv"]),
            //     propertyName: "Alarm Border",
            //     propertyValue: "true",
            //     id: uuidv4(),
            // });
        }

        // // if visPv exists in edl setting, but its value is not available in operation, the widget becomes invisible
        // // These behaviors override the alarm-sensitive
        // if (edl["visPv"] !== undefined) {
        //     tdl["rules"].push({
        //         boolExpression: EdlConverter.generatePvUndefinedExpression(edl["visPv"]),
        //         propertyName: "Invisible in Operation",
        //         propertyValue: "true",
        //         id: uuidv4(),
        //     });
        //     tdl["rules"].push({
        //         boolExpression: EdlConverter.generatePvUndefinedExpression(edl["visPv"]),
        //         propertyName: "Alarm Border",
        //         propertyValue: "true",
        //         id: uuidv4(),
        //     });
        // }
        return tdl;
    };

    static convertBobToTdl = (bobWidgetJson: Record<string, any>): type_LED_tdl => {
        Log.info("\n------------", `Parsing "led"`, "------------------\n");
        const tdl = this.generateDefaultTdl();
        // all properties for this widget
        const propertyNames: string[] = [
            "actions", // not in tdm
            "bit",
            "border_alarm_sensitive",
            "class", // not in tdm
            "font",
            "foreground_color",
            "height",
            "labels_from_pv",
            "line_color",
            "name", // not in tdm
            "off_color",
            "off_label",
            "on_color",
            "on_label",
            "pv_name",
            "rules",
            "scripts", // not in tdm
            "square",
            "tooltip", // not in tdm
            "type", // not in tdm
            "visible",
            "width",
            "x",
            "y",
        ];

        tdl["style"]["top"] = 0;
        tdl["style"]["left"] = 0;
        tdl["style"]["width"] = 20;
        tdl["style"]["height"] = 20;
        tdl["text"]["fallbackText"] = "";

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
