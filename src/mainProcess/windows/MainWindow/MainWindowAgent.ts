import { nativeImage, WebContents, BrowserWindow, Menu, App } from "electron";
import * as path from "path";
import * as url from "url";
import { WindowAgentsManager } from "../WindowAgentsManager";
import { Log } from "../../../common/Log";
import { generateAboutInfo } from "../../global/GlobalMethods";
import pidusage from "pidusage";
import { writeFileSync } from "fs";
import { IpcEventArgType2, IpcEventArgType3 } from "../../../common/IpcEventArgType";

/**
 * Represents the main window on main process. <br>
 *
 * Its ID is always "mainWindow". Each TDM program can have at most one main window.
 */
export class MainWindowAgent {
    private _id: string = "";
    private _windowAgentsManager: WindowAgentsManager;
    private _browserWindow: any; // BrowserWindow | undefined;
    // private _mainProcessId: string;
    readyToClose: boolean = false;

    // a Promise that is resolved when the main window successfully loads the URL
    // it blocks the IpcManagerOnMainProcess.handleProfileSelected()
    // after it is resolved, the user can select the profile
    loadURLPromise: undefined | Promise<void>;

    // creationResolve: any;
    // creationReject: any;
    // creationPromise: Promise<string> = new Promise((resolve, reject) => {
    //     this.creationResolve = resolve;
    //     this.creationReject = reject;
    // });

    // the promise blocks the IpcManagerOnMainProcess.handleProfileSelected()
    // resolved after the websocket IPC is established between Main Window and main process
    // resolved at IpcManagerOnMainProcess.handleWebsocketIpcConnectedOnMainWindow()
    // after this one is resolved, the user can select the profile
    websocketIpcConnectedResolve: any;
    websocketIpcConnectedReject: any;
    websocketIpcConnectedPromise: Promise<string> = new Promise((resolve, reject) => {
        this.websocketIpcConnectedResolve = resolve;
        this.websocketIpcConnectedReject = reject;
    });

    constructor(windowAgentsManager: WindowAgentsManager) {
        this._windowAgentsManager = windowAgentsManager;
        // this._mainProcessId = windowAgentsManager.getMainProcess().getProcessId();
        // this._id = `${this._mainProcessId}`;
        this._id = "0";
    }

    // ---------------------- GUI (BrowserWindow) ---------------------------

    generateWindowTitle = () => {
        let windowTitle = `TDM Main Window`;

        let hostname: string | undefined = this.getWindowAgentsManager().getMainProcess().getSshClient()?.getServerIP();
        if (hostname === undefined) {
            hostname = ""
        } else {
            hostname = `${hostname}:`
        }

        windowTitle = hostname + windowTitle;

        const selectedProfile = this.getWindowAgentsManager().getMainProcess().getProfiles().getSelectedProfile();
        if (selectedProfile !== undefined) {
            windowTitle = windowTitle + " -- " + selectedProfile.getName();
        }

        return windowTitle;
    }

