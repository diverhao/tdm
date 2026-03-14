import { BrowserWindow, WebContents } from "electron";
import * as path from "path";
import * as url from "url";
import { Log } from "../../../common/Log";
import { MainWindowAgent } from "./MainWindowAgent";

export class MainWindowLifeCycleManager {
    private readonly _mainWindowAgent: MainWindowAgent;
    private _browserWindow: BrowserWindow | undefined;
    private _readyToClose = false;
    private _loadURLPromise: Promise<void> | undefined = undefined;

    constructor(mainWindowAgent: MainWindowAgent) {
        this._mainWindowAgent = mainWindowAgent;
    }

    /**
     * Creates the main window for desktop and ssh-client modes, or sends the web client
     * bootstrap HTML when running in web mode.
     *
     * @param httpResponse Optional HTTP response used to return the web client page in web mode.
     */
    createBrowserWindow = async (httpResponse: any = undefined) => {
        const mainWindowAgent = this.getMainWindowAgent();
        const windowAgentsManager = mainWindowAgent.getWindowAgentsManager();
        const mainProcesMode = windowAgentsManager.getMainProcess().getMainProcessMode();

        if (mainProcesMode === "ssh-server") {
            return;
        }

        if (mainProcesMode === "ssh-client" || mainProcesMode === "desktop") {
            const windowOptions: Electron.BrowserWindowConstructorOptions = {
                width: 1000,
                height: 800,
                backgroundColor: `rgb(255, 255, 255)`,
                title: mainWindowAgent.generateWindowTitle(),
                resizable: true,
                frame: true,
                autoHideMenuBar: true,
                minWidth: 200,
                minHeight: 100,
                show: true,
                icon: path.join(__dirname, "../../../common/resources/webpages/tdm-logo.png"),
                webPreferences: {
                    preload: path.join(__dirname, "preload.js"),
                    nodeIntegration: true,
                    contextIsolation: true,
                    nodeIntegrationInWorker: true,
                    sandbox: false,
                    webviewTag: true,
                    backgroundThrottling: false,
                    webSecurity: false,
                    defaultFontFamily: {
                        standard: "Arial",
                    },
                },
            };
            const window = new BrowserWindow(windowOptions);

            this.setBrowserWindow(window);
            window.setMenu(null);

            windowAgentsManager.setDockMenu();

            window.on("closed", this.handleWindowClosed);
            window.on("close", (event: any) => {
                this.handleWindowClose(event);
            });

            const ipcServerPort = windowAgentsManager.getMainProcess().getIpcManager().getPort();
            const hostname = windowAgentsManager.getMainProcess().getMainProcessMode() === "desktop"
                ? "127.0.0.1"
                : "ABCD";

            this.setLoadURLPromise(window.loadURL(
                url.format({
                    pathname: path.join(__dirname, "MainWindow.html"),
                    protocol: "file:",
                    slashes: true,
                    query: {
                        ipcServerPort: `${ipcServerPort}`,
                        mainWindowId: `${mainWindowAgent.getId()}`,
                        hostname: `${hostname}`,
                    },
                }),
            ));
            
            await this.getLoadURLPromise();
            await mainWindowAgent.getMainWindowIpc().getWebsocketIpcConnectedPromise();
            return;
        }

        if (mainProcesMode === "web") {
            const ipcServerPort = windowAgentsManager.getMainProcess().getIpcManager().getPort();

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
                            new window.MainWindowClientClass("${mainWindowAgent.getId()}", ${ipcServerPort});
                        </script>
                    </body>
                </html>
                `,
            );
            return;
        }

        Log.error("Wrong main process mode");
    };

    getWebContents = (): WebContents | undefined => {
        const browserWindow = this.getBrowserWindow();
        if (browserWindow === undefined) {
            return undefined;
        }
        return browserWindow.webContents;
    };

    handleWindowClosed = () => {
        const mainWindowAgent = this.getMainWindowAgent();
        const windowAgentsManager = mainWindowAgent.getWindowAgentsManager();

        Log.info("close main window", mainWindowAgent.getId());
        windowAgentsManager.removeAgent(mainWindowAgent.getId());

        const hasPreloadedBrowserWindow = windowAgentsManager.preloadedDisplayWindowAgent === undefined ? 0 : 1;
        const hasPreviewBrowserWindow = windowAgentsManager.previewDisplayWindowAgent === undefined ? 0 : 1;
        const numBrowserWindows = Object.keys(windowAgentsManager.getAgents()).length;

        if (numBrowserWindows - hasPreloadedBrowserWindow - hasPreviewBrowserWindow <= 0) {
            const mainProcessMode = windowAgentsManager.getMainProcess().getMainProcessMode();
            if (mainProcessMode === "desktop" || mainProcessMode === "ssh-client") {
                windowAgentsManager.getMainProcess().quit();
            }
        }

        const ipcManager = windowAgentsManager.getMainProcess().getIpcManager();
        ipcManager.removeClient(mainWindowAgent.getId());

        windowAgentsManager.setDockMenu();
        this.setBrowserWindow(undefined);
    };

    handleWindowClose = (event: any) => {
        const mainWindowAgent = this.getMainWindowAgent();
        const mainProcess = mainWindowAgent.getWindowAgentsManager().getMainProcess();
        const mainProcessMode = mainProcess.getMainProcessMode();
        if (mainProcessMode === "desktop") {
            return;
        }
        if (mainProcessMode === "ssh-client") {
            if (this.isReadyToClose()) {
                return;
            }
            event.preventDefault();
            this.setReadyToClose(true);
            mainWindowAgent.sendFromMainProcess("window-will-be-closed", {});
        }
    };

    show = () => {
        const browserWindow = this.getBrowserWindow();
        if (browserWindow === undefined) {
            Log.error("Main window does not exist, nothing to pop up");
            return;
        }
        browserWindow.show();
    };

    focus = () => {
        const mainWindowAgent = this.getMainWindowAgent();
        if (mainWindowAgent.getWindowAgentsManager().getMainProcess().getMainProcessMode() === "ssh-server") {
            return;
        }
        const browserWindow = this.getBrowserWindow();
        if (browserWindow instanceof BrowserWindow) {
            if (browserWindow.isMinimized()) {
                browserWindow.restore();
            }
            browserWindow.focus();
        } else {
            Log.error("Main window does not exist, nothing to pop up");
        }
    };

    close = () => {
        const mainWindowAgent = this.getMainWindowAgent();
        const browserWindow = this.getBrowserWindow();
        if (browserWindow instanceof BrowserWindow) {
            browserWindow.close();
        } else {
            Log.error(`Error: cannot close window ${mainWindowAgent.getId()}`);
        }
    };

    getBrowserWindow = () => {
        return this._browserWindow;
    };

    setBrowserWindow = (newBrowserWindow: BrowserWindow | undefined) => {
        this._browserWindow = newBrowserWindow;
    };

    isReadyToClose = () => {
        return this._readyToClose;
    };

    setReadyToClose = (readyToClose: boolean) => {
        this._readyToClose = readyToClose;
    };

    getLoadURLPromise = () => {
        return this._loadURLPromise;
    };

    setLoadURLPromise = (newLoadURLPromise: Promise<void> | undefined) => {
        this._loadURLPromise = newLoadURLPromise;
    };

    getMainWindowAgent = () => {
        return this._mainWindowAgent;
    };
}
