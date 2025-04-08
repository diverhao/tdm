import { GlobalVariables } from "../../global/GlobalVariables";
import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { GroupSelection2 } from "../../helperWidgets/GroupSelection/GroupSelection2";
import { EmbeddedDisplaySidebar } from "./EmbeddedDisplaySidebar";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { Canvas } from "../../helperWidgets/Canvas/Canvas";
import { rendererWindowStatus } from "../../global/Widgets";
import { EmbeddedDisplayRules } from "./EmbeddedDisplayRules";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import * as path from "path";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { Log } from "../../../mainProcess/log/Log";

export type type_EmbeddedDisplay_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
    tdlFileNames: string[];
    itemNames: string[];
    itemMacros: [string, string][][];
    itemIsWebpage: boolean[];
};

export class EmbeddedDisplay extends BaseWidget {
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

    _rules: EmbeddedDisplayRules;

    _tdlFileNames: string[];
    _itemNames: string[];
    _itemMacros: [string, string][][];
    _itemIsWebpage: boolean[];

    readonly titleBarHeight = window.outerHeight - window.innerHeight;
    readonly _defaultTdlFileName = `../../../webpack/resources/tdls/blank-red.tdl`;
    isMovingByEmbeddedDisplay: boolean = false;
    _selectedTab = 0;
    // toBeSelectedTab = 0;
    _zerothDisplayCreated = false;

    // once assigned, never change
    iframeDisplayId: string = "";

    iframeBackgroundColor = 'rgba(0,0,0,0)';


    constructor(widgetTdl: type_EmbeddedDisplay_tdl) {
        super(widgetTdl);

        this.setStyle({ ...EmbeddedDisplay._defaultTdl.style, ...widgetTdl.style });
        this.setText({ ...EmbeddedDisplay._defaultTdl.text, ...widgetTdl.text });

        // this._rules = new TextUpdateRules(this, widgetTdl);
        this._tdlFileNames = JSON.parse(JSON.stringify(widgetTdl["tdlFileNames"]));
        this._itemNames = JSON.parse(JSON.stringify(widgetTdl["itemNames"]));
        this._itemMacros = JSON.parse(JSON.stringify(widgetTdl["itemMacros"]));
        this._itemIsWebpage = JSON.parse(JSON.stringify(widgetTdl["itemIsWebpage"]));

        this._rules = new EmbeddedDisplayRules(this, widgetTdl);

        // this._sidebar = new EmbeddedDisplaySidebar(this);

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
    _useMemoedElement(): boolean {
        if (this.isSelected()) {
            return false;
        } else {
            return g_widgets1.getForceUpdateWidgets().has(this.getWidgetKey()) ? false : true;
        }
    }
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
        // React.useEffect(() => {
        // 	if (!this.isMovingByEmbeddedDisplay && g_widgets1.isEditing()) {
        // 		this.updateEmbeddedDisplayBounds();
        // 	}
        // });

        // must do it for every widget
        //! shall we do it for this widget?
        // g_widgets1.removeFromForceUpdateWidgets(this.getWidgetKey());
        this.renderChildWidgets = true;
        React.useEffect(() => {
            this.renderChildWidgets = false;
        });

        // type type_options_createDisplayWindow = {
        // 	tdl: type_tdl;
        // 	mode: "editing" | "operating";
        // 	editable: boolean;
        // 	tdlFileName: string;
        // 	macros: [string, string][];
        // 	replaceMacros: boolean;
        // 	hide: boolean;
        // 	utilityType?: string;
        // 	utilityOptions?: Record<string, any>;
        // };


        return (
            <ErrorBoundary style={this.getStyle()} widgetKey={this.getWidgetKey()}>
                <>
                    <this._ElementBody></this._ElementBody>
                    {this._showSidebar() ? this._sidebar?.getElement() : null}
                </>
            </ErrorBoundary>
        );
    };

    // Text area and resizers
    _ElementBodyRaw = (): JSX.Element => {
        return (
            // always update the div below no matter the TextUpdateBody is .memo or not
            // TextUpdateResizer does not update if it is .memo
            <div style={this.getElementBodyRawStyle()}>
                <this._ElementArea></this._ElementArea>
                {this._showResizers() ? <this._ElementResizer /> : null}
            </div>
        );
    };

