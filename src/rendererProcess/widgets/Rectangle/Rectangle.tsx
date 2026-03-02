import * as GlobalMethods from "../../../common/GlobalMethods";
import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { BaseWidgetRules, type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { RectangleSidebar } from "./RectangleSidebar";
import { RectangleRule } from "./RectangleRule";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { defaultRectangleTdl, type_Rectangle_tdl } from "../../../common/types/type_widget_tdl";

export class Rectangle extends BaseWidget {

    _rules: BaseWidgetRules;

    constructor(widgetTdl: type_Rectangle_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this.setReadWriteType("read");

        this._rules = new BaseWidgetRules(this, widgetTdl, RectangleRule);
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

        const allStyle = this.getAllStyle();
        return (
            <ErrorBoundary style={this.getStyle()} widgetKey={this.getWidgetKey()}>
                <div style={{
                    ...this.getElementBodyRawStyle(),
                    // Rectangle's border is inside the body, the "left" in html is the "left" in tdl
                    // unlike regular widget whose border is outside of the region of interest, 
                    // where "left" in html is actually the "left" in tdl minus the border width
                    left: allStyle["left"],
                    top: allStyle["top"],
                }}>
                    <this._ElementArea></this._ElementArea>
                    {this.showResizers() ? <this._ElementResizer /> : null}
                </div>
                {this.showSidebar() ? this._sidebar?.getElement() : null}
            </ErrorBoundary>
        );
    };

    _ElementAreaRaw = ({ }: any): React.JSX.Element => {
        const backgroundColor = this._getElementAreaRawBackgroundStyle();
        const outline = this._getElementAreaRawOutlineStyle();

        return (
            <div
                style={{
                    display: "inline-flex",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    overflow: "visible",
                    outline: outline,
                    backgroundColor: backgroundColor,
                }}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                <this._ElementRectangle></this._ElementRectangle>
            </div>
        );
    };

    _Element = React.memo(this._ElementRaw, () => this._useMemoedElement());
    _ElementArea = React.memo(this._ElementAreaRaw, () => this._useMemoedElement());


    _ElementRectangle = () => {
        const allText = this.getAllText();
        const allStyle = this.getAllStyle();
        const width = allStyle["width"];
        const height = allStyle["height"];
        // border line width must be smaller than width or height
        const lineWidth = Math.min(allText["lineWidth"], width - 1, height - 1);
        const lineColor = this._getElementAreaRawShapeStyle();
        const strokeDashArray = this.calcStrokeDasharray();
        const cornerWidth = allText["cornerWidth"];
        const cornerHeight = allText["cornerHeight"];
        const fillColor = allText["fill"] ? this._getElementAreaRawFillStyle() : "none";

        return (
            <svg
                width="100%"
                height="100%"
                x="0"
                y="0"
                style={{
                    position: "absolute",
                    overflow: "visible",
                }}
            >
                <rect
                    x={`${lineWidth / 2}`}
                    y={`${lineWidth / 2}`}
                    width={`${width - lineWidth}`}
                    height={`${height - lineWidth}`}
                    strokeWidth={`${lineWidth}`}
                    stroke={lineColor}
                    strokeDasharray={strokeDashArray}
                    strokeLinecap={"butt"}
                    rx={`${cornerWidth}`}
                    ry={`${cornerHeight}`}
                    fill={fillColor}
                ></rect>
            </svg>
        );
    };

    // -------------- helpers -------------------------

    calcStrokeDasharray = () => {
        const allText = this.getAllText();
        const lineWidth = allText["lineWidth"];
        const lineStyle = allText["lineStyle"];
        switch (lineStyle) {
            case "solid":
                return ``;
            case "dotted":
                return `${lineWidth},${lineWidth}`;
            case "dashed":
                return `${4 * lineWidth},${2 * lineWidth}`;
            case "dash-dot":
                return `${4 * lineWidth},${lineWidth},${lineWidth},${lineWidth}`;
            case "dash-dot-dot":
                return `${4 * lineWidth},${lineWidth},${lineWidth},${lineWidth},${lineWidth},${lineWidth}`;
            default:
                return "";
        }
    };
    // -------------------------- tdl -------------------------------

    static generateDefaultTdl = (): type_Rectangle_tdl => {
        const widgetKey = GlobalMethods.generateWidgetKey(defaultRectangleTdl.type);
        return structuredClone({
            ...defaultRectangleTdl,
            widgetKey: widgetKey,
        });
    };

    generateDefaultTdl: () => any = Rectangle.generateDefaultTdl;

    // -------------------------- sidebar ---------------------------
    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new RectangleSidebar(this);
        }
    }
}
