import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { SpinnerSidebar } from "./SpinnerSidebar";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { SpinnerRules } from "./SpinnerRules";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { GlobalVariables } from "../../../common/GlobalVariables";
import { Log } from "../../../common/Log";
import { ElementRectangleButton } from "../../helperWidgets/SharedElements/RectangleButton";

export type type_Spinner_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
};

export class Spinner extends BaseWidget {
    showSettings: boolean = false;
    mouseDownIntervalTimer: any = undefined;
    readonly mouseDownDelay: number = 500; // ms

    _rules: SpinnerRules;

    constructor(widgetTdl: type_Spinner_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this.setReadWriteType("write");

        this._rules = new SpinnerRules(this, widgetTdl);
    }

    // ------------------------------ elements ---------------------------------

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
                    {this._showSidebar() ? this.getSidebar()?.getElement() : null}
                </>
            </ErrorBoundary>
        );
    };

    _ElementBodyRaw = (): React.JSX.Element => {
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
                    color: this._getElementAreaRawTextStyle(),
                    backgroundColor: this.getAllText()["invisibleInOperation"] ? "rgba(0,0,0,0)" : this._getElementAreaRawBackgroundStyle(),
                }}
                // title={"tooltip"}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                <this._ElementSpinner></this._ElementSpinner>
                {this.showSettings === true ? <this._ElementSettings></this._ElementSettings> : null}
            </div>
        );
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
                    opacity: this.getAllText()["invisibleInOperation"] === true && !g_widgets1.isEditing() ? 0 : 1,
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
                        if (this._getChannelAccessRight() < 1.5) {
                            return;
                        }
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
                    onMouseOver={(event: any) => {
                        if (!g_widgets1.isEditing()) {
                            event.preventDefault();
                            if (this._getChannelAccessRight() < 1.5) {
                                event.target.style["cursor"] = "not-allowed";
                            }
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
                            cursor: "pointer",
                        }}
                        onMouseDown={(event: any) => {
                            event.preventDefault();

                            if (event.button !== 0) {
                                return;
                            }
                            if (this._getChannelAccessRight() < 1.5) {
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
                            cursor: "pointer",
                        }}
                        onMouseDown={(event: any) => {
                            event.preventDefault();

                            if (event.button !== 0) {
                                return;
                            }

                            if (this._getChannelAccessRight() < 1.5) {
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
        const keyRef = React.useRef<HTMLInputElement>(null);

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
            if (this._getChannelAccessRight() < 1.5) {
                return;
            }
            this.putChannelValue(this.getChannelNames()[0], value);
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
                {/* <this._StyledInputInLine */}
                <input
                    ref={keyRef}
                    style={{
                        backgroundColor: "rgba(0,0,0,0)",
                        border: "none",
                        width: "100%",
                        height: "100%",
                        padding: 0,
                        margin: 0,
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        outline: "none",
                        textAlign:
                            this.getAllText().horizontalAlign === "flex-start"
                                ? "left"
                                : this.getAllText().horizontalAlign === "center"
                                    ? "center"
                                    : "right",
                        color: this._getElementAreaRawTextStyle(),
                        fontFamily: this.getAllStyle()["fontFamily"],
                        fontSize: this.getAllStyle()["fontSize"],
                        fontStyle: this.getAllStyle()["fontStyle"],
                        fontWeight: this.getAllStyle()["fontWeight"],

                    }}
                    onMouseOver={(event: any) => {
                        event.preventDefault();
                        if (!g_widgets1.isEditing()) {
                            if (this._getChannelAccessRight() < 1.5) {
                                event.target.style["cursor"] = "not-allowed";
                            } else {
                                event.target.style["cursor"] = "text";
                            }
                        } else {
                            event.target.style["cursor"] = "default";
                        }
                    }}
                    onMouseOut={(event: any) => {
                        event.preventDefault();
                        event.target.style["cursor"] = "default";
                    }}
                    // isEditing={g_widgets1.isEditing()}
                    // textAlign={
                    // 	this.getAllText().horizontalAlign === "flex-start" ? "left" : this.getAllText().horizontalAlign === "center" ? "center" : "right"
                    // }
                    // highlightBackgroundColor={this.getAllText().highlightBackgroundColor}
                    type="text"
                    name="value"
                    value={value}
                    onFocus={(event: any) => {
                        isFocused.current = true;
                        keyRef.current?.select();
                        event.target.style["backgroundColor"] = this.getAllText().highlightBackgroundColor;
                    }}
                    onChange={(event: any) => {
                        event.preventDefault();
                        if (this._getChannelAccessRight() < 1.5) {
                            return;
                        }
                        setValue(event.target.value);
                    }}
                    onBlur={(event: any) => {
                        isFocused.current = false;
                        setValue(`${valueRaw}`);
                        event.target.style["backgroundColor"] = `rgba(0,0,0,0)`;
                    }}
                />
            </form>
        );
    };

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
                // password is not honored
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
                    <ElementRectangleButton
                        handleClick={(event: any) => {
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
                            this.getText()["stepSize"] = stepSize;
                            this.closeSettings();
                        }}
                    >
                        OK
                    </ElementRectangleButton>

                    <ElementRectangleButton
                        handleClick={(event: any) => {
                            event?.preventDefault();
                            this.closeSettings();
                        }}
                    >
                        Cancel
                    </ElementRectangleButton>
                </div>
            </div>
        );
    };

    // concretize abstract method
    _Element = React.memo(this._ElementRaw, () => this._useMemoedElement());
    _ElementArea = React.memo(this._ElementAreaRaw, () => this._useMemoedElement());
    _ElementBody = React.memo(this._ElementBodyRaw, () => this._useMemoedElement());

    // -------------------- helper functions ----------------

    _getChannelValue = (raw: boolean = false) => {
        // const channelValue = this.getChannelValueForMonitorWidget(raw);
        const channelValue = this._getFirstChannelValue();
        if (typeof channelValue === "number") {
            const scale = Math.max(this.getAllText()["scale"], 0);
            const format = this.getAllText()["format"];
            if (format === "decimal") {
                return channelValue.toFixed(scale);
            } else if (format === "default") {
                const channelName = this.getChannelNames()[0];
                const defaultScale = g_widgets1.getChannelPrecision(channelName);
                if (defaultScale !== undefined) {
                    return channelValue.toFixed(defaultScale);
                } else {
                    return channelValue.toFixed(scale);
                }
            } else if (format === "exponential") {
                return channelValue.toExponential(scale);
            } else if (format === "hexadecimal") {
                return `0x${channelValue.toString(16)}`;
            } else {
                return channelValue;
            }
        } else {
            return channelValue;
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

        const defaultTdl: type_Spinner_tdl = {
            type: "Spinner",
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
                stepSize: 1,
                invisibleInOperation: false,
                // decimal, exponential, hexadecimal
                format: "default",
                // scale, >= 0
                scale: 0,
                alarmBorder: true,
                alarmText: false,
                alarmBackground: false,
                alarmLevel: "MINOR",
                confirmOnWrite: false,
                confirmOnWriteUsePassword: false,
                confirmOnWritePassword: "",
            },
            channelNames: [],
            groupNames: [],
            rules: [],
        };
        return JSON.parse(JSON.stringify(defaultTdl));
    };

    generateDefaultTdl: () => any = Spinner.generateDefaultTdl;

    // -------------------------- sidebar ---------------------------
    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new SpinnerSidebar(this);
        }
    }
}
