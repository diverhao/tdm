import { IncomingMessage } from "http";
import { WebSocket, WebSocketServer, RawData } from "ws";
import { MainProcess } from "../mainProcess/MainProcess";
import { DisplayWindowAgent } from "../windows/DisplayWindow/DisplayWindowAgent";
import { CaChannelAgent } from "../channel/CaChannelAgent";
import { LocalChannelAgent } from "../channel/LocalChannelAgent";
import { Log } from "../log/Log";
import { MainWindowAgent } from "../windows/MainWindow/MainWindowAgent";

export class WsPvServer {
    server: WebSocketServer | undefined;
    _mainProcess: MainProcess;
    port: number;

    constructor(mainProcess: MainProcess, port: number) {
        this._mainProcess = mainProcess;
        this.port = port;
        this.createServer();
    }

    quit = () => {
        Log.info(this.getMainProcessId(), "Close WebSocket PV Server");
        this.server?.close();
    };

    createServer = () => {
        Log.info(this.getMainProcessId(), `Creating WebSocket PV server on port ${this.getPort()}`);
        this.server = new WebSocket.Server({
            host: "127.0.0.1",
            port: this.getPort(),
        });

        this.server.on("error", (err: Error) => {
            if (err["message"].includes("EADDRINUSE")) {
                Log.debug(this.getMainProcessId(), `Port ${this.port} is occupied, try port ${this.port + 1}`);
                this.port = this.port + 1;
                this.createServer();
            }
        });

        // when the display window becomes operating mode
        this.server.on("connection", (wsClient: WebSocket, request: IncomingMessage) => {
            wsClient.on("message", async (messageBuffer: RawData) => {
                const message = JSON.parse(messageBuffer.toString());
                if (message["command"] === "LOG") {
                    const type = message["type"];
                    const args = message["args"];
                    if (type === "fatal") {
                        Log.fatal(this.getMainProcessId(), args);
                    } else if (type === "error") {
                        Log.error(this.getMainProcessId(), args);
                    } else if (type === "warn") {
                        Log.warn(this.getMainProcessId(), args);
                    } else if (type === "info") {
                        Log.info(this.getMainProcessId(), args);
                    } else if (type === "debug") {
                        Log.debug(this.getMainProcessId(), args);
                    } else if (type === "trace") {
                        Log.trace(this.getMainProcessId(), args);
                    } else {
                        Log.error(this.getMainProcessId(), "Received the following WS PV log message, but it is in wrong format");
                    }
                    return;
                }

                let channelName = message["channelName"];
                const command = message["command"];
                const displayWindowId = message["displayWindowId"];

                if (channelName === undefined || command === undefined || displayWindowId === undefined) {
                    Log.debug(this.getMainProcessId(), "Message does not have channelName, command, or displayWindowId");
                    return;
                }
                if ((channelName as string).startsWith("loc://") && !(channelName as string).includes("@window_")) {
                    channelName = channelName + "@window_" + displayWindowId;
                }

                const windowAgentsManager = this.getMainProcess().getWindowAgentsManager();
                const displayWindowAgent = windowAgentsManager.getAgent(displayWindowId);
                if (displayWindowAgent === undefined || displayWindowAgent instanceof MainWindowAgent) {
                    Log.debug(this.getMainProcessId(), `Cannot find display window ${displayWindowId}`);
                    // the incoming request looks suspacious, do not reply
                    return;
                }


                if (command === "GET") {
                    Log.debug(this.getMainProcessId(), `WebSocket PV server, GET ${message}`);
                    const dbrData = await this.getIpcManager().handleTcaGet(undefined, channelName, displayWindowId, undefined, -1, 1, undefined, false);
                    wsClient.send(JSON.stringify({ ...dbrData, ...message, channelName: channelName }));
                } else if (command === "MONITOR") {
                    // const channelName = message["channelName"];
                    // register this websocket client
                    if (displayWindowAgent instanceof DisplayWindowAgent) {
                        displayWindowAgent.setWebSocketMonitorClient(wsClient);
                        if (channelName !== undefined) {
                            displayWindowAgent.addWebSocketMonitorChannelName(channelName);
                        }
                    }
                    // if the channel does not exist, create and monitor it
                    this.getIpcManager().handleTcaMonitor(undefined, displayWindowId, channelName);
                } else if (command === "PUT") {
                    const value = message["value"];
                    this.getIpcManager().handleTcaPut(undefined, channelName, displayWindowId, message, 1, "");
                } else {
                    Log.debug(this.getMainProcessId(), `Unknow command ${command}`);
                }
            });

            // when the websocket client quits, un-MONITOR
            wsClient.on("close", () => {
                const windowAgentsManager = this.getMainProcess().getWindowAgentsManager();
                const displayWindowAgents = windowAgentsManager.getAgents();
                for (const displayWindowAgent of Object.values(displayWindowAgents)) {
                    if (displayWindowAgent instanceof DisplayWindowAgent) {
                        if (wsClient === displayWindowAgent.getWebSocketMonitorClient()) {
                            Log.debug(this.getMainProcessId(), `Remove WebSocket PV for display window ${displayWindowAgent.getId()}`);
                            displayWindowAgent.setWebSocketMonitorClient(undefined);
                            displayWindowAgent.setWebSocketMonitorChannelNames([]);
                        }
                    }
                }
            });
        });
    };

    getMainProcess = () => {
        return this._mainProcess;
    };

    getIpcManager = () => {
        return this._mainProcess.getIpcManager();
    };
    getPort = () => {
        return this.port;
    };
    getMainProcessId = () => {
        return this.getMainProcess().getProcessId();
    };
}
