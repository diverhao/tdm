// import { writeFileSync } from "fs";
import { IpcManagerOnMainProcesses } from "./IpcManagerOnMainProcesses";
import net from "net";
import { Log } from "../log/Log";

/**
 * 
 */
export class SshServer {

    private _ipcManager: IpcManagerOnMainProcesses
    private _tcpServer: net.Server | undefined = undefined;
    private _tcpSockets: net.Socket[] = [];
    private _lastHeartbeatTime = Date.now();
    private _heartbeatInterval: NodeJS.Timeout | undefined = undefined;
    private _mainProcessId: string = "-1";

    // self destruction count down timer for ssh server mode
    // the TDM instance will live for 15 seconds unless the clients connects
    private _selfDestructionCountDown: NodeJS.Timeout | undefined = undefined;

    // randomly assigned port between 4000 and 4999
    private _port: number = 4000 + Math.floor(Math.random() * 1000);

    dataChunk: string = "";

    constructor(ipcManager: IpcManagerOnMainProcesses) {
        this._ipcManager = ipcManager;
        this.startSelfDestructionCountDown();
    }
    // ------------------------ tcp server -------------------------

    tcpEventListeners: Record<string, (...args: any) => void> = {};
    tcpEventListenersOn = (eventName: string, callback: (...args: any) => void) => {
        this.tcpEventListeners[eventName] = callback;
    }
    // tcp-specific events, other events are forwarded to the MainProcesses.ipcManager 
    startTcpEventListeners = () => {
        this.tcpEventListenersOn("main-process-id", this.handleMainProcessId);
        this.tcpEventListenersOn("quit-main-process", this.handleQuitMainProcess)
        this.tcpEventListenersOn("tcp-client-heartbeat", this.handleTcpClientHeartBeat);
        this.tcpEventListenersOn("forward-to-websocket-ipc", this.handlForwardtoWebsocketIpc);
    }

    handleMainProcessId = (data: { id: string }) => {
        // create main process using this process ID
        const mainProcessId = data["id"];
        console.log("I got main process ID:", mainProcessId, ". Then I will create the main process");
        this.getIpcManager().getMainProcesses().createProcess(undefined, "ssh-server", mainProcessId);
        this.setMainProcessId(mainProcessId);
    }
    /**
     * quit the whole thing
     */
    handleQuitMainProcess = () => {
        // this.getIpcManager().getMainProcesses().quit();
        const mainProcesses = this.getIpcManager().getMainProcesses();
        // writeFileSync("/Users/haohao/tdm.log", `\nquit main process.......${mainProcesses.getProcesses().length}\n`, { flag: "a" });
        // this.quit();
        const mainProcess = mainProcesses.getProcesses()[0];
        if (mainProcess !== undefined) {
            // writeFileSync("/Users/haohao/tdm.log", "quit main process ABCDEFG\n", { flag: 'a' });
            console.log("quit main process .........................");
            mainProcess.quit();
            process.kill(process.pid, 9);
        }

    }

    handleTcpClientHeartBeat = () => {
        this.setLastHeartbeatTime();
    }

