import { getMouseEventClientY, GlobalVariables } from "../../global/GlobalVariables";
import * as React from "react";
import { getMouseEventClientX, g_widgets1 } from "../../global/GlobalVariables";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { Table } from "../../helperWidgets/Table/Table";
import { v4 as uuidv4 } from "uuid";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { XYPlot } from "../XYPlot/XYPlot";
import { convertDateObjToString } from "../../global/GlobalMethods";
import { ElementRectangleButton, ElementRectangleButtonDefaultBackgroundColor } from "../../helperWidgets/SharedElements/RectangleButton";
import { Log } from "../../../mainProcess/log/Log";

export type type_CaProtoRsrvIsUpData = {
    msSinceEpoch: number,
    channelName: string,
    ip: string, // source IP address
    port: number, // source port
}

export type type_Casw_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    groupNames: string[];
    rules: type_rules_tdl;
    macros: [string, string][];
    channelNames: string[];
};

export class Casw extends BaseWidget {
    // -------------------------------------------

    _macros: [string, string][] = [];
    _table: Table;

    bufferSize: number = 10000;
    readonly maxBufferSize: number = 100000;
    statsNsec: number = 10; // counts in last N seconds
    statsInLastNSeconds: {
        srcIps: Record<string, number>,
        tcpClients: Record<string, number>,
    } = {
            srcIps: {},
            tcpClients: {},
        };

    bottomView: "raw-data" | "stats" | "counts-src-ip" | "counts-tcp-client" = "raw-data";

    setMacros = (newMacros: [string, string][]) => {
        this._macros = newMacros;
    };

    getMacros = () => {
        return this._macros;
    };

    _CaProtoRsrvIsUpData: type_CaProtoRsrvIsUpData[] = [];
    getCaProtoRsrvIsUpData = () => {
        return this._CaProtoRsrvIsUpData;
    }
    clearCaProtoRsrvIsUpData = () => {
        this.getCaProtoRsrvIsUpData().length = 0;
    }

    memoId: string = "";

    forceUpdateTable: any = undefined;

    _ElementTableCell: ({ children, columnIndex, additionalStyle }: any) => React.JSX.Element;
    _ElementTableLine: ({ children, additionalStyle, lineIndex }: any) => React.JSX.Element;
    _ElementTableHeaderResizer: ({ columnIndex }: any) => React.JSX.Element;
    _ElementTableLineMemo: React.MemoExoticComponent<(input: any) => React.JSX.Element>;

    startCaswServer = () => {
        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
        const ipcManager = displayWindowClient.getIpcManager();
        ipcManager.sendFromRendererProcess("ca-sw-command", {
            command: "start",
            displayWindowId: displayWindowClient.getWindowId(),
            widgetKey: this.getWidgetKey(),
        })
    }

    dataProcessingIndex = 0;
    histogramDataX: number[] = [];
    histogramDataY: number[] = [];


    processData = () => {

        const timeNow = Date.now();
        let currentIndex = 0;

        this.statsInLastNSeconds = {
            srcIps: {},
            tcpClients: {},
        };

        if (this.getCaProtoRsrvIsUpData().length > 0) {
            // histogram data for plot
            const timeOldest = this.getCaProtoRsrvIsUpData()[0]["msSinceEpoch"];
            const oldexIndex = Math.ceil((timeOldest - timeNow) / 1000);

            const resultX = [];
            const resultY = [];
            for (let ii = oldexIndex; ii <= 0; ii++) {
                resultX.push(ii);
                resultY.push(0);
            }

            for (let ii = 0; ii < this.getCaProtoRsrvIsUpData().length; ii++) {

                // counts during last N seconds
                const data = this.getCaProtoRsrvIsUpData()[ii];
                const time = data["msSinceEpoch"];
                const filtered = this.getFilteredProtoSearchData()[ii];

                if (timeNow - time < this.statsNsec * 1000 && filtered) {
                    const srcIp = data["ip"];
                    const tcpClient = data["ip"] + ":" + `${data["port"]}`;
                    if (this.statsInLastNSeconds["srcIps"][srcIp] === undefined) {
                        this.statsInLastNSeconds["srcIps"][srcIp] = 1;
                    } else {
                        this.statsInLastNSeconds["srcIps"][srcIp] = this.statsInLastNSeconds["srcIps"][srcIp] + 1;
                    }
                    if (this.statsInLastNSeconds["tcpClients"][tcpClient] === undefined) {
                        this.statsInLastNSeconds["tcpClients"][tcpClient] = 1;
                    } else {
                        this.statsInLastNSeconds["tcpClients"][tcpClient] = this.statsInLastNSeconds["tcpClients"][tcpClient] + 1;
                    }
                }

                // histogram
                if (!filtered) {
                    continue;
                } else {
                    currentIndex = resultY.length + Math.ceil((time - timeNow) / 1000) - 1;
                    resultY[currentIndex] = resultY[currentIndex] + 1;
                }
            }

            this.histogramDataX = resultX;
            this.histogramDataY = resultY;
        }
    }

