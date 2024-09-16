import * as React from "react";
// https://styled-components.com/docs/advanced#referring-to-other-components
// https://stackoverflow.com/questions/45841265/react-styled-components-refer-to-other-components

/**
 * Dropdown menu element <br>
 * @param {callbacks} callbacks Drop down menu text and the callback function
 */
export const ElementDropDownMenu = ({ callbacks, fontSize }: any) => {
    const elementSelectRef = React.useRef<any>(null);
    return (
        <div style={{
            display: "inline-flex",
            position: "relative",
            justifyContent: "center",
            cursor: "pointer",
            userSelect: "none",
            // fontSize: fontSize === undefined ? 13 : fontSize,
            backgroundColor: "rgba(0,0,0,0)",
        }}
            onChange={(event: any) => {
                const selectedTabName = event.target.value;
                const callback = callbacks[selectedTabName];
                if (callback !== undefined) {
                    callback();
                }
            }}
        >
            <select
                ref={elementSelectRef}
                style={{
                    display: "inline-flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: 10,
                    border: "none",
                    outline: "none",
                    appearance: "none",
                    color: "rgba(150, 150, 150, 1)",
                    cursor: "pointer",
                    backgroundColor: "rgba(0,0,0,0)",
                    fontSize: fontSize === undefined ? 13 : fontSize,
                }}
                // never change the value
                value="&#8942;"
                onMouseEnter={() => {
                    if (elementSelectRef.current !== null) {
                        elementSelectRef.current.style["color"] = "rgba(0,0,0,1)";
                    }
                }}
                onMouseLeave={() => {
                    if (elementSelectRef.current !== null) {
                        elementSelectRef.current.style["color"] = "rgba(150,150,150,1)";
                    }
                }}
            >
                <option value="&#8942;">&#8942;</option>
                {Object.keys(callbacks).map((name: string) => {
                    return (
                        <option value={name}>{name}</option>
                    )
                })}
            </select>

        </div>
    )
}
