import { Log } from "../../../../common/Log";
import { BobPropertyConverter } from "../../BobPropertyConverter";
import { BaseWidgetHelper } from "../BaseWidget/BaseWidgetHelper";
import * as GlobalMethods from "../../../../common/GlobalMethods";
import { rgbaArrayToRgbaStr, rgbaStrToRgbaArray } from "../../../../common/GlobalMethods";
import { EdlConverter } from "../../EdlConverter";
import { v4 as uuidv4 } from "uuid";
import { defaultEmbeddedDisplayTdl, type_EmbeddedDisplay_display_tdl, type_EmbeddedDisplay_tdl } from "../../../../common/types/type_widget_tdl";

export class EmbeddedDisplayHelper extends BaseWidgetHelper {
    static generateDefaultTdl = (): type_EmbeddedDisplay_tdl => {
        const widgetKey = GlobalMethods.generateWidgetKey(defaultEmbeddedDisplayTdl.type);
        return structuredClone({
            ...defaultEmbeddedDisplayTdl,
            widgetKey: widgetKey,
        });
    };

    static createDisplay = (
        tdlFileName: string = "",
        name: string = "",
        macros: [string, string][] = [],
        isWebpage: boolean = false
    ): type_EmbeddedDisplay_display_tdl => {
        return {
            tdlFileName,
            name,
            macros,
            isWebpage,
        };
    };

    static legacyArraysToDisplays = (
        tdlFileNames: unknown[] = [],
        itemNames: unknown[] = [],
        itemMacros: unknown[] = [],
        itemIsWebpage: unknown[] = []
    ): type_EmbeddedDisplay_display_tdl[] => {
        const displayCount = Math.max(tdlFileNames.length, itemNames.length, itemMacros.length, itemIsWebpage.length);

        return Array.from({ length: displayCount }, (_, index) =>
            this.createDisplay(
                typeof tdlFileNames[index] === "string" ? tdlFileNames[index] : "",
                typeof itemNames[index] === "string" ? itemNames[index] : "",
                Array.isArray(itemMacros[index]) ? (itemMacros[index] as [string, string][]) : [],
                itemIsWebpage[index] === true
            )
        );
    };

    static convertEdlToTdl = (edl: Record<string, any>, convertEdlSufffix: boolean = false): type_EmbeddedDisplay_tdl | void => {
        Log.info("\n------------", `Parsing "Embedded Window"`, "------------------\n");
        const tdl = this.generateDefaultTdl();
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
            "fgColor", // not in tdm
            "bgColor", // not in tdm
            "topShadowColor", // not in tdm
            "botShadowColor", // not in tdm
            "displaySource",
            "filePv",
            "labelPv", // ! not in tdm, shall we implement it?
            "file",
            "sizeOfs",
            "numDsps",
            "displayFileName",
            "menuLabel",
            "symbols",
            "endObjectProperties", // not in tdm
        ];

        // default differences
        // tdl["text"]["verticalAlign"] = "center";
        // tdl["text"]["wrapWord"] = false;
        tdl["text"]["showTab"] = false;
        tdl["displays"] = [];
        tdl["text"]["useParentMacros"] = true;
        tdl["text"]["useExternalMacros"] = true;
        // const alarmPropertyNames: string[] = [];

