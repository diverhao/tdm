import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { GlobalVariables } from "../../../common/GlobalVariables";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { ByteMonitorSidebar } from "./ByteMonitorSidebar";
import { deepMerge, rgbaStrToRgbaArray } from "../../../common/GlobalMethods";
import { ByteMonitorRules } from "./ByteMonitorRules";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";

export type type_ByteMonitor_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
    bitNames: string[];
    itemColors: string[];
};

export class ByteMonitor extends BaseWidget {

    _rules: ByteMonitorRules;
    _bitNames: string[];
    _itemColors: string[];

    constructor(widgetTdl: type_ByteMonitor_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this.setReadWriteType("read");

        this._bitNames = deepMerge(this.generateDefaultTdl().bitNames, widgetTdl.bitNames);
        this._itemColors = deepMerge(this.generateDefaultTdl().itemColors, widgetTdl.itemColors);

        this._itemColors.splice(2, this._itemColors.length - 2);

        this._rules = new ByteMonitorRules(this, widgetTdl);
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

    // Text area and resizers
    _ElementBodyRaw = (): React.JSX.Element => {
        return (
            // always update the div below no matter the TextUpdateBody is .memo or not
            // TextUpdateResizer does not update if it is .memo
            <div style={this.getElementBodyRawStyle()}>
                <this._ElementArea></this._ElementArea>
                {this.showResizers() ? <this._ElementResizer /> : null}
            </div>
        );
    };

    // only shows the text, all other style properties are held by upper level _ElementBodyRaw
    _ElementAreaRaw = ({ }: any): React.JSX.Element => {
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
                    position: "absolute",
                    overflow: "visible",
                    whiteSpace: this.getAllText().wrapWord ? "normal" : "pre",
                    justifyContent: this.getAllText().horizontalAlign,
                    alignItems: this.getAllText().verticalAlign,
                    fontFamily: this.getAllStyle().fontFamily,
                    fontSize: this.getAllStyle().fontSize,
                    fontStyle: this.getAllStyle().fontStyle,
                    fontWeight: this.getAllStyle().fontWeight,
                    outline: this._getElementAreaRawOutlineStyle(),
                }}
                // title={"tooltip"}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                <this._ElementByteMonitor></this._ElementByteMonitor>
            </div>
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

    /**
     * 0/1/-1
     */
    calcBitValues = (): number[] => {
        if (g_widgets1.isEditing()) {
            return Array.from({ length: this.getAllText()["bitLength"] }, (v, i) => 0);
        }

        const channelValue = this._getChannelValue(true);
        const result: number[] = [];
        if (typeof channelValue === "number") {
            for (let ii = this.getAllText()["bitStart"]; ii < this.getAllText()["bitStart"] + this.getAllText()["bitLength"]; ii++) {
                // const value = (Math.floor(Math.abs(channelValue)) >> ii) & 0x1;
                const value = (Math.floor(channelValue) >> ii) & 0x1;
                result.push(value);
            }
        } else {
            for (let ii = 0; ii < this.getAllText()["bitLength"]; ii++) {
                result.push(-1);
            }
        }

        if (this.getAllText()["sequence"] === "positive") {
            return result.reverse();
        } else {
            return result;
        }
    };

    _ElementByteMonitor = () => {
        const horizontalElementNumber = this.getAllText()["direction"] === "horizontal" ? this.getAllText()["bitLength"] : 1;
        const verticalElementNumber = this.getAllText()["direction"] === "horizontal" ? 1 : this.getAllText()["bitLength"];

        return (
            <div
                style={{
                    display: "inline-flex",
                    flexDirection: this.getAllText()["direction"] === "horizontal" ? "row" : "column",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    opacity: this.getAllText()["invisibleInOperation"] === true && !g_widgets1.isEditing() ? 0 : 1,
                }}
            >
                {this.calcBitValues().map((bitValue: number, index: number) => {
                    if (this.getAllText()["shape"] === "round") {
                        return (
                            <div
                                key={`${bitValue}-${index}-round`}
                                style={{
                                    position: "relative",
                                    width: this.getAllStyle()["width"] / horizontalElementNumber,
                                    height: this.getAllStyle()["height"] / verticalElementNumber,
                                }}
                            >
                                <this._ElementLEDRound bitValue={bitValue} index={index}></this._ElementLEDRound>
                                <div
                                    style={{
                                        position: "absolute",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        width: "100%",
                                        height: "100%",
                                        color: this.getAllStyle()["color"],
                                    }}
                                >
                                    {this.getAllText()["sequence"] === "positive"
                                        ? this.getBitNames()[this.calcBitValues().length - 1 - index]
                                            ? this.getBitNames()[this.calcBitValues().length - 1 - index]
                                            : ""
                                        : this.getBitNames()[index]
                                            ? this.getBitNames()[index]
                                            : ""}
                                </div>
                            </div>
                        );
                    } else {
                        return (
                            <div
                                key={`${bitValue}-${index}-square`}
                                style={{
                                    position: "relative",
                                    width: this.getAllStyle()["width"] / horizontalElementNumber,
                                    height: this.getAllStyle()["height"] / verticalElementNumber,
                                }}
                            >
                                <this._ElementLEDSquare bitValue={bitValue} index={index}></this._ElementLEDSquare>{" "}
                                <div
                                    style={{
                                        position: "absolute",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        width: "100%",
                                        height: "100%",
                                        // color: this.calcFontColor(bitValue),
                                        color: this.getAllStyle()["color"],
                                    }}
                                >
                                    {this.getAllText()["sequence"] === "positive"
                                        ? this.getBitNames()[this.calcBitValues().length - 1 - index]
                                            ? this.getBitNames()[this.calcBitValues().length - 1 - index]
                                            : ""
                                        : this.getBitNames()[index]
                                            ? this.getBitNames()[index]
                                            : ""}
                                </div>
                            </div>
                        );
                    }
                })}
            </div>
        );
    };