    processData1 = () => {

        const timeNow = Date.now();
        let currentIndex = 0;
        if (this.getCaProtoRsrvIsUpData().length > 0) {
            const timeOldest = this.getCaProtoRsrvIsUpData()[0]["msSinceEpoch"];
            const oldexIndex = Math.ceil((timeOldest - timeNow) / 1000);

            const resultX = [];
            const resultY = [];
            for (let ii = oldexIndex; ii <= 0; ii++) {
                resultX.push(ii);
                resultY.push(0);
            }

            for (let ii = 0; ii < this.getCaProtoRsrvIsUpData().length; ii++) {
                const filtered = this.getFilteredProtoSearchData()[ii];
                if (!filtered) {
                    continue;
                } else {
                    const data = this.getCaProtoRsrvIsUpData()[ii];
                    const time = data["msSinceEpoch"];
                    currentIndex = resultY.length + Math.ceil((time - timeNow) / 1000) - 1;
                    resultY[currentIndex] = resultY[currentIndex] + 1;
                }
            }

            this.histogramDataX = resultX;
            this.histogramDataY = resultY;
        }

    }

    stopCaswServer = () => {
        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
        const ipcManager = displayWindowClient.getIpcManager();
        ipcManager.sendFromRendererProcess("ca-sw-command", {
            command: "stop",
            displayWindowId: displayWindowClient.getWindowId(),
            widgetKey: this.getWidgetKey(),
        })
    }

    handleNewData = (newData: any) => {
        this.getCaProtoRsrvIsUpData().push(...newData);
        // buffer size
        if (this.getCaProtoRsrvIsUpData().length > this.bufferSize) {
            this.getCaProtoRsrvIsUpData().splice(0, this.getCaProtoRsrvIsUpData().length - this.bufferSize);
        }
        this.filterData(newData);
        this.forceUpdateTable();
        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        g_flushWidgets();
    }

    getTable = () => {
        return this._table;
    }

    constructor(widgetTdl: type_Casw_tdl) {
        super(widgetTdl);
        this.setStyle({ ...Casw._defaultTdl.style, ...widgetTdl.style });
        this.setText({ ...Casw._defaultTdl.text, ...widgetTdl.text });
        this.setMacros(JSON.parse(JSON.stringify(widgetTdl.macros)));

        // columns: ms since epoch, channel name, ip, port
        this._table = new Table([GlobalVariables.defaultFontSize * 5, GlobalVariables.defaultFontSize * 30, GlobalVariables.defaultFontSize * 40, GlobalVariables.defaultFontSize * 30, GlobalVariables.defaultFontSize * 10], this);
        this._ElementTableCell = this.getTable().getElementTableCell();
        this._ElementTableLine = this.getTable().getElementTableLine();
        this._ElementTableLineMemo = this.getTable().getElementTableLineMemo();
        this._ElementTableHeaderResizer = this.getTable().getElementTableHeaderResizer();
        // no sidebar
        // this._sidebar = new PvTableSidebar(this);

        setInterval(() => {
            this.processData();
            try {
                const displayWindowId = g_widgets1.getRoot().getDisplayWindowClient().getWindowId();
                const xTcaChannel = g_widgets1.getTcaChannel("loc://histX" + "@window_" + displayWindowId);
                xTcaChannel.put(displayWindowId, { value: this.histogramDataX }, 1);
            } catch (e) {
                Log.error(e);
            }
            try {
                const displayWindowId = g_widgets1.getRoot().getDisplayWindowClient().getWindowId();
                const yTcaChannel = g_widgets1.getTcaChannel("loc://histY" + "@window_" + displayWindowId);
                yTcaChannel.put(displayWindowId, { value: this.histogramDataY }, 1);
            } catch (e) {
                Log.error(e);
            }
        }, 1000)

        window.addEventListener("resize", () => {
            this.resizeXYPlot();
        })
    }

    _filteredCaProtoSearchData: boolean[] = [];

    getFilteredProtoSearchData = () => {
        return this._filteredCaProtoSearchData;
    }

    resetFilteredProtoSearchData = () => {
        this.getFilteredProtoSearchData().length = 0;
        this.filterData(this.getCaProtoRsrvIsUpData());
    }


