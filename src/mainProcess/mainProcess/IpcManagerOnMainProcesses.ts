import { Log } from "../log/Log";
import { WebSocketServer, WebSocket, RawData } from "ws";
import { MainProcesses } from "./MainProcesses";
import { IncomingMessage } from "http";
import { MainWindowAgent } from "../windows/MainWindow/MainWindowAgent";
import { DisplayWindowAgent } from "../windows/DisplayWindow/DisplayWindowAgent";
import { MainProcess } from "./MainProcess";
import { SshServer } from "./SshServer";
import { writeFileSync } from "fs";
import { HttpServer } from "./HttpServer";
import https from "https";

/**
 * Inter-process communication server. <br>
 *
 * It is intended to replace the IPC mechanism in electron.js. <br>
 */
export class IpcManagerOnMainProcesses {
    server: WebSocketServer | undefined;
    _mainProcesses: MainProcesses;
    _port: number;
    _sshServer: SshServer | undefined = undefined;

    constructor(mainProcesses: MainProcesses, port: number, httpsServer: https.Server | undefined = undefined) {
        this._mainProcesses = mainProcesses;
        this._port = port;
        this.createServer(httpsServer);
    }

    createSshServer = () => {
        this._sshServer = new SshServer(this);
    }

    createServer = (httpsServer: https.Server | undefined) => {
        Log.info('-1', `Creating WebSocket IPC server on port ${this.getPort()}`);

        // if the main process mode is desktop, ssh-server, or ssh-client, websocket uses a unique port
        if (httpsServer === undefined) {
            this.server = new WebSocketServer({
                host: "127.0.0.1",
                port: this.getPort(),
                maxPayload: 50 * 1024 * 1024,
                perMessageDeflate: {
                    zlibDeflateOptions: {
                        // See zlib defaults.
                        chunkSize: 1024,
                        memLevel: 7,
                        level: 3
                    },
                    threshold: 10 * 1024 // Only compress messages > 10 KB
                }
            });
        } else {
            // if in web mode, use the same port as https server
            this.server = new WebSocketServer({ server: httpsServer });
        }

        this.server.on("error", (err: Error) => {
            if (err["message"].includes("EADDRINUSE")) {
                Log.info('-1', `Port ${this.getPort()} is occupied, try port ${this.getPort() + 1} for websocket IPC server`);
                let newPort = this.getPort() + 1;
                this.setPort(newPort);
                this.createServer(httpsServer);
            }
        });

        // IPC websocket server
        // when the display window becomes operating mode
        this.server.on("connection", (wsClient: WebSocket, request: IncomingMessage) => {
            Log.info('-1', `WebSocket IPC Server got a connection from ${request.socket.remoteAddress}:${request.socket.remotePort}`);

            wsClient.on("message", (messageBuffer: RawData) => {
                const message = JSON.parse(messageBuffer.toString(),
                    (key, value) =>
                        value === null ? undefined : value
                );
                Log.debug("-1", "IPC websocket server received message", message);
                this.parseMessage(wsClient, message);
            });

            wsClient.on("error", (err: Error) => {
                Log.error("-1", "ws IPC client got an error", err)
                Log.error("-1", "close connection (as well as the renderer process window)");
                // same as "close" event below
                const index = Object.values(this.getClients()).indexOf(wsClient);
                if (index !== -1) {
                    const id = Object.keys(this.getClients())[index];
                    const processId = id.split("-")[0];
                    if (typeof processId === "string") {
                        const mainProcess = this.getMainProcesses().getProcess(processId);
                        if (mainProcess instanceof MainProcess) {
                            const mainProcessMode = mainProcess.getMainProcessMode();
                            const windowAgent = mainProcess.getWindowAgentsManager().getAgent(id);
                            // in ssh-client, we must first tell the tcp-server to close
                            // the handleWindowClosed() may prevent this message sending out
                            if (mainProcessMode === "ssh-client") {
                                const sshClient = mainProcess.getSshClient();
                                if (sshClient !== undefined) {
                                    sshClient.quit();
                                }
                            }
                            if (windowAgent !== undefined) {
                                windowAgent.handleWindowClosed();
                            }

                        }
                    }
                }
            });

            // for whatever reason the websocket connection is closed, clean up the server side
            wsClient.on("close", (code: number, reason: Buffer) => {
                Log.info("-1", "WebSocket client closed.", code, reason);

                // same as "error" event below
                const index = Object.values(this.getClients()).indexOf(wsClient);
                if (index !== -1) {
                    const id = Object.keys(this.getClients())[index];
                    const processId = id.split("-")[0];
                    if (typeof processId === "string") {
                        const mainProcess = this.getMainProcesses().getProcess(processId);
                        if (mainProcess instanceof MainProcess) {
                            const windowAgent = mainProcess.getWindowAgentsManager().getAgent(id);
                            const mainProcessMode = mainProcess.getMainProcessMode();
                            // in ssh-client, we must first tell the tcp-server to close
                            // the handleWindowClosed() may prevent this message sending out
                            if (mainProcessMode === "ssh-client") {
                                const sshClient = mainProcess.getSshClient();
                                if (sshClient !== undefined) {
                                    // do not quit, quit only when there is an error as in above "error" event handler
                                    // sshClient.quit();
                                }
                            }
                            if (windowAgent !== undefined) {
                                windowAgent.handleWindowClosed();
                            }
                        }
                    }
                }
            });
        });
    };

