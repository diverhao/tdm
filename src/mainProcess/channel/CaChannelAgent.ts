import { Channel, ChannelMonitor, Context, Channel_DBR_TYPES, type_pva_status, PVA_STATUS_TYPE } from "epics-tca";
import { type_dbrData } from "../../rendererProcess/global/GlobalVariables";
import { DisplayWindowAgent } from "../windows/DisplayWindow/DisplayWindowAgent";
import { ChannelAgentsManager } from "./ChannelAgentsManager";
import { Log } from "../log/Log";

export enum DisplayOperations {
    GET,
    PUT,
    MONITOR,
    CONNECT,
}


export enum ChannelSeverity {
    NO_ALARM,
    MINOR,
    MAJOR,
    INVALID,
    NOT_CONNECTED,
}
/**
 * Represents a CA channel. <br>
 *
 * Has a one-to-one correspondance with the epics-tca channel. <br>
 *
 * **Known issue**: When two DisplayWindowAgent.tcaGet() functions are invoked, the
 * channel search will be resolved/rejected by the first search request. For example,
 * we initiate `DisplayWindowAgent.tcaGet("val1", 2)` and `DisplayWindowAgent.tcaGet("val1", 5)`
 * at the same time while the channel "val1" does not exist. Then after 2 seconds, both of these tcaGet()
 * are rejected, returning `{value: undefined}`. The 5 second timeout is ignored.
 * This situation does not happen a lot for a display manager, but should be mentioned here.
 */
export class CaChannelAgent {
    /**
     * Monitor for this channel. There is only one monitor in this object, monitoring DBR_TIME data.
     */
    private _monitor: ChannelMonitor | undefined = undefined;

    /**
     * Representation of the channel in epics-tca lib
     */
    private _channel: Channel | undefined = undefined;

    /**
     * demo:abc, demo:abc.EGU
     * pva://demo:abc, pva://demo:abc.display.severity, pva://demo:abc/EGU
     */
    private _channelName: string;
    private _channelAgentsManager: ChannelAgentsManager;

    /**
     * The display windows that contain this channel. Pair of window ID and DisplayWindowAgent object.
     */
    private _displayWindowsOperations: Record<string, [number, number, number, number]> = {};

    private _oldStateStr: string = "";

    _channelCreationPromise: Promise<Channel | undefined> | undefined;

    // private _mainProcessId: string;

    constructor(channelAgentsManager: ChannelAgentsManager, channelName: string) {
        this._channelName = channelName;
        this._channelAgentsManager = channelAgentsManager;
        // this._mainProcessId = channelAgentsManager.getMainProcess().getProcessId();
    }

    // getMainProcessId = () => {
    //     return this._mainProcessId;
    // }

    /**
     * Check channel's life cycle. If it has no "client", then <br>
     *
     * (1) destroy it;
     *
     * (2) remove the `CaChannelAgent` object from the `ChannelAgentsManager`
     *
     * @throws {Error<string>} when the `_clientsNum` is less than -1.
     */
    checkLifeCycle = () => {
        let total = 0;
        for (let operations of Object.values(this._displayWindowsOperations)) {
            total = total + operations[0] + operations[1] + operations[2] + operations[3];
        }
        if (total === 0) {
            // (1)
            this.destroyHard();
            // (2)
            this.getChannelAgentsManager().removeChannelAgent(this.getChannelName());
        }
    };

    getChannel = (): Channel | undefined => {
        return this._channel;
    };

    // ----------------- Channel Access methods -------------------------

