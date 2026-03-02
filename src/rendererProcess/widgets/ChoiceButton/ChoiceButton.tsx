import * as GlobalMethods from "../../../common/GlobalMethods";
import { Channel_ACCESS_RIGHTS, GlobalVariables } from "../../../common/GlobalVariables";
import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { ChoiceButtonSidebar } from "./ChoiceButtonSidebar";
import { BaseWidgetRules } from "../BaseWidget/BaseWidgetRules";
import { ChoiceButtonRule } from "./ChoiceButtonRule";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { Log } from "../../../common/Log";
import { deepMerge } from "../../../common/GlobalMethods";
import { type_ChoiceButton_tdl, defaultChoiceButtonTdl } from "../../../common/types/type_widget_tdl";

export class ChoiceButton extends BaseWidget {

    _itemNames: string[];
    _itemColors: string[];
    _itemValues: number[];

    _rules: BaseWidgetRules;

    constructor(widgetTdl: type_ChoiceButton_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this.setReadWriteType("write");


        const defaultTdl = this.generateDefaultTdl();
        this._itemNames = deepMerge(widgetTdl.itemNames, defaultTdl.itemNames);
        this._itemColors = deepMerge(widgetTdl.itemColors, defaultTdl.itemColors);
        this._itemValues = deepMerge(widgetTdl.itemValues, defaultTdl.itemValues);
        // ensure the same number of states
        const numStates = Math.min(this._itemNames.length, this._itemColors.length, this._itemValues.length);
        this._itemNames.splice(numStates);
        this._itemColors.splice(numStates);
        this._itemValues.splice(numStates);

        this._rules = new BaseWidgetRules(this, widgetTdl, ChoiceButtonRule);
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

    _ElementAreaRaw = (): React.JSX.Element => {

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
                <this._ElementChoiceButton></this._ElementChoiceButton>
            </div>
        );
    };

    _ElementChoiceButton = () => {
        const elementRef = React.useRef<HTMLDivElement>(null);

        const allText = this.getAllText();
        const direction = allText["direction"];

        const itemNames = this.calcItemTexts();
        const flexDirection = direction === "horizontal" ? "row" : "column";

        return (
            <div
                ref={elementRef}
                style={{
                    display: "inline-flex",
                    // flexDirection: "row",
                    flexDirection: flexDirection,
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    backgroundColor: "rgba(0,0,0,0)",
                }}
                onMouseEnter={(event) => this.hanldeMouseEnterWriteWidget(event, elementRef)}
                onMouseLeave={(event) => this.handleMouseLeaveWriteWidget(event, elementRef)}
            >
                {itemNames.map((name: string, index: number) => {

                    return (
                        <this._ElementChoiceButtonItem
                            name={name}
                            index={index}
                        ></this._ElementChoiceButtonItem>
                    );
                })}
            </div>
        );
    };

    _ElementChoiceButtonItem = ({ name, index }: any) => {

        let isSelected = this.calcIsSelected(index);
        const itemMarginWidth = 1;

        const outline = this.calcOutline();
        const width = this.calcItemWidth();
        const height = this.calcItemHeight();
        const allStyle = this.getAllStyle();
        const allText = this.getAllText();
        const styleColor = allStyle["color"];
        const unselectedBackgroundColor = allText["unselectedBackgroundColor"];
        const appearance = allText["appearance"];

        // calculate the style for each item
        const threeDButtonStyle = this.get3dButtonStyle(isSelected);
        // if the item is selected, honor the severity color
        const color = isSelected
            ? this._getElementAreaRawTextStyle()
            : styleColor;
        const backgroundColor = isSelected
            ? this._getElementAreaRawSelectedBackgroundStyle()
            : unselectedBackgroundColor;
        const borderRadius = appearance === "traditional" ? 0 : 3;
        const whiteSpace = this.getAllText().wrapWord ? "normal" : "pre";

        return (
            <div
                style={{
                    margin: itemMarginWidth,
                    display: "inline-flex",
                    position: "relative",
                    alignItems: "center",
                    justifyContent: "center",
                    color: color,
                    backgroundColor: backgroundColor,
                    borderRadius: borderRadius,
                    overflow: "visible",
                    whiteSpace: whiteSpace,
                    outline: outline,
                    ...threeDButtonStyle, // width and height are changed below
                    width: width,
                    height: height,
                }}
                onClick={(event) => {
                    this.handleMouseClick(event, index);
                }}
            >
                {name}
            </div>
        )
    }

    _Element = React.memo(this._ElementRaw, () => this._useMemoedElement());
    _ElementArea = React.memo(this._ElementAreaRaw, () => this._useMemoedElement());

    // -------------------- helper functions ----------------

    /**
     * when the mouse is down or up on the button, do something
     */
    handleMouseClick = (event: React.MouseEvent<HTMLElement>, index: number) => {
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

        const itemValues = this.calcItemValues();
        const itemValue = itemValues[index];
        if (typeof itemValue !== "number") {
            return;
        }

        const channelName = this.getChannelNames()[0];
        this.putChannelValue(channelName, itemValue);
    };

    calcIsSelected = (index: number) => {
        const selectedIndex = this.calcItemIndex();
        return index === selectedIndex;
    }

    calcItemWidth = () => {
        const itemNames = this.calcItemTexts();
        const shadowWidth = 2;
        const itemMarginWidth = 1;
        const allText = this.getAllText();
        const allStyle = this.getAllStyle();
        const appearance = allText["appearance"];
        const direction = allText["direction"];
        const width = allStyle["width"];
        const height = allStyle["height"];

        if (appearance === "traditional") {
            if (direction === "horizontal") {
                return Math.floor(1 / itemNames.length * width - 2 * shadowWidth - 2 * itemMarginWidth);
            } else {
                return width - 2 * shadowWidth - 2 * itemMarginWidth;
            }
        } else {
            if (direction === "horizontal") {
                return Math.floor(1 / itemNames.length * width - 2 * itemMarginWidth);
            } else {
                return width - 2 * itemMarginWidth;
            }
        }
    }
    calcItemHeight = () => {
        const itemNames = this.calcItemTexts();
        const shadowWidth = 2;
        const itemMarginWidth = 1;
        const allText = this.getAllText();
        const allStyle = this.getAllStyle();
        const appearance = allText["appearance"];
        const direction = allText["direction"];
        const width = allStyle["width"];
        const height = allStyle["height"];

        if (appearance === "traditional") {
            if (direction === "horizontal") {
                return height - 2 * shadowWidth - 2 * itemMarginWidth;
            } else {
                return Math.floor(1 / itemNames.length * height - 2 * shadowWidth - 2 * itemMarginWidth);
            }
        } else {
            if (direction === "horizontal") {
                return height - 2 * itemMarginWidth;
            } else {
                return Math.floor(1 / itemNames.length * height - 2 * itemMarginWidth);
            }
        }
    }

    calcOutline = () => {
        const allText = this.getAllText();
        const appearance = allText["appearance"];
        if (appearance === "traditional") {
            return "solid 1px rgba(100, 100, 100, 0.5)";
        } else {
            return "none";
        }
    }

    // -------------------------- tdl -------------------------------

    static generateDefaultTdl = (): type_ChoiceButton_tdl => {
        const widgetKey = GlobalMethods.generateWidgetKey(defaultChoiceButtonTdl.type);
        return structuredClone({
            ...defaultChoiceButtonTdl,
            widgetKey: widgetKey,
        });
    };

    generateDefaultTdl: () => any = ChoiceButton.generateDefaultTdl;

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
            this._sidebar = new ChoiceButtonSidebar(this);
        }
    }
}
