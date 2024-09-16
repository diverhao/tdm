import * as React from "react";
import { GlobalVariables, g_widgets1 } from "../../global/GlobalVariables";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { LEDSidebar } from "./LEDSidebar";
import { rgbaStrToRgbaArray } from "../../global/GlobalMethods";
import { LEDRules } from "./LEDRules";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { Log } from "../../global/Log";

export type type_LED_tdl = {
	type: string;
	widgetKey: string;
	key: string;
	style: Record<string, any>;
	text: Record<string, any>;
	channelNames: string[];
	groupNames: string[];
	rules: type_rules_tdl;
	itemNames: string[];
	itemColors: string[];
	itemValues: (number | string | number[] | string[] | undefined)[];
};

export class LED extends BaseWidget {
	// level-1 properties in tdl file
	// _type: string;
	// _widgetKey: string;
	// _style: Record<string, any>;
	// _text: Record<string, any>;
	// _channelNames: string[];
	// _groupNames: string[] = undefined;

	// sidebar
	// private _sidebar: TextUpdateSidebar;

	// tmp methods
	// private _tmp_mouseMoveOnResizerListener: any = undefined;
	// private _tmp_mouseUpOnResizerListener: any = undefined;

	// widget-specific channels, these channels are only used by this widget
	// private _tcaChannels: TcaChannel[];

	// used for the situation of shift key pressed + mouse down on a selected widget,
	// so that when the mouse is up, the widget is de-selected
	// its value is changed in 3 places: this.select2(), this._handleMouseMove() and this._handleMouseUp()
	// private _readyToDeselect: boolean = false;

	_rules: LEDRules;
	_itemNames: string[];
	_itemColors: string[];
	_itemValues: (number | string | number[] | string[] | undefined)[];

	constructor(widgetTdl: type_LED_tdl) {
		super(widgetTdl);
		this.setReadWriteType("read");

		this.setStyle({ ...LED._defaultTdl.style, ...widgetTdl.style });
		this.setText({ ...LED._defaultTdl.text, ...widgetTdl.text });

		// this._rules = new PolylineRules(this, widgetTdl);

		this._itemNames = [...JSON.parse(JSON.stringify(widgetTdl.itemNames)), ...LED._defaultTdl.itemNames];
		this._itemColors = [...JSON.parse(JSON.stringify(widgetTdl.itemColors)), ...LED._defaultTdl.itemColors];
		this._itemValues = [...JSON.parse(JSON.stringify(widgetTdl.itemValues)), ...LED._defaultTdl.itemValues];
		this._itemNames.splice(2, this._itemNames.length - 2);
		this._itemColors.splice(2, this._itemColors.length - 2);
		this._itemValues.splice(2, this._itemValues.length - 2);

		this._rules = new LEDRules(this, widgetTdl);

		// this._sidebar = new LEDSidebar(this);
	}

	// ------------------------- event ---------------------------------

	// defined in widget, invoked in sidebar
	// (1) determine which tdl property should be updated
	// (2) calculate new value
	// (3) assign new value
	// (4) add this widget as well as "GroupSelection2" to g_widgets1.forceUpdateWidgets
	// (5) flush
	updateFromSidebar = (event: any, propertyName: string, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
		// todo: remove this method
	};

	// defined in super class
	// _handleMouseDown()
	// _handleMouseMove()
	// _handleMouseUp()
	// _handleMouseDownOnResizer()
	// _handleMouseMoveOnResizer()
	// _handleMouseUpOnResizer()
	// _handleMouseDoubleClick()

	// ----------------------------- geometric operations ----------------------------

	// defined in super class
	// simpleSelect()
	// selectGroup()
	// select()
	// simpleDeSelect()
	// deselectGroup()
	// deSelect()
	// move()
	// resize()

	// ------------------------------ group ------------------------------------

	// defined in super class
	// addToGroup()
	// removeFromGroup()

	// ------------------------------ elements ---------------------------------

	// element = <> body (area + resizer) + sidebar </>

	// Body + sidebar
	_ElementRaw = () => {
		this.setRulesStyle({});
		this.setRulesText({});
		const rulesValues = this.getRules()?.getValues();
		if (rulesValues !== undefined) {
			this.setRulesStyle(rulesValues["style"]);
			this.setRulesText(rulesValues["text"]);
		}

		// must do it for every widget
		g_widgets1.removeFromForceUpdateWidgets(this.getWidgetKey());
		this.renderChildWidgets = true;
		React.useEffect(() => {
			this.renderChildWidgets = false;
		});

		return (
			<ErrorBoundary style={this.getStyle()} widgetKey={this.getWidgetKey()}>
				<>
					<this._ElementBody></this._ElementBody>
					{this._showSidebar() ? this._sidebar?.getElement() : null}
				</>
			</ErrorBoundary>
		);
	};

