import * as React from "react";
import { MouseEvent } from "react";
import { GlobalVariables, g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { GroupSelection2 } from "../../helperWidgets/GroupSelection/GroupSelection2";

import * as GlobalMethods from "../../global/GlobalMethods";
import { BaseWidget } from "../BaseWidget/BaseWidget";
// import { TextUpdateRules } from "./TextUpdateRules";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
// import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
// import * as d3 from "d3";
// const d3 = require("d3");
import { v4 as uuidv4 } from "uuid";
// import vis from "vis-network";
import { Network } from "vis-network/standalone/esm/vis-network";
import { VisData } from "vis-network/declarations/network/gephiParser";
import { DataSet } from "vis-network/standalone/esm/vis-network";
import { ElementRectangleButton } from "../../helperWidgets/SharedElements/RectangleButton";
import { ChannelSeverity, menuScan, TcaChannel } from "../../channel/TcaChannel";
import { Log } from "../../../mainProcess/log/Log";
import { DbdFiles } from "../../channel/DbdFiles";
import { ChannelGraphSidebar } from "./ChannelGraphSidebar";


enum type_channelSource {
    dbFile,
    ioc,
};



export type type_ChannelGraph_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
    recordTypes: Record<string, any>;
    menus: Record<string, any>;
};

enum type_nodeStatus {
    expaneded,
    not_expanded,
    cannot_expand,
}

const borderWidth = 2;


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
}


export class ChannelGraph extends BaseWidget {
    // level-1 properties in tdl file
    // _type: string;
    // _widgetKey: string;
    // _style: Record<string, any>;
    // _text: Record<string, any>;
    // _channelNames: string[];
    // _groupNames: string[] = undefined;

    // sidebar
    // private _sidebar: TextUpdateSidebar;

    // tmp methods
    // private _tmp_mouseMoveOnResizerListener: any = undefined;
    // private _tmp_mouseUpOnResizerListener: any = undefined;

    // widget-specific channels, these channels are only used by this widget
    // private _tcaChannels: TcaChannel[];

    // used for the situation of shift key pressed + mouse down on a selected widget,
    // so that when the mouse is up, the widget is de-selected
    // its value is changed in 3 places: this.select2(), this._handleMouseMove() and this._handleMouseUp()
    // private _readyToDeselect: boolean = false;

    // _rules: TextUpdateRules;
    // rtyp: string = "";
    readonly rtypWaitingName: string = uuidv4();
    _dbdFiles: DbdFiles;

    networkData: {
        nodes: DataSet<any, "id">;
        edges: DataSet<any, "id">;

    } = { nodes: new DataSet({}), edges: new DataSet({}) };

    dbFiles: Record<string, Record<string, any>[]> = {};

    currentId: number = 0;

    networkClickCallback: any = () => { };

    networkDoubleClickCallback: any = () => { };

    forceUpdateConfigPage: () => void = () => { };
    forceUpdate: () => void = () => { };
    setShowConfigPage: any = () => { };

    network: undefined | Network = undefined;



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

    constructor(widgetTdl: type_ChannelGraph_tdl) {
        console.log("channel graph widget tdl", widgetTdl)
        super(widgetTdl);
        // this.setReadWriteType("read");

        this.setStyle({ ...ChannelGraph._defaultTdl.style, ...widgetTdl.style });
        this.setText({ ...ChannelGraph._defaultTdl.text, ...widgetTdl.text });

        this._dbdFiles = new DbdFiles(JSON.parse(JSON.stringify(widgetTdl.recordTypes)), JSON.parse(JSON.stringify(widgetTdl.menus)));

        // this.initialChannelNames = widgetTdl["channelNames"];
        // console.log("---------------------------", this._dbdFiles)
        // const css = document.createElement('link');
        // css.rel = 'stylesheet';
        // css.href = '../../../webpack/resources/css/prism.css'; // Make sure the path is correct relative to your HTML file
        // document.head.appendChild(css);
        // const js = document.createElement('script');
        // js.src = '../../../webpack/resources/js/vis-network.min.js';
        // js.type = 'text/javascript';
        // document.head.appendChild(js);

        // this._rules = new TextUpdateRules(this, widgetTdl);

        this._sidebar = new ChannelGraphSidebar(this);
    }

    // ------------------------- event ---------------------------------

    // defined in widget, invoked in sidebar
    // (1) determine which tdl property should be updated
    // (2) calculate new value
    // (3) assign new value
    // (4) add this widget as well as "GroupSelection2" to g_widgets1.forceUpdateWidgets
    // (5) flush
    updateFromSidebar = (event: any, propertyName: string, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        // todo: remove this method
    };

    // defined in super class
    // _handleMouseDown()
    // _handleMouseMove()
    // _handleMouseUp()
    // _handleMouseDownOnResizer()
    // _handleMouseMoveOnResizer()
    // _handleMouseUpOnResizer()
    // _handleMouseDoubleClick()

    // ----------------------------- geometric operations ----------------------------

    // defined in super class
    // simpleSelect()
    // selectGroup()
    // select()
    // simpleDeSelect()
    // deselectGroup()
    // deSelect()
    // move()
    // resize()

    // ------------------------------ group ------------------------------------

    // defined in super class
    // addToGroup()
    // removeFromGroup()

    // ------------------------------ elements ---------------------------------

    // element = <> body (area + resizer) + sidebar </>

