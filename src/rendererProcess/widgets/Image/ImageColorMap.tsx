/**
 * Color-map UI for the Image widget.
 *
 * Provides the color-map dropdown selector, the gradient-stop generator,
 * and the `switchColorMap` action.
 *
 * Follows the same single-class pattern used by {@link ImageConfigPage}:
 * the class holds a reference to its parent {@link ImagePlot}, exposes
 * public methods for actions, and `Element*` arrow-functions for React
 * sub-components.
 */
import * as React from "react";
import type { ImagePlot } from "./ImagePlot";
import { colorMapFunctions, colorMapArrays, grayColorMapArray } from "./ImageColorMapData";

export class ImageColorMap {
    private readonly _plot: ImagePlot;

    constructor(plot: ImagePlot) {
        this._plot = plot;
    }

    getPlot = () => this._plot;

    // ───────────────────── actions ─────────────────────

    /**
     * Switch the active color map, re-process data, and force-update the
     * image and color-map components.
     */
    switchColorMap = (newColorMap: string) => {
        const plot = this._plot;
        plot.setImageInfo({ ...plot.getImageInfo(), colorMap: newColorMap });
        plot.mapDbrDataWitNewData();
        plot.updateCameraFrustum();
        plot.getMainWidget().forceUpdate({});
    };

    /**
     * Build a CSS `linear-gradient(to top, ...)` string from the current
     * color-map array for rendering the gradient bar.
     */
    generateGradientStops = (): string => {
        const colorMapName = this._plot.getImageInfo().colorMap;
        let colorMapArray = colorMapArrays[colorMapName];
        if (colorMapArray === undefined) {
            colorMapArray = grayColorMapArray;
        }

        const colors: string[] = [];
        for (let i = 0; i < colorMapArray.length; i += 3) {
            const r = colorMapArray[i];
            const g = colorMapArray[i + 1];
            const b = colorMapArray[i + 2];
            colors.push(`rgb(${r}, ${g}, ${b})`);
        }
        return `linear-gradient(to top, ${colors.join(",")})`;
    };

    // ───────────────────── React elements ─────────────────────

    /**
     * Dropdown selector for choosing the active color map.
     */
    ElementSwitchColorMap = () => {
        const [colorMap, setColorMap] = React.useState(this._plot.getImageInfo().colorMap);
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
                            this.switchColorMap(event.target.value);
                        }}
                    >
                        {Object.keys(colorMapFunctions).map((key) => {
                            return (
                                <option key={key} value={key}>
                                    {key.toUpperCase()}
                                </option>
                            );
                        })}
                    </select>
                </div>
            </div>
        );
    };

    
}
