import { Client, ClientChannel } from "ssh2";
import { DisplayWindowAgent } from "../windows/DisplayWindow/DisplayWindowAgent";
import { MainProcess } from "../mainProcess/MainProcess";
import { Log } from "../log/Log";
import { MainWindowAgent } from "../windows/MainWindow/MainWindowAgent";
import { type_options_createDisplayWindow } from "../windows/WindowAgentsManager";

export type type_sshServerConfig = {
    ip: string,
    port: number,
    userName: string,
    privateKeyFile: string,
    tdmCommand: string,
};

export class SshClient {
    private _mainProcess: MainProcess;
    private _sshClient: Client;
    // the ssh stream, basically the console.log() of the remote server
    private _tdmStream: ClientChannel | undefined = undefined;
    // the tcp stream, the message sent from remote server, mostly are the wrapped websocket IPC messages
    private _tcpStream: ClientChannel | undefined = undefined;

    private _serverIP: string;
    private _serverSshPort: number = -1;
    private _tcpServerPort: number = -1;
    private _userName: string;
    private _privateKeyFile: string;
    private _callingMainProcessId: string;
    private _lastHeartbeatTime = Date.now();

    mode: "DEBUG" | "OPERATING" = "OPERATING";



    // promises
    // lifted when the ssh password is correct
    _passwordPromptResolve: any;
    _passwordPromptReject: any;
    private _passwordPromptPromise = new Promise<{ password: string }>((resolve, reject) => {
        this._passwordPromptResolve = resolve;
        this._passwordPromptReject = reject;
    })
    // lifted when the ssh tunnel is digged through (ready)
    connectSshResolve: any;
    connectSshReject: any;
    connectSshPromise = new Promise((resolve, reject) => {
        this.connectSshResolve = resolve;
        this.connectSshReject = reject;
    })
    // lifted when the TDM ssh tcp server has started on the remote
    startTdmResolve: any;
    startTdmReject: any;
    startTdmPromise = new Promise<string | ClientChannel>((resolve, reject) => {
        this.startTdmResolve = resolve;
        this.startTdmReject = reject;
    })
    tdmCmd = "";
    // lifted when we receive the Tcp port on remote server from TDM stream
    tcpServerPortResolve: any;
    tcpServerPortReject: any;
    tcpServerPortPromise = new Promise<string>((resolve, reject) => {
        this.tcpServerPortResolve = resolve;
        this.tcpServerPortReject = reject;
    })

    connectTcpServerResolve: any;
    connectTcpServerReject: any;
    connectTcpServerPromise = new Promise<ClientChannel>((resolve, reject) => {
        this.connectTcpServerResolve = resolve;
        this.connectTcpServerReject = reject;
    })

    _loginTries: number = 0;
    _heartbeatInterval: NodeJS.Timeout | undefined = undefined;
    dataChunk: string = "";


    constructor(mainProcess: MainProcess, sshServerConifg: type_sshServerConfig, callingProcessId: string) {
        this._mainProcess = mainProcess;

        // todo: validate the config
        this._serverIP = sshServerConifg["ip"];
        this._serverSshPort = sshServerConifg["port"];
        this._userName = sshServerConifg["userName"];
        this._privateKeyFile = sshServerConifg["privateKeyFile"];
        this._callingMainProcessId = callingProcessId;
        this.tdmCmd = `export DISPLAY=:99; ` + sshServerConifg["tdmCommand"];

        this._sshClient = new Client();
        this.startSshTunnel();
    }

