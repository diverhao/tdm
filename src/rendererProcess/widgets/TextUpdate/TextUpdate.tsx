import * as React from "react";
import { MouseEvent } from "react";
import { GlobalVariables, g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { GroupSelection2 } from "../../helperWidgets/GroupSelection/GroupSelection2";
import { TextUpdateSidebar } from "./TextUpdateSidebar";
import * as GlobalMethods from "../../global/GlobalMethods";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { TextUpdateRules } from "./TextUpdateRules";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
// import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary"
import { Log } from "../../../mainProcess/log/Log";


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
    // level-1 properties in tdl file
    // _type: string;
    // _widgetKey: string;
    // _style: Record<string, any>;
    // _text: Record<string, any>;
    // _channelNames: string[];
    // _groupNames: string[] = undefined;

    // sidebar
    // private _sidebar: TextUpdateSidebar;

    // tmp methods
    // private _tmp_mouseMoveOnResizerListener: any = undefined;
    // private _tmp_mouseUpOnResizerListener: any = undefined;

    // widget-specific channels, these channels are only used by this widget
    // private _tcaChannels: TcaChannel[];

    // used for the situation of shift key pressed + mouse down on a selected widget,
    // so that when the mouse is up, the widget is de-selected
    // its value is changed in 3 places: this.select2(), this._handleMouseMove() and this._handleMouseUp()
    // private _readyToDeselect: boolean = false;

    _rules: TextUpdateRules;

    constructor(widgetTdl: type_TextUpdate_tdl) {
        super(widgetTdl);
        this.setReadWriteType("read");

        this.setStyle({ ...TextUpdate._defaultTdl.style, ...widgetTdl.style });
        this.setText({ ...TextUpdate._defaultTdl.text, ...widgetTdl.text });

        this._rules = new TextUpdateRules(this, widgetTdl);

        // this._sidebar = new TextUpdateSidebar(this);
    }

    // ------------------------- event ---------------------------------

    // defined in widget, invoked in sidebar
    // (1) determine which tdl property should be updated
    // (2) calculate new value
    // (3) assign new value
    // (4) add this widget as well as "GroupSelection2" to g_widgets1.forceUpdateWidgets
    // (5) flush
    updateFromSidebar = (event: any, propertyName: string, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        // todo: remove this method
    };

    // defined in super class
    // _handleMouseDown()
    // _handleMouseMove()
    // _handleMouseUp()
    // _handleMouseDownOnResizer()
    // _handleMouseMoveOnResizer()
    // _handleMouseUpOnResizer()
    // _handleMouseDoubleClick()

    // ----------------------------- geometric operations ----------------------------

    // defined in super class
    // simpleSelect()
    // selectGroup()
    // select()
    // simpleDeSelect()
    // deselectGroup()
    // deSelect()
    // move()
    // resize()

    // ------------------------------ group ------------------------------------

    // defined in super class
    // addToGroup()
    // removeFromGroup()

    // ------------------------------ elements ---------------------------------

    // element = <> body (area + resizer) + sidebar </>

    // Body + sidebar
    _ElementRaw = () => {
        this.setRulesStyle({});
        this.setRulesText({});
        const rulesValues = this.getRules()?.getValues();
        if (rulesValues !== undefined) {
            this.setRulesStyle(rulesValues["style"]);
            this.setRulesText(rulesValues["text"]);
        }
        this.setAllStyle({ ...this.getStyle(), ...this.getRulesStyle() });
        this.setAllText({ ...this.getText(), ...this.getRulesText() });

        // must do it for every widget
        g_widgets1.removeFromForceUpdateWidgets(this.getWidgetKey());
        this.renderChildWidgets = true;
        React.useEffect(() => {
            this.renderChildWidgets = false;
        });

        return (
            <ErrorBoundary style={this.getStyle()} widgetKey={this.getWidgetKey()} >
                <>
                    {
                        // skip _ElementBody in operating mode
                        // the re-render efficiency can be improved by 10% by doing this
                        // this technique is used on a few most re-rendered widgets, like TextUpdate and TextEntry
                        g_widgets1.isEditing()
                            ?
                            <>
                                <this._ElementBody></this._ElementBody>
                                {this._showSidebar() ? this._sidebar?.getElement() : null}
                            </>
                            :
                            <this._ElementArea></this._ElementArea>

                    }
                </>
            </ErrorBoundary>
        );
    };


    getElementFallbackFunction = () => {
        return this._ElementFallback;
    }

    // Text area and resizers
    _ElementBodyRaw = (): JSX.Element => {
        return (
            // always update the div below no matter the TextUpdateBody is .memo or not
            // TextUpdateResizer does not update if it is .memo
            <div style={{
                ...this.getElementBodyRawStyle(),
                // outline: this._getElementAreaRawOutlineStyle(),
            }}>
                <this._ElementArea></this._ElementArea>
                {this._showResizers() ? <this._ElementResizer /> : null}
            </div>
        );
    };

    // only shows the text, all other style properties are held by upper level _ElementBodyRaw
    _ElementAreaRaw = ({ }: any): JSX.Element => {
        const allStyle = this.getAllStyle();
        const allText = this.getAllText();
        let style: React.CSSProperties = {};
        if (g_widgets1.isEditing()) {
            style = {
                display: this.getAllStyle()["display"],
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                userSelect: "none",
                overflow: "hidden",
                whiteSpace: allText.wrapWord ? "normal" : "pre",
                justifyContent: allText.horizontalAlign,
                alignItems: allText.verticalAlign,
                fontFamily: allStyle.fontFamily,
                fontSize: allStyle.fontSize,
                fontStyle: allStyle.fontStyle,
                fontWeight: allStyle.fontWeight,
                outline: this._getElementAreaRawOutlineStyle(),
                color: allStyle["color"],
                opacity: 1,
                // opacity: this.getAllText()["invisibleInOperation"] === true && !g_widgets1.isEditing() ? 0 : 1,

            } as React.CSSProperties;
        } else {
            style = {
                // position: "relative",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                userSelect: "none",
                overflow: "hidden",
                whiteSpace: allText.wrapWord ? "normal" : "pre",
                justifyContent: allText.horizontalAlign,
                alignItems: allText.verticalAlign,
                fontFamily: allStyle.fontFamily,
                fontSize: allStyle.fontSize,
                fontStyle: allStyle.fontStyle,
                fontWeight: allStyle.fontWeight,
                // color: allStyle["color"],
                ...this.getElementBodyRawStyle(),
                // display: "inline-flex",
                display: this.getAllStyle()["display"],
                backgroundColor: this.getAllText()["invisibleInOperation"] ? "rgba(0,0,0,0)" : this._getElementAreaRawBackgroundStyle(),
                outline: this._getElementAreaRawOutlineStyle(),
                // opacity: this.getAllText()["invisibleInOperation"] === true && !g_widgets1.isEditing() ? 0 : 1,
                color: this.getAllText()["invisibleInOperation"] === true && !g_widgets1.isEditing() ? "rgba(0,0,0,0)" : this._getElementAreaRawTextStyle(),
            } as React.CSSProperties;
        }


        return (
            <div
                style={style}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                {`${this.getChannelValueStrRepresentation()}${this.getAllText()["showUnit"] === true ? this._getChannelUnit().trim() === "" ? "" : " " + this._getChannelUnit() : ""}`}
            </div>
        );
    };

    /**
     * Nomrally we can display the channel value as `${this._getChannelValue()}`
     * However, for string type data, this produces a lot of "," if the data is an array
     */
    getChannelValueStrRepresentation = () => {
        const rawChannelValue = this._getChannelValue(false);
        if (Array.isArray(rawChannelValue)) {
            return '[' + rawChannelValue.join(",") + ']';
        }
        return rawChannelValue;
    }


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
    // _showSidebar()
    // _showResizers()
    // _useMemoedElement()
    // hasChannel()
    // isInGroup()
    // isSelected()
    // _getElementAreaRawOutlineStyle()

    _parseChannelValueElement = (channelValueElement: number | string | boolean | undefined): string => {


        if (typeof channelValueElement === "number") {
            const scale = Math.max(this.getAllText()["scale"], 0);
            const format = this.getAllText()["format"];
            if (format === "decimal") {
                return channelValueElement.toFixed(scale);
            } else if (format === "default") {
                // const channelName = this.getChannelNames()[0];
                // const defaultScale = g_widgets1.getChannelPrecision(channelName);
                // if (defaultScale !== undefined) {
                //     return channelValueElement.toFixed(defaultScale);
                // } else {
                    return channelValueElement.toFixed(scale);
                // }
            } else if (format === "exponential") {
                return channelValueElement.toExponential(scale);
            } else if (format === "hexadecimal") {
                return `0x${channelValueElement.toString(16)}`;
            } else if (format === "string") {
                // use a number array to represent a string
                // MacOS ignores the non-displayable characters, but Linux shows rectangle for these characters
                if (channelValueElement >= 32 && channelValueElement <= 126) {
                    return `${String.fromCharCode(channelValueElement)}`;
                } else {
                    return "";
                }
            } else {
                return `${channelValueElement}`;
            }
        } else {
            if (g_widgets1.isEditing() === true) {
                return `${channelValueElement}`;
            } else {
                return `${channelValueElement}`;
            }

        }
    };

    // only for TextUpdate and TextEntry
    // they are suitable to display array data in various formats,
    // other types of widgets, such as Meter, Spinner, Tanks, ProgressBar, Thermometer, ScaledSlider are not for array data
    _getChannelValue = (raw: boolean = false) => {

        const channelValue = this.getChannelValueForMonitorWidget(raw);
        console.log("channel value ===============================", channelValue)
        if (typeof channelValue === "number" || typeof channelValue === "string") {
            return this._parseChannelValueElement(channelValue);
        } else if (Array.isArray(channelValue)) {
            const result: any[] = [];
            for (let element of channelValue) {
                result.push(this._parseChannelValueElement(element));
            }
            if (this.getAllText()["format"] === "string" && typeof channelValue[0] === "number") {
                return result.join("");
            } else {
                return result;
            }
        } else {
            return channelValue;
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

    // properties when we create a new TextUpdate
    // the level 1 properties all have corresponding public or private variable in the widget

    static _defaultTdl: type_TextUpdate_tdl = {
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

    // not getDefaultTdl(), always generate a new key
    static generateDefaultTdl = (type: string): Record<string, any> => {
        const result = super.generateDefaultTdl(type);
        result.style = JSON.parse(JSON.stringify(this._defaultTdl.style));
        result.text = JSON.parse(JSON.stringify(this._defaultTdl.text));
        result.channelNames = JSON.parse(JSON.stringify(this._defaultTdl.channelNames));
        result.groupNames = JSON.parse(JSON.stringify(this._defaultTdl.groupNames));
        return result;
    };

    // defined in super class
    // getTdlCopy()

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

    // --------------------- sidebar --------------------------
    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new TextUpdateSidebar(this);
        }
    }
}
