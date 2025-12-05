import { Client, ClientChannel } from "ssh2";
import { DisplayWindowAgent } from "../windows/DisplayWindow/DisplayWindowAgent";
import { MainProcess } from "../mainProcess/MainProcess";
import { Log } from "../log/Log";
import { MainWindowAgent } from "../windows/MainWindow/MainWindowAgent";
import { type_options_createDisplayWindow } from "../windows/WindowAgentsManager";
import { tcpPortStr } from "../global/GlobalVariables";
import { readFileSync } from "fs";

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
    private _serverIP: string = "";
    private _serverSshPort: number = -1;
    private _userName: string = "";
    private _privateKeyFile: string = "";
    private _tdmCmd: string = "";

    // tcp heartbeat: every 1 second
    private _lastHeartbeatTime = Date.now();
    private _heartbeatInterval: NodeJS.Timeout | undefined = undefined;


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
        this._serverIP = "mpex-ics-srv008";
        this._serverSshPort = 22;
        this._userName = "1h7";
        this._privateKeyFile = "/Users/1h7/.ssh/id_rsa";

        // this._serverIP = sshServerConifg["ip"];
        // this._serverSshPort = sshServerConifg["port"];
        // this._userName = sshServerConifg["userName"];
        // this._privateKeyFile = sshServerConifg["privateKeyFile"];

        // this.tdmCmd = `export DISPLAY=:99; ` + sshServerConifg["tdmCommand"];
        // this.tdmCmd = `export DISPLAY=:99; ` + "/home/haohao/linux-arm64-unpacked/tdm --main-process-mode ssh-server";
        this._tdmCmd = `export DISPLAY=:99; ` + "cd /Users/haohao/tdm; npm start -- --settings /Users/haohao/profiles.json --attach -1 --main-process-mode ssh-server";
        this._tdmCmd = `export DISPLAY=:99; ` + "cd /Users/haohao/tdm; node dist/mainProcess/startMainProcess.js  --main-process-mode ssh-server --settings /Users/haohao/profiles.json";

        mainProcess.setConnectingToSsh(true);
        mainProcess.setMainProcessMode("ssh-client");

        this._sshClient = new Client();
        this.startTunnel();
    }

    private _sshClients: Client[] = [];
    getSshClients = () => {
        return this._sshClients;
    }

    private _sshServerConfigs: type_sshServerConfig[] = [
        {
            ip: "opslogin01",
            port: 22,
            userName: "u19",
            privateKeyFile: process.env.HOME + '/.ssh/id_rsa',
            tdmCommand: "",
        },
        {
            ip: "10.112.1.18",
            port: 22,
            userName: "1h7",
            privateKeyFile: '/Users/1h7/.ssh/id_rsa',
            tdmCommand: `export DISPLAY=:99; ` + "/home/1h7/linux-unpacked/tdm -- --attach -1 --main-process-mode ssh-server",
        }
    ]

    getSshServerConfigs = () => {
        return this._sshServerConfigs;
    }


    /** ------------------ connect to SSH and TCP servers --------------- */

    /**
     * Configure and connect the ssh client, wait until fully connected
     * 
     * (1) define ssh Clinet event handlers for "ready" and "error" events
     *     they must be defined before the ssh attempt to avoid any race condition
     *     (1.1) define the "ready" event callback: lift the block so that this async function can return
     *     (1.2) define the "error" event callback: destroy this SshClient object
     * 
     * (2) connect to ssh server, if the connection is successful, emit the "ready" event
     *     Two methods:
     *     (2.1) if the user provides a private key file, use it for login
     *     (2.2) if the user does not provide a private key file name, ask user for the password to login
     * 
     * (3) lift blocking when "ready" event in ssh is emitted
     * 
     * @returns {Promise<void>}
     */
    connectSsh = async (sshServerConfig: type_sshServerConfig): Promise<void> => {

        // resolved when SSH connection is established
        let resolveFunc: any;
        let rejectFunc: any;
        let promise = new Promise((resolve, reject) => {
            resolveFunc = resolve;
            rejectFunc = reject;
        })

        const host = sshServerConfig["ip"];
        const userName = sshServerConfig["userName"];
        const port = sshServerConfig["port"];
        const privateKeyFileName = sshServerConfig["privateKeyFile"];
        console.log("         <<<<<<<< connecting", host, "with", userName)

        // const sshClient = this.getSshClient();
        const sshClient = new Client();
        this.getSshClients().push(sshClient);

        const mainProcess = this.getMainProcess();
        const windowAgentsManager = mainProcess.getWindowAgentsManager();
        const mainWindowAgent = windowAgentsManager.getMainWindowAgent();
        if (!(mainWindowAgent instanceof MainWindowAgent)) {
            Log.error("You must have a main window to connect remote ssh.")
            mainProcess.quit();
            return;
        }

        // (1)
        sshClient.on("ready", () => {
            Log.info("0", "Successfully connected to SSH server", `${this.getServerIP()}:${this.getServerSshPort()}`);
            resolveFunc();
        });

        sshClient.on("error", (err: Error) => {
            if (mainProcess.getMainProcessMode() === "desktop") {
                // if the current mode is "desktop", error means the authentication failed
                this.destroy(`Cancel connecting to SSH server. Failed login to SSH server ${this.getServerIP()}:${this.getServerSshPort()}. ${err}`);
            } else if (mainProcess.getMainProcessMode() === "ssh-client") {
                // if the current mode is "ssh-client", error means the connection is broken
                this.destroy(`Disconnected with SSH server. You need to restart the TDM to reconnect. ${err}`);
            }
        });

        // (2)
        if (privateKeyFileName.trim() !== "" && privateKeyFileName !== undefined) {
            // (2.1)
            try {
                const keyFileContent = readFileSync(privateKeyFileName);
                sshClient.connect({
                    // host: this.getServerIP(),
                    // port: this.getServerSshPort(),
                    // username: this.getUserName(),
                    host: host,
                    port: port,
                    username: userName,
                    privateKey: keyFileContent,
                    debug: console.log,
                    // agentForward: true,
                    // x11: true,  // <-- crucial for X11 forwarding

                });
            } catch (e) {
                // e.g. failed to read file, destroy the ssh client
                this.destroy(`Failed to login with private key ${privateKeyFileName}. ${e}`);
            }
        } else {
            // (2.2)
            const password = await this.getPassword();
            sshClient.connect({
                // host: this.getServerIP(),
                // port: this.getServerSshPort(),
                // username: this.getUserName(),
                host: host,
                port: port,
                username: userName,
                // password: "Mous1ha9ha9",
                password: password,
                // tryKeyboard: true,
                // authHandler: this.authHandler,
                debug: console.log,
            });
        }

        // (3)
        await promise;
    }


    connectSshs = async () => {
        const sshServerConfig1 = this.getSshServerConfigs()[0];
        const sshServerConfig2 = this.getSshServerConfigs()[1];
        await this.connectSsh(sshServerConfig1);

        console.log("           <<<<<<<<<<<< 1 is connected")

        // resolved when SSH connection is established
        let resolveFunc: any;
        let rejectFunc: any;
        let promise = new Promise((resolve, reject) => {
            resolveFunc = resolve;
            rejectFunc = reject;
        })
        console.log("           <<<<<<<<<<<< step 1.1")

        const sshClient1 = this.getSshClients()[this.getSshClients().length - 1];
        const sshClinet2 = new Client();
        console.log("           <<<<<<<<<<<< step 1.3")
        sshClient1.forwardOut(
            "127.0.0.1",
            0,
            sshServerConfig2["ip"],
            sshServerConfig2["port"],
            (err, stream) => {
                const privateKeyFileName = "/Users/1h7/.ssh/id_rsa";
                const keyFileContent = readFileSync(privateKeyFileName);

                sshClinet2.connect({
                    sock: stream,
                    username: "1h7",
                    privateKey: keyFileContent,
                    // x11: true,
                    // x11Host: '127.0.0.1',
                    // x11Port: 6000,

                })
            }
        )
        console.log("           <<<<<<<<<<<< step 1.3")

        sshClinet2.on("ready", () => {
            console.log("           <<<<<<<<<<<< 2 is connected")
            console.log("connected to ...");
            this.getSshClients().push(sshClinet2);
            this.setSshClient(sshClinet2);
            resolveFunc();
        })

        await promise;


        // for (const sshServerConfig of this.getSshServerConfigs()) {
        //     // connect next one
        //     console.log("       >>>>>>>>>>>>> hop", sshServerConfig["ip"], "connected")
        // }

        // the last SshClient is final destination
        // this.setSshClient(this.getSshClients()[this.getSshClients().length - 1]);
    }

    /**
     * Run TDM in ssh-server mode on SSH server. It will start the TCP server.
     * This TCP port will be transferred to client. 
     * 
     * (1) run TDM command on remote server via ssh, this TDM is in `ssh-server` mode
     * 
     * (2) The remote TDM will start a TCP server, and print a series of magic words following
     *     the TCP port. In this way we can obtain the TCP port. Once we get the TCP port,
     *     we can lift the blocking and continue.
     * 
     * (3) block the program until we get the TCP port number
     * 
     * @returns TCP port on ssh server
     */
    startTdmOnServer = async (): Promise<number> => {

        const sshClient = this.getSshClient();
        const tdmCmd = this.getTdmCmd();

        // resolved when TCP server is created, resolved to TCP server port
        let resolveFunc: any;
        let rejectFunc: any;
        const promise = new Promise<number>((resolve, reject) => {
            resolveFunc = resolve;
            rejectFunc = reject;
        })

        // (1)
        sshClient.exec(tdmCmd, { x11: true},
            (err: Error | undefined, stream: ClientChannel) => {
                if (err === undefined) {
                    // each "data" event one "console.log()" from remote TDM
                    stream.on("data", (data: Buffer) => {
                        const dataStr = data.toString();
                        Log.info("[ssh server]", dataStr);
                        // (2)
                        if (dataStr.includes(tcpPortStr)) {
                            const tmp1 = dataStr.split(tcpPortStr)[1];
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
                        console.log("errr <<<<<<<<<<<<<<<<<<<<1,")
                        this.destroy(`SSH connection error on ${this.getServerIP()}:${this.getServerSshPort()}. ${err}`)
                    })
                } else {
                    console.log("errr <<<<<<<<<<<<<<<<<<<<2,")
                    this.destroy(`Failed to run TDM on ssh server ${this.getServerIP()} using command ${tdmCmd}`);
                }
            }
        );
        console.log(" <<<<<<<<<< aaa")
        // (2)
        return await promise;
    }

    /**
     * After we obtain the TCP port server, we can connect to it via ssh tunnel
     * 
     * If we have successfully connected to the TCP server:
     * 
     * (1) start 1 second period heartbeat with TCP server
     * 
     * (2) start to listen to tcp packets, these packets handled either here or websocket
     * 
     * (3) define the "end" and "error" event listeners for TCP
     * 
     * (4) hide the user prompt on main window
     * 
     * (5) resolve the TCP stream, lift up the blocking and return this TCP stream
     *     The TCP stream are used in other places
     */
    connectTcpServer = async (tcpServerPort: number): Promise<ClientChannel> => {

        const sshClient = this.getSshClient();
        const mainProcess = this.getMainProcess();
        const windowAgentsManager = mainProcess.getWindowAgentsManager();
        const mainWindowAgent = windowAgentsManager.getMainWindowAgent();

        // resolved when the client connects to the TCP server
        // resolved to the TCP server port
        let resolveFunc: any;
        let rejectFunc: any;
        const promise = new Promise<ClientChannel>((resolve, reject) => {
            resolveFunc = resolve;
            rejectFunc = reject;
        })

        // the last "jump": connect to the local TCP server operated by TDM
        // srcIp must be 127.0.0.1
        // srcPort not used but required
        // dstIP must be 127.0.0.1 or localhost, cannot be its IP
        sshClient.forwardOut("127.0.0.1", 0, "127.0.0.1", tcpServerPort,
            (err: Error | undefined, tcpStream: ClientChannel) => {
                if (err !== undefined) {
                    this.destroy(`Failed to connect TCP server ${this.getServerIP()}${tcpServerPort} via SSH tunnel. ${err}`);
                } else {
                    console.log("         +>>>>>>>>>>>>>> 1")
                    // (1)
                    this._heartbeatInterval = setInterval(() => {
                        this.checkLastHeartbeatTime();
                    }, 1000)

                    // (2)
                    console.log("         +>>>>>>>>>>>>>> 2")
                    this.registerTcpEventListeners();
                    tcpStream.on("data", (data: Buffer) => {
                        this.handleTcpData(data)
                    })

                    // (3)
                    console.log("         +>>>>>>>>>>>>>> 3")
                    tcpStream.on("end", () => {
                        this.destroy(`TCP connection with ${this.getServerIP()}:${tcpServerPort} disconnected.`);
                    })

                    console.log("         +>>>>>>>>>>>>>> 4")
                    tcpStream.on("error", (err: any) => {
                        this.destroy(`Error on TCP connection with ${this.getServerIP()}:${tcpServerPort}`);
                    })

                    // (4)
                    if (mainWindowAgent instanceof MainWindowAgent) {
                        mainWindowAgent.sendFromMainProcess("dialog-show-message-box", {
                            info: {
                                command: "hide",
                                messageType: "info",
                                humanReadableMessages: [],
                                rawMessages: [],
                            }
                        });
                    }

                    // (5)
                    console.log("         +>>>>>>>>>>>>>> 5")

                    resolveFunc(tcpStream);
                }
            }
        )
        console.log("         +>>>>>>>>>>>>>> 6")

        // (5.1)
        return await promise;
    }

    /**
     * connect the SSH and start the TCP tunnel
     * 
     * (1) connect to ssh
     * 
     * (2) start TDM on remote in ssh-server mode, it will start a TCP server
     * 
     * (3) connect to this TCP server
     * 
     * (4) update the profiles in main process and main window
     * 
     * (5) if there is anything wrong, destroy this SshClient
     */
    startTunnel = async () => {
        const windowAgentsManager = this.getMainProcess().getWindowAgentsManager();
        const mainWindowAgent = windowAgentsManager.getMainWindowAgent();
        if (!(mainWindowAgent instanceof MainWindowAgent)) {
            this.destroy("failed to start ssh tunnel: main window agent does not exist");
            return;
        }

        try {
            // (1)
            await this.connectSshs();

            // (2)
            const tcpServerPort = await this.startTdmOnServer();

            // (3)
            const tcpStream = await this.connectTcpServer(tcpServerPort);
            this.setTcpStream(tcpStream);

            // (4)
            mainWindowAgent.sendFromMainProcess("bounce-back", {
                eventName: "update-profiles",
                data: {
                    windowId: mainWindowAgent.getId(),
                }
            })

        } catch (e) {
            this.destroy(`Error in starting SSH tunnel ${e}`);
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
     * These events are from TCP server, they are intercepted there and not forwarded to WebSocket clients.
     * 
     * They are NOT websocket IPC events, they have a special form of {command: "...", data: {...}}
     * 
     * A TCP data that does not have "command" field will be passed along to the renderer process
     */
    registerTcpEventListeners = () => {

        this.tcpEventListenersOn("create-display-window-step-2", this.handleCreateDisplayWindowStep2);
        this.tcpEventListenersOn("create-web-display-window-step-2", this.handleCreateWebDisplayWindowStep2);
        this.tcpEventListenersOn("create-iframe-display-step-2", this.handleCreateIframeDisplayStep2);

        this.tcpEventListenersOn("close-browser-window", this.handleCloseBrowserWindow);

        this.tcpEventListenersOn("quit-tdm-process-immediately", this.handleQuitTdmProcessImmediately);

        this.tcpEventListenersOn("tcp-server-heartbeat", this.handleTcpServerHeartBeat);
    }

    /**
     * handle the TCP data from TCP server
     * 
     * Two types of TCP data:
     * 
     * (1) SSH TCP specific data, {command: string, data: Record<string, any>}. 
     *     There is a `command` field. They are handled in here by SshClient.handleXxx()
     * 
     * (2) Websocket IPC data, by default, the packets are automatically forwarded to renderer process 
     *     (GUI windows). No additional info required in the packet. The packet type is: 
     *     { processId: string, windowId: string, eventName: string, data: any[] }
     *     They are as if the data from main process to renderer process
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
                const windowId = dataJSON["windowId"];
                if (typeof windowId === "string") {
                    const webSocketClient = this.getMainProcess().getIpcManager().getClients()[windowId];
                    if (webSocketClient !== undefined && typeof webSocketClient !== "string") {
                        webSocketClient.send(JSON.stringify(dataJSON));
                    }
                }
            }
        }
    }

    /**
     * The remote TDM has prepared all display window agent data, instead of 
     * creating BrowserWindow on remote, we should let the local main process
     * to create a BrowserWindow on local computer, using the information provided
     * by the remote TDM.
     */
    handleCreateDisplayWindowStep2 = (options: any) => {
        this.getMainProcess().getWindowAgentsManager().createDisplayWindow(options);
    }

    /**
     * Similar to display window
     */
    handleCreateWebDisplayWindowStep2 = (options: { url: string, displayWindowId: string }) => {
        const { url, displayWindowId } = options;
        this.getMainProcess().getWindowAgentsManager().createWebDisplayWindow(url, displayWindowId);
    }

    /**
     * Similar to display window
     */
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

    /**
     * Similar to creating a GUI window, the remote tells the local
     * to close the corresponding window by the window ID
     */
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

    /**
     * The ssh-server tells the ssh-client that you can quit
     */
    handleQuitTdmProcessImmediately = () => {
        const mainProcess = this.getMainProcess();
        mainProcess.quit();
    }


    // ---------------------------- authentication --------------------------------

    getPassword = async () => {
        const mainProcess = this.getMainProcess();
        const windowAgentsManager = mainProcess.getWindowAgentsManager();
        const mainWindowAgent = windowAgentsManager.getMainWindowAgent();
        if (!(mainWindowAgent instanceof MainWindowAgent)) {
            Log.error("Main window agent not found.")
            return;
        }

        // it shows a prompt in main window --> user input password --> password goes back to main process and handled
        // by IpcManagerOnMainProcess.handleSshPasswordPromptResult() --> 
        mainWindowAgent.sendFromMainProcess("show-prompt", {
            data: {
                type: "ssh-password-input",
                callingMainProcessId: "0",
                username: this.getUserName(),
                hostname: this.getServerIP(),
            }
        });
        // wait for the password comes back
        const { password } = await this._passwordPromptPromise;
        return password;
    }


    // ------------------------------- senders --------------------------------

    // socketStatus: "ok" | "stop" = "ok";
    // it intercepts the message that is supposed to be processed by callbacks in main process
    // it is invoked in parseMessage in IPC manager on main processes
    sendToTcpServer = (message: Record<string, any>) => {
        const tcpStream = this.getTcpStream();
        if (tcpStream !== undefined) {
            tcpStream.write(JSON.stringify(message));
        } else {
            Log.error("0", "SSH WebSocket error: there is no forward out stream");
        }
    }

    // ----------------------------- getters ---------------------------------

    getMainProcess = () => {
        return this._mainProcess;
    };

    getServerIP = () => {
        return this._serverIP;
    };

    getServerSshPort = () => {
        return this._serverSshPort;
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

    getTcpStream = () => {
        return this._tcpStream;
    }

    setTcpStream = (newStream: ClientChannel) => {
        this._tcpStream = newStream;
    }

    getTdmCmd = () => {
        return this._tdmCmd;
    }

    getLastHeartbeatTime = () => {
        return this._lastHeartbeatTime;
    }

    setLastHeartbeatTime = () => {
        this._lastHeartbeatTime = Date.now();
    }

    setSshClient = (newClient: Client) => {
        this._sshClient = newClient;
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

    // -------------------- life cycle ---------------------------

    /**
     * (1) Periodically (every 1 second) check the heartbeat from TCP server
     *     if the last heartbeat is from more than 15 seconds ago, destroy the SshClient
     * 
     * (2) send 
     */
    checkLastHeartbeatTime = () => {
        const tDiff = Date.now() - this.getLastHeartbeatTime();
        if (tDiff > 15 * 1000) {
            this.destroy(`SSH client heartbeat expires (15 seconds). Quit.`)
        }
        // (1.2) send out heartbeat to server
        this.sendToTcpServer({
            command: "tcp-client-heartbeat"
        });

    }


    /**
     * If there is any error in SSH or TCP, destroy this SshClient, The TCP stream will be destroyed as well.
     * There is no re-connect/retry mechanism.
     * 
     * (1) Destroy ssh clinet object when something is really wrong
     * 
     * (2) destroy TCP stream
     * 
     * (3) remove interval
     * 
     * (4) tell TCP server to quit immediately
     * 
     * (5) show error prompt window on all windows
     * 
     * (6) if we are connecting to ssh, set the main process mode back to "desktop"
     * 
     * (7) show error message in console
     */
    destroy = (reason: string) => {
        // (1)
        this.getSshClient().destroy();

        // (2)
        this.getTcpStream()?.destroy();

        // (3)
        if (this._heartbeatInterval) {
            clearInterval(this._heartbeatInterval);
        }

        // (4)
        this.sendToTcpServer(
            {
                command: "quit-main-process",
                data: {
                }
            }
        )

        // (5)
        const windowAgentsManager = this.getMainProcess().getWindowAgentsManager();
        windowAgentsManager.showPrompt("error", ["SSH connection destroyed."], [reason]);

        // (6)
        const mainProcess = this.getMainProcess();
        if (mainProcess.getMainProcessMode() === "ssh-client" && mainProcess.isConnectingToSsh() === true) {
            mainProcess.setMainProcessMode("desktop");
            mainProcess.setConnectingToSsh(false);
        }

        // (7)
        Log.error(reason);
    }

}