import { Log } from "../../../../common/Log";
import * as GlobalMethods from "../../../../common/GlobalMethods";
import { defaultSpinnerTdl, type_Spinner_tdl } from "../../../../common/types/type_widget_tdl";
import { BobPropertyConverter } from "../../BobPropertyConverter";
import { BaseWidgetHelper } from "../BaseWidget/BaseWidgetHelper";


export class SpinnerHelper extends BaseWidgetHelper {
    static generateDefaultTdl = (): type_Spinner_tdl => {
        const widgetKey = GlobalMethods.generateWidgetKey(defaultSpinnerTdl.type);
        return structuredClone({
            ...defaultSpinnerTdl,
            widgetKey: widgetKey,
        });
    };


    static convertBobToTdl = (bobWidgetJson: Record<string, any>): type_Spinner_tdl => {
        Log.info("\n------------", `Parsing "spinner"`, "------------------\n");
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
            "font",
            "format",
            "precision",
            "show_units",
            "foreground_color",
            "background_color",
            "minimum", // not in tdm
            "maximum", // not in tdm
            "limits_from_pv", // not in tdm
            "increment",
            "buttons_on_left", // not in tdm
            "enabled", // not in tdm
            "horizontal_alignment",
            "vertical_alignment",
        ];

        tdl["style"]["left"] = 0;
        tdl["style"]["top"] = 0;
        tdl["style"]["width"] = 100;
        tdl["style"]["height"] = 20;

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
                } else if (propertyName === "font") {
                    const data = BobPropertyConverter.convertBobFont(propertyValue);
                    tdl["style"]["fontSize"] = data["fontSize"];
                    tdl["style"]["fontFamily"] = data["fontFamily"];
                    tdl["style"]["fontStyle"] = data["fontStyle"];
                    tdl["style"]["fontWeight"] = data["fontWeight"];
                } else if (propertyName === "format") {
                    tdl["text"]["format"] =  BobPropertyConverter.convertBobDigitFormat(propertyValue);
                } else if (propertyName === "precision") {
                    tdl["text"]["scale"] =  BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "show_units") {
                    tdl["text"]["showUnit"] =  BobPropertyConverter.convertBobBoolean(propertyValue);
                } else if (propertyName === "foreground_color") {
                    tdl["style"]["color"] = BobPropertyConverter.convertBobColor(propertyValue);
                } else if (propertyName === "background_color") {
                    tdl["style"]["backgroundColor"] = BobPropertyConverter.convertBobColor(propertyValue);
                } else if (propertyName === "increment") {
                    tdl["text"]["stepSize"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "horizontal_alignment") {
                    tdl["text"]["horizontalAlign"] = BobPropertyConverter.convertBobAlignment(propertyValue);
                } else if (propertyName === "vertical_alignment") {
                    tdl["text"]["verticalAlign"] = BobPropertyConverter.convertBobAlignment(propertyValue);
                } else {
                    Log.info("Skip property", `"${propertyName}"`);
                }
            }
        }

        return tdl;
    };
}
