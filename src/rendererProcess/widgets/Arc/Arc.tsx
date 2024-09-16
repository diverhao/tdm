import * as React from "react";
import { g_setWidgets1, g_widgets1 } from "../../global/GlobalVariables";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { ArcRules } from "./ArcRules";
import { ArcSidebar } from "./ArcSidebar";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";

export type type_Arc_tdl = {
	type: string;
	widgetKey: string;
	key: string;
	style: Record<string, any>;
	text: Record<string, any>;
	channelNames: string[];
	groupNames: string[];
	rules: type_rules_tdl;
};

export class Arc extends BaseWidget {
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

	_rules: ArcRules;

	constructor(widgetTdl: type_Arc_tdl) {
		super(widgetTdl);

		this.setReadWriteType("read");

		this.setStyle({ ...Arc._defaultTdl.style, ...widgetTdl.style });
		this.setText({ ...Arc._defaultTdl.text, ...widgetTdl.text });

		this._rules = new ArcRules(this, widgetTdl);

		// this._sidebar = new ArcSidebar(this);
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
				{/* {this.getChannelNames().map((channelName: string, index: number) => {
					if (g_widgets1.isEditing()) {
						return null;
					}
					if (index > 1) {
						return null;
					}
					return (
						<this.StyledToolTipText width={this.getStyle().width} height={this.getStyle().height}>
							{channelName}: {this._getChannelValue()}
						</this.StyledToolTipText>
					);
				})} */}

				{/* {`${this._getChannelValue()}${this.getText().showUnit ? this._getChannelUnit() : ""}`} */}
				{/* abcde */}
				<this._ElementArc></this._ElementArc>
			</div>
		);
	};

	calcPoints = (): [[number, number], [number, number]] => {
		const pi = 3.1415926;

		const lineWidth = this.getAllText()["lineWidth"];

		const a = this.getAllStyle()["width"] / 2;
		const b = this.getAllStyle()["height"] / 2;

		let angleStart = this.getAllText()["angleStart"];
		let angleEnd = this.getAllText()["angleRange"] + angleStart;
		if (this.getAllText()["angleRange"] < 0) {
			const tmp = angleEnd;
			angleEnd = angleStart;
			angleStart = tmp;
		}

		return [
			[a + (a - lineWidth / 2) * Math.cos((angleStart * pi) / 180), b - (b - lineWidth / 2) * Math.sin((angleStart * pi) / 180)],
			[a + (a - lineWidth / 2) * Math.cos((angleEnd * pi) / 180), b - (b - lineWidth / 2) * Math.sin((angleEnd * pi) / 180)],
		];
	};

	calcStrokeDasharray = () => {
		const lineWidth = this.getAllText()["lineWidth"];
		switch (this.getAllText()["lineStyle"]) {
			case "solid":
				return ``;
			case "dotted":
				return `${lineWidth},${lineWidth}`;
			case "dashed":
				return `${4 * lineWidth},${2 * lineWidth}`;
			case "dash-dot":
				return `${4 * lineWidth},${lineWidth},${lineWidth},${lineWidth}`;
			case "dash-dot-dot":
				return `${4 * lineWidth},${lineWidth},${lineWidth},${lineWidth},${lineWidth},${lineWidth}`;
			default:
				return "";
		}
	};
	_ElementArc = () => {
		const length = this.getAllText()["arrowLength"];
		const width = this.getAllText()["arrowWidth"];

		const centerX = this.getAllStyle()["width"] / 2;
		const centerY = this.getAllStyle()["height"] / 2;
		const rX = centerX - this.getAllText()["lineWidth"] / 2;
		const rY = centerY - this.getAllText()["lineWidth"] / 2;
		const points = this.calcPoints();
		const largeArcFlag = Math.abs(this.getAllText()["angleRange"]) > 180 ? "1" : "0";
		const showRadiusCommand =
			this.getAllText()["showRadius"] === "radius"
				? `L ${centerX} ${centerY} L ${points[0][0]} ${points[0][1]}`
				: this.getAllText()["showRadius"] === "secant"
				? "z"
				: "";

		return (
			<svg
				width="100%"
				height="100%"
				x="0"
				y="0"
				style={{
					position: "absolute",
					overflow: "visible",
				}}
			>
				<defs>
					<marker
						id={`arrowTail-${this.getWidgetKey()}`}
						viewBox={`0 0 ${length} ${width}`}
						refX="0"
						refY={`${width / 2}`}
						markerUnits="strokeWidth"
						markerWidth={`${length}`}
						markerHeight={`${width}`}
						orient="auto"
					>
						<path d={`M 0 0 L ${length} ${width / 2} L 0 ${width} z`} fill={`${this.getAllText()["lineColor"]}`} />
					</marker>
					<marker
						id={`arrowHead-${this.getWidgetKey()}`}
						viewBox={`${-1 * length} ${-1 * width} ${2 * length} ${2 * width}`}
						refX="0"
						refY={`${width / 2}`}
						markerUnits="strokeWidth"
						markerWidth={`${2 * length}`}
						markerHeight={`${2 * width}`}
						orient="auto"
					>
						<path d={`M 0 0 L ${-1 * length} ${width / 2} L 0 ${width} z`} fill={`${this.getAllText()["lineColor"]}`} />
					</marker>
				</defs>
				<path
					d={`M ${points[0][0]} ${points[0][1]} A ${rX} ${rY} 0 ${largeArcFlag} 0 ${points[1][0]} ${points[1][1]} ${showRadiusCommand}`}
					strokeWidth={this.getAllText()["lineWidth"]}
					stroke={this.getAllText()["lineColor"]}
					strokeDasharray={this.calcStrokeDasharray()}
					markerEnd={this.getAllText()["showArrowTail"] ? `url(#arrowTail-${this.getWidgetKey()})` : ""}
					markerStart={this.getAllText()["showArrowHead"] ? `url(#arrowHead-${this.getWidgetKey()})` : ""}
					strokeLinecap={"butt"}
					fill={this.getAllText()["fill"] ? this.getAllText()["fillColor"] : "none"}
					opacity={this.getAllText()["invisibleInOperation"] === true && !g_widgets1.isEditing() ? 0 : 1}
				></path>
			</svg>
		);
	};

	// ------------------------- polyline ------------------------------------

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

	_getChannelValue = () => {
		const value = this._getFirstChannelValue();
		if (value === undefined) {
			return "";
		} else {
			return value;
		}
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

	static _defaultTdl: type_Arc_tdl = {
		type: "Arc",
		widgetKey: "", // "key" is a reserved keyword
		key: "",
		style: {
			// basics
			position: "absolute",
			display: "inline-block",
			// dimensions
			left: 0,
			top: 0,
			width: 0,
			height: 0,
			// background color for the whole widget
			backgroundColor: "rgba(255, 255, 255, 0)",
			// angle
			transform: "rotate(0deg)",
			// line color, there is no text in this widget
			color: "rgba(0,0,255,1)",
			// border, it is different from the "alarmBorder" below
			borderStyle: "solid",
			borderWidth: 0,
			borderColor: "rgba(255, 0, 0, 1)",
			// shows when the widget is selected
			outlineStyle: "none",
			outlineWidth: 1,
			outlineColor: "black",
		},
		text: {
			// arc line styles, line color is in above
			lineWidth: 3,
			lineStyle: "solid",
			lineColor: "rgba(0,0,255,1)",
			// fill color
			fillColor: "rgba(30, 144, 255, 1)",
			// if fill or not
			fill: true,
			// angle
			angleStart: 0,
			angleRange: 135,
			// show the none/radius/secant
			showRadius: "radius",
			// arrows
			showArrowTail: false,
			showArrowHead: false,
			arrowLength: 6,
			arrowWidth: 6,
			// becomes not visible in operation mode, but still clickable
			invisibleInOperation: false,
		},
		channelNames: [],
		groupNames: [],
		rules: [],
	};

	// not getDefaultTdl(), always generate a new key
	static generateDefaultTdl = (type: string): Record<string, any> => {
		// defines type, widgetKey, and key
		const result = super.generateDefaultTdl(type) as type_Arc_tdl;
		result.style = JSON.parse(JSON.stringify(this._defaultTdl.style));
		result.text = JSON.parse(JSON.stringify(this._defaultTdl.text));
		result.channelNames = JSON.parse(JSON.stringify(this._defaultTdl.channelNames));
		result.groupNames = JSON.parse(JSON.stringify(this._defaultTdl.groupNames));
		return result;
	};

	// getTdlCopy()

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
            this._sidebar = new ArcSidebar(this);
        }
    }
}
