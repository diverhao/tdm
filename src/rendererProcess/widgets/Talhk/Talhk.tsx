import * as React from "react";
import { MouseEvent } from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { GlobalVariables } from "../../../common/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { GroupSelection2 } from "../../helperWidgets/GroupSelection/GroupSelection2";
import * as GlobalMethods from "../../../common/GlobalMethods";
import { BaseWidget } from "../BaseWidget/BaseWidget";
// import { TextUpdateRules } from "./TextUpdateRules";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
// import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary"
import { Log } from "../../../common/Log";
import { MainPage } from "./client/MainPage";


export type type_Talhk_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
};

export class Talhk extends BaseWidget {

    _mainPage: MainPage;
    constructor(widgetTdl: type_Talhk_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this.setReadWriteType("write");

        this._mainPage = new MainPage(this, this.getText()["serverAddress"]);
    }

    getMainPage = () => {
        return this._mainPage;
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
            <ErrorBoundary style={this.getStyle()} widgetKey={this.getWidgetKey()} >
                <>
                    {/* // skip _ElementBody in operating mode
                        // the re-render efficiency can be improved by 10% by doing this
                        // this technique is used on a few most re-rendered widgets, like TextUpdate and TextEntry */}
                    {/* <this._ElementBody></this._ElementBody> */}
                    <this._ElementArea></this._ElementArea>

                </>
            </ErrorBoundary>
        );
    };



    getElementFallbackFunction = () => {
        return this._ElementFallback;
    }

    // Text area and resizers
    _ElementBodyRaw = (): React.JSX.Element => {
        return (
            // always update the div below no matter the TextUpdateBody is .memo or not
            // TextUpdateResizer does not update if it is .memo
            <div style={{
                ...this.getElementBodyRawStyle(),
                // outline: this._getElementAreaRawOutlineStyle(),
            }}>
                <this._ElementArea></this._ElementArea>
                {/* {this._showResizers() ? <this._ElementResizer /> : null} */}
            </div>
        );
    };

    // only shows the text, all other style properties are held by upper level _ElementBodyRaw
    _ElementAreaRaw = ({ }: any): React.JSX.Element => {
        const allStyle = this.getAllStyle();
        const allText = this.getAllText();
        const style: React.CSSProperties = {
            position: "relative",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            // userSelect: "all",
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


        return (
            <div
                style={style}
            // onMouseDown={this._handleMouseDown}
            // onMouseDown={() => {
            //     console.log("aaa")
            // }}
            // onDoubleClick={this._handleMouseDoubleClick}
            >
                {/* TALHK! */}
                {/* {this.getAllText()["serverAddress"]} */}
                {this.getMainPage().getView()?.getElement()}
            </div>
        );
    };

    /**
     * Nomrally we can display the channel value as `${this._getChannelValue()}`
     * However, for string type data, this produces a lot of "," if the data is an array
     */
    getChannelValueStrRepresentation = () => {
        const rawChannelValue = this._getChannelValue(false);
        if (Array.isArray(rawChannelValue) && typeof rawChannelValue[0] === "string") {
            // concate the string
            return rawChannelValue.join("");
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

    // only for TextUpdate and TextEntry
    // they are suitable to display array data in various formats,
    // other types of widgets, such as Meter, Spinner, Tanks, ProgressBar, Thermometer, ScaledSlider are not for array data
    _getChannelValue = (raw: boolean = false) => {

        const channelValue = this.getChannelValueForMonitorWidget(raw);

        if (typeof channelValue === "number" || typeof channelValue === "string") {
            return this._parseChannelValueElement(channelValue);
        } else if (Array.isArray(channelValue)) {
            const result: any[] = [];
            for (let element of channelValue) {
                result.push(this._parseChannelValueElement(element));
            }
            if (this.getAllText()["format"] === "string") {
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

    static generateDefaultTdl = (): type_Talhk_tdl => {

        const defaultTdl: type_Talhk_tdl = {
            type: "Talhk",
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
                backgroundColor: "rgba(0, 0, 0, 0)",
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
                serverAddress: "",
            },
            channelNames: [],
            groupNames: [],
            rules: [],
        };
        return JSON.parse(JSON.stringify(defaultTdl));
    };

    generateDefaultTdl: () => any = Talhk.generateDefaultTdl;

    static generateWidgetTdl = (utilityOptions: Record<string, any>): type_Talhk_tdl => {
        const result = this.generateDefaultTdl();
        result.text["serverAddress"] = utilityOptions["serverAddress"];
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
            // this._sidebar = new TalhkSidebar(this);
        }
    }
}
