import { GlobalVariables } from "../../global/GlobalVariables";
import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { TextEntrySidebar } from "./TextEntrySidebar";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { TextEntryRules } from "./TextEntryRules";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { Log } from "../../../mainProcess/log/Log";

export type type_TextEntry_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
};

export class TextEntry extends BaseWidget {
    _rules: TextEntryRules;
    private _focusStatus = false;

    constructor(widgetTdl: type_TextEntry_tdl) {
        super(widgetTdl);

        this.setStyle({ ...TextEntry._defaultTdl.style, ...widgetTdl.style });
        this.setText({ ...TextEntry._defaultTdl.text, ...widgetTdl.text });

        this._rules = new TextEntryRules(this, widgetTdl);

        // assign the sidebar
        // this._sidebar = new TextEntrySidebar(this);
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

                {
                    // skip _ElementBody in operating mode
                    // the re-render efficiency can be improved by 10% by doing this
                    // this technique is used on a few most re-rendered widgets, like TextUpdate and TextEntry
                    g_widgets1?.isEditing() ?
                        <>
                            <this._ElementBody></this._ElementBody>
                            {this._showSidebar() ? this.getSidebar()?.getElement() : null}
                        </>
                        :
                        <this._ElementArea></this._ElementArea>
                }
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

        let style: React.CSSProperties = {};
        if (g_widgets1.isEditing()) {
            style = {
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
            };
        } else {
            style = {
                // display: "inline-flex",
                // top: 0,
                // left: 0,
                // width: "100%",
                // height: "100%",
                userSelect: "none",
                overflow: "visible",
                whiteSpace: this.getAllText().wrapWord ? "normal" : "pre",
                justifyContent: this.getAllText().horizontalAlign,
                alignItems: this.getAllText().verticalAlign,
                fontFamily: this.getAllText().fontFamily,
                fontSize: this.getAllText().fontSize,
                fontStyle: this.getAllText().fontStyle,
                ...this.getElementBodyRawStyle(),
                outline: this._getElementAreaRawOutlineStyle(),
            };
        }

        return (
            // <div
            <div
                style={style}
                // title={"tooltip"}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                <this._ValueInputForm
                // valueRaw={`${this._getChannelValue()} ${this.getAllText().showUnit ? this._getChannelUnit() : ""}`}
                ></this._ValueInputForm>
            </div>
        );
    };

    // _ValueInputForm = ({ valueRaw }: { valueRaw: string | number | string[] | number[] }) => {
    _ValueInputForm = () => {
        // const [value, setValue] = React.useState(`${valueRaw}`);
        const valueRaw = this.parseValue();

        const shadowWidth = 2;

        const [value, setValue] = React.useState(`${valueRaw}`);
        const isFocused = React.useRef<boolean>(false);
        const keyRef = React.useRef<HTMLInputElement>(null);
        const keyRefForm = React.useRef<HTMLFormElement>(null);

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
                // no write access, do not write
                return;
            }

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

