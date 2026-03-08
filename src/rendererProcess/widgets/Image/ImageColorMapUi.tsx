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
    const plot = image.getPlot();
    plot.setImageInfo({ ...plot.getImageInfo(), colorMap: newColorMap });
    plot.mapDbrDataWitNewData();
    plot.updateCameraFrustum();
    image.forceUpdate({});
}

/**
 * Build a CSS `linear-gradient(to top, …)` string from the current
 * color-map array for rendering the gradient bar.
 */
export const generateGradientStops = (image: Image) => {
    let colors = [];
    const colorMapName = image.getPlot().getImageInfo().colorMap;
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

// ───────────────────── ElementSwitchColorMap ─────────────────────

/**
 * Dropdown selector for choosing the active color map.
 */
export const ElementSwitchColorMap = ({ image }: { image: Image }) => {
    const [colorMap, setColorMap] = React.useState(image.getPlot().getImageInfo().colorMap);
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
                <div>Color map </div>

                <select
                    style={{
                        width: "8em",
                        outline: "none",
                        border: "none",
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
                        const plot1 = image.getPlot();
                        plot1.setImageInfo({ ...plot1.getImageInfo(), zMin: value });
                        plot1.mapDbrDataWitNewData();
                        plot1.updateCameraFrustum();
                        image.forceUpdate({});
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
                        const plot2 = image.getPlot();
                        plot2.setImageInfo({ ...plot2.getImageInfo(), zMax: value });
                        plot2.mapDbrDataWitNewData();
                        plot2.updateCameraFrustum();
                        image.forceUpdate({});
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
                    const plot3 = image.getPlot();
                    plot3.setImageInfo({ ...plot3.getImageInfo(), autoZ: !autoZ });
                    plot3.mapDbrDataWitNewData();
                    plot3.updateCameraFrustum();
                    image.forceUpdate({});
                }}
            >
            </input>
        </div>
    )
}
