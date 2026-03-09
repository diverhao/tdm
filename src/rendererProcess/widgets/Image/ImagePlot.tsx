import * as GlobalMethods from "../../../common/GlobalMethods";
import * as React from "react";
import { colorbarWidth, Image, toolbarHeight, xAxisLabelHeight, xAxisTickHeight, yAxisLabelWidth, yAxisTickWidth } from "./Image";
import { g_widgets1 } from "../../global/GlobalVariables";
import { Scale } from "../../helperWidgets/SharedElements/Scale";
import { DataTexture, Mesh, MeshBasicMaterial, NearestFilter, OrthographicCamera, PlaneGeometry, RGBAFormat, Scene, SRGBColorSpace, UnsignedByteType, Vector3, WebGLRenderer } from "three";
import { NDArray_ColorMode } from "../../../common/GlobalVariables";
import { Log } from "../../../common/Log";
import { colorMapFunctions, grayColorMap } from "./ImageColorMapData";
import { ImageConfigPage } from "./ImageConfigPage";
import { ImageRoi } from "./ImageRoi";

/**
 * Runtime image display state.
 *
 * This is the **runtime source of truth** for the image plot — it
 * describes what portion of the image is currently shown, the plot
 * region dimensions, tick layout, and color-mapping parameters.
 *
 * Coordinates use two separate systems:
 * - **Image pixels** – the detector/source pixel grid (e.g. 1024×768).
 *   `imageShownX/Ymin/max`, `imageWidth/Height`, tick *values*.
 * - **Screen pixels** – CSS pixels on the rendered canvas.
 *   `plotRegionWidth/Height`, tick *positions*.
 *
 * The camera frustum maps the image-pixel range onto the screen-pixel
 * region; pan/zoom change the `imageShown*` bounds while the
 * screen-pixel sizes stay fixed (until the widget is resized).
 */
export type type_Image_info = {
    /** Left edge of the visible image region, in image pixels.
     *  Can be < 0 or > imageWidth when panned beyond the image. */
    imageShownXmin: number,
    /** Right edge of the visible image region, in image pixels. */
    imageShownXmax: number,
    /** Bottom edge of the visible image region, in image pixels. */
    imageShownYmin: number,
    /** Top edge of the visible image region, in image pixels. */
    imageShownYmax: number,
    /** Width of the plot/axis box in screen (CSS) pixels. */
    plotRegionWidth: number,
    /** Height of the plot/axis box in screen (CSS) pixels. */
    plotRegionHeight: number,
    /** X-axis tick values expressed in image-pixel coordinates. */
    xTickValues: number[],
    /** X-axis tick positions in screen pixels, corresponding 1-to-1 with `xTickValues`. */
    xTickPositions: number[],
    /** Y-axis tick values expressed in image-pixel coordinates. */
    yTickValues: number[],
    /** Y-axis tick positions in screen pixels, corresponding 1-to-1 with `yTickValues`. */
    yTickPositions: number[],
    /** Full image width in image pixels (from the NTNDArray dimension). */
    imageWidth: number,
    /** Full image height in image pixels (from the NTNDArray dimension). */
    imageHeight: number,
    /** NDArray color mode (mono, RGB1, RGB2, RGB3). */
    colorMode: NDArray_ColorMode,
    /** Bits per pixel channel (e.g. 8, 16, 32). */
    pixelDepth: number,
    /** X-axis binning factor from the NTNDArray dimension (1 = no binning). */
    xBinning: number,
    /** Y-axis binning factor from the NTNDArray dimension (1 = no binning). */
    yBinning: number,
    /** Lower bound of the Z (intensity) range used for color mapping. */
    zMin: number,
    /** Upper bound of the Z (intensity) range used for color mapping. */
    zMax: number,
    /** When `true`, `zMin`/`zMax` are auto-computed from the image data
     *  on every frame; when `false`, they are user-specified. */
    autoZ: boolean,
    /** Name of the active color map (e.g. `"gray"`, `"jet"`, `"hot"`). */
    colorMap: string,
};

export const defaultImageInfo: type_Image_info = {
    imageShownXmin: 0,
    imageShownXmax: 100,
    imageShownYmin: 0,
    imageShownYmax: 100,
    plotRegionWidth: 100,
    plotRegionHeight: 100,
    xTickValues: [],
    xTickPositions: [],
    yTickValues: [],
    yTickPositions: [],
    imageWidth: 0,
    imageHeight: 0,
    colorMode: NDArray_ColorMode.mono,
    pixelDepth: 0,
    xBinning: 1,
    yBinning: 1,
    zMin: 0,
    zMax: 255,
    autoZ: true,
    colorMap: "gray",
}

/**
 * -----------------------------------------------------------------------------------
 * |    |   |                                                              |         |
 * | E  | E |                                                              |   E     |
 * | l  | l |                                                              |   l     |
 * | e  | e |                                                              |   e     |
 * | m  | m |                                                              |   m     |
 * | e  | e |                                                              |   e     |
 * | n  | n |                                                              |   n     |
 * | t  | t |                      ElementImage                            |   t     |
 * | Y  | Y |                                                              |   C     |
 * | L  | T |                                                              |   o     |
 * | a  | i |                                                              |   l     |
 * | b  | c |                                                              |   o     |
 * | e  | k |                                                              |   r     |
 * | l  | s |                                                              |   M     |
 * |    |   |                                                              |   a     |
 * |    |   |                                                              |   p     |
 * |---------------------------------------------------------------------------------|
 * |        |                                                              |         |
 * | E B    |                                                              |  E B    |
 * | l l    |                      ElementXTicks                           |  l l    |
 * | e a    |                                                              |  e a    |
 * | m n    |                                                              |  m n    |
 * | e k    |--------------------------------------------------------------|  e k    |
 * | n A    |                                                              |  n A    |
 * | t r    |                                                              |  t r    |
 * |   e    |                      ElementXLabel                           |    e    |
 * |   a    |                                                              |    a    |
 * |---------------------------------------------------------------------------------|
 * |                                                                                 |
 * |                               ElementControls                                   |
 * |                                                                                 |
 * -----------------------------------------------------------------------------------
 */
