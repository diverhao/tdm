import { DataViewer } from "./DataViewer";
import * as React from "react";
import { ElementProfileBlockNameInput } from "../../mainWindow/MainWindowStyledComponents";
import * as GlobalMethods from "../../../common/GlobalMethods";
import { getMouseEventClientX, getMouseEventClientY, GlobalVariables, type_dbrData, type_pva_value } from "../../../common/GlobalVariables";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { type_LocalChannel_data } from "../../../common/GlobalVariables";
import { OrthographicCamera, Scene, WebGLRenderer, Color, Vector2 } from "three";
import { Line2 } from 'three/examples/jsm/lines/Line2';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry';
import { Scale } from "../../helperWidgets/SharedElements/Scale";
import { DataViewerPlotControls } from "./DataViewerPlotControls";
import { DataViewerPlotTraceHelper } from "./DataViewerPlotTraceHelper";
import { DataViewerPlotDataHelper } from "./DataViewerPlotDataHelper";
import { DataViewerPlotMouseHelper } from "./DataViewerPlotMouseHelper";
import { type_DataViewer_yAxis } from "../../../common/types/type_widget_tdl";


type type_xAxis = {
    label: string;
    valMin: number;
    valMax: number;
};


// no more than 50 traces
export enum settingsIndexChoices {
    NONE = -2,
    MAIN = -1,
    TRACE_0 = 0,
    TRACE_1,
    TRACE_2,
    TRACE_3,
    TRACE_4,
    TRACE_5,
    TRACE_6,
    TRACE_7,
    TRACE_8,
    TRACE_9,
    TRACE_10,
    TRACE_11,
    TRACE_12,
    TRACE_13,
    TRACE_14,
    TRACE_15,
    TRACE_16,
    TRACE_17,
    TRACE_18,
    TRACE_19,
    TRACE_20,
    TRACE_21,
    TRACE_22,
    TRACE_23,
    TRACE_24,
    TRACE_25,
    TRACE_26,
    TRACE_27,
    TRACE_28,
    TRACE_29,
    TRACE_30,
    TRACE_31,
    TRACE_32,
    TRACE_33,
    TRACE_34,
    TRACE_35,
    TRACE_36,
    TRACE_37,
    TRACE_38,
    TRACE_39,
    TRACE_40,
    TRACE_41,
    TRACE_42,
    TRACE_43,
    TRACE_44,
    TRACE_45,
    TRACE_46,
    TRACE_47,
    TRACE_48,
    TRACE_49,
}
// colors
export const traceColors: [number, number, number, number][] = [
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


// layout
export const titleHeight = 50;
export const yAxisLabelWidth = 30;
export const yAxisTickWidth = 30;
export const xAxisLabelHeight = 30;
export const xAxisTickHeight = 30;
export const toolbarHeight = 30;
export const legendWidth = 170;


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

    // helper class for toolbar controls
    _controls: DataViewerPlotControls;
    // helper class for trace management
    _plotTraceHelper: DataViewerPlotTraceHelper;
    // helper class for data operations
    _plotDataHelper: DataViewerPlotDataHelper;
    // helper class for mouse event handlers
    _plotMouseHelper: DataViewerPlotMouseHelper;

    minLiveDataTime: number = Number.MAX_VALUE;

    // the traces may be discontinued when the plot is dragged horizontally
    // each time the mouse is up on plot, the event.clientX is recorded
    // then the plot min and max are recalculated based on this number
    // In addition, this widget is always rendered each time
    rightButtonClicked: boolean = false;

    _mainWidget: DataViewer;

    // update cursor values without updating everything
    setCursorValue: React.Dispatch<React.SetStateAction<string>> | ((input: string) => void) = () => { };

    // trace
    // which trace is being selected
    _selectedTraceIndex: number = 0;
    // for settings: which setting is shown, a setting could be main setting or trace setting
    _settingsIndex: settingsIndexChoices = settingsIndexChoices.NONE;
    traceIsMoving: boolean = true;

    // plot
    _plotWidth: number;
    _plotHeight: number;
    lastCursorPointXY: [number, number] = [-100000, -100000];

    // only one x axis, ticks and ticksText are the same for each data set
    xAxis: type_xAxis = {
        label: "Time from now",
        valMin: -10 * 60 * 1000,
        valMax: 0,
    };

    // multiple y axes
    yAxes: type_DataViewer_yAxis[] = [];

    constructor(mainWidget: DataViewer) {
        this._mainWidget = mainWidget;

        this._controls = new DataViewerPlotControls(this);
        this._plotTraceHelper = new DataViewerPlotTraceHelper(this);
        this._plotDataHelper = new DataViewerPlotDataHelper(this);
        this._plotMouseHelper = new DataViewerPlotMouseHelper(this);

        const style = this.getStyle();
        this._plotWidth = style.width - yAxisLabelWidth - yAxisTickWidth - legendWidth;
        this._plotHeight = style.height - titleHeight - xAxisLabelHeight - xAxisTickHeight - toolbarHeight;

        // stop moving with space key down
        window.addEventListener("keydown", (event: KeyboardEvent) => {
            if (event.code === "Space") {
                this.traceIsMoving = !this.traceIsMoving;
                if (this.traceIsMoving) {
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

        // everytime resize the widget, update the sizes
        if (g_widgets1.isEditing()) {
            this.updatePlotWidthHeight();
        }

        if (g_widgets1.getRoot().getDisplayWindowClient().getIsUtilityWindow() && this.getMainWidget().getYAxes().length === 0) {
            this.updatePlotWidthHeight();
        }

        const width = this.getStyle()["width"];
        const height = this.getStyle()["height"];
        const plotWidth = this.getPlotWidth();
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
                <this._controls._ElementControls></this._controls._ElementControls>
            </div>
        );
    };


    _ElementTitle = () => {
        const changeTitle = (event: React.ChangeEvent<HTMLInputElement>) => {
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
                    flexShrink: 0,
                    flexGrow: 0,
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


        if (g_widgets1.isEditing() || yAxis === undefined) {
            return (
                <div
                    style={{
                        display: "inline-flex",
                        justifyContent: "center",
                        alignItems: "center",
                        width: yAxisLabelWidth,
                        height: "100%",
                        color: color,
                    }}
                >
                    Y
                </div>
            );
        }

        const label = yAxis["label"];


        return (
            <div
                style={{
                    display: "inline-flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: yAxisLabelWidth,
                    height: "100%",
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

        const color = this.calcSelectedTraceColor();

        const yAxis = this.getSelectedYAxis();

        if (g_widgets1.isEditing() || yAxis === undefined) {
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
                        min={0}
                        max={10}
                        numIntervals={5}
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
            );
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
    _ElementPlot = () => {
        const plotRef = React.useRef<any>(null);

        if (g_widgets1.isEditing() === true) {
            return <this._ElementPlotDummy></this._ElementPlotDummy>
        }

        if (g_widgets1.getRoot().getDisplayWindowClient().getIsUtilityWindow() && this.getMainWidget().getYAxes().length === 0) {
            return <this._ElementPlotDummy></this._ElementPlotDummy>
        }

        return (
            <div
                id={"DataViewerPlot-" + Math.random().toString()}
                ref={plotRef}
                style={{
                    width: `${this.getPlotWidth()}px`,
                    height: `${this.getPlotHeight()}px`,
                    outline: "1px solid black",
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
                onMouseDown={(event: React.MouseEvent) => {

                    if (event.button === 0) {
                        window.addEventListener("mousemove", this.getPlotMouseHelper().handleMouseMoveOnPlotX);
                    } else if (event.button === 2) {
                        window.addEventListener("mousemove", this.getPlotMouseHelper().handleMouseMoveOnPlotY);
                    }
                    window.addEventListener("mouseup", this.getPlotMouseHelper().handleMouseUpOnPlot);
                }}

                onWheel={(event: React.WheelEvent) => {
                    event.preventDefault()
                    if (event.ctrlKey === true) {
                        this.handleWheelOnPlotY(event);
                    } else {
                        this.handleWheelOnPlotX(event);
                    }
                }}
                onDoubleClick={() => {
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

                        const yAxis = this.yAxes[this.getSelectedTraceIndex()];
                        if (yAxis === undefined) {
                            return;
                        }
                        const yValMinMax = this.findVisibleYValueRange(this.getSelectedTraceIndex());

                        if (yValMinMax !== undefined) {
                            if (yAxis !== undefined) {
                                const Dy = yValMinMax[1] - yValMinMax[0];
                                // Create a new yAxis object with updated valMin and valMax
                                const updatedYAxis = {
                                    ...yAxis,
                                    valMin: yValMinMax[0] - Dy * 0.1,
                                    valMax: yValMinMax[1] + Dy * 0.1,
                                };
                                this.yAxes[this.getSelectedTraceIndex()] = updatedYAxis;
                            }
                        }

                        if (Math.abs(yAxis.valMin - yAxis.valMax) < 1e-20) {
                            let newValMin, newValMax;
                            if (Math.abs(yAxis.valMax) < 1e-20) {
                                newValMin = -1;
                                newValMax = 1;
                            } else if (yAxis.valMax > 0) {
                                newValMin = yAxis.valMin * 0.9;
                                newValMax = yAxis.valMax * 1.1;
                            } else if (yAxis.valMax < 0) {
                                newValMin = yAxis.valMin * 1.1;
                                newValMax = yAxis.valMax * 0.9;
                            }
                            if (newValMin !== undefined && newValMax !== undefined) {
                                const updatedYAxis = {
                                    ...yAxis,
                                    valMin: newValMin,
                                    valMax: newValMax,
                                };
                                this.yAxes[this.getSelectedTraceIndex()] = updatedYAxis;
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

    _ElementPlotDummy = () => {

        const width = this.getPlotWidth();
        const height = this.getPlotHeight();

        const xTickValues = GlobalMethods.calcTicks(-10, 0, 10 + 1, { scale: "Linear" });
        const xTickPositions = GlobalMethods.calcTickPositions(xTickValues, -10, 0, width, { scale: "Linear" }, "horizontal");
        const yTickValues = GlobalMethods.calcTicks(0, 10, 5 + 1, { scale: "Linear" });
        const yTickPositions = GlobalMethods.calcTickPositions(yTickValues, 0, 10, height, { scale: "Linear" }, "vertical");

        return (
            <div
                style={{
                    width: width,
                    height: height,
                    outline: "1px solid black",
                }}
            >
                <svg
                    width={`${width}`}
                    height={`${height}`}
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

            </div>
        )

    }

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
            xTickValMin,
            xTickValMax,
            xTickValues,
            xTickPositions,
            yTickValues,
            yTickPositions,
            xTickUnit } = yAxis["ticksInfo"];
        const height = this.getPlotHeight();
        const width = this.getPlotWidth();

        return (
            <svg
                width={`${width}`}
                height={`${height}`}
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

            this.yAxes.forEach((yAxis: type_DataViewer_yAxis, index: number) => {

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
        const yAxis = this.getSelectedYAxis();

        if (g_widgets1.isEditing() || yAxis === undefined) {
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
                        min={-10}
                        max={0}
                        numIntervals={10}
                        position={"bottom"}
                        show={true}
                        length={this.getPlotWidth()}
                        scale={"Linear"}
                        color={"rgba(0,0,0,1)"}
                        compact={false}
                        showTicks={false}
                        showLabels={true}
                        showAxis={false}
                    >
                    </Scale>
                </div>
            );
        }

        const { xValMin,
            xValMax,
            yValMin,
            yValMax,
            xLength,
            yLength,
            numXgrid,
            numYgrid,
            xTickValMin,
            xTickValMax,
            xTickValues,
            xTickPositions,
            yTickValues,
            yTickPositions,
            xTickUnit } = yAxis["ticksInfo"];

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
                    min={xTickValMin}
                    max={xTickValMax}
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
        const yAxis = this.getSelectedYAxis();
        if (g_widgets1.isEditing() || yAxis === undefined) {
            return (
                <div
                    style={{
                        position: "relative",
                        height: xAxisTickHeight,
                        width: this.getPlotWidth(),
                        display: "inline-flex",
                        justifyContent: "center",
                        flexGrow: 0,
                        flexShrink: 0,
                    }}
                >
                    Time since now (minute)
                </div>
            );
        }


        const { xValMin,
            xValMax,
            yValMin,
            yValMax,
            xLength,
            yLength,
            numXgrid,
            numYgrid,
            xTickValMin,
            xTickValMax,
            xTickValues,
            xTickPositions,
            yTickValues,
            yTickPositions,
            xTickUnit } = yAxis["ticksInfo"];

        return (
            <div
                style={{
                    width: `${this.getPlotWidth()}px`,
                    height: "100%",
                    display: "inline-flex",
                    flexFlow: "row",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                {this.xAxis.label}&nbsp;{"(" + xTickUnit + ")"}
            </div>
        );
    };


    _ElementLegend = () => {

        if (g_widgets1.isEditing()) {
            return (
                <div
                    style={{
                        width: legendWidth,
                        // height: "100%",
                        height: this.getPlotHeight(),
                        display: "inline-flex",
                        flexFlow: "column",
                        justifyContent: "flex-start",
                        alignItems: "flex-start",
                        overflowY: "auto",
                        overflowX: "hidden",
                    }}
                >
                </div>
            )
        }

        const elementAddTraceRef = React.useRef<any>(null);

        return (
            <div
                style={{
                    width: legendWidth,
                    // height: "100%",
                    height: this.getPlotHeight(),
                    display: "inline-flex",
                    flexFlow: "column",
                    justifyContent: "flex-start",
                    alignItems: "flex-start",
                    overflowY: "auto",
                    overflowX: "hidden",
                }}
            >
                {this.yAxes.map((yAxis: type_DataViewer_yAxis, index: number) => {
                    const xData = yAxis["xData"];
                    const yData = yAxis["yData"];
                    let timeStr = "0000-00-00 00:00:00.000";
                    let valueStr = "0";
                    if (xData.length > 1) {
                        // the last element is a patch
                        timeStr = GlobalMethods.convertEpochTimeToString(xData[xData.length - 2]);
                        valueStr = yData[yData.length - 1].toString();
                    }
                    const backgroundColor = this.getSelectedTraceIndex() === index ? "rgba(210, 210, 210, 1)" : "rgba(0,0,0,0)";
                    const color = yAxis.show ? yAxis.lineColor : "rgba(0,0,0,0.5)";
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
                                color: color,
                                margin: "3px",
                                backgroundColor: backgroundColor,
                            }}
                            onMouseEnter={() => {
                                this.setCursorValue("Click to selected the trace, double-click to configure the trace.")
                            }}
                            onMouseLeave={() => {
                                this.setCursorValue("")
                            }}
                            onMouseDown={(event: React.MouseEvent) => {
                                if (event.button !== 0) {
                                    return;
                                }

                                this.setSelectedTraceIndex(index);
                                this.updatePlot();
                            }}

                            onDoubleClick={(event: React.MouseEvent) => {
                                if (event.button !== 0) {
                                    return;
                                }

                                this.getMainWidget().setSettingsIndex(index);
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
                        height: "fit-content",
                        paddingTop: 5,
                        paddingBottom: 5,
                        paddingLeft: 5,
                        boxSizing: "border-box",
                        margin: "3px",
                        opacity: 0.3,
                    }}
                    onMouseDown={(event: React.MouseEvent) => {
                        if (event.button !== 0) {
                            return;
                        }
                        this.addTrace("");
                        const newIndex = this.getChannelNames().length - 1;
                        this.setSelectedTraceIndex(newIndex);
                        this.getMainWidget().setSettingsIndex(newIndex);
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
                            elementAddTraceRef.current.style["opacity"] = 0.3;
                        }
                        this.setCursorValue("")
                    }}
                >
                    <div style={{ fontSize: GlobalVariables.defaultFontSize * 1.5 }}>+</div>
                </div>


            </div >
        );
    };


    // ------------------------ trace (delegated to _plotTrace) ----------------------------

    addTrace = async (newChannelName: string, doFlush: boolean = true) => {
        return this.getPlotTraceHelper().addTrace(newChannelName, doFlush);
    };

    renameTrace = async (index: number, newTraceName: string, doFlush: boolean = true, forceUpdate: boolean = false) => {
        return this.getPlotTraceHelper().renameTrace(index, newTraceName, doFlush, forceUpdate);
    };

    removeTrace = (index: number) => {
        this.getPlotTraceHelper().removeTrace(index);
    };

    getNewColor = (): [number, number, number, number] => {
        return this.getPlotTraceHelper().getNewColor();
    };

    updateTraceShowOrHide = (index: number, showTrace: boolean) => {
        this.getPlotTraceHelper().updateTraceShowOrHide(index, showTrace);
    };

    updateTraceLineWidth = (index: number, newWidth: number) => {
        this.getPlotTraceHelper().updateTraceLineWidth(index, newWidth);
    };

    updateTraceBufferSize = (index: number, newSize: number) => {
        this.getPlotTraceHelper().updateTraceBufferSize(index, newSize);
    };

    updateTraceScale = (index: number, newScale: "Linear" | "Log10") => {
        this.getPlotTraceHelper().updateTraceScale(index, newScale);
    };

    // ---------------------- data (delegated to _plotData) -------------------------------

    fetchArchiveData = () => {
        this.getPlotDataHelper().fetchArchiveData();
    };

    mapDbrDataWitNewArchiveData = (data: {
        displayWindowId: string;
        widgetKey: string;
        channelName: string;
        startTime: number;
        endTime: number;
        archiveData: [number[], number[]];
    }) => {
        this.getPlotDataHelper().mapDbrDataWitNewArchiveData(data);
    };

    mapDbrDataWitNewData = (dbrDataList: Record<string, type_pva_value | type_pva_value[] | type_dbrData | type_dbrData[] | type_LocalChannel_data | undefined>) => {
        this.getPlotDataHelper().mapDbrDataWitNewData(dbrDataList);
    };

    addOneDbrData = (data: type_dbrData | type_LocalChannel_data | undefined, yAxis: type_DataViewer_yAxis) => {
        this.getPlotDataHelper().addOneDbrData(data, yAxis);
    };

    exportData = () => {
        this.getPlotDataHelper().exportData();
    };

    prepareExportData = () => {
        return this.getPlotDataHelper().prepareExportData();
    };

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
     * @param {event: MouseEvent | [number, number]} Input could be an mouse event, or a [number, number] array
                        */
    updateCursorElement = (event: MouseEvent | [number, number]) => {

        const yAxis = this.getSelectedYAxis();
        if (yAxis === undefined) {
            return;
        }


        let pointX0 = -100000;
        let pointY0 = -100000;

        if (event instanceof MouseEvent) {
            // event callback
            this.lastCursorPointXY = [getMouseEventClientX(event), getMouseEventClientY(event)];
            pointX0 = getMouseEventClientX(event);
            pointY0 = getMouseEventClientY(event);
        } else if (typeof event[0] === "number" && typeof event[1] === "number") {
            // current cursor position on web page
            pointX0 = event[0];
            pointY0 = event[1];
        } else {
            return;
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

        // unit of ms
        const xRange = xValMax - xValMin;
        const { xTickValMin, xTickUnit } = this.calcXValMinTick(xRange);
        const xTickValMax = 0;

        const xTickValues = GlobalMethods.calcTicks(xTickValMin, xTickValMax, numXgrid + 1, { scale: scale });
        const xTickPositions = GlobalMethods.calcTickPositions(xTickValues, xTickValMin, xTickValMax, xLength, { scale: scale }, "horizontal");
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
            xTickValMin,
            xTickValMax,
            xTickValues,
            xTickPositions,
            yTickValues,
            yTickPositions,
            xTickUnit,
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
     * Convert a time range in milliseconds to a human-readable (negative) value and unit string.
     *
     * xValMaxTicks is always 0, xValMinTicks is the negative range in the chosen unit.
     *
     * Examples:
     *   90,000 ms (1.5 min)   → {xValMinTicks: -90,  xValMaxTicks: 0, xTimeUnit: "second" }
                        *   7,200,000 ms (2 hr)   → {xValMinTicks: -120,  xValMaxTicks: 0, xTimeUnit: "minute" }
                        *   172,800,000 ms (2 d)  → {xValMinTicks: -48,  xValMaxTicks: 0, xTimeUnit: "hour" }
                        *   ~730 d (2 yr)         → {xValMinTicks: -24,  xValMaxTicks: 0, xTimeUnit: "month" }
                        */
    calcXValMinTick = (xRangeMs: number): { xTickValMin: number; xTickUnit: string } => {
        const absRange = Math.abs(xRangeMs);
        const oneSecond = 1000;
        const oneMinute = 60 * oneSecond;
        const oneHour = 60 * oneMinute;
        const oneDay = 24 * oneHour;
        const oneMonth = 30 * oneDay;

        let divisor: number;
        let unit: string;

        if (absRange < 6 * oneMinute) {
            divisor = oneSecond;
            unit = "second";
        } else if (absRange < 2 * oneHour) {
            divisor = oneMinute;
            unit = "minute";
        } else if (absRange < 2 * oneDay) {
            divisor = oneHour;
            unit = "hour";
        } else if (absRange < 6 * oneMonth) {
            divisor = oneDay;
            unit = "day";
        } else {
            divisor = oneMonth;
            unit = "month";
        }

        const xTickValMin = -(absRange / divisor);

        return { xTickValMin, xTickUnit: unit };
    };


    /**
     * get the currently selected trace's color
     */
    calcSelectedTraceColor = () => {
        const selectedYAxis = this.getSelectedYAxis();
        return selectedYAxis === undefined ? "rgba(0, 0, 0, 1)" : selectedYAxis.lineColor;
    }



    // ------------------ mouse event handlers (delegated to _mouse) ----------------------

    handleWheelOnPlotX = (event: React.WheelEvent) => {
        this.getPlotMouseHelper().handleWheelOnPlotX(event);
    };

    handleWheelOnPlotY = (event: React.WheelEvent) => {
        this.getPlotMouseHelper().handleWheelOnPlotY(event);
    };

    handleMouseMoveOnPlotX = (event: MouseEvent) => {
        this.getPlotMouseHelper().handleMouseMoveOnPlotX(event);
    };

    handleMouseMoveOnPlotY = (event: MouseEvent) => {
        this.getPlotMouseHelper().handleMouseMoveOnPlotY(event);
    };

    handleMouseUpOnPlot = (event: MouseEvent) => {
        this.getPlotMouseHelper().handleMouseUpOnPlot(event);
    };


    // ---------------------- getters and setters -------------------------------
    getMainWidget = () => {
        return this._mainWidget;
    };

    getPlotTraceHelper = () => {
        return this._plotTraceHelper;
    };

    getPlotDataHelper = () => {
        return this._plotDataHelper;
    };

    getPlotMouseHelper = () => {
        return this._plotMouseHelper;
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

    setYAxes = (yAxes: type_DataViewer_yAxis[]) => {
        // deep copy
        this.yAxes = structuredClone(yAxes);
    };

    setSelectedTraceIndex = (newIndex: number) => {
        this._selectedTraceIndex = newIndex;
    }

    getSelectedTraceIndex = () => {
        return this._selectedTraceIndex;
    }

    getSelectedYAxis = () => {
        return this.yAxes[this.getSelectedTraceIndex()];
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


    setSettingsIndex = (newIndex: settingsIndexChoices) => {
        this._settingsIndex = newIndex;
    }

    getSettingsIndex = () => {
        return this._settingsIndex;
    }
}
