import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { DataViewerPlot } from "./DataViewerPlot";
import { toolbarHeight } from "./DataViewerPlot";

/**
 * Toolbar controls for DataViewerPlot (zoom, pan, auto-scale, pause/play, export, etc.)
 *
 * Extracted from DataViewerPlot to reduce file size.
 * All access to plot state goes through `this.getPlot()`.
 */
export class DataViewerPlotControls {
    private _plot: DataViewerPlot;

    constructor(plot: DataViewerPlot) {
        this._plot = plot;
    }

    getPlot = () => {
        return this._plot;
    };

    _ElementControls = () => {
        const plot = this.getPlot();
        const isSingleWidget = plot.getMainWidget().getText()["singleWidget"];

        return (
            <div
                style={{
                    // width: `100%`,
                    width: isSingleWidget === true ? window.innerWidth : plot.getMainWidget().getAllStyle()["width"],
                    height: `${toolbarHeight}`,
                    display: "inline-flex",
                    flexFlow: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor: "rgba(255, 0, 0, 0)",
                    paddingLeft: 10,
                    paddingRight: 10,
                    boxSizing: "border-box",
                }}
            >
                <div
                    style={{
                        display: "inline-flex",
                        flexDirection: "row",
                        alignItems: "center",
                        height: "100%",
                        padding: "0px",
                        margin: "0px",
                        marginTop: "0px",
                    }}
                >
                    {/* re-scale vertically to plot limits */}
                    <this._StyledFigButton
                        hintText={"Auto scale all Y axes"}
                        onMouseDown={(event: any) => {
                            if (event.button !== 0) {
                                return;
                            }

                            for (let ii = 0; ii < plot.yAxes.length; ii++) {
                                const yValMinMax = plot.findVisibleYValueRange(ii);
                                const yAxis = plot.yAxes[ii];
                                if (yValMinMax !== undefined) {
                                    if (yAxis !== undefined) {
                                        const Dy = yValMinMax[1] - yValMinMax[0];
                                        yAxis.valMin = yValMinMax[0] - Dy * 0.1;
                                        yAxis.valMax = yValMinMax[1] + Dy * 0.1;
                                    }
                                }

                                if (Math.abs(yAxis.valMin - yAxis.valMax) < 1e-20) {
                                    if (Math.abs(yAxis.valMax) < 1e-20) {
                                        yAxis.valMin = -1;
                                        yAxis.valMax = 1;
                                    } else if (yAxis.valMax > 0) {
                                        yAxis.valMin = yAxis.valMin * 0.9;
                                        yAxis.valMax = yAxis.valMax * 1.1;
                                    } else if (yAxis.valMax < 0) {
                                        yAxis.valMin = yAxis.valMin * 1.1;
                                        yAxis.valMax = yAxis.valMax * 0.9;
                                    }
                                }

                            }
                            plot.updatePlot();
                        }}
                    >
                        <img
                            style={{
                                width: "100%",
                                height: "100%",
                            }}
                            src={`../../../webpack/resources/webpages/scale-2y.svg`}
                        ></img>
                    </this._StyledFigButton>
                    {/* re-scale the currently selected trace to vertical plot limits */}
                    <this._StyledFigButton
                        hintText={"Auto scale current Y axis (right double click)"}
                        onMouseDown={(event: any) => {
                            if (event.button !== 0) {
                                return;
                            }

                            const yAxis = plot.yAxes[plot.selectedTraceIndex];
                            if (yAxis === undefined) {
                                return;
                            }
                            const yValMinMax = plot.findVisibleYValueRange(plot.selectedTraceIndex);

                            if (yValMinMax !== undefined) {
                                if (yAxis !== undefined) {
                                    const Dy = yValMinMax[1] - yValMinMax[0];
                                    yAxis.valMin = yValMinMax[0] - Dy * 0.1;
                                    yAxis.valMax = yValMinMax[1] + Dy * 0.1;
                                }
                            }

                            if (Math.abs(yAxis.valMin - yAxis.valMax) < 1e-20) {
                                if (Math.abs(yAxis.valMax) < 1e-20) {
                                    yAxis.valMin = -1;
                                    yAxis.valMax = 1;
                                } else if (yAxis.valMax > 0) {
                                    yAxis.valMin = yAxis.valMin * 0.9;
                                    yAxis.valMax = yAxis.valMax * 1.1;
                                } else if (yAxis.valMax < 0) {
                                    yAxis.valMin = yAxis.valMin * 1.1;
                                    yAxis.valMax = yAxis.valMax * 0.9;
                                }
                            }

                            plot.updatePlot();
                        }}
                    >
                        <img
                            style={{
                                width: "100%",
                                height: "100%",
                            }}
                            src={`../../../webpack/resources/webpages/scale-y.svg`}
                        ></img>
                    </this._StyledFigButton>
                    {/* setting page */}
                    <this._StyledFigButton
                        hintText={"Settings"}
                        onMouseDown={(event: any) => {
                            if (event.button !== 0) {
                                return;
                            }

                            plot.getMainWidget().setShowSettingsPage(-1);
                            plot.updatePlot();
                        }}
                    >
                        <img
                            style={{
                                width: "100%",
                                height: "100%",
                            }}
                            src={`../../../webpack/resources/webpages/settings.svg`}
                        ></img>
                    </this._StyledFigButton>
                    {/* pause/play */}
                    <this._StyledFigButton
                        hintText={"Toggle data live update (Space key)"}
                        style={{
                            fontSize: "18px",
                        }}
                        onMouseDown={(event: any) => {
                            if (event.button !== 0) {
                                return;
                            }
                            plot.tracingIsMoving = !plot.tracingIsMoving;

                            if (plot.tracingIsMoving) {
                                // update this.getPlot().xAxis.valMin and valMax
                                const DT = plot.xAxis.valMax - plot.xAxis.valMin;
                                plot.xAxis.valMax = Date.now();
                                plot.xAxis.valMin = Date.now() - DT;
                            }

                            plot.updatePlot();
                        }}
                    >
                        {plot.tracingIsMoving ? (
                            <img
                                style={{
                                    width: "100%",
                                    height: "100%",
                                }}
                                src={`../../../webpack/resources/webpages/pause.svg`}
                            ></img>
                        ) : (
                            <img
                                style={{
                                    width: "100%",
                                    height: "100%",
                                }}
                                src={`../../../webpack/resources/webpages/play.svg`}
                            ></img>
                        )}
                    </this._StyledFigButton>{" "}
                    {/* horizontal zoom in */}
                    <this._StyledFigButton
                        hintText={"Zoom in horizontally (wheel scroll up)"}
                        onMouseDown={(event: any) => {
                            if (event.button !== 0) {
                                return;
                            }

                            const xAxis = plot.xAxis;
                            if (xAxis === undefined) {
                                return;
                            }
                            const dt = xAxis.valMax - xAxis.valMin;
                            xAxis.valMin = xAxis.valMax - dt / plot.getText()["axisZoomFactor"];
                            if (plot.tracingIsMoving) {
                                xAxis.valMax = Date.now();
                            }
                            plot.updatePlot();
                        }}
                    >
                        <img
                            style={{
                                width: "100%",
                                height: "100%",
                            }}
                            src={`../../../webpack/resources/webpages/horizontal-zoom-in.svg`}
                        ></img>
                    </this._StyledFigButton>{" "}
                    {/* horizontal zoom out */}
                    <this._StyledFigButton
                        hintText={"Zoom out horizontally (wheel scroll down)"}
                        onMouseDown={(event: any) => {
                            if (event.button !== 0) {
                                return;
                            }

                            const xAxis = plot.xAxis;
                            if (xAxis === undefined) {
                                return;
                            }
                            const dt = xAxis.valMax - xAxis.valMin;
                            xAxis.valMin = xAxis.valMax - dt * plot.getText()["axisZoomFactor"];
                            if (plot.tracingIsMoving) {
                                xAxis.valMax = Date.now();
                            }
                            plot.updatePlot();
                        }}
                    >
                        <img
                            style={{
                                width: "100%",
                                height: "100%",
                            }}
                            src={`../../../webpack/resources/webpages/horizontal-zoom-out.svg`}
                        ></img>
                    </this._StyledFigButton>
                    {/* horizontal pan left */}
                    <this._StyledFigButton
                        hintText={"Pan trace to left (drag to left)"}
                        onMouseDown={(event: any) => {
                            if (event.button !== 0) {
                                return;
                            }

                            plot.tracingIsMoving = false;
                            const xAxis = plot.xAxis;
                            if (xAxis === undefined) {
                                return;
                            }
                            const dt = xAxis.valMax - xAxis.valMin;
                            // each move is 20% of horizontal size
                            xAxis.valMin = xAxis.valMin + dt / 4;
                            xAxis.valMax = xAxis.valMax + dt / 4;
                            // this.calcXTicksAndLabel();
                            plot.updatePlot();
                        }}
                    >
                        <img
                            style={{
                                width: "100%",
                                height: "100%",
                            }}
                            src={`../../../webpack/resources/webpages/horizontal-pan-left.svg`}
                        ></img>
                    </this._StyledFigButton>
                    {/* horizontal pan right */}
                    <this._StyledFigButton
                        hintText={"Pan trace to right (drag to right)"}
                        onMouseDown={(event: any) => {
                            if (event.button !== 0) {
                                return;
                            }

                            plot.tracingIsMoving = false;
                            const xAxis = plot.xAxis;
                            if (xAxis === undefined) {
                                return;
                            }
                            const dt = xAxis.valMax - xAxis.valMin;
                            // each move is 20% of horizontal size
                            xAxis.valMin = xAxis.valMin - dt / 4;
                            xAxis.valMax = xAxis.valMax - dt / 4;
                            plot.updatePlot();
                        }}
                    >
                        <img
                            style={{
                                width: "100%",
                                height: "100%",
                            }}
                            src={`../../../webpack/resources/webpages/horizontal-pan-right.svg`}
                        ></img>
                    </this._StyledFigButton>
                    {/* vertical zoom in*/}
                    <this._StyledFigButton
                        hintText={"Zoom in vertically (Ctrl + wheel scroll up)"}
                        onMouseDown={(event: any) => {
                            if (event.button !== 0) {
                                return;
                            }

                            // zoom for all traces
                            for (let ii = 0; ii < plot.yAxes.length; ii++) {
                                const yAxis = plot.yAxes[ii];
                                if (yAxis === undefined) {
                                    continue;
                                }
                                const yMin = yAxis.valMin;
                                const yMax = yAxis.valMax;
                                const yMid = (yMin + yMax) / 2;
                                const dy = (yMax - yMin) / 2;
                                // zoom
                                const yMinNew = yMid - dy / plot.getText()["axisZoomFactor"];
                                const yMaxNew = yMid + dy / plot.getText()["axisZoomFactor"];
                                yAxis.valMin = yMinNew;
                                yAxis.valMax = yMaxNew;
                            }

                            const xAxis = plot.xAxis;
                            if (plot.tracingIsMoving) {
                                xAxis.valMax = Date.now();
                            }

                            plot.updatePlot();
                        }}
                    >
                        <img
                            style={{
                                width: "100%",
                                height: "100%",
                            }}
                            src={`../../../webpack/resources/webpages/vertical-zoom-in.svg`}
                        ></img>
                    </this._StyledFigButton>
                    {/* vertical zoom out*/}
                    <this._StyledFigButton
                        hintText={"Zoom out vertically (Ctrl + wheel scroll down)"}
                        onMouseDown={(event: any) => {
                            if (event.button !== 0) {
                                return;
                            }

                            for (let ii = 0; ii < plot.yAxes.length; ii++) {
                                const yAxis = plot.yAxes[ii];
                                if (yAxis === undefined) {
                                    continue;
                                }
                                const yMin = yAxis.valMin;
                                const yMax = yAxis.valMax;
                                const yMid = (yMin + yMax) / 2;
                                const dy = (yMax - yMin) / 2;
                                const yMinNew = yMid - dy * plot.getText()["axisZoomFactor"];
                                const yMaxNew = yMid + dy * plot.getText()["axisZoomFactor"];
                                yAxis.valMin = yMinNew;
                                yAxis.valMax = yMaxNew;
                            }
                            const xAxis = plot.xAxis;
                            if (plot.tracingIsMoving) {
                                xAxis.valMax = Date.now();
                            }

                            plot.updatePlot();
                        }}
                    >
                        <img
                            style={{
                                width: "100%",
                                height: "100%",
                            }}
                            src={`../../../webpack/resources/webpages/vertical-zoom-out.svg`}
                        ></img>
                    </this._StyledFigButton>
                    {/* vertical pan down*/}
                    <this._StyledFigButton
                        hintText={"Pan trace down (right button drag down)"}
                        onMouseDown={(event: any) => {
                            if (event.button !== 0) {
                                return;
                            }

                            for (let ii = 0; ii < plot.yAxes.length; ii++) {
                                const yAxis = plot.yAxes[ii];
                                if (yAxis === undefined) {
                                    continue;
                                }
                                const yMin = yAxis.valMin;
                                const yMax = yAxis.valMax;
                                const dy = (yMax - yMin) / 5;
                                const yMinNew = yMin + dy;
                                const yMaxNew = yMax + dy;
                                yAxis.valMin = yMinNew;
                                yAxis.valMax = yMaxNew;
                            }
                            const xAxis = plot.xAxis;
                            if (plot.tracingIsMoving) {
                                xAxis.valMax = Date.now();
                            }

                            plot.updatePlot();
                        }}
                    >
                        <img
                            style={{
                                width: "100%",
                                height: "100%",
                            }}
                            src={`../../../webpack/resources/webpages/vertical-pan-down.svg`}
                        ></img>
                    </this._StyledFigButton>{" "}
                    {/* vertical pan up*/}
                    <this._StyledFigButton
                        hintText={"Pan trace up (right button drag up)"}
                        onMouseDown={(event: any) => {
                            if (event.button !== 0) {
                                return;
                            }

                            for (let ii = 0; ii < plot.yAxes.length; ii++) {
                                const yAxis = plot.yAxes[ii];
                                if (yAxis === undefined) {
                                    continue;
                                }
                                const yMin = yAxis.valMin;
                                const yMax = yAxis.valMax;
                                const dy = (yMax - yMin) / 5;
                                const yMinNew = yMin - dy;
                                const yMaxNew = yMax - dy;
                                yAxis.valMin = yMinNew;
                                yAxis.valMax = yMaxNew;
                            }
                            const xAxis = plot.xAxis;
                            if (plot.tracingIsMoving) {
                                xAxis.valMax = Date.now();
                            }

                            plot.updatePlot();
                        }}
                    >
                        <img
                            style={{
                                width: "100%",
                                height: "100%",
                            }}
                            src={`../../../webpack/resources/webpages/vertical-pan-up.svg`}
                        ></img>
                    </this._StyledFigButton>{" "}
                    {/* export data */}
                    <this._StyledFigButton
                        hintText={"Export data"}
                        onMouseDown={(event: any) => {
                            if (event.button !== 0) {
                                return;
                            }

                            plot.exportData();
                        }}
                    >
                        <img
                            style={{
                                width: "70%",
                                height: "70%",
                            }}
                            src={`../../../webpack/resources/webpages/save-to-file.svg`}
                        ></img>
                    </this._StyledFigButton>{" "}
                    <this._ElementCursorPosition></this._ElementCursorPosition>
                </div>

                <this._StyledFigButton
                    hintText={"Fetch archive data (double click)"}
                    onMouseDown={(event: any) => {
                        if (event.button !== 0) {
                            return;
                        }
                        plot.fetchArchiveData();

                    }}
                >
                    <img
                        style={{
                            width: "100%",
                            height: "100%",
                        }}
                        src={`../../../webpack/resources/webpages/download-from-cloud-symbol.svg`}
                    ></img>
                </this._StyledFigButton>{" "}
            </div>
        );
    };

