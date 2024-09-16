import { XYPlot } from "./XYPlot";
import * as React from "react";
import katex from "katex";
import { type_dbrData } from "epics-tca";
import { type_LocalChannel_data } from "../../../mainProcess/channel/LocalChannelAgent";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { calcTicks, refineTicks } from "../../global/GlobalMethods";
import { getMouseEventClientX, getMouseEventClientY, GlobalVariables, g_widgets1 } from "../../global/GlobalVariables";
import * as GlobalMethods from "../../global/GlobalMethods";
import { ElementRectangleButton } from "../../helperWidgets/SharedElements/RectangleButton";
import { Log } from "../../global/Log";

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

export class XYPlotPlot {
    _mainWidget: XYPlot;

    // plot region dimensions
    plotWidth: number;
    plotHeight: number;

    // layout
    readonly titleHeight = 50 * 0 + 20;
    readonly yAxisLabelWidth = 30;
    readonly yAxisTickWidth = 30;
    readonly xAxisLabelHeight = 30;
    readonly xAxisTickHeight = 30;
    readonly toolbarHeight = 30 * 0;
    readonly legendWidth = 170 * 0 + 30;
    // extend x direction plot area by 20% on both positive and negative directions
    readonly xPlotRangeExtension = 10;
    readonly yPlotRangeExtension = 10;
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

    forceUpdate: any;

    // showLegend: boolean = false;
    peekLegend: boolean = false;

    selectedTraceIndex: number = 0;

    // if undefined, the trace is shown
    // modified by settings, not permanent
    tracesHide: boolean[] = [];

    // multiple y axes
    yAxes: type_yAxis[] = [];

    // if there is no such a data, the element is "undefined"
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

    constructor(mainWidget: XYPlot) {
        this._mainWidget = mainWidget;
        if (this.getMainWidget().getAllText()["showFrame"] === true) {
            this.plotWidth = this.getStyle().width - this.yAxisLabelWidth - this.yAxisTickWidth - this.legendWidth;
            this.plotHeight = this.getStyle().height - this.titleHeight - this.xAxisLabelHeight - this.xAxisTickHeight - this.toolbarHeight;
        } else {
            this.plotWidth = this.getStyle().width - this.yAxisLabelWidth * 0 - this.yAxisTickWidth * 0 - this.legendWidth * 0;
            this.plotHeight = this.getStyle().height - this.titleHeight * 0 - this.xAxisLabelHeight * 0 - this.xAxisTickHeight * 0 - this.toolbarHeight * 0;
        }
        this.initXY();
    }

    // --------------------------- plot calculation ---------------------------

    mapXYsToPoints = (index: number): string => {
        let result = "";
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
            return result;
        }

        if (xData.length === 0) {
            return result;
        }


        let valXmin = this.xAxis.valMin;
        let valXmax = this.xAxis.valMax;
        let valYmin = this.yAxes[yIndex].valMin;
        let valYmax = this.yAxes[yIndex].valMax;

        // x autoScale is valid only if there is only one x-y pair
        // if (this.xAxis.autoScale && this.getMainWidget().getChannelNamesLevel0().length === 2) {
        if (this.xAxis.autoScale) {
            valXmin = Math.min(...xData);
            valXmax = Math.max(...xData);
        }

        if (this.yAxes[yIndex].autoScale) {
            valYmin = Math.min(...yData);
            valYmax = Math.max(...yData);
        }

        // extra space in x and y directions
        if (!useLog10Scale) {
            const dx = Math.abs(valXmax - valXmin) * this.xPlotRangeExtension / 100;
            const dy = Math.abs(valYmax - valYmin) * this.yPlotRangeExtension / 100;
            valXmax = valXmax + dx;
            valXmin = valXmin - dx;
            valYmax = valYmax + dy;
            valYmin = valYmin - dy;
        }

