import { GlobalVariables } from "../../global/GlobalVariables";
import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { CalculatorSidebar } from "./CalculatorSidebar";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import * as mathjs from "mathjs";
import { Log } from "../../global/Log";

export type type_Calculator_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
};

type type_Calculator_key = {
    label: string;
    onClick: any;
    options: Record<string, any>;
};
export class Calculator extends BaseWidget {
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

    // _rules: TextUpdateRules;

    constructor(widgetTdl: type_Calculator_tdl) {
        super(widgetTdl);
        // this.setReadWriteType("read");

        this.setStyle({ ...Calculator._defaultTdl.style, ...widgetTdl.style });
        this.setText({ ...Calculator._defaultTdl.text, ...widgetTdl.text });

        // this._rules = new TextUpdateRules(this, widgetTdl);

        this._sidebar = new CalculatorSidebar(this);
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

    getElementFallbackFunction = () => {
        return this._ElementFallback;
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
    _ElementAreaRaw = ({ }: any): JSX.Element => {
        return (
            <div
                style={{
                    display: "inline-flex",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    userSelect: "none",
                    overflow: "hidden",
                    whiteSpace: this.getAllText().wrapWord ? "normal" : "pre",
                    justifyContent: this.getAllText().horizontalAlign,
                    alignItems: this.getAllText().verticalAlign,
                    fontFamily: this.getAllStyle().fontFamily,
                    fontSize: this.getAllStyle().fontSize,
                    fontStyle: this.getAllStyle().fontStyle,
                    fontWeight: this.getAllStyle().fontWeight,
                    outline: this._getElementAreaRawOutlineStyle(),
                    color: this.getAllStyle()["color"],
                }}
                // title={"tooltip"}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                <this._ElementCalculator></this._ElementCalculator>
            </div>
        );
    };

    _ElementCalculator = () => {
        const inputElementRef = React.useRef<any>(null);
        const [inputLine, setInputLine] = React.useState("");
        const [historyLine, setHistoryLine] = React.useState("\u00A0");
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "inline-flex",
                    flexDirection: "column",
                    backgroundColor: "rgba(29, 30, 33, 1)",
                    padding: 10,
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <this._ElementLcd
                    inputLine={inputLine}
                    setInputLine={setInputLine}
                    historyLine={historyLine}
                    setHistoryLine={setHistoryLine}
                    inputElementRef={inputElementRef}
                ></this._ElementLcd>
                <this._ElementKeyPad
                    inputLine={inputLine}
                    setInputLine={setInputLine}
                    historyLine={historyLine}
                    setHistoryLine={setHistoryLine}
                    inputElementRef={inputElementRef}
                ></this._ElementKeyPad>
            </div>
        );
    };

    _ElementLcd = ({ inputLine, setInputLine, historyLine, setHistoryLine, inputElementRef }: any) => {
        React.useEffect(() => {
            if (inputElementRef !== undefined && inputElementRef.current !== null && this.futureCursorPosition !== -1) {
                inputElementRef.current.setSelectionRange(this.futureCursorPosition, this.futureCursorPosition);
                this.futureCursorPosition = -1;
            }
        });
        return (
            <div
                style={{
                    height: "25%",
                    width: "100%",
                    backgroundColor: "rgba(29, 30, 33, 0)",
                    color: "rgba(255, 255, 255, 1)",
                    display: "inline-flex",
                    justifyContent: "center",
                    alignItems: "center",
                    // marginTop: 10,
                    marginBottom: 10,
                }}
            >
                <div
                    style={{
                        display: "inline-flex",
                        border: "solid rgba(150, 150, 150, 1) 1px",
                        borderRadius: 5,
                        width: "100%",
                        height: "100%",
                        // margin: 10,
                        flexDirection: "column",
                        justifyContent: "space-between",
                        alignItems: "flex-end",
                    }}
                >
                    <div
                        style={{
                            width: "100%",
                            paddingLeft: 10,
                            paddingRight: 10,
                            display: "inline-flex",
                            justifyContent: "flex-end",
                            backgroundColor: "rgba(0,0,0,0)",
                            color: "rgba(150, 150, 150, 1)",
                            fontSize: 18,
                        }}
                    >
                        {historyLine}
                    </div>
                    <form
                        style={{
                            marginLeft: 10,
                            marginRight: 10,
                            marginBottom: 10,
                            width: "100%",
                        }}
                        onSubmit={(event: any) => {
                            event.preventDefault();
                            setInputLine((oldValue: string) => {
                                setHistoryLine(oldValue);
                                this.inputLineHistory.push(oldValue);
                                try {
                                    const result = mathjs.evaluate(this.replaceSpecialCharacters(oldValue));
                                    if (typeof result !== "number") {
                                        const errMsg = `Parse error: ${oldValue}`;
                                        throw new Error(errMsg);
                                    }
                                    return `${result}`;
                                } catch (e) {
                                    Log.error(e);
                                    return "Error";
                                }
                            });
                        }}
                    >
                        <input
                            ref={inputElementRef}
                            style={{
                                backgroundColor: "rgba(0,255,0,0)",
                                border: "none",
                                outline: "none",
                                color: "rgba(255, 255, 255, 1)",
                                textAlign: "right",
                                width: "100%",
                                fontSize: 25,
                                // height:40,
                                textIndent: 5,
                                overflowY: "visible",
                                cursor: "default", // do not change to text style
                                // paddingBottom: 5,
                                caretColor: "rgba(255,255,255,1)",
                            }}
                            onChange={(event: any) => {
                                event.preventDefault();
                                setInputLine(event.target.value);
                            }}
                            onFocus={(event: any) => {
                                event.preventDefault();
                                if (!g_widgets1.isEditing() && inputElementRef.current !== null) {
                                    inputElementRef.current.style["color"] = "rgba(0,255,0,1)";
                                }
                            }}
                            onBlur={(event: any) => {
                                event.preventDefault();
                                if (!g_widgets1.isEditing() && inputElementRef.current !== null) {
                                    inputElementRef.current.style["color"] = "rgba(255,255,255,1)";
                                }
                            }}
                            value={inputLine}
                        ></input>
                    </form>
                </div>
            </div>
        );
    };

    inputLineHistory: string[] = [];
    currentHistoryIndex = 0;
    futureCursorPosition = -1;

    _ElementKeyPad = ({ inputLine, setInputLine, historyLine, setHistoryLine, inputElementRef }: any) => {
        return (
            <div
                style={{
                    height: "60%",
                    width: "100%",
                    bottom: 0,
                    left: 0,
                    backgroundColor: "rgba(29, 30, 34, 1)",
                    color: "rgba(255, 255, 0, 1)",
                    fontSize: 15,
                    display: "inline-flex",
                    justifyContent: "space-around",
                    alignItems: "center",
                    marginTop: 2,
                    marginBottom: 10,
                    columnGap: 10,
                    rowGap: 3,
                    flexWrap: "wrap",
                }}
            >
                {this.keys.map((key: type_Calculator_key, index: number) => {
                    if (index % 7 === 0) {
                        return (<this._ElementKeypadRow
                            index0={index}
                            setHistoryLine={setHistoryLine}
                            setInputLine={setInputLine}
                            inputElementRef={inputElementRef}
                        >
                        </this._ElementKeypadRow>)
                    } else {
                        return null;
                    }
                })}
            </div>
        );
    };

    _ElementKeypadRow = ({ index0, setInputLine, setHistoryLine, inputElementRef }: any) => {
        return (
            <div style={{
                width: "100%",
                height: "15%",
                padding: 0,
                margin: 0,
                display: "inline-flex",
                alignItems: 'center',
                justifyContent: "space-between",
            }}>
                {[0, 1, 2, 3, 4, 5, 6].map((offset: number, index: number) => {
                    const key = this.keys[index0 + index];
                    const label = key["label"];
                    const onClick = key["onClick"];
                    return (
                        <this._ElementKey
                            key={`${label}-${index0 + index}`}
                            label={label}
                            onClick={() => {
                                onClick(setInputLine, setHistoryLine, inputElementRef);
                            }}
                        ></this._ElementKey>
                    );
                })}
            </div>
        )
    }

    inputLine: string = "";

    keys: type_Calculator_key[] = [
        {
            label: "sin",
            onClick: (setInputLine: any, setHistoryLine: any, inputElementRef: any) => {
                this.keyOnClick("sin(", setInputLine, setHistoryLine, inputElementRef);
            },
            options: {},
        },
        {
            label: "cos",
            onClick: (setInputLine: any, setHistoryLine: any, inputElementRef: any) => {
                this.keyOnClick("cos(", setInputLine, setHistoryLine, inputElementRef);
            },
            options: {},
        },
        {
            label: "tan",
            onClick: (setInputLine: any, setHistoryLine: any, inputElementRef: any) => {
                this.keyOnClick("tan(", setInputLine, setHistoryLine, inputElementRef);
            },
            options: {},
        },

        {
            label: "COPY",
            onClick: (setInputLine: any, setHistoryLine: any, inputElementRef: any) => {
                if (g_widgets1.isEditing()) {
                    return;
                }

                if (inputElementRef !== undefined && inputElementRef.current !== null) {
                    navigator.clipboard.writeText(inputElementRef.current.value);
                }
            },
            options: {},
        },
        {
            label: "PASTE",
            onClick: async (setInputLine: any, setHistoryLine: any, inputElementRef: any) => {
                if (g_widgets1.isEditing()) {
                    return;
                }
                const text = await navigator.clipboard.readText();
                if (text === "") {
                    return;
                }

                if (inputElementRef !== undefined && inputElementRef.current !== null) {
                    const inputElementCursorPosition =
                        document.activeElement === inputElementRef.current
                            ? inputElementRef.current.selectionStart
                            : inputElementRef.current.value.length;
                    setInputLine((oldValue: string) => {
                        return [oldValue.slice(0, inputElementCursorPosition), text, oldValue.slice(inputElementCursorPosition)].join("");
                    });
                    this.futureCursorPosition = inputElementCursorPosition + text.length;
                }
            },
            options: {},
        },
        {
            label: "CE",
            onClick: (setInputLine: any, setHistoryLine: any, inputElementRef: any) => {
                if (g_widgets1.isEditing()) {
                    return;
                }
                if (inputElementRef !== undefined && inputElementRef.current !== null) {
                    const inputElementCursorPosition =
                        document.activeElement === inputElementRef.current
                            ? inputElementRef.current.selectionStart
                            : inputElementRef.current.value.length;
                    if (inputElementCursorPosition <= 0) {
                        return;
                    }
                    setInputLine((oldValue: string) => {
                        return [oldValue.slice(0, inputElementCursorPosition - 1), oldValue.slice(inputElementCursorPosition)].join("");
                    });
                    this.futureCursorPosition = inputElementCursorPosition - 1;
                }
            },
            options: {},
        },

        {
            label: "AC",
            onClick: (setInputLine: any, setHistoryLine: any, inputElementRef: any) => {
                if (g_widgets1.isEditing()) {
                    return;
                }
                setInputLine((oldValue: string) => {
                    return ``;
                });
                if (inputElementRef !== undefined && inputElementRef.current !== null) {
                    inputElementRef.current.blur();
                }
            },
            options: {},
        },

        {
            label: "sinh",
            onClick: (setInputLine: any, setHistoryLine: any, inputElementRef: any) => {
                this.keyOnClick("sinh(", setInputLine, setHistoryLine, inputElementRef);
            },
            options: {},
        },
        {
            label: "cosh",
            onClick: (setInputLine: any, setHistoryLine: any, inputElementRef: any) => {
                this.keyOnClick("cosh(", setInputLine, setHistoryLine, inputElementRef);
            },
            options: {},
        },
        {
            label: "tanh",
            onClick: (setInputLine: any, setHistoryLine: any, inputElementRef: any) => {
                this.keyOnClick("tanh(", setInputLine, setHistoryLine, inputElementRef);
            },
            options: {},
        },

        {
            label: "(",
            onClick: (setInputLine: any, setHistoryLine: any, inputElementRef: any) => {
                this.keyOnClick("(", setInputLine, setHistoryLine, inputElementRef);
            },
            options: {},
        },
        {
            label: ")",
            onClick: (setInputLine: any, setHistoryLine: any, inputElementRef: any) => {
                this.keyOnClick(")", setInputLine, setHistoryLine, inputElementRef);
            },
            options: {},
        },
        {
            label: "FWD",
            onClick: (setInputLine: any, setHistoryLine: any, inputElementRef: any) => {
                if (g_widgets1.isEditing()) {
                    return;
                }
                if (this.currentHistoryIndex < 1) {
                    return;
                }
                this.currentHistoryIndex--;
                const newValue = this.inputLineHistory[this.inputLineHistory.length - this.currentHistoryIndex];
                setInputLine((oldValue: string) => {
                    return newValue;
                });
            },

            options: {},
        },

        {
            label: "BACK",
            onClick: (setInputLine: any, setHistoryLine: any, inputElementRef: any) => {
                if (g_widgets1.isEditing()) {
                    return;
                }
                if (this.currentHistoryIndex >= this.inputLineHistory.length) {
                    return;
                }
                this.currentHistoryIndex++;
                const newValue = this.inputLineHistory[this.inputLineHistory.length - this.currentHistoryIndex];
                setInputLine((oldValue: string) => {
                    return newValue;
                });
            },
            options: {},
        },
        {
            label: "arcsin",
            onClick: (setInputLine: any, setHistoryLine: any, inputElementRef: any) => {
                this.keyOnClick("arcsin(", setInputLine, setHistoryLine, inputElementRef);
            },
            options: {},
        },
        {
            label: "arccos",
            onClick: (setInputLine: any, setHistoryLine: any, inputElementRef: any) => {
                this.keyOnClick("arccos(", setInputLine, setHistoryLine, inputElementRef);
            },
            options: {},
        },
        {
            label: "arctan",
            onClick: (setInputLine: any, setHistoryLine: any, inputElementRef: any) => {
                this.keyOnClick("arctan(", setInputLine, setHistoryLine, inputElementRef);
            },
            options: {},
        },

        {
            label: "7",
            onClick: (setInputLine: any, setHistoryLine: any, inputElementRef: any) => {
                this.keyOnClick("7", setInputLine, setHistoryLine, inputElementRef);
            },
            options: {},
        },
        {
            label: "8",
            onClick: (setInputLine: any, setHistoryLine: any, inputElementRef: any) => {
                this.keyOnClick("8", setInputLine, setHistoryLine, inputElementRef);
            },
            options: {},
        },
        {
            label: "9",
            onClick: (setInputLine: any, setHistoryLine: any, inputElementRef: any) => {
                this.keyOnClick("9", setInputLine, setHistoryLine, inputElementRef);
            },
            options: {},
        },
        {
            label: "\u00F7", // divide
            onClick: (setInputLine: any, setHistoryLine: any, inputElementRef: any) => {
                this.keyOnClick("\u00F7", setInputLine, setHistoryLine, inputElementRef);
            },
            options: {},
        },
        {
            label: "x!",
            onClick: (setInputLine: any, setHistoryLine: any, inputElementRef: any) => {
                this.keyOnClick("!", setInputLine, setHistoryLine, inputElementRef);
            },
            options: {},
        },
        {
            label: "^",
            onClick: (setInputLine: any, setHistoryLine: any, inputElementRef: any) => {
                this.keyOnClick("^", setInputLine, setHistoryLine, inputElementRef);
            },
            options: {},
        },
        {
            label: "\u221A", // sqrt
            onClick: (setInputLine: any, setHistoryLine: any, inputElementRef: any) => {
                this.keyOnClick("sqrt(", setInputLine, setHistoryLine, inputElementRef);
            },
            options: {},
        },

        {
            label: "4",
            onClick: (setInputLine: any, setHistoryLine: any, inputElementRef: any) => {
                this.keyOnClick("4", setInputLine, setHistoryLine, inputElementRef);
            },
            options: {},
        },
        {
            label: "5",
            onClick: (setInputLine: any, setHistoryLine: any, inputElementRef: any) => {
                this.keyOnClick("5", setInputLine, setHistoryLine, inputElementRef);
            },
            options: {},
        },
        {
            label: "6",
            onClick: (setInputLine: any, setHistoryLine: any, inputElementRef: any) => {
                this.keyOnClick("6", setInputLine, setHistoryLine, inputElementRef);
            },
            options: {},
        },
        {
            label: "\u00D7", // times
            onClick: (setInputLine: any, setHistoryLine: any, inputElementRef: any) => {
                this.keyOnClick("\u00D7", setInputLine, setHistoryLine, inputElementRef);
            },
            options: {},
        },

        {
            label: "log\u2081\u2080", // log10
            onClick: (setInputLine: any, setHistoryLine: any, inputElementRef: any) => {
                this.keyOnClick("log\u2081\u2080(", setInputLine, setHistoryLine, inputElementRef);
            },
            options: {},
        },
        {
            label: "log\u2082", // log2
            onClick: (setInputLine: any, setHistoryLine: any, inputElementRef: any) => {
                this.keyOnClick("log\u2082(", setInputLine, setHistoryLine, inputElementRef);
            },
            options: {},
        },

        {
            label: "log\u2091", // loge
            onClick: (setInputLine: any, setHistoryLine: any, inputElementRef: any) => {
                this.keyOnClick("log\u2091(", setInputLine, setHistoryLine, inputElementRef);
            },
            options: {},
        },
        {
            label: "1",
            onClick: (setInputLine: any, setHistoryLine: any, inputElementRef: any) => {
                this.keyOnClick("1", setInputLine, setHistoryLine, inputElementRef);
            },
            options: {},
        },
        {
            label: "2",
            onClick: (setInputLine: any, setHistoryLine: any, inputElementRef: any) => {
                this.keyOnClick("2", setInputLine, setHistoryLine, inputElementRef);
            },
            options: {},
        },
        {
            label: "3",
            onClick: (setInputLine: any, setHistoryLine: any, inputElementRef: any) => {
                this.keyOnClick("3", setInputLine, setHistoryLine, inputElementRef);
            },
            options: {},
        },
        {
            label: "\u2212", // minus sign
            onClick: (setInputLine: any, setHistoryLine: any, inputElementRef: any) => {
                this.keyOnClick("\u2212", setInputLine, setHistoryLine, inputElementRef);
            },
            options: {},
        },
        {
            label: "e",
            onClick: (setInputLine: any, setHistoryLine: any, inputElementRef: any) => {
                this.keyOnClick("e", setInputLine, setHistoryLine, inputElementRef);
            },
            options: {},
        },

        {
            label: "\u03C0", // pi
            onClick: (setInputLine: any, setHistoryLine: any, inputElementRef: any) => {
                this.keyOnClick("\u03C0", setInputLine, setHistoryLine, inputElementRef);
            },

            options: {},
        },

        {
            label: "makeup-0", // makeup key,
            onClick: (setInputLine: any, setHistoryLine: any, inputElementRef: any) => { },
            options: {},
        },
        {
            label: "0",
            onClick: (setInputLine: any, setHistoryLine: any, inputElementRef: any) => {
                this.keyOnClick("0", setInputLine, setHistoryLine, inputElementRef);
            },
            options: {},
        },
        {
            label: ".",
            onClick: (setInputLine: any, setHistoryLine: any, inputElementRef: any) => {
                this.keyOnClick(".", setInputLine, setHistoryLine, inputElementRef);
            },
            options: {},
        },
        {
            label: "=",
            onClick: (setInputLine: any, setHistoryLine: any, inputElementRef: any) => {
                if (g_widgets1.isEditing()) {
                    return;
                }
                setInputLine((oldValue: string) => {
                    setHistoryLine(oldValue);
                    this.inputLineHistory.push(oldValue);
                    try {
                        const result = mathjs.evaluate(this.replaceSpecialCharacters(oldValue));
                        if (typeof result !== "number") {
                            const errMsg = `Parse error: ${oldValue}`;
                            throw new Error(errMsg);
                        }
                        return `${result}`;
                    } catch (e) {
                        Log.error(e);
                        return "Error";
                    }
                });
            },
            options: {},
        },
        {
            label: "+",
            onClick: (setInputLine: any, setHistoryLine: any, inputElementRef: any) => {
                this.keyOnClick("+", setInputLine, setHistoryLine, inputElementRef);
            },
            options: {},
        },
    ];

    keyOnClick = (label: string, setInputLine: any, setHistoryLine: any, inputElementRef: any) => {
        if (g_widgets1.isEditing()) {
            return;
        }
        if (inputElementRef !== undefined && inputElementRef.current !== undefined) {
            const inputElementCursorPosition =
                document.activeElement === inputElementRef.current ? inputElementRef.current.selectionStart : inputElementRef.current.value.length;
            setInputLine((oldValue: string) => {
                return [oldValue.slice(0, inputElementCursorPosition), label, oldValue.slice(inputElementCursorPosition)].join("");
            });
            this.futureCursorPosition = inputElementCursorPosition + label.length;
        }
    };

    _ElementKey = ({ label, onClick }: any) => {
        const elementRef = React.useRef<any>(null);
        if (`${label}`.startsWith("makeup-")) {
            return (
                <div
                    ref={elementRef}
                    style={{
                        width: "13%",
                        height: "100%",
                        backgroundColor: "rgba(84, 88, 93, 1)",
                        color: "rgba(229, 231, 234, 1)",
                        fontSize: 18,
                        borderRadius: 4,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: 0,
                    }}
                ></div>
            );
        } else {
            return (
                <div
                    ref={elementRef}
                    style={{
                        width: "13%",
                        height: "100%",
                        backgroundColor: "rgba(84, 88, 93, 1)",
                        color: "rgba(229, 231, 234, 1)",
                        fontSize: 18,
                        borderRadius: 4,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                    onMouseEnter={() => {
                        if (g_widgets1.isEditing()) {
                            return;
                        }
                        if (elementRef.current !== null) {
                            elementRef.current.style["backgroundColor"] = "rgba(100, 101, 106, 1)";
                            // elementRef.current.style["cursor"] = "pointer";
                        }
                    }}
                    onMouseLeave={() => {
                        if (g_widgets1.isEditing()) {
                            return;
                        }
                        if (elementRef.current !== null) {
                            elementRef.current.style["backgroundColor"] = "rgba(84, 88, 93, 1)";
                            // elementRef.current.style["cursor"] = "default";
                            elementRef.current.style["opacity"] = 1;
                        }
                    }}
                    onMouseDown={(event: any) => {
                        if (g_widgets1.isEditing()) {
                            return;
                        }
                        event.preventDefault();
                        if (elementRef.current !== null) {
                            elementRef.current.style["opacity"] = 0.5;
                        }
                    }}
                    onMouseUp={(event: any) => {
                        if (g_widgets1.isEditing()) {
                            return;
                        }
                        event.preventDefault();
                        if (elementRef.current !== null) {
                            elementRef.current.style["opacity"] = 1;
                        }
                    }}
                    onClick={onClick}
                >
                    {label}
                </div>
            );
        }
    };

    replaceSpecialCharacters = (inputLine: string) => {
        // \u00F7 -> *
        // \u00D7 -> /
        // \u03C0 -> pi
        // \u2212 -> -
        // arcsin -> asin
        // arccos -> acos
        // arctan -> atan
        return inputLine
            .replaceAll("\u00F7", "/")
            .replaceAll("\u00D7", "*")
            .replaceAll("\u03C0", "pi")
            .replaceAll("\u2212", "-")
            .replaceAll("arcsin", "asin")
            .replaceAll("arccos", "acos")
            .replaceAll("arctan", "atan")
            .replaceAll("log\u2091", "log")
            .replaceAll("log\u2081\u2080", "log10")
            .replaceAll("log\u2082", "log2");
    };

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

    _parseChannelValueElement = (channelValueElement: number | string | boolean | undefined) => {
        // const channelValue = this.getChannelValueForMonitorWidget(raw);

        if (typeof channelValueElement === "number") {
            const scale = Math.max(this.getAllText()["scale"], 0);
            const format = this.getAllText()["format"];
            if (format === "decimal") {
                return channelValueElement.toFixed(scale);
            } else if (format === "default") {
                const channelName = this.getChannelNames()[0];
                const defaultScale = g_widgets1.getChannelPrecision(channelName);
                if (defaultScale !== undefined) {
                    return channelValueElement.toFixed(defaultScale);
                } else {
                    return channelValueElement.toFixed(scale);
                }
            } else if (format === "exponential") {
                return channelValueElement.toExponential(scale);
            } else if (format === "hexadecimal") {
                return `0x${channelValueElement.toString(16)}`;
            } else if (format === "string") {
                return `${String.fromCharCode(channelValueElement)}`;
            } else {
                return channelValueElement;
            }
        } else {
            return `${channelValueElement}`;
        }
    };

    // only for TextUpdate and TextEntry
    // they are suitable to display array data in various formats,
    // other types of widgets, such as Meter, Spinner, Tanks, ProgressBar, Thermometer, ScaledSlider are not for array data
    _getChannelValue = (raw: boolean = false) => {
        const channelValue = this.getChannelValueForMonitorWidget(raw);

        if (typeof channelValue === "number" || typeof channelValue === "string") {
            return this._parseChannelValueElement(channelValue);
        } else if (Array.isArray(channelValue)) {
            const result: any[] = [];
            for (let element of channelValue) {
                result.push(this._parseChannelValueElement(element));
            }
            if (this.getAllText()["format"] === "string") {
                return result.join("");
            } else {
                return result;
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

    // ----------------------- styles -----------------------

    // defined in super class
    // _resizerStyle
    // _resizerStyles
    // StyledToolTipText
    // StyledToolTip

    // -------------------------- tdl -------------------------------

    // properties when we create a new TextUpdate
    // the level 1 properties all have corresponding public or private variable in the widget

    static _defaultTdl: type_Calculator_tdl = {
        type: "Calculator",
        widgetKey: "", // "key" is a reserved keyword
        key: "",
        style: {
            // basics
            position: "absolute",
            display: "inline-block",
            // dimensions
            left: 0,
            top: 0,
            // default is "100%"
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(240, 240, 240, 1)",
            // angle
            transform: "rotate(0deg)",
            // border, it is different from the "alarmBorder" below,
            borderStyle: "solid",
            borderWidth: 0,
            borderColor: "rgba(0, 0, 0, 1)",
            // font
            color: "rgba(0,0,0,1)",
            fontFamily: GlobalVariables.defaultFontFamily,
            fontSize: GlobalVariables.defaultFontSize,
            fontStyle: GlobalVariables.defaultFontStyle,
            fontWeight: GlobalVariables.defaultFontWeight,
            // shows when the widget is selected
            outlineStyle: "none",
            outlineWidth: 1,
            outlineColor: "black",
        },
        text: {
            // text
            horizontalAlign: "flex-start",
            verticalAlign: "flex-start",
            wrapWord: false,
            showUnit: true,
            // actually "alarm outline"
            alarmBorder: true,
            invisibleInOperation: false,
            // default, decimal, exponential, hexadecimal
            format: "default",
            // scale, >= 0
            scale: 0,
        },
        channelNames: [],
        groupNames: [],
        rules: [],
    };

    // not getDefaultTdl(), always generate a new key
    static generateDefaultTdl = (type: string): Record<string, any> => {
        const result = super.generateDefaultTdl(type);
        result.style = JSON.parse(JSON.stringify(this._defaultTdl.style));
        result.text = JSON.parse(JSON.stringify(this._defaultTdl.text));
        result.channelNames = JSON.parse(JSON.stringify(this._defaultTdl.channelNames));
        result.groupNames = JSON.parse(JSON.stringify(this._defaultTdl.groupNames));
        return result;
    };

    // static method for generating a widget tdl with external PV name
    static generateWidgetTdl = (utilityOptions: Record<string, any>): type_Calculator_tdl => {
        // utilityOptions = {} for it
        const result = this.generateDefaultTdl("Calculator");
        // result.text["externalMacros"] = utilityOptions["externalMacros"];
        // result.text["tdlFileName"] = utilityOptions["tdlFileName"];
        return result as type_Calculator_tdl;
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
            this._sidebar = new CalculatorSidebar(this);
        }
    }
}
