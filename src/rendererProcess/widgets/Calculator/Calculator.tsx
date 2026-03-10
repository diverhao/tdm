import * as GlobalMethods from "../../../common/GlobalMethods";
import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { CalculatorSidebar } from "./CalculatorSidebar";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { Log } from "../../../common/Log";
import { evaluate } from "mathjs";
import { defaultCalculatorTdl, type_Calculator_tdl } from "../../../common/types/type_widget_tdl";

type type_Calculator_inputSetter = React.Dispatch<React.SetStateAction<string>>;
type type_Calculator_inputRef = React.RefObject<HTMLInputElement | null>;
type type_Calculator_actionContext = {
    setInputLine: type_Calculator_inputSetter;
    setHistoryLine: type_Calculator_inputSetter;
    inputElementRef: type_Calculator_inputRef;
};

type type_Calculator_keyAction = "copy" | "paste" | "backspace" | "clear" | "historyForward" | "historyBack" | "evaluate";
type type_Calculator_key = {
    label: string;
    displayText?: string;
    fontScale?: number;
    hidden?: boolean;
    onClick: (context: type_Calculator_actionContext) => void | Promise<void>;
};

type type_Calculator_keySpec = {
    label: string;
    displayText?: string;
    fontScale?: number;
    insert?: string;
    action?: type_Calculator_keyAction;
    hidden?: boolean;
};

const latex = (expression: string) => `latex://${expression}`;
const latexText = (text: string) => `latex://\\text{${text}}`;

const calculatorKeyRows: type_Calculator_keySpec[][] = [
    [
        { label: "sin", displayText: latex("\\sin"), insert: "sin(" },
        { label: "cos", displayText: latex("\\cos"), insert: "cos(" },
        { label: "tan", displayText: latex("\\tan"), insert: "tan(" },
        { label: "COPY", displayText: latexText("COPY"), fontScale: 0.78, action: "copy" },
        { label: "PASTE", displayText: latexText("PASTE"), fontScale: 0.72, action: "paste" },
        { label: "CE", displayText: latexText("CE"), action: "backspace" },
        { label: "AC", displayText: latexText("AC"), action: "clear" },
    ],
    [
        { label: "sinh", displayText: latex("\\sinh"), insert: "sinh(" },
        { label: "cosh", displayText: latex("\\cosh"), insert: "cosh(" },
        { label: "tanh", displayText: latex("\\tanh"), insert: "tanh(" },
        { label: "(", displayText: latex("("), insert: "(" },
        { label: ")", displayText: latex(")"), insert: ")" },
        { label: "FWD", displayText: latexText("FWD"), fontScale: 0.78, action: "historyForward" },
        { label: "BACK", displayText: latexText("BACK"), fontScale: 0.68, action: "historyBack" },
    ],
    [
        { label: "arcsin", displayText: latex("\\arcsin"), insert: "arcsin(" },
        { label: "arccos", displayText: latex("\\arccos"), insert: "arccos(" },
        { label: "arctan", displayText: latex("\\arctan"), insert: "arctan(" },
        { label: "7", displayText: latex("7"), insert: "7" },
        { label: "8", displayText: latex("8"), insert: "8" },
        { label: "9", displayText: latex("9"), insert: "9" },
        { label: "\u00F7", displayText: latex("\\div"), insert: "\u00F7" },
    ],
    [
        { label: "x!", displayText: latex("x!"), insert: "!" },
        { label: "^", displayText: "^", insert: "^" },
        { label: "sqrt", displayText: latex("\\sqrt{\\vphantom{1} \\quad }"), insert: "sqrt(" },
        { label: "4", displayText: latex("4"), insert: "4" },
        { label: "5", displayText: latex("5"), insert: "5" },
        { label: "6", displayText: latex("6"), insert: "6" },
        { label: "\u00D7", displayText: latex("\\times"), insert: "\u00D7" },
    ],
    [
        { label: "log10", displayText: latex("\\log_{10}"), insert: "log\u2081\u2080(" },
        { label: "log2", displayText: latex("\\log_{2}"), insert: "log\u2082(" },
        { label: "loge", displayText: latex("\\log_{\\mathrm{e}}"), insert: "log\u2091(" },
        { label: "1", displayText: latex("1"), insert: "1" },
        { label: "2", displayText: latex("2"), insert: "2" },
        { label: "3", displayText: latex("3"), insert: "3" },
        { label: "\u2212", displayText: latex("-"), insert: "\u2212" },
    ],
    [
        { label: "e", displayText: latex("\\mathrm{e}"), insert: "e" },
        { label: "\u03C0", displayText: latex("\\pi"), insert: "\u03C0" },
        { label: "", hidden: true },
        { label: "0", displayText: latex("0"), insert: "0" },
        { label: ".", displayText: latex("."), insert: "." },
        { label: "=", displayText: latex("="), action: "evaluate" },
        { label: "+", displayText: latex("+"), insert: "+" },
    ],
];

