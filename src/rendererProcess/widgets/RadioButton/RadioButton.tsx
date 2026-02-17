import * as GlobalMethods from "../../../common/GlobalMethods";
import { Channel_ACCESS_RIGHTS, GlobalVariables } from "../../../common/GlobalVariables";
import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { RadioButtonSidebar } from "./RadioButtonSidebar";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { RadioButtonRules } from "./RadioButtonRules";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { deepMerge } from "../../../common/GlobalMethods";

export type type_RadioButton_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
    // Radio Button specific
    itemNames: string[];
    itemColors: string[];
    itemValues: number[];
};

export class RadioButton extends BaseWidget {

    _rules: RadioButtonRules;

    _itemNames: string[];
    _itemColors: string[];
    _itemValues: number[];

    constructor(widgetTdl: type_RadioButton_tdl) {
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

        this._rules = new RadioButtonRules(this, widgetTdl);
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
                    {/* <this._ElementArea></this._ElementArea> */}
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
                <this._ElementRadioButton></this._ElementRadioButton>
            </div>
        );
    };

    _ElementRadioButton = () => {

        const elementRef = React.useRef<any>(null);

        const itemNames = this.calcItemTexts();

        const allText = this.getAllText();
        const flexDirection = allText["direction"] === "horizontal" ? "row" : "column";
        const justifyContent = allText["verticalAlign"];
        const alignItems = allText["horizontalAlign"];
        const backgroundColor = this._getElementAreaRawBackgroundStyle();


        return (
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    display: "inline-flex",
                    cursor: "pointer",
                    flexDirection: flexDirection,
                    justifyContent: justifyContent,
                    alignItems: alignItems,
                    backgroundColor: backgroundColor,
                }}
            >
                <form
                    ref={elementRef}
                    style={{
                        display: "inline-flex",
                        flexDirection: flexDirection,
                        justifyContent: "flex-start",
                        alignItems: "flex-start",
                    }}
                    onMouseEnter={(event: any) => this.hanldeMouseEnterWriteWidget(event, elementRef)}
                    onMouseLeave={(event: any) => this.handleMouseLeaveWriteWidget(event, elementRef)}
                >

                    {itemNames.map((name: string, index: number) => {
                        return (<this._ElementRadioButtonItem index={index} name={name}></this._ElementRadioButtonItem>);
                    })}
                </form>
            </div>
        );
    };

    _ElementRadioButtonItem = ({ index, name }: { index: number, name: string }) => {

        const isSelected = this.calcIsSelected(index);
        const itemValue = this.calcItemValues()[index];

        return (
            <div
                key={`${name}-${index}`}
                style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    cursor: "pointer",
                    pointerEvents: this._getChannelAccessRight() < 1.5 ? "none" : "auto",
                    color: isSelected ? this._getElementAreaRawTextStyle() : this.getAllStyle()["color"],
                }}
            >
                <input
                    type="radio"
                    name="radio-group"
                    id={`${this.getWidgetKey()}-${name}-${index}`}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        if (event.target.checked) {
                            this.handleMouseClick(index);
                        }
                    }}
                    checked={isSelected}
                    value={String(itemValue)}
                    style={{
                        width: this.getAllText()["boxWidth"],
                        height: this.getAllText()["boxWidth"],
                        cursor: "pointer",
                    }}
                ></input>
                <label
                    htmlFor={`${this.getWidgetKey()}-${name}-${index}`}
                    style={{
                        marginLeft: "8px",
                        cursor: "pointer",
                    }}
                >
                    {name}
                </label>
            </div>
        )
    }

    _Element = React.memo(this._ElementRaw, () => this._useMemoedElement());
    _ElementArea = React.memo(this._ElementAreaRaw, () => this._useMemoedElement());

    // -------------------- helper functions ----------------

    calcIsSelected = (index: number) => {
        const selectedIndex = this.calcItemIndex();
        return index === selectedIndex;
    }

    /**
     * when the radio button is selected, send the corresponding value to channel
     */
    handleMouseClick = (index: number) => {
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

    // -------------------------- tdl -------------------------------

    static generateDefaultTdl = () => {

        const defaultTdl: type_RadioButton_tdl = {
            type: "RadioButton",
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
                alarmBorder: true,
                boxWidth: 13,
                invisibleInOperation: false,
                alarmText: false,
                alarmBackground: false,
                alarmLevel: "MINOR",
                confirmOnWrite: false,
                confirmOnWriteUsePassword: false,
                confirmOnWritePassword: "",
                direction: "vertical", // "horizontal"

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

    generateDefaultTdl: () => any = RadioButton.generateDefaultTdl;


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
            this._sidebar = new RadioButtonSidebar(this);
        }
    }
}
