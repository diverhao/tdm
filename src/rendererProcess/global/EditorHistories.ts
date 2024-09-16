import { EditorHistory } from "./EditorHistory";
import { g_widgets1 } from "./GlobalVariables";
import { g_flushWidgets } from "../helperWidgets/Root/Root";
// import { SelectableWidget } from "../interfaces/SelectableWidget";
// import { GroupSelection } from "../helperWidgets/GroupSelection";

export class EditorHistories {
	// private _histories: EditorHistory[] = [];
	// private _currentIndex: number = -1;
	// constructor() {}

	// add = (widgetKeys: string[]): void => {
	// 	let history: EditorHistory = null;
	// 	let prevHistory = null;
	// 	if (this._currentIndex === -1) {
	// 		// init
	// 		history = new EditorHistory(widgetKeys, null);
	// 	} else {
	// 		prevHistory = this._histories[this._currentIndex];
	// 		history = new EditorHistory(widgetKeys, prevHistory);
	// 	}

	// 	if (!history.isRealHistory()) {
	// 		return;
	// 	}

	// 	while (this._histories.length - 1 > this._currentIndex) {
	// 		this._histories.pop();
	// 	}
	// 	this._currentIndex = this._currentIndex + 1;
	// 	this._histories.push(history);
	// };

	// undo = () => {
	// 	if (this._currentIndex === 0) {
	// 		return;
	// 	}
	// 	g_widgets1.deselectAllWidgetsWithoutFlush();

	// 	const currHistory = this._histories[this._currentIndex];
	// 	const targetHistory = this._histories[this._currentIndex - 1];
	// 	const changedWidgetKeys = currHistory.getWidgetKeys();

	// 	const widgets = new Map();

    //     for (let widgetKey of targetHistory.getWidgetsTdl().keys()) {
	// 		const targetWidgetTdl = targetHistory.getWidgetTdl(widgetKey);
	// 		if (!changedWidgetKeys.includes(widgetKey)) {
	// 			widgets.set(widgetKey, g_widgets1.getWidget(widgetKey));
	// 		} else {
	// 			widgets.set(widgetKey, g_widgets1.createWidget(targetWidgetTdl));
	// 		}
	// 	}
	// 	g_widgets1.getWidgets().clear();
	// 	for (let widgetKey of widgets.keys()) {
	// 		const widget = widgets.get(widgetKey);
	// 		g_widgets1.getWidgets().set(widgetKey, widget);
	// 	}

	// 	for (let changedWidgetKey of changedWidgetKeys) {
	// 		const widget = g_widgets1.getWidget(changedWidgetKey);
	// 		if (typeof widget !== "undefined") {
	// 			(widget as SelectableWidget).select(false);
	// 		}
	// 	}
	// 	const groupSelection = g_widgets1.getWidget("GroupSelection") as GroupSelection;
	// 	groupSelection.setVirtualStyle();

	// 	this._currentIndex = this._currentIndex - 1;
	// 	g_flushWidgets([...changedWidgetKeys]);
	// };

	// redo = () => {
	// 	if (this._currentIndex === this._histories.length - 1) {
	// 		return;
	// 	}
	// 	g_widgets1.deselectAllWidgetsWithFlush();

	// 	const currHistory = this._histories[this._currentIndex];
	// 	const targetHistory = this._histories[this._currentIndex + 1];
	// 	const changedWidgetKeys = targetHistory.getWidgetKeys();

	// 	const widgets = new Map();

    //     for (let widgetKey of targetHistory.getWidgetsTdl().keys()) {
	// 		const targetWidgetTdl = targetHistory.getWidgetTdl(widgetKey);
	// 		if (!changedWidgetKeys.includes(widgetKey)) {
	// 			widgets.set(widgetKey, g_widgets1.getWidget(widgetKey));
	// 		} else {
	// 			widgets.set(widgetKey, g_widgets1.createWidget(targetWidgetTdl));
	// 		}
	// 	}
	// 	g_widgets1.getWidgets().clear();
	// 	for (let widgetKey of widgets.keys()) {
	// 		const widget = widgets.get(widgetKey);
	// 		g_widgets1.getWidgets().set(widgetKey, widget);
	// 	}

	// 	for (let changedWidgetKey of changedWidgetKeys) {
	// 		const widget = g_widgets1.getWidget(changedWidgetKey);
	// 		if (typeof widget !== "undefined") {
	// 			(widget as SelectableWidget).select(false);
	// 		}
	// 	}
	// 	const groupSelection = g_widgets1.getWidget("GroupSelection") as GroupSelection;
	// 	groupSelection.setVirtualStyle();

	// 	this._currentIndex = this._currentIndex + 1;
	// 	g_flushWidgets([...changedWidgetKeys]);
	// };
}
