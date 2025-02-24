import { GlobalVariables } from "../../global/GlobalVariables";
import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { SlideButtonSidebar } from "./SlideButtonSidebar";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { SlideButtonRules } from "./SlideButtonRules";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import {Log} from "../../../mainProcess/log/Log";

export type type_SlideButton_tdl = {
	type: string;
	widgetKey: string;
	key: string;
	style: Record<string, any>;
	text: Record<string, any>;
	channelNames: string[];
	groupNames: string[];
	rules: type_rules_tdl;
	itemLabels: string[];
	itemValues: number[];
	itemColors: string[];
};

export class SlideButton extends BaseWidget {
	_itemLabels: string[];
	_itemValues: number[];
	_itemColors: string[];

	_rules: SlideButtonRules;

	constructor(widgetTdl: type_SlideButton_tdl) {
		super(widgetTdl);

		this.setStyle({ ...SlideButton._defaultTdl.style, ...widgetTdl.style });
		this.setText({ ...SlideButton._defaultTdl.text, ...widgetTdl.text });

		// items, number of items must be esactly 2
		this._itemLabels = JSON.parse(JSON.stringify(widgetTdl.itemLabels));
		this._itemValues = JSON.parse(JSON.stringify(widgetTdl.itemValues));
		this._itemColors = JSON.parse(JSON.stringify(widgetTdl.itemColors));

		if (this._itemLabels.length === 0) {
			this._itemLabels.push("False");
			this._itemLabels.push("True");
		}
		if (this._itemLabels.length === 1) {
			this._itemLabels.push("True");
		}
		if (this._itemLabels.length >= 2) {
			this._itemLabels.splice(2);
		}

		if (this._itemColors.length === 0) {
			this._itemColors.push("rgba(60,100,60,1)");
			this._itemColors.push("rgba(60,255,60,1)");
		}
		if (this._itemColors.length === 1) {
			this._itemColors.push("rgba(60,255,60,1)");
		}
		if (this._itemColors.length >= 2) {
			this._itemColors.splice(2);
		}

		if (this._itemValues.length === 0) {
			this._itemValues.push(0);
			this._itemValues.push(1);
		}
		if (this._itemValues.length === 1) {
			this._itemValues.push(1);
		}
		if (this._itemValues.length >= 2) {
			this._itemValues.splice(2);
		}

		this._rules = new SlideButtonRules(this, widgetTdl);

		// assign the sidebar
		// this._sidebar = new SlideButtonSidebar(this);
	}

	// ------------------------- event ---------------------------------
	// concretize abstract method
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

