import * as React from "react";
import { g_widgets1, getMouseEventClientY, GlobalVariables } from "../../global/GlobalVariables";
import { BaseWidget } from "../../widgets/BaseWidget/BaseWidget";
import { g_flushWidgets } from "../Root/Root";
import { PvMonitor } from "../../widgets/PvMonitor/PvMonitor";

/**
 * General table for PvTable, CaSnooper, Casw and more
 * To use them, we need to define local variables
 * 
 *   _ElementTableCell: ({ children, columnIndex, additionalStyle }: any) => React.JSX.Element;
 *   _ElementTableLine: ({ children, additionalStyle, lineIndex }: any) => React.JSX.Element;
 *   _ElementTableHeaderResizer: ({ columnIndex }: any) => React.JSX.Element;
 *   _ElementTableLineMemo: React.MemoExoticComponent<(input: any) => React.JSX.Element>;
 *
 */
export class Table {

    lineHeight = GlobalVariables.defaultFontSize * 1.5;
    columnWidths: number[] = [];
    resizeMouseX0: number = -1;
    resizingColumnIndex: number = -1;
    forceUpdateTable: any = undefined;
    toBeUpdatedLineIndices: number[] = [];
    selectedLines: number[] = [];
    _mainWidget: BaseWidget;
    // normally only the rows within view area are rendered, 
    // but sometimes we want to render the rows outside the view area
    // this array is appended to this.toBeUpdatedLineIndices before the next re-render
    // it should be emptied after each render
    forceUpdatedRows: number[] = [];
    constructor(initColumnwidths: number[], mainWidget: BaseWidget) {
        this.columnWidths = JSON.parse(JSON.stringify(initColumnwidths));
        this._mainWidget = mainWidget;
    }



    updateForceUpdateTableFunc = (forceUpdateTable: any) => {
        this.forceUpdateTable = forceUpdateTable;
    }


    getElementTableLine = () => {
        return this._ElementTableLine;
    }
    getElementTableCell = () => {
        return this._ElementTableCell;
    }

    getElementTableHeaderResizer = () => {
        return this._ElementTableHeaderResizer;
    }

    getElementTableLineMemo = () => {
        return this._ElementTableLineMemo;
    }

    highlightColor = "rgba(188,215,251,1)";

    _ElementTableLine = ({ children, additionalStyle, lineIndex, selectable }: any) => {
        const lineRef = React.useRef<any>(null);
        if (additionalStyle === undefined) {
            additionalStyle = {};
        }
        // header line
        if (lineIndex === undefined) {
            lineIndex = -1;
        }
        let dataOffset = 0;
        if (this.getMainWidget() instanceof PvMonitor)  {
            dataOffset = (this.getMainWidget() as PvMonitor).dataOffset;
        }
        const backgroundColorIndex = lineIndex === -1? -1 : lineIndex + dataOffset;
        return (
            <div
                ref={lineRef}
                style={{
                    width: "100%",
                    height: this.lineHeight,
                    minHeight: this.lineHeight,
                    maxHeight: this.lineHeight,
                    backgroundColor: this.selectedLines.includes(lineIndex) ? this.highlightColor : (backgroundColorIndex) % 2 === 0 ? "rgba(230, 230, 230, 1)" : "rgba(230, 230, 230, 0)",
                    display: 'inline-flex',
                    flexDirection: "row",
                    flexWrap: "nowrap",
                    justifyContent: "flex-start",
                    alignItems: 'center',
                    boxSizing: "border-box",
                    ...additionalStyle
                }}
                onMouseDown={(event: any) => {
                    if (selectable === false) {
                        return;
                    }
                    event.preventDefault();
                    if (event.button !== 0 || g_widgets1.isEditing()) {
                        return;
                    }
                    // first line should not be selected
                    if (lineIndex === -1) {
                        return;
                    }

                    if (event.ctrlKey) {
                        const index = this.selectedLines.indexOf(lineIndex);
                        if (index < 0) {
                            // was not selected: select it
                            this.selectedLines.push(lineIndex);
                        } else {
                            // was selected: de-select it
                            this.selectedLines.splice(index, 1);
                        }
                        const mainWidget = this.getMainWidget();
                        const mainWidgetKey = mainWidget.getWidgetKey();
                        this.forceUpdatedRows = [...this.selectedLines, index]
                        g_widgets1.addToForceUpdateWidgets(mainWidgetKey);
                        g_flushWidgets();
                    }
                    else if (event.shiftKey) {
                        // select the lines from the last selected line to this line
                        if (this.selectedLines.length === 0) {
                            this.selectedLines.push(lineIndex);
                            const mainWidget = this.getMainWidget();
                            const mainWidgetKey = mainWidget.getWidgetKey();
                            this.forceUpdatedRows = [...this.selectedLines];
                            g_widgets1.addToForceUpdateWidgets(mainWidgetKey);
                            g_flushWidgets();

                        } else {
                            const previouslySelectedLines = [...this.selectedLines];
                            let lastSelectedLine = Math.min(...this.selectedLines);
                            if (lineIndex < lastSelectedLine) {
                                lastSelectedLine = Math.max(...this.selectedLines);
                            }
                            if (lastSelectedLine !== undefined) {
                                this.selectedLines.length = 0;
                                for (let ii = Math.min(lineIndex, lastSelectedLine); ii <= Math.max(lineIndex, lastSelectedLine); ii++) {
                                    this.selectedLines.push(ii);
                                }
                            }
                            const mainWidget = this.getMainWidget();
                            const mainWidgetKey = mainWidget.getWidgetKey();
                            this.forceUpdatedRows = [...previouslySelectedLines, ...this.selectedLines];
                            g_widgets1.addToForceUpdateWidgets(mainWidgetKey);
                            g_flushWidgets();
                        }
                    } else {

                        const index = this.selectedLines.indexOf(lineIndex);
                        if (index < 0) {
                            // was not selected: de-select all other lines, then select this line
                            const mainWidget = this.getMainWidget();
                            this.forceUpdatedRows = [...this.selectedLines]
                            this.selectedLines.length = 0;
                            this.selectedLines.push(lineIndex);
                            const mainWidgetKey = mainWidget.getWidgetKey();
                            g_widgets1.addToForceUpdateWidgets(mainWidgetKey);
                            g_flushWidgets();
                        } else {
                            // was selected, de-select all others
                            const mainWidget = this.getMainWidget();
                            this.forceUpdatedRows = [...this.selectedLines]
                            this.selectedLines.length = 0;
                            this.selectedLines.push(lineIndex);
                            const mainWidgetKey = mainWidget.getWidgetKey();
                            g_widgets1.addToForceUpdateWidgets(mainWidgetKey);
                            g_flushWidgets();
                        }

                    }
                }
                }
            >
                {children}
            </div>
        )
    }


