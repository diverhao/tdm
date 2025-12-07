import { GlobalVariables } from "../../../common/GlobalVariables";
import { BobPropertyConverter } from "../../../mainProcess/windows/DisplayWindow/BobPropertyConverter";
import { type_rules_tdl, BaseWidgetHelper } from "../BaseWidget/BaseWidgetHelper";
import * as GlobalMethods from "../../../common/GlobalMethods";
import { rgbaArrayToRgbaStr, rgbaStrToRgbaArray } from "../../../common/GlobalMethods";
import { EdlConverter } from "../../../mainProcess/windows/DisplayWindow/EdlConverter";
import { v4 as uuidv4 } from "uuid";

export type type_Tank_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
};

export class TankHelper extends BaseWidgetHelper {
    static _defaultTdl: type_Tank_tdl = {
        type: "Tank",
        widgetKey: "", // "key" is a reserved keyword
        key: "",
        style: {
            // basics
            position: "absolute",
            display: "inline-flex",
            // dimensions
            left: 100,
            top: 100,
            width: 100,
            height: 100,
            backgroundColor: "rgba(240, 240, 240, 1)",
            // angle
            transform: "rotate(0deg)",
            // border
            borderStyle: "solid",
            borderWidth: 0,
            borderColor: "rgba(0, 0, 0, 1)",
            // font
            color: "rgba(0,0,0,1)",
            fontFamily: GlobalVariables.defaultFontFamily,
            fontSize: GlobalVariables.defaultFontSize,
            fontStyle: GlobalVariables.defaultFontStyle,
            fontWeight: GlobalVariables.defaultFontWeight,
            // outline
            outlineStyle: "none",
            outlineWidth: 1,
            outlineColor: "black",
        },
        text: {
            // showUnit: true,
            // channel
            // showPvValue: true,
            usePvLimits: false,
            minPvValue: 0,
            maxPvValue: 100,
            useLogScale: false,
            // tank and water colors
            fillColor: "rgba(0,200,0,1)",
            // fillColorMinor: "rgba(255, 150, 100, 1)",
            // fillColorMajor: "rgba(255,0,0,1)",
            // fillColorInvalid: "rgba(200,0,200,1)",
            containerColor: "rgba(210,210,210,1)",
            // layout
            // direction: "vertical",
            // dialPercentage: 75,
            // labelPositionPercentage: 15,
            // tick config
            showLabels: true,
            // dialFontColor: "rgba(0,0,255,1)",
            // dialFontFamily: "Liberation Sans",
            // dialFontSize: 14,
            // dialFontStyle: "normal",
            // dialFontWeight: "normal",
            invisibleInOperation: false,
            // decimal, exponential, hexadecimal
            format: "default",
            // scale, >= 0
            // scale: 0,
            numTickIntervals: 5,
            compactScale: false,
            // "left" | "right"
            scalePosition: "right",
            // show inner labels
            showScaleInnerLabel: true,
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
    static generateDefaultTdl = (type: string): type_Tank_tdl => {
        const result = super.generateDefaultTdl(type) as type_Tank_tdl;
        result.style = JSON.parse(JSON.stringify(this._defaultTdl.style));
        result.text = JSON.parse(JSON.stringify(this._defaultTdl.text));
        result.channelNames = JSON.parse(JSON.stringify(this._defaultTdl.channelNames));
        result.groupNames = JSON.parse(JSON.stringify(this._defaultTdl.groupNames));
        return result;
    };

    static convertEdlToTdl = (edl: Record<string, string>): type_Tank_tdl => {
        const tdl = this.generateDefaultTdl("Tank") as type_Tank_tdl;
        // all properties for this widget
        console.log("edl ===", edl)
        const propertyNames: string[] = [
            "beginObjectProperties", // not in tdm
            "major", // not in tdm
            "minor", // not in tdm
            "release", // not in tdm
            "x",
            "y",
            "w",
            "h",
            "indicatorColor",
            "fgColor",
            "fgAlarm",
            "bgColor",
            "indicatorPv",
            "label", // ! not in tdm
            "showScale",
            "limitsFromDb",
            "origin", // not in tdm
            "font",
            "indicatorAlarm", // bar color sensitive to alarm
            "labelTicks",
            "majorTicks", // ! not in tdm, "Majors per Label"
            "minorTicks", // ! not in tdm, "Minors per Label"
            "border",
            "precision", // ! not in tdm
            "min",
            "max",
            "scaleFormat", // ! not in tdm
            "orientation",
            "nullPv", // ! not in tdm, if it is defined, but cannot connect, the widget is invisible,
            // ! not sure if there are more behaviors
            "endObjectProperties", // not in tdm
        ];

        // default differences
        // tdl["text"]["verticalAlign"] = "center";
        // tdl["text"]["wrapWord"] = false;
        // tdl["text"]["alarmBorder"] = false;
        // tdl["text"]["showUnit"] = true;
        // tdl["text"]["direction"] = "horizontal";
        tdl["text"]["fillColor"] = "rgba(0,0,255,1)";
        // tdl["text"]["direction"] = "horizontal";
        // tdl["style"]["borderWidth"] = 1;
        // tdl["text"]["dialPercentage"] = 100;
        // tdl["text"]["showPvValue"] = false;
        tdl["text"]["usePvLimits"] = false;
        tdl["text"]["alarmBorder"] = false;
        tdl["text"]["showLabels"] = false;
        tdl["style"]["transform"] = "rotate(90deg)";
        tdl["text"]["showScaleInnerLabel"] = false;


        const alarmPropertyNames: string[] = [];

        for (const propertyName of propertyNames) {
            const propertyValue = edl[propertyName];
            if (propertyValue === undefined) {
                console.log("Property", `"${propertyName}"`, "is not in edl file");
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
                } else if (propertyName === "indicatorColor") {
                    tdl["text"]["fillColor"] = EdlConverter.convertEdlColor(propertyValue);
                    tdl["text"]["fillColorMinor"] = tdl["text"]["fillColor"];
                    tdl["text"]["fillColorMajor"] = tdl["text"]["fillColor"];
                } else if (propertyName === "indicatorAlarm") {
                    tdl["text"]["alarmFill"] = true;
                } else if (propertyName === "fgColor") {
                    tdl["style"]["color"] = EdlConverter.convertEdlColor(propertyValue);
                    tdl["style"]["borderColor"] = EdlConverter.convertEdlColor(propertyValue);
                } else if (propertyName === "fgAlarm") {
                    alarmPropertyNames.push(propertyName);
                } else if (propertyName === "bgColor") {
                    tdl["text"]["containerColor"] = EdlConverter.convertEdlColor(propertyValue);
                    tdl["style"]["backgroundColor"] = EdlConverter.convertEdlColor(propertyValue);
                } else if (propertyName === "indicatorPv") {
                    tdl["channelNames"].push(EdlConverter.convertEdlPv(propertyValue, true, true));
                } else if (propertyName === "showScale") {
                    tdl["text"]["showLabels"] = EdlConverter.convertEdlBoolean(propertyValue);
                } else if (propertyName === "limitsFromDb") {
                    tdl["text"]["usePvLimits"] = EdlConverter.convertEdlBoolean(propertyValue);
                } else if (propertyName === "font") {
                    const { fontFamily, fontWeight, fontSize, fontStyle } = EdlConverter.convertEdlFont(propertyValue);
                    tdl["style"]["fontFamily"] = fontFamily;
                    tdl["style"]["fontStyle"] = fontStyle;
                    tdl["style"]["fontSize"] = fontSize;
                    tdl["style"]["fontWeight"] = fontWeight;
                    // tdl["text"]["dialFontFamily"] = fontFamily;
                    // tdl["text"]["dialFontStyle"] = fontStyle;
                    // tdl["text"]["dialFontSize"] = fontSize;
                    // tdl["text"]["dialFontWeight"] = fontWeight;
                } else if (propertyName === "border") {
                    tdl["style"]["borderWidth"] = 1;
                } else if (propertyName === "labelTicks") {
                    tdl["text"]["numTickIntervals"] = EdlConverter.convertEdlNumber(propertyValue);
                } else if (propertyName === "min") {
                    tdl["text"]["minPvValue"] = EdlConverter.convertEdlNumber(propertyValue);
                } else if (propertyName === "max") {
                    tdl["text"]["maxPvValue"] = EdlConverter.convertEdlNumber(propertyValue);
                } else if (propertyName === "orientation") {
                    if (propertyValue.includes("vertical")) {
                        tdl["style"]["transform"] = "rotate(0deg)";
                    } else {
                        tdl["style"]["transform"] = "rotate(90deg)";
                    }
                } else {
                    console.log("Skip property", `"${propertyName}"`);
                }
            }
        }
        // bar is vertical, Tanks is rotated 0 degree
        if (tdl["style"]["transform"] === "rotate(0deg)") {
            tdl["text"]["scalePosition"] = "left";
        } else {
            // bar is horizontal, tak rotates 90 degree
            tdl["text"]["scalePosition"] = "right";
            const xe = tdl["style"]["left"];
            const ye = tdl["style"]["top"];
            const we = tdl["style"]["width"];
            const he = tdl["style"]["height"];
            const ht = we;
            const wt = he;
            const xt = xe + (ht - wt) / 2;
            const yt = ye + (wt - ht) / 2;
            tdl["style"]["left"] = xt;
            tdl["style"]["top"] = yt;
            tdl["style"]["width"] = wt;
            tdl["style"]["height"] = ht;
        }

        // all alarm-sensitive rules override others
        for (let alarmPropertyName of alarmPropertyNames) {
            if (alarmPropertyName === "indicatorAlarm") {
                // const newRules = EdlConverter.convertEdlColorAlarm(EdlConverter.convertEdlPv(edl["indicatorPv"]), 1, "Water Color") as type_rules_tdl;
                // tdl["rules"].push(...newRules);
                tdl["text"]["fillColor"] = "rgba(0,200,0,1)";
                tdl["text"]["fillColorMinor"] = "rgba(255,255,0,1)";
                tdl["text"]["fillColorMajor"] = "rgba(255,0,0,1)";
            } else if (alarmPropertyName === "fgAlarm") {
                const newRules_Labels = EdlConverter.convertEdlColorAlarm(EdlConverter.convertEdlPv(edl["indicatorPv"]), 1, "Dial Font Color") as type_rules_tdl;
                tdl["rules"].push(...newRules_Labels);
                const newRules_border = EdlConverter.convertEdlColorAlarm(EdlConverter.convertEdlPv(edl["indicatorPv"]), 1, "Border Color") as type_rules_tdl;
                tdl["rules"].push(...newRules_border);
            } else {
                console.log("Skip alarm-sensitive property", alarmPropertyName);
            }
        }

        if (edl["indicatorPv"] === undefined) {
            // if indicatorPv does not exist, the widget becomes invisible
            tdl["rules"].push({
                boolExpression: `true`,
                propertyName: "Invisible in Operation",
                propertyValue: "true",
                id: uuidv4(),
            });
        } else if (edl["indicatorPv"] !== undefined) {
            // if indicatorPv exists, but the value is undefined, the widget becomes invisible
            tdl["rules"].push({
                boolExpression: EdlConverter.generatePvUndefinedExpression(edl["indicatorPv"]),
                propertyName: "Invisible in Operation",
                propertyValue: "true",
                id: uuidv4(),
            });
        }

        if (edl["nullPv"] !== undefined) {
            // if indicatorPv exists, but the value is undefined, the widget becomes invisible
            tdl["rules"].push({
                boolExpression: EdlConverter.generatePvUndefinedExpression(edl["nullPv"]),
                propertyName: "Invisible in Operation",
                propertyValue: "true",
                id: uuidv4(),
            });
        }
        return tdl;
    };


    static convertBobToTdl = (bobWidgetJson: Record<string, any>, type: "progressbar" | "tank"): type_Tank_tdl => {
        console.log("\n------------", `Parsing ${type}`, "------------------\n");
        const tdl = this.generateDefaultTdl("Tank");
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
            "fill_color",
            "empty_color",
            "scale_visible",
            "limits_from_pv",
            "minimum",
            "maximum",
            "log_scale",
            "horizontal",
        ];

        let horizontalDirection = false;

        tdl["style"]["left"] = 0;
        tdl["style"]["top"] = 0;
        tdl["text"]["usePvLimits"] = true;
        tdl["text"]["containerColor"] = "rgba(192,192,192,1)";

        if (type === "progressbar") {
            horizontalDirection = true;
            tdl["text"]["fillColor"] = "rgba(60, 255, 60, 1)";
            tdl["style"]["backgroundColor"] = "rgba(250,250,250,1)";
            tdl["style"]["transform"] = "rotate(90deg)";
            tdl["style"]["width"] = 100;
            tdl["style"]["height"] = 20;
            tdl["text"]["showLabels"] = false;
        } else if (type === "tank") {
            tdl["style"]["width"] = 150;
            tdl["style"]["height"] = 200;
            tdl["text"]["fillColor"] = "rgba(0,0,255,1)";
            tdl["style"]["backgroundColor"] = "rgba(240,240,240,1)";
        }

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
                    const font = BobPropertyConverter.convertBobFont(propertyValue);
                    tdl["style"]["fontSize"] = font["fontSize"];
                    tdl["style"]["fontFamily"] = font["fontFamily"];
                    tdl["style"]["fontStyle"] = font["fontStyle"];
                    tdl["style"]["fontWeight"] = font["fontWeight"];
                } else if (propertyName === "background_color") {
                    tdl["style"]["backgroundColor"] = BobPropertyConverter.convertBobColor(propertyValue);
                } else if (propertyName === "foreground_color") {
                    tdl["style"]["color"] = BobPropertyConverter.convertBobColor(propertyValue);
                } else if (propertyName === "fill_color") {
                    tdl["text"]["fillColor"] = BobPropertyConverter.convertBobColor(propertyValue);
                } else if (propertyName === "empty_color") {
                    tdl["text"]["containerColor"] = BobPropertyConverter.convertBobColor(propertyValue);
                } else if (propertyName === "scale_visible") {
                    tdl["text"]["showLabels"] = BobPropertyConverter.convertBobBoolean(propertyValue);
                } else if (propertyName === "limits_from_pv") {
                    tdl["text"]["usePvLimits"] = BobPropertyConverter.convertBobBoolean(propertyValue);
                } else if (propertyName === "maximum") {
                    tdl["text"]["maxPvValue"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "minimum") {
                    tdl["text"]["minPvValue"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "log_scale") {
                    const useLogScale = BobPropertyConverter.convertBobBoolean(propertyValue);
                    tdl["text"]["displayScale"] = useLogScale === true ? "Log10" : "Linear";
                } else if (propertyName === "horizontal") {
                    horizontalDirection = BobPropertyConverter.convertBobBoolean(propertyValue);
                    tdl["style"]["transform"] = horizontalDirection === true ? "rotate(90deg)" : "rotate(0deg)";
                } else {
                    console.log("Skip property", `"${propertyName}"`);
                }
            }
        }

        if (horizontalDirection === true) {
            // modify the x, y, width and height

            const x = tdl["style"]["left"];
            const y = tdl["style"]["top"];
            const w = tdl["style"]["width"];
            const h = tdl["style"]["height"];

            tdl["style"]["width"] = h
            tdl["style"]["height"] = w;
            tdl["style"]["left"] = x + (w - h) / 2;
            tdl["style"]["top"] = y - (w - h) / 2;
        }

        return tdl;
    };
}