        for (let ii = 0; ii < xData.length; ii++) {
            const valX = xData[ii];
            const valY = yData[ii];
            const pointXY = this.mapXYToPoint(index, [valX, valY], [valXmin, valXmax, valYmin, valYmax]);
            if (pointXY === undefined || isNaN(pointXY[0]) || isNaN(pointXY[1])) {
                continue;
            }
            const [pointX, pointY] = pointXY;
            result = result + `${pointX}` + "," + `${pointY} `;
        }
        return result;
    };

    mapXYsToPointsArray = (index: number): [number, number][] => {
        let result: [number, number][] = [];
        // x and y data are odd and even indices
        let xData = this.xy[index];
        let yData = this.xy[index + 1];


        let yIndex = this.getYIndex(index);

        let useLog10Scale = false;
        if (this.yAxes[yIndex] !== undefined) {
            useLog10Scale = this.yAxes[yIndex]["displayScale"] === "Log10" ? true : false;
        }

        // if there is no xData (undefined) or the x PV is empty ("")
        if (this.getMainWidget().getChannelNames()[index] === "") {
            const dataSize = yData.length;
            xData = [...Array(dataSize).keys()];
        }
        // xData and yData must be same size
        if (xData.length !== yData.length) {
            return result;
        }

        if (xData.length === 0) {
            return result;
        }

        let valXmin = this.xAxis.valMin;
        let valXmax = this.xAxis.valMax;
        let valYmin = this.yAxes[yIndex].valMin;
        let valYmax = this.yAxes[yIndex].valMax;

        // x autoScale is valid only if there is only one x-y pair
        // if (this.xAxis.autoScale && this.getMainWidget().getChannelNamesLevel0().length === 2) {
        if (this.xAxis.autoScale) {
            valXmin = Math.min(...xData);
            valXmax = Math.max(...xData);
        }

        if (this.yAxes[yIndex].autoScale) {
            valYmin = Math.min(...yData);
            valYmax = Math.max(...yData);
        }

        // extra space in x and y directions
        if (!useLog10Scale) {
            const dx = Math.abs(valXmax - valXmin) * this.xPlotRangeExtension / 100;
            const dy = Math.abs(valYmax - valYmin) * this.yPlotRangeExtension / 100;
            valXmax = valXmax + dx;
            valXmin = valXmin - dx;
            valYmax = valYmax + dy;
            valYmin = valYmin - dy;
        }

        for (let ii = 0; ii < xData.length; ii++) {
            const valX = xData[ii];
            const valY = yData[ii];
            const pointXY = this.mapXYToPoint(index, [valX, valY], [valXmin, valXmax, valYmin, valYmax]);
            if (pointXY === undefined || isNaN(pointXY[0]) || isNaN(pointXY[1])) {
                continue;
            }
            // const [pointX, pointY] = pointXY;
            // result = result + `${pointX}` + "," + `${pointY} `;
            result.push(pointXY);
        }
        return result;
    };

    mapXYToPoint = (
        index: number,
        [valX, valY]: [number, number],
        [valXmin, valXmax, valYmin, valYmax]: [number, number, number, number]
    ): [number, number] => {

        let yIndex = this.getYIndex(index);
        let useLog10Scale = false;
        if (this.yAxes[yIndex] !== undefined) {
            useLog10Scale = this.yAxes[yIndex]["displayScale"] === "Log10" ? true : false;
        }

        if (this.yAxes[yIndex] === undefined) {
            return [0, 0];
            // this.yAxes[yIndex] = this.generateDefaultYAxis(yIndex);
        }
        const pointXmin = 0;
        const pointXmax = this.plotWidth;
        const pointYmin = 0;
        const pointYmax = this.plotHeight;

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

        const pointX = pointXmin + ((pointXmax - pointXmin) / (valXmax - valXmin)) * (valX - valXmin);
        const pointY = pointYmax - ((pointYmax - pointYmin) / (valYmax - valYmin)) * (valY - valYmin);
        return [pointX, pointY];
    };

    // pointX, pointY are the coordinates inside Plot element
    mapPointToXY = (index: number,
        [pointX, pointY]: [number, number],
        [valXmin, valXmax, valYmin, valYmax]: [number, number, number, number]
    ): [number, number] => {
        if (index >= this.getMainWidget().getChannelNames().length) {
            return [0, 0];
        }
        let xData = this.xy[index];
        let yData = this.xy[index + 1];


        let yIndex = this.getYIndex(index);
        let useLog10Scale = false;
        if (this.yAxes[yIndex] !== undefined) {
            useLog10Scale = this.yAxes[yIndex]["displayScale"] === "Log10" ? true : false;
        }

        const pointXmin = 0;
        const pointXmax = this.plotWidth;
        const pointYmin = 0;
        const pointYmax = this.plotHeight;

        if (this.xAxis.autoScale) {
            valXmin = Math.min(...xData);
            valXmax = Math.max(...xData);
        }

        if (this.yAxes[yIndex].autoScale) {
            valYmin = Math.min(...yData);
            valYmax = Math.max(...yData);
        }

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

    // --------------------------- element ------------------------------------

    _Element = () => {
        const showFrame = this.getMainWidget().getAllText()["showFrame"];
        if (showFrame === true) {
            this.plotWidth = this.getStyle().width - this.yAxisLabelWidth - this.yAxisTickWidth - this.legendWidth;
            this.plotHeight = this.getStyle().height - this.titleHeight - this.xAxisLabelHeight - this.xAxisTickHeight - this.toolbarHeight;
        } else {
            this.plotWidth = this.getStyle().width;
            this.plotHeight = this.getStyle().height;
        }

        // const [title, setTitle] = React.useState(this.getText().title);

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
                    alignItems: "center",
                    overflow: "visible",
                }}
            >
                {/* extra space on top, not the title */}
                {showFrame ? <this._ElementTitle></this._ElementTitle> : null}
                <div
                    style={{
                        height: showFrame ? `${this.getStyle().height - this.titleHeight - this.toolbarHeight}px` : `${this.getStyle().height}px`,
                        width: `100%`,
                        display: "inline-flex",
                        flexFlow: "row",
                        justifyContent: "flex-start",
                        alignItems: "flex-start",
                    }}
                >
                    <div
                        style={{
                            width: showFrame ? `${this.getStyle().width - this.legendWidth}px` : `${this.getStyle().width}px`,
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
                            {showFrame ? <this._ElementYLabel></this._ElementYLabel> : null}
                            {/* y axis ticks */}
                            {showFrame ? <this._ElementYTicks></this._ElementYTicks> : null}
                            {/* plot */}
                            <this._ElementPlot></this._ElementPlot>
                        </div>
                        {showFrame ?
                            <>
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
                                    <div
                                        style={{
                                            position: "relative",
                                            width: `100%`,
                                            height: `${this.xAxisLabelHeight}px`,
                                            display: "inline-flex",
                                            flexFlow: "row",
                                            justifyContent: "flex-start",
                                            alignItems: "center",
                                        }}
                                    >
                                        {/* must be under the ElementControls */}
                                        <this._ElementCursorPosition></this._ElementCursorPosition>
                                        <this._ElementXLabel></this._ElementXLabel>
                                        <this._ElementControls></this._ElementControls>
                                    </div>
                                </div>
                            </> : null}
                    </div>
                    {/* legend */}
                    {/* <this._ElementLegend></this._ElementLegend> */}
                </div>
                {/* control area */}
                {/* <this._ElementControls></this._ElementControls> */}
            </div>
        );
    };

    // ----------------------------- elements components -----------------------

    _ElementTitle = () => {
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

    _ElementXYTickLines = () => {
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
                {this.calcXTicks().map((tickValue: number, index: number) => {
                    return (
                        <this._ElementXtickLine
                            key={`x-${tickValue}-${index}`}
                            tickValue={tickValue}
                            lineIndex={this.selectedTraceIndex}
                        ></this._ElementXtickLine>
                    );
                })}
                {this.calcYTicks(this.selectedTraceIndex).map((tickValue: number, index: number) => {
                    return (
                        <this._ElementYtickLine
                            key={`y-${tickValue}-${index}`}
                            tickValue={tickValue}
                            lineIndex={this.selectedTraceIndex}
                        ></this._ElementYtickLine>
                    );
                })}
            </svg>
        );
    };

    calcXTicks = () => {
        try {
            let valMin = this.xAxis["valMin"];
            let valMax = this.xAxis["valMax"];
            // auto scale
            // if (this.xAxis["autoScale"] && this.getChannelNames().length <= 2) {
            if (this.xAxis["autoScale"]) {
                const xData = this.xy[0];
                const yData = this.xy[1];
                if (xData !== undefined && yData !== undefined && yData.length > 0) {
                    if (xData.length > 0) {
                        valMin = Math.min(...xData);
                        valMax = Math.max(...xData);
                    } else {
                        valMin = 0;
                        valMax = yData.length;
                    }
                }
            }
            // manual scale
            else {
                // do nothing
            }

            // extra space in x direction
            // there is no tick in the extra space
            const dx = Math.abs(valMax - valMin) * this.xPlotRangeExtension / 100;
            valMax = valMax + dx;
            valMin = valMin - dx;

            return calcTicks(valMin, valMax, this.xAxis["numGrids"] + 1, "linear");
        } catch (e) {
            return calcTicks(0, 10, 5 + 1, "linear");
        }
    };
    calcYTicks = (yIndex: number) => {
        try {
            const yAxis = this.yAxes[yIndex];
            let valMin = yAxis["valMin"];
            let valMax = yAxis["valMax"];
            // auto scale
            if (yAxis["autoScale"]) {
                const xData = this.xy[2 * yIndex];
                const yData = this.xy[2 * yIndex + 1];
                if (xData !== undefined && yData !== undefined && yData.length > 0) {
                    valMin = Math.min(...yData);
                    valMax = Math.max(...yData);
                }
            }
            // manual scale
            else {
                // do nothing
            }
            // extra space in y direction
            const dy = Math.abs(valMax - valMin) * this.yPlotRangeExtension / 100;
            valMax = valMax + dy;
            valMin = valMin - dy;

            return calcTicks(valMin, valMax, this.yAxes[yIndex]["numGrids"] + 1, "linear");
        } catch (e) {
            return calcTicks(0, 10, 5 + 1, "linear");
        }
    };


    _ElementXtickLine = ({ tickValue, lineIndex }: any) => {
        if (this.yAxes[lineIndex] === undefined) {
            return null;
        }

        let valXmin = this.xAxis.valMin;
        let valXmax = this.xAxis.valMax;
        let valYmin = this.yAxes[lineIndex].valMin;
        let valYmax = this.yAxes[lineIndex].valMax;

        if (this.xAxis["autoScale"]) {
            const xData = this.xy[lineIndex * 2];
            if (xData !== undefined && xData.length > 0) {
                valXmin = Math.min(...xData);
                valXmax = Math.max(...xData);
            }
        }
        // extra space in x and y directions
        const dx = Math.abs(valXmax - valXmin) * this.xPlotRangeExtension / 100;
        const dy = Math.abs(valYmax - valYmin) * this.yPlotRangeExtension / 100;
        valXmax = valXmax + dx;
        valXmin = valXmin - dx;
        valYmax = valYmax + dy;
        valYmin = valYmin - dy;

        const XYPoint1 = this.mapXYToPoint(lineIndex, [tickValue, valYmin], [valXmin, valXmax, valYmin, valYmax]);
        const XYPoint2 = this.mapXYToPoint(lineIndex, [tickValue, valYmax], [valXmin, valXmax, valYmin, valYmax]);
        const XYPoint3 = [XYPoint1[0], XYPoint1[1] - 10];
        const XYPoint4 = [XYPoint2[0], XYPoint2[1] + 10];
        return (
            <>
                {this.xAxis["showGrid"] ? (
                    <polyline
                        points={`${XYPoint1} ${XYPoint2}`}
                        strokeWidth="1"
                        stroke="rgb(190,190,190)"
                        strokeDasharray={"5, 5"}
                        fill="none"
                    ></polyline>
                ) : null}
                <polyline points={`${XYPoint1} ${XYPoint3}`} strokeWidth="2" stroke="rgb(0,0,0)" fill="none"></polyline>
                <polyline points={`${XYPoint2} ${XYPoint4}`} strokeWidth="2" stroke="rgb(0,0,0)" fill="none"></polyline>
            </>
        );
    };

    _ElementYtickLine = ({ tickValue, lineIndex }: any) => {
        if (this.yAxes[lineIndex] === undefined) {
            return null;
        }

        let valXmin = this.xAxis.valMin;
        let valXmax = this.xAxis.valMax;
        let valYmin = this.yAxes[lineIndex].valMin;
        let valYmax = this.yAxes[lineIndex].valMax;

        if (this.yAxes[lineIndex]["autoScale"]) {
            const yData = this.xy[lineIndex * 2 + 1];
            if (yData !== undefined && yData.length > 0) {
                valYmin = Math.min(...yData);
                valYmax = Math.max(...yData);
            }
        }

        // extra space in x and y directions
        const dx = Math.abs(valXmax - valXmin) * this.xPlotRangeExtension / 100;
        const dy = Math.abs(valYmax - valYmin) * this.yPlotRangeExtension / 100;
        valXmax = valXmax + dx;
        valXmin = valXmin - dx;
        valYmax = valYmax + dy;
        valYmin = valYmin - dy;

        const XYPoint1 = this.mapXYToPoint(
            lineIndex,
            // [this.xAxis.valMin, this.yAxes[lineIndex].ticks[tickIndex]],
            [valXmin, tickValue],
            [valXmin, valXmax, valYmin, valYmax]
        );
        const XYPoint2 = this.mapXYToPoint(
            lineIndex,
            // [this.xAxis.valMax, this.yAxes[lineIndex].ticks[tickIndex]],
            [valXmax, tickValue],
            [valXmin, valXmax, valYmin, valYmax]
        );
        const XYPoint3 = [XYPoint1[0] + 10, XYPoint1[1]];
        const XYPoint4 = [XYPoint2[0] - 10, XYPoint2[1]];

        return (
            <>
                {this.yAxes[lineIndex]["showGrid"] ? (
                    <polyline
                        points={`${XYPoint1} ${XYPoint2}`}
                        strokeWidth="1"
                        stroke="rgb(190,190,190)"
                        strokeDasharray={"5, 5"}
                        fill="none"
                    ></polyline>
                ) : null}
                <polyline points={`${XYPoint1} ${XYPoint3}`} strokeWidth="2" stroke="rgb(0,0,0)" fill="none"></polyline>
                <polyline points={`${XYPoint2} ${XYPoint4}`} strokeWidth="2" stroke="rgb(0,0,0)" fill="none"></polyline>
            </>
        );
    };

    _ElementLine = ({ index }: any) => {
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
                {this.yAxes[this.getYIndex(index)]["lineStyle"] === "none" ? null : (
                    <polyline
                        points={this.mapXYsToPoints(index)}
                        strokeWidth={`${this.yAxes[this.getYIndex(index)].lineWidth}`}
                        strokeDasharray={this.calcStrokeDasharray(index)}
                        stroke={this.yAxes[this.getYIndex(index)].lineColor}
                        fill="none"
                    ></polyline>
                )}

                {this.mapXYsToPointsArray(index).map((pointXY: [number, number]) => {
                    const pointType = this.yAxes[this.getYIndex(index)]["pointType"];
                    const pointSize = this.yAxes[this.getYIndex(index)]["pointSize"];
                    if (pointType === "circle") {
                        return (
                            <circle
                                key={`circle-${pointXY}`}
                                cx={pointXY[0]}
                                cy={pointXY[1]}
                                r={pointSize / 2}
                                fill={this.yAxes[this.getYIndex(index)].lineColor}
                            ></circle>
                        );
                    } else if (pointType === "square") {
                        return (
                            <rect
                                key={`rect-${pointXY}`}
                                x={pointXY[0] - pointSize / 2}
                                y={pointXY[1] - pointSize / 2}
                                width={pointSize}
                                height={pointSize}
                                fill={this.yAxes[this.getYIndex(index)].lineColor}
                            ></rect>
                        );
                    } else if (pointType === "x") {
                        const pointSize = this.yAxes[this.getYIndex(index)]["pointSize"];
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
                                <polyline
                                    points={pointsA}
                                    strokeWidth={2}
                                    stroke={this.yAxes[this.getYIndex(index)].lineColor}
                                    fill="none"
                                ></polyline>
                                <polyline
                                    points={pointsB}
                                    strokeWidth={2}
                                    stroke={this.yAxes[this.getYIndex(index)].lineColor}
                                    fill="none"
                                ></polyline>
                            </>
                        );
                    } else if (pointType === "asterisk") {
                        const pointSize = this.yAxes[this.getYIndex(index)]["pointSize"];
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
                                <polyline
                                    points={pointsA}
                                    strokeWidth={2}
                                    stroke={this.yAxes[this.getYIndex(index)].lineColor}
                                    fill="none"
                                ></polyline>
                                <polyline
                                    points={pointsB}
                                    strokeWidth={2}
                                    stroke={this.yAxes[this.getYIndex(index)].lineColor}
                                    fill="none"
                                ></polyline>
                                <polyline
                                    points={pointsC}
                                    strokeWidth={2}
                                    stroke={this.yAxes[this.getYIndex(index)].lineColor}
                                    fill="none"
                                ></polyline>
                            </>
                        );
                    } else if (pointType === "diamond") {
                        return (
                            <rect
                                key={`diamond-${pointXY}`}
                                transform={`rotate(45 ${pointXY[0]} ${pointXY[1]})`}
                                x={pointXY[0] - pointSize / 2}
                                y={pointXY[1] - pointSize / 2}
                                width={pointSize}
                                height={pointSize}
                                fill={this.yAxes[this.getYIndex(index)].lineColor}
                            ></rect>
                        );
                    } else if (pointType === "triangle") {
                        const pointSize = this.yAxes[this.getYIndex(index)]["pointSize"];
                        const point1X = pointXY[0];
                        const point1Y = pointXY[1] - pointSize / 1.717;
                        const point2X = pointXY[0] + pointSize / 2;
                        const point2Y = pointXY[1] + pointSize / 1.717 / 2;
                        const point3X = pointXY[0] - pointSize / 2;
                        const point3Y = pointXY[1] + pointSize / 1.717 / 2;
                        const points = `${point1X},${point1Y} ${point2X},${point2Y} ${point3X},${point3Y}`;
                        return <polyline key={`triangle-${pointXY}`} points={points} fill={this.yAxes[this.getYIndex(index)].lineColor}></polyline>;
                    } else if (pointType === "none") {
                        return null;
                    } else {
                        return null;
                    }
                })}
            </svg>
        );
    };

    calcStrokeDasharray = (index: number) => {
        const yIndex = this.getYIndex(index);
        const yAxis = this.yAxes[yIndex];
        const lineWidth = yAxis["lineWidth"];
        switch (yAxis["lineStyle"]) {
            case "solid":
                return ``;
            case "dotted":
                return `${lineWidth},${lineWidth}`;
            case "dashed":
                return `${4 * lineWidth},${2 * lineWidth}`;
            case "dash-dot":
                return `${4 * lineWidth},${lineWidth},${lineWidth},${lineWidth}`;
            case "dash-dot-dot":
                return `${4 * lineWidth},${lineWidth},${lineWidth},${lineWidth},${lineWidth},${lineWidth}`;
            default:
                return "";
        }
    };

    getYIndex = (index: number) => {
        return Math.floor((index + 0.01) / 2);
    };

    _ElementXTicks = () => {
        const elementRef = React.useRef<any>(null);
        const xTicks = this.calcXTicks();
        const refinedTicks = refineTicks(xTicks, this.getMainWidget().getAllStyle()["fontSize"] * 0.5, elementRef, "horizontal");

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
                ref={elementRef}
            >
                {xTicks.map((value: number, tickIndex: number) => {
                    let valXmin = this.xAxis.valMin;
                    let valXmax = this.xAxis.valMax;
                    let valYmin = 0;
                    let valYmax = 100;

                    if (this.xAxis["autoScale"]) {
                        const xData = this.xy[this.selectedTraceIndex * 2];
                        if (xData !== undefined) {
                            if (xData.length > 0) {
                                valXmin = Math.min(...xData);
                                valXmax = Math.max(...xData);
                            } else {
                                const yData = this.xy[this.selectedTraceIndex * 2 + 1];
                                if (yData.length > 0) {
                                    valXmin = 0;
                                    valXmax = yData.length;
                                }
                            }
                        }
                    }

                    // extra space in x and y directions
                    const dx = Math.abs(valXmax - valXmin) * this.xPlotRangeExtension / 100;
                    const dy = Math.abs(valYmax - valYmin) * this.yPlotRangeExtension / 100;
                    valXmax = valXmax + dx;
                    valXmin = valXmin - dx;
                    valYmax = valYmax + dy;
                    valYmin = valYmin - dy;

                    const [pointX, pointY] = this.mapXYToPoint(0, [value, 1], [valXmin, valXmax, valYmin, valYmax]);
                    return (
                        <div
                            key={`${value}-${tickIndex}`}
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
                            {/* {this.xAxis.ticksText[tickIndex]} */}
                            {/* {`${value}`} */}
                            {refinedTicks[tickIndex]}
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
                {this.convertLatexSourceToDiv(this.xAxis.label)}
            </div>
        );
    };

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

    _ElementYTicks = () => {
        // the ticks area
        const elementRef = React.useRef<any>(null);

        const refinedTicks = refineTicks(this.calcYTicks(this.selectedTraceIndex), this.getMainWidget().getAllStyle()["fontSize"] * 0.5, elementRef, "vertical");

        return (
            <div
                ref={elementRef}
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
                {/* {this.yAxes[this.selectedTraceIndex]?.ticks.map((value: number, tickIndex: number) => { */}
                {this.calcYTicks(this.selectedTraceIndex).map((value: number, tickIndex: number) => {
                    if (this.yAxes.length < 1) {
                        return null;
                    }
                    let valXmin = 0;
                    let valXmax = 100;
                    let valYmin = this.yAxes[this.selectedTraceIndex]["valMin"];
                    let valYmax = this.yAxes[this.selectedTraceIndex]["valMax"];

                    if (this.yAxes[this.selectedTraceIndex]["autoScale"]) {
                        const yData = this.xy[this.selectedTraceIndex * 2 + 1];
                        if (yData !== undefined && yData.length > 0) {
                            valYmin = Math.min(...yData);
                            valYmax = Math.max(...yData);
                        }
                    }
                    // extra space in x and y directions
                    const dx = Math.abs(valXmax - valXmin) * this.xPlotRangeExtension / 100;
                    const dy = Math.abs(valYmax - valYmin) * this.yPlotRangeExtension / 100;
                    valXmax = valXmax + dx;
                    valXmin = valXmin - dx;
                    valYmax = valYmax + dy;
                    valYmin = valYmin - dy;

                    const [pointX, pointY] = this.mapXYToPoint(this.selectedTraceIndex, [1, value], [valXmin, valXmax, valYmin, valYmax]);
                    return (
                        <div
                            key={`yticks-${value}-${tickIndex}`}
                            style={{
                                position: "absolute",
                                // right: "12px",
                                right: parseInt(this.getMainWidget().getAllStyle()["fontSize"]) * 0.75,
                                top: `${pointY}px`,
                                // width: "100%",
                                transform: "rotate(-90deg)",
                                width: 0,
                                height: "0px",
                                overflow: "visible",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: this.yAxes[this.selectedTraceIndex]["lineColor"],
                            }}
                        >
                            {/* {this.yAxes[this.selectedTraceIndex]?.ticksText[tickIndex]} */}
                            {/* {`${value}`} */}
                            {refinedTicks[tickIndex]}
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
                    {this.yAxes[this.selectedTraceIndex] === undefined ? "" : this.convertLatexSourceToDiv(this.yAxes[this.selectedTraceIndex].label)}
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

    _ElementLegends = () => {
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
            <>
                <line
                    x1="0"
                    y1={svgHeight / 2 + (0 * lineWidth) / 2}
                    x2={svgWidth}
                    y2={svgHeight / 2 + (0 * lineWidth) / 2}
                    strokeWidth={lineWidth}
                    stroke={color}
                    strokeDasharray={strokeDasharray}
                ></line>
            </>
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
                                navigator.clipboard.writeText(JSON.stringify(result));
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

    // -------------------------------- settings page ------------------------------------------------

    getElementSettings = () => {
        if (g_widgets1.isEditing()) {
            return null;
        } else {
            return <this._ElementSettings></this._ElementSettings>;
        }
    };

    _ElementSettingLine = ({ children }: any) => {
        const elementRef = React.useRef<any>(null);
        return (
            <div
                ref={elementRef}
                style={{
                    width: "100%",
                    display: "inline-flex",
                    flexDirection: "row",
                    justifyContent: 'flex-start',
                    alignItems: "center",
                }}
                onMouseEnter={() => {
                    if (elementRef.current !== null) {
                        elementRef.current.style["backgroundColor"] = "rgba(230, 230, 230, 1)";
                    }
                }}
                onMouseLeave={() => {
                    if (elementRef.current !== null) {
                        elementRef.current.style["backgroundColor"] = "rgba(230, 230, 230, 0)";
                    }
                }}
            >
                {children}
            </div>
        )
    }

    _ElementSettingCell = ({ children, width }: any) => {
        return (<div
            style={{
                width: width,
                display: "inline-flex",
                flexDirection: "row",
                justifyContent: 'flex-start',
                alignItems: "center",
                height: "100%",
            }}
        >
            {children}
        </div>)
    }

    _ElementSettings = () => {
        return (
            <div
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: "100%",
                    height: "100%",
                    backgroundColor: "white",
                    overflowY: "scroll",
                    padding: 15,
                    display: "inline-flex",
                    justifyContent: "flex-start",
                    alignItems: "flex-start",
                    boxSizing: "border-box",
                    flexDirection: "column",
                    border: "solid 1px rgba(0,0,0,1)",
                    // always use default fonts
                    fontFamily: GlobalVariables.defaultFontFamily,
                    fontSize: GlobalVariables.defaultFontSize,
                    fontStyle: GlobalVariables.defaultFontStyle,
                    fontWeight: GlobalVariables.defaultFontWeight,
                }}
            >

                <this._ElementSettingLine>
                    <this._ElementSettingsSectionHead>
                        X Axis
                    </this._ElementSettingsSectionHead>
                </this._ElementSettingLine>
                <this._ElementSettingsXValMin></this._ElementSettingsXValMin>
                <this._ElementSettingsXValMax></this._ElementSettingsXValMax>
                <this._ElementSettingsXAutoScale></this._ElementSettingsXAutoScale>
                <this._ElementSettingsXShowGrid></this._ElementSettingsXShowGrid>
                <this._ElementSettingsXNumGrids></this._ElementSettingsXNumGrids>
                {/* y axes */}
                {this.yAxes.map((yAxis: type_yAxis, yIndex: number) => {
                    return (
                        <>
                            <this._ElementSettingLine>
                                <this._ElementSettingsSectionHead>
                                    Trace {this.convertLatexSourceToDiv(yAxis["label"])}
                                </this._ElementSettingsSectionHead>
                            </this._ElementSettingLine>

                            <this._ElementSettingsYValMin key={`${yAxis["label"]}-${yIndex}-min`} yIndex={yIndex}></this._ElementSettingsYValMin>
                            <this._ElementSettingsYValMax key={`${yAxis["label"]}-${yIndex}-max`} yIndex={yIndex}></this._ElementSettingsYValMax>
                            <this._ElementSettingsYAutoScale
                                key={`${yAxis["label"]}-${yIndex}-autoscale`}
                                yIndex={yIndex}
                            ></this._ElementSettingsYAutoScale>
                            <this._ElementSettingsYShowGrid
                                key={`${yAxis["label"]}-${yIndex}-autoscale`}
                                yIndex={yIndex}
                            ></this._ElementSettingsYShowGrid>
                            <this._ElementSettingsYNumGrids
                                key={`${yAxis["label"]}-${yIndex}-numgrids`}
                                yIndex={yIndex}
                            ></this._ElementSettingsYNumGrids>
                            <this._ElementSettingsYHideTrace
                                key={`${yAxis["label"]}-${yIndex}-hidetrace`}
                                yIndex={yIndex}
                            ></this._ElementSettingsYHideTrace>
                        </>
                    );
                })}
                {/* <this._ElementSettingLine> */}
                <this._ElementSettingsOKButton></this._ElementSettingsOKButton>
                {/* </this._ElementSettingLine> */}
            </div>
        );
    };

    _styleInput = {
        width: "55%",
        border: "solid 1px rgba(0,0,0,0)",
        outline: "none",
        borderRadius: 0,
        backgroundColor: "rgba(255, 255, 255, 0)",
        // padding: 0,
        // margin: 0,
    };

    _ElementSettingsOKButton = () => {
        return (
            <div style={{
                display: "inline-flex",
                width: "100%",
                justifyContent: "center",
                alignItems: "center",
            }}>
                <ElementRectangleButton
                    marginTop={10}
                    marginBottom={10}
                    handleClick={() => {
                        this.getMainWidget().showSettings = false;
                        g_widgets1.addToForceUpdateWidgets(this.getMainWidget().getWidgetKey());
                        g_widgets1.addToForceUpdateWidgets("GroupSelection2");
                        g_flushWidgets();
                    }
                    }>
                    OK
                </ElementRectangleButton>
            </div >

        )
    }

    _ElementSettingsSectionHead = ({ children }: any) => {
        return (
            <div style={{
                backgroundColor: "rgba(210, 210, 210, 1)",
                width: "100%",
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",
                boxSizing: "border-box",
                paddingTop: 5,
                paddingBottom: 5,
            }}>
                <b>{children}</b>
            </div>

        )
    }

    _ElementInput = ({ children, value, onChange, onBlur, onFocus }: any) => {
        const elementRef = React.useRef<any>(null);
        return (
            <input
                ref={elementRef}
                style={{
                    backgroundColor: 'rgba(0, 0, 0, 0)',
                    width: "100%",
                    height: "100%",
                    padding: 0,
                    margin: 0,
                    /* explicit inherits */
                    fontSize: "inherit",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    boxSizing: "border-box",
                    border: "solid 1px rgba(0,0,0,0)",
                    borderRadius: 0,
                    outline: "none",
                }}
                value={value}
                type={"text"}
                onChange={(event: any) => {
                    event.preventDefault();
                    if (onChange !== undefined) {
                        onChange(event);
                    }
                }}
                onBlur={(event: any) => {
                    event.preventDefault();
                    if (onBlur !== undefined) {
                        onBlur(event);
                    }
                    if (elementRef.current !== null) {
                        elementRef.current.style["border"] = "solid 1px rgba(0,0,0,0)";
                        elementRef.current.style["backgroundColor"] = "rgba(255,255,255,0)";
                    }
                }}
                onFocus={(event: any) => {
                    event.preventDefault();
                    if (onFocus !== undefined) {
                        onFocus(event);
                    }
                    if (elementRef.current !== null) {
                        elementRef.current.style["border"] = "solid 1px rgba(0,0,0,1)";
                        elementRef.current.style["backgroundColor"] = "rgba(255,255,255,1)";
                    }
                }}
                onMouseEnter={() => {
                    if (elementRef.current !== null) {
                        elementRef.current.style["border"] = "solid 1px rgba(0,0,0,1)";
                        elementRef.current.style["backgroundColor"] = "rgba(255,255,255,1)";
                    }
                }}
                onMouseLeave={() => {
                    if (elementRef.current !== null && document.activeElement !== elementRef.current) {
                        elementRef.current.style["border"] = "solid 1px rgba(0,0,0,0)";
                        elementRef.current.style["backgroundColor"] = "rgba(255,255,255,0)";
                    }
                }}
            >
                {children}
            </input>
        )
    }

    _ElementSettingsXValMin = () => {
        // always string
        const [valMin, setValMin] = React.useState(`${this.xAxis["valMin"]}`);
        const elementRefInput = React.useRef<any>(null);
        return (
            <this._ElementSettingLine>
                <this._ElementSettingCell width={"30%"}>
                    Min:
                </this._ElementSettingCell>
                <this._ElementSettingCell width={"70%"}>
                    <form
                        spellCheck={false}
                        onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                            event.preventDefault();
                            const orig = this.xAxis["valMin"];
                            const valMinNum = parseFloat(valMin);
                            if (!isNaN(valMinNum)) {
                                this.xAxis["valMin"] = valMinNum;
                                setValMin(`${valMinNum}`);
                                g_widgets1.addToForceUpdateWidgets(this.getMainWidget().getWidgetKey());
                                g_widgets1.addToForceUpdateWidgets("GroupSelection2");
                                g_flushWidgets();
                            } else {
                                setValMin(`${orig}`);
                            }
                        }}
                    >
                        <this._ElementInput
                            value={valMin}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                const newVal = event.target.value;
                                setValMin(newVal);
                            }}
                            onBlur={(event: any) => {
                                const orig = `${this.xAxis["valMin"]}`;
                                if (orig !== valMin) {
                                    setValMin(orig);
                                }
                            }}
                        ></this._ElementInput>
                    </form>
                </this._ElementSettingCell>

            </this._ElementSettingLine>
        );
    };

    _ElementSettingsXValMax = () => {
        // always string
        const [valMax, setValMax] = React.useState(`${this.xAxis["valMax"]}`);
        const elementRefInput = React.useRef<any>(null);
        return (
            <this._ElementSettingLine>
                <this._ElementSettingCell width={"30%"}>
                    Max:
                </this._ElementSettingCell>
                <this._ElementSettingCell width={"70%"}>
                    <form
                        spellCheck={false}
                        onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                            event.preventDefault();
                            const orig = this.xAxis["valMax"];
                            const valMaxNum = parseFloat(valMax);
                            if (!isNaN(valMaxNum)) {
                                this.xAxis["valMax"] = valMaxNum;
                                setValMax(`${valMaxNum}`);
                                g_widgets1.addToForceUpdateWidgets(this.getMainWidget().getWidgetKey());
                                g_widgets1.addToForceUpdateWidgets("GroupSelection2");
                                g_flushWidgets();
                            } else {
                                setValMax(`${orig}`);
                            }
                        }}
                    >
                        <this._ElementInput
                            value={valMax}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                const newVal = event.target.value;
                                setValMax(newVal);
                            }}
                            onBlur={(event: any) => {
                                const orig = `${this.xAxis["valMax"]}`;
                                if (orig !== valMax) {
                                    setValMax(orig);
                                }
                            }}
                        ></this._ElementInput>
                    </form>
                </this._ElementSettingCell>

            </this._ElementSettingLine>
        );
    };

    _ElementSettingsXAutoScale = () => {
        // boolean
        const [autoScale, setAutoScale] = React.useState<boolean>(this.xAxis["autoScale"]);
        return (
            <this._ElementSettingLine>
                <this._ElementSettingCell width={"30%"}>
                    Auto scale:
                </this._ElementSettingCell>
                <this._ElementSettingCell width={"70%"}>
                    <form
                        spellCheck={false}
                        onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                            this.xAxis["autoScale"] = autoScale;

                            g_widgets1.addToForceUpdateWidgets(this.getMainWidget().getWidgetKey());
                            g_widgets1.addToForceUpdateWidgets("GroupSelection2");

                            g_flushWidgets();
                        }}
                    >
                        <input
                            type="checkbox"
                            // uncheck if there are more than one traces
                            // checked={this.getMainWidget().getChannelNamesLevel0().length > 2 ? false : autoScale}
                            checked={autoScale}
                            // greg out when there are more than one traces
                            // disabled={this.getMainWidget().getChannelNamesLevel0().length > 2 ? true : false}
                            onChange={(event: any) => {
                                this.xAxis["autoScale"] = !autoScale;

                                g_widgets1.addToForceUpdateWidgets(this.getMainWidget().getWidgetKey());
                                g_widgets1.addToForceUpdateWidgets("GroupSelection2");

                                g_flushWidgets();
                                setAutoScale((prevVal: boolean) => {
                                    return !prevVal;
                                });
                            }}
                        />
                    </form>
                </this._ElementSettingCell>

            </this._ElementSettingLine>
        );
    };

    _ElementSettingsYValMin = ({ yIndex }: any) => {
        // always string
        const [valMin, setValMin] = React.useState(`${this.yAxes[yIndex]["valMin"]}`);
        const elementRefInput = React.useRef<any>(null);
        return (
            <this._ElementSettingLine>
                <this._ElementSettingCell width={"30%"}>
                    Min:
                </this._ElementSettingCell>
                <this._ElementSettingCell width={"70%"}>
                    <form
                        spellCheck={false}
                        onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                            event.preventDefault();
                            const orig = this.yAxes[yIndex]["valMin"];
                            const valMinNum = parseFloat(valMin);
                            if (!isNaN(valMinNum)) {
                                this.yAxes[yIndex]["valMin"] = valMinNum;
                                setValMin(`${valMinNum}`);
                                g_widgets1.addToForceUpdateWidgets(this.getMainWidget().getWidgetKey());
                                g_widgets1.addToForceUpdateWidgets("GroupSelection2");
                                g_flushWidgets();
                            } else {
                                setValMin(`${orig}`);
                            }
                        }}
                    >
                        <this._ElementInput
                            value={valMin}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                const newVal = event.target.value;
                                setValMin(newVal);
                            }}
                            onBlur={(event: any) => {
                                const orig = `${this.yAxes[yIndex]["valMin"]}`;
                                if (orig !== valMin) {
                                    setValMin(orig);
                                }
                            }}
                        ></this._ElementInput>
                    </form>
                </this._ElementSettingCell>

            </this._ElementSettingLine>
        );
    };

    _ElementSettingsYValMax = ({ yIndex }: any) => {
        // always string
        const [valMax, setValMax] = React.useState(`${this.yAxes[yIndex]["valMax"]}`);
        const elementRefInput = React.useRef<any>(null);
        return (
            <this._ElementSettingLine>
                <this._ElementSettingCell width={"30%"}>
                    Max:
                </this._ElementSettingCell>
                <this._ElementSettingCell width={"70%"}>
                    <form
                        spellCheck={false}
                        onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                            event.preventDefault();
                            const orig = this.yAxes[yIndex]["valMax"];
                            const valMaxNum = parseFloat(valMax);
                            if (!isNaN(valMaxNum)) {
                                this.yAxes[yIndex]["valMax"] = valMaxNum;
                                setValMax(`${valMaxNum}`);
                                g_widgets1.addToForceUpdateWidgets(this.getMainWidget().getWidgetKey());
                                g_widgets1.addToForceUpdateWidgets("GroupSelection2");
                                g_flushWidgets();
                            } else {
                                setValMax(`${orig}`);
                            }
                        }}
                    >
                        <this._ElementInput
                            value={valMax}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                const newVal = event.target.value;
                                setValMax(newVal);
                            }}
                            onBlur={(event: any) => {
                                const orig = `${this.yAxes[yIndex]["valMax"]}`;
                                if (orig !== valMax) {
                                    setValMax(orig);
                                }
                            }}
                        ></this._ElementInput>
                    </form>
                </this._ElementSettingCell>

            </this._ElementSettingLine>
        );
    };

    _ElementSettingsYAutoScale = ({ yIndex }: any) => {
        // boolean
        const [autoScale, setAutoScale] = React.useState<boolean>(this.yAxes[yIndex]["autoScale"]);
        return (
            <this._ElementSettingLine>
                <this._ElementSettingCell width={"30%"}>
                    Auto scale:
                </this._ElementSettingCell>
                <this._ElementSettingCell width={"70%"}>
                    <form
                        spellCheck={false}
                        onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                            this.yAxes[yIndex]["autoScale"] = autoScale;

                            g_widgets1.addToForceUpdateWidgets(this.getMainWidget().getWidgetKey());
                            g_widgets1.addToForceUpdateWidgets("GroupSelection2");

                            g_flushWidgets();
                        }}
                    // style={{ ...(this._styleForm as any) }}
                    >
                        <input
                            type="checkbox"
                            checked={autoScale}
                            onChange={(event: any) => {
                                this.yAxes[yIndex]["autoScale"] = !autoScale;

                                g_widgets1.addToForceUpdateWidgets(this.getMainWidget().getWidgetKey());
                                g_widgets1.addToForceUpdateWidgets("GroupSelection2");

                                g_flushWidgets();
                                setAutoScale((prevVal: boolean) => {
                                    return !prevVal;
                                });
                            }}
                        />
                    </form>
                </this._ElementSettingCell>

            </this._ElementSettingLine>
        );
    };

    _ElementSettingsXShowGrid = () => {
        // boolean
        const [showGrid, setShowGrid] = React.useState<boolean>(this.xAxis["showGrid"]);
        return (
            <this._ElementSettingLine>
                <this._ElementSettingCell width={"30%"}>
                    Show grids:
                </this._ElementSettingCell>
                <this._ElementSettingCell width={"70%"}>
                    <form
                        spellCheck={false}
                        onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                            this.xAxis["showGrid"] = showGrid;

                            g_widgets1.addToForceUpdateWidgets(this.getMainWidget().getWidgetKey());
                            g_widgets1.addToForceUpdateWidgets("GroupSelection2");

                            g_flushWidgets();
                        }}
                    // style={{ ...(this._styleForm as any) }}
                    >
                        <input
                            type="checkbox"
                            // uncheck if there are more than one traces
                            checked={showGrid}
                            // greg out when there are more than one traces
                            onChange={(event: any) => {
                                this.xAxis["showGrid"] = !showGrid;

                                g_widgets1.addToForceUpdateWidgets(this.getMainWidget().getWidgetKey());
                                g_widgets1.addToForceUpdateWidgets("GroupSelection2");

                                g_flushWidgets();
                                setShowGrid((prevVal: boolean) => {
                                    return !prevVal;
                                });
                            }}
                        />
                    </form>
                </this._ElementSettingCell>

            </this._ElementSettingLine>
        );
    };

    _ElementSettingsYShowGrid = ({ yIndex }: any) => {
        // boolean
        const [showGrid, setShowGrid] = React.useState<boolean>(this.yAxes[yIndex]["showGrid"]);
        return (
            <this._ElementSettingLine>
                <this._ElementSettingCell width={"30%"}>
                    Show grids:
                </this._ElementSettingCell>
                <this._ElementSettingCell width={"70%"}>
                    <form
                        spellCheck={false}
                        onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                            this.yAxes[yIndex]["showGrid"] = showGrid;

                            g_widgets1.addToForceUpdateWidgets(this.getMainWidget().getWidgetKey());
                            g_widgets1.addToForceUpdateWidgets("GroupSelection2");

                            g_flushWidgets();
                        }}
                    // style={{ ...(this._styleForm as any) }}
                    >
                        <input
                            type="checkbox"
                            checked={showGrid}
                            onChange={(event: any) => {
                                this.yAxes[yIndex]["showGrid"] = !showGrid;

                                g_widgets1.addToForceUpdateWidgets(this.getMainWidget().getWidgetKey());
                                g_widgets1.addToForceUpdateWidgets("GroupSelection2");

                                g_flushWidgets();
                                setShowGrid((prevVal: boolean) => {
                                    return !prevVal;
                                });
                            }}
                        />
                    </form>
                </this._ElementSettingCell>

            </this._ElementSettingLine>
        );
    };

    getTraceHidden = (yIndex: number) => {
        return this.tracesHide[yIndex] === true ? true : false;
    };

    setTraceHidden = (yIndex: number, hide: boolean) => {
        this.tracesHide[yIndex] = hide;
    };


    _ElementSettingsYHideTrace = ({ yIndex }: any) => {
        // boolean
        const [hideTrace, setHideTrace] = React.useState<boolean>(this.getTraceHidden(yIndex));
        return (
            <this._ElementSettingLine>
                <this._ElementSettingCell width={"30%"}>
                    Show trace:
                </this._ElementSettingCell>
                <this._ElementSettingCell width={"70%"}>
                    <form
                        spellCheck={false}
                        onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                            this.setTraceHidden(yIndex, hideTrace);

                            g_widgets1.addToForceUpdateWidgets(this.getMainWidget().getWidgetKey());
                            g_widgets1.addToForceUpdateWidgets("GroupSelection2");

                            g_flushWidgets();
                        }}
                    // style={{ ...(this._styleForm as any) }}
                    >
                        <input
                            type="checkbox"
                            checked={hideTrace}
                            onChange={(event: any) => {
                                this.setTraceHidden(yIndex, !hideTrace);

                                g_widgets1.addToForceUpdateWidgets(this.getMainWidget().getWidgetKey());
                                g_widgets1.addToForceUpdateWidgets("GroupSelection2");

                                g_flushWidgets();
                                setHideTrace((prevVal: boolean) => {
                                    return !prevVal;
                                });
                            }}
                        />
                    </form>
                </this._ElementSettingCell>

            </this._ElementSettingLine>
        );
    };

    _ElementSettingsXNumGrids = () => {
        // always string
        const [numGrids, setNumGrids] = React.useState(`${this.xAxis["numGrids"]}`);
        const elementRefInput = React.useRef<any>(null);
        return (
            <this._ElementSettingLine>
                <this._ElementSettingCell width={"30%"}>
                    Number of grids:
                </this._ElementSettingCell>
                <this._ElementSettingCell width={"70%"}>
                    <form
                        spellCheck={false}
                        onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                            event.preventDefault();
                            const orig = this.xAxis["numGrids"];
                            const numGridsNum = parseInt(numGrids);
                            if (!isNaN(numGridsNum)) {
                                this.xAxis["numGrids"] = numGridsNum;
                                setNumGrids(`${numGridsNum}`);
                                g_widgets1.addToForceUpdateWidgets(this.getMainWidget().getWidgetKey());
                                g_widgets1.addToForceUpdateWidgets("GroupSelection2");
                                g_flushWidgets();
                            } else {
                                setNumGrids(`${orig}`);
                            }
                        }}
                    >
                        <this._ElementInput
                            value={numGrids}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                const newVal = event.target.value;
                                setNumGrids(newVal);
                            }}
                            onBlur={(event: any) => {
                                const orig = `${this.xAxis["numGrids"]}`;
                                if (orig !== numGrids) {
                                    setNumGrids(orig);
                                }
                            }}
                        ></this._ElementInput>
                    </form>
                </this._ElementSettingCell>

            </this._ElementSettingLine>
        );
    };

    _ElementSettingsYNumGrids = ({ yIndex }: any) => {
        // always string
        const [numGrids, setNumGrids] = React.useState(`${this.yAxes[yIndex]["numGrids"]}`);
        const elementRefInput = React.useRef<any>(null);
        return (
            <this._ElementSettingLine>
                <this._ElementSettingCell width={"30%"}>
                    Number of grids:
                </this._ElementSettingCell>
                <this._ElementSettingCell width={"70%"}>
                    <form
                        spellCheck={false}
                        onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                            event.preventDefault();
                            const orig = this.yAxes[yIndex]["numGrids"];
                            const numGridsNum = parseInt(numGrids);
                            if (!isNaN(numGridsNum)) {
                                this.yAxes[yIndex]["numGrids"] = numGridsNum;
                                setNumGrids(`${numGridsNum}`);
                                g_widgets1.addToForceUpdateWidgets(this.getMainWidget().getWidgetKey());
                                g_widgets1.addToForceUpdateWidgets("GroupSelection2");
                                g_flushWidgets();
                            } else {
                                setNumGrids(`${orig}`);
                            }
                        }}
                    >
                        <this._ElementInput
                            value={numGrids}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                const newVal = event.target.value;
                                setNumGrids(newVal);
                            }}
                            onBlur={(event: any) => {
                                const orig = `${this.yAxes[yIndex]["numGrids"]}`;
                                if (orig !== numGrids) {
                                    setNumGrids(orig);
                                }
                            }}
                        ></this._ElementInput>
                    </form>
                </this._ElementSettingCell>

            </this._ElementSettingLine>
        );
    };

    // plot body
    _ElementPlot = () => {
        return (
            <div
                style={{
                    width: `${this.plotWidth}px`,
                    height: `${this.plotHeight}px`,
                    outline: "1px solid black",
                    // backgroundColor: "yellow",
                    backgroundColor: "rgba(0, 255, 255, 0)",
                    position: "relative",
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
            >
                {/* tick lines first */}
                <this._ElementXYTickLines></this._ElementXYTickLines>
                {/* data */}
                {this.xy.map((xyData: number[], index: number) => {
                    if (index % 2 === 0 && this.getTraceHidden(this.getYIndex(index)) === false) {
                        return <this._ElementLine key={`${xyData[0]}-${index}`} index={index}></this._ElementLine>;
                    } else {
                        return null;
                    }
                })}
                {/* legend */}
                {this.getMainWidget().getText()["showLegend"] === true || this.peekLegend === true ? (
                    <this._ElementLegends></this._ElementLegends>
                ) : null}
            </div>
        );
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

            const yIndex = this.selectedTraceIndex;
            let useLog10Scale = false;
            if (this.yAxes[yIndex] !== undefined) {
                useLog10Scale = this.yAxes[yIndex]["displayScale"] === "Log10" ? true : false;
            }

            let valXmin = this.xAxis.valMin;
            let valXmax = this.xAxis.valMax;
            let valYmin = this.yAxes[yIndex].valMin;
            let valYmax = this.yAxes[yIndex].valMax

            // extra space in x and y directions
            if (!useLog10Scale) {
                const dx = Math.abs(valXmax - valXmin) * this.xPlotRangeExtension / 100;
                const dy = Math.abs(valYmax - valYmin) * this.yPlotRangeExtension / 100;
                valXmax = valXmax + dx;
                valXmin = valXmin - dx;
                valYmax = valYmax + dy;
                valYmin = valYmin - dy;
            }

            const [valX, valY] = this.mapPointToXY(this.selectedTraceIndex, [pointX, pointY], [valXmin, valXmax, valYmin, valYmax]);
            // const timeStr = GlobalMethods.convertEpochTimeToString(valX);
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

    // getRawChannelNames = () => {
    //     return this.getMainWidget().getRawChannelNames();
    // };

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
}
