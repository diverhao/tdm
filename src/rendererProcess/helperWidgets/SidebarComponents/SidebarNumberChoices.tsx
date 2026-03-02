import * as React from "react";
import { BaseWidgetSidebar } from "../../widgets/BaseWidget/BaseWidgetSidebar";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { SidebarComponent } from "./SidebarComponent";
import { GlobalVariables } from "../../../common/GlobalVariables";

export class SidebarNumberChoices extends SidebarComponent {
    private readonly _obj: Record<string, any>;
    private readonly _propertyName: string;
    private readonly _label: string;
    private readonly _options: Record<string, number> | Record<string, Record<string, number>> = {};
    constructor(sidebar: BaseWidgetSidebar, obj: Record<string, any>, propertyName: string, label: string, options: Record<string, number> | Record<string, Record<string, number>>) {
        super(sidebar);
        this._obj = obj;
        this._propertyName = propertyName;
        this._label = label;
        this._options = options;
    }

    _Element = () => {

        if (typeof Object.values(this.getOptions())[0] === "object") {
            return (
                <form style={this.getFormStyle()}>
                    <div>
                        {this.getLabel()}
                    </div>
                    <select
                        style={{ ...this.getInputStyle() }}
                        onChange={(event) => {
                            this.updateWidget(event, event.target.value);
                        }}
                        defaultValue={this.getPropertyValue()}
                    >
                        {Object.entries(this.getOptions()).map(([groupName, groupMembers]: [string, Record<string, number>], index: number) => {
                            return (
                                <optgroup label={groupName} key={`${groupName}-${index}`}>
                                    {Object.entries(groupMembers).map(([optionName, optionValue]: [string, number], index: number) => {
                                        return (
                                            <option
                                                key={`${index}-${optionValue}`}
                                                value={optionValue}
                                            >
                                                {optionName}
                                            </option>
                                        )
                                    })}
                                </optgroup>
                            )
                        })}
                    </select>
                </form>
            )
        } else {
            return (
                <form style={this.getFormStyle()}>
                    <div>
                        {this.getLabel()}
                    </div>
                    <select
                        style={{ ...this.getInputStyle() }}
                        onChange={(event) => {
                            let num = parseInt(event.target.value);
                            if (isNaN(num)) {
                                num = GlobalVariables.defaultFontSize;
                            }
                            this.updateWidget(event, num);
                        }}
                        defaultValue={this.getPropertyValue()}
                    >
                        {Object.entries(this.getOptions()).map(([optionName, optionValue]: [string, number], index: number) => {
                            return (
                                <option
                                    key={`${index}-${optionValue}`}
                                    value={optionValue}
                                >
                                    {optionName}
                                </option>
                            )
                        })}
                    </select>
                </form>
            );
        }
    };


    updateWidget = (event: React.SyntheticEvent | null | undefined, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        event?.preventDefault();

        if (typeof propertyValue !== "number") {
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

    getOptions = () => {
        return this._options;
    }

    getPropertyValue = () => {
        return this.getObj()[this.getPropertyName()];
    }

    setPropertyValue = (newValue: number) => {
        this.getObj()[this.getPropertyName()] = newValue;
    }
}