    _ElementTableLineMemo = React.memo(this._ElementTableLine, (prevProps: any, newProps: any) => {
        const index = newProps.lineIndex;
        if (this.toBeUpdatedLineIndices.includes(index)) {
            return false;
        }
        return true;
    });

    _ElementTableCell = ({ children, columnIndex, additionalStyle }: any) => {
        if (additionalStyle === undefined) {
            additionalStyle = {};
        }
        return (
            <div style={{
                height: "100%",
                width: this.columnWidths[columnIndex] === undefined ? GlobalVariables.defaultFontSize * 5 : this.columnWidths[columnIndex],
                //todo: magic number, to be tuned
                minWidth: GlobalVariables.defaultFontSize * 5,
                backgroundColor: "rgba(255,0,255,0)",
                display: 'inline-flex',
                flexDirection: "row",
                flexWrap: "nowrap",
                justifyContent: "flex-start",
                alignItems: 'center',
                boxSizing: "border-box",
                paddingLeft: 5,
                whiteSpace: "nowrap",
                overflow: "hidden",
                ...additionalStyle
            }}>
                {children}
            </div>
        )
    }



    resizeTableColumn = (event: MouseEvent) => {
        const dx = event.movementX;
        this.columnWidths[this.resizingColumnIndex] = this.columnWidths[this.resizingColumnIndex] + dx;
        if (this.forceUpdateTable !== undefined) {
            this.forceUpdateTable();
        }
    }

    cancelResizeTableColumn = (event: any) => {
        this.resizeMouseX0 = -10000;
        this.resizingColumnIndex = -1;
        window.removeEventListener("mousemove", this.resizeTableColumn);
        window.removeEventListener("mouseup", this.cancelResizeTableColumn);
    }

    _ElementTableHeaderResizer = ({ columnIndex }: any) => {
        const elementRef = React.useRef<any>(null);
        return (
            <div
                ref={elementRef}
                style={{
                    height: "100%",
                    // fix number
                    width: 3,
                    backgroundColor: "rgba(255, 255, 255, 1)",
                    borderLeft: "1px solid grey"
                }}
                onMouseEnter={() => {
                    if (elementRef.current !== null) {
                        elementRef.current.style["cursor"] = "ew-resize";
                    }
                }}
                onMouseLeave={() => {
                    if (elementRef.current !== null) {
                        elementRef.current.style["cursor"] = "default";
                    }
                }}
                onMouseDown={(event: React.MouseEvent) => {
                    event.preventDefault();
                    this.resizeMouseX0 = event.clientX;
                    this.resizingColumnIndex = columnIndex;
                    window.addEventListener("mousemove", this.resizeTableColumn);
                    window.addEventListener("mouseup", this.cancelResizeTableColumn);
                }}
            >
            </div>

        )
    }

    getMainWidget = () => {
        return this._mainWidget;
    }
}