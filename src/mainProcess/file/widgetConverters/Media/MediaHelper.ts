import { BobPropertyConverter } from "../../BobPropertyConverter";
import { Log } from "../../../../common/Log";
import { BaseWidgetHelper } from "../BaseWidget/BaseWidgetHelper";
import { defaultMediaTdl, type_Media_tdl } from "../../../../common/types/type_widget_tdl";
import { generateWidgetKey } from "../../../../common/GlobalMethods";

export class MediaHelper extends BaseWidgetHelper {

    static generateDefaultTdl = (): type_Media_tdl => {
        const widgetKey = generateWidgetKey(defaultMediaTdl.type);
        return structuredClone({
            ...defaultMediaTdl,
            widgetKey: widgetKey,
        });
    };

    static convertEdlToTdl = (edl: Record<string, string>): type_Media_tdl => {
        Log.info("\n------------", `Parsing "GIF Image" or "PNG Image"`, "------------------\n");
        const tdl = this.generateDefaultTdl();

        const propertyNames: string[] = [
            "beginObjectProperties", // not in tdm
            "major", // not in tdm
            "minor", // not in tdm
            "release", // not in tdm
            "x",
            "y",
            "w",
            "h",
            "file",
            "uniformSize", // not in tdm
            "fastErase", // not in tdm
            "noErase", // not in tdm
            "endObjectProperties", // not in tdm
        ];


        // default differences
        tdl["text"]["alarmBorder"] = false;


        for (const propertyName of propertyNames) {
            const propertyValue = edl[propertyName];
            if (propertyValue === undefined) {
                Log.info("Property", `"${propertyName}"`, "is not in edl file");
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
                } else if (propertyName === "file") {
                    tdl["text"]["fileName"] = propertyValue.replaceAll('"', "");
                    // } else if (propertyName === "fgColor") {
                    // 	tdl["style"]["color"] = EdlConverter.convertEdlColor(
                    // 		propertyValue
                    // 		// EdlConverter.convertEdlPv(edl["controlPv"]),
                    // 		// "Text Color",
                    // 		// tdl
                    // 	);
                    // } else if (propertyName === "fgAlarm") {
                    // 	alarmPropertyNames.push(propertyName);
                    // } else if (propertyName === "bgColor") {
                    // 	tdl["style"]["backgroundColor"] = EdlConverter.convertEdlColor(propertyValue);
                    // } else if (propertyName === "controlPv") {
                    // 	// it is a control-type widget, only use real channel name, i.e. "val0" or "loc://abc"
                    // 	tdl["channelNames"].push(EdlConverter.convertEdlPv(propertyValue));
                    // } else if (propertyName === "font") {
                    // 	const { fontFamily, fontWeight, fontSize, fontStyle } = EdlConverter.convertEdlFont(propertyValue);
                    // 	tdl["style"]["fontFamily"] = fontFamily;
                    // 	tdl["style"]["fontStyle"] = fontStyle;
                    // 	tdl["style"]["fontSize"] = fontSize;
                    // 	tdl["style"]["fontWeight"] = fontWeight;
                } else {
                    Log.info("Skip property", `"${propertyName}"`);
                }
            }
        }

        return tdl;
    };

    static convertBobToTdl = (bobWidgetJson: Record<string, any>): type_Media_tdl => {
        Log.info("\n------------", `Parsing "picture"`, "------------------\n");
        const tdl = this.generateDefaultTdl();
        // all properties for this widget
        const propertyNames: string[] = [
            "actions", // not in tdm
            "class", // not in tdm
            "file",
            "height",
            "macros", // not in tdm
            "name", // not in tdm
            "opacity",
            "rotation", // todo: when rotates in Phoebus, the image size is changed
            "rules",
            "scripts", // not in tdm
            "stretch_image",
            "tooltip", // not in tdm
            "type", // not in tdm
            "visible",
            "width",
            "x",
            "y",
        ];

        tdl["style"]["width"] = 150;
        tdl["style"]["height"] = 100;
        tdl["text"]["stretchToFit"] = true;


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
                if (propertyName === "file") {
                    tdl["text"]["fileName"] = BobPropertyConverter.convertBobString(propertyValue);
                } else if (propertyName === "line_width") {
                    // tdl["text"]["lineWidth"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "opacity") {
                    tdl["text"]["opacity"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "rotation") {
                    const angle = BobPropertyConverter.convertBobNum(propertyValue);
                    tdl["style"]["transform"] = `rotate(${angle}deg)`;
                } else if (propertyName === "rules") {
                    tdl["rules"] = BobPropertyConverter.convertBobRules(propertyValue);
                } else if (propertyName === "x") {
                    tdl["style"]["left"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "y") {
                    tdl["style"]["top"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "width") {
                    tdl["style"]["width"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "height") {
                    tdl["style"]["height"] = BobPropertyConverter.convertBobNum(propertyValue);
                } else if (propertyName === "stretch_image") {
                    tdl["text"]["stretchToFit"] = BobPropertyConverter.convertBobBoolean(propertyValue);
                } else if (propertyName === "visible") {
                    tdl["text"]["invisibleInOperation"] = !BobPropertyConverter.convertBobBoolean(propertyValue);
                } else {
                    Log.info("Skip property", `"${propertyName}"`);
                }
            }
        }


        return tdl;
    };
}
