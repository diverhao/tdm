import { type_log_levels } from "./Log";

export let logLevel: type_log_levels = type_log_levels.debug;

export const setLogLevel = (newLogLevel: type_log_levels) => {
    logLevel = newLogLevel;
}


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
export const getMouseEventClientX = (event: React.MouseEvent | MouseEvent) => {
    return event.clientX + getScrollLeft();
}
export const getMouseEventClientY = (event: React.MouseEvent | MouseEvent) => {
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
