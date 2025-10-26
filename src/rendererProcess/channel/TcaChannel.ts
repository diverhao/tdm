import { Channel_DBR_TYPES, type_dbrData } from "../global/GlobalVariables";
import { g_widgets1 } from "../global/GlobalVariables";
import { BaseWidget } from "../widgets/BaseWidget/BaseWidget";
import { ReadWriteIos, IO_TYPES } from "./ReadWriteIos";
import { rendererWindowStatus } from "../global/Widgets";
import * as GlobalMethods from "../global/GlobalMethods";
import { type_LocalChannel_data } from "../../mainProcess/channel/LocalChannelAgent";
import { Channel_ACCESS_RIGHTS } from "../global/GlobalVariables";
import { Log } from "../../mainProcess/log/Log";

export enum ChannelSeverity {
    NO_ALARM,
    MINOR,
    MAJOR,
    INVALID,
    NOT_CONNECTED,
}

export enum PVA_STATUS_TYPE {
    OK = 0,
    WARNING = 1,
    ERROR = 2,
    FATAL = 3,
    OKOK = 255
}

export type type_pva_status = {
    type: PVA_STATUS_TYPE;
    message?: string;
    callTree?: string;
};

export enum ChannelAlarmStatus {
    NO_ALARM,
    READ,
    WRITE,
    HIHI,
    HIGH,
    LOLO,
    LOW,
    STATE,
    COS,
    COMM,
    TIMEOUT,
    HWLIMIT,
    CALC,
    SCAN,
    LINK,
    SOFT,
    BAD_SUB,
    UDF,
    DISABLE,
    SIMM,
    READ_ACCESS,
    WRITE_ACCESS,
};

export enum pvaValueDisplayType {
    NOT_DEFINED,
    OBJECT_RAW_FIELD,
    OBJECT_VALUE_FIELD,
    PRIMITIVE_RAW_FIELD,
    PRIMITIVE_VALUE_FIELD
}

