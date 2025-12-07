import { GlobalVariables } from "../../global/GlobalVariables";
import { BobPropertyConverter } from "../../../mainProcess/windows/DisplayWindow/BobPropertyConverter";
import { type_rules_tdl, BaseWidgetHelper, type_BaseWidget_tdl } from "../BaseWidget/BaseWidgetHelper";
import * as GlobalMethods from "../../../common/GlobalMethods";
import { rgbaArrayToRgbaStr, rgbaStrToRgbaArray } from "../../../common/GlobalMethods";
import { EdlConverter } from "../../../mainProcess/windows/DisplayWindow/EdlConverter";
import { v4 as uuidv4 } from "uuid";

export type type_SlideButton_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
    itemLabels: string[];
    itemValues: number[];
    itemColors: string[];
};

export class SlideButtonHelper extends BaseWidgetHelper {


    // override BaseWidget
    static _defaultTdl: type_SlideButton_tdl = {
        type: "SlideButton",
        widgetKey: "", // "key" is a reserved keyword
        key: "",
        // the style for outmost div
        // these properties are explicitly defined in style because they are
        // (1) different from default CSS settings, or
        // (2) they may be modified
        style: {
            position: "absolute",
            display: "inline-flex",
            backgroundColor: "rgba(128, 255, 255, 0)",
            left: 100,
            top: 100,
            width: 150,
            height: 80,
            outlineStyle: "none",
            outlineWidth: 1,
            outlineColor: "black",
            transform: "rotate(0deg)",
            color: "rgba(0,0,0,1)",
            borderStyle: "solid",
            borderWidth: 0,
            borderColor: "rgba(255, 0, 0, 1)",
            fontFamily: GlobalVariables.defaultFontFamily,
            fontSize: GlobalVariables.defaultFontSize,
            fontStyle: GlobalVariables.defaultFontStyle,
            fontWeight: GlobalVariables.defaultFontWeight,
        },
        // the ElementBody style
        text: {
            horizontalAlign: "flex-start",
            verticalAlign: "flex-start",
            wrapWord: false,
            showUnit: false,
            alarmBorder: true,
            selectedBackgroundColor: "rgba(100, 100, 100, 1)",
            unselectedBackgroundColor: "rgba(200, 200, 200, 1)",
            useChannelItems: true,
            bit: 0,
            boxWidth: 100,
            boxRatio: 3,
            text: "Label",
            fallbackColor: "rgba(255,0,255,1)",
            invisibleInOperation: false,
            confirmOnWrite: false,
            confirmOnWriteUsePassword: false,
            confirmOnWritePassword: "",
        },
        channelNames: [],
        groupNames: [],
        rules: [],
        itemLabels: ["False", "True"],
        itemValues: [0, 1],
        itemColors: ["rgba(210, 210, 210, 1)", "rgba(0, 255, 0, 1)"],
    };

    // override
    static generateDefaultTdl = (type: string) => {
        // defines type, widgetKey, and key
        const result = super.generateDefaultTdl(type);
        result.style = JSON.parse(JSON.stringify(this._defaultTdl.style));
        result.text = JSON.parse(JSON.stringify(this._defaultTdl.text));
        result.channelNames = JSON.parse(JSON.stringify(this._defaultTdl.channelNames));
        result.groupNames = JSON.parse(JSON.stringify(this._defaultTdl.groupNames));
        result.itemLabels = JSON.parse(JSON.stringify(this._defaultTdl.itemLabels));
        result.itemValues = JSON.parse(JSON.stringify(this._defaultTdl.itemValues));
        result.itemColors = JSON.parse(JSON.stringify(this._defaultTdl.itemColors));
        return result as type_SlideButton_tdl;
    };


    static convertBobToTdl = (bobWidgetJson: Record<string, any>): type_SlideButton_tdl => {
        console.log("\n------------", `Parsing "slide_button"`, "------------------\n");
        const tdl = this.generateDefaultTdl("SlideButton") as type_SlideButton_tdl;
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
            "bit",
            "label",
            "off_color",
            "on_color",
            "font",
            "foreground_color",
            "auto_size", // not in tdm
            "enabled", // not in tdm
            "confirm_dialog", // not in tdm
            "confirm_message", // not in tdm
            "password", // not in tdm
        ];

        tdl["style"]["x"] = 0;
        tdl["style"]["y"] = 0;
        tdl["style"]["width"] = 100;
        tdl["style"]["height"] = 30;
        tdl["text"]["useChannelItems"] = false;

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
                } else if (propertyName === "label") {
                    tdl["text"]["text"] = BobPropertyConverter.convertBobString(propertyValue);
                } else if (propertyName === "on_color") {
                    tdl["text"]["selectedBackgroundColor"] = BobPropertyConverter.convertBobColor(propertyValue);
                } else if (propertyName === "off_color") {
                    tdl["text"]["unselectedBackgroundColor"] = BobPropertyConverter.convertBobColor(propertyValue);
                } else if (propertyName === "font") {
                    const data = BobPropertyConverter.convertBobFont(propertyValue);
                    tdl["style"]["fontSize"] = data["fontSize"];
                    tdl["style"]["fontFamily"] = data["fontFamily"];
                    tdl["style"]["fontStyle"] = data["fontStyle"];
                    tdl["style"]["fontWeight"] = data["fontWeight"];
                } else if (propertyName === "foreground_color") {
                    tdl["style"]["color"] = BobPropertyConverter.convertBobColor(propertyValue);
                } else {
                    console.log("Skip property", `"${propertyName}"`);
                }
            }
        }

        return tdl;
    };
}
