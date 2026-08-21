import {
    Channel_ACCESS_RIGHTS,
    Channel_DBR_TYPE,
    type_dbrData,
    verifyDbrData,
    CA_ALARM_STATUS,
    CA_ALARM_SEVRITY,
} from "../../common/Epics";
import { g_widgets1 } from "../global/GlobalVariables";
import { BaseWidget } from "../widgets/BaseWidget/BaseWidget";
import { rendererWindowStatus } from "../global/Widgets";
import * as GlobalMethods from "../../common/GlobalMethods";
import { Log } from "../../common/Log";
import { EpicsDate } from "../../common/EpicsTime";
import { type_dbr_value } from "epics-tca";
import { g_flushWidgets } from "../helperWidgets/Root/Root";

// severity cannot be used to determine if the channel is connected or not
// CA_ALARM_SEVRITY.UDF may mean the channel is never processed
export enum ChannelState {
    NOT_CONNECTED,
    CONNECTED
}

/**
 * Represents a CA channel on renderer window. <br>
 *
 * Whenever the channel in display window is disconnected/reconnected, this object is destroyed, all its
 * relationships with widgets are disconnected. <br>
 * 
 * input channelName is level 3: macro/windowId expanded, meta kept, 
 * e.g. abc, loc://abc@window_1-2, glb://abc<string>, glb://abc<number[]>([1,2,3])
 * 
 * The local/global channel initial values are used to initialize the channel in main process.
 */
export class CaChannel {
    private readonly _channelName: string = "";
    private _channelState: ChannelState = ChannelState.NOT_CONNECTED;

    // meta data
    private _valueCount: number = 0;
    private _valueType: Channel_DBR_TYPE = Channel_DBR_TYPE.NOT_AVAILABLE;
    private _serverAddr: string = "";
    private _accessRight: Channel_ACCESS_RIGHTS = Channel_ACCESS_RIGHTS.NOT_AVAILABLE;

    private _widgetKeys: Set<string> = new Set();

    // Common fields in a DBR data
    // there are many other fields depending on the value's type
    private _dbrData: type_dbrData = {
        value: 0,
        status: CA_ALARM_STATUS.UDF,
        severity: CA_ALARM_SEVRITY.INVALID,
        secondsSinceEpoch: 0,
        nanoSeconds: 0,
    };


    /**
     * Create a renderer-side representation of a Channel Access channel.
     *
     * The name is assumed to have already been expanded and validated. Accepted
     * forms include `ABC:DEF`, `ABC:DEF.RVAL`, and the corresponding `ca://`
     * forms.
     *
     * @param channelName Fully expanded CA channel name.
     */
    constructor(channelName: string) {
        this._channelName = channelName;
    }


    // --------------------- GET, PUT, and MONITOR operations ---------------------

    /**
     * Request channel data from the main process and merge the response into the
     * local DBR cache.
     *
     * The request is registered as a pending read operation using the same
     * timeout. Completion and rendering are coordinated by the corresponding IPC
     * result handler. Failures are logged and are not rethrown.
     *
     * @param ioTimeout Maximum time, in seconds, to wait for the GET operation;
     * `0` disables the renderer-side timeout.
     * @returns A promise that settles after the response is cached or the failure
     * is logged.
     */
    get = async (
        ioTimeout: number,
    ): Promise<void> => {

        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
        const ipcManager = displayWindowClient.getIpcManager();

        ipcManager.sendFromRendererProcess("tca-get",
            {
                channelName: this.getChannelName(),
                ioTimeout: ioTimeout,
            }
        )
    };

    handleGetResult = (newDbrData: type_dbrData) => {
        this.appendToDbrData(newDbrData);
        const widgetKeys = this.getWidgetKeys();
        for (let key of widgetKeys) {
            g_widgets1.addToForceUpdateWidgets(key);
        }
        g_flushWidgets();
    }


