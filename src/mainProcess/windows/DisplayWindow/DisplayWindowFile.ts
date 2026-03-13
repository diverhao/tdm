import { IpcEventArgType, type_fileType } from "../../../common/IpcEventArgType";
import * as fs from "fs";
import { dialog } from "electron";
import path from "path";
import { Log } from "../../../common/Log";
import { DisplayWindowAgent } from "./DisplayWindowAgent";
import { FileReader } from "../../file/FileReader";
import { fileDialogOptionsByType } from "../../../common/types/type_Files";

const fileSizeLimit = 1024 * 1024 * 20;

/**
 * Handles file save flows for a display window in desktop and SSH server modes.
 */
export class DisplayWindowFile {
    private readonly displayWindowAgent: DisplayWindowAgent;
    selectFileInputResolve: (value: any) => void = () => { };

    constructor(displayWindowAgent: DisplayWindowAgent) {
        this.displayWindowAgent = displayWindowAgent;
    }

    // -------------------- read file ----------------------


    /**
     * Open a file
     *
     * Behavior matrix:
     * | # | fileName      | fileContent| manualOpen  | action                                |
     * |---|---------------|------------|-------------|---------------------------------------|
     * | 1 | ignored       | ignored    | true        | prompt user to pick a file, then open |
     * | 2 | absolute path | ignored    | false       | open specified file                   |
     * | 3 | ""            | any string | false       | return the file name and content      |
     *
     * Notes:
     * - `fileName` must be an absolute path when provided.
     * - files >= `textEditorHardFileSizeLimit` are rejected before reading.
     */
    openFile = async (fileName: string, fileContent: string, manualOpen: boolean, fileType: type_fileType): Promise<{ fileName: string, fileContent: string, writable: boolean } | undefined> => {

        const displayWindowAgent = this.getDisplayWindowAgent();

        if (manualOpen === true) {
            const selectedFileName = await this.selectFile(fileType);
            if (selectedFileName === undefined) {
                return undefined;
            } else {
                fileName = selectedFileName;
            }
        }

        if (fileName === "") {
            return {
                fileName: "",
                fileContent: fileContent,
                writable: false,
            }
        } else {
            if (path.isAbsolute(fileName) === false) {
                displayWindowAgent.showError([`Text file path must be absolute: ${fileName}`]);
                return undefined;
            }

            try {
                fs.accessSync(fileName, fs.constants.F_OK);
                fs.accessSync(fileName, fs.constants.R_OK);
            } catch (e) {
                displayWindowAgent.showError([`Error opening file ${fileName}`], [`${e}`]);
                return undefined;
            }
            const fileStats = fs.statSync(fileName);
            const fileSize = fileStats.size;
            if (fileSize >= fileSizeLimit) {
                displayWindowAgent.showError([`This file is too large (${Math.round(fileSize / 1024 / 1024)} MB) to open. Please select a smaller file.`]);
                return undefined;
            }
            let writable = false;
            try {
                fs.accessSync(fileName, fs.constants.W_OK);
                writable = true;
            } catch (e) {
                writable = false;
            }
            try {
                fileContent = await fs.promises.readFile(fileName, "utf-8");
                return {
                    fileName: fileName,
                    fileContent: fileContent,
                    writable: writable,
                }
            } catch (e) {
                displayWindowAgent.showError([`Failed to read file ${fileName}`]);
                return undefined;
            }
        }
    }

    /**
     * Ask user to select a file. 
     *
     * Desktop mode opens the native file picker and returns the selected absolute path.
     * SSH/Web mode cannot select locally in main process, so it asks the renderer to show
     * an input-box dialog and returns `undefined` to indicate deferred handling.
     *
     * @returns Selected file path if available; otherwise `undefined` (cancel/error/deferred prompt).
     */
    private selectFile = async (fileType: type_fileType): Promise<string | undefined> => {

        const mainProcessMode = this.getDisplayWindowAgent().getWindowAgentsManager().getMainProcess().getMainProcessMode();

        try {
            if (mainProcessMode === "desktop") {
                const fileNames = dialog.showOpenDialogSync({
                    title: fileDialogOptionsByType[fileType].displayText,
                    filters: fileDialogOptionsByType[fileType].filters,
                });
                if (fileNames === undefined || fileNames.length === 0) {
                    return undefined;
                }
                return fileNames[0];
            } else if (mainProcessMode === "ssh-server" || mainProcessMode === "web") {
                const displayWindowAgent = this.getDisplayWindowAgent();
                displayWindowAgent.showInputBox({
                    command: "input-file-path",
                    humanReadableMessages: ["Type the file absolute path"],
                    buttons: [
                        {
                            text: "OK",
                        },
                        {
                            text: "Cancel",
                        }
                    ],
                    defaultInputText: "",
                });
                const fileName = await new Promise<string>((resolve, reject) => {
                    this.selectFileInputResolve = resolve;
                });
                return fileName;
            } else {
                Log.error("Main process has no mode", mainProcessMode);
            }
        } catch (e) {
            Log.error(e);
        }
        return undefined;
    }



    // ------------------ write file -----------------------

