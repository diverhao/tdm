import { Log } from "../../../../common/Log";
import { BobPropertyConverter } from "../../BobPropertyConverter";
import { BaseWidgetHelper } from "../BaseWidget/BaseWidgetHelper";
import * as GlobalMethods from "../../../../common/GlobalMethods";
import { FileReader } from "../../../file/FileReader";
import path from "path";
import { defaultRepeaterTdl, type_Repeater_tdl } from "../../../../common/types/type_widget_tdl";


export class RepeaterHelper extends BaseWidgetHelper {
    static generateDefaultTdl = (): type_Repeater_tdl => {
        const widgetKey = GlobalMethods.generateWidgetKey(defaultRepeaterTdl.type);
        return structuredClone({
            ...defaultRepeaterTdl,
            widgetKey: widgetKey,
        });
    };

    static convertBobToTdl = async (bobWidgetJson: Record<string, any>, fullTdlFileName: string) => {
        Log.info("\n------------", `Parsing "template"`, "------------------\n");
        const tdl = this.generateDefaultTdl();
        // all properties for this widget
        const propertyNames: string[] = [
            "type", // not in tdm
            "name", // not in tdm
            "class", // not in tdm
            "x",
            "y",
            "width",
            "height",
            "actions", // not in tdm
            "rules",
            "visible",
            "tooltip", // not in tdm
            "file",
            "instances",
            "horizontal", // not in tdm
            "gap",
            "wrap_count", // not in tdm
            "transparent", // not in tdm
        ];

        tdl["style"]["top"] = 0;
        tdl["style"]["left"] = 0;
        tdl["style"]["width"] = 400;
        tdl["style"]["height"] = 300;
        tdl["style"]["borderWidth"] = 0;
        tdl["text"]["gap"] = 10;

        let childrenWidgetsTdl: Record<string, any> = {};
        let instanceMacros: [string, string][][] = [];

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
                } else if (propertyName === "visible") {
                    Log.info("Skip property", `"${propertyName}"`);
                } else if (propertyName === "instances") {
                    instanceMacros = BobPropertyConverter.convertBobTemplateInstances(propertyValue);
                } else if (propertyName === "gap") {
                    tdl["text"]["gap"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "file") {
                    const fileName = BobPropertyConverter.convertBobString(propertyValue);
                    const currentFolder = path.dirname(fullTdlFileName);
                    const childTdlData = await FileReader.readTdlFile(fileName, undefined, currentFolder);
                    if (childTdlData !== undefined) {
                        childrenWidgetsTdl = childTdlData["tdl"];
                        delete (childrenWidgetsTdl as any)["Canvas"];
                    }
                } else {
                    Log.info("Skip property", `"${propertyName}"`);
                }
            }
        }

        const top0 = tdl["style"]["top"];
        const left0 = tdl["style"]["left"];
        for (const [index, widgetKey] of Object.keys(childrenWidgetsTdl).entries()) {
            tdl["widgetKeys"].push(widgetKey);
            tdl["widgetsMacros"].push(instanceMacros[index] === undefined ? [] : instanceMacros[index]);
            childrenWidgetsTdl[widgetKey]["style"]["top"] = childrenWidgetsTdl[widgetKey]["style"]["top"] + top0;
            childrenWidgetsTdl[widgetKey]["style"]["left"] = childrenWidgetsTdl[widgetKey]["style"]["left"] + left0;
        }

        const repeaterWidgetTdl: Record<string, any> = {};
        repeaterWidgetTdl[tdl["widgetKey"]] = tdl;


        return {
            ...repeaterWidgetTdl,
            ...childrenWidgetsTdl,
        };
    };
}
