import * as React from "react";
import { getMouseEventClientX, getMouseEventClientY, GlobalVariables } from "../../../common/GlobalVariables";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { ScaledSliderSidebar } from "./ScaledSliderSidebar";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { ScaledSliderRules } from "./ScaledSliderRules";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { rgbaStrToRgbaArray, parseIntAngle, rgbaArrayToRgbaStr } from "../../../common/GlobalMethods";
import { Log } from "../../../common/Log";
import { calcTicks, refineTicks } from "../../../common/GlobalMethods";
import { ElementRectangleButton } from "../../helperWidgets/SharedElements/RectangleButton";

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
                <>
                    <this._ElementBody></this._ElementBody>
                    {this.showSidebar() ? this.getSidebar()?.getElement() : null}
                </>
            </ErrorBoundary>
        );
    };

    _ElementBodyRaw = (): React.JSX.Element => {
        return (
            // always update the div below no matter the TextUpdateBody is .memo or not
            // TextUpdateResizer does not update if it is .memo
            <div style={this.getElementBodyRawStyle()}>
                {/* <this._ElementArea></this._ElementArea> */}
                <this._ElementAreaRaw></this._ElementAreaRaw>
                {this.showResizers() ? <this._ElementResizer /> : null}
            </div>
        );
    };

    // only shows the text, all other style properties are held by upper level _ElementBodyRaw
    _ElementAreaRaw = ({ }: any): React.JSX.Element => {
        return (
            // <div
            <div
                style={{
                    display: "inline-flex",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    userSelect: "none",
                    overflow: "visible",
                    whiteSpace: this.getAllText().wrapWord ? "normal" : "pre",
                    justifyContent: this.getAllText().horizontalAlign,
                    alignItems: this.getAllText().verticalAlign,
                    fontFamily: this.getAllText().fontFamily,
                    fontSize: this.getAllText().fontSize,
                    fontStyle: this.getAllText().fontStyle,
                    outline: this._getElementAreaRawOutlineStyle(),
                    position: "relative",
                    backgroundColor: this.getAllText()["invisibleInOperation"] ? "rgba(0,0,0,0)" : this._getElementAreaRawBackgroundStyle(),
                }}
                // title={"tooltip"}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                <this._ElementScaledSlider></this._ElementScaledSlider>
                {this.showSettings === true ? <this._ElementSettings></this._ElementSettings> : null}
            </div>
        );
    };

    _ElementScaledSlider = () => {
        if (this.getAllText()["appearance"] === "contemporary") {
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
                    opacity: this.getAllText()["invisibleInOperation"] === true && !g_widgets1.isEditing() ? 0 : 1,
                    color: this._getElementAreaRawTextStyle(),
                }}
            >
                {this.getAllText()["showPvValue"] === true ? <this._ElementValue></this._ElementValue> : null}
                {this.getAllText()["showLabels"] === true ? <this._ElementScaleTraditional></this._ElementScaleTraditional> : null}
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

    _ElementSettings = () => {
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

    handleMouseUp = () => {
        clearInterval(this.mouseDownIntervalTimer);
        this.mouseDownIntervalTimer = undefined;
    };

    handleMouseUpOnSlider = (event: any, blockRef: any, blockColor: string) => {
        if (blockRef.current !== null) {
            blockRef.current.style["backgroundColor"] = blockColor;
        }
        window.removeEventListener("mousemove", this._tmp_handleMouseMove);
        window.removeEventListener("mouseup", this._tmp_handleMouseUp);
    };

    handleMouseMoveOnSlider = (event: any, clientX0: number, clientY0: number, channelValue0: number, blockSize: number) => {
        // const clinetX = event.clientX;
        // const clinetY = event.clientY;
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

    calcPvLimits = (): [number, number] => {
        let minPvValue = this.getAllText()["minPvValue"];
        let maxPvValue = this.getAllText()["maxPvValue"];
        const channelName = this.getChannelNames()[0];
        try {
            const channel = g_widgets1.getTcaChannel(channelName);
            if (this.getAllText()["usePvLimits"]) {
                const upper_display_limit = channel.getUpperDisplayLimit();
                if (upper_display_limit !== undefined && typeof upper_display_limit === "number") {
                    maxPvValue = upper_display_limit;
                }
                const lower_display_limit = channel.getLowerDisplayLimit();
                if (lower_display_limit !== undefined && typeof lower_display_limit === "number") {
                    minPvValue = lower_display_limit;
                }
            }
        } catch (e) {
            Log.error(e);
        }
        return [minPvValue, maxPvValue];
    };

    /**
     * Calculate slider block position in unit of pixel
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

    /**
     * Channel value and step size, click to change step size
     */
    _ElementValue = () => {
        // height
        const valueRegionSize = this.getAllStyle()["fontSize"] + 4;
        return (
            <div
                style={{
                    // fixed size
                    width: "100%",
                    height: valueRegionSize,
                    position: "relative",
                    display: "inline-flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    flexShrink: "0",
                }}
            >
                {/* channel value */}
                <div
                    style={{
                        display: "inline-flex",
                        position: "relative",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                    }}
                >
                    <div
                        style={{
                            // color: this.getAllStyle()["color"],
                            color: this._getElementAreaRawTextStyle(),
                        }}
                    >{`step=${this.getAllText()["stepSize"]}`}</div>
                    <div
                        style={{
                            // color: this.getAllStyle()["color"],
                            color: this._getElementAreaRawTextStyle(),
                        }}
                    >{`${this._getChannelValueForReadback()} ${this.getAllText().showUnit ? this._getChannelUnit() : ""}`}</div>
                </div>
            </div>
        );
    };

    _ElementSliderContemporary = () => {
        const sliderRef = React.useRef<any>(null);
        const blockRef = React.useRef<any>(null);
        const blockSize = 14;
        let blockColor = "rgba(255, 255, 255 ,1)";
        let blockHighlightColor = "rgba(0, 100, 255, 1)";
        blockHighlightColor = "rgba(255, 255, 255, 1)";
        // const backgroundRgbaArray = rgbaStrToRgbaArray(this.getAllStyle()["backgroundColor"]);
        // if (backgroundRgbaArray[0] + backgroundRgbaArray[1] + backgroundRgbaArray[2] > 384) {
        // blockColor = "rgba(100, 100, 100, 1)";
        // }
        // if (backgroundRgbaArray[0] < 100 && backgroundRgbaArray[1] > 50 && backgroundRgbaArray[1] < 150 && backgroundRgbaArray[2] > 200) {
        // blockHighlightColor = "rgba(255, 100, 0, 1)";
        // }

        const calcDirection = (clientX: number, clientY: number): "positive" | "negative" | "nomove" => {
            if (blockRef.current === null) {
                return "positive";
            }
            const rect = blockRef.current.getBoundingClientRect();
            const blockCenterX = rect.left + rect.width / 2;
            const blockCenterY = rect.top + rect.height / 2;
            const dx = clientX - blockCenterX;
            const dy = clientY - blockCenterY;

            let theta = (parseIntAngle(this.getAllStyle()["transform"]) * 3.14159) / 180;

            const x1 = dx * Math.cos(theta) + dy * Math.sin(theta);
            const y1 = -1 * dx * Math.sin(theta) + dy * Math.cos(theta);

            if (x1 > blockSize / 2) {
                return "positive";
            } else if (x1 < (-1 * blockSize) / 2) {
                return "negative";
            } else {
                return "nomove";
            }
        };

        return (
            <div
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
                onFocus={(event: any) => {
                    event.preventDefault();
                    if (!g_widgets1.isEditing()) {
                        if (sliderRef.current !== null) {
                            sliderRef.current.style["outlineStyle"] = "solid";
                            sliderRef.current.style["outlineWidth"] = "3px";
                            sliderRef.current.style["outlineColor"] = "rgba(105,105,105,1)";
                            sliderRef.current.style["cursor"] = "pointer";
                        }
                    }
                    // event.target.style["outline"] = "solid 1px red";
                }}
                onBlur={(event: any) => {
                    event.preventDefault();
                    if (!g_widgets1.isEditing()) {
                        if (sliderRef.current !== null) {
                            sliderRef.current.style["outlineStyle"] = this.getAllStyle()["outlineStyle"];
                            sliderRef.current.style["outlineWidth"] = this.getAllStyle()["outlineWidth"];
                            sliderRef.current.style["outlineColor"] = this.getAllStyle()["outlineColor"];
                            sliderRef.current.style["cursor"] = "default";
                        }
                    }
                }}
                tabIndex={0}
                onKeyDown={(event: any) => {
                    // only when this div is focused
                    if (this._getChannelAccessRight() < 1.5) {
                        return;
                    }
                    if (event.key === "ArrowRight") {
                        this.changeChannelValue("positive");
                    } else if (event.key === "ArrowLeft") {
                        this.changeChannelValue("negative");
                    }
                }}
                onMouseDown={(event: any) => {
                    event.preventDefault();

                    if (event.button !== 0) {
                        return;
                    }
                    if (this._getChannelAccessRight() < 1.5) {
                        return;
                    }

                    const direction = calcDirection(getMouseEventClientX(event), getMouseEventClientY(event));
                    this.changeChannelValue(direction);
                    this.mouseDownIntervalTimer = setTimeout(() => {
                        const direction = calcDirection(getMouseEventClientX(event), getMouseEventClientY(event));
                        this.changeChannelValue(direction);
                        clearInterval(this.mouseDownIntervalTimer);
                        clearTimeout(this.mouseDownIntervalTimer);
                        this.mouseDownIntervalTimer = setInterval(() => {
                            const direction = calcDirection(getMouseEventClientX(event), getMouseEventClientY(event));
                            this.changeChannelValue(direction);
                        }, this.mouseDownDelay / 4);
                    }, this.mouseDownDelay);
                }}
                onMouseUp={(event: any) => {
                    clearInterval(this.mouseDownIntervalTimer);
                    clearTimeout(this.mouseDownIntervalTimer);
                    this.mouseDownIntervalTimer = undefined;
                }}
                // focus the element so that we can use keyboard event
                onMouseEnter={(event: any) => {
                    if (!g_widgets1.isEditing()) {
                        event.preventDefault();
                        (sliderRef.current as any).focus();
                        if (this._getChannelAccessRight() < 1.5) {
                            event.target.style["cursor"] = "not-allowed";
                        }
                    }
                }}
                onMouseLeave={(event: any) => {
                    // unfocus the element
                    (sliderRef.current as any).blur();
                    clearInterval(this.mouseDownIntervalTimer);
                    clearTimeout(this.mouseDownIntervalTimer);
                    this.mouseDownIntervalTimer = undefined;
                }}
                ref={sliderRef}
            >
                {/* slider bar */}
                <div
                    style={{
                        width: "100%",
                        height: blockSize / 3,
                        // backgroundColor: "rgba(180,180,180,1)",
                        // backgroundColor: this.getAllText()["fillColor"],
                        backgroundColor: this._getElementAreaRawFillStyle(),
                        borderRadius: blockSize / 2,
                        border: "solid 0px black",
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
                        // backgroundColor: "rgba(0, 200, 255, 1)",
                        // backgroundColor: this.getAllText()["fillColor"],
                        backgroundColor: this._getElementAreaRawFillStyle(),
                        borderRadius: blockSize / 2,
                        border: "solid 0px black",
                    }}
                ></div>
                {/* slider block */}
                <div
                    ref={blockRef}
                    onMouseDown={(event: any) => {
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
                            this.handleMouseMoveOnSlider(event, clientX0, clientY0, channelValue0, blockSize);
                        };
                        this._tmp_handleMouseUp = (event: any) => {
                            this.handleMouseUpOnSlider(event, blockRef, blockColor);
                        };

                        window.addEventListener("mousemove", this._tmp_handleMouseMove);
                        window.addEventListener("mouseup", this._tmp_handleMouseUp);
                    }}
                    style={{
                        position: "absolute",
                        left: this.calcSliderBlockPosition(blockSize),
                        top: 0,
                        width: blockSize,
                        height: blockSize,
                        // backgroundColor: blockColor,
                        backgroundColor: "white",
                        borderRadius: blockSize / 2,
                        border: "solid 0px rgba(0,0,0,1)",
                        boxShadow: "0px 0px 5px 1px black",
                    }}
                ></div>
            </div>
        );
    };


    atRegularAngle = () => {
        const angle = parseIntAngle(this.getAllStyle()["transform"]);
        if (angle >= 135 && angle < 135 + 180) {
            return false;
        } else {
            return true;
        }
    }

    _ElementSliderTraditional = () => {
        const shadowWidth = 2;
        // calculate vertical size, fill in the region
        // value
        // this.getAllText()["showPvValue"] === true ? this.getAllStyle()["fontSize"] + 4 : 0
        // label and ticks
        // this.getAllText()["showLabels"] === true ? scaleTickSize + fontSize : 0

        const fontSize = this.getAllStyle()["fontSize"];
        const scaleTickSize = 10 * 0; // fixed number
        const widgetHeight = this.getAllStyle()["height"];
        // value region height
        const heightValue = this.getAllText()["showPvValue"] === true ? this.getAllStyle()["fontSize"] + 4 : 0;
        // label and tick region height
        const heightLabel = this.getAllText()["showLabels"] === true ? scaleTickSize + fontSize + 4 : 0;
        // block height
        const blockSize = widgetHeight - heightValue - heightLabel - 2 * shadowWidth;
        // block width
        const blockWidth = 20;

        const sliderRef = React.useRef<any>(null);
        const blockRef = React.useRef<any>(null);
        let blockColor = "rgba(200, 200, 200, 1)";
        let blockHighlightColor = "rgba(0, 100, 255, 1)";
        blockHighlightColor = "rgba(215, 215, 215, 1)";

        const calcDirection = (clientX: number, clientY: number): "positive" | "negative" | "nomove" => {
            if (blockRef.current === null) {
                return "positive";
            }
            const rect = blockRef.current.getBoundingClientRect();
            const blockCenterX = rect.left + rect.width / 2;
            const blockCenterY = rect.top + rect.height / 2;
            const dx = clientX - blockCenterX;
            const dy = clientY - blockCenterY;

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

        return (
            <div
                style={{
                    display: "inline-flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    width: this.getAllStyle()["width"] - 2 * shadowWidth,
                    height: blockSize,
                    outline: "solid 1px rgba(100, 100, 250, 0.5)",
                    borderRight: this.atRegularAngle() ? `solid ${shadowWidth}px rgba(255,255,255,1)` : `solid ${shadowWidth}px rgba(100,100,100,1)`,
                    borderBottom: this.atRegularAngle() ? `solid ${shadowWidth}px rgba(255,255,255,1)` : `solid ${shadowWidth}px rgba(100,100,100,1)`,
                    borderLeft: this.atRegularAngle() ? `solid ${shadowWidth}px rgba(100,100,100,1)` : `solid ${shadowWidth}px rgba(255,255,255,1)`,
                    borderTop: this.atRegularAngle() ? `solid ${shadowWidth}px rgba(100,100,100,1)` : `solid ${shadowWidth}px rgba(255,255,255,1)`,
                    position: "relative",
                    overflow: "visible",
                    flexShrink: "0",
                }}
                onFocus={(event: any) => {
                    event.preventDefault();
                    if (!g_widgets1.isEditing()) {
                        if (sliderRef.current !== null) {
                            sliderRef.current.style["outlineStyle"] = "solid";
                            sliderRef.current.style["outlineWidth"] = "3px";
                            sliderRef.current.style["outlineColor"] = "rgba(105,105,105,1)";
                            sliderRef.current.style["cursor"] = "pointer";
                        }
                    }
                    // event.target.style["outline"] = "solid 1px red";
                }}
                onBlur={(event: any) => {
                    event.preventDefault();
                    if (!g_widgets1.isEditing()) {
                        if (sliderRef.current !== null) {
                            sliderRef.current.style["outline"] = "solid 1px rgba(150,150,150,1)";
                            sliderRef.current.style["cursor"] = "default";
                        }
                    }
                }}
                tabIndex={0}
                onKeyDown={(event: any) => {
                    // only when this div is focused
                    if (this._getChannelAccessRight() < 1.5) {
                        return;
                    }
                    if (event.key === "ArrowRight") {
                        this.changeChannelValue("positive");
                    } else if (event.key === "ArrowLeft") {
                        this.changeChannelValue("negative");
                    }
                }}
                onMouseDown={(event: any) => {
                    event.preventDefault();

                    if (event.button !== 0) {
                        return;
                    }
                    if (this._getChannelAccessRight() < 1.5) {
                        return;
                    }

                    const direction = calcDirection(getMouseEventClientX(event), getMouseEventClientY(event));
                    this.changeChannelValue(direction);
                    this.mouseDownIntervalTimer = setTimeout(() => {
                        const direction = calcDirection(getMouseEventClientX(event), getMouseEventClientY(event));
                        this.changeChannelValue(direction);
                        clearInterval(this.mouseDownIntervalTimer);
                        clearTimeout(this.mouseDownIntervalTimer);
                        this.mouseDownIntervalTimer = setInterval(() => {
                            const direction = calcDirection(getMouseEventClientX(event), getMouseEventClientY(event));
                            this.changeChannelValue(direction);
                        }, this.mouseDownDelay / 4);
                    }, this.mouseDownDelay);
                }}
                onMouseUp={(event: any) => {
                    clearInterval(this.mouseDownIntervalTimer);
                    clearTimeout(this.mouseDownIntervalTimer);
                    this.mouseDownIntervalTimer = undefined;
                }}
                // focus the element so that we can use keyboard event
                onMouseEnter={(event: any) => {
                    if (!g_widgets1.isEditing()) {
                        event.preventDefault();
                        (sliderRef.current as any).focus();
                        if (this._getChannelAccessRight() < 1.5) {
                            event.target.style["cursor"] = "not-allowed";
                        }
                    }
                }}
                onMouseLeave={(event: any) => {
                    // unfocus the element
                    (sliderRef.current as any).blur();
                    clearInterval(this.mouseDownIntervalTimer);
                    clearTimeout(this.mouseDownIntervalTimer);
                    this.mouseDownIntervalTimer = undefined;
                }}
                ref={sliderRef}
            >
                {/* slider bar */}
                <div
                    style={{
                        width: "100%",
                        height: blockSize,
                        // backgroundColor: "rgba(180,180,180,1)",
                        // backgroundColor: this.getAllText()["fillColor"],
                        backgroundColor: this._getElementAreaRawFillStyle(),
                        // borderRadius: 2,
                        border: "solid 0px black",
                    }}
                ></div>
                {/* slider bar -- value highlight region */}
                {/* <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: this.calcSliderBlockPosition(blockWidth) + blockWidth / 2,
                        height: blockSize,
                        backgroundColor: this.getAllText()["sliderBarBackgroundColor1"],
                        border: "solid 0px black",
                    }}
                ></div> */}
                {/* slider block */}
                <div
                    ref={blockRef}
                    onMouseDown={(event: any) => {
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
                    }}
                    style={{
                        position: "absolute",
                        left: this.calcSliderBlockPosition(blockWidth),
                        top: 0,
                        width: blockWidth - 2 * shadowWidth,
                        height: blockSize - 2 * shadowWidth,
                        backgroundColor: blockColor,
                        // borderRadius: 2,
                        // border: "solid 0px rgba(0,0,0,1)",
                        // boxShadow: "0px 0px 5px 1px black",
                        borderLeft: this.atRegularAngle() ? `solid ${shadowWidth}px rgba(255,255,255,1)` : `solid ${shadowWidth}px rgba(100,100,100,1)`,
                        borderTop: this.atRegularAngle() ? `solid ${shadowWidth}px rgba(255,255,255,1)` : `solid ${shadowWidth}px rgba(100,100,100,1)`,
                        borderRight: this.atRegularAngle() ? `solid ${shadowWidth}px rgba(100,100,100,1)` : `solid ${shadowWidth}px rgba(255,255,255,1)`,
                        borderBottom: this.atRegularAngle() ? `solid ${shadowWidth}px rgba(100,100,100,1)` : `solid ${shadowWidth}px rgba(255,255,255,1)`,
                    }}
                ></div>
            </div>
        );
    };

    /**
     * Line, ticks, and values
     */
    _ElementScaleContemporary = () => {
        // including: 2px blank on top, horizontal line width, and ticks
        const scaleTickSize = 10;
        const fullSize = this.getAllStyle()["width"];
        const elementRef = React.useRef<any>(null);

        const pvLimits = this.calcPvLimits();

        const calcTickValues = () => {
            const [valueMin, valueMax] = pvLimits;
            return calcTicks(valueMin, valueMax, this.getAllText()["numTickIntervals"] + 1, "linear");
        };
        const tickValues = calcTickValues();

        /**
         * Calculate tick position in unit of pixel
         */
        const calcTickPositions = (): number[] => {
            const result: number[] = [];
            const [valueMin, valueMax] = pvLimits;
            const k = fullSize / (valueMax - valueMin);
            for (let tickValue of tickValues) {
                result.push(k * (tickValue - valueMin));
            }
            return result;
        }

        const tickPositions = calcTickPositions();
        const refinedTicks = refineTicks(tickValues, this.getAllStyle()["fontSize"] * 0.5, elementRef, "horizontal");
        return (
            <div
                ref={elementRef}
                style={{
                    width: "100%",
                    height: this.getAllStyle()["fontSize"] + scaleTickSize + 4,
                    position: "relative",
                    display: "inline-flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexShrink: "0",
                }}
            >
                {/* ticks and line */}
                <svg
                    width="100%"
                    height="100%"
                    x="0"
                    y="0"
                    style={{
                        position: "absolute",
                        overflow: "visible",
                    }}
                >
                    {/* line, 2px gap above */}
                    <path
                        d={`M 0 2 L ${fullSize} 2`}
                        strokeWidth="2"
                        //  stroke={this.getAllStyle()["color"]} 
                        stroke={this._getElementAreaRawTextStyle()}
                        fill="none"
                    >
                    </path>

                    {/* ticks */}
                    {tickPositions.map((position: number, index: number) => {
                        if (this.getAllText()["compactScale"]) {
                            if (!(index === 0 || index === tickPositions.length - 1)) {
                                return null;
                            }
                        }

                        return (
                            <>
                                <path
                                    d={`M ${position} 2 L ${position} ${scaleTickSize}`}
                                    strokeWidth="2"
                                    // stroke={this.getAllStyle()["color"]}
                                    stroke={this._getElementAreaRawTextStyle()}
                                    fill="none"
                                ></path>
                            </>
                        );
                    })}
                </svg>
                {/* labels */}
                {
                    tickPositions.map((value: number, index: number) => {
                        if (this.getAllText()["compactScale"]) {
                            if (!(index === 0 || index === tickPositions.length - 1)) {
                                return null;
                            }
                        }

                        return (
                            <div
                                style={{
                                    position: "absolute",
                                    left: value,
                                    // top: scaleTickSize,
                                    top: 5 + this.getAllStyle()["fontSize"],
                                    width: 0,
                                    height: 0,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: index === 0 ? "flex-start" : index === tickPositions.length - 1 ? "flex-end" : "center",
                                    // color: this.getAllStyle()["color"],
                                    color: this._getElementAreaRawTextStyle(),
                                }}
                            >
                                {/* {calcTickValues()[index]} */}
                                {refinedTicks[index]}
                            </div>
                        );
                    })
                }
                {
                    (() => {
                        if (this.getAllText()["compactScale"]) {
                            return (
                                <div
                                    style={{
                                        position: "absolute",
                                        left: this.getAllStyle()["width"] / 2,
                                        top: scaleTickSize,
                                        width: 0,
                                        height: 0,
                                        display: "inline-flex",
                                        alignItems: "flex-start",
                                        justifyContent: "center",
                                        color: this.getAllStyle()["color"],
                                    }}
                                >
                                    {`${this._getChannelValueForReadback()}`}
                                </div>
                            );
                        } else {
                            return null;
                        }
                    })()
                }
            </div >
        );
    };


    /**
     * Line, ticks, and values
     */
    _ElementScaleTraditional = () => {

        const pvLimits = this.calcPvLimits();
        // the number of ticks may be different from the (this.getAllText()["numTickIntervals"] + 1)
        const calcTickValues = () => {
            const [valueMin, valueMax] = pvLimits;
            return calcTicks(valueMin, valueMax, this.getAllText()["numTickIntervals"] + 1, "linear");
        };
        const tickValues = calcTickValues();

        // including: 2px blank on top, horizontal line width, and ticks
        // line height
        const scaleTickSize = 10;
        const fullSize = this.getAllStyle()["width"];
        const elementRef = React.useRef<any>(null);
        const fontSize = this.getAllStyle()["fontSize"];

        /**
         * Calculate tick position in unit of pixel
         */
        const calcTickPositions = (): number[] => {
            const result: number[] = [];
            const [valueMin, valueMax] = pvLimits;
            const k = fullSize / (valueMax - valueMin);
            for (let tickValue of tickValues) {
                result.push(k * (tickValue - valueMin));
            }
            return result;
        }

        const tickPositions = calcTickPositions();
        const refinedTicks = refineTicks(calcTickValues(), this.getAllStyle()["fontSize"] * 0.5, elementRef, "horizontal");

        return (
            <div
                ref={elementRef}
                style={{
                    width: "100%",
                    height: this.getAllStyle()["fontSize"] + scaleTickSize * 0 + 4,
                    position: "relative",
                    display: "inline-flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexShrink: "0",
                }}
            >
                {/* ticks and line */}
                <svg
                    width="100%"
                    height="100%"
                    x="0"
                    y="0"
                    style={{
                        position: "absolute",
                        overflow: "visible",
                    }}
                >
                    {/* long line, 2px gap above */}
                    {/* <path d={`M 0 ${scaleTickSize + fontSize} L ${fullSize} ${scaleTickSize + fontSize}`} strokeWidth="2" stroke={this.getAllStyle()["color"]} fill="none"></path> */}

                    {/* ticks */}
                    {tickPositions.map((position: number, index: number) => {
                        if (this.getAllText()["compactScale"]) {
                            if (!(index === 0 || index === tickPositions.length - 1)) {
                                return null;
                            }
                        }
                        return null;
                    })}
                </svg>
                {/* labels */}
                {tickPositions.map((value: number, index: number) => {
                    if (this.getAllText()["compactScale"]) {
                        if (!(index === 0 || index === tickPositions.length - 1)) {
                            return null;
                        }
                    }
                    return (
                        <div
                            style={{
                                position: "absolute",
                                left: value,
                                top: fontSize / 2,
                                width: 0,
                                height: 0,
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: index === 0 ? "flex-start" : index === this.getAllText()["numTickIntervals"] ? "flex-end" : "center",
                                // color: this.getAllStyle()["color"],
                                color: this._getElementAreaRawTextStyle(),
                            }}
                        >
                            {/* {calcTickValues()[index]} */}
                            {refinedTicks[index]}
                        </div>
                    );
                })}
                {(() => {
                    if (this.getAllText()["compactScale"]) {
                        return (
                            <div
                                style={{
                                    position: "absolute",
                                    left: this.getAllStyle()["width"] / 2,
                                    // top: scaleTickSize,
                                    top: fontSize / 2,
                                    width: 0,
                                    height: 0,
                                    display: "inline-flex",
                                    // alignItems: "flex-start",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    // color: this.getAllStyle()["color"],
                                    color: this._getElementAreaRawTextStyle(),
                                }}
                            >
                                {`${this._getChannelValueForReadback()}`}
                            </div>
                        );
                    } else {
                        return null;
                    }
                })()}
            </div>
        );
    };

    // concretize abstract method
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

    _getChannelValue = (raw: boolean = false) => {
        const value = this._getFirstChannelValue(raw);
        if (value === undefined) {
            return "";
        } else {
            return value;
        }
    };

    // special function for readback value
    // the above _getChannelValue() is used for computing the slide bar position
    _getChannelValueForReadback = (raw: boolean = false) => {
        const channelValue = this._getFirstChannelValue(raw);
        if (typeof channelValue === "number") {
            const scale = Math.max(this.getAllText()["scale"], 0);
            const format = this.getAllText()["format"];
            if (format === "decimal") {
                return channelValue.toFixed(scale);
            } else if (format === "default") {
                const channelName = this.getChannelNames()[0];
                const defaultScale = g_widgets1.getChannelPrecision(channelName);
                if (defaultScale !== undefined) {
                    return channelValue.toFixed(defaultScale);
                } else {
                    return channelValue.toFixed(scale);
                }
            } else if (format === "exponential") {
                return channelValue.toExponential(scale);
            } else if (format === "hexadecimal") {
                return `0x${channelValue.toString(16)}`;
            } else {
                return channelValue;
            }
        } else {
            return channelValue;
        }
    };

    // _getChannelValue = () => {
    // 	return this._getFirstChannelValue();
    // };

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
    _getChannelAccessRight = () => {
        return this._getFirstChannelAccessRight();
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
