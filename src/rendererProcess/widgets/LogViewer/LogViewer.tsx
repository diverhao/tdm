import { getMouseEventClientY, GlobalVariables } from "../../../common/GlobalVariables";
import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { Table } from "../../helperWidgets/Table/Table";
import { convertEpochTimeToString } from "../../../common/GlobalMethods";
import { ElementRectangleButton } from "../../helperWidgets/SharedElements/RectangleButton";
import { type_logData } from "../../../common/IpcEventArgType";

export type type_LogViewer_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
};

export class LogViewer extends BaseWidget {
    showProcessInfo = false;

    memoId: string = "";

    _table: Table;
    forceUpdateTable: any = undefined;
    _ElementTableCell: ({ children, columnIndex, additionalStyle }: any) => React.JSX.Element;
    _ElementTableLine: ({ children, additionalStyle, lineIndex }: any) => React.JSX.Element;
    _ElementTableHeaderResizer: ({ columnIndex }: any) => React.JSX.Element;
    _ElementTableLineMemo: React.MemoExoticComponent<(input: any) => React.JSX.Element>;
    tableRef: React.MutableRefObject<any> | undefined = undefined;

    private _logData: type_logData[] = [];

    private showSettings: boolean = false;

    constructor(widgetTdl: type_LogViewer_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this.setReadWriteType("write");

        // assign the sidebar
        // this._sidebar = new ProfilesViewerSidebar(this);
        this._table = new Table([GlobalVariables.defaultFontSize * 5, GlobalVariables.defaultFontSize * 30, GlobalVariables.defaultFontSize * 40, GlobalVariables.defaultFontSize * 30, GlobalVariables.defaultFontSize * 10], this);
        this._ElementTableCell = this.getTable().getElementTableCell();
        this._ElementTableLine = this.getTable().getElementTableLine();
        this._ElementTableLineMemo = this.getTable().getElementTableLineMemo();
        this._ElementTableHeaderResizer = this.getTable().getElementTableHeaderResizer();
    }