    parseMessage = (wsClient: WebSocket | string, message: { processId: string; windowId: string; eventName: string; data: any[] }) => {
        const processId = message["processId"];
        const eventName = message["eventName"];
        const windowId = message["windowId"];

        const mainProcess = this.getMainProcesses().getProcess(processId);

        // find the MainProcess
        if (mainProcess === undefined) {
            Log.error('-1', `Cannot find main process ${processId}`);
            return;
        } else {
            if (mainProcess.getMainProcessMode() === "ssh-client") {
                // messages that must be on client side
                // do not call callbacks, forward message to tcp server
                // add one more layer:
                // {command: string, data: websocket-ipc-data}
                // they are intercepted here
                // "show-context-menu" 
                // "show-context-menu-sidebar" 
                // "main-window-show-context-menu"
                // "new-tdl-rendered": take screenshots, send local fonts names
                // "close-window": close the window, same as clicking the close button
                // "focus-window": focus the window, initiated by mosue down event on thumbnail
                // "processes-info": request processes info (CPU, memory) from renderer process
                if (
                    eventName === "show-context-menu"
                    || eventName === "show-context-menu-sidebar"
                    || eventName === "main-window-show-context-menu"
                    || eventName === "new-tdl-rendered"
                    || eventName === "close-window"
                    || eventName === "focus-window"
                    || eventName === "zoom-window"
                    || eventName === "processes-info"
                    || eventName === "close-iframe-display"
                    || eventName === "bring-up-main-window"
                ) {
                    const eventListeners = mainProcess.getIpcManager().getEventListeners();
                    const callback = eventListeners[eventName];
                    if (callback !== undefined) {
                        // invoke callback
                        const data = message["data"];
                        callback(undefined, ...data);
                    }
                    return;
                }

                let fullWindowId = windowId;
                // same as desktoip or web mode, always register the websocket client
                // also forward the message to to ssh server, so that the window can be registered
                if (this.getClients()[fullWindowId] === undefined) {
                    Log.debug("-1", "register window", windowId, "for WebSocket IPC");
                    this.getClients()[fullWindowId] = wsClient;
                    // lift the block in create window method
                    // const windowAgent = mainProcess.getWindowAgentsManager().getAgent(windowId);
                    // if (windowAgent instanceof MainWindowAgent || windowAgent instanceof DisplayWindowAgent) {
                    //     console.log("lift block for", windowId);
                    //     windowAgent.creationResolve("");
                    // }
                }
                // forward the message to remote ssh server
                const sshClient = mainProcess.getSshClient();
                const tcpMessage = {
                    command: "forward-to-websocket-ipc",
                    data: message,
                }
                if (sshClient !== undefined) {
                    sshClient.sendToTcpServer(tcpMessage);
                } else {
                    Log.error("-1", "Error: the main process", processId, "is not a ssh client");
                }
            } else if (mainProcess.getMainProcessMode() === "desktop" || mainProcess.getMainProcessMode() === "web") {
                let fullWindowId = windowId;
                // a "websocket-ipc-connected" message is sent from client when the connection is established
                // we register the client (window) upon this very first message from client
                // no dedicated event listener needed for this message
                // if (this.getClients()[fullWindowId] === undefined) {
                //     Log.debug("-1", "register window", windowId, "for WebSocket IPC");
                //     this.getClients()[fullWindowId] = wsClient;
                //     // lift the block in create window method
                //     const windowAgent = mainProcess.getWindowAgentsManager().getAgent(windowId);
                //     if (windowAgent instanceof MainWindowAgent || windowAgent instanceof DisplayWindowAgent) {
                //         Log.debug("-1", "lift block for", windowId);
                //         windowAgent.creationResolve("");
                //     }
                // } else {
                // find callback for this event
                const eventListeners = mainProcess.getIpcManager().getEventListeners();
                const callback = eventListeners[eventName];
                if (callback !== undefined) {
                    // invoke callback
                    const data = message["data"];
                    callback(wsClient, ...data);
                }
                // }
            } else if (mainProcess.getMainProcessMode() === "ssh-server") {

                // a "websocket-ipc-connected" message is sent from client when the Main Window constructor is called
                // we register the client (window) upon this very first message from client
                // if (this.getClients()[windowId] === undefined && eventName === "websocket-ipc-connected") {
                //     writeFileSync("/Users/haohao/tdm.log", `register window ${windowId} for websocket IPC \n`, { flag: 'a' });
                //     console.log("register window", windowId, "for WebSocket IPC");
                //     this.getClients()[windowId] = windowId;
                //     // lift the block in create window method
                //     const windowAgent = mainProcess.getWindowAgentsManager().getAgent(windowId);
                //     if (windowAgent instanceof MainWindowAgent || windowAgent instanceof DisplayWindowAgent) {
                //         console.log("lift block for", windowId);
                //         windowAgent.creationResolve("");
                //     }
                // } else {
                // find callback for this event
                const eventListeners = mainProcess.getIpcManager().getEventListeners();
                // writeFileSync("/Users/haohao/tdm.log", `"run callback function for event", ${eventName}\n`, { flag: 'a' });
                // console.log("run callback function for event", eventName)
                const callback = eventListeners[eventName];
                if (callback !== undefined) {
                    // invoke callback
                    const data = message["data"];
                    callback(undefined, ...data);
                }
                // }

            }
        }
    };

    clients: Record<string, WebSocket | string> = {};

    getPort = () => {
        return this._port;
    };

    setPort = (newPort: number) => {
        this._port = newPort;
    };

    getMainProcesses = () => {
        return this._mainProcesses;
    };

    getClients = () => {
        return this.clients;
    };

    /**
     * "1-22"
     *
     * (1) terminate the connection with the client, do not use close() as the client may have been closed <br>
     *
     * (2) remove the WebSocket object from client list <br>
     */
    removeClient = (id: string) => {
        // (1)
        const wsClient = this.getClients()[id];
        if (wsClient !== undefined && typeof wsClient !== "string") {
            wsClient.terminate();
        }
        // (2)
        delete this.getClients()[id];
        Log.info("-1", "Remove websocket IPC client", id);
    };


    getSshServer = () => {
        return this._sshServer;
    }

}
