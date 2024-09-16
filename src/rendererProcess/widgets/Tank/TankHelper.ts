import { GlobalVariables } from "../../global/GlobalVariables";
import { BobPropertyConverter } from "../../../mainProcess/windows/DisplayWindow/BobPropertyConverter";
import { type_rules_tdl, BaseWidgetHelper } from "../BaseWidget/BaseWidgetHelper";
import * as GlobalMethods from "../../global/GlobalMethods";
import { rgbaArrayToRgbaStr, rgbaStrToRgbaArray } from "../../global/GlobalMethods";
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
            display: "inline-block",
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
            // actually alarm outline
            alarmBorder: true,
            // channel
            // showPvValue: true,
            usePvLimits: false,
            minPvValue: 0,
            maxPvValue: 10,
            useLogScale: false,
            // tank and water colors
            fillColor: "rgba(0,200,0,1)",
            fillColorMinor: "rgba(255, 150, 100, 1)",
            fillColorMajor: "rgba(255,0,0,1)",
            fillColorInvalid: "rgba(200,0,200,1)",
            backgroundColor: "rgba(210,210,210,1)",
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
        console.log("\n------------", `Parsing Bar`, "------------------\n");
        const tdl = this.generateDefaultTdl("Tank") as type_Tank_tdl;
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
            "indicatorColor",
            "indicatorAlarm",
            "fgColor",
            "fgAlarm",
            "bgColor",
            "indicatorPv",
            "label", // ! not in tdm
            "showScale",
            "limitsFromDb",
            "origin", // not in tdm
            "font",
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
                } else if (propertyName === "indicatorAlarm") {
                    alarmPropertyNames.push(propertyName);
                } else if (propertyName === "fgColor") {
                    tdl["style"]["color"] = EdlConverter.convertEdlColor(propertyValue);
                } else if (propertyName === "fgAlarm") {
                    alarmPropertyNames.push(propertyName);
                } else if (propertyName === "bgColor") {
                    tdl["text"]["backgroundColor"] = EdlConverter.convertEdlColor(propertyValue);
                    tdl["style"]["backgroundColor"] = EdlConverter.convertEdlColor(propertyValue);
                } else if (propertyName === "indicatorPv") {
                    tdl["channelNames"].push(EdlConverter.convertEdlPv(propertyValue, true));
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
            const xt = xe + (ht-wt)/2;
            const yt = ye + (wt-ht)/2;
            tdl["style"]["left"] = xt;
            tdl["style"]["top"] = yt;
            tdl["style"]["width"] = wt;
            tdl["style"]["height"] = ht;
        }

        // all alarm-sensitive rules override others
        for (let alarmPropertyName of alarmPropertyNames) {
            if (alarmPropertyName === "indicatorAlarm") {
                const newRules = EdlConverter.convertEdlColorAlarm(EdlConverter.convertEdlPv(edl["indicatorPv"]), 1, "Water Color") as type_rules_tdl;
                tdl["rules"].push(...newRules);
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
