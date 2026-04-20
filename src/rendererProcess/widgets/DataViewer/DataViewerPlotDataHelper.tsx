import * as GlobalMethods from "../../../common/GlobalMethods";
import { type_dbrData, type_LocalChannel_data, type_pva_value } from "../../../common/GlobalVariables";
import { g_widgets1 } from "../../global/GlobalVariables";
import { Log } from "../../../common/Log";
import { DataViewerPlot } from "./DataViewerPlot";
import { type_DataViewer_yAxis } from "../../../common/types/type_widget_tdl";

/**
 * Helper class for data operations in DataViewerPlot.
 *
 * Handles: fetchArchiveData, mapDbrDataWitNewArchiveData, mapDbrDataWitNewData,
 * addOneDbrData, exportData, prepareExportData
 */
export class DataViewerPlotDataHelper {
    _plot: DataViewerPlot;

    constructor(plot: DataViewerPlot) {
        this._plot = plot;
    }

    getPlot = () => {
        return this._plot;
    };

    // ---------------------- data -------------------------------

    fetchArchiveData = () => {
        const plot = this.getPlot();
        for (let ii = 0; ii < plot.getChannelNames().length; ii++) {
            const channelName = plot.getChannelNames()[ii];
            const timeMinOnPlot = plot.xAxis["valMin"];
            const timeMaxOnPlot = plot.xAxis["valMax"];
            const timeMinInData = plot.minLiveDataTime;
            // the archive data must be earlier than the live data
            const startTime = timeMinOnPlot;
            const endTime = Math.min(timeMaxOnPlot, timeMinInData);
            Log.info("requesting archive data from", new Date(startTime).toLocaleTimeString(), "to", new Date(endTime).toLocaleString());
            if (endTime > startTime) {
                const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
                displayWindowClient.getIpcManager().sendFromRendererProcess("request-archive-data", {
                    displayWindowId: displayWindowClient.getWindowId(),
                    widgetKey: plot.getMainWidget().getWidgetKey(),
                    channelName: channelName,
                    startTime: startTime,
                    endTime: endTime,
                });
            }
        }
    };

    mapDbrDataWitNewArchiveData = (data: {
        displayWindowId: string;
        widgetKey: string;
        channelName: string;
        startTime: number; // ms since epoch
        endTime: number;
        archiveData: [number[], number[]];
    }) => {
        const plot = this.getPlot();
        if (g_widgets1.isEditing()) {
            return;
        }
        if (plot.getChannelNames().includes(data["channelName"])) {
            const ii = plot.getChannelNames().indexOf(data["channelName"]);
            const yAxis = plot.yAxes[ii];
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
    };

    /**
     * Invoked whenever there are new data received by the display window client. Usually comes every 0.1 second, or
     * whenever the GET result arrives.
     *
     * This funciton does not update plot. The plot is updated periodically or in mouse/keyboard actions
     *
     */
    mapDbrDataWitNewData = (dbrDataList: Record<string, type_pva_value | type_pva_value[] | type_dbrData | type_dbrData[] | type_LocalChannel_data | undefined>) => {
        const plot = this.getPlot();
        console.log(dbrDataList, plot.getChannelNames())
        if (g_widgets1.isEditing()) {
            return;
        }

        const yAxes = plot.yAxes;

        for (let ii = 0; ii < plot.getChannelNames().length; ii++) {
            const channelName = plot.getChannelNames()[ii];

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
                console.log("add one dbr data?")
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
    addOneDbrData = (data: type_pva_value | type_dbrData | type_LocalChannel_data | undefined, yAxis: type_DataViewer_yAxis) => {
        const plot = this.getPlot();
        if (!(typeof data === "object" && "value" in data)) {
            Log.debug("data is not valid", data);
            return;
        }

        let secondsSinceEpoch = 0;
        let nanoSeconds = 0;
        // let value: PvaRecord | Primitive | undefined = 0;

        let value = data.value;
        if (typeof value !== "number") {
            if (typeof value === "object" && !Array.isArray(value) && typeof value["index"] === "number") {
                // pva enum
                value = value["index"];
            } else {
                Log.debug("value is not valid", data);
                return;
            }
        }

        // get timestamp
        if (data["timeStamp"] !== undefined) {
            // pva data
            secondsSinceEpoch = data["timeStamp"]["secondsPastEpoch"];
            nanoSeconds = data["timeStamp"]["nanoseconds"];
        } else {
            secondsSinceEpoch = data["secondsSinceEpoch"];
            nanoSeconds = data["nanoSeconds"];
        }

        if (typeof secondsSinceEpoch !== "number" || typeof nanoSeconds !== "number") {
            Log.info("new data does not have time stamp");
            return;
        }

        // convert EPICS timestamp to UNIX timestamp
        let timeStamp = secondsSinceEpoch * 1000 + nanoSeconds * 1e-6;
        if (data["timeStamp"] === undefined) {
            timeStamp = GlobalMethods.converEpicsTimeStampToEpochTime(timeStamp);
        }

        // sometimes the channel was never processed
        if (secondsSinceEpoch === 0) {
            Log.info("new data has 0 value time stamp", data);
            timeStamp = Date.now();
        }

        if (timeStamp < plot.minLiveDataTime && plot.minLiveDataTime === Number.MAX_VALUE) {
            plot.minLiveDataTime = timeStamp;
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
    };

    exportData = () => {
        const plot = this.getPlot();
        const result = this.prepareExportData();

        const windowId = g_widgets1.getRoot().getDisplayWindowClient().getWindowId();
        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
        const mainProcessMode = displayWindowClient.getMainProcessMode();
        if (mainProcessMode === "web") {
            const blob = new Blob([JSON.stringify(result, null, 4)], { type: "text/json" });
            const dateNowStr = GlobalMethods.convertEpochTimeToString(Date.now());
            const suggestedName = `DataViewer-data-${dateNowStr}.json`;
            const description = "Data Viewer data";
            const applicationKey = "application/json";
            const applicationValue = [".json"];
            displayWindowClient.getDisplayWindowFile().downloadData(blob, suggestedName, description, applicationKey, applicationValue);
        } else {
            g_widgets1
                .getRoot()
                .getDisplayWindowClient()
                .getIpcManager()
                .sendFromRendererProcess("save-data-to-file", {
                    displayWindowId: windowId,
                    data: result,
                    fileName: "",
                    preferredFileTypes: ["json"],
                });
        }
    };

    prepareExportData = () => {
        const plot = this.getPlot();
        const result: Record<string, Record<string, number[] | string[]>> = {};
        const yAxes = plot.yAxes;
        for (let ii = 0; ii < plot.getMainWidget().getChannelNames().length; ii++) {
            const channelName = plot.getMainWidget().getChannelNames()[ii];
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
    };
}
