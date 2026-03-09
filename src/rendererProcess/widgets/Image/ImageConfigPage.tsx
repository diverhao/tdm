import * as React from "react";
import type { ImagePlot } from "./ImagePlot";
import { toolbarHeight } from "./Image";

import { NDArray_ColorMode } from "../../../common/GlobalVariables";
import { g_widgets1 } from "../../global/GlobalVariables";
import { colorMapFunctions, colorMapArrays, grayColorMapArray } from "./ImageColorMapData";

/**
 * The bottom config bar (toolbar) and the config page overlay
 * for the Image widget.  Holds a reference to the parent ImagePlot
 * for accessing image state and triggering re-renders.
 */
export class ImageConfigPage {

    private readonly _plot: ImagePlot;

    showConfigPage: boolean = false;
    lastMousePositions: [number, number] = [-10000, -10000];

    setHintText: React.Dispatch<React.SetStateAction<string>> = () => { };
    setXyzCursorValues: React.Dispatch<React.SetStateAction<[number | string, number | string, number | string]>> = () => { };


    constructor(plot: ImagePlot) {
        this._plot = plot;
    }

    /**
     * config bar
     */
    ElementConfigBar = () => {

        // hide config bar in editing mode
        const display = g_widgets1.isEditing() === true ? "none" : "inline-flex";

        return (
            <div
                style={{
                    width: "100%",
                    height: toolbarHeight,
                    display: "inline-flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <div
                    style={{
                        display: display,
                        flexDirection: "row",
                        justifyContent: "flex-start",
                        alignItems: "center",
                    }}
                >
                    {/* gear icon */}
                    <img
                        width={toolbarHeight}
                        src={"../../../webpack/resources/webpages/settings.svg"}
                        onMouseDown={(event) => {
                            event.stopPropagation();
                            this.showConfigPage = !this.showConfigPage;
                            this.getPlot().getMainWidget().forceUpdate({});
                        }}
                        onMouseOver={() => this.setHintText("More options")}
                        onMouseLeave={() => this.setHintText("")}
                    />
                    {/* Z-range inputs */}
                    <this._ElementZrangeInputs />
                    {/* set manual XY range */}
                    <this._ElementSetXyRangeButton />
                    {/* reset to full view */}
                    <this._ElementResetViewButton />
                    {/* play / pause */}
                    <this._ElementPlayPauseButton />
                    {/* hint text */}
                    <this._ElementHintText />
                </div>
                {/* cursor readout */}
                <this._ElementCursorReadout />
            </div>
        );
    };

    /**
     * config page
     */
    ElementConfigPage = () => {
        if (!this.showConfigPage) {
            return null;
        }

        return (
            // glass-looking feel
            <div
                style={{
                    position: "absolute",
                    top: 5,
                    left: 5,
                    padding: 20,
                    boxSizing: "border-box",
                    textShadow: `-0.5px -0.5px 0 white, 0.5px -0.5px 0 white, -0.5px 0.5px 0 white, 0.5px 0.5px 0 white`,
                    zIndex: 100,
                    background: "rgba(255, 255, 255, 0.15)",
                    backdropFilter: "blur(2px) saturate(180%)",
                    border: "1px solid rgba(255, 255, 255, 0.8)",
                    borderRadius: "2rem",
                    boxShadow: "0 8px 32px rgba(31, 38, 135, 0.2), inset 0 4px 20px rgba(255, 255, 255, 0.3)",
                    overflow: "hidden",
                }}
                onMouseDown={(event) => event.stopPropagation()}
            >
                {/* ::after pseudo-element equivalent */}
                <div
                    style={{
                        content: "''",
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        background: "rgba(255, 255, 255, 0.1)",
                        borderRadius: "2rem",
                        backdropFilter: "blur(1px)",
                        boxShadow: "inset -10px -8px 0px -11px rgba(255, 255, 255, 1), inset 0px -9px 0px -8px rgba(255, 255, 255, 1)",
                        opacity: 0.6,
                        zIndex: -1,
                        filter: "blur(1px) drop-shadow(10px 4px 6px black) brightness(115%)",
                        pointerEvents: "none",
                    }}
                />
                <div
                    style={{
                        display: "inline-flex",
                        flexDirection: "column",
                        position: "relative",
                        zIndex: 1,
                    }}
                >
                    <this._ElementXrangeInputs />
                    <this._ElementYrangeInputs />
                    <this._ElementColorMapSelection />
                </div>
            </div>
        );
    };

    // ------------------ config bar elements --------------------

    /**
     * Because autoZ/zMin/zMax are linked together, these 3 elements are 
     * located inside one component
     * 
     * Z-range (intensity) input controls in the toolbar.
     *
     * Provides two text inputs for zMin/zMax and an autoZ checkbox:
     * - **autoZ on:** zMin/zMax are auto-computed from image data each frame.
     *   Inputs display the live values but are read-only and greyed out.
     * - **autoZ off:** user edits zMin/zMax manually. Initial values are
     *   seeded from the persisted `text` properties. On submit the new
     *   values are written to `imageInfo` and the color map re-applied.
     */
    private _ElementZrangeInputs = () => {
        const plot = this.getPlot();
        const info = plot.getImageInfo();

        // always text
        const [zMin, setZmin] = React.useState(`${info.zMin}`);
        const [zMax, setZmax] = React.useState(`${info.zMax}`);
        const [autoZ, setAutoZ] = React.useState(info.autoZ);
        return (
            <div
                style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    alignItems: "center"
                }}
            >
                {/* z min input box */}
                <form
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        marginRight: 5,
                    }}

