import * as React from "react";
import { BaseWidgetRule } from "../../widgets/BaseWidget/BaseWidgetRule";
import { RuleComponent } from "./RuleComponent";
import * as mathjs from "mathjs";
import { g_widgets1 } from "../../global/GlobalVariables";

export class RuleCheckBoxComponent extends RuleComponent {
    private _obj: Record<string, any>;
    private _objName: string;
    private _propertyName: string;
    constructor(rule: BaseWidgetRule, objName: "text" | "style", propertyName: string) {
        super(rule);
        this._propertyName = propertyName;
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
        // "true" or "false"
        // const [showArrowHead, setShowArrowHead] = React.useState(`${this.getRule().getPropertyValue()}`);
        const [, forceUpdate] = React.useState({});

        let booleanValue = false;
        try {
            const propertyValue = this.getRule().getPropertyValue();
            if (propertyValue === undefined) {
                booleanValue = false;
            } else {
                booleanValue = mathjs.evaluate(propertyValue);
            }
        } catch (e) {
            booleanValue = false;
        }

        return (
            <form style={this.getRule().getFormStyle()}>
                <div>is</div>
                <input
                    type="checkbox"
                    checked={booleanValue}
                    // onChange={(event: any) => {
                    // 	if (showArrowHead === "true") {
                    // 		this.updatePropertyValue(event, "false");
                    // 		setShowArrowHead("false");
                    // 	} else {
                    // 		this.updatePropertyValue(event, "true");
                    // 		setShowArrowHead("true");
                    // 	}
                    // }}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        // do not prevent default

                        // const oldValStr = `${this.getRule().getPropertyValue()}`;
                        // const newValStr = event.target.value;

                        // if (oldValStr === newValStr) {
                        //     return;
                        // } else {
                        //     this.getRule().setPropertyValue(newValStr);
                        // }
                        this.getRule().setPropertyValue(`${!booleanValue}`);
                        forceUpdate({});

                        // history
                        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
                        history.registerAction();
                        // no need to flush widget
                    }}
                />
            </form>
        );
    };

    updatePropertyValue = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        if (event) {
            // do not prevent default
            // event.preventDefault();
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
        const result: Record<string, any> = {};
        result[objName] = {};
        try {
            const propertyValue = mathjs.evaluate(input);
            const result1: Record<string, any> = {};
            result1[propertyName] = propertyValue;
            result[objName] = result1;
        } catch (e) {
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

    /**
     * used in BaseWidgetRules.renewRuleComponent() to initialize the rule TDL
     * value by retriving the current static value, e.g. style["left"]
     */
    getWidgetValue = () => {
        return this.getObj()[this.getPropertyName()];
    };

}
