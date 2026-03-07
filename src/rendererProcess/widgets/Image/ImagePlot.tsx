import * as GlobalMethods from "../../../common/GlobalMethods";
import * as React from "react";
import { colorbarWidth, Image, toolbarHeight, xAxisLabelHeight, xAxisTickHeight, yAxisLabelWidth, yAxisTickWidth } from "./Image";
import { g_widgets1 } from "../../global/GlobalVariables";
import { Scale } from "../../helperWidgets/SharedElements/Scale";
import { DataTexture, Mesh, MeshBasicMaterial, NearestFilter, OrthographicCamera, PlaneGeometry, RGBAFormat, Scene, SRGBColorSpace, UnsignedByteType, WebGLRenderer } from "three";
import { NDArray_ColorMode } from "../../../common/GlobalVariables";
import { Log } from "../../../common/Log";
import { colorMapFunctions, grayColorMap } from "./ImageColorMaps";


export type type_Image_info = {
    imageShownXmin: number, // X min of the image shown, in unit of image pixel, it could be larger or smaller than the image size
    imageShownXmax: number,
    imageShownYmin: number,
    imageShownYmax: number,
    plotRegionWidth: number, // todo: more precise meaning
    plotRegionHeight: number,
    xLength: number, // plot region width in unit of screen pixel
    yLength: number, 
    xTickValues: number[], // x ticks values, it indicates the image pixel number
    xTickPositions: number[], // x ticks positions, it is the position in unit of screen pixel
    yTickValues: number[],
    yTickPositions: number[],
    imageWidth: number, // image width in unit of image pixel
    imageHeight: number,
    colorMode: NDArray_ColorMode, // image color mode
    pixelDepth: number, // image pixel depth in bit
};

export const defaultImageInfo: type_Image_info = {
    imageShownXmin: 0,
    imageShownXmax: 100,
    imageShownYmin: 0,
    imageShownYmax: 100,
    plotRegionWidth: 0,
    plotRegionHeight: 0,
    xLength: 10,
    yLength: 10,
    xTickValues: [],
    xTickPositions: [],
    yTickValues: [],
    yTickPositions: [],
    imageWidth: 0,
    imageHeight: 0,
    colorMode: NDArray_ColorMode.mono,
    pixelDepth: 0,
}

export class ImagePlot {
    private readonly _mainWidget: Image;

    // plot
    _plotWidth: number;
    _plotHeight: number;
    lastCursorPointXY: [number, number] = [-100000, -100000];

    private _imageInfo: type_Image_info;


    constructor(mainWidget: Image) {
        this._mainWidget = mainWidget;
        const style = this.getMainWidget().getStyle();
        this._plotWidth = style.width - yAxisLabelWidth - yAxisTickWidth - colorbarWidth;
        this._plotHeight = style.height - xAxisLabelHeight - xAxisTickHeight - toolbarHeight;
        this._imageInfo = structuredClone(defaultImageInfo);
    }