export class ImagePlot {
    private readonly _mainWidget: Image;

    /** Runtime source of truth for the image display state (view bounds, ticks, color map, etc.). */
    private _imageInfo: type_Image_info;

    /** three.js DataTexture holding the RGBA pixel data uploaded to the GPU. */
    texture: DataTexture | undefined = undefined;
    /** three.js WebGLRenderer that draws the scene onto an HTML canvas element. */
    renderer: WebGLRenderer | undefined = undefined;
    /** three.js Scene containing the image plane mesh. */
    scene: Scene | undefined = undefined;
    /** Orthographic camera whose frustum maps image-pixel bounds to the screen-pixel canvas. */
    camera: OrthographicCamera | undefined = undefined;
    /** Raw 8-bit RGBA pixel buffer (4 bytes per pixel) backing the DataTexture. */
    textureData: Uint8Array | undefined = undefined;
    /** React ref to the container div where the three.js canvas is imperatively appended. */
    mountRef: React.RefObject<HTMLDivElement | null> | undefined = undefined;

    /** Toolbar and configuration page overlay (zoom-to-full, cursor readout, color-map UI, settings). */
    private _configPage: ImageConfigPage;
    /** Region-of-interest overlay system (drag, resize, PV read/write). */
    private _roi: ImageRoi;

    /** Whether the image is live-updating (`true`) or frozen/paused (`false`). */
    playing: boolean = true;

    /** Snapshot of the raw 1-D pixel array captured when playback is paused.
     *  While `playing` is `false`, `getImageValue()` returns this array
     *  instead of the live channel data so the frozen frame stays on screen. */
    imageValueBackup: number[] = [];

    /** Snapshot of the image dimensions captured alongside `imageValueBackup`
     *  when playback is paused.  `extractImageInfo()` returns this object
     *  while `playing` is `false` so the geometry, color mode, and binning
     *  stay consistent with the frozen pixel data. */
    imageDimensionsBackup: {
        imageWidth: number,
        imageHeight: number,
        colorMode: NDArray_ColorMode,
        pixelDepth: number,
        xBinning: number,
        yBinning: number
    } = {
            imageWidth: -1,
            imageHeight: -1,
            colorMode: NDArray_ColorMode.mono,
            pixelDepth: 0,
            xBinning: 1,
            yBinning: 1
        };

    constructor(mainWidget: Image) {
        this._mainWidget = mainWidget;
        const style = this.getMainWidget().getStyle();
        const text = mainWidget.getText();

        // Seed runtime imageInfo from the persisted text values.
        // Use getText() (not getAllText()) because _allText is not yet
        // populated at construction time — updateAllStyleAndText() runs
        // during the first render.
        const info = structuredClone(defaultImageInfo);
        this._imageInfo = info;
        info.plotRegionWidth = style.width - yAxisLabelWidth - yAxisTickWidth - colorbarWidth;
        info.plotRegionHeight = style.height - xAxisLabelHeight - xAxisTickHeight - toolbarHeight;
        info.imageShownXmin = text["xMin"];
        info.imageShownXmax = text["xMax"];
        info.imageShownYmin = text["yMin"];
        info.imageShownYmax = text["yMax"];
        info.zMin = text["zMin"];
        info.zMax = text["zMax"];
        info.autoZ = text["autoZ"];
        info.colorMap = text["colorMap"] ?? "gray";

        // create components
        this._configPage = new ImageConfigPage(this);
        this._roi = new ImageRoi(this);
    }

