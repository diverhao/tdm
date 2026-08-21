import { IpcDispWinToMainProc } from "../../../common/types/IpcEventArgType";
import { Log } from "../../../common/Log";
import type { DisplayWindowAgent } from "./DisplayWindowAgent";

export class DisplayWindowChannel {
    private readonly _displayWindowAgent: DisplayWindowAgent;

    constructor(displayWindowAgent: DisplayWindowAgent) {
        this._displayWindowAgent = displayWindowAgent;
    }

    handleTcaGetMeta = async (options: IpcDispWinToMainProc["tca-get-meta"]) => {
        let { channelName } = options;
        const displayWindowAgent = this.getDisplayWindowAgent();
        const data = await displayWindowAgent.tcaGetMeta(channelName);

        if (data === undefined) {
            return;
        } else {
            Log.debug("tca-get-meta result for", channelName, "is", data);
            displayWindowAgent.sendFromMainProcess("tca-get-meta-result",
                data as any
            );
        }
    };

    handleTcaGet = async (options: IpcDispWinToMainProc["tca-get"]) => {
        const { channelName, ioTimeout } = options;
        const displayWindowAgent = this.getDisplayWindowAgent();

        const data = await displayWindowAgent.tcaGet(channelName, ioTimeout);

        if (data === undefined) {
            return;
        } else {
            Log.debug("tca-get result for", channelName, "is", data);
            displayWindowAgent.sendFromMainProcess("tca-get-result", {
                channelName: channelName,
                newDbrData: data as any,
            });
        }
    };


    handlePvaGetMeta = async (options: IpcDispWinToMainProc["pva-get-meta"]) => {
        const { channelName } = options;
        const displayWindowAgent = this.getDisplayWindowAgent();
        const data = await displayWindowAgent.pvaGetMeta(channelName);

        if (data === undefined) {
            return;
        } else {
            Log.debug("pva-get-meta for", channelName, "is", data);
            displayWindowAgent.sendFromMainProcess("pva-get-meta-result", {
                channelName: channelName,
                pvaType: data.pvaType,
                accessRight: data.accessRight,
                serverAddr: data.serverAddr,
            });
        }
    };

    handlePvaGet = async (options: IpcDispWinToMainProc["pva-get"]) => {
        const { channelName, ioTimeout } = options;
        const displayWindowAgent = this.getDisplayWindowAgent();
        const data = await displayWindowAgent.pvaGet(channelName, ioTimeout);

        if (data === undefined) {
            return;
        } else {
            Log.debug("pva-get result for", channelName, "is", data);
            displayWindowAgent.sendFromMainProcess("pva-get-result", {
                channelName: channelName,
                pvaData: data,
            });
        }
    };

    handleTcaPut = async (options: IpcDispWinToMainProc["tca-put"]) => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        const channelName = options["channelName"];
        const dbrData = options["dbrData"];
        // const pvaValueField = options["pvaValueField"];

        await displayWindowAgent.tcaPut(channelName, dbrData, 1);
        // const status = await displayWindowAgent.tcaPut(channelName, dbrData, 1, pvaValueField, false);
        // return status;
    };

    handlePvaPut = async (options: IpcDispWinToMainProc["pva-put"]) => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        const { channelName, value, valuePvRequest } = options;

        await displayWindowAgent.pvaPut(channelName, value, 1, valuePvRequest);
    };

    getDisplayWindowAgent = () => {
        return this._displayWindowAgent;
    };

    private getChannelType = (channelName: string) => {
        return this.getDisplayWindowAgent().getWindowAgentsManager().getMainProcess().getChannelAgentsManager().determineChannelType(channelName);
    };
}
