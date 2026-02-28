import { XYPlot } from "./XYPlot";
import * as React from "react";
import katex from "katex";
import { type_dbrData } from "epics-tca";
import { type_LocalChannel_data } from "../../../common/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { calcTickPositions, calcTicks, mapPointToXy, mapXYsToPointsWebGl, mapXyToPoint, mapXyToPointGl, refineTicks } from "../../../common/GlobalMethods";
import { getMouseEventClientX, getMouseEventClientY, GlobalVariables } from "../../../common/GlobalVariables";
import { g_widgets1 } from "../../global/GlobalVariables";
import { Log } from "../../../common/Log";
import { XYPlotPlotSettings } from "./XYPlotPlotSettings";
import { XYPlotPlotWebGl } from "./XYPlotPlotWebGl";
import { Scale } from "../../helperWidgets/SharedElements/Scale";
import { type_XYPlot_yAxis, type_XYPlot_ticksInfo, type_XYPlot_xAxis, defaultXYPlotTicksInfo } from "../../../common/types/type_widget_tdl";

// re-export for consumers that import from here
export type type_yAxis = type_XYPlot_yAxis;
export type type_ticksInfo = type_XYPlot_ticksInfo;
export type type_xAxis = type_XYPlot_xAxis;


const presetColors: string[] = [
    "rgba(0, 0, 0, 1)",
    "rgba(255, 0, 0, 1)",
    "rgba(0, 0, 255, 1)",
    "rgba(0, 128, 0, 1)",
    "rgba(128, 128, 0, 1)",
    "rgba(0, 128, 128, 1)",
    "rgba(128, 0, 128, 1)",
    "rgba(255, 128, 0, 1)",
];

const yAxisLabelWidth = 30;
const yAxisTickWidth = 30;
const xAxisLabelHeight = 30;
const xAxisTickHeight = 30;
const toolbarHeight = 0;

/**
 * 
 * -------------------------------------------------------------------------
 * |    |   |                                                              |
 * | E  | E |                                                              |
 * | l  | l |                                                              |
 * | e  | e |                                                              |
 * | m  | m |                                                              |
 * | e  | e |                                                              |
 * | n  | n |                                                              |
 * | t  | t |                      ElementPlot                             |
 * | Y  | Y |                                                              |
 * | L  | T |                                                              |
 * | a  | i |                                                              |
 * | b  | c |                                                              |
 * | e  | k |                                                              |
 * | l  | s |                                                              |
 * |    |   |                                                              |
 * -------------------------------------------------------------------------
 * | E B e  |                                                              |
 * | l l a  |                      ElementXTicks                           |
 * | e a    |                                                              |
 * | m n    |--------------------------------------------------------------
 * | e k    |                                                              |
 * | n A    |   ElementControls   ElementXLabel   ElementCursorPosition    |
 * | t r    |                                                              |
 * -------------------------------------------------------------------------
 */

export class XYPlotPlot {
    _mainWidget: XYPlot;

    // helper classes for extracted rendering / UI
    _settings: XYPlotPlotSettings;
    _webgl: XYPlotPlotWebGl;

    setCursorValue = (input: any) => { };
    forceUpdate = (input: any) => { };

    // trace region dimensions, determined by above numbers
    _plotWidth: number = 0;
    _plotHeight: number = 0;

    // only one x axis
    xAxis: type_xAxis = {
        label: "x label",
        autoScale: false, // always false
        // time since epoch, ms
        valMin: 0,
        valMax: 100,
        showGrid: true,
        numGrids: 5,
    };

    // multiple y axes
    yAxes: type_yAxis[] = [];

    selectedTraceIndex: number = 0;

    constructor(mainWidget: XYPlot) {
        this._mainWidget = mainWidget;

        this.initRuntimeData();

        // initialize helper classes
        this._settings = new XYPlotPlotSettings(this);
        this._webgl = new XYPlotPlotWebGl(this);
    }

    // -------------- element ----------------------------

