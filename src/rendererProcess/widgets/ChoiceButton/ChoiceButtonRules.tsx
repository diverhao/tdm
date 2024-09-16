import { ChoiceButton, type_ChoiceButton_tdl } from "./ChoiceButton";
import { BaseWidgetRules } from "../BaseWidget/BaseWidgetRules";
import { ChoiceButtonRule } from "./ChoiceButtonRule";


export class ChoiceButtonRules extends BaseWidgetRules {
	constructor(booleanButton: ChoiceButton, widgetTdl: type_ChoiceButton_tdl) {
		super(booleanButton, widgetTdl);
        this.initRules();
	}

    
	initRules = () => {
		for (let ii = 0; ii < this.getRulesTdl().length; ii++) {
            const newRule = new ChoiceButtonRule(ii, this);
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
		const newRule = new ChoiceButtonRule(this.getRulesTdl().length - 1, this);
        newRule.renewRuleComponent(true);
		this.getRules().push(newRule);
	};
}
