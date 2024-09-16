import * as React from "react";

export const ElementUpDownButtonOnSidebar = ({ children, additionalStyle, handleClick }: any) => {
    const refElement = React.useRef<any>(null);
    return (
        <div
            ref={refElement}
            style={{
                display: "inline-flex",
                width: 15,
                alignItems: "center",
                justifyContent: "center",
                color: "rgba(180, 180, 180",
                fontWeight: "bold",
                ...additionalStyle,
            }}
            onMouseEnter={() => {
                if (refElement.current !== null) {
                    refElement.current.style["color"] = "rgba(64,64,64)";
                    refElement.current.style["cursor"] = "pointer";
                }
            }}
            onMouseLeave={() => {
                if (refElement.current !== null) {
                    refElement.current.style["color"] = "rgba(180, 180, 180)";
                    refElement.current.style["cursor"] = "default";
                }
            }}
            onClick={(event: any) => {
                handleClick(event);
            }}
        >
            {children}
        </div >
    )
};

export const ElementProfileBlockNameInput = ({ additionalStyle, value, onChange }: any) => {
    const refElement = React.useRef<any>(null);
    return (
        <input
            ref={refElement}
            spellCheck={false}
            style={{
                overflow: "hidden",
                border: "none",
                outline: "none",
                textOverflow: "ellipsis",
                fontSize: 35,
                backgroundColor: "rgba(0,0,0,0)",
                ...additionalStyle
            }}
            value={value}
            onFocus={(event: any) => {
                event.preventDefault();
                if (refElement.current !== null) {
                    refElement.current.style["color"] = "red";
                }
            }}
            onBlur={(event: any) => {
                event.preventDefault();
                if (refElement.current !== null) {
                    refElement.current.style["color"] = "rgba(0,0,0,1)";
                }
            }}
            onMouseEnter={() => {
                if (refElement.current !== null) {
                    refElement.current.style["color"] = "rgba(255, 0, 0, 1)";
                }
            }}
            onMouseLeave={() => {
                if (refElement.current !== null && document.activeElement !== refElement.current) {
                    refElement.current.style["color"] = "rgba(0, 0, 0, 1)";
                }
            }}
            onChange={onChange}
        >
        </input>
    )
};


export const ElementArrayPropertyItemRight = ({ children, onClick }: any) => {
    const refElement = React.useRef<any>(null);
    return <div
        ref={refElement}
        style={{
            display: "inline-flex",
            justifyContent: "center",
            alignItems: "center",
            aspectRatio: "1/1",
            height: 22,
            borderRadius: 2,
            opacity: 0.2,
            cursor: "pointer",
            fontSize: 20,
        }}
        onClick={onClick}
        onMouseEnter={() => {
            if (refElement.current !== null) {
                refElement.current.style["backgroundColor"] = "rgba(229, 229, 299, 1)";
                refElement.current.style["opacity"] = 1;
            }
        }}
        onMouseLeave={() => {
            if (refElement.current !== null && document.activeElement !== refElement.current) {
                refElement.current.style["backgroundColor"] = "rgba(229, 229, 299, 0)";
                refElement.current.style["opacity"] = 0.2;
            }
        }}
    >
        {children}
    </div>
}

export const ElementArrayPropertyItem = ({ children, refSubElement }: any) => {
    const refElement = React.useRef<any>(null);
    return (
        <div
            ref={refElement}
            style={{
                display: "flex",
                flexFlow: "row",
                justifyContent: "space-between",
                height: 22,
                alignItems: "center",
                fontSize: 13,
            }}
            onMouseEnter={() => {
                if (refElement.current !== null) {
                    refElement.current.style["backgroundColor"] = "rgba(239, 239, 239, 1)";
                }
                if (refSubElement !== undefined && refSubElement.current !== null) {
                    refSubElement.current.style["display"] = "inline-flex";
                }
            }}
            onMouseLeave={() => {
                if (refElement.current !== null && document.activeElement !== refElement.current) {
                    refElement.current.style["backgroundColor"] = "rgba(0, 0, 0, 0)";
                }
                if (refSubElement !== undefined && refSubElement.current !== null) {
                    refSubElement.current.style["display"] = "none";
                }
            }}
        >
            {children}
        </div>
    )
}