    /**
     * Configure and connect the ssh client, define the callback functions for "ready" and "error" events
     */
    configSshClient = () => {
        this.getSshClient().on("ready", () => {
            Log.info("0", "SSH tunnel has been digged through, we are ready to establish TCP connection with", `${this.getServerIP()}:${this.getTcpServerPort()}`);
            this.connectSshResolve();
        }
        );
        // emits when host is down if we try to connect()
        this.getSshClient().on("error", (err: Error) => {
            this.handleConnectionError("ssh", err);
        });
    }
    connectSsh = async () => {
        // show waiting prompt
        this.getCallingMainProcess()?.getWindowAgentsManager().getMainWindowAgent()?.sendFromMainProcess("dialog-show-message-box", {
            info: {
                command: "ssh-connection-waiting",
                messageType: "info", // symbol
                rawMessages: [], // computer generated messages
                buttons: [
                    {
                        text: "Cancel",
                    }
                ],
                // attachment?: any,
                // [ssh main process ID, username, host name, host ssh port]
                // humanReadableMessages: [this.getMainProcess().getProcessId(), this.getUserName(), this.getServerIP(), this.getServerSshPort()],
                humanReadableMessages: [`Connecting to ${this.getUserName()}@${this.getServerIP()}:${this.getServerSshPort()}`],
                attachment: {
                    sshMainProcessId: "0",
                }
            }
        });

        // connect ssh, if the connection is successful, emit the "ready" event
        // and lift the block 
        this.getSshClient().connect({
            host: this.getServerIP(),
            port: this.getServerSshPort(),
            username: this.getUserName(),
            // password: "Mous1ha9ha9",
            // tryKeyboard: true,
            authHandler: this.authHandler,
            debug: console.log,
        })
            // .on("x11", 
            //     (info, accept, reject) => {
            //         const xserversock = new net.Socket();
            //         xserversock.on('connect', () => {
            //           const xclientsock = accept();
            //           xclientsock.pipe(xserversock).pipe(xclientsock);
            //         }).connect(6000, 'localhost')
            //     }
            // )
            ;
        // lifted when the ssh client is "ready"
        await this.connectSshPromise;
    }

    startTdmOnRemote = async (): Promise<ClientChannel> => {
        // start the TDM on remote computer on ssh-server mode
        // a Tcp server is automatically started with the TDM
        this.getSshClient().exec(this.tdmCmd, //{ x11: true},
            (err: Error | undefined, tcpServerInfoStream: ClientChannel) => {
                if (err === undefined) {
                    this.startTdmResolve(tcpServerInfoStream);
                } else {
                    this.startTdmResolve(`Failed to run TDM in ssh-server mode on ${this.getServerIP()}, ${err?.message}`);
                    this.getCallingMainProcess()?.getWindowAgentsManager().getMainWindowAgent()?.sendFromMainProcess("dialog-show-message-box", {
                        info: {
                            messageType: "error",
                            humanReadableMessages: [`Failed to run TDM in ssh-server mode on ${this.getServerIP()}`, `command: ${this.tdmCmd}`],
                            rawMessages: [err?.message],
                        }
                    });
                }
            }
        );

        // block lifted when the this.startTdmCmd is executed on remote
        const tdmStream = await this.startTdmPromise;
        if (typeof tdmStream === "string") {
            throw new Error(tdmStream);
        } else {
            // the "data" event is the "console.log()" from remote TDM
            tdmStream.on("data", (data: Buffer) => {
                const dataStr = data.toString();
                Log.debug("0", "[ssh server]", dataStr);
                // when the Tcp server is successfully created and starts to listen in remote TDM
                // the remote TDM console.log() a stdout that looks like ... we have successfully created on port 3000 ...
                if (dataStr.includes("we have successfully created TCP server on port")) {
                    this.tcpServerPortResolve(dataStr);
                }
            });
            tdmStream.on("exit", () => {
                // when the ssh is connected, but the tcp is not yet, then the ssh connection is broken
                if (this.getTdmStream() !== undefined && this.getTcpStream() === undefined) {
                    this.updateCallingProcessMainWindowMessageBox("fail");
                }
            })
            // error message
            tdmStream.stderr.on("data", (data: Buffer) => {
                Log.error("0", "[ssh server]", data.toString());
            })
        }
        return tdmStream;
    }

    obtainTcpServerPort = async () => {
        const dataStr = await this.tcpServerPortPromise;
        const tmp1 = dataStr.split("we have successfully created TCP server on port")[1];
        if (tmp1 !== undefined) {
            const tmp2 = tmp1; //.split(" ")[0];
            if (tmp2 !== undefined) {
                const tcpServerPort = parseInt(tmp2);
                if (!isNaN(tcpServerPort)) {
                    return tcpServerPort;
                }
            }
        }
        return -1;
    }

