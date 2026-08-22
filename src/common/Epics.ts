
/**
 * The types and enums below are defined in the epics-tca library. We define them locally
 * so that we can use it in web-tdm.
 */

// -------------------- PV access ----------------------

type Primitive = number | number[] | bigint | bigint[] | string | string[] | boolean | boolean[];

export interface PvaRecord {
    [key: string]: Primitive | PvaRecord;
}

export type type_pva_value = PvaRecord | Primitive;


export enum NDArray_ColorMode {
    mono,
    bayer,
    rgb1,
    rgb2,
    rgb3,
    yuv444,
    yuv422,
    yuv411,
};


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


// ----------------- channel access --------------------

export enum Channel_DBR_TYPE {
    NOT_AVAILABLE = -1,
    DBR_STRING = 0,
    DBR_INT = 1,
    DBR_SHORT = 1,
    DBR_FLOAT,
    DBR_ENUM,
    DBR_CHAR,
    DBR_LONG,
    DBR_DOUBLE,
    DBR_STS_STRING,
    DBR_STS_INT = 8,
    DBR_STS_SHORT = 8,
    DBR_STS_FLOAT,
    DBR_STS_ENUM,
    DBR_STS_CHAR,
    DBR_STS_LONG,
    DBR_STS_DOUBLE,
    DBR_TIME_STRING,
    DBR_TIME_INT = 15,
    DBR_TIME_SHORT = 15,
    DBR_TIME_FLOAT,
    DBR_TIME_ENUM,
    DBR_TIME_CHAR,
    DBR_TIME_LONG,
    DBR_TIME_DOUBLE,
    DBR_GR_STRING,
    DBR_GR_INT = 22,
    DBR_GR_SHORT = 22,
    DBR_GR_FLOAT,
    DBR_GR_ENUM,
    DBR_GR_CHAR,
    DBR_GR_LONG,
    DBR_GR_DOUBLE,
    DBR_CTRL_STRING,
    DBR_CTRL_INT = 29,
    DBR_CTRL_SHORT = 29,
    DBR_CTRL_FLOAT,
    DBR_CTRL_ENUM,
    DBR_CTRL_CHAR,
    DBR_CTRL_LONG,
    DBR_CTRL_DOUBLE,
    DBR_PUT_ACKT,
    DBR_PUT_ACKS,
    DBR_STSACK_STRING,
    DBR_CLASS_NAME,
}

export enum Channel_ACCESS_RIGHTS {
    NOT_AVAILABLE = -1,
    NO_ACCESS = 0,
    READ_ONLY,
    WRITE_ONLY,
    READ_WRITE,
}

export enum CA_ALARM_SEVRITY {
    NO_ALARM,
    MINOR,
    MAJOR,
    INVALID,
}

export enum CA_ALARM_STATUS {
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
}

export type type_dbr_value = number | number[] | string | string[];

export type type_dbrData_value = {
    value: type_dbr_value;
}

export type type_dbr_meta_all = {
    // STS, TIME, GR, and CTRL
    status: CA_ALARM_STATUS,
    severity: CA_ALARM_SEVRITY,
    // TIME
    secondsSinceEpoch: number,
    nanoSeconds: number,
    // GR and CTRL numbered type PV (CHAR, INT, SHORT, LONG, FLOAT, and DOUBLE)
    units: string,
    // GR_FLOAT, GR_DOUBLE, CTRL_FLOAT and CTRL_DOULBE
    padding: number,
    precision: number,
    // GR and CTRL numbered type PV
    upper_display_limit: number,
    lower_display_limit: number,
    upper_alarm_limit: number,
    upper_warning_limit: number,
    lower_warning_limit: number,
    lower_alarm_limit: number,
    // CTRL numbered type PV
    upper_ctrl_limit: number,
    lower_ctrl_limit: number,
    // GR_ENUM and CTRL_ENUM
    number_of_string_used: number,
    strings: string[],
};

export type type_dbr_meta = Partial<type_dbr_meta_all>;

export type type_dbrData = type_dbrData_value & type_dbr_meta;


// -------------------- none-epics-tca -----------------


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


export enum pvaValueDisplayType {
    NOT_DEFINED,
    OBJECT_RAW_FIELD,
    OBJECT_VALUE_FIELD,
    PRIMITIVE_RAW_FIELD,
    PRIMITIVE_VALUE_FIELD
}


/**
 * Simple verification for DBR data
 */
export const verifyDbrData = (dbrData: type_dbrData) => {
    if (typeof dbrData === "object" && dbrData.value === undefined) {
        return true;
    }
    if (typeof dbrData.value === "string") {
        return true;
    }
    if (typeof dbrData.value === "number") {
        return true;
    }
    if (Array.isArray(dbrData.value)) {
        if (dbrData.value.length === 0) {
            return true;
        } else if (typeof dbrData.value[0] === "string") {
            // only check the first element
            return true;
        } else if (typeof dbrData.value[0] === "number") {
            // only check the first element
            return true;
        }
    }
    return false;
}


const EPICS_CHANNEL_NAME_REGEX = /^[A-Za-z0-9_\-:.\[\]<>;]+$/;

/**
 * Checks whether a raw EPICS PV/channel name contains only characters allowed
 * letters, digits, `_`, `-`, `:`, `.`, `[`, `]`, `<`, `>`, and `;`.
 *
 * This validates name syntax only; it does not check whether the channel exists.
 */
export function verifyChannelName(name: string): boolean {
    return EPICS_CHANNEL_NAME_REGEX.test(name);
}

export const checkChannelNameType = (name: string, defaultType: ChannelType) => {

    if (name.startsWith("ca://")) {
        if (verifyChannelName(name.replace("ca://", ""))) {
            return ChannelType.CA;
        } else {
            return ChannelType.Error;
        }
    } else if (name.startsWith("pva://")) {
        if (verifyChannelName(name.replace("pva://", ""))) {
            return ChannelType.PVA;
        } else {
            return ChannelType.Error;
        }
    } else if (name.startsWith("loc://")) {
        if (verifyChannelName(name.replace("loc://", ""))) {
            return ChannelType.Local;
        } else {
            return ChannelType.Error;
        }
    } else if (name.startsWith("glb://")) {
        if (verifyChannelName(name.replace("glb://", ""))) {
            return ChannelType.Global;
        } else {
            return ChannelType.Error;
        }
    } else {
        if (verifyChannelName(name)) {
            return defaultType;
        } else {
            return ChannelType.Error;
        }
    }
}

export enum ChannelType {
    CA,
    PVA,
    Local,
    Global,
    Error,
}

export type type_pva_value_pv_request = "value" | "" | "value.index" | "index";

// these are not in epics-tca


export enum PVA_ALARM_SEVRITY {
    NO_ALARM,
    MINOR,
    MAJOR,
    INVALID,
    UNDEFINED
}

export enum PVA_ALARM_STATUS {
    NONE,
    DEVICE,
    DRIVER,
    RECORD,
    DB,
    CONF,
    UNDEFINED,
    CLIENT,
}


export type type_IaValue = string | number | string[] | number[];


// ------------- local channel ---------------------------

export type type_LocalChannel_data = {
    value: number | string | number[] | string[] ;
    type?: "number" | "string" | "number[]" | "string[]" | "enum";
    // for enum, if "strings" is empty or not long enough, we will use "0", "1" ... as enum names
    strings?: string[];
} & Record<string, any>;
