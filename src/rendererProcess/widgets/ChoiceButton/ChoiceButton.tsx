import * as GlobalMethods from "../../../common/GlobalMethods";
import { GlobalVariables } from "../../../common/GlobalVariables";
import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { ChoiceButtonSidebar } from "./ChoiceButtonSidebar";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { ChoiceButtonRules } from "./ChoiceButtonRules";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { Log } from "../../../common/Log";

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
    // _itemLabels: string[];
    // _itemValues: (number | string | number[] | string[] | undefined)[];
    // _itemNamesFromChannel: string[];
    // _itemValuesFromChannel: (number | string | number[] | string[] | undefined)[];
    _itemNames: string[];
    _itemColors: string[];
    _itemValues: number[];


    channelItemsUpdated: boolean = false;
    _rules: ChoiceButtonRules;

    constructor(widgetTdl: type_ChoiceButton_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this.setReadWriteType("write");

        // items
        this._itemLabels = JSON.parse(JSON.stringify(widgetTdl.itemLabels));
        this._itemValues = JSON.parse(JSON.stringify(widgetTdl.itemValues));

        if (this._itemLabels.length === 0) {
            this._itemLabels.push("Label 0");
        }
        if (this._itemValues.length === 0) {
            this._itemValues.push(0);
        }

        this._itemNamesFromChannel = [];
        this._itemValuesFromChannel = [];

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
                }}
                // title={"tooltip"}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                <this._ElementChoiceButton></this._ElementChoiceButton>
            </div>
        );
    };

    updateItemsFromChannel = (channelName: string) => {
        let itemNames = this.getItemLabels();
        let itemValues = this.getItemValues();

        if (!g_widgets1.isEditing()) {
            if (this.channelItemsUpdated === false) {
                try {
                    const channel = g_widgets1.getTcaChannel(channelName);
                    let strs = channel.getEnumChoices();
                    let numberOfStringsUsed = channel.getNumerOfStringsUsed();
                    // if (channel.getChannelName().startsWith("pva") && channel.isEnumType()) {
                    //     strs = channel.getEnumChoices();
                    //     numberOfStringsUsed = strs.length;
                    // }

                    if (this.getAllText()["useChannelItems"] === true && strs.length > 0 && numberOfStringsUsed !== undefined) {
                        // update itemNames and itemValues
                        this._itemNamesFromChannel.length = 0;
                        this._itemValuesFromChannel.length = 0;
                        for (let ii = 0; ii < numberOfStringsUsed; ii++) {
                            this._itemNamesFromChannel.push(strs[ii]);
                            this._itemValuesFromChannel.push(ii);
                        }
                        itemNames = this._itemNamesFromChannel;
                        itemValues = this._itemValuesFromChannel;
                        this.channelItemsUpdated = true;
                    }
                } catch (e) {
                    Log.error(e);
                    return [itemNames, itemValues];
                }
            } else {
                // display window is operating, and the channel items are upated, then simply assign
                itemNames = this._itemNamesFromChannel;
                itemValues = this._itemValuesFromChannel;
            }
        } else {
            this._itemNamesFromChannel.length = 0;
            this._itemValuesFromChannel.length = 0;
            this.channelItemsUpdated = false;
        }
        return [itemNames, itemValues];
    };

    _ElementChoiceButton = () => {
        const shadowWidth = 2;
        const itemMarginWidth = 1;
        const elementRef = React.useRef<any>(null);

        const channelName = this.getChannelNames()[0];

        const [itemNames, itemValues] = this.updateItemsFromChannel(channelName);
        console.log("++++++++++++++++++++++", channelName, itemNames, itemValues)
        const calcItemWidth = () => {
            if (this.getAllText()["appearance"] === "traditional") {
                if (this.getAllText()["direction"] === "horizontal") {
                    return Math.floor(1 / itemNames.length * this.getAllStyle()["width"] - 2 * shadowWidth - 2 * itemMarginWidth);
                } else {
                    return this.getAllStyle()["width"] - 2 * shadowWidth - 2 * itemMarginWidth;
                }
            } else {
                if (this.getAllText()["direction"] === "horizontal") {
                    return Math.floor(1 / itemNames.length * this.getAllStyle()["width"] - 2 * itemMarginWidth);
                } else {
                    return this.getAllStyle()["width"] - 2 * itemMarginWidth;
                }
            }
        }
        const calcItemHeight = () => {
            if (this.getAllText()["appearance"] === "traditional") {
                if (this.getAllText()["direction"] === "horizontal") {
                    return this.getAllStyle()["height"] - 2 * shadowWidth - 2 * itemMarginWidth;
                } else {
                    return Math.floor(1 / itemNames.length * this.getAllStyle()["height"] - 2 * shadowWidth - 2 * itemMarginWidth);
                }
            } else {
                if (this.getAllText()["direction"] === "horizontal") {
                    return this.getAllStyle()["height"] - 2 * itemMarginWidth;
                } else {
                    return Math.floor(1 / itemNames.length * this.getAllStyle()["height"] - 2 * itemMarginWidth);
                }
            }
        }

        const highlightColor = (this.getAllText()["invisibleInOperation"] === true && g_widgets1.isEditing() === false) ? "rgba(0,0,0,0)" : "rgba(255,255,255,1)";
        const shadowColor = (this.getAllText()["invisibleInOperation"] === true && g_widgets1.isEditing() === false) ? "rgba(0,0,0,0)" : "rgba(100,100,100,1)";
        const calcBorderBottomRight = (isSelected: boolean) => {
            if (this.getAllText()["appearance"] === "traditional") {
                if (isSelected) {
                    return `solid ${shadowWidth}px ${highlightColor}`;
                } else {
                    return `solid ${shadowWidth}px ${shadowColor}`;
                }
            } else {
                return "none";
            }
        }

        const calcBorderTopLeft = (isSelected: boolean) => {
            if (this.getAllText()["appearance"] === "traditional") {
                if (isSelected) {
                    return `solid ${shadowWidth}px ${shadowColor}`;
                } else {
                    return `solid ${shadowWidth}px ${highlightColor}`;
                }
            } else {
                return "none";
            }
        }

        const calcOutline = (isSelected: boolean) => {
            if (this.getAllText()["appearance"] === "traditional") {
                if (this.getAllText()["invisibleInOperation"] === true && g_widgets1.isEditing() === false) {
                    return "none";
                } else {
                    return "solid 1px rgba(100, 100, 100, 0.5)";
                }
            } else {
                return "none";
            }
        }


        return (
            <div
                ref={elementRef}
                style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    backgroundColor: "rgba(0,0,0,0)",
                }}
                // outline is not affected by opacity of the ElementBody
                onMouseEnter={(event: any) => {
                    if (!g_widgets1.isEditing()) {
                        if (elementRef.current !== null) {
                            elementRef.current.style["outlineStyle"] = "solid";
                            elementRef.current.style["outlineWidth"] = "3px";
                            elementRef.current.style["outlineColor"] = "rgba(105,105,105,1)";
                            if (this._getChannelAccessRight() < 1.5) {
                                elementRef.current.style["cursor"] = "not-allowed";
                            } else {
                                elementRef.current.style["cursor"] = "pointer";
                            }
                        }
                    }
                }}
                onMouseLeave={(event: any) => {
                    if (!g_widgets1.isEditing()) {
                        if (elementRef.current !== null) {
                            // elementRef.current.style["outlineStyle"] = this.getAllStyle()["outlineStyle"];
                            // elementRef.current.style["outlineWidth"] = this.getAllStyle()["outlineWidth"];
                            // elementRef.current.style["outlineColor"] = this.getAllStyle()["outlineColor"];
                            elementRef.current.style["outline"] = "none";
                            elementRef.current.style["cursor"] = "default";
                        }
                    }
                }}
            >
                <div
                    style={{
                        display: "inline-flex",
                        overflow: "visible",
                        flexDirection: this.getAllText()["direction"] === "horizontal" ? "row" : "column",
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        opacity: this.getAllText()["invisibleInOperation"] === true && !g_widgets1.isEditing() ? 0 : 1,
                    }}
                >
                    {(itemNames as string[]).map((name: string, index: number) => {
                        let isSelected = false;
                        if (!g_widgets1.isEditing()) {
                            try {
                                const channel = g_widgets1.getTcaChannel(channelName);
                                if (channel.getProtocol() === "pva") {
                                    const dbrData = channel.getDbrData() as any;
                                    if (dbrData["value"]["index"] === index) {
                                        isSelected = true;
                                    }
                                } else {
                                    if (channel.getDbrData()["value"] === itemValues[index]) {
                                        isSelected = true;
                                    }

                                }
                            } catch (e) {
                                Log.error(e);
                            }
                        }

                        return (
                            <div
                                style={{
                                    margin: itemMarginWidth,
                                    display: "inline-flex",
                                    position: "relative",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    outline: calcOutline(isSelected),
                                    borderRight: calcBorderBottomRight(isSelected),
                                    borderBottom: calcBorderBottomRight(isSelected),
                                    borderLeft: calcBorderTopLeft(isSelected),
                                    borderTop: calcBorderTopLeft(isSelected),
                                    width: calcItemWidth(),
                                    height: calcItemHeight(),
                                    color: isSelected
                                        ? this._getElementAreaRawTextStyle()
                                        : this.getAllStyle()["color"],
                                    backgroundColor: isSelected
                                        // ? this.getAllText()["selectedBackgroundColor"]
                                        ? this._getElementAreaRawSelectedBackgroundStyle()
                                        : this.getAllText()["unselectedBackgroundColor"],
                                    borderRadius: this.getAllText()["appearance"] === "traditional" ? 0 : 3,
                                    overflow: "visible",
                                    whiteSpace: this.getAllText().wrapWord ? "normal" : "pre",
                                }}
                                onClick={(event: any) => {
                                    this.handleClick(event, index);
                                }}
                            >
                                {name}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    handleClick = (event: any, index: number) => {
        event.preventDefault();
        const channelName = this.getChannelNames()[0];
        if (g_widgets1.isEditing()) {
            return;
        } else {
            if (this._getChannelAccessRight() < 1.5) {
                return;
            }
            // write value
            let value = this.getItemValues()[index];
            if (this.getAllText()["useChannelItems"] === true) {
                value = this._itemValuesFromChannel[index];
            }
            this.putChannelValue(this.getChannelNames()[0], value);
        }
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
                useChannelItems: true,
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
            },
            channelNames: [],
            groupNames: [],
            rules: [],
            // could be more than two labels
            itemLabels: ["Label 0", "Label 1"],
            itemValues: [0, 1],
        };
        defaultTdl["widgetKey"] = GlobalMethods.generateWidgetKey(defaultTdl["type"]);
        return JSON.parse(JSON.stringify(defaultTdl));
    };

    generateDefaultTdl: () => any = ChoiceButton.generateDefaultTdl;

    getTdlCopy(newKey: boolean = true): Record<string, any> {
        const result = super.getTdlCopy(newKey);
        result["itemValues"] = JSON.parse(JSON.stringify(this.getItemValues()));
        result["itemLabels"] = JSON.parse(JSON.stringify(this.getItemLabels()));
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
