import * as GlobalMethods from "../../../common/GlobalMethods";
import { IpcEventArgType2 } from "../../../common/IpcEventArgType";
import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { GroupSelection2 } from "../../helperWidgets/GroupSelection/GroupSelection2";
import { EmbeddedDisplaySidebar } from "./EmbeddedDisplaySidebar";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { BaseWidgetRules } from "../BaseWidget/BaseWidgetRules";
import { Canvas } from "../../helperWidgets/Canvas/Canvas";
import { rendererWindowStatus } from "../../global/Widgets";
import { EmbeddedDisplayRule } from "./EmbeddedDisplayRule";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import * as path from "path";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { Log } from "../../../common/Log";
import { TcaChannel } from "../../channel/TcaChannel";
import { v4 as uuidv4 } from "uuid";
import { defaultEmbeddedDisplayTdl, type_EmbeddedDisplay_display_tdl, type_EmbeddedDisplay_tdl } from "../../../common/types/type_widget_tdl";

export class EmbeddedDisplay extends BaseWidget {

    _rules: BaseWidgetRules;

    _displays: type_EmbeddedDisplay_display_tdl[];
    _fullTdlFileName: string = "";
    // the widget keys for the currently selected tab
    _childWidgetKeys: string[] = [];

    readonly titleBarHeight = window.outerHeight - window.innerHeight;
    readonly _defaultTdlFileName = `../../../webpack/resources/tdls/blank-red.tdl`;
    isMovingByEmbeddedDisplay: boolean = false;
    _selectedTab = 0;
    _zerothDisplayCreated = false;

    // once assigned, never change
    iframeDisplayId: string = "";

    iframeBackgroundColor = 'rgba(0,0,0,0)';

    loadingText = "";


    static normalizeDisplays = (widgetTdl: type_EmbeddedDisplay_tdl | Record<string, any>): type_EmbeddedDisplay_display_tdl[] => {
        const rawWidgetTdl = widgetTdl as Record<string, any>;

        if (Array.isArray(rawWidgetTdl["displays"])) {
            return structuredClone(
                rawWidgetTdl["displays"].map((display: Record<string, any>) => ({
                    tdlFileName: typeof display?.["tdlFileName"] === "string" ? display["tdlFileName"] : "",
                    name: typeof display?.["name"] === "string" ? display["name"] : "",
                    macros: Array.isArray(display?.["macros"]) ? display["macros"] : [],
                    isWebpage: display?.["isWebpage"] === true,
                }))
            );
        }

        const tdlFileNames = Array.isArray(rawWidgetTdl["tdlFileNames"]) ? rawWidgetTdl["tdlFileNames"] : [];
        const itemNames = Array.isArray(rawWidgetTdl["itemNames"]) ? rawWidgetTdl["itemNames"] : [];
        const itemMacros = Array.isArray(rawWidgetTdl["itemMacros"]) ? rawWidgetTdl["itemMacros"] : [];
        const itemIsWebpage = Array.isArray(rawWidgetTdl["itemIsWebpage"]) ? rawWidgetTdl["itemIsWebpage"] : [];
        const displayCount = Math.max(tdlFileNames.length, itemNames.length, itemMacros.length, itemIsWebpage.length);

        return structuredClone(
            Array.from({ length: displayCount }, (_, index) => ({
                tdlFileName: typeof tdlFileNames[index] === "string" ? tdlFileNames[index] : "",
                name: typeof itemNames[index] === "string" ? itemNames[index] : "",
                macros: Array.isArray(itemMacros[index]) ? itemMacros[index] : [],
                isWebpage: itemIsWebpage[index] === true,
            }))
        );
    };

    constructor(widgetTdl: type_EmbeddedDisplay_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this.setReadWriteType("write");

        this._displays = EmbeddedDisplay.normalizeDisplays(widgetTdl);

        this._rules = new BaseWidgetRules(this, widgetTdl, EmbeddedDisplayRule);
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

    _ElementArea = (): React.JSX.Element => {
        const whiteSpace = this.getText().wrapWord ? "normal" : "pre";
        const justifyContent = this.getText().horizontalAlign;
        const alignItems = this.getText().verticalAlign;
        const outline = this._getElementAreaRawOutlineStyle();

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
                    whiteSpace: whiteSpace,
                    justifyContent: justifyContent,
                    alignItems: alignItems,
                    outline: outline,
                }}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >

