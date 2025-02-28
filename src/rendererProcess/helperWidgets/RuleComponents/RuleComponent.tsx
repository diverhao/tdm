import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { BaseWidgetRule } from "../../widgets/BaseWidget/BaseWidgetRule";
import { GlobalVariables } from "../../global/GlobalVariables";
import { SidebarLargeInput } from "../../widgets/BaseWidget/SidebarLargeInput";


/**
 * To add a new rule component, do the following: <br>
 *
 * (1) create a rule component class, e.g. RuleBackgroundColor, representing the property in tdl. The rule component
 *     name should be the same as the Sidebar name, e.g. SidebarBackgroundColor. The name is referred to as "internal name" <br>
 * (1.1) note that the this.getRuleTdl()["propertyValue"] is always string or undefined, not the "number | string | number[] | string[] | boolean | undefined"
 * 
 * (2) In BaseWidgetRule.tsx, find createRuleComponent(), add an entry for this new rule. Key is a human-readle name. 
 *     One rule can correspond to several human-readble names. <br>
 * 
 * (3) In each widget's rule class file, e.g. TextUpdateRule.tsx, add the "human readable name" to list _ruleComponentTypes
 *     If this rule can be used by all widgets, add it to BaseWidgetRule._ruleComponentTypes
 * 
 * (4) Make sure the rule update functions are in TextUpdate._ElementRaw. In this way, the TextUpdate._rulesStyle and ._rulesText
 *     are updated everytime the widget is re-rendered (re-renderer occurs when a PV in ths widget is updated )
 * 
 * This class does not maintain any data. It provides JSX elements for bool expression and the property value.
 * It also provides an abstract rule-type-dependent method to evaluate the property value. 
 */

export abstract class RuleComponent {
    _rule: BaseWidgetRule;
    _forceUpdateElement: any;
    _sidebarLargeInput: SidebarLargeInput;
    constructor(rule: BaseWidgetRule) {
        this._rule = rule;
        this._sidebarLargeInput = new SidebarLargeInput();
    }

    abstract evaluatePropertyValue: (input: string) => { style?: Record<string, any>, text?: Record<string, any> };

    // ------------------- getters ------------------

    abstract getWidgetValue: () => any;

    getRuleTdl = () => {
        return this.getRule().getRuleTdl();
    };

    getRule = () => {
        return this._rule;
    };

    getSidebarLargeInput = () => {
        return this._sidebarLargeInput;
    }


    // ------------------------ property value JSX element  -------------------

    abstract ElementPropertyValue: () => JSX.Element;

    getElementPropertyValue = () => {
        return <this.ElementPropertyValue></this.ElementPropertyValue>;
    };

    // ------------------------ bool expression JSX element  -------------------

    ElementBoolExpression = () => {
        const [boolExpression, setBoolExpression] = React.useState(this.getRule().getBoolExpression());

        return (
            <form
                style={this.getRule().getFormStyle()}
                onSubmit={(event: any) => {
                    this.updateBoolExpression(event, boolExpression)
                }}
            >
                <this._ElementInputLabel
                    value={boolExpression}
                    setValue={setBoolExpression}
                    readableText={"Rule bool expression"}
                    updater={(newValue: string) => { this.updateBoolExpression(undefined, newValue) }}
                >
                    When
                </this._ElementInputLabel>
                <input
                    style={{ ...this.getRule().getInputStyle() }}
                    value={boolExpression}
                    onChange={(event: any) => {
                        event.preventDefault();
                        setBoolExpression(event.target.value);
                    }}
                ></input>
            </form>
        );
    };

    getElementBoolExpression = () => {
        return <this.ElementBoolExpression></this.ElementBoolExpression>;
    };

    updateBoolExpression = (event: any, newExpression: string) => {
        event?.preventDefault();
        const rule = this.getRule();
        if (newExpression !== rule.getBoolExpression()) {
            rule.setBoolExpression(newExpression);
            if (g_widgets1 !== undefined) {
                const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
                history.registerAction();
            }
        }

    }

    _ElementInputLabel = ({ value, setValue, children, readableText, updater }: any) => {
        return (
            <div
                onClick={() => {
                    this.getSidebarLargeInput().createElement(value, setValue, readableText, updater);
                }}
            >
                {children}
            </div>
        )
    }

    _formStyle: Record<string, any> = {
        display: "inline-flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 2,
        marginBottom: 2,
    };

    getFormStyle = () => {
        return this._formStyle;
    }


    _inputStyle: Record<string, any> = {
        width: "70%",
        fontFamily: GlobalVariables.defaultFontFamily,
        fontSize: GlobalVariables.defaultFontSize,
    };
    getInputStyle = () => {
        return this._inputStyle;
    }
}
