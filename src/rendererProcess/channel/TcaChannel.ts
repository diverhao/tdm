import { Channel_DBR_TYPES, type_dbrData } from "../global/GlobalVariables";
import { g_widgets1 } from "../global/GlobalVariables";
import { BaseWidget } from "../widgets/BaseWidget/BaseWidget";
import { ReadWriteIos, IO_TYPES } from "./ReadWriteIos";
import { rendererWindowStatus } from "../global/Widgets";
import * as GlobalMethods from "../global/GlobalMethods";
import { type_LocalChannel_data } from "../../mainProcess/channel/LocalChannelAgent";
import { Channel_ACCESS_RIGHTS } from "../global/GlobalVariables";
import { Log } from "../global/Log";

export enum ChannelSeverity {
    NO_ALARM,
    MINOR,
    MAJOR,
    INVALID,
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
export class TcaChannel {
    _channelName: string = "";
    _widgetKeys: Set<string> = new Set();
    _dbrData: type_dbrData | type_LocalChannel_data = { value: undefined, severity: ChannelSeverity.INVALID };
    autoUpdateInterval: any;

    // allowed character in LOCAL channel name
    // a-z A-Z 0-9 _ - : . ;
    // allowed characters in LOCAL channel name init value
    // a-z A-Z 0-9 _ - : . ;
    // we should also include macro: $\{\}\(\)
    static regexLocalChannelName = /^loc:\/\/([a-zA-Z0-9\:\-\_\.;$\{\}@]+)(<([(number)(string)(number\[\])(string\[\])(enum)]+)>)?(\(([a-zA-Z0-9\:\-\_\.;,\]\[]+)\))?$/;
    static regexGlobalChannelName = /^glb:\/\/([a-zA-Z0-9\:\-\_\.;$\{\}@]+)(<([(number)(string)(number\[\])(string\[\])(enum)]+)>)?(\(([a-zA-Z0-9\:\-\_\.;,]+)\))?$/;
    // allowed character in EPICS channel name
    // a-z A-Z 0-9 _ - : . ; [ ] < > 
    static regexEpicsChannelName = /^[a-zA-Z0-9:\_\-\[\]<>\.;$\{\}\(\)]*$/;

    constructor(channelName: string) {

        if (TcaChannel.checkChannelName(channelName) === "epics") {
            this._channelName = channelName;
        } else if (TcaChannel.checkChannelName(channelName) === "local" || TcaChannel.checkChannelName(channelName) === "global") {
            /**
             * For local channel:
             * 
             * if type def is not provided, use <number>
             * if init value is not provided,
             *   if type def === <number>
             *      init value = 0
             *   if type def === <string>
             *      init value = ""
             *   if type def === <number[]>
             *      init value = []
             *   if type def === <string[]>
             *      init value = []
             *   if type def is incorrect, fall back to <number>
             *      init value = this type's default value
             * 
             * if type def and init value are mismatched, ignore the incorrect init value
             * use the type def and this type's default init value
             * 
             * if local channel name cannot be extract, this situation should not happen.
             * The channel name must be valid before calling this constructor.
             * 
             */
            const metaData = TcaChannel.extractNameAndMetaFromLocalChannelName(channelName);
            if (metaData !== undefined) {
                this._channelName = BaseWidget.channelNameLevel3to4(channelName);
                this._dbrData = {
                    ...this._dbrData,
                    value: metaData["initValue"],
                    strings: metaData["strings"],
                    type: metaData["type"],
                };
            }
        } else {
            // channel name is in wrong format, e.g. loc://val1<stringa>
            // this situation is handled by Widgets.createTcaChannel(), which does nothing but return undefined
        }
    }


    static localChannelNameContainsInitValue = (localChannelName: string) => {
        if (localChannelName.includes("(") && localChannelName.includes(")")) {
            return true;
        } else {
            return false;
        }
    };


    static checkChannelName = (channelName: string | undefined): "local" | "epics" | "global" | undefined => {
        if (channelName === undefined) {
            return undefined;
        } else {
            const resultLocal = channelName.match(this.regexLocalChannelName);
            const resultGlobal = channelName.match(this.regexGlobalChannelName);
            const resultEpics = channelName.match(this.regexEpicsChannelName);
            if (resultLocal === null && resultEpics === null && resultGlobal === null) {
                return undefined;
            }
            else if (resultLocal !== null) {
                return "local";
            } else if (resultEpics !== null) {
                return "epics";
            } else if (resultGlobal !== null) {
                return "global";
            } else {
                return undefined;
            }
        }
    }

