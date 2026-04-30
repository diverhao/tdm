import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { RepeaterSidebar } from "./RepeaterSidebar";
import * as GlobalMethods from "../../../common/GlobalMethods";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { Canvas } from "../../helperWidgets/Canvas/Canvas";
import { defaultRepeaterTdl, type_macro_tdl, type_Repeater_tdl } from "../../../common/types/type_widget_tdl";
import { v4 as uuidv4 } from "uuid";
import { rendererWindowStatus } from "../../global/Widgets";

export class Repeater extends BaseWidget {

    private _templateWidgetKeys: string[] = [];
    private _templateWidgets: BaseWidget[] = [];
    private _dynamicWidgetKeys: string[] = [];

    private _widgetsMacros: type_macro_tdl[][] = [];
    private readonly _groupName: string = `repeater_group_${uuidv4()}`;

    constructor(widgetTdl: type_Repeater_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this.setReadWriteType("write");

        this._templateWidgetKeys = structuredClone(widgetTdl["widgetKeys"]);
        this._widgetsMacros = structuredClone(widgetTdl["widgetsMacros"]);
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

        // do it once, bring this box to bottom
        React.useEffect(() => {
            g_widgets1.moveWidgetsInZ([this.getWidgetKey()], "back", false);
        }, []);

        return (
            <ErrorBoundary style={this.getStyle()} widgetKey={this.getWidgetKey()}>
                <>
                    <this._ElementBody></this._ElementBody>
                    {this.showSidebar() ? this._sidebar?.getElement() : null}
                </>
            </ErrorBoundary>
        );
    };

    _ElementBodyRaw = (): React.JSX.Element => {
        return (
            <div
                style={
                    this.getElementBodyRawStyle()
                }
            >
                <this._ElementArea></this._ElementArea>
                {this.showResizers() ? <this._ElementResizer /> : null}
            </div>
        );
    };