                {this.getDisplays().length <= 1 || this.getText()["showTab"] === false ? null : (
                    <this._ElementTabs></this._ElementTabs>
                )}

                {this.loadingText}

                {g_widgets1.isEditing() === true ? "Embedded Display" : ""}

                <this._ElementIframe></this._ElementIframe>

            </div>
        );
    };

    _useMemoedElement(): boolean {
        if (this.isSelected()) {
            return false;
        } else {
            return g_widgets1.getForceUpdateWidgets().has(this.getWidgetKey()) ? false : true;
        }
    }

    _ElementIframe = () => {

        const webviewElementRef = React.useRef<HTMLIFrameElement>(null);

        let display: string = "none";
        let link = "";

        const selectedDisplay = this.getDisplay(this.getSelectedTab());

        if (g_widgets1.isEditing() === false && selectedDisplay?.isWebpage === true) {
            display = "";
            link = selectedDisplay.tdlFileName;
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
                {this.getDisplays().map((display, index: number) => {
                    return (
                        <div
                            key={`${display.name}-${index}-${display.tdlFileName}`}
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
                            }}
                            onMouseDown={(event) => {
                                event.preventDefault();
                                forceUpdate({});
                                this.selectTab(index);
                            }}
                        >
                            {display.name}
                        </div>
                    );
                })}
            </div>
        );
    };

    _Element = React.memo(this._ElementRaw, () => this._useMemoedElement());

    // ---------------------- helper functions ---------------------

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
            return;
        }

        if (this.getDisplays().length < 1) {
            this.loadingText = "";
            this.setSelectedTab(0);
            return;
        }

        if (index === this.getSelectedTab() && forceSelect === false) {
            return;
        }



        const oldDisplay = this.getDisplay(this.getSelectedTab());
        const oldTabIsWeb = oldDisplay?.isWebpage === true;
        const newDisplay = this.getDisplay(index);
        if (newDisplay === undefined) {
            return;
        }
        const newTabIsWeb = newDisplay.isWebpage === true;

        this.loadingText = `Loading ${newDisplay.tdlFileName}`;
        this.setSelectedTab(index);

        if (newTabIsWeb === false) {

            // process macros
            // macros from: (1) user input (2) Canvas where this widget resides
            // this is all the macros that the EmbeddedDisplay widget have
            const allMacros = this.getAllMacros();
            // macros defined in EmbeddedDisplay widget for this TDL
            const itemMacros = newDisplay.macros;
            // EmbeddedDisplay always inherits parent's macros
            const macros = [...itemMacros, ...allMacros];

            // process tdl file name
            // the tdl file name is expanded based on the macros for this EmbeddedDisplay widget
            // the itemMacros is for the child tdl 
            const tdlFileName = BaseWidget.expandChannelName(newDisplay.tdlFileName, allMacros);


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
            g_widgets1.removeWidget(childWidgetKey, false, false, true);

        }
        this.clearChildWidgetKeys();
    }

    loadDisplayFromTdl = (data: IpcEventArgType2["read-embedded-display-tdl"]) => {
        const { tdl, fullTdlFileName, macros, widgetWidth, widgetHeight, resize, tdlFileName } = data;
        const widgetKey = this.getWidgetKey();

        if (tdl === undefined || fullTdlFileName === undefined) {
            this.loadingText = `Failed to load ${tdlFileName}`;
            g_widgets1.addToForceUpdateWidgets(widgetKey);
            g_flushWidgets();
            return;
        }

        const canvasWidgetTdl = tdl["Canvas"];
        let scalingFactor = 1;
        if (resize === "fit") {
            const canvasWidth = canvasWidgetTdl.style["width"];
            const canvasHeight = canvasWidgetTdl.style["height"];
            if (typeof canvasHeight === "number" && typeof canvasWidth === "number") {
                scalingFactor = Math.min(widgetWidth / canvasWidth, widgetHeight / canvasHeight);
            }
        }

        const canvasBackgroundColor = canvasWidgetTdl["style"]["backgroundColor"];
        const canvasMacros = canvasWidgetTdl["macros"];
        const allMacros = [...macros, ...canvasMacros];

        this.setFullTdlFileName(fullTdlFileName);

        const embeddedDisplayWidgetTop = this.getStyle()["top"];
        const embeddedDisplayWidgetLeft = this.getStyle()["left"];
        this.getStyle()["backgroundColor"] = canvasBackgroundColor;

        const widgetMapPairs: [string, BaseWidget][] = [];

        this.removeChildWidgets();
        for (const widgetTdl of Object.values(tdl)) {
            if (!widgetTdl["widgetKey"].includes("Canvas")) {
                const oldWidgetKey = widgetTdl["widgetKey"];
                const newWidgetKey = oldWidgetKey.split("_")[0] + "_" + uuidv4();
                widgetTdl["widgetKey"] = newWidgetKey;
                widgetTdl["key"] = newWidgetKey;
                widgetTdl["style"]["top"] = widgetTdl["style"]["top"] * scalingFactor + embeddedDisplayWidgetTop;
                widgetTdl["style"]["left"] = widgetTdl["style"]["left"] * scalingFactor + embeddedDisplayWidgetLeft;
                widgetTdl["style"]["width"] = widgetTdl["style"]["width"] * scalingFactor;
                widgetTdl["style"]["height"] = widgetTdl["style"]["height"] * scalingFactor;
                widgetTdl["style"]["fontSize"] = widgetTdl["style"]["fontSize"] * scalingFactor;
                const widget = g_widgets1.createWidget(widgetTdl, false);
                if (widget instanceof BaseWidget) {
                    widget.setMacros(allMacros);
                    widget.setEmbeddedDisplayWidgetKey(widgetKey);
                    this.appendChildWidgetKey(newWidgetKey);
                    widget.jobsAsOperatingModeBegins();
                    widget.processChannelNames(allMacros);
                    widgetMapPairs.push([newWidgetKey, widget]);
                }
            }
        }

        this.loadingText = ``;

        const widgetsMap = g_widgets1.getWidgets();
        for (const widgetMapPair of widgetMapPairs) {
            widgetsMap.delete(widgetMapPair[0]);
        }
        g_widgets1._widgets = GlobalMethods.insertAfter(widgetsMap, widgetKey, widgetMapPairs);

        this.connectAllTcaChannels();
        g_widgets1.addToForceUpdateWidgets(widgetKey);
        g_flushWidgets();
    }

    /**
     * Similar to g_widgets1.connectAllTcaChannels()
     */
    connectAllTcaChannels = (reconnect: boolean = false) => {

        const tcaChannels: TcaChannel[] = [];

        // (1)
        for (let childWidgetKey of this.getChildWidgetKeys()) {
            const childWidget = g_widgets1.getWidget(childWidgetKey);
            if (childWidget instanceof BaseWidget) {
                for (let channelNameLevel3 of childWidget.getChannelNamesLevel3()) {
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


    // -------------------------- tdl -------------------------------

    static generateDefaultTdl = (): type_EmbeddedDisplay_tdl => {
        const widgetKey = GlobalMethods.generateWidgetKey(defaultEmbeddedDisplayTdl.type);
        return structuredClone({
            ...defaultEmbeddedDisplayTdl,
            widgetKey: widgetKey,
        });
    };

    generateDefaultTdl: () => type_EmbeddedDisplay_tdl = EmbeddedDisplay.generateDefaultTdl;

    // defined in super class
    getTdlCopy(newKey: boolean = true) {
        const result = super.getTdlCopy(newKey);
        result["displays"] = structuredClone(this.getDisplays());
        return result;
    }

    // --------------------- getters and setters -------------------------

    getDisplays = () => {
        return this._displays;
    };

    getDisplay = (index: number) => {
        return this.getDisplays()[index];
    };

    getTdlFileNames = () => {
        return this.getDisplays().map((display) => display.tdlFileName);
    };

    getItemNames = () => {
        return this.getDisplays().map((display) => display.name);
    };

    getItemMacros = () => {
        return this.getDisplays().map((display) => display.macros);
    };

    getDefaultTdlFileName = () => {
        return this._defaultTdlFileName;
    };

    getItemIsWebpage = () => {
        return this.getDisplays().map((display) => display.isWebpage);
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

    getSelectedTab = () => {
        return this._selectedTab;
    };

    setSelectedTab = (tabIndex: number) => {
        if (this.getDisplays().length < 1) {
            this._selectedTab = 0;
            return;
        }
        this._selectedTab = Math.min(Math.max(tabIndex, 0), this.getDisplays().length - 1);
    };

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


    jobsAsOperatingModeBegins(): void {
        if (this.getDisplays().length > 0) {
            this.selectTab(0, true);
        }
        super.jobsAsOperatingModeBegins()
    }

}
