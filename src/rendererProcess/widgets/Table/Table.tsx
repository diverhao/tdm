import * as React from "react";
import { MouseEvent } from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { GlobalVariables } from "../../../common/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { GroupSelection2 } from "../../helperWidgets/GroupSelection/GroupSelection2";
import { TableSidebar } from "./TableSidebar";
import * as GlobalMethods from "../../../common/GlobalMethods";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
// import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary"
import { Log } from "../../../common/Log";
import { Table as Tab } from "../../helperWidgets/Table/Table"

export type type_Table_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
};

export class Table extends BaseWidget {

    _tab: Tab;

    _ElementTableCell: ({ children, columnIndex, additionalStyle }: any) => React.JSX.Element;
    _ElementTableLine: ({ children, additionalStyle, lineIndex }: any) => React.JSX.Element;
    _ElementTableHeaderResizer: ({ columnIndex }: any) => React.JSX.Element;
    _ElementTableLineMemo: React.MemoExoticComponent<(input: any) => React.JSX.Element>;

    constructor(widgetTdl: type_Table_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this.setReadWriteType("write");

        this._tab = new Tab([50, 50, 50], this);
        this._ElementTableCell = this.getTab().getElementTableCell();
        this._ElementTableLine = this.getTab().getElementTableLine();
        this._ElementTableHeaderResizer = this.getTab().getElementTableHeaderResizer();
        this._ElementTableLineMemo = this.getTab().getElementTableLineMemo();
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
            <ErrorBoundary style={this.getStyle()} widgetKey={this.getWidgetKey()} >
                <>
                    {
                        // skip _ElementBody in operating mode
                        // the re-render efficiency can be improved by 10% by doing this
                        // this technique is used on a few most re-rendered widgets, like TextUpdate and TextEntry
                        g_widgets1.isEditing()
                            ?
                            <>
                                <this._ElementBody></this._ElementBody>
                                {this.showSidebar() ? this._sidebar?.getElement() : null}
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
    }

    // Text area and resizers
    _ElementBodyRaw = (): React.JSX.Element => {
        return (
            // always update the div below no matter the TextUpdateBody is .memo or not
            // TextUpdateResizer does not update if it is .memo
            <div style={{
                ...this.getElementBodyRawStyle(),
                // outline: this._getElementAreaRawOutlineStyle(),
            }}>
                <this._ElementArea></this._ElementArea>
                {this.showResizers() ? <this._ElementResizer /> : null}
            </div>
        );
    };

    // only shows the text, all other style properties are held by upper level _ElementBodyRaw
    _ElementAreaRaw = ({ }: any): React.JSX.Element => {
        const allStyle = this.getAllStyle();
        const allText = this.getAllText();
        let style: React.CSSProperties = {};
        if (g_widgets1.isEditing()) {
            style = {
                display: this.getAllStyle()["display"],
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
                outline: this._getElementAreaRawOutlineStyle(),
                color: allStyle["color"],
                opacity: 1,
                // opacity: this.getAllText()["invisibleInOperation"] === true && !g_widgets1.isEditing() ? 0 : 1,

            } as React.CSSProperties;
        } else {
            style = {
                // position: "relative",
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
                // color: allStyle["color"],
                ...this.getElementBodyRawStyle(),
                // display: "inline-flex",
                display: this.getAllStyle()["display"],
                backgroundColor: this.getAllText()["invisibleInOperation"] ? "rgba(0,0,0,0)" : this._getElementAreaRawBackgroundStyle(),
                outline: this._getElementAreaRawOutlineStyle(),
                // opacity: this.getAllText()["invisibleInOperation"] === true && !g_widgets1.isEditing() ? 0 : 1,
                color: this.getAllText()["invisibleInOperation"] === true && !g_widgets1.isEditing() ? "rgba(0,0,0,0)" : this._getElementAreaRawTextStyle(),
            } as React.CSSProperties;
        }


        return (
            <div
                style={style}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                {/* {`${this.getChannelValueStrRepresentation()}${this.getAllText()["showUnit"] === true ? this._getChannelUnit().trim() === "" ? "" : " " + this._getChannelUnit() : ""}`} */}
                <this._ElementTable></this._ElementTable>
            </div>
        );
    };

    _ElementTable = () => {


        const data = this.processData();
        if (data === undefined) {
            return (
                <div>
                    No data in table.
                </div>
            )
        }

        const [, forceUpdate] = React.useState({});
        this.getTab().updateForceUpdateTableFunc(() => { forceUpdate({}) });

        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    overflow: "auto",
                }}
            >
                {/* header row */}
                {data.map((rowData: (string | number | boolean | undefined)[], index: number) => {
                    if (index === 0) {
                        return (
                            <this._ElementTableLine selectable={false} lineIndex={index}>
                                <div style={{
                                    width: 3,
                                    height: "100%",
                                    boxSizing: "border-box",
                                }}>
                                </div>

                                {rowData.map((label: string | number | boolean | undefined, index1: number) => {
                                    return (
                                        <this._ElementTableCell columnIndex={index1} additionalStyle={{ justifyContent: "space-between" }}>
                                            {/* content */}
                                            {`${label}`}
                                            {/* resizer */}
                                            <this._ElementTableHeaderResizer columnIndex={index1}></this._ElementTableHeaderResizer>
                                        </this._ElementTableCell>

                                    )
                                })}
                            </this._ElementTableLine>
                        )
                    } else {
                        return (
                            <this._ElementTableLine selectable={true} lineIndex={index}>
                                {rowData.map((cellData: string | number | boolean | undefined, index1: number) => {
                                    return (
                                        <this._ElementTableCell columnIndex={index1} additionalStyle={{ justifyContent: "space-between" }}>
                                            {`${cellData}`}
                                        </this._ElementTableCell>
                                    )
                                })}
                            </this._ElementTableLine>
                        )
                    }
                }
                )
                }
            </div>
        )
    }

    /**
     * Nomrally we can display the channel value as `${this._getChannelValue()}`
     * However, for string type data, this produces a lot of "," if the data is an array
     */
    getChannelValueStrRepresentation = () => {
        const rawChannelValue = this._getChannelValue(false);
        if (Array.isArray(rawChannelValue)) {
            return '[' + rawChannelValue.join(",") + ']';
        }
        return rawChannelValue;
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

    formatScalarValue = (channelValueElement: number | string | boolean | undefined): string => {


        if (typeof channelValueElement === "number") {
            const scale = Math.max(this.getAllText()["scale"], 0);
            const format = this.getAllText()["format"];
            if (format === "decimal") {
                return channelValueElement.toFixed(scale);
            } else if (format === "default") {
                // const channelName = this.getChannelNames()[0];
                // const defaultScale = g_widgets1.getChannelPrecision(channelName);
                // if (defaultScale !== undefined) {
                //     return channelValueElement.toFixed(defaultScale);
                // } else {
                return channelValueElement.toFixed(scale);
                // }
            } else if (format === "exponential") {
                return channelValueElement.toExponential(scale);
            } else if (format === "hexadecimal") {
                return `0x${channelValueElement.toString(16)}`;
            } else if (format === "string") {
                // use a number array to represent a string
                // MacOS ignores the non-displayable characters, but Linux shows rectangle for these characters
                if (channelValueElement >= 32 && channelValueElement <= 126) {
                    return `${String.fromCharCode(channelValueElement)}`;
                } else {
                    return "";
                }
            } else {
                return `${channelValueElement}`;
            }
        } else {
            if (g_widgets1.isEditing() === true) {
                return `${channelValueElement}`;
            } else {
                return `${channelValueElement}`;
            }

        }
    };

    /**
     * Convert NTTable data to an array of array, the first element is an array of strings, which are
     * the labels for each columns; the rest elements are arrays of row data.
     */
    processData = () => {
        const result: (string | boolean | number | undefined)[][] = []
        const channelName = this.getChannelNames()[0];
        if (channelName === undefined) {
            return undefined;
        }
        try {
            const tcaChannel = g_widgets1.getTcaChannel(channelName);
            let dbrData = tcaChannel.getDbrData();
            const labels = dbrData["labels"];
            const valuesObj = dbrData["value"] as any;
            console.log("values obj", valuesObj)
            const values = Object.values(valuesObj) as (number | string | boolean)[][];
            // "labels" and "value" are mandatory fields
            if (Array.isArray(values) === false || Array.isArray(labels) === false) {
                return undefined;
            }
            // no value data
            if (values.length === 0) {
                return undefined;
            }

            const numRows = values[0].length;
            const numCols = values.length;

            // first array in result is label
            const tmp: (string | undefined)[] = [];
            for (let ii = 0; ii < numCols; ii++) {
                tmp.push(labels[ii]);
            }
            result.push(tmp);

            // rest arrays are row data
            for (let ii = 0; ii < numRows; ii++) {
                const tmp: (number | string | boolean | undefined)[] = [];
                for (const value of values) {
                    tmp.push(value[ii]);
                }
                result.push(tmp);
            }

            return result;


        } catch (e) {
            return undefined;
        }

    }

    // only for TextUpdate and TextEntry
    // they are suitable to display array data in various formats,
    // other types of widgets, such as Meter, Spinner, Tanks, ProgressBar, Thermometer, ScaledSlider are not for array data
    _getChannelValue = (raw: boolean = false) => {

        const channelValue = this.getChannelValueForMonitorWidget(raw);
        if (typeof channelValue === "number" || typeof channelValue === "string") {
            return this.formatScalarValue(channelValue);
        } else if (Array.isArray(channelValue)) {
            const result: any[] = [];
            for (let element of channelValue) {
                result.push(this.formatScalarValue(element));
            }
            if (this.getAllText()["format"] === "string" && typeof channelValue[0] === "number") {
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

    getTab = () => {
        return this._tab;
    }

    mouseEventInsideTable = (ponterX: number, pointerY: number) => {
        return true;
    }


    mouseRightButtonDownContextMenuActions: {
        "Copy selected data": any,
        // "Copy all data": any,
        // "Save selected data": any
        // "Save all data": any,
        // "Unselect data": any,
        // "Clear data": any,
    } = {
            "Copy selected data": () => {
                const result: string[] = [];
                const allData = this.processData();
                if (allData !== undefined) {
                    for (let index of this.getTab().selectedLines) {
                        const data = allData[index].join(" ");
                        result.push(data)
                    }
                    navigator.clipboard.writeText(JSON.stringify(result, null, 4));
                }
            },
            // "Copy all data": () => {
            //     navigator.clipboard.writeText(JSON.stringify(this.getCaProtoSearchData(), null, 4));
            // },
            // "Save selected data": () => {
            //     const result: type_CaProtoSearchData[] = [];
            //     for (let index of this.getTable().selectedLines) {
            //         const data = this.getCaProtoSearchData()[index];
            //         result.push(data)
            //     }
            //     if (result.length < 1) {
            //         return;
            //     }
            //     const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
            //     const ipcManager = displayWindowClient.getIpcManager();
            //     const displayWindowId = displayWindowClient.getWindowId();
            //     ipcManager.sendFromRendererProcess("save-data-to-file",
            //         {
            //             displayWindowId: displayWindowId,
            //             data: result,
            //             preferredFileTypes: ["json"],
            //         }
            //     )
            // },
            // "Save all data": () => {
            //     const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
            //     const ipcManager = displayWindowClient.getIpcManager();
            //     const displayWindowId = displayWindowClient.getWindowId();
            //     ipcManager.sendFromRendererProcess("save-data-to-file",
            //         {
            //             displayWindowId: displayWindowId,
            //             data: this.getCaProtoSearchData(),
            //             preferredFileTypes: ["json"],
            //         }
            //     )
            // },
            // "Unselect data": () => {
            //     this.getTable().selectedLines.length = 0;
            //     g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
            //     g_flushWidgets();
            // },
            // "Clear data": () => {
            //     this.clearCaProtoSearchData();
            //     g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
            //     g_flushWidgets();
            // },
        };


    // ----------------------- styles -----------------------

    // defined in super class
    // _resizerStyle
    // _resizerStyles
    // StyledToolTipText
    // StyledToolTip

    // -------------------------- tdl -------------------------------


    // not getDefaultTdl(), always generate a new key
    static generateDefaultTdl = (): Record<string, any> => {
        const defaultTdl: type_Table_tdl = {
            type: "Table",
            widgetKey: "", // "key" is a reserved keyword
            key: "",
            style: {
                // basics
                position: "absolute",
                display: "inline-flex",
                // dimensions
                left: 100,
                top: 100,
                width: 100,
                height: 100,
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
                invisibleInOperation: false,
                // default, decimal, exponential, hexadecimal
                format: "default",
                // scale, >= 0
                scale: 0,
                // actually "alarm outline"
                alarmBorder: true,
                alarmText: false,
                alarmBackground: false,
                alarmLevel: "MINOR",
            },
            channelNames: [],
            groupNames: [],
            rules: [],
        };
        defaultTdl["widgetKey"] = GlobalMethods.generateWidgetKey(defaultTdl["type"]);
        return JSON.parse(JSON.stringify(defaultTdl));
    };

    generateDefaultTdl = Table.generateDefaultTdl;

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
            this._sidebar = new TableSidebar(this);
        }
    }
}
