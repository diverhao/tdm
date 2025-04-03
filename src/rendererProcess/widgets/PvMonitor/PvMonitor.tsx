import * as React from "react";
import { MouseEvent } from "react";
import { convertDateObjToString } from "../../global/GlobalMethods";
import { GlobalVariables, g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { GroupSelection2 } from "../../helperWidgets/GroupSelection/GroupSelection2";
import { PvMonitorSidebar } from "./PvMonitorSidebar";
import * as GlobalMethods from "../../global/GlobalMethods";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
// import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary"
import { Table } from "../../helperWidgets/Table/Table";
import { ElementRectangleButton } from "../../helperWidgets/SharedElements/RectangleButton";
import { Log } from "../../../mainProcess/log/Log";


export type type_PvMonitor_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
};

type type_data = {
    time: string,
    contents: string,
}

export class PvMonitor extends BaseWidget {
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

    // 2 columns: time stamp and data
    _table: Table;
    _ElementTableCell: ({ children, columnIndex, additionalStyle }: any) => React.JSX.Element;
    _ElementTableLine: ({ children, additionalStyle, lineIndex }: any) => React.JSX.Element;
    _ElementTableHeaderResizer: ({ columnIndex }: any) => React.JSX.Element;
    _ElementTableLineMemo: React.MemoExoticComponent<(input: any) => React.JSX.Element>;
    _data: type_data[] = [{ time: "123", contents: "ABC" }, { time: "456", contents: "DEF" }, { time: "789", contents: "GHI" }];
    lineHeight: number;
    dataOffset: number = 0;
    showSettings: boolean = false;
    constructor(widgetTdl: type_PvMonitor_tdl) {
        super(widgetTdl);
        this.setReadWriteType("write");

        this.setStyle({ ...PvMonitor._defaultTdl.style, ...widgetTdl.style });
        this.setText({ ...PvMonitor._defaultTdl.text, ...widgetTdl.text });

        this._table = new Table(this.initColumnWidths(), this);
        this.lineHeight = this.getStyle()["fontSize"] * 1.5;

        this._ElementTableCell = this.getTable().getElementTableCell();
        this._ElementTableLine = this.getTable().getElementTableLine();
        this._ElementTableHeaderResizer = this.getTable().getElementTableHeaderResizer();
        this._ElementTableLineMemo = this.getTable().getElementTableLineMemo();

        // this._rules = new TextUpdateRules(this, widgetTdl);

        // this._sidebar = new TextUpdateSidebar(this);
    }
    initColumnWidths = () => {
        const result: number[] = [];
        const firstColumnWidth = "30%"; this.getAllStyle()["width"] * 0.2;
        const secondColumnWidth = "30%"; this.getAllStyle()["width"] * 0.7;
        result.push(this.getStyle()["fontSize"] * 15);
        result.push(200);
        return result;
    }

    getTable = () => {
        return this._table;
    }

    getData = () => {
        return this._data;
    }

    clearData = () => {
        this._data.length = 0;
    }

