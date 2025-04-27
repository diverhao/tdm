import * as React from "react";
import ReactDOM from "react-dom/client";
import { ElementRectangleButton } from "./RectangleButton";
import { ALARM_STATUS, MainPage, SEVERITES } from "./MainPage";
import { type_data } from "./MainPage";
import { calcSeverityColor, capitalizeFirstLetter, replaceObjectField, speakText } from "./GlobalMethod";
import { ElementModifyButton } from "./SharedElements"

export class TreePage {
    _forceUpdate: (input: any) => void = () => { };
    private _editing: boolean = false;
    private _mainPage: MainPage;

    expandingAll: boolean = true;
    onlyShowAlarmingPvs: boolean = false;
    setEngineName = (name: string) => { };

    setHint: any = (hint: string) => { };
    showOperations: boolean = true;
    forceUpdateElements: string[] = [];
    showConfigMiniPage: boolean = false;
    _ElementPa: () => React.JSX.Element;
    _ElementTestPa: () => React.JSX.Element;
    _ElementTestTalk: () => React.JSX.Element;

    selectedPathStr = "";
    mouseOnPathStr = "";

    constructor(mainPage: MainPage) {
        this._mainPage = mainPage;
        this._ElementPa = mainPage._ElementPa;
        this._ElementTestPa = mainPage._ElementTestPa;
        this._ElementTestTalk = mainPage._ElementTestTalk;
    }

    // ------------------ communicate with WebSocket server --------------------
    // TreePage specific
    handleNewData = (messageData: { path: string[], newData: type_data }) => {
        const { path, newData } = messageData;

        let currentData = this.getMainPage().getData([]);

        // special case: the whole config
        if (path.length === 0 && typeof newData === "object") {
            // this.getMainPage().setData(newData);
            this.addToForceUpdateElement("/");
            this._forceUpdate({});
            return;
        }

        for (let ii = 0; ii < path.length; ii++) {
            if (currentData === undefined) {
                return;
            }
            const name = path[ii];
            if (currentData[name] === undefined && ii !== path.length - 1) {
                return;
            }

            // we have reached to the end of path array
            // if the node exists, modify its value
            // if the node does not exist, creat it
            if (ii === path.length - 1) {
                // currentData[name] = newData;
                this.addToForceUpdateElement(JSON.stringify(path));
                console.log("force update:", path)
                this._forceUpdate({});
                return;
            }
            currentData = currentData[name];
        }

    }

    // -------------------- Elements ----------------------------

    calcIndent = (level: number) => {
        return this.getMainPage().baseFontSize * 1.5;
    }

    expandAll = () => {
        this.expandingAll = true;
        // this.collapsingAll = false;
        // this.expandingStatus = "expanding-all";
        this.addToForceUpdateElement("/");
        this._forceUpdate({});
    }


    showAlarmingPvs = () => {
        // expand all
        this.expandingAll = true;
        // this.collapsingAll = false;
        // this.expandingStatus = "expanding-all";
        this.onlyShowAlarmingPvs = true;
        this.addToForceUpdateElement("/");
        this._forceUpdate({});
    }


    switchToEditing = () => {
        // expand all
        this.setEditing(true);
        // this.collapsingAll = false;
        // this.expandingStatus = "expanding-all";
        // this.onlyShowAlarmingPvs = true;
        this.addToForceUpdateElement("/");
        this._forceUpdate({});
    }

    switchToView = () => {
        // expand all
        this.setEditing(false);
        // this.collapsingAll = false;
        // this.expandingStatus = "expanding-all";
        // this.onlyShowAlarmingPvs = true;
        this.addToForceUpdateElement("/");
        this._forceUpdate({});
    }

    showAllPvs = () => {
        // expand all
        this.expandingAll = true;
        // this.collapsingAll = false;
        // this.expandingStatus = "expanding-all";
        this.onlyShowAlarmingPvs = false;
        this.addToForceUpdateElement("/");
        this._forceUpdate({});
    }

    _Element = () => {
        const [, forceUpdate] = React.useState({});
        this._forceUpdate = forceUpdate;
        console.log("re-rendering Element")

        const [filterText, setFilterText] = React.useState("");

        React.useEffect(() => {
            this.removeForceUpdateElement("/");
            this.expandingAll = false;
        })

        if (Object.keys(this.getMainPage().getData([])).length === 0) {
            return (
                <div>
                    Empty configuration.
                </div>
            )
        }

        return (
            <div style={{
                display: "inline-flex",
                flexDirection: "column",
                fontFamily: this.getMainPage().baseFontFamily,
                fontSize: this.getMainPage().baseFontSize,
                width: "100%",
                boxSizing: "border-box",
                padding: 20,
            }}>
                <div style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingLeft: 20,

                }}>
                    <div
                        style={{
                            display: "inline-flex",
                            flexDirection: "row",
                            justifyContent: "flex-start",
                            alignItems: "center",
                        }}
                    >
                        <this._ElementEngineName></this._ElementEngineName>

                        {/* switch view -- Tree, Area, and Table */}
                        <this._ElementSwitchView></this._ElementSwitchView>
                    </div>

                    <this._ElementPa></this._ElementPa>

                </div>

                <this._ElementHeaders
                    filterText={filterText}
                    setFilterText={setFilterText}
                ></this._ElementHeaders>

                <div
                    style={{
                        width: "50%",
                        height: 3,
                        backgroundColor: "rgba(210, 210, 210, 1)",
                        marginLeft: 20,
                        marginBottom: 10,
                    }}
                >

                </div>
                <div
                    style={{
                        width: "100%",
                        display: "inline-flex",
                        flexDirection: "row"
                    }}
                >

                    <div style={{
                        width: "50%",
                        display: "inline-flex",
                        flexDirection: "column",
                    }}>

                        {/* systems */}
                        {
                            Object.entries(this.getMainPage().getData([])).map(([systemName, systemData]: any) => {
                                return (
                                    <this._ElementSystem
                                        key={systemName}
                                        indentLevel={0}
                                        pathStr={JSON.stringify([systemName])}
                                        data={systemData}
                                        name={systemName}
                                        filterText={filterText}
                                    >
                                    </this._ElementSystem>

                                )
                            })
                        }
                    </div>


                    <div style={{
                        width: "50%",
                        display: "inline-flex",
                        flexDirection: "column",
                    }}>
                        <this._ElementConfigMiniPage></this._ElementConfigMiniPage>
                    </div>

                </div>



                {/* configuration page */}
                {this.getMainPage().getConfigPage().getElement()}

                {/* info page */}
                {(() => {
                    if (this.getMainPage().showInfoPage === true) {
                        const ElementInfoPage = this.getMainPage()._ElementInfoPage;
                        const data = this.getMainPage().infoPageData;
                        const type = data['type'];
                        const messages = data['messages'];
                        return <ElementInfoPage type={type} messages={messages} ></ElementInfoPage>
                    } else {
                        return null;
                    }
                })()}

