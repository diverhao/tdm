import { DataViewer } from "./DataViewer";
import * as React from "react";
import { ElementProfileBlockNameInput } from "../../mainWindow/MainWindowStyledComponents";
import * as GlobalMethods from "../../global/GlobalMethods";
import { getMouseEventClientX, getMouseEventClientY, GlobalVariables, g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { Log } from "../../../mainProcess/log/Log";

type type_yAxis = {
    label: string;
    valMin: number;
    valMax: number;
    lineWidth: number;
    lineColor: string;
    // ticks and ticksText are not used in the plot, we simply divide the valMin and valMax to 5 intervals
    ticks: number[];
    ticksText: (number | string)[];
    show: boolean;
    bufferSize: number;
    displayScale: "Linear" | "Log10";
};

export class DataViewerPlot {
    // ----------------- constants ------------------

    // colors
    readonly traceColors: [number, number, number, number][] = [
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
    readonly oneSecond = 1 * 1000;
    readonly oneMinute = 60 * 1000;
    readonly oneHour = 60 * 60 * 1000;
    readonly oneDay = 24 * 60 * 60 * 1000;
    readonly deltaTs: [number, number, string][] = [
        [this.oneSecond, -1, "second"],
        [2 * this.oneSecond, -2, "second"],
        [5 * this.oneSecond, -5, "second"],
        [10 * this.oneSecond, -10, "second"],
        [30 * this.oneSecond, -30, "second"],
        [this.oneMinute, -1, "minute"],
        [2 * this.oneMinute, -2, "minute"],
        [5 * this.oneMinute, -5, "minute"],
        [10 * this.oneMinute, -10, "minute"],
        [30 * this.oneMinute, -30, "minute"],
        [this.oneHour, -1, "hour"],
        [2 * this.oneHour, -2, "hour"],
        [5 * this.oneHour, -5, "hour"],
        [10 * this.oneHour, -10, "hour"],
        [this.oneDay, -1, "day"],
        [2 * this.oneDay, -2, "day"],
        [5 * this.oneDay, -5, "day"],
        [10 * this.oneDay, -10, "day"],
        [30 * this.oneDay, -30, "day"],
    ];

    // layout
    readonly titleHeight = 50;
    readonly yAxisLabelWidth = 30;
    readonly yAxisTickWidth = 30;
    readonly xAxisLabelHeight = 30;
    readonly thumbnailHeight = 30;
    readonly xAxisTickHeight = 30;
    readonly toolbarHeight = 30;
    readonly legendWidth = 170;

    // ---------------------- efficiency ---------------------------
    thumbnailUpdateCount = 1;
    updateThumbnail: boolean = true;

    plotUpdateCount = 1;
    updatePlotLines: boolean = true;

    pointsXYOnPlots: [number, number][][] = [];
    valsXYOnPlots: [number, number][][] = [];

    pointsXYOnThumbnail: [number, number][][] = [];
    valsXYOnThumbnail: [number, number][][] = [];

    // the traces may be discontinued when the plot is dragged horizontally
    // each time the mouse is up on plot, the event.clientX is recorded
    // then the plot min and max are recalculated based on this number
    // In addition, this widget is always rendered each time
    mouseMoveEndX: number = 0;

    // ---------------------- variables ----------------------------

    _mainWidget: DataViewer;

    // update cursor values without updating everything
    setCursorValue: any;

    // trace
    selectedTraceIndex: number = 1;
    tracingIsMoving: boolean = true;
    tracesInitialized: boolean = false;

    wasEditing: boolean = true;

    // plot
    plotWidth: number;
    plotHeight: number;
    lastCursorPointXY: [number, number] = [-100000, -100000];

    // data
    x: number[][] = [];
    y: number[][] = [];

    // only one x axis
    xAxis: { label: string; valMin: number; valMax: number; ticks: number[]; ticksText: string[] } = {
        label: "x label",
        // time since epoch, ms
        valMin: -10 * 60 * 1000,
        valMax: 0,
        ticks: [],
        ticksText: [],
    };

    // multiple y axes
    yAxes: type_yAxis[] = [];

    constructor(mainWidget: DataViewer) {
        this._mainWidget = mainWidget;
        this.plotWidth = this.getStyle().width - this.yAxisLabelWidth - this.yAxisTickWidth - this.legendWidth;
        this.plotHeight = this.getStyle().height - this.titleHeight - this.xAxisLabelHeight - this.xAxisTickHeight - this.toolbarHeight - this.thumbnailHeight;
    }

    // --------------------------- plot calculation ---------------------------

    findVisibleYValueRange = (index: number): [number, number] | undefined => {
        const xData0 = this.x[index];
        const yData0 = this.y[index];

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

    mapXYsToPoints = (index: number): string => {
        const xData0 = this.x[index];
        const yData0 = this.y[index];

        if (yData0 === undefined) {
            return "";
        }

        if (xData0[xData0.length - 1] < this.xAxis.valMin) {
            return "";
        }
        if (xData0[0] > this.xAxis.valMax) {
            return "";
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
            return "";
        }

        let xData = xData0;
        let yData = yData0;

        // only calculate the data in visible region
        if (this.getMainWidget().getReCalcPlot() === true) {
            xData = xData0.slice(xMinIndex, xMaxIndex);
            yData = yData0.slice(xMinIndex, xMaxIndex);
        }

        const newValsXY: [number, number][] = [];

        let valsXYOnPlot: [number, number][] = this.valsXYOnPlots[index];
        if (valsXYOnPlot === undefined) {
            valsXYOnPlot = [];
            this.valsXYOnPlots[index] = valsXYOnPlot;
        }

        let pointsXYOnPlot: [number, number][] = this.pointsXYOnPlots[index];
        if (pointsXYOnPlot === undefined) {
            pointsXYOnPlot = [];
            this.pointsXYOnPlots[index] = pointsXYOnPlot;
        }

        // if re-calcualte, return here
        if (this.getMainWidget().getReCalcPlot() === true) {
            // empty pointsXYOnPlot
            pointsXYOnPlot.length = 0;
            valsXYOnPlot.length = 0;
            for (let ii = 0; ii < xData.length; ii++) {
                if (xData[ii] !== undefined && yData[ii] !== undefined) {
                    const pointXY = this.mapXYToPoint(index, [xData[ii], yData[ii]]);
                    pointsXYOnPlot.push(pointXY);
                    valsXYOnPlot.push([xData[ii], yData[ii]]);
                }
            }
            return `${pointsXYOnPlot}`
        }

        const lastValXYOnOldPlot = valsXYOnPlot.pop();
        pointsXYOnPlot.pop();
        // append new data to vals and points

        for (let ii = xData.length - 1; ii >= 0; ii--) {
            const valX = xData[ii];
            const valY = yData[ii];
            if (valsXYOnPlot[valsXYOnPlot.length - 1] !== undefined) {
                if (valX === valsXYOnPlot[valsXYOnPlot.length - 1][0]) {
                    break;
                }
            }
            if (valY !== undefined && valX !== undefined) {
                newValsXY.splice(0, 0, [valX, valY])
            }
        }
        // prepend archive data
        const newValsXYPrepend: [number, number][] = [];
        for (let ii = 0; ii < xData.length; ii++) {
            const valX = xData[ii];
            const valY = yData[ii];
            if (valsXYOnPlot[0] !== undefined) {
                if (valX >= valsXYOnPlot[0][0]) {
                    break;
                }
            }
            if (valY !== undefined && valX !== undefined) {
                newValsXYPrepend.push([valX, valY]);
            }
        }


        // offset the points X
        let pointXDiff = 0;
        if (lastValXYOnOldPlot !== undefined && newValsXY.length >= 1 && newValsXY[newValsXY.length - 1][0] !== undefined) {
            const lastValXYOnNewPlot = newValsXY[newValsXY.length - 1];
            const pointXYDiffA = this.mapXYToPoint(index, [lastValXYOnNewPlot[0] - lastValXYOnOldPlot[0], 0]);
            const pointXYDiffB = this.mapXYToPoint(index, [0, 0]);
            pointXDiff = pointXYDiffA[0] - pointXYDiffB[0];
        }

        // move old data backward only when the trace is moving
        if (this.tracingIsMoving === true) {
            for (let ii = 0; ii < pointsXYOnPlot.length; ii++) {
                pointsXYOnPlot[ii][0] = pointsXYOnPlot[ii][0] - pointXDiff;
            }
        }

        // push new values and points 
        valsXYOnPlot.push(...newValsXY);
        for (let ii = 0; ii < newValsXY.length; ii++) {
            const newPoint = this.mapXYToPoint(index, newValsXY[ii]);
            pointsXYOnPlot.push(newPoint);
        }
        // prepend archive data
        for (let ii = newValsXYPrepend.length - 1; ii >= 0; ii--) {
            const newPoint = this.mapXYToPoint(index, newValsXYPrepend[ii]);
            pointsXYOnPlot.splice(0, 0, newPoint);
        }
        // it costs a lot CPU time! 
        // Converting 15,000 points costs about 11 ms. All other operations in this function cost about 3 ms.
        // However, it seems there is no better way of doing this
        // The rendering of SVG is slow, but it only costs GPU time.
        return `${pointsXYOnPlot}`;
    };


    mapXYToPoint = (index: number, [valX, valY]: [number, number]): [number, number] => {
        let useLog10Scale = false;
        if (this.yAxes[index] !== undefined) {
            useLog10Scale = this.yAxes[index]["displayScale"] === "Log10" ? true : false;
        }

        const valXmin = this.xAxis.valMin;
        const valXmax = this.xAxis.valMax;
        let valYmin = Math.min(...this.generateFallbackYTicks());
        let valYmax = Math.max(...this.generateFallbackYTicks());
        if (useLog10Scale) {
            valYmin = Math.log10(valYmin);
            valYmax = Math.log10(valYmax);
        }
        if (this.yAxes[index] !== undefined) {
            valYmin = this.yAxes[index].valMin;
            valYmax = this.yAxes[index].valMax;
            if (useLog10Scale) {
                valYmin = Math.log10(valYmin);
                valYmax = Math.log10(valYmax);
            }
        }
        if (useLog10Scale) {
            valY = Math.log10(valY);
        }
        if (useLog10Scale) {
            if (valY === Infinity || valY === -Infinity || isNaN(valY)) {
                valY = 0
            }
            if (valYmin === Infinity || valYmin === -Infinity || isNaN(valYmin)) {
                valYmin = 0
            }
            if (valYmax === Infinity || valYmax === -Infinity || isNaN(valYmax)) {
                valYmax = 0
            }
        }

        const pointXmin = 0;
        const pointXmax = this.plotWidth;
        const pointYmin = 0;
        let pointYmax = this.plotHeight;
        const pointX = pointXmin + ((pointXmax - pointXmin) / (valXmax - valXmin)) * (valX - valXmin);
        let pointY = pointYmax - ((pointYmax - pointYmin) / (valYmax - valYmin)) * (valY - valYmin);
        return [pointX, pointY];
    };

    // pointX, pointY are the coordinates inside Plot element
    mapPointToXY = (index: number, [pointX, pointY]: [number, number]): [number, number] => {
        if (index >= this.getMainWidget().getChannelNames().length) {
            return [0, 0];
        }
        let useLog10Scale = false;
        if (this.yAxes[index] !== undefined) {
            useLog10Scale = this.yAxes[index]["displayScale"] === "Log10" ? true : false;
        }

        const valXmin = this.xAxis.valMin;
        const valXmax = this.xAxis.valMax;
        let valYmin = this.yAxes[index].valMin;
        let valYmax = this.yAxes[index].valMax;
        if (useLog10Scale) {
            valYmin = Math.log10(valYmin);
            valYmax = Math.log10(valYmax);
        }
        if (useLog10Scale) {
            if (valYmin === Infinity || valYmin === -Infinity || isNaN(valYmin)) {
                valYmin = 0
            }
            if (valYmax === Infinity || valYmax === -Infinity || isNaN(valYmax)) {
                valYmax = 0
            }
        }

        const pointXmin = 0;
        const pointXmax = this.plotWidth;
        const pointYmin = 0;
        const pointYmax = this.plotHeight;

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

    getCursorValue = (event: any) => {

        let pointX0 = -100000;
        let pointY0 = -100000;
        if (event.clientX !== undefined) {
            // this.lastCursorPointXY = [event.clientX, event.clientY];
            // pointX0 = event.clientX;
            // pointY0 = event.clientY;
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

        const pointX = pointX0 - this.yAxisLabelWidth - this.yAxisTickWidth - this.getStyle().left;
        const pointY = pointY0 - this.titleHeight - this.getStyle().top;
        if (this.setCursorValue !== undefined) {
            const [valX, valY] = this.mapPointToXY(this.selectedTraceIndex, [pointX, pointY]);
            const timeStr = GlobalMethods.convertEpochTimeToString(valX);
            const valYStr = valY.toPrecision(4).toString();
            this.setCursorValue(`(${timeStr}, ${valYStr})`);
        }
    };

    calcYTicksAndLabel = (index: number) => {
        const yAxis = this.yAxes[index];
        if (yAxis === undefined) {
            return;
        }
        const channelName = this.getMainWidget().getChannelNames()[index];

        try {
            const tcaChannel = g_widgets1.getTcaChannel(channelName);
            // if (tcaChannel.getTimeStamp() === undefined || tcaChannel.getValue() === undefined) {
            if (tcaChannel.getTimeStamp() === undefined || g_widgets1.getChannelValue(channelName, true) === undefined) {
                return;
            }
            //todo: test above code, and remove below code
            // const tcaChannel = g_widgets1.getTcaChannel(channelName);
            // if (tcaChannel === undefined) {
            // 	return;
            // }
            // if (tcaChannel.getDbrData().secondsSinceEpoch === undefined || tcaChannel.getDbrData().value === undefined) {
            // 	return;
            // }

            if (yAxis.valMax === 10 && yAxis.valMin === 0) {
                const lower_display_limit = tcaChannel.getDbrData().lower_display_limit;
                const upper_display_limit = tcaChannel.getDbrData().upper_display_limit;
                if (lower_display_limit !== undefined && upper_display_limit !== undefined) {
                    yAxis.valMin = lower_display_limit;
                    yAxis.valMax = upper_display_limit;
                }
            }

            yAxis.label = `${channelName} [${g_widgets1.getChannelUnit(channelName).trim()}]`;

            const yAxisInterval0 = (yAxis.valMax - yAxis.valMin) / 5;
            const yAxisInterval = parseFloat(yAxisInterval0.toExponential(0));
            yAxis.ticks.length = 0;
            yAxis.ticksText.length = 0;
            for (let val = Math.ceil(yAxis.valMin / yAxisInterval); val < Math.ceil(yAxis.valMax / yAxisInterval); val = val + 1) {
                yAxis.ticks.push(val * yAxisInterval);
                yAxis.ticksText.push(val * yAxisInterval);
            }
        } catch (e) {
            Log.error(e);
            return;
        }
    };

    calcXTicksAndLabel = (useNewestTime: boolean) => {
        // update this.xAxis.valMax if trace is moving and the trace is updated by interval
        // this is the **only place** modifying this.xAxis.valMax and this.xAxis.valMin
        // if trace is not moving (paused), do not use current time on the plot
        // if the update is not triggered by interval (triggered by mouse click, ...), do not use current time on the plot
        // if (this.tracingIsMoving && this.updatingByInterval) {
        if (this.tracingIsMoving && useNewestTime) {
            const dt = this.xAxis.valMax - this.xAxis.valMin;
            this.xAxis.valMax = Date.now();
            this.xAxis.valMin = this.xAxis.valMax - dt;
        }

        // -------------- ticks -----------------
        this.xAxis.ticks.length = 0;
        this.xAxis.ticksText.length = 0;

        // preferred xTick width
        let deltaT0 = (this.xAxis.valMax - this.xAxis.valMin) / 5;
        // obtain the closest interval
        let index = 0;
        for (let jj = this.deltaTs.length - 1; jj >= 0; jj--) {
            if (deltaT0 / this.deltaTs[jj][0] >= 1) {
                index = jj;
                break;
            }
        }
        const deltaT = this.deltaTs[index][0];
        const deltaTnum = this.deltaTs[index][1];

        let jj = 0;
        while (true) {
            if (this.xAxis.valMax - jj * deltaT < this.xAxis.valMin) {
                break;
            }
            this.xAxis.ticks.push(this.xAxis.valMax - jj * deltaT);
            this.xAxis.ticksText.push(`${deltaTnum * jj}`);
            jj++;
        }

        // label
        this.xAxis.label = `Time [${this.deltaTs[index][2]}] since ${GlobalMethods.convertEpochTimeToString(this.xAxis.valMax)}`;
    };

    // --------------------------- element ------------------------------------

    _Element = () => {
        this.plotWidth = this.getStyle().width - this.yAxisLabelWidth - this.yAxisTickWidth - this.legendWidth;
        this.plotHeight = this.getStyle().height - this.titleHeight - this.xAxisLabelHeight - this.xAxisTickHeight - this.toolbarHeight - this.thumbnailHeight;

        React.useEffect(() => {
            return (() => {
                this.getMainWidget().setReCalcPlot(true);
            })
        })

        return (
            <div
                style={{
                    position: "absolute",
                    // top: `${this.wrapperY}px`,
                    // left: `${this.wrapperX}px`,
                    // width: `${this.wrapperWidth}px`,
                    // height: `${this.wrapperHeight}px`,
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
                <this._ElementTitle></this._ElementTitle>
                <div
                    style={{
                        height: `${this.getStyle().height - this.titleHeight - this.toolbarHeight}px`,
                        width: `100%`,
                        display: "inline-flex",
                        flexFlow: "row",
                        justifyContent: "flex-start",
                        alignItems: "flex-start",
                    }}
                >
                    <div
                        style={{
                            width: `${this.getStyle().width - this.legendWidth}px`,
                            height: `100%`,
                            display: "inline-flex",
                            flexFlow: "column",
                            justifyContent: "flex-start",
                            alignItems: "center",
                        }}
                    >
                        <div
                            style={{
                                width: `100%`,
                                height: `${this.plotHeight}px`,
                                display: "inline-flex",
                                flexFlow: "row",
                                justifyContent: "flex-start",
                                alignItems: "center",
                                backgroundColor: "rgba(0, 255, 128, 0)",
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
                                width: `100%`,
                                height: `${this.xAxisTickHeight}px`,
                                display: "inline-flex",
                                flexFlow: "row",
                                justifyContent: "flex-start",
                                alignItems: "center",
                            }}
                        >
                            {/* blank area */}
                            <this._ElementBlankArea></this._ElementBlankArea>
                            {/* x axis ticks */}
                            <this._ElementXTicks></this._ElementXTicks>
                        </div>

                        <div
                            style={{
                                width: `100%`,
                                height: `${this.xAxisLabelHeight}px`,
                                display: "inline-flex",
                                flexFlow: "row",
                                justifyContent: "flex-start",
                                alignItems: "center",
                            }}
                        >
                            {/* blank area */}
                            <this._ElementBlankArea></this._ElementBlankArea>
                            {/* x aixs label */}
                            <this._ElementXLabel></this._ElementXLabel>
                        </div>
                        <div
                            style={{
                                width: `100%`,
                                height: `${this.thumbnailHeight}px`,
                                display: "inline-flex",
                                flexFlow: "row",
                                justifyContent: "flex-start",
                                alignItems: "center",
                                backgroundColor: "rgba(255,128,0,0)",
                            }}
                        >
                            {/* blank area */}
                            <this._ElementBlankArea></this._ElementBlankArea>
                            {/* thumbnail area */}
                            <this._ElementThumbnail></this._ElementThumbnail>
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

    // _Element = React.memo(this._ElementRaw, () => {
    //     if (this.updatePlotLines) {
    //         return false;
    //     } else {
    //         return true;
    //     }
    // });



    // ---------------------------------- thumbnail ------------------------------

    _ElementThumbnailRaw = () => {
        const thumbnailRef = React.useRef<any>(null);
        // did mount
        React.useEffect(() => {
            if (thumbnailRef.current !== null) {
                thumbnailRef.current.addEventListener("wheel", this.handleWheelOnThumbnail, { passive: false })
            }
        }, [])
        // did unmount
        React.useEffect(() => {
            return () => {
                if (thumbnailRef.current !== null) {
                    thumbnailRef.current.removeEventListener("wheel", this.handleWheelOnThumbnail, { passive: false })
                }
            }
        }, [])

        return (
            <div
                ref={thumbnailRef}
                style={{
                    width: `${this.plotWidth}px`,
                    height: "100%",
                    display: "inline-flex",
                    flexFlow: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    position: "relative",
                    backgroundColor: "rgba(255, 255, 0, 0)",
                    border: "solid 1px rgba(0,0,0,1)"
                }}
                // zoom view box
                // onWheel={this.handleWheelOnThumbnail}
                // move view box left and right, trigger the event on thumbnail, not the view box
                onMouseDown={(event: any) => {
                    if (event.button !== 0) {
                        return;
                    }
                    event.preventDefault();
                    event.stopPropagation()
                    window.addEventListener("mousemove", this.handleMouseMoveOnThumnailViewBox);
                    window.addEventListener("mouseup", this.handleMouseUpOnThumnailViewBox);
                }}

            >
                {/* data */}
                {this.x.map((xData: number[], index: number) => {
                    return <this._ElementThumbnailLine index={index}></this._ElementThumbnailLine>;
                })}
                <this._ElementThumbnailViewBoxLeft></this._ElementThumbnailViewBoxLeft>
                <this._ElementThumbnailViewBoxRight></this._ElementThumbnailViewBoxRight>
                <this._ElementThumbnailViewBox></this._ElementThumbnailViewBox>
            </div>)
    }

    _ElementThumbnail = React.memo(this._ElementThumbnailRaw, () => {
        if (this.updateThumbnail) {
            return false;
        } else {
            return true;
        }
    });

    handleWheelOnThumbnail = (event: React.WheelEvent<HTMLDivElement>) => {
        event.stopPropagation()
        event.preventDefault();

        const direction = event.deltaY < 0 ? "zoom-in" : "zoom-out";


        let valXminInThumbnail = this.xAxis.valMin;
        let valXmaxInThumbnail = this.xAxis.valMax;
        for (let xData0 of this.x) {
            if (xData0.length > 1) {
                valXminInThumbnail = Math.min(valXminInThumbnail, xData0[0]);
                valXmaxInThumbnail = Math.max(valXmaxInThumbnail, xData0[xData0.length - 1]);
            }
        }

        let pointXmin = this.calcThumbnailViewBoxX(this.xAxis.valMin);

        if (direction === "zoom-out") {
            pointXmin = this.calcThumbnailViewBoxX(this.xAxis.valMin - (this.xAxis.valMax - this.xAxis.valMin) / 10);
        } else {
            pointXmin = this.calcThumbnailViewBoxX(this.xAxis.valMin + (this.xAxis.valMax - this.xAxis.valMin) / 10);
        }

        let pointXmax = this.calcThumbnailViewBoxX(this.xAxis.valMax);
        // minimum width, this is only for manual resize on thumbnail, the regular update or manual magnifying is not limited
        if (pointXmax - pointXmin < 10) {
            pointXmin = pointXmax - 10;
        }

        let valMinTmp = Math.max(this.mapPointToXYThumbnail(pointXmin), valXminInThumbnail);

        this.xAxis.valMin = valMinTmp;
        this.updatePlot()
    }

    _ElementThumbnailViewBoxRight = () => {
        return (
            <div style={{
                position: "absolute",
                right: -1,
                top: 0,
                width: this.plotWidth - this.calcThumbnailViewBoxX(this.xAxis.valMax),
                height: "100%",
                backgroundColor: "rgba(0, 0, 0, 0.2)",
            }}
            >
            </div>)
    }

    _ElementThumbnailViewBoxLeft = () => {
        return (
            <div style={{
                position: "absolute",
                left: -1,
                top: 0,
                width: this.calcThumbnailViewBoxX(this.xAxis.valMin),
                height: "100%",
                backgroundColor: "rgba(0, 0, 0, 0.2)",
            }}
            >
            </div>)
    }



    _ElementThumbnailViewBox = () => {
        const viewBoxRef = React.useRef<any>(null);
        return (
            <div style={{
                position: "absolute",
                left: this.calcThumbnailViewBoxX(this.xAxis.valMin) - 1,
                top: 0,
                width: this.calcThumbnailViewBoxX(this.xAxis.valMax) - this.calcThumbnailViewBoxX(this.xAxis.valMin),
                height: "100%",
            }}
                ref={viewBoxRef}
            >
                {/* left resizer */}
                <div style={{
                    position: "absolute",
                    left: -2,
                    top: 0,
                    width: 4,
                    height: "100%",
                    cursor: "ew-resize",
                }}
                    onMouseDown={(event: any) => {
                        if (event.button !== 0) {
                            return;
                        }
                        event.stopPropagation()

                        window.addEventListener("mousemove", this.handleMouseMoveOnThumnailLeftResizer);
                        window.addEventListener("mouseup", this.handleMouseUpOnThumnailLeftResizer);
                    }}
                >
                </div>

                {/* right resizer */}
                <div style={{
                    position: "absolute",
                    right: -2,
                    top: 0,
                    width: 4,
                    height: "100%",
                    // border: "solid 1px rgba(0,0,0,1)",
                    cursor: "ew-resize",
                }}
                    onMouseDown={(event: any) => {
                        if (event.button !== 0) {
                            return;
                        }

                        event.stopPropagation()
                        window.addEventListener("mousemove", this.handleMouseMoveOnThumnailRightResizer);
                        window.addEventListener("mouseup", this.handleMouseUpOnThumnailRightResizer);
                    }}
                >
                </div>
            </div>)
    }


    handleMouseMoveOnThumnailRightResizer = (event: MouseEvent) => {
        event.stopPropagation()

        let valXminInThumbnail = this.xAxis.valMin;
        let valXmaxInThumbnail = this.xAxis.valMax;
        for (let xData0 of this.x) {
            if (xData0.length > 1) {
                valXminInThumbnail = Math.min(valXminInThumbnail, xData0[0]);
                valXmaxInThumbnail = Math.max(valXmaxInThumbnail, xData0[xData0.length - 1]);
            }
        }

        this.tracingIsMoving = false;
        const dx = event.movementX;

        let pointXmin = this.calcThumbnailViewBoxX(this.xAxis.valMin);
        let pointXmax = this.calcThumbnailViewBoxX(this.xAxis.valMax) + dx;
        // minimum width, this is only for manual resize on thumbnail, the regular update or manual magnifying is not limited
        if (pointXmax - pointXmin < 10) {
            pointXmax = pointXmin + 10;
        }

        let valMaxTmp = Math.min(this.mapPointToXYThumbnail(pointXmax), valXmaxInThumbnail);
        this.xAxis.valMax = valMaxTmp;
        this.updatePlot()
    }

    handleMouseUpOnThumnailRightResizer = (event: any) => {
        event.stopPropagation();
        window.removeEventListener("mousemove", this.handleMouseMoveOnThumnailRightResizer);
        window.removeEventListener("mouseup", this.handleMouseUpOnThumnailRightResizer);
    }

    handleMouseMoveOnThumnailLeftResizer = (event: MouseEvent) => {
        event.stopPropagation()
        let valXminInThumbnail = this.xAxis.valMin;
        let valXmaxInThumbnail = this.xAxis.valMax;
        for (let xData0 of this.x) {
            if (xData0.length > 1) {
                valXminInThumbnail = Math.min(valXminInThumbnail, xData0[0]);
                valXmaxInThumbnail = Math.max(valXmaxInThumbnail, xData0[xData0.length - 1]);
            }
        }

        this.tracingIsMoving = false;
        const dx = event.movementX;

        let pointXmin = this.calcThumbnailViewBoxX(this.xAxis.valMin) + dx;
        let pointXmax = this.calcThumbnailViewBoxX(this.xAxis.valMax);
        // minimum width, this is only for manual resize on thumbnail, the regular update or manual magnifying is not limited
        if (pointXmax - pointXmin < 10) {
            pointXmin = pointXmax - 10;
        }

        let valMinTmp = Math.max(this.mapPointToXYThumbnail(pointXmin), valXminInThumbnail);

        this.xAxis.valMin = valMinTmp;
        this.updatePlot()
    }

    handleMouseUpOnThumnailLeftResizer = (event: any) => {
        event.stopPropagation();
        window.removeEventListener("mousemove", this.handleMouseMoveOnThumnailLeftResizer);
        window.removeEventListener("mouseup", this.handleMouseUpOnThumnailLeftResizer);
    }

    handleMouseMoveOnThumnailViewBox = (event: MouseEvent) => {
        let valXminInThumbnail = this.xAxis.valMin;
        let valXmaxInThumbnail = this.xAxis.valMax;
        for (let xData0 of this.x) {
            if (xData0.length > 1) {
                valXminInThumbnail = Math.min(valXminInThumbnail, xData0[0]);
                valXmaxInThumbnail = Math.max(valXmaxInThumbnail, xData0[xData0.length - 1]);
            }
        }


        this.tracingIsMoving = false;

        const dx = event.movementX;
        // do not change window size
        const dVal = this.xAxis.valMax - this.xAxis.valMin;

        let valMinTmp = Math.max(this.mapPointToXYThumbnail(this.calcThumbnailViewBoxX(this.xAxis.valMin) + dx), valXminInThumbnail);
        let valMaxTmp = Math.min(this.mapPointToXYThumbnail(this.calcThumbnailViewBoxX(this.xAxis.valMax) + dx), valXmaxInThumbnail);

        if (valMinTmp === valXminInThumbnail) {
            // we reached the left edge
            valMaxTmp = this.xAxis.valMin + dVal;
        } else if (valMaxTmp === valXmaxInThumbnail) {
            // we reached the right edge
            valMinTmp = this.xAxis.valMax - dVal
        }

        this.xAxis.valMin = valMinTmp;
        this.xAxis.valMax = valMaxTmp;

        this.updatePlot()
    }
    handleMouseUpOnThumnailViewBox = () => {
        window.removeEventListener("mousemove", this.handleMouseMoveOnThumnailViewBox);
        window.removeEventListener("mouseup", this.handleMouseUpOnThumnailViewBox);
    }

    mapPointToXYThumbnail = (pointX: number): number => {
        let valXmin = this.xAxis.valMin;
        let valXmax = this.xAxis.valMax;
        for (let xData0 of this.x) {
            if (xData0.length > 1) {
                valXmin = Math.min(valXmin, xData0[0]);
                valXmax = Math.max(valXmax, xData0[xData0.length - 1]);
            }
        }
        const pointXmin = 0;
        const pointXmax = this.plotWidth;
        const valX = valXmin + ((pointX - pointXmin) * (valXmax - valXmin)) / (pointXmax - pointXmin);
        return valX;
    };




    calcThumbnailViewBoxX = (valX: number): number => {
        let valXmin = this.xAxis.valMin;
        let valXmax = this.xAxis.valMax;

        for (let xData0 of this.x) {
            if (xData0.length > 1) {
                valXmin = Math.min(valXmin, xData0[0]);
                valXmax = Math.max(valXmax, xData0[xData0.length - 1]);
            }
        }
        const pointXmin = 0;
        const pointXmax = this.plotWidth;
        const pointX = pointXmin + ((pointXmax - pointXmin) / (valXmax - valXmin)) * (valX - valXmin);
        return pointX;
    };

    _ElementThumbnailLine = ({ index }: any) => {
        if (this.yAxes[index] === undefined) {
            return null;
        }
        if (this.yAxes[index].show === false) {
            return null;
        }

        return (
            <svg
                width={`${this.plotWidth}`}
                height={`${this.thumbnailHeight}`}
                x="0"
                y="0"
                style={{
                    position: "absolute",
                }}
            >
                <polyline
                    points={this.mapXYsToPointsThumbnail(index)}
                    strokeWidth={`1`}
                    stroke={this.yAxes[index].lineColor}
                    fill="none"
                ></polyline>
            </svg>
        );
    };

    mapXYsToPointsThumbnail = (index: number): string => {

        const xData0 = this.x[index];
        const yData0 = this.y[index];

        if (yData0 === undefined) {
            return "";
        }

        if (xData0[xData0.length - 1] < this.xAxis.valMin) {
            return "";
        }
        if (xData0[0] > this.xAxis.valMax) {
            return "";
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
            return "";
        }

        let xData = xData0;
        let yData = yData0;

        // only calculate the data in visible region
        // if (this.getMainWidget().getReCalcPlot() === true) {
        //     xData = xData0.slice(xMinIndex, xMaxIndex);
        //     yData = yData0.slice(xMinIndex, xMaxIndex);
        // }

        const newValsXY: [number, number][] = [];

        let valsXYOnPlot: [number, number][] = this.valsXYOnThumbnail[index];
        if (valsXYOnPlot === undefined) {
            valsXYOnPlot = [];
            this.valsXYOnThumbnail[index] = valsXYOnPlot;
        }

        let pointsXYOnPlot: [number, number][] = this.pointsXYOnThumbnail[index];
        if (pointsXYOnPlot === undefined) {
            pointsXYOnPlot = [];
            this.pointsXYOnThumbnail[index] = pointsXYOnPlot;
        }

        // if re-calcualte, return here
        // if (this.getMainWidget().getReCalcPlot() === true) {
        // empty pointsXYOnPlot
        pointsXYOnPlot.length = 0;
        valsXYOnPlot.length = 0;
        let iiStep = Math.ceil((xData.length + 0.5) / 1000);
        for (let ii = 0; ii < xData.length; ii = ii + 2 * iiStep) {
            if (xData[ii] !== undefined && yData[ii] !== undefined) {
                const pointXY = this.mapXYToPointThumbnail(index, [xData[ii], yData[ii]]);
                if (!isNaN(pointXY[0])) {
                    pointsXYOnPlot.push(pointXY);
                    valsXYOnPlot.push([xData[ii], yData[ii]]);
                }
            }

            if (xData[ii + 1] !== undefined && yData[ii + 1] !== undefined) {
                const pointXY = this.mapXYToPointThumbnail(index, [xData[ii + 1], yData[ii + 1]]);
                if (!isNaN(pointXY[0])) {
                    pointsXYOnPlot.push(pointXY);
                    valsXYOnPlot.push([xData[ii + 1], yData[ii + 1]]);
                }
            }
        }
        return `${pointsXYOnPlot}`
    };





    mapXYToPointThumbnail = (index: number, [valX, valY]: [number, number]): [number, number] => {
        let useLog10Scale = false;
        if (this.yAxes[index] !== undefined) {
            useLog10Scale = this.yAxes[index]["displayScale"] === "Log10" ? true : false;
        }


        let valXmin = this.xAxis.valMin;
        let valXmax = this.xAxis.valMax;
        let valYmin = Math.min(...this.generateFallbackYTicks());
        let valYmax = Math.max(...this.generateFallbackYTicks());
        if (useLog10Scale) {
            valYmin = Math.log10(valYmin);
            valYmax = Math.log10(valYmax);
        }

        if (this.yAxes[index] !== undefined) {
            valYmin = this.yAxes[index].valMin;
            valYmax = this.yAxes[index].valMax;
            if (useLog10Scale) {
                valYmin = Math.log10(valYmin);
                valYmax = Math.log10(valYmax);
            }
        }

        if (useLog10Scale) {
            valY = Math.log10(valY);
        }
        if (useLog10Scale) {
            if (valY === Infinity || valY === -Infinity || isNaN(valY)) {
                valY = 0
            }
            if (valYmin === Infinity || valYmin === -Infinity || isNaN(valYmin)) {
                valYmin = 0
            }
            if (valYmax === Infinity || valYmax === -Infinity || isNaN(valYmax)) {
                valYmax = 0
            }
        }

        for (let xData0 of this.x) {
            if (xData0.length > 1) {
                valXmin = Math.min(valXmin, xData0[0]);
                valXmax = Math.max(valXmax, xData0[xData0.length - 1]);
            }
        }

        const pointXmin = 0;
        const pointXmax = this.plotWidth;
        const pointYmin = 0;
        let pointYmax = this.thumbnailHeight;
        const pointX = pointXmin + ((pointXmax - pointXmin) / (valXmax - valXmin)) * (valX - valXmin);
        const pointY = pointYmax - ((pointYmax - pointYmin) / (valYmax - valYmin)) * (valY - valYmin);
        return [pointX, pointY];
    };


    // ----------------------------- elements components -----------------------

    _ElementXYTickLines = () => {

        const yTicks = this.yAxes[this.selectedTraceIndex] === undefined ? this.generateFallbackYTicks() : this.yAxes[this.selectedTraceIndex].ticks;
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
                {this.xAxis.ticks.map((tickValue: number, index: number) => {
                    return <this._ElementXtickLine lineIndex={this.selectedTraceIndex} tickIndex={index}></this._ElementXtickLine>;
                })}
                {yTicks.map((tickValue: number, index: number) => {
                    return <this._ElementYtickLine lineIndex={this.selectedTraceIndex} tickIndex={index}></this._ElementYtickLine>;
                })}
            </svg>
        );
    };

    generateFallbackYTicks = () => {
        return [0, 2, 4, 6, 8, 10];
    }
    generateFallbackYTicksText = () => {
        return ["0", "2", "4", "6", "8", "10"];
    }

    _ElementXtickLine = ({ lineIndex, tickIndex }: any) => {
        let valMin = 0;
        let valMax = 10;
        if (lineIndex !== undefined && this.yAxes[lineIndex] !== undefined) {
            valMin = this.yAxes[lineIndex].valMin;
            valMax = this.yAxes[lineIndex].valMax;
        }

        const XYPoint1 = this.mapXYToPoint(lineIndex, [this.xAxis.ticks[tickIndex], valMin]);
        const XYPoint2 = this.mapXYToPoint(lineIndex, [this.xAxis.ticks[tickIndex], valMax]);
        const XYPoint3 = [XYPoint1[0], XYPoint1[1] - 10];
        const XYPoint4 = [XYPoint2[0], XYPoint2[1] + 10];
        return (
            <>
                <polyline
                    points={`${XYPoint1} ${XYPoint2}`}
                    strokeWidth="1"
                    stroke="rgb(190,190,190)"
                    strokeDasharray={"5, 5"}
                    fill="none"
                ></polyline>
                <polyline points={`${XYPoint1} ${XYPoint3}`} strokeWidth="2" stroke="rgb(0,0,0)" fill="none"></polyline>
                <polyline points={`${XYPoint2} ${XYPoint4}`} strokeWidth="2" stroke="rgb(0,0,0)" fill="none"></polyline>
            </>
        );

    };

    _ElementYtickLine = ({ lineIndex, tickIndex }: any) => {
        // x axis expands from -10 days to now, in unit of Epoch time ms
        let valMin = Date.now() - 10 * 1440 * 60 * 1000;
        let valMax = Date.now();
        let yTicks = this.generateFallbackYTicks();
        if (lineIndex !== undefined && this.yAxes[lineIndex] !== undefined) {
            yTicks = this.yAxes[lineIndex].ticks;
        }
        if (this.xAxis.valMin !== undefined && this.xAxis.valMax !== undefined) {
            valMin = this.xAxis.valMin;
            valMax = this.xAxis.valMax;
        }

        const XYPoint1 = this.mapXYToPoint(lineIndex, [valMin, yTicks[tickIndex]]);
        const XYPoint2 = this.mapXYToPoint(lineIndex, [valMax, yTicks[tickIndex]]);
        const XYPoint3 = [XYPoint1[0] + 10, XYPoint1[1]];
        const XYPoint4 = [XYPoint2[0] - 10, XYPoint2[1]];

        return (
            <>
                <polyline
                    points={`${XYPoint1} ${XYPoint2}`}
                    strokeWidth="1"
                    stroke="rgb(190,190,190)"
                    strokeDasharray={"5, 5"}
                    fill="none"
                ></polyline>
                <polyline points={`${XYPoint1} ${XYPoint3}`} strokeWidth="2" stroke="rgb(0,0,0)" fill="none"></polyline>
                <polyline points={`${XYPoint2} ${XYPoint4}`} strokeWidth="2" stroke="rgb(0,0,0)" fill="none"></polyline>
            </>
        );
    };

    _ElementLine = ({ index }: any) => {
        if (this.yAxes[index] === undefined) {
            return null;
        }
        if (this.yAxes[index].show === false) {
            return null;
        }

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
                <polyline
                    points={this.mapXYsToPoints(index)}
                    strokeWidth={`${this.yAxes[index].lineWidth}`}
                    stroke={this.yAxes[index].lineColor}
                    fill="none"
                ></polyline>
            </svg>
        );
    };
    _ElementXTicks = () => {
        return (
            <div
                style={{
                    // necessary for absolute children elments
                    position: "relative",
                    width: `${this.plotWidth}px`,
                    height: `100%`,
                    display: "inline-flex",
                    flexFlow: "row",
                    alignItems: "flex-start",
                    justifyContent: "center",
                    // backgroundColor: "grey",
                    backgroundColor: "rgba(180, 180, 180, 0)",
                    overflow: "visible",
                }}
            >
                {this.xAxis.ticks.map((value: number, tickIndex: number) => {
                    const [pointX, pointY] = this.mapXYToPoint(0, [value, 1]);
                    return (
                        <div
                            style={{
                                position: "absolute",
                                left: `${pointX}px`,
                                width: "0px",
                                height: "100%",
                                overflow: "visible",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            {this.xAxis.ticksText[tickIndex]}
                        </div>
                    );
                })}
            </div>
        );
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
                {this.xAxis.label}
            </div>
        );
    };

    _ElementYTicks = () => {
        // if no trace is selected (there is no trace), the y axis range is set as from 0 to 10 in this.mapXYToPlot()
        const yTicks = this.yAxes[this.selectedTraceIndex] === undefined ? this.generateFallbackYTicks() : this.yAxes[this.selectedTraceIndex].ticks;
        const yTicksText = this.yAxes[this.selectedTraceIndex] === undefined ? this.generateFallbackYTicksText() : this.yAxes[this.selectedTraceIndex].ticksText;
        return (
            <div
                style={{
                    display: "inline-flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: `${this.yAxisTickWidth}px`,
                    height: "100%",
                    margin: "0px",
                    padding: "0px",
                    // backgroundColor: "pink",
                    backgroundColor: "rgba(255, 192, 203, 0)",
                    position: "relative",
                }}
            >
                {yTicks.map((value: number, tickIndex: number) => {
                    const [pointX, pointY] = this.mapXYToPoint(this.selectedTraceIndex, [1, value]);
                    return (
                        <div
                            style={{
                                position: "absolute",
                                right: "2px",
                                top: `${pointY}px`,
                                width: "100%",
                                height: "0px",
                                overflow: "visible",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "flex-end",
                            }}
                        >
                            {yTicksText[tickIndex]}
                        </div>
                    );
                })}
            </div>
        );
    };

    _ElementYLabel = () => {
        return (
            <div
                style={{
                    display: "inline-flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: `${this.yAxisLabelWidth}px`,
                    height: "100%",
                    margin: "0px",
                    padding: "0px",
                    // backgroundColor: "magenta",
                    backgroundColor: "rgba(255, 0, 255, 0)",
                    color: this.yAxes[this.selectedTraceIndex] === undefined ? "black" : this.yAxes[this.selectedTraceIndex].lineColor,
                }}
            >
                <div
                    style={{
                        transform: "rotate(-90deg)",
                        overflow: "visible",
                        whiteSpace: "nowrap",
                    }}
                >
                    {`${this.yAxes[this.selectedTraceIndex] === undefined ? "" : this.yAxes[this.selectedTraceIndex].label}`}
                </div>
            </div>
        );
    };

    _ElementBlankArea = () => {
        return (
            <div
                style={{
                    width: `${this.yAxisLabelWidth + this.yAxisTickWidth}px`,
                    height: `100%`,
                    display: "inline-flex",
                    flexFlow: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    // backgroundColor: "blue",
                    backgroundColor: "rgba(0, 0, 255, 0)",
                }}
            ></div>
        );
    };

    _ElementLegend = () => {
        return (
            <div
                style={{
                    width: `${this.legendWidth}px`,
                    height: "100%",
                    display: "inline-flex",
                    flexFlow: "column",
                    justifyContent: "flex-start",
                    alignItems: "flex-start",
                    // backgroundColor: "cyan",
                    backgroundColor: "rgba(0, 100, 100, 0)",
                }}
            >
                {this.yAxes.map((yAxis: Record<string, any>, index: number) => {
                    if (yAxis.show === false) {
                        return null;
                    }
                    const xData = this.x[index];
                    const yData = this.y[index];
                    let timeStr = "0000-00-00 00:00:00.000";
                    let valueStr = "0";
                    if (xData.length > 1) {
                        // the last element is a patch
                        timeStr = GlobalMethods.convertEpochTimeToString(xData[xData.length - 2]);
                        valueStr = yData[yData.length - 1].toString();
                    }
                    return (
                        <div
                            style={{
                                display: "inline-flex",
                                flexFlow: "column",
                                justifyContent: "flex-start",
                                alignItems: "flex-start",
                                width: "100%",
                                height: "fit-content",
                                color: yAxis.lineColor,
                                margin: "3px",
                            }}
                            onMouseDown={(event: any) => {
                                if (event.button !== 0) {
                                    return;
                                }

                                this.selectedTraceIndex = index;
                                this.updatePlot();
                            }}
                        >
                            <div>{yAxis.label}</div>
                            <div>{timeStr}</div>
                            {/* <div>{`[${yAxis.valMin}, ${yAxis.valMax}] ${valueStr}`}</div> */}
                            <div>{`${valueStr}`}</div>
                        </div>
                    );
                })}
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
                    // top: `0px`,
                    // left: `0px`,
                    width: `100%`,
                    height: `${this.titleHeight}px`,
                    display: "inline-flex",
                    flexFlow: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    // backgroundColor: "lightblue",
                    backgroundColor: "rgba(68, 85, 90, 0)",
                }}
            >

                <ElementProfileBlockNameInput
                    additionalStyle={{
                        fontSize: "25px",
                    }}
                    value={`${this.getText().title}`}
                    onChange={changeTitle}
                ></ElementProfileBlockNameInput>
            </div>
        );
    };

    _ElementControls = () => {
        return (
            <div
                style={{
                    width: `100%`,
                    height: `${this.toolbarHeight}`,
                    display: "inline-flex",
                    flexFlow: "row",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    backgroundColor: "rgba(0, 255, 0, 0)",
                }}
            >
                <div
                    style={{
                        display: "inline-flex",
                        flexDirection: "row",
                        alignItems: "center",
                        height: "20px",
                        padding: "0px",
                        margin: "0px",
                        marginTop: "10px",
                    }}
                >
                    {/* re-scale vertically to plot limits */}
                    <this._StyledFigButton
                        onMouseDown={(event: any) => {
                            if (event.button !== 0) {
                                return;
                            }

                            for (let ii = 0; ii < this.yAxes.length; ii++) {
                                const yValMinMax = this.findVisibleYValueRange(ii);
                                if (yValMinMax !== undefined) {
                                    const yAxis = this.yAxes[ii];
                                    if (yAxis !== undefined) {
                                        yAxis.valMin = yValMinMax[0];
                                        yAxis.valMax = yValMinMax[1];
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
                            src={`../../resources/webpages/scale-y.svg`}
                        ></img>
                    </this._StyledFigButton>
                    {/* setting page */}
                    <this._StyledFigButton
                        onMouseDown={(event: any) => {
                            if (event.button !== 0) {
                                return;
                            }

                            this.getMainWidget().showSettingsPage = true;
                            this.updatePlot();
                        }}
                    >
                        <img
                            style={{
                                width: "100%",
                                height: "100%",
                            }}
                            src={`../../resources/webpages/settings.svg`}
                        ></img>
                    </this._StyledFigButton>
                    {/* pause/play */}
                    <this._StyledFigButton
                        style={{
                            fontSize: "18px",
                        }}
                        onMouseDown={(event: any) => {
                            if (event.button !== 0) {
                                return;
                            }

                            this.tracingIsMoving = !this.tracingIsMoving;
                            // if (this.tracingIsMoving === true) {
                            // 	this.updatingByInterval = true;
                            // }
                            this.updatePlot(true);
                            // if (this.tracingIsMoving === true) {
                            // 	this.updatingByInterval = false;
                            // }
                        }}
                    >
                        {this.tracingIsMoving ? (
                            <img
                                style={{
                                    width: "100%",
                                    height: "100%",
                                }}
                                src={`../../resources/webpages/pause.svg`}
                            ></img>
                        ) : (
                            <img
                                style={{
                                    width: "100%",
                                    height: "100%",
                                }}
                                src={`../../resources/webpages/play.svg`}
                            ></img>
                        )}
                    </this._StyledFigButton>{" "}
                    {/* horizontal zoom in */}
                    <this._StyledFigButton
                        onMouseDown={(event: any) => {
                            if (event.button !== 0) {
                                return;
                            }

                            const xAxis = this.xAxis;
                            if (xAxis === undefined) {
                                return;
                            }
                            const dt = xAxis.valMax - xAxis.valMin;
                            xAxis.valMin = xAxis.valMax - dt / 1.25;
                            this.updatePlot();
                        }}
                    >
                        <img
                            style={{
                                width: "100%",
                                height: "100%",
                            }}
                            src={`../../resources/webpages/horizontal-zoom-in.svg`}
                        ></img>
                    </this._StyledFigButton>{" "}
                    {/* horizontal zoom out */}
                    <this._StyledFigButton
                        onMouseDown={(event: any) => {
                            if (event.button !== 0) {
                                return;
                            }

                            const xAxis = this.xAxis;
                            if (xAxis === undefined) {
                                return;
                            }
                            const dt = xAxis.valMax - xAxis.valMin;
                            xAxis.valMin = xAxis.valMax - dt * 1.25;
                            // this.tracingIsMoving = false;
                            // this.calcXTicksAndLabel();
                            this.updatePlot();
                        }}
                    >
                        <img
                            style={{
                                width: "100%",
                                height: "100%",
                            }}
                            src={`../../resources/webpages/horizontal-zoom-out.svg`}
                        ></img>
                    </this._StyledFigButton>
                    {/* horizontal pan left */}
                    <this._StyledFigButton
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
                            src={`../../resources/webpages/horizontal-pan-left.svg`}
                        ></img>
                    </this._StyledFigButton>
                    {/* horizontal pan right */}
                    <this._StyledFigButton
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
                            src={`../../resources/webpages/horizontal-pan-right.svg`}
                        ></img>
                    </this._StyledFigButton>
                    {/* vertical zoom in*/}
                    <this._StyledFigButton
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
                                // zoom factor is 90%
                                const yMinNew = yMid - dy / 1.1;
                                const yMaxNew = yMid + dy / 1.1;
                                yAxis.valMin = yMinNew;
                                yAxis.valMax = yMaxNew;
                                this.calcYTicksAndLabel(ii);
                            }

                            this.updatePlot();
                        }}
                    >
                        <img
                            style={{
                                width: "100%",
                                height: "100%",
                            }}
                            src={`../../resources/webpages/vertical-zoom-in.svg`}
                        ></img>
                    </this._StyledFigButton>
                    {/* vertical zoom out*/}
                    <this._StyledFigButton
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
                                const yMinNew = yMid - dy * 1.1;
                                const yMaxNew = yMid + dy * 1.1;
                                yAxis.valMin = yMinNew;
                                yAxis.valMax = yMaxNew;
                                this.calcYTicksAndLabel(ii);
                            }
                            this.updatePlot();
                        }}
                    >
                        <img
                            style={{
                                width: "100%",
                                height: "100%",
                            }}
                            src={`../../resources/webpages/vertical-zoom-out.svg`}
                        ></img>
                    </this._StyledFigButton>
                    {/* vertical pan down*/}
                    <this._StyledFigButton
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
                                this.calcYTicksAndLabel(ii);
                            }
                            this.updatePlot();
                        }}
                    >
                        <img
                            style={{
                                width: "100%",
                                height: "100%",
                            }}
                            src={`../../resources/webpages/vertical-pan-down.svg`}
                        ></img>
                    </this._StyledFigButton>{" "}
                    {/* vertical pan up*/}
                    <this._StyledFigButton
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
                                this.calcYTicksAndLabel(ii);
                            }
                            this.updatePlot();
                        }}
                    >
                        <img
                            style={{
                                width: "100%",
                                height: "100%",
                            }}
                            src={`../../resources/webpages/vertical-pan-up.svg`}
                        ></img>
                    </this._StyledFigButton>{" "}
                    {/* export data */}
                    <this._StyledFigButton
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
                            src={`../../resources/webpages/save-to-file.svg`}
                        ></img>
                    </this._StyledFigButton>{" "}
                    <this._ElementCursorPosition></this._ElementCursorPosition>
                </div>
            </div>
        );
    };

    _StyledFigButton = ({ children, onMouseDown }: any) => {
        const elementRef = React.useRef<any>(null);
        return (
            <div
                ref={elementRef}
                style={{
                    display: "inline-flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100%",
                    aspectRatio: "1/1",
                    backgroundColor: "rgba(0, 0, 0, 0)",
                    opacity: 0.4,
                    borderRadius: 3,
                    padding: 1,
                    margin: 0,
                }}
                onMouseEnter={() => {
                    if (elementRef.current !== null) {
                        if (!g_widgets1.isEditing()) {
                            elementRef.current.style["opacity"] = 1;
                        }
                    }
                }}
                onMouseLeave={() => {
                    if (elementRef.current !== null) {
                        if (!g_widgets1.isEditing()) {
                            elementRef.current.style["opacity"] = 0.4;
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

    // plot body
    _ElementPlotRaw = () => {
        const plotRef = React.useRef<any>(null);

        // did mount.
        // to use {passive: false} option, we must explicitly use addEventListener method
        React.useEffect(() => {
            if (plotRef.current !== null) {
                plotRef.current.addEventListener("wheel", this.handleWheelOnPlot, { passive: false })
            }
        }, [])

        // did unmount
        // we return a function that removes the wheel event listener
        React.useEffect(() => {
            return () => {
                if (plotRef.current !== null) {
                    plotRef.current.removeEventListener("wheel", this.handleWheelOnPlot, { passive: false })
                }
            }
        }, [])

        return (
            <div
                ref={plotRef}
                style={{
                    width: `${this.plotWidth}px`,
                    height: `${this.plotHeight}px`,
                    outline: "1px solid black",
                    backgroundColor: "rgba(0, 255, 255, 0)",
                }}
                onMouseEnter={() => {
                    if (!g_widgets1.isEditing()) {
                        window.addEventListener("mousemove", this.getCursorValue);
                    }
                }}
                onMouseLeave={() => {
                    this.lastCursorPointXY = [-100000, -100000];
                    this.getCursorValue(this.lastCursorPointXY);
                    window.removeEventListener("mousemove", this.getCursorValue);
                }}
                onMouseDown={(event: any) => {
                    if (event.button !== 0) {
                        return;
                    }

                    window.addEventListener("mousemove", this.handleMouseMoveOnPlot);
                    window.addEventListener("mouseup", this.handleMouseUpOnPlot);

                }}
            >
                {/* tick lines first */}
                <this._ElementXYTickLines></this._ElementXYTickLines>
                {/* data */}
                {this.x.map((xData: number[], index: number) => {
                    return <this._ElementLine index={index}></this._ElementLine>;
                })}
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

    handleWheelOnPlot = (event: React.WheelEvent) => {
        event.preventDefault();
        event.stopPropagation();
        if (event.shiftKey) {
            this.handleWheelOnPlotY(event);
            return;
        } else {
            this.handleWheelOnPlotX(event);
            return;
        }
    }

    /**
     * rotate mouse wheel to zoom x-direction
     */
    handleWheelOnPlotX = (event: React.WheelEvent) => {
        if (this.yAxes[this.selectedTraceIndex] === undefined) {
            return;
        }
        const direction = event.deltaY < 0 ? "zoom-in" : "zoom-out";

        const bounding = (event.target as Element).getBoundingClientRect();
        const pointXMid = event.clientX - bounding["x"]
        const valXMid = this.mapPointToXY(this.selectedTraceIndex, [pointXMid, 0]);
        const xAxis = this.xAxis;

        if (xAxis === undefined) {
            return;
        }

        if (direction === "zoom-in") {
            xAxis.valMin = xAxis.valMin + (valXMid[0] - xAxis.valMin) * 0.1;
            xAxis.valMax = this.tracingIsMoving === true ? xAxis.valMax : xAxis.valMax - (xAxis.valMax - valXMid[0]) * 0.1;
        } else {
            xAxis.valMin = xAxis.valMin - (valXMid[0] - xAxis.valMin) * 0.1;
            xAxis.valMax = this.tracingIsMoving === true ? xAxis.valMax : xAxis.valMax + (xAxis.valMax - valXMid[0]) * 0.1;
        }

        this.updatePlot();
    }

    /**
     * rotate mouse wheel to zoom y-direction, shift key must be pressed
     */
    handleWheelOnPlotY = (event: React.WheelEvent) => {
        event.preventDefault()

        let pointYMid: undefined | number = undefined;
        const bounding = (event.target as Element).getBoundingClientRect();
        if (bounding !== undefined && bounding["y"] !== undefined) {
            pointYMid = event.clientY - bounding["y"];
        }
        // with shift key pressed, deltaX is the vertical wheel rotation
        const direction = event.deltaX < 0 ? "zoom-in" : "zoom-out";

        let ii = this.selectedTraceIndex;

        const yAxis = this.yAxes[ii];
        if (yAxis === undefined) {
            return;
        }
        const yMin = yAxis.valMin;
        const yMax = yAxis.valMax;
        let yMid = (yMin + yMax) / 2;
        if (pointYMid !== undefined) {
            const xyMid = this.mapPointToXY(ii, [0, pointYMid]);
            yMid = xyMid[1];
        }
        const dyUpper = yMax - yMid;
        const dyLower = yMid - yMin;
        if (direction === "zoom-in") {
            const yMinNew = yMid - dyLower / 1.1;
            const yMaxNew = yMid + dyUpper / 1.1;
            yAxis.valMin = yMinNew;
            yAxis.valMax = yMaxNew;
        } else {
            const yMinNew = yMid - dyLower * 1.1;
            const yMaxNew = yMid + dyUpper * 1.1;
            yAxis.valMin = yMinNew;
            yAxis.valMax = yMaxNew;
        }
        this.calcYTicksAndLabel(ii);

        this.updatePlot();
    }

    handleMouseMoveOnPlot = (event: MouseEvent) => {
        if (event.shiftKey) {
            this.handleMouseMoveOnPlotY(event);
            return;
        } else {
            this.handleMouseMoveOnPlotX(event);
            return;
        }
    }


    handleMouseMoveOnPlotX = (event: MouseEvent) => {

        this.tracingIsMoving = false;

        const dPointX = event.movementX;

        this.mouseMoveEndX = event.clientX;

        const ii = this.selectedTraceIndex;
        if (this.yAxes[ii] === undefined) {
            return;
        }
        const valXY0 = this.mapPointToXY(ii, [0, 0]);
        const valXY1 = this.mapPointToXY(ii, [dPointX, 0]);
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

        const ii = this.selectedTraceIndex;
        const yAxis = this.yAxes[ii];
        if (yAxis === undefined) {
            return;
        }
        const yMin = yAxis.valMin;
        const yMax = yAxis.valMax;

        const dxy0 = this.mapPointToXY(ii, [0, pointDy]);
        const dxy1 = this.mapPointToXY(ii, [0, 0]);
        const dy = dxy1[1] - dxy0[1];
        const yMinNew = yMin + dy;
        const yMaxNew = yMax + dy;
        yAxis.valMin = yMinNew;
        yAxis.valMax = yMaxNew;
        this.calcYTicksAndLabel(ii);
        this.updatePlot();
    }

    handleMouseUpOnPlot = (event: MouseEvent) => {
        event.preventDefault();
        // this.mouseMovingOnPlot = false;

        window.removeEventListener("mousemove", this.handleMouseMoveOnPlot);
        window.removeEventListener("mouseup", this.handleMouseUpOnPlot);

        if (this.mouseMoveEndX !== -100000) {
            const dPointX = event.clientX - this.mouseMoveEndX;
            this.mouseMoveEndX = -100000;

            const ii = this.selectedTraceIndex;
            if (this.yAxes[ii] === undefined) {
                return;
            }
            const valXY0 = this.mapPointToXY(ii, [0, 0]);
            const valXY1 = this.mapPointToXY(ii, [dPointX, 0]);
            const dt = valXY1[0] - valXY0[0];

            const xAxis = this.xAxis;
            if (xAxis === undefined) {
                return;
            }

            xAxis.valMin = xAxis.valMin - dt;
            xAxis.valMax = xAxis.valMax - dt;
            this.updatePlot();
        }
    }

    _ElementCursorPosition = () => {
        const [cursorValue, setCursorValue] = React.useState(" ");
        this.setCursorValue = setCursorValue;
        return (
            <div
                style={{
                    display: "inline-flex",
                    justifyContent: "center",
                    alignItems: "center",
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

    mapDbrDataWithoutNewData = (useNewestTime: boolean) => {
        if (!useNewestTime) {
            return;
        }
        if (g_widgets1.isEditing()) {
            this.wasEditing = true;
            return;
        }
        if (this.wasEditing || this.tracesInitialized === false) {
            this.selectedTraceIndex = 0;
            this.initTraces();
        }
        this.wasEditing = false;

        for (let ii = 0; ii < this.getChannelNames().length; ii++) {
            const channelName = this.getChannelNames()[ii];

            const xData = this.x[ii];
            const yData = this.y[ii];

            // the channel and data in the channel must all be valid
            try {
                const tcaChannel = g_widgets1.getTcaChannel(channelName);
                if (tcaChannel.getTimeStamp() === undefined || g_widgets1.getChannelValue(channelName, true) === undefined) {
                    Log.error(`There is no timestamp for ${channelName}`);
                    continue;
                }
            } catch (e) {
                Log.error(e);
                continue;
            }

            // (3)
            const value = g_widgets1.getChannelValue(channelName);
            if (typeof value !== "number") {
                continue;
            }

            // remove patch data
            xData.pop();
            yData.pop();
            // append patch data
            xData.push(Date.now());
            yData.push(value);
        }
    };

    fetchArchiveData = () => {
        for (let ii = 0; ii < this.getChannelNames().length; ii++) {
            const channelName = this.getChannelNames()[ii];
            const timeMinOnPlot = this.xAxis["valMin"];
            const timeMaxOnPlot = this.xAxis["valMax"];
            const timeMinInData = this.x[ii][0];
            const timeMaxInData = this.x[ii][this.x[ii].length - 1];
            // the archive data must be earlier than the live data
            if (timeMinOnPlot < timeMinInData) {
                const startTime = GlobalMethods.convertEpochTimeToString(timeMinOnPlot).split(".")[0];
                const endTime = GlobalMethods.convertEpochTimeToString(timeMinInData).split(".")[0];
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
        startTime: string, // "2024-01-01 01:23:45", no ms
        endTime: string,
        archiveData: any
    }) => {
        if (g_widgets1.isEditing()) {
            this.wasEditing = true;
            return;
        }

        if (this.wasEditing || this.tracesInitialized === false) {
            this.selectedTraceIndex = 0;
            this.initTraces();
        }

        this.wasEditing = false;

        if (this.getChannelNames().includes(data["channelName"])) {
            const ii = this.getChannelNames().indexOf(data["channelName"]);
            const xData = this.x[ii];
            const yData = this.y[ii];
            const oldestXData = xData[0];
            const archiveDataArray = data["archiveData"]["rows"];
            // stich data together
            for (let index = archiveDataArray.length - 1; index >= 0; index--) {

                // each item has format [ 2013-05-21T04:00:00.184Z, 856514.5333504636, 'OK', 'OK' ],
                const item = archiveDataArray[index];
                const iso8601Time = item[0];
                const msSinceEpoch = GlobalMethods.convertIso8601TimeToEpochTime(iso8601Time);
                // if the archive data is newer than the oldest existing data
                if (msSinceEpoch > oldestXData) {
                    continue;
                }
                const value = item[1];
                yData[0] = value;
                xData.splice(0, 0, msSinceEpoch);
                yData.splice(0, 0, value);
                xData.splice(0, 0, msSinceEpoch);
                yData.splice(0, 0, value);
            }
        }
    }

    mapDbrDataWitNewData = (newChannelNames: string[]) => {
        if (g_widgets1.isEditing()) {
            this.wasEditing = true;
            return;
        }

        if (this.wasEditing || this.tracesInitialized === false) {
            this.selectedTraceIndex = 0;
            this.initTraces();
        }

        this.wasEditing = false;

        // used for determining plot x axis range

        // For each channelName:
        // (1) determine if its yaxis should be shown
        // (2) decide whether to proceed for this trace: TcaChannel exists/connected
        //     if not ok, continue the loop,
        // (3) obtain the most recent dbrData's time stamp and value, the value must be "number" type
        // (3) append data if updateTraceData bit is true, this only happens when this function is
        //     invoked in periodic sampling setInterval()
        //     there are 3 types curves which requrie different data appending technique
        // (4) todo: update y axis range
        // (5) update yaxis label and legend
        for (let ii = 0; ii < this.getChannelNames().length; ii++) {
            const channelName = this.getChannelNames()[ii];

            // after this step, this channel must have a new data!
            if (!newChannelNames.includes(channelName)) {
                continue;
            }

            const xData = this.x[ii];
            const yData = this.y[ii];

            // the channel and data in the channel must all be valid
            try {
                const tcaChannel = g_widgets1.getTcaChannel(channelName);
                if (tcaChannel.getTimeStamp() === undefined || g_widgets1.getChannelValue(channelName, true) === undefined) {
                    // if (tcaChannel.getValue() === undefined) {
                    continue;
                }
                //todo: test above code, and remove below code
                // const tcaChannel = g_widgets1.getTcaChannel(channelName);
                // if (tcaChannel === undefined) {
                // 	continue;
                // }
                // if (tcaChannel.getDbrData().secondsSinceEpoch === undefined || tcaChannel.getDbrData().value === undefined) {
                // 	continue;
                // }

                // (3)
                const value = tcaChannel.getDbrData().value;
                if (typeof value !== "number") {
                    continue;
                }
                const newTimeStamp = GlobalMethods.converEpicsTimeStampToEpochTime(
                    tcaChannel.getDbrData().secondsSinceEpoch * 1000 + tcaChannel.getDbrData().nanoSeconds * 1e-6
                );

                // const oldTimeStamp = xData[xData.length - 2];
                const oldValue = yData[yData.length - 1];

                // remove patch data
                xData.pop();
                yData.pop();

                // push new data only when the time stamp is changed and new data arrival
                // if (newTimeStamp !== oldTimeStamp && this.updatingByInterval === false) {
                // CSS Area style
                // old value, new time, for ladder-like plot
                xData.push(newTimeStamp);
                yData.push(oldValue);
                // new value, new time
                xData.push(newTimeStamp);
                yData.push(value);

                // CSS Area (Direct) style
                // xData.push(newTimeStamp);
                // yData.push(value);

                const yAxis = this.yAxes[ii];
                const bufferSize = yAxis.bufferSize;

                if (xData.length > bufferSize * 2) {
                    xData.splice(0, xData.length - bufferSize * 2);
                    yData.splice(0, yData.length - bufferSize * 2);
                }

                // append patch data
                xData.push(Date.now());
                yData.push(value);
            } catch (e) {
                Log.error(e);
                continue;
            }
        }
    };

    exportData = () => {
        const result: Record<string, Record<string, number[] | string[]>> = {};
        for (let ii = 0; ii < this.getMainWidget().getChannelNames().length; ii++) {
            const channelName = this.getMainWidget().getChannelNames()[ii];
            const x = this.x[ii];
            const y = this.y[ii];
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

        const windowId = g_widgets1.getRoot().getDisplayWindowClient().getWindowId();
        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
        const mainProcessMode = displayWindowClient.getMainProcessMode();
        if (mainProcessMode === "web") {
            const blob = new Blob([JSON.stringify(result)], { type: 'text/json' });
            const dateNowStr = GlobalMethods.convertEpochTimeToString(Date.now());
            const suggestedName = `DataViewer-data-${dateNowStr}.json`;
            const description = 'Data Viewer data';
            const applicationKey = "application/json";
            const applicationValue = [".json"];
            displayWindowClient.downloadData(blob, suggestedName, description, applicationKey, applicationValue);
        } else {
            g_widgets1.getRoot().getDisplayWindowClient().getIpcManager().sendFromRendererProcess("data-viewer-export-data", windowId, result);
        }
    };

    // when we update the plot, two factors are considered:
    //  - the layout in the figure should be updated, e.g. x/y axis range, line color, tick label text, etc
    //    the "layout update" is controlled by updateLayout bit in this.updatePlot()'s input argument
    //    we directly modify the this.data[ii].XXX and this.plotLayout.XXX
    //  - the data trace in the figure should be updated, the this.data[ii].x and this.data[ii].y are changed
    //    The data change always caused the layout change, e.g. x range change, so "data trace update" always
    //    comes with "layout update".
    //    the data modification and the consequent layout parameter changes are done in this.mapDbrData(),
    //    in which this.data[ii].x/y, this.data[ii].XXX, and this.plotLayout.XXX are all modified
    // Usually most of the updates are "layout update", the ony "data trace update" is the periodicaly interval
    // update
    // The below method is a kickoff to update the figure after this.data and this.plotLayout are modified
    // It is invoked periodically and by user
    updatePlot = (useNewestTime: boolean = false, doFlush: boolean = true, dynamicUpdate: boolean = false) => {
        if (g_widgets1 === undefined) {
            return;
        }
        this.mapDbrDataWithoutNewData(useNewestTime);

        this.calcXTicksAndLabel(useNewestTime);
        for (let ii = 0; ii < this.yAxes.length; ii++) {
            this.calcYTicksAndLabel(ii);
        }
        this.getCursorValue(this.lastCursorPointXY);

        g_widgets1.addToForceUpdateWidgets(this.getMainWidget().getWidgetKey());

        // determine if the thumbnail should be updated
        // limit the update rate (number of points updated each second)
        // this done by (1) slowing down the refresh rate, and (2) sampling the data
        // the refresh rate should be between 1 Hz (1 s) and 0.2 Hz (5 s or )
        // the sampling rate should be between 1 and 5

        // Assume the thumbnail width is P pixels. There are N points for all traces, and there are
        // n traces. So, there are N/n points for each trace. Then, there are (N/n)/P points at 
        // each pixel. 
        // We know each second there are f0 points added to the data.
        // Then, in each second the pixel increases f0/((N/n)/P) pixels. 
        // We know the refresh is f Hz.
        // Then in each refresh, the pixel increases f0/((N/n)/P)/f pixels. 
        // We want to make sure in each refresh the pixel moves about 1 pixel: f0/((N/n)/P)/f ~ 1
        // Then: f * N ~ f0 * P * n
        //
        // For example: 
        //  - each second 10 points are added to each trace: f0 = 10
        //  - widget width is 2000 pixels: P = 2000
        //  - there are 20 traces: n = 10
        //  - then f * N ~ 200,000
        //  If f = 1 Hz, then N ~ 200,000. If N > 200,000, f should become 0.5 Hz.

        // CPU usage:
        // we use # of refreshed points per second to measure the performance: it is f * N
        // benchmark: 
        //  - 360,000 ~ 47% GPU, 31% renderer
        //  - 540,000 ~ 68% GPU, 48% renderer

        // plot should take less than 75% CPU, which limits f * N to 600,000

        // thumbnail should take less than 25% CPU, which limits f * N to 250,000
        // 

        // thumbnail dynamic update
        let totalPoints = 0;
        const updateRate = 1 / this.getMainWidget().getAllText()["updatePeriod"];

        for (let xData of this.x) {
            totalPoints = totalPoints + xData.length / 2;
        }
        let factor = Math.ceil(totalPoints * updateRate / GlobalVariables.DATAVIEWER_MAX_THUMBNAIL_DATA_RATE);
        if (this.thumbnailUpdateCount < factor) {
            this.thumbnailUpdateCount++;
            this.updateThumbnail = false;
        } else {
            this.thumbnailUpdateCount = 1;
            this.updateThumbnail = true;
        }

        // plot dynamic update
        totalPoints = 0;
        for (let index = 0; index < this.x.length; index++) {
            const xData0 = this.x[index];

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
            totalPoints = totalPoints + (xMaxIndex - xMinIndex) / 2;
        }
        factor = Math.ceil(totalPoints * updateRate / GlobalVariables.DATAVIEWER_MAX_PLOT_DATA_RATE);
        if (this.plotUpdateCount < factor) {
            this.plotUpdateCount++;
            this.updatePlotLines = false;
        } else {
            this.plotUpdateCount = 1;
            this.updatePlotLines = true;
        }

        // if the thumbnail need to be updated, the plot lines must also be updated
        // because the thumbnail is inside the plot lines element
        // if (this.updateThumbnail === true) {
        //     this.updatePlotLines = true;
        // }

        // force to update plot lines and thumbnail
        if (dynamicUpdate === false) {
            this.updatePlotLines = true;
            this.updateThumbnail = true;
        }

        g_widgets1.addToForceUpdateWidgets(this.getMainWidget().getWidgetKey());

        if (doFlush) {
            g_flushWidgets();
        }
    };


    // ------------------------------- traces ------------------------------------

    selectTrace = (index: number) => {
        this.selectedTraceIndex = index;
        this.updatePlot();
    };

    // (1) insert an empty channel name "" to this.getRawChannelNames() and expand the channel name
    // (2) init trace: create PlotlyTrace object, initialize and insert it to property
    //     places in this.data and this.plotLayout, then update all related properties
    //     in this.data and this.plotLayout
    // (3) connect and monitor channel
    // (4) select trace
    // (5) update plot
    insertTrace = (index: number, newTraceName: string, doFlush: boolean = true) => {
        // (1)
        const mainWidget = this.getMainWidget();
        mainWidget.getChannelNamesLevel0().splice(index, 0, newTraceName);
        mainWidget.processChannelNames();
        // this.getMainWidget().expandAndExtractChannelNames();
        // (2)
        this.initTrace(newTraceName, index, true);
        // (3)
        const newTcaChannel = g_widgets1.createTcaChannel(newTraceName, this.getMainWidget().getWidgetKey());
        if (newTcaChannel !== undefined) {
            newTcaChannel.getMeta(undefined);
            newTcaChannel.monitor();
        }
        try {
            // (4)
            this.selectTrace(0);
            // (5)
            if (doFlush) {
                this.updatePlot();
            }
        } catch (e) {
            Log.error(e);
        }
    };

    // invoked when the display is changed from editing to operating mode
    // does not change plot, only manipulate data structure, the plot will be
    // updated by itself
    // no need to connect all channels, the g_widgets1.setMode() will dot it
    initTraces = () => {
        this.x.length = 0;
        this.y.length = 0;
        // this.yAxes.length = 0;
        for (let ii = 0; ii < this.getChannelNames().length; ii++) {
            const channelName = this.getChannelNames()[ii];
            this.initTrace(channelName, ii);
        }
        // remove all excessive elements
        for (let ii = this.getChannelNames().length; ii < this.x.length; ii++) {
            this.x.pop();
        }
        for (let ii = this.getChannelNames().length; ii < this.y.length; ii++) {
            this.y.pop();
        }
        for (let ii = this.getChannelNames().length; ii < this.yAxes.length; ii++) {
            this.yAxes.pop();
        }
        this.tracesInitialized = true;
    };

    // only initialize data structure, does not connect channel or change plot
    // (1) insert empty array to this.x and this.y
    // (2)
    initTrace = (channelName: string, index: number, insertYAxis: boolean = false) => {
        // (1)
        this.x.splice(index, 0, []);
        this.y.splice(index, 0, []);
        // (2)
        // default yAxis
        let yAxis: type_yAxis = {
            label: channelName, // updated every time
            valMin: 0, // updated every time
            valMax: 10, // updated every time
            lineWidth: 2,
            lineColor: `rgba(${this.getNewColor()})`,
            ticks: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // updated every time
            ticksText: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // updated every time
            show: true,
            bufferSize: 50000,
            displayScale: "Linear",
        };

        if (this.yAxes[index] !== undefined) {
            yAxis = { ...yAxis, ...this.yAxes[index] };
        }

        if (insertYAxis === true) {
            this.yAxes.splice(index, 0, yAxis);
        } else {
            // override yAxis
            const existingYAxis = this.yAxes[index];
            if (existingYAxis !== undefined) {
                if (existingYAxis["lineWidth"] !== undefined) {
                    yAxis["lineWidth"] = existingYAxis["lineWidth"];
                }
                if (existingYAxis["lineColor"] !== undefined) {
                    yAxis["lineColor"] = existingYAxis["lineColor"];
                }
                if (existingYAxis["show"] !== undefined) {
                    yAxis["show"] = existingYAxis["show"];
                }
            }
            this.yAxes.splice(index, 1, yAxis);
        }
    };

    // (1) remove channel name from this.getRawChannelNames(), and expand channel names
    // (2) remove the PlotlyTrace object in this.plotlyTraces
    // (3) remove element in this.data
    // (4) remove the corresponding yaxis property, i.e. "yaxis3" in this.plotLayout
    // (5) re-assign yaxis property, i.e. yaxis: "y3", in in element of this.data
    // (6) re-assign yaxis property names, i.e. yaxis3: {...}, in this.plotLayout,
    //     update overlaying property, there will be a leftover "yaxisN" property, delete it
    // (7) disconnect channel
    // (8) select the first trace
    // (9) update plot
    removeTrace = (index: number, doFlush: boolean = true) => {
        const traceName = this.getMainWidget().getChannelNames()[index];
        // (1)
        this.getMainWidget().getChannelNamesLevel0().splice(index, 1);
        this.getMainWidget().processChannelNames();
        // this.getMainWidget().getRawChannelNames().splice(index, 1);
        // this.getMainWidget().expandAndExtractChannelNames();
        // (2)
        this.x.splice(index, 1);
        this.y.splice(index, 1);
        this.yAxes.splice(index, 1);

        // (7)
        // const tcaChannel = g_widgets1.getTcaChannel(traceName);
        // By design, tcaChannel.destroy() simply destroy this channel and remove the channel name
        // from the widget's channel names list, no matter if the widget's channel names list
        // still has this channel
        // if (tcaChannel !== undefined && !this.getChannelNames().includes(traceName)) {
        // tcaChannel.destroy(this.getWidgetKey());
        // }
        if (!this.getMainWidget().getChannelNames().includes(traceName)) {
            g_widgets1.removeTcaChannel(traceName, this.getMainWidget().getWidgetKey());
        }
        // (8)
        if (this.x.length > 0) {
            this.selectTrace(0);
        }
        // (9)
        if (doFlush) {
            this.updatePlot();
        }
    };

    moveUpTrace = (index: number, doFlush: boolean = true) => {
        if (index === 0) {
            return;
        }

        const traceName = this.getChannelNames()[index];
        // (1)
        // remove it
        const mainWidget = this.getMainWidget();
        mainWidget.getChannelNamesLevel0().splice(index, 1);
        // then insert it
        mainWidget.getChannelNamesLevel0().splice(index - 1, 0, traceName);
        mainWidget.processChannelNames();
        // this.getMainWidget().expandAndExtractChannelNames();
        // (2)
        // remove it
        const x = this.x[index];
        const y = this.y[index];
        const yAxes = this.yAxes[index];
        this.x.splice(index, 1);
        this.y.splice(index, 1);
        this.yAxes.splice(index, 1);
        // insert it
        this.x.splice(index - 1, 0, x);
        this.y.splice(index - 1, 0, y);
        this.yAxes.splice(index - 1, 0, yAxes);

        // (9)
        if (doFlush) {
            this.updatePlot();
        }
    };

    moveDownTrace = (index: number, doFlush: boolean = true) => {
        if (index >= this.getChannelNames().length - 1) {
            return;
        }

        const traceName = this.getChannelNames()[index];
        // (1)
        // remove it
        const mainWidget = this.getMainWidget();
        mainWidget.getChannelNamesLevel0().splice(index, 1);
        // then insert it
        mainWidget.getChannelNamesLevel0().splice(index + 1, 0, traceName);
        mainWidget.processChannelNames();
        // this.getMainWidget().expandAndExtractChannelNames();
        // (2)
        // remove it
        const x = this.x[index];
        const y = this.y[index];
        const yAxes = this.yAxes[index];
        this.x.splice(index, 1);
        this.y.splice(index, 1);
        this.yAxes.splice(index, 1);
        // insert it
        this.x.splice(index + 1, 0, x);
        this.y.splice(index + 1, 0, y);
        this.yAxes.splice(index + 1, 0, yAxes);

        // (9)
        if (doFlush) {
            this.updatePlot();
        }
    };

    getNewColor = (): [number, number, number, number] => {
        const usedColors: [number, number, number, number][] = [];
        for (let yAxis of this.yAxes) {
            const colorStr = yAxis.lineColor;
            const colorStrArray = colorStr.replace("rgba", "").replaceAll(",", " ").replace("(", "").replace(")", "").split(" ");
            const color: number[] = [];
            for (let colorStri of colorStrArray) {
                color.push(parseInt(colorStri));
            }
            usedColors.push(color as [number, number, number, number]);
        }
        for (let color of this.traceColors) {
            let colorIsUsed = false;
            for (let usedColor of usedColors) {
                if (usedColor[0] === color[0] && usedColor[1] === color[1] && usedColor[2] === color[2] && usedColor[3] === color[3]) {
                    colorIsUsed = true;
                }
            }
            if (!colorIsUsed) {
                return color;
            }
        }
        // random color
        return [Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), 1];
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
}
