import {
    Channel_ACCESS_RIGHTS,
    Channel_DBR_TYPE,
    type_dbrData,
    verifyDbrData,
    CA_ALARM_STATUS,
    CA_ALARM_SEVRITY,
    type_pva_value,
    type_pva_value_pv_request,
    PVA_ALARM_SEVRITY,
    PVA_ALARM_STATUS,
} from "../../common/Epics";
import { g_widgets1 } from "../global/GlobalVariables";
import { BaseWidget } from "../widgets/BaseWidget/BaseWidget";
import { rendererWindowStatus } from "../global/Widgets";
import * as GlobalMethods from "../../common/GlobalMethods";
import { Log } from "../../common/Log";
import { EpicsDate } from "../../common/EpicsTime";
import { g_flushWidgets } from "../helperWidgets/Root/Root";

// severity cannot be used to determine if the channel is connected or not
// CA_ALARM_SEVRITY.UDF may mean the channel is never processed
export enum ChannelState {
    NOT_CONNECTED,
    CONNECTED
}

export enum NtType {
    NTScalar,
    NTScalarArray,
    NTEnum,
    NTNDArray,
    NTTable,
    None,
};

// NTScalar      	epics:nt/NTScalar:1.0
// NTEnum	        epics:nt/NTEnum:1.0
// NTScalarArray	epics:nt/NTScalarArray:1.0
// NTNDArray	    epics:nt/NTNDArray:1.0
// NTTable       	epics:nt/NTTable:1.0

// NTScalar :=
// structure
//     scalar_t    value
//     string      descriptor  :opt
//     alarm_t     alarm       :opt
//     time_t      timeStamp   :opt
//     display_t   display     :opt
//     control_t   control     :opt

// NTScalarArray :=
// structure
//     scalar_t[]  value
//     string      descriptor  :opt
//     alarm_t     alarm       :opt
//     time_t      timeStamp   :opt
//     display_t   display     :opt
//     control_t   control     :opt

// NTEnum :=
// structure
//     enum_t      value
//     string      descriptor  :opt
//     alarm_t     alarm       :opt
//     time_t      timeStamp   :opt

// NTTable :=
// structure
//     string[]   labels
//     structure  value
//         {scalar_t[]  colname}0+ // 0 or more scalar array instances, the column values.
//     string     descriptor  : opt
//     alarm_t    alarm       : opt
//     time_t     timeStamp   : opt

// NTNDArray :=
// structure
//     value_t       value
//     codec_t       codec
//     long          compressedSize
//     long          uncompressedSize
//     dimension_t[] dimension
//     int           uniqueId
//     time_t        dataTimeStamp
//     NTAttribute[] attribute
//     string        descriptor  :opt
//     alarm_t       alarm       :opt
//     time_t        timeStamp   :opt
//     display_t     display     :opt


/**
 * In TDM, a PVA channel is identified by  the channel name and the pv request
 * like `pva://ABC/timeStamp` and `pva://ABC` are 2 different channels.
 * This is different from the epics-tca where `ABC` is a PVA channel which may
 * have various pv requests for GET, PUT, and MONITOR. 
 * 
 * Each PvaChannel in renderer process has a corresponding PvaChannel
 * in main process.
 * 
 */
export class PvaChannel {
    private readonly _channelName: string = "";
    private _channelState: ChannelState = ChannelState.NOT_CONNECTED;

    // they are not in pva
    private _serverAddr: string = "";
    private _accessRight: Channel_ACCESS_RIGHTS = Channel_ACCESS_RIGHTS.NOT_AVAILABLE;

    private _widgetKeys: Set<string> = new Set();

    // pv access
    private _pvaType: any = {}; // full pva type
    private _pvaData: any = {}; // corresponds to full pva type

    private _ntType: NtType = NtType.None;
    private _pvRequest: string = ""; // absolute pv request path

    // relative path for value field
    // if this channel has value field, then it is "value"
    // if not, it is ""
    // if it is enum_t, it may be "value.index" or "index"
    private _valuePvRequest: type_pva_value_pv_request = "";


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

