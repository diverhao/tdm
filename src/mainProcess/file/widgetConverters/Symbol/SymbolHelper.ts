import { generateWidgetKey } from "../../../../common/GlobalMethods";
import { Log } from "../../../../common/Log";
import { defaultSymbolTdl, type_Symbol_tdl } from "../../../../common/types/type_widget_tdl";
import { BobPropertyConverter } from "../../../windows/DisplayWindow/BobPropertyConverter";
import { BaseWidgetHelper } from "../BaseWidget/BaseWidgetHelper";

export class SymbolHelper extends BaseWidgetHelper {


    static generateDefaultTdl = (): type_Symbol_tdl => {
        const widgetKey = generateWidgetKey(defaultSymbolTdl.type);
        return structuredClone({
            ...defaultSymbolTdl,
            widgetKey: widgetKey,
        });
    };

    static convertBobToTdl = (bobWidgetJson: Record<string, any>): type_Symbol_tdl => {
        Log.info("\n------------", `Parsing symbol`, "------------------\n");
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
            "scripts", // not in tdm
            "visible",
            "tooltip", // not in tdm
            "pv_name",
            "border_alarm_sensitive",
            "symbols",
            "background_color",
            "initial_index", // not in tdm
            "rotation",
            "show_index",
            "transparent",
            "disconnect_overlay_color", // not in tdm
            "array_index",
            "auto_size", // not in tdm
            "enabled", // not in tdm
            "preserve_ratio",
            "fallback_symbol",
        ];

        let isTransparent = false;

        tdl["style"]["left"] = 0;
        tdl["style"]["top"] = 0;
        tdl["style"]["width"] = 100;
        tdl["style"]["height"] = 100;

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
                    tdl["text"]["invisibleInOperation"] = !BobPropertyConverter.convertBobBoolean(propertyValue);
                } else if (propertyName === "pv_name") {
                    tdl["channelNames"].push(BobPropertyConverter.convertBobString(propertyValue));
                } else if (propertyName === "border_alarm_sensitive") {
                    tdl["text"]["alarmBorder"] = BobPropertyConverter.convertBobBoolean(propertyValue);
                } else if (propertyName === "symbols") {
                    tdl["itemNames"] = BobPropertyConverter.convertBobStrings(propertyValue, "symbol");
                } else if (propertyName === "background_color") {
                    tdl["style"]["backgroundColor"] = BobPropertyConverter.convertBobColor(propertyValue);
                } else if (propertyName === "rotation") {
                    tdl["style"]["transform"] = BobPropertyConverter.convertBobAngleNum(propertyValue);
                } else if (propertyName === "preserve_ratio") {
                    tdl["text"]["stretchToFit"] = !BobPropertyConverter.convertBobBoolean(propertyValue);
                } else if (propertyName === "fallback_symbol") {
                    tdl["text"]["fileName"] = BobPropertyConverter.convertBobString(propertyValue);
                } else if (propertyName === "show_index") {
                    tdl["text"]["showPvValue"] = BobPropertyConverter.convertBobBoolean(propertyValue);
                } else if (propertyName === "transparent") {
                    isTransparent = BobPropertyConverter.convertBobBoolean(propertyValue);
                } else {
                    Log.info("Skip property", `"${propertyName}"`);
                }
            }

        }

        for (let ii = 0; ii < tdl["itemNames"].length; ii++) {
            tdl["itemValues"].push(ii);
        }

        if (isTransparent) {
            const originalRgbaColor = tdl["style"]["backgroundColor"];
            const rgbaColorArray = originalRgbaColor.split(",");
            rgbaColorArray[3] = "0)";
            tdl["style"]["backgroundColor"] = rgbaColorArray.join(",");
        }

        return tdl;
    };
}
