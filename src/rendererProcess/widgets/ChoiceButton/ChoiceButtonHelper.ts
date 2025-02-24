import { GlobalVariables } from "../../global/GlobalVariables";
import { BobPropertyConverter } from "../../../mainProcess/windows/DisplayWindow/BobPropertyConverter";
import { type_rules_tdl, BaseWidgetHelper, type_BaseWidget_tdl } from "../BaseWidget/BaseWidgetHelper";
import * as GlobalMethods from "../../global/GlobalMethods";
import { rgbaArrayToRgbaStr, rgbaStrToRgbaArray } from "../../global/GlobalMethods";
import { EdlConverter } from "../../../mainProcess/windows/DisplayWindow/EdlConverter";
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
            display: "inline-block",
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
            "indicatorPv", // ! not in tdm, "Reacback PV"
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
                    tdl["channelNames"].push(EdlConverter.convertEdlPv(propertyValue));
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
                    tdl["style"]["fontSize"] = fontSize * 0.7; // tdm has a lot of margins
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

    // static convertBobToTdl = (bob: Record<string, any>): type_ChoiceButton_tdl => {
    // console.log("\n------------", `Parsing "textentry"`, "------------------\n");
    // const tdl = this.generateDefaultTdl("TextEntry") as type_TextEntry_tdl;
    // // all properties for this widget
    // const propertyNames: string[] = [
    // 	"actions", // not in tdm
    // 	"background_color",
    // 	"border_alarm_sensitive",
    // 	"border_color",
    // 	"border_width",
    // 	"class", // not in tdm
    // 	"enabled", // not in tdm
    // 	"font",
    // 	"foreground_color",
    // 	"format", // not in tdm
    // 	"height",
    // 	"horizontal_alignment",
    // 	"multi_line", // not in tdm
    // 	"name", // not in tdm
    // 	"precision", // not in tdm
    // 	"pv_name",
    // 	"rules", // not in tdm
    // 	"scripts", // not in tdm
    // 	"show_units",
    // 	"tooltip", // not in tdm
    // 	"type", // not in tdm
    // 	"vertical_alignment",
    // 	"visible", // not in tdm
    // 	"width",
    // 	"wrap_words",
    // 	"x",
    // 	"y",
    // ];

    // for (const propertyName of propertyNames) {
    // 	const propertyValue = bob[propertyName];
    // 	if (propertyValue === undefined) {
    // 		if (propertyName === "widget") {
    // 			console.log(`There are one or more widgets inside "display"`);
    // 		} else {
    // 			console.log("Property", `"${propertyName}"`, "is not in bob file");
    // 		}
    // 		continue;
    // 	} else {
    // 		if (propertyName === "x") {
    // 			tdl["style"]["left"] = parseInt(propertyValue);
    // 		} else if (propertyName === "y") {
    // 			tdl["style"]["top"] = parseInt(propertyValue);
    // 		} else if (propertyName === "width") {
    // 			tdl["style"]["width"] = parseInt(propertyValue);
    // 		} else if (propertyName === "height") {
    // 			tdl["style"]["height"] = parseInt(propertyValue);
    // 		} else if (propertyName === "background_color") {
    // 			const rgbaColor = BobPropertyConverter.convertBobColor(propertyValue, undefined);
    // 			tdl["style"]["backgroundColor"] = rgbaColor;
    // 		} else if (propertyName === "border_alarm_sensitive") {
    // 			tdl["text"]["alarmBorder"] = BobPropertyConverter.convertBobBoolean(propertyValue);
    // 		} else if (propertyName === "border_color") {
    // 			const rgbaColor = BobPropertyConverter.convertBobColor(propertyValue, undefined);
    // 			tdl["style"]["borderColor"] = rgbaColor;
    // 		} else if (propertyName === "border_width") {
    // 			tdl["style"]["borderWidth"] = parseInt(propertyValue);
    // 		} else if (propertyName === "font") {
    // 			const font = BobPropertyConverter.convertBobFont(propertyValue);
    // 			tdl["style"]["fontSize"] = font["fontSize"];
    // 			tdl["style"]["fontFamily"] = font["fontFamily"];
    // 			tdl["style"]["fontStyle"] = font["fontStyle"];
    // 			tdl["style"]["fontWeight"] = font["fontWeight"];
    // 		} else if (propertyName === "foreground_color") {
    // 			const rgbaColor = BobPropertyConverter.convertBobColor(propertyValue, undefined);
    // 			tdl["style"]["color"] = rgbaColor;
    // 		} else if (propertyName === "horizontal_alignment") {
    // 			tdl["text"]["horizontalAlign"] = BobPropertyConverter.convertBobHorizontalAlign(propertyValue);
    // 		} else if (propertyName === "vertical_alignment") {
    // 			tdl["text"]["verticalAlign"] = BobPropertyConverter.convertBobHorizontalAlign(propertyValue);
    // 		} else if (propertyName === "pv_name") {
    // 			tdl["channelNames"].push(propertyValue);
    // 		} else if (propertyName === "show_units") {
    // 			tdl["text"]["showUnit"] = BobPropertyConverter.convertBobBoolean(propertyValue);
    // 		} else if (propertyName === "wrap_words") {
    // 			tdl["text"]["wrapWord"] = BobPropertyConverter.convertBobBoolean(propertyValue);
    // 		} else {
    // 			console.log("Skip property", `"${propertyName}"`);
    // 		}
    // 	}
    // }

    // // handle the situation that the "background_color" is not explicitly shown in bob file
    // // while the "transparent" is explicitly shown
    // // default transparent is "false"
    // if (bob["transparent"] === "true") {
    // 	const rgbaArray = GlobalMethods.rgbaStrToRgbaArray(tdl["style"]["backgroundColor"]);
    // 	rgbaArray[3] = 0;
    // 	const rgbaString = GlobalMethods.rgbaArrayToRgbaStr(rgbaArray);
    // 	tdl["style"]["backgroundColor"] = rgbaString;
    // }

    // return tdl;
    // };
}