    _ElementCursorPosition = () => {
        const plot = this.getPlot();
        const [cursorValue, setCursorValue] = React.useState(" ");
        plot.setCursorValue = setCursorValue;
        return (
            <div
                style={{
                    display: "inline-flex",
                    justifyContent: "center",
                    alignItems: "center",
                    color: cursorValue.startsWith("(") ? "rgba(0,0,0,1)" : "rgba(150, 150, 150, 1)",
                }}
            >
                {(() => {
                    if (g_widgets1.isEditing()) {
                        return ""
                    } else if (plot.yAxes[plot.getSelectedTraceIndex()] === undefined) {
                        return " " + cursorValue
                    } else {
                        return " " + cursorValue
                    }
                })()}
            </div>
        );
    };

    _StyledFigButton = ({ children, onMouseDown, hintText }: any) => {
        const plot = this.getPlot();
        const elementRef = React.useRef<any>(null);
        return (
            <div
                ref={elementRef}
                style={{
                    display: "inline-flex",
                    justifyContent: "center",
                    alignItems: "center",
                    // height: "100%",
                    height: toolbarHeight,
                    aspectRatio: "1/1",
                    backgroundColor: "rgba(255, 0, 0, 0)",
                    opacity: 0.4,
                    borderRadius: 3,
                    padding: 1,
                    margin: 0,
                }}
                onMouseEnter={() => {
                    if (elementRef.current !== null) {
                        if (!g_widgets1.isEditing()) {
                            elementRef.current.style["opacity"] = 1;
                            if (typeof hintText === "string" && plot.setCursorValue !== undefined) {
                                plot.setCursorValue(hintText)
                            }
                        }
                    }
                }}
                onMouseLeave={() => {
                    if (elementRef.current !== null) {
                        if (!g_widgets1.isEditing()) {
                            elementRef.current.style["opacity"] = 0.4;
                            if (typeof hintText === "string" && plot.setCursorValue !== undefined) {
                                plot.setCursorValue("")
                            }
                        }
                    }
                }}
                onMouseDown={(event: any) => {
                    if (event.button !== 0) {
                        return;
                    }

                    if (!g_widgets1.isEditing()) {
                        onMouseDown(event)
                    }
                }}
            >
                {children}
            </div>
        )
    }
}
