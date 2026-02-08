import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { GlobalVariables } from "../../../common/GlobalVariables";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { RectangleSidebar } from "./RectangleSidebar";
import { rgbaArrayToRgbaStr, rgbaStrToRgbaArray } from "../../../common/GlobalMethods";
import { RectangleRules } from "./RectangleRules";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { ChannelSeverity } from "../../channel/TcaChannel";

export type type_Rectangle_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
};

export class Rectangle extends BaseWidget {

    _rules: RectangleRules;

    constructor(widgetTdl: type_Rectangle_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this.setReadWriteType("read");

        this._rules = new RectangleRules(this, widgetTdl);

        this.setBorderType("inside");
    }

    // ------------------------------ elements ---------------------------------

    // Body + sidebar
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
                    <this._ElementBody></this._ElementBody>
                    {this.showSidebar() ? this._sidebar?.getElement() : null}
                </>
            </ErrorBoundary>
        );
    };

    calcOutlineColor = () => {
        const lineColor = rgbaStrToRgbaArray(this.getAllText()["lineColor"]);
        // same as color collapsible title
        if (lineColor[0] + lineColor[1] + lineColor[2] > GlobalVariables.colorSumChange) {
            return "rgba(30, 30, 30, 1)";
        } else {
            return "rgba(230,230,230,1)";
        }
    };
    // Text area and resizers
    _ElementBodyRaw = (): React.JSX.Element => {
        return (
            // always update the div below no matter the TextUpdateBody is .memo or not
            // TextUpdateResizer does not update if it is .memo
            <div style={{ ...this.getElementBodyRawStyle() }}>
                <this._ElementArea></this._ElementArea>
                {this.showResizers() ? <this._ElementResizer /> : null}
            </div>
        );
    };

    // only shows the text, all other style properties are held by upper level _ElementBodyRaw
    _ElementAreaRaw = ({ }: any): React.JSX.Element => {
        // const hideRectangle = this.getChannelNamesLevel4().length > 0 && this._getChannelSeverity() === ChannelSeverity.INVALID && this._getChannelValue() === undefined;
        // const hideRectangle = this.getChannelNamesLevel4().length > 0 && this._getFirstChannelValue() === undefined;
        return (
            // <div
            <div
                style={{
                    display: "inline-flex",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    userSelect: "none",
                    position: "relative",
                    overflow: "visible",
                    whiteSpace: this.getAllText().wrapWord ? "normal" : "pre",
                    justifyContent: this.getAllText().horizontalAlign,
                    alignItems: this.getAllText().verticalAlign,
                    fontFamily: this.getAllStyle().fontFamily,
                    fontSize: this.getAllStyle().fontSize,
                    fontStyle: this.getAllStyle().fontStyle,
                    fontWeight: this.getAllStyle().fontWeight,
                    outline: this._getElementAreaRawOutlineStyle(),
                    backgroundColor: this.getAllText()["invisibleInOperation"] ? "rgba(0,0,0,0)" : this._getElementAreaRawBackgroundStyle(),
                }}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                <this._ElementRectangle></this._ElementRectangle>
            </div>
        );
    };

    _ElementRectangle = () => {
        const width = this.getAllStyle()["width"];
        const height = this.getAllStyle()["height"];
        const strokeWidth = this.getAllText()["lineWidth"];
        return (
            <svg
                width="100%"
                height="100%"
                x="0"
                y="0"
                style={{
                    position: "absolute",
                    overflow: "visible",
                    opacity: this.getAllText()["invisibleInOperation"] === true && !g_widgets1.isEditing() ? 0 : 1,
                }}
            >
                {width > strokeWidth && height > strokeWidth ?
                    <rect
                        x={`${this.getAllText()["lineWidth"] / 2}`}
                        y={`${this.getAllText()["lineWidth"] / 2}`}
                        width={`${this.getAllStyle()["width"] - this.getAllText()["lineWidth"]}`}
                        height={`${this.getAllStyle()["height"] - this.getAllText()["lineWidth"]}`}
                        strokeWidth={this.getAllText()["lineWidth"]}
                        stroke={this._getElementAreaRawShapeStyle()}
                        strokeDasharray={this.calcStrokeDasharray()}
                        strokeLinecap={"butt"}
                        rx={`${this.getAllText()["cornerWidth"]}`}
                        ry={`${this.getAllText()["cornerHeight"]}`}
                        fill={this.getAllText()["fill"] ? this._getElementAreaRawFillStyle() : "none"}
                    ></rect>
                    :
                    width <= strokeWidth && height > strokeWidth ?
                        <path
                            d={`M ${width / 2} 0 v ${height}`}
                            stroke={this._getElementAreaRawShapeStyle()}
                            strokeWidth={width} />
                        :
                        width > strokeWidth && height <= strokeWidth ?
                            <path
                                // d={`M 0 ${height / 2} ${width} ${height / 2}`}
                                d={`M 0 ${height / 2} h ${width}`}
                                stroke={this._getElementAreaRawShapeStyle()}
                                strokeWidth={height} />
                            :
                            null
                }
            </svg>
        );
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
    // ------------------------- rectangle ------------------------------------

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
    // showSidebar()
    // showResizers()
    // _useMemoedElement()
    // hasChannel()
    // isInGroup()
    // isSelected()
    // _getElementAreaRawOutlineStyle()

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

        const defaultTdl: type_Rectangle_tdl = {
            type: "Rectangle",
            widgetKey: "", // "key" is a reserved keyword
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
                backgroundColor: "rgba(0, 0, 0, 0)", // always transparent, background is controlled in fillColor
                // angle
                transform: "rotate(0deg)",
                // shows when the widget is selected
                outlineStyle: "none",
                outlineWidth: 1,
                outlineColor: "black",
            },
            text: {
                // line
                lineWidth: 3,
                lineColor: "rgba(0, 0, 255, 1)",
                lineStyle: "solid",
                // fill
                fillColor: "rgba(30, 144,255,1)",
                fill: true,
                // corner
                cornerWidth: 0,
                cornerHeight: 0,
                invisibleInOperation: false,
                alarmBorder: false,
                alarmShape: false,
                alarmFill: false,
                alarmBackground: false,
                alarmLevel: "MINOR",
            },
            channelNames: [],
            groupNames: [],
            rules: [],
        };
        return JSON.parse(JSON.stringify(defaultTdl));
    };

    generateDefaultTdl: () => any = Rectangle.generateDefaultTdl;
    
    // -------------------------- sidebar ---------------------------
    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new RectangleSidebar(this);
        }
    }
}
