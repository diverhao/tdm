import * as GlobalMethods from "../../../common/GlobalMethods";
import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { TextSymbolSidebar } from "./TextSymbolSidebar";
import { BaseWidgetRules } from "../BaseWidget/BaseWidgetRules";
import { TextSymbolRule } from "./TextSymbolRule";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { deepMerge } from "../../../common/GlobalMethods";
import { type_TextSymbol_tdl, defaultTextSymbolTdl } from "../../../common/types/type_widget_tdl";

export class TextSymbol extends BaseWidget {

    _rules: BaseWidgetRules;

    _itemNames: string[];
    _itemColors: string[];
    _itemValues: number[];

    constructor(widgetTdl: type_TextSymbol_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this.setReadWriteType("read");

        const defaultTdl = this.generateDefaultTdl();
        this._itemNames = deepMerge(widgetTdl.itemNames, defaultTdl.itemNames);
        this._itemColors = deepMerge(widgetTdl.itemColors, defaultTdl.itemColors);
        this._itemValues = deepMerge(widgetTdl.itemValues, defaultTdl.itemValues);
        // ensure the same number of states
        const numStates = Math.min(this._itemNames.length, this._itemColors.length, this._itemValues.length);
        this._itemNames.splice(numStates);
        this._itemColors.splice(numStates);
        this._itemValues.splice(numStates);

        this._rules = new BaseWidgetRules(this, widgetTdl, TextSymbolRule);
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
                    <this._ElementArea></this._ElementArea>
                    {this.showResizers() ? <this._ElementResizer /> : null}
                </div>
                {this.showSidebar() ? this._sidebar?.getElement() : null}
            </ErrorBoundary>
        );
    };

    _ElementAreaRaw = ({ }: any): React.JSX.Element => {

        const allText = this.getAllText();

        const whiteSpace = allText.wrapWord ? "normal" : "pre";
        const justifyContent = allText.horizontalAlign;
        const alignItems = allText.verticalAlign;
        const outline = this._getElementAreaRawOutlineStyle();
        const backgroundColor = allText["invisibleInOperation"] ? "rgba(0,0,0,0)" : this._getElementAreaRawBackgroundStyle();
        const color = this._getElementAreaRawTextStyle();

        return (
            <div
                style={{
                    display: "inline-flex",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    userSelect: "none",
                    position: "absolute",
                    overflow: "visible",
                    whiteSpace: whiteSpace,
                    justifyContent: justifyContent,
                    alignItems: alignItems,
                    outline: outline,
                    backgroundColor: backgroundColor,
                    color: color,
                }}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                <this._ElementTextSymbol></this._ElementTextSymbol>
            </div>
        );
    };

    _Element = React.memo(this._ElementRaw, () => this._useMemoedElement());
    _ElementArea = React.memo(this._ElementAreaRaw, () => this._useMemoedElement());


    _ElementTextSymbol = () => {
        const justifyContent = this.getAllText().horizontalAlign;
        const alignItems = this.getAllText().verticalAlign;
        // overrides the widget's background color
        const backgroundColor = this.calcItemColor();

        return (
            <div
                style={{
                    display: "inline-flex",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    justifyContent: justifyContent,
                    alignItems: alignItems,
                    backgroundColor: backgroundColor,
                }}
            >
                {this.calcItemText()}
            </div>
        );
    };

    // -------------------------- tdl -------------------------------

    static generateDefaultTdl = (): type_TextSymbol_tdl => {
        const widgetKey = GlobalMethods.generateWidgetKey(defaultTextSymbolTdl.type);
        return structuredClone({
            ...defaultTextSymbolTdl,
            widgetKey: widgetKey,
        });
    };

    generateDefaultTdl: () => any = TextSymbol.generateDefaultTdl;

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
            this._sidebar = new TextSymbolSidebar(this);
        }
    }
}
