import * as os from "os";
import { Channel_ACCESS_RIGHTS, Channel_DBR_TYPE, type_dbrData, type_LocalChannel_data, type_pva_value, type_pva_value_pv_request } from "../../../common/Epics";
import { Log } from "../../../common/Log";
import { CaChannelAgent, DisplayOperations } from "../../channel/CaChannelAgent";
import { LocalChannelAgent } from "../../channel/LocalChannelAgent";
import { DisplayWindowAgent } from "./DisplayWindowAgent";
import { IpcMainProcToDispWin } from "../../../common/types/IpcEventArgType";
import { access } from "fs";

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
                newDbrData: this._newChannelData as any,
            });
            this._newChannelData = {};
        }
    };


    tcaGetMeta = async (channelName: string): Promise<IpcMainProcToDispWin["tca-get-meta-result"] | type_LocalChannel_data | undefined> => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        const windowAgentsManager = displayWindowAgent.getWindowAgentsManager();
        const mainProcess = windowAgentsManager.getMainProcess();
        const channelAgentsManager = mainProcess.getChannelAgentsManager();
        const channelType = channelAgentsManager.determineChannelType(channelName);
        let result: IpcMainProcToDispWin["tca-get-meta-result"] | type_LocalChannel_data | undefined = undefined;

        if (channelType === "ca") {
            const connectSuccess = await this.addAndConnectChannel(channelName, 0);

            const channelAgent = channelAgentsManager.getChannelAgent(channelName);
            if (!connectSuccess || channelAgent === undefined) {
                Log.debug(`tcaGetMeta: EPICS channel ${channelName} cannot be created/connected.`);
                return undefined;
            }

            if (channelAgent instanceof CaChannelAgent) {
                const dbrTypeNum_GR = channelAgent.getDbrTypeNum_GR();
                const dbrTypeNum_CTRL = channelAgent.getDbrTypeNum_CTRL();
                if (dbrTypeNum_GR === undefined || dbrTypeNum_CTRL === undefined) {
                    Log.debug(`Channel ${channelName} does not have a GR type data.`);
                    return undefined;
                }

                const dbrGrData = await channelAgent.get(displayWindowAgent.getId(), dbrTypeNum_CTRL, 0);
                if (dbrGrData === undefined) {
                    return undefined;
                }
                result = {
                    channelName: channelName,
                    newDbrGrData: dbrGrData,
                    dataType: dbrTypeNum_GR % 7,
                    dataCount: channelAgent.getValueCount(),
                    serverAddr: channelAgent.getServerAddress(),
                    accessRight: channelAgent.getAccessRight(),
                };
            } else {
                return undefined;
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

    // iaGetMeta = async (channelName: string): Promise<IpcMainProcToDispWin["ia-get-meta-result"] | undefined> => {
    //     const displayWindowAgent = this.getDisplayWindowAgent();
    //     const windowAgentsManager = displayWindowAgent.getWindowAgentsManager();
    //     const mainProcess = windowAgentsManager.getMainProcess();
    //     const channelAgentsManager = mainProcess.getChannelAgentsManager();
    //     let result: IpcMainProcToDispWin["ia-get-meta-result"] | undefined = undefined;

    //     channelName = this.getNormIaChannelName(channelName);

    //     const connectSuccess = this.addAndConnectLocalChannel(channelName);
    //     const channelAgent = channelAgentsManager.getChannelAgent(channelName);
    //     if (!connectSuccess || channelAgent === undefined || !(channelAgent instanceof LocalChannelAgent)) {
    //         Log.debug(`tcaGetMeta: Internal Channel ${channelName} cannot be created/connected.`);
    //         return result;
    //     }
    //     let dbrData = channelAgent.getDbrData();
    //     result = {
    //         secondsSinceEpoch: dbrData["secondsSinceEpoch"],
    //         nanoSeconds: dbrData["nanoSeconds"],
    //         channelName: channelAgent.getReducedChannelName(),
    //         enumChoices: dbrData["strings"] ?? [],
    //         value: dbrData["value"],
    //     };

    //     if (this.checkChannelOperations(channelName) === false) {
    //         // this.removeChannel(channelName);
    //     }

    //     displayWindowAgent.promises.resolvePromise("tca-get-meta", "");
    //     return result;
    // };
    iaGetMeta = async (channelName: string) => {
        return await this.iaGet(channelName, 0);
    }

    getNormIaChannelName = (channelName: string) => {
        if (channelName.startsWith("loc://") && !channelName.includes("@")) {
            return channelName + "@" + "window_" + this.getDisplayWindowAgent().getId();
        } else {
            return channelName;
        }
    }

    tcaGet = async (channelName: string, ioTimeout: number): Promise<type_dbrData | type_LocalChannel_data | undefined> => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        const windowAgentsManager = displayWindowAgent.getWindowAgentsManager();
        const mainProcess = windowAgentsManager.getMainProcess();
        const channelAgentsManager = mainProcess.getChannelAgentsManager();
        const channelType = channelAgentsManager.determineChannelType(channelName);
        let result: type_LocalChannel_data | type_dbrData | undefined = undefined;

        if (channelType === "ca") {
            const t0 = Date.now();
            const connectSuccess = await this.addAndConnectChannel(channelName, ioTimeout);
            const t1 = Date.now();
            if (ioTimeout !== undefined && t1 - t0 > ioTimeout * 1000) {
                return undefined;
            }

            const channelAgent = channelAgentsManager.getChannelAgent(channelName);
            if (!connectSuccess || channelAgent === undefined || !(channelAgent instanceof CaChannelAgent)) {
                Log.error(`tcaGet: EPICS channel ${channelName} cannot be created/connected.`);
                return undefined;
            }
            const dbrType = channelAgent.getDbrTypeNum_RAW();
            if (dbrType === undefined) {
                return undefined;
            } else {
                result = await channelAgent.get(displayWindowAgent.getId(), dbrType, ioTimeout);
            }

        } else {
            const connectSuccess = this.addAndConnectLocalChannel(channelName);
            const channelAgent = channelAgentsManager.getChannelAgent(channelName);
            if (!connectSuccess || channelAgent === undefined || !(channelAgent instanceof LocalChannelAgent)) {
                Log.debug(`tcaGet: Local channel ${channelName} cannot be created/connected.`);
                return undefined;
            }
            result = channelAgent.getDbrData();
        }

        if (this.checkChannelOperations(channelName) === false) {
            this.removeChannel(channelName);
        }
        return result;
    };

    iaGet = async (channelName: string, ioTimeout: number): Promise<type_LocalChannel_data | undefined> => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        const windowAgentsManager = displayWindowAgent.getWindowAgentsManager();
        const mainProcess = windowAgentsManager.getMainProcess();
        const channelAgentsManager = mainProcess.getChannelAgentsManager();
        let result: type_LocalChannel_data | undefined = undefined;

        const connectSuccess = this.addAndConnectLocalChannel(channelName);
        const channelAgent = channelAgentsManager.getChannelAgent(channelName);
        if (!connectSuccess || channelAgent === undefined || !(channelAgent instanceof LocalChannelAgent)) {
            Log.debug(`tcaGet: Local channel ${channelName} cannot be created/connected.`);
            return undefined;
        }
        let dbrData = channelAgent.getDbrData();
        result = {
            secondsSinceEpoch: dbrData["secondsSinceEpoch"],
            nanoSeconds: dbrData["nanoSeconds"],
            channelName: channelAgent.getReducedChannelName(),
            enumChoices: dbrData["strings"] ?? [],
            value: dbrData["value"],
        };
        if (this.checkChannelOperations(channelName) === false) {
            this.removeChannel(channelName);
        }
        return result;
    };

    pvaGetMeta = async (channelName: string): Promise<any | undefined> => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        const windowAgentsManager = displayWindowAgent.getWindowAgentsManager();
        const mainProcess = windowAgentsManager.getMainProcess();
        const channelAgentsManager = mainProcess.getChannelAgentsManager();
        const channelType = channelAgentsManager.determineChannelType(channelName);
        let result: Record<string, any> = {
            pvaType: undefined,
            serverAddr: "",
            accessRight: -1,
        };

        if (channelType !== "pva") {
            return undefined;
        }

        // never timeout
        const connectSuccess = await this.addAndConnectChannel(channelName, 0);

        const channelAgent = channelAgentsManager.getChannelAgent(channelName);
        if (!connectSuccess || channelAgent === undefined) {
            Log.debug(`tcaGetMeta: EPICS channel ${channelName} cannot be created/connected.`);
            return undefined;
        }

        if (channelAgent instanceof CaChannelAgent) {
            result.pvaType = await channelAgent.fetchPvaType();
            result.serverAddr = channelAgent.getServerAddress();
            result.accessRight = channelAgent.getAccessRight();
        } else {
            return undefined;
        }

        if (this.checkChannelOperations(channelName) === false) {
            // this.removeChannel(channelName);
        }

        displayWindowAgent.promises.resolvePromise("fetch-pva-type", "");
        return result;
    };

    pvaGet = async (channelName: string, ioTimeout: number) => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        const windowAgentsManager = displayWindowAgent.getWindowAgentsManager();
        const mainProcess = windowAgentsManager.getMainProcess();
        const channelAgentsManager = mainProcess.getChannelAgentsManager();

        let result: type_pva_value | undefined = undefined;

        const t0 = Date.now();
        const connectSuccess = await this.addAndConnectChannel(channelName, ioTimeout);
        const t1 = Date.now();
        if (ioTimeout !== undefined && t1 - t0 > ioTimeout * 1000) {
            return undefined;
        }

        const channelAgent = channelAgentsManager.getChannelAgent(channelName);
        if (!connectSuccess || channelAgent === undefined || !(channelAgent instanceof CaChannelAgent)) {
            Log.error(`tcaGet: EPICS channel ${channelName} cannot be created/connected.`);
            return undefined;
        }

        result = await channelAgent.getPva(displayWindowAgent.getId(), ioTimeout);

        if (this.checkChannelOperations(channelName) === false) {
            this.removeChannel(channelName);
        }
        return result;
    };



    // iaPutMeta = (
    //     channelName: string,
    //     dbrMetaData: {
    //         value: number | string | undefined;
    //         type: "number" | "string" | "enum";
    //         strings: string[];
    //     }
    // ): void => {
    //     const displayWindowAgent = this.getDisplayWindowAgent();
    //     const channelAgentsManager = displayWindowAgent.getWindowAgentsManager().getMainProcess().getChannelAgentsManager();
    //     const channelType = channelAgentsManager.determineChannelType(channelName);

    //     if ((channelType !== "local") && (channelType !== "global")) {
    //         return;
    //     }

    //     this.addAndConnectLocalChannel(channelName);

    //     const channelAgent = channelAgentsManager.getChannelAgent(channelName);
    //     if (channelAgent instanceof LocalChannelAgent && channelAgent.metaDataInitialized === true) {
    //         channelAgent.metaDataInitialized = true;
    //         channelAgent.setValue(dbrMetaData["value"]);
    //         channelAgent.setDbrType(dbrMetaData["type"]);
    //         channelAgent.setDbrStrings(dbrMetaData["strings"]);
    //     } else {
    //         Log.error(`Cannot find the agent for local channel ${channelName}`);
    //     }
    // };



    tcaPut = async (channelName: string, dbrData: type_dbrData | type_LocalChannel_data, ioTimeout: number): Promise<void> => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        const windowAgentsManager = displayWindowAgent.getWindowAgentsManager();
        const mainProcess = windowAgentsManager.getMainProcess();
        const channelAgentsManager = mainProcess.getChannelAgentsManager();
        const channelType = channelAgentsManager.determineChannelType(channelName);

        if (channelType === "ca") {
            const t0 = Date.now();
            const connectSuccess = await this.addAndConnectChannel(channelName, ioTimeout);
            const t1 = Date.now();
            if (t1 - t0 > ioTimeout * 1000) {
                return;
            }
            const channelAgent = channelAgentsManager.getChannelAgent(channelName);
            if (!connectSuccess || channelAgent === undefined || !(channelAgent instanceof CaChannelAgent)) {
                Log.debug(`tcaPut: EPICS channel ${channelName} cannot be created/connected.`);
                return;
            }

            const selectedProfile = displayWindowAgent.getWindowAgentsManager().getMainProcess().getProfiles().getSelectedProfile();
            if (selectedProfile === undefined) {
                Log.error("No profile selected, quit PUT operation.");
                return;
            }
            const disablePut = selectedProfile.getDisablePut();
            if (`${disablePut}`.toLowerCase() === "yes") {
                Log.warn("This profile does allow PUT operation for", channelName);
                return;
            }

            await channelAgent.put(displayWindowAgent.getId(), dbrData as any, ioTimeout);

            Log.info("TCA PUT: ", channelName, os.hostname(), JSON.stringify(dbrData).substring(0, 30));
            if (this.checkChannelOperations(channelName) === false) {
                this.removeChannel(channelName);
            }
            return;
        } else {
            const connectSuccess = this.addAndConnectLocalChannel(channelName);
            const channelAgent = channelAgentsManager.getChannelAgent(channelName);
            if (!connectSuccess || channelAgent === undefined || !(channelAgent instanceof LocalChannelAgent)) {
                Log.debug(`tcaPut: Local channel ${channelName} cannot be created/connected.`);
                return;
            }
            channelAgent.put(displayWindowAgent.getId(), dbrData as type_LocalChannel_data);
        }

    };


    iaPut = async (channelName: string, dbrData: type_LocalChannel_data): Promise<void> => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        const windowAgentsManager = displayWindowAgent.getWindowAgentsManager();
        const mainProcess = windowAgentsManager.getMainProcess();
        const channelAgentsManager = mainProcess.getChannelAgentsManager();

        const connectSuccess = this.addAndConnectLocalChannel(channelName);
        const channelAgent = channelAgentsManager.getChannelAgent(channelName);
        if (!connectSuccess || channelAgent === undefined || !(channelAgent instanceof LocalChannelAgent)) {
            Log.debug(`tcaPut: Local channel ${channelName} cannot be created/connected.`);
            return;
        }
        channelAgent.put(displayWindowAgent.getId(), dbrData as type_LocalChannel_data);
    };

    pvaPut = async (channelName: string, value: type_pva_value, ioTimeout: number, valuePvRequest: type_pva_value_pv_request): Promise<void> => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        const windowAgentsManager = displayWindowAgent.getWindowAgentsManager();
        const mainProcess = windowAgentsManager.getMainProcess();
        const channelAgentsManager = mainProcess.getChannelAgentsManager();
        const channelType = channelAgentsManager.determineChannelType(channelName);


        const t0 = Date.now();
        const connectSuccess = await this.addAndConnectChannel(channelName, ioTimeout);
        const t1 = Date.now();
        if (t1 - t0 > ioTimeout * 1000) {
            return;
        }
        const channelAgent = channelAgentsManager.getChannelAgent(channelName);
        if (!connectSuccess || channelAgent === undefined || !(channelAgent instanceof CaChannelAgent)) {
            Log.debug(`tcaPut: EPICS channel ${channelName} cannot be created/connected.`);
            return;
        }

        const selectedProfile = displayWindowAgent.getWindowAgentsManager().getMainProcess().getProfiles().getSelectedProfile();
        if (selectedProfile === undefined) {
            Log.error("No profile selected, quit PUT operation.");
            return;
        }
        const disablePut = selectedProfile.getDisablePut();
        if (`${disablePut}`.toLowerCase() === "yes") {
            Log.warn("This profile does allow PUT operation for", channelName);
            return;
        }

        await channelAgent.putPva(displayWindowAgent.getId(), value, ioTimeout, valuePvRequest);

        Log.info("TCA PUT: ", channelName, os.hostname(), JSON.stringify(value).substring(0, 30));
        if (this.checkChannelOperations(channelName) === false) {
            this.removeChannel(channelName);
        }
        return;

    };

    tcaMonitor = async (channelName: string): Promise<boolean> => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        const windowAgentsManager = displayWindowAgent.getWindowAgentsManager();
        const mainProcess = windowAgentsManager.getMainProcess();
        const channelAgentsManager = mainProcess.getChannelAgentsManager();

        // blocked until get-meta 
        await displayWindowAgent.promises.getPromise("tca-get-meta");

        const connectSuccess = await this.addAndConnectChannel(channelName, 0);
        const channelAgent = channelAgentsManager.getChannelAgent(channelName);
        if (!connectSuccess || channelAgent === undefined || !(channelAgent instanceof CaChannelAgent)) {
            Log.debug(`tcaMonitor: EPICS channel ${channelName} cannot be created/connected.`);
            return false;
        }
        await channelAgent._channelReadyMonitorPromise;
        await channelAgent.createMonitor(displayWindowAgent.getId());


        if (this.checkChannelOperations(channelName) === false) {
            this.removeChannel(channelName);
        }
        return true;
    };

    // tcaMonitor = async (channelName: string): Promise<boolean> => {
    //     const displayWindowAgent = this.getDisplayWindowAgent();
    //     const windowAgentsManager = displayWindowAgent.getWindowAgentsManager();
    //     const mainProcess = windowAgentsManager.getMainProcess();
    //     const channelAgentsManager = mainProcess.getChannelAgentsManager();
    //     const channelType = channelAgentsManager.determineChannelType(channelName);

    //     if (channelType === "pva") {
    //         await displayWindowAgent.promises.getPromise("fetch-pva-type");
    //     } else {
    //         await displayWindowAgent.promises.getPromise("tca-get-meta");
    //     }

    //     if (channelType === "ca" || channelType === "pva") {
    //         const connectSuccess = await this.addAndConnectChannel(channelName, 0);
    //         const channelAgent = channelAgentsManager.getChannelAgent(channelName);
    //         if (!connectSuccess || channelAgent === undefined || !(channelAgent instanceof CaChannelAgent)) {
    //             Log.debug(`tcaMonitor: EPICS channel ${channelName} cannot be created/connected.`);
    //             return false;
    //         }
    //         await channelAgent.createMonitor(displayWindowAgent.getId());
    //     } else {
    //         const connectSuccess = this.addAndConnectLocalChannel(channelName);
    //         const channelAgent = channelAgentsManager.getChannelAgent(channelName);
    //         if (!connectSuccess || channelAgent === undefined || !(channelAgent instanceof LocalChannelAgent)) {
    //             Log.debug(`tcaMonitor: Local channel ${channelName} cannot be created/connected.`);
    //             return false;
    //         }
    //         channelAgent.createMonitor(displayWindowAgent.getId());
    //     }

    //     if (this.checkChannelOperations(channelName) === false) {
    //         this.removeChannel(channelName);
    //     }
    //     return true;
    // };

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

    addAndConnectChannel = async (channelName: string, ioTimeout: number): Promise<boolean> => {
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

    resetChannelData = (channelName: string) => {
        const existingData = this._newChannelData[channelName];
        const newData = { value: 0 }
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
            // channel is disconnected/destroyed
            if (oldState === "CREATED" && newState !== "CREATED") {
                this.resetChannelData(channelAgent.getChannelName());
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
