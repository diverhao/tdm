import { GlobalVariables } from "../../global/GlobalVariables";
import { BobPropertyConverter } from "../../../mainProcess/windows/DisplayWindow/BobPropertyConverter";
import { type_rules_tdl, BaseWidgetHelper } from "../BaseWidget/BaseWidgetHelper";
import { EdlConverter } from "../../../mainProcess/windows/DisplayWindow/EdlConverter";
import { v4 as uuidv4 } from "uuid";

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

/**
 * edm does not have LED widget, but its Button widget may come with 
 * visPv which shows the status of another PV, we generate a regular
 * button and a LED for this edm Button widget
 */
export class LEDHelper extends BaseWidgetHelper {
	static _defaultTdl: type_LED_tdl = {
		type: "LED",
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
            fallbackText: "Err",
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

    // if a edm Button has indicatorPv, we convert this widget to a BooleanButton and a LED
    // the Boolean Button is invisible, laying on the top, the LED shows the indicatorPv
    // edl does not have LED widget type, this type in edlJSON is simply a copy of edl Button
    static convertEdlToTdl_Button = (edl: Record<string, any>, type: "Button"): type_LED_tdl | undefined => {
        console.log("\n------------", `Parsing "Button"`, "------------------\n");
        const tdl = this.generateDefaultTdl("LED") as type_LED_tdl;
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
            //  if true, the text color is overridden. When the "controlPv" is MINOR severity, text color is yellow,
            //  MAJOR is red, otherwise is green
            //  already implemented a rule to for it
            "onColor",
            "offColor",
            "inconsistentColor",
            "topShadowColor", // not in tdm
            "botShadowColor", // not in tdm
            "controlPv",
            "indicatorPv", // ! not in tdm. The "Reacback PV" on edl setting page. If this is set, the background 3d effect is controled by
            // ! this PV. It uses the "readBitPos" below
            // ! can be realized by rule
            "readBitPos", // ! not in tdm, it is the bit # of above "indicatorPv"
            "onLabel",
            "offLabel",
            "labelType",
            "buttonType", // "Button" specific, "push and reset" or nothing ("toggle")
            "toggle", // "MessageButton" specific, true ("toggle") or nothing (could be "push and reset", "push no reset", or "push nothing and set")
            "invisible",
            "font",
            "objType", // ! not in tdm, what is it?
            "visPv",
            "visMin",
            "visMax",
            "visInvert",
            "colorPv", // it controls the ruled-color for background and text
            "controlBitPos",
            "endObjectProperties", // not in tdm
            // Message button specific
            "pressValue", // corresponds to onLabel, onColor
            "releaseValue", // corresponds to offLabe, offColor
            "useEnumNumeric", // ! not in tdm, looks like not working
        ];

        tdl["text"]["alarmBorder"] = false;
        tdl["text"]["bit"] = -1;
        tdl["text"]["shape"] = "square";
        tdl["text"]["useChannelItems"] = true;

        if (edl["indicatorPv"] === undefined || type !== "Button") {
            return undefined;
        }

        const alarmPropertyNames: string[] = [];

        let hasPressValue = false;
        let hasReleaseValue = false;

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
                    tdl["style"]["color"] = EdlConverter.convertEdlColor(propertyValue, EdlConverter.convertEdlPv(edl["colorPv"]), "Text Color", tdl);
                } else if (propertyName === "inconsistentColor") {
                    tdl["text"]["fallbackColor"] = EdlConverter.convertEdlColor(propertyValue);
                } else if (propertyName === "onColor") {
                    tdl["itemColors"][1] = EdlConverter.convertEdlColor(propertyValue);
                } else if (propertyName === "offColor") {
                    tdl["itemColors"][0] = EdlConverter.convertEdlColor(propertyValue);
                } else if (propertyName === "onLabel" && edl["labelType"]?.replaceAll(`"`, "") === "literal" && type === "Button") {
                    tdl["itemNames"][1] = propertyValue.replaceAll(`"`, "");
                } else if (propertyName === "offLabel" && edl["labelType"]?.replaceAll(`"`, "") === "literal" && type === "Button") {
                    tdl["itemNames"][0] = propertyValue.replaceAll(`"`, "");
                } else if (propertyName === "labelType") {
                    tdl["text"]["useChannelItems"] = edl["labelType"]?.replaceAll(`"`, "") === "literal" ? false : true;
                } else if (propertyName === "indicatorPv") {
                    tdl["channelNames"].push(EdlConverter.convertEdlPv(propertyValue, true, true));
                } else if (propertyName === "font") {
                    const { fontFamily, fontWeight, fontSize, fontStyle } = EdlConverter.convertEdlFont(propertyValue);
                    tdl["style"]["fontFamily"] = fontFamily;
                    tdl["style"]["fontStyle"] = fontStyle;
                    tdl["style"]["fontSize"] = fontSize;
                    tdl["style"]["fontWeight"] = fontWeight;
                } else if (propertyName === "controlBitPos") {
                    tdl["text"]["bit"] = EdlConverter.convertEdlNumber(propertyValue);
                } else if (propertyName === "visPv") {
                    const newRules = EdlConverter.convertEdlVisPv(
                        EdlConverter.convertEdlPv(propertyValue),
                        edl["visMin"],
                        edl["visMax"],
                        edl["visInvert"]
                    ) as type_rules_tdl;
                    if (newRules.length > 0) {
                        tdl["rules"].push(...newRules);
                    }
                } else if (propertyName === "fgAlarm") {
                    alarmPropertyNames.push(propertyName);
                    // Message button specific
                } else if (propertyName === "invisible") {
                    const newRules = EdlConverter.convertEdlInvisible(propertyValue) as type_rules_tdl;
                    tdl["rules"].push(...newRules);
                } else {
                    console.log("Skip property", `"${propertyName}"`);
                }
            }
        }

        // for (let alarmPropertyName of alarmPropertyNames) {
        //     // only for Button, not for "Message Button"
        //     if (alarmPropertyName === "fgAlarm") {
        //         // if the fgAlarm === "true", the text color becomes green if there is no additional rule
        //         // we are not going to change the tdl["tyle"]["color"], instead, we add a rule
        //         // so that in editing mode, we still have the default color
        //         tdl["rules"].push({
        //             boolExpression: `true`,
        //             propertyName: "Text Color",
        //             propertyValue: "rgba(0,255,0,1)",
        //             id: uuidv4(),
        //         });
        //         const newRules = EdlConverter.convertEdlFgAlarm(EdlConverter.convertEdlPv(edl["controlPv"]), 1) as type_rules_tdl;
        //         tdl["rules"].push(...newRules);
        //     } else {
        //         console.log("Skip alarm-sensitive property", alarmPropertyName);
        //     }
        // }

        // // if alarmPv exists in edl setting, but its value is not available in operation, the widget becomes invisible
        // // These behaviors override the alarm-sensitive
        // if (edl["colorPv"] !== undefined) {
        //     tdl["rules"].push({
        //         boolExpression: EdlConverter.generatePvUndefinedExpression(edl["colorPv"]),
        //         propertyName: "Invisible in Operation",
        //         propertyValue: "true",
        //         id: uuidv4(),
        //     });
        //     tdl["rules"].push({
        //         boolExpression: EdlConverter.generatePvUndefinedExpression(edl["colorPv"]),
        //         propertyName: "Alarm Border",
        //         propertyValue: "true",
        //         id: uuidv4(),
        //     });
        // }
        
        // if visPv exists in edl setting, but its value is not available in operation, the widget becomes invisible
        // These behaviors override the alarm-sensitive
        // this behavior is only for Button, not for "Message Button"
        if (edl["indicatorPv"] !== undefined && type === "Button") {
            tdl["rules"].push({
                boolExpression: EdlConverter.generatePvUndefinedExpression(edl["indicatorPv"]),
                propertyName: "Invisible in Operation",
                propertyValue: "true",
                id: uuidv4(),
            });
            // tdl["rules"].push({
            //     boolExpression: EdlConverter.generatePvUndefinedExpression(edl["visPv"]),
            //     propertyName: "Alarm Border",
            //     propertyValue: "true",
            //     id: uuidv4(),
            // });
        }

        // // if visPv exists in edl setting, but its value is not available in operation, the widget becomes invisible
        // // These behaviors override the alarm-sensitive
        // if (edl["visPv"] !== undefined) {
        //     tdl["rules"].push({
        //         boolExpression: EdlConverter.generatePvUndefinedExpression(edl["visPv"]),
        //         propertyName: "Invisible in Operation",
        //         propertyValue: "true",
        //         id: uuidv4(),
        //     });
        //     tdl["rules"].push({
        //         boolExpression: EdlConverter.generatePvUndefinedExpression(edl["visPv"]),
        //         propertyName: "Alarm Border",
        //         propertyValue: "true",
        //         id: uuidv4(),
        //     });
        // }
        return tdl;
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
