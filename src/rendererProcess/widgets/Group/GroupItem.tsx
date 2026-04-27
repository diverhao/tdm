import { Log } from "../../../common/Log";
import { type_Group_item_tdl } from "../../../common/types/type_widget_tdl";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { Group } from "./Group";
import { v4 as uuidv4 } from "uuid";

export class GroupItem {
    private readonly _group: Group;
    private _widgetKeys: string[] = [];
    private readonly _groupKey: string = `group_widget_group_${uuidv4}`;

    getGroupKey = () => {
        return this._groupKey;
    }

    private _selected: boolean = false;

    getSelected = () => {
        return this._selected;
    }

    setSelected = (isSelected: boolean) => {
        this._selected = isSelected;
        if (isSelected === true) {
            for (const item of this.getGroup().getItems()) {
                if (item !== this) {
                    item.setSelected(false);
                }
            }
        }
    }

    private _name: string = "";
    private _backgroundColor: string = "";

    // it is either empty or filled with widgets that are in _widgetKeys
    private _widgets: BaseWidget[] = [];
    constructor(group: Group, item: type_Group_item_tdl) {
        this._group = group;
        this._name = item["name"];
        this._backgroundColor = item["backgroundColor"];
        this._widgetKeys = [...item["widgetKeys"]];
    }

    getGroup = () => {
        return this._group;
    }

    getName = () => {
        return this._name;
    }

    setName = (newName: string) => {
        this._name = newName;
    }

    getBackgroundColor = () => {
        return this._backgroundColor;
    }

    setBackgroundColor = (newColor: string) => {
        this._backgroundColor = newColor;
    }

    getWidgetKeys = () => {
        return this._widgetKeys;
    }

    getWidgets = () => {
        return this._widgets;
    }

    /**
     * update all the widget's appearance in this item: if this item
     * is selected, then show these widgets, if not hide them.
     * 
     * (1) show all the widgets in this item. The reason for this step is there might
     *     be widgets that belong to this item, but they were still hidden because they were
     *     in another item
     * 
     * (2) hide them if this item is not selected
     * 
     * (3) flush widgets
     */
    updateWidgets = (flush: boolean = false) => {
        // (1)
        for (const widgetKey of this.getWidgetKeys()) {
            try {
                const widget = g_widgets1.getWidget2(widgetKey);
                if (widget instanceof BaseWidget) {
                    const style = widget.getStyle();
                    style["display"] = "inline-flex";
                    g_widgets1.addToForceUpdateWidgets(widget.getWidgetKey());
                }
            } catch (e) {
                Log.error(e);
            }
        }

        // (2)
        if (this === this.getGroup().getSelectedItem()) {
            // if this item is selected, keep showing these widgets
            return;
        }
        // if this item is not selected, hide them
        for (const widgetKey of this.getWidgetKeys()) {
            try {
                const widget = g_widgets1.getWidget2(widgetKey);
                if (widget instanceof BaseWidget) {
                    const style = widget.getStyle();
                    style["display"] = "none";
                }
            } catch (e) {
                Log.error(e);
            }
        }

        // (3)
        if (flush) {
            g_flushWidgets();
        }
    }

    removeWidgetKey = (widgetKey: string) => {
        for (let ii = 0; ii < this.getWidgetKeys().length; ii++) {
            if (this.getWidgetKeys()[ii] === widgetKey) {
                this.getWidgetKeys().splice(ii, 1);
                return;
            }
        }
    }

    generateTdl = (): type_Group_item_tdl => {
        return {
            name: this.getName(),
            backgroundColor: this.getBackgroundColor(),
            widgetKeys: this.getWidgetKeys(),

        }
    }

}
