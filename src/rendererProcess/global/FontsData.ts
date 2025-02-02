export class FontsData {
    constructor() { }

    static g_fonts: Record<string, Record<string, FontFace>> = {
        "TDM Default": {
            Regular: new FontFace("TDM Default", `url(../../resources/fonts/LiberationSans/LiberationSans-Regular.ttf)`, { style: "normal", weight: "normal" }),
            Bold: new FontFace("TDM Default", `url(../../resources/fonts//LiberationSans/LiberationSans-Bold.ttf)`, { style: "normal", weight: "bold" }),
            Italic: new FontFace("TDM Default", `url(../../resources/fonts/LiberationSans/LiberationSans-Italic.ttf)`, { style: "italic", weight: "normal" }),
        },
        Tinos: {
            Regular: new FontFace("Tinos", `url(../../resources/fonts//Tinos/Tinos-Regular.ttf)`, { style: "normal", weight: "normal" }),
            Bold: new FontFace("Tinos", `url(../../resources/fonts//Tinos/Tinos-Bold.ttf)`, { style: "normal", weight: "bold" }),
            Italic: new FontFace("Tinos", `url(../../resources/fonts//Tinos/Tinos-Italic.ttf)`, { style: "italic", weight: "normal" }),
        },
        "Courier Prime": {
            Regular: new FontFace("Courier Prime", `url(../../resources/fonts/CourierPrime/CourierPrime.ttf)`, { style: "normal", weight: "normal" }),
            Bold: new FontFace("Courier Prime", `url(../../resources/fonts/CourierPrime/CourierPrimeBold.ttf)`, { style: "normal", weight: "bold" }),
            Italic: new FontFace("Courier Prime", `url(../../resources/fonts/CourierPrime/CourierPrimeItalic.ttf)`, { style: "italic", weight: "normal" }),
        },
        "Liberation Sans": {
            Regular: new FontFace("Liberation Sans", `url(../../resources/fonts/LiberationSans/LiberationSans-Regular.ttf)`, { style: "normal", weight: "normal" }),
            Bold: new FontFace("Liberation Sans", `url(../../resources/fonts/LiberationSans/LiberationSans-Bold.ttf)`, { style: "normal", weight: "bold" }),
            Italic: new FontFace("Liberation Sans", `url(../../resources/fonts/LiberationSans/LiberationSans-Italic.ttf)`, { style: "italic", weight: "normal" }),
        }
    };

    static g_fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72];
    static g_fontStyles: string[] = ["normal", "italic"];
    static g_fontWeights: string[] = ["normal", "bold"];
    static g_localFonts: string[] = [];

    static getAllFontFamilies = () => {
        return [...Object.keys(this.g_fonts), ... this.g_localFonts];
    }
}
