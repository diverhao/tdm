import { DataViewer } from "./DataViewer";
import * as React from "react";
import { ElementProfileBlockNameInput } from "../../mainWindow/MainWindowStyledComponents";
import * as GlobalMethods from "../../global/GlobalMethods";
import { getMouseEventClientX, getMouseEventClientY, GlobalVariables, g_widgets1, type_dbrData, Channel_DBR_TYPES } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { Log } from "../../../mainProcess/log/Log";
import { type_LocalChannel_data } from "../../../mainProcess/channel/LocalChannelAgent";
// import { type_xAxis } from "../XYPlot/XYPlotPlot";
import uuid from "uuid";
import * as THREE from 'three';
import {OrthographicCamera, Scene, WebGLRenderer, BufferGeometry, BufferAttribute, ShaderMaterial, Points, Color, Vector2} from "three";
import { Line2 } from 'three/examples/jsm/lines/Line2';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

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

type type_xAxis = {
    label: string;
    valMin: number;
    valMax: number;
    ticks: number[];
    ticksText: string[]
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
    minLiveDataTime: number = Number.MAX_VALUE;
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
        [100 * this.oneDay, -100, "day"],
        [300 * this.oneDay, -300, "day"],
        [1000 * this.oneDay, -1000, "day"],
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
    plotWidth: number;
    plotHeight: number;
    lastCursorPointXY: [number, number] = [-100000, -100000];

    // data
    x: number[][] = [];
    y: number[][] = [];

    // only one x axis, ticks and ticksText are the same for each data set
    xAxis: type_xAxis = {
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

        // y data exists
        if (yData0 === undefined) {
            return "";
        }

        // xMaxIndex is inclusive
        let [xMinIndex, xMaxIndex] = GlobalMethods.binarySearchRange(xData0, this.xAxis.valMin, this.xAxis.valMax);
        if (xMinIndex === -100 || xMaxIndex === -100) {
            // binary search did not find, corner case, try linear search
            [xMinIndex, xMaxIndex] = this.linearSearchRange(xData0, this.xAxis.valMin, this.xAxis.valMax);
            if (xMinIndex === -100 || xMaxIndex === -100) {
                // no data within the plot range
                return "";
            }
        }

        let xData = xData0;
        let yData = yData0;
        if (xMinIndex === 0 && xMaxIndex === xData0.length - 1) {
        } else {
            xData = xData.slice(Math.max(xMinIndex - 1, 0), xMaxIndex + 2);
            yData = yData.slice(Math.max(xMinIndex - 1, 0), xMaxIndex + 2);
        }

        // down sample the data
        const maxPoints = this.plotWidth * 2;
        [xData, yData] = GlobalMethods.downSampleXyData(xData, yData, maxPoints);

        const pointsXYOnPlot: [number, number][] = [];
        for (let ii = 0; ii < xData.length; ii++) {
            if (xData[ii] !== undefined && yData[ii] !== undefined) {
                const pointXY = this.mapXYToPoint(index, [xData[ii], yData[ii]], this.plotHeight);
                // out of range SVG polyline point
                pointXY[0] = Math.round(Math.min(Math.max(pointXY[0], -100), 100000));
                pointXY[1] = Math.round(Math.min(Math.max(pointXY[1], -100), 100000));
                pointsXYOnPlot.push(pointXY);
            }
        }
        return `${pointsXYOnPlot}`
    };

    mapXYsToPointsWebGl = (index: number): Float32Array => {
        const xData0 = this.x[index];
        const yData0 = this.y[index];

        // y data exists
        if (yData0 === undefined) {
            const positions = new Float32Array(3);
            return positions;
        }

        // xMaxIndex is inclusive
        let [xMinIndex, xMaxIndex] = GlobalMethods.binarySearchRange(xData0, this.xAxis.valMin, this.xAxis.valMax);
        if (xMinIndex === -100 || xMaxIndex === -100) {
            // binary search did not find, corner case, try linear search
            [xMinIndex, xMaxIndex] = this.linearSearchRange(xData0, this.xAxis.valMin, this.xAxis.valMax);
            if (xMinIndex === -100 || xMaxIndex === -100) {
                // no data within the plot range
                const positions = new Float32Array(3);
                return positions;
            }
        }

        let xData = xData0;
        let yData = yData0;
        if (xMinIndex === 0 && xMaxIndex === xData0.length - 1) {
        } else {
            xData = xData.slice(Math.max(xMinIndex - 1, 0), xMaxIndex + 2);
            yData = yData.slice(Math.max(xMinIndex - 1, 0), xMaxIndex + 2);
        }

        // down sample the data
        const maxPoints = this.plotWidth * 2;
        [xData, yData] = GlobalMethods.downSampleXyData(xData, yData, maxPoints);


        const len = Math.min(xData.length, yData.length);
        const positions = new Float32Array(len * 3);

        const pointsXYOnPlot: [number, number][] = [];
        for (let ii = 0; ii < len; ii++) {
            if (xData[ii] !== undefined && yData[ii] !== undefined) {
                // const pointXY = this.mapXYToPoint(index, [xData[ii], yData[ii]], this.plotHeight);
                const pointX = this.mapXToPointWebGl(index, [xData[ii], yData[ii]], this.plotHeight);
                const pointY = this.mapYToPointWebGl(index, [xData[ii], yData[ii]], this.plotHeight);
                // out of range SVG polyline point
                // pointXY[0] = Math.round(Math.min(Math.max(pointXY[0], -100), 100000));
                // pointXY[1] = Math.round(Math.min(Math.max(pointXY[1], -100), 100000));
                // pointsXYOnPlot.push(pointXY);
                positions[3 * ii] = pointX;
                positions[3 * ii + 1] = -1 * pointY;
                positions[3 * ii + 2] = 0;

            }
        }
        // return `${pointsXYOnPlot}`
        return positions;
    };

    linearSearchRange = (data: number[], valMin: number, valMax: number) => {
        let minIndex = -100;
        let maxIndex = -100;

        // window is on the left of data 
        if (data[0] > valMax) {
            return [minIndex, maxIndex];
        }

        // window is on the right of data
        if (data[data.length - 1] < valMin) {
            return [data.length - 1, data.length - 1];
        }

        // window is in between 2 points
        for (let ii = 0; ii < data.length; ii++) {
            if (data[ii] < valMin) {
                minIndex = ii;
            }
            if (data[ii] > valMax && maxIndex === -100) {
                maxIndex = ii;
            }
        }

        return [minIndex, maxIndex];
    }


    mapXToPointWebGl = (index: number, [valX, valY]: [number, number], plotHeight: number, isThumbnail: boolean = false): number => {
        let useLog10Scale = false;
        const yAxis = this.yAxes[index];
        if (yAxis !== undefined) {
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
        if (yAxis !== undefined) {
            valYmin = yAxis.valMin;
            valYmax = yAxis.valMax;
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

        // thumbnail always use max range
        if (isThumbnail) {
            for (let xData0 of this.x) {
                if (xData0.length > 1) {
                    valXmin = Math.min(valXmin, xData0[0]);
                    valXmax = Math.max(valXmax, xData0[xData0.length - 1]);
                }
            }
        }

        // const pointXmin = 0;
        // const pointXmax = this.plotWidth;
        const pointXmin = -1;
        const pointXmax = 1;
        const pointYmin = 0;
        let pointYmax = plotHeight;
        const pointX = pointXmin + ((pointXmax - pointXmin) / (valXmax - valXmin)) * (valX - valXmin);
        // let pointY = pointYmax - ((pointYmax - pointYmin) / (valYmax - valYmin)) * (valY - valYmin);
        // return [pointX, pointY];
        return pointX;
    };

    mapYToPointWebGl = (index: number, [valX, valY]: [number, number], plotHeight: number, isThumbnail: boolean = false): number => {
        let useLog10Scale = false;
        const yAxis = this.yAxes[index];
        if (yAxis !== undefined) {
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
        if (yAxis !== undefined) {
            valYmin = yAxis.valMin;
            valYmax = yAxis.valMax;
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

        // thumbnail always use max range
        if (isThumbnail) {
            for (let xData0 of this.x) {
                if (xData0.length > 1) {
                    valXmin = Math.min(valXmin, xData0[0]);
                    valXmax = Math.max(valXmax, xData0[xData0.length - 1]);
                }
            }
        }

        const pointXmin = 0;
        const pointXmax = this.plotWidth;
        // const pointYmin = 0;
        // let pointYmax = plotHeight;
        const pointYmin = -1;
        let pointYmax = 1;
        const pointX = pointXmin + ((pointXmax - pointXmin) / (valXmax - valXmin)) * (valX - valXmin);
        let pointY = pointYmax - ((pointYmax - pointYmin) / (valYmax - valYmin)) * (valY - valYmin);
        return pointY;
    };

    mapXToPointThumbnailWebGl = (index: number, [valX, valY]: [number, number], plotHeight: number, isThumbnail: boolean = false): number => {
        let useLog10Scale = false;
        const yAxis = this.yAxes[index];
        if (yAxis !== undefined) {
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
        if (yAxis !== undefined) {
            valYmin = yAxis.valMin;
            valYmax = yAxis.valMax;
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

        // thumbnail always use max range
        if (isThumbnail) {
            for (let xData0 of this.x) {
                if (xData0.length > 1) {
                    valXmin = Math.min(valXmin, xData0[0]);
                    valXmax = Math.max(valXmax, xData0[xData0.length - 1]);
                }
            }
        }

        // const pointXmin = 0;
        // const pointXmax = this.plotWidth;
        const pointXmin = -1;
        const pointXmax = 1;
        const pointYmin = 0;
        let pointYmax = plotHeight;
        const pointX = pointXmin + ((pointXmax - pointXmin) / (valXmax - valXmin)) * (valX - valXmin);
        // let pointY = pointYmax - ((pointYmax - pointYmin) / (valYmax - valYmin)) * (valY - valYmin);
        // return [pointX, pointY];
        return pointX;
    };

    mapYToPointThumbnailWebGl = (index: number, [valX, valY]: [number, number], plotHeight: number, isThumbnail: boolean = false): number => {
        let useLog10Scale = false;
        const yAxis = this.yAxes[index];
        if (yAxis !== undefined) {
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
        if (yAxis !== undefined) {
            valYmin = yAxis.valMin;
            valYmax = yAxis.valMax;
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

        // thumbnail always use max range
        if (isThumbnail) {
            for (let xData0 of this.x) {
                if (xData0.length > 1) {
                    valXmin = Math.min(valXmin, xData0[0]);
                    valXmax = Math.max(valXmax, xData0[xData0.length - 1]);
                }
            }
        }

        const pointXmin = 0;
        const pointXmax = this.plotWidth;
        // const pointYmin = 0;
        // let pointYmax = plotHeight;
        const pointYmin = -1;
        let pointYmax = 1;
        const pointX = pointXmin + ((pointXmax - pointXmin) / (valXmax - valXmin)) * (valX - valXmin);
        let pointY = pointYmax - ((pointYmax - pointYmin) / (valYmax - valYmin)) * (valY - valYmin);
        return pointY;
    };

    mapXYToPoint = (index: number, [valX, valY]: [number, number], plotHeight: number, isThumbnail: boolean = false): [number, number] => {
        let useLog10Scale = false;
        const yAxis = this.yAxes[index];
        if (yAxis !== undefined) {
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
        if (yAxis !== undefined) {
            valYmin = yAxis.valMin;
            valYmax = yAxis.valMax;
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

        // thumbnail always use max range
        if (isThumbnail) {
            for (let xData0 of this.x) {
                if (xData0.length > 1) {
                    valXmin = Math.min(valXmin, xData0[0]);
                    valXmax = Math.max(valXmax, xData0[xData0.length - 1]);
                }
            }
        }

        const pointXmin = 0;
        const pointXmax = this.plotWidth;
        const pointYmin = 0;
        let pointYmax = plotHeight;
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

    /**
     * Set the React state value setter for cursor text on the plot. It causes the cursor text to update.
     * 
     * @param {event: any} Input could be an mouse event, or a [number, number] array
     */
    updateCursorElement = (event: any) => {

        if (this.getSelectedTraceIndex() < 0 || this.getSelectedTraceIndex() > this.getChannelNames().length - 1) {
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

        const pointX = pointX0 - this.yAxisLabelWidth - this.yAxisTickWidth - this.getStyle().left;
        const pointY = pointY0 - this.titleHeight - this.getStyle().top;
        const [valX, valY] = this.mapPointToXY(this.getSelectedTraceIndex(), [pointX, pointY]);
        const timeStr = GlobalMethods.convertEpochTimeToString(valX);
        const valYStr = valY.toPrecision(4).toString();
        this.setCursorValue(`(${timeStr}, ${valYStr})`);
    };


    /**
     * Update 
     * 
     * (1) this.yAxes[index].ticks, 
     *   
     * (2) this.xAxes[index].ticksText, and 
     * 
     * (3) this.xAxes[index].label
     * 
     * according to this.xAxes[index].valMin and this.xAxes[index].valMax
     * 
     */
    calcYTicksAndLabel = (index: number) => {
        const yAxis = this.yAxes[index];
        if (yAxis === undefined) {
            return;
        }

        const yAxisInterval0 = (yAxis.valMax - yAxis.valMin) / 5;
        const yAxisInterval = parseFloat(yAxisInterval0.toExponential(0));
        yAxis.ticks.length = 0;
        yAxis.ticksText.length = 0;
        for (let val = Math.ceil(yAxis.valMin / yAxisInterval); val < Math.ceil(yAxis.valMax / yAxisInterval); val = val + 1) {
            // (1)
            yAxis.ticks.push(val * yAxisInterval);
            // (2)
            yAxis.ticksText.push(val * yAxisInterval);
        }

        // (3)
        const channelName = this.getMainWidget().getChannelNames()[index];
        const unitRaw = g_widgets1.getChannelUnit(channelName).trim();
        yAxis.label = `${channelName} ${unitRaw === "" ? "" : "[" + unitRaw + "]"}`;
    };

    /**
     * Update 
     * 
     * (1) this.xAxis.ticks, 
     *   
     * (2) this.xAxis.ticksText, and 
     * 
     * (3) this.xAxis.label 
     * 
     * according to this.xAxis.valMin and this.xAxis.valMax
     * 
     */
    calcXTicksAndLabel = () => {

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
            // (1)
            this.xAxis.ticks.push(this.xAxis.valMax - jj * deltaT);
            // (2)
            this.xAxis.ticksText.push(`${deltaTnum * jj}`);
            jj++;
        }

        // (3)
        this.xAxis.label = `Time [${this.deltaTs[index][2]}] since ${GlobalMethods.convertEpochTimeToString(this.xAxis.valMax)}`;
    };

    // --------------------------- element ------------------------------------

    _Element = () => {
        this.plotWidth = this.getStyle().width - this.yAxisLabelWidth - this.yAxisTickWidth - this.legendWidth;
        this.plotHeight = this.getStyle().height - this.titleHeight - this.xAxisLabelHeight - this.xAxisTickHeight - this.toolbarHeight - this.thumbnailHeight;

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
                <this._ElementThumbnailLines></this._ElementThumbnailLines>
                <this._ElementThumbnailViewBoxLeft></this._ElementThumbnailViewBoxLeft>
                <this._ElementThumbnailViewBoxRight></this._ElementThumbnailViewBoxRight>
                <this._ElementThumbnailViewBox></this._ElementThumbnailViewBox>
            </div>)
    }

    _ElementThumbnailLines = () => {
        const canUseWebGl = g_widgets1.getRoot().getDisplayWindowClient().canUseWebGl();
        if (canUseWebGl) {
            // canvas with webgl
            return (
                <this._ElementThumbnailLinesWebGl></this._ElementThumbnailLinesWebGl>
            )
        } else {
            // svg
            return (
                <this._ElementThumbnailLinesSvg></this._ElementThumbnailLinesSvg>
            )
        }
    }

    _ElementThumbnailLinesSvg = () => {
        return (
            <>
                {this.x.map((xData: number[], index: number) => {
                    return <this._ElementThumbnailLine key={this.yAxes[index].label + `-${index}`} index={index}></this._ElementThumbnailLine>;
                })}
            </>
        )
    }


    _ElementThumbnailLinesWebGl = () => {
        const mountRef = React.useRef<HTMLDivElement>(null);

        const fun1 = () => {
            const scene = new Scene();
            const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 10);

            camera.position.z = 1;
            const containerWidth = this.plotWidth;
            const containerHeight = this.thumbnailHeight;

            const pixelWorldUnitRatioX = containerWidth / 2;
            const pixelWorldUnitRatioY = containerHeight / 2;

            const renderer = new WebGLRenderer({ alpha: true });
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(containerWidth, containerHeight);
            mountRef.current!.appendChild(renderer.domElement);

            this.x.forEach((xData: number[], index: number) => {

                const positions = this.mapXYsToPointsThumbnailWebGl(index);
                const color = this.yAxes[index].lineColor;

                // const showLine = this.yAxes[index].show;
                const showLine = true;

                // ---------------- line ----------------
                if (showLine === true) {
                    const lineGeometry = new LineGeometry();
                    lineGeometry.setPositions(positions);

                    const lineWidth = 1;

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

        return <div ref={mountRef} style={{ width: this.plotWidth, height: this.thumbnailHeight }} />;
    };



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

        // down sample the data
        let [xData, yData] = GlobalMethods.downSampleXyData(xData0, yData0, this.plotWidth);

        let pointsXYOnPlot: [number, number][] = [];
        for (let ii = 0; ii < xData.length; ii++) {
            if (xData[ii] !== undefined && yData[ii] !== undefined) {
                const pointXY = this.mapXYToPoint(index, [xData[ii], yData[ii]], this.thumbnailHeight, true);
                pointsXYOnPlot.push(pointXY);
            }

        }
        return `${pointsXYOnPlot}`
    };

    mapXYsToPointsThumbnailWebGl = (index: number): Float32Array => {
        const xData0 = this.x[index];
        const yData0 = this.y[index];

        // y data exists
        if (yData0 === undefined) {
            const positions = new Float32Array(3);
            return positions;
        }


        // down sample the data
        let [xData, yData] = GlobalMethods.downSampleXyData(xData0, yData0, this.plotWidth);

        const len = Math.min(xData.length, yData.length);
        if (len === 0) {
            return new Float32Array(3);
        }
        const positions = new Float32Array(len * 3);

        for (let ii = 0; ii < len; ii++) {
            if (xData[ii] !== undefined && yData[ii] !== undefined) {
                const pointX = this.mapXToPointWebGl(index, [xData[ii], yData[ii]], this.thumbnailHeight);
                const pointY = this.mapYToPointWebGl(index, [xData[ii], yData[ii]], this.thumbnailHeight);
                positions[ii * 3] = pointX;
                positions[ii * 3 + 1] = -1 * pointY;
                positions[ii * 3 + 2] = 0;
            }

        }
        return positions;
    };


    // ----------------------------- elements components -----------------------

    _ElementXYTickLines = () => {

        const yTicks = this.yAxes[this.getSelectedTraceIndex()] === undefined ? this.generateFallbackYTicks() : this.yAxes[this.getSelectedTraceIndex()].ticks;
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
                    return <this._ElementXtickLine key={`${tickValue}`} lineIndex={this.getSelectedTraceIndex()} tickIndex={index}></this._ElementXtickLine>;
                })}
                {yTicks.map((tickValue: number, index: number) => {
                    return <this._ElementYtickLine key={`${tickValue}`} lineIndex={this.getSelectedTraceIndex()} tickIndex={index}></this._ElementYtickLine>;
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

        const XYPoint1 = this.mapXYToPoint(lineIndex, [this.xAxis.ticks[tickIndex], valMin], this.plotHeight);
        const XYPoint2 = this.mapXYToPoint(lineIndex, [this.xAxis.ticks[tickIndex], valMax], this.plotHeight);
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

        const XYPoint1 = this.mapXYToPoint(lineIndex, [valMin, yTicks[tickIndex]], this.plotHeight);
        const XYPoint2 = this.mapXYToPoint(lineIndex, [valMax, yTicks[tickIndex]], this.plotHeight);
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
                    const [pointX, pointY] = this.mapXYToPoint(0, [value, 1], this.plotHeight);
                    return (
                        <div
                            key={`${value}`}
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
        const yTicks = this.yAxes[this.getSelectedTraceIndex()] === undefined ? this.generateFallbackYTicks() : this.yAxes[this.getSelectedTraceIndex()].ticks;
        const yTicksText = this.yAxes[this.getSelectedTraceIndex()] === undefined ? this.generateFallbackYTicksText() : this.yAxes[this.getSelectedTraceIndex()].ticksText;
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
                    const [pointX, pointY] = this.mapXYToPoint(this.getSelectedTraceIndex(), [1, value], this.plotHeight);
                    return (
                        <div
                            key={`${value}`}
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
                    color: this.yAxes[this.getSelectedTraceIndex()] === undefined ? "black" : this.yAxes[this.getSelectedTraceIndex()].lineColor,
                }}
            >
                <div
                    style={{
                        transform: "rotate(-90deg)",
                        overflow: "visible",
                        whiteSpace: "nowrap",
                    }}
                >
                    {`${this.yAxes[this.getSelectedTraceIndex()] === undefined ? "" : this.yAxes[this.getSelectedTraceIndex()].label}`}
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
        const elementAddTraceRef = React.useRef<any>(null);

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
                {this.yAxes.map((yAxis: type_yAxis, index: number) => {
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
                        this.appendTrace("");
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
                    // width: `100%`,
                    width: window.innerWidth,
                    height: `${this.toolbarHeight}`,
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
                            src={`../../resources/webpages/scale-2y.svg`}
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
                            src={`../../resources/webpages/scale-y.svg`}
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
                            src={`../../resources/webpages/settings.svg`}
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
                            src={`../../resources/webpages/horizontal-zoom-in.svg`}
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
                            src={`../../resources/webpages/horizontal-zoom-out.svg`}
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
                            src={`../../resources/webpages/horizontal-pan-left.svg`}
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
                            src={`../../resources/webpages/horizontal-pan-right.svg`}
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
                            src={`../../resources/webpages/vertical-zoom-in.svg`}
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
                            src={`../../resources/webpages/vertical-zoom-out.svg`}
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
                            src={`../../resources/webpages/vertical-pan-down.svg`}
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
                            src={`../../resources/webpages/vertical-pan-up.svg`}
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
                            src={`../../resources/webpages/save-to-file.svg`}
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
                        src={`../../resources/webpages/download-from-cloud-symbol.svg`}
                    ></img>
                </this._StyledFigButton>{" "}
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
                    height: this.toolbarHeight,
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

    // plot body
    _ElementPlotRaw = () => {
        const plotRef = React.useRef<any>(null);


        return (
            <div
                id={"DataViewerPlot-" + Math.random().toString()}
                ref={plotRef}
                style={{
                    width: `${this.plotWidth}px`,
                    height: `${this.plotHeight}px`,
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
                <this._ElementXYTickLines></this._ElementXYTickLines>
                {/* data */}
                <this._ElementLines></this._ElementLines>
            </div>
        );
    };

    _ElementLines = () => {
        const canUseWebGl = g_widgets1.getRoot().getDisplayWindowClient().canUseWebGl();
        if (canUseWebGl) {
            // canvas with webgl
            return (
                <this._ElementLinesWebGl></this._ElementLinesWebGl>
            )
        } else {
            // svg
            return (
                <this._ElementLinesSvg></this._ElementLinesSvg>
            )
        }
    }



    _ElementLinesSvg = () => {
        return (
            <>
                {this.x.map((xData: number[], index: number) => {
                    return <this._ElementLine key={this.yAxes[index].label + `-${index}`} index={index}></this._ElementLine>;
                })}
            </>
        )
    }


    _ElementLinesWebGl = () => {
        const mountRef = React.useRef<HTMLDivElement>(null);

        const fun1 = () => {
            const scene = new Scene();
            const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 10);

            camera.position.z = 1;
            const containerWidth = this.plotWidth;
            const containerHeight = this.plotHeight;

            const pixelWorldUnitRatioX = containerWidth / 2;
            const pixelWorldUnitRatioY = containerHeight / 2;

            const renderer = new WebGLRenderer({ alpha: true });
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(containerWidth, containerHeight);
            mountRef.current!.appendChild(renderer.domElement);

            this.x.forEach((xData: number[], index: number) => {

                const positions = this.mapXYsToPointsWebGl(index);
                const color = this.yAxes[index].lineColor;

                const showLine = this.yAxes[index].show;

                // ---------------- line ----------------
                if (showLine === true) {
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

        return <div ref={mountRef} style={{ width: this.plotWidth, height: this.plotWidth }} />;
    };


    _ElementPlot = React.memo(this._ElementPlotRaw, () => {
        if (this.updatePlotLines) {
            return false;
        } else {
            return true;
        }
    })

    /**
     * rotate mouse wheel to zoom x-direction
     */
    handleWheelOnPlotX = (event: React.WheelEvent) => {
        if (this.yAxes[this.getSelectedTraceIndex()] === undefined) {
            return;
        }
        const direction = event.deltaY < 0 ? "zoom-in" : "zoom-out";

        const pointX0 = event.clientX;
        const pointY0 = 0;
        const pointX = pointX0 - this.yAxisLabelWidth - this.yAxisTickWidth - this.getStyle().left;
        const pointY = pointY0 - this.titleHeight - this.getStyle().top;
        const valXMid = this.mapPointToXY(this.getSelectedTraceIndex(), [pointX, pointY]);
        const xAxis = this.xAxis;

        if (xAxis === undefined) {
            return;
        }
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
                xAxis.valMin = valXMid[0] - (valXMid[0] - xAxis.valMin) / zoomFactor;
                xAxis.valMax = valXMid[0] + (xAxis.valMax - valXMid[0]) / zoomFactor;
            } else {
                xAxis.valMin = valXMid[0] - (valXMid[0] - xAxis.valMin) * zoomFactor;
                xAxis.valMax = valXMid[0] + (xAxis.valMax - valXMid[0]) * zoomFactor;
            }


        }

        this.updatePlot();

    }

    /**
     * rotate mouse wheel to zoom y-direction, ctrl key must be pressed
     */
    handleWheelOnPlotY = (event: React.WheelEvent) => {

        const pointX0 = 0;
        const pointY0 = event.clientY;
        const pointX = pointX0 - this.yAxisLabelWidth - this.yAxisTickWidth - this.getStyle().left;
        const pointY = pointY0 - this.titleHeight - this.getStyle().top;
        const valYMid = this.mapPointToXY(this.getSelectedTraceIndex(), [pointX, pointY]);


        const direction = event.deltaY < 0 ? "zoom-in" : "zoom-out";

        let ii = this.getSelectedTraceIndex();

        const yAxis = this.yAxes[ii];
        if (yAxis === undefined) {
            return;
        }
        const yMin = yAxis.valMin;
        const yMax = yAxis.valMax;
        const yMid = valYMid[1];

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

        const ii = this.getSelectedTraceIndex();
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

        const ii = this.getSelectedTraceIndex();
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


        // if (this.mouseMoveEndX !== -100000) {
        //     const dPointX = event.clientX - this.mouseMoveEndX;
        //     this.mouseMoveEndX = -100000;

        //     const ii = this.getSelectedTraceIndex();
        //     if (this.yAxes[ii] === undefined) {
        //         return;
        //     }
        //     const valXY0 = this.mapPointToXY(ii, [0, 0]);
        //     const valXY1 = this.mapPointToXY(ii, [dPointX, 0]);
        //     const dt = valXY1[0] - valXY0[0];

        //     const xAxis = this.xAxis;
        //     if (xAxis === undefined) {
        //         return;
        //     }

        //     xAxis.valMin = xAxis.valMin - dt;
        //     xAxis.valMax = xAxis.valMax - dt;
        //     this.updatePlot();
        // }
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
    // ----------------------------- data and plot -------------------------------------

    /**
     * Patch a point to the end of the data so that there is no blank in the end of trace
     * 
     * (1) remove the old patch point Z'
     * 
     * (2) add new patch point Z, with current time stamp, and last value
     */
    patchData = () => {
        if (g_widgets1.isEditing()) {
            return;
        }
        for (let ii = 0; ii < this.getChannelNames().length; ii++) {
            const xData = this.x[ii];
            const yData = this.y[ii];
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
    }

    fetchArchiveData = () => {
        for (let ii = 0; ii < this.getChannelNames().length; ii++) {
            const channelName = this.getChannelNames()[ii];
            const timeMinOnPlot = this.xAxis["valMin"];
            const timeMaxOnPlot = this.xAxis["valMax"];
            // const timeMinInData = this.x[ii][0];
            const timeMinInData = this.minLiveDataTime;
            const timeMaxInData = this.x[ii][this.x[ii].length - 1];
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
            const xData = this.x[ii];
            const yData = this.y[ii];
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
     * This funciton does not update plot.
     * 
     */
    mapDbrDataWitNewData = (newDbrData: Record<string, type_dbrData | type_dbrData[] | type_LocalChannel_data | undefined>) => {
        if (g_widgets1.isEditing()) {
            return;
        }

        for (let ii = 0; ii < this.getChannelNames().length; ii++) {
            const channelName = this.getChannelNames()[ii];
            const data = newDbrData[channelName];

            if (Array.isArray(data)) {
                for (let dataElement of data) {
                    this.addOneDbrData(dataElement, ii);
                }
            } else {
                this.addOneDbrData(data, ii);
            }
            // remove data if exceeds buffer size
            const yAxis = this.yAxes[ii];
            const bufferSize = yAxis["bufferSize"];
            const xData = this.x[ii];
            const yData = this.y[ii];
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
    addOneDbrData = (data: type_dbrData | type_LocalChannel_data | undefined, index: number) => {
        // data cannot be "undefined", value must be a number
        if (data === undefined || typeof data["value"] !== "number") {
            Log.debug("data is not valid", data);
            return;
        }

        // data must contain time stamp
        if (data["secondsSinceEpoch"] === undefined || data["nanoSeconds"] === undefined) {
            Log.info("new data does not have time stamp")
            return;
        }

        const value = data.value;
        if (typeof value !== "number") {
            return;
        }

        let timeStamp = GlobalMethods.converEpicsTimeStampToEpochTime(
            data.secondsSinceEpoch * 1000 + data.nanoSeconds * 1e-6
        );

        // sometimes the channel was never processed
        if (data["secondsSinceEpoch"] === 0) {
            Log.info("new data has 0 value time stamp", data)
            timeStamp = Date.now();
        }

        if (timeStamp < this.minLiveDataTime && this.minLiveDataTime === Number.MAX_VALUE) {
            this.minLiveDataTime = timeStamp;
        }

        const xData = this.x[index];
        const yData = this.y[index];

        // (1)
        xData.pop();
        yData.pop();

        // (2)
        xData.push(timeStamp);
        yData.push(yData[yData.length - 1] === undefined ? value : yData[yData.length - 1]); // if the data is empty

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
        return result;

    }

    /**
     * Invoked when the plot should be changed, i.e. 
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
     * 
     * (2) calculate X ticks, ticks text, and labels
     * 
     * (3) calcualte each Y ticks, ticks text, and labels
     * 
     * (4) calculate cursor value
     * 
     * (5) update the widget
     * 
     */
    updatePlot = (doFlush: boolean = true) => {
        if (g_widgets1 === undefined) {
            return;
        }

        // (1)
        this.patchData();

        // (2)
        this.calcXTicksAndLabel();

        // (3)
        for (let ii = 0; ii < this.yAxes.length; ii++) {
            this.calcYTicksAndLabel(ii);
        }

        // (4)
        this.updateCursorElement(this.lastCursorPointXY);

        // (5)
        g_widgets1.addToForceUpdateWidgets(this.getMainWidget().getWidgetKey());
        if (doFlush) {
            g_flushWidgets();
        }
    };

    // ------------------------------- traces ------------------------------------

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
    appendTrace = async (newTraceName: string, doFlush: boolean = true) => {
        // (1)
        const mainWidget = this.getMainWidget();
        mainWidget.getChannelNamesLevel0().push(newTraceName);
        mainWidget.processChannelNames([], false);

        // (2)
        this.addNewTraceData(newTraceName, undefined);

        // (3)
        this.setSelectedTraceIndex(mainWidget.getChannelNamesLevel0().length - 1);

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
     * Change the trace name
     */
    updateTrace = async (index: number, newTraceName: string, doFlush: boolean = true, forceUpdate: boolean = false) => {

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
        this.updateTraceData(index, newTraceName);

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
     * Initialize data for all traces. Invoked when the display window operating status is changed.
     * 
     * Each channel name correponds to a trace.
     * 
     * If there is no y axis data for this channel, 
     * 
     * (1) clear all x and y data
     * 
     * (2) add new trace data for each trace
     */
    initTracesData = () => {

        // (1)
        this.x.length = 0;
        this.y.length = 0;

        // (2)
        for (let ii = 0; ii < this.getChannelNames().length; ii++) {
            const channelName = this.getChannelNames()[ii];
            this.addNewTraceData(channelName, this.yAxes[ii]);
        }
    };


    /**
     * Add a new trace data to the end of data set
     * 
     * (1) add empty x and y data 
     * 
     * (2) add a new y axis data that contains the trace line properties: plot range, trace color, buffer size, ...
     *     if there is already one, change its label to channel name
     * 
     * (3) remove excessive y axis if there are
     */
    addNewTraceData = (channelName: string, yAxis: type_yAxis | undefined) => {
        // (1)
        this.x.push([]);
        this.y.push([]);
        // (2)
        // default yAxis
        if (yAxis === undefined) {
            let newYAxis: type_yAxis = {
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
            this.yAxes.push(newYAxis);
        } else {
            yAxis["label"] = channelName;
        }

        // (3)
        this.yAxes.splice(this.getChannelNames().length)
    };

    /**
     * Update the trace data for an existing trace, it is similar to addNewTraceData
     * 
     * (1) clear the trace value data in this.x and this.y
     * 
     * (2) update the yaxis data, with the new channel name, keep all other properties
     */
    updateTraceData = (index: number, channelName: string) => {
        // (1)
        this.x[index] = [];
        this.y[index] = [];
        // (2)
        // default yAxis
        const yAxis = this.yAxes[index];
        yAxis["label"] = channelName;
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
        this.x.splice(index, 1);
        this.y.splice(index, 1);
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
        const newColorIndex = (numTraces) % this.traceColors.length;
        return this.traceColors[newColorIndex];
    };

    upateTraceLineWidth = (index: number, newWidth: number) => {
        const yAxis = this.yAxes[index];
        if (yAxis !== undefined) {
            yAxis["lineWidth"] = newWidth;
        }
        this.updatePlot();
    }

    updateTraceShowOrHide = (index: number, showTrace: boolean) => {
        const yAxis = this.yAxes[index];
        if (yAxis !== undefined) {
            yAxis["show"] = showTrace;
        }
        this.updatePlot();
    }


    updateTraceLineColor = (index: number, newColor: string) => {
        const yAxis = this.yAxes[index];
        if (yAxis !== undefined) {
            yAxis["lineColor"] = newColor;
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

}
