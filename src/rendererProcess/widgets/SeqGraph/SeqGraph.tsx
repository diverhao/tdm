import * as GlobalMethods from "../../../common/GlobalMethods";
import * as React from "react";
import { MouseEvent } from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { GlobalVariables } from "../../../common/GlobalVariables";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { v4 as uuidv4 } from "uuid";
import { DataSet } from "vis-data";
import { Network } from "vis-network/standalone";
import { ElementRectangleButton } from "../../helperWidgets/SharedElements/RectangleButton";
import { ChannelAlarmStatus, ChannelSeverity, menuScan, TcaChannel } from "../../channel/TcaChannel";
import { Log } from "../../../common/Log";
import { SeqGraphSidebar } from "./SeqGraphSidebar";
import { Condition, SeqProgram, SeqState, SeqStateSet } from "./SeqProgram";
import { ElementMacrosTable } from "../../helperWidgets/SharedElements/MacrosTable";
import { parseSeq } from "./SeqParser";

export type type_SeqGraph_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
    macros: [string, string][];
    // recordTypes: Record<string, any>;
    // menus: Record<string, any>;
};

export enum colors {
    NO_ALARM = "rgba(25, 218, 0, 0)",
    MINOR = "rgba(255,128,0,1)",
    MAJOR = "rgba(255,0,0,1)",
    INVALID = "rgba(255,0,255,1)",
    NOT_CONNECTED = "rgba(200,0,200,1)",
    inlink = "rgb(0, 128, 128)",
    outlink = "rgb(128, 0, 128)",
    fwdlink = "rgba(0,0,255,1)",
    background = "rgb(149, 204, 255)",
    highlight = "rgb(215, 68, 90)",
    dbfilenode = "rgb(177, 177, 61)",
    currentState = "rgba(0, 255, 0, 1)",
}


export class SeqGraph extends BaseWidget {
    readonly rtypWaitingName: string = uuidv4();

    networkData: {
        nodes: DataSet<any, "id">;
        edges: DataSet<any, "id">;

    } = { nodes: new DataSet({}), edges: new DataSet({}) };

    dbFiles: Record<string, Record<string, any>[]> = {};

    currentId: number = 0;

    networkClickCallback: any = () => { };
    networkDragStartCallback: any = () => { };

    networkDoubleClickCallback: any = () => { };

    forceUpdateConfigPage: () => void = () => { };
    forceUpdate: () => void = () => { };
    setShowConfigPage: any = () => { };

    network: undefined | Network = undefined;

    _seqProgram: SeqProgram;

    _macros: [string, string][] = [];

    updateLogElement = (input: any) => { };

    _emulateMode: boolean = false;
    edgePeekContent: string = "";
    setShowEdgePeekContent = (show: boolean) => { };

    // Define network options
    // https://rdrr.io/cran/visNetwork/man/visEdges.html
    // https://rdrr.io/cran/visNetwork/man/visNodes.html
    networkOptions = {
        edges: {
            arrows: 'to',
            font: {
                color: '#000',
                size: 12,
                align: 'middle'
            },
            smooth: true,
            chosen: {
                edge: true,
                label: false,
            },
            color: {
            },
            width: 1,
            selectionWidth: 1.5,
            labelHighlightBold: false,
            arrowStrikethrough: true,
        },
        nodes: {
            font: {
                color: "black",
            },
            // color: {
            //     background: colors.NO_ALARM,
            //     highlight: {
            //         background: colors.highlight,
            //     },
            // },
            labelHighlightBold: false,
            borderWidth: 0,
            borderWidthSelected: 0,
        },
        interaction: {
            hover: false,
            multiselect: true,   // Enable multi-node selection
            selectConnectedEdges: true, // Optionally select edges with nodes
            zoomView: true,
            dragView: true,
        },
        physics: {
            enabled: true,
            solver: 'forceAtlas2Based',
            forceAtlas2Based: {
                gravitationalConstant: -100, // Increase repulsion
                springLength: 200, // minimum edge length
                springConstant: 0.05
            },
            stabilization: {
                enabled: true,
                iterations: 200,
            }
        }
    };

    // initialChannelNames: string[] = [];

    constructor(widgetTdl: type_SeqGraph_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this.setReadWriteType("write");

        this.setMacros(JSON.parse(JSON.stringify(widgetTdl.macros)));
        this._sidebar = new SeqGraphSidebar(this);

        this._seqProgram = new SeqProgram("Seq Program", this);

        window.addEventListener("mousedown", (event: any) => {
            if (event.target !== null && event.target !== document.getElementById("edgePeekContent")) {
                this.setShowEdgePeekContent(false);
            }
        })
    }

    // ------------------------------ elements ---------------------------------

    // Body + sidebar
    _ElementRaw = () => {
        // guard the widget from double rendering
        this.widgetBeingRendered = true;
        React.useEffect(() => {
            this.widgetBeingRendered = false;
        });
        g_widgets1.removeFromForceUpdateWidgets(this.getWidgetKey());

        this.updateAllStyleAndText();

        return (
            <ErrorBoundary style={this.getStyle()} widgetKey={this.getWidgetKey()}>
                <>
                    <this._ElementBody></this._ElementBody>
                    {this.showSidebar() ? this.getSidebar()?.getElement() : null}
                </>
            </ErrorBoundary>
        );
    };

    getElementFallbackFunction = () => {
        return this._ElementFallback;
    };

    // Text area and resizers
    _ElementBodyRaw = (): React.JSX.Element => {
        return (
            // always update the div below no matter the TextUpdateBody is .memo or not
            // TextUpdateResizer does not update if it is .memo
            <div style={{ ...this.getElementBodyRawStyle() }}>
                <this._ElementArea></this._ElementArea>
                {this.showResizers() ? <this._ElementResizer /> : null}
            </div>
        );
    };

