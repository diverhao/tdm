import { BrowserWindow, Menu, MenuItem, app } from "electron";
import * as path from "path";
import * as url from "url";
import { IpcEventArgType } from "../../../common/IpcEventArgType";
import { DisplayWindowAgent } from "../../windows/DisplayWindow/DisplayWindowAgent";
import { showDisplayWindowError } from "../../ipc/WindowMessageBox";
import { Log } from "../../../common/Log";

/**
 * when we close the window:
 *
 *  [User clicks window close button]
 *                 |
 *                 v
 *       [BrowserWindow emits "close"]
 *                 |
 *                 v
 * [Main process sends "window-will-be-closed" to renderer]
 *                 |
 *                 v
 *  [Renderer checks: any side effects needed (save data)?]
 *           /                          \
 *         No                            Yes
 *         |                              |
 *         v                              v
 * [Send "window-will-be-closed-   [Show save prompt immediately:
 *  user-select" with                 Save / Don't Save / Cancel]
 *  select="don't save"]                      |
 *         |                                  |
 *         v                                  v
 *  [Main closes window]        +--------------------------------------+
 *                              | Save: send "window-will-be-closed-   |
 *                              | user-select" with                    |
 *                              | select="save" + fileName +           |
 *                              | fileContent + dataType               |
 *                              +--------------------------------------+
 *                              | Don't Save: send same event with     |
 *                              | select="don't save"                  |
 *                              +--------------------------------------+
 *                              | Cancel: send same event with         |
 *                              | select="cancel"                      |
 *                              +--------------------------------------+
 */
export class DisplayWindowLifeCycleManager {

    private _displayWindowAgent: DisplayWindowAgent;
    private _readyToClose = false;

    constructor(displayWindowAgent: DisplayWindowAgent) {
        this._displayWindowAgent = displayWindowAgent;
    }

