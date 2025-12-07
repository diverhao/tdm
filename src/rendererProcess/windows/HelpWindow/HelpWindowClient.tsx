
import ReactDOM from "react-dom/client";
import { Help } from "../../../rendererProcess/helperWidgets/Help/Help";
import { FontsData_HelpWindow } from "../../../rendererProcess/global/FontsData_HelpWindow";

export class HelpWindowClient {
    constructor(){
        this._loadCustomFonts();
    }

    private _loadCustomFonts = () => {
        for (let font of Object.values(FontsData_HelpWindow.g_fonts)) {
            for (let fontFace of Object.values(font)) {
                fontFace.load().then(() => {
                    document.fonts.add(fontFace);
                }).catch((reason: any) => {
                    // Log.error(reason)
                    console.log(reason);
                });
            }
        }
    };

}

(window as any).HelpWindowClientClass = HelpWindowClient;

const help = new Help();

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(help.getElment());  