import * as GlobalMethods from "../../../common/GlobalMethods";
import * as React from "react";
import { calcTicks } from "../../../common/GlobalMethods";
import { GlobalVariables } from "../../../common/GlobalVariables";

export const Scale = ({ min, max, numIntervals, position, show, length, scale, color, compact }:
    {
        min: number,
        max: number,
        numIntervals: number,
        position: "left" | "top" | "right" | "bottom",
        show: boolean,
        length: number,
        scale: "Linear" | "Log10",
        color: string,
        compact: boolean
    }) => {
    if (show === false) {
        return null;
    }

    console.log("min max", min, max)

    if (position === "left") {
        return (
            <ScaleLeft
                min={min}
                max={max}
                numIntervals={numIntervals}
                length={length}
                scale={scale}
                color={color}
                compact={compact}
            ></ScaleLeft>
        )
    } else if (position === "right") {
        return (
            <ScaleRight
                min={min}
                max={max}
                numIntervals={numIntervals}
                length={length}
                scale={scale}
                color={color}
                compact={compact}
            ></ScaleRight>
        )
    } else if (position === "top") {
        return (
            <ScaleTop
                min={min}
                max={max}
                numIntervals={numIntervals}
                length={length}
                scale={scale}
                color={color}
                compact={compact}
            ></ScaleTop>
        )
    } else if (position === "bottom") {
        return (
            <ScaleBottom
                min={min}
                max={max}
                numIntervals={numIntervals}
                length={length}
                scale={scale}
                color={color}
                compact={compact}
            ></ScaleBottom>
        )
    } else {
        return null;
    }
}

export const ScaleLeft = ({ min, max, numIntervals, length, scale, color, compact }:
    {
        min: number,
        max: number,
        numIntervals: number,
        length: number,
        scale: "Linear" | "Log10",
        color: string,
        compact: boolean
    }
) => {

    const elementRef = React.useRef<any>(null);

    const fontSize = GlobalVariables.defaultFontSize;
    const tickValues = calcTicks(min, max, numIntervals + 1, { scale: scale });
    const tickPositions = GlobalMethods.calcTickPositions(tickValues, min, max, length, { scale: scale }, "vertical");
    const refinedTicks = GlobalMethods.refineTicks(tickValues, fontSize * 0.5, length, "vertical");

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
            <Labels
                tickPositions={tickPositions}
                refinedTicks={refinedTicks}
                fontSize={fontSize}
                compact={compact}
                color={color}
            >
            </Labels>

            {/* ticks */}
            <Ticks
                tickPositions={tickPositions}
                color={color}
            >
            </Ticks>

            {/* base axis */}
            <Axis color={color} length={length}></Axis>
        </div>
    );
};

export const ScaleRight = ({ min, max, numIntervals, length, scale, color, compact }:
    {
        min: number,
        max: number,
        numIntervals: number,
        length: number,
        scale: "Linear" | "Log10",
        color: string,
        compact: boolean
    }
) => {

    const elementRef = React.useRef<any>(null);

    const fontSize = GlobalVariables.defaultFontSize;
    const tickValues = calcTicks(min, max, numIntervals + 1, { scale: scale });
    const tickPositions = GlobalMethods.calcTickPositions(tickValues, min, max, length, { scale: scale }, "vertical");
    const refinedTicks = GlobalMethods.refineTicks(tickValues, fontSize * 0.5, length, "vertical");

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
            <Axis color={color} length={length}></Axis>

            {/* ticks */}
            <Ticks
                tickPositions={tickPositions}
                color={color}
            >
            </Ticks>

            {/* labels */}
            <Labels
                tickPositions={tickPositions}
                refinedTicks={refinedTicks}
                fontSize={fontSize}
                compact={compact}
                color={color}
            >
            </Labels>
        </div>
    );
};

export const ScaleTop = ({ min, max, numIntervals, length, scale, color, compact }:
    {
        min: number,
        max: number,
        numIntervals: number,
        length: number,
        scale: "Linear" | "Log10",
        color: string,
        compact: boolean
    }
) => {

    const elementRef = React.useRef<any>(null);

    const fontSize = GlobalVariables.defaultFontSize;
    const tickValues = calcTicks(min, max, numIntervals + 1, { scale: scale });
    const tickPositions = GlobalMethods.calcTickPositions(tickValues, min, max, length, { scale: scale }, "horizontal");
    const refinedTicks = GlobalMethods.refineTicks(tickValues, fontSize * 0.5, length, "vertical");

    return (
        <div
            ref={elementRef}
            style={{
                width: "100%",
                position: "relative",
                display: "inline-flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                alignItems: "center",
            }}
        >

            {/* labels */}
            <LabelsTopBottom
                tickPositions={tickPositions}
                refinedTicks={refinedTicks}
                fontSize={fontSize}
                compact={compact}
                color={color}
            >
            </LabelsTopBottom>

            {/* ticks */}
            <TicksTopBottom
                tickPositions={tickPositions}
                color={color}
            >
            </TicksTopBottom>

            {/* base axis */}
            <AxisTopBottom color={color} length={length}></AxisTopBottom>
        </div>
    );
};

