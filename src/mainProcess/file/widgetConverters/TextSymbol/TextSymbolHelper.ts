import { generateRgbaColor, generateWidgetKey } from "../../../../common/GlobalMethods";
import { Log } from "../../../../common/Log";
import { defaultTextSymbolTdl, type_TextSymbol_tdl } from "../../../../common/types/type_widget_tdl";
import { BobPropertyConverter } from "../../../windows/DisplayWindow/BobPropertyConverter";
import { BaseWidgetHelper } from "../BaseWidget/BaseWidgetHelper";


export class TextSymbolHelper extends BaseWidgetHelper {

    static generateDefaultTdl = (): type_TextSymbol_tdl => {
        const widgetKey = generateWidgetKey(defaultTextSymbolTdl.type);
        return structuredClone({
            ...defaultTextSymbolTdl,
            widgetKey: widgetKey,
        });
    };

    static convertBobToTdl = (bobWidgetJson: Record<string, any>): type_TextSymbol_tdl => {
        Log.info("\n------------", `Parsing text-symbol`, "------------------\n");
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
            "foreground_color",
            "background_color",
            "transparent",
            "horizontal_alignment",
            "vertical_alignment",
            "rotation_step",
            "wrap_words",
            "array_index", // not in tdm
            "enabled", // not in tdm
        ];

        let isTransparent = false;

        tdl["style"]["width"] = 32;
        tdl["style"]["height"] = 32;
        tdl["style"]["top"] = 0;
        tdl["style"]["left"] = 0;
        tdl["text"]["horizontalAlign"] = "center";
        tdl["text"]["verticalAlign"] = "center";
        tdl["text"]["wrapWord"] = true;


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
                } else if (propertyName === "foreground_color") {
                    tdl["style"]["color"] = BobPropertyConverter.convertBobColor(propertyValue);
                } else if (propertyName === "background_color") {
                    tdl["style"]["backgroundColor"] = BobPropertyConverter.convertBobColor(propertyValue);
                } else if (propertyName === "horizontal_alignment") {
                    tdl["text"]["horizontalAlign"] = BobPropertyConverter.convertBobAlignment(propertyValue);
                } else if (propertyName === "vertical_alignment") {
                    tdl["text"]["verticalAlign"] = BobPropertyConverter.convertBobAlignment(propertyValue);
                } else if (propertyName === "rotation_step") {
                    tdl["style"]["transform"] = BobPropertyConverter.convertBobAngle(propertyValue);
                } else if (propertyName === "wrap_words") {
                    tdl["text"]["wrapWord"] = BobPropertyConverter.convertBobBoolean(propertyValue);
                } else if (propertyName === "transparent") {
                    isTransparent = BobPropertyConverter.convertBobBoolean(propertyValue);
                } else {
                    Log.info("Skip property", `"${propertyName}"`);
                }
            }


        }

        for (let ii = 0; ii < tdl["itemNames"].length; ii++) {
            tdl["itemValues"].push(ii);
            tdl["itemColors"].push(generateRgbaColor(ii % 50));
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
