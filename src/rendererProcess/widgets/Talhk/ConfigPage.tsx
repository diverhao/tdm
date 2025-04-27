import * as React from "react";
import { MainPage } from "./MainPage";
import { ElementRectangleButton } from "./RectangleButton";
import { ElementModifyButton } from "./SharedElements";
import { calcSeverityColor, capitalizeFirstLetter, replaceObjectField } from "./GlobalMethod";

export class ConfigPage {
    private _mainPage: MainPage;
    showingConfigPage = "";

    constructor(mainPage: MainPage) {
        this._mainPage = mainPage;
        this.styleInputBox = {
            paddingTop: 1,
            paddingBottom: 1,
            paddingLeft: 2,
            paddingRight: 2,
            border: "solid 1px rgba(120, 120, 120, 1)",
            borderRadius: 0,
            outline: "none",
            fontSize: this.getMainPage().baseFontSize,
            fontFamily: this.getMainPage().baseFontFamily,
        }
    }


    _ElementConfig = () => {
        const pathStr = this.showingConfigPage;
        let nodeName0 = "";

        if (this.showingConfigPage !== "") {
            for (const path of JSON.parse(pathStr)) {
                if (path !== "pvs" && path !== "subsystems") {
                    nodeName0 = path;
                }
            }
        }

        if (pathStr !== "") {
            const path = JSON.parse(pathStr);
            const data = this.getMainPage().getData(path);
            return (
                <div style={{
                    position: "absolute",
                    display: "inline-flex",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    flexDirection: "column",
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: "rgba(155,155,155, 0.2)",
                    backdropFilter: "blur(10px)",
                    boxSizing: "border-box",
                    margin: 0,
                    overflow: "hidden",
                }}
                >
                    <div
                        style={{
                            display: "inline-flex",
                            flexDirection: "row",
                            fontSize: 25,
                            fontWeight: "bold",
                        }}
                    >
                        {JSON.parse(pathStr).map((name: string, index: number) => {
                            if (name === "subsystems" || name === "pvs") {
                                return null;
                            } else {
                                if (index === JSON.parse(pathStr).length - 1) {
                                    // the last element
                                    return (
                                        <>
                                            <this._ElementConfigTitle
                                                nodeName0={nodeName0}
                                                pathStr={pathStr}
                                                index={index}
                                            >
                                            </this._ElementConfigTitle>
                                            {index === JSON.parse(pathStr).length - 1 ? "" : <>&nbsp;&#8212;&nbsp;</>}
                                        </>
                                    )
                                } else {
                                    return (
                                        <>
                                            {name}
                                            {index === JSON.parse(pathStr).length - 1 ? "" : <>&nbsp;&#8212;&nbsp;</>}
                                        </>
                                    )
                                }
                            }
                        })}
                    </div>
                    <div style={{
                        fontSize: this.getMainPage().baseFontSize,
                        color: "rgba(120, 120, 120, 1)",
                        marginBottom: 15,
                    }}>
                        Click to edit, press Enter key to confirm changes, press Esc key to cancel changes.
                    </div>
                    <div
                        style={{
                            width: "80%",
                            height: "80%",
                            overflowX: "hidden",
                            overflowY: "auto",
                            backgroundColor: 'rgba(255,255,255,1)',
                            padding: 20,
                            borderRadius: 5,
                        }}
                    >
                        {Object.entries(data).map(([fieldName, fieldValue]: any, index: number) => {
                            if (fieldName === "description") {
                                return (
                                    <this._ElementConfigDescription
                                        key={fieldName + `${index}`}
                                        name={fieldName}
                                        value={fieldValue}
                                        pathStr={JSON.stringify([...path, fieldName])}
                                    >
                                    </this._ElementConfigDescription>
                                )
                            } else if (fieldName === "enabled") {
                                return (
                                    <this._ElementConfigEnabled
                                        key={fieldName + `${index}`}
                                        name={fieldName}
                                        value={fieldValue}
                                        pathStr={JSON.stringify([...path, fieldName])}
                                    >
                                    </this._ElementConfigEnabled>
                                )
                            } else if (fieldName === "annunciating") {
                                return (
                                    <this._ElementConfigAnnuciating
                                        key={fieldName + `${index}`}
                                        name={fieldName}
                                        value={fieldValue}
                                        pathStr={JSON.stringify([...path, fieldName])}
                                    >
                                    </this._ElementConfigAnnuciating>
                                )
                            } else if (fieldName === "delay") {
                                return (
                                    <this._ElementConfigDelay
                                        key={fieldName + `${index}`}
                                        name={fieldName}
                                        value={fieldValue}
                                        pathStr={JSON.stringify([...path, fieldName])}
                                    >
                                    </this._ElementConfigDelay>
                                )
                            } else if (fieldName === "filter") {
                                return (
                                    <this._ElementConfigFilter
                                        key={fieldName + `${index}`}
                                        name={fieldName}
                                        value={fieldValue}
                                        pathStr={JSON.stringify([...path, fieldName])}
                                    >
                                    </this._ElementConfigFilter>
                                )
                            } else if (fieldName === "count") {
                                return (
                                    <this._ElementConfigCount
                                        key={fieldName + `${index}`}
                                        name={fieldName}
                                        value={fieldValue}
                                        pathStr={JSON.stringify([...path, fieldName])}
                                    >
                                    </this._ElementConfigCount>
                                )
                            } else if (fieldName === "latching") {
                                return (
                                    <this._ElementConfigLatching
                                        key={fieldName + `${index}`}
                                        name={fieldName}
                                        value={fieldValue}
                                        pathStr={JSON.stringify([...path, fieldName])}
                                    >
                                    </this._ElementConfigLatching>
                                )
                            } else if (fieldName === "guidances") {
                                return (
                                    <this._ElementConfigGuidances
                                        key={fieldName + `${index}`}
                                        name={fieldName}
                                        value={fieldValue}
                                        pathStr={JSON.stringify([...path, fieldName])}
                                    >
                                    </this._ElementConfigGuidances>
                                )
                            } else if (fieldName === "displays") {
                                return (
                                    <this._ElementConfigDisplays
                                        key={fieldName + `${index}`}
                                        name={fieldName}
                                        value={fieldValue}
                                        pathStr={JSON.stringify([...path, fieldName])}
                                    >
                                    </this._ElementConfigDisplays>
                                )
                            } else if (fieldName === "commands") {
                                return (
                                    <this._ElementConfigCommands
                                        key={fieldName + `${index}`}
                                        name={fieldName}
                                        value={fieldValue}
                                        pathStr={JSON.stringify([...path, fieldName])}
                                    >
                                    </this._ElementConfigCommands>
                                )
                            } else if (fieldName === "automated_actions") {
                                return (
                                    <this._ElementConfigAutomatedActions
                                        key={fieldName + `${index}`}
                                        name={fieldName}
                                        value={fieldValue}
                                        pathStr={JSON.stringify([...path, fieldName])}
                                    >
                                    </this._ElementConfigAutomatedActions>
                                )
                            } else {
                                return null
                            }
                        })}
                        <div
                            style={{
                                width: "100%",
                                alignItems: "center",
                                justifyContent: "center",
                                display: "inline-flex",
                                marginTop: 20,
                            }}
                        >
                            <ElementRectangleButton
                                handleMouseDown={(event: any) => {
                                    this.showingConfigPage = "";
                                    this.getMainPage().forceUpdate();
                                }}
                                fontSize={this.getMainPage().baseFontSize}
                            >
                                OK
                            </ElementRectangleButton>
                        </div>
                    </div>
                </div>
            )
        } else {
            return null;
        }
    }

    _ElementConfigTitle = ({ nodeName0, pathStr, index }: any) => {
        const [nodeName, setNodeName] = React.useState(nodeName0);
        const inputRef = React.useRef<any>(null);

        const submitting = React.useRef<boolean>(false);

        return (
            <form onSubmit={(event: any) => {
                event.preventDefault();
                const path = JSON.parse(pathStr) as string[];
                const nodeConfigJson = this.getMainPage().getData(path);
                const parentPath = path.slice(0, path.length - 1);
                const parentConfigJson = this.getMainPage().getData(parentPath);
                replaceObjectField(parentConfigJson, nodeName0, nodeName, nodeConfigJson);
                this.showingConfigPage = JSON.stringify([...parentPath, nodeName]);

                if (inputRef.current !== null) {
                    submitting.current = true;
                    inputRef.current.blur();
                }

                this.getMainPage().sendNewData(parentPath, parentConfigJson);
            }}>
                <input
                    ref={inputRef}
                    style={{
                        fontFamily: this.getMainPage().baseFontFamily,
                        fontSize: 25,
                        fontWeight: "bold",
                        border: "none",
                        outline: "none",
                        textAlign: index === 0 ? "center" : "left",
                        backgroundColor: "rgba(0,0,0,0)",
                    }}
                    spellCheck={false}
                    value={nodeName}
                    onChange={(event: any) => {
                        event.preventDefault();
                        nodeName0 = event.target.value;
                        setNodeName(event.target.value);
                    }}
                    onFocus={(event: any) => {
                        if (inputRef.current !== null) {
                            inputRef.current.style["backgroundColor"] = "rgba(255, 255, 0, 1)";
                            inputRef.current.style["outline"] = "solid 1px rgba(120, 120, 120, 1)";
                            inputRef.current.style["cursor"] = "text";
                        }
                    }}
                    onBlur={(event: any) => {
                        if (inputRef.current !== null) {
                            inputRef.current.style["backgroundColor"] = "rgba(255, 255, 0, 0)";
                            inputRef.current.style["outline"] = "none";
                            inputRef.current.style["cursor"] = "pointer";
                            if (submitting.current === true) {
                                submitting.current = false;
                            } else {
                                setNodeName(nodeName0);
                            }

                        }
                    }}
                    onKeyDown={(event: any) => {
                        if (event.key === "Escape") {
                            if (inputRef.current !== null) {
                                inputRef.current.blur();
                            }
                        }
                    }}
                >
                </input>
            </form>

        )

    }

    /**
     * {abc: "def"}
     */
    _ElementConfigString = ({ pathStr, name, value }: { pathStr: string, name: string, value: string }) => {

        return (
            <div
                style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    width: "100%",
                    boxSizing: "border-box",
                    margin: 5,
                    justifyContent: "flex-start",
                    alignItems: "center",
                }}
            >
                <div style={{
                    width: "20%"
                }}>
                    {capitalizeFirstLetter(name)}
                </div>
                <this._ElementInputBoxFieldValue
                    pathStr={pathStr}
                    value={value}
                    width={"60%"}
                >
                </this._ElementInputBoxFieldValue>

            </div>
        )
    }

