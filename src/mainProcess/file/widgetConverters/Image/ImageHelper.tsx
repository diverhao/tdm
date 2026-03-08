import { GlobalVariables } from "../../../../common/GlobalVariables";
import { Log } from "../../../../common/Log";
import { BobPropertyConverter } from "../../../windows/DisplayWindow/BobPropertyConverter";
import { type_rules_tdl, BaseWidgetHelper } from "../BaseWidget/BaseWidgetHelper";
import * as GlobalMethods from "../../../../common/GlobalMethods";
import { rgbaArrayToRgbaStr, rgbaStrToRgbaArray } from "../../../../common/GlobalMethods";
import { EdlConverter } from "../../../windows/DisplayWindow/EdlConverter";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { type_Image_tdl, type_Image_roi, defaultImageTdl } from "../../../../common/types/type_widget_tdl";

export class ImageHelper extends BaseWidgetHelper {


    static generateDefaultTdl = (): type_Image_tdl => {
        const widgetKey = GlobalMethods.generateWidgetKey(defaultImageTdl["type"]);
        return structuredClone({
            ...defaultImageTdl,
            widgetKey: widgetKey,
        });
    };

    static convertBobToTdl = (bobWidgetJson: Record<string, any>): type_Image_tdl => {
        Log.info("\n------------", `Parsing "image"`, "------------------\n");
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
            "background_color",
            "foreground_color",
            "show_toolbar", // not in tdm
            "color_map",
            "color_bar", // not in tdm
            "x_axis", // not in tdm
            "y_axis", // not in tdm
            "limits_from_pv", // not in tdm
            "data_width", // not in tdm
            "data_height", // not in tdm
            "interpolation", // not in tdm
            "color_mode", // not in tdm
            "unsigned", // not in tdm
            "autoscale",
            "logscale", // not in tdm
            "minimum",
            "maximum",
            "cursor_info_pv", // not in tdm
            "x_pv", // todo: not in tdm yet
            "y_pv", // todo: not in tdm yet
            "cursor_info", // not in tdm
            "cursor_crosshair", // not in tdm
            "crosshair_location", // not in tdm
            "rois", // todo: not in tdm yet
            "configure", // not in tdm

            // Color Bar Properties (within color_bar):
            // visible
            // bar_size
            // scale_font

            // X/Y Axis Properties (within x_axis and y_axis):
            // visible
            // title
            // minimum
            // maximum
            // title_font
            // scale_font

            // ROI Properties (within rois array):
            // name
            // color
            // visible
            // interactive
            // x_pv
            // y_pv
            // width_pv
            // height_pv
            // file
            // x_value
            // y_value
            // width_value
            // height_value

        ];

        let confirmDialog = false;
        let confirmMessage = "";
        let password = "";
        let isTransparent = false;

        tdl["style"]["left"] = 0;
        tdl["style"]["top"] = 0;
        tdl["style"]["width"] = 400;
        tdl["style"]["height"] = 300;
        tdl["style"]["backgroundColor"] = "rgba(255, 255, 255, 1)";
        tdl["text"]["colorMap"] = "viridis";

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
                } else if (propertyName === "foreground_color") {
                    tdl["style"]["color"] = BobPropertyConverter.convertBobColor(propertyValue);
                } else if (propertyName === "background_color") {
                    tdl["style"]["backgroundColor"] = BobPropertyConverter.convertBobColor(propertyValue);
                } else if (propertyName === "color_map") {
                    tdl["text"]["colorMap"] = BobPropertyConverter.convertBobColorMap(propertyValue);
                } else if (propertyName === "autoscale") {
                    tdl["text"]["autoZ"] = BobPropertyConverter.convertBobBoolean(propertyValue);
                } else if (propertyName === "minimum") {
                    tdl["text"]["zMin"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "maximum") {
                    tdl["text"]["zMax"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else {
                    Log.info("Skip property", `"${propertyName}"`);
                }
            }
        }
        

        return tdl;
    };
}