export const ScaleBottom = ({ min, max, numIntervals, length, scale, color, compact }:
    {
        min: number,
        max: number,
        numIntervals: number,
        length: number,
        scale: "Linear" | "Log10",
        color: string,
        compact: boolean
    }
) => {

    const elementRef = React.useRef<any>(null);

    const fontSize = GlobalVariables.defaultFontSize;
    const tickValues = calcTicks(min, max, numIntervals + 1, { scale: scale });
    const tickPositions = GlobalMethods.calcTickPositions(tickValues, min, max, length, { scale: scale }, "horizontal");
    const refinedTicks = GlobalMethods.refineTicks(tickValues, fontSize * 0.5, length, "vertical");

    return (
        <div
            ref={elementRef}
            style={{
                width: "100%",
                position: "relative",
                display: "inline-flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                alignItems: "center",
            }}
        >

            {/* base axis */}
            <AxisTopBottom color={color} length={length}></AxisTopBottom>

            {/* ticks */}
            <TicksTopBottom
                tickPositions={tickPositions}
                color={color}
            >
            </TicksTopBottom>

            {/* labels */}
            <LabelsTopBottom
                tickPositions={tickPositions}
                refinedTicks={refinedTicks}
                fontSize={fontSize}
                compact={compact}
                color={color}
            >
            </LabelsTopBottom>
        </div>
    );
};


const Axis = ({ color, length }: any) => {
    return (
        <svg
            width={`2px`}
            height="100%"
            style={{
                overflow: "visible",
            }}
        >
            <path
                d={`M 1 0 L 1 ${length}`}
                strokeWidth="2"
                stroke={color}
                fill="none"
            >
            </path>
        </svg>
    )
}

const AxisTopBottom = ({ color, length }: any) => {
    return (
        <svg
            height={`2px`}
            width="100%"
            style={{
                overflow: "visible",
            }}
        >
            <path
                d={`M 0 1 L ${length} 1`}
                strokeWidth="2"
                stroke={color}
                fill="none"
            >
            </path>
        </svg>
    )
}

const Ticks = ({ tickPositions, color }: any) => {
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
                    <Tick
                        position={position}
                        color={color}
                    ></Tick>
                )
            })}
        </svg>

    )
}

const TicksTopBottom = ({ tickPositions, color }: any) => {
    return (
        <svg
            height={`10px`}
            width="100%"
            style={{
                overflow: "visible",
            }}
        >
            {tickPositions.map((position: number, index: number) => {
                return (
                    <TickTopBottom
                        position={position}
                        color={color}
                    ></TickTopBottom>
                )
            })}
        </svg>

    )
}

const Tick = ({ position, color }: any) => {
    const scaleTickSize = 10;
    return (
        <path
            d={`M 0 ${position} L ${scaleTickSize} ${position}`}
            strokeWidth="2"
            stroke={color}
            fill="none"
        ></path>
    )
}

const TickTopBottom = ({ position, color }: any) => {
    const scaleTickSize = 10;
    return (
        <path
            d={`M ${position} 0 L ${position} ${scaleTickSize} `}
            strokeWidth="2"
            stroke={color}
            fill="none"
        ></path>
    )
}

const Labels = ({ tickPositions, refinedTicks, fontSize, compact, color }: any) => {

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
                    <Label
                        position={position}
                        text={text}
                        index={index}
                        numTicks={numTicks}
                        compact={compact}
                        color={color}
                    ></Label>
                )
            })}
        </div>

    )
}

const LabelsTopBottom = ({ tickPositions, refinedTicks, fontSize, compact, color }: any) => {

    return (
        <div
            style={{
                height: fontSize + 10,
                width: "100%",
                position: "relative",
            }}
        >
            {tickPositions.map((position: number, index: number) => {
                const text = refinedTicks[index];
                const numTicks = tickPositions.length;
                return (
                    <LabelTopBottom
                        position={position}
                        text={text}
                        index={index}
                        numTicks={numTicks}
                        compact={compact}
                        color={color}
                    ></LabelTopBottom>
                )
            })}
        </div>

    )
}

const Label = ({ position, text, index, numTicks, compact, color }: any) => {

    if (compact) {
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
                color: color,
            }}
        >
            {text}
        </div>

    )
}

const LabelTopBottom = ({ position, text, index, numTicks, compact, color }: any) => {

    if (compact) {
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
                // transform: "rotate(270deg)",
                left: position,
                top: 2,
                width: 0,
                height: 0,
                display: "inline-flex",
                alignItems: "flex-start",
                justifyContent: justifyContent,
                color: color,
            }}
        >
            {text}
        </div>

    )
}