	// Text area and resizers
	_ElementBodyRaw = (): JSX.Element => {
		return (
			// always update the div below no matter the TextUpdateBody is .memo or not
			// TextUpdateResizer does not update if it is .memo
			<div style={this.getElementBodyRawStyle()}>
				<this._ElementArea></this._ElementArea>
				{this._showResizers() ? <this._ElementResizer /> : null}
			</div>
		);
	};

	// only shows the text, all other style properties are held by upper level _ElementBodyRaw
	_ElementAreaRaw = ({}: any): JSX.Element => {
		return (
			// <div
			<div
				style={{
					display: "inline-flex",
					top: 0,
					left: 0,
					width: "100%",
					height: "100%",
					userSelect: "none",
					position: "absolute",
					overflow: "visible",
					whiteSpace: this.getAllText().wrapWord ? "normal" : "pre",
					justifyContent: this.getAllText().horizontalAlign,
					alignItems: this.getAllText().verticalAlign,
					fontFamily: this.getAllStyle().fontFamily,
					fontSize: this.getAllStyle().fontSize,
					fontStyle: this.getAllStyle().fontStyle,
					fontWeight: this.getAllStyle().fontWeight,
					outline: this._getElementAreaRawOutlineStyle(),
				}}
				// title={"tooltip"}
				onMouseDown={this._handleMouseDown}
				onDoubleClick={this._handleMouseDoubleClick}
			>
				{this.getAllText()["shape"] === "round" ? (
					<this._ElementLEDRound></this._ElementLEDRound>
				) : (
					<this._ElementLEDSquare></this._ElementLEDSquare>
				)}
				<this._ElementText></this._ElementText>
			</div>
		);
	};

	calcIndex = (): number => {
		const channelValue = this._getChannelValue(true);
		const bit = this.getAllText()["bit"];
		if (typeof channelValue === "number") {
			if (bit < 0) {
				// use whole value
				const index = this.getItemValues().indexOf(channelValue);
				return index;
			} else {
				const value = (Math.floor(Math.abs(channelValue)) >> bit) & 0x1;
				const index = this.getItemValues().indexOf(value);
				return index;
			}
		}
		return -1;
	};

	calcItemColor = () => {
		const index = this.calcIndex();
		if (index > -1 && index < this.getItemColors().length) {
			return this.getItemColors()[index];
		} else {
			return this.getAllText()["fallbackColor"];
		}
	};

	calcItemText = (): string => {
		if (g_widgets1.isEditing()) {
			return this.getItemNames().join("|");
		}

		const index = this.calcIndex();
		if (index > -1) {
			if (this.getAllText()["useChannelItems"] === true) {
				try {
					const channelName = this.getChannelNames()[0];
					const channel = g_widgets1.getTcaChannel(channelName);
					const strs = channel.getStrings();
					const numberOfStringsUsed = channel.getNumerOfStringsUsed();
					if (numberOfStringsUsed && strs) {
						if (index < numberOfStringsUsed) {
							return strs[index];
						}
					}
				} catch (e) {
					Log.error(e);
					return "";
				}
			} else {
				return `${this.getItemNames()[index]}`;
			}
		}
		return "";
	};

	_ElementText = () => {
		return (
			<div
				style={{
					display: "inline-flex",
					position: "absolute",
					width: "100%",
					height: "100%",
					justifyContent: "center",
					alignItems: "center",
					// color: this.calcItemTextcolor(),
					color: this.getAllStyle()["color"],
					opacity: this.getAllText()["invisibleInOperation"] === true && !g_widgets1.isEditing() ? 0 : 1,
				}}
			>
				<div>{this.calcItemText()}</div>
			</div>
		);
	};
	calcOutlineColor = () => {
		const lineColor = rgbaStrToRgbaArray(this.getAllText()["lineColor"]);
		// same as color collapsible title
		if (lineColor[0] + lineColor[1] + lineColor[2] > GlobalVariables.colorSumChange) {
			return "rgba(30, 30, 30, 1)";
		} else {
			return "rgba(230,230,230,1)";
		}
	};

