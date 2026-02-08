import { GlobalVariables } from "../../../common/GlobalVariables";
import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { SymbolRules } from "./SymbolRules";
import { SymbolSidebar } from "./SymbolSidebar";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import path from "path";

export type type_Symbol_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
    itemNames: string[];
    itemValues: (number | string | number[] | string[] | undefined)[];
};

export class Symbol extends BaseWidget {
    _rules: SymbolRules;
    _itemNames: string[];
    _itemValues: (number | string | number[] | string[] | undefined)[];

    constructor(widgetTdl: type_Symbol_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this.setReadWriteType("write");

        this._itemNames = JSON.parse(JSON.stringify(widgetTdl.itemNames));
        this._itemValues = JSON.parse(JSON.stringify(widgetTdl.itemValues));

        this._rules = new SymbolRules(this, widgetTdl);
    }

    // ------------------------------ elements ---------------------------------

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
        this.widgetBeingRendered = true;
        React.useEffect(() => {
            this.widgetBeingRendered = false;
        });

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
                }}
                // title={"tooltip"}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                <this._ElementSymbol></this._ElementSymbol>
            </div>
        );
    };

    calcPictureWidth = () => { };

    calcFileName = (): string => {

        const fallbackFileName = this.calcFallbackFileName();

        if (this.getItemNames().length > 0) {
            if (g_widgets1.isEditing()) {
                const fileName = this.getItemNames()[0];
                if (fileName !== undefined) {
                    if (path.isAbsolute(fileName)) {
                        return fileName;
                    } else {
                        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
                        const tdlFileName = displayWindowClient.getTdlFileName();
                        if (tdlFileName !== "") {
                            const tdlFileFolder = path.dirname(tdlFileName);
                            return path.join(tdlFileFolder, fileName);
                        } else {
                            // return `../../../webpack/resources/webpages/tdm-logo.png`;
                            // return this.getAllText()["fileName"]
                            return fallbackFileName;
                        }

                    }
                }
            } else {
                // get raw number if it is enum type PV
                const channelValue = this._getChannelValue(true);
                const index = this.getItemValues().indexOf(channelValue);
                if (index > -1) {
                    const fileName = this.getItemNames()[index];
                    if (fileName !== undefined) {
                        if (path.isAbsolute(fileName)) {
                            return fileName;
                        } else {
                            const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
                            const tdlFileName = displayWindowClient.getTdlFileName();
                            if (tdlFileName !== "") {
                                const tdlFileFolder = path.dirname(tdlFileName);
                                console.log(tdlFileFolder, fileName)
                                return path.join(tdlFileFolder, fileName);
                            } else {
                                // return `../../../webpack/resources/webpages/tdm-logo.png`;
                                // return this.getAllText()["fileName"]
                                return fallbackFileName;

                            }

                        }
                    }
                }
            }
        }
        return fallbackFileName;
    };

    calcFallbackFileName = () => {
        // fallback file name 
        const fileName = this.getAllText()["fileName"];
        if (fileName !== undefined) {
            if (path.isAbsolute(fileName)) {
                return fileName;
            } else {
                const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
                const tdlFileName = displayWindowClient.getTdlFileName();
                if (tdlFileName !== "") {
                    const tdlFileFolder = path.dirname(tdlFileName);
                    return path.join(tdlFileFolder, fileName);
                }
            }
        }
        return fileName;
    }

    calcTextVisibility = () => {
        if (this.calcFileName() === this.getAllText()["fileName"]
            // `../../../webpack/resources/webpages/tdm-logo.png`
        ) {
            return "visible";
        } else {
            return "hidden";
        }
    };

    handleSelectAFile = (options: Record<string, any>, fileName: string) => {
        const itemIndex = options["itemIndex"];
        if (itemIndex !== undefined) {
            const sidebar = this.getSidebar();
            if (typeof itemIndex === "number" && sidebar !== undefined) {
                (sidebar as SymbolSidebar).setBeingUpdatedItemIndex(itemIndex);
                sidebar.updateFromWidget(undefined, "select-a-file", fileName);
            }
        } else {
            this.getSidebar()?.updateFromWidget(undefined, "select-a-file-fallback-image", fileName);
        }
    };

    _ElementSymbol = () => {
        return (
            <div
                style={{
                    opacity: this.getAllText()["invisibleInOperation"] === true && !g_widgets1.isEditing() ? 0 : 1,
                }}
            >
                <img
                    src={this.calcFileName()}
                    style={{
                        opacity: this.getAllText()["opacity"],
                        objectFit: this.getAllText()["stretchToFit"] ? "fill" : "scale-down",
                    }}
                    alt="..."
                    width={this.getAllStyle()["width"]}
                    height={this.getAllStyle()["height"]}
                ></img>
                <div
                    style={{
                        display: "inline-flex",
                        position: "absolute",
                        visibility: this.calcTextVisibility(),
                        justifyContent: "center",
                        alignItems: "center",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                    }}
                >
                    {this.getAllText()["showPvValue"] === true
                        ? `${this._getChannelValue()}${this.getAllText().showUnit ? this._getChannelUnit() : ""}`
                        : ""}
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

    static generateDefaultTdl = (): Record<string, any> => {

        const defaultTdl: type_Symbol_tdl = {
            type: "Symbol",
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
                fileName: "../../../webpack/resources/webpages/tdm-logo.svg",
                opacity: 1,
                stretchToFit: false,
                showPvValue: false,
                invisibleInOperation: false,
                alarmBorder: true,
                alarmBackground: false,
                alarmLevel: "MINOR",
            },
            channelNames: [],
            groupNames: [],
            rules: [],
            itemNames: [],
            itemValues: [],
        };
        return JSON.parse(JSON.stringify(defaultTdl));
    };

    generateDefaultTdl: () => any = Symbol.generateDefaultTdl;

    // overload
    getTdlCopy(newKey: boolean = true): Record<string, any> {
        const result = super.getTdlCopy(newKey);
        result["itemValues"] = JSON.parse(JSON.stringify(this.getItemValues()));
        result["itemNames"] = JSON.parse(JSON.stringify(this.getItemNames()));
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

    getItemNames = () => {
        return this._itemNames;
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
            this._sidebar = new SymbolSidebar(this);
        }
    }
}
