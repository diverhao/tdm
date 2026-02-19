import * as GlobalMethods from "../../../common/GlobalMethods";
import * as React from "react";
import { Channel_ACCESS_RIGHTS, getMouseEventClientX, getMouseEventClientY, GlobalVariables } from "../../../common/GlobalVariables";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { ScaledSliderSidebar } from "./ScaledSliderSidebar";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { ScaledSliderRules } from "./ScaledSliderRules";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { parseIntAngle } from "../../../common/GlobalMethods";
import { Log } from "../../../common/Log";
import { ElementRectangleButton } from "../../helperWidgets/SharedElements/RectangleButton";
import { Scale } from "../../helperWidgets/SharedElements/Scale";

export type type_ScaledSlider_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
};

export class ScaledSlider extends BaseWidget {
    readonly sliderBlockPercentage = 50;
    showSettings: boolean = false;
    mouseDownIntervalTimer: any = undefined;
    readonly mouseDownDelay: number = 500; // ms
    _tmp_handleMouseMove: any;
    _tmp_handleMouseUp: any;

    _rules: ScaledSliderRules;

    constructor(widgetTdl: type_ScaledSlider_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this.setReadWriteType("write");

        this._rules = new ScaledSliderRules(this, widgetTdl);
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
                    {/* <this._ElementArea></this._ElementArea> */}
                    <this._ElementAreaRaw></this._ElementAreaRaw>
                    {this.showResizers() ? <this._ElementResizer /> : null}
                </div>
                {this.showSidebar() ? this.getSidebar()?.getElement() : null}

            </ErrorBoundary>
        );
    };

    _ElementAreaRaw = ({ }: any): React.JSX.Element => {
        const whiteSpace = this.getAllText().wrapWord ? "normal" : "pre";
        const justifyContent = this.getAllText().horizontalAlign;
        const alignItems = this.getAllText().verticalAlign;
        const fontFamily = this.getAllText().fontFamily;
        const fontSize = this.getAllText().fontSize;
        const fontStyle = this.getAllText().fontStyle;
        const outline = this._getElementAreaRawOutlineStyle();
        const position = "relative";
        const backgroundColor = this._getElementAreaRawBackgroundStyle();

        return (
            <div
                style={{
                    display: "inline-flex",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    userSelect: "none",
                    overflow: "visible",
                    whiteSpace: whiteSpace,
                    justifyContent: justifyContent,
                    alignItems: alignItems,
                    fontFamily: fontFamily,
                    fontSize: fontSize,
                    fontStyle: fontStyle,
                    outline: outline,
                    position: position,
                    backgroundColor: backgroundColor,
                }}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                <this._ElementScaledSlider></this._ElementScaledSlider>
                <this._ElementSettings></this._ElementSettings>
            </div>
        );
    };

    _Element = React.memo(this._ElementRaw, () => this._useMemoedElement());
    _ElementArea = React.memo(this._ElementAreaRaw, () => this._useMemoedElement());

    _ElementScaledSlider = () => {
        const appearance = this.getAllText()["appearance"];
        if (appearance === "contemporary") {
            return <this._ElementScaledSliderContemporary></this._ElementScaledSliderContemporary>
        } else {
            return <this._ElementScaledSliderTraditional></this._ElementScaledSliderTraditional>
        }
    }

    _ElementScaledSliderTraditional = () => {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    // new
                    display: "inline-flex",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    flexShrink: "0",
                    color: this._getElementAreaRawTextStyle(),
                }}
            >
                <this._ElementValue></this._ElementValue>
                <this._ElementScaleTraditional></this._ElementScaleTraditional>
                <this._ElementSliderTraditional></this._ElementSliderTraditional>
            </div>
        );
    };

    _ElementScaledSliderContemporary = () => {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    // new
                    display: "inline-flex",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    flexShrink: "0",
                    opacity: this.getAllText()["invisibleInOperation"] === true && !g_widgets1.isEditing() ? 0 : 1,
                    color: this._getElementAreaRawTextStyle(),
                }}
            >
                {this.getAllText()["showPvValue"] === true ? <this._ElementValue></this._ElementValue> : null}
                <this._ElementSliderContemporary></this._ElementSliderContemporary>
                {this.getAllText()["showLabels"] === true ? <this._ElementScaleContemporary></this._ElementScaleContemporary> : null}
            </div>
        );
    };

    _ElementSettings = () => {
        if (this.showSettings === false) {
            return null;
        }

        const [channelValue, setChannelValue] = React.useState<number>(parseFloat(this._getChannelValue(true) as string));
        const [stepSize, setStepSize] = React.useState<number>(this.getAllText()["stepSize"]);
        const elementRef = React.useRef<any>(null);

        const width = 200;
        let height = 200; // we assume this

        let left = 0;
        let top = this.getAllStyle()["height"];
        let bottom = -1;
        let right = -1;
        const dx1 = window.innerWidth - this.getAllStyle()["left"] - this.getAllStyle()["width"];
        const dy1 = window.innerHeight - this.getAllStyle()["top"] - this.getAllStyle()["height"];
        const dx2 = this.getAllStyle()["left"];
        const dy2 = this.getAllStyle()["top"];

        if (dy1 > height) {
            // bottom, default
        } else if (dx1 > width) {
            // right
            left = this.getAllStyle()["width"];
            top = 0;
        } else if (dx2 > width) {
            // left
            right = this.getAllStyle()["width"];
            top = 0;
        } else if (dy2 > height) {
            // top
            left = 0;
            bottom = this.getAllStyle()["height"];
        } else {
            // do nothing, use default
        }

        return (
            <div
                ref={elementRef}
                style={{
                    display: "inline-flex",
                    position: "absolute",
                    flexDirection: "column",
                    left: right === -1 ? left : "",
                    right: right === -1 ? "" : right,
                    top: bottom === -1 ? top : "",
                    bottom: bottom === -1 ? "" : bottom,
                    backgroundColor: "white",
                    width: width,
                    fontSize: GlobalVariables.defaultFontSize,
                    border: "solid 1px black",
                    padding: 5,
                    borderRadius: 5,
                    // height: 200,
                }}
            >
                <form
                    style={{
                        display: "inline-flex",
                        flexDirection: "row",
                        margin: "3px",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                    }}
                    onSubmit={(event: any) => {
                        event.preventDefault();
                    }}
                >
                    <label>Value: </label>
                    <input
                        style={{
                            width: "60%",
                            fontSize: 15,
                        }}
                        type="number"
                        name="value"
                        step="any"
                        value={channelValue}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                            const newVal = event.target.value;
                            const newValueNum = parseFloat(newVal);
                            if (!isNaN(newValueNum)) {
                                setChannelValue(newValueNum);
                            }
                        }}
                        // must use enter to change the value
                        onBlur={(event: any) => { }}
                    />
                </form>
                <form
                    style={{
                        display: "inline-flex",
                        flexDirection: "row",
                        margin: "3px",
                        width: "100%",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                    onSubmit={(event: any) => {
                        event.preventDefault();
                    }}
                >
                    <label>Step Size: </label>
                    <input
                        style={{
                            width: "60%",
                            fontSize: 15,
                        }}
                        type="number"
                        name="stepSize"
                        step="any"
                        value={stepSize}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                            const newVal = event.target.value;
                            const newValNum = parseFloat(newVal);
                            if (!isNaN(newValNum)) {
                                setStepSize(parseFloat(newVal));
                            }
                        }}
                        // must use enter to change the value
                        onBlur={(event: any) => { }}
                    />
                </form>
                <div
                    style={{
                        display: "inline-flex",
                        flexDirection: "row",
                        margin: 3,
                        width: "100%",
                        justifyContent: "space-evenly",
                    }}
                >
                    <ElementRectangleButton
                        handleClick={(event: any) => {
                            event.preventDefault();
                            try {
                                const channelName = this.getChannelNames()[0];
                                const channel = g_widgets1.getTcaChannel(channelName);
                                const windowId = g_widgets1.getRoot().getDisplayWindowClient().getWindowId();
                                channel.put(
                                    windowId,
                                    {
                                        value: channelValue,
                                    },
                                    1
                                );
                            } catch (e) {
                                Log.error(e);
                            }
                            this.getText()["stepSize"] = stepSize;
                            this.closeSettings();
                        }}
                    >
                        OK
                    </ElementRectangleButton>
                    <ElementRectangleButton
                        handleClick={(event: any) => {
                            event?.preventDefault();
                            this.closeSettings();
                        }}
                    >
                        Cancel
                    </ElementRectangleButton>
                </div>
            </div>
        );
    };

    /**
     * Displays the current channel (PV) value and step size in a horizontal row.
     * 
     * Layout: [step=<stepSize>]  ............  [<pvValue>]
     * 
     * - Left side: step size (e.g. "step=0.1"), indicating how much each click changes the value
     * - Right side: formatted PV value with optional unit (e.g. "3.14 mm")
     * - Hidden if showPvValue is false
     * - Uses flexShrink: 0 to maintain its height regardless of container sizing
     * - Text color follows the alarm-aware color from the channel
     */
    _ElementValue = () => {
        const allText = this.getAllText();
        const showPvValue = allText["showPvValue"];

        if (showPvValue === false) {
            return null;
        }

        const color = this._getElementAreaRawTextStyle();
        const showUnit = allText["showUnit"];
        const pvValue = this.getFormattedChannelValue(showUnit);
        return (
            // container
            <div
                style={{
                    width: "100%",
                    paddingTop: 2,
                    paddingBottom: 2,
                    position: "relative",
                    display: "inline-flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexShrink: 0, // do not shrink
                    boxSizing: "border-box",
                    color: color,
                }}
            >
                {/* step size */}
                <div>
                    {`step=${this.getAllText()["stepSize"]}`}
                </div>
                {/* pv value */}
                <div>
                    {pvValue}
                </div>
            </div>
        );
    };

    _ElementScaleContemporary = () => {
        const scaleParam = this.calcScaleParam();
        return (
            <Scale
                min={scaleParam["min"]}
                max={scaleParam["max"]}
                numIntervals={scaleParam["numIntervals"]}
                position={"bottom"}
                show={scaleParam["showLabels"]}
                length={scaleParam["length"]}
                scale={scaleParam["scale"]}
                color={scaleParam["color"]}
                compact={scaleParam["compact"]}

            ></Scale>
        )
    };

    _ElementScaleTraditional = () => {
        const scaleParam = this.calcScaleParam();
        return (
            <Scale
                min={scaleParam["min"]}
                max={scaleParam["max"]}
                numIntervals={scaleParam["numIntervals"]}
                position={"top"}
                show={scaleParam["showLabels"]}
                length={scaleParam["length"]}
                scale={scaleParam["scale"]}
                color={scaleParam["color"]}
                compact={scaleParam["compact"]}

            ></Scale>

        )
    };

    _ElementSliderContemporary = () => {
        const sliderRef = React.useRef<any>(null);
        const blockRef = React.useRef<any>(null);
        const blockSize = 14;
        let blockColor = "rgba(255, 255, 255 ,1)";
        let blockHighlightColor = "rgba(0, 100, 255, 1)";
        blockHighlightColor = "rgba(255, 255, 255, 1)";

        return (
            <div
                ref={sliderRef}
                tabIndex={0}
                style={{
                    display: "inline-flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    width: "100%",
                    height: blockSize,
                    position: "relative",
                    overflow: "visible",
                    flexShrink: "0",
                }}
                onKeyDown={(event: any) => {
                    this.handleKeyDown(event);
                }}
                onMouseDown={(event: any) => {
                    this.handleMouseDown(event, blockRef);
                }}
                onMouseUp={(event: any) => {
                    this.handleMouseUp(event);
                }}
                // focus the element so that we can use keyboard event
                onMouseEnter={(event: any) => {
                    this.handleMouseEnter(event, sliderRef);
                }}
                onMouseLeave={(event: any) => {
                    this.handleMouseLeave(event, sliderRef, "none");
                }}
            >
                {/* slider bar */}
                <div
                    style={{
                        width: "100%",
                        height: blockSize / 3,
                        backgroundColor: this._getElementAreaRawFillStyle(),
                        borderRadius: blockSize / 2,
                    }}
                ></div>
                {/* slider bar -- value highlight region */}
                <div
                    style={{
                        position: "absolute",
                        top: blockSize / 3,
                        left: 0,
                        width: this.calcSliderBlockPosition(blockSize) + blockSize / 2,
                        height: blockSize / 3,
                        backgroundColor: this._getElementAreaRawFillStyle(),
                        borderRadius: blockSize / 2,
                        border: "solid 0px black",
                    }}
                ></div>
                {/* slider block */}
                <div
                    ref={blockRef}
                    onMouseDown={(event: any) => {
                        this.handleMouseDownOnBlock(event, blockRef, blockHighlightColor, blockSize, blockColor);
                    }}
                    style={{
                        position: "absolute",
                        left: this.calcSliderBlockPosition(blockSize),
                        top: 0,
                        width: blockSize,
                        height: blockSize,
                        backgroundColor: "white",
                        borderRadius: blockSize / 2,
                        border: "solid 0px rgba(0,0,0,1)",
                        boxShadow: "0px 0px 5px 1px black",
                    }}
                ></div>
            </div>
        );
    };

    _ElementSliderTraditional = () => {
        const shadowWidth = 2;
        const blockWidth = 20;
        const width = this.getAllStyle()["width"] - 2 * shadowWidth;

        const sliderRef = React.useRef<any>(null);
        const blockRef = React.useRef<any>(null);
        let blockColor = "rgba(200, 200, 200, 1)";
        let blockHighlightColor = "rgba(215, 215, 215, 1)";

        const threeDStyleBar = this.atRegularAngle() ? this.get3dButtonStyle(true) as any : this.get3dButtonStyle(false) as any;
        delete threeDStyleBar.width;
        delete threeDStyleBar.height;

        const threeDStyleBlock = this.atRegularAngle() ? this.get3dButtonStyle(false) as any : this.get3dButtonStyle(true) as any;
        delete threeDStyleBlock.width;
        delete threeDStyleBlock.height;

        const outline = "solid 1px rgba(100, 100, 250, 0.5)";

        return (
            <div
                ref={sliderRef}
                // for key down
                tabIndex={0}
                style={{
                    display: "inline-flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    ...threeDStyleBar,
                    width: width,
                    outline: outline,
                    position: "relative",
                    overflow: "visible",
                    flexGrow: 1,
                    flexShrink: 1,
                    flexBasis: 0,
                    boxSizing: "border-box",
                }}
                onKeyDown={(event: any) => {
                    this.handleKeyDown(event);
                }}
                onMouseDown={(event: any) => {
                    this.handleMouseDown(event, blockRef);
                }}
                onMouseUp={(event: any) => {
                    this.handleMouseUp(event);
                }}
                // focus the element so that we can use keyboard event
                onMouseEnter={(event: any) => {
                    this.handleMouseEnter(event, sliderRef);
                }}
                onMouseLeave={(event: any) => {
                    this.handleMouseLeave(event, sliderRef, outline);
                }}
            >
                {/* slider bar */}
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        backgroundColor: this._getElementAreaRawFillStyle(),
                    }}
                ></div>
                {/* slider block */}
                <div
                    ref={blockRef}
                    onMouseDown={(event: any) => {
                        this.handleMouseDownOnBlock(event, blockRef, blockHighlightColor, blockWidth, blockColor);
                    }}
                    style={{
                        position: "absolute",
                        left: this.calcSliderBlockPosition(blockWidth),
                        top: 0,
                        width: blockWidth - 2 * shadowWidth,
                        height: "100%",
                        boxSizing: 'border-box',
                        backgroundColor: blockColor,
                        ...threeDStyleBlock,
                    }}
                ></div>
            </div>
        );
    };


    // -------------------- helper functions ----------------

    /**
     * when you click 
     */
    calcMotionDirection = (clientX: number, clientY: number, blockRef: any): "positive" | "negative" | "nomove" => {
        if (blockRef.current === null) {
            return "positive";
        }
        const rect = blockRef.current.getBoundingClientRect();
        const blockCenterX = rect.left + rect.width / 2;
        const blockCenterY = rect.top + rect.height / 2;
        const dx = clientX - blockCenterX;
        const dy = clientY - blockCenterY;
        const blockWidth = rect.width;

        let theta = (parseIntAngle(this.getAllStyle()["transform"]) * 3.14159) / 180;

        const x1 = dx * Math.cos(theta) + dy * Math.sin(theta);
        const y1 = -1 * dx * Math.sin(theta) + dy * Math.cos(theta);

        if (x1 > blockWidth / 2) {
            return "positive";
        } else if (x1 < (-1 * blockWidth) / 2) {
            return "negative";
        } else {
            return "nomove";
        }
    };

    handleKeyDown = (event: any) => {
        // only when this div is focused
        if (this._getChannelAccessRight() < Channel_ACCESS_RIGHTS.READ_WRITE) {
            return;
        }
        if (event.key === "ArrowRight") {
            this.changeChannelValue("positive");
        } else if (event.key === "ArrowLeft") {
            this.changeChannelValue("negative");
        }
    }

    handleMouseDown = (event: any, blockRef: any) => {
        event.preventDefault();

        if (event.button !== 0) {
            return;
        }
        if (this._getChannelAccessRight() < 1.5) {
            return;
        }

        const direction = this.calcMotionDirection(getMouseEventClientX(event), getMouseEventClientY(event), blockRef);
        this.changeChannelValue(direction);
        this.mouseDownIntervalTimer = setTimeout(() => {
            const direction = this.calcMotionDirection(getMouseEventClientX(event), getMouseEventClientY(event), blockRef);
            this.changeChannelValue(direction);
            clearInterval(this.mouseDownIntervalTimer);
            clearTimeout(this.mouseDownIntervalTimer);
            this.mouseDownIntervalTimer = setInterval(() => {
                const direction = this.calcMotionDirection(getMouseEventClientX(event), getMouseEventClientY(event), blockRef);
                this.changeChannelValue(direction);
            }, this.mouseDownDelay / 4);
        }, this.mouseDownDelay);
    }

    handleMouseUp = (event: any) => {
        clearInterval(this.mouseDownIntervalTimer);
        clearTimeout(this.mouseDownIntervalTimer);
        this.mouseDownIntervalTimer = undefined;
    }

    // focus the element so that we can use keyboard event
    handleMouseEnter = (event: any, sliderRef: any) => {
        event.preventDefault();
        if (g_widgets1.isEditing()) {
            return;
        }
        // focus the element for key events
        (sliderRef.current as any).focus();
        // outline: thick light grey
        this.hanldeMouseEnterWriteWidget(event, sliderRef)

    }

    handleMouseLeave = (event: any, sliderRef: any, outline: string) => {
        // unfocus the element so that keys do not apply
        (sliderRef.current as any).blur();
        // key stroke intervals
        clearInterval(this.mouseDownIntervalTimer);
        clearTimeout(this.mouseDownIntervalTimer);
        this.mouseDownIntervalTimer = undefined;
        // outline: thick light grey disappear
        this.handleMouseLeaveWriteWidget(event, sliderRef);
        // keep the thin outline for 3D effect
        if (sliderRef.current !== null) {
            sliderRef.current.style["outline"] = outline;
        }
    }

    handleMouseDownOnBlock = (event: any, blockRef: any, blockHighlightColor: string, blockWidth: number, blockColor: string) => {
        // do not propagate up

        if (event.button !== 0) {
            return;
        }

        event.stopPropagation();

        const clientX0 = getMouseEventClientX(event);
        const clientY0 = getMouseEventClientY(event);
        const channelValue0 = this._getChannelValue(true);
        if (typeof channelValue0 !== "number") {
            return;
        }
        // block color
        if (blockRef.current !== null) {
            blockRef.current.style["backgroundColor"] = blockHighlightColor;
        }

        this._tmp_handleMouseMove = (event: any) => {
            this.handleMouseMoveOnSlider(event, clientX0, clientY0, channelValue0, blockWidth);
        };
        this._tmp_handleMouseUp = (event: any) => {
            this.handleMouseUpOnSlider(event, blockRef, blockColor);
        };

        window.addEventListener("mousemove", this._tmp_handleMouseMove);
        window.addEventListener("mouseup", this._tmp_handleMouseUp);
    }

    changeChannelValue = (direction: "positive" | "negative" | "nomove") => {
        const channelName = this.getChannelNames()[0];
        try {
            const channel = g_widgets1.getTcaChannel(channelName);
            // const channelValue = channel.getValue();
            const channelValue = g_widgets1.getChannelValue(channelName); // do not use raw = true option, enum choice should not be expanded
            if (typeof channelValue === "number") {
                let newChannelValue = channelValue;
                if (direction === "negative") {
                    newChannelValue = channelValue - this.getAllText()["stepSize"];
                } else if (direction === "positive") {
                    newChannelValue = channelValue + this.getAllText()["stepSize"];
                } else {
                    // no move
                    return;
                }
                const displayWindowId = g_widgets1.getRoot().getDisplayWindowClient().getWindowId();
                const dbrData = {
                    value: newChannelValue,
                };
                channel.put(displayWindowId, dbrData, 1);
            }
        } catch (e) {
            Log.error(e);
        }
    };

    
    handleMouseUpOnSlider = (event: any, blockRef: any, blockColor: string) => {
        if (blockRef.current !== null) {
            blockRef.current.style["backgroundColor"] = blockColor;
        }
        window.removeEventListener("mousemove", this._tmp_handleMouseMove);
        window.removeEventListener("mouseup", this._tmp_handleMouseUp);
    };

    handleMouseMoveOnSlider = (event: any, clientX0: number, clientY0: number, channelValue0: number, blockSize: number) => {

        const clinetX = getMouseEventClientX(event);
        const clinetY = getMouseEventClientY(event);
        const dX0 = clinetX - clientX0;
        const dY0 = clinetY - clientY0;

        let theta = (parseIntAngle(this.getAllStyle()["transform"]) * 3.14159) / 180;

        const dX = dX0 * Math.cos(theta) + dY0 * Math.sin(theta);
        const dY = -1 * dX0 * Math.sin(theta) + dY0 * Math.cos(theta);

        try {
            const channelName = this.getChannelNames()[0];
            const channel = g_widgets1.getTcaChannel(channelName);
            const displayWindowId = g_widgets1.getRoot().getDisplayWindowClient().getWindowId();
            let dChannelValue = 0;
            const [minChannelValue, maxChannelValue] = this.calcPvLimits();
            dChannelValue = (dX * (maxChannelValue - minChannelValue)) / (this.getAllStyle()["width"] - blockSize);
            const newChannelValue = Math.min(Math.max(channelValue0 + dChannelValue, minChannelValue), maxChannelValue);
            const dbrData = {
                value: newChannelValue,
            };
            channel.put(displayWindowId, dbrData, 1);
        } catch (e) {
            Log.error(e);
        }
    };

    /**
     * Calculate slider block position in unit of pixel, used in left:
     */
    calcSliderBlockPosition = (sliderBlockSize: number): number => {
        if (g_widgets1.isEditing()) {
            return this.getAllStyle()["width"] * 0.33;
        }
        let result: number = 0;
        const fullSize = this.getAllStyle()["width"] - sliderBlockSize;

        const channelValue = this._getChannelValue(true);

        if (typeof channelValue === "number") {
            const [minPvValue, maxPvValue] = this.calcPvLimits();
            result = ((channelValue - minPvValue) / (maxPvValue - minPvValue)) * fullSize;
        }
        result = Math.min(Math.max(result, 0), fullSize);

        return result;
    };

    atRegularAngle = () => {
        const angle = parseIntAngle(this.getAllStyle()["transform"]);
        if (angle >= 135 && angle < 135 + 180) {
            return false;
        } else {
            return true;
        }
    }

    calcScaleParam = () => {
        const allText = this.getAllText();
        const allStyle = this.getAllStyle();
        const position = "top";
        const [min, max] = this.calcPvLimits();
        const numTickIntervals = allText["numTickIntervals"];
        const showLabels = allText["showLabels"];
        const length = allStyle["width"];
        const scale = "Linear" as "Linear" | "Log10";
        const color = this._getElementAreaRawTextStyle();
        const compact = allText["compactScale"];

        return {
            min: min,
            max: max,
            numIntervals: numTickIntervals,
            position: position as "left" | "top" | "bottom" | "right",
            showLabels: showLabels,
            length: length,
            scale: scale,
            color: color,
            compact: compact,
        }

    }

    openSettings = () => {
        this.showSettings = true;
        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");
        g_flushWidgets();
    };

    closeSettings = () => {
        this.showSettings = false;
        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");
        g_flushWidgets();
    };

    // -------------------------- tdl -------------------------------

    static generateDefaultTdl = () => {

        const defaultTdl: type_ScaledSlider_tdl = {
            type: "ScaledSlider",
            widgetKey: "", // "key" is a reserved keyword
            key: "",
            // the style for outmost div
            // these properties are explicitly defined in style because they are
            // (1) different from default CSS settings, or
            // (2) they may be modified
            style: {
                position: "absolute",
                display: "inline-flex",
                backgroundColor: "rgba(255, 255, 255, 1)",
                left: 100,
                top: 100,
                width: 150,
                height: 80,
                outlineStyle: "none",
                outlineWidth: 1,
                outlineColor: "black",
                transform: "rotate(0deg)",
                color: "rgba(0,0,0,1)",
                borderStyle: "solid",
                borderWidth: 0,
                borderColor: "rgba(255, 0, 0, 1)",
                fontFamily: GlobalVariables.defaultFontFamily,
                fontSize: GlobalVariables.defaultFontSize,
                fontStyle: GlobalVariables.defaultFontStyle,
                fontWeight: GlobalVariables.defaultFontWeight,
            },
            // the ElementBody style
            text: {
                showUnit: true,
                minPvValue: 0,
                maxPvValue: 100,
                usePvLimits: false,
                numTickIntervals: 5,
                // layout
                showPvValue: true,
                showLabels: true,
                // ------------------------------
                stepSize: 1,
                invisibleInOperation: false,
                // decimal, exponential, hexadecimal
                format: "default",
                // scale, >= 0
                scale: 0,
                compactScale: false,
                // "contemporary" | "traditional"
                appearance: "traditional",
                // slide bar background color
                fillColor: "rgba(180, 180, 180, 1)",
                // slide bar highlight area color
                // sliderBarBackgroundColor1: "rgba(180, 180, 180, 1)",
                alarmBorder: true,
                alarmText: false,
                alarmFill: false,
                alarmBackground: false,
                alarmLevel: "MINOR",
            },
            channelNames: [],
            groupNames: [],
            rules: [],
        };
        defaultTdl["widgetKey"] = GlobalMethods.generateWidgetKey(defaultTdl["type"]);
        return JSON.parse(JSON.stringify(defaultTdl));
    };

    generateDefaultTdl: () => any = ScaledSlider.generateDefaultTdl;

    // -------------------------- sidebar ---------------------------
    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new ScaledSliderSidebar(this);
        }
    };
}
