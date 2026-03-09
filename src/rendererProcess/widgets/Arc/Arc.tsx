import * as GlobalMethods from "../../../common/GlobalMethods";
import * as React from "react";
import { g_setWidgets1, g_widgets1 } from "../../global/GlobalVariables";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { BaseWidgetRules, type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { ArcRule } from "./ArcRule";
import { ArcSidebar } from "./ArcSidebar";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { defaultArcTdl, type_Arc_tdl, type_Label_tdl } from "../../../common/types/type_widget_tdl";


export class Arc extends BaseWidget {

    _rules: BaseWidgetRules;

    constructor(widgetTdl: type_Arc_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);

        this.setReadWriteType("read");

        this._rules = new BaseWidgetRules(this, widgetTdl, ArcRule);
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
        const outline = this._getElementAreaRawOutlineStyle();
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
                    position: "absolute",
                    overflow: "visible",
                    whiteSpace: whiteSpace,
                    justifyContent: justifyContent,
                    alignItems: alignItems,
                    outline: outline,
                    backgroundColor: backgroundColor,
                }}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                <this._ElementArc></this._ElementArc>
            </div>
        );
    };

    _Element = React.memo(this._ElementRaw, () => this._useMemoedElement());
    _ElementArea = React.memo(this._ElementAreaRaw, () => this._useMemoedElement());

    _ElementArc = () => {

        const allStyle = this.getAllStyle();
        const allText = this.getAllText();

        const width = allStyle["width"];
        const height = allStyle["height"];
        const arrowLength = allText["arrowLength"];
        const arrowWidth = allText["arrowWidth"];
        const lineWidth = allText["lineWidth"];
        const lineColor = this._getElementAreaRawShapeStyle();

        // center and radius of the arc
        const centerX = width / 2;
        const centerY = height / 2;
        const rX = centerX - lineWidth / 2;
        const rY = centerY - lineWidth / 2;

        // arc points
        const points = this.calcPoints();

        // if the arc is larger than 180 degrees
        const angleRange = allText["angleRange"];
        const largeArcFlag = Math.abs(angleRange) > 180 ? "1" : "0";

        // show radius lines or not
        const showRadius = allText["showRadius"];
        const showRadiusCommand =
            showRadius === "radius"
                ? `L ${centerX} ${centerY} L ${points[0][0]} ${points[0][1]}`
                : showRadius === "secant"
                    ? "z"
                    : "";


        // fill color for arrow and arc body
        const fillColor = this._getElementAreaRawFillStyle();
        const fillArcArea = allText["fill"];
        const arcFillColor = fillArcArea ? fillColor : "none"

        // head and tail arrows
        const showArrowTail = allText["showArrowTail"];
        const showArrowHead = allText["showArrowHead"];

        // Compute tangent angle (SVG rotation degrees) at a point on the
        // ellipse.  The tangent follows the CCW (sweep-flag=0) path direction.
        const tangentAngleDeg = (px: number, py: number): number => {
            const tdx = rX * (py - centerY) / rY;
            const tdy = -rY * (px - centerX) / rX;
            return Math.atan2(tdy, tdx) * 180 / Math.PI;
        };
        // Arrow size in SVG user units (original markers used markerUnits="strokeWidth")
        const aLen = arrowLength * lineWidth;
        const aHalf = arrowWidth * lineWidth / 2;

        // line is dashed/dotted/...
        const lineData = this.calcStrokeDasharray();

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
                {/* Arc + radius/secant closing lines */}
                <path
                    d={`M ${points[0][0]} ${points[0][1]} A ${rX} ${rY} 0 ${largeArcFlag} 0 ${points[1][0]} ${points[1][1]} ${showRadiusCommand}`}
                    strokeWidth={lineWidth}
                    stroke={lineColor}
                    strokeDasharray={lineData}
                    strokeLinecap={"butt"}
                    fill={arcFillColor}
                ></path>
                {/* Arrow tail at path start (points[0]) */}
                {showArrowTail && (
                    <polygon
                        points={`0,${-aHalf} ${-aLen},0 0,${aHalf}`}
                        fill={lineColor}
                        transform={`translate(${points[0][0]},${points[0][1]}) rotate(${tangentAngleDeg(points[0][0], points[0][1])})`}
                    />
                )}
                {/* Arrow head at path end (points[1]) */}
                {showArrowHead && (
                    <polygon
                        points={`0,${-aHalf} ${aLen},0 0,${aHalf}`}
                        fill={lineColor}
                        transform={`translate(${points[1][0]},${points[1][1]}) rotate(${tangentAngleDeg(points[1][0], points[1][1])})`}
                    />
                )}
            </svg>
        );
    };

    // -------------------- helper functions ----------------

    calcPoints = (): [[number, number], [number, number]] => {
        const pi = 3.1415926;

        const lineWidth = this.getAllText()["lineWidth"];

        const a = this.getAllStyle()["width"] / 2;
        const b = this.getAllStyle()["height"] / 2;

        let angleStart = this.getAllText()["angleStart"];
        let angleEnd = this.getAllText()["angleRange"] + angleStart;
        if (this.getAllText()["angleRange"] < 0) {
            const tmp = angleEnd;
            angleEnd = angleStart;
            angleStart = tmp;
        }

        return [
            [a + (a - lineWidth / 2) * Math.cos((angleStart * pi) / 180), b - (b - lineWidth / 2) * Math.sin((angleStart * pi) / 180)],
            [a + (a - lineWidth / 2) * Math.cos((angleEnd * pi) / 180), b - (b - lineWidth / 2) * Math.sin((angleEnd * pi) / 180)],
        ];
    };

    calcStrokeDasharray = () => {
        const lineWidth = this.getAllText()["lineWidth"];
        switch (this.getAllText()["lineStyle"]) {
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

    static generateDefaultTdl = (): type_Arc_tdl => {
        const widgetKey = GlobalMethods.generateWidgetKey(defaultArcTdl.type);
        return structuredClone({
            ...defaultArcTdl,
            widgetKey: widgetKey,
        });

    };

    generateDefaultTdl: () => any = Arc.generateDefaultTdl;

    // -------------------------- sidebar ---------------------------

    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new ArcSidebar(this);
        }
    }
}
