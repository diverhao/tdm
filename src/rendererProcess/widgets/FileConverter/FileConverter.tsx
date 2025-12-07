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
import { convertDateObjToString } from "../../../common/GlobalMethods";
import { ElementRectangleButton, ElementRectangleButtonDefaultBackgroundColor } from "../../helperWidgets/SharedElements/RectangleButton";
import { Log } from "../../../common/Log";


export type type_FileConverterData = {
    srcFileName: string,
    destFileName: string,
    status: "success" | "converting" | "failed",
    timeDurationMs: number, // ms
    numWidgetsOrig: number, // number of widgets in edl file
    numWidgetsTdl: number, // number of widgets in tdl file
}

export type type_FileConverter_tdl = {
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

export class FileConverter extends BaseWidget {
    // -------------------------------------------

    _macros: [string, string][] = [];
    _table: Table;

    setMacros = (newMacros: [string, string][]) => {
        this._macros = newMacros;
    };

    getMacros = () => {
        return this._macros;
    };

    t0: number = 0;

    // _CaProtoRsrvIsUpData: type_CaProtoRsrvIsUpData[] = [];
    // getCaProtoRsrvIsUpData = () => {
    //     return this._CaProtoRsrvIsUpData;
    // }
    // clearCaProtoRsrvIsUpData = () => {
    //     this.getCaProtoRsrvIsUpData().length = 0;
    // }

    memoId: string = "";

    forceUpdateTable: any = undefined;

    _ElementTableCell: ({ children, columnIndex, additionalStyle }: any) => React.JSX.Element;
    _ElementTableLine: ({ children, additionalStyle, lineIndex }: any) => React.JSX.Element;
    _ElementTableHeaderResizer: ({ columnIndex }: any) => React.JSX.Element;
    _ElementTableLineMemo: React.MemoExoticComponent<(input: any) => React.JSX.Element>;

    data: type_FileConverterData[] = [];
    // true: show the data
    // false: do not show the data
    filteredData: boolean[] = [];

    setStatus: any = undefined;
    timer: any = undefined;
    setTime: any = undefined;
    setFilterText: any = undefined;
    filterText: string = "";

    constructor(widgetTdl: type_FileConverter_tdl) {
        super(widgetTdl);
        this.setStyle({ ...FileConverter._defaultTdl.style, ...widgetTdl.style });
        this.setText({ ...FileConverter._defaultTdl.text, ...widgetTdl.text });
        this.setMacros(JSON.parse(JSON.stringify(widgetTdl.macros)));

        // columns: ms since epoch, channel name, ip, port
        this._table = new Table([GlobalVariables.defaultFontSize * 5, GlobalVariables.defaultFontSize * 30, GlobalVariables.defaultFontSize * 40, GlobalVariables.defaultFontSize * 30, GlobalVariables.defaultFontSize * 10], this);
        this._ElementTableCell = this.getTable().getElementTableCell();
        this._ElementTableLine = this.getTable().getElementTableLine();
        this._ElementTableLineMemo = this.getTable().getElementTableLineMemo();
        this._ElementTableHeaderResizer = this.getTable().getElementTableHeaderResizer();
        // no sidebar
        // this._sidebar = new PvTableSidebar(this);

    }




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

    _ElementBodyRaw = (): React.JSX.Element => {
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
    _ElementAreaRaw = ({ }: any): React.JSX.Element => {
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
                <this._ElementFileConverter></this._ElementFileConverter>
            </div>
        );
    };

    _ElementFileConverter = () => {
        return <div
            style={{
                display: "inline-flex",
                width: "100%",
                height: "100%",
                flexDirection: "column",
                userSelect: "none",
            }}>
            <this._ElementHeader></this._ElementHeader>
            <this._ElementSrcSelection></this._ElementSrcSelection>
            <this._ElementDestSelection></this._ElementDestSelection>
            <this._ElementFolderRecursionDepth></this._ElementFolderRecursionDepth>
            <this._ElementStartStop></this._ElementStartStop>
            <this._ElementDataTable></this._ElementDataTable>
        </div>
    }

    _ElementStartStop = () => {
        const [status, setStatus] = React.useState<"standby" | "converting">("standby");
        const [time, setTime] = React.useState(0); // second
        const [filterText, setFilterText] = React.useState("");
        this.setTime = setTime;
        this.setStatus = setStatus;
        this.setFilterText = setFilterText;
        return (
            <div style={{
                width: "100%",
                boxSizing: "border-box",
                marginTop: 10,
                marginBottom: 10,
                display: "inline-flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
            }}>
                <div style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "flex-start",
                }}>
                    <ElementRectangleButton
                        handleClick={(event: any) => {
                            event.preventDefault();
                            if (status === "standby") {
                                // clicked Start
                                setStatus("converting");
                                // clear data, always start from scratch, no resume
                                this.data = [];
                                if (this.forceUpdateTable !== undefined) {
                                    this.forceUpdateTable();
                                }
                                // start timer
                                setTime(0);
                                this.timer = setInterval(() => {
                                    this.setTime((oldValue: number) => {
                                        return oldValue + 1;
                                    });
                                }, 1000)
                                // tell main process to start the thread
                                g_widgets1.getRoot().getDisplayWindowClient().getIpcManager().sendFromRendererProcess("file-converter-command",
                                    {
                                        command: "start",
                                        src: this.getSrc(),
                                        dest: this.getDest(),
                                        depth: this.getDepth(),
                                        displayWindowId: g_widgets1.getRoot().getDisplayWindowClient().getWindowId(),
                                        widgetKey: this.getWidgetKey(),
                                    }
                                )
                            } else {
                                // clicked Stop
                                setStatus("standby");
                                g_widgets1.getRoot().getDisplayWindowClient().getIpcManager().sendFromRendererProcess("file-converter-command",
                                    {
                                        command: "stop",
                                    }
                                )
                                // stop timer
                                if (this.timer !== undefined) {
                                    clearInterval(this.timer);
                                }
                                // update the data
                                for (let ii = this.getData().length - 1; ii >= 0; ii--) {
                                    const data = this.getData()[ii];
                                    if (data["status"] === "converting") {
                                        data["status"] = "failed";
                                    }
                                }
                                if (this.forceUpdateTable !== undefined) {
                                    this.forceUpdateTable();
                                }
                            }
                        }}
                    >
                        {status === "standby" ? "Start" : "Stop"}
                    </ElementRectangleButton>
                    <div style={{
                        marginLeft: 20
                    }}>
                        {status === "standby" ? "" : "Converting ..."}
                    </div>
                    <div style={{
                        marginLeft: 20
                    }}>
                        {time === 0 ? "" : `Elapsed ${time} s`}
                    </div>
                </div>
                <div style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "flex-end",
                }}>
                    Filter: &nbsp;
                    <form onSubmit={(event: any) => {
                        event.preventDefault();
                        this.filterText = filterText;
                        // filter data
                        this.filterData();
                        if (this.forceUpdateTable) {
                            this.forceUpdateTable();
                        }
                    }}>
                        <input
                            value={filterText}
                            onChange={(event: any) => {
                                event.preventDefault();
                                const text = event.target.value;
                                setFilterText(text);
                            }}
                            spellCheck={false}
                            style={{
                                outline: "none",
                                borderRadius: 0,
                                border: "solid 1px rgba(0,0,0,1)",
                            }}
                        >
                        </input>
                    </form>
                </div>
            </div>
        )
    }

    filterData = () => {
        this.getFilteredData().length = 0;
        if (this.getFilterText() === "") {
            for (let ii = 0; ii < this.getData().length; ii++) {
                this.getFilteredData().push(true);
            }
        } else {
            for (let entry of this.getData()) {
                const srcFileName = entry["srcFileName"];
                const destFileName = entry["destFileName"];
                if (srcFileName.toUpperCase().includes(this.getFilterText().toUpperCase()) || destFileName.toUpperCase().includes(this.getFilterText().toUpperCase())) {
                    this.getFilteredData().push(true);
                } else {
                    this.getFilteredData().push(false);
                }
            }
        }
    }

    _ElementHeader = () => {
        return (
            <div style={{
                width: "100%",
                display: "inline-flex",
                flexDirection: "column",
            }}>
                <div style={{ fontSize: 30 }}>
                    File Converter
                </div>
                <div style={{
                    color: "rgba(100, 100, 100, 1)",
                    boxSizing: "border-box",
                    paddingTop: 20,
                    paddingBottom: 20,
                }}>
                    This tool converts the StripTool (.stp) and EDM file (.edl) to TDM (.tdl) file. You can select one file or a folder to convert.
                </div>
            </div>
        )
    }


    setSrc: any;
    setDest: any;
    src: string = "";
    dest: string = "";
    depth: number = 1;
    getSrc = () => {
        return this.src;
    }
    getDest = () => {
        return this.dest;
    }
    getDepth = () => {
        return this.depth;
    }
    _ElementSrcSelection = () => {
        const [src, setSrc] = React.useState("");
        this.setSrc = setSrc;
        return (
            <div
                style={{
                    display: "inline-flex",
                    width: "100%",
                    boxSizing: "border-box",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    marginTop: 5,
                    marginBottom: 5,
                }}
            >
                <div style={{ width: 150 }}>
                    Source file or folder:
                </div>
                <form onSubmit={(event: any) => {
                    event.preventDefault();
                }}
                    style={{ width: "40%" }}
                >
                    <input
                        value={src}
                        onChange={(event: any) => {
                            event.preventDefault();
                            const text = event.target.value;
                            setSrc(text);
                            this.src = src;
                        }}
                        // readOnly={this.getStatus() === "standby" ? false : true}
                        spellCheck={false}
                        style={{
                            width: "100%",
                            outline: "none",
                            borderRadius: 0,
                            border: "solid 1px rgba(0,0,0,1)",
                        }}
                    >
                    </input>
                </form>
                {g_widgets1.getRoot().getDisplayWindowClient().getOsType() === "linux" ? null :
                    <ElementRectangleButton
                        marginLeft={20}
                        handleClick={(event: any) => {
                            event.preventDefault();
                            // if (this.getStatus() === "converting") {
                            //     return;
                            // }
                            const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
                            const displayWindowId = displayWindowClient.getWindowId();
                            displayWindowClient.getIpcManager().sendFromRendererProcess("select-a-file",
                                // they will be bounced back and handled by handleSelectAFile below
                                {
                                    options: {
                                        displayWindowId: displayWindowId,
                                        widgetKey: this.getWidgetKey(),
                                        filterType: "file-converter",
                                        properties: ["openFile", "openDirectory"],
                                        inputType: "src",
                                    }
                                });

                        }}

                    >
                        Select a file or folder
                    </ElementRectangleButton>
                }
            </div >
        )
    }
    _ElementDestSelection = () => {
        const [dest, setDest] = React.useState("");
        this.setDest = setDest;
        return (
            <div
                style={{
                    display: "inline-flex",
                    width: "100%",
                    boxSizing: "border-box",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    marginTop: 5,
                    marginBottom: 5,
                }}
            >
                <div style={{ width: 150 }}>
                    Destination folder:
                </div>
                <form onSubmit={(event: any) => {
                    event.preventDefault();
                }}
                    style={{ width: "40%" }}
                >
                    <input
                        value={dest}
                        onChange={(event: any) => {
                            event.preventDefault();
                            const text = event.target.value;
                            setDest(text);
                            this.dest = text;
                        }}
                        // readOnly={this.getStatus() === "converting" ? true : false}
                        spellCheck={false}
                        style={{
                            width: "100%",
                            outline: "none",
                            borderRadius: 0,
                            border: "solid 1px rgba(0,0,0,1)",
                        }}
                    >
                    </input>
                </form>
                {g_widgets1.getRoot().getDisplayWindowClient().getOsType() === "linux" ? null :
                    // ! linux cannot properly allow user to select file or folder if "properties" is set
                    // ! meanwhile, if we set properties to "undefined", we can only select file, we cannot
                    // ! select folder. To avoid confusion, let's hide this button
                    <ElementRectangleButton
                        marginLeft={20}
                        handleClick={(event: any) => {
                            event.preventDefault();
                            // if (this.getStatus() === "converting") {
                            //     return;
                            // }
                            const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
                            const displayWindowId = displayWindowClient.getWindowId();

                            displayWindowClient.getIpcManager().sendFromRendererProcess("select-a-file",
                                // they will be bounced back and handled by handleSelectAFile below
                                {
                                    options: {
                                        displayWindowId: displayWindowId,
                                        widgetKey: this.getWidgetKey(),
                                        filterType: "file-converter",
                                        properties: ["openDirectory", "createDirectory", "promptToCreate"], // open folder and create directory
                                        inputType: "dest",
                                    }
                                });

                        }}
                    >
                        Select a folder
                    </ElementRectangleButton>
                }
            </div>
        )
    }

    _ElementFolderRecursionDepth = () => {
        const [depth, setDepth] = React.useState(1);
        return (
            <div
                style={{
                    display: "inline-flex",
                    width: "100%",
                    boxSizing: "border-box",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    marginTop: 5,
                    marginBottom: 5,
                }}
            >
                <div style={{ width: 150 }}>
                    Folder recursion depth:
                </div>
                <form onSubmit={(event: any) => {
                    event.preventDefault();
                }}
                    style={{ width: "40%" }}
                >
                    <input
                        value={`${depth}`}
                        onChange={(event: any) => {
                            event.preventDefault();
                            const text = event.target.value;
                            const value = parseInt(text);
                            if (!isNaN(value)) {
                                setDepth(value);
                                this.depth = value;
                            }
                        }}
                        spellCheck={false}
                        style={{
                            width: 30,
                            outline: "none",
                            borderRadius: 0,
                            border: "solid 1px rgba(0,0,0,1)",
                        }}
                    >
                    </input>
                </form>
            </div>
        )
    }

    handleSelectAFile = (options: {
        displayWindowId: string,
        widgetKey: string,
        filterType: "tdl",
        properties: ["openFile", "openDirectory"],
        inputType: "src" | "dest",
    }, fileName: string) => {
        if (options['inputType'] === "src") {
            if (this.setSrc !== undefined) {
                this.setSrc(fileName);
                this.src = fileName;
            }
        } else if (options['inputType'] === "dest") {
            if (this.setDest !== undefined) {
                this.setDest(fileName);
                this.dest = fileName;
            }
        }
    }

    handleNewData = (info: {
        type: "one-file-conversion-started" | "one-file-conversion-finished" | "all-file-conversion-finished",
        widgetKey: string,
        srcFileName?: string,
        destFileName?: string,
        status: "success" | "converting" | "failed",
        timeDurationMs?: number, // ms
        numWidgetsOrig?: number, // number of widgets in edl file
        numWidgetsTdl?: number, // number of widgets in tdl file
    }) => {
        const srcFileName = info["srcFileName"];
        const destFileName = info["destFileName"];
        const status = info["status"];
        const timeDurationMs = info["timeDurationMs"];
        const numWidgetsOrig = info["numWidgetsOrig"];
        const numWidgetsTdl = info["numWidgetsTdl"];
        if (info["type"] === "one-file-conversion-started") {
            if (srcFileName !== undefined && destFileName !== undefined && status === "converting") {
                // append the data entry
                const entry: type_FileConverterData = {
                    srcFileName: srcFileName,
                    destFileName: destFileName,
                    status: "converting",
                    timeDurationMs: -1, // ms
                    numWidgetsOrig: -1, // number of widgets in edl file
                    numWidgetsTdl: -1, // number of widgets in tdl file
                };
                this.getData().push(entry);
                if (this.getFilterText() !== "") {
                    if (srcFileName.toUpperCase().includes(this.getFilterText().toUpperCase()) || destFileName.toUpperCase().includes(this.getFilterText().toUpperCase())) {
                        this.getFilteredData().push(true);
                    } else {
                        this.getFilteredData().push(false);
                    }
                } else {
                    this.getFilteredData().push(true);
                }
                // update table
                if (this.forceUpdateTable !== undefined) {
                    this.forceUpdateTable();
                }
            }

        } else if (info["type"] === "one-file-conversion-finished") {
            // append the data entry
            if (srcFileName !== undefined && destFileName !== undefined && status === "success" && typeof timeDurationMs === "number" && typeof numWidgetsOrig === "number" && typeof numWidgetsTdl === "number") {
                // update data
                for (let ii = this.getData().length - 1; ii >= 0; ii--) {
                    const data = this.getData()[ii];
                    if (data["srcFileName"] === srcFileName) {
                        data["status"] = status;
                        data["timeDurationMs"] = timeDurationMs;
                        data["numWidgetsOrig"] = numWidgetsOrig;
                        data['numWidgetsTdl'] = numWidgetsTdl;
                        break;
                    }
                }
                // update table
                if (this.forceUpdateTable !== undefined) {
                    this.forceUpdateTable();
                }
            }
        } else if (info["type"] === "all-file-conversion-finished") {
            this.setStatus("standby")
            // stop timer
            if (this.timer !== undefined) {
                clearInterval(this.timer);
            }
        }
    }

    _ElementDataTable = () => {
        const tableRef = React.useRef<any>(null);

        // this.tableRef = tableRef;

        const [, forceUpdate] = React.useState({});
        this.forceUpdateTable = () => { forceUpdate({}) };
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
                // display: this.bottomView === "raw-data" ? "inline-flex" : "none",
                display: "inline-flex",
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
                    Soruce File
                    {/* resizer */}
                    <this._ElementTableHeaderResizer columnIndex={1}></this._ElementTableHeaderResizer>
                </this._ElementTableCell>
                <this._ElementTableCell columnIndex={2} additionalStyle={{ justifyContent: "space-between" }}>
                    Destination File
                    {/* resizer */}
                    <this._ElementTableHeaderResizer columnIndex={2}></this._ElementTableHeaderResizer>
                </this._ElementTableCell>
                <this._ElementTableCell columnIndex={3} additionalStyle={{ justifyContent: "space-between" }}>
                    Status
                    {/* resizer */}
                    <this._ElementTableHeaderResizer columnIndex={3}></this._ElementTableHeaderResizer>
                </this._ElementTableCell>
                <this._ElementTableCell columnIndex={4} additionalStyle={{ justifyContent: "space-between" }}>
                    Time Used
                    {/* resizer */}
                    <this._ElementTableHeaderResizer columnIndex={4}></this._ElementTableHeaderResizer>
                </this._ElementTableCell>
            </this._ElementTableLine>

            {/* data lines */}
            {this.getData().map((data: type_FileConverterData, index: number) => {
                if (this.getFilteredData()[index] === false) {
                    return null;
                } else {
                    // {
                    //     srcFileName: string,
                    //     destFileName: string,
                    //     status: "success" | "converting" | "failed",
                    //     timeDurationMs: number, // ms
                    //     numWidgetsOrig: number, // number of widgets in edl file
                    //     numWidgetsTdl: number, // number of widgets in tdl file
                    // }
                    return (
                        <this._ElementTableLine key={`${data["srcFileName"]}-${index}`} lineIndex={index}>
                            <this._ElementTableCell columnIndex={0} additionalStyle={{ justifyContent: "space-between" }}>
                                {index}
                            </this._ElementTableCell>
                            <this._ElementTableCell columnIndex={1} additionalStyle={{ justifyContent: "space-between" }}>
                                {data["srcFileName"]}
                            </this._ElementTableCell>
                            <this._ElementTableCell columnIndex={2} additionalStyle={{ justifyContent: "space-between" }}>
                                <div onMouseDown={() => {
                                    const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
                                    const displayWindowId = displayWindowClient.getWindowId();
                                    displayWindowClient.getIpcManager().sendFromRendererProcess("open-tdl-file", {
                                        options: {
                                            // tdl?: type_tdl;
                                            tdlFileNames: [data["destFileName"]],
                                            mode: "operating",
                                            editable: true,
                                            // external macros: user-provided and parent display macros
                                            macros: [],
                                            replaceMacros: false,
                                            // currentTdlFolder?: string;
                                            windowId: displayWindowId,
                                        }
                                    })
                                }}
                                    style={{
                                        cursor: "pointer",
                                    }}
                                >
                                    {data["destFileName"]}
                                </div>
                            </this._ElementTableCell>
                            <this._ElementTableCell columnIndex={3} additionalStyle={{ justifyContent: "space-between" }}>
                                {data["status"]}
                            </this._ElementTableCell>
                            <this._ElementTableCell columnIndex={4} additionalStyle={{ justifyContent: "space-between" }}>
                                {data["timeDurationMs"] < 0 ? "" : `${data["timeDurationMs"]} ms`}
                            </this._ElementTableCell>
                        </this._ElementTableLine>
                    )
                }
            })}
        </div>
        )
    }


    getTdlCopy = (newKey: boolean = true): Record<string, any> => {
        const result = super.getTdlCopy(newKey);
        // result.fieldNames = this.getStrippedFieldNames();
        result.macros = JSON.parse(JSON.stringify(this.getMacros()));
        result.channelNames = JSON.parse(JSON.stringify(this.getChannelNamesLevel0()));
        return result;
    };

    getData = () => {
        return this.data;
    }

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
    mouseEventInsideTable = (ponterX: number, pointerY: number) => {
        return true;
    }
    getTable = () => {
        return this._table;
    }

    getFilteredData = () => {
        return this.filteredData;
    }


    getFilterText = () => {
        return this.filterText;
    }



    mouseRightButtonDownContextMenuActions: {
        // "Clear data": any,
        "Copy selected data": any,
        "Copy all data": any,
        "Save selected data": any
        "Save all data": any,
        "Unselect data": any,
        // "Set buffer limit": any,
    } = {
            "Copy selected data": () => {
                const result: type_FileConverterData[] = [];
                for (let index of this.getTable().selectedLines) {
                    const data = this.getData()[index];
                    result.push(data)
                }
                navigator.clipboard.writeText(JSON.stringify(result, null, 4));
            },
            "Copy all data": () => {
                navigator.clipboard.writeText(JSON.stringify(this.getData(), null, 4));
            },
            "Save selected data": () => {
                const result: type_FileConverterData[] = [];
                for (let index of this.getTable().selectedLines) {
                    const data = this.getData()[index];
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
                        data: this.getData(),
                        preferredFileTypes: ["json"],
                    }
                )
            },
            "Unselect data": () => {
                this.getTable().selectedLines.length = 0;
                g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
                g_flushWidgets();
            },
            // "Clear data": () => {
            //     this.clearData();
            //     g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
            //     g_flushWidgets();
            // },
            // "Set buffer limit": () => {
            //     this.showSettings = true;
            //     g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
            //     g_flushWidgets();
            // },
        };

    // setStatus = (newStatus: "standby" | "converting") => {
    //     this.status = newStatus;
    // }
    // ----------------------- styles -----------------------

    // defined in super class

    // _resizerStyle
    // _resizerStyles
    // StyledToolTipText
    // StyledToolTip

    // -------------------------- tdl -------------------------------

    // override BaseWidget
    static _defaultTdl: type_FileConverter_tdl = {
        type: "FileConverter",
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
        const result = super.generateDefaultTdl(type) as type_FileConverter_tdl;
        result.style = JSON.parse(JSON.stringify(this._defaultTdl.style));
        result.text = JSON.parse(JSON.stringify(this._defaultTdl.text));
        result.channelNames = JSON.parse(JSON.stringify(this._defaultTdl.channelNames));
        result.groupNames = JSON.parse(JSON.stringify(this._defaultTdl.groupNames));
        result.macros = JSON.parse(JSON.stringify(this._defaultTdl.macros));
        return result;
    };

    // static method for generating a widget tdl with external PV name
    // not the
    static generateWidgetTdl = (utilityOptions: Record<string, any>): type_FileConverter_tdl => {
        const result = this.generateDefaultTdl("FileConverter");
        // result["text"]["EPICS_CA_REPEATER_PORT"] = utilityOptions["EPICS_CA_REPEATER_PORT"];
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
    // jobsAsEditingModeBegins() {
    //     super.jobsAsEditingModeBegins();
    //     this.stopCaswServer();
    // }
    // jobsAsOperatingModeBegins() {
    //     super.jobsAsOperatingModeBegins();
    //     this.startCaswServer();
    // }
}
