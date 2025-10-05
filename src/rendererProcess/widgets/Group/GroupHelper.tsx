import { GlobalVariables } from "../../global/GlobalVariables";
import { BobPropertyConverter } from "../../../mainProcess/windows/DisplayWindow/BobPropertyConverter";
import { type_rules_tdl, BaseWidgetHelper } from "../BaseWidget/BaseWidgetHelper";
import * as GlobalMethods from "../../global/GlobalMethods";
import { rgbaArrayToRgbaStr, rgbaStrToRgbaArray } from "../../global/GlobalMethods";
import { EdlConverter } from "../../../mainProcess/windows/DisplayWindow/EdlConverter";
import { v4 as uuidv4 } from "uuid";


export type type_Group_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
    itemNames: string[];
    itemBackgroundColors: string[];
    widgetKeys: string[][];
};

export class GroupHelper extends BaseWidgetHelper {


    // properties when we create a new TextUpdate
    // the level 1 properties all have corresponding public or private variable in the widget
    static _defaultTdl: type_Group_tdl = {
        type: "Group",
        widgetKey: "", // "key" is a reserved keyword
        key: "",
        // the style for outmost div
        // these properties are explicitly defined in style because they are
        // (1) different from default CSS settings, or
        // (2) they may be modified
        style: {
            position: "absolute",
            display: "inline-flex",
            backgroundColor: "rgba(240, 240, 240, 0)",
            left: 100,
            top: 100,
            width: 150,
            height: 80,
            outlineStyle: "none",
            outlineWidth: 1,
            outlineColor: "black",
            transform: "rotate(0deg)",
            color: "rgba(0,0,0,1)",
            borderStyle: "solid",
            borderWidth: 1,
            borderColor: "rgba(0, 0, 0, 1)",
            fontFamily: GlobalVariables.defaultFontFamily,
            fontSize: GlobalVariables.defaultFontSize,
            fontStyle: GlobalVariables.defaultFontStyle,
            fontWeight: GlobalVariables.defaultFontWeight,
        },
        // the ElementBody style
        text: {
            horizontalAlign: "flex-start",
            verticalAlign: "flex-start",
            wrapWord: true,
            showUnit: false,
            alarmBorder: true,
            selectedGroup: 0,
            tabPosition: "top",
            tabWidth: 100,
            tabHeight: 20,
            tabSelectedColor: "rgba(180,180,180,1)",
            tabDefaultColor: "rgba(220,220,220,1)",
            showTab: true,
            showBox: false,
        },
        channelNames: [],
        groupNames: [],
        rules: [],
        itemNames: ["Group-1"],
        itemBackgroundColors: ["rgba(255,255,255,1)"],
        widgetKeys: [[]],
    };

    // not getDefaultTdl(), always generate a new key
    static generateDefaultTdl = (type: string): type_Group_tdl => {
        const result = super.generateDefaultTdl(type);
        result.style = JSON.parse(JSON.stringify(this._defaultTdl.style));
        result.text = JSON.parse(JSON.stringify(this._defaultTdl.text));
        result.channelNames = JSON.parse(JSON.stringify(this._defaultTdl.channelNames));
        result.groupNames = JSON.parse(JSON.stringify(this._defaultTdl.groupNames));
        result.itemNames = JSON.parse(JSON.stringify(this._defaultTdl.itemNames));
        result.itemBackgroundColors = JSON.parse(JSON.stringify(this._defaultTdl.itemBackgroundColors));
        result.widgetKeys = JSON.parse(JSON.stringify(this._defaultTdl.widgetKeys));
        return result as type_Group_tdl;
    };