        for (const propertyName of propertyNames) {
            const propertyValue = edl[propertyName];
            if (propertyValue === undefined) {
                Log.info("Property", `"${propertyName}"`, "is not in edl file");
                continue;
            } else {
                if (propertyName === "x") {
                    tdl["style"]["left"] = EdlConverter.convertEdlXorY(propertyValue, edl["lineWidth"]);
                } else if (propertyName === "y") {
                    tdl["style"]["top"] = EdlConverter.convertEdlXorY(propertyValue, edl["lineWidth"]);
                } else if (propertyName === "w") {
                    tdl["style"]["width"] = EdlConverter.convertEdlWorH(propertyValue, edl["lineWidth"]);
                } else if (propertyName === "h") {
                    tdl["style"]["height"] = EdlConverter.convertEdlWorH(propertyValue, edl["lineWidth"]);
                } else if (propertyName === "displaySource") {
                    if (propertyValue.replaceAll(`"`, "") === "menu") {
                        // Menu
                        const { tdlFileNames, itemNames, itemMacros, itemIsWebpage } = EdlConverter.convertEdlEmbeddedWindowMenu(
                            edl["displayFileName"],
                            edl["menuLabel"],
                            edl["symbols"],
                            convertEdlSufffix
                        );
                        tdl["displays"] = this.legacyArraysToDisplays(tdlFileNames, itemNames, itemMacros, itemIsWebpage);
                        const filePv = EdlConverter.convertEdlPv(edl["filePv"]);
                        tdl["rules"].push({
                            boolExpression: `true`,
                            propertyName: "Select Tab Index",
                            propertyValue: `[${filePv}]`,
                            id: uuidv4(),
                        });
                    } else if (propertyValue.replaceAll(`"`, "") === "file") {
                        // Form
                        if (edl["file"] !== undefined) {
                            let edlFile = edl["file"].replaceAll(`"`, "");
                            if (!edlFile.includes(".edl")) {
                                edlFile = edlFile + ".edl";
                            }
                            const tdlFileName = convertEdlSufffix === true ? edlFile.replaceAll(".edl", ".tdl") : edlFile;
                            tdl["displays"] = [this.createDisplay(tdlFileName, "", [], false)];
                        }
                    } else {
                        // ! stringPv
                        Log.info("PV as embedded window file name not implemented");
                    }
                    // --------------------------------
                    // } else if (propertyName === "controlPv") {
                    // 	tdl["channelNames"].push(EdlConverter.convertEdlPv(propertyValue));
                    // } else if (propertyName === "fgColor") {
                    // 	// the text color honors the ruled-color
                    // 	tdl["style"]["color"] = EdlConverter.convertEdlColor(propertyValue, edl["controlPv"], "Text Color", tdl);
                    // 	// edm border color does not honor the ruled-color, it uses the default color if it is
                    // 	// set as ruled-color
                    // 	tdl["style"]["borderColor"] = EdlConverter.convertEdlColor(propertyValue);
                    // } else if (propertyName === "bgColor") {
                    // 	// edm background border color does not honor the ruled-color, it used the default color if it is
                    // 	// set as ruled-color
                    // 	tdl["style"]["backgroundColor"] = EdlConverter.convertEdlColor(propertyValue);
                    // } else if (propertyName === "font") {
                    // 	const { fontFamily, fontWeight, fontSize, fontStyle } = EdlConverter.convertEdlFont(propertyValue);
                    // 	tdl["style"]["fontFamily"] = fontFamily;
                    // 	tdl["style"]["fontStyle"] = fontStyle;
                    // 	tdl["style"]["fontSize"] = fontSize;
                    // 	tdl["style"]["fontWeight"] = fontWeight;
                    // } else if (propertyName === "fontAlign") {
                    // 	tdl["text"]["horizontalAlign"] = EdlConverter.convertEdlFontAlign(propertyValue);
                    // } else if (propertyName === "lineWidth") {
                    // 	tdl["style"]["borderWidth"] = parseInt(propertyValue);
                    // } else if (propertyName === "lineAlarm") {
                    // 	alarmPropertyNames.push(propertyName);
                    // } else if (propertyName === "fgAlarm") {
                    // 	alarmPropertyNames.push(propertyName);
                    // } else if (propertyName === "bgAlarm") {
                    // 	alarmPropertyNames.push(propertyName);
                } else {
                    Log.info("Skip property", `"${propertyName}"`);
                }
            }
        }

        // Log.info(tdl);

        // // all alarm-sensitive rules override others
        // for (let alarmPropertyName of alarmPropertyNames) {
        // 	if (alarmPropertyName === "lineAlarm") {
        // 		const newRules = EdlConverter.convertEdlBorderAlarm(edl["controlPv"], 0) as type_rules_tdl;
        // 		tdl["rules"].push(...newRules);
        // 		if (edl["controlPv"] !== undefined) {
        // 			tdl["rules"].push({
        // 				boolExpression: `[${edl["controlPv"].replaceAll(`"`, "")}.SEVR] < 0.5`,
        // 				propertyName: "Border Width",
        // 				propertyValue: "0",
        // 				id: uuidv4(),
        // 			});
        // 		}
        // 	} else if (alarmPropertyName === "fgAlarm") {
        // 		const newRules = EdlConverter.convertEdlFgAlarm(edl["controlPv"], 0) as type_rules_tdl;
        // 		tdl["rules"].push(...newRules);
        // 	} else if (alarmPropertyName === "bgAlarm") {
        // 		// only "Text Monitor" has it
        // 		const newRules = EdlConverter.convertEdlBgAlarm(edl["controlPv"], 0) as type_rules_tdl;
        // 		tdl["rules"].push(...newRules);
        // 	} else {
        // 		Log.info("Skip alarm-sensitive property", alarmPropertyName);
        // 	}
        // }

