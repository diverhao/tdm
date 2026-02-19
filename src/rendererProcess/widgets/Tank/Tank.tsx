import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { GlobalVariables } from "../../../common/GlobalVariables";
import { TankSidebar } from "./TankSidebar";
import * as GlobalMethods from "../../../common/GlobalMethods";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { TankRules } from "./TankRules";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { Scale } from "../../helperWidgets/SharedElements/Scale";


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
        const scaleParam = this.calcScaleParam();
        const position = scaleParam["position"];
        const showScale = scaleParam["show"];

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

                <Scale
                    min={scaleParam["min"]}
                    max={scaleParam["max"]}
                    numIntervals={scaleParam["numIntervals"]}
                    position={scaleParam["position"]}
                    show={position === "left" ? true : false}
                    length={scaleParam["length"]}
                    scale={scaleParam["scale"]}
                    color={scaleParam["color"]}
                    compact={scaleParam["compact"]}
                >
                </Scale>
                <this._ElementWater></this._ElementWater>
                <Scale
                    min={scaleParam["min"]}
                    max={scaleParam["max"]}
                    numIntervals={scaleParam["numIntervals"]}
                    position={scaleParam["position"]}
                    show={position === "right" ? true : false}
                    length={scaleParam["length"]}
                    scale={scaleParam["scale"]}
                    color={scaleParam["color"]}
                    compact={scaleParam["compact"]}
                >
                </Scale>
            </div >
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

    /**
     * calculate parameters for scale
     */
    calcScaleParam = () => {
        const allText = this.getAllText();
        const allStyle = this.getAllStyle();
        const scalePosition = allText["scalePosition"];
        const showLabels = allText["showLabels"];
        const color = this._getElementAreaRawTextStyle();
        const compact = allText["compactScale"];

        const scaleLength = allStyle["height"];
        const numTickIntervals = allText["numTickIntervals"];
        const scale = allText["scale"];
        const [valueMin, valueMax] = this.calcPvLimits();

        return {
            min: valueMin,
            max: valueMax,
            numIntervals: numTickIntervals,
            position: scalePosition as "left" | "top" | "bottom" | "right",
            show: showLabels,
            length: scaleLength,
            scale: scale,
            color: color,
            compact: compact,
        }
    }


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
