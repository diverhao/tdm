import { type_log_levels } from "./Log";

export let logLevel: type_log_levels = type_log_levels.debug;

export const setLogLevel = (newLogLevel: type_log_levels) => {
    logLevel = newLogLevel;
}


export type type_Canvas_tdl = Record<string, any> & {
    type: "Canvas";
    widgetKey: "Canvas";
    // key: "Canvas";
    style: Record<string, number | string>;
    macros: [string, string][];
    // replaceMacros: boolean;
    windowName: string;
    script: string;
    xGridSize: number;
    yGridSize: number;
    gridColor: string;
    showGrid: boolean;
    isUtilityWindow: boolean;
};

export type type_tdl = Record<string, any> & {
    Canvas: type_Canvas_tdl;
    options?: Record<string, any>;
};



export type type_LocalChannel_data = {
    value: number | string | number[] | string[] | undefined;
    type?: "number" | "string" | "number[]" | "string[]" | "enum";
    // for enum, if "strings" is empty or not long enough, we will use "0", "1" ... as enum names
    strings?: string[];
} & Record<string, any>;



export let g_selectedWidgetsSizes: [number, number, number, number] = [100000, -100000, 100000, -100000];

export class GlobalVariables {
    static sidebarBorderWidth: number = 3;

    // font, should sync with main window one in mainWindow/
    static defaultFontSize: number = 14;
    static defaultFontFamily: string = "TDM Default";
    static defaultFontStyle: string = "normal";
    static defaultFontWeight: string = "normal";
    static defaultMonoFontFamily: string = "Courier Prime";

    static presetColors: Record<string, [number, number, number, number]> = {};
    static widgetMinHeight: number = 10;
    static widgetMinWidth: number = 10;
    static colorSumChange: number = 690;
    static CanvasSidebarZIndex: number = 10;
    // dynamic update for DataViewer plot lines and thumbnail
    static DATAVIEWER_MAX_THUMBNAIL_DATA_RATE = 100000;
    static DATAVIEWER_MAX_PLOT_DATA_RATE = 300000;
}
/**
 * "window inner width" = "canvas width" + calcSidebarWidth() + "window scroll bar width"
 * 
 * where calcSidebarWidth() + "window scroll bar width" = 200 px
 * 
 * where calcSidebarWidth() = "sidebar body width" + "sidebar scroll bar width"
 *                          = "window inner width" - "window scroll bar width" - "Canvas width"
 * 
 * The canvas width is always fixed, it is only controllable by the manual setting
 */
export const calcSidebarWidth = () => {
    return 200 - getWindowVerticalScrollBarWidth();
}

let scrollBarWidth = 0.0123;

export const calcScrollBarWidth = () => {
    if (scrollBarWidth === 0.0123) {
        // Create the measurement node
        var scrollDiv = document.createElement("div");
        // scrollDiv.className = "scrollbar-measure";
        scrollDiv.style["width"] = "100px";
        scrollDiv.style["height"] = "100px";
        scrollDiv.style["overflow"] = "scroll";
        scrollDiv.style["position"] = "absolute";
        scrollDiv.style["top"] = "-9999px";


        document.body.appendChild(scrollDiv);

        // Get the scrollbar width
        scrollBarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
        console.warn(scrollBarWidth); // Mac:  15

        // Delete the DIV 
        document.body.removeChild(scrollDiv);
    }
    // return window.innerWidth - document.documentElement.clientWidth;
    return scrollBarWidth;
}


export const getWindowVerticalScrollBarWidth = () => {
    if (document.documentElement.scrollHeight > document.documentElement.clientHeight) {
        return calcScrollBarWidth();
    } else {
        return 0;
    }
}
export const getWindowHorizontalScrollBarWidth = () => {
    if (document.documentElement.scrollWidth > document.documentElement.clientWidth) {
        return calcScrollBarWidth();
    } else {
        return 0;
    }
}


