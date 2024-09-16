import * as React from "react";
import { GlobalVariables, calcSidebarWidth, g_widgets1, getMouseEventClientX, getMouseEventClientY, getScrollLeft, getScrollTop, getWindowHorizontalScrollBarWidth } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../Root/Root";
import { TextUpdate } from "../../widgets/TextUpdate/TextUpdate";
import { GroupSelection2 } from "../GroupSelection/GroupSelection2";
import { BaseWidget } from "../../widgets/BaseWidget/BaseWidget";
import { rendererWindowStatus } from "../../global/Widgets";

export class MouseSelectionRegion {
	// level-1 properties in tdl
	private _style: Record<string, any>;
	private _widgetKey: string;
	private _type: string;
	// initial mouse pointer positions
	private readonly _left0: number;
	private readonly _top0: number;

	constructor(widgetTdl: Record<string, any>) {
		this._widgetKey = widgetTdl.widgetKey;
		this._type = widgetTdl.type;
		// copy
		this._style = { ...widgetTdl.style };

		this._left0 = this._style.left;
		this._top0 = this._style.top;
		this.startListeners();
	}

	// ---------------------- events ---------------------------------

	startListeners = () => {
		window.addEventListener("mousemove", this._handleMouseMove);
		window.addEventListener("mouseup", this._handleMouseUp);
	};

	// when mouse moves:
	// (1) calculate the new "mouse selection region" dimension, and write them to this._style
	//     the boundary of canvas is included
	// (2) update "mouse selection region" appearance
	// (3) update widgets appearance according to the new "mouse selection region" dimension
	private _handleMouseMove = (event: any) => {
		event.preventDefault();
		if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.selectingWidget) {
			return;
		}
		// (1)
		// let newX = Math.min(event.clientX, window.innerWidth - calcSidebarTotalWidth());
		// let newY = Math.min(event.clientY, window.innerHeight);
		let newX = Math.min(getMouseEventClientX(event), getScrollLeft() + window.innerWidth - calcSidebarWidth() - getWindowHorizontalScrollBarWidth());
		let newY = Math.min(getMouseEventClientY(event), getScrollTop() + window.innerHeight);
		let oldX = this._left0;
		let oldY = this._top0;
		let newWidth = Math.abs(newX - oldX);
		let newHeight = Math.abs(newY - oldY);
		let newLeft = Math.min(newX, oldX);
		let newTop = Math.min(newY, oldY);
		this._style.top = newTop;
		this._style.left = newLeft;
		this._style.width = newWidth;
		this._style.height = newHeight;

