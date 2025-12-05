import { IncomingMessage } from "http";
import { WebSocket, WebSocketServer, RawData } from "ws";
import { FileReader } from "../file/FileReader";
import { MainProcess } from "../mainProcess/MainProcess";
import { Log } from "../log/Log";
import { type_args } from "../mainProcess/IpcEventArgType";
import { openTdlFileAsRequestedByAnotherInstance } from "../global/GlobalMethods";

// this class is part of MainProcesses, it has nothing to do with the runtime MainProcess
// it runs before any MainProcess or profile selection
// it accepts the request from other TDM command line to open tdl files
// in this process.
export class WsOpenerServer {
    server: WebSocketServer | undefined;
    _mainProcess: MainProcess;
    _port: number;
    _flexibleAttach: boolean; // if true, when the port is occupied, try the next port  

    constructor(mainProcess: MainProcess, port: number, flexibleAttach: boolean) {
        this._mainProcess = mainProcess;
        this._port = port;
        this._flexibleAttach = flexibleAttach;

        this.createServer();
    }

    quit = () => {
        Log.info("-1", "Close WS Opener Server")
        this.server?.close();
    }

    createServer = () => {
        Log.info("-1", `Creating WebSocket opener server on port ${this.getPort()}`);

        const mainProcess = this.getMainProcess();

        this.server = new WebSocket.Server({
            host: "127.0.0.1",
            port: this.getPort(),
        });

        this.server.on("error", (err: Error) => {
            if (err["message"].includes("EADDRINUSE")) {
                if (this._flexibleAttach === true) {
                    Log.info("-1", `WebSocket opener port ${this.getPort()} is occupied, try port ${this.getPort() + 1}`);
                    let newPort = this.getPort() + 1;
                    this.setPort(newPort);
                    this.updatePort();
                    this.createServer();
                } else {
                    Log.fatal("-1", `WebSocket opener port ${this.getPort()} is occupied, and flexibleAttach is false, quit TDM.`);
                    mainProcess.quit();
                }
            }
        });

        // when the display window becomes operating mode
        this.server.on("connection", (wsClient: WebSocket, request: IncomingMessage) => {
            Log.info("-1", `WebSocket Opener Server got a connection`);
            wsClient.on("message", async (messageBuffer: RawData) => {
                const message = JSON.parse(messageBuffer.toString());
                this.handleMessage(message);
                // if the mesage is of type_args, then tell the other instance that 
                // you have successfully delivered the message, then you can quit
                if (message["attach"] !== undefined &&
                    message["macros"] !== undefined &&
                    message["settings"] !== undefined &&
                    message["profile"] !== undefined &&
                    message["alsoOpenDefaults"] !== undefined &&
                    message["fileNames"] !== undefined &&
                    message["attach"] !== undefined &&
                    message["cwd"] !== undefined &&
                    message["mainProcessMode"] !== undefined &&
                    message["httpServerPort"] !== undefined &&
                    message["site"] !== undefined
                ) {
                    wsClient.send(JSON.stringify({ messageDelivered: "success" }));
                }
            });

            // when the websocket client quits, un-MONITOR
            wsClient.on("close", () => {
                Log.info("-1", `WebSocket Opener Server disconnects with client.`);
            });
        });
    };

    // tell all MainProcess the new WS opener port
    updatePort = () => {
        const mainProcess = this.getMainProcess();

        const mainWindowAgent = mainProcess.getWindowAgentsManager().getMainWindowAgent();
        if (mainWindowAgent !== undefined) {
            mainWindowAgent.sendFromMainProcess("update-ws-opener-port",
                {
                    newPort: this.getPort(),
                }
            );
        } else {
            Log.error(0, "Main window agent does not exist");
        }

    };

    // the argv must have contained "--attach" option
    handleMessage = (args: type_args) => {
        // file names in args will be used 
        openTdlFileAsRequestedByAnotherInstance("", this.getMainProcess(), args);
    };

    getMainProcess = () => {
        return this._mainProcess;
    };

    getPort = () => {
        return this._port;
    };

    setPort = (newPort: number) => {
        this._port = newPort;
    };
}