    connectTcpServer = async (): Promise<ClientChannel> => {
        // srcIp could be localhost, 127.0.0.1, or local computer's IP
        // srcPort not used but required
        // dstIP must be 127.0.0.1 or localhost, cannot be its IP
        this.getSshClient().forwardOut("127.0.0.1", 0, "127.0.0.1", this.getTcpServerPort(),
            (err: Error | undefined, tcpStream: ClientChannel) => {
                if (err !== undefined) {
                    // e.g. the remote tcp server cannot be connected (port error, tcp server not started, ...)
                    throw new Error(`Error connecting TCP server ${this.getServerIP()}:${this.getTcpServerPort()}. ${err.message}`);
                } else {
                    this.connectTcpServerResolve(tcpStream);
                }
            }
        )
        return await this.connectTcpServerPromise;
    }

    configTcpStream = () => {
        const tcpStream = this.getTcpStream();
        if (tcpStream === undefined) {
            throw new Error(`TCP stream undefined, we have not connected to the Tcp server ${this.getServerIP()}:${this.getTcpServerPort()}`);
        }
        this._heartbeatInterval = setInterval(() => {
            // (1) check heartbeat from server
            this.checkLastHeartbeatTime();
            // (2) send out heartbeat to server
            this.sendToTcpServer({
                command: "tcp-client-heartbeat"
            });
        }, 1000)
        this.startTcpEventListeners();

        // when the stream is ended
        tcpStream.on("end", () => {
            const msg = "Forwardout tcp stream ended. Quit program";
            Log.debug("0", msg)
            // this.getSshClient().end();
            this.handleConnectionError("tcp", new Error(msg));
        })

        // listen to messages from ssh TCP server
        tcpStream.on("data", (data: Buffer) => {
            this.handleTcpData(data)
        })

        tcpStream.on("error", (err: any) => {
            this.handleConnectionError("tcp", err);
        })
    }

    updateCallingProcessMainWindowMessageBox = (status: "success" | "fail") => {
        const callingProcess = this.getCallingMainProcess();
        if (callingProcess !== undefined) {
            const mainWindowAgent = callingProcess.getWindowAgentsManager().getMainWindowAgent();
            if (mainWindowAgent instanceof MainWindowAgent) {
                if (status === "success") {
                    mainWindowAgent.sendFromMainProcess("dialog-show-message-box", {
                        info: {
                            // command?: string | undefined;
                            messageType: "info",
                            humanReadableMessages: [`Successfully connected to ${this.getServerIP()}:${this.getServerSshPort()}`,
                                "It is running on a different process with a new main window.",
                                "You can keep on running or quit this process."
                            ],
                            rawMessages: [],
                            // buttons?: type_DialogMessageBoxButton[] | undefined;
                            // attachment?: any;
                        }
                    })
                } else {
                    mainWindowAgent.sendFromMainProcess("dialog-show-message-box", {
                        info: {
                            // command?: string | undefined;
                            messageType: "error",
                            humanReadableMessages: [`Failed to connect ${this.getServerIP()}:${this.getServerSshPort()}`],
                            rawMessages: [],
                            // buttons?: type_DialogMessageBoxButton[] | undefined;
                            // attachment?: any;
                        }
                    })
                }
            }
        }
    }