    /**
     * Request the channel's initial graphic metadata and connection properties.
     *
     * This should be the first operation performed for the channel. The response
     * is merged into the DBR cache and supplies the server address, native value
     * count, native DBR type, and access rights. A successful response marks the
     * channel connected.
     *
     * The pending metadata read intentionally has no timeout and is rejected only
     * when channel cleanup rejects its outstanding operations.
     *
     * @returns A promise that settles after metadata is cached or the failure is
     * logged.
     */
    getMeta = async (): Promise<void> => {

        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
        const ipcManager = displayWindowClient.getIpcManager();

        ipcManager.sendFromRendererProcess("tca-get-meta",
            {
                channelName: this.getChannelName(),
            }
        );
    };

    handleGetMetaResult = (newDbrGrData: any, serverAddr: string, dataType: Channel_DBR_TYPE, dataCount: number, accessRight: Channel_ACCESS_RIGHTS) => {
        this.appendToDbrData(newDbrGrData);
        this.setServerAddr(serverAddr);
        this.setValueCount(dataCount);
        this.setValueType(dataType);
        this.setAccessRight(accessRight);

        this.setChannelState(ChannelState.CONNECTED);
        const widgetKeys = this.getWidgetKeys();
        for (let key of widgetKeys) {
            g_widgets1.addToForceUpdateWidgets(key);
        }
        g_flushWidgets();

    }

    /**
     * Parse a user-entered value according to this channel's native DBR type and
     * submit a Channel Access PUT request to the main process.
     *
     * Numeric arrays use comma-separated elements, for example `"1, 2.5, -3"`.
     * The number of elements must not exceed {@link getValueCount}. Integer-like
     * values are truncated toward zero, so `"12.8"` becomes `12` and `"-12.8"`
     * becomes `-12`.
     *
     * Accepted inputs and parser bounds are:
     *
     * - `DBR_STRING`: one string, truncated to 39 characters; string arrays are
     *   not supported.
     * - `DBR_INT`/`DBR_SHORT`: `-32768` through `32767`.
     * - `DBR_FLOAT`: `-3.4028234663852886e38` through
     *   `3.4028234663852886e38`.
     * - `DBR_ENUM`: an enum label such as `"OPEN"`, or a numeric value from `0`
     *   through `32767`. A label match takes precedence over numeric parsing.
     * - `DBR_CHAR`: `0` through `127`.
     * - `DBR_LONG`: `-2147483648` through `2147483647`.
     * - `DBR_DOUBLE`: any finite JavaScript number.
     *
     * Status, time, graphic, and control DBR variants are parsed according to
     * their corresponding base DBR type. The request is sent only when the
     * channel is connected, its DBR type is available, and every input element
     * parses successfully. Failures are caught and logged.
     *
     * This method resolves after queuing the IPC request; it does not wait for
     * write acknowledgement or IOC readback.
     *
     * @param dbrValueStr User-entered scalar value or comma-separated numeric
     * array.
     * @returns A promise that resolves after the PUT request is queued or the
     * failure is logged.
     */
    put = async (dbrValueStr: string): Promise<void> => {
        try {
            const value = this.parseInput(dbrValueStr);

            let channelName = this.getChannelName();

            g_widgets1
                .getRoot()
                .getDisplayWindowClient()
                .getIpcManager()
                .sendFromRendererProcess("tca-put",
                    {
                        channelName: channelName,
                        dbrData: { value: value },
                    }

                )
        } catch (e) {
            Log.error(e);
        }

    };

