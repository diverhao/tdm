import { parseCSSAngle, rgbaStrToRgbaArray } from "../../common/GlobalMethods";

export class TdlPropertyConverter {

    // todo: add a master method

    private static escapeXml = (value: string): string => {
        return value
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll("\"", "&quot;")
            .replaceAll("'", "&apos;");
    };

    static convertToText = (value: number | string | boolean, xmlElementName: string) => {
        return (`<${xmlElementName}>${value}</${xmlElementName}>`)
    }

    static convertToColor = (rgbaStr: string, xmlElementName: string) => {
        const [r, g, b, a] = rgbaStrToRgbaArray(rgbaStr);
        if (typeof r === "number" && typeof g === "number" && typeof b === "number" && typeof a === "number") {
            return (`<${xmlElementName}><color name="" red="${r}" green="${r}" blue="${b}" alpha="${Math.round(a * 255)}"></color></${xmlElementName}>`)
        }
        return "";
    }

    static convertToEmpty = (xmlElementName: string) => {
        return `<${xmlElementName}></${xmlElementName}>`;
    }

    static convertToFont = (fontFamily: string, fontStyle: string, fontSize: number, fontWeight: string, xmlElementName: string) => {
        return (`<${xmlElementName}><font name="Default" family="${fontFamily}" style="${fontStyle.toUpperCase()}" size="${fontSize}"} ></font></${xmlElementName}>`)
    }

    static converToRotation = (transform: string, xmlElementName: string) => {
        let angle = parseCSSAngle(transform) % 360;
        let position = 0;
        if (angle < 45 || angle >= 315) {
            position = 0;
        } else if (angle >= 45 && angle < 135) {
            position = 1;
        } else if (angle >= 135 && angle < 225) {
            position = 2;
        } else {
            position = 3;
        }
        return (`<${xmlElementName}>${position}</${xmlElementName}>`)
    }

    static convertToAlign = (align: string, xmlElementName: string) => {
        let position = 0;
        if (align === "center") {
            position = 1;
        }
        if (align === "flex-end") {
            position = 2;
        }
        return (`<${xmlElementName}>${position}</${xmlElementName}>`)
    }

    static conversionRegistryStyle = {
        // position: "absolute",
        // display: "inline-flex",
        left: (value: number) => { return this.convertToText(value, "x") },
        top: (value: number) => { return this.convertToText(value, "y") },
        width: (value: number) => { return this.convertToText(value, "width") },
        height: (value: number) => { return this.convertToText(value, "height") },
        backgroundColor: (rgbaStr: string) => { return this.convertToColor(rgbaStr, "background_color") },
        transform: (transform: string, xmlElementName: string) => { return this.converToRotation(transform, xmlElementName) },
        // borderStyle: "solid",
        borderWidth: (value: number) => { return this.convertToText(value, "border_width") },
        borderColor: (rgbaStr: string) => { return this.convertToColor(rgbaStr, "border_color") },
        color: (rgbaStr: string) => { return this.convertToColor(rgbaStr, "foreground_color") },
        fontFamily: (fontFamily: string, fontStyle: string, fontSize: number, fontWeight: string, xmlElementName: string) => { return this.convertToFont(fontFamily, fontStyle, fontSize, fontWeight, xmlElementName) },
        // outlineStyle: "none",
        // outlineWidth: 1,
        // outlineColor: "black",
        // boxSizing: "content-box",
    }

    static conversionRegistryText = {
        text: (value: string) => { return this.convertToText(value, "text") },
        horizontalAlign: (align: string) => { return this.convertToAlign(align, "horizontal_alignment") },
        verticalAlign: (align: string) => { return this.convertToAlign(align, "vertical_alignment") },
        wrapWord: (value: boolean) => { return this.convertToText(value, "wrap_words") },
        invisibleInOperation: (value: boolean) => { return this.convertToText(value, "transparent") },
        // alarmBorder: false,
        // alarmBackground: false,
        // alarmText: false,
        // alarmLevel: "MINOR",
    }


}
