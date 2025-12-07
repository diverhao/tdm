import * as React from "react"
import { GlobalVariables } from "../../../common/GlobalVariables";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../Root/Root";

/**
 * Used on sidebar, for Canvas, Action Button (open display), Embedded Display, and PvTable setting page
 */
export const ElementMacrosTable = (
    {
        headlineName1,
        headlineName2,
        macrosData, // [string, string][]
        addRowCallback, // () => void
        deleteRowCallback, // (index: number) => void
        modifyCellCallback, // (rowIndex: number, columnIndex: number, value: string) => void
    }: any
) => {
    const [, forceUpdate] = React.useState({});

    return (
        <table
            style={{
                margin: 0,
                padding: 0,
                borderSpacing: 0,
                width: "100%",
            }}
        >
            <tbody>
                {/* head line row */}
                <ElementMacroTr index={0}>
                    <ElementMacroTd style={{ width: "40%" }}>
                        <b>{headlineName1}</b>
                    </ElementMacroTd>
                    <ElementMacroTd
                        style={{
                            borderLeft: "1px solid #dddddd",
                            paddingLeft: 3,
                            width: "50%",
                        }}
                    >
                        <b>{headlineName2}</b>
                    </ElementMacroTd>

                    {/* add new row */}
                    <ElementMacroTd
                        style={{
                            width: "10%",
                        }}
                    >
                        <ElementButton
                            onClick={() => {
                                macrosData.push(["", ""]);
                                if (addRowCallback !== undefined) {
                                    addRowCallback()
                                }
                                // add to history
                                const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
                                history.registerAction();
                                forceUpdate({});
                            }}
                        >
                            <img
                                src={`../../../webpack/resources/webpages/add-symbol.svg`}
                                style={{
                                    width: "60%",
                                    height: "60%",
                                }}
                            ></img>

                            {/* &#65291; */}
                        </ElementButton>
                    </ElementMacroTd>
                </ElementMacroTr>

                {/* data rows */}
                {macrosData.map((item: [string, string], index: number) => {
                    const name = item[0];
                    const value = item[1];
                    return (
                        <ElementMacroTr key={`macros-${name}-${value}-${index}`} index={index + 1}>
                            {/* column 1, name */}
                            <ElementMacroTd style={{ width: "40%" }}>
                                <ElementMacroInput
                                    rowIndex={index}
                                    columnIndex={0}
                                    macrosData={macrosData}
                                    modifyCellCallback={modifyCellCallback}
                                ></ElementMacroInput>
                            </ElementMacroTd>
                            {/* column 2, value */}
                            <ElementMacroTd
                                style={{
                                    borderLeft: "1px solid #dddddd",
                                    width: "50%",
                                }}
                            >
                                <ElementMacroInput
                                    rowIndex={index}
                                    columnIndex={1}
                                    macrosData={macrosData}
                                    modifyCellCallback={modifyCellCallback}
                                ></ElementMacroInput>

                            </ElementMacroTd>
                            {/* delete this row */}
                            <ElementMacroTd style={{ width: "10%" }}>
                                <ElementButton
                                    onClick={() => {
                                        macrosData.splice(index, 1);
                                        if (deleteRowCallback !== undefined) {
                                            deleteRowCallback(index)
                                        }
                                        // add to history
                                        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
                                        history.registerAction();
                                        forceUpdate({});
                                    }}
                                >
                                    <img
                                        src={`../../../webpack/resources/webpages/delete-symbol.svg`}
                                        style={{
                                            width: "50%",
                                            height: "50%",
                                        }}
                                    ></img>

                                </ElementButton>
                            </ElementMacroTd>
                        </ElementMacroTr>
                    );
                })}
            </tbody>
        </table>
    )
}

/**
 * One column of data, but show 2 columns: the 1st column is index
 * 
 * It can be used in ByteMonitor bit names
 */
