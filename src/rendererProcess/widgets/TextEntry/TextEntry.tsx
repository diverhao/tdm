import * as GlobalMethods from "../../../common/GlobalMethods";
import { Channel_ACCESS_RIGHTS, GlobalVariables } from "../../../common/GlobalVariables";
import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { TextEntrySidebar } from "./TextEntrySidebar";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { TextEntryRules } from "./TextEntryRules";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";

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

    constructor(widgetTdl: type_TextEntry_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this.setReadWriteType("write");

        this._rules = new TextEntryRules(this, widgetTdl);
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
                {
                    g_widgets1?.isEditing() ?
                        // in editing mode, show everything
                        <div style={this.getElementBodyRawStyle()}>
                            <this._ElementArea></this._ElementArea>
                            {this.showResizers() ? <this._ElementResizer /> : null}
                        </div>
                        :
                        // in operating mode, skip the body layer
                        // the CPU usage is reduced by 10% 
                        // this trick is only used in TextUpdate and TextEntry
                        <this._ElementArea></this._ElementArea>
                }
                {this.showSidebar() ? this.getSidebar()?.getElement() : null}
            </ErrorBoundary>
        );
    };

    _ElementAreaRaw = ({ }: any): React.JSX.Element => {
        const outline = this._getElementAreaRawOutlineStyle();
        const backgroundColor = this._getElementAreaRawBackgroundStyle();
        const additionalStyle = g_widgets1.isEditing() ? {} : this.getElementBodyRawStyle();

        return (
            <div
                // similar to TextUpdate style, the text appearance is controlled by <_ValueInputForm />
                style={{
                    display: "inline-flex",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    // in operation mode, the appearance is defined in here as body layer is skipped
                    // the runtime appearance is after this
                    ...additionalStyle,
                    outline: outline,
                    backgroundColor: backgroundColor,
                }}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                <this._ValueInputForm></this._ValueInputForm>
            </div>
        );
    };

    _ValueInputForm = () => {
        // style
        const shadowWidth = 2;
        const allText = this.getAllText();
        const allStyle = this.getAllStyle();
        const appearance = allText["appearance"];
        const outline = appearance === "traditional" ? "solid 1px rgba(100, 100, 250, 0.5)" : "none"
        const borderRight = appearance === "traditional" ? `solid ${shadowWidth}px rgba(255,255,255,1)` : "none";
        const borderBottom = appearance === "traditional" ? `solid ${shadowWidth}px rgba(255,255,255,1)` : "none";
        const borderLeft = appearance === "traditional" ? `solid ${shadowWidth}px rgba(100,100,100,1)` : "none";
        const borderTop = appearance === "traditional" ? `solid ${shadowWidth}px rgba(100,100,100,1)` : "none";
        const width = appearance === "contemporary" ? "100%" : `calc(100% - ${shadowWidth * 2}px)`;
        const height = appearance === "contemporary" ? "100%" : `calc(100% - ${shadowWidth * 2}px)`;
        const fontFamily = allStyle["fontFamily"];
        const fontSize = allStyle["fontSize"];
        const fontStyle = allStyle["fontStyle"];
        const fontWeight = allStyle["fontWeight"];
        const color = this._getElementAreaRawTextStyle();
        const textAlign = allText.horizontalAlign === "flex-start"
            ? "left"
            : allText.horizontalAlign === "center"
                ? "center"
                : "right";

        // value
        const valueRaw = this.getFormattedChannelValue(true);
        const [value, setValue] = React.useState<string>(valueRaw);
        const isFocused = React.useRef<boolean>(false);
        const keyRef = React.useRef<HTMLInputElement>(null);
        const keyRefForm = React.useRef<HTMLFormElement>(null);

        // event handlers
        /**
         * submit the new value
         */
        const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            (event.currentTarget.elements[0] as HTMLInputElement).blur();
            if (this._getChannelAccessRight() < Channel_ACCESS_RIGHTS.WRITE_ONLY) {
                // no write access, do not write
                return;
            }
            this.putChannelValue(this.getChannelNames()[0], value);
        };

        /**
         * when the element is not focused
         *  (1) update the display every time when the value is changed
         * 
         * when the element is focused, 
         *  (1) prevent updating the display each time when the value is changed
         *  (2) change background color
         */
        const handleFocus = (event: any) => {
            isFocused.current = true;
            if (keyRef.current !== null) {
                keyRef.current.select();
                keyRef.current.style["backgroundColor"] = allText["highlightBackgroundColor"];
            }
        }

        const handleChange = (event: any) => {
            event.preventDefault();
            if (this._getChannelAccessRight() < 1.5) {
                // no write access, do not update
                return;
            }
            setValue(event.target.value);
        };

        /**
         * when the input is blurred, the displayed value goes back to the 
         * current channel value
         */
        const handleBlur = (event: any) => {
            isFocused.current = false;
            setValue(this.getFormattedChannelValue(true));
            if (keyRef.current !== null) {
                keyRef.current.style["backgroundColor"] = allText["invisibleInOperation"] ? "rgba(0,0,0,0)" : this._getElementAreaRawBackgroundStyle();
            }
        };

        /**
         * change mouse shape based upon write permission and editing status
         */
        const handleMouseOver = (event: any) => {
            event.preventDefault();
            if (!g_widgets1.isEditing()) {
                if (this._getChannelAccessRight() >= Channel_ACCESS_RIGHTS.READ_WRITE) {
                    event.target.style["cursor"] = "text";
                } else {
                    event.target.style["cursor"] = "not-allowed";
                }
            } else {
                event.target.style["cursor"] = "default";
            }
        };

        const handleMouseOut = (event: any) => {
            event.preventDefault();
            event.target.style["cursor"] = "default";
        };

        /**
         * when the value is changed, update the input display if the widget is not focused
         */
        React.useEffect(() => {
            setValue((oldValue: string) => {
                if (isFocused.current) {
                    return oldValue;
                } else {
                    return `${valueRaw}`;
                }
            });
        }, [valueRaw]);

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
                }}
            >
                <input
                    ref={keyRef}
                    style={{
                        backgroundColor: "rgba(0,0,0,0)",
                        padding: 0,
                        margin: 0,
                        width: width,
                        height: height,
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        outline: outline,
                        textAlign: textAlign,
                        color: color,
                        fontFamily: fontFamily,
                        fontSize: fontSize,
                        fontStyle: fontStyle,
                        fontWeight: fontWeight,
                        borderRight: borderRight,
                        borderBottom: borderBottom,
                        borderLeft: borderLeft,
                        borderTop: borderTop,
                    }}
                    type="text"
                    name="value"
                    onMouseOver={handleMouseOver}
                    onMouseOut={handleMouseOut}
                    value={value}
                    onFocus={handleFocus}
                    onChange={handleChange}
                    onBlur={handleBlur}
                />
            </form>
        );
    };

    _Element = React.memo(this._ElementRaw, () => this._useMemoedElement());
    _ElementArea = React.memo(this._ElementAreaRaw, () => this._useMemoedElement());

    // -------------------------- tdl -------------------------------

    static generateDefaultTdl = () => {
        const defaultTdl: type_TextEntry_tdl = {
            type: "TextEntry",
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
                // when the input box is focused
                highlightBackgroundColor: "rgba(255, 255, 0, 1)",
                invisibleInOperation: false,
                // decimal, exponential, hexadecimal
                format: "default",
                // scale, >= 0
                scale: 0,
                // "contemporary" | "traditional"
                appearance: "contemporary",
                // actuall "alarm outline"
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
        defaultTdl["widgetKey"] = GlobalMethods.generateWidgetKey(defaultTdl["type"]);
        return JSON.parse(JSON.stringify(defaultTdl));
    };

    generateDefaultTdl = TextEntry.generateDefaultTdl;

    // -------------------------- sidebar ---------------------------
    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new TextEntrySidebar(this);
        }
    }
}
