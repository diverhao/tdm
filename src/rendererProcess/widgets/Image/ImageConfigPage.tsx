import * as React from "react";
import type { ImagePlot } from "./ImagePlot";
import { toolbarHeight } from "./Image";

import { NDArray_ColorMode } from "../../../common/GlobalVariables";
import { g_widgets1 } from "../../global/GlobalVariables";

/**
 * Owns the bottom config bar (toolbar) and the config page overlay
 * for the Image widget.  Holds a reference to the parent ImagePlot
 * for accessing image state and triggering re-renders.
 */
export class ImageConfigPage {
    private readonly _plot: ImagePlot;

    showConfigPage: boolean = false;
    setHintText: (text: string) => void = () => { };
    setXyzCursorValues: (values: any) => void = () => { };
    lastMousePositions: [number, number] = [-10000, -10000];

    constructor(plot: ImagePlot) {
        this._plot = plot;
    }

    getPlot = () => this._plot;

    // ---- actions used by toolbar buttons ----

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
        const plot = this._plot;
        // Make sure plotWidth/Height and image dimensions are up-to-date
        plot.mapDbrDataWitNewData();

        const info = plot.getImageInfo();
        const { imageWidth, imageHeight } = info;
        if (imageWidth <= 0 || imageHeight <= 0) {
            return;
        }

        const plotW = plot.getPlotWidth();
        const plotH = plot.getPlotHeight();
        if (plotW <= 0 || plotH <= 0) {
            return;
        }

        // How many image pixels per screen pixel in each direction
        // if we tried to fit the full image dimension into the plot dimension
        const scaleX = imageWidth / plotW;   // img-px per screen-px if fit width
        const scaleY = imageHeight / plotH;  // img-px per screen-px if fit height

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

