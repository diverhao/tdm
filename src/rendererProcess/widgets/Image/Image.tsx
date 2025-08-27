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
import { pi, re } from "mathjs";
import { TcaChannel } from "../../channel/TcaChannel";

export type type_Image_roi = {
    xPv: string;
    yPv: string;
    widthPv: string;
    heightPv: string;
    color: string;
}

export type type_Image_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
    regionsOfInterest: type_Image_roi[];
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

    // _rules: TextUpdatRules;
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
        this.setReadWriteType("write");

        this.setStyle({ ...Image._defaultTdl.style, ...widgetTdl.style });
        this.setText({ ...Image._defaultTdl.text, ...widgetTdl.text });

        this._regionOfInterest = JSON.parse(JSON.stringify(widgetTdl.regionsOfInterest));

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
    forceUpdate = (input: any) => { };
    _ElementAreaRaw = ({ }: any): JSX.Element => {
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
                onMouseDown={(event: any) => {
                    this._handleMouseDown(event);
                    if (this.showConfigPage === true) {
                        this.showConfigPage = false;
                        this.forceUpdate({});
                    }

                }}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                <this._ElementImageContainer />
                <this._ElementColorMap />

                {this.showConfigPage === true ? <this._ElementConfigPage /> : null}
            </div>
        );
    };

    showConfigPage: boolean = false;
    _ElementConfigPage = () => {
        return (
            <div style={{
                position: "absolute",
                // width: "100%",
                // height: "100%",
                top: 5,
                left: 5,
                padding: 20,
                boxSizing: "border-box",
                borderRadius: 10,
                backgroundColor: "rgba(150,150,150,0.5)",
                backdropFilter: "blur(10px)",
                border: "1px solid white",
                outline: "1px solid black",
                textShadow: `
      -0.5px -0.5px 0 white,
       0.5px -0.5px 0 white,
      -0.5px  0.5px 0 white,
       0.5px  0.5px 0 white
    `
            }}
                onMouseDown={(event: any) => {
                    event.stopPropagation();
                }}
            >
                <div
                    style={{
                        display: "inline-flex",
                        flexDirection: "column",
                        // maxWidth: "20%",
                        // backgroundColor: "yellow",
                    }}
                >
                    <this._ElementXrange />
                    <this._ElementYrange />
                    {/* <this._ElementZrange></this._ElementZrange> */}
                    <this._ElementSwitchColorMap />
                    {/* <this._ElementXyzCursorValues></this._ElementXyzCursorValues> */}
                </div>
                {/* <this._ElementZoomInButton /> */}
                {/* <this._ElementZoomOutButton /> */}
                {/* <this._ElementResetViewToFullButton /> */}
                {/* <div
                    style={{
                        width: 20,
                        height: 20,
                        backgroundColor: "blue",
                    }}
                    onClick={() => {
                        this.showConfigPage = false;
                        this.forceUpdate({});
                    }}
                >
                </div> */}

            </div>
        )
    }

    colorMapWidth: number = 50;
    getXmin = () => {
        const { width, height } = this.getImageDimensions();
        if (this.autoXY === true) {
            return 0;
        } else {
            return this.getText()["xMin"];
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
        // if new data arrives the first time, re-calc image size on screen

        if (this.imageSize[0] === 0 || this.imageSize[1] === 0) {
            this.processData(true);
            // this.calcImageSize();
        } else {
            this.processData(false);
        }
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
                        <this._ElementYAxis
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
                            return <this._ElementRoi key={index} index={index} />
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
                        <this._ElementXAxis
                        // totalWidth={this.renderer === undefined ? 20 : this.renderer.domElement.width}
                        />
                    </div>
                </div>
                <div
                    style={{
                        height: this.configHeight,
                        display: "inline-flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center"
                    }}
                >
                    <div
                        style={{
                            height: this.configHeight,
                            display: "inline-flex",
                            flexDirection: "row",
                            justifyContent: "flex-start",
                            alignItems: "center"
                        }}
                    >
                        {/* <this._ElementXrange></this._ElementXrange>
                    <this._ElementYrange></this._ElementYrange> */}
                        {/* config page */}
                        <img
                            onMouseDown={(event: any) => {
                                event.stopPropagation();
                                if (this.showConfigPage === true) {
                                    this.showConfigPage = false;

                                } else {
                                    this.showConfigPage = true;

                                }
                                this.forceUpdate({});
                            }}
                            onMouseOver={() => {
                                this.setHintText("More options");
                            }}
                            onMouseLeave={() => {
                                this.setHintText("");
                            }}

                            src={"../../resources/webpages/settings.svg"}
                            width={this.configHeight}
                        ></img>
                        {/* color map range */}
                        <this._ElementZrange />
                        <this._ElementZoomInButton />
                        <this._ElementResetViewToFullButton />
                        <this._ElementZoomOutButton />
                        <this._ElementHint />
                    </div>
                    {/* cursor coordinate */}
                    <this._ElementXyzCursorValues />
                </div>
            </div>
        )
    }

    setHintText = (input: string) => { };
    _ElementHint = () => {
        const [hintText, setHintText] = React.useState("");
        this.setHintText = setHintText;
        return (
            <div
                style={{
                    color: "rgba(150, 150, 150, 1)"
                }}
            >
                {hintText}
            </div>
        )
    }


    _ElementXAxis = () => {
        const totalWidth = this.getImageSize()[0];
        const calcTicks = () => {

            const { width, height } = this.getImageDimensions();
            let max = this.getXmax();
            let min = this.getXmin();
            if (this.camera !== undefined) {
                min = this.camera.left + width / 2;
                max = this.camera.right + width / 2;

            }


            let dx = 1;
            if (max - min > 1000) {
                dx = 200;
            } else if (max - min > 500) {
                dx = 100;
            } else if (max - min > 200) {
                dx = 50;
            } else if (max - min > 100) {
                dx = 20;
            } else if (max - min > 50) {
                dx = 10;
            } else if (max - min > 20) {
                dx = 5;
            } else if (max - min > 10) {
                dx = 2;
            } else if (max - min > 1) {
                dx = 1;
            }

            let xStart = Math.ceil(min / dx) * dx;

            const slope = totalWidth / (max - min);

            const numPoints = totalWidth / 15 + 1;
            const result: [number, number][] = [];
            for (let value = xStart; value < max; value = value + dx) {
                result.push([Math.round(value), slope * (Math.round(value) - min)])
            }
            // console.log(slope, min, max, this.camera.left, this.camera.right)
            // console.log(result)
            return result;

        };
        return (
            <div style={{
                width: "100%",
                height: "100%",
                // backgroundColor: "red",
                position: "relative",
                // display: "inline-flex",
                // flexDirection: "column",
                // justifyContent: "flex-start",
                // top: 0,
                overflow: "visible",
            }}>

                <svg
                    style={{
                        position: "absolute",
                        width: "100%",
                        height: "3px",
                        top: 0,
                        overflow: "visible",
                    }}

                >
                    <polyline
                        points={`-2,1 ${totalWidth},1`}
                        strokeWidth={`2px`}
                        stroke={"black"}
                        fill="none"
                    ></polyline>
                </svg>
                {calcTicks().map(([value, x]) => {
                    return (
                        <>
                            <svg
                                style={{
                                    position: "absolute",
                                    left: x,
                                    top: 0,
                                    width: 10,
                                    height: 7,
                                    display: "inline-flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    flexDirection: "column",
                                }}

                            >
                                <polyline
                                    points={`0,0 0,7`}
                                    strokeWidth={`2px`}
                                    stroke={"black"}
                                    fill="none"
                                >
                                </polyline>
                            </svg>
                            <div
                                style={{
                                    position: "absolute",
                                    left: x,
                                    top: 15,
                                    width: 0,
                                    height: 0,
                                    // backgroundColor: "blue",
                                    display: "inline-flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    flexDirection: "column",
                                }}
                            >
                                {value}
                            </div>
                        </>
                    )
                })}
            </div>
        )
    }

    _ElementYAxis = () => {
        const totalHeight = this.getImageSize()[1];

        const calcTicks = () => {
            const { width, height } = this.getImageDimensions();
            let max = this.getYmax();
            let min = this.getYmin();
            if (this.camera !== undefined) {
                min = this.camera.bottom + height / 2;
                max = this.camera.top + height / 2;
                // return [];
            }

            // console.log(min, max)
            let dy = 1;
            if (max - min > 1000) {
                dy = 200;
            } else if (max - min > 500) {
                dy = 100;
            } else if (max - min > 200) {
                dy = 50;
            } else if (max - min > 100) {
                dy = 20;
            } else if (max - min > 50) {
                dy = 10;
            } else if (max - min > 20) {
                dy = 5;
            } else if (max - min > 10) {
                dy = 2;
            } else if (max - min > 1) {
                dy = 1;
            }

            let yStart = Math.ceil(min / dy) * dy;

            const slope = totalHeight / (max - min);


            const result: [number, number][] = [];
            for (let value = yStart; value < max; value = value + dy) {
                result.push([Math.round(value), slope * (Math.round(value) - min)])
            }
            // console.log(slope, min, max, this.camera.left, this.camera.right)
            // console.log(result)
            return result;

        };
        // console.log("y axis ====================", totalHeight, calcTicks())
        return (
            <div style={{
                width: "100%",
                height: "100%",
                // backgroundColor: "red",
                position: "relative",
                display: "inline-flex",
                justifyContent: "flex-end",
            }}>
                {/* long vertical line */}
                <svg
                    style={{
                        height: "100%",
                        width: "10px",
                        right: 0,
                    }}

                >
                    <polyline
                        points={`9,0 9,${totalHeight}`}
                        strokeWidth={`2px`}
                        stroke={"black"}
                        fill="none"
                    ></polyline>
                </svg>
                {calcTicks().map(([value, y]) => {
                    return (
                        <>
                            <svg
                                style={{
                                    position: "absolute",
                                    right: 0,
                                    top: totalHeight - y,
                                    width: 7,
                                    height: 3,
                                    display: "inline-flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    overflow: "visible",
                                    flexDirection: "column",
                                }}

                            >
                                <polyline
                                    points={`0,0 7,0`}
                                    strokeWidth={`2px`}
                                    stroke={"black"}
                                    fill="none"
                                >
                                </polyline>
                            </svg>
                            <div
                                style={{
                                    position: "absolute",
                                    left: 20,
                                    top: totalHeight - y,
                                    transform: "rotate(270deg)",
                                    width: 0,
                                    height: 0,
                                    // backgroundColor: "blue",
                                    display: "inline-flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    flexDirection: "column",
                                }}
                            >
                                {value}
                            </div>
                        </>
                    )
                })}
            </div>
        )
    }

    forceUpdateColorMap = (input: any) => { };

    _ElementColorMap = () => {
        const [, forceUpdate] = React.useState({});

        this.forceUpdateColorMap = forceUpdate;
        const calcTicks = () => {

            const min = this.zMin;
            const max = this.zMax;
            // console.log(min, max)
            let dy = 1;
            if (max - min > 50000) {
                dy = 10000;
            } else if (max - min > 20000) {
                dy = 5000;
            } else if (max - min > 10000) {
                dy = 2000;
            } else if (max - min > 5000) {
                dy = 1000;
            } else if (max - min > 2000) {
                dy = 500;
            } else if (max - min > 1000) {
                dy = 200;
            } else if (max - min > 500) {
                dy = 100;
            } else if (max - min > 200) {
                dy = 50;
            } else if (max - min > 100) {
                dy = 20;
            } else if (max - min > 50) {
                dy = 10;
            } else if (max - min > 20) {
                dy = 5;
            } else if (max - min > 10) {
                dy = 2;
            } else if (max - min > 1) {
                dy = 1;
            }

            let yStart = Math.ceil(min / dy) * dy;

            const slope = this.getImageSize()[1] / (max - min);


            const result: [number, number][] = [];
            for (let value = yStart; value < max; value = value + dy) {
                result.push([Math.round(value), slope * (Math.round(value) - min)])
            }
            // console.log(slope, min, max, this.camera.left, this.camera.right)
            // console.log(result)
            return result;

        };
        return (
            <div style={{
                // position: "absolute",
                // zIndex: 1000,
                // right: 0,
                // bottom: 0,
                // marginLeft: 20,
                // paddingLeft: 20,

                // width: "100%",
                // height: "100%",
                height: this.getImageSize()[1],
                // backgroundColor: "red",
                position: "relative",
                display: "inline-flex",
                justifyContent: "flex-end",
                marginBottom: this.axisWidth + this.configHeight,
            }}>
                {/* long vertical line */}
                <svg
                    style={{
                        height: "100%",
                        width: "25px",
                        // left: 80,
                    }}

                >
                    <polyline
                        points={`200,0 200,${this.getImageSize()[1]}`}
                        strokeWidth={`2px`}
                        stroke={"black"}
                        fill="none"
                    ></polyline>
                </svg>
                {calcTicks().map(([value, y]) => {
                    return (
                        <>
                            <svg
                                style={{
                                    position: "absolute",
                                    right: 0 + 15,
                                    top: this.getImageSize()[1] - y,
                                    width: 7,
                                    height: 3,
                                    display: "inline-flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    overflow: "visible",
                                    flexDirection: "column",
                                }}

                            >
                                <polyline
                                    points={`0,0 7,0`}
                                    strokeWidth={`2px`}
                                    stroke={"black"}
                                    fill="none"
                                >
                                </polyline>
                            </svg>
                            <div
                                style={{
                                    position: "absolute",
                                    right: 20 + 10,
                                    top: this.getImageSize()[1] - y,
                                    transform: "rotate(270deg)",
                                    width: 0,
                                    height: 0,
                                    // backgroundColor: "blue",
                                    display: "inline-flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    flexDirection: "column",
                                }}
                            >
                                {value}
                            </div>
                        </>
                    )
                })}
                <div style={{
                    background: this.generateGradientStops(),
                    height: "100%",
                    width: 15,
                    // position: "absolute",
                    // zIndex: 1000,
                    // left: 20,
                    // bottom: 0,
                    // backgroundColor: "rgba(255, 255,0, 0.5)",
                    // width: 100,
                    // height: 100,

                }}>
                </div>

            </div>
        )
    }

    texture: THREE.DataTexture | undefined = undefined;
    renderer: THREE.WebGLRenderer | undefined = undefined;
    scene: THREE.Scene | undefined = undefined;
    camera: THREE.OrthographicCamera | undefined = undefined;
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
    imageDimensionsBackup: { width: number, height: number } = { width: -1, height: -1 };

    setPlaying = (playing: boolean) => {
        if (this.playing === playing) {
            return;
        }
        if (playing === false) {
            this.imageValueBackup = JSON.parse(JSON.stringify(this.getImageValue()));
            this.imageDimensionsBackup = JSON.parse(JSON.stringify(this.getImageDimensions()));
        } else {
            this.imageValueBackup = [];
            this.imageDimensionsBackup = { width: -1, height: -1 };
        }
        this.playing = playing;
    }

    switchColorMap = (newColorMap: string) => {
        let currentColorMap = this.getText()["colorMap"];
        if (currentColorMap === undefined) {
            currentColorMap = "gray";
        }

        this.getText()["colorMap"] = newColorMap;
        this.processData(false);
        this.forceUpdateImage({});
        this.forceUpdateColorMap({});
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
        console.log("pan image")

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

    /**
     * set the view and plot area to the this.getText()["xMin/xMax/yMin/yMax"]
     */
    _ElementZoomInButton = () => {
        return (
            <div
                style={{
                    // position: "absolute",
                    // zIndex: 1000,
                    // right: 0,
                    // bottom: 100,
                    // backgroundColor: "rgba(255, 255,0, 0.5)",
                    // width: 100,
                    // height: 100,
                    display: "inline-flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}
                onMouseOver={() => {
                    this.setHintText("Set XY to manual range");
                }}
                onMouseLeave={() => {
                    this.setHintText("");
                }}

                onMouseDown={() => {
                    // console.log("Zoom In clicked");
                    // this.zoomImage(this.zoomLevel * 1.1, 75, 35)
                    this.setImageXyRange();
                }}>
                <img src={"../../resources/webpages/scale-y.svg"} width={this.configHeight}></img>
            </div>
        );
    }

    _ElementResetViewToFullButton = () => {
        return (
            <div
                style={{
                    // position: "absolute",
                    // zIndex: 1000,
                    // right: 0,
                    // bottom: 200,
                    // backgroundColor: "rgba(255, 255,0, 0.5)",
                    // width: 100,
                    // height: 100,
                    display: "inline-flex",
                    justifyContent: "center",
                    alignItems: "center",

                }}
                onMouseOver={() => {
                    this.setHintText("See full image");
                }}
                onMouseLeave={() => {
                    this.setHintText("");
                }}

                onMouseDown={() => {
                    // console.log("Zoom In clicked");
                    // this.zoomImage(this.zoomLevel * 1.1, 75, 35)
                    this.resetViewToFull();
                }}>
                <img src={"../../resources/webpages/scale-2y.svg"} width={this.configHeight}></img>

            </div>
        );
    }

    _ElementZoomOutButton = () => {
        const [playing, setPlaying] = React.useState(this.playing);
        return (
            <div
                style={{
                    // position: "absolute",
                    // zIndex: 1000,
                    // right: 0,
                    // bottom: 0,
                    // backgroundColor: "rgba(255, 255,0, 0.5)",
                    // width: 100,
                    // height: 100,
                    display: "inline-flex",
                    justifyContent: "center",
                    alignItems: "center",

                }}
                onMouseOver={() => {
                    this.setHintText(playing === true ? "Stop image update" : "Start image update");
                }}
                onMouseLeave={() => {
                    this.setHintText("");
                }}

                onMouseDown={() => {
                    // console.log("Zoom Out clicked");
                    // this.zoomImage(this.zoomLevel / 1.1, 75, 35)
                    this.setHintText(playing === false ? "Stop image update" : "Start image upate");

                    this.setPlaying(!playing);
                    setPlaying(!playing);
                    if (this.playing === true) {
                        // update immediately
                        this.forceUpdateImage({});
                    }

                }}>
                <img src={playing === true ? "../../resources/webpages/pause.svg" : "../../resources/webpages/play.svg"} width={this.configHeight}></img>

                {/* {playing === true ? "Pause" : "Play"} */}
            </div>
        );
    }

    generateGradientStops = () => {
        let colors = [];
        const colorMapName = this.getText()["colorMap"];
        let colorMapArray = this.colorMapArrays[colorMapName];
        if (colorMapArray === undefined) {
            colorMapArray = this.grayColorMapArray;

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


    setXyzCursorValues = (input: any) => { };
    _ElementXyzCursorValues = () => {
        const [values, setValues] = React.useState([0, 0, 0]);
        this.setXyzCursorValues = setValues;
        return (
            this.lastMouesPositions[0] === -10000 ?
                null :
                <div>
                    ({values[0]}, {values[1]}, {values[2]})
                </div>
        )
    }

    _ElementZrange = () => {
        const [zMin, setZmin] = React.useState(`${this.getText()["zMin"]}`);
        const [zMax, setZmax] = React.useState(`${this.getText()["zMax"]}`);
        // const [zMin, setZmin] = React.useState(`${this.zMin}`);
        // const [zMax, setZmax] = React.useState(`${this.zMax}`);
        const [autoZ, setAutoZ] = React.useState(this.getText()["autoZ"]);
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
                        this.setHintText("Color map lowest value" + (autoZ === true ? " (auto)" : ""));
                    }}
                    onMouseLeave={() => {
                        this.setHintText("");
                    }}
                    onSubmit={
                        (event: any) => {
                            event.preventDefault();
                            let value = parseFloat(zMin);
                            if (isNaN(value)) {
                                setZmin(`${this.getText()["zMin"]}`);
                                return;
                            }
                            this.getText()["zMin"] = value;
                            this.processData(false);
                            this.forceUpdateColorMap({});
                            this.forceUpdateImage({});
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
                        value={autoZ === true ? this.zMin : zMin}
                        type={"text"}
                        readOnly={autoZ}
                        onChange={(event: any) => {
                            const valueStr = event.target.value;
                            setZmin(valueStr);
                        }}
                        onBlur={(event: any) => {
                            if (`${this.getText()["zMin"]}` !== zMin) {
                                setZmax(`${this.getText()["zMin"]}`)
                            }
                        }}

                    >
                    </input>
                </form>
                &nbsp;
                <form
                    onMouseOver={() => {
                        this.setHintText("Color map highest value" + (autoZ === true ? " (auto)" : ""));
                    }}
                    onMouseLeave={() => {
                        this.setHintText("");
                    }}

                    onSubmit={
                        (event: any) => {
                            event.preventDefault();
                            let value = parseFloat(zMax);
                            if (isNaN(value)) {
                                setZmax(`${this.getText()["zMax"]}`);
                                return;
                            }
                            this.getText()["zMax"] = value;
                            this.processData(false);
                            this.forceUpdateColorMap({});
                            this.forceUpdateImage({});
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
                        value={autoZ === true ? this.zMax : zMax}
                        type={"text"}
                        readOnly={autoZ}
                        onChange={(event: any) => {
                            const valueStr = event.target.value;
                            setZmax(valueStr);
                        }}
                        onBlur={(event: any) => {
                            if (`${this.getText()["zMax"]}` !== zMax) {
                                setZmax(`${this.getText()["zMax"]}`)
                            }
                        }}
                    >
                    </input>
                </form>
                <input
                    onMouseOver={() => {
                        this.setHintText("Color map value auto range ");
                    }}
                    onMouseLeave={() => {
                        this.setHintText("");
                    }}

                    type={"checkbox"}
                    checked={autoZ}
                    onChange={(event: any) => {
                        this.getText()["autoZ"] = !autoZ;
                        setAutoZ(!autoZ);
                        this.processData(false);
                        this.forceUpdateColorMap({});
                        this.forceUpdateImage({});
                    }}
                >
                </input>
            </div>
        )
    }

    _ElementXrange = () => {
        const [xMin, setXmin] = React.useState(`${this.getText()["xMin"]}`);
        const [xMax, setXmax] = React.useState(`${this.getText()["xMax"]}`);
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
                        width: "100%",
                        marginBottom: 3,
                        alignItems: "center",
                    }}
                >
                    <div>X min.:</div>
                    <form
                        onSubmit={
                            (event: any) => {
                                event.preventDefault();
                                let value = parseFloat(xMin);
                                if (isNaN(value)) {
                                    setXmin(`${this.getText()["xMin"]}`);
                                    return;
                                }
                                this.getText()["xMin"] = value;
                                // this.forceUpdateImage({});
                                this.setImageXyRange();
                            }
                        }
                    >
                        <input
                            style={{
                                width: "5em",
                                outline: "none",
                                border: "1px solid black",
                            }}
                            value={xMin}
                            type={"text"}
                            onChange={(event: any) => {
                                const valueStr = event.target.value;
                                setXmin(valueStr);
                            }}
                            onBlur={(event: any) => {
                                if (`${this.getText()["xMin"]}` !== xMin) {
                                    setXmax(`${this.getText()["xMin"]}`)
                                }
                            }}

                        >
                        </input>
                    </form>
                </div>
                <div
                    style={{
                        display: "inline-flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        width: "100%",
                        marginBottom: 3,
                        alignItems: "center",
                    }}
                >
                    <div>X max.:</div>
                    <form
                        onSubmit={
                            (event: any) => {
                                event.preventDefault();
                                let value = parseFloat(xMax);
                                if (isNaN(value)) {
                                    setXmax(`${this.getText()["xMax"]}`);
                                    return;
                                }
                                this.getText()["xMax"] = value;
                                // this.forceUpdateImage({});
                                this.setImageXyRange();

                            }
                        }
                    >
                        <input
                            style={{
                                width: "5em",
                                outline: "none",
                                border: "1px solid black",
                            }}
                            value={xMax}
                            type={"text"}
                            onChange={(event: any) => {
                                const valueStr = event.target.value;
                                setXmax(valueStr);
                            }}
                            onBlur={(event: any) => {
                                if (`${this.getText()["xMax"]}` !== xMax) {
                                    setXmax(`${this.getText()["xMax"]}`)
                                }
                            }}
                        >
                        </input>
                    </form>
                </div>
            </div>
        )
    }


    _ElementYrange = () => {
        const [yMin, setYmin] = React.useState(`${this.getText()["yMin"]}`);
        const [yMax, setYmax] = React.useState(`${this.getText()["yMax"]}`);
        // const [autoXY, setAutoXY] = React.useState(this.getText()["autoXY"]);
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
                        width: "100%",
                        marginBottom: 3,
                        alignItems: "center",
                    }}
                >
                    <div>Y min.:</div>

                    <form
                        onSubmit={
                            (event: any) => {
                                event.preventDefault();
                                let value = parseFloat(yMin);
                                if (isNaN(value)) {
                                    setYmin(`${this.getText()["yMin"]}`);
                                    return;
                                }
                                this.getText()["yMin"] = value;
                                this.setImageXyRange()
                            }
                        }
                    >
                        <input
                            style={{
                                width: "5em",
                                outline: "none",
                                border: "1px solid black",
                            }}
                            value={yMin}
                            type={"text"}
                            onChange={(event: any) => {
                                const valueStr = event.target.value;
                                setYmin(valueStr);
                            }}
                            onBlur={(event: any) => {
                                if (`${this.getText()["yMin"]}` !== yMin) {
                                    setYmax(`${this.getText()["yMin"]}`)
                                }
                            }}

                        >
                        </input>
                    </form>
                </div>
                <div
                    style={{
                        display: "inline-flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        width: "100%",
                        marginBottom: 3,
                        alignItems: "center",
                    }}
                >
                    <div>Y max.:</div>


                    <form
                        onSubmit={
                            (event: any) => {
                                event.preventDefault();
                                let value = parseFloat(yMax);
                                if (isNaN(value)) {
                                    setYmax(`${this.getText()["yMax"]}`);
                                    return;
                                }
                                this.getText()["yMax"] = value;
                                this.setImageXyRange()
                            }
                        }
                    >
                        <input
                            style={{
                                width: "5em",
                                outline: "none",
                                border: "1px solid black",
                            }}
                            value={yMax}
                            type={"text"}
                            onChange={(event: any) => {
                                const valueStr = event.target.value;
                                setYmax(valueStr);
                            }}
                            onBlur={(event: any) => {
                                if (`${this.getText()["yMax"]}` !== yMax) {
                                    setYmax(`${this.getText()["yMax"]}`)
                                }
                            }}
                        >
                        </input>
                    </form>
                </div>
                {/* <input
                    type={"checkbox"}
                    checked={autoXY}
                    onChange={(event: any) => {
                        this.getText()["autoXY"] = !autoXY;
                        setAutoXY(!autoXY);
                        // this.processData();
                        this.resetImage();
                        this.forceUpdateImage({});
                    }}
                >
                </input> */}

            </div>
        )
    }

    lastMouesPositions: [number, number] = [-1, -1];

    _ElementSwitchColorMap = () => {
        const [colorMap, setColorMap] = React.useState(this.getText()["colorMap"]);
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
                    <div>Color map: </div>

                    <select
                        style={{
                            width: "8em",
                            outline: "none",
                            border: "1px solid black",
                        }}
                        id="myDropdown"
                        value={colorMap}
                        onChange={(event: any) => {
                            setColorMap(event.target.value);
                            this.switchColorMap(event.target.value);
                        }}

                    >
                        {Object.keys(this.colorMapFunctions).map((key, index) => {
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
            const texture = new THREE.DataTexture(
                this.textureData,
                width,
                height,
                THREE.RGBAFormat, // always RGBA
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

            const camera = new THREE.OrthographicCamera(
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

            const renderer = new THREE.WebGLRenderer({ alpha: true });

            // the image area, outside of this area is blank
            // this.calcImageSize();
            renderer.setSize(this.getImageSize()[0], this.getImageSize()[1]);
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
            // this.texture.minFilter = THREE.LinearFilter; // No mipmaps, direct filtering
            this.texture.minFilter = THREE.NearestFilter;
            this.texture.magFilter = THREE.NearestFilter;

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

                onMouseDown={(event: any) => {
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

    resizeRoiTopHandler = (event: any) => {
        const dx = event.movementX;
        const dy = event.movementY;
        this.setRoiTop((oldTop: number) => {
            return Math.max(oldTop + dy, 0);
        });
        this.setRoiHeight((oldHeight: number) => {
            return Math.max(10, oldHeight - dy);
        });
    };

    resizeRoiTopHandlerMouseUp = (event: any) => {
        window.removeEventListener("mousemove", this.resizeRoiTopHandler);
        window.removeEventListener("mouseup", this.resizeRoiTopHandlerMouseUp);
    };

    resizeRoiBottomHandler = (event: any) => {
        const dx = event.movementX;
        const dy = event.movementY;
        this.setRoiHeight((oldHeight: number) => {
            return Math.max(oldHeight + dy, 10);
        });
    };

    resizeRoiBottomHandlerMouseUp = (event: any) => {
        window.removeEventListener("mousemove", this.resizeRoiBottomHandler);
        window.removeEventListener("mouseup", this.resizeRoiBottomHandlerMouseUp);
    };

    resizeRoiLeftHandler = (event: any) => {
        const dx = event.movementX;
        const dy = event.movementY;
        this.setRoiLeft((oldLeft: number) => {
            return Math.max(0, oldLeft + dx);
        });
        this.setRoiWidth((oldWidth: number) => {
            return Math.max(10, oldWidth - dx);
        });
    };

    resizeRoiLeftHandlerMouseUp = (event: any) => {
        window.removeEventListener("mousemove", this.resizeRoiLeftHandler);
        window.removeEventListener("mouseup", this.resizeRoiLeftHandlerMouseUp);
    };

    resizeRoiRightHandler = (event: any) => {
        const dx = event.movementX;
        const dy = event.movementY;
        this.setRoiWidth((oldWidth: number) => {
            return Math.max(10, oldWidth + dx);
        });
    };

    resizeRoiRightHandlerMouseUp = (event: any) => {
        window.removeEventListener("mousemove", this.resizeRoiRightHandler);
        window.removeEventListener("mouseup", this.resizeRoiRightHandlerMouseUp);
    };

    setRoiTop = (input: any) => { };
    setRoiLeft = (input: any) => { };
    setRoiWidth = (input: any) => { };
    setRoiHeight = (input: any) => { };
    roiRef: any = undefined;

    _ElementRoi = ({ index }: { index: number }) => {

        const roiData = this.getRegionsOfInterest()[index];
        if (roiData === undefined) {
            return null;
        }

        const [top, setTop] = React.useState(10);
        const [left, setLeft] = React.useState(10);
        const [width, setWidth] = React.useState(20);
        const [height, setHeight] = React.useState(20);

        this.setRoiTop = setTop;
        this.setRoiLeft = setLeft;
        this.setRoiWidth = setWidth;
        this.setRoiHeight = setHeight;

        const elementRef = React.useRef<HTMLDivElement>(null);
        this.roiRef = elementRef;

        /**
         * After each rendering, update the roi position and size
         */
        React.useEffect(() => {
            if (elementRef !== undefined && elementRef.current !== null) {
                if (
                    (TcaChannel.checkChannelName(roiData["xPv"]) === "global"
                        || TcaChannel.checkChannelName(roiData["xPv"]) === "local")
                    &&
                    (TcaChannel.checkChannelName(roiData["yPv"]) === "global"
                        || TcaChannel.checkChannelName(roiData["yPv"]) === "local")
                    &&
                    (TcaChannel.checkChannelName(roiData["widthPv"]) === "global"
                        || TcaChannel.checkChannelName(roiData["widthPv"]) === "local")
                    &&
                    (TcaChannel.checkChannelName(roiData["heightPv"]) === "global"
                        || TcaChannel.checkChannelName(roiData["heightPv"]) === "local")
                ) {

                    const rectRoi = elementRef.current.getBoundingClientRect();

                    const xyzTopLeft = this.calcImageXyzFromPixel(rectRoi.left, rectRoi.top);
                    // const xyzBottomLeft = this.calcImageXyzFromPixel(rectRoi.left, rectRoi.top + rectRoi.height);
                    // const xyzTopRight = this.calcImageXyzFromPixel(rectRoi.left + rectRoi.width, rectRoi.top);
                    const xyzBottomRight = this.calcImageXyzFromPixel(rectRoi.left + rectRoi.width, rectRoi.top + rectRoi.height);
                    console.log(xyzTopLeft, xyzBottomRight);
                    try {

                        const displayWindowId = g_widgets1.getRoot().getDisplayWindowClient().getWindowId();
                        const tcaChannelX = g_widgets1.getTcaChannel(roiData["xPv"] + "@window_" + displayWindowId);
                        const tcaChannelY = g_widgets1.getTcaChannel(roiData["yPv"] + "@window_" + displayWindowId);
                        const tcaChannelWidth = g_widgets1.getTcaChannel(roiData["widthPv"] + "@window_" + displayWindowId);
                        const tcaChannelHeight = g_widgets1.getTcaChannel(roiData["heightPv"] + "@window_" + displayWindowId);
                        console.log("Display window id:");
                        tcaChannelX.put(displayWindowId, { value: xyzTopLeft[0] }, 1);
                        tcaChannelY.put(displayWindowId, { value: xyzTopLeft[1] }, 1);
                        tcaChannelWidth.put(displayWindowId, { value: xyzBottomRight[0] - xyzTopLeft[0] }, 1);
                        tcaChannelHeight.put(displayWindowId, { value: xyzBottomRight[1] - xyzTopLeft[1] }, 1);

                    } catch (e) {
                        console.log(g_widgets1.getTcaChannels());
                    }
                }

            }

        })

        return (
            <div
                ref={elementRef}
                style={{
                    position: "absolute",
                    top: top,
                    left: left,
                    width: width,
                    height: height,
                    border: "solid 3px yellow",
                    boxSizing: "border-box",
                }}
            >
                {/* top */}
                <div
                    style={{
                        position: "absolute",
                        backgroundColor: "red",
                        top: -5,
                        left: 0,
                        width: "100%",
                        height: 10,
                        cursor: "ns-resize",
                    }}
                    onMouseDown={(event: any) => {
                        window.addEventListener("mousemove", this.resizeRoiTopHandler);
                        window.addEventListener("mouseup", this.resizeRoiTopHandlerMouseUp);
                    }}
                >
                </div>
                {/* left */}
                <div
                    style={{
                        position: "absolute",
                        backgroundColor: "blue",
                        top: 0,
                        left: -5,
                        height: "100%",
                        width: 10,
                        cursor: "ew-resize",

                    }}
                    onMouseDown={(event: any) => {
                        window.addEventListener("mousemove", this.resizeRoiLeftHandler);
                        window.addEventListener("mouseup", this.resizeRoiLeftHandlerMouseUp);
                    }}
                >
                </div>
                {/* bottom */}
                <div
                    style={{
                        position: "absolute",
                        backgroundColor: "red",
                        bottom: -5,
                        left: 0,
                        height: 10,
                        width: "100%",
                        cursor: "ns-resize",
                    }}
                    onMouseDown={(event: any) => {
                        window.addEventListener("mousemove", this.resizeRoiBottomHandler);
                        window.addEventListener("mouseup", this.resizeRoiBottomHandlerMouseUp);
                    }}
                >
                </div>
                {/* right */}
                <div
                    style={{
                        position: "absolute",
                        backgroundColor: "cyan",
                        top: 0,
                        right: -5,
                        height: "100%",
                        width: 10,
                        cursor: "ew-resize",
                    }}
                    onMouseDown={(event: any) => {
                        window.addEventListener("mousemove", this.resizeRoiRightHandler);
                        window.addEventListener("mouseup", this.resizeRoiRightHandlerMouseUp);
                    }}
                >
                </div>

            </div>
        )
    }

    calcImageXyzFromPixel = (pixelX: number, pixelY: number) => {
        if (this.renderer === undefined || this.camera === undefined) {
            return [-1, -1, -1]; // Invalid pixel coordinates
        }
        const rect = this.renderer.domElement.getBoundingClientRect();
        const { width, height } = this.getImageDimensions();
        const mouse = new THREE.Vector2();
        const raycaster = new THREE.Raycaster();


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
        const { width, height } = this.getImageDimensions();
        const size = width * height;
        // this.imageHeight = this.calcImageSize()[1];
        // this.imageWidth = this.calcImageSize()[0];
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

        if (changeGeometry) {
            // image dimension on screen
            this.calcImageSize();
        }

        // color
        let minValue = this.getText()["zMin"];
        let maxValue = this.getText()["zMax"];
        if (this.getText()["autoZ"] === true) {
            minValue = Math.min(...dataRaw);
            maxValue = Math.max(...dataRaw);
        }

        this.zMax = maxValue;
        this.zMin = minValue;

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

    // color map arrays are generated by the following python code
    // import matplotlib.pyplot as plt
    // import numpy as np
    // 
    // cmap = plt.get_cmap("cividis", 256)  # 256 steps
    // colors = (cmap(np.linspace(0, 1, 256))[:, :3] * 255).astype(int)
    // 
    // for r, g, b in colors:
    //     print(f"{r}, {g}, {b},")  # RGBA format


    jetColorMapArray = [
        0, 0, 127,
        0, 0, 132,
        0, 0, 136,
        0, 0, 141,
        0, 0, 145,
        0, 0, 150,
        0, 0, 154,
        0, 0, 159,
        0, 0, 163,
        0, 0, 168,
        0, 0, 172,
        0, 0, 177,
        0, 0, 182,
        0, 0, 186,
        0, 0, 191,
        0, 0, 195,
        0, 0, 200,
        0, 0, 204,
        0, 0, 209,
        0, 0, 213,
        0, 0, 218,
        0, 0, 222,
        0, 0, 227,
        0, 0, 232,
        0, 0, 236,
        0, 0, 241,
        0, 0, 245,
        0, 0, 250,
        0, 0, 254,
        0, 0, 255,
        0, 0, 255,
        0, 0, 255,
        0, 0, 255,
        0, 4, 255,
        0, 8, 255,
        0, 12, 255,
        0, 16, 255,
        0, 20, 255,
        0, 24, 255,
        0, 28, 255,
        0, 32, 255,
        0, 36, 255,
        0, 40, 255,
        0, 44, 255,
        0, 48, 255,
        0, 52, 255,
        0, 56, 255,
        0, 60, 255,
        0, 64, 255,
        0, 68, 255,
        0, 72, 255,
        0, 76, 255,
        0, 80, 255,
        0, 84, 255,
        0, 88, 255,
        0, 92, 255,
        0, 96, 255,
        0, 100, 255,
        0, 104, 255,
        0, 108, 255,
        0, 112, 255,
        0, 116, 255,
        0, 120, 255,
        0, 124, 255,
        0, 128, 255,
        0, 132, 255,
        0, 136, 255,
        0, 140, 255,
        0, 144, 255,
        0, 148, 255,
        0, 152, 255,
        0, 156, 255,
        0, 160, 255,
        0, 164, 255,
        0, 168, 255,
        0, 172, 255,
        0, 176, 255,
        0, 180, 255,
        0, 184, 255,
        0, 188, 255,
        0, 192, 255,
        0, 196, 255,
        0, 200, 255,
        0, 204, 255,
        0, 208, 255,
        0, 212, 255,
        0, 216, 255,
        0, 220, 254,
        0, 224, 250,
        0, 228, 247,
        2, 232, 244,
        5, 236, 241,
        8, 240, 237,
        12, 244, 234,
        15, 248, 231,
        18, 252, 228,
        21, 255, 225,
        24, 255, 221,
        28, 255, 218,
        31, 255, 215,
        34, 255, 212,
        37, 255, 208,
        41, 255, 205,
        44, 255, 202,
        47, 255, 199,
        50, 255, 195,
        54, 255, 192,
        57, 255, 189,
        60, 255, 186,
        63, 255, 183,
        66, 255, 179,
        70, 255, 176,
        73, 255, 173,
        76, 255, 170,
        79, 255, 166,
        83, 255, 163,
        86, 255, 160,
        89, 255, 157,
        92, 255, 154,
        95, 255, 150,
        99, 255, 147,
        102, 255, 144,
        105, 255, 141,
        108, 255, 137,
        112, 255, 134,
        115, 255, 131,
        118, 255, 128,
        121, 255, 125,
        124, 255, 121,
        128, 255, 118,
        131, 255, 115,
        134, 255, 112,
        137, 255, 108,
        141, 255, 105,
        144, 255, 102,
        147, 255, 99,
        150, 255, 95,
        154, 255, 92,
        157, 255, 89,
        160, 255, 86,
        163, 255, 83,
        166, 255, 79,
        170, 255, 76,
        173, 255, 73,
        176, 255, 70,
        179, 255, 66,
        183, 255, 63,
        186, 255, 60,
        189, 255, 57,
        192, 255, 54,
        195, 255, 50,
        199, 255, 47,
        202, 255, 44,
        205, 255, 41,
        208, 255, 37,
        212, 255, 34,
        215, 255, 31,
        218, 255, 28,
        221, 255, 24,
        224, 255, 21,
        228, 255, 18,
        231, 255, 15,
        234, 255, 12,
        237, 255, 8,
        241, 252, 5,
        244, 248, 2,
        247, 244, 0,
        250, 240, 0,
        254, 237, 0,
        255, 233, 0,
        255, 229, 0,
        255, 226, 0,
        255, 222, 0,
        255, 218, 0,
        255, 215, 0,
        255, 211, 0,
        255, 207, 0,
        255, 203, 0,
        255, 200, 0,
        255, 196, 0,
        255, 192, 0,
        255, 189, 0,
        255, 185, 0,
        255, 181, 0,
        255, 177, 0,
        255, 174, 0,
        255, 170, 0,
        255, 166, 0,
        255, 163, 0,
        255, 159, 0,
        255, 155, 0,
        255, 152, 0,
        255, 148, 0,
        255, 144, 0,
        255, 140, 0,
        255, 137, 0,
        255, 133, 0,
        255, 129, 0,
        255, 126, 0,
        255, 122, 0,
        255, 118, 0,
        255, 115, 0,
        255, 111, 0,
        255, 107, 0,
        255, 103, 0,
        255, 100, 0,
        255, 96, 0,
        255, 92, 0,
        255, 89, 0,
        255, 85, 0,
        255, 81, 0,
        255, 77, 0,
        255, 74, 0,
        255, 70, 0,
        255, 66, 0,
        255, 63, 0,
        255, 59, 0,
        255, 55, 0,
        255, 52, 0,
        255, 48, 0,
        255, 44, 0,
        255, 40, 0,
        255, 37, 0,
        255, 33, 0,
        255, 29, 0,
        255, 26, 0,
        255, 22, 0,
        254, 18, 0,
        250, 15, 0,
        245, 11, 0,
        241, 7, 0,
        236, 3, 0,
        232, 0, 0,
        227, 0, 0,
        222, 0, 0,
        218, 0, 0,
        213, 0, 0,
        209, 0, 0,
        204, 0, 0,
        200, 0, 0,
        195, 0, 0,
        191, 0, 0,
        186, 0, 0,
        182, 0, 0,
        177, 0, 0,
        172, 0, 0,
        168, 0, 0,
        163, 0, 0,
        159, 0, 0,
        154, 0, 0,
        150, 0, 0,
        145, 0, 0,
        141, 0, 0,
        136, 0, 0,
        132, 0, 0,
        127, 0, 0,
    ];

    jetColorMap = (value: number) => {
        // value is 0–255
        // const fourValue = 4 * (value / 255);
        // const r = Math.min(Math.max(Math.min(fourValue - 1.5, -fourValue + 4.5), 0), 1);
        // const g = Math.min(Math.max(Math.min(fourValue - 0.5, -fourValue + 3.5), 0), 1);
        // const b = Math.min(Math.max(Math.min(fourValue + 0.5, -fourValue + 2.5), 0), 1);
        // return [
        //     Math.round(r * 255),
        //     Math.round(g * 255),
        //     Math.round(b * 255)
        // ];
        const idx = Math.round(value) * 3;
        return (
            [
                this.jetColorMapArray[idx],
                this.jetColorMapArray[idx + 1],
                this.jetColorMapArray[idx + 2],
            ]
        )

    }

    hotColorMapArray = [
        10, 0, 0,
        13, 0, 0,
        15, 0, 0,
        18, 0, 0,
        21, 0, 0,
        23, 0, 0,
        26, 0, 0,
        28, 0, 0,
        31, 0, 0,
        34, 0, 0,
        36, 0, 0,
        39, 0, 0,
        42, 0, 0,
        44, 0, 0,
        47, 0, 0,
        49, 0, 0,
        52, 0, 0,
        55, 0, 0,
        57, 0, 0,
        60, 0, 0,
        63, 0, 0,
        65, 0, 0,
        68, 0, 0,
        70, 0, 0,
        73, 0, 0,
        76, 0, 0,
        78, 0, 0,
        81, 0, 0,
        84, 0, 0,
        86, 0, 0,
        89, 0, 0,
        91, 0, 0,
        94, 0, 0,
        97, 0, 0,
        99, 0, 0,
        102, 0, 0,
        105, 0, 0,
        107, 0, 0,
        110, 0, 0,
        112, 0, 0,
        115, 0, 0,
        118, 0, 0,
        120, 0, 0,
        123, 0, 0,
        126, 0, 0,
        128, 0, 0,
        131, 0, 0,
        133, 0, 0,
        136, 0, 0,
        139, 0, 0,
        141, 0, 0,
        144, 0, 0,
        147, 0, 0,
        149, 0, 0,
        152, 0, 0,
        154, 0, 0,
        157, 0, 0,
        160, 0, 0,
        162, 0, 0,
        165, 0, 0,
        168, 0, 0,
        170, 0, 0,
        173, 0, 0,
        175, 0, 0,
        178, 0, 0,
        181, 0, 0,
        183, 0, 0,
        186, 0, 0,
        189, 0, 0,
        191, 0, 0,
        194, 0, 0,
        196, 0, 0,
        199, 0, 0,
        202, 0, 0,
        204, 0, 0,
        207, 0, 0,
        210, 0, 0,
        212, 0, 0,
        215, 0, 0,
        217, 0, 0,
        220, 0, 0,
        223, 0, 0,
        225, 0, 0,
        228, 0, 0,
        231, 0, 0,
        233, 0, 0,
        236, 0, 0,
        238, 0, 0,
        241, 0, 0,
        244, 0, 0,
        246, 0, 0,
        249, 0, 0,
        252, 0, 0,
        254, 0, 0,
        255, 2, 0,
        255, 5, 0,
        255, 7, 0,
        255, 10, 0,
        255, 12, 0,
        255, 15, 0,
        255, 18, 0,
        255, 20, 0,
        255, 23, 0,
        255, 26, 0,
        255, 28, 0,
        255, 31, 0,
        255, 33, 0,
        255, 36, 0,
        255, 39, 0,
        255, 41, 0,
        255, 44, 0,
        255, 47, 0,
        255, 49, 0,
        255, 52, 0,
        255, 54, 0,
        255, 57, 0,
        255, 60, 0,
        255, 62, 0,
        255, 65, 0,
        255, 68, 0,
        255, 70, 0,
        255, 73, 0,
        255, 75, 0,
        255, 78, 0,
        255, 81, 0,
        255, 83, 0,
        255, 86, 0,
        255, 89, 0,
        255, 91, 0,
        255, 94, 0,
        255, 96, 0,
        255, 99, 0,
        255, 102, 0,
        255, 104, 0,
        255, 107, 0,
        255, 110, 0,
        255, 112, 0,
        255, 115, 0,
        255, 117, 0,
        255, 120, 0,
        255, 123, 0,
        255, 125, 0,
        255, 128, 0,
        255, 131, 0,
        255, 133, 0,
        255, 136, 0,
        255, 138, 0,
        255, 141, 0,
        255, 144, 0,
        255, 146, 0,
        255, 149, 0,
        255, 151, 0,
        255, 154, 0,
        255, 157, 0,
        255, 159, 0,
        255, 162, 0,
        255, 165, 0,
        255, 167, 0,
        255, 170, 0,
        255, 172, 0,
        255, 175, 0,
        255, 178, 0,
        255, 180, 0,
        255, 183, 0,
        255, 186, 0,
        255, 188, 0,
        255, 191, 0,
        255, 193, 0,
        255, 196, 0,
        255, 199, 0,
        255, 201, 0,
        255, 204, 0,
        255, 207, 0,
        255, 209, 0,
        255, 212, 0,
        255, 214, 0,
        255, 217, 0,
        255, 220, 0,
        255, 222, 0,
        255, 225, 0,
        255, 228, 0,
        255, 230, 0,
        255, 233, 0,
        255, 235, 0,
        255, 238, 0,
        255, 241, 0,
        255, 243, 0,
        255, 246, 0,
        255, 249, 0,
        255, 251, 0,
        255, 254, 0,
        255, 255, 2,
        255, 255, 6,
        255, 255, 10,
        255, 255, 14,
        255, 255, 18,
        255, 255, 22,
        255, 255, 26,
        255, 255, 30,
        255, 255, 34,
        255, 255, 38,
        255, 255, 42,
        255, 255, 46,
        255, 255, 50,
        255, 255, 54,
        255, 255, 58,
        255, 255, 62,
        255, 255, 65,
        255, 255, 69,
        255, 255, 73,
        255, 255, 77,
        255, 255, 81,
        255, 255, 85,
        255, 255, 89,
        255, 255, 93,
        255, 255, 97,
        255, 255, 101,
        255, 255, 105,
        255, 255, 109,
        255, 255, 113,
        255, 255, 117,
        255, 255, 121,
        255, 255, 125,
        255, 255, 128,
        255, 255, 132,
        255, 255, 136,
        255, 255, 140,
        255, 255, 144,
        255, 255, 148,
        255, 255, 152,
        255, 255, 156,
        255, 255, 160,
        255, 255, 164,
        255, 255, 168,
        255, 255, 172,
        255, 255, 176,
        255, 255, 180,
        255, 255, 184,
        255, 255, 188,
        255, 255, 191,
        255, 255, 195,
        255, 255, 199,
        255, 255, 203,
        255, 255, 207,
        255, 255, 211,
        255, 255, 215,
        255, 255, 219,
        255, 255, 223,
        255, 255, 227,
        255, 255, 231,
        255, 255, 235,
        255, 255, 239,
        255, 255, 243,
        255, 255, 247,
        255, 255, 251,
        255, 255, 255,
    ];

    hotColorMap = (value: number) => {
        const idx = Math.floor(value) * 3;
        return (
            [
                this.hotColorMapArray[idx],
                this.hotColorMapArray[idx + 1],
                this.hotColorMapArray[idx + 2],
            ]
        )
    }

    parulaColorMapArray = [
        255 * 0.2422, 255 * 0.1504, 0.6603 * 255,
        255 * 0.2444, 255 * 0.1534, 0.6728 * 255,
        255 * 0.2464, 255 * 0.1569, 0.6847 * 255,
        255 * 0.2484, 255 * 0.1607, 0.6961 * 255,
        255 * 0.2503, 255 * 0.1648, 0.7071 * 255,
        255 * 0.2522, 255 * 0.1689, 0.7179 * 255,
        255 * 0.254, 255 * 0.1732, 0.7286 * 255,
        255 * 0.2558, 255 * 0.1773, 0.7393 * 255,
        255 * 0.2576, 255 * 0.1814, 0.7501 * 255,
        255 * 0.2594, 255 * 0.1854, 0.761 * 255,
        255 * 0.2611, 255 * 0.1893, 0.7719 * 255,
        255 * 0.2628, 255 * 0.1932, 0.7828 * 255,
        255 * 0.2645, 255 * 0.1972, 0.7937 * 255,
        255 * 0.2661, 255 * 0.2011, 0.8043 * 255,
        255 * 0.2676, 255 * 0.2052, 0.8148 * 255,
        255 * 0.2691, 255 * 0.2094, 0.8249 * 255,
        255 * 0.2704, 255 * 0.2138, 0.8346 * 255,
        255 * 0.2717, 255 * 0.2184, 0.8439 * 255,
        255 * 0.2729, 255 * 0.2231, 0.8528 * 255,
        255 * 0.274, 255 * 0.228, 0.8612 * 255,
        255 * 0.2749, 255 * 0.233, 0.8692 * 255,
        255 * 0.2758, 255 * 0.2382, 0.8767 * 255,
        255 * 0.2766, 255 * 0.2435, 0.884 * 255,
        255 * 0.2774, 255 * 0.2489, 0.8908 * 255,
        255 * 0.2781, 255 * 0.2543, 0.8973 * 255,
        255 * 0.2788, 255 * 0.2598, 0.9035 * 255,
        255 * 0.2794, 255 * 0.2653, 0.9094 * 255,
        255 * 0.2798, 255 * 0.2708, 0.915 * 255,
        255 * 0.2802, 255 * 0.2764, 0.9204 * 255,
        255 * 0.2806, 255 * 0.2819, 0.9255 * 255,
        255 * 0.2809, 255 * 0.2875, 0.9305 * 255,
        255 * 0.2811, 255 * 0.293, 0.9352 * 255,
        255 * 0.2813, 255 * 0.2985, 0.9397 * 255,
        255 * 0.2814, 255 * 0.304, 0.9441 * 255,
        255 * 0.2814, 255 * 0.3095, 0.9483 * 255,
        255 * 0.2813, 255 * 0.315, 0.9524 * 255,
        255 * 0.2811, 255 * 0.3204, 0.9563 * 255,
        255 * 0.2809, 255 * 0.3259, 0.96 * 255,
        255 * 0.2807, 255 * 0.3313, 0.9636 * 255,
        255 * 0.2803, 255 * 0.3367, 0.967 * 255,
        255 * 0.2798, 255 * 0.3421, 0.9702 * 255,
        255 * 0.2791, 255 * 0.3475, 0.9733 * 255,
        255 * 0.2784, 255 * 0.3529, 0.9763 * 255,
        255 * 0.2776, 255 * 0.3583, 0.9791 * 255,
        255 * 0.2766, 255 * 0.3638, 0.9817 * 255,
        255 * 0.2754, 255 * 0.3693, 0.984 * 255,
        255 * 0.2741, 255 * 0.3748, 0.9862 * 255,
        255 * 0.2726, 255 * 0.3804, 0.9881 * 255,
        255 * 0.271, 255 * 0.386, 0.9898 * 255,
        255 * 0.2691, 255 * 0.3916, 0.9912 * 255,
        255 * 0.267, 255 * 0.3973, 0.9924 * 255,
        255 * 0.2647, 255 * 0.403, 0.9935 * 255,
        255 * 0.2621, 255 * 0.4088, 0.9946 * 255,
        255 * 0.2591, 255 * 0.4145, 0.9955 * 255,
        255 * 0.2556, 255 * 0.4203, 0.9965 * 255,
        255 * 0.2517, 255 * 0.4261, 0.9974 * 255,
        255 * 0.2473, 255 * 0.4319, 0.9983 * 255,
        255 * 0.2424, 255 * 0.4378, 0.9991 * 255,
        255 * 0.2369, 255 * 0.4437, 0.9996 * 255,
        255 * 0.2311, 255 * 0.4497, 0.9995 * 255,
        255 * 0.225, 255 * 0.4559, 0.9985 * 255,
        255 * 0.2189, 255 * 0.462, 0.9968 * 255,
        255 * 0.2128, 255 * 0.4682, 0.9948 * 255,
        255 * 0.2066, 255 * 0.4743, 0.9926 * 255,
        255 * 0.2006, 255 * 0.4803, 0.9906 * 255,
        255 * 0.195, 255 * 0.4861, 0.9887 * 255,
        255 * 0.1903, 255 * 0.4919, 0.9867 * 255,
        255 * 0.1869, 255 * 0.4975, 0.9844 * 255,
        255 * 0.1847, 255 * 0.503, 0.9819 * 255,
        255 * 0.1831, 255 * 0.5084, 0.9793 * 255,
        255 * 0.1818, 255 * 0.5138, 0.9766 * 255,
        255 * 0.1806, 255 * 0.5191, 0.9738 * 255,
        255 * 0.1795, 255 * 0.5244, 0.9709 * 255,
        255 * 0.1785, 255 * 0.5296, 0.9677 * 255,
        255 * 0.1778, 255 * 0.5349, 0.9641 * 255,
        255 * 0.1773, 255 * 0.5401, 0.9602 * 255,
        255 * 0.1768, 255 * 0.5452, 0.956 * 255,
        255 * 0.1764, 255 * 0.5504, 0.9516 * 255,
        255 * 0.1755, 255 * 0.5554, 0.9473 * 255,
        255 * 0.174, 255 * 0.5605, 0.9432 * 255,
        255 * 0.1716, 255 * 0.5655, 0.9393 * 255,
        255 * 0.1686, 255 * 0.5705, 0.9357 * 255,
        255 * 0.1649, 255 * 0.5755, 0.9323 * 255,
        255 * 0.161, 255 * 0.5805, 0.9289 * 255,
        255 * 0.1573, 255 * 0.5854, 0.9254 * 255,
        255 * 0.154, 255 * 0.5902, 0.9218 * 255,
        255 * 0.1513, 255 * 0.595, 0.9182 * 255,
        255 * 0.1492, 255 * 0.5997, 0.9147 * 255,
        255 * 0.1475, 255 * 0.6043, 0.9113 * 255,
        255 * 0.1461, 255 * 0.6089, 0.908 * 255,
        255 * 0.1446, 255 * 0.6135, 0.905 * 255,
        255 * 0.1429, 255 * 0.618, 0.9022 * 255,
        255 * 0.1408, 255 * 0.6226, 0.8998 * 255,
        255 * 0.1383, 255 * 0.6272, 0.8975 * 255,
        255 * 0.1354, 255 * 0.6317, 0.8953 * 255,
        255 * 0.1321, 255 * 0.6363, 0.8932 * 255,
        255 * 0.1288, 255 * 0.6408, 0.891 * 255,
        255 * 0.1253, 255 * 0.6453, 0.8887 * 255,
        255 * 0.1219, 255 * 0.6497, 0.8862 * 255,
        255 * 0.1185, 255 * 0.6541, 0.8834 * 255,
        255 * 0.1152, 255 * 0.6584, 0.8804 * 255,
        255 * 0.1119, 255 * 0.6627, 0.877 * 255,
        255 * 0.1085, 255 * 0.6669, 0.8734 * 255,
        255 * 0.1048, 255 * 0.671, 0.8695 * 255,
        255 * 0.1009, 255 * 0.675, 0.8653 * 255,
        255 * 0.0964, 255 * 0.6789, 0.8609 * 255,
        255 * 0.0914, 255 * 0.6828, 0.8562 * 255,
        255 * 0.0855, 255 * 0.6865, 0.8513 * 255,
        255 * 0.0789, 255 * 0.6902, 0.8462 * 255,
        255 * 0.0713, 255 * 0.6938, 0.8409 * 255,
        255 * 0.0628, 255 * 0.6972, 0.8355 * 255,
        255 * 0.0535, 255 * 0.7006, 0.8299 * 255,
        255 * 0.0433, 255 * 0.7039, 0.8242 * 255,
        255 * 0.0328, 255 * 0.7071, 0.8183 * 255,
        255 * 0.0234, 255 * 0.7103, 0.8124 * 255,
        255 * 0.0155, 255 * 0.7133, 0.8064 * 255,
        255 * 0.0091, 255 * 0.7163, 0.8003 * 255,
        255 * 0.0046, 255 * 0.7192, 0.7941 * 255,
        255 * 0.0019, 255 * 0.722, 0.7878 * 255,
        255 * 0.0009, 255 * 0.7248, 0.7815 * 255,
        255 * 0.0018, 255 * 0.7275, 0.7752 * 255,
        255 * 0.0046, 255 * 0.7301, 0.7688 * 255,
        255 * 0.0094, 255 * 0.7327, 0.7623 * 255,
        255 * 0.0162, 255 * 0.7352, 0.7558 * 255,
        255 * 0.0253, 255 * 0.7376, 0.7492 * 255,
        255 * 0.0369, 255 * 0.74, 0.7426 * 255,
        255 * 0.0504, 255 * 0.7423, 0.7359 * 255,
        255 * 0.0638, 255 * 0.7446, 0.7292 * 255,
        255 * 0.077, 255 * 0.7468, 0.7224 * 255,
        255 * 0.0899, 255 * 0.7489, 0.7156 * 255,
        255 * 0.1023, 255 * 0.751, 0.7088 * 255,
        255 * 0.1141, 255 * 0.7531, 0.7019 * 255,
        255 * 0.1252, 255 * 0.7552, 0.695 * 255,
        255 * 0.1354, 255 * 0.7572, 0.6881 * 255,
        255 * 0.1448, 255 * 0.7593, 0.6812 * 255,
        255 * 0.1532, 255 * 0.7614, 0.6741 * 255,
        255 * 0.1609, 255 * 0.7635, 0.6671 * 255,
        255 * 0.1678, 255 * 0.7656, 0.6599 * 255,
        255 * 0.1741, 255 * 0.7678, 0.6527 * 255,
        255 * 0.1799, 255 * 0.7699, 0.6454 * 255,
        255 * 0.1853, 255 * 0.7721, 0.6379 * 255,
        255 * 0.1905, 255 * 0.7743, 0.6303 * 255,
        255 * 0.1954, 255 * 0.7765, 0.6225 * 255,
        255 * 0.2003, 255 * 0.7787, 0.6146 * 255,
        255 * 0.2061, 255 * 0.7808, 0.6065 * 255,
        255 * 0.2118, 255 * 0.7828, 0.5983 * 255,
        255 * 0.2178, 255 * 0.7849, 0.5899 * 255,
        255 * 0.2244, 255 * 0.7869, 0.5813 * 255,
        255 * 0.2318, 255 * 0.7887, 0.5725 * 255,
        255 * 0.2401, 255 * 0.7905, 0.5636 * 255,
        255 * 0.2491, 255 * 0.7922, 0.5546 * 255,
        255 * 0.2589, 255 * 0.7937, 0.5454 * 255,
        255 * 0.2695, 255 * 0.7951, 0.536 * 255,
        255 * 0.2809, 255 * 0.7964, 0.5266 * 255,
        255 * 0.2929, 255 * 0.7975, 0.517 * 255,
        255 * 0.3052, 255 * 0.7985, 0.5074 * 255,
        255 * 0.3176, 255 * 0.7994, 0.4975 * 255,
        255 * 0.3301, 255 * 0.8002, 0.4876 * 255,
        255 * 0.3424, 255 * 0.8009, 0.4774 * 255,
        255 * 0.3548, 255 * 0.8016, 0.4669 * 255,
        255 * 0.3671, 255 * 0.8021, 0.4563 * 255,
        255 * 0.3795, 255 * 0.8026, 0.4454 * 255,
        255 * 0.3921, 255 * 0.8029, 0.4344 * 255,
        255 * 0.405, 255 * 0.8031, 0.4233 * 255,
        255 * 0.4184, 255 * 0.803, 0.4122 * 255,
        255 * 0.4322, 255 * 0.8028, 0.4013 * 255,
        255 * 0.4463, 255 * 0.8024, 0.3904 * 255,
        255 * 0.4608, 255 * 0.8018, 0.3797 * 255,
        255 * 0.4753, 255 * 0.8011, 0.3691 * 255,
        255 * 0.4899, 255 * 0.8002, 0.3586 * 255,
        255 * 0.5044, 255 * 0.7993, 0.348 * 255,
        255 * 0.5187, 255 * 0.7982, 0.3374 * 255,
        255 * 0.5329, 255 * 0.797, 0.3267 * 255,
        255 * 0.547, 255 * 0.7957, 0.3159 * 255,
        255 * 0.5609, 255 * 0.7943, 0.305 * 255,
        255 * 0.5748, 255 * 0.7929, 0.2941 * 255,
        255 * 0.5886, 255 * 0.7913, 0.2833 * 255,
        255 * 0.6024, 255 * 0.7896, 0.2726 * 255,
        255 * 0.6161, 255 * 0.7878, 0.2622 * 255,
        255 * 0.6297, 255 * 0.7859, 0.2521 * 255,
        255 * 0.6433, 255 * 0.7839, 0.2423 * 255,
        255 * 0.6567, 255 * 0.7818, 0.2329 * 255,
        255 * 0.6701, 255 * 0.7796, 0.2239 * 255,
        255 * 0.6833, 255 * 0.7773, 0.2155 * 255,
        255 * 0.6963, 255 * 0.775, 0.2075 * 255,
        255 * 0.7091, 255 * 0.7727, 0.1998 * 255,
        255 * 0.7218, 255 * 0.7703, 0.1924 * 255,
        255 * 0.7344, 255 * 0.7679, 0.1852 * 255,
        255 * 0.7468, 255 * 0.7654, 0.1782 * 255,
        255 * 0.759, 255 * 0.7629, 0.1717 * 255,
        255 * 0.771, 255 * 0.7604, 0.1658 * 255,
        255 * 0.7829, 255 * 0.7579, 0.1608 * 255,
        255 * 0.7945, 255 * 0.7554, 0.157 * 255,
        255 * 0.806, 255 * 0.7529, 0.1546 * 255,
        255 * 0.8172, 255 * 0.7505, 0.1535 * 255,
        255 * 0.8281, 255 * 0.7481, 0.1536 * 255,
        255 * 0.8389, 255 * 0.7457, 0.1546 * 255,
        255 * 0.8495, 255 * 0.7435, 0.1564 * 255,
        255 * 0.86, 255 * 0.7413, 0.1587 * 255,
        255 * 0.8703, 255 * 0.7392, 0.1615 * 255,
        255 * 0.8804, 255 * 0.7372, 0.165 * 255,
        255 * 0.8903, 255 * 0.7353, 0.1695 * 255,
        255 * 0.9, 255 * 0.7336, 0.1749 * 255,
        255 * 0.9093, 255 * 0.7321, 0.1815 * 255,
        255 * 0.9184, 255 * 0.7308, 0.189 * 255,
        255 * 0.9272, 255 * 0.7298, 0.1973 * 255,
        255 * 0.9357, 255 * 0.729, 0.2061 * 255,
        255 * 0.944, 255 * 0.7285, 0.2151 * 255,
        255 * 0.9523, 255 * 0.7284, 0.2237 * 255,
        255 * 0.9606, 255 * 0.7285, 0.2312 * 255,
        255 * 0.9689, 255 * 0.7292, 0.2373 * 255,
        255 * 0.977, 255 * 0.7304, 0.2418 * 255,
        255 * 0.9842, 255 * 0.733, 0.2446 * 255,
        255 * 0.99, 255 * 0.7365, 0.2429 * 255,
        255 * 0.9946, 255 * 0.7407, 0.2394 * 255,
        255 * 0.9966, 255 * 0.7458, 0.2351 * 255,
        255 * 0.9971, 255 * 0.7513, 0.2309 * 255,
        255 * 0.9972, 255 * 0.7569, 0.2267 * 255,
        255 * 0.9971, 255 * 0.7626, 0.2224 * 255,
        255 * 0.9969, 255 * 0.7683, 0.2181 * 255,
        255 * 0.9966, 255 * 0.774, 0.2138 * 255,
        255 * 0.9962, 255 * 0.7798, 0.2095 * 255,
        255 * 0.9957, 255 * 0.7856, 0.2053 * 255,
        255 * 0.9949, 255 * 0.7915, 0.2012 * 255,
        255 * 0.9938, 255 * 0.7974, 0.1974 * 255,
        255 * 0.9923, 255 * 0.8034, 0.1939 * 255,
        255 * 0.9906, 255 * 0.8095, 0.1906 * 255,
        255 * 0.9885, 255 * 0.8156, 0.1875 * 255,
        255 * 0.9861, 255 * 0.8218, 0.1846 * 255,
        255 * 0.9835, 255 * 0.828, 0.1817 * 255,
        255 * 0.9807, 255 * 0.8342, 0.1787 * 255,
        255 * 0.9778, 255 * 0.8404, 0.1757 * 255,
        255 * 0.9748, 255 * 0.8467, 0.1726 * 255,
        255 * 0.972, 255 * 0.8529, 0.1695 * 255,
        255 * 0.9694, 255 * 0.8591, 0.1665 * 255,
        255 * 0.9671, 255 * 0.8654, 0.1636 * 255,
        255 * 0.9651, 255 * 0.8716, 0.1608 * 255,
        255 * 0.9634, 255 * 0.8778, 0.1582 * 255,
        255 * 0.9619, 255 * 0.884, 0.1557 * 255,
        255 * 0.9608, 255 * 0.8902, 0.1532 * 255,
        255 * 0.9601, 255 * 0.8963, 0.1507 * 255,
        255 * 0.9596, 255 * 0.9023, 0.148 * 255,
        255 * 0.9595, 255 * 0.9084, 0.145 * 255,
        255 * 0.9597, 255 * 0.9143, 0.1418 * 255,
        255 * 0.9601, 255 * 0.9203, 0.1382 * 255,
        255 * 0.9608, 255 * 0.9262, 0.1344 * 255,
        255 * 0.9618, 255 * 0.932, 0.1304 * 255,
        255 * 0.9629, 255 * 0.9379, 0.1261 * 255,
        255 * 0.9642, 255 * 0.9437, 0.1216 * 255,
        255 * 0.9657, 255 * 0.9494, 0.1168 * 255,
        255 * 0.9674, 255 * 0.9552, 0.1116 * 255,
        255 * 0.9692, 255 * 0.9609, 0.1061 * 255,
        255 * 0.9711, 255 * 0.9667, 0.1001 * 255,
        255 * 0.973, 255 * 0.9724, 0.0938 * 255,
        255 * 0.9749, 255 * 0.9782, 0.0872 * 255,
        255 * 0.9769, 255 * 0.9839, 0.0805 * 255];

    parulaColorMap = (value: number) => {
        const idx = Math.floor(value) * 3;
        return (
            [
                this.parulaColorMapArray[idx],
                this.parulaColorMapArray[idx + 1],
                this.parulaColorMapArray[idx + 2],
            ]
        )
    }

    coolColorMapArray = [
        0, 255, 255,
        1, 254, 255,
        2, 253, 255,
        3, 252, 255,
        4, 251, 255,
        5, 250, 255,
        6, 249, 255,
        7, 248, 255,
        8, 247, 255,
        9, 246, 255,
        10, 245, 255,
        11, 244, 255,
        12, 243, 255,
        13, 242, 255,
        14, 241, 255,
        15, 240, 255,
        16, 239, 255,
        17, 238, 255,
        18, 237, 255,
        19, 236, 255,
        20, 235, 255,
        21, 234, 255,
        22, 233, 255,
        23, 232, 255,
        24, 231, 255,
        25, 230, 255,
        26, 229, 255,
        27, 228, 255,
        28, 227, 255,
        29, 226, 255,
        30, 225, 255,
        31, 224, 255,
        32, 223, 255,
        32, 222, 255,
        34, 221, 255,
        35, 220, 255,
        36, 219, 255,
        36, 218, 255,
        38, 217, 255,
        39, 216, 255,
        40, 215, 255,
        40, 214, 255,
        42, 213, 255,
        43, 211, 255,
        44, 211, 255,
        44, 210, 255,
        46, 209, 255,
        47, 208, 255,
        48, 207, 255,
        48, 206, 255,
        50, 205, 255,
        51, 204, 255,
        52, 203, 255,
        52, 202, 255,
        54, 201, 255,
        55, 200, 255,
        56, 199, 255,
        56, 198, 255,
        58, 197, 255,
        59, 195, 255,
        60, 195, 255,
        60, 194, 255,
        62, 193, 255,
        63, 192, 255,
        64, 191, 255,
        65, 190, 255,
        65, 189, 255,
        67, 188, 255,
        68, 187, 255,
        69, 186, 255,
        70, 185, 255,
        71, 184, 255,
        72, 183, 255,
        73, 182, 255,
        73, 181, 255,
        75, 179, 255,
        76, 179, 255,
        77, 178, 255,
        78, 177, 255,
        79, 176, 255,
        80, 175, 255,
        81, 174, 255,
        81, 173, 255,
        83, 172, 255,
        84, 171, 255,
        85, 170, 255,
        86, 169, 255,
        87, 168, 255,
        88, 167, 255,
        89, 166, 255,
        89, 165, 255,
        91, 163, 255,
        92, 163, 255,
        93, 162, 255,
        94, 161, 255,
        95, 160, 255,
        96, 159, 255,
        97, 158, 255,
        97, 157, 255,
        99, 156, 255,
        100, 155, 255,
        101, 154, 255,
        102, 153, 255,
        103, 152, 255,
        104, 151, 255,
        105, 150, 255,
        105, 149, 255,
        107, 147, 255,
        108, 147, 255,
        109, 146, 255,
        110, 145, 255,
        111, 144, 255,
        112, 143, 255,
        113, 142, 255,
        113, 141, 255,
        115, 140, 255,
        116, 139, 255,
        117, 138, 255,
        118, 137, 255,
        119, 136, 255,
        120, 135, 255,
        121, 134, 255,
        121, 133, 255,
        123, 131, 255,
        124, 131, 255,
        125, 130, 255,
        126, 129, 255,
        127, 128, 255,
        128, 127, 255,
        129, 126, 255,
        130, 125, 255,
        131, 124, 255,
        131, 123, 255,
        133, 121, 255,
        134, 121, 255,
        135, 120, 255,
        136, 119, 255,
        137, 118, 255,
        138, 117, 255,
        139, 116, 255,
        140, 114, 255,
        141, 113, 255,
        142, 113, 255,
        143, 112, 255,
        144, 111, 255,
        145, 110, 255,
        146, 109, 255,
        147, 108, 255,
        147, 107, 255,
        149, 105, 255,
        150, 105, 255,
        151, 104, 255,
        152, 103, 255,
        153, 102, 255,
        154, 101, 255,
        155, 100, 255,
        156, 98, 255,
        157, 97, 255,
        158, 97, 255,
        159, 96, 255,
        160, 95, 255,
        161, 94, 255,
        162, 93, 255,
        163, 92, 255,
        163, 91, 255,
        165, 89, 255,
        166, 89, 255,
        167, 88, 255,
        168, 87, 255,
        169, 86, 255,
        170, 85, 255,
        171, 84, 255,
        172, 82, 255,
        173, 81, 255,
        174, 81, 255,
        175, 80, 255,
        176, 79, 255,
        177, 78, 255,
        178, 77, 255,
        179, 76, 255,
        179, 75, 255,
        181, 73, 255,
        182, 73, 255,
        183, 72, 255,
        184, 71, 255,
        185, 70, 255,
        186, 69, 255,
        187, 68, 255,
        188, 66, 255,
        189, 65, 255,
        190, 65, 255,
        191, 64, 255,
        192, 63, 255,
        193, 62, 255,
        194, 61, 255,
        195, 60, 255,
        195, 59, 255,
        197, 57, 255,
        198, 56, 255,
        199, 56, 255,
        200, 55, 255,
        201, 54, 255,
        202, 53, 255,
        203, 52, 255,
        204, 50, 255,
        205, 49, 255,
        206, 48, 255,
        207, 48, 255,
        208, 47, 255,
        209, 46, 255,
        210, 45, 255,
        211, 44, 255,
        211, 43, 255,
        213, 41, 255,
        214, 40, 255,
        215, 40, 255,
        216, 39, 255,
        217, 38, 255,
        218, 37, 255,
        219, 36, 255,
        220, 34, 255,
        221, 33, 255,
        222, 32, 255,
        223, 32, 255,
        224, 31, 255,
        225, 30, 255,
        226, 29, 255,
        227, 28, 255,
        227, 27, 255,
        229, 25, 255,
        230, 24, 255,
        231, 24, 255,
        232, 23, 255,
        233, 22, 255,
        234, 21, 255,
        235, 20, 255,
        236, 18, 255,
        237, 17, 255,
        238, 16, 255,
        239, 16, 255,
        240, 15, 255,
        241, 14, 255,
        242, 13, 255,
        243, 12, 255,
        243, 11, 255,
        245, 9, 255,
        246, 8, 255,
        247, 8, 255,
        248, 7, 255,
        249, 6, 255,
        250, 5, 255,
        251, 4, 255,
        252, 2, 255,
        253, 1, 255,
        254, 0, 255,
        255, 0, 255,
    ];

    coolColorMap = (value: number) => {
        const idx = Math.floor(value) * 3;
        return (
            [
                this.coolColorMapArray[idx],
                this.coolColorMapArray[idx + 1],
                this.coolColorMapArray[idx + 2],
            ]
        )
    }

    grayColorMapArray = [

        0, 0, 0,
        1, 1, 1,
        2, 2, 2,
        3, 3, 3,
        4, 4, 4,
        5, 5, 5,
        6, 6, 6,
        7, 7, 7,
        8, 8, 8,
        9, 9, 9,
        10, 10, 10,
        11, 11, 11,
        12, 12, 12,
        13, 13, 13,
        14, 14, 14,
        15, 15, 15,
        16, 16, 16,
        17, 17, 17,
        18, 18, 18,
        19, 19, 19,
        20, 20, 20,
        21, 21, 21,
        22, 22, 22,
        23, 23, 23,
        24, 24, 24,
        25, 25, 25,
        26, 26, 26,
        27, 27, 27,
        28, 28, 28,
        29, 29, 29,
        30, 30, 30,
        31, 31, 31,
        32, 32, 32,
        32, 32, 32,
        34, 34, 34,
        35, 35, 35,
        36, 36, 36,
        36, 36, 36,
        38, 38, 38,
        39, 39, 39,
        40, 40, 40,
        40, 40, 40,
        42, 42, 42,
        43, 43, 43,
        44, 44, 44,
        44, 44, 44,
        46, 46, 46,
        47, 47, 47,
        48, 48, 48,
        48, 48, 48,
        50, 50, 50,
        51, 51, 51,
        52, 52, 52,
        52, 52, 52,
        54, 54, 54,
        55, 55, 55,
        56, 56, 56,
        56, 56, 56,
        58, 58, 58,
        59, 59, 59,
        60, 60, 60,
        60, 60, 60,
        62, 62, 62,
        63, 63, 63,
        64, 64, 64,
        65, 65, 65,
        65, 65, 65,
        67, 67, 67,
        68, 68, 68,
        69, 69, 69,
        70, 70, 70,
        71, 71, 71,
        72, 72, 72,
        73, 73, 73,
        73, 73, 73,
        75, 75, 75,
        76, 76, 76,
        77, 77, 77,
        78, 78, 78,
        79, 79, 79,
        80, 80, 80,
        81, 81, 81,
        81, 81, 81,
        83, 83, 83,
        84, 84, 84,
        85, 85, 85,
        86, 86, 86,
        87, 87, 87,
        88, 88, 88,
        89, 89, 89,
        89, 89, 89,
        91, 91, 91,
        92, 92, 92,
        93, 93, 93,
        94, 94, 94,
        95, 95, 95,
        96, 96, 96,
        97, 97, 97,
        97, 97, 97,
        99, 99, 99,
        100, 100, 100,
        101, 101, 101,
        102, 102, 102,
        103, 103, 103,
        104, 104, 104,
        105, 105, 105,
        105, 105, 105,
        107, 107, 107,
        108, 108, 108,
        109, 109, 109,
        110, 110, 110,
        111, 111, 111,
        112, 112, 112,
        113, 113, 113,
        113, 113, 113,
        115, 115, 115,
        116, 116, 116,
        117, 117, 117,
        118, 118, 118,
        119, 119, 119,
        120, 120, 120,
        121, 121, 121,
        121, 121, 121,
        123, 123, 123,
        124, 124, 124,
        125, 125, 125,
        126, 126, 126,
        127, 127, 127,
        128, 128, 128,
        129, 129, 129,
        130, 130, 130,
        131, 131, 131,
        131, 131, 131,
        133, 133, 133,
        134, 134, 134,
        135, 135, 135,
        136, 136, 136,
        137, 137, 137,
        138, 138, 138,
        139, 139, 139,
        140, 140, 140,
        141, 141, 141,
        142, 142, 142,
        143, 143, 143,
        144, 144, 144,
        145, 145, 145,
        146, 146, 146,
        147, 147, 147,
        147, 147, 147,
        149, 149, 149,
        150, 150, 150,
        151, 151, 151,
        152, 152, 152,
        153, 153, 153,
        154, 154, 154,
        155, 155, 155,
        156, 156, 156,
        157, 157, 157,
        158, 158, 158,
        159, 159, 159,
        160, 160, 160,
        161, 161, 161,
        162, 162, 162,
        163, 163, 163,
        163, 163, 163,
        165, 165, 165,
        166, 166, 166,
        167, 167, 167,
        168, 168, 168,
        169, 169, 169,
        170, 170, 170,
        171, 171, 171,
        172, 172, 172,
        173, 173, 173,
        174, 174, 174,
        175, 175, 175,
        176, 176, 176,
        177, 177, 177,
        178, 178, 178,
        179, 179, 179,
        179, 179, 179,
        181, 181, 181,
        182, 182, 182,
        183, 183, 183,
        184, 184, 184,
        185, 185, 185,
        186, 186, 186,
        187, 187, 187,
        188, 188, 188,
        189, 189, 189,
        190, 190, 190,
        191, 191, 191,
        192, 192, 192,
        193, 193, 193,
        194, 194, 194,
        195, 195, 195,
        195, 195, 195,
        197, 197, 197,
        198, 198, 198,
        199, 199, 199,
        200, 200, 200,
        201, 201, 201,
        202, 202, 202,
        203, 203, 203,
        204, 204, 204,
        205, 205, 205,
        206, 206, 206,
        207, 207, 207,
        208, 208, 208,
        209, 209, 209,
        210, 210, 210,
        211, 211, 211,
        211, 211, 211,
        213, 213, 213,
        214, 214, 214,
        215, 215, 215,
        216, 216, 216,
        217, 217, 217,
        218, 218, 218,
        219, 219, 219,
        220, 220, 220,
        221, 221, 221,
        222, 222, 222,
        223, 223, 223,
        224, 224, 224,
        225, 225, 225,
        226, 226, 226,
        227, 227, 227,
        227, 227, 227,
        229, 229, 229,
        230, 230, 230,
        231, 231, 231,
        232, 232, 232,
        233, 233, 233,
        234, 234, 234,
        235, 235, 235,
        236, 236, 236,
        237, 237, 237,
        238, 238, 238,
        239, 239, 239,
        240, 240, 240,
        241, 241, 241,
        242, 242, 242,
        243, 243, 243,
        243, 243, 243,
        245, 245, 245,
        246, 246, 246,
        247, 247, 247,
        248, 248, 248,
        249, 249, 249,
        250, 250, 250,
        251, 251, 251,
        252, 252, 252,
        253, 253, 253,
        254, 254, 254,
        255, 255, 255,
    ]

    grayColorMap = (value: number) => {
        // value is 0–255
        const idx = Math.floor(value) * 3;
        return (
            [
                this.grayColorMapArray[idx],
                this.grayColorMapArray[idx + 1],
                this.grayColorMapArray[idx + 2],
            ]
        )
    }


    viridisColorMapArray = [
        68, 1, 84,
        68, 2, 85,
        68, 3, 87,
        69, 5, 88,
        69, 6, 90,
        69, 8, 91,
        70, 9, 92,
        70, 11, 94,
        70, 12, 95,
        70, 14, 97,
        71, 15, 98,
        71, 17, 99,
        71, 18, 101,
        71, 20, 102,
        71, 21, 103,
        71, 22, 105,
        71, 24, 106,
        72, 25, 107,
        72, 26, 108,
        72, 28, 110,
        72, 29, 111,
        72, 30, 112,
        72, 32, 113,
        72, 33, 114,
        72, 34, 115,
        72, 35, 116,
        71, 37, 117,
        71, 38, 118,
        71, 39, 119,
        71, 40, 120,
        71, 42, 121,
        71, 43, 122,
        71, 44, 123,
        70, 45, 124,
        70, 47, 124,
        70, 48, 125,
        70, 49, 126,
        69, 50, 127,
        69, 52, 127,
        69, 53, 128,
        69, 54, 129,
        68, 55, 129,
        68, 57, 130,
        67, 58, 131,
        67, 59, 131,
        67, 60, 132,
        66, 61, 132,
        66, 62, 133,
        66, 64, 133,
        65, 65, 134,
        65, 66, 134,
        64, 67, 135,
        64, 68, 135,
        63, 69, 135,
        63, 71, 136,
        62, 72, 136,
        62, 73, 137,
        61, 74, 137,
        61, 75, 137,
        61, 76, 137,
        60, 77, 138,
        60, 78, 138,
        59, 80, 138,
        59, 81, 138,
        58, 82, 139,
        58, 83, 139,
        57, 84, 139,
        57, 85, 139,
        56, 86, 139,
        56, 87, 140,
        55, 88, 140,
        55, 89, 140,
        54, 90, 140,
        54, 91, 140,
        53, 92, 140,
        53, 93, 140,
        52, 94, 141,
        52, 95, 141,
        51, 96, 141,
        51, 97, 141,
        50, 98, 141,
        50, 99, 141,
        49, 100, 141,
        49, 101, 141,
        49, 102, 141,
        48, 103, 141,
        48, 104, 141,
        47, 105, 141,
        47, 106, 141,
        46, 107, 142,
        46, 108, 142,
        46, 109, 142,
        45, 110, 142,
        45, 111, 142,
        44, 112, 142,
        44, 113, 142,
        44, 114, 142,
        43, 115, 142,
        43, 116, 142,
        42, 117, 142,
        42, 118, 142,
        42, 119, 142,
        41, 120, 142,
        41, 121, 142,
        40, 122, 142,
        40, 122, 142,
        40, 123, 142,
        39, 124, 142,
        39, 125, 142,
        39, 126, 142,
        38, 127, 142,
        38, 128, 142,
        38, 129, 142,
        37, 130, 142,
        37, 131, 141,
        36, 132, 141,
        36, 133, 141,
        36, 134, 141,
        35, 135, 141,
        35, 136, 141,
        35, 137, 141,
        34, 137, 141,
        34, 138, 141,
        34, 139, 141,
        33, 140, 141,
        33, 141, 140,
        33, 142, 140,
        32, 143, 140,
        32, 144, 140,
        32, 145, 140,
        31, 146, 140,
        31, 147, 139,
        31, 148, 139,
        31, 149, 139,
        31, 150, 139,
        30, 151, 138,
        30, 152, 138,
        30, 153, 138,
        30, 153, 138,
        30, 154, 137,
        30, 155, 137,
        30, 156, 137,
        30, 157, 136,
        30, 158, 136,
        30, 159, 136,
        30, 160, 135,
        31, 161, 135,
        31, 162, 134,
        31, 163, 134,
        32, 164, 133,
        32, 165, 133,
        33, 166, 133,
        33, 167, 132,
        34, 167, 132,
        35, 168, 131,
        35, 169, 130,
        36, 170, 130,
        37, 171, 129,
        38, 172, 129,
        39, 173, 128,
        40, 174, 127,
        41, 175, 127,
        42, 176, 126,
        43, 177, 125,
        44, 177, 125,
        46, 178, 124,
        47, 179, 123,
        48, 180, 122,
        50, 181, 122,
        51, 182, 121,
        53, 183, 120,
        54, 184, 119,
        56, 185, 118,
        57, 185, 118,
        59, 186, 117,
        61, 187, 116,
        62, 188, 115,
        64, 189, 114,
        66, 190, 113,
        68, 190, 112,
        69, 191, 111,
        71, 192, 110,
        73, 193, 109,
        75, 194, 108,
        77, 194, 107,
        79, 195, 105,
        81, 196, 104,
        83, 197, 103,
        85, 198, 102,
        87, 198, 101,
        89, 199, 100,
        91, 200, 98,
        94, 201, 97,
        96, 201, 96,
        98, 202, 95,
        100, 203, 93,
        103, 204, 92,
        105, 204, 91,
        107, 205, 89,
        109, 206, 88,
        112, 206, 86,
        114, 207, 85,
        116, 208, 84,
        119, 208, 82,
        121, 209, 81,
        124, 210, 79,
        126, 210, 78,
        129, 211, 76,
        131, 211, 75,
        134, 212, 73,
        136, 213, 71,
        139, 213, 70,
        141, 214, 68,
        144, 214, 67,
        146, 215, 65,
        149, 215, 63,
        151, 216, 62,
        154, 216, 60,
        157, 217, 58,
        159, 217, 56,
        162, 218, 55,
        165, 218, 53,
        167, 219, 51,
        170, 219, 50,
        173, 220, 48,
        175, 220, 46,
        178, 221, 44,
        181, 221, 43,
        183, 221, 41,
        186, 222, 39,
        189, 222, 38,
        191, 223, 36,
        194, 223, 34,
        197, 223, 33,
        199, 224, 31,
        202, 224, 30,
        205, 224, 29,
        207, 225, 28,
        210, 225, 27,
        212, 225, 26,
        215, 226, 25,
        218, 226, 24,
        220, 226, 24,
        223, 227, 24,
        225, 227, 24,
        228, 227, 24,
        231, 228, 25,
        233, 228, 25,
        236, 228, 26,
        238, 229, 27,
        241, 229, 28,
        243, 229, 30,
        246, 230, 31,
        248, 230, 33,
        250, 230, 34,
        253, 231, 36,
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

    spectralColorMapArray = [
        158, 1, 66,
        160, 3, 66,
        162, 5, 67,
        164, 8, 67,
        166, 10, 68,
        168, 12, 68,
        170, 15, 69,
        173, 17, 69,
        175, 20, 70,
        177, 22, 70,
        179, 24, 71,
        181, 27, 71,
        183, 29, 72,
        186, 32, 72,
        188, 34, 73,
        190, 36, 73,
        192, 39, 74,
        194, 41, 74,
        196, 44, 75,
        198, 46, 75,
        201, 48, 76,
        203, 51, 76,
        205, 53, 77,
        207, 56, 77,
        209, 58, 78,
        211, 60, 78,
        213, 62, 78,
        214, 64, 78,
        216, 66, 77,
        217, 68, 77,
        218, 70, 76,
        219, 72, 76,
        220, 73, 75,
        222, 75, 75,
        223, 77, 75,
        224, 79, 74,
        225, 81, 74,
        226, 83, 73,
        228, 85, 73,
        229, 86, 72,
        230, 88, 72,
        231, 90, 71,
        233, 92, 71,
        234, 94, 70,
        235, 96, 70,
        236, 97, 69,
        237, 99, 69,
        239, 101, 68,
        240, 103, 68,
        241, 105, 67,
        242, 107, 67,
        244, 109, 67,
        244, 111, 68,
        244, 114, 69,
        245, 116, 70,
        245, 119, 71,
        245, 121, 72,
        246, 124, 74,
        246, 126, 75,
        246, 129, 76,
        247, 131, 77,
        247, 134, 78,
        247, 137, 79,
        248, 139, 81,
        248, 142, 82,
        248, 144, 83,
        249, 147, 84,
        249, 149, 85,
        250, 152, 86,
        250, 154, 88,
        250, 157, 89,
        251, 159, 90,
        251, 162, 91,
        251, 165, 92,
        252, 167, 94,
        252, 170, 95,
        252, 172, 96,
        253, 174, 97,
        253, 176, 99,
        253, 178, 101,
        253, 180, 102,
        253, 182, 104,
        253, 184, 106,
        253, 186, 107,
        253, 188, 109,
        253, 190, 110,
        253, 192, 112,
        253, 194, 114,
        253, 196, 115,
        253, 198, 117,
        253, 200, 119,
        253, 202, 120,
        253, 204, 122,
        253, 206, 124,
        253, 208, 125,
        253, 210, 127,
        253, 212, 129,
        253, 214, 130,
        253, 216, 132,
        253, 218, 134,
        253, 220, 135,
        253, 222, 137,
        254, 224, 139,
        254, 225, 141,
        254, 226, 143,
        254, 227, 145,
        254, 228, 147,
        254, 230, 149,
        254, 231, 151,
        254, 232, 153,
        254, 233, 155,
        254, 234, 157,
        254, 236, 159,
        254, 237, 161,
        254, 238, 163,
        254, 239, 165,
        254, 241, 167,
        254, 242, 169,
        254, 243, 171,
        254, 244, 173,
        254, 245, 175,
        254, 247, 177,
        254, 248, 179,
        254, 249, 181,
        254, 250, 183,
        254, 251, 185,
        254, 253, 187,
        254, 254, 189,
        254, 254, 190,
        253, 254, 188,
        252, 254, 187,
        251, 253, 185,
        250, 253, 184,
        249, 252, 182,
        248, 252, 181,
        247, 252, 179,
        246, 251, 178,
        245, 251, 176,
        244, 250, 174,
        243, 250, 173,
        242, 250, 171,
        241, 249, 170,
        240, 249, 168,
        239, 248, 167,
        238, 248, 165,
        237, 248, 164,
        236, 247, 162,
        235, 247, 161,
        234, 246, 159,
        233, 246, 158,
        232, 246, 156,
        231, 245, 155,
        230, 245, 153,
        230, 245, 152,
        227, 244, 152,
        225, 243, 152,
        223, 242, 153,
        220, 241, 153,
        218, 240, 154,
        216, 239, 154,
        213, 238, 155,
        211, 237, 155,
        209, 236, 156,
        206, 235, 156,
        204, 234, 157,
        202, 233, 157,
        199, 232, 158,
        197, 231, 158,
        195, 230, 159,
        192, 229, 159,
        190, 229, 160,
        188, 228, 160,
        186, 227, 160,
        183, 226, 161,
        181, 225, 161,
        179, 224, 162,
        176, 223, 162,
        174, 222, 163,
        172, 221, 163,
        169, 220, 164,
        166, 219, 164,
        164, 218, 164,
        161, 217, 164,
        158, 216, 164,
        156, 215, 164,
        153, 214, 164,
        150, 213, 164,
        148, 212, 164,
        145, 210, 164,
        142, 209, 164,
        139, 208, 164,
        137, 207, 164,
        134, 206, 164,
        131, 205, 164,
        129, 204, 164,
        126, 203, 164,
        123, 202, 164,
        120, 201, 164,
        118, 200, 164,
        115, 199, 164,
        112, 198, 164,
        110, 197, 164,
        107, 196, 164,
        104, 195, 164,
        102, 194, 165,
        99, 191, 165,
        97, 189, 166,
        95, 187, 167,
        93, 184, 168,
        91, 182, 169,
        89, 180, 170,
        87, 178, 171,
        85, 175, 172,
        83, 173, 173,
        81, 171, 174,
        79, 168, 175,
        77, 166, 176,
        75, 164, 177,
        73, 162, 178,
        71, 159, 179,
        69, 157, 180,
        67, 155, 181,
        65, 153, 181,
        63, 150, 182,
        61, 148, 183,
        59, 146, 184,
        57, 143, 185,
        55, 141, 186,
        53, 139, 187,
        51, 137, 188,
        50, 134, 188,
        52, 132, 187,
        54, 130, 186,
        56, 128, 185,
        57, 125, 184,
        59, 123, 183,
        61, 121, 182,
        62, 119, 181,
        64, 117, 180,
        66, 114, 178,
        68, 112, 177,
        69, 110, 176,
        71, 108, 175,
        73, 105, 174,
        75, 103, 173,
        76, 101, 172,
        78, 99, 171,
        80, 96, 170,
        81, 94, 169,
        83, 92, 168,
        85, 90, 167,
        87, 87, 166,
        88, 85, 165,
        90, 83, 164,
        92, 81, 163,
        94, 79, 162,];


    spectralColorMap = (value: number) => {
        const idx = Math.round(value) * 3;
        return (
            [
                this.spectralColorMapArray[idx],
                this.spectralColorMapArray[idx + 1],
                this.spectralColorMapArray[idx + 2],
            ]
        )
    }

    nipySpectralColorMapArray = [
        0, 0, 0,
        9, 0, 10,
        18, 0, 21,
        28, 0, 31,
        37, 0, 42,
        46, 0, 53,
        56, 0, 63,
        65, 0, 74,
        74, 0, 85,
        84, 0, 95,
        93, 0, 106,
        102, 0, 117,
        112, 0, 127,
        119, 0, 136,
        120, 0, 137,
        122, 0, 138,
        123, 0, 140,
        124, 0, 141,
        126, 0, 142,
        127, 0, 144,
        128, 0, 145,
        129, 0, 146,
        131, 0, 148,
        132, 0, 149,
        133, 0, 150,
        135, 0, 152,
        130, 0, 153,
        119, 0, 155,
        109, 0, 156,
        98, 0, 157,
        87, 0, 159,
        77, 0, 160,
        66, 0, 161,
        55, 0, 163,
        45, 0, 164,
        34, 0, 165,
        23, 0, 167,
        13, 0, 168,
        2, 0, 169,
        0, 0, 173,
        0, 0, 177,
        0, 0, 181,
        0, 0, 185,
        0, 0, 189,
        0, 0, 193,
        0, 0, 197,
        0, 0, 201,
        0, 0, 205,
        0, 0, 209,
        0, 0, 213,
        0, 0, 217,
        0, 0, 221,
        0, 9, 221,
        0, 18, 221,
        0, 28, 221,
        0, 37, 221,
        0, 46, 221,
        0, 56, 221,
        0, 65, 221,
        0, 74, 221,
        0, 84, 221,
        0, 93, 221,
        0, 102, 221,
        0, 112, 221,
        0, 119, 221,
        0, 122, 221,
        0, 125, 221,
        0, 127, 221,
        0, 130, 221,
        0, 133, 221,
        0, 135, 221,
        0, 138, 221,
        0, 141, 221,
        0, 143, 221,
        0, 146, 221,
        0, 149, 221,
        0, 151, 221,
        0, 153, 219,
        0, 155, 215,
        0, 156, 211,
        0, 157, 207,
        0, 159, 203,
        0, 160, 199,
        0, 161, 195,
        0, 163, 191,
        0, 164, 187,
        0, 165, 183,
        0, 167, 179,
        0, 168, 175,
        0, 169, 171,
        0, 170, 168,
        0, 170, 165,
        0, 170, 162,
        0, 170, 160,
        0, 170, 157,
        0, 170, 154,
        0, 170, 151,
        0, 170, 149,
        0, 170, 146,
        0, 170, 143,
        0, 170, 141,
        0, 170, 138,
        0, 170, 135,
        0, 168, 125,
        0, 167, 114,
        0, 166, 103,
        0, 164, 93,
        0, 163, 82,
        0, 162, 71,
        0, 160, 61,
        0, 159, 50,
        0, 158, 39,
        0, 156, 29,
        0, 155, 18,
        0, 154, 7,
        0, 153, 0,
        0, 156, 0,
        0, 158, 0,
        0, 161, 0,
        0, 164, 0,
        0, 166, 0,
        0, 169, 0,
        0, 172, 0,
        0, 174, 0,
        0, 177, 0,
        0, 180, 0,
        0, 182, 0,
        0, 185, 0,
        0, 188, 0,
        0, 190, 0,
        0, 193, 0,
        0, 196, 0,
        0, 198, 0,
        0, 201, 0,
        0, 204, 0,
        0, 207, 0,
        0, 209, 0,
        0, 212, 0,
        0, 215, 0,
        0, 217, 0,
        0, 220, 0,
        0, 223, 0,
        0, 225, 0,
        0, 228, 0,
        0, 231, 0,
        0, 233, 0,
        0, 236, 0,
        0, 239, 0,
        0, 241, 0,
        0, 244, 0,
        0, 247, 0,
        0, 249, 0,
        0, 252, 0,
        0, 255, 0,
        14, 255, 0,
        29, 255, 0,
        43, 255, 0,
        58, 255, 0,
        73, 255, 0,
        87, 255, 0,
        102, 255, 0,
        117, 255, 0,
        131, 255, 0,
        146, 255, 0,
        161, 255, 0,
        175, 255, 0,
        187, 254, 0,
        191, 253, 0,
        195, 251, 0,
        199, 250, 0,
        203, 249, 0,
        207, 247, 0,
        211, 246, 0,
        215, 245, 0,
        219, 243, 0,
        223, 242, 0,
        227, 241, 0,
        231, 239, 0,
        235, 238, 0,
        238, 236, 0,
        239, 233, 0,
        241, 231, 0,
        242, 228, 0,
        243, 225, 0,
        245, 223, 0,
        246, 220, 0,
        247, 217, 0,
        249, 215, 0,
        250, 212, 0,
        251, 209, 0,
        253, 207, 0,
        254, 204, 0,
        255, 201, 0,
        255, 197, 0,
        255, 193, 0,
        255, 189, 0,
        255, 185, 0,
        255, 181, 0,
        255, 177, 0,
        255, 173, 0,
        255, 169, 0,
        255, 165, 0,
        255, 161, 0,
        255, 157, 0,
        255, 153, 0,
        255, 141, 0,
        255, 129, 0,
        255, 117, 0,
        255, 105, 0,
        255, 93, 0,
        255, 81, 0,
        255, 69, 0,
        255, 57, 0,
        255, 44, 0,
        255, 32, 0,
        255, 20, 0,
        255, 8, 0,
        254, 0, 0,
        251, 0, 0,
        249, 0, 0,
        246, 0, 0,
        243, 0, 0,
        241, 0, 0,
        238, 0, 0,
        235, 0, 0,
        233, 0, 0,
        230, 0, 0,
        227, 0, 0,
        225, 0, 0,
        222, 0, 0,
        220, 0, 0,
        219, 0, 0,
        217, 0, 0,
        216, 0, 0,
        215, 0, 0,
        213, 0, 0,
        212, 0, 0,
        211, 0, 0,
        209, 0, 0,
        208, 0, 0,
        207, 0, 0,
        205, 0, 0,
        204, 0, 0,
        204, 12, 12,
        204, 27, 27,
        204, 44, 44,
        204, 60, 60,
        204, 76, 76,
        204, 92, 92,
        204, 108, 108,
        204, 124, 124,
        204, 140, 140,
        204, 156, 156,
        204, 172, 172,
        204, 188, 188,
        204, 204, 204,
    ];

    nipySpectralColorMap = (value: number) => {
        const idx = Math.round(value) * 3;
        return (
            [
                this.nipySpectralColorMapArray[idx],
                this.nipySpectralColorMapArray[idx + 1],
                this.nipySpectralColorMapArray[idx + 2],
            ]
        )
    }

    colorMapFunctions: Record<string, any> = {
        parula: this.parulaColorMap,
        viridis: this.viridisColorMap,
        gray: this.grayColorMap,
        jet: this.jetColorMap,
        seimsic: this.seimsicColorMap,
        hot: this.hotColorMap,
        cool: this.coolColorMap,
        coolwarm: this.coolWarmColorMap,
        plasma: this.plasmaColorMap,
        inferno: this.infernoColorMap,
        magma: this.magmaColorMap,
        cividis: this.cividisColorMap,
        spectral: this.spectralColorMap,
        "nipy spectral": this.nipySpectralColorMap,
    }

    colorMapArrays: Record<string, any> = {
        parula: this.parulaColorMapArray,
        viridis: this.viridisColorMapArray,
        gray: this.grayColorMapArray,
        jet: this.jetColorMapArray,
        seimsic: this.seimsicColorMapArray,
        hot: this.hotColorMapArray,
        cool: this.coolColorMapArray,
        coolwarm: this.coolWarmColorMapArray,
        plasma: this.plasmaColorMapArray,
        inferno: this.infernoColorMapArray,
        magma: this.magmaColorMapArray,
        cividis: this.cividisColorMapArray,
        spectral: this.spectralColorMapArray,
        "nipy spectral": this.nipySpectralColorMapArray,
    }



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


    getImageDimensions = () => {
        if (this.playing === false) {
            return this.imageDimensionsBackup;
        }

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
            colorMap: "parula", // "jet", "gray", ...
            autoZ: true,
            initialAutoXY: true,
            zMin: 0,
            zMax: 100,
            xMin: 0,
            xMax: 255,
            yMin: 0,
            yMax: 255,
            // roiX1ChannelName: "loc://aaa",
            // roiX2ChannelName: "loc://bbb",
            // roiY1ChannelName: "loc://ccc",
            // roiY2ChannelName: "loc://ddd",
        },
        channelNames: [],
        groupNames: [],
        rules: [],
        regionsOfInterest: [],
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

    getTdlCopy(newKey?: boolean): Record<string, any> {
        const result = super.getTdlCopy(newKey);
        result["regionsOfInterest"] = JSON.parse(JSON.stringify(this.getRegionsOfInterest()));
        return result;
    }

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
        this.autoXY = this.getText()["initialAutoXY"];
        this.resetImage();
    }
}
