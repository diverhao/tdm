
/**
 * The below types and enums are defined in epics-tca libraray. We want to define it locally
 * so that we can use it in web-tdm.
 */
export enum Channel_DBR_TYPES {
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

export type type_dbrData = Record<string, any> & {
    value: string | string[] | number | number[] | undefined;
};

type Primitive = number | number[] | bigint | bigint[] | string | string[];

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