    /**
     * Input is in format of "[abc, def,ghi, it is ok]". The string cannot contain comma (,).
     * 
     * If parse fails, return []
     */
    static parseStringArray = (input: string): string[] => {
        let result: string[] = [];
        if ((!input.trim().startsWith("[")) || (!input.trim().endsWith("]"))) {
            result = [];
        }
        else {
            // cannot contain `,` otherwise the parse may be incorrect
            result = [];
            const inputArray = input.trim().slice(1, input.trim().length - 1).split(",");
            for (let elementRaw of inputArray) {
                const element = elementRaw.trim().replaceAll(`"`, "").replaceAll(`'`, "");
                result.push(element);
            }
        }
        return result;
    }

    /**
     * if type def is not provided, use <number>
     * if init value is not provided or cannot be correctly parsed,
     *   if type def explicitly === <number>
     *      init value = 0
     *   if type def explicitly === <string>
     *      init value = ""
     *   if type def explicitly === <number[]>
     *      init value = []
     *   if type def explicitly === <string[]>
     *      init value = []
     *   if type def is incorrect, fall back to <number>
     *      init value = this type's default value
     *
     * if type def and init value are mismatched or cannot be parsed, ignore the incorrect init value
     * use the type def and this type's default init value
     *
     * if local channel name cannot be extract or the raw input cannot be parsed in regex, then do not create this TcaChannel
     *
     */
    static extractNameAndMetaFromLocalChannelName = (channelName: string): {
        localChannelName: string,
        type: "number" | "string" | "number[]" | "string[]" | "enum",
        initValue: number | string | number[] | string[],
        strings: string[],
    } | undefined => {
        const regexArrayLocal = channelName.match(this.regexLocalChannelName);
        const regexArrayGlobal = channelName.match(this.regexGlobalChannelName);
        let channelNamePrefix = "";
        let regexArray: RegExpMatchArray | null = null;
        if (regexArrayLocal === null && regexArrayGlobal !== null) {
            regexArray = regexArrayGlobal;
            channelNamePrefix = "glb://"
        } else if (regexArrayLocal !== null && regexArrayGlobal === null) {
            regexArray = regexArrayLocal;
            channelNamePrefix = "loc://"
        } else {
            return undefined;
        }

        const localChannelName = channelNamePrefix + regexArray[1];
        let type = regexArray[3];
        if (type === undefined) {
            type = "number";
        }
        const initValueRaw = regexArray[5];
        let initValue: number | string | number[] | string[] = 0;
        let strings: string[] = [];
        if (type === "number") {
            if (initValueRaw === undefined) {
                initValue = 0;
            } else {
                initValue = parseFloat(initValueRaw);
                if (isNaN(initValue)) {
                    initValue = 0;
                }
            }
        } else if (type === "string") {
            if (initValueRaw === undefined) {
                initValue = "";
            } else {
                initValue = initValueRaw.replaceAll("'", "").replaceAll(`"`, "").trim();
            }
        } else if (type === "number[]") {
            if (initValueRaw === undefined) {
                initValue = [] as number[];
            } else {
                initValue = [] as number[];
                const initValueArray = this.parseStringArray(initValueRaw);
                for (let element of initValueArray) {
                    const elementNum = parseFloat(element);
                    if (isNaN(elementNum)) {
                        initValue = [] as number[];
                        break;
                    } else {
                        initValue.push(elementNum);
                    }
                }
            }
        } else if (type === "string[]") {
            if (initValueRaw === undefined) {
                initValue = [] as string[];
            } else {
                initValue = this.parseStringArray(initValueRaw);
            }
        } else if (type === "enum") {
            if (initValueRaw === undefined) {
                initValue = 0;
                strings = [];
            } else {
                const initValueArray = this.parseStringArray("[" + initValueRaw + "]");
                const initValueStr = initValueArray[0];
                if (initValueStr !== undefined) {
                    initValue = parseInt(initValueStr);
                    if (isNaN(initValue)) {
                        initValue = 0;
                        strings = [];
                    } else {
                        for (let ii = 1; ii < initValueArray.length; ii++) {
                            strings.push(initValueArray[ii]);
                        }
                    }
                } else {
                    initValue = 0;
                    strings = [];
                }
            }
        } else {
            type = "number";
            initValue = 0;
        }
        return {
            localChannelName: localChannelName,
            type: type as "number" | "string" | "number[]" | "string[]" | "enum",
            initValue: initValue,
            strings: strings,
        }
    };

