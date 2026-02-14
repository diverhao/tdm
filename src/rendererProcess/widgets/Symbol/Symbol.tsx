import * as GlobalMethods from "../../../common/GlobalMethods";
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
    // Symbol specific
    itemNames: string[]; // imageNames
    itemValues: number[]; // PV value
    itemContents: string[]; // images contents
};

export class Symbol extends BaseWidget {
    _rules: SymbolRules;
    _itemNames: string[];
    _itemValues: number[];
    _itemContents: string[];

    constructor(widgetTdl: type_Symbol_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this.setReadWriteType("write");

        this._itemNames = JSON.parse(JSON.stringify(widgetTdl.itemNames));
        this._itemValues = JSON.parse(JSON.stringify(widgetTdl.itemValues));
        this._itemContents = JSON.parse(JSON.stringify(widgetTdl.itemContents));

        // itemNames and itemValues must match
        const count = Math.min(this._itemNames.length, this._itemValues.length);
        this._itemNames.splice(count);
        this._itemValues.splice(count);

        this._rules = new SymbolRules(this, widgetTdl);
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
        const justifyContent = allText.horizontalAlign;
        const alignItems = allText.verticalAlign;
        const outline = this._getElementAreaRawOutlineStyle();
        const backgroundColor = this._getElementAreaRawBackgroundStyle();

        return (
            <div
                style={{
                    display: "inline-flex",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                    overflow: "visible",
                    userSelect: "none",
                    justifyContent: justifyContent,
                    alignItems: alignItems,
                    outline: outline,
                    backgroundColor: backgroundColor,
                }}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                <this._ElementSymbol></this._ElementSymbol>
            </div>
        );
    };

    _Element = React.memo(this._ElementRaw, () => this._useMemoedElement());
    _ElementArea = React.memo(this._ElementAreaRaw, () => this._useMemoedElement());

    _ElementSymbol = () => {
        const allText = this.getAllText();
        const allStyle = this.getAllStyle();
        const objectFit = allText["stretchToFit"] ? "fill" : "scale-down";
        const width = allStyle["width"];
        const height = allStyle["height"];

        // find the corresponding image for current PV value
        let { index, value, fileName } = this.calcFileName();
        const fallbackFileNameRaw = allText["fileName"]; // unresolved fallback file name
        if (index < 0) {
            // cannot find the corresponding index
            // show the fallback image
            fileName = this.resolveFileName(fallbackFileNameRaw);
        }

        const [imageError, setImageError] = React.useState(false);
        React.useEffect(() => {
            setImageError(false);
        }, [fileName])

        if (imageError) {
            // if cannot find the image (regular image or fallback image), show a simple SVG
            return (
                <svg
                    width={width}
                    height={height}
                    viewBox="0 0 200 200"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ objectFit: objectFit }}
                >
                    <rect width="200" height="200" fill="#f5f5f5" />
                    <circle cx="100" cy="100" r="80" fill="none" stroke="#ddd" strokeWidth="2" />
                    <text
                        x="100"
                        y="100"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="36"
                        fill="#999"
                    >
                        {GlobalMethods.truncateString(`${value}`)}
                    </text>
                </svg>
            );
        } else {
            return (
                <img
                    src={fileName}
                    style={{
                        objectFit: objectFit,
                    }}
                    onError={(e) => {
                        // cannot find the corresponding image
                        setImageError(true);
                    }}
                    alt="..."
                    width={width}
                    height={height}
                ></img>
            )
        }
    }

    // -------------------- helper functions ----------------

    /**
     * resolve a file name, do not check if the file exists, this is handled in
     * on-error event
     * 
     * if the file name is a URI type image (e.g., data:image/...), return directly.
     * if the file name is relative, it is expanded with respect to the tdl file location.
     */
    resolveFileName = (fileName: string): string => {
        // if it's a URI type image (e.g., data:image/svg+xml;base64,...), return directly
        if (fileName.startsWith('data:')) {
            return fileName;
        }

        let absoluteFileName = fileName;

        // if a relative path, use TDL file foler as base path
        if (!path.isAbsolute(fileName)) {
            const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
            const tdlFileName = displayWindowClient.getTdlFileName();
            // if the TDL is on hard drive
            const tdlFileFolder = path.dirname(tdlFileName);
            return path.join(tdlFileFolder, fileName);
        } else {
            return absoluteFileName;
        }
    }

    /**
     * calculate the file name: compare the PV value with the this._itemValues
     * then resolve the corresponding this._itemNames (image names)
     * if cannot find the corresponding image, return the fallback image
     *
     */
    calcFileName = (): { index: number, value: any, fileName: string } => {
        // in editing mode, always show the first 
        if (g_widgets1.isEditing()) {
            return {
                index: 0,
                value: undefined,
                fileName: this.resolveFileName(`${this.getItemNames()[0]}`),
            };
        } else {
            const channelValue = this._getChannelValue(true);
            if (typeof channelValue !== "number") {
                return {
                    index: 0,
                    value: undefined,
                    fileName: this.resolveFileName(`${this.getItemNames()[0]}`),
                }
            }
            const index = this.getItemValues().indexOf(channelValue);
            return {
                index: index,
                value: channelValue,
                fileName: this.resolveFileName(`${this.getItemNames()[index]}`),
            }
        }

    };

    handleSelectAFile = (options: Record<string, any>, fileName: string) => {
        const itemIndex = options["itemIndex"];
        if (itemIndex !== undefined) {
            const sidebar = this.getSidebar();
            if (typeof itemIndex === "number" && sidebar !== undefined && sidebar instanceof SymbolSidebar) {
                sidebar.setBeingUpdatedItemIndex(itemIndex);
                sidebar.updateFromWidget(undefined, "select-a-file", fileName);
            }
        } else {
            this.getSidebar()?.updateFromWidget(undefined, "select-a-file-fallback-image", fileName);
        }
    };

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
                // fallback file name
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
            itemContents: [],
        };
        defaultTdl["widgetKey"] = GlobalMethods.generateWidgetKey(defaultTdl["type"]);
        return JSON.parse(JSON.stringify(defaultTdl));
    };

    generateDefaultTdl: () => any = Symbol.generateDefaultTdl;

    getTdlCopy(newKey: boolean = true): Record<string, any> {
        const result = super.getTdlCopy(newKey);
        result["itemValues"] = JSON.parse(JSON.stringify(this.getItemValues()));
        result["itemNames"] = JSON.parse(JSON.stringify(this.getItemNames()));
        result["itemContents"] = JSON.parse(JSON.stringify(this.getItemContents()));
        return result;
    }

    // --------------------- getters -------------------------

    getItemNames = () => {
        return this._itemNames;
    };
    getItemValues = () => {
        return this._itemValues;
    };
    getItemContents = () => {
        return this._itemContents;
    }

    // -------------------------- sidebar ---------------------------
    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new SymbolSidebar(this);
        }
    }
}
