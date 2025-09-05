import { IncomingMessage } from "http";
import { MainProcesses } from "../mainProcess/MainProcesses";
import { WebSocket, WebSocketServer, RawData } from "ws";
import { FileReader } from "../file/FileReader";
import { type_args } from "../arg/ArgParser";
import { MainProcess } from "../mainProcess/MainProcess";
import { Log } from "../log/Log";

// this class is part of MainProcesses, it has nothing to do with the runtime MainProcess
// it runs before any MainProcess or profile selection
// it accepts the request from other TDM command line to open tdl files
// in this process.
export class WsOpenerServer {
    server: WebSocketServer | undefined;
    _mainProcesses: MainProcesses;
    _port: number;

    constructor(mainProcesses: MainProcesses, port: number) {
        this._mainProcesses = mainProcesses;
        this._port = port;

        this.createServer();
    }

    quit = () => {
        Log.info("-1", "Close WS Opener Server")
        this.server?.close();
    }

    createServer = () => {
        Log.info("-1", `Creating WebSocket opener server on port ${this.getPort()}`);

        this.server = new WebSocket.Server({
            host: "127.0.0.1",
            port: this.getPort(),
        });

        this.server.on("error", (err: Error) => {
            if (err["message"].includes("EADDRINUSE")) {
                Log.info("-1", `Port ${this.getPort()} is occupied, try port ${this.getPort() + 1}`);
                let newPort = this.getPort() + 1;
                this.setPort(newPort);
                this.updatePort();
                this.createServer();
            }
        });

        // when the display window becomes operating mode
        this.server.on("connection", (wsClient: WebSocket, request: IncomingMessage) => {
            Log.info("-1", `WebSocket Opener Server got a connection`);
            wsClient.on("message", async (messageBuffer: RawData) => {
                const message = JSON.parse(messageBuffer.toString());
                this.parseMessage(message);
            });

            // when the websocket client quits, un-MONITOR
            wsClient.on("close", () => {
                Log.info("-1", `WebSocket Opener Server disconnects with client.`);
            });
        });
    };

    // tell all MainProcess the new WS opener port
    updatePort = () => {
        const mainProcesses = this.getMainProcesses().getProcesses();
        for (let mainProcess of mainProcesses) {
            mainProcess.updateWsOpenerPort(this.getPort());
        }
    };

    // the argv must have contained "--attach" option
    parseMessage = (args: type_args) => {
        const currentFolder = args["cwd"] === "" ? undefined : args["cwd"];
        const tdlFileNames = args["fileNames"];

        // if command line did not provide a profile
        // (1) try to find an already opened profile, and open command line tdl files in it
        // (2) if the above step failed, create a new MainProcess opening this profile
        if (args["profile"] !== "") {
            // (1)
            const mainProcesses = this.getMainProcesses().getProcesses();
            for (let mainProcess of mainProcesses) {
                const selectedProfile = mainProcess.getProfiles().getSelectedProfile();
                if (selectedProfile !== undefined && selectedProfile.getName() === args["profile"]) {
                    const macros = selectedProfile.getMacros();
                    for (const tdlFileName of args["fileNames"]) {
                        const fullTdlFileName = FileReader.resolveTdlFileName(tdlFileName, selectedProfile, currentFolder);
                        // open the file
                        if (fullTdlFileName !== undefined) {
                            mainProcess.getIpcManager().handleOpenTdlFiles(undefined,
                                {
                                    options: {
                                        tdlFileNames: [fullTdlFileName],
                                        mode: "operating",
                                        editable: true,
                                        macros: [...args["macros"], ...macros],
                                        replaceMacros: false,
                                        currentTdlFolder: currentFolder,
                                    }
                                }
                            );
                        }
                    }
                    return;
                }
            }
            // (2)
            const mainProcess = this.getMainProcesses().createProcess((mainProcess: MainProcess) => {
                const windowAgentsManager = mainProcess.getWindowAgentsManager();
                const profileNames = mainProcess.getProfiles().getProfileNames();
                const mainWindowAgent = windowAgentsManager.getMainWindowAgent();
                if (profileNames.includes(args["profile"])) {
                    mainWindowAgent?.sendFromMainProcess("cmd-line-selected-profile", 
                        {
                            cmdLineSelectedProfile: args["profile"], 
                            args
                        }
                    );
                } else {
                    // do nothing
                }
            });
        } else {
            // command line does not provide a profile name
            // (1) try to find a MainProcess that already opens this this profile
            // (2) if not found, open a new MainProcess for the first profile
            const mainProcesses = this.getMainProcesses().getProcesses();
            // (1)
            for (let mainProcess of mainProcesses) {
                const selectedProfile = mainProcess.getProfiles().getSelectedProfile();
                if (selectedProfile !== undefined) {
                    for (const tdlFileName of tdlFileNames) {
                        const fullTdlFileName = FileReader.resolveTdlFileName(tdlFileName, selectedProfile, currentFolder);
                        // open the file
                        if (fullTdlFileName !== undefined) {
                            mainProcess.getIpcManager().handleOpenTdlFiles(undefined,
                                {
                                    options: {
                                        tdlFileNames: [fullTdlFileName],
                                        mode: "operating",
                                        editable: true,
                                        macros: args["macros"],
                                        replaceMacros: false,
                                        currentTdlFolder: currentFolder,
                                    }
                                }
                            );
                        }
                    }
                    return;
                }
            }
            // (2)
            // the callback is executed after the main window GUI is created
            const mainProcess = this.getMainProcesses().createProcess((mainProcess: MainProcess) => {
                const windowAgentsManager = mainProcess.getWindowAgentsManager();
                const profileNames = mainProcess.getProfiles().getProfileNames();
                const mainWindowAgent = windowAgentsManager.getMainWindowAgent();
                mainWindowAgent?.sendFromMainProcess("cmd-line-selected-profile", 
                    {
                        cmdLineSelectedProfile: profileNames[0], 
                        args
                    }
                );
            });
        }
    };

    getMainProcesses = () => {
        return this._mainProcesses;
    };

    getPort = () => {
        return this._port;
    };

    setPort = (newPort: number) => {
        this._port = newPort;
    };
}
