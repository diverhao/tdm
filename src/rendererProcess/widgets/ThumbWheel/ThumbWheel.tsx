import { GlobalVariables } from "../../global/GlobalVariables";
import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { ThumbWheelSidebar } from "./ThumbWheelSidebar";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { ThumbWheelRules } from "./ThumbWheelRules";
import {Log} from "../../../mainProcess/log/Log";

export type type_ThumbWheel_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
};

export class ThumbWheel extends BaseWidget {
    showSettings: boolean = false;
    mouseDownIntervalTimer: any = undefined;
    readonly mouseDownDelay: number = 500; // ms

    _rules: ThumbWheelRules;

    constructor(widgetTdl: type_ThumbWheel_tdl) {
        super(widgetTdl);

        this.setStyle({ ...ThumbWheel._defaultTdl.style, ...widgetTdl.style });
        this.setText({ ...ThumbWheel._defaultTdl.text, ...widgetTdl.text });

        this._rules = new ThumbWheelRules(this, widgetTdl);

        // assign the sidebar
        // this._sidebar = new ThumbWheelSidebar(this);
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
            <>
                <this._ElementBody></this._ElementBody>
                {this._showSidebar() ? this.getSidebar()?.getElement() : null}
            </>
        );
    };

    _ElementBodyRaw = (): React.JSX.Element => {
        return (
            // always update the div below no matter the TextUpdateBody is .memo or not
            // TextUpdateResizer does not update if it is .memo
            <div
                style={
                    this.getElementBodyRawStyle()
                }
            >
                {/* <this._ElementArea></this._ElementArea> */}
                <this._ElementAreaRaw></this._ElementAreaRaw>
                {this._showResizers() ? <this._ElementResizer /> : null}
            </div>
        );
    };

    // only shows the text, all other style properties are held by upper level _ElementBodyRaw
    _ElementAreaRaw = ({ }: any): React.JSX.Element => {
        // const [value, setValue] = React.useState(this._getChannelValue());
        // const isFocused = React.useRef<boolean>(false);

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
                    position: "relative",
                }}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                <this._ElementThumbWheel></this._ElementThumbWheel>
            </div>
        );
    };

    _ElementThumbWheel = () => {
        return <div>Thumb</div>;
    };

    _ElementSpinner = () => {
        const spinnerRef = React.useRef(null);
        return (
            <div
                style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                    left: 0,
                    top: 0,
                }}
            >
                <this._ValueInputForm
                    valueRaw={`${this._getChannelValue()} ${this.getAllText().showUnit ? this._getChannelUnit() : ""}`}
                ></this._ValueInputForm>
                <div
                    style={{
                        display: "inline-flex",
                        flexDirection: "column",
                        width: "20%",
                        height: "100%",
                        position: "relative",
                    }}
                    ref={spinnerRef}
                    tabIndex={0}
                    onKeyDown={(event: any) => {
                        if (event.key === "ArrowUp") {
                            this.changeChannelValue("positive");
                        } else if (event.key === "ArrowDown") {
                            this.changeChannelValue("negative");
                        }
                    }}
                    // focus the element so that we can use keyboard event
                    onMouseEnter={(event: any) => {
                        if (!g_widgets1.isEditing()) {
                            event.preventDefault();
                            (spinnerRef.current as any).focus();
                        }
                    }}
                    onMouseLeave={(event: any) => {
                        (spinnerRef.current as any).blur();
                    }}
                >
                    <div
                        style={{
                            display: "inline-flex",
                            width: "100%",
                            height: "50%",
                            justifyContent: "center",
                            alignItems: "center",
                            backgroundColor: "rgba(150,150,150,1)",
                            border: "solid 1px black",
                        }}
                        onMouseDown={(event: any) => {
                            event.preventDefault();

                            if (event.button !== 0) {
                                return;
                            }

                            const direction = "positive";
                            this.changeChannelValue(direction);
                            this.mouseDownIntervalTimer = setTimeout(() => {
                                this.changeChannelValue(direction);
                                clearInterval(this.mouseDownIntervalTimer);
                                clearTimeout(this.mouseDownIntervalTimer);
                                this.mouseDownIntervalTimer = setInterval(() => {
                                    this.changeChannelValue(direction);
                                }, this.mouseDownDelay / 4);
                            }, this.mouseDownDelay);
                        }}
                        onMouseUp={(event: any) => {
                            clearInterval(this.mouseDownIntervalTimer);
                            clearTimeout(this.mouseDownIntervalTimer);
                            this.mouseDownIntervalTimer = undefined;
                        }}
                        onMouseLeave={(event: any) => {
                            clearInterval(this.mouseDownIntervalTimer);
                            clearTimeout(this.mouseDownIntervalTimer);
                            this.mouseDownIntervalTimer = undefined;
                        }}
                    >
                        <div
                            style={{
                                width: 0,
                                height: 0,
                                borderLeft: `${this.getAllStyle()["width"] * 0.2 * 0.2}px solid transparent`,
                                borderRight: `${this.getAllStyle()["width"] * 0.2 * 0.2}px solid transparent`,
                                borderBottom: `${this.getAllStyle()["width"] * 0.2 * 0.2}px solid black`,
                            }}
                        ></div>
                    </div>
                    <div
                        style={{
                            display: "inline-flex",
                            width: "100%",
                            height: "50%",
                            justifyContent: "center",
                            alignItems: "center",
                            backgroundColor: "rgba(150,150,150,1)",
                            border: "solid 1px black",
                        }}
                        onMouseDown={(event: any) => {
                            event.preventDefault();

                            if (event.button !== 0) {
                                return;
                            }

                            const direction = "negative";
                            this.changeChannelValue(direction);
                            this.mouseDownIntervalTimer = setTimeout(() => {
                                this.changeChannelValue(direction);
                                clearInterval(this.mouseDownIntervalTimer);
                                clearTimeout(this.mouseDownIntervalTimer);
                                this.mouseDownIntervalTimer = setInterval(() => {
                                    this.changeChannelValue(direction);
                                }, this.mouseDownDelay / 4);
                            }, this.mouseDownDelay);
                        }}
                        onMouseUp={(event: any) => {
                            clearInterval(this.mouseDownIntervalTimer);
                            clearTimeout(this.mouseDownIntervalTimer);
                            this.mouseDownIntervalTimer = undefined;
                        }}
                        onMouseLeave={(event: any) => {
                            clearInterval(this.mouseDownIntervalTimer);
                            clearTimeout(this.mouseDownIntervalTimer);
                            this.mouseDownIntervalTimer = undefined;
                        }}
                    >
                        <div
                            style={{
                                width: 0,
                                height: 0,
                                borderLeft: `${this.getAllStyle()["width"] * 0.2 * 0.2}px solid transparent`,
                                borderRight: `${this.getAllStyle()["width"] * 0.2 * 0.2}px solid transparent`,
                                borderTop: `${this.getAllStyle()["width"] * 0.2 * 0.2}px solid black`,
                            }}
                        ></div>
                    </div>
                </div>
            </div>
        );
    };

    _ValueInputForm = ({ valueRaw }: { valueRaw: string | number | string[] | number[] }) => {
        const [value, setValue] = React.useState(`${valueRaw}`);
        const isFocused = React.useRef<boolean>(false);
        const keyRef = React.useRef<any>(null);

        React.useEffect(() => {
            setValue((oldValue: string) => {
                if (isFocused.current) {
                    return oldValue;
                } else {
                    return `${valueRaw}`;
                }
            });
        }, [valueRaw]);

        const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();

            (event.currentTarget.elements[0] as HTMLInputElement).blur();
            try {
                const tcaChannel = g_widgets1.getTcaChannel(this.getChannelNames()[0]);
                // if user includes the unit, the put() should be able to parseInt() or praseFloat()
                // the text before unit
                const displayWindowId = g_widgets1.getRoot().getDisplayWindowClient().getWindowId();
                tcaChannel.put(displayWindowId, { value: value }, 1);
            } catch (e) {
                Log.error(e);
            }
        };

        // press escape key to blur input box
        React.useEffect(() => {
            const blurOnEscapeKey = (event: any) => {
                if (event.key === "Escape") {
                    keyRef.current?.blur();
                }
            };
            document.addEventListener("keydown", blurOnEscapeKey);
            return () => {
                document.removeEventListener("keydown", blurOnEscapeKey);
            };
        }, []);

        return (
            <form onSubmit={handleSubmit} style={{ width: "80%", height: "100%" }}>
                <input
                    style={{
                        backgroundColor: "rgba(0, 0, 0, 0)",
                        border: "none",
                        width: "100%",
                        height: "100%",
                        padding: 0,
                        margin: 0,
                        // fontSize: 14,
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        outline: "none",
                        textAlign: this.getAllText().horizontalAlign === "flex-start" ? "left" : this.getAllText().horizontalAlign === "center" ? "center" : "right",
                        color: this.getAllStyle()["color"],
                        fontFamily: this.getAllStyle()["fontFamily"],
                        fontSize: this.getAllStyle()["fontSize"],
                        fontStyle: this.getAllStyle()["fontStyle"],
                        fontWeight: this.getAllStyle()["fontWeight"],
                        cursor: g_widgets1.isEditing()? "default" : "text",
                    }}
                    ref={keyRef}
                    // highlightBackgroundColor={this.getAllText().highlightBackgroundColor}
                    type="text"
                    name="value"
                    value={value}
                    onFocus={() => {
                        isFocused.current = true;
                        if (keyRef.current !== null) {
                            keyRef.current.select();
                            keyRef.current.style["backgroundColor"] = this.getAllText().highlightBackgroundColor;
                        }
                    }}
                    onChange={(event: any) => {
                        event.preventDefault();
                        setValue(event.target.value);
                    }}
                    onBlur={(event: any) => {
                        isFocused.current = false;
                        setValue(`${valueRaw}`);
                        if (keyRef.current !== null) {
                            keyRef.current.style["backgroundColor"] = "rgba(0,0,0,0)";
                        }
                    }}
                >
                    {/* /> */}
                </input>
            </form>
        );
    };


    // private _StyledInputInLine = styled.input<any>`
	// 	background-color: rgba(0, 0, 0, 0);
	// 	border: none;
	// 	width: 100%;
	// 	height: 100%;
	// 	padding: 0;
	// 	margin: 0;
	// 	font-size: 14px;
	// 	text-overflow: ellipsis;
	// 	overflow: hidden;
	// 	white-space: nowrap;
	// 	outline: none;
	// 	text-align: ${(props) => props.textAlign};
	// 	&:hover {
	// 		cursor: ${(props) => (props.isEditing ? "default" : "text")};
	// 	}
	// 	&:focus {
	// 		background-color: ${(props) => props.highlightBackgroundColor};
	// 	}
	// `;

    changeChannelValue = (direction: "positive" | "negative" | "nomove") => {
        const channelName = this.getChannelNames()[0];
        try {
            const channel = g_widgets1.getTcaChannel(channelName);
            const channelValue = g_widgets1.getChannelValue(channelName); // do not use raw = true option, enum value should not be expanded
            if (typeof channelValue === "number") {
                let newChannelValue = channelValue;
                if (direction === "negative") {
                    newChannelValue = channelValue - this.getAllText()["stepSize"];
                } else if (direction === "positive") {
                    newChannelValue = channelValue + this.getAllText()["stepSize"];
                } else {
                    // no move
                    return;
                }
                const displayWindowId = g_widgets1.getRoot().getDisplayWindowClient().getWindowId();
                const dbrData = {
                    value: newChannelValue,
                };
                channel.put(displayWindowId, dbrData, 1);
            }
        } catch (e) {
            Log.error(e);
        }
    };

    openSettings = () => {
        this.showSettings = true;
        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");
        g_flushWidgets();
    };

    closeSettings = () => {
        this.showSettings = false;
        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");
        g_flushWidgets();
    };

    _ElementSettings = () => {
        const [channelValue, setChannelValue] = React.useState<number>(parseFloat(this._getChannelValue(true) as string));
        const [stepSize, setStepSize] = React.useState<number>(this.getAllText()["stepSize"]);

        return (
            <div
                style={{
                    display: "inline-flex",
                    position: "absolute",
                    flexDirection: "column",
                    // right: -100,
                    // bottom: -20,
                    left: this.getAllStyle()["width"] + 0,
                    top: this.getAllStyle()["height"] + 0,
                    backgroundColor: "white",
                    width: 200,
                    fontSize: 15,
                    border: "solid 1px black",
                    padding: 5,
                    borderRadius: 5,
                    // height: 200,
                }}
            >
                <form
                    style={{
                        display: "inline-flex",
                        flexDirection: "row",
                        margin: "3px",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                    }}
                    onSubmit={(event: any) => {
                        event.preventDefault();
                    }}
                >
                    <label>Value: </label>
                    <input
                        style={{
                            width: "60%",
                            fontSize: 15,
                        }}
                        type="number"
                        name="stepSize"
                        step="any"
                        value={channelValue}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                            const newVal = event.target.value;
                            setChannelValue(parseFloat(newVal));
                        }}
                        // must use enter to change the value
                        onBlur={(event: any) => { }}
                    />
                </form>
                <form
                    style={{
                        display: "inline-flex",
                        flexDirection: "row",
                        margin: "3px",
                        width: "100%",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                    onSubmit={(event: any) => {
                        event.preventDefault();
                    }}
                >
                    <label>Step Size: </label>
                    <input
                        style={{
                            width: "60%",
                            fontSize: 15,
                        }}
                        type="number"
                        name="stepSize"
                        step="any"
                        value={stepSize}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                            const newVal = event.target.value;
                            setStepSize(parseFloat(newVal));
                        }}
                        // must use enter to change the value
                        onBlur={(event: any) => { }}
                    />
                </form>
                <div
                    style={{
                        display: "inline-flex",
                        flexDirection: "row",
                        margin: 3,
                        width: "100%",
                        justifyContent: "space-evenly",
                    }}
                >
                    <div
                        onClick={(event: any) => {
                            event.preventDefault();
                            try {
                                const channelName = this.getChannelNames()[0];
                                const channel = g_widgets1.getTcaChannel(channelName);
                                const windowId = g_widgets1.getRoot().getDisplayWindowClient().getWindowId();
                                channel.put(
                                    windowId,
                                    {
                                        value: channelValue,
                                    },
                                    1
                                );
                            } catch (e) {
                                Log.error(e);
                            }
                            this.getAllText()["stepSize"] = stepSize;
                            this.closeSettings();
                        }}
                    >
                        OK
                    </div>
                    <div
                        onClick={(event: any) => {
                            event?.preventDefault;
                            this.closeSettings();
                        }}
                    >
                        Cancel
                    </div>
                </div>
            </div>
        );
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

    // _getChannelValue = () => {
    // 	return this._getFirstChannelValue();
    // };

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

    // _getChannelUnit = () => {
    // 	return this._getFirstChannelUnit();
    // };

    // ----------------------- styles -----------------------

    // defined in super class
    // _resizerStyle
    // _resizerStyles
    // StyledToolTipText
    // StyledToolTip

    // -------------------------- tdl -------------------------------

    // override BaseWidget
    static _defaultTdl: type_ThumbWheel_tdl = {
        type: "ThumbWheel",
        widgetKey: "", // "key" is a reserved keyword
        key: "",
        // the style for outmost div
        // these properties are explicitly defined in style because they are
        // (1) different from default CSS settings, or
        // (2) they may be modified
        style: {
            position: "absolute",
            display: "inline-flex",
            backgroundColor: "rgba(128, 255, 255, 1)",
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
            showUnit: true,
            alarmBorder: true,
            // highlightBackgroundColor: "rgba(255, 255, 0, 1)",
            // minPvValue: 0,
            // maxPvValue: 10,
            // usePvLimits: false,
            // sliderBlockWidth: 40,
            // direction: "horizontal",
            // showPvValue: true,
            stepSize: 1,
            invisibleInOperation: false,
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

    // defined in super class
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

    // --------------------- sidebar --------------------------
    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new ThumbWheelSidebar(this);
        }
    }
}
