import { BobPropertyConverter } from "../../../mainProcess/windows/DisplayWindow/BobPropertyConverter";
import { type_rules_tdl, BaseWidgetHelper } from "../BaseWidget/BaseWidgetHelper";
import { rgbaArrayToRgbaStr, rgbaStrToRgbaArray } from "../../global/GlobalMethods";
import { EdlConverter } from "../../../mainProcess/windows/DisplayWindow/EdlConverter";
import { v4 as uuidv4 } from "uuid";

type type_Rectangle_tdl = {
	type: string;
	widgetKey: string;
	key: string;
	style: Record<string, any>;
	text: Record<string, any>;
	channelNames: string[];
	groupNames: string[];
	rules: type_rules_tdl;
};

export class RectangleHelper extends BaseWidgetHelper {
	static _defaultTdl: type_Rectangle_tdl = {
		type: "Rectangle",
		widgetKey: "", // "key" is a reserved keyword
		key: "",
		style: {
			// basics
			position: "absolute",
			display: "inline-block",
			// dimensions
			left: 100,
			top: 100,
			width: 100,
			height: 100,
			backgroundColor: "rgba(0, 0, 0, 0)", // always transparent, background is controlled in fillColor
			// angle
			transform: "rotate(0deg)",
			// shows when the widget is selected
			outlineStyle: "none",
			outlineWidth: 1,
			outlineColor: "black",
		},
		text: {
			// line
			lineWidth: 3,
			lineColor: "rgba(0, 0, 255, 1)",
			lineStyle: "solid",
			// fill
			fillColor: "rgba(30, 144,255,1)",
			fill: true,
			// corner
			cornerWidth: 0,
			cornerHeight: 0,
			invisibleInOperation: false,
            alarmBorder: false,
		},
		channelNames: [],
		groupNames: [],
		rules: [],
	};

	static generateDefaultTdl = (type: string): type_Rectangle_tdl => {
		const result = super.generateDefaultTdl("Rectangle") as type_Rectangle_tdl;

		result.style = JSON.parse(JSON.stringify(this._defaultTdl.style));
		result.text = JSON.parse(JSON.stringify(this._defaultTdl.text));
		result.channelNames = JSON.parse(JSON.stringify(this._defaultTdl.channelNames));
		result.groupNames = JSON.parse(JSON.stringify(this._defaultTdl.groupNames));
		return result;
	};

	// ------------------------- Converter ------------------------

	static convertEdlToTdl = (edl: Record<string, any>): type_Rectangle_tdl => {
		console.log("\n------------", `Parsing "Rectangle"`, "------------------\n");
		const tdl = this.generateDefaultTdl("Rectangle") as type_Rectangle_tdl;
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
			"lineColor",
			"lineAlarm",
			// if it is true, the original "lineColor" (border) is overridden
			// when the "alarmPv" is in MINOR severity, the line becomes yellow
			// when MAJOR, it is red
			// when not, the line is green
			// it is already realized in a rule
			"fill",
			"fillColor",
			"fillAlarm",
			// similar to "lineAlarm", the original "fillColor" is overridden
			// it is already realized by a rule
			"lineWidth",
			"lineStyle",
			"invisible", // hide the widget in operation
			"alarmPv",
			"visPv", // already done in rule
			"visInvert", // invert the "visPv"
			"visMin",
			"visMax",
			"endObjectProperties", // not in tdm
		];

		const alarmPropertyNames: string[] = [];

