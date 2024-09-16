import * as React from "react"
import { GlobalVariables } from "../../global/GlobalVariables";

export const ElementMacroInput = ({ type, value, placeholder, onChange, onBlur }: any) => {
    const refElement = React.useRef<any>(null);
    return <input
        ref={refElement}
        type={type}
        spellCheck={false}
        placeholder={placeholder}
        onChange={onChange}
        value={value}
        style={{
            width: "100%",
            padding: 0,
            margin: 0,
            border: 0,
            outline: "none",
            backgroundColor: "rgba(0, 0, 0, 0)",
            cursor: "text",
        }}
        onFocus={() => {
            if (refElement.current !== null) {
                refElement.current.style["color"] = "blue";
            }
        }}
        onBlur={(event: any) => {
            if (refElement.current !== null) {
                refElement.current.style["color"] = "rgba(0,0,0,1)";
            }
            onBlur(event);
        }}
    >
    </input>
}

export const ElementMacroTr = ({ index, children }: any) => {
    return (
        <tr
            style={{
                backgroundColor: index % 2 === 1 ? "rgba(245, 245, 245, 0)" : "rgba(245, 245, 245, 1)",
            }}
        >
            {children}
        </tr>
    )
}

export const ElementMacroTd = ({ children, style }: any) => {
    return (
        <td
            style={{
                padding: 0,
                margin: 0,
                height: GlobalVariables.defaultFontSize * 1.5,
                ...style
            }}
        >
            {children}
        </td>
    )
}



export const ElementSmallButton = ({ children, onMouseDown }: any) => {
    const refElement = React.useRef<any>(null);
    return (
        <div
            ref={refElement}
            style={{
                aspectRatio: "1/1",
                borderRadius: 2,
                display: "inline-flex",
                alignItems: "center",
                opacity: 0.2,
                justifyContent: "center",
                cursor: "pointer",
                fontSize: 20,
            }}
            onMouseEnter={() => {
                if (refElement.current !== null) {
                    refElement.current.style["opacity"] = 1;
                }
            }}
            onMouseLeave={() => {
                if (refElement.current !== null) {
                    refElement.current.style["opacity"] = 0.2;
                }
            }}
            onMouseDown={(event: any) => {
                onMouseDown(event);
            }}
        >
            {children}
        </div>
    )
}

export const ElementButton = ({ children, onClick, style }: any) => {
    const refElement = React.useRef<any>(null);
    return (
        <div
            ref={refElement}
            style={{
                width: 20,
                aspectRatio: "1/1",
                opacity: 0.3,
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",
                cursor: "pointer",
                fontSize: 20,
                ...style,
            }}
            onMouseEnter={() => {
                if (refElement.current !== null) {
                    refElement.current.style["opacity"] = 1;
                }
            }}
            onMouseLeave={() => {
                if (refElement.current !== null) {
                    refElement.current.style["opacity"] = 0.3;
                }
            }}
            onClick={() => {
                onClick()
            }}
        >
            {children}
        </div>
    )
}