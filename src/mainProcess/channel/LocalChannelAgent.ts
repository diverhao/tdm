import { ChannelAgentsManager } from "./ChannelAgentsManager";
import { DisplayWindowAgent } from "../windows/DisplayWindow/DisplayWindowAgent";
import { DisplayOperations } from "./CaChannelAgent";
import EventEmitter from "events";
import { converEpochTimeToEpicsTimeStamp } from "../../common//GlobalMethods";


export type type_LocalChannel_data = {
    value: number | string | number[] | string[] | undefined;
    type?: "number" | "string" | "number[]" | "string[]" | "enum";
    // for enum, if "strings" is empty or not long enough, we will use "0", "1" ... as enum names
    strings?: string[];
} & Record<string, any>;

export class LocalChannelAgent {
    _dbrData: type_LocalChannel_data;
    _channelAgentsManager: ChannelAgentsManager;
    _displayWindowIds: string[] = [];
    _channelName: string;
    metaDataInitialized: boolean = false;
    monitorEvent: EventEmitter = new EventEmitter();
    /**
     * The display windows that contain this channel. Pair of window ID and DisplayWindowAgent object.
     */
    private _displayWindowsOperations: Record<string, [number, number, number]> = {};
    // private _mainProcessId: string;

    constructor(
        channelAgentsManager: ChannelAgentsManager,
        channelName: string,
        channelType: "number" | "string" | "number[]" | "string[]" | "enum" = "number",
        channelValue: number | string | number[] | string[] = 0,
        channelStrings: string[] = []
    ) {
        this._channelAgentsManager = channelAgentsManager;
        this._channelName = channelName;
        // this._mainProcessId = channelAgentsManager.getMainProcess().getProcessId();
        this._dbrData = {
            // the only property that should be changed after initialization
            value: channelValue,
            type: channelType,
            strings: channelStrings,
            secondsSinceEpoch: 0,
            nanoSeconds: 0,
        };
    }

    setDbrType = (newType: "number" | "string" | "number[]" | "string[]" | "enum") => {
        this.getDbrData()["type"] = newType;
    };

    setDbrStrings = (newStrings: string[]) => {
        this.getDbrData()["strings"] = newStrings;
    };

    getValue = () => {
        return this.getDbrData()["value"];
    };

    setValue = (newValue: number | string | number[] | string[] | undefined) => {
        this.getDbrData()["value"] = newValue;
    };

    getDbrType = () => {
        return this.getDbrData()["type"];
    };

    setDbrTime = () => {
        const timeNow = Date.now();
        const epochTimeNow = converEpochTimeToEpicsTimeStamp(timeNow);
        const secondsSinceEpoch = Math.floor(epochTimeNow / 1000);
        const nanoSeconds = (epochTimeNow - Math.floor(epochTimeNow)) * 1000 * 1000;
        this.getDbrData()["secondsSinceEpoch"] = secondsSinceEpoch;
        this.getDbrData()["nanoSeconds"] = nanoSeconds;
    }

