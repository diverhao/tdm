import { getBasePath } from "./GlobalVariables";

export class FontsData {
    constructor() { }

    // static basePath = (window as any).basePath === undefined ? "../../.." : (window as any).basePath;
    static basePath = getBasePath();

    // both web mode and desktop mode are loading the fonts from here, so we use `webpack` path to ensure both are working
    static g_fonts: Record<string, Record<string, FontFace>> = {
        "TDM Default": {
            Regular: new FontFace("TDM Default", `url(${this.basePath}/webpack/resources/fonts/Inter/Inter-VariableFont_opsz.ttf)`, { style: "normal", weight: "normal" }),
            Bold: new FontFace("TDM Default", `url(${this.basePath}/webpack/resources/fonts/Inter/Inter-VariableFont_opsz.ttf)`, { style: "normal", weight: "700" }),
            Italic: new FontFace("TDM Default", `url(${this.basePath}/webpack/resources/fonts/Inter/Inter-Italic-VariableFont_opsz,wght.ttf)`, { style: "italic", weight: "normal" }),
            ItalicBold: new FontFace("TDM Default", `url(${this.basePath}/webpack/resources/fonts/Inter/Inter-Italic-VariableFont_opsz,wght.ttf)`, { style: "italic", weight: "700" }),
        },
        "Inter": {
            Regular: new FontFace("Inter", `url(${this.basePath}/webpack/resources/fonts/Inter/Inter-VariableFont_opsz.ttf)`, { style: "normal", weight: "normal" }),
            Bold: new FontFace("Inter", `url(${this.basePath}/webpack/resources/fonts/Inter/Inter-VariableFont_opsz.ttf)`, { style: "normal", weight: "700" }),
            Italic: new FontFace("Inter", `url(${this.basePath}/webpack/resources/fonts/Inter/Inter-Italic-VariableFont_opsz,wght.ttf)`, { style: "italic", weight: "normal" }),
            ItalicBold: new FontFace("Inter", `url(${this.basePath}/webpack/resources/fonts/Inter/Inter-Italic-VariableFont_opsz,wght.ttf)`, { style: "italic", weight: "700" }),
        },
        "IBM Plex Mono": {
            Regular: new FontFace("IBM Plex Mono", `url(${this.basePath}/webpack/resources/fonts/IBM_Plex_Mono/IBMPlexMono-Regular.ttf)`, { style: "normal", weight: "normal" }),
            Bold: new FontFace("IBM Plex Mono", `url(${this.basePath}/webpack/resources/fonts/IBM_Plex_Mono/IBMPlexMono-Bold.ttf)`, { style: "normal", weight: "700" }),
            Italic: new FontFace("IBM Plex Mono", `url(${this.basePath}/webpack/resources/fonts//IBM_Plex_Mono/IBMPlexMono-Italic.ttf)`, { style: "italic", weight: "normal" }),
            ItalicBold: new FontFace("IBM Plex Mono", `url(${this.basePath}/webpack/resources/fonts//IBM_Plex_Mono/IBMPlexMono-BoldItalic.ttf)`, { style: "italic", weight: "700" }),
        },
        "Nimbus Roman": {
            Regular: new FontFace("Nimbus Roman", `url(${this.basePath}/webpack/resources/fonts/nimbus-roman-no9-l/NimbusRomNo9L-Reg.otf)`, { style: "normal", weight: "normal" }),
            Bold: new FontFace("Nimbus Roman", `url(${this.basePath}/webpack/resources/fonts/nimbus-roman-no9-l/NimbusRomNo9L-Med.otf)`, { style: "normal", weight: "700" }),
            Italic: new FontFace("Nimbus Roman", `url(${this.basePath}/webpack/resources/fonts/nimbus-roman-no9-l/NimbusRomNo9L-RegIta.otf)`, { style: "italic", weight: "normal" }),
            ItalicBold: new FontFace("Nimbus Roman", `url(${this.basePath}/webpack/resources/fonts/nimbus-roman-no9-l/NimbusRomNo9L-MedIta.otf)`, { style: "italic", weight: "700" }),
        },
        "Liberation Sans": {
            Regular: new FontFace("Liberation Sans", `url(${this.basePath}/webpack/resources/fonts/LiberationSans/LiberationSans-Regular.ttf)`, { style: "normal", weight: "normal" }),
            Bold: new FontFace("Liberation Sans", `url(${this.basePath}/webpack/resources/fonts/LiberationSans/LiberationSans-Bold.ttf)`, { style: "normal", weight: "bold" }),
            Italic: new FontFace("Liberation Sans", `url(${this.basePath}/webpack/resources/fonts/LiberationSans/LiberationSans-Italic.ttf)`, { style: "italic", weight: "normal" }),
        },
        "Courier Prime": {
            Regular: new FontFace("Courier Prime", `url(${this.basePath}/webpack/resources/fonts/CourierPrime/CourierPrime.ttf)`, { style: "normal", weight: "normal" }),
            Bold: new FontFace("Courier Prime", `url(${this.basePath}/webpack/resources/fonts/CourierPrime/CourierPrimeBold.ttf)`, { style: "normal", weight: "bold" }),
            Italic: new FontFace("Courier Prime", `url(${this.basePath}/webpack/resources/fonts/CourierPrime/CourierPrimeItalic.ttf)`, { style: "italic", weight: "normal" }),
        },
    };

    static g_fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72];
    static g_fontStyles: string[] = ["normal", "italic"];
    static g_fontWeights: string[] = ["normal", "bold"];
    static g_localFonts: string[] = [];

    static getAllFontFamilies = () => {
        return [...Object.keys(this.g_fonts), ... this.g_localFonts];
    }
}
