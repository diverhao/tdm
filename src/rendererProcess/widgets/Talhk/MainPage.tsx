import * as React from "react";
// import ReactDOM from "react-dom/client";
import { ElementRectangleButton } from "./RectangleButton";
import { TreePage } from "./TreePage";
import { TablePage } from "./TablePage";
import { AreaPage } from "./AreaPage";
import { ConfigPage } from "./ConfigPage";
import { PA } from "./PA";
import { speakText } from "./GlobalMethod";
import { Talhk } from "./Talhk";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
export enum SEVERITES {
    NO_ALARM,
    MINOR,
    MAJOR,
    INVALID,
    NOT_CONNECTED,
}


export enum ALARM_STATUS {
    NO_ALARM,
    READ,
    WRITE,
    HIHI,
    HIGH,
    LOLO,
    LOW,
    STATE,
    COS,
    COMM,
    TIMEOUT,
    HWLIMIT,
    CALC,
    SCAN,
    LINK,
    SOFT,
    BAD_SUB,
    UDF,
    DISABLE,
    SIMM,
    READ_ACCESS,
    WRITE_ACCESS,
}


export type type_data = Record<string, any> | string | number | boolean;

// global variables
// const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

export class MainPage {

    private _data: Record<string, any> = {};
    private _ws: WebSocket | undefined = undefined;
    private _wsPort: number = 0;
    private _view: TreePage | AreaPage | TablePage | undefined = undefined;
    private eventCallbacks: Record<string, (data: type_data) => void> = {}
    private configPage: ConfigPage;
    private _engineName: string = "";
    private _pa: PA;
    baseFontSize = 14;
    baseFontFamily = "MyFont, sans-serif";
    private _mediaRecorder: MediaRecorder | undefined = undefined;
    showInfoPage: boolean = false;
    infoPageData: { type: "info" | "error" | "warning", messages: string[] } = {
        type: "info",
        messages: [],
    };

    _mainWidget: Talhk;
    _serverAddress: string;

    resourcePath = "../../../webpack/resources/webpages/"

    constructor(mainWidget: Talhk, serverAddress: string) {
        this._mainWidget = mainWidget;
        this._serverAddress = serverAddress;

        this.addEventListeners();
        this.requestWsPort();
        this.configPage = new ConfigPage(this);
        this._pa = new PA(this);
    }

    getServerAddress = () => {
        return this._serverAddress
    }

    getMainWidget = () => {
        return this._mainWidget
    }

    handlePaVoiceData = async (messageData: { voiceData: string }) => {
        this.getPa().handlePaVoiceData(messageData);
    }

    getPa = () => {
        return this._pa;
    }

    switchView = (newPage: "TreePage" | "AreaPage" | "TablePage") => {
        if (newPage === "TablePage") {
            this.setView(new TablePage(this));
        } else if (newPage === "AreaPage") {
            this.setView(new AreaPage(this));
        } else if (newPage === "TreePage") {
            this.setView(new TreePage(this));
        } else {
            console.log("Failed to switch page to", newPage);
            return;
        }
        const page = this.getView();
        if (page !== undefined) {
            // root.render(page.getElement());
            // this.getMainWidget().switchView(newPage)

            g_widgets1.addToForceUpdateWidgets(this.getMainWidget().getWidgetKey());
            g_flushWidgets()
            // the requested data comes in "new-data" event, 
            // the new-data will be handled separately for difference Page
            this.requestData([]);
        }
    }

    // ----------------- websocket -------------------

    startWs = () => {
        // const hostName = window.location.hostname;
        const hostName = this.getServerAddress().replace("http://", "").split(":")[0];
        const wsAddress = "ws://" + hostName + ":" + `${this.getWsPort()}`
        this._ws = new WebSocket(wsAddress);


        this._ws.onopen = (event) => {
            this.switchView("TreePage");
        }

        this._ws.onmessage = (event) => {
            // event.data: string
            // {eventName: string, messageData: Record<string, any>}
            const { eventName, messageData } = JSON.parse(event.data);
            const callback = this.eventCallbacks[eventName];
            if (callback !== undefined) {
                callback(messageData);
            }
        }

        this._ws.onclose = (event) => {
            this.showInfoPage = true;
            this.infoPageData = {
                type: "error",
                messages: [
                    `Disconnected from Alarm Handler server.`,
                    "Click the button to reconnect."
                ],
            }
            this.forceUpdate();
        }
    }

    forceUpdate = () => {
        const view = this.getView();
        if (view !== undefined) {
            view._forceUpdate({});
        }
    }