    /**
     * Try to resolve the channel. <br>
     *
     * This method can be invoked multiple times.
     * If the first invocation is still blocking, the latter ones will also be blocked.
     * When the channel is resolved, all the blockings will be lifted up.
     *
     * @param {number | undefined} creationTimeout Time out [second]. If `undefined`, the channel resolution never times out,
     * and this function never resolves. If the channel cannot be found within `creationTimeout` seconds,
     * set `_channel` to `undefined`.
     * @returns {Promise<boolean>} `true` if success, `false` if failed.
     *
     */
    connecting: boolean | undefined = false;
    connect = async (creationTimeout: number | undefined = undefined): Promise<boolean> => {
        try {
            this.connecting = true;
            let channelTmp = undefined;
            if (this._channelCreationPromise === undefined) {
                const context = this.getChannelAgentsManager().getContext();
                if (context === undefined) {
                    Log.error("0", "Context not initialized");
                    this.connecting = false;
                    return false;
                }
                // this._channelCreationPromise = context.createChannel(this._channelName, 5);
                let bareChannelName = this.getBareChannelName();
                if (this.getProtocol() === "ca") {
                    this._channelCreationPromise = context.createChannel(bareChannelName, "ca", creationTimeout);
                    channelTmp = await this._channelCreationPromise;
                } else if (this.getProtocol() === "pva") {
                    this._channelCreationPromise = context.createChannel(bareChannelName, "pva", creationTimeout);
                    channelTmp = await this._channelCreationPromise;
                }

            } else {
                // if the channel is being created by another function, it could be a `Channel` object or `undefined`
                channelTmp = await this._channelCreationPromise;
            }
            if (this._channel === undefined) {
                this._channel = channelTmp;
                if (channelTmp !== undefined) {
                    // when channel is destroyed softly, send a {value: undefined} to the display window
                    // so that the display window could change its displayed value
                    // this should be done after at least one push cycle, to ensure it is not overriden
                    channelTmp.destroySoftCallback = () => {
                        setTimeout(() => {
                            const channelAgentsManager = this.getChannelAgentsManager();
                            const mainProcess = channelAgentsManager.getMainProcess();
                            const windowAgentsManager = mainProcess.getWindowAgentsManager();
                            for (let displayWindowId of Object.keys(this.getDisplayWindowsOperations())) {
                                const displayWindowAgent = windowAgentsManager.getAgent(displayWindowId);
                                if (displayWindowAgent === undefined) {
                                    continue;
                                }
                                // the "value: undefined" won't be sent to the display window due to the
                                // serialization. However, we can use this feature (bug) to retain the
                                // last meaningful value for the widget, only updating the severity.
                                let newDbrData = { value: undefined, severity: ChannelSeverity.NOT_CONNECTED };
                                (displayWindowAgent as DisplayWindowAgent).addNewChannelData(this.getChannelName(), newDbrData);
                            }
                        }, 200)
                    }
                }
            }
            if (channelTmp === undefined) {
                this.connecting = false;

                return false;
            } else {
                this.connecting = false;
                return true;
            }
        } catch (e) {
            this.connecting = false;
            return false;
        }
    };

    /**
     * GET <br>
     *
     * This operation always times out. It adds a client number by 1 in the beginning, and reduces the client
     * number in the end;
     *
     * It checks the lifecycle of the channel. If this channel has no "client", then destroy
     * the channel and clean up the data.
     *
     * @param {Channel_DBR_TYPES | undefined} dbrType The DBR type we want to get. If `undefined`, use the default DBR type.
     * @param {number} ioTimeout Time out [s] of the operation. Default 1 second.
     * @returns {Promise<type_dbrData>} If channel is not connected or time out, return `undefined` value.
     */
    get = async (
        displayWindowId: string,
        dbrType: Channel_DBR_TYPES | undefined = undefined,
        ioTimeout: number = 1
    ): Promise<type_dbrData | { value: undefined }> => {
        this.addDisplayWindowOperation(displayWindowId, DisplayOperations.GET);
        let data: type_dbrData = { value: undefined };

        try {
            const channel = this.getChannel();
            if (channel === undefined) {
                const errMsg = `Channel ${this.getChannelName()} does not exist.`;
                throw new Error(errMsg);
            }

            const protocol = channel.getProtocol();
            if (protocol !== "ca") {
                const errMsg = `Channel ${this.getChannelName()} is not a CA channel.`;
                throw new Error(errMsg);
            }

            // default ioTimeout = 1 second
            const dataRaw = await channel.get(ioTimeout, dbrType);
            if (dataRaw === undefined) {
                data = { value: undefined };
            } else {
                data = JSON.parse(JSON.stringify(dataRaw));
            }

            this.removeDisplayWindowOperation(displayWindowId, DisplayOperations.GET);
            this.checkLifeCycle();
            return data;

        } catch (e) {
            Log.error("0", e);
            this.removeDisplayWindowOperation(displayWindowId, DisplayOperations.GET);
            this.checkLifeCycle();
            return { value: undefined };
        }
    };

