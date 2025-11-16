import { GlobalVariables } from "../../global/GlobalVariables";
import { BobPropertyConverter } from "../../../mainProcess/windows/DisplayWindow/BobPropertyConverter";
import { type_rules_tdl, BaseWidgetHelper } from "../BaseWidget/BaseWidgetHelper";
import * as GlobalMethods from "../../global/GlobalMethods";
import { rgbaArrayToRgbaStr, rgbaStrToRgbaArray } from "../../global/GlobalMethods";
import { EdlConverter } from "../../../mainProcess/windows/DisplayWindow/EdlConverter";
import { v4 as uuidv4 } from "uuid";

export type type_EmbeddedDisplay_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
    tdlFileNames: string[];
    itemNames: string[];
    itemMacros: [string, string][][];
    itemIsWebpage: boolean[];
};

export class EmbeddedDisplayHelper extends BaseWidgetHelper {
    static _defaultTdl: type_EmbeddedDisplay_tdl = {
        type: "EmbeddedDisplay",
        widgetKey: "",
        key: "",
        style: {
            //basics
            position: "absolute",
            display: "inline-flex",
            // dimensions
            left: 100,
            top: 100,
            width: 100,
            height: 100,
            backgroundColor: "rgba(240, 240, 240, 1)",
            // angle
            transform: "rotate(0deg)",
            // border, it is different from the "alarmBorder" below,
            borderStyle: "solid",
            borderWidth: 0,
            borderColor: "rgba(0, 0, 0, 1)",
            // font
            color: "rgba(0,0,0,1)",
            fontFamily: GlobalVariables.defaultFontFamily,
            fontSize: GlobalVariables.defaultFontSize,
            fontStyle: GlobalVariables.defaultFontStyle,
            fontWeight: GlobalVariables.defaultFontWeight,
            // shows when the widget is selected
            outlineStyle: "none",
            outlineWidth: 1,
            outlineColor: "black",
        },
        text: {
            // display tab text alignment
            horizontalAlign: "flex-start",
            verticalAlign: "flex-start",
            // wrapWord: true,
            // showUnit: false,
            // actually "alarm outline"
            alarmBorder: false,
            // macros
            externalMacros: [],
            useParentMacros: false,
            useExternalMacros: false,
            // tab
            tabPosition: "top",
            tabWidth: 100,
            tabHeight: 20,
            tabSelectedColor: "rgba(180,180,180,1)",
            tabDefaultColor: "rgba(220,220,220,1)",
            showTab: true,
            // isWebpage: false,
            resize: "none", // "none" | "crop" | "fit"
        },
        channelNames: [],
        groupNames: [],
        rules: [],
        // tdl files names / web link
        tdlFileNames: [],
        // labels
        itemNames: [],
        // macros
        itemMacros: [],
        itemIsWebpage: [],
    };
    // not getDefaultTdl(), always generate a new key
    static generateDefaultTdl = (type: string): type_EmbeddedDisplay_tdl => {
        const result = super.generateDefaultTdl(type) as type_EmbeddedDisplay_tdl;
        result.style = JSON.parse(JSON.stringify(this._defaultTdl.style));
        result.text = JSON.parse(JSON.stringify(this._defaultTdl.text));
        result.channelNames = JSON.parse(JSON.stringify(this._defaultTdl.channelNames));
        result.groupNames = JSON.parse(JSON.stringify(this._defaultTdl.groupNames));
        result.tdlFileNames = JSON.parse(JSON.stringify(this._defaultTdl.tdlFileNames));
        result.itemNames = JSON.parse(JSON.stringify(this._defaultTdl.itemNames));
        result.itemMacros = JSON.parse(JSON.stringify(this._defaultTdl.itemMacros));
        result.itemIsWebpage = JSON.parse(JSON.stringify(this._defaultTdl.itemIsWebpage));
        return result;
    };

    static convertEdlToTdl = (edl: Record<string, any>, convertEdlSufffix: boolean = false): type_EmbeddedDisplay_tdl | void => {
        console.log("\n------------", `Parsing "Embedded Window"`, "------------------\n");
        const tdl = this.generateDefaultTdl("EmbeddedDisplay") as type_EmbeddedDisplay_tdl;
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
        tdl["tdlFileNames"] = [];
        tdl["itemNames"] = [];
        tdl["itemMacros"] = [];
        tdl["itemIsWebpage"] = [];
        tdl["text"]["useParentMacros"] = true;
        tdl["text"]["useExternalMacros"] = true;
        // const alarmPropertyNames: string[] = [];

        for (const propertyName of propertyNames) {
            const propertyValue = edl[propertyName];
            if (propertyValue === undefined) {
                console.log("Property", `"${propertyName}"`, "is not in edl file");
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
                        tdl["tdlFileNames"] = tdlFileNames;
                        tdl["itemNames"] = itemNames;
                        tdl["itemMacros"] = itemMacros;
                        tdl["itemIsWebpage"] = itemIsWebpage;
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
                            tdl["tdlFileNames"] =
                                convertEdlSufffix === true
                                    ? [edlFile.replaceAll(".edl", ".tdl")]
                                    : [edlFile];
                            tdl["itemNames"] = [""];
                            // todo
                            tdl["itemMacros"] = [[]];
                            tdl["itemIsWebpage"] = [false];
                        }
                    } else {
                        // ! stringPv
                        console.log("PV as embedded window file name not implemented");
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
                    console.log("Skip property", `"${propertyName}"`);
                }
            }
        }

        // console.log(tdl);

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
        // 		console.log("Skip alarm-sensitive property", alarmPropertyName);
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
        console.log("\n------------", `Parsing "embedded"`, "------------------\n");
        const tdl = this.generateDefaultTdl("EmbeddedDisplay");
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
        tdl["itemIsWebpage"] = [];


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
                    tdl["itemMacros"].push(BobPropertyConverter.convertBobMacros(propertyValue));
                } else if (propertyName === "file") {
                    const fileName = (BobPropertyConverter.convertBobString(propertyValue));
                    if (convertBobSufffix === true) {
                        tdl["tdlFileNames"].push(fileName.replaceAll(".bob", ".tdl").replaceAll(".plt", ".tdl"))
                    } else {
                        tdl["tdlFileNames"].push(fileName);
                    }
                    tdl["itemNames"].push("")
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
                    tdl["tdlFileNames"] = tabsResult["tdlFileNames"];
                    tdl["itemMacros"] = tabsResult["itemMacros"];
                    tdl["itemNames"] = tabsResult["itemNames"];
                } else if (propertyName === "url") {
                    tdl["tdlFileNames"].push(BobPropertyConverter.convertBobString(propertyValue));
                    tdl["itemIsWebpage"].push(true);
                    tdl["itemNames"].push("");
                } else {
                    console.log("Skip property", `"${propertyName}"`);
                }
            }
        }

        if (type === "embedded") {
            if (tdl["itemMacros"].length < 1 && tdl["tdlFileNames"].length > 0) {
                tdl["itemMacros"].push([]);
            }
        } else if (type === "navtabs") {
            for (const tdlFileName of tdl["tdlFileNames"]) {
                tdl["itemIsWebpage"].push(false);
            }
            // in navtabs, the tabs are part of the width and height
            tdl["style"]["top"] = tdl["style"]["top"] + 35;
            tdl["style"]["height"] = tdl["style"]["height"] - 35;
        } else {
            tdl["text"]["showTab"] = false;
        }

        tdl["itemIsWebpage"].length = 0;
        for (let ii = 0; ii < tdl["tdlFileNames"].length; ii++) {
            tdl["itemIsWebpage"].push(false);
        }

        return tdl;
    };
}
