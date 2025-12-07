import * as React from "react"

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

const ElementJsonViewerArray = ({ value }: { value: any[] }) => {
    return (
        <div
            style={{
                ...style,
                left: 20,
            }}
        >
            {value.slice(0, 10).map(
                (element, index) => {
                    if (Array.isArray(element)) {
                        return <ElementJsonViewerArray value={element} />
                    } else if (typeof element === "object") {
                        return <ElementJsonViewerField fieldName="" value={element} topLevel={false}></ElementJsonViewerField>
                    } else {
                        return <div style={{ left: 20 }}>{element}</div>;
                    }
                    return (index === value.length - 1 ? `${element}` : `${element}, `)
                })}
            {value.length > 10 ? `${value.length - 10} more elements ...` : ""}
            
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
        // only show first 20 elements
        return (
            <div
                style={{ ...style, left: topLevel === true ? 0 : 20, flexDirection: "column" }}
            >
                <div style={{ ...style, left: 0 }}>{fieldName} : [</div>
                <ElementJsonViewerArray value={value} />
                <div style={{ ...style, left: 0 }}>]</div>
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