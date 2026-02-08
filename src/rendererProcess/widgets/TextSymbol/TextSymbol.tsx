import * as GlobalMethods from "../../../common/GlobalMethods";
import { GlobalVariables } from "../../../common/GlobalVariables";
import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { TextSymbolSidebar } from "./TextSymbolSidebar";
import { TextSymbolRules } from "./TextSymbolRules";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";

export type type_TextSymbol_tdl = {
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

export class TextSymbol extends BaseWidget {

    _rules: TextSymbolRules;
    _itemLabels: string[];
    _itemValues: (number | string | number[] | string[] | undefined)[];

    constructor(widgetTdl: type_TextSymbol_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this.setReadWriteType("read");

        this._rules = new TextSymbolRules(this, widgetTdl);

        this._itemLabels = JSON.parse(JSON.stringify(widgetTdl.itemLabels));
        this._itemValues = JSON.parse(JSON.stringify(widgetTdl.itemValues));
    }

    // ------------------------------ elements ---------------------------------

    // Body + sidebar
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
                    {this.showSidebar() ? this._sidebar?.getElement() : null}
                </>
            </ErrorBoundary>
        );
    };

    // Text area and resizers
    _ElementBodyRaw = (): React.JSX.Element => {
        return (
            // always update the div below no matter the TextUpdateBody is .memo or not
            // TextUpdateResizer does not update if it is .memo
            <div style={this.getElementBodyRawStyle()}>
                <this._ElementArea></this._ElementArea>
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
                    position: "absolute",
                    overflow: "visible",
                    whiteSpace: this.getAllText().wrapWord ? "normal" : "pre",
                    justifyContent: this.getAllText().horizontalAlign,
                    alignItems: this.getAllText().verticalAlign,
                    fontFamily: this.getAllStyle().fontFamily,
                    fontSize: this.getAllStyle().fontSize,
                    fontStyle: this.getAllStyle().fontStyle,
                    fontWeight: this.getAllStyle().fontWeight,
                    outline: this._getElementAreaRawOutlineStyle(),
                    backgroundColor: this.getAllText()["invisibleInOperation"] ? "rgba(0,0,0,0)" : this._getElementAreaRawBackgroundStyle(),
                    color: this._getElementAreaRawTextStyle(),
                }}
                // title={"tooltip"}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                <this._ElementTextSymbol></this._ElementTextSymbol>
            </div>
        );
    };

    // calcPictureWidth = () => {};

    calcItemName = (): string => {
        if (this.getItemLabels().length > 0) {
            if (g_widgets1.isEditing()) {
                return this.getItemLabels()[0];
            } else {
                // get raw number if it is enum type PV
                const channelValue = this._getChannelValue(true);
                const index = this.getItemValues().indexOf(channelValue);
                if (index > -1) {
                    if (this.getItemLabels()[index]) {
                        return this.getItemLabels()[index];
                    }
                }
            }
        }
        return "Text Symbol";
    };

    calcTextVisibility = () => {
        if (this.calcItemName() === "Text Symbol") {
            return "visible";
        } else {
            return "hidden";
        }
    };

    _ElementTextSymbol = () => {
        return (
            <div
                style={{
                    display: "inline-flex",
                    width: "100%",
                    height: "100%",
                    opacity: this.getAllText()["invisibleInOperation"] === true && !g_widgets1.isEditing() ? 0 : 1,
                }}
            >
                <div
                    style={{
                        display: "inline-flex",
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        justifyContent: this.getAllText().horizontalAlign,
                        alignItems: this.getAllText().verticalAlign,
                        visibility: this.calcTextVisibility() === "visible" ? "hidden" : "visible",
                    }}
                >
                    {this.calcItemName()}
                </div>
                <div
                    style={{
                        display: "inline-flex",
                        position: "absolute",
                        visibility: this.calcTextVisibility(),
                        justifyContent: this.getAllText().horizontalAlign,
                        alignItems: this.getAllText().verticalAlign,
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                    }}
                >
                    {this.getAllText()["text"] + (this.getAllText()["showPvValue"] === true ? `${this._getChannelValue()}${this.getAllText().showUnit ? " " + this._getChannelUnit() : ""}` : "")}
                    {/* {`No symbol ${this._getChannelValue()}${this.getAllText().showUnit ? " " + this._getChannelUnit() : ""}`} */}
                </div>
            </div>
        );
    };

    // ------------------------- rectangle ------------------------------------

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

    // ----------------------- styles -----------------------

    // defined in super class
    // _resizerStyle
    // _resizerStyles
    // StyledToolTipText
    // StyledToolTip

    // -------------------------- tdl -------------------------------



    // not getDefaultTdl(), always generate a new key
    static generateDefaultTdl = (): Record<string, any> => {
        const defaultTdl: type_TextSymbol_tdl = {
            type: "TextSymbol",
            widgetKey: "", // "key" is a reserved keyword
            key: "",
            // the style for outmost div
            // these properties are explicitly defined in style because they are
            // (1) different from default CSS settings, or
            // (2) they may be modified
            style: {
                position: "absolute",
                display: "inline-flex",
                backgroundColor: "rgba(240, 240, 240, 0.2)",
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
                invisibleInOperation: false,
                alarmBorder: true,
                alarmBackground: false,
                alarmText: false,
                alarmLevel: "MINOR",
                text: "",
                showPvValue: false,
            },
            channelNames: [],
            groupNames: [],
            rules: [],
            itemLabels: [],
            itemValues: [],
        };

        defaultTdl["widgetKey"] = GlobalMethods.generateWidgetKey(defaultTdl["type"]);
        return JSON.parse(JSON.stringify(defaultTdl));
    };

    generateDefaultTdl: () => any = TextSymbol.generateDefaultTdl;

    // overload
    getTdlCopy(newKey: boolean = true): Record<string, any> {
        const result = super.getTdlCopy(newKey);
        result["itemValues"] = JSON.parse(JSON.stringify(this.getItemValues()));
        result["itemLabels"] = JSON.parse(JSON.stringify(this.getItemLabels()));
        return result;
    }

    // --------------------- getters -------------------------

    // defined in super class
    // getType()
    // getWidgetKey()
    // getStyle()
    // getText()
    // getSidebar()
    // getGroupName()
    // getGroupNames()
    // getUpdateFromWidget()
    // getResizerStyle()
    // getResizerStyles()
    // getRules()

    getItemLabels = () => {
        return this._itemLabels;
    };
    getItemValues = () => {
        return this._itemValues;
    };

    // ---------------------- setters -------------------------

    // ---------------------- channels ------------------------

    // defined in super class
    // getChannelNames()
    // expandChannelNames()
    // getExpandedChannelNames()
    // setExpandedChannelNames()
    // expandChannelNameMacro()

    // ------------------------ z direction --------------------------

    // defined in super class
    // moveInZ()
    // -------------------------- sidebar ---------------------------
    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new TextSymbolSidebar(this);
        }
    }
}
