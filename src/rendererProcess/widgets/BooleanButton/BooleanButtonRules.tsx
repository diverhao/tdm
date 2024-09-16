import { BooleanButton, type_BooleanButton_tdl } from "./BooleanButton";
import { BaseWidgetRules } from "../BaseWidget/BaseWidgetRules";
import { BooleanButtonRule } from "./BooleanButtonRule";


export class BooleanButtonRules extends BaseWidgetRules {
	constructor(booleanButton: BooleanButton, widgetTdl: type_BooleanButton_tdl) {
		super(booleanButton, widgetTdl);
        this.initRules();
	}

    
	initRules = () => {
		for (let ii = 0; ii < this.getRulesTdl().length; ii++) {
            const newRule = new BooleanButtonRule(ii, this);
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
		const newRule = new BooleanButtonRule(this.getRulesTdl().length - 1, this);
        newRule.renewRuleComponent(true);
		this.getRules().push(newRule);
	};
}
