import { XYPlot } from "./XYPlot";
import * as React from "react";
import katex from "katex";
import { type_dbrData } from "epics-tca";
import { type_LocalChannel_data } from "../../../common/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { calcTickPositions, calcTicks, refineTicks } from "../../../common/GlobalMethods";
import { getMouseEventClientX, getMouseEventClientY, GlobalVariables } from "../../../common/GlobalVariables";
import { g_widgets1 } from "../../global/GlobalVariables";
import { Log } from "../../../common/Log";
import { XYPlotPlotSettings } from "./XYPlotPlotSettings";
import { XYPlotPlotWebGl } from "./XYPlotPlotWebGl";
import { Scale } from "../../helperWidgets/SharedElements/Scale";


export type type_yAxis = {
    label: string;
    valMin: number;
    valMax: number;
    lineWidth: number;
    lineColor: string;
    ticks: number[];
    ticksText: (number | string)[];
    autoScale: boolean;
    lineStyle: string;
    pointType: string;
    pointSize: number;
    showGrid: boolean;
    numGrids: number;
    displayScale: "Linear" | "Log10";
};

export type type_xAxis = {
    label: string;
    valMin: number;
    valMax: number;
    ticks: number[];
    ticksText: (number | string)[];
    autoScale: boolean;
    showGrid: boolean;
    numGrids: number;
};

