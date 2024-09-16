import { IncomingMessage } from "http";
import { WebSocket, WebSocketServer, RawData } from "ws";
import { MainProcess } from "../mainProcess/MainProcess";
import { DisplayWindowAgent } from "../windows/DisplayWindow/DisplayWindowAgent";
import { CaChannelAgent } from "../channel/CaChannelAgent";
import { LocalChannelAgent } from "../channel/LocalChannelAgent";
import { logs } from "../global/GlobalVariables";

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
        logs.info(this.getMainProcessId(), "Close WebSocket PV Server");
        this.server?.close();
    };

    createServer = () => {
        logs.info(this.getMainProcessId(), `Creating WebSocket PV server on port ${this.getPort()}`);
        this.server = new WebSocket.Server({
            port: this.getPort(),
        });

        this.server.on("error", (err: Error) => {
            if (err["message"].includes("EADDRINUSE")) {
                logs.debug(this.getMainProcessId(), `Port ${this.port} is occupied, try port ${this.port + 1}`);
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
                        logs.fatal(this.getMainProcessId(), args);
                    } else if (type === "error") {
                        logs.error(this.getMainProcessId(), args);
                    } else if (type === "warn") {
                        logs.warn(this.getMainProcessId(), args);
                    } else if (type === "info") {
                        logs.info(this.getMainProcessId(), args);
                    } else if (type === "debug") {
                        logs.debug(this.getMainProcessId(), args);
                    } else if (type === "trace") {
                        logs.trace(this.getMainProcessId(), args);
                    } else {
                        logs.error(this.getMainProcessId(), "Received the following WS PV log message, but it is in wrong format");
                        console.log(args);
                    }
                    return;
                }

                const channelName = message["channelName"];
                const command = message["command"];
                const displayWindowId = message["displayWindowId"];
                if (channelName === undefined || command === undefined || displayWindowId === undefined) {
                    logs.debug(this.getMainProcessId(), "Message does not have channelName, command, or displayWindowId");
                    return;
                }
                const channelAgentsManager = this.getMainProcess().getChannelAgentsManager();
                const channelAgent = channelAgentsManager.getChannelAgent(channelName);
                const windowAgentsManager = this.getMainProcess().getWindowAgentsManager();
                const displayWindowAgent = windowAgentsManager.getAgent(displayWindowId);
                if (displayWindowAgent === undefined) {
                    logs.debug(this.getMainProcessId(), `Cannot find display window ${displayWindowId}`);
                    // the incoming request looks suspacious, do not reply
                    return;
                }

                if (channelAgent === undefined) {
                    logs.debug(this.getMainProcessId(), `Cannot find channel ${channelName}`);
                    // bounce back the message with an undefined value
                    wsClient.send(JSON.stringify({ ...message, value: undefined }));
                    return;
                }

                if (command === "GET") {
                    logs.debug(this.getMainProcessId(), `WebSocket PV server, GET ${message}`);
                    // send data
                    let dbrData: Record<string, any> = {};
                    // may be undefined
                    const timeout = message["timeout"];
                    if (channelAgent instanceof CaChannelAgent) {
                        dbrData = await channelAgent.get(displayWindowId, undefined, timeout);
                    } else if (channelAgent instanceof LocalChannelAgent) {
                        dbrData = await channelAgent.getDbrData();
                    } else {
                        logs.debug(this.getMainProcessId(), `Cannot find channel ${channelName}`);
                    }
                    wsClient.send(JSON.stringify({ ...dbrData, ...message, channelName: channelName }));
                } else if (command === "MONITOR") {
                    const channelNames = message["channelName"];
                    // register this websocket client
                    if (displayWindowAgent instanceof DisplayWindowAgent) {
                        displayWindowAgent.setWebSocketMonitorClient(wsClient);
                        if (channelNames !== undefined) {
                            displayWindowAgent.addWebSocketMonitorChannelName(channelNames);
                        }
                    }
                } else if (command === "PUT") {
                    const value = message["value"];
                    if (value === undefined) {
                        logs.debug(this.getMainProcessId(), "PUT command does not have value");
                        return;
                    }
                    if (channelAgent instanceof CaChannelAgent) {
                        channelAgent.put(displayWindowId, {
                            value: value,
                        });
                    } else if (channelAgent instanceof LocalChannelAgent) {
                        channelAgent.put(displayWindowId, {
                            value: value,
                        });
                    } else {
                        logs.debug(this.getMainProcessId(), `Cannot find channel ${channelName}`);
                    }
                } else {
                    logs.debug(this.getMainProcessId(), `Unknow command ${command}`);
                }
            });

            // when the websocket client quits, un-MONITOR
            wsClient.on("close", () => {
                const windowAgentsManager = this.getMainProcess().getWindowAgentsManager();
                const displayWindowAgents = windowAgentsManager.getAgents();
                for (const displayWindowAgent of Object.values(displayWindowAgents)) {
                    if (displayWindowAgent instanceof DisplayWindowAgent) {
                        if (wsClient === displayWindowAgent.getWebSocketMonitorClient()) {
                            logs.debug(this.getMainProcessId(), `Remove WebSocket PV for display window ${displayWindowAgent.getId()}`);
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
