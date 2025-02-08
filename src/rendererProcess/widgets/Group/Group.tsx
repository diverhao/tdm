import * as React from "react";
import { MouseEvent } from "react";
import { GlobalVariables, g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { GroupSelection2 } from "../../helperWidgets/GroupSelection/GroupSelection2";
import { GroupSidebar } from "./GroupSidebar";
import * as GlobalMethods from "../../global/GlobalMethods";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import {Log} from "../../../mainProcess/log/Log";

export type type_Group_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
    itemNames: string[];
    itemBackgroundColors: string[];
    widgetKeys: string[][];
};

export class Group extends BaseWidget {
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

    // _rules: TextUpdateRules;

    _itemNames: string[];
    _itemBackgroundColors: string[];
    _widgetKeys: string[][];

    _allWidgetKeys: string[] = [];
    _tmp_itemBackgroundColor = "rgba(0,0,0,0.14159265358979323846264338327)";

    constructor(widgetTdl: type_Group_tdl) {
        super(widgetTdl);

        this.setStyle({ ...Group._defaultTdl.style, ...widgetTdl.style });
        this.setText({ ...Group._defaultTdl.text, ...widgetTdl.text });

        // this._rules = new TextUpdateRules(this, widgetTdl);

        this.setSelectedGroup(this.getText()["selectedGroup"]);

        this._itemNames = JSON.parse(JSON.stringify(widgetTdl["itemNames"]));
        this._itemBackgroundColors = JSON.parse(JSON.stringify(widgetTdl["itemBackgroundColors"]));
        this._widgetKeys = JSON.parse(JSON.stringify(widgetTdl["widgetKeys"]));

        // this._sidebar = new GroupSidebar(this);
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

    // Body + sidebar
    _ElementRaw = () => {
        // must do it for every widget
        g_widgets1.removeFromForceUpdateWidgets(this.getWidgetKey());
        this.renderChildWidgets = true;
        React.useEffect(() => {
            this.renderChildWidgets = false;
        });

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
    _ElementBodyRaw = (): JSX.Element => {
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

    // only shows the text, all other style properties are held by upper level _ElementBodyRaw
    _ElementAreaRaw = ({ }: any): JSX.Element => {
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
                <this._ElementGroups></this._ElementGroups>
            </div>
        );
    };

    _ElementGroups = () => {
        const [, forceUpdate] = React.useState({});
        // todo: looks like we don't need this, it causes flash when we start to move the Group widget
        // what does it do?
        // do it once
        React.useEffect(() => {
            // this.updateGroup(this.getSelectedGroup());
            // g_flushWidgets();
        }, []);

        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                }}
            >
                {this.getItemNames().map((itemName: string, index: number) => {
                    return <this._ElementGroup index={index}></this._ElementGroup>;
                })}
                {<this._ElementTabs></this._ElementTabs>}
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
                            key={`${itemName}-${index}-${this.getItemNames()[index]}`}
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
                            onMouseDown={(event: any) => {
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

    selectGroup = (index: number, doFlush: boolean = false) => {
        // select this widget first
        this.simpleSelect(false);
        // this widget may have been selected, we must do it again to successfully refresh it when we click the
        // tab
        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        // then selection others, why??
        for (let widgetKey of this.getWidgetKeys()[index]) {
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
                    backgroundColor: this.getItemBackgroundColors()[index],
                    visibility: index === this.getSelectedGroup() ? "visible" : "hidden",
                }}
                onMouseDown={(event: any) => {
                    this._handleMouseDown(event);
                    if (g_widgets1.isEditing()) {
                        this.updateGroup(index);
                        this.selectGroup(index);
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

    _handleMouseDownOnResizer(event: MouseEvent, index: "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H") {
        super._handleMouseDownOnResizer(event, index);
        if (g_widgets1.isEditing()) {
            if (this._tmp_itemBackgroundColor === "rgba(0,0,0,0.14159265358979323846264338327)") {
                this._tmp_itemBackgroundColor = this.getItemBackgroundColors()[this.getSelectedGroup()];
                this.getItemBackgroundColors()[this.getSelectedGroup()] = "rgba(0,0,0,0)";
            }
        }
    }

    _handleMouseUpOnResizer(event: any, index: "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H") {
        super._handleMouseUpOnResizer(event, index);
        if (g_widgets1.isEditing()) {
            this.getItemBackgroundColors()[this.getSelectedGroup()] = this._tmp_itemBackgroundColor;
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
        for (let widgetKeys of this.getWidgetKeys()) {
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
        this.getWidgetKeys()[this.getSelectedGroup()] = [];
        for (let widgetKey of this.getAllWidgetKeys()) {
            try {
                const widget = g_widgets1.getWidget2(widgetKey);
                if (widget instanceof BaseWidget) {
                    widget.simpleDeselect(true);

                    if (widget.getStyle()["visibility"] === "visible" || widget.getStyle()["visibility"] === undefined) {
                        this.getWidgetKeys()[this.getSelectedGroup()].push(widgetKey);
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
        for (let widgetKey of this.getWidgetKeys()[this.getSelectedGroup()]) {
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

    // ----------------------- styles -----------------------

    // defined in super class
    // _resizerStyle
    // _resizerStyles
    // StyledToolTipText
    // StyledToolTip

    // -------------------------- tdl -------------------------------

    // properties when we create a new TextUpdate
    // the level 1 properties all have corresponding public or private variable in the widget
    static _defaultTdl: type_Group_tdl = {
        type: "Group",
        widgetKey: "", // "key" is a reserved keyword
        key: "",
        // the style for outmost div
        // these properties are explicitly defined in style because they are
        // (1) different from default CSS settings, or
        // (2) they may be modified
        style: {
            position: "absolute",
            display: "inline-block",
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
        },
        channelNames: [],
        groupNames: [],
        rules: [],
        itemNames: ["Group-1"],
        itemBackgroundColors: ["rgba(255,255,255,1)"],
        widgetKeys: [[]],
    };

    // not getDefaultTdl(), always generate a new key
    static generateDefaultTdl = (type: string): Record<string, any> => {
        const result = super.generateDefaultTdl(type);
        result.style = JSON.parse(JSON.stringify(this._defaultTdl.style));
        result.text = JSON.parse(JSON.stringify(this._defaultTdl.text));
        result.channelNames = JSON.parse(JSON.stringify(this._defaultTdl.channelNames));
        result.groupNames = JSON.parse(JSON.stringify(this._defaultTdl.groupNames));
        result.itemNames = JSON.parse(JSON.stringify(this._defaultTdl.itemNames));
        result.itemBackgroundColors = JSON.parse(JSON.stringify(this._defaultTdl.itemBackgroundColors));
        result.widgetKeys = JSON.parse(JSON.stringify(this._defaultTdl.widgetKeys));
        return result;
    };

    // defined in super class
    getTdlCopy(newKey: boolean) {
        const result = super.getTdlCopy(newKey);
        result["itemNames"] = JSON.parse(JSON.stringify(this.getItemNames()));
        result["itemBackgroundColors"] = JSON.parse(JSON.stringify(this.getItemBackgroundColors()));
        result["widgetKeys"] = JSON.parse(JSON.stringify(this.getWidgetKeys()));
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

    getItemBackgroundColors = () => {
        return this._itemBackgroundColors;
    };

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

    getWidgetKeys = () => {
        return this._widgetKeys;
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
            this._sidebar = new GroupSidebar(this);
        }
    }
}
