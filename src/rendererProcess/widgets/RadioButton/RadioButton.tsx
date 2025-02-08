import { GlobalVariables } from "../../global/GlobalVariables";
import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { RadioButtonSidebar } from "./RadioButtonSidebar";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { RadioButtonRules } from "./RadioButtonRules";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import {Log} from "../../../mainProcess/log/Log";

export type type_RadioButton_tdl = {
	type: string;
	widgetKey: string;
	key: string;
	style: Record<string, any>;
	text: Record<string, any>;
	channelNames: string[];
	groupNames: string[];
	rules: type_rules_tdl;
	itemLabels: string[];
	itemValues: (number | string | number[] | string[] | undefined)[];
};

export class RadioButton extends BaseWidget {
	_itemLabels: string[];
	_itemLabelsFromChannel: string[] = [];
	_itemValues: (number | string | number[] | string[] | undefined)[];
	channelItemsUpdated: boolean = false;
    _itemNamesFromChannel: string[];
    _itemValuesFromChannel: (number | string | number[] | string[] | undefined)[];

	_rules: RadioButtonRules;

	constructor(widgetTdl: type_RadioButton_tdl) {
		super(widgetTdl);

		this.setStyle({ ...RadioButton._defaultTdl.style, ...widgetTdl.style });
		this.setText({ ...RadioButton._defaultTdl.text, ...widgetTdl.text });

		// items
		this._itemLabels = JSON.parse(JSON.stringify(widgetTdl.itemLabels));
		this._itemValues = JSON.parse(JSON.stringify(widgetTdl.itemValues));
		// this._itemPictures = JSON.parse(JSON.stringify(widgetTdl.itemPictures));
		// this._itemColors = JSON.parse(JSON.stringify(widgetTdl.itemColors));

		if (this._itemLabels.length === 0) {
			this._itemLabels.push("Label 0");
		}
		// if (this._itemPictures.length === 0) {
		// this._itemPictures.push("");
		// }
		// if (this._itemColors.length === 0) {
		// this._itemColors.push("rgba(60,100,60,1)");
		// }
		if (this._itemValues.length === 0) {
			this._itemValues.push(0);
		}
        this._itemNamesFromChannel = [];
        this._itemValuesFromChannel = [];

		this._rules = new RadioButtonRules(this, widgetTdl);

		// assign the sidebar
		// this._sidebar = new RadioButtonSidebar(this);
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
				<this._ElementRadioButton></this._ElementRadioButton>
			</div>
		);
	};

	updateItemsFromChannel1 = () => {
		const channelName = this.getChannelNames()[0];

		if (!g_widgets1.isEditing()) {
			if (this.channelItemsUpdated === false) {
				if (this.getAllText()["useChannelItems"]) {
					try {
						const channel = g_widgets1.getTcaChannel(channelName);
						const strs = channel.getStrings();
						const numberOfStringsUsed = channel.getNumerOfStringsUsed();
						if (this.getAllText()["useChannelItems"] === true && strs !== undefined && numberOfStringsUsed !== undefined) {
							// update itemNames and itemValues
							this._itemLabelsFromChannel.length = 0;
							this._itemValuesFromChannel.length = 0;
							for (let ii = 0; ii < numberOfStringsUsed; ii++) {
								this._itemLabelsFromChannel.push(strs[ii]);
								this._itemValuesFromChannel.push(ii);
							}
							this.channelItemsUpdated = true;
						}
					} catch (e) {
						Log.error(e);
					}
				} else {
					// do nothing
				}
			} else {
				// do nothing
			}
		} else {
			this._itemLabelsFromChannel.length = 0;
			this._itemValuesFromChannel.length = 0;
			this.channelItemsUpdated = false;
		}
	};


    updateItemsFromChannel = (channelName: string) => {
        let itemNames = this.getItemLabels();
        let itemValues = this.getItemValues();

        if (!g_widgets1.isEditing()) {
            if (this.channelItemsUpdated === false) {
                try {
                    const channel = g_widgets1.getTcaChannel(channelName);
                    let strs = channel.getStrings();
                    let numberOfStringsUsed = channel.getNumerOfStringsUsed();
                    if (channel.getChannelName().startsWith("pva") && channel.isEnumType()) {
                        strs = channel.getEnumChoices();
                        numberOfStringsUsed = strs.length;
                    }

                    if (this.getAllText()["useChannelItems"] === true && strs !== undefined && numberOfStringsUsed !== undefined) {
                        // update itemNames and itemValues
                        this._itemNamesFromChannel.length = 0;
                        this._itemValuesFromChannel.length = 0;
                        for (let ii = 0; ii < numberOfStringsUsed; ii++) {
                            this._itemNamesFromChannel.push(strs[ii]);
                            this._itemValuesFromChannel.push(ii);
                        }
                        itemNames = this._itemNamesFromChannel;
                        itemValues = this._itemValuesFromChannel;
                        this.channelItemsUpdated = true;
                    }
                } catch (e) {
                    Log.error(e);
                    return [itemNames, itemValues];
                }
            } else {
                // display window is operating, and the channel items are upated, then simply assign
                itemNames = this._itemNamesFromChannel;
                itemValues = this._itemValuesFromChannel;
            }
        } else {
            this._itemNamesFromChannel.length = 0;
            this._itemValuesFromChannel.length = 0;
            this.channelItemsUpdated = false;
        }
        return [itemNames, itemValues];
    };

	_ElementRadioButton = () => {

        const channelName = this.getChannelNames()[0];
        const [itemNames, itemValues] = this.updateItemsFromChannel(channelName) as any;

		const elementRef = React.useRef<any>(null);

		return (
			<div
				style={{
					position: "relative",
					width: "100%",
					height: "100%",
					display: "inline-flex",
					flexDirection: "column",
					justifyContent: this.getAllText()["verticalAlign"],
					alignItems: this.getAllText()["horizontalAlign"],
                    cursor: "pointer",
					opacity: this.getAllText()["invisibleInOperation"] === true && !g_widgets1.isEditing() ? 0 : 1,
				}}
			>
				<form
					ref={elementRef}
					style={{
						display: "inline-flex",
						flexDirection: "column",
						justifyContent: "flex-start",
						alignItems: "flex-start",
					}}
					onMouseEnter={(event: any) => {
						event.preventDefault();
						if (!g_widgets1.isEditing() && elementRef.current !== null) {
							elementRef.current.style["outlineStyle"] = "solid";
							elementRef.current.style["outlineWidth"] = "3px";
							elementRef.current.style["outlineColor"] = "rgba(105,105,105,1)";
							// the cursor won't become "pointer"
							if (this._getChannelAccessRight() < 1.5) {
								elementRef.current.style["cursor"] = "not-allowed";
							} else {
								elementRef.current.style["cursor"] = "pointer";
							}
						}
					}}
					// do not use onMouseOut
					onMouseLeave={(event: any) => {
						event.preventDefault();
						if (!g_widgets1.isEditing() && elementRef.current !== null) {
							elementRef.current.style["outlineStyle"] = this.getAllStyle()["outlineStyle"];
							elementRef.current.style["outlineWidth"] = this.getAllStyle()["outlineWidth"];
							elementRef.current.style["outlineColor"] = this.getAllStyle()["outlineColor"];
							elementRef.current.style["cursor"] = "default";
						}
					}}
				>

					{itemNames.map((name: string, index: number) => {
						const value = itemValues[index];
                        let isSelected = false;
                        if (!g_widgets1.isEditing()) {
                            try {
                                const channel = g_widgets1.getTcaChannel(channelName);
                                if (channel.getProtocol() === "pva") {
                                    const dbrData = channel.getDbrData() as any;
                                    if (dbrData["value"]["index"] === index) {
                                        isSelected = true;
                                    }
                                } else {
                                    if (channel.getDbrData()["value"] === itemValues[index]) {
                                        isSelected = true;
                                    }

                                }
                            } catch (e) {
                                Log.error(e);
                            }
                        }

						return (
							<div
                                key={`${name}-${index}`}
								style={{
									display: "inline-flex",
									flexDirection: "row",
									justifyContent: "flex-start",
									alignItems: "center",
                                    cursor: "pointer",
									pointerEvents: this._getChannelAccessRight() < 1.5 ? "none" : "auto",
								}}
							>
								<input
									type="radio"
									name="radio"
									id={`${this.getWidgetKey()}-${name}-${index}`}
									onChange={(event: any) => {
										this.handleChange(event, index);
									}}
									checked={isSelected}
									value={`${value}`}
									style={{
										width: this.getAllText()["boxWidth"],
										height: this.getAllText()["boxWidth"],
                                        cursor: "pointer",
									}}
								></input>
								<label htmlFor={`${this.getWidgetKey()}-${name}-${index}`}>{name}</label>
							</div>
						);
					})}
				</form>
			</div>
		);
	};


    handleChange = (event: any, index: number) => {
        event.preventDefault();
        const channelName = this.getChannelNames()[0];
        if (g_widgets1.isEditing()) {
            return;
        } else {
            if (this._getChannelAccessRight() < 1.5) {
                return;
            }
            // write value
            try {
                const channel = g_widgets1.getTcaChannel(channelName);
                const displayWindowId = g_widgets1.getRoot().getDisplayWindowClient().getWindowId();
                let value = this.getItemValues()[index];
                if (this.getAllText()["useChannelItems"] === true) {
                    value = this._itemValuesFromChannel[index];
                }
                const dbrData = {
                    value: value,
                };
                // 1 second expire
                console.log("putting", this.getItemValues(), index, dbrData)
                channel.put(displayWindowId, dbrData, 1);
            } catch (e) {
                Log.error(e);
            }
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

	// ----------------------- styles -----------------------

	// defined in super class
	// _resizerStyle
	// _resizerStyles
	// StyledToolTipText
	// StyledToolTip

	// -------------------------- tdl -------------------------------

	// override BaseWidget
	static _defaultTdl: type_RadioButton_tdl = {
		type: "RadioButton",
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
			alarmBorder: true,
			useChannelItems: false,
			boxWidth: 13,
			invisibleInOperation: false,
		},
		channelNames: [],
		groupNames: [],
		rules: [],
		itemLabels: ["Label 0", "Label 1"],
		itemValues: [0, 1],
		// itemPictures: ["", ""],
		// itemColors: ["rgba(60, 100, 60, 1)", "rgba(0, 255, 0, 1)"],
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
		// result.itemPictures = JSON.parse(JSON.stringify(this._defaultTdl.itemPictures));
		// result.itemColors = JSON.parse(JSON.stringify(this._defaultTdl.itemColors));

		return result;
	};

	// overload
	getTdlCopy(newKey: boolean = true): Record<string, any> {
		const result = super.getTdlCopy(newKey);
		result["itemValues"] = JSON.parse(JSON.stringify(this.getItemValues()));
		result["itemLabels"] = JSON.parse(JSON.stringify(this.getItemLabels()));
		// result["itemColors"] = JSON.parse(JSON.stringify(this.getItemColors()));
		// result["itemPictures"] = JSON.parse(JSON.stringify(this.getItemPictures()));
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

	_getChannelAccessRight = () => {
		return this._getFirstChannelAccessRight();
	};

	// getItemPictures = () => {
	// 	return this._itemPictures;
	// };

	// getItemColors = () => {
	// 	return this._itemColors;
	// };

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
            this._sidebar = new RadioButtonSidebar(this);
        }
    }
}