export const ElementMacrosTableSingleColumnData = (
    {
        headlineName1,
        headlineName2,
        macrosData, // string[]
        widgetKey,
    }: any
) => {
    const [, forceUpdate] = React.useState({});

    return (
        <table
            style={{
                margin: 0,
                padding: 0,
                borderSpacing: 0,
                width: "100%",
            }}
        >
            <tbody>
                {/* head line row */}
                <ElementMacroTr index={0}>
                    <ElementMacroTd style={{ width: "40%" }}>
                        <b>{headlineName1}</b>
                    </ElementMacroTd>
                    <ElementMacroTd
                        style={{
                            borderLeft: "1px solid #dddddd",
                            paddingLeft: 3,
                            width: "50%",
                        }}
                    >
                        <b>{headlineName2}</b>
                    </ElementMacroTd>

                    {/* add new row */}
                    <ElementMacroTd
                        style={{
                            width: "10%",
                        }}
                    >
                        <ElementButton
                            onClick={() => {
                                macrosData.push("");
                                // add to history
                                const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
                                history.registerAction();
                                forceUpdate({});
                            }}
                        >
                            <img
                                src={`../../../webpack/resources/webpages/add-symbol.svg`}
                                style={{
                                    width: "60%",
                                    height: "60%",
                                }}
                            ></img>

                            {/* &#65291; */}
                        </ElementButton>
                    </ElementMacroTd>
                </ElementMacroTr>

                {/* data rows */}
                {macrosData.map((item: string, index: number) => {
                    return (
                        <ElementMacroTr key={`macros-${item}-${index}`} index={index + 1}>
                            {/* column 1, name */}
                            <ElementMacroTd style={{ width: "40%" }}>
                                {index}
                            </ElementMacroTd>
                            {/* column 2, value */}
                            <ElementMacroTd
                                style={{
                                    borderLeft: "1px solid #dddddd",
                                    width: "50%",
                                }}
                            >
                                <ElementMacroInputSingleColumnData
                                    rowIndex={index}
                                    columnIndex={0}
                                    macrosData={macrosData}
                                    widgetKey={widgetKey}
                                ></ElementMacroInputSingleColumnData>

                            </ElementMacroTd>
                            {/* delete this row */}
                            <ElementMacroTd style={{ width: "10%" }}>
                                <ElementButton
                                    onClick={() => {
                                        macrosData.splice(index, 1);
                                        // add to history
                                        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
                                        history.registerAction();
                                        forceUpdate({});
                                    }}
                                >
                                    <img
                                        src={`../../../webpack/resources/webpages/delete-symbol.svg`}
                                        style={{
                                            width: "50%",
                                            height: "50%",
                                        }}
                                    ></img>

                                </ElementButton>
                            </ElementMacroTd>
                        </ElementMacroTr>
                    );
                })}
            </tbody>
        </table>
    )
}


export const ElementMacroInput = ({ rowIndex, columnIndex, macrosData, modifyCellCallback }: any) => {
    const refElement = React.useRef<any>(null);
    const [value, setValue] = React.useState(macrosData[rowIndex][columnIndex]);
    return (
        <form
            onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                const origValue = macrosData[rowIndex][columnIndex];
                if (origValue !== value) {
                    macrosData[rowIndex][columnIndex] = value;
                    if (modifyCellCallback !== undefined) {
                        modifyCellCallback(rowIndex, columnIndex, value);
                    }
                    // add to history
                    const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
                    history.registerAction();
                }
            }}
            style={{
                display: "inline-flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 2,
                marginBottom: 2,
                width: "95%",
                paddingLeft: 3
            }}
        >

            <input
                ref={refElement}
                type={"text"}
                spellCheck={false}
                placeholder={""}
                onChange={(event: any) => {
                    event.preventDefault();
                    setValue(event.target.value);
                }}
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
                        refElement.current.style["outline"] = "solid 1px black";
                    }
                }}
                onBlur={(event: any) => {
                    if (refElement.current !== null) {
                        refElement.current.style["outline"] = "solid 0px black";
                    }
                    const origValue = macrosData[rowIndex][columnIndex];
                    if (origValue !== value) {
                        setValue(origValue);
                    }
                }}
            >
            </input>
        </form>
    )
}

export const ElementMacroInputSingleColumnData = ({widgetKey, rowIndex, macrosData }: any) => {
    const refElement = React.useRef<any>(null);
    const [value, setValue] = React.useState(macrosData[rowIndex]);
    return (
        <form
            onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                const origValue = macrosData[rowIndex];
                if (origValue !== value) {
                    macrosData[rowIndex] = value;
                    // add to history
                    const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
                    history.registerAction();
                    // flush this widget
                    g_widgets1.addToForceUpdateWidgets(widgetKey);
                    g_widgets1.addToForceUpdateWidgets("GroupSelection2");
                    g_flushWidgets();
                }
            }}
            style={{
                display: "inline-flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 2,
                marginBottom: 2,
                width: "95%",
                paddingLeft: 3
            }}
        >

            <input
                ref={refElement}
                type={"text"}
                spellCheck={false}
                placeholder={""}
                onChange={(event: any) => {
                    event.preventDefault();
                    setValue(event.target.value);
                }}
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
                        refElement.current.style["outline"] = "solid 1px black";
                    }
                }}
                onBlur={(event: any) => {
                    if (refElement.current !== null) {
                        refElement.current.style["outline"] = "solid 0px black";
                    }
                    const origValue = macrosData[rowIndex];
                    if (origValue !== value) {
                        setValue(origValue);
                    }
                }}
            >
            </input>
        </form>
    )
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