import * as React from "react";
// import { GlobalVariables } from "../../global/GlobalVariables";



export const ElementRectangleButtonDefaultBackgroundColor = "rgba(65, 115, 183, 1)";
export const ElementRectangleButtonDefaultTextColor = "rgba(255,255,255,1)";
export const ElementRectangleButtonHighlightBackgroundColor = "rgba(65, 115, 183, 0.8)";
export const ElementRectangleButtonHighlightTextColor = "rgba(255,255,255,1)";

// export const ElementRectangleButtonDefaultBackgroundColor = "rgba(18, 108, 179, 1)";
// export const ElementRectangleButtonDefaultTextColor = "rgba(255,255,255,1)";
// export const ElementRectangleButtonHighlightBackgroundColor = "rgba(18,108,179,0.8)";
// export const ElementRectangleButtonHighlightTextColor = "rgba(255,255,255,1)";

export const ElementRectangleButton = (
    {
        children,
        handleClick = (event: any) => { },
        handleMouseDown = (event: any) => { },
        defaultBackgroundColor = ElementRectangleButtonDefaultBackgroundColor,
        highlightBackgroundColor = ElementRectangleButtonHighlightBackgroundColor,
        defaultTextColor = ElementRectangleButtonDefaultTextColor,
        highlightTextColor = ElementRectangleButtonHighlightTextColor,
        fontSize = 14,
        paddingTop = 5,
        paddingBottom = 5,
        paddingLeft = 10,
        paddingRight = 10,
        marginLeft = 0,
        marginRight = 0,
        marginTop = 0,
        marginBottom = 0,
        borderRadius = 2,
        additionalStyle = {}
    }: any) => {

    const elementRef = React.useRef<any>(null);
    return (
        <div
            ref={elementRef}
            style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                boxSizing: "border-box",
                backgroundColor: defaultBackgroundColor,
                fontSize: fontSize,
                color: defaultTextColor,
                paddingTop: paddingTop,
                paddingBottom: paddingBottom,
                paddingLeft: paddingLeft,
                paddingRight: paddingRight,
                marginLeft: marginLeft,
                marginRight: marginRight,
                marginTop: marginTop,
                marginBottom: marginBottom,
                borderRadius: borderRadius,
                ...additionalStyle
            }}
            onMouseEnter={() => {
                if (elementRef.current !== null) {
                    elementRef.current.style["backgroundColor"] = highlightBackgroundColor;
                    elementRef.current.style["color"] = highlightTextColor;
                    elementRef.current.style["cursor"] = "pointer";
                }
            }}
            onMouseLeave={() => {
                if (elementRef.current !== null) {
                    elementRef.current.style["backgroundColor"] = defaultBackgroundColor;
                    elementRef.current.style["color"] = defaultTextColor;
                    elementRef.current.style["cursor"] = "default";
                }
            }}
            onClick={(event: any) => {
                event?.preventDefault();
                handleClick(event);
            }}
            onMouseDown={(event: any) => {
                event?.preventDefault();
                handleMouseDown(event);
            }}
        >
            {children}
        </div>
    )
}