import * as child_process from "child_process";
import { Worker } from "worker_threads";
import { Log } from "../../../common/Log";
import { DisplayWindowAgent } from "./DisplayWindowAgent";

export class DisplayWindowAttachedScript {

    private readonly _displayWindowAgent: DisplayWindowAgent;
    private _webSocketClientThread: Worker | child_process.ChildProcess | undefined;
    private _windowAttachedScriptName = "";
    private _windowAttachedScriptPid: number | undefined = undefined;

    constructor(displayWindowAgent: DisplayWindowAgent) {
        this._displayWindowAgent = displayWindowAgent;
    }

    createWebSocketClientThread = (port: number, script: string) => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        if (!(script.endsWith(".py") || script.endsWith(".js"))) {
            Log.debug(`Script ${script} won't run for window ${displayWindowAgent.getId()}.`);
            displayWindowAgent.sendFromMainProcess("dialog-show-message-box", {
                info: {
                    messageType: "error",
                    humanReadableMessages: [`Failed to execute command "${script} from from this window".`, `We can only run python or node.js scripts.`],
                    rawMessages: [``],
                }
            });
            return;
        }
        if (this._webSocketClientThread !== undefined) {
            this.terminateWebSocketClientThread();
        }

        if (displayWindowAgent.getWindowAgentsManager().preloadedDisplayWindowAgent === displayWindowAgent) {
            Log.debug("This is a preloaded display window, skip creating websocket client thread");
            return;
        }

        try {
            if (script.endsWith(".py")) {
                Log.info(`Create new Python thread for display window ${displayWindowAgent.getId()}`);
                const selectedProfile = displayWindowAgent.getWindowAgentsManager().getMainProcess().getProfiles().getSelectedProfile();
                if (selectedProfile !== undefined) {
                    const pythonCommand = selectedProfile.getEntry("EPICS Custom Environment", "Python Command");
                    if (pythonCommand !== undefined) {
                        this._webSocketClientThread = child_process.spawn(pythonCommand, [script, `${port}`, displayWindowAgent.getId()], {
                            stdio: "inherit",
                        });
                        if (this._webSocketClientThread instanceof child_process.ChildProcess) {
                            this._windowAttachedScriptName = script;
                            this._windowAttachedScriptPid = this._webSocketClientThread.pid;
                        }
                        this._webSocketClientThread.stdout?.on("data", (data) => {
                            Log.debug(`Python stdout: ${data}`);
                        });
                        this._webSocketClientThread.stderr?.on("data", (data) => {
                            Log.error(`Python stderr: ${data}`);
                        });
                    }
                }
            } else if (script.endsWith(".js")) {
                Log.debug(`Create new Javascript thread on display window ${displayWindowAgent.getId()}`);
                this._webSocketClientThread = new Worker(script, {
                    workerData: {
                        mainProcessId: "0",
                        displayWindowId: displayWindowAgent.getId(),
                        port: port,
                        script: script,
                    },
                });
                this._windowAttachedScriptName = script;
                this._windowAttachedScriptPid = process.pid;
            }
        } catch (e) {
            Log.error(e);
        }

        this._webSocketClientThread?.on("error", (err: Error) => {
            Log.error(err);
            displayWindowAgent.sendFromMainProcess("dialog-show-message-box", {
                info: {
                    messageType: "error",
                    humanReadableMessages: [`Failed to execute command "${script}"`],
                    rawMessages: [`${err}`],
                }
            });
        });
    };

    terminateWebSocketClientThread = () => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        Log.debug(`Terminate websocket client thread for display window ${displayWindowAgent.getId()}`);

        if (this._webSocketClientThread instanceof Worker) {
            this._webSocketClientThread.terminate();
        } else if (this._webSocketClientThread instanceof child_process.ChildProcess) {
            this._webSocketClientThread.kill();
        } else {
            Log.debug("There was no worker thread for WebSocket client");
        }
    };

    getWindowAttachedScriptName = () => {
        return this._windowAttachedScriptName;
    };

    getWindowAttachedScriptPid = () => {
        return this._windowAttachedScriptPid;
    };

    getDisplayWindowAgent = () => {
        return this._displayWindowAgent;
    };

}
