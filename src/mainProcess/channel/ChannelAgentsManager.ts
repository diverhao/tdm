import { Context, type_log_levels } from "epics-tca";
// import { WindowAgentsManager } from "../windows/WindowAgentsManager";
import { CaChannelAgent } from "./CaChannelAgent";
import { Profile } from "../profile/Profile";
import { MainProcess } from "../mainProcess/MainProcess";
import { LocalChannelAgent } from "./LocalChannelAgent";
import { DbdFiles } from "../file/DbdFiles";
import { Log } from "../log/Log";

//todo: singleton class

type ChannelAgent = CaChannelAgent | LocalChannelAgent;

export class ChannelAgentsManager {
    private _profile: Profile;
    private _context: Context | undefined = undefined;
    private _mainProcess: MainProcess;

    private _dbdFiles: DbdFiles;

    // <channelName, CaChannelAgent>
    private _channelAgents: Record<string, CaChannelAgent | LocalChannelAgent> = {};

    private _mainProcessId: string;

    constructor(profile: Profile, mainProcess: MainProcess) {
        this._profile = profile;
        this._mainProcess = mainProcess;
        this._mainProcessId = mainProcess.getProcessId();

        // all dbd files are read and parsed
        this._dbdFiles = new DbdFiles();

        // setInterval(() => {
        //     console.log(Object.keys(this.getChannelAgents()).length)
        // }, 2000)
    }

    getProfile = () => {
        return this._profile;
    };


    getMainProcessId = () => {
        return this._mainProcessId;
    }

    /**
     * Create and initialize the epics-tca context from profile. <br>
     *
     * It is invoked when the profile is selected. <br>
     * 
     * The "DO NOT SET" values in EPICS_CA_ADDR_LIST, EPICS_PVA_ADDR_LIST, EPICS_CA_NAME_SERVERS, and EPICS_PVA_NAME_SERVERS 
     * are converted to an invalid IP address 0.0.0.0.0 so that the user-defined value is ignored
     */
    createAndInitContext = async () => {
        if (this._context === undefined) {
            Log.info(this.getMainProcessId(), "Creating EPICS CA context");
            let epicsLogLevel: type_log_levels = type_log_levels.error;
            const epicsLogLevelEntry = this.getProfile().getEpicsLogLevel();
            if (epicsLogLevelEntry !== undefined && epicsLogLevelEntry["value"] !== undefined) {
                epicsLogLevel = type_log_levels[epicsLogLevelEntry["value"] as keyof typeof type_log_levels];
            }
            this._context = new Context(this.getProfile().convertToTcaInput()["EPICS CA Settings"], epicsLogLevel);
            await this._context.initialize();
        } else {
            Log.info(this.getMainProcessId(), "EPICS CA context already exists");
        }
    };

    /**
     * Create a `CaChannelAgent` object if this channel does not exist, and register this object to `ChannelAgentsManager`.
     * If the channel agent already exist, return it. <br>
     *
     * No network connection is established. It is realized in `async CaChannelAgent.connect()`
     * 
     * undefined return value means we cannot create such a channel.
     */
    createChannelAgent = (channelName: string): CaChannelAgent | LocalChannelAgent | undefined => {
        let channelAgent = this.getChannelAgent(channelName);
        if (channelAgent !== undefined) {
            return channelAgent;
        } else {
            if (ChannelAgentsManager.determineChannelType(channelName) === "ca" || ChannelAgentsManager.determineChannelType(channelName) === "pva") {
                channelAgent = new CaChannelAgent(this, channelName);
            } else {
                channelAgent = new LocalChannelAgent(this, channelName);
            }
            this._channelAgents[channelName] = channelAgent;
            return channelAgent;
        }
    };

    /**
     * @returns {address: array of channel names}
     */
    generateEpicsStats = (): Record<string, any> => {
        const context = this.getContext();
        let result: Record<string, any> = {};
        if (context === undefined) {
            return result;
        } else {
            const networkStats = context.getNetworkStats();
            result = JSON.parse(JSON.stringify(networkStats))
            console.log("net work stats ======================", networkStats)
            const tcpTransports = context.getTcpTransports();
            for (let [address, tcpTransport] of Object.entries(tcpTransports.getTcpTransports())) {
                const channelNames = Object.keys(tcpTransport.getChannels());
                if (result["tcp"][address] !== undefined) {
                    result["tcp"][address]["channels"] = channelNames;
                }
            }

            const unconnectedChannelNames = Object.keys(context.getUnresolvedChannelsByName());
            result["tcp"]["unresolved_channel_names"] = {};
            result["tcp"]["unresolved_channel_names"]["channels"] = unconnectedChannelNames;
            return result;
        }
    }

    /**
     * Both loc:// and glb:// are considered as local type in main process
     */
    static determineChannelType = (channelName: string): "ca" | "local" | "pva" | undefined => {
        if (channelName.startsWith("loc://") || channelName.startsWith("glb://")) {
            return "local";
        } else if (channelName.startsWith("pva://")) {
            return "pva";

        } else {
            return "ca";
        }
    };

    getContext = (): Context | undefined => {
        return this._context;
    };

    /**
     * Simply remove the channel agent object from `_channelAgents`.
     */
    removeChannelAgent = (channelName: string): void => {
        delete this._channelAgents[channelName];
    };

    getChannelAgents = () => {
        return this._channelAgents;
    };

    /**
     * Get the channe agent object.
     *
     * @param {string} channelName Channel name.
     * @returns {CaChannelAgent | undefined} If not exist, return `undefined`.
     */
    getChannelAgent = (channelName: string): CaChannelAgent | LocalChannelAgent | undefined => {
        return this._channelAgents[channelName];
    };

    getMainProcess = (): MainProcess => {
        return this._mainProcess;
    };

    getDbdFiles = () => {
        return this._dbdFiles;
    }
}