    createBrowserWindow = async (options: any = {}) => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        const mainProcessMode = displayWindowAgent.getWindowAgentsManager().getMainProcess().getMainProcessMode();
        if (mainProcessMode === "ssh-server") {
            await this.createBrowserWindowInSshSeverMode(options);
        } else if (mainProcessMode === "ssh-client" || mainProcessMode === "desktop") {
            await this.createBrowserWindowInDesktopMode(options);
        } else if (mainProcessMode === "web") {
            await this.createBrowserWindowInWebMode(options);
        }
    };

    private createBrowserWindowInDesktopMode = async (options: any = {}) => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        const canvasWidgetTdl = displayWindowAgent.getTdl().Canvas;
        let windowName = canvasWidgetTdl?.windowName;
        let title = windowName;
        if (title === undefined || title.trim() === "") {
            if (displayWindowAgent.getTdlFileName().trim() !== "") {
                title = displayWindowAgent.getTdlFileName();
            } else {
                title = displayWindowAgent.getId();
            }
        }

        let modal = false;

        let parent: undefined | BrowserWindow = undefined;
        const utilityOptions = options["utilityOptions"];
        const utilityType = options["utilityType"];
        if (utilityOptions !== undefined && utilityType === "FileBrowser") {
            if (utilityOptions["parentDisplayWindowId"] !== undefined) {
                const parentDisplayWindowAgent = displayWindowAgent.getWindowAgentsManager().getAgent(utilityOptions["parentDisplayWindowId"]);
                if (parentDisplayWindowAgent instanceof DisplayWindowAgent) {
                    parent = parentDisplayWindowAgent.getBrowserWindow();
                    modal = true;
                }
            }
        }
        const windowOptions: Electron.BrowserWindowConstructorOptions = {
            width: 800,
            height: 500,
            backgroundColor: `rgb(255, 255, 255)`,
            title: `${title}`,
            resizable: true,
            autoHideMenuBar: true,
            minWidth: 100,
            minHeight: 100,
            modal: modal,
            parent: parent,
            frame: true,
            show: !displayWindowAgent.hiddenWindow,
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
        try {
            app.focus({ steal: true });
            const window = new BrowserWindow(windowOptions);
            displayWindowAgent.setBrowserWindow(window);
            window.webContents.setWindowOpenHandler(({ url }: any) => {
                Log.debug("0", `open new window ${url}`);
                return { action: "allow" };
            });

            window.on("closed", displayWindowAgent.handleWindowClosed);
            window.on("close", (event: Electron.Event) => {
                if (this.isReadyToClose() === false) {
                    this.setReadyToClose(true);
                    event.preventDefault();
                    displayWindowAgent.handleWindowClose();
                }
            });

            window.webContents.on("context-menu", (_: any, props: any) => {
                const menu = new Menu();
                if (props.isEditable) {
                    menu.append(new MenuItem({ label: "Cut", role: "cut" }));
                    menu.append(new MenuItem({ label: "Copy", role: "copy" }));
                    menu.append(new MenuItem({ label: "Paste", role: "paste" }));
                    menu.append(new MenuItem({ label: "mergeAllWindows", role: "mergeAllWindows" }));
                    menu.popup();
                }
            });
            window.once("ready-to-show", () => {
                window.webContents.setZoomFactor(1);
            });

            const ipcServerPort = displayWindowAgent.getWindowAgentsManager().getMainProcess().getIpcManager().getPort();
            const hostname = displayWindowAgent.getWindowAgentsManager().getMainProcess().getMainProcessMode() === "desktop"
                ? "127.0.0.1"
                : displayWindowAgent.getWindowAgentsManager().getMainProcess().getSshClient()?.getServerIP();
            await window.loadURL(
                url.format({
                    pathname: path.join(__dirname, "DisplayWindow.html"),
                    protocol: "file:",
                    slashes: true,
                    query: {
                        ipcServerPort: `${ipcServerPort}`,
                        displayWindowId: `${displayWindowAgent.getId()}`,
                        hostname: `${hostname}`,
                    },
                })
            );
        } catch (e) {
            Log.error(e);
        }
    };

    private createBrowserWindowInSshSeverMode = async (options: any = {}) => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        const sshServer = displayWindowAgent.getWindowAgentsManager().getMainProcess().getIpcManager().getSshServer();
        if (sshServer !== undefined) {
            options["windowId"] = displayWindowAgent.getId();
            sshServer.sendToTcpClient(JSON.stringify({ command: "create-display-window-step-2", data: options }));
        }
    };

    private createBrowserWindowInWebMode = async (options: any = {}) => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        if (options["windowId"] !== undefined) {
            const initiatedByWindowAgent = displayWindowAgent.getWindowAgentsManager().getAgent(options["windowId"]);
            if (initiatedByWindowAgent instanceof DisplayWindowAgent) {
                initiatedByWindowAgent.sendFromMainProcess("display-window-id-for-open-tdl-file", {
                    displayWindowId: displayWindowAgent.getId(),
                });
            }
        }
    };

    close = () => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        const browserWindow = displayWindowAgent.getBrowserWindow();

        if (browserWindow instanceof BrowserWindow) {
            browserWindow.close();
        } else {
            Log.error("0", `Error: cannot close window ${displayWindowAgent.getId()}`);
        }
    };

    /**
     * when a window is closed, normally just close it.
     * 
     * However, for some special windows, there are more need to be done: which is save the data.
     * 
     * These windows are
     *  - TextEditor utility window
    *  - DataViewer utility window
     *  - modified display window
     */
    handleWindowWillBeClosedUserSelect = (data: IpcEventArgType["window-will-be-closed-user-select"]) => {
        const {
            displayWindowId,
            widgetKey,
            select,
            fileName,
            fileContent,
            dataType,
        } = data;


        const displayWindowAgent = this.getDisplayWindowAgent();
        if (!(displayWindowAgent instanceof DisplayWindowAgent)) {
            Log.error("0", `Cannot handle "window-will-be-closed": invalid displayWindowAgent for displayWindowId=${displayWindowId}`);
            return
        }
        if (select === "don't save") {
            // close immediately
            this.closeBrowserWindow();
            return;
        }

        if (select === "cancel") {
            this.setReadyToClose(false);
            return;
        }

        const browserWindow = displayWindowAgent.getBrowserWindow();
        const windowAgentsManager = displayWindowAgent.getWindowAgentsManager();
        const mainProcessMode = windowAgentsManager.getMainProcess().getMainProcessMode();
        const isRegularDisplayWindow = mainProcessMode === "ssh-server"
            ? windowAgentsManager.preloadedDisplayWindowAgent !== displayWindowAgent
            : browserWindow instanceof BrowserWindow && windowAgentsManager.preloadedDisplayWindowAgent !== displayWindowAgent;

        if (!isRegularDisplayWindow) {
            Log.error("You are trying to close a non-regular window", displayWindowId);
            return;
        }

        const displayWindowFile = displayWindowAgent.getDisplayWindowFile();
        if (mainProcessMode === "desktop") {
            const failedReason = displayWindowFile.saveFileInDesktopMode(dataType, fileName, fileContent);
            if (failedReason === "") {
                this.closeBrowserWindow();
            } else if (failedReason === "No file selected") {
                this.setReadyToClose(false);
            } else {
                showDisplayWindowError(displayWindowAgent, [failedReason]);
                Log.error("0", failedReason);
                this.setReadyToClose(false);
            }
            return;
        } else if (mainProcessMode === "web") {
            // todo: should be able to save
            const failedReason = "Cannot save file in web mode";
            showDisplayWindowError(displayWindowAgent, [failedReason]);
            Log.error("0", failedReason, displayWindowId);
            this.setReadyToClose(false);
            return;
        } else if (mainProcessMode === "ssh-server") {
            const result = displayWindowFile.saveFileInSshServerMode(data);
            if (result === "") {
                this.closeBrowserWindow();
            } else if (result !== "prompted") {
                showDisplayWindowError(displayWindowAgent, [result]);
                Log.error("0", result);
                this.setReadyToClose(false);
            }
            return;
        } else {
            Log.error("0", `Unexpected main process mode while closing display window: ${mainProcessMode}`, displayWindowId);
        }

    };

    closeBrowserWindow = () => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        const mainProcessMode = displayWindowAgent.getWindowAgentsManager().getMainProcess().getMainProcessMode();

        // the DisplayWindowAgent.handleWindowClosed() won't e called
        displayWindowAgent.getDisplayWindowLifeCycleManager().setReadyToClose(true);
        const displayWindowId = displayWindowAgent.getId();
        if (mainProcessMode === "desktop") {
            this.closeBrowserWindowInDesktopMode();
        } else if (mainProcessMode === "ssh-server") {
            this.closeBrowserWindowInSshServerMode();
        } else {
            Log.error("0", `Cannot close browser window: unsupported main process mode ${mainProcessMode} for displayWindowId=${displayWindowId}`);
        }
    }

    closeBrowserWindowInDesktopMode = () => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        const browserWindow = displayWindowAgent.getBrowserWindow();
        const displayWindowId = displayWindowAgent.getId();

        if (browserWindow !== undefined) {
            browserWindow.webContents.close();
        } else {
            Log.error("0", `Cannot close browser window in desktop mode: browserWindow is undefined for displayWindowId=${displayWindowId}`);
        }
    }

    closeBrowserWindowInSshServerMode = () => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        const mainProcessMode = displayWindowAgent.getWindowAgentsManager().getMainProcess().getMainProcessMode();
        const ipcManager = displayWindowAgent.getWindowAgentsManager().getMainProcess().getIpcManager();
        const displayWindowId = displayWindowAgent.getId();
        // (1) clean up the local stuff
        displayWindowAgent.handleWindowClosed();
        // (2) tell the ssh-client to close the window
        const sshServer = ipcManager.getMainProcess().getIpcManager().getSshServer();
        // fs.writeFileSync("/Users/haohao/tdm.log", `window will be closed, tell the ssh-client to close window =====================\n`, { flag: "a" });
        if (sshServer !== undefined) {
            // this is a tcp command, not websocket
            // fs.writeFileSync("/Users/haohao/tdm.log", `window will be closed, tell the ssh-client to close window B =====================\n`, { flag: "a" });
            sshServer.sendToTcpClient(JSON.stringify(
                {
                    command: "close-browser-window",
                    data: {
                        mainProcessId: "0",
                        displayWindowId: displayWindowId,
                    }
                }
            ))
        } else {
            Log.error("0", `Cannot close browser window in ssh-server mode: sshServer is undefined for displayWindowId=${displayWindowId}`);
        }
    };

    // -------------- getters and setters ------------------

    isReadyToClose = () => {
        return this._readyToClose;
    };

    setReadyToClose = (readyToClose: boolean) => {
        this._readyToClose = readyToClose;
    };

    getDisplayWindowAgent = () => {
        return this._displayWindowAgent;
    };

}
