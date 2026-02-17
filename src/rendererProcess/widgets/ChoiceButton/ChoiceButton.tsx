import * as GlobalMethods from "../../../common/GlobalMethods";
import { Channel_ACCESS_RIGHTS, GlobalVariables } from "../../../common/GlobalVariables";
import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { ChoiceButtonSidebar } from "./ChoiceButtonSidebar";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { ChoiceButtonRules } from "./ChoiceButtonRules";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { Log } from "../../../common/Log";
import { deepMerge } from "../../../common/GlobalMethods";

export type type_ChoiceButton_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
    // Slide Button specific
    itemNames: string[];
    itemColors: string[];
    itemValues: number[];
};

export class ChoiceButton extends BaseWidget {

    _itemNames: string[];
    _itemColors: string[];
    _itemValues: number[];

    _rules: ChoiceButtonRules;

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

        this._rules = new ChoiceButtonRules(this, widgetTdl);
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
        const elementRef = React.useRef<any>(null);

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
                onMouseEnter={(event: any) => this.hanldeMouseEnterWriteWidget(event, elementRef)}
                onMouseLeave={(event: any) => this.handleMouseLeaveWriteWidget(event, elementRef)}
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
                onClick={(event: any) => {
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
    handleMouseClick = (event: any, index: number) => {
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

    static generateDefaultTdl = () => {

        const defaultTdl: type_ChoiceButton_tdl = {
            type: "ChoiceButton",
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
                backgroundColor: "rgba(128, 255, 255, 0)",
                // angle
                transform: "rotate(0deg)",
                // font
                color: "rgba(0,0,0,1)",
                fontFamily: GlobalVariables.defaultFontFamily,
                fontSize: GlobalVariables.defaultFontSize,
                fontStyle: GlobalVariables.defaultFontStyle,
                fontWeight: GlobalVariables.defaultFontWeight,
                // border, it is different from the alarmBorder below
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
                horizontalAlign: "flex-start",
                verticalAlign: "flex-start",
                wrapWord: false,
                showUnit: false,
                alarmBorder: true,
                // colors
                selectedBackgroundColor: "rgba(218, 218, 218, 1)",
                unselectedBackgroundColor: "rgba(200, 200, 200, 1)",
                invisibleInOperation: false,
                direction: "horizontal",
                // "contemporary" | "traditional"
                appearance: "traditional",
                alarmText: false,
                alarmBackground: false,
                alarmLevel: "MINOR",
                confirmOnWrite: false,
                confirmOnWriteUsePassword: false,
                confirmOnWritePassword: "",

                // discrete states
                bit: -1,
                useChannelItems: false,
                fallbackColor: "rgba(255,0,255,1)",
                fallbackText: "Wrong state",
            },
            channelNames: [],
            groupNames: [],
            rules: [],
            // discrete states
            itemNames: ["False", "True"],
            itemValues: [0, 1],
            itemColors: ["rgba(210, 210, 210, 1)", "rgba(0, 255, 0, 1)"],
        };
        defaultTdl["widgetKey"] = GlobalMethods.generateWidgetKey(defaultTdl["type"]);
        return JSON.parse(JSON.stringify(defaultTdl));
    };

    generateDefaultTdl: () => any = ChoiceButton.generateDefaultTdl;

    getTdlCopy(newKey: boolean = true): Record<string, any> {
        const result = super.getTdlCopy(newKey);
        result["itemColors"] = JSON.parse(JSON.stringify(this.getItemColors()));
        result["itemNames"] = JSON.parse(JSON.stringify(this.getItemNames()));
        result["itemValues"] = JSON.parse(JSON.stringify(this.getItemValues()));
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