    /**
     * (1) ssh to remote server <br>
     * 
     * (2) start TDM program in ssh-server mode. It prints the TCP server port <br>
     * 
     * (3) create ssh tunnel to the ssh TCP server <br>
     */
    startSshTunnel = async () => {
        try {
            // configure ssh server: IP, port, authentication ...
            this.configSshClient();
            // block lifted when the "ready" event emitted from the ssh server
            await this.connectSsh();
            // block lifted when TDM is successfully started on remote
            // it returns a Channel stream (ClientChannel), this stream shows the stdout of the remote TDM
            const tdmStream = await this.startTdmOnRemote();
            this.setTdmStream(tdmStream);
            // block lifted when we receive ...we have successfully created on port 3000... via TDM stream
            // the Tcp port is in this stdout on remote server
            const tcpServerPort = await this.obtainTcpServerPort();
            this.setServerTcpPort(tcpServerPort);
            // block lifted when the forward-out of the Tcp server is established
            // it returns a stream (ClientChannel) that carries the in and out Tcp messages
            const tcpStream = await this.connectTcpServer();
            this.setTcpStream(tcpStream);
            // configure the Tcp stream
            this.configTcpStream();
            // update message box on calling process main window
            this.updateCallingProcessMainWindowMessageBox("success");
        } catch (e) {
            Log.error("-1", `${e}`);
            this.updateCallingProcessMainWindowMessageBox("fail");
        }
    };
    // --------------------------------------- event handlers ---------------------------------
    /**
     * remote main process --> local main process, 
     * 
     * remote main process --> local renderer process 
     * DisplayWindowAgent.sendFromMainProcess() -> SshServer.sendToSshTcpClient()
     * --> SshClient.getForwardOutStream().on("data") -> SshClient.handleTcpData() -> SshClient.sendToRendererProcess() 
     *     -> IpcManagerOnMainProcesses.getClients()[windowId].send() -> IpcManagerOnDisplayWindow.ipcRenderer.on() -> callbacks on local renderer process
     * 
     * local renderer process -> local tcp client --> remote tcp server -> remote main process 
     * DispalyWindowClient.sendFromRendererProcess() -> IpcManagerOnMainProcesses.parseMessage() -> SshClient.sendToSshTcpServer() 
     * --> SshServer.tcpServer.on("data") -> SshServer.sendToMainProcess() -> IpcManagerOnMainProcesses.parseMessage() -> callbacks on main process
     * 
     * local main process  --> remote renderer process 
     */

    /**
     * Special cases: 
     *  - create remote main process
     *  - heartbeat on server
     *  - heartbeat on client
     *  - create main window
     *  - create display window
     *  - read binary (image, pdf) file from server
     *  - read tdl file from server
     *  - save file to server
     *  - open file from server
     */

    /**
     * Two types of data: <br>
     * 
     * (1) SSH TCP specific data, {command: string, data: Record<string, any>}. They are for commands from remote's 
     *     main process to local main process <br>
     * 
     * (2) TDM websocket IPC data,  { processId: string, windowId: string, eventName: string, data: any[] }. This is 
     * 
     * we do not have to know the remote Tcp server's port, the tcpStream handles all the traffic
     */
    handleTcpData = (data: Buffer) => {
        // data type: 
        this.dataChunk = this.dataChunk + data.toString();

        for (const dataJSON of this.extractData()) {
            const command = dataJSON["command"];
            if (command !== undefined) {
                if (command !== "tcp-server-heartbeat") {
                    Log.debug("0", "recevied data from TCP server:", data.toString())
                }
                const callback = this.tcpEventListeners[command];
                if (callback !== undefined) {
                    const data = dataJSON["data"];
                    if (data !== undefined) {
                        callback(data);
                    } else {
                        callback();
                    }
                }
            }
            else {
                // forward to renderer process via IPC
                this.sendToRendererProcess(dataJSON);
            }
        }
    }

    tcpEventListeners: Record<string, (...data: any) => void> = {};

    tcpEventListenersOn = (eventName: string, callback: (...data: any) => void) => {
        this.tcpEventListeners[eventName] = callback;
    }

    startTcpEventListeners = () => {
        this.tcpEventListenersOn("tcp-server-created", this.handleTcpServerCreated);
        this.tcpEventListenersOn("create-main-window-step-2", this.handleCreateMainWindowStep2);
        this.tcpEventListenersOn("create-display-window-step-2", this.handleCreateDisplayWindowStep2);
        this.tcpEventListenersOn("create-web-display-window-step-2", this.handleCreateWebDisplayWindowStep2);
        this.tcpEventListenersOn("create-iframe-display-step-2", this.handleCreateIframeDisplayStep2);
        this.tcpEventListenersOn("tcp-server-heartbeat", this.handleTcpServerHeartBeat);
        this.tcpEventListenersOn("close-browser-window", this.handleCloseBrowserWindow);
        this.tcpEventListenersOn("quit-tdm-process", this.handleQuitTdmProcess);
    }

    handleTcpServerCreated = () => {
        this.sendToTcpServer({
            command: "main-process-id",
            data: {
                id: "0",
            }
        })
    }

    handleCreateMainWindowStep2 = () => {
        // create a main window browser window
        this.getMainProcess().getWindowAgentsManager().createMainWindow();
        // quit the calling main process, it is a safe place to quit the calling process
        // if too early, this main process may be termined with the calling process
        // if too late, the user may operate on the calling process, which may cause unexpected behavior
        const callingMainprocess = this.getCallingMainProcess();
        if (callingMainprocess !== undefined) {
            // callingMainprocess.quit();
        }
    }

