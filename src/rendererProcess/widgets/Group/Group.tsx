import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { GroupSelection2 } from "../../helperWidgets/GroupSelection/GroupSelection2";
import { GroupSidebar } from "./GroupSidebar";
import * as GlobalMethods from "../../../common/GlobalMethods";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { Log } from "../../../common/Log";
import { defaultGroupTdl, type_Group_item_tdl as type_Group_item, type_Group_tdl } from "../../../common/types/type_widget_tdl";

export class Group extends BaseWidget {

    private _items: type_Group_item[] = [];
    _allWidgetKeys: string[] = [];
    _tmp_itemBackgroundColor = "rgba(0,0,0,0.14159265358979323846264338327)";

    constructor(widgetTdl: type_Group_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this.setReadWriteType("write");

        this.setSelectedGroup(this.getText()["selectedGroup"]);

        this._items = structuredClone(widgetTdl["items"]);
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
            >
                <this._ElementGroups></this._ElementGroups>
            </div>
        );
    };

    _ElementGroups = () => {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                }}
            >
                {this.getItems().map((item: type_Group_item, index: number) => {
                    return <this._ElementGroup index={index}></this._ElementGroup>;
                })}
                {<this._ElementTabs></this._ElementTabs>}
            </div>
        );
    };
    
    _ElementGroup = ({ index }: any) => {
        // when the Group widget is being resized, deselect all its child widgets in all sub-groups,
        // so that these children won't be resized
        if (g_widgets1.getRendererWindowStatusStr().includes("resizingWidget")) {
            this.updateGroup(this.getSelectedGroup());
            if (this.isSelected()) {
                // deselect all insider widgets
                for (let widgetKey of this.getAllWidgetKeys()) {
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
                for (let widgetKey of this.getAllWidgetKeys()) {
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
                    backgroundColor: this.getItemBackgroundColor(index),
                    visibility: index === this.getSelectedGroup() ? "visible" : "hidden",
                    display: "inline-flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}
                onMouseDown={(event) => {
                    this._handleMouseDown(event);
                    if (g_widgets1.isEditing()) {
                        this.updateGroup(index);
                        this.selectGroup(index);
                    }
                }}
                onMouseUp={(event) => {
                    // todo: why did we need this? It causes unexpected selection of the Group widget
                    // todo: when the mouse is up, even we are not selecting this widget
                    if (g_widgets1.isEditing()) {
                        // this.updateGroup(index);
                        // thisselectGroup(index, true);
                    }
                }}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                {this.getText()["showBox"] === false ? null :
                    <>
                        <div
                            style={{
                                left: 30,
                                top: 0,
                                position: "absolute",
                                backgroundColor: this.getItemBackgroundColor(index),
                                paddingLeft: 5,
                                paddingRight: 5,
                            }}
                        >
                            {this.getItemName(index)}
                        </div>
                        <div
                            style={{
                                width: "calc(100% - 15px)",
                                height: "calc(100% - 15px)",
                                border: `1.5px solid ${this.getAllStyle()["color"]}`
                            }}
                        >
                        </div>
                    </>
                }
            </div>
        );
    };
    _ElementTabs = () => {
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
                {
                    this.getAllText()["showTab"] === false ? null :
                        this.getItems().map((item: type_Group_item, index: number) => {
                            const itemName = item["name"];
                            return (
                                <div
                                    key={`${itemName}-${index}`}
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
                                            this.getSelectedGroup() === index ? this.getText()["tabSelectedColor"] : this.getText()["tabDefaultColor"],
                                        // border: "solid 1px black",
                                        fontWeight: this.getSelectedGroup() === index ? "bold" : "normal",
                                        overflow: "hidden",
                                        whiteSpace: "nowrap",
                                        padding: 4,
                                        borderRadius: 4,
                                        margin: 3,
                                        // marginBottom: 5,
                                        // marginTop: 15,
                                        // marginLeft: 15,
                                    }}
                                    onMouseDown={(event) => {
                                        // event.preventDefault();
                                        // forceUpdate({});
                                        // this.selectTab(index);
                                        event.stopPropagation();
                                        this.updateGroup(index);

                                        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());

                                        if (g_widgets1.isEditing()) {
                                            this.selectGroup(index, true);
                                        }
                                        g_widgets1.updateSidebar(true);
                                        g_flushWidgets();
                                    }}
                                >
                                    {itemName}
                                </div>
                            );
                        })}
            </div>
        );
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

    removeGroupMembers = () => {
        for (const widgetKey of this.getAllWidgetKeys()) {
            try {
                const widget = g_widgets1.getWidget2(widgetKey);
                if (widget instanceof BaseWidget) {
                    g_widgets1.removeWidget(widgetKey, false, false);
                }
            } catch (e) {
                Log.error(e);
            }
        }
        g_flushWidgets();
    };

    selectGroup = (index: number, doFlush: boolean = false) => {
        // select this widget first
        this.simpleSelect(false);
        // this widget may have been selected, we must do it again to successfully refresh it when we click the
        // tab
        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        // then selection others, why??
        const widgetKeys = this.getItemWidgetKeys(index);
        if (widgetKeys === undefined) {
            return;
        }
        for (let widgetKey of widgetKeys) {
            try {
                const widget = g_widgets1.getWidget2(widgetKey);
                if (widget instanceof BaseWidget) {
                    widget.simpleSelect(false);
                }
            } catch (e) {
                Log.error(e);
            }
        }
        g_widgets1.updateSidebar(true);
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");
        if (doFlush) {
            g_flushWidgets();
        }
    };

    _handleMouseDownOnResizer(event: React.MouseEvent<HTMLElement, MouseEvent>, index: "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H") {
        super._handleMouseDownOnResizer(event, index);
        if (g_widgets1.isEditing()) {
            if (this._tmp_itemBackgroundColor === "rgba(0,0,0,0.14159265358979323846264338327)") {
                const bg = this.getItemBackgroundColor(this.getSelectedGroup());
                if (bg === undefined) {
                    return;
                }
                this._tmp_itemBackgroundColor = bg;
                this.setItemBackgroundColor(this.getSelectedGroup(), "rgba(0,0,0,0)");
            }
        }
    }

    _handleMouseUpOnResizer(event: globalThis.MouseEvent, index: "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H") {
        super._handleMouseUpOnResizer(event, index);
        if (g_widgets1.isEditing()) {
            this.setItemBackgroundColor(this.getSelectedGroup(), this._tmp_itemBackgroundColor);
            this._tmp_itemBackgroundColor = "rgba(0,0,0,0.14159265358979323846264338327)";
            this.updateGroup(this.getSelectedGroup());
            this.selectGroup(this.getSelectedGroup(), true);
        }
    }

    // only update data and visibility, nothing about selection of widgets
    // (1) find all widgets inside the bound, put their widgetKeys to this._allWidgetKeys
    // (2) compare the this._allWidgetKeys and this._widgetKeys, if the widget is not in this._allWidgetKeys,
    //     it means this widget is not in-bound, then we remove this widgetKey out of this._widgetKeys
    //     and set its "visibility" style to "visible", no flush yet
    // (3) put all visible in-bound widgets to the old selected group's this._widgetKeys, and set their visibility to "hidden",
    //     before doing it, clear this this._widgetKeys[this.selectedGroup]
    // (4) update this._selectedGroup
    // (5) set all widgets that belong to the currently selected to group visible
    updateGroup = (index: number) => {
        // (1)
        this._updateCoverage(false);
        // (2)
        for (let item of this.getItems()) {
            const widgetKeys = item["widgetKeys"];
            for (let widgetKey of widgetKeys) {
                if (!this.getAllWidgetKeys().includes(widgetKey)) {
                    try {
                        const widget = g_widgets1.getWidget2(widgetKey);
                        if (widget instanceof BaseWidget) {
                            // widget.simpleDeselect(true);
                            widget.getStyle()["visibility"] = "visible";
                            g_widgets1.addToForceUpdateWidgets(widgetKey);
                        }
                    } catch (e) {
                        Log.error(e);
                    }
                }
            }
        }
        // (3)
        this.setItemWidgetKeys(this.getSelectedGroup(), []);
        for (let widgetKey of this.getAllWidgetKeys()) {
            try {
                const widget = g_widgets1.getWidget2(widgetKey);
                if (widget instanceof BaseWidget) {
                    widget.simpleDeselect(true);

                    if (widget.getStyle()["visibility"] === "visible" || widget.getStyle()["visibility"] === undefined) {
                        this.getItemWidgetKeys(this.getSelectedGroup())?.push(widgetKey);
                        widget.getStyle()["visibility"] = "hidden";
                        g_widgets1.addToForceUpdateWidgets(widgetKey);
                    }
                }
            } catch (e) {
                Log.error(e);
            }
        }

        // (4)
        this.setSelectedGroup(index);

        // (5)
        const widgetKeys = this.getItemWidgetKeys(this.getSelectedGroup());
        if (widgetKeys === undefined) {
            return;
        }
        for (let widgetKey of widgetKeys) {
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
        this.getAllWidgetKeys().length = 0;

        let selectionChanged = false;
        const group = g_widgets1.getGroupSelection2();
        const groupsInfo: Record<string, any> = {};

        for (let [widgetKey1, widget1] of g_widgets1.getWidgets2()) {
            // only select selectable widget, e.g. TextUpdate
            //todo: provide a programtic way to determine special widgets
            // const widgetType = widget1.getType();

            if (!(widget1 instanceof BaseWidget)) {
                continue;
            }

            // widget boundary
            // todo: more generic
            const widget = widget1 as BaseWidget;
            let widgetLeft = widget.getStyle().left;
            let widgetTop = widget.getStyle().top;
            let widgetRight = widgetLeft + widget.getStyle().width;
            let widgetDown = widgetTop + widget.getStyle().height;

            // "mouse selection region" boundary
            let regionLeft = this._style.left;
            let regionTop = this._style.top;
            let regionRight = regionLeft + this._style.width;
            let regionDown = regionTop + this._style.height;

            const isInside = regionLeft < widgetLeft && regionTop < widgetTop && regionDown > widgetDown && regionRight > widgetRight;
            const wasInside = widget.isSelected();

            if (widget.isInGroup()) {
                // if widget is in a group, topGroupName must be a string
                const topGroupName = widget.getTopGroupName() as string;
                if (groupsInfo[topGroupName] === undefined) {
                    groupsInfo[topGroupName] = {
                        totalCount: 0,
                        insideCount: 0,
                        // any widget in this group
                        memberName: widget.getWidgetKey(),
                    };
                }
                // add total count
                groupsInfo[topGroupName].totalCount++;
                if (isInside) {
                    groupsInfo[topGroupName].insideCount++;
                }
            } else {
                if (isInside) {
                    this.getAllWidgetKeys().push(widget.getWidgetKey());
                }
            }
        }

        // ------ group --------
        for (const groupInfo of Object.values(groupsInfo)) {
            // todo: more generic
            const widget = g_widgets1.getWidget2(groupInfo.memberName);
            if (widget instanceof BaseWidget) {
                // if (groupInfo.totalCount === groupInfo.insideCount && !widget.isSelected()) {
                if (groupInfo.totalCount === groupInfo.insideCount) {
                    // select the whole group
                    // widget.selectOnMouseMove();

                    const topGroupName = widget.getTopGroupName();
                    for (let [, widget] of g_widgets1.getWidgets2()) {
                        if (widget instanceof BaseWidget && widget.getTopGroupName() === topGroupName) {
                            this.getAllWidgetKeys().push(widget.getWidgetKey());
                            // widget.simpleSelect(doFlush);
                        }
                    }

                    selectionChanged = true;
                }
                // if (groupInfo.totalCount !== groupInfo.insideCount && widget.isSelected()) {
                if (groupInfo.totalCount !== groupInfo.insideCount) {
                    // deselect the whole group
                    // the widget must have been in a group
                    const index = this.getAllWidgetKeys().indexOf(widget.getWidgetKey());
                    if (index > -1) {
                        // this.getWidgets().splice(index, 1);

                        const topGroupName = widget.getTopGroupName();
                        for (let [, widget] of g_widgets1.getWidgets2()) {
                            if (widget instanceof BaseWidget && widget.getTopGroupName() === topGroupName) {
                                this.getAllWidgetKeys().splice(index, 1);
                                // widget.simpleSelect(doFlush);
                            }
                        }
                    }
                    // widget.simpleDeselectGroup(false);
                    selectionChanged = true;
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
    _ElementBody = React.memo(this._ElementBodyRaw, () => this._useMemoedElement());

    // -------------------- helper functions ----------------

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
        result["items"] = structuredClone(this.getItems());
        return result;
    }

    // --------------------- getters -------------------------

    getItems = () => {
        return this._items;
    }

    getItem = (index: number): type_Group_item | undefined => {
        return this.getItems()[index];
    }

    getItemName = (index: number) => {
        const item = this.getItem(index);
        if (item === undefined) {
            return undefined;
        } else {
            return item["name"];
        }
    }

    setItemName = (index: number, newName: string) => {
        const item = this.getItem(index);
        if (item === undefined) {
            return;
        } else {
            item["name"] = newName;
        }
    }

    getItemBackgroundColor = (index: number) => {
        const item = this.getItem(index);
        if (item === undefined) {
            return undefined;
        } else {
            return item["backgroundColor"];
        }
    }

    setItemBackgroundColor = (index: number, newColor: string) => {
        const item = this.getItem(index);
        if (item === undefined) {
            return;
        } else {
            item["backgroundColor"] = newColor;
        }
    }

    getItemWidgetKeys = (index: number) => {
        const item = this.getItem(index);
        if (item === undefined) {
            return undefined;
        } else {
            return item["widgetKeys"];
        }
    }

    setItemWidgetKeys = (index: number, newWidgetKeys: string[]) => {
        const item = this.getItem(index);
        if (item === undefined) {
            return;
        } else {
            item["widgetKeys"] = newWidgetKeys;
        }
    }


    getAllWidgetKeys = () => {
        return this._allWidgetKeys;
    };

    getSelectedGroup = () => {
        // return this._selectedGroup;
        return this.getText()["selectedGroup"];
    };

    setSelectedGroup = (newIndex: number) => {
        // this._selectedGroup = newIndex;
        this.getText()["selectedGroup"] = newIndex;
    };


    // -------------------------- sidebar ---------------------------
    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new GroupSidebar(this);
        }
    }
}
