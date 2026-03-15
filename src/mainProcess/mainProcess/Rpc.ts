import { spawn } from "child_process";
import { IpcEventArgType } from "../../common/IpcEventArgType";
import { Log } from "../../common/Log";
import { DisplayWindowAgent } from "../windows/DisplayWindow/DisplayWindowAgent";
import type { MainProcess } from "./MainProcess";

export class Rpc {
    private readonly _mainProcess: MainProcess;

    constructor(mainProcess: MainProcess) {
        this._mainProcess = mainProcess;
    }

    executeCommand = (data: IpcEventArgType["execute-command"]) => {
        try {
            const command = data["command"];
            let commandArray = command.split(" ");

            if (command.startsWith(`"`)) {
                const tmp = command.split(`"`);
                const commandHead = tmp[1];
                tmp.shift();
                tmp.shift();
                commandArray = [commandHead, ...tmp.join(`"`).split(" ")];
            }

            if (commandArray.length < 1) {
                return;
            }

            const commandHead = commandArray[0];
            commandArray.shift();
            const childProcess = spawn(commandHead, commandArray);

            childProcess.stdout.on("data", (stdout) => {
                Log.info(`stdout: ${stdout}`);
            });

            childProcess.stderr.on("data", (stderr) => {
                Log.info(`stderr: ${stderr}`);
            });

            childProcess.on("close", (code) => {
                Log.info(`child process exited with code ${code}`);
            });

            childProcess.on("error", (error) => {
                this.showExecuteCommandError(data, error);
            });
        } catch (error) {
            this.showExecuteCommandError(data, error);
        }
    };

    private showExecuteCommandError = (data: IpcEventArgType["execute-command"], error: unknown) => {
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(data["displayWindowId"]);
        if (displayWindowAgent instanceof DisplayWindowAgent) {
            displayWindowAgent.showError([`Failed to execute command "${data["command"]}"`], [`${error}`]);
        }
    };

    getMainProcess = () => {
        return this._mainProcess;
    };
}