    _ElementLEDSquare = ({ bitValue, index }: any) => {
        const horizontalElementNumber = this.getAllText()["direction"] === "horizontal" ? this.getAllText()["bitLength"] : 1;
        const verticalElementNumber = this.getAllText()["direction"] === "horizontal" ? 1 : this.getAllText()["bitLength"];

        // if there is a rule on the background color, the mechanism of setting the background color does not work
        // as the fill color of <rect /> is by default from the bit-0/1 color settings
        let fillColor = this.getItemColors()[bitValue]; // default value
        const ruledBackgroundColor = this.getRulesStyle()["backgroundColor"];
        if (ruledBackgroundColor !== undefined) {
            fillColor = ruledBackgroundColor;
        }


        // const length = this.getText()["bitLength"];
        const point1X = this.getAllStyle()["width"] / horizontalElementNumber;
        const point1Y = 0;
        const point2X = this.getAllStyle()["width"] / horizontalElementNumber;
        const point2Y = this.getAllStyle()["height"] / verticalElementNumber;
        const point3X = 0;
        const point3Y = this.getAllStyle()["height"] / verticalElementNumber;
        const point4X = 0;
        const point4Y = 0;

        if (g_widgets1.isEditing()) {
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
                    <path
                        d={`M ${point1X} ${point1Y} L ${point2X} ${point2Y} L ${point3X} ${point3Y}`}
                        strokeWidth={this.getAllText()["lineWidth"]}
                        stroke={this.getAllText()["lineColor"]}
                        fill={`${this.getItemColors()[1]}`}
                    ></path>
                    <path
                        d={`M ${point1X} ${point1Y} L ${point4X} ${point4Y} L ${point3X} ${point3Y}`}
                        strokeWidth={this.getAllText()["lineWidth"]}
                        stroke={this.getAllText()["lineColor"]}
                        fill={`${this.getItemColors()[0]}`}
                    ></path>
                    {/* outline, enabled upon selection */}
                    <rect
                        width={`${this.getAllStyle()["width"] / horizontalElementNumber}`}
                        height={`${this.getAllStyle()["height"] / verticalElementNumber}`}
                        strokeWidth={`${this.isSelected() ? "1" : "0"}`}
                        stroke={`${this.calcOutlineColor()}`}
                        fill="none"
                    ></rect>
                </svg>
            );
        } else {
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
                        width={`${this.getAllStyle()["width"] / horizontalElementNumber}`}
                        height={`${this.getAllStyle()["height"] / verticalElementNumber}`}
                        strokeWidth={this.getAllText()["lineWidth"]}
                        stroke={this.getAllText()["lineColor"]}
                        fill={bitValue === -1 ? this.getAllText()["fallbackColor"] : fillColor}
                    ></rect>
                </svg>
            );
        }
    };

    _ElementLEDRound = ({ bitValue, index }: any) => {
        const horizontalElementNumber = this.getAllText()["direction"] === "horizontal" ? this.getAllText()["bitLength"] : 1;
        const verticalElementNumber = this.getAllText()["direction"] === "horizontal" ? 1 : this.getAllText()["bitLength"];


        // if there is a rule on the background color, the mechanism of setting the background color does not work
        // as the fill color of <rect /> is by default from the bit-0/1 color settings
        let fillColor = this.getItemColors()[bitValue]; // default value
        const ruledBackgroundColor = this.getRulesStyle()["backgroundColor"];
        if (ruledBackgroundColor !== undefined) {
            fillColor = ruledBackgroundColor;
        }

        // const length = this.getText()["bitLength"];
        const rX = this.getAllStyle()["width"] / 2 / horizontalElementNumber;
        const rY = this.getAllStyle()["height"] / 2 / verticalElementNumber;
        const point1X = rX + rX * 0.7071067811865475244;
        const point1Y = rY - rY * 0.7071067811865475244;
        const point2X = rX - rX * 0.7071067811865475244;
        const point2Y = rY + rY * 0.7071067811865475244;

        if (g_widgets1.isEditing()) {
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
                    <path
                        d={`M ${point1X} ${point1Y} A ${rX} ${rY} 0 0 0 ${point2X} ${point2Y}`}
                        strokeWidth={this.getAllText()["lineWidth"]}
                        stroke={this.getAllText()["lineColor"]}
                        fill={`${this.getItemColors()[0]}`}
                    ></path>
                    <path
                        d={`M ${point2X} ${point2Y} A ${rX} ${rY} 0 0 0 ${point1X} ${point1Y}`}
                        strokeWidth={this.getAllText()["lineWidth"]}
                        stroke={this.getAllText()["lineColor"]}
                        fill={`${this.getItemColors()[1]}`}
                    ></path>
                </svg>
            );
        } else {
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
                    <ellipse
                        cx={`${this.getAllStyle()["width"] / 2 / horizontalElementNumber}`}
                        cy={`${this.getAllStyle()["height"] / 2 / verticalElementNumber}`}
                        rx={`${this.getAllStyle()["width"] / 2 / horizontalElementNumber}`}
                        ry={`${this.getAllStyle()["height"] / 2 / verticalElementNumber}`}
                        strokeWidth={this.getAllText()["lineWidth"]}
                        stroke={this.getAllText()["lineColor"]}
                        fill={bitValue === -1 ? this.getAllText()["fallbackColor"] : fillColor}
                    ></ellipse>
                </svg>
            );
        }
    };

    // ------------------------- rectangle ------------------------------------

    _Element = React.memo(this._ElementRaw, () => this._useMemoedElement());
    _ElementArea = React.memo(this._ElementAreaRaw, () => this._useMemoedElement());
    _ElementBody = React.memo(this._ElementBodyRaw, () => this._useMemoedElement());

    // -------------------- helper functions ----------------

    _getChannelValue = (raw: boolean = false) => {
        return this.getChannelValueForMonitorWidget(raw);
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

        const defaultTdl: type_ByteMonitor_tdl = {
            type: "ByteMonitor",
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
                // clear background, use "itemColors"
                backgroundColor: "rgba(0, 0, 0, 0)",
                // angle
                transform: "rotate(0deg)",
                // font
                color: "rgba(0,0,0,1)",
                fontFamily: GlobalVariables.defaultFontFamily,
                fontSize: GlobalVariables.defaultFontSize,
                fontStyle: GlobalVariables.defaultFontStyle,
                fontWeight: GlobalVariables.defaultFontWeight,
                // border, it is different from the "alarmBorder" below,
                borderStyle: "solid",
                borderWidth: 0,
                borderColor: "rgba(0, 0, 0, 1)",
                // shows when the widget is selected
                outlineStyle: "none",
                outlineWidth: 1,
                outlineColor: "black",
            },
            // the ElementBody style
            text: {
                horizontalAlign: "flex-start",
                verticalAlign: "flex-start",
                wrapWord: false,
                showUnit: false,
                alarmBorder: true,
                // line style for each bit
                lineWidth: 2,
                lineStyle: "solid",
                lineColor: "rgba(0, 0, 0, 1)",
                // shape, round/square
                shape: "round",
                bitStart: 0,
                bitLength: 8,
                direction: "horizontal", // vs "vertical"
                sequence: "positive", // vs "reverse"
                // if the value is not valid
                fallbackColor: "rgba(255,0,255,1)",
                invisibleInOperation: false,
            },
            channelNames: [],
            groupNames: [],
            rules: [],
            bitNames: [],
            itemColors: ["rgba(60, 100, 60, 1)", "rgba(60, 255, 60, 1)"],
        };
        return JSON.parse(JSON.stringify(defaultTdl));
    };

    generateDefaultTdl: () => any = ByteMonitor.generateDefaultTdl;

    getTdlCopy(newKey: boolean = true): Record<string, any> {
        const result = super.getTdlCopy(newKey);
        result["itemColors"] = JSON.parse(JSON.stringify(this.getItemColors()));
        result["bitNames"] = JSON.parse(JSON.stringify(this.getBitNames()));
        return result;
    }

    // --------------------- getters -------------------------

    getBitNames = () => {
        return this._bitNames;
    };
    getItemColors = () => {
        return this._itemColors;
    };

    // -------------------------- sidebar ---------------------------
    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new ByteMonitorSidebar(this);
        }
    }
}
