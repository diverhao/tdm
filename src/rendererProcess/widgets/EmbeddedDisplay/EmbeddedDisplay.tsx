import { GlobalVariables } from "../../../common/GlobalVariables";
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
import { Log } from "../../../common/Log";
import { TcaChannel } from "../../channel/TcaChannel";

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

    _rules: EmbeddedDisplayRules;

    _tdlFileNames: string[];
    _fullTdlFileName: string = "";
    // the widget keys for the currently selected tab
    _childWidgetKeys: string[] = [];

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

    loadingText = "";

    private _tdlCanvasWidth: number | string = 100;
    private _tdlCanvasHeight: number | string = 100;


    constructor(widgetTdl: type_EmbeddedDisplay_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this.setReadWriteType("write");

        this._tdlFileNames = JSON.parse(JSON.stringify(widgetTdl["tdlFileNames"]));
        this._itemNames = JSON.parse(JSON.stringify(widgetTdl["itemNames"]));
        this._itemMacros = JSON.parse(JSON.stringify(widgetTdl["itemMacros"]));
        this._itemIsWebpage = JSON.parse(JSON.stringify(widgetTdl["itemIsWebpage"]));

        this._rules = new EmbeddedDisplayRules(this, widgetTdl);
    }

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
        // guard the widget from double rendering
        this.widgetBeingRendered = true;
        React.useEffect(() => {
            this.widgetBeingRendered = false;
        });
        g_widgets1.removeFromForceUpdateWidgets(this.getWidgetKey());

        this.updateAllStyleAndText();

        // must do it for every widget
        // React.useEffect(() => {
        // 	if (!this.isMovingByEmbeddedDisplay && g_widgets1.isEditing()) {
        // 		this.updateEmbeddedDisplayBounds();
        // 	}
        // });

        // must do it for every widget
        //! shall we do it for this widget?
        // g_widgets1.removeFromForceUpdateWidgets(this.getWidgetKey());
        this.widgetBeingRendered = true;
        React.useEffect(() => {
            this.widgetBeingRendered = false;
        });

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
    _ElementBodyRaw = (): React.JSX.Element => {
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
    _ElementAreaRaw = ({ }: any): React.JSX.Element => {
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

                {this.getItemNames().length <= 1 || this.getText()["showTab"] === false ? null : (
                    <this._ElementTabs></this._ElementTabs>
                )}

                {this.loadingText}

                {g_widgets1.isEditing() === true ? "Embedded Display" : ""}

                <this._ElementIframe></this._ElementIframe>

            </div>
        );
    };

    _ElementIframe = () => {

        const webviewElementRef = React.useRef<any>(null);

        let display: string = "none";
        let link = "";

        if (g_widgets1.isEditing() === false && this.getItemIsWebpage()[this.getSelectedTab()] === true) {
            display = "";
            link = this.getTdlFileNames()[this.getSelectedTab()];
        }

        return (
            <iframe
                ref={webviewElementRef}
                src={link}
                id="embedded-display"
                width="100%"
                height="100%"
                style={{
                    border: "none",
                    display: display,
                    // backgroundColor: this.iframeBackgroundColor,
                }}
            ></iframe>
        )
    };



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

    // -------------------------- tdl -------------------------------

    static generateDefaultTdl = (): Record<string, any> => {

        const defaultTdl: type_EmbeddedDisplay_tdl = {
            type: "EmbeddedDisplay",
            widgetKey: "", // "key" is a reserved keyword
            key: "",
            // the style for outmost div
            // these properties are explicitly defined in style because they are
            // (1) different from default CSS settings, or
            // (2) they may be modified
            style: {
                position: "absolute",
                display: "inline-flex",
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
                resize: "none", // "none" "fit"
            },
            channelNames: [],
            groupNames: [],
            rules: [],
            tdlFileNames: [],
            itemNames: [],
            itemMacros: [],
            itemIsWebpage: [],
        };
        return JSON.parse(JSON.stringify(defaultTdl));
    };

    generateDefaultTdl: () => any = EmbeddedDisplay.generateDefaultTdl;

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


    // ---------------------- embedded display ---------------------

    getSelectedTab = () => {
        return this._selectedTab;
    };

    setSelectedTab = (tabIndex: number) => {
        this._selectedTab = tabIndex;
    };

    /**
     * (1) read tdl file for new tab
     * 
     * (2) extract background and macros information, skip script
     * 
     * (3) change this widget's background
     * 
     * (4) remove old Tab's widgets
     *       disconnect their tca Channels
     * 
     * (4.1) modify widgets tdls with new widget keys
     *       modify their left and top
     * 
     * (5) create widgets objects (BaseWidget) for each widget, except Canvas
     *     each widget's insideEmbeddedDisplay is true
     * 
     * (5.1) set the widget's macros (BaseWidget._macros) to the combination of EmbeddedDisplay-defined
     *       and the tdl file's Canvas defined
     * 
     * (6) change the children widgets to be inside EmbeddedDisplay
     *     register these widgets in this EmbeddedDisplay
     * 
     * 
     * (7.1) run widget.jobsAsOperatingModeBegins() for all children widgets
     * 
     * (7.2) re-process channel names with macros provided by EmbeddedDisplay, 
     *       the previous jobsAsOperatingModeBegins() already did that, but without external macros
     *
     * (7.3) apply macros, this has been done in jobsAsOperatingModeBegins(), but we need to
     *       do it again to apply macros from parent EmbeddedDisplay
     * 
     * (8) connect channels
     * 
     * (8.1) remove all children widgets in this EmbeddedDisplay
     * 
     * (9) force update these widgets
     * 
     */
    selectTab = (index: number, forceSelect: boolean = false) => {
        if (g_widgets1.isEditing()) {
            // do nothing
            return;
        }
        if (index === this.getSelectedTab() && forceSelect === false) {
            return;
        }
        this.loadingText = `Loading ${this.getTdlFileNames()[index]}`;

        const oldTab = this.getSelectedTab();
        const oldTabIsWeb = this.getItemIsWebpage()[oldTab];
        const newTab = index;
        const newTabIsWeb = this.getItemIsWebpage()[newTab];

        this.setSelectedTab(index);

        if (newTabIsWeb === false) {

            // macros from: (1) user input (2) Canvas where this widget resides
            // this is all the macros that the EmbeddedDisplay widget have
            const allMacros = this.getAllMacros();
            // macros defined in EmbeddedDisplay widget for this TDL
            const itemMacros = this.getItemMacros()[newTab];

            // EmbeddedDisplay always inherits parent's macros
            const macros = [...itemMacros, ...allMacros];

            let tdlFileName = this.getTdlFileNames()[this.getSelectedTab()];
            // the tdl file name is expanded based on the macros for this EmbeddedDisplay widget
            // the itemMacros is for the child tdl 
            tdlFileName = BaseWidget.expandChannelName(tdlFileName, allMacros);


            if (typeof tdlFileName === "string") {
                const ipcManager = g_widgets1.getRoot().getDisplayWindowClient().getIpcManager();
                let currentTdlFolder = path.dirname(g_widgets1.getRoot().getDisplayWindowClient().getTdlFileName());

                // if this EmbeddedDisplay is inside another EmbeddedDisplay
                // use the parent EmbeddedDisplay's path
                if (this.getEmbeddedDisplayWidgetKey() !== "") {
                    const parentWidget = g_widgets1.getWidget(this.getEmbeddedDisplayWidgetKey());
                    if (parentWidget instanceof EmbeddedDisplay) {
                        const parentFullTdlFileName = parentWidget.getFullTdlFileName();
                        if (parentFullTdlFileName !== "") {
                            currentTdlFolder = path.dirname(parentFullTdlFileName);
                        }
                    }
                }

                ipcManager.sendFromRendererProcess("read-embedded-display-tdl", {
                    displayWindowId: g_widgets1.getRoot().getDisplayWindowClient().getWindowId(),
                    widgetKey: this.getWidgetKey(),
                    tdlFileName: tdlFileName,
                    // these macros are passed down to the widgets in TDL file, 
                    // these macros are assigned to _macros for these widgets
                    // In this way, we can pass all the parent display's macros and the item macros down
                    // to each widget inside the EmbeddedDisplay's TDL file
                    macros: macros,
                    currentTdlFolder: currentTdlFolder,
                    widgetWidth: this.getStyle()["width"],
                    widgetHeight: this.getStyle()["height"],
                    resize: this.getText()["resize"],
                })
            }
        } else if (oldTabIsWeb === false && newTabIsWeb === true) {
            this.loadingText = "";

            // clear the child widgets
            this.removeChildWidgets();
            // change the background color
            this.getStyle()["backgroundColor"] = "rgba(255,255,255,1)";
        } else if (oldTabIsWeb === true && newTabIsWeb === true) {
            this.loadingText = "";
            // do nothing
        }
        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        g_flushWidgets();

    };

    /**
     * Remove all child widgets and disconnect TCA channels in them
     */
    removeChildWidgets = () => {
        for (const childWidgetKey of this.getChildWidgetKeys()) {
            const childWidget = g_widgets1.getWidget(childWidgetKey);
            if (childWidget instanceof EmbeddedDisplay) {
                childWidget.removeChildWidgets();
            }
            console.log("removing", childWidgetKey)
            g_widgets1.removeWidget(childWidgetKey, false, false, true);

        }
        this.clearChildWidgetKeys();
    }

    // -------------------------- sidebar ---------------------------
    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new EmbeddedDisplaySidebar(this);
        }
    };

    /**
     * (1) remove the widgets from g_widgets1._widgets
     * 
     * (2) clear this._childWidgetKeys
     */
    jobsAsEditingModeBegins() {
        this.loadingText = "";
        this.removeChildWidgets();
        super.jobsAsEditingModeBegins();
    }

    /**
     * An item's macro may be "S=${S1}", where "S1" is this display window's macro <br>
     * 
     * It is the same as ActionButton.expandExternalMacros()
     */
    // expandItemMacros = (itemIndex: number) => {
    //     const expandedItemMacros: [string, string][] = [];
    //     let itemMacros = this.getItemMacros()[itemIndex];
    //     if (itemMacros === null || itemMacros === undefined) {
    //         itemMacros = [];
    //     }
    //     if (itemMacros !== undefined) {
    //         const canvas = g_widgets1.getWidget2("Canvas");
    //         if (canvas instanceof Canvas) {
    //             const thisDisplayMacros = canvas.getMacros();
    //             for (let macro of itemMacros) {
    //                 expandedItemMacros.push([macro[0], BaseWidget.expandChannelName(macro[1], thisDisplayMacros)]);
    //             }
    //             if (this.getText()["useParentMacros"]) {
    //                 expandedItemMacros.push(...thisDisplayMacros)
    //             }
    //         }
    //     }
    //     return expandedItemMacros;
    // }



    jobsAsOperatingModeBegins(): void {
        this.selectTab(0, true);
        super.jobsAsOperatingModeBegins()
    }

    /**
     * Similar to g_widgets1.connectAllTcaChannels()
     */
    connectAllTcaChannels = (reconnect: boolean = false) => {

        const tcaChannels: TcaChannel[] = [];

        // (1)
        for (let childWidgetKey of this.getChildWidgetKeys()) {
            Log.info("---", childWidgetKey)
            const childWidget = g_widgets1.getWidget(childWidgetKey);
            Log.info("===", childWidget)
            if (childWidget instanceof BaseWidget) {
                for (let channelNameLevel3 of childWidget.getChannelNamesLevel3()) {
                    Log.info("connect all tca channels", channelNameLevel3)
                    const tcaChannel = g_widgets1.createTcaChannel(channelNameLevel3, childWidgetKey);
                    if (tcaChannel instanceof TcaChannel) {
                        tcaChannels.push(tcaChannel);
                    }
                }
            }
        }
        for (let tcaChannel of tcaChannels) {
            // (2)
            // level 4 channel name
            const channelName = tcaChannel.getChannelName();
            if (TcaChannel.checkChannelName(channelName) === "local" || TcaChannel.checkChannelName(channelName) === "global") {
                // if the initial dbr data is different from default, put init values
                const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
                const displayWindowId = displayWindowClient.getWindowId();
                // the meta data is extracted in TcaChannel constructor
                tcaChannel.put(displayWindowId, tcaChannel.getDbrData(), 1);
            }
            if (TcaChannel.checkChannelName(channelName) === "pva") {
                tcaChannel.fetchPvaType(undefined);
            } else {
                tcaChannel.getMeta(undefined);
            }
            // (3)
            tcaChannel.monitor();
        }
    };

    setFullTdlFileName = (newName: string) => {
        this._fullTdlFileName = newName;
    }

    getFullTdlFileName = () => {
        return this._fullTdlFileName;
    }

    getChildWidgetKeys = () => {
        return this._childWidgetKeys;
    }

    clearChildWidgetKeys = () => {
        this._childWidgetKeys.length = 0;
    }

    appendChildWidgetKey = (newWidgetKey: string) => {
        this._childWidgetKeys.push(newWidgetKey);
    }

}
