import { Spinner, type_Spinner_tdl } from "./Spinner";
import { BaseWidgetRules } from "../BaseWidget/BaseWidgetRules";
import {SpinnerRule } from "./SpinnerRule";


export class SpinnerRules extends BaseWidgetRules {
	constructor(mainWidget: Spinner, widgetTdl: type_Spinner_tdl) {
		super(mainWidget, widgetTdl);
        this.initRules();
	}

    
	initRules = () => {
		for (let ii = 0; ii < this.getRulesTdl().length; ii++) {
            const newRule = new SpinnerRule(ii, this);
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
		const newRule = new SpinnerRule(this.getRulesTdl().length - 1, this);
        newRule.renewRuleComponent(true);
		this.getRules().push(newRule);
	};
}
