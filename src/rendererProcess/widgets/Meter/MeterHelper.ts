import { GlobalVariables } from "../../../common/GlobalVariables";
import { BobPropertyConverter } from "../../../mainProcess/windows/DisplayWindow/BobPropertyConverter";
import { type_rules_tdl, BaseWidgetHelper } from "../BaseWidget/BaseWidgetHelper";

export type type_Meter_tdl = {
	type: string;
	widgetKey: string;
	key: string;
	style: Record<string, any>;
	text: Record<string, any>;
	channelNames: string[];
	groupNames: string[];
	rules: type_rules_tdl;
};

export class MeterHelper extends BaseWidgetHelper {
	static _defaultTdl: type_Meter_tdl = {
		type: "Meter",
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
			// overall background color
			backgroundColor: "rgba(255, 255, 255, 1)",
			// angle
			transform: "rotate(0deg)",
			// font in the bottom channel value area
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
			// channel display on bottom
			showPvValue: true,
			horizontalAlign: "flex-start",
			verticalAlign: "flex-start",
			wrapWord: false,
			showUnit: true,
			// PV
			usePvLimits: true,
			minPvValue: 0,
			maxPvValue: 100,
			useLogScale: false,
			// dial
			angleRange: 275, // dial arc angle range
			dialColor: "rgba(0,0,0,1)", // dial arc and ticks color
			dialPercentage: 90, // dial height percentage
			dialThickness: 5, // dial arc thickness
			// pointer
			pointerColor: "rgba(255,5,7,1)",
			pointerLengthPercentage: 75, // pointer length percentage
			pointerThickness: 5,
			// label on dial
			labelPositionPercentage: 85, // tick label relative position
			// dialFontColor: "rgba(0,0,0,1)",
			// dialFontFamily: "Liberation Sans",
			// dialFontSize: 14,
			// dialFontStyle: "normal",
			// dialFontWeight: "normal",
			invisibleInOperation: false,
			// decimal, exponential, hexadecimal
			format: "default",
			// scale, >= 0
			scale: 0,
            alarmText: false,
            alarmPointer: false,
            alarmDial: false,
            alarmBackground: false,
            alarmBorder: true,
            alarmLevel: "MINOR",
		},
		channelNames: [],
		groupNames: [],
		rules: [],
	};

	// not getDefaultTdl(), always generate a new key
	static generateDefaultTdl = (type: string): type_Meter_tdl => {
		const result = super.generateDefaultTdl("Meter") as type_Meter_tdl;

		result.style = JSON.parse(JSON.stringify(this._defaultTdl.style));
		result.text = JSON.parse(JSON.stringify(this._defaultTdl.text));
		result.channelNames = JSON.parse(JSON.stringify(this._defaultTdl.channelNames));
		result.groupNames = JSON.parse(JSON.stringify(this._defaultTdl.groupNames));
		return result;
	};

	static convertBobToTdl = (bobWidgetJson: Record<string, any>): type_Meter_tdl => {
		console.log("\n------------", `Parsing "meter"`, "------------------\n");
		const tdl = this.generateDefaultTdl("Meter");
		// all properties for this widget
		const propertyNames: string[] = [
			"actions", // not in tdm
			"background_color",
			"border_alarm_sensitive",
			"class", // not in tdm
			"font",
			"foreground_color",
			"format",
			"height",
			"knob_color", // not in tdm
			"limits_from_pv",
			"maximum",
			"minimum",
			"name", // not in tdm
			"needle_color",
			"precision", 
			"pv_name",
			"rules", 
			"scripts", // not in tdm
			"show_limits", // not in tdm
			"show_units",
			"show_value",
			"tooltip", // not in tdm
			"type", // not in tdm
			"visible",
			"width",
			"x",
			"y",
		];

        tdl["style"]["left"] = 0;
        tdl["style"]["top"] = 0;
        tdl["style"]["width"] = 240;
        tdl["style"]["height"] = 120;

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
                if (propertyName === "background_color") {
                    tdl["style"]["backgroundColor"] = BobPropertyConverter.convertBobColor(propertyValue);
                } else if (propertyName === "border_alarm_sensitive") {
                    tdl["text"]["alarmBorder"] = BobPropertyConverter.convertBobBoolean(propertyValue);
                } else if (propertyName === "font") {
                    const font = BobPropertyConverter.convertBobFont(propertyValue);
                    tdl["style"]["fontSize"] = font["fontSize"];
                    tdl["style"]["fontFamily"] = font["fontFamily"];
                    tdl["style"]["fontStyle"] = font["fontStyle"];
                    tdl["style"]["fontWeight"] = font["fontWeight"];
                } else if (propertyName === "foreground_color") {
                    tdl["style"]["color"] = BobPropertyConverter.convertBobColor(propertyValue);
                } else if (propertyName === "format") {
                    tdl["text"]["format"] = BobPropertyConverter.convertBobDigitFormat(propertyValue);
                } else if (propertyName === "x") {
                    tdl["style"]["left"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "y") {
                    tdl["style"]["top"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "width") {
                    tdl["style"]["width"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "height") {
                    tdl["style"]["height"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "limits_from_pv") {
                    tdl["text"]["usePvLimits"] = BobPropertyConverter.convertBobBoolean(propertyValue);
                } else if (propertyName === "maximum") {
                    tdl["text"]["maxPvValue"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "minimum") {
                    tdl["text"]["minPvValue"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "needle_color") {
                    tdl["text"]["pointerColor"] = BobPropertyConverter.convertBobColor(propertyValue);
                } else if (propertyName === "precision") {
                    tdl["text"]["scale"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "pv_name") {
                    tdl["channelNames"].push(BobPropertyConverter.convertBobString(propertyValue));
                } else if (propertyName === "rules") {
                    tdl["rules"] = BobPropertyConverter.convertBobRules(propertyValue);
                } else if (propertyName === "show_units") {
                    tdl["text"]["showUnit"] = BobPropertyConverter.convertBobBoolean(propertyValue);
                } else if (propertyName === "show_value") {
                    tdl["text"]["showPvValue"] = BobPropertyConverter.convertBobBoolean(propertyValue);
                } else if (propertyName === "visible") {
                    tdl["text"]["invisibleInOperation"] = !BobPropertyConverter.convertBobBoolean(propertyValue);
                } else {
                    console.log("Skip property", `"${propertyName}"`);
                }
            }
        }
        
		return tdl;
	};
}
