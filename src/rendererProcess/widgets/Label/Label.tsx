import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { GlobalVariables } from "../../../common/GlobalVariables";
import { LabelSidebar } from "./LabelSidebar";
import * as GlobalMethods from "../../../common/GlobalMethods";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { BaseWidgetRules, type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { LabelRule } from "./LabelRule";
import katex from "katex";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { Log } from "../../../common/Log";
import { defaultLabelTdl, type_Label_tdl } from "../../../common/types/type_widget_tdl";

export class Label extends BaseWidget {

    _rules: BaseWidgetRules;

    constructor(widgetTdl: type_Label_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this.setReadWriteType("read");
        this._rules = new BaseWidgetRules(this, widgetTdl, LabelRule);
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
                {this.showSidebar() ? this.getSidebar()?.getElement() : null}
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
                }}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                {/* skip the <_ElementLabel /> */}
                {this.getTextText()}
            </div>
        );
    };

    _Element = React.memo(this._ElementRaw, () => this._useMemoedElement());
    _ElementArea = React.memo(this._ElementAreaRaw, () => this._useMemoedElement());

    // -------------------- helper function -------------------------

    /**
     * The text in Label honors:
     *  - latex
     *  - macros
     *  - display window ID
     *  - new line feed "\n"
     */
    getTextText = () => {
        const rawText = this.getAllText()["text"];
        // latex
        if (`${rawText}`.startsWith("latex://")) {
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
                const macros = this.getAllMacros();
                // macros
                const expandedText = BaseWidget.expandChannelName(rawText, macros, true);
                // new line feed
                // user types "\n", it is saved as "\\n" in tdl file, in here we convert it back to "\n"
                const textArray = expandedText.replaceAll("\\n", "\n").split("\n");
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

    // -------------------------- tdl -------------------------------

    static generateDefaultTdl = (): type_Label_tdl => {
        const widgetKey = GlobalMethods.generateWidgetKey(defaultLabelTdl.type);
        return structuredClone({
            ...defaultLabelTdl,
            widgetKey: widgetKey,
        });

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