    getPva = async (
        displayWindowId: string,
        ioTimeout: number = 1,
        pvRequest: string | undefined = undefined, // when undefined, use CaChannel's own pvRequest,
    ): Promise<type_dbrData | { value: undefined }> => {
        this.addDisplayWindowOperation(displayWindowId, DisplayOperations.GET);
        let data: type_dbrData | undefined = { value: undefined };
        try {
            const channel = this.getChannel();
            if (channel === undefined) {
                const errMsg = `Channel ${this.getChannelName()} does not exist.`;
                throw new Error(errMsg);
            }

            const protocol = channel.getProtocol();
            if (protocol !== "pva") {
                const errMsg = `Channel ${this.getChannelName()} is not a PVA channel.`;
                throw new Error(errMsg);
            }

            // default ioTimeout = 1 second
            if (pvRequest !== undefined) {
                data = JSON.parse(JSON.stringify(await channel.getPva(ioTimeout, pvRequest)));
            } else {
                data = JSON.parse(JSON.stringify(await channel.getPva(ioTimeout, this.getPvRequest())));
            }

            this.removeDisplayWindowOperation(displayWindowId, DisplayOperations.GET);
            this.checkLifeCycle();

            if (data === undefined) {
                return { value: undefined };
            } else {
                return data;
            }
        } catch (e) {

            Log.error("0", e);
            this.removeDisplayWindowOperation(displayWindowId, DisplayOperations.GET);
            this.checkLifeCycle();
            return { value: undefined };
        }
    };

    /**
     * Fetch full PVA type of the PV Access channel, the pv request for this particular
     * channel is ignored
     */
    fetchPvaType = async () => {
        const channel = this.getChannel();
        if (channel !== undefined) {
            const pvRequest = this.getPvRequest();
            const result = await channel.fetchPvaType();
            return result
        } else {
            return undefined;
        }
    }

    /**
     * PUT <br>
     *
     * This operation always times out. If the channel is not connected, return immediately. <br>
     *
     * It adds a client number by 1 in the beginning, and reduces the client
     * number in the end. <br>
     *
     * It checks the lifecycle of the channel. If this channel has no "client", then destroy
     * the channel and clean up the data.
     *
     * @param {type_dbrData} dbrData The data we want to put.
     * @param {number} ioTimeout Time out [s] of the operation. Default 1 second.
     * @returns undefined if the CA operation fails, the IO ID for synchronous version (waitNotify = false), the ECA status code for asynchronous version (waitNotify = true). PVA always returns a Status
     */
    put = async (displayWindowId: string, dbrData: type_dbrData, waitNotify: boolean, ioTimeout: number = 1): Promise<number | undefined> => {

        this.addDisplayWindowOperation(displayWindowId, DisplayOperations.PUT);
        let putStatus: number | undefined = undefined;
        try {
            const channel = this.getChannel();
            if (channel === undefined) {
                const errMsg = `Channel ${this.getChannelName()} does not exist.`;
                throw new Error(errMsg);
            }

            const newValue = dbrData.value;
            if (newValue === undefined) {
                const errMsg = `Value to put for channel ${this.getChannelName()} is undefined.`;
                throw new Error(errMsg);
            }
            putStatus = await channel.put(newValue, ioTimeout, waitNotify);
        } catch (e) {
            Log.error("0", e);
            putStatus = undefined;
        }
        // this.reduceClientsNum();
        // this.addPutOperation();
        this.removeDisplayWindowOperation(displayWindowId, DisplayOperations.PUT);
        this.checkLifeCycle();

        return putStatus;
    };

