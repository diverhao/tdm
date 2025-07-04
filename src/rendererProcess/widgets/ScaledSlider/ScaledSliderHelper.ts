import { GlobalVariables } from "../../global/GlobalVariables";
import { BobPropertyConverter } from "../../../mainProcess/windows/DisplayWindow/BobPropertyConverter";
import { type_rules_tdl, BaseWidgetHelper, type_BaseWidget_tdl } from "../BaseWidget/BaseWidgetHelper";
import * as GlobalMethods from "../../global/GlobalMethods";
import { rgbaArrayToRgbaStr, rgbaStrToRgbaArray } from "../../global/GlobalMethods";
import { EdlConverter } from "../../../mainProcess/windows/DisplayWindow/EdlConverter";
import { v4 as uuidv4 } from "uuid";

export type type_ScaledSlider_tdl = {
	type: string;
	widgetKey: string;
	key: string;
	style: Record<string, any>;
	text: Record<string, any>;
	channelNames: string[];
	groupNames: string[];
	rules: type_rules_tdl;
};

export class ScaledSliderHelper extends BaseWidgetHelper {
	// override BaseWidget
	static _defaultTdl: type_ScaledSlider_tdl = {
		type: "ScaledSlider",
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
			// border, it is different from the "alarmBorder" below
			borderStyle: "solid",
			borderWidth: 0,
			borderColor: "rgba(255, 0, 0, 1)",
			// shows when the widget is selected
			outlineStyle: "none",
			outlineWidth: 1,
			outlineColor: "black",
		},
		text: {
			showUnit: true,
			// PV related
			minPvValue: 0,
			maxPvValue: 10,
			usePvLimits: false,
            numTickIntervals: 10,
            // layout
            showPvValue: true,
            showLabels: true,
            // control
			stepSize: 1,
			invisibleInOperation: false,
			// decimal, exponential, hexadecimal
			format: "default",
			// scale, >= 0
			scale: 0,
            compactScale: false,
            // "contemporary" | "traditional"
            appearance: "traditional",
            // slide bar background color
            fillColor: "rgba(180, 180, 180, 1)",
            // slide bar highlight area color
            // sliderBarBackgroundColor1: "rgba(180, 180, 180, 1)",
            alarmBorder: true,
            alarmText: false,
            alarmFill: false,
            alarmBackground: false,
            alarmLevel: "MINOR",
		},
		channelNames: [],
		groupNames: [],
		rules: [],
	};

	// override
	static generateDefaultTdl = (type: string): type_ScaledSlider_tdl => {
		// defines type, widgetKey, and key
		const result = super.generateDefaultTdl(type);
		result.style = JSON.parse(JSON.stringify(this._defaultTdl.style));
		result.text = JSON.parse(JSON.stringify(this._defaultTdl.text));
		result.channelNames = JSON.parse(JSON.stringify(this._defaultTdl.channelNames));
		result.groupNames = JSON.parse(JSON.stringify(this._defaultTdl.groupNames));
		return result as type_ScaledSlider_tdl;
	};

	static convertEdlToTdl = (edl: Record<string, string>): type_ScaledSlider_tdl => {
		console.log("\n------------", `Parsing "Motif Slider"`, "------------------\n");
		const tdl = this.generateDefaultTdl("ScaledSlider") as type_ScaledSlider_tdl;
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
			"fgColor",
			"bgColor",
			"bgAlarm",
			"2ndBgColor",
			"topShadowColor", // not in tdm
			"botShadowColor", // not in tdm
			"increment",
			"controlPv",
			"controlLabel", // not in tdm
			"controlLabelType", // ! what is it
			"font",
			"limitsFromDb",
			"showLimits", // these 4 are converted to TDM compactScale bit
			"showLabel", 
			"showValue",
			"showSavedValue",
			"orientation",
			"displayFormat",
			"precision",
			"scaleMin",
			"scaleMax",
			"endObjectProperties", // not in tdm
			// Slider specific
			"readLabel", // not in tdm
			"readLabelType", // not in tdm
			"incMultiplier", // not in tdm
			"controlColor", // not in tdm
			"indicatorColor", // not in tdm
			"indicatorPv", // not in tdm
			"savedValuePv", // not in tdm
		];

		const alarmPropertyNames: string[] = [];

		// default differences
		tdl["text"]["alarmBorder"] = false;
		tdl["text"]["showUnit"] = false;
        tdl["text"]["compactScale"] = true;
        tdl["text"]["appearance"] = "traditional";
        tdl["text"]["showPvValue"] = false; // always false, this is handled by compactScale
        tdl["text"]["showLabels"] = false;
        tdl["text"]["usePvLimits"] = true;
        let orientation = "horizontal";
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
					tdl["style"]["color"] = EdlConverter.convertEdlColor(propertyValue);
				} else if (propertyName === "bgColor") {
					tdl["style"]["backgroundColor"] = EdlConverter.convertEdlColor(
						propertyValue,
						EdlConverter.convertEdlPv(edl["controlPv"]),
						"Text Color",
						tdl
					);
					tdl["text"]["sliderBarBackgroundColor1"] = EdlConverter.convertEdlColor(
						propertyValue,
						EdlConverter.convertEdlPv(edl["controlPv"]),
						"Text Color",
						tdl
					);
				} else if (propertyName === "2ndBgColor") {
					tdl["text"]["sliderBarBackgroundColor"] = EdlConverter.convertEdlColor(
						propertyValue,
						EdlConverter.convertEdlPv(edl["controlPv"]),
						"Text Color",
						tdl
					);
				} else if (propertyName === "bgAlarm") {
					alarmPropertyNames.push(propertyName);
				} else if (propertyName === "increment") {
					tdl["text"]["stepSize"] = EdlConverter.convertEdlNumber(propertyValue);
				} else if (propertyName === "controlPv") {
					// it is a control-type widget, use real pv name
					tdl["channelNames"].push(EdlConverter.convertEdlPv(propertyValue, true, true));
				} else if (propertyName === "font") {
					const { fontFamily, fontWeight, fontSize, fontStyle } = EdlConverter.convertEdlFont(propertyValue);
					tdl["style"]["fontFamily"] = fontFamily;
					tdl["style"]["fontStyle"] = fontStyle;
					tdl["style"]["fontSize"] = fontSize;
					tdl["style"]["fontWeight"] = fontWeight;
				} else if (propertyName === "limitsFromDb") {
					tdl["text"]["usePvLimits"] = EdlConverter.convertEdlBoolean(propertyValue);
				} else if (propertyName === "showValue") {
					// tdl["text"]["compactScale"] = EdlConverter.convertEdlBoolean(propertyValue);
                    tdl["text"]["showLabels"] = EdlConverter.convertEdlBoolean(propertyValue);
				} else if (propertyName === "showLimits") {
					// tdl["text"]["compactScale"] = EdlConverter.convertEdlBoolean(propertyValue);
                    tdl["text"]["showLabels"] = EdlConverter.convertEdlBoolean(propertyValue);
				} else if (propertyName === "showLabel") {
					// tdl["text"]["compactScale"] = EdlConverter.convertEdlBoolean(propertyValue);
				} else if (propertyName === "showSavedValue") {
					tdl["text"]["compactScale"] = EdlConverter.convertEdlBoolean(propertyValue);
				} else if (propertyName === "orientation") {
					tdl["style"]["transform"] = propertyValue.includes("vertical") ? "rotate(270deg)" : "rotate(0deg)";
                    if (propertyValue.includes("vertical")) {
                        orientation = "vertical";
                    }
				} else if (propertyName === "scaleMin") {
					tdl["text"]["minPvValue"] = EdlConverter.convertEdlNumber(propertyValue);
				} else if (propertyName === "scaleMax") {
					tdl["text"]["maxPvValue"] = EdlConverter.convertEdlNumber(propertyValue);
				} else if (propertyName === "displayMode") {
					tdl["text"]["format"] = EdlConverter.convertEdlDisplayMode(propertyValue);
				} else if (propertyName === "precision") {
					tdl["text"]["scale"] = EdlConverter.convertEdlPrecision(propertyValue);
				} else {
					console.log("Skip property", `"${propertyName}"`);
				}
			}
		}

        // transform
        if (orientation === "vertical") {
            const xe = tdl["style"]["left"];
            const ye = tdl["style"]["top"];
            const we = tdl["style"]["width"];
            const he = tdl["style"]["height"];
            const ht = we;
            const wt = he;
            const xt = xe + (ht-wt)/2;
            const yt = ye + (wt-ht)/2;
            tdl["style"]["left"] = xt;
            tdl["style"]["top"] = yt;
            tdl["style"]["width"] = wt;
            tdl["style"]["height"] = ht;
        }


		// all alarm-sensitive rules override others
		for (let alarmPropertyName of alarmPropertyNames) {
			if (alarmPropertyName === "bgAlarm") {
				const newRules_Labels = EdlConverter.convertEdlColorAlarm(
					EdlConverter.convertEdlPv(edl["controlPv"]),
					1,
					"Background Color"
				) as type_rules_tdl;
				tdl["rules"].push(...newRules_Labels);
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
			});
			tdl["rules"].push({
                boolExpression: EdlConverter.generatePvUndefinedExpression(edl["controlPv"]),
				propertyName: "Outline Width",
				propertyValue: "1",
				id: uuidv4(),
			});
			tdl["rules"].push({
                boolExpression: EdlConverter.generatePvUndefinedExpression(edl["controlPv"]),
				propertyName: "Outline Color",
				propertyValue: "rgba(255,255,255,1)",
				id: uuidv4(),
			});
			tdl["rules"].push({
                boolExpression: EdlConverter.generatePvUndefinedExpression(edl["controlPv"]),
				propertyName: "Outline Style",
				propertyValue: "solid",
				id: uuidv4(),
			});
		}

		return tdl;
	};
}
