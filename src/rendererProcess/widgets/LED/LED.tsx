import * as GlobalMethods from "../../../common/GlobalMethods";
import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { GlobalVariables } from "../../../common/GlobalVariables";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { LEDSidebar } from "./LEDSidebar";
import { deepMerge, rgbaStrToRgbaArray } from "../../../common/GlobalMethods";
import { LEDRules } from "./LEDRules";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { Log } from "../../../common/Log";

export type type_LED_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
    // LED specific data
    itemNames: string[];
    itemColors: string[];
    itemValues: (number | string | number[] | string[] | undefined)[];
};

export class LED extends BaseWidget {

    _rules: LEDRules;
    _itemNames: string[];
    _itemColors: string[];
    _itemValues: (number | string | number[] | string[] | undefined)[];

    constructor(widgetTdl: type_LED_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this.setReadWriteType("read");

        const defaultTdl = this.generateDefaultTdl();
        this._itemNames = deepMerge(widgetTdl.itemNames, defaultTdl.itemNames);
        this._itemColors = deepMerge(widgetTdl.itemColors, defaultTdl.itemColors);
        this._itemValues = deepMerge(widgetTdl.itemValues, defaultTdl.itemValues);
        // there has to be only 2 items
        this._itemNames.splice(2);
        this._itemColors.splice(2);
        this._itemValues.splice(2);

        this._rules = new LEDRules(this, widgetTdl);
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

    _ElementLEDSquareEditing = () => {
        const allStyle = this.getAllStyle();
        const allText = this.getAllText();
        const width = allStyle["width"];
        const height = allStyle["height"];

        const point1X = width;
        const point1Y = 0;
        const point2X = width;
        const point2Y = height;
        const point3X = 0;
        const point3Y = height;
        const point4X = 0;
        const point4Y = 0;

        const d0 = `M ${point1X} ${point1Y} L ${point4X} ${point4Y} L ${point3X} ${point3Y}`;
        const d1 = `M ${point1X} ${point1Y} L ${point2X} ${point2Y} L ${point3X} ${point3Y}`;

        const lineWidth = allText["lineWidth"];
        const lineColor = allText["lineColor"];
        const itemColors = this.getItemColors();
        const fillColor0 = itemColors[0];
        const fillColor1 = itemColors[1];

        // outline
        const outlineColor = this.calcOutlineColor();
        const outlineWidth = this.isSelected() ? "1" : "0";

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
                {/* half a square (a triange) for state 0 */}
                <path
                    d={d0}
                    strokeWidth={`${lineWidth}`}
                    stroke={lineColor}
                    fill={fillColor0}
                ></path>
                {/* half a square (a triange) for state 1 */}
                <path
                    d={d1}
                    strokeWidth={`${lineWidth}`}
                    stroke={lineColor}
                    fill={fillColor1}
                ></path>
                {/* outline, enabled upon selection */}
                <rect
                    width={`${width}`}
                    height={`${height}`}
                    strokeWidth={`${outlineWidth}`}
                    stroke={outlineColor}
                    fill="none"
                ></rect>
            </svg>
        );
    };

