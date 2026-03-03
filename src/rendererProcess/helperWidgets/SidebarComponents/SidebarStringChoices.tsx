import * as React from "react";
import { BaseWidgetSidebar } from "../../widgets/BaseWidget/BaseWidgetSidebar";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { SidebarComponent } from "./SidebarComponent";

export class SidebarStringChoices extends SidebarComponent {
    private readonly _obj: Record<string, any>;
    private readonly _propertyName: string;
    private readonly _label: string;
    private readonly _options: Record<string, string> | Record<string, Record<string, string>> = {};
    private readonly _extraStyle: Record<string, any>;
    constructor(sidebar: BaseWidgetSidebar, obj: Record<string, any>, propertyName: string, label: string, options: Record<string, string> | Record<string, Record<string, string>>, extraStyle: Record<string, any> = {}) {
        super(sidebar);
        this._obj = obj;
        this._propertyName = propertyName;
        this._label = label;
        this._options = options;
        this._extraStyle = extraStyle;
    }

    _Element = () => {

        if (typeof Object.values(this.getOptions())[0] === "object") {
            return (
                <form style={this.getFormStyle()}>
                    <div>
                        {this.getLabel()}
                    </div>
                    <select
                        style={{ ...this.getSelectStyle(), ...this.getExtraStyle() }}
                        onChange={(event) => {
                            this.updateWidget(event, event.target.value);
                        }}
                        defaultValue={this.getPropertyValue()}
                    >
                        {Object.entries(this.getOptions()).map(([groupName, groupMembers]: [string, Record<string, string>], index: number) => {
                            return (
                                <optgroup label={groupName} key={`${groupName}-${index}`}>
                                    {Object.entries(groupMembers).map(([optionName, optionValue]: [string, string], index: number) => {
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
                        style={{ ...this.getSelectStyle(), ...this.getExtraStyle() }}
                        onChange={(event) => {
                            this.updateWidget(event, event.target.value);
                        }}
                        defaultValue={this.getPropertyValue()}
                    >
                        {Object.entries(this.getOptions()).map(([optionName, optionValue]: [string, string], index: number) => {
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

        if (typeof propertyValue !== "string") {
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

    getExtraStyle = () => {
        return this._extraStyle;
    }

    setPropertyValue = (newValue: string) => {
        this.getObj()[this.getPropertyName()] = newValue;
    }
}