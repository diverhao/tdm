import * as os from "os";
import { type_pva_status, type_pva_value } from "epics-tca";
import { type_dbrData, Channel_DBR_TYPES, type_LocalChannel_data } from "../../../common/GlobalVariables";
import { Log } from "../../../common/Log";
import { CaChannelAgent, DisplayOperations } from "../../channel/CaChannelAgent";
import { LocalChannelAgent } from "../../channel/LocalChannelAgent";
import { DisplayWindowAgent } from "./DisplayWindowAgent";

export class DisplayWindowChannelsManager {

    private _displayWindowAgent: DisplayWindowAgent;
    private _channelAgents: Record<string, CaChannelAgent | LocalChannelAgent> = {};
    private _sendChannelsDataInterval: NodeJS.Timeout | undefined;
    private _newChannelData: Record<string, type_pva_value | type_pva_value[] | type_dbrData | type_dbrData[] | { value: undefined }> = {};

    constructor(displayWindowAgent: DisplayWindowAgent) {
        this._displayWindowAgent = displayWindowAgent;
    }

    startChannelsDataInterval = () => {
        this._sendChannelsDataInterval = setInterval(() => {
            this.checkChannelsState();
            this.flushNewChannelData();
        }, 100);
    };

    private flushNewChannelData = () => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        if (Object.keys(this._newChannelData).length > 0) {
            displayWindowAgent.sendFromMainProcess("new-channel-data", {
                newDbrData: this._newChannelData,
            });
            this._newChannelData = {};
        }
    };

    tcaGet = async (channelName: string, ioTimeout: number | undefined, dbrType: Channel_DBR_TYPES | undefined | string): Promise<type_dbrData | type_pva_value | { value: undefined }> => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        const windowAgentsManager = displayWindowAgent.getWindowAgentsManager();
        const mainProcess = windowAgentsManager.getMainProcess();
        const channelAgentsManager = mainProcess.getChannelAgentsManager();
        const channelType = channelAgentsManager.determineChannelType(channelName);
        let result: type_pva_value | type_LocalChannel_data | type_dbrData = { value: undefined };

        if (channelType === "ca" || channelType === "pva") {
            const t0 = Date.now();
            const connectSuccess = await this.addAndConnectChannel(channelName, ioTimeout);
            const t1 = Date.now();
            if (t1 - t0 > (ioTimeout === undefined ? 10000000 : ioTimeout) * 1000) {
                return { value: undefined };
            }
            const channelAgent = channelAgentsManager.getChannelAgent(channelName);
            if (!connectSuccess || channelAgent === undefined || !(channelAgent instanceof CaChannelAgent)) {
                Log.error(`tcaGet: EPICS channel ${channelName} cannot be created/connected.`);
                return { value: undefined };
            }
            const channelProtocol = channelAgent.getProtocol();
            if (channelProtocol === "ca" && (typeof dbrType === "number" || dbrType === undefined)) {
                result = await channelAgent.get(displayWindowAgent.getId(), dbrType, ioTimeout);
            } else if (channelProtocol === "pva") {
                result = await channelAgent.getPva(displayWindowAgent.getId(), ioTimeout);
            } else {
                Log.error("Unrecognized protocol", channelProtocol);
            }
        } else {
            const connectSuccess = this.addAndConnectLocalChannel(channelName);
            const channelAgent = channelAgentsManager.getChannelAgent(channelName);
            if (!connectSuccess || channelAgent === undefined || !(channelAgent instanceof LocalChannelAgent)) {
                Log.debug(`tcaGet: Local channel ${channelName} cannot be created/connected.`);
                return result;
            }
            result = channelAgent.getDbrData();
        }

        if (this.checkChannelOperations(channelName) === false) {
            this.removeChannel(channelName);
        }
        return result;
    };

    tcaGetMeta = async (channelName: string, ioTimeout: number | undefined): Promise<type_dbrData | type_LocalChannel_data | { value: undefined }> => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        const windowAgentsManager = displayWindowAgent.getWindowAgentsManager();
        const mainProcess = windowAgentsManager.getMainProcess();
        const channelAgentsManager = mainProcess.getChannelAgentsManager();
        const channelType = channelAgentsManager.determineChannelType(channelName);
        let result: type_LocalChannel_data | type_dbrData = { value: undefined };

        if (channelType === "ca" || channelType === "pva") {
            const t0 = Date.now();
            const connectSuccess = await this.addAndConnectChannel(channelName, ioTimeout);
            const t1 = Date.now();
            if (ioTimeout !== undefined && t1 - t0 > ioTimeout * 1000) {
                return { value: undefined };
            }

            const channelAgent = channelAgentsManager.getChannelAgent(channelName);
            if (!connectSuccess || channelAgent === undefined) {
                Log.debug(`tcaGetMeta: EPICS channel ${channelName} cannot be created/connected.`);
                return { value: undefined };
            }

            if (channelAgent instanceof CaChannelAgent) {
                if (channelType === "ca") {
                    const dbrTypeNum_GR = channelAgent.getDbrTypeNum_GR();
                    const dbrTypeNum_CTRL = channelAgent.getDbrTypeNum_CTRL();
                    if (dbrTypeNum_GR === undefined) {
                        Log.debug(`Channel ${channelName} does not have a GR type data.`);
                        return { value: undefined };
                    }
                    result = await channelAgent.get(displayWindowAgent.getId(), dbrTypeNum_CTRL, ioTimeout);
                    if (result.value !== undefined) {
                        result.DBR_TYPE = dbrTypeNum_GR;
                        result.valueCount = channelAgent.getValueCount();
                        result.serverAddress = channelAgent.getServerAddress();
                        result.accessRight = channelAgent.getAccessRight();
                    }
                } else if (channelType === "pva") {
                    result = await channelAgent.fetchPvaType();
                    result.valueCount = channelAgent.getValueCount();
                    result.serverAddress = channelAgent.getServerAddress();
                }
            }
        } else {
            const connectSuccess = this.addAndConnectLocalChannel(channelName);
            const channelAgent = channelAgentsManager.getChannelAgent(channelName);
            if (!connectSuccess || channelAgent === undefined || !(channelAgent instanceof LocalChannelAgent)) {
                Log.debug(`tcaGetMeta: Local channel ${channelName} cannot be created/connected.`);
                return result;
            }
            result = channelAgent.getDbrData();
        }

        if (this.checkChannelOperations(channelName) === false) {
            // this.removeChannel(channelName);
        }

        displayWindowAgent.promises.resolvePromise("tca-get-meta", "");
        return result;
    };

    fetchPvaType = async (channelName: string, ioTimeout: number | undefined): Promise<Record<string, any> | undefined> => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        const windowAgentsManager = displayWindowAgent.getWindowAgentsManager();
        const mainProcess = windowAgentsManager.getMainProcess();
        const channelAgentsManager = mainProcess.getChannelAgentsManager();
        const channelType = channelAgentsManager.determineChannelType(channelName);
        let result: type_LocalChannel_data | type_dbrData = { value: undefined };

        if (channelType !== "pva") {
            return undefined;
        }
        const t0 = Date.now();
        const connectSuccess = await this.addAndConnectChannel(channelName, ioTimeout);
        const t1 = Date.now();
        if (ioTimeout !== undefined && t1 - t0 > ioTimeout * 1000) {
            return undefined;
        }

        const channelAgent = channelAgentsManager.getChannelAgent(channelName);
        if (!connectSuccess || channelAgent === undefined) {
            Log.debug(`tcaGetMeta: EPICS channel ${channelName} cannot be created/connected.`);
            return undefined;
        }

        if (channelAgent instanceof CaChannelAgent) {
            result = await channelAgent.fetchPvaType();
        }

        if (this.checkChannelOperations(channelName) === false) {
            // this.removeChannel(channelName);
        }

        displayWindowAgent.promises.resolvePromise("fetch-pva-type", "");
        return result;
    };

    tcaPutMeta = (
        channelName: string,
        dbrMetaData: {
            value: number | string | undefined;
            type: "number" | "string" | "enum";
            strings: string[];
        }
    ): void => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        const channelAgentsManager = displayWindowAgent.getWindowAgentsManager().getMainProcess().getChannelAgentsManager();
        const channelType = channelAgentsManager.determineChannelType(channelName);

        if ((channelType !== "local") && (channelType !== "global")) {
            return;
        }

        this.addAndConnectLocalChannel(channelName);

        const channelAgent = channelAgentsManager.getChannelAgent(channelName);
        if (channelAgent instanceof LocalChannelAgent && channelAgent.metaDataInitialized === true) {
            channelAgent.metaDataInitialized = true;
            channelAgent.setValue(dbrMetaData["value"]);
            channelAgent.setDbrType(dbrMetaData["type"]);
            channelAgent.setDbrStrings(dbrMetaData["strings"]);
        } else {
            Log.error(`Cannot find the agent for local channel ${channelName}`);
        }
    };

    tcaPut = async (channelName: string, dbrData: type_dbrData | type_LocalChannel_data, ioTimeout: number, pvaValueField: string, waitNotify: boolean): Promise<number | undefined | type_pva_status> => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        const windowAgentsManager = displayWindowAgent.getWindowAgentsManager();
        const mainProcess = windowAgentsManager.getMainProcess();
        const channelAgentsManager = mainProcess.getChannelAgentsManager();
        const channelType = channelAgentsManager.determineChannelType(channelName);
        let putStatus: number | undefined | type_pva_status = undefined;

        if (channelType === "ca" || channelType === "pva") {
            const t0 = Date.now();
            const connectSuccess = await this.addAndConnectChannel(channelName, ioTimeout);
            const t1 = Date.now();
            if (t1 - t0 > ioTimeout * 1000) {
                return putStatus;
            }
            const channelAgent = channelAgentsManager.getChannelAgent(channelName);
            if (!connectSuccess || channelAgent === undefined || !(channelAgent instanceof CaChannelAgent)) {
                Log.debug(`tcaPut: EPICS channel ${channelName} cannot be created/connected.`);
                return putStatus;
            }

            const selectedProfile = displayWindowAgent.getWindowAgentsManager().getMainProcess().getProfiles().getSelectedProfile();
            if (selectedProfile === undefined) {
                Log.error("No profile selected, quit PUT operation.");
                return putStatus;
            }
            const disablePut = selectedProfile.getDisablePut();
            if (`${disablePut}`.toLowerCase() === "yes") {
                Log.warn("This profile does allow PUT operation for", channelName);
                return putStatus;
            }

            if (channelType === "ca") {
                putStatus = await channelAgent.put(displayWindowAgent.getId(), dbrData, waitNotify, ioTimeout);
            } else {
                putStatus = await channelAgent.putPva(displayWindowAgent.getId(), dbrData, ioTimeout, pvaValueField);
            }

            Log.info("TCA PUT: ", channelName, os.hostname(), JSON.stringify(dbrData).substring(0, 30));
            if (this.checkChannelOperations(channelName) === false) {
                this.removeChannel(channelName);
            }
            return putStatus;
        }

        const connectSuccess = this.addAndConnectLocalChannel(channelName);
        const channelAgent = channelAgentsManager.getChannelAgent(channelName);
        if (!connectSuccess || channelAgent === undefined || !(channelAgent instanceof LocalChannelAgent)) {
            Log.debug(`tcaPut: Local channel ${channelName} cannot be created/connected.`);
            return putStatus;
        }
        channelAgent.put(displayWindowAgent.getId(), dbrData as type_LocalChannel_data);
        return putStatus;
    };

    tcaMonitor = async (channelName: string): Promise<boolean> => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        const windowAgentsManager = displayWindowAgent.getWindowAgentsManager();
        const mainProcess = windowAgentsManager.getMainProcess();
        const channelAgentsManager = mainProcess.getChannelAgentsManager();
        const channelType = channelAgentsManager.determineChannelType(channelName);

        if (channelType === "pva") {
            await displayWindowAgent.promises.getPromise("fetch-pva-type");
        } else {
            await displayWindowAgent.promises.getPromise("tca-get-meta");
        }

        if (channelType === "ca" || channelType === "pva") {
            const connectSuccess = await this.addAndConnectChannel(channelName, undefined);
            const channelAgent = channelAgentsManager.getChannelAgent(channelName);
            if (!connectSuccess || channelAgent === undefined || !(channelAgent instanceof CaChannelAgent)) {
                Log.debug(`tcaMonitor: EPICS channel ${channelName} cannot be created/connected.`);
                return false;
            }
            await channelAgent.createMonitor(displayWindowAgent.getId());
        } else {
            const connectSuccess = this.addAndConnectLocalChannel(channelName);
            const channelAgent = channelAgentsManager.getChannelAgent(channelName);
            if (!connectSuccess || channelAgent === undefined || !(channelAgent instanceof LocalChannelAgent)) {
                Log.debug(`tcaMonitor: Local channel ${channelName} cannot be created/connected.`);
                return false;
            }
            channelAgent.createMonitor(displayWindowAgent.getId());
        }

        if (this.checkChannelOperations(channelName) === false) {
            this.removeChannel(channelName);
        }
        return true;
    };

    handleWindowClosed = () => {
        this.removeAllChannels();
        clearInterval(this._sendChannelsDataInterval);
        this._newChannelData = {};
    };

    removeAllChannels = () => {
        for (const channelName of Object.keys(this.getChannelAgents())) {
            this.removeChannel(channelName);
        }
    };

    removeChannel = (channelName: string) => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        const channelAgent = this.getChannelAgent(channelName);
        if (channelAgent === undefined) {
            return;
        }

        if (channelAgent instanceof CaChannelAgent) {
            const displayWindowId = displayWindowAgent.getId();
            const operations = channelAgent.getDisplayWindowOperations(displayWindowId);
            if (operations !== undefined && operations[3] > 0) {
                operations[3] = operations[3] - 1;
            }
        }

        this.removeChannelAgent(channelAgent);
        channelAgent.removeDisplayWindowOperations(displayWindowAgent.getId());
        if (Object.keys(channelAgent.getDisplayWindowsOperations()).length === 0) {
            channelAgent.checkLifeCycle();
        }
    };

    checkChannelOperations = (channelName: string): boolean => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        const windowAgentsManager = displayWindowAgent.getWindowAgentsManager();
        const mainProcess = windowAgentsManager.getMainProcess();
        const channelAgentsManager = mainProcess.getChannelAgentsManager();
        const channelAgent = channelAgentsManager.getChannelAgent(channelName);
        if (!(channelAgent instanceof LocalChannelAgent || channelAgent instanceof CaChannelAgent)) {
            return false;
        }

        const operations = channelAgent.getDisplayWindowOperations(displayWindowAgent.getId());
        if (operations === undefined) {
            return false;
        }

        const total = operations[0] + operations[1] + operations[2];
        return total !== 0;
    };

    addAndConnectChannel = async (channelName: string, ioTimeout: number | undefined = undefined): Promise<boolean> => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        const windowAgentsManager = displayWindowAgent.getWindowAgentsManager();
        const mainProcess = windowAgentsManager.getMainProcess();
        const channelAgentsManager = mainProcess.getChannelAgentsManager();

        let channelAgent = channelAgentsManager.getChannelAgent(channelName);
        if (channelAgent === undefined) {
            channelAgent = channelAgentsManager.createChannelAgent(channelName);
            if (!(channelAgent instanceof CaChannelAgent)) {
                return false;
            }
            channelAgent.initDisplayWindowOperations(displayWindowAgent.getId());
            this.addChannelAgent(channelAgent);
        } else {
            if (!(channelAgent instanceof CaChannelAgent)) {
                return false;
            }
            if (channelAgent.getDisplayWindowsOperations()[displayWindowAgent.getId()] === undefined) {
                channelAgent.initDisplayWindowOperations(displayWindowAgent.getId());
                this.addChannelAgent(channelAgent);
            }
        }

        channelAgent.addDisplayWindowOperation(displayWindowAgent.getId(), DisplayOperations.CONNECT);
        const success = await channelAgent.connect(ioTimeout);
        channelAgent.removeDisplayWindowOperation(displayWindowAgent.getId(), DisplayOperations.CONNECT);
        if (!success) {
            this.removeChannel(channelName);
        }
        return success;
    };

    addAndConnectLocalChannel = (channelName: string): boolean => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        const windowAgentsManager = displayWindowAgent.getWindowAgentsManager();
        const mainProcess = windowAgentsManager.getMainProcess();
        const channelAgentsManager = mainProcess.getChannelAgentsManager();

        let channelAgent = channelAgentsManager.getChannelAgent(channelName);
        if (channelAgent === undefined) {
            channelAgent = channelAgentsManager.createChannelAgent(channelName);
            if (!(channelAgent instanceof LocalChannelAgent)) {
                return false;
            }
            channelAgent.initDisplayWindowOperations(displayWindowAgent.getId());
            this.addChannelAgent(channelAgent);
        } else {
            if (!(channelAgent instanceof LocalChannelAgent)) {
                return false;
            }
            if (channelAgent.getDisplayWindowsOperations()[displayWindowAgent.getId()] === undefined) {
                channelAgent.initDisplayWindowOperations(displayWindowAgent.getId());
                this.addChannelAgent(channelAgent);
            }
        }
        return true;
    };

    addChannelAgent = (agent: CaChannelAgent | LocalChannelAgent) => {
        this._channelAgents[agent.getChannelName()] = agent;
    };

    removeChannelAgent = (agent: CaChannelAgent | LocalChannelAgent) => {
        delete this._channelAgents[agent.getChannelName()];
    };

    addNewChannelData = (channelName: string, newData: type_dbrData | type_LocalChannel_data | type_pva_value) => {
        const existingData = this._newChannelData[channelName];
        if (existingData !== undefined && newData !== undefined) {
            if (Array.isArray(existingData)) {
                this._newChannelData[channelName] = [...existingData, newData] as (type_pva_value | type_dbrData)[];
            } else {
                this._newChannelData[channelName] = [existingData, newData] as (type_pva_value | type_dbrData)[];
            }
        } else {
            this._newChannelData[channelName] = newData;
        }
    };

    checkChannelsState = () => {
        for (const channelAgent of Object.values(this.getChannelAgents())) {
            if (channelAgent instanceof LocalChannelAgent) {
                continue;
            }
            const oldState = channelAgent.getOldStateStr();
            const newState = channelAgent.getStateStr();
            if (oldState === "CREATED" && newState !== "CREATED") {
                this.addNewChannelData(channelAgent.getChannelName(), { value: undefined });
            }
        }
    };

    getChannelAgents = () => {
        return this._channelAgents;
    };

    getChannelAgent = (channelName: string) => {
        return this._channelAgents[channelName];
    };

    getDisplayWindowAgent = () => {
        return this._displayWindowAgent;
    };

}
