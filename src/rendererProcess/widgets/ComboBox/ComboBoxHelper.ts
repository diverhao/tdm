import { GlobalVariables } from "../../global/GlobalVariables";
import { BobPropertyConverter } from "../../../mainProcess/windows/DisplayWindow/BobPropertyConverter";
import { type_rules_tdl, BaseWidgetHelper } from "../BaseWidget/BaseWidgetHelper";
import * as GlobalMethods from "../../global/GlobalMethods";
import { rgbaArrayToRgbaStr, rgbaStrToRgbaArray } from "../../global/GlobalMethods";
import { EdlConverter } from "../../../mainProcess/windows/DisplayWindow/EdlConverter";
import { v4 as uuidv4 } from "uuid";

export type type_ComboBox_tdl = {
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

export class ComboBoxHelper extends BaseWidgetHelper {
    // override BaseWidget
    static _defaultTdl: type_ComboBox_tdl = {
        type: "ComboBox",
        widgetKey: "", // "key" is a reserved keyword
        key: "",
        style: {
            // basics
            position: "absolute",
            display: "inline-flex",
            // dimensions
            left: 100,
            top: 100,
            width: 150,
            height: 80,
            backgroundColor: "rgba(128, 255, 255, 0)",
            // angle
            transform: "rotate(0deg)",
            // border, it is different from the "alarmBorder" below,
            borderStyle: "solid",
            borderWidth: 0,
            borderColor: "rgba(0, 0, 0, 1)",
            // font
            color: "rgba(0,0,0,1)",
            fontFamily: GlobalVariables.defaultFontFamily,
            fontSize: GlobalVariables.defaultFontSize,
            fontStyle: GlobalVariables.defaultFontStyle,
            fontWeight: GlobalVariables.defaultFontWeight,
            // shows when the widget is selected
            outlineStyle: "none",
            outlineWidth: 1,
            outlineColor: "black",
            alarmText: false,
            alarmBackground: false,
            alarmLevel: "MINOR",
        },
        // the ElementBody style
        text: {
            alarmBorder: true,
            useChannelItems: false,
            invisibleInOperation: false,
            confirmOnWrite: false,
            confirmOnWriteUsePassword: false,
            confirmOnWritePassword: "",
        },
        channelNames: [],
        groupNames: [],
        rules: [],
        itemLabels: ["Label 0", "Label 1"],
        itemValues: [0, 1],
    };

    static generateDefaultTdl = (type: string): type_ComboBox_tdl => {
        // defines type, widgetKey, and key
        const result = super.generateDefaultTdl(type) as type_ComboBox_tdl;
        result.style = JSON.parse(JSON.stringify(this._defaultTdl.style));
        result.text = JSON.parse(JSON.stringify(this._defaultTdl.text));
        result.channelNames = JSON.parse(JSON.stringify(this._defaultTdl.channelNames));
        result.groupNames = JSON.parse(JSON.stringify(this._defaultTdl.groupNames));
        result.itemLabels = JSON.parse(JSON.stringify(this._defaultTdl.itemLabels));
        result.itemValues = JSON.parse(JSON.stringify(this._defaultTdl.itemValues));
        return result;
    };

    static convertEdlToTdl = (edl: Record<string, string>): type_ComboBox_tdl => {
        console.log("\n------------", `Parsing "Menu Button"`, "------------------\n");
        const tdl = this.generateDefaultTdl("ComboBox") as type_ComboBox_tdl;
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
                } else if (propertyName === "controlPv") {
                    tdl["channelNames"].push(EdlConverter.convertEdlPv(propertyValue));
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
                    const newRules = EdlConverter.convertEdlVisPv(propertyName, edl["visMin"], edl["visMax"], edl["visInvert"]) as type_rules_tdl;
                    tdl["rules"].push(...newRules);
                } else {
                    console.log("Skip property", `"${propertyName}"`);
                }
            }
        }

        // all alarm-sensitive rules override others
        for (let alarmPropertyName of alarmPropertyNames) {
            if (alarmPropertyName === "fgAlarm") {
                const newRules = EdlConverter.convertEdlFgAlarm(edl["controlPv"], 0) as type_rules_tdl;
                tdl["rules"].push(...newRules);
            } else {
                console.log("Skip alarm-sensitive property", alarmPropertyName);
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
        console.log("\n------------", `Parsing "Menu Mux"`, "------------------\n");
        const tdl = this.generateDefaultTdl("ComboBox") as type_ComboBox_tdl;
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
        tdl["itemLabels"] = [];
        tdl["itemValues"] = [];

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
                } else if (propertyName === "controlPv") {
                    tdl["channelNames"].push(EdlConverter.convertEdlPv(propertyValue));
                } else if (propertyName === "fgColor") {
                    tdl["style"]["color"] = EdlConverter.convertEdlColor(propertyValue, edl["colorPv"], "Text Color", tdl);
                } else if (propertyName === "fgAlarm") {
                    alarmPropertyNames.push(propertyName);
                } else if (propertyName === "symbolTag") {
                    tdl["itemLabels"] = EdlConverter.convertMenuMuxSymbolTag(propertyValue);
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
                    console.log("Skip property", `"${propertyName}"`);
                }
            }
        }

        // all alarm-sensitive rules override others
        for (let alarmPropertyName of alarmPropertyNames) {
            if (alarmPropertyName === "fgAlarm") {
                const newRules = EdlConverter.convertEdlFgAlarm(edl["controlPv"], 0) as type_rules_tdl;
                tdl["rules"].push(...newRules);
            } else {
                console.log("Skip alarm-sensitive property", alarmPropertyName);
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

    // ! todo
    // static convertBobToTdl = (bob: Record<string, any>): type_TextUpdate_tdl => {
    // 	console.log("\n------------", `Parsing "textupdate"`, "------------------\n");
    // 	const tdl = this.generateDefaultTdl("TextUpdate");
    // 	// all properties for this widget
    // 	const propertyNames: string[] = [
    // 		"actions", // not in tdm
    // 		"background_color",
    // 		"border_alarm_sensitive",
    // 		"border_color",
    // 		"border_width",
    // 		"class", // not in tdm
    // 		"font",
    // 		"foreground_color",
    // 		"format", // not in tdm
    // 		"height",
    // 		"horizontal_alignment",
    // 		"interactive", // not in tdm
    // 		"name", // not in tdm
    // 		"precision", // not in tdm
    // 		"pv_name",
    // 		"rotation_step",
    // 		"rules", // not in tdm
    // 		"scripts", // not in tdm
    // 		"show_units",
    // 		"tooltip", // not in tdm
    // 		"transparent",
    // 		"type", // not in tdm
    // 		"vertical_alignment",
    // 		"visible", // not in tdm
    // 		"width",
    // 		"wrap_words",
    // 		"x",
    // 		"y",
    // 	];

    // 	for (const propertyName of propertyNames) {
    // 		const propertyValue = bob[propertyName];
    // 		if (propertyValue === undefined) {
    // 			if (propertyName === "widget") {
    // 				console.log(`There are one or more widgets inside "display"`);
    // 			} else {
    // 				console.log("Property", `"${propertyName}"`, "is not in bob file");
    // 			}
    // 			continue;
    // 		} else {
    // 			if (propertyName === "x") {
    // 				tdl["style"]["left"] = parseInt(propertyValue);
    // 			} else if (propertyName === "y") {
    // 				tdl["style"]["top"] = parseInt(propertyValue);
    // 			} else if (propertyName === "width") {
    // 				tdl["style"]["width"] = parseInt(propertyValue);
    // 			} else if (propertyName === "height") {
    // 				tdl["style"]["height"] = parseInt(propertyValue);
    // 			} else if (propertyName === "background_color") {
    // 				const rgbaColor = BobPropertyConverter.convertBobColor(propertyValue, undefined);
    // 				tdl["style"]["backgroundColor"] = rgbaColor;
    // 			} else if (propertyName === "font") {
    // 				const font = BobPropertyConverter.convertBobFont(propertyValue);
    // 				tdl["style"]["fontSize"] = font["fontSize"];
    // 				tdl["style"]["fontFamily"] = font["fontFamily"];
    // 				tdl["style"]["fontStyle"] = font["fontStyle"];
    // 				tdl["style"]["fontWeight"] = font["fontWeight"];
    // 			} else if (propertyName === "foreground_color") {
    // 				const rgbaColor = BobPropertyConverter.convertBobColor(propertyValue, undefined);
    // 				tdl["style"]["color"] = rgbaColor;
    // 			} else if (propertyName === "border_color") {
    // 				const rgbaColor = BobPropertyConverter.convertBobColor(propertyValue, undefined);
    // 				tdl["style"]["borderColor"] = rgbaColor;
    // 			} else if (propertyName === "border_width") {
    // 				tdl["style"]["borderWidth"] = parseInt(propertyValue);
    // 			} else if (propertyName === "wrap_words") {
    // 				tdl["text"]["wrapWord"] = BobPropertyConverter.convertBobBoolean(propertyValue);
    // 			} else if (propertyName === "show_units") {
    // 				tdl["text"]["showUnit"] = BobPropertyConverter.convertBobBoolean(propertyValue);
    // 			} else if (propertyName === "horizontal_alignment") {
    // 				tdl["text"]["horizontalAlign"] = BobPropertyConverter.convertBobHorizontalAlign(propertyValue);
    // 			} else if (propertyName === "vertical_alignment") {
    // 				tdl["text"]["verticalAlign"] = BobPropertyConverter.convertBobHorizontalAlign(propertyValue);
    // 			} else if (propertyName === "pv_name") {
    // 				tdl["channelNames"].push(propertyValue);
    // 			} else if (propertyName === "text") {
    // 				tdl["text"]["text"] = propertyValue;
    // 			} else if (propertyName === "line_color") {
    // 				const rgbaColor = BobPropertyConverter.convertBobColor(propertyValue, undefined);
    // 				tdl["text"]["lineColor"] = rgbaColor;
    // 			} else if (propertyName === "line_width") {
    // 				tdl["text"]["lineWidth"] = parseInt(propertyValue);
    // 			} else if (propertyName === "line_style") {
    // 				let borderStyles = ["solid", "dashed", "dotted", "dash-dot", "dash-dot-dot"];
    // 				tdl["text"]["lineStyle"] = borderStyles[parseInt(propertyValue)];
    // 			} else if (propertyName === "corner_width") {
    // 				tdl["text"]["cornerWidth"] = parseInt(propertyValue);
    // 			} else if (propertyName === "corner_height") {
    // 				tdl["text"]["cornerHeight"] = parseInt(propertyValue);
    // 			} else if (propertyName === "border_alarm_sensitive") {
    // 				tdl["text"]["alarmBorder"] = BobPropertyConverter.convertBobBoolean(propertyValue);
    // 			} else {
    // 				console.log("Skip property", `"${propertyName}"`);
    // 			}
    // 		}
    // 	}

    // 	// handle the situation that the "background_color" is not explicitly shown in bob file
    // 	// while the "transparent" is explicitly shown
    // 	// default transparent is "false"
    // 	if (bob["transparent"] === "true") {
    // 		const rgbaArray = GlobalMethods.rgbaStrToRgbaArray(tdl["style"]["backgroundColor"]);
    // 		rgbaArray[3] = 0;
    // 		const rgbaString = GlobalMethods.rgbaArrayToRgbaStr(rgbaArray);
    // 		tdl["style"]["backgroundColor"] = rgbaString;
    // 	}

    // 	// special treatment for rotation
    // 	if (Object.keys(bob).includes("rotation_step")) {
    // 		const propertyValue = bob["rotation_step"];
    // 		const left = parseInt(bob["x"]);
    // 		const top = parseInt(bob["y"]);
    // 		const width = parseInt(bob["width"]);
    // 		const height = parseInt(bob["height"]);
    // 		const result = BobPropertyConverter.convertBobRotationStep(propertyValue, left, top, width, height);
    // 		tdl["style"]["transform"] = result["transform"];
    // 		tdl["style"]["left"] = result["newLeft"];
    // 		tdl["style"]["top"] = result["newTop"];
    // 		tdl["style"]["width"] = result["newWidth"];
    // 		tdl["style"]["height"] = result["newHeight"];
    // 	}

    // 	return tdl;
    // };
}
