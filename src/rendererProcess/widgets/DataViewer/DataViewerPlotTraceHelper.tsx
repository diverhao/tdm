import { Channel_DBR_TYPES } from "../../../common/GlobalVariables";
import { g_widgets1 } from "../../global/GlobalVariables";
import { settingsIndexChoices } from "./DataViewerPlot";
import type { DataViewerPlot } from "./DataViewerPlot";
import { defaultTicksInfo, defaultYAxis, traceColors, type type_yAxis } from "./DataViewerPlot";

/**
 * Helper class for trace management in DataViewerPlot.
 *
 * Handles: addTrace, renameTrace, removeTrace, getNewColor,
 * updateTraceShowOrHide, updateTraceLineWidth, updateTraceBufferSize, updateTraceScale
 */
export class DataViewerPlotTraceHelper {
    _plot: DataViewerPlot;

    constructor(plot: DataViewerPlot) {
        this._plot = plot;
    }

    getPlot = () => {
        return this._plot;
    };

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
        const plot = this.getPlot();
        // (1)
        const mainWidget = plot.getMainWidget();
        mainWidget.getChannelNamesLevel0().push(newChannelName);
        mainWidget.processChannelNames([], false);

        // (2)
        const yAxis = JSON.parse(JSON.stringify(defaultYAxis));
        yAxis["label"] = newChannelName;
        yAxis["lineColor"] = `rgba(${this.getNewColor()})`;
        plot.yAxes.push(yAxis);

        // (3)
        plot.setSelectedTraceIndex(mainWidget.getChannelNamesLevel0().length - 1);

        // (4)
        if (doFlush) {
            plot.updatePlot();
        }

        // (5)
        const newTcaChannel = g_widgets1.createTcaChannel(newChannelName, plot.getMainWidget().getWidgetKey());
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
        const plot = this.getPlot();

        const oldTraceName = plot.getChannelNames()[index];
        if (newTraceName === oldTraceName && forceUpdate === false) {
            // no change
            return;
        }

        // (1)
        const mainWidget = plot.getMainWidget();
        mainWidget.getChannelNamesLevel0()[index] = newTraceName;
        mainWidget.processChannelNames([], false);

        // (2)
        const yAxis = plot.yAxes[index];
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
        plot.setSelectedTraceIndex(index);

        // (4)
        if (doFlush) {
            plot.updatePlot();
        }

        // (5)
        const newTcaChannel = g_widgets1.createTcaChannel(newTraceName, plot.getMainWidget().getWidgetKey());
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
        const plot = this.getPlot();
        const traceName = plot.getMainWidget().getChannelNames()[index];
        if (traceName === undefined) {
            return;
        }

        // (1)
        plot.getMainWidget().getChannelNamesLevel0().splice(index, 1);
        plot.getMainWidget().processChannelNames([], false);

        // (2)
        plot.yAxes.splice(index, 1);

        // (3)
        if (!plot.getMainWidget().getChannelNames().includes(traceName)) {
            g_widgets1.removeTcaChannel(traceName, plot.getMainWidget().getWidgetKey());
        }
        // (4)
        const newSelectedTrace = index - 1 > -1 ? index - 1 : index + 1 > plot.getChannelNames().length - 1 ? -1 : index + 1;
        plot.setSelectedTraceIndex(newSelectedTrace);

        // (5)
        plot.getMainWidget().setSettingsIndex(settingsIndexChoices.NONE);

        // (6)
        plot.updatePlot();
    };

    getNewColor = (): [number, number, number, number] => {
        const numTraces = this.getPlot().yAxes.length;
        const newColorIndex = numTraces % traceColors.length;
        return traceColors[newColorIndex];
    };

    updateTraceShowOrHide = (index: number, showTrace: boolean) => {
        const yAxis = this.getPlot().yAxes[index];
        if (yAxis !== undefined) {
            yAxis["show"] = showTrace;
        }
        this.getPlot().updatePlot();
    };

    updateTraceLineWidth = (index: number, newWidth: number) => {
        const yAxis = this.getPlot().yAxes[index];
        if (yAxis !== undefined) {
            yAxis["lineWidth"] = newWidth;
        }
        this.getPlot().updatePlot();
    };

    updateTraceBufferSize = (index: number, newSize: number) => {
        const yAxis = this.getPlot().yAxes[index];
        if (yAxis !== undefined) {
            yAxis["bufferSize"] = newSize;
        }
        this.getPlot().updatePlot();
    };

    updateTraceScale = (index: number, newScale: "Linear" | "Log10") => {
        const yAxis = this.getPlot().yAxes[index];
        if (yAxis === undefined) {
            return;
        }
        yAxis["displayScale"] = newScale;
        this.getPlot().updatePlot();
    };
}
