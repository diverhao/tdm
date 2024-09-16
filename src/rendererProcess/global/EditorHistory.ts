import { g_widgets1 } from "./GlobalVariables";
// import { WidgetInTdl } from "../interfaces/WidgetInTdl";

export class EditorHistory {

    // private _widgetKeys: string[];
	// private _widgetsTdl: Map<string, Record<string, any>> = new Map();
	// private _prevHistory: EditorHistory;
    // private _isRealHistory: boolean = true;

	// constructor(widgetKeys: string[], prevHistory: EditorHistory) {

    //     this._widgetKeys = widgetKeys;
	// 	this._prevHistory = prevHistory;

	// 	// take a snapshot
	// 	for (let widget of g_widgets1.getWidgets().values()) {
	// 		const widgetKey = widget.getWidgetKey();
	// 		if (widgetKey === "GroupSelection" || widgetKey === "MouseSelectionRegion") {
	// 			continue;
	// 		}
	// 		const widgetTdl = JSON.parse(JSON.stringify((widget as WidgetInTdl).getWidgetTdlCopy()));
	// 		this._widgetsTdl.set(widgetKey, widgetTdl);
	// 	}

	// 	if (prevHistory !== null) {
	// 		// filter out widgetKeys, remove fake historical widget
	// 		const prevWidgetsTdl = this._prevHistory.getWidgetsTdl();
    //         const currWidgetsTdl = this._widgetsTdl;
	// 		const realWidgetKeys: string[] = [];
	// 		for (let widgetKey of widgetKeys) {
	// 			if (JSON.stringify(currWidgetsTdl.get(widgetKey)) !== JSON.stringify(prevWidgetsTdl.get(widgetKey))) {
	// 				realWidgetKeys.push(widgetKey);
	// 			}
	// 		}
	// 		this._widgetKeys = realWidgetKeys;
	// 	}
    //     if (this._widgetKeys.length === 0) {
    //         this._isRealHistory = false;
    //     }
	// }

    // isRealHistory = (): boolean => {
    //     return this._isRealHistory;
    // }

	// getWidgetKeys = (): string[] => {
	// 	return this._widgetKeys;
	// };

	// getWidgetsTdl = (): Map<string, Record<string, any>> => {
	// 	return this._widgetsTdl;
	// };
	// getWidgetTdl = (widgetKey: string): Record<string, any> => {
	// 	return this._widgetsTdl.get(widgetKey);
	// };

}