    putPva = async (displayWindowId: string, dbrData: type_dbrData, ioTimeout: number = 1, pvaValueField: string): Promise<type_pva_status> => {
        this.addDisplayWindowOperation(displayWindowId, DisplayOperations.PUT);
        let putStatus: type_pva_status = {
            type: PVA_STATUS_TYPE["ERROR"],
        }
        try {
            const channel = this.getChannel();
            if (channel === undefined) {
                const errMsg = `Channel ${this.getChannelName()} does not exist.`;
                throw new Error(errMsg);
            }

            const protocol = channel.getProtocol();
            if (protocol !== "pva") {
                const errMsg = `Channel ${this.getChannelName()} is not a PVA channel.`;
                throw new Error(errMsg);
            }

            let pvRequest = this.getPvRequest();
            if (pvaValueField !== "") {
                if (pvRequest === "") {
                    pvRequest = pvaValueField;
                } else {
                    pvRequest = pvRequest + "." + pvaValueField;
                }
            }

            const newValue = dbrData.value;
            if (newValue === undefined) {
                const errMsg = `Value to put for channel ${this.getChannelName()} is undefined.`;
                throw new Error(errMsg);
            }
            putStatus = await channel.putPva(pvRequest, [newValue], ioTimeout);
        } catch (e) {
            Log.error("0", e);
        }
        // this.reduceClientsNum();
        // this.addPutOperation();
        this.removeDisplayWindowOperation(displayWindowId, DisplayOperations.PUT);
        this.checkLifeCycle();
        return putStatus;
    };

