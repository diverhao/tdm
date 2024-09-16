
import { EmbeddedDisplay, type_EmbeddedDisplay_tdl } from "./EmbeddedDisplay";
import { BaseWidgetRules } from "../BaseWidget/BaseWidgetRules";
import { EmbeddedDisplayRule } from "./EmbeddedDisplayRule";


export class EmbeddedDisplayRules extends BaseWidgetRules {
	constructor(embeddedDispaly: EmbeddedDisplay, widgetTdl: type_EmbeddedDisplay_tdl) {
		super(embeddedDispaly, widgetTdl);
        this.initRules();
	}

    
	initRules = () => {
		for (let ii = 0; ii < this.getRulesTdl().length; ii++) {
            const newRule = new EmbeddedDisplayRule(ii, this);
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
		const newRule = new EmbeddedDisplayRule(this.getRulesTdl().length - 1, this);
        newRule.renewRuleComponent(true);
		this.getRules().push(newRule);
	};
}
