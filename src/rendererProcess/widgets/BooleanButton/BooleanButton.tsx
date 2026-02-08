import * as GlobalMethods from "../../../common/GlobalMethods";
import { GlobalVariables } from "../../../common/GlobalVariables";
import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { BooleanButtonSidebar } from "./BooleanButtonSidebar";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { BooleanButtonRules } from "./BooleanButtonRules";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { Log } from "../../../common/Log";

export type type_BooleanButton_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
};

export class BooleanButton extends BaseWidget {
    channelItemsUpdated: boolean = false;

    _rules: BooleanButtonRules;

    constructor(widgetTdl: type_BooleanButton_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this.setReadWriteType("write");

        this._rules = new BooleanButtonRules(this, widgetTdl);
    }

    // ------------------------------ elements ---------------------------------

    // concretize abstract method
    _ElementRaw = () => {

        // guard the widget from double rendering
        this.widgetBeingRendered = true;
        React.useEffect(() => {
            this.widgetBeingRendered = false;
        });
        g_widgets1.removeFromForceUpdateWidgets(this.getWidgetKey());

        this.updateAllStyleAndText();

        return (
            <ErrorBoundary style={this.getStyle()} widgetKey={this.getWidgetKey()}>
                <>
                    <this._ElementBody></this._ElementBody>
                    {this.showSidebar() ? this.getSidebar()?.getElement() : null}
                </>
            </ErrorBoundary>
        );
    };

    _ElementBodyRaw = (): React.JSX.Element => {
        return (
            // always update the div below no matter the TextUpdateBody is .memo or not
            // TextUpdateResizer does not update if it is .memo
            <div style={this.getElementBodyRawStyle()}>
                <this._ElementArea></this._ElementArea>
                {this.showResizers() ? <this._ElementResizer /> : null}
            </div>
        );
    };

