import * as GlobalMethods from "../../../common/GlobalMethods";
import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { ThermometerSidebar } from "./ThermometerSidebar";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { BaseWidgetRules } from "../BaseWidget/BaseWidgetRules";
import { ThermometerRule } from "./ThermometerRule";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { Log } from "../../../common/Log";
import { calcTicks, refineTicks } from "../../../common/GlobalMethods";
import { defaultThermometerTdl, type_Thermometer_tdl } from "../../../common/types/type_widget_tdl";

export class Thermometer extends BaseWidget {

    _rules: BaseWidgetRules;

    constructor(widgetTdl: type_Thermometer_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this.setReadWriteType("read");

        this._rules = new BaseWidgetRules(this, widgetTdl, ThermometerRule);
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
                <this._ElementThermometer></this._ElementThermometer>
            </div>
        );
    };

    _Element = React.memo(this._ElementRaw, () => this._useMemoedElement());
    _ElementArea = React.memo(this._ElementAreaRaw, () => this._useMemoedElement());
    _ElementBody = React.memo(this._ElementBodyRaw, () => this._useMemoedElement());

    _ElementThermometer = () => {
        return (
            <div
                style={{
                    display: "inline-flex",
                    position: "relative",
                    flexDirection: "column",
                    width: "100%",
                    height: "100%",
                    opacity: this.getAllText()["invisibleInOperation"] === true && !g_widgets1.isEditing() ? 0 : 1,
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <this._ElementMercuryContainer></this._ElementMercuryContainer>
                <this._ElementMercury></this._ElementMercury>
                {this.getAllText()["showLabels"] === true ? <this._ElementScale></this._ElementScale> : null}
            </div>
        );
    };

    _ElementMercuryContainer = () => {
        const rBulb = this.getAllText()["bulbDiameter"] / 2;
        const widthTube = this.getAllText()["tubeWidth"];
        const calcHeight = () => {
            const adjustment = rBulb - rBulb * Math.cos(Math.asin(widthTube / 2 / rBulb));
            return this.getAllStyle()["height"] - rBulb * 2 + adjustment;
        };

        return (
            <svg
                width={`${widthTube}`}
                height="100%"
                style={{
                    overflow: "visible",
                    position: "absolute",
                }}
            >
                <path
                    d={`M 0 ${widthTube / 2} A ${widthTube / 2} ${widthTube / 2} 0 0 1 ${widthTube} ${widthTube / 2
                        } L ${widthTube} ${calcHeight()} A ${rBulb} ${rBulb} 0 1 1 0 ${calcHeight()} z`}
                    // strokeWidth={`${this.getAllText()["wallThickness"]}`}
                    strokeWidth={`${this.containerWallThickness}`}
                    // stroke={this.getAllText()["wallColor"]}
                    // stroke={"rgba(0,0,0,1)"}
                    stroke={this._getElementAreaRawContainerStyle()}
                    fill={this._getElementAreaRawContainerStyle()}
                ></path>
            </svg>
        );
    };

    containerWallThickness = 1;

    _ElementMercury = () => {

        const rBulb = this.getAllText()["bulbDiameter"] / 2;
        const widthTube = this.getAllText()["tubeWidth"];
        // const wallThickness = this.getAllText()["wallThickness"];
        const wallThickness = this.containerWallThickness;
        // const distance = Math.max((0.4 * widthTube) / 2, 2);
        const distance = 2;
        const rMercury = rBulb - distance - wallThickness / 2;
        const widthMercury = widthTube - 2 * distance - wallThickness;
        const calcFullHeight = () => {
            const adjustment = rMercury - rMercury * Math.cos(Math.asin(widthMercury / 2 / rMercury));
            const fullHeight = this.getAllStyle()["height"] - rBulb - rMercury + adjustment;
            return fullHeight;
        };

        return (
            <svg
                width={`${widthTube}`}
                height="100%"
                style={{
                    overflow: "visible",
                    position: "absolute",
                }}
            >
                <path
                    d={`M ${distance + wallThickness / 2} ${widthTube / 2 + (calcFullHeight() - widthTube / 2) * (1 - this.calcMercuryLevel() / 100)
                        } A ${widthMercury / 2} ${widthMercury / 2} 0 0 1 ${widthMercury + distance + wallThickness / 2} ${widthTube / 2 + (calcFullHeight() - widthTube / 2) * (1 - this.calcMercuryLevel() / 100)
                        } L ${widthMercury + distance + wallThickness / 2} ${calcFullHeight()} A ${rMercury} ${rMercury} 0 1 1 ${distance + wallThickness / 2
                        } ${calcFullHeight()} z`}
                    fill={this._getElementAreaRawFillStyle()}
                ></path>
            </svg>
        );
    };

    /**
     * Line, ticks, and values
     */
    _ElementScale = () => {
        const elementRef = React.useRef<HTMLDivElement>(null);

        const scaleTickSize = 10;

        const rBulb = this.getAllText()["bulbDiameter"] / 2;
        const widthTube = this.getAllText()["tubeWidth"];
        const adjustment = rBulb - rBulb * Math.cos(Math.asin(widthTube / 2 / rBulb));
        const fullSize = this.getAllStyle()["height"] - 2 * rBulb + adjustment;

        const numTickIntervals = this.getAllText()["numTickIntervals"];

        const calcTickValues = () => {
            const result: number[] = [];
            const [valueMin, valueMax] = this.calcPvLimits();
            // const dValue = (valueMax - valueMin) / numTickIntervals;
            // for (let ii = 0; ii <= numTickIntervals; ii++) {
            //     result.push(valueMin + dValue * ii);
            // }
            // return result;
            return calcTicks(valueMin, valueMax, numTickIntervals + 1, {scale: "Linear"});
        };

        /**
         * Calculate tick position in unit of pixel
         *
         * Small tick value has larger position value, the position has larger value on the bottom
         */
        const calcTickPositions = (): number[] => {

            let useLog10Scale = this.getAllText()["displayScale"] === "Log10" ? true : false;
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
                    result.push((1 - ((tickValue - minPvValue) / (maxPvValue - minPvValue))) * fullSize);
                }
            } else {
                const d = fullSize / numTickIntervals;
                for (let ii = 0; ii <= numTickIntervals; ii++) {
                    result.push(fullSize - ii * d);
                }
            }
            return result;
        };

        const height = elementRef.current?.offsetHeight;
        const refinedTicks = refineTicks(calcTickValues(), this.getAllStyle()["fontSize"] * 0.5, height ?? 0, "vertical");

        return (
            <div
                ref={elementRef}
                style={{
                    height: "100%",
                    // scale height, it is used in calculating the tank container height
                    width: this.getAllStyle()["width"] / 2 - (this.getAllText()["tubeWidth"] / 2 + 2),
                    position: "absolute",
                    overflow: "visible",
                    left: this.getAllStyle()["width"] / 2 + this.getAllText()["tubeWidth"] / 2 + 2,
                    top: 0,
                }}
            >
                <div
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
                            stroke={this._getElementAreaRawTextStyle()}
                            fill="none">

                        </path>

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
                                    justifyContent:
                                        index === 0 ? "flex-start" : index === this.getAllText()["numTickIntervals"] ? "flex-end" : "center",
                                    color: this._getElementAreaRawTextStyle(),

                                }}
                            >
                                {/* {calcTickValues()[index]} */}
                                {refinedTicks[index]}
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
                                        color: this._getElementAreaRawTextStyle()
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

    /**
     * Calculate mercury level, return percentage <br>
     *
     * Same as ScaledSlider.calcSliderBlockPosition() and Tank.calcWaterLevel <br>
     */
    calcMercuryLevel = (): number => {
        if (g_widgets1.isEditing()) {
            // return this.getAllStyle()["height"] * 0.33;
            return 33;
        }
        let useLog10Scale = this.getAllText()["displayScale"] === "Log10" ? true : false;

        let result: number = 0;
        const rBulb = this.getAllText()["bulbDiameter"] / 2;
        const widthTube = this.getAllText()["tubeWidth"];
        const wallThickness = this.containerWallThickness;
        const distance = 2;
        const rMercury = rBulb - distance - wallThickness / 2;
        const widthMercury = widthTube - 2 * distance - wallThickness;
        const adjustment = rMercury - rMercury * Math.cos(Math.asin(widthMercury / 2 / rMercury));
        const fullSize = this.getAllStyle()["height"] - rBulb - rMercury + adjustment;

        let channelValue = this._getChannelValue(true);

        if (typeof channelValue === "number") {
            let [minPvValue, maxPvValue] = this.calcPvLimits();
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

        return (result / fullSize) * 100;
    };

    calcPvLimits = (): [number, number] => {
        let minPvValue = this.getAllText()["minPvValue"];
        let maxPvValue = this.getAllText()["maxPvValue"];
        if (minPvValue === undefined || maxPvValue === undefined) {
            return [0, 10];
        }
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
            return [0, 10];
        }
        return [minPvValue, maxPvValue];
    };

    // -------------------- helper functions ----------------

    // defined in super class
    // showSidebar()
    // showResizers()
    // _useMemoedElement()
    // hasChannel()
    // isInGroup()
    // isSelected()
    // _getElementAreaRawOutlineStyle()

    // _getChannelValue = (raw: boolean = false) => {
    //     return this.getChannelValueForMonitorWidget(raw);
    // };

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

    static generateDefaultTdl = (): type_Thermometer_tdl => {
        const widgetKey = GlobalMethods.generateWidgetKey(defaultThermometerTdl.type);
        return structuredClone({
            ...defaultThermometerTdl,
            widgetKey: widgetKey,
        });
    };

    generateDefaultTdl = Thermometer.generateDefaultTdl;

    // --------------------- sidebar --------------------------
    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new ThermometerSidebar(this);
        }
    };
}
