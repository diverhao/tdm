/**
 * Color-map UI elements for the Image widget.
 *
 * Contains the vertical gradient bar with Z-axis ticks, the color-map
 * dropdown selector, the Z-range input controls, and the helper
 * functions {@link switchColorMap} and {@link generateGradientStops}.
 */
import * as React from "react";
import type { Image } from "./Image";
import { colorMapFunctions, colorMapArrays, grayColorMapArray } from "./ImageColorMaps";

// ───────────────────── helpers ─────────────────────

/**
 * Switch the active color map, re-process data, and force-update the
 * image and color-map components.
 */
export const switchColorMap = (image: Image, newColorMap: string) => {
    let currentColorMap = image.getText()["colorMap"];
    if (currentColorMap === undefined) {
        currentColorMap = "gray";
    }

    image.getText()["colorMap"] = newColorMap;
    image.processData(false);
    image.forceUpdateImage({});
    image.forceUpdateColorMap({});
}

/**
 * Build a CSS `linear-gradient(to top, …)` string from the current
 * color-map array for rendering the gradient bar.
 */
export const generateGradientStops = (image: Image) => {
    let colors = [];
    const colorMapName = image.getText()["colorMap"];
    let colorMapArray = colorMapArrays[colorMapName];
    if (colorMapArray === undefined) {
        colorMapArray = grayColorMapArray;

    }

    // Convert to array of rgb strings
    for (let i = 0; i < colorMapArray.length; i += 3) {
        const r = colorMapArray[i];
        const g = colorMapArray[i + 1];
        const b = colorMapArray[i + 2];
        colors.push(`rgb(${r}, ${g}, ${b})`);
    }
    const gradient = `linear-gradient(to top, ${colors.join(',')})`;

    return gradient;
}

// ───────────────────── ElementColorMap ─────────────────────

/**
 * Vertical color-map gradient bar with Z-value tick marks, rendered to
 * the right of the image.
 */
export const ElementColorMap = ({ image }: { image: Image }) => {
    const [, forceUpdate] = React.useState({});

    image.forceUpdateColorMap = forceUpdate;
    const calcTicks = () => {

        const min = image.zMin;
        const max = image.zMax;
        // console.log(min, max)
        let dy = 1;
        if (max - min > 50000) {
            dy = 10000;
        } else if (max - min > 20000) {
            dy = 5000;
        } else if (max - min > 10000) {
            dy = 2000;
        } else if (max - min > 5000) {
            dy = 1000;
        } else if (max - min > 2000) {
            dy = 500;
        } else if (max - min > 1000) {
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

        const slope = image.getImageSize()[1] / (max - min);


        const result: [number, number][] = [];
        for (let value = yStart; value < max; value = value + dy) {
            result.push([Math.round(value), slope * (Math.round(value) - min)])
        }
        // console.log(slope, min, max, image.camera.left, image.camera.right)
        // console.log(result)
        return result;

    };
    return (
        <div style={{
            // position: "absolute",
            // zIndex: 1000,
            // right: 0,
            // bottom: 0,
            // marginLeft: 20,
            // paddingLeft: 20,

            // width: "100%",
            // height: "100%",
            height: image.getImageSize()[1],
            // backgroundColor: "red",
            position: "relative",
            display: "inline-flex",
            justifyContent: "flex-end",
            marginBottom: image.axisWidth + image.configHeight,
        }}>
            {/* long vertical line */}
            <svg
                style={{
                    height: "100%",
                    width: "25px",
                    // left: 80,
                }}

            >
                <polyline
                    points={`200,0 200,${image.getImageSize()[1]}`}
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
                                right: 0 + 15,
                                top: image.getImageSize()[1] - y,
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
                                right: 20 + 10,
                                top: image.getImageSize()[1] - y,
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
            <div style={{
                background: generateGradientStops(image),
                height: "100%",
                width: 15,
                // position: "absolute",
                // zIndex: 1000,
                // left: 20,
                // bottom: 0,
                // backgroundColor: "rgba(255, 255,0, 0.5)",
                // width: 100,
                // height: 100,

            }}>
            </div>

        </div>
    )
}

// ───────────────────── ElementSwitchColorMap ─────────────────────

/**
 * Dropdown selector for choosing the active color map.
 */
export const ElementSwitchColorMap = ({ image }: { image: Image }) => {
    const [colorMap, setColorMap] = React.useState(image.getText()["colorMap"]);
    return (
        <div
            style={{
                display: "inline-flex",
                flexDirection: "column",
                width: "100%",
            }}
        >
            <div
                style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                }}
            >
                <div>Color map: </div>

                <select
                    style={{
                        width: "8em",
                        outline: "none",
                        border: "1px solid black",
                    }}
                    id="myDropdown"
                    value={colorMap}
                    onChange={(event) => {
                        setColorMap(event.target.value);
                        switchColorMap(image, event.target.value);
                    }}

                >
                    {Object.keys(colorMapFunctions).map((key, index) => {
                        return (
                            <option value={key}>
                                {key.toUpperCase()}
                            </option>
                        )
                    })}
                </select>
            </div>

        </div >
    )
}

// ───────────────────── ElementZrange ─────────────────────

/**
 * Z-range (color-map value range) input controls with auto checkbox.
 */
export const ElementZrange = ({ image }: { image: Image }) => {
    const [zMin, setZmin] = React.useState(`${image.getText()["zMin"]}`);
    const [zMax, setZmax] = React.useState(`${image.getText()["zMax"]}`);
    // const [zMin, setZmin] = React.useState(`${image.zMin}`);
    // const [zMax, setZmax] = React.useState(`${image.zMax}`);
    const [autoZ, setAutoZ] = React.useState(image.getText()["autoZ"]);
    return (
        <div
            style={{
                display: "inline-flex",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",

            }}
        >
            <form
                style={{
                    display: "inline-flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}
                onMouseOver={() => {
                    image.setHintText("Color map lowest value" + (autoZ === true ? " (auto)" : ""));
                }}
                onMouseLeave={() => {
                    image.setHintText("");
                }}
                onSubmit={
                    (event: React.FormEvent<HTMLFormElement>) => {
                        event.preventDefault();
                        let value = parseFloat(zMin);
                        if (isNaN(value)) {
                            setZmin(`${image.getText()["zMin"]}`);
                            return;
                        }
                        image.getText()["zMin"] = value;
                        image.processData(false);
                        image.forceUpdateColorMap({});
                        image.forceUpdateImage({});
                    }
                }
            >
                <input
                    style={{
                        width: "3em",
                        outline: "none",
                        border: "solid 1px black",
                        color: autoZ === true ? "rgba(180, 180, 180, 1)" : "black",
                        cursor: autoZ === true ? "not-allowed" : "auto",
                    }}
                    value={autoZ === true ? image.zMin : zMin}
                    type={"text"}
                    readOnly={autoZ}
                    onChange={(event) => {
                        const valueStr = event.target.value;
                        setZmin(valueStr);
                    }}
                    onBlur={(event) => {
                        if (`${image.getText()["zMin"]}` !== zMin) {
                            setZmax(`${image.getText()["zMin"]}`)
                        }
                    }}

                >
                </input>
            </form>
            &nbsp;
            <form
                onMouseOver={() => {
                    image.setHintText("Color map highest value" + (autoZ === true ? " (auto)" : ""));
                }}
                onMouseLeave={() => {
                    image.setHintText("");
                }}

                onSubmit={
                    (event: React.FormEvent<HTMLFormElement>) => {
                        event.preventDefault();
                        let value = parseFloat(zMax);
                        if (isNaN(value)) {
                            setZmax(`${image.getText()["zMax"]}`);
                            return;
                        }
                        image.getText()["zMax"] = value;
                        image.processData(false);
                        image.forceUpdateColorMap({});
                        image.forceUpdateImage({});
                    }
                }
            >
                <input
                    style={{
                        width: "3em",
                        outline: "none",
                        border: "solid 1px black",
                        color: autoZ === true ? "rgba(180, 180, 180, 1)" : "black",
                        cursor: autoZ === true ? "not-allowed" : "auto",
                    }}
                    value={autoZ === true ? image.zMax : zMax}
                    type={"text"}
                    readOnly={autoZ}
                    onChange={(event) => {
                        const valueStr = event.target.value;
                        setZmax(valueStr);
                    }}
                    onBlur={(event) => {
                        if (`${image.getText()["zMax"]}` !== zMax) {
                            setZmax(`${image.getText()["zMax"]}`)
                        }
                    }}
                >
                </input>
            </form>
            <input
                onMouseOver={() => {
                    image.setHintText("Color map value auto range ");
                }}
                onMouseLeave={() => {
                    image.setHintText("");
                }}

                type={"checkbox"}
                checked={autoZ}
                onChange={(event) => {
                    image.getText()["autoZ"] = !autoZ;
                    setAutoZ(!autoZ);
                    image.processData(false);
                    image.forceUpdateColorMap({});
                    image.forceUpdateImage({});
                }}
            >
            </input>
        </div>
    )
}
