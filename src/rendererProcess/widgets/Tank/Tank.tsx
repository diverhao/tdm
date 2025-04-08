import * as React from "react";
import { MouseEvent } from "react";
import { GlobalVariables, g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { GroupSelection2 } from "../../helperWidgets/GroupSelection/GroupSelection2";
import { TankSidebar } from "./TankSidebar";
import * as GlobalMethods from "../../global/GlobalMethods";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { TankRules } from "./TankRules";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import {Log} from "../../../mainProcess/log/Log";
import { ChannelSeverity } from "../../channel/TcaChannel";
import { refineTicks, calcTicks } from "../../global/GlobalMethods";


export type type_Tank_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
};

export class Tank extends BaseWidget {
    // level-1 properties in tdl file
    // _type: string;
    // _widgetKey: string;
    // _style: Record<string, any>;
    // _text: Record<string, any>;
    // _channelNames: string[];
    // _groupNames: string[] = undefined;

    // sidebar
    // private _sidebar: TextUpdateSidebar;

    // tmp methods
    // private _tmp_mouseMoveOnResizerListener: any = undefined;
    // private _tmp_mouseUpOnResizerListener: any = undefined;

    // widget-specific channels, these channels are only used by this widget
    // private _tcaChannels: TcaChannel[];

    // used for the situation of shift key pressed + mouse down on a selected widget,
    // so that when the mouse is up, the widget is de-selected
    // its value is changed in 3 places: this.select2(), this._handleMouseMove() and this._handleMouseUp()
    // private _readyToDeselect: boolean = false;

    _rules: TankRules;

    readonly pi = 3.1415926;

    constructor(widgetTdl: type_Tank_tdl) {
        super(widgetTdl);
        this.setReadWriteType("read");

        this.setStyle({ ...Tank._defaultTdl.style, ...widgetTdl.style });
        this.setText({ ...Tank._defaultTdl.text, ...widgetTdl.text });

        this._rules = new TankRules(this, widgetTdl);

        // this._sidebar = new TankSidebar(this);
    }

    // ------------------------- event ---------------------------------

    // defined in widget, invoked in sidebar
    // (1) determine which tdl property should be updated
    // (2) calculate new value
    // (3) assign new value
    // (4) add this widget as well as "GroupSelection2" to g_widgets1.forceUpdateWidgets
    // (5) flush
    updateFromSidebar = (event: any, propertyName: string, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        // todo: remove this method
    };

    // defined in super class
    // _handleMouseDown()
    // _handleMouseMove()
    // _handleMouseUp()
    // _handleMouseDownOnResizer()
    // _handleMouseMoveOnResizer()
    // _handleMouseUpOnResizer()
    // _handleMouseDoubleClick()

    // ----------------------------- geometric operations ----------------------------

    // defined in super class
    // simpleSelect()
    // selectGroup()
    // select()
    // simpleDeSelect()
    // deselectGroup()
    // deSelect()
    // move()
    // resize()

    // ------------------------------ group ------------------------------------

    // defined in super class
    // addToGroup()
    // removeFromGroup()

    // ------------------------------ elements ---------------------------------

    // element = <> body (area + resizer) + sidebar </>