    addEventListeners = () => {
        this.addEventListener("new-data", this.handleNewData);
        this.addEventListener("request-engine-name", this.handleRequestEngineName);
        this.addEventListener("alarmed-channels-new-values", this.handleAlarmedChannelsNewValues);
        this.addEventListener("pa-voice-data", this.handlePaVoiceData);
    }

    addEventListener = (eventName: string, callback: (messageData: any) => void) => {
        this.eventCallbacks[eventName] = callback;
    }

    // ------------------ communicating with server --------------------

    requestData = (path: string[]) => {
        this.sendToServer("request-data", {
            path: path,
        });
    }

    requestEngineName = () => {
        this.sendToServer("request-engine-name", {
        });
    }

    sendNewData = (path: string[], newData: type_data) => {
        this.sendToServer("new-data", {
            path: path,
            newData: newData,
        })
    }

    /**
     * Each page has its own handler for "new-data" event
     */
    handleNewData = (messageData: { path: string[], newData: type_data }) => {
        console.log("-------------- new data --------------")

        console.log("new data arrives", messageData)

        const { path, newData } = messageData;

        // update the data
        let currentData = this.getData([]);

        // special case: the whole config
        if (path.length === 0 && typeof newData === "object") {
            this.setData(newData);
        } else {

            for (let ii = 0; ii < path.length; ii++) {
                if (currentData === undefined) {
                    break;
                }
                const name = path[ii];
                if (currentData[name] === undefined && ii !== path.length - 1) {
                    break;
                }

                // we have reached to the end of path array
                // if the node exists, modify its value
                // if the node does not exist, creat it
                if (ii === path.length - 1) {
                    currentData[name] = newData;
                    break;
                }
                currentData = currentData[name];
            }
        }

        console.log(this.getData([]))

        // View-specific handlers
        const view = this.getView();
        if (view instanceof TreePage) {
            view.handleNewData(messageData);
        } else if (view instanceof AreaPage) {
            // todo: handle new data
        } else if (view instanceof TablePage) {
            view.handleNewData();
        }

    }


    handleRequestEngineName = (messageData: { name: string }) => {
        this.setEngineName(messageData["name"]);

        const view = this.getView();
        if (view !== undefined) {
            view.setEngineName(messageData["name"]);
        }
    }

    handleAlarmedChannelsNewValues = (messageData: { newValues: Record<string, any> }) => {
        console.log(JSON.stringify(messageData))
        const view = this.getView();
        if (view instanceof TablePage) {
            view.updateChannelValues(messageData["newValues"]);
        }
    }


    requestWsPort = async () => {
        try {
            const response = await fetch(`${this.getServerAddress()}/request-ws-port`,
                {
                    method: "POST",
                    body: JSON.stringify({}),
                }
            );
            if (!response.ok) {
                throw new Error(`Response status: ${response.status}`);
            }

            const { eventName, data } = await response.json();
            const port = data["port"];
            if (port !== undefined) {
                this.setWsPort(port);
                this.startWs();
            }

        } catch (error) {
            console.error(error);
        }

    }


    sendToServer = (eventName: string, messageData: any) => {
        this.getWs()?.send(JSON.stringify({
            eventName: eventName,
            messageData: messageData,
        }), // must be a string
        );
    }


    getWsPort = () => {
        return this._wsPort;
    }

    setWsPort = (newPort: number) => {
        this._wsPort = newPort;
    }


    getWs = () => {
        return this._ws;
    }

    getView = () => {
        return this._view;
    }

    setView = (newView: TreePage | AreaPage | TablePage) => {
        this._view = newView;
    }

    getData = (path: string[]) => {

        let result = this._data;
        for (const elementPath of path) {
            result = result[elementPath];
            if (result === undefined) {
                return {};
            }
        }
        return result;
    }


    setData = (newData: Record<string, any>) => {
        this._data = newData;
    }


