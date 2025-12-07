import { BobPropertyConverter } from "../../../mainProcess/windows/DisplayWindow/BobPropertyConverter";
import { rgbaArrayToRgbaStr, rgbaStrToRgbaArray } from "../../../common/GlobalMethods";
import { EdlConverter } from "../../../mainProcess/windows/DisplayWindow/EdlConverter";

export type type_Canvas_tdl = Record<string, any> & {
	type: "Canvas";
	widgetKey: "Canvas";
	key: "Canvas";
	style: Record<string, number | string>;
	macros: [string, string][];
	replaceMacros: boolean;
	windowName: string;
};

export class CanvasHelper {

	private static _defaultTdl: type_Canvas_tdl = {
		type: "Canvas",
		widgetKey: "Canvas",
		key: "Canvas",
		style: {
			// basics
			position: "fixed",
			display: "inline-block",
			// dimensions
			left: 0,
			top: 0,
			height: 500,
			width: 500,
			backgroundColor: `rgba(255, 255, 255, 1)`,
			// others
			margin: 0,
			border: 0,
			padding: 0,
			overflow: "hidden",
		},
        macros: [],
        replaceMacros: false,
        windowName: "",
        script: "",
        xGridSize: 1,
        yGridSize: 1,
        gridColor: "rgba(128,128,128,1)",
        showGrid: true,
	};

	// not getDefaultTdl(), always generate a new key
	static generateDefaultTdl = (): type_Canvas_tdl => {
		const result = JSON.parse(JSON.stringify(this._defaultTdl));
		return result;
	};
	// ------------------------------- converter ---------------------

	static convertEdlToTdl = (edl: Record<string, string>): type_Canvas_tdl => {
		console.log("\n------------", `Parsing "ScreenProperties"`, "------------------\n");
		const tdl = this.generateDefaultTdl() as type_Canvas_tdl;
		// all properties for this widget
		// from act_win.cc
		const propertyNames: string[] = [
			"beginScreenProperties", // not in tdm
			"major", // not in tdm
			"minor", // not in tdm
			"release", // not in tdm
			"x",
			"y",
			"w",
			"h",
			"font", // not in tdm
			"fontAlign", // not in tdm
			"ctlFont", // not in tdm
			"ctlFontAlign", // not in tdm
			"btnFont", // not in tdm
			"btnFontAlign", // not in tdm
			"fgColor", // not in tdm
			"bgColor",
			"textColor", // not in tdm
			"ctlFgColor1", // not in tdm
			"ctlFgColor2", // not in tdm
			"ctlBgColor1", // not in tdm
			"ctlBgColor2", // not in tdm
			"topShadowColor", // not in tdm
			"botShadowColor", // not in tdm
			"title",
			"showGrid", // not in tdm
			"snapToGrid", // not in tdm
			"gridSize", // not in tdm
			"orthoLineDraw", // not in tdm
			"pvType", // not in tdm
			"disableScroll", // not in tdm
			"pixmapFlag", // not in tdm
			"templateParams", // not in tdm
			"templateInfo", // not in tdm
			"endScreenProperties", // not in tdm
		];

		for (const propertyName of propertyNames) {
			const propertyValue = edl[propertyName];
			if (propertyValue === undefined) {
				console.log("Property", `"${propertyName}"`, "is not in edl file");
				continue;
			} else {
				if (propertyName === "x") {
					// tdl["style"]["left"] = parseInt(propertyValue);
				} else if (propertyName === "y") {
					// tdl["style"]["top"] = parseInt(propertyValue);
				} else if (propertyName === "w") {
					tdl["style"]["width"] = parseInt(propertyValue);
				} else if (propertyName === "h") {
					tdl["style"]["height"] = parseInt(propertyValue);
				} else if (propertyName === "title") {
					tdl["windowName"] = propertyValue;
				} else if (propertyName === "bgColor") {
					tdl["style"]["backgroundColor"] = EdlConverter.convertEdlColor(propertyValue);
				} else {
					console.log("Skip property", `"${propertyName}"`);
				}
			}
		}

		return tdl;
	};
	/**
	 * Convert .bob to .tdl
	 */
	static convertBobToTdl = (bobJson: Record<string, any>): type_Canvas_tdl => {
		console.log("---------------", `Parsing "display to Canvas"`, "------------------\n");
		const tdl = this.generateDefaultTdl();
		// all properties for this widget
		const propertyNames: string[] = [
			"background_color",
			"class", // not in tdm
			"grid_color", // not in tdm
			"grid_step_x",
			"grid_step_y",
			"grid_visible",
			"height",
			"macros",
			"name",
			"actions", // todo
			"rules", // todo
			"scripts", // todo
			"type", // not in tdm
			"width",
			"x", // always 0 in tdm
			"y", // alwasy 0 in tdm
		];

        tdl["style"]["width"] = 800;
        tdl["style"]["height"] = 600;

		for (const propertyName of propertyNames) {
			const propertyValue = bobJson[propertyName];
			if (propertyValue === undefined) {
				if (propertyName === "widget") {
					console.log(`There are one or more widgets inside "display"`);
				} else {
					console.log("Property", `"${propertyName}"`, "is not in bob file");
				}
				continue;
			} else {
				if (propertyName === "name") {
					tdl["windowName"] = BobPropertyConverter.convertBobString(propertyValue);
				} else if (propertyName === "width") {
					tdl["style"]["width"] = BobPropertyConverter.convertBobNum(propertyValue);
				} else if (propertyName === "height") {
                    tdl["style"]["height"] = BobPropertyConverter.convertBobNum(propertyValue);
				} else if (propertyName === "background_color") {
					const rgbaColor = BobPropertyConverter.convertBobColor(propertyValue);
					tdl["style"]["backgroundColor"] = rgbaColor;
				} else if (propertyName === "grid_color") {
					const rgbaColor = BobPropertyConverter.convertBobColor(propertyValue);
					tdl["gridColor"] = rgbaColor;
				} else if (propertyName === "grid_step_x") {
					tdl["xGridSize"] = BobPropertyConverter.convertBobNum(propertyValue);
				} else if (propertyName === "grid_step_y") {
					tdl["yGridSize"] = BobPropertyConverter.convertBobNum(propertyValue);
				} else if (propertyName === "grid_visible") {
					tdl["showGrid"] = BobPropertyConverter.convertBobBoolean(propertyValue);
				} else if (propertyName === "macros") {
					tdl["macros"] = BobPropertyConverter.convertBobMacros(propertyValue);
				} else if (propertyName === "rules") {
					tdl["rules"] = BobPropertyConverter.convertBobRules(propertyValue);
				} else {
					console.log("Skip property", `"${propertyName}"`);
				}
			}
		}
		return tdl;
	};
}
