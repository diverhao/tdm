import net from "net";
import { Log } from "../../common/Log";
import { IpcManagerOnMainProcess } from "../mainProcess/IpcManagerOnMainProcess";
import { tcpPortStr } from "../global/GlobalVariables";

/**
 * 
 */
export class SshServer {

    private _ipcManager: IpcManagerOnMainProcess;
    private _tcpServer: net.Server | undefined = undefined;
    private _tcpSocket: net.Socket | undefined = undefined;
    private _lastHeartbeatTime = Date.now();
    private _heartbeatInterval: NodeJS.Timeout | undefined = undefined;
    private _mainProcessId: string = "-1";

    // self destruction count down timer for ssh server mode
    // the TDM instance will live for 15 seconds unless the clients connects
    private _selfDestructionCountDown: NodeJS.Timeout | undefined = undefined;

    // randomly assigned port between 4000 and 4999
    private _port: number = 4000 + Math.floor(Math.random() * 1000);

    dataChunk: string = "";

    constructor(ipcManager: IpcManagerOnMainProcess) {
        this._ipcManager = ipcManager;
        this.startSelfDestructionCountDown();
    }
    // ------------------------ tcp server -------------------------

    tcpEventListeners: Record<string, (...args: any) => void> = {};
    tcpEventListenersOn = (eventName: string, callback: (...args: any) => void) => {
        this.tcpEventListeners[eventName] = callback;
    }

    /**
     * 
     * These events are from TCP clients. 
     * They are intercepted and handled here, will not be forwarded to websocket
     * The websocket MainProcess.IpcManager does not have handlers for these events
     */
    startTcpEventListeners = () => {
        this.tcpEventListenersOn("tcp-client-heartbeat", this.handleTcpClientHeartBeat);
    }

    handleTcpClientHeartBeat = () => {
        this.setLastHeartbeatTime();
    }

    handlForwardtoWebsocketIpc = (message: any) => {
        const ipcManagerOnMainProcess = this.getIpcManager();
        const windowId = message["windowId"];
        ipcManagerOnMainProcess.handleMessage(windowId, message)
    }

    createTcpServer = () => {
        // writeFileSync("/Users/haohao/tdm.log", `Creating TCP server on port ${port0}\n`, { flag: "a" });
        this.setPort(this.getPort() + 1);
        let port = this.getPort();

        console.log("Creating TCP server on port", port);

        const mainProcess = this.getIpcManager().getMainProcess();

        const tcpServer: net.Server = net.createServer(
            // callback function invoked upon each connection from client
            (socket: net.Socket) => {

                // when receive data from the TCP client, forward it to the WebSocket client, and then forward to IPC websocket server
                socket.on('data', (data: Buffer) => this.handleTcpData(data));

                // when the tcp stream is abruptly ended, e.g. client got killed by ctrl+c
                // the broken network cable does not cause the stream, that is handled by the heartbeat
                socket.on('end', () => {
                    mainProcess.quit();
                    process.kill(process.pid, 9);
                });

                socket.on('close', () => {
                    mainProcess.quit();
                    process.kill(process.pid, 9);
                })

                socket.on('error', (err) => {
                    mainProcess.quit();
                    process.kill(process.pid, 9);
                });

                this._heartbeatInterval = setInterval(() => {
                    this.checkLastHeartbeatTime();
                    this.sendToTcpClient(JSON.stringify({ command: "tcp-server-heartbeat" }), false);
                }, 1000)

                // clear the self destruction countdown of the insance
                this.clearSelfDestructionCountDown();

                Log.debug("-1", "SSH TCP server got a client:", socket.remoteAddress, socket.remotePort)

                this.startTcpEventListeners();

                // tell client the port once the connection is established
                this.sendToTcpClient(JSON.stringify({
                    command: 'tcp-server-created',
                    data: {
                        port: port,
                    }
                }))

                this._tcpSocket = socket;
            }
        );

        // 'close' event: Triggered when the server is closed or there is an "error" emitted
        // do not do anything
        tcpServer.on('close', () => {
            mainProcess.quit();
            process.kill(process.pid, 9);
        });

        // when the port is in-use, or others
        // when a server has an error, it emits "close" event, which is handled above
        tcpServer.on('error', (err) => {
            tcpServer.close();

            // if the port is being used, find a new one
            if (err.message.includes("EADDRINUSE") && this.getPort() < 4100) {
                this.createTcpServer()
            } else {
                mainProcess.quit();
                process.kill(process.pid, 9);
            }
        });

        // this event emits just before the socket callback executes
        // assign the tcpServer
        tcpServer.once("listening", () => {
            // ! important: the ssh client uses this magic string to connect tcp server
            console.log(tcpPortStr, port);
            this.setTcpServer(tcpServer);
        })
        // listen to all network `interfaces
        tcpServer.listen(port, "0.0.0.0");

        this._tcpServer = tcpServer;
    }

