import * as fs from "fs";
import { dialog } from "electron";
import { IpcEventArgType } from "../../../common/IpcEventArgType";
import { DisplayWindowAgent } from "../../windows/DisplayWindow/DisplayWindowAgent";
import path from "path";
import { IpcManagerOnMainProcess } from "../../mainProcess/IpcManagerOnMainProcess";
import { Log } from "../../../common/Log";
import { showDisplayWindowError } from "../WindowMessageBox";

const textEditorHardFileSizeLimit = 10 * 1024 * 1024;


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
        const { displayWindowId, widgetKey, fileContent, manualOpen, openNewWindow } = options;
        let fileNameToBeOpened = options["fileName"];
        const displayWindowAgent = ipcManager.getMainProcess().getWindowAgentsManager().getAgent(displayWindowId);

        if (!(displayWindowAgent instanceof DisplayWindowAgent)) {
            return;
        }

        // obtain the file name from user selection
        // (1)
        if (manualOpen === true) {
            const selectedFileName = this._selectTextFileToOpen(options);
            if (selectedFileName === undefined) {
                return;
            } else {
                fileNameToBeOpened = selectedFileName;
            }
        }

        if (fileNameToBeOpened !== "") {
            if (path.isAbsolute(fileNameToBeOpened) === false) {
                showDisplayWindowError(displayWindowAgent, [`Text file path must be absolute: ${fileNameToBeOpened}`]);
                return;
            }

            try {
                fs.accessSync(fileNameToBeOpened, fs.constants.F_OK);
                fs.accessSync(fileNameToBeOpened, fs.constants.R_OK);
            } catch (e) {
                showDisplayWindowError(displayWindowAgent, [`Error opening file ${fileNameToBeOpened}`], [`${e}`]);
                return;
            }
        } else {
            // (2)
            ipcManager.createUtilityDisplayWindow("", {
                utilityType: "TextEditor",
                utilityOptions: {
                    fileName: "",
                    fileContent: fileContent,
                },
                windowId: displayWindowId,
            });
            return;
        }

        if (openNewWindow === true) {
            ipcManager.createUtilityDisplayWindow("", {
                utilityType: "TextEditor",
                utilityOptions: {
                    fileName: fileNameToBeOpened,
                    fileContent: "",
                },
                windowId: displayWindowId,
            });
        } else {
            let writable = false;
            try {
                fs.accessSync(fileNameToBeOpened, fs.constants.W_OK);
                writable = true;
            } catch (e) {
                writable = false;
            }

            const fileStats = fs.statSync(fileNameToBeOpened);
            const fileSize = fileStats.size;
            if (fileSize >= textEditorHardFileSizeLimit) {
                showDisplayWindowError(displayWindowAgent, [`This file is too large (${Math.round(fileSize / 1024 / 1024)} MB) to open. Please select a smaller file.`]);
                return;
            }
            try {
                const openedFileContents = await fs.promises.readFile(fileNameToBeOpened, "utf-8");
                displayWindowAgent.sendFromMainProcess("text-file-contents", {
                    displayWindowId: displayWindowId,
                    widgetKey: widgetKey,
                    fileName: fileNameToBeOpened,
                    fileContent: openedFileContents,
                    readable: true,
                    writable: writable,
                });
            } catch (e) {
                Log.error(e);
                showDisplayWindowError(displayWindowAgent, [`Failed to open file ${fileNameToBeOpened}`], [`${e}`]);
            }
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
            return true;
        } catch (e) {
            showDisplayWindowError(displayWindowAgent, [`Error saving file ${fileName}`], [`${e}`]);
            Log.error("0", e);
            return false;
        }
    }

    /**
     * Ask user to select a file to open.
     *
     * Desktop mode opens the native file picker and returns the selected absolute path.
     * SSH/Web mode cannot select locally in main process, so it asks the renderer to show
     * an input-box dialog and returns `undefined` to indicate deferred handling.
     *
     * @returns Selected file path if available; otherwise `undefined` (cancel/error/deferred prompt).
     */
    private _selectTextFileToOpen = (options: IpcEventArgType["open-text-file"]): string | undefined => {
        const ipcManager = this.getIpcManager();
        const { displayWindowId } = options;

        const windowAgent = ipcManager.getMainProcess().getWindowAgentsManager().getAgent(displayWindowId);
        if (!(windowAgent instanceof DisplayWindowAgent)) {
            return undefined;
        }


        let fileNameToBeOpened = "";

        try {
            if (ipcManager.getMainProcess().getMainProcessMode() === "desktop") {
                const fileNames = dialog.showOpenDialogSync({ title: "Open text file" });
                if (fileNames === undefined || fileNames.length === 0) {
                    return;
                }
                fileNameToBeOpened = fileNames[0];
            } else if (ipcManager.getMainProcess().getMainProcessMode() === "ssh-server" || ipcManager.getMainProcess().getMainProcessMode() === "web") {
                windowAgent.sendFromMainProcess("dialog-show-input-box",
                    {
                        info: {
                            command: "open-text-file",
                            humanReadableMessages: ["Open a file"],
                            buttons: [
                                {
                                    text: "OK",
                                },
                                {
                                    text: "Cancel",
                                }
                            ],
                            defaultInputText: "",
                            attachment: options,
                        }
                    }
                );
                return undefined;
            }
        } catch (e) {
            return undefined;
        }
        return fileNameToBeOpened;
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
