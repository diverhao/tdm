import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { GroupSidebar } from "./GroupSidebar";
import * as GlobalMethods from "../../../common/GlobalMethods";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { defaultGroupTdl, type_Group_tdl } from "../../../common/types/type_widget_tdl";
import { GroupItem } from "./GroupItem";
import { v4 as uuidv4 } from "uuid";

export class Group extends BaseWidget {

    private _items: GroupItem[] = [];
    private _selectedItem: GroupItem;
    private _groupKey: string = `group_widget_group_${uuidv4()}`;


    constructor(widgetTdl: type_Group_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this.setReadWriteType("write");

        for (const itemTdl of widgetTdl["items"]) {
            this._items.push(new GroupItem(this, itemTdl));
        }

        if (this._items.length === 0) {
            this._items.push(new GroupItem(this, { name: "Group1", backgroundColor: "rgba(255,255,255,1)", widgetKeys: [] }))
        }
        this._selectedItem = this._items[0];

        for (let ii = this.getGroupNames().length - 1; ii >= 0; ii--) {
            if (this.getGroupNames()[ii].startsWith("group_widget_group_")) {
                this.getGroupNames().splice(ii, 1);
            }
        }
        this.getGroupNames().push(this.getGroupKey());
    }

    getSelectedItem = () => {
        return this._selectedItem;
    }

