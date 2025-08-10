import * as React from "react";
import { MouseEvent } from "react";
import { GlobalVariables, g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { GroupSelection2 } from "../../helperWidgets/GroupSelection/GroupSelection2";
import { ImageSidebar } from "./ImageSidebar";
import * as GlobalMethods from "../../global/GlobalMethods";
import { BaseWidget } from "../BaseWidget/BaseWidget";
// import { TextUpdateRules } from "./TextUpdateRules";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
// import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary"
import { Log } from "../../../mainProcess/log/Log";
import * as THREE from 'three';
import { pi } from "mathjs";


export type type_Image_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
};

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
    // level-1 properties in tdl file
    // _type: string;
    // _widgetKey: string;
    // _style: Record<string, any>;
    // _text: Record<string, any>;
    // _channelNames: string[];
    // _groupNames: string[] = undefined;

    // sidebar
    // private _sidebar: TextUpdateSidebar;

    // tmp methods
    // private _tmp_mouseMoveOnResizerListener: any = undefined;
    // private _tmp_mouseUpOnResizerListener: any = undefined;

    // widget-specific channels, these channels are only used by this widget
    // private _tcaChannels: TcaChannel[];

    // used for the situation of shift key pressed + mouse down on a selected widget,
    // so that when the mouse is up, the widget is de-selected
    // its value is changed in 3 places: this.select2(), this._handleMouseMove() and this._handleMouseUp()
    // private _readyToDeselect: boolean = false;

    // _rules: TextUpdateRules;

    constructor(widgetTdl: type_Image_tdl) {
        super(widgetTdl);
        this.setReadWriteType("write");

        this.setStyle({ ...Image._defaultTdl.style, ...widgetTdl.style });
        this.setText({ ...Image._defaultTdl.text, ...widgetTdl.text });

        // this._rules = new TextUpdateRules(this, widgetTdl);

        // this._sidebar = new TextUpdateSidebar(this);
    }

    // ------------------------- event ---------------------------------

    // defined in widget, invoked in sidebar
    // (1) determine which tdl property should be updated
    // (2) calculate new value
    // (3) assign new value
    // (4) add this widget as well as "GroupSelection2" to g_widgets1.forceUpdateWidgets
    // (5) flush
    updateFromSidebar = (event: any, propertyName: string, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        // todo: remove this method
    };

    // defined in super class
    // _handleMouseDown()
    // _handleMouseMove()
    // _handleMouseUp()
    // _handleMouseDownOnResizer()
    // _handleMouseMoveOnResizer()
    // _handleMouseUpOnResizer()
    // _handleMouseDoubleClick()

    // ----------------------------- geometric operations ----------------------------

    // defined in super class
    // simpleSelect()
    // selectGroup()
    // select()
    // simpleDeSelect()
    // deselectGroup()
    // deSelect()
    // move()
    // resize()

    // ------------------------------ group ------------------------------------

    // defined in super class
    // addToGroup()
    // removeFromGroup()

    // ------------------------------ elements ---------------------------------

    // element = <> body (area + resizer) + sidebar </>

    // Body + sidebar
    _ElementRaw = () => {
        this.setRulesStyle({});
        this.setRulesText({});
        const rulesValues = this.getRules()?.getValues();
        if (rulesValues !== undefined) {
            this.setRulesStyle(rulesValues["style"]);
            this.setRulesText(rulesValues["text"]);
        }
        this.setAllStyle({ ...this.getStyle(), ...this.getRulesStyle() });
        this.setAllText({ ...this.getText(), ...this.getRulesText() });

        // must do it for every widget
        g_widgets1.removeFromForceUpdateWidgets(this.getWidgetKey());
        this.renderChildWidgets = true;
        React.useEffect(() => {
            this.renderChildWidgets = false;
        });

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
                                {this._showSidebar() ? this._sidebar?.getElement() : null}
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
    _ElementBodyRaw = (): JSX.Element => {
        return (
            // always update the div below no matter the TextUpdateBody is .memo or not
            // TextUpdateResizer does not update if it is .memo
            <div style={{
                ...this.getElementBodyRawStyle(),
                // outline: this._getElementAreaRawOutlineStyle(),
            }}>
                <this._ElementArea></this._ElementArea>
                {this._showResizers() ? <this._ElementResizer /> : null}
            </div>
        );
    };

    // only shows the text, all other style properties are held by upper level _ElementBodyRaw
    _ElementAreaRaw = ({ }: any): JSX.Element => {
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
                style={style}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                <this._ElementImage />
                <this._ElementZoomInButton />
                <this._ElementZoomOutButton />
                <this._ElementSwitchColorMap></this._ElementSwitchColorMap>
            </div>
        );
    };

    _ElementImage1 = () => {
        return (
            <div>
                {JSON.stringify(this.getImageDimensions())}
                {JSON.stringify(this.getImageValue())}
            </div>
        )
    }

    texture: THREE.DataTexture | undefined = undefined;
    renderer: THREE.WebGLRenderer | undefined = undefined;
    scene: THREE.Scene | undefined = undefined;
    camera: THREE.OrthographicCamera | undefined = undefined;
    textureData: Uint8Array | undefined = undefined;
    imageWidth: number = 0;
    imageHeight: number = 0;
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
        this.imageWidth = 0;
        this.imageHeight = 0;
    }


    /**
     * Reset the view of the image: zoom level = 1; view area. = nominal
     */
    resetView = () => {
        if (this.camera === undefined || this.scene === undefined || this.renderer === undefined) {
            return;
        }

        const pixelActualSize = this.calcPixelSize();
        this.zoomLevel = 1;
        const zoom = 1;
        const { width, height } = this.getImageDimensions();
        const camera = this.camera;
        // const panX = dx / pixelActualSize;
        // const panY = dy / pixelActualSize;
        camera.left = -width / 2 / zoom;
        camera.right = width / 2 / zoom;
        camera.top = height / 2 / zoom;
        camera.bottom = -height / 2 / zoom;

        camera.updateProjectionMatrix();
        this.forceUpdateImage({});

    }

    playing: boolean = true;

    switchColorMap = (newColorMap: string) => {
        let currentColorMap = this.getText()["colorMap"];
        if (currentColorMap === undefined) {
            currentColorMap = "gray";
        }
        this.getText()["colorMap"] = newColorMap;
        // completely redo the image
        this.resetImage();
        this.forceUpdateImage({});
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
     * dx, dy: pixel on screen
     */
    panImage = (dx: number, dy: number) => {
        if (this.camera === undefined || this.scene === undefined || this.renderer === undefined) {
            return;
        }

        const pixelActualSize = this.calcPixelSize();
        const camera = this.camera;
        const panX = dx / pixelActualSize;
        const panY = dy / pixelActualSize;
        camera.left = camera.left - panX
        camera.right = camera.right - panX;
        camera.top = camera.top + panY;
        camera.bottom = camera.bottom + panY;
        camera.updateProjectionMatrix();
        this.forceUpdateImage({});
    }

    _ElementZoomInButton = () => {
        return (
            <div
                style={{
                    position: "absolute",
                    zIndex: 1000,
                    right: 0,
                    bottom: 100,
                    backgroundColor: "rgba(255, 255,0, 0.5)",
                    width: 100,
                    height: 100,
                }}
                onMouseDown={() => {
                    console.log("Zoom In clicked");
                    // this.zoomImage(this.zoomLevel * 1.1, 75, 35)
                    this.resetView();
                }}>
                reset
            </div>
        );
    }

    _ElementZoomOutButton = () => {
        const [playing, setPlaying] = React.useState(this.playing);
        return (
            <div
                style={{
                    position: "absolute",
                    zIndex: 1000,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(255, 255,0, 0.5)",
                    width: 100,
                    height: 100,
                }}
                onMouseDown={() => {
                    console.log("Zoom Out clicked");
                    // this.zoomImage(this.zoomLevel / 1.1, 75, 35)

                    this.playing = !this.playing;
                    setPlaying(!playing);
                    if (this.playing === true) {
                        // update immediately
                        this.forceUpdateImage({});
                    }

                }}>
                {playing === true ? "Pause" : "Play"}
            </div>
        );
    }

    _ElementSwitchColorMap = () => {
        const [colorMap, setColorMap] = React.useState(this.getText()["colorMap"]);
        return (
            <div>
                <select id="myDropdown" value={colorMap} onChange={(event: any) => {
                    setColorMap(event.target.value);
                    this.switchColorMap(event.target.value);
                }}>
                    {Object.keys(this.colorMapFunctions).map((key, index) => {
                        return (
                            <option value={key}>
                                {key.toUpperCase()}
                            </option>
                        )
                    })}
                    {/* <option value="jet">Jet</option>
                    <option value="hot">Hot</option>
                    <option value="cool">Cold</option>
                    <option value="gray">Gray</option> */}
                </select>

            </div>
        )
    }


    _ElementImage = () => {
        const mountRef = React.useRef<HTMLDivElement>(null);
        this.mountRef = mountRef;
        const [, forceUpdate] = React.useState({});
        this.forceUpdateImage = forceUpdate;


        // let processData = this.processData_GrayMap;
        // if (this.getText()["colorMap"] === "jet") {
        const processData = this.processData;
        // }


        const fun1 = () => {
            // console.log("fun1 running");
            const { width, height } = this.getImageDimensions();
            // if image width/height changed, reset 
            if ((this.imageHeight !== height || this.imageWidth !== width) && (this.imageHeight !== 0 && this.imageWidth !== 0)) {
                console.log("Image size changed, resetting image");
                this.resetImage();
                this.forceUpdateImage({});
                return;
            }
            // console.log("fun1 running A");
            // console.log("fun1 running B");
            if (this.scene !== undefined) {
                return;
            }

            processData();
            if (this.textureData === undefined) {
                return;
            }
            // console.log("fun1 running --- C", this.textureData);
            // Create texture from data
            const texture = new THREE.DataTexture(
                this.textureData,
                width,
                height,
                // this.getText()["colorMap"] === "jet" ? THREE.RGBAFormat : THREE.RedFormat,
                THREE.RGBAFormat,
                THREE.UnsignedByteType
            );
            texture.colorSpace = THREE.SRGBColorSpace; // Replaces encoding in newer versions

            // the first data point in this.textureData is plotted on top-left corner
            texture.flipY = true;
            texture.needsUpdate = true;
            texture.generateMipmaps = false;
            texture.minFilter = THREE.NearestFilter;
            texture.magFilter = THREE.NearestFilter;

            // texture.encoding = THREE.sRGBEncoding;



            const scene = new THREE.Scene();
            const containerWidth = this.getAllStyle()["width"] as number;
            const containerHeight = this.getAllStyle()["height"] as number;
            // const containerMinSize = Math.min(containerWidth, containerHeight);
            // a "pixel" is a unit in image, not screen
            const pixelMaxWidth = containerWidth / width;
            const pixelMaxHeight = containerHeight / height;
            const pixelSize = Math.min(pixelMaxWidth, pixelMaxHeight);

            const aspect = width / height;
            const zoom = this.zoomLevel; // adjust zoom level

            // OrthographicCamera(left, right, top, bottom, near, far)
            const camera = new THREE.OrthographicCamera(
                -width / 2 / zoom,
                width / 2 / zoom,
                height / 2 / zoom,
                -height / 2 / zoom,
                0.1,
                10
            );

            camera.position.z = 5;
            camera.lookAt(0, 0, 0);

            const renderer = new THREE.WebGLRenderer({ alpha: true });

            // renderer.setPixelRatio(window.devicePixelRatio);
            // renderer.setSize(containerMinSize, containerMinSize);
            renderer.setSize(width * pixelSize, height * pixelSize);
            mountRef.current!.appendChild(renderer.domElement);

            const geometry = new THREE.PlaneGeometry(width, height);
            const material = new THREE.MeshBasicMaterial({ map: texture, color: 0xffffff });
            const plane = new THREE.Mesh(geometry, material);
            scene.add(plane);

            material.transparent = true;
            material.premultipliedAlpha = true;  // if your data has alpha


            renderer.render(scene, camera);
            // console.log("recreate stuff");
            this.texture = texture;
            this.renderer = renderer;
            this.camera = camera;
            this.scene = scene;
        };

        const fun2 = () => {
            // console.log("fun2 running");
            if (!this.texture || !this.renderer || !this.scene || !this.camera) {
                return;
            }
            // console.log("fun2 running A");
            const { width, height } = this.getImageDimensions();
            if (this.playing === true) {
                processData();
            }

            // console.log("fun2 running B");
            this.texture.needsUpdate = true; // upload changes to GPU
            this.texture.generateMipmaps = false;
            // this.texture.minFilter = THREE.LinearFilter; // No mipmaps, direct filtering
            this.texture.minFilter = THREE.NearestFilter;
            this.texture.magFilter = THREE.NearestFilter;

            this.renderer.render(this.scene, this.camera);
        };

        React.useEffect(fun1);
        React.useEffect(fun2);

        return (
            <div ref={mountRef}
                style={{
                    width: Math.min(this.getAllStyle()["width"], this.getAllStyle()["height"]),
                    height: Math.min(this.getAllStyle()["width"], this.getAllStyle()["height"])
                }}

                onMouseDown={(event: any) => {
                    window.addEventListener("mousemove", this.panImageEventListener);
                    window.addEventListener("mouseup", this.cancelPanImageEventListener);
                }}

                onWheel={(event: any) => {
                    event.preventDefault();

                    const zoomFactor = event.deltaY < 0 ? 1.1 : 1 / 1.1;

                    if (!this.camera || !mountRef.current) return;

                    const rect = mountRef.current.getBoundingClientRect();

                    // Mouse position in NDC (-1 to +1)
                    const ndcX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
                    const ndcY = -((event.clientY - rect.top) / rect.height) * 2 + 1;

                    // Convert NDC → world coordinates
                    const mouseWorld = new THREE.Vector3(ndcX, ndcY, 0);
                    mouseWorld.unproject(this.camera);

                    this.zoomImage(zoomFactor, mouseWorld.x, mouseWorld.y);
                }}

            >
            </div>
        );
    };


    processData = () => {
        const { width, height } = this.getImageDimensions();
        const size = width * height;
        this.imageHeight = height;
        this.imageWidth = width;
        if (size === 0) {
            Log.error("Image size is 0");
            return;
        }
        if (this.textureData === undefined) {
            this.textureData = new Uint8Array(size * 4); // RGB!
        }

        const dataRaw = this.getImageValue();
        if (dataRaw === undefined || dataRaw.length !== size) {
            Log.error("Image size does not match image data length");
            return;
        }
        const minValue = Math.min(...dataRaw);
        const maxValue = Math.max(...dataRaw);

        const currentColorMap = this.getText()["colorMap"];
        let colorMapFunc = this.colorMapFunctions[currentColorMap];
        if (colorMapFunc === undefined) {
            colorMapFunc = this.grayColorMap;
        }

        for (let ii = 0; ii < dataRaw.length; ii++) {
            const normalized = Math.round((dataRaw[ii] - minValue) / (maxValue - minValue) * 255);
            const [r, g, b] = colorMapFunc(normalized);
            const idx = ii * 4;
            this.textureData[idx] = r;
            this.textureData[idx + 1] = g;
            this.textureData[idx + 2] = b;
            this.textureData[idx + 3] = 255; // opaque

        }
    };

    jetColorMap = (value: number) => {
        // value is 0–255
        const fourValue = 4 * (value / 255);
        const r = Math.min(Math.max(Math.min(fourValue - 1.5, -fourValue + 4.5), 0), 1);
        const g = Math.min(Math.max(Math.min(fourValue - 0.5, -fourValue + 3.5), 0), 1);
        const b = Math.min(Math.max(Math.min(fourValue + 0.5, -fourValue + 2.5), 0), 1);
        return [
            Math.round(r * 255),
            Math.round(g * 255),
            Math.round(b * 255)
        ];
    }

    hotColorMap = (value: number) => {
        const idx = Math.floor(value) * 4;
        return (
            [
                this.hotColorMapArray[idx],
                this.hotColorMapArray[idx + 1],
                this.hotColorMapArray[idx + 2],
            ]
        )
    }

    coolColorMap = (value: number) => {
        const idx = Math.floor(value) * 4;
        return (
            [
                this.coolColorMapArray[idx],
                this.coolColorMapArray[idx + 1],
                this.coolColorMapArray[idx + 2],
            ]
        )
    }

    createHotColormapArray = () => {
        const lut = [];
        const steps = 256;

        for (let i = 0; i < steps; i++) {
            const t = i / (steps - 1);

            let r, g, b;
            if (t < 1 / 3) {
                // black → red
                r = t * 3;
                g = 0;
                b = 0;
            } else if (t < 2 / 3) {
                // red → yellow
                r = 1;
                g = (t - 1 / 3) * 3;
                b = 0;
            } else {
                // yellow → white
                r = 1;
                g = 1;
                b = (t - 2 / 3) * 3;
            }

            lut.push(Math.floor(r * 255), Math.floor(g * 255), Math.floor(b * 255), 255);
        }

        return lut; // Uint8 array for mapping
    }

    hotColorMapArray = this.createHotColormapArray();

    grayColorMap = (value: number) => {
        // value is 0–255
        return (
            [
                value,
                value,
                value
            ]
        );
    }

    createCoolColormapArray = () => {
        const lut = [];
        const steps = 256;

        for (let i = 0; i < steps; i++) {
            const t = i / (steps - 1);

            // Cyan to Purple
            // Cyan RGB = (0, 1, 1)
            // Purple RGB = (1, 0, 1)
            // Interpolate linearly for R and G; B stays 1

            const r = t;          // from 0 to 1
            const g = 1 - t;      // from 1 to 0
            const b = 1;          // always 1

            lut.push(Math.floor(r * 255), Math.floor(g * 255), Math.floor(b * 255), 255);
        }

        return lut;
    }

    coolColorMapArray = this.createCoolColormapArray();

    viridisColorMapArray0 = [[253, 231, 37],
    [251, 231, 35],
    [248, 230, 33],
    [246, 230, 32],
    [244, 230, 30],
    [241, 229, 29],
    [239, 229, 28],
    [236, 229, 27],
    [234, 229, 26],
    [231, 228, 25],
    [229, 228, 25],
    [226, 228, 24],
    [223, 227, 24],
    [221, 227, 24],
    [218, 227, 25],
    [216, 226, 25],
    [213, 226, 26],
    [210, 226, 27],
    [208, 225, 28],
    [205, 225, 29],
    [202, 225, 31],
    [200, 224, 32],
    [197, 224, 33],
    [194, 223, 35],
    [192, 223, 37],
    [189, 223, 38],
    [186, 222, 40],
    [184, 222, 41],
    [181, 222, 43],
    [178, 221, 45],
    [176, 221, 47],
    [173, 220, 48],
    [170, 220, 50],
    [168, 219, 52],
    [165, 219, 54],
    [162, 218, 55],
    [160, 218, 57],
    [157, 217, 59],
    [155, 217, 60],
    [152, 216, 62],
    [149, 216, 64],
    [147, 215, 65],
    [144, 215, 67],
    [142, 214, 69],
    [139, 214, 70],
    [137, 213, 72],
    [134, 213, 73],
    [132, 212, 75],
    [129, 211, 77],
    [127, 211, 78],
    [124, 210, 80],
    [122, 209, 81],
    [119, 209, 83],
    [117, 208, 84],
    [115, 208, 86],
    [112, 207, 87],
    [110, 206, 88],
    [108, 205, 90],
    [105, 205, 91],
    [103, 204, 92],
    [101, 203, 94],
    [99, 203, 95],
    [96, 202, 96],
    [94, 201, 98],
    [92, 200, 99],
    [90, 200, 100],
    [88, 199, 101],
    [86, 198, 103],
    [84, 197, 104],
    [82, 197, 105],
    [80, 196, 106],
    [78, 195, 107],
    [76, 194, 108],
    [74, 193, 109],
    [72, 193, 110],
    [70, 192, 111],
    [68, 191, 112],
    [66, 190, 113],
    [64, 189, 114],
    [63, 188, 115],
    [61, 188, 116],
    [59, 187, 117],
    [58, 186, 118],
    [56, 185, 119],
    [55, 184, 120],
    [53, 183, 121],
    [52, 182, 121],
    [50, 182, 122],
    [49, 181, 123],
    [47, 180, 124],
    [46, 179, 124],
    [45, 178, 125],
    [44, 177, 126],
    [42, 176, 127],
    [41, 175, 127],
    [40, 174, 128],
    [39, 173, 129],
    [38, 173, 129],
    [37, 172, 130],
    [37, 171, 130],
    [36, 170, 131],
    [35, 169, 131],
    [34, 168, 132],
    [34, 167, 133],
    [33, 166, 133],
    [33, 165, 133],
    [32, 164, 134],
    [32, 163, 134],
    [31, 162, 135],
    [31, 161, 135],
    [31, 161, 136],
    [31, 160, 136],
    [31, 159, 136],
    [31, 158, 137],
    [30, 157, 137],
    [30, 156, 137],
    [30, 155, 138],
    [31, 154, 138],
    [31, 153, 138],
    [31, 152, 139],
    [31, 151, 139],
    [31, 150, 139],
    [31, 149, 139],
    [31, 148, 140],
    [32, 147, 140],
    [32, 146, 140],
    [32, 146, 140],
    [33, 145, 140],
    [33, 144, 141],
    [33, 143, 141],
    [33, 142, 141],
    [34, 141, 141],
    [34, 140, 141],
    [34, 139, 141],
    [35, 138, 141],
    [35, 137, 142],
    [35, 136, 142],
    [36, 135, 142],
    [36, 134, 142],
    [37, 133, 142],
    [37, 132, 142],
    [37, 131, 142],
    [38, 130, 142],
    [38, 130, 142],
    [38, 129, 142],
    [39, 128, 142],
    [39, 127, 142],
    [39, 126, 142],
    [40, 125, 142],
    [40, 124, 142],
    [41, 123, 142],
    [41, 122, 142],
    [41, 121, 142],
    [42, 120, 142],
    [42, 119, 142],
    [42, 118, 142],
    [43, 117, 142],
    [43, 116, 142],
    [44, 115, 142],
    [44, 114, 142],
    [44, 113, 142],
    [45, 113, 142],
    [45, 112, 142],
    [46, 111, 142],
    [46, 110, 142],
    [46, 109, 142],
    [47, 108, 142],
    [47, 107, 142],
    [48, 106, 142],
    [48, 105, 142],
    [49, 104, 142],
    [49, 103, 142],
    [49, 102, 142],
    [50, 101, 142],
    [50, 100, 142],
    [51, 99, 141],
    [51, 98, 141],
    [52, 97, 141],
    [52, 96, 141],
    [53, 95, 141],
    [53, 94, 141],
    [54, 93, 141],
    [54, 92, 141],
    [55, 91, 141],
    [55, 90, 140],
    [56, 89, 140],
    [56, 88, 140],
    [57, 86, 140],
    [57, 85, 140],
    [58, 84, 140],
    [58, 83, 139],
    [59, 82, 139],
    [59, 81, 139],
    [60, 80, 139],
    [60, 79, 138],
    [61, 78, 138],
    [61, 77, 138],
    [62, 76, 138],
    [62, 74, 137],
    [62, 73, 137],
    [63, 72, 137],
    [63, 71, 136],
    [64, 70, 136],
    [64, 69, 136],
    [65, 68, 135],
    [65, 66, 135],
    [66, 65, 134],
    [66, 64, 134],
    [66, 63, 133],
    [67, 62, 133],
    [67, 61, 132],
    [68, 59, 132],
    [68, 58, 131],
    [68, 57, 131],
    [69, 56, 130],
    [69, 55, 129],
    [69, 53, 129],
    [70, 52, 128],
    [70, 51, 127],
    [70, 50, 126],
    [70, 48, 126],
    [71, 47, 125],
    [71, 46, 124],
    [71, 45, 123],
    [71, 44, 122],
    [71, 42, 122],
    [72, 41, 121],
    [72, 40, 120],
    [72, 38, 119],
    [72, 37, 118],
    [72, 36, 117],
    [72, 35, 116],
    [72, 33, 115],
    [72, 32, 113],
    [72, 31, 112],
    [72, 29, 111],
    [72, 28, 110],
    [72, 27, 109],
    [72, 26, 108],
    [72, 24, 106],
    [72, 23, 105],
    [72, 22, 104],
    [72, 20, 103],
    [71, 19, 101],
    [71, 17, 100],
    [71, 16, 99],
    [71, 14, 97],
    [71, 13, 96],
    [70, 11, 94],
    [70, 10, 93],
    [70, 8, 92],
    [70, 7, 90],
    [69, 5, 89],
    [69, 4, 87],
    [68, 2, 86],
    [68, 1, 84]];

    viridisColorMapArray = this.viridisColorMapArray0.reverse().flat();

    coolWarmColorMapArray = [
        58, 76, 192,
        59, 77, 193,
        60, 79, 195,
        62, 81, 196,
        63, 83, 198,
        64, 84, 199,
        65, 86, 201,
        66, 88, 202,
        67, 90, 204,
        69, 91, 205,
        70, 93, 207,
        71, 95, 208,
        72, 96, 209,
        73, 98, 211,
        75, 100, 212,
        76, 102, 214,
        77, 103, 215,
        78, 105, 216,
        80, 107, 218,
        81, 108, 219,
        82, 110, 220,
        83, 112, 221,
        85, 113, 222,
        86, 115, 224,
        87, 117, 225,
        88, 118, 226,
        90, 120, 227,
        91, 121, 228,
        92, 123, 229,
        93, 125, 230,
        95, 126, 231,
        96, 128, 232,
        97, 130, 234,
        99, 131, 234,
        100, 133, 235,
        101, 134, 236,
        103, 136, 237,
        104, 137, 238,
        105, 139, 239,
        107, 141, 240,
        108, 142, 241,
        109, 144, 241,
        111, 145, 242,
        112, 147, 243,
        113, 148, 244,
        115, 149, 244,
        116, 151, 245,
        117, 152, 246,
        119, 154, 246,
        120, 155, 247,
        122, 157, 248,
        123, 158, 248,
        124, 160, 249,
        126, 161, 249,
        127, 162, 250,
        128, 164, 250,
        130, 165, 251,
        131, 166, 251,
        133, 168, 251,
        134, 169, 252,
        135, 170, 252,
        137, 172, 252,
        138, 173, 253,
        139, 174, 253,
        141, 175, 253,
        142, 177, 253,
        144, 178, 254,
        145, 179, 254,
        146, 180, 254,
        148, 181, 254,
        149, 183, 254,
        151, 184, 254,
        152, 185, 254,
        153, 186, 254,
        155, 187, 254,
        156, 188, 254,
        157, 189, 254,
        159, 190, 254,
        160, 191, 254,
        162, 192, 254,
        163, 193, 254,
        164, 194, 254,
        166, 195, 253,
        167, 196, 253,
        168, 197, 253,
        170, 198, 253,
        171, 199, 252,
        172, 200, 252,
        174, 201, 252,
        175, 202, 251,
        176, 203, 251,
        178, 203, 251,
        179, 204, 250,
        180, 205, 250,
        182, 206, 249,
        183, 207, 249,
        184, 207, 248,
        185, 208, 248,
        187, 209, 247,
        188, 209, 246,
        189, 210, 246,
        190, 211, 245,
        192, 211, 245,
        193, 212, 244,
        194, 212, 243,
        195, 213, 242,
        197, 213, 242,
        198, 214, 241,
        199, 214, 240,
        200, 215, 239,
        201, 215, 238,
        202, 216, 238,
        204, 216, 237,
        205, 217, 236,
        206, 217, 235,
        207, 217, 234,
        208, 218, 233,
        209, 218, 232,
        210, 218, 231,
        211, 219, 230,
        213, 219, 229,
        214, 219, 228,
        215, 219, 226,
        216, 219, 225,
        217, 220, 224,
        218, 220, 223,
        219, 220, 222,
        220, 220, 221,
        221, 220, 219,
        222, 219, 218,
        223, 219, 217,
        224, 218, 215,
        225, 218, 214,
        226, 217, 212,
        227, 217, 211,
        228, 216, 209,
        229, 216, 208,
        230, 215, 207,
        231, 214, 205,
        231, 214, 204,
        232, 213, 202,
        233, 212, 201,
        234, 211, 199,
        235, 211, 198,
        236, 210, 196,
        236, 209, 195,
        237, 208, 193,
        237, 207, 192,
        238, 207, 190,
        239, 206, 188,
        239, 205, 187,
        240, 204, 185,
        241, 203, 184,
        241, 202, 182,
        242, 201, 181,
        242, 200, 179,
        242, 199, 178,
        243, 198, 176,
        243, 197, 175,
        244, 196, 173,
        244, 195, 171,
        244, 194, 170,
        245, 193, 168,
        245, 192, 167,
        245, 191, 165,
        246, 189, 164,
        246, 188, 162,
        246, 187, 160,
        246, 186, 159,
        246, 185, 157,
        246, 183, 156,
        246, 182, 154,
        247, 181, 152,
        247, 179, 151,
        247, 178, 149,
        247, 177, 148,
        247, 176, 146,
        247, 174, 145,
        247, 173, 143,
        246, 171, 141,
        246, 170, 140,
        246, 169, 138,
        246, 167, 137,
        246, 166, 135,
        246, 164, 134,
        246, 163, 132,
        245, 161, 130,
        245, 160, 129,
        245, 158, 127,
        244, 157, 126,
        244, 155, 124,
        244, 154, 123,
        243, 152, 121,
        243, 150, 120,
        243, 149, 118,
        242, 147, 117,
        242, 145, 115,
        241, 144, 114,
        241, 142, 112,
        240, 141, 111,
        240, 139, 109,
        239, 137, 108,
        238, 135, 106,
        238, 134, 105,
        237, 132, 103,
        236, 130, 102,
        236, 128, 100,
        235, 127, 99,
        234, 125, 97,
        234, 123, 96,
        233, 121, 94,
        232, 119, 93,
        231, 117, 92,
        230, 116, 90,
        230, 114, 89,
        229, 112, 87,
        228, 110, 86,
        227, 108, 84,
        226, 106, 83,
        225, 104, 82,
        224, 102, 80,
        223, 100, 79,
        222, 98, 78,
        221, 96, 76,
        220, 94, 75,
        219, 92, 74,
        218, 90, 72,
        217, 88, 71,
        216, 86, 70,
        215, 84, 68,
        214, 82, 67,
        212, 79, 66,
        211, 77, 64,
        210, 75, 63,
        209, 73, 62,
        207, 70, 61,
        206, 68, 60,
        205, 66, 58,
        204, 63, 57,
        202, 61, 56,
        201, 59, 55,
        200, 56, 53,
        198, 53, 52,
        197, 50, 51,
        196, 48, 50,
        194, 45, 49,
        193, 42, 48,
        191, 40, 46,
        190, 35, 45,
        188, 31, 44,
        187, 26, 43,
        185, 22, 42,
        184, 17, 41,
        182, 13, 40,
        181, 8, 39,
        179, 3, 38,
    ];

    viridisColorMap = (value: number) => {
        const idx = Math.round(value) * 3;
        return (
            [
                this.viridisColorMapArray[idx],
                this.viridisColorMapArray[idx + 1],
                this.viridisColorMapArray[idx + 2],
            ]
        )
    }

    coolWarmColorMap = (value: number) => {
        const idx = Math.round(value) * 3;
        return (
            [
                this.coolWarmColorMapArray[idx],
                this.coolWarmColorMapArray[idx + 1],
                this.coolWarmColorMapArray[idx + 2],
            ]
        )
    }

    seimsicColorMapArray = [
        0, 0, 76,
        0, 0, 79,
        0, 0, 82,
        0, 0, 84,
        0, 0, 87,
        0, 0, 90,
        0, 0, 93,
        0, 0, 96,
        0, 0, 98,
        0, 0, 101,
        0, 0, 104,
        0, 0, 107,
        0, 0, 110,
        0, 0, 112,
        0, 0, 115,
        0, 0, 118,
        0, 0, 121,
        0, 0, 124,
        0, 0, 126,
        0, 0, 129,
        0, 0, 132,
        0, 0, 135,
        0, 0, 138,
        0, 0, 140,
        0, 0, 143,
        0, 0, 146,
        0, 0, 149,
        0, 0, 152,
        0, 0, 154,
        0, 0, 157,
        0, 0, 160,
        0, 0, 163,
        0, 0, 166,
        0, 0, 168,
        0, 0, 171,
        0, 0, 174,
        0, 0, 177,
        0, 0, 180,
        0, 0, 182,
        0, 0, 185,
        0, 0, 188,
        0, 0, 191,
        0, 0, 194,
        0, 0, 196,
        0, 0, 199,
        0, 0, 202,
        0, 0, 205,
        0, 0, 208,
        0, 0, 210,
        0, 0, 213,
        0, 0, 216,
        0, 0, 219,
        0, 0, 222,
        0, 0, 224,
        0, 0, 227,
        0, 0, 230,
        0, 0, 233,
        0, 0, 236,
        0, 0, 238,
        0, 0, 241,
        0, 0, 244,
        0, 0, 247,
        0, 0, 250,
        0, 0, 252,
        1, 1, 255,
        5, 5, 255,
        8, 8, 255,
        13, 13, 255,
        17, 17, 255,
        21, 21, 255,
        25, 25, 255,
        29, 29, 255,
        33, 33, 255,
        37, 37, 255,
        40, 40, 255,
        45, 45, 255,
        49, 49, 255,
        53, 53, 255,
        57, 57, 255,
        61, 61, 255,
        65, 65, 255,
        69, 69, 255,
        72, 72, 255,
        77, 77, 255,
        81, 81, 255,
        85, 85, 255,
        89, 89, 255,
        93, 93, 255,
        97, 97, 255,
        101, 101, 255,
        104, 104, 255,
        109, 109, 255,
        113, 113, 255,
        117, 117, 255,
        121, 121, 255,
        125, 125, 255,
        129, 129, 255,
        133, 133, 255,
        136, 136, 255,
        141, 141, 255,
        145, 145, 255,
        149, 149, 255,
        153, 153, 255,
        157, 157, 255,
        161, 161, 255,
        165, 165, 255,
        168, 168, 255,
        173, 173, 255,
        177, 177, 255,
        181, 181, 255,
        185, 185, 255,
        189, 189, 255,
        193, 193, 255,
        197, 197, 255,
        200, 200, 255,
        205, 205, 255,
        209, 209, 255,
        213, 213, 255,
        217, 217, 255,
        221, 221, 255,
        225, 225, 255,
        229, 229, 255,
        232, 232, 255,
        237, 237, 255,
        241, 241, 255,
        245, 245, 255,
        249, 249, 255,
        253, 253, 255,
        255, 253, 253,
        255, 249, 249,
        255, 245, 245,
        255, 241, 241,
        255, 237, 237,
        255, 233, 233,
        255, 229, 229,
        255, 225, 225,
        255, 221, 221,
        255, 217, 217,
        255, 213, 213,
        255, 209, 209,
        255, 205, 205,
        255, 201, 201,
        255, 197, 197,
        255, 193, 193,
        255, 189, 189,
        255, 185, 185,
        255, 180, 180,
        255, 177, 177,
        255, 173, 173,
        255, 169, 169,
        255, 164, 164,
        255, 161, 161,
        255, 157, 157,
        255, 153, 153,
        255, 148, 148,
        255, 145, 145,
        255, 141, 141,
        255, 137, 137,
        255, 132, 132,
        255, 129, 129,
        255, 125, 125,
        255, 121, 121,
        255, 117, 117,
        255, 113, 113,
        255, 109, 109,
        255, 105, 105,
        255, 101, 101,
        255, 97, 97,
        255, 93, 93,
        255, 89, 89,
        255, 85, 85,
        255, 81, 81,
        255, 77, 77,
        255, 73, 73,
        255, 69, 69,
        255, 65, 65,
        255, 61, 61,
        255, 56, 56,
        255, 53, 53,
        255, 48, 48,
        255, 45, 45,
        255, 40, 40,
        255, 37, 37,
        255, 32, 32,
        255, 29, 29,
        255, 24, 24,
        255, 21, 21,
        255, 16, 16,
        255, 13, 13,
        255, 8, 8,
        255, 5, 5,
        255, 0, 0,
        253, 0, 0,
        251, 0, 0,
        249, 0, 0,
        247, 0, 0,
        245, 0, 0,
        243, 0, 0,
        241, 0, 0,
        239, 0, 0,
        237, 0, 0,
        235, 0, 0,
        233, 0, 0,
        231, 0, 0,
        229, 0, 0,
        227, 0, 0,
        225, 0, 0,
        223, 0, 0,
        221, 0, 0,
        219, 0, 0,
        217, 0, 0,
        215, 0, 0,
        213, 0, 0,
        211, 0, 0,
        209, 0, 0,
        207, 0, 0,
        205, 0, 0,
        203, 0, 0,
        201, 0, 0,
        199, 0, 0,
        197, 0, 0,
        195, 0, 0,
        193, 0, 0,
        191, 0, 0,
        189, 0, 0,
        187, 0, 0,
        185, 0, 0,
        183, 0, 0,
        181, 0, 0,
        179, 0, 0,
        177, 0, 0,
        175, 0, 0,
        173, 0, 0,
        171, 0, 0,
        169, 0, 0,
        167, 0, 0,
        165, 0, 0,
        163, 0, 0,
        161, 0, 0,
        159, 0, 0,
        157, 0, 0,
        155, 0, 0,
        153, 0, 0,
        151, 0, 0,
        149, 0, 0,
        147, 0, 0,
        145, 0, 0,
        143, 0, 0,
        141, 0, 0,
        139, 0, 0,
        137, 0, 0,
        135, 0, 0,
        133, 0, 0,
        131, 0, 0,
        129, 0, 0,
        127, 0, 0,];

    seimsicColorMap = (value: number) => {
        const idx = Math.round(value) * 3;
        return (
            [
                this.seimsicColorMapArray[idx],
                this.seimsicColorMapArray[idx + 1],
                this.seimsicColorMapArray[idx + 2],
            ]
        )
    }


    plasmaColorMapArray = [
        12, 7, 134,
        16, 7, 135,
        19, 6, 137,
        21, 6, 138,
        24, 6, 139,
        27, 6, 140,
        29, 6, 141,
        31, 5, 142,
        33, 5, 143,
        35, 5, 144,
        37, 5, 145,
        39, 5, 146,
        41, 5, 147,
        43, 5, 148,
        45, 4, 148,
        47, 4, 149,
        49, 4, 150,
        51, 4, 151,
        52, 4, 152,
        54, 4, 152,
        56, 4, 153,
        58, 4, 154,
        59, 3, 154,
        61, 3, 155,
        63, 3, 156,
        64, 3, 156,
        66, 3, 157,
        68, 3, 158,
        69, 3, 158,
        71, 2, 159,
        73, 2, 159,
        74, 2, 160,
        76, 2, 161,
        78, 2, 161,
        79, 2, 162,
        81, 1, 162,
        82, 1, 163,
        84, 1, 163,
        86, 1, 163,
        87, 1, 164,
        89, 1, 164,
        90, 0, 165,
        92, 0, 165,
        94, 0, 165,
        95, 0, 166,
        97, 0, 166,
        98, 0, 166,
        100, 0, 167,
        101, 0, 167,
        103, 0, 167,
        104, 0, 167,
        106, 0, 167,
        108, 0, 168,
        109, 0, 168,
        111, 0, 168,
        112, 0, 168,
        114, 0, 168,
        115, 0, 168,
        117, 0, 168,
        118, 1, 168,
        120, 1, 168,
        121, 1, 168,
        123, 2, 168,
        124, 2, 167,
        126, 3, 167,
        127, 3, 167,
        129, 4, 167,
        130, 4, 167,
        132, 5, 166,
        133, 6, 166,
        134, 7, 166,
        136, 7, 165,
        137, 8, 165,
        139, 9, 164,
        140, 10, 164,
        142, 12, 164,
        143, 13, 163,
        144, 14, 163,
        146, 15, 162,
        147, 16, 161,
        149, 17, 161,
        150, 18, 160,
        151, 19, 160,
        153, 20, 159,
        154, 21, 158,
        155, 23, 158,
        157, 24, 157,
        158, 25, 156,
        159, 26, 155,
        160, 27, 155,
        162, 28, 154,
        163, 29, 153,
        164, 30, 152,
        165, 31, 151,
        167, 33, 151,
        168, 34, 150,
        169, 35, 149,
        170, 36, 148,
        172, 37, 147,
        173, 38, 146,
        174, 39, 145,
        175, 40, 144,
        176, 42, 143,
        177, 43, 143,
        178, 44, 142,
        180, 45, 141,
        181, 46, 140,
        182, 47, 139,
        183, 48, 138,
        184, 50, 137,
        185, 51, 136,
        186, 52, 135,
        187, 53, 134,
        188, 54, 133,
        189, 55, 132,
        190, 56, 131,
        191, 57, 130,
        192, 59, 129,
        193, 60, 128,
        194, 61, 128,
        195, 62, 127,
        196, 63, 126,
        197, 64, 125,
        198, 65, 124,
        199, 66, 123,
        200, 68, 122,
        201, 69, 121,
        202, 70, 120,
        203, 71, 119,
        204, 72, 118,
        205, 73, 117,
        206, 74, 117,
        207, 75, 116,
        208, 77, 115,
        209, 78, 114,
        209, 79, 113,
        210, 80, 112,
        211, 81, 111,
        212, 82, 110,
        213, 83, 109,
        214, 85, 109,
        215, 86, 108,
        215, 87, 107,
        216, 88, 106,
        217, 89, 105,
        218, 90, 104,
        219, 91, 103,
        220, 93, 102,
        220, 94, 102,
        221, 95, 101,
        222, 96, 100,
        223, 97, 99,
        223, 98, 98,
        224, 100, 97,
        225, 101, 96,
        226, 102, 96,
        227, 103, 95,
        227, 104, 94,
        228, 106, 93,
        229, 107, 92,
        229, 108, 91,
        230, 109, 90,
        231, 110, 90,
        232, 112, 89,
        232, 113, 88,
        233, 114, 87,
        234, 115, 86,
        234, 116, 85,
        235, 118, 84,
        236, 119, 84,
        236, 120, 83,
        237, 121, 82,
        237, 123, 81,
        238, 124, 80,
        239, 125, 79,
        239, 126, 78,
        240, 128, 77,
        240, 129, 77,
        241, 130, 76,
        242, 132, 75,
        242, 133, 74,
        243, 134, 73,
        243, 135, 72,
        244, 137, 71,
        244, 138, 71,
        245, 139, 70,
        245, 141, 69,
        246, 142, 68,
        246, 143, 67,
        246, 145, 66,
        247, 146, 65,
        247, 147, 65,
        248, 149, 64,
        248, 150, 63,
        248, 152, 62,
        249, 153, 61,
        249, 154, 60,
        250, 156, 59,
        250, 157, 58,
        250, 159, 58,
        250, 160, 57,
        251, 162, 56,
        251, 163, 55,
        251, 164, 54,
        252, 166, 53,
        252, 167, 53,
        252, 169, 52,
        252, 170, 51,
        252, 172, 50,
        252, 173, 49,
        253, 175, 49,
        253, 176, 48,
        253, 178, 47,
        253, 179, 46,
        253, 181, 45,
        253, 182, 45,
        253, 184, 44,
        253, 185, 43,
        253, 187, 43,
        253, 188, 42,
        253, 190, 41,
        253, 192, 41,
        253, 193, 40,
        253, 195, 40,
        253, 196, 39,
        253, 198, 38,
        252, 199, 38,
        252, 201, 38,
        252, 203, 37,
        252, 204, 37,
        252, 206, 37,
        251, 208, 36,
        251, 209, 36,
        251, 211, 36,
        250, 213, 36,
        250, 214, 36,
        250, 216, 36,
        249, 217, 36,
        249, 219, 36,
        248, 221, 36,
        248, 223, 36,
        247, 224, 36,
        247, 226, 37,
        246, 228, 37,
        246, 229, 37,
        245, 231, 38,
        245, 233, 38,
        244, 234, 38,
        243, 236, 38,
        243, 238, 38,
        242, 240, 38,
        242, 241, 38,
        241, 243, 38,
        240, 245, 37,
        240, 246, 35,
        239, 248, 33,];

    plasmaColorMap = (value: number) => {
        const idx = Math.round(value) * 3;
        return (
            [
                this.plasmaColorMapArray[idx],
                this.plasmaColorMapArray[idx + 1],
                this.plasmaColorMapArray[idx + 2],
            ]
        )
    }

    infernoColorMapArray = [
        0, 0, 3,
        0, 0, 4,
        0, 0, 6,
        1, 0, 7,
        1, 1, 9,
        1, 1, 11,
        2, 1, 14,
        2, 2, 16,
        3, 2, 18,
        4, 3, 20,
        4, 3, 22,
        5, 4, 24,
        6, 4, 27,
        7, 5, 29,
        8, 6, 31,
        9, 6, 33,
        10, 7, 35,
        11, 7, 38,
        13, 8, 40,
        14, 8, 42,
        15, 9, 45,
        16, 9, 47,
        18, 10, 50,
        19, 10, 52,
        20, 11, 54,
        22, 11, 57,
        23, 11, 59,
        25, 11, 62,
        26, 11, 64,
        28, 12, 67,
        29, 12, 69,
        31, 12, 71,
        32, 12, 74,
        34, 11, 76,
        36, 11, 78,
        38, 11, 80,
        39, 11, 82,
        41, 11, 84,
        43, 10, 86,
        45, 10, 88,
        46, 10, 90,
        48, 10, 92,
        50, 9, 93,
        52, 9, 95,
        53, 9, 96,
        55, 9, 97,
        57, 9, 98,
        59, 9, 100,
        60, 9, 101,
        62, 9, 102,
        64, 9, 102,
        65, 9, 103,
        67, 10, 104,
        69, 10, 105,
        70, 10, 105,
        72, 11, 106,
        74, 11, 106,
        75, 12, 107,
        77, 12, 107,
        79, 13, 108,
        80, 13, 108,
        82, 14, 108,
        83, 14, 109,
        85, 15, 109,
        87, 15, 109,
        88, 16, 109,
        90, 17, 109,
        91, 17, 110,
        93, 18, 110,
        95, 18, 110,
        96, 19, 110,
        98, 20, 110,
        99, 20, 110,
        101, 21, 110,
        102, 21, 110,
        104, 22, 110,
        106, 23, 110,
        107, 23, 110,
        109, 24, 110,
        110, 24, 110,
        112, 25, 110,
        114, 25, 109,
        115, 26, 109,
        117, 27, 109,
        118, 27, 109,
        120, 28, 109,
        122, 28, 109,
        123, 29, 108,
        125, 29, 108,
        126, 30, 108,
        128, 31, 107,
        129, 31, 107,
        131, 32, 107,
        133, 32, 106,
        134, 33, 106,
        136, 33, 106,
        137, 34, 105,
        139, 34, 105,
        141, 35, 105,
        142, 36, 104,
        144, 36, 104,
        145, 37, 103,
        147, 37, 103,
        149, 38, 102,
        150, 38, 102,
        152, 39, 101,
        153, 40, 100,
        155, 40, 100,
        156, 41, 99,
        158, 41, 99,
        160, 42, 98,
        161, 43, 97,
        163, 43, 97,
        164, 44, 96,
        166, 44, 95,
        167, 45, 95,
        169, 46, 94,
        171, 46, 93,
        172, 47, 92,
        174, 48, 91,
        175, 49, 91,
        177, 49, 90,
        178, 50, 89,
        180, 51, 88,
        181, 51, 87,
        183, 52, 86,
        184, 53, 86,
        186, 54, 85,
        187, 55, 84,
        189, 55, 83,
        190, 56, 82,
        191, 57, 81,
        193, 58, 80,
        194, 59, 79,
        196, 60, 78,
        197, 61, 77,
        199, 62, 76,
        200, 62, 75,
        201, 63, 74,
        203, 64, 73,
        204, 65, 72,
        205, 66, 71,
        207, 68, 70,
        208, 69, 68,
        209, 70, 67,
        210, 71, 66,
        212, 72, 65,
        213, 73, 64,
        214, 74, 63,
        215, 75, 62,
        217, 77, 61,
        218, 78, 59,
        219, 79, 58,
        220, 80, 57,
        221, 82, 56,
        222, 83, 55,
        223, 84, 54,
        224, 86, 52,
        226, 87, 51,
        227, 88, 50,
        228, 90, 49,
        229, 91, 48,
        230, 92, 46,
        230, 94, 45,
        231, 95, 44,
        232, 97, 43,
        233, 98, 42,
        234, 100, 40,
        235, 101, 39,
        236, 103, 38,
        237, 104, 37,
        237, 106, 35,
        238, 108, 34,
        239, 109, 33,
        240, 111, 31,
        240, 112, 30,
        241, 114, 29,
        242, 116, 28,
        242, 117, 26,
        243, 119, 25,
        243, 121, 24,
        244, 122, 22,
        245, 124, 21,
        245, 126, 20,
        246, 128, 18,
        246, 129, 17,
        247, 131, 16,
        247, 133, 14,
        248, 135, 13,
        248, 136, 12,
        248, 138, 11,
        249, 140, 9,
        249, 142, 8,
        249, 144, 8,
        250, 145, 7,
        250, 147, 6,
        250, 149, 6,
        250, 151, 6,
        251, 153, 6,
        251, 155, 6,
        251, 157, 6,
        251, 158, 7,
        251, 160, 7,
        251, 162, 8,
        251, 164, 10,
        251, 166, 11,
        251, 168, 13,
        251, 170, 14,
        251, 172, 16,
        251, 174, 18,
        251, 176, 20,
        251, 177, 22,
        251, 179, 24,
        251, 181, 26,
        251, 183, 28,
        251, 185, 30,
        250, 187, 33,
        250, 189, 35,
        250, 191, 37,
        250, 193, 40,
        249, 195, 42,
        249, 197, 44,
        249, 199, 47,
        248, 201, 49,
        248, 203, 52,
        248, 205, 55,
        247, 207, 58,
        247, 209, 60,
        246, 211, 63,
        246, 213, 66,
        245, 215, 69,
        245, 217, 72,
        244, 219, 75,
        244, 220, 79,
        243, 222, 82,
        243, 224, 86,
        243, 226, 89,
        242, 228, 93,
        242, 230, 96,
        241, 232, 100,
        241, 233, 104,
        241, 235, 108,
        241, 237, 112,
        241, 238, 116,
        241, 240, 121,
        241, 242, 125,
        242, 243, 129,
        242, 244, 133,
        243, 246, 137,
        244, 247, 141,
        245, 248, 145,
        246, 250, 149,
        247, 251, 153,
        249, 252, 157,
        250, 253, 160,
        252, 254, 164,];

    infernoColorMap = (value: number) => {
        const idx = Math.round(value) * 3;
        return (
            [
                this.infernoColorMapArray[idx],
                this.infernoColorMapArray[idx + 1],
                this.infernoColorMapArray[idx + 2],
            ]
        )
    }



    magmaColorMapArray = [
        0, 0, 3,
        0, 0, 4,
        0, 0, 6,
        1, 0, 7,
        1, 1, 9,
        1, 1, 11,
        2, 2, 13,
        2, 2, 15,
        3, 3, 17,
        4, 3, 19,
        4, 4, 21,
        5, 4, 23,
        6, 5, 25,
        7, 5, 27,
        8, 6, 29,
        9, 7, 31,
        10, 7, 34,
        11, 8, 36,
        12, 9, 38,
        13, 10, 40,
        14, 10, 42,
        15, 11, 44,
        16, 12, 47,
        17, 12, 49,
        18, 13, 51,
        20, 13, 53,
        21, 14, 56,
        22, 14, 58,
        23, 15, 60,
        24, 15, 63,
        26, 16, 65,
        27, 16, 68,
        28, 16, 70,
        30, 16, 73,
        31, 17, 75,
        32, 17, 77,
        34, 17, 80,
        35, 17, 82,
        37, 17, 85,
        38, 17, 87,
        40, 17, 89,
        42, 17, 92,
        43, 17, 94,
        45, 16, 96,
        47, 16, 98,
        48, 16, 101,
        50, 16, 103,
        52, 16, 104,
        53, 15, 106,
        55, 15, 108,
        57, 15, 110,
        59, 15, 111,
        60, 15, 113,
        62, 15, 114,
        64, 15, 115,
        66, 15, 116,
        67, 15, 117,
        69, 15, 118,
        71, 15, 119,
        72, 16, 120,
        74, 16, 121,
        75, 16, 121,
        77, 17, 122,
        79, 17, 123,
        80, 18, 123,
        82, 18, 124,
        83, 19, 124,
        85, 19, 125,
        87, 20, 125,
        88, 21, 126,
        90, 21, 126,
        91, 22, 126,
        93, 23, 126,
        94, 23, 127,
        96, 24, 127,
        97, 24, 127,
        99, 25, 127,
        101, 26, 128,
        102, 26, 128,
        104, 27, 128,
        105, 28, 128,
        107, 28, 128,
        108, 29, 128,
        110, 30, 129,
        111, 30, 129,
        113, 31, 129,
        115, 31, 129,
        116, 32, 129,
        118, 33, 129,
        119, 33, 129,
        121, 34, 129,
        122, 34, 129,
        124, 35, 129,
        126, 36, 129,
        127, 36, 129,
        129, 37, 129,
        130, 37, 129,
        132, 38, 129,
        133, 38, 129,
        135, 39, 129,
        137, 40, 129,
        138, 40, 129,
        140, 41, 128,
        141, 41, 128,
        143, 42, 128,
        145, 42, 128,
        146, 43, 128,
        148, 43, 128,
        149, 44, 128,
        151, 44, 127,
        153, 45, 127,
        154, 45, 127,
        156, 46, 127,
        158, 46, 126,
        159, 47, 126,
        161, 47, 126,
        163, 48, 126,
        164, 48, 125,
        166, 49, 125,
        167, 49, 125,
        169, 50, 124,
        171, 51, 124,
        172, 51, 123,
        174, 52, 123,
        176, 52, 123,
        177, 53, 122,
        179, 53, 122,
        181, 54, 121,
        182, 54, 121,
        184, 55, 120,
        185, 55, 120,
        187, 56, 119,
        189, 57, 119,
        190, 57, 118,
        192, 58, 117,
        194, 58, 117,
        195, 59, 116,
        197, 60, 116,
        198, 60, 115,
        200, 61, 114,
        202, 62, 114,
        203, 62, 113,
        205, 63, 112,
        206, 64, 112,
        208, 65, 111,
        209, 66, 110,
        211, 66, 109,
        212, 67, 109,
        214, 68, 108,
        215, 69, 107,
        217, 70, 106,
        218, 71, 105,
        220, 72, 105,
        221, 73, 104,
        222, 74, 103,
        224, 75, 102,
        225, 76, 102,
        226, 77, 101,
        228, 78, 100,
        229, 80, 99,
        230, 81, 98,
        231, 82, 98,
        232, 84, 97,
        234, 85, 96,
        235, 86, 96,
        236, 88, 95,
        237, 89, 95,
        238, 91, 94,
        238, 93, 93,
        239, 94, 93,
        240, 96, 93,
        241, 97, 92,
        242, 99, 92,
        243, 101, 92,
        243, 103, 91,
        244, 104, 91,
        245, 106, 91,
        245, 108, 91,
        246, 110, 91,
        246, 112, 91,
        247, 113, 91,
        247, 115, 92,
        248, 117, 92,
        248, 119, 92,
        249, 121, 92,
        249, 123, 93,
        249, 125, 93,
        250, 127, 94,
        250, 128, 94,
        250, 130, 95,
        251, 132, 96,
        251, 134, 96,
        251, 136, 97,
        251, 138, 98,
        252, 140, 99,
        252, 142, 99,
        252, 144, 100,
        252, 146, 101,
        252, 147, 102,
        253, 149, 103,
        253, 151, 104,
        253, 153, 105,
        253, 155, 106,
        253, 157, 107,
        253, 159, 108,
        253, 161, 110,
        253, 162, 111,
        253, 164, 112,
        254, 166, 113,
        254, 168, 115,
        254, 170, 116,
        254, 172, 117,
        254, 174, 118,
        254, 175, 120,
        254, 177, 121,
        254, 179, 123,
        254, 181, 124,
        254, 183, 125,
        254, 185, 127,
        254, 187, 128,
        254, 188, 130,
        254, 190, 131,
        254, 192, 133,
        254, 194, 134,
        254, 196, 136,
        254, 198, 137,
        254, 199, 139,
        254, 201, 141,
        254, 203, 142,
        253, 205, 144,
        253, 207, 146,
        253, 209, 147,
        253, 210, 149,
        253, 212, 151,
        253, 214, 152,
        253, 216, 154,
        253, 218, 156,
        253, 220, 157,
        253, 221, 159,
        253, 223, 161,
        253, 225, 163,
        252, 227, 165,
        252, 229, 166,
        252, 230, 168,
        252, 232, 170,
        252, 234, 172,
        252, 236, 174,
        252, 238, 176,
        252, 240, 177,
        252, 241, 179,
        252, 243, 181,
        252, 245, 183,
        251, 247, 185,
        251, 249, 187,
        251, 250, 189,
        251, 252, 191,];

    magmaColorMap = (value: number) => {
        const idx = Math.round(value) * 3;
        return (
            [
                this.magmaColorMapArray[idx],
                this.magmaColorMapArray[idx + 1],
                this.magmaColorMapArray[idx + 2],
            ]
        )
    }

    cividisColorMapArray = [
        0, 34, 77,
        0, 35, 79,
        0, 35, 80,
        0, 36, 82,
        0, 37, 84,
        0, 38, 85,
        0, 38, 87,
        0, 39, 89,
        0, 40, 91,
        0, 40, 92,
        0, 41, 94,
        0, 42, 96,
        0, 42, 98,
        0, 43, 100,
        0, 44, 102,
        0, 44, 103,
        0, 45, 105,
        0, 46, 107,
        0, 47, 109,
        0, 47, 111,
        0, 48, 112,
        0, 48, 112,
        0, 49, 112,
        0, 49, 112,
        4, 50, 112,
        8, 51, 112,
        11, 51, 112,
        14, 52, 112,
        17, 53, 111,
        20, 54, 111,
        22, 54, 111,
        24, 55, 111,
        26, 56, 111,
        28, 56, 110,
        29, 57, 110,
        31, 58, 110,
        33, 59, 110,
        34, 59, 110,
        36, 60, 110,
        37, 61, 109,
        39, 61, 109,
        40, 62, 109,
        42, 63, 109,
        43, 63, 109,
        44, 64, 109,
        46, 65, 108,
        47, 66, 108,
        48, 66, 108,
        49, 67, 108,
        50, 68, 108,
        52, 68, 108,
        53, 69, 108,
        54, 70, 108,
        55, 70, 108,
        56, 71, 108,
        57, 72, 108,
        58, 72, 107,
        59, 73, 107,
        61, 74, 107,
        62, 75, 107,
        63, 75, 107,
        64, 76, 107,
        65, 77, 107,
        66, 77, 107,
        67, 78, 107,
        68, 79, 107,
        69, 79, 107,
        70, 80, 107,
        71, 81, 107,
        72, 81, 107,
        73, 82, 107,
        74, 83, 107,
        75, 84, 108,
        76, 84, 108,
        77, 85, 108,
        78, 86, 108,
        78, 86, 108,
        79, 87, 108,
        80, 88, 108,
        81, 88, 108,
        82, 89, 108,
        83, 90, 108,
        84, 90, 108,
        85, 91, 109,
        86, 92, 109,
        87, 93, 109,
        88, 93, 109,
        89, 94, 109,
        89, 95, 109,
        90, 95, 109,
        91, 96, 110,
        92, 97, 110,
        93, 97, 110,
        94, 98, 110,
        95, 99, 110,
        96, 100, 110,
        97, 100, 111,
        97, 101, 111,
        98, 102, 111,
        99, 102, 111,
        100, 103, 111,
        101, 104, 112,
        102, 105, 112,
        103, 105, 112,
        104, 106, 112,
        104, 107, 113,
        105, 107, 113,
        106, 108, 113,
        107, 109, 113,
        108, 109, 114,
        109, 110, 114,
        110, 111, 114,
        110, 112, 115,
        111, 112, 115,
        112, 113, 115,
        113, 114, 115,
        114, 115, 116,
        115, 115, 116,
        116, 116, 117,
        116, 117, 117,
        117, 117, 117,
        118, 118, 118,
        119, 119, 118,
        120, 120, 118,
        121, 120, 119,
        121, 121, 119,
        122, 122, 119,
        123, 123, 119,
        124, 123, 120,
        125, 124, 120,
        126, 125, 120,
        127, 125, 120,
        128, 126, 120,
        129, 127, 120,
        130, 128, 120,
        131, 128, 120,
        132, 129, 120,
        133, 130, 120,
        133, 131, 120,
        134, 131, 120,
        135, 132, 120,
        136, 133, 120,
        137, 134, 120,
        138, 134, 120,
        139, 135, 120,
        140, 136, 120,
        141, 137, 120,
        142, 137, 120,
        143, 138, 119,
        144, 139, 119,
        145, 140, 119,
        146, 140, 119,
        147, 141, 119,
        148, 142, 119,
        149, 143, 119,
        150, 143, 119,
        151, 144, 118,
        152, 145, 118,
        153, 146, 118,
        154, 147, 118,
        155, 147, 118,
        156, 148, 118,
        157, 149, 117,
        158, 150, 117,
        159, 150, 117,
        160, 151, 117,
        161, 152, 116,
        162, 153, 116,
        163, 154, 116,
        164, 154, 116,
        165, 155, 115,
        166, 156, 115,
        167, 157, 115,
        168, 158, 115,
        169, 158, 114,
        170, 159, 114,
        171, 160, 114,
        172, 161, 113,
        173, 162, 113,
        174, 162, 113,
        175, 163, 112,
        176, 164, 112,
        177, 165, 112,
        178, 166, 111,
        179, 166, 111,
        180, 167, 111,
        181, 168, 110,
        182, 169, 110,
        183, 170, 109,
        184, 171, 109,
        185, 171, 109,
        186, 172, 108,
        187, 173, 108,
        188, 174, 107,
        189, 175, 107,
        190, 176, 106,
        191, 176, 106,
        193, 177, 105,
        194, 178, 105,
        195, 179, 104,
        196, 180, 104,
        197, 181, 103,
        198, 181, 103,
        199, 182, 102,
        200, 183, 101,
        201, 184, 101,
        202, 185, 100,
        203, 186, 100,
        204, 187, 99,
        205, 188, 98,
        206, 188, 98,
        207, 189, 97,
        208, 190, 96,
        210, 191, 96,
        211, 192, 95,
        212, 193, 94,
        213, 194, 94,
        214, 195, 93,
        215, 195, 92,
        216, 196, 91,
        217, 197, 90,
        218, 198, 90,
        219, 199, 89,
        220, 200, 88,
        222, 201, 87,
        223, 202, 86,
        224, 203, 85,
        225, 204, 84,
        226, 204, 83,
        227, 205, 82,
        228, 206, 81,
        229, 207, 80,
        230, 208, 79,
        232, 209, 78,
        233, 210, 77,
        234, 211, 76,
        235, 212, 75,
        236, 213, 74,
        237, 214, 72,
        238, 215, 71,
        239, 216, 70,
        241, 217, 68,
        242, 218, 67,
        243, 218, 66,
        244, 219, 64,
        245, 220, 63,
        246, 221, 61,
        248, 222, 59,
        249, 223, 58,
        250, 224, 56,
        251, 225, 54,
        253, 226, 52,
        253, 227, 51,
        253, 229, 52,
        253, 230, 54,
        253, 231, 55,
    ];

    cividisColorMap = (value: number) => {
        const idx = Math.round(value) * 3;
        return (
            [
                this.cividisColorMapArray[idx],
                this.cividisColorMapArray[idx + 1],
                this.cividisColorMapArray[idx + 2],
            ]
        )
    }

    colorMapFunctions: Record<string, any> = {
        gray: this.grayColorMap,
        hot: this.hotColorMap,
        cool: this.coolColorMap,
        jet: this.jetColorMap,
        viridis: this.viridisColorMap,
        coolwarm: this.coolWarmColorMap,
        seimsic: this.seimsicColorMap,
        plasma: this.plasmaColorMap,
        inferno: this.infernoColorMap,
        magma: this.magmaColorMap,
        cividis: this.cividisColorMap,
    }



    calcPixelSize = () => {
        const { width, height } = this.getImageDimensions();

        if (width === 0 || height === 0) {
            return -1;
        }

        if (this.camera === undefined || this.scene === undefined || this.renderer === undefined) {
            return -1;
        }
        const camera = this.camera;

        const viewportWidthInWorld = camera.right - camera.left;
        const viewportHeightInWorld = camera.top - camera.bottom;

        const worldPerPixelX = this.renderer?.domElement.clientWidth / viewportWidthInWorld;
        const worldPerPixelY = this.renderer?.domElement.clientHeight / viewportHeightInWorld;
        return worldPerPixelX;
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
        // {index: number, value: number[]}
        const choiceValue = g_widgets1.getChannelValue(this.getChannelNames()[0]) as any;

        if (typeof choiceValue === "object") {
            return choiceValue["value"];
        }
        return undefined;
    }

    getImageDimensions = () => {
        try {
            const channel = g_widgets1.getTcaChannel(this.getChannelNames()[0]);
            const dbrData = channel.getDbrData();
            if (dbrData !== undefined) {
                const dimension = dbrData["dimension"];
                if (dimension !== undefined && dimension.length >= 2) {
                    if (typeof dimension[0]["size"] === "number" && typeof dimension[1]["size"] === "number") {
                        return {
                            width: dimension[0]["size"],
                            height: dimension[1]["size"]
                        };
                    }
                }
            }
        } catch (e) {
            Log.error("Image getImageDimensions error: ", e);
        }
        return { width: 0, height: 0 };
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
    // _showSidebar()
    // _showResizers()
    // _useMemoedElement()
    // hasChannel()
    // isInGroup()
    // isSelected()
    // _getElementAreaRawOutlineStyle()

    _parseChannelValueElement = (channelValueElement: number | string | boolean | undefined): string => {


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
            return this._parseChannelValueElement(channelValue);
        } else if (Array.isArray(channelValue)) {
            const result: any[] = [];
            for (let element of channelValue) {
                result.push(this._parseChannelValueElement(element));
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

    // ----------------------- styles -----------------------

    // defined in super class
    // _resizerStyle
    // _resizerStyles
    // StyledToolTipText
    // StyledToolTip

    // -------------------------- tdl -------------------------------

    // properties when we create a new TextUpdate
    // the level 1 properties all have corresponding public or private variable in the widget

    static _defaultTdl: type_Image_tdl = {
        type: "Image",
        widgetKey: "", // "key" is a reserved keyword
        key: "",
        style: {
            // basics
            position: "absolute",
            display: "inline-flex",
            // dimensions
            left: 100,
            top: 100,
            width: 100,
            height: 100,
            backgroundColor: "rgba(240, 240, 240, 1)",
            // angle
            transform: "rotate(0deg)",
            // border, it is different from the "alarmBorder" below,
            borderStyle: "solid",
            borderWidth: 0,
            borderColor: "rgba(0, 0, 0, 1)",
            // font
            color: "rgba(0,0,0,1)",
            fontFamily: GlobalVariables.defaultFontFamily,
            fontSize: GlobalVariables.defaultFontSize,
            fontStyle: GlobalVariables.defaultFontStyle,
            fontWeight: GlobalVariables.defaultFontWeight,
            // shows when the widget is selected
            outlineStyle: "none",
            outlineWidth: 1,
            outlineColor: "black",
        },
        text: {
            // text
            horizontalAlign: "flex-start",
            verticalAlign: "flex-start",
            wrapWord: false,
            showUnit: true,
            invisibleInOperation: false,
            // default, decimal, exponential, hexadecimal
            format: "default",
            // scale, >= 0
            scale: 0,
            // actually "alarm outline"
            alarmBorder: true,
            alarmText: false,
            alarmBackground: false,
            alarmLevel: "MINOR",
            colorMap: "gray", // "jet", "gray"
        },
        channelNames: [],
        groupNames: [],
        rules: [],
    };

    // not getDefaultTdl(), always generate a new key
    static generateDefaultTdl = (type: string): Record<string, any> => {
        const result = super.generateDefaultTdl(type);
        result.style = JSON.parse(JSON.stringify(this._defaultTdl.style));
        result.text = JSON.parse(JSON.stringify(this._defaultTdl.text));
        result.channelNames = JSON.parse(JSON.stringify(this._defaultTdl.channelNames));
        result.groupNames = JSON.parse(JSON.stringify(this._defaultTdl.groupNames));
        return result;
    };

    // defined in super class
    // getTdlCopy()

    // --------------------- getters -------------------------

    // defined in super class
    // getType()
    // getWidgetKey()
    // getStyle()
    // getText()
    // getSidebar()
    // getGroupName()
    // getGroupNames()
    // getUpdateFromWidget()
    // getResizerStyle()
    // getResizerStyles()
    // getRules()

    // ---------------------- setters -------------------------

    // ---------------------- channels ------------------------

    // defined in super class
    // getChannelNames()
    // expandChannelNames()
    // getExpandedChannelNames()
    // setExpandedChannelNames()
    // expandChannelNameMacro()

    // ------------------------ z direction --------------------------

    // defined in super class
    // moveInZ()

    // --------------------- sidebar --------------------------
    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new ImageSidebar(this);
        }
    }

    jobsAsEditingModeBegins(): void {
        super.jobsAsEditingModeBegins();
        this.resetImage();
    }


    jobsAsOperatingModeBegins(): void {
        super.jobsAsOperatingModeBegins();
        this.resetImage();
    }
}