        // if (edl["fill"] === "false" || edl["fill"] === undefined) {
        // 	const colorArray = rgbaStrToRgbaArray(tdl["style"]["backgroundColor"]);
        // 	colorArray[3] = 0;
        // 	const colorStr = rgbaArrayToRgbaStr(colorArray);
        // 	tdl["style"]["backgroundColor"] = colorStr;
        // }

        // // if alarmPv exists in edl setting, but its value is not available in operation, the widget becomes invisible
        // // These behaviors override the alarm-sensitive
        // if (edl["colorPv"] !== undefined) {
        // 	tdl["rules"].push({
        // 		boolExpression: `[${edl["colorPv"].replaceAll(`"`, "")}] == undefined`,
        // 		propertyName: "Text Color",
        // 		propertyValue: "rgba(255,255,255,1)",
        // 		id: uuidv4(),
        // 	});
        // 	// tdl["rules"].push({
        // 	// 	boolExpression: `[${edl["colorPv"].replaceAll(`"`, "")}] == undefined`,
        // 	// 	propertyName: "Background Color",
        // 	// 	propertyValue: "rgba(255,255,255,0)",
        // 	// 	id: uuidv4(),
        // 	// });
        // 	// tdl["rules"].push({
        // 	// 	boolExpression: `[${edl["colorPv"].replaceAll(`"`, "")}] == undefined`,
        // 	// 	propertyName: "Border Width",
        // 	// 	propertyValue: "1",
        // 	// 	id: uuidv4(),
        // 	// });
        // 	// tdl["rules"].push({
        // 	// 	boolExpression: `[${edl["colorPv"].replaceAll(`"`, "")}] == undefined`,
        // 	// 	propertyName: "Border Color",
        // 	// 	propertyValue: "rgba(255,255,255,1)",
        // 	// 	id: uuidv4(),
        // 	// });
        // }
        // // if controlPv exists in edl setting, but its value is not available in operation, the widget becomes invisible
        // // These behaviors override the alarm-sensitive
        // if (edl["controlPv"] !== undefined) {
        // 	tdl["rules"].push({
        // 		boolExpression: `[${edl["controlPv"].replaceAll(`"`, "")}] == undefined`,
        // 		propertyName: "Text Color",
        // 		propertyValue: "rgba(255,255,255,1)",
        // 		id: uuidv4(),
        // 	});
        // 	// tdl["rules"].push({
        // 	// 	boolExpression: `[${edl["controlPv"].replaceAll(`"`, "")}] == undefined`,
        // 	// 	propertyName: "Background Color",
        // 	// 	propertyValue: "rgba(255,255,255,0)",
        // 	// 	id: uuidv4(),
        // 	// });
        // 	// tdl["rules"].push({
        // 	// 	boolExpression: `[${edl["controlPv"].replaceAll(`"`, "")}] == undefined`,
        // 	// 	propertyName: "Border Width",
        // 	// 	propertyValue: "1",
        // 	// 	id: uuidv4(),
        // 	// });
        // 	// tdl["rules"].push({
        // 	// 	boolExpression: `[${edl["controlPv"].replaceAll(`"`, "")}] == undefined`,
        // 	// 	propertyName: "Border Color",
        // 	// 	propertyValue: "rgba(255,255,255,1)",
        // 	// 	id: uuidv4(),
        // 	// });
        // }
        return tdl;
    };

    static convertBobToTdl = (bobWidgetJson: Record<string, any>, type: "embedded" | "navtabs" | "webbrowser", convertBobSufffix: boolean = false): type_EmbeddedDisplay_tdl => {
        Log.info("\n------------", `Parsing "embedded"`, "------------------\n");
        const tdl = this.generateDefaultTdl();
        // all properties for this widget
        const propertyNames: string[] = [
            "name", // not in tdm
            "type", // not in tdm
            "x",
            "y",
            "width",
            "height",
            "tooltip", // not in tdm
            "scripts", // not in tdm
            "rules",
            "class", // not in tdm
            "visible", // not in tdm
            "macros",
            "file",
            "resize",
            "group_name", // not in tdm
            "transparent", // not in tdm
            "border_width",
            "border_color",
            // belows are only in "navtabs"
            "direction", // not in tdm
            "tab_width", // not in tdm
            "tab_height", // not in tdm
            "tab_spacing", // not in tdm
            "selected_color", // not in tdm
            "deselected_color", // not in tdm
            "font",
            "active_tab", // not in tdm
            "tabs",
            // below are only in webbrowser
            "url",
            "show_toolbar", // not in tdm
        ];

        tdl["style"]["width"] = 100;
        tdl["style"]["height"] = 30;
        tdl["style"]["top"] = 0;
        tdl["style"]["left"] = 0;
        let tdlFileNames: string[] = [];
        let itemNames: string[] = [];
        let itemMacros: [string, string][][] = [];
        let itemIsWebpage: boolean[] = [];


        for (const propertyName of propertyNames) {
            const propertyValue = bobWidgetJson[propertyName];
            if (propertyValue === undefined) {
                if (propertyName === "widget") {
                    Log.info(`There are one or more widgets inside "display"`);
                } else {
                    Log.info("Property", `"${propertyName}"`, "is not in bob file");
                }
                continue;
            } else {
                if (propertyName === "x") {
                    tdl["style"]["left"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "y") {
                    tdl["style"]["top"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "width") {
                    tdl["style"]["width"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "height") {
                    tdl["style"]["height"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "rules") {
                    tdl["rules"] = BobPropertyConverter.convertBobRules(propertyValue);
                } else if (propertyName === "macros") {
                    itemMacros.push(BobPropertyConverter.convertBobMacros(propertyValue));
                } else if (propertyName === "file") {
                    const fileName = (BobPropertyConverter.convertBobString(propertyValue));
                    if (convertBobSufffix === true) {
                        tdlFileNames.push(fileName.replaceAll(".bob", ".tdl").replaceAll(".plt", ".tdl"))
                    } else {
                        tdlFileNames.push(fileName);
                    }
                    itemNames.push("")
                } else if (propertyName === "border_width") {
                    tdl["style"]["borderWidth"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "border_color") {
                    tdl["style"]["borderColor"] = BobPropertyConverter.convertBobColor(propertyValue);
                } else if (propertyName === "resize") {
                    tdl["text"]["resize"] = BobPropertyConverter.convertBobEmbeddedDisplayResize(propertyValue);
                } else if (propertyName === "font") {
                    const font = BobPropertyConverter.convertBobFont(propertyValue);
                    tdl["style"]["fontSize"] = font["fontSize"];
                    tdl["style"]["fontWeight"] = font["fontWeight"];
                    tdl["style"]["fontStyle"] = font["fontStyle"];
                    tdl["style"]["fontFamily"] = font["fontFamily"];
                } else if (propertyName === "tabs") {
                    const tabsResult = BobPropertyConverter.convertBobNavTabsTabs(propertyValue);
                    tdlFileNames = tabsResult["tdlFileNames"];
                    itemMacros = tabsResult["itemMacros"];
                    itemNames = tabsResult["itemNames"];
                } else if (propertyName === "url") {
                    tdlFileNames.push(BobPropertyConverter.convertBobString(propertyValue));
                    itemIsWebpage.push(true);
                    itemNames.push("");
                } else {
                    Log.info("Skip property", `"${propertyName}"`);
                }
            }
        }

        if (type === "navtabs") {
            // in navtabs, the tabs are part of the width and height
            tdl["style"]["top"] = tdl["style"]["top"] + 35;
            tdl["style"]["height"] = tdl["style"]["height"] - 35;
        } else if (type !== "embedded") {
            tdl["text"]["showTab"] = false;
        }

        tdl["displays"] = this.legacyArraysToDisplays(tdlFileNames, itemNames, itemMacros, itemIsWebpage);

        return tdl;
    };
}
