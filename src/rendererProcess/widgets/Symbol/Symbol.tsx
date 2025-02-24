import { GlobalVariables } from "../../global/GlobalVariables";
import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { SymbolRules } from "./SymbolRules";
import { SymbolSidebar } from "./SymbolSidebar";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";

export type type_Symbol_tdl = {
	type: string;
	widgetKey: string;
	key: string;
	style: Record<string, any>;
	text: Record<string, any>;
	channelNames: string[];
	groupNames: string[];
	rules: type_rules_tdl;
	itemNames: string[];
	itemValues: (number | string | number[] | string[] | undefined)[];
};

export class Symbol extends BaseWidget {
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

	_rules: SymbolRules;
	_itemNames: string[];
	_itemValues: (number | string | number[] | string[] | undefined)[];

	constructor(widgetTdl: type_Symbol_tdl) {
		super(widgetTdl);

		this.setStyle({ ...Symbol._defaultTdl.style, ...widgetTdl.style });
		this.setText({ ...Symbol._defaultTdl.text, ...widgetTdl.text });

		this._itemNames = JSON.parse(JSON.stringify(widgetTdl.itemNames));
		this._itemValues = JSON.parse(JSON.stringify(widgetTdl.itemValues));

		this._rules = new SymbolRules(this, widgetTdl);

		// this._sidebar = new SymbolSidebar(this);
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
                    backgroundColor: this._getElementAreaRawBackgroundStyle(),
				}}
				// title={"tooltip"}
				onMouseDown={this._handleMouseDown}
				onDoubleClick={this._handleMouseDoubleClick}
			>
				<this._ElementSymbol></this._ElementSymbol>
			</div>
		);
	};

	calcPictureWidth = () => {};

	calcFileName = (): string => {
		if (this.getItemNames().length > 0) {
			if (g_widgets1.isEditing()) {
				return this.getItemNames()[0];
			} else {
				// get raw number if it is enum type PV
				const channelValue = this._getChannelValue(true);
				const index = this.getItemValues().indexOf(channelValue);
				if (index > -1) {
					if (this.getItemNames()[index]) {
						return this.getItemNames()[index];
					}
				}
			}
		}
		return `../../../webpack/resources/webpages/tdm-logo.png`;
	};

	calcTextVisibility = () => {
		if (this.calcFileName() === `../../../webpack/resources/webpages/tdm-logo.png`) {
			return "visible";
		} else {
			return "hidden";
		}
	};

	handleSelectAFile = (options: Record<string, any>, fileName: string) => {
		const itemIndex = options["itemIndex"];
		const sidebar = this.getSidebar();
		if (typeof itemIndex === "number" && sidebar !== undefined) {
			(sidebar as SymbolSidebar).setBeingUpdatedItemIndex(itemIndex);
			sidebar.updateFromWidget(undefined, "select-a-file", fileName);
		}
	};

	_ElementSymbol = () => {
		return (
			<div
				style={{
					opacity: this.getAllText()["invisibleInOperation"] === true && !g_widgets1.isEditing() ? 0 : 1,
				}}
			>
				<img
					src={this.calcFileName()}
					style={{
						opacity: this.getAllText()["opacity"],
						objectFit: this.getAllText()["stretchToFit"] ? "fill" : "scale-down",
					}}
					alt="..."
					width={this.getAllStyle()["width"]}
					height={this.getAllStyle()["height"]}
				></img>
				<div
					style={{
						display: "inline-flex",
						position: "absolute",
						visibility: this.calcTextVisibility(),
						justifyContent: "center",
						alignItems: "center",
						top: 0,
						left: 0,
						width: "100%",
						height: "100%",
					}}
				>
					{this.getAllText()["showPvValue"] === true
						? `${this._getChannelValue()}${this.getAllText().showUnit ? this._getChannelUnit() : ""}`
						: ""}
				</div>
			</div>
		);
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
		const value = this._getFirstChannelValue(raw);
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
	static _defaultTdl: type_Symbol_tdl = {
		type: "Symbol",
		widgetKey: "", // "key" is a reserved keyword
		key: "",
		// the style for outmost div
		// these properties are explicitly defined in style because they are
		// (1) different from default CSS settings, or
		// (2) they may be modified
		style: {
			position: "absolute",
			display: "inline-block",
			backgroundColor: "rgba(240, 240, 240, 0.2)",
			left: 100,
			top: 100,
			width: 150,
			height: 80,
			outlineStyle: "none",
			outlineWidth: 1,
			outlineColor: "black",
			transform: "rotate(0deg)",
			color: "rgba(0,0,0,1)",
			borderStyle: "solid",
			borderWidth: 0,
			borderColor: "rgba(255, 0, 0, 1)",
			fontFamily: GlobalVariables.defaultFontFamily,
			fontSize: GlobalVariables.defaultFontSize,
			fontStyle: GlobalVariables.defaultFontStyle,
			fontWeight: GlobalVariables.defaultFontWeight,
		},
		// the ElementBody style
		text: {
			horizontalAlign: "flex-start",
			verticalAlign: "flex-start",
			wrapWord: false,
			showUnit: false,
			fileName: "../../../webpack/resources/webpages/tdm-logo.svg",
			opacity: 1,
			stretchToFit: false,
			showPvValue: false,
			invisibleInOperation: false,
			alarmBorder: true,
            alarmBackground: false,
            alarmLevel: "MINOR",
		},
		channelNames: [],
		groupNames: [],
		rules: [],
		itemNames: [],
		itemValues: [],
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
		result.itemValues = JSON.parse(JSON.stringify(this._defaultTdl.itemValues));
		return result;
	};

	// overload
	getTdlCopy(newKey: boolean = true): Record<string, any> {
		const result = super.getTdlCopy(newKey);
		result["itemValues"] = JSON.parse(JSON.stringify(this.getItemValues()));
		result["itemNames"] = JSON.parse(JSON.stringify(this.getItemNames()));
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
            this._sidebar = new SymbolSidebar(this);
        }
    }
}
