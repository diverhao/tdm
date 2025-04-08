import { GlobalVariables } from "../../global/GlobalVariables";
import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { CheckBoxSidebar } from "./CheckBoxSidebar";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { CheckBoxRules } from "./CheckBoxRules";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { Log } from "../../../mainProcess/log/Log";

export type type_CheckBox_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    // itemLabels: string[];
    // itemValues: number[];
    rules: type_rules_tdl;
};

export class CheckBox extends BaseWidget {
    // _itemLabels: string[];
    // _itemValues: number[];

    _rules: CheckBoxRules;

    constructor(widgetTdl: type_CheckBox_tdl) {
        super(widgetTdl);

        this.setStyle({ ...CheckBox._defaultTdl.style, ...widgetTdl.style });
        this.setText({ ...CheckBox._defaultTdl.text, ...widgetTdl.text });

        this._rules = new CheckBoxRules(this, widgetTdl);
        // assign the sidebar
        // this._sidebar = new CheckBoxSidebar(this);
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
        this.setAllStyle({ ...this.getStyle(), ...this.getRulesStyle() });
        this.setAllText({ ...this.getText(), ...this.getRulesText() });

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
    _ElementAreaRaw = ({ }: any): JSX.Element => {
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
                <this._ElementCheckBox></this._ElementCheckBox>
            </div>
        );
    };

    _ElementCheckBox = () => {
        const elementRef = React.useRef<any>(null);
        return (
            <form
                ref={elementRef}
                style={{
                    display: "inline-flex",
                    justifyContent: "center",
                    alignItems: "center",
                    opacity: this.getAllText()["invisibleInOperation"] === true && !g_widgets1.isEditing() ? 0 : 1,
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
                <input
                    type="checkbox"
                    name="checkbox"
                    id={this.getWidgetKey()}
                    onClick={(event: any) => {
                        // this.onCheckBoxClick(event);
                        this.handleOnClick(event);
                    }}
                    style={{
                        width: this.getAllText()["size"],
                        height: this.getAllText()["size"],
                    }}
                    // checked={this.getBitValue()}
                    checked={this.getCheckedState()}
                ></input>
                {/* <label htmlFor={this.getWidgetKey()}>{this.getAllText()["text"]}</label> */}
                <label htmlFor={this.getWidgetKey()}>{this.getLabel()}</label>
            </form>
        );
    };

    getCheckedState = () => {
        const bitValue = this.getBitValue();

        if (bitValue === undefined) {
            return false;
        } else {
            if (this.getAllText()["bit"] > -1) {
                if (bitValue === 0) {
                    return false;
                } else if (bitValue === 1) {
                    return true;
                } else {
                    return false;
                }
            } else {
                if (bitValue === this.getAllText()["onValue"]) {
                    return true;
                } else {
                    return false;
                }
                // const index = this.getItemValues().indexOf(bitValue);
                // if (index === 0) {
                // 	return false;
                // } else if (index === 1) {
                // 	return true;
                // } else {
                // 	return false;
                // }
            }
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

    getLabel = () => {
        if (g_widgets1.isEditing()) {
            return this.getAllText()["text"];
        }

        const bitValue = this.getBitValue();
        if (bitValue === undefined) {
            return "Error";
        } else {
            if (this.getAllText()["bit"] > -1) {
                // bitValue must be 0 or 1, which can be the index
                if (bitValue === this.getAllText()["onValue"]) {
                    return this.getAllText()["onLabel"];
                } else {
                    return this.getAllText()["offLabel"];
                }
                // return this.getItemLabels()[bitValue];
            } else {
                // bitValue is the whole channel value
                if (bitValue === this.getAllText()["onValue"]) {
                    return this.getAllText()["onLabel"];
                } else if (bitValue === this.getAllText()["offValue"]) {
                    return this.getAllText()["offLabel"];
                } else {
                    return `${bitValue}`;
                }
                // const index = this.getItemValues().indexOf(bitValue);
                // if (index > -1) {
                // 	return this.getItemLabels()[index];
                // } else {

                // }
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
        let newChannelValue = this.getAllText()["offValue"]; // this.getItemValues()[0];


        if (oldBitValue === undefined || typeof oldChannelValue !== "number") {
            // write to channel anyway
            newChannelValue = this.getAllText()["offValue"]; // this.getItemValues()[0];
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
                if (oldBitValue === this.getAllText()["onValue"]) {
                    newChannelValue = this.getAllText()["offValue"];
                } else if (oldBitValue === this.getAllText()["offValue"]) {
                    newChannelValue = this.getAllText()["onValue"];
                } else {
                    newChannelValue = this.getAllText()["offValue"];
                }
                // whole value, oldBitValue could be any number
                // const index = this.getItemValues().indexOf(oldBitValue);
                // if (index < 0) {
                // 	// fallback to 0-th value
                // 	console.log("fallback to 0th value", this.getItemValues()[0]);
                // 	newChannelValue = this.getItemValues()[0];
                // } else {
                // 	newChannelValue = this.getItemValues()[Math.abs(index - 1)];
                // }
            }
        }

        this.putChannelValue(this.getChannelNames()[0], newChannelValue);
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

    static _defaultTdl: type_CheckBox_tdl = {
        type: "CheckBox",
        widgetKey: "",
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
            backgroundColor: "rgba(128, 255, 255, 0)",
            // angle
            transform: "rotate(0deg)",
            // font
            color: "rgba(0,0,0,1)",
            fontFamily: GlobalVariables.defaultFontFamily,
            fontSize: GlobalVariables.defaultFontSize,
            fontStyle: GlobalVariables.defaultFontStyle,
            fontWeight: GlobalVariables.defaultFontWeight,
            // border, it is different from the alarmBorder below
            borderStyle: "solid",
            borderWidth: 0,
            borderColor: "rgba(0, 0, 0, 1)",
            // shows when the widget is selected
            outlineStyle: "none",
            outlineWidth: 1,
            outlineColor: "black",
        },
        text: {
            horizontalAlign: "flex-start",
            verticalAlign: "flex-start",
            wrapWord: false,
            showUnit: false,
            alarmBorder: true,
            bit: 0,
            // round button size
            size: 12,
            text: "Label",
            invisibleInOperation: false,
            onLabel: "On",
            offLabel: "Off",
            onValue: 1,
            offValue: 0,
            confirmOnWrite: false,
            confirmOnWriteUsePassword: false,
            confirmOnWritePassword: "",
        },
        channelNames: [],
        groupNames: [],
        rules: [],
    };

    // override
    static generateDefaultTdl = (type: string) => {
        // defines type, widgetKey, and key
        const result = super.generateDefaultTdl(type);
        result.style = JSON.parse(JSON.stringify(this._defaultTdl.style));
        result.text = JSON.parse(JSON.stringify(this._defaultTdl.text));
        result.channelNames = JSON.parse(JSON.stringify(this._defaultTdl.channelNames));
        result.groupNames = JSON.parse(JSON.stringify(this._defaultTdl.groupNames));
        return result;
    };

    // overload
    getTdlCopy(newKey: boolean = true): Record<string, any> {
        const result = super.getTdlCopy(newKey);
        // result["itemValues"] = JSON.parse(JSON.stringify(this.getItemValues()));
        // result["itemLabels"] = JSON.parse(JSON.stringify(this.getItemLabels()));
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

    // getItemLabels = () => {
    // 	return this._itemLabels;
    // };
    // getItemValues = () => {
    // 	return this._itemValues;
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
            this._sidebar = new CheckBoxSidebar(this);
        }
    }
}
