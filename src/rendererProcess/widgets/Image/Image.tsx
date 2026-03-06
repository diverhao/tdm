import * as React from "react";
import { MouseEvent } from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { NDArray_ColorMode } from "../../../common/GlobalVariables";
import { ImageSidebar } from "./ImageSidebar";
import * as GlobalMethods from "../../../common/GlobalMethods";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary"
import { Log } from "../../../common/Log";
import { OrthographicCamera, Scene, WebGLRenderer, Vector3, Vector2, DataTexture, UnsignedByteType, RGBAFormat, SRGBColorSpace, NearestFilter, MeshBasicMaterial, Mesh, Raycaster, PlaneGeometry } from "three";
import { type_Image_tdl, defaultImageTdl } from "../../../common/types/type_widget_tdl";
import { colorMapFunctions, grayColorMap } from "./ImageColorMaps";
import { ElementXAxis, ElementYAxis } from "./ImageAxes";
import { ElementColorMap } from "./ImageColorMapUi";
import { ElementRoi, resizeRoiTopHandler, resizeRoiTopHandlerMouseUp, resizeRoiBottomHandler, resizeRoiBottomHandlerMouseUp, resizeRoiLeftHandler, resizeRoiLeftHandlerMouseUp, resizeRoiRightHandler, resizeRoiRightHandlerMouseUp } from "./ImageRoi";
import { ElementConfigPage, ElementConfigBar } from "./ImageConfigPage";

// NT ND Array type
// const type = {
//     typeIndex: '0x80',
//     id: 256,
//     name: 'epics:nt/NTNDArray:1.0',
//     fields: {
//         value: {
//             typeIndex: '0x81',
//             id: 512,
//             name: '',
//             fields: {
//                 booleanValue: { typeIndex: '0x8' },
//                 byteValue: { typeIndex: '0x28' },
//                 shortValue: { typeIndex: '0x29' },
//                 intValue: { typeIndex: '0x2a' },
//                 longValue: { typeIndex: '0x2b' },
//                 ubyteValue: { typeIndex: '0x2c' },
//                 ushortValue: { typeIndex: '0x2d' },
//                 uintValue: { typeIndex: '0x2e' },
//                 ulongValue: { typeIndex: '0x2f' },
//                 floatValue: { typeIndex: '0x4a' },
//                 doubleValue: { typeIndex: '0x4b' }
//             }
//         },
//         codec: {
//             typeIndex: '0x80',
//             id: 768,
//             name: 'codec_t',
//             fields: {
//                 name: { typeIndex: '0x60' },
//                 parameters: { typeIndex: '0x82', id: 1024 }
//             }
//         },
//         compressedSize: { typeIndex: '0x23' },
//         uncompressedSize: { typeIndex: '0x23' },
//         dimension: {
//             typeIndex: '0x88',
//             id: 1280,
//             name: 'dimension_t',
//             fields: {
//                 size: { typeIndex: '0x22' },
//                 offset: { typeIndex: '0x22' },
//                 fullSize: { typeIndex: '0x22' },
//                 binning: { typeIndex: '0x22' },
//                 reverse: { typeIndex: '0x0' }
//             },
//             elementId: 1536
//         },
//         uniqueId: { typeIndex: '0x22' },
//         dataTimeStamp: {
//             typeIndex: '0x80',
//             id: 1792,
//             name: 'time_t',
//             fields: {
//                 secondsPastEpoch: { typeIndex: '0x23' },
//                 nanoseconds: { typeIndex: '0x22' },
//                 userTag: { typeIndex: '0x22' }
//             }
//         },
//         attribute: {
//             typeIndex: '0x88',
//             id: 2048,
//             name: 'epics:nt/NTAttribute:1.0',
//             fields: {
//                 name: { typeIndex: '0x60' },
//                 value: { typeIndex: '0x82', id: 1024 },
//                 descriptor: { typeIndex: '0x60' },
//                 sourceType: { typeIndex: '0x22' },
//                 source: { typeIndex: '0x60' }
//             },
//             elementId: 2304
//         },
//         timeStamp: {
//             typeIndex: '0x80',
//             id: 1792,
//             name: 'time_t',
//             fields: {
//                 secondsPastEpoch: { typeIndex: '0x23' },
//                 nanoseconds: { typeIndex: '0x22' },
//                 userTag: { typeIndex: '0x22' }
//             }
//         }
//     }
// };


export class Image extends BaseWidget {

    // _rules: BaseWidgetRules;
    axisWidth: number = 40;
    configHeight: number = 20;
    autoXY: boolean = true;
    private _regionOfInterest: {
        xPv: string;
        yPv: string;
        widthPv: string;
        heightPv: string;
        color: string;
    }[] = [];