    /**
     * handle the tcp data from TCP client
     */
    handleTcpData = (data: Buffer) => {
        console.log(`Received data from ssh TCP client: ${data.toString()}`);
        this.dataChunk = this.dataChunk + data.toString();
        for (const dataJSON of this.extractData()) {

            // dataJSON: {command: string, data: weboscket message} 
            // or the raw websocket message which does not contain command field
            const command = dataJSON["command"];

            if (command === undefined) {
                // raw websocket message, handled by IPC manager
                const ipcManagerOnMainProcess = this.getIpcManager();
                const windowId = dataJSON["windowId"];
                ipcManagerOnMainProcess.handleMessage(windowId, dataJSON as any)
            } else {
                // TCP specific message, handled here
                const data = dataJSON["data"];
                const callback = this.tcpEventListeners[command];
                if (callback !== undefined) {
                    if (data === undefined) {
                        callback();
                    } else {
                        callback(data);
                    }
                }
            }
        }
    }

    // it is invoked in sendFromMainProcess functions in each main/display window agent
    // this function intercepts the message that was supposed to go to the renderer process, routing the message to TCP client
    // {command: any}
    sendToTcpClient = (data: string, print: boolean = true) => {

        const tcpSocket = this.getTcpSocket();
        if (tcpSocket !== undefined) {
            if (print) {
                console.log("send to TCP client", data)
            }
            tcpSocket.write(data);
        } else {
            console.log("TCP client socket not exist on SSH server. Failed to send", data);
        }
    }

    // getters and settters
    setTcpServer = (newServer: net.Server) => {
        this._tcpServer = newServer;
    }

    getTcpSocket = () => {
        return this._tcpSocket;
    }

    getIpcManager = () => {
        return this._ipcManager;
    }


    getLastHeartbeatTime = () => {
        return this._lastHeartbeatTime;
    }

    setLastHeartbeatTime = () => {
        this._lastHeartbeatTime = Date.now();
    }

    checkLastHeartbeatTime = () => {
        const mainProcess = this.getIpcManager().getMainProcess();
        try {
            const tDiff = Date.now() - this.getLastHeartbeatTime();
            this._tcpServer?.getConnections((cb, num) => {
            });

            if (tDiff > 15 * 1000) {
                // quit
                mainProcess.quit();
                process.kill(process.pid, 9);
            }
        } catch (e) {
            // when the process is killed, the console.log() throws an exception
            // do nothing
            mainProcess.quit();
            process.kill(process.pid, 9);
        }
    }
    getHeartbeatInterval = () => {
        return this._heartbeatInterval;
    }

    quit = () => {
        // quit interval
        clearInterval(this.getHeartbeatInterval());
        // quit TCP server
        this._tcpServer?.close();

        this.getTcpSocket()?.destroy();
    }

    getMainProcessId = () => {
        return this._mainProcessId;
    }

    setMainProcessId = (newId: string) => {
        this._mainProcessId = newId;
    }



    splitJsonStrings = (str: string, result: string[]) => {
        let count = 0;
        let start = 0;
        let end = 0;
        let isInsideObj = false;
        for (let ii = 0; ii < str.length; ii++) {

            if (str[ii] === "{") {
                count++;
                isInsideObj = true;
            } else if (str[ii] === "}") {
                count--
            }

            if (count === 0 && isInsideObj === true) {
                end = ii + 1;
                result.push(str.slice(start, end));
                start = end;
                isInsideObj = false;
            }
        }
        return start;
    }

    extractData = (): Record<string, any>[] => {
        const strResult: string[] = [];
        const residualIndex = this.splitJsonStrings(this.dataChunk, strResult);
        this.dataChunk = this.dataChunk.slice(residualIndex);
        const result: Record<string, any>[] = [];
        for (let str of strResult) {
            result.push(JSON.parse(str));
        }
        return result;
    }

    getPort = () => {
        return this._port;
    }

    setPort = (newPort: number) => {
        this._port = newPort;
    }


    startSelfDestructionCountDown = () => {
        // self destruct after 15 seconds unless it is cleared by http 
        this._selfDestructionCountDown = setTimeout(() => {
            this.quit();
        }, 15 * 1000);
    }
    clearSelfDestructionCountDown = () => {
        clearTimeout(this._selfDestructionCountDown);
    }

}
