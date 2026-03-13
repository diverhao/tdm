import * as fs from "fs";
import { dialog } from "electron";
import { IpcEventArgType } from "../../../common/IpcEventArgType";
import { DisplayWindowAgent } from "../../windows/DisplayWindow/DisplayWindowAgent";
import { IpcManagerOnMainProcess } from "../../mainProcess/IpcManagerOnMainProcess";
import { Log } from "../../../common/Log";


/**
 * Main-process IPC handlers for TextEditor-related events.
 *
 * This class owns open/save orchestration at the IPC boundary:
 * - resolve user file selection when needed,
 * - validate file path/access,
 * - enforce file-size limits for opening,
 * - route results/errors back to the originating display window.
 */
export class TextEditorHandlers {

    /** Owning IPC manager used to access main-process services and window agents. */
    private readonly _ipcManager: IpcManagerOnMainProcess;

    /** @param ipcManager Main-process IPC manager that wires this handler instance. */
    constructor(ipcManager: IpcManagerOnMainProcess) {
        this._ipcManager = ipcManager;
    }

    // ------------------- handlers ---------------------

    /**
     * Handle the `open-text-file` event from renderer.
     *
     * Behavior matrix:
     * | case | fileName | fileContent | manualOpen | openNewWindow | action |
     * |------|----------|-------------|------------|---------------|--------|
     * | 1 | ignored | ignored | true  | true/false | prompt user to pick a file, then open |
     * | 2 | absolute path | ignored | false | true/false | open specified file |
     * | 3 | "" | any string | false | ignored | create new TextEditor window with provided content |
     *
     * Notes:
     * - `fileName` must be an absolute path when provided.
     * - files >= `textEditorHardFileSizeLimit` are rejected before reading.
     */
    handleOpenTextFile = async (event: WebSocket | string, options: IpcEventArgType["open-text-file"]) => {

        const ipcManager = this.getIpcManager();
        const { displayWindowId, widgetKey, openNewWindow, fileName, fileContent, manualOpen } = options;
        const displayWindowAgent = ipcManager.getMainProcess().getWindowAgentsManager().getAgent(displayWindowId);

        if (!(displayWindowAgent instanceof DisplayWindowAgent)) {
            return;
        }

        const result = await displayWindowAgent.getDisplayWindowFile().openFile(fileName, fileContent, manualOpen, "text");
        if (result === undefined) {
            return;
        }

        if (result["fileName"] === "") {
            ipcManager.createUtilityDisplayWindow("", {
                utilityType: "TextEditor",
                utilityOptions: {
                    fileName: result["fileName"],
                    fileContent: result["fileContent"],
                },
                windowId: displayWindowId,
            });
            return;
        }

        if (openNewWindow === true) {
            ipcManager.createUtilityDisplayWindow("", {
                utilityType: "TextEditor",
                utilityOptions: {
                    fileName: result["fileName"],
                    fileContent: "",
                },
                windowId: displayWindowId,
            });
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
    }


    /**
     * Save the current TextEditor contents to disk.
     *
     * Behavior:
     * - If `data.fileName` is non-empty string, overwrite that file.
     * - If `data.fileName` is empty string, treat the request as "Save As" and prompt
     *   the user for a destination path.
     * - In `web` mode, saving to the server is disabled and the request fails.
     * - On success, send `save-text-file-status` back to the display window so the
     *   renderer can update its file name and modified state.
     * - On failure, show an error dialog and return `false`.
     *
     * @returns `true` when the file is written successfully; otherwise `false`.
     */
    handleSaveTextFile = (event: WebSocket | string, data: IpcEventArgType["save-text-file"]): boolean => {
        const ipcManager = this.getIpcManager();
        const mainProcess = ipcManager.getMainProcess();
        const mainProcessMode = mainProcess.getMainProcessMode();

        if (mainProcessMode === "web") {
            // do not save in web server
            return false;
        }
        const displayWindowAgent = mainProcess.getWindowAgentsManager().getAgent(data["displayWindowId"]);
        const originalFileName: string | undefined = data["fileName"];
        let fileName: string | undefined = originalFileName;
        if (!(displayWindowAgent instanceof DisplayWindowAgent)) {
            return false;
        }

        try {
            // save as
            if (fileName === "") {
                // user selects a file
                fileName = this._selectTextFileToSave(data);
                if (fileName === "") {
                    // user did not select a file
                    return false;
                }
            }
            fs.writeFileSync(fileName, data["fileContents"]);

            // tell the display window the new file name
            if (fileName !== originalFileName) {
                displayWindowAgent.sendFromMainProcess("update-text-editor-file-name", {
                    displayWindowId: data["displayWindowId"],
                    widgetKey: data["widgetKey"],
                    fileName: fileName,
                })
            }
            displayWindowAgent.sendFromMainProcess("update-text-editor-modified-status", {
                displayWindowId: data["displayWindowId"],
                widgetKey: data["widgetKey"],
            });
            return true;
        } catch (e) {
            displayWindowAgent.showError([`Error saving file ${fileName}`], [`${e}`]);
            Log.error("0", e);
            return false;
        }
    }

    // -------------------- helpers ----------------------

    /**
     * Ask user to select/input destination path for saving text content.
     *
     * Desktop mode opens the native save-file dialog and returns the selected path.
     * SSH mode cannot choose files in main process, so it requests a renderer input-box
     * dialog and returns an empty string to indicate deferred handling.
     *
     * @returns Selected save path, or empty string when canceled/unavailable/deferred.
     */
    private _selectTextFileToSave = (data: IpcEventArgType["save-text-file"]): string => {
        const ipcManager = this.getIpcManager();
        const mainProcess = ipcManager.getMainProcess();
        const mainProcessMode = mainProcess.getMainProcessMode();

        const displayWindowAgent = mainProcess.getWindowAgentsManager().getAgent(data["displayWindowId"]);
        let fileName: string | undefined = data["fileName"];
        if (!(displayWindowAgent instanceof DisplayWindowAgent)) {
            return "";
        }


        if (mainProcessMode === "desktop") {
            fileName = dialog.showSaveDialogSync({
                title: "Save file to",
            });
        } else if (mainProcessMode === "ssh-server") {
            displayWindowAgent.sendFromMainProcess("dialog-show-input-box",
                {
                    info: {
                        command: "save-text-file",
                        humanReadableMessages: ["Save file to"], // each string has a new line
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
                    }
                }
            );

            fileName = "";
        }
        return fileName;
    }

    // ------------------- getters ------------------------

    /** Expose the owning IPC manager for internal helper methods. */
    getIpcManager = (): IpcManagerOnMainProcess => {
        return this._ipcManager;
    }

}