    /**
     * Create the GUI window. <br>
     * 
     * If this is a SSH server, update the SSH client's main window
     *
     * @returns {Promise<void>} until the GUI window is created and the html file is loaded.
     */
    createBrowserWindow = async (httpResponse: any = undefined) => {
        const mainProcesMode = this.getWindowAgentsManager().getMainProcess().getMainProcessMode();

        if (mainProcesMode === "ssh-server") {
            // do nothing, wait for update-profiles-in-main-window
        } else if (mainProcesMode === "ssh-client" || mainProcesMode === "desktop") {

            // default options
            const windowOptions = {
                width: 1000,
                height: 800,
                backgroundColor: `rgb(255, 255, 255)`,
                title: this.generateWindowTitle(),
                resizable: true,
                // with chrome (not the Google Chrome)
                frame: true,
                autoHideMenuBar: true,
                minWidth: 200,
                minHeight: 100,
                show: true,
                icon: path.join(__dirname, '../../../common/resources/webpages/tdm-logo.png'),
                webPreferences: {
                    // use node.js
                    preload: path.join(__dirname, 'preload.js'), // <-- preload script here
                    nodeIntegration: true,
                    contextIsolation: true,
                    nodeIntegrationInWorker: true,
                    sandbox: false,
                    webviewTag: true,
                    backgroundThrottling: false,
                    webSecurity: false,
                    defaultFontFamily: {
                        standard: "Arial",
                    }
                },
            };
            const window = new BrowserWindow(windowOptions);

            this._browserWindow = window;
            window.setMenu(null);

            this.getWindowAgentsManager().setDockMenu();

            // clear cache
            // const session = window.webContents.session;
            // session.clearCache();
            // session.clearStorageData();

            // clean up data when the GUI is closed
            // ! in ssh-client mode, once the window is asked to close, close it immeidately
            // ! otherwise the window-will-be-closed message from main process may never arrive at
            // ! the renderer process, causing the window hanging 
            // if (mainProcesMode !== "ssh-client") {
            window.on("closed", this.handleWindowClosed);
            window.on("close", (event: any) => {
                this.handleWindowClose(event);
            });
            // }

            const ipcServerPort = this.getWindowAgentsManager().getMainProcess().getIpcManager().getPort();
            const hostname = this.getWindowAgentsManager().getMainProcess().getMainProcessMode() === "desktop" ?
                "127.0.0.1" : "ABCD";
            // : this.getWindowAgentsManager().getMainProcess().getSshClient()?.getServerIP();

            // const hostname = "127.0.0.1";

            this.loadURLPromise = window.loadURL(
                url.format({
                    pathname: path.join(__dirname, `MainWindow.html`),
                    protocol: "file:",
                    slashes: true,
                    query: {
                        ipcServerPort: `${ipcServerPort}`,
                        mainWindowId: `${this.getId()}`,
                        hostname: `${hostname}`,
                    },
                })
            );
            await this.loadURLPromise;
        } else if (mainProcesMode === "web") {
            // web mode
            const ipcServerPort = this.getWindowAgentsManager().getMainProcess().getIpcManager().getPort();

            httpResponse.send(
                `
                <html>
                    <body style="margin: 0px; padding: 0px">
                        <div id="root"></div>
                        <script>
                            var exports = {};
                        </script>
    
                        <script type="module" src="/MainWindowClient.js"></script>
    
                        <script type="module">
                            const urlParams = new URLSearchParams(window.location.search);
                            const ipcServerPort = urlParams.get("ipcServerPort");
                            const mainWindowId = urlParams.get("mainWindowId");
                            new window.MainWindowClientClass("${this.getId()}", ${ipcServerPort});
                        </script>
                    </body>
                </html>
                `
            );
        } else {
            Log.error("Wrong main process mode");
        }
    };


    /**
     * Get WebContents for this window <br>
     *
     * @returns {WebContents | undefined} `undefined` if the BrowserWindow or WebContents does not exist.
     */
    getWebContents = (): WebContents | undefined => {
        const browserWindow = this.getBrowserWindow();
        if (browserWindow === undefined) {
            return undefined;
        } else {
            return browserWindow.webContents;
        }
    };

    /**
     * Clean up main process after the main window GUI is closed. <br>
     *
     * Invoked when the BrowserWindow receives a "close" event.
     */
    handleWindowClosed = () => {
        // writeFileSync("/Users/haohao/tdm.log", `main window closed ===================== cleaning up stuff\n`, {flag: "a"});
        Log.info("0", "close main window", this.getId())
        this.getWindowAgentsManager().removeAgent(this._id);

        // check if there is any other BrowserWindow,
        const hasPreloadedBrowserWindow = this.getWindowAgentsManager().preloadedDisplayWindowAgent === undefined ? 0 : 1;
        const hasPreviewBrowserWindow = this.getWindowAgentsManager().previewDisplayWindowAgent === undefined ? 0 : 1;
        const numBrowserWindows = Object.keys(this.getWindowAgentsManager().getAgents()).length;

        if (numBrowserWindows - hasPreloadedBrowserWindow - hasPreviewBrowserWindow <= 0) {
            if (this.getWindowAgentsManager().getMainProcess().getMainProcessMode() === "desktop" || this.getWindowAgentsManager().getMainProcess().getMainProcessMode() === "ssh-client") {
                // quit on desktop mode
                this.getWindowAgentsManager().getMainProcess().quit();
            }
        }

        // (6) destroy client object on the WebSocket IPC server
        // const mainProcesses = this.getWindowAgentsManager().getMainProcess().getMainProcesses();
        // const webSocketIpcManager = mainProcesses.getIpcManager();
        const ipcManager = this.getWindowAgentsManager().getMainProcess().getIpcManager();
        ipcManager.removeClient(this.getId());

        this.getWindowAgentsManager().setDockMenu();

    };