    handleCreateDisplayWindowStep2 = (options: any) => {
        this.getMainProcess().getWindowAgentsManager().createDisplayWindow(options);
    }

    handleCreateWebDisplayWindowStep2 = (url: string) => {
        this.getMainProcess().getWindowAgentsManager().createWebDisplayWindow(url);
    }

    handleCreateIframeDisplayStep2 = (data: {
        options: type_options_createDisplayWindow,
        widgetKey: string,
        parentDisplayWindowId: string
    }) => {
        this.getMainProcess().getWindowAgentsManager().createIframeDisplay(data["options"], data["widgetKey"], data["parentDisplayWindowId"]);
    }

    handleTcpServerHeartBeat = () => {
        this.setLastHeartbeatTime();
    }

    handleCloseBrowserWindow = (data: any) => {
        // create a display window browser window
        const displayWindowId = data['displayWindowId'];
        const mainWindowId = data['mainWindowId'];
        if (mainWindowId !== undefined) {
            const mainWindowAgent = this.getMainProcess().getWindowAgentsManager().getMainWindowAgent();
            if (mainWindowAgent instanceof MainWindowAgent) {
                const webContents = mainWindowAgent.getWebContents();
                if (webContents !== undefined) {
                    webContents.close();
                    mainWindowAgent.handleWindowClosed();
                }
            }
        } else if (displayWindowId !== undefined) {
            const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(displayWindowId);
            if (displayWindowAgent instanceof DisplayWindowAgent) {
                const webContents = displayWindowAgent.getWebContents();
                if (webContents !== undefined) {
                    webContents.close();
                    displayWindowAgent.handleWindowClose();
                    displayWindowAgent.handleWindowClosed();
                }
            }
        }
    }

    handleQuitTdmProcess = () => {
        const mainProcess = this.getMainProcess();
        mainProcess.quit();
    }

    /**
     * when
     * 
     * (1) remote host does not exist, the this.getSshClient().connect() time out
     */
    handleConnectionError = (src: "ssh" | "tcp", err: Error) => {

        const message1 = "Connection error from " + src + " server " + this.getUserName() + "@" + this.getServerIP() + ":" + `${src === "ssh" ? this.getServerSshPort() : this.getTcpServerPort()}`;
        const message2 = `${err}`;
        const message3 = "Disconnect";

        Log.error("0", `SshClient connection error:`, err);

        this.getCallingMainProcess()?.getWindowAgentsManager().getMainWindowAgent()?.sendFromMainProcess("dialog-show-message-box", {
            info: {
                messageType: "error",
                humanReadableMessages: [message1, message2, message3],
                rawMessages: [],
            }
        });

        // no retry
        Log.error("0", "-----------> quit main process")
        // this.getMainProcess().quit()
    }

    // ---------------------------- authentication --------------------------------

    /**
     * 2 authentication methods: key and passoword
     * 
     * The login attemp is carried out in callback()
     * 
     * After each callback() is invoked, if the result is success, the authHandler() is ended;
     * if the result of callback() is not success, the authHandler() is invoked again
     */
    authHandler = (methodsLeft: string[], partialSuccess: boolean, callback: any) => {
        // first try: public key, use the user name provided by the profiles
        if (this._loginTries === 0) {
            Log.debug("0", "try to use key to login ssh")
            this._loginTries++;
            this.loginWithKey(callback);
        }
        // second try: password, user can input both username and password from GUI
        else if (this._loginTries === 1) {
            Log.debug("0", "try password");
            this._loginTries++;
            this.loginWithPassword(callback);
        }
        else {
            // 
            // show error message on calling main process' main window
            this.getCallingMainProcess()?.getWindowAgentsManager().getMainWindowAgent()?.sendFromMainProcess("dialog-show-message-box", {
                info: {
                    messageType: "error",
                    humanReadableMessages: [`Wrong password for SSH host ${this.getUserName()}@${this.getServerIP()}`],
                    rawMessages: [],
                }
            });

            Log.info("0", "quit connecting tries ---> quit this main process");
            this.getMainProcess().quit()
        }
    };

