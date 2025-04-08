import { GlobalVariables } from "../../global/GlobalVariables";
import { BobPropertyConverter } from "../../../mainProcess/windows/DisplayWindow/BobPropertyConverter";
import { type_rules_tdl, BaseWidgetHelper, type_BaseWidget_tdl } from "../BaseWidget/BaseWidgetHelper";
import * as GlobalMethods from "../../global/GlobalMethods";
import { rgbaArrayToRgbaStr, rgbaStrToRgbaArray } from "../../global/GlobalMethods";
import { EdlConverter } from "../../../mainProcess/windows/DisplayWindow/EdlConverter";
import { v4 as uuidv4 } from "uuid";

export type type_TextEntry_tdl = {
	type: string;
	widgetKey: string;
	key: string;
	style: Record<string, any>;
	text: Record<string, any>;
	channelNames: string[];
	groupNames: string[];
	rules: type_rules_tdl;
};

export class TextEntryHelper extends BaseWidgetHelper {
	// override BaseWidget
	static _defaultTdl: type_TextEntry_tdl = {
		type: "TextEntry",
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
			backgroundColor: "rgba(128, 255, 255, 1)",
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
		text: {
			// text positions and contents
			horizontalAlign: "flex-start",
			verticalAlign: "center",
			wrapWord: false,
			showUnit: true,
			// when the input box is focused
			highlightBackgroundColor: "rgba(255, 255, 0, 1)",
			invisibleInOperation: false,
            // decimal, exponential, hexadecimal
            format: "default",
            // scale, >= 0
            scale: 0,
            // "contemporary" | "traditional"
            appearance: "contemporary",
            // actuall "alarm outline"
            alarmBorder: true,
            alarmText: false,
            alarmBackground: false,
            alarmLevel: "MINOR",
            confirmOnWrite: false,
            confirmOnWriteUsePassword: false,
            confirmOnWritePassword: "",

		},
		channelNames: [],
		groupNames: [],
		rules: [],
	};

	// override
	static generateDefaultTdl = (type: string): type_TextEntry_tdl => {
		// defines type, widgetKey, and key
		const result = super.generateDefaultTdl(type) as type_TextEntry_tdl;
		result.style = JSON.parse(JSON.stringify(this._defaultTdl.style));
		result.text = JSON.parse(JSON.stringify(this._defaultTdl.text));
		result.channelNames = JSON.parse(JSON.stringify(this._defaultTdl.channelNames));
		result.groupNames = JSON.parse(JSON.stringify(this._defaultTdl.groupNames));
		return result;
	};

