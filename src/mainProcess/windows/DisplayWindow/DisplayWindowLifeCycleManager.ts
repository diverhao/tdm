import { BrowserWindow, Menu, MenuItem, app } from "electron";
import * as path from "path";
import * as url from "url";
import { IpcEventArgType } from "../../../common/IpcEventArgType";
import { DisplayWindowAgent } from "../../windows/DisplayWindow/DisplayWindowAgent";
import { Log } from "../../../common/Log";
import { type_tdl } from "../../../common/GlobalVariables";

/**
 * when we create a display window
 * 
 * mostly starts from 
 * 
 */

/**
 * 
 * when we close the display window:
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
    private _browserWindow: BrowserWindow | undefined;
    private _hiddenWindow = false;
    private _readyToClose = false;

    /**
     * One-shot resolver for the promise that blocks window startup until the
     * renderer connects to the main-process WebSocket IPC channel.
     */
    websocketIpcConnectedResolve: ((value?: unknown) => void) | undefined = undefined;
    websocketIpcConnectedPromise: Promise<unknown> | undefined = undefined;

    /**
     * One-shot resolver for the promise that waits until the renderer finishes
     * the first render of a newly loaded TDL and reports its resolved metadata.
     */
    newTdlRenderedResolve: ((data: { windowName: string, tdlFileName: string }) => void) | undefined = undefined;

    constructor(displayWindowAgent: DisplayWindowAgent) {
        this._displayWindowAgent = displayWindowAgent;
    }

    // ---------------------- window creation and initialization --------------

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

        // wait for IPC websocket connected, then send the basic info and tdl
        this.websocketIpcConnectedPromise = new Promise((resolve, reject) => {
            this.websocketIpcConnectedResolve = resolve;
        });
        await this.websocketIpcConnectedPromise;
        this.sendBasicDisplayWindowInfo();
        await this.updateTdl();
    };

    updateTdl = async () => {
        this.sendNewTdl();
        // wait for new-tdl-rendered, it means the GUI is done
        const { windowName, tdlFileName } = await new Promise<{ windowName: string, tdlFileName: string }>((resolve, reject) => {
            this.newTdlRenderedResolve = resolve;
        });
        this.setupWindowAfterTdlRendered(windowName, tdlFileName);
    }

    private setupWindowAfterTdlRendered = async (windowName: string, tdlFileName: string) => {

        const displayWindowAgent = this.getDisplayWindowAgent();
        const windowAgentsManager = displayWindowAgent.getWindowAgentsManager();
        const mainProcess = this.getDisplayWindowAgent().getWindowAgentsManager().getMainProcess();

        // ignore the preloaded display window's new TDL, and ignore the iframe embedded display
        if (displayWindowAgent !== windowAgentsManager.preloadedDisplayWindowAgent
            && displayWindowAgent !== windowAgentsManager.previewDisplayWindowAgent
            && displayWindowAgent.getBrowserWindow() !== undefined) {
            displayWindowAgent.show();
            // displayWindowAgent.setTdlFileName(tdlFileName);
            displayWindowAgent.setWindowName(windowName);

            // regular display window: start to take thumnail now, 1 s later, 3 s later, and every 5 s
            // if not an embedded window, take a thumbnail
            // take thumbnail only for regular window, not for embedded window
            // pre-loaded display does not take thumbnail
            displayWindowAgent.startThumbnailInterval();

            displayWindowAgent.takeThumbnail(windowName, tdlFileName);
            setTimeout(() => {
                displayWindowAgent.takeThumbnail(windowName, tdlFileName);
            }, 1000);
            setTimeout(() => {
                displayWindowAgent.takeThumbnail(windowName, tdlFileName);
            }, 3000);
            // send local font names to display window
            displayWindowAgent.sendFromMainProcess("local-font-names",
                {
                    localFontNames: mainProcess.getLocalFontNames()
                }
            );

            mainProcess.getWindowAgentsManager().setDockMenu();
        } else if (displayWindowAgent === windowAgentsManager.previewDisplayWindowAgent) {
            await displayWindowAgent.takeThumbnail();
            const tdlFileName = displayWindowAgent.getTdlFileName();
            const fileBrowserDisplayWindowId = displayWindowAgent.getForFileBrowserWindowId();
            const fileBrowserWidgetKey = displayWindowAgent.getForFileBrowserWidgetKey();
            if (fileBrowserDisplayWindowId !== "" && fileBrowserWidgetKey !== "") {
                const fileBrowserDisplayWindowAgent = windowAgentsManager.getAgent(fileBrowserDisplayWindowId);
                if (fileBrowserDisplayWindowAgent instanceof DisplayWindowAgent) {
                    fileBrowserDisplayWindowAgent.sendFromMainProcess("fetch-thumbnail", {
                        widgetKey: fileBrowserWidgetKey,
                        tdlFileName: tdlFileName,
                        image: displayWindowAgent.getThumbnail(),
                    });
                    displayWindowAgent.setForFileBrowserWindowId("");
                    displayWindowAgent.setForFileBrowserWidgetKey("");
                }
            }
        }

    }

    private sendBasicDisplayWindowInfo = () => {
        const mainProcess = this.getDisplayWindowAgent().getWindowAgentsManager().getMainProcess();
        const displayWindowAgent = this.getDisplayWindowAgent();

        const selectedProfile = mainProcess.getProfiles().getSelectedProfile();
        if (selectedProfile === undefined) {
            Log.error("Profile not selected!");
            return undefined;
        }

        displayWindowAgent.sendFromMainProcess("selected-profile-contents",
            {
                contents: selectedProfile.getContents()
            }
        );
        const site = mainProcess.getSite();
        displayWindowAgent.sendFromMainProcess("site-info", { site: site });
    }

    private sendNewTdl = () => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        const tdl = displayWindowAgent.getTdl() as type_tdl;
        const tdlFileName = displayWindowAgent.getTdlFileName();
        const mode = displayWindowAgent.getInitialMode();
        const editable = displayWindowAgent.isEditable();
        const macros = displayWindowAgent.getMacros();
        const replaceMacros = displayWindowAgent.getReplaceMacros();
        const utilityType = displayWindowAgent.getUtilityType();
        const utilityOptions = displayWindowAgent.getUtilityOptions();

        displayWindowAgent.sendFromMainProcess("new-tdl", {
            newTdl: tdl,
            tdlFileName: tdlFileName,
            initialModeStr: mode,
            editable: editable,
            externalMacros: macros,
            useExternalMacros: replaceMacros,
            utilityType: utilityType as any, //options["utilityType"] as any,
            utilityOptions: utilityOptions === undefined ? {} : utilityOptions, //options["utilityOptions"] === undefined ? {} : options["utilityOptions"],
        });
    }

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
            show: !this.isHiddenWindow(),
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
            this.setBrowserWindow(window);
            window.webContents.setWindowOpenHandler(({ url }: any) => {
                Log.debug(`open new window ${url}`);
                return { action: "allow" };
            });

            window.on("closed", this.handleWindowClosed);
            window.on("close", (event: Electron.Event) => {
                if (this.isReadyToClose() === false) {
                    this.setReadyToClose(true);
                    event.preventDefault();
                    this.handleWindowClose();
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

    // webpage window, not web-mode window
    createWebBrowserWindow = async (url: string) => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        const mainProcessMode = displayWindowAgent.getWindowAgentsManager().getMainProcess().getMainProcessMode();
        if (mainProcessMode === "ssh-server") {
            const sshServer = displayWindowAgent.getWindowAgentsManager().getMainProcess().getIpcManager().getSshServer();
            if (sshServer !== undefined) {
                sshServer.sendToTcpClient(JSON.stringify({ command: "create-web-display-window-step-2", data: { url: url, displayWindowId: displayWindowAgent.getId() } }));
            }
            return;
        }

        const windowOptions = {
            width: 1200,
            height: 1100,
            backgroundColor: `rgb(255, 255, 255)`,
            title: "TDM Display Window",
            resizable: true,
            frame: true,
            autoHideMenuBar: true,
            minWidth: 200,
            minHeight: 100,
            show: true,
            webPreferences: {},
        };
        const window = new BrowserWindow(windowOptions);
        this.setBrowserWindow(window);

        await window.loadURL(url);

        window.on("closed", this.handleWindowClosed);

        const menu = new Menu();
        menu.append(
            new MenuItem({
                label: "Back",
                click: () => {
                    if (window.webContents.canGoBack()) {
                        window.webContents.goBack();
                    }
                },
            })
        );
        menu.append(
            new MenuItem({
                label: "Forward",
                click: () => {
                    if (window.webContents.canGoForward()) {
                        window.webContents.goForward();
                    }
                },
            })
        );
        menu.append(
            new MenuItem({
                label: "Reload",
                click: () => {
                    window.webContents.reloadIgnoringCache();
                },
            })
        );
        menu.append(
            new MenuItem({
                label: "Copy",
                click: () => {
                    window.webContents.copy();
                },
            })
        );
        menu.append(
            new MenuItem({
                label: "Paste",
                click: () => {
                    window.webContents.paste();
                },
            })
        );

        window.webContents.on("context-menu", (event: any) => {
            event.preventDefault();
            menu.popup();
        });
    };

    // ----------------------- window close ------------------

    close = () => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        const browserWindow = this.getBrowserWindow();

        if (browserWindow instanceof BrowserWindow) {
            browserWindow.close();
        } else {
            Log.error(`Error: cannot close window ${displayWindowAgent.getId()}`);
        }
    };

    handleWindowClose = () => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        if (displayWindowAgent.getWindowAgentsManager().preloadedDisplayWindowAgent === displayWindowAgent) {
            this.getBrowserWindow()?.webContents.close();
            Log.error(`You are trying to close a preloaded display window or preloaded embedded display`);
            return;
        }
        displayWindowAgent.sendFromMainProcess("window-will-be-closed", {});
    };

    handleWindowClosed = () => {
        const displayWindowAgent = this.getDisplayWindowAgent();

        Log.info("close display window", displayWindowAgent.getId());
        displayWindowAgent.getDisplayWindowChannelsManager().handleWindowClosed();
        displayWindowAgent.getWindowAgentsManager().removeAgent(displayWindowAgent.getId());
        displayWindowAgent.getDisplayWindowUtilities().handleWindowClosed();

        displayWindowAgent.terminateWebSocketClientThread();

        const hasPreloadedBrowserWindow = displayWindowAgent.getWindowAgentsManager().preloadedDisplayWindowAgent === undefined ? 0 : 1;
        const hasPreviewBrowserWindow = displayWindowAgent.getWindowAgentsManager().previewDisplayWindowAgent === undefined ? 0 : 1;
        const numBrowserWindows = Object.keys(displayWindowAgent.getWindowAgentsManager().getAgents()).length;

        if (numBrowserWindows - hasPreloadedBrowserWindow - hasPreviewBrowserWindow <= 0) {
            const mainProcessMode = displayWindowAgent.getWindowAgentsManager().getMainProcess().getMainProcessMode();
            if (mainProcessMode === "desktop" || mainProcessMode === "ssh-client") {
                displayWindowAgent.getWindowAgentsManager().getMainProcess().quit();
            }
        }

        this.websocketIpcConnectedResolve?.();

        const ipcManager = displayWindowAgent.getWindowAgentsManager().getMainProcess().getIpcManager();
        ipcManager.removeClient(displayWindowAgent.getId());

        const mainProcess = displayWindowAgent.getWindowAgentsManager().getMainProcess();
        const caSnooperServer = mainProcess.getCaSnooperServer();
        if (caSnooperServer !== undefined) {
            caSnooperServer.stopCaSnooperServer(displayWindowAgent.getId());
        }
        const caswServer = mainProcess.getCaswServer();
        if (caswServer !== undefined) {
            caswServer.stopCaswServer(displayWindowAgent.getId());
        }

        displayWindowAgent.getWindowAgentsManager().setDockMenu();
        this.setBrowserWindow(undefined);
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
    handleWindowWillBeClosedUserSelect = async (data: IpcEventArgType["window-will-be-closed-user-select"]) => {
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
            Log.error(`Cannot handle "window-will-be-closed": invalid displayWindowAgent for displayWindowId=${displayWindowId}`);
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

        const browserWindow = this.getBrowserWindow();
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

        const success = await displayWindowFile.saveFile(fileName, fileContent, dataType);
        if (success) {
            this.closeBrowserWindow();
        } else {
            this.setReadyToClose(false);
        }
        return;
    };

    closeBrowserWindow = () => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        const mainProcessMode = displayWindowAgent.getWindowAgentsManager().getMainProcess().getMainProcessMode();

        // the DisplayWindowAgent.handleWindowClosed() won't e called
        this.setReadyToClose(true);
        const displayWindowId = displayWindowAgent.getId();
        if (mainProcessMode === "desktop") {
            this.closeBrowserWindowInDesktopMode();
        } else if (mainProcessMode === "ssh-server") {
            this.closeBrowserWindowInSshServerMode();
        } else {
            Log.error(`Cannot close browser window: unsupported main process mode ${mainProcessMode} for displayWindowId=${displayWindowId}`);
        }
    }

    closeBrowserWindowInDesktopMode = () => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        const browserWindow = this.getBrowserWindow();
        const displayWindowId = displayWindowAgent.getId();

        if (browserWindow !== undefined) {
            browserWindow.webContents.close();
        } else {
            Log.error(`Cannot close browser window in desktop mode: browserWindow is undefined for displayWindowId=${displayWindowId}`);
        }
    }

    closeBrowserWindowInSshServerMode = () => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        const mainProcessMode = displayWindowAgent.getWindowAgentsManager().getMainProcess().getMainProcessMode();
        const ipcManager = displayWindowAgent.getWindowAgentsManager().getMainProcess().getIpcManager();
        const displayWindowId = displayWindowAgent.getId();
        // (1) clean up the local stuff
        this.handleWindowClosed();
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
            Log.error(`Cannot close browser window in ssh-server mode: sshServer is undefined for displayWindowId=${displayWindowId}`);
        }
    };

    // ------------------------- window appearance -------------------

    show = () => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        const browserWindow = this.getBrowserWindow();
        if (browserWindow instanceof BrowserWindow) {
            Log.debug(`Show display window ${displayWindowAgent.getId()} with ${displayWindowAgent.getTdlFileName()}`);
            this.setHiddenWindow(false);
            browserWindow.show();
        } else {
            Log.error(`Error: cannot show window ${displayWindowAgent.getId()}`);
        }
    };

    focus = () => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        const browserWindow = this.getBrowserWindow();
        if (browserWindow instanceof BrowserWindow) {
            if (browserWindow.isMinimized()) {
                browserWindow.restore();
            }
            browserWindow.focus();
        } else {
            Log.error(`Error: cannot focus window ${displayWindowAgent.getId()}`);
        }
    };


    // -------------- getters and setters ------------------

    isReadyToClose = () => {
        return this._readyToClose;
    };

    setReadyToClose = (readyToClose: boolean) => {
        this._readyToClose = readyToClose;
    };

    getBrowserWindow = () => {
        return this._browserWindow;
    };

    setBrowserWindow = (newBrowserWindow: BrowserWindow | undefined) => {
        this._browserWindow = newBrowserWindow;
    };

    isHiddenWindow = () => {
        return this._hiddenWindow;
    };

    setHiddenWindow = (hiddenWindow: boolean) => {
        this._hiddenWindow = hiddenWindow;
    };

    getDisplayWindowAgent = () => {
        return this._displayWindowAgent;
    };

}