    loginWithKey = (callback: any) => {
        try {
            if (this.getPrivateKeyFile().trim() === "") {
                // the key file is not defined
                throw new Error(`Private key file not defined`);
            } else {
                // the key file is defined
                const key = require("fs").readFileSync(this.getPrivateKeyFile());
                callback({
                    type: "publickey",
                    username: this.getUserName(),
                    key: key,
                })
            }
        } catch (e) {
            // if the key file cannot be read or the key file is not defined, 
            // use a mock key so that authHandler() is called again and we can proceed to password authentication
            // todo: show error message on calling process' main window if the 
            Log.error("0", e);
            callback({
                type: "publickey",
                username: this.getUserName(),
                key: "",
            })
        }
    }

    loginWithPassword = (callback: any) => {
        this.getCallingMainProcess()?.getWindowAgentsManager().getMainWindowAgent()?.sendFromMainProcess("show-prompt", {
            data: {
                type: "ssh-password-input",
                callingMainProcessId: "0",
                username: this.getUserName(),
                hostname: this.getServerIP(),
            }
        });
        // wait for the password comes back
        this._passwordPromptPromise.then((result: { password: string }) => {
            // on the calling process' main window, the password input is finished, show waiting prompt
            // the password-based authentication may be long
            this.getCallingMainProcess()?.getWindowAgentsManager().getMainWindowAgent()?.sendFromMainProcess("dialog-show-message-box", {
                info: {
                    command: "ssh-connection-waiting",
                    messageType: "info", // symbol
                    rawMessages: [], // computer generated messages
                    buttons: [
                        {
                            text: "Cancel",
                        }
                    ],
                    // attachment?: any,
                    // [ssh main process ID, username, host name, host ssh port]
                    // humanReadableMessages: [this.getMainProcess().getProcessId(), this.getUserName(), this.getServerIP(), this.getServerSshPort()],
                    humanReadableMessages: [`Connecting to ${this.getUserName()}@${this.getServerIP()}:${this.getServerSshPort()}`],
                    attachment: {
                        sshMainProcessId: "0",
                    }
                }
            });

            // the error will be captured by the "error" event of SshClient
            // the only chance that it has an error is the username is different from previous callback() invocation
            callback({
                type: 'password',
                username: this.getUserName(),
                password: result["password"],
            });
        });
    }


    // ------------------------------- senders --------------------------------

    // socketStatus: "ok" | "stop" = "ok";
    // it intercepts the message that is supposed to be processed by callbacks in main process
    // it is invoked in parseMessage in IPC manager on main processes
    sendToTcpServer = (message: Record<string, any>) => {
        // if (this.socketStatus === "ok") {
        const tcpStream = this.getTcpStream();
        if (tcpStream !== undefined) {
            if (message["command"] !== "tcp-client-heartbeat") {
                Log.debug("0", "send to tcp server:", message)
            }
            // if error, caught in this.getForwardOutStream().on("error") , handled by handleConnectionError()
            tcpStream.write(JSON.stringify(message));
        } else {
            Log.error("0", "SSH WebSocket error: there is no forward out stream");
        }
        // }
    }

    routeToRemoteWebsocketIpcServer = (options: {
        windowId: string,
        eventName: string,
        data: any[],
    }) => {
        // const processId = this.getMainProcess().getProcessId();
        const message = {
            processId: "0",
            windowId: options["windowId"],
            eventName: options["eventName"],
            data: options["data"],
        }
        const tcpMessage = {
            command: "forward-to-websocket-ipc",
            data: message,
        }
        this.sendToTcpServer(tcpMessage);
    }

    // whenever we receive a message from TCP server, it should directly go to the renderer process, without any further process
    // the IPC callbacks in main process are not used at all
    sendToRendererProcess = (message: Record<string, any>) => {
        const windowId = message["windowId"];
        if (typeof windowId === "string") {
            const webSocketClient = this.getMainProcess().getIpcManager().getClients()[windowId];
            if (webSocketClient !== undefined && typeof webSocketClient !== "string") {
                webSocketClient.send(JSON.stringify(message));
            }
        }
    }

    // ----------------------------- getters ---------------------------------

    getMainProcess = () => {
        return this._mainProcess;
    };