    // Body + sidebar
    _ElementRaw = () => {
        this.setRulesStyle({});
        this.setRulesText({});
        const rulesValues = this.getRules()?.getValues();
        if (rulesValues !== undefined) {
            this.setRulesStyle(rulesValues["style"]);
            this.setRulesText(rulesValues["text"]);
        }
        this.setAllStyle({...this.getStyle(), ...this.getRulesStyle()});
        this.setAllText({...this.getText(), ...this.getRulesText()});

        // must do it for every widget
        g_widgets1.removeFromForceUpdateWidgets(this.getWidgetKey());
        this.renderChildWidgets = true;
        React.useEffect(() => {
            this.renderChildWidgets = false;
        });

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
    _ElementBodyRaw = (): JSX.Element => {
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
    _ElementAreaRaw = ({ }: any): JSX.Element => {
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
                    // overflow: "show",
                    whiteSpace: this.getAllText().wrapWord ? "normal" : "pre",
                    // justifyContent: this.getAllText().horizontalAlign,
                    // alignItems: this.getAllText().verticalAlign,
                    fontFamily: this.getAllStyle().fontFamily,
                    fontSize: this.getAllStyle().fontSize,
                    fontStyle: this.getAllStyle().fontStyle,
                    fontWeight: this.getAllStyle().fontWeight,
                    outline: this._getElementAreaRawOutlineStyle(),
                    color: this._getElementAreaRawTextStyle(),
                    backgroundColor: this.getAllText()["invisibleInOperation"] ? "rgba(0,0,0,0)" : this._getElementAreaRawBackgroundStyle(),
                }}
                // title={"tooltip"}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                <this._ElementTank></this._ElementTank>
            </div>
            // </div>
        );
    };

    _Element = React.memo(this._ElementRaw, () => this._useMemoedElement());
    _ElementArea = React.memo(this._ElementAreaRaw, () => this._useMemoedElement());
    _ElementBody = React.memo(this._ElementBodyRaw, () => this._useMemoedElement());

    _ElementTank = () => {
        return (
            <div
                style={{
                    display: "inline-flex",
                    position: "relative",
                    flexDirection: "row",
                    width: "100%",
                    height: "100%",
                    opacity: this.getAllText()["invisibleInOperation"] === true && !g_widgets1.isEditing() ? 0 : 1,
                }}
            >
                {this.getAllText()["scalePosition"] === "left" ? this.getAllText()["showLabels"] === true ? <this._ElementScaleLeft></this._ElementScaleLeft> : null : null}
                <this._ElementWater></this._ElementWater>
                {this.getAllText()["scalePosition"] === "left" ? null : this.getAllText()["showLabels"] === true ? <this._ElementScaleRight></this._ElementScaleRight> : null}
            </div>
        );
    };


    _ElementWater = () => {
        const severity = g_widgets1.getChannelSeverity(this.getChannelNames()[0]);
        // let waterColor = this.getAllText()["fillColor"];
        // if (severity === ChannelSeverity.INVALID) {
        //     waterColor = this.getAllText()["fillColorInvalid"];;
        // }
        // else if (severity === ChannelSeverity.MAJOR) {
        //     waterColor = this.getAllText()["fillColorMajor"];;
        // }
        // else if (severity === ChannelSeverity.MINOR) {
        //     waterColor = this.getAllText()["fillColorMinor"];;
        // }
        return (
            <div
                style={{
                    position: "relative",
                    display: "inline-flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    alignItems: "flex-start",
                    height: "100%",
                    // 10 is scaleTickSize, 2 is extra space for scale line
                    width: this.getAllText()["showLabels"] === true ? this.getAllStyle()["width"] - (this.getAllStyle()["fontSize"] + 10 + 2) : "100%",
                    // backgroundColor: this.getAllText()["backgroundColor"],
                    backgroundColor: this._getElementAreaRawContainerStyle(),
                    borderRadius: 0,
                }}
            >
                {/* water */}
                <div
                    style={{
                        height: this.calcWaterLevel(),
                        width: "100%",
                        // backgroundColor: waterColor,
                        backgroundColor: this._getElementAreaRawFillStyle(),
                        borderRadius: 0,
                    }}
                ></div>
            </div>
        );
    };

    /**
     * Line, ticks, and values
     */
    _ElementScaleLeft = () => {

        // including: 2px blank on top, horizontal line width, and ticks
        const scaleTickSize = 10;
        const fontSize = this.getAllStyle()["fontSize"];
        const fullSize = this.getAllStyle()["height"];
        const numTickIntervals = this.getAllText()["numTickIntervals"];
        const elementRef = React.useRef<any>(null);

        const calcTickValues = () => {
            const result: number[] = [];
            const [valueMin, valueMax] = this.calcPvLimits();
            // const dValue = (valueMax - valueMin) / numTickIntervals;
            // for (let ii = 0; ii <= numTickIntervals; ii++) {
            //     result.push(valueMin + dValue * ii);
            // }
            // return result;
            return calcTicks(valueMin, valueMax, numTickIntervals + 1, "linear");
        }

        /**
         * Calculate tick position in unit of pixel
         * 
         * Small tick value has larger position value, the position has larger value on the bottom
         */

        const calcTickPositions = (): number[] => {
            let useLog10Scale = this.getAllText()["scale"] === "Log10" ? true : false;
            const result: number[] = [];

            if (useLog10Scale) {
                const tickValues = calcTickValues();
                let [minPvValue, maxPvValue] = this.calcPvLimits();
                minPvValue = Math.log10(minPvValue);
                maxPvValue = Math.log10(maxPvValue);
                for (let tickValue of tickValues) {
                    tickValue = Math.log10(tickValue);
                    if (minPvValue === Infinity || minPvValue === -Infinity || isNaN(minPvValue)) {
                        minPvValue = 0
                    }
                    if (maxPvValue === Infinity || maxPvValue === -Infinity || isNaN(maxPvValue)) {
                        maxPvValue = 0
                    }
                    if (tickValue === Infinity || tickValue === -Infinity || isNaN(tickValue)) {
                        tickValue = 0
                    }
                    result.push((1-((tickValue - minPvValue) / (maxPvValue - minPvValue))) * fullSize);
                }
            } else {
                const d = fullSize / numTickIntervals;
                for (let ii = 0; ii <= numTickIntervals; ii++) {
                    result.push(fullSize - ii * d);
                }
            }
            return result;
        };


        const refinedTicks = refineTicks(calcTickValues(), this.getAllStyle()["fontSize"] * 0.5, elementRef, "vertical");

        return (
            <div
                ref={elementRef}
                style={{
                    height: "100%",
                    // scale height, it is used in calculating the tank container height
                    width: this.getAllStyle()["fontSize"] + scaleTickSize + 2,
                    position: "relative",
                    display: "inline-flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                {/* ticks and line */}
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
                    {/* line, 2px gap above */}
                    <path
                        d={`M ${scaleTickSize + fontSize} 0 L ${scaleTickSize + fontSize} ${fullSize}`}
                        strokeWidth="2"
                        stroke={this._getElementAreaRawTextStyle()}
                        fill="none"
                    ></path>

                    {/* ticks */}
                    {calcTickPositions().map((position: number, index: number) => {
                        if (this.getAllText()["compactScale"]) {
                            if (!(index === 0 || index === this.getAllText()["numTickIntervals"])) {
                                return null;
                            }
                        }

                        return (
                            <>
                                <path
                                    d={`M ${2 + fontSize} ${position} L ${scaleTickSize + fontSize} ${position}`}
                                    strokeWidth="2"
                                    stroke={this._getElementAreaRawTextStyle()}
                                    fill="none"
                                ></path>
                            </>
                        );
                    })}
                </svg>
                {/* labels */}
                {calcTickPositions().map((value: number, index: number) => {
                    if (this.getAllText()["compactScale"]) {
                        if (!(index === 0 || index === this.getAllText()["numTickIntervals"])) {
                            return null;
                        }
                    }

                    return (
                        <div
                            style={{
                                position: "absolute",
                                transform: "rotate(270deg)",
                                top: value,
                                // left: scaleTickSize,
                                left: 2,
                                width: 0,
                                height: 0,
                                display: "inline-flex",
                                alignItems: "flex-start",
                                justifyContent: index === 0 ? "flex-start" : index === this.getAllText()["numTickIntervals"] ? "flex-end" : "center",
                                // color: this._getElementAreaRawTextStyle(),
                            }}
                        >
                            {this.getAllText()["showScaleInnerLabel"] === true ? refinedTicks[index] : (index === 0 || index === this.getAllText()["numTickIntervals"]) ? refinedTicks[index] : ""}
                        </div>
                    );
                })}
                {(() => {
                    if (this.getAllText()["compactScale"]) {
                        return (
                            <div
                                style={{
                                    position: "absolute",
                                    transform: "rotate(270deg)",
                                    top: fullSize / 2,
                                    left: scaleTickSize,
                                    width: 0,
                                    height: 0,
                                    display: "inline-flex",
                                    alignItems: "flex-start",
                                    justifyContent: "center",
                                    // color: this._getElementAreaRawTextStyle(),
                                }}
                            >
                                {`${this._getChannelValue()}`}
                            </div>
                        );
                    } else {
                        return null;
                    }
                })()}

            </div>
        );
    };

    /**
     * Line, ticks, and values
     */
    _ElementScaleRight = () => {

        // including: 2px blank on top, horizontal line width, and ticks
        const scaleTickSize = 10;
        const fullSize = this.getAllStyle()["height"];
        const numTickIntervals = this.getAllText()["numTickIntervals"];
        const elementRef = React.useRef<any>(null);

        const calcTickValues = () => {
            const result: number[] = [];
            const [valueMin, valueMax] = this.calcPvLimits();
            // const dValue = (valueMax - valueMin) / numTickIntervals;
            // for (let ii = 0; ii <= numTickIntervals; ii++) {
            //     result.push(valueMin + dValue * ii);
            // }
            // return result;
            return calcTicks(valueMin, valueMax, numTickIntervals + 1, "linear");
        }

        /**
         * Calculate tick position in unit of pixel
         * 
         * Small tick value has larger position value, the position has larger value on the bottom
         */
        const calcTickPositions = (): number[] => {

            let useLog10Scale = this.getAllText()["scale"] === "Log10" ? true : false;
            const result: number[] = [];

            if (useLog10Scale) {
                const tickValues = calcTickValues();
                let [minPvValue, maxPvValue] = this.calcPvLimits();
                minPvValue = Math.log10(minPvValue);
                maxPvValue = Math.log10(maxPvValue);
                for (let tickValue of tickValues) {
                    tickValue = Math.log10(tickValue);
                    if (minPvValue === Infinity || minPvValue === -Infinity || isNaN(minPvValue)) {
                        minPvValue = 0
                    }
                    if (maxPvValue === Infinity || maxPvValue === -Infinity || isNaN(maxPvValue)) {
                        maxPvValue = 0
                    }
                    if (tickValue === Infinity || tickValue === -Infinity || isNaN(tickValue)) {
                        tickValue = 0
                    }
                    result.push((1-((tickValue - minPvValue) / (maxPvValue - minPvValue))) * fullSize);
                }
            } else {
                const d = fullSize / numTickIntervals;
                for (let ii = 0; ii <= numTickIntervals; ii++) {
                    result.push(fullSize - ii * d);
                }
            }
            return result;
        };

        const refinedTicks = refineTicks(calcTickValues(), this.getAllStyle()["fontSize"] * 0.5, elementRef, "vertical");

        return (
            <div
                ref={elementRef}
                style={{
                    height: "100%",
                    // scale height, it is used in calculating the tank container height
                    width: this.getAllStyle()["fontSize"] + scaleTickSize,
                    position: "relative",
                    display: "inline-flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                {/* ticks and line */}
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
                    {/* line, 2px gap above */}
                    <path
                        d={`M 2 0 L 2 ${fullSize}`}
                        strokeWidth="2"
                        // stroke={this.getAllStyle()["color"]}
                        stroke={this._getElementAreaRawTextStyle()}
                        fill="none"
                    ></path>

                    {/* ticks */}
                    {calcTickPositions().map((position: number, index: number) => {
                        if (this.getAllText()["compactScale"]) {
                            if (!(index === 0 || index === this.getAllText()["numTickIntervals"])) {
                                return null;
                            }
                        }

                        return (
                            <>
                                <path
                                    d={`M 2 ${position} L ${scaleTickSize} ${position}`}
                                    strokeWidth="2"
                                    // stroke={this.getAllStyle()["color"]}
                                    stroke={this._getElementAreaRawTextStyle()}
                                    fill="none"
                                ></path>
                            </>
                        );
                    })}
                </svg>
                {/* labels */}
                {calcTickPositions().map((value: number, index: number) => {
                    if (this.getAllText()["compactScale"]) {
                        if (!(index === 0 || index === this.getAllText()["numTickIntervals"])) {
                            return null;
                        }
                    }

                    return (
                        <div
                            style={{
                                position: "absolute",
                                transform: "rotate(270deg)",
                                top: value,
                                left: scaleTickSize,
                                width: 0,
                                height: 0,
                                display: "inline-flex",
                                alignItems: "flex-start",
                                justifyContent: index === 0 ? "flex-start" : index === this.getAllText()["numTickIntervals"] ? "flex-end" : "center",
                                // color: this.getAllStyle()["color"],
                            }}
                        >
                            {this.getAllText()["showScaleInnerLabel"] === true ? refinedTicks[index] : (index === 0 || index === this.getAllText()["numTickIntervals"]) ? refinedTicks[index] : ""}
                            {/* {refinedTicks[index]} */}
                        </div>
                    );
                })}
                {(() => {
                    if (this.getAllText()["compactScale"]) {
                        return (
                            <div
                                style={{
                                    position: "absolute",
                                    transform: "rotate(270deg)",
                                    top: fullSize / 2,
                                    left: scaleTickSize,
                                    width: 0,
                                    height: 0,
                                    display: "inline-flex",
                                    alignItems: "flex-start",
                                    justifyContent: "center",
                                    // color: this.getAllStyle()["color"],
                                }}
                            >
                                {`${this._getChannelValue()}`}
                            </div>
                        );
                    } else {
                        return null;
                    }
                })()}

            </div>
        );
    };

    // -------------------------- Meter stuff ----------------------

    // defined in super class
    // getElement()
    // getSidebarElement()
    // _ElementResizerRaw
    // _ElementResizer

    // ------------------ element helper functions -----------

    calcPvLimits = (): [number, number] => {
        let minPvValue = this.getAllText()["minPvValue"];
        let maxPvValue = this.getAllText()["maxPvValue"];
        const channelName = this.getChannelNames()[0];
        try {
            const channel = g_widgets1.getTcaChannel(channelName);
            if (this.getAllText()["usePvLimits"]) {
                const upper_display_limit = channel.getUpperDisplayLimit();
                if (upper_display_limit !== undefined && typeof upper_display_limit === "number") {
                    maxPvValue = upper_display_limit;
                }
                const lower_display_limit = channel.getLowerDisplayLimit();
                if (lower_display_limit !== undefined && typeof lower_display_limit === "number") {
                    minPvValue = lower_display_limit;
                }
            }
        } catch (e) {
            Log.error(e);
        }
        return [minPvValue, maxPvValue];
    };

    /**
     * Calculate water level, return pixel <br>
     * 
     * Same as ScaledSlider.calcSliderBlockPosition() <br>
     */
    calcWaterLevel = (): number => {
        if (g_widgets1.isEditing()) {
            return this.getAllStyle()["height"] * 0.33;
        }

        let useLog10Scale = this.getAllText()["scale"] === "Log10" ? true : false;

        let result: number = 0;
        const fullSize = this.getAllStyle()["height"];

        let channelValue = this._getChannelValue(true);

        if (typeof channelValue === "number") {
            let [minPvValue, maxPvValue] = this.calcPvLimits();
            // Log10
            if (useLog10Scale) {
                minPvValue = Math.log10(minPvValue);
                maxPvValue = Math.log10(maxPvValue);
                channelValue = Math.log10(channelValue);
            }
            if (useLog10Scale) {
                if (minPvValue === Infinity || minPvValue === -Infinity || isNaN(minPvValue)) {
                    minPvValue = 0
                }
                if (maxPvValue === Infinity || maxPvValue === -Infinity || isNaN(maxPvValue)) {
                    maxPvValue = 0
                }
                if (channelValue === Infinity || channelValue === -Infinity || isNaN(channelValue)) {
                    channelValue = 0
                }
            }
            result = ((channelValue - minPvValue) / (maxPvValue - minPvValue)) * fullSize;
        }
        result = Math.min(Math.max(result, 0), fullSize);

        return result;
    };


    // -------------------- helper functions ----------------

    // defined in super class
    // _showSidebar()
    // _showResizers()
    // _useMemoedElement()
    // hasChannel()
    // isInGroup()
    // isSelected()
    // _getElementAreaRawOutlineStyle()

    // _getChannelValue = (raw: boolean = false) => {
    //     return this.getChannelValueForMonitorWidget(raw);
    // };

    // what is it used for?
    _getChannelValue1 = (raw: boolean = false) => {
        const channelValue = this.getChannelValueForMonitorWidget(raw);
        if (typeof channelValue === "number") {
            const scale = Math.max(this.getAllText()["scale"], 0);
            const format = this.getAllText()["format"];
            if (format === "decimal") {
                return channelValue.toFixed(scale);
            } else if (format === "default") {
                const channelName = this.getChannelNames()[0];
                const defaultScale = g_widgets1.getChannelPrecision(channelName);
                if (defaultScale !== undefined) {
                    return channelValue.toFixed(defaultScale);
                } else {
                    return channelValue.toFixed(scale);
                }
            } else if (format === "exponential") {
                return channelValue.toExponential(scale);
            } else if (format === "hexadecimal") {
                return `0x${channelValue.toString(16)}`;
            } else {
                return channelValue;
            }
        } else {
            return channelValue;
        }
    };


    _getChannelValue = (raw: boolean = false) => {
        const value = this._getFirstChannelValue(raw);
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

    // ----------------------- styles -----------------------

    // defined in super class
    // _resizerStyle
    // _resizerStyles
    // StyledToolTipText
    // StyledToolTip

    // -------------------------- tdl -------------------------------

    // properties when we create a new TextUpdate
    // the level 1 properties all have corresponding public or private variable in the widget
    static _defaultTdl: type_Tank_tdl = {
        type: "Tank",
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
            backgroundColor: "rgba(240, 240, 240, 1)",
            // angle
            transform: "rotate(0deg)",
            // border
            borderStyle: "solid",
            borderWidth: 0,
            borderColor: "rgba(0, 0, 0, 1)",
            // font
            color: "rgba(0,0,0,1)",
            fontFamily: GlobalVariables.defaultFontFamily,
            fontSize: GlobalVariables.defaultFontSize,
            fontStyle: GlobalVariables.defaultFontStyle,
            fontWeight: GlobalVariables.defaultFontWeight,
            // outline
            outlineStyle: "none",
            outlineWidth: 1,
            outlineColor: "black",
        },
        text: {
            // showUnit: true,
            // channel
            // showPvValue: true,
            usePvLimits: false,
            minPvValue: 0,
            maxPvValue: 10,
            useLogScale: false,
            // tank and water colors
            fillColor: "rgba(0,200,0,1)",
            // fillColorMinor: "rgba(255, 150, 100, 1)",
            // fillColorMajor: "rgba(255,0,0,1)",
            // fillColorInvalid: "rgba(200,0,200,1)",
            containerColor: "rgba(210,210,210,1)",
            // layout
            // direction: "vertical",
            // dialPercentage: 75,
            // labelPositionPercentage: 15,
            // tick config
            showLabels: true,
            // dialFontColor: "rgba(0,0,255,1)",
            // dialFontFamily: "Liberation Sans",
            // dialFontSize: 14,
            // dialFontStyle: "normal",
            // dialFontWeight: "normal",
            invisibleInOperation: false,
            // decimal, exponential, hexadecimal
            format: "default",
            // scale, >= 0
            // scale: 0,
            numTickIntervals: 5,
            compactScale: false,
            // "left" | "right"
            scalePosition: "right",
            // show inner labels
            showScaleInnerLabel: true,
            displayScale: "Linear", // "Linear" | "Log10"
            alarmContainer: false,
            alarmFill: false,
            alarmText: false,
            alarmBorder: true,
            alarmBackground: false,
            alarmLevel: "MINOR",
        },
        channelNames: [],
        groupNames: [],
        rules: [],
    };

    // not getDefaultTdl(), always generate a new key
    static generateDefaultTdl = (type: string): Record<string, any> => {
        const result = super.generateDefaultTdl(type);
        result.style = JSON.parse(JSON.stringify(this._defaultTdl.style));
        result.text = JSON.parse(JSON.stringify(this._defaultTdl.text));
        result.channelNames = JSON.parse(JSON.stringify(this._defaultTdl.channelNames));
        result.groupNames = JSON.parse(JSON.stringify(this._defaultTdl.groupNames));
        return result;
    };

    // defined in super class
    // getTdlCopy()

    // --------------------- getters -------------------------

    // defined in super class
    // getType()
    // getWidgetKey()
    // getStyle()
    // getText()
    // getSidebar()
    // getGroupName()
    // getGroupNames()
    // getUpdateFromWidget()
    // getResizerStyle()
    // getResizerStyles()
    // getRules()

    // ---------------------- setters -------------------------

    // ---------------------- channels ------------------------

    // defined in super class
    // getChannelNames()
    // expandChannelNames()
    // getExpandedChannelNames()
    // setExpandedChannelNames()
    // expandChannelNameMacro()

    // ------------------------ z direction --------------------------

    // defined in super class
    // moveInZ()
    // -------------------------- sidebar ---------------------------
    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new TankSidebar(this);
        }
    }
}
