import { IpcEventArgType } from "../../../common/IpcEventArgType";
import * as fs from "fs";
import path from "path";
import { Log } from "../../../common/Log";
import { DisplayWindowAgent } from "./DisplayWindowAgent";
import { FileReader } from "../../file/FileReader";

export class DisplayWindowFileBrowser {
    private readonly _displayWindowAgent: DisplayWindowAgent;

    constructor(displayWindowAgent: DisplayWindowAgent) {
        this._displayWindowAgent = displayWindowAgent;
    }

    executeFileBrowserCommand = (message: IpcEventArgType["file-browser-command"]) => {
        if (!this.canExecuteFileBrowserCommand(message)) {
            return;
        }

        const handlers: Record<IpcEventArgType["file-browser-command"]["command"], (message: IpcEventArgType["file-browser-command"]) => void> = {
            "change-item-name": this.executeChangeItemNameCommand,
            "create-tdl-file": this.executeCreateTdlFileCommand,
            "create-folder": this.executeCreateFolderCommand,
        };

        handlers[message["command"]](message);
    };

    fetchThumbnail = async (message: IpcEventArgType["fetch-thumbnail"]) => {
        const mainProcess = this.getMainProcess();
        if (mainProcess.getMainProcessMode() !== "desktop") {
            return;
        }

        const selectedProfile = mainProcess.getProfiles().getSelectedProfile();
        if (selectedProfile === undefined) {
            Log.error("Profile not selected!");
            return;
        }

        const tdlFileName = message["tdlFileName"];
        const tdlFileResult = await FileReader.readTdlFile(tdlFileName, selectedProfile);
        if (tdlFileResult === undefined) {
            Log.error(`Cannot read tdl file ${tdlFileName}`);
            this.getDisplayWindowAgent().showError([`Failed to open file ${tdlFileName}`]);
            return;
        }

        const previewDisplayWindowAgent = mainProcess.getWindowAgentsManager().previewDisplayWindowAgent;
        if (!(previewDisplayWindowAgent instanceof DisplayWindowAgent)) {
            Log.error(`Cannot read tdl file ${tdlFileName}`);
            this.getDisplayWindowAgent().showError([`The hidden preview display is not ready.`]);
            return;
        }

        // todo: race condition, 2 requests at the same time
        previewDisplayWindowAgent.setForFileBrowserWindowId(this.getDisplayWindowAgent().getId());
        previewDisplayWindowAgent.setForFileBrowserWidgetKey(message["widgetKey"]);

        previewDisplayWindowAgent.setTdl(tdlFileResult["tdl"]);
        previewDisplayWindowAgent.setTdlFileName(tdlFileName);
        previewDisplayWindowAgent.setInitialMode("editing");
        previewDisplayWindowAgent.setEditable(false);
        previewDisplayWindowAgent.setMacros([]);

        previewDisplayWindowAgent.getDisplayWindowLifeCycleManager().updateTdl();

    };

    private canExecuteFileBrowserCommand = (message: IpcEventArgType["file-browser-command"]): boolean => {
        if (this.getMainProcess().getMainProcessMode() !== "web") {
            return true;
        }

        const folderPath = this.getFileBrowserCommandPath(message);
        if (this.isAllowedToWriteInWebMode(folderPath)) {
            return true;
        }

        this.getDisplayWindowAgent().showError([`You are not allowed to ${message["command"].replaceAll("-", " ")} for ${folderPath}.`]);
        return false;
    };

    private getFileBrowserCommandPath = (message: IpcEventArgType["file-browser-command"]): string => {
        if (typeof message["folder"] === "string") {
            return message["folder"];
        }
        if (typeof message["fullFileName"] === "string") {
            return message["fullFileName"];
        }
        if (typeof message["fullFolderName"] === "string") {
            return message["fullFolderName"];
        }
        return "";
    };

    private isAllowedToWriteInWebMode = (folderPath: string): boolean => {
        const selectedProfile = this.getMainProcess().getProfiles().getSelectedProfile();
        if (selectedProfile === undefined) {
            return false;
        }

        const bookmarks = selectedProfile.getEntry("EPICS Custom Environment", "File Browser Bookmarks");
        if (bookmarks === undefined) {
            return false;
        }

        for (const bookmark of bookmarks) {
            const bookmarkFolder = bookmark[0];
            const permissionToWrite = bookmark[1];
            if (typeof bookmarkFolder === "string" && typeof permissionToWrite === "string") {
                if (folderPath.includes(bookmarkFolder) && permissionToWrite.toLowerCase() === "yes") {
                    return true;
                }
            }
        }

        return false;
    };

    private executeChangeItemNameCommand = (message: IpcEventArgType["file-browser-command"]) => {
        const folder = message["folder"];
        const oldName = message["oldName"];
        const newName = message["newName"];
        if (folder === undefined || oldName === undefined || newName === undefined) {
            return;
        }

        const fullOldFileName = path.join(folder, oldName);
        const fullNewFileName = path.join(folder, newName);
        if (!path.isAbsolute(fullOldFileName) || !path.isAbsolute(fullNewFileName)) {
            return;
        }

        try {
            if (fs.existsSync(fullNewFileName)) {
                throw new Error(`File ${fullNewFileName} already exists`);
            }

            fs.renameSync(fullOldFileName, fullNewFileName);
            this.sendFileBrowserCommandResult(message, true);
        } catch (error) {
            Log.error("Error renaming file:", error);
            this.getDisplayWindowAgent().showError([`Failed to change file name from ${oldName} to ${newName}`, `Reason: ${error}`]);
            this.sendFileBrowserCommandResult(message, false);
        }
    };

    private executeCreateTdlFileCommand = (message: IpcEventArgType["file-browser-command"]) => {
        const fullFileName = message["fullFileName"];
        if (fullFileName === undefined) {
            return;
        }

        const tdl = FileReader.getBlankWhiteTdl();
        try {
            fs.writeFileSync(fullFileName, JSON.stringify(tdl, null, 4));
            this.sendFileBrowserCommandResult(message, true);
        } catch (error) {
            this.getDisplayWindowAgent().showError([`Failed to create file ${fullFileName}`, `Reason: ${error}`]);
            this.sendFileBrowserCommandResult(message, false);
        }
    };

    private executeCreateFolderCommand = (message: IpcEventArgType["file-browser-command"]) => {
        const fullFolderName = message["fullFolderName"];
        if (fullFolderName === undefined) {
            return;
        }

        try {
            fs.mkdirSync(fullFolderName);
            this.sendFileBrowserCommandResult(message, true);
        } catch (error) {
            this.getDisplayWindowAgent().showError([`Failed to create folder ${fullFolderName}`, `Reason: ${error}`]);
            this.sendFileBrowserCommandResult(message, false);
        }
    };

    private sendFileBrowserCommandResult = (message: IpcEventArgType["file-browser-command"], success: boolean) => {
        this.getDisplayWindowAgent().sendFromMainProcess("file-browser-command", {
            ...message,
            success: success,
        });
    };

    getDisplayWindowAgent = () => {
        return this._displayWindowAgent;
    };

    private getMainProcess = () => {
        return this.getDisplayWindowAgent().getWindowAgentsManager().getMainProcess();
    };
}