    updateDataUponRender = () => {
        const channelName = this.getChannelNames()[0];
        const lastData = this.getData()[this.getData().length - 1];
        try {
            const tcaChannel = g_widgets1.getTcaChannel(channelName);
            const dbrData = tcaChannel.getDbrData();
            let timeRaw = tcaChannel.getTimeStamp();
            let time = "undefined";
            if (timeRaw instanceof Date) {
                time = convertDateObjToString(timeRaw);
            }
            if (time === "undefined") {
                return;
            }
            const contents = `${dbrData["value"]}`;
            if (lastData !== undefined) {
                const lastTime = lastData["time"];
                const lastContents = lastData["contents"];
                if (contents !== lastContents || lastTime !== time) {
                    this.getData().push(
                        {
                            time: time,
                            contents: contents,
                        }
                    )
                }
            } else {
                this.getData().push(
                    {
                        time: time,
                        contents: contents,
                    }
                )
            }
            if (this.getData().length > this.getAllText()["maxLineNum"]) {
                this.getData().shift();
                this.dataOffset = this.dataOffset + 1;
                // reduce selected lines by 1
                for (let ii = 0; ii < this.getTable().selectedLines.length; ii++) {
                    this.getTable().selectedLines[ii] = this.getTable().selectedLines[ii] - 1;
                    if (this.getTable().selectedLines[ii] < 0) {
                        this.getTable().selectedLines.splice(ii, 1);
                    }
                }
            }
        } catch (e) {
            Log.error(e);
        }
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
            <ErrorBoundary style={this.getStyle()} widgetKey={this.getWidgetKey()} >
                <>
                    <this._ElementBody></this._ElementBody>
                    {this._showSidebar() ? this._sidebar?.getElement() : null}
                </>
            </ErrorBoundary>
        );
    };


    getElementFallbackFunction = () => {
        return this._ElementFallback;
    }

    // Text area and resizers
    _ElementBodyRaw = (): JSX.Element => {
        return (
            // always update the div below no matter the TextUpdateBody is .memo or not
            // TextUpdateResizer does not update if it is .memo
            <div style={this.getElementBodyRawStyle()} >
                <this._ElementArea></this._ElementArea>
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
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    userSelect: "none",
                    overflow: "hidden",
                    whiteSpace: this.getAllText().wrapWord ? "normal" : "pre",
                    justifyContent: this.getAllText().horizontalAlign,
                    alignItems: this.getAllText().verticalAlign,
                    fontFamily: this.getAllStyle().fontFamily,
                    fontSize: this.getAllStyle().fontSize,
                    fontStyle: this.getAllStyle().fontStyle,
                    fontWeight: this.getAllStyle().fontWeight,
                    outline: this._getElementAreaRawOutlineStyle(),
                    color: this.getAllStyle()["color"],
                }}
                // title={"tooltip"}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                <this._ElementPvMonitor></this._ElementPvMonitor>
                {this.showSettings ? <this._ElementSettings></this._ElementSettings> : null}
                {g_widgets1.isEditing() === true ? <this._ElementMask></this._ElementMask> : null}
            </div>
        );
    };

    _ElementMask = () => {
        return (
            <div style={{
                width: "100%",
                height: "100%",
                position: "absolute",
                backgroundColor: "rgba(255,0,0,0)",
            }}>

            </div>
        )
    }

    calcLazyRendering = (tableRef: any) => {

        if (!g_widgets1.isEditing()) {
            this.getTable().toBeUpdatedLineIndices = [...this.getTable().forceUpdatedRows];
        }

        if (!g_widgets1.isEditing() && tableRef.current !== null) {
            const scrollHeight = tableRef.current.scrollHeight;
            const scrollTop = tableRef.current.scrollTop;
            const boxSizes = tableRef.current.getBoundingClientRect();
            const widgetHeight = boxSizes["bottom"] - boxSizes["y"];

            if (scrollTop !== undefined) {
                const iStart = Math.floor(scrollTop / this.lineHeight);
                const iEnd = Math.ceil((scrollTop + widgetHeight) / this.lineHeight);
                this.getTable().toBeUpdatedLineIndices.push(...Array.from({ length: iEnd - iStart + 1 }, (_, index) => iStart + index));
            }
        }
        this.getTable().forceUpdatedRows = [];
    }

    _ElementPvMonitor = () => {
        const tableRef = React.useRef<any>(null);
        const [, forceUpdate] = React.useState({});
        this.getTable().updateForceUpdateTableFunc(() => {
            forceUpdate({});
        });
        this.updateDataUponRender();

        React.useEffect(() => {
            if (tableRef.current !== null) {
                const scrollHeight = tableRef.current.scrollHeight;
                const scrollTop = tableRef.current.scrollTop;
                const boxSizes = tableRef.current.getBoundingClientRect();
                const widgetHeight = boxSizes["bottom"] - boxSizes["y"];
                const scrollBottom = scrollHeight - scrollTop - widgetHeight;
                const fontSize = this.getAllStyle()["fontSize"];
                if (scrollBottom < fontSize * 3) {
                    tableRef.current.scrollTo(0, scrollHeight);
                }
            }
        })

        this.calcLazyRendering(tableRef);
        return (
            <div
                ref={tableRef}
                style={{
                    // width: this.calcTableWidth(),
                    width: "100%",
                    height: "100%",
                    // fontFamily: GlobalVariables.defaultFontFamily,
                    // fontSize: GlobalVariables.defaultFontSize,
                    // fontWeight: GlobalVariables.defaultFontWeight,
                    // fontStyle: GlobalVariables.defaultFontStyle,
                    fontFamily: this.getAllStyle()["fontFamily"],
                    fontSize: this.getAllStyle()["fontSize"],
                    fontWeight: this.getAllStyle()["fontWeight"],
                    fontStyle: this.getAllStyle()["fontStyle"],
                    display: 'inline-flex',
                    flexDirection: "column",
                    flexWrap: "nowrap",
                    justifyContent: "flex-start",
                    alignItems: 'center',
                    // scroll bar is here
                    overflowY: "scroll",
                    overflowX: "hidden",
                    boxSizing: "border-box",
                    paddingLeft: 10,
                    paddingRight: 10,
                    paddingBottom: 10,
                }}>
                <div style={{
                    width: "100%",
                    position: "sticky",
                    top: 0,
                    backgroundColor: "rgba(255, 255, 255,1)",
                    boxSizing: "border-box",
                    paddingBottom: 5,
                    display: "inline-flex",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    alignItems: 'center',
                }}>
                    <this._ElementTitle></this._ElementTitle>
                    <div style={{
                        width: "100%",
                        height: 5,
                        borderTop: "solid 3px rgba(180, 180, 180, 1)",
                    }}></div>
                    {/* header line */}
                    <this._ElementTableLine>
                        {/* Time Stamp */}
                        <this._ElementTableCell columnIndex={0} additionalStyle={{ justifyContent: "space-between" }}>
                            {/* content */}
                            Time
                            {/* resizer */}
                            <this._ElementTableHeaderResizer columnIndex={0}></this._ElementTableHeaderResizer>
                        </this._ElementTableCell>
                        {/* Contents */}
                        <this._ElementTableCell columnIndex={1} additionalStyle={{ justifyContent: "space-between" }}>
                            Value
                            {/* resizer */}
                            <this._ElementTableHeaderResizer columnIndex={1}></this._ElementTableHeaderResizer>
                        </this._ElementTableCell>
                        {/* PV fields  */}
                    </this._ElementTableLine>
                </div>
                {/* content lines */}
                {
                    this.getData().map((data: type_data, index: number) => {
                        const time = data["time"];
                        const contents = data["contents"];
                        return (
                            <this._ElementTableLineMemo
                                key={`${time}-${index + this.dataOffset}`}
                                lineIndex={index}
                            >
                                {/* Time Stamp */}
                                <this._ElementTableCell columnIndex={0} additionalStyle={{ justifyContent: "space-between" }}>
                                    {/* content */}
                                    {time}
                                </this._ElementTableCell>
                                {/* Contents */}
                                <this._ElementTableCell columnIndex={1} additionalStyle={{ justifyContent: "space-between" }}>
                                    {contents}
                                </this._ElementTableCell>
                            </this._ElementTableLineMemo>
                        )
                    })
                }
            </div >
        )
    }

    _ElementTitle = () => {
        const inputRef = React.useRef<any>(null);
        const selectRef = React.useRef<any>(null);
        const [channelName, setChannelName] = React.useState(`${this.getChannelNamesLevel0()[0]}`)
        return (
            <div style={{
                width: "100%",
                fontSize: this.getAllStyle()["fontSize"] * 2,
                display: "inline-flex",
                flexDirection: "row",
                justifyContent: "flex-start",
                alignItems: "center",
                paddingBottom: 5,
                paddingTop: 10,
            }}>
                <div>PV Monitor for </div>
                <form
                    spellCheck={false}
                    style={{
                        width: "100%",
                        flexGrow: 1,
                    }}
                    onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                        event.preventDefault();
                        // disconnect the old channel softly and clean up data
                        const oldChannelName = this.getChannelNamesLevel0()[0];
                        try {
                            const oldTcaChannel = g_widgets1.getTcaChannel(oldChannelName);
                            oldTcaChannel.destroy(this.getWidgetKey());
                        } catch (e) {

                        }
                        this.clearData();

                        // update channel name
                        this.getChannelNamesLevel0().length = 0;
                        this.getChannelNamesLevel0().push(channelName);
                        this.processChannelNames();

                        // connect new channel 
                        const newTcaChannel = g_widgets1.createTcaChannel(channelName, this.getWidgetKey());
                        if (newTcaChannel !== undefined) {
                            newTcaChannel.getMeta(undefined);
                            newTcaChannel.monitor();
                        }
                        // blur the input box
                        if (inputRef.current !== null) {
                            inputRef.current.blur();
                        }
                        // re-render
                        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
                        g_flushWidgets();
                    }}
                >
                    <input
                        ref={inputRef}
                        style={{
                            fontSize: this.getAllStyle()["fontSize"] * 2,
                            backgroundColor: "rgba(0,0,0,0)",
                            border: "none",
                            outline: "none",
                            width: "100%",
                        }}
                        type="text"
                        name="channelName"
                        value={channelName}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                            const newVal = event.target.value;
                            setChannelName(newVal);
                        }}
                        onMouseEnter={(event: any) => {
                            if (inputRef.current !== null) {
                                inputRef.current.style["color"] = "rgba(255, 0, 0, 1)";
                            }
                        }}
                        onMouseLeave={(event: any) => {
                            if (inputRef.current !== null && document.activeElement !== inputRef.current) {
                                inputRef.current.style["color"] = "rgba(0, 0, 0, 1)";
                            }
                        }}
                        // must use enter to change the value
                        onBlur={(event: any) => {
                            event.preventDefault();
                            if (inputRef.current !== null) {
                                inputRef.current.style["color"] = "rgba(0, 0, 0, 1)";
                            }
                            const orig = `${this.getChannelNamesLevel0()[0]}`;
                            if (orig !== channelName) {
                                setChannelName(orig);
                            }
                        }}
                        onFocus={(event: any) => {
                            event.preventDefault();
                            if (inputRef.current !== null) {
                                inputRef.current.style["color"] = "rgba(255, 0, 0, 1)";
                            }
                        }}
                    />
                </form>
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
                    }

                    if (this.getData().length > maxLineNum) {
                        this.getData().splice(0, this.getData().length - maxLineNum);
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
                // MacOS ignores the non-displayable characters, but Linux shows rectangle for these characters
                if (channelValueElement >= 32 && channelValueElement <= 126) {
                    return `${String.fromCharCode(channelValueElement)}`;
                } else {
                    return "";
                }
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
        "Set buffer limit": any,
    } = {
            "Copy selected data": () => {
                const result: type_data[] = [];
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
                const result: type_data[] = [];
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
                const mainProcessMode = displayWindowClient.getMainProcessMode();
                if (mainProcessMode === "web") {
                    const blob = new Blob([JSON.stringify(result, null, 4)], { type: 'text/json' });
                    const dateNowStr = GlobalMethods.convertEpochTimeToString(Date.now());
                    const suggestedName = `PvMonitor-data-${dateNowStr}.json`;
                    const description = 'PV Monitor data';
                    const applicationKey = "application/json";
                    const applicationValue = [".json"];

                    displayWindowClient.downloadData(blob, suggestedName, description, applicationKey, applicationValue);
                } else {
                    ipcManager.sendFromRendererProcess("save-data-to-file",
                        {
                            displayWindowId: displayWindowId,
                            data: result,
                            preferredFileTypes: ["json"],
                        }
                    )
                }
            },
            "Save all data": () => {
                const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
                const ipcManager = displayWindowClient.getIpcManager();
                const displayWindowId = displayWindowClient.getWindowId();
                const mainProcessMode = displayWindowClient.getMainProcessMode();
                if (mainProcessMode === "web") {
                    const blob = new Blob([JSON.stringify(this.getData(), null, 4)], { type: 'text/json' });
                    const dateNowStr = GlobalMethods.convertEpochTimeToString(Date.now());
                    const suggestedName = `PvMonitor-data-${dateNowStr}.json`;
                    const description = 'PV Monitor data';
                    const applicationKey = "application/json";
                    const applicationValue = [".json"];
                    displayWindowClient.downloadData(blob, suggestedName, description, applicationKey, applicationValue);
                } else {

                    ipcManager.sendFromRendererProcess("save-data-to-file",
                        {
                            displayWindowId: displayWindowId,
                            data: this.getData(),
                            preferredFileTypes: ["json"],
                        }
                    )
                }
            },
            "Unselect data": () => {
                this.getTable().selectedLines.length = 0;
                g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
                g_flushWidgets();
            },
            "Clear data": () => {
                this.clearData();
                g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
                g_flushWidgets();
            },
            "Set buffer limit": () => {
                this.showSettings = true;
                g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
                g_flushWidgets();
            },
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

    static _defaultTdl: type_PvMonitor_tdl = {
        type: "PvMonitor",
        widgetKey: "", // "key" is a reserved keyword
        key: "",
        style: {
            // basics
            position: "absolute",
            display: "inline-block",
            // dimensions
            left: 100,
            top: 100,
            width: 100,
            height: 100,
            backgroundColor: "rgba(255, 255, 255, 1)",
            // angle
            transform: "rotate(0deg)",
            // border, it is different from the "alarmBorder" below,
            borderStyle: "solid",
            borderWidth: 1,
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
            alarmBorder: false,
            invisibleInOperation: false,
            // default, decimal, exponential, hexadecimal
            format: "default",
            // scale, >= 0
            scale: 0,
            maxLineNum: 5000,
        },
        channelNames: [],
        groupNames: [],
        rules: [],
    };

    // not getDefaultTdl(), always generate a new key
    static generateDefaultTdl = (type: string): Record<string, any> => {
        const result = super.generateDefaultTdl(type);
        result.style = JSON.parse(JSON.stringify(this._defaultTdl.style));
        result.text = JSON.parse(JSON.stringify(this._defaultTdl.text));
        result.channelNames = JSON.parse(JSON.stringify(this._defaultTdl.channelNames));
        result.groupNames = JSON.parse(JSON.stringify(this._defaultTdl.groupNames));
        return result;
    };

    // static method for generating a widget tdl with external PV name
    static generateWidgetTdl = (utilityOptions: Record<string, any>): type_PvMonitor_tdl => {
        const result = this.generateDefaultTdl("PvMonitor");
        result.channelNames = utilityOptions.channelNames as string[];
        result["style"]["left"] = 0;
        result["style"]["top"] = 0;
        // result.recordTypesFieldNames = utilityOptions.recordTypesFieldNames as Record<string, string[]>;
        // result.recordTypesMenus = utilityOptions.recordTypesMenus as Record<string, string[]>;
        // result.recordTypes = utilityOptions.recordTypes as Record<string, any>;
        // result.menus = utilityOptions.menus as Record<string, any>;
        return result as type_PvMonitor_tdl;
    };

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

    // --------------------- sidebar --------------------------
    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new PvMonitorSidebar(this);
        }
    }
    jobsAsOperatingModeBegins() {
        super.jobsAsEditingModeBegins();
        this.clearData();
    }
}
