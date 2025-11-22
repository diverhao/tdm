import { Client, ClientChannel } from "ssh2";
import { DisplayWindowAgent } from "../windows/DisplayWindow/DisplayWindowAgent";
import { MainProcess } from "../mainProcess/MainProcess";
import { Log } from "../log/Log";
import { MainWindowAgent } from "../windows/MainWindow/MainWindowAgent";
import { type_options_createDisplayWindow } from "../windows/WindowAgentsManager";
import { Profiles } from "../profile/Profiles";

export type type_sshServerConfig = {
    ip: string,
    port: number,
    userName: string,
    privateKeyFile: string,
    tdmCommand: string,
};

export class SshClient {
    private _mainProcess: MainProcess;

    // ssh client object
    private _sshClient: Client;

    // the tcp stream for tcp connection with remote server, 
    private _tcpStream: ClientChannel | undefined = undefined;

    // server properties
    private _serverIP: string;
    private _serverSshPort: number = -1;
    private _userName: string;
    private _privateKeyFile: string;

    // tcp heartbeat: every 1 second
    private _lastHeartbeatTime = Date.now();
    private _heartbeatInterval: NodeJS.Timeout | undefined = undefined;

    // magic words printed by the TDM in ssh-server mode indicating that it has
    // successfully created a TCP server. The ssh-client can obtain the TCP server port
    // based on this string
    private readonly tcpPortStr = "we have successfully created TCP server on port";

    // login and password input
    private _loginTries: number = 0;
    // lifted when the ssh password is correct
    _passwordPromptResolve: any;
    _passwordPromptReject: any;
    private _passwordPromptPromise = new Promise<{ password: string }>((resolve, reject) => {
        this._passwordPromptResolve = resolve;
        this._passwordPromptReject = reject;
    })

    // leftover data from last packet
    dataChunk: string = "";


    constructor(mainProcess: MainProcess, sshServerConifg: type_sshServerConfig) {
        this._mainProcess = mainProcess;

        // todo: validate the config
        this._serverIP = "127.0.0.1";
        this._serverSshPort = 22;
        this._userName = "haohao";
        this._privateKeyFile = "";
        // this._serverIP = sshServerConifg["ip"];
        // this._serverSshPort = sshServerConifg["port"];
        // this._userName = sshServerConifg["userName"];
        // this._privateKeyFile = sshServerConifg["privateKeyFile"];
        // this.tdmCmd = `export DISPLAY=:99; ` + sshServerConifg["tdmCommand"];

        this._sshClient = new Client();
        this.startSshTunnel();
    }

    /** ------------------ connect to SSH and TCP servers --------------- */