    // only shows the text, all other style properties are held by upper level _ElementBodyRaw
    _ElementAreaRaw = ({ }: any): JSX.Element => {
        return (
            <div
                style={{
                    display: "inline-flex",
                    position: "relative",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    userSelect: "none",
                    overflow: "visible",
                    whiteSpace: this.getText().wrapWord ? "normal" : "pre",
                    justifyContent: this.getText().horizontalAlign,
                    alignItems: this.getText().verticalAlign,
                    fontFamily: this.getStyle().fontFamily,
                    fontSize: this.getStyle().fontSize,
                    fontStyle: this.getStyle().fontStyle,
                    fontWeight: this.getStyle().fontWeight,
                    outline: this._getElementAreaRawOutlineStyle(),
                }}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                {/* {`${this._getChannelValue()}${this.getText().showUnit ? this._getChannelUnit() : ""}`} */}

                {this.getItemNames().length <= 1 || this.getText()["showTab"] === false ? null : (
                    <this._ElementTabs></this._ElementTabs>
                )}

                <this._ElementIframe></this._ElementIframe>
                {/* <this._ElementMask></this._ElementMask> */}
            </div>
        );
    };

    _ElementIframe = () => {
        if (g_widgets1.isEditing()) {
            return (
                <this._ElementIframeInEditing></this._ElementIframeInEditing>
            )
        } else {
            return (
                <this._ElementIframeInOperating></this._ElementIframeInOperating>
            );
        }
    }

    _ElementIframeInEditing = () => {
        return <div style={{
            width: "100%",
            height: "100%",
            position: "absolute",
            top: 0,
            left: 0,
            display: "inline-flex",
            justifyContent: 'center',
            alignItems: "center",
        }}>
            Embedded display
        </div>
    }

    _ElementIframeInOperating = () => {

        const iframeElementRef = React.useRef<any>(null);
        const webviewElementRef = React.useRef<any>(null);

        React.useEffect(() => {
            if (iframeElementRef.current !== null) {
                iframeElementRef.current.style["backgroundColor"] = this.iframeBackgroundColor;
            }
        });

        if (this.getItemIsWebpage()[this.getSelectedTab()] === true) {
            let tdlFileName = this.getTdlFileNames()[this.getSelectedTab()];
            const link = tdlFileName;
            return (
                <iframe
                    ref={webviewElementRef}
                    src={link}
                    id="embedded-display"
                    width="100%"
                    height="100%"
                    style={{
                        border: "none",
                        backgroundColor: this.iframeBackgroundColor,
                    }}
                ></iframe>
            )
        } else {
            const ipcServerPort = g_widgets1.getRoot().getDisplayWindowClient().getIpcManager().getIpcServerPort();
            const mainProcessMode = g_widgets1.getRoot().getDisplayWindowClient().getMainProcessMode();

            let iframeSrc = `../../../mainProcess/windows/DisplayWindow/DisplayWindow.html?ipcServerPort=${ipcServerPort}&displayWindowId=${this.iframeDisplayId}`;
            if (mainProcessMode === "web") {
                const currentSite = `https://${window.location.host}/`;
                iframeSrc = `${currentSite}DisplayWindow.html?displayWindowId=${this.iframeDisplayId}`
            }
            return (
                <iframe
                    ref={iframeElementRef}
                    src={iframeSrc}
                    name="embedded-display"
                    id="embedded-display"
                    width="100%"
                    height="100%"
                    
                    referrerPolicy="no-referrer"
                    // ! iframe and its parent share the same sessionStorage, which causes an issue 
                    // ! that we cannot refresh the web page
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                    // sandbox="allow-scripts"
                    style={{
                        border: "none",
                        backgroundColor: this.iframeBackgroundColor,
                    }}
                >
                </iframe>
            );
        }
    };