	_ElementLEDSquare = () => {
		const point1X = this.getAllStyle()["width"];
		const point1Y = 0;
		const point2X = this.getAllStyle()["width"];
		const point2Y = this.getAllStyle()["height"];
		const point3X = 0;
		const point3Y = this.getAllStyle()["height"];
		const point4X = 0;
		const point4Y = 0;

		if (g_widgets1.isEditing()) {
			return (
				<svg
					width="100%"
					height="100%"
					x="0"
					y="0"
					style={{
						position: "absolute",
						overflow: "visible",
						opacity: this.getAllText()["invisibleInOperation"] === true && !g_widgets1.isEditing() ? 0 : 1,
					}}
				>
					<path
						d={`M ${point1X} ${point1Y} L ${point2X} ${point2Y} L ${point3X} ${point3Y}`}
						strokeWidth={this.getAllText()["lineWidth"]}
						stroke={this.getAllText()["lineColor"]}
						fill={`${this.getItemColors()[1]}`}
					></path>
					<path
						d={`M ${point1X} ${point1Y} L ${point4X} ${point4Y} L ${point3X} ${point3Y}`}
						strokeWidth={this.getAllText()["lineWidth"]}
						stroke={this.getAllText()["lineColor"]}
						fill={`${this.getItemColors()[0]}`}
					></path>
					{/* outline, enabled upon selection */}
					<rect
						width={`${this.getAllStyle()["width"]}`}
						height={`${this.getAllStyle()["height"]}`}
						strokeWidth={`${this.isSelected() ? "1" : "0"}`}
						stroke={`${this.calcOutlineColor()}`}
						fill="none"
					></rect>
				</svg>
			);
		} else {
			return (
				<svg
					width="100%"
					height="100%"
					x="0"
					y="0"
					style={{
						position: "absolute",
						overflow: "visible",
						opacity: this.getAllText()["invisibleInOperation"] === true && !g_widgets1.isEditing() ? 0 : 1,
					}}
				>
					<rect
						width={`${this.getAllStyle()["width"]}`}
						height={`${this.getAllStyle()["height"]}`}
						strokeWidth={this.getAllText()["lineWidth"]}
						stroke={this.getAllText()["lineColor"]}
						fill={this.calcItemColor()}
					></rect>
				</svg>
			);
		}
	};

	_ElementLEDRound = () => {
		const rX = this.getAllStyle()["width"] / 2;
		const rY = this.getAllStyle()["height"] / 2;
		const point1X = this.getAllStyle()["width"] / 2 + (this.getAllStyle()["width"] / 2) * 0.7071067811865475244;
		const point1Y = this.getAllStyle()["height"] / 2 - (this.getAllStyle()["height"] / 2) * 0.7071067811865475244;
		const point2X = this.getAllStyle()["width"] / 2 - (this.getAllStyle()["width"] / 2) * 0.7071067811865475244;
		const point2Y = this.getAllStyle()["height"] / 2 + (this.getAllStyle()["height"] / 2) * 0.7071067811865475244;

		if (g_widgets1.isEditing()) {
			return (
				<svg
					width="100%"
					height="100%"
					x="0"
					y="0"
					style={{
						position: "absolute",
						overflow: "visible",
						opacity: this.getAllText()["invisibleInOperation"] === true && !g_widgets1.isEditing() ? 0 : 1,
					}}
				>
					<path
						d={`M ${point1X} ${point1Y} A ${rX} ${rY} 0 0 0 ${point2X} ${point2Y}`}
						strokeWidth={this.getAllText()["lineWidth"]}
						stroke={this.getAllText()["lineColor"]}
						fill={`${this.getItemColors()[0]}`}
					></path>
					<path
						d={`M ${point2X} ${point2Y} A ${rX} ${rY} 0 0 0 ${point1X} ${point1Y}`}
						strokeWidth={this.getAllText()["lineWidth"]}
						stroke={this.getAllText()["lineColor"]}
						fill={`${this.getItemColors()[1]}`}
					></path>
				</svg>
			);
		} else {
			return (
				<svg
					width="100%"
					height="100%"
					x="0"
					y="0"
					style={{
						position: "absolute",
						overflow: "visible",
						opacity: this.getAllText()["invisibleInOperation"] === true && !g_widgets1.isEditing() ? 0 : 1,
					}}
				>
					<ellipse
						cx={`${this.getAllStyle()["width"] / 2}`}
						cy={`${this.getAllStyle()["height"] / 2}`}
						rx={`${this.getAllStyle()["width"] / 2}`}
						ry={`${this.getAllStyle()["height"] / 2}`}
						strokeWidth={this.getAllText()["lineWidth"]}
						stroke={this.getAllText()["lineColor"]}
						fill={this.calcItemColor()}
					></ellipse>
				</svg>
			);
		}
	};

	// ------------------------- rectangle ------------------------------------

	_Element = React.memo(this._ElementRaw, () => this._useMemoedElement());
	_ElementArea = React.memo(this._ElementAreaRaw, () => this._useMemoedElement());
	_ElementBody = React.memo(this._ElementBodyRaw, () => this._useMemoedElement());

	// defined in super class
	// getElement()
	// getSidebarElement()
	// _ElementResizerRaw
	// _ElementResizer

	// -------------------- helper functions ----------------

	// defined in super class
	// _showSidebar()
	// _showResizers()
	// _useMemoedElement()
	// hasChannel()
	// isInGroup()
	// isSelected()
	// _getElementAreaRawOutlineStyle()