        // pv request string
        const channelNameArray = channelName.replace("pva://", "").split("/");
        if (channelNameArray.length === 1) {
            this._pvRequest = "";
        } else {
            this._pvRequest = channelNameArray.slice(1).join(".");
        }
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

        ipcManager.sendFromRendererProcess("pva-get",
            {
                channelName: this.getChannelName(),
                ioTimeout: ioTimeout,
            }
        )
    };

    /**
     * Fetch PVA channel's type.
     * 
     * never timeout
     * 
     * the main process will fetch the full pva type for channel pva://demo:abc and send it back
     * The returned top-level type is stored in `_pvaType` and exposed by
     * `PvaChannel.getPvaType()`.
     */
    getMeta = async (): Promise<void> => {
        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
        const ipcManager = displayWindowClient.getIpcManager();

        // channel name, pva://demo:abc/timeStamp/nanoseconds
        ipcManager.sendFromRendererProcess("pva-get-meta",
            {
                channelName: this.getChannelName(),
            }
        )
    };



    handlePvaGetResult = (pvaData: any) => {
        this.appendToPvaData(pvaData);
    }

    handlePvaGetMetaResult = (pvaType: any, accessRight: Channel_ACCESS_RIGHTS, serverAddr: string) => {
        this.setPvaType(pvaType);
        this.setAccessRight(accessRight);
        this.setServerAddr(serverAddr);

        const ntTypeStr = pvaType["name"];
        if (ntTypeStr === "epics:nt/NTScalar:1.0") {
            this.setNtType(NtType.NTScalar);
        } else if (ntTypeStr === "epics:nt/NTEnum:1.0") {
            this.setNtType(NtType.NTEnum);
        } else if (ntTypeStr === "epics:nt/NTScalarArray:1.0") {
            this.setNtType(NtType.NTScalarArray);
        } else if (ntTypeStr === "epics:nt/NTNDArray:1.0") {
            this.setNtType(NtType.NTNDArray);
        } else if (ntTypeStr === "epics:nt/NTTable:1.0") {
            this.setNtType(NtType.NTTable);
        } else {
            this.setNtType(NtType.None);
        }

        // assign the "value"
        let valuePvaType = this.getPvaFieldType("");
        let valuePvRequest: type_pva_value_pv_request = "value";
        if (this.isEnumType(valuePvaType)) {
            // if pv request is a enum_t
            valuePvRequest = "index";
        } else {
            // if pv request is not an enum_t
            valuePvaType = this.getPvaFieldType("value");
            if (valuePvaType !== undefined) {
                // pv request has a "value" field
                if (this.isEnumType(valuePvaType)) {
                    // if "value" field is a enum_t
                    valuePvRequest = "value.index";
                } else {
                    valuePvRequest = "value";
                }
            } else {
                // pv request has no "value" field
                valuePvRequest = "";
            }
        }

        this.setValuePvRequest(valuePvRequest);


        this.setChannelState(ChannelState.CONNECTED);
        const widgetKeys = this.getWidgetKeys();
        for (let key of widgetKeys) {
            g_widgets1.addToForceUpdateWidgets(key);
        }
        g_flushWidgets();
    }

    // ---------------------------- PUT ---------------------

    isEnumType = (pvaType: any) => {
        try {
            return pvaType["fields"]["index"]["typeIndex"] === "0x22" && pvaType["fields"]["choices"]["typeIndex"] === "0x68";
        } catch (e) {
            return false;
        }
    }

    put = async (dbrValueStr: string): Promise<void> => {
        try {
            const value = this.parseInput(dbrValueStr);

            let channelName = this.getChannelName();

            g_widgets1
                .getRoot()
                .getDisplayWindowClient()
                .getIpcManager()
                .sendFromRendererProcess("pva-put",
                    {
                        channelName: channelName,
                        value: value,
                        valuePvRequest: this.getValuePvRequest(),
                    }
                )
        } catch (e) {
            Log.error(e);
        }
    };

    private parseInputForEnum = (pvaValueStr: string): type_pva_value => {
        // find out if there is 
        const valuePvRequest = this.getValuePvRequest();
        const choices = this.getPvaFieldData(valuePvRequest === "index" ? "choices" : "value.choices");
        if (Array.isArray(choices)) {
            if (choices.includes(pvaValueStr)) {
                // input string matches
                return choices.indexOf(pvaValueStr);
            } else {
                // input string does not match, try to parse as a integer
                const index = parseInt(pvaValueStr);
                if (isNaN(index) || index >= choices.length || index < 0) {
                    throw new Error("Index overflow");
                } else {
                    return index;
                }
            }
        } else {
            throw new Error("Failed to find the choices for enum_t");
        }
    }

    private parseInput = (pvaValueStr: string): type_pva_value => {

        // Reject writes until the channel has completed its initial connection.
        if (this.getChannelState() !== ChannelState.CONNECTED) {
            throw new Error("Failed to parse input value");
        }

        // Require a supported PVA type before interpreting the input.
        const valuePvaType = this.getPvaFieldType(this.getValuePvRequest());
        if (valuePvaType === undefined) {
            throw new Error("Channel has no value PVA type yet");
        }
        const valuePvaTypeIndex = valuePvaType["typeIndex"];

        // parse input for Enum
        const valuePvRequest = this.getValuePvRequest();
        if (valuePvRequest.includes("index")) {
            return this.parseInputForEnum(pvaValueStr);
        }

        if (
            valuePvaTypeIndex === "0x83" // complex_scalar_boundedString
        ) {
            const size = valuePvaType["size"];

            if (!Number.isInteger(size) || size < 0) {
                throw new Error(`There is no valid size for complex_scalar_boundedString`);
            }
            if (pvaValueStr.length > size) {
                throw new Error(`Expected at most ${size} elements for complex_scalar_boundedString`);
            }
            return pvaValueStr;
        } else if (
            valuePvaTypeIndex === "0x78" ||  // string_fixedSizeArray
            valuePvaTypeIndex === "0x70" ||  // string_boundedSizeArray
            valuePvaTypeIndex === "0x68"   // string_variableSizeArray

        ) {
            throw new Error("String array not supported");
        } else if (
            valuePvaTypeIndex === "0x60"   // string_scalar
        ) {
            return pvaValueStr;
        } else if (
            valuePvaTypeIndex === "0x5b" ||  // floatingPoint_fixedSizeArray_binary64
            valuePvaTypeIndex === "0x53" ||  // floatingPoint_boundedSizeArray_binary64
            valuePvaTypeIndex === "0x4b"   // floatingPoint_variableSizeArray_binary64
        ) {
            return this.parseArrayInput(
                pvaValueStr,
                valuePvaType,
                "0x5b",
                "0x53",
                "floatingPoint_binary64",
                this.parseFloat64,
            );
        } else if (
            valuePvaTypeIndex === "0x43"   // floatingPoint_scalar_binary64
        ) {
            return this.parseFloat64(pvaValueStr);
        } else if (
            valuePvaTypeIndex === "0x5a" ||  // floatingPoint_fixedSizeArray_binary32
            valuePvaTypeIndex === "0x52" ||  // floatingPoint_boundedSizeArray_binary32
            valuePvaTypeIndex === "0x4a"   // floatingPoint_variableSizeArray_binary32
        ) {
            return this.parseArrayInput(
                pvaValueStr,
                valuePvaType,
                "0x5a",
                "0x52",
                "floatingPoint_binary32",
                this.parseFloat32,
            );
        } else if (
            valuePvaTypeIndex === "0x42"   // floatingPoint_scalar_binary32
        ) {
            return this.parseFloat32(pvaValueStr);
        } else if (
            valuePvaTypeIndex === "0x3f" ||  // integer_fixedSizeArray_unsignedLong
            valuePvaTypeIndex === "0x37" ||  // integer_boundedSizeArray_unsignedLong
            valuePvaTypeIndex === "0x2f"   // integer_variableSizeArray_unsignedLong
        ) {
            return this.parseArrayInput(
                pvaValueStr,
                valuePvaType,
                "0x3f",
                "0x37",
                "integer_unsignedLong",
                this.parseUnsignedLong,
            );
        } else if (
            valuePvaTypeIndex === "0x27"  // integer_scalar_unsignedLong
        ) {
            return this.parseUnsignedLong(pvaValueStr);
        } else if (
            valuePvaTypeIndex === "0x3e" ||  // integer_fixedSizeArray_unsignedInt
            valuePvaTypeIndex === "0x36" ||  // integer_boundedSizeArray_unsignedInt
            valuePvaTypeIndex === "0x2e"  // integer_variableSizeArray_unsignedInt
        ) {
            return this.parseArrayInput(
                pvaValueStr,
                valuePvaType,
                "0x3e",
                "0x36",
                "integer_unsignedInt",
                this.parseUnsignedInt,
            );
        } else if (
            valuePvaTypeIndex === "0x26"  // integer_scalar_unsignedInt
        ) {
            return this.parseUnsignedInt(pvaValueStr);
        } else if (
            valuePvaTypeIndex === "0x3d" ||  // integer_fixedSizeArray_unsignedShort
            valuePvaTypeIndex === "0x35" ||  // integer_boundedSizeArray_unsignedShort
            valuePvaTypeIndex === "0x2d"  // integer_variableSizeArray_unsignedShort
        ) {
            return this.parseArrayInput(
                pvaValueStr,
                valuePvaType,
                "0x3d",
                "0x35",
                "integer_unsignedShort",
                this.parseUnsignedShort,
            );
        } else if (
            valuePvaTypeIndex === "0x25"  // integer_scalar_unsignedShort
        ) {
            return this.parseUnsignedShort(pvaValueStr);
        } else if (
            valuePvaTypeIndex === "0x3c" ||  // integer_fixedSizeArray_unsignedByte
            valuePvaTypeIndex === "0x34" ||  // integer_boundedSizeArray_unsignedByte
            valuePvaTypeIndex === "0x2c"  // integer_variableSizeArray_unsignedByte
        ) {
            return this.parseArrayInput(
                pvaValueStr,
                valuePvaType,
                "0x3c",
                "0x34",
                "integer_unsignedByte",
                this.parseUnsignedByte,
            );
        } else if (
            valuePvaTypeIndex === "0x24"  // integer_scalar_unsignedByte
        ) {
            return this.parseUnsignedByte(pvaValueStr);
        } else if (
            valuePvaTypeIndex === "0x3b" ||  // integer_fixedSizeArray_signedLong
            valuePvaTypeIndex === "0x33" ||  // integer_boundedSizeArray_signedLong
            valuePvaTypeIndex === "0x2b"  // integer_variableSizeArray_signedLong
        ) {
            return this.parseArrayInput(
                pvaValueStr,
                valuePvaType,
                "0x3b",
                "0x33",
                "integer_signedLong",
                this.parseSignedLong,
            );
        } else if (
            valuePvaTypeIndex === "0x23"  // integer_scalar_signedLong
        ) {
            return this.parseSignedLong(pvaValueStr);
        } else if (
            valuePvaTypeIndex === "0x3a" ||  // integer_fixedSizeArray_signedInt
            valuePvaTypeIndex === "0x32" || // integer_boundedSizeArray_signedInt
            valuePvaTypeIndex === "0x2a"  // integer_variableSizeArray_signedInt
        ) {
            return this.parseArrayInput(
                pvaValueStr,
                valuePvaType,
                "0x3a",
                "0x32",
                "integer_signedInt",
                this.parseSignedInt,
            );
        } else if (
            valuePvaTypeIndex === "0x22"  // integer_scalar_signedInt
        ) {
            return this.parseSignedInt(pvaValueStr);
        } else if (
            valuePvaTypeIndex === "0x39" ||  // integer_fixedSizeArray_signedShort
            valuePvaTypeIndex === "0x31" || // integer_boundedSizeArray_signedShort
            valuePvaTypeIndex === "0x29"  // integer_variableSizeArray_signedShort
        ) {
            return this.parseArrayInput(
                pvaValueStr,
                valuePvaType,
                "0x39",
                "0x31",
                "integer_signedShort",
                this.parseSignedShort,
            );
        } else if (
            valuePvaTypeIndex === "0x21"  // integer_scalar_signedShort
        ) {
            return this.parseSignedShort(pvaValueStr);
        } else if (
            valuePvaTypeIndex === "0x38" ||  // integer_fixedSizeArray_signedByte
            valuePvaTypeIndex === "0x30" || // integer_boundedSizeArray_signedByte
            valuePvaTypeIndex === "0x28"  // integer_variableSizeArray_signedByte
        ) {
            return this.parseArrayInput(
                pvaValueStr,
                valuePvaType,
                "0x38",
                "0x30",
                "integer_signedByte",
                this.parseSignedByte,
            );
        } else if (
            valuePvaTypeIndex === "0x20"  // integer_scalar_signedByte
        ) {
            return this.parseSignedByte(pvaValueStr);
        } else if (
            valuePvaTypeIndex === "0x18" ||  // boolean_fixedSizeArray
            valuePvaTypeIndex === "0x10" ||  // boolean_boundedSizeArray
            valuePvaTypeIndex === "0x8"  // boolean_variableSizeArray
        ) {
            return this.parseArrayInput(
                pvaValueStr,
                valuePvaType,
                "0x18",
                "0x10",
                "boolean",
                this.parseBoolean,
            );
        } else if (
            valuePvaTypeIndex === "0x0"  // boolean_scalar
        ) {
            return this.parseBoolean(pvaValueStr);
        } else {

            // 0x8a  // complex_variableSizeArray_variantUnion
            // 0x89a // complex_variableSizeArray_union_no_null
            // 0x89  // complex_variableSizeArray_union
            // 0x88a // complex_variableSizeArray_structure_no_null
            // 0x88  // complex_variableSizeArray_structure
            // 0x82  // complex_scalar_variantUnion
            // 0x81  // complex_scalar_union
            // 0x80  // complex_scalar_structure
            throw new Error(`Unsupported PVA type ${valuePvaTypeIndex}`);
        }
    }

    private parseArrayInput = <T extends number | boolean>(
        pvaValueStr: string,
        valuePvaType: Record<string, any>,
        fixedSizeTypeIndex: string,
        boundedSizeTypeIndex: string,
        typeName: string,
        parseElement: (value: string) => T,
    ): T[] => {
        const valuePvaTypeIndex = valuePvaType["typeIndex"];
        const valueStrings = pvaValueStr.trim() === "" ? [] : pvaValueStr.split(",");

        if (valuePvaTypeIndex === fixedSizeTypeIndex || valuePvaTypeIndex === boundedSizeTypeIndex) {
            const size = valuePvaType["size"];
            if (!Number.isInteger(size) || size < 0) {
                throw new Error(`There is no valid size for ${typeName}`);
            }
            if (valuePvaTypeIndex === fixedSizeTypeIndex && valueStrings.length !== size) {
                throw new Error(`Expected ${size} elements for fixed-size ${typeName} array`);
            }
            if (valuePvaTypeIndex === boundedSizeTypeIndex && valueStrings.length > size) {
                throw new Error(`Expected at most ${size} elements for bounded-size ${typeName} array`);
            }
        }

        return valueStrings.map(parseElement);
    };

    private parseFloat64 = (str: string) => {
        const valueFloat = parseFloat(str);
        if (isNaN(valueFloat) || !Number.isFinite(valueFloat)) {
            throw new Error(`Failed to parse value ${str} or overflow`);
        } else {
            return valueFloat;
        }
    }

    private parseFloat32 = (str: string) => {
        const valueFloat = parseFloat(str);
        if (isNaN(valueFloat) || valueFloat > 3.4028234663852886e38 || valueFloat < -3.4028234663852886e38) {
            throw new Error(`Failed to parse value ${str} or overflow`);
        } else {
            return valueFloat;
        }
    }

    private parseUnsignedLong = (str: string) => {
        const valueFloat = parseFloat(str);
        if (isNaN(valueFloat) || valueFloat > 18446744073709551615n || valueFloat < 0) {
            throw new Error(`Failed to parse value ${str} or overflow`);
        } else {
            return Math.trunc(valueFloat);
        }
    }

    private parseSignedLong = (str: string) => {
        const valueFloat = parseFloat(str);
        if (isNaN(valueFloat) || valueFloat > 9223372036854775807n || valueFloat < -9223372036854775808n) {
            throw new Error(`Failed to parse value ${str} or overflow`);
        } else {
            return Math.trunc(valueFloat);
        }
    }

    private parseUnsignedInt = (str: string) => {
        const valueFloat = parseFloat(str);
        if (isNaN(valueFloat) || valueFloat > 4294967295 || valueFloat < 0) {
            throw new Error(`Failed to parse value ${str} or overflow`);
        } else {
            return Math.trunc(valueFloat);
        }
    }

    private parseSignedInt = (str: string) => {
        const valueFloat = parseFloat(str);
        if (isNaN(valueFloat) || valueFloat > 2147483647 || valueFloat < -2147483648) {
            throw new Error(`Failed to parse value ${str} or overflow`);
        } else {
            return Math.trunc(valueFloat);
        }
    }

    private parseUnsignedShort = (str: string) => {
        const valueFloat = parseFloat(str);
        if (isNaN(valueFloat) || valueFloat > 65535 || valueFloat < 0) {
            throw new Error(`Failed to parse value ${str} or overflow`);
        } else {
            return Math.trunc(valueFloat);
        }
    }

    private parseSignedShort = (str: string) => {
        const valueFloat = parseFloat(str);
        if (isNaN(valueFloat) || valueFloat > 32767 || valueFloat < -32768) {
            throw new Error(`Failed to parse value ${str} or overflow`);
        } else {
            return Math.trunc(valueFloat);
        }
    }

    private parseUnsignedByte = (str: string) => {
        const valueFloat = parseFloat(str);
        if (isNaN(valueFloat) || valueFloat > 255 || valueFloat < 0) {
            throw new Error(`Failed to parse value ${str} or overflow`);
        } else {
            return Math.trunc(valueFloat);
        }
    }

    private parseSignedByte = (str: string) => {
        const valueFloat = parseFloat(str);
        if (isNaN(valueFloat) || valueFloat > 127 || valueFloat < -128) {
            throw new Error(`Failed to parse value ${str} or overflow`);
        } else {
            return Math.trunc(valueFloat);
        }
    }

    private parseBoolean = (str: string) => {
        if (str.trim().toLowerCase() === "true") {
            return true;
        } else if (str.trim().toLowerCase() === "false") {
            return false;
        } else {
            throw new Error("Boolean input must be true or false");
        }
    }


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

    // ----------------- pva type and data ------------------

    getPvaType = (): any => {
        return this._pvaType;
    };

    getPvaData = (): any => {
        return this._pvaData;
    };

    getPvRequest = (): string => {
        return this._pvRequest;
    };


    setPvaType = (newPvaType: any): void => {
        this._pvaType = newPvaType;
    };

    setPvRequest = (newPvRequest: string): void => {
        this._pvRequest = newPvRequest;
    };

    setValuePvRequest = (newValuePvRequest: type_pva_value_pv_request): void => {
        this._valuePvRequest = newValuePvRequest;
    };

    /**
     * Relative 
     */
    getValuePvRequest = (): type_pva_value_pv_request => {
        return this._valuePvRequest;
    };

    /**
     * Input arg subPvRequest is the path relative to the pv request of this channel.
     * 
     * It returns the type of the subPvRequest.
     */
    getPvaFieldType = (subPvRequest: string = "") => {
        const pvaType = this.getPvaType();
        if (pvaType === undefined) {
            return undefined;
        }

        const pvRequest = [this.getPvRequest(), subPvRequest]
            .filter((part) => part !== "")
            .join(".");
        if (pvRequest === "") {
            return pvaType;
        }
        const pvRequestArray = pvRequest.split(".");

        let result: Record<string, any> = pvaType;
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


    getPvaFieldData = (subPvRequest: string = "") => {
        const pvaData = this.getPvaData();
        if (pvaData === undefined) {
            return undefined;
        }

        const pvRequest = [this.getPvRequest(), subPvRequest]
            .filter((part) => part !== "")
            .join(".");
        if (pvRequest === "") {
            return pvaData;
        }
        const pvRequestArray = pvRequest.split(".");

        let result: any = pvaData;
        try {
            for (const pvRequstElement of pvRequestArray) {
                result = result[pvRequstElement];
            }
        } catch (e) {
            Log.error("Failed to get field data");
        }
        return result;
    }

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

            // g_widgets1.getReadWriteIos().rejectChannelIos(this);
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
    getValueForDisplay = (raw: boolean = false): type_pva_value | undefined => {
        if (g_widgets1.isEditing()) {
            return this.getChannelName();
        }
        if (!this.isConnected()) {
            return this.getChannelName();
        }


        let value = this.getPvaFieldData(this.getValuePvRequest());

        // Convert a cached enum index to its display label when requested.
        if (raw === false) {
            const valuePvRequest = this.getValuePvRequest();
            if (valuePvRequest.includes("index")) {
                try {
                    const choices = this.getPvaFieldData(valuePvRequest.replace("index", "choices"));
                    const result = choices[value];
                    if (result !== undefined) {
                        return `${result}`;
                    }
                } catch (e) {
                    // continue
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
    getSeverity = (): PVA_ALARM_SEVRITY => {
        // Editing mode suppresses runtime alarm styling.
        if (g_widgets1.isEditing()) {
            return PVA_ALARM_SEVRITY.NO_ALARM;
        }

        // if not connected
        if (!this.isConnected()) {
            return PVA_ALARM_SEVRITY.INVALID;
        }

        try {
            const severityNum = this.getPvaFieldData("alarm.severity");
            if (severityNum === 0) {
                return PVA_ALARM_SEVRITY.NO_ALARM;
            } else if (severityNum === 1) {
                return PVA_ALARM_SEVRITY.MINOR;
            } else if (severityNum === 2) {
                return PVA_ALARM_SEVRITY.MAJOR;
            } else if (severityNum === 3) {
                return PVA_ALARM_SEVRITY.INVALID;
            } else {
                return PVA_ALARM_SEVRITY.UNDEFINED;
            }
        } catch (e) {
            // it has no alarm_t, always NO_ALARM
            return PVA_ALARM_SEVRITY.NO_ALARM;
        }
    }

    getSeverityStr = () => {
        const severityNum = this.getSeverity();
        return PVA_ALARM_SEVRITY[severityNum];
    }

    /**
     * Return the cached PV Access alarm status.
     *
     * Editing mode and a disconnected channel return {@link PVA_ALARM_STATUS.NONE}.
     * Values `0` through `7` map to the standard PVA alarm statuses; a missing or
     * unsupported value maps to {@link PVA_ALARM_STATUS.UNDEFINED}.
     *
     * @returns Current normalized PVA alarm status.
     */
    getStatus = (): PVA_ALARM_STATUS => {
        // Editing mode suppresses runtime alarm styling.
        if (g_widgets1.isEditing()) {
            return PVA_ALARM_STATUS.NONE;
        }


        // if not connected
        if (!this.isConnected()) {
            return PVA_ALARM_STATUS.NONE;
        }

        const statusNum = this.getPvaFieldData("alarm.status");
        if (statusNum === 0) {
            return PVA_ALARM_STATUS.NONE;
        } else if (statusNum === 1) {
            return PVA_ALARM_STATUS.DEVICE;
        } else if (statusNum === 2) {
            return PVA_ALARM_STATUS.DRIVER;
        } else if (statusNum === 3) {
            return PVA_ALARM_STATUS.RECORD;
        } else if (statusNum === 4) {
            return PVA_ALARM_STATUS.DB;
        } else if (statusNum === 5) {
            return PVA_ALARM_STATUS.CONF;
        } else if (statusNum === 6) {
            return PVA_ALARM_STATUS.UNDEFINED;
        } else if (statusNum === 7) {
            return PVA_ALARM_STATUS.CLIENT;
        } else {
            return PVA_ALARM_STATUS.UNDEFINED;
        }
    };


    getStatusStr = () => {
        const alarmStatusNum = this.getStatus();
        return PVA_ALARM_STATUS[alarmStatusNum];
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
        const unit = this.getPvaFieldData("display.units");
        if (typeof unit === "string") {
            return unit;
        } else {
            return "";
        }
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
        const limit = this.getPvaFieldData("display.limitHigh");
        if (typeof limit === "number") {
            return limit;
        } else {
            return 0;
        }
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
        const limit = this.getPvaFieldData("display.limitLow");
        if (typeof limit === "number") {
            return limit;
        } else {
            return 0;
        }
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
        const limit = this.getPvaFieldData("valueAlarm.highWarningLimit");
        if (typeof limit === "number") {
            return limit;
        } else {
            return 0;
        }
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
        const limit = this.getPvaFieldData("valueAlarm.lowWarningLimit");
        if (typeof limit === "number") {
            return limit;
        } else {
            return 0;
        }
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
        const limit = this.getPvaFieldData("control.limitHigh");
        if (typeof limit === "number") {
            return limit;
        } else {
            return 0;
        }
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
        const limit = this.getPvaFieldData("control.limitLow");
        if (typeof limit === "number") {
            return limit;
        } else {
            return 0;
        }
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
        const limit = this.getPvaFieldData("valueAlarm.highAlarmLimit");
        if (typeof limit === "number") {
            return limit;
        } else {
            return 0;
        }
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
        const limit = this.getPvaFieldData("valueAlarm.lowAlarmLimit");
        if (typeof limit === "number") {
            return limit;
        } else {
            return 0;
        }
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
        const secondsPastEpoch = this.getPvaFieldData("timeStamp.secondsPastEpoch");
        const nanoseconds = this.getPvaFieldData("timeStamp.nanoseconds");
        if (typeof secondsPastEpoch === "number" && typeof nanoseconds === "number") {
            const msSince1990UTC = 1000 * secondsPastEpoch + nanoseconds * 1e-6;
            return EpicsDate.fromEpicsTimeMs(msSince1990UTC);
        } else {
            return EpicsDate.fromEpicsTimeMs(0);
        }
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
        const precision = this.getPvaFieldData("display.precision");
        if (typeof precision === "number") {
            return precision;
        } else {
            return 0;
        }
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
        const valuePvRequest = this.getValuePvRequest();
        const choices = this.getPvaFieldData(valuePvRequest === "index" ? "choices" : "value.choices");
        if (Array.isArray(choices)) {
            return choices;
        } else {
            return [];
        }
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
        return this.getEnumChoices().length;
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

    getChannelName = (): string => {
        return this._channelName;
    };

    getChannelState = (): ChannelState => {
        return this._channelState;
    };

    getNtType = (): NtType => {
        return this._ntType;
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

    setNtType = (newNtType: NtType): void => {
        this._ntType = newNtType;
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

    setPvaData = (newPvaData: any): void => {
        this._pvaData = newPvaData;
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
    appendToPvaData = (newPvaData: any) => {
        this._pvaData = GlobalMethods.deepMerge(this._pvaData, newPvaData, false)
    };
}