    /**
     * Create and subscribe a monitor for this channel. The channel could be either CA or PVA <br>
     *
     * If there is already a monitor on this channel, return. <br>
     *
     * **Note**: this method does not check the channel lifecycle. It adds 1 to the number of "clients"
     * for this channel, but it does not reduce 1 if the monitor is successfully created.
     *
     * **Note**: There is no dedicated function to cancel a monitor, because there may be several
     * display windows using this montior. The only way of tracking the monitor users is based on the
     * relationship between `DisplayWindowAgent` and `CaChannelAgent`, but it may be polluted by
     * the outstanding GET/PUT operations. In simple way, we really do not know who are using the monitor.
     * Thus we cannot cancel it without cleaning up the relationships.
     *
     * **Note**: The monitor can be canceled upon the window closing by invoking `DisplayWindowAgent.removeChannel()`.
     * In this way, if there no other window having MONITOR or outstanding GET/PUT, this channel is destroyed.
     */
    createMonitor = async (displayWindowId: string): Promise<void> => {
        // this.addClientsNum();
        // this.addMonitorOperation();
        this.addDisplayWindowOperation(displayWindowId, DisplayOperations.MONITOR);

        const channel = this.getChannel();
        if (channel === undefined) {
            // this.reduceClientsNum();
            // this.reducePutOperation();
            Log.error(`EPICS TCA Channel ${this.getChannel()} does not exist`);
            this.removeDisplayWindowOperation(displayWindowId, DisplayOperations.MONITOR);
            this.checkLifeCycle();
            return;
        }
        const protocol = this.getProtocol();
        let alreadyHasMonitor = false;
        if (protocol === "ca") {
            // only one monitor allowed for a CA channel
            if (Object.keys(channel.monitors).length !== 0) {
                alreadyHasMonitor = true;

                // send Display Window the time data
                // if there is already a monitor for a channle, we won't try to create another one
                // if there is another monitor request coming from Display Window, this Window won't
                // get the DBR_TIME data until the channel updates
                // So we need to send a DBR_TIME data to this Window
                const channelAgentsManager = this.getChannelAgentsManager();
                const mainProcess = channelAgentsManager.getMainProcess();
                const windowAgentsManager = mainProcess.getWindowAgentsManager();
                const displayWindowAgent = windowAgentsManager.getAgent(displayWindowId);
                if (displayWindowAgent instanceof DisplayWindowAgent) {
                    const dbrData_time = await this.get(displayWindowId, channel.getDbrType_TIME(), 1);
                    displayWindowAgent.addNewChannelData(this.getChannelName(), dbrData_time);
                }
            }

        } else if (protocol === "pva") {
            // in here, the pv request string is the unique identifier of a monitor for a PVA channel
            // if 2 pv requests (with or without ".value") are the same, they are considered as a same monitor
            const monitors = channel.getMonitors();
            const pvRequest = this.getPvRequest();
            for (let monitor of monitors) {
                const pvRequestTmp = monitor.getPvRequest();
                if ((pvRequest === pvRequestTmp) || (pvRequest === pvRequestTmp + ".value") || (pvRequest + ".value" === pvRequestTmp)) {
                    alreadyHasMonitor = true;
                    break;
                }
            }
        }

        // each Channel only has one monitor (to save resources)
        // if (Object.keys(channel.monitors).length !== 0) {
        if (alreadyHasMonitor === true) {
            // monitor already exists, each channel only has one monitor, do nothing
            // this.reduceClientsNum();
            // this.reducePutOperation();
            // this.removeDisplayWindowOperation(displayWindowId, DisplayOperations.MONITOR);
            this.checkLifeCycle();
        } else {
            if (protocol === "ca") {
                // monitor dbrTime data
                const monitor = await channel.createMonitor(undefined, (channelMonitor: ChannelMonitor) => {
                    const channelAgentsManager = this.getChannelAgentsManager();
                    const mainProcess = channelAgentsManager.getMainProcess();
                    const windowAgentsManager = mainProcess.getWindowAgentsManager();
                    for (let displayWindowId of Object.keys(this.getDisplayWindowsOperations())) {
                        const displayWindowAgent = windowAgentsManager.getAgent(displayWindowId);
                        if (displayWindowAgent === undefined) {
                            continue;
                        } else if (displayWindowAgent instanceof DisplayWindowAgent) {
                            // let newDbrData = JSON.parse(JSON.stringify(channelMonitor.getChannel().getDbrData()));
                            let newDbrData = channelMonitor.getChannel().getDbrData();
                            displayWindowAgent.addNewChannelData(channelMonitor.getChannel().getName(), newDbrData);
                        }
                    }
                }, channel.getDbrType_TIME());

                if (monitor === undefined) {
                    this.removeDisplayWindowOperation(displayWindowId, DisplayOperations.MONITOR);
                    this.checkLifeCycle();
                    return;
                }
            } else if (protocol === "pva") {
                const monitor = await channel.createMonitorPva(undefined, this.getPvRequest(), (channelMonitor: ChannelMonitor) => {
                    const channelAgentsManager = this.getChannelAgentsManager();
                    const mainProcess = channelAgentsManager.getMainProcess();
                    const windowAgentsManager = mainProcess.getWindowAgentsManager();
                    for (let displayWindowId of Object.keys(this.getDisplayWindowsOperations())) {
                        const displayWindowAgent = windowAgentsManager.getAgent(displayWindowId);
                        if (displayWindowAgent === undefined) {
                            continue;
                        } else if (displayWindowAgent instanceof DisplayWindowAgent) {
                            // let newDbrData = JSON.parse(JSON.stringify(channelMonitor.getChannel().getDbrData()));
                            // let newPvaData = JSON.parse(JSON.stringify(channelMonitor.getPvaData()));
                            let newPvaData = channelMonitor.getPvaData();
                            displayWindowAgent.addNewChannelData(this.getChannelName(), newPvaData);
                        }
                    }
                });

                if (monitor === undefined) {
                    this.removeDisplayWindowOperation(displayWindowId, DisplayOperations.MONITOR);
                    this.checkLifeCycle();
                    return;
                }

            }
        }
    };
    /**
     * Completely destroy this channel. <br>
     *
     * (1) Invoke `Channel.destroyHard()` to disconnect and clean up. <br>
     *
     * (2) Remove this object from the `ChannelAgentsManager`.
     */
    destroyHard = () => {
        const protocol = this.getProtocol();
        try {
            // (1)
            const channel = this.getChannel();
            if (channel !== undefined) {
                channel.destroyHard();
            } else {
                // the channel may not be connected yet, in this case, this._channel is not assigned
                // but we can obtain the epics Channel object from Context
                const context = this.getChannelAgentsManager().getContext();
                if (context !== undefined && (protocol === "ca" || protocol === "pva")) {
                    const channel = context.getChannel(this.getBareChannelName(), protocol);
                    if (channel instanceof Channel) {
                        channel.destroyHard();
                    } else {
                        Log.debug("Cannot find EPICS channel for", this.getChannelName());
                    }
                } else {
                    // console.log("Error: cannot find EPICS context");
                }
            }
        } catch (e) {
            Log.error("0", e);
        }
        // (2)
        this.getChannelAgentsManager().removeChannelAgent(this.getChannelName());
    };