    /**
     * Validate if a channel name is legal
     */
    static validateChannelName = (channelName: string) => {
        if (channelName.includes("$")) {
            return false;
        }
        return true;
    }

    updateLocalChannelInitialValue = (channelName: string) => {
        const meta = TcaChannel.extractNameAndMetaFromLocalChannelName(channelName);
        if (meta !== undefined ) {
            if (meta["type"] === "number") {
                if (meta["initValue"] !== 0) {
                    this.getDbrData()["value"] = meta["initValue"];
                    this.getDbrData()["type"] = meta["type"];
                }
            } else if (meta["type"] === "string") {
                if (meta["initValue"] !== "") {
                    this.getDbrData()["value"] = meta["initValue"];
                    this.getDbrData()["type"] = meta["type"];
                }
            } else if (meta["type"] === "number[]") {
                if ((meta["initValue"] as number[]).length !== 0) {
                    this.getDbrData()["value"] = meta["initValue"];
                    this.getDbrData()["type"] = meta["type"];
                }
            } else if (meta["type"] === "string[]") {
                if ((meta["initValue"] as string[]).length !== 0) {
                    this.getDbrData()["value"] = meta["initValue"];
                    this.getDbrData()["type"] = meta["type"];
                }
            } else if (meta["type"] === "enum") {
                if (meta["initValue"] !== 0) {
                    this.getDbrData()["value"] = meta["initValue"];
                    this.getDbrData()["type"] = meta["type"];
                }
                if (meta["strings"].length !== 0) {
                    this.getDbrData()["strings"] = meta["strings"];
                    this.getDbrData()["type"] = meta["type"];
                }
            }
        }
    }

    // --------------------- widget ------------------------------

    addWidgetKey = (widgetKey: string) => {
        this.getWidgetKeys().add(widgetKey);
    };

    removeWidgetKey = (widgetKey: string) => {
        const index = this.getWidgetKeys().delete(widgetKey);
    };

    emptyWidgetKeys = () => {
        this._widgetKeys.clear();
    };

    /**
     * Get the widget keys that has this channel <br>
     *
     * @returns {Set<string>}
     */
    getWidgetKeys = (): Set<string> => {
        return this._widgetKeys;
    };

    // --------------------- channel operations ---------------------

    // get() use cases
    // (1) When the display window is switched to "operating" mode, get DBR_GR data for all channels
    //     This data contains units, limits, and more. These data are stored permanently in this object.
    //     All widgets are re-rendered.
    // (2) In widget, we clicked something to get the channel value with any type. The data is
    //     permanently stored (appended) in this object. Only this widget is re-rendered.
    // always create a new channel (if not exist) and then destroy it in the main process (if nobody else is using it)
    // the ioTimeout is for CA in main process, if the get() expires in main process, it will send back
    // { value: undefined } in "tca-get" event
    // if widgetKey === undefined, all widgets should be re-rendered
    // if useInterval === true, the data is periodically sent to display window
    get = async (
        widgetKey: string | undefined,
        ioTimeout: number,
        dbrType: Channel_DBR_TYPES | undefined,
        useInterval: boolean,
        callback?: () => void
    ): Promise<type_dbrData | type_LocalChannel_data | void> => {

        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
        const ipcManager = displayWindowClient.getIpcManager();
        const windowId = displayWindowClient.getWindowId();

        // the ioTimeout for appendIo() is undefined, it never times out
        const ioId = this.getReadWriteIos().appendIo(this, IO_TYPES["READ"], ioTimeout, callback);
        // windowId and ioId are identifiers of this command,
        // ioId is unique across the display window
        // ioTimeout is for caget in main process, after ioTimeout seconds, the caget obtains "undefined"
        // the main process sends back ioId and data
        ipcManager.sendFromRendererProcess("tca-get", this.getChannelName(), windowId, widgetKey, ioId, ioTimeout, dbrType, useInterval);
        // blocked until reply in "tca-get", the main process always replies with "tca-get" when the ioTimeout expires
        // or when it obtains the data. The main process' get() will hold if we set ioTimeout to undefined and it cannot
        // get data.
        // if we enable "useInterval", the main process also pushes the data to interval
        if (!useInterval) {
            try {
                let message: type_dbrData | type_LocalChannel_data = await this.getIoPromise(ioId);
                this.appendToDbrData(message);
                return message;
            } catch (e) {
                this.appendToDbrData({ value: undefined });
                return { value: undefined };
            }
        }
        return;
    };

