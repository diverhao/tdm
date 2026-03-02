import * as React from "react";
import { BaseWidgetSidebar } from "../../widgets/BaseWidget/BaseWidgetSidebar";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { SidebarComponent } from "./SidebarComponent";
import { Collapsible } from "../ColorPicker/Collapsible";
import { rgbaArrayToRgbaStr } from "../../../common/GlobalMethods";

export class SidebarColor extends SidebarComponent {
    private readonly _obj: Record<string, any>;
    private readonly _propertyName: string;
    private readonly _label: string;
    constructor(sidebar: BaseWidgetSidebar, obj: Record<string, any>, propertyName: string, label: string) {
        super(sidebar);
        this._obj = obj;
        this._propertyName = propertyName;
        this._label = label;
    }

    _Element = () => {

        return (
            <Collapsible
                rgbColorStr={this.getPropertyValue()}
                updateFromSidebar={(_event: React.SyntheticEvent | null | undefined, propertyName: string, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
                    this.updateWidget(_event, propertyValue);
                }}
                title={this.getLabel()}
                eventName={"border-color"}
            />
        );
    };

    updateWidget = (event: React.SyntheticEvent | null | undefined, propertyValueNumArray: number | string | number[] | string[] | boolean | undefined) => {
        event?.preventDefault();

        if (!Array.isArray(propertyValueNumArray)) {
            return;
        }

        if (propertyValueNumArray.length !== 4) {
            return;
        }

        if (typeof propertyValueNumArray[0] !== "number" || typeof propertyValueNumArray[1] !== "number" || typeof propertyValueNumArray[2] !== "number" || typeof propertyValueNumArray[3] !== "number") {
            return;
        }

        const propertyValue  = rgbaArrayToRgbaStr(propertyValueNumArray as number[]);

        const orig = this.getPropertyValue();

        if (propertyValue === orig) {
            return;
        } else {
            this.setPropertyValue(propertyValue);
        }

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };

    getObj = () => {
        return this._obj;
    }

    getPropertyName = () => {
        return this._propertyName;
    }

    getLabel = () => {
        return this._label;
    }

    getPropertyValue = () => {
        return this.getObj()[this.getPropertyName()];
    }

    setPropertyValue = (newValue: string) => {
        this.getObj()[this.getPropertyName()] = newValue;
    }
}