    _Element = () => {

        // update the axis/lables/colomaps according to the latest widget size
        if (g_widgets1.isEditing()) {
            this.updateImageInfo();
        }

        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "inline-flex",
                    flexDirection: "column",
                    position: "relative",
                }}
            >
                <div
                    style={{
                        display: "inline-flex",
                        width: `100%`,
                        flexGrow: 0,
                        flexShrink: 0,
                        flexFlow: "row",
                        justifyContent: "flex-start",
                        alignItems: "center",
                    }}
                >
                    <this._ElementYLabel />
                    <this._ElementYTicks />
                    <this._ElementImage />
                    <this._ElementColorMap />
                </div>
                <div
                    style={{
                        display: "inline-flex",
                        width: `100%`,
                        flexGrow: 0,
                        flexShrink: 0,
                        flexFlow: "row",
                        justifyContent: "flex-start",
                        alignItems: "flex-start",
                    }}
                >
                    <this._ElementBlankArea></this._ElementBlankArea>
                    <div
                        style={{
                            display: "inline-flex",
                            flexDirection: "column",
                            justifyContent: "flex-start",
                            alignItems: "center",
                        }}
                    >
                        <this._ElementXTicks></this._ElementXTicks>
                        <this._ElementXLabel></this._ElementXLabel>
                    </div>
                </div>
                <this._configPage.ElementConfigBar />
                <this._configPage.ElementConfigPage />
            </div>
        )
    }

    _ElementBlankArea = () => {
        const width = yAxisLabelWidth + yAxisTickWidth;
        const height = xAxisLabelHeight + xAxisTickHeight;
        return (
            <div
                style={{
                    display: "inline-flex",
                    width: width,
                    height: height,
                }}
            >
            </div>
        )
    }

    _ElementImage = () => {

        const {
            imageWidth,
            imageHeight,
            xBinning,
            yBinning,
            imageShownXmin,
            imageShownXmax,
            imageShownYmin,
            imageShownYmax,
            plotRegionWidth,
            plotRegionHeight } = this.getImageInfo();

        // Full detector dimensions (each data pixel covers binning×binning detector pixels)
        const fullWidth = imageWidth * xBinning;
        const fullHeight = imageHeight * yBinning;

        const mountRef = React.useRef<HTMLDivElement>(null);
        this.mountRef = mountRef;

        const fun1 = () => {

            // the image data has not arrived yet
            if (imageWidth === 0 || imageHeight === 0) {
                return;
            }

            if (this.scene !== undefined) {
                return;
            }

            if (this.textureData === undefined) {
                return;
            }

            // Create texture from data
            const texture = new DataTexture(
                this.textureData,
                imageWidth,
                imageHeight,
                RGBAFormat, // always RGBA
                UnsignedByteType
            );
            texture.colorSpace = SRGBColorSpace; // Replaces encoding in newer versions

            // the first data point in this.textureData is plotted on top-left corner
            texture.flipY = true;
            texture.needsUpdate = true;
            texture.generateMipmaps = false;
            texture.minFilter = NearestFilter;
            texture.magFilter = NearestFilter;

            const scene = new Scene();

            // xy view range
            let xMax = imageShownXmax;
            let xMin = imageShownXmin;
            if (xMax < xMin) {
                const tmp = xMax;
                xMax = xMin;
                xMin = tmp;
            }


            const camLeft = -fullWidth / 2 + xMin;
            const camRight = -fullWidth / 2 + xMax;

            let yMax = imageShownYmax;
            let yMin = imageShownYmin;
            if (yMax < yMin) {
                const tmp = yMax;
                yMax = yMin;
                yMin = tmp;
            }

            const camBottom = -fullHeight / 2 + yMin;
            const camTop = -fullHeight / 2 + yMax;

            const camera = new OrthographicCamera(
                camLeft,
                camRight,
                camTop,
                camBottom,
                0.1,
                10
            );

            camera.position.z = 5;
            camera.lookAt(0, 0, 0);

            const renderer = new WebGLRenderer({ alpha: true });

            // the image area, outside of this area is blank
            // this.calcImageSize();
            renderer.setSize(plotRegionWidth, plotRegionHeight);
            // Remove any leftover canvas elements to prevent ghost images.
            // Only remove <canvas> nodes — leave React-managed children alone.
            const mount = mountRef.current!;
            mount.querySelectorAll("canvas").forEach((c) => c.remove());
            mount.appendChild(renderer.domElement);

            const geometry = new PlaneGeometry(fullWidth, fullHeight);
            const material = new MeshBasicMaterial({ map: texture, color: 0xffffff });
            const plane = new Mesh(geometry, material);
            scene.add(plane);

            material.transparent = true;
            material.premultipliedAlpha = true;  // if your data has alpha


            // Ensure the canvas sits below the ROI overlay (z-index: 0 < 1)
            renderer.domElement.style.position = "relative";
            renderer.domElement.style.zIndex = "0";

            renderer.render(scene, camera);
            // console.log("recreate stuff");
            this.texture = texture;
            this.renderer = renderer;
            this.camera = camera;
            this.scene = scene;
            // this.autoXY = false;
        };

        const fun2 = () => {
            if (!this.texture || !this.renderer || !this.scene || !this.camera) {
                return;
            }
            this.texture.needsUpdate = true; // upload changes to GPU
            this.texture.generateMipmaps = false;
            this.texture.minFilter = NearestFilter;
            this.texture.magFilter = NearestFilter;

            this.renderer.render(this.scene, this.camera);
        };

        React.useEffect(fun1);
        React.useEffect(fun2);

        return (
            <div
                ref={mountRef}
                style={{
                    width: this.getPlotWidth(),
                    height: this.getPlotHeight(),
                    position: "relative",
                }}

                onMouseDown={(event) => {
                    if (event.button !== 0) {
                        return;
                    }
                    // Hide config page if it's open
                    if (this._configPage.showConfigPage) {
                        this._configPage.showConfigPage = false;
                        this.getMainWidget().forceUpdate({});
                    }
                    window.addEventListener("mousemove", this.panImageEventListener);
                    window.addEventListener("mouseup", this.cancelPanImageEventListener);
                }}

                onMouseMove={(event) => {
                    this.handleMouseMoveOnImage(event.clientX, event.clientY);
                }}

                onMouseLeave={() => {
                    this.handleMouseLeaveImage();
                }}

                onWheel={(event) => {
                    event.preventDefault();

                    const zoomFactor = event.deltaY < 0 ? 1.1 : 1 / 1.1;

                    if (!this.camera || !mountRef.current) return;

                    const rect = mountRef.current.getBoundingClientRect();

                    // Mouse position in NDC (-1 to +1)
                    const ndcX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
                    const ndcY = -((event.clientY - rect.top) / rect.height) * 2 + 1;

                    // Convert NDC → world coordinates
                    const mouseWorld = new Vector3(ndcX, ndcY, 0);
                    mouseWorld.unproject(this.camera);

                    this.zoomImage(zoomFactor, mouseWorld.x, mouseWorld.y);
                }}

            >
                <this._roi.ElementRois />
            </div>
        );
    };

    _ElementColorMap = () => {
        const { zMin, zMax } = this.getImageInfo();
        const gradientBarWidth = 15;
        const tickAreaWidth = colorbarWidth - gradientBarWidth;

        return (
            <div
                style={{
                    width: colorbarWidth,
                    height: this.getPlotHeight(),
                    display: "inline-flex",
                    flexDirection: "row",
                    flexShrink: 0,
                }}
            >
                {/* gradient bar */}
                <div
                    style={{
                        width: gradientBarWidth,
                        height: "100%",
                        background: this.getConfigPage().generateGradientStops(),
                    }}
                />
                {/* Z-axis ticks */}
                <div
                    style={{
                        width: tickAreaWidth,
                        height: "100%",
                        position: "relative",
                    }}
                >
                    <Scale
                        min={zMin}
                        max={zMax}
                        numIntervals={5}
                        position={"right"}
                        show={true}
                        length={this.getPlotHeight()}
                        scale={"Linear"}
                        color={"rgba(0,0,0,1)"}
                        compact={false}
                        showTicks={true}
                        showLabels={true}
                        showAxis={true}
                    />
                </div>
            </div>
        );
    }


    _ElementXLabel = () => {

        return (
            <div
                style={{
                    display: "inline-flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                X
            </div>
        );
    };

    _ElementXTicks = () => {

        const {
            imageShownXmin,
            imageShownXmax,
            imageShownYmin,
            imageShownYmax,
            xTickValues,
            xTickPositions,
            yTickValues,
            yTickPositions,
        } = this.getImageInfo();

        return (
            <div
                style={{
                    position: "relative",
                    height: xAxisTickHeight,
                    width: this.getPlotWidth(),
                    display: "inline-flex",
                    flexGrow: 0,
                    flexShrink: 0,
                }}
            >
                <Scale
                    min={imageShownXmin}
                    max={imageShownXmax}
                    numIntervals={5}
                    position={"bottom"}
                    show={true}
                    length={this.getPlotWidth()}
                    scale={"Linear"}
                    color={"rgba(0,0,0,1)"}
                    compact={false}
                    showTicks={true}
                    showLabels={true}
                    showAxis={true}
                >
                </Scale>
            </div>
        )
    };

    _ElementYLabel = () => {

        return (
            <div
                style={{
                    display: "inline-flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: yAxisLabelWidth,
                    height: "100%",
                }}
            >
                <div
                    style={{
                        transform: "rotate(-90deg)",
                        overflow: "visible",
                        whiteSpace: "nowrap",
                    }}
                >
                    Y
                </div>
            </div>
        );
    };

    _ElementYTicks = () => {

        const {
            imageShownXmin,
            imageShownXmax,
            imageShownYmin,
            imageShownYmax,
            xTickValues,
            xTickPositions,
            yTickValues,
            yTickPositions,
        } = this.getImageInfo();

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
                    min={imageShownYmin}
                    max={imageShownYmax}
                    numIntervals={5}
                    position={"left"}
                    show={true}
                    length={this.getPlotHeight()}
                    scale={"Linear"}
                    color={"rgba(0,0,0,1)"}
                    compact={false}
                    showTicks={true}
                    showLabels={true}
                    showAxis={true}
                >
                </Scale>
            </div>
        )
    };


    // ------------------ cursor readout --------------------

    /**
     * Convert screen (client) coordinates to image-pixel coordinates and
     * look up the raw pixel value (z).  Updates the cursor readout in the
     * config bar.  If the image-pixel position falls outside the actual
     * image data, the readout is cleared.
     */
    handleMouseMoveOnImage = (clientX: number, clientY: number) => {
        const configPage = this.getConfigPage();
        if (!this.mountRef?.current || !this.camera) {
            return;
        }
        const rect = this.mountRef.current.getBoundingClientRect();
        const info = this.getImageInfo();
        const { imageShownXmin, imageShownXmax, imageShownYmin, imageShownYmax,
            imageWidth, imageHeight, xBinning, yBinning, colorMode } = info;

        // Full detector dimensions
        const fullWidth = imageWidth * xBinning;
        const fullHeight = imageHeight * yBinning;

        // Fraction across the plot area (0 = left, 1 = right)
        const fracX = (clientX - rect.left) / rect.width;
        const fracY = (clientY - rect.top) / rect.height;

        // Map to full-detector pixel coordinates
        // X: left edge = imageShownXmin, right edge = imageShownXmax
        const imgX = imageShownXmin + fracX * (imageShownXmax - imageShownXmin);
        // Y: top edge = imageShownYmax, bottom edge = imageShownYmin (screen Y is flipped)
        const imgY = imageShownYmax - fracY * (imageShownYmax - imageShownYmin);

        // Integer pixel indices (full-detector coordinates)
        const px = Math.floor(imgX);
        const py = Math.floor(imgY);

        // Outside full detector range → clear readout
        if (px < 0 || px >= fullWidth || py < 0 || py >= fullHeight) {
            configPage.lastMousePositions = [-10000, -10000];
            configPage.setXyzCursorValues([-10000, -10000, -10000]);
            return;
        }

        // Convert full-detector pixel to data-buffer index
        const dataPx = Math.floor(px / xBinning);
        const dataPy = Math.floor(py / yBinning);

        // Look up the raw pixel value from the data array
        const dataRaw = this.getImageValue();
        let z: number | string = "–";
        if (Array.isArray(dataRaw)) {
            const size = imageWidth * imageHeight;
            // Row 0 is the top row in the data array (same as texture flipY)
            const dataIndex = dataPy * imageWidth + dataPx;
            if (colorMode === NDArray_ColorMode.mono) {
                if (dataIndex < dataRaw.length) {
                    z = dataRaw[dataIndex];
                }
            } else if (colorMode === NDArray_ColorMode.rgb1) {
                if (3 * dataIndex + 2 < dataRaw.length) {
                    const r = dataRaw[3 * dataIndex];
                    const g = dataRaw[3 * dataIndex + 1];
                    const b = dataRaw[3 * dataIndex + 2];
                    z = `${r},${g},${b}`;
                }
            } else if (colorMode === NDArray_ColorMode.rgb2) {
                const rIdx = 3 * dataPy * imageWidth + dataPx;
                const gIdx = rIdx + imageWidth;
                const bIdx = rIdx + 2 * imageWidth;
                if (bIdx < dataRaw.length) {
                    z = `${dataRaw[rIdx]},${dataRaw[gIdx]},${dataRaw[bIdx]}`;
                }
            } else if (colorMode === NDArray_ColorMode.rgb3) {
                if (dataIndex + 2 * size < dataRaw.length) {
                    z = `${dataRaw[dataIndex]},${dataRaw[size + dataIndex]},${dataRaw[2 * size + dataIndex]}`;
                }
            }
        }

        configPage.lastMousePositions = [clientX, clientY];
        configPage.setXyzCursorValues([px, py, z]);
    };

    /**
     * Clear the cursor readout when the mouse leaves the image area.
     */
    handleMouseLeaveImage = () => {
        const configPage = this.getConfigPage();
        configPage.lastMousePositions = [-10000, -10000];
        configPage.setXyzCursorValues([-10000, -10000, -10000]);
    };

    // ------------------ pan image --------------------

    /**
     * Pan the image by (dx, dy) screen pixels.
     *
     * Converts screen-pixel movement to image-pixel (world) units, shifts the
     * OrthographicCamera frustum, updates the stored axis range, recomputes
     * ticks, and re-renders.
     */
    panImage = (dx: number, dy: number) => {
        if (!this.camera || !this.renderer || !this.scene) {
            return;
        }

        const camera = this.camera;
        const canvasWidth = this.renderer.domElement.clientWidth;
        const canvasHeight = this.renderer.domElement.clientHeight;
        if (canvasWidth === 0 || canvasHeight === 0) {
            return;
        }

        // screen pixels per image pixel (world unit)
        const screenPerWorldX = canvasWidth / (camera.right - camera.left);
        const screenPerWorldY = canvasHeight / (camera.top - camera.bottom);

        // convert screen-pixel delta → image-pixel (world) delta
        const panX = dx / screenPerWorldX;
        const panY = dy / screenPerWorldY;

        // shift camera (drag-right → view moves left → subtract)
        camera.left -= panX;
        camera.right -= panX;
        camera.top += panY;
        camera.bottom += panY;
        camera.updateProjectionMatrix();

        // update stored axis range so ticks follow
        const info = this.getImageInfo();
        const newXmin = info.imageShownXmin - panX;
        const newXmax = info.imageShownXmax - panX;
        const newYmin = info.imageShownYmin + panY;
        const newYmax = info.imageShownYmax + panY;

        const { plotRegionWidth, plotRegionHeight, xTickValues, xTickPositions, yTickValues, yTickPositions } =
            this._extractTicksInfo(newXmin, newXmax, newYmin, newYmax);

        this.setImageInfo({
            ...info,
            imageShownXmin: newXmin,
            imageShownXmax: newXmax,
            imageShownYmin: newYmin,
            imageShownYmax: newYmax,
            plotRegionWidth,
            plotRegionHeight,
            xTickValues,
            xTickPositions,
            yTickValues,
            yTickPositions,
        });

        this.renderer.render(this.scene, camera);
        this.getMainWidget().forceUpdate({});
    };

    panImageEventListener = (e: MouseEvent) => {
        this.panImage(e.movementX, e.movementY);
    };

    cancelPanImageEventListener = () => {
        window.removeEventListener("mousemove", this.panImageEventListener);
        window.removeEventListener("mouseup", this.cancelPanImageEventListener);
    };

    // ------------------ zoom image ----------------------------

    /**
     * Zoom the image around a point in world (image-pixel) coordinates.
     *
     * @param zoomFactor >1 zooms in, <1 zooms out
     * @param centerX    world X coordinate that stays fixed on screen
     * @param centerY    world Y coordinate that stays fixed on screen
     */
    zoomImage = (zoomFactor: number, centerX: number, centerY: number) => {
        if (!this.camera || !this.renderer || !this.scene) {
            return;
        }

        const cam = this.camera;

        // Scale the frustum around the world-space center point
        cam.left = centerX - (centerX - cam.left) / zoomFactor;
        cam.right = centerX - (centerX - cam.right) / zoomFactor;
        cam.bottom = centerY - (centerY - cam.bottom) / zoomFactor;
        cam.top = centerY - (centerY - cam.top) / zoomFactor;
        cam.updateProjectionMatrix();

        // Derive the new axis range in full-detector pixel units.
        // The camera frustum is in world coords where the image center is at origin,
        // so camLeft = -fullWidth/2 + imageShownXmin  =>  imageShownXmin = camLeft + fullWidth/2
        const info = this.getImageInfo();
        const fullWidth = info.imageWidth * info.xBinning;
        const fullHeight = info.imageHeight * info.yBinning;
        const newXmin = cam.left + fullWidth / 2;
        const newXmax = cam.right + fullWidth / 2;
        const newYmin = cam.bottom + fullHeight / 2;
        const newYmax = cam.top + fullHeight / 2;

        const { plotRegionWidth, plotRegionHeight, xTickValues, xTickPositions, yTickValues, yTickPositions } =
            this._extractTicksInfo(newXmin, newXmax, newYmin, newYmax);

        this.setImageInfo({
            ...info,
            imageShownXmin: newXmin,
            imageShownXmax: newXmax,
            imageShownYmin: newYmin,
            imageShownYmax: newYmax,
            plotRegionWidth,
            plotRegionHeight,
            xTickValues,
            xTickPositions,
            yTickValues,
            yTickPositions,
        });

        this.renderer.render(this.scene, cam);
        this.getMainWidget().forceUpdate({});
    };

    // --------------- helpers -------------------


    /**
     * todo:
     */
    updateImage = () => {
        this.mapDbrDataWitNewData();
        this.updateCameraFrustum();
        this.getMainWidget().forceUpdate({});
    };

    /**
     * Get 1-D waveform data
     */
    getImageValue = () => {
        const mainWidget = this.getMainWidget();
        if (this.playing === false) {
            return this.imageValueBackup;
        }
        // {index: number, value: number[]}
        const choiceValue = g_widgets1.getChannelValue(mainWidget.getChannelNames()[0]) as any;

        if (typeof choiceValue === "object") {
            return choiceValue["value"];
        }
        return undefined;
    }

    /**
     * Process incoming PVA image data and populate `this.textureData` for three.js rendering.
     *
     * This method is called each time new image data arrives from the channel. It:
     * 1. Calls `updateImageInfo()` to refresh image dimensions, axis range, ticks, etc.
     * 2. Reads the raw pixel array from the channel value.
     * 3. Validates data size against the image dimensions and color mode.
     * 4. Normalizes pixel values to 0–255 using the Z-range (`zMin`/`zMax`, or auto-computed
     *    from data when `autoZ` is true).
     * 5. Applies the selected color map (for mono mode) or direct RGB mapping (for RGB modes).
     * 6. Writes the result into `this.textureData` as an 8-bit RGBA `Uint8Array`
     *    (4 bytes per pixel), which the `DataTexture` in `_ElementImage` uploads to the GPU.
     *
     * Supported color modes (from NTNDArray `ColorMode` attribute):
     * - **mono**: single-channel data, color-mapped via the selected color map function
     * - **rgb1**: interleaved `[R,G,B, R,G,B, ...]` — dimension order `[3, width, height]`
     * - **rgb2**: planar per row `[RRR...GGG...BBB...]` per row — dimension order `[width, 3, height]`
     * - **rgb3**: fully planar `[all R, all G, all B]` — dimension order `[width, height, 3]`
     */
    mapDbrDataWitNewData = () => {
        // (1)
        this.updateImageInfo();

        const { colorMode, imageWidth, imageHeight, zMin, zMax, autoZ, colorMap } = this.getImageInfo();


        if (colorMode !== NDArray_ColorMode.mono && colorMode !== NDArray_ColorMode.rgb1 && colorMode !== NDArray_ColorMode.rgb2 && colorMode !== NDArray_ColorMode.rgb3) {
            Log.error("We only support MONO, RGB1, RGB2, and RGB3 format data in Image widget");
            return;
        }

        const size = imageWidth * imageHeight;

        if (size === 0) {
            Log.error("Image size is 0");
            return;
        }

        if (this.textureData === undefined) {
            // we always plot 8-bit RGBA
            this.textureData = new Uint8Array(size * 4);
        }

        // (2)
        const dataRaw = this.getImageValue();
        if (Array.isArray(dataRaw) === false) {
            Log.error("Image data should be an array");
            return;
        }

        // (3)
        if (colorMode === NDArray_ColorMode.mono) {
            if (dataRaw.length < size) {
                Log.error("Image size smaller than dimension");
                return;
            }
        } else if (colorMode === NDArray_ColorMode.rgb1 || colorMode === NDArray_ColorMode.rgb2 || colorMode === NDArray_ColorMode.rgb3) {
            if (dataRaw.length < 3 * size) {
                Log.error("Image size smaller than dimension, ...");
                return;
            }
        }


        // (4)
        let minValue = zMin;
        let maxValue = zMax;
        if (autoZ === true && colorMode === NDArray_ColorMode.mono) {
            minValue = Math.min(...dataRaw);
            maxValue = Math.max(...dataRaw);
            // store the auto-computed Z range in imageInfo
            this.setImageInfo({ ...this.getImageInfo(), zMin: minValue, zMax: maxValue });
        }

        // (5)
        const currentColorMap = colorMap;
        let colorMapFunc = colorMapFunctions[currentColorMap];
        if (colorMapFunc === undefined) {
            colorMapFunc = grayColorMap;
        }

        // (6)
        this.generateTextureData(colorMode, size, imageWidth, dataRaw, minValue, maxValue, colorMapFunc);

        // (7) Sync ROI overlays with their PV values.
        this.getRoi().updateRoisFromPvs();
    };

    /**
     * Write normalized RGBA pixel data into `this.textureData`.
     *
     * For mono images the raw value is normalized to 0–255 and passed through
     * `colorMapFunc`.  For RGB modes the three channels are normalized directly.
     * The output is always 8-bit RGBA (4 bytes per pixel).
     */
    private generateTextureData = (
        colorMode: NDArray_ColorMode,
        size: number,
        imageWidth: number,
        dataRaw: number[],
        minValue: number,
        maxValue: number,
        colorMapFunc: (v: number) => [number, number, number],
    ) => {
        if (this.textureData === undefined) {
            return;
        }

        if (colorMode === NDArray_ColorMode.mono) {
            for (let ii = 0; ii < size; ii++) {
                const normalized = Math.max(Math.min(Math.round((dataRaw[ii] - minValue) / (maxValue - minValue) * 255)));
                const [r, g, b] = colorMapFunc(normalized);
                const idx = ii * 4;
                this.textureData[idx] = r;
                this.textureData[idx + 1] = g;
                this.textureData[idx + 2] = b;
                this.textureData[idx + 3] = 255; // opaque
            }
        } else if (colorMode === NDArray_ColorMode.rgb1) {
            for (let ii = 0; ii < size; ii++) {
                const rRaw = dataRaw[3 * ii];
                const gRaw = dataRaw[3 * ii + 1];
                const bRaw = dataRaw[3 * ii + 2];

                const rNormalized = Math.max(Math.min(Math.round((rRaw - minValue) / (maxValue - minValue) * 255), 255), 0);
                const gNormalized = Math.max(Math.min(Math.round((gRaw - minValue) / (maxValue - minValue) * 255), 255), 0);
                const bNormalized = Math.max(Math.min(Math.round((bRaw - minValue) / (maxValue - minValue) * 255), 255), 0);

                const idx = ii * 4;
                this.textureData[idx] = rNormalized;
                this.textureData[idx + 1] = gNormalized;
                this.textureData[idx + 2] = bNormalized;
                this.textureData[idx + 3] = 255; // opaque
            }
        } else if (colorMode === NDArray_ColorMode.rgb2) {
            for (let ii = 0; ii < size; ii++) {
                // i, j coordiate of pixel
                const j = ii % imageWidth;
                const i = (ii - j) / imageWidth;

                const rRaw = dataRaw[3 * i * imageWidth + j];
                const gRaw = dataRaw[3 * i * imageWidth + j + imageWidth];
                const bRaw = dataRaw[3 * i * imageWidth + j + 2 * imageWidth];

                const rNormalized = Math.max(Math.min(Math.round((rRaw - minValue) / (maxValue - minValue) * 255)));
                const gNormalized = Math.max(Math.min(Math.round((gRaw - minValue) / (maxValue - minValue) * 255)));
                const bNormalized = Math.max(Math.min(Math.round((bRaw - minValue) / (maxValue - minValue) * 255)));

                const idx = ii * 4;
                this.textureData[idx] = rNormalized;
                this.textureData[idx + 1] = gNormalized;
                this.textureData[idx + 2] = bNormalized;
                this.textureData[idx + 3] = 255; // opaque
            }
        } else if (colorMode === NDArray_ColorMode.rgb3) {
            for (let ii = 0; ii < size; ii++) {
                const rRaw = dataRaw[ii];
                const gRaw = dataRaw[size + ii];
                const bRaw = dataRaw[size * 2 + ii];

                const rNormalized = Math.max(Math.min(Math.round((rRaw - minValue) / (maxValue - minValue) * 255)));
                const gNormalized = Math.max(Math.min(Math.round((gRaw - minValue) / (maxValue - minValue) * 255)));
                const bNormalized = Math.max(Math.min(Math.round((bRaw - minValue) / (maxValue - minValue) * 255)));

                const idx = ii * 4;
                this.textureData[idx] = rNormalized;
                this.textureData[idx + 1] = gNormalized;
                this.textureData[idx + 2] = bNormalized;
                this.textureData[idx + 3] = 255; // opaque
            }
        }
    };

    /**
     * Updates the OrthographicCamera
     * frustum from the current `imageInfo` and re-renders without tearing down
     * or recreating the Scene, WebGLRenderer, Mesh, Geometry, or DataTexture.
     *
     * Use for view changes (XY-range edits, zoom-to-full, Z-range / autoZ
     * changes) that do NOT alter image dimensions.  Reserve `resetImage()`
     * for cases where the underlying image size actually changes.
     */
    updateCameraFrustum = () => {
        if (!this.camera || !this.renderer || !this.scene) {
            return;
        }
        const { imageShownXmin, imageShownXmax, imageShownYmin, imageShownYmax,
            imageWidth, imageHeight, xBinning, yBinning } = this.getImageInfo();

        // Full detector dimensions
        const fullWidth = imageWidth * xBinning;
        const fullHeight = imageHeight * yBinning;

        let xMin = imageShownXmin;
        let xMax = imageShownXmax;
        if (xMax < xMin) { const tmp = xMax; xMax = xMin; xMin = tmp; }

        let yMin = imageShownYmin;
        let yMax = imageShownYmax;
        if (yMax < yMin) { const tmp = yMax; yMax = yMin; yMin = tmp; }

        this.camera.left = -fullWidth / 2 + xMin;
        this.camera.right = -fullWidth / 2 + xMax;
        this.camera.bottom = -fullHeight / 2 + yMin;
        this.camera.top = -fullHeight / 2 + yMax;
        this.camera.updateProjectionMatrix();

        if (this.texture) {
            this.texture.needsUpdate = true;
        }

        this.renderer.render(this.scene, this.camera);
    };

    // ---------------------- image info ---------------------

    /**
     * read image pva data, obtain the width, height, color mode, and pixel depth (in unit of bit) for this image
     */
    extractImageInfo = (): { imageWidth: number, imageHeight: number, colorMode: NDArray_ColorMode, pixelDepth: number, xBinning: number, yBinning: number } => {
        const mainWidget = this.getMainWidget();
        if (this.playing === false) {
            return this.imageDimensionsBackup;
        }

        try {
            const channel = g_widgets1.getTcaChannel(mainWidget.getChannelNames()[0]);
            const dbrData = channel.getDbrData();
            if (dbrData !== undefined) {
                const dimension = dbrData["dimension"];
                const attribute = dbrData["attribute"];
                const valueObj = dbrData["value"] as any as { value: any, index: number };

                const valueIndex = valueObj["index"];
                let pixelDepth = 0; // 8-bit

                if (valueIndex === 0) {
                    // boolean[] for value
                    pixelDepth = 1;
                } else if (valueIndex === 1 || valueIndex === 5) {
                    // byte[] or ubyte[], 8-bit
                    pixelDepth = 8;
                } else if (valueIndex === 2 || valueIndex === 6) {
                    // short[] or ushort[], 16-bit
                    pixelDepth = 16;
                } else if (valueIndex === 3 || valueIndex === 7) {
                    // int[] or uint[], 32-bit
                    pixelDepth = 32;
                } else if (valueIndex === 4 || valueIndex === 8) {
                    // long[] or ulong, 64-bit
                    pixelDepth = 64;
                } else if (valueIndex === 9 || valueIndex === 10) {
                    // float[] or double[]
                    pixelDepth = 8;
                }


                if (dimension !== undefined && dimension.length >= 2) {
                    const dimension0 = dimension[0];
                    const dimension1 = dimension[1];
                    const dimension2 = dimension[2];

                    // Extract binning info from dimension descriptors (default 1 = no binning)
                    const xBinning = typeof dimension0["binning"] === "number" ? dimension0["binning"] : 1;
                    const yBinning = typeof dimension1["binning"] === "number" ? dimension1["binning"] : 1;

                    // get color mode, default mono
                    let colorMode = NDArray_ColorMode.mono;
                    if (Array.isArray(attribute) && attribute.length >= 1) {
                        const valueObj = attribute[0]["value"];
                        if (valueObj !== undefined) {
                            const colorModeValue = valueObj["value"];
                            if (colorModeValue !== undefined && NDArray_ColorMode[colorModeValue] !== undefined) {
                                colorMode = colorModeValue;
                            }
                        }
                    }


                    if (colorMode === NDArray_ColorMode.mono) {
                        // mono color
                        if (typeof dimension0["size"] === "number" && typeof dimension1["size"] === "number") {
                            return {
                                imageWidth: dimension0["size"],
                                imageHeight: dimension1["size"],
                                colorMode: colorMode,
                                pixelDepth: pixelDepth,
                                xBinning,
                                yBinning,
                            };
                        }
                    } else if (colorMode === NDArray_ColorMode.rgb1) {
                        if (typeof dimension2["size"] === "number" && typeof dimension1["size"] === "number") {
                            return {
                                imageWidth: dimension[1]["size"],
                                imageHeight: dimension[2]["size"],
                                colorMode: colorMode,
                                pixelDepth: pixelDepth,
                                xBinning,
                                yBinning,
                            };
                        }

                    } else if (colorMode === NDArray_ColorMode.rgb2) {
                        if (typeof dimension0["size"] === "number" && typeof dimension2["size"] === "number") {
                            return {
                                imageWidth: dimension[0]["size"],
                                imageHeight: dimension[2]["size"],
                                colorMode: colorMode,
                                pixelDepth: pixelDepth,
                                xBinning,
                                yBinning,
                            };
                        }

                    } else if (colorMode === NDArray_ColorMode.rgb3) {
                        if (typeof dimension0["size"] === "number" && typeof dimension1["size"] === "number") {
                            return {
                                imageWidth: dimension[0]["size"],
                                imageHeight: dimension[1]["size"],
                                colorMode: colorMode,
                                pixelDepth: pixelDepth,
                                xBinning,
                                yBinning,
                            };
                        }
                    }

                }
            }
        } catch (e) {
            Log.error("Image getImageDimensions error: ", e);
        }
        return { imageWidth: 255, imageHeight: 255, colorMode: NDArray_ColorMode.mono, pixelDepth: 16, xBinning: 1, yBinning: 1 };
    }


    private _extractTicksInfo = (xValMin: number, xValMax: number, yValMin: number, yValMax: number) => {
        const scale = "Linear";


        const plotRegionWidth = this.getPlotWidth();
        const plotRegionHeight = this.getPlotHeight();
        // fixed numbers
        const numXgrid = 5;
        const numYgrid = 5;


        const xTickValues = GlobalMethods.calcTicks(xValMin, xValMax, numXgrid + 1, { scale: scale });
        const xTickPositions = GlobalMethods.calcTickPositions(xTickValues, xValMin, xValMax, plotRegionWidth, { scale: scale }, "horizontal");
        const yTickValues = GlobalMethods.calcTicks(yValMin, yValMax, numYgrid + 1, { scale: scale });
        const yTickPositions = GlobalMethods.calcTickPositions(yTickValues, yValMin, yValMax, plotRegionHeight, { scale: scale }, "vertical");
        return {
            plotRegionWidth,
            plotRegionHeight,
            xTickValues,
            xTickPositions,
            yTickValues,
            yTickPositions,
        };
    }

    updateImageInfo = () => {

        const allStyle = this.getMainWidget().getAllStyle();
        
        const width = allStyle["width"];
        const height = allStyle["height"];
        this._imageInfo.plotRegionWidth = width - yAxisLabelWidth - yAxisTickWidth - colorbarWidth;
        this._imageInfo.plotRegionHeight = height - xAxisLabelHeight - xAxisTickHeight - toolbarHeight;

        const { imageWidth, imageHeight, colorMode, pixelDepth, xBinning, yBinning } = this.extractImageInfo();

        const currentInfo = this.getImageInfo();
        const imageShownXmin = currentInfo.imageShownXmin;
        const imageShownXmax = currentInfo.imageShownXmax;
        const imageShownYmin = currentInfo.imageShownYmin;
        const imageShownYmax = currentInfo.imageShownYmax;

        const { xTickValues, xTickPositions, yTickValues, yTickPositions, } = this._extractTicksInfo(imageShownXmin, imageShownXmax, imageShownYmin, imageShownYmax);
        // Clamp: if either dimension is non-positive, zero both out.
        let plotRegionWidth = this.getPlotWidth();
        let plotRegionHeight = this.getPlotHeight();
        if (plotRegionWidth <= 0 || plotRegionHeight <= 0) {
            plotRegionWidth = 0;
            plotRegionHeight = 0;
        }
        this.setImageInfo({
            imageShownXmin,
            imageShownXmax,
            imageShownYmin,
            imageShownYmax,
            plotRegionWidth,
            plotRegionHeight,
            xTickValues,
            xTickPositions,
            yTickValues,
            yTickPositions,
            imageWidth,
            imageHeight,
            colorMode,
            pixelDepth,
            xBinning,
            yBinning,
            zMin: this.getImageInfo().zMin,
            zMax: this.getImageInfo().zMax,
            autoZ: this.getImageInfo().autoZ,
            colorMap: this.getImageInfo().colorMap,
        });
    }


    /**
     * Tear down three.js objects so the next render cycle (fun1) will
     * recreate them in the current DOM.  Call this when the React tree
     * is remounted (e.g. editing ↔ operating mode switch).
     */
    resetScene = () => {
        if (this.renderer) {
            // Remove the canvas element from the DOM before disposing
            // to prevent ghost canvases on mode switches.
            const canvas = this.renderer.domElement;
            if (canvas.parentNode) {
                canvas.parentNode.removeChild(canvas);
            }
            this.renderer.dispose();
        }
        this.texture = undefined;
        this.renderer = undefined;
        this.scene = undefined;
        this.camera = undefined;
        this.textureData = undefined;
        this.mountRef = undefined;
    };

    // ------------------ getters --------------------

    /**
     * Get the image area (plot) width in screen (CSS) pixels.
     */
    getPlotWidth = () => {
        return this._imageInfo.plotRegionWidth;
    }

    /**
     * Get the image area (plot) height in screen (CSS) pixels.
     */
    getPlotHeight = () => {
        return this._imageInfo.plotRegionHeight;
    }


    getImageInfo = () => {
        return this._imageInfo;
    }

    setImageInfo = (newInfo: type_Image_info) => {
        this._imageInfo = newInfo;
    }

    getMainWidget = () => {
        return this._mainWidget;
    }

    getConfigPage = () => {
        return this._configPage;
    }

    getRoi = () => {
        return this._roi;
    }

    getElement = () => {
        return <this._Element></this._Element>
    }
}