    handleWindowClose = (event: any) => {
        const mainProcess = this.getWindowAgentsManager().getMainProcess();
        const mainProcessMode = mainProcess.getMainProcessMode();
        if (mainProcessMode === "desktop") {
            // just close the window
        } else if (mainProcessMode === "ssh-client") {
            // tell the ssh-server to clean up the main window stuff
            if (this.readyToClose) {
                return;
            }
            event.preventDefault();
            this.readyToClose = true;
            this.sendFromMainProcess("window-will-be-closed", {});
        }
    };

    /**
     * Focus to the main window. The BrowserWindow must exist.
     */
    show = () => {
        const browserWindow = this.getBrowserWindow();
        if (browserWindow === undefined) {
            Log.error("0", "Main window does not exist, nothing to pop up");
        } else {
            browserWindow.show();
        }
    };

    focus = () => {
        if (this.getWindowAgentsManager().getMainProcess().getMainProcessMode() === "ssh-server") {
            return;
        }
        const browserWindow = this.getBrowserWindow();
        if (browserWindow instanceof BrowserWindow) {
            if (browserWindow.isMinimized()) {
                browserWindow.restore();
            }
            browserWindow.focus();
        } else {
            Log.error("0", `Main window does not exist, nothing to pop up`);
        }
    };

    showContextMenu = (menu: ("copy" | "cut" | "paste")[]) => {
        if (this.getWindowAgentsManager().getMainProcess().getMainProcessMode() === "ssh-server") {
            return;
        }

        let contextMenuTemplate: (Electron.MenuItem | Electron.MenuItemConstructorOptions)[] = [];
        if (menu.includes("copy")) {
            contextMenuTemplate.push(
                {
                    label: "Copy",
                    accelerator: "CmdOrCtrl+c",
                    role: "copy",
                },
            )
        }
        if (menu.includes("cut")) {
            contextMenuTemplate.push(
                {
                    label: "Cut",
                    accelerator: "CmdOrCtrl+x",
                    role: "cut",
                },
            )
        }
        if (menu.includes("paste")) {
            contextMenuTemplate.push(
                {
                    label: "Paste",
                    accelerator: "CmdOrCtrl+v",
                    role: "paste",
                },
            )
        }
        const contextMenu = Menu.buildFromTemplate(contextMenuTemplate);
        contextMenu.popup();
    }

    // ---------------------- IPC -----------------------------

    /**
     * Send data from main process to renderer process. This is a process for main window. <br>
     *
     * @param {string} channel Event name
     * @param {any[]} args Data
     */
    // sendFromMainProcess(channel: string, ...args: any[]) {
    sendFromMainProcess = <T extends keyof IpcEventArgType3>(channel: T, arg: IpcEventArgType3[T]): void => {

        // const processId = this._windowAgentsManager.getMainProcess().getProcessId();
        const ipcManagerOnMainProcesses = this.getWindowAgentsManager().getMainProcess().getIpcManager();
        const mainProcessMode = this.getWindowAgentsManager().getMainProcess().getMainProcessMode();

        if (mainProcessMode === "ssh-server") {
            const sshServer = ipcManagerOnMainProcesses.getSshServer();
            if (sshServer !== undefined) {
                // writeFileSync("/Users/haohao/tdm.log", `send from main process for Main Window ===================== ${JSON.stringify(args)}\n`, {flag: "a"});
                // const args = Object.values(arg);
                sshServer.sendToTcpClient(JSON.stringify({ processId: "0", windowId: this.getId(), eventName: channel, data: [arg] }));
            }
        } else {
            // the main window must come with a process ID
            const wsClient = ipcManagerOnMainProcesses.getClients()[this.getId()];

            if (wsClient === undefined) {
                Log.error("0", "Cannot find WebSocket IPC client for window", this.getId());
                return;
            }
            try {
                // add processId
                // this._browserWindow?.webContents.send(channel, processId, ...args);
                if (typeof wsClient !== "string") {
                    wsClient.send(JSON.stringify({ processId: "0", windowId: this.getId(), eventName: channel, data: [arg] }));
                }
            } catch (e) {
                Log.error("0", e);
            }
        }
    }

    // ---------------------- getters -------------------------
    getWindowAgentsManager = () => {
        return this._windowAgentsManager;
    };

    isMainWindow = (): boolean => {
        return true;
    };

    getId = (): string => {
        return this._id;
    };