        const calcInputSize = () => {
            const width = this.getAllStyle()["width"];
            const height = this.getAllStyle()["height"];
            if (this.getAllText()["appearance"] === "traditional") {
                return [width - shadowWidth * 2, height - shadowWidth * 2];
            } else {
                return [width, height];
            }
        }

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
            <form
                ref={keyRefForm}
                onSubmit={handleSubmit}
                style={{
                    width: "100%",
                    height: "100%",
                    opacity: this.getAllText()["invisibleInOperation"] === true && !g_widgets1.isEditing() ? 0 : 1,
                }}
            >
                <input
                    ref={keyRef}
                    style={{
                        backgroundColor: "rgba(0,0,0,0)",
                        // border: "none",
                        width: calcInputSize()[0],
                        height: calcInputSize()[1],
                        padding: 0,
                        margin: 0,
                        textOverflow: "ellipsis",
                        overflow: "visible",
                        whiteSpace: "nowrap",
                        outline: this.getAllText()["appearance"] === "traditional" ? "solid 1px rgba(100, 100, 250, 0.5)" : "none",
                        textAlign:
                            this.getAllText().horizontalAlign === "flex-start"
                                ? "left"
                                : this.getAllText().horizontalAlign === "center"
                                    ? "center"
                                    : "right",
                        color: this.getAllStyle()["color"],
                        fontFamily: this.getAllStyle()["fontFamily"],
                        fontSize: this.getAllStyle()["fontSize"],
                        fontStyle: this.getAllStyle()["fontStyle"],
                        fontWeight: this.getAllStyle()["fontWeight"],
                        // padding: 10,
                        borderRight: this.getAllText()["appearance"] === "traditional" ? `solid ${shadowWidth}px rgba(255,255,255,1)` : "none",
                        borderBottom: this.getAllText()["appearance"] === "traditional" ? `solid ${shadowWidth}px rgba(255,255,255,1)` : "none",
                        borderLeft: this.getAllText()["appearance"] === "traditional" ? `solid ${shadowWidth}px rgba(100,100,100,1)` : "none",
                        borderTop: this.getAllText()["appearance"] === "traditional" ? `solid ${shadowWidth}px rgba(100,100,100,1)` : "none",
                    }}
                    onMouseOver={(event: any) => {
                        event.preventDefault();
                        if (!g_widgets1.isEditing()) {
                            if (this._getChannelAccessRight() > 1.5) {
                                event.target.style["cursor"] = "text";
                            } else {
                                event.target.style["cursor"] = "not-allowed";
                            }
                        } else {
                            event.target.style["cursor"] = "default";
                        }
                    }}
                    onMouseOut={(event: any) => {
                        event.preventDefault();
                        event.target.style["cursor"] = "default";
                    }}
                    type="text"
                    name="value"
                    value={value}
                    onFocus={(event: any) => {
                        isFocused.current = true;
                        this.setFocusStatus(true);
                        keyRef.current?.select();

                        // The widget is not re-rendered, we must use
                        // const rulesValues = this.getRules()?.getValues();
                        // if (rulesValues !== undefined) {
                        // 	const rulesText = rulesValues["text"];
                        // 	if (rulesText !== undefined) {
                        // 		if (rulesText["highlightBackgroundColor"] !== undefined) {
                        // 			event.target.style["backgroundColor"] = rulesText["highlightBackgroundColor"];
                        // 			return;
                        // 		}
                        // 	}
                        // }
                        if (keyRef.current !== null) {
                            keyRef.current.style["backgroundColor"] = this.getAllText()["highlightBackgroundColor"];
                            // keyRef.current.style["borderRight"] = this.getAllText()["appearance"] === "traditional" ? `solid ${shadowWidth}px rgba(255,255,255,1)` : "none";
                            // keyRef.current.style["borderBottom"] = this.getAllText()["appearance"] === "traditional" ? `solid ${shadowWidth}px rgba(255,255,255,1)` : "none";
                            // keyRef.current.style["borderLeft"] = this.getAllText()["appearance"] === "traditional" ? `solid ${shadowWidth}px rgba(150,150,150,1)` : "none";
                            // keyRef.current.style["borderTop"] = this.getAllText()["appearance"] === "traditional" ? `solid ${shadowWidth}px rgba(150,150,150,1)` : "none";
                        }
                    }}
                    onChange={(event: any) => {
                        event.preventDefault();
                        if (this._getChannelAccessRight() < 1.5) {
                            // no write access, do not update
                            return;
                        }
                        setValue(event.target.value);
                    }}
                    onBlur={(event: any) => {
                        isFocused.current = false;
                        this.setFocusStatus(false);
                        setValue(`${this.parseValue()}`);
                        if (keyRef.current !== null) {
                            keyRef.current.style["backgroundColor"] = `rgba(0,0,0,0)`;
                            // keyRef.current.style["borderRight"] = this.getAllText()["appearance"] === "traditional" ? `solid ${shadowWidth}px rgba(255,255,255,1)` : "none";
                            // keyRef.current.style["borderBottom"] = this.getAllText()["appearance"] === "traditional" ? `solid ${shadowWidth}px rgba(255,255,255,1)` : "none";
                            // keyRef.current.style["borderLeft"] = this.getAllText()["appearance"] === "traditional" ? `solid ${shadowWidth}px rgba(150,150,150,1)` : "none";
                            // keyRef.current.style["borderTop"] = this.getAllText()["appearance"] === "traditional" ? `solid ${shadowWidth}px rgba(150,150,150,1)` : "none";
                            // keyRef.current.style["borderLeft"] = this.getAllText()["appearance"] === "traditional" ? `solid ${shadowWidth}px rgba(255,255,255,1)` : "none";
                            // keyRef.current.style["borderTop"] = this.getAllText()["appearance"] === "traditional" ? `solid ${shadowWidth}px rgba(255,255,255,1)` : "none";
                            // keyRef.current.style["borderRight"] = this.getAllText()["appearance"] === "traditional" ? `solid ${shadowWidth}px rgba(150,150,150,1)` : "none";
                            // keyRef.current.style["borderBottom"] = this.getAllText()["appearance"] === "traditional" ? `solid ${shadowWidth}px rgba(150,150,150,1)` : "none";
                        }
                    }}
                />
            </form>
        );
    };

    parseValue = () => {
        const value = this._getChannelValue();
        let unit = ` ${this._getChannelUnit()}`;
        if (this._getChannelUnit() === undefined) {
            unit = "";
        }
        if (g_widgets1.isEditing()) {
            if (this.getChannelNames()[0] === undefined) {
                return "";
            } else {
                return this.getChannelNames()[0];
            }
        }
        if (value === undefined) {
            if (this.getChannelNames()[0] === undefined) {
                return "";
            } else {
                return this.getChannelNames()[0];
            }
        } else {
            if (this.getAllText()["showUnit"] === true) {
                return `${value}${unit}`;
            } else {
                return `${value}`;
            }
        }
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

    // _getChannelValue = () => {
    // 	return this._getFirstChannelValue();
    // };

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
                // MacOS ignores the non-displayable characters, but Linux shows rectangle for these characters
                if (channelValueElement >= 32 && channelValueElement <= 126) {
                    return `${String.fromCharCode(channelValueElement)}`;
                } else {
                    return "";
                }
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
        return this._getFirstChannelUnit();
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
    static _defaultTdl: type_TextEntry_tdl = {
        type: "TextEntry",
        widgetKey: "", // "key" is a reserved keyword
        key: "",
        style: {
            // basics
            position: "absolute",
            display: "inline-block",
            // dimensions
            left: 0,
            top: 0,
            width: 100,
            height: 100,
            backgroundColor: "rgba(128, 255, 255, 1)",
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
            // text positions and contents
            horizontalAlign: "flex-start",
            verticalAlign: "center",
            wrapWord: false,
            showUnit: true,
            // actuall "alarm outline"
            alarmBorder: true,
            // when the input box is focused
            highlightBackgroundColor: "rgba(255, 255, 0, 1)",
            invisibleInOperation: false,
            // decimal, exponential, hexadecimal
            format: "default",
            // scale, >= 0
            scale: 0,
            // "contemporary" | "traditional"
            appearance: "contemporary",
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

    getFocusStatus = () => {
        return this._focusStatus;
    }

    // ---------------------- setters -------------------------
    setFocusStatus = (newStatus: boolean) => {
        this._focusStatus = newStatus;
    }

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
            this._sidebar = new TextEntrySidebar(this);
        }
    }
}
