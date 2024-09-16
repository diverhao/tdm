export class FontsData {
    constructor() { }

    static g_fonts: Record<string, Record<string, FontFace>> = {
        "TDM Default": {
            Regular: new FontFace("TDM Default", `url(../../resources/fonts/LiberationSans/LiberationSans-Regular.ttf)`),
        },
        Tinos: {
            Regular: new FontFace("Tinos", `url(../../resources/fonts//Tinos/Tinos-Regular.ttf)`),
        },
        "Courier Prime": {
            Regular: new FontFace("Courier Prime", `url(../../resources/fonts/CourierPrime/CourierPrime.ttf)`),
        },
        "Liberation Sans": {
            Regular: new FontFace("Liberation Sans", `url(../../resources/fonts/LiberationSans/LiberationSans-Regular.ttf)`),
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