    // Body + sidebar
    _ElementRaw = () => {
        this.setRulesStyle({});
        this.setRulesText({});
        const rulesValues = this.getRules()?.getValues();
        if (rulesValues !== undefined) {
            this.setRulesStyle(rulesValues["style"]);
            this.setRulesText(rulesValues["text"]);
        }
        this.setAllStyle({ ...this.getStyle(), ...this.getRulesStyle() });
        this.setAllText({ ...this.getText(), ...this.getRulesText() });

        // must do it for every widget
        g_widgets1.removeFromForceUpdateWidgets(this.getWidgetKey());
        this.renderChildWidgets = true;
        React.useEffect(() => {
            this.renderChildWidgets = false;
        });

        return (
            <ErrorBoundary style={this.getStyle()} widgetKey={this.getWidgetKey()}>
                <>
                    <this._ElementBody></this._ElementBody>
                    {this._showSidebar() ? this.getSidebar()?.getElement() : null}
                </>
            </ErrorBoundary>
        );
    };

    getElementFallbackFunction = () => {
        return this._ElementFallback;
    };

    // Text area and resizers
    _ElementBodyRaw = (): JSX.Element => {
        return (
            // always update the div below no matter the TextUpdateBody is .memo or not
            // TextUpdateResizer does not update if it is .memo
            <div style={{ ...this.getElementBodyRawStyle() }}>
                <this._ElementArea></this._ElementArea>
                {this._showResizers() ? <this._ElementResizer /> : null}
            </div>
        );
    };