    getChannelAgentsManager = (): ChannelAgentsManager => {
        return this._channelAgentsManager;
    };

    // if this channel is not managed by ChannelAgentsManager, destroy it, otherwise keep it
    // CA lib re-uses the Channel object if multiple Channels with same pv name are requested
    // this soft destroy version is to avoid side effect when we want to destroy a temporary
    // CaChannelAgent which is not managed by ChannelAgentsManager
    // destroySoft = () => {
    // 	const thisChannelAgentInManager = this._channelAgentsManager.getChannelAgent(this._channelName);
    // 	if (thisChannelAgentInManager === undefined) {
    // 		if (this._channel !== undefined) {
    // 			this._channel.destroyHard();
    // 		}
    // 	}
    // };

    getMonitor = (): ChannelMonitor | undefined => {
        return this._monitor;
    };

    getChannelName = (): string => {
        return this._channelName;
    };


    /**
     * channelName: pva://neutrons.proton_charge.timeStamp
     * 
     * bareChannelName: neutrons
     * 
     * pvRequest: proton_charge.timeStamp
     * 
     */
    getBareChannelName = (): string => {
        if (this.getProtocol() === "pva") {
            // pva://demo:abc --> demo:abc
            // pva://demo:abc.EGU --> demo:abc.EGU, one full pv name
            // pva://demo:abc/timeStamp/nanoseconds --> pva://demo:abc
            return this.getChannelName().replace("pva://", "").split("/")[0]
        } else if (this.getProtocol() === "ca") {
            return this.getChannelName().replace("ca://", "");
        }
        return this.getChannelName();
    };

    // -------------------- display windows -----------------------

    initDisplayWindowOperations = (displayWindowId: string) => {
        const operations = this._displayWindowsOperations[displayWindowId];
        if (operations === undefined) {
            this._displayWindowsOperations[displayWindowId] = [0, 0, 0, 0];
        } else {
            // do nothing
        }
    };

    addDisplayWindowOperation = (displayWindowId: string, operation: DisplayOperations) => {
        const operations = this._displayWindowsOperations[displayWindowId];
        if (operations === undefined) {
            return;
        } else {
            if (operation === DisplayOperations.GET) {
                operations[0] = operations[0] + 1;
            } else if (operation === DisplayOperations.PUT) {
                operations[1] = operations[1] + 1;
            } else if (operation === DisplayOperations.MONITOR) {
                operations[2] = operations[2] + 1;
            } else if (operation === DisplayOperations.CONNECT) {
                operations[3] = operations[3] + 1;
            } else {
                // do nothing
            }
        }
    };

    removeDisplayWindowOperation = (displayWindowId: string, operation: DisplayOperations) => {
        const operations = this._displayWindowsOperations[displayWindowId];
        if (operations === undefined) {
            return;
        } else {
            if (operation === DisplayOperations.GET) {
                operations[0] = operations[0] - 1;
            } else if (operation === DisplayOperations.PUT) {
                operations[1] = operations[1] - 1;
            } else if (operation === DisplayOperations.MONITOR) {
                operations[2] = operations[2] - 1;
            } else if (operation === DisplayOperations.CONNECT) {
                operations[3] = operations[3] - 1;
            } else {
                // do nothing
            }
        }
    };

    removeDisplayWindowOperations = (displayWindowId: string) => {
        delete this._displayWindowsOperations[displayWindowId];
    };