        plot.updateCameraFrustum();
        plot.getMainWidget().forceUpdate({});
    };

    /**
     * Apply the persisted xMin/xMax/yMin/yMax range from text.
     * Resets the runtime imageInfo range back to the text-defined values.
     */
    setImageXyRange = () => {
        const text = this._plot.getMainWidget().getText();
        const info = this._plot.getImageInfo();
        this._plot.setImageInfo({
            ...info,
            imageShownXmin: text["xMin"],
            imageShownXmax: text["xMax"],
            imageShownYmin: text["yMin"],
            imageShownYmax: text["yMax"],
        });
        this._plot.mapDbrDataWitNewData();
        this._plot.updateCameraFrustum();
        this._plot.getMainWidget().forceUpdate({});
    };

    /**
     * Apply the current imageInfo XY range as a manual (non-auto) view.
     * Unlike setImageXyRange(), this does NOT reset to text values —
     * it keeps whatever is already in imageInfo (e.g. user-typed values).
     */
    applyManualXyRange = () => {
        this._plot.mapDbrDataWitNewData();
        this._plot.updateCameraFrustum();
        this._plot.getMainWidget().forceUpdate({});
    };

    /**
     * Toggle play/pause. When pausing, back up current data so the
     * frozen frame keeps displaying.  When resuming, immediately
     * reprocess with the latest live data and re-render.
     */
    setPlaying = (playing: boolean) => {
        const mainWidget = this._plot.getMainWidget();
        if (mainWidget.playing === playing) {
            return;
        }
        if (playing === false) {
            // Freeze: snapshot current data so the paused frame persists
            mainWidget.imageValueBackup = structuredClone(this._plot.getImageValue());
            mainWidget.imageDimensionsBackup = structuredClone(this._plot.extractImageInfo());
        } else {
            // Resume: clear backup so getImageValue() reads live channel data
            mainWidget.imageValueBackup = [];
            mainWidget.imageDimensionsBackup = { imageWidth: -1, imageHeight: -1, colorMode: NDArray_ColorMode.mono, pixelDepth: 0 };
        }
        mainWidget.playing = playing;

        if (playing === true) {
            // Immediately refresh with the newest data and current config
            this._plot.mapDbrDataWitNewData();
            this._plot.updateCameraFrustum();
        }
    };

    // ---- config bar (bottom toolbar) ----

    ElementConfigBar = () => {
        if (g_widgets1.isEditing()) {
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
                </div>
            )
        }
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
                        display: "inline-flex",
                        flexDirection: "row",
                        justifyContent: "flex-start",
                        alignItems: "center",
                    }}
                >
                    {/* gear icon */}
                    <img
                        onMouseDown={(event) => {
                            event.stopPropagation();
                            this.showConfigPage = !this.showConfigPage;
                            this._plot.getMainWidget().forceUpdate({});
                        }}
                        onMouseOver={() => this.setHintText("More options")}
                        onMouseLeave={() => this.setHintText("")}
                        src={"../../../webpack/resources/webpages/settings.svg"}
                        width={toolbarHeight}
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

    ElementConfigPage = () => {
        if (!this.showConfigPage) {
            return null;
        }
        const image = this._plot.getMainWidget();
        return (
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
                    {(() => {
                        const SwitchColorMap = this._plot.getColorMap().ElementSwitchColorMap;
                        return <SwitchColorMap />;
                    })()}
                </div>
            </div>
        );
    };

    // ---- toolbar sub-elements ----

    private _ElementZrangeInputs = () => {
        const plot = this._plot;
        const info = plot.getImageInfo();
        const [zMin, setZmin] = React.useState(`${info.zMin}`);
        const [zMax, setZmax] = React.useState(`${info.zMax}`);
        const [autoZ, setAutoZ] = React.useState(info.autoZ);
        return (
            <div style={{ display: "inline-flex", flexDirection: "row", alignItems: "center" }}>
                <form
                    style={{ display: "inline-flex", alignItems: "center" }}
                    onMouseOver={() => this.setHintText("Color map lowest value" + (autoZ ? " (auto)" : ""))}
                    onMouseLeave={() => this.setHintText("")}
                    onSubmit={(e) => {
                        e.preventDefault();
                        const v = parseFloat(zMin);
                        if (isNaN(v)) { setZmin(`${plot.getImageInfo().zMin}`); return; }
                        plot.setImageInfo({ ...plot.getImageInfo(), zMin: v });
                        this.applyManualXyRange();
                    }}
                >
                    <input
                        style={{ width: "3em", outline: "none", border: "solid 1px black", color: autoZ ? "rgba(180,180,180,1)" : "black", cursor: autoZ ? "not-allowed" : "auto" }}
                        value={autoZ ? plot.getImageInfo().zMin : zMin}
                        type="text" readOnly={autoZ}
                        onChange={(e) => setZmin(e.target.value)}
                        onBlur={() => { if (`${plot.getImageInfo().zMin}` !== zMin) setZmin(`${plot.getImageInfo().zMin}`); }}
                    />
                </form>
                &nbsp;
                <form
                    onMouseOver={() => this.setHintText("Color map highest value" + (autoZ ? " (auto)" : ""))}
                    onMouseLeave={() => this.setHintText("")}
                    onSubmit={(e) => {
                        e.preventDefault();
                        const v = parseFloat(zMax);
                        if (isNaN(v)) { setZmax(`${plot.getImageInfo().zMax}`); return; }
                        plot.setImageInfo({ ...plot.getImageInfo(), zMax: v });
                        this.applyManualXyRange();
                    }}
                >
                    <input
                        style={{ width: "3em", outline: "none", border: "solid 1px black", color: autoZ ? "rgba(180,180,180,1)" : "black", cursor: autoZ ? "not-allowed" : "auto" }}
                        value={autoZ ? plot.getImageInfo().zMax : zMax}
                        type="text" readOnly={autoZ}
                        onChange={(e) => setZmax(e.target.value)}
                        onBlur={() => { if (`${plot.getImageInfo().zMax}` !== zMax) setZmax(`${plot.getImageInfo().zMax}`); }}
                    />
                </form>
                <input
                    type="checkbox" checked={autoZ}
                    onMouseOver={() => this.setHintText("Color map value auto range")}
                    onMouseLeave={() => this.setHintText("")}
                    onChange={() => {
                        const newAutoZ = !autoZ;
                        plot.setImageInfo({ ...plot.getImageInfo(), autoZ: newAutoZ });
                        setAutoZ(newAutoZ);
                        if (!newAutoZ) {
                            // Switching to manual: seed inputs with the current auto-computed values
                            setZmin(`${plot.getImageInfo().zMin}`);
                            setZmax(`${plot.getImageInfo().zMax}`);
                        }
                        this.applyManualXyRange();
                    }}
                />
            </div>
        );
    };

    private _ElementSetXyRangeButton = () => {
        return (
            <div
                style={{ display: "inline-flex", justifyContent: "center", alignItems: "center" }}
                onMouseOver={() => this.setHintText("Set XY to original range")}
                onMouseLeave={() => this.setHintText("")}
                onMouseDown={() => this.setImageXyRange()}
            >
                <img src={"../../../webpack/resources/webpages/scale-y.svg"} width={toolbarHeight} />
            </div>
        );
    };

    private _ElementResetViewButton = () => {
        return (
            <div
                style={{ display: "inline-flex", justifyContent: "center", alignItems: "center" }}
                onMouseOver={() => this.setHintText("See full image")}
                onMouseLeave={() => this.setHintText("")}
                onMouseDown={() => this.resetViewToFull()}
            >
                <img src={"../../../webpack/resources/webpages/scale-2y.svg"} width={toolbarHeight} />
            </div>
        );
    };

    private _ElementPlayPauseButton = () => {
        const mainWidget = this._plot.getMainWidget();
        const [playing, setPlayingState] = React.useState(mainWidget.playing);
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
            <div style={{ color: "rgba(150,150,150,1)" }}>
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
            <div style={{ whiteSpace: "nowrap" }}>
                ({values[0]}, {values[1]}, {values[2]})
            </div>
        );
    };

    // ---- config page sub-elements (X / Y range inputs) ----

    private _ElementXrangeInputs = () => {
        const plot = this._plot;
        const info = plot.getImageInfo();
        const [xMin, setXmin] = React.useState(`${info.imageShownXmin}`);
        const [xMax, setXmax] = React.useState(`${info.imageShownXmax}`);
        return (
            <div style={{ display: "inline-flex", flexDirection: "column", width: "100%" }}>
                <div style={{ display: "inline-flex", flexDirection: "row", justifyContent: "space-between", width: "100%", marginBottom: 3, alignItems: "center" }}>
                    <div>X min</div>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const v = parseFloat(xMin);
                        if (isNaN(v)) { setXmin(`${plot.getImageInfo().imageShownXmin}`); return; }
                        plot.setImageInfo({ ...plot.getImageInfo(), imageShownXmin: v });
                        this.applyManualXyRange();
                    }}>
                        <input style={{ width: "5em", outline: "none", border: "none" }} value={xMin} type="text"
                            onChange={(e) => setXmin(e.target.value)}
                            onBlur={() => { if (`${plot.getImageInfo().imageShownXmin}` !== xMin) setXmin(`${plot.getImageInfo().imageShownXmin}`); }}
                        />
                    </form>
                </div>
                <div style={{ display: "inline-flex", flexDirection: "row", justifyContent: "space-between", width: "100%", marginBottom: 3, alignItems: "center" }}>
                    <div>X max</div>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const v = parseFloat(xMax);
                        if (isNaN(v)) { setXmax(`${plot.getImageInfo().imageShownXmax}`); return; }
                        plot.setImageInfo({ ...plot.getImageInfo(), imageShownXmax: v });
                        this.applyManualXyRange();
                    }}>
                        <input style={{ width: "5em", outline: "none", border: "none" }} value={xMax} type="text"
                            onChange={(e) => setXmax(e.target.value)}
                            onBlur={() => { if (`${plot.getImageInfo().imageShownXmax}` !== xMax) setXmax(`${plot.getImageInfo().imageShownXmax}`); }}
                        />
                    </form>
                </div>
            </div>
        );
    };

    private _ElementYrangeInputs = () => {
        const plot = this._plot;
        const info = plot.getImageInfo();
        const [yMin, setYmin] = React.useState(`${info.imageShownYmin}`);
        const [yMax, setYmax] = React.useState(`${info.imageShownYmax}`);
        return (
            <div style={{ display: "inline-flex", flexDirection: "column", width: "100%" }}>
                <div style={{ display: "inline-flex", flexDirection: "row", justifyContent: "space-between", width: "100%", marginBottom: 3, alignItems: "center" }}>
                    <div>Y min</div>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const v = parseFloat(yMin);
                        if (isNaN(v)) { setYmin(`${plot.getImageInfo().imageShownYmin}`); return; }
                        plot.setImageInfo({ ...plot.getImageInfo(), imageShownYmin: v });
                        this.applyManualXyRange();
                    }}>
                        <input style={{ width: "5em", outline: "none", border: "none" }} value={yMin} type="text"
                            onChange={(e) => setYmin(e.target.value)}
                            onBlur={() => { if (`${plot.getImageInfo().imageShownYmin}` !== yMin) setYmin(`${plot.getImageInfo().imageShownYmin}`); }}
                        />
                    </form>
                </div>
                <div style={{ display: "inline-flex", flexDirection: "row", justifyContent: "space-between", width: "100%", marginBottom: 3, alignItems: "center" }}>
                    <div>Y max</div>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const v = parseFloat(yMax);
                        if (isNaN(v)) { setYmax(`${plot.getImageInfo().imageShownYmax}`); return; }
                        plot.setImageInfo({ ...plot.getImageInfo(), imageShownYmax: v });
                        this.applyManualXyRange();
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
}
