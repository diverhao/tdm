import { GlobalVariables } from "../../../common/GlobalVariables";
import { BobPropertyConverter } from "../../../mainProcess/windows/DisplayWindow/BobPropertyConverter";
import { type_rules_tdl, BaseWidgetHelper } from "../BaseWidget/BaseWidgetHelper";
import { EdlConverter } from "../../../mainProcess/windows/DisplayWindow/EdlConverter";
import { v4 as uuidv4 } from "uuid";


export type type_Symbol_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
    itemNames: string[];
    itemValues: (number | string | number[] | string[] | undefined)[];
};

export class SymbolHelper extends BaseWidgetHelper {


    // properties when we create a new TextUpdate
    // the level 1 properties all have corresponding public or private variable in the widget
    static _defaultTdl: type_Symbol_tdl = {
        type: "Symbol",
        widgetKey: "", // "key" is a reserved keyword
        key: "",
        // the style for outmost div
        // these properties are explicitly defined in style because they are
        // (1) different from default CSS settings, or
        // (2) they may be modified
        style: {
            position: "absolute",
            display: "inline-flex",
            backgroundColor: "rgba(240, 240, 240, 0.2)",
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
            fileName: "../../../webpack/resources/webpages/tdm-logo.svg",
            opacity: 1,
            stretchToFit: false,
            showPvValue: false,
            invisibleInOperation: false,
            alarmBorder: true,
            alarmBackground: false,
            alarmLevel: "MINOR",
        },
        channelNames: [],
        groupNames: [],
        rules: [],
        itemNames: [],
        itemValues: [],
    };

    // not getDefaultTdl(), always generate a new key
    static generateDefaultTdl = (type: string): type_Symbol_tdl => {
        // defines type, widgetKey, and key
        const result = super.generateDefaultTdl(type);
        result.style = JSON.parse(JSON.stringify(this._defaultTdl.style));
        result.text = JSON.parse(JSON.stringify(this._defaultTdl.text));
        result.channelNames = JSON.parse(JSON.stringify(this._defaultTdl.channelNames));
        result.groupNames = JSON.parse(JSON.stringify(this._defaultTdl.groupNames));
        result.itemNames = JSON.parse(JSON.stringify(this._defaultTdl.itemNames));
        result.itemValues = JSON.parse(JSON.stringify(this._defaultTdl.itemValues));
        return result as type_Symbol_tdl;
    };



    static convertBobToTdl = (bobWidgetJson: Record<string, any>): type_Symbol_tdl => {
        console.log("\n------------", `Parsing symbol`, "------------------\n");
        const tdl = this.generateDefaultTdl("Symbol");
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
            "symbols",
            "background_color",
            "initial_index", // not in tdm
            "rotation",
            "show_index",
            "transparent",
            "disconnect_overlay_color", // not in tdm
            "array_index",
            "auto_size", // not in tdm
            "enabled", // not in tdm
            "preserve_ratio",
            "fallback_symbol",
        ];

        let isTransparent = false;

        tdl["style"]["left"] = 0;
        tdl["style"]["top"] = 0;
        tdl["style"]["width"] = 100;
        tdl["style"]["height"] = 100;

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
                } else if (propertyName === "symbols") {
                    tdl["itemNames"] = BobPropertyConverter.convertBobStrings(propertyValue, "symbol");
                } else if (propertyName === "background_color") {
                    tdl["style"]["backgroundColor"] = BobPropertyConverter.convertBobColor(propertyValue);
                } else if (propertyName === "rotation") {
                    tdl["style"]["transform"] = BobPropertyConverter.convertBobAngleNum(propertyValue);
                } else if (propertyName === "preserve_ratio") {
                    tdl["text"]["stretchToFit"] = !BobPropertyConverter.convertBobBoolean(propertyValue);
                } else if (propertyName === "fallback_symbol") {
                    tdl["text"]["fileName"] = BobPropertyConverter.convertBobString(propertyValue);
                } else if (propertyName === "show_index") {
                    tdl["text"]["showPvValue"] = BobPropertyConverter.convertBobBoolean(propertyValue);
                } else if (propertyName === "transparent") {
                    isTransparent = BobPropertyConverter.convertBobBoolean(propertyValue);
                } else {
                    console.log("Skip property", `"${propertyName}"`);
                }
            }

        }

        for (let ii = 0; ii < tdl["itemNames"].length; ii++) {
            tdl["itemValues"].push(ii);
        }

        if (isTransparent) {
            const originalRgbaColor = tdl["style"]["backgroundColor"];
            const rgbaColorArray = originalRgbaColor.split(",");
            rgbaColorArray[3] = "0)";
            tdl["style"]["backgroundColor"] = rgbaColorArray.join(",");
        }

        return tdl;
    };
}