    _Element = () => {

        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "inline-flex",
                    flexDirection: "column",
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
                    <this._ElementColorbar />
                </div>
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
                    <this._ElementBlankArea></this._ElementBlankArea>
                    <div
                        style={{
                            display: "inline-flex",
                            flexDirection: "column",
                        }}
                    >
                        <this._ElementXTicks></this._ElementXTicks>
                        <this._ElementXLabel></this._ElementXLabel>
                    </div>
                </div>
                <this._ElementControls></this._ElementControls>
            </div>
        )
    }

    getElement = () => {
        return <this._Element></this._Element>
    }

    _ElementControls = () => {

        return (
            <div
                style={{
                    width: "100%",
                    height: toolbarHeight,
                }}
            >

            </div>
        )
    }

    _ElementBlankArea = () => {
        return (
            <div
                style={{
                    display: "inline-flex",
                    width: yAxisLabelWidth + yAxisTickWidth,
                    height: xAxisLabelHeight + xAxisTickHeight,
                }}
            >
                BLANK
            </div>
        )
    }

    _ElementImage0 = () => {
        return (
            <div
                style={{
                    width: this.getPlotWidth(),
                    height: this.getPlotHeight(),
                    display: "inline-flex",
                }}
            >
                IMAGE
            </div>
        )
    }
    texture: DataTexture | undefined = undefined;
    renderer: WebGLRenderer | undefined = undefined;
    scene: Scene | undefined = undefined;
    camera: OrthographicCamera | undefined = undefined;
    textureData: Uint8Array | undefined = undefined;
    forceUpdateImage = (input: any) => { };
    mountRef: any = undefined;
    zoomLevel: number = 1;
    autoXY: boolean = false;

    _ElementImage = () => {

        console.log("process =========================")
        const { imageWidth, imageHeight, imageShownXmin, imageShownXmax, imageShownYmin, imageShownYmax } = this.getImageInfo();

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

            // processData();
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

            // texture.encoding = THREE.sRGBEncoding;



            const scene = new Scene();

            // xy view range
            let xMax = imageShownXmax;
            let xMin = imageShownXmin;
            if (xMax < xMin) {
                const tmp = xMax;
                xMax = xMin;
                xMin = tmp;
            }


            const camLeft = -imageWidth / 2 + xMin;
            const camRight = -imageWidth / 2 + xMax;

            let yMax = imageShownYmax;
            let yMin = imageShownYmin;
            if (yMax < yMin) {
                const tmp = yMax;
                yMax = yMin;
                yMin = tmp;
            }

            const camBottom = -imageHeight / 2 + yMin;
            const camTop = -imageHeight / 2 + yMax;

            const camera = new OrthographicCamera(
                camLeft,
                camRight,
                camTop,
                camBottom,
                // -width / 2 / zoom,
                // width / 2 / zoom,
                // height / 2 / zoom,
                // -height / 2 / zoom,
                0.1,
                10
            );

            camera.position.z = 5;
            camera.lookAt(0, 0, 0);

            const renderer = new WebGLRenderer({ alpha: true });

            // the image area, outside of this area is blank
            // this.calcImageSize();
            renderer.setSize(imageWidth, imageHeight);
            mountRef.current!.appendChild(renderer.domElement);

            const geometry = new PlaneGeometry(imageWidth, imageHeight);
            const material = new MeshBasicMaterial({ map: texture, color: 0xffffff });
            const plane = new Mesh(geometry, material);
            scene.add(plane);

            material.transparent = true;
            material.premultipliedAlpha = true;  // if your data has alpha


            renderer.render(scene, camera);
            // console.log("recreate stuff");
            this.texture = texture;
            this.renderer = renderer;
            this.camera = camera;
            this.scene = scene;
            this.autoXY = false;
        };

        const fun2 = () => {
            // console.log("fun2 running");
            if (!this.texture || !this.renderer || !this.scene || !this.camera) {
                return;
            }
            // console.log("fun2 running A");
            // if (this.playing === true) {
            // processData();
            // }

            // update cursor readout
            // todo: isolate
            // if (this.lastMouesPositions[0] > -10000) {
            //     this.handleMouseMoveOnImage(...this.lastMouesPositions);
            // }


            // console.log("fun2 running B");
            this.texture.needsUpdate = true; // upload changes to GPU
            this.texture.generateMipmaps = false;
            // this.texture.minFilter = LinearFilter; // No mipmaps, direct filtering
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
                    width: imageWidth,
                    height: imageHeight,
                }}

                onMouseDown={(event) => {
                    // todo: pan, isolate
                    // if (event.button !== 0) {
                    //     return;
                    // }
                    // window.addEventListener("mousemove", this.panImageEventListener);
                    // window.addEventListener("mouseup", this.cancelPanImageEventListener);
                }}

                onMouseMove={() => {
                    // todo: isolate
                    // // event.stopPropagation();
                    // if (this.renderer === undefined || this.camera === undefined) {
                    //     return;
                    // }
                    // this.lastMouesPositions = [event.clientX, event.clientY];
                    // this.handleMouseMoveOnImage(event.clientX, event.clientY);
                }}

                onMouseLeave={() => {
                    // todo: isolate
                    // this.lastMouesPositions = [-10000, -10000];
                    // // this.setXyzCursorValues((oldValues: any) => {
                    // //     return [-10000, -10000, -10000];
                    // // })
                }}

                onWheel={(event) => {
                    // todo: isolate
                    // event.preventDefault();

                    // const zoomFactor = event.deltaY < 0 ? 1.1 : 1 / 1.1;

                    // if (!this.camera || !mountRef.current) return;

                    // const rect = mountRef.current.getBoundingClientRect();

                    // // Mouse position in NDC (-1 to +1)
                    // const ndcX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
                    // const ndcY = -((event.clientY - rect.top) / rect.height) * 2 + 1;

                    // // Convert NDC → world coordinates
                    // const mouseWorld = new Vector3(ndcX, ndcY, 0);
                    // mouseWorld.unproject(this.camera);

                    // this.zoomImage(zoomFactor, mouseWorld.x, mouseWorld.y);
                }}

            >
                abcd
            </div>
        );
    };

    _ElementColorbar = () => {
        return (
            <div
                style={{
                    width: colorbarWidth,
                    height: this.getPlotHeight(),
                    display: "inline-flex",
                }}
            >
                COLOR BAR
            </div>
        )
    }



    mapDbrDataWitNewData = () => {
        // pixelDepth is not used in displaying data
        this.updateImageInfo();

        const allText = this.getMainWidget().getAllText();
        const { colorMode, imageWidth, imageHeight } = this.getImageInfo();
        const zMin = allText["zMin"];
        const zMax = allText["zMax"];
        const autoZ = allText["autoZ"];
        const colorMap = allText["colorMap"];


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

        const dataRaw = this.getImageValue();
        // console.log(width, height, colorMode, dataRaw.length)
        if (Array.isArray(dataRaw) === false) {
            Log.error("Image data should be an array");
            return;
        }

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

        // if (changeGeometry) {
        //     // image dimension on screen
        //     // this.calcImageSize();
        // }

        // color
        let minValue = zMin;
        let maxValue = zMax;
        if (autoZ === true && colorMode === NDArray_ColorMode.mono) {
            minValue = Math.min(...dataRaw);
            maxValue = Math.max(...dataRaw);
        }

        // this.zMax = maxValue;
        // this.zMin = minValue;

        const currentColorMap = colorMap;
        let colorMapFunc = colorMapFunctions[currentColorMap];
        if (colorMapFunc === undefined) {
            colorMapFunc = grayColorMap;
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
        } else {

        }
    };

    _ElementXLabel = () => {

        if (g_widgets1.isEditing()) {
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
            )
        }

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

        if (g_widgets1.isEditing()) {
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
                </div>
            );
        }


        const {
            imageShownXmin,
            imageShownXmax,
            imageShownYmin,
            imageShownYmax,
            xLength,
            yLength,
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
                    showTicks={false}
                    showLabels={true}
                    showAxis={false}
                >
                </Scale>
            </div>
        )
    };

    _ElementYLabel = () => {

        if (g_widgets1.isEditing()) {
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
                    Y
                </div>
            );
        }

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

        if (g_widgets1.isEditing()) {
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
            );
        }

        const {
            imageShownXmin,
            imageShownXmax,
            imageShownYmin,
            imageShownYmax,
            xLength,
            yLength,
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
                    showTicks={false}
                    showLabels={true}
                    showAxis={false}
                >
                </Scale>
            </div>
        )
    };

    // --------------- helpers -------------------

    private _updatePlotWidthHeight = () => {
        const allStyle = this.getMainWidget().getAllStyle();
        const width = allStyle["width"];
        const height = allStyle["height"];
        const plotWidth = width - yAxisLabelWidth - yAxisTickWidth - colorbarWidth;
        const plotHeight = height - xAxisLabelHeight - xAxisTickHeight - toolbarHeight;
        this.setPlotWidth(plotWidth);
        this.setPlotHeight(plotHeight);
    }

    /**
     * read image pva data, obtain the width, height, color mode, and pixel depth (in unit of bit) for this image
     */
    private _extractImageInfo = (): { imageWidth: number, imageHeight: number, colorMode: NDArray_ColorMode, pixelDepth: number } => {
        const mainWidget = this.getMainWidget();
        if (mainWidget.playing === false) {
            return mainWidget.imageDimensionsBackup;
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
                                pixelDepth: pixelDepth
                            };
                        }
                    } else if (colorMode === NDArray_ColorMode.rgb1) {
                        if (typeof dimension2["size"] === "number" && typeof dimension1["size"] === "number") {
                            return {
                                imageWidth: dimension[1]["size"],
                                imageHeight: dimension[2]["size"],
                                colorMode: colorMode,
                                pixelDepth: pixelDepth
                            };
                        }

                    } else if (colorMode === NDArray_ColorMode.rgb2) {
                        if (typeof dimension0["size"] === "number" && typeof dimension2["size"] === "number") {
                            return {
                                imageWidth: dimension[0]["size"],
                                imageHeight: dimension[2]["size"],
                                colorMode: colorMode,
                                pixelDepth: pixelDepth
                            };
                        }

                    } else if (colorMode === NDArray_ColorMode.rgb3) {
                        if (typeof dimension0["size"] === "number" && typeof dimension1["size"] === "number") {
                            return {
                                imageWidth: dimension[0]["size"],
                                imageHeight: dimension[1]["size"],
                                colorMode: colorMode,
                                pixelDepth: pixelDepth
                            };
                        }
                    }

                }
            }
        } catch (e) {
            Log.error("Image getImageDimensions error: ", e);
        }
        return { imageWidth: 0, imageHeight: 0, colorMode: NDArray_ColorMode.mono, pixelDepth: 0 };
    }


    private _extractTicksInfo = (xValMin: number, xValMax: number, yValMin: number, yValMax: number) => {
        const scale = "Linear";


        const xLength = this.getPlotWidth();
        const yLength = this.getPlotHeight();
        // fixed numbers
        const numXgrid = 5;
        const numYgrid = 5;


        const xTickValues = GlobalMethods.calcTicks(xValMin, xValMax, numXgrid + 1, { scale: scale });
        const xTickPositions = GlobalMethods.calcTickPositions(xTickValues, xValMin, xValMax, xLength, { scale: scale }, "horizontal");
        const yTickValues = GlobalMethods.calcTicks(yValMin, yValMax, numYgrid + 1, { scale: scale });
        const yTickPositions = GlobalMethods.calcTickPositions(yTickValues, yValMin, yValMax, yLength, { scale: scale }, "vertical");
        return {
            // xValMin,
            // xValMax,
            // yValMin,
            // yValMax,
            xLength,
            yLength,
            xTickValues,
            xTickPositions,
            yTickValues,
            yTickPositions,
        };
    }

    /**
     * Computer the image plot size in unit of screen pixels
     * 
     * the image may be smaller than the plot region depending on the aspect ration of the image and the plot region
     *
     */
    private _calcPlotRegionSize = () => {
        const {imageShownXmin, imageShownXmax, imageShownYmin, imageShownYmax} = this.getImageInfo();
        const xMin = imageShownXmin;
        const xMax = imageShownXmax;
        const yMin = imageShownYmin;
        const yMax = imageShownYmax;
        const width = xMax - xMin;
        const height = yMax - yMin;

        if (width === 0 || height === 0) {
            // return [5, 5];
            // this.imageSize = [0, 0];
            return [0, 0];
        }
        const containerWidth = this.getPlotWidth();
        const containerHeight = this.getPlotHeight();
        if (containerHeight <= 0 || containerWidth <= 0) {
            // return [5, 5];
            return [0, 0];
        }
        let result: [number, number] = [0, 0];
        if (containerWidth / containerHeight > width / height) {
            result = [containerHeight * width / height, containerHeight];
        } else {
            result = [containerWidth, containerWidth * height / width];

        }
        return result;
    }

    updateImageInfo = () => {

        this._updatePlotWidthHeight();

        const { imageWidth, imageHeight, colorMode, pixelDepth } = this._extractImageInfo();

        const allText = this.getMainWidget().getAllText();
        let imageShownXmin = this.autoXY === true ? 0 : allText["xMin"];
        let imageShownXmax = this.autoXY === true ? 0 : allText["xMax"];
        let imageShownYmin = this.autoXY === true ? 0 : allText["yMin"];
        let imageShownYmax = this.autoXY === true ? 0 : allText["yMax"];

        const { xLength, yLength, xTickValues, xTickPositions, yTickValues, yTickPositions, } = this._extractTicksInfo(imageShownXmin, imageShownXmax, imageShownYmin, imageShownYmax);
        const [plotRegionWidth, plotRegionHeight] = this._calcPlotRegionSize();
        this.setImageInfo({
            imageShownXmin,
            imageShownXmax,
            imageShownYmin,
            imageShownYmax,
            plotRegionWidth,
            plotRegionHeight,
            xLength,
            yLength,
            xTickValues,
            xTickPositions,
            yTickValues,
            yTickPositions,
            imageWidth,
            imageHeight,
            colorMode,
            pixelDepth,
        });
    }

    /**
     * Get 1-D waveform data
     */
    getImageValue = () => {
        const mainWidget = this.getMainWidget();
        if (mainWidget.playing === false) {
            return mainWidget.imageValueBackup;
        }
        // {index: number, value: number[]}
        const choiceValue = g_widgets1.getChannelValue(mainWidget.getChannelNames()[0]) as any;

        if (typeof choiceValue === "object") {
            return choiceValue["value"];
        }
        return undefined;
    }

    // ------------------ getters --------------------

    /**
     * get the image area (plot) width
     */
    getPlotWidth = () => {
        return this._plotWidth;
    }

    getPlotHeight = () => {
        return this._plotHeight;
    }

    setPlotWidth = (newWidth: number) => {
        this._plotWidth = newWidth;
    }

    setPlotHeight = (newHeight: number) => {
        this._plotHeight = newHeight;
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
}