export enum menuScan {
    "Passive",
    "Event",
    "I/O Intr",
    "10 second",
    "5 second",
    "2 second",
    "1 second",
    ".5 second",
    ".2 second",
    ".1 second",
};


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
    _dbrData: type_dbrData | type_LocalChannel_data = { value: undefined, severity: ChannelSeverity.NOT_CONNECTED };
    autoUpdateInterval: any;
    _pvaValueDisplayType: pvaValueDisplayType = pvaValueDisplayType.NOT_DEFINED;
    _fullPvaType: any = undefined;
    _enumChoices: string[] = [];

    _fieldType: "SEVR" | "" = "";


    // allowed character in LOCAL channel name
    // a-z A-Z 0-9 _ - : . ;
    // allowed characters in LOCAL channel name init value
    // a-z A-Z 0-9 _ - : . ;
    // we should also include macro: $\{\}\(\)
    // static regexLocalChannelName = /^loc:\/\/([a-zA-Z0-9\:\-\_\.;$\{\}@]+)(<([(number)(string)(number\[\])(string\[\])(enum)]+)>)?(\(([a-zA-Z0-9\:\-\_\.;,\]\["']+)\))?$/;
    // static regexGlobalChannelName = /^glb:\/\/([a-zA-Z0-9\:\-\_\.;$\{\}@]+)(<([(number)(string)(number\[\])(string\[\])(enum)]+)>)?(\(([a-zA-Z0-9\:\-\_\.;,"']+)\))?$/;
    static regexLocalChannelNameRegular = /^loc:\/\/([a-zA-Z0-9\:\-\_\.;$\{\}@]+)(\s*)=(\s*)(.*)/;
    static regexLocalChannelNameEnum = /^loc:\/\/([a-zA-Z0-9\:\-\_\.;$\{\}@]+)(\s*):(\s*)\[(((\s*)("[^"]+")(\s*),)*)(((\s*)("[^"]+")(\s*))+)\](\s*)=(\s*)(.*)/;

    static regexGlobalChannelNameRegular = /^glb:\/\/([a-zA-Z0-9\:\-\_\.;$\{\}@]+)(\s*)=(\s*)(.*)/;
    static regexGlobalChannelNameEnum = /^glb:\/\/([a-zA-Z0-9\:\-\_\.;$\{\}@]+)(\s*):(\s*)\[(((\s*)("[^"]+")(\s*),)*)(((\s*)("[^"]+")(\s*))+)\](\s*)=(\s*)(.*)/;

    // static regexLocalGlobalSimpleChannelName = /^loc:\/\/([a-zA-Z0-9\:\-\_\.;$\{\}@]+)/;
    static regexLocalSimpleChannelName = /^loc:\/\/([a-zA-Z0-9\:\-\_\.;$\{\}@]+)/;
    static regexGlobalSimpleChannelName = /^glb:\/\/([a-zA-Z0-9\:\-\_\.;$\{\}@]+)/;

    static regexLocalChannelName = new RegExp(`${this.regexLocalChannelNameRegular.source}|${this.regexLocalChannelNameEnum.source}|${this.regexLocalSimpleChannelName.source}`, 'i');
    static regexGlobalChannelName = new RegExp(`${this.regexGlobalChannelNameRegular.source}|${this.regexGlobalChannelNameEnum.source}|${this.regexGlobalSimpleChannelName.source}`, 'i');


    // allowed character in EPICS channel name
    // a-z A-Z 0-9 _ - : . ; [ ] < > 
    // static regexEpicsChannelName = /^(?:ca:\/\/)?[a-zA-Z0-9:\_\-\[\]<>\.;$\{\}\(\)]+$/;
    // "pva://" + regular EPICS PV name
    // static regexPvaChannelName = /^pva:\/\/[a-zA-Z0-9:\_\-\[\]<>\.;$\{\}\(\)]+(\/[a-zA-Z0-9:\_\-\.]+)?$/;




    constructor(channelName: string) {
        if (TcaChannel.checkChannelName(channelName) === "ca") {
            if (channelName.endsWith(".SEVR")) {
                this._channelName = channelName.replaceAll(".SEVR", "");
                this._fieldType = "SEVR";
            } else {
                this._channelName = channelName;
            }
        } else if (TcaChannel.checkChannelName(channelName) === "pva") {
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
            console.log("meta data ++++++++++++++++++++++++++++++", metaData)
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
            // channel name is in wrong format, e.g. loc://val1<string>
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


    static checkChannelName = (channelName: string | undefined): "local" | "ca" | "global" | "pva" | undefined => {

        if (channelName === undefined) {
            return undefined;
        }

        if (channelName.startsWith("loc://")) {
            return "local";
        } else if (channelName.startsWith("glb://")) {
            return "global";
        } else if (channelName.startsWith("pva://")) {
            return "pva"
        } else if (channelName.startsWith("ca://")) {
            return "ca"
        } else {
            // get default protocol
            const defaultProtocol = g_widgets1.getRoot().getDisplayWindowClient().getProfileEntry("EPICS Custom Environment", "Default Protocol");
            if (defaultProtocol === "PVA") {
                return "pva";
            } else if (defaultProtocol === "CA") {
                return "ca";
            } else {
                // if there is no default protocol setting, use CA
                return "ca";
            }

        }
        
        // if (channelName?.startsWith("ca"))

        //     if (channelName === undefined) {
        //         return undefined;
        //     } else {
        //         const resultLocal = channelName.match(this.regexLocalChannelName);
        //         const resultGlobal = channelName.match(this.regexGlobalChannelName);
        //         const resultCa = channelName.match(this.regexEpicsChannelName);
        //         const resultPva = channelName.match(this.regexPvaChannelName);
        //         if (resultLocal === null && resultCa === null && resultGlobal === null && resultPva === null) {
        //             return undefined;
        //         }
        //         else if (resultLocal !== null) {
        //             return "local";
        //         } else if (resultCa !== null) {
        //             return "ca";
        //         } else if (resultGlobal !== null) {
        //             return "global";
        //         } else if (resultPva !== null) {
        //             return "pva";
        //         } else {
        //             return undefined;
        //         }
        //     }
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
        forceUpdateTo0: boolean,
    } | undefined => {
        const result: {
            localChannelName: string,
            type: "number" | "string" | "number[]" | "string[]" | "enum",
            initValue: number | string | number[] | string[],
            strings: string[],
            forceUpdateTo0: boolean,
        } = {
            localChannelName: "",
            type: "number",
            initValue: 0,
            strings: [],
            forceUpdateTo0: false,
        }

        // not a valid global or local PV
        if (channelName.match(this.regexLocalChannelName) === null
            && channelName.match(this.regexGlobalChannelName) === null
            && channelName.match(this.regexLocalSimpleChannelName) === null
            && channelName.match(this.regexGlobalSimpleChannelName) === null) {
            return undefined;
        }

        // loc://pv1 or glb://pv1
        const channelNameArray = channelName.trim().split("=");
        if (channelNameArray.length === 1) {
            result["localChannelName"] = channelName.trim();
            return result;
        }

        try {
            if (channelName.match(this.regexLocalChannelNameRegular) !== null || channelName.match(this.regexGlobalChannelNameRegular) !== null) {
                // loc://pv1 = 37.8
                // loc://pv1 = "37"
                // loc://pv1 = "ABCD"
                // loc://pv1 = ["A", "B"]
                // loc://pv1 = [37, 39.2]

                result["localChannelName"] = channelNameArray[0].trim();
                const initValueStr = channelNameArray[1].trim();
                const initValue = JSON.parse(initValueStr);
                if (Array.isArray(initValue)) {
                    if (initValue.length > 0) {
                        const firstElementType = typeof initValue[0];
                        if (firstElementType === "number") {
                            result["type"] = "number[]";
                        } else if (firstElementType === "string") {
                            result["type"] = "string[]";
                        } else {
                            return undefined;
                        }
                        result["initValue"] = initValue;
                    } else {
                        result["type"] = "number[]";
                        result["initValue"] = [];
                    }
                    return result;
                } else if (typeof initValue === "number") {
                    result["type"] = "number";
                    result["initValue"] = initValue;
                    if (initValue === 0) {
                        result["forceUpdateTo0"] = true;
                    }
                    return result;
                } else if (typeof initValue === "string") {
                    result["type"] = "string";
                    result["initValue"] = initValue;
                    return result;

                } else {
                    return undefined;
                }
            } else if (channelName.match(this.regexLocalChannelNameEnum) !== null || channelName.match(this.regexGlobalChannelNameEnum) !== null) {
                // loc://pv1 : ["AA", "BB"] = 0
                // loc://pv1 : ["AA", "BB"] = "AA"
                const localChannelNameArray = channelNameArray[0].trim().split(":");
                if (localChannelNameArray.length !== 3) {
                    return undefined;
                }

                const localChannelName = localChannelNameArray[0].trim() + ":" + localChannelNameArray[1].trim();
                result["localChannelName"] = localChannelName;
                result["type"] = "enum";

                const stringsStr = localChannelNameArray[2].trim();
                const strings = JSON.parse(stringsStr);
                if (Array.isArray(strings) === false) {
                    return undefined;
                }
                if (strings.length < 1) {
                    return undefined;
                }
                if (typeof strings[0] !== "string") {
                    return undefined;
                }

                const initValueStr = channelNameArray[1].trim();
                const initValue = JSON.parse(initValueStr);
                if (typeof initValue === "number") {
                    if (typeof strings[initValue] === "string") {
                        result["strings"] = strings;
                        result["initValue"] = initValue;
                    } else {
                        return undefined;
                    }
                } else if (typeof initValue === "string") {
                    if (strings.includes(initValue)) {
                        const initValueNum = strings.indexOf(initValue);
                        result["strings"] = strings;
                        result["initValue"] = initValueNum;
                    } else {
                        return undefined;
                    }
                } else {
                    return undefined;
                }

            }
        } catch (e) {
            Log.error(e);
            return undefined;
        }

        return result;
    }

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
        if (meta !== undefined) {
            if (meta["type"] === "number") {
                if (this.getDbrData()["value"] === undefined || meta["initValue"] !== 0) {
                    this.getDbrData()["value"] = meta["initValue"];
                    this.getDbrData()["type"] = meta["type"];
                }
                // distinguisih `loc://pv1` and `loc://pv1 = 0`, the former case is ignored
                // if the `dbrData["value"]` field is not 0; but for the later case, we force
                // to assign 0 to `dbrData["value"]`
                if (meta["initValue"] === 0 && meta["forceUpdateTo0"] === true) {
                    this.getDbrData()["value"] = meta["initValue"];
                    this.getDbrData()["type"] = meta["type"];
                }
            } else if (meta["type"] === "string") {
                // if (meta["initValue"] !== "") {
                this.getDbrData()["value"] = meta["initValue"];
                this.getDbrData()["type"] = meta["type"];
                // }
            } else if (meta["type"] === "number[]") {
                // if ((meta["initValue"] as number[]).length !== 0) {
                this.getDbrData()["value"] = meta["initValue"];
                this.getDbrData()["type"] = meta["type"];
                // }
            } else if (meta["type"] === "string[]") {
                // if ((meta["initValue"] as string[]).length !== 0) {
                this.getDbrData()["value"] = meta["initValue"];
                this.getDbrData()["type"] = meta["type"];
                // }
            } else if (meta["type"] === "enum") {
                // if (meta["initValue"] !== 0) {
                this.getDbrData()["value"] = meta["initValue"];
                this.getDbrData()["type"] = meta["type"];
                // }
                // if (meta["strings"].length !== 0) {
                this.getDbrData()["strings"] = meta["strings"];
                this.getDbrData()["type"] = meta["type"];
                // }
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

    /**
     * 
     * get() use cases
     * 
     * (1) When the display window is switched to "operating" mode, get DBR_GR data for all channels
     *     This data contains units, limits, and more. These data are stored permanently in this object.
     *     All widgets are re-rendered.
     * 
     * (2) In widget, we clicked something to get the channel value with any type. The data is
     *     permanently stored (appended) in this object. Only this widget is re-rendered.
     * 
     * always create a new channel (if not exist) and then destroy it in the main process (if nobody else is using it)
     * the ioTimeout is for CA in main process, if the get() expires in main process, it will send back
     * { value: undefined } in "tca-get" event
     * 
     * if widgetKey === undefined, all widgets should be re-rendered
     * 
     * if useInterval === true, the data is periodically sent to display window
     */
    get = async (
        widgetKey: string | undefined,
        ioTimeout: number | undefined,
        dbrType: Channel_DBR_TYPES | undefined,
        useInterval: boolean, // only use interval (0.1 s) to send back data, the return value is undefined in this case
        callback?: () => void
    ): Promise<type_dbrData | type_LocalChannel_data> => {

        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
        const ipcManager = displayWindowClient.getIpcManager();
        const windowId = displayWindowClient.getWindowId();

        // the ioTimeout for appendIo() is undefined, it never times out
        const ioId = this.getReadWriteIos().appendIo(this, IO_TYPES["READ"], ioTimeout, callback);
        // windowId and ioId are identifiers of this command,
        // ioId is unique across the display window
        // ioTimeout is for caget in main process, after ioTimeout seconds, the caget obtains "undefined"
        // the main process sends back ioId and data
        ipcManager.sendFromRendererProcess("tca-get",
            {
                channelName: this.getChannelName(),
                displayWindowId: windowId,
                widgetKey: widgetKey,
                ioId: ioId,
                ioTimeout: ioTimeout,
                dbrType: dbrType,
                useInterval: useInterval
            }
        )

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
        return { value: undefined };
    };


    /**
     * Get meta (GR) data for this channel. Never time out. Only valid for CA channel <br>
     *
     * Should be the first operation conducted for an EPICS channel. <br>
     *
     * @param {string | undefined} widgetKey The widget that initiate this operation.
     * After received the reply, this widget will be flushed.
     * If `undefined`, all widgets are flushed.
     *
     * @returns {Promise<type_dbrData>}
     */
    getMeta = async (widgetKey: string | undefined, timeout: number | undefined = undefined): Promise<type_dbrData | type_LocalChannel_data> => {
        if (this.getProtocol() === "pva") {
            return { value: undefined };
        }
        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
        const ipcManager = displayWindowClient.getIpcManager();
        const windowId = displayWindowClient.getWindowId();
        // never timeout
        const ioId = this.getReadWriteIos().appendIo(this, IO_TYPES["READ"], timeout, undefined);

        ipcManager.sendFromRendererProcess("tca-get-meta",
            {
                channelName: this.getChannelName(),
                displayWindowId: windowId,
                widgetKey: widgetKey,
                ioId: ioId,
                timeout: timeout
            }
        );
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
     * Fetch PVA channel's type.
     * 
     * the main process will fetch the full pva type for channel pva://demo:abc and send it back
     * in TcaChannel, full type is at ._fullPvaType, we can obtain the pva type for this
     * particular type using TcaChannel.getPvaType()
     */
    fetchPvaType = async (widgetKey: string | undefined, timeout: number | undefined = undefined): Promise<void> => {
        if (this.getProtocol() !== "pva") {
            return;
        }
        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
        const ipcManager = displayWindowClient.getIpcManager();
        const windowId = displayWindowClient.getWindowId();
        // never timeout
        const ioId = this.getReadWriteIos().appendIo(this, IO_TYPES["READ"], timeout, undefined);

        // channel name, pva://demo:abc/timeStamp.nanoseconds
        ipcManager.sendFromRendererProcess("fetch-pva-type",
            {
                channelName: this.getChannelName(),
                displayWindowId: windowId,
                widgetKey: widgetKey,
                ioId: ioId,
                timeout: timeout,

            }
        )
    };

    /**
     * for array: Can be "abc,def"
     */
    // ioTimeout is honored in main process' put().
    // the provided dbrData.value is always a string, we must convert it to the corresponding data type
    // according to this.dbrData.DBR_TYPE

    /**
     * @returns return false if failed, e.g. value parse error, timeout before received the PUT notification
     * 
     *          if waitNotify === false, always return undefined
     * 
     *          if waitNotify === true, for CA, returns status code; for PVA, returns type_pva_status
     */
    put = async (
        displayWindowId: string,
        dbrData: type_dbrData | type_LocalChannel_data,
        ioTimeout: number,
        waitNotify: boolean = false,
        callback?: () => void
    ): Promise<number | boolean | type_pva_status | undefined> => {
        // todo: array data
        // a number[], e.g. [1.2, 3.4, 5.6] is converted to string "1.2,3.4,5.6"
        const value = this.parseInput(dbrData);
        if (value === undefined) {
            // parse failed
            Log.error("Failed to parse value in", dbrData, "for PUT operation of", this.getChannelName());
            return false;
        }

        // might be [1,2,3], "abc", 37.8
        // for array, the number of input array cannot exceed Channel.valueCount, the epics-tca won't
        // accept this input
        dbrData.value = value;

        // the ioTimeout for appendIo() is irrelavent to the timeout of put operation, it is always rejected
        const ioId = this.getReadWriteIos().appendIo(this, IO_TYPES["WRITE"], ioTimeout, callback);
        // ioId is unique across the display window
        // ioTimeout is for caput in main process, after ioTimeout seconds

        let channelName = this.getChannelName();
        let pvaValueField = "";
        if (this.getProtocol() === "pva") {
            if (this.getPvaValueDisplayType() === pvaValueDisplayType.PRIMITIVE_VALUE_FIELD) {
                // the pvaValueField is the relative path w.r.t. the TcaChannel.pvRequest
                // on the main process side, the CaChannel is holding the TcaChannel.pvRequest all the time
                pvaValueField = "value";
            } else if (this.isEnumType()) {
                pvaValueField = "value.index"
            }
        }

        // console.log("send to main process for put", channelName, displayWindowId, dbrData, ioTimeout, pvaValueField)
        // the backend must have a full channel name
        if (TcaChannel.checkChannelName(channelName) === "local" && !channelName.includes("@window_")) {
            channelName = channelName + "@window_" + displayWindowId;
        }

        // force update
        // this syntax is only for 
        if ((TcaChannel.checkChannelName(channelName) === "local" || TcaChannel.checkChannelName(channelName) === "global")
            && channelName.includes(".PROC")
        ) {
            channelName = channelName.replace(".PROC", "");
            dbrData["PROC"] = true;
        }

        g_widgets1
            .getRoot()
            .getDisplayWindowClient()
            .getIpcManager()
            .sendFromRendererProcess("tca-put",
                {
                    channelName: channelName,
                    displayWindowId: displayWindowId,
                    dbrData: dbrData,
                    ioTimeout: ioTimeout,
                    pvaValueField: pvaValueField,
                    ioId: ioId,
                    waitNotify: waitNotify

                }

            )
        if (waitNotify === true) {
            try {
                const result = await this.getIoPromise(ioId);
                // undefined if the CA operation fails, the IO ID for synchronous version (waitNotify = false), the ECA status code for asynchronous version (waitNotify = true). PVA always returns a Status
                const status = result["status"];
                if (status === undefined) {
                    return false;
                }
                return status;
            } catch (e) {
                Log.error(e);
                return false;
            }
        } else {
            return undefined;
        }

        // always reject if waitNotify === false
        try {
            const result = await this.getIoPromise(ioId);
            // if waitNotify === false, it rejects at here, below is only for waitNotify === true
            console.log("caput result = ", result)
            // undefined if the CA operation fails, the IO ID for synchronous version (waitNotify = false), the ECA status code for asynchronous version (waitNotify = true). PVA always returns a Status
            const status = result["status"];
            return status;
        } catch (e) {
            Log.error(e);
            if (waitNotify === true) {
                return undefined;
            } else {
                // always return undefined if waitNotify === false
                return undefined;
            }
        }
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
                            return value;
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
        } else if (TcaChannel.checkChannelName(this.getChannelName()) === "pva") {
            let pvaType = this.getPvaType();
            if (pvaType === undefined) {
                return undefined;
            }
            let subRequest = "";
            if (this.getPvaValueDisplayType() === pvaValueDisplayType.PRIMITIVE_VALUE_FIELD) {
                subRequest = "value";
            } else if (this.getPvaValueDisplayType() === pvaValueDisplayType.OBJECT_RAW_FIELD ||
                (this.getPvaValueDisplayType() === pvaValueDisplayType.OBJECT_VALUE_FIELD && this.isEnumType() === false) ||
                this.getPvaValueDisplayType() === pvaValueDisplayType.NOT_DEFINED
            ) {
                return undefined;
            }

            let valueTypeIndex = "";

            pvaType = this.getPvaType(subRequest);
            if (pvaType === undefined) {
                return undefined;
            }

            valueTypeIndex = pvaType["typeIndex"];

            let dbrDataType = "";

            // enum is special: input could be a string or number, the string is converted back to number
            if (this.isEnumType()) {
                const value = dbrData["value"];
                if (typeof value === "number") {
                    // return the index
                    return Math.floor(value);
                } else if (typeof value === "string") {
                    // find the corresponding index
                    // if (pvRequest === "") {
                    //     pvRequest = "value.choices";
                    // } else {
                    //     pvRequest = pvRequest + ".value.choices";
                    // }
                    // const choices = this.getPvaTypeAtPvRequest(pvRequest);
                    const choices = this.getEnumChoices();
                    if (Array.isArray(choices)) {
                        // a string array
                        for (let ii = 0; ii < choices.length; ii++) {
                            const choice = choices[ii];
                            if (choice === value) {
                                return ii;
                            }
                        }
                        return undefined;
                    } else {
                        return undefined
                    }

                } else {
                    return undefined;
                }
            }

            if (
                valueTypeIndex === "0x43" ||
                valueTypeIndex === "0x42" ||
                valueTypeIndex === "0x27" ||
                valueTypeIndex === "0x26" ||
                valueTypeIndex === "0x25" ||
                valueTypeIndex === "0x24" ||
                valueTypeIndex === "0x23" ||
                valueTypeIndex === "0x22" ||
                valueTypeIndex === "0x21" ||
                valueTypeIndex === "0x20"
            ) {
                // number
                dbrDataType = "number";
            } else if (valueTypeIndex === "0x83" ||
                valueTypeIndex === "0x60"

            ) {
                // string
                dbrDataType = "string";
            } else if (
                valueTypeIndex === "0x5b" ||
                valueTypeIndex === "0x5a" ||
                valueTypeIndex === "0x53" ||
                valueTypeIndex === "0x52" ||
                valueTypeIndex === "0x4b" ||
                valueTypeIndex === "0x4a" ||
                valueTypeIndex === "0x3f" ||
                valueTypeIndex === "0x3e" ||
                valueTypeIndex === "0x3d" ||
                valueTypeIndex === "0x3c" ||
                valueTypeIndex === "0x3b" ||
                valueTypeIndex === "0x3a" ||
                valueTypeIndex === "0x39" ||
                valueTypeIndex === "0x38" ||
                valueTypeIndex === "0x37" ||
                valueTypeIndex === "0x36" ||
                valueTypeIndex === "0x35" ||
                valueTypeIndex === "0x34" ||
                valueTypeIndex === "0x33" ||
                valueTypeIndex === "0x32" ||
                valueTypeIndex === "0x31" ||
                valueTypeIndex === "0x30" ||
                valueTypeIndex === "0x2f" ||
                valueTypeIndex === "0x2e" ||
                valueTypeIndex === "0x2d" ||
                valueTypeIndex === "0x2c" ||
                valueTypeIndex === "0x2b" ||
                valueTypeIndex === "0x2a" ||
                valueTypeIndex === "0x29" ||
                valueTypeIndex === "0x28"
            ) {
                // number[]
                dbrDataType = "number[]";
            } else if (
                valueTypeIndex === "0x78" ||
                valueTypeIndex === "0x70" ||
                valueTypeIndex === "0x68"
            ) {
                // string[]
                dbrDataType = "string[]";
            } else {
                return undefined;
            }


            // same as above loc:// and glb://
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
                    let index = channelNames.indexOf(this.getChannelName());
                    if (this.getFieldType() === "SEVR") {
                        index = channelNames.indexOf(this.getChannelName() + ".SEVR");
                    }
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
            if (this.getFieldType() === "SEVR") {
                delete g_widgets1.getTcaChannels()[this.getChannelName() + ".SEVR"];
            } else {
                delete g_widgets1.getTcaChannels()[this.getChannelName()];
            }

            // (4)
            this.getReadWriteIos().rejectAllIos(this);
            // (5)
            const windowId = g_widgets1.getRoot().getDisplayWindowClient().getWindowId();
            g_widgets1.getRoot().getDisplayWindowClient().getIpcManager().sendFromRendererProcess("tca-destroy",
                {
                    displayWindowId: windowId,
                    channelName: this.getChannelName()
                }
            );
        }
        clearInterval(this.autoUpdateInterval);
    };

    // let main process know we want to monitor this channel, only monitor DBR_TIME data
    monitor = () => {
        const windowId = g_widgets1.getRoot().getDisplayWindowClient().getWindowId();
        g_widgets1.getRoot().getDisplayWindowClient().getIpcManager().sendFromRendererProcess("tca-monitor",
            {
                displayWindowId: windowId,
                channelName: this.getChannelName()
            }
        );
    };

    // ----------------------- getters of dbr data ------------------------

    // value, severity, unit, dbr type, record type, time stamp, status, precision, enum choices
    // limits: upper_display_limit; lower_display_limit; upper_alarm_limit;
    //         upper_warning_limit; lower_warning_limit; lower_alarm_limit;
    // Most of them are in the DBR_GR data structure, which is the first data to be obtained, after
    // that the DBR_TIME is monitored.
    // they are meant to be used by the channel getters in Widgets, not recommended to invoke directly

    /**
     * Get value of this channel from the cache. No network operation performed at here.
     * 
     * This method should only be used for display purpose.
     * 
     * For PVA channel, if the value has a .value field, then return the .value field. If not, return 
     * the raw value. If the returned value is an JSON object, then stringify it. If the returned value
     * is a string | number | number[] | string[], then return the value.
     *
     * @param {boolean} raw, If we want to return the raw number for enum type PV <br>
     * @returns {string | number | number[] | string[] | undefined} If the channel is not connected, return undefined.
     * If the display window is in editing mode, return PV name.
     */
    getValueForDisplay = (raw: boolean = false): string | number | number[] | string[] | undefined => {
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {

            this.setPvaValueDisplayType(pvaValueDisplayType.NOT_DEFINED);
            return this.getChannelName();
        }

        if (this.getProtocol() === "pva") {
            try {
                // const type = this.getPvaTypeAtPvRequest() as any;
                const type = this.getPvaType() as any;
                const value = this.getPvaValue() as any;
                // console.log("tcachannel get value", this.getChannelName(), type, value)

                // if the type is struct, try to find the values's .value field
                if (type["typeIndex"] === "0x80") {
                    if (type["fields"]["value"] === undefined) {
                        // do not have .value field, return the value itself as a string
                        this.setPvaValueDisplayType(pvaValueDisplayType.OBJECT_RAW_FIELD);
                        return JSON.stringify(value);
                    } else {
                        // it has a .value field
                        if (type["fields"]["value"]["typeIndex"] === "0x80" && value["value"] !== undefined) {
                            // it has a .value field that is a struct
                            if (type["name"].includes("epics:nt/NTEnum")) {
                                this.setPvaValueDisplayType(pvaValueDisplayType.OBJECT_VALUE_FIELD);
                                // if this channel is an nt enum, the value contains 2 fields "int index" and "string[] choices"
                                const index = (value as any)["value"]["index"];
                                // the data may not carry "string[] choices", but the first time data must carry it
                                let choices = (value as any)["value"]["choices"];
                                if (choices === undefined) {
                                    choices = this.getEnumChoices();
                                } else {
                                    this.setEnumChoices(choices);
                                }
                                if (index !== undefined && choices !== undefined && typeof index === "number" && Array.isArray(choices)) {
                                    const choice = choices[index];
                                    return choice;
                                } else {
                                    return JSON.stringify(value["value"]);
                                }
                            } else {
                                // if this channel is not a enum
                                this.setPvaValueDisplayType(pvaValueDisplayType.OBJECT_VALUE_FIELD);
                                return JSON.stringify(value["value"]);
                            }
                        } else if (type["fields"]["value"]["typeIndex"] === "0x80" && value["value"] === undefined) {
                            return undefined;
                        } else if (type["fields"]["value"]["typeIndex"] !== "0x80" && value["value"] === undefined) {
                            return undefined;
                        } else if (type["fields"]["value"]["typeIndex"] !== "0x80" && value["value"] !== undefined) {
                            this.setPvaValueDisplayType(pvaValueDisplayType.PRIMITIVE_VALUE_FIELD);
                            return value["value"];
                        } else {
                            return undefined;
                        }
                    }
                } else {
                    // value is string | number | string[] | number[] | undefined
                    this.setPvaValueDisplayType(pvaValueDisplayType.PRIMITIVE_RAW_FIELD);
                    return value as any;
                }
            } catch (e) {
                this.setPvaValueDisplayType(pvaValueDisplayType.NOT_DEFINED);
                return undefined;
            }
        } else {
            let value = this.getDbrData()["value"];
            if (this.getFieldType() === "SEVR") {
                value = this.getDbrData()["severity"];
                return value;
            }

            if (value === undefined) {
                return undefined;
            }

            // enum
            if (raw === false) {
                if (TcaChannel.checkChannelName(this.getChannelName()) === "ca") {
                    const dbrTypeNum = this.getDbrData().DBR_TYPE;
                    // the dbr type may come late, we only need `strings` to know it is a enum
                    const choices = this.getDbrData().strings;
                    if (choices !== undefined && typeof value === "number") {
                        const result = choices[value];
                        return result;
                    }
                } else if (TcaChannel.checkChannelName(this.getChannelName()) === "local" || TcaChannel.checkChannelName(this.getChannelName()) === "global") {
                    const dbrTypeNum = this.getDbrData()["type"];
                    if (dbrTypeNum !== undefined && dbrTypeNum === "enum") {
                        const choices = this.getDbrData().strings;
                        this.setEnumChoices(choices);
                        if (choices !== undefined) {
                            return choices[value as number];
                        }
                    }
                }
            }

            return value;
        }
    };


    /**
     * Get the severity of the channel.
     * 
     * For PVA channel, the top-level "alarm" field will be used to indicate the channel's severity.
     *
     * @returns {ChannelSeverity} Severity of the channel. If the channel is not connected, return INVALID.
     * If the display window is in editing mode, return NO_ALARM.
     */
    getSeverity = (): ChannelSeverity => {
        // always NO_ALARM in editing mode
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return ChannelSeverity.NO_ALARM;
        }
        if (this.getProtocol() === "local" || this.getProtocol() === "global") {
            return ChannelSeverity.NO_ALARM;
        }

        if (this.getProtocol() === "ca") {

            const value = this.getDbrData()["value"];
            if (value === undefined) {
                return ChannelSeverity.NOT_CONNECTED;
            }

            const severityNum = this.getDbrData()["severity"];
            if (severityNum === 0) {
                return ChannelSeverity.NO_ALARM;
            } else if (severityNum === 1) {
                return ChannelSeverity.MINOR;
            } else if (severityNum === 2) {
                return ChannelSeverity.MAJOR;
            } else if (severityNum === 3) {
                return ChannelSeverity.INVALID;
            } else {
                // any other cases
                return ChannelSeverity.NOT_CONNECTED;
            }
        } else if (this.getProtocol() === "pva") {
            // try to get the alarm field
            const alarm = this.getPvaValue("alarm");
            // console.log(this.getChannelName(), "the alarm is", this.getPvaValue(), alarm)
            if (alarm !== undefined) {
                const severityNum = alarm["severity"];
                if (severityNum === 0) {
                    return ChannelSeverity.NO_ALARM;
                } else if (severityNum === 1) {
                    return ChannelSeverity.MINOR;
                } else if (severityNum === 2) {
                    return ChannelSeverity.MAJOR;
                } else if (severityNum === 3) {
                    return ChannelSeverity.INVALID;
                } else {
                    // any other cases
                    return ChannelSeverity.NOT_CONNECTED;
                }
            } else {
                // return ChannelSeverity.INVALID;
                return ChannelSeverity.NOT_CONNECTED;
            }
        }
        return ChannelSeverity.NOT_CONNECTED;
    };

    getSeverityStr = () => {
        const severityNum = this.getSeverity();
        return ChannelSeverity[severityNum];
    }

    /**
     * Get the alarm status of the channel.
     * 
     * For PVA channel, the top-level "alarm" field will be used to indicate the channel's alarm status.
     *
     * @returns {ChannelAlarmStatus} Alarm status of the channel. If the channel is not connected, return UDF.
     * If the display window is in editing mode, return NO_ALARM.
     */
    getStatus = (): ChannelAlarmStatus => {
        // always NO_ALARM in editing mode
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return ChannelAlarmStatus.NO_ALARM;
        }
        if (TcaChannel.checkChannelName(this.getChannelName()) === "local" || TcaChannel.checkChannelName(this.getChannelName()) === "global") {
            return ChannelAlarmStatus.NO_ALARM;
        }

        if (TcaChannel.checkChannelName(this.getChannelName()) === "ca") {

            const value = this.getDbrData()["value"];
            if (value === undefined) {
                return ChannelAlarmStatus.UDF;
            }

            const alarmStatusNum = this.getDbrData()["status"];
            if (typeof alarmStatusNum === "number") {
                return alarmStatusNum;
            } else {
                return ChannelAlarmStatus.UDF;
            }
        } else if (TcaChannel.checkChannelName(this.getChannelName()) === "pva") {
            // try to get the alarm field
            const alarm = this.getDbrData()["alarm"];

            if (alarm !== undefined) {
                const alarmStatusNum = alarm["alarm"];
                if (typeof alarmStatusNum === "number") {
                    return alarmStatusNum
                } else {
                    return ChannelAlarmStatus.UDF;
                }
            } else {
                // return UDF;
                return ChannelAlarmStatus.UDF;
            }
        }
        return ChannelAlarmStatus.UDF;
    };

    getStatusStr = () => {
        const alarmStatusNum = this.getStatus();
        return ChannelAlarmStatus[alarmStatusNum];
    }


    /**
     * Get record type of this channel. Valid only for CA channel.
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
     * Get dbr type of this channel. Only for CA channel.
     * 
     * @returns {Channel_DBR_TYPES | undefined} DBR type. If the channel is not connected, return undefined.
     * If the display window is in editing mode, return undefined.
     */
    getDbrType = (): Channel_DBR_TYPES | undefined => {
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return undefined;
        }
        if (this.getProtocol() === "ca") {
            return this.getDbrData()["DBR_TYPE"];
        }
        return undefined;
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
        if (this.getProtocol() === "ca") {
            const units = this.getDbrData()["units"];
            if (units === undefined) {
                return "";
            } else {
                return `${units}`;
            }
        } else if (this.getProtocol() === "pva") {
            const units = this.getPvaValue("display.units");
            if (units === undefined) {
                return ""
            } else {
                `${units}`;
            }
        }
        return "";
    };


    /**
     * Get access rights of this channel.
     * 
     * ! Note: there is no access right in PV Access yet
     *
     * @returns {Channel_ACCESS_RIGHTS} Unit. If the channel is not connected, return Channel_ACCESS_RIGHTS.NOT_AVAILABLE.
     * If the display window is in editing mode, return "".
     */
    getAccessRight = (): Channel_ACCESS_RIGHTS => {
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return Channel_ACCESS_RIGHTS.NOT_AVAILABLE;
        }

        // PVA channel
        if (TcaChannel.checkChannelName(this.getChannelName()) === "pva") {
            // enum is different: its value field is an object
            if (this.isEnumType() === true) {
                return Channel_ACCESS_RIGHTS.READ_WRITE;
            }
            // regualr channle
            if (this.getPvaValueDisplayType() === pvaValueDisplayType.PRIMITIVE_RAW_FIELD || this.getPvaValueDisplayType() === pvaValueDisplayType.PRIMITIVE_VALUE_FIELD) {
                return Channel_ACCESS_RIGHTS.READ_WRITE;
            } else if (this.getPvaValueDisplayType() === pvaValueDisplayType.OBJECT_RAW_FIELD || this.getPvaValueDisplayType() === pvaValueDisplayType.OBJECT_VALUE_FIELD) {
                return Channel_ACCESS_RIGHTS.READ_ONLY;
            } else {
                return Channel_ACCESS_RIGHTS.NOT_AVAILABLE;
            }
        }


        // always writable to local channel
        if (this.getProtocol() === "local" || this.getProtocol() === "global") {
            return Channel_ACCESS_RIGHTS.READ_WRITE;
        }

        if (this.getDbrData()["value"] === undefined) {
            return Channel_ACCESS_RIGHTS.NOT_AVAILABLE;
        }
        const accessRightStr = `${this.getDbrData()["accessRight"]}`;
        const accessRight = Channel_ACCESS_RIGHTS[accessRightStr as keyof typeof Channel_ACCESS_RIGHTS];
        if (accessRight !== undefined) {
            const allowPutByProfile = g_widgets1.getRoot().getDisplayWindowClient().allowPut();
            if (allowPutByProfile === true) {
                return accessRight;
            } else {
                return Channel_ACCESS_RIGHTS.READ_ONLY;
            }
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
        if (this.getProtocol() === "ca") {
            return this.getDbrData()["upper_display_limit"];
        } else if (this.getProtocol() === "pva") {
            return this.getPvaValue("control.limitHigh");
        }
        return undefined;

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
        if (this.getProtocol() === "ca") {
            return this.getDbrData()["lower_display_limit"];
        } else if (this.getProtocol() === "pva") {
            return this.getPvaValue("control.limitLow");
        }
        return undefined;
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
        if (this.getProtocol() === "ca") {
            return this.getDbrData()["upper_warning_limit"];
        } else if (this.getProtocol() === "pva") {
            return this.getPvaValue("alarmLimit.highWarningLimit");
        }
        return undefined;
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
        if (this.getProtocol() === "ca") {
            return this.getDbrData()["lower_warning_limit"];
        } else if (this.getProtocol() === "pva") {
            return this.getPvaValue("alarmLimit.lowWarningLimit");
        }
        return undefined;
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
        if (this.getProtocol() === "ca") {
            return this.getDbrData()["upper_alarm_limit"];
        } else if (this.getProtocol() === "pva") {
            return this.getPvaValue("alarmLimit.highAlarmLimit");
        }
        return undefined;
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
        if (this.getProtocol() === "ca") {
            return this.getDbrData()["lower_alarm_limit"];
        } else if (this.getProtocol() === "pva") {
            return this.getPvaValue("alarmLimit.lowAlarmLimit");
        }
        return undefined;
    };

    getLowerAlarmSeverity = () => {
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return undefined;
        }
        if (this.getProtocol() === "pva") {
            return this.getPvaValue("alarmLimit.lowAlarmSeverity");
        }
        return undefined;
    }

    getUpperAlarmSeverity = () => {
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return undefined;
        }
        if (this.getProtocol() === "pva") {
            return this.getPvaValue("alarmLimit.highAlarmSeverity");
        }
        return undefined;
    }

    getLowerWarningSeverity = () => {
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return undefined;
        }
        if (this.getProtocol() === "pva") {
            return this.getPvaValue("alarmLimit.lowWarningSeverity");
        }
        return undefined;
    }

    getUpperWarningSeverity = () => {
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return undefined;
        }
        if (this.getProtocol() === "pva") {
            return this.getPvaValue("alarmLimit.highWarningSeverity");
        }
        return undefined;
    }

    /**
     * Get time stamp of this PVA/CA channel.
     *
     * @returns {Date | undefined} A Date object that represents the time stamp. If the channel is not connected, return undefined.
     * If the display window is in editing mode, return undefined.
     */
    getTimeStamp = (): Date | undefined => {
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return undefined;
        }
        if (TcaChannel.checkChannelName(this.getChannelName()) === "ca") {
            const secondsSinceEpoch = this.getDbrData()["secondsSinceEpoch"];
            const nanoseconds = this.getDbrData()["nanoSeconds"];
            if (secondsSinceEpoch === undefined || nanoseconds === undefined) {
                return undefined;
            }
            const msSince1990UTC = 1000 * secondsSinceEpoch + nanoseconds * 1e-6;
            return new Date(GlobalMethods.converEpicsTimeStampToEpochTime(msSince1990UTC));
        } else if (TcaChannel.checkChannelName(this.getChannelName()) === "pva") {
            const timeStampData = this.getPvaValue("timeStamp");
            if (timeStampData === undefined) {
                return undefined;
            }
            const secondsSinceEpoch = timeStampData["secondsPastEpoch"];
            const nanoseconds = timeStampData["nanoseconds"];
            if (typeof nanoseconds === "number" && typeof secondsSinceEpoch === "number") {
                const msSince1990UTC = 1000 * secondsSinceEpoch + nanoseconds * 1e-6;
                return new Date(GlobalMethods.converEpicsTimeStampToEpochTime(msSince1990UTC));
            }
        }

        return undefined;
    };

    getTimeStampUserTag = () => {
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return undefined;
        }
        if (this.getProtocol() === "pva") {
            return this.getPvaValue('timeStamp.userTag');
        }
        return undefined;
    }

    getAlarmActive = () => {
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return undefined;
        }

        if (this.getProtocol() === "pva") {
            return this.getPvaValue('alarmLimit.active');
        }
        return undefined;
    }

    getForm = () => {
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return undefined;
        }

        if (this.getProtocol() === "pva") {
            try {
                const form = this.getPvaValue('display.form');
                const index = form["index"];
                const choices = form["choices"];
                return choices[index];
            } catch (e) {
                return "Default";
            }
        }
        return undefined;
    }

    getMinStep = () => {
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return undefined;
        }
        if (this.getProtocol() === "pva") {
            return this.getPvaValue('control.minStep');
        }
        return undefined;
    }

    getHysteresis = () => {
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return undefined;
        }
        if (this.getProtocol() === "pva") {
            return this.getPvaValue('alarmLimit.hysteresis');
        }
        return undefined;
    }

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
        if (this.getProtocol() === "ca") {
            return this.getDbrData()["precision"];
        } else if (this.getProtocol() === "pva") {
            this.getPvaValue("display.precision") as number;
        }
        return undefined;
    };

    /**
     * Get enum choices of this channel. Must be a XX_ENUM type data. Only for CA channel.
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

    getEnumChoices = () => {
        return this._enumChoices;
    }


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
        } else if (TcaChannel.checkChannelName(channelName) === "ca") {
            return this.getDbrData()["number_of_string_used"];
        } else {
            return this.getEnumChoices().length;
        }
    };

    /**
     * If this channel an enum type data
     */
    isEnumType = (): boolean => {
        if (this.getProtocol() === "pva") {
            const pvaType = this.getPvaType();
            if (pvaType === undefined) {
                return false;
            } else {
                let fieldType = pvaType;
                if (this.getPvRequest() !== "") {
                    const pvRequestStrs = this.getPvRequest().split(".");
                    for (let pvRequestStr of pvRequestStrs) {
                        fieldType = pvaType["fields"][pvRequestStr];
                    }
                }
                if (fieldType !== undefined && fieldType["name"] !== undefined && fieldType["name"].includes("epics:nt/NTEnum")) {
                    return true;
                } else {
                    return false;
                }
            }
        } else {
            const strings = this.getStrings();
            if (strings !== undefined) {
                return true;
            } else {
                return false;
            }
        }
    };

    /**
     * Get DBR data object for this channel.
     */
    getDbrData = (): type_dbrData | type_LocalChannel_data => {
        return this._dbrData;
    };
    appendToDbrData = (newDbrData: type_dbrData | type_dbrData[] | type_LocalChannel_data | { value: undefined }) => {
        if (Array.isArray(newDbrData)) {
            for (const dbrData of newDbrData) {
                this._dbrData = { ...this._dbrData, ...dbrData };
            }
        } else {
            this._dbrData = { ...this._dbrData, ...newDbrData };
        }
    };

    setDbrData = (newDbrData: type_dbrData | type_LocalChannel_data) => {
        this._dbrData = newDbrData;
    };
    emptyDbrData = () => {
        this._dbrData = { value: undefined };
    };

    mergePvaTypeAndData = (type: Record<string, any>, data: Record<string, any>) => {
        const result: Record<string, any> = {};
        const typeName = type["name"];
        const typeFields = type["fields"];
        for (const [key, value] of Object.entries(data)) {
            const fieldType = typeFields[key];

            const typeIndex = fieldType["typeIndex"];
            if (typeIndex === "0x80") {
                result[key + " " + typeIndex] = this.mergePvaTypeAndData(fieldType, value);
            } else {
                result[key + " " + typeIndex] = value;
            }
        }
        return result;
    }

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

    getProtocol = () => {
        return TcaChannel.checkChannelName(this.getChannelName());
    }

    /**
     * Get the pv request from channel name
     */
    getPvRequest = () => {
        if (this.getProtocol() === "pva") {
            const channelNameArray = this.getChannelName().replace("pva://", "").split("/");
            if (channelNameArray.length === 1) {
                return "";
            } else {
                return channelNameArray[1];
            }
        } else {
            return "";
        }
    }

    getPvaValueDisplayType = () => {
        return this._pvaValueDisplayType;
    }

    setPvaValueDisplayType = (newType: pvaValueDisplayType) => {
        this._pvaValueDisplayType = newType;
    }

    getFullPvaType = () => {
        return this._fullPvaType;
    }

    /**
     * Get the type of this channel, it does not show the full path
     * to this TcaChannel's type. It only shows this current TcaChannel's type.
     * 
     * @param subRequest - Optional sub-request path. 
     *                    If provided, it will be appended to the current pvRequest with a dot separator.
     *                    If empty string (default), uses only the existing pvRequest.
     * 
     * @returns The PVA type object for the requested path, or undefined if the path is invalid
     */
    getPvaType = (subRequest: string = "") => {
        const fullPvaType = this.getFullPvaType();
        if (fullPvaType === undefined) {
            return undefined;
        }
        let pvRequest = this.getPvRequest();
        // console.log("pvrequest", pvRequest)
        if (pvRequest === "" && subRequest === "") {
            return fullPvaType;
        } else if (pvRequest === "" && subRequest !== "") {
            pvRequest = subRequest;
        } else if (pvRequest !== "" && subRequest !== "") {
            pvRequest = pvRequest + "." + subRequest;
        }

        const pvRequestArray = pvRequest.split(".");
        // console.log("pvrequest array", pvRequestArray)
        let result: Record<string, any> = fullPvaType;
        for (const pvRequstElement of pvRequestArray) {
            const fields = result["fields"];
            if (fields !== undefined) {
                result = fields[pvRequstElement];
            } else {
                return undefined;
            }
        }
        return result;
    }

    setFullPvaType = (newType: any) => {
        this._fullPvaType = newType;
    }


    setEnumChoices = (newChoices: string[]) => {
        this._enumChoices = newChoices;
    }



    /**
     * Get the value of the PVA data at the location of the pv request.
     * 
     * e.g. for pva://demo:count/timeStamp.nanoseconds, the dbr data is {timeStamp: {nanoseconds: 33}},
     *      getPvaValue will return 33
     * 
     * e.g. for pva://demo:count, the dbr data is {value: 27, timeStamp: {...}, display: {...}}, the getPvaValue()
     *      returns the whole dbr data structure
     */
    getPvaValue = (subRequest: string = "") => {
        // dbr data is the full path to the data, e.g. 
        let data = this.getDbrData() as any;

        let pvRequest = this.getPvRequest();

        if (pvRequest === "" && subRequest === "") {
            return data;
        } else if (pvRequest === "" && subRequest !== "") {
            pvRequest = subRequest;
        } else if (pvRequest !== "" && subRequest !== "") {
            pvRequest = pvRequest + "." + subRequest;
        }


        try {
            const pvRequestStrs = pvRequest.split(".");
            for (const pvRequestStr of pvRequestStrs) {
                data = data[pvRequestStr];
            }
        } catch (e) {
            return undefined;
        }
        return data;
    }
    getFieldType = () => {
        return this._fieldType;
    }
}
