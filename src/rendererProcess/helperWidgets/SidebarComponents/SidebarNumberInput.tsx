import * as React from "react";
import { BaseWidgetSidebar } from "../../widgets/BaseWidget/BaseWidgetSidebar";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { SidebarComponent } from "./SidebarComponent";

export class SidebarNumberInput extends SidebarComponent {
    private readonly _obj: Record<string, any>;
    private readonly _propertyName: string;
    private readonly _label: string;
    private readonly _isUpdatedFromWidget: boolean;
    constructor(sidebar: BaseWidgetSidebar, obj: Record<string, any>, propertyName: string, label: string, isUpdatedFromWidget: boolean = false) {
        super(sidebar);
        this._obj = obj;
        this._propertyName = propertyName;
        this._label = label;
        this._isUpdatedFromWidget = isUpdatedFromWidget;
    }

    _Element = () => {
        const [numStr, setNumStr] = React.useState<string>(`${this.getPropertyValue()}`);

        if (this.isUpdatedFromWidget()) {
            this._updateFromWidget = (propertyValue: number) => {
                setNumStr(`${propertyValue}`);
            };
        }

        return (
            <form
                onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                    const num = parseFloat(numStr);
                    if (isNaN(num)) {
                        const orig = this.getPropertyValue();
                        setNumStr(`${orig}`);
                        return;
                    } else {
                        this.updateWidget(event, num);
                    }
                }}
                // todo
                style={this.getFormStyle()}
            >
                <this._ElementInputLabel
                    value={numStr}
                    setValue={setNumStr}
                    readableText={this.getLabel()}
                    updater={(newValue: string) => { this.updateWidget(undefined, newValue) }}
                >
                    {this.getLabel()}
                </this._ElementInputLabel>
                <input
                    style={{ ...this.getInputStyle(), width: "65.6%" }}
                    type="string"
                    name="text"
                    value={numStr}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        const newVal = event.target.value;
                        setNumStr(newVal);
                    }}
                    // must use enter to change the value
                    onBlur={(event) => {
                        const orig = this.getPropertyValue();
                        if (`${orig}` !== numStr) {
                            setNumStr(`${orig}`);
                        }
                    }}
                />
            </form>
        );
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

    getPropertyValue = () => {
        return this.getObj()[this.getPropertyName()];
    }

    isUpdatedFromWidget = () => {
        return this._isUpdatedFromWidget;
    }

    setPropertyValue = (newValue: number) => {
        this.getObj()[this.getPropertyName()] = newValue;
    }
}
