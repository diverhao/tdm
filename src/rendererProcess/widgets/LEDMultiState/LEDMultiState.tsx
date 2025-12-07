import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { GlobalVariables } from "../../../common/GlobalVariables";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { LEDMultiStateSidebar } from "./LEDMultiStateSidebar";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { rgbaStrToRgbaArray } from "../../../common/GlobalMethods";
import { LEDMultiStateRules } from "./LEDMultiStateRules";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";

export type type_LEDMultiState_tdl = {
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

export class LEDMultiState extends BaseWidget {
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

	_rules: LEDMultiStateRules;
	_itemNames: string[];
	_itemColors: string[];
	_itemValues: (number | string | number[] | string[] | undefined)[];

	constructor(widgetTdl: type_LEDMultiState_tdl) {
		super(widgetTdl);
		this.setReadWriteType("read");

		this.setStyle({ ...LEDMultiState._defaultTdl.style, ...widgetTdl.style });
		this.setText({ ...LEDMultiState._defaultTdl.text, ...widgetTdl.text });

		// this._rules = new PolylineRules(this, widgetTdl);

		this._itemNames = [...JSON.parse(JSON.stringify(widgetTdl.itemNames)), ...LEDMultiState._defaultTdl.itemNames];
		this._itemColors = [...JSON.parse(JSON.stringify(widgetTdl.itemColors)), ...LEDMultiState._defaultTdl.itemColors];
		this._itemValues = [...JSON.parse(JSON.stringify(widgetTdl.itemValues)), ...LEDMultiState._defaultTdl.itemValues];
		this._itemNames.splice(this._itemNames.length - 2, 2);
		this._itemColors.splice(this._itemColors.length - 2, 2);
		this._itemValues.splice(this._itemValues.length - 2, 2);

		this._rules = new LEDMultiStateRules(this, widgetTdl);

		// this._sidebar = new LEDMultiStateSidebar(this);
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
        this.setAllStyle({...this.getStyle(), ...this.getRulesStyle()});
        this.setAllText({...this.getText(), ...this.getRulesText()});

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
	_ElementBodyRaw = (): React.JSX.Element => {
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
	_ElementAreaRaw = ({}: any): React.JSX.Element => {
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
				{this.getAllText()["invisibleInOperation"] === true && !g_widgets1.isEditing() ? null : <this._ElementText></this._ElementText>}
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

	calcIndex = (): number => {
		const channelValue = this._getChannelValue(true);
		if (typeof channelValue === "number") {
			const value = Math.floor(channelValue);
			const index = this.getItemValues().indexOf(value);
			return index;
		}
		return -1;
	};

	calcItemTextcolor = () => {
		let color = this.getItemColors()[0];
		if (!g_widgets1.isEditing()) {
			color = this.calcItemColor();
		}
		const colorArray = rgbaStrToRgbaArray(color);
		if (colorArray[0] + colorArray[1] + colorArray[2] > GlobalVariables.colorSumChange) {
			return "rgba(30, 30, 30, 1)";
		} else {
			return "rgba(230,230,230,1)";
		}
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
		if (index > -1 && index < this.getItemNames().length) {
			return `${this.getItemNames()[index]}`;
		} else {
			return this.getAllText()["fallbackText"];
		}
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
				}}
			>
				<div>{this.calcItemText()}</div>
			</div>
		);
	};

	calcLEDSquarePointXY = (theta: number, rX: number, rY: number) => {
		const pi = 3.1415926;

		let point1X = 0;
		let point1Y = 0;
		if (theta >= 45 && theta < 135) {
			point1X = rX * (1 + 1 / Math.tan((theta * pi) / 180));
			point1Y = 0;
		} else if (theta >= 135 && theta < 225) {
			point1X = 0;
			point1Y = rY * (1 + Math.tan((theta * pi) / 180));
		} else if (theta >= 225 && theta < 315) {
			point1X = rX * (1 - 1 / Math.tan((theta * pi) / 180));
			point1Y = 2 * rY;
		} else {
			point1X = 2 * rX;
			point1Y = rY * (1 - Math.tan((theta * pi) / 180));
		}
		return [Math.round(point1X), Math.round(point1Y)];
	};

	calcLEDSquarePointsXY = (index: number): string => {
		const dTheta = 360 / this.getItemNames().length;

		const rX = this.getAllStyle()["width"] / 2;
		const rY = this.getAllStyle()["height"] / 2;

		const theta1 = 45 + index * dTheta;
		const point1XY = this.calcLEDSquarePointXY(theta1, rX, rY);

		const theta2 = 45 + (index + 1) * dTheta;
		const point2XY = this.calcLEDSquarePointXY(theta2, rX, rY);

		const a1 = Math.floor((theta1 - 45) / 90);
		const a2 = Math.floor((theta2 - 45) / 90);
		let interPoints = "";
		if (a1 !== a2) {
			for (let start = a1 + 1; start <= a2; start++) {
				const interPointXY = this.calcLEDSquarePointXY(45 + start * 90, rX, rY);
				interPoints = `${interPoints} L ${interPointXY[0]} ${interPointXY[1]}`;
			}
		}

		return `M ${rX} ${rY} L ${point1XY[0]} ${point1XY[1]} ${interPoints}  L ${point2XY[0]} ${point2XY[1]}`;
	};

	_ElementLEDSquare = () => {
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
					{this.getItemNames().map((name: string, index: number) => {
						return (
							<path
								d={this.calcLEDSquarePointsXY(index)}
								strokeWidth={0}
								// stroke={this.getAllText()["lineColor"]}
								fill={`${this.getItemColors()[index]}`}
							></path>
						);
					})}
					<path
						d={`M 0 0 L ${this.getAllStyle()["width"]} 0 L ${this.getAllStyle()["width"]} ${this.getAllStyle()["height"]} L 0 ${
							this.getAllStyle()["height"]
						} L 0 0`}
						strokeWidth={this.getAllText()["lineWidth"]}
						stroke={this.getAllText()["lineColor"]}
						fill="none"
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

	calcLEDRoundPointXY = (index: number): string[] => {
		const pi = 3.1415926;
		const dTheta = 360 / this.getItemNames().length;
		const theta1 = 45 + index * dTheta;
		const theta2 = 45 + (index + 1) * dTheta;

		const rX = this.getAllStyle()["width"] / 2;
		const rY = this.getAllStyle()["height"] / 2;

		const point1X = this.getAllStyle()["width"] / 2 + (this.getAllStyle()["width"] / 2) * Math.cos((theta1 * pi) / 180);
		const point1Y = this.getAllStyle()["height"] / 2 - (this.getAllStyle()["height"] / 2) * Math.sin((theta1 * pi) / 180);
		const point2X = this.getAllStyle()["width"] / 2 + (this.getAllStyle()["width"] / 2) * Math.cos((theta2 * pi) / 180);
		const point2Y = this.getAllStyle()["height"] / 2 - (this.getAllStyle()["height"] / 2) * Math.sin((theta2 * pi) / 180);
		return [`M ${point1X} ${point1Y} A ${rX} ${rY} 0 0 0 ${point2X} ${point2Y}`, `M ${rX} ${rY} L ${point1X} ${point1Y} L ${point2X} ${point2Y}`];
	};

	_ElementLEDRound = () => {
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
					{this.getItemNames().map((name: string, index: number) => {
						return (
							<>
								<path
									d={this.calcLEDRoundPointXY(index)[0]}
									strokeWidth={this.getAllText()["lineWidth"]}
									stroke={this.getAllText()["lineColor"]}
									fill={`${this.getItemColors()[index]}`}
								></path>
								<path
									d={this.calcLEDRoundPointXY(index)[1]}
									strokeWidth={1}
									stroke={`${this.getItemColors()[index]}`}
									fill={`${this.getItemColors()[index]}`}
								></path>
							</>
						);
					})}
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

	static _defaultTdl: type_LEDMultiState_tdl = {
		type: "LEDMultiState",
		widgetKey: "", // "key" is a reserved keyword
		key: "",
		style: {
			// basics
			position: "absolute",
			display: "inline-flex",
			// dimensions
			left: 0,
			top: 0,
			width: 100,
			height: 100,
			backgroundColor: "rgba(0, 0, 0, 0)",
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
			// text styles
			horizontalAlign: "flex-start",
			verticalAlign: "flex-start",
			wrapWord: false,
			showUnit: false,
			alarmBorder: true,
			// LED line
			lineWidth: 2,
			lineStyle: "solid",
			lineColor: "rgba(50, 50, 50, 0.698)",
			// LED shape: round or square
			shape: "round",
			// if the value is not valid
			fallbackColor: "rgba(255,0,255,1)",
			fallbackText: "Err",
			invisibleInOperation: false,
		},
		channelNames: [],
		groupNames: [],
		rules: [],
		itemNames: ["False", "True"],
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
            this._sidebar = new LEDMultiStateSidebar(this);
        }
    }
}
