import * as React from "react";
import { GlobalVariables, g_widgets1 } from "../../global/GlobalVariables";
import { MeterSidebar } from "./MeterSidebar";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { MeterRules } from "./MeterRules";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import {Log} from "../../../mainProcess/log/Log";
import { ChannelSeverity } from "../../channel/TcaChannel";
import { refineTicks, calcTicks } from "../../global/GlobalMethods";

export type type_Meter_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
};

export class Meter extends BaseWidget {
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

    _rules: MeterRules;

    readonly pi = 3.1415926;

    constructor(widgetTdl: type_Meter_tdl) {
        super(widgetTdl);
        this.setReadWriteType("read");

        this.setStyle({ ...Meter._defaultTdl.style, ...widgetTdl.style });
        this.setText({ ...Meter._defaultTdl.text, ...widgetTdl.text });

        this._rules = new MeterRules(this, widgetTdl);

        // this._sidebar = new MeterSidebar(this);
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
        this.setAllStyle({...this.getStyle(), ...this.getRulesStyle()});
        this.setAllText({...this.getText(), ...this.getRulesText()});

        // must do it for every widget
        g_widgets1.removeFromForceUpdateWidgets(this.getWidgetKey());
        this.renderChildWidgets = true;
        React.useEffect(() => {
            this.renderChildWidgets = false;
        });

        return (
            <ErrorBoundary style={this.getStyle()} widgetKey={this.getWidgetKey()}>
                <>
                    <this._ElementBody></this._ElementBody>
                    {this._showSidebar() ? this._sidebar?.getElement() : null}
                </>
            </ErrorBoundary>
        );
    };

    // Text area and resizers
    _ElementBodyRaw = (): JSX.Element => {
        return (
            // always update the div below no matter the TextUpdateBody is .memo or not
            // TextUpdateResizer does not update if it is .memo
            <div style={this.getElementBodyRawStyle()}>
                <this._ElementArea></this._ElementArea>
                {this._showResizers() ? <this._ElementResizer /> : null}
            </div>
        );
    };

    // only shows the text, all other style properties are held by upper level _ElementBodyRaw
    _ElementAreaRaw = ({ }: any): JSX.Element => {
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
                    // overflow: "show",
                    whiteSpace: this.getAllText().wrapWord ? "normal" : "pre",
                    justifyContent: this.getAllText().horizontalAlign,
                    alignItems: this.getAllText().verticalAlign,
                    fontFamily: this.getAllStyle().fontFamily,
                    fontSize: this.getAllStyle().fontSize,
                    fontStyle: this.getAllStyle().fontStyle,
                    fontWeight: this.getAllStyle().fontWeight,
                    outline: this._getElementAreaRawOutlineStyle(),
                    color: this._getElementAreaRawTextStyle(),
                    backgroundColor: this._getElementAreaRawBackgroundStyle(),
                }}
                // title={"tooltip"}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                <this._ElementMeter></this._ElementMeter>
            </div>
        );
    };

    _Element = React.memo(this._ElementRaw, () => this._useMemoedElement());
    _ElementArea = React.memo(this._ElementAreaRaw, () => this._useMemoedElement());
    _ElementBody = React.memo(this._ElementBodyRaw, () => this._useMemoedElement());

    _ElementArc = ({ points }: any) => {
        return (
            <>
                <path
                    d={`M ${points[4]} ${points[5]} A ${points[2]} ${points[3]} 0 ${this.getAllText()["angleRange"] > 180 ? 1 : 0} 0 ${points[6]} ${points[7]
                        }`}
                    strokeWidth={this.getAllText()["dialThickness"]}
                    stroke={this._getElementAreaRawDialStyle()}
                    strokeLinecap={"butt"}
                    fill="none"
                ></path>
            </>
        );
    };
    _ElementPointer = ({ circle1, circle2 }: any) => {
        const angle = this.calcPointerAngle();
        const points = this.calcPointerTangentPoints(circle1, circle2);
        const arcBit = angle > this.pi / 2 && angle < (3 * this.pi) / 2 ? 0 : 1;

        return (
            <>
                <path
                    d={`M ${points[0][0]} ${points[0][1]} L ${points[1][0]} ${points[1][1]} A ${circle2[2]} ${circle2[2]} 0 0 ${arcBit} ${points[3][0]} ${points[3][1]} L ${points[2][0]} ${points[2][1]} A ${circle1[2]} ${circle1[2]} 0 0 ${arcBit} ${points[0][0]} ${points[0][1]}`}
                    fill={this._getElementAreaRawPointerStyle()}
                ></path>
            </>
        );
    };

    _ElementTickBars = () => {
        const [cX, cY, a, b, x1, y1, x2, y2] = this.calcArcXY();
        const angles = this.calcTickAngles();
        const pointerRelativeLength = 0.85;
        const tickLength = (1 - pointerRelativeLength) / 2;

        return (
            <>
                {angles.map((angle: number) => {
                    const x1 = cX + a * Math.cos((angle * this.pi) / 180);
                    const y1 = cY - b * Math.sin((angle * this.pi) / 180);
                    const x2 = cX + (1 - tickLength) * a * Math.cos((angle * this.pi) / 180);
                    const y2 = cY - (1 - tickLength) * b * Math.sin((angle * this.pi) / 180);
                    return (
                        <path
                            d={`M ${x1} ${y1} L ${x2} ${y2}`}
                            strokeWidth="2"
                            // stroke={this.getAllText()["dialColor"]}
                            stroke={this._getElementAreaRawDialStyle()}
                            strokeLinecap={"butt"}
                            fill="none"
                        ></path>
                    );
                })}
            </>
        );
    };

    _ElementTickNumbers = () => {
        const [cX, cY, a, b, x1, y1, x2, y2] = this.calcArcXY();
        const angles = this.calcTickAngles();

        return (
            <>
                {this.calcTickValues().map((value: number, index: number) => {
                    const angle = angles[index];
                    const x2 = cX + (this.getAllText()["labelPositionPercentage"] / 100) * a * Math.cos((angle * this.pi) / 180);
                    const y2 = cY - (this.getAllText()["labelPositionPercentage"] / 100) * b * Math.sin((angle * this.pi) / 180);
                    return (
                        <div
                            style={{
                                position: "absolute",
                                left: x2,
                                top: y2,
                                width: 0,
                                height: 0,
                                display: "inline-flex",
                                justifyContent: "center",
                                alignItems: "center",
                                // fontFamily: this.getAllText()["dialFontFamily"],
                                // fontSize: this.getAllText()["dialFontSize"],
                                // fontStyle: this.getAllText()["dialFontStyle"],
                                // fontWeight: this.getAllText()["dialFontWeight"],
                                // color: this.getAllText()["dialFontColor"],
                            }}
                        >
                            {value}
                        </div>
                    );
                })}
            </>
        );
    };

    _ElementMeter = () => {
        const points = this.calcArcXY();
        const angle = this.calcPointerAngle();

        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    display: "inline-flex",
                    justifyContent: "center",
                    alignItems: "center",
                    flexDirection: "column",
                    opacity: this.getAllText()["invisibleInOperation"] === true && !g_widgets1.isEditing() ? 0 : 1,
                }}
            >
                <div
                    style={{
                        width: "100%",
                        height: `${this.getAllText()["dialPercentage"]}%`,
                        position: "relative",
                        display: "inline-flex",
                        justifyContent: "center",
                        alignItems: "center",
                        flexDirection: "column",
                    }}
                >
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
                        {/* arc */}
                        <this._ElementArc points={points}></this._ElementArc>
                        {/* pointer */}
                        <this._ElementPointer
                            circle1={[points[0], points[1], this.getAllText()["pointerThickness"]]}
                            circle2={[
                                points[0] + (this.getAllText()["pointerLengthPercentage"] / 100) * points[2] * Math.cos(angle),
                                points[1] - (this.getAllText()["pointerLengthPercentage"] / 100) * points[3] * Math.sin(angle),
                                this.getAllText()["pointerThickness"] / 2,
                            ]}
                        ></this._ElementPointer>
                        {/* ticks */}
                        <this._ElementTickBars></this._ElementTickBars>
                    </svg>
                    {/* labels */}
                    <this._ElementTickNumbers></this._ElementTickNumbers>
                </div>
                <div
                    style={{
                        width: "100%",
                        height: `${100 - this.getAllText()["dialPercentage"]}%`,
                        position: "relative",
                        display: "inline-flex",
                        justifyContent: "center",
                        alignItems: "center",
                        flexDirection: "column",
                    }}
                >
                    {" "}
                    {`${this.getAllText()["showPvValue"] ? this._getChannelValue() : ""} ${this.getAllText()["showUnit"] && this.getAllText()["showPvValue"] ? this._getChannelUnit() : ""
                        }`}
                </div>
            </div>
        );
    };

    // defined in super class
    // getElement()
    // getSidebarElement()
    // _ElementResizerRaw
    // _ElementResizer

    // ------------------ element helper functions -----------
    calcArcXY = () => {
        const angleRange = this.getAllText()["angleRange"];
        const w = this.getAllStyle()["width"];
        const h = (this.getAllStyle()["height"] * this.getAllText()["dialPercentage"]) / 100;
        const t = this.getAllText()["dialThickness"];
        let result: number[] = [];

        if (angleRange > 180) {
            const theta = (((angleRange - 180) / 2) * this.pi) / 180;
            const rx0 = w / 2;
            const ry0 = h / (1 + Math.sin(theta));
            const rx1 = rx0 - t / 2;
            const ry1 = ry0 - t / 2;
            const x1A = rx1 * Math.cos(theta);
            const y1A = ry1 * Math.sin(theta);
            const x1 = w / 2 + x1A;
            const y1 = ry0 + y1A;
            const x2 = w / 2 - x1A;
            const y2 = ry0 + y1A;
            const a = rx1;
            const b = ry1;
            const cX = w / 2;
            const cY = ry0;
            result = [cX, cY, a, b, x1, y1, x2, y2];
        } else {
            const theta = (((180 - angleRange) / 2) * this.pi) / 180;
            const rx0 = w / 2 / (1 - Math.sin(theta) * Math.tan(theta / 2));
            const ry0 = h;
            const rx1 = rx0 - t / 2;
            const ry1 = ry0 - t / 2;
            const x1A = rx1 * Math.cos(theta);
            const y1A = ry1 * Math.sin(theta);
            const x1 = w / 2 + x1A;
            const y1 = h - y1A;
            const x2 = w / 2 - x1A;
            const y2 = h - y1A;
            const a = rx1;
            const b = ry1;
            const cX = w / 2;
            const cY = h;
            result = [cX, cY, a, b, x1, y1, x2, y2];
        }
        return result;
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
     * Calcualte the angle for the current PV value, e.g. the angle of the pointer, if in editing mode, the angle is 90 degree
     */
    calcPointerAngle = () => {
        if (g_widgets1.isEditing()) {
            return (90 * this.pi) / 180;
        } else {
            let value = this._getChannelValue(true);
            if (typeof value === "number") {
                const [minPvValue, maxPvValue] = this.calcPvLimits();
                const maxValueAngle = (180 - this.getAllText()["angleRange"]) / 2;
                const minValueAngle = 180 - maxValueAngle;
                if (value > maxPvValue) {
                    value = maxPvValue;
                } else if (value < minPvValue) {
                    value = minPvValue;
                }
                const angle = ((maxValueAngle - minValueAngle) / (maxPvValue - minPvValue)) * (value - minPvValue) + minValueAngle;
                return (angle * this.pi) / 180;
            } else {
                return (90 * this.pi) / 180;
            }
        }
    };

    calcPointerTangentPoints = (circle1: [number, number, number], circle2: [number, number, number]) => {
        const x1 = circle1[0];
        const y1 = circle1[1];
        const r1 = circle1[2];
        const x2 = circle2[0];
        const y2 = circle2[1];
        const r2 = circle2[2];

        const d0 = Math.abs(r1 - r2);
        const d1 = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
        const alpha = Math.atan((y2 - y1) / (x2 - x1));
        const beta = Math.asin(d0 / d1);

        const gamma1 = (3 * this.pi) / 2 + alpha - beta;
        const gamma2 = (5 * this.pi) / 2 + alpha + beta;

        const x3 = x1 + r1 * Math.cos(gamma1);
        const y3 = y1 + r1 * Math.sin(gamma1);
        const x4 = x2 + r2 * Math.cos(gamma1);
        const y4 = y2 + r2 * Math.sin(gamma1);

        const x5 = x1 + r1 * Math.cos(gamma2);
        const y5 = y1 + r1 * Math.sin(gamma2);
        const x6 = x2 + r2 * Math.cos(gamma2);
        const y6 = y2 + r2 * Math.sin(gamma2);
        return [
            [x3, y3],
            [x4, y4],
            [x5, y5],
            [x6, y6],
        ];
    };

    calcTickValues1 = (): number[] => {
        return [0, 1, 3, 4, 7, 10];
    };

    calcTickValues = () => {
        const result: number[] = [];
        const [valueMin, valueMax] = this.calcPvLimits();
        // const dValue = (valueMax - valueMin) / this.getAllText()["numTickIntervals"];
        // for (let ii = 0; ii <= this.getAllText()["numTickIntervals"]; ii++) {
        //     result.push(valueMin + dValue * ii);
        // }
        // return result;
        const numTickIntervals = this.getAllText()["numTickIntervals"] + 1;
        return calcTicks(valueMin, valueMax, numTickIntervals + 1, "linear");
    };


    calcTickAngles = () => {
        const values = this.calcTickValues();
        const [minPvValue, maxPvValue] = this.calcPvLimits();
        const minAngle = 90 - this.getAllText()["angleRange"] / 2;
        const maxAngle = 90 + this.getAllText()["angleRange"] / 2;
        const angles: number[] = [];
        for (let ii = 0; ii < values.length; ii++) {
            const value = values[ii];
            const angle = minAngle + ((value - minPvValue) / (maxPvValue - minPvValue)) * (maxAngle - minAngle);
            angles.push(180 - angle);
        }
        return angles;
    };

    // -------------------- helper functions ----------------

    // defined in super class
    // _showSidebar()
    // _showResizers()
    // _useMemoedElement()
    // hasChannel()
    // isInGroup()
    // isSelected()
    // _getElementAreaRawOutlineStyle()

    // _getChannelValue = (raw: boolean = false) => {
    // 	return this.getChannelValueForMonitorWidget(raw);
    // };

    // _getChannelValue = (raw: boolean = false) => {
    // 	const channelValue = this.getChannelValueForMonitorWidget(raw);
    // 	if (typeof channelValue === "number") {
    // 		const scale = Math.max(this.getAllText()["scale"], 0);
    // 		const format = this.getAllText()["format"];
    // 		if (format === "decimal") {
    // 			return channelValue.toFixed(scale);
    // 		} else if (format === "default") {
    // 			const channelName = this.getChannelNames()[0];
    // 			const defaultScale = g_widgets1.getChannelPrecision(channelName);
    // 			if (defaultScale !== undefined) {
    // 				return channelValue.toFixed(defaultScale);
    // 			} else {
    // 				return channelValue.toFixed(scale);
    // 			}
    // 		} else if (format === "exponential") {
    // 			return channelValue.toExponential(scale);
    // 		} else if (format === "hexadecimal") {
    // 			return `0x${channelValue.toString(16)}`;
    // 		} else {
    // 			return channelValue;
    // 		}
    // 	} else {
    // 		return channelValue;
    // 	}
    // };

    _getChannelValue = (raw: boolean = false) => {
        const value = this._getFirstChannelValue(raw);
        if (value === undefined) {
            return "";
        } else {
            return value;
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

    static _defaultTdl: type_Meter_tdl = {
        type: "Meter",
        widgetKey: "", // "key" is a reserved keyword
        key: "",
        style: {
            // basics
            position: "absolute",
            display: "inline-block",
            // dimensions
            left: 0,
            top: 0,
            width: 100,
            height: 100,
            // overall background color
            backgroundColor: "rgba(255, 255, 255, 1)",
            // angle
            transform: "rotate(0deg)",
            // font in the bottom channel value area
            color: "rgba(0,0,0,1)",
            fontFamily: GlobalVariables.defaultFontFamily,
            fontSize: GlobalVariables.defaultFontSize,
            fontStyle: GlobalVariables.defaultFontStyle,
            fontWeight: GlobalVariables.defaultFontWeight,
            // border, it is different from the "alarmBorder" below
            borderStyle: "solid",
            borderWidth: 0,
            borderColor: "rgba(0, 0, 0, 1)",
            // shows when the widget is selected
            outlineStyle: "none",
            outlineWidth: 1,
            outlineColor: "black",
        },
        text: {
            // channel display on bottom
            showPvValue: true,
            horizontalAlign: "flex-start",
            verticalAlign: "flex-start",
            wrapWord: false,
            showUnit: true,
            // PV
            usePvLimits: true,
            minPvValue: 0,
            maxPvValue: 100,
            useLogScale: false,
            // dial
            angleRange: 275, // dial arc angle range
            dialColor: "rgba(0,0,0,1)", // dial arc and ticks color
            dialPercentage: 90, // dial height percentage
            dialThickness: 5, // dial arc thickness
            // pointer
            pointerColor: "rgba(0,200,0,1)",
            // fillColorMinor: "rgba(255, 150, 100, 1)",
            // fillColorMajor: "rgba(255,0,0,1)",
            // fillColorInvalid: "rgba(200,0,200,1)",

            pointerLengthPercentage: 75, // pointer length percentage
            pointerThickness: 5,
            // label on dial
            labelPositionPercentage: 85, // tick label relative position
            // dialFontColor: "rgba(0,0,0,1)",
            // dialFontFamily: "Liberation Sans",
            // dialFontSize: 14,
            // dialFontStyle: "normal",
            // dialFontWeight: "normal",
            invisibleInOperation: false,
            // decimal, exponential, hexadecimal
            format: "default",
            // scale, >= 0
            scale: 0,
            // new
            numTickIntervals: 5,
            alarmText: false,
            alarmPointer: false,
            alarmDial: false,
            alarmBackground: false,
            alarmBorder: true,
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

    // -------------------------- sidebar ---------------------------
    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new MeterSidebar(this);
        }
    }
}
