import * as GlobalMethods from "../../../common/GlobalMethods";
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
    // ByteMonitor specific
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

        const defaultTdl = this.generateDefaultTdl();
        this._bitNames = deepMerge(defaultTdl.bitNames, widgetTdl.bitNames);
        this._itemColors = deepMerge(defaultTdl.itemColors, widgetTdl.itemColors);

        // must contain exactly 2 colors, representing value 0 and value 1
        this._itemColors.splice(2);

        this._rules = new ByteMonitorRules(this, widgetTdl);
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
        const whiteSpace = this.getAllText().wrapWord ? "normal" : "pre";
        const justifyContent = this.getAllText().horizontalAlign;
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
                    position: "absolute",
                    overflow: "visible",
                    whiteSpace: whiteSpace,
                    justifyContent: justifyContent,
                    alignItems: alignItems,
                    outline: outline,
                }}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                <this._ElementByteMonitor></this._ElementByteMonitor>
            </div>
        );
    };

    _Element = React.memo(this._ElementRaw, () => this._useMemoedElement());
    _ElementArea = React.memo(this._ElementAreaRaw, () => this._useMemoedElement());

    _ElementByteMonitor = () => {
        const allText = this.getAllText();
        const allStyle = this.getAllStyle();
        const horizontalElementNumber = allText["direction"] === "horizontal" ? allText["bitLength"] : 1;
        const verticalElementNumber = allText["direction"] === "horizontal" ? 1 : allText["bitLength"];
        const direction = allText["direction"];
        const flexDirection = direction === "horizontal" ? "row" : "column"
        const bitValues = this.calcBitValues();
        const width = allStyle["width"];
        const height = allStyle["height"];

        const ledWidth = width / horizontalElementNumber;
        const ledHeight = height / verticalElementNumber;

        return (
            <div
                style={{
                    display: "inline-flex",
                    flexDirection: flexDirection,
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: "100%",
                    position: "relative",
                }}
            >
                {bitValues.map((bitValue: number | undefined, index: number) => {
                    return (
                        <div
                            key={`${bitValue}-${index}-round`}
                            // a small square/circle -- one LED
                            style={{
                                position: "relative",
                                width: ledWidth,
                                height: ledHeight,
                            }}
                        >
                            {/* both elements are absolute position with 100% width and height */}
                            <this._ElementLED bitValue={bitValue}></this._ElementLED>
                            <this._ElementText index={index}></this._ElementText>
                        </div>
                    );

                })}
            </div>
        );
    };

    _ElementLED = ({ bitValue }: any) => {
        if (this.getAllText()["shape"] === "round") {
            return (
                <this._ElementLEDRound bitValue={bitValue}></this._ElementLEDRound>
            )
        } else {
            return (
                <this._ElementLEDSquare bitValue={bitValue}></this._ElementLEDSquare>
            )
        }
    }

    _ElementLEDSquare = ({ bitValue }: any) => {
        if (g_widgets1.isEditing()) {
            return (
                <this._ElementLEDSquareEditing bitValue={bitValue}></this._ElementLEDSquareEditing>
            )
        } else {
            return (
                <this._ElementLEDSquareOperating bitValue={bitValue}></this._ElementLEDSquareOperating>
            )
        }
    };

    _ElementLEDSquareEditing = ({ bitValue }: any) => {
        const allText = this.getAllText();
        const allStyle = this.getAllStyle();
        const direction = allText["direction"];
        const bitLength = allText["bitLength"];
        const width = allStyle["width"];
        const height = allStyle["height"];
        const lineWidth = allText["lineWidth"];
        const lineColor = allText["lineColor"];

        const horizontalElementNumber = direction === "horizontal" ? bitLength : 1;
        const verticalElementNumber = direction === "horizontal" ? 1 : bitLength;

        // calculate half square
        const point1X = width / horizontalElementNumber;
        const point1Y = 0;
        const point2X = width / horizontalElementNumber;
        const point2Y = height / verticalElementNumber;
        const point3X = 0;
        const point3Y = height / verticalElementNumber;
        const point4X = 0;
        const point4Y = 0;
        const d0 = `M ${point1X} ${point1Y} L ${point4X} ${point4Y} L ${point3X} ${point3Y}`;
        const d1 = `M ${point1X} ${point1Y} L ${point2X} ${point2Y} L ${point3X} ${point3Y}`;

        // 0 and 1 colors
        const itemColors = this.getItemColors();
        const fillColor0 = itemColors[0];
        const fillColor1 = itemColors[1];

        const outlineWidth = width / horizontalElementNumber;
        const outlineHeight = height / verticalElementNumber;
        const borderWidth = this.isSelected() ? "1" : "0";
        const outlineColor = this.calcOutlineColor();

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
                    d={d0}
                    strokeWidth={`${lineWidth}`}
                    stroke={lineColor}
                    fill={fillColor0}
                ></path>
                <path
                    d={d1}
                    strokeWidth={`${lineWidth}`}
                    stroke={lineColor}
                    fill={fillColor1}
                ></path>
                {/* outline, enabled upon selection */}
                <rect
                    width={`${outlineWidth}`}
                    height={`${outlineHeight}`}
                    strokeWidth={`${borderWidth}`}
                    stroke={`${outlineColor}`}
                    fill="none"
                ></rect>
            </svg>
        );
    };

    _ElementLEDSquareOperating = ({ bitValue }: any) => {
        const allText = this.getAllText();
        const allStyle = this.getAllStyle();
        const direction = allText["direction"];
        const bitLength = allText["bitLength"];
        const width = allStyle["width"];
        const height = allStyle["height"];
        const lineWidth = allText["lineWidth"];
        const lineColor = allText["lineColor"];
        const fallbackColor = allText["fallbackColor"];

        const horizontalElementNumber = direction === "horizontal" ? bitLength : 1;
        const verticalElementNumber = direction === "horizontal" ? 1 : bitLength;

        // if there is a rule on the background color, the mechanism of setting the background color does not work
        // as the fill color of <rect /> is by default from the bit-0/1 color settings
        let fillColor = fallbackColor;
        if (bitValue === 0 || bitValue === 1) {
            fillColor = this.getItemColors()[bitValue]; // default value
            const ruledBackgroundColor = this.getRulesStyle()["backgroundColor"];
            if (ruledBackgroundColor !== undefined) {
                fillColor = ruledBackgroundColor;
            }
        }

        const ledWidth = width / horizontalElementNumber;
        const ledHeight = height / verticalElementNumber;

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
                    width={`${ledWidth}`}
                    height={`${ledHeight}`}
                    strokeWidth={`${lineWidth}`}
                    stroke={lineColor}
                    fill={fillColor}
                ></rect>
            </svg>
        );

    };

    _ElementLEDRound = ({ bitValue }: any) => {
        if (g_widgets1.isEditing()) {
            return (
                <this._ElementLEDRoundEditing bitValue={bitValue}></this._ElementLEDRoundEditing>
            )
        } else {
            return (
                <this._ElementLEDRoundOperating bitValue={bitValue}></this._ElementLEDRoundOperating>
            )
        }
    };

    _ElementLEDRoundEditing = ({ bitValue }: any) => {
        const allText = this.getAllText();
        const allStyle = this.getAllStyle();
        const direction = allText["direction"];
        const bitLength = allText["bitLength"];
        const width = allStyle["width"];
        const height = allStyle["height"];
        const lineWidth = allText["lineWidth"];
        const lineColor = allText["lineColor"];

        // calculate the half-circle
        const horizontalElementNumber = direction === "horizontal" ? bitLength : 1;
        const verticalElementNumber = direction === "horizontal" ? 1 : bitLength;
        const rX = width / 2 / horizontalElementNumber;
        const rY = height / 2 / verticalElementNumber;
        const point1X = rX + rX * 0.70711;
        const point1Y = rY - rY * 0.70711;
        const point2X = rX - rX * 0.70711;
        const point2Y = rY + rY * 0.70711;

        const d1 = `M ${point1X} ${point1Y} A ${rX} ${rY} 0 0 0 ${point2X} ${point2Y}`;
        const d2 = `M ${point2X} ${point2Y} A ${rX} ${rY} 0 0 0 ${point1X} ${point1Y}`;

        // 0 and 1 colors
        const itemColors = this.getItemColors();
        const fillColor0 = itemColors[0];
        const fillColor1 = itemColors[1];

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
                {/* half a circle */}
                <path
                    d={d1}
                    strokeWidth={lineWidth}
                    stroke={lineColor}
                    fill={fillColor0}
                ></path>
                {/* half a circle */}
                <path
                    d={d2}
                    strokeWidth={lineWidth}
                    stroke={lineColor}
                    fill={fillColor1}
                ></path>
            </svg>
        );
    };

    _ElementLEDRoundOperating = ({ bitValue }: any) => {
        const allText = this.getAllText();
        const allStyle = this.getAllStyle();
        const direction = allText["direction"];
        const bitLength = allText["bitLength"];
        const width = allStyle["width"];
        const height = allStyle["height"];
        const lineWidth = allText["lineWidth"];
        const lineColor = allText["lineColor"];
        const fallbackColor = allText["fallbackColor"];

        const horizontalElementNumber = direction === "horizontal" ? bitLength : 1;
        const verticalElementNumber = direction === "horizontal" ? 1 : bitLength;

        // if there is a rule on the background color, the mechanism of setting the background color does not work
        // as the fill color of <rect /> is by default from the bit-0/1 color settings
        let fillColor = fallbackColor;
        if (bitValue === 0 || bitValue === 1) {
            fillColor = this.getItemColors()[bitValue]; // default value
            const ruledBackgroundColor = this.getRulesStyle()["backgroundColor"];
            if (ruledBackgroundColor !== undefined) {
                fillColor = ruledBackgroundColor;
            }
        }

        const cx = width / 2 / horizontalElementNumber;
        const cy = height / 2 / verticalElementNumber;
        const rx = width / 2 / horizontalElementNumber;
        const ry = height / 2 / verticalElementNumber;

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
                    cx={`${cx}`}
                    cy={`${cy}`}
                    rx={`${rx}`}
                    ry={`${ry}`}
                    strokeWidth={`${lineWidth}`}
                    stroke={lineColor}
                    fill={fillColor}
                ></ellipse>
            </svg>
        );

    };

    _ElementText = ({ index }: any) => {
        const allText = this.getAllText();

        // fill in bit names
        const bitNames = [...this.getBitNames()];
        const bitLength = allText["bitLength"];
        const fullBitNames = Array.from({ length: bitLength }, (_, i) => bitNames[i] ?? '');

        // reverse bit names array if sequence is positive
        const sequence = allText["sequence"];
        if (sequence === "positive") {
            fullBitNames.reverse();
        }

        return (
            <div
                style={{
                    position: "absolute",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: "100%",
                }}
            >
                {fullBitNames[index]}
            </div>
        )
    }

    // -------------------- helper functions ----------------

    /**
     * calculate the bit sequence from the channel value
     * 
     * normally, the bits are in order from most significant to least significant,
     * if the sequence is reversed, the bits order is reversed
     * 
     */
    calcBitValues = (): (number | undefined)[] => {

        const allText = this.getAllText();
        const bitLength = allText["bitLength"];
        const bitStart = allText["bitStart"];
        const sequence = allText["sequence"];

        if (g_widgets1.isEditing()) {
            return Array.from({ length: bitLength }, (v, i) => 0);
        }

        const channelValue = this._getChannelValue(true);
        const result: (number | undefined)[] = [];
        if (typeof channelValue === "number") {
            for (let ii = bitStart; ii < bitStart + bitLength; ii++) {
                const value = (Math.floor(channelValue) >> ii) & 0x1;
                result.push(value);
            }
        } else {
            for (let ii = 0; ii < bitLength; ii++) {
                result.push(undefined);
            }
        }

        if (sequence === "positive") {
            result.reverse();
        }

        return result;
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
        defaultTdl["widgetKey"] = GlobalMethods.generateWidgetKey(defaultTdl["type"]);
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