    // ------------------------------ elements ---------------------------------

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
                </>
            </ErrorBoundary>
        );
    };

    _ElementBodyRaw = (): React.JSX.Element => {
        return (
            <div
                style={
                    this.getElementBodyRawStyle()
                }
            >
                <this._ElementArea></this._ElementArea>
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
                <this._ElementLogViewer></this._ElementLogViewer>
                {this.showSettings ? <this._ElementSettings></this._ElementSettings> : null}
            </div>
        );
    };

    _ElementLogViewer = () => {
        React.useEffect(() => {
            const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient()
            displayWindowClient.getIpcManager().sendFromRendererProcess("register-log-viewer", {
                displayWindowId: displayWindowClient.getWindowId(),
                widgetKey: this.getWidgetKey(),
            })
        }, [])
        return (
            <div style={{
                display: "inline-flex",
                width: "100%",
                height: "100%",
                flexDirection: "column",
            }}>
                <this._ElementHeader></this._ElementHeader>
                <this._ElementFilters></this._ElementFilters>
                <this._ElementTable></this._ElementTable>
            </div>
        )
    }

    _ElementHeader = () => {
        return (<div style={{
            width: "100%",
            display: "inline-flex",
            flexDirection: "column",
        }}>
            <div style={{ fontSize: 30 }}>
                Log Viewer
            </div>
            <div style={{
                color: "rgba(100, 100, 100, 1)",
                boxSizing: "border-box",
                paddingTop: 20,
                paddingBottom: 20,
            }}>
                You are viewing the TDM log.
            </div>
        </div>
        )
    }


    _ElementFilters = () => {
        // const [filteredChannelName, setFilteredChannelName] = React.useState(this.filteredChannelName);
        // const [filteredIp, setFilteredIp] = React.useState(this.filteredIp);
        // const [filteredPort, setFilteredPort] = React.useState(this.filteredPort);
        // const selectRef = React.useRef<any>(null);
        return (
            <div style={{
                display: "inline-flex",
                flexDirection: "column",
                width: "100%",
                boxSizing: "border-box",
                paddingBottom: 20,
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
                    flexDirection: "row-reverse",
                }}
                >
                </div>
            </div >
        )
    }


    _ElementTable = () => {
        const tableRef = React.useRef<any>(null);

        this.tableRef = tableRef;

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
                display: "inline-flex",
                flexDirection: "column",
                flexWrap: "nowrap",
                justifyContent: "flex-start",
                alignItems: 'center',
                overflowY: "scroll",
                overflowX: "scroll",
                border: "solid 1px rgba(0,0,0,1)",
                boxSizing: 'border-box',
                userSelect: "none",
                cursor: "default",
            }}>
            {/* header */}
            <this._ElementTableLine key={`table-header`} additionalStyle={{ width: tableRef.current === null ? "100%" : tableRef.current.scrollWidth }}>
                <this._ElementTableCell columnIndex={0} additionalStyle={{ justifyContent: "space-between", minWidth: this.getAllStyle()["fontSize"] * 15 }}>
                    Time
                    {/* resizer */}
                    <this._ElementTableHeaderResizer columnIndex={0}></this._ElementTableHeaderResizer>
                </this._ElementTableCell>
                <this._ElementTableCell columnIndex={1} additionalStyle={{ justifyContent: "space-between", width: this.getAllStyle()["fontSize"] * 10 }}>
                    Process
                    {/* resizer */}
                    <this._ElementTableHeaderResizer columnIndex={1}></this._ElementTableHeaderResizer>
                </this._ElementTableCell>
                <this._ElementTableCell columnIndex={2} additionalStyle={{ justifyContent: "space-between", width: this.getAllStyle()["fontSize"] * 10 }}>
                    Type
                    {/* resizer */}
                    <this._ElementTableHeaderResizer columnIndex={2}></this._ElementTableHeaderResizer>
                </this._ElementTableCell>
                <this._ElementTableCell columnIndex={3} additionalStyle={{ justifyContent: "space-between" }}>
                    Content
                    {/* resizer */}
                    <this._ElementTableHeaderResizer columnIndex={3}></this._ElementTableHeaderResizer>
                </this._ElementTableCell>
            </this._ElementTableLine>

            {/* data lines */}
            {this.getLogData().map((data: type_logData, index: number) => {
                let content = "";
                for (let arg of data["args"]) {
                    if (typeof arg === "string") {
                        content = content + " " + arg;
                    } else {
                        content = content + " " + JSON.stringify(arg);
                    }
                }
                const timeStr = convertEpochTimeToString(data["timeMsSinceEpoch"]);
                return (
                    <this._ElementTableLine
                        key={`${timeStr}-${data["type"]}-${this.memoId}-${index}`}
                        lineIndex={index}
                        additionalStyle={{
                            overflowX: "visible",
                        }}
                    >
                        <this._ElementTableCell columnIndex={0} additionalStyle={{ justifyContent: "space-between", minWidth: this.getAllStyle()["fontSize"] * 15 }}>
                            {timeStr}
                        </this._ElementTableCell>
                        <this._ElementTableCell columnIndex={1} additionalStyle={{ justifyContent: "space-between", width: this.getAllStyle()["fontSize"] * 10 }}>
                            {data["profileName"]}
                        </this._ElementTableCell>
                        <this._ElementTableCell columnIndex={2} additionalStyle={{ justifyContent: "space-between", width: this.getAllStyle()["fontSize"] * 10 }}>
                            {data["type"]}
                        </this._ElementTableCell>
                        <this._ElementTableCell columnIndex={3} additionalStyle={{ justifyContent: "space-between", overflow: "visible" }}>
                            {content}
                        </this._ElementTableCell>
                    </this._ElementTableLine>

                )
            })}
        </div>
        )
    }

    _ElementSettings = () => {
        const [maxLineNum, setMaxLineNum] = React.useState<number>(parseFloat(this.getText()["maxLineNum"]));
        return (
            <div style={{
                width: "100%",
                height: "100%",
                position: "absolute",
                backgroundColor: "rgba(255,255,255,1)",
                boxSizing: "border-box",
                padding: 5,
            }}>
                {/* buffer limit */}
                <form onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                    event.preventDefault();

                    const oldVal = this.getText()["maxLineNum"];
                    if (maxLineNum === oldVal) {
                        return;
                    } else {
                        this.getText()["maxLineNum"] = maxLineNum;
                        if (this.getLogData().length > maxLineNum) {
                            this.getLogData().splice(0, this.getLogData().length - maxLineNum)
                        }
                    }
                    // we do this only in operating mode, no history recorded
                    // const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
                    // history.registerAction();

                    g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
                    // g_widgets1.addToForceUpdateWidgets("GroupSelection2");

                    g_flushWidgets();

                }}>
                    <div
                        style={{
                            paddingBottom: 5,
                            boxSizing: "border-box",
                        }}>
                        Max number of lines:
                    </div>
                    <input
                        style={{
                            borderRadius: 0,
                            border: "solid 1px black",
                            outline: "none",
                            marginBottom: 5,
                        }}
                        type="number"
                        name="maxLineNum"
                        value={maxLineNum}
                        step="any"
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                            const newVal = event.target.value;
                            setMaxLineNum(parseFloat(newVal));
                        }}
                        readOnly={this.getText()["usePvLimits"] ? true : false}
                        // must use enter to change the value
                        onBlur={(event: any) => {
                            if (parseFloat(this.getText()["maxLineNum"]) !== maxLineNum) {
                                setMaxLineNum(parseFloat(this.getText()["maxLineNum"]));
                            }
                        }}
                    />
                </form>

                {/* OK button*/}
                <ElementRectangleButton
                    handleClick={() => {
                        this.showSettings = false;
                        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
                        g_flushWidgets();
                    }}
                >
                    OK
                </ElementRectangleButton>
            </div>
        )
    }

    addNewLogData = (data: {
        widgetKey: string,
        timeMsSinceEpoch: number,
        profileName: string,
        type: "fatal" | "error" | "warn" | "info" | "debug" | "trace",
        args: any[],
    }) => {
        this._logData.push(data);

        if (this.getLogData().length > this.getAllText()["maxLineNum"]) {
            this.getLogData().shift();
            // reduce selected lines by 1
            for (let ii = 0; ii < this.getTable().selectedLines.length; ii++) {
                this.getTable().selectedLines[ii] = this.getTable().selectedLines[ii] - 1;
                if (this.getTable().selectedLines[ii] < 0) {
                    this.getTable().selectedLines.splice(ii, 1);
                }
            }
        }


        this.forceUpdateTable();
        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        g_flushWidgets();
    }

    clearLogData = () => {
        this.getLogData().length = 0;
    }

    // concretize abstract method
    _Element = React.memo(this._ElementRaw, () => this._useMemoedElement());
    _ElementArea = React.memo(this._ElementAreaRaw, () => this._useMemoedElement());
    _ElementBody = React.memo(this._ElementBodyRaw, () => this._useMemoedElement());

    // defined in super class
    // getElement()
    // getSidebarElement()

    // -------------------- helper functions ----------------

    // defined in super class
    // showSidebar()
    // showResizers()
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
    getTable = () => {
        return this._table;
    }

    getLogData = () => {
        return this._logData;
    }

    mouseEventInsideTable = (ponterX: number, pointerY: number) => {
        return true;
    }


    mouseRightButtonDownContextMenuActions: {
        "Clear data": any,
        "Copy selected data": any,
        "Copy all data": any,
        "Save selected data": any
        "Save all data": any,
        "Unselect data": any,
        "Set buffer limit": any,
    } = {
            "Copy selected data": () => {
                const result: type_logData[] = [];
                for (let index of this.getTable().selectedLines) {
                    const data = this.getLogData()[index];
                    result.push(data)
                }
                navigator.clipboard.writeText(JSON.stringify(result, null, 4));
            },
            "Copy all data": () => {
                navigator.clipboard.writeText(JSON.stringify(this.getLogData(), null, 4));
            },
            "Save selected data": () => {
                const result: type_logData[] = [];
                for (let index of this.getTable().selectedLines) {
                    const data = this.getLogData()[index];
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
                        data: this.getLogData(),
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
                this.clearLogData();
                g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
                g_flushWidgets();
            },
            "Set buffer limit": () => {
                this.showSettings = true;
                g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
                g_flushWidgets();
            },
        };


    // -------------------------- tdl -------------------------------

    static generateDefaultTdl = () => {

        const defaultTdl: type_LogViewer_tdl = {
            type: "LogViewer",
            widgetKey: "", // "key" is a reserved keyword
            key: "",
            // the style for outmost div
            // these properties are explicitly defined in style because they are
            // (1) different from default CSS settings, or
            // (2) they may be modified
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

                boxSizing: "border-box",
                overflow: "scroll",
            },
            // the ElementBody style
            text: {
                maxLineNum: 5000,
            },
            channelNames: [],
            groupNames: [],
            rules: [],
        };
        return JSON.parse(JSON.stringify(defaultTdl));
    };

    generateDefaultTdl: () => any = LogViewer.generateDefaultTdl;

    // static method for generating a widget tdl with external PV name
    static generateWidgetTdl = (utilityOptions: Record<string, any>): type_LogViewer_tdl => {
        const result = this.generateDefaultTdl();
        result.text = utilityOptions as Record<string, any>;
        return result;
    };
    
    // -------------------------- sidebar ---------------------------
    createSidebar = () => {
    }
}
