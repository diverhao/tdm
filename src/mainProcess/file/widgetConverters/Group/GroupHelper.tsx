import { Log } from "../../../../common/Log";
import { BobPropertyConverter } from "../../BobPropertyConverter";
import { BaseWidgetHelper } from "../BaseWidget/BaseWidgetHelper";
import { defaultGroupTdl, type_Group_tdl } from "../../../../common/types/type_widget_tdl";
import { generateWidgetKey } from "../../../../common/GlobalMethods";

export class GroupHelper extends BaseWidgetHelper {

    static legacyArraysToItems = (
        itemNames: string[],
        itemBackgroundColors: string[],
        widgetKeys: string[][],
    ): type_Group_tdl["items"] => {
        return itemNames.map((itemName, index) => ({
            name: itemName,
            backgroundColor: itemBackgroundColors[index] ?? defaultGroupTdl.items[0].backgroundColor,
            widgetKeys: structuredClone(widgetKeys[index] ?? []),
        }));
    };

    static generateDefaultTdl = (): type_Group_tdl => {
        const widgetKey = generateWidgetKey(defaultGroupTdl.type);
        return structuredClone({
            ...defaultGroupTdl,
            widgetKey: widgetKey,
            key: widgetKey,
        });
    };

    /**
     * "group" and "tabs" are converted to Group
     */
    static convertBobToTdl = async (bobWidgetJson: Record<string, any>, type: "group" | "tabs", convertBobSuffix: boolean): Promise<Record<string, any>> => {
        Log.info("\n------------", `Parsing "${type}"`, "------------------\n");
        const tdl = this.generateDefaultTdl();
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
        let itemNames = tdl["items"].map((item) => item["name"]);
        let itemWidgetKeys = tdl["items"].map((item) => structuredClone(item["widgetKeys"]));
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
                } else if (propertyName === "name") {
                    itemNames[0] = BobPropertyConverter.convertBobString(propertyValue);
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
                    widgetsTdl = await BobPropertyConverter.convertBobGroupWidgets(propertyValue, convertBobSuffix);
                } else if (propertyName === "tabs" && type === "tabs") {
                    const tabsData = propertyValue;
                    const tabsResult = await BobPropertyConverter.convertBobTabsTabs(tabsData, convertBobSuffix);
                    itemNames = tabsResult["itemNames"];
                    widgetsTdl = tabsResult["widgetsTdl"];
                    itemWidgetKeys = tabsResult["widgetKeys"];
                } else {
                    Log.info("Skip property", `"${propertyName}"`);
                }
            }
        }


        const itemBackgroundColors = itemNames.map(() => tdl["style"]["backgroundColor"]);

        if (transparent === true) {
            const originalRgbaColor = tdl["style"]["backgroundColor"];
            const rgbaColorArray = originalRgbaColor.split(",");
            rgbaColorArray[3] = "0)";
            const newColor = rgbaColorArray.join(",");
            tdl["style"]["backgroundColor"] = newColor;
            if (itemBackgroundColors[0] !== undefined) {
                itemBackgroundColors[0] = newColor;
            }
        }

        tdl["items"] = this.legacyArraysToItems(itemNames, itemBackgroundColors, itemWidgetKeys);


        if (type === "tabs") {
            // if a widget is not in the selected tab, hide it
            for (let index = 0; index < itemWidgetKeys.length; index++) {
                if (index !== tdl["text"]["selectedGroup"]) {
                    for (const widgetKey of itemWidgetKeys[index]) {
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
            };

        }
    };
}
