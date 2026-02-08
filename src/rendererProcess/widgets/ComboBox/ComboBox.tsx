import { GlobalVariables } from "../../../common/GlobalVariables";
import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { ComboBoxSidebar } from "./ComboBoxSidebar";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { ComboBoxRules } from "./ComboBoxRules";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { Log } from "../../../common/Log";

export type type_ComboBox_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
    itemLabels: string[];
    itemValues: (number | string | number[] | string[] | undefined)[];
};

export class ComboBox extends BaseWidget {
    _itemLabels: string[];
    _itemLabelsFromChannel: string[] = [];
    // _itemPictures: string[];
    _itemValues: (number | string | number[] | string[] | undefined)[];
    // _itemValuesFromChannel: number[] = [];

    _itemNamesFromChannel: string[];
    _itemValuesFromChannel: (number | string | number[] | string[] | undefined)[];

    // _itemColors: string[];
    channelItemsUpdated: boolean = false;

    _rules: ComboBoxRules;

    constructor(widgetTdl: type_ComboBox_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this.setReadWriteType("write");

        // items
        this._itemLabels = JSON.parse(JSON.stringify(widgetTdl.itemLabels));
        this._itemValues = JSON.parse(JSON.stringify(widgetTdl.itemValues));

        if (this._itemLabels.length === 0) {
            this._itemLabels.push("item-0");
        }
        if (this._itemValues.length === 0) {
            this._itemValues.push(0);
        }

        this._itemNamesFromChannel = [];
        this._itemValuesFromChannel = [];


        this._rules = new ComboBoxRules(this, widgetTdl);

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
                    // justifyContent: this.getAllText().horizontalAlign,
                    // alignItems: this.getAllText().verticalAlign,
                    fontFamily: this.getAllStyle().fontFamily,
                    fontSize: this.getAllStyle().fontSize,
                    fontStyle: this.getAllStyle().fontStyle,
                    outline: this._getElementAreaRawOutlineStyle(),
                    backgroundColor: this.getAllText()["invisibleInOperation"] ? "rgba(0,0,0,0)" : this._getElementAreaRawBackgroundStyle(),
                }}
                // title={"tooltip"}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                <this._ElementComboBox></this._ElementComboBox>
            </div>
        );
    };

    _ElementComboBox = () => {
        // const elementRef = React.useRef<any>(null);


        // this.updateItemsFromChannel1();

        // let tmpLabels = this.getItemLabels();
        // let tmpValues = this.getItemValues();
        // if (this.getAllText()["useChannelItems"] && this._itemLabelsFromChannel.length > 0) {
        // 	tmpLabels = this._itemLabelsFromChannel;
        // 	tmpValues = this._itemValuesFromChannel;
        // }

        // ------------------------------

        // let thereIsOneOptionSelected = false;
        // const shadowWidth = 2;
        // const itemMarginWidth = 1;
        const elementRef = React.useRef<any>(null);

        const channelName = this.getChannelNames()[0];

        const [itemNames, itemValues] = this.updateItemsFromChannel(channelName);
        console.log("itemNames ====================", channelName, itemNames, itemValues)

        return (
            <div
                ref={elementRef}
                style={{
                    display: "inline-flex",
                    width: "100%",
                    height: "100%",
                    backgroundColor: "rgba(0,0,0,0)",
                }}
                onMouseEnter={(event: any) => {
                    event.preventDefault();
                    if (!g_widgets1.isEditing() && elementRef.current !== null) {
                        elementRef.current.style["outlineStyle"] = "solid";
                        elementRef.current.style["outlineWidth"] = "3px";
                        elementRef.current.style["outlineColor"] = "rgba(105,105,105,1)";
                        // the cursor won't become "pointer"
                        if (this._getChannelAccessRight() < 1.5) {
                            elementRef.current.style["cursor"] = "not-allowed";
                        } else {
                            elementRef.current.style["cursor"] = "pointer";
                        }
                    }
                }}
                // do not use onMouseOut
                onMouseLeave={(event: any) => {
                    event.preventDefault();
                    if (!g_widgets1.isEditing() && elementRef.current !== null) {
                        elementRef.current.style["outlineStyle"] = this.getAllStyle()["outlineStyle"];
                        elementRef.current.style["outlineWidth"] = this.getAllStyle()["outlineWidth"];
                        elementRef.current.style["outlineColor"] = this.getAllStyle()["outlineColor"];
                        elementRef.current.style["cursor"] = "default";
                    }
                }}
            >
                <form
                    style={{
                        display: "inline-flex",
                        flexDirection: "column",
                        justifyContent: "flex-start",
                        alignItems: "flex-start",
                        width: "100%",
                        height: "100%",
                        opacity: this.getAllText()["invisibleInOperation"] === true && !g_widgets1.isEditing() ? 0 : 1,
                        // make the dropdown selection transparent to mouse event (in particular mosue down)
                        // so that we won't control it if it is not writable
                        pointerEvents: this._getChannelAccessRight() < 1.5 ? "none" : "auto",
                    }}
                >
                    <select
                        style={{
                            // color: this.getAllStyle()["color"],
                            color: this._getElementAreaRawTextStyle(),
                            width: "100%",
                            height: "100%",
                            fontSize: this.getAllStyle()["fontSize"],
                            fontFamily: this.getAllStyle()["fontFamily"],
                            fontStyle: this.getAllStyle()["fontStyle"],
                            fontWeight: this.getAllStyle()["fontWeight"],
                            // backgroundColor: this.getAllText()["backgroundColor"],
                            backgroundColor: "rgba(0,0,0,0)",
                            outline: "none",
                            textAlignLast:
                                this.getAllText()["horizontalAlign"] === "flex-start"
                                    ? "left"
                                    : this.getAllText()["horizontalAlign"] === "flex-end"
                                        ? "right"
                                        : "center",
                            // textAlign: "right",
                        }}
                        onChange={(event: any) => {
                            this.handleChange(event);
                        }}
                        value={(() => {
                            if (!g_widgets1.isEditing()) {
                                try {
                                    const channel = g_widgets1.getTcaChannel(channelName);
                                    if (channel.getProtocol() === "pva") {
                                        const dbrData = channel.getDbrData() as any;
                                        if (dbrData["value"] !== undefined) {
                                            return dbrData["value"]["index"]
                                        } else {
                                            return this.getWidgetKey()
                                        }

                                    } else {
                                        const index = itemValues.indexOf(channel.getDbrData()["value"]);
                                        if (index !== -1) {
                                            return index;
                                        } else {
                                            // do not use undefined, it does not change the empty option
                                            return this.getWidgetKey();
                                        }

                                    }
                                } catch (e) {
                                    Log.error(e);
                                    return this.getWidgetKey();
                                }
                            } else {
                                return this.getWidgetKey();
                            }
                        })()}
                    >
                        <option key={`empty-value`}
                            value={this.getWidgetKey()}
                        >
                            {""}
                        </option>

                        {(itemNames as string[]).map((name: string, index: number) => {
                            // let isSelected = false;
                            // if (!g_widgets1.isEditing()) {
                            //     try {
                            //         const channel = g_widgets1.getTcaChannel(channelName);
                            //         if (channel.getProtocol() === "pva") {
                            //             const dbrData = channel.getDbrData() as any;
                            //             if (dbrData["value"]["index"] === index) {
                            //                 isSelected = true;
                            //             }
                            //         } else {
                            //             if (channel.getDbrData()["value"] === itemValues[index]) {
                            //                 isSelected = true;
                            //             }

                            //         }
                            //     } catch (e) {
                            //         Log.error(e);
                            //     }
                            // }

                            return (
                                <option key={`${name}-${index}`}
                                    value={index}
                                // selected={isSelected}
                                >
                                    {name}
                                </option>
                            );
                        })}
                    </select>
                </form>
            </div >
        );
    };

    calcOptionSelected = (optionValue: number) => {
        let tmpLabels = this.getItemLabels();
        let tmpValues = this.getItemValues();
        if (this.getAllText()["useChannelItems"] && this._itemLabelsFromChannel.length > 0) {
            tmpLabels = this._itemLabelsFromChannel;
            tmpValues = this._itemValuesFromChannel;
        }
        if (Math.floor(this._getChannelValue(true) as number) === optionValue) {
            return true;
        } else {
            return false;
        }
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
                    //     console.log("--------------", JSON.stringify(channel.getDbrData()), strs)
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

    handleChange = (event: any) => {
        event.preventDefault();
        const channelName = this.getChannelNames()[0];
        if (g_widgets1.isEditing()) {
            return;
        } else {
            if (this._getChannelAccessRight() < 1.5) {
                return;
            }
            const index = event.target.value;
            let value = this.getItemValues()[index];
            if (this.getAllText()["useChannelItems"] === true) {
                value = this._itemValuesFromChannel[index];
            }
            // write value
            this.putChannelValue(channelName, value);
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

        const defaultTdl: type_ComboBox_tdl = {
            type: "ComboBox",
            widgetKey: "", // "key" is a reserved keyword
            key: "",
            style: {
                // basics
                position: "absolute",
                display: "inline-flex",
                // dimensions
                left: 100,
                top: 100,
                width: 150,
                height: 80,
                backgroundColor: "rgba(210, 210, 210, 1)",
                // angle
                transform: "rotate(0deg)",
                // border, it is different from the "alarmBorder" below,
                borderStyle: "solid",
                borderWidth: 0,
                borderColor: "rgba(0, 0, 0, 1)",
                // font
                color: "rgba(0,0,0,1)",
                fontFamily: GlobalVariables.defaultFontFamily,
                fontSize: GlobalVariables.defaultFontSize,
                fontStyle: GlobalVariables.defaultFontStyle,
                fontWeight: GlobalVariables.defaultFontWeight,
                // shows when the widget is selected
                outlineStyle: "none",
                outlineWidth: 1,
                outlineColor: "black",
            },
            text: {
                horizontalAlign: "center",
                // ! todo
                // verticalAlign: "center",
                alarmBorder: true,
                useChannelItems: true,
                invisibleInOperation: false,
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
            itemLabels: ["Label 0", "Label 1"],
            itemValues: [0, 1],
        };
        return JSON.parse(JSON.stringify(defaultTdl));
    };

    generateDefaultTdl: () => any = ComboBox.generateDefaultTdl;

    getTdlCopy(newKey: boolean = true): Record<string, any> {
        const result = super.getTdlCopy(newKey);
        result["itemValues"] = JSON.parse(JSON.stringify(this.getItemValues()));
        result["itemLabels"] = JSON.parse(JSON.stringify(this.getItemLabels()));
        return result;
    }

    // --------------------- getters -------------------------

    getItemLabels = () => {
        return this._itemLabels;
    };
    getItemValues = () => {
        return this._itemValues;
    };

    // -------------------------- sidebar ---------------------------
    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new ComboBoxSidebar(this);
        }
    }
}