    getDisplayWindowOperations = (displayWindowId: string): [number, number, number, number] | undefined => {
        return this._displayWindowsOperations[displayWindowId];
    };

    getDisplayWindowsOperations = () => {
        return this._displayWindowsOperations;
    };

    // ------------------- data ----------------------------

    updateChannelAndMonitor = (monitor: ChannelMonitor) => {
        this._monitor = monitor;
        this._channel = monitor.getChannel();
    };

    /**
     * Get channel access right <br>
     *
     * @returns {string} The choice in `enum Channel_ACCESS_RIGHTS`
     */
    getAccessRight = (): string => {
        const channel = this.getChannel();
        if (channel === undefined) {
            return "NOT_AVAILABLE";
        } else {
            return channel.getAccessRightStr();
        }
    };

    /**
     * Get channel state. Copy of the Channel object's state. <br>
     *
     * @returns {string} The choice in `enum Channel_STATES`
     */
    getStateStr = (): string => {
        const channel = this.getChannel();
        let result = "NOT_AVAILABLE";
        if (channel === undefined) {
        } else {
            result = channel.getStateStr();
        }
        this._oldStateStr = result;
        return result;
    };

    // ---------------- DBR type -------------------

    /**
     * Obtain where this channel come from. <br>
     *
     * @returns {string} In format of "address:port", empty if the channel is not connected.
     */
    getServerAddress = (): string => {
        const channel = this.getChannel();
        if (channel === undefined) {
            return "";
        } else {
            const tcpTransport = channel.getTcpTransport();
            if (tcpTransport === undefined) {
                return "";
            } else {
                const address = tcpTransport.getServerAddress();
                const port = tcpTransport.getServerPort();
                return `${address}:${port}`;
            }
        }
    };

    /**
     * Obtain the DBR GR type for this channel.
     *
     * @returns {Channel_DBR_TYPES | undefined} `undefined` if the channel is not
     * connected/exist.
     */
    getDbrTypeNum_GR = (): Channel_DBR_TYPES | undefined => {
        const channel = this.getChannel();
        if (channel === undefined) {
            return undefined;
        } else {
            return channel.getDbrType_GR();
        }
    };

    /**
     * Obtain the basic DBR type for this channel.
     */
    getDbrTypeNum_RAW = (): Channel_DBR_TYPES | undefined => {
        const channel = this.getChannel();
        if (channel === undefined) {
            return undefined;
        } else {
            return channel.getDbrType();
        }
    };

    getDbrTypeNum_STS = (): Channel_DBR_TYPES | undefined => {
        const channel = this.getChannel();
        if (channel === undefined) {
            return undefined;
        } else {
            return channel.getDbrType_STS();
        }
    };

    getDbrTypeNum_TIME = (): Channel_DBR_TYPES | undefined => {
        const channel = this.getChannel();
        if (channel === undefined) {
            return undefined;
        } else {
            return channel.getDbrType_TIME();
        }
    };

    getDbrTypeNum_CTRL = (): Channel_DBR_TYPES | undefined => {
        const channel = this.getChannel();
        if (channel === undefined) {
            return undefined;
        } else {
            return channel.getDbrType_CTRL();
        }
    };

    getValueCount = () => {
        const channel = this.getChannel();
        if (channel === undefined) {
            return undefined;
        } else {
            return channel.getValueCount();
        }
    };

    getOldStateStr = () => {
        return this._oldStateStr;
    };

    getProtocol = () => {
        const channelName = this.getChannelName();
        const channelAgentsManager = this.getChannelAgentsManager();
        return channelAgentsManager.determineChannelType(channelName);
    }

    /**
     * pva://demo:abc.EGU --> ""
     * pva://demo:abc/timeStamp/nanoseconds --> "timeStamp.nanoseconds"
     * pva://demo:abc --> ""
     */
    getPvRequest = (): string => {
        if (this.getProtocol() === "ca") {
            return "";
        } else {
            const channelNameArray = this.getChannelName().replace("pva://", "").split("/");
            if (channelNameArray.length === 1) {
                return "";
            } else {
                return channelNameArray.slice(1).join(".");
            }
        }
    }

}
