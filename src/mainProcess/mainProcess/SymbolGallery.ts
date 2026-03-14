import path from "path";
import { IpcEventArgType } from "../../common/IpcEventArgType";
import { scanSymbolGallery } from "../global/GlobalMethods";
import { DisplayWindowAgent } from "../windows/DisplayWindow/DisplayWindowAgent";
import type { MainProcess } from "./MainProcess";

export class SymbolGallery {
    private readonly _mainProcess: MainProcess;
    private _galleryData: Record<string, Record<string, string>> = {};

    constructor(mainProcess: MainProcess) {
        this._mainProcess = mainProcess;
    }

    getMainProcess = () => {
        return this._mainProcess;
    };

    getData = () => {
        return this._galleryData;
    };

    setData = (newData: Record<string, Record<string, string>>) => {
        this._galleryData = newData;
    };

    refreshData = () => {
        const selectedProfile = this.getMainProcess().getProfiles().getSelectedProfile();

        let customFolders: string[] = [];
        if (selectedProfile !== undefined) {
            const symbolLibrarySetting = selectedProfile.getEntry("EPICS Custom Environment", "Symbol Library");
            if (Array.isArray(symbolLibrarySetting)) {
                customFolders = symbolLibrarySetting;
            }
        }

        const builtInGalleryFolder = path.join(__dirname, "../../common/resources/symbolGallery");
        const galleryData = scanSymbolGallery(customFolders, builtInGalleryFolder);
        this.setData(galleryData);

        return galleryData;
    };

    getDataWithRefresh = (update: boolean = false) => {
        if (update === true || Object.keys(this.getData()).length === 0) {
            return this.refreshData();
        }

        return this.getData();
    };

    handleGetSymbolGallery = (options: IpcEventArgType["get-symbol-gallery"]) => {
        const { page, update, displayWindowId, widgetKey } = options;
        const galleryData = this.getDataWithRefresh(update === true);
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(displayWindowId);

        if (displayWindowAgent instanceof DisplayWindowAgent) {
            const pageNames = Object.keys(galleryData);
            const pageName = pageNames[page];
            let pageImages: Record<string, string> = {};
            if (typeof pageName === "string") {
                pageImages = galleryData[pageName];
            }

            displayWindowAgent.sendFromMainProcess("get-symbol-gallery", {
                displayWindowId: displayWindowId,
                widgetKey: widgetKey,
                pageNames: pageNames,
                page: page,
                pageImages: pageImages,
            });
        }
    };
}