    /**
     * Get meta (GR) data for this channel. Never time out. <br>
     *
     * Should be the first operation conducted for an EPICS channel. <br>
     *
     * @param {string | undefined} widgetKey The widget that initiate this operation.
     * After received the reply, this widget will be flushed.
     * If `undefined`, all widgets are flushed.
     *
     * @returns {Promise<type_dbrData>}
     */
    getMeta = async (widgetKey: string | undefined): Promise<type_dbrData | type_LocalChannel_data> => {
        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
        const ipcManager = displayWindowClient.getIpcManager();
        const windowId = displayWindowClient.getWindowId();
        // never timeout
        const ioId = this.getReadWriteIos().appendIo(this, IO_TYPES["READ"], undefined, undefined);
        ipcManager.sendFromRendererProcess("tca-get-meta", this.getChannelName(), windowId, widgetKey, ioId);
        try {
            let message: type_dbrData | type_LocalChannel_data = await this.getIoPromise(ioId);
            this.appendToDbrData(message);
            return message;
        } catch (e) {
            this.appendToDbrData({ value: undefined });
            return { value: undefined };
        }
    };

    /**
     * for array: Can be "abc,def"
     */
    // ioTimeout is honored in main process' put().
    // the provided dbrData.value is always a string, we must convert it to the corresponding data type
    // according to this.dbrData.DBR_TYPE
    put = async (
        displayWindowId: string,
        dbrData: type_dbrData | type_LocalChannel_data,
        ioTimeout: number,
        callback?: () => void
    ): Promise<void> => {
        // todo: array data
        // a number[], e.g. [1.2, 3.4, 5.6] is converted to string "1.2,3.4,5.6"
        const value = this.parseInput(dbrData);
        if (value === undefined) {
            // parse failed
            return;
        }

        // might be [1,2,3], "abc", 37.8
        // for array, the number of input array cannot exceed Channel.valueCount, the epics-tca won't
        // accept this input
        dbrData.value = value;

        // the ioTimeout for appendIo() is irrelavent to the timeout of put operation, it is always rejected
        const ioId = this.getReadWriteIos().appendIo(this, IO_TYPES["WRITE"], ioTimeout, callback);
        // ioId is unique across the display window
        // ioTimeout is for caput in main process, after ioTimeout seconds
        g_widgets1
            .getRoot()
            .getDisplayWindowClient()
            .getIpcManager()
            .sendFromRendererProcess("tca-put", this.getChannelName(), displayWindowId, dbrData, ioTimeout);
        try {
            // always rejected
            await this.getIoPromise(ioId);
        } catch (e) {
            Log.error(e);
        }
        // does not block
    };


