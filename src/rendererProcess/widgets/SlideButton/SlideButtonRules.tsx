import {SlideButton, type_SlideButton_tdl} from "./SlideButton"
import { BaseWidgetRules } from "../BaseWidget/BaseWidgetRules";
import { SlideButtonRule } from "./SlideButtonRule";


export class SlideButtonRules extends BaseWidgetRules {
	constructor(booleanButton: SlideButton, widgetTdl: type_SlideButton_tdl) {
		super(booleanButton, widgetTdl);
        this.initRules();
	}

    
	initRules = () => {
		for (let ii = 0; ii < this.getRulesTdl().length; ii++) {
            const newRule = new SlideButtonRule(ii, this);
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
		const newRule = new SlideButtonRule(this.getRulesTdl().length - 1, this);
        newRule.renewRuleComponent(true);
		this.getRules().push(newRule);
	};
}
