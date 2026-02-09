import * as React from "react";
import { MouseEvent } from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { GroupSelection2 } from "../../helperWidgets/GroupSelection/GroupSelection2";
import { PolylineSidebar } from "./PolylineSidebar";
import * as GlobalMethods from "../../../common/GlobalMethods";
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

    _rules: PolylineRules;

    /**
     * normalized relative positions of points inside this widget, the widget's width and height 
     * are used to normalized the value
     * 
     * they are the only representation of points in this class
     * 
     * using this representation, we can easily resize the widget
     */
    _pointsRelativeX: number[] = [];
    _pointsRelativeY: number[] = [];

    selectedPointIndex: number = -1;

    // minimum width or height of the widget
    readonly minSize: number = 5;

    constructor(widgetTdl: type_Polyline_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this.setReadWriteType("read");

        this._rules = new PolylineRules(this, widgetTdl);

        // resize the widget to contain the line
        const maxX = Math.max(...widgetTdl.pointsX);
        const maxY = Math.max(...widgetTdl.pointsY);
        const width = Math.max(maxX, this.minSize);
        const height = Math.max(maxY, this.minSize);
        this.getStyle()["width"] = width;
        this.getStyle()["height"] = height;

        // relative points X and Y
        const pointsX = widgetTdl.pointsX;
        const pointsY = widgetTdl.pointsY;
        for (let ii = 0; ii < Math.min(widgetTdl.pointsX.length, widgetTdl.pointsY.length); ii++) {
            this._pointsRelativeX.push(maxX <= 0 ? 0 : pointsX[ii] / width);
            this._pointsRelativeY.push(maxY <= 0 ? 0 : pointsY[ii] / height);
        }
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
                {this.showSidebar() ? this._sidebar?.getElement() : null}
            </ErrorBoundary>
        );
    };

    _ElementAreaRaw = ({ }: any): React.JSX.Element => {
        const outline = this._getElementAreaRawOutlineStyle();
        const position = "absolute";
        const overflow = "visible";
        const backgroundColor = this._getElementAreaRawBackgroundStyle();

        return (
            <div
                style={{
                    display: "inline-flex",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    position: position, // we must use absolute
                    overflow: overflow,
                    outline: outline,
                    backgroundColor: backgroundColor,
                }}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                <this._ElementLine></this._ElementLine>
            </div>
        );
    };

    _Element = React.memo(this._ElementRaw, () => this._useMemoedElement());
    _ElementArea = React.memo(this._ElementAreaRaw, () => this._useMemoedElement());

    _ElementLine = () => {
        const allText = this.getAllText();
        const smootherize = allText["smootherize"];

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
                    overflow: "visible",
                }}
            >
                {/* arrows */}
                <this._ElementArrows></this._ElementArrows>

                {/* line */}
                {smootherize ? (
                    <this._ElementLineSmootherized></this._ElementLineSmootherized>
                ) : (
                    <this._ElementLineSegments></this._ElementLineSegments>
                )}

                {this.selectedPointIndex === -1 ?
                    null :
                    this.isSelected() === false ?
                        null :
                        <circle
                            r={this.getAllText()["lineWidth"] + 3}
                            cx={this.calcPolylinePoint(this.selectedPointIndex).split(",")[0]}
                            cy={this.calcPolylinePoint(this.selectedPointIndex).split(",")[1]}
                            fill={"red"} />
                }

            </svg>
        );
    };

    _ElementArrows = () => {
        const widgetKey = this.getWidgetKey();
        const allText = this.getAllText();
        const length = allText["arrowLength"];
        const width = allText["arrowWidth"];

        return (
            <defs>
                <marker
                    id={`arrowTail-${widgetKey}`}
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
                        fill={`${this._getElementAreaRawShapeStyle()}`}
                    />
                </marker>
                <marker
                    id={`arrowHead-${widgetKey}`}
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
                        fill={`${this._getElementAreaRawShapeStyle()}`}
                    />
                </marker>
            </defs>

        )
    }

    /**
     * when the line is smootherized, it handles closed and non-closed cases
     */
    _ElementLineSmootherized = () => {
        const allText = this.getAllText();
        const widgetKey = this.getWidgetKey();

        // line
        const points = this.generateSmoothPolylinePoints();
        const lineClosed = allText["closed"];
        const lineWidth = allText["lineWidth"];
        const lineColor = this._getElementAreaRawShapeStyle();
        const dashArray = this.generateStrokeDasharray();

        // arrow
        const showArrowHead = allText["showArrowHead"];
        const showArrowTail = allText["showArrowTail"];
        const markerEnd = showArrowHead ? `url(#arrowTail-${widgetKey})` : "";
        const markerStart = showArrowTail ? `url(#arrowHead-${widgetKey})` : ""

        // fill
        const fill = allText["fill"];
        const fillColor = fill ? this._getElementAreaRawFillStyle() : "none";

        return (
            <path
                d={`${points} ${lineClosed ? " z" : ""}`}
                strokeWidth={lineWidth}
                stroke={lineColor}
                strokeDasharray={dashArray}
                markerEnd={markerEnd}
                markerStart={markerStart}
                strokeLinecap={"butt"}
                fill={fillColor}
            />
        )
    }
    /**
     * When line is not smootherized, and closed
     */
    _ElementLineSegments = () => {

        const allText = this.getAllText();
        const widgetKey = this.getWidgetKey();

        // if the line is closed
        const lineClosed = allText["closed"];

        // line
        const points = `${this.generatePolylinePoints()}`;
        const lineWidth = allText["lineWidth"];
        const lineColor = this._getElementAreaRawShapeStyle();
        const dashArray = this.generateStrokeDasharray();

        // arrow
        const showArrowHead = allText["showArrowHead"];
        const showArrowTail = allText["showArrowTail"];
        const markerEnd = showArrowHead ? `url(#arrowTail-${widgetKey})` : "";
        const markerStart = showArrowTail ? `url(#arrowHead-${widgetKey})` : "";

        // fill
        const fill = allText["fill"];
        const fillColor = fill ? this._getElementAreaRawFillStyle() : "none"

        if (lineClosed) {
            return (
                <polygon
                    points={points}
                    strokeWidth={lineWidth}
                    stroke={lineColor}
                    strokeDasharray={dashArray}
                    markerEnd={markerEnd}
                    markerStart={markerStart}
                    strokeLinecap={"butt"}
                    fill={fillColor}
                ></polygon>
            )
        } else {
            return (
                <polyline
                    points={points}
                    strokeWidth={lineWidth}
                    stroke={lineColor}
                    strokeDasharray={dashArray}
                    markerEnd={markerEnd}
                    markerStart={markerStart}
                    strokeLinecap={"butt"}
                    fill={fillColor}
                ></polyline>
            )
        }
    }

    /**
     * indicator for the selected point
     */
    _ElementSelectedPoint = () => {
        if (this.isSelected() === false) {
            return null;
        }

        if (g_widgets1.isEditing()) {
            return null;
        }

        if (this.selectedPointIndex < 0 || this.selectedPointIndex > this.getPointsRelativeX().length) {
            return null;
        }

        return (
            <circle
                r={this.getAllText()["lineWidth"] + 3}
                cx={this.calcPolylinePoint(this.selectedPointIndex).split(",")[0]}
                cy={this.calcPolylinePoint(this.selectedPointIndex).split(",")[1]}
                fill={"red"} />
        )
    }

    // -------------------- helper functions ----------------

    /**
     * generate a string that represents the line pattern
     */
    generateStrokeDasharray = () => {

        const allText = this.getAllText();
        const lineWidth = allText["lineWidth"];
        const lineStyle = allText["lineStyle"];

        switch (lineStyle) {
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

    /**
     * calculate one point coordinate (in unit of px) inside the widget
     */
    calcPolylinePoint = (ii: number): string => {
        const allStyle = this.getAllStyle();
        const width = allStyle["width"];
        const height = allStyle["height"];

        return `${width * this.getPointsRelativeX()[ii]},${height * this.getPointsRelativeY()[ii]}`;
    };


    /**
     * generate a long string that contains the X and Y coordinates of all points
     * 
     * the coordinates are the pixel locations inside the widget
     */
    generatePolylinePoints = (): string => {
        let result = "";

        const allStyle = this.getAllStyle();

        const width = allStyle["width"];
        const height = allStyle["height"];
        const pointsX = this.getPointsRelativeX();
        const pointsY = this.getPointsRelativeY();

        for (let ii = 0; ii < pointsX.length; ii++) {
            const x = width * pointsX[ii];
            const y = height * pointsY[ii];
            result = `${result} ${x},${y}`;
        }
        return result;
    };

    /**
     * generate a long string that contains the X and Y coordinates of all points
     * for smooth curve
     * 
     * the coordinates are the pixel locations inside the widget
     */
    generateSmoothPolylinePoints = (): string => {
        const allStyle = this.getAllStyle();
        const width = allStyle["width"];
        const height = allStyle["height"];

        const pointsX = [];
        const pointsY = [];
        for (let ii = 0; ii < this.getPointsRelativeX().length; ii++) {
            pointsX.push(this.getPointsRelativeX()[ii] * width);
            pointsY.push(this.getPointsRelativeY()[ii] * height);
        }
        return PolylineSmoother.resize(pointsX, pointsY, width, height);
    };

    /**
     * add a new point, the new points are described by global X and Y
     * 
     * the widget's top, left, width and height is changed if the new point is beyond the current widget
     * 
     * the relative normalized coordinates of points are changed if the widget's width or height is changed
     */
    updateWidgetAddPoint = (pointGlobalX: number, pointGlobalY: number, recordHistory: boolean = false) => {

        if (!g_widgets1.isEditing()) {
            return;
        }

        const style = this.getStyle();
        const pointX = pointGlobalX - style["left"];
        const pointY = pointGlobalY - style["top"];
        const width = style["width"];
        const height = style["height"];
        console.log(pointX, width, pointY, height)
        // x, resize the widget 
        if (pointX > width) {
            // if new point is on right side of widget
            const newWidth = pointX;
            this.getStyle()["width"] = newWidth;
            const ratio = width / newWidth;
            for (let ii = 0; ii < this.getPointsRelativeX().length; ii++) {
                this.getPointsRelativeX()[ii] = this.getPointsRelativeX()[ii] * ratio;
            }
            this.getPointsRelativeX().push(1);
        } else if (pointX < 0) {
            // if new point is on left side of widget
            this.getStyle()["left"] = this.getStyle()["left"] + pointX;
            const newWidth = width - pointX;
            this.getStyle()["width"] = newWidth;
            for (let ii = 0; ii < this.getPointsRelativeX().length; ii++) {
                this.getPointsRelativeX()[ii] = (this.getPointsRelativeX()[ii] * width - pointX) / newWidth;
            }
            this.getPointsRelativeX().push(0);
        } else {
            // new point is inside the widget
            this.getPointsRelativeX().push(pointX / width);
        }

        // y
        if (pointY > height) {
            const newHeight = pointY;
            this.getStyle()["height"] = newHeight;
            const ratio = height / newHeight;
            for (let ii = 0; ii < this.getPointsRelativeY().length; ii++) {
                this.getPointsRelativeY()[ii] = this.getPointsRelativeY()[ii] * ratio;
            }
            this.getPointsRelativeY().push(1);
        } else if (pointY < 0) {
            this.getStyle()["top"] = this.getStyle()["top"] + pointY;
            const newHeight = height - pointY;
            this.getStyle()["height"] = newHeight;
            for (let ii = 0; ii < this.getPointsRelativeY().length; ii++) {
                this.getPointsRelativeY()[ii] = (this.getPointsRelativeY()[ii] * height - pointY) / newHeight;
            }
            this.getPointsRelativeY().push(0);
        } else {
            this.getPointsRelativeY().push(pointY / height);
        }

        // history
        if (recordHistory) {
            const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
            history.registerAction();
        }

        // flush this widget
        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };

    /**
     * delete a point, this point is provided by index in the table
     * 
     * widget's left, top, width, and height may be changed if the point was at widget boundary
     * 
     * the relative normalized coordinates of points are changed if the widget's width or height is changed
     */
    updateWidgetRemovePoint = (index: number | undefined = undefined, recordHistory: boolean = false) => {

        if (!g_widgets1.isEditing()) {
            return;
        }

        // remove the last point
        if (index === undefined) {
            index = this.getPointsRelativeX().length - 1;
        }

        // index beyond range
        if (index < 0 || index > this.getPointsRelativeX().length) {
            return;
        }

        const style = this.getStyle();
        const width = style["width"];
        const height = style["height"];
        const left = style["left"];
        const top = style["top"];
        const pointRelativeX = this.getPointsRelativeX()[index];
        const pointRelativeY = this.getPointsRelativeY()[index];
        this.getPointsRelativeX().splice(index, 1);
        this.getPointsRelativeY().splice(index, 1);

        if (pointRelativeX >= 0.999999) {
            let newWidth = width * Math.max(...this.getPointsRelativeX());
            if (newWidth < this.minSize) {
                newWidth = this.minSize;
            }
            this.getStyle()["width"] = newWidth;
            const ratio = width / newWidth;
            for (let ii = 0; ii < this.getPointsRelativeX().length; ii++) {
                this.getPointsRelativeX()[ii] = this.getPointsRelativeX()[ii] * ratio;
            }
        } else if (pointRelativeX <= 0.000001) {
            let newWidth = width * (1 - Math.min(...this.getPointsRelativeX()));
            if (newWidth < this.minSize) {
                newWidth = this.minSize;
            }

            const newLeft = left + Math.min(...this.getPointsRelativeX()) * width;
            this.getStyle()["width"] = newWidth;
            this.getStyle()["left"] = newLeft;
            const minRelativeX = Math.min(...this.getPointsRelativeX());
            for (let ii = 0; ii < this.getPointsRelativeX().length; ii++) {
                this.getPointsRelativeX()[ii] = ((this.getPointsRelativeX()[ii] - minRelativeX) * width) / newWidth;
            }
        }

        if (pointRelativeY >= 0.999999) {
            let newHeight = height * Math.max(...this.getPointsRelativeY());
            if (newHeight < this.minSize) {
                newHeight = this.minSize;
            }

            this.getStyle()["height"] = newHeight;
            const ratio = height / newHeight;
            for (let ii = 0; ii < this.getPointsRelativeY().length; ii++) {
                this.getPointsRelativeY()[ii] = this.getPointsRelativeY()[ii] * ratio;
            }
        } else if (pointRelativeY <= 0.000001) {
            let newHeight = height * (1 - Math.min(...this.getPointsRelativeY()));
            if (newHeight < this.minSize) {
                newHeight = this.minSize;
            }
            const newTop = top + Math.min(...this.getPointsRelativeY()) * height;
            this.getStyle()["height"] = newHeight;
            this.getStyle()["top"] = newTop;
            const minRelativeY = Math.min(...this.getPointsRelativeY());

            for (let ii = 0; ii < this.getPointsRelativeY().length; ii++) {
                this.getPointsRelativeY()[ii] = ((this.getPointsRelativeY()[ii] - minRelativeY) * height) / newHeight;
            }
        }

        if (recordHistory) {
            const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
            history.registerAction();
        }

        // flush this widget
        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };

    // ---------------------- tdl ---------------------------

    static generateDefaultTdl = (): Record<string, any> => {

        const defaultTdl: type_Polyline_tdl = {
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
        defaultTdl["widgetKey"] = GlobalMethods.generateWidgetKey(defaultTdl["type"]);
        return JSON.parse(JSON.stringify(defaultTdl));
    };

    generateDefaultTdl: () => any = Polyline.generateDefaultTdl;

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

    getPointsRelativeX = (): number[] => {
        return this._pointsRelativeX;
    };

    getPointsRelativeY = (): number[] => {
        return this._pointsRelativeY;
    };

    // -------------------------- sidebar ---------------------------
    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new PolylineSidebar(this);
        }
    }
}
