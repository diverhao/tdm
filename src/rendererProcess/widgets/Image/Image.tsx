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
import { type_Image_tdl, defaultImageTdl, type_Image_text_tdl } from "../../../common/types/type_widget_tdl";
import { colorMapFunctions, grayColorMap } from "./ImageColorMaps";
import { ElementRoi, resizeRoiTopHandler, resizeRoiTopHandlerMouseUp, resizeRoiBottomHandler, resizeRoiBottomHandlerMouseUp, resizeRoiLeftHandler, resizeRoiLeftHandlerMouseUp, resizeRoiRightHandler, resizeRoiRightHandlerMouseUp } from "./ImageRoi";
import { ImagePlot } from "./ImagePlot";
import { getScaleWidthHeight } from "../../helperWidgets/SharedElements/Scale";

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


export const yAxisLabelWidth = 30;
export const yAxisTickWidth = getScaleWidthHeight();
export const xAxisLabelHeight = 30;
export const xAxisTickHeight = getScaleWidthHeight();
export const toolbarHeight = 30;
export const colorbarWidth = 50;


export class Image extends BaseWidget {

    // _rules: BaseWidgetRules;
    axisWidth: number = 40;
    configHeight: number = 20;
    // autoXY: boolean = true;
    private _regionOfInterest: {
        xPv: string;
        yPv: string;
        widthPv: string;
        heightPv: string;
        color: string;
    }[] = [];


    forceUpdate: React.Dispatch<React.SetStateAction<{}>> = (input: React.SetStateAction<{}>) => { };
    forceUpdateColorMap = (input: any) => { };

    showConfigPage: boolean = false;
    colorMapWidth: number = 50;
    setHintText = (input: string) => { };
    setXyzCursorValues = (input: any) => { };



    // texture: DataTexture | undefined = undefined;
    // renderer: WebGLRenderer | undefined = undefined;
    // scene: Scene | undefined = undefined;
    // camera: OrthographicCamera | undefined = undefined;
    // textureData: Uint8Array | undefined = undefined;
    forceUpdateImage = (input: any) => { };
    // mountRef: any = undefined;
    // zoomLevel: number = 1;

    playing: boolean = true;
    imageValueBackup: number[] = [];
    imageDimensionsBackup: { imageWidth: number, imageHeight: number, colorMode: NDArray_ColorMode, pixelDepth: number } = { imageWidth: -1, imageHeight: -1, colorMode: NDArray_ColorMode.mono, pixelDepth: 0 };

    lastMouesPositions: [number, number] = [-1, -1];


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

    // imageSize: [number, number] = [5, 5];

    zMax: number = 0;
    zMin: number = 0;

    _plot: ImagePlot;

