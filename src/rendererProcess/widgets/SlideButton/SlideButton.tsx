import * as GlobalMethods from "../../../common/GlobalMethods";
import { Channel_ACCESS_RIGHTS, GlobalVariables } from "../../../common/GlobalVariables";
import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { SlideButtonSidebar } from "./SlideButtonSidebar";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { SlideButtonRules } from "./SlideButtonRules";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { deepMerge } from "../../../common/GlobalMethods";

export type type_SlideButton_tdl = {
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

export class SlideButton extends BaseWidget {

    _rules: SlideButtonRules;
    _itemNames: string[];
    _itemColors: string[];
    _itemValues: number[];

    constructor(widgetTdl: type_SlideButton_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this.setReadWriteType("write");

        const defaultTdl = this.generateDefaultTdl();
        this._itemNames = deepMerge(widgetTdl.itemNames, defaultTdl.itemNames);
        this._itemColors = deepMerge(widgetTdl.itemColors, defaultTdl.itemColors);
        this._itemValues = deepMerge(widgetTdl.itemValues, defaultTdl.itemValues);
        // ensure the same number of states
        const numStates = 2;
        this._itemNames.splice(numStates);
        this._itemColors.splice(numStates);
        this._itemValues.splice(numStates);

        this._rules = new SlideButtonRules(this, widgetTdl);
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
        const boxHeight = this.getAllText()["boxWidth"] / 3;
        const elementRef = React.useRef<any>(null);
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
                onMouseEnter={(event: any) => this.hanldeMouseEnterWriteWidget(event, elementRef)}
                onMouseLeave={(event: any) => this.handleMouseLeaveWriteWidget(event, elementRef)}
            >
                {/* sliding area */}
                <div
                    onClick={(event: any) => {
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
    handleMouseClick = (event: any) => {
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

    static generateDefaultTdl = () => {

        const defaultTdl: type_SlideButton_tdl = {
            type: "SlideButton",
            widgetKey: "", // "key" is a reserved keyword
            key: "",
            // the style for outmost div
            // these properties are explicitly defined in style because they are
            // (1) different from default CSS settings, or
            // (2) they may be modified
            style: {
                position: "absolute",
                display: "inline-flex",
                backgroundColor: "rgba(128, 255, 255, 0)",
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
                horizontalAlign: "flex-start",
                verticalAlign: "flex-start",
                wrapWord: false,
                showUnit: false,
                alarmBorder: true,
                boxWidth: 100,

                text: "Label",
                invisibleInOperation: false,
                confirmOnWrite: false,
                confirmOnWriteUsePassword: false,
                confirmOnWritePassword: "",
                // discrete states
                bit: 0,
                useChannelItems: false,
                fallbackColor: "rgba(255,0,255,1)",
                fallbackText: "Wrong state",
            },
            channelNames: [],
            groupNames: [],
            rules: [],
            itemNames: ["False", "True"],
            itemValues: [0, 1],
            itemColors: ["rgba(210, 210, 210, 1)", "rgba(0, 255, 0, 1)"],
        };
        defaultTdl["widgetKey"] = GlobalMethods.generateWidgetKey(defaultTdl["type"]);
        return JSON.parse(JSON.stringify(defaultTdl));
    };

    generateDefaultTdl: () => any = SlideButton.generateDefaultTdl;

    // overload
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
            this._sidebar = new SlideButtonSidebar(this);
        }
    }
}
