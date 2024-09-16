import { Arc, type_Arc_tdl } from "./Arc";
import { BaseWidgetRules } from "../BaseWidget/BaseWidgetRules";
import { ArcRule } from "./ArcRule";

export class ArcRules extends BaseWidgetRules {
	constructor(mainWidget: Arc, widgetTdl: type_Arc_tdl) {
		super(mainWidget, widgetTdl);
        this.initRules();
	}

    
	initRules = () => {
		for (let ii = 0; ii < this.getRulesTdl().length; ii++) {
            const newRule = new ArcRule(ii, this);
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
		const newRule = new ArcRule(this.getRulesTdl().length - 1, this);
        newRule.renewRuleComponent(true);
		this.getRules().push(newRule);
	};
}
