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
import { SeqGraphSidebar } from "./SeqGraphSidebar";
import { Condition, SeqProgram, SeqState, SeqStateSet } from "./SeqProgram";
import { ElementMacrosTable } from "../../helperWidgets/SharedElements/MacrosTable";


enum type_channelSource {
    dbFile,
    ioc,
};



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
    currentState = "rgba(0, 255, 0, 1)",
}


export class SeqGraph extends BaseWidget {
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
    // _dbdFiles: DbdFiles;

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

    _seqProgram: SeqProgram;

    _macros: [string, string][] = [];



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
        console.log("channel graph widget tdl", widgetTdl)
        super(widgetTdl);
        // this.setReadWriteType("read");

        this.setStyle({ ...SeqGraph._defaultTdl.style, ...widgetTdl.style });
        this.setText({ ...SeqGraph._defaultTdl.text, ...widgetTdl.text });
        this._seqProgram = new SeqProgram("Seq Program", this);
        this.setMacros(widgetTdl.macros);
        // this._dbdFiles = new DbdFiles(JSON.parse(JSON.stringify(widgetTdl.recordTypes)), JSON.parse(JSON.stringify(widgetTdl.menus)));

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

        this._sidebar = new SeqGraphSidebar(this);
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
                        console.log("re-render +++++++++++++++++++++++")

