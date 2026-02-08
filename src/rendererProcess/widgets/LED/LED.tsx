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

        this._itemNames = deepMerge(widgetTdl.itemNames, this.generateDefaultTdl().itemNames);
        this._itemColors = deepMerge(widgetTdl.itemColors, this.generateDefaultTdl().itemColors);
        this._itemValues = deepMerge(widgetTdl.itemValues, this.generateDefaultTdl().itemValues);
        this._itemNames.splice(2, this._itemNames.length - 2);
        this._itemColors.splice(2, this._itemColors.length - 2);
        this._itemValues.splice(2, this._itemValues.length - 2);

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
                <>
                    <this._ElementBody></this._ElementBody>
                    {this._showSidebar() ? this._sidebar?.getElement() : null}
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
                {this._showResizers() ? <this._ElementResizer /> : null}
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
                {this.getAllText()["shape"] === "round" ? (
                    <this._ElementLEDRound></this._ElementLEDRound>
                ) : (
                    <this._ElementLEDSquare></this._ElementLEDSquare>
                )}
                <this._ElementText></this._ElementText>
            </div>
        );
    };

    calcIndex = (): number => {
        const channelValue = this._getChannelValue(true);
        const bit = this.getAllText()["bit"];
        if (typeof channelValue === "number") {
            if (bit < 0) {
                // use whole value
                const index = this.getItemValues().indexOf(channelValue);
                return index;
            } else {
                const value = (Math.floor(Math.abs(channelValue)) >> bit) & 0x1;
                const index = this.getItemValues().indexOf(value);
                return index;
            }
        }
        return -1;
    };

    calcItemColor = () => {
        const index = this.calcIndex();
        if (index > -1 && index < this.getItemColors().length) {
            return this.getItemColors()[index];
        } else {
            return this.getAllText()["fallbackColor"];
        }
    };

    calcItemText = (): string => {
        if (g_widgets1.isEditing()) {
            return this.getItemNames().join("|");
        }

        const index = this.calcIndex();
        if (index > -1) {
            if (this.getAllText()["useChannelItems"] === true) {
                try {
                    const channelName = this.getChannelNames()[0];
                    const channel = g_widgets1.getTcaChannel(channelName);
                    const strs = channel.getEnumChoices();
                    const numberOfStringsUsed = channel.getNumerOfStringsUsed();
                    if (numberOfStringsUsed && strs.length > 0) {
                        if (index < numberOfStringsUsed) {
                            return strs[index];
                        }
                    }
                } catch (e) {
                    Log.error(e);
                    return "";
                }
            } else {
                return `${this.getItemNames()[index]}`;
            }
        }
        return this.getAllText()["fallbackText"];
    };

    _ElementText = () => {
        return (
            <div
                style={{
                    display: "inline-flex",
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    justifyContent: "center",
                    alignItems: "center",
                    // color: this.calcItemTextcolor(),
                    color: this.getAllStyle()["color"],
                    opacity: this.getAllText()["invisibleInOperation"] === true && !g_widgets1.isEditing() ? 0 : 1,
                }}
            >
                <div>{this.calcItemText()}</div>
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

    _ElementLEDSquare = () => {
        const point1X = this.getAllStyle()["width"];
        const point1Y = 0;
        const point2X = this.getAllStyle()["width"];
        const point2Y = this.getAllStyle()["height"];
        const point3X = 0;
        const point3Y = this.getAllStyle()["height"];
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
                        opacity: this.getAllText()["invisibleInOperation"] === true && !g_widgets1.isEditing() ? 0 : 1,
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
                        width={`${this.getAllStyle()["width"]}`}
                        height={`${this.getAllStyle()["height"]}`}
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
                        opacity: this.getAllText()["invisibleInOperation"] === true && !g_widgets1.isEditing() ? 0 : 1,
                    }}
                >
                    <rect
                        width={`${this.getAllStyle()["width"]}`}
                        height={`${this.getAllStyle()["height"]}`}
                        strokeWidth={this.getAllText()["lineWidth"]}
                        stroke={this.getAllText()["lineColor"]}
                        fill={this.calcItemColor()}
                    ></rect>
                </svg>
            );
        }
    };

    _ElementLEDRound = () => {
        const rX = this.getAllStyle()["width"] / 2;
        const rY = this.getAllStyle()["height"] / 2;
        const point1X = this.getAllStyle()["width"] / 2 + (this.getAllStyle()["width"] / 2) * 0.7071067811865475244;
        const point1Y = this.getAllStyle()["height"] / 2 - (this.getAllStyle()["height"] / 2) * 0.7071067811865475244;
        const point2X = this.getAllStyle()["width"] / 2 - (this.getAllStyle()["width"] / 2) * 0.7071067811865475244;
        const point2Y = this.getAllStyle()["height"] / 2 + (this.getAllStyle()["height"] / 2) * 0.7071067811865475244;

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
                        opacity: this.getAllText()["invisibleInOperation"] === true && !g_widgets1.isEditing() ? 0 : 1,
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
                        opacity: this.getAllText()["invisibleInOperation"] === true && !g_widgets1.isEditing() ? 0 : 1,
                    }}
                >
                    <ellipse
                        cx={`${this.getAllStyle()["width"] / 2}`}
                        cy={`${this.getAllStyle()["height"] / 2}`}
                        rx={`${this.getAllStyle()["width"] / 2}`}
                        ry={`${this.getAllStyle()["height"] / 2}`}
                        strokeWidth={this.getAllText()["lineWidth"]}
                        stroke={this.getAllText()["lineColor"]}
                        fill={this.calcItemColor()}
                    ></ellipse>
                </svg>
            );
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
    // _showSidebar()
    // _showResizers()
    // _useMemoedElement()
    // hasChannel()
    // isInGroup()
    // isSelected()
    // _getElementAreaRawOutlineStyle()

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
                backgroundColor: "rgba(240, 240, 240, 0.2)",
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
            itemNames: ["", ""],
            itemColors: ["rgba(60, 100, 60, 1)", "rgba(0, 255, 0, 1)"],
            itemValues: [0, 1],
        };
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