    /**
     * PUT operation is initiated from renderer process. This operation is
     * considered as reliable: the channel is always available, if there is
     * no such a channel exists, create it and put it.
     */
    put = (displayWindowId: string, dbrData: type_LocalChannel_data) => {
        // synchronous and one-time operation, no need
        // this.addDisplayWindowOperation(displayWindowId, DisplayOperations.PUT);

        let dbrDataChanged = false;
        if ((dbrData["strings"] !== undefined || dbrData["type"] !== undefined) && this.metaDataInitialized === false) {
            this.metaDataInitialized = true;
            dbrDataChanged = true;
            if (dbrData["type"] !== undefined) {
                this.setDbrType(dbrData["type"]);
            }
            if (dbrData["strings"] !== undefined) {
                this.setDbrStrings(dbrData["strings"]);
            }
        }

        // update value,
        let newValue = dbrData["value"];
        const oldValue = this.getDbrData()["value"];
        if (oldValue === newValue) {
            dbrDataChanged = false;
        } else {
            // the new value must be the same type as the type
            if (this.getDbrType() === "number") {
                if (typeof newValue === "number") {
                    this.setValue(newValue);
                    dbrDataChanged = true;
                }
            } else if (this.getDbrType() === "string") {
                if (typeof newValue === "string") {
                    this.setValue(newValue);
                    dbrDataChanged = true;
                }
            } else if (this.getDbrType() === "number[]") {
                if (Array.isArray(newValue)) {
                    let arrayIsCorrectType = true;
                    for (const element of newValue) {
                        if (typeof element !== "number") {
                            arrayIsCorrectType = false;
                            break;
                        }
                    }
                    if (arrayIsCorrectType === true) {
                        this.setValue(newValue);
                        dbrDataChanged = true;
                    }
                }
            } else if (this.getDbrType() === "string[]") {
                if (Array.isArray(newValue)) {
                    let arrayIsCorrectType = true;
                    for (const element of newValue) {
                        if (typeof element !== "string") {
                            arrayIsCorrectType = false;
                            break;
                        }
                    }
                    if (arrayIsCorrectType === true) {
                        this.setValue(newValue);
                        dbrDataChanged = true;
                    }
                }
            } else if (this.getDbrType() === "enum") {
                if (typeof newValue === "number") {
                    const strings = this.getDbrData()["strings"];
                    if (strings !== undefined && strings[newValue] !== undefined) {
                        this.setValue(newValue);
                        dbrDataChanged = true;
                    }
                } else if (typeof newValue === "string") {
                    const strings = this.getDbrData()["strings"];
                    if (strings !== undefined && strings.includes(newValue)) {
                        this.setValue(strings.indexOf(newValue));
                        dbrDataChanged = true;
                    }
                }

            }
        }

        // force update, without changing the value, like .PROC in EPICS PV
        if (dbrData["PROC"] === true) {
            dbrDataChanged = true;
            newValue = oldValue;
        }

        if (!dbrDataChanged) {
            return;
        }

        this.setDbrTime();

        // send the new value to all display windows
        const channelAgentsManager = this.getChannelAgentsManager();
        const mainProcess = channelAgentsManager.getMainProcess();
        const windowAgentsManager = mainProcess.getWindowAgentsManager();
        for (let displayWindowId of this._displayWindowIds) {
            const displayWindowAgent = windowAgentsManager.getAgent(displayWindowId);
            if (displayWindowAgent instanceof DisplayWindowAgent) {
                displayWindowAgent.addNewChannelData(this.getChannelName(), {
                    value: newValue,
                });
            }
        }
        if (dbrDataChanged) {
            this.monitorEvent.emit("PUT");
        }
    };

    createMonitor = (displayWindowId: string): void => {
        this.addDisplayWindowOperation(displayWindowId, DisplayOperations.MONITOR);

        // only one listener allowed
        if (this.monitorEvent.listenerCount("PUT") > 0) {
            return;
        }
        // listen to PUT operation,
        this.monitorEvent.on("PUT", () => {
            const channelAgentsManager = this.getChannelAgentsManager();
            const mainProcess = channelAgentsManager.getMainProcess();
            const windowAgentsManager = mainProcess.getWindowAgentsManager();
            for (let displayWindowId of Object.keys(this.getDisplayWindowsOperations())) {
                const displayWindowAgent = windowAgentsManager.getAgent(displayWindowId);
                if (displayWindowAgent === undefined) {
                    continue;
                }
                (displayWindowAgent as DisplayWindowAgent).addNewChannelData(this.getChannelName(), this.getDbrData());
            }
        });
    };

    /**
     * Completely destroy this channel. <br>
     *
     * (1) Invoke `Channel.destroyHard()` to disconnect and clean up. <br>
     *
     * (2) Remove this object from the `ChannelAgentsManager`.
     */
    destroyHard = () => {
        this.getChannelAgentsManager().removeChannelAgent(this.getChannelName());
        // remove all listeners
        this.monitorEvent.removeAllListeners();
    };

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
            total = total + operations[0] + operations[1] + operations[2];
        }
        if (total === 0) {
            // (1)
            this.destroyHard();
            // (2)
            this.getChannelAgentsManager().removeChannelAgent(this.getChannelName());
        }
    };

    getChannelAgentsManager = () => {
        return this._channelAgentsManager;
    };

    getDbrData = () => {
        return this._dbrData;
    };

    // getDisplayWindowIds = () => {
    // 	return this._displayWindowIds;
    // };

    // hasDisplayWindowId = (displayWindowId: string) => {
    // 	return this.getDisplayWindowIds().includes(displayWindowId);
    // };

    getChannelName = () => {
        return this._channelName;
    };

    // -------------------------- display window ------------------

    initDisplayWindowOperations = (displayWindowId: string) => {
        const operations = this._displayWindowsOperations[displayWindowId];
        if (operations === undefined) {
            this._displayWindowsOperations[displayWindowId] = [0, 0, 0];
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
            } else {
                // do nothing
            }
        }
    };

    removeDisplayWindowOperations = (displayWindowId: string) => {
        delete this._displayWindowsOperations[displayWindowId];
    };

    getDisplayWindowOperations = (displayWindowId: string): [number, number, number] | undefined => {
        return this._displayWindowsOperations[displayWindowId];
    };

    getDisplayWindowsOperations = () => {
        return this._displayWindowsOperations;
    };
    // getMainProcessId = () => {
    //     return this._mainProcessId;
    // };
}
