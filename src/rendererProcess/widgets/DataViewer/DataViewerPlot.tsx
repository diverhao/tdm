import { DataViewer } from "./DataViewer";
import * as React from "react";
import { ElementProfileBlockNameInput } from "../../mainWindow/MainWindowStyledComponents";
import * as GlobalMethods from "../../../common/GlobalMethods";
import { getMouseEventClientX, getMouseEventClientY, type_dbrData, Channel_DBR_TYPES } from "../../../common/GlobalVariables";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { Log } from "../../../common/Log";
import { type_LocalChannel_data } from "../../../common/GlobalVariables";
import { OrthographicCamera, Scene, WebGLRenderer, Color, Vector2 } from "three";
import { Line2 } from 'three/examples/jsm/lines/Line2';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry';
import { Scale } from "../../helperWidgets/SharedElements/Scale";


const defaultTicksInfo: type_ticksInfo = {
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


export type type_ticksInfo = {
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
};

type type_yAxis = {
    label: string;
    valMin: number;
    valMax: number;
    lineWidth: number;
    lineColor: string;
    show: boolean;
    bufferSize: number;
    displayScale: "Linear" | "Log10";
    // runtime data, should not be included in tdl
    xData: number[];
    yData: number[];
    ticksInfo: type_ticksInfo,

};

type type_xAxis = {
    label: string;
    valMin: number;
    valMax: number;
};


// colors
const traceColors: [number, number, number, number][] = [
    [255, 0, 0, 1],
    [0, 0, 255, 1],
    [0, 255, 0, 1],
    [255, 255, 0, 1],
    [255, 0, 255, 1],
    [0, 255, 255, 1],
    [0, 0, 0, 1],
    [0, 0, 0, 1],
    [0, 0, 0, 1],
    [0, 0, 0, 1],
    [0, 0, 0, 1],
    [0, 0, 0, 1],
];

// time
const oneSecond = 1 * 1000;
const oneMinute = 60 * 1000;
const oneHour = 60 * 60 * 1000;
const oneDay = 24 * 60 * 60 * 1000;
const deltaTs: [number, number, string][] = [
    [oneSecond, -1, "second"],
    [2 * oneSecond, -2, "second"],
    [5 * oneSecond, -5, "second"],
    [10 * oneSecond, -10, "second"],
    [30 * oneSecond, -30, "second"],
    [oneMinute, -1, "minute"],
    [2 * oneMinute, -2, "minute"],
    [5 * oneMinute, -5, "minute"],
    [10 * oneMinute, -10, "minute"],
    [30 * oneMinute, -30, "minute"],
    [oneHour, -1, "hour"],
    [2 * oneHour, -2, "hour"],
    [5 * oneHour, -5, "hour"],
    [10 * oneHour, -10, "hour"],
    [oneDay, -1, "day"],
    [2 * oneDay, -2, "day"],
    [5 * oneDay, -5, "day"],
    [10 * oneDay, -10, "day"],
    [30 * oneDay, -30, "day"],
    [100 * oneDay, -100, "day"],
    [300 * oneDay, -300, "day"],
    [1000 * oneDay, -1000, "day"],
];

// layout
const titleHeight = 50;
const yAxisLabelWidth = 30;
const yAxisTickWidth = 30;
const xAxisLabelHeight = 30;
// const thumbnailHeight = 30;
const xAxisTickHeight = 30;
const toolbarHeight = 30;
const legendWidth = 170;


/**
 * -----------------------------------------------------------------------------------
 * |                                                                                 |
 * |                                 ElementTitle                                    |
 * |                                                                                 |
 * ----------------------------------------------------------------------------------|
 * |    |   |                                                              |         |
 * | E  | E |                                                              |   E     |
 * | l  | l |                                                              |   l     |
 * | e  | e |                                                              |   e     |
 * | m  | m |                                                              |   m     |
 * | e  | e |                                                              |   e     |
 * | n  | n |                                                              |   n     |
 * | t  | t |                      ElementPlot                             |   t     |
 * | Y  | Y |                                                              |   L     |
 * | L  | T |                                                              |   e     |
 * | a  | i |                                                              |   g     |
 * | b  | c |                                                              |   e     |
 * | e  | k |                                                              |   n     |
 * | l  | s |                                                              |   d     |
 * |    |   |                                                              |         |
 * |-----------------------------------------------------------------------|         |
 * |        |                                                              |         |
 * | E B    |                                                              |         |
 * | l l    |                      ElementXTicks                           |         |
 * | e a    |                                                              |         |
 * | m n    |                                                              |         |
 * | e k    |--------------------------------------------------------------|         |
 * | n A    |                                                              |         |
 * | t r    |                                                              |         |
 * |   e    |                      ElementXLabel                           |         |
 * |   a    |                                                              |         |
 * |---------------------------------------------------------------------------------|
 * |                                                                                 |
 * |                               ElementControls                                   |
 * |                                                                                 |
 * -----------------------------------------------------------------------------------
 */

export class DataViewerPlot {

    // ---------------------- efficiency ---------------------------
    thumbnailUpdateCount = 1;
    updateThumbnail: boolean = true;
    minLiveDataTime: number = Number.MAX_VALUE;


    plotUpdateCount = 1;
    updatePlotLines: boolean = true;

    pointsXYOnPlots: [number, number][][] = [];
    // valsXYOnPlots: [number, number][][] = [];

    pointsXYOnThumbnail: [number, number][][] = [];
    valsXYOnThumbnail: [number, number][][] = [];

    // the traces may be discontinued when the plot is dragged horizontally
    // each time the mouse is up on plot, the event.clientX is recorded
    // then the plot min and max are recalculated based on this number
    // In addition, this widget is always rendered each time
    mouseMoveEndX: number = 0;
    rightButtonClicked: boolean = false;

    // ---------------------- variables ----------------------------

    _mainWidget: DataViewer;

    // update cursor values without updating everything
    setCursorValue: React.Dispatch<React.SetStateAction<string>> | ((input: string) => void) = () => { };

    // trace
    selectedTraceIndex: number = 1;
    tracingIsMoving: boolean = true;

    // wasEditing: boolean = true;

    // plot
    _plotWidth: number;
    _plotHeight: number;
    lastCursorPointXY: [number, number] = [-100000, -100000];

    // only one x axis, ticks and ticksText are the same for each data set
    xAxis: type_xAxis = {
        label: "x label",
        // time since epoch, ms
        valMin: -10 * 60 * 1000,
        valMax: 0,
    };

    // multiple y axes
    yAxes: type_yAxis[] = [];

    constructor(mainWidget: DataViewer) {
        this._mainWidget = mainWidget;
        this._plotWidth = this.getStyle().width - yAxisLabelWidth - yAxisTickWidth - legendWidth;
        this._plotHeight = this.getStyle().height - titleHeight - xAxisLabelHeight - xAxisTickHeight - toolbarHeight;

        window.addEventListener("keydown", (event: KeyboardEvent) => {
            if (event.code === "Space") {
                this.tracingIsMoving = !this.tracingIsMoving;
                if (this.tracingIsMoving) {
                    // update this.getPlot().xAxis.valMin and valMax
                    const DT = this.xAxis.valMax - this.xAxis.valMin;
                    this.xAxis.valMax = Date.now();
                    this.xAxis.valMin = Date.now() - DT;
                }

                this.updatePlot();

            }
        })
    }



    // --------------------------- element ------------------------------------

    _Element = () => {

        const width = this.getStyle()["width"];
        const height = this.getStyle()["height"];
        const plotHeight = this.getPlotHeight();

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
                    alignItems: "center",
                    overflow: "hidden",
                }}
            >
                {/* title */}
                <this._ElementTitle></this._ElementTitle>
                <div
                    style={{
                        height: height - titleHeight - toolbarHeight,
                        width: "100%",
                        display: "inline-flex",
                        flexFlow: "row",
                        justifyContent: "flex-start",
                        alignItems: "flex-start",
                    }}
                >
                    <div
                        style={{
                            width: width - legendWidth,
                            height: "100%",
                            display: "inline-flex",
                            flexFlow: "column",
                            justifyContent: "flex-start",
                            alignItems: "center",
                        }}
                    >
                        <div
                            style={{
                                display: "inline-flex",
                                width: "100%",
                                height: plotHeight,
                                flexDirection: "row",
                                justifyContent: "flex-start",
                                alignItems: "center",
                                backgroundColor: "rgba(0, 255, 128, 1)",
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
                                display: "inline-flex",
                                width: "100%",
                                flexDirection: "column",
                                justifyContent: "flex-start",
                                alignItems: "flex-end",
                            }}
                        >
                            {/* x axis ticks */}
                            <this._ElementXTicks></this._ElementXTicks>
                            {/* x axis label */}
                            <this._ElementXLabel></this._ElementXLabel>
                        </div>
                    </div>
                    {/* legend */}
                    <this._ElementLegend></this._ElementLegend>
                </div>
                {/* control area */}
                <this._ElementControls></this._ElementControls>
            </div>
        );
    };


    _ElementTitle = () => {
        const changeTitle = (event: any) => {
            event.preventDefault();
            this.getText().title = event.target.value;
            this.updatePlot();
        };
        return (
            <div
                style={{
                    position: "relative",
                    width: `100%`,
                    height: titleHeight,
                    display: "inline-flex",
                    flexFlow: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    // backgroundColor: "lightblue",
                    backgroundColor: "rgba(68, 85, 90, 1)",
                }}
            >

                <ElementProfileBlockNameInput
                    additionalStyle={{
                        fontSize: 25,
                    }}
                    value={`${this.getText().title}`}
                    onChange={changeTitle}
                ></ElementProfileBlockNameInput>
            </div>
        );
    };

    _ElementYLabel = () => {
        const color = this.calcSelectedTraceColor();
        const yAxis = this.getSelectedYAxis();
        let label = "";
        if (yAxis !== undefined) {
            label = yAxis["label"];
        }
        return (
            <div
                style={{
                    display: "inline-flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: yAxisLabelWidth,
                    height: "100%",
                    backgroundColor: "rgba(255, 0, 255, 1)",
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
                    {label}
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


    // plot body
    _ElementPlotRaw = () => {
        const plotRef = React.useRef<any>(null);


        return (
            <div
                id={"DataViewerPlot-" + Math.random().toString()}
                ref={plotRef}
                style={{
                    width: `${this.getPlotWidth()}px`,
                    height: `${this.getPlotHeight()}px`,
                    outline: "1px solid black",
                    backgroundColor: "rgba(0, 255, 255, 0)",
                }}
                onMouseEnter={() => {
                    if (!g_widgets1.isEditing()) {
                        window.addEventListener("mousemove", this.updateCursorElement);
                    }
                }}
                onMouseLeave={() => {
                    this.lastCursorPointXY = [-100000, -100000];
                    this.setCursorValue("");
                    window.removeEventListener("mousemove", this.updateCursorElement);
                }}
                onMouseDown={(event: any) => {

                    if (event.button === 0) {
                        window.addEventListener("mousemove", this.handleMouseMoveOnPlotX);
                    } else if (event.button === 2) {
                        window.addEventListener("mousemove", this.handleMouseMoveOnPlotY);
                    }
                    window.addEventListener("mouseup", this.handleMouseUpOnPlot);
                }}

                onWheel={(event: React.WheelEvent) => {
                    event.preventDefault()
                    if (event.ctrlKey === true) {
                        this.handleWheelOnPlotY(event);
                    } else {
                        this.handleWheelOnPlotX(event);
                    }
                }}
                onDoubleClick={(event: any) => {
                    this.fetchArchiveData();
                }}

                // double click to auto scale current Y axis
                onContextMenu={(event: React.MouseEvent) => {
                    // right click
                    if (event.button !== 2) {
                        return;
                    }
                    if (this.rightButtonClicked === true) {
                        this.rightButtonClicked = false;

                        const yAxis = this.yAxes[this.selectedTraceIndex];
                        if (yAxis === undefined) {
                            return;
                        }
                        const yValMinMax = this.findVisibleYValueRange(this.selectedTraceIndex);

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

                        this.updatePlot();
                    } else {
                        this.rightButtonClicked = true;
                        setTimeout(() => {
                            this.rightButtonClicked = false;
                        }, 300)
                    }
                }}
            >
                {/* tick lines first */}
                <this._ElementGridLines></this._ElementGridLines>
                {/* data */}
                <this._ElementLines></this._ElementLines>
            </div>
        );
    };

    _ElementPlot = React.memo(this._ElementPlotRaw, () => {
        if (this.updatePlotLines) {
            return false;
        } else {
            return true;
        }
    })

    _ElementGridLines = () => {

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
        )
    }


    _ElementLines = () => {
        const mountRef = React.useRef<HTMLDivElement>(null);

        const fun1 = () => {
            const scene = new Scene();
            const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 10);

            camera.position.z = 1;
            const containerWidth = this.getPlotWidth();
            const containerHeight = this.getPlotHeight();

            const pixelWorldUnitRatioX = containerWidth / 2;
            const pixelWorldUnitRatioY = containerHeight / 2;

            const renderer = new WebGLRenderer({ alpha: true });
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(containerWidth, containerHeight);
            mountRef.current!.appendChild(renderer.domElement);

            this.yAxes.forEach((yAxis: type_yAxis, index: number) => {

                const positions = this.mapXYsToPointsWebGl(index);
                const color = yAxis.lineColor;

                const showLine = yAxis.show;

                // ---------------- line ----------------
                if (showLine === true && positions.length >= 6) {
                    const lineGeometry = new LineGeometry();
                    lineGeometry.setPositions(positions);

                    // const lineWidth = this.yAxes[this.getYIndex(index)].lineWidth;
                    const lineWidth = this.yAxes[index].lineWidth;

                    const lineMaterial = new LineMaterial({
                        worldUnits: false,
                        color: new Color(color),
                        linewidth: lineWidth,
                        resolution: new Vector2(containerWidth, containerHeight),
                    });

                    const line = new Line2(lineGeometry, lineMaterial);
                    line.computeLineDistances();

                    scene.add(line);
                }
            });

            renderer.render(scene, camera);

            return () => {
                mountRef.current?.removeChild(renderer.domElement);
                renderer.dispose();
            };
        };

        React.useEffect(fun1);

        return <div ref={mountRef} style={{ width: this.getPlotWidth(), height: this.getPlotWidth() }} />;
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
        return (
            <div
                style={{
                    width: `${this.getPlotWidth()}px`,
                    height: "100%",
                    display: "inline-flex",
                    flexFlow: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    // backgroundColor: "yellow",
                    backgroundColor: "rgba(255, 255, 0, 0)",
                }}
            >
                {this.xAxis.label}
            </div>
        );
    };


    _ElementLegend = () => {
        const elementAddTraceRef = React.useRef<any>(null);

        return (
            <div
                style={{
                    width: `${legendWidth}px`,
                    height: "100%",
                    display: "inline-flex",
                    flexFlow: "column",
                    justifyContent: "flex-start",
                    alignItems: "flex-start",
                    // backgroundColor: "cyan",
                    backgroundColor: "rgba(0, 100, 100, 0)",
                }}
            >
                {this.yAxes.map((yAxis: type_yAxis, index: number) => {
                    const xData = yAxis["xData"];
                    const yData = yAxis["yData"];
                    let timeStr = "0000-00-00 00:00:00.000";
                    let valueStr = "0";
                    if (xData.length > 1) {
                        // the last element is a patch
                        timeStr = GlobalMethods.convertEpochTimeToString(xData[xData.length - 2]);
                        valueStr = yData[yData.length - 1].toString();
                    }
                    return (
                        <div
                            key={this.yAxes[index].label + `-${index}`}
                            style={{
                                display: "inline-flex",
                                flexFlow: "column",
                                justifyContent: "flex-start",
                                alignItems: "flex-start",
                                width: "100%",
                                height: "fit-content",
                                color: yAxis.show ? yAxis.lineColor : "rgba(0,0,0,0.5)",
                                margin: "3px",
                                backgroundColor: this.getSelectedTraceIndex() === index ? "rgba(210, 210, 210, 1)" : "rgba(0,0,0,0)",
                            }}
                            onMouseEnter={(event: any) => {
                                this.setCursorValue("Click to selected the trace, double-click to configure the trace.")
                            }}
                            onMouseLeave={(event: any) => {
                                this.setCursorValue("")
                            }}
                            onMouseDown={(event: any) => {
                                if (event.button !== 0) {
                                    return;
                                }

                                this.setSelectedTraceIndex(index);
                                this.updatePlot();
                            }}

                            onDoubleClick={(event: any) => {
                                if (event.button !== 0) {
                                    return;
                                }

                                this.getMainWidget().setShowSettingsPage(index);
                                this.updatePlot();
                            }}
                        >
                            <div>{yAxis.show === true ? "" : "(hidden) "} {yAxis.label}&nbsp;</div>
                            <div>{timeStr}</div>
                            <div>{`${valueStr}`}</div>
                        </div>
                    );
                })}
                <div
                    ref={elementAddTraceRef}
                    style={{
                        display: "inline-flex",
                        flexFlow: "column",
                        justifyContent: "flex-start",
                        alignItems: "flex-start",
                        width: "100%",
                        // backgroundColor: "red",
                        height: "fit-content",
                        // color: yAxis.lineColor,
                        paddingTop: 5,
                        paddingBottom: 5,
                        paddingLeft: 5,
                        boxSizing: "border-box",
                        margin: "3px",
                        opacity: 0.3,
                        // cursor: "pointer",
                        // backgroundColor: this.selectedTraceIndex === index ? "rgba(210, 210, 210, 1)" : "rgba(0,0,0,0)",
                    }}
                    onMouseDown={(event: any) => {
                        if (event.button !== 0) {
                            return;
                        }
                        this.addTrace("");
                        const newIndex = this.getChannelNames().length - 1;
                        this.setSelectedTraceIndex(newIndex);
                        this.getMainWidget().setShowSettingsPage(newIndex);
                        this.updatePlot();
                    }}
                    onMouseEnter={() => {
                        if (elementAddTraceRef.current !== null) {
                            // elementAddTraceRef.current.style["outline"] = "solid 3px rgba(180, 180, 180, 1)";
                            elementAddTraceRef.current.style["opacity"] = 1;
                        }
                        this.setCursorValue("Add trace")
                    }}
                    onMouseLeave={() => {
                        if (elementAddTraceRef.current !== null) {
                            // elementAddTraceRef.current.style["outline"] = "none";
                            elementAddTraceRef.current.style["opacity"] = 0.3;
                        }
                        this.setCursorValue("")
                    }}
                >
                    <div style={{ fontSize: 20 }}>+</div>
                </div>


            </div >
        );
    };

    _ElementControls = () => {

        const isSingleWidget = this.getMainWidget().getText()["singleWidget"];

        return (
            <div
                style={{
                    // width: `100%`,
                    width: isSingleWidget === true ? window.innerWidth : this.getMainWidget().getAllStyle()["width"],
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

                            for (let ii = 0; ii < this.yAxes.length; ii++) {
                                const yValMinMax = this.findVisibleYValueRange(ii);
                                const yAxis = this.yAxes[ii];
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
                            this.updatePlot();
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

                            const yAxis = this.yAxes[this.selectedTraceIndex];
                            if (yAxis === undefined) {
                                return;
                            }
                            const yValMinMax = this.findVisibleYValueRange(this.selectedTraceIndex);

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

                            this.updatePlot();
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

                            this.getMainWidget().setShowSettingsPage(-1);
                            this.updatePlot();
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
                            this.tracingIsMoving = !this.tracingIsMoving;

                            if (this.tracingIsMoving) {
                                // update this.getPlot().xAxis.valMin and valMax
                                const DT = this.xAxis.valMax - this.xAxis.valMin;
                                this.xAxis.valMax = Date.now();
                                this.xAxis.valMin = Date.now() - DT;
                            }

                            this.updatePlot();
                        }}
                    >
                        {this.tracingIsMoving ? (
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

                            const xAxis = this.xAxis;
                            if (xAxis === undefined) {
                                return;
                            }
                            const dt = xAxis.valMax - xAxis.valMin;
                            xAxis.valMin = xAxis.valMax - dt / this.getText()["axisZoomFactor"];
                            if (this.tracingIsMoving) {
                                xAxis.valMax = Date.now();
                            }
                            this.updatePlot();
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

                            const xAxis = this.xAxis;
                            if (xAxis === undefined) {
                                return;
                            }
                            const dt = xAxis.valMax - xAxis.valMin;
                            xAxis.valMin = xAxis.valMax - dt * this.getText()["axisZoomFactor"];
                            if (this.tracingIsMoving) {
                                xAxis.valMax = Date.now();
                            }
                            this.updatePlot();
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

                            this.tracingIsMoving = false;
                            const xAxis = this.xAxis;
                            if (xAxis === undefined) {
                                return;
                            }
                            const dt = xAxis.valMax - xAxis.valMin;
                            // each move is 20% of horizontal size
                            xAxis.valMin = xAxis.valMin + dt / 4;
                            xAxis.valMax = xAxis.valMax + dt / 4;
                            // this.calcXTicksAndLabel();
                            this.updatePlot();
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

                            this.tracingIsMoving = false;
                            const xAxis = this.xAxis;
                            if (xAxis === undefined) {
                                return;
                            }
                            const dt = xAxis.valMax - xAxis.valMin;
                            // each move is 20% of horizontal size
                            xAxis.valMin = xAxis.valMin - dt / 4;
                            xAxis.valMax = xAxis.valMax - dt / 4;
                            this.updatePlot();
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
                            for (let ii = 0; ii < this.yAxes.length; ii++) {
                                const yAxis = this.yAxes[ii];
                                if (yAxis === undefined) {
                                    continue;
                                }
                                const yMin = yAxis.valMin;
                                const yMax = yAxis.valMax;
                                const yMid = (yMin + yMax) / 2;
                                const dy = (yMax - yMin) / 2;
                                // zoom
                                const yMinNew = yMid - dy / this.getText()["axisZoomFactor"];
                                const yMaxNew = yMid + dy / this.getText()["axisZoomFactor"];
                                yAxis.valMin = yMinNew;
                                yAxis.valMax = yMaxNew;
                            }

                            const xAxis = this.xAxis;
                            if (this.tracingIsMoving) {
                                xAxis.valMax = Date.now();
                            }

                            this.updatePlot();
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

                            for (let ii = 0; ii < this.yAxes.length; ii++) {
                                const yAxis = this.yAxes[ii];
                                if (yAxis === undefined) {
                                    continue;
                                }
                                const yMin = yAxis.valMin;
                                const yMax = yAxis.valMax;
                                const yMid = (yMin + yMax) / 2;
                                const dy = (yMax - yMin) / 2;
                                const yMinNew = yMid - dy * this.getText()["axisZoomFactor"];
                                const yMaxNew = yMid + dy * this.getText()["axisZoomFactor"];
                                yAxis.valMin = yMinNew;
                                yAxis.valMax = yMaxNew;
                            }
                            const xAxis = this.xAxis;
                            if (this.tracingIsMoving) {
                                xAxis.valMax = Date.now();
                            }

                            this.updatePlot();
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

                            for (let ii = 0; ii < this.yAxes.length; ii++) {
                                const yAxis = this.yAxes[ii];
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
                            const xAxis = this.xAxis;
                            if (this.tracingIsMoving) {
                                xAxis.valMax = Date.now();
                            }

                            this.updatePlot();
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

                            for (let ii = 0; ii < this.yAxes.length; ii++) {
                                const yAxis = this.yAxes[ii];
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
                            const xAxis = this.xAxis;
                            if (this.tracingIsMoving) {
                                xAxis.valMax = Date.now();
                            }

                            this.updatePlot();
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

                            this.exportData();
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
                        this.fetchArchiveData();

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
        const [cursorValue, setCursorValue] = React.useState(" ");
        this.setCursorValue = setCursorValue;
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
                    } else if (this.yAxes[this.getSelectedTraceIndex()] === undefined) {
                        return " " + cursorValue
                    } else {
                        return " " + cursorValue
                    }
                })()}
            </div>
        );
    };

    _StyledFigButton = ({ children, onMouseDown, hintText }: any) => {
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
                            if (typeof hintText === "string" && this.setCursorValue !== undefined) {
                                this.setCursorValue(hintText)
                            }
                        }
                    }
                }}
                onMouseLeave={() => {
                    if (elementRef.current !== null) {
                        if (!g_widgets1.isEditing()) {
                            elementRef.current.style["opacity"] = 0.4;
                            if (typeof hintText === "string" && this.setCursorValue !== undefined) {
                                this.setCursorValue("")
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

    // ------------------------ trace ----------------------------


    /**
     * Append a trace to the end.
     * 
     * (1) insert an empty channel name "" to this.getRawChannelNames() and expand the channel name
     *     without checking the channel name duplication
     * 
     * (2) add a new trace data to the data structure: this.x, this.y and this.yAxes
     * 
     * (3) select this trace
     * 
     * (4) update the plot if necessary
     * 
     * (5) connect and monitor this channel
     */
    addTrace = async (newChannelName: string, doFlush: boolean = true) => {
        // (1)
        const mainWidget = this.getMainWidget();
        mainWidget.getChannelNamesLevel0().push(newChannelName);
        mainWidget.processChannelNames([], false);

        // (2)
        // this.addNewTraceData(newTraceName, undefined);
        let yAxis: type_yAxis = {
            label: newChannelName, // updated every time
            valMin: 0, // updated every time
            valMax: 10, // updated every time
            lineWidth: 2,
            lineColor: `rgba(${this.getNewColor()})`,
            show: true,
            bufferSize: 50000,
            displayScale: "Linear",
            xData: [],
            yData: [],
            ticksInfo: JSON.parse(JSON.stringify(defaultTicksInfo)),
        }
        this.yAxes.push(yAxis);

        // (3)
        this.setSelectedTraceIndex(mainWidget.getChannelNamesLevel0().length - 1);

        // (4)
        if (doFlush) {
            this.updatePlot();
        }

        // (5)
        const newTcaChannel = g_widgets1.createTcaChannel(newChannelName, this.getMainWidget().getWidgetKey());
        if (newTcaChannel !== undefined) {
            await newTcaChannel.getMeta(undefined);
            await newTcaChannel.get(undefined, 1, Channel_DBR_TYPES.DBR_TIME_DOUBLE, true, undefined);
            newTcaChannel.monitor();
        }
    };

    /**
     * Change the trace (channel) name
     */
    renameTrace = async (index: number, newTraceName: string, doFlush: boolean = true, forceUpdate: boolean = false) => {

        const oldTraceName = this.getChannelNames()[index];
        if ((newTraceName === oldTraceName) && forceUpdate === false) {
            // no change
            return;
        }

        // (1)
        const mainWidget = this.getMainWidget();
        mainWidget.getChannelNamesLevel0()[index] = newTraceName;
        mainWidget.processChannelNames([], false);

        // (2)
        // this.updateTraceData(index, newTraceName);
        const yAxis = this.yAxes[index];
        if (yAxis === undefined) {
            return;
        }
        // (1)
        yAxis["xData"] = [];
        yAxis["yData"] = [];
        // (2)
        // default yAxis
        yAxis["label"] = newTraceName;


        // (3)
        this.setSelectedTraceIndex(index);

        // (4)
        if (doFlush) {
            this.updatePlot();
        }

        // (5)
        const newTcaChannel = g_widgets1.createTcaChannel(newTraceName, this.getMainWidget().getWidgetKey());
        if (newTcaChannel !== undefined) {
            await newTcaChannel.getMeta(undefined);
            await newTcaChannel.get(undefined, 1, Channel_DBR_TYPES.DBR_TIME_DOUBLE, true, undefined);
            newTcaChannel.monitor();
        }
    };

    /**
     * Remove a trace
     * 
     * (1) remove channel name from this.getRawChannelNames(), and expand channel names
     * 
     * (2) remove this channel's x, y and yAxis data
     * 
     * (3) remove this channel
     * 
     * (4) select the previous trace
     * 
     * (5) hide the trace setting page
     * 
     * (5) update plot
     */
    removeTrace = (index: number) => {
        const traceName = this.getMainWidget().getChannelNames()[index];
        if (traceName === undefined) {
            return;
        }

        // (1)
        this.getMainWidget().getChannelNamesLevel0().splice(index, 1);
        this.getMainWidget().processChannelNames([], false);

        // (2)
        this.yAxes.splice(index, 1);

        // (3)
        if (!this.getMainWidget().getChannelNames().includes(traceName)) {
            g_widgets1.removeTcaChannel(traceName, this.getMainWidget().getWidgetKey());
        }
        // (4)
        const newSelectedTrace = index - 1 > -1 ? index - 1 : index + 1 > this.getChannelNames().length - 1 ? -1 : index + 1;
        this.setSelectedTraceIndex(newSelectedTrace);

        // (5)
        this.getMainWidget().setShowSettingsPage(-100);

        // (6)
        this.updatePlot();
    };

    getNewColor = (): [number, number, number, number] => {
        const numTraces = this.yAxes.length;
        const newColorIndex = (numTraces) % traceColors.length;
        return traceColors[newColorIndex];
    };

    updateTraceShowOrHide = (index: number, showTrace: boolean) => {
        const yAxis = this.yAxes[index];
        if (yAxis !== undefined) {
            yAxis["show"] = showTrace;
        }
        this.updatePlot();
    }



    updateTraceLineWidth = (index: number, newWidth: number) => {
        const yAxis = this.yAxes[index];
        if (yAxis !== undefined) {
            yAxis["lineWidth"] = newWidth;
        }
        this.updatePlot();
    }

    updateTraceBufferSize = (index: number, newSize: number) => {
        const yAxis = this.yAxes[index];
        if (yAxis !== undefined) {
            yAxis["bufferSize"] = newSize;
        }
        this.updatePlot();
    }

    updateTraceScale = (index: number, newScale: "Linear" | "Log10") => {
        const yAxis = this.yAxes[index];
        if (yAxis === undefined) {
            return;
        }
        yAxis["displayScale"] = newScale;
        this.updatePlot();
    }
    // ---------------------- data -------------------------------

    fetchArchiveData = () => {
        for (let ii = 0; ii < this.getChannelNames().length; ii++) {
            const channelName = this.getChannelNames()[ii];
            const timeMinOnPlot = this.xAxis["valMin"];
            const timeMaxOnPlot = this.xAxis["valMax"];
            const timeMinInData = this.minLiveDataTime;
            // the archive data must be earlier than the live data
            const startTime = timeMinOnPlot;
            const endTime = Math.min(timeMaxOnPlot, timeMinInData);
            Log.info("requesting archive data from", new Date(startTime).toLocaleTimeString(), "to", new Date(endTime).toLocaleString())
            if (endTime > startTime) {
                // const startTime = GlobalMethods.convertEpochTimeToString(timeMinOnPlot).split(".")[0];
                // const endTime = GlobalMethods.convertEpochTimeToString(timeMinInData).split(".")[0];
                const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
                displayWindowClient.getIpcManager().sendFromRendererProcess("request-archive-data", {
                    displayWindowId: displayWindowClient.getWindowId(),
                    widgetKey: this.getMainWidget().getWidgetKey(),
                    channelName: channelName,
                    startTime: startTime,
                    endTime: endTime,
                })
            }
        }
    }

    mapDbrDataWitNewArchiveData = (data: {
        displayWindowId: string,
        widgetKey: string,
        channelName: string,
        startTime: number, // ms since epoch // "2024-01-01 01:23:45", no ms
        endTime: number,
        archiveData: [number[], number[]],
    }) => {
        if (g_widgets1.isEditing()) {
            return;
        }
        if (this.getChannelNames().includes(data["channelName"])) {
            const ii = this.getChannelNames().indexOf(data["channelName"]);
            const yAxis = this.yAxes[ii];
            if (yAxis === undefined) {
                return;
            }
            const xData = yAxis["xData"];
            const yData = yAxis["yData"];
            const xDataNew = data["archiveData"][0];
            const yDataNew = data["archiveData"][1];


            const minNewDataTime = xDataNew[0];
            const maxNewDataTime = xDataNew[xDataNew.length - 1];

            // empty data
            if (typeof minNewDataTime !== "number" || typeof maxNewDataTime !== "number") {
                return;
            }

            let [leftIndex, rightIndex] = GlobalMethods.binarySearchRange(xData, minNewDataTime, maxNewDataTime);
            Log.info("Obtained archive data, replace data from index", leftIndex, "to index", rightIndex);
            // archive data is not within the range of existing data
            if (leftIndex === -100 || rightIndex === -100) {
                leftIndex = -2;
                rightIndex = -1;
            }

            const originalStartX = xData[leftIndex - 1];
            const originalStartY = yData[leftIndex - 1];
            const originalEndX = xData[rightIndex + 1];
            const originalEndY = yData[rightIndex + 1];

            // archive data
            const x1: number[] = [];
            const y1: number[] = [];

            // patch first point: (new time, old value)
            if (originalStartY !== undefined) {
                x1.push(xDataNew[0]); // new time
                y1.push(originalStartY); // old value
            } else {
                // archive data is earlier than any existing data
                // there is not old data to patch
                x1.push(xDataNew[0]); // new time
                y1.push(yDataNew[0]); // new value
            }

            for (let ii = 0; ii < xDataNew.length - 1; ii++) {
                // (new time, new value)
                x1.push(xDataNew[ii]);
                y1.push(yDataNew[ii]);
                // (next new time, new value)
                x1.push(xDataNew[ii + 1]);
                y1.push(yDataNew[ii]);
            }

            // patch last point
            if (originalEndY !== undefined) {
                x1.push(xDataNew[xDataNew.length - 1]); // last time stamp in archive data
                y1.push(yDataNew[yDataNew.length - 1]); //  last value in archive data
                // the first point in the original data should be modified (patched)
                yData[rightIndex + 1] = yDataNew[yDataNew.length - 1];
            } else {
                // exisiting data is empty
                x1.push(xDataNew[xDataNew.length - 1]); // last time stamp in archive data
                y1.push(yDataNew[yDataNew.length - 1]); //  last value in archive data
                // the first point in the original data should be modified (patched)
                yData[rightIndex + 1] = yDataNew[yDataNew.length - 1];

            }

            // remove the data that will be overriden by archive data
            xData.splice(leftIndex, rightIndex - leftIndex + 1);
            yData.splice(leftIndex, rightIndex - leftIndex + 1);


            xData.splice(Math.max(leftIndex, 0), 0, ...x1);
            yData.splice(Math.max(leftIndex, 0), 0, ...y1);
        }
    }

    /**
     * Invoked whenever there are new data received by the display window client. Usually comes every 0.1 second, or
     * whenever the GET result arrives.
     * 
     * This funciton does not update plot. The plot is updated periodically or in mouse/keyboard actions
     * 
     */
    mapDbrDataWitNewData = (dbrDataList: Record<string, type_dbrData | type_dbrData[] | type_LocalChannel_data | undefined>) => {

        if (g_widgets1.isEditing()) {
            return;
        }

        const yAxes = this.yAxes;

        for (let ii = 0; ii < this.getChannelNames().length; ii++) {
            const channelName = this.getChannelNames()[ii];

            const data = dbrDataList[channelName];
            if (data === undefined) {
                continue;
            }

            const yAxis = yAxes[ii];
            if (yAxis === undefined) {
                continue;
            }

            // if the data is an array, that means there were more than one DBR data coming in
            if (Array.isArray(data)) {
                for (let dataElement of data) {
                    this.addOneDbrData(dataElement, yAxis);
                }
            } else {
                this.addOneDbrData(data, yAxis);
            }

            // remove data if exceeds buffer size
            const bufferSize = yAxis["bufferSize"];
            const xData = yAxis["xData"];
            const yData = yAxis["yData"];
            const overSize = xData.length - bufferSize * 2;
            if (overSize > 0) {
                xData.splice(0, overSize);
                yData.splice(0, overSize);
            }
        }
    };


    /**
     * Add one dbr data to the x and y data. 
     * 
     * (1) remove patch point Z
     * 
     * (2) add point A, this point as new time stamp, but with old value
     * 
     * (3) add point B, this point has new time stamp, and new value
     * 
     * (4) add new patch point Z', this point has current time stamp, and new value
     */
    addOneDbrData = (data: type_dbrData | type_LocalChannel_data | undefined, yAxis: type_yAxis) => {

        if (data === undefined) {
            Log.debug("data is not valid", data);
            return;
        }
        const value = data.value;
        if (typeof value !== "number") {
            Log.debug("value is not valid", data);
            return;
        }

        const secondsSinceEpoch = data["secondsSinceEpoch"];
        const nanoSeconds = data["nanoSeconds"];
        if (typeof secondsSinceEpoch !== "number" || typeof nanoSeconds !== "number") {
            Log.info("new data does not have time stamp")
            return;
        }

        // convert EPICS timestamp to UNIX timestamp
        let timeStamp = GlobalMethods.converEpicsTimeStampToEpochTime(
            secondsSinceEpoch * 1000 + nanoSeconds * 1e-6
        );

        // sometimes the channel was never processed
        if (secondsSinceEpoch === 0) {
            Log.info("new data has 0 value time stamp", data)
            timeStamp = Date.now();
        }

        if (timeStamp < this.minLiveDataTime && this.minLiveDataTime === Number.MAX_VALUE) {
            this.minLiveDataTime = timeStamp;
        }

        const xData = yAxis["xData"];
        const yData = yAxis["yData"];

        // (1)
        xData.pop();
        const oldValue = yData.pop();

        // (2)
        if (oldValue !== undefined) {
            xData.push(timeStamp);
            yData.push(oldValue);
        }

        // (3)
        xData.push(timeStamp);
        yData.push(value);

        // (4)
        xData.push(Date.now());
        yData.push(value);

    }

    exportData = () => {
        const result = this.prepareExportData();

        const windowId = g_widgets1.getRoot().getDisplayWindowClient().getWindowId();
        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
        const mainProcessMode = displayWindowClient.getMainProcessMode();
        if (mainProcessMode === "web") {
            const blob = new Blob([JSON.stringify(result, null, 4)], { type: 'text/json' });
            const dateNowStr = GlobalMethods.convertEpochTimeToString(Date.now());
            const suggestedName = `DataViewer-data-${dateNowStr}.json`;
            const description = 'Data Viewer data';
            const applicationKey = "application/json";
            const applicationValue = [".json"];
            displayWindowClient.downloadData(blob, suggestedName, description, applicationKey, applicationValue);
        } else {
            g_widgets1.getRoot().getDisplayWindowClient().getIpcManager().sendFromRendererProcess("data-viewer-export-data",
                {
                    displayWindowId: windowId,
                    data: result as Record<
                        string,
                        {
                            Time: string[];
                            Data: number[];
                        }
                    >
                }
            );
        }
    };

    prepareExportData = () => {
        const result: Record<string, Record<string, number[] | string[]>> = {};
        const yAxes = this.yAxes;
        for (let ii = 0; ii < this.getMainWidget().getChannelNames().length; ii++) {
            const channelName = this.getMainWidget().getChannelNames()[ii];
            const yAxis = yAxes[ii];
            if (yAxis === undefined) {
                return;
            }
            const x = yAxis["xData"];
            const y = yAxis["yData"];
            const processedX: string[] = [];
            const processedY: number[] = [];
            // last data point is a patch, skip
            for (let jj = 0; jj < x.length - 1; jj++) {
                const xVal = x[jj];
                const xValNext = x[jj + 1];
                const yVal = y[jj];
                if (xVal !== xValNext) {
                    processedX.push(GlobalMethods.convertEpochTimeToString(xVal));
                    processedY.push(yVal);
                }
            }
            result[channelName] = {
                Time: processedX,
                Data: processedY,
            };
        }
        return result;

    }

    // ----------------------------- helpers -----------------------

    /**
     * Invoked when the plot should be updated, i.e. 
     * 
     * (1) scheduled periodic plot update (every second), or
     * 
     * (2) user operations: zoom in/out, pan left/right/up/down, change plot x/y plot range, add/remove trace, start/stop play
     * 
     * Note: the trace is a polyline, it is calculated during rendering. The data reduction is also done during trace rendering.
     * 
     * It does:
     * 
     * (1) patch the data to prevent , this is a low-cost operation, do it anyway
     *    (1.1) remove the old patch point Z'
     *    (1.2) add new patch point Z, with new (current) time stamp, and last value
     * 
     * (2) update runtime plot info, such as x/y value min/max, tick positions
     * 
     * (3) calculate cursor value
     * 
     * (4) update the widget
     * 
     */
    updatePlot = (doFlush: boolean = true) => {
        if (g_widgets1.isEditing()) {
            return;
        }

        // (1)
        const yAxes = this.yAxes;
        for (const yAxis of yAxes) {
            const xData = yAxis["xData"];
            const yData = yAxis["yData"];
            if (xData.length > 1) {
                // (1)
                xData.pop();
                const oldY = yData.pop();

                // (2)
                if (oldY !== undefined) {
                    xData.push(Date.now());
                    yData.push(oldY);
                }
            }
        }

        // (2)
        for (let ii = 0; ii < yAxes.length; ii++) {
            this.updateTicksInfo(ii);
        }

        // (3)
        this.updateCursorElement(this.lastCursorPointXY);

        // (4)
        g_widgets1.addToForceUpdateWidgets(this.getMainWidget().getWidgetKey());
        if (doFlush) {
            g_flushWidgets();
        }
    };

    findVisibleYValueRange = (index: number): [number, number] | undefined => {
        const yAxis = this.yAxes[index];
        if (yAxis === undefined) {
            return undefined;
        }
        const xData0 = yAxis["xData"];
        const yData0 = yAxis["yData"];

        if (yData0 === undefined) {
            return undefined;
        }

        if (xData0[xData0.length - 1] < this.xAxis.valMin) {
            return undefined;
        }
        if (xData0[0] > this.xAxis.valMax) {
            return undefined;
        }

        let xMinIndex = xData0.findIndex((element: number) => element >= this.xAxis.valMin);
        if (xMinIndex > 1) {
            xMinIndex = xMinIndex - 1;
        }
        let xMaxIndex = xData0.findIndex((element: number) => element >= this.xAxis.valMax);

        if (xMaxIndex === -1) {
            xMaxIndex = xData0.length;
        }
        if (xMaxIndex < xData0.length) {
            xMaxIndex = xMaxIndex + 1;
        }

        if (xMinIndex === -1 || xMaxIndex === -1) {
            return undefined;
        }
        // only calculate the data in visible region
        const yData = yData0.slice(xMinIndex, xMaxIndex);
        let yValMax = Number.MIN_VALUE;
        let yValMin = Number.MAX_VALUE;

        for (let ii = 0; ii < yData.length; ii++) {
            const element = yData[ii];
            if (typeof element === "number") {
                yValMax = Math.max(yValMax, element);
                yValMin = Math.min(yValMin, element);
            }
        }

        return [yValMin, yValMax];
    }


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
        return GlobalMethods.mapXYsToPointsWebGl(xData, yData, xValMin, xValMax, yValMin, yValMax);
    };

    /**
     * Set the React state value setter for cursor text on the plot. It causes the cursor text to update.
     * 
     * @param {event: any} Input could be an mouse event, or a [number, number] array
     */
    updateCursorElement = (event: any) => {

        const yAxis = this.getSelectedYAxis();
        if (yAxis === undefined) {
            return;
        }


        let pointX0 = -100000;
        let pointY0 = -100000;

        if (event.clientX !== undefined) {
            // event callback
            this.lastCursorPointXY = [getMouseEventClientX(event), getMouseEventClientY(event)];
            pointX0 = getMouseEventClientX(event);
            pointY0 = getMouseEventClientY(event);
        } else {
            // current cursor position on web page
            pointX0 = event[0];
            pointY0 = event[1];
        }

        // special case: the mouse is not on the plot region
        if (pointX0 === -100000) {
            // this.setCursorValue(``);
            return;
        }

        const ticksInfo = yAxis["ticksInfo"];
        const pointX = pointX0 - yAxisLabelWidth - yAxisTickWidth - this.getStyle().left;
        const pointY = pointY0 - titleHeight - this.getStyle().top;
        const xValMin = ticksInfo.xValMin;
        const xValMax = ticksInfo.xValMax;
        const yValMin = ticksInfo.yValMin;
        const yValMax = ticksInfo.yValMax;

        const [valX, valY] = GlobalMethods.mapPointToXy(pointX, pointY, xValMin, xValMax, yValMin, yValMax, this.getPlotWidth(), this.getPlotHeight());
        // const [valX, valY] = this.mapPointToXY(this.getSelectedTraceIndex(), [pointX, pointY]);

        const timeStr = GlobalMethods.convertEpochTimeToString(valX);
        const valYStr = valY.toPrecision(4).toString();
        this.setCursorValue(`(${timeStr}, ${valYStr})`);
    };

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
        // fixed numbers
        const numXgrid = 10;
        const numYgrid = 5;
        const xTickValues = GlobalMethods.calcTicks(xValMin, xValMax, numXgrid + 1, { scale: scale });
        const xTickPositions = GlobalMethods.calcTickPositions(xTickValues, xValMin, xValMax, xLength, { scale: scale }, "vertical");
        const yTickValues = GlobalMethods.calcTicks(yValMin, yValMax, numYgrid + 1, { scale: scale });
        const yTickPositions = GlobalMethods.calcTickPositions(yTickValues, yValMin, yValMax, yLength, { scale: scale }, "vertical");
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
        const allStyle = this.getMainWidget().getAllStyle();
        const width = allStyle["width"];
        const height = allStyle["height"];
        this.setPlotWidth(width - yAxisLabelWidth - yAxisTickWidth - legendWidth);
        this.setPlotHeight(height - titleHeight - xAxisLabelHeight - xAxisTickHeight - toolbarHeight);
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

        return (
            {
                xValMin: xValMin,
                xValMax: xValMax,
                yValMin: yValMin,
                yValMax: yValMax,
            }
        )
    }


    /**
     * get the currently selected trace's color
     */
    calcSelectedTraceColor = () => {
        const selectedYAxis = this.getSelectedYAxis();
        return selectedYAxis === undefined ? "rgba(0, 0, 0, 1)" : selectedYAxis.lineColor;
    }



    // ------------------ mouse event handlers  ----------------------

    /**
     * rotate mouse wheel to zoom x-direction
     */
    handleWheelOnPlotX = (event: React.WheelEvent) => {
        const yAxis = this.getSelectedYAxis();
        if (yAxis === undefined) {
            return;
        }
        const direction = event.deltaY < 0 ? "zoom-in" : "zoom-out";

        const pointX0 = event.clientX;
        const pointY0 = 0;
        const pointX = pointX0 - yAxisLabelWidth - yAxisTickWidth - this.getStyle().left;
        const pointY = pointY0 - titleHeight - this.getStyle().top;

        const ticksInfo = yAxis["ticksInfo"];
        const xValMin = ticksInfo["xValMin"];
        const xValMax = ticksInfo["xValMax"];
        const yValMin = ticksInfo["yValMin"];
        const yValMax = ticksInfo["yValMax"];

        const [valXMid, valYMid] = GlobalMethods.mapPointToXy(pointX, pointY, xValMin, xValMax, yValMin, yValMax, this.getPlotWidth(), this.getPlotHeight());

        const xAxis = this.xAxis;

        const zoomFactor = this.getText()["axisZoomFactor"];

        if (this.tracingIsMoving) {
            if (direction === "zoom-in") {
                xAxis.valMax = Date.now();
                xAxis.valMin = xAxis.valMax - (xAxis.valMax - xAxis.valMin) / zoomFactor;
            } else {
                xAxis.valMax = Date.now();
                xAxis.valMin = xAxis.valMax - (xAxis.valMax - xAxis.valMin) * zoomFactor;
            }
        } else {
            if (direction === "zoom-in") {
                xAxis.valMin = valXMid - (valXMid - xAxis.valMin) / zoomFactor;
                xAxis.valMax = valXMid + (xAxis.valMax - valXMid) / zoomFactor;
            } else {
                xAxis.valMin = valXMid - (valXMid - xAxis.valMin) * zoomFactor;
                xAxis.valMax = valXMid + (xAxis.valMax - valXMid) * zoomFactor;
            }


        }

        this.updatePlot();

    }

    /**
     * rotate mouse wheel to zoom y-direction, ctrl key must be pressed
     */
    handleWheelOnPlotY = (event: React.WheelEvent) => {

        const yAxis = this.getSelectedYAxis();
        if (yAxis === undefined) {
            return;
        }

        const pointX0 = 0;
        const pointY0 = event.clientY;
        const pointX = pointX0 - yAxisLabelWidth - yAxisTickWidth - this.getStyle().left;
        const pointY = pointY0 - titleHeight - this.getStyle().top;

        const ticksInfo = yAxis["ticksInfo"];
        const xValMin = ticksInfo["xValMin"];
        const xValMax = ticksInfo["xValMax"];
        const yValMin = ticksInfo["yValMin"];
        const yValMax = ticksInfo["yValMax"];

        const [valXMid, valYMid] = GlobalMethods.mapPointToXy(pointX, pointY, xValMin, xValMax, yValMin, yValMax, this.getPlotWidth(), this.getPlotHeight());


        // const valYMid = this.mapPointToXY(this.getSelectedTraceIndex(), [pointX, pointY]);


        const direction = event.deltaY < 0 ? "zoom-in" : "zoom-out";


        if (yAxis === undefined) {
            return;
        }
        const yMin = yAxis.valMin;
        const yMax = yAxis.valMax;
        const yMid = valYMid;

        const dyUpper = yMax - yMid;
        const dyLower = yMid - yMin;
        if (direction === "zoom-in") {
            const yMinNew = yMid - dyLower / this.getText()["axisZoomFactor"];
            const yMaxNew = yMid + dyUpper / this.getText()["axisZoomFactor"];
            yAxis.valMin = yMinNew;
            yAxis.valMax = yMaxNew;
        } else {
            const yMinNew = yMid - dyLower * this.getText()["axisZoomFactor"];
            const yMaxNew = yMid + dyUpper * this.getText()["axisZoomFactor"];
            yAxis.valMin = yMinNew;
            yAxis.valMax = yMaxNew;
        }

        const xAxis = this.xAxis;
        if (this.tracingIsMoving) {
            xAxis.valMax = Date.now();
        }

        this.updatePlot();
    }

    handleMouseMoveOnPlotX = (event: MouseEvent) => {

        this.tracingIsMoving = false;

        const dPointX = event.movementX;

        this.mouseMoveEndX = event.clientX;

        const yAxis = this.getSelectedYAxis();
        // const ii = this.getSelectedTraceIndex();
        if (yAxis === undefined) {
            return;
        }


        const ticksInfo = yAxis["ticksInfo"];
        const xValMin = ticksInfo["xValMin"];
        const xValMax = ticksInfo["xValMax"];
        const yValMin = ticksInfo["yValMin"];
        const yValMax = ticksInfo["yValMax"];

        const valXY0 = GlobalMethods.mapPointToXy(0, 0, xValMin, xValMax, yValMin, yValMax, this.getPlotWidth(), this.getPlotHeight());
        const valXY1 = GlobalMethods.mapPointToXy(dPointX, 0, xValMin, xValMax, yValMin, yValMax, this.getPlotWidth(), this.getPlotHeight());


        // const valXY0 = this.mapPointToXY(ii, [0, 0]);
        // const valXY1 = this.mapPointToXY(ii, [dPointX, 0]);
        const dt = valXY1[0] - valXY0[0];

        const xAxis = this.xAxis;
        if (xAxis === undefined) {
            return;
        }

        xAxis.valMin = xAxis.valMin - dt;
        xAxis.valMax = xAxis.valMax - dt;
        this.updatePlot();
    }

    handleMouseMoveOnPlotY = (event: MouseEvent) => {
        event.preventDefault();
        const pointDy = event.movementY;

        // const ii = this.getSelectedTraceIndex();
        const yAxis = this.getSelectedYAxis();
        if (yAxis === undefined) {
            return;
        }
        const yMin = yAxis.valMin;
        const yMax = yAxis.valMax;


        const ticksInfo = yAxis["ticksInfo"];
        const xValMin = ticksInfo["xValMin"];
        const xValMax = ticksInfo["xValMax"];
        const yValMin = ticksInfo["yValMin"];
        const yValMax = ticksInfo["yValMax"];

        const dxy0 = GlobalMethods.mapPointToXy(0, pointDy, xValMin, xValMax, yValMin, yValMax, this.getPlotWidth(), this.getPlotHeight());
        const dxy1 = GlobalMethods.mapPointToXy(0, 0, xValMin, xValMax, yValMin, yValMax, this.getPlotWidth(), this.getPlotHeight());


        // const dxy0 = this.mapPointToXY(ii, [0, pointDy]);
        // const dxy1 = this.mapPointToXY(ii, [0, 0]);
        const dy = dxy1[1] - dxy0[1];
        const yMinNew = yMin + dy;
        const yMaxNew = yMax + dy;
        yAxis.valMin = yMinNew;
        yAxis.valMax = yMaxNew;


        const xAxis = this.xAxis;
        const dx = xAxis.valMax - xAxis.valMin;
        if (this.tracingIsMoving) {
            xAxis.valMax = Date.now();
            xAxis.valMin = Date.now() - dx;
        }

        this.updatePlot();
    }

    handleMouseUpOnPlot = (event: MouseEvent) => {
        event.preventDefault();

        window.removeEventListener("mousemove", this.handleMouseMoveOnPlotX);
        window.removeEventListener("mousemove", this.handleMouseMoveOnPlotY);
        window.removeEventListener("mouseup", this.handleMouseUpOnPlot);
    }


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

    // getUnprocessedChannelNames = () => {
    //     return this.getMainWidget().getUnprocessedChannelNames();
    // };

    getElement = () => {
        return <this._Element></this._Element>;
    };

    setYAxes = (yAxes: Record<string, any>[]) => {
        // deep copy
        this.yAxes = JSON.parse(JSON.stringify(yAxes));
    };

    setSelectedTraceIndex = (newIndex: number) => {
        this.selectedTraceIndex = newIndex;
    }

    getSelectedTraceIndex = () => {
        return this.selectedTraceIndex;
    }

    getSelectedYAxis = () => {
        return this.yAxes[this.selectedTraceIndex];
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
