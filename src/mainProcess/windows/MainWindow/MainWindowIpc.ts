import { Log } from "../../../common/Log";
import { IpcEventArgType3 } from "../../../common/IpcEventArgType";
import { MainWindowAgent } from "./MainWindowAgent";

export class MainWindowIpc {
    private readonly _mainWindowAgent: MainWindowAgent;
    private _websocketIpcConnectedResolve: any;
    private _websocketIpcConnectedReject: any;
    private _websocketIpcConnectedPromise: Promise<string>;

    constructor(mainWindowAgent: MainWindowAgent) {
        this._mainWindowAgent = mainWindowAgent;
        this._websocketIpcConnectedPromise = new Promise((resolve, reject) => {
            this._websocketIpcConnectedResolve = resolve;
            this._websocketIpcConnectedReject = reject;
        });
    }

    sendFromMainProcess = <T extends keyof IpcEventArgType3>(channel: T, arg: IpcEventArgType3[T]): void => {
        const mainWindowAgent = this.getMainWindowAgent();
        const ipcManagerOnMainProcesses = mainWindowAgent.getWindowAgentsManager().getMainProcess().getIpcManager();
        const mainProcessMode = mainWindowAgent.getWindowAgentsManager().getMainProcess().getMainProcessMode();

        if (mainProcessMode === "ssh-server") {
            const sshServer = ipcManagerOnMainProcesses.getSshServer();
            if (sshServer !== undefined) {
                sshServer.sendToTcpClient(JSON.stringify({ processId: "0", windowId: mainWindowAgent.getId(), eventName: channel, data: [arg] }));
            }
            return;
        }

        const wsClient = ipcManagerOnMainProcesses.getClients()[mainWindowAgent.getId()];

        if (wsClient === undefined) {
            Log.error("0", "Cannot find WebSocket IPC client for window", mainWindowAgent.getId());
            return;
        }

        try {
            if (typeof wsClient !== "string") {
                wsClient.send(JSON.stringify({ processId: "0", windowId: mainWindowAgent.getId(), eventName: channel, data: [arg] }));
            }
        } catch (e) {
            Log.error("0", e);
        }
    };

    getWebsocketIpcConnectedResolve = () => {
        return this._websocketIpcConnectedResolve;
    };

    setWebsocketIpcConnectedResolve = (newResolve: any) => {
        this._websocketIpcConnectedResolve = newResolve;
    };

    getWebsocketIpcConnectedReject = () => {
        return this._websocketIpcConnectedReject;
    };

    setWebsocketIpcConnectedReject = (newReject: any) => {
        this._websocketIpcConnectedReject = newReject;
    };

    getWebsocketIpcConnectedPromise = () => {
        return this._websocketIpcConnectedPromise;
    };

    setWebsocketIpcConnectedPromise = (newPromise: Promise<string>) => {
        this._websocketIpcConnectedPromise = newPromise;
    };

    getMainWindowAgent = () => {
        return this._mainWindowAgent;
    };
}
