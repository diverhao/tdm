import * as React from "react";
import { MouseEvent } from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { GlobalVariables } from "../../../common/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { GroupSelection2 } from "../../helperWidgets/GroupSelection/GroupSelection2";
import { LabelSidebar } from "./LabelSidebar";
import * as GlobalMethods from "../../../common/GlobalMethods";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { LabelRules } from "./LabelRules";
import { Canvas } from "../../helperWidgets/Canvas/Canvas";
import katex from "katex";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { Log } from "../../../common/Log";

export type type_Label_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
};

export class Label extends BaseWidget {

    _rules: LabelRules;

    constructor(widgetTdl: type_Label_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this.setReadWriteType("read");
        this._rules = new LabelRules(this, widgetTdl);
    }

    // ------------------------------ elements ---------------------------------

    // area + resizer + sidebar
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
                    <div style={this.getElementBodyRawStyle()}>
                        <this._ElementArea></this._ElementArea>
                        {this.showResizers() ? <this._ElementResizer /> : null}
                    </div>
                    {this.showSidebar() ? this.getSidebar()?.getElement() : null}
                </>
            </ErrorBoundary>
        );
    };

    _ElementAreaRaw = ({ }: any): React.JSX.Element => {
        const allText = this.getAllText();
        const whiteSpace = allText.wrapWord ? "normal" : "pre";
        const justifyContent = allText.horizontalAlign;
        const alignItems = allText.verticalAlign;
        const outline = this._getElementAreaRawOutlineStyle();
        const color = this._getElementAreaRawTextStyle();
        const backgroundColor = this._getElementAreaRawBackgroundStyle();
        const opacity = allText["invisibleInOperation"] === true && !g_widgets1.isEditing() ? 0 : 1;
        const textAlign = allText["horizontalAlign"] === "flex-start" ? "left" : this.getAllText().horizontalAlign === "flex-end" ? "right" : "center";

        return (
            <div
                style={{
                    display: "inline-flex",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    userSelect: "none",
                    overflow: "visible",
                    whiteSpace: whiteSpace,
                    justifyContent: justifyContent,
                    alignItems: alignItems,
                    outline: outline,
                    color: color,
                    backgroundColor: backgroundColor,
                    opacity: opacity,
                    textAlign: textAlign,
                }}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                <this._ElementLabel></this._ElementLabel>
            </div>
        );
    };

    _ElementLabel = () => {
        return (
            <div>
                {this.getTextText()}
            </div>
        );
    };

    getTextText = () => {
        const rawText = this.getAllText()["text"];
        if (`${rawText}`.startsWith("latex://")) {
            // no additional parsing, pure latex
            try {
                const htmlContents = katex.renderToString(`${rawText}`.replace("latex://", ""), {
                    throwOnError: false,
                });
                return <div dangerouslySetInnerHTML={{ __html: htmlContents }}></div>;
            } catch (e) {
                Log.error(e);
                return `${rawText}`;
            }
        } else {
            try {
                // the "GroupSelection2" may have not been created yet
                // const macros = (g_widgets1.getWidget2("Canvas") as Canvas).getAllMacros();
                const macros = this.getAllMacros();
                // "\\n" is "\n"
                // expand with channel name
                const expandedText = BaseWidget.expandChannelName(rawText, macros, true).replaceAll("\\n", "\n");
                // convert "\n" to <br>
                const textArray = expandedText.split("\n");
                if (textArray.length <= 1) {
                    return expandedText;
                } else {
                    return (
                        <>
                            {textArray.map((text: string, index: number) => {
                                return <>
                                    {index === 0 ? null : <br />}
                                    {text}
                                </>
                            })}
                        </>
                    )
                }
            } catch (e) {
                Log.error(e);
                return ""
            }
        }
    };

    _Element = React.memo(this._ElementRaw, () => this._useMemoedElement());
    _ElementArea = React.memo(this._ElementAreaRaw, () => this._useMemoedElement());

    // -------------------- values ----------------

    _getChannelValue = () => {
        const value = this._getFirstChannelValue();
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

    // -------------------------- tdl -------------------------------

    static generateDefaultTdl = (): Record<string, any> => {
        const defaultTdl: type_Label_tdl = {
            type: "Label",
            widgetKey: "",
            key: "",
            style: {
                // basics
                position: "absolute",
                display: "inline-flex",
                // dimensions
                left: 100,
                top: 100,
                width: 100,
                height: 100,
                // lookings
                backgroundColor: "rgba(255,255,255,0)",
                transform: "rotate(0deg)",
                // border
                borderStyle: "solid",
                borderWidth: 0,
                borderColor: "rgba(0, 0, 0, 1)",
                // font
                color: "rgba(0,0,0,1)",
                fontFamily: GlobalVariables.defaultFontFamily,
                fontSize: GlobalVariables.defaultFontSize,
                fontStyle: GlobalVariables.defaultFontStyle,
                fontWeight: GlobalVariables.defaultFontWeight,
                // when the widget is selected
                outlineStyle: "none",
                outlineWidth: 1,
                outlineColor: "black",
            },
            text: {
                // text contents
                text: "Label text",
                // text align
                horizontalAlign: "flex-start",
                verticalAlign: "flex-start",
                wrapWord: false,
                invisibleInOperation: false,
                alarmBorder: true,
                alarmBackground: false,
                alarmText: false,
                alarmLevel: "MINOR",
            },
            channelNames: [],
            groupNames: [],
            rules: [],
        };

        defaultTdl["widgetKey"] = GlobalMethods.generateWidgetKey(defaultTdl["type"]);
        return JSON.parse(JSON.stringify(defaultTdl));
    };

    generateDefaultTdl: () => any = Label.generateDefaultTdl;

    verifyWidgetTdl(tdl: Record<string, any>) {
        if (!super.verifyWidgetTdl(tdl)) {
            return false;
        }
        // add more verification if needed

        return true;
    }

    // --------------------- sidebar --------------------------

    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new LabelSidebar(this);
        }
    };
}