	// concretize abstract method
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
					{this._showSidebar() ? this.getSidebar()?.getElement() : null}
				</>
			</ErrorBoundary>
		);
	};

	_ElementBodyRaw = (): JSX.Element => {
		return (
			// always update the div below no matter the TextUpdateBody is .memo or not
			// TextUpdateResizer does not update if it is .memo
			<div style={this.getElementBodyRawStyle()}>
				{/* <this._ElementArea></this._ElementArea> */}
				<this._ElementAreaRaw></this._ElementAreaRaw>
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
					overflow: "visible",
					whiteSpace: this.getAllText().wrapWord ? "normal" : "pre",
					justifyContent: this.getAllText().horizontalAlign,
					alignItems: this.getAllText().verticalAlign,
					fontFamily: this.getAllText().fontFamily,
					fontSize: this.getAllText().fontSize,
					fontStyle: this.getAllText().fontStyle,
					outline: this._getElementAreaRawOutlineStyle(),
				}}
				// title={"tooltip"}
				onMouseDown={this._handleMouseDown}
				onDoubleClick={this._handleMouseDoubleClick}
			>
				<this._ElementSlideButton></this._ElementSlideButton>
			</div>
		);
	};

	_ElementSlideButton = () => {
		const height = this.getAllText()["boxWidth"] / this.getAllText()["boxRatio"];
		const elementRef = React.useRef<any>(null);


		return (
			<div
				ref={elementRef}
				style={{
					position: "relative",
					display: "inline-flex",
					alignItems: "center",
					justifyContent: "center",
				}}
				onMouseEnter={(event: any) => {
					if (!g_widgets1.isEditing()) {
						if (elementRef.current !== null) {
							elementRef.current.style["outlineStyle"] = "solid";
							elementRef.current.style["outlineWidth"] = "3px";
							elementRef.current.style["outlineColor"] = "rgba(105,105,105,1)";
							if (this._getChannelAccessRight() < 1.5) {
								elementRef.current.style["cursor"] = "not-allowed";
							} else {
								elementRef.current.style["cursor"] = "pointer";
							}
						}
					}
				}}
				onMouseLeave={(event: any) => {
					if (!g_widgets1.isEditing()) {
						if (elementRef.current !== null) {
							elementRef.current.style["outlineStyle"] = this.getAllStyle()["outlineStyle"];
							elementRef.current.style["outlineWidth"] = this.getAllStyle()["outlineWidth"];
							elementRef.current.style["outlineColor"] = this.getAllStyle()["outlineColor"];
							elementRef.current.style["cursor"] = "default";
						}
					}
				}}
			>
				<div
					style={{
						position: "relative",
						display: "inline-flex",
						alignItems: "center",
						justifyContent: "center",
						opacity: this.getAllText()["invisibleInOperation"] === true && !g_widgets1.isEditing() ? 0 : 1,
					}}
				>
					<div
						onClick={(event: any) => {
							this.handleOnClick(event);
						}}
						style={{
							width: this.getAllText()["boxWidth"],
							height: height,
							display: "inline-flex",
							borderRadius: height / 2,
							// backgroundColor: g_widgets1.isEditing() ? "" : this.getButtonBackgroundColor(),
                            // backgroundColor: "rgba(0,0,255,1)",
							background: g_widgets1.isEditing()
								? `linear-gradient(to right, ${this.getItemColors()[0]}, ${this.getItemColors()[1]})`
								: this.getButtonBackgroundColor(),

							flexDirection: "row",
							justifyContent: this.getButtonPosition(),
							alignItems: "center",
							border: "solid 1px rgba(30,30,30,1)",
						}}
					>
						<div
							style={{
								width: height,
								height: height,
								borderRadius: height / 2,
								backgroundColor: "rgba(210,210,210,1)",
								border: "solid 1px rgba(30,30,30,1)",
							}}
						></div>
					</div>
					<div>{this.getLabel()}</div>
				</div>{" "}
			</div>
		);
	};

	getLabel = () => {
		if (g_widgets1.isEditing()) {
			return "Label";
		}

		const bitValue = this.getBitValue();
		if (bitValue === undefined) {
			return "Error";
		} else {
			if (this.getAllText()["bit"] > -1) {
				// bitValue must be 0 or 1, which can be the index
				return this.getItemLabels()[bitValue];
			} else {
				// bitValue is the whole channel value
				const index = this.getItemValues().indexOf(bitValue);
				if (index > -1) {
					return this.getItemLabels()[index];
				} else {
					return `${bitValue}`;
				}
			}
		}
	};

	getButtonPosition = () => {
		const bitValue = this.getBitValue();

		if (bitValue === undefined) {
			return "center";
		} else {
			if (this.getAllText()["bit"] > -1) {
				if (bitValue === 0) {
					return "flex-start";
				} else if (bitValue === 1) {
					return "flex-end";
				} else {
					return "center";
				}
			} else {
				const index = this.getItemValues().indexOf(bitValue);
				if (index === 0) {
					return "flex-start";
				} else if (index === 1) {
					return "flex-end";
				} else {
					return "center";
				}
			}
		}
	};

	getButtonBackgroundColor = () => {

		const bitValue = this.getBitValue();
		if (bitValue === undefined) {
			return this.getAllText()["fallbackColor"];
		} else {
			if (this.getAllText()["bit"] > -1) {
				// bitValue must be 0 or 1, which can be the index
				return this.getItemColors()[bitValue];
			} else {
				// bitValue is the whole channel value
				const index = this.getItemValues().indexOf(bitValue);
				if (index > -1) {
					return this.getItemColors()[index];
				} else {
					return this.getAllText()["fallbackColor"];
				}
			}
		}
	};

	handleOnClick = (event: any) => {
		event.preventDefault();

		if (g_widgets1.isEditing()) {
			return;
		}

		if (this._getChannelAccessRight() < 1.5) {
			return;
		}

		const oldBitValue = this.getBitValue();
		const bit = this.getAllText()["bit"];
		const oldChannelValue = this._getChannelValue(true);
		let newChannelValue = this.getItemValues()[0];

		if (oldBitValue === undefined || typeof oldChannelValue !== "number") {
			// write to channel anyway
			newChannelValue = this.getItemValues()[0];
		} else {
			if (bit > -1) {
				// oldBitValue and newBitValue must be 0 or 1 in this case
				const newBitValue = Math.abs(oldBitValue - 1);
				if (newBitValue === 1) {
					newChannelValue = Math.floor(oldChannelValue) | (1 << bit);
				} else {
					newChannelValue = Math.floor(oldChannelValue) & ~(1 << bit);
				}
			} else {
				// whole value, oldBitValue could be any number
				const index = this.getItemValues().indexOf(oldBitValue);
				if (index < 0) {
					// fallback to 0-th value
					newChannelValue = this.getItemValues()[0];
				} else {
					newChannelValue = this.getItemValues()[Math.abs(index - 1)];
				}
			}
		}

		try {
			const channelName = this.getChannelNames()[0];
			const channel = g_widgets1.getTcaChannel(channelName);
			const displayWindowId = g_widgets1.getRoot().getDisplayWindowClient().getWindowId();

			const dbrData = {
				value: newChannelValue,
			};
			channel.put(displayWindowId, dbrData, 1);
		} catch (e) {
			Log.error(e);
		}
	};

	/**
	 * If the channel does not exist, return undefined.
	 *
	 * If we use the whole value (bit === -1), return the whole value anyway, do not compare with itemValues <br>
	 *
	 * If we use the bit value (bit >= 0), return this bit's value (0 or 1). <br>
	 */
	getBitValue = (): number | undefined => {
		// bot position
		const bit = this.getAllText()["bit"];
		try {
			const channelValue = this._getChannelValue(true);

			if (typeof channelValue === "number") {
				if (bit < 0) {
					return channelValue;
				} else if (bit >= 0) {
					// must be 0 or 1
					return (channelValue >> bit) & 0x1;
					// let bitValue = (channelValue >> bit) & 0x1;
					// const index = this.getItemValues().indexOf(bitValue);
					// if (index < 0) {
					// 	return undefined;
					// } else {
					// 	return this.getItemValues()[index];
					// }
				}
			}
		} catch (e) {
			Log.error(e);
		}
		return undefined;
	};

	onCheckBoxClick = (event: any) => {
		// do not preventDefault()
		const bit = this.getAllText()["bit"];
		const newBitValue = event.target.checked === true ? 1 : 0;
		const channelValue = this._getChannelValue(true);
		let newChannelValue = 0;

		if (typeof channelValue === "number") {
			if (newBitValue === 1) {
				newChannelValue = Math.floor(channelValue) | (1 << bit);
			} else {
				newChannelValue = Math.floor(channelValue) & ~(1 << bit);
			}
		}

		try {
			const channelName = this.getChannelNames()[0];
			const channel = g_widgets1.getTcaChannel(channelName);
			const displayWindowId = g_widgets1.getRoot().getDisplayWindowClient().getWindowId();

			if (this.getAllText()["bit"] < 0) {
				newChannelValue = newBitValue;
			}

			const dbrData = {
				value: newChannelValue,
			};
			channel.put(displayWindowId, dbrData, 1);
		} catch (e) {
			Log.error(e);
		}
	};

	// concretize abstract method
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
	_getChannelAccessRight = () => {
		return this._getFirstChannelAccessRight();
	};

	// ----------------------- styles -----------------------

	// defined in super class
	// _resizerStyle
	// _resizerStyles
	// StyledToolTipText
	// StyledToolTip

	// -------------------------- tdl -------------------------------

	// override BaseWidget
	static _defaultTdl: type_SlideButton_tdl = {
		type: "SlideButton",
		widgetKey: "", // "key" is a reserved keyword
		key: "",
		// the style for outmost div
		// these properties are explicitly defined in style because they are
		// (1) different from default CSS settings, or
		// (2) they may be modified
		style: {
			position: "absolute",
			display: "inline-block",
			backgroundColor: "rgba(128, 255, 255, 0)",
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
			alarmBorder: true,
			selectedBackgroundColor: "rgba(100, 100, 100, 1)",
			unselectedBackgroundColor: "rgba(200, 200, 200, 1)",
			useChannelItems: true,
			bit: 0,
			boxWidth: 100,
			boxRatio: 3,
			text: "Label",
			fallbackColor: "rgba(255,0,255,1)",
			invisibleInOperation: false,
		},
		channelNames: [],
		groupNames: [],
		rules: [],
		itemLabels: ["False", "True"],
		itemValues: [0, 1],
		itemColors: ["rgba(60, 100, 60, 1)", "rgba(60, 255, 60, 1)"],
	};

	// override
	static generateDefaultTdl = (type: string) => {
		// defines type, widgetKey, and key
		const result = super.generateDefaultTdl(type);
		result.style = JSON.parse(JSON.stringify(this._defaultTdl.style));
		result.text = JSON.parse(JSON.stringify(this._defaultTdl.text));
		result.channelNames = JSON.parse(JSON.stringify(this._defaultTdl.channelNames));
		result.groupNames = JSON.parse(JSON.stringify(this._defaultTdl.groupNames));
		result.itemLabels = JSON.parse(JSON.stringify(this._defaultTdl.itemLabels));
		result.itemValues = JSON.parse(JSON.stringify(this._defaultTdl.itemValues));
		result.itemColors = JSON.parse(JSON.stringify(this._defaultTdl.itemColors));
		return result;
	};

	// overload
	getTdlCopy(newKey: boolean = true): Record<string, any> {
		const result = super.getTdlCopy(newKey);
		result["itemValues"] = JSON.parse(JSON.stringify(this.getItemValues()));
		result["itemLabels"] = JSON.parse(JSON.stringify(this.getItemLabels()));
		result["itemColors"] = JSON.parse(JSON.stringify(this.getItemColors()));
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

	getItemLabels = () => {
		return this._itemLabels;
	};
	getItemValues = () => {
		return this._itemValues;
	};
	getItemColors = () => {
		return this._itemColors;
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
            this._sidebar = new SlideButtonSidebar(this);
        }
    }
}
