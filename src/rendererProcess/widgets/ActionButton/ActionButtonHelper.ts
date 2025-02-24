import { GlobalVariables } from "../../global/GlobalVariables";
import { BobPropertyConverter } from "../../../mainProcess/windows/DisplayWindow/BobPropertyConverter";
import { type_rules_tdl, BaseWidgetHelper } from "../BaseWidget/BaseWidgetHelper";
import * as GlobalMethods from "../../global/GlobalMethods";
import { rgbaArrayToRgbaStr, rgbaStrToRgbaArray } from "../../global/GlobalMethods";
import { EdlConverter } from "../../../mainProcess/windows/DisplayWindow/EdlConverter";
import { v4 as uuidv4 } from "uuid";
import path from "path";

export type type_action_opendisplay_tdl = {
    type: "OpenDisplay";
    label: string;
    fileName: string;
    externalMacros: [string, string][];
    useParentMacros: boolean;
};

export type type_action_writepv_tdl = {
    type: "WritePV";
    label: string;
    channelName: string;
    channelValue: string;
};

export type type_action_executescript_tdl = {
    type: "ExecuteScript";
    label: string;
    fileName: string;
};

export type type_action_executecommand_tdl = {
    type: "ExecuteCommand";
    label: string;
    command: string;
};

export type type_action_openwebpage_tdl = {
    type: "OpenWebPage";
    label: string;
    url: string;
};

export type type_actions_tdl = (
    | type_action_opendisplay_tdl
    | type_action_writepv_tdl
    | type_action_executecommand_tdl
    | type_action_executescript_tdl
    | type_action_openwebpage_tdl
)[];

export type type_ActionButton_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
    actions: type_actions_tdl;
};

