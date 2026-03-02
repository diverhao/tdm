import * as React from "react";
import { BaseWidgetRule } from "../../widgets/BaseWidget/BaseWidgetRule";
import { RuleComponent } from "./RuleComponent";
import * as mathjs from "mathjs";
import { g_widgets1 } from "../../global/GlobalVariables";
import { Log } from "../../../common/Log";

export class RuleChoicesComponent extends RuleComponent {
    private _obj: Record<string, any>;
    private _objName: string;
    private _propertyValueType: "string" | "number";
    private _propertyName: string;
    private _choices: Record<string, string>;
    constructor(rule: BaseWidgetRule, objName: "text" | "style", propertyName: string, propertyValueType: "string" | "number", choices: Record<string, string>) {
        super(rule);
        this._propertyName = propertyName;
        this._propertyValueType = propertyValueType;
        this._objName = objName;
        this._choices = choices;
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
        return (
            <form style={this.getFormStyle()}>
                <div>
                    is:
                </div>
                <select
                    style={{ ...this.getInputStyle() }}
                    onChange={(event) => {
                        event?.preventDefault();

                        const propertyValue = event.target.value; // always a string
                        this.getRule().setPropertyValue(propertyValue);

                        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
                        history.registerAction();
                        // no need to flush widget
                    }}
                    defaultValue={this.getRule().getPropertyValue()}
                >
                    {Object.entries(this.getChoices()).map(([choiceName, choiceValue]: [string, number | string], index: number) => {
                        return (
                            <option
                                key={`${index}-${choiceValue}`}
                                value={choiceValue}
                            >
                                {choiceName}
                            </option>
                        )
                    })}
                </select>
            </form>

        )
    };

    updatePropertyValue = (event: React.SyntheticEvent | null | undefined, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        if (event) {
            event.preventDefault();
        }

        const oldValStr = `${this.getRule().getPropertyValue()}`;
        const newValStr = `${propertyValue}`;

        if (oldValStr === newValStr) {
            return;
        } else {
            this.getRule().setPropertyValue(newValStr);
        }

        // history
        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        // no need to flush widget
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
            // no need to evaluate
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

    getChoices = () => {
        return this._choices;
    }

    /**
     * used in BaseWidgetRules.renewRuleComponent() to initialize the rule TDL
     * value by retriving the current static value, e.g. style["left"]
     */
    getWidgetValue = () => {
        return this.getObj()[this.getPropertyName()];
    };
}