    loadHtml = (iframeDisplayId: string) => {
        Log.info("load html", iframeDisplayId, this.getSelectedTab())
        this.iframeDisplayId = iframeDisplayId;
        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        g_flushWidgets();
    };

    setIframeBackgroundColor = (tdlBackgroundColor: string) => {
        this.iframeBackgroundColor = tdlBackgroundColor;
    }


    calcTabsLeft = () => {
        switch (this.getText()["tabPosition"]) {
            case "top":
                return 0;
            case "left":
                return -1 * this.getText()["tabWidth"] - 8 - this.getStyle()["borderWidth"];
            case "bottom":
                return 0;
            case "right":
                return this.getStyle()["width"] + 8 + this.getStyle()["borderWidth"];
            default:
                Log.error("Error in tab calculation");
        }
    };
    calcTabsTop = () => {
        switch (this.getText()["tabPosition"]) {
            case "top":
                return -1 * this.getText()["tabHeight"] - 8 - this.getStyle()["borderWidth"];
            case "left":
                return 0;
            case "bottom":
                return this.getStyle()["height"] + 8 + this.getStyle()["borderWidth"];
            case "right":
                return 0;
            default:
                Log.error("Error in tab calculation");
        }
    };

    _ElementTabs = () => {
        const [, forceUpdate] = React.useState({});
        return (
            <div
                style={{
                    display: "inline-flex",
                    flexDirection: this.getText()["tabPosition"] === "top" || this.getText()["tabPosition"] === "bottom" ? "row" : "column",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    width:
                        this.getText()["tabPosition"] === "top" || this.getText()["tabPosition"] === "bottom" ? "100%" : this.getText()["tabWidth"],
                    height:
                        this.getText()["tabPosition"] === "top" || this.getText()["tabPosition"] === "bottom" ? this.getText()["tabHeight"] : "100%",
                    position: "absolute",
                    left: this.calcTabsLeft(),
                    top: this.calcTabsTop(),
                }}
            >
                {this.getItemNames().map((itemName: string, index: number) => {
                    return (
                        <div
                            key={`${itemName}-${index}-${this.getTdlFileNames()[index]}`}
                            style={{
                                display: "inline-flex",
                                justifyContent: this.getText()["horizontalAlign"],
                                alignItems: "center",
                                width:
                                    this.getText()["tabPosition"] === "top" || this.getText()["tabPosition"] === "bottom"
                                        ? this.getText()["tabWidth"]
                                        : "100%",
                                height: this.getText()["tabHeight"],
                                backgroundColor:
                                    this.getSelectedTab() === index ? this.getText()["tabSelectedColor"] : this.getText()["tabDefaultColor"],
                                // border: "solid 1px black",
                                fontWeight: this.getSelectedTab() === index ? "bold" : "normal",
                                overflow: "hidden",
                                whiteSpace: "nowrap",
                                padding: 4,
                                borderRadius: 4,
                                margin: 3,
                                // marginBottom: 5,
                                // marginTop: 15,
                                // marginLeft: 15,
                            }}
                            onMouseDown={(event: any) => {
                                event.preventDefault();
                                forceUpdate({});
                                this.selectTab(index);
                            }}
                        >
                            {itemName}
                        </div>
                    );
                })}
            </div>
        );
    };


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

