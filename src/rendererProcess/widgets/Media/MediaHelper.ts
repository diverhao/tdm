import { BobPropertyConverter } from "../../../mainProcess/windows/DisplayWindow/BobPropertyConverter";
import { type_rules_tdl, BaseWidgetHelper } from "../BaseWidget/BaseWidgetHelper";
import { EdlConverter } from "../../../mainProcess/windows/DisplayWindow/EdlConverter";
import { v4 as uuidv4 } from "uuid";

export type type_Media_tdl = {
	type: string;
	widgetKey: string;
	key: string;
	style: Record<string, any>;
	text: Record<string, any>;
	channelNames: string[];
	groupNames: string[];
	rules: type_rules_tdl;
};

export class MediaHelper extends BaseWidgetHelper {
	static _defaultTdl: type_Media_tdl = {
		type: "Media",
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
			backgroundColor: "rgba(0, 0, 0, 0)",
            // angle
			transform: "rotate(0deg)",
			color: "rgba(0,0,0,1)",
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
			// media file name, could be picture types, pdf, or video type
			fileName: "../../../mainProcess/resources/webpages/tdm-logo.svg",
			// opacity
			opacity: 1,
			// for picture
			stretchToFit: false,
			invisibleInOperation: false,
            fileContents: "",
			// actually "alarm outline"
			alarmBorder: true,
            alarmBackground: false,
            alarmLevel: "MINOR",

		},
		channelNames: [],
		groupNames: [],
		rules: [],
	};

	// not getDefaultTdl(), always generate a new key
	static generateDefaultTdl = (type: string): type_Media_tdl => {
		// defines type, widgetKey, and key
		const result = super.generateDefaultTdl(type) as type_Media_tdl;
		result.style = JSON.parse(JSON.stringify(this._defaultTdl.style));
		result.text = JSON.parse(JSON.stringify(this._defaultTdl.text));
		result.channelNames = JSON.parse(JSON.stringify(this._defaultTdl.channelNames));
		result.groupNames = JSON.parse(JSON.stringify(this._defaultTdl.groupNames));
		return result;
	};

	static convertEdlToTdl = (edl: Record<string, string>): type_Media_tdl => {
		console.log("\n------------", `Parsing "GIF Image" or "PNG Image"`, "------------------\n");
		const tdl = this.generateDefaultTdl("Media") as type_Media_tdl;

		const propertyNames: string[] = [
			"beginObjectProperties", // not in tdm
			"major", // not in tdm
			"minor", // not in tdm
			"release", // not in tdm
			"x",
			"y",
			"w",
			"h",
			"file",
			"uniformSize", // not in tdm
			"fastErase", // not in tdm
			"noErase", // not in tdm
			"endObjectProperties", // not in tdm
		];


		// default differences
		tdl["text"]["alarmBorder"] = false;

        
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
				} else if (propertyName === "file") {
					tdl["text"]["fileName"] = propertyValue.replaceAll('"',"");
				// } else if (propertyName === "fgColor") {
				// 	tdl["style"]["color"] = EdlConverter.convertEdlColor(
				// 		propertyValue
				// 		// EdlConverter.convertEdlPv(edl["controlPv"]),
				// 		// "Text Color",
				// 		// tdl
				// 	);
				// } else if (propertyName === "fgAlarm") {
				// 	alarmPropertyNames.push(propertyName);
				// } else if (propertyName === "bgColor") {
				// 	tdl["style"]["backgroundColor"] = EdlConverter.convertEdlColor(propertyValue);
				// } else if (propertyName === "controlPv") {
				// 	// it is a control-type widget, only use real channel name, i.e. "val0" or "loc://abc"
				// 	tdl["channelNames"].push(EdlConverter.convertEdlPv(propertyValue));
				// } else if (propertyName === "font") {
				// 	const { fontFamily, fontWeight, fontSize, fontStyle } = EdlConverter.convertEdlFont(propertyValue);
				// 	tdl["style"]["fontFamily"] = fontFamily;
				// 	tdl["style"]["fontStyle"] = fontStyle;
				// 	tdl["style"]["fontSize"] = fontSize;
				// 	tdl["style"]["fontWeight"] = fontWeight;
				} else {
					console.log("Skip property", `"${propertyName}"`);
				}
			}
		}

		return tdl;
	};

	static convertBobToTdl = (bob: Record<string, any>): type_Media_tdl => {
		console.log("\n------------", `Parsing "picture"`, "------------------\n");
		const tdl = this.generateDefaultTdl("Media");
		// all properties for this widget
		const propertyNames: string[] = [
			"actions", // not in tdm
			"class", // not in tdm
			"file",
			"height",
			"macros", // not in tdm
			"name", // not in tdm
			"opacity",
			"rotation",
			"rules", // not in tdm
			"scripts", // not in tdm
			"stretch_image",
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
				} else if (propertyName === "file") {
					tdl["text"]["fileName"] = propertyValue;
				} else if (propertyName === "opacity") {
					tdl["text"]["opacity"] = parseFloat(propertyValue);
				} else if (propertyName === "rotation") {
					tdl["style"]["transform"] = `rotate(${parseInt(propertyValue)}deg)`;
				} else if (propertyName === "stretch_image") {
					tdl["text"]["stretchToFit"] = BobPropertyConverter.convertBobBoolean(propertyValue);
				} else {
					console.log("Skip property", `"${propertyName}"`);
				}
			}
		}

		return tdl;
	};
}