    // only shows the text, all other style properties are held by upper level _ElementBodyRaw
    _ElementAreaRaw = ({ }: any): JSX.Element => {
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
                <this._ElementChannelGraph></this._ElementChannelGraph>
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

    _ElementLoadingDbd = () => {
        return <div style={{
            display: "inline-flex",
            width: "100%",
            height: "100%",
            justifyContent: "center",
            alignItems: "center",
        }}>
            <div>
                Channel Graph Loading ...
            </div>
        </div>
    }

    _ElementChannelGraph = () => {
        const elementRef = React.useRef<any>(null);
        const [showConfigPage, setShowConfigPage] = React.useState(false);
        this.setShowConfigPage = setShowConfigPage;
        // const rawChannelName = this.getChannelNames()[0];
        // const [channelName, setChannelName] = React.useState(rawChannelName === undefined? "": rawChannelName);
        const [channelName, setChannelName] = React.useState("");

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
                            this.handleClickNode(params);
                        };
                        this.networkDoubleClickCallback = (params: any) => {
                            this.handleDoubleClickNode(params);
                        };
                        // this.network will not be changed in future
                        this.network.on('click', this.networkClickCallback);
                        this.network.on("doubleClick", this.networkDoubleClickCallback);
                        if (this.getChannelNames().length > 0 && this.getChannelNames()[0].trim() !== "") {
                            this.expandNode(this.getChannelNames()[0]);
                            setChannelName(this.getChannelNames()[0]);
                        }
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
                    <div style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        width: "100%",
                        marginBottom: 15,
                    }}>
                        <div style={{
                            fontSize: 25,
                            fontWeight: "bold",
                        }}>
                            Channel Graph for&nbsp;
                        </div>
                        <this._ElementChannelInput channelName={channelName} setChannelName={setChannelName}></this._ElementChannelInput>
                    </div>
                </div>
                {showConfigPage === true ?
                    <this._ElementConfigPage setShowConfigPage={setShowConfigPage}></this._ElementConfigPage>
                    : null
                }
                {g_widgets1.isEditing() ? <this._ElementMask></this._ElementMask> : null}


            </div>
        );
    };

    _ElementConfigPage = ({ setShowConfigPage }: any) => {
        const [, forceUpdate] = React.useState({});
        this.forceUpdateConfigPage = () => { forceUpdate({}) };

        return (
            <div style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: "100%",
                height: "100%",
                border: "solid 0px black",
                boxSizing: "border-box",
                backgroundColor: "white",
            }}>
                <div style={{
                    display: "inline-flex",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    flexDirection: "column",
                    width: "100%",
                    height: "100%",
                }}>
                    <div style={{
                        display: "inline-flex",
                        flexDirection: "column",
                        width: "80%",
                        marginBottom: 20,
                    }}>
                        <h2>
                            EPICS database files
                        </h2>
                        <div>
                            <ElementRectangleButton
                                marginBottom={15}

                                handleClick={async () => {
                                    this.openDbFile();
                                }}
                            >
                                Open db file
                            </ElementRectangleButton>
                        </div>
                        {Object.keys(this.dbFiles).length === 0 ? "No db file opened." : null}
                        <table>
                            <col style={{ width: "80%" }}></col>
                            <col style={{ width: "15%" }}></col>
                            {Object.keys(this.dbFiles).map((dbFileName: string, index: number) => {
                                return (
                                    <tr key={`${dbFileName}-${index}`}
                                        style={{
                                            backgroundColor: index % 2 === 0 ? "rgba(210, 210, 210, 1)" : "white",
                                        }}
                                    >
                                        <td>
                                            {dbFileName}
                                        </td>
                                        <td>
                                            <img
                                                style={{
                                                    width: GlobalVariables.defaultFontSize * 0.8,
                                                    height: GlobalVariables.defaultFontSize * 0.8,
                                                    cursor: "pointer",
                                                }}
                                                src={`../../resources/webpages/delete-symbol.svg`}
                                                onClick={() => {
                                                    delete this.dbFiles[dbFileName];
                                                    forceUpdate({});
                                                }}
                                            >
                                            </img>
                                            &nbsp;
                                            <img
                                                style={{
                                                    width: GlobalVariables.defaultFontSize * 1,
                                                    height: GlobalVariables.defaultFontSize * 1,
                                                    cursor: "pointer",
                                                }}
                                                src={`../../resources/webpages/modify-symbol.svg`}
                                                onClick={() => {
                                                    const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
                                                    displayWindowClient.getIpcManager().sendFromRendererProcess("create-utility-display-window",
                                                        {
                                                            utilityType: "TextEditor",
                                                            utilityOptions: { fileName: dbFileName }
                                                        }
                                                    );
                                                }}
                                            >
                                            </img>
                                            &nbsp;
                                            <img
                                                style={{
                                                    width: GlobalVariables.defaultFontSize * 0.8,
                                                    height: GlobalVariables.defaultFontSize * 0.8,
                                                    cursor: "pointer",
                                                }}
                                                src={`../../resources/webpages/refresh-symbol.svg`}
                                                onClick={() => {
                                                    this.openDbFile(dbFileName);

                                                }}
                                            >
                                            </img>
                                        </td>
                                    </tr>
                                )
                            })}
                        </table>
                    </div>
                    <ElementRectangleButton
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

    /**
     * Bring up a prompt to open db file
     */
    openDbFile = (dbFileName: string | undefined = undefined) => {
        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
        // we are expecting to have a "db-file-contents" message from main process: {db: dbJson}
        displayWindowClient.getIpcManager().sendFromRendererProcess("open-tdl-file",
            {
                options: {
                    // tdl?: type_tdl;
                    // tdlStr?: string; // for web mode only, the web mode reads contents of the file (.tdl or .db), but it cannot parse the file contents in browser
                    tdlFileNames: dbFileName === undefined ? undefined : [dbFileName],
                    mode: "operating",
                    editable: false,
                    // external macros: user-provided and parent display macros
                    macros: [],
                    replaceMacros: false,
                    // currentTdlFolder?: string;
                    windowId: displayWindowClient.getWindowId(),
                    // postCommand?: string;
                    sendContentsToWindow: true, // whether to send the file contents back to the display window, for Channel Graph window
                }
            })
    }


    loadDbFile = (fileName: string, db: Record<string, any>[]) => {
        this.dbFiles[fileName] = db;
        this.forceUpdateConfigPage();
    }


    /**
     * (1) find the node that is being clicked
     * 
     * (2) find the channel name for this node
     * 
     */
    handleClickNode = async (params: any) => {
        // (1)
        const ids = params.nodes;
        const nodes = this.networkData["nodes"];
        const clickedNodes = nodes.get(ids);
        const clickedNode = clickedNodes[0];
        if (clickedNode !== undefined) {
            // (2)
            console.log("clicked node", clickedNode)
            const nodeLabel = clickedNode["label"];
            const channelName = nodeLabel.split("\n")[0].split(".")[0];
            const channelNameType = TcaChannel.checkChannelName(channelName);
            if (channelNameType !== "ca" && channelName !== "pva") {
                console.log("Channel", channelName, "is not a valid CA or PVA channel. Stop expanding.");
                return false;
            }

            // already expaned, or still in expansion
            if (this.getLinksStaticData()[channelName] !== undefined) {
                console.log("static link data for", channelName, "already exist")
                return false;
            }
            const success = await this.expandNode(nodeLabel);
            console.log("create node", success, nodeLabel)
        }
        return true;
    }

    /**
     * Open the Probe for this node
     */
    handleDoubleClickNode = async (params: any) => {
        // (1)
        const ids = params.nodes;
        const nodes = this.networkData["nodes"];
        const clickedNodes = nodes.get(ids);
        const clickedNode = clickedNodes[0];
        if (clickedNode !== undefined) {
            // (2)
            console.log("double clicked node", clickedNode)
            const nodeLabel = clickedNode["label"];
            const channelName = nodeLabel.split("\n")[0];

            if (TcaChannel.checkChannelName(channelName) === "ca" || TcaChannel.checkChannelName(channelName) === "pva") {
                // open Probe
                const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
                displayWindowClient.getIpcManager().sendFromRendererProcess("create-utility-display-window", 
                    {
                        utilityType: "Probe", 
                        utilityOptions: { channelNames: [channelName] }
                    }
                );

            }
        }
    }


    private _ElementChannelInput = ({ channelName, setChannelName }: any) => {
        const elementRef = React.useRef<any>(null);

        return (
            <form onSubmit={(event: any) => {
                event.preventDefault();
                this.expandNode(channelName);
            }}
                style={{
                    width: "100%",
                }}
            >
                <input
                    ref={elementRef}
                    style={{
                        fontSize: 25,
                        outline: "none",
                        backgroundColor: "rgba(0,0,0,0)",
                        border: "solid 0px black",
                        padding: 0,
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        width: "100%",
                        fontWeight: "bold",
                    }}
                    spellCheck={false}
                    value={channelName}
                    placeholder="channel name"
                    onChange={(event: any) => {
                        event.preventDefault();
                        setChannelName(event.target.value);
                    }}
                    onMouseEnter={(event: any) => {
                        event.preventDefault();
                        if (elementRef.current !== null) {
                            elementRef.current.style["color"] = "red";
                        }
                    }}
                    onMouseLeave={(event: any) => {
                        event.preventDefault();
                        if (elementRef.current !== null) {
                            if (document.activeElement !== elementRef.current) {
                                elementRef.current.style["color"] = "black";
                            }
                        }
                    }}
                    onFocus={(event: any) => {
                        event.preventDefault();
                        if (elementRef.current !== null) {
                            elementRef.current.style["color"] = "red";
                        }
                    }}
                    onBlur={(event: any) => {
                        event.preventDefault();
                        if (elementRef.current !== null) {
                            elementRef.current.style["color"] = "black";
                        }
                    }}
                >
                </input>
            </form>
        )
    }

    /**
     * (1) clear all nodes
     * 
     * (2) reset view port
     * 
     * (3) clear the internal data
     * 
     * (4) destroy all channels in this widget
     * 
     * (5) clear channel names, leaving the first channel, because other field channels were 
     *     added to channel names list
     * 
     * (6) process channel names
     */
    clearGraph = () => {
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
        const linksStaticData = this.getLinksStaticData();
        Object.keys(linksStaticData).forEach(key => delete linksStaticData[key]);

        // (4)
        for (let channelName of this.getChannelNames()) {
            try {
                const tcaChannel = g_widgets1.getTcaChannel(channelName);
                tcaChannel.destroy(this.getWidgetKey());
            } catch (e) {
            }
        }

        // (5)
        if (this.getChannelNamesLevel0().length > 0) {
            this.getChannelNamesLevel0().splice(1);
        }

        // (6)
        this.processChannelNames();
    }

    mapDbrDataWitNewData = (channelNames: string[]) => {
        const allNodes = this.networkData["nodes"];
        for (const node of allNodes.get()) {
            const label = node["label"];
            const nodeChannelName = label.split("\n")[0].split(".")[0]; // the node must use the base channel name
            if (channelNames.includes(nodeChannelName)) {
                try {
                    const tcaChannel = g_widgets1.getTcaChannel(nodeChannelName);
                    const dbrData = tcaChannel.getDbrData();
                    const value = dbrData["value"];
                    const currentPosition = this.network?.getPositions(node["id"])[node["id"]];
                    const severity = tcaChannel.getSeverity();
                    const severityStr = ChannelSeverity[severity];

                    allNodes.update(
                        {
                            ...node,
                            label: node["label"].split("\n")[0] + "\n" + node["label"].split("\n")[1] + `\n${value}`,
                            x: currentPosition?.x,
                            y: currentPosition?.y,
                            borderWidth: borderWidth,
                            borderWidthSelected: borderWidth,
                            color: {
                                // background: colors[severityStr as keyof typeof colors],
                                background: colors.background,
                                border: colors[severityStr as keyof typeof colors],
                                highlight: {
                                    background: colors.highlight,
                                    border: colors[severityStr as keyof typeof colors],
                                },

                            },
                        }
                    )
                } catch (e) {

                }
            }
        }
    }


    /**
     * channelName is a valid base channel name
     * 
     * This node already exists in the network, we are expanding it: find all the related channels
     * and create new nodes if necessary.
     */
    expandNode = async (nodeLabel: string): Promise<boolean> => {

        // the base channel name, could be "pv1", "@dev3 c3 s2", or "27"
        const channelName = nodeLabel.split("\n")[0].split(".")[0];
        // if the base channel name is not a valid CA or PVA channel, no need to expand, stop here
        const channelNameType = TcaChannel.checkChannelName(channelName);
        if (channelNameType !== "ca" && channelName !== "pva") {
            console.log("Channel", channelName, "is not a valid CA or PVA channel. Stop expanding.");
            return false;
        }

        // create the data for main node, the main node was a satellite node, it did not have
        // an entry in this this.linksStaticData
        const success = await this.createNode(channelName);
        if (success === false) {
            console.log("Cannot create data for", channelName);
            return false;
        } else {
            console.log("create node data:", this.getLinksStaticData())
        }
        const channelData = this.getLinksStaticData()[channelName];

        // find the existing node in this.networkData. 
        // If this node is already expanded, then return. If not continue.
        let mainNode: any = undefined;
        // let nodeObj: any = undefined;
        const allNodes = this.networkData["nodes"];
        const allEdges = this.networkData["edges"];

        for (const nodeTmp of allNodes.get()) {
            const label = nodeTmp.label;
            const baseChannelName = label.split("\n")[0].split(".")[0];
            if (baseChannelName === channelName) {
                mainNode = nodeTmp;
                break;
            }
        }

        console.log("vis-network node", channelName, "does not exist, create a new one");
        const source = channelData["source"];
        const rtyp = channelData["rtyp"];
        const scan = channelData["scan"];
        const calc = channelData["calc"];
        if (mainNode === undefined) {
            // create one
            this.currentId = this.currentId + 1;
            if (rtyp === undefined || rtyp === "") { // scan or calc can be empty
                console.log("There is no rtyp for", nodeLabel);
                return false;
            }
            const calcLabel = rtyp.includes("calc") ? ` (${calc})` : "";
            mainNode = {
                id: this.currentId,
                label: `${channelName}\n(${rtyp}) (${scan})${calcLabel}`,
                shape: "box",
                physics: false,
                color: {
                    background: source === "IOC" ? colors.background : colors.dbfilenode,
                    highlight: colors.highlight,
                }
            };
            allNodes.add(mainNode)
        } else {
            console.log("vis-network node", channelName, "already exists, update it");
            const calcLabel = rtyp.includes("calc") ? ` (${calc})` : "";

            // update the node's label and shape
            // Assuming you have a nodes DataSet
            mainNode = {
                id: mainNode.id,
                // label: `${channelName}\n(${rtyp}) (${scan}) (${calc})`,
                // label: mainNode.label + `\n (${rtyp})` + ` (${scan})` + ` (${calc})`,
                label: `${mainNode.label}\n(${rtyp}) (${scan})${calcLabel}`,
                shape: "box",
                physics: mainNode.physics,
                borderWidth: borderWidth * 0,
                borderWidthSelected: borderWidth * 0,
                color: {
                    background: source === "IOC" ? colors.background : colors.dbfilenode,
                    // border: source === "IOC" ? colors.background : colors.dbfilenode,
                    highlight: {
                        background: colors.highlight,
                        // border: colors.highlight,
                    },
                }
            };
            allNodes.update(mainNode);
        }


        // iterate over all fields of the new data, create new nodes if necessary (these nodes should be unexpanded)
        // establish edges for each link
        // iterate over 3 linkTypes: inLinks, outLinks, and fwdLinks
        for (const [linkType, links] of Object.entries(channelData)) { // [inLinks | outLinks | fwdLinks, {INPA:..., INPB: ...}]
            const edgeColors: Record<string, any> = {
                // inLinks: { color: "purple", highlight: "#ff0000", hover: "purple" },
                // outLinks: { color: "#005f79", highlight: "#ff0000", hover: "#005f79" },
                // fwdLinks: { color: "blue", highlight: "#ff0000", hover: "blue" },
                inLinks: { color: colors.inlink, highlight: colors.highlight, },
                outLinks: { color: colors.outlink, highlight: colors.highlight, },
                fwdLinks: { color: colors.fwdlink, highlight: colors.highlight, },
            }

            // make sure we are iterating inLinks, outLinks and fwdLinks
            if (linkType === "rtyp" || linkType === "scan" || linkType === "calc" || linkType === "status" || linkType === "source") {
                continue;
            }
            if (typeof links === "string" || typeof links !== "object") {
                continue;
            }

            for (let linkFieldName of Object.keys(links)) { // INP, INPA, FLNK, OUT, ...

                const linkFieldValue = links[linkFieldName]; // "pv1.VAL3 NPP MS", "1", "@dev3 c5 s7", or undefined
                // console.log("linkFieldName, linkfieldValue", linkFieldName, linkFieldValue)
                if (linkFieldValue === "" || linkFieldValue === undefined) {
                    continue;
                }
                let linkFieldTargetChannelBaseName = linkFieldValue.split(" ")[0].split(".")[0]; // "pv1", "1", or "@dev3"

                // link field target channel name must be a valid CA or PVA base name
                const linkFieldTargetChannelBaseNameType = TcaChannel.checkChannelName(linkFieldTargetChannelBaseName);
                // if the base name of the link target is not a CA or PVA channel name, this link may be 
                // a device address
                if (linkFieldTargetChannelBaseNameType !== "pva" && linkFieldTargetChannelBaseNameType !== "ca") {
                    // "@dev3 c5 s7"
                    linkFieldTargetChannelBaseName = linkFieldValue;
                }

                // update the node if it already exists
                let linkFieldTargetChannelNode: any = undefined;

                for (const nodeTmp of allNodes.get()) {
                    const label = nodeTmp.label; // may be like "pv1\n(ai)", we only compare "pv1"
                    if (label.split("\n")[0] === linkFieldTargetChannelBaseName) {
                        linkFieldTargetChannelNode = nodeTmp;
                        break;
                    }
                }

                // insert a new node if it does not exist
                if (linkFieldTargetChannelNode === undefined && this.network !== undefined) {
                    this.currentId = this.currentId + 1;
                    const viewPosition = this.network.getViewPosition();   // Current center in canvas coordinates
                    const x = viewPosition.x;
                    const y = viewPosition.y;

                    linkFieldTargetChannelNode = {
                        id: this.currentId,
                        label: linkFieldTargetChannelBaseName,
                        shape: "big ellipse",
                        physics: false,
                        x: x + 100 * (Math.random() - 0.5),
                        y: y + 100 * (Math.random() - 0.5),
                        // no border needed
                        color: {
                            background: source === "IOC" ? colors.background : colors.dbfilenode,
                            highlight: colors.highlight,
                        }
                    };
                    // console.log("insert satellite node", linkFieldTargetChannelBaseName)
                    allNodes.add(linkFieldTargetChannelNode)
                }

                // create the edge between the main node and satellite node, this edge is always new
                // labe is like "INPA: .VAL3 NPP NMS"
                let targetName = linkFieldValue;
                if (linkFieldTargetChannelBaseNameType === "pva" || linkFieldTargetChannelBaseNameType === "ca") {
                    // "pv1.VAL3 NPP NMS" -> ".VAL3 NPP NMS", or "pv1 NPP NMS" -> " NPP NMS"
                    targetName = targetName.replace(linkFieldTargetChannelBaseName, "");
                    if (!targetName.startsWith(".")) { // " NPP NMS" -> ".VAL NPP NMS"
                        targetName = ".VAL" + targetName;
                    }
                }
                // "OUTA: .VAL NPP NMS", or "INP: @dev3 c5 s7"
                const edgeLabel = `${linkFieldName}: ${targetName}`
                // create edge for each link
                const from = linkType === "inLinks" ? linkFieldTargetChannelNode.id : mainNode.id;
                const to = linkType === "inLinks" ? mainNode.id : linkFieldTargetChannelNode.id;
                // console.log("new edge:", "from = ", from, "to = ", to, "label = ", edgeLabel, "with color", edgeColors[linkType])
                allEdges.add({
                    from: from,
                    to: to,
                    label: edgeLabel,
                    color: edgeColors[linkType],
                    arrows: { to: { enabled: true, scaleFactor: 0.5 } },
                })
            }
        }
        g_widgets1.connectAllTcaChannels(true);
        return true;
    }


    /**
     * Get this channel's all IN_LINK/OUT_LINK/FWD_LINK fields' value, add the data structure
     * to this.linksStaticData
     * 
     * @param {string} newChannelName must be a channel name that does not contain fields
     * 
     * It modifies this.linksStaticData
     * 
     * (0) assign an empty linksStaticData to this.linksStaticData, in this way
     *     we can avoid duplicate creation of the node (e.g. in double click), and no matter if the creation
     *     success or not, we always have an entry
     * (1) determine if the channel is in db file
     * (2) get this channel's RTYP
     * (3) append new channel name to this._channelNamesLevel0 if this channel source is IOC
     *     the channels will be connected at the end of expandNode()
     * (4) get this new channel's IN_LINK, OUT_LINK and FWD_LINK values (they are channel names)
     * (5) monitor all channels for the link target channels
     */
    createNode = async (newChannelName: string): Promise<boolean> => {
        // this node already exists
        if (this.getLinksStaticData()[newChannelName] !== undefined) {
            console.log("channel already exist, quit")
            return false;
        }


        // new channel name must be a valid CA or PVA base name
        const newChannelNameType = TcaChannel.checkChannelName(newChannelName);
        if (newChannelNameType !== "pva" && newChannelNameType !== "ca") {
            console.log(newChannelName, "is not a valid channel name")
            return false;
        }
        if (!isNaN(parseInt(newChannelName))) {
            console.log(newChannelName, "is not a valid channel name")
            return false;
        }
        if (newChannelName.includes(".")) {
            console.log(newChannelName, "is not a valid channel name")
            return false;
        }

        // (0)
        const linksStaticData: {
            inLinks: Record<string, string | undefined>,
            outLinks: Record<string, string | undefined>,
            fwdLinks: Record<string, string | undefined>,
            status: type_nodeStatus,
            rtyp: string,
            scan: string,
            calc: string,
            source: string,
        } = {
            inLinks: {},
            outLinks: {},
            fwdLinks: {},
            status: type_nodeStatus.not_expanded,
            rtyp: "",
            scan: "",
            calc: "",
            source: "",
        };
        this.getLinksStaticData()[newChannelName] = linksStaticData;

        // (1)
        // if channel is coming from db file, channelJson is an object        
        let channelJson: Record<string, any> | undefined = undefined;
        for (const [dbFileName, dbFileContents] of Object.entries(this.dbFiles)) {
            if (channelJson !== undefined) {
                break;
            }
            for (const recordJson of dbFileContents) {
                const channelName = recordJson["NAME"];
                if (newChannelName === channelName) {
                    channelJson = recordJson;
                    break;
                }
            }
        }

        // (2)
        let rtyp: string | number | string[] | number[] | undefined = "";
        let scan: string | number | string[] | number[] | undefined = "";
        let calc: string | number | string[] | number[] | undefined = "";
        if (channelJson !== undefined) {
            rtyp = channelJson["RTYP"]; // channel is coming from db file
            scan = channelJson["SCAN"] === undefined ? "Passive" : channelJson["SCAN"];
            calc = channelJson["CALC"] === undefined ? "" : channelJson["CALC"];
        } else {
            const rtypPromise = this.getFieldValue(newChannelName, "RTYP", 10); // 10 second timeout, channel is coming from IOC
            const scanPromise = this.getFieldValue(newChannelName, "SCAN", 10); // 10 second timeout, channel is coming from IOC
            const calcPromise = this.getFieldValue(newChannelName, "CALC", 1); // 1 second timeout, channel is coming from IOC
            const metaPromises = Promise.all([rtypPromise, scanPromise, calcPromise]);
            const meta = await metaPromises;
            rtyp = meta[0];
            if (typeof meta[1] === "number") {
                scan = menuScan[meta[1]];
            } else {
                scan = meta[1];
            }

            calc = meta[2];
        }


        if (typeof rtyp !== "string") {
            console.log("RTYP of", newChannelName, "is", rtyp, "quit...")
            delete this.getLinksStaticData()[newChannelName];
            return false;
        }

        if (typeof calc !== "string") {
            calc = "";
        }

        if (typeof scan !== "string") {
            scan = "Passive";
        }

        linksStaticData["rtyp"] = rtyp;
        linksStaticData["scan"] = scan;
        linksStaticData["calc"] = calc;
        linksStaticData["source"] = channelJson === undefined ? "IOC" : "dbFile";

        // (3)
        if (channelJson === undefined) {
            this.getChannelNamesLevel0().push(newChannelName);
            this.processChannelNames();
            console.log("this.getChannelNamesLevel0 = ", this.getChannelNamesLevel0())
        }


        // (4)
        const dbdFiles = this.getDbdFiles();
        const inLinkFieldNames = dbdFiles.getRecordTypeInLinkFieldNames(rtyp);
        const outLinkFieldNames = dbdFiles.getRecordTypeOutLinkFieldNames(rtyp);
        const fwdLinkFieldNames = dbdFiles.getRecordTypeFwdLinkFieldNames(rtyp);
        for (const linkFieldName of inLinkFieldNames) {
            linksStaticData.inLinks[linkFieldName] = undefined;
        }
        for (const linkFieldName of outLinkFieldNames) {
            linksStaticData.outLinks[linkFieldName] = undefined;
        }
        for (const linkFieldName of fwdLinkFieldNames) {
            linksStaticData.fwdLinks[linkFieldName] = undefined;
        }


        console.log("----------- step 1-----------------")
        const fieldValuesePromises: Promise<boolean>[] = [];
        const tcaChannels: TcaChannel[] = [];
        for (const [dataFieldName, links] of Object.entries(linksStaticData)) { // inLink, outLink, fwdLink

            // make sure we are iterating inLinks, outLinks and fwdLinks
            if (dataFieldName === "rtyp" || dataFieldName === "calc" || dataFieldName === "scan" || dataFieldName === "status" || dataFieldName === "source") {
                continue;
            }
            if (typeof links === "string" || typeof links !== "object") {
                continue;
            }

            for (const linkFieldName of Object.keys(links)) { // INP, INPA, OUT, FLNK, ...
                if (channelJson !== undefined) {
                    // channel is from db file
                    const linkFieldValue = channelJson[linkFieldName];
                    if (linkFieldValue !== undefined) {
                        links[linkFieldName] = linkFieldValue;
                    }
                } else {
                    const fieldFullName = `${newChannelName}.${linkFieldName}`;
                    try {
                        const fieldTcaChannel = g_widgets1.getTcaChannel(fieldFullName);
                        tcaChannels.push(fieldTcaChannel);
                        // trigger the data so that the
                        // await fieldTcaChannel.getMeta(this.getWidgetKey());
                        const promise = fieldTcaChannel.get(this.getWidgetKey(), 10, undefined, false).then((dbrData: any) => {
                            const value = dbrData["value"];
                            if (typeof value === "string") {
                                links[linkFieldName] = value;
                                return true;
                            } else {
                                links[linkFieldName] = undefined;
                                return false;
                            }
                            // fieldTcaChannel.monitor();
                        });
                        fieldValuesePromises.push(promise);
                    } catch (e) {
                        const fieldTcaChannel = g_widgets1.createTcaChannel(fieldFullName, this.getWidgetKey());
                        if (fieldTcaChannel !== undefined) {
                            tcaChannels.push(fieldTcaChannel);
                            // await fieldTcaChannel.getMeta(this.getWidgetKey());
                            const promise = fieldTcaChannel.get(this.getWidgetKey(), 10, undefined, false).then((dbrData: any) => {
                                const value = dbrData["value"];
                                if (typeof value === "string") {
                                    links[linkFieldName] = value;
                                    return true;
                                } else {
                                    links[linkFieldName] = undefined;
                                    return false
                                }
                                // fieldTcaChannel.monitor();
                            })
                            fieldValuesePromises.push(promise);
                        }
                    }
                }
            }
        }

        const fieldValueResultsOk = await Promise.all(fieldValuesePromises);

        for (const tcaChannel of tcaChannels) {
            tcaChannel.destroy(this.getWidgetKey());
        }

        for (let result of fieldValueResultsOk) {
            if (result === true) {

            }
        }

        linksStaticData["status"] = type_nodeStatus.expaneded;

        console.log(this.getLinksStaticData())
        console.log("----------- step 2 -----------------")
        return true;
    };

    linksStaticData: Record<string, // channel name
        {
            inLinks: Record<string, string | undefined>, // link field name vs link value (another channel name)
            outLinks: Record<string, string | undefined>,
            fwdLinks: Record<string, string | undefined>,
            rtyp: string,
            status: type_nodeStatus,
            source: string,
        } & Record<string, any>
    > = {};

    getLinksStaticData = () => {
        return this.linksStaticData;
    }


    getFieldValue = async (channelName: string, fieldType: "RTYP" | "SCAN" | "CALC", timeout: number) => {
        console.log("getting field", fieldType, "of", channelName)
        // if (this.rtyp !== "" || this.rtyp === this.rtypWaitingName) {
        //     console.log("RTYP already obtained or waiting");
        //     return;
        // }

        const fieldChannelName = `${channelName}.${fieldType}`;
        let fieldTcaChannel: TcaChannel | undefined = undefined;
        try {
            fieldTcaChannel = g_widgets1.getTcaChannel(fieldChannelName);
        } catch (e) {
            fieldTcaChannel = g_widgets1.createTcaChannel(fieldChannelName, this.getWidgetKey());
        }
        if (fieldTcaChannel !== undefined) {
            // await fieldTcaChannel.getMeta(this.getWidgetKey());
            const dbrData = await fieldTcaChannel.get(this.getWidgetKey(), timeout, undefined, false);

            fieldTcaChannel.destroy(this.getWidgetKey());
            if ((dbrData !== undefined) && dbrData["value"] !== undefined) {
                const fieldValue = dbrData["value"];
                console.log(fieldChannelName, "value is", fieldValue)
                return fieldValue;
                // if (rtyp !== undefined && this.rtyp === this.rtypWaitingName) {
                //     this.rtyp = `${rtyp}`;
                //     this.connectFieldChannels();
                //     return;
                // }
            } else {
                console.log("Failed to get value for", `${fieldChannelName}`);
                // GET timeout, reconnect
                // this.rtyp = "";
                // this.mapDbrData();
            }
        } else {
            console.log("Channel", `${fieldChannelName} does not exist`);
        }
        return undefined;
    }

    processDbd = (result: {
        menus: Record<string, any>,
        recordTypes: Record<string, any>,
    }) => {
        this._dbdFiles = new DbdFiles(result["recordTypes"], result["menus"]);

        if (g_widgets1.isEditing()) {
            return;
        } else {
            if (this.getChannelNames().length > 0 && this.getChannelNames()[0].trim() !== "") {
                this.expandNode(this.getChannelNames()[0]);
                this.forceUpdate();
            }
        }
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
    // _showSidebar()
    // _showResizers()
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

    getDbdFiles = () => {
        return this._dbdFiles;
    }


    // ----------------------- styles -----------------------

    // defined in super class
    // _resizerStyle
    // _resizerStyles
    // StyledToolTipText
    // StyledToolTip

    // -------------------------- tdl -------------------------------

    // properties when we create a new TextUpdate
    // the level 1 properties all have corresponding public or private variable in the widget

    static _defaultTdl: type_ChannelGraph_tdl = {
        type: "ChannelGraph",
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
        },
        channelNames: [],
        groupNames: [],
        rules: [],
        recordTypes: {},
        menus: {},

    };

    // not getDefaultTdl(), always generate a new key
    static generateDefaultTdl = (type: string) => {
        // defines type, widgetKey, and key
        const result = super.generateDefaultTdl(type) as type_ChannelGraph_tdl;
        result.style = JSON.parse(JSON.stringify(this._defaultTdl.style));
        result.text = JSON.parse(JSON.stringify(this._defaultTdl.text));
        result.channelNames = JSON.parse(JSON.stringify(this._defaultTdl.channelNames));
        result.groupNames = JSON.parse(JSON.stringify(this._defaultTdl.groupNames));
        // result.recordTypesFieldNames = JSON.parse(JSON.stringify(this._defaultTdl.recordTypesFieldNames));
        // result.recordTypesMenus = JSON.parse(JSON.stringify(this._defaultTdl.recordTypesMenus));
        result.recordTypes = JSON.parse(JSON.stringify(this._defaultTdl.recordTypes));
        result.menus = JSON.parse(JSON.stringify(this._defaultTdl.menus));
        console.log("generate default tdl", result)
        return result;
    };


    // static method for generating a widget tdl with external PV name
    static generateWidgetTdl = (utilityOptions: Record<string, any>): type_ChannelGraph_tdl => {
        const result = this.generateDefaultTdl("ChannelGraph");
        result.channelNames = utilityOptions.channelNames as string[];
        result.recordTypes = utilityOptions.recordTypes as Record<string, any>;
        result.menus = utilityOptions.menus as Record<string, any>;
        return result;
    };

    // // static method for generating a widget tdl with external PV name
    // static generateWidgetTdl = (utilityOptions: Record<string, any>): type_ChannelGraph_tdl => {
    //     // utilityOptions = {} for it
    //     const result = this.generateDefaultTdl("ChannelGraph");
    //     // result.text["externalMacros"] = utilityOptions["externalMacros"];
    //     // result.text["tdlFileName"] = utilityOptions["tdlFileName"];
    //     return result as type_ChannelGraph_tdl;
    // };

    // defined in super class
    getTdlCopy(newKey: boolean = true) {
        const result = super.getTdlCopy(newKey);
        if (this.getChannelNamesLevel0().length > 0) {
            result.channelNames = [this.getChannelNamesLevel0()[0]];
        } else {
            result.channelNames = [];
        }

        result.recordTypes = {};
        result.menus = {};
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
            this._sidebar = new ChannelGraphSidebar(this);
        }
    }

    jobsAsEditingModeBegins(): void {
        super.jobsAsEditingModeBegins();
        this.clearGraph();
    }

    jobsAsOperatingModeBegins() {
        super.jobsAsEditingModeBegins();
        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
        const dbdAssigned = Object.keys(this.getDbdFiles().getRecordTypes()).length > 0;
        const isUtilityWindow = displayWindowClient.getIsUtilityWindow();


        if (isUtilityWindow) {
        } else {
            if (dbdAssigned) {
                // switch from editing mode to operating mode, with the DBD files already loaded
                // only need to expand node
                if (this.getChannelNames().length > 0 && this.getChannelNames()[0].trim() !== "") {
                    this.expandNode(this.getChannelNames()[0]).then(() => {
                        this.forceUpdate();
                    })
                }
            } else {
                const ipcManager = displayWindowClient.getIpcManager();
                // the reply will be handled by this.processDbd()
                ipcManager.sendFromRendererProcess("request-epics-dbd", {
                    displayWindowId: displayWindowClient.getWindowId(),
                    widgetKey: this.getWidgetKey(),
                })
            }
        }
    }
}
