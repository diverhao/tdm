import * as React from "react";
import { MouseEvent } from "react";
import { GlobalVariables, g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { GroupSelection2 } from "../../helperWidgets/GroupSelection/GroupSelection2";
import { ChannelGraphSidebar } from "./ChannelGraphSidebar";
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
import { TcaChannel } from "../../channel/TcaChannel";
import { Log } from "../../../mainProcess/log/Log";
import { DbdFiles } from "../../channel/DbdFiles";




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
    rtyp: string = "";
    readonly rtypWaitingName: string = uuidv4();
    _dbdFiles: DbdFiles;


    constructor(widgetTdl: type_ChannelGraph_tdl) {
        super(widgetTdl);
        // this.setReadWriteType("read");

        this.setStyle({ ...ChannelGraph._defaultTdl.style, ...widgetTdl.style });
        this.setText({ ...ChannelGraph._defaultTdl.text, ...widgetTdl.text });

        this._dbdFiles = new DbdFiles(JSON.parse(JSON.stringify(widgetTdl.recordTypes)), JSON.parse(JSON.stringify(widgetTdl.menus)));
        console.log("---------------------------", this._dbdFiles)
        // const css = document.createElement('link');
        // css.rel = 'stylesheet';
        // css.href = '../../../webpack/resources/css/prism.css'; // Make sure the path is correct relative to your HTML file
        // document.head.appendChild(css);
        // const js = document.createElement('script');
        // js.src = '../../../webpack/resources/js/vis-network.min.js';
        // js.type = 'text/javascript';
        // document.head.appendChild(js);

        // this._rules = new TextUpdateRules(this, widgetTdl);

        // this._sidebar = new ChannelGraphSidebar(this);
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
                    {
                        // skip _ElementBody in operating mode
                        // the re-render efficiency can be improved by 10% by doing this
                        // this technique is used on a few most re-rendered widgets, like TextUpdate and TextEntry
                        g_widgets1.isEditing()
                            ?
                            <>
                                <this._ElementBody></this._ElementBody>
                                {this._showSidebar() ? this._sidebar?.getElement() : null}
                            </>
                            :
                            <this._ElementArea></this._ElementArea>

                    }
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
            <div style={this.getElementBodyRawStyle()}>
                <this._ElementArea></this._ElementArea>
                {this._showResizers() ? <this._ElementResizer /> : null}
            </div>
        );
    };

    // only shows the text, all other style properties are held by upper level _ElementBodyRaw
    _ElementAreaRaw = ({ }: any): JSX.Element => {
        const allStyle = this.getAllStyle();
        const allText = this.getAllText();

        return (
            <div
                style={{
                    // display: "inline-flex",
                    // top: 0,
                    // left: 0,
                    // width: "100%",
                    // height: "100%",
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
                    ...this.getElementBodyRawStyle(),
                    outline: this._getElementAreaRawOutlineStyle(),

                }}
                // title={"tooltip"}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                <this._ElementChannelGraph></this._ElementChannelGraph>
            </div>
        );
    };

    network: undefined | Network = undefined;
    _ElementChannelGraph = () => {
        const elementRef = React.useRef<any>(null);

        // // Define nodes
        // const nodes = [
        //     { id: 1, label: 'Node 1' },
        //     { id: 2, label: 'Node 2' },
        //     { id: 3, label: 'Node 3' },
        //     { id: 4, label: 'Node 4' },
        //     { id: 5, label: 'Node 5' }
        // ];

        // // Define edges
        // const edges = [
        //     { from: 1, to: 2, label: 'A->B' },
        //     { from: 1, to: 3, label: 'A->C' },
        //     { from: 2, to: 4, label: 'B->D' },
        //     { from: 2, to: 5, label: 'B->E' },
        //     { from: 3, to: 5, label: 'C->E' }
        // ] as any;

        // // Provide the data in the proper format
        // const data = {
        //     nodes: new DataSet(nodes),
        //     edges: new DataSet(edges)
        // } as any;

        // Define network options
        const options = {
            edges: {
                arrows: 'to',
                font: {
                    color: '#000',
                    size: 12,
                    align: 'middle'
                },
                smooth: true,
                chosen: {
                    edge: false,
                    label: true,
                },
                labelHighlightBold: false,
                arrowStrikethrough: false,
            },
            interaction: {
                hover: false
            },
            physics: {
                enabled: true,
                solver: 'forceAtlas2Based',
                forceAtlas2Based: {
                    gravitationalConstant: -100, // Increase repulsion
                    springLength: 200, // minimum edge length
                    sprintConstant: 0.05
                },
                stabilization: {
                    enabled: true,
                    iterations: 200,
                }
            }
        };



        React.useEffect(() => {
            // Initialize the network
            setTimeout(() => {
                if (elementRef.current !== null) {
                    // this.network = new Network(elementRef.current, data, options);
                }
            }, 0)

            //     // Add click event for nodes
            //     // network.on('click', function (params) {
            //     //     if (params.nodes.length > 0) {
            //     //         const nodeId = params.nodes[0];
            //     //         const node = nodes.find(n => n.id === nodeId);
            //     //         alert(`Clicked on: ${node.label}`);
            //     //     }
            //     // });
        })

        return (
            <div>
                <div style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: "100%",
                    height: "100%",
                    border: "solid 1px black",
                    boxSizing: "border-box",
                }}>
                    <div
                        ref={elementRef}
                        style={{
                            width: "100%",
                            height: "100%",
                            boxSizing: "border-box",
                        }}
                    >
                        {/* to be replaced by vis */}
                    </div>
                </div>
                <div style={{
                    position: "absolute",
                    display: "flex",
                    flexDirection: "row",
                }}>
                    <ElementRectangleButton
                        handleClick={() => {
                            // data["nodes"].update(
                            //     { id: 1, label: `Node 1 updated ${Math.random()}` },
                            // )
                            this.network?.redraw()
                            // await this.createNode("cg01")

                            // console.log("+++", this.getLinksStaticData())
                        }}
                    >
                        Click me
                    </ElementRectangleButton>
                    <ElementRectangleButton
                        handleClick={async () => {
                            // data["nodes"].update(
                            //     { id: 1, label: `Node 1 updated ${Math.random()}` },
                            // )
                            await this.createNode("cg01")
                            this.createNetworkData();
                            this.network = new Network(elementRef.current, this.networkData, options);
                            this.networkClickCallback = (params: any) => {
                                this.handleClickNode(params, elementRef, options);
                            };
                            this.networkDoubleClickCallback = (params: any) => {
                                this.handleDoubleClickNode(params, elementRef, options);
                            };
                            this.network.on('click', this.networkClickCallback);
                            this.network.on("doubleClick", this.networkDoubleClickCallback);
                        }}
                    >
                        Click me 2
                    </ElementRectangleButton>
                    <this._ElementChannelInput></this._ElementChannelInput>
                </div>
            </div>
        );
    };


    /**
     * (1) find the node that is being clicked
     * 
     * (2) find the channel name for this node
     * 
     */
    handleClickNode = async (params: any, elementRef: any, options: any) => {
        // (1)
        const ids = params.nodes;
        const nodes = this.networkData["nodes"];
        const clickedNodes = nodes.get(ids);
        const clickedNode = clickedNodes[0];
        if (clickedNode !== undefined) {
            // (2)
            console.log("clicked node", clickedNode)
            const nodeLabel = clickedNode["label"];
            const success = await this.createNode(nodeLabel);
            console.log("create node", success, nodeLabel)
            if (success) {
                this.createNetworkData();
                this.network?.off("click", this.networkClickCallback);
                this.network = new Network(elementRef.current, this.networkData, options);
                this.networkClickCallback = (params: any) => {
                    this.handleClickNode(params, elementRef, options);
                };
                this.networkDoubleClickCallback = (params: any) => {
                    this.handleDoubleClickNode(params, elementRef, options);
                };
                this.network.on('click', this.networkClickCallback);
                this.network.on("doubleClick", this.networkDoubleClickCallback);
            }
        }
    }

    /**
     * Open the Probe for this node
     */
    handleDoubleClickNode = async (params: any, elementRef: any, options: any) => {
        // (1)
        const ids = params.nodes;
        const nodes = this.networkData["nodes"];
        const clickedNodes = nodes.get(ids);
        const clickedNode = clickedNodes[0];
        if (clickedNode !== undefined) {
            // (2)
            console.log("double clicked node", clickedNode)
            const nodeLabel = clickedNode["label"];
            const channelName = nodeLabel.split(" ")[0];

            if (TcaChannel.checkChannelName(channelName) === "ca" || TcaChannel.checkChannelName(channelName) === "pva") {
                // open Probe
                const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
                displayWindowClient.getIpcManager().sendFromRendererProcess("create-utility-display-window", "Probe", { channelNames: [channelName] });

            }
        }
    }

    networkClickCallback: any = () => { };

    networkDoubleClickCallback: any = () => { };


    private _ElementChannelInput = () => {
        const [channelName, setChannelName] = React.useState("");
        return (
            <form onSubmit={(event: any) => {
                event.preventDefault();
                this.setChannelNamesLevel0([channelName]);
            }}>
                <input
                    value={channelName}
                    onChange={(event: any) => {
                        event.preventDefault();
                        setChannelName(event.target.value);
                    }}
                >
                </input>
            </form>
        )
    }

    networkData: {
        nodes: any,
        edges: any,
    } = { nodes: new DataSet({}), edges: new DataSet({}) };

    /**
     * It reads this.linksStaticData and generate all 
     */
    createNetworkData = () => {

        console.log("this.getLinksStaticData() = ", this.getLinksStaticData())

        const edgeColors: Record<string, any> = {
            inLinks: { color: "purple", highlight: "purple", hover: "purple" },
            outLinks: { color: "#005f79", highlight: "#005f79", hover: "#005f79" },
            fwdLinks: { color: "blue", highlight: "blue", hover: "blue" },
        }

        // the object for nodes, its values are needed by vis-network
        const nodesObj: Record<string, { id: number, label: string } & Record<string, any>> = {};
        const edges: ({ from: number, to: number, label: string, color: Record<string, any> } & Record<string, any>)[] = [];
        let id = 0;

        // create nodes for main channel first
        for (const channelName of Object.keys(this.getLinksStaticData())) {
            if (nodesObj[channelName] === undefined) {
                const rtyp = this.getLinksStaticData()[channelName]["rtyp"];
                id = id + 1;
                const shape = this.getLinksStaticData()[channelName]["status"] === type_nodeStatus.expaneded ? "box" : "dot";
                nodesObj[channelName] = {
                    id: id,
                    label: channelName + " (" + rtyp + ")",
                    shape: shape,
                    physics: false,
                    x: this.calcNodeX(id),
                    y: this.calcNodeY(id),
                };
            }
        }

        for (const channelName of Object.keys(this.getLinksStaticData())) {

            // create links related to this node
            // each channelData is like this:
            // {
            //     inLinks: {
            //         INP: "pv1 PP MS",
            //         INPA: "",
            //         ...
            //     },
            //     outLinks: {
            //         OUT: "@dev3 c3 s5",
            //         OUTA: "pv1",
            //         OUTB: "",
            //         ...
            //     },
            //     fwdLinks: {
            //         FLNK: "pv2 NPP NMS",
            //         ...
            //     }
            // }
            const channelData = this.getLinksStaticData()[channelName];

            // iterate over 3 linkTypes: inLinks, outLinks, and fwdLinks
            for (const [linkType, links] of Object.entries(channelData)) { // [inLinks | outLinks | fwdLinks, {INPA:..., INPB: ...}]

                // make sure we are iterating inLinks, outLinks and fwdLinks
                if (linkType === "rtyp" || linkType === "status") {
                    continue;
                }
                if (typeof links === "string" || typeof links !== "object") {
                    continue;
                }

                for (let linkFieldName of Object.keys(links)) { // INP, INPA, FLNK, OUT, ...

                    const linkFieldValue = links[linkFieldName]; // "pv1.VAL3 NPP MS", "1", "@dev3 c5 s7", or undefined
                    console.log("linkFieldName, linkfieldValue", linkFieldName, linkFieldValue)
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

                    // create node for the link target channels
                    if (nodesObj[linkFieldTargetChannelBaseName] === undefined) {
                        id = id + 1;
                        nodesObj[linkFieldTargetChannelBaseName] = {
                            id: id,
                            label: linkFieldTargetChannelBaseName,
                            shape: "big ellipse",
                            physics: false,
                            x: this.calcNodeX(id),
                            y: this.calcNodeY(id),
                        };
                    }

                    // create edge between the main channel and its link's target channel 
                    // INPA: .VAL3 NPP NMS
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
                    const to = linkType === "inLinks" ? nodesObj[channelName]["id"] : nodesObj[linkFieldTargetChannelBaseName]["id"];
                    const from = linkType === "inLinks" ? nodesObj[linkFieldTargetChannelBaseName]["id"] : nodesObj[channelName]["id"];
                    edges.push({
                        from: from,
                        to: to,
                        label: edgeLabel,
                        color: edgeColors[linkType],
                        arrows: { to: { enabled: true, scaleFactor: 0.5 } },
                    })
                }
            }
        }

        console.log("nodesObj = ", nodesObj);
        console.log("edgeObj = ", edges);

        // const nodes1 = [
        //     { id: 1, label: 'Node 1' },
        //     { id: 2, label: 'Node 2' },
        //     { id: 3, label: 'Node 3' },
        //     { id: 4, label: 'Node 4' },
        //     { id: 5, label: 'Node 5' }
        // ];

        // const edges = [
        //     { from: 1, to: 2, label: 'A->B' },
        //     { from: 1, to: 3, label: 'A->C' },
        //     { from: 2, to: 4, label: 'B->D' },
        //     { from: 2, to: 5, label: 'B->E' },
        //     { from: 3, to: 5, label: 'C->E' }
        // ] as any;



        // // Provide the data in the proper format
        const data = {
            nodes: new DataSet(Object.values(nodesObj)),
            edges: new DataSet(edges as any)
        } as any;
        this.networkData = data;

    }

    calcNodeX = (id: number) => {
        return 300 + id * 300;
    }
    calcNodeY = (id: number) => {
        return 300 + id * 300;
    }

    /**
     * Get this channel's all IN_LINK/OUT_LINK/FWD_LINK fields' value, add the data structure
     * to this.linksStaticData
     * 
     * @param {string} newChannelName must be a channel name that does not contain fields
     * 
     * It modifies this.linksStaticData
     * 
     * (1) clear this._channelNamesLevel0 and append new channel name to it
     * (2) get this channel's RTYP
     * (3) start to monitor this channel
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

        // (1)
        this._channelNamesLevel0.length = 0;
        this.getChannelNamesLevel0().push(newChannelName);
        this.processChannelNames();
        // (2)
        const rtyp = await this.getRTYP(newChannelName);
        if (typeof rtyp !== "string") {
            console.log("RTYP of", newChannelName, "is", rtyp, "quit...")
            return false;
        }
        // (3)
        try {
            const tcaChannel = g_widgets1.getTcaChannel(newChannelName);
            await tcaChannel.getMeta(this.getWidgetKey());
            await tcaChannel.get(this.getWidgetKey(), 1, undefined, true);
            tcaChannel.monitor();
        } catch (e) {
            const tcaChannel = g_widgets1.createTcaChannel(newChannelName, this.getWidgetKey());
            if (tcaChannel !== undefined) {
                await tcaChannel.getMeta(this.getWidgetKey());
                await tcaChannel.get(this.getWidgetKey(), 1, undefined, true);
                tcaChannel.monitor();
            }
        }
        // (4)
        const dbdFiles = this.getDbdFiles();
        const inLinkFieldNames = dbdFiles.getRecordTypeInLinkFieldNames(rtyp);
        const outLinkFieldNames = dbdFiles.getRecordTypeOutLinkFieldNames(rtyp);
        const fwdLinkFieldNames = dbdFiles.getRecordTypeFwdLinkFieldNames(rtyp);
        const linksStaticData: {
            inLinks: Record<string, string | undefined>,
            outLinks: Record<string, string | undefined>,
            fwdLinks: Record<string, string | undefined>,
            status: type_nodeStatus,
            rtyp: string,
        } = {
            inLinks: {},
            outLinks: {},
            fwdLinks: {},
            status: type_nodeStatus.not_expanded,
            rtyp: rtyp,
        };
        for (const linkFieldName of inLinkFieldNames) {
            linksStaticData.inLinks[linkFieldName] = undefined;
        }
        for (const linkFieldName of outLinkFieldNames) {
            linksStaticData.outLinks[linkFieldName] = undefined;
        }
        for (const linkFieldName of fwdLinkFieldNames) {
            linksStaticData.fwdLinks[linkFieldName] = undefined;
        }

        this.getLinksStaticData()[newChannelName] = linksStaticData;

        console.log("----------- step 1-----------------")
        for (const [dataFieldName, links] of Object.entries(linksStaticData)) { // inLink, outLink, fwdLink

            // make sure we are iterating inLinks, outLinks and fwdLinks
            if (dataFieldName === "rtyp" || dataFieldName === "status") {
                continue;
            }
            if (typeof links === "string" || typeof links !== "object") {
                continue;
            }

            for (const linkFieldName of Object.keys(links)) { // INP, INPA, OUT, FLNK, ...
                const fieldFullName = `${newChannelName}.${linkFieldName}`;
                try {
                    const fieldTcaChannel = g_widgets1.getTcaChannel(fieldFullName);
                    // trigger the data so that the
                    await fieldTcaChannel.getMeta(this.getWidgetKey());
                    const dbrData = await fieldTcaChannel.get(this.getWidgetKey(), 1, undefined, false);
                    const value = dbrData["value"];
                    if (typeof value === "string") {
                        links[linkFieldName] = value;
                    } else {
                        links[linkFieldName] = undefined;
                    }
                    // fieldTcaChannel.monitor();
                } catch (e) {
                    const fieldTcaChannel = g_widgets1.createTcaChannel(fieldFullName, this.getWidgetKey());
                    if (fieldTcaChannel !== undefined) {
                        await fieldTcaChannel.getMeta(this.getWidgetKey());
                        const dbrData = await fieldTcaChannel.get(this.getWidgetKey(), 1, undefined, false);
                        const value = dbrData["value"];
                        if (typeof value === "string") {
                            links[linkFieldName] = value;
                        } else {
                            links[linkFieldName] = undefined;
                        }
                        // fieldTcaChannel.monitor();
                    }
                }
            }
        }
        linksStaticData["status"] = type_nodeStatus.expaneded;

        console.log(this.getLinksStaticData())
        console.log("----------- step 2 -----------------")

        // (5)
        for (const [dataFieldName, links] of Object.entries(linksStaticData)) { // inLink, outLink, fwdLink
            console.log("dataFieldName = ", dataFieldName, links)
            // make sure we are iterating inLinks, outLinks and fwdLinks
            if (dataFieldName === "rtyp" || dataFieldName === "status") {
                continue;
            }
            if (typeof links === "string" || typeof links !== "object") {
                continue;
            }


            for (const linkFieldValue of Object.values(links)) {
                const linkFieldTargetChannelName = linkFieldValue?.split(" ")[0];
                // linkFieldValue is a channel name, it is the link field's target
                if (linkFieldTargetChannelName === undefined) {
                    continue;
                }

                // new channel name must be a valid CA or PVA base name
                const linkFieldValueType = TcaChannel.checkChannelName(linkFieldTargetChannelName);
                if (linkFieldValueType !== "pva" && linkFieldValueType !== "ca") {
                    continue;
                }

                try {
                    const fieldTcaChannel = g_widgets1.getTcaChannel(linkFieldTargetChannelName);
                    await fieldTcaChannel.getMeta(this.getWidgetKey());
                    await fieldTcaChannel.get(this.getWidgetKey(), 1, undefined, false);
                    fieldTcaChannel.monitor();
                } catch (e) {
                    const fieldTcaChannel = g_widgets1.createTcaChannel(linkFieldTargetChannelName, this.getWidgetKey());
                    if (fieldTcaChannel !== undefined) {
                        await fieldTcaChannel.getMeta(this.getWidgetKey());
                        await fieldTcaChannel.get(this.getWidgetKey(), 1, undefined, false);
                        fieldTcaChannel.monitor();
                    }
                }
                // if the link field target value is like RNG:ENG.A, monitor its base channel name RNG:ENG
                if (linkFieldTargetChannelName.includes(".")) {
                    const linkFieldTargetChannelBaseName = linkFieldTargetChannelName.split(".")[0];
                    try {
                        const fieldTcaChannel = g_widgets1.getTcaChannel(linkFieldTargetChannelBaseName);
                        await fieldTcaChannel.getMeta(this.getWidgetKey());
                        await fieldTcaChannel.get(this.getWidgetKey(), 1, undefined, false);
                        fieldTcaChannel.monitor();
                    } catch (e) {
                        const fieldTcaChannel = g_widgets1.createTcaChannel(linkFieldTargetChannelBaseName, this.getWidgetKey());
                        if (fieldTcaChannel !== undefined) {
                            await fieldTcaChannel.getMeta(this.getWidgetKey());
                            await fieldTcaChannel.get(this.getWidgetKey(), 1, undefined, false);
                            fieldTcaChannel.monitor();
                        }
                    }
                }
            }
        }
        console.log("----------- step 3 -----------------")
        return true;
        // g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        // g_widgets1.addToForceUpdateWidgets("GroupSelection2");
        // g_flushWidgets();
    };

    linksStaticData: Record<string, // channel name
        {
            inLinks: Record<string, string | undefined>, // link field name vs link value (another channel name)
            outLinks: Record<string, string | undefined>,
            fwdLinks: Record<string, string | undefined>,
            rtyp: string,
            status: type_nodeStatus,
        } & Record<string, any>
    > = {};

    getLinksStaticData = () => {
        return this.linksStaticData;
    }


    getRTYP = async (channelName: string) => {
        console.log("okokok", channelName)
        // if (this.rtyp !== "" || this.rtyp === this.rtypWaitingName) {
        //     console.log("RTYP already obtained or waiting");
        //     return;
        // }


        const rtypChannelName = `${channelName}.RTYP`;
        let rtypTcaChannel: TcaChannel | undefined = undefined;
        try {
            rtypTcaChannel = g_widgets1.getTcaChannel(rtypChannelName);
        } catch (e) {
            rtypTcaChannel = g_widgets1.createTcaChannel(rtypChannelName, this.getWidgetKey());
        }
        if (rtypTcaChannel !== undefined) {
            this.rtyp = this.rtypWaitingName;
            await rtypTcaChannel.getMeta(this.getWidgetKey());
            const dbrData = await rtypTcaChannel.get(this.getWidgetKey(), 1, undefined, false);
            rtypTcaChannel.destroy(this.getWidgetKey());
            if ((dbrData !== undefined) && dbrData["value"] !== undefined) {
                const rtyp = dbrData["value"];
                console.log(rtypChannelName, "value is", rtyp)
                return rtyp;
                // if (rtyp !== undefined && this.rtyp === this.rtypWaitingName) {
                //     this.rtyp = `${rtyp}`;
                //     this.connectFieldChannels();
                //     return;
                // }
            } else {
                console.log("Failed to get value for", `${rtypChannelName}`);
                // GET timeout, reconnect
                // this.rtyp = "";
                // this.mapDbrData();
            }
        } else {
            console.log("Channel", `${rtypChannelName} does not exist`);
        }
        return undefined;
    };


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

    _parseChannelValueElement = (channelValueElement: number | string | boolean | undefined) => {
        // const channelValue = this.getChannelValueForMonitorWidget(raw);

        if (typeof channelValueElement === "number") {
            const scale = Math.max(this.getAllText()["scale"], 0);
            const format = this.getAllText()["format"];
            if (format === "decimal") {
                return channelValueElement.toFixed(scale);
            } else if (format === "default") {
                const channelName = this.getChannelNames()[0];
                const defaultScale = g_widgets1.getChannelPrecision(channelName);
                if (defaultScale !== undefined) {
                    return channelValueElement.toFixed(defaultScale);
                } else {
                    return channelValueElement.toFixed(scale);
                }
            } else if (format === "exponential") {
                return channelValueElement.toExponential(scale);
            } else if (format === "hexadecimal") {
                return `0x${channelValueElement.toString(16)}`;
            } else if (format === "string") {
                return `${String.fromCharCode(channelValueElement)}`;
            } else {
                return channelValueElement;
            }
        } else {
            return `${channelValueElement}`;
        }
    };

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
            display: "inline-block",
            // dimensions
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(240, 240, 240, 1)",
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
        return result;
    };


    // static method for generating a widget tdl with external PV name
    static generateWidgetTdl = (utilityOptions: Record<string, any>): type_ChannelGraph_tdl => {
        const result = this.generateDefaultTdl("ChannelGraph");
        // result.channelNames = utilityOptions.channelNames as string[];
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
    // getTdlCopy()

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
}
