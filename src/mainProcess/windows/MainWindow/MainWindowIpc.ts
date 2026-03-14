import { Log } from "../../../common/Log";
import { IpcEventArgType3 } from "../../../common/IpcEventArgType";
import { MainWindowAgent } from "./MainWindowAgent";

export class MainWindowIpc {
    private readonly _mainWindowAgent: MainWindowAgent;

    constructor(mainWindowAgent: MainWindowAgent) {
        this._mainWindowAgent = mainWindowAgent;
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
            Log.error("Cannot find WebSocket IPC client for window", mainWindowAgent.getId());
            return;
        }

        try {
            if (typeof wsClient !== "string") {
                wsClient.send(JSON.stringify({ processId: "0", windowId: mainWindowAgent.getId(), eventName: channel, data: [arg] }));
            }
        } catch (e) {
            Log.error(e);
        }
    };
    
    getMainWindowAgent = () => {
        return this._mainWindowAgent;
    };
}
