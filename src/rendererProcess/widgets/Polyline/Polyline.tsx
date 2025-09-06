import * as React from "react";
import { MouseEvent } from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { GroupSelection2 } from "../../helperWidgets/GroupSelection/GroupSelection2";
import { PolylineSidebar } from "./PolylineSidebar";
import * as GlobalMethods from "../../global/GlobalMethods";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { PolylineSmoother } from "./PolylineSmoother";
import { PolylineRules } from "./PolylineRules";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";

export type type_Polyline_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
    pointsX: number[];
    pointsY: number[];
};

export class Polyline extends BaseWidget {
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

    _rules: PolylineRules;
    _pointsRelativeX: number[];
    _pointsRelativeY: number[];

    minWidth: number = 5;

    constructor(widgetTdl: type_Polyline_tdl) {
        super(widgetTdl);
        this.setReadWriteType("read");

        this.setStyle({ ...Polyline._defaultTdl.style, ...widgetTdl.style });
        this.setText({ ...Polyline._defaultTdl.text, ...widgetTdl.text });

        // this._rules = new PolylineRules(this, widgetTdl);

        // points
        const maxX = Math.max(...widgetTdl.pointsX);
        const maxY = Math.max(...widgetTdl.pointsY);
        this.getStyle()["width"] = Math.max(maxX, this.minWidth);
        this.getStyle()["height"] = Math.max(maxY, this.minWidth);
        this._pointsRelativeX = [...Polyline._defaultTdl.pointsX];
        this._pointsRelativeY = [...Polyline._defaultTdl.pointsY];
        for (let ii = 0; ii < widgetTdl.pointsX.length; ii++) {
            // this._pointsRelativeX.push(maxX <= 0 ? 0 : widgetTdl.pointsX[ii] / maxX);
            // this._pointsRelativeY.push(maxY <= 0 ? 0 : widgetTdl.pointsY[ii] / maxY);
            this._pointsRelativeX.push(maxX <= 0 ? 0 : widgetTdl.pointsX[ii] / this.getStyle()["width"]);
            this._pointsRelativeY.push(maxY <= 0 ? 0 : widgetTdl.pointsY[ii] / this.getStyle()["height"]);
        }

        this._rules = new PolylineRules(this, widgetTdl);

        // this._sidebar = new PolylineSidebar(this);
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
            <ErrorBoundary style={this.getStyle()} widgetKey={this.getWidgetKey()}>
                <>
                    <this._ElementBody></this._ElementBody>
                    {this._showSidebar() ? this._sidebar?.getElement() : null}
                </>
            </ErrorBoundary>
        );
    };

    // Text area and resizers
    _ElementBodyRaw = (): React.JSX.Element => {
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
                    position: "absolute",
                    overflow: "visible",
                    whiteSpace: this.getAllText().wrapWord ? "normal" : "pre",
                    justifyContent: this.getAllText().horizontalAlign,
                    alignItems: this.getAllText().verticalAlign,
                    outline: this._getElementAreaRawOutlineStyle(),
                }}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                <this._ElementLine></this._ElementLine>
            </div>
        );
    };

    // ------------------------- polyline ------------------------------------

    calcStrokeDasharray = () => {
        const lineWidth = this.getAllText()["lineWidth"];
        switch (this.getAllText()["lineStyle"]) {
            case "solid":
                return ``;
            case "dotted":
                return `${lineWidth},${lineWidth}`;
            case "dashed":
                return `${4 * lineWidth},${2 * lineWidth}`;
            case "dash-dot":
                return `${4 * lineWidth},${lineWidth},${lineWidth},${lineWidth}`;
            case "dash-dot-dot":
                return `${4 * lineWidth},${lineWidth},${lineWidth},${lineWidth},${lineWidth},${lineWidth}`;
            default:
                return "";
        }
    };

    generatePolylinePoint = (ii: number): string => {
        let result = "";
        const width = this.getAllStyle()["width"];
        const height = this.getAllStyle()["height"];
        const coordinate = `${width * this.getPointsRelativeX()[ii]},${height * this.getPointsRelativeY()[ii]}`;
        result = `${coordinate}`;
        return result;
    };


    // reading the overall style, use getAllStyle()
    generatePolylinePoints = (): string => {
        let result = "";
        const width = this.getAllStyle()["width"];
        const height = this.getAllStyle()["height"];
        for (let ii = 0; ii < this.getPointsRelativeX().length; ii++) {
            const coordinate = `${width * this.getPointsRelativeX()[ii]},${height * this.getPointsRelativeY()[ii]}`;
            result = `${result} ${coordinate}`;
        }
        return result;
    };

    // reading the overall style, use getAllStyle()
    generateSmoothPolylinePoints = (): string => {
        const width = this.getAllStyle()["width"];
        const height = this.getAllStyle()["height"];
        const pointsX = [];
        const pointsY = [];
        for (let ii = 0; ii < this.getPointsRelativeX().length; ii++) {
            pointsX.push(this.getPointsRelativeX()[ii] * width);
            pointsY.push(this.getPointsRelativeY()[ii] * height);
        }
        return PolylineSmoother.resize(pointsX, pointsY, width, height);
    };

    _ElementLine = () => {
        const length = this.getAllText()["arrowLength"];
        const width = this.getAllText()["arrowWidth"];
        if (this.isSelected() === false && g_widgets1.isEditing() === true) {
            this.selectedPointIndex = -1;
        }

        return (
            <svg
                width="100%"
                height="100%"
                x="0"
                y="0"
                style={{
                    position: "absolute",
                    overflow: "visible",
                    backgroundColor: this._getElementAreaRawBackgroundStyle(),
                    opacity: this.getAllText()["invisibleInOperation"] === true && !g_widgets1.isEditing() ? 0 : 1,
                }}
            >
                <defs>
                    <marker
                        id={`arrowTail-${this.getWidgetKey()}`}
                        viewBox={`0 0 ${length} ${width}`}
                        refX="0"
                        refY={`${width / 2}`}
                        markerUnits="strokeWidth"
                        markerWidth={`${length}`}
                        markerHeight={`${width}`}
                        orient="auto"
                    >
                        <path
                            d={`M 0 0 L ${length} ${width / 2} L 0 ${width} z`}
                            // fill={`${this.getAllText()["lineColor"]}`}
                            fill={`${this._getElementAreaRawShapeStyle()}`}
                        />
                    </marker>
                    <marker
                        id={`arrowHead-${this.getWidgetKey()}`}
                        viewBox={`${-1 * length} ${-1 * width} ${2 * length} ${2 * width}`}
                        refX="0"
                        refY={`${width / 2}`}
                        markerUnits="strokeWidth"
                        markerWidth={`${2 * length}`}
                        markerHeight={`${2 * width}`}
                        orient="auto"
                    >
                        <path
                            d={`M 0 0 L ${-1 * length} ${width / 2} L 0 ${width} z`}
                            // fill={`${this.getAllText()["lineColor"]}`}
                            fill={`${this._getElementAreaRawShapeStyle()}`}
                        />
                    </marker>
                </defs>
                {this.getAllText()["smootherize"] ? (
                    <path
                        d={`${this.generateSmoothPolylinePoints()} ${this.getAllText()["closed"] ? " z" : ""}`}
                        strokeWidth={this.getAllText()["lineWidth"]}
                        // stroke={this.getAllText()["lineColor"]}
                        stroke={this._getElementAreaRawShapeStyle()}
                        strokeDasharray={this.calcStrokeDasharray()}
                        markerEnd={this.getAllText()["showArrowHead"] ? `url(#arrowTail-${this.getWidgetKey()})` : ""}
                        markerStart={this.getAllText()["showArrowTail"] ? `url(#arrowHead-${this.getWidgetKey()})` : ""}
                        strokeLinecap={"butt"}
                        // fill={this.getAllText()["fill"] ? this.getAllText()["fillColor"] : "none"}
                        fill={this.getAllText()["fill"] ? this._getElementAreaRawFillStyle() : "none"}
                    />
                ) : this.getAllText()["closed"] ? (
                    <polygon
                        // points={`${this.generatePolylinePoints()} ${this.getAllText()["closed"] ? " z" : ""}`}
                        points={`${this.generatePolylinePoints()}`}
                        strokeWidth={this.getAllText()["lineWidth"]}
                        // stroke={this.getAllText()["lineColor"]}
                        stroke={this._getElementAreaRawShapeStyle()}
                        strokeDasharray={this.calcStrokeDasharray()}
                        markerEnd={this.getAllText()["showArrowHead"] ? `url(#arrowTail-${this.getWidgetKey()})` : ""}
                        markerStart={this.getAllText()["showArrowTail"] ? `url(#arrowHead-${this.getWidgetKey()})` : ""}
                        strokeLinecap={"butt"}
                        // fill={this.getAllText()["fill"] ? this.getAllText()["fillColor"] : "none"}
                        fill={this.getAllText()["fill"] ? this._getElementAreaRawFillStyle() : "none"}
                    ></polygon>
                ) : (
                    <polyline
                        // points={`${this.generatePolylinePoints()} ${this.getAllText()["closed"] ? " z" : ""}`}
                        points={`${this.generatePolylinePoints()}`}
                        strokeWidth={this.getAllText()["lineWidth"]}
                        // stroke={this.getAllText()["lineColor"]}
                        stroke={this._getElementAreaRawShapeStyle()}
                        strokeDasharray={this.calcStrokeDasharray()}
                        markerEnd={this.getAllText()["showArrowHead"] ? `url(#arrowTail-${this.getWidgetKey()})` : ""}
                        markerStart={this.getAllText()["showArrowTail"] ? `url(#arrowHead-${this.getWidgetKey()})` : ""}
                        strokeLinecap={"butt"}
                        // fill={this.getAllText()["fill"] ? this.getAllText()["fillColor"] : "none"}
                        fill={this.getAllText()["fill"] ? this._getElementAreaRawFillStyle() : "none"}
                    ></polyline>
                )}
                {this.selectedPointIndex === -1 ?
                    null :
                    this.isSelected() === false ?
                        null :
                        <circle
                            r={this.getAllText()["lineWidth"] + 3}
                            cx={this.generatePolylinePoint(this.selectedPointIndex).split(",")[0]}
                            cy={this.generatePolylinePoint(this.selectedPointIndex).split(",")[1]}
                            fill={"red"} />
                }

            </svg>
        );
    };

    selectedPointIndex: number = -1;

    // change 2 things for each direction: this.getStyle()["width"], this.getPointsRelativeX()
    // flush widget
    // we are changing the style, use this.getStyle() through this function
    updateWidgetAddPoint = (pointGlobalX: number, pointGlobalY: number, recordHistory: boolean = false) => {
        const pointX = pointGlobalX - this.getStyle()["left"];
        const pointY = pointGlobalY - this.getStyle()["top"];
        const width = this.getStyle()["width"];
        const height = this.getStyle()["height"];

        // x
        const maxX = Math.max(width, pointX);
        if (maxX > width) {
            const newWidth = maxX;
            this.getStyle()["width"] = newWidth;
            const ratio = width / newWidth;
            for (let ii = 0; ii < this.getPointsRelativeX().length; ii++) {
                this.getPointsRelativeX()[ii] = this.getPointsRelativeX()[ii] * ratio;
            }
        }

        if (pointX < 0) {
            this.getStyle()["left"] = this.getStyle()["left"] + pointX;
            const newWidth = this.getStyle()["width"] - pointX;
            this.getStyle()["width"] = newWidth;
            const ratio = width / newWidth;
            for (let ii = 0; ii < this.getPointsRelativeX().length; ii++) {
                this.getPointsRelativeX()[ii] = (this.getPointsRelativeX()[ii] * width - pointX) / newWidth;
            }
            this.getPointsRelativeX().push(0);
        } else {
            this.getPointsRelativeX().push(pointX / this.getStyle()["width"]);
        }

        // y
        const maxY = Math.max(height, pointY);
        if (maxY >= height) {
            const newHeight = maxY;
            this.getStyle()["height"] = newHeight;
            const ratio = height / newHeight;
            for (let ii = 0; ii < this.getPointsRelativeY().length; ii++) {
                this.getPointsRelativeY()[ii] = this.getPointsRelativeY()[ii] * ratio;
            }
        }

        if (pointY < 0) {
            this.getStyle()["top"] = this.getStyle()["top"] + pointY;
            const newHeight = this.getStyle()["height"] - pointY;
            this.getStyle()["height"] = newHeight;
            const ratio = height / newHeight;
            for (let ii = 0; ii < this.getPointsRelativeY().length; ii++) {
                this.getPointsRelativeY()[ii] = (this.getPointsRelativeY()[ii] * height - pointY) / newHeight;
                // this.getPointsRelativeY()[ii] = this.getPointsRelativeY()[ii] * ratio;
            }
            this.getPointsRelativeY().push(0);
        } else {
            this.getPointsRelativeY().push(pointY / this.getStyle()["height"]);
        }
        // no history

        if (recordHistory) {
            const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
            history.registerAction();
        }

        // flush this widget
        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };

    // change 2 things for each direction: this.getStyle()["width"], this.getPointsRelativeX()
    // flush widget
    // we are changing the style, use this.getStyle() through this function
    updateWidgetRemovePoint = (index: number | undefined = undefined, recordHistory: boolean = false) => {
        if (index === undefined) {
            index = this.getPointsRelativeX().length - 1;
        }
        const width = this.getStyle()["width"];
        const height = this.getStyle()["height"];
        // const pointRelativeX = this.getPointsRelativeX()[this.getPointsRelativeX().length - 1];
        // const pointRelativeY = this.getPointsRelativeY()[this.getPointsRelativeY().length - 1];
        // this.getPointsRelativeX().splice(this.getPointsRelativeX().length - 1, 1);
        // this.getPointsRelativeY().splice(this.getPointsRelativeY().length - 1, 1);
        const pointRelativeX = this.getPointsRelativeX()[index];
        const pointRelativeY = this.getPointsRelativeY()[index];
        this.getPointsRelativeX().splice(index, 1);
        this.getPointsRelativeY().splice(index, 1);

        if (pointRelativeX >= 0.999999) {
            let newWidth = width * Math.max(...this.getPointsRelativeX());
            if (newWidth < this.minWidth) {
                newWidth = this.minWidth;
            }
            this.getStyle()["width"] = newWidth;
            const ratio = width / newWidth;
            for (let ii = 0; ii < this.getPointsRelativeX().length; ii++) {
                this.getPointsRelativeX()[ii] = this.getPointsRelativeX()[ii] * ratio;
            }
        }

        if (pointRelativeX <= 0.000001) {
            let newWidth = width * (1 - Math.min(...this.getPointsRelativeX()));
            if (newWidth < this.minWidth) {
                newWidth = this.minWidth;
            }

            const newLeft = this.getStyle()["left"] + Math.min(...this.getPointsRelativeX()) * width;
            this.getStyle()["width"] = newWidth;
            this.getStyle()["left"] = newLeft;
            const minRelativeX = Math.min(...this.getPointsRelativeX());
            for (let ii = 0; ii < this.getPointsRelativeX().length; ii++) {
                this.getPointsRelativeX()[ii] = ((this.getPointsRelativeX()[ii] - minRelativeX) * width) / newWidth;
            }
        }

        if (pointRelativeY >= 0.999999) {
            let newHeight = height * Math.max(...this.getPointsRelativeY());
            if (newHeight < this.minWidth) {
                newHeight = this.minWidth;
            }

            this.getStyle()["height"] = newHeight;
            const ratio = height / newHeight;
            for (let ii = 0; ii < this.getPointsRelativeY().length; ii++) {
                this.getPointsRelativeY()[ii] = this.getPointsRelativeY()[ii] * ratio;
            }
        }

        if (pointRelativeY <= 0.000001) {
            let newHeight = height * (1 - Math.min(...this.getPointsRelativeY()));
            if (newHeight < this.minWidth) {
                newHeight = this.minWidth;
            }
            const newTop = this.getStyle()["top"] + Math.min(...this.getPointsRelativeY()) * height;
            this.getStyle()["height"] = newHeight;
            this.getStyle()["top"] = newTop;
            const minRelativeY = Math.min(...this.getPointsRelativeY());

            for (let ii = 0; ii < this.getPointsRelativeY().length; ii++) {
                this.getPointsRelativeY()[ii] = ((this.getPointsRelativeY()[ii] - minRelativeY) * height) / newHeight;
            }
        }

        // no history
        if (recordHistory) {
            const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
            history.registerAction();
        }

        // flush this widget
        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };

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

    _getChannelValue = () => {
        const value = this._getFirstChannelValue();
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
    static _defaultTdl: type_Polyline_tdl = {
        type: "Polyline",
        widgetKey: "", // "key" is a reserved keyword
        key: "",
        style: {
            // basics
            position: "absolute",
            display: "inline-flex",
            // dimensions
            left: 0,
            top: 0,
            width: 100,
            height: 100,
            backgroundColor: "rgba(0,0,0,0)",
            // angle
            transform: "rotate(0deg)",
            // line color, not text color
            color: "rgba(0,0,255,1)",
            // border
            borderStyle: "solid",
            borderWidth: 0,
            borderColor: "rgba(0, 0, 0, 1)",
            // shows when the widget is selected
            outlineStyle: "none",
            outlineWidth: 1,
            outlineColor: "black",
        },
        // the ElementBody style
        text: {
            // line styles
            lineWidth: 3,
            lineStyle: "solid",
            lineColor: "rgba(0,0,255,1)",
            // arrows, length and width are in unit of line width
            arrowLength: 6,
            arrowWidth: 3,
            showArrowHead: false,
            showArrowTail: false,
            // curve
            smootherize: false,
            // when fill === true and closed === true, it is a polygon
            fill: false,
            closed: false,
            fillColor: "rgba(50,50,255,1)",
            invisibleInOperation: false,
            alarmBorder: false,
            alarmFill: false,
            alarmBackground: false,
            alarmText: false,
            alarmLevel: "MINOR",
        },
        channelNames: [],
        groupNames: [],
        rules: [],
        pointsX: [],
        pointsY: [],
    };

    // not getDefaultTdl(), always generate a new key
    static generateDefaultTdl = (type: string): Record<string, any> => {
        // defines type, widgetKey, and key
        const result = super.generateDefaultTdl(type);
        result.style = JSON.parse(JSON.stringify(this._defaultTdl.style));
        result.text = JSON.parse(JSON.stringify(this._defaultTdl.text));
        result.channelNames = JSON.parse(JSON.stringify(this._defaultTdl.channelNames));
        result.groupNames = JSON.parse(JSON.stringify(this._defaultTdl.groupNames));
        result.pointsX = JSON.parse(JSON.stringify(this._defaultTdl.pointsX));
        result.pointsY = JSON.parse(JSON.stringify(this._defaultTdl.pointsY));
        return result;
    };

    // defined in super class
    getTdlCopy(newKey: boolean = true): Record<string, any> {
        const result = super.getTdlCopy(newKey);
        result["pointsX"] = [];
        result["pointsY"] = [];

        const width = this.getStyle()["width"];
        const height = this.getStyle()["height"];
        for (let ii = 0; ii < this.getPointsRelativeX().length; ii++) {
            result["pointsX"].push(width * this.getPointsRelativeX()[ii]);
            result["pointsY"].push(height * this.getPointsRelativeY()[ii]);
        }
        return result;
    }
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

    getPointsRelativeX = (): number[] => {
        return this._pointsRelativeX;
    };
    getPointsRelativeY = (): number[] => {
        return this._pointsRelativeY;
    };

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
            this._sidebar = new PolylineSidebar(this);
        }
    }
}