    /**
     * "group" and "tabs" are converted to Group
     */
    static convertBobToTdl = async (bobWidgetJson: Record<string, any>, type: "group" | "tabs"): Promise<type_Group_tdl> => {
        console.log("\n------------", `Parsing "${type}"`, "------------------\n");
        const tdl = this.generateDefaultTdl("Group");
        // all properties for this widget
        const propertyNames: string[] = [
            "name",
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
            "macros", // not in tdm
            "style",
            "font",
            "foreground_color",
            "background_color",
            "transparent",
            "widget",
            "direction", // in Tabs, not in tdm
            "tab_height", // in Tabs, not in tdm
            "tabs", // in Tabs
        ];

        tdl["style"]["width"] = 300;
        tdl["style"]["height"] = 200;
        if (type === "tabs") {
            tdl["style"]["width"] = 400;
            tdl["style"]["width"] = 300;
        }

        tdl["style"]["top"] = 0;
        tdl["style"]["left"] = 0;

        let transparent = false;
        let groupStyle = 0;
        if (type === "group") {
            tdl["text"]["showTab"] = false;
            tdl["text"]["showBox"] = true;
            tdl["style"]["borderWidth"] = 0;
        }



        let widgetsTdl: Record<string, any> = {};
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
                } else if (propertyName === "name") {
                    tdl["itemNames"][0] = BobPropertyConverter.convertBobString(propertyValue);
                } else if (propertyName === "width") {
                    tdl["style"]["width"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "height") {
                    tdl["style"]["height"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "rules") {
                    tdl["rules"] = BobPropertyConverter.convertBobRules(propertyValue);
                } else if (propertyName === "font") {
                    const font = BobPropertyConverter.convertBobFont(propertyValue);
                    tdl["style"]["fontSize"] = font["fontSize"];
                    tdl["style"]["fontWeight"] = font["fontWeight"];
                    tdl["style"]["fontStyle"] = font["fontStyle"];
                    tdl["style"]["fontFamily"] = font["fontFamily"];
                } else if (propertyName === "background_color") {
                    const rgbaColor = BobPropertyConverter.convertBobColor(propertyValue);
                    tdl["style"]["backgroundColor"] = rgbaColor;
                } else if (propertyName === "foreground_color") {
                    const rgbaColor = BobPropertyConverter.convertBobColor(propertyValue);
                    tdl["style"]["color"] = rgbaColor;
                } else if (propertyName === "transparent") {
                    transparent = BobPropertyConverter.convertBobBoolean(propertyValue);
                } else if (propertyName === "style") {
                    tdl["text"]["showBox"] = BobPropertyConverter.convertBobGroupStyle(propertyValue);
                    groupStyle = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "widget" && type === "group") {
                    widgetsTdl = await BobPropertyConverter.convertBobGroupWidgets(propertyValue);
                } else if (propertyName === "tabs" && type === "tabs") {
                    const tabsData = propertyValue;
                    const tabsResult = await BobPropertyConverter.convertBobTabsTabs(tabsData);
                    tdl["itemNames"] = tabsResult["itemNames"];
                    widgetsTdl = tabsResult["widgetsTdl"];
                    tdl["widgetKeys"] = tabsResult["widgetKeys"];
                } else {
                    console.log("Skip property", `"${propertyName}"`);
                }
            }
        }


        tdl["itemBackgroundColors"] = [];
        for (const itemName of tdl["itemNames"]) {
            tdl["itemBackgroundColors"].push(tdl["style"]["backgroundColor"]);
        }

        if (transparent === true) {
            const originalRgbaColor = tdl["style"]["backgroundColor"];
            const rgbaColorArray = originalRgbaColor.split(",");
            rgbaColorArray[3] = "0)";
            const newColor = rgbaColorArray.join(",");
            tdl["style"]["backgroundColor"] = newColor;
            tdl["itemBackgroundColors"][0] = newColor;
        }


        if (type === "tabs") {
            // if a widget is not in the selected tab, hide it
            for (let index = 0; index < tdl["widgetKeys"].length; index++) {
                if (index !== tdl["text"]["selectedGroup"]) {
                    for (const widgetKey of tdl["widgetKeys"][index]) {
                        widgetsTdl[widgetKey]["style"]["visibility"] = "hidden";
                    }
                }
            }
            // the tab is part of the widget size in bob file
            tdl["style"]["top"] = tdl["style"]["top"] + 40;
            tdl["style"]["height"] = tdl["style"]["height"] - 40;
        }

        // reposition the children widgets
        const left0 = tdl["style"]["left"];
        const top0 = tdl["style"]["top"];
        for (const [widgetKey, widgetTdl] of Object.entries(widgetsTdl)) {
            // tdl["widgetKeys"][0].push(widgetKey);
            const offset = tdl["text"]["showBox"] === true ? 15 : 0;
            widgetTdl["style"]["left"] = widgetTdl["style"]["left"] + left0 + offset;
            widgetTdl["style"]["top"] = widgetTdl["style"]["top"] + top0 + offset;
        }

        // result is an object that contains the Group widget and all its children widgets
        const groupWidgetTdl: Record<string, any> = {};
        groupWidgetTdl[tdl["widgetKey"]] = tdl;


        if (transparent === true && groupStyle === 3) {
            // this is a group, not a group widget
            return widgetsTdl as any;
        } else {
            return {
                ...groupWidgetTdl, // group widget tdl
                ...widgetsTdl, // children widget tdls
            } as any;

        }
    };
}