/**
 * 
 * ------------------------------------------------------------------------
 * |                                                                       |
 * |                          ElementTitle                                 |
 * |                                                                       |
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


    // layout
    readonly titleHeight = 20;
    readonly yAxisLabelWidth = 30;
    readonly yAxisTickWidth = 30;
    readonly xAxisLabelHeight = 30;
    readonly xAxisTickHeight = 30;
    readonly toolbarHeight = 0;
    readonly legendWidth = 30;
    // trace region dimensions, determined by above numbers
    plotWidth: number = 0;
    plotHeight: number = 0;

    // extend x direction plot area by 20% on both positive and negative directions
    readonly xPlotRangeExtension = 0;
    readonly yPlotRangeExtension = 0;

    setCursorValue: any;
    lastCursorPointXY: [number, number] = [-100000, -100000];

    // only one x axis
    xAxis: type_xAxis = {
        label: "x label",
        // time since epoch, ms
        valMin: 0,
        valMax: 100,
        ticks: [],
        ticksText: [],
        autoScale: false,
        showGrid: true,
        numGrids: 5,
    };

    ticksInfo: {
        scale: "Linear" | "Log10",
        xValMin: number,
        xValMax: number,
        yValMin: number,
        yValMax: number,
        xLength: number,
        yLength: number,
        numXgrid: number,
        numYgrid: number,
        xTickValues: number[],
        xTickPositions: number[],
        yTickValues: number[],
        yTickPositions: number[],
    } = {
            scale: "Linear",
            xValMin: 0,
            xValMax: 0,
            yValMin: 0,
            yValMax: 0,
            xLength: 0,
            yLength: 0,
            numXgrid: 0,
            numYgrid: 0,
            xTickValues: [],
            xTickPositions: [],
            yTickValues: [],
            yTickPositions: [],
        }
    forceUpdate: any;

    // showLegend: boolean = false;
    peekLegend: boolean = false;

    selectedTraceIndex: number = 0;

    // if undefined, the trace is shown
    // modified by settings, not permanent
    tracesHide: boolean[] = [];

    // multiple y axes
    yAxes: type_yAxis[] = [];

    /**
     * [
     *   [1st trace x data, 1st trace y data],
     *   [2nd trace x data, 2nd trace y data],
     *   ...
     *   [last trace x data, last trace y data],
     * ]
     */
    xy: number[][] = [];

    readonly presetColors: string[] = [
        "rgba(0, 0, 0, 1)",
        "rgba(255, 0, 0, 1)",
        "rgba(0, 0, 255, 1)",
        "rgba(0, 128, 0, 1)",
        "rgba(128, 128, 0, 1)",
        "rgba(0, 128, 128, 1)",
        "rgba(128, 0, 128, 1)",
        "rgba(255, 128, 0, 1)",
    ];


    constructor(mainWidget: XYPlot) {
        this._mainWidget = mainWidget;

        this.initXY();

        // initialize helper classes
        this._settings = new XYPlotPlotSettings(this);
        this._webgl = new XYPlotPlotWebGl(this);
    }

    // -------------- element ----------------------------

    _Element = () => {

        // update ticks, plot region width, height information, for grid lines and ticks
        this.updateWidthHeightTicksInfo();

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
                <this._ElementTitle></this._ElementTitle>
                <div
                    style={{
                        display: "inline-flex",
                        width: `100%`,
                        backgroundColor: "magenta",
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
                        width: this.plotWidth,
                        display: "inline-flex",
                        backgroundColor: "rgba(255, 100, 100, 0.5)",
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
                            height: this.xAxisLabelHeight,
                            display: "inline-flex",
                            flexFlow: "row",
                            justifyContent: "flex-end",
                            alignItems: "flex-end",
                        }}
                    >
                        {/* must be under the ElementControls */}
                        <this._ElementCursorPosition></this._ElementCursorPosition>
                        <this._ElementXLabel></this._ElementXLabel>
                        <this._ElementControls></this._ElementControls>
                    </div>
                </div>
            </div>
        );
    };

    // ---------------- title element --------------------

    _ElementTitle = () => {
        const allText = this.getMainWidget().getAllText();
        const showFrame = allText["showFramee"];
        if (showFrame === false) {
            return null;
        }

        return (
            <div
                style={{
                    position: "relative",
                    width: `100%`,
                    height: `${this.titleHeight}px`,
                    display: "inline-flex",
                    flexFlow: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "rgba(68, 85, 90, 0)",
                }}
            ></div>
        );
    };

    // ----------- X, Y ticks and labels elements --------
    _ElementYLabel = () => {

        const allText = this.getMainWidget().getAllText();
        const showFrame = allText["showFramee"];
        if (showFrame === false) {
            return null
        }

        const color = this.calcColor();

        return (
            <div
                style={{
                    display: "inline-flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: this.yAxisLabelWidth,
                    height: this.plotHeight,
                    margin: "0px",
                    padding: "0px",
                    backgroundColor: "rgba(255, 0, 255, 0)",
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
                    {this.yAxes[this.selectedTraceIndex] === undefined ? "" : this.convertLatexSourceToDiv(this.yAxes[this.selectedTraceIndex].label)}
                </div>
            </div>
        );
    };

    _ElementYTicks = () => {
        const color = this.calcColor();
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
            yTickPositions } = this.ticksInfo;

        return (
            <div
                style={{
                    position: "relative",
                    width: this.yAxisTickWidth,
                    height: "100%",
                    display: "inline-flex",
                    flexGrow: 0,
                    flexShrink: 0,
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <Scale
                    min={yValMin}
                    max={yValMax}
                    numIntervals={numYgrid}
                    position={"left"}
                    show={true}
                    length={this.plotHeight}
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
            yTickPositions } = this.ticksInfo;

        const color = this.calcColor();

        return (
            <Scale
                min={xValMin}
                max={xValMax}
                numIntervals={numXgrid}
                position={"bottom"}
                show={true}
                length={this.plotWidth}
                scale={"Linear"}
                color={color}
                compact={false}
                showTicks={false}
                showLabels={true}
                showAxis={false}
            >
            </Scale>
        )
    };

    _ElementXLabel = () => {
        return (
            <div
                style={{
                    width: `${this.plotWidth}px`,
                    height: "100%",
                    display: "inline-flex",
                    flexFlow: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    // backgroundColor: "yellow",
                    backgroundColor: "rgba(255, 255, 0, 0)",
                }}
            >
                {this.convertLatexSourceToDiv(this.xAxis.label)}
            </div>
        );
    };

    // ----------- plot region ---------------------

    _ElementPlot = () => {

        return (
            <div
                style={{
                    width: this.plotWidth,
                    height: this.plotHeight,
                    outline: "1px solid black",
                    position: "relative",
                    backgroundColor: "rgba(0,255,0,1)",
                }}
                onMouseEnter={() => {
                    if (!g_widgets1.isEditing()) {
                        window.addEventListener("mousemove", this.updateCursorValue);
                    }
                }}
                onMouseLeave={() => {
                    this.lastCursorPointXY = [-100000, -100000];
                    this.updateCursorValue(this.lastCursorPointXY);
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
            yTickPositions } = this.ticksInfo;
        const height = this.plotHeight;
        const width = this.plotWidth;

        return (
            <svg
                width={`${this.plotWidth}`}
                height={`${this.plotHeight}`}
                x="0"
                y="0"
                style={{
                    position: "absolute",
                }}
            >
                {xTickPositions.map((tickPosition: number, index: number) => {
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

    // -------------- legend elements --------------

    _ElementLegends = () => {
        if (!(this.getMainWidget().getText()["showLegend"] === true || this.peekLegend === true)) {
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
                    backgroundColor: "rgba(255, 255, 255, 1)",
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
                                if (this.forceUpdate !== undefined) {
                                    this.forceUpdate({});
                                }
                            }}
                        >
                            <svg width={`40`} height={this.getMainWidget().getStyle()["fontSize"] + 2}>
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
        // const strokeWidth = 2;

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
        const copyElementRef = React.useRef<any>(null);
        const settingsElementRef = React.useRef<any>(null);
        const showLegendRef = React.useRef<any>(null);
        return (
            <div
                style={{
                    width: `100%`,
                    position: "absolute",
                    top: 0,
                    left: 0,
                    // height: `${this.toolbarHeight}`,
                    height: this.getMainWidget().getAllStyle()["fontSize"] + 4,

                    display: "inline-flex",
                    flexFlow: "row",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    // backgroundColor: "green",
                    backgroundColor: "rgba(0, 255, 0, 0)",
                }}
            >
                <div
                    style={{
                        height: "100%",
                        display: "inline-flex",
                        flexDirection: "row",
                        // justifyContent: "center",
                        alignItems: "center",
                        // height: "20px",
                        padding: "0px",
                        margin: "0px",
                        // marginTop: "10px",
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
                            if (!g_widgets1.isEditing()) {
                                for (const channelName of this.getChannelNames()) {
                                    try {
                                        const tcaChannel = g_widgets1.getTcaChannel(channelName);
                                        const dbrData = tcaChannel.getDbrData();
                                        result[channelName] = dbrData;
                                    } catch (e) {
                                        result[channelName] = undefined;
                                    }
                                }
                                navigator.clipboard.writeText(JSON.stringify(result, null, 4));
                            }
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
                            }
                            this.peekLegend = true;
                            this.forceUpdate({});
                        }}
                        onMouseLeave={() => {
                            if (g_widgets1.isEditing()) {
                                return;
                            }
                            if (showLegendRef.current !== null) {
                                showLegendRef.current.style["cursor"] = "default";
                            }
                            this.peekLegend = false;
                            this.forceUpdate({});
                        }}
                        onMouseDown={() => {
                            if (g_widgets1.isEditing()) {
                                return;
                            }
                            // this.showLegend = !this.showLegend;
                            this.getMainWidget().getText()["showLegend"] = !this.getMainWidget().getText()["showLegend"];
                            this.forceUpdate({});
                        }}
                        style={{
                            opacity: this.getMainWidget().getText()["showLegend"] ? 1 : this.peekLegend ? 0.5 : 0.25,
                        }}
                    >
                        <img
                            src={`../../../webpack/resources/webpages/legend-symbol.svg`}
                            width={this.getMainWidget().getAllStyle()["fontSize"]}
                        ></img>
                    </div>
                </div>
            </div>
        );
    };

    // --------------- plot calculation ------------

    mapXYsToPointsWebGl = (index: number): Float32Array => {
        // x and y data are odd and even indices
        let xData = this.xy[index];
        let yData = this.xy[index + 1];

        let yIndex = this.getYIndex(index);

        let useLog10Scale = false;
        if (this.yAxes[yIndex] !== undefined) {
            useLog10Scale = this.yAxes[yIndex]["displayScale"] === "Log10" ? true : false;
        }

        // if there is no xData (undefined) or the x PV is empty ("")
        if (this.getMainWidget().getChannelNames()[index] === "" || xData.length === 0) {
            const dataSize = yData.length;
            xData = [...Array(dataSize).keys()];
        }
        // xData and yData must be same size
        if (xData.length !== yData.length) {
            const positions = new Float32Array(3);
            return positions;
        }

        if (xData.length === 0) {
            const positions = new Float32Array(3);
            return positions;
        }

        let { xValMax, xValMin, yValMax, yValMin } = this.ticksInfo;

        // extra space in x and y directions
        if (!useLog10Scale) {
            const dx = Math.abs(xValMax - xValMin) * this.xPlotRangeExtension / 100;
            const dy = Math.abs(yValMax - yValMin) * this.yPlotRangeExtension / 100;
            xValMax = xValMax + dx;
            xValMin = xValMin - dx;
            yValMax = yValMax + dy;
            yValMin = yValMin - dy;
        }

        const len = Math.min(xData.length, yData.length);
        const positions = new Float32Array(len * 3);

        for (let ii = 0; ii < len; ii++) {
            const valX = xData[ii];
            const valY = yData[ii];
            const pointX = this.mapXToPointWebGl(index, [valX, valY], [xValMin, xValMax, yValMin, yValMax]);
            const pointY = this.mapYToPointWebGl(index, [valX, valY], [xValMin, xValMax, yValMin, yValMax]);
            if (pointX === undefined || pointY === undefined || isNaN(pointX) || isNaN(pointY)) {
                continue;
            }
            positions[3 * ii] = pointX;
            positions[3 * ii + 1] = -1 * pointY;
            positions[3 * ii + 2] = 0;
        }
        return positions;
    };

    mapXToPointWebGl = (
        index: number,
        [valX, valY]: [number, number],
        [valXmin, valXmax, valYmin, valYmax]: [number, number, number, number]
    ): number => {

        let yIndex = this.getYIndex(index);

        if (this.yAxes[yIndex] === undefined) {
            return 0;
        }
        const pointXmin = -1;
        const pointXmax = 1;
        const pointX = pointXmin + ((pointXmax - pointXmin) / (valXmax - valXmin)) * (valX - valXmin);
        return pointX;
    };

    mapYToPointWebGl = (
        index: number,
        [valX, valY]: [number, number],
        [valXmin, valXmax, valYmin, valYmax]: [number, number, number, number]
    ): number => {

        let yIndex = this.getYIndex(index);
        let useLog10Scale = false;
        if (this.yAxes[yIndex] !== undefined) {
            useLog10Scale = this.yAxes[yIndex]["displayScale"] === "Log10" ? true : false;
        }

        if (this.yAxes[yIndex] === undefined) {
            return 0;
        }
        const pointYmin = -1;
        const pointYmax = 1;

        // valY, valYmin, valYmax for Log10
        // if we use Log10Scale, do not use extra space
        if (useLog10Scale) {
            valYmin = Math.log10(valYmin);
            valYmax = Math.log10(valYmax);
            valY = Math.log10(valY);
        }
        if (useLog10Scale) {
            if (valY === Infinity || valY === -Infinity || isNaN(valY)) {
                valY = -20
            }
            if (valYmin === Infinity || valYmin === -Infinity || isNaN(valYmin)) {
                valYmin = -20
            }
            if (valYmax === Infinity || valYmax === -Infinity || isNaN(valYmax)) {
                valYmax = 0
            }
        }

        // const pointX = pointXmin + ((pointXmax - pointXmin) / (valXmax - valXmin)) * (valX - valXmin);
        const pointY = pointYmax - ((pointYmax - pointYmin) / (valYmax - valYmin)) * (valY - valYmin);
        return pointY;
    };

    // pointX, pointY are the coordinates inside Plot element
    mapPointToXY = (index: number,
        [pointX, pointY]: [number, number],
        [valXmin, valXmax, valYmin, valYmax]: [number, number, number, number]
    ): [number, number] => {
        if (index >= this.getMainWidget().getChannelNames().length) {
            return [0, 0];
        }

        let yIndex = this.getYIndex(index);
        let useLog10Scale = false;
        if (this.yAxes[yIndex] !== undefined) {
            useLog10Scale = this.yAxes[yIndex]["displayScale"] === "Log10" ? true : false;
        }

        const pointXmin = 0;
        const pointXmax = this.plotWidth;
        const pointYmin = 0;
        const pointYmax = this.plotHeight;

        if (useLog10Scale) {
            valYmin = Math.log10(valYmin);
            valYmax = Math.log10(valYmax);
        }

        if (useLog10Scale) {
            if (valYmin === Infinity || valYmin === -Infinity || isNaN(valYmin)) {
                valYmin = -20;
            }
            if (valYmax === Infinity || valYmax === -Infinity || isNaN(valYmax)) {
                valYmax = 0
            }
        }

        const valX = valXmin + ((pointX - pointXmin) * (valXmax - valXmin)) / (pointXmax - pointXmin);

        if (useLog10Scale) {
            let valY = valYmin - (pointY - pointYmax) / ((pointYmax - pointYmin) / (valYmax - valYmin));
            valY = Math.pow(10, valY);
            return [valX, valY];
        } else {
            const valY = valYmin - ((pointY - pointYmax) * (valYmax - valYmin)) / (pointYmax - pointYmin);
            return [valX, valY];
        }
    };

    getYIndex = (index: number) => {
        return Math.floor((index + 0.01) / 2);
    };
    // ------------------- helper functions --------------

    /**
     * Recalculate the plot region dimensions and tick layout info.
     *
     * Called once per render. Computes `plotWidth` / `plotHeight` from the
     * widget size and frame margins, then derives x/y tick values and pixel
     * positions (stored in `this.ticksInfo`) so that tick lines, labels, and
     * the WebGL canvas all share a consistent coordinate mapping.
     */
    updateWidthHeightTicksInfo = () => {
        const allText = this.getMainWidget().getAllText();
        const allStyle = this.getMainWidget().getAllStyle();
        const width = allStyle["width"];
        const height = allStyle["height"];
        const showFrame = allText["showFrame"];
        if (showFrame === true) {
            this.plotWidth = width - this.yAxisLabelWidth - this.yAxisTickWidth;
            this.plotHeight = height - this.titleHeight - this.xAxisLabelHeight - this.xAxisTickHeight - this.toolbarHeight;
        } else {
            this.plotWidth = width;
            this.plotHeight = height;
        }

        const scale = "Linear";
        const { xValMin, xValMax, yValMin, yValMax } = this.calcXyValMinMax();
        const xLength = this.plotWidth;
        const yLength = this.plotHeight;
        const numXgrid = this.xAxis["numGrids"];
        const numYgrid = this.yAxes[this.selectedTraceIndex]["numGrids"];
        const xTickValues = calcTicks(xValMin, xValMax, numXgrid + 1, { scale: scale });
        const xTickPositions = calcTickPositions(xTickValues, xValMin, xValMax, xLength, { scale: scale }, "vertical");
        const yTickValues = calcTicks(yValMin, yValMax, numYgrid + 1, { scale: scale });
        const yTickPositions = calcTickPositions(yTickValues, yValMin, yValMax, yLength, { scale: scale }, "vertical");
        this.ticksInfo = {
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

    calcXyValMinMax = () => {
        // x
        let xValMin = this.xAxis["valMin"];
        let xValMax = this.xAxis["valMax"];
        // auto scale
        const autoScale = this.xAxis["autoScale"];
        if (autoScale === true) {
            const xData = this.xy[0];
            const yData = this.xy[1];
            if (xData !== undefined && yData !== undefined && yData.length > 0) {
                if (xData.length > 0) {
                    xValMin = Math.min(...xData);
                    xValMax = Math.max(...xData);
                } else {
                    xValMin = 0;
                    xValMax = yData.length;
                }
            }
        }

        // y
        const yIndex = this.selectedTraceIndex;
        const yAxis = this.yAxes[yIndex];
        let yValMin = yAxis["valMin"];
        let yValMax = yAxis["valMax"];
        // auto scale
        if (yAxis["autoScale"]) {
            const xData = this.xy[2 * yIndex];
            const yData = this.xy[2 * yIndex + 1];
            if (xData !== undefined && yData !== undefined && yData.length > 0) {
                yValMin = Math.min(...yData);
                yValMax = Math.max(...yData);
            }
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

    getANewColor = () => {
        const len = this.yAxes.length;
        const index = len % this.presetColors.length;
        return this.presetColors[index];
    };

    generateDefaultYAxis = (index: number): type_yAxis => {
        return {
            label: `y${index}`,
            valMin: 0,
            valMax: 100,
            lineWidth: 2,
            lineColor: this.getANewColor(),
            ticks: [0, 50, 100],
            ticksText: [0, 50, 100],
            autoScale: false,
            lineStyle: "solid",
            pointType: "none",
            pointSize: 5,
            showGrid: true,
            numGrids: 5,
            displayScale: "Linear",
        };
    };

    initXY = () => {
        this.xy = [];
        for (let ii = 0; ii < this.getMainWidget().getChannelNamesLevel0().length; ii++) {
            this.xy.push([]);
            this.tracesHide = [];
        }
    };

    calcColor = () => {
        const selectedYAxis = this.yAxes[this.selectedTraceIndex];
        return selectedYAxis === undefined ? "rgba(0, 0, 0, 1)" : selectedYAxis.lineColor;
    }

    updateCursorValue = (event: any) => {
        let pointX0 = -100000;
        let pointY0 = -100000;
        if (event.clientX !== undefined) {
            this.lastCursorPointXY = [getMouseEventClientX(event), getMouseEventClientY(event)];
            pointX0 = getMouseEventClientX(event);
            pointY0 = getMouseEventClientY(event);
        } else {
            pointX0 = event[0];
            pointY0 = event[1];
        }

        if (pointX0 === -100000) {
            if (this.setCursorValue !== undefined) {
                this.setCursorValue(``);
            }
            return;
        }

        // cursor location inside trace plot region
        const pointX = pointX0 - this.yAxisLabelWidth - this.yAxisTickWidth - this.getStyle().left;
        const pointY = pointY0 - this.titleHeight - this.getStyle().top;

        if (this.setCursorValue !== undefined) {

            const yIndex = this.selectedTraceIndex;
            if (this.yAxes[yIndex] === undefined) {
                return;
            }

            let useLog10Scale = false;
            if (this.yAxes[yIndex] !== undefined) {
                useLog10Scale = this.yAxes[yIndex]["displayScale"] === "Log10" ? true : false;
            }

            const { xValMax, xValMin, yValMax, yValMin } = this.ticksInfo;

            const [valX, valY] = this.mapPointToXY(yIndex, [pointX, pointY], [xValMin, xValMax, yValMin, yValMax]);

            const valXStr = valX.toPrecision(4).toString();
            const valYStr = valY.toPrecision(4).toString();
            this.setCursorValue(`(${valXStr}, ${valYStr})`);
        }
    };

    _ElementCursorPosition = () => {
        const [cursorValue, setCursorValue] = React.useState(" ");
        this.setCursorValue = setCursorValue;
        return (
            <div
                style={{
                    // display: "inline-flex",
                    // justifyContent: "center",
                    // alignItems: "center",
                    width: `100%`,
                    position: "absolute",
                    top: 0,
                    right: 0,
                    // height: `${this.toolbarHeight}`,
                    height: this.getMainWidget().getAllStyle()["fontSize"] + 4,
                    display: "inline-flex",
                    flexFlow: "row",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    // backgroundColor: "green",
                    backgroundColor: "rgba(0, 255, 0, 0)",

                }}
            >
                {(() => {
                    if (g_widgets1.isEditing()) {
                        return ""
                    } else if (this.yAxes[this.selectedTraceIndex] === undefined) {
                        return ""
                    } else {
                        return cursorValue
                    }
                })()}
            </div>
        );
    };

    // ----------------------------- data and plot -------------------------------------

    mapDbrDataWitNewData = (newChannelNames: string[]) => {
        if (g_widgets1.isEditing()) {
            return;
        }

        for (let ii = 0; ii < this.getChannelNames().length; ii++) {
            const channelName = this.getChannelNames()[ii];

            // after this step, this channel must have a new data!
            if (newChannelNames.includes(channelName)) {
                const newValue = g_widgets1.getChannelValue(channelName);
                if (Array.isArray(newValue)) {
                    if (typeof newValue[0] === "number") {
                        this.xy[ii] = newValue as number[];
                    }
                }
            }
        }
    };

    // ---------------------- getters and setters -------------------------------
    getMainWidget = () => {
        return this._mainWidget;
    };

    getStyle = () => {
        return this.getMainWidget().getStyle();
    };

    getText = () => {
        return this.getMainWidget().getText();
    };
    getChannelNames = () => {
        return this.getMainWidget().getChannelNames();
    };

    getElement = () => {
        return <this._Element></this._Element>;
    };

    setXAxis = (newAxis: Record<string, any>) => {
        this.xAxis = JSON.parse(JSON.stringify(newAxis));
    };

    setYAxes = (yAxes: Record<string, any>[]) => {
        // deep copy
        this.yAxes = JSON.parse(JSON.stringify(yAxes));
    };
    getElementSettings = () => {
        return this._settings.getElementSettings();
    };

    getTraceHidden = (yIndex: number) => {
        return this.tracesHide[yIndex] === true ? true : false;
    };

    setTraceHidden = (yIndex: number, hide: boolean) => {
        this.tracesHide[yIndex] = hide;
    };

    getSelectedYAxis = () => {
        return this.yAxes[this.selectedTraceIndex];
    }

}