export class Calculator extends BaseWidget {

    inputLineHistory: string[] = [];
    currentHistoryIndex = 0;
    futureCursorPosition = -1;
    private readonly keyRows: type_Calculator_key[][];


    constructor(widgetTdl: type_Calculator_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this.setReadWriteType("write");
        this.keyRows = calculatorKeyRows.map((row) => row.map((spec) => this.createKey(spec)));

        this._sidebar = new CalculatorSidebar(this);

        // Utility-window Calculator keeps numeric width/height and resizes with the window.
        this.registerUtilityWindowResizeCallback((event: UIEvent) => {
            g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
            g_flushWidgets();
        });
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
                <div style={this.getElementBodyRawStyle()}>
                    <this._ElementArea></this._ElementArea>
                    {this.showResizers() ? <this._ElementResizer /> : null}
                </div>
                {this.showSidebar() ? this._sidebar?.getElement() : null}
            </ErrorBoundary>
        );
    };

    _ElementAreaRaw = (): React.JSX.Element => {

        const allText = this.getAllText();
        const whiteSpace = allText.wrapWord ? "normal" : "pre";
        const justifyContent = allText.horizontalAlign;
        const alignItems = allText.verticalAlign;
        

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
                    whiteSpace: whiteSpace,
                    justifyContent: justifyContent,
                    alignItems: alignItems,
                    outline: "none",
                }}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                <this._ElementCalculator></this._ElementCalculator>
            </div>
        );
    };

    _Element = React.memo(this._ElementRaw, () => this._useMemoedElement());
    _ElementArea = React.memo(this._ElementAreaRaw, () => this._useMemoedElement());


    _ElementCalculator = () => {
        const inputElementRef = React.useRef<HTMLInputElement>(null);
        const [inputLine, setInputLine] = React.useState("");
        const [historyLine, setHistoryLine] = React.useState("\u00A0");
        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
        const mode = displayWindowClient.getMainProcessMode();
        return (
            <div
                style={{
                    width: mode === "web" ? 500 : "100%",
                    height: mode === "web" ? 550 : "100%",
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
                    setInputLine={setInputLine}
                    setHistoryLine={setHistoryLine}
                    inputElementRef={inputElementRef}
                ></this._ElementKeyPad>
            </div>
        );
    };

    _ElementLcd = ({ inputLine, setInputLine, historyLine, setHistoryLine, inputElementRef }: {
        inputLine: string;
        setInputLine: type_Calculator_inputSetter;
        historyLine: string;
        setHistoryLine: type_Calculator_inputSetter;
        inputElementRef: type_Calculator_inputRef;
    }) => {
        const { historyFontSize, inputFontSize } = this.getCalculatorFontSizes();
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
                            fontSize: historyFontSize,
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
                        onSubmit={(event) => {
                            event.preventDefault();
                            this.handleEvaluate({ setInputLine, setHistoryLine, inputElementRef });
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
                                fontSize: inputFontSize,
                                textIndent: 5,
                                overflowY: "visible",
                                cursor: "default", // do not change to text style
                                caretColor: "rgba(255,255,255,1)",
                            }}
                            onChange={(event) => {
                                event.preventDefault();
                                setInputLine(event.target.value);
                            }}
                            onFocus={(event) => {
                                event.preventDefault();
                                if (!g_widgets1.isEditing() && inputElementRef.current !== null) {
                                    inputElementRef.current.style["color"] = "rgba(0,255,0,1)";
                                }
                            }}
                            onBlur={(event) => {
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

    _ElementKeyPad = ({ setInputLine, setHistoryLine, inputElementRef }: {
        setInputLine: type_Calculator_inputSetter;
        setHistoryLine: type_Calculator_inputSetter;
        inputElementRef: type_Calculator_inputRef;
    }) => {
        const context = { setInputLine, setHistoryLine, inputElementRef };
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
                {this.keyRows.map((row, rowIndex) => (
                    <div
                        key={`row-${rowIndex}`}
                        style={{
                            width: "100%",
                            height: "15%",
                            padding: 0,
                            margin: 0,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        {row.map((key, keyIndex) => (
                            <this._ElementKey
                                key={`${rowIndex}-${keyIndex}`}
                                label={key.label}
                                displayText={key.displayText}
                                fontScale={key.fontScale}
                                hidden={key.hidden}
                                onClick={() => {
                                    void key.onClick(context);
                                }}
                            ></this._ElementKey>
                        ))}
                    </div>
                ))}
            </div>
        );
    };

    _ElementKey = ({ label, displayText, fontScale = 1, hidden = false, onClick }: {
        label: string;
        displayText?: string;
        fontScale?: number;
        hidden?: boolean;
        onClick: () => void;
    }) => {
        const elementRef = React.useRef<HTMLDivElement>(null);
        const [fontSize, setFontSize] = React.useState(18);

        React.useEffect(() => {
            const element = elementRef.current;
            if (element === null || hidden) {
                return;
            }

            const updateFontSize = () => {
                const width = Math.max(element.clientWidth, 1);
                const height = Math.max(element.clientHeight, 1);
                const labelLength = Math.max(label.length, 1);
                const widthLimitedSize = width / Math.max(labelLength * 0.7, 1);
                const heightLimitedSize = height * 0.5;
                const baseFontSize = this.clamp(Math.min(widthLimitedSize, heightLimitedSize), 10, 28);
                setFontSize(Math.round(this.clamp(baseFontSize * fontScale, 10, 28)));
            };

            updateFontSize();

            const observer = new ResizeObserver(() => {
                updateFontSize();
            });
            observer.observe(element);

            return () => {
                observer.disconnect();
            };
        }, [displayText, fontScale, hidden, label]);

        if (hidden) {
            return (
                <div
                    ref={elementRef}
                    style={{
                        width: "13%",
                        height: "100%",
                        backgroundColor: "rgba(84, 88, 93, 1)",
                        color: "rgba(229, 231, 234, 1)",
                        fontSize: fontSize,
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
                        fontSize: fontSize,
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
                            elementRef.current.style["opacity"] = "1";
                        }
                    }}
                    onMouseDown={(event) => {
                        if (g_widgets1.isEditing()) {
                            return;
                        }
                        event.preventDefault();
                        if (elementRef.current !== null) {
                            elementRef.current.style["opacity"] = "0.5";
                        }
                    }}
                    onMouseUp={(event) => {
                        if (g_widgets1.isEditing()) {
                            return;
                        }
                        event.preventDefault();
                        if (elementRef.current !== null) {
                            elementRef.current.style["opacity"] = "1";
                        }
                    }}
                    onClick={onClick}
                >
                    {this.renderKeyContent(displayText ?? label)}
                </div>
            );
        }
    };

    // ---------------- helpers -------------------

    private createKey = (spec: type_Calculator_keySpec): type_Calculator_key => {
        if (spec.hidden) {
            return {
                label: spec.label,
                hidden: true,
                onClick: () => { },
            };
        }

        if (spec.insert !== undefined) {
            const insertText = spec.insert;
            return {
                label: spec.label,
                displayText: spec.displayText,
                fontScale: spec.fontScale,
                onClick: ({ setInputLine, inputElementRef }) => {
                    this.insertText(insertText, setInputLine, inputElementRef);
                },
            };
        }

        return {
            label: spec.label,
            displayText: spec.displayText,
            fontScale: spec.fontScale,
            onClick: (context) => {
                return this.handleKeyAction(spec.action!, context);
            },
        };
    };

    private renderKeyContent = (text: string) => {
        return this.expandText(text);
    };

    private clamp = (value: number, min: number, max: number) => {
        return Math.max(min, Math.min(max, value));
    };

    private getCalculatorFontSizes = () => {
        const style = this.getAllStyle();
        const width = typeof style.width === "number" ? style.width : 500;
        const height = typeof style.height === "number" ? style.height : 500;
        const safeWidth = Math.max(width, 180);
        const safeHeight = Math.max(height, 220);

        return {
            historyFontSize: Math.round(this.clamp(Math.min(safeWidth * 0.04, safeHeight * 0.04), 12, 24)),
            inputFontSize: Math.round(this.clamp(Math.min(safeWidth * 0.06, safeHeight * 0.07), 16, 40)),
        };
    };

    private getCursorPosition = (inputElementRef: type_Calculator_inputRef) => {
        const inputElement = inputElementRef.current;
        if (inputElement === null) {
            return 0;
        }
        return document.activeElement === inputElement
            ? (inputElement.selectionStart ?? inputElement.value.length)
            : inputElement.value.length;
    };

    private updateInputLine = (
        setInputLine: type_Calculator_inputSetter,
        inputElementRef: type_Calculator_inputRef,
        updater: (oldValue: string, cursorPosition: number) => { value: string; cursorPosition: number } | undefined
    ) => {
        if (g_widgets1.isEditing() || inputElementRef.current === null) {
            return;
        }

        const cursorPosition = this.getCursorPosition(inputElementRef);
        setInputLine((oldValue: string) => {
            const result = updater(oldValue, cursorPosition);
            if (result === undefined) {
                return oldValue;
            }
            this.futureCursorPosition = result.cursorPosition;
            return result.value;
        });
    };

    private insertText = (text: string, setInputLine: type_Calculator_inputSetter, inputElementRef: type_Calculator_inputRef) => {
        this.updateInputLine(setInputLine, inputElementRef, (oldValue, cursorPosition) => ({
            value: `${oldValue.slice(0, cursorPosition)}${text}${oldValue.slice(cursorPosition)}`,
            cursorPosition: cursorPosition + text.length,
        }));
    };

    private handleKeyAction = async (action: type_Calculator_keyAction, context: type_Calculator_actionContext) => {
        switch (action) {
            case "copy":
                this.handleCopy(context.inputElementRef);
                return;
            case "paste":
                await this.handlePaste(context.setInputLine, context.inputElementRef);
                return;
            case "backspace":
                this.handleBackspace(context.setInputLine, context.inputElementRef);
                return;
            case "clear":
                this.handleClear(context.setInputLine, context.inputElementRef);
                return;
            case "historyForward":
                this.moveHistory(-1, context.setInputLine);
                return;
            case "historyBack":
                this.moveHistory(1, context.setInputLine);
                return;
            case "evaluate":
                this.handleEvaluate(context);
                return;
        }
    };

    private handleCopy = (inputElementRef: type_Calculator_inputRef) => {
        if (g_widgets1.isEditing() || inputElementRef.current === null) {
            return;
        }
        navigator.clipboard.writeText(inputElementRef.current.value);
    };

    private handlePaste = async (setInputLine: type_Calculator_inputSetter, inputElementRef: type_Calculator_inputRef) => {
        if (g_widgets1.isEditing()) {
            return;
        }

        const text = await navigator.clipboard.readText();
        if (text === "") {
            return;
        }

        this.insertText(text, setInputLine, inputElementRef);
    };

    private handleBackspace = (setInputLine: type_Calculator_inputSetter, inputElementRef: type_Calculator_inputRef) => {
        this.updateInputLine(setInputLine, inputElementRef, (oldValue, cursorPosition) => {
            if (cursorPosition <= 0) {
                return undefined;
            }
            return {
                value: `${oldValue.slice(0, cursorPosition - 1)}${oldValue.slice(cursorPosition)}`,
                cursorPosition: cursorPosition - 1,
            };
        });
    };

    private handleClear = (setInputLine: type_Calculator_inputSetter, inputElementRef: type_Calculator_inputRef) => {
        if (g_widgets1.isEditing()) {
            return;
        }
        setInputLine("");
        this.futureCursorPosition = 0;
        inputElementRef.current?.blur();
    };

    private moveHistory = (delta: 1 | -1, setInputLine: type_Calculator_inputSetter) => {
        if (g_widgets1.isEditing()) {
            return;
        }

        const nextHistoryIndex = this.currentHistoryIndex + delta;
        if (nextHistoryIndex < 0 || nextHistoryIndex > this.inputLineHistory.length) {
            return;
        }
        if (nextHistoryIndex === 0) {
            this.currentHistoryIndex = 0;
            return;
        }

        this.currentHistoryIndex = nextHistoryIndex;
        const historyValue = this.inputLineHistory[this.inputLineHistory.length - this.currentHistoryIndex];
        if (historyValue !== undefined) {
            setInputLine(historyValue);
        }
    };

    private handleEvaluate = ({ setInputLine, setHistoryLine }: type_Calculator_actionContext) => {
        if (g_widgets1.isEditing()) {
            return;
        }

        setInputLine((oldValue: string) => {
            setHistoryLine(oldValue);
            this.inputLineHistory.push(oldValue);
            this.currentHistoryIndex = 0;
            try {
                const result = evaluate(this.replaceSpecialCharacters(oldValue));
                if (typeof result !== "number") {
                    throw new Error(`Parse error: ${oldValue}`);
                }
                return `${result}`;
            } catch (e) {
                Log.error(e);
                return "Error";
            }
        });
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

    // --------------------- getters ------------------------------

    getElementFallbackFunction = () => {
        return this._ElementFallback;
    };

    // -------------------------- tdl -------------------------------

    static generateDefaultTdl = (): Record<string, any> => {
        const defaultTdl: type_Calculator_tdl = structuredClone(defaultCalculatorTdl);
        defaultTdl["widgetKey"] = GlobalMethods.generateWidgetKey(defaultTdl["type"]);
        return defaultTdl;
    };

    generateDefaultTdl: () => any = Calculator.generateDefaultTdl;

    static generateWidgetTdl = (utilityOptions: Record<string, any>): type_Calculator_tdl => {
        // utilityOptions is {}
        const result = this.generateDefaultTdl();
        return result as type_Calculator_tdl;
    };

    // -------------------------- sidebar ---------------------------
    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new CalculatorSidebar(this);
        }
    }
}