    _ElementLEDSquareOperating = () => {
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
                <rect
                    width={`${width}`}
                    height={`${height}`}
                    strokeWidth={`${lineWidth}`}
                    stroke={lineColor}
                    fill={fillColor}
                ></rect>
            </svg>
        );

    };

    _ElementLEDRound = () => {
        if (g_widgets1.isEditing()) {
            return <this._ElementLEDRoundEditing></this._ElementLEDRoundEditing>
        } else {
            return <this._ElementLEDRoundOperating></this._ElementLEDRoundOperating>
        }
    };

    _ElementLEDRoundEditing = () => {
        const allStyle = this.getAllStyle();
        const allText = this.getAllText();

        const width = allStyle["width"];
        const height = allStyle["height"];
        const lineWidth = allText["lineWidth"];
        const lineColor = allText["lineColor"];


        // for half circles
        const rX = width / 2;
        const rY = height / 2;
        const point1X = width / 2 + (width / 2) * 0.70711;
        const point1Y = height / 2 - (height / 2) * 0.70711;
        const point2X = width / 2 - (width / 2) * 0.70711;
        const point2Y = height / 2 + (height / 2) * 0.70711;

        const fillColor0 = this.getItemColors()[0];
        const fillColor1 = this.getItemColors()[1];

        const d0 = `M ${point1X} ${point1Y} A ${rX} ${rY} 0 0 0 ${point2X} ${point2Y}`;
        const d1 = `M ${point2X} ${point2Y} A ${rX} ${rY} 0 0 0 ${point1X} ${point1Y}`;

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
                {/* half a circle for state 0 */}
                <path
                    d={d0}
                    strokeWidth={`${lineWidth}`}
                    stroke={lineColor}
                    fill={fillColor0}
                ></path>
                {/* half a circle for state 1*/}
                <path
                    d={d1}
                    strokeWidth={`${lineWidth}`}
                    stroke={lineColor}
                    fill={fillColor1}
                ></path>
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

        const rX = width / 2;
        const rY = height / 2;
        const cX = width / 2;
        const cY = height / 2;
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
                    cx={`${cX}`}
                    cy={`${cY}`}
                    rx={`${rX}`}
                    ry={`${rY}`}
                    strokeWidth={lineWidth}
                    stroke={lineColor}
                    fill={fillColor}
                ></ellipse>
            </svg>
        );

    };

    _ElementText = () => {
        return (
            <div
                // the shape and text are all "absolute" position
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
    };

    // -------------------- helper functions ----------------

    /**
     * find the index that corresponds to the channel value
     * 
     * reutrns 0, 1 or undefined
     */
    calcIndex = (): 0 | 1 | undefined => {
        const itemValues = this.getItemValues();
        const channelValue = this._getChannelValue(true);
        // if bit < 0, use whole number
        // if bit >= 0, use this bit
        const bit = this.getAllText()["bit"];
        if (typeof channelValue === "number") {
            if (bit < 0) {
                // use whole value
                const index = itemValues.indexOf(channelValue);
                if (index === 0 || index === 1) {
                    return index;
                } else {
                    return undefined;
                }
            } else {
                const value = (Math.floor(Math.abs(channelValue)) >> bit) & 0x1;
                const index = itemValues.indexOf(value);
                if (index === 0 || index === 1) {
                    return index;
                } else {
                    return undefined;
                }
            }
        }
        return undefined;
    };

    /**
     * find the color that corresponds to the channel value
     */
    calcItemColor = () => {
        const index = this.calcIndex();

        if (index === 0 || index === 1) {
            const color = this.getItemColors()[index];
            if (GlobalMethods.isValidRgbaColor(color)) {
                return color;
            }
        } else {
            return this.getAllText()["fallbackColor"];
        }

    };

    /**
     * find the text that corresponds to the channel value
     * 
     * the text may be defined by user or from the channel
     */
    calcItemText = (): string => {

        const allText = this.getAllText();
        const useChannelItems = allText["useChannelItems"];
        const fallbackText = allText["fallbackText"];
        const itemNames = this.getItemNames();

        if (g_widgets1.isEditing()) {
            if (useChannelItems) {
                return "";
            } else {
                return itemNames.join("|");
            }
        }

        const index = this.calcIndex();
        if (index === 0 || index === 1) {
            if (useChannelItems === true) {
                try {
                    // find enum choices
                    const channelName = this.getChannelNames()[0];
                    const channel = g_widgets1.getTcaChannel(channelName);
                    const strs = channel.getEnumChoices();
                    const numberOfStringsUsed = channel.getNumerOfStringsUsed();
                    if (typeof (numberOfStringsUsed) === "number" && index < numberOfStringsUsed && strs.length >= numberOfStringsUsed) {
                        return strs[index];
                    } else {
                        return fallbackText;
                    }
                } catch (e) {
                    Log.error(e);
                    return fallbackText;
                }
            } else {
                return itemNames[index];
            }
        } else {
            return fallbackText;
        }
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

        const defaultTdl: type_LED_tdl = {
            type: "LED",
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
                backgroundColor: "rgba(240, 240, 240, 0)",
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
                wrapWord: false,
                showUnit: false,
                alarmBorder: true,
                // LED line style, not the border/outline line
                lineWidth: 2,
                lineStyle: "solid",
                lineColor: "rgba(50, 50, 50, 0.698)",
                // round or square
                shape: "round",
                // use channel value
                bit: -1,
                // if the value is not valid
                fallbackColor: "rgba(255,0,255,1)",
                fallbackText: "Err",
                // use channel's value and label, only valid for EPICS enum channels
                // that has "strings" property
                useChannelItems: false,
                invisibleInOperation: false,
            },
            channelNames: [],
            groupNames: [],
            rules: [],
            // LED specific
            itemNames: ["ZERO", "ONE"],
            itemColors: ["rgba(60, 100, 60, 1)", "rgba(0, 255, 0, 1)"],
            itemValues: [0, 1],
        };
        defaultTdl["widgetKey"] = GlobalMethods.generateWidgetKey(defaultTdl["type"]);
        return JSON.parse(JSON.stringify(defaultTdl));
    };

    generateDefaultTdl: () => any = LED.generateDefaultTdl;

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
            this._sidebar = new LEDSidebar(this);
        }
    }
}
