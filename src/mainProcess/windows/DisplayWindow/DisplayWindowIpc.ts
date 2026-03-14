import { WebSocket } from "ws";
import { Log } from "../../../common/Log";
import { IpcEventArgType2 } from "../../../common/IpcEventArgType";
import { DisplayWindowAgent } from "./DisplayWindowAgent";

export class DisplayWindowIpc {

    private readonly _displayWindowAgent: DisplayWindowAgent;
    private _webSocketMonitorClient: WebSocket | undefined;
    private _webSocketMonitorChannelNames: string[] = [];

    constructor(displayWindowAgent: DisplayWindowAgent) {
        this._displayWindowAgent = displayWindowAgent;
    }

    // ------------------------- IPC -------------------------

    sendFromMainProcess = <T extends keyof IpcEventArgType2>(channel: T, arg: IpcEventArgType2[T]): void => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        const ipcManager = displayWindowAgent.getWindowAgentsManager().getMainProcess().getIpcManager();
        const mainProcessMode = displayWindowAgent.getWindowAgentsManager().getMainProcess().getMainProcessMode();

        if (mainProcessMode === "ssh-server") {
            const ipcManagerOnMainProcesses = displayWindowAgent.getWindowAgentsManager().getMainProcess().getIpcManager();
            const sshServer = ipcManagerOnMainProcesses.getSshServer();
            if (sshServer !== undefined) {
                sshServer.sendToTcpClient(JSON.stringify({ processId: "0", windowId: displayWindowAgent.getId(), eventName: channel, data: [arg] }));
            }
            return;
        }

        const wsClient = ipcManager.getClients()[displayWindowAgent.getId()];

        if (wsClient === undefined) {
            Log.debug("Cannot find WebSocket IPC client for window", displayWindowAgent.getId());
            return;
        }

        try {
            Log.debug("send from main process:", { processId: "0", windowId: displayWindowAgent.getId(), eventName: channel, data: [arg] });
            if (typeof wsClient !== "string") {
                const str = JSON.stringify({ processId: "0", windowId: displayWindowAgent.getId(), eventName: channel, data: [arg] });
                wsClient.send(str);
            }

            if (channel === "new-channel-data") {
                const webSocketMonitorClient = this.getWebSocketMonitorClient();
                const webSocketMonitorData: Record<string, any> = {};
                const dbrData = (arg as any)["newDbrData"];
                if (dbrData === undefined) {
                    return;
                }
                if (webSocketMonitorClient !== undefined) {
                    for (const channelName of Object.keys(dbrData)) {
                        if (this.getWebSocketMonitorChannelNames().includes(channelName)) {
                            webSocketMonitorData[channelName] = { ...dbrData[channelName], channelName: channelName };
                        }
                    }
                    if (Object.keys(webSocketMonitorData).length > 0) {
                        webSocketMonitorClient.send(JSON.stringify({ command: "MONITOR", dbrDataObj: webSocketMonitorData }));
                    }
                }
            }
        } catch (e) {
            Log.error(e);
        }
    };

    // ------------------- web socket monitor ------------------

    addWebSocketMonitorChannelName = (newName: string) => {
        this.setWebSocketMonitorChannelNames([...new Set([...this._webSocketMonitorChannelNames, newName])]);
    };

    removeWebSocketMonitorChannels = () => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        for (const channelName of this.getWebSocketMonitorChannelNames()) {
            displayWindowAgent.removeChannel(channelName);
        }
    };

    // ------------------- setters and getters ------------------

    setWebSocketMonitorClient = (webSocketMonitorClient: WebSocket | undefined) => {
        this._webSocketMonitorClient = webSocketMonitorClient;
    };

    getWebSocketMonitorClient = () => {
        return this._webSocketMonitorClient;
    };

    setWebSocketMonitorChannelNames = (newNames: string[]) => {
        this._webSocketMonitorChannelNames = newNames;
    };

    getWebSocketMonitorChannelNames = () => {
        return this._webSocketMonitorChannelNames;
    };

    getDisplayWindowAgent = () => {
        return this._displayWindowAgent;
    };
}