    private canWriteToPath = (fileName: string): boolean => {
        try {
            if (fs.existsSync(fileName)) {
                fs.accessSync(fileName, fs.constants.W_OK);
                return true;
            }

            fs.accessSync(path.dirname(fileName), fs.constants.W_OK);
            return true;
        } catch {
            return false;
        }
    };

    private writeFile = (fileName: string, fileContent: string): boolean => {
        try {
            fs.writeFileSync(fileName, fileContent);
            return true;
        } catch (error) {
            Log.error("0", `Cannot save file ${fileName}`, `${error}`);
            return false;
        }
    };

    /**
     * Save arbitrary file content, prompting for a destination when needed.
     *
     * - If `fileName` is non-empty and writable, writes directly.
     * - Otherwise shows a save dialog in desktop mode or an input box in SSH mode to collect a path.
     * Returns `true` on successful write; `false` on user cancel or write failure (after showing an error).
     * @param fileName Absolute path hint; can be empty to force prompting.
     * @param fileContent Serialized payload to write.
     * @param dataType File category used to pick dialog defaults and filters.
     * @returns Promise that resolves `true` on successful write, `false` otherwise.
     */
    saveFile = async (fileName: string, fileContent: string, dataType: type_fileType,): Promise<boolean> => {
        const saveOptions = fileDialogOptionsByType[dataType];
        const displayWindowAgent = this.getDisplayWindowAgent();
        const mainProcessMode = displayWindowAgent.getWindowAgentsManager().getMainProcess().getMainProcessMode();
        fileName = fileName.trim();

        // file writable, just write
        if (fileName !== "" && this.canWriteToPath(fileName)) {
            const result = this.writeFile(fileName, fileContent);
            if (result === true) {
                return true;
            } else {
                displayWindowAgent.showError([`Failed to save file ${fileName}`])
                return false;
            }
        }

        // file not writable, ask user to select a file
        if (mainProcessMode === "desktop") {

            fileName = dialog.showSaveDialogSync({
                title: "Select a file to save to",
                defaultPath: saveOptions.defaultFileName,
                filters: saveOptions.filters,
            });
        } else if (mainProcessMode === "ssh-server") {
            displayWindowAgent.showInputBox({
                command: "input-file-path",
                humanReadableMessages: ["Type the file absolute path"],
                buttons: [
                    {
                        text: "OK",
                    },
                    {
                        text: "Cancel",
                    }
                ],
                defaultInputText: "",
            });
            fileName = await new Promise<string>((resolve, reject) => {
                this.selectFileInputResolve = resolve;
            });
        }

        if (fileName === undefined || fileName === "") {
            // user cancels the selection, do not show notification
            return false;
        }

        const success = this.writeFile(fileName, fileContent);
        if (success) {
            return true;
        } else {
            displayWindowAgent.showError([`Failed to save file ${fileName}`])
            return false;
        }
    }

    // --------------------- event handlers -----------------------


    saveTdlFile = async (options: IpcEventArgType["save-tdl-file"]): Promise<void> => {
        const { windowId, tdl, tdlFileName1 } = options;
        const displayWindowAgent = this.getDisplayWindowAgent();
        const mainProcess = displayWindowAgent.getWindowAgentsManager().getMainProcess();
        const mainProcessMode = mainProcess.getMainProcessMode();
        const success = await this.saveFile(tdlFileName1, JSON.stringify(tdl), "tdl");

        if (success) {
            displayWindowAgent.sendFromMainProcess("tdl-file-saved", {
                newTdlFileName: tdlFileName1
            });
        }
    }

    loadTdlFile = async (options: IpcEventArgType["load-tdl-file"]): Promise<void> => {
        const { tdlFileName, mode, editable, externalMacros, replaceMacros, currentTdlFolder } = options;
        const displayWindowAgent = this.getDisplayWindowAgent();
        const selectedProfile = displayWindowAgent.getWindowAgentsManager().getMainProcess().getProfiles().getSelectedProfile();
        if (selectedProfile === undefined) {
            Log.error("0", "Profile not selected.");
            return;
        }

        if (tdlFileName === "") {
            displayWindowAgent.sendFromMainProcess("new-tdl", {
                newTdl: FileReader.getBlankWhiteTdl(),
                tdlFileName: "",
                initialModeStr: mode,
                editable: editable,
                externalMacros: externalMacros,
                useExternalMacros: replaceMacros,
                utilityType: undefined,
                utilityOptions: {},
            });
            return;
        }

        const tdlResult = await FileReader.readTdlFile(tdlFileName, selectedProfile, currentTdlFolder);
        if (tdlResult === undefined) {
            return;
        }

        displayWindowAgent.sendFromMainProcess("new-tdl", {
            newTdl: tdlResult["tdl"],
            tdlFileName: tdlResult["fullTdlFileName"],
            initialModeStr: mode,
            editable: editable,
            externalMacros: externalMacros,
            useExternalMacros: replaceMacros,
            utilityType: undefined,
            utilityOptions: {},
        });
    }

    
    // ------------------- getters -----------------

    getDisplayWindowAgent = () => {
        return this.displayWindowAgent;
    };
}
