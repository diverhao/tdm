import * as GlobalMethods from "../../../common/GlobalMethods";
import { Channel_ACCESS_RIGHTS } from "../../../common/GlobalVariables";
import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { CheckBoxSidebar } from "./CheckBoxSidebar";
import { BaseWidgetRules } from "../BaseWidget/BaseWidgetRules";
import { CheckBoxRule } from "./CheckBoxRule";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { deepMerge } from "../../../common/GlobalMethods";
import { type_CheckBox_tdl, defaultCheckBoxTdl } from "../../../common/types/type_widget_tdl";

export class CheckBox extends BaseWidget {

    _rules: BaseWidgetRules;
    _itemNames: string[];
    _itemColors: string[];
    _itemValues: number[];

    constructor(widgetTdl: type_CheckBox_tdl) {
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

        this._rules = new BaseWidgetRules(this, widgetTdl, CheckBoxRule);
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
        const elementRef = React.useRef<HTMLFormElement>(null);
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
                onMouseEnter={(event) => this.hanldeMouseEnterWriteWidget(event, elementRef)}
                onMouseLeave={(event) => this.handleMouseLeaveWriteWidget(event, elementRef)}
            >
                <div
                    style={{
                        display: "inline-flex",
                        padding: 0,
                        border: "1px solid #444",
                        borderRadius: 3,
                        lineHeight: 0,
                        marginRight: 3,
                    }}
                >
                    <input
                        type="checkbox"
                        name="checkbox"
                        id={widgetKey}
                        onClick={(event) => {
                            this.handleMouseClick(event);
                        }}
                        style={{
                            width: size,
                            height: size,
                            accentColor: "rgba(240,240,240,1)",
                            margin: 0,
                        }}
                        checked={this.calcCheckState()}
                    ></input>
                </div>
                <label htmlFor={widgetKey}>{text}</label>
            </form >
        );
    };

    // -------------------- helper functions ----------------

    /**
     * check the box only when the index is not 0
     */
    calcCheckState = () => {
        const index = this.calcItemIndex();
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

    static generateDefaultTdl = (): type_CheckBox_tdl => {
        const widgetKey = GlobalMethods.generateWidgetKey(defaultCheckBoxTdl.type);
        return structuredClone({
            ...defaultCheckBoxTdl,
            widgetKey: widgetKey,
        });
    };

    generateDefaultTdl: () => any = CheckBox.generateDefaultTdl;

    // overload
    getTdlCopy(newKey: boolean = true): Record<string, any> {
        const result = super.getTdlCopy(newKey);
        result["itemColors"] = structuredClone(this.getItemColors());
        result["itemNames"] = structuredClone(this.getItemNames());
        result["itemValues"] = structuredClone(this.getItemValues());
        return result;
    }

    // -------------------------- sidebar ---------------------------
    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new CheckBoxSidebar(this);
        }
    }
}