    _Element = () => {

        this.updatePlotWidthHeight();

        const [, forceUpdate] = React.useState({});
        this.forceUpdate = forceUpdate;

        return (
            <div
                style={{
                    position: "absolute",
                    top: "0px",
                    left: "0px",
                    width: "100%",
                    height: "100%",
                    display: "inline-flex",
                    flexFlow: "column",
                    justifyContent: "flex-start",
                    alignItems: "flex-end",
                    overflow: "visible",
                }}
            >
                <div
                    style={{
                        display: "inline-flex",
                        width: `100%`,
                        flexGrow: 0,
                        flexShrink: 0,
                        flexFlow: "row",
                        justifyContent: "flex-start",
                        alignItems: "center",
                    }}
                >
                    {/* y axis label area */}
                    <this._ElementYLabel></this._ElementYLabel>
                    {/* y axis ticks */}
                    <this._ElementYTicks></this._ElementYTicks>
                    {/* plot */}
                    <this._ElementPlot></this._ElementPlot>
                </div>
                <div
                    style={{
                        position: "relative",
                        width: this.getPlotWidth(),
                        display: "inline-flex",
                        flexGrow: 0,
                        flexShrink: 0,
                        flexFlow: "column",
                        justifyContent: "flex-end",
                        alignItems: "flex-start",
                    }}
                >
                    <this._ElementXTicks></this._ElementXTicks>
                    <div
                        style={{
                            position: "relative",
                            width: `100%`,
                            height: xAxisLabelHeight,
                            display: "inline-flex",
                            flexFlow: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <this._ElementControls></this._ElementControls>
                        <this._ElementXLabel></this._ElementXLabel>
                        <this._ElementCursorPosition></this._ElementCursorPosition>
                    </div>
                </div>
            </div>
        );
    };

    // ----------- X, Y ticks and labels elements --------

    _ElementYLabel = () => {

        if (g_widgets1.isEditing()) {
            return (
                <div
                    style={{
                        position: "relative",
                        display: "inline-flex",
                        justifyContent: "center",
                        alignItems: "center",
                        width: yAxisLabelWidth,
                        height: this.getPlotHeight(),
                        margin: "0px",
                        padding: "0px",
                    }}
                >
                    Y
                </div>
            );
        }

        const allText = this.getMainWidget().getAllText();
        const showFrame = allText["showFramee"];
        if (showFrame === false) {
            return null
        }

        const color = this.calcSelectedTraceColor();

        const yAxis = this.getSelectedYAxis();

        return (
            <div
                style={{
                    display: "inline-flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: yAxisLabelWidth,
                    height: this.getPlotHeight(),
                    margin: "0px",
                    padding: "0px",
                    color: color,
                }}
            >
                <div
                    style={{
                        transform: "rotate(-90deg)",
                        overflow: "visible",
                        whiteSpace: "nowrap",
                    }}
                >
                    {yAxis === undefined ? "" : this.convertLatexSourceToDiv(yAxis.label)}
                </div>
            </div>
        );
    };

    _ElementYTicks = () => {

        if (g_widgets1.isEditing()) {
            return (
                <div
                    style={{
                        position: "relative",
                        width: yAxisTickWidth,
                        height: this.getPlotHeight(),
                        display: "inline-flex",
                        flexGrow: 0,
                        flexShrink: 0,
                    }}
                >
                </div>
            );
        }

        const color = this.calcSelectedTraceColor();

        const yAxis = this.getSelectedYAxis();
        if (yAxis === undefined) {
            return null;
        }

        const { xValMin,
            xValMax,
            yValMin,
            yValMax,
            xLength,
            yLength,
            numXgrid,
            numYgrid,
            xTickValues,
            xTickPositions,
            yTickValues,
            yTickPositions } = yAxis["ticksInfo"];

        return (
            <div
                style={{
                    position: "relative",
                    width: yAxisTickWidth,
                    height: this.getPlotHeight(),
                    display: "inline-flex",
                    flexGrow: 0,
                    flexShrink: 0,
                }}
            >
                <Scale
                    min={yValMin}
                    max={yValMax}
                    numIntervals={numYgrid}
                    position={"left"}
                    show={true}
                    length={this.getPlotHeight()}
                    scale={"Linear"}
                    color={color}
                    compact={false}
                    showTicks={false}
                    showLabels={true}
                    showAxis={false}
                >
                </Scale>
            </div>
        )
    };

    _ElementXTicks = () => {

        if (g_widgets1.isEditing()) {
            return (
                <div
                    style={{
                        position: "relative",
                        height: xAxisTickHeight,
                        width: this.getPlotWidth(),
                        display: "inline-flex",
                        flexGrow: 0,
                        flexShrink: 0,
                    }}
                >
                </div>
            );
        }

        const yAxis = this.getSelectedYAxis();
        if (yAxis === undefined) {
            return null
        }

        const { xValMin,
            xValMax,
            yValMin,
            yValMax,
            xLength,
            yLength,
            numXgrid,
            numYgrid,
            xTickValues,
            xTickPositions,
            yTickValues,
            yTickPositions } = yAxis["ticksInfo"];

        const color = this.calcSelectedTraceColor();

        return (
            <div
                style={{
                    position: "relative",
                    height: xAxisTickHeight,
                    width: this.getPlotWidth(),
                    display: "inline-flex",
                    flexGrow: 0,
                    flexShrink: 0,
                }}
            >

                <Scale
                    min={xValMin}
                    max={xValMax}
                    numIntervals={numXgrid}
                    position={"bottom"}
                    show={true}
                    length={this.getPlotWidth()}
                    scale={"Linear"}
                    color={color}
                    compact={false}
                    showTicks={false}
                    showLabels={true}
                    showAxis={false}
                >
                </Scale>
            </div>
        )
    };

    _ElementXLabel = () => {

        if (g_widgets1.isEditing()) {
            return (
                <div
                    style={{
                        display: "inline-flex",
                    }}
                >
                    X
                </div>
            )
        }

        return (
            <div
                style={{
                    display: "inline-flex",
                }}
            >
                {this.convertLatexSourceToDiv(this.xAxis.label)}
            </div>
        );
    };

    // ----------- plot region ---------------------

    _ElementPlot = () => {

        if (g_widgets1.isEditing()) {
            // placeholder
            return (
                <div
                    style={{
                        width: this.getPlotWidth(),
                        height: this.getPlotHeight(),
                        outline: "1px solid black",
                        position: "relative",
                    }}
                >
                    <img
                        src={"../../../webpack/resources/webpages/gridlines.svg"}
                        style={{
                            width: "100%",
                            height: "100%",
                        }}
                    >
                    </img>

                </div>
            );
        }

        return (
            <div
                style={{
                    width: this.getPlotWidth(),
                    height: this.getPlotHeight(),
                    outline: "1px solid black",
                    position: "relative",
                }}
                onMouseEnter={() => {
                    if (!g_widgets1.isEditing()) {
                        window.addEventListener("mousemove", this.updateCursorValue);
                    }
                }}
                onMouseLeave={() => {
                    this.setCursorValue("");
                    window.removeEventListener("mousemove", this.updateCursorValue);
                }}
            >
                {/* tick lines first */}
                <this._ElementXYGridLines></this._ElementXYGridLines>
                {/* data */}
                <this._ElementLines></this._ElementLines>
                {/* legend */}
                <this._ElementLegends></this._ElementLegends>
            </div>
        );
    };

    _ElementXYGridLines = () => {


        const yAxis = this.getSelectedYAxis();
        if (yAxis === undefined) {
            return null
        }

        const xAxis = this.xAxis;

        const { xValMin,
            xValMax,
            yValMin,
            yValMax,
            xLength,
            yLength,
            numXgrid,
            numYgrid,
            xTickValues,
            xTickPositions,
            yTickValues,
            yTickPositions } = yAxis["ticksInfo"];
        const height = this.getPlotHeight();
        const width = this.getPlotWidth();

        return (
            <svg
                width={`${this.getPlotWidth()}`}
                height={`${this.getPlotHeight()}`}
                x="0"
                y="0"
                style={{
                    position: "absolute",
                }}
            >
                {xTickPositions.map((tickPosition: number, index: number) => {

                    if (xAxis["showGrid"] === false) {
                        return null;
                    }

                    return (
                        <polyline
                            key={`x-${tickPosition}-${index}`}
                            points={`${tickPosition} 0 ${tickPosition} ${height}`}
                            strokeWidth="1"
                            stroke="rgb(190,190,190)"
                            strokeDasharray={"5, 5"}
                            fill="none"
                        ></polyline>
                    );
                })}
                {yTickPositions.map((tickPosition: number, index: number) => {
                    if (yAxis["showGrid"] === false) {
                        return null;
                    }
                    return (
                        <polyline
                            key={`y-${tickPosition}-${index}`}
                            points={`0 ${tickPosition} ${width} ${tickPosition}`}
                            strokeWidth="1"
                            stroke="rgb(190,190,190)"
                            strokeDasharray={"5, 5"}
                            fill="none"
                        ></polyline>
                    );
                })}
            </svg>
        );
    };

    _ElementLines = () => {
        return (
            <this._webgl._ElementLinesWebGl></this._webgl._ElementLinesWebGl>
        )
    }

    // -------------- legend and control elements --------------

    _ElementLegends = () => {
        const showLegend = this.getMainWidget().getText()["showLegend"];
        if (showLegend === false) {
            return null;
        }

        return (
            <div
                style={{
                    position: "absolute",
                    display: "inline-flex",
                    justifyContent: "center",
                    alignItems: "center",
                    flexDirection: "column",
                    top: 5,
                    right: 5,
                    padding: 3,
                    border: "1px solid black",
                }}
            >
                {this.yAxes.map((yAxis: type_yAxis, yIndex: number) => {
                    return (
                        <div
                            key={`yAxis-${yAxis["label"]}-${yIndex}`}
                            style={{
                                padding: 0,
                                margin: 0,
                                display: "inline-flex",
                                flexDirection: "row",
                                width: "100%",
                                position: "relative",
                                justifyContent: "flex-start",
                                alignItems: "center",
                            }}
                            onMouseDown={() => {
                                if (g_widgets1.isEditing()) {
                                    return;
                                }
                                this.selectedTraceIndex = yIndex;
                                this.forceUpdate({});
                            }}
                        >
                            <svg
                                width={`40`}
                                height={this.getMainWidget().getStyle()["fontSize"] + 2}
                            >
                                <this._ElementLegendLine svgWidth={40} svgHeight={14} yIndex={yIndex}></this._ElementLegendLine>
                                <this._ElementLegendPoint svgWidth={40} svgHeight={14} yIndex={yIndex}></this._ElementLegendPoint>
                            </svg>
                            &nbsp;
                            <div
                                style={{
                                    opacity: this.selectedTraceIndex === yIndex ? 1 : 0.25,
                                }}
                            >
                                {this.convertLatexSourceToDiv(yAxis.label)}
                            </div>
                        </div>
                    );
                })}{" "}
            </div>
        );
    };

    _ElementLegendLine = ({ yIndex, svgWidth, svgHeight }: any) => {

        const yAxis = this.yAxes[yIndex];
        const color = yAxis["lineColor"];
        const lineStyle = yAxis["lineStyle"];
        const lineWidth = yAxis["lineWidth"];
        const dashLength = Math.round(svgWidth * 0.2);
        let strokeDasharray = ""; // solid

        if (lineStyle === "none") {
            return null;
        } else if (lineStyle === "dashed") {
            strokeDasharray = `${dashLength},${dashLength}`;
        } else if (lineStyle === "dotted") {
            strokeDasharray = `${lineWidth},${lineWidth}`;
        } else if (lineStyle === "dash-dot") {
            strokeDasharray = `${dashLength},${lineWidth},${lineWidth},${lineWidth}`;
        } else if (lineStyle === "dash-dot-dot") {
            strokeDasharray = `${dashLength},${lineWidth},${lineWidth},${lineWidth},${lineWidth},${lineWidth}`;
        }

        return (
            <line
                x1="0"
                y1={svgHeight / 2 + (0 * lineWidth) / 2}
                x2={svgWidth}
                y2={svgHeight / 2 + (0 * lineWidth) / 2}
                strokeWidth={lineWidth}
                stroke={color}
                strokeDasharray={strokeDasharray}
            ></line>
        );
    };

    _ElementLegendPoint = ({ yIndex, svgWidth, svgHeight }: any) => {
        const yAxis = this.yAxes[yIndex];
        const color = yAxis["lineColor"];
        const pointType = yAxis["pointType"];
        const pointSize = yAxis["pointSize"];

        if (pointType === "none") {
            return null;
        } else if (pointType === "circle") {
            const cx = svgWidth / 2;
            const cy = svgHeight / 2;
            const r = pointSize / 2;
            return (
                <>
                    <circle cx={cx} cy={cy} r={r} fill={color}></circle>
                </>
            );
        } else if (pointType === "square") {
            const width = pointSize;
            const height = width;
            const x = svgWidth / 2 - width / 2;
            const y = svgHeight / 2 - height / 2;
            return (
                <>
                    <rect x={x} y={y} width={width} height={height} fill={color}></rect>
                </>
            );
        } else if (pointType === "diamond") {
            const width = pointSize;
            const height = width;
            const x = svgWidth / 2 - width / 2;
            const y = svgHeight / 2 - height / 2;
            const cx = svgWidth / 2;
            const cy = svgHeight / 2;
            return (
                <>
                    <rect transform={`rotate(45 ${cx} ${cy})`} x={x} y={y} width={width} height={height} fill={color}></rect>
                </>
            );
        } else if (pointType === "x") {
            const pointXY: number[] = [svgWidth / 2, svgHeight / 2];
            // const pointSize = this.yAxes[this.getYIndex(index)]["pointSize"];
            const point1X = pointXY[0] - pointSize / 2;
            const point1Y = pointXY[1] - pointSize / 2;
            const point2X = pointXY[0] + pointSize / 2;
            const point2Y = pointXY[1] + pointSize / 2;
            const point3X = pointXY[0] + pointSize / 2;
            const point3Y = pointXY[1] - pointSize / 2;
            const point4X = pointXY[0] - pointSize / 2;
            const point4Y = pointXY[1] + pointSize / 2;
            const pointsA = `${point1X},${point1Y} ${point2X},${point2Y}`;
            const pointsB = `${point3X},${point3Y} ${point4X},${point4Y}`;

            return (
                <>
                    <polyline points={pointsA} strokeWidth={2} stroke={color} fill="none"></polyline>
                    <polyline points={pointsB} strokeWidth={2} stroke={color} fill="none"></polyline>
                </>
            );
        } else if (pointType === "triangle") {
            const pointXY: number[] = [svgWidth / 2, svgHeight / 2];
            const point1X = pointXY[0];
            const point1Y = pointXY[1] - pointSize / 1.717;
            const point2X = pointXY[0] + pointSize / 2;
            const point2Y = pointXY[1] + pointSize / 1.717 / 2;
            const point3X = pointXY[0] - pointSize / 2;
            const point3Y = pointXY[1] + pointSize / 1.717 / 2;
            const points = `${point1X},${point1Y} ${point2X},${point2Y} ${point3X},${point3Y}`;
            return <polyline points={points} fill={color}></polyline>;
        } else if (pointType === "asterisk") {
            const pointXY: number[] = [svgWidth / 2, svgHeight / 2];
            const point1X = pointXY[0] - ((pointSize / 2) * 1.717) / 2;
            const point1Y = pointXY[1] - ((pointSize / 2) * 1) / 2;
            const point2X = pointXY[0] + ((pointSize / 2) * 1.717) / 2;
            const point2Y = pointXY[1] + ((pointSize / 2) * 1) / 2;
            const point3X = pointXY[0] + ((pointSize / 2) * 1.717) / 2;
            const point3Y = pointXY[1] - ((pointSize / 2) * 1) / 2;
            const point4X = pointXY[0] - ((pointSize / 2) * 1.717) / 2;
            const point4Y = pointXY[1] + ((pointSize / 2) * 1) / 2;
            const point5X = pointXY[0];
            const point5Y = pointXY[1] + pointSize / 2;
            const point6X = pointXY[0];
            const point6Y = pointXY[1] - pointSize / 2;
            const pointsA = `${point1X},${point1Y} ${point2X},${point2Y}`;
            const pointsB = `${point3X},${point3Y} ${point4X},${point4Y}`;
            const pointsC = `${point5X},${point5Y} ${point6X},${point6Y}`;

            return (
                <>
                    <polyline points={pointsA} strokeWidth={2} stroke={color} fill="none"></polyline>
                    <polyline points={pointsB} strokeWidth={2} stroke={color} fill="none"></polyline>
                    <polyline points={pointsC} strokeWidth={2} stroke={color} fill="none"></polyline>
                </>
            );
        }
        return null;
    };

    _ElementControls = () => {

        if (g_widgets1.isEditing()) {
            return (
                <div
                    style={{
                        display: "inline-flex",
                        flexFlow: "row",
                        justifyContent: "flex-start",
                        alignItems: "center",
                        width: 0,
                        overflow: "visible",
                    }}
                >
                    {" "}
                </div>
            );
        }

        const copyElementRef = React.useRef<any>(null);
        const settingsElementRef = React.useRef<any>(null);
        const showLegendRef = React.useRef<any>(null);
        return (
            <div
                style={{
                    display: "inline-flex",
                    flexFlow: "row",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    width: 0,
                    overflow: "visible",
                }}
            >
                <div
                    ref={copyElementRef}
                    style={{
                        marginLeft: 5,
                        borderRadius: 2,
                        padding: 3,
                        display: "inline-flex",
                        justifyContent: "center",
                        height: "100%",
                        alignItems: "center",
                        opacity: 0.5,
                    }}
                    onMouseEnter={() => {
                        if (g_widgets1.isEditing()) {
                            return;
                        }
                        if (copyElementRef.current !== null) {
                            copyElementRef.current.style["cursor"] = "pointer";
                            copyElementRef.current.style["opacity"] = 1;
                        }
                    }}
                    onMouseLeave={() => {
                        if (g_widgets1.isEditing()) {
                            return;
                        }

                        if (copyElementRef.current !== null) {
                            copyElementRef.current.style["opacity"] = 0.25;
                            copyElementRef.current.style["cursor"] = "default";
                        }
                    }}
                    onMouseDown={() => {
                        if (g_widgets1.isEditing()) {
                            return;
                        }
                        const result: Record<string, type_dbrData | type_LocalChannel_data | undefined> = {};
                        for (const channelName of this.getMainWidget().getChannelNames()) {
                            try {
                                const tcaChannel = g_widgets1.getTcaChannel(channelName);
                                const dbrData = tcaChannel.getDbrData();
                                result[channelName] = dbrData;
                            } catch (e) {
                                result[channelName] = undefined;
                            }
                        }
                        navigator.clipboard.writeText(JSON.stringify(result, null, 4));
                    }}
                >
                    <img
                        src={`../../../webpack/resources/webpages/copy-symbol.svg`}
                        height={(this.getMainWidget().getAllStyle()["fontSize"] * 3) / 4}
                    ></img>
                </div>
                <div
                    ref={settingsElementRef}
                    style={{
                        borderRadius: 2,
                        padding: 3,
                        display: "inline-flex",
                        justifyContent: "center",
                        height: "100%",
                        alignItems: "center",
                        opacity: 0.25,
                    }}
                    onMouseEnter={() => {
                        if (g_widgets1.isEditing()) {
                            return;
                        }

                        if (settingsElementRef.current !== null) {
                            settingsElementRef.current.style["cursor"] = "pointer";
                            settingsElementRef.current.style["opacity"] = 1;
                        }
                    }}
                    onMouseLeave={() => {
                        if (g_widgets1.isEditing()) {
                            return;
                        }

                        if (settingsElementRef.current !== null) {
                            settingsElementRef.current.style["opacity"] = 0.25;
                            settingsElementRef.current.style["cursor"] = "default";
                        }
                    }}
                    onClick={() => {
                        if (g_widgets1.isEditing()) {
                            return;
                        }
                        this.getMainWidget().showSettings = true;
                        g_widgets1.addToForceUpdateWidgets(this.getMainWidget().getWidgetKey());
                        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

                        g_flushWidgets();
                    }}
                >
                    <img
                        src={`../../../webpack/resources/webpages/settings.svg`}
                        height={this.getMainWidget().getAllStyle()["fontSize"]}
                    ></img>
                </div>
                <div
                    ref={showLegendRef}
                    onMouseEnter={() => {
                        if (g_widgets1.isEditing()) {
                            return;
                        }
                        if (showLegendRef.current !== null) {
                            showLegendRef.current.style["cursor"] = "pointer";
                            showLegendRef.current.style["opacity"] = 1;
                        }
                        this.forceUpdate({});
                    }}
                    onMouseLeave={() => {
                        if (g_widgets1.isEditing()) {
                            return;
                        }
                        if (showLegendRef.current !== null) {
                            showLegendRef.current.style["cursor"] = "default";
                            showLegendRef.current.style["opacity"] = 0.25;
                        }
                        this.forceUpdate({});
                    }}
                    onMouseDown={() => {
                        if (g_widgets1.isEditing()) {
                            return;
                        }
                        this.getMainWidget().getText()["showLegend"] = !this.getMainWidget().getText()["showLegend"];
                        this.forceUpdate({});
                    }}
                    style={{
                        opacity: 0.25,
                    }}
                >
                    <img
                        src={`../../../webpack/resources/webpages/legend-symbol.svg`}
                        width={this.getMainWidget().getAllStyle()["fontSize"]}
                    ></img>
                </div>
            </div>
        );
    };

    _ElementCursorPosition = () => {
        if (g_widgets1.isEditing()) {
            return (
                <div
                    style={{
                        display: "inline-flex",
                        width: 0,
                        overflow: "visible",
                        flexDirection: "row-reverse",
                    }}
                >
                    {" "}
                </div>
            )
        }

        const yAxis = this.getSelectedYAxis();

        if (yAxis === undefined) {
            return null;
        }

        const [cursorValue, setCursorValue] = React.useState(" ");
        this.setCursorValue = setCursorValue;
        const color = yAxis["lineColor"];
        return (
            <div
                style={{
                    display: "inline-flex",
                    width: 0,
                    overflow: "visible",
                    flexDirection: "row-reverse",
                    color: color,
                }}
            >
                {cursorValue}
            </div>
        );
    };

    // ------------------- helper functions --------------

    mapXYsToPointsWebGl = (index: number): Float32Array => {

        const yAxis = this.getMainWidget().getYAxes()[index];
        if (yAxis === undefined) {
            return new Float32Array(0);
        }

        // x and y data are odd and even indices
        let xData = yAxis["xData"];
        let yData = yAxis["yData"];

        // patch xData
        if (xData.length === 0) {
            xData = [...Array(yData.length).keys()];
        }
        const ticksInfo = yAxis["ticksInfo"];
        let { xValMax, xValMin, yValMax, yValMin } = ticksInfo;
        return mapXYsToPointsWebGl(xData, yData, xValMin, xValMax, yValMin, yValMax);
    };

    /**
     * Recalculate the plot region dimensions and tick layout info.
     *
     * Called once per render. Computes `plotWidth` / `plotHeight` from the
     * widget size and frame margins, then derives x/y tick values and pixel
     * positions (stored in `this.ticksInfo`) so that tick lines, labels, and
     * the WebGL canvas all share a consistent coordinate mapping.
     */
    updateTicksInfo = (index: number) => {

        this.updatePlotWidthHeight();

        const scale = "Linear";
        const yAxis = this.yAxes[index];

        if (yAxis === undefined) {
            return;
        }

        const { xValMin, xValMax, yValMin, yValMax } = this.calcXyValMinMax(index);
        const xLength = this.getPlotWidth();
        const yLength = this.getPlotHeight();
        const numXgrid = this.xAxis["numGrids"];
        const numYgrid = yAxis["numGrids"];
        const xTickValues = calcTicks(xValMin, xValMax, numXgrid + 1, { scale: scale });
        const xTickPositions = calcTickPositions(xTickValues, xValMin, xValMax, xLength, { scale: scale }, "vertical");
        const yTickValues = calcTicks(yValMin, yValMax, numYgrid + 1, { scale: scale });
        const yTickPositions = calcTickPositions(yTickValues, yValMin, yValMax, yLength, { scale: scale }, "vertical");
        yAxis["ticksInfo"] = {
            scale,
            xValMin,
            xValMax,
            yValMin,
            yValMax,
            xLength,
            yLength,
            numXgrid,
            numYgrid,
            xTickValues,
            xTickPositions,
            yTickValues,
            yTickPositions,
        };
    }

    updatePlotWidthHeight = () => {
        const allText = this.getMainWidget().getAllText();
        const allStyle = this.getMainWidget().getAllStyle();
        const width = allStyle["width"];
        const height = allStyle["height"];
        const showFrame = allText["showFrame"];
        if (showFrame === true) {
            this.setPlotWidth(width - yAxisLabelWidth - yAxisTickWidth);
            this.setPlotHeight(height - xAxisLabelHeight - xAxisTickHeight - toolbarHeight);
        } else {
            this.setPlotWidth(width);
            this.setPlotHeight(height);
        }
    }

    calcXyValMinMax = (index: number) => {

        const yAxis = this.getMainWidget().getYAxes()[index];
        if (yAxis === undefined) {
            return {
                xValMin: 0,
                xValMax: 100,
                yValMin: 0,
                yValMax: 100,
            }
        }
        const xData = yAxis["xData"];
        const yData = yAxis["yData"];

        if (yData.length === 0) {
            return {
                xValMin: 0,
                xValMax: 100,
                yValMin: 0,
                yValMax: 100,
            }
        }

        // x
        let xValMin = this.xAxis["valMin"];
        let xValMax = this.xAxis["valMax"];

        // y
        let yValMin = yAxis["valMin"];
        let yValMax = yAxis["valMax"];
        if (yAxis["autoScale"]) {
            yValMin = Math.min(...yData);
            yValMax = Math.max(...yData);
        }

        return (
            {
                xValMin: xValMin,
                xValMax: xValMax,
                yValMin: yValMin,
                yValMax: yValMax,
            }
        )
    }

    convertLatexSourceToDiv = (rawText: string) => {
        // const rawText = this.getAllText()["text"];
        if (`${rawText}`.startsWith("latex://")) {
            // no additional parsing, pure latex
            try {
                const htmlContents = katex.renderToString(`${rawText}`.replace("latex://", ""), {
                    throwOnError: false,
                });
                return <div dangerouslySetInnerHTML={{ __html: htmlContents }}></div>;
            } catch (e) {
                Log.error(e);
                return `${rawText}`;
            }
        } else {
            return `${rawText}`;
        }
    };

    generateDefaultYAxis = (index: number): type_yAxis => {

        const index1 = index % presetColors.length;
        const lineColor = presetColors[index1];

        return {
            label: `y${index}`,
            valMin: 0,
            valMax: 100,
            lineWidth: 2,
            lineColor: lineColor,
            autoScale: false,
            lineStyle: "solid",
            pointType: "none",
            pointSize: 5,
            showGrid: true,
            numGrids: 5,
            displayScale: "Linear",
            // runtime data
            xData: [],
            yData: [],
            ticksInfo: JSON.parse(JSON.stringify(defaultXYPlotTicksInfo)),
        };
    };

    initRuntimeData = () => {
        for (const yAxis of this.yAxes) {
            yAxis["xData"] = [];
            yAxis["yData"] = [];
            yAxis["ticksInfo"] = JSON.parse(JSON.stringify(defaultXYPlotTicksInfo));
        }
    };

    /**
     * get the currently selected trace's color
     */
    calcSelectedTraceColor = () => {
        const selectedYAxis = this.getSelectedYAxis();
        return selectedYAxis === undefined ? "rgba(0, 0, 0, 1)" : selectedYAxis.lineColor;
    }

    updateCursorValue = (event: any) => {
        const pointX0 = getMouseEventClientX(event);
        const pointY0 = getMouseEventClientY(event);
        const allStyle = this.getMainWidget().getAllStyle();
        const left = allStyle["left"];
        const top = allStyle["top"];

        // cursor location inside trace plot region
        const pointX = pointX0 - yAxisLabelWidth - yAxisTickWidth - left;
        const pointY = pointY0 - top;

        const yAxis = this.getSelectedYAxis();
        if (yAxis === undefined) {
            return;
        }
        const ticksInfo = yAxis["ticksInfo"];
        const { xValMax, xValMin, yValMax, yValMin } = ticksInfo;

        const [valX, valY] = mapPointToXy(pointX, pointY, xValMin, xValMax, yValMin, yValMax, this.getPlotWidth(), this.getPlotHeight());
        const valXStr = valX.toPrecision(4).toString();
        const valYStr = valY.toPrecision(4).toString();
        this.setCursorValue(`(${valXStr}, ${valYStr})`);
    };

    /**
     * when new channel data arrives, 
     * (1) update the corresponding yAxis["xData"], yAxis["yData"] 
     * (2) calculate the yAxis["ticksInfo"]
     */
    mapDbrDataWitNewData = (newChannelNames: string[]) => {
        if (g_widgets1.isEditing()) {
            return;
        }

        const channelNames = this.getMainWidget().getChannelNames();

        for (let ii = 0; ii < channelNames.length; ii++) {
            const channelName = channelNames[ii];

            if (newChannelNames.includes(channelName)) {
                const newValue = g_widgets1.getChannelValue(channelName);
                if (Array.isArray(newValue)) {
                    if (typeof newValue[0] === "number") {
                        const yAxisIndex = Math.floor(ii / 2 + 0.1);
                        const yAxis = this.getMainWidget().getYAxes()[yAxisIndex];
                        if (yAxis === undefined) {
                            return;
                        }
                        if (ii % 2 < 0.01) {
                            yAxis["xData"] = newValue as number[];
                        } else {
                            yAxis["yData"] = newValue as number[];
                        }

                        // update runtime ticks, plot region width, height information, for grid lines and ticks
                        this.updateTicksInfo(yAxisIndex);
                    }
                }
            }
        }
    };

    // ---------------------- getters and setters -------------------------------
    getMainWidget = () => {
        return this._mainWidget;
    };

    getElement = () => {
        return <this._Element></this._Element>;
    };

    getElementSettings = () => {
        return this._settings.getElementSettings();
    };

    getSelectedYAxis = (): type_yAxis | undefined => {
        return this.yAxes[this.selectedTraceIndex];
    }

    getTicksInfo = (index: number) => {
        const yAxis = this.getMainWidget().getYAxes()[index];
        if (yAxis === undefined) {
            return JSON.parse(JSON.stringify(defaultXYPlotTicksInfo));
        } else {
            return yAxis["ticksInfo"];
        }
    }

    getPlotWidth = () => {
        return this._plotWidth;
    }

    getPlotHeight = () => {
        return this._plotHeight;
    }

    setPlotWidth = (newWidth: number) => {
        this._plotWidth = newWidth;
    }

    setPlotHeight = (newHeight: number) => {
        this._plotHeight = newHeight;
    }
}