    // only shows the text, all other style properties are held by upper level _ElementBodyRaw
    _ElementAreaRaw = ({ }: any): React.JSX.Element => {
        const allStyle = this.getAllStyle();
        const allText = this.getAllText();
        const [, forceUpdate] = React.useState({});
        this.forceUpdate = () => { forceUpdate({}) };

        return (
            <div
                style={{
                    display: "inline-flex",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    userSelect: "none",
                    overflow: "hidden",
                    whiteSpace: allText.wrapWord ? "normal" : "pre",
                    justifyContent: allText.horizontalAlign,
                    alignItems: allText.verticalAlign,
                    fontFamily: allStyle.fontFamily,
                    fontSize: allStyle.fontSize,
                    fontStyle: allStyle.fontStyle,
                    fontWeight: allStyle.fontWeight,
                    color: allStyle["color"],
                    outline: this._getElementAreaRawOutlineStyle(),
                    boxSizing: "border-box",

                }}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                <this._ElementSeqGraph></this._ElementSeqGraph>
                <this._ElementLog></this._ElementLog>
            </div>
        );
    };

    _ElementMask = () => {
        return <div style={{
            position: "absolute",
            display: "inline-flex",
            width: "100%",
            height: "100%",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0, 0, 0, 0)",
        }}>
        </div>
    }

    setShowLog = (input: boolean) => { };

    _ElementLog = () => {
        const [, forceUpdate] = React.useState({});
        const [showContent, setShowContent] = React.useState(false);
        this.setShowLog = setShowContent;

        const [logHeight, setLogHeight] = React.useState(200);
        const showHideElementRef = React.useRef<any>(null);
        const copyElementRef = React.useRef<any>(null);

        const handleMouseDown = () => {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
        }

        const handleMouseMove = (event: any) => {
            const dy = event.movementY;
            setLogHeight((oldValue: number) => {
                return Math.min(window.innerHeight * 0.6, Math.max(40, oldValue - dy));
            })
        };

        const handleMouseUp = () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        }

        this.updateLogElement = forceUpdate;
        return (
            <div style={{
                position: "fixed",
                bottom: 0,
                width: "100%",
                // maxHeight: "40%",
                // height: logHeight + 20,
                backgroundColor: "rgba(255, 255, 255, 1)",
                display: "inline-flex",
                flexDirection: "column",
                userSelect: "text",
            }}
                onMouseDown={(event: MouseEvent) => { event.stopPropagation() }}

            >
                <div style={{
                    width: "100%",
                    height: 20,
                    backgroundColor: "rgba(245, 245, 245, 1)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    cursor: showContent === true ? "ns-resize" : "default",
                    flexDirection: "row",
                }}
                    onMouseDown={() => {
                        handleMouseDown();
                    }}
                >
                    <div
                        ref={copyElementRef}
                        style={{
                            userSelect: "none",
                            marginRight: 10,
                            cursor: "pointer",
                            paddingLeft: 5,
                            paddingRight: 5,
                            borderRadius: 2,
                        }}

                        onClick={() => {
                            navigator.clipboard.writeText(this.getSeqProgram().getLog().join("\n"));
                        }}
                        onMouseEnter={() => {
                            if (copyElementRef.current !== null) {
                                copyElementRef.current.style["backgroundColor"] = "rgba(150, 150, 150, 1)";
                            }
                        }}
                        onMouseLeave={() => {
                            if (copyElementRef.current !== null) {
                                copyElementRef.current.style["backgroundColor"] = "rgba(190, 190, 190, 0)";
                            }
                        }}
                    >
                        {showContent === true ? "Copy Log" : ""}
                    </div>
                    <div
                        ref={showHideElementRef}
                        style={{
                            userSelect: "none",
                            marginRight: 10,
                            cursor: "pointer",
                            paddingLeft: 5,
                            paddingRight: 5,
                            borderRadius: 2,
                        }}
                        onMouseDown={(event: MouseEvent) => { event.stopPropagation() }}
                        onClick={() => {
                            if (showContent === true) {
                                setShowContent(false);
                            } else {
                                setShowContent(true);
                            }
                        }}
                        onMouseEnter={() => {
                            if (showHideElementRef.current !== null) {
                                showHideElementRef.current.style["backgroundColor"] = "rgba(150, 150, 150, 1)";
                            }
                        }}
                        onMouseLeave={() => {
                            if (showHideElementRef.current !== null) {
                                showHideElementRef.current.style["backgroundColor"] = "rgba(190, 190, 190, 0)";
                            }
                        }}
                    >
                        {showContent === true ? "Hide Log" : "Show Log"}
                    </div>

                </div>
                <div
                    style={{
                        display: showContent === true ? "inline-flex" : "none",
                        flexDirection: "column",
                        width: "100%",
                        height: logHeight,
                        boxSizing: "border-box",
                        fontFamily: "monospace",
                        paddingLeft: 10,
                        backgroundColor: "rgba(245, 245, 245, 1)",
                        overflowY: "auto",
                    }}
                >
                    {
                        this.getSeqProgram().getLog().map((log: string, index: number) => {
                            return (
                                <div
                                    key={log}
                                >
                                    {log}
                                </div>
                            )
                        })
                    }

                </div>
            </div>
        )
    }

    _ElementSeqGraph = () => {
        const elementRef = React.useRef<any>(null);
        // const rawChannelName = this.getChannelNames()[0];
        // const [channelName, setChannelName] = React.useState(rawChannelName === undefined? "": rawChannelName);
        const [channelName, setChannelName] = React.useState("");
        const [showEdgePeekContent, setShowEdgePeekContent] = React.useState(false);
        this.setShowEdgePeekContent = setShowEdgePeekContent;
        const [showConfigPage, setShowConfigPage] = React.useState(false);
        this.setShowConfigPage = setShowConfigPage;


        React.useEffect(() => {
            if (g_widgets1.isEditing()) {
                return;
            }
            setTimeout(() => {
                if (g_widgets1.isEditing()) {
                    this.network?.destroy()
                } else {
                    if (elementRef.current !== null) {

                        this.network = new Network(elementRef.current, this.networkData, this.networkOptions);
                        this.networkClickCallback = (params: any) => {
                            this.handleClickEdge(params, false);
                        };
                        this.networkDoubleClickCallback = (params: any) => {
                            this.handleClickEdge(params);
                        };
                        this.networkDragStartCallback = (params: any) => {
                            this.handleClickEdge(params, false);
                        };
                        // click edge
                        this.network.on('click', this.networkClickCallback);
                        this.network.on('doubleClick', this.networkDoubleClickCallback);
                        this.network.on("dragStart", this.networkDragStartCallback);


                        // reset edge and node colors when node is deselected
                        this.network.on("deselectNode", () => {
                            const allEdges = this.networkData.edges;
                            const allNodes = this.networkData.nodes;
                            const allEdgesArr = allEdges.get();
                            const allNodesArr = allNodes.get();
                            allEdges.update(
                                allEdgesArr.map(edge => ({
                                    id: edge.id,
                                    color: { color: colors.background, highlight: colors.MAJOR }
                                }))
                            );
                            allNodes.update(
                                allNodesArr.map(node => ({
                                    id: node.id,
                                    color: { color: colors.background, highlight: colors.MAJOR }
                                }))
                            );
                        });
                    }
                }
            }, 0)
        }, [g_widgets1.isEditing()])

        return (
            <div style={{
                position: "relative",
                display: "inline-flex",
                boxSizing: "border-box",
                width: "100%",
                height: "100%",
            }}>
                <div
                    ref={elementRef}
                    style={{
                        position: "absolute",
                        width: "100%",
                        height: "100%",
                        boxSizing: "border-box",
                    }}
                >
                    {/* to be replaced by vis */}
                </div>
                {/* title */}
                <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    display: "inline-flex",
                    flexDirection: "column",
                    padding: 20,
                    alignItems: "flex-start",
                    width: "100%",
                    boxSizing: "border-box",
                }}>
                    <this._ElementControl ></this._ElementControl>
                </div>

                <this._ElementConfigPage showConfigPage={showConfigPage} setShowConfigPage={setShowConfigPage}></this._ElementConfigPage>

                {g_widgets1.isEditing() ? <this._ElementMask></this._ElementMask> : null}
                {showEdgePeekContent === true ?
                    <div
                        id="edgePeekContent"
                        style={{
                            position: "absolute",
                            border: "solid 1px rgba(150, 150, 150, 1)",
                            top: 60,
                            left: 20,
                            padding: 10,
                            zIndex: 10000,
                            borderRadius: 7,
                            maxWidth: "50%",
                            maxHeight: "50%",
                            // whiteSpace: "wrap",
                            overflow: "auto",
                            userSelect: "text",
                            backgroundColor: "rgba(245, 245, 245, 1)",
                            fontFamily: "monospace"
                        }}
                        onMouseDown={(event: MouseEvent) => { event.stopPropagation() }}
                    >
                        {/* {this.edgePeekContent} */}
                        {this.edgePeekContent.split("\n").map((line: string, index: number) => {
                            if (line.startsWith("// ----- conditions in state ")) {
                                const stateName = line.replace("// ----- conditions in state ", "").replace(" -----", "");
                                return (
                                    <div
                                        onMouseDown={(event: any) => { event.stopPropagation() }}
                                        style={{
                                            cursor: "pointer",
                                            fontWeight: "bold",
                                        }}
                                        onClick={() => {
                                            const regex = new RegExp(`state[\\s]+${stateName}[\\s]*{`, "g");
                                            const foundStr = this.scrollToString(regex);
                                            if (foundStr === true) {
                                                // this.setShowEdgePeekContent(false);
                                                this.setShowConfigPage(true);
                                            }
                                        }}
                                    >
                                        // ----- conditions in state {stateName} ----- {"\n"}
                                    </div>
                                )
                            } else if (line.startsWith("// ----- state ")) {
                                const stateName = line.replace("// ----- state ", "").replace(" -----", "");
                                return (
                                    <div
                                        onMouseDown={(event: any) => { event.stopPropagation() }}
                                        style={{
                                            cursor: "pointer",
                                            fontWeight: "bold",
                                        }}
                                        onClick={() => {
                                            const regex = new RegExp(`state[\\s]+${stateName}[\\s]*{`, "g");
                                            const foundStr = this.scrollToString(regex);
                                            if (foundStr === true) {
                                                // this.setShowEdgePeekContent(false);
                                                this.setShowConfigPage(true);
                                            }
                                        }}

                                    >
                                        // ----- state {stateName} ----- {"\n"}
                                    </div>
                                )
                            } else if (line === "") {
                                return <div>{"\n"}</div>
                            } else {
                                return (
                                    <div key={index} onMouseDown={(event: any) => { event.stopPropagation() }}>
                                        {line}
                                    </div>
                                )
                            }
                        })}
                    </div>
                    : null
                }

            </div>
        );
    };

    scrollToString = (searchStr: string | RegExp, option?: any) => { return false; };

    _ElementConfigPage = ({ showConfigPage, setShowConfigPage }: any) => {
        const [, forceUpdate] = React.useState({});
        const [seqContent, setSeqContent] = React.useState(this.getText()["seqContent"]);
        this.forceUpdateConfigPage = () => { forceUpdate({}) };
        const [checked, setCheck] = React.useState(this.getEmulateMode());
        const textareaRef = React.useRef<HTMLTextAreaElement>(null);
        const [searchStr, setSearchStr] = React.useState("");

        const scrollToString = (
            searchPattern: string | RegExp,
            options?: { fromStart?: boolean }
        ) => {
            const textarea = textareaRef.current;
            if (!textarea) {
                console.error("Textarea reference is not set.");
                return false;
            }

            let regex: RegExp;
            if (typeof searchPattern === "string") {
                regex = new RegExp(searchPattern, "mi"); // add 'i' for case-insensitive
            } else {
                // If RegExp, ensure 'i' flag is present
                const flags = searchPattern.flags.includes("i") ? searchPattern.flags : searchPattern.flags + "i";
                regex = new RegExp(searchPattern.source, flags);
            }

            const value = textarea.value;
            const startPos = textarea.selectionEnd || 0;
            let match: RegExpExecArray | null = null;

            if (options?.fromStart) {
                // Search from beginning
                regex.lastIndex = 0;
                match = regex.exec(value);
            } else {
                // Search from cursor position to end
                regex.lastIndex = 0;
                if (startPos < value.length) {
                    const subValue = value.slice(startPos);
                    match = regex.exec(subValue);
                    if (match && match.index !== undefined) {
                        match.index += startPos;
                    }
                }
                // If not found, search from beginning to cursor position
                if (!match) {
                    const subValue = value.slice(0, startPos);
                    match = regex.exec(subValue);
                }
            }

            if (match && match.index !== undefined) {
                textarea.selectionStart = match.index;
                textarea.selectionEnd = match.index + match[0].length;
                textarea.focus();
                // Scroll to the matched text
                const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight || "20", 10);
                const beforeMatch = textarea.value.slice(0, match.index);
                const linesBefore = beforeMatch.split("\n").length - 1;
                textarea.scrollTop = linesBefore * lineHeight;
                return true;
            } else {
                console.error("No match found for the given pattern.");
                return false;
            }
        }
        this.scrollToString = scrollToString;

        return (
            <div style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: showConfigPage === true ? "100%" : 0,
                height: showConfigPage === true ? "100%" : 0,
                border: "solid 0px black",
                boxSizing: "border-box",
                backgroundColor: "white",
                overflow: "hidden",
                zIndex: 10001, // higher than peek page
            }}
                onMouseDown={(event: MouseEvent) => {
                    event.stopPropagation();
                }
                }

            >
                <div style={{
                    display: "inline-flex",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    flexDirection: "column",
                    width: "100%",
                    height: "100%",
                }}>
                    <div
                        style={{
                            position: "relative",
                            paddingTop: 30,
                            width: "80%",
                            display: "inline-flex",
                            flexDirection: "row",
                            justifyContent: "flex-start",
                            alignItems: "flex-start",
                        }}>
                        Emulation mode:

                        <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event: any) => {
                                this.setEmulateMode(!checked)
                                setCheck(!checked);
                            }}
                        />
                        <div style={{ color: "rgba(150, 150, 150, 1)", wordWrap: "normal", whiteSpace: "wrap", marginLeft: 10 }}>
                            The emulation mode is intended for viewing the seq graph states logic.
                            The code does not have to be compilable, but "state set", "state" and the "when" condition must be structually correct.
                        </div>

                    </div>
                    <div
                        style={{
                            position: "relative",
                            width: "80%",
                            display: "inline-flex",
                            flexDirection: "column",
                            justifyContent: "flex-start",
                            alignItems: "center",
                        }}
                    >
                        <div style={{ width: "100%" }}>
                            <h2>Macros</h2>
                        </div>
                        <ElementMacrosTable
                            headlineName1={"Name"}
                            headlineName2={"Value"}
                            macrosData={this.getMacros()} // [string, string][]

                        ></ElementMacrosTable>
                    </div>

                    <div style={{
                        display: "inline-flex",
                        flexDirection: "column",
                        width: "80%",
                        // height: "100%",
                        marginBottom: 20,
                        flex: 1,
                    }}>
                        <div style={{
                            display: "inline-flex",
                            flexDirection: "row",
                            alignItems: "center",
                            width: "100%",
                            justifyContent: "space-between",
                        }}>
                            <h2>
                                Sequencer
                            </h2>
                            <div style={{
                                display: "inline-flex",
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "flex-end",
                            }}>
                                {/* search box */}
                                <input
                                    type="text"
                                    style={{
                                        width: "100%",
                                        paddingTop: 1,
                                        paddingBottom: 1,
                                        paddingLeft: 3,
                                        paddingRight: 3,
                                        fontFamily: GlobalVariables.defaultFontFamily,
                                        fontSize: GlobalVariables.defaultFontSize,
                                        outline: "none",
                                        border: "solid 1px rgba(150, 150, 150, 1)",
                                        borderRadius: 0,
                                    }}
                                    value={searchStr}
                                    onChange={(event: any) => {
                                        setSearchStr(event.target.value);
                                    }}
                                    placeholder="Search"
                                />
                                {/* search button */}
                                <ElementRectangleButton
                                    marginLeft={10}
                                    handleClick={() => {
                                        if (searchStr !== "") {
                                            const foundStr = this.scrollToString(searchStr);
                                        }
                                    }}
                                >
                                    Search
                                </ElementRectangleButton>
                            </div>
                        </div>
                        <textarea
                            ref={textareaRef}
                            style={{
                                padding: 10,
                                fontFamily: "Consolas,Monaco,'Andale Mono','Ubuntu Mono',monospace",
                                fontSize: GlobalVariables.defaultFontSize,
                                height: "100%",
                                lineHeight: 1.5,
                                outline: "none",
                                border: "solid 1px rgba(150, 150, 150, 1)",
                                resize: "none",
                            }}
                            draggable={false}
                            value={seqContent}
                            spellCheck={false}
                            onChange={(event: any) => {
                                event.preventDefault();
                                setSeqContent(event.target.value);
                                this.getText()["seqContent"] = event.target.value;
                            }}
                            onDragStart={(event: any) => {
                                event.preventDefault();
                            }}
                            onDrop={(event: any) => {
                                event.preventDefault();
                            }}
                        >
                            {this.getText()["seqContent"]}
                        </textarea>
                    </div>
                    <ElementRectangleButton
                        marginBottom={20}
                        handleClick={() => {
                            setShowConfigPage(false);
                        }}
                    >
                        OK
                    </ElementRectangleButton>
                </div>
            </div>
        )
    }


    private _ElementControl = () => {
        const elementRef = React.useRef<any>(null);
        const elementSettingsRef = React.useRef<any>(null);
        const [, forceUpdate] = React.useState({});

        return (
            <div style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                width: "100%",
                marginBottom: 15,
                fontSize: 25,
                fontWeight: "bold",
            }}>
                Seq Graph

                <ElementRectangleButton
                    handleClick={() => {
                        this.setShowLog(false);
                        this.setShowConfigPage(true);
                    }}
                    marginLeft={40}
                >
                    Edit Program Code
                </ElementRectangleButton>


                <ElementRectangleButton
                    handleClick={
                        () => {
                            this.clearSeqProgram();
                            this.jobsAsOperatingModeBegins();
                        }
                    }
                    marginLeft={10}
                >
                    Re-build Program

                </ElementRectangleButton>

                {this.getEmulateMode() === true ? "" :
                    <ElementRectangleButton
                        handleClick={async () => {
                            if (this.getSeqProgram().getStatus() === "running") {
                                Log.info("stop the program")
                                await this.stopSeqProgram();
                            } else {
                                Log.info("start the program")
                                await this.startSeqProgram();
                            }
                            const allNodes = this.networkData["nodes"];
                            const allEdges = this.networkData["edges"];

                            // update the node color
                            for (const seqSet of this.getSeqProgram().getStateSets()) {
                                const currentState = seqSet.getCurrentState();
                                for (const state of seqSet.getStates()) {
                                    allNodes.update({
                                        id: state.getId(),
                                        color: {
                                            background: state === currentState ? colors["currentState"] : colors["background"],
                                            highlight: colors["MAJOR"],
                                        }
                                    })
                                }
                            }

                            // update edge color
                            for (const seqSet of this.getSeqProgram().getStateSets()) {
                                const prevCond = seqSet.getPreviousCondition();
                                for (const state of seqSet.getStates()) {
                                    for (const condition of state.getConditions()) {
                                        allEdges.update({
                                            id: condition.getId(),
                                            color: {
                                                color: condition === prevCond ? colors["currentState"] : colors["background"],
                                                highlight: colors["MAJOR"],
                                            }
                                        })
                                    }
                                }
                            }

                            forceUpdate({});
                        }}
                        marginLeft={10}
                    >
                        {
                            this.getSeqProgram().getStatus() === "running" ?
                                "Stop"
                                :
                                "Run"
                        }
                    </ElementRectangleButton>
                }

            </div>
        )
    }



    /**
     * (1) find the node that is being clicked
     * 
     * (2) find the channel name for this node
     * 
     */
    handleClickEdge = async (params: any, showPeek: boolean = true) => {

        const ids = params.edges;
        const idsNodes = params.nodes;

        // if we click node, show entry, when and exist
        if (idsNodes.length > 0) {
            const nodes = this.networkData["nodes"];
            const clickedNodes = nodes.get(idsNodes);
            const clickedNode = clickedNodes[0];
            this.highlightNetworkNode(clickedNode.id);

            if (clickedNode !== undefined && showPeek === true) {
                const nodeContent = clickedNode.content;
                this.edgePeekContent = nodeContent;
                this.setShowEdgePeekContent(true);
            }
            return false;
        } else {
            const edges = this.networkData["edges"];
            const clickedEdges = edges.get(ids);
            const clickedEdge = clickedEdges[0];
            if (clickedEdge !== undefined && showPeek === true) {
                const edgeContent = clickedEdge.content;
                this.edgePeekContent = edgeContent;
                this.setShowEdgePeekContent(true);
            }
        }
        return true;
    }


    prevChannelValues: Record<string, string | number | string[] | number[] | undefined> = {};
    valueChangedChannelNames: string[] = [];

    mapDbrDataWitNewData = async (channelNames: string[]) => {

        this.valueChangedChannelNames.length = 0;

        // update the this.valueChangedChannelNames
        for (const name of Object.keys(this.prevChannelValues)) {
            const currentChannelValue = this.value_of(name);
            if (channelNames.includes(name)) {
                if (this.prevChannelValues[name] !== currentChannelValue) {
                    this.valueChangedChannelNames.push(name);
                }
                this.prevChannelValues[name] = currentChannelValue;
            }
        }

        const allNodes = this.networkData["nodes"];
        const allEdges = this.networkData["edges"];

        // change current state and previous condition
        if (this.getSeqProgram().getStatus() === "running") {
            await this.getSeqProgram().checkCurrentStates();
        } else {
            return;
        }

        // update the node color
        for (const seqSet of this.getSeqProgram().getStateSets()) {
            const currentState = seqSet.getCurrentState();
            if (currentState !== undefined) {

                const updatedNodes = allNodes.get().map((node) => ({
                    id: node.id,
                    color: {
                        background: colors["background"],
                        highlight: colors["MAJOR"],
                    }
                }));

                allNodes.update(updatedNodes);

                allNodes.update({
                    id: currentState.getId(),
                    color: {
                        background: colors["currentState"],
                        highlight: colors["MAJOR"],
                    }
                })
            }
        }

        // update edge color
        for (const seqSet of this.getSeqProgram().getStateSets()) {
            const prevCond = seqSet.getPreviousCondition();
            if (prevCond !== undefined) {

                const updatedEdges = allEdges.get().map(edge => ({
                    id: edge.id,
                    color: {
                        color: colors["background"],
                        highlight: colors["MAJOR"],
                    }
                }));

                allEdges.update(updatedEdges);


                allEdges.update({
                    id: prevCond.getId(),
                    color: {
                        color: colors["currentState"],
                        highlight: colors["MAJOR"],
                    }
                })
            }
        }
    }


    highlightNetworkNode = (nodeId: string) => {
        const allNodes = this.networkData["nodes"];
        const allEdges = this.networkData["edges"];

        const allEdgesArr = allEdges.get();

        // Reset all edges to default color
        allEdges.update(
            allEdgesArr.map(edge => ({
                id: edge.id,
                color: { color: colors.background, highlight: colors.background }
            }))
        );

        // Edges pointing to selected node: blue
        allEdges.update(
            allEdgesArr
                .filter(edge => edge.to === nodeId)
                .map(edge => ({
                    id: edge.id,
                    color: { color: colors.background, highlight: colors.INVALID }
                }))
        );

        // Edges starting from selected node: red
        allEdges.update(
            allEdgesArr
                .filter(edge => edge.from === nodeId)
                .map(edge => ({
                    id: edge.id,
                    color: { color: colors.background, highlight: colors.MAJOR }
                }))
        );
        ;

    }

    buildSeqProgram = async () => {
        try {

            const global: any = {};



            let createAsyncFuncFromStr = (code: string) => {
                const fn = new Function("connect", "caput", "value_of", "delay", "global", "value_is_changed", "alarm_of", "severity_of", "print", `
        return async () => {
          ${code}
        };
      `);
                return fn(this.connect, this.caput, this.value_of, this.delay, global, this.value_is_changed, this.alarm_of, this.severity_of, this.print);
            };

            if (this.getEmulateMode() === true) {
                createAsyncFuncFromStr = (code: string) => {
                    return async () => { let a: any = 33; return a };
                };
            }


            const createFuncFromStr = (code: string) => {
                const fn = new Function(`
  return (() => {
    ${code}
  });
`)();
                return fn;
            };

            let seqContent = this.getText()["seqContent"];

            let seqContent1 = `

global.pv1 = "Input_voltage";
global.pv2 = "Indicator_light";
global.a = 37;
// connect("Input_voltage", "Indicator_light");
connect(global.pv1, global.pv2, "{SYS}:abc")


ss volt_check {
    state light_off {
        when(value_of(global.pv1) > 5.0) {
            caput(global.pv2, 1);
            print(\`thisi s zhubobofu {SYS1} \${global.a} \`);print(\`thisi s zhubobofu {SYS1} \${global.a} \`);print(\`thisi s zhubobofu {SYS1} \${global.a} \`);print(\`thisi s zhubobofu {SYS1} \${global.a} \`);print(\`thisi s zhubobofu {SYS1} \${global.a} \`);print(\`thisi s zhubobofu {SYS1} \${global.a} \`);
        } state light_on
    }

    state light_on {
        when(value_of(global.pv1) <= 5.0) {
            caput(global.pv2, 0);
            print("that is zhubobofu");
        } state light_off
    }
}`;

            seqContent = this.replaceMacros(seqContent);
            const seq = parseSeq(seqContent, this.getEmulateMode());
            const preambleStr = seq["preamble"];
            const stateSetsData = seq["stateSets"];
            const preambleFunc = createAsyncFuncFromStr(preambleStr);
            await preambleFunc();

            for (const stateSetData of stateSetsData) {
                //   const stateSetResult = {};
                //   stateSetResult["name"] = name;
                //   stateSetResult["states"] = [];

                // state set name
                const stateSet = new SeqStateSet(this.getSeqProgram(), stateSetData["name"]);
                this.getSeqProgram().addStateSet(stateSet);

                // states
                for (const stateData of stateSetData["states"]) {
                    //   const stateResult = {};
                    //   stateResult["name"] = name;
                    //   stateResult["entryBlocks"] = [];
                    //   stateResult["conditions"] = [];
                    //   stateResult["exitBlocks"] = [];


                    // entry function
                    const entryBlocks = stateData["entryBlocks"];
                    let entryFunc: () => any = () => { };
                    let entryFuncStr = "";
                    if (entryBlocks.length > 0) {
                        entryFunc = createAsyncFuncFromStr(entryBlocks[0].action);
                        entryFuncStr = entryBlocks[0].action;
                    }

                    // exit function
                    const exitBlocks = stateData["exitBlocks"];
                    let exitFunc: () => any = () => { };
                    let exitFuncStr = "";
                    if (exitBlocks.length > 0) {
                        exitFunc = createAsyncFuncFromStr(exitBlocks[0].action);
                        exitFuncStr = entryBlocks[0].action;
                    }

                    // create SeqState object
                    let state = new SeqState(
                        stateSet,
                        stateData["name"],
                        entryFunc,
                        exitFunc,
                        entryFuncStr,
                        exitFuncStr,
                    );
                    stateSet.addState(state);
                }

                // conditions
                for (const stateData of stateSetData["states"]) {
                    const thisStateName = stateData["name"];
                    const thisState = stateSet.getState(thisStateName);
                    if (thisState === undefined) {
                        continue;
                    }

                    const conditionsData = stateData["conditions"];
                    let conditionIndex = 1;
                    for (const conditionData of conditionsData) {
                        // {
                        //     booleanCondition: booleanCondition,
                        //     action: action,
                        //     nextState: next_state,
                        // }
                        const nextStateName = conditionData["nextState"];
                        const nextState = stateSet.getState(nextStateName);

                        const actionStr = conditionData["action"];
                        const actionFunc = createAsyncFuncFromStr(actionStr);

                        const booleanConditionStr = conditionData["booleanCondition"];
                        const booleanConditionFunc = createAsyncFuncFromStr("return " + booleanConditionStr) as any;

                        if (nextState !== undefined) {
                            const condition = new Condition(
                                nextState,
                                booleanConditionFunc,
                                actionFunc,
                                // booleanConditionStr.replace(/value_of\((.*?)\)/g, '$1').trim().slice(1, -1),
                                `[${conditionIndex}] ` + booleanConditionStr,
                                actionStr);
                            thisState.addCondition(condition);
                            conditionIndex++;
                        }
                    }
                }
            }


            // (2) channel names 


            this.getChannelNamesLevel0().push(...this.getSeqProgram().getChannelNames());
            this.processChannelNames();
            g_widgets1.connectAllTcaChannels(true)

            // (3) prepare data set for plot
            const prog = this.getSeqProgram();

            const allNodes = this.networkData["nodes"];
            const allEdges = this.networkData["edges"];

            // add nodes
            for (const stateSet of prog.getStateSets()) {
                for (const state of stateSet.getStates()) {
                    // each state is a node
                    const stateNode = {
                        id: state.getId(),
                        label: state.getName(),
                        shape: "big ellipse",
                        physics: false,
                        content: "// ----- conditions in state " + state.getName() + " -----\n\n" + state.getContentStr() + '\n\n// ----- conditions that transition to this state -----\n\n' + state.getConditionsContentLeadingToThisState(),
                        // x: x + 100 * (Math.random() - 0.5),
                        // y: y + 100 * (Math.random() - 0.5),
                        // no border needed
                        color: {
                            // background: source === "IOC" ? colors.background : colors.dbfilenode,
                            background: colors.background,
                            highlight: colors.MAJOR,
                        }
                    };
                    allNodes.add(stateNode)
                }
            }

            // add edges
            for (const stateSet of prog.getStateSets()) {
                for (const state of stateSet.getStates()) {
                    let selfLoopCount = 0;
                    let selfRefOption: any = undefined;
                    // each condition is an edge
                    for (const condition of state.getConditions()) {
                        const booleanFuncText = condition.getBooleanFuncText();
                        const execFuncText = condition.getExecFuncText();
                        const toState = condition.getNextState();

                        const from = state.getId();
                        const to = toState.getId();

                        if (from === undefined || to === undefined) {
                            continue;
                        }

                        if (from === to) {
                            // self-loop edge
                            selfRefOption = {
                                angle: (selfLoopCount * Math.PI) / 2 + selfLoopCount * 0.1, // slightly change the angle for each self-loop
                            }
                            selfLoopCount++;

                        }

                        allEdges.add({
                            id: condition.getId(),
                            from: from,
                            to: to,
                            label: booleanFuncText,
                            // content: execFuncText,
                            content: "// ----- state " + state.getName() + " -----\n\n" + condition.getContentStr(),
                            arrows: { to: { enabled: true, scaleFactor: 0.5 } },
                            selfReference: selfRefOption,
                            color: {
                                color: colors.background, // default edge color
                                highlight: colors.MAJOR,
                            }
                        })

                    }
                }
            }


        } catch (e) {
            Log.error(e);
            const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
            displayWindowClient.getIpcManager().handleDialogShowMessageBox(undefined, {
                info: {
                    messageType: "error",
                    humanReadableMessages: ["Error building the seq program.", `${e}`],
                    rawMessages: [],
                }
            })

        }
    }

    delayQueue: { timeout: any, resolve: any, reject: any }[] = [];

    delay = async (dt: number) => {

        const promise = new Promise((resolve, reject) => {
            const timeOut = setTimeout(() => {
                resolve("");
                this.delayQueue = this.delayQueue.filter((item) => item["timeout"] !== timeOut);
            }, dt * 1000)
            const timeOutObj = { timeout: timeOut, resolve: resolve, reject: reject };
            this.delayQueue.push(timeOutObj);
        })
        try {
            await promise;
        } catch (e) {
            return false;
        }


        return true;
    }

    value_of = (channelName: string) => {
        try {
            const displayWindowId = g_widgets1.getRoot().getDisplayWindowClient().getWindowId();
            const channel = g_widgets1.getTcaChannel(channelName);
            const channelValue = channel.getValueForDisplay();
            return channelValue;
        } catch (e) {
            Log.error("Failed to get channel value for", channelName);
        }
        return undefined;
    }


    value_is_changed = (channelName: string) => {
        return this.valueChangedChannelNames.includes(channelName);
    }



    severity_of = (channelName: string) => {
        try {
            const displayWindowId = g_widgets1.getRoot().getDisplayWindowClient().getWindowId();
            const channel = g_widgets1.getTcaChannel(channelName);
            const severity = channel.getSeverity();
            return severity;
        } catch (e) {
            Log.error("Failed to get channel severity for", channelName);
        }
        return ChannelSeverity.NOT_CONNECTED;
    }

    alarm_of = (channelName: string) => {
        try {
            const displayWindowId = g_widgets1.getRoot().getDisplayWindowClient().getWindowId();
            const channel = g_widgets1.getTcaChannel(channelName);
            const alarmStatus = channel.getStatus();
            return alarmStatus;
        } catch (e) {
            Log.error("Failed to get channel alarm status for", channelName);
        }
        return ChannelAlarmStatus.UDF;
    }


    caput = async (channelName: string, value: string | string[] | number | number[]): Promise<boolean> => {
        try {
            const displayWindowId = g_widgets1.getRoot().getDisplayWindowClient().getWindowId();
            const channel = g_widgets1.getTcaChannel(channelName);
            // always wait notify
            const status = await channel.put(displayWindowId, { value: value }, 1, true); // always wait notify
            // should not happend: the above .put is waitNotify
            if (status === undefined) {
                return false;
            }
            // failed
            if (typeof status === "boolean") {
                return status;
            }
            // ca, success, a number
            if (status === 1) {
                return true;
            }
            // pva, success
            if (typeof status === "object" && (status["type"] === 0 || status["type"] === 255)) {
                return true;
            }
            // fallback
            return false;
        } catch (e) {
            Log.error("Failed to put channel value for", channelName);
            return false;
        }
    }

    print = (info: string) => {
        this.getSeqProgram().prependLog(info);
    }


    connect = (...channelNames: string[]) => {
        this.getSeqProgram().getChannelNames().length = 0;
        this.getSeqProgram().getChannelNames().push(...channelNames);
        for (const name of channelNames) {
            this.prevChannelValues[name] = undefined;
        }

    }

    replaceMacros = (code: string) => {
        const result = code.replace(/(?<!\$)\{([^{}]*)\}/g, (match, key) => {
            for (const macro of this.getMacros()) {
                if (macro[0] === key) {
                    const value = macro[1];
                    return value;
                }
            }
            return "{" + key + "}"; // Example: convert to uppercase and wrap in []
        });

        return result;
    }



    // todo: build the program based on seq source code

    /**
     * Build the seq program based on the .st file 
     * 
     * (1) add all state sets to this._seqProgram in a top-down fashion
     * 
     * (2) add channels to BaseWidget._channelNamesLevel0, process channel names, and connect all channels
     * 
     * (3) generate the network graph
     */

    startSeqProgram = async () => {
        Log.info("Start Seq program")
        await this.getSeqProgram().start();
    }

    stopSeqProgram = () => {
        Log.info("Stop Seq program")
        // reject all delay Q
        for (const item of this.delayQueue) {
            item["reject"]("Program stopped");
        }
        this.getSeqProgram().pause();
    }




    /**
     * (1) remove all nodes
     * 
     * (2) reset view port
     * 
     * (3) clear the seq program data
     * 
     * (4) destroy all channels in this widget
     * 
     * (5) clear channel names, leaving the first channel, because other field channels were 
     *     added to channel names list
     * 
     * (6) process channel names
     * 
     * (7) set the program status to "stopped"
     * 
     * (8) force update the widget
     */
    clearSeqProgram = () => {
        // (1)
        const allNodes = this.networkData["nodes"];
        const allEdges = this.networkData["edges"];
        allNodes.clear();
        allEdges.clear();
        // (2)
        this.network?.moveTo({
            position: { x: 0, y: 0 }, // Default center position
            scale: 1,                 // Default zoom level
            animation: false
        });

        // (3)
        this.getSeqProgram().clear();

        // (4)
        for (let channelName of this.getChannelNames()) {
            try {
                const tcaChannel = g_widgets1.getTcaChannel(channelName);
                tcaChannel.destroy(this.getWidgetKey());
            } catch (e) {
            }
        }

        // (5)
        this.getChannelNamesLevel0().length = 0;

        // (6)
        this.processChannelNames();

        // (7)
        this.getSeqProgram().setStatus("stopped");

        // (8)
        this.forceUpdate();

    }
    _Element = React.memo(this._ElementRaw, () => this._useMemoedElement());
    _ElementArea = React.memo(this._ElementAreaRaw, () => this._useMemoedElement());
    _ElementBody = React.memo(this._ElementBodyRaw, () => this._useMemoedElement());

    // defined in super class
    // getElement()
    // getSidebarElement()
    // _ElementResizerRaw
    // _ElementResizer

    // -------------------- helper functions ----------------

    // defined in super class
    // showSidebar()
    // showResizers()
    // _useMemoedElement()
    // hasChannel()
    // isInGroup()
    // isSelected()
    // _getElementAreaRawOutlineStyle()

    // only for TextUpdate and TextEntry
    // they are suitable to display array data in various formats,
    // other types of widgets, such as Meter, Spinner, Tanks, ProgressBar, Thermometer, ScaledSlider are not for array data
    _getChannelValue = (raw: boolean = false) => {
        const channelValue = this.getChannelValueForMonitorWidget(raw);

        if (typeof channelValue === "number" || typeof channelValue === "string") {
            return this._parseChannelValueElement(channelValue);
        } else if (Array.isArray(channelValue)) {
            const result: any[] = [];
            for (let element of channelValue) {
                result.push(this._parseChannelValueElement(element));
            }
            if (this.getAllText()["format"] === "string") {
                return result.join("");
            } else {
                return result;
            }
        } else {
            return channelValue;
        }
    };

    _getChannelSeverity = () => {
        return this._getFirstChannelSeverity();
    };

    _getChannelUnit = () => {
        const unit = this._getFirstChannelUnit();
        if (unit === undefined) {
            return "";
        } else {
            return unit;
        }
    };

    getSeqFileContent = () => {
        return this.getText()["seqFileContent"];
    }

    getSeqProgram = () => {
        return this._seqProgram;
    }
    setMacros = (newMacros: [string, string][]) => {
        this._macros = newMacros;
    };

    getMacros = () => {
        return this._macros;
    };


    getEmulateMode = () => {
        return this._emulateMode;
    }

    setEmulateMode = (newMode: boolean) => {
        this._emulateMode = newMode;
    }


    // ----------------------- styles -----------------------

    // defined in super class
    // _resizerStyle
    // _resizerStyles
    // StyledToolTipText
    // StyledToolTip

    // -------------------------- tdl -------------------------------

    static generateDefaultTdl = () => {

        const defaultTdl: type_SeqGraph_tdl = {
            type: "SeqGraph",
            widgetKey: "", // "key" is a reserved keyword
            key: "",
            style: {
                // basics
                position: "absolute",
                display: "inline-flex",
                // dimensions
                left: 0,
                top: 0,
                width: 500,
                height: 500,
                backgroundColor: "rgba(255, 255, 255, 1)",
                // angle
                transform: "rotate(0deg)",
                // border, it is different from the "alarmBorder" below,
                borderStyle: "solid",
                borderWidth: 0,
                borderColor: "rgba(0, 0, 0, 1)",
                // font
                color: "rgba(0,0,0,1)",
                fontFamily: GlobalVariables.defaultFontFamily,
                fontSize: GlobalVariables.defaultFontSize,
                fontStyle: GlobalVariables.defaultFontStyle,
                fontWeight: GlobalVariables.defaultFontWeight,
                // shows when the widget is selected
                outlineStyle: "none",
                outlineWidth: 1,
                outlineColor: "black",
            },
            text: {
                // text
                horizontalAlign: "flex-start",
                verticalAlign: "flex-start",
                wrapWord: false,
                showUnit: true,
                // actually "alarm outline"
                alarmBorder: true,
                invisibleInOperation: false,
                // default, decimal, exponential, hexadecimal
                format: "default",
                // scale, >= 0
                scale: 0,
                seqContent: "",
            },
            channelNames: [],
            groupNames: [],
            rules: [],
            macros: [],
            // recordTypes: {},
            // menus: {},

        };
        defaultTdl["widgetKey"] = GlobalMethods.generateWidgetKey(defaultTdl["type"]);
        return JSON.parse(JSON.stringify(defaultTdl));
    };

    generateDefaultTdl: () => any = SeqGraph.generateDefaultTdl;

    // static method for generating a widget tdl with external PV name
    static generateWidgetTdl = (utilityOptions: Record<string, any>): type_SeqGraph_tdl => {
        const result = this.generateDefaultTdl();
        return result;
    };

    // defined in super class
    getTdlCopy(newKey: boolean = true) {
        const result = super.getTdlCopy(newKey);
        // channels names should be extracted from seq program
        result.channelNames = [];
        result.macros = this.getMacros();
        // result.recordTypes = {};
        // result.menus = {};
        return result;
    }
    // --------------------- getters -------------------------

    // defined in super class
    // getType()
    // getWidgetKey()
    // getStyle()
    // getText()
    // getSidebar()
    // getGroupName()
    // getGroupNames()
    // getUpdateFromWidget()
    // getResizerStyle()
    // getResizerStyles()
    // getRules()

    // ---------------------- setters -------------------------

    // ---------------------- channels ------------------------

    // defined in super class
    // getChannelNames()
    // expandChannelNames()
    // getExpandedChannelNames()
    // setExpandedChannelNames()
    // expandChannelNameMacro()

    // ------------------------ z direction --------------------------

    // defined in super class
    // moveInZ()
    // -------------------------- sidebar ---------------------------
    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new SeqGraphSidebar(this);
        }
    }

    // jobsAsEditingModeBegins(): void {
    //     super.jobsAsEditingModeBegins();
    //     this.clearGraph();
    // }

    jobsAsOperatingModeBegins() {
        try {
            this.buildSeqProgram();
        } catch (e) {

        }
        super.jobsAsEditingModeBegins();
    }
}