    // only shows the text, all other style properties are held by upper level _ElementBodyRaw
    _ElementAreaRaw = ({ }: any): React.JSX.Element => {
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
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                <this._ElementBooleanButton></this._ElementBooleanButton>
            </div>
        );
    };

    getLabelsAndValues = () => {
        const result = {
            offLabel: this.getAllText()["offLabel"],
            onLabel: this.getAllText()["onLabel"],
            offValue: this.getAllText()["offValue"],
            onValue: this.getAllText()["onValue"],
        };

        if (!g_widgets1.isEditing()) {
            const channelName = this.getChannelNames()[0];
            if (this.getAllText()["useChannelItems"]) {
                try {
                    const channel = g_widgets1.getTcaChannel(channelName);
                    const strs = channel.getEnumChoices();
                    const numberOfStringsUsed = channel.getNumerOfStringsUsed();
                    if (this.getAllText()["useChannelItems"] === true && strs.length > 0 && numberOfStringsUsed !== undefined) {
                        // update itemNames and itemValues
                        result["offLabel"] = strs[0];
                        result["onLabel"] = strs[1];
                        result["offValue"] = 0;
                        result["onValue"] = 1;
                    }
                } catch (e) {
                    Log.error(e);
                }
            }
        }

        return result;
    };

    buttonPressed: boolean = false;

    _ElementBooleanButton = () => {
        const channelName = this.getChannelNames()[0];
        const elementRef = React.useRef<any>(null);
        const elementRefLabel = React.useRef<any>(null);
        const [, forceUpdate] = React.useState({});

        const shadowWidth = 2;
        const calcWidth = () => {
            const width = this.getAllStyle()["width"];
            if (this.getAllText()["appearance"] === "traditional") {
                return width - 2 * shadowWidth;
            } else {
                return width;
            }
        }
        const calcHeight = () => {
            const height = this.getAllStyle()["height"];
            if (this.getAllText()["appearance"] === "traditional") {
                return height - 2 * shadowWidth;
            } else {
                return height;
            }
        }

        const valueIsOn = this.valueIsOn()
        const valueIsLegal = this.valueIsLegal();
        const highlightColor = (this.getAllText()["invisibleInOperation"] === true && g_widgets1.isEditing() === false) ? "rgba(0,0,0,0)" : "rgba(255,255,255,1)";
        const shadowColor = (this.getAllText()["invisibleInOperation"] === true && g_widgets1.isEditing() === false) ? "rgba(0,0,0,0)" : "rgba(100,100,100,1)";
        const calcBorderBottomRight = () => {
            if (this.getAllText()["appearance"] === "traditional") {
                if (this.getAllText()["mode"] === "push and reset" || this.getAllText()["mode"] === "push no reset" || this.getAllText()["mode"] === "push nothing and set") {
                    if (this.buttonPressed) {
                        return `solid ${shadowWidth}px ${highlightColor}`;
                    } else {
                        return `solid ${shadowWidth}px ${shadowColor}`;
                    }
                }

                if (this.getAllText()["mode"] === "push and reset") {
                    if (this.buttonPressed) {
                        return `solid ${shadowWidth}px ${highlightColor}`;
                    } else {
                        return `solid ${shadowWidth}px ${shadowColor}`;
                    }
                } else if (this.getAllText()["mode"] === "push no reset") {
                    if (this.buttonPressed) {
                        return `solid ${shadowWidth}px ${highlightColor}`;
                    } else {
                        if (valueIsOn) {
                            return `solid ${shadowWidth}px ${highlightColor}`;
                        } else {
                            return `solid ${shadowWidth}px ${shadowColor}`;
                        }
                    }
                } else if (this.getAllText()["mode"] === "push nothing and set") {
                    if (this.buttonPressed) {
                        return `solid ${shadowWidth}px ${highlightColor}`;
                    } else {
                        return `solid ${shadowWidth}px ${shadowColor}`;
                    }
                } else if (this.getAllText()["mode"] === "toggle") {
                    if (valueIsOn) {
                        return `solid ${shadowWidth}px ${highlightColor}`;
                    } else {
                        return `solid ${shadowWidth}px ${shadowColor}`;
                    }
                } else {
                    return "none";
                }
            } else {
                return "none";
            }
        }

        const calcBorderTopLeft = () => {
            if (this.getAllText()["appearance"] === "traditional") {
                if (this.getAllText()["mode"] === "push and reset" || this.getAllText()["mode"] === "push no reset" || this.getAllText()["mode"] === "push nothing and set") {
                    if (this.buttonPressed) {
                        return `solid ${shadowWidth}px ${shadowColor}`;
                    } else {
                        return `solid ${shadowWidth}px ${highlightColor}`;
                    }
                }
                if (this.getAllText()["mode"] === "push and reset") {
                    if (this.buttonPressed) {
                        return `solid ${shadowWidth}px ${shadowColor}`;
                    } else {
                        return `solid ${shadowWidth}px ${highlightColor}`;
                    }
                } else if (this.getAllText()["mode"] === "push no reset") {
                    if (this.buttonPressed) {
                        return `solid ${shadowWidth}px ${shadowColor}`;
                    } else {
                        if (valueIsOn) {
                            return `solid ${shadowWidth}px ${shadowColor}`;
                        } else {
                            return `solid ${shadowWidth}px ${highlightColor}`;
                        }
                    }
                } else if (this.getAllText()["mode"] === "push nothing and set") {
                    if (this.buttonPressed) {
                        return `solid ${shadowWidth}px ${shadowColor}`;
                    } else {
                        return `solid ${shadowWidth}px ${highlightColor}`;
                    }
                } else if (this.getAllText()["mode"] === "toggle") {
                    if (valueIsOn) {
                        return `solid ${shadowWidth}px ${shadowColor}`;
                    } else {
                        return `solid ${shadowWidth}px ${highlightColor}`;
                    }
                } else {
                    return "none";
                }
            } else {
                return "none";
            }
        }


        const calcOutline = () => {
            if (this.getAllText()["appearance"] === "traditional") {
                if (this.getAllText()["invisibleInOperation"] === true && g_widgets1.isEditing() === false) {
                    return "none";
                } else {
                    return "solid 1px rgba(100, 100, 100, 0.5)";
                }
            } else {
                return "none";
            }
        }

        const calcLedFullSize = () => {
            return Math.min(this.getAllStyle()["width"], this.getAllStyle()["height"]) * 0.5;
        }

        const ledFullSize = calcLedFullSize();

        return (
            <div
                ref={elementRef}
                style={{
                    display: "inline-flex",
                    width: calcWidth(),
                    height: calcHeight(),
                    outline: calcOutline(),
                    borderRight: calcBorderBottomRight(),
                    borderBottom: calcBorderBottomRight(),
                    borderLeft: calcBorderTopLeft(),
                    borderTop: calcBorderTopLeft(),
                    alignItems: this.getAllText()["verticalAlign"],
                    justifyContent: this.getAllText()["horizontalAlign"],
                    backgroundColor:
                        this.getAllText()["showLED"] === true
                            ? "rgba(0,0,0,0)"
                            : this.getAllText()["invisibleInOperation"] === true && g_widgets1.isEditing() === false
                                ? "rgba(0,0,0,0)"
                                : // : this.calcColor(),
                                this.getButtonBackgroundColor(),
                }}
                onMouseDown={(event: any) => {
                    if (g_widgets1.isEditing() === true) {
                        return;
                    }
                    this.buttonPressed = true;
                    this.handleMouseDownOnButton(event);

                    if (this._getChannelAccessRight() < 1.5) {
                        return;
                    }
                    forceUpdate({});
                }}
                onMouseUp={(event: any) => {
                    if (g_widgets1.isEditing() === true) {
                        return;
                    }
                    this.buttonPressed = false;
                    this.handleMouseUpOnButton(event);
                    if (this._getChannelAccessRight() < 1.5) {
                        return;
                    }
                    forceUpdate({});
                }}
                // do not use onMouseOver, which also applies to the children elements
                onMouseEnter={(event: any) => {
                    event.preventDefault();
                    if (!g_widgets1.isEditing() && elementRef.current !== null) {
                        elementRef.current.style["outlineStyle"] = "solid";
                        elementRef.current.style["outlineWidth"] = "3px";
                        elementRef.current.style["outlineColor"] = "rgba(105,105,105,1)";
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
                        elementRef.current.style["outline"] = calcOutline();
                        elementRef.current.style["cursor"] = "default";
                    }
                }}
            >
                <div
                    style={{
                        position: "relative",
                        display: "inline-flex",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: this.getAllText()["invisibleInOperation"] === true && g_widgets1.isEditing() === false ? 0 : 1,
                    }}
                >
                    {this.getAllText()["showLED"] === true ? (
                        this.getAllText()["usePictures"] === true ? (
                            <>
                                <img
                                    width={ledFullSize}
                                    height={ledFullSize}
                                    style={{
                                        objectFit: "scale-down",
                                    }}
                                // src={this.calcPicture()}
                                ></img>
                                &nbsp;
                            </>
                        ) : (
                            <>
                                <div
                                    style={{
                                        width: ledFullSize,
                                        height: ledFullSize,
                                        display: "inline-flex",
                                        borderRadius: ledFullSize / 2,
                                        backgroundColor: this.getButtonBackgroundColor(),
                                        // backgroundColor: this.calcColor(),
                                        border: "solid 1px rgba(30,30,30,1)",
                                    }}
                                ></div>{" "}
                                &nbsp;
                            </>
                        )
                    ) : null}

                    {/* <div>{this.calcLabel()}</div> */}
                    <div>{this.getLabel()}</div>
                </div>
            </div>
        );
    };

    // -------------------------------------------

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
                }
            }
        } catch (e) {
            Log.error(e);
        }
        return undefined;
    };

    valueIsOn = (): boolean => {
        if (g_widgets1.isEditing()) {
            return false;
        }
        const bitValue = this.getBitValue();
        if (bitValue === undefined) {
            return false;
        } else {
            if (this.getAllText()["bit"] > -1) {
                // bitValue must be 0 or 1, which can be the index
                if (bitValue === 1) {
                    return true;
                } else {
                    return false;
                }
            } else {
                // bitValue is the whole channel value
                if (bitValue === this.getLabelsAndValues()["offValue"]) {
                    return false;
                } else {
                    return true;
                }
            }
        }
    }

    valueIsLegal = (): boolean => {
        if (g_widgets1.isEditing()) {
            return true;
        }
        const bitValue = this.getBitValue();
        if (bitValue === undefined) {
            return false;
        } else {
            if (this.getAllText()["bit"] > -1) {
                // bitValue must be 0 or 1, which can be the index
                if (bitValue === 1 || bitValue === 0) {
                    return true;
                } else {
                    return false;
                }
            } else {
                // bitValue is the whole channel value
                if (bitValue === this.getLabelsAndValues()["onValue"] || bitValue === this.getLabelsAndValues()["offValue"]) {
                    return true;
                } else {
                    return false;
                }
            }
        }
    }


    getLabel = () => {
        if (this.getAllText()["mode"] === "push and reset" || this.getAllText()["mode"] === "push no reset" || this.getAllText()["mode"] === "push nothing and set") {
            if (this.buttonPressed) {
                return this.getLabelsAndValues()["onLabel"];
            } else {
                return this.getLabelsAndValues()["offLabel"];
            }
            // }
        } else if (this.getAllText()["mode"] === "toggle") {
            const valueIsOn = this.valueIsOn();
            if (valueIsOn) {
                return this.getLabelsAndValues()["onLabel"];
            } else {
                return this.getLabelsAndValues()["offLabel"];
            }
        }
    };

    // button's background color, if the button is now shown, it becomes the rectangle's background color
    getButtonBackgroundColor = () => {
        const valueIsLegal = this.valueIsLegal();
        if (valueIsLegal === false) {
            // return this.getAllText()["fallbackColor"];
        }
        if (this.getAllText()["mode"] === "push and reset" || this.getAllText()["mode"] === "push no reset" || this.getAllText()["mode"] === "push nothing and set") {
            if (this.buttonPressed) {
                return this.getAllText()["onColor"];
            } else {
                return this.getAllText()["offColor"];
            }
        } else {
            const valueIsOn = this.valueIsOn();
            if (valueIsOn) {
                return this.getAllText()["onColor"];
            } else {
                return this.getAllText()["offColor"];
            }
        }
    };

    handleMouseDownOnButton = (event: any) => {
        event.preventDefault();
        if (event.button !== 0) {
            return;
        }

        if (g_widgets1.isEditing()) {
            return;
        }

        if (this._getChannelAccessRight() < 1.5) {
            return;
        }

        const oldBitValue = this.getBitValue();
        const bit = this.getAllText()["bit"];
        const oldChannelValue = this._getChannelValue(true);
        let newChannelValue = this.getLabelsAndValues()["offValue"];

        if (oldBitValue === undefined || typeof oldChannelValue !== "number") {
            // write to channel anyway
            newChannelValue = this.getLabelsAndValues()["offValue"];
        } else {
            if (bit > -1) {
                // oldBitValue and newBitValue must be 0 or 1 in this case
                const newBitValue = Math.abs(oldBitValue - 1);
                if (this.getAllText()["mode"] === "toggle") {
                    if (newBitValue === 1) {
                        newChannelValue = Math.floor(oldChannelValue) | (1 << bit);
                    } else {
                        newChannelValue = Math.floor(oldChannelValue) & ~(1 << bit);
                    }
                } else if (this.getAllText()["mode"] === "push and reset" || this.getAllText()["mode"] === "push no reset") {
                    newChannelValue = Math.floor(oldChannelValue) | (1 << bit);
                } else if (this.getAllText()["mode"] === "push nothing and set") {
                    return;
                } else {
                    return;
                }
            } else {
                // whole value, oldBitValue could be any number
                if (this.getAllText()["mode"] === "toggle") {
                    if (oldBitValue !== this.getLabelsAndValues()["onValue"]) {
                        newChannelValue = this.getLabelsAndValues()["onValue"];
                    } else {
                        newChannelValue = this.getLabelsAndValues()["offValue"];
                    }
                } else if (this.getAllText()["mode"] === "push and reset" || this.getAllText()["mode"] === "push no reset") {
                    newChannelValue = this.getLabelsAndValues()["onValue"];
                } else if (this.getAllText()["mode"] === "push nothing and set") {
                    return;
                } else {
                    return;
                }
            }
        }

        this.putChannelValue(this.getChannelNames()[0], newChannelValue);
    };

    handleMouseUpOnButton = (event: any) => {
        event.preventDefault();
        if (event.button !== 0) {
            return;
        }

        if (g_widgets1.isEditing()) {
            return;
        }

        if (this._getChannelAccessRight() < 1.5) {
            return;
        }

        const oldBitValue = this.getBitValue();
        const bit = this.getAllText()["bit"];
        const oldChannelValue = this._getChannelValue(true);
        let newChannelValue = this.getLabelsAndValues()["offValue"];

        if (oldBitValue === undefined || typeof oldChannelValue !== "number") {
            // write to channel anyway
            newChannelValue = this.getLabelsAndValues()["offValue"];
        } else {
            if (bit > -1) {
                // oldBitValue and newBitValue must be 0 or 1 in this case
                const newBitValue = Math.abs(oldBitValue - 1);
                if (this.getAllText()["mode"] === "toggle" || this.getAllText()["mode"] === "push no reset") {
                    // do nothing on mouse up in "toggle", "push no reset" modes
                    // and stop here
                    return;
                } else if (this.getAllText()["mode"] === "push and reset" || this.getAllText()["mode"] === "push nothing and set") {
                    newChannelValue = Math.floor(oldChannelValue) & ~(1 << bit);
                } else {
                    return;
                }
            } else {
                // whole value, oldBitValue could be any number
                if (this.getAllText()["mode"] === "toggle" || this.getAllText()["mode"] === "push no reset") {
                    // do nothing 
                    // and stop here
                    return;
                } else if (this.getAllText()["mode"] === "push and reset" || this.getAllText()["mode"] === "push nothing and set") {
                    newChannelValue = this.getLabelsAndValues()["offValue"];
                } else {
                    return;
                }
            }
        }

        try {
            const channelName = this.getChannelNames()[0];
            const tcaChannel = g_widgets1.getTcaChannel(channelName);
            const displayWindowId = g_widgets1.getRoot().getDisplayWindowClient().getWindowId();

            // intercepted by confirm write
            const value = newChannelValue;
            if (this.getAllText()["confirmOnWrite"] === true) {
                const ipcManager = g_widgets1.getRoot().getDisplayWindowClient().getIpcManager();
                const humanReadableMessage1 = "You are about to change " + this.getChannelNames()[0] + " to " + `${value}`;
                // requires password
                if (this.getAllText()["confirmOnWriteUsePassword"] === true) {
                    const humanReadableMessage2 = "A password is required."
                    const password = this.getAllText()["confirmOnWritePassword"];
                    ipcManager.handleDialogShowInputBox(undefined,
                        {
                            info:
                            {
                                command: "write-pv-confirmation-with-password",
                                humanReadableMessages: [humanReadableMessage1, humanReadableMessage2],
                                buttons: [
                                    {
                                        text: "OK",
                                        handleClick: (dialogInputText?: string) => {
                                            if (dialogInputText !== password) {
                                                // password does not match
                                                ipcManager.handleDialogShowMessageBox(undefined,
                                                    {
                                                        info:
                                                        {
                                                            command: "write-pv-confirmation-wit-password-failed",
                                                            humanReadableMessages: ["Wrong password."],
                                                            buttons: [
                                                                {
                                                                    text: "OK",
                                                                    handleClick: () => {
                                                                    },
                                                                },
                                                            ],
                                                            messageType: "error",
                                                            rawMessages: [],
                                                            attachment: undefined,
                                                        }
                                                    }
                                                )

                                                return;
                                            }
                                            try {
                                                tcaChannel.put(displayWindowId, { value: value }, 1);
                                            } catch (e) {
                                                Log.error(e);
                                            }
                                        },
                                    }
                                ],
                                defaultInputText: "",
                                attachment: undefined,
                            }
                        }
                    )
                } else {
                    // password not required
                    const humanReadableMessage2 = "Are you sure to continue?"
                    ipcManager.handleDialogShowMessageBox(undefined,
                        {
                            info:
                            {
                                command: "write-pv-confirmation-without-password",
                                humanReadableMessages: [humanReadableMessage1, humanReadableMessage2],
                                buttons: [
                                    {
                                        text: "Yes",
                                        handleClick: () => {
                                            try {
                                                tcaChannel.put(displayWindowId, { value: value }, 1);
                                            } catch (e) {
                                                Log.error(e);
                                            }
                                        },
                                    },
                                    {
                                        text: "No",
                                        handleClick: () => {
                                        },
                                    }
                                ],
                                messageType: "info",
                                rawMessages: [],
                                attachment: undefined,
                            }
                        }
                    )

                }
                return;
            }


            const dbrData = {
                value: newChannelValue,
            };
            tcaChannel.put(displayWindowId, dbrData, 1);
        } catch (e) {
            Log.error(e);
        }
    };


    handleSelectAFile = (options: Record<string, any>, fileName: string) => {
        const itemIndex = options["itemIndex"];
        const sidebar = this.getSidebar();
        if (typeof itemIndex === "number" && sidebar !== undefined) {
            (sidebar as BooleanButtonSidebar).setBeingUpdatedItemIndex(itemIndex);
            sidebar.updateFromWidget(undefined, "select-a-file", fileName);
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
    // showSidebar()
    // showResizers()
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

    // -------------------------- tdl -------------------------------

    static generateDefaultTdl = () => {

        const defaultTdl: type_BooleanButton_tdl = {
            type: "BooleanButton",
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
                backgroundColor: "rgba(210, 210, 210, 1)",
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
                outlineColor: "rgba(0,0,0,1)",
            },
            text: {
                // the LED indicator or picture position and size
                horizontalAlign: "center",
                verticalAlign: "center",
                // text styles
                wrapWord: false,
                showUnit: false,
                // if we want to use the itemLabels and itemValues from channel
                useChannelItems: false,
                // use picture instead of colors
                usePictures: false,
                showLED: true,
                // which bit to show, -1 means using the channel value
                bit: 0,
                alarmBorder: true,
                // toggle/push and reset/push no reset/push nothing and set/
                mode: "toggle",
                // when the channel is not connected
                fallbackColor: "rgba(255,0,255,1)",
                // becomes not visible in operation mode, but still clickable
                invisibleInOperation: false,
                // items, each category has 2 items
                onLabel: "On",
                offLabel: "Off",
                onValue: 1,
                offValue: 0,
                onColor: "rgba(60, 255, 60, 1)",
                offColor: "rgba(60, 100, 60, 1)",
                onPicture: "", // not implemented yet
                offPicture: "",
                // "contemporary" | "traditional"
                appearance: "traditional",
                confirmOnWrite: false,
                confirmOnWriteUsePassword: false,
                confirmOnWritePassword: "",
            },
            channelNames: [],
            groupNames: [],
            rules: [],
        };
        defaultTdl["widgetKey"] = GlobalMethods.generateWidgetKey(defaultTdl["type"]);
        return JSON.parse(JSON.stringify(defaultTdl));
    };

    generateDefaultTdl: () => any = BooleanButton.generateDefaultTdl;

    // -------------------------- sidebar ---------------------------
    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new BooleanButtonSidebar(this);
        }
    }
}
