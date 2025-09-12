import path from "path";
import { MainProcess } from "../mainProcess/MainProcess";
import { DisplayWindowAgent } from "../windows/DisplayWindow/DisplayWindowAgent";
import { Worker } from 'worker_threads';
import { Log } from "../log/Log";


export class EdlFileConverterThread {
    private readonly _mainProcess: MainProcess;
    private _thread: Worker | undefined = undefined;
    constructor(mainProcess: MainProcess) {
        // Initialization code here
        this._mainProcess = mainProcess;
    }


    startThread = (options: {
        command: "start",
        src: string,
        dest: string,
        depth: number,
        displayWindowId: string,
        widgetKey: string,
    }) => {
        // if there is already a worker thread running, do not start
        let worker = this.getThread();
        if (worker !== undefined) {
            const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(options["displayWindowId"]);
            if (displayWindowAgent instanceof DisplayWindowAgent) {
                displayWindowAgent.sendFromMainProcess("file-converter-command", {
                    type: "all-file-conversion-finished",
                    status: "failed",
                    widgetKey: options["widgetKey"],
                });

                displayWindowAgent.sendFromMainProcess("dialog-show-message-box", {
                    info: {
                        messageType: "error",
                        humanReadableMessages: [`There is already a file converter session running.`, "TDM can only run one file converter at a time"],
                        rawMessages: [],
                    }
                })
            }
        } else {

            worker = new Worker(path.join(__dirname, '../helpers/EdlFileConverterThread.js'), {
                workerData: options,
                stdout: true, // Ignore stdout
                stderr: true, // Ignore stderr
            });

            this.setThread(worker);

            // Communicate with the worker
            worker.on('message', (message) => {
                Log.debug(this.getMainProcess().getProcessId(), "Received message from file converter thread:", message);
                const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(options["displayWindowId"]);
                if (!(displayWindowAgent instanceof DisplayWindowAgent)) {
                    // the display window is closed, quit the thread
                    this.stopThread("File Convertr window closed");
                    return;
                }
                if (message["type"] === "one-file-conversion-started") {
                    // started
                    // {
                    //     type: "file-conversion-started",
                    //     srcFileName: fileAndFolderFullName, 
                    //     destFileName: destFileName,
                    //     status: "converting",
                    // }
                    displayWindowAgent.sendFromMainProcess("file-converter-command", { ...message, widgetKey: options["widgetKey"] });
                } else if (message["type"] === "one-file-conversion-finished") {
                    // finished one file
                    // send to renderer process
                    // {
                    //     type: "file-conversion-finished",
                    //     srcFileName: fileAndFolderFullName, 
                    //     destFileName: destFileName,
                    //     status: "success",
                    //     timeDurationMs: t1 - t0, // ms
                    //     numWidgetsOrig: 100, // number of widgets in edl file
                    //     numWidgetsTdl: 100, // number of widgets in tdl file
                    // }
                    displayWindowAgent.sendFromMainProcess("file-converter-command", { ...message, widgetKey: options["widgetKey"] });
                } else if (message["type"] === "all-files-conversion-finished") {
                    // successfully finished
                    // same as when the thread successfully quits
                    this.stopThread("All files converted, quit file converter thread");
                    displayWindowAgent.sendFromMainProcess("file-converter-command", {
                        type: "all-file-conversion-finished",
                        status: "success",
                        widgetKey: options["widgetKey"],
                    });
                    displayWindowAgent.sendFromMainProcess("dialog-show-message-box", {
                        info: {
                            messageType: "info",
                            humanReadableMessages: [`All files successfully converted.`],
                            rawMessages: [],
                        }
                    })
                } else {
                }
            });

            worker.on('error', (error) => {
                Log.error(this.getMainProcess().getProcessId(), 'File converter thread error:', error);
                this.stopThread("Error in file converter thread");
                const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(options["displayWindowId"]);
                if (!(displayWindowAgent instanceof DisplayWindowAgent)) {
                    // the display window is closed, quit the thread
                    this.stopThread("File converter window closed");
                    return;
                }
                displayWindowAgent.sendFromMainProcess("file-converter-command", {
                    type: "all-file-conversion-finished",
                    status: "failed",
                    widgetKey: options["widgetKey"],
                });

                displayWindowAgent.sendFromMainProcess("dialog-show-message-box", {
                    info: {
                        messageType: "error",
                        humanReadableMessages: [`File converter tool quits unexpectedly.`],
                        rawMessages: [`${error}`],
                    }
                })
            });

            worker.on('exit', (code) => {
                const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(options["displayWindowId"]);
                if (!(displayWindowAgent instanceof DisplayWindowAgent)) {
                    // the display window is closed, quit the thread
                    this.stopThread("File converter window closed");
                    return;
                }
                if (code !== 1) {
                    // successfully finished
                    // same as receving "all-file-conversion-finished" message from thread
                    this.stopThread("All files converted, quit file converter thread");
                    displayWindowAgent.sendFromMainProcess("file-converter-command", {
                        type: "all-file-conversion-finished",
                        status: "success",
                        widgetKey: options["widgetKey"],
                    });
                    displayWindowAgent.sendFromMainProcess("dialog-show-message-box", {
                        info: {
                            messageType: "info",
                            humanReadableMessages: [`All files successfully converted.`],
                            rawMessages: [],
                        }
                    })
                } else {
                    // externally terminated, code === 1, i.e. the Stop button is clicked
                    this.stopThread("User request to quit file converter thread");
                    displayWindowAgent.sendFromMainProcess("file-converter-command", {
                        type: "all-file-conversion-finished",
                        status: "failed",
                        widgetKey: options["widgetKey"],
                    });
                }
            });

            // Sending a message to the worker
            // worker.postMessage({
            //     command: "start",
            // });
        }
    }

    stopThread = (reason: string = "") => {
        Log.debug(this.getMainProcess().getProcessId(), "File converter thread stopped:", reason);
        const worker = this.getThread();
        if (worker !== undefined) {
            worker.terminate();
            this.setThread(undefined);
        }
    }

    getMainProcess = () => {
        return this._mainProcess;
    }

    getThread = () => {
        return this._thread;
    }

    setThread = (thread: Worker | undefined) => {
        this._thread = thread;
    }

}