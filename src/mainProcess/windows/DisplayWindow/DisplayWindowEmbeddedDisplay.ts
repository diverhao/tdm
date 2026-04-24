import { IpcEventArgType } from "../../../common/IpcEventArgType";
import { Log } from "../../../common/Log";
import { FileReader } from "../../file/FileReader";
import type { DisplayWindowAgent } from "./DisplayWindowAgent";

export class DisplayWindowEmbeddedDisplay {
    private readonly _displayWindowAgent: DisplayWindowAgent;

    constructor(displayWindowAgent: DisplayWindowAgent) {
        this._displayWindowAgent = displayWindowAgent;
    }

    handleReadEmbeddedDisplayTdl = async (data: IpcEventArgType["read-embedded-display-tdl"]) => {
        const { displayWindowId, widgetKey, tdlFileName, currentTdlFolder, macros, widgetWidth, widgetHeight, resize } = data;
        const selectedProfile = this.getMainProcess().getProfiles().getSelectedProfile();
        const displayWindowAgent = this.getDisplayWindowAgent();

        try {
            const tdlResult = await FileReader.readTdlFile(tdlFileName, selectedProfile, currentTdlFolder);
            if (tdlResult !== undefined) {
                displayWindowAgent.sendFromMainProcess("read-embedded-display-tdl", {
                    displayWindowId: displayWindowId,
                    widgetKey: widgetKey,
                    tdl: tdlResult["tdl"],
                    macros: macros,
                    fullTdlFileName: tdlResult["fullTdlFileName"],
                    widgetWidth: widgetWidth,
                    widgetHeight: widgetHeight,
                    resize: resize,
                    tdlFileName: tdlFileName,
                });
            } else {
                Log.error(`Cannot read file ${tdlFileName}`);
                displayWindowAgent.sendFromMainProcess("read-embedded-display-tdl", {
                    displayWindowId: displayWindowId,
                    widgetKey: widgetKey,
                    macros: macros,
                    widgetWidth: widgetWidth,
                    widgetHeight: widgetHeight,
                    resize: resize,
                    tdlFileName: tdlFileName,
                });
            }
        } catch (e) {
            Log.error(`Cannot read file ${tdlFileName}`, e);
            displayWindowAgent.sendFromMainProcess("read-embedded-display-tdl", {
                displayWindowId: displayWindowId,
                widgetKey: widgetKey,
                macros: macros,
                widgetWidth: widgetWidth,
                widgetHeight: widgetHeight,
                resize: resize,
                tdlFileName: tdlFileName,
            });
        }
    };

    getDisplayWindowAgent = () => {
        return this._displayWindowAgent;
    };

    private getWindowAgentsManager = () => {
        return this.getDisplayWindowAgent().getWindowAgentsManager();
    };

    private getMainProcess = () => {
        return this.getWindowAgentsManager().getMainProcess();
    };
}
