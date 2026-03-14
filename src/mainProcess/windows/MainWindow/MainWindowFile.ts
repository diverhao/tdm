import * as fs from "fs";
import { dialog } from "electron";
import { Environment } from "epics-tca";
import path from "path";
import { IpcEventArgType } from "../../../common/IpcEventArgType";
import { Log } from "../../../common/Log";
import { fileDialogOptionsByType, type_fileType } from "../../../common/types/type_Files";
import { Profiles } from "../../profile/Profiles";
import { MainWindowAgent } from "./MainWindowAgent";

const fileSizeLimit = 1024 * 1024 * 20;

/**
 * Handles generic file open/save flows and profiles file operations for the main window.
 */
export class MainWindowFile {
    private readonly _mainWindowAgent: MainWindowAgent;
    private _lastSelectedFileName: string | undefined = undefined;
    selectFileInputResolve: (value: any) => void = () => { };

    constructor(mainWindowAgent: MainWindowAgent) {
        this._mainWindowAgent = mainWindowAgent;
    }

    // -------------------- read file ----------------------

    openFile = async (fileName: string, fileContent: string, manualOpen: boolean, fileType: type_fileType): Promise<{ fileName: string, fileContent: string, writable: boolean } | undefined> => {
        const mainWindowAgent = this.getMainWindowAgent();

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
            };
        }

        if (path.isAbsolute(fileName) === false) {
            mainWindowAgent.showError([`File path must be absolute: ${fileName}`]);
            return undefined;
        }

        try {
            fs.accessSync(fileName, fs.constants.F_OK);
            fs.accessSync(fileName, fs.constants.R_OK);
        } catch (e) {
            mainWindowAgent.showError([`Error opening file ${fileName}`], [`${e}`]);
            return undefined;
        }

        const fileStats = fs.statSync(fileName);
        const fileSize = fileStats.size;
        if (fileSize >= fileSizeLimit) {
            mainWindowAgent.showError([`This file is too large (${Math.round(fileSize / 1024 / 1024)} MB) to open. Please select a smaller file.`]);
            return undefined;
        }

        let writable = false;
        try {
            fs.accessSync(fileName, fs.constants.W_OK);
            writable = true;
        } catch (_e) {
            writable = false;
        }

        try {
            fileContent = await fs.promises.readFile(fileName, "utf-8");
            return {
                fileName: fileName,
                fileContent: fileContent,
                writable: writable,
            };
        } catch (e) {
            mainWindowAgent.showError([`Failed to read file ${fileName}`]);
            return undefined;
        }
    };

    private selectFile = async (fileType: type_fileType): Promise<string | undefined> => {
        const mainWindowAgent = this.getMainWindowAgent();
        const mainProcessMode = mainWindowAgent.getWindowAgentsManager().getMainProcess().getMainProcessMode();

        try {
            if (mainProcessMode === "desktop" || mainProcessMode === "ssh-client") {
                const fileNames = dialog.showOpenDialogSync({
                    title: fileDialogOptionsByType[fileType].displayText,
                    filters: fileDialogOptionsByType[fileType].filters,
                });
                if (fileNames === undefined || fileNames.length === 0) {
                    return undefined;
                }
                return fileNames[0];
            } else if (mainProcessMode === "ssh-server" || mainProcessMode === "web") {
                mainWindowAgent.showInputBox({
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
                const selectedFileName = await new Promise<string>((resolve) => {
                    this.selectFileInputResolve = resolve;
                });
                return selectedFileName;
            } else {
                Log.error("Main process has no mode", mainProcessMode);
            }
        } catch (e) {
            Log.error(e);
        }

        return undefined;
    };

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
            Log.error(`Cannot save file ${fileName}`, `${error}`);
            return false;
        }
    };

    saveFile = async (fileName: string, fileContent: string, dataType: type_fileType): Promise<boolean> => {
        const saveOptions = fileDialogOptionsByType[dataType];
        const mainWindowAgent = this.getMainWindowAgent();
        const mainProcessMode = mainWindowAgent.getWindowAgentsManager().getMainProcess().getMainProcessMode();
        fileName = fileName.trim();
        this._lastSelectedFileName = undefined;

        if (fileName !== "" && this.canWriteToPath(fileName)) {
            const result = this.writeFile(fileName, fileContent);
            if (result === true) {
                this._lastSelectedFileName = fileName;
                return true;
            } else {
                mainWindowAgent.showError([`Failed to save file ${fileName}`]);
                return false;
            }
        }

        if (mainProcessMode === "desktop" || mainProcessMode === "ssh-client") {
            fileName = dialog.showSaveDialogSync({
                title: "Select a file to save to",
                defaultPath: saveOptions.defaultFileName,
                filters: saveOptions.filters,
            });
        } else if (mainProcessMode === "ssh-server" || mainProcessMode === "web") {
            mainWindowAgent.showInputBox({
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
            fileName = await new Promise<string>((resolve) => {
                this.selectFileInputResolve = resolve;
            });
        }

        if (fileName === undefined || fileName === "") {
            return false;
        }

        const success = this.writeFile(fileName, fileContent);
        if (success) {
            this._lastSelectedFileName = fileName;
            return true;
        } else {
            mainWindowAgent.showError([`Failed to save file ${fileName}`]);
            return false;
        }
    };

    // ------------------- event handlers ------------------------

    openTdlFiles = async (data: IpcEventArgType["open-tdl-file"]) => {
        const { options } = data;
        let { tdl, tdlFileNames, windowId, mode, editable, macros, replaceMacros } = options;
        const mainProcess = this.getMainWindowAgent().getWindowAgentsManager().getMainProcess();
        const windowAgentsManager = mainProcess.getWindowAgentsManager();
        const selectedProfile = mainProcess.getProfiles().getSelectedProfile();
        if (selectedProfile === undefined) {
            Log.error("Profile not selected!");
            return;
        }

        const windowAgent = this.getMainWindowAgent();

        try {
            if (tdl !== undefined) {
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
            } else if (tdlFileNames === undefined) {
                const tdlFileName = await this.selectFile("tdl");
                if (tdlFileName === undefined) {
                    Log.error("No TDL file selected.");
                    return;
                }

                editable = selectedProfile.getEditable();
                mode = selectedProfile.getManuallyOpenedTdlMode();
                if (mode === "editing") {
                    editable = true;
                }

                windowAgentsManager.createDisplayWindows([tdlFileName], mode, editable, options["macros"], options["currentTdlFolder"], windowId);
            } else if (tdlFileNames.length === 0) {
                windowAgentsManager.createBlankDisplayWindow(options["windowId"]);
            } else if (tdlFileNames.length > 0) {
                windowAgentsManager.createDisplayWindows(tdlFileNames, mode, editable, options["macros"], options["currentTdlFolder"], windowId);
            }
        } catch (e) {
            Log.error(e);
            windowAgent.showError([`Failed to open file ${tdlFileNames}`], [`${e}`]);
        }
    };

    openProfiles = async (options: IpcEventArgType["open-profiles"]) => {
        let { profilesFileName1 } = options;
        if (profilesFileName1 === undefined) {
            profilesFileName1 = "";
        }

        const mainWindowAgent = this.getMainWindowAgent();
        const mainProcess = mainWindowAgent.getWindowAgentsManager().getMainProcess();
        const profiles = mainProcess.getProfiles();

        try {
            if (profilesFileName1 !== "" && !fs.existsSync(profilesFileName1)) {
                profiles.createProfiles(profilesFileName1);
                mainProcess.enableLogToFile();
                this.sendProfilesToRenderer();
                return;
            }

            const fileResult = await this.openFile(profilesFileName1, "", profilesFileName1 === "", "data-viewer");
            if (fileResult === undefined) {
                return;
            }

            const profilesJson = JSON.parse(fileResult.fileContent);
            Profiles.validateProfiles(profilesJson);
            profiles.updateProfiles(fileResult.fileName, profilesJson);
            mainProcess.enableLogToFile();
            this.sendProfilesToRenderer();
        } catch (e) {
            const fileNameForError = profilesFileName1 === "" ? "Selected file" : profilesFileName1;
            mainWindowAgent.showError([`${fileNameForError} is not a valid TDM profiles file, or it cannot be opened or created.`]);
        }
    };

    saveProfiles = async (options: IpcEventArgType["save-profiles"]): Promise<boolean> => {
        const mainWindowAgent = this.getMainWindowAgent();
        const mainProcess = mainWindowAgent.getWindowAgentsManager().getMainProcess();
        const mainProcessMode = mainProcess.getMainProcessMode();
        if (mainProcessMode === "web") {
            return false;
        }

        const profiles = mainProcess.getProfiles();
        let { filePath1, modifiedProfiles } = options;
        if (filePath1 === undefined) {
            filePath1 = "";
        }

        let filePath = profiles.getFilePath();
        if (filePath === "") {
            filePath = filePath1;
        }

        try {
            const profilesForSave = new Profiles(filePath, modifiedProfiles);
            const fileContent = JSON.stringify(profilesForSave.serialize(), null, 4);
            const success = await this.saveFile(filePath, fileContent, "data-viewer");
            if (success !== true) {
                return false;
            }

            const savedFilePath = this._lastSelectedFileName ?? filePath;
            profiles.updateProfiles(savedFilePath, modifiedProfiles);
            mainProcess.enableLogToFile();
            mainWindowAgent.sendFromMainProcess("log-file-name", {
                logFileName: mainProcess.getLogFileName()
            });
        } catch (e) {
            Log.error(e);
            mainWindowAgent.sendFromMainProcess("dialog-show-message-box", {
                info: {
                    messageType: "error",
                    humanReadableMessages: [`Error save file to ${filePath}.`],
                    rawMessages: [],
                }
            });

            return false;
        }
        return true;
    };

    saveProfilesAs = async (options: IpcEventArgType["save-profiles-as"]): Promise<boolean> => {
        const mainWindowAgent = this.getMainWindowAgent();
        const mainProcess = mainWindowAgent.getWindowAgentsManager().getMainProcess();
        const mainProcessMode = mainProcess.getMainProcessMode();
        if (mainProcessMode === "web") {
            return false;
        }

        let { filePath1, modifiedProfiles } = options;
        if (filePath1 === undefined) {
            filePath1 = "";
        }

        const filePath = filePath1;

        try {
            const profiles = mainProcess.getProfiles();
            const profilesForSave = new Profiles(filePath, modifiedProfiles);
            const fileContent = JSON.stringify(profilesForSave.serialize(), null, 4);
            const success = await this.saveFile(filePath, fileContent, "data-viewer");
            if (success !== true) {
                return false;
            }

            const savedFilePath = this._lastSelectedFileName ?? filePath;
            profiles.updateProfiles(savedFilePath, modifiedProfiles);
            mainProcess.enableLogToFile();
            mainWindowAgent.sendFromMainProcess("log-file-name", {
                logFileName: mainProcess.getLogFileName()
            });
        } catch (e) {
            Log.error(e);
            const savedFilePath = this._lastSelectedFileName ?? filePath;
            mainWindowAgent.showError([`Error save file to ${savedFilePath}.`], [`${e}`]);
            return false;
        }
        return true;
    };

    getMainWindowAgent = () => {
        return this._mainWindowAgent;
    };

    private sendProfilesToRenderer = () => {
        const mainWindowAgent = this.getMainWindowAgent();
        const mainProcess = mainWindowAgent.getWindowAgentsManager().getMainProcess();
        const profiles = mainProcess.getProfiles();
        const env = Environment.getTempInstance();
        let envDefault = env.getEnvDefault();
        let envOs = env.getEnvOs();
        if (typeof envOs !== "object") {
            envOs = {};
        }
        if (typeof envDefault !== "object") {
            envDefault = {};
        }

        mainWindowAgent.sendFromMainProcess("after-main-window-gui-created", {
            profiles: profiles.serialize(),
            profilesFileName: profiles.getFilePath(),
            envDefault: envDefault,
            envOs: envOs,
            logFileName: mainProcess.getLogFileName(),
            site: mainProcess.getSite(),
        });
    };
}
