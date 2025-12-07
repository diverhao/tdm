import { BobPropertyConverter } from "../../../mainProcess/windows/DisplayWindow/BobPropertyConverter";
import { type_rules_tdl, BaseWidgetHelper } from "../BaseWidget/BaseWidgetHelper";
import * as GlobalMethods from "../../../common/GlobalMethods";
import { rgbaArrayToRgbaStr, rgbaStrToRgbaArray } from "../../../common/GlobalMethods";
import { EdlConverter } from "../../../mainProcess/windows/DisplayWindow/EdlConverter";
import { v4 as uuidv4 } from "uuid";
import { GlobalVariables } from "../../../common/GlobalVariables";


export type type_Thermometer_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
};


export class ThermometerHelper extends BaseWidgetHelper {

    // properties when we create a new TextUpdate
    // the level 1 properties all have corresponding public or private variable in the widget
    static _defaultTdl: type_Thermometer_tdl = {
        type: "Thermometer",
        widgetKey: "", // "key" is a reserved keyword
        key: "",
        // the style for outmost div
        // these properties are explicitly defined in style because they are
        // (1) different from default CSS settings, or
        // (2) they may be modified
        style: {
            position: "absolute",
            display: "inline-flex",
            backgroundColor: "rgba(240, 240, 240, 1)",
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
            wrapWord: false,
            showUnit: true,
            usePvLimits: false,
            minPvValue: 0,
            maxPvValue: 100,
            useLogScale: false,
            fillColor: "rgba(60,255,60,1)",
            // fillColorMinor: "rgba(255, 150, 100, 1)",
            // fillColorMajor: "rgba(255,0,0,1)",
            // fillColorInvalid: "rgba(200,0,200,1)",
            containerColor: "rgba(210,210,210,1)",
            showLabels: true,
            bulbDiameter: 30,
            tubeWidth: 15,
            invisibleInOperation: false,
            // decimal, exponential, hexadecimal
            format: "default",
            // scale, >= 0
            scale: 0,
            numTickIntervals: 5,
            compactScale: false,
            displayScale: "Linear", // "Linear" | "Log10"
            alarmContainer: false,
            alarmFill: false,
            alarmText: false,
            alarmBorder: true,
            alarmBackground: false,
            alarmLevel: "MINOR",
        },
        channelNames: [],
        groupNames: [],
        rules: [],
    };

    // not getDefaultTdl(), always generate a new key
    static generateDefaultTdl = (type: string): type_Thermometer_tdl => {
        const result = super.generateDefaultTdl(type);
        result.style = JSON.parse(JSON.stringify(this._defaultTdl.style));
        result.text = JSON.parse(JSON.stringify(this._defaultTdl.text));
        result.channelNames = JSON.parse(JSON.stringify(this._defaultTdl.channelNames));
        result.groupNames = JSON.parse(JSON.stringify(this._defaultTdl.groupNames));
        return result as type_Thermometer_tdl;
    };

    static convertBobToTdl = (bobWidgetJson: Record<string, any>): type_Thermometer_tdl => {
        console.log("\n------------", `Parsing "thermometer"`, "------------------\n");
        const tdl = this.generateDefaultTdl("Thermometer");
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
            "fill_color",
            "limits_from_pv",
            "minimum",
            "maximum",
        ];

        tdl["text"]["showLabels"] = false;
        tdl["style"]["top"] = 0;
        tdl["style"]["left"] = 0;
        tdl["style"]["width"] = 40;
        tdl["style"]["height"] = 160;
        tdl["text"]["usePvLimits"] = true;

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
                } else if (propertyName === "fill_color") {
                    tdl["text"]["fillColor"] = BobPropertyConverter.convertBobColor(propertyValue);
                } else if (propertyName === "limits_from_pv") {
                    tdl["text"]["usePvLimits"] = BobPropertyConverter.convertBobBoolean(propertyValue);
                } else if (propertyName === "minimum") {
                    tdl["text"]["minPvValue"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "maximum") {
                    tdl["text"]["minPvValue"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else {
                    console.log("Skip property", `"${propertyName}"`);
                }
            }
        }

        return tdl;
    };
}
