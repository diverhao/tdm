import * as React from "react";
import { BaseWidgetSidebar } from "../../widgets/BaseWidget/BaseWidgetSidebar";
import { GlobalVariables, calcScrollBarWidth } from "../../../common/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import * as GlobalMethods from "../../../common/GlobalMethods"
import { BaseWidget } from "../../widgets/BaseWidget/BaseWidget";
import { GroupSelectionSidebar2 } from "../GroupSelection/GroupSelectionSidebar2";
import { type_widget } from "../../global/Widgets";
import { g_widgets1 } from "../../global/GlobalVariables";
import { calcSidebarWidth } from "../../../common/GlobalVariables";

/**
 * A list of widgets on sidebar
 */
export class SidebarWidgetsList {
    _status: "expanded" | "collapsed" = "collapsed";
    _scrollPosition: number = 0;
    constructor() {
    }

    /**
     * place holder for space at the bottom of the sidebar
     */
    _ElementPlaceHolder = () => {
        return (
            <div style={{
                display: "inline-flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 0,
                marginBottom: 0,
                height: 155,
                backgroundColor: "rgba(255, 0, 0, 0)",
                minHeight: 55,
                maxHeight: 55,
            }}>
                &nbsp;
            </div>
        )
    }

    _Element = () => {
        const titleRef = React.useRef<any>(null);
        const elementRef = React.useRef<any>(null);
        // subtract Canvas, GroupSelection2
        let totalNumWidgets = [...g_widgets1.getWidgets().keys()].length - 2;
        if (g_widgets1.getWidget("MouseSelectionRegion") !== undefined) {
            totalNumWidgets = totalNumWidgets - 1;
        }
        const selectedNumWidgets = [...g_widgets1.getGroupSelection2().getWidgets().keys()].length;
        // restore the scrolling position each time it is re-rendered
        React.useEffect(() => {
            if (elementRef.current !== null) {
                elementRef.current["scrollTop"] = this._scrollPosition;
            }
        })

        return (
            <>
                <this._ElementPlaceHolder></this._ElementPlaceHolder>
                <div
                    style={{
                        position: "fixed",
                        top: this.getStatus() === "expanded" ? 0 : "",
                        bottom: this.getStatus() === "expanded" ? "" : 0,
                        right: 0,
                        width: calcSidebarWidth() - GlobalVariables.sidebarBorderWidth,
                        height: this.getStatus() === "expanded" ? "100%" : 55, // hard coded
                        backgroundColor: this.getStatus() === "expanded" ? "rgba(255, 255, 255, 1)" : "rgba(255, 255, 255, 0)",
                        // overflowY: "scroll",
                        // boxSizing: "border-box",

                    }}
                    onMouseDown={(event: React.MouseEvent) => {
                        g_widgets1.deselectAllWidgets(true);
                        g_widgets1.updateSidebar(true);
                    }}
                    // save scroll position each time we scroll using mouse
                    onScroll={() => {
                        if (elementRef.current !== null) {
                            this._scrollPosition = elementRef.current["scrollTop"];
                        }
                    }}
                >
                    {/* title */}
                    <div
                        ref={titleRef}
                        style={{
                            width: `calc(100% - ${calcScrollBarWidth()}px)`,
                            height: this.getStatus() === "expanded" ? "" : "100%",
                            backgroundColor: "rgba(255, 255, 255, 1)",
                            boxSizing: "border-box",
                            display: "inline-flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            cursor: "pointer",
                            paddingLeft: 3,
                            paddingRight: 10,
                            position: "sticky",
                        }}
                        onMouseDown={(event: React.MouseEvent) => {
                            event.stopPropagation();
                        }}
                        onClick={(event: React.MouseEvent) => {
                            event.stopPropagation();
                            if (this.getStatus() === "collapsed") {
                                this.setStatus("expanded");

                            } else {
                                this.setStatus("collapsed");
                            }
                            g_widgets1.updateSidebar(true);
                        }}
                        onMouseEnter={(event: any) => {
                            if (titleRef.current !== null) {
                                titleRef.current.style["backgroundColor"] = "rgb(230, 230, 230, 1)";
                            }
                        }}
                        onMouseLeave={(event: any) => {
                            if (titleRef.current !== null) {
                                titleRef.current.style["backgroundColor"] = "rgb(255, 255, 255, 1)";
                            }
                        }}
                    >
                        <h3>Widgets</h3>
                        {this.getStatus() === "expanded" ?
                            <img src={`../../../webpack/resources/webpages/arrowDown.svg`} width="12px" height="12px"></img>
                            :
                            <img src={`../../../webpack/resources/webpages/arrowUp.svg`} width="12px" height="12px"></img>
                        }
                    </div>
                    {/* contents */}
                    {this.getStatus() === "expanded" ?
                        <>
                            {/* description */}
                            <div
                                style={{
                                    // width: "100%",
                                    width: `calc(100% - ${calcScrollBarWidth()}px)`,
                                    backgroundColor: "rgba(255, 255, 255, 1)",
                                    boxSizing: "border-box",
                                    display: "inline-flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    cursor: "pointer",
                                    paddingLeft: 3,
                                    paddingRight: 10,
                                    color: "rgba(100, 100, 100, 1)",
                                    fontSize: 12,
                                    paddingBottom: 10,
                                    paddingTop: 10,
                                }}
                            >
                                Totally {totalNumWidgets} {totalNumWidgets > 1 ? "widgets" : "widget"}, {selectedNumWidgets} {selectedNumWidgets > 1 ? "are" : "is"} selected.
                            </div>
                            {/* list */}
                            <div style={{
                                height: "100%",
                                overflowY: "scroll",
                                width: "100%",
                                boxSizing: "border-box",
                                backgroundColor: "rgba(255, 255, 255, 1)",
                            }}
                                ref={elementRef}
                            >
                                {[...g_widgets1.getWidgets()].map(([widgetKey, widget]: [string, type_widget | undefined]) => {
                                    if (widget instanceof BaseWidget) {
                                        return (
                                            <div style={{
                                                ...this.itemStyle,
                                            }}
                                                onMouseDown={(event: React.MouseEvent) => {
                                                    this.handleMouseDown(event, widget, elementRef);
                                                }}
                                            >
                                                {widgetKey}
                                            </div>
                                        )

                                    } else if (widget === undefined) {
                                        const validWidget = g_widgets1.getWidget2(widgetKey);
                                        // selected
                                        return (
                                            <div style={{
                                                ...this.itemStyle,
                                                backgroundColor: "rgba(172, 206, 247, 1)",
                                            }}
                                                onMouseDown={(event: React.MouseEvent) => {
                                                    if (validWidget instanceof BaseWidget) {
                                                        this.handleMouseDown(event, validWidget, elementRef);
                                                    }
                                                }}
                                            >
                                                {widgetKey}
                                            </div>
                                        )
                                    } else {
                                        return null;
                                    }
                                })}
                            </div>
                        </>
                        : null
                    }
                </div>
            </>
        );
    };

