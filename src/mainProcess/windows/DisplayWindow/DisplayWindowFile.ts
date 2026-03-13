import { IpcEventArgType } from "../../../common/IpcEventArgType";
import * as fs from "fs";
import { dialog } from "electron";
import path from "path";
import { Log } from "../../../common/Log";
import { DisplayWindowAgent } from "./DisplayWindowAgent";
import { FileReader } from "../../file/FileReader";

/**
 * Handles file save flows for a display window in desktop and SSH server modes.
 */
export class DisplayWindowFile {
    private readonly displayWindowAgent: DisplayWindowAgent;

    constructor(displayWindowAgent: DisplayWindowAgent) {
        this.displayWindowAgent = displayWindowAgent;
    }

    private readonly saveOptionsByType: Record<IpcEventArgType["window-will-be-closed-user-select"]["dataType"], { filters: { name: string, extensions: string[] }[], defaultFileName: string, defaultExtension: string }> = {
        "tdl": {
            filters: [{ name: "tdl", extensions: ["tdl", "json"] }],
            defaultFileName: "untitled.tdl",
            defaultExtension: ".tdl",
        },
        "data-viewer": {
            filters: [{ name: "json", extensions: ["json"] }],
            defaultFileName: "data.json",
            defaultExtension: ".json",
        },
        "text": {
            filters: [
                { name: "text", extensions: ["txt"] },
                { name: "all", extensions: ["*"] },
            ],
            defaultFileName: "untitled.txt",
            defaultExtension: ".txt",
        },
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

    private writeFile = (fileName: string, fileContent: string): string => {
        try {
            fs.writeFileSync(fileName, fileContent);
            return "";
        } catch (error) {
            Log.error("0", `Cannot save file ${fileName}`, `${error}`);
            return `Cannot save file ${fileName}`;
        }
    };

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

    saveTdlFile = (options: IpcEventArgType["save-tdl-file"]): void => {
        const { windowId, tdl, tdlFileName1 } = options;
        const displayWindowAgent = this.getDisplayWindowAgent();
        const mainProcess = displayWindowAgent.getWindowAgentsManager().getMainProcess();
        const mainProcessMode = mainProcess.getMainProcessMode();

        if (mainProcessMode === "web") {
            const bookmarks = mainProcess.getProfiles().getSelectedProfile()?.getEntry("EPICS Custom Environment", "File Browser Bookmarks");
            let allowToSave = false;
            if (Array.isArray(bookmarks)) {
                for (const bookmark of bookmarks) {
                    const bookmarkFolder = bookmark[0];
                    const permissionToWrite = bookmark[1];
                    if (tdlFileName1.includes(bookmarkFolder) && typeof permissionToWrite === "string" && permissionToWrite.toLowerCase() === "yes") {
                        allowToSave = true;
                        break;
                    }
                }
            }
            if (allowToSave === false) {
                displayWindowAgent.showError([`You are not allowed to visit ${tdlFileName1}.`]);
                return;
            }
        }

        let tdlFileName: string | undefined = tdlFileName1;
        Log.debug("0", "We are going to save TDL", tdlFileName1);
        try {
            if (tdlFileName === "" || tdlFileName.endsWith(".edl") || tdlFileName.endsWith(".stp") || tdlFileName.endsWith(".bob")) {
                if (mainProcessMode === "desktop") {
                    tdlFileName = dialog.showSaveDialogSync({ title: "Save tdl file", filters: [{ name: "tdl", extensions: ["tdl", "json"] }] });
                } else if (mainProcessMode === "ssh-server") {
                    displayWindowAgent.sendFromMainProcess("dialog-show-input-box", {
                        info: {
                            command: "save-tdl-file",
                            humanReadableMessages: ["Save display to"],
                            buttons: [
                                {
                                    text: "OK",
                                },
                                {
                                    text: "Cancel",
                                }
                            ],
                            defaultInputText: "",
                            attachment: {
                                windowId: windowId,
                                tdl: tdl,
                                tdlFileName1: "",
                            }
                        }
                    });
                    return;
                }
            }

            if (tdlFileName === undefined) {
                Log.debug("0", "Did not select TDL file name, cancel saving tdl");
                return;
            }

            fs.writeFileSync(tdlFileName, JSON.stringify(tdl, null, 4));
            
            Log.info("0", `Saved tdl to file ${tdlFileName}`);
            displayWindowAgent.sendFromMainProcess("tdl-file-saved", {
                newTdlFileName: tdlFileName
            });

        } catch (e) {
            Log.error(e);
            displayWindowAgent.showError([`Failed to save ${tdlFileName}`, "Please check the file permission."], ["Below is the raw message:", `${e}`]);
        }
    }

    /**
     * provided file name, data type, and file content, save the data to a local file
     * 
     * If `fileName` is a writable path, save directly to that file. Otherwise show a save dialog,
     * choose the default name and extension from `dataType`, and write the content to the selected path.
     * Returns an empty string on success or an error message when the save is cancelled or fails.
     */
    saveFileInDesktopMode = (dataType: IpcEventArgType["window-will-be-closed-user-select"]["dataType"], fileName: string, fileContent: string): string => {
        const saveOptions = this.saveOptionsByType[dataType];
        const trimmedFileName = fileName.trim();

        if (trimmedFileName !== "" && this.canWriteToPath(trimmedFileName)) {
            return this.writeFile(trimmedFileName, fileContent);
        }

        const selectedFileName = dialog.showSaveDialogSync({
            title: "Select a file to save to",
            defaultPath: saveOptions.defaultFileName,
            filters: saveOptions.filters,
        });

        if (selectedFileName === undefined || selectedFileName === "") {
            return "No file selected";
        }

        const saveFileName = path.extname(selectedFileName) === ""
            ? `${selectedFileName}${saveOptions.defaultExtension}`
            : selectedFileName;

        return this.writeFile(saveFileName, fileContent);
    }

    /**
     * Save directly to a provided path without showing a dialog.
     */
    saveFileToPath = (fileName: string, fileContent: string): string => {
        const trimmedFileName = fileName.trim();
        if (trimmedFileName === "") {
            return "No file selected";
        }
        return this.writeFile(trimmedFileName, fileContent);
    }

    /**
     * Save file content while running against an SSH server.
     *
     * If no file path is provided, prompt the renderer for a destination and return `"prompted"`.
     * Otherwise write directly to the supplied path and return an empty string on success or an
     * error message on failure.
     */
    saveFileInSshServerMode = (data: IpcEventArgType["window-will-be-closed-user-select"]): "" | "prompted" | string => {
        const { fileName, fileContent } = data;
        const displayWindowAgent = this.getDisplayWindowAgent();
        const trimmedFileName = fileName.trim();

        if (trimmedFileName === "") {
            displayWindowAgent.sendFromMainProcess("dialog-show-input-box", {
                info: {
                    command: "window-will-be-closed-user-select-save",
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
                }
            });
            return "prompted";
        }

        return this.writeFile(trimmedFileName, fileContent);
    }

    // ------------------- getters -----------------

    getDisplayWindowAgent = () => {
        return this.displayWindowAgent;
    };
}
