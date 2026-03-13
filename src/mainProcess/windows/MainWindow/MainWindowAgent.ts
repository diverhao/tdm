import { WebContents, BrowserWindow } from "electron";
import { WindowAgentsManager } from "../WindowAgentsManager";
import { IpcEventArgType3 } from "../../../common/IpcEventArgType";
import { MainWindowIpc } from "./MainWindowIpc";
import { MainWindowLifeCycleManager } from "./MainWindowLifeCycleManager";
import { MainWindowUtilities } from "./MainWindowUtilities";

/**
 * Represents the main window on main process. <br>
 *
 * Its ID is always "mainWindow". Each TDM program can have at most one main window.
 */
export class MainWindowAgent {
    private _id: string = "";
    private _windowAgentsManager: WindowAgentsManager;
    private readonly _mainWindowIpc: MainWindowIpc;
    private readonly _mainWindowLifeCycleManager: MainWindowLifeCycleManager;
    private readonly _mainWindowUtilities: MainWindowUtilities;

    constructor(windowAgentsManager: WindowAgentsManager) {
        this._windowAgentsManager = windowAgentsManager;
        this._id = "0";
        this._mainWindowIpc = new MainWindowIpc(this);
        this._mainWindowLifeCycleManager = new MainWindowLifeCycleManager(this);
        this._mainWindowUtilities = new MainWindowUtilities(this);
    }

    get readyToClose(): boolean {
        return this.getMainWindowLifeCycleManager().isReadyToClose();
    }

    set readyToClose(newReadyToClose: boolean) {
        this.getMainWindowLifeCycleManager().setReadyToClose(newReadyToClose);
    }

    get loadURLPromise(): Promise<void> | undefined {
        return this.getMainWindowLifeCycleManager().getLoadURLPromise();
    }

    set loadURLPromise(newLoadURLPromise: Promise<void> | undefined) {
        this.getMainWindowLifeCycleManager().setLoadURLPromise(newLoadURLPromise);
    }

    get websocketIpcConnectedResolve(): any {
        return this.getMainWindowIpc().getWebsocketIpcConnectedResolve();
    }

    set websocketIpcConnectedResolve(newResolve: any) {
        this.getMainWindowIpc().setWebsocketIpcConnectedResolve(newResolve);
    }

    get websocketIpcConnectedReject(): any {
        return this.getMainWindowIpc().getWebsocketIpcConnectedReject();
    }

    set websocketIpcConnectedReject(newReject: any) {
        this.getMainWindowIpc().setWebsocketIpcConnectedReject(newReject);
    }

    get websocketIpcConnectedPromise(): Promise<string> {
        return this.getMainWindowIpc().getWebsocketIpcConnectedPromise();
    }

    set websocketIpcConnectedPromise(newPromise: Promise<string>) {
        this.getMainWindowIpc().setWebsocketIpcConnectedPromise(newPromise);
    }

    // ---------------------- GUI (BrowserWindow) ---------------------------

    generateWindowTitle = () => {
        return this.getMainWindowUtilities().generateWindowTitle();
    };

    /**
     * Create the GUI window. <br>
     * 
     * If this is a SSH server, update the SSH client's main window
     *
     * @returns {Promise<void>} until the GUI window is created and the html file is loaded.
     */
    createBrowserWindow = async (httpResponse: any = undefined) => {
        await this.getMainWindowLifeCycleManager().createBrowserWindow(httpResponse);
    };

    /**
     * Get WebContents for this window <br>
     *
     * @returns {WebContents | undefined} `undefined` if the BrowserWindow or WebContents does not exist.
     */
    getWebContents = (): WebContents | undefined => {
        return this.getMainWindowLifeCycleManager().getWebContents();
    };

    /**
     * Clean up main process after the main window GUI is closed. <br>
     *
     * Invoked when the BrowserWindow receives a "close" event.
     */
    handleWindowClosed = () => {
        this.getMainWindowLifeCycleManager().handleWindowClosed();
    };

    handleWindowClose = (event: any) => {
        this.getMainWindowLifeCycleManager().handleWindowClose(event);
    };

    /**
     * Focus to the main window. The BrowserWindow must exist.
     */
    show = () => {
        this.getMainWindowLifeCycleManager().show();
    };

    focus = () => {
        this.getMainWindowLifeCycleManager().focus();
    };

    showContextMenu = (menu: ("copy" | "cut" | "paste")[]) => {
        this.getMainWindowUtilities().showContextMenu(menu);
    };

    // ---------------------- IPC -----------------------------

    /**
     * Send data from main process to renderer process. This is a process for main window. <br>
     *
     * @param {string} channel Event name
     * @param {any[]} args Data
     */
    // sendFromMainProcess(channel: string, ...args: any[]) {
    sendFromMainProcess = <T extends keyof IpcEventArgType3>(channel: T, arg: IpcEventArgType3[T]): void => {
        this.getMainWindowIpc().sendFromMainProcess(channel, arg);
    };

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
        return this.getMainWindowLifeCycleManager().getBrowserWindow();
    };


    showAboutTdm = () => {
        this.getMainWindowUtilities().showAboutTdm();
    };

    setTitle = (newTitle: string) => {
        this.getMainWindowUtilities().setTitle(newTitle);
    };

    getTitle = () => {
        return this.getMainWindowUtilities().getTitle();
    };

    getWindowName = () => {
        return this.getMainWindowUtilities().getWindowName();
    };

    getTdlFileName = () => {
        return this.getMainWindowUtilities().getTdlFileName();
    };

    // ---------------------- thumbnail -----------------------------

    takeThumbnail = async () => {
        return await this.getMainWindowUtilities().takeThumbnail();
    };

    // ---------------------- process info ---------------------------
    getProcessInfo = async (withThumbnail: boolean) => {
        return await this.getMainWindowUtilities().getProcessInfo(withThumbnail);
    };

    close = () => {
        this.getMainWindowLifeCycleManager().close();
    };

    getMainWindowIpc = () => {
        return this._mainWindowIpc;
    };

    getMainWindowLifeCycleManager = () => {
        return this._mainWindowLifeCycleManager;
    };

    getMainWindowUtilities = () => {
        return this._mainWindowUtilities;
    };
}
