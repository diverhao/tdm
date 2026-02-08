import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { GlobalVariables } from "../../../common/GlobalVariables";
import { TextUpdateSidebar } from "./TextUpdateSidebar";
import * as GlobalMethods from "../../../common/GlobalMethods";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { TextUpdateRules } from "./TextUpdateRules";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary"


export type type_TextUpdate_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
};

export class TextUpdate extends BaseWidget {
    _rules: TextUpdateRules;

    constructor(widgetTdl: type_TextUpdate_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this.setReadWriteType("read");
        this._rules = new TextUpdateRules(this, widgetTdl);
    }

    // ------------------------------ elements ---------------------------------

    // Body + sidebar
    _ElementRaw = () => {

        this.widgetBeingRendered = true;
        React.useEffect(() => {
            this.widgetBeingRendered = false;
        });
        g_widgets1.removeFromForceUpdateWidgets(this.getWidgetKey());
        this.updateAllStyleAndText();

        return (
            <ErrorBoundary style={this.getStyle()} widgetKey={this.getWidgetKey()} >
                {
                    g_widgets1.isEditing() ?
                        // in editing mode, show everything
                        <div style={this.getElementBodyRawStyle()}>
                            <this._ElementArea></this._ElementArea>
                            {this.showResizers() ? <this._ElementResizer /> : null}
                        </div>
                        :
                        // in operating mode, skip the body layer
                        // the CPU usage is reduced by 10% 
                        // this trick is only used in TextUpdate and TextEntry
                        <this._ElementArea></this._ElementArea>
                }
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
        const backgroundColor = this._getElementAreaRawBackgroundStyle();
        const color = this._getElementAreaRawTextStyle();

        const additionalStyle = g_widgets1.isEditing() ? {} : this.getElementBodyRawStyle();

        return (
            <div
                style={{
                    display: "inline-flex",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    // in operation mode, the appearance is defined in here as body layer is skipped
                    // the runtime appearance is after this
                    ...additionalStyle,
                    userSelect: "none",
                    overflow: "hidden",
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
                {this.getFormattedChannelValue(true)}
            </div>
        );
    };


    _Element = React.memo(this._ElementRaw, () => this._useMemoedElement());
    _ElementArea = React.memo(this._ElementAreaRaw, () => this._useMemoedElement());

    // -------------------------- tdl -------------------------------

    static generateDefaultTdl = (): Record<string, any> => {
        const defaultTdl: type_TextUpdate_tdl = {
            type: "TextUpdate",
            widgetKey: "", // "key" is a reserved keyword
            key: "",
            style: {
                // basics
                position: "absolute",
                display: "inline-flex",
                // dimensions
                left: 100,
                top: 100,
                width: 100,
                height: 100,
                backgroundColor: "rgba(240, 240, 240, 1)",
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
                // text
                horizontalAlign: "flex-start",
                verticalAlign: "flex-start",
                wrapWord: false,
                showUnit: true,
                invisibleInOperation: false,
                // default, decimal, exponential, hexadecimal
                format: "default",
                // scale, >= 0
                scale: 0,
                // actually "alarm outline"
                alarmBorder: true,
                alarmText: false,
                alarmBackground: false,
                alarmLevel: "MINOR",
            },
            channelNames: [],
            groupNames: [],
            rules: [],
        };

        defaultTdl["widgetKey"] = GlobalMethods.generateWidgetKey(defaultTdl["type"]);
        return JSON.parse(JSON.stringify(defaultTdl));
    };

    generateDefaultTdl = TextUpdate.generateDefaultTdl;

    // --------------------- sidebar --------------------------

    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new TextUpdateSidebar(this);
        }
    }
}