    _ElementOpenDisplaysRunCommands = ({ pathStr, show }: { pathStr: string, show: boolean }) => {

        if (show === false) {
            return null;
        }

        let displays: Record<string, { details: string }> = {};
        let commands: Record<string, { details: string }> = {};

        const data = this.getData(JSON.parse(pathStr));
        if (data !== undefined) {
            const displaysData = data["displays"];
            if (displaysData !== undefined && Object.keys(displaysData).length > 0) {
                displays = displaysData;
            }
            const commandsData = data["commands"];
            if (commandsData !== undefined && Object.keys(commandsData).length > 0) {
                commands = commandsData;
            }
        }

        console.log("...", data["status"]["severity_when_alarmed"] === SEVERITES.NO_ALARM ? "none" : "inline-flex")

        const [value, setValue] = React.useState("");

        return (
            <div style={{
                display: "inline-flex",
                flexDirection: "row",
                justifyContent: "flex-start",
                alignItems: "center",
            }}>

                {/* ACK/UN-ACK button */}
                <div
                    style={{
                        borderRadius: 2,
                        border: `solid ${this.baseFontSize / 14}px rgba(0,155,255,1)`,
                        outline: "none",
                        backgroundColor: "",
                        color: "rgba(0,155,255,1)",
                        // padding: 0,
                        paddingLeft: 3,
                        paddingRight: 3,
                        margin: 0,
                        cursor: "pointer",
                        // display: data["status"]["severity_when_alarmed"] === SEVERITES.NO_ALARM ? "none" : "inline-flex",
                        justifyContent: "center",
                        alignItems: "center",
                        fontSize: this.baseFontSize - 6,
                        fontFamily: this.baseFontFamily,
                        marginLeft: 3,
                        marginRight: 3,
                        height: this.baseFontSize - 2,
                        display: "inline-flex",

                    }}
                    onClick={() => {
                        if (data["status"]["acknowledged"] === true) {
                            this.unAckNode(JSON.parse(pathStr));
                        } else {
                            this.ackNode(JSON.parse(pathStr));
                        }
                    }}
                >
                    {data["status"]["acknowledged"] === true ? "UN-ACK" : "ACK"}
                </div>

                {/* open displays, run commands */}
                {Object.keys(displays).length + Object.keys(commands).length === 0 ?
                    null
                    :
                    <select
                        style={{
                            outline: "none",
                            borderRadius: 0,
                            border: "none",
                            padding: 0,
                            width: this.baseFontSize,
                            WebkitAppearance: 'none',
                            MozAppearance: 'none',
                            backgroundColor: 'rgba(0,0,0,0)',
                            fontSize: this.baseFontSize,
                            fontFamily: this.baseFontFamily,

                        }}
                        value={value}
                        onChange={(event: any) => {
                            const newValue = event.target.value;
                            if (newValue.startsWith("open-display-")) {
                                // todo: open the display
                                const title = newValue.replace("open-display-", "");
                                const content = displays[title];
                                const details = content["details"];
                                console.log("open display", details);
                            } else {
                                // todo: run command
                                const title = newValue.replace("run-command-", "");
                                const content = commands[title];
                                const details = content["details"];
                                console.log("run command", details);
                            }
                            setValue("run");
                        }}
                    >

                        <option value={"run"}>&#128736; </option>

                        {Object.keys(displays).length > 0 ?
                            <optgroup label="Open display">
                                {Object.entries(displays).map(([title, content]: [string, { details: string }]) => {
                                    return (
                                        <option
                                            value={`open-display-${title}`}
                                        >
                                            {title}
                                        </option>
                                    )
                                })}
                            </optgroup>
                            :
                            null
                        }
                        {Object.keys(commands).length > 0 ?
                            <optgroup label="Run command">
                                {Object.entries(commands).map(([title, content]: [string, { details: string }]) => {
                                    return (
                                        <option
                                            value={`run-command-${title}`}
                                        >
                                            {title}
                                        </option>
                                    )
                                })}
                            </optgroup>
                            :
                            null
                        }
                    </select>
                }
            </div>
        )

    }


    getElementOpenDisplaysRunCommands = (pathStr: string, show: boolean) => {
        return <this._ElementOpenDisplaysRunCommands pathStr={pathStr} show={show}></this._ElementOpenDisplaysRunCommands>
    }

    _ElementRunCommand = ({ title, details }: { title: string, details: string }) => {
        return (
            <ElementRectangleButton
                handleClick={() => {
                    // todo: run command "details"
                    console.log("run command", details);
                }}
            >
                {title}
            </ElementRectangleButton>
        )
    }