    itemStyle: Record<string, any> = {
        width: "100%",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        paddingTop: 5,
        paddingBottom: 5,
        paddingRight: 5,
        paddingLeft: 3,
        boxSizing: "border-box",
    }

    handleMouseDown = (event: React.MouseEvent, widget: BaseWidget, elementRef: any) => {
        event.stopPropagation();
        // save scrolling position each time the mouse is down for restoration
        if (elementRef.current !== null) {
            this._scrollPosition = elementRef.current["scrollTop"];
        }
        if (event.button === 0 && widget.isSelected()) {
            // left button down on selected widget
            if (event.ctrlKey === true || event.shiftKey === true) {
                // de-select this widget, no touch on other widgets
                widget.simpleDeselect(false);
            } else {
                // de-select all widgets, select this widget
                g_widgets1.deselectAllWidgets(false);
                widget._handleMouseDoubleClick(event);
            }
        } else if (event.button === 0 && !widget.isSelected()) {
            // left button down on not-selected widget
            if (event.ctrlKey === true || event.shiftKey === true) {
                // select this widget, no touch on other widgets
                widget.simpleSelect(false);
            } else {
                // de-select all widgets, select this widget
                g_widgets1.deselectAllWidgets(false);
                widget._handleMouseDoubleClick(event);
            }
        } else if (event.button === 2 && widget.isSelected()) {
            // right button down on selected widget
            // show context menu, same as on the widget
            widget._handleMouseDown(event);
        } else if (event.button === 2 && !widget.isSelected()) {
            // right button down on not-selected widget
            // de-select all other widgets, select this widget
            // show context menu, same as on the widget
            g_widgets1.deselectAllWidgets(false);
            widget._handleMouseDown(event);
        }
        g_widgets1.updateSidebar(true);
        g_flushWidgets();
    }

    getElement = () => {
        return <this._Element key={"SidebarWidgetsList"}></this._Element>
    }

    getElementPlaceHolder = () => {
        return <this._ElementPlaceHolder key={"SidebarWidgetsListPlaceHolder"}></this._ElementPlaceHolder>
    }

    getStatus = () => {
        return this._status;
    }

    setStatus = (newStatus: "expanded" | "collapsed") => {
        this._status = newStatus;
    }

}
