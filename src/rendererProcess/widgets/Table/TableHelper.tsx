import { GlobalVariables } from "../../global/GlobalVariables";
import { BobPropertyConverter } from "../../../mainProcess/windows/DisplayWindow/BobPropertyConverter";
import { type_rules_tdl, BaseWidgetHelper } from "../BaseWidget/BaseWidgetHelper";
import * as GlobalMethods from "../../global/GlobalMethods";
import { rgbaArrayToRgbaStr, rgbaStrToRgbaArray } from "../../global/GlobalMethods";
import { EdlConverter } from "../../../mainProcess/windows/DisplayWindow/EdlConverter";
import { v4 as uuidv4 } from "uuid";
import { FileReader } from "../../../mainProcess/file/FileReader";
import path from "path";

export type type_Table_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
    // itemNames: string[];
    // itemBackgroundColors: string[];
    widgetKeys: string[];
    macros: [string, string][][]; // this macro is for this Table widget only, not the macro for the whole display
};


export class TableHelper extends BaseWidgetHelper {

    // properties when we create a new TextUpdate
    // the level 1 properties all have corresponding public or private variable in the widget
    static _defaultTdl: type_Table_tdl = {
        type: "Table",
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
            gap: 5,
        },
        channelNames: [],
        groupNames: [],
        rules: [],

        widgetKeys: [],
        macros: [],
    };

    // not getDefaultTdl(), always generate a new key
    static generateDefaultTdl = (type: string): type_Table_tdl => {
        const result = super.generateDefaultTdl(type);
        result.style = JSON.parse(JSON.stringify(this._defaultTdl.style));
        result.text = JSON.parse(JSON.stringify(this._defaultTdl.text));
        result.channelNames = JSON.parse(JSON.stringify(this._defaultTdl.channelNames));
        // result.groupNames = JSON.parse(JSON.stringify(this._defaultTdl.groupNames));
        // result.itemNames = JSON.parse(JSON.stringify(this._defaultTdl.itemNames));
        // result.itemBackgroundColors = JSON.parse(JSON.stringify(this._defaultTdl.itemBackgroundColors));
        result.widgetKeys = JSON.parse(JSON.stringify(this._defaultTdl.widgetKeys));
        result.macros = JSON.parse(JSON.stringify(this._defaultTdl.macros));
        return result as type_Table_tdl;
    };

    static convertBobToTdl = async (bobWidgetJson: Record<string, any>, fullTdlFileName: string) => {
        console.log("\n------------", `Parsing "template"`, "------------------\n");
        const tdl = this.generateDefaultTdl("Table");
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
                } else if (propertyName === "visible") {
                    tdl["text"]["invisibleInOperation"] = !BobPropertyConverter.convertBobBoolean(propertyValue);
                } else if (propertyName === "instances") {
                    tdl["macros"] = BobPropertyConverter.convertBobTemplateInstances(propertyValue);
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
                    console.log("Skip property", `"${propertyName}"`);
                }
            }
        }

        const top0 = tdl["style"]["top"];
        const left0 = tdl["style"]["left"];
        for (const widgetKey of Object.keys(childrenWidgetsTdl)) {
            tdl["widgetKeys"].push(widgetKey);
            childrenWidgetsTdl[widgetKey]["style"]["top"] = childrenWidgetsTdl[widgetKey]["style"]["top"] + top0;
            childrenWidgetsTdl[widgetKey]["style"]["left"] = childrenWidgetsTdl[widgetKey]["style"]["left"] + left0;
        }

        const tableWidgetTdl: Record<string, any> = {};
        tableWidgetTdl[tdl["widgetKey"]] = tdl;


        return {
            ...tableWidgetTdl,
            ...childrenWidgetsTdl,
        };
    };
}
