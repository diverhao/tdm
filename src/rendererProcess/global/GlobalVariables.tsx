import { defaultFontFamily } from "../../common/GlobalVariables";
import { Widgets } from "./Widgets";

// a mockup is used to silence TypeScript
export let g_widgets1: Widgets = undefined; // g_widgets1_mockup;

export const g_setWidgets1 = (widgets: Widgets) => {
    g_widgets1 = widgets;
};

export const getBasePath = () => {
    if ((window as any).basePath === undefined) {
        // desktop mode
        return "../../..";
    } else {
        // web mode
        return (window as any).basePath;
    }
}

// ------------------- sidebar, scroll ---------------

export const sidebarBorderWidth: number = 3;



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


// --------------------- glass style background drop --------------

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
    fontFamily: defaultFontFamily,
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
    fontFamily: defaultFontFamily,
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

/**
 * The main window background for additional color and appearance
 */
export const mainWindowBackgroundStyle = {
    backgroundColor: "rgba(248, 251, 255, 1)",
    backgroundImage: [
        "radial-gradient(circle at 12% 18%, rgba(105, 181, 255, 0.20) 0%, rgba(105, 181, 255, 0) 34%)",
        "radial-gradient(circle at 88% 16%, rgba(187, 148, 255, 0.16) 0%, rgba(187, 148, 255, 0) 32%)",
        "radial-gradient(circle at 72% 86%, rgba(255, 176, 145, 0.15) 0%, rgba(255, 176, 145, 0) 36%)",
        "linear-gradient(135deg, rgba(250, 253, 255, 1) 0%, rgba(246, 251, 250, 1) 52%, rgba(255, 250, 248, 1) 100%)",
    ].join(", "),
    backgroundSize: "125% 125%, 130% 130%, 125% 125%, 100% 100%",
    backgroundPosition: "0% 0%, 100% 0%, 100% 100%, 0% 0%",
    backgroundRepeat: "no-repeat",
    animation: "tdm-startup-background-drift 2s ease-in-out infinite alternate",
}