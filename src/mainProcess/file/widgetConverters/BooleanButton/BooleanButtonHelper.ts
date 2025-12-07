import { GlobalVariables } from "../../../../common/GlobalVariables";
import { BobPropertyConverter } from "../../../windows/DisplayWindow/BobPropertyConverter";
import { type_rules_tdl, BaseWidgetHelper, type_BaseWidget_tdl } from "../BaseWidget/BaseWidgetHelper";
import { EdlConverter } from "../../../windows/DisplayWindow/EdlConverter";
import { v4 as uuidv4 } from "uuid";
import { LEDHelper } from "../LED/LEDHelper";
import { type_LED_tdl } from "../LED/LEDHelper";

export type type_BooleanButton_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
    // itemLabels: string[];
    // itemPictures: string[];
    // itemValues: (number | string | number[] | string[] | undefined)[];
    // itemColors: string[];
};

export class BooleanButtonHelper extends BaseWidgetHelper {
    // override BaseWidget
    static _defaultTdl: type_BooleanButton_tdl = {
        type: "BooleanButton",
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
            backgroundColor: "rgba(210, 210, 210, 1)",
            // angle
            transform: "rotate(0deg)",
            // font
            color: "rgba(0,0,0,1)",
            fontFamily: GlobalVariables.defaultFontFamily,
            fontSize: GlobalVariables.defaultFontSize,
            fontStyle: GlobalVariables.defaultFontStyle,
            fontWeight: GlobalVariables.defaultFontWeight,
            // border, it is different from the "alarmBorder" below
            borderStyle: "solid",
            borderWidth: 0,
            borderColor: "rgba(0, 0, 0, 1)",
            // shows when the widget is selected
            outlineStyle: "none",
            outlineWidth: 1,
            outlineColor: "black",
        },
        text: {
            // the LED indicator or picture position and size
            horizontalAlign: "center",
            verticalAlign: "center",
            // text styles
            wrapWord: false,
            showUnit: false,
            // if we want to use the itemLabels and itemValues from channel
            useChannelItems: false,
            // use picture instead of colors
            usePictures: false,
            showLED: true,
            // which bit to show, -1 means using the channel value
            bit: 0,
            alarmBorder: true,
            // toggle/push and bounce/push no bounce/push inverted and bounce/push inverted no bounce
            mode: "toggle",
            // when the channel is not connected
            fallbackColor: "rgba(255,0,255,1)",
            // becomes not visible in operation mode, but still clickable
            invisibleInOperation: false,
            // items, each category has 2 items
            onLabel: "On",
            offLabel: "Off",
            onValue: 1,
            offValue: 0,
            onColor: "rgba(60, 255, 60, 1)",
            offColor: "rgba(60, 100, 60, 1)",
            onPicture: "",
            offPicture: "",
            // "contemporary" | "traditional"
            appearance: "traditional",
            confirmOnWrite: false,
            confirmOnWriteUsePassword: false,
            confirmOnWritePassword: "",
        },
        channelNames: [],
        groupNames: [],
        rules: [],
        // itemLabels: ["Off", "On"],
        // itemValues: [0, 1],
        // itemPictures: ["", ""],
        // itemColors: ["rgba(60, 100, 60, 1)", "rgba(60, 255, 60, 1)"],
    };

    // override
    static generateDefaultTdl = (type: string): type_BooleanButton_tdl => {
        // defines type, widgetKey, and key
        const result = super.generateDefaultTdl(type) as type_BooleanButton_tdl;
        result.style = JSON.parse(JSON.stringify(this._defaultTdl.style));
        result.text = JSON.parse(JSON.stringify(this._defaultTdl.text));
        result.channelNames = JSON.parse(JSON.stringify(this._defaultTdl.channelNames));
        result.groupNames = JSON.parse(JSON.stringify(this._defaultTdl.groupNames));
        // result.itemLabels = JSON.parse(JSON.stringify(this._defaultTdl.itemLabels));
        // result.itemValues = JSON.parse(JSON.stringify(this._defaultTdl.itemValues));
        // result.itemPictures = JSON.parse(JSON.stringify(this._defaultTdl.itemPictures));
        // result.itemColors = JSON.parse(JSON.stringify(this._defaultTdl.itemColors));

        return result;
    };

    static convertEdlToTdl = (edl: Record<string, any>, type: "Button" | "Message Button"): type_BooleanButton_tdl => {
        console.log("\n------------", `Parsing "Button" or "Message Button"`, "------------------\n");
        const tdl = this.generateDefaultTdl("BooleanButton") as type_BooleanButton_tdl;
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


        // default differences
        tdl["text"]["showLED"] = false;
        tdl["text"]["verticalAlign"] = "center";
        tdl["text"]["wrapWord"] = false;
        tdl["text"]["alarmBorder"] = false;

        if (type === "Button") {
            tdl["text"]["useChannelItems"] = false;
        } else if (type === "Message Button") {
            tdl["text"]["useChannelItems"] = false;
            tdl["text"]["bit"] = -1;
        }
        tdl["text"]["onLabel"] = "";
        tdl["text"]["offLabel"] = "";
        tdl["text"]["appearance"] = "traditional";
        // tdl["itemLabels"] = ["0", "1"];

        if (type === "Button") {
            tdl["text"]["mode"] = "toggle";
        } else {
            tdl["text"]["mode"] = "push and reset";
        }

        const alarmPropertyNames: string[] = [];

        let hasPressValue = false;
        let hasReleaseValue = false;

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
                } else if (propertyName === "fgColor") {
                    tdl["style"]["color"] = EdlConverter.convertEdlColor(propertyValue, EdlConverter.convertEdlPv(edl["colorPv"]), "Text Color", tdl);
                } else if (propertyName === "inconsistentColor") {
                    tdl["text"]["fallbackColor"] = EdlConverter.convertEdlColor(propertyValue);
                } else if (propertyName === "onColor") {
                    // tdl["itemColors"][1] = EdlConverter.convertEdlColor(propertyValue);
                    tdl["text"]["onColor"] = EdlConverter.convertEdlColor(propertyValue, EdlConverter.convertEdlPv(edl["colorPv"]), "On Color", tdl);
                } else if (propertyName === "offColor") {
                    tdl["text"]["offColor"] = EdlConverter.convertEdlColor(
                        propertyValue,
                        EdlConverter.convertEdlPv(edl["colorPv"]),
                        "Off Color",
                        tdl
                    );
                    // tdl["itemColors"][0] = EdlConverter.convertEdlColor(propertyValue);
                } else if (propertyName === "onLabel") {
                    if (edl["labelType"]?.replaceAll(`"`, "") === "literal" && type === "Button") {
                        tdl["text"]["onLabel"] = propertyValue.replaceAll(`"`, "");
                    } else if (edl["labelType"] === undefined && type === "Button") {
                        tdl["text"]["onLabel"] = propertyValue.replaceAll(`"`, "");
                        tdl["text"]["useChannelItems"] = true;
                    } else if (type === "Message Button") {
                        tdl["text"]["onLabel"] = propertyValue.replaceAll(`"`, "");
                    }
                } else if (propertyName === "offLabel") {
                    if (edl["labelType"]?.replaceAll(`"`, "") === "literal" && type === "Button") {
                        tdl["text"]["offLabel"] = propertyValue.replaceAll(`"`, "");
                    } else if (edl["labelType"] === undefined && type === "Button") {
                        tdl["text"]["offLabel"] = propertyValue.replaceAll(`"`, "");
                        tdl["text"]["useChannelItems"] = true;
                    } else if (type === "Message Button") {
                        tdl["text"]["offLabel"] = propertyValue.replaceAll(`"`, "");
                    }
                } else if (propertyName === "labelType") {
                    tdl["text"]["useChannelItems"] = edl["labelType"]?.replaceAll(`"`, "") === "literal" ? false : true;
                    // } else if (propertyName === "onLabel" && type === "Message Button") {
                    //     tdl["text"]["onLabel"] = propertyValue.replaceAll(`"`, "");
                    // } else if (propertyName === "offLabel" && type === "Message Button") {
                    //     tdl["text"]["offLabel"] = propertyValue.replaceAll(`"`, "");
                } else if (propertyName === "controlPv") {
                    tdl["channelNames"].push(EdlConverter.convertEdlPv(propertyValue, true, true));
                } else if (propertyName === "font") {
                    const { fontFamily, fontWeight, fontSize, fontStyle } = EdlConverter.convertEdlFont(propertyValue);
                    tdl["style"]["fontFamily"] = fontFamily;
                    tdl["style"]["fontStyle"] = fontStyle;
                    tdl["style"]["fontSize"] = fontSize;
                    tdl["style"]["fontWeight"] = fontWeight;
                } else if (propertyName === "buttonType") {
                    // exists in EDM Button widget
                    tdl["text"]["mode"] = propertyValue.replaceAll(`"`, "") === "push" ? "push and reset" : "toggle";
                } else if (propertyName === "toggle") {
                    // exists in EDM "Message Button" widget
                    // if the "toggle" does not exist, then the tdm mode depends on the press and release values
                    //  - if press value is valid, then it is "push and xxx"
                    //  - if press value is invalid, then it is "push nothing and xxx"
                    //  - if release value is valid, then it is "xxx and (re)set"
                    //  - if release value is invalid, then it is "xxx and no reset"
                    tdl["text"]["mode"] = "toggle";
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
                } else if (propertyName === "pressValue") {
                    hasPressValue = true;
                    tdl["text"]["onValue"] = parseFloat(propertyValue.replaceAll(`"`, ""));
                } else if (propertyName === "releaseValue") {
                    hasReleaseValue = true;
                    tdl["text"]["offValue"] = parseFloat(propertyValue.replaceAll(`"`, ""));
                } else if (propertyName === "invisible") {
                    const newRules = EdlConverter.convertEdlInvisible(propertyValue) as type_rules_tdl;
                    tdl["rules"].push(...newRules);
                } else {
                    console.log("Skip property", `"${propertyName}"`);
                }
            }
        }

        if (edl["labelType"] === undefined && type === "Button") {
            tdl["text"]["useChannelItems"] = true;
        }

        if (type === "Message Button" && tdl["text"]["mode"] === "push and reset") {
            const onValue = tdl["text"]["onValue"];
            const offValue = tdl["text"]["offValue"];
            if (hasPressValue) {
                if (hasReleaseValue) {
                    tdl["text"]["mode"] = "push and reset";
                } else {
                    tdl["text"]["mode"] = "push no reset";
                }
            } else {
                if (hasReleaseValue) {
                    tdl["text"]["mode"] = "push nothing and set";
                } else {
                    // wrong thing
                }
            }
        }
        // if (type === "Message Button" && tdl["text"]["mode"] === "push and reset") {
        //     const onValue = tdl["text"]["onValue"];
        //     const offValue = tdl["text"]["offValue"];
        //     if (isNaN(onValue)) {
        //         if (isNaN(offValue)) {
        //             // do nothing
        //         } else {
        //             tdl["text"]["mode"] = "push nothing and set";
        //         }
        //     } else {
        //         if (isNaN(offValue)) {
        //             tdl["text"]["mode"] = "push no reset";
        //         } else {
        //             tdl["text"]["mode"] = "push and reset";
        //         }
        //     }
        // }

        for (let alarmPropertyName of alarmPropertyNames) {
            // only for Button, not for "Message Button"
            if (alarmPropertyName === "fgAlarm") {
                // if the fgAlarm === "true", the text color becomes green if there is no additional rule
                // we are not going to change the tdl["tyle"]["color"], instead, we add a rule
                // so that in editing mode, we still have the default color
                tdl["rules"].push({
                    boolExpression: `true`,
                    propertyName: "Text Color",
                    propertyValue: "rgba(0,255,0,1)",
                    id: uuidv4(),
                });
                const newRules = EdlConverter.convertEdlFgAlarm(EdlConverter.convertEdlPv(edl["controlPv"]), 1) as type_rules_tdl;
                tdl["rules"].push(...newRules);
            } else {
                console.log("Skip alarm-sensitive property", alarmPropertyName);
            }
        }

        // if alarmPv exists in edl setting, but its value is not available in operation, the widget becomes invisible
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
        // if controlPv exists in edl setting, but its value is not available in operation, the widget becomes invisible
        // These behaviors override the alarm-sensitive
        // this behavior is only for Button, not for "Message Button"
        if (edl["controlPv"] !== undefined && type === "Button") {
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
        if (edl["controlPv"] !== undefined && type === "Message Button") {
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

    static convertBobToTdl = (bobWidgetJson: Record<string, any>): type_BooleanButton_tdl => {
        console.log("\n------------", `Parsing "bool_button"`, "------------------\n");
        const tdl = this.generateDefaultTdl("BooleanButton") as type_BooleanButton_tdl;
        // all properties for this widget
        const propertyNames: string[] = [
            "type", // not in tdm
            "name", // not in tdm
            "x",
            "y",
            "width",
            "height",
            "actions", // not in tdm
            "rules",
            "scripts", // not in tdm
            "visible",
            "tooltip", // not in tdm
            "class", // not in tdm
            "macros", // not in tdm
            "pv_name",
            "border_alarm_sensitive",
            "bit",
            "off_label",
            "off_color",
            "off_image",
            "on_label",
            "on_color",
            "on_image",
            "show_led",
            "font",
            "foreground_color",
            "background_color",
            "labels_from_pv",
            "enabled", // not in tdm
            "mode",
            "horizontal_alignment",
            "vertical_alignment",
            "confirm_dialog", // not in tdm
            "confirm_message", // not in tdm
            "password", // not in tdm
        ];

        let offImage = "";
        let onImage = "";

        tdl["style"]["left"] = 0;
        tdl["style"]["top"] = 0;
        tdl["style"]["width"] = 100;
        tdl["style"]["height"] = 30;
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
                } else if (propertyName === "bit") {
                    tdl["text"]["bit"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "off_label") {
                    tdl["text"]["offLabel"] = BobPropertyConverter.convertBobString(propertyValue);
                } else if (propertyName === "off_image") {
                    offImage = BobPropertyConverter.convertBobString(propertyValue);
                } else if (propertyName === "off_color") {
                    tdl["text"]["offColor"] = BobPropertyConverter.convertBobColor(propertyValue);
                } else if (propertyName === "on_label") {
                    tdl["text"]["onLabel"] = BobPropertyConverter.convertBobString(propertyValue);
                } else if (propertyName === "on_image") {
                    onImage = BobPropertyConverter.convertBobString(propertyValue);
                } else if (propertyName === "on_color") {
                    tdl["text"]["onColor"] = BobPropertyConverter.convertBobColor(propertyValue);
                } else if (propertyName === "show_led") {
                    tdl["text"]["showLED"] = BobPropertyConverter.convertBobBoolean(propertyValue);
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
                } else if (propertyName === "labels_from_pv") {
                    tdl["text"]["useChannelItems"] = BobPropertyConverter.convertBobColor(propertyValue);
                } else if (propertyName === "mode") {
                    tdl["text"]["mode"] = BobPropertyConverter.convertBobBoolenButtonMode(propertyValue);
                } else if (propertyName === "horizontal_alignment") {
                    tdl["text"]["horizontalAlign"] = BobPropertyConverter.convertBobAlignment(propertyValue);
                } else if (propertyName === "vertical_alignment") {
                    tdl["text"]["verticalAlign"] = BobPropertyConverter.convertBobAlignment(propertyValue);
                } else {
                    console.log("Skip property", `"${propertyName}"`);
                }
            }
        }

        if (tdl["text"]["mode"] === "push and reset (inverted)") {
            tdl["text"]["mode"] = "push and reset";
            tdl["text"]["onValue"] = 0;
            tdl["text"]["offValue"] = 1;
        }

        if (offImage !== "" && onImage !== "") {
            tdl["text"]["offLabel"] = offImage;
            tdl["text"]["onLabel"] = onImage;
            tdl["text"]["usePictures"] = true;
        }
        return tdl;
    };
}