    _ElementInfoPage = ({ type, messages }: { type: "info" | "warning" | "error", messages: string[] }) => {

        // try to reconnect in 5 seconds, then every 10 seconds
        const [reconnectCountingDown, setReconnectCountingDown] = React.useState(5);

        React.useEffect(() => {
            if (type === "error") {
                setInterval(() => {
                    setReconnectCountingDown((prevValue: number) => {
                        if (prevValue === 0) {
                            this.attemptReload();
                        }
                        return prevValue <= 0 ? 10 : prevValue - 1;
                    })
                }, 1000)
            }
        }, [])

        return (
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    boxSizing: "border-box",
                    zIndex: 1000,
                    backgroundColor: "rgba(0,0,0,1)",
                    display: "inline-flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <div
                    style={{
                        color: type === "error" ? "rgba(255, 0, 0, 1)" : type === "warning" ? "rgba(255,255,0,1)" : "rgba(255,255,255,1)",
                        fontSize: 35,
                        fontWeight: "bold",
                        marginBottom: 10,
                    }}
                >
                    {type.toLocaleUpperCase()}
                </div>
                <div
                    style={{
                        color: "rgba(255, 255, 255, 1)",
                        fontSize: 16,
                        fontWeight: "bold",
                        display: "inline-flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        marginTop: 10,
                        marginBottom: 25,
                    }}
                >
                    {messages.map((message: string, index: number) => {
                        return (
                            <div style={{
                                margin: 5,
                            }}>
                                {message}
                            </div>
                        )
                    })}
                </div>
                {type === "error" ?
                    <>
                        <div
                            style={{
                                color: "rgba(255,255,255,1)",
                                marginBottom: 20,
                            }}
                        >
                            Automatically reconnect in {reconnectCountingDown} second{reconnectCountingDown > 1 ? "s" : ""}
                        </div>
                        <ElementRectangleButton
                            handleClick={() => {
                                this.attemptReload()
                            }}

                        >
                            Reconnect
                        </ElementRectangleButton>
                    </>
                    :
                    null
                }


            </div>
        )
    }
    attemptReload = () => {
        fetch("/", { method: "HEAD", cache: "no-store" })
            .then(response => {
                if (response.ok) {
                    // If server is back up, reload for real
                    window.location.reload();
                } else {
                    console.log("Server responded but not OK:", response.status);
                }
            })
            .catch(error => {
                // Server still down — stay on this page
                console.log("Server is still unreachable:", error);
            });
    }

    getConfigPage = () => {
        return this.configPage;
    }

    getEngineName = () => {
        return this._engineName;
    }

    setEngineName = (newName: string) => {
        this._engineName = newName;
    }

    ackNode = (path: string[]) => {
        const data = this.getData(path);
        const status = data["status"];
        // this node should have "status" -> "acknowledged" 
        if (typeof status === "object") {
            const currentAck = status["acknowledged"];
            if (currentAck === false) {
                this.sendNewData([...path, "status", "acknowledged"], true);
                return;
            }
        }
    }

    unAckNode = (path: string[]) => {
        const data = this.getData(path);
        const status = data["status"];
        // this node should have "status" -> "acknowledged" 
        if (typeof status === "object") {
            const currentAck = status["acknowledged"];
            if (currentAck === true) {
                this.sendNewData([...path, "status", "acknowledged"], false);
                return;
            }
        }
    }


    // --------------------- PA ----------------------

    testingPa: boolean = false;

    _ElementTestTalk = () => {
        return (
            <ElementRectangleButton
                handleMouseDown={(event: any) => {
                    speakText("Alarm, this is a test.")
                }}
                marginRight={20}
                fontSize={this.baseFontSize}
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
                Test talk
            </ElementRectangleButton>
        )
    }

    _ElementTestPa = () => {
        const elementRef = React.useRef<any>(null);
        const [text, setText] = React.useState("Test PA");
        return (
            <div
                ref={elementRef}
                style={{
                    cursor: "pointer",
                    backgroundColor: "rgba(255, 255, 255, 1)",
                    userSelect: "none",
                    border: "solid 1px rgba(100, 100, 100, 1)",
                    borderRadius: 3,
                    fontSize: this.baseFontSize,
                    marginRight: 20,
                    paddingTop: 2,
                    paddingBottom: 2,
                    paddingLeft: 3,
                    paddingRight: 3,
                    fontFamily: this.baseFontFamily,
                }}
                onMouseEnter={() => {
                    this.getView()?.setHint("Hold and speak, you will hear the echo.")
                    if (elementRef.current !== null) {
                        elementRef.current.style["backgroundColor"] = "rgba(220, 220, 220,1)";
                    }
                }}
                onMouseDown={async () => {
                    this.testingPa = true;
                    this.getPa().startAudioStreaming();
                    setTimeout(() => {
                        if (elementRef.current !== null) {
                            elementRef.current.style["backgroundColor"] = "rgba(255, 0, 0,1)";
                            elementRef.current.style["color"] = "rgba(255, 255, 255,1)";
                        }
                        this.getView()?.setHint("Start to talk, you should be hearing your echo.")
                    }, 500)
                }}

                onMouseUp={() => {
                    this.testingPa = false;
                    if (elementRef.current !== null) {
                        elementRef.current.style["backgroundColor"] = "rgba(255, 255, 255,1)";
                        elementRef.current.style["color"] = "rgba(0, 0, 0,1)";
                    }
                    // setText("PA")
                    this.getPa().stopAudioStreaming();
                    this.getView()?.setHint("")
                }}

                onMouseLeave={() => {
                    this.testingPa = false;
                    if (elementRef.current !== null) {
                        elementRef.current.style["color"] = "rgba(0, 0, 0,1)";
                        elementRef.current.style["backgroundColor"] = "rgba(255, 255, 255,1)";
                    }
                    // setText("PA")
                    this.getPa().stopAudioStreaming();
                    this.getView()?.setHint("")
                }}
            >
                {text}
            </div>
        )
    }