    // only shows the text, all other style properties are held by upper level _ElementBodyRaw
    _ElementArea = ({ }: any): React.JSX.Element => {
        React.useEffect(() => {
            this._updateCoverage();
        }, [])

        const whiteSpace = this.getText().wrapWord ? "pre-line" : "nowrap";
        const justifyContent = this.getText().horizontalAlign;
        const alignItems = this.getText().verticalAlign;
        const fontFamily = this.getStyle().fontFamily;
        const fontSize = this.getStyle().fontSize;
        const fontStyle = this.getStyle().fontStyle;
        const fontWeight = this.getStyle().fontWeight;
        const outline = this._getElementAreaRawOutlineStyle();

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
                    whiteSpace: whiteSpace,
                    justifyContent: justifyContent,
                    alignItems: alignItems,
                    fontFamily: fontFamily,
                    fontSize: fontSize,
                    fontStyle: fontStyle,
                    fontWeight: fontWeight,
                    outline: outline,
                }}
                onMouseDown={(event: any) => { this._updateCoverage(); this._handleMouseDown(event); }}
                onDoubleClick={this._handleMouseDoubleClick}
            >
            </div>
        );
    };

    _Element = React.memo(this._ElementRaw, () => this._useMemoedElement());
    _ElementBody = React.memo(this._ElementBodyRaw, () => this._useMemoedElement());

    // --------------------- GUI related --------------------------

    _handleMouseUpOnResizer(event: globalThis.MouseEvent, index: "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H") {
        super._handleMouseUpOnResizer(event, index);
        this._updateCoverage();
    }

    /**
     * update the coverage of this Repeater widget. 2 data are updated:
     * 
     * (1) Repeater._templateWidgetKeys. It is for expanding the template widgets.
     * 
     * (2) BaseWidget._groupNames, where the BaseWidget is a template widget. 
     *     It is for selecting the template widgets using mouse.
     * 
     */
    private _updateCoverage = () => {
        if (!g_widgets1.isEditing()) {
            return;
        }

        // for (1)
        this.getTemplateWidgetKeys().length = 0;

        // Repeater's boundary
        const style = this.getAllStyle();
        let regionLeft = style.left;
        let regionTop = style.top;
        let regionRight = regionLeft + style.width;
        let regionDown = regionTop + style.height;

        for (let [, widget] of g_widgets1.getWidgets2()) {

            if (!(widget instanceof BaseWidget)) {
                continue;
            }

            // widget's boundary
            let widgetLeft = widget.getStyle().left;
            let widgetTop = widget.getStyle().top;
            let widgetRight = widgetLeft + widget.getStyle().width;
            let widgetDown = widgetTop + widget.getStyle().height;

            // boundary is included
            const isInside = regionLeft <= widgetLeft && regionTop <= widgetTop && regionDown >= widgetDown && regionRight >= widgetRight;

            // remove this Repeater's group from widget's group 
            for (let ii = widget.getGroupNames().length - 1; ii >= 0; ii--) {
                if (widget.getGroupNames()[ii].startsWith("repeater_group_")) {
                    widget.getGroupNames().splice(ii, 1);
                }
            }

            if (isInside) {
                const widgetWidgetKey = widget.getWidgetKey();
                if (widget.getWidgetKey() !== this.getWidgetKey()) {
                    // for (1)
                    this.getTemplateWidgetKeys().push(widgetWidgetKey);
                }
                // for (2)
                widget.getGroupNames().push(this.getGroupName());
            }
        }
    };


    // -------------------- widget lifecycle management ----------------

    /**
     * (1) relocate the template widgets, move them to a temporary array Repeater._templateWidgets
     * 
     * (2) create dynamic widgets based on template widgets and macros
     */
    createDynamicWidgets = () => {

        this.getTemplateWidgets().length = 0; // clear temporary storage first

        const templateWidgetTdls: Record<string, any>[] = [];
        for (const templateWidgetKey of this.getTemplateWidgetKeys()) {
            const templateWidget = g_widgets1.getWidget(templateWidgetKey);
            if (templateWidget instanceof BaseWidget) {
                // (1)
                this.getTemplateWidgets().push(templateWidget);
                g_widgets1.getWidgets().delete(templateWidgetKey);
                // get tdl copy for these template widgets
                templateWidgetTdls.push(templateWidget.getTdlCopy(false));
            }
        }

        const margin = this.getText()["gap"];

        // find the range of all tempalte widgets
        let overallTop = 100000000;
        let overallBottom = -1;
        let overallLeft = 10000000;
        for (const widgetTdlOriginal of templateWidgetTdls) {
            overallTop = Math.min(widgetTdlOriginal["style"]["top"], overallTop);
            overallBottom = Math.max(widgetTdlOriginal["style"]["top"] + widgetTdlOriginal["style"]["height"], overallBottom);
            overallLeft = Math.min(widgetTdlOriginal["style"]["left"], overallLeft);
        }
        const overallHeight = overallBottom - overallTop;
        const dH = overallHeight + margin;

        // create dynamic widgets Tdl
        for (let ii = 0; ii < this.getWidgetsMacros().length; ii++) {

            const macros = this.getWidgetsMacros()[ii];
            if (macros.length === 0) {
                continue;
            }

            for (const templateWidgetTdl of templateWidgetTdls) {

                const widgetTdl = structuredClone(templateWidgetTdl);
                // create a new widget JSON
                const newWidgetKey = widgetTdl.type + "_" + GlobalMethods.generateNewWidgetKey();
                widgetTdl.key = newWidgetKey;
                widgetTdl.widgetKey = newWidgetKey;
                widgetTdl.style.top = this.getStyle()["top"] + dH * ii + margin;
                // widgetTdl.style.left = widgetTdl.style.left - this.getStyle()["left"] + overallLeft;
                widgetTdl["groupNames"] = [];
                // tdl[newWidgetKey] = widgetTdl;

                // replace macros
                const canvas = g_widgets1.getWidget2("Canvas");
                if (!(canvas instanceof Canvas)) {
                    const errMsg = "No Canvas widget";
                    throw new Error(errMsg);
                }

                const widgetMacro = this.getWidgetMacro(ii);
                if (widgetMacro !== undefined) {

                    const macros = [...widgetMacro, ...this.getAllMacros()];

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
                                    const widgetMacro = this.getWidgetMacro(ii);
                                    action["externalMacros"] = [...(widgetMacro === undefined ? [] : widgetMacro), ...action["externalMacros"]];
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

                    // (2)
                    const widget = g_widgets1.createWidget(widgetTdl, false);
                    if (widget instanceof BaseWidget) {
                        widget.setMacros(macros);
                        this.appendDynamicWidgetKey(newWidgetKey);
                    }
                }
            }
        }

    }

    /**
     * move the template widgets back, it is invoked in jobsAsEditingModeBegins() with
     * removeDynamicWidgets(), but they cannot be invoked together. 
     */
    restoreTemplateWidgets = () => {
        for (const templateWidget of this.getTemplateWidgets()) {
            g_widgets1.getWidgets().set(templateWidget.getWidgetKey(), templateWidget);
            // run jobsAsEditingModeBegins() for the template widget
            // the g_widgets1.setMode() cannot capture the newly added widget
            const newMode = rendererWindowStatus.editing;
            const oldMode = rendererWindowStatus.operating;
            templateWidget.jobsAsEditingModeBegins();
            templateWidget.setMode(newMode, oldMode);
            g_widgets1.addToForceUpdateWidgets(templateWidget.getWidgetKey());
        }
        // clear temporary storage for template widgets
        this.getTemplateWidgets().length = 0;


        g_widgets1.addToForceUpdateWidgets("GroupSelection2");
        g_flushWidgets();
    }

    removeDynamicWidgets = () => {
        // remove dynamic widgets
        for (const dynamicWidgetKey of this.getDynamicWidgetKeys()) {
            g_widgets1.removeWidget(dynamicWidgetKey, true, false, true);
        }

        g_widgets1.addToForceUpdateWidgets("GroupSelection2");
        g_flushWidgets();
    }


    hide(flush: boolean) {
        super.hide(false);
        // hide all children widgets
        for (const widgetKey of this.getDynamicWidgetKeys()) {
            try {
                const widget = g_widgets1.getWidget2(widgetKey);
                if (widget instanceof BaseWidget) {
                    widget.hide(false);
                }
            } catch (e) {

            }
        }
        for (const widgetKey of this.getTemplateWidgetKeys()) {
            try {
                const widget = g_widgets1.getWidget2(widgetKey);
                if (widget instanceof BaseWidget) {
                    widget.hide(false);
                }
            } catch (e) {

            }
        }
        if (flush === true) {
            g_flushWidgets();
        }
    }

    unhide(flush: boolean) {
        super.unhide(false);
        // hide all children widgets
        for (const widgetKey of this.getDynamicWidgetKeys()) {
            try {
                const widget = g_widgets1.getWidget2(widgetKey);
                if (widget instanceof BaseWidget) {
                    widget.unhide(false);
                }
            } catch (e) {

            }
        }
        for (const widgetKey of this.getTemplateWidgetKeys()) {
            try {
                const widget = g_widgets1.getWidget2(widgetKey);
                if (widget instanceof BaseWidget) {
                    widget.unhide(false);
                }
            } catch (e) {

            }
        }
        if (flush === true) {
            g_flushWidgets();
        }
    }



    // -------------------- macros ---------------------

    /**
     * [[["SYS", "RNG"], ["SUBSYS", "BPM"]], [["SYS", "BST"], ["SUBSYS", "BLM"]]] --> "SYS=RNG, SUBSYS=BPM\n SYS=BST, SUBSYS=BLM"
     */
    serializeMacros = () => {
        let result: string = "";
        for (const rowMacros of this.getWidgetsMacros()) {
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

    // -------------------------- tdl -------------------------------

    static generateDefaultTdl = (): type_Repeater_tdl => {
        const widgetKey = GlobalMethods.generateWidgetKey(defaultRepeaterTdl.type);
        return structuredClone({
            ...defaultRepeaterTdl,
            widgetKey: widgetKey,
        });
    };

    generateDefaultTdl: () => any = Repeater.generateDefaultTdl;

    // defined in super class
    getTdlCopy(newKey: boolean) {
        const result = super.getTdlCopy(newKey);
        result["widgetKeys"] = structuredClone(this.getTemplateWidgetKeys());
        result["widgetsMacros"] = structuredClone(this.getWidgetsMacros());
        return result;
    }

    // --------------------- getters -------------------------

    getWidgetsMacros = () => {
        return this._widgetsMacros;
    }

    getWidgetMacro = (index: number) => {
        return this.getWidgetsMacros()[index];
    }

    setWidgetsMacros = (widgetsMacros: type_macro_tdl[][]) => {
        this._widgetsMacros = structuredClone(widgetsMacros);
    }


    getTemplateWidgetKeys = () => {
        return this._templateWidgetKeys;
    }

    setTemplateWidgetKeys = (widgetKeys: string[]) => {
        this._templateWidgetKeys = structuredClone(widgetKeys);
    }

    getTemplateWidgets = () => {
        return this._templateWidgets;
    }


    getDynamicWidgetKeys = () => {
        return this._dynamicWidgetKeys;
    }

    setDynamicWidgetKeys = (newChildWidgetKeys: string[]) => {
        this._dynamicWidgetKeys = newChildWidgetKeys;
    }

    clearDynamicWidgetKeys = () => {
        this.setDynamicWidgetKeys([]);
    }


    getGroupName = () => {
        return this._groupName;
    }

    appendDynamicWidgetKey = (newWidgetKey: string) => {
        this.getDynamicWidgetKeys().push(newWidgetKey);
    }

    // -------------------------- sidebar ---------------------------

    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new RepeaterSidebar(this);
        }
    }

    jobsAsEditingModeBegins(): void {
        this.restoreTemplateWidgets();
        super.jobsAsEditingModeBegins();
        this.removeDynamicWidgets();
    }

    jobsAsOperatingModeBegins(): void {
        this.createDynamicWidgets();
        super.jobsAsOperatingModeBegins();
    }
}
