import { Context } from "epics-tca";
// import { WindowAgentsManager } from "../windows/WindowAgentsManager";
import { CaChannelAgent } from "./CaChannelAgent";
import { Profile } from "../profile/Profile";
import { MainProcess } from "../mainProcess/MainProcess";
import { LocalChannelAgent } from "./LocalChannelAgent";
import { DbdFiles } from "../file/DbdFiles";
import { logs } from "../global/GlobalVariables";

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
     * It is invoked when the profile is selected.
     */
    createAndInitContext = async () => {
        if (this._context === undefined) {
            logs.info(this.getMainProcessId(), "Creating EPICS CA context");
            this._context = new Context(this.getProfile().convertToTcaInput()["EPICS Environment"], "WARN");
            await this._context.initialize();
        } else {
            logs.info(this.getMainProcessId(), "EPICS CA context already exists");
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
            if (ChannelAgentsManager.determineChannelType(channelName) === "epics") {
                channelAgent = new CaChannelAgent(this, channelName);
            } else {
                channelAgent = new LocalChannelAgent(this, channelName);
            }
            this._channelAgents[channelName] = channelAgent;
            return channelAgent;
        }
    };

    /**
     * Both loc:// and glb:// are considered as local type in main process
     */
    static determineChannelType = (channelName: string): "epics" | "local" | undefined => {
        if (channelName.startsWith("loc://") || channelName.startsWith("glb://")) {
            return "local";
        } else {
            return "epics";
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