		// default differences
		tdl["text"]["verticalAlign"] = "center";
		tdl["text"]["wrapWord"] = false;
		tdl["text"]["alarmBorder"] = false;
		tdl["text"]["lineWidth"] = 1;
		tdl["text"]["fill"] = false;

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
				} else if (propertyName === "lineColor") {
					tdl["text"]["lineColor"] = EdlConverter.convertEdlColor(
						propertyValue,
						EdlConverter.convertEdlPv(edl["alarmPv"]),
						"Line Color",
						tdl
					);
				} else if (propertyName === "lineWidth") {
					tdl["text"]["lineWidth"] = EdlConverter.convertEdlNumber(propertyValue);
				} else if (propertyName === "lineStyle") {
					tdl["text"]["lineStyle"] = EdlConverter.convertEdlLineStyle(propertyValue);
				} else if (propertyName === "fillColor") {
					tdl["text"]["fillColor"] = EdlConverter.convertEdlColor(
						propertyValue,
						EdlConverter.convertEdlPv(edl["alarmPv"]),
						"Fill Color",
						tdl
					);
				} else if (propertyName === "fill") {
					tdl["text"]["fill"] = EdlConverter.convertEdlBoolean(propertyValue);
					// -------------- rules ------------------
				} else if (propertyName === "lineAlarm") {
					alarmPropertyNames.push(propertyName);
				} else if (propertyName === "fillAlarm") {
					alarmPropertyNames.push(propertyName);
				} else if (propertyName === "visPv") {
					const newRules = EdlConverter.convertEdlVisPv(
						EdlConverter.convertEdlPv(propertyValue),
						edl["visMin"],
						edl["visMax"],
						edl["visInvert"]
					) as type_rules_tdl;
					tdl["rules"].push(...newRules);
				} else if (propertyName === "invisible") {
					tdl["text"]["invisibleInOperation"] = true;
					// const newRules = EdlConverter.convertEdlInvisible(propertyValue) as type_rules_tdl;
					// tdl["rules"].push(...newRules);
				} else {
					console.log("Skip property", `"${propertyName}"`);
				}
			}
		}

		// definition of dimensions are different
		if (edl["lineWidth"] !== undefined) {
			const lineWidth = EdlConverter.convertEdlNumber(edl["lineWidth"]);
			const rawLeft = EdlConverter.convertEdlNumber(edl["x"]);
			const rawTop = EdlConverter.convertEdlNumber(edl["y"]);
			const rawWidth = EdlConverter.convertEdlNumber(edl["w"]);
			const rawHeight = EdlConverter.convertEdlNumber(edl["h"]);
			const left = rawLeft - lineWidth / 2;
			const top = rawTop - lineWidth / 2;
			const width = rawWidth + lineWidth;
			const height = rawHeight + lineWidth;
			tdl["style"]["left"] = left;
			tdl["style"]["top"] = top;
			tdl["style"]["width"] = width;
			tdl["style"]["height"] = height;
		}

		if (edl["fill"] === undefined) {
			const rgbaArray = rgbaStrToRgbaArray(tdl["text"]["fillColor"]);
			rgbaArray[3] = 0;
			const rgbaStr = rgbaArrayToRgbaStr(rgbaArray);
			console.log("new fill color", rgbaStr);
			tdl["text"]["fillColor"] = rgbaStr;
		}

		// all alarm-sensitive rules override others
		for (let alarmPropertyName of alarmPropertyNames) {
			if (alarmPropertyName === "fillAlarm") {
				if (edl["alarmPv"] === undefined) {
					tdl["rules"].push({
						boolExpression: `true`,
						propertyName: "Fill Color",
						propertyValue: "rgba(0, 255, 0, 1)",
						id: uuidv4(),
					});
				} else {
					const newRules = EdlConverter.convertEdlFillAlarm(EdlConverter.convertEdlPv(edl["alarmPv"]), 2) as type_rules_tdl;
					tdl["rules"].push(...newRules);
				}
			} else if (alarmPropertyName === "lineAlarm") {
				// if the lineAlarm is true, but the alarmPv is not set in edl setting, the line color is white
				if (edl["alarmPv"] === undefined) {
					tdl["rules"].push({
						boolExpression: `true`,
						propertyName: "Line Color",
						propertyValue: "rgba(0, 255, 0, 1)",
						id: uuidv4(),
					});
				} else {
					const newRules = EdlConverter.convertEdlLineAlarm(EdlConverter.convertEdlPv(edl["alarmPv"]), 1) as type_rules_tdl;
					tdl["rules"].push(...newRules);
				}
			} else {
				console.log("Skip alarm-sensitive property", alarmPropertyName);
			}
		}

		// if alarmPv exists in edl setting, but its value is not available in operation, the widget becomes invisible
		// These behaviors override the alarm-sensitive
		if (edl["alarmPv"] !== undefined) {
			tdl["rules"].push({
                boolExpression: EdlConverter.generatePvUndefinedExpression(edl["alarmPv"]),
				propertyName: "Invisible in Operation",
				propertyValue: "true",
				id: uuidv4(),
			});
			tdl["rules"].push({
                boolExpression: EdlConverter.generatePvUndefinedExpression(edl["alarmPv"]),
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
	static convertBobToTdl = (bob: Record<string, any>): type_Rectangle_tdl => {
		console.log("\n------------", `Parsing "rectangle"`, "------------------\n");
		const tdl = this.generateDefaultTdl("Rectangle") as type_Rectangle_tdl;
		// all properties for this widget
		const propertyNames: string[] = [
			"actions", // not in tdm
			"background_color",
			"class", // not in tdm
			"corner_height",
			"corner_width",
			"height",
			"line_color",
			"line_style",
			"line_width",
			"macros", // not in tdm
			"name",
			"rules", // not in tdm
			"scripts", // not in tdm
			"tooltip", // not in tdm
			"transparent",
			"type", // not in tdm
			"visible", // not in tdm
			"width",
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
					// not backgroundColor, but fillColor
					tdl["text"]["fillColor"] = rgbaColor;
				} else if (propertyName === "transparent") {
					if (propertyValue === "true") {
						tdl["text"]["fill"] = false;
					} else if (propertyValue === "false") {
						tdl["text"]["fill"] = true;
					} else {
						tdl["text"]["fill"] = true;
					}
				} else if (propertyName === "line_color") {
					const rgbaColor = BobPropertyConverter.convertBobColor(propertyValue, undefined);
					tdl["text"]["lineColor"] = rgbaColor;
				} else if (propertyName === "line_width") {
					tdl["text"]["lineWidth"] = parseInt(propertyValue);
				} else if (propertyName === "line_style") {
					let borderStyles = ["solid", "dashed", "dotted", "dash-dot", "dash-dot-dot"];
					tdl["text"]["lineStyle"] = borderStyles[parseInt(propertyValue)];
				} else if (propertyName === "corner_width") {
					tdl["text"]["cornerWidth"] = parseInt(propertyValue);
				} else if (propertyName === "corner_height") {
					tdl["text"]["cornerHeight"] = parseInt(propertyValue);
				} else {
					console.log("Skip property", `"${propertyName}"`);
				}
			}
		}

		return tdl;
	};
}
