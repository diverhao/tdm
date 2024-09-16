import { ActionButton, type_ActionButton_tdl } from "./ActionButton";
import { BaseWidgetRules } from "../BaseWidget/BaseWidgetRules";
import { ActionButtonRule } from "./ActionButtonRule";

export class ActionButtonRules extends BaseWidgetRules {
	constructor(mainWidget: ActionButton, widgetTdl: type_ActionButton_tdl) {
		super(mainWidget, widgetTdl);
        this.initRules();
	}

    
	initRules = () => {
		for (let ii = 0; ii < this.getRulesTdl().length; ii++) {
            const newRule = new ActionButtonRule(ii, this);
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
		const newRule = new ActionButtonRule(this.getRulesTdl().length - 1, this);
        newRule.renewRuleComponent(true);
		this.getRules().push(newRule);
	};
}
