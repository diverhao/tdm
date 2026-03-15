import { IpcEventArgType } from "../../../common/IpcEventArgType";
import { Log } from "../../../common/Log";
import type { DisplayWindowAgent } from "./DisplayWindowAgent";

export class DisplayWindowChannel {
    private readonly _displayWindowAgent: DisplayWindowAgent;

    constructor(displayWindowAgent: DisplayWindowAgent) {
        this._displayWindowAgent = displayWindowAgent;
    }

    handleTcaGet = async (options: IpcEventArgType["tca-get"]) => {
        const { channelName, widgetKey, ioId, ioTimeout, dbrType, useInterval } = options;
        const displayWindowAgent = this.getDisplayWindowAgent();

        const data = await displayWindowAgent.tcaGet(channelName, ioTimeout, dbrType);
        if (useInterval && typeof data === "object" && data !== null && "value" in data) {
            displayWindowAgent.addNewChannelData(channelName, data);
        }

        displayWindowAgent.sendFromMainProcess("tca-get-result", {
            ioId: ioId,
            widgetKey: widgetKey,
            newDbrData: data,
        });

        return data;
    };

    handleTcaGetMeta = async (options: IpcEventArgType["tca-get-meta"]) => {
        const { channelName, widgetKey, ioId, timeout } = options;
        const displayWindowAgent = this.getDisplayWindowAgent();
        const channelType = this.getChannelType(channelName);
        const data = await displayWindowAgent.tcaGetMeta(channelName, timeout);

        if (channelType === "pva") {
            // Send twice so newly created widgets still receive an initial refresh.
            displayWindowAgent.addNewChannelData(channelName, data);
        }

        Log.debug("tca-get-meta result for", channelName, "is", data);
        if (channelType === "pva") {
            displayWindowAgent.sendFromMainProcess("fetch-pva-type", {
                channelName: channelName,
                widgetKey: widgetKey,
                fullPvaType: data,
                ioId: ioId,
            });
            return;
        }

        displayWindowAgent.sendFromMainProcess("tca-get-result", {
            ioId: ioId,
            widgetKey: widgetKey,
            newDbrData: data,
        });
    };

    handleFetchPvaType = async (options: IpcEventArgType["fetch-pva-type"]) => {
        const { channelName, widgetKey, ioId, timeout } = options;
        const displayWindowAgent = this.getDisplayWindowAgent();
        const data = await displayWindowAgent.fetchPvaType(channelName, timeout);

        Log.debug("fetch Pva Type for", channelName, "is", data);
        displayWindowAgent.sendFromMainProcess("fetch-pva-type", {
            channelName: channelName,
            widgetKey: widgetKey,
            fullPvaType: data,
            ioId: ioId,
        });
    };

    handleTcaPut = async (options: IpcEventArgType["tca-put"]) => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        const channelName = options["channelName"];
        const displayWindowId = options["displayWindowId"];
        const dbrData = options["dbrData"];
        const ioTimeout = options["ioTimeout"];
        const pvaValueField = options["pvaValueField"];
        const waitNotify = options["waitNotify"] ?? false;
        const ioId = options["ioId"] ?? -1;

        const status = await displayWindowAgent.tcaPut(channelName, dbrData, ioTimeout, pvaValueField, waitNotify);
        if (waitNotify) {
            displayWindowAgent.sendFromMainProcess("tca-put-result", {
                channelName: channelName,
                displayWindowId: displayWindowId,
                ioId: ioId,
                waitNotify: waitNotify,
                status: status,
            });
        }

        return status;
    };

    getDisplayWindowAgent = () => {
        return this._displayWindowAgent;
    };

    private getChannelType = (channelName: string) => {
        return this.getDisplayWindowAgent().getWindowAgentsManager().getMainProcess().getChannelAgentsManager().determineChannelType(channelName);
    };
}