    getRegionsOfInterest = () => {
        return this._regionOfInterest;
    };

    constructor(widgetTdl: type_Image_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this.setReadWriteType("write");

        this._regionOfInterest = structuredClone(widgetTdl.regionsOfInterest);

        // this._rules = new BaseWidgetRules(this, widgetTdl, ImageRule);

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
            <ErrorBoundary style={this.getStyle()} widgetKey={this.getWidgetKey()} >
                <>
                    {
                        // skip _ElementBody in operating mode
                        // the re-render efficiency can be improved by 10% by doing this
                        // this technique is used on a few most re-rendered widgets, like TextUpdate and TextEntry
                        g_widgets1.isEditing()
                            ?
                            <>
                                <this._ElementBody></this._ElementBody>
                                {this.showSidebar() ? this._sidebar?.getElement() : null}
                            </>
                            :
                            <this._ElementArea></this._ElementArea>

                    }
                </>
            </ErrorBoundary>
        );
    };


    getElementFallbackFunction = () => {
        return this._ElementFallback;
    }

    // Text area and resizers
    _ElementBodyRaw = (): React.JSX.Element => {
        return (
            // always update the div below no matter the TextUpdateBody is .memo or not
            // TextUpdateResizer does not update if it is .memo
            <div style={{
                ...this.getElementBodyRawStyle(),
                // outline: this._getElementAreaRawOutlineStyle(),
            }}>
                <this._ElementArea></this._ElementArea>
                {this.showResizers() ? <this._ElementResizer /> : null}
            </div>
        );
    };

    // only shows the text, all other style properties are held by upper level _ElementBodyRaw
    forceUpdate = (input: any) => { };
    _ElementAreaRaw = (): React.JSX.Element => {
        const [, forceUpdate] = React.useState({});
        this.forceUpdate = forceUpdate;

        const allStyle = this.getAllStyle();
        const allText = this.getAllText();
        let style: React.CSSProperties = {};
        if (g_widgets1.isEditing()) {
            style = {
                display: this.getAllStyle()["display"],
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                userSelect: "none",
                overflow: "hidden",
                whiteSpace: allText.wrapWord ? "normal" : "pre",
                justifyContent: allText.horizontalAlign,
                alignItems: allText.verticalAlign,
                fontFamily: allStyle.fontFamily,
                fontSize: allStyle.fontSize,
                fontStyle: allStyle.fontStyle,
                fontWeight: allStyle.fontWeight,
                outline: this._getElementAreaRawOutlineStyle(),
                color: allStyle["color"],
                opacity: 1,
                // opacity: this.getAllText()["invisibleInOperation"] === true && !g_widgets1.isEditing() ? 0 : 1,

            } as React.CSSProperties;
        } else {
            style = {
                // position: "relative",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                userSelect: "none",
                overflow: "hidden",
                whiteSpace: allText.wrapWord ? "normal" : "pre",
                justifyContent: allText.horizontalAlign,
                alignItems: allText.verticalAlign,
                fontFamily: allStyle.fontFamily,
                fontSize: allStyle.fontSize,
                fontStyle: allStyle.fontStyle,
                fontWeight: allStyle.fontWeight,
                // color: allStyle["color"],
                ...this.getElementBodyRawStyle(),
                // display: "inline-flex",
                display: this.getAllStyle()["display"],
                backgroundColor: this.getAllText()["invisibleInOperation"] ? "rgba(0,0,0,0)" : this._getElementAreaRawBackgroundStyle(),
                outline: this._getElementAreaRawOutlineStyle(),
                // opacity: this.getAllText()["invisibleInOperation"] === true && !g_widgets1.isEditing() ? 0 : 1,
                color: this.getAllText()["invisibleInOperation"] === true && !g_widgets1.isEditing() ? "rgba(0,0,0,0)" : this._getElementAreaRawTextStyle(),
            } as React.CSSProperties;
        }


        return (
            <div
                style={{ ...style, alignItems: "flex-end" }}
                onMouseDown={(event) => {
                    this._handleMouseDown(event);
                    if (this.showConfigPage === true) {
                        this.showConfigPage = false;
                        this.forceUpdate({});
                    }

                }}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                <this._ElementImageContainer />
                <ElementColorMap image={this} />

                {this.showConfigPage === true ? <ElementConfigPage image={this} /> : null}
            </div>
        );
    };

    showConfigPage: boolean = false;
    colorMapWidth: number = 50;
    setHintText = (input: string) => { };
    setXyzCursorValues = (input: any) => { };
    getXmin = () => {
        const { width, height } = this.getImageDimensions();
        if (this.autoXY === true) {
            return 0;
        } else {
            return this.getAllText()["xMin"];
        }
    }

    getXmax = () => {
        const { width, height } = this.getImageDimensions();
        if (this.autoXY === true) {
            return width;
        } else {
            return this.getText()["xMax"];
        }
    }

    getYmin = () => {
        const { width, height } = this.getImageDimensions();
        if (this.autoXY === true) {
            return 0;
        } else {
            return this.getText()["yMin"];
        }
    }

    getYmax = () => {
        const { width, height } = this.getImageDimensions();
        if (this.autoXY === true) {
            return height;
        } else {
            return this.getText()["yMax"];
        }
    }

    /**
     * compute the image size in unite of screen pixel
     */
    imageSize: [number, number] = [5, 5];
    getImageSize = () => {
        return this.imageSize;
    }

    /**
     * Computer the display area size in unit of image pixels
     *
     * The result is written to this.imageSize
     * 
     */
    calcImageSize = () => {
        // const { width, height } = this.getImageDimensions();
        const xMin = this.getXmin();
        const xMax = this.getXmax();
        const yMin = this.getYmin();
        const yMax = this.getYmax();
        const width = xMax - xMin;
        const height = yMax - yMin;

        if (width === 0 || height === 0) {
            // return [5, 5];
            this.imageSize = [0, 0];
            return;
        }
        const containerWidth = this.getAllStyle()["width"] - this.axisWidth - this.colorMapWidth;
        const containerHeight = this.getAllStyle()["height"] - this.axisWidth - this.configHeight;
        if (containerHeight <= 0 || containerWidth <= 0) {
            // return [5, 5];
            this.imageSize = [0, 0];
            return;
        }
        let result: [number, number] = [0, 0];
        if (containerWidth / containerHeight > width / height) {
            result = [containerHeight * width / height, containerHeight];
        } else {
            result = [containerWidth, containerWidth * height / width];

        }
        // console.log("image width/height", width, height, result)
        // return result;
        this.imageSize = result;
    }
    mapDbrDataWitNewData = (newDbrData: any) => {

        // new image data
        // if (newDbrData[this.getChannelNames()[0]] !== undefined) {
        // if new data arrives the first time, re-calc image size on screen
        if (this.imageSize[0] === 0 || this.imageSize[1] === 0) {
            this.processData(true);
            // this.calcImageSize();
        } else {
            this.processData(false);
        }
        // }

        // the last N * 4 channels are roi pvs
        // return;
        // if (this.resizingRoi === false) {
        const displayWindowId = g_widgets1.getRoot().getDisplayWindowClient().getWindowId();

        for (let index = 0; index < this.getRegionsOfInterest().length; index++) {
            const roi = this.getRegionsOfInterest()[index];
            const xPv = roi.xPv.split("=")[0] + "@window_" + displayWindowId;
            const yPv = roi.yPv.split("=")[0] + "@window_" + displayWindowId;
            const widthPv = roi.widthPv.split("=")[0] + "@window_" + displayWindowId;
            const heightPv = roi.heightPv.split("=")[0] + "@window_" + displayWindowId;

            // console.log("roi pvs", xPv, yPv, widthPv, heightPv);

            // if (newDbrData.includes(xPv)) {
            //     const setRoiLeft = this.setRoisLeft[index];
            //     try {
            //         const tcaChannel = g_widgets1.getTcaChannel(xPv);
            //         // pixel value in image coordinate system
            //         const newValue = tcaChannel.getDbrData()["value"];

            //         if (setRoiLeft !== undefined && typeof newValue === "number") {
            //             const newValueRaw = this.calcPixelFromImageXyz(newValue, 0, 0)[0];
            //             console.log("new value raw =====================", newValueRaw, newValue, this.calcImageXyzFromPixel(newValueRaw, 0));
            //             setRoiLeft(newValueRaw);
            //         }
            //     } catch (e) {
            //         console.log(e);
            //     }
            // }

            // if (newDbrData.includes(yPv)) {
            //     const setRoiTop = this.setRoisTop[index];
            //     try {
            //         const tcaChannel = g_widgets1.getTcaChannel(yPv);
            //         const newValue = tcaChannel.getDbrData()["value"];
            //         if (setRoiTop !== undefined && typeof newValue === "number") {
            //             setRoiTop(newValue);
            //         }
            //     } catch (e) {
            //         console.log(e);
            //     }
            // }
            // if (newDbrData.includes(widthPv)) {
            //     const setRoiWidth = this.setRoisWidth[index];
            //     try {
            //         const tcaChannel = g_widgets1.getTcaChannel(widthPv);
            //         const newValue = tcaChannel.getDbrData()["value"];
            //         if (setRoiWidth !== undefined && typeof newValue === "number") {
            //             setRoiWidth(newValue);
            //         }
            //     } catch (e) {
            //         console.log(e);
            //     }
            // }

            // if (newDbrData.includes(heightPv)) {
            //     const setRoiHeight = this.setRoisHeight[index];
            //     try {
            //         const tcaChannel = g_widgets1.getTcaChannel(heightPv);
            //         const newValue = tcaChannel.getDbrData()["value"];
            //         if (setRoiHeight !== undefined && typeof newValue === "number") {
            //             setRoiHeight(newValue);
            //         }
            //     } catch (e) {
            //         console.log(e);
            //     }
            // }
        }
        // }
    }


    forceUpdateImageContainer = (input: any) => { };

    /**
     * x-axis, y-axis, image, and config
     */
    _ElementImageContainer = () => {
        const [, forceUpdate] = React.useState({});
        this.forceUpdateImageContainer = forceUpdate;

        this.forceUpdateImage = forceUpdate;
        // console.log(this.calcImageSize())
        return (
            <div
                style={{
                    width: this.getImageSize()[0] + this.axisWidth,
                    height: this.getImageSize()[1] + this.axisWidth + this.configHeight,
                    display: "inline-flex",
                    flexDirection: 'column',
                }}
            >
                {/* y axis and image */}
                <div
                    style={{
                        display: "inline-flex",
                        flexDirection: "row",
                        width: this.getImageSize()[0] + this.axisWidth,
                        height: this.getImageSize()[1],
                        position: "relative",
                    }}
                >
                    {/* y axis */}
                    <div
                        style={{
                            // backgroundColor: "blue",
                            width: this.axisWidth,
                            height: this.getImageSize()[1],
                        }}
                    >
                        <ElementYAxis image={this}
                        // totalHeight={this.renderer === undefined ? 20 : this.renderer.domElement.height}
                        />

                    </div>
                    {/* image and roi */}
                    <div
                        style={{
                            position: "relative",
                        }}
                    >
                        {/* image */}
                        <this._ElementImage />
                        {this.getRegionsOfInterest().map((roi, index) => {
                            return <ElementRoi key={index} index={index} image={this} />
                        })}

                    </div>

                </div>


                {/* bottom left corner and x axis */}
                <div
                    style={{
                        display: "inline-flex",
                        flexDirection: "row",
                        width: this.getImageSize()[0] + this.axisWidth,
                        height: this.axisWidth,
                    }}
                >
                    {/* bottom left corner */}
                    <div
                        style={{
                            // backgroundColor: "green",
                            width: this.axisWidth,
                            height: this.axisWidth,
                        }}
                    // onClick={() => {
                    //     this.showConfigPage = true;
                    //     this.forceUpdate({});
                    // }}
                    >
                    </div>
                    {/* x axis */}
                    <div
                        style={{
                            // backgroundColor: this.renderer !== undefined ? "cyan" : "magenta",
                            // opacity: 1,
                            // width: this.renderer === undefined ? 20 : this.renderer.domElement.width,
                            width: this.getImageSize()[0],
                            height: this.axisWidth,
                        }}
                    >
                        <ElementXAxis image={this}
                        // totalWidth={this.renderer === undefined ? 20 : this.renderer.domElement.width}
                        />
                    </div>
                </div>
                <ElementConfigBar image={this} />
            </div>
        )
    }


    forceUpdateColorMap = (input: any) => { };


    texture: DataTexture | undefined = undefined;
    renderer: WebGLRenderer | undefined = undefined;
    scene: Scene | undefined = undefined;
    camera: OrthographicCamera | undefined = undefined;
    textureData: Uint8Array | undefined = undefined;
    // imageWidth: number = 0;
    // imageHeight: number = 0;
    forceUpdateImage = (input: any) => { };
    mountRef: any = undefined;
    zoomLevel: number = 1;

    /**
     * Reset all image-related stuff
     */
    resetImage = () => {
        if (this.renderer !== undefined) {
            this.mountRef?.current?.removeChild(this.renderer?.domElement);
            this.renderer?.dispose();
        }

        this.texture = undefined;
        this.renderer = undefined;
        this.scene = undefined;
        this.camera = undefined;
        this.textureData = undefined;
        this.mountRef = undefined;
        this.imageSize[0] = 0;
        this.imageSize[1] = 0;
    }


    /**
     * Reset the view of the image: zoom level = 1; view area = full
     */
    resetViewToFull = () => {
        if (this.camera === undefined || this.scene === undefined || this.renderer === undefined) {
            return;
        }
        this.zoomLevel = 1;
        this.autoXY = true;
        this.resetImage();
        this.processData(true);
        // this.calcImageSize();
        this.forceUpdateImage({});

    }

    playing: boolean = true;
    imageValueBackup: number[] = [];
    imageDimensionsBackup: { width: number, height: number, colorMode: NDArray_ColorMode, pixelDepth: number } = { width: -1, height: -1, colorMode: NDArray_ColorMode.mono, pixelDepth: 0 };

    setPlaying = (playing: boolean) => {
        if (this.playing === playing) {
            return;
        }
        if (playing === false) {
            this.imageValueBackup = structuredClone(this.getImageValue());
            this.imageDimensionsBackup = structuredClone(this.getImageDimensions());
        } else {
            this.imageValueBackup = [];
            this.imageDimensionsBackup = { width: -1, height: -1, colorMode: NDArray_ColorMode.mono, pixelDepth: 0 };
        }
        this.playing = playing;
    }

    zoomImage = (zoomFactor: number, centerX: number, centerY: number) => {
        if (!this.camera) return;

        const cam = this.camera;
        const width = cam.right - cam.left;
        const height = cam.top - cam.bottom;

        const newWidth = width / zoomFactor;
        const newHeight = height / zoomFactor;

        // Keep centerX and centerY fixed on screen
        cam.left = centerX - (centerX - cam.left) / zoomFactor;
        cam.right = cam.left + newWidth;
        cam.bottom = centerY - (centerY - cam.bottom) / zoomFactor;
        cam.top = cam.bottom + newHeight;

        cam.updateProjectionMatrix();
        this.forceUpdateImage({});
    };


    /**
     * set to manual view: both plot region and view region
     * zoom factor is set to 1
     */
    setImageXyRange = () => {
        if (!this.camera) return;
        this.zoomLevel = 1;
        this.autoXY = false;
        // clean up everything
        this.resetImage();
        // process data
        this.processData(true);
        // compute the image size on screen
        // this.calcImageSize();
        this.forceUpdateImage({});
    };


    /**
     * dx, dy: pixel on screen
     */
    panImage = (dx: number, dy: number) => {
        if (this.camera === undefined || this.scene === undefined || this.renderer === undefined) {
            return;
        }
        // console.log("pan image")

        const pixelActualSize = this.calcPixelSize();
        const camera = this.camera;
        const panX = dx / pixelActualSize[0];
        const panY = dy / pixelActualSize[1];
        camera.left = camera.left - panX
        camera.right = camera.right - panX;
        camera.top = camera.top + panY;
        camera.bottom = camera.bottom + panY;


        camera.updateProjectionMatrix();
        this.forceUpdateImage({});
    }

    lastMouesPositions: [number, number] = [-1, -1];


    _ElementImage = () => {
        const mountRef = React.useRef<HTMLDivElement>(null);
        this.mountRef = mountRef;
        const [, forceUpdate] = React.useState({});
        // this.forceUpdateImage = forceUpdate;

        // let processData = this.processData_GrayMap;
        // if (this.getText()["colorMap"] === "jet") {
        // const processData = this.processData;
        // }


        const fun1 = () => {
            // console.log("fun1 running");
            const { width, height } = this.getImageDimensions();
            // the image data has not arrived yet
            if (width === 0 || height === 0) {
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
                width,
                height,
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
            let xMax = this.getXmax();
            let xMin = this.getXmin();
            if (xMax < xMin) {
                const tmp = xMax;
                xMax = xMin;
                xMin = tmp;
            }


            const camLeft = -width / 2 + xMin;
            const camRight = -width / 2 + xMax;

            let yMax = this.getYmax();
            let yMin = this.getYmin();
            if (yMax < yMin) {
                const tmp = yMax;
                yMax = yMin;
                yMin = tmp;
            }

            const camBottom = -height / 2 + yMin;
            const camTop = -height / 2 + yMax;

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
            renderer.setSize(this.getImageSize()[0], this.getImageSize()[1]);
            mountRef.current!.appendChild(renderer.domElement);

            const geometry = new PlaneGeometry(width, height);
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
            const { width, height } = this.getImageDimensions();
            // if (this.playing === true) {
            // processData();
            // }

            // update cursor readout
            if (this.lastMouesPositions[0] > -10000) {
                this.handleMouseMoveOnImage(...this.lastMouesPositions);
            }


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
                    width: this.getImageSize()[0],
                    height: this.getImageSize()[1],
                }}

                onMouseDown={(event) => {
                    if (event.button !== 0) {
                        return;
                    }
                    window.addEventListener("mousemove", this.panImageEventListener);
                    window.addEventListener("mouseup", this.cancelPanImageEventListener);
                }}

                onMouseMove={(event: MouseEvent) => {
                    // event.stopPropagation();
                    if (this.renderer === undefined || this.camera === undefined) {
                        return;
                    }
                    this.lastMouesPositions = [event.clientX, event.clientY];
                    this.handleMouseMoveOnImage(event.clientX, event.clientY);
                }}

                onMouseLeave={() => {
                    this.lastMouesPositions = [-10000, -10000];
                    this.setXyzCursorValues((oldValues: any) => {
                        return [-10000, -10000, -10000];
                    })
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
            </div>
        );
    };

    resizeRoiTopHandlers: any[] = [];
    resizeRoiTopHandlersMouseUp: any[] = [];
    resizeRoiBottomHandlers: any[] = [];
    resizeRoiBottomHandlersMouseUp: any[] = [];
    resizeRoiLeftHandlers: any[] = [];
    resizeRoiLeftHandlersMouseUp: any[] = [];
    resizeRoiRightHandlers: any[] = [];
    resizeRoiRightHandlersMouseUp: any[] = [];

    setRoisTop: any[] = [];
    setRoisLeft: any[] = [];
    setRoisWidth: any[] = [];
    setRoisHeight: any[] = [];
    roisRef: any[] = [];


    calcImageXyzFromPixel = (pixelX: number, pixelY: number) => {
        if (this.renderer === undefined || this.camera === undefined) {
            return [-1, -1, -1]; // Invalid pixel coordinates
        }
        const rect = this.renderer.domElement.getBoundingClientRect();
        const { width, height } = this.getImageDimensions();
        const mouse = new Vector2();
        const raycaster = new Raycaster();


        // Convert mouse to normalized device coordinates
        mouse.x = ((pixelX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((pixelY - rect.top) / rect.height) * 2 + 1;

        // Get a ray from the camera
        raycaster.setFromCamera(mouse, this.camera);

        // Define the target plane in world space
        // Example: XY-plane at z = 0
        const planeZ = 0;
        const origin = raycaster.ray.origin;
        const direction = raycaster.ray.direction;

        // t is the distance along the ray to the plane
        const t = (planeZ - origin.z) / direction.z;

        if (t >= 0) {
            const point = origin.clone().add(direction.clone().multiplyScalar(t));

            // Convert to pixel coords
            const pixelX = Math.floor(point.x + width / 2);
            const pixelY = Math.floor(height / 2 + point.y);
            const pixelZ = (height - 1 - pixelY) * width + pixelX;
            const valueZ = this.getImageValue()[pixelZ];
            // console.log(`Pixel coords: (${pixelX}, ${pixelY})`, pixelZ, valueZ);
            // this.setXyzCursorValues((oldValues: any) => {
            return [pixelX, pixelY, valueZ];
            // })
        } else {
            return [-1, -1, -1]; // Invalid pixel coordinates
        }
    }


    handleMouseMoveOnImage = (clientX: number, clientY: number) => {
        const xyz = this.calcImageXyzFromPixel(clientX, clientY);

        this.setXyzCursorValues((oldValues: any) => {
            return xyz;
        })
    }

    zMax: number = 0;
    zMin: number = 0;

    processData = (changeGeometry: boolean) => {
        // pixelDepth is not used in displaying data
        const { width, height, colorMode, pixelDepth } = this.getImageDimensions();

        if (colorMode !== NDArray_ColorMode.mono && colorMode !== NDArray_ColorMode.rgb1 && colorMode !== NDArray_ColorMode.rgb2 && colorMode !== NDArray_ColorMode.rgb3) {
            Log.error("We only support MONO, RGB1, RGB2, and RGB3 format data in Image widget");
            return;
        }

        const size = width * height;

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

        if (changeGeometry) {
            // image dimension on screen
            this.calcImageSize();
        }

        // color
        let minValue = this.getText()["zMin"];
        let maxValue = this.getText()["zMax"];
        if (this.getText()["autoZ"] === true && colorMode === NDArray_ColorMode.mono) {
            minValue = Math.min(...dataRaw);
            maxValue = Math.max(...dataRaw);
        }

        this.zMax = maxValue;
        this.zMin = minValue;

        const currentColorMap = this.getText()["colorMap"];
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
                const j = ii % width;
                const i = (ii - j) / width;

                const rRaw = dataRaw[3 * i * width + j];
                const gRaw = dataRaw[3 * i * width + j + width];
                const bRaw = dataRaw[3 * i * width + j + 2 * width];

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


    calcPixelSize = () => {
        const { width, height } = this.getImageDimensions();

        if (width === 0 || height === 0) {
            return [1, 1];
        }

        if (this.camera === undefined || this.scene === undefined || this.renderer === undefined) {
            return [1, 1];
        }
        const camera = this.camera;

        const viewportWidthInWorld = camera.right - camera.left;
        const viewportHeightInWorld = camera.top - camera.bottom;

        const worldPerPixelX = this.renderer?.domElement.clientWidth / viewportWidthInWorld;
        const worldPerPixelY = this.renderer?.domElement.clientHeight / viewportHeightInWorld;
        if (worldPerPixelX === undefined || worldPerPixelY === undefined) {
            return [1, 1];
        } else {
            return [worldPerPixelX, worldPerPixelY];
        }
    }

    panImageEventListener = (e: any) => {
        const dx = e.movementX;
        const dy = e.movementY;
        this.panImage(dx, dy);
    };

    cancelPanImageEventListener = (e: any) => {
        window.removeEventListener("mousemove", this.panImageEventListener);
        window.removeEventListener("mouseup", this.cancelPanImageEventListener);
    }

    /**
     * Get 1-D waveform data
     */
    getImageValue = () => {
        if (this.playing === false) {
            return this.imageValueBackup;
        }
        // {index: number, value: number[]}
        const choiceValue = g_widgets1.getChannelValue(this.getChannelNames()[0]) as any;

        if (typeof choiceValue === "object") {
            return choiceValue["value"];
        }
        return undefined;
    }


    getImageDimensions = (): { width: number, height: number, colorMode: NDArray_ColorMode, pixelDepth: number } => {
        if (this.playing === false) {
            return this.imageDimensionsBackup;
        }

        try {
            const channel = g_widgets1.getTcaChannel(this.getChannelNames()[0]);
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
                                width: dimension0["size"],
                                height: dimension1["size"],
                                colorMode: colorMode,
                                pixelDepth: pixelDepth
                            };
                        }
                    } else if (colorMode === NDArray_ColorMode.rgb1) {
                        if (typeof dimension2["size"] === "number" && typeof dimension1["size"] === "number") {
                            return {
                                width: dimension[1]["size"],
                                height: dimension[2]["size"],
                                colorMode: colorMode,
                                pixelDepth: pixelDepth
                            };
                        }

                    } else if (colorMode === NDArray_ColorMode.rgb2) {
                        if (typeof dimension0["size"] === "number" && typeof dimension2["size"] === "number") {
                            return {
                                width: dimension[0]["size"],
                                height: dimension[2]["size"],
                                colorMode: colorMode,
                                pixelDepth: pixelDepth
                            };
                        }

                    } else if (colorMode === NDArray_ColorMode.rgb3) {
                        if (typeof dimension0["size"] === "number" && typeof dimension1["size"] === "number") {
                            return {
                                width: dimension[0]["size"],
                                height: dimension[1]["size"],
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
        return { width: 0, height: 0, colorMode: NDArray_ColorMode.mono, pixelDepth: 0 };
    }

    /**
     * Nomrally we can display the channel value as `${this._getChannelValue()}`
     * However, for string type data, this produces a lot of "," if the data is an array
     */
    getChannelValueStrRepresentation = () => {
        const rawChannelValue = this._getChannelValue(false);
        if (Array.isArray(rawChannelValue)) {
            return '[' + rawChannelValue.join(",") + ']';
        }
        return rawChannelValue;
    }


    _Element = React.memo(this._ElementRaw, () => this._useMemoedElement());
    _ElementArea = React.memo(this._ElementAreaRaw, () => this._useMemoedElement());
    _ElementBody = React.memo(this._ElementBodyRaw, () => this._useMemoedElement());

    // defined in super class
    // getElement()
    // getSidebarElement()
    // _ElementResizerRaw
    // _ElementResizer

    // -------------------- helper functions ----------------

    // defined in super class
    // showSidebar()
    // showResizers()
    // _useMemoedElement()
    // hasChannel()
    // isInGroup()
    // isSelected()
    // _getElementAreaRawOutlineStyle()

    formatScalarValue = (channelValueElement: number | string | boolean | undefined): string => {


        if (typeof channelValueElement === "number") {
            const scale = Math.max(this.getAllText()["scale"], 0);
            const format = this.getAllText()["format"];
            if (format === "decimal") {
                return channelValueElement.toFixed(scale);
            } else if (format === "default") {
                // const channelName = this.getChannelNames()[0];
                // const defaultScale = g_widgets1.getChannelPrecision(channelName);
                // if (defaultScale !== undefined) {
                //     return channelValueElement.toFixed(defaultScale);
                // } else {
                return channelValueElement.toFixed(scale);
                // }
            } else if (format === "exponential") {
                return channelValueElement.toExponential(scale);
            } else if (format === "hexadecimal") {
                return `0x${channelValueElement.toString(16)}`;
            } else if (format === "string") {
                // use a number array to represent a string
                // MacOS ignores the non-displayable characters, but Linux shows rectangle for these characters
                if (channelValueElement >= 32 && channelValueElement <= 126) {
                    return `${String.fromCharCode(channelValueElement)}`;
                } else {
                    return "";
                }
            } else {
                return `${channelValueElement}`;
            }
        } else {
            if (g_widgets1.isEditing() === true) {
                return `${channelValueElement}`;
            } else {
                return `${channelValueElement}`;
            }

        }
    };

    // only for TextUpdate and TextEntry
    // they are suitable to display array data in various formats,
    // other types of widgets, such as Meter, Spinner, Tanks, ProgressBar, Thermometer, ScaledSlider are not for array data
    _getChannelValue = (raw: boolean = false) => {

        const channelValue = this.getChannelValueForMonitorWidget(raw);

        if (typeof channelValue === "number" || typeof channelValue === "string") {
            return this.formatScalarValue(channelValue);
        } else if (Array.isArray(channelValue)) {
            const result: any[] = [];
            for (let element of channelValue) {
                result.push(this.formatScalarValue(element));
            }
            if (this.getAllText()["format"] === "string" && typeof channelValue[0] === "number") {
                return result.join("");
            } else {
                return result;
            }
        } else {
            return channelValue;
        }
    };

    _getChannelSeverity = () => {
        return this._getFirstChannelSeverity();
    };

    _getChannelUnit = () => {
        const unit = this._getFirstChannelUnit();
        if (unit === undefined) {
            return "";
        } else {
            return unit;
        }
    };

    processChannelNames(widgetMacros: [string, string][] = [], removeDuplicated: boolean = true) {
        for (const regionOfInterest of this.getRegionsOfInterest()) {
            this.getChannelNamesLevel0().push(
                regionOfInterest["xPv"],
                regionOfInterest["yPv"],
                regionOfInterest["widthPv"],
                regionOfInterest["heightPv"],
            );
        }

        super.processChannelNames(widgetMacros, removeDuplicated);

    }


    // -------------------------- tdl -------------------------------

    static generateDefaultTdl = (): type_Image_tdl => {
        const widgetKey = GlobalMethods.generateWidgetKey(defaultImageTdl["type"]);
        return structuredClone({
            ...defaultImageTdl,
            widgetKey: widgetKey,
        });
    };

    generateDefaultTdl: () => any = Image.generateDefaultTdl;

    getTdlCopy(newKey?: boolean): Record<string, any> {
        const result = super.getTdlCopy(newKey);
        result["regionsOfInterest"] = structuredClone(this.getRegionsOfInterest());
        return result;
    }

    // --------------------- sidebar --------------------------
    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new ImageSidebar(this);
        }
    }

    jobsAsEditingModeBegins(): void {
        super.jobsAsEditingModeBegins();
        this.resizeRoiTopHandlers = [];
        this.resizeRoiTopHandlersMouseUp = [];
        this.resizeRoiBottomHandlers = [];
        this.resizeRoiBottomHandlersMouseUp = [];
        this.resizeRoiLeftHandlers = [];
        this.resizeRoiLeftHandlersMouseUp = [];
        this.resizeRoiRightHandlers = [];
        this.resizeRoiRightHandlersMouseUp = [];
        this.resetImage();
    }


    jobsAsOperatingModeBegins(): void {
        super.jobsAsOperatingModeBegins();
        this.autoXY = this.getText()["initialAutoXY"];

        this.getRegionsOfInterest().forEach((roi, index) => {
            this.resizeRoiTopHandlers[index] = (e: any) => {
                resizeRoiTopHandler(this, e, index);
            };
            this.resizeRoiTopHandlersMouseUp[index] = (e: any) => {
                resizeRoiTopHandlerMouseUp(this, e, index);
            };
            this.resizeRoiBottomHandlers[index] = (e: any) => {
                resizeRoiBottomHandler(this, e, index);
            };
            this.resizeRoiBottomHandlersMouseUp[index] = (e: any) => {
                resizeRoiBottomHandlerMouseUp(this, e, index);
            };
            this.resizeRoiLeftHandlers[index] = (e: any) => {
                resizeRoiLeftHandler(this, e, index);
            };
            this.resizeRoiLeftHandlersMouseUp[index] = (e: any) => {
                resizeRoiLeftHandlerMouseUp(this, e, index);
            };
            this.resizeRoiRightHandlers[index] = (e: any) => {
                resizeRoiRightHandler(this, e, index);
            };
            this.resizeRoiRightHandlersMouseUp[index] = (e: any) => {
                resizeRoiRightHandlerMouseUp(this, e, index);
            };
        })

        this.resetImage();
    }
}