    /**
     * Configure and connect the ssh client, wait until fully connected
     * 
     * (1) show message box in main window telling user that we are connecting
     * 
     * (2) define ssh Clinet event handlers for "ready" and "error" events
     * 
     * (3) connect to ssh server, if the connection is successful, emit the "ready" event
     *     this connection is persistent
     * 
     * (4) lift blocking when "ready" event is emitted
     * 
     * @returns {Promise<void>}
     */
    connectSsh = async (): Promise<void> => {

        // resolved when SSH connection is established
        let resolveFunc: any;
        let rejectFunc: any;
        let promise = new Promise((resolve, reject) => {
            resolveFunc = resolve;
            rejectFunc = reject;
        })


        const sshClient = this.getSshClient();
        const mainProcess = this.getMainProcess();
        const windowAgentsManager = mainProcess.getWindowAgentsManager();
        const mainWindowAgent = windowAgentsManager.getMainWindowAgent();
        if (!(mainWindowAgent instanceof MainWindowAgent)) {
            Log.error("You must have a main window to connect remote ssh.")
            mainProcess.quit();
            return;
        }

        // (1)
        mainWindowAgent.sendFromMainProcess("dialog-show-message-box", {
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

        // (2)
        sshClient.on("ready", () => {
            Log.info("0", "Successfully connected to SSH server", `${this.getServerIP()}:${this.getServerSshPort()}`);
            resolveFunc();
        });

        sshClient.on("error", (err: Error) => {
            windowAgentsManager.showPrompt("error",
                [`Error in SSH connection with ${this.getServerIP()}:${this.getServerSshPort()}`],
                []
            );
        });


        // (3)
        sshClient.connect({
            host: this.getServerIP(),
            port: this.getServerSshPort(),
            username: this.getUserName(),
            password: "Mous1ha9ha9",
            // tryKeyboard: true,
            // authHandler: this.authHandler,
            debug: console.log,
        });

        // (4)
        await promise;
    }

    /**
     * Run TDM in ssh-server mode on SSH server. It will start the TCP server.
     * This TCP port will be transferred to client. 
     * 
     * @returns TCP port on ssh server
     */
    startTdmOnServer = async (): Promise<number> => {

        const sshClient = this.getSshClient();
        let tdmCmd = `export DISPLAY=:99; ` + "/home/haohao/linux-arm64-unpacked/tdm --main-process-mode ssh-server";
        tdmCmd = `export DISPLAY=:99; ` + "cd /Users/haohao/tdm; npm start -- --settings /Users/haohao/profiles.json --attach -1 --main-process-mode ssh-server";
        const mainProcess = this.getMainProcess();
        const windowAgentsManager = mainProcess.getWindowAgentsManager();

        // resolved when TCP server is created, resolved to TCP server port
        let resolveFunc: any;
        let rejectFunc: any;
        const promise = new Promise<number>((resolve, reject) => {
            resolveFunc = resolve;
            rejectFunc = reject;
        })

        sshClient.exec(tdmCmd, //{ x11: true},
            (err: Error | undefined, stream: ClientChannel) => {
                if (err === undefined) {
                    // each "data" event one "console.log()" from remote TDM
                    stream.on("data", (data: Buffer) => {
                        const dataStr = data.toString();
                        Log.info("[ssh server]", dataStr);
                        // when the Tcp server is successfully created
                        // the remote TDM will print out something like
                        // ... we have successfully created on port 3000 ...
                        // the number is the TCP port
                        if (dataStr.includes(this.tcpPortStr)) {
                            const tmp1 = dataStr.split(this.tcpPortStr)[1];
                            if (tmp1 !== undefined) {
                                const tcpServerPort = parseInt(tmp1);
                                if (!isNaN(tcpServerPort)) {
                                    Log.info("Successfully obtained remote server's TCP port", tcpServerPort);
                                    resolveFunc(tcpServerPort);
                                    return;
                                }
                            }
                        }
                    });
                    // if there is an error on SSH stream
                    stream.on("error", (err: any) => {
                        windowAgentsManager.showPrompt("error",
                            [
                                `SSH connection error on ${this.getServerIP()}:${this.getServerSshPort()}`,
                            ],
                            [err?.message]);

                        Log.error("[ssh server]", `${err}`)
                    })
                } else {
                    windowAgentsManager.showPrompt("error", [`Failed to run TDM in ssh-server mode on ${this.getServerIP()}`, `command: ${tdmCmd}`], [err?.message]);
                }
            }
        );

        // resolved to the TCP port number on server
        return await promise;
    }

    connectTcpServer = async (tcpServerPort: number): Promise<ClientChannel> => {

        const sshClient = this.getSshClient();
        const mainProcess = this.getMainProcess();
        const windowAgentsManager = mainProcess.getWindowAgentsManager();

        // resolved when the client connects to the TCP server
        // resolved to the TCP server port
        let resolveFunc: any;
        let rejectFunc: any;
        const promise = new Promise<ClientChannel>((resolve, reject) => {
            resolveFunc = resolve;
            rejectFunc = reject;
        })

        // srcIp could be localhost, 127.0.0.1, or local computer's IP
        // srcPort not used but required
        // dstIP must be 127.0.0.1 or localhost, cannot be its IP
        sshClient.forwardOut("127.0.0.1", 0, "127.0.0.1", tcpServerPort,
            (err: Error | undefined, tcpStream: ClientChannel) => {
                if (err !== undefined) {
                    windowAgentsManager.showPrompt("error",
                        [
                            `Failed to connect TCP server ${this.getServerIP()}${tcpServerPort} via SSH tunnel`,
                        ],
                        [err?.message]);
                } else {
                    // successfully connected the tcp server

                    this._heartbeatInterval = setInterval(() => {
                        // (1) check heartbeat from server
                        this.checkLastHeartbeatTime();
                        // (2) send out heartbeat to server
                        this.sendToTcpServer({
                            command: "tcp-client-heartbeat"
                        });
                    }, 10000)

                    // start to listen to tcp events
                    this.startTcpEventListeners();

                    // listen to messages from ssh TCP server
                    tcpStream.on("data", (data: Buffer) => {
                        this.handleTcpData(data)
                    })

                    // when the stream is ended
                    tcpStream.on("end", () => {
                        const msg = "Forwardout tcp stream ended. Quit program";
                        Log.debug("0", msg)
                        // this.getSshClient().end();
                        // this.handleConnectionError("tcp", new Error(msg));
                        windowAgentsManager.showPrompt("info",
                            [`TCP connection with ${this.getServerIP()}:${tcpServerPort} disconnected.`],
                            []
                        )
                    })

                    tcpStream.on("error", (err: any) => {
                        // this.handleConnectionError("tcp", err);
                        windowAgentsManager.showPrompt("error",
                            [`Error on TCP connection with ${this.getServerIP()}:${tcpServerPort}`],
                            []
                        )
                    })

                    resolveFunc(tcpStream);
                }
            }
        )
        return await promise;
    }

    /**
     * (1) ssh to remote server <br>
     * 
     * (2) start TDM program in ssh-server mode. It prints the TCP server port <br>
     * 
     * (3) create ssh tunnel to the ssh TCP server <br>
     */
    startSshTunnel = async () => {
        const windowAgentsManager = this.getMainProcess().getWindowAgentsManager();
        try {
            // connect SSH
            await this.connectSsh();

            // start TDM and TCP server on remote
            const tcpServerPort = await this.startTdmOnServer();

            // connect to TCP server through SSH tunnel
            const tcpStream = await this.connectTcpServer(tcpServerPort);

            this.setTcpStream(tcpStream);

            // request to update profiles in main window
            this.sendToTcpServer({
                command: "update-profiles",
                data: {}
            })
        } catch (e) {
            Log.error("-1", `${e}`);
            windowAgentsManager.showPrompt("error",
                [`Error in starting SSH tunnel ${e}`],
                []
            )
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

    tcpEventListeners: Record<string, (...data: any) => void> = {};

    tcpEventListenersOn = (eventName: string, callback: (...data: any) => void) => {
        this.tcpEventListeners[eventName] = callback;
    }

    /**
     * These events are intercepted there. They are not forwarded to WebSocket clients.
     */
    startTcpEventListeners = () => {
        this.tcpEventListenersOn("update-profiles", this.handleUpdateProfiles);
        this.tcpEventListenersOn("create-display-window-step-2", this.handleCreateDisplayWindowStep2);
        this.tcpEventListenersOn("create-web-display-window-step-2", this.handleCreateWebDisplayWindowStep2);
        this.tcpEventListenersOn("create-iframe-display-step-2", this.handleCreateIframeDisplayStep2);
        this.tcpEventListenersOn("tcp-server-heartbeat", this.handleTcpServerHeartBeat);
        this.tcpEventListenersOn("close-browser-window", this.handleCloseBrowserWindow);
        this.tcpEventListenersOn("quit-tdm-process", this.handleQuitTdmProcess);
    }

    /**
     * Two types of TCP data:
     * 
     * (1) SSH TCP specific data, {command: string, data: Record<string, any>}. 
     *     There is a `command` field. They are handled in here by SshClient.handleXxx()
     * 
     * (2) Websocket IPC data, 
     *     it is simply the IPC type data: { processId: string, windowId: string, eventName: string, data: any[] }
     *     without any additional information. They are forwarded to display/main windows
     */
    handleTcpData = (data: Buffer) => {
        this.dataChunk = this.dataChunk + data.toString();

        for (const dataJSON of this.extractData()) {
            const command = dataJSON["command"];

            if (command !== undefined) {
                // (1)
                Log.debug("0", "recevied data from TCP server:", data.toString())
                const callback = this.tcpEventListeners[command];
                if (callback !== undefined) {
                    const data = dataJSON["data"];
                    if (data !== undefined) {
                        callback(data);
                    } else {
                        callback();
                    }
                }
            } else {
                // (2)
                this.sendToRendererProcess(dataJSON);
            }
        }
    }



    /**
     * Update profiles in MainProcess and main window
     */
    handleUpdateProfiles = (data: {
        profilesJson: Record<string, any>,
        profilesFullFileName: string,
    }) => {
        const { profilesJson, profilesFullFileName } = data;

        const newProfiles = new Profiles(profilesFullFileName, profilesJson);
        this.getMainProcess().setProfiles(newProfiles);

        const mainWindowAgent = this.getMainProcess().getWindowAgentsManager().getMainWindowAgent();
        if (mainWindowAgent instanceof MainWindowAgent) {
            mainWindowAgent.updateProfiles();
        }

        // 
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
        const mainProcess = this.getMainProcess();

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
            mainProcess.getWindowAgentsManager().getMainWindowAgent()?.sendFromMainProcess("dialog-show-message-box", {
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
        const mainProcess = this.getMainProcess();
        mainProcess.getWindowAgentsManager().getMainWindowAgent()?.sendFromMainProcess("show-prompt", {
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
            mainProcess.getWindowAgentsManager().getMainWindowAgent()?.sendFromMainProcess("dialog-show-message-box", {
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

    // getTcpServerPort = () => {
    //     return this._tcpServerPort;
    // };

    getUserName = () => {
        return this._userName;
    }

    getPrivateKeyFile = () => {
        return this._privateKeyFile;
    }

    getSshClient = () => {
        return this._sshClient;
    };

    // setServerTcpPort = (newPort: number) => {
    //     this._tcpServerPort = newPort;
    // }

    getTcpStream = () => {
        return this._tcpStream;
    }

    setTcpStream = (newStream: ClientChannel) => {
        this._tcpStream = newStream;
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

}