    _ElementPa = () => {
        const elementRef = React.useRef<any>(null);
        const [text, setText] = React.useState("PA");
        return (
            <div
                ref={elementRef}
                style={{
                    cursor: "pointer",
                    backgroundColor: "rgba(255, 255, 255, 1)",
                    userSelect: "none",
                    border: "solid 1px rgba(100, 100, 100, 1)",
                    borderRadius: 3,
                    fontSize: "2em",
                    paddingLeft: 5,
                    paddingRight: 5,
                    fontFamily: this.baseFontFamily,
                }}
                onMouseEnter={() => {
                    this.getView()?.setHint("Hold and speak to broadcast to all alarm handler clients.")
                    if (elementRef.current !== null) {
                        elementRef.current.style["backgroundColor"] = "rgba(220, 220, 220,1)";
                    }
                }}
                onMouseDown={async () => {
                    this.getPa().startAudioStreaming();
                    setTimeout(() => {
                        if (elementRef.current !== null) {
                            elementRef.current.style["backgroundColor"] = "rgba(255, 0, 0,1)";
                            elementRef.current.style["color"] = "rgba(255, 255, 255,1)";
                        }
                        this.getView()?.setHint("Broadcasting PA. Now everyone can hear you.")
                    }, 500)
                }}

                onMouseUp={() => {
                    if (elementRef.current !== null) {
                        elementRef.current.style["backgroundColor"] = "rgba(255, 255, 255,1)";
                        elementRef.current.style["color"] = "rgba(0, 0, 0,1)";
                    }
                    // setText("PA")
                    this.getPa().stopAudioStreaming();
                    this.getView()?.setHint("")
                }}

                onMouseLeave={() => {
                    if (elementRef.current !== null) {
                        elementRef.current.style["color"] = "rgba(0, 0, 0,1)";
                        elementRef.current.style["backgroundColor"] = "rgba(255, 255, 255,1)";
                    }
                    // setText("PA")
                    this.getPa().stopAudioStreaming();
                    this.getView()?.setHint("")
                }}
            >
                {text}
            </div>
        )
    }


    _ElementModifyButton = ({ imgSrc, handleClick, hint, setHint }: { imgSrc: string, handleClick: () => void, hint: string, setHint: (hint: string) => void }) => {
        const imgRef = React.useRef<any>(null);

        return (
            <img
                ref={imgRef}
                src={imgSrc}
                style={{
                    width: this.baseFontSize,
                    height: this.baseFontSize,
                    cursor: "pointer",
                    opacity: 0.2,
                    marginLeft: 3,

                }}
                onClick={() => {
                    handleClick();
                }}
                onMouseEnter={() => {
                    if (imgRef.current !== null) {
                        imgRef.current.style["opacity"] = 1;
                        imgRef.current.style["outline"] = 'solid 2px blue';
                        // imgRef.current.style["filter"] = 'invert(100%)';
                        // imgRef.current.style["backgroundColor"] = 'rgba(255,255,255,1)';
                    }
                    setHint(hint)
                }}


                onMouseLeave={() => {
                    if (imgRef.current !== null) {
                        imgRef.current.style["opacity"] = 0.2;
                        imgRef.current.style["outline"] = 'none';
                        // imgRef.current.style["filter"] = '';
                        // imgRef.current.style["backgroundColor"] = 'rgba(0,0,0,0)';
                    }
                    setHint("")
                }}
            >
            </img>
        )
    }

    // -----------------------------------------

}

// export let mainPage: undefined | MainPage = undefined;

// const font = new FontFace('MyFont', 'url(/fonts/Inter-VariableFont_opsz.ttf)');
// font.load().then((loadedFont) => {
//     document.fonts.add(loadedFont);
//     mainPage = new MainPage();
// });
