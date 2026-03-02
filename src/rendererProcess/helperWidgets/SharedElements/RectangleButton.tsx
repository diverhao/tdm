import * as React from "react";
import { GlobalVariables } from "../../../common/GlobalVariables";



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
        handleClick = (_event: React.MouseEvent<HTMLDivElement>) => { },
        handleMouseDown = (_event: React.MouseEvent<HTMLDivElement>) => { },
        defaultBackgroundColor = ElementRectangleButtonDefaultBackgroundColor,
        highlightBackgroundColor = ElementRectangleButtonHighlightBackgroundColor,
        defaultTextColor = ElementRectangleButtonDefaultTextColor,
        highlightTextColor = ElementRectangleButtonHighlightTextColor,
        fontSize = GlobalVariables.defaultFontSize,
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
    }: {
        children?: React.ReactNode;
        handleClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
        handleMouseDown?: (event: React.MouseEvent<HTMLDivElement>) => void;
        defaultBackgroundColor?: string;
        highlightBackgroundColor?: string;
        defaultTextColor?: string;
        highlightTextColor?: string;
        fontSize?: string | number;
        paddingTop?: number;
        paddingBottom?: number;
        paddingLeft?: number;
        paddingRight?: number;
        marginLeft?: number;
        marginRight?: number;
        marginTop?: number;
        marginBottom?: number;
        borderRadius?: number;
        additionalStyle?: React.CSSProperties;
    }) => {

    const elementRef = React.useRef<HTMLDivElement>(null);
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
            onClick={(event) => {
                event?.preventDefault();
                handleClick(event);
            }}
            onMouseDown={(event) => {
                event?.preventDefault();
                handleMouseDown(event);
            }}
        >
            {children}
        </div>
    )
}