    private parseInput = (dbrValueStr: string): type_dbr_value => {

        // Reject writes until the channel has completed its initial connection.
        if (this.getChannelState() !== ChannelState.CONNECTED) {
            throw new Error("Failed to parse input value");
        }

        // Require a supported DBR type before interpreting the input.
        const dbrType = this.getValueType();
        if (dbrType === Channel_DBR_TYPE.NOT_AVAILABLE || dbrType > 34) {
            throw new Error("Channel has no DBR type yet or DBR type wrong");
        }

        const dbrTypeBase = dbrType % 7;

        // DBR_STRING input is scalar; string arrays are not supported.
        if (dbrTypeBase === Channel_DBR_TYPE.DBR_STRING) {
            // Enforce the parser's 39-character DBR_STRING limit.
            return dbrValueStr.slice(0, 39);
        }

        const strArr = dbrValueStr.split(",");
        let result: number[] = [];
        for (const str of strArr) {
            result.push(this.parseScalarInputForNumber(str, dbrTypeBase));
        }

        if (result.length > this.getValueCount()) {
            throw new Error("Trying to PUT more elements than data count");
        }

        if (result.length === 1) {
            return result[0]; // Preserve scalar input as a scalar DBR value.
        } else {
            return result; // Preserve multiple elements as a DBR array value.
        }
    }


    private parseScalarInputForEnum = (dbrValueStr: string): number => {
        const strings = this.getDbrData().strings;
        if (!Array.isArray(strings)) {
            throw new Error("No strings for DBR enum");
        }

        if (strings.includes(dbrValueStr.trim())) {
            // Prefer an exact enum-label match over numeric parsing.
            return strings.indexOf(dbrValueStr.trim());
        } else {
            // Otherwise interpret the input as a numeric enum index.
            const valueFloat = parseFloat(dbrValueStr);
            if (isNaN(valueFloat) || valueFloat > 32767 || valueFloat < 0) {
                throw new Error(`Failed to parse value ${dbrValueStr} or overflow`);
            } else {
                return Math.trunc(valueFloat);
            }
        }
    }


    /**
     * Parse one numeric input element according to its base DBR type.
     *
     * Enum elements may be either numeric indices or labels. Integer-like values
     * are truncated toward zero after their range is validated.
     *
     * @param dbrValueStr User-entered scalar element.
     * @param dbrTypeBase Base DBR type used for parsing and range validation.
     * @returns Parsed numeric DBR value.
     * @throws When the value is invalid, outside the supported range, or has an
     * unsupported DBR type.
     */
    private parseScalarInputForNumber = (dbrValueStr: string, dbrTypeBase: Channel_DBR_TYPE): number => {


        if (dbrTypeBase === Channel_DBR_TYPE.DBR_INT) {
            const valueFloat = parseFloat(dbrValueStr);
            if (isNaN(valueFloat) || valueFloat > 32767 || valueFloat < -32768) {
                throw new Error(`Failed to parse value ${dbrValueStr} or overflow`);
            } else {
                return Math.trunc(valueFloat);
            }
        } else if (dbrTypeBase === Channel_DBR_TYPE.DBR_FLOAT) {
            const valueFloat = parseFloat(dbrValueStr);
            if (isNaN(valueFloat) || valueFloat > 3.4028234663852886e38 || valueFloat < -3.4028234663852886e38) {
                throw new Error(`Failed to parse value ${dbrValueStr} or overflow`);
            } else {
                return valueFloat;
            }
        } else if (dbrTypeBase === Channel_DBR_TYPE.DBR_ENUM) {
            return this.parseScalarInputForEnum(dbrValueStr);
        } else if (dbrTypeBase === Channel_DBR_TYPE.DBR_CHAR) {
            const valueFloat = parseFloat(dbrValueStr);
            if (isNaN(valueFloat) || valueFloat > 127 || valueFloat < 0) {
                throw new Error(`Failed to parse value ${dbrValueStr} or overflow`);
            } else {
                return Math.trunc(valueFloat);
            }
        } else if (dbrTypeBase === Channel_DBR_TYPE.DBR_LONG) {
            const valueFloat = parseFloat(dbrValueStr);
            if (isNaN(valueFloat) || valueFloat > 2147483647 || valueFloat < -2147483648) {
                throw new Error(`Failed to parse value ${dbrValueStr} or overflow`);
            } else {
                return Math.trunc(valueFloat);
            }
        } else if (dbrTypeBase === Channel_DBR_TYPE.DBR_DOUBLE) {
            const valueFloat = parseFloat(dbrValueStr);
            if (isNaN(valueFloat) || !Number.isFinite(valueFloat)) {
                throw new Error(`Failed to parse value ${dbrValueStr} or overflow`);
            } else {
                return valueFloat;
            }
        } else {
            throw new Error(`Unknown DBR type ${dbrTypeBase}`);
        }
    };

    /**
     * Ask the main process to subscribe to DBR_TIME updates for this channel.
     *
     * Monitor updates arrive asynchronously through the shared channel-data IPC
     * path and are merged into the local DBR cache by its handler.
     */
    monitor = () => {
        const windowId = g_widgets1.getRoot().getDisplayWindowClient().getWindowId();
        g_widgets1.getRoot().getDisplayWindowClient().getIpcManager().sendFromRendererProcess("tca-monitor",
            {
                displayWindowId: windowId,
                channelName: this.getChannelName()
            }
        );
    };

    // --------------------- lifecycle ---------------------

    /**
     * Detach this channel from one widget or from every subscribing widget.
     *
     * The method removes the reverse channel reference from the affected widgets
     * and updates this channel's widget-key set. When no widgets remain, it marks
     * the channel disconnected, removes it from the renderer registry, rejects
     * outstanding renderer I/O, and asks the main process to release the channel
     * for this display window.
     *
     * @param widgetKey Widget to detach, or `undefined` to detach every widget and
     * fully release the renderer-side channel.
     */
    destroy = (widgetKey: string | undefined) => {
        // Collect the widgets whose reverse channel references must be removed.
        let widgetKeys: string[] = [];
        if (widgetKey === undefined) {
            widgetKeys = [...this.getWidgetKeys()];
        } else {
            widgetKeys = [widgetKey];
        }
        for (let widgetKey of widgetKeys) {
            try {
                const widget = g_widgets1.getWidget2(widgetKey);
                if (widget instanceof BaseWidget) {
                    const channelNames = widget.getChannelNames();
                    let index = channelNames.indexOf(this.getChannelName());
                    if (index > -1) {
                        channelNames.splice(index, 1);
                    }
                }
            } catch (e) {
                Log.error(e);
                // Continue cleaning up the remaining widgets.
            }
        }
        // Update renderer-side ownership.
        if (widgetKey === undefined) {
            this.getWidgetKeys().clear();
        } else {
            this.getWidgetKeys().delete(widgetKey);
        }

        if (this.getWidgetKeys().size === 0) {
            // Fully release the channel after its final widget detaches.
            this.setChannelState(ChannelState.NOT_CONNECTED);

            delete g_widgets1.getTcaChannels()[this.getChannelName()];

            g_widgets1.getReadWriteIos().rejectChannelIos(this);
            const windowId = g_widgets1.getRoot().getDisplayWindowClient().getWindowId();
            g_widgets1.getRoot().getDisplayWindowClient().getIpcManager().sendFromRendererProcess("tca-destroy",
                {
                    displayWindowId: windowId,
                    channelName: this.getChannelName()
                }
            );
        }
    };

    // ----------------------- getters ------------------------

    // Display metadata is initialized from DBR_GR data and subsequently updated by
    // monitored DBR_TIME data. These getters read only the renderer-side cache.


    /**
     * Return the cached value in the form expected by display widgets.
     *
     * In editing mode, or while the channel is disconnected, the channel name is
     * returned. For an enum channel, the numeric value is converted to its label
     * when a matching choice exists unless `raw` is `true`. No network operation
     * is performed.
     *
     * @param raw Return the numeric enum index instead of its label.
     * @returns The channel name, cached scalar or array value, or `undefined` when
     * the connected channel has no cached value.
     */
    getValueForDisplay = (raw: boolean = false): string | number | number[] | string[] | undefined => {
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return this.getChannelName();
        }
        if (!this.isConnected()) {
            return this.getChannelName();
        }


        let value = this.getDbrData()["value"];

        // Convert a cached enum index to its display label when requested.
        if (raw === false) {
            const choices = this.getDbrData().strings;
            if (choices !== undefined && typeof value === "number") {
                const result = choices[value];
                if (typeof result === "string") {
                    return result;
                }
            }
        }
        return value;
    };


    /**
     * Return the cached Channel Access alarm severity.
     *
     * Editing mode always returns {@link CA_ALARM_SEVRITY.NO_ALARM}. Cached values
     * `0`, `1`, and `2` map to `NO_ALARM`, `MINOR`, and `MAJOR`; every other or
     * missing value maps to `INVALID`.
     *
     * @returns Normalized CA alarm severity.
     */
    getSeverity = (): CA_ALARM_SEVRITY => {
        // Editing mode suppresses runtime alarm styling.
        if (g_widgets1.isEditing()) {
            return CA_ALARM_SEVRITY.NO_ALARM;
        }

        const severityNum = this.getDbrData()["severity"];
        if (severityNum === 0) {
            return CA_ALARM_SEVRITY.NO_ALARM;
        } else if (severityNum === 1) {
            return CA_ALARM_SEVRITY.MINOR;
        } else if (severityNum === 2) {
            return CA_ALARM_SEVRITY.MAJOR;
        } else {
            return CA_ALARM_SEVRITY.INVALID;
        }
    }

    getSeverityStr = () => {
        const severityNum = this.getSeverity();
        return CA_ALARM_SEVRITY[severityNum];
    }

    /**
     * Return the cached Channel Access alarm status.
     *
     * Editing mode returns {@link CA_ALARM_STATUS.NO_ALARM}; an unavailable cached
     * status returns {@link CA_ALARM_STATUS.UDF}.
     *
     * @returns Current normalized CA alarm status.
     */
    getStatus = (): CA_ALARM_STATUS => {
        // Editing mode suppresses runtime alarm styling.
        if (g_widgets1.isEditing()) {
            return CA_ALARM_STATUS.NO_ALARM;
        }
        return this.getDbrData()["status"] ?? CA_ALARM_STATUS.UDF;
    };


    getStatusStr = () => {
        const alarmStatusNum = this.getStatus();
        return CA_ALARM_STATUS[alarmStatusNum];
    }

    /**
     * Return the channel's cached engineering unit.
     *
     * @returns The engineering-unit string, or an empty string in editing mode or
     * when the metadata is unavailable.
     */
    getUnit = (): string => {
        if (g_widgets1.isEditing()) {
            return "";
        }
        return this.getDbrData()["units"] ?? "";
    };


    /**
     * Return the effective Channel Access permission for this display window.
     *
     * Outside operating mode, the result is `NOT_AVAILABLE`. When the selected
     * profile disables PUT operations, the result is restricted to `READ_ONLY`;
     * otherwise the cached server-provided access right is returned.
     *
     * @returns Effective channel access right.
     */
    getAccessRight = (): Channel_ACCESS_RIGHTS => {
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return Channel_ACCESS_RIGHTS.NOT_AVAILABLE;
        }

        // Apply the selected profile's PUT restriction to the cached access right.
        const allowPutByProfile = g_widgets1.getRoot().getDisplayWindowClient().allowPut();
        if (allowPutByProfile === false) {
            return Channel_ACCESS_RIGHTS.READ_ONLY;
        }

        return this._accessRight;
    };

    getAccessRightStr = () => {
        const right = this.getAccessRight();
        return Channel_ACCESS_RIGHTS[right];
    }

    /**
     * Return the cached upper display limit.
     *
     * @returns Cached limit, or `0` while editing or when unavailable.
     */
    getUpperDisplayLimit = (): number => {
        if (g_widgets1.isEditing()) {
            return 0;
        }
        return this.getDbrData()["upper_display_limit"] ?? 0;
    };

    /**
     * Return the cached lower display limit.
     *
     * @returns Cached limit, or `0` while editing or when unavailable.
     */
    getLowerDisplayLimit = (): number => {
        if (g_widgets1.isEditing()) {
            return 0;
        }
        return this.getDbrData()["lower_display_limit"] ?? 0;
    };

    /**
     * Return the cached upper warning limit.
     *
     * @returns Cached limit, or `0` while editing or when unavailable.
     */
    getUpperWarningLimit = (): number => {
        if (g_widgets1.isEditing()) {
            return 0;
        }
        return this.getDbrData()["upper_warning_limit"] ?? 0;
    };

    /**
     * Return the cached lower warning limit.
     *
     * @returns Cached limit, or `0` while editing or when unavailable.
     */
    getLowerWarningLimit = (): number => {
        if (g_widgets1.isEditing()) {
            return 0;
        }
        return this.getDbrData()["lower_warning_limit"] ?? 0;
    };

    /**
     * Return the cached upper control limit.
     *
     * @returns Cached limit, or `0` while editing or when unavailable.
     */
    getUpperCtrlLimit = (): number => {
        if (g_widgets1.isEditing()) {
            return 0;
        }
        return this.getDbrData()["upper_ctrl_limit"] ?? 0;
    };

    /**
     * Return the cached lower control limit.
     *
     * @returns Cached limit, or `0` while editing or when unavailable.
     */
    getLowerCtrlLimit = (): number => {
        if (g_widgets1.isEditing()) {
            return 0;
        }
        return this.getDbrData()["lower_ctrl_limit"] ?? 0;
    };

    /**
     * Return the cached upper alarm limit.
     *
     * @returns Cached limit, or `0` while editing or when unavailable.
     */
    getUpperAlarmLimit = (): number => {
        if (g_widgets1.isEditing()) {
            return 0;
        }
        return this.getDbrData()["upper_alarm_limit"] ?? 0;
    };

    /**
     * Return the cached lower alarm limit.
     *
     * @returns Cached limit, or `0` while editing or when unavailable.
     */
    getLowerAlarmLimit = (): number => {
        if (g_widgets1.isEditing()) {
            return 0;
        }
        return this.getDbrData()["lower_alarm_limit"] ?? 0;
    };

    /**
     * Return the cached Channel Access timestamp as an {@link EpicsDate}.
     *
     * `secondsSinceEpoch` is measured from the EPICS epoch and `nanoSeconds` is
     * converted to milliseconds. Editing mode and unavailable timestamp fields
     * return the EPICS epoch.
     *
     * @returns Cached timestamp, or the EPICS epoch when unavailable.
     */
    getTimeStamp = (): EpicsDate => {
        if (g_widgets1.isEditing()) {
            return EpicsDate.fromEpicsTimeMs(0);
        }

        const secondsSinceEpoch = this.getDbrData()["secondsSinceEpoch"];
        const nanoseconds = this.getDbrData()["nanoSeconds"];
        if (secondsSinceEpoch === undefined || nanoseconds === undefined) {
            return EpicsDate.fromEpicsTimeMs(0);
        }
        const msSince1990UTC = 1000 * secondsSinceEpoch + nanoseconds * 1e-6;
        return EpicsDate.fromEpicsTimeMs(msSince1990UTC);
    };
    /**
     * Return the cached display precision.
     *
     * @returns Cached precision, or `0` while editing or when unavailable.
     */
    getPrecision = (): number => {
        if (g_widgets1.isEditing()) {
            return 0;
        }
        return this.getDbrData()["precision"] ?? 0;
    };

    /**
     * Return the cached labels for an enum channel.
     *
     * @returns The DBR `strings` array, or an empty array in editing mode or when
     * enum metadata is unavailable.
     */
    getEnumChoices = (): string[] => {
        if (g_widgets1.isEditing()) {
            return [];
        }
        return this.getDbrData()["strings"] ?? [];
    };

    /**
     * Return the number of enum labels reported by the channel.
     *
     * @returns The cached `number_of_string_used` value, or `0` in editing mode or
     * when enum metadata is unavailable.
     */
    getNumerOfStringsUsed = (): number => {
        if (g_widgets1.isEditing()) {
            return 0;
        }
        return this.getDbrData()["number_of_string_used"] ?? 0;
    };

    /**
     * Determine whether the channel's native DBR type is `DBR_ENUM`.
     *
     * @returns `true` for a native enum channel; otherwise `false`.
     */
    isEnumType = (): boolean => {
        return this.getValueType() === Channel_DBR_TYPE.DBR_ENUM;
    };

    /**
     * Return the widget keys currently associated with this channel.
     *
     * The returned set is the live internal collection; mutations affect channel
     * ownership directly.
     *
     * @returns Mutable set of subscribing widget keys.
     */
    getWidgetKeys = (): Set<string> => {
        return this._widgetKeys;
    };

    /**
     * Return the channel's accumulated DBR data.
     *
     * The returned object is the live cache rather than a defensive copy.
     *
     * @returns Mutable cached DBR data object.
     */
    getDbrData = (): type_dbrData => {
        return this._dbrData;
    };

    getChannelName = (): string => {
        return this._channelName;
    };

    getChannelState = (): ChannelState => {
        return this._channelState;
    };

    getValueCount = (): number => {
        return this._valueCount;
    };

    getValueType = (): Channel_DBR_TYPE => {
        return this._valueType;
    };

    getServerAddr = (): string => {
        return this._serverAddr;
    };

    isConnected = () => {
        return this.getChannelState() === ChannelState.CONNECTED;
    }

    // ----------------------- setters and mutators ------------------------

    setChannelState = (newChannelState: ChannelState): void => {
        this._channelState = newChannelState;
    };

    setValueCount = (newValueCount: number): void => {
        this._valueCount = newValueCount;
    };

    setValueType = (newValueType: Channel_DBR_TYPE): void => {
        this._valueType = newValueType;
    };

    setServerAddr = (newServerAddr: string): void => {
        this._serverAddr = newServerAddr;
    };

    setAccessRight = (newAccessRight: Channel_ACCESS_RIGHTS): void => {
        this._accessRight = newAccessRight;
    };

    addWidgetKey = (widgetKey: string) => {
        this._widgetKeys.add(widgetKey);
    };

    removeWidgetKey = (widgetKey: string) => {
        this._widgetKeys.delete(widgetKey);
    };

    emptyWidgetKeys = () => {
        this._widgetKeys.clear();
    };

    setDbrData = (newDbrData: type_dbrData): void => {
        this._dbrData = newDbrData;
    };

    emptyDbrData = () => {
        this._dbrData = {
            value: 0,
            status: CA_ALARM_STATUS.UDF,
            severity: CA_ALARM_SEVRITY.INVALID,
            secondsSinceEpoch: 0,
            nanoSeconds: 0,
        };
    };

    /**
     * Validate and merge one or more DBR updates into the channel cache.
     *
     * Array entries are processed in order. Invalid entries are logged and
     * skipped; valid entries are deep-merged so omitted metadata fields retain
     * their previous cached values.
     *
     * @param newDbrData Single DBR update or ordered collection of updates.
     */
    appendToDbrData = (newDbrData: type_dbrData | type_dbrData[]) => {
        if (Array.isArray(newDbrData)) {
            for (const dbrData of newDbrData) {
                if (!verifyDbrData(dbrData)) {
                    Log.error("Failed to verify DBR data for", this.getChannelName());
                    continue;
                }
                // Preserve cached fields omitted by this update.
                this.setDbrData(GlobalMethods.deepMerge(this._dbrData, dbrData, false));
            }
        } else {
            if (!verifyDbrData(newDbrData)) {
                Log.error("Failed to verify DBR data for", this.getChannelName());
                return;
            }
            // Preserve cached fields omitted by this update.
            this.setDbrData(GlobalMethods.deepMerge(this._dbrData, newDbrData, false));
        }
    };
}
