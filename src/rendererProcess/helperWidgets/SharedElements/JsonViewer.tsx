import * as React from "react"
import { g_widgets1, GlobalVariables } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../Root/Root";

const style: React.CSSProperties = {
    position: "relative",
    display: "inline-flex",
    flexDirection: "column",
    marginTop: 3,
}

export const ElementJsonViewer = ({ json, topLevel, }: { json: Record<string, any>, topLevel: boolean, }) => {
    return (
        <div
            style={{
                position: "relative",
                display: "inline-flex",
                flexDirection: "column",
                // marginTop: 2,
            }}
        >
            {Object.entries(json).map(([fieldName, value]) => {
                return (
                    <ElementJsonViewerField fieldName={fieldName} value={value} topLevel={topLevel}></ElementJsonViewerField>
                )
            })}
        </div>
    )
}


const ElementJsonViewerField = ({ fieldName, value, topLevel }: { fieldName: string, value: any, topLevel: boolean }) => {
    const [expanded, setExpanded] = React.useState(true);

    if (typeof value === "number" || typeof value === "string" || typeof value === "boolean") {
        return (
            <div
                style={{ ...style, left: topLevel === true ? 0 : 20 }}
            >
                {fieldName} : {value}
            </div>
        )
    } else if (Array.isArray(value)) {
        return (
            <div
                style={{ ...style, left: topLevel === true ? 0 : 20 }}
            >
                {fieldName} : [{value.map((element, index) => { return (index === value.length - 1 ? `${element}` : `${element}, `) })}]
            </div>
        )
    } else if (typeof value === "object") {
        return (
            <div
                style={{ ...style, left: topLevel === true ? 0 : 20 }}
            >
                <div
                    style={{
                        display: "inline-flex",
                        flexDirection: "row",
                        justifyContent: "flex-start",
                        alignItems: "center",
                        cursor: "pointer",
                    }}
                        onMouseDown={(event: any) => {
                            setExpanded(!expanded);
                        }}
                >
                    {fieldName} {" "}
                    <img src={"../../resources/webpages/arrowDown.svg"} height={"8px"}
                        style={{ marginLeft: 5, transform: expanded === true ? "" : `rotate(270deg)` }}

                    ></img>
                </div>
                {expanded === true ?
                    <ElementJsonViewer json={value} topLevel={false} ></ElementJsonViewer>
                    :
                    null
                }
            </div>
        )
    } else {
        return (
            <div
                style={{ ...style, left: topLevel === true ? 0 : 20 }}
            >
                {fieldName} : {value}
            </div>
        )
    }
}