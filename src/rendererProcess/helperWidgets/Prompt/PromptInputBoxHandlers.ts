import { IpcEventArgType, type_DialogInputBox } from "../../../common/IpcEventArgType";
import type { Prompt } from "./Prompt";

type type_SendFromRendererProcess = (channelName: keyof IpcEventArgType, data: any) => void;

export class PromptInputBoxHandlers {
    private readonly _prompt: Prompt;

    constructor(prompt: Prompt) {
        this._prompt = prompt;
    }

    handleDialogShowInputBox = (info: type_DialogInputBox, sendFromRendererProcess: type_SendFromRendererProcess) => {
        const command = info["command"];
        const handlers: Record<string, (info: type_DialogInputBox, sendFromRendererProcess: type_SendFromRendererProcess) => void> = {
            "open-profiles": this._handleOpenProfiles,
            "hide": this._handleHide,
            "save-profiles-as": this._handleSaveProfilesAs,
            "save-tdl-file": this._handleSaveTdlFile,
            "window-will-be-closed-user-select-save": this._handleWindowWillBeClosedUserSelectSave,
            "save-data-to-file": this._handleSaveDataToFile,
            "save-text-file": this._handleSaveTextFile,
            "select-a-file": this._handleSelectAFile,
            "open-text-file": this._handleOpenTextFile,
            "open-tdl-file": this._handleOpenTdlFile,
            "input-file-path": this._handleInputFilePath,
        };

        const handler = handlers[command];
        if (handler !== undefined) {
            handler(info, sendFromRendererProcess);
        }

        return command !== "hide";
    }

    private _handleOpenProfiles = (info: type_DialogInputBox, sendFromRendererProcess: type_SendFromRendererProcess) => {
        this._setTwoButtonHandlers(info, () => {
            const fileName = this.getPrompt().getDialogInputBoxText();
            if (fileName !== "") {
                sendFromRendererProcess("open-profiles", {
                    profilesFileName1: fileName
                });
            }
        });
    }

    private _handleHide = (_info: type_DialogInputBox, _sendFromRendererProcess: type_SendFromRendererProcess) => {
        this.getPrompt().removeElement();
    }

    private _handleSaveProfilesAs = (info: type_DialogInputBox, sendFromRendererProcess: type_SendFromRendererProcess) => {
        const attachment = info["attachment"];
        this._setTwoButtonHandlers(info, () => {
            const filePath = this.getPrompt().getDialogInputBoxText();
            if (filePath !== "") {
                attachment["filePath1"] = filePath;
                sendFromRendererProcess("save-profiles-as", {
                    modifiedProfiles: attachment["modifiedProfiles"],
                    filePath1: attachment["filePath1"],
                });
            }
        });
    }

    private _handleSaveTdlFile = (info: type_DialogInputBox, sendFromRendererProcess: type_SendFromRendererProcess) => {
        const attachment = info["attachment"];
        this._setTwoButtonHandlers(info, () => {
            const tdlFileName = this.getPrompt().getDialogInputBoxText();
            if (tdlFileName !== "") {
                attachment["tdlFileName1"] = tdlFileName;
                sendFromRendererProcess("save-tdl-file", {
                    windowId: attachment["windowId"],
                    tdl: attachment["tdl"],
                    tdlFileName1: attachment["tdlFileName1"],
                });
            }
        });
    }


    private _handleWindowWillBeClosedUserSelectSave = (info: type_DialogInputBox, sendFromRendererProcess: type_SendFromRendererProcess) => {
        const attachment = info["attachment"];
        this._setTwoButtonHandlers(info, () => {
            const fileName = this.getPrompt().getDialogInputBoxText();
            if (fileName !== "") {
                attachment["fileName"] = fileName;
                sendFromRendererProcess("window-will-be-closed-user-select", attachment);
            }
        });
    }

    private _handleSaveDataToFile = (info: type_DialogInputBox, sendFromRendererProcess: type_SendFromRendererProcess) => {
        const attachment = info["attachment"];
        this._setTwoButtonHandlers(info, () => {
            const fileName = this.getPrompt().getDialogInputBoxText();
            if (fileName !== "") {
                attachment["fileName"] = fileName;
                sendFromRendererProcess("save-data-to-file", attachment);
            }
        });
    }


    private _handleSaveTextFile = (info: type_DialogInputBox, sendFromRendererProcess: type_SendFromRendererProcess) => {
        const attachment = info["attachment"];
        this._setTwoButtonHandlers(info, () => {
            const fileName = this.getPrompt().getDialogInputBoxText();
            if (fileName !== "") {
                attachment["fileName"] = fileName;
                sendFromRendererProcess("save-text-file", attachment);
            }
        });
    }

    private _handleSelectAFile = (info: type_DialogInputBox, sendFromRendererProcess: type_SendFromRendererProcess) => {
        const attachment = info["attachment"];
        this._setTwoButtonHandlers(info, () => {
            const fileName = this.getPrompt().getDialogInputBoxText();
            if (fileName !== "") {
                sendFromRendererProcess("select-a-file", {
                    options: attachment,
                    fileName1: fileName,
                });
            }
        });
    }

    private _handleOpenTextFile = (info: type_DialogInputBox, sendFromRendererProcess: type_SendFromRendererProcess) => {
        const attachment = info["attachment"];
        this._setTwoButtonHandlers(info, () => {
            const fileName = this.getPrompt().getDialogInputBoxText();
            if (fileName !== "") {
                attachment["fileName"] = fileName;
                sendFromRendererProcess("open-text-file", attachment);
            }
        });
    }

    private _handleInputFilePath = (info: type_DialogInputBox, sendFromRendererProcess: type_SendFromRendererProcess) => {
        this._setTwoButtonHandlers(info, () => {
            const fileName = this.getPrompt().getDialogInputBoxText();
            if (fileName !== "") {
                const windowId = this._getWindowId();
                if (windowId === undefined) {
                    return;
                }
                sendFromRendererProcess("input-file-path", {
                    windowId: windowId,
                    fileName: fileName
                });
            }
        });
    }



    private _handleOpenTdlFile = (info: type_DialogInputBox, sendFromRendererProcess: type_SendFromRendererProcess) => {
        const attachment = info["attachment"];
        this._setTwoButtonHandlers(info, () => {
            const tdlFileName = this.getPrompt().getDialogInputBoxText();
            if (tdlFileName !== "") {
                attachment["tdlFileNames"] = [tdlFileName];
                sendFromRendererProcess("open-tdl-file", attachment);
            }
        });
    }

    private _setTwoButtonHandlers = (info: type_DialogInputBox, handleOk: () => void, handleCancel: () => void = () => { }) => {
        const buttons = info["buttons"];
        if (buttons !== undefined && buttons.length === 2) {
            buttons[0]["handleClick"] = handleOk;
            buttons[1]["handleClick"] = handleCancel;
        }
    }

    getPrompt = () => {
        return this._prompt;
    }

    private _getWindowId = (): string | undefined => {
        const prompt = this.getPrompt() as Prompt & {
            getDisplayWindowClient?: () => { getWindowId: () => string };
            getMainWindowClient?: () => { getWindowId: () => string };
        };

        if (typeof prompt.getDisplayWindowClient === "function") {
            return prompt.getDisplayWindowClient().getWindowId();
        }
        if (typeof prompt.getMainWindowClient === "function") {
            return prompt.getMainWindowClient().getWindowId();
        }

        return undefined;
    };
}