    handlForwardtoWebsocketIpc = (data: any) => {
        this.forwardToMainProcesses(data);
    }
    createTcpServer = () => {
        // writeFileSync("/Users/haohao/tdm.log", `Creating TCP server on port ${port0}\n`, { flag: "a" });
        this.setPort(this.getPort() + 1);
        let port = this.getPort();

        console.log("Creating TCP server on port", port);

        const tcpServer: net.Server = net.createServer(
            // callback function invoked upon connection
            (socket: net.Socket) => {
                // writeFileSync(path.join(os.homedir(), "tdm.log"), `new client connected ${socket.remoteAddress}:${socket.remotePort}\n`, { flag: 'a' });

                this._tcpSockets.push(socket);
                // writeFileSync("/Users/haohao/tdm.log", `\nSocket connected --------------------------------------: ${port}\n`, { flag: 'a' });


                this._heartbeatInterval = setInterval(() => {
                    // writeFileSync(path.join(os.homedir(), "tdm.log"), `heartbeat interval\n`, { flag: 'a' });

                    // writeFileSync("/Users/haohao/tdm.log", `\nTcp interval --------------------------------------: ${port}\n`, { flag: 'a' });
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

                // when receive data from the TCP client, forward it to the WebSocket client, and then forward to IPC websocket server
                socket.on('data', (data: Buffer) => this.handleTcpData(data));

                // when the tcp stream is abruptly ended, e.g. client got killed by ctrl+c
                // the broken network cable does not cause the stream, that is handled by the heartbeat
                socket.on('end', () => {
                    // writeFileSync(path.join(os.homedir(), "tdm.log"), `tcp client ends\n`, { flag: 'a' });
                    this.handleQuitMainProcess();
                });

                socket.on('close', () => {
                    // writeFileSync(path.join(os.homedir(), "tdm.log"), `tcp client closed\n`, { flag: 'a' });
                    this.handleQuitMainProcess();

                })

                socket.on('error', (err) => {
                    // writeFileSync("/Users/haohao/tdm.log", `\nSocket error --------------------------------------: ${err.message}, ${port}\n`, { flag: 'a' });
                    this.handleQuitMainProcess();
                });
            }
        );

        this._tcpServer = tcpServer;


        // 'close' event: Triggered when the server is closed or there is an "error" emitted
        // do not do anything
        tcpServer.on('close', () => {
            // writeFileSync(path.join(os.homedir(), "tdm.log"), `we have closed the tcp server\n`, { flag: 'a' });
            this.handleQuitMainProcess();
        });

        // when the port is in-use, or others
        // when a server has an error, it emits "close" event, which is handled above
        tcpServer.on('error', (err) => {
            // writeFileSync(path.join(os.homedir(), "tdm.log"), `we have an error on the tcp server\n`, { flag: 'a' });

            tcpServer.close();
            // writeFileSync(path.join(os.homedir(), "tdm.log"), `tcp server error ${err.message}\n`, { flag: 'a' });
            // writeFileSync("/Users/haohao/tdm.log", `\nServer error --------------------------------------: ${err.message}, ${port}\n`, { flag: 'a' });
            // if the port is being used, find a new one
            if (err.message.includes("EADDRINUSE") && this.getPort() < 4100) {
                this.createTcpServer()
            } else {
                this.handleQuitMainProcess();
            }
        });

        // this event emits just before the socket callback executes
        // assign the tcpServer
        tcpServer.once("listening", () => {
            // writeFileSync(path.join(os.homedir(), "tdm.log"), `we have successfully created TCP server on port ${port}\n`, { flag: 'a' });
            // ! important: the ssh client uses this magic string to connect tcp server
            console.log("we have successfully created TCP server on port", port);
            this.setTcpServer(tcpServer);
        })
        // listen to all network `interfaces
        tcpServer.listen(port, "0.0.0.0");
    }



    // senders
    // let the ipc manager parse the message
    // it is invoked when the TCP server receives a message from TCP client
    forwardToMainProcesses = (message: { processId: string; windowId: string; eventName: string; data: any[] }) => {
        const ipcManagerOnMainProcesses = this.getIpcManager();
        const windowId = message["windowId"];
        console.log("-------------------------------->>>>>>>>>>>>", message);
        ipcManagerOnMainProcesses.parseMessage(windowId, message)
    }

    handleTcpData = (data: Buffer) => {
        // writeFileSync(path.join(os.homedir(), "tdm.log"), `Received data from ssh TCP client: ${data.toString()}\n`, { flag: 'a' });
        console.log(`Received data from ssh TCP client: ${data.toString()}`);
        this.dataChunk = this.dataChunk + data.toString();
        for (const dataJSON of this.extractData()) {
            // dataJSON: {command: string, data: weboscket message}
            // special keyword "command"
            const command = dataJSON["command"];
            const data = dataJSON["data"];
            const callback = this.tcpEventListeners[command];
            if (callback !== undefined) {
                if (data === undefined) {
                    callback();
                } else {
                    // writeFileSync("/Users/haohao/tdm.log", `run callback for ${command}\n`, { flag: 'a' });
                    callback(data);
                }
            }
        }
    }

    // it is invoked in sendFromMainProcess functions in each main/display window agent
    // this function intercepts the message that was supposed to go to the renderer process, routing the message to TCP client
    // {command: any}
    sendToTcpClient = (data: string, print: boolean = true) => {
        const tcpSockets = this.getTcpSockets();
        const tcpSocket = tcpSockets[0];
        if (tcpSocket !== undefined) {
            if (print) {
                console.log("send to TCP client", data)
            }
            tcpSocket.write(data);
        } else {
            console.log("TCP client socket not exist on SSH server");
        }
    }

    // getters and settters
    setTcpServer = (newServer: net.Server) => {
        this._tcpServer = newServer;
    }

    getTcpSockets = () => {
        return this._tcpSockets;
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
        try {
            const tDiff = Date.now() - this.getLastHeartbeatTime();
            // console.log("t diff = ", tDiff)
            this._tcpServer?.getConnections((cb, num) => {
                // writeFileSync("/Users/haohao/tdm.log", `tcp connections ${num} \n`, { flag: 'a' });

            });

            if (tDiff > 15 * 1000) {
                // quit
                // writeFileSync("/Users/haohao/tdm.log", "Heartbeat timeout: quit TDM ssh server", { flag: 'a' });
                // this.getIpcManager().getMainProcesses().quit();
                this.handleQuitMainProcess()
            }
        } catch (e) {
            // when the process is killed, the console.log() throws an exception
            // do nothing
            // this.getIpcManager().getMainProcesses().quit();
            this.handleQuitMainProcess()
        }
    }
    getHeartbeatInterval = () => {
        return this._heartbeatInterval;
    }

    quit = () => {
        // writeFileSync("/Users/haohao/tdm.log", "\nQuit ssh server.......\n", { flag: "a" });

        // quit interval
        clearInterval(this.getHeartbeatInterval());
        // quit TCP server
        this._tcpServer?.close();
        // this._tcpServer?.close(
        //     (err) => {
        //         if (err) {
        //             writeFileSync("/Users/haohao/tdm.log", "\nError during server shutdown tcp server\n", {flag: "a"});
        //         } else {
        //             writeFileSync("/Users/haohao/tdm.log", "\n No Error during server shutdown tcp server\n", {flag: "a"});
        //         }
        //     }
        // );
        for (let socket of this._tcpSockets) {
            socket.destroy();
        }
        // this._tcpSocket?.destroy();
        // this._tcpServer = undefined;
        // this._tcpSocket = undefined;
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
