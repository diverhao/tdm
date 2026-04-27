import * as GlobalMethods from "../../../common/GlobalMethods";
import { Channel_ACCESS_RIGHTS, GlobalVariables } from "../../../common/GlobalVariables";
import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { SlideButtonSidebar } from "./SlideButtonSidebar";
import { BaseWidgetRules } from "../BaseWidget/BaseWidgetRules";
import { SlideButtonRule } from "./SlideButtonRule";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { deepMerge } from "../../../common/GlobalMethods";
import { type_SlideButton_tdl, defaultSlideButtonTdl } from "../../../common/types/type_widget_tdl";


export class SlideButton extends BaseWidget {

    _rules: BaseWidgetRules;
    _itemNames: string[];
    _itemColors: string[];
    _itemValues: number[];

    constructor(widgetTdl: type_SlideButton_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this.setReadWriteType("write");

        const defaultTdl = this.generateDefaultTdl();
        this._itemNames = deepMerge(defaultTdl.itemNames, widgetTdl.itemNames);
        this._itemColors = deepMerge(defaultTdl.itemColors, widgetTdl.itemColors);
        this._itemValues = deepMerge(defaultTdl.itemValues, widgetTdl.itemValues);
        // ensure the same number of states
        const numStates = 2;
        this._itemNames.splice(numStates);
        this._itemColors.splice(numStates);
        this._itemValues.splice(numStates);

        this._rules = new BaseWidgetRules(this, widgetTdl, SlideButtonRule);
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
                    <this._ElementAreaRaw></this._ElementAreaRaw>
                    {this.showResizers() ? <this._ElementResizer /> : null}
                </div>
                {this.showSidebar() ? this.getSidebar()?.getElement() : null}
            </ErrorBoundary>
        );
    };

    _ElementAreaRaw = ({ }: any): React.JSX.Element => {
        const allText = this.getAllText();

        const whiteSpace = allText.wrapWord ? "normal" : "pre";
        const justifyContent = allText.horizontalAlign;
        const alignItems = allText.verticalAlign;
        const outline = this._getElementAreaRawOutlineStyle();

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
                    outline: outline,
                }}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                <this._ElementSlideButton></this._ElementSlideButton>
            </div>
        );
    };

    _Element = React.memo(this._ElementRaw, () => this._useMemoedElement());
    _ElementArea = React.memo(this._ElementAreaRaw, () => this._useMemoedElement());


    _ElementSlideButton = () => {
        const boxHeight = this.getAllText()["boxWidth"] * 0.54;
        const elementRef = React.useRef<HTMLDivElement>(null);
        const backgroundColor = this.calcItemColor();
        const buttonPosition = this.calcButtonPosition();
        const border = "solid 1px rgba(30,30,30,1)";
        const text = this.calcItemText();

        return (
            <div
                ref={elementRef}
                style={{
                    position: "relative",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
                onMouseEnter={(event) => this.hanldeMouseEnterWriteWidget(event, elementRef)}
                onMouseLeave={(event) => this.handleMouseLeaveWriteWidget(event, elementRef)}
            >
                {/* sliding area */}
                <div
                    onClick={(event) => {
                        this.handleMouseClick(event);
                    }}
                    style={{
                        width: this.getAllText()["boxWidth"],
                        height: boxHeight,
                        display: "inline-flex",
                        borderRadius: boxHeight / 2,
                        backgroundColor: backgroundColor,
                        flexDirection: "row",
                        justifyContent: buttonPosition,
                        alignItems: "center",
                        border: border,
                    }}
                >
                    {/* slide knob */}
                    <div
                        style={{
                            width: boxHeight,
                            height: boxHeight,
                            borderRadius: boxHeight / 2,
                            backgroundColor: "rgba(210,210,210,1)",
                            border: border,
                        }}
                    ></div>
                </div>
                {/* text */}
                <div>{text}</div>
            </div>
        );
    };

    // -------------------- helper functions ----------------

    calcButtonPosition = () => {
        const index = this.calcItemIndex();
        if (index === 0) {
            return "flex-start";
        } else if (index === 1) {
            return "flex-end";
        } else {
            return "center";
        }
    }

    /**
     * when the mouse is down or up on the button, do something
     */
    handleMouseClick = (event: React.MouseEvent<HTMLElement>) => {
        event.preventDefault();
        // left button only
        if (event.button !== 0) {
            return;
        }
        // do nothing during editing
        if (g_widgets1.isEditing()) {
            return;
        }
        // write permission
        if (this._getChannelAccessRight() < Channel_ACCESS_RIGHTS.READ_WRITE) {
            return;
        }

        const allText = this.getAllText();
        const itemValues = this.calcItemValues();
        const onValue = itemValues[1];
        const offValue = itemValues[0];
        let targetValue = onValue;

        let currentValue = this._getChannelValue(true);
        if (typeof currentValue !== "number") {
            return;
        }
        if (currentValue !== offValue) {
            currentValue = onValue;
        }

        if (currentValue === offValue) {
            targetValue = onValue;
        } else {
            targetValue = offValue;
        }

        const channelName = this.getChannelNames()[0];
        this.putChannelValue(channelName, targetValue);
    };

    // -------------------------- tdl -------------------------------

    static generateDefaultTdl = (): type_SlideButton_tdl => {
        const widgetKey = GlobalMethods.generateWidgetKey(defaultSlideButtonTdl.type);
        return structuredClone({
            ...defaultSlideButtonTdl,
            widgetKey: widgetKey,
        });
    };

    generateDefaultTdl: () => any = SlideButton.generateDefaultTdl;

    // overload
    getTdlCopy(newKey: boolean = true): Record<string, any> {
        const result = super.getTdlCopy(newKey);
        result["itemColors"] = structuredClone(this.getItemColors());
        result["itemNames"] = structuredClone(this.getItemNames());
        result["itemValues"] = structuredClone(this.getItemValues());
        return result;
    }
    // --------------------- getters -------------------------

    // override
    getItemNames() {
        return this._itemNames;
    };
    getItemColors() {
        return this._itemColors;
    };
    getItemValues() {
        return this._itemValues;
    };

    // -------------------------- sidebar ---------------------------
    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new SlideButtonSidebar(this);
        }
    }
}
