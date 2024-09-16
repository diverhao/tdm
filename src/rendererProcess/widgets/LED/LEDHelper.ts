import { GlobalVariables } from "../../global/GlobalVariables";
import { BobPropertyConverter } from "../../../mainProcess/windows/DisplayWindow/BobPropertyConverter";
import { type_rules_tdl, BaseWidgetHelper } from "../BaseWidget/BaseWidgetHelper";

export type type_LED_tdl = {
	type: string;
	widgetKey: string;
	key: string;
	style: Record<string, any>;
	text: Record<string, any>;
	channelNames: string[];
	groupNames: string[];
	rules: type_rules_tdl;
	itemNames: string[];
	itemColors: string[];
	itemValues: (number | string | number[] | string[] | undefined)[];
};

export class LEDHelper extends BaseWidgetHelper {
	static _defaultTdl: type_LED_tdl = {
		type: "LED",
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
			backgroundColor: "rgba(240, 240, 240, 0.2)",
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
			wrapWord: false,
			showUnit: false,
			alarmBorder: true,
			// LED line style, not the border/outline line
			lineWidth: 2,
			lineStyle: "solid",
			lineColor: "rgba(50, 50, 50, 0.698)",
			// round or square
			shape: "round",
			// use channel value
			bit: -1,
			// if the value is not valid
			fallbackColor: "rgba(255,0,255,1)",
			// use channel's value and label, only valid for EPICS enum channels
			// that has "strings" property
			useChannelItems: false,
            invisibleInOperation: false,
		},
		channelNames: [],
		groupNames: [],
		rules: [],
		itemNames: ["", ""],
		itemColors: ["rgba(60, 100, 60, 1)", "rgba(0, 255, 0, 1)"],
		itemValues: [0, 1],
	};
	// not getDefaultTdl(), always generate a new key
	static generateDefaultTdl = (type: string): type_LED_tdl => {
		const result = super.generateDefaultTdl("LED") as type_LED_tdl;
		result.style = JSON.parse(JSON.stringify(this._defaultTdl.style));
		result.text = JSON.parse(JSON.stringify(this._defaultTdl.text));
		result.channelNames = JSON.parse(JSON.stringify(this._defaultTdl.channelNames));
		result.groupNames = JSON.parse(JSON.stringify(this._defaultTdl.groupNames));
		result.itemNames = JSON.parse(JSON.stringify(this._defaultTdl.itemNames));
		result.itemColors = JSON.parse(JSON.stringify(this._defaultTdl.itemColors));
		result.itemValues = JSON.parse(JSON.stringify(this._defaultTdl.itemValues));
		return result;
	};

	static convertBobToTdl = (bob: Record<string, any>): type_LED_tdl => {
		console.log("\n------------", `Parsing "led"`, "------------------\n");
		const tdl = this.generateDefaultTdl("LED");
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
			"rules", // not in tdm
			"scripts", // not in tdm
			"square",
			"tooltip", // not in tdm
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
				} else if (propertyName === "pv_name") {
					tdl["channelNames"].push(propertyValue);
				} else if (propertyName === "bit") {
					tdl["text"]["bit"] = parseInt(propertyValue);
				} else if (propertyName === "border_alarm_sensitive") {
					tdl["text"]["alarmBorder"] = BobPropertyConverter.convertBobBoolean(propertyValue);
				} else if (propertyName === "font") {
					const font = BobPropertyConverter.convertBobFont(propertyValue);
					tdl["style"]["fontSize"] = font["fontSize"];
					tdl["style"]["fontFamily"] = font["fontFamily"];
					tdl["style"]["fontStyle"] = font["fontStyle"];
					tdl["style"]["fontWeight"] = font["fontWeight"];
				} else if (propertyName === "foreground_color") {
					const rgbaColor = BobPropertyConverter.convertBobColor(propertyValue, undefined);
					tdl["style"]["color"] = rgbaColor;
				} else if (propertyName === "labels_from_pv") {
					tdl["text"]["useChannelItems"] = BobPropertyConverter.convertBobBoolean(propertyValue);
				} else if (propertyName === "line_color") {
					const rgbaColor = BobPropertyConverter.convertBobColor(propertyValue, undefined);
					tdl["text"]["lineColor"] = rgbaColor;
				} else if (propertyName === "off_color") {
					const rgbaColor = BobPropertyConverter.convertBobColor(propertyValue, undefined);
					tdl["itemColors"][0] = rgbaColor;
				} else if (propertyName === "on_color") {
					const rgbaColor = BobPropertyConverter.convertBobColor(propertyValue, undefined);
					tdl["itemColors"][1] = rgbaColor;
				} else if (propertyName === "off_label") {
					tdl["itemNames"][0] = propertyValue;
				} else if (propertyName === "on_label") {
					tdl["itemNames"][1] = propertyValue;
				} else if (propertyName === "square") {
					tdl["text"]["shape"] = BobPropertyConverter.convertBobBoolean(propertyValue) === true ? "square" : "round";
				} else {
					console.log("Skip property", `"${propertyName}"`);
				}
			}
		}

		return tdl;
	};
}
