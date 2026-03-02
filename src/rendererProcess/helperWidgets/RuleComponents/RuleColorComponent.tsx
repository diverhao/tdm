import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { BaseWidgetRule } from "../../widgets/BaseWidget/BaseWidgetRule";
import { RuleComponent } from "./RuleComponent";
import { Collapsible } from "../../helperWidgets/ColorPicker/Collapsible";
import * as GlobalMethods from "../../../common/GlobalMethods";

export class RuleColorComponent extends RuleComponent {
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
        const [, forceUpdate] = React.useState({});
        this._forceUpdateElement = () => {
            forceUpdate({});
        };


        return (
            <Collapsible
                rgbColorStr={this.getRuleTdl()["propertyValue"]}
                updateFromSidebar={(event: any, propertyName: string, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
                    event?.preventDefault();
                    
                    const rule = this.getRule();

                    let oldVal = rule.getPropertyValue();
                    let newVal = GlobalMethods.rgbaArrayToRgbaStr(propertyValue as number[]);
                    
                    if (newVal === oldVal) {
                        return;
                    } else {
                        rule.setPropertyValue(newVal);
                    }
                    if (this._forceUpdateElement !== undefined) {
                        this._forceUpdateElement();
                    }
                }}
                title={"is"}
                eventName={"background-color"}
            />
        );
    };

    updatePropertyValue = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        if (event) {
            event.preventDefault();
        }
        const ruleTdl = this.getRuleTdl();
        let newVal = undefined;
        let oldVal = undefined;
        newVal = GlobalMethods.rgbaArrayToRgbaStr(propertyValue as number[]);
        oldVal = ruleTdl["propertyValue"];
        if (newVal === oldVal) {
            return;
        } else {
            ruleTdl["propertyValue"] = newVal;
        }

        if (this._forceUpdateElement !== undefined) {
            this._forceUpdateElement();
        }

        // the history for color is handled inside Collpsible
        // no need to flush widget
    };

    /**
     * evalue the input string at runtime, the input string is
     * a color
     */
    evaluatePropertyValue = (input: string): Record<string, any> => {
        const propertyName = this.getPropertyName();
        const objName = this.getObjName();
        const result: Record<string, any> = {};
        const result1: Record<string, any> = {};
        result1[propertyName] = input;
        result[objName] = result1;

        if (!GlobalMethods.isValidRgbaColor(input)) {
            return result;
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
