import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { GlobalVariables } from "../../../common/GlobalVariables";
import { TankSidebar } from "./TankSidebar";
import * as GlobalMethods from "../../../common/GlobalMethods";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { TankRules } from "./TankRules";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { refineTicks, calcTicks } from "../../../common/GlobalMethods";


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
    _rules: TankRules;

    constructor(widgetTdl: type_Tank_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this.setReadWriteType("read");

        this._rules = new TankRules(this, widgetTdl);
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
        const outline = this._getElementAreaRawOutlineStyle();
        const color = this._getElementAreaRawTextStyle();
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
                    whiteSpace: whiteSpace,
                    outline: outline,
                    color: color,
                    backgroundColor: backgroundColor,
                    position: "relative",
                    flexDirection: "row",
                }}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                <this._ElementScaleLeft></this._ElementScaleLeft>
                <this._ElementWater></this._ElementWater>
                <this._ElementScaleRight></this._ElementScaleRight>
            </div>
        );
    };

    _Element = React.memo(this._ElementRaw, () => this._useMemoedElement());
    _ElementArea = React.memo(this._ElementAreaRaw, () => this._useMemoedElement());


    _ElementWater = () => {
        const allText = this.getAllText();
        const allStyle = this.getAllStyle();
        const width = allStyle["width"];
        const fontSize = allStyle["fontSize"];
        const showLabels = allText["showLabels"];
        const tankColor = this._getElementAreaRawContainerStyle();
        const tankWidth = showLabels === true ? width - (fontSize + 10 + 2) : "100%";
        const waterColor = this._getElementAreaRawFillStyle();
        const waterHeight = this.calcWaterLevel();

        return (
            <div
                style={{
                    position: "relative",
                    display: "inline-flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    alignItems: "flex-start",
                    height: "100%",
                    width: tankWidth,
                    backgroundColor: tankColor,
                    borderRadius: 0,
                    // use all available space
                    flex: 1,
                    minWidth: 0,
                }}
            >
                <div
                    style={{
                        height: waterHeight,
                        width: "100%",
                        backgroundColor: waterColor,
                        borderRadius: 0,
                    }}
                ></div>
            </div>
        );
    };

    _ElementScaleLeft = () => {
        const allText = this.getAllText();
        const allStyle = this.getAllStyle();
        const scalePosition = allText["scalePosition"];
        const showLabels = allText["showLabels"];

        // if position not on left or not showing label, return null
        if (!(scalePosition === "left" && showLabels === true)) {
            return null;
        }

        const elementRef = React.useRef<any>(null);

        const fontSize = allStyle["fontSize"];
        const scaleLength = allStyle["height"];
        const numTickIntervals = allText["numTickIntervals"];
        const scale = allText["scale"];

        const [valueMin, valueMax] = this.calcPvLimits();
        const tickValues = calcTicks(valueMin, valueMax, numTickIntervals + 1, { scale: scale });
        const tickPositions = GlobalMethods.calcTickPositions(tickValues, valueMin, valueMax, scaleLength, { scale: scale });
        const refinedTicks = refineTicks(tickValues, fontSize * 0.5, elementRef, "vertical");
        return (
            <div
                ref={elementRef}
                style={{
                    height: "100%",
                    position: "relative",
                    display: "inline-flex",
                    flexDirection: "row",
                    justifyContent: "flex-end",
                    alignItems: "center",
                }}
            >

                {/* labels */}
                <this._ElementLabels
                    tickPositions={tickPositions}
                    refinedTicks={refinedTicks}
                >
                </this._ElementLabels>

                {/* ticks */}
                <this._ElementTicks
                    tickPositions={tickPositions}
                >
                </this._ElementTicks>

                {/* base axis */}
                <this._ElementAxis></this._ElementAxis>
            </div>
        );
    };

    /**
     * the only difference with _ElementScaleLeft is the sequence of labels, ticks and axis
     */
    _ElementScaleRight = () => {
        const allText = this.getAllText();
        const allStyle = this.getAllStyle();
        const scalePosition = allText["scalePosition"];
        const showLabels = allText["showLabels"];

        // if position not on left or not showing label, return null
        if (!(scalePosition === "right" && showLabels === true)) {
            return null;
        }

        const elementRef = React.useRef<any>(null);

        const fontSize = allStyle["fontSize"];
        const scaleLength = allStyle["height"];
        const numTickIntervals = allText["numTickIntervals"];
        const scale = allText["scale"];

        const [valueMin, valueMax] = this.calcPvLimits();
        const tickValues = calcTicks(valueMin, valueMax, numTickIntervals + 1, { scale: scale });
        const tickPositions = GlobalMethods.calcTickPositions(tickValues, valueMin, valueMax, scaleLength, { scale: scale });
        const refinedTicks = refineTicks(tickValues, fontSize * 0.5, elementRef, "vertical");

        return (
            <div
                ref={elementRef}
                style={{
                    height: "100%",
                    position: "relative",
                    display: "inline-flex",
                    flexDirection: "row",
                    justifyContent: "flex-end",
                    alignItems: "center",
                }}
            >

                {/* base axis */}
                <this._ElementAxis></this._ElementAxis>

                {/* ticks */}
                <this._ElementTicks
                    tickPositions={tickPositions}
                >
                </this._ElementTicks>

                {/* labels */}
                <this._ElementLabels
                    tickPositions={tickPositions}
                    refinedTicks={refinedTicks}
                >
                </this._ElementLabels>

            </div>
        );
    };

    _ElementAxis = () => {
        const scaleColor = this._getElementAreaRawTextStyle();
        const scaleLength = this.getAllStyle()["height"];
        return (
            <svg
                width={`2px`}
                height="100%"
                style={{
                    overflow: "visible",
                }}
            >
                <path
                    d={`M 1 0 L 1 ${scaleLength}`}
                    strokeWidth="2"
                    stroke={scaleColor}
                    fill="none"
                >
                </path>
            </svg>
        )
    }

    _ElementTicks = ({ tickPositions }: any) => {
        return (
            <svg
                width={`10px`}
                height="100%"
                style={{
                    overflow: "visible",
                }}
            >
                {tickPositions.map((position: number, index: number) => {
                    return (
                        <this._ElementTick
                            position={position}
                        ></this._ElementTick>
                    )
                })}
            </svg>

        )
    }

    _ElementTick = ({ position }: any) => {
        const scaleTickSize = 10;
        const scaleColor = this._getElementAreaRawTextStyle();

        return (
            <path
                d={`M 0 ${position} L ${scaleTickSize} ${position}`}
                strokeWidth="2"
                stroke={scaleColor}
                fill="none"
            ></path>
        )
    }

    _ElementLabels = ({ tickPositions, refinedTicks }: any) => {
        const allStyle = this.getAllStyle();
        const fontSize = allStyle["fontSize"];

        return (
            <div
                style={{
                    width: fontSize + 10,
                    height: "100%",
                    position: "relative",
                }}
            >
                {tickPositions.map((position: number, index: number) => {
                    const text = refinedTicks[index];
                    const numTicks = tickPositions.length;
                    return (
                        <this._ElementLabel
                            position={position}
                            text={text}
                            index={index}
                            numTicks={numTicks}
                        ></this._ElementLabel>
                    )
                })}
            </div>

        )
    }

    _ElementLabel = ({ position, text, index, numTicks }: any) => {

        const allText = this.getAllText();
        const compactScale = allText["compactScale"];
        const scaleColor = this._getElementAreaRawTextStyle();

        if (compactScale) {
            if (!(index === 0 || index === numTicks - 1)) {
                return null;
            }
        }

        // the first and last label are within the tick area
        const justifyContent = index === 0 ? "flex-start" : index === numTicks - 1 ? "flex-end" : "center";

        return (
            <div
                style={{
                    position: "absolute",
                    transform: "rotate(270deg)",
                    top: position,
                    left: 2,
                    width: 0,
                    height: 0,
                    display: "inline-flex",
                    alignItems: "flex-start",
                    justifyContent: justifyContent,
                    color: scaleColor,
                }}
            >
                {text}
            </div>

        )
    }



    // ------------------  helper functions -----------

    /**
     * Calculate water level, return pixel <br>
     * 
     * Same as ScaledSlider.calcSliderBlockPosition() <br>
     */
    calcWaterLevel = (): number => {
        if (g_widgets1.isEditing()) {
            return this.getAllStyle()["height"] * 0.33;
        }

        const allStyle = this.getAllStyle();
        const allText = this.getAllText();
        const height = allStyle["height"];
        const scale = allText["scale"];

        let useLog10Scale = scale === "Log10" ? true : false;
        let result: number = 0;
        
        let channelValue = this._getChannelValue(true);

        if (typeof channelValue === "number") {
            let [minPvValue, maxPvValue] = this.calcPvLimits();
            if (useLog10Scale) {
                minPvValue = Math.log10(minPvValue);
                maxPvValue = Math.log10(maxPvValue);
                channelValue = Math.log10(channelValue);
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
            result = ((channelValue - minPvValue) / (maxPvValue - minPvValue)) * height;
        }
        result = Math.min(Math.max(result, 0), height);

        return result;
    };


    // -------------------------- tdl -------------------------------

    static generateDefaultTdl = (): Record<string, any> => {
        const defaultTdl: type_Tank_tdl = {
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
                maxPvValue: 100,
                useLogScale: false,
                // tank and water colors
                fillColor: "rgba(0,200,0,1)",
                containerColor: "rgba(210,210,210,1)",
                showLabels: true,
                invisibleInOperation: false,
                // decimal, exponential, hexadecimal
                format: "default",
                numTickIntervals: 5,
                compactScale: false,
                // "left" | "right"
                scalePosition: "right",
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
        defaultTdl["widgetKey"] = GlobalMethods.generateWidgetKey(defaultTdl["type"]);
        return JSON.parse(JSON.stringify(defaultTdl));
    };

    generateDefaultTdl: () => any = Tank.generateDefaultTdl;

    // -------------------------- sidebar ---------------------------
    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new TankSidebar(this);
        }
    }
}