    constructor(widgetTdl: type_Image_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this.setReadWriteType("write");

        this._plot = new ImagePlot(this);

        this._regionOfInterest = structuredClone(widgetTdl.regionsOfInterest);
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
            <ErrorBoundary style={this.getStyle()} widgetKey={this.getWidgetKey()}>
                <div style={this.getElementBodyRawStyle()}>
                    <this._ElementArea></this._ElementArea>
                    {this.showResizers() ? <this._ElementResizer /> : null}
                </div>
                {this.showSidebar() ? this.getSidebar()?.getElement() : null}
            </ErrorBoundary>
        )
    };

    _ElementAreaRaw = (): React.JSX.Element => {
        const [, forceUpdate] = React.useState({});
        this.forceUpdate = forceUpdate;

        const allText = this.getAllText();
        const whiteSpace = allText.wrapWord ? "normal" : "pre";
        const justifyContent = allText.horizontalAlign;
        const backgroundColor = this._getElementAreaRawBackgroundStyle();

        return (
            <div
                style={{
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    userSelect: "none",
                    overflow: "show",
                    whiteSpace: whiteSpace,
                    justifyContent: justifyContent,
                    backgroundColor: backgroundColor,
                    alignItems: "flex-end"
                }}
                onMouseDown={(event) => {
                    // click any place to hide config page
                    this._handleMouseDown(event);
                    if (this.showConfigPage === true) {
                        this.showConfigPage = false;
                        this.forceUpdate({});
                    }
                }}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                {this.getPlot().getElement()}
            </div>
        );
    };

    _Element = React.memo(this._ElementRaw, () => this._useMemoedElement());
    _ElementArea = React.memo(this._ElementAreaRaw, () => this._useMemoedElement());


    // --------------------- getters -----------------------

    getElementFallbackFunction = () => {
        return this._ElementFallback;
    }
    getRegionsOfInterest = () => {
        return this._regionOfInterest;
    };

    getPlot = () => {
        return this._plot;
    }

    // -------------------- helper functions ----------------

    mapDbrDataWitNewData = (newDbrData: any) => {

        this.getPlot().mapDbrDataWitNewData();

        // // new image data
        // // if (newDbrData[this.getChannelNames()[0]] !== undefined) {
        // // if new data arrives the first time, re-calc image size on screen
        // if (this.imageSize[0] === 0 || this.imageSize[1] === 0) {
        //     this.getPlot().processData(true);
        //     // this.calcImageSize();
        // } else {
        //     this.getPlot().processData(false);
        // }
        // // }

        // the last N * 4 channels are roi pvs
        // return;
        // if (this.resizingRoi === false) {
        // const displayWindowId = g_widgets1.getRoot().getDisplayWindowClient().getWindowId();

        // for (let index = 0; index < this.getRegionsOfInterest().length; index++) {
        //     const roi = this.getRegionsOfInterest()[index];
        //     const xPv = roi.xPv.split("=")[0] + "@window_" + displayWindowId;
        //     const yPv = roi.yPv.split("=")[0] + "@window_" + displayWindowId;
        //     const widthPv = roi.widthPv.split("=")[0] + "@window_" + displayWindowId;
        //     const heightPv = roi.heightPv.split("=")[0] + "@window_" + displayWindowId;

        // }
    }
    
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
        // this.resizeRoiTopHandlers = [];
        // this.resizeRoiTopHandlersMouseUp = [];
        // this.resizeRoiBottomHandlers = [];
        // this.resizeRoiBottomHandlersMouseUp = [];
        // this.resizeRoiLeftHandlers = [];
        // this.resizeRoiLeftHandlersMouseUp = [];
        // this.resizeRoiRightHandlers = [];
        // this.resizeRoiRightHandlersMouseUp = [];
        // this.resetImage();
    }


    jobsAsOperatingModeBegins(): void {
        super.jobsAsOperatingModeBegins();
        // this.getPlot().resetToTextDefaults();

        // this.getRegionsOfInterest().forEach((roi, index) => {
        //     this.resizeRoiTopHandlers[index] = (e: any) => {
        //         resizeRoiTopHandler(this, e, index);
        //     };
        //     this.resizeRoiTopHandlersMouseUp[index] = (e: any) => {
        //         resizeRoiTopHandlerMouseUp(this, e, index);
        //     };
        //     this.resizeRoiBottomHandlers[index] = (e: any) => {
        //         resizeRoiBottomHandler(this, e, index);
        //     };
        //     this.resizeRoiBottomHandlersMouseUp[index] = (e: any) => {
        //         resizeRoiBottomHandlerMouseUp(this, e, index);
        //     };
        //     this.resizeRoiLeftHandlers[index] = (e: any) => {
        //         resizeRoiLeftHandler(this, e, index);
        //     };
        //     this.resizeRoiLeftHandlersMouseUp[index] = (e: any) => {
        //         resizeRoiLeftHandlerMouseUp(this, e, index);
        //     };
        //     this.resizeRoiRightHandlers[index] = (e: any) => {
        //         resizeRoiRightHandler(this, e, index);
        //     };
        //     this.resizeRoiRightHandlersMouseUp[index] = (e: any) => {
        //         resizeRoiRightHandlerMouseUp(this, e, index);
        //     };
        // })

        const text = this.getText() as type_Image_text_tdl;
        const plot = this.getPlot();
        // plot.autoXY = text[""];
        const info = plot.getImageInfo();
        plot.setImageInfo({
            ...info,
            imageShownXmin: text["xMin"],
            imageShownXmax: text["xMax"],
            imageShownYmin: text["yMin"],
            imageShownYmax: text["yMax"],
            zMin: text["zMin"],
            zMax: text["zMax"],
            autoZ: text["autoZ"],
            colorMap: text["colorMap"] ?? "gray",
        });
    }
}
