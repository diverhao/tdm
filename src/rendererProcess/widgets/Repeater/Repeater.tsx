import * as React from "react";
import { MouseEvent } from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { GlobalVariables } from "../../../common/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { GroupSelection2 } from "../../helperWidgets/GroupSelection/GroupSelection2";
import { RepeaterSidebar } from "./RepeaterSidebar";
import * as GlobalMethods from "../../../common/GlobalMethods";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { Log } from "../../../common/Log";
import { rendererWindowStatus } from "../../global/Widgets";
import path from "path";
import { Canvas } from "../../helperWidgets/Canvas/Canvas";
import { type_tdl } from "../../../common/GlobalVariables";

export type type_Repeater_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
    // itemNames: string[];
    // itemBackgroundColors: string[];
    widgetKeys: string[];
    macros: [string, string][][]; // this macro is for this Repeater widget only, not the macro for the whole display
};

export class Repeater extends BaseWidget {

    _widgetKeys: string[];
    _tabMacros: [string, string][][] = [];

    constructor(widgetTdl: type_Repeater_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this.setReadWriteType("write");

        this._widgetKeys = JSON.parse(JSON.stringify(widgetTdl["widgetKeys"]));
        this._tabMacros = JSON.parse(JSON.stringify(widgetTdl["macros"]));
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

        // do it once, bring this box to bottom
        React.useEffect(() => {
            g_widgets1.moveWidgetsInZ([this.getWidgetKey()], "back", false);
        }, []);

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
            <div
                style={
                    this.getElementBodyRawStyle()
                }
            >
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
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    userSelect: "none",
                    overflow: "hidden",
                    whiteSpace: this.getText().wrapWord ? "pre-line" : "nowrap",
                    justifyContent: this.getText().horizontalAlign,
                    alignItems: this.getText().verticalAlign,
                    fontFamily: this.getStyle().fontFamily,
                    fontSize: this.getStyle().fontSize,
                    fontStyle: this.getStyle().fontStyle,
                    fontWeight: this.getStyle().fontWeight,
                    outline: this._getElementAreaRawOutlineStyle(),
                }}
            >

                {g_widgets1.isEditing() === true ? <this._ElementGroups></this._ElementGroups> : <this._ElementIframeInOperating></this._ElementIframeInOperating>}
            </div>
        );
    };

    _ElementGroups = () => {
        // todo: looks like we don't need this, it causes flash when we start to move the Group widget
        // what does it do?
        // do it once
        React.useEffect(() => {
            this.updateGroup();
            g_flushWidgets();
        }, []);

        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                }}
            >
                <this._ElementGroup></this._ElementGroup>
            </div>
        );
    };


    /**
     * [[["SYS", "RNG"], ["SUBSYS", "BPM"]], [["SYS", "BST"], ["SUBSYS", "BLM"]]] --> "SYS=RNG, SUBSYS=BPM\n SYS=BST, SUBSYS=BLM"
     */
    serializeMacros = () => {
        const macros = this.getTabMacros();
        let result: string = "";
        for (const rowMacros of macros) {
            const rowMacrosStr = GlobalMethods.serializeMacros(rowMacros);
            result = result + rowMacrosStr + "\n";
        }
        if (result.endsWith("\n")) {
            result = result.substring(0, result.length - 1);
        }
        return result;
    }

    /**
     * "SYS=RNG, SUBSYS=BPM\n SYS=BST, SUBSYS=BLM" --> [[["SYS", "RNG"], ["SUBSYS", "BPM"]], [["SYS", "BST"], ["SUBSYS", "BLM"]]]
     */
    deserializeMacros = (str: string) => {
        const macrosStrLines = str.split("\n");
        const result: [string, string][][] = [];

        for (const rowMacrosStr of macrosStrLines) {
            const rowMacros = GlobalMethods.deserializeMacros(rowMacrosStr);
            result.push(rowMacros);
        }
        return result;
    }

    _ElementGroup = ({ }: any) => {
        // when the Group widget is being resized, deselect all its child widgets in all sub-groups,
        // so that these children won't be resized
        if (g_widgets1.getRendererWindowStatusStr().includes("resizingWidget")) {
            this.updateGroup();
            if (this.isSelected()) {
                // deselect all insider widgets
                for (let widgetKey of this.getWidgetKeys()) {
                    try {
                        const widget = g_widgets1.getWidget2(widgetKey);
                        if (widget instanceof BaseWidget) {
                            widget.simpleDeselect(false);
                            widget.simpleDeselectGroup(true);
                        }
                    } catch (e) {
                        Log.error(e);
                    }
                }
            }
        }

        // when the Group widget is being moved, select all its child widgets in all Groups
        if (g_widgets1.getRendererWindowStatusStr().includes("movingWidget")) {
            if (this.isSelected()) {
                for (let widgetKey of this.getWidgetKeys()) {
                    try {
                        const widget = g_widgets1.getWidget2(widgetKey);
                        if (widget instanceof BaseWidget) {
                            widget.selectOnMouseMove();
                        }
                    } catch (e) {
                        Log.error(e);
                    }
                }
            }
        }
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    // backgroundColor: this.getItemBackgroundColors()[index],
                    // visibility: index === this.getSelectedGroup() ? "visible" : "hidden",
                }}
                onMouseDown={(event: any) => {
                    this._handleMouseDown(event);
                    if (g_widgets1.isEditing()) {
                        this.updateGroup();
                        // this.selectGroup();
                    }
                }}
                onMouseUp={(event: any) => {
                    // todo: why did we need this? It causes unexpected selection of the Group widget
                    // todo: when the mouse is up, even we are not selecting this widget
                    if (g_widgets1.isEditing()) {
                        // this.updateGroup(index);
                        // thisselectGroup(index, true);
                    }
                }}
                onDoubleClick={this._handleMouseDoubleClick}
            ></div>
        );
    };


    _handleMouseUpOnResizer(event: any, index: "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H") {
        super._handleMouseUpOnResizer(event, index);
        if (g_widgets1.isEditing()) {
            this.updateGroup();
        }
    }

    // only update data and visibility, nothing about selection of widgets
    // (1) find all widgets inside the bound, put their widgetKeys to this._widgetKeys
    // (2) compare the this._widgetKeys and this._widgetKeys, if the widget is not in this._allWidgetKeys,
    //     it means this widget is not in-bound, then we remove this widgetKey out of this._widgetKeys
    //     and set its "visibility" style to "visible", no flush yet
    // (3) put all visible in-bound widgets to the old selected group's this._widgetKeys, and set their visibility to "hidden",
    //     before doing it, clear this this._widgetKeys[this.selectedGroup]
    // (4) update this._selectedGroup
    // (5) set all widgets that belong to the currently selected to group visible
    updateGroup = () => {
        // (1)
        this._updateCoverage(false);
        // (5)
        // for (let widgetKey of this.getWidgetKeys()[this.getSelectedGroup()]) {
        for (let widgetKey of this.getWidgetKeys()) {
            try {
                const widget = g_widgets1.getWidget2(widgetKey);
                if (widget instanceof BaseWidget) {
                    // if (widget.getStyle()["visibility"] === "hidden") {
                    // this.widgetKeys[this.getSelectedGroup()].push(widgetKey);
                    widget.getStyle()["visibility"] = "visible";
                    g_widgets1.addToForceUpdateWidgets(widgetKey);
                    // }
                }
            } catch (e) {
                Log.error(e);
            }
        }
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");
        g_flushWidgets();

        g_widgets1.addToForceUpdateWidgets("GroupSelection2");
        g_flushWidgets();
    };

    // only modify data, nothing about selection
    private _updateCoverage = (doFlush: boolean) => {
        this.getWidgetKeys().length = 0;

        let selectionChanged = false;

        for (let [widgetKey1, widget] of g_widgets1.getWidgets2()) {
            // only select selectable widget, e.g. TextUpdate
            //todo: provide a programtic way to determine special widgets
            // const widgetType = widget1.getType();

            if (!(widget instanceof BaseWidget)) {
                continue;
            }

            // widget boundary
            // todo: more generic
            // const widget = widget1 as BaseWidget;
            let widgetLeft = widget.getStyle().left;
            let widgetTop = widget.getStyle().top;
            let widgetRight = widgetLeft + widget.getStyle().width;
            let widgetDown = widgetTop + widget.getStyle().height;

            // "mouse selection region" boundary
            let regionLeft = this._style.left;
            let regionTop = this._style.top;
            let regionRight = regionLeft + this._style.width;
            let regionDown = regionTop + this._style.height;

            const isInside = regionLeft <= widgetLeft && regionTop <= widgetTop && regionDown >= widgetDown && regionRight >= widgetRight;
            if (isInside) {
                // exclude the Repeater widget itself
                if (widget.getWidgetKey() !== this.getWidgetKey()) {
                    this.getWidgetKeys().push(widget.getWidgetKey());
                }
            }
        }


        if (selectionChanged) {
            // do not flush yet, wait to the end
            g_widgets1.updateSidebar(false);
        }
        if (doFlush) {
            g_flushWidgets();
        }
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



    copyTemplateWidgetsTdls = () => {
        const result: Record<string, any>[] = [];
        const widgetKeys = this.getWidgetKeys();

        if (widgetKeys !== undefined && widgetKeys.length > 0) {
            for (let widgetKey of widgetKeys) {
                const widget = g_widgets1.getWidget2(widgetKey);
                if (widget instanceof BaseWidget) {
                    const widgetTdl = widget.getTdlCopy(true);
                    result.push(widgetTdl);
                }
            }
        }
        return result;
    };

    dynamicWidgetKeys: string[] = [];

    getDynamicWidgetKeys = () => {
        return this.dynamicWidgetKeys;
    }

    setDynamicWidgetKeys = (newKeys: string[]) => {
        this.dynamicWidgetKeys = newKeys;
    }


    _ElementIframeInOperating = () => {

        const iframeElementRef = React.useRef<any>(null);

        React.useEffect(() => {
            if (iframeElementRef.current !== null) {
                // iframeElementRef.current.style["backgroundColor"] = "rgba(255,255,255,1)"; // always white
                iframeElementRef.current.style["backgroundColor"] = this.iframeBackgroundColor;

            }
        });

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
                    // backgroundColor: "rgba(255,255,255,1)", // always white
                    backgroundColor: this.iframeBackgroundColor,

                }}
            >
            </iframe>
        );
    };

    createDynamicWidgets = () => {

        const templateWidgetsTdls = this.copyTemplateWidgetsTdls();
        const margin = this.getText()["gap"];

        // find the range of all tempalte widgets
        let overallTop = 100000000;
        let overallBottom = -1;
        let overallLeft = 10000000;
        for (const widgetTdlOriginal of templateWidgetsTdls) {
            overallTop = Math.min(widgetTdlOriginal["style"]["top"], overallTop);
            overallBottom = Math.max(widgetTdlOriginal["style"]["top"] + widgetTdlOriginal["style"]["height"], overallBottom);
            overallLeft = Math.min(widgetTdlOriginal["style"]["left"], overallLeft);
        }
        const overallHeight = overallBottom - overallTop;

        const dY = overallTop;
        const dH = overallHeight + margin;

        const tdl: Record<string, any> = {};

        // create Canvas Tdl
        const canvsWidgetTdl = Canvas.generateDefaultTdl();
        canvsWidgetTdl["style"]["width"] = this.getStyle()["width"];
        canvsWidgetTdl["style"]["height"] = this.getStyle()["height"];
        canvsWidgetTdl["style"]["backgroundColor"] = this.getStyle()["backgroundColor"];
        tdl["Canvas"] = canvsWidgetTdl;

        // create widgets Tdl
        for (let ii = 0; ii < this.getTabMacros().length; ii++) {
            for (const widgetTdlOriginal of templateWidgetsTdls) {

                const widgetTdl = JSON.parse(JSON.stringify(widgetTdlOriginal));
                // create a new widget JSON
                const newWidgetKey = widgetTdl.type + "_" + GlobalMethods.generateNewWidgetKey();
                widgetTdl.key = newWidgetKey;
                widgetTdl.widgetKey = newWidgetKey;
                widgetTdl.style.top = widgetTdl.style.top - dY + dH * ii;
                widgetTdl.style.left = widgetTdl.style.left - this.getStyle()["left"];
                widgetTdl["groupNames"] = [];
                tdl[newWidgetKey] = widgetTdl;

                // replace macros

                const canvas = g_widgets1.getWidget2("Canvas");
                if (!(canvas instanceof Canvas)) {
                    const errMsg = "No Canvas widget";
                    throw new Error(errMsg);
                }

                if (this.getTabMacros()[ii] !== undefined) {
                    const macros = [...this.getTabMacros()[ii], ...this.getAllMacros()];

                    if (macros !== undefined && macros.length > 0) {

                        // replace macros in Label text 
                        if (widgetTdl["widgetKey"].startsWith("Label_")) {
                            widgetTdl["text"]["text"] = BaseWidget.expandChannelName(widgetTdl["text"]["text"], macros, true);
                        }

                        // replace macros in rules
                        // the channel names in rules are expanded in BaseWidget.processChannelNames()
                        // {
                        //     "id": "6831fbe7-0589-481d-ae00-60edbbae5162",
                        //     "boolExpression": "true",
                        //     "propertyName": "X",
                        //     "propertyValue": 923
                        // }
                        for (const rule of widgetTdl["rules"]) {
                            rule["boolExpression"] = BaseWidget.expandChannelName(rule["boolExpression"], macros, true);
                            rule["propertyValue"] = BaseWidget.expandChannelName(rule["propertyValue"], macros, true);
                        }

                        // replace macros in Action Button
                        if (widgetTdl["widgetKey"].startsWith("ActionButton_")) {

                            widgetTdl["text"]["text"] = BaseWidget.expandChannelName(widgetTdl["text"]["text"], macros, true);

                            for (const action of widgetTdl["actions"]) {
                                action["label"] = BaseWidget.expandChannelName(action["label"], macros, true);

                                if (action["type"] === "OpenDisplay") {
                                    action["fileName"] = BaseWidget.expandChannelName(action["fileName"], macros, true);
                                    action["externalMacros"] = [...this.getTabMacros()[ii], ...action["externalMacros"]];
                                } else if (action["type"] === "WritePV") {
                                    action["channelName"] = BaseWidget.expandChannelName(action["channelName"], macros, true);
                                    action["channelValue"] = BaseWidget.expandChannelName(action["channelValue"], macros, true);
                                } else if (action["type"] === "ExecuteScript") {
                                    action["fileName"] = BaseWidget.expandChannelName(action["fileName"], macros, true);
                                } else if (action["type"] === "ExecuteCommand") {
                                    action["command"] = BaseWidget.expandChannelName(action["command"], macros, true);
                                } else if (action["type"] === "OpenWebPage") {
                                    action["url"] = BaseWidget.expandChannelName(action["url"], macros, true);
                                }
                            }
                        }

                        for (let ii = 0; ii < widgetTdl["channelNames"].length; ii++) {
                            const channelName = widgetTdl["channelNames"][ii];
                            const expandedChannelName = BaseWidget.expandChannelName(channelName, macros, true);
                            widgetTdl["channelNames"][ii] = expandedChannelName;
                        }
                    }
                }
            }
        }

        this.iframeDisplayId = "";

        const ipcManager = g_widgets1.getRoot().getDisplayWindowClient().getIpcManager();
        ipcManager.sendFromRendererProcess("obtain-iframe-uuid", {
            displayWindowId: g_widgets1.getRoot().getDisplayWindowClient().getWindowId(),
            widgetKey: this.getWidgetKey(),
            mode: "operating",
            tdl: tdl as type_tdl,
            tdlFileName: "", // no real file, but it is ok
            macros: [],
            currentTdlFolder: "",
            replaceMacros: this.getText()["useParentMacros"]
        });
    }

    removeDynamicWidgets = () => {
        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
        if (this.iframeDisplayId !== "") {
            displayWindowClient.getIpcManager().sendFromRendererProcess("close-iframe-display", {
                displayWindowId: this.iframeDisplayId,
            })
        }
    }

    iframeDisplayId: string = "";
    iframeBackgroundColor: string = "rgba(0,0,0,0)";

    loadHtml = (iframeDisplayId: string) => {
        this.iframeDisplayId = iframeDisplayId;
        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        g_flushWidgets();
    };
    setIframeBackgroundColor = (tdlBackgroundColor: string) => {
        this.iframeBackgroundColor = tdlBackgroundColor;
    }


    // ----------------------- styles -----------------------

    // defined in super class
    // _resizerStyle
    // _resizerStyles
    // StyledToolTipText
    // StyledToolTip

    // -------------------------- tdl -------------------------------

    static generateDefaultTdl = (): Record<string, any> => {

        const defaultTdl: type_Repeater_tdl = {
            type: "Repeater",
            widgetKey: "", // "key" is a reserved keyword
            key: "",
            // the style for outmost div
            // these properties are explicitly defined in style because they are
            // (1) different from default CSS settings, or
            // (2) they may be modified
            style: {
                position: "absolute",
                display: "inline-flex",
                backgroundColor: "rgba(240, 240, 240, 0)",
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
                borderWidth: 1,
                borderColor: "rgba(0, 0, 0, 1)",
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
                alarmBorder: true,
                selectedGroup: 0,
                tabPosition: "top",
                tabWidth: 100,
                tabHeight: 20,
                tabSelectedColor: "rgba(180,180,180,1)",
                tabDefaultColor: "rgba(220,220,220,1)",
                showTab: true,
                gap: 5,
            },
            channelNames: [],
            groupNames: [],
            rules: [],

            widgetKeys: [],
            macros: [],
        };
        return JSON.parse(JSON.stringify(defaultTdl));
    };

    generateDefaultTdl: () => any = Repeater.generateDefaultTdl;

    // defined in super class
    getTdlCopy(newKey: boolean) {
        const result = super.getTdlCopy(newKey);
        result["widgetKeys"] = JSON.parse(JSON.stringify(this.getWidgetKeys()));
        result["macros"] = JSON.parse(JSON.stringify(this.getTabMacros()));
        return result;
    }

    // --------------------- getters -------------------------

    getWidgetKeys = () => {
        return this._widgetKeys;
    };

    getTabMacros = () => {
        return this._tabMacros;
    }

    setTabMacros = (newMacros: [string, string][][]) => {
        this._tabMacros = newMacros;
    }

    // -------------------------- sidebar ---------------------------
    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new RepeaterSidebar(this);
        }
    }

    jobsAsEditingModeBegins(): void {
        super.jobsAsEditingModeBegins();
        this.removeDynamicWidgets();
        if (this.getWidgetKeys()[0] !== undefined) {
            g_widgets1.getRepeaterTemplateWidgets().push(...this.getWidgetKeys());
        }
    }

    jobsAsOperatingModeBegins(): void {
        super.jobsAsOperatingModeBegins();
        this.createDynamicWidgets();
        if (this.getWidgetKeys()[0] !== undefined) {
            g_widgets1.getRepeaterTemplateWidgets().push(...this.getWidgetKeys());
        }
    }
}
