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


    zoomImage1 = (zoom: number, centerX: number, centerY: number) => {
        if (this.camera === undefined || this.scene === undefined) {
            return;
        }
        this.zoomLevel = zoom;
        const { width, height } = this.getImageDimensions();
        const camera = this.camera;
        const newLeft = (1 - 1 / this.zoomLevel) * centerX - width / 2 / this.zoomLevel;
        const newRight = (1 - 1 / this.zoomLevel) * centerX + width / 2 / this.zoomLevel;
        const newTop = (1 - 1 / this.zoomLevel) * centerY + height / 2 / this.zoomLevel;
        const newBottom = (1 - 1 / this.zoomLevel) * centerY - height / 2 / this.zoomLevel;
        camera.left = newLeft;
        camera.right = newRight;
        // camera.top = newTop;
        // camera.bottom = newBottom;


        console.log("zoom image", centerX, width, this.zoomLevel)

        camera.updateProjectionMatrix();
        this.forceUpdateImage({});
    }

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
                    this.zoomImage(this.zoomLevel * 1.1, 75, 35)
                }}>
                Zoom In
            </div>
        );
    }

    _ElementZoomOutButton = () => {
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
                    this.zoomImage(this.zoomLevel / 1.1, 75, 35)
                }}>
                Zoom Out
            </div>
        );
    }


    _ElementImage = () => {
        const mountRef = React.useRef<HTMLDivElement>(null);
        this.mountRef = mountRef;
        const [, forceUpdate] = React.useState({});
        this.forceUpdateImage = forceUpdate;

        const processData_GrayMap = () => {
            const { width, height } = this.getImageDimensions();
            const size = width * height;
            this.imageHeight = height;
            this.imageWidth = width;
            if (size === 0) {
                Log.error("Image size is 0");
                return;
            }
            if (this.textureData === undefined) {
                this.textureData = new Uint8Array(size);
            }

            const dataRaw = this.getImageValue();
            if (dataRaw === undefined || dataRaw.length !== size) {
                Log.error("Image size does not match image data length");
                return;
            }
            const minValue = Math.min(...dataRaw);
            const maxValue = Math.max(...dataRaw);
            for (let ii = 0; ii < dataRaw.length; ii++) {
                this.textureData[ii] = Math.round((dataRaw[ii] - minValue) / (maxValue - minValue) * 255); // normalize to 0-255
                // data[ii] = Math.random() * 256; // random grayscale
            }
        }

        const processData_JetMap = () => {
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

            for (let ii = 0; ii < dataRaw.length; ii++) {
                const normalized = Math.round((dataRaw[ii] - minValue) / (maxValue - minValue) * 255);
                const [r, g, b] = this.jetColorMap(normalized);
                const idx = ii * 4;
                this.textureData[idx] = r;
                this.textureData[idx + 1] = g;
                this.textureData[idx + 2] = b;
                this.textureData[idx + 3] = 255; // opaque

            }
            console.log(this.textureData.length)
        };

        const processData = processData_JetMap;


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
                // THREE.RedFormat,
                THREE.RGBAFormat,        // ✅ RGB format
                THREE.UnsignedByteType
            );

            texture.needsUpdate = true;
            texture.generateMipmaps = false;
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;



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
            const material = new THREE.MeshBasicMaterial({ map: texture });
            const plane = new THREE.Mesh(geometry, material);
            scene.add(plane);


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
            processData();
            // console.log("fun2 running B");
            this.texture.needsUpdate = true; // upload changes to GPU
            this.texture.generateMipmaps = false;
            // this.texture.minFilter = THREE.LinearFilter; // No mipmaps, direct filtering
            this.texture.minFilter = THREE.LinearFilter;
            this.texture.magFilter = THREE.LinearFilter;



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
        // this.forceUpdateImage({});
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
