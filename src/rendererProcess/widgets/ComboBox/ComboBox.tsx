import * as GlobalMethods from "../../../common/GlobalMethods";
import { Channel_ACCESS_RIGHTS, GlobalVariables } from "../../../common/GlobalVariables";
import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { ComboBoxSidebar } from "./ComboBoxSidebar";
import { BaseWidgetRules } from "../BaseWidget/BaseWidgetRules";
import { ComboBoxRule } from "./ComboBoxRule";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { Log } from "../../../common/Log";
import { deepMerge } from "../../../common/GlobalMethods";
import { type_ComboBox_tdl, defaultComboBoxTdl } from "../../../common/types/type_widget_tdl";

export class ComboBox extends BaseWidget {

    _itemNames: string[];
    _itemColors: string[];
    _itemValues: number[];

    _rules: BaseWidgetRules;

    constructor(widgetTdl: type_ComboBox_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this.setReadWriteType("write");


        const defaultTdl = this.generateDefaultTdl();
        this._itemNames = deepMerge(defaultTdl.itemNames, widgetTdl.itemNames);
        this._itemColors = deepMerge(defaultTdl.itemColors, widgetTdl.itemColors);
        this._itemValues = deepMerge(defaultTdl.itemValues, widgetTdl.itemValues);
        // ensure the same number of states
        const numStates = Math.min(this._itemNames.length, this._itemColors.length, this._itemValues.length);
        this._itemNames.splice(numStates);
        this._itemColors.splice(numStates);
        this._itemValues.splice(numStates);

        this._rules = new BaseWidgetRules(this, widgetTdl, ComboBoxRule);
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
        const whiteSpace = this.getAllText().wrapWord ? "normal" : "pre";
        const outline = this._getElementAreaRawOutlineStyle();
        const backgroundColor = this.getAllText()["invisibleInOperation"] ? "rgba(0,0,0,0)" : this._getElementAreaRawBackgroundStyle();


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
                    outline: outline,
                    backgroundColor: backgroundColor,
                }}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                <this._ElementComboBox></this._ElementComboBox>
            </div>
        );
    };

    _ElementComboBox = () => {

        const elementRef = React.useRef<HTMLDivElement>(null);

        const allStyle = this.getAllStyle();
        const allText = this.getAllText();
        const itemNames = this.calcItemTexts();
        const itemIndex = this.calcItemIndex();

        // font must be explicitly set in <select />
        const fontSize = allStyle["fontSize"];
        const fontFamily = allStyle["fontFamily"];
        const fontStyle = allStyle["fontStyle"];
        const fontWeight = allStyle["fontWeight"];

        // color must be explictly set in <select />
        const color = this._getElementAreaRawTextStyle();

        const pointerEvent = this._getChannelAccessRight() < Channel_ACCESS_RIGHTS.READ_WRITE ? "none" : "auto";
        const textAlignLast = this.getAllText()["horizontalAlign"] === "flex-start"
            ? "left"
            : this.getAllText()["horizontalAlign"] === "flex-end"
                ? "right"
                : "center";

        return (
            <div
                ref={elementRef}
                style={{
                    display: "inline-flex",
                    width: "100%",
                    height: "100%",
                    backgroundColor: "rgba(0,0,0,0)",
                }}
                onMouseEnter={(event) => this.hanldeMouseEnterWriteWidget(event, elementRef)}
                onMouseLeave={(event) => this.handleMouseLeaveWriteWidget(event, elementRef)}
            >
                <form
                    style={{
                        display: "inline-flex",
                        flexDirection: "column",
                        justifyContent: "flex-start",
                        alignItems: "flex-start",
                        width: "100%",
                        height: "100%",
                        // make the dropdown selection transparent to mouse event (in particular mosue down)
                        // so that we won't control it if it is not writable
                        pointerEvents: pointerEvent,
                    }}
                >
                    <select
                        style={{
                            color: color,
                            width: "100%",
                            height: "100%",
                            fontSize: fontSize,
                            fontFamily: fontFamily,
                            fontStyle: fontStyle,
                            fontWeight: fontWeight,
                            backgroundColor: "rgba(0,0,0,0)",
                            outline: "none",
                            textAlignLast: textAlignLast,
                        }}
                        onChange={(event) => {
                            this.handleMouseClick(event);
                        }}
                        value={`${itemIndex}`}
                    >
                        <option key={`empty-value`}
                            value={"undefined"}
                        >
                            {""}
                        </option>

                        {itemNames.map((name: string, index: number) => {
                            return (
                                <option key={`${name}-${index}`}
                                    value={`${index}`}
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


    _Element = React.memo(this._ElementRaw, () => this._useMemoedElement());
    _ElementArea = React.memo(this._ElementAreaRaw, () => this._useMemoedElement());

    // -------------------- helper functions ----------------

    /**
     * when the mouse is down or up on the button, do something
     */
    handleMouseClick = (event: React.ChangeEvent<HTMLSelectElement>) => {
        event.preventDefault();

        // no button field
        // if (event.button !== 0) {
        //     return;
        // }

        // do nothing during editing
        if (g_widgets1.isEditing()) {
            return;
        }

        const index = parseInt((event.target as HTMLSelectElement).value);
        if (isNaN(index)) {
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

    static generateDefaultTdl = (): type_ComboBox_tdl => {
        const widgetKey = GlobalMethods.generateWidgetKey(defaultComboBoxTdl.type);
        return structuredClone({
            ...defaultComboBoxTdl,
            widgetKey: widgetKey,
        });
    };

    generateDefaultTdl: () => any = ComboBox.generateDefaultTdl;

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
            this._sidebar = new ComboBoxSidebar(this);
        }
    }
}