    getBrowserWindow = (): BrowserWindow | undefined => {
        return this._browserWindow;
    };


    showAboutTdm = () => {
        if (this.getWindowAgentsManager().getMainProcess().getMainProcessMode() === "desktop") {
            // Record<string, string[]>
            this.sendFromMainProcess("show-about-tdm",
                {
                    info: generateAboutInfo()
                }
            )
        }
    }

    setTitle = (newTitle: string) => {
        const browserWindow = this.getBrowserWindow();
        if (browserWindow !== undefined) {
            browserWindow.setTitle(newTitle);
        }
    }

    getTitle = () => {
        const browserWindow = this.getBrowserWindow();
        if (browserWindow !== undefined) {
            return browserWindow.getTitle();
        } else {
            return "";
        }
    }

    getWindowName = () => {
        return "Main Window";
    }

    getTdlFileName = () => {
        return this.getWindowName();
    }

    // ---------------------- thumbnail -----------------------------

    takeThumbnail = async () => {
        let thumbnail = "";
        try {
            const browserWindow = this.getBrowserWindow();
            if (browserWindow instanceof BrowserWindow) {
                const webContents = browserWindow.webContents;
                thumbnail = await new Promise((resolve, reject) => {
                    webContents.capturePage().then((image: Electron.NativeImage) => {
                        const size = image.getSize();
                        let resizedImage: any = image;
                        if (size.height > size.width) {
                            resizedImage = image.resize({
                                height: 100,
                            });
                        } else {
                            resizedImage = image.resize({
                                width: 100,
                            });
                        }
                        const imageBuffer = resizedImage.toPNG();
                        const imageBase64 = imageBuffer.toString("base64");
                        resolve(`data:image/png;base64,${imageBase64}`);
                        // const displayWindowId = this.getId();
                        // if (this.readyToClose === false) {
                        //     this.updateThumbnail(displayWindowId, `data:image/png;base64,${imageBase64}`, windowName, tdlFileName);
                        // }
                    });
                })
            }
        } catch (e) {
            // ! When the app quits, it may cause an unexpected error that pops up in GUI.
            // ! The worst part is I cannot catch it, as it happens in the worker thread.
            // Log.error("0", e);
        }
        return thumbnail
    };

    // ---------------------- process info ---------------------------
    getProcessInfo = async (withThumbnail: boolean) => {
        const isPreloaded = "No";

        const webContents = this.getWebContents();
        let pid = -1;
        if (webContents !== undefined) {
            pid = webContents.getOSProcessId();
        }

        let usage = {
            "CPU usage [%]": -1,
            "Memory usage [MB]": -1,
            "Uptime [s]": -1,
        }
        if (pid !== -1) {
            usage = await new Promise<{
                "CPU usage [%]": number,
                "Memory usage [MB]": number,
                "Uptime [s]": number,
            }>((resolve, reject) => {
                pidusage(pid, (err: any, stats: any) => {
                    if (err) {
                        resolve({
                            "CPU usage [%]": -1,
                            "Memory usage [MB]": -1,
                            "Uptime [s]": -1,
                        });
                    } else {
                        resolve({
                            "CPU usage [%]": stats["cpu"],
                            "Memory usage [MB]": Math.round(stats["memory"] / 1024 / 1024),
                            "Uptime [s]": Math.round(stats["elapsed"] / 1000),
                        })
                    }
                })
            })
        }

        let thumbnail = "";
        if (withThumbnail === true) {
            thumbnail = await this.takeThumbnail();
        }

        // embedded display is webpage-like, cannot be edited, not in the scope of electron.js renderer process system
        const result = {
            "Type": "Main Window",
            "Window ID": this.getId(),
            "Visible": "Yes",
            "TDL file name": "Not available",
            "Window name": this.generateWindowTitle(),
            "Editable": "No",
            "Uptime [second]": usage["Uptime [s]"],
            "Process ID": pid,
            "CPU usage [%]": usage["CPU usage [%]"],
            "Memory usage [MB]": usage["Memory usage [MB]"],
            "Thumbnail": thumbnail,
            "Script": "",
            "Script PID": "N/A",
        };
        return result;
    }

    close = () => {
        const browserWindow = this.getBrowserWindow();
        if (browserWindow instanceof BrowserWindow) {
            browserWindow.close();
        } else {
            Log.error("0", `Error: cannot close window ${this.getId()}`);
        }
    };


}