    _ElementConfigBoolean = ({ pathStr, name, value }: { pathStr: string, name: string, value: boolean }) => {
        const [value1, setValue1] = React.useState(value)
        return (
            <div
                style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    width: "100%",
                    // backgroundColor: "rgba(255,0,255,1)",
                    boxSizing: "border-box",
                    margin: 5,
                    justifyContent: "flex-start",
                    alignItems: "center",
                }}
            >
                <div style={{
                    width: "20%"
                }}>
                    {capitalizeFirstLetter(name)}
                </div>
                <form
                    style={{
                        width: "60%",
                    }}

                    onSubmit={(event: any) => {
                        event.preventDefault();
                    }}>
                    <input
                        type="checkbox"
                        checked={value}
                        onChange={(event: any) => {
                            event.preventDefault();
                            this.getMainPage().sendNewData(JSON.parse(pathStr), !value1)
                            setValue1(!value1);
                        }}
                        style={{
                            fontFamily: this.getMainPage().baseFontFamily,
                            width: this.getMainPage().baseFontSize,
                            height: this.getMainPage().baseFontSize,
                        }}
                    >
                    </input>
                </form>
            </div>
        )
    }

    _ElementConfigNumber = ({ pathStr, name, value }: { pathStr: string, name: string, value: number }) => {

        return (
            <div
                style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    width: "100%",
                    // backgroundColor: "rgba(0,255,255,1)",
                    boxSizing: "border-box",
                    margin: 5,
                    justifyContent: "flex-start",
                    alignItems: "center",
                }}

            >
                <div style={{
                    width: "20%",
                }}>
                    {capitalizeFirstLetter(name)}
                </div>
                <this._ElementInputBoxFieldValue
                    pathStr={pathStr}
                    value={value}
                    width={"60%"}
                    type={"number"}
                >
                </this._ElementInputBoxFieldValue>

            </div>
        )
    }

    /**
     * "guidances": {
     *     "guidance #1": {
     *          "details": "This is about beam permit"
     *      },
     *     "guidance #2": {
     *          "details": "This is really about beam permit"
     *      }
     * },
     */

    _ElementConfigStringDetails = ({ name, value, pathStr }: { name: string, value: Record<string, { details: string }>, pathStr: string }) => {
        return (
            <div
                style={{
                    display: "inline-flex",
                    flexDirection: "column",
                    width: "100%",
                    // backgroundColor: "rgba(180,180,180,1)",
                    boxSizing: "border-box",
                    margin: 5,
                }}
            >
                <div
                    style={{
                        // margin: 5,
                        marginTop: 5,
                        marginBottom: 5,
                        paddingLeft: 0,
                        display: "inline-flex",
                        flexDirection: "row",
                        justifyContent: "flex-start",
                        alignItems: "center",
                        fontWeight: "bold",
                    }}
                >
                    {capitalizeFirstLetter(name)}

                    <ElementModifyButton
                        imgSrc="add-symbol.svg"
                        handleClick={() => {

                            // update the whole StringDetails
                            // replace the 
                            const thisPath = JSON.parse(pathStr);
                            // const parentPath = thisPath.slice(0, thisPath.length - 1);
                            // const parentPathStr = JSON.stringify(parentPath);
                            // const parentData = this.getMainPage().getData(parentPath);
                            value[`New ${name} ${Math.random()}`] = {
                                details: `Detail about this ${name}`
                            }
                            this.getMainPage().sendNewData(thisPath, value);

                        }}
                        hint={""}
                        setHint={(hint: string) => { }}
                    ></ElementModifyButton>
                </div>
                <div
                    style={{
                        display: "inline-flex",
                        flexDirection: "column",
                        width: "100%",
                        backgroundColor: "rgba(220,220,220,1)",
                        boxSizing: "border-box",
                        // margin: 5,
                        padding: 5,
                        borderRadius: 5,
                    }}
                >
                    {Object.keys(value).length === 0 ? `No ${name} defined.` : <this._ElementConfigStringDetailsHead></this._ElementConfigStringDetailsHead>}

                    {Object.entries(value).map(([fieldName, fieldValue]: [string, { details: string }], index: number) => {
                        return (
                            <this._ElementConfigStringDetail
                                key={fieldName + `-${index}`}
                                pathStr={JSON.stringify([...JSON.parse(pathStr), fieldName])}
                                details={fieldValue["details"]}
                            >

                            </this._ElementConfigStringDetail>
                        )
                    })}
                </div>
            </div>
        )
    }

    _ElementConfigAutomatedActions = ({ name, value, pathStr }: { name: string, value: Record<string, { delay: number, type: string, details: string }>, pathStr: string }) => {
        return (
            <div
                style={{
                    display: "inline-flex",
                    flexDirection: "column",
                    width: "100%",
                    // backgroundColor: "rgba(180,180,180,1)",
                    boxSizing: "border-box",
                    margin: 5,
                }}
            >
                <div
                    style={{
                        // margin: 5,
                        marginTop: 5,
                        marginBottom: 5,
                        paddingLeft: 0,
                        display: "inline-flex",
                        flexDirection: "row",
                        justifyContent: "flex-start",
                        alignItems: "center",
                        fontWeight: "bold",
                    }}
                >
                    {capitalizeFirstLetter(name).replaceAll("_", " ")}

                    <ElementModifyButton
                        imgSrc="add-symbol.svg"
                        handleClick={() => {
                            // update the whole StringDetails
                            // replace the 
                            const thisPath = JSON.parse(pathStr);
                            // const parentPath = thisPath.slice(0, thisPath.length - 1);
                            // const parentPathStr = JSON.stringify(parentPath);
                            // const parentData = this.getMainPage().getData(parentPath);
                            value[`New ${name} ${Math.random()}`] = {
                                delay: 0,
                                type: "sevrpv",
                                details: "pv_name"
                            };
                            this.getMainPage().sendNewData(thisPath, value);

                        }}
                        hint=""
                        setHint={(hint: string) => { }}
                    ></ElementModifyButton>
                </div>
                <div
                    style={{
                        display: "inline-flex",
                        flexDirection: "column",
                        width: "100%",
                        backgroundColor: "rgba(220,220,220,1)",
                        boxSizing: "border-box",
                        // margin: 5,
                        padding: 5,
                        borderRadius: 5,
                    }}
                >
                    {/* head */}
                    {
                        Object.keys(value).length === 0 ?
                            `No ${name} defined.`
                            :
                            <this._ElementConfigAutomatedActionHead></this._ElementConfigAutomatedActionHead>
                    }

                    {/* fields */}
                    {Object.entries(value).map(([fieldName, fieldValue]: [string, { delay: number, type: string, details: string }], index: number) => {
                        return (
                            <this._ElementConfigAutomatedAction
                                key={fieldName + `-${index}`}
                                pathStr={JSON.stringify([...JSON.parse(pathStr), fieldName])}
                            >

                            </this._ElementConfigAutomatedAction>
                        )
                    })}
                </div>
            </div>
        )
    }


    // _ElementConfigAutomatedAction = ({ pathStr, name, delay, type, detail }: { pathStr: string, name: string, delay: number, type: string, detail: string }) => {
    _ElementConfigAutomatedAction = ({ pathStr }: { pathStr: string }) => {
        // const [name1, setName1] = React.useState(name);
        // const [details1, setDetails1] = React.useState(details);

        const elementRef = React.useRef<any>(null);
        const elementControlRef = React.useRef<any>(null);

        return (
            <div
                ref={elementRef}
                style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    width: "100%",
                    // backgroundColor: "rgba(180,180,180,1)",
                    boxSizing: "border-box",
                    margin: 5,
                    justifyContent: "flex-start",
                    alignItems: "center",
                }}
                onMouseEnter={() => {
                    if (elementControlRef.current !== null) {
                        elementControlRef.current.style["visibility"] = "visible";
                    }
                }}

                onMouseLeave={() => {
                    if (elementControlRef.current !== null) {
                        elementControlRef.current.style["visibility"] = "hidden";
                    }
                }}

            >
                {/* name */}
                <this._ElementInputBoxFieldName
                    pathStr={pathStr}
                    width={"20%"}
                >
                </this._ElementInputBoxFieldName>

                {/* delay */}
                <this._ElementInputBoxFieldValue
                    pathStr={JSON.stringify([...JSON.parse(pathStr), "delay"])}
                    value={this.getMainPage().getData([...JSON.parse(pathStr), "delay"])}
                    width={"8%"}
                    type={"number"}
                >
                </this._ElementInputBoxFieldValue>

                {/* type */}
                <this._ElementInputBoxFieldValue
                    pathStr={JSON.stringify([...JSON.parse(pathStr), "type"])}
                    value={this.getMainPage().getData([...JSON.parse(pathStr), "type"])}
                    width={"12%"}
                >
                </this._ElementInputBoxFieldValue>

                {/* detail */}
                <this._ElementInputBoxFieldValue
                    pathStr={JSON.stringify([...JSON.parse(pathStr), "details"])}
                    value={this.getMainPage().getData([...JSON.parse(pathStr), "details"])}
                    width={"50%"}
                >
                </this._ElementInputBoxFieldValue>

                {/* controls */}
                <div
                    ref={elementControlRef}
                    style={{
                        visibility: "hidden",
                    }}
                >
                    <ElementModifyButton
                        imgSrc={"arrowUp-2.svg"}
                        handleClick={() => {
                            // event.preventDefault();
                            // update the whole StringDetails
                            const thisPath = JSON.parse(pathStr);
                            const name = thisPath[thisPath.length - 1];
                            const parentPath = thisPath.slice(0, thisPath.length - 1);
                            const parentPathStr = JSON.stringify(parentPath);
                            const parentData = this.getMainPage().getData(parentPath);
                            const thisData = this.getMainPage().getData(thisPath);
                            const thisIndex = Object.keys(parentData).indexOf(name);
                            if (thisIndex === 0) {
                                return;
                            }

                            const [prevFieldName, prevFieldData] = Object.entries(parentData)[thisIndex - 1];
                            const prevFieldNameTmp = prevFieldName + `${Math.random()}`;

                            replaceObjectField(parentData, prevFieldName, prevFieldNameTmp,
                                {
                                    details: "",
                                }
                            );
                            replaceObjectField(parentData, name, prevFieldName,
                                prevFieldData
                            );
                            replaceObjectField(parentData, prevFieldNameTmp, name,
                                thisData
                            );
                            this.getMainPage().sendNewData(parentPath, parentData);

                        }}
                        hint={""}
                        setHint={(hint: string) => { }}
                    ></ElementModifyButton>


                    <ElementModifyButton
                        imgSrc="arrowDown-2.svg"
                        handleClick={() => {
                            // update the whole StringDetails
                            const thisPath = JSON.parse(pathStr);
                            const name = thisPath[thisPath.length - 1];
                            const parentPath = thisPath.slice(0, thisPath.length - 1);
                            const parentPathStr = JSON.stringify(parentPath);
                            const parentData = this.getMainPage().getData(parentPath);
                            const thisData = this.getMainPage().getData(thisPath);
                            const thisIndex = Object.keys(parentData).indexOf(name);
                            if (thisIndex === Object.keys(parentData).length - 1) {
                                return;
                            }

                            const [nextFieldName, nextFieldData] = Object.entries(parentData)[thisIndex + 1];
                            const nextFieldNameTmp = nextFieldName + `${Math.random()}`;

                            replaceObjectField(parentData, nextFieldName, nextFieldNameTmp,
                                {
                                    details: "",
                                }
                            );
                            replaceObjectField(parentData, name, nextFieldName,
                                nextFieldData
                            );
                            replaceObjectField(parentData, nextFieldNameTmp, name,
                                thisData
                            );
                            this.getMainPage().sendNewData(parentPath, parentData);

                        }}
                        hint={""}
                        setHint={(hint: string) => { }}
                    >
                    </ElementModifyButton>


                    <ElementModifyButton
                        imgSrc="delete-symbol.svg"
                        handleClick={() => {
                            // update the whole StringDetails
                            const thisPath = JSON.parse(pathStr);
                            const name = thisPath[thisPath.length - 1];
                            const parentPath = thisPath.slice(0, thisPath.length - 1);
                            const parentPathStr = JSON.stringify(parentPath);
                            const parentData = this.getMainPage().getData(parentPath);
                            delete parentData[name];
                            this.getMainPage().sendNewData(parentPath, parentData);

                        }}
                        hint={""}
                        setHint={(hint: string) => { }}
                    >
                    </ElementModifyButton>
                </div>
            </div>
        )
    }

    _ElementConfigAutomatedActionHead = () => {
        return (
            <div
                style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    width: "100%",
                    // backgroundColor: "rgba(180,180,180,1)",
                    boxSizing: "border-box",
                    margin: 5,
                    justifyContent: "flex-start",
                    alignItems: "center",
                    fontWeight: "bold",
                }}
            >
                <div
                    style={{
                        width: "20%",
                        paddingLeft: 3,
                    }}
                >
                    Title
                </div>
                <div
                    style={{
                        width: "8%",
                        paddingLeft: 0,
                    }}
                >
                    Delay
                </div>
                <div
                    style={{
                        width: "12%",
                        paddingLeft: 0,
                    }}
                >
                    Type
                </div>
                <div>
                    Details
                </div>
            </div>
        )
    }

    _ElementConfigStringDetailsHead = () => {
        return (
            <div
                style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    width: "100%",
                    // backgroundColor: "rgba(180,180,180,1)",
                    boxSizing: "border-box",
                    margin: 5,
                    justifyContent: "flex-start",
                    alignItems: "center",
                    fontWeight: "bold",
                }}
            >
                <div
                    style={{
                        width: "20%",
                        paddingLeft: 3,
                    }}
                >
                    Title
                </div>
                <div>
                    Details
                </div>
            </div>
        )
    }

    // "guidance #1": {
    //     "details": "This is about beam permit"
    // },
    // a row with 2 inputs: one for name, the other for value
    // pathStr = [..., "guidance #1"]
    // details = ...
    _ElementConfigStringDetail = ({ pathStr, details }: { pathStr: string, details: string }) => {
        // const [name1, setName1] = React.useState(name);
        // const [details1, setDetails1] = React.useState(details);

        const elementRef = React.useRef<any>(null);
        const elementControlRef = React.useRef<any>(null);

        return (
            <div
                ref={elementRef}
                style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    width: "100%",
                    // backgroundColor: "rgba(180,180,180,1)",
                    boxSizing: "border-box",
                    margin: 5,
                    justifyContent: "flex-start",
                    alignItems: "center",
                }}
                onMouseEnter={() => {
                    if (elementControlRef.current !== null) {
                        elementControlRef.current.style["visibility"] = "visible";
                    }
                }}

                onMouseLeave={() => {
                    if (elementControlRef.current !== null) {
                        elementControlRef.current.style["visibility"] = "hidden";
                    }
                }}

            >
                {/* name */}
                <this._ElementInputBoxFieldName
                    pathStr={pathStr}
                    width={"20%"}
                >
                </this._ElementInputBoxFieldName>

                {/* details */}
                <this._ElementInputBoxFieldValue
                    pathStr={JSON.stringify([...JSON.parse(pathStr), "details"])}
                    value={details}
                    width={"60%"}
                >
                </this._ElementInputBoxFieldValue>

                {/* controls */}
                <div
                    ref={elementControlRef}
                    style={{
                        visibility: "hidden",
                    }}
                >
                    <ElementModifyButton
                        imgSrc={"arrowUp-2.svg"}
                        handleClick={() => {

                            // update the whole StringDetails

                            const thisPath = JSON.parse(pathStr);
                            const name = thisPath[thisPath.length - 1];
                            const parentPath = thisPath.slice(0, thisPath.length - 1);
                            const parentPathStr = JSON.stringify(parentPath);
                            const parentData = this.getMainPage().getData(parentPath);
                            const thisData = {
                                details: details,
                            };
                            const thisIndex = Object.keys(parentData).indexOf(name);
                            if (thisIndex === 0) {
                                return;
                            }

                            const [prevFieldName, prevFieldData] = Object.entries(parentData)[thisIndex - 1];
                            const prevFieldNameTmp = prevFieldName + `${Math.random()}`;

                            replaceObjectField(parentData, prevFieldName, prevFieldNameTmp,
                                {
                                    details: "",
                                }
                            );
                            replaceObjectField(parentData, name, prevFieldName,
                                prevFieldData
                            );
                            replaceObjectField(parentData, prevFieldNameTmp, name,
                                thisData
                            );
                            this.getMainPage().sendNewData(parentPath, parentData);

                        }}
                        hint=""
                        setHint={(hint: string) => { }}
                    >

                    </ElementModifyButton>

                    <ElementModifyButton

                        imgSrc={"arrowDown-2.svg"}
                        handleClick={() => {

                            // update the whole StringDetails
                            const thisPath = JSON.parse(pathStr);
                            const name = thisPath[thisPath.length - 1];
                            const parentPath = thisPath.slice(0, thisPath.length - 1);
                            const parentPathStr = JSON.stringify(parentPath);
                            const parentData = this.getMainPage().getData(parentPath);
                            const thisData = {
                                details: details,
                            };
                            const thisIndex = Object.keys(parentData).indexOf(name);
                            if (thisIndex === Object.keys(parentData).length - 1) {
                                return;
                            }

                            const [nextFieldName, nextFieldData] = Object.entries(parentData)[thisIndex + 1];
                            const nextFieldNameTmp = nextFieldName + `${Math.random()}`;

                            replaceObjectField(parentData, nextFieldName, nextFieldNameTmp,
                                {
                                    details: "",
                                }
                            );
                            replaceObjectField(parentData, name, nextFieldName,
                                nextFieldData
                            );
                            replaceObjectField(parentData, nextFieldNameTmp, name,
                                thisData
                            );
                            this.getMainPage().sendNewData(parentPath, parentData);

                        }}
                        hint=""
                        setHint={(hint: string) => { }}
                    >
                    </ElementModifyButton>


                    <ElementModifyButton
                        imgSrc="delete-symbol.svg"
                        handleClick={() => {

                            // update the whole StringDetails
                            // replace the 
                            const thisPath = JSON.parse(pathStr);
                            const name = thisPath[thisPath.length - 1];
                            const parentPath = thisPath.slice(0, thisPath.length - 1);
                            const parentPathStr = JSON.stringify(parentPath);
                            const parentData = this.getMainPage().getData(parentPath);
                            delete parentData[name];
                            this.getMainPage().sendNewData(parentPath, parentData);

                        }}
                        hint=""
                        setHint={(hint: string) => { }}
                    >
                    </ElementModifyButton>
                </div>
            </div>
        )
    }

    _ElementInputBoxFieldValue = ({ pathStr, value, width, type }: any) => {

        const inputRef = React.useRef<any>(null);

        const [value1, setValue1] = React.useState(`${value}`);

        const submitting = React.useRef<boolean>(false);

        return (
            <form
                onSubmit={(event: any) => {
                    event.preventDefault();
                    if (type === "number") {
                        const valueNum = parseFloat(value1);

                        if (isNaN(valueNum)) {
                            if (inputRef.current !== null) {
                                inputRef.current.blur();
                            }
                            return;
                        } else {
                            if (inputRef.current !== null) {
                                submitting.current = true;
                                inputRef.current.blur()
                            }
                            this.getMainPage().sendNewData(JSON.parse(pathStr), valueNum)
                        }
                    } else {
                        if (inputRef.current !== null) {
                            submitting.current = true;
                            inputRef.current.blur()
                        }

                        this.getMainPage().sendNewData(JSON.parse(pathStr), value1)
                    }

                }}
                onKeyDown={(event: any) => {
                    if (event.key === "Escape") {
                        if (inputRef.current !== null) {
                            inputRef.current.blur()
                        }
                    }
                }}
                style={{
                    width: width,

                }}

            >

                <input
                    ref={inputRef}
                    type={"text"}
                    spellCheck={false}
                    style={{
                        ...this.styleInputBox,
                        fontFamily: this.getMainPage().baseFontFamily,
                        width: "95%",
                        backgroundColor: "rgba(0,0,0,0)",
                        border: "solid 1px rgba(120, 120, 120, 0)",
                        cursor: "pointer",
                    }}
                    onChange={(event: any) => {
                        event.preventDefault();
                        setValue1(event.target.value);

                    }}
                    value={value1}
                    onFocus={(event: any) => {
                        if (inputRef.current !== null) {
                            inputRef.current.style["backgroundColor"] = "rgba(255,255,0,1)";
                            inputRef.current.style["border"] = "solid 1px rgba(120, 120, 120, 1)";
                            inputRef.current.style["cursor"] = "text";
                        }
                    }}

                    onBlur={(event: any) => {
                        if (inputRef.current !== null) {
                            inputRef.current.style["backgroundColor"] = "rgba(255,255,255,0)";
                            inputRef.current.style["border"] = "solid 1px rgba(120, 120, 120, 0)";
                            inputRef.current.style["cursor"] = "pointer";
                            if (submitting.current === true) {
                                submitting.current = false;
                            } else {
                                setValue1(`${value}`);
                            }

                        }
                    }}
                >
                </input>
            </form>
        )
    }

    _ElementInputBoxFieldName = ({ pathStr, width }: any) => {

        const inputRef = React.useRef<any>(null);

        const [name, setName] = React.useState(JSON.parse(pathStr)[JSON.parse(pathStr).length - 1]);

        const submitting = React.useRef<boolean>(false);

        return (
            <form
                onSubmit={(event: any) => {
                    event.preventDefault();
                    if (inputRef.current !== null) {
                        submitting.current = true;
                        inputRef.current.blur()
                    }
                    const thisPath = JSON.parse(pathStr);
                    const thisData = this.getMainPage().getData(thisPath);
                    const parentPath = JSON.parse(pathStr);
                    parentPath.splice(parentPath.length - 1, 1);
                    const parentData = this.getMainPage().getData(parentPath);
                    replaceObjectField(parentData, JSON.parse(pathStr)[JSON.parse(pathStr).length - 1], name, thisData);
                    this.getMainPage().sendNewData(parentPath, parentData);
                }}
                onKeyDown={(event: any) => {
                    if (event.key === "Escape") {
                        if (inputRef.current !== null) {
                            inputRef.current.blur()
                        }
                    }
                }}
                style={{
                    width: width,
                }}

            >

                <input
                    ref={inputRef}
                    type={"text"}
                    spellCheck={false}
                    style={{
                        ...this.styleInputBox,
                        fontFamily: this.getMainPage().baseFontFamily,
                        width: "95%",
                        backgroundColor: "rgba(0,0,0,0)",
                        border: "solid 1px rgba(120, 120, 120, 0)",
                        cursor: "pointer",
                    }}
                    onChange={(event: any) => {
                        event.preventDefault();
                        setName(event.target.value);

                    }}
                    value={name}
                    onFocus={(event: any) => {
                        if (inputRef.current !== null) {
                            inputRef.current.style["backgroundColor"] = "rgba(255,255,0,1)";
                            inputRef.current.style["border"] = "solid 1px rgba(120, 120, 120, 1)";
                            inputRef.current.style["cursor"] = "text";
                        }
                    }}

                    onBlur={(event: any) => {
                        if (inputRef.current !== null) {
                            inputRef.current.style["backgroundColor"] = "rgba(255,255,255,0)";
                            inputRef.current.style["border"] = "solid 1px rgba(120, 120, 120, 0)";
                            inputRef.current.style["cursor"] = "pointer";
                            if (submitting.current === true) {
                                submitting.current = false;
                            } else {
                                setName(JSON.parse(pathStr)[JSON.parse(pathStr).length - 1]);
                            }

                        }
                    }}
                >
                </input>
            </form>
        )
    }

    _ElementConfigGuidances = this._ElementConfigStringDetails;
    _ElementConfigDisplays = this._ElementConfigStringDetails;
    _ElementConfigCommands = this._ElementConfigStringDetails;

    _ElementConfigDescription = this._ElementConfigString;


    _ElementConfigEnabled = this._ElementConfigBoolean;

    _ElementConfigLatching = this._ElementConfigBoolean;

    _ElementConfigAnnuciating = this._ElementConfigBoolean;




    _ElementConfigDelay = this._ElementConfigNumber;

    _ElementConfigFilter = this._ElementConfigString;

    _ElementConfigCount = this._ElementConfigNumber;

    // ---------------------- view only, a mini page --------------------


    styleInputBox: React.CSSProperties = {}


    getElement = () => {
        return <this._ElementConfig></this._ElementConfig>
    }

    getMainPage = () => {
        return this._mainPage;
    }
}