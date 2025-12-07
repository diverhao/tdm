import { GlobalVariables } from "../../../../common/GlobalVariables";
import { BobPropertyConverter } from "../../../windows/DisplayWindow/BobPropertyConverter";
import { type_rules_tdl, BaseWidgetHelper } from "../BaseWidget/BaseWidgetHelper";
import * as GlobalMethods from "../../../../common/GlobalMethods";
import { rgbaArrayToRgbaStr, rgbaStrToRgbaArray } from "../../../../common/GlobalMethods";
import { EdlConverter } from "../../../windows/DisplayWindow/EdlConverter";
import { v4 as uuidv4 } from "uuid";
import path from "path";

export type type_action_opendisplay_tdl = {
    type: "OpenDisplay";
    label: string;
    fileName: string;
    externalMacros: [string, string][];
    useParentMacros: boolean;
    openInSameWindow: boolean;
};

export type type_action_writepv_tdl = {
    type: "WritePV";
    label: string;
    channelName: string;
    channelValue: string;
    confirmOnWrite: boolean;
    confirmOnWriteUsePassword: boolean;
    confirmOnWritePassword: string;
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
    confirmOnWrite: boolean;
    confirmOnWriteUsePassword: boolean;
    confirmOnWritePassword: string;
};

export type type_action_closedisplaywindow = {
    type: "CloseDisplayWindow";
    label: string;
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
    | type_action_closedisplaywindow
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
            display: "inline-flex",
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
            horizontalAlign: "center",
            verticalAlign: "center",
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

    static convertEdlToTdl_ShellCommand = (edl: Record<string, any>, convertEdlSuffix: boolean = false): type_ActionButton_tdl => {
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
                    tdl["actions"] = EdlConverter.convertEdlShellCommands(propertyValue, edl["command"], convertEdlSuffix) as type_actions_tdl;
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

    static convertEdlToTdl_ExitButton = (edl: Record<string, any>): type_ActionButton_tdl => {
        console.log("\n------------", `Parsing "Exit Button"`, "------------------\n");
        const tdl = this.generateDefaultTdl("ActionButton") as type_ActionButton_tdl;
        // all properties for this widget
        const propertyNames: string[] = [

            "beginObjectProperties", // not in tdm
            "major",  // not in tdm
            "minor",  // not in tdm
            "release",  // not in tdm
            "x",
            "y",
            "w",
            "h",
            "fgColor",
            "bgColor",
            "topShadowColor",  // not in tdm
            "botShadowColor",  // not in tdm
            "label",
            "font",
            "3d", // not in tdm
            "invisible",
            "iconify", // not in tdm
            "exitProgram",
            "controlParent", // not in tdm
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
                } else if (propertyName === "label") {
                    tdl["text"]["text"] = propertyValue.replaceAll(`"`, "");
                } else if (propertyName === "invisible") {
                    tdl["text"]["invisibleInOperation"] = EdlConverter.convertEdlBoolean(propertyValue);
                } else {
                    console.log("Skip property", `"${propertyName}"`);
                }
            }
        }
        tdl["actions"] = EdlConverter.convertEdlExitButton(edl["exitProgram"]) as type_actions_tdl;
        return tdl;
    };

    static convertBobToTdl = (bobWidgetJson: Record<string, any>, convertBobSuffix: boolean): type_ActionButton_tdl => {
        console.log("\n------------", `Parsing "action_button"`, "------------------\n");
        const tdl = this.generateDefaultTdl("ActionButton");
        // all properties for this widget
        const propertyNames: string[] = [
            "type", // not in tdm
            "name", // not in tdm
            "class", // not in tdm
            "x",
            "y",
            "width",
            "height",
            "actions",
            "rules",
            "scripts", // not in tdm
            "visible",
            "tooltip", // not in tdm
            "pv_name",
            "border_alarm_sensitive",
            "text",
            "font",
            "foreground_color",
            "background_color",
            "transparent", // not in tdm
            "rotation_step",
            "enabled", // not in tdm
            "show_confirm_dialog",
            "confirm_message", // not in tdm
            "password",
        ];

        let confirmDialog = false;
        let password = "";
        let isTransparent = false;
        tdl["style"]["left"] = 0;
        tdl["style"]["top"] = 0;
        tdl["style"]["width"] = 100;
        tdl["style"]["height"] = 30;
        tdl["text"]["appearance"] = "contemporary";
        tdl["text"]["text"] = "$(actions)";

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
                } else if (propertyName === "actions") {
                    tdl["actions"] = BobPropertyConverter.convertBobActions(propertyValue, convertBobSuffix);
                } else if (propertyName === "rules") {
                    tdl["rules"] = BobPropertyConverter.convertBobRules(propertyValue);
                } else if (propertyName === "visible") {
                    tdl["text"]["invisibleInOperation"] = !BobPropertyConverter.convertBobBoolean(propertyValue);
                } else if (propertyName === "pv_name") {
                    tdl["channelNames"].push(BobPropertyConverter.convertBobString(propertyValue));
                } else if (propertyName === "border_alarm_sensitive") {
                    tdl["text"]["alarmBorder"] = BobPropertyConverter.convertBobBoolean(propertyValue);
                } else if (propertyName === "text") {
                    tdl["text"]["text"] = BobPropertyConverter.convertBobString(propertyValue);
                } else if (propertyName === "font") {
                    const data = BobPropertyConverter.convertBobFont(propertyValue);
                    tdl["style"]["fontSize"] = data["fontSize"];
                    tdl["style"]["fontFamily"] = data["fontFamily"];
                    tdl["style"]["fontStyle"] = data["fontStyle"];
                    tdl["style"]["fontWeight"] = data["fontWeight"];
                } else if (propertyName === "foreground_color") {
                    tdl["style"]["color"] = BobPropertyConverter.convertBobColor(propertyValue);
                } else if (propertyName === "background_color") {
                    tdl["style"]["backgroundColor"] = BobPropertyConverter.convertBobColor(propertyValue);
                } else if (propertyName === "rotation_step") {
                    tdl["style"]["transform"] = BobPropertyConverter.convertBobAngle(propertyValue);
                } else if (propertyName === "show_confirm_dialog") {
                    confirmDialog = BobPropertyConverter.convertBobBoolean(propertyValue);
                } else if (propertyName === "password") {
                    password = BobPropertyConverter.convertBobString(propertyValue);
                } else if (propertyName === "transparent") {
                    isTransparent = BobPropertyConverter.convertBobBoolean(propertyValue);
                } else {
                    console.log("Skip property", `"${propertyName}"`);
                }
            }
        }


        const actions = tdl["actions"];
        for (const action of actions) {
            if (action["type"] === "WritePV" || action["type"] === "ExecuteCommand") {
                action["confirmOnWrite"] = confirmDialog;
                action["confirmOnWriteUsePassword"] = password === "" ? false : true;
                action["confirmOnWritePassword"] = password;
            }
        }
        if (tdl["text"]["text"] === "$(actions)") {
            if (actions.length === 1) {
                tdl["text"]["text"] = actions[0]["label"];
            } else {
                tdl["text"]["text"] = `Choose 1 of ${actions.length}`;
            }
        }


        if (isTransparent) {
            const originalRgbaColor = tdl["style"]["backgroundColor"];
            const rgbaColorArray = originalRgbaColor.split(",");
            rgbaColorArray[3] = "0)";
            tdl["style"]["backgroundColor"] = rgbaColorArray.join(",");
        }


        if (tdl["style"]["transform"].includes("rotate(270deg)") || tdl["style"]["transform"].includes("rotate(90deg)")) {
            // modify the x, y, width and height
            const x = tdl["style"]["left"];
            const y = tdl["style"]["top"];
            const w = tdl["style"]["width"];
            const h = tdl["style"]["height"];

            tdl["style"]["width"] = h
            tdl["style"]["height"] = w;
            tdl["style"]["left"] = x + (w - h) / 2;
            tdl["style"]["top"] = y - (w - h) / 2;
        }

        return tdl;
    };

}
