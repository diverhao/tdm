import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { TextUpdateSidebar } from "./TextUpdateSidebar";
import * as GlobalMethods from "../../../common/GlobalMethods";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { TextUpdateRules } from "./TextUpdateRules";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { type_TextUpdate_tdl, defaultTextUpdateTdl } from "../../../common/types/type_widget_tdl";


export class TextUpdate extends BaseWidget {
    _rules: TextUpdateRules;

    constructor(widgetTdl: type_TextUpdate_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this.setReadWriteType("read");
        this._rules = new TextUpdateRules(this, widgetTdl);
    }

    // ------------------------------ elements ---------------------------------

    // Body + sidebar
    _ElementRaw = () => {

        this.widgetBeingRendered = true;
        React.useEffect(() => {
            this.widgetBeingRendered = false;
        });
        g_widgets1.removeFromForceUpdateWidgets(this.getWidgetKey());
        this.updateAllStyleAndText();

        return (
            <ErrorBoundary style={this.getStyle()} widgetKey={this.getWidgetKey()} >
                {
                    g_widgets1.isEditing() ?
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
                {this.showSidebar() ? this._sidebar?.getElement() : null}
            </ErrorBoundary>
        );
    };

    _ElementAreaRaw = ({ }: any): React.JSX.Element => {
        const allText = this.getAllText();

        const whiteSpace = allText.wrapWord ? "normal" : "pre";
        const justifyContent = allText.horizontalAlign;
        const alignItems = allText.verticalAlign;
        const outline = this._getElementAreaRawOutlineStyle();
        const backgroundColor = this._getElementAreaRawBackgroundStyle();
        const color = this._getElementAreaRawTextStyle();

        const additionalStyle = g_widgets1.isEditing() ? {} : this.getElementBodyRawStyle();

        const showUnit = allText["showUnit"];

        return (
            <div
                style={{
                    display: "inline-flex",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    // in operation mode, the appearance is defined in here as body layer is skipped
                    // the runtime appearance is after this
                    ...additionalStyle,
                    userSelect: "none",
                    overflow: "hidden",
                    whiteSpace: whiteSpace,
                    justifyContent: justifyContent,
                    alignItems: alignItems,
                    outline: outline,
                    backgroundColor: backgroundColor,
                    color: color,
                }}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                {this.getFormattedChannelValue(showUnit)}
            </div>
        );
    };


    _Element = React.memo(this._ElementRaw, () => this._useMemoedElement());
    _ElementArea = React.memo(this._ElementAreaRaw, () => this._useMemoedElement());

    // -------------------------- tdl -------------------------------

    static generateDefaultTdl = (): type_TextUpdate_tdl => {
        const widgetKey = GlobalMethods.generateWidgetKey(defaultTextUpdateTdl.type);
        return structuredClone({
            ...defaultTextUpdateTdl,
            widgetKey: widgetKey,
        });
    };

    generateDefaultTdl: () => any = TextUpdate.generateDefaultTdl;

    // --------------------- sidebar --------------------------

    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new TextUpdateSidebar(this);
        }
    }
}
