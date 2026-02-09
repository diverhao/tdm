import * as GlobalMethods from "../../../common/GlobalMethods";
import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { GlobalVariables } from "../../../common/GlobalVariables";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { LEDMultiStateSidebar } from "./LEDMultiStateSidebar";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { deepMerge, rgbaStrToRgbaArray } from "../../../common/GlobalMethods";
import { LEDMultiStateRules } from "./LEDMultiStateRules";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";

export type type_LEDMultiState_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
    // LEDMultiState specific
    itemNames: string[];
    itemColors: string[];
    itemValues: (number | string | number[] | string[] | undefined)[];
};

export class LEDMultiState extends BaseWidget {

    _rules: LEDMultiStateRules;
    _itemNames: string[];
    _itemColors: string[];
    _itemValues: (number | string | number[] | string[] | undefined)[];

    constructor(widgetTdl: type_LEDMultiState_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this.setReadWriteType("read");

        const defaultTdl = this.generateDefaultTdl();
        this._itemNames = deepMerge(widgetTdl.itemNames, defaultTdl.itemNames);
        this._itemColors = deepMerge(widgetTdl.itemColors, defaultTdl.itemColors);
        this._itemValues = deepMerge(widgetTdl.itemValues, defaultTdl.itemValues);
        // ensure the same number of states
        const numStates = Math.min(this._itemNames.length, this._itemColors.length, this._itemValues.length);
        this._itemNames.splice(numStates);
        this._itemColors.splice(numStates);
        this._itemValues.splice(numStates);

        this._rules = new LEDMultiStateRules(this, widgetTdl);
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
        const justifyContent = "center";
        const alignItems = "center";
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
                <this._ElementLED></this._ElementLED>
                <this._ElementText></this._ElementText>
            </div>
        );
    };

    _Element = React.memo(this._ElementRaw, () => this._useMemoedElement());
    _ElementArea = React.memo(this._ElementAreaRaw, () => this._useMemoedElement());


    _ElementLED = () => {
        const allText = this.getAllText();
        const shape = allText["shape"];
        if (shape === "round") {
            return (
                <this._ElementLEDRound></this._ElementLEDRound>
            )
        } else {
            return (
                <this._ElementLEDSquare></this._ElementLEDSquare>
            )
        }
    }

    _ElementText = () => {
        if (g_widgets1.isEditing()) {
            return null;
        } else {
            return (
                <div
                    style={{
                        display: "inline-flex",
                        position: "absolute",
                        width: "100%",
                        height: "100%",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    {this.calcItemText()}
                </div>
            );
        }
    };

    _ElementLEDSquareEditing = () => {
        const allStyle = this.getAllStyle();
        const allText = this.getAllText();
        const itemColors = this.getItemColors();
        const lineColor = allText["lineColor"];
        const lineWidth = allText["lineWidth"];
        const width = allStyle["width"];
        const height = allStyle["height"];
        const dBorder = `M 0 0 L ${width} 0 L ${width} ${height} L 0 ${height} L 0 0`;
        const outlineWidth = this.isSelected() ? 1 : 0;
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
                {/* show all colors */}
                {itemColors.map((color: string, index: number) => {
                    const d = this.calcLEDSquarePointsXY(index);
                    const fillColor = color;
                    const lineWidth = 0;
                    return (
                        <path
                            d={d}
                            strokeWidth={`${lineWidth}`}
                            fill={fillColor}
                        ></path>
                    );
                })}
                {/* border */}
                <path
                    d={dBorder}
                    strokeWidth={`${lineWidth}`}
                    stroke={lineColor}
                    fill={"none"}
                ></path>
                {/* outline, let the widget standing out when selected */}
                <rect
                    width={`${width}`}
                    height={`${height}`}
                    strokeWidth={`${outlineWidth}`}
                    stroke={outlineColor}
                    fill={"none"}
                ></rect>
            </svg>
        )
    }

    _ElementLEDSquareOperating = () => {
        const allText = this.getAllText();
        const lineWidth = allText["lineWidth"];
        const lineColor = allText["lineColor"];
        const fillColor = this.calcItemColor();

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
                    width={"100%"}
                    height={"100%"}
                    strokeWidth={`${lineWidth}`}
                    stroke={lineColor}
                    fill={fillColor}
                ></rect>
            </svg>
        );
    }

    _ElementLEDSquare = () => {
        if (g_widgets1.isEditing()) {
            return (
                <this._ElementLEDSquareEditing></this._ElementLEDSquareEditing>
            )
        } else {
            return (
                <this._ElementLEDSquareOperating></this._ElementLEDSquareOperating>
            )
        }
    };

    _ElementLEDRoundEditing = () => {
        const allText = this.getAllText();
        const itemColors = this.getItemColors();
        const lineColor = allText["lineColor"];
        const lineWidth = allText["lineWidth"];

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
                {itemColors.map((color: string, index: number) => {
                    const fillColor = color;
                    const d0 = this.calcLEDRoundPointXY(index)[0];
                    const d1 = this.calcLEDRoundPointXY(index)[1];
                    return (
                        <>
                            <path
                                d={d0}
                                strokeWidth={`${lineWidth}`}
                                stroke={lineColor}
                                fill={fillColor}
                            ></path>
                            <path
                                d={d1}
                                strokeWidth={1}
                                stroke={fillColor}
                                fill={fillColor}
                            ></path>
                        </>
                    );
                })}
            </svg>
        );
    }

    _ElementLEDRoundOperating = () => {
        const allStyle = this.getAllStyle();
        const allText = this.getAllText();
        const width = allStyle["width"];
        const height = allStyle["height"];
        const lineWidth = allText["lineWidth"];
        const lineColor = allText["lineColor"];
        const fillColor = this.calcItemColor();

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
                    cx={`${width / 2}`}
                    cy={`${height / 2}`}
                    rx={`${width / 2}`}
                    ry={`${height / 2}`}
                    strokeWidth={`${lineWidth}`}
                    stroke={lineColor}
                    fill={fillColor}
                ></ellipse>
            </svg>
        );

    }

    _ElementLEDRound = () => {
        if (g_widgets1.isEditing()) {
            return <this._ElementLEDRoundEditing></this._ElementLEDRoundEditing>
        } else {
            return <this._ElementLEDRoundOperating></this._ElementLEDRoundOperating>
        }
    };

    // -------------------- helper functions ----------------

    /**
     * When the square LED is selected, we want to let the outline standout
     */
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
     * find the index that corresponds to the channel value
     * 
     * reutrns a number or undefined
     */
    calcIndex = (): number | undefined => {
        const channelValue = this._getChannelValue(true);
        if (typeof channelValue === "number") {
            const index = this.getItemValues().indexOf(channelValue);
            if (index >= 0) {
                return index;
            }
        }
        return undefined;
    };


    /**
     * find the color that corresponds to the channel value
     */
    calcItemColor = () => {
        const index = this.calcIndex();

        if (index !== undefined) {
            const color = this.getItemColors()[index];
            if (GlobalMethods.isValidRgbaColor(color)) {
                return color;
            }
        }
        return this.getAllText()["fallbackColor"];
    };

    /**
     * find the text that corresponds to the channel value
     * 
     * the text is defined by user, this is different from the LED widget where
     * the text may be from channel
     */
    calcItemText = (): string => {

        const allText = this.getAllText();
        const itemNames = this.getItemNames();

        if (g_widgets1.isEditing()) {
            return itemNames.join("|");
        }

        const index = this.calcIndex();
        if (index !== undefined) {
            return itemNames[index];
        } else {
            return allText["fallbackText"];
        }
    };

    /**
     * calculate coordinate for one point on square LED
     */
    calcLEDSquarePointXY = (theta: number, rX: number, rY: number) => {
        const pi = 3.1415926;

        let point1X = 0;
        let point1Y = 0;
        if (theta >= 45 && theta < 135) {
            point1X = rX * (1 + 1 / Math.tan((theta * pi) / 180));
            point1Y = 0;
        } else if (theta >= 135 && theta < 225) {
            point1X = 0;
            point1Y = rY * (1 + Math.tan((theta * pi) / 180));
        } else if (theta >= 225 && theta < 315) {
            point1X = rX * (1 - 1 / Math.tan((theta * pi) / 180));
            point1Y = 2 * rY;
        } else {
            point1X = 2 * rX;
            point1Y = rY * (1 - Math.tan((theta * pi) / 180));
        }
        return [Math.round(point1X), Math.round(point1Y)];
    };

    /**
     * calculate coordinates for all points on square LED
     */
    calcLEDSquarePointsXY = (index: number): string => {
        const dTheta = 360 / this.getItemNames().length;

        const rX = this.getAllStyle()["width"] / 2;
        const rY = this.getAllStyle()["height"] / 2;

        const theta1 = 45 + index * dTheta;
        const point1XY = this.calcLEDSquarePointXY(theta1, rX, rY);

        const theta2 = 45 + (index + 1) * dTheta;
        const point2XY = this.calcLEDSquarePointXY(theta2, rX, rY);

        const a1 = Math.floor((theta1 - 45) / 90);
        const a2 = Math.floor((theta2 - 45) / 90);
        let interPoints = "";
        if (a1 !== a2) {
            for (let start = a1 + 1; start <= a2; start++) {
                const interPointXY = this.calcLEDSquarePointXY(45 + start * 90, rX, rY);
                interPoints = `${interPoints} L ${interPointXY[0]} ${interPointXY[1]}`;
            }
        }

        return `M ${rX} ${rY} L ${point1XY[0]} ${point1XY[1]} ${interPoints}  L ${point2XY[0]} ${point2XY[1]}`;
    };

    /**
     * calculate coordinate for one point on round LED
     */
    calcLEDRoundPointXY = (index: number): string[] => {
        const allStyle = this.getStyle();
        const width = allStyle["width"];
        const height = allStyle["height"];

        const pi = 3.1415926;
        const dTheta = 360 / this.getItemNames().length;
        const theta1 = 45 + index * dTheta;
        const theta2 = 45 + (index + 1) * dTheta;

        const rX = width / 2;
        const rY = height / 2;

        const point1X = width / 2 + width / 2 * Math.cos((theta1 * pi) / 180);
        const point1Y = height / 2 - height / 2 * Math.sin((theta1 * pi) / 180);
        const point2X = width / 2 + width / 2 * Math.cos((theta2 * pi) / 180);
        const point2Y = height / 2 - height / 2 * Math.sin((theta2 * pi) / 180);

        return [
            `M ${point1X} ${point1Y} A ${rX} ${rY} 0 0 0 ${point2X} ${point2Y}`,
            `M ${rX} ${rY} L ${point1X} ${point1Y} L ${point2X} ${point2Y}`
        ];
    };

    // -------------------------- tdl -------------------------------

    static generateDefaultTdl = (): Record<string, any> => {

        const defaultTdl: type_LEDMultiState_tdl = {
            type: "LEDMultiState",
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
                backgroundColor: "rgba(0, 0, 0, 0)",
                // angle
                transform: "rotate(0deg)",
                // font
                color: "rgba(0,0,0,1)",
                fontFamily: GlobalVariables.defaultFontFamily,
                fontSize: GlobalVariables.defaultFontSize,
                fontStyle: GlobalVariables.defaultFontStyle,
                fontWeight: GlobalVariables.defaultFontWeight,
                // border, it is different from the "alarmBorder" below
                borderStyle: "solid",
                borderWidth: 0,
                borderColor: "rgba(0, 0, 0, 1)",
                // shows when the widget is selected
                outlineStyle: "none",
                outlineWidth: 1,
                outlineColor: "black",
            },
            text: {
                // text styles
                horizontalAlign: "flex-start",
                verticalAlign: "flex-start",
                wrapWord: false,
                showUnit: false,
                alarmBorder: true,
                // LED line
                lineWidth: 2,
                lineStyle: "solid",
                lineColor: "rgba(50, 50, 50, 0.698)",
                // LED shape: round or square
                shape: "round",
                // if the value is not valid
                fallbackColor: "rgba(255,0,255,1)",
                fallbackText: "Err",
                invisibleInOperation: false,
            },
            channelNames: [],
            groupNames: [],
            rules: [],
            itemNames: ["False", "True"],
            itemColors: ["rgba(60, 100, 60, 1)", "rgba(0, 255, 0, 1)"],
            itemValues: [0, 1],
        };
        defaultTdl["widgetKey"] = GlobalMethods.generateWidgetKey(defaultTdl["type"]);
        return JSON.parse(JSON.stringify(defaultTdl));
    };

    generateDefaultTdl: () => any = LEDMultiState.generateDefaultTdl;

    // overload
    getTdlCopy(newKey: boolean = true): Record<string, any> {
        const result = super.getTdlCopy(newKey);
        result["itemColors"] = JSON.parse(JSON.stringify(this.getItemColors()));
        result["itemNames"] = JSON.parse(JSON.stringify(this.getItemNames()));
        result["itemValues"] = JSON.parse(JSON.stringify(this.getItemValues()));
        return result;
    }

    // --------------------- getters -------------------------

    getItemNames = () => {
        return this._itemNames;
    };
    getItemColors = () => {
        return this._itemColors;
    };
    getItemValues = () => {
        return this._itemValues;
    };

    // -------------------------- sidebar ---------------------------
    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new LEDMultiStateSidebar(this);
        }
    }
}