export class ActionButtonHelper extends BaseWidgetHelper {
    static _defaultTdl: type_ActionButton_tdl = {
        type: "ActionButton",
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
            backgroundColor: "rgba(210, 210, 210, 1)",
            // border, not related to the below alarmBorder
            borderStyle: "solid",
            borderWidth: 0,
            borderColor: "rgba(0, 0, 0, 1)",
            // font
            color: "rgba(0,0,0,1)",
            fontFamily: GlobalVariables.defaultFontFamily,
            fontSize: GlobalVariables.defaultFontSize,
            fontStyle: GlobalVariables.defaultFontStyle,
            fontWeight: GlobalVariables.defaultFontWeight,
            // angle
            transform: "rotate(0deg)",
            // shows when the widget is selected
            outlineStyle: "none",
            outlineWidth: 1,
            outlineColor: "black",
        },
        text: {
            wrapWord: false,
            horizontalAlign: "left",
            // actually alarmOutline
            alarmBorder: true,
            text: "Action Button",
            // becomes not visible in operation mode, but still clickable
            invisibleInOperation: false,
            // "contemporary" | "traditional"
            appearance: "traditional",
            alarmText: false,
            alarmBackground: false,
            alarmLevel: "MINOR",
        },
        channelNames: [],
        groupNames: [],
        rules: [],
        actions: [],
    };

    // not getDefaultTdl(), always generate a new key
    static generateDefaultTdl = (type: string): type_ActionButton_tdl => {
        const result = super.generateDefaultTdl(type) as type_ActionButton_tdl;
        result.style = JSON.parse(JSON.stringify(this._defaultTdl.style));
        result.text = JSON.parse(JSON.stringify(this._defaultTdl.text));
        result.channelNames = JSON.parse(JSON.stringify(this._defaultTdl.channelNames));
        result.groupNames = JSON.parse(JSON.stringify(this._defaultTdl.groupNames));
        result.actions = JSON.parse(JSON.stringify(this._defaultTdl.actions));
        return result;
    };

    static convertEdlToTdl_ShellCommand = (edl: Record<string, any>): type_ActionButton_tdl => {
        console.log("\n------------", `Parsing "Shell Command"`, "------------------\n");
        const tdl = this.generateDefaultTdl("ActionButton") as type_ActionButton_tdl;
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
            "bgColor",
            "topShadowColor", // not in tdm
            "botShadowColor", // not in tdm
            "font",
            "invisible",
            "closeDisplay", // not in tdm
            "buttonLabel",
            "autoExecPeriod", // not in tdm
            "initialDelay", // not in tdm
            "lock", // not in tdm
            "oneShot", // not in tdm
            "swapButtons",
            "multipleInstances", // not in tdm
            "requiredHostName", // not in tdm
            "numCmds", // not in tdm
            "commandLabel",
            "command",
            "includeHelpIcon", // not in tdm
            "execCursor", // not in tdm
            "endObjectProperties", // not in tdm
        ];

        // default differences
        tdl["text"]["wrapWord"] = false;
        tdl["text"]["alarmBorder"] = false;
        tdl["text"]["horizontalAlign"] = "center";
        tdl["text"]["swapButtons"] = false;
        tdl["text"]["appearance"] = "traditional";
        tdl["text"]["text"] = "";

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
                    tdl["style"]["color"] = EdlConverter.convertEdlColor(propertyValue);
                } else if (propertyName === "bgColor") {
                    tdl["style"]["backgroundColor"] = EdlConverter.convertEdlColor(propertyValue);
                } else if (propertyName === "font") {
                    const { fontFamily, fontWeight, fontSize, fontStyle } = EdlConverter.convertEdlFont(propertyValue);
                    tdl["style"]["fontFamily"] = fontFamily;
                    tdl["style"]["fontStyle"] = fontStyle;
                    tdl["style"]["fontSize"] = fontSize;
                    tdl["style"]["fontWeight"] = fontWeight;
                } else if (propertyName === "buttonLabel") {
                    tdl["text"]["text"] = propertyValue.replaceAll(`"`, "");
                } else if (propertyName === "invisible") {
                    tdl["text"]["invisibleInOperation"] = EdlConverter.convertEdlBoolean(propertyValue);
                } else if (propertyName === "commandLabel") {
                    tdl["actions"] = EdlConverter.convertEdlShellCommands(propertyValue, edl["command"]) as type_actions_tdl;
                } else if (propertyName === "swapButtons") {
                    tdl["text"]["swapButtons"] = true;
                } else {
                    console.log("Skip property", `"${propertyName}"`);
                }
            }
        }

        return tdl;
    };

    static convertEdlToTdl_RelatedDisplay = (edl: Record<string, any>, convertEdlSuffix: boolean = false): type_ActionButton_tdl => {
        console.log("\n------------", `Parsing "Related Display"`, "------------------\n");
        const tdl = this.generateDefaultTdl("ActionButton") as type_ActionButton_tdl;
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
            "bgColor",
            "topShadowColor", // not in tdm
            "botShadowColor", // not in tdm
            "font",
            "noEdit", // not in tdm
            "useFocus", // not in tdm
            "invisible",
            "buttonLabel",
            "button3Popup",
            "numPvs", // not in tdm
            "pv", // ! not in tdm, a list of PVs, when we click the button, the pv value is changed to the below value
            "value", // ! not in tdm, see above "pv"
            "numDsps", // not in tdm
            "displayFileName",
            "menuLabel",
            "closeAction", // not in tdm
            "setPosition", // not in tdm
            "allowDups", // not in tdm
            "symbols",
            "replaceSymbols", // ! not in tdm, ("0"|"1")[], each display has one element, what does it do?
            "propagateMacros", // ! not in tdm,  ("0"|"1")[], each display has one element, what does it do?
            "closeDisplay", // not in tdm
            "colorPv",
            "icon", // not in tdm
            "swapButtons", // not in tdm
            "helpCommand", // not in tdm
            "endObjectProperties", // not in tdm
        ];

        // default differences
        tdl["text"]["wrapWord"] = false;
        tdl["text"]["alarmBorder"] = false;
        tdl["text"]["horizontalAlign"] = "center";
        tdl["text"]["swapButtons"] = false;
        tdl["text"]["button3Popup"] = false;
        tdl["text"]["text"] = "";
        tdl["text"]["appearance"] = "traditional";


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
                    tdl["style"]["color"] = EdlConverter.convertEdlColor(propertyValue);
                } else if (propertyName === "bgColor") {
                    tdl["style"]["backgroundColor"] = EdlConverter.convertEdlColor(propertyValue, EdlConverter.convertEdlPv(edl["colorPv"]), "Background Color", tdl);
                } else if (propertyName === "font") {
                    const { fontFamily, fontWeight, fontSize, fontStyle } = EdlConverter.convertEdlFont(propertyValue);
                    tdl["style"]["fontFamily"] = fontFamily;
                    tdl["style"]["fontStyle"] = fontStyle;
                    tdl["style"]["fontSize"] = fontSize;
                    tdl["style"]["fontWeight"] = fontWeight;
                } else if (propertyName === "buttonLabel") {
                    tdl["text"]["text"] = propertyValue.replaceAll(`"`, "").replaceAll(/\x01/g, " ");
                } else if (propertyName === "displayFileName") {
                    tdl["actions"] = EdlConverter.convertEdlRelatedDisplays(edl["menuLabel"], edl["displayFileName"], edl["symbols"], edl["propagateMacros"]) as type_actions_tdl;
                } else if (propertyName === "invisible") {
                    tdl["text"]["invisibleInOperation"] = EdlConverter.convertEdlBoolean(propertyValue);
                } else if (propertyName === "swapButtons") {
                    tdl["text"]["swapButtons"] = true;
                } else if (propertyName === "button3Popup") {
                    tdl["text"]["button3Popup"] = true;
                } else {
                    console.log("Skip property", `"${propertyName}"`);
                }
            }
        }

        // if colorPv exists in edl setting, but its value is not available in operation, the widget becomes invisible
        // These behaviors override the alarm-sensitive
        if (edl["colorPv"] !== undefined) {
            tdl["rules"].push({
                boolExpression: EdlConverter.generatePvUndefinedExpression(edl["colorPv"]),
                propertyName: "Invisible in Operation",
                propertyValue: "true",
                id: uuidv4(),
            });
        }

        // change .edl to ".tdl" so that TDM can read it
        for (const action of tdl["actions"]) {
            const actionType = action["type"];
            if (actionType === "OpenDisplay") {
                const fileName = action["fileName"];
                if (path.extname(fileName) === ".edl" && convertEdlSuffix === true) {
                    action["fileName"] = action["fileName"].trim().replace(".edl", ".tdl");
                }
            }
        }

        return tdl;
    };

    static convertBobToTdl = (bob: Record<string, any>): type_ActionButton_tdl => {
        console.log("\n------------", `Parsing "action_button"`, "------------------\n");
        const tdl = this.generateDefaultTdl("ActionButton");
        // all properties for this widget
        const propertyNames: string[] = [
            "actions",
            "background_color",
            "border_alarm_sensitive",
            "class", // not in tdm
            "confirm_message", // not in tdm
            "enabled", // todo: not in tdm, shall we implement it?
            "font",
            "foreground_color",
            "height",
            "name", // not in tdm
            "password", // not in tdm
            "pv_name",
            "rotation_step",
            "rules", // not in tdm
            "scripts", // not in tdm
            "show_confirm_dialog", // not in tdm
            "text",
            "tooltip", // not in tdm
            "transparent",
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
                } else if (propertyName === "background_color") {
                    const rgbaColor = BobPropertyConverter.convertBobColor(propertyValue, undefined);
                    tdl["style"]["backgroundColor"] = rgbaColor;
                } else if (propertyName === "font") {
                    const font = BobPropertyConverter.convertBobFont(propertyValue);
                    tdl["style"]["fontSize"] = font["fontSize"];
                    tdl["style"]["fontFamily"] = font["fontFamily"];
                    tdl["style"]["fontStyle"] = font["fontStyle"];
                    tdl["style"]["fontWeight"] = font["fontWeight"];
                } else if (propertyName === "foreground_color") {
                    const rgbaColor = BobPropertyConverter.convertBobColor(propertyValue, undefined);
                    tdl["style"]["color"] = rgbaColor;
                } else if (propertyName === "pv_name") {
                    tdl["channelNames"].push(propertyValue);
                } else if (propertyName === "text") {
                    if (typeof propertyValue !== "string") {
                        tdl["text"]["text"] = "";
                    } else {
                        tdl["text"]["text"] = propertyValue.replaceAll('"', "").replace(/\x01/g, " ");
                    }
                } else if (propertyName === "line_color") {
                    const rgbaColor = BobPropertyConverter.convertBobColor(propertyValue, undefined);
                    tdl["text"]["lineColor"] = rgbaColor;
                } else if (propertyName === "line_width") {
                    tdl["text"]["lineWidth"] = parseInt(propertyValue);
                } else if (propertyName === "line_style") {
                    let borderStyles = ["solid", "dashed", "dotted", "dash-dot", "dash-dot-dot"];
                    tdl["text"]["lineStyle"] = borderStyles[parseInt(propertyValue)];
                } else if (propertyName === "corner_width") {
                    tdl["text"]["cornerWidth"] = parseInt(propertyValue);
                } else if (propertyName === "corner_height") {
                    tdl["text"]["cornerHeight"] = parseInt(propertyValue);
                } else if (propertyName === "border_alarm_sensitive") {
                    tdl["text"]["alarmBorder"] = BobPropertyConverter.convertBobBoolean(propertyValue);
                } else if (propertyName === "actions") {
                    const defaultChannelName = bob["pv_name"] === undefined ? "" : bob["pv_name"];
                    tdl["actions"] = BobPropertyConverter.convertBobActions(propertyValue["action"], defaultChannelName);
                } else {
                    console.log("Skip property", `"${propertyName}"`);
                }
            }
        }

        // handle the situation that the "background_color" is not explicitly shown in bob file
        // while the "transparent" is explicitly shown
        // default transparent is "false"
        if (bob["transparent"] === "true") {
            const rgbaArray = GlobalMethods.rgbaStrToRgbaArray(tdl["style"]["backgroundColor"]);
            rgbaArray[3] = 0;
            const rgbaString = GlobalMethods.rgbaArrayToRgbaStr(rgbaArray);
            tdl["style"]["backgroundColor"] = rgbaString;
        }

        // special treatment for rotation
        if (Object.keys(bob).includes("rotation_step")) {
            const propertyValue = bob["rotation_step"];
            const left = parseInt(bob["x"]);
            const top = parseInt(bob["y"]);
            const width = parseInt(bob["width"]);
            const height = parseInt(bob["height"]);
            const result = BobPropertyConverter.convertBobRotationStep(propertyValue, left, top, width, height);
            tdl["style"]["transform"] = result["transform"];
            tdl["style"]["left"] = result["newLeft"];
            tdl["style"]["top"] = result["newTop"];
            tdl["style"]["width"] = result["newWidth"];
            tdl["style"]["height"] = result["newHeight"];
        }

        return tdl;
    };
}
