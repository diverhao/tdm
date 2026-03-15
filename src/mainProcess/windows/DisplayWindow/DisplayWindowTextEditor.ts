import * as fs from "fs";
import { dialog } from "electron";
import { IpcEventArgType } from "../../../common/IpcEventArgType";
import { Log } from "../../../common/Log";
import type { DisplayWindowAgent } from "./DisplayWindowAgent";

/**
 * Main-process TextEditor flows scoped to a display window.
 *
 * This helper keeps text-file open/save orchestration close to the owning
 * `DisplayWindowAgent` while preserving the existing runtime behavior.
 */
export class DisplayWindowTextEditor {
    private readonly _displayWindowAgent: DisplayWindowAgent;

    constructor(displayWindowAgent: DisplayWindowAgent) {
        this._displayWindowAgent = displayWindowAgent;
    }

    handleOpenTextFile = async (options: IpcEventArgType["open-text-file"]) => {
        const { displayWindowId, widgetKey, openNewWindow, fileName, fileContent, manualOpen } = options;
        const displayWindowAgent = this.getDisplayWindowAgent();

        const result = await displayWindowAgent.getDisplayWindowFile().openFile(fileName, fileContent, manualOpen, "text");
        if (result === undefined) {
            return;
        }

        if (result["fileName"] === "") {
            this.getWindowAgentsManager().getUtilityWindowFactory().createUtilityDisplayWindow("TextEditor", {
                fileName: result["fileName"],
                fileContent: result["fileContent"],
            }, displayWindowId);
            return;
        }

        if (openNewWindow === true) {
            this.getWindowAgentsManager().getUtilityWindowFactory().createUtilityDisplayWindow("TextEditor", {
                fileName: result["fileName"],
                fileContent: "",
            }, displayWindowId);
        } else {
            displayWindowAgent.sendFromMainProcess("text-file-contents", {
                displayWindowId: displayWindowId,
                widgetKey: widgetKey,
                fileName: result["fileName"],
                fileContent: result["fileContent"],
                readable: true,
                writable: result["writable"],
            });
        }
    };

    handleSaveTextFile = (data: IpcEventArgType["save-text-file"]): boolean => {
        const mainProcessMode = this.getMainProcess().getMainProcessMode();
        if (mainProcessMode === "web") {
            return false;
        }

        const displayWindowAgent = this.getDisplayWindowAgent();
        const originalFileName: string | undefined = data["fileName"];
        let fileName: string | undefined = originalFileName;

        try {
            if (fileName === "") {
                fileName = this._selectTextFileToSave(data);
                if (fileName === "") {
                    return false;
                }
            }
            fs.writeFileSync(fileName, data["fileContents"]);

            if (fileName !== originalFileName) {
                displayWindowAgent.sendFromMainProcess("update-text-editor-file-name", {
                    displayWindowId: data["displayWindowId"],
                    widgetKey: data["widgetKey"],
                    fileName: fileName,
                });
            }
            displayWindowAgent.sendFromMainProcess("update-text-editor-modified-status", {
                displayWindowId: data["displayWindowId"],
                widgetKey: data["widgetKey"],
            });
            return true;
        } catch (e) {
            displayWindowAgent.showError([`Error saving file ${fileName}`], [`${e}`]);
            Log.error(e);
            return false;
        }
    };

    private _selectTextFileToSave = (data: IpcEventArgType["save-text-file"]): string => {
        const mainProcessMode = this.getMainProcess().getMainProcessMode();
        const displayWindowAgent = this.getDisplayWindowAgent();
        let fileName: string | undefined = data["fileName"];

        if (mainProcessMode === "desktop") {
            fileName = dialog.showSaveDialogSync({
                title: "Save file to",
            });
        } else if (mainProcessMode === "ssh-server") {
            displayWindowAgent.showInputBox({
                command: "save-text-file",
                humanReadableMessages: ["Save file to"],
                buttons: [
                    {
                        text: "OK",
                    },
                    {
                        text: "Cancel",
                    }
                ],
                defaultInputText: "",
                attachment: data,
            });

            fileName = "";
        }
        return fileName;
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
