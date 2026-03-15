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

    handleObtainIframeUuid = async (options: IpcEventArgType["obtain-iframe-uuid"]) => {
        const selectedProfile = this.getMainProcess().getProfiles().getSelectedProfile();

        let { tdl, tdlFileName, currentTdlFolder, mode, macros, replaceMacros, widgetKey } = options;
        if (tdl === undefined) {
            try {
                const tdlResult = await FileReader.readTdlFile(tdlFileName, selectedProfile, currentTdlFolder);
                if (tdlResult === undefined) {
                    Log.error(`Cannot read file ${tdlFileName}`);
                    return;
                } else {
                    ({ tdl, fullTdlFileName: tdlFileName } = tdlResult);
                }
            } catch (e) {
                Log.error(`Cannot read file ${tdlFileName}`, e);
                return;
            }
        }

        this.getWindowAgentsManager().createIframeDisplay(
            {
                tdl: tdl,
                mode: mode,
                editable: false,
                tdlFileName: tdlFileName,
                macros: macros,
                replaceMacros: replaceMacros,
                hide: false,
                utilityType: undefined,
                utilityOptions: undefined,
            },
            widgetKey,
            this.getDisplayWindowAgent().getId(),
        );
    };

    handleSwitchIframeDisplayTab = async (options: IpcEventArgType["switch-iframe-display-tab"]) => {
        Log.debug("try to obtain iframe uuid");
        const { tdlFileName, currentTdlFolder, widgetKey, macros, iframeDisplayId } = options;
        const selectedProfile = this.getMainProcess().getProfiles().getSelectedProfile();

        try {
            const tdlResult = await FileReader.readTdlFile(tdlFileName, selectedProfile, currentTdlFolder);
            if (tdlResult === undefined) {
                Log.error(`Cannot read file ${tdlFileName}`);
                return;
            }

            const { tdl, fullTdlFileName } = tdlResult;
            this.getWindowAgentsManager().createIframeDisplay(
                {
                    tdl: tdl,
                    mode: options["mode"],
                    editable: false,
                    tdlFileName: fullTdlFileName,
                    macros: macros,
                    replaceMacros: false,
                    hide: false,
                    utilityType: undefined,
                    utilityOptions: undefined,
                },
                widgetKey,
                this.getDisplayWindowAgent().getId(),
            );
        } catch (e) {
            Log.error(`Failed to switch iframe display tab for widget ${widgetKey} in display window ${this.getDisplayWindowAgent().getId()} using TDL ${tdlFileName}.`, e);
            const iframeDisplayWindowAgent = this.getWindowAgentsManager().getAgent(iframeDisplayId) as DisplayWindowAgent | undefined;
            if (iframeDisplayWindowAgent !== undefined) {
                iframeDisplayWindowAgent.getDisplayWindowEmbeddedDisplay().handleCloseIframeDisplay();
            } else {
                Log.error(`Cannot find iframe display window ${iframeDisplayId} after switch-iframe-display-tab failure.`);
            }
        }
    };

    handleCloseIframeDisplay = () => {
        this.getDisplayWindowAgent().handleWindowClosed();
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