    // getMainProcesses = () => {
    //     return this.getMainProcess().getMainProcesses();
    // };

    getServerIP = () => {
        return this._serverIP;
    };

    getServerSshPort = () => {
        return this._serverSshPort;
    };

    getTcpServerPort = () => {
        return this._tcpServerPort;
    };

    getUserName = () => {
        return this._userName;
    }

    getPrivateKeyFile = () => {
        return this._privateKeyFile;
    }

    getSshClient = () => {
        return this._sshClient;
    };

    setServerTcpPort = (newPort: number) => {
        this._tcpServerPort = newPort;
    }

    getTcpStream = () => {
        return this._tcpStream;
    }

    setTcpStream = (newStream: ClientChannel) => {
        this._tcpStream = newStream;
    }
    getCallingMainProcess = () => {
        // return this.getMainProcess().getProcess(this._callingMainProcessId);
        return this.getMainProcess();
    }

    getTdmStream = () => {
        return this._tdmStream;
    }

    setTdmStream = (stream: ClientChannel) => {
        this._tdmStream = stream;
    }

    // ------------------------- tcp data processing ---------------------------
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
            try {
                // if there is any error, clear data chunk and return existing parsed data
                result.push(JSON.parse(str));
            } catch (e) {
                this.dataChunk = "";
                return result;
            }
        }
        return result;
    }

    // -------------------- heartbeat ---------------------------

    getLastHeartbeatTime = () => {
        return this._lastHeartbeatTime;
    }

    setLastHeartbeatTime = () => {
        this._lastHeartbeatTime = Date.now();
    }


    showDisconnectMessage = () => {
        const thisProcess = this.getMainProcess();
        if (thisProcess !== undefined) {
            const windowAgents = thisProcess.getWindowAgentsManager().getAgents();
            for (let windowAgent of Object.values(windowAgents)) {
                if (windowAgent instanceof DisplayWindowAgent) {
                    if (!windowAgent.hiddenWindow && !windowAgent.isWebpage()) {
                        windowAgent.sendFromMainProcess("dialog-show-message-box", {
                            info: {
                                // command?: string | undefined;
                                messageType: "error",
                                humanReadableMessages: [`Connection broken with ${this.getServerIP()}:${this.getServerSshPort()}`,
                                    "The connection cannot be re-established.", "Please consider to quit this process."
                                ],
                                rawMessages: [],
                                // buttons?: type_DialogMessageBoxButton[] | undefined;
                                // attachment?: any;
                            }
                        })
                    }
                } else if (windowAgent instanceof MainWindowAgent) {
                    windowAgent.sendFromMainProcess("dialog-show-message-box", {
                        info: {
                            // command?: string | undefined;
                            messageType: "error",
                            humanReadableMessages: [`Connection broken with ${this.getServerIP()}:${this.getServerSshPort()}`,
                                "The connection cannot be re-established.", "Please consider to quit this process."
                            ],
                            rawMessages: [],
                            // buttons?: type_DialogMessageBoxButton[] | undefined;
                            // attachment?: any;
                        }
                    })
                }
            }
        }
    }


    checkLastHeartbeatTime = () => {
        const tDiff = Date.now() - this.getLastHeartbeatTime();
        if (tDiff > 15 * 1000) {
            Log.error("0", `SSH client heartbeat expires.`)
            // show error messages on all visible windows
            this.showDisconnectMessage();
            // quit the heartbeat
            clearInterval(this._heartbeatInterval);
        }
    }

    /**
     * clean up the ssh-client related stuff.
     */
    quit = () => {
        this.sendToTcpServer(
            {
                command: "quit-main-process",
                data: {
                }
            }
        )
        if (this._heartbeatInterval) {
            clearInterval(this._heartbeatInterval);
        }
        // immediately cut off 
        // this.socketStatus = "stop";
        this.getTcpStream()?.destroy();
    }

    // getMainProcessId = () => {
    //     // return this.getMainProcess().getProcessId();
    //     return "0";
    // }

    getCallingProcess = () => {
        // const mainProcesses = this.getMainProcess().getMainProcesses();
        // const callingProcess = mainProcesses.getProcess(this._callingMainProcessId);
        // return callingProcess;
        return this.getMainProcess();
    }
}