    // dbrData.value in this input is always a string, e.g. "37.7", "9.8, 7, 6" (but general dbrData.value could be string, number, string[] or number[])
    // parse a string, e.g. "37.7", to corresponding dbr value according to dbrType of the Channel
    // for array, input is "9.8, 7, 6", it is converted to array [9.8, 7, 6]
    // enum's input can be "1" or "Value One", either will be accepted
    parseInput = (dbrData: type_dbrData | type_LocalChannel_data) => {
        if (TcaChannel.checkChannelName(this.getChannelName()) === "local" || TcaChannel.checkChannelName(this.getChannelName()) === "global") {
            let dbrDataType = this.getDbrData()["type"];

            if (dbrData["type"] !== undefined) {
                dbrDataType = dbrData["type"];
            }

            if (dbrDataType === "number") {
                const result = parseFloat(`${dbrData["value"]}`);
                if (isNaN(result)) {
                    return undefined;
                } else {
                    return result;
                }
            } else if (dbrDataType === "enum") {
                // dbrData["value"] may be a number (index) or a string (choice)
                const valueStr = `${dbrData["value"]}`;
                // if number
                let value = parseInt(valueStr);
                // if string
                if (isNaN(value)) {
                    const choices = this.getDbrData().strings as string[];
                    if (choices !== undefined) {
                        if (choices.includes(valueStr)) {
                            value = choices.indexOf(valueStr);
                        } else {
                            return undefined;
                        }
                    } else {
                        return undefined;
                    }
                } else {
                    return value;
                }
            } else if (dbrDataType === "string") {
                return `${dbrData["value"]}`;
            } else if (dbrDataType === "string[]") {
                return `${dbrData["value"]}`.replaceAll("[", "").replaceAll("]", "").replaceAll(`"`, "").replaceAll("'", "").split(",");
            } else if (dbrDataType === "number[]") {
                const valueArray = `${dbrData["value"]}`.replaceAll("[", "").replaceAll("]", "").replaceAll(`"`, "").replaceAll("'", "").split(",");
                // input is empty
                if (valueArray.length === 1 && valueArray[0] === "") {
                    return [];
                }
                let resultIsCorrect = true;
                const result = valueArray.map((valueStr: string) => {
                    if (isNaN(parseFloat(valueStr))) {
                        resultIsCorrect = false;
                        return undefined;
                    } else {
                        return parseFloat(valueStr);
                    }
                });
                if (resultIsCorrect) {
                    return result;
                } else {
                    return undefined;
                }
            } else {
                Log.error("Failed to parse Local channel input", dbrData);
                return undefined;
            }
        } else {
            const dbrTypeNum = this.getDbrData().DBR_TYPE;
            if (dbrTypeNum === undefined) {
                // we did not obtain the DBR_TYPE of this channel, do not even try to put it
                return undefined;
            }
            const valueCount = this.getDbrData().valueCount;

            if (typeof valueCount !== "number") {
                return undefined;
            }
            const valueStrRaw = dbrData.value as string;
            let value: any = valueStrRaw;
            let values: any[] = [];
            let valueStrArray: string[] = [];
            if (valueCount === 1) {
                valueStrArray = [valueStrRaw];
            } else {
                for (let valueStr of valueStrRaw.split(",")) {
                    valueStrArray.push(valueStr.trim());
                }
            }
            const dbrTypeStr = Channel_DBR_TYPES[dbrTypeNum];

            for (let valueStr of valueStrArray) {
                if (dbrTypeStr.includes("INT") || dbrTypeStr.includes("SHORT") || dbrTypeStr.includes("LONG")) {
                    value = parseInt(valueStr);
                    if (isNaN(value)) {
                        return undefined;
                    }
                } else if (dbrTypeStr.includes("FLOAT") || dbrTypeStr.includes("DOUBLE")) {
                    value = parseFloat(valueStr);
                    if (isNaN(value)) {
                        return undefined;
                    }
                } else if (dbrTypeStr.includes("ENUM")) {
                    if (/^\d+$/.test(valueStr)) {
                        // if it is pure integer number, simply take the value
                        value = parseInt(valueStr);
                    } else {
                        // if it includes one or more non-digit characters, treat it as a choice
                        const choices = this.getDbrData().strings as string[];
                        if (choices !== undefined) {
                            if (choices.includes(valueStr)) {
                                value = choices.indexOf(valueStr);
                            } else {
                                return undefined;
                            }
                        } else {
                            return undefined;
                        }
                    }
                } else if (dbrTypeStr.includes("STRING")) {
                    // do nothing
                } else if (dbrTypeStr.includes("CHAR")) {
                    // parse the string
                    value = parseInt(valueStr);
                    if (isNaN(value)) {
                        // if parsing failed, try to read char code
                        value = valueStr.charCodeAt(0);
                        if (isNaN(value)) {
                            return undefined;
                        }
                    }
                } else {
                    return undefined;
                }
                values.push(value);
            }

            if (valueCount === 1) {
                return values[0];
            } else {
                return values;
            }
        }
    };

