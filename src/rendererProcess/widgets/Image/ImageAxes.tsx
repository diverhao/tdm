/**
 * X-axis and Y-axis tick-mark elements for the Image widget.
 *
 * Both components compute axis ticks from the current camera view and
 * render them with SVG tick marks and plain-text labels.
 */
import * as React from "react";
import type { Image } from "./Image";
import { Scale } from "../../helperWidgets/SharedElements/Scale";
// ───────────────────── X axis ─────────────────────

/**
 * Horizontal axis below the image area, showing pixel-coordinate ticks.
 */
export const ElementXAxis0 = ({ image }: { image: Image }) => {
    const totalWidth = image.getImageSize()[0];
    const calcTicks = () => {

        const { width, height } = image.getImageDimensions();
        let max = image.getXmax();
        let min = image.getXmin();
        if (image.camera !== undefined) {
            min = image.camera.left + width / 2;
            max = image.camera.right + width / 2;

        }


        let dx = 1;
        if (max - min > 1000) {
            dx = 200;
        } else if (max - min > 500) {
            dx = 100;
        } else if (max - min > 200) {
            dx = 50;
        } else if (max - min > 100) {
            dx = 20;
        } else if (max - min > 50) {
            dx = 10;
        } else if (max - min > 20) {
            dx = 5;
        } else if (max - min > 10) {
            dx = 2;
        } else if (max - min > 1) {
            dx = 1;
        }

        let xStart = Math.ceil(min / dx) * dx;

        const slope = totalWidth / (max - min);

        const numPoints = totalWidth / 15 + 1;
        const result: [number, number][] = [];
        for (let value = xStart; value < max; value = value + dx) {
            result.push([Math.round(value), slope * (Math.round(value) - min)])
        }
        // console.log(slope, min, max, image.camera.left, image.camera.right)
        // console.log(result)
        return result;

    };
    return (
        <div style={{
            width: "100%",
            height: "100%",
            // backgroundColor: "red",
            position: "relative",
            // display: "inline-flex",
            // flexDirection: "column",
            // justifyContent: "flex-start",
            // top: 0,
            overflow: "visible",
        }}>

            <svg
                style={{
                    position: "absolute",
                    width: "100%",
                    height: "3px",
                    top: 0,
                    overflow: "visible",
                }}

            >
                <polyline
                    points={`-2,1 ${totalWidth},1`}
                    strokeWidth={`2px`}
                    stroke={"black"}
                    fill="none"
                ></polyline>
            </svg>
            {calcTicks().map(([value, x]) => {
                return (
                    <>
                        <svg
                            style={{
                                position: "absolute",
                                left: x,
                                top: 0,
                                width: 10,
                                height: 7,
                                display: "inline-flex",
                                justifyContent: "center",
                                alignItems: "center",
                                flexDirection: "column",
                            }}

                        >
                            <polyline
                                points={`0,0 0,7`}
                                strokeWidth={`2px`}
                                stroke={"black"}
                                fill="none"
                            >
                            </polyline>
                        </svg>
                        <div
                            style={{
                                position: "absolute",
                                left: x,
                                top: 15,
                                width: 0,
                                height: 0,
                                // backgroundColor: "blue",
                                display: "inline-flex",
                                justifyContent: "center",
                                alignItems: "center",
                                flexDirection: "column",
                            }}
                        >
                            {value}
                        </div>
                    </>
                )
            })}
        </div>
    )
}

export const ElementXAxis = ({ image }: { image: Image }) => {
    const totalWidth = image.getImageSize()[0];
    const calcTicks = () => {

        const { width, height } = image.getImageDimensions();
        let max = image.getXmax();
        let min = image.getXmin();
        if (image.camera !== undefined) {
            min = image.camera.left + width / 2;
            max = image.camera.right + width / 2;

        }


        let dx = 1;
        if (max - min > 1000) {
            dx = 200;
        } else if (max - min > 500) {
            dx = 100;
        } else if (max - min > 200) {
            dx = 50;
        } else if (max - min > 100) {
            dx = 20;
        } else if (max - min > 50) {
            dx = 10;
        } else if (max - min > 20) {
            dx = 5;
        } else if (max - min > 10) {
            dx = 2;
        } else if (max - min > 1) {
            dx = 1;
        }

        let xStart = Math.ceil(min / dx) * dx;

        const slope = totalWidth / (max - min);

        const numPoints = totalWidth / 15 + 1;
        const result: [number, number][] = [];
        for (let value = xStart; value < max; value = value + dx) {
            result.push([Math.round(value), slope * (Math.round(value) - min)])
        }
        // console.log(slope, min, max, image.camera.left, image.camera.right)
        // console.log(result)
        return result;

    };
    return (
        <div
            style={{
                position: "relative",
                width: yAxisTickWidth,
                height: this.getPlotHeight(),
                display: "inline-flex",
                flexGrow: 0,
                flexShrink: 0,
            }}
        >
            <Scale
                min={0}
                max={10}
                numIntervals={5}
                position={"left"}
                show={true}
                length={this.getPlotHeight()}
                scale={"Linear"}
                color={"rgba(0,0,0,1)"}
                compact={false}
                showTicks={false}
                showLabels={true}
                showAxis={false}
            >
            </Scale>

        </div>
    )
    return (
        <div style={{
            width: "100%",
            height: "100%",
            // backgroundColor: "red",
            position: "relative",
            // display: "inline-flex",
            // flexDirection: "column",
            // justifyContent: "flex-start",
            // top: 0,
            overflow: "visible",
        }}>

            <svg
                style={{
                    position: "absolute",
                    width: "100%",
                    height: "3px",
                    top: 0,
                    overflow: "visible",
                }}

            >
                <polyline
                    points={`-2,1 ${totalWidth},1`}
                    strokeWidth={`2px`}
                    stroke={"black"}
                    fill="none"
                ></polyline>
            </svg>
            {calcTicks().map(([value, x]) => {
                return (
                    <>
                        <svg
                            style={{
                                position: "absolute",
                                left: x,
                                top: 0,
                                width: 10,
                                height: 7,
                                display: "inline-flex",
                                justifyContent: "center",
                                alignItems: "center",
                                flexDirection: "column",
                            }}

                        >
                            <polyline
                                points={`0,0 0,7`}
                                strokeWidth={`2px`}
                                stroke={"black"}
                                fill="none"
                            >
                            </polyline>
                        </svg>
                        <div
                            style={{
                                position: "absolute",
                                left: x,
                                top: 15,
                                width: 0,
                                height: 0,
                                // backgroundColor: "blue",
                                display: "inline-flex",
                                justifyContent: "center",
                                alignItems: "center",
                                flexDirection: "column",
                            }}
                        >
                            {value}
                        </div>
                    </>
                )
            })}
        </div>
    )
}

// ───────────────────── Y axis ─────────────────────

/**
 * Vertical axis to the left of the image area, showing pixel-coordinate ticks.
 */
export const ElementYAxis = ({ image }: { image: Image }) => {
    const totalHeight = image.getImageSize()[1];

    const calcTicks = () => {
        const { width, height } = image.getImageDimensions();
        let max = image.getYmax();
        let min = image.getYmin();
        if (image.camera !== undefined) {
            min = image.camera.bottom + height / 2;
            max = image.camera.top + height / 2;
            // return [];
        }

        // console.log(min, max)
        let dy = 1;
        if (max - min > 1000) {
            dy = 200;
        } else if (max - min > 500) {
            dy = 100;
        } else if (max - min > 200) {
            dy = 50;
        } else if (max - min > 100) {
            dy = 20;
        } else if (max - min > 50) {
            dy = 10;
        } else if (max - min > 20) {
            dy = 5;
        } else if (max - min > 10) {
            dy = 2;
        } else if (max - min > 1) {
            dy = 1;
        }

        let yStart = Math.ceil(min / dy) * dy;

        const slope = totalHeight / (max - min);


        const result: [number, number][] = [];
        for (let value = yStart; value < max; value = value + dy) {
            result.push([Math.round(value), slope * (Math.round(value) - min)])
        }
        // console.log(slope, min, max, image.camera.left, image.camera.right)
        // console.log(result)
        return result;

    };
    // console.log("y axis ====================", totalHeight, calcTicks())
    return (
        <div style={{
            width: "100%",
            height: "100%",
            // backgroundColor: "red",
            position: "relative",
            display: "inline-flex",
            justifyContent: "flex-end",
        }}>
            {/* long vertical line */}
            <svg
                style={{
                    height: "100%",
                    width: "10px",
                    right: 0,
                }}

            >
                <polyline
                    points={`9,0 9,${totalHeight}`}
                    strokeWidth={`2px`}
                    stroke={"black"}
                    fill="none"
                ></polyline>
            </svg>
            {calcTicks().map(([value, y]) => {
                return (
                    <>
                        <svg
                            style={{
                                position: "absolute",
                                right: 0,
                                top: totalHeight - y,
                                width: 7,
                                height: 3,
                                display: "inline-flex",
                                justifyContent: "center",
                                alignItems: "center",
                                overflow: "visible",
                                flexDirection: "column",
                            }}

                        >
                            <polyline
                                points={`0,0 7,0`}
                                strokeWidth={`2px`}
                                stroke={"black"}
                                fill="none"
                            >
                            </polyline>
                        </svg>
                        <div
                            style={{
                                position: "absolute",
                                left: 20,
                                top: totalHeight - y,
                                transform: "rotate(270deg)",
                                width: 0,
                                height: 0,
                                // backgroundColor: "blue",
                                display: "inline-flex",
                                justifyContent: "center",
                                alignItems: "center",
                                flexDirection: "column",
                            }}
                        >
                            {value}
                        </div>
                    </>
                )
            })}
        </div>
    )
}