    filterData = (newData: type_CaProtoRsrvIsUpData[]) => {
        for (let ii = 0; ii < newData.length; ii++) {
            const element = newData[ii];
            // const channelFiltered = element["channelName"] === this.filteredChannelName || this.filteredChannelName === "";
            // this.filteredChannelName can be separated by spaces for multiple match
            let channelFiltered = false;
            if (this.filteredChannelName.trim() === "") {
                channelFiltered = true;
            } else {
                const filteredChannelNames = this.filteredChannelName.trim().split(/\s+/);
                for (let filteredChannelName of filteredChannelNames) {
                    if (element["channelName"].toLocaleLowerCase().includes(filteredChannelName)) {
                        channelFiltered = true;
                        break;
                    }
                }
            }

            const ipFiltered = element["ip"] === this.filteredIp || this.filteredIp === "";
            const portFiltered = `${element["port"]}` === this.filteredPort || this.filteredPort === "";
            if (channelFiltered && ipFiltered && portFiltered) {
                this.getFilteredProtoSearchData().push(true);
            } else {
                this.getFilteredProtoSearchData().push(false);
            }
        }
    }

    filterTimeRange: [number, number] = [0, 0];
    filteredPort = "";
    filteredIp = "";
    filteredChannelName = "";


    // ------------------------- event ---------------------------------
    // concretize abstract method
    updateFromSidebar = (event: any, propertyName: string, propertyValue: number | string | number[] | string[] | boolean | undefined) => { };

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

    // concretize abstract method
    _ElementRaw = () => {
        // if (this.getExpandedBaseChannelNames().length === 0) {
        // this function uses g_widgets1. It cannot be invoked in constructor
        // this.setExpanedBaseChannelNames();
        // }

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
    }; // ----------------------------------------

    _ElementBodyRaw = (): JSX.Element => {
        return (
            <div style={{ ...this.getElementBodyRawStyle() }}>
                <this._ElementArea></this._ElementArea>
                {/* <this._BulkAddChannelsPage></this._BulkAddChannelsPage> */}
                {/* <this._ElementSettings></this._ElementSettings> */}
                {this._showResizers() ? <this._ElementResizer /> : null}
            </div>
        );
    };

    // only shows the text, all other style properties are held by upper level _ElementBodyRaw
    _ElementAreaRaw = ({ }: any): JSX.Element => {
        return (
            <div
                style={{
                    display: "inline-flex",
                    position: "relative",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    // userSelect: "none",
                    // different from regular widget
                    // overflow: this.getText().overflowVisible ? "visible" : "hidden",
                    // overflow: "scroll",
                    // overflow: "scroll",
                    // overflow: "scroll",
                    flexDirection: "column",
                    // fontSize: "30px",
                    // fontFamily: this.getText().fontFamily,
                    fontSize: `${this.getStyle().fontSize}px`,
                    // fontStyle: this.getText().fontStyle,
                    // contentVisibility: "hidden"
                    // padding: "20px",
                }}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                <this._ElementCasw></this._ElementCasw>
            </div>
        );
    };

    XYPlotMoved: boolean = false;



    _ElementCasw = () => {
        const [, forceUpdate] = React.useState({});
        this.forceUpdateTable = () => { forceUpdate({}) };

        React.useEffect(() => {
            if (this.XYPlotMoved === false) {
                const ElementXYPlot = document.getElementById("XYPlot");
                const ElementXYPlotWrapper = document.getElementById("XYPlotWrapper");
                if (ElementXYPlot !== null && ElementXYPlotWrapper !== null) {
                    ElementXYPlotWrapper.appendChild(ElementXYPlot);
                    this.resizeXYPlot()
                    this.XYPlotMoved = true;
                }
            }
        })
        return <div
            style={{
                display: "inline-flex",
                width: "100%",
                height: "100%",
                flexDirection: "column",
                userSelect: "none",
            }}>
            {/* <this._ElementHeader></this._ElementHeader>
            <this._ElementFilters></this._ElementFilters>
            <this._ElementDataTable></this._ElementDataTable>
            <this._ElementXYPlotWrapper></this._ElementXYPlotWrapper> */}

            <this._ElementHeader></this._ElementHeader>
            <this._ElementSettings></this._ElementSettings>
            {
                this.bottomView === "counts-src-ip" ?
                    <this._ElementCounts data={this.statsInLastNSeconds["srcIps"]}></this._ElementCounts>
                    : this.bottomView === "counts-tcp-client" ?
                        <this._ElementCounts data={this.statsInLastNSeconds["tcpClients"]}></this._ElementCounts>
                        : null
            }
            <this._ElementDataTable></this._ElementDataTable>
            <this._ElementXYPlotWrapper></this._ElementXYPlotWrapper>

        </div>
    }

    _ElementXYPlotWrapper = () => {
        return <div
            id="XYPlotWrapper"
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                display: this.bottomView === "stats" ? "inline-flex" : "none",
            }}
        >

        </div>
    }

    _ElementHeader = () => {
        return (
            <div style={{
                width: "100%",
                display: "inline-flex",
                flexDirection: "column",
            }}>
                <div style={{ fontSize: 30 }}>
                    Channel Access Server Watcher
                </div>
                <div style={{
                    color: "rgba(100, 100, 100, 1)",
                    boxSizing: "border-box",
                    paddingTop: 20,
                    paddingBottom: 2,
                }}>
                    The CASW is listening to UDP port {this.getAllText()["EPICS_CA_REPEATER_PORT"]} for any package that has a 0x000D header (CA_PROTO_RSRV_IS_UP), aka beacon.
                    See <a href={"https://docs.epics-controls.org/en/latest/internal/ca_protocol.html"} target="_blank">Channel Access Protocol Specification </a>
                    for the details.
                </div>
                <div style={{
                    color: "rgba(255, 0, 0, 1)",
                    boxSizing: "border-box",
                    paddingTop: 2,
                    paddingBottom: 20,
                }}>
                    Note: This tool captures and shows all EPICS server beacons sent to port {this.getAllText()["EPICS_CA_REPEATER_PORT"]} on this computer.
                    It is different from the casw tool that comes with the EPICS base, which only shows the beacon anomalies.
                </div>
            </div>
        )
    }


    _ElementSettings = () => {
        const [bufferSize, setBufferSize] = React.useState(`${this.bufferSize}`);
        const [statsNsec, setStatsNsec] = React.useState(`${this.statsNsec}`);


        return (
            <div style={{
                display: "inline-flex",
                flexDirection: "column",
                width: "100%",
                boxSizing: "border-box",
                paddingBottom: 0,
                paddingTop: 5,
            }}>

                <div style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    width: "100%",
                    paddingBottom: 5,
                }}>
                    <div style={{
                        display: "inline-flex",
                        width: GlobalVariables.defaultFontSize * 10,
                    }}>
                        Number of entries:
                    </div>
                    <form onSubmit={(event: any) => {
                        event.preventDefault();
                        const bufferSizeInt = parseInt(bufferSize);
                        if (!isNaN(bufferSizeInt) && bufferSizeInt > 10 && bufferSizeInt < this.maxBufferSize) {
                            this.bufferSize = bufferSizeInt;
                            setBufferSize(`${parseInt(bufferSize)}`);
                        } else {
                            setBufferSize(`${this.bufferSize}`);
                        }
                    }}>
                        <input
                            value={`${bufferSize}`}
                            onChange={(event: any) => {
                                event.preventDefault();
                                const value = event.target.value;
                                setBufferSize(value);
                            }}
                            style={{
                                borderRadius: 0,
                                border: "solid 1px rgba(80, 80, 80, 1)",
                                outline: "none",
                            }}
                        >
                        </input>
                    </form>
                    <div style={{ color: "rgba(100, 100, 100, 1)" }}>&nbsp;(Maximum 100,000)</div>
                </div>


                <div style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    width: "100%",
                    paddingBottom: 5,
                }}>
                    <div style={{
                        display: "inline-flex",
                        width: GlobalVariables.defaultFontSize * 10,
                    }}>
                        Count last N seconds:
                    </div>
                    <form onSubmit={(event: any) => {
                        event.preventDefault();
                        const statsNsecInt = parseInt(statsNsec);
                        if (!isNaN(statsNsecInt) && statsNsecInt > 1) {
                            this.statsNsec = statsNsecInt;
                            setStatsNsec(`${statsNsecInt}`);
                        } else {
                            setStatsNsec(`${this.statsNsec}`);
                        }
                        this.processData();
                        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
                        g_flushWidgets();

                    }}>
                        <input
                            value={`${statsNsec}`}
                            onChange={(event: any) => {
                                event.preventDefault();
                                const value = event.target.value;
                                setStatsNsec(value);
                            }}
                            style={{
                                borderRadius: 0,
                                border: "solid 1px rgba(80, 80, 80, 1)",
                                outline: "none",
                            }}
                        >
                        </input>
                    </form>
                    <div style={{ color: "rgba(100, 100, 100, 1)" }}>&nbsp;seconds</div>
                </div>

                {/* filters for table */}
                <this._ElementFilters></this._ElementFilters>



                <div style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    marginTop: 10,
                    marginBottom: 10,
                }}
                >
                    {/* show data table */}
                    <ElementRectangleButton
                        defaultBackgroundColor={this.bottomView === "raw-data" ? ElementRectangleButtonDefaultBackgroundColor : "grey"}
                        marginLeft={0}
                        handleMouseDown={() => {
                            this.bottomView = "raw-data";
                            this.resizeXYPlot()
                            g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
                            g_flushWidgets();

                        }}
                    >
                        Data
                    </ElementRectangleButton>
                    {/* show plot */}
                    <ElementRectangleButton
                        defaultBackgroundColor={this.bottomView === "stats" ? ElementRectangleButtonDefaultBackgroundColor : "grey"}
                        marginLeft={10}
                        handleMouseDown={() => {
                            this.bottomView = "stats";
                            this.resizeXYPlot()
                            g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
                            g_flushWidgets();

                        }}
                    >
                        Plot
                    </ElementRectangleButton>
                    {/* show counts */}
                    <ElementRectangleButton
                        defaultBackgroundColor={this.bottomView === "counts-src-ip" ? ElementRectangleButtonDefaultBackgroundColor : "grey"}
                        marginLeft={10}
                        handleMouseDown={() => {
                            this.bottomView = "counts-src-ip";
                            this.resizeXYPlot()
                            g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
                            g_flushWidgets();

                        }}
                    >
                        Source IP counts
                    </ElementRectangleButton>
                    <ElementRectangleButton
                        defaultBackgroundColor={this.bottomView === "counts-tcp-client" ? ElementRectangleButtonDefaultBackgroundColor : "grey"}
                        marginLeft={10}
                        handleMouseDown={() => {
                            this.bottomView = "counts-tcp-client";
                            this.resizeXYPlot()
                            g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
                            g_flushWidgets();

                        }}
                    >
                        TCP client counts
                    </ElementRectangleButton>
                </div>
            </div >
        )
    }



    _ElementCounts = ({ data }: { data: Record<string, any> }) => {

        const elementRef = React.useRef<any>(null);
        // this.countsRef = elementRef;

        const style = {
            width: "100%",
            userSelect: "text",
            overflowX: "hidden",
            overflowY: "scroll",
        } as React.CSSProperties;

        return (<div
            ref={elementRef}
            style={
                style
            }
        >
            <table
                style={{
                    width: "100%",
                }}
            >
                <col style={{ width: "50%" }}></col>
                <col style={{ width: "50%" }}></col>
                <tr
                    style={{
                        backgroundColor: "rgba(230, 230, 230, 1)",
                    }}
                >
                    <th style={{ textAlign: "left" }}>
                        {this.bottomView === "counts-src-ip" ? "Source IP" : "Source IP and TCP port"}
                    </th>
                    <th style={{ textAlign: "left" }}>
                        Count
                    </th>
                </tr>
                {Object.entries(data).map(([prop, count]: [string, number], index: number) => {
                    return (
                        <tr
                            key={prop + "-" + `${index}`}
                            style={{
                                backgroundColor: index % 2 === 0 ? "rgba(255,255,255,1)" : "rgba(230, 230, 230, 1)",
                            }}
                        >
                            {
                                <td>
                                    {prop}
                                </td>
                            }
                            <td>
                                {count}
                            </td>
                        </tr>
                    )
                })}
            </table>
        </div>)
    }


    _ElementFilters = () => {
        const [filteredIp, setFilteredIp] = React.useState(this.filteredIp);
        const [filteredPort, setFilteredPort] = React.useState(this.filteredPort);
        const [bufferSize, setBufferSize] = React.useState(`${this.bufferSize}`);
        return (
            <div style={{
                display: "inline-flex",
                flexDirection: "column",
                width: "100%",
                boxSizing: "border-box",
                paddingBottom: 10,
            }}>

                <div style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    width: "100%",
                    paddingBottom: 8,
                    paddingTop: 5,
                }}>
                    <b>Filters:</b>
                </div>
                <div style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    width: "100%",
                    paddingBottom: 5,
                }}>
                    <div style={{
                        display: "inline-flex",
                        width: GlobalVariables.defaultFontSize * 10,
                    }}>
                        IP:
                    </div>
                    <form onSubmit={(event: any) => {
                        event.preventDefault();
                        this.filteredIp = filteredIp;
                        // apply the new filter
                        this.resetFilteredProtoSearchData();
                        this.processData();
                        this.memoId = uuidv4();
                        // this.forceUpdateTable();
                        this.processData();
                        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
                        g_flushWidgets();
                    }}>
                        <input
                            value={filteredIp}
                            onChange={(event: any) => {
                                event.preventDefault();
                                setFilteredIp(event.target.value);
                            }}
                            style={{
                                borderRadius: 0,
                                border: "solid 1px rgba(80, 80, 80, 1)",
                                outline: "none",
                            }}

                        >
                        </input>
                    </form>
                </div>
                <div style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    width: "100%",
                    paddingBottom: 5,
                }}>
                    <div style={{
                        display: "inline-flex",
                        width: GlobalVariables.defaultFontSize * 10,
                    }}>
                        Port:
                    </div>

                    <form onSubmit={(event: any) => {
                        event.preventDefault();
                        this.filteredPort = filteredPort;
                        // apply the new filter
                        this.resetFilteredProtoSearchData();
                        this.memoId = uuidv4();
                        // this.forceUpdateTable();
                        this.processData();
                        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
                        g_flushWidgets();
                    }}>
                        <input
                            value={filteredPort}
                            onChange={(event: any) => {
                                event.preventDefault();
                                setFilteredPort(event.target.value);
                            }}
                            style={{
                                borderRadius: 0,
                                border: "solid 1px rgba(80, 80, 80, 1)",
                                outline: "none",
                            }}
                        >
                        </input>
                    </form>
                </div>
                
            </div >
        )
    }

    tableRef: React.MutableRefObject<any> | undefined = undefined;


    resizeXYPlot = () => {
        // get Table size
        let width = 0;
        let height = 0;
        if (this.tableRef !== undefined && this.tableRef.current !== null) {
            width = this.tableRef.current.offsetWidth;
            height = this.tableRef.current.offsetHeight;
        }

        if (width === 0 || height === 0) {
            const ElementXYPlotWrapper = document.getElementById("XYPlotWrapper");
            if (ElementXYPlotWrapper !== null) {
                width = ElementXYPlotWrapper.offsetWidth;
                height = ElementXYPlotWrapper.offsetHeight;
            }
        }
        if (width !== 0 && height !== 0) {
            for (let widget of g_widgets1.getWidgets2().values()) {
                if (widget instanceof XYPlot) {
                    const widgetKey = widget.getWidgetKey();
                    widget.getStyle()["width"] = width;
                    widget.getStyle()["height"] = height;
                    g_widgets1.addToForceUpdateWidgets(widgetKey);
                    g_flushWidgets()
                }
            }
        }
    }


    resizeXYPlot1 = () => {
        // get Table size
        if (this.tableRef !== undefined && this.tableRef.current !== null) {
            let width = this.tableRef.current.offsetWidth;
            let height = this.tableRef.current.offsetHeight;
            if (width === 0 || height === 0) {
                const ElementXYPlotWrapper = document.getElementById("XYPlotWrapper");
                if (ElementXYPlotWrapper !== null) {
                    width = ElementXYPlotWrapper.offsetWidth;
                    height = ElementXYPlotWrapper.offsetHeight;
                }
            }

            if (width !== 0 && height !== 0) {
                for (let widget of g_widgets1.getWidgets2().values()) {
                    if (widget instanceof XYPlot) {
                        const widgetKey = widget.getWidgetKey();
                        widget.getStyle()["width"] = width;
                        widget.getStyle()["height"] = height;
                        g_widgets1.addToForceUpdateWidgets(widgetKey);
                        g_flushWidgets()
                    }
                }
            }
        }
    }



    _ElementDataTable = () => {
        const tableRef = React.useRef<any>(null);

        this.tableRef = tableRef;

        const [, forceUpdate] = React.useState({});
        // this.forceUpdateTable = () => { forceUpdate({}) };
        this.getTable().updateForceUpdateTableFunc(this.forceUpdateTable);


        const scrollToBottom = () => {
            tableRef.current.scrollTop = tableRef.current.scrollHeight;
        };

        let isScrolledToBottom = false;
        if (tableRef.current !== null) {
            isScrolledToBottom = tableRef.current.scrollHeight - tableRef.current.scrollTop - tableRef.current.clientHeight < 5;
        }
        React.useEffect(() => {
            // Automatically scroll to bottom on component mount and updates
            if (isScrolledToBottom) {
                scrollToBottom(); // Scroll to bottom only if it was already at the bottom
            }
        });

        return (<div
            ref={tableRef}
            style={{
                width: "100%",
                height: "100%",
                fontFamily: GlobalVariables.defaultFontFamily,
                fontSize: GlobalVariables.defaultFontSize,
                fontWeight: GlobalVariables.defaultFontWeight,
                fontStyle: GlobalVariables.defaultFontStyle,
                display: this.bottomView === "raw-data" ? "inline-flex" : "none",
                flexDirection: "column",
                flexWrap: "nowrap",
                justifyContent: "flex-start",
                alignItems: 'center',
                overflowY: "scroll",
                border: "solid 1px rgba(0,0,0,1)",
            }}>
            {/* header */}
            <this._ElementTableLine key={`table-header`}>
                <this._ElementTableCell columnIndex={0} additionalStyle={{ justifyContent: "space-between" }}>
                    Index
                    {/* resizer */}
                    <this._ElementTableHeaderResizer columnIndex={0}></this._ElementTableHeaderResizer>
                </this._ElementTableCell>
                <this._ElementTableCell columnIndex={1} additionalStyle={{ justifyContent: "space-between" }}>
                    Receive Time
                    {/* resizer */}
                    <this._ElementTableHeaderResizer columnIndex={1}></this._ElementTableHeaderResizer>
                </this._ElementTableCell>
                <this._ElementTableCell columnIndex={2} additionalStyle={{ justifyContent: "space-between" }}>
                    CA Server IP
                    {/* resizer */}
                    <this._ElementTableHeaderResizer columnIndex={2}></this._ElementTableHeaderResizer>
                </this._ElementTableCell>
                <this._ElementTableCell columnIndex={3} additionalStyle={{ justifyContent: "space-between" }}>
                    CA Server TCP Port
                    {/* resizer */}
                    <this._ElementTableHeaderResizer columnIndex={3}></this._ElementTableHeaderResizer>
                </this._ElementTableCell>
            </this._ElementTableLine>

            {/* data lines */}
            {this.getCaProtoRsrvIsUpData().map((data: type_CaProtoRsrvIsUpData, index: number) => {
                if (this.getFilteredProtoSearchData()[index] === false) {
                    return null
                } else {
                    return (
                        <this._ElementTableLine key={`${data["msSinceEpoch"]}-${data["channelName"]}-${this.memoId}-${index}`} lineIndex={index}>
                            <this._ElementTableCell columnIndex={0} additionalStyle={{ justifyContent: "space-between" }}>
                                {index}
                            </this._ElementTableCell>
                            <this._ElementTableCell columnIndex={1} additionalStyle={{ justifyContent: "space-between" }}>
                                {convertDateObjToString(new Date(data["msSinceEpoch"]))}
                            </this._ElementTableCell>
                            <this._ElementTableCell columnIndex={2} additionalStyle={{ justifyContent: "space-between" }}>
                                {data["ip"]}
                            </this._ElementTableCell>
                            <this._ElementTableCell columnIndex={3} additionalStyle={{ justifyContent: "space-between" }}>
                                {data["port"]}
                            </this._ElementTableCell>
                        </this._ElementTableLine>

                    )
                }
            })}
        </div>
        )
    }

    mouseEventInsideTable = (ponterX: number, pointerY: number) => {
        return true;
    }


    mouseRightButtonDownContextMenuActions: {
        "Copy selected data": any,
        "Copy all data": any,
        "Save selected data": any
        "Save all data": any,
        "Unselect data": any,
        "Clear data": any,
    } = {
            "Copy selected data": () => {
                const result: type_CaProtoRsrvIsUpData[] = [];
                for (let index of this.getTable().selectedLines) {
                    const data = this.getCaProtoRsrvIsUpData()[index];
                    result.push(data)
                }
                navigator.clipboard.writeText(JSON.stringify(result, null, 4));

            },
            "Copy all data": () => {
                navigator.clipboard.writeText(JSON.stringify(this.getCaProtoRsrvIsUpData(), null, 4));

            },
            "Save selected data": () => {
                const result: type_CaProtoRsrvIsUpData[] = [];
                for (let index of this.getTable().selectedLines) {
                    const data = this.getCaProtoRsrvIsUpData()[index];
                    result.push(data)
                }
                if (result.length < 1) {
                    return;
                }
                const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
                const ipcManager = displayWindowClient.getIpcManager();
                const displayWindowId = displayWindowClient.getWindowId();
                ipcManager.sendFromRendererProcess("save-data-to-file",
                    {
                        displayWindowId: displayWindowId,
                        data: result,
                        preferredFileTypes: ["json"],
                    }
                )

            },
            "Save all data": () => {
                const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
                const ipcManager = displayWindowClient.getIpcManager();
                const displayWindowId = displayWindowClient.getWindowId();
                ipcManager.sendFromRendererProcess("save-data-to-file",
                    {
                        displayWindowId: displayWindowId,
                        data: this.getCaProtoRsrvIsUpData(),
                        preferredFileTypes: ["json"],
                    }
                )
            },
            "Unselect data": () => {
                this.getTable().selectedLines.length = 0;
                g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
                g_flushWidgets();
            },
            "Clear data": () => {
                this.clearCaProtoRsrvIsUpData();
                g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
                g_flushWidgets();
            },
        };


    // override
    getTdlCopy = (newKey: boolean = true): Record<string, any> => {
        const result = super.getTdlCopy(newKey);
        // result.fieldNames = this.getStrippedFieldNames();
        result.macros = JSON.parse(JSON.stringify(this.getMacros()));
        result.channelNames = JSON.parse(JSON.stringify(this.getChannelNamesLevel0()));
        return result;
    };

    // concretize abstract method
    _Element = React.memo(this._ElementRaw, () => this._useMemoedElement());
    _ElementArea = React.memo(this._ElementAreaRaw, () => this._useMemoedElement());
    _ElementBody = React.memo(this._ElementBodyRaw, () => this._useMemoedElement());

    // _Element = React.memo(this._ElementRaw, () => false);
    // _ElementArea = React.memo(this._ElementAreaRaw, () => true);
    // _ElementBody = React.memo(this._ElementBodyRaw, () => true);

    // defined in super class
    // getElement()
    // getSidebarElement()

    // -------------------- helper functions ----------------

    // defined in super class
    // _showSidebar()
    // _showResizers()
    // _useMemoedElement()
    // hasChannel()
    // isInGroup()
    // isSelected()
    // _getElementAreaRawOutlineStyle()

    _getChannelValue = () => {
        return this._getFirstChannelValue();
    };
    _getChannelSeverity = () => {
        return this._getFirstChannelSeverity();
    };
    _getChannelUnit = () => {
        return this._getFirstChannelUnit();
    };

    // ----------------------- styles -----------------------

    // defined in super class

    // _resizerStyle
    // _resizerStyles
    // StyledToolTipText
    // StyledToolTip

    // -------------------------- tdl -------------------------------

    // override BaseWidget
    static _defaultTdl: type_Casw_tdl = {
        type: "Casw",
        widgetKey: "", // "key" is a reserved keyword
        key: "",
        // the style for outmost div
        // these properties are explicitly defined in style because they are
        // (1) different from default CSS settings, or
        // (2) they may be modified
        style: {
            position: "absolute",
            display: "inline-flex",
            backgroundColor: "rgba(255, 255,255, 1)",
            left: 0,
            top: 0,
            width: 500,
            height: 500,
            outlineStyle: "none",
            outlineWidth: 1,
            outlineColor: "black",
            transform: "rotate(0deg)",
            color: "rgba(0,0,0,1)",
            borderStyle: "solid",
            borderWidth: 0,
            borderColor: "rgba(255, 0, 0, 1)",
            fontFamily: GlobalVariables.defaultFontFamily,
            fontSize: GlobalVariables.defaultFontSize,
            fontStyle: GlobalVariables.defaultFontStyle,
            fontWeight: GlobalVariables.defaultFontWeight,
        },
        // the ElementBody style
        text: {
            horizontalAlign: "flex-start",
            verticalAlign: "flex-start",
            wrapWord: true,
            showUnit: false,
            alarmBorder: true,
            highlightBackgroundColor: "rgba(255, 255, 0, 1)",
            overflowVisible: true,
            channelPropertyNames: [],
            EPICS_CA_SERVER_PORT: 5064,
        },
        channelNames: [],
        groupNames: [],
        rules: [],
        macros: [],
    };

    // override
    static generateDefaultTdl = (type: string) => {
        // defines type, widgetKey, and key
        const result = super.generateDefaultTdl(type) as type_Casw_tdl;
        result.style = JSON.parse(JSON.stringify(this._defaultTdl.style));
        result.text = JSON.parse(JSON.stringify(this._defaultTdl.text));
        result.channelNames = JSON.parse(JSON.stringify(this._defaultTdl.channelNames));
        result.groupNames = JSON.parse(JSON.stringify(this._defaultTdl.groupNames));
        result.macros = JSON.parse(JSON.stringify(this._defaultTdl.macros));
        return result;
    };

    // static method for generating a widget tdl with external PV name
    // not the
    static generateWidgetTdl = (utilityOptions: Record<string, any>): type_Casw_tdl => {
        const result = this.generateDefaultTdl("Casw");
        result["text"]["EPICS_CA_REPEATER_PORT"] = utilityOptions["EPICS_CA_REPEATER_PORT"];
        return result;
    };

    // --------------------- getters -------------------------

    // defined in super class
    // getType()
    // getWidgetKey()
    // getStyle()
    // getText()
    // getSidebar()
    // getGroupName()
    // getGroupNames()
    // getupdateFromWidget()
    // getResizerStyle()
    // getResizerStyles()

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
        // if (this._sidebar === undefined) {
        //     this._sidebar = new PvTableSidebar(this);
        // }
    }
    jobsAsEditingModeBegins() {
        super.jobsAsEditingModeBegins();
        this.stopCaswServer();
    }
    jobsAsOperatingModeBegins() {
        super.jobsAsOperatingModeBegins();
        this.startCaswServer();
    }
}
