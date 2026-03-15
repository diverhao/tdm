import * as fs from "fs";
import * as os from "os";
import { IpcEventArgType } from "../../../common/IpcEventArgType";
import { Log } from "../../../common/Log";
import { DisplayWindowAgent } from "./DisplayWindowAgent";

export class DisplayWindowTerminal {
    private readonly _displayWindowAgent: DisplayWindowAgent;

    constructor(displayWindowAgent: DisplayWindowAgent) {
        this._displayWindowAgent = displayWindowAgent;
    }

    executeTerminalCommand = (data: IpcEventArgType["terminal-command"]) => {
        if (data["command"] === "fs.readdir") {
            this.executeReadDirCommand(data);
            return;
        }

        if (data["command"] === "fs.stat") {
            this.executeStatCommand(data);
            return;
        }

        if (data["command"] === "fs.isDirectory") {
            this.executeIsDirectoryCommand(data);
            return;
        }

        this.sendTerminalCommandResult(data, this.getSynchronousCommandResult(data));
    };

    private executeReadDirCommand = (data: IpcEventArgType["terminal-command"]) => {
        const dirName = data["args"][0];
        fs.readdir(dirName, {}, (error, result) => {
            if (error) {
                return;
            }
            this.sendTerminalCommandResult(data, [result]);
        });
    };

    private executeStatCommand = (data: IpcEventArgType["terminal-command"]) => {
        const dirOrFileName = data["args"][0];
        fs.stat(dirOrFileName, {}, (error, result) => {
            if (error) {
                return;
            }
            this.sendTerminalCommandResult(data, [result]);
        });
    };

    private executeIsDirectoryCommand = (data: IpcEventArgType["terminal-command"]) => {
        const dirOrFileName = data["args"][0];
        fs.stat(dirOrFileName, {}, (error, stats) => {
            if (error) {
                return;
            }
            try {
                this.sendTerminalCommandResult(data, [stats.isDirectory()]);
            } catch (e) {
                // keep the old timeout-based behavior on renderer side
                Log.error(e);
            }
        });
    };

    private getSynchronousCommandResult = (data: IpcEventArgType["terminal-command"]): any[] => {
        if (data["command"] === "os.homedir") {
            return [os.homedir()];
        }
        if (data["command"] === "os.userInfo") {
            return [os.userInfo()];
        }
        return [];
    };

    private sendTerminalCommandResult = (data: IpcEventArgType["terminal-command"], result: any[]) => {
        this.getDisplayWindowAgent().sendFromMainProcess("terminal-command-result", {
            widgetKey: data["widgetKey"],
            ioId: data["ioId"],
            command: data["command"],
            result: result,
        });
    };

    getDisplayWindowAgent = () => {
        return this._displayWindowAgent;
    };
}
