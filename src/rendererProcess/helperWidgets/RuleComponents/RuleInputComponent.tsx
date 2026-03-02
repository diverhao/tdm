import * as React from "react";
import { BaseWidgetRule } from "../../widgets/BaseWidget/BaseWidgetRule";
import { RuleComponent } from "./RuleComponent";
import * as mathjs from "mathjs";
import { g_widgets1 } from "../../global/GlobalVariables";
import { Log } from "../../../common/Log";

export class RuleInputComponent extends RuleComponent {
    private _obj: Record<string, any>;
    private _objName: string;
    private _propertyValueType: "string" | "number";
    private _propertyName: string;
    constructor(rule: BaseWidgetRule, objName: "text" | "style", propertyName: string, propertyValueType: "string" | "number") {
        super(rule);
        this._propertyName = propertyName;
        this._propertyValueType = propertyValueType;
        this._objName = objName;
        const style = this.getRule().getRules().getMainWidget().getStyle();
        const text = this.getRule().getRules().getMainWidget().getText();
        this._obj = text
        if (objName === "text") {
            this._obj = text;
        } else if (objName === "style") {
            this._obj = style;
        }
    }

    ElementPropertyValue = () => {
        const [propertyValue, setPropertyValue] = React.useState<string>(`${this.getRule().getPropertyValue()}`);

        return (
            <form
                onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                    // write whatever to the rule TDL
                    event?.preventDefault();

                    if (typeof propertyValue !== "string") {
                        return;
                    }

                    this.getRule().setPropertyValue(propertyValue);

                    // history
                    const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
                    history.registerAction();
                    // no need to flush widget
                }}
                style={this.getRule().getFormStyle()}
            >
                <div>value is</div>
                <input
                    style={this.getRule().getInputStyle()}
                    type="text"
                    name="left"
                    value={propertyValue}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        setPropertyValue(event.target.value);
                    }}
                    onBlur={(event) => {
                        const origStr = this.getRule().getPropertyValue();
                        if (origStr !== propertyValue) {
                            setPropertyValue(`${origStr}`);
                        }
                    }}
                />
            </form>
        );
    };

    /**
     * evalue the input string, we are expecting a propertyValueType data, 
     * either a "number" or "string", then generate a 
     */
    evaluatePropertyValue = (input: string): Record<string, any> => {
        const propertyName = this.getPropertyName();
        const objName = this.getObjName();
        const propertyValueType = this.getPropertyValueType();
        const result: Record<string, any> = {};
        result[objName] = {};
        try {
            let propertyValue: string | number = input;
            if (propertyValueType === "number") {
                const propertyValueNum = parseFloat(propertyValue);
                if (isNaN(propertyValueNum)) {
                    result[objName] = {};
                    return result;
                } else {
                    propertyValue = propertyValueNum;
                }
            }
            const result1: Record<string, any> = {};
            result1[propertyName] = propertyValue;
            result[objName] = result1;
        } catch (e) {
            Log.error(e);
        }
        return result;
    };

    // --------------------- getters ------------------------

    getObj = () => {
        return this._obj;
    }

    getObjName = () => {
        return this._objName;
    }

    getPropertyName = () => {
        return this._propertyName;
    }

    getPropertyValueType = () => {
        return this._propertyValueType;
    }

    /**
     * used in BaseWidgetRules.renewRuleComponent() to initialize the rule TDL
     * value by retriving the current static value, e.g. style["left"]
     */
    getWidgetValue = () => {
        return this.getObj()[this.getPropertyName()];
    };

}