            </div>
        )
    }

    _ElementHeaders = ({ filterText, setFilterText }: { filterText: string, setFilterText: React.Dispatch<React.SetStateAction<string>> }) => {
        return (
            <div
                style={{
                    display: "inline-flex",
                    flexDirection: "column",
                    marginLeft: 20,
                }}
            >
                {/* row 1 */}
                <div
                    style={{
                        display: "inline-flex",
                        flexDirection: "row",
                        justifyContent: "flex-start",
                        alignItems: 'center',
                        marginBottom: 15,
                    }}
                >


                    {/* only show alarming PVs */}
                    <form
                        onSubmit={(event: any) => {
                            event.preventDefault();
                        }}
                        style={{
                            display: "inline-flex",
                            flexDirection: "row",
                            justifyContent: "flex-start",
                            alignItems: 'center',
                            marginRight: 20,
                        }}
                    >
                        Only show alarming PVs:
                        <input
                            type={"checkbox"}
                            style={{
                                fontFamily: this.getMainPage().baseFontFamily,
                                width: this.getMainPage().baseFontSize,
                                height: this.getMainPage().baseFontSize,
                            }}
                            checked={this.onlyShowAlarmingPvs}
                            onChange={(event: any) => {
                                if (this.onlyShowAlarmingPvs === true) {
                                    this.showAllPvs();
                                } else {
                                    this.showAlarmingPvs();
                                }
                            }}
                        >
                        </input>
                    </form>

                    {/* Show config page */}
                    <form
                        onSubmit={(event: any) => {
                            event.preventDefault();
                        }}
                        style={{
                            display: "inline-flex",
                            flexDirection: "row",
                            justifyContent: "flex-start",
                            alignItems: 'center',
                            marginRight: 20,
                        }}
                    >
                        Show config page:
                        <input
                            type={"checkbox"}
                            style={{
                                fontFamily: this.getMainPage().baseFontFamily,
                                width: this.getMainPage().baseFontSize,
                                height: this.getMainPage().baseFontSize,
                            }}
                            checked={this.showConfigMiniPage}
                            onChange={(event: any) => {
                                if (this.showConfigMiniPage === false) {
                                    this.showConfigMiniPage = true;
                                    // this.addToForceUpdateElement("/");
                                    this._forceUpdate({});
                                } else {
                                    this.showConfigMiniPage = false;
                                    // this.addToForceUpdateElement("/");
                                    this._forceUpdate({});
                                }
                            }}
                        >
                        </input>
                    </form>

                    {/* show edit options */}
                    <form
                        onSubmit={(event: any) => {
                            event.preventDefault();
                        }}
                        style={{
                            display: "inline-flex",
                            flexDirection: "row",
                            justifyContent: "flex-start",
                            alignItems: 'center',
                            marginRight: 20,
                        }}
                    >
                        Show edit options:
                        <input
                            type={"checkbox"}
                            style={{
                                fontFamily: this.getMainPage().baseFontFamily,
                                width: this.getMainPage().baseFontSize,
                                height: this.getMainPage().baseFontSize,
                            }}
                            checked={this.getEditing()}
                            onChange={(event: any) => {
                                if (this.getEditing() === false) {
                                    this.switchToEditing();
                                } else {
                                    this.switchToView();
                                }
                            }}
                        >
                        </input>
                    </form>

                    {/* Show operation options */}
                    <form
                        onSubmit={(event: any) => {
                            event.preventDefault();
                        }}
                        style={{
                            display: "inline-flex",
                            flexDirection: "row",
                            justifyContent: "flex-start",
                            alignItems: 'center',
                            marginRight: 20,
                        }}

                    >
                        Show operation options:
                        <input
                            type={"checkbox"}
                            style={{
                                fontFamily: this.getMainPage().baseFontFamily,
                                width: this.getMainPage().baseFontSize,
                                height: this.getMainPage().baseFontSize,
                            }}
                            checked={this.showOperations}
                            onChange={(event: any) => {
                                if (this.showOperations === false) {
                                    this.showOperations = true;
                                    this.addToForceUpdateElement("/");
                                    this._forceUpdate({});
                                } else {
                                    this.showOperations = false;
                                    this.addToForceUpdateElement("/");
                                    this._forceUpdate({});
                                }
                            }}
                        >
                        </input>
                    </form>
                </div>

                {/* row 2 */}
                <div style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    justifyContent: "flex-start",
                    alignItems: 'center',
                    marginBottom: 15,
                }}>

                    {/* Expand all button */}
                    <ElementRectangleButton
                        handleMouseDown={(event: any) => {
                            this.expandAll()
                        }}
                        marginRight={20}
                        fontSize={this.getMainPage().baseFontSize}
                        paddingTop={2}
                        paddingBottom={2}
                        paddingLeft={3}
                        paddingRight={3}
                        defaultTextColor={"rgba(0,0,0,1)"}
                        defaultBackgroundColor={"rgba(0,0,0,0)"}
                        highlightTextColor={"rgba(0,0,0,1)"}
                        highlightBackgroundColor={"rgba(200,200,200,1)"}
                        borderRadius={3}
                        additionalStyle={{
                            border: "solid 1px rgba(0,0,0,1)",
                        }}
                    >
                        Expand all
                    </ElementRectangleButton>

                    {/* Test speak text */}
                        <this._ElementTestTalk></this._ElementTestTalk>
                        <this._ElementTestPa></this._ElementTestPa>

                    {/* font size */}
                    <div style={{
                        display: "inline-flex",
                        flexDirection: "row",
                        justifyContent: "flex-start",
                        alignItems: 'center',
                        marginRight: 20,
                    }}>
                        Font size:&nbsp;
                        <select
                            onChange={(event: any) => {
                                this.getMainPage().baseFontSize = parseInt(event.target.value);
                                // setFontSize(this.getMainPage().baseFontSize);
                                this.getMainPage().getConfigPage().styleInputBox["fontSize"] = this.getMainPage().baseFontSize;
                                this.addToForceUpdateElement("/");
                                this._forceUpdate({});
                            }}
                            value={`${this.getMainPage().baseFontSize}`}
                            style={{
                                fontSize: this.getMainPage().baseFontSize,
                                outline: "none",
                                border: "1px solid rgba(0,0,0,1)",
                                borderRadius: 0,
                            }}
                        >
                            <option value="10">10</option>
                            <option value="12">12</option>
                            <option value="14">14</option>
                            <option value="18">18</option>
                            <option value="22">22</option>
                            <option value="26">26</option>
                            <option value="34">34</option>
                            <option value="44">44</option>
                        </select>
                    </div>

                    {/* filter */}
                    <this._ElementFilter
                        filterText={filterText}
                        setFilterText={setFilterText}
                        forceUpdate={this._forceUpdate}
                    >
                    </this._ElementFilter>

                    {/* hint */}
                    <this._ElementHint></this._ElementHint>

                </div>
            </div>
        )
    }



    _ElementFilter = ({ filterText, setFilterText, forceUpdate }:
        {
            filterText: string,
            setFilterText: React.Dispatch<React.SetStateAction<string>>,
            forceUpdate: React.Dispatch<React.SetStateAction<{}>>
        }) => {
        return (
            <form
                onSubmit={(event: any) => {
                    event.preventDefault();
                }}
                style={{
                    display: "inline-flex",
                    justifyContent: "flex-start",
                    alignItems: "center",
                }}
            >
                <input
                    value={filterText}
                    placeholder="Filter PV name."
                    onChange={(event: any) => {
                        event.preventDefault();
                        setFilterText(event.target.value);
                        this.addToForceUpdateElement("/");
                        forceUpdate({});
                    }}
                    style={{
                        outline: "none",
                        borderRadius: 0,
                        border: "solid 1px rgba(80,80,80,1)",
                        width: this.getMainPage().baseFontSize * 22,
                        fontFamily: this.getMainPage().baseFontFamily,
                        fontSize: this.getMainPage().baseFontSize,
                    }}
                >
                </input>
            </form>
        )
    }



    _ElementEngineName = () => {
        const [engineName, setEngineName] = React.useState("");
        this.setEngineName = setEngineName;

        React.useEffect(() => {
            this.getMainPage().requestEngineName();
        }, [])
        return (
            <h1>
                {engineName}
            </h1>
        )
    }

    _ElementSystemRaw = ({ data, name, indentLevel, pathStr, filterText }: any) => {

        if (name === "status") {
            return null;
        }

        const status = data["status"];
        const severity = status === undefined ? SEVERITES.NOT_CONNECTED : status["severity"];

        let numSubsystems = 0;
        if (data["subsystems"] !== undefined) {
            numSubsystems = Object.keys(data['subsystems']).length - 1
        }

        let numPvs = 0;
        if (data["pvs"] !== undefined) {
            numPvs = Object.keys(data['pvs']).length - 1;
        }


        const [showChildren, setShowChildren] = React.useState(true);

        // React.useEffect(() => {
        this.removeForceUpdateElement(pathStr);
        // })

        return (
            <div style={{
                display: "inline-flex",
                flexDirection: "column",
                paddingLeft: this.calcIndent(indentLevel),
                marginTop: 5,
            }}>
                <div style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    justifyContent: 'flex-start',
                    alignItems: "center",
                }}>
                    {/* name */}
                    <this._ElementName
                        name={name}
                        severity={severity}
                        onMouseDown={() => {
                            setShowChildren(!showChildren);
                        }}
                        type={"system"}
                        numSubsystems={numSubsystems}
                        numPvs={numPvs}
                        showChildren={showChildren}
                        pathStr={pathStr}
                    ></this._ElementName>

                    {/* operations -- open displays, run commands, only in desktop */}
                    {/* {this.getMainPage().getElementOpenDisplays(pathStr)}
                    {this.getMainPage().getElementRunCommands(pathStr)} */}
                    {this.getMainPage().getElementOpenDisplaysRunCommands(pathStr, this.showOperations)}

                    {/* editing */}
                    <div style={{
                        display: this.getEditing() === true ? "inline-flex" : "none",
                        flexDirection: "row",
                    }}>
                        <ElementModifyButton
                            imgSrc={this.getMainPage().resourcePath + "delete-symbol.svg"}
                            handleClick={() => {
                                this.removeNode(pathStr)
                            }}
                            hint={"Delete this system"}
                            setHint={this.setHint}
                        >
                        </ElementModifyButton>

                        <ElementModifyButton
                            imgSrc={this.getMainPage().resourcePath + "arrowUp-2.svg"}
                            handleClick={() => {
                                this.moveUpNode(pathStr)
                            }}
                            hint={"Move up system"}
                            setHint={this.setHint}
                        >
                        </ElementModifyButton>

                        <ElementModifyButton
                            imgSrc={this.getMainPage().resourcePath + "arrowDown-2.svg"}
                            handleClick={() => {
                                this.moveDownNode(pathStr)
                            }}
                            hint={"Move down system"}
                            setHint={this.setHint}
                        >
                        </ElementModifyButton>

                        <ElementModifyButton
                            imgSrc={this.getMainPage().resourcePath + "copy-symbol.svg"}
                            handleClick={() => {
                                this.duplicateNode(pathStr)
                            }}
                            hint={"Duplicate this system"}
                            setHint={this.setHint}
                        >
                        </ElementModifyButton>

                        <ElementModifyButton
                            imgSrc={this.getMainPage().resourcePath + "add-symbol.svg"}
                            handleClick={() => {
                                this.addSiblingNode(pathStr, "system");
                            }}
                            hint={"Add new system"}
                            setHint={this.setHint}
                        >
                        </ElementModifyButton>

                        <ElementModifyButton
                            imgSrc={this.getMainPage().resourcePath + "add-child-symbol.svg"}
                            handleClick={() => {
                                this.addChildNode(pathStr, "subsystem")
                            }}
                            hint={"Add new sub-system"}
                            setHint={this.setHint}
                        >
                        </ElementModifyButton>


                        <ElementModifyButton
                            imgSrc={this.getMainPage().resourcePath + "add-child-symbol.svg"}
                            handleClick={() => {
                                this.addChildNode(pathStr, "pv")
                            }}
                            hint={"Add new PV"}
                            setHint={this.setHint}
                        >
                        </ElementModifyButton>


                        <ElementModifyButton
                            imgSrc={this.getMainPage().resourcePath + "settings.svg"}
                            handleClick={() => {
                                this.getMainPage().getConfigPage().showingConfigPage = pathStr;
                                this._forceUpdate({});
                            }}
                            hint={"Configure system"}
                            setHint={this.setHint}
                        >
                        </ElementModifyButton>

                    </div>
                </div>

                {/* children elements */}

                {showChildren === true || this.expandingAll === true ?
                    <div style={{
                        display: "inline-flex",
                        flexDirection: "column",
                        paddingLeft: this.calcIndent(indentLevel + 1),
                    }}>
                        {data["pvs"] === undefined ?
                            "no pvs"
                            :
                            Object.entries(data["pvs"]).map(([pvName, pvData]: any) => {
                                return (
                                    <this._ElementPv
                                        key={pvName}
                                        pathStr={JSON.stringify([...JSON.parse(pathStr), "pvs", pvName])}
                                        indentLevel={1}
                                        name={pvName}
                                        data={pvData}
                                        filterText={filterText}
                                    >
                                    </this._ElementPv>
                                )
                            })}
                        {data["subsystems"] === undefined ?
                            "no subsystems"
                            :
                            Object.entries(data["subsystems"]).map(([subsystemName, subsystemData]: any) => {
                                return (
                                    <this._ElementSubSystem
                                        indentLevel={1}
                                        key={subsystemName}
                                        pathStr={JSON.stringify([...JSON.parse(pathStr), "subsystems", subsystemName])}
                                        name={subsystemName}
                                        data={subsystemData}
                                        filterText={filterText}
                                    >
                                    </this._ElementSubSystem>
                                )
                            })}
                    </div>
                    :
                    null
                }
            </div>
        )
    }

    _ElementSubSystemRaw = ({ data, name, indentLevel, pathStr, filterText }: any) => {


        if (name === "status") {
            return null;
        }

        const status = data["status"];
        const severity = status === undefined ? SEVERITES.NOT_CONNECTED : status["severity"];

        let numPvs = 0;
        if (data["pvs"] !== undefined) {
            numPvs = Object.keys(data["pvs"]).length - 1;
        }

        const [showChildren, setShowChildren] = React.useState(true);

        // React.useEffect(() => {
        this.removeForceUpdateElement(pathStr);
        // })

        return (
            <div style={{
                display: "inline-flex",
                flexDirection: "column",
                paddingLeft: this.calcIndent(indentLevel + 1),
                marginTop: 5,
            }}>
                <div style={{
                    display: "inline-flex",
                    flexDirection: "row"
                }}>
                    {/* name */}
                    <this._ElementName
                        // name={name + ` -- ${pathStr}`}
                        name={name}
                        severity={severity}
                        onMouseDown={() => {
                            setShowChildren(!showChildren);
                        }}
                        type={"subsystem"}
                        numPvs={numPvs}
                        numSubsystems={0}
                        showChildren={showChildren}
                        pathStr={pathStr}
                    ></this._ElementName>

                    {/* operations -- open displays, run commands, only in desktop */}
                    {/* {this.getMainPage().getElementOpenDisplays(pathStr)}
                    {this.getMainPage().getElementRunCommands(pathStr)} */}
                    {this.getMainPage().getElementOpenDisplaysRunCommands(pathStr, this.showOperations)}

                    {/* editing */}
                    <div style={{
                        display: this.getEditing() === true ? "inline-flex" : "none",
                        flexDirection: "row",
                        justifyContent: "flex-start",
                        alignItems: "center",
                    }}>
                        <ElementModifyButton
                            imgSrc={this.getMainPage().resourcePath + "delete-symbol.svg"}
                            handleClick={() => {
                                this.removeNode(pathStr)
                            }}
                            hint={"Delete this sub-system"}
                            setHint={this.setHint}
                        >
                        </ElementModifyButton>

                        <ElementModifyButton
                            imgSrc={this.getMainPage().resourcePath + "arrowUp-2.svg"}
                            handleClick={() => {
                                this.moveUpNode(pathStr)
                            }}
                            hint={"Move up sub-system"}
                            setHint={this.setHint}
                        >
                        </ElementModifyButton>

                        <ElementModifyButton
                            imgSrc={this.getMainPage().resourcePath + "arrowDown-2.svg"}
                            handleClick={() => {
                                this.moveDownNode(pathStr)
                            }}
                            hint={"Move down sub-system"}
                            setHint={this.setHint}
                        >
                        </ElementModifyButton>


                        <ElementModifyButton
                            imgSrc={this.getMainPage().resourcePath + "copy-symbol.svg"}
                            handleClick={() => {
                                this.duplicateNode(pathStr)
                            }}
                            hint={"Duplicate this sub-system"}
                            setHint={this.setHint}
                        >
                        </ElementModifyButton>

                        <ElementModifyButton
                            imgSrc={this.getMainPage().resourcePath + "add-symbol.svg"}
                            handleClick={() => {
                                this.addSiblingNode(pathStr, "subsystem")
                            }}
                            hint={"Add a new sub-system"}
                            setHint={this.setHint}
                        >
                        </ElementModifyButton>

                        <ElementModifyButton
                            imgSrc={this.getMainPage().resourcePath + "add-child-symbol.svg"}
                            handleClick={() => {
                                this.addChildNode(pathStr, "pv")
                            }}
                            hint={"Add a new PV"}
                            setHint={this.setHint}
                        >
                        </ElementModifyButton>

                        <ElementModifyButton
                            imgSrc={this.getMainPage().resourcePath + "settings.svg"}
                            handleClick={() => {
                                this.getMainPage().getConfigPage().showingConfigPage = pathStr;
                                this._forceUpdate({});
                            }}
                            hint={"Configure sub-system"}
                            setHint={this.setHint}
                        >
                        </ElementModifyButton>

                    </div>
                </div>
                {showChildren === true || this.expandingAll === true ?
                    <div style={{
                        display: "inline-flex",
                        flexDirection: "column",
                        paddingLeft: this.calcIndent(indentLevel + 2),
                    }}>
                        {data["pvs"] === undefined ?
                            "no pvs"
                            :
                            Object.entries(data["pvs"]).map(([pvName, pvData]: any) => {
                                return (
                                    <this._ElementPv
                                        key={pvName}
                                        indentLevel={indentLevel + 1}
                                        pathStr={JSON.stringify([...JSON.parse(pathStr), "pvs", pvName])}
                                        name={pvName}
                                        data={pvData}
                                        filterText={filterText}
                                    >
                                    </this._ElementPv>
                                )
                            })}
                    </div>
                    :
                    null
                }
            </div>
        )
    }

    _ElementPvRaw = ({ data, name, indentLevel, pathStr, filterText }: any) => {

        if (name === "status") {
            return null;
        }

        const modifyElementRef = React.useRef<any>(null);

        const status = data["status"];
        const severity = status === undefined ? SEVERITES.NOT_CONNECTED : status["severity"];
        // React.useEffect(() => {
        this.removeForceUpdateElement(pathStr);
        // })

        if (severity === SEVERITES.NO_ALARM && this.onlyShowAlarmingPvs === true) {
            return null;
        }

        if (name.includes(filterText) === false) {
            return null;
        }

        return (
            <div style={{
                display: "inline-flex",
                flexDirection: "row",
                paddingLeft: this.calcIndent(indentLevel + 1),
                marginTop: 5,
            }}>
                <this._ElementName
                    name={name}
                    severity={severity}
                    type={"pv"}
                    onMouseDown={() => { }}
                    numSubsystems={0}
                    numPvs={0}
                    showChildren={false}
                    pathStr={pathStr}
                >
                </this._ElementName>

                {/* operations -- open displays, run commands, only in desktop */}
                {/* {this.getMainPage().getElementOpenDisplays(pathStr)}
                {this.getMainPage().getElementRunCommands(pathStr)} */}
                {this.getMainPage().getElementOpenDisplaysRunCommands(pathStr, this.showOperations)}

                {/* modify this node */}
                <div
                    ref={modifyElementRef}
                    style={{
                        display: this.getEditing() === true ? "inline-flex" : "none",
                        flexDirection: "row",
                        justifyContent: "flex-start",
                        alignItems: 'center',
                    }}
                >
                    <ElementModifyButton
                        imgSrc={this.getMainPage().resourcePath + "delete-symbol.svg"}
                        handleClick={() => {
                            this.removeNode(pathStr)
                        }}
                        hint={"Delete PV"}
                        setHint={this.setHint}
                    >
                    </ElementModifyButton>

                    <ElementModifyButton
                        imgSrc={this.getMainPage().resourcePath + "arrowUp-2.svg"}
                        handleClick={() => {
                            this.moveUpNode(pathStr)
                        }}
                        hint={"Move PV up"}
                        setHint={this.setHint}
                    >
                    </ElementModifyButton>

                    <ElementModifyButton
                        imgSrc={this.getMainPage().resourcePath + "arrowDown-2.svg"}
                        handleClick={() => {
                            this.moveDownNode(pathStr)
                        }}
                        hint={"Move PV down"}
                        setHint={this.setHint}
                    >
                    </ElementModifyButton>

                    <ElementModifyButton
                        imgSrc={this.getMainPage().resourcePath + "copy-symbol.svg"}
                        handleClick={() => {
                            this.duplicateNode(pathStr)
                        }}
                        hint={"Duplicate PV"}
                        setHint={this.setHint}
                    >
                    </ElementModifyButton>

                    <ElementModifyButton
                        imgSrc={this.getMainPage().resourcePath + "add-symbol.svg"}
                        handleClick={() => {
                            this.addSiblingNode(pathStr, "pv")
                        }}
                        hint={"Add new PV"}
                        setHint={this.setHint}
                    >
                    </ElementModifyButton>


                    <ElementModifyButton
                        imgSrc={this.getMainPage().resourcePath + "settings.svg"}
                        handleClick={() => {
                            this.getMainPage().getConfigPage().showingConfigPage = pathStr;
                            this._forceUpdate({});
                        }}
                        hint={"Configure PV"}
                        setHint={this.setHint}
                    >
                    </ElementModifyButton>


                </div>
            </div>
        )
    }


    _ElementHint = () => {
        const [hint, setHint] = React.useState("");
        this.setHint = setHint;
        return (
            <div>
                {hint}&nbsp;
            </div>
        )
    }


    _ElementSwitchView = () => {
        return (
            <select
                value={"TreePage"}
                onChange={(event: any) => {
                    if (event.target.value === "TreePage") {
                        return;
                    } else {
                        this.getMainPage().switchView(event.target.value);
                    }
                }}
                style={{
                    fontSize: "2em",
                    outline: "none",
                    border: "none",
                    fontWeight: "bold",
                    fontFamily: this.getMainPage().baseFontFamily,
                }}
            >
                <option value="TreePage">Tree </option>
                <option value="TablePage">Table </option>
                <option value="AreaPage">Area </option>
            </select>
        )
    }

    _ElementName = ({ name, severity, onMouseDown, type, numSubsystems, numPvs, showChildren, pathStr }: any) => {
        const elementRef = React.useRef<any>(null);
        const arrowElementRef = React.useRef<any>(null);

        const data = this.getMainPage().getData(JSON.parse(pathStr));

        return (
            <div
                ref={elementRef}
                style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    fontFamily: this.getMainPage().baseFontFamily,
                    color: calcSeverityColor(severity),
                    // cursor: (type === "system" || type === "subsystem") ? "pointer" : "default",
                    cursor: "default",
                }}
                onMouseDown={() => {
                    // onMouseDown();
                    // this.expandingAll = false;

                    if (this.showConfigMiniPage === true) {

                        this.addToForceUpdateElement(pathStr);
                        this.addToForceUpdateElement(this.selectedPathStr);
                        this.addToForceUpdateElement(this.mouseOnPathStr);

                        this.selectedPathStr = pathStr;

                        this.addToForceUpdateElement(pathStr);
                        this.addToForceUpdateElement(this.selectedPathStr);
                        this.addToForceUpdateElement(this.mouseOnPathStr);

                        this.forceUpdateConfigMiniPage({});
                        this._forceUpdate({});
                    }
                }}
                onMouseEnter={() => {

                    if (this.showConfigMiniPage === true) {
                        this.addToForceUpdateElement(pathStr);
                        this.addToForceUpdateElement(this.selectedPathStr);
                        this.addToForceUpdateElement(this.mouseOnPathStr);

                        this.mouseOnPathStr = pathStr;

                        this.addToForceUpdateElement(pathStr);
                        this.addToForceUpdateElement(this.selectedPathStr);
                        this.addToForceUpdateElement(this.mouseOnPathStr);

                        this.forceUpdateConfigMiniPage({});
                        this._forceUpdate({});
                    }
                }}
                onMouseLeave={() => {
                    if (this.showConfigMiniPage === true) {
                        this.addToForceUpdateElement(pathStr);
                        this.addToForceUpdateElement(this.selectedPathStr);
                        this.addToForceUpdateElement(this.mouseOnPathStr);

                        this.mouseOnPathStr = "";

                        this.addToForceUpdateElement(pathStr);
                        this.addToForceUpdateElement(this.selectedPathStr);
                        this.addToForceUpdateElement(this.mouseOnPathStr);
                        this.forceUpdateConfigMiniPage({});
                        this._forceUpdate({});
                    }
                }}
            >
                {numSubsystems + numPvs > 0 ?
                    <img
                        ref={arrowElementRef}
                        src={this.getMainPage().resourcePath + "arrowDown-thin.svg"}
                        style={{
                            width: this.getMainPage().baseFontSize * 0.6,
                            height: this.getMainPage().baseFontSize * 0.6,
                            marginRight: 5,
                            transform: `rotate(${showChildren || this.expandingAll === true ? "0deg" : "270deg"})`
                        }}
                        onMouseDown={() => {
                            onMouseDown();
                            this.expandingAll = false;

                        }}
                        onMouseEnter={() => {
                            if (arrowElementRef.current !== null && (type === "system" || type === "subsystem")) {
                                arrowElementRef.current.style["outline"] = "solid 3px rgba(200, 200, 200, 1)";
                            }
                        }}
                        onMouseLeave={() => {
                            if (arrowElementRef.current !== null && (type === "system" || type === "subsystem")) {
                                arrowElementRef.current.style["outline"] = "none";
                            }
                        }}

                    >
                    </img>
                    :
                    null
                }

                <this._ElementGradientUnderline
                    color={calcSeverityColor(severity)}
                    showUnderline={(pathStr === this.mouseOnPathStr || pathStr === this.selectedPathStr) && this.showConfigMiniPage === true}
                >
                    {name}&nbsp;


                    <div
                        style={{
                            borderRadius: 2,
                            border: `solid ${this.getMainPage().baseFontSize / 14}px ${calcSeverityColor(severity)}`,
                            outline: "none",
                            backgroundColor: "",
                            // color: "rgba(0,155,255,1)",
                            // padding: 0,
                            paddingLeft: 3,
                            paddingRight: 3,
                            margin: 0,
                            display: type === "system" || type === "subsystem" ? "inline-flex" : "none",
                            justifyContent: "center",
                            alignItems: "center",
                            fontSize: this.getMainPage().baseFontSize - 6,
                            fontFamily: this.getMainPage().baseFontFamily,
                            marginLeft: 3,
                            marginRight: 3,
                            height: this.getMainPage().baseFontSize - 2,
                        }}
                    >

                        {type === "system" ?
                            `${numSubsystems} sub-system${numSubsystems > 1 ? "s" : ""}, ${numPvs} PV${numPvs > 1 ? "s" : ""}`
                            :
                            type === "subsystem" ?
                                `${numPvs} PV${numPvs > 1 ? "s" : ""}`
                                :
                                null}
                    </div>

                    <div
                        style={{
                            borderRadius: 2,
                            border: `solid ${this.getMainPage().baseFontSize / 14}px ${calcSeverityColor(data["status"]["severity"])}`,
                            outline: "none",
                            backgroundColor: "",
                            // color: calcSeverityColor(data["status"]["severity_when_alarmed"]),
                            // padding: 0,
                            paddingLeft: 3,
                            paddingRight: 3,
                            margin: 0,
                            display: type === "pv" ? data["status"]["alarm_status"] === ALARM_STATUS.NO_ALARM ? "none" : "inline-flex" : "none",
                            justifyContent: "center",
                            alignItems: "center",
                            fontSize: this.getMainPage().baseFontSize - 6,
                            fontFamily: this.getMainPage().baseFontFamily,
                            marginLeft: 3,
                            marginRight: 3,
                            height: this.getMainPage().baseFontSize - 2,
                        }}
                    >
                        {ALARM_STATUS[data["status"]["alarm_status"]]}
                    </div>

                    <div
                        style={{
                            borderRadius: 2,
                            border: `solid ${this.getMainPage().baseFontSize / 14}px ${calcSeverityColor(data["status"]["severity_when_alarmed"])}`,
                            outline: "none",
                            backgroundColor: "",
                            color: calcSeverityColor(data["status"]["severity_when_alarmed"]),
                            // padding: 0,
                            paddingLeft: 3,
                            paddingRight: 3,
                            margin: 0,
                            display: data["status"]["severity_when_alarmed"] === SEVERITES.NO_ALARM ? "none" : data["latching"] === true ? "inline-flex" : "none",
                            justifyContent: "center",
                            alignItems: "center",
                            fontSize: this.getMainPage().baseFontSize - 6,
                            fontFamily: this.getMainPage().baseFontFamily,
                            marginLeft: 3,
                            marginRight: 3,
                            height: this.getMainPage().baseFontSize - 2,
                        }}
                    >
                        LATCHED
                    </div>

                    <div
                        style={{
                            borderRadius: 2,
                            border: `solid ${this.getMainPage().baseFontSize / 14}px ${calcSeverityColor(data["status"]["severity_when_alarmed"])}`,
                            outline: "none",
                            backgroundColor: "",
                            paddingLeft: 3,
                            paddingRight: 3,
                            color: calcSeverityColor(data["status"]["severity_when_alarmed"]),
                            display: type === "pv" ? data["status"]["alarm_status_when_alarmed"] === ALARM_STATUS.NO_ALARM ? "none" : data["latching"] === true ? "inline-flex" : "none" : "none",
                            margin: 0,
                            justifyContent: "center",
                            alignItems: "center",
                            fontSize: this.getMainPage().baseFontSize - 6,
                            fontFamily: this.getMainPage().baseFontFamily,
                            marginLeft: 3,
                            marginRight: 3,
                            height: this.getMainPage().baseFontSize - 2,
                        }}
                    >
                        {ALARM_STATUS[data["status"]["alarm_status_when_alarmed"]]}
                    </div>


                </this._ElementGradientUnderline>
            </div>
        )
    }
    _ElementGradientUnderline = ({ children, color, showUnderline }: { children: any, color: string, showUnderline: boolean }) => {

        return (
            <span style={{ position: 'relative', display: 'inline-flex', flexDirection: "row", justifyContent: "center", alignItems: 'center' }}>
                <span style={{ position: 'relative', display: 'inline-flex', flexDirection: "row", justifyContent: "center", alignItems: 'center' }}>{children}</span>
                <span
                    style={{
                        position: 'absolute',
                        left: 0,
                        bottom: -2,
                        width: '100%',
                        height: 3 * this.getMainPage().baseFontSize / 14, // thickness of the underline
                        background: showUnderline === true ? `linear-gradient(to top, ${color}, #ffffff)` : "",
                        borderRadius: '2px', // optional: rounded corners
                        zIndex: -1
                    }}
                />
            </span>
        )
    };

    // ------------------ node operations: remove/move up/move down/add child/duplicate/add sibling/ ----------

    removeNode = (pathStr: string) => {

        const parentPath = JSON.parse(pathStr) as string[];
        const name = parentPath.splice(parentPath.length - 1, 1)[0];

        const parentData = this.getMainPage().getData(parentPath);

        // remove this node
        delete parentData[name];
        // update the server
        this.getMainPage().sendNewData(parentPath, parentData);
    }

    moveUpNode = (pathStr: string) => {
        const thisPath = JSON.parse(pathStr) as string[]

        const parentPath = JSON.parse(pathStr) as string[];
        const name = parentPath.splice(parentPath.length - 1, 1)[0];

        const parentData = this.getMainPage().getData(parentPath);
        const thisData = parentData[name];

        const thisIndex = Object.keys(parentData).indexOf(name);
        if (thisIndex <= 0) {
            return;
        }

        const prevName = Object.keys(parentData)[thisIndex - 1];
        const prevData = parentData[prevName];

        const nameTmp = name + `${Math.random()}`;

        replaceObjectField(parentData, prevName, nameTmp, {});
        replaceObjectField(parentData, name, prevName, prevData);
        replaceObjectField(parentData, nameTmp, name, thisData);

        // update the server
        this.getMainPage().sendNewData(parentPath, parentData);
    }

    moveDownNode = (pathStr: string) => {
        const thisPath = JSON.parse(pathStr) as string[]

        const parentPath = JSON.parse(pathStr) as string[];
        const name = parentPath.splice(parentPath.length - 1, 1)[0];

        const parentData = this.getMainPage().getData(parentPath);
        const thisData = parentData[name];

        const thisIndex = Object.keys(parentData).indexOf(name);
        if (thisIndex === Object.keys(parentData).length - 1) {
            return;
        }

        const nextName = Object.keys(parentData)[thisIndex + 1];
        const nextData = parentData[nextName];

        const nameTmp = name + `${Math.random()}`;

        replaceObjectField(parentData, nextName, nameTmp, {});
        replaceObjectField(parentData, name, nextName, nextData);
        replaceObjectField(parentData, nameTmp, name, thisData);

        // update the server
        this.getMainPage().sendNewData(parentPath, parentData);
    }
    // type = child type
    addChildNode = (parentPathStr: string, childType: "pv" | "subsystem") => {

        const parentPath = JSON.parse(parentPathStr) as string[];

        if (childType === "pv") {
            // the parent should have a "pvs"
            parentPath.push("pvs");
        } else if (childType === "subsystem") {
            parentPath.push("subsystems");
        } else {
            return;
        }

        const childName = childType + "_node" + `${Math.random()}`;

        const parentData = this.getMainPage().getData(parentPath);
        const childData = this.generateNodeJson(childType);

        if (childData === undefined) {
            return;
        }

        parentData[childName] = childData;

        // update the server
        this.getMainPage().sendNewData(parentPath, parentData);

    }

    duplicateNode = (pathStr: string) => {
        const thisPath = JSON.parse(pathStr) as string[]

        const parentPath = JSON.parse(pathStr) as string[];
        const name = parentPath.splice(parentPath.length - 1, 1)[0];
        const newName = name + `_${Math.random()}`;

        const parentData = this.getMainPage().getData(parentPath);
        const thisData = parentData[name];

        parentData[newName] = JSON.parse(JSON.stringify(thisData));

        // update the server
        this.getMainPage().sendNewData(parentPath, parentData);

    }


    addSiblingNode = (pathStr: string, siblingType: "pv" | "subsystem" | "system") => {
        const thisPath = JSON.parse(pathStr) as string[]

        const parentPath = JSON.parse(pathStr) as string[];
        const name = parentPath.splice(parentPath.length - 1, 1)[0];
        const newName = siblingType + "_node" + `${Math.random()}`;

        const parentData = this.getMainPage().getData(parentPath);
        const thisData = parentData[name];

        const newData = this.generateNodeJson(siblingType);

        if (newData === undefined) {
            return;
        }

        parentData[newName] = newData;

        // update the server
        this.getMainPage().sendNewData(parentPath, parentData);

    }

    generateNodeJson = (type: "pv" | "subsystem" | "system") => {
        if (type === "pv") {
            return (
                {
                    "description": "description",
                    "enabled": true,
                    "latching": false,
                    "annunciating": true,
                    "delay": 0,
                    "filter": "2 > 1",
                    "count": 1,
                    "guidances": {},
                    "displays": {},
                    "commands": {},
                    "automated_actions": {}
                }
            )
        } else if (type === "subsystem") {
            return (
                {
                    "guidances": {},
                    "displays": {},
                    "commands": {},
                    "automated_actions": {},
                    "pvs": {},
                }
            )
        } else if (type === "system") {
            return (
                {
                    "guidances": {},
                    "displays": {},
                    "commands": {},
                    "automated_actions": {},
                    "pvs": {},
                    "subsystems": {},
                }
            )
        } else {
            return undefined;
        }
    }


    // ----------------------- memo and forceupdate --------------------

    _ElementSystem = React.memo(this._ElementSystemRaw, (prevProps: any, currentProps: any) => {
        return this.memoFunc(prevProps, currentProps)
    });

    _ElementSubSystem = React.memo(this._ElementSubSystemRaw, (prevProps: any, currentProps: any) => {
        return this.memoFunc(prevProps, currentProps)
    });

    _ElementPv = React.memo(this._ElementPvRaw, (prevProps: any, currentProps: any) => {
        return this.memoFunc(prevProps, currentProps)
    });


    addToForceUpdateElement = (pathStr: string) => {
        this.forceUpdateElements.push(pathStr);
    }

    clearForceUpdateElements = () => {
        this.forceUpdateElements.length = 0;
    }

    removeForceUpdateElement = (pathStr: string) => {
        // find the first one
        const index = this.forceUpdateElements.indexOf(pathStr);
        if (index >= 0) {
            this.forceUpdateElements.splice(index, 1);
        }
    }


    memoFunc = (prevProps: any, currentProps: any) => {

        if (this.forceUpdateElements.includes("/")) {
            return false
        }
        const pathStr = currentProps.pathStr;
        for (const elementPathStr of this.forceUpdateElements) {
            // trace up with the forceUpdatedPath's ancesters, the first Element-type ancester will be updated


            if (pathStr.replaceAll("]", "").includes(elementPathStr.replaceAll("]", "")) || elementPathStr.replaceAll("]", "").includes(pathStr.replaceAll("]", ""))) {
                // should be re-rendered
                return false;
            }
        }
        return true;
    }


    // ----------------------- getters -------------------

    getElement = () => {
        return <this._Element></this._Element>
    }



    getEditing = () => {
        return this._editing;
    }

    setEditing = (newStatus: boolean) => {
        this._editing = newStatus;
    }

    getMainPage = () => {
        return this._mainPage;
    }


    // ----------------------- config mini page ----------------    

    forceUpdateConfigMiniPage = (input: any) => { };

    _ElementConfigMiniPage = () => {

        const [, forceUpdate] = React.useState({});
        this.forceUpdateConfigMiniPage = forceUpdate;

        if (this.showConfigMiniPage === false) {
            return null;
        }

        let pathStr = JSON.stringify([]);
        if (this.mouseOnPathStr !== "") {
            pathStr = this.mouseOnPathStr;
        } else {
            pathStr = this.selectedPathStr;
        }

        if (pathStr === "") {
            return null;
        }

        let data = this.getMainPage().getData(JSON.parse(pathStr));


        return (
            <div
                style={{
                    // backgroundColor: 'yellow',
                    position: "fixed",
                    display: "inline-flex",
                    flexDirection: "column",
                    width: "50%",
                    padding: 0,
                    boxSizing: "border-box",
                    justifyContent: "flex-start",
                    alignItems: 'center',
                    fontSize: this.getMainPage().baseFontSize * 0.9,
                }}
            >
                <div
                    style={{
                        // marginRight: 10,
                        width: "95%",
                        border: "solid 1px black",
                        boxSizing: "border-box",
                        display: "inline-flex",
                        flexDirection: "column",
                        padding: 10,
                        // paddingLeft: 20,
                        backgroundColor: "rgba(220, 220, 220, 1)",
                        paddingBottom: 25,
                        justifyContent: "center",
                        alignItems: "stretch",
                    }}
                >
                    <div
                        style={{
                            width: "100%",
                            justifyContent: "flex-start",
                            alignItems: "flex-start",
                        }}
                    >
                        <ElementRectangleButton
                            handleClick={() => {
                                this.getMainPage().getConfigPage().showingConfigPage = pathStr;
                                this._forceUpdate({});
                            }}
                            defaultBackgroundColor={"rgba(180, 180, 180, 0)"}
                            defaultTextColor={"rgba(0,0,0,1)"}
                            highlightTextColor={"200, 200, 200, 1"}
                            highlightBackgroundColor={"rgba(180, 180, 180, 1)"}
                            paddingTop={1}
                            paddingBottom={1}
                            paddingLeft={3}
                            paddingRight={3}
                            fontSize={this.getMainPage().baseFontSize}
                            additionalStyle={{ border: "solid 1px rgba(70, 70, 70, 1)" }}
                        >
                            Edit
                        </ElementRectangleButton>
                    </div>
                    <div
                        style={{
                            display: "inline-flex",
                            flexDirection: "row",
                            marginTop: 5,
                            justifyContent: "center",
                            marginBottom: 10,
                        }}
                    >
                        {JSON.parse(pathStr).map((name: string, index: number) => {
                            if (name === "subsystems" || name === "pvs") {
                                return null;
                            } else {
                                return (
                                    <div
                                        style={{
                                            fontWeight: "bold",
                                            fontSize: this.getMainPage().baseFontSize * 1.1,
                                        }}
                                    >
                                        {name}{index < JSON.parse(pathStr).length - 1 ? <>&nbsp;&#8212;&nbsp;</> : ""}
                                    </div>
                                )
                            }
                        })}
                    </div>
                    {Object.entries(data).map(([fieldName, fieldValue]) => {

                        if (fieldName === "guidances") {
                            return (
                                <this._ElementCofigMiniPageStringDetails
                                    pathStr={JSON.stringify([...JSON.parse(pathStr), "guidances"])}
                                >

                                </this._ElementCofigMiniPageStringDetails>
                            )
                        } else if (fieldName === "displays") {
                            return (
                                <this._ElementCofigMiniPageStringDetails
                                    pathStr={JSON.stringify([...JSON.parse(pathStr), fieldName])}
                                >

                                </this._ElementCofigMiniPageStringDetails>
                            )

                        } else if (fieldName === "commands") {
                            return (
                                <this._ElementCofigMiniPageStringDetails
                                    pathStr={JSON.stringify([...JSON.parse(pathStr), fieldName])}
                                >

                                </this._ElementCofigMiniPageStringDetails>
                            )

                        } else if (fieldName === "automated_actions") {
                            return (
                                <this._ElementCofigMiniPageAutomatedActions
                                    pathStr={JSON.stringify([...JSON.parse(pathStr), fieldName])}
                                >
                                </this._ElementCofigMiniPageAutomatedActions>
                            )
                        } else if (fieldName === "description") {
                            return (
                                <this._ElementConfigMiniPageStringNumberBoolean
                                    pathStr={JSON.stringify([...JSON.parse(pathStr), fieldName])}
                                ></this._ElementConfigMiniPageStringNumberBoolean>
                            )
                        } else if (fieldName === "enabled") {
                            return (
                                <this._ElementConfigMiniPageStringNumberBoolean
                                    pathStr={JSON.stringify([...JSON.parse(pathStr), fieldName])}
                                ></this._ElementConfigMiniPageStringNumberBoolean>
                            )

                        } else if (fieldName === "latching") {
                            return (
                                <this._ElementConfigMiniPageStringNumberBoolean
                                    pathStr={JSON.stringify([...JSON.parse(pathStr), fieldName])}
                                ></this._ElementConfigMiniPageStringNumberBoolean>
                            )

                        } else if (fieldName === "annunciating") {
                            return (
                                <this._ElementConfigMiniPageStringNumberBoolean
                                    pathStr={JSON.stringify([...JSON.parse(pathStr), fieldName])}
                                ></this._ElementConfigMiniPageStringNumberBoolean>
                            )

                        } else if (fieldName === "delay") {
                            return (
                                <this._ElementConfigMiniPageStringNumberBoolean
                                    pathStr={JSON.stringify([...JSON.parse(pathStr), fieldName])}
                                ></this._ElementConfigMiniPageStringNumberBoolean>
                            )

                        } else if (fieldName === "filter") {
                            return (
                                <this._ElementConfigMiniPageStringNumberBoolean
                                    pathStr={JSON.stringify([...JSON.parse(pathStr), fieldName])}
                                ></this._ElementConfigMiniPageStringNumberBoolean>
                            )

                        } else if (fieldName === "count") {
                            return (
                                <this._ElementConfigMiniPageStringNumberBoolean
                                    pathStr={JSON.stringify([...JSON.parse(pathStr), fieldName])}
                                ></this._ElementConfigMiniPageStringNumberBoolean>
                            )

                        } else {
                            return null;
                        }
                    })}
                </div>
            </div>
        )
    }


    _ElementConfigMiniPageStringNumberBoolean = ({ pathStr }: { pathStr: string }) => {
        const path = JSON.parse(pathStr);
        const data = this.getMainPage().getData(path);
        const propertyName = path[path.length - 1];

        return (
            <div style={{
                display: "inline-flex",
                flexDirection: 'row',
                // marginTop: 5,
                fontSize: this.getMainPage().baseFontSize * 0.9,
                width: "100%",
            }}>

                <div style={{
                    display: "inline-flex",
                    flexDirection: 'row',
                    marginTop: 5,
                    width: "100%",
                }}>
                    <div
                        style={{
                            display: "inline-flex",
                            flexDirection: 'row',
                            width: "25%",
                            minWidth: "25%",
                            maxWidth: "25%",
                        }}>
                        {capitalizeFirstLetter(propertyName)}
                    </div>
                    <div
                        style={{
                            display: "inline-flex",
                            flexDirection: 'row',
                            paddingLeft: 10,
                            // whiteSpace: "nowrap",
                        }}>
                        {typeof data !== "boolean" ? `${data}` : data === true ? "Yes" : "No"}
                    </div>
                </div>
            </div>
        )
    }

    _ElementCofigMiniPageStringDetails = ({ pathStr }: { pathStr: string }) => {
        const path = JSON.parse(pathStr);
        const data = this.getMainPage().getData(path);
        const propertyName = path[path.length - 1];

        return (
            <div
                style={{
                    display: "inline-flex",
                    flexDirection: "column",
                }}
            >
                <div
                    style={{
                        fontSize: this.getMainPage().baseFontSize,
                        fontWeight: "bold",
                        marginTop: 15,
                    }}
                >
                    {capitalizeFirstLetter(propertyName)}
                </div>
                {Object.entries(data).length === 0 ?
                    <div style={{
                        display: "inline-flex",
                        flexDirection: 'row',
                        marginTop: 5,
                    }}>

                        {`No ${propertyName} defined.`}
                    </div>
                    :
                    <>
                        <div style={{
                            display: "inline-flex",
                            flexDirection: 'row',
                            marginTop: 5,
                            fontWeight: "bold",
                        }}>
                            <div
                                style={{
                                    display: "inline-flex",
                                    flexDirection: 'row',
                                    width: "25%",
                                    minWidth: "25%",
                                    maxWidth: "25%",
                                }}>
                                Title
                            </div>
                            <div
                                style={{
                                    display: "inline-flex",
                                    flexDirection: 'row',
                                    paddingLeft: 10,
                                }}>
                                Details
                            </div>
                        </div>
                        {
                            Object.entries(data).map(([fieldName, fieldValue]) => {
                                const details = fieldValue["details"];
                                return (
                                    <div style={{
                                        display: "inline-flex",
                                        flexDirection: 'row',
                                        marginTop: 5,
                                    }}>
                                        <div
                                            style={{
                                                display: "inline-flex",
                                                flexDirection: 'row',
                                                width: "25%",
                                                minWidth: "25%",
                                                maxWidth: "25%",
                                            }}>
                                            {fieldName}
                                        </div>
                                        <div
                                            style={{
                                                display: "inline-flex",
                                                flexDirection: 'row',
                                                paddingLeft: 10,
                                            }}>
                                            {details}
                                        </div>
                                    </div>
                                )
                            })
                        }
                    </>
                }
            </div>
        )
    }

    _ElementCofigMiniPageAutomatedActions = ({ pathStr }: { pathStr: string }) => {
        const path = JSON.parse(pathStr);
        const data = this.getMainPage().getData(path);
        const propertyName = path[path.length - 1];

        return (
            <div
                style={{
                    display: "inline-flex",
                    flexDirection: "column",
                }}
            >
                <div
                    style={{
                        fontSize: this.getMainPage().baseFontSize,
                        fontWeight: "bold",
                        marginTop: 15,
                    }}
                >
                    {capitalizeFirstLetter(propertyName)}
                </div>
                {Object.entries(data).length === 0 ?
                    <div style={{
                        display: "inline-flex",
                        flexDirection: 'row',
                        marginTop: 5,
                    }}>

                        {`No ${propertyName} defined.`}
                    </div>
                    :
                    <>

                        <div style={{
                            display: "inline-flex",
                            flexDirection: 'row',
                            marginTop: 5,
                            justifyContent: "flex-start",
                            alignItems: 'flex-start',
                            fontWeight: "bold",
                        }}>
                            <div
                                style={{
                                    display: "inline-flex",
                                    flexDirection: 'row',
                                    width: "25%",
                                    minWidth: "25%",
                                    maxWidth: "25%",
                                    justifyContent: "flex-start",
                                    alignItems: 'flex-start',
                                }}>
                                Title
                            </div>
                            <div
                                style={{
                                    display: "inline-flex",
                                    flexDirection: 'row',
                                    width: "15%",
                                    minWidth: "15%",
                                    maxWidth: "15%",
                                    justifyContent: "flex-start",
                                    alignItems: 'flex-start',
                                }}>
                                Delay [s]
                            </div>
                            <div
                                style={{
                                    display: "inline-flex",
                                    flexDirection: 'row',
                                    width: "20%",
                                    minWidth: "20%",
                                    maxWidth: "20%",
                                    justifyContent: "flex-start",
                                    alignItems: 'flex-start',
                                }}>
                                Type
                            </div>
                            <div
                                style={{
                                    display: "inline-flex",
                                    flexDirection: 'row',
                                    paddingLeft: 10,
                                    justifyContent: "flex-start",
                                    alignItems: 'flex-start',
                                }}>
                                Details
                            </div>
                        </div>
                        {
                            Object.entries(data).map(([fieldName, fieldValue]) => {
                                const delay = fieldValue["delay"];
                                const type = fieldValue["type"];
                                const details = fieldValue["details"];
                                return (
                                    <div style={{
                                        display: "inline-flex",
                                        flexDirection: 'row',
                                        marginTop: 5,
                                        justifyContent: "flex-start",
                                        alignItems: 'flex-start',
                                    }}>
                                        <div
                                            style={{
                                                display: "inline-flex",
                                                flexDirection: 'row',
                                                width: "25%",
                                                minWidth: "25%",
                                                maxWidth: "25%",
                                            }}>
                                            {fieldName}
                                        </div>
                                        <div
                                            style={{
                                                display: "inline-flex",
                                                flexDirection: 'row',
                                                width: "15%",
                                                minWidth: "15%",
                                                maxWidth: "15%",
                                            }}>
                                            {delay}
                                        </div>
                                        <div
                                            style={{
                                                display: "inline-flex",
                                                flexDirection: 'row',
                                                width: "20%",
                                                minWidth: "20%",
                                                maxWidth: "20%",
                                            }}>
                                            {type}
                                        </div>
                                        <div
                                            style={{
                                                display: "inline-flex",
                                                flexDirection: 'row',
                                                paddingLeft: 10,
                                            }}>
                                            {details}
                                        </div>
                                    </div>
                                )
                            })
                        }
                    </>
                }
            </div>
        )
    }

}