                    onMouseOver={() => {
                        this.setHintText("Color map lowest value" + (autoZ ? " (auto)" : ""))
                    }}

                    onMouseLeave={() => {
                        this.setHintText("")
                    }}

                    onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                        e.preventDefault();
                        const value = parseFloat(zMin);
                        if (isNaN(value)) {
                            setZmin(`${plot.getImageInfo().zMin}`);
                            return;
                        }
                        plot.setImageInfo({
                            ...plot.getImageInfo(),
                            zMin: value
                        });

                        const text = plot.getMainWidget().getText();
                        plot.setImageInfo({
                            ...info,
                            imageShownXmin: text["xMin"],
                            imageShownXmax: text["xMax"],
                            imageShownYmin: text["yMin"],
                            imageShownYmax: text["yMax"],
                        });
                        this.getPlot().updateImage();
                    }}
                >
                    <input
                        style={{
                            width: "3em",
                            outline: "none",
                            border: "solid 1px black",
                            color: autoZ ? "rgba(180,180,180,1)" : "black",
                            cursor: autoZ ? "not-allowed" : "auto"
                        }}
                        value={autoZ ? plot.getImageInfo().zMin : zMin}
                        type="text"
                        readOnly={autoZ}

                        onChange={(e) => {
                            setZmin(e.target.value)
                        }}

                        onBlur={() => {
                            if (`${plot.getImageInfo().zMin}` !== zMin) {
                                setZmin(`${plot.getImageInfo().zMin}`);
                            }
                        }}
                    />
                </form>

                {/* z max input box */}
                <form
                    onMouseOver={() => {
                        this.setHintText("Color map highest value" + (autoZ ? " (auto)" : ""))
                    }}

                    onMouseLeave={() => {
                        this.setHintText("")
                    }}

                    onSubmit={(e) => {
                        e.preventDefault();
                        const value = parseFloat(zMax);
                        if (isNaN(value)) {
                            setZmax(`${plot.getImageInfo().zMax}`);
                            return;
                        }

                        plot.setImageInfo({
                            ...plot.getImageInfo(),
                            zMax: value,
                        });

                        const text = plot.getMainWidget().getText();
                        plot.setImageInfo({
                            ...info,
                            imageShownXmin: text["xMin"],
                            imageShownXmax: text["xMax"],
                            imageShownYmin: text["yMin"],
                            imageShownYmax: text["yMax"],
                        });
                        this.getPlot().updateImage();

                    }}
                >
                    <input
                        style={{
                            width: "3em",
                            outline: "none",
                            border: "solid 1px black",
                            color: autoZ ? "rgba(180,180,180,1)" : "black",
                            cursor: autoZ ? "not-allowed" : "auto"
                        }}

                        value={autoZ ? plot.getImageInfo().zMax : zMax}
                        type="text"
                        readOnly={autoZ}

                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setZmax(e.target.value)
                        }}

                        onBlur={() => {
                            if (`${plot.getImageInfo().zMax}` !== zMax) {
                                setZmax(`${plot.getImageInfo().zMax}`);
                            }
                        }}
                    />
                </form>

                {/* auto Z check box */}
                <input
                    type="checkbox"
                    checked={autoZ}
                    onMouseOver={() => {
                        this.setHintText("Color map value auto range")
                    }}
                    onMouseLeave={() => {
                        this.setHintText("")
                    }}
                    onChange={() => {
                        const newAutoZ = !autoZ;
                        plot.setImageInfo({
                            ...plot.getImageInfo(),
                            autoZ: newAutoZ
                        });

                        setAutoZ(newAutoZ);

                        if (newAutoZ === false) {
                            // Switching to manual: seed inputs with the current auto-computed values
                            setZmin(`${plot.getImageInfo().zMin}`);
                            setZmax(`${plot.getImageInfo().zMax}`);
                        }

                        plot.updateImage();
                    }}
                />
            </div>
        );
    };

    /**
     * Set the X and Y ranges according to the static text["xMin/xMax/yMin/yMax"]
     */
    private _ElementSetXyRangeButton = () => {
        return (
            <div
                style={{
                    display: "inline-flex",
                    justifyContent: "center",
                    alignItems: "center"
                }}
                onMouseOver={() => {
                    this.setHintText("Set XY to original range")
                }}
                onMouseLeave={() => {
                    this.setHintText("")
                }}
                onMouseDown={() => {
                    const plot = this.getPlot();
                    const text = plot.getMainWidget().getText();
                    const info = plot.getImageInfo();
                    plot.setImageInfo({
                        ...info,
                        imageShownXmin: text["xMin"],
                        imageShownXmax: text["xMax"],
                        imageShownYmin: text["yMin"],
                        imageShownYmax: text["yMax"],
                    });
                    plot.updateImage();
                }}
            >
                <img
                    src={"../../../webpack/resources/webpages/scale-y.svg"}
                    width={toolbarHeight}
                />
            </div>
        );
    };

    private _ElementResetViewButton = () => {
        return (
            <div
                style={{
                    display: "inline-flex",
                    justifyContent: "center",
                    alignItems: "center"
                }}
                onMouseOver={() => {
                    this.setHintText("See full image")
                }}
                onMouseLeave={() => {
                    this.setHintText("")
                }}
                onMouseDown={() => {
                    this.resetViewToFull()
                }}
            >
                <img
                    src={"../../../webpack/resources/webpages/scale-2y.svg"}
                    width={toolbarHeight}
                />
            </div>
        );
    };

    private _ElementPlayPauseButton = () => {
        const mainWidget = this.getPlot().getMainWidget();
        const [playing, setPlayingState] = React.useState(this.getPlot().playing);
        return (
            <div
                style={{ display: "inline-flex", justifyContent: "center", alignItems: "center" }}
                onMouseOver={() => this.setHintText(playing ? "Stop image update" : "Start image update")}
                onMouseLeave={() => this.setHintText("")}
                onMouseDown={() => {
                    this.setPlaying(!playing);
                    setPlayingState(!playing);
                    this.setHintText(!playing ? "Stop image update" : "Start image update");
                    if (!playing === true) {
                        mainWidget.forceUpdate({});
                    }
                }}
            >
                <img
                    src={playing ? "../../../webpack/resources/webpages/pause.svg" : "../../../webpack/resources/webpages/play.svg"}
                    width={toolbarHeight}
                />
            </div>
        );
    };

    private _ElementHintText = () => {
        const [hintText, setHintText] = React.useState("");
        this.setHintText = setHintText;
        return (
            <div
                style={{
                    color: "rgba(150,150,150,1)"
                }}
            >
                {hintText}
            </div>
        );
    };

    private _ElementCursorReadout = () => {
        const [values, setValues] = React.useState<[number | string, number | string, number | string]>([-10000, -10000, -10000]);
        this.setXyzCursorValues = setValues;

        // Mouse is outside the image data area → show nothing
        if (values[0] === -10000) {
            return null;
        }

        return (
            <div
                style={{
                    whiteSpace: "nowrap"
                }}
            >
                ({values[0]}, {values[1]}, {values[2]})
            </div>
        );
    };

    // ------------------ config page elements -----------------

    private _ElementXrangeInputs = () => {
        const plot = this.getPlot();
        const info = plot.getImageInfo();
        const [xMin, setXmin] = React.useState(`${info.imageShownXmin}`);
        const [xMax, setXmax] = React.useState(`${info.imageShownXmax}`);
        return (
            <div style={{
                display: "inline-flex",
                flexDirection: "column",
                width: "100%"
            }}
            >
                {/* x min input box in config page*/}
                <div
                    style={{
                        display: "inline-flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        width: "100%",
                        marginBottom: 3,
                        alignItems: "center"
                    }}
                >
                    <div>X min</div>

                    <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                        e.preventDefault();
                        const value = parseFloat(xMin);
                        if (isNaN(value)) {
                            setXmin(`${plot.getImageInfo().imageShownXmin}`);
                            return;
                        }
                        plot.setImageInfo({
                            ...plot.getImageInfo(),
                            imageShownXmin: value,
                        });
                        plot.updateImage();
                    }}>
                        <input
                            style={{
                                width: "5em",
                                outline: "none",
                                border: "none"
                            }}
                            value={xMin}
                            type="text"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                setXmin(e.target.value)
                            }}
                            onBlur={() => {
                                if (`${plot.getImageInfo().imageShownXmin}` !== xMin) {
                                    setXmin(`${plot.getImageInfo().imageShownXmin}`);
                                }
                            }}
                        />
                    </form>
                </div>

                {/* x max input box in config page*/}
                <div
                    style={{
                        display: "inline-flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        width: "100%",
                        marginBottom: 3,
                        alignItems: "center"
                    }}
                >
                    <div>X max</div>
                    <form
                        onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                            e.preventDefault();
                            const value = parseFloat(xMax);
                            if (isNaN(value)) {
                                setXmax(`${plot.getImageInfo().imageShownXmax}`);
                                return;
                            }
                            plot.setImageInfo({
                                ...plot.getImageInfo(),
                                imageShownXmax: value
                            });

                            plot.updateImage();
                        }}>

                        <input
                            style={{
                                width: "5em",
                                outline: "none",
                                border: "none"
                            }}
                            value={xMax}
                            type="text"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                setXmax(e.target.value)
                            }}
                            onBlur={() => {
                                if (`${plot.getImageInfo().imageShownXmax}` !== xMax) {
                                    setXmax(`${plot.getImageInfo().imageShownXmax}`);
                                }
                            }}
                        />
                    </form>
                </div>
            </div>
        );
    };

    private _ElementYrangeInputs = () => {
        const plot = this.getPlot();
        const info = plot.getImageInfo();
        const [yMin, setYmin] = React.useState(`${info.imageShownYmin}`);
        const [yMax, setYmax] = React.useState(`${info.imageShownYmax}`);
        return (
            <div
                style={{
                    display: "inline-flex",
                    flexDirection: "column",
                    width: "100%"
                }}
            >
                {/* y min input box in config page*/}
                <div style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    width: "100%",
                    marginBottom: 3,
                    alignItems: "center"
                }}
                >
                    <div>Y min</div>
                    <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                        e.preventDefault();
                        const value = parseFloat(yMin);
                        if (isNaN(value)) {
                            setYmin(`${plot.getImageInfo().imageShownYmin}`);
                            return;
                        }
                        plot.setImageInfo({
                            ...plot.getImageInfo(),
                            imageShownYmin: value
                        });
                        plot.updateImage();
                    }}>
                        <input style={{ width: "5em", outline: "none", border: "none" }} value={yMin} type="text"
                            onChange={(e) => setYmin(e.target.value)}
                            onBlur={() => { if (`${plot.getImageInfo().imageShownYmin}` !== yMin) setYmin(`${plot.getImageInfo().imageShownYmin}`); }}
                        />
                    </form>
                </div>

                {/* y max input box in config page*/}
                <div
                    style={{
                        display: "inline-flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        width: "100%",
                        marginBottom: 3,
                        alignItems: "center"
                    }}
                >
                    <div>Y max</div>
                    <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                        e.preventDefault();
                        const value = parseFloat(yMax);
                        if (isNaN(value)) {
                            setYmax(`${plot.getImageInfo().imageShownYmax}`);
                            return;
                        }
                        plot.setImageInfo({
                            ...plot.getImageInfo(),
                            imageShownYmax: value
                        });
                        plot.updateImage();
                    }}>
                        <input style={{ width: "5em", outline: "none", border: "none" }} value={yMax} type="text"
                            onChange={(e) => setYmax(e.target.value)}
                            onBlur={() => { if (`${plot.getImageInfo().imageShownYmax}` !== yMax) setYmax(`${plot.getImageInfo().imageShownYmax}`); }}
                        />
                    </form>
                </div>
            </div>
        );
    };

    /**
     * Dropdown selector for choosing the active color map.
     */
    private _ElementColorMapSelection = () => {
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

    // ---------------------- helpers ------------------------

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

    /**
     * Reset view to show the full image, fitted maximally into the plot
     * region while keeping 1:1 pixel aspect ratio.
     *
     * If the image is wider than the plot region (relative to height),
     * the image fills the full width and is centred vertically with
     * padding.  If taller, it fills the full height and is centred
     * horizontally.
     */
    resetViewToFull = () => {
        const plot = this.getPlot();
        // Make sure plotWidth/Height and image dimensions are up-to-date
        plot.mapDbrDataWitNewData();

        const info = plot.getImageInfo();
        const { imageWidth, imageHeight, xBinning, yBinning } = info;
        if (imageWidth <= 0 || imageHeight <= 0) {
            return;
        }

        // Full detector dimensions (each data pixel covers binning×binning detector pixels)
        const fullWidth = imageWidth * xBinning;
        const fullHeight = imageHeight * yBinning;

        const plotW = plot.getPlotWidth();
        const plotH = plot.getPlotHeight();
        if (plotW <= 0 || plotH <= 0) {
            return;
        }

        // How many detector pixels per screen pixel in each direction
        // if we tried to fit the full image into the plot dimension
        const scaleX = fullWidth / plotW;    // det-px per screen-px if fit width
        const scaleY = fullHeight / plotH;   // det-px per screen-px if fit height

        // Use the larger scale so the entire image fits; the other axis
        // gets padding (centred).
        const scale = Math.max(scaleX, scaleY);

        // Visible range in image-pixel units
        const visibleW = plotW * scale;
        const visibleH = plotH * scale;

        // Anchor the image at the bottom-left corner of the plot region.
        // The binding axis starts at 0; the other axis also starts at 0
        // and extends by the visible range (which may exceed the image size).
        plot.setImageInfo({
            ...info,
            imageShownXmin: 0,
            imageShownXmax: visibleW,
            imageShownYmin: 0,
            imageShownYmax: visibleH,
        });

        plot.updateImage();
    };

    /**
     * Toggle play/pause. When pausing, back up current data so the
     * frozen frame keeps displaying.  When resuming, immediately
     * reprocess with the latest live data and re-render.
     */
    setPlaying = (playing: boolean) => {
        const plot = this.getPlot();
        const mainWidget = plot.getMainWidget();
        if (plot.playing === playing) {
            return;
        }
        if (playing === false) {
            // Freeze: snapshot current data so the paused frame persists
            plot.imageValueBackup = structuredClone(this.getPlot().getImageValue());
            plot.imageDimensionsBackup = structuredClone(this.getPlot().extractImageInfo());
        } else {
            // Resume: clear backup so getImageValue() reads live channel data
            plot.imageValueBackup = [];
            plot.imageDimensionsBackup = {
                imageWidth: -1,
                imageHeight: -1,
                colorMode: NDArray_ColorMode.mono,
                pixelDepth: 0,
                xBinning: 1,
                yBinning: 1
            };
        }
        plot.playing = playing;

        if (playing === true) {
            // Immediately refresh with the newest data and current config
            this.getPlot().mapDbrDataWitNewData();
            this.getPlot().updateCameraFrustum();
        }
    };

    // ------------------- getters -------------------

    getPlot = () => {
        return this._plot;
    }

}