export const getElementVerticalScrollBarWidth = (element: HTMLElement) => {
    if (element.scrollHeight > element.clientHeight) {
        return calcScrollBarWidth();
    } else {
        return 0;
    }
}
export const getElementHorizontalScrollBarWidth = (element: HTMLElement) => {
    if (element.scrollWidth > element.clientWidth) {
        return calcScrollBarWidth();
    } else {
        return 0;
    }
}

export const getScrollTop = () => {
    return document.documentElement.scrollTop;
}

export const getScrollLeft = () => {
    return document.documentElement.scrollLeft;
}


// for mouse down event 
export const getMouseEventClientX = (event: any) => {
    return event.clientX + getScrollLeft();
}
export const getMouseEventClientY = (event: any) => {
    return event.clientY + getScrollTop();
}


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

export enum Channel_STATES {
    UNRESOLVED = 0,
    RESOLVED = 1,
    CREATED = 2,
    DISCONNECTED = 3,
    DESTROYED = 4,
    FAILED = 5,
}
export enum Channel_ACCESS_RIGHTS {
    NOT_AVAILABLE = -1,
    NO_ACCESS = 0,
    READ_ONLY = 1,
    WRITE_ONLY = 2,
    READ_WRITE = 3,
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

export const liquidGlassStyleDark = {
    backgroundColor: "rgba(20, 20, 20, 0.7)",
    color: "rgba(252, 252, 253, 0.98)",
    border: "2px solid rgba(100, 100, 100, 0.0)",
    outline: "0.5px solid rgba(50, 50, 50, 0.8)",
    // separatorColor: "rgba(255, 255, 255, 0.15)",
    // hoverBackgroundColor: "rgba(10, 132, 255, 0.96)",
    // hoverColor: "rgba(255, 255, 255, 1)",
    boxShadow: "0 18px 44px rgba(0, 0, 0, 0.34), 0 4px 12px rgba(0, 0, 0, 0.24)",
    backdropFilter: "blur(4px) saturate(110%)",
    WebkitBackdropFilter: "blur(4px) saturate(110%)",
    fontFamily: GlobalVariables.defaultFontFamily,
    // fontSize: 13.5,
    // fontWeight: 500,
    // borderRadius: 10,
    // menuPaddingX: 5,
    // menuPaddingY: 5,
    // itemPaddingX: 11,
    // itemPaddingY: 3,
    // itemMinHeight: 24,
    // itemBorderRadius: 6,
    // separatorInset: 24,
    // separatorHeight: 12,
    // submenuOffsetX: -3,
    // submenuOffsetY: -8,
    // submenuIndicatorWidth: 16,
}


export const liquidGlassStyle = {
    backgroundColor: "rgba(240, 240, 240, 0.63)", /* Translucent white */
    outline: "0.5px solid rgba(70, 70, 70, 0.3)",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)", /* Soft shadow */
    color: "rgba(18, 18, 20, 0.98)",
    border: "0.5px solid rgba(230, 230, 230, 0.72)",
    // separatorColor: "rgba(60, 60, 67, 0.16)",
    // hoverBackgroundColor: "rgba(92, 161, 255, 1)",
    // hoverColor: "rgba(255, 255, 255, 1)",
    backdropFilter: "blur(4px) saturate(110%)",
    WebkitBackdropFilter: "blur(4px) saturate(110%)",
    fontFamily: GlobalVariables.defaultFontFamily,
    // fontSize: 13.5,
    // fontWeight: 500,
    // borderRadius: 10,
    // menuPaddingX: 5,
    // menuPaddingY: 5,
    // itemPaddingX: 11,
    // itemPaddingY: 3,
    // itemMinHeight: 24,
    // itemBorderRadius: 6,
    // separatorInset: 24,
    // separatorHeight: 12,
    // submenuOffsetX: -3,
    // submenuOffsetY: -8,
    // submenuIndicatorWidth: 16,
}

