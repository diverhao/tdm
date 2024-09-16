import {CheckBox, type_CheckBox_tdl} from "./CheckBox"
import { BaseWidgetRules } from "../BaseWidget/BaseWidgetRules";
import { CheckBoxRule } from "./CheckBoxRule";


export class CheckBoxRules extends BaseWidgetRules {
	constructor(booleanButton: CheckBox, widgetTdl: type_CheckBox_tdl) {
		super(booleanButton, widgetTdl);
        this.initRules();
	}

    
	initRules = () => {
		for (let ii = 0; ii < this.getRulesTdl().length; ii++) {
            const newRule = new CheckBoxRule(ii, this);
			this.getRules().push(newRule);
		}
	};

    // (1) create a new tdl
    // (2) create the new rule based on this new tdl, use the widget's value
	addRule = () => {
        // (1)
		const newRuleTdl = this.generateNewRuleTdl();
		this.getRulesTdl().push(newRuleTdl);
        // (2)
		const newRule = new CheckBoxRule(this.getRulesTdl().length - 1, this);
        newRule.renewRuleComponent(true);
		this.getRules().push(newRule);
	};
}
