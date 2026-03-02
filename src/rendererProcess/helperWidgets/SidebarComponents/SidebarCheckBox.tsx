import * as React from "react";
import { BaseWidgetSidebar } from "../../widgets/BaseWidget/BaseWidgetSidebar";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { SidebarComponent } from "./SidebarComponent";

export class SidebarCheckBox extends SidebarComponent {
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
        const [, forceUpdate] = React.useState({});

        return (
            <div
                style={this.getFormStyle()}
            >
                <div>{this.getLabel()}</div>
                <input
                    type="checkbox"
                    checked={this.getPropertyValue()}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        this.updateWidget(event, !this.getPropertyValue());
                        forceUpdate({});
                    }}
                />
            </div>
        );
    };

    updateWidget = (event: React.SyntheticEvent | null | undefined, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        // do not preventDefault()

        if (typeof propertyValue !== "boolean") {
            return;
        }

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

    setPropertyValue = (newValue: boolean) => {
        this.getObj()[this.getPropertyName()] = newValue;
    }
}