    /**
     * Destroy this TcaChannel object either from a widget or from all widgets. <br>
     * <br>
     *
     * @param {string | undefined} widgetKey
     * if widgetKey === undefined, destroy this TcaChannel completely on the Display Window <br>
     *
     * (1) remove this TcaChannel from all widget's ._channelNames <br>
     *
     * (2) empty TcaChannel's ._widgetKeys, just to make sure the new channel data is sent to the right place  <br>
     *
     * (3) remove this TcaChannel from g_widgets1._tcaChannels  <br>
     *
     * (4) stop all unresolved readWriteIos  <br>
     *
     * (5) tell main process to destroy this channel, the main process will do:
     *     (i)  remove this channel in DisplayWindowAgent
     *     (ii) remove the DisplayWindowAgent from this channel, the conjugate of step (i)
     *     (iii) if no DisplayWindow is subscribing this channel, then destroy this Channel  <br>
     *
     * if widgetKey === string, we clean up all relationships with this widget.
     * If there is no more widget holding this TcaChannel, then completely destroy this channel <br>
     *
     * (1) remove this TcaChannel from this particular widget's ._channelNames  <br>
     *
     * (2) remove this widgetKey from this TcaChannel's ._widgetKeys <br>
     *
     * (3) if this TcaChannel's ._widgetKeys is empty, then this DisplayWindow is not subscribing this
     *     TcaChannel any more, then: do the steps (3), (4) and (5) in above steps <br>
     *
     */
    destroy = (widgetKey: string | undefined) => {
        // (1)
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
                    const index = channelNames.indexOf(this.getChannelName());
                    if (index > -1) {
                        channelNames.splice(index, 1);
                    }
                }
            } catch (e) {
                Log.error(e);
                // skip this widget, continue loop
            }
        }
        // (2)
        if (widgetKey === undefined) {
            this.getWidgetKeys().clear();
        } else {
            this.getWidgetKeys().delete(widgetKey);
        }

        if (this.getWidgetKeys().size === 0) {
            // (3)
            delete g_widgets1.getTcaChannels()[this.getChannelName()];
            // (4)
            this.getReadWriteIos().rejectAllIos();
            // (5)
            const windowId = g_widgets1.getRoot().getDisplayWindowClient().getWindowId();
            g_widgets1.getRoot().getDisplayWindowClient().getIpcManager().sendFromRendererProcess("tca-destroy", windowId, this.getChannelName());
        }
        clearInterval(this.autoUpdateInterval);
    };

    // let main process know we want to monitor this channel, only monitor DBR_TIME data
    monitor = () => {
        const windowId = g_widgets1.getRoot().getDisplayWindowClient().getWindowId();
        g_widgets1.getRoot().getDisplayWindowClient().getIpcManager().sendFromRendererProcess("tca-monitor", windowId, this.getChannelName());
    };

    // ----------------------- getters of dbr data ------------------------

    // value, severity, unit, dbr type, record type, time stamp, status, precision, enum choices
    // limits: upper_display_limit; lower_display_limit; upper_alarm_limit;
    //         upper_warning_limit; lower_warning_limit; lower_alarm_limit;
    // Most of them are in the DBR_GR data structure, which is the first data to be obtained, after
    // that the DBR_TIME is monitored.

    /**
     * Get value of this channel from the cache. No network operation performed at here.
     *
     * @param {boolean} raw, If we want to return the raw number for enum type PV <br>
     * @returns {string | number | number[] | string[] | undefined} If the channel is not connected, return undefined.
     * If the display window is in editing mode, return PV name.
     */
    getValue = (raw: boolean = false): string | number | number[] | string[] | undefined => {
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return this.getChannelName();
        }

        const value = this.getDbrData()["value"];

        if (value === undefined) {
            return undefined;
        }

        // enum
        if (raw === false) {
            if (TcaChannel.checkChannelName(this.getChannelName()) === "epics") {
                const dbrTypeNum = this.getDbrData().DBR_TYPE;
                if (dbrTypeNum !== undefined && Channel_DBR_TYPES[dbrTypeNum].includes("ENUM")) {
                    const choices = this.getDbrData().strings;
                    if (choices !== undefined) {
                        return choices[value as number];
                    }
                }
            } else if (TcaChannel.checkChannelName(this.getChannelName()) === "local" || TcaChannel.checkChannelName(this.getChannelName()) === "global") {
                const dbrTypeNum = this.getDbrData()["type"];
                if (dbrTypeNum !== undefined && dbrTypeNum === "enum") {
                    const choices = this.getDbrData().strings;
                    if (choices !== undefined) {
                        return choices[value as number];
                    }
                }
            }
        }

        return value;
    };

    /**
     * Get the severity of the channel.
     *
     * @returns {ChannelSeverity} Severity of the channel. If the channel is not connected, return INVALID.
     * If the display window is in editing mode, return NO_ALARM.
     */
    getSeverity = (): ChannelSeverity => {
        // always NO_ALARM in editing mode
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return ChannelSeverity.NO_ALARM;
        }
        if (TcaChannel.checkChannelName(this.getChannelName()) === "local" || TcaChannel.checkChannelName(this.getChannelName()) === "global") {
            return ChannelSeverity.NO_ALARM;
        }

        const value = this.getDbrData()["value"];

        if (value === undefined) {
            return ChannelSeverity.INVALID;
        }

        const severityNum = this.getDbrData()["severity"];
        if (severityNum === 0) {
            return ChannelSeverity.NO_ALARM;
        } else if (severityNum === 1) {
            return ChannelSeverity.MINOR;
        } else if (severityNum === 2) {
            return ChannelSeverity.MAJOR;
        } else {
            // any other cases
            return ChannelSeverity.INVALID;
        }
    };

    getSeverityStr = () => {
        const severityNum = this.getSeverity();
        return ChannelSeverity[severityNum];
    }

    /**
     * Get record type of this channel.
     *
     * @returns {string | undefined} Record type. If the channel is not connected, return undefined.
     * If the display window is in editing mode, return undefined.
     */
    getRTYP = (): string | undefined => {
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return undefined;
        }
        return this.getDbrData()["RTYP"];
    };

    /**
     * Get dbr type of this channel.
     *
     * @returns {Channel_DBR_TYPES | undefined} DBR type. If the channel is not connected, return undefined.
     * If the display window is in editing mode, return undefined.
     */
    getDbrType = (): Channel_DBR_TYPES | undefined => {
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return undefined;
        }
        return this.getDbrData()["DBR_TYPE"];
    };

    /**
     * Get unit of this channel.
     *
     * @returns {Channel_DBR_TYPES | undefined} Unit. If the channel is not connected, return "".
     * If the display window is in editing mode, return "".
     */
    getUnit = (): string => {
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return "";
        }
        return this.getDbrData()["units"];
    };

    /**
     * Get access rights of this channel.
     *
     * @returns {Channel_ACCESS_RIGHTS} Unit. If the channel is not connected, return Channel_ACCESS_RIGHTS.NOT_AVAILABLE.
     * If the display window is in editing mode, return "".
     */
    getAccessRight = (): Channel_ACCESS_RIGHTS => {
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return Channel_ACCESS_RIGHTS.NOT_AVAILABLE;
        }

        // always writable to local channel
        if (TcaChannel.checkChannelName(this.getChannelName()) === "local" || TcaChannel.checkChannelName(this.getChannelName()) === "global") {
            return Channel_ACCESS_RIGHTS.READ_WRITE;
        }

        if (this.getDbrData()["value"] === undefined) {
            return Channel_ACCESS_RIGHTS.NOT_AVAILABLE;
        }
        const accessRightStr = `${this.getDbrData()["accessRight"]}`;
        const accessRight = Channel_ACCESS_RIGHTS[accessRightStr as keyof typeof Channel_ACCESS_RIGHTS];
        if (accessRight !== undefined) {
            return accessRight;
        } else {
            return Channel_ACCESS_RIGHTS.NOT_AVAILABLE;
        }
    };

    /**
     * Get upper display limit.
     *
     * @returns {string | number | number[] | string[] | undefined} Limit. If the channel is not connected, return undefined.
     * If the display window is in editing mode, return undefined.
     */
    getUpperDisplayLimit = (): string | number | number[] | string[] | undefined => {
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return undefined;
        }
        return this.getDbrData()["upper_display_limit"];
    };

    /**
     * Get lower display limit.
     *
     * @returns {string | number | number[] | string[] | undefined} Limit. If the channel is not connected, return undefined.
     * If the display window is in editing mode, return undefined.
     */
    getLowerDisplayLimit = (): string | number | number[] | string[] | undefined => {
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return undefined;
        }
        return this.getDbrData()["lower_display_limit"];
    };

    /**
     * Get upper warning limit.
     *
     * @returns {string | number | number[] | string[] | undefined} Limit. If the channel is not connected, return undefined.
     * If the display window is in editing mode, return undefined.
     */
    getUpperWarningLimit = (): string | number | number[] | string[] | undefined => {
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return undefined;
        }
        return this.getDbrData()["upper_warning_limit"];
    };

    /**
     * Get lower warning limit.
     *
     * @returns {string | number | number[] | string[] | undefined} Limit. If the channel is not connected, return undefined.
     * If the display window is in editing mode, return undefined.
     */
    getLowerWarningLimit = (): string | number | number[] | string[] | undefined => {
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return undefined;
        }
        return this.getDbrData()["lower_warning_limit"];
    };

    /**
     * Get upper alarm limit.
     *
     * @returns {string | number | number[] | string[] | undefined} Limit. If the channel is not connected, return undefined.
     * If the display window is in editing mode, return undefined.
     */
    getUpperAlarmLimit = (): string | number | number[] | string[] | undefined => {
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return undefined;
        }
        return this.getDbrData()["upper_alarm_limit"];
    };

    /**
     * Get lower alarm limit.
     *
     * @returns {string | number | number[] | string[] | undefined} Limit. If the channel is not connected, return undefined.
     * If the display window is in editing mode, return undefined.
     */
    getLowerAlarmLimit = (): string | number | number[] | string[] | undefined => {
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return undefined;
        }
        return this.getDbrData()["lower_alarm_limit"];
    };

    /**
     * Get time stamp of this channel.
     *
     * @returns {Date | undefined} A Date object that represents the time stamp. If the channel is not connected, return undefined.
     * If the display window is in editing mode, return undefined.
     */
    getTimeStamp = (): Date | undefined => {
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return undefined;
        }
        const secondsSinceEpoch = this.getDbrData()["secondsSinceEpoch"];
        const nanoseconds = this.getDbrData()["nanoSeconds"];
        if (secondsSinceEpoch === undefined || nanoseconds === undefined) {
            return undefined;
        }
        const msSince1990UTC = 1000 * secondsSinceEpoch + nanoseconds * 1e-6;
        return new Date(GlobalMethods.converEpicsTimeStampToEpochTime(msSince1990UTC));
    };

    /**
     * Get status of this channel.
     *
     * @returns {number | undefined} Status of the channel (in form of number). If the channel is not connected, return undefined.
     * If the display window is in editing mode, return undefined.
     */
    getStatus = (): number | undefined => {
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return undefined;
        }
        return this.getDbrData()["status"];
    };

    /**
     * Get precision of this channel.
     *
     * @returns {number | undefined} Precision of the channel. If the channel is not connected, return undefined.
     * If the display window is in editing mode, return undefined.
     */
    getPrecision = (): number | undefined => {
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return undefined;
        }
        return this.getDbrData()["precision"];
    };

    /**
     * Get enum choices of this channel. Must be a XX_ENUM type data.
     *
     * @returns {string[] | undefined} Enum choices of this channel. If channel type is not enum, return undefined.
     * If the channel is not connected, return undefined.
     * If the display window is in editing mode, return undefined.
     */
    getStrings = (): string[] | undefined => {
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return undefined;
        }
        return this.getDbrData()["strings"];
    };

    /**
     * Get number of strings used in enum type channel. <br>
     *
     * @returns {number | undefined} If the channel is not enum type or the window is in editing mode, return `undefined`.
     */
    getNumerOfStringsUsed = (): number | undefined => {
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return undefined;
        }
        const channelName = this.getChannelName();
        if (TcaChannel.checkChannelName(channelName) === "local" || TcaChannel.checkChannelName(channelName) === "global") {
            const strs = this.getStrings();
            if (strs !== undefined) {
                return strs.length;
            } else {
                return undefined;
            }
        } else {
            return this.getDbrData()["number_of_string_used"];
        }
    };

    // getEnumRawValue = (): number | undefined => {
    //     const rawValue = this.getDbrData()["value"];
    //     if (this.isEnumType() && typeof rawValue === "number") {
    //         return rawValue;
    //     } else {
    //         return undefined;
    //     }
    // };

    /**
     * If this channel an enum type data
     */
    isEnumType = (): boolean => {
        const strings = this.getStrings();
        if (strings !== undefined) {
            return true;
        } else {
            return false;
        }
    };

    /**
     * Get DBR data object for this channel.
     */
    getDbrData = (): type_dbrData | type_LocalChannel_data => {
        return this._dbrData;
    };
    appendToDbrData = (newDbrData: type_dbrData | type_LocalChannel_data | { value: undefined }) => {
        this._dbrData = { ...this._dbrData, ...newDbrData };
    };
    setDbrData = (newDbrData: type_dbrData | type_LocalChannel_data) => {
        this._dbrData = newDbrData;
    };
    emptyDbrData = () => {
        this._dbrData = { value: undefined };
    };

    // ----------------------- getters ------------------------

    getChannelName = (): string => {
        return this._channelName;
    };
    getReadWriteIos = (): ReadWriteIos => {
        return g_widgets1.getReadWriteIos();
    };
    getIoPromise = (ioId: number) => {
        return this.getReadWriteIos().getIoPromise(ioId);
    };
}