    _getChannelValue = () => {
        const value = this._getFirstChannelValue();
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


    handleSelectAFile = (options: Record<string, any>, fileName: string) => {
        const itemIndex = options["itemIndex"];
        const sidebar = this.getSidebar();
        if (typeof itemIndex === "number" && sidebar !== undefined) {
            (sidebar as EmbeddedDisplaySidebar).setBeingUpdatedItemIndex(itemIndex);
            sidebar.updateFromWidget(undefined, "select-a-file", fileName);
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
    static _defaultTdl: type_EmbeddedDisplay_tdl = {
        type: "EmbeddedDisplay",
        widgetKey: "", // "key" is a reserved keyword
        key: "",
        // the style for outmost div
        // these properties are explicitly defined in style because they are
        // (1) different from default CSS settings, or
        // (2) they may be modified
        style: {
            position: "absolute",
            display: "inline-block",
            backgroundColor: "rgba(240, 240, 240, 1)",
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
            borderColor: "rgba(180, 180, 180, 1)",
            fontFamily: GlobalVariables.defaultFontFamily,
            fontSize: GlobalVariables.defaultFontSize,
            fontStyle: GlobalVariables.defaultFontStyle,
            fontWeight: GlobalVariables.defaultFontWeight,
        },
        // the ElementBody style
        text: {
            horizontalAlign: "flex-start",
            verticalAlign: "flex-start",
            wrapWord: true,
            showUnit: false,
            alarmBorder: false,
            useParentMacros: false,
            useExternalMacros: false,
            tabPosition: "top",
            tabWidth: 100,
            tabHeight: 20,
            tabSelectedColor: "rgba(180,180,180,1)",
            tabDefaultColor: "rgba(220,220,220,1)",
            showTab: true,
            isWebpage: false,
        },
        channelNames: [],
        groupNames: [],
        rules: [],
        tdlFileNames: [""],
        itemNames: ["label1"],
        itemMacros: [[["a", "b"]]],
        itemIsWebpage: [false],
    };

    // not getDefaultTdl(), always generate a new key
    static generateDefaultTdl = (type: string): Record<string, any> => {
        const result = super.generateDefaultTdl(type);
        result.style = JSON.parse(JSON.stringify(this._defaultTdl.style));
        result.text = JSON.parse(JSON.stringify(this._defaultTdl.text));
        result.channelNames = JSON.parse(JSON.stringify(this._defaultTdl.channelNames));
        result.groupNames = JSON.parse(JSON.stringify(this._defaultTdl.groupNames));
        result.tdlFileNames = JSON.parse(JSON.stringify(this._defaultTdl.tdlFileNames));
        result.itemNames = JSON.parse(JSON.stringify(this._defaultTdl.itemNames));
        result.itemMacros = JSON.parse(JSON.stringify(this._defaultTdl.itemMacros));
        result.itemIsWebpage = JSON.parse(JSON.stringify(this._defaultTdl.itemIsWebpage));
        return result;
    };

    // defined in super class
    getTdlCopy(newKey: boolean = true) {
        const result = super.getTdlCopy(newKey);
        result["tdlFileNames"] = JSON.parse(JSON.stringify(this.getTdlFileNames()));
        result["itemNames"] = JSON.parse(JSON.stringify(this.getItemNames()));
        result["itemMacros"] = JSON.parse(JSON.stringify(this.getItemMacros()));
        result["itemIsWebpage"] = JSON.parse(JSON.stringify(this.getItemIsWebpage()));
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

    getTdlFileNames = () => {
        return this._tdlFileNames;
    };

    getItemNames = () => {
        return this._itemNames;
    };

    getItemMacros = () => {
        return this._itemMacros;
    };

    getDefaultTdlFileName = () => {
        return this._defaultTdlFileName;
    };

    getItemIsWebpage = () => {
        return this._itemIsWebpage;
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

    // ---------------------- embedded display ---------------------

    getSelectedTab = () => {
        return this._selectedTab;
    };

    setSelectedTab = (tabIndex: number) => {
        this._selectedTab = tabIndex;
    };

    selectTab = (index: number) => {
        if (g_widgets1.isEditing()) {
            // do nothing
            return;
        }
        if (index === this.getSelectedTab()) {
            return;
        }


        const ipcManager = g_widgets1.getRoot().getDisplayWindowClient().getIpcManager();


        const oldTab = this.getSelectedTab();
        const oldTabIsWeb = this.getItemIsWebpage()[oldTab];
        const newTab = index;
        const newTabIsWeb = this.getItemIsWebpage()[newTab];

        const macros = this.expandItemMacros(newTab);

        this.setSelectedTab(index);

        this.iframeDisplayId = "";

        let tdlFileName = this.getTdlFileNames()[this.getSelectedTab()];
        tdlFileName = BaseWidget.expandChannelName(tdlFileName, macros);

        // web --> web
        // web --> tdl
        // tdl --> web
        // tdl --> tdl
        if (oldTabIsWeb === true && newTabIsWeb === true) {
            // do nothing
        } else if (oldTabIsWeb === true && newTabIsWeb === false) {
            ipcManager.sendFromRendererProcess("obtain-iframe-uuid", {
                displayWindowId: g_widgets1.getRoot().getDisplayWindowClient().getWindowId(),
                widgetKey: this.getWidgetKey(),
                mode: g_widgets1.isEditing() ? "editing" : "operating",
                tdlFileName: tdlFileName,
                macros: macros,
                currentTdlFolder: path.dirname(g_widgets1.getRoot().getDisplayWindowClient().getTdlFileName()),
                replaceMacros: this.getAllText()["useParentMacros"]
            });
        } else if (oldTabIsWeb === false && newTabIsWeb === true) {
            const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
            if (this.iframeDisplayId !== "") {
                displayWindowClient.getIpcManager().sendFromRendererProcess("close-iframe-display", {
                    displayWindowId: this.iframeDisplayId,
                })
            }
        } else {
            ipcManager.sendFromRendererProcess("switch-iframe-display-tab", {
                displayWindowId: g_widgets1.getRoot().getDisplayWindowClient().getWindowId(),
                widgetKey: this.getWidgetKey(),
                mode: g_widgets1.isEditing() ? "editing" : "operating",
                tdlFileName: tdlFileName,
                macros: macros,
                currentTdlFolder: path.dirname(g_widgets1.getRoot().getDisplayWindowClient().getTdlFileName()),
                iframeDisplayId: this.iframeDisplayId,
            });
        }
        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        g_flushWidgets();

    };

    // -------------------------- sidebar ---------------------------
    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new EmbeddedDisplaySidebar(this);
        }
    };

    jobsAsEditingModeBegins() {
        // tell main process to terminate the current iframe session, invokes "closed" event handler
        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
        if (this.iframeDisplayId !== "") {
            displayWindowClient.getIpcManager().sendFromRendererProcess("close-iframe-display", {
                displayWindowId: this.iframeDisplayId,
            })
        }
        super.jobsAsEditingModeBegins();
    }

    /**
     * An item's macro may be "S=${S1}", where "S1" is this display window's macro <br>
     * 
     * It is the same as ActionButton.expandExternalMacros()
     */
    expandItemMacros = (itemIndex: number) => {
        const expandedItemMacros: [string, string][] = [];
        let itemMacros = this.getItemMacros()[itemIndex];
        if (itemMacros === null || itemMacros === undefined) {
            itemMacros = [];
        }
        if (itemMacros !== undefined) {
            const canvas = g_widgets1.getWidget2("Canvas");
            if (canvas instanceof Canvas) {
                const thisDisplayMacros = canvas.getAllMacros();
                for (let macro of itemMacros) {
                    expandedItemMacros.push([macro[0], BaseWidget.expandChannelName(macro[1], thisDisplayMacros)]);
                }
                if (this.getText()["useParentMacros"]) {
                    expandedItemMacros.push(...thisDisplayMacros)
                }

            }
        }
        return expandedItemMacros;
    }

    jobsAsOperatingModeBegins(): void {
        // connect the currently selected tab
        this.iframeDisplayId = "";
        let macros = this.expandItemMacros(0);

        let tdlFileName = this.getTdlFileNames()[this.getSelectedTab()];
        tdlFileName = BaseWidget.expandChannelName(tdlFileName, macros);

        const ipcManager = g_widgets1.getRoot().getDisplayWindowClient().getIpcManager();
        ipcManager.sendFromRendererProcess("obtain-iframe-uuid", {
            displayWindowId: g_widgets1.getRoot().getDisplayWindowClient().getWindowId(),
            widgetKey: this.getWidgetKey(),
            mode: g_widgets1.isEditing() ? "editing" : "operating",
            tdlFileName: tdlFileName,
            macros: macros,
            currentTdlFolder: path.dirname(g_widgets1.getRoot().getDisplayWindowClient().getTdlFileName()),
            replaceMacros: this.getText()["useParentMacros"]
        });

        super.jobsAsOperatingModeBegins()
    }

}
