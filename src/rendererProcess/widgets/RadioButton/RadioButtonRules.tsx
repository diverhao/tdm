import { RadioButton, type_RadioButton_tdl } from "./RadioButton";
import { BaseWidgetRules } from "../BaseWidget/BaseWidgetRules";
import { RadioButtonRule } from "./RadioButtonRule";


export class RadioButtonRules extends BaseWidgetRules {
	constructor(booleanButton: RadioButton, widgetTdl: type_RadioButton_tdl) {
		super(booleanButton, widgetTdl);
        this.initRules();
	}

    
	initRules = () => {
		for (let ii = 0; ii < this.getRulesTdl().length; ii++) {
            const newRule = new RadioButtonRule(ii, this);
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
		const newRule = new RadioButtonRule(this.getRulesTdl().length - 1, this);
        newRule.renewRuleComponent(true);
		this.getRules().push(newRule);
	};
}