	static convertEdlToTdl = (edl: Record<string, string>): type_TextEntry_tdl => {
		console.log("\n------------", `Parsing "Text Entry"`, "------------------\n");
		const tdl = this.generateDefaultTdl("TextEntry") as type_TextEntry_tdl;
		// all properties for this widget
		// there is no border settings in edl file, however in edm, there is a border line width setting
		// it shows in editing mode, but it does not show in operating mode
		const propertyNames: string[] = [
			"beginObjectProperties", // not in tdm
			"major", // not in tdm
			"minor", // not in tdm
			"release", // not in tdm
			"x",
			"y",
			"w",
			"h",
			"controlPv",
			"fgColor",
			"lineWidth", // ! the border line only shows in editing mode, not in operating mode
			// ! The lineWidth and lineAlarm are ignored in this converter
			"lineAlarm", // ! behavior in edm is inconsistent, ignore it
			"displayMode", // ! not in tdm
			"fgAlarm", 
			// if it is set "true" and the "controlPv" is in MAJOR or MINOR severity, the text color is red
			// otherwise, the text color is "fgColor"
			// this behavior is different from some "fgAlarm", such as in "Text Update", where when
			// the "controlPv" is in NO_ALARM severity, the text color is forced to be green
			"bgColor",
			"fill", // ! this only works in editing mode, the box is filled anyway in operating mode
            // ! it is ignored in this converter
			"font",
			"endObjectProperties", // not in tdm
		];

		const alarmPropertyNames: string[] = [];

		// default differences
		tdl["text"]["wrapWord"] = false;
		tdl["text"]["alarmBorder"] = false;
		tdl["text"]["showUnit"] = true;
		tdl["text"]["appearance"] = "traditional";
		tdl["text"]["highlightBackgroundColor"] = tdl["style"]["backgroundColor"];

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
					tdl["channelNames"].push(EdlConverter.convertEdlPv(propertyValue, true));
				} else if (propertyName === "fgColor") {
					tdl["style"]["color"] = EdlConverter.convertEdlColor(propertyValue, EdlConverter.convertEdlPv(edl["controlPv"]), "Text Color", tdl);
				} else if (propertyName === "bgColor") {
					tdl["style"]["backgroundColor"] = EdlConverter.convertEdlColor(propertyValue);
				} else if (propertyName === "fgAlarm") {
					alarmPropertyNames.push(propertyName);
					// } else if (propertyName === "lineAlarm") {
					// 	alarmPropertyNames.push(propertyName);
					// } else if (propertyName === "lineWidth") {
					// 	tdl["style"]["borderWidth"] = parseInt(propertyValue);
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
				const newRules_Labels = EdlConverter.convertEdlColorAlarm(EdlConverter.convertEdlPv(edl["controlPv"]), 0, "Text Color") as type_rules_tdl;
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
				propertyName: "Text Color",
				propertyValue: "rgba(255,255,255,1)",
				id: uuidv4(),
			});
		}
		if (edl["colorPv"] !== undefined) {
			tdl["rules"].push({
                boolExpression: EdlConverter.generatePvUndefinedExpression(edl["colorPv"]),
				propertyName: "Text Color",
				propertyValue: "rgba(255,255,255,1)",
				id: uuidv4(),
			});
		}

		// if (edl["fill"] !== "true") {
		// 	const rgbaArray = rgbaStrToRgbaArray(tdl["style"]["backgroundColor"]);
		// 	rgbaArray[3] = 0;
		// 	const rgbaStr = rgbaArrayToRgbaStr(rgbaArray);
		// 	tdl["style"]["backgroundColor"] = rgbaStr;
		// }

		return tdl;
	};

	static convertEdlToTdl_TextControl = (edl: Record<string, string>): type_TextEntry_tdl => {
		console.log("\n------------", `Parsing "Text Control"`, "------------------\n");
		const tdl = this.generateDefaultTdl("TextEntry") as type_TextEntry_tdl;
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
			"controlPv",
			"format",
			"font",
			"fgColor",
			"fgAlarm", // ! not in tdm. Boolean
			// ! When it is true, the text color is overridden: when the "controlPv" is in
			// ! MAJOR or MINOR severity, the text color becomes red, otherwise it is green
			// ! There is no border for this widget
			// ! can be realized by a rule
			"bgColor",
			"bgAlarm", // ! not in tdm. Boolean
			// ! When it is true, the background color is overridden: when the "controlPv" is
			// ! in MAJOR or MINOR severity, the background color is red, otherwise it is green
			// ! can be realized by a rule
			"editable", // when "true", it should be a "TextEntry", when "false", it should be a "TextUpdate"
			"autoHeight", // not in tdm
			"motifWidget", // not in tdm
			"limitsFromDb", // ! not in tdm
			"fieldLen", // ! what is it?
			"nullPv", // ! not in tdm, a PV name
			// ! when it is set, the text color is taken control by it when the "controlPv" is in NO_ALARM
			// ! severity. If the below "nullCondition" is satisfied, the text color becomes the
			// ! "nullColor", if not satisfied, the text color is the regular text color.
			// ! in summary
			// ! valid nullPv + nullCondition satisified + bgAlarm true + NO_ALARM controlPv ==> nullColor
			// ! valid nullPv + nullCondition satisified + bgAlarm true + MAJOR/MINOR controlPv ==> red
			// ! valid nullPv + nullCondition satisified + bgAlarm false + NO_ALARM controlPv ==> nullColor
			// ! valid nullPv + nullCondition satisified + bgAlarm false + MAJOR/MINOR controlPv ==> nullColor
			// ! valid nullPv + nullCondition not satisified + bgAlarm true + NO_ALARM controlPv ==> bgColor
			// ! valid nullPv + nullCondition not satisified + bgAlarm true + MAJOR/MINOR controlPv ==> bgColor
			// ! valid nullPv + nullCondition not satisified + bgAlarm false + NO_ALARM controlPv ==> bgColor
			// ! valid nullPv + nullCondition not satisified + bgAlarm false + MAJOR/MINOR controlPv ==> bgColor
			// ! not valid nullPv + nullCondition satisified + bgAlarm true + NO_ALARM controlPv ==> bgColor
			// ! not valid nullPv + nullCondition satisified + bgAlarm true + MAJOR/MINOR controlPv ==> red
			// ! not valid nullPv + nullCondition satisified + bgAlarm false + NO_ALARM controlPv ==> bgColor
			// ! not valid nullPv + nullCondition satisified + bgAlarm false + MAJOR/MINOR controlPv ==> bgColor
			// ! not valid nullPv + nullCondition not satisified + bgAlarm true + NO_ALARM controlPv ==> bgColor
			// ! not valid nullPv + nullCondition not satisified + bgAlarm true + MAJOR/MINOR controlPv ==> red
			// ! not valid nullPv + nullCondition not satisified + bgAlarm false + NO_ALARM controlPv ==> bgColor
			// ! not valid nullPv + nullCondition not satisified + bgAlarm false + MAJOR/MINOR controlPv ==> bgColor
			// ! the above can be realized in rules
			"nullColor", // ! not in tdm
			"nullCondition", // ! not in tdm
			"colorPv", // ! not in tdm, what is it?
			"smartRefresh", // not in tdm
			"useKp", // not in tdm, use keypad
			"useDisplayBg",
			"showUnits",
			"changeValOnLoseFocus", // not in tdm
			"fastUpdate", // not in tdm
			"date", // not in tdm
			"file", // not in tdm
			"defDir", // not in tdm
			"pattern", // not in tdm
			"autoSelect", // not in tdm
			"updatePvOnDrop", // not in tdm
			"useHexPrefix", // not in tdm
			"fileComponent", // not in tdm
			"dateAsFileName", // not in tdm
			"useAlarmBorder",
			// if it is true and the "fgAlarm" is "true", a 2 pixel width red color border appears when the
			// "controlPv" is in MAJOR or MINOR severity
			// already realized by rule
			// ! In EDM, when "useAlarmBorder" is "true", the text color becomes alarm-insensitive: when we set the fgAlarm to "true"
			// ! the text color is not changing with alarm status
			// ! We are not going to implement this inconsistent feature (is it a feature?)
			// ! the same applies to the "Text Control" in TextUpdateHelper.ts
			"newPos", // not in tdm, what is it?
			"inputFocusUpdates", // not in tdm
			"objType", // not in tdm
			"clipToDspLimits", // not in tdm
			"changeCallback", // not in tdm
			"isPassword", // not in tdm
			"characterMode", // not in tdm
			"noExecuteClipMask", // not in tdm
			"fontAlign",
			"endObjectProperties", // not in tdm
		];

		const alarmPropertyNames: string[] = [];

		// default differences
		tdl["text"]["verticalAlign"] = "center";
		tdl["text"]["wrapWord"] = false;
		tdl["text"]["alarmBorder"] = false;
		tdl["text"]["showUnit"] = false;
		tdl["text"]["highlightBackgroundColor"] = tdl["style"]["backgroundColor"];
		tdl["text"]["appearance"] = "traditional";

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
					tdl["channelNames"].push(EdlConverter.convertEdlPv(propertyValue, true));
				} else if (propertyName === "fgColor") {
					tdl["style"]["color"] = EdlConverter.convertEdlColor(propertyValue, EdlConverter.convertEdlPv(edl["colorPv"]), "Text Color", tdl);
				} else if (propertyName === "bgColor") {
					tdl["style"]["backgroundColor"] = EdlConverter.convertEdlColor(propertyValue, EdlConverter.convertEdlPv(edl["colorPv"]), "Background Color", tdl);
				} else if (propertyName === "showUnits") {
					tdl["text"]["showUnit"] = EdlConverter.convertEdlBoolean(propertyValue);
				} else if (propertyName === "font") {
					const { fontFamily, fontWeight, fontSize, fontStyle } = EdlConverter.convertEdlFont(propertyValue);
					tdl["style"]["fontFamily"] = fontFamily;
					tdl["style"]["fontStyle"] = fontStyle;
					tdl["style"]["fontSize"] = fontSize;
					tdl["style"]["fontWeight"] = fontWeight;
				} else if (propertyName === "fontAlign") {
                    // in operation mode, always align to left
					// tdl["text"]["horizontalAlign"] = EdlConverter.convertEdlFontAlign(propertyValue);
				} else if (propertyName === "fgAlarm") {
					alarmPropertyNames.push(propertyName);
				} else if (propertyName === "bgAlarm") {
					alarmPropertyNames.push(propertyName);
				} else if (propertyName === "useAlarmBorder") {
					alarmPropertyNames.push(propertyName);
				} else if (propertyName === "format") {
                    tdl["text"]["format"] = EdlConverter.convertEdlDisplayMode(propertyValue);
				} else {
					console.log("Skip property", `"${propertyName}"`);
				}
			}
		}

		// all alarm-sensitive rules override others
		for (let alarmPropertyName of alarmPropertyNames) {
			if (alarmPropertyName === "bgAlarm") {
				const newRules = EdlConverter.convertEdlBgAlarm(EdlConverter.convertEdlPv(edl["controlPv"]), 1) as type_rules_tdl;
				tdl["rules"].push(...newRules);
			} else if (alarmPropertyName === "fgAlarm") {
                if (edl["useAlarmBorder"] !== "true") {
                    const newRules = EdlConverter.convertEdlColorAlarm(EdlConverter.convertEdlPv(edl["controlPv"]), 1, "Text Color") as type_rules_tdl;
                    tdl["rules"].push(...newRules);
                }
			} else {
				console.log("Skip alarm-sensitive property", alarmPropertyName);
			}
		}

		// special rules for TextControl
		if (edl["useAlarmBorder"] === "true" && edl["fgAlarm"] === "true") {
			const newRules = EdlConverter.convertEdlBorderAlarm(EdlConverter.convertEdlPv(edl["controlPv"]), 0) as type_rules_tdl;
			tdl["rules"].push(...newRules);
			if (edl["controlPv"] !== undefined) {
				tdl["rules"].push({
					boolExpression: `[${EdlConverter.convertEdlPv(edl["controlPv"]).split(".")[0]}.SEVR] > 0.5`,
					propertyName: "Border Width",
					propertyValue: "2",
					id: uuidv4(),
				});
			}
		}

        // this edm setting is inconsistent: in operation mode, the background is still the desginated background, not transparent
        // the background is transparent only in editing mode
		if (edl["useDisplayBg"] === "true") {
		// 	const rgbaArray = rgbaStrToRgbaArray(tdl["style"]["backgroundColor"]);
		// 	rgbaArray[3] = 0;
		// 	const rgbaStr = rgbaArrayToRgbaStr(rgbaArray);
		// 	tdl["style"]["backgroundColor"] = rgbaStr;
		}

		// if colorPv exists in edl setting, but its value is not available in operation, the widget becomes invisible
		// These behaviors override the alarm-sensitive
		if (edl["colorPv"] !== undefined) {
			tdl["rules"].push({
                boolExpression: EdlConverter.generatePvUndefinedExpression(edl["colorPv"]),
				propertyName: "Invisible in Operation",
				propertyValue: "true",
				id: uuidv4(),
			});
		}
		if (edl["controlPv"] !== undefined) {
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

		return tdl;
	};

	static convertBobToTdl = (bob: Record<string, any>): type_TextEntry_tdl => {
		console.log("\n------------", `Parsing "textentry"`, "------------------\n");
		const tdl = this.generateDefaultTdl("TextEntry") as type_TextEntry_tdl;
		// all properties for this widget
		const propertyNames: string[] = [
			"actions", // not in tdm
			"background_color",
			"border_alarm_sensitive",
			"border_color",
			"border_width",
			"class", // not in tdm
			"enabled", // not in tdm
			"font",
			"foreground_color",
			"format", // not in tdm
			"height",
			"horizontal_alignment",
			"multi_line", // not in tdm
			"name", // not in tdm
			"precision", // not in tdm
			"pv_name",
			"rules", // not in tdm
			"scripts", // not in tdm
			"show_units",
			"tooltip", // not in tdm
			"type", // not in tdm
			"vertical_alignment",
			"visible", // not in tdm
			"width",
			"wrap_words",
			"x",
			"y",
		];

		for (const propertyName of propertyNames) {
			const propertyValue = bob[propertyName];
			if (propertyValue === undefined) {
				if (propertyName === "widget") {
					console.log(`There are one or more widgets inside "display"`);
				} else {
					console.log("Property", `"${propertyName}"`, "is not in bob file");
				}
				continue;
			} else {
				if (propertyName === "x") {
					tdl["style"]["left"] = parseInt(propertyValue);
				} else if (propertyName === "y") {
					tdl["style"]["top"] = parseInt(propertyValue);
				} else if (propertyName === "width") {
					tdl["style"]["width"] = parseInt(propertyValue);
				} else if (propertyName === "height") {
					tdl["style"]["height"] = parseInt(propertyValue);
				} else if (propertyName === "background_color") {
					const rgbaColor = BobPropertyConverter.convertBobColor(propertyValue, undefined);
					tdl["style"]["backgroundColor"] = rgbaColor;
				} else if (propertyName === "border_alarm_sensitive") {
					tdl["text"]["alarmBorder"] = BobPropertyConverter.convertBobBoolean(propertyValue);
				} else if (propertyName === "border_color") {
					const rgbaColor = BobPropertyConverter.convertBobColor(propertyValue, undefined);
					tdl["style"]["borderColor"] = rgbaColor;
				} else if (propertyName === "border_width") {
					tdl["style"]["borderWidth"] = parseInt(propertyValue);
				} else if (propertyName === "font") {
					const font = BobPropertyConverter.convertBobFont(propertyValue);
					tdl["style"]["fontSize"] = font["fontSize"];
					tdl["style"]["fontFamily"] = font["fontFamily"];
					tdl["style"]["fontStyle"] = font["fontStyle"];
					tdl["style"]["fontWeight"] = font["fontWeight"];
				} else if (propertyName === "foreground_color") {
					const rgbaColor = BobPropertyConverter.convertBobColor(propertyValue, undefined);
					tdl["style"]["color"] = rgbaColor;
				} else if (propertyName === "horizontal_alignment") {
					tdl["text"]["horizontalAlign"] = BobPropertyConverter.convertBobHorizontalAlign(propertyValue);
				} else if (propertyName === "vertical_alignment") {
					tdl["text"]["verticalAlign"] = BobPropertyConverter.convertBobHorizontalAlign(propertyValue);
				} else if (propertyName === "pv_name") {
					tdl["channelNames"].push(propertyValue);
				} else if (propertyName === "show_units") {
					tdl["text"]["showUnit"] = BobPropertyConverter.convertBobBoolean(propertyValue);
				} else if (propertyName === "wrap_words") {
					tdl["text"]["wrapWord"] = BobPropertyConverter.convertBobBoolean(propertyValue);
				} else {
					console.log("Skip property", `"${propertyName}"`);
				}
			}
		}

		// handle the situation that the "background_color" is not explicitly shown in bob file
		// while the "transparent" is explicitly shown
		// default transparent is "false"
		if (bob["transparent"] === "true") {
			const rgbaArray = GlobalMethods.rgbaStrToRgbaArray(tdl["style"]["backgroundColor"]);
			rgbaArray[3] = 0;
			const rgbaString = GlobalMethods.rgbaArrayToRgbaStr(rgbaArray);
			tdl["style"]["backgroundColor"] = rgbaString;
		}

		return tdl;
	};
}