		// (2)
		g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
		// (3)
		this._updateSelection(true);
	};

	// when mouse button up:
	// (1) change window status to "editing"
	// (2) remove window event listeners: mousemove and mouseup
	// (3) remove the "mouse selection region" object in Widgets, and flush (so that the "mouse selection region" disappears)
	private _handleMouseUp = (event: any) => {
		event.preventDefault();
		// (1)
		g_widgets1.setRendererWindowStatus(rendererWindowStatus.editing);
		// (2)
		window.removeEventListener("mousemove", this._handleMouseMove);
		window.removeEventListener("mouseup", this._handleMouseUp);
		// (3)
		// g_widgets1.removeWidget(this.getWidgetKey(), false, true);
		g_widgets1.removeMouseSelectionRegion();
	};

	// ------------------------ elements -------------------------------

	private _Element = () => {
		React.useEffect(() => {
			g_widgets1.removeFromForceUpdateWidgets(this.getWidgetKey());
		});
		return <div style={{ ...this._style }}></div>;
	};

	getElement = (): JSX.Element => {
		return <this._Element key={this.getWidgetKey()}></this._Element>;
	};

	// ----------------------- getters -----------------------------

	getType = (): string => {
		return this._type;
	};
	getStyle = (): Record<string, any> => {
		return this._style;
	};
	getWidgetKey = (): string => {
		return this._widgetKey;
	};

	// ------------------------ tdl -------------------------------
	private static _defaultTdl = {
		type: "MouseSelectionRegion",
		widgetKey: "MouseSelectionRegion",
		key: "MouseSelectionRegion",
		style: {
			position: "absolute",
			left: 80,
			top: 80,
			width: `0px`,
			height: `0px`,
			backgroundColor: `#7fffd4`,
			border: "dashed",
			opacity: 0.5,
			borderColor: "black",
			borderWidth: "1px",
			// prevent oversize
			boxSizing: "border-box",
		},
	};

	static generateDefaultTdl = () => {
		return JSON.parse(JSON.stringify(MouseSelectionRegion._defaultTdl));
	};

	// only one copy
	getTdlCopy = (newKey: boolean = true): Record<string, any> => {
		const result: Record<string, any> = {
			type: this.getType(),
			widgetKey: this.getWidgetKey(),
			key: this.getWidgetKey(),
			style: { ...this.getStyle() },
		};
		return result;
	};

	// ---------------------- helper methods -----------------------

	private _updateSelection = (doFlush: boolean) => {
		let selectionChanged = false;
		const group = g_widgets1.getGroupSelection2();
		const groupsInfo: Record<string, any> = {};

		for (let [widgetKey1, widget1] of g_widgets1.getWidgets2()) {
			// only select selectable widget, e.g. TextUpdate
			//todo: provide a programtic way to determine special widgets
			// const widgetType = widget1.getType();

			if (!(widget1 instanceof BaseWidget)) {
				continue;
			} else if (widget1.getStyle()["visibility"] === "hidden") {
                // a "hidden" widget is in a non-focused Group tab, 
                // it should not be selectable by mouse moving or click
                continue;
            }

			// widget boundary
			// todo: more generic
			const widget = widget1 as BaseWidget;
			let widgetLeft = widget.getStyle().left;
			let widgetTop = widget.getStyle().top;
			let widgetRight = widgetLeft + widget.getStyle().width;
			let widgetDown = widgetTop + widget.getStyle().height;

			// "mouse selection region" boundary
			let regionLeft = this._style.left;
			let regionTop = this._style.top;
			let regionRight = regionLeft + this._style.width;
			let regionDown = regionTop + this._style.height;

			const isInside = regionLeft < widgetLeft && regionTop < widgetTop && regionDown > widgetDown && regionRight > widgetRight;
			const wasInside = widget.isSelected();

			if (widget.isInGroup()) {
				// if widget is in a group, topGroupName must be a string
				const topGroupName = widget.getTopGroupName() as string;
				if (groupsInfo[topGroupName] === undefined) {
					groupsInfo[topGroupName] = {
						totalCount: 0,
						insideCount: 0,
						// any widget in this group
						memberName: widget.getWidgetKey(),
					};
				}
				// add total count
				groupsInfo[topGroupName].totalCount++;
				// wiget is inside the selection region, but it may not be selected, depending on the group it is in
				// count how many widgets inside the selection region
				if (isInside) {
					groupsInfo[topGroupName].insideCount++;
				}
			} else {
				// if widget is not in a group
				if (!wasInside && isInside) {
					// do not flush, flush all widgets at the end
					widget.selectOnMouseMove();
					selectionChanged = true;
				} else if (wasInside && !isInside) {
					// do not flush, flush all wdigets at the end
					widget.simpleDeselect(false);
					selectionChanged = true;
				} else {
					// no change
					continue;
				}
			}
		}

		// ------ group --------
		for (const groupInfo of Object.values(groupsInfo)) {
			// todo: more generic
			const widget = g_widgets1.getWidget2(groupInfo.memberName);
			if (widget instanceof BaseWidget) {
				if (groupInfo.totalCount === groupInfo.insideCount && !widget.isSelected()) {
					// select the whole group
					widget.selectOnMouseMove();
					selectionChanged = true;
				}
				if (groupInfo.totalCount !== groupInfo.insideCount && widget.isSelected()) {
					// deselect the whole group
                    // the widget must have been in a group
					widget.simpleDeselectGroup(false);
					selectionChanged = true;
				}
			}
		}

		if (selectionChanged) {
			// do not flush yet, wait to the end
            g_widgets1.updateSidebar(false);
		}
		if (doFlush) {
			g_flushWidgets();
		}
	};
}
