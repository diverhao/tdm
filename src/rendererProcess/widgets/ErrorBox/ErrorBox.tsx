import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import * as GlobalMethods from "../../../common/GlobalMethods";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { defaultErrorBoxTdl, type_ErrorBox_tdl } from "../../../common/types/type_widget_tdl";
import { ErrorBoxSidebar } from "./ErrorBoxSidebar";

export class ErrorBox extends BaseWidget {

    private readonly _originalTdl: Record<string, any> = {};

    constructor(widgetTdl: type_ErrorBox_tdl) {
        super(widgetTdl);

        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this._originalTdl = widgetTdl["originalTdl"];
        this.updateGeometry();
        this.setReadWriteType("read");
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
        );
    };

    _ElementAreaRaw = ({ }: any): React.JSX.Element => {

        const whiteSpace = "normal";
        const justifyContent = "center";
        const alignItems = "center";
        // const outline = "solid 1px rgba(0,0,0,1)";
        const border = "solid 1px rgba(0,0,0,1)";
        const color = "rgba(255,255,255,1)";
        const backgroundColor = "rgba(255,0,0,1)";

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
                    border: border,
                    color: color,
                    backgroundColor: backgroundColor,
                }}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                {this.getMessage()}
            </div>
        );
    };

    _Element = React.memo(this._ElementRaw, () => this._useMemoedElement());
    _ElementArea = React.memo(this._ElementAreaRaw, () => this._useMemoedElement());

    // -------------------------- helpers ---------------------------

    getOriginalTdl = () => {
        return this._originalTdl;
    }

    getOriginalWidgetKey = () => {
        return this.getOriginalTdl()["widgetKey"];
    }

    getOriginalType = () => {
        return this.getOriginalTdl()["type"];
    }

    getOriginalStyle = () => {
        return this.getOriginalTdl()["style"];
    }

    getMessage = () => {
        const type = this.getOriginalType();
        const widgetKey = this.getOriginalWidgetKey();
        return `There is an error in this ${widgetKey}.`
    }

    updateGeometry = () => {
        const style = this.getStyle();
        const originalStyle = this.getOriginalStyle();
        if (originalStyle === undefined) {
            return;
        }
        const originalLeft = originalStyle["left"];
        const originalTop = originalStyle["top"];
        const originalWidth = originalStyle["width"];
        const originalHeight = originalStyle["height"];
        const originalTransform = originalStyle["transform"];

        if (typeof originalLeft === "number") {
            style["left"] = originalLeft;
        }
        if (typeof originalTop === "number") {
            style["top"] = originalTop;
        }
        if (typeof originalWidth === "number") {
            style["width"] = originalWidth;
        }
        if (typeof originalHeight === "number") {
            style["height"] = originalHeight;
        }
        if (typeof originalTransform === "string") {
            style["transform"] = originalTransform;
        }
    }

    // -------------------------- tdl -------------------------------

    static generateDefaultTdl = (): type_ErrorBox_tdl => {
        const widgetKey = GlobalMethods.generateWidgetKey(defaultErrorBoxTdl.type);
        return structuredClone({
            ...defaultErrorBoxTdl,
            widgetKey: widgetKey,
        });

    };

    generateDefaultTdl: () => any = ErrorBox.generateDefaultTdl;

    getTdlCopy(newKey: boolean = false): Record<string, any> {
        const result = structuredClone(this.getOriginalTdl());
        result["style"] = {...result.style, 
            left: this.getStyle()["left"],
            top: this.getStyle()["top"],
            width: this.getStyle()["width"],
            height: this.getStyle()["height"],
            transform: this.getStyle()["transform"],
        }
        return result;
    }

    // --------------------- sidebar --------------------------

    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new ErrorBoxSidebar(this);
        }
    };
}