	_getChannelValue = (raw: boolean = false) => {
		return this.getChannelValueForMonitorWidget(raw);
	};

	_getChannelSeverity = () => {
		return this._getFirstChannelSeverity();
	};

	_getChannelUnit = () => {
		const unit = this._getFirstChannelUnit();
		if (unit === undefined) {
			return "";
		} else {
			return unit;
		}
	};

	// ----------------------- styles -----------------------

	// defined in super class
	// _resizerStyle
	// _resizerStyles
	// StyledToolTipText
	// StyledToolTip

	// -------------------------- tdl -------------------------------

	// properties when we create a new TextUpdate
	// the level 1 properties all have corresponding public or private variable in the widget
	static _defaultTdl: type_LED_tdl = {
		type: "LED",
		widgetKey: "", // "key" is a reserved keyword
		key: "",
		style: {
			// basics
			position: "absolute",
			display: "inline-block",
			// dimensions
			left: 0,
			top: 0,
			width: 100,
			height: 100,
			backgroundColor: "rgba(240, 240, 240, 0.2)",
			// angle
			transform: "rotate(0deg)",
			// font
			color: "rgba(0,0,0,1)",
			fontFamily: GlobalVariables.defaultFontFamily,
			fontSize: GlobalVariables.defaultFontSize,
			fontStyle: GlobalVariables.defaultFontStyle,
			fontWeight: GlobalVariables.defaultFontWeight,
			// border, it is different from the "alarmBorder" below
			borderStyle: "solid",
			borderWidth: 0,
			borderColor: "rgba(0, 0, 0, 1)",
			// shows when the widget is selected
			outlineStyle: "none",
			outlineWidth: 1,
			outlineColor: "black",
		},
		text: {
			wrapWord: false,
			showUnit: false,
			alarmBorder: true,
			// LED line style, not the border/outline line
			lineWidth: 2,
			lineStyle: "solid",
			lineColor: "rgba(50, 50, 50, 0.698)",
			// round or square
			shape: "round",
			// use channel value
			bit: -1,
			// if the value is not valid
			fallbackColor: "rgba(255,0,255,1)",
			// use channel's value and label, only valid for EPICS enum channels
			// that has "strings" property
			useChannelItems: false,
			invisibleInOperation: false,
		},
		channelNames: [],
		groupNames: [],
		rules: [],
		itemNames: ["", ""],
		itemColors: ["rgba(60, 100, 60, 1)", "rgba(0, 255, 0, 1)"],
		itemValues: [0, 1],
	};
	// not getDefaultTdl(), always generate a new key
	static generateDefaultTdl = (type: string): Record<string, any> => {
		// defines type, widgetKey, and key
		const result = super.generateDefaultTdl(type);
		result.style = JSON.parse(JSON.stringify(this._defaultTdl.style));
		result.text = JSON.parse(JSON.stringify(this._defaultTdl.text));
		result.channelNames = JSON.parse(JSON.stringify(this._defaultTdl.channelNames));
		result.groupNames = JSON.parse(JSON.stringify(this._defaultTdl.groupNames));
		result.itemNames = JSON.parse(JSON.stringify(this._defaultTdl.itemNames));
		result.itemColors = JSON.parse(JSON.stringify(this._defaultTdl.itemColors));
		result.itemValues = JSON.parse(JSON.stringify(this._defaultTdl.itemValues));
		return result;
	};

	// overload
	getTdlCopy(newKey: boolean = true): Record<string, any> {
		const result = super.getTdlCopy(newKey);
		result["itemColors"] = JSON.parse(JSON.stringify(this.getItemColors()));
		result["itemNames"] = JSON.parse(JSON.stringify(this.getItemNames()));
		result["itemValues"] = JSON.parse(JSON.stringify(this.getItemValues()));
		return result;
	}

	// --------------------- getters -------------------------

	// defined in super class
	// getType()
	// getWidgetKey()
	// getStyle()
	// getText()
	// getSidebar()
	// getGroupName()
	// getGroupNames()
	// getUpdateFromWidget()
	// getResizerStyle()
	// getResizerStyles()
	// getRules()

	getItemNames = () => {
		return this._itemNames;
	};
	getItemColors = () => {
		return this._itemColors;
	};
	getItemValues = () => {
		return this._itemValues;
	};

	// ---------------------- setters -------------------------

	// ---------------------- channels ------------------------

	// defined in super class
	// getChannelNames()
	// expandChannelNames()
	// getExpandedChannelNames()
	// setExpandedChannelNames()
	// expandChannelNameMacro()

	// ------------------------ z direction --------------------------

	// defined in super class
	// moveInZ()
    // -------------------------- sidebar ---------------------------
    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new LEDSidebar(this);
        }
    }
}