                        this.network = new Network(elementRef.current, this.networkData, this.networkOptions);
                        // this.networkClickCallback = (params: any) => {
                        //     this.handleClickNode(params);
                        // };
                        // this.networkDoubleClickCallback = (params: any) => {
                        //     this.handleDoubleClickNode(params);
                        // };
                        // // this.network will not be changed in future
                        // this.network.on('click', this.networkClickCallback);
                        // this.network.on("doubleClick", this.networkDoubleClickCallback);
                        // if (this.getChannelNames().length > 0 && this.getChannelNames()[0].trim() !== "") {
                        //     // this.expandNode(this.getChannelNames()[0]);
                        //     setChannelName(this.getChannelNames()[0]);
                        // }
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
        const [seqContent, setSeqContent] = React.useState(this.getText()["seqContent"]);
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
                        <h2>
                            Sequencer
                        </h2>
                        <textarea style={{
                            padding: 10,
                            fontFamily: "monospace",
                            fontSize: GlobalVariables.defaultFontSize,
                            height: "100%",
                            lineHeight: 1.5,
                            outline: "none",
                            border: "solid 1px rgba(150, 150, 150, 1)",
                            resize: "none",
                        }}
                            value={seqContent}
                            spellCheck={false}
                            onChange={(event: any) => {
                                setSeqContent(event.target.value);
                                this.getText()["seqContent"] = event.target.value;
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
                Seq Graph for {this.getSeqProgram().getName()}

                <img
                    style={{
                        width: 35,
                        height: 35,
                        outline: "2px solid rgba(0,0,0,0)",
                        marginLeft: 50,
                    }}
                    ref={elementSettingsRef}
                    onMouseEnter={() => {
                        if (elementSettingsRef.current !== null) {
                            elementSettingsRef.current.style["outline"] = "2px solid rgba(190,190,190,1)"
                        }
                    }}
                    onMouseLeave={() => {
                        if (elementSettingsRef.current !== null) {
                            elementSettingsRef.current.style["outline"] = "2px solid rgba(190,190,190,0)"
                        }
                    }}
                    onClick={() => {
                        this.setShowConfigPage(true);
                    }}
                    src={"../../resources/webpages/settings.svg"}
                ></img>


                <ElementRectangleButton
                    handleClick={
                        () => {
                            this.clearSeqProgram();
                            this.buildSeqProgram();
                        }
                    }
                    marginLeft={10}
                >
                    Reset Program

                </ElementRectangleButton>

                <img
                    style={{
                        width: 35,
                        height: 35,
                        outline: "2px solid rgba(0,0,0,0)",
                        marginLeft: 10,
                    }}
                    ref={elementRef}
                    onMouseEnter={() => {
                        if (elementRef.current !== null) {
                            elementRef.current.style["outline"] = "2px solid rgba(190,190,190,1)"
                        }
                    }}
                    onMouseLeave={() => {
                        if (elementRef.current !== null) {
                            elementRef.current.style["outline"] = "2px solid rgba(190,190,190,0)"
                        }
                    }}
                    onClick={() => {
                        if (this.getSeqProgram().getStatus() === "running") {
                            console.log("stop the program")
                            this.getSeqProgram().stop();
                        } else {
                            console.log("start the program")
                            this.getSeqProgram().start();
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
                                        }
                                    })
                                }
                            }
                        }

                        forceUpdate({});
                    }}
                    src={this.getSeqProgram().getStatus() === "running" ?
                        "../../resources/webpages/pause.svg"
                        :
                        "../../resources/webpages/play.svg"}
                ></img>
            </div>
        )
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

            // const success = await this.expandNode(nodeLabel);
            // console.log("create node", success, nodeLabel)
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
                displayWindowClient.getIpcManager().sendFromRendererProcess("create-utility-display-window", "Probe", { channelNames: [channelName] });

            }
        }
    }


    mapDbrDataWitNewData = (channelNames: string[]) => {
        const allNodes = this.networkData["nodes"];
        const allEdges = this.networkData["edges"];
        // update the node color
        for (const seqSet of this.getSeqProgram().getStateSets()) {
            const currentState = seqSet.getCurrentState();
            if (currentState !== undefined) {
                allNodes.update({
                    id: currentState.getId(),
                    color: {
                        background: colors["background"],
                    }
                })
            }
        }

        // update edge color
        for (const seqSet of this.getSeqProgram().getStateSets()) {
            const prevCond = seqSet.getPreviousCondition();
            if (prevCond !== undefined) {
                allEdges.update({
                    id: prevCond.getId(),
                    color: {
                        // background: colors["background"],
                    }
                })
            }
        }

        // change current state and previous condition
        this.getSeqProgram().checkCurrentStates();

        // update the node color
        for (const seqSet of this.getSeqProgram().getStateSets()) {
            const currentState = seqSet.getCurrentState();
            if (currentState !== undefined) {
                allNodes.update({
                    id: currentState.getId(),
                    color: {
                        background: colors["currentState"],
                    }
                })
            }
        }

        // update edge color
        for (const seqSet of this.getSeqProgram().getStateSets()) {
            const prevCond = seqSet.getPreviousCondition();
            if (prevCond !== undefined) {
                allEdges.update({
                    id: prevCond.getId(),
                    color: {
                        color: colors["currentState"],
                    }
                })
            }
        }
    }




    /**
     * Build the seq program based on the .st file 
     * 
     * (1) add all state sets to this._seqProgram in a top-down fashion
     * 
     * (2) add channels to BaseWidget._channelNamesLevel0
     */
    buildSeqProgram = () => {

        // (1)
        const prog = this.getSeqProgram();
        prog.setName("Light House")

        const stateSet = new SeqStateSet(prog, "volt_check");
        prog.addStateSet(stateSet);

        let state_light_off = new SeqState(stateSet, "light_off",
            () => { }, // entry function
            () => { }, // exit function
        );
        let state_light_on = new SeqState(stateSet, "light_on",
            () => { }, // entry function
            () => { }, // exit function
        );
        stateSet.addState(state_light_off);
        stateSet.addState(state_light_on);


        state_light_off.addCondition(new Condition(state_light_on,
            () => {
                return prog.compareChannelNum("Input_voltage", ">", 5.0);
            }
            ,
            () => {
                prog.putChannel("Indicator_light", 1);
            },
            "Input_voltage > 5.0",
            `prog.putChannel("Indicator_light", 1)`
        ))

        state_light_off.addCondition(new Condition(state_light_on,
            () => {
                return prog.compareChannelNum("Input_voltage", ">", 5.0);
            }
            ,
            () => {
                prog.putChannel("Indicator_light", 1);
            },
            "Input_voltage < 1.0",
            `prog.putChannel("Indicator_light", 1)`
        ))

        state_light_on.addCondition(new Condition(state_light_off,
            () => {
                return prog.compareChannelNum("Input_voltage", "<", 5.0);
            },
            () => {
                prog.putChannel("Indicator_light", 0);
            },
            "Input_voltage < 5.0",
            `prog.putChannel("Indicator_light", 0);`,
        ))

        // (2)
        this.getChannelNamesLevel0().push("Input_voltage");
        this.getChannelNamesLevel0().push("Indicator_light");

        // prog.start()

        // (3) prepare the dataset

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
                    // x: x + 100 * (Math.random() - 0.5),
                    // y: y + 100 * (Math.random() - 0.5),
                    // no border needed
                    color: {
                        // background: source === "IOC" ? colors.background : colors.dbfilenode,
                        highlight: colors.highlight,

                    }
                };
                allNodes.add(stateNode)
            }
        }

        // add edges
        for (const stateSet of prog.getStateSets()) {
            for (const state of stateSet.getStates()) {
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

                    allEdges.add({
                        id: condition.getId(),
                        from: from,
                        to: to,
                        label: booleanFuncText,
                        // color: edgeColors[linkType],
                        arrows: { to: { enabled: true, scaleFactor: 0.5 } },
                    })

                }
            }
        }
    }

    startSeqProgram = () => {
        console.log("Start Seq program")
        this.getSeqProgram().start();
    }

    stopSeqProgram = () => {
        console.log("Stop Seq program")
        this.getSeqProgram().stop();
    }




    /**
     * (1) clear all nodes
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
        if (this.getChannelNamesLevel0().length > 0) {
            this.getChannelNamesLevel0().splice(1);
        }

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

    // ----------------------- styles -----------------------

    // defined in super class
    // _resizerStyle
    // _resizerStyles
    // StyledToolTipText
    // StyledToolTip

    // -------------------------- tdl -------------------------------

    // properties when we create a new TextUpdate
    // the level 1 properties all have corresponding public or private variable in the widget

    static _defaultTdl: type_SeqGraph_tdl = {
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

    // not getDefaultTdl(), always generate a new key
    static generateDefaultTdl = (type: string) => {
        // defines type, widgetKey, and key
        const result = super.generateDefaultTdl(type) as type_SeqGraph_tdl;
        result.style = JSON.parse(JSON.stringify(this._defaultTdl.style));
        result.text = JSON.parse(JSON.stringify(this._defaultTdl.text));
        result.channelNames = JSON.parse(JSON.stringify(this._defaultTdl.channelNames));
        result.groupNames = JSON.parse(JSON.stringify(this._defaultTdl.groupNames));
        result.macros = JSON.parse(JSON.stringify(this._defaultTdl.macros));
        // result.recordTypesFieldNames = JSON.parse(JSON.stringify(this._defaultTdl.recordTypesFieldNames));
        // result.recordTypesMenus = JSON.parse(JSON.stringify(this._defaultTdl.recordTypesMenus));
        // result.recordTypes = JSON.parse(JSON.stringify(this._defaultTdl.recordTypes));
        // result.menus = JSON.parse(JSON.stringify(this._defaultTdl.menus));
        // console.log("generate default tdl", result)
        return result;
    };


    // static method for generating a widget tdl with external PV name
    static generateWidgetTdl = (utilityOptions: Record<string, any>): type_SeqGraph_tdl => {
        const result = this.generateDefaultTdl("SeqGraph");
        // result.channelNames = utilityOptions.channelNames as string[];
        // result.recordTypes = utilityOptions.recordTypes as Record<string, any>;
        // result.menus = utilityOptions.menus as Record<string, any>;
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
        this.buildSeqProgram();
        super.jobsAsEditingModeBegins();
    }
}
