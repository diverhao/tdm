import * as React from "react";
import { g_widgets1, getBasePath } from "../../global/GlobalVariables";
import { BinaryImageSidebar } from "./BinaryImageSidebar";
import * as GlobalMethods from "../../../common/GlobalMethods";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { BinaryImageRule } from "./BinaryImageRule";
import { BaseWidgetRules } from "../BaseWidget/BaseWidgetRules";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { defaultBinaryImageTdl, type_BinaryImage_tdl } from "../../../common/types/type_widget_tdl";

export class BinaryImage extends BaseWidget {

    _rules: BaseWidgetRules;

    constructor(widgetTdl: type_BinaryImage_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this.setReadWriteType("read");

        this._rules = new BaseWidgetRules(this, widgetTdl, BinaryImageRule);
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

    _ElementAreaRaw = ({ }: any): React.JSX.Element => {
        const allText = this.getAllText();
        const whiteSpace = allText.wrapWord ? "normal" : "pre";
        const justifyContent = allText.horizontalAlign;
        const alignItems = this.getAllText().verticalAlign;
        const outline = this._getElementAreaRawOutlineStyle();

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
                    outline: outline,
                }}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                <this._ElementImage></this._ElementImage>
            </div>
        );
    };

    _ElementImage = () => {
        const allText = this.getAllText();
        const allStyle = this.getAllStyle();
        const width = allStyle["width"];
        const height = allStyle["height"];
        const fit = allText["stretchToFit"] ? "fill" : "contain";
        const src = g_widgets1.isEditing() === true ? `${getBasePath()}/webpack/resources/webpages/trend.svg` : `data:image/png;base64,${this._getChannelValue()}`;
        const opacity = allText["opacity"];
        return (
            <img
                width={width}
                height={height}
                style={{
                    objectFit: fit,
                    opacity: opacity,
                }}
                src={src}
            ></img>
        );
    };

    _Element = React.memo(this._ElementRaw, () => this._useMemoedElement());
    _ElementArea = React.memo(this._ElementAreaRaw, () => this._useMemoedElement());

    // -------------------------- tdl -------------------------------

    static generateDefaultTdl = (): type_BinaryImage_tdl => {
        const widgetKey = GlobalMethods.generateWidgetKey(defaultBinaryImageTdl.type);
        return structuredClone({
            ...defaultBinaryImageTdl,
            widgetKey: widgetKey,
        });
    };

    generateDefaultTdl: () => any = BinaryImage.generateDefaultTdl;

    // -------------------------- sidebar ---------------------------
    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new BinaryImageSidebar(this);
        }
    }
}
