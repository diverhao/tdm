import { IpcEventArgType } from "../../../common/IpcEventArgType";
import * as fs from "fs";
import { dialog } from "electron";
import path from "path";
import { Log } from "../../../common/Log";
import { DisplayWindowAgent } from "./DisplayWindowAgent";
import { FileReader } from "../../file/FileReader";
import { fileToDataUri } from "../../global/GlobalMethods";
import { fileDialogOptionsByType, isOfFileType, type_fileType } from "../../../common/types/type_Files";
import * as os from "os";
import { Profile } from "../../profile/Profile";

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
     * Open a file from disk or return in-memory content for a new unsaved file.
     *
     * Behavior matrix:
     * | # | fileName      | fileContent | manualOpen | action                                |
     * |---|---------------|-------------|------------|---------------------------------------|
     * | 1 | ignored       | ignored     | true       | prompt user to pick a file, then open |
     * | 2 | absolute path | ignored     | false      | open specified file                   |
     * | 3 | ""            | any string  | false      | return the file name and content      |
     *
     * Notes:
     * - `fileName` must be an absolute path when provided.
     * - Files greater than or equal to `fileSizeLimit` are rejected before reading.
     *
     * @param fileName Absolute path to the file to open, or `""` to return `fileContent` as a new unsaved file.
     * @param fileContent Initial content to return when `fileName === ""`.
     * @param manualOpen When `true`, prompt the user to choose a file instead of using `fileName`.
     * @param fileType File category used to configure the open-file dialog.
     * @returns The opened file name, file contents, and writability flag, or `undefined` if selection is cancelled or opening fails.
     *          I user cancels the prompt, simply return undefined. If failed to open file, show error box on display window.
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

    // -------------------- db file ----------------------

    loadDbFileContents = async (data: IpcEventArgType["load-db-file-contents"]) => {
        const { widgetKey, displayWindowId } = data;
        let dbFileName = data["dbFileName"] ?? "";
        const manualOpen = data["dbFileName"] === undefined || data["dbFileName"] === "";

        try {
            if (dbFileName !== "" && !path.isAbsolute(dbFileName)) {
                const selectedProfile = this.getMainProcess().getProfiles().getSelectedProfile();
                dbFileName = FileReader.resolveTdlFileName(dbFileName, selectedProfile) ?? "";
                if (dbFileName === "") {
                    this.showError([`Failed to open db file ${data["dbFileName"]}`]);
                    return;
                }
            }

            const fileResult = await this.openFile(dbFileName, "", manualOpen, "db");
            if (fileResult === undefined) {
                return;
            }

            const dbFileContents = FileReader.parseDb(fileResult.fileContent);
            this.getDisplayWindowAgent().sendFromMainProcess("load-db-file-contents", {
                dbFileName: fileResult.fileName,
                displayWindowId: displayWindowId,
                widgetKey: widgetKey,
                dbFileContents: dbFileContents,
            });
        } catch (e) {
            Log.error(e);
            this.showError([`Failed to open db file`], [`${e}`]);
        }
    };



    // ------------------ write file -----------------------

    saveDataToFile = async (options: IpcEventArgType["save-data-to-file"]): Promise<void> => {
        const mainProcessMode = this.getMainProcess().getMainProcessMode();
        if (mainProcessMode === "web") {
            return;
        }

        const { data, preferredFileTypes } = options;
        const displayWindowAgent = this.getDisplayWindowAgent();
        Log.debug("We are going to save a file");
        let fileName = options["fileName"];

        try {
            if (fileName === undefined) {
                if (mainProcessMode === "desktop") {
                    fileName = dialog.showSaveDialogSync({ title: "Save data to file", filters: [{ name: "", extensions: preferredFileTypes }] });
                } else if (mainProcessMode === "ssh-server") {
                    displayWindowAgent.showInputBox({
                        command: "save-data-to-file",
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
                        attachment: options,
                    });
                    return;
                }
            }

            if (fileName === undefined) {
                displayWindowAgent.showError([`Failed to save file: file not selected`], [""]);
                return;
            }

            await fs.promises.writeFile(fileName, JSON.stringify(data, null, 4));
            Log.info(`Saved tdl to file ${fileName}`);
        } catch (e) {
            Log.error(e);
            if (fileName !== undefined) {
                displayWindowAgent.showError([`Failed to save ${fileName}`, "Please check the file permission."], ["Below is the raw message:", `${e}`]);
            }
        }
    };

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
            Log.error(`Cannot save file ${fileName}`, `${error}`);
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

    /**
     * Open one or more TDL files, create Display Window for each TDL file.
     * 
     * A TDL file may be .tdl, .db, .bob, .edl, .stp, and .template
     * 
     *  - for desktop mode, it create an electron.js BrowserWindow (or replace the preloaded BrowserWindow)
     *  - for web mode, it opens new tab for the first tdl file
     * 
     * There are 4 cases depending on parameters `tdl` and `tdlFileNames`
     * 
     *  (1) if `tdl` is defined, open the new display window with this tdl content
     * 
     *  (2) if `tdlFileNames` is undefined, show file open prompt, let the user select one or more
     *    TDL files to open
     * 
     *  (3) if `tdlFileNames` is an empty array, create a blank display window, with editing mode
     * 
     *  (4) if `tdlFileNames` is a non-empty string array, the strings are considered as TDL file names
     *    open each one in separate Display Window
     * 
     * @param tdl the JSON object that represents the TDL
     * 
     * @param tdlFileNames undefined or string array, TDL file names, can be absolute or relative
     * 
     * @param mode editing or operating
     * 
     * @param editable if the display is editable
     * 
     * @param macros the externally provided macros, it will append to the profile-provided macros
     *               but it may be overridden by the TDL-provided macros
     * 
     * @param replaceMacros whether to replace the macros 
     * 
     * @param currentTdlFolder a folder that is used for resolving the TDL file absolute path
     *                         it has the highest priority in TDL path resolution
     * 
     * @param windowId the window ID that initiated this TDL file open
     * 
     * @param sendContentsToWindow whether to send file back to display window, only used by .db 
     */
    openTdlFiles = async (data: IpcEventArgType["open-tdl-file"]) => {
        const { options } = data;
        let { tdl, tdlFileNames, windowId, mode, editable, macros, replaceMacros, currentTdlFolder } = options;
        const mainProcess = this.getDisplayWindowAgent().getWindowAgentsManager().getMainProcess();
        const windowAgentsManager = mainProcess.getWindowAgentsManager();
        const selectedProfile = mainProcess.getProfiles().getSelectedProfile();
        if (selectedProfile === undefined) {
            Log.error("Profile not selected!");
            return;
        }

        const windowAgent = this.getDisplayWindowAgent();

        try {
            if (tdl !== undefined) { // the tdl content is provided, skip reading files from hard drive, available in all modes
                // (1)
                const tdlFileName = tdlFileNames === undefined ? "" : tdlFileNames[0];
                windowAgentsManager.createDisplayWindow(
                    {
                        tdl: tdl,
                        mode: mode,
                        editable: editable,
                        tdlFileName: tdlFileName,
                        macros: macros,
                        replaceMacros: replaceMacros,
                        hide: false,
                        windowId: windowId,
                    },
                );
            } else if (tdlFileNames === undefined) { // manually select the file, only available in desktop mode
                // (2)
                let defaultPath = "";
                if (currentTdlFolder !== undefined && fs.existsSync(currentTdlFolder)) {
                    defaultPath = currentTdlFolder;
                }
                // modify tdlFileNames to a string array

                const tdlFileName = await this.selectFile("tdl");
                if (tdlFileName === undefined) {
                    Log.error("No TDL file selected.");
                    return;
                }

                // the manually opened TDL file's editing permission and its mode are determined by Profile
                editable = selectedProfile.getEditable();
                mode = selectedProfile.getManuallyOpenedTdlMode();
                if (mode === "editing") {
                    editable = true;
                }

                windowAgentsManager.createDisplayWindows([tdlFileName], mode, editable, options["macros"], options["currentTdlFolder"], windowId);

            } else if (tdlFileNames.length === 0) { // create a blank window, available in all modes
                // (3)
                windowAgentsManager.createBlankDisplayWindow(options["windowId"]);
            } else if (tdlFileNames.length > 0) { // open all the files, available in all modes
                // (4)
                windowAgentsManager.createDisplayWindows(tdlFileNames, mode, editable, options["macros"], options["currentTdlFolder"], windowId);
            }
        } catch (e) {
            Log.error(e);
            windowAgent.showError([`Failed to open file ${tdlFileNames}`], [`${e}`]);
        }
    };

    /**
     * Reload TDL file from web page or desktop mode
     */
    reloadTdlFile = async (data: IpcEventArgType["reload-tdl-file"], selectedProfile: Profile) => {
        const { displayWindowId, tdlFileName, mode, editable, externalMacros, replaceMacros } = data;
        const displayWindowAgent = this.getDisplayWindowAgent();
        const tdlResult = await FileReader.readTdlFile(tdlFileName, selectedProfile);
        if (tdlResult === undefined) {
            Log.error(`Cannot read file ${tdlFileName}`);
            return;
        }
        const { tdl, fullTdlFileName } = tdlResult;
        displayWindowAgent.setTdl(tdl);
        displayWindowAgent.setInitialMode(mode);
        displayWindowAgent.setMacros(externalMacros);
        displayWindowAgent.setReplaceMacros(replaceMacros);

        await displayWindowAgent.getDisplayWindowLifeCycleManager().updateTdl();

    }

    private sendFileConverterFinished = (widgetKey: string, status: "success" | "failed") => {
        this.getDisplayWindowAgent().sendFromMainProcess("file-converter-command", {
            type: "all-file-conversion-finished",
            status: status,
            widgetKey: widgetKey,
        });
    };

    executeFileConverterCommand = (options: IpcEventArgType["file-converter-command"]) => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        const mainProcess = displayWindowAgent.getWindowAgentsManager().getMainProcess();

        if (options["command"] === "start") {
            if (!fs.existsSync(options["src"])) {
                displayWindowAgent.showError([`Source folder/file does not exist.`]);
                this.sendFileConverterFinished(options["widgetKey"], "failed");
                return;
            }
            if (!fs.existsSync(options["dest"])) {
                displayWindowAgent.showError([`Destination folder/file does not exist.`]);
                this.sendFileConverterFinished(options["widgetKey"], "failed");
                return;
            }
            if (options["depth"] > 50 || options["depth"] < 1) {
                displayWindowAgent.showError([`File search depath wrong: should be between 1 and 50 (both inclusive).`]);
                this.sendFileConverterFinished(options["widgetKey"], "failed");
                return;
            }
            mainProcess.getEdlFileConverterThread().startThread(options);
        } else {
            mainProcess.getEdlFileConverterThread().stopThread();
        }
    };

    saveVideoFile = (options: IpcEventArgType["save-video-file"]) => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        const buffer = Buffer.from(options["fileContents"], "base64");

        fs.writeFile(options["fileName"], buffer, (err) => {
            if (err) {
                displayWindowAgent.showError([`Failed to save video to ${options["fileName"]}`], [err.toString()]);
            } else {
                displayWindowAgent.showInfo([`Video file saved to ${options["fileName"]}`]);
            }
        });
    };

    getMediaContent = (options: IpcEventArgType["get-media-content"]) => {
        const { fullFileName, displayWindowId, widgetKey } = options;
        const displayWindowAgent = this.getDisplayWindowAgent();

        if (fullFileName !== "") {
            const fileBase64Str = fileToDataUri(fullFileName, 10240);
            if (fileBase64Str !== "") {
                displayWindowAgent.sendFromMainProcess("get-media-content", {
                    content: fileBase64Str,
                    displayWindowId: displayWindowId,
                    widgetKey: widgetKey,
                });
            } else {
                Log.error(`Cannot obtain media content from ${fullFileName} for widget ${widgetKey} in display window ${displayWindowId}.`);
            }
        } else {
            Log.error(`Cannot obtain media content: empty file name for widget ${widgetKey} in display window ${displayWindowId}.`);
        }
    };


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

    saveDataViewerData = (
        options: IpcEventArgType["data-viewer-export-data"]
    ) => {
        let { fileName1, displayWindowId, data } = options;
        if (fileName1 === undefined) {
            fileName1 = "";
        }
        const displayWindowAgent = this.getDisplayWindowAgent();

        const displayWindowFile = displayWindowAgent.getDisplayWindowFile();
        const fileContent = JSON.stringify(data, null, 4);
        displayWindowFile.saveFile(fileName1, fileContent, "data-viewer");
    };

    readFolder = (options: IpcEventArgType["fetch-folder-content"]) => {
        const { displayWindowId, widgetKey, folderPath } = options;
        const displayWindowAgent = this.getDisplayWindowAgent();
        const mainProcess = this.getDisplayWindowAgent().getWindowAgentsManager().getMainProcess();

        // web mode: only the folders and their sub-folders explicitly defined in bookmarks can be visited
        if (mainProcess.getMainProcessMode() === "web") {
            const folderPath = options["folderPath"];
            let allowToRead = false;
            const selectedProfile = mainProcess.getProfiles().getSelectedProfile();
            if (selectedProfile !== undefined) {
                const bookmarks = selectedProfile.getEntry("EPICS Custom Environment", "File Browser Bookmarks");
                if (bookmarks !== undefined) {
                    for (const bookmark of bookmarks) {
                        const bookmarkFolder = bookmark[0];
                        if (typeof bookmarkFolder === "string") {
                            if (folderPath.includes(bookmarkFolder)) {
                                allowToRead = true;
                                break;
                            }
                        }
                    }
                }
            }
            if (allowToRead === false) {
                displayWindowAgent.showError([`You are not allowed to visit ${folderPath}.`]);
                return;
            }
        }


        try {
            // read the folder
            const rawResult = fs.readdirSync(folderPath);
            const result: {
                name: string, // only the name
                type: "file" | "folder",
                size: number,
                timeModified: number,
            }[] = [];
            for (const name of rawResult) {
                const fullPath = path.join(folderPath, name);
                const stats = fs.statSync(fullPath);
                const type = stats.isDirectory() ? "folder" : "file";
                const size = stats.size; // byte
                const timeModified = stats.mtime; // Date 
                result.push({
                    name: name,
                    type: type,
                    size: size,
                    timeModified: timeModified.getTime(),
                });
            }
            // send back
            displayWindowAgent.sendFromMainProcess("fetch-folder-content", {
                widgetKey: widgetKey,
                folderContent: result,
            })
        } catch (e) {
            Log.error(`File Browser -- Failed to read folder ${options["folderPath"]}`);
            displayWindowAgent.showError([`Failed to read folder ${options["folderPath"]}.`]);
            // let 
            displayWindowAgent.sendFromMainProcess("fetch-folder-content", {
                widgetKey: options["widgetKey"],
                folderContent: [],
                success: false,
            })
        }
    }


    selectAFile = async (data: IpcEventArgType["select-a-file"]) => {
        let { options, fileName1, } = data;
        if (fileName1 === undefined) {
            fileName1 = "";
        }
        const displayWindowAgent = this.getDisplayWindowAgent();

        const fileType = options["filterType"];
        if (!isOfFileType(fileType)) {
            displayWindowAgent.showError([`Invalid filter type: ${fileType}`])
            return;
        }
        const fileName = await this.selectFile(fileType);
        if (fileName === undefined) {
            // do not show error message on display window, the user may just canceled it
        } else {
            displayWindowAgent.sendFromMainProcess("select-a-file", {
                options, fileName
            });
        }
    };

    // ------------------- getters -----------------

    getDisplayWindowAgent = () => {
        return this.displayWindowAgent;
    };

    private showError = (humanReadableMessages: string[], rawMessages: string[] = []) => {
        this.getDisplayWindowAgent().showError(humanReadableMessages, rawMessages);
    };

    private getMainProcess = () => {
        return this.getDisplayWindowAgent().getWindowAgentsManager().getMainProcess();
    };
}
