import { DataViewerHelper } from "../../../rendererProcess/widgets/DataViewer/DataViewerHelper";


export class StpConverter {

    constructor() { }


    static parseStp = (
        stpJSON: Record<string, any>,
        tdl: Record<string, any>,
    ) => {
        // add Canvas
        tdl["Canvas"] = {
            "type": "Canvas",
            "widgetKey": "Canvas",
            "key": "Canvas",
            "style": {
                "position": "absolute",
                "display": "inline-block",
                "left": 0,
                "top": 0,
                "height": 500,
                "width": 800,
                "backgroundColor": "rgba(255, 255, 255, 1)",
                "margin": 0,
                "border": 0,
                "padding": 0,
                "overflow": "hidden"
            },
            "macros": [],
            "windowName": "TDM Data Viewer",
            "script": "",
            "xGridSize": 1,
            "yGridSize": 1,
            "gridColor": "rgba(128,128,128,1)",
            "showGrid": true,
            "isUtilityWindow": true
        };

        // add "Data Viewer" widget
        const widgetTdl = DataViewerHelper.convertStpToTdl(stpJSON, "Data Viewer");
        const widgetKey = widgetTdl["widgetKey"];
        tdl[widgetKey] = widgetTdl;
    };


    static convertStpToJSON = (fileLines: string[]) => {
        console.log("field lines", fileLines)
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
        console.log(result)
        return result;
    }

}