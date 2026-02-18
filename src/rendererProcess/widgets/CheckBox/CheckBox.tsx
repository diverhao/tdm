import * as GlobalMethods from "../../../common/GlobalMethods";
import { Channel_ACCESS_RIGHTS, GlobalVariables } from "../../../common/GlobalVariables";
import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { CheckBoxSidebar } from "./CheckBoxSidebar";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { CheckBoxRules } from "./CheckBoxRules";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { Log } from "../../../common/Log";
import { deepMerge } from "../../../common/GlobalMethods";

export type type_CheckBox_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
    // Check Box specific
    itemNames: string[];
    itemColors: string[];
    itemValues: number[];
};

export class CheckBox extends BaseWidget {

    _rules: CheckBoxRules;
    _itemNames: string[];
    _itemColors: string[];
    _itemValues: number[];

    constructor(widgetTdl: type_CheckBox_tdl) {
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

        this._rules = new CheckBoxRules(this, widgetTdl);
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
                <this._ElementCheckBox></this._ElementCheckBox>
            </div>
        );
    };

    _Element = React.memo(this._ElementRaw, () => this._useMemoedElement());
    _ElementArea = React.memo(this._ElementAreaRaw, () => this._useMemoedElement());

    _ElementCheckBox = () => {
        const elementRef = React.useRef<any>(null);
        const allText = this.getAllText();
        const size = allText["size"];
        const widgetKey = this.getWidgetKey();
        const showLabels = allText["showLabels"];
        const text = showLabels === true ? this.calcItemText() : "";
        const backgroundColor = this.calcItemColor();

        return (
            <form
                ref={elementRef}
                style={{
                    display: "inline-flex",
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: backgroundColor,
                }}
                onMouseEnter={(event: any) => this.hanldeMouseEnterWriteWidget(event, elementRef)}
                onMouseLeave={(event: any) => this.handleMouseLeaveWriteWidget(event, elementRef)}
            >
                <input
                    type="checkbox"
                    name="checkbox"
                    id={widgetKey}
                    onClick={(event: any) => {
                        this.handleMouseClick(event);
                    }}
                    style={{
                        width: size,
                        height: size,
                    }}
                    checked={this.calcCheckState()}
                ></input>
                <label htmlFor={widgetKey}>{text}</label>
            </form>
        );
    };

    // -------------------- helper functions ----------------

    /**
     * check the box only when the index is not 0
     */
    calcCheckState = () => {
        const index = this.calcItemIndex();
        console.log("calc check state", index)
        if (index === 0) {
            return false;
        } else if (index === 1) {
            return true;
        } else {
            return true;
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

    // -------------------------- tdl -------------------------------

    static generateDefaultTdl = () => {

        const defaultTdl: type_CheckBox_tdl = {
            type: "CheckBox",
            widgetKey: "",
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
            text: {
                horizontalAlign: "flex-start",
                verticalAlign: "flex-start",
                wrapWord: false,
                showUnit: false,
                alarmBorder: true,
                // round button size
                size: 12,
                text: "Label",
                invisibleInOperation: false,
                confirmOnWrite: false,
                confirmOnWriteUsePassword: false,
                confirmOnWritePassword: "",
                showLabels: true,

                // discrete states
                bit: 0,
                useChannelItems: true,
                fallbackColor: "rgba(255,0,255,0)",
                fallbackText: "Wrong State",
            },
            channelNames: [],
            groupNames: [],
            rules: [],
            // discrete states
            itemNames: ["ZERO", "ONE"],
            itemColors: ["rgba(60, 100, 60, 0)", "rgba(0, 255, 0, 0)"],
            itemValues: [0, 1],
        };
        defaultTdl["widgetKey"] = GlobalMethods.generateWidgetKey(defaultTdl["type"]);
        return JSON.parse(JSON.stringify(defaultTdl));
    };

    generateDefaultTdl: () => any = CheckBox.generateDefaultTdl;

    // overload
    getTdlCopy(newKey: boolean = true): Record<string, any> {
        const result = super.getTdlCopy(newKey);
        result["itemColors"] = JSON.parse(JSON.stringify(this.getItemColors()));
        result["itemNames"] = JSON.parse(JSON.stringify(this.getItemNames()));
        result["itemValues"] = JSON.parse(JSON.stringify(this.getItemValues()));
        return result;
    }

    // -------------------------- sidebar ---------------------------
    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new CheckBoxSidebar(this);
        }
    }
}