    setSelectedItem = (item: GroupItem) => {
        this._selectedItem = item;
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
                <div
                    style={
                        this.getElementBodyRawStyle()
                    }
                >
                    <this._ElementArea></this._ElementArea>
                    {this.showResizers() ? <this._ElementResizer /> : null}
                </div>
                {this.showSidebar() ? this._sidebar?.getElement() : null}
            </ErrorBoundary>
        );
    };


    _ElementArea = ({ }: any): React.JSX.Element => {
        const allText = this.getAllText();
        const allStyle = this.getAllStyle();
        const whiteSpace = allText.wrapWord ? "pre-line" : "nowrap";
        const justifyContent = allText.horizontalAlign;
        const alignItems = allText.verticalAlign;
        const fontFamily = allStyle.fontFamily;
        const fontSize = allStyle.fontSize;
        const fontStyle = allStyle.fontStyle;
        const fontWeight = allStyle.fontWeight;
        const outline = this._getElementAreaRawOutlineStyle();

        React.useEffect(() => {
            this.updateCoverage();
            this.shuffleWidgets();
            this.updateAppearance()
        }, [])

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
                onMouseDown={(event: any) => { this.updateCoverage(); this.shuffleWidgets(); this.updateAppearance(); this._handleMouseDown(event); }}
                onDoubleClick={this._handleMouseDoubleClick}

            >
                {/* <this._ElementTabs></this._ElementTabs> */}
                <this._ElementGroup></this._ElementGroup>
            </div>
        );
    };

    _Element = React.memo(this._ElementRaw, () => this._useMemoedElement());

    _ElementGroup = () => {

        const allStyle = this.getAllStyle();
        const item = this.getSelectedItem();
        const borderColor = allStyle["color"];
        const backgroundColor = item.getBackgroundColor();
        const height = allStyle["height"];
        const fontSize = allStyle["fontSize"];
        const containerHeight = height - fontSize / 2;
        const labelHeight = fontSize;

        const maxTabWidth = this.calcTabMaxWidth();

        return (
            <div
                style={{
                    display: "inline-flex",
                    width: "100%",
                    height: "100%",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    backgroundColor: backgroundColor,
                }}
            >
                {/* border lines */}
                <div
                    style={{
                        width: "100%",
                        height: containerHeight,
                        boxSizing: "border-box",
                        borderBottom: `solid 1px ${borderColor}`,
                        borderLeft: `solid 1px ${borderColor}`,
                        borderRight: `solid 1px ${borderColor}`,
                        // position: "relative",
                    }}
                >
                </div>
                {/* label area */}
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        display: "inline-flex",
                        margin: 0,
                        padding: 0,
                        justifyContent: "flex-start",
                        alignItems: "center",
                        height: labelHeight,
                        width: "100%",
                        lineHeight: `${labelHeight}px`
                    }}
                >
                    {this.getItems().map((item: GroupItem, index: number) => {
                        const itemName = item.getName();
                        let textDecoration = "none";
                        if (this.getSelectedItem() === item && this.getItems().length > 1) {
                            textDecoration = "underline";
                        }

                        return (
                            <>
                                {/* beginning horizontal line */}
                                <div
                                    style={{
                                        height: 1,
                                        width: 10,
                                        backgroundColor: borderColor,
                                    }}
                                >
                                </div>
                                <div
                                    style={{
                                        // position: "absolute",
                                        // top: -1 * fontSize / 2,
                                        // left: 10,
                                        display: "inline-flex",
                                        justifyContent: "flex-start",
                                        alignItems: "flex-start",
                                        height: labelHeight,
                                        lineHeight: `${labelHeight}px`, // must be a string
                                        margin: 0,
                                        paddingLeft: 5,
                                        paddingRight: 5,
                                        whiteSpace: "nowrap",
                                        maxWidth: maxTabWidth,
                                        // overflow: "hidden",
                                        textOverflow: "hidden",

                                        textDecorationLine: textDecoration,
                                        textDecorationStyle: "solid",
                                        textDecorationColor: "#0b63ce",
                                        textDecorationThickness: 2,
                                        textUnderlineOffset: labelHeight / 4,
                                    }}
                                    onMouseDown={(event: React.MouseEvent<HTMLDivElement>) => {
                                        // event.preventDefault();
                                        event.stopPropagation();
                                        const item = this.getItems()[index];
                                        this.setSelectedItem(item);
                                        this.updateCoverage();
                                        this.shuffleWidgets();
                                        this.updateAppearance();
                                        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
                                        g_widgets1.updateSidebar(true);
                                        g_flushWidgets();

                                    }}
                                >
                                    {itemName}
                                </div>
                            </>
                        )
                    })}
                    <div
                        style={{
                            flex: 1,
                            minWidth: 0,
                            height: 1,
                            backgroundColor: borderColor,
                        }}
                    />

                </div>

            </div >
        )
    }

    /**
     * go over all widgets in the display, determine the inclusion of them into this Group widget
     * it modifies
     *  - the widgetKeys of the item in this Group widget
     *  - the groupNames array of the widget
     * 
     * The visibility (appearance) of the widget is related to the inclusion in the Group item. 
     * This method does not update the appearance of widget.
     * 
     * if a widget is within this Group widget's boundary, then 
     *  - if this widget is already included in one item of this Group widget, then include this widget again
     *    the purpose is to update the random group number
     *  - if this widget is not included in an item of this Group widget, include it to the currently selected item
     * 
     * if a widget is outside this Group widget's boundary, then
     *  - if this widget is not included in any item of this Group widget, then do nothing
     *  - if this widget is included in an item of this Group widget, then exclude (remove) it from this item
     */
    updateCoverage = () => {

        const style = this.getStyle();
        // "mouse selection region" boundary
        let regionLeft = style.left;
        let regionTop = style.top;
        let regionRight = regionLeft + style.width;
        let regionDown = regionTop + style.height;

        for (const widget of g_widgets1.getWidgets().values()) {
            if (!(widget instanceof BaseWidget)) {
                continue;
            }

            if (widget === this) {
                continue;
            }

            const widgetStyle = widget.getStyle();
            const widgetKey = widget.getWidgetKey();
            let widgetLeft = widgetStyle.left;
            let widgetTop = widgetStyle.top;
            let widgetRight = widgetLeft + widgetStyle.width;
            let widgetDown = widgetTop + widgetStyle.height;
            const isInside = regionLeft <= widgetLeft && regionTop <= widgetTop && regionDown >= widgetDown && regionRight >= widgetRight;
            let includedItem: undefined | GroupItem = undefined;
            for (const item of this.getItems()) {
                const widgetKeys = item.getWidgetKeys();
                if (widgetKeys.includes(widgetKey)) {
                    includedItem = item;
                    break;
                }
            }
            if (includedItem !== undefined && isInside === true) {
                // do nothing
                this.includeWidget(includedItem, widget);
            } else if (includedItem !== undefined && isInside === false) {
                this.excludeWidget(includedItem, widget);
            } else if (includedItem === undefined && isInside === true) {
                this.includeWidget(this.getSelectedItem(), widget);
            } else if (includedItem === undefined && isInside === false) {
                // do nothing
            }
        }
    };

    includeWidget = (item: GroupItem, widget: BaseWidget) => {
        const widgetKey = widget.getWidgetKey();
        if (!item.getWidgetKeys().includes(widgetKey)) {
            item.getWidgetKeys().push(widgetKey);
        }
        for (let ii = widget.getGroupNames().length - 1; ii >= 0; ii--) {
            if (widget.getGroupNames()[ii].startsWith("group_widget_group_")) {
                widget.getGroupNames().splice(ii, 1);
            }
        }
        widget.getGroupNames().push(this.getGroupKey());

        if (widget instanceof Group) {
            widget.updateCoverage();
        }

        g_widgets1.addToForceUpdateWidgets(widgetKey);
    }

    excludeWidget = (item: GroupItem, widget: BaseWidget) => {
        const widgetKey = widget.getWidgetKey();
        item.removeWidgetKey(widgetKey);
        // the widget may have been invisible
        widget.getStyle()["display"] = "inline-flex";
        for (let ii = widget.getGroupNames().length - 1; ii >= 0; ii--) {
            if (widget.getGroupNames()[ii].startsWith("group_widget_group_")) {
                widget.getGroupNames().splice(ii, 1);
            }
        }

        if (widget instanceof Group) {
            widget.updateCoverage();
        }

        g_widgets1.addToForceUpdateWidgets(widgetKey);
    }

    /**
     * remove an item
     * 
     * (1) remove all the widgets
     * 
     * (2) remove this item
     * 
     * (3) select next item
     * 
     * (4) update coverage and appearance
     */
    removeItem = (index: number) => {
        if (this.getItems().length <= 1) {
            return;
        }
        const item = this.getItems()[index];
        if (item === undefined) {
            return;
        }
        // (1)
        for (const widgetKey of item.getWidgetKeys()) {
            g_widgets1.removeWidget(widgetKey, true, false, false);
        }
        // (2)
        this.getItems().splice(index, 1);
        // (3)
        const sidebar = this.getSidebar();
        if (sidebar instanceof GroupSidebar) {
            const sidebarMembers = sidebar.getSidebarGroupItems().getMembers();
            sidebarMembers.splice(index, 1);
        }
        // (3)
        if (this.getItems()[index] !== undefined) {
            this.setSelectedItem(this.getItems()[index]);
        } else {
            this.setSelectedItem(this.getItems()[0]);
        }
        // (4)
        this.updateCoverage();
        this.shuffleWidgets();
        this.updateAppearance();
    }

    moveItem = (item: GroupItem, newIndex: number) => {
        const items = this.getItems();
        if (newIndex > items.length - 1 || newIndex < 0) {
            return;
        }

        let oldIndex = -1;
        for (let ii = 0; ii < items.length; ii++) {
            if (items[ii] === item) {
                oldIndex = ii;
                break;
            }
        }
        if (oldIndex === newIndex || oldIndex === -1) {
            return;
        }

        items.splice(oldIndex, 1);
        items.splice(newIndex, 0, item);

        this.setSelectedItem(item);
        this.updateCoverage();
        this.shuffleWidgets();
        this.updateAppearance();
    }

    updateAppearance = () => {

        for (const item of this.getItems()) {
            item.updateWidgets(false);
        }
        g_flushWidgets();
    }

    calcTabMaxWidth = () => {

        const allStyle = this.getAllStyle();
        const width = allStyle["width"];
        const numTabs = this.getItems().length;
        const maxWidth = (width - 10) / numTabs;
        return maxWidth;
    }

    /**
     * callback function when this Group widget is removed
     * 
     *  (1) show all its included widgets
     * 
     *  (2) remove this Group widget's group from the widgets
     * 
     *  (3) append the widgets to the force updated list
     */
    removeThisWidget = () => {

        // (1)
        for (const item of this.getItems()) {
            const widgetKeys = item.getWidgetKeys();
            for (const widgetKey of widgetKeys) {
                try {
                    const widget = g_widgets1.getWidget2(widgetKey);
                    if (widget instanceof BaseWidget) {
                        // (1)
                        const widgetStyle = widget.getStyle();
                        widgetStyle["display"] = "inline-flex";
                        // (2)
                        for (let ii = widget.getGroupNames().length - 1; ii >= 0; ii--) {
                            if (widget.getGroupNames()[ii].startsWith("group_widget_group_")) {
                                widget.getGroupNames().splice(ii, 1);
                            }
                        }
                        // (3)
                        g_widgets1.addToForceUpdateWidgets(widget.getWidgetKey());
                    }
                } catch (e) {
                }

            }
        }
    }

    moveMapKeyToIndex<K, V>(map: Map<K, V>, key: K, index: number) {
        if (!map.has(key)) {
            return;
        }

        const value = map.get(key)!;
        map.delete(key);

        const entries = [...map.entries()];
        entries.splice(index, 0, [key, value]);

        map.clear();
        for (const [entryKey, entryValue] of entries) {
            map.set(entryKey, entryValue);
        }
    }

    moveMapKeyAfter<K, V>(map: Map<K, V>, keyToMove: K, afterKey: K) {
        if (!map.has(keyToMove) || !map.has(afterKey) || keyToMove === afterKey) {
            return;
        }

        const valueToMove = map.get(keyToMove)!;
        map.delete(keyToMove);

        const entries: [K, V][] = [];

        for (const [key, value] of map) {
            entries.push([key, value]);

            if (key === afterKey) {
                entries.push([keyToMove, valueToMove]);
            }
        }

        map.clear();
        for (const [key, value] of entries) {
            map.set(key, value);
        }
    }



    /**
     * shuffle children widgets to make sure they are not behind this widget
     */
    shuffleWidgets = (parentWidget: Group | undefined = undefined) => {
        // move the current widget to the front, or right after the parentWidget
        const widgets = g_widgets1.getWidgets();
        if (parentWidget === undefined) {
            const widgetKey = this.getWidgetKey();
            this.moveMapKeyToIndex(widgets, this.getWidgetKey(), 1);
        } else if (parentWidget instanceof Group) {
            const parentWidgetKey = parentWidget.getWidgetKey();
            this.moveMapKeyAfter(widgets, this.getWidgetKey(), parentWidgetKey);
        } else {
            return;
        }

        // shuffle children Group widgets for the selected item
        for (const widgetKey of this.getSelectedItem().getWidgetKeys()) {
            try {
                const widget = g_widgets1.getWidget2(widgetKey);
                if (widget instanceof Group) {
                    widget.shuffleWidgets(this);
                }
            } catch (e) {

            }
        }

    }

    hide(flush: boolean) {
        super.hide(false);
        // hide all children widgets
        for (const item of this.getItems()) {
            for (const widgetKey of item.getWidgetKeys()) {
                try {
                    const widget = g_widgets1.getWidget2(widgetKey);
                    if (widget instanceof BaseWidget) {
                        widget.hide(false);
                    }
                } catch (e) {

                }
            }
        }
        if (flush === true) {
            g_flushWidgets();
        }
    }


    unhide(flush: boolean) {
        super.unhide(false);
        // hide all children widgets
        for (const item of this.getItems()) {
            if (item !== this.getSelectedItem()) {
                continue;
            }
            for (const widgetKey of item.getWidgetKeys()) {
                try {
                    const widget = g_widgets1.getWidget2(widgetKey);
                    if (widget instanceof BaseWidget) {
                        widget.unhide(false);
                    }
                } catch (e) {
                }
            }
        }
        if (flush === true) {
            g_flushWidgets();
        }
    }


    // -------------------- helper functions ----------------
    getGroupKey = () => {
        return this._groupKey;
    }
    getItems = () => {
        return this._items;
    }

    // -------------------------- tdl -------------------------------

    static generateDefaultTdl = (): type_Group_tdl => {
        const widgetKey = GlobalMethods.generateWidgetKey(defaultGroupTdl.type);
        return structuredClone({
            ...defaultGroupTdl,
            widgetKey: widgetKey,
        });
    };

    generateDefaultTdl: () => any = Group.generateDefaultTdl;

    // defined in super class
    getTdlCopy(newKey: boolean) {
        const result = super.getTdlCopy(newKey);
        result["items"] = [];
        for (const item of this.getItems()) {
            result["items"].push(structuredClone(item.generateTdl()));
        }
        return result;
    }

    // -------------------------- sidebar ---------------------------
    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new GroupSidebar(this);
        }
    }

    jobsAsEditingModeBegins() {
        this.updateCoverage();
        this.shuffleWidgets();
        this.updateAppearance();
        super.jobsAsEditingModeBegins();
    }


    jobsAsOperatingModeBegins(): void {
        this.updateCoverage();
        this.shuffleWidgets();
        this.updateAppearance();
        super.jobsAsOperatingModeBegins()
    }
}
