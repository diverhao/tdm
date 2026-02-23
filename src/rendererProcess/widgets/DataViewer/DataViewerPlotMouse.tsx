import * as React from "react";
import * as GlobalMethods from "../../../common/GlobalMethods";
import type { DataViewerPlot } from "./DataViewerPlot";
import { titleHeight, yAxisLabelWidth, yAxisTickWidth } from "./DataViewerPlot";

/**
 * Helper class for mouse event handlers in DataViewerPlot.
 *
 * Handles: handleWheelOnPlotX, handleWheelOnPlotY,
 * handleMouseMoveOnPlotX, handleMouseMoveOnPlotY, handleMouseUpOnPlot
 */
export class DataViewerPlotMouse {
    _plot: DataViewerPlot;

    constructor(plot: DataViewerPlot) {
        this._plot = plot;
    }

    getPlot = () => {
        return this._plot;
    };

    // ------------------ mouse event handlers  ----------------------

    /**
     * rotate mouse wheel to zoom x-direction
     */
    handleWheelOnPlotX = (event: React.WheelEvent) => {
        const plot = this.getPlot();
        const yAxis = plot.getSelectedYAxis();
        if (yAxis === undefined) {
            return;
        }
        const direction = event.deltaY < 0 ? "zoom-in" : "zoom-out";

        const pointX0 = event.clientX;
        const pointY0 = 0;
        const pointX = pointX0 - yAxisLabelWidth - yAxisTickWidth - plot.getStyle().left;
        const pointY = pointY0 - titleHeight - plot.getStyle().top;

        const ticksInfo = yAxis["ticksInfo"];
        const xValMin = ticksInfo["xValMin"];
        const xValMax = ticksInfo["xValMax"];
        const yValMin = ticksInfo["yValMin"];
        const yValMax = ticksInfo["yValMax"];

        const [valXMid, valYMid] = GlobalMethods.mapPointToXy(pointX, pointY, xValMin, xValMax, yValMin, yValMax, plot.getPlotWidth(), plot.getPlotHeight());

        const xAxis = plot.xAxis;

        const zoomFactor = plot.getText()["axisZoomFactor"];

        if (plot.tracingIsMoving) {
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

        plot.updatePlot();
    };

    /**
     * rotate mouse wheel to zoom y-direction, ctrl key must be pressed
     */
    handleWheelOnPlotY = (event: React.WheelEvent) => {
        const plot = this.getPlot();
        const yAxis = plot.getSelectedYAxis();
        if (yAxis === undefined) {
            return;
        }

        const pointX0 = 0;
        const pointY0 = event.clientY;
        const pointX = pointX0 - yAxisLabelWidth - yAxisTickWidth - plot.getStyle().left;
        const pointY = pointY0 - titleHeight - plot.getStyle().top;

        const ticksInfo = yAxis["ticksInfo"];
        const xValMin = ticksInfo["xValMin"];
        const xValMax = ticksInfo["xValMax"];
        const yValMin = ticksInfo["yValMin"];
        const yValMax = ticksInfo["yValMax"];

        const [valXMid, valYMid] = GlobalMethods.mapPointToXy(pointX, pointY, xValMin, xValMax, yValMin, yValMax, plot.getPlotWidth(), plot.getPlotHeight());

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
            const yMinNew = yMid - dyLower / plot.getText()["axisZoomFactor"];
            const yMaxNew = yMid + dyUpper / plot.getText()["axisZoomFactor"];
            yAxis.valMin = yMinNew;
            yAxis.valMax = yMaxNew;
        } else {
            const yMinNew = yMid - dyLower * plot.getText()["axisZoomFactor"];
            const yMaxNew = yMid + dyUpper * plot.getText()["axisZoomFactor"];
            yAxis.valMin = yMinNew;
            yAxis.valMax = yMaxNew;
        }

        const xAxis = plot.xAxis;
        if (plot.tracingIsMoving) {
            xAxis.valMax = Date.now();
        }

        plot.updatePlot();
    };

    handleMouseMoveOnPlotX = (event: MouseEvent) => {
        const plot = this.getPlot();

        plot.tracingIsMoving = false;

        const dPointX = event.movementX;

        plot.mouseMoveEndX = event.clientX;

        const yAxis = plot.getSelectedYAxis();
        if (yAxis === undefined) {
            return;
        }

        const ticksInfo = yAxis["ticksInfo"];
        const xValMin = ticksInfo["xValMin"];
        const xValMax = ticksInfo["xValMax"];
        const yValMin = ticksInfo["yValMin"];
        const yValMax = ticksInfo["yValMax"];

        const valXY0 = GlobalMethods.mapPointToXy(0, 0, xValMin, xValMax, yValMin, yValMax, plot.getPlotWidth(), plot.getPlotHeight());
        const valXY1 = GlobalMethods.mapPointToXy(dPointX, 0, xValMin, xValMax, yValMin, yValMax, plot.getPlotWidth(), plot.getPlotHeight());

        const dt = valXY1[0] - valXY0[0];

        const xAxis = plot.xAxis;
        if (xAxis === undefined) {
            return;
        }

        xAxis.valMin = xAxis.valMin - dt;
        xAxis.valMax = xAxis.valMax - dt;
        plot.updatePlot();
    };

    handleMouseMoveOnPlotY = (event: MouseEvent) => {
        const plot = this.getPlot();
        event.preventDefault();
        const pointDy = event.movementY;

        const yAxis = plot.getSelectedYAxis();
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

        const dxy0 = GlobalMethods.mapPointToXy(0, pointDy, xValMin, xValMax, yValMin, yValMax, plot.getPlotWidth(), plot.getPlotHeight());
        const dxy1 = GlobalMethods.mapPointToXy(0, 0, xValMin, xValMax, yValMin, yValMax, plot.getPlotWidth(), plot.getPlotHeight());

        const dy = dxy1[1] - dxy0[1];
        const yMinNew = yMin + dy;
        const yMaxNew = yMax + dy;
        yAxis.valMin = yMinNew;
        yAxis.valMax = yMaxNew;

        const xAxis = plot.xAxis;
        const dx = xAxis.valMax - xAxis.valMin;
        if (plot.tracingIsMoving) {
            xAxis.valMax = Date.now();
            xAxis.valMin = Date.now() - dx;
        }

        plot.updatePlot();
    };

    handleMouseUpOnPlot = (event: MouseEvent) => {
        event.preventDefault();

        window.removeEventListener("mousemove", this.handleMouseMoveOnPlotX);
        window.removeEventListener("mousemove", this.handleMouseMoveOnPlotY);
        window.removeEventListener("mouseup", this.handleMouseUpOnPlot);
    };
}
