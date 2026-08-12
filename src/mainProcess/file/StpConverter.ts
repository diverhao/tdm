import { defaultCanvasTdl } from "../../common/types/type_widget_tdl";
import { DataViewerHelper } from "./widgetConverters/DataViewer/DataViewerHelper";


export class StpConverter {

    constructor() { }


    static parseStp = (
        stpJSON: Record<string, any>,
        tdl: Record<string, any>,
    ) => {
        // add Canvas
        let canvas = structuredClone(defaultCanvasTdl);
        canvas.windowName = "TDM Data Viewer";
        canvas.isUtilityWindow = true;
        canvas.style.position = "absolute";
        tdl["Canvas"] = canvas;

        // add "Data Viewer" widget
        const widgetTdl = DataViewerHelper.convertStpToTdl(stpJSON, "Data Viewer");
        const widgetKey = widgetTdl["widgetKey"];
        tdl[widgetKey] = widgetTdl;
    };


    static convertStpToJSON = (fileLines: string[]) => {
        const result: Record<string, string> = {};
        for (const line of fileLines) {
            if (line.trim() === "") {
                continue;
            } else {
                const lineArray = line.trim().split(/[\s\t]+/);
                if (lineArray.length > 1) {
                    const key = lineArray[0];
                    lineArray.shift()
                    const value = lineArray.join(" ");
                    result[key] = value;
                }
            }
        }
        return result;
    }

}