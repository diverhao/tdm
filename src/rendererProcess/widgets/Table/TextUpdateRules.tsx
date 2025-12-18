import { TextUpdate, type_TextUpdate_tdl } from "./TextUpdate";
import { BaseWidgetRules } from "../BaseWidget/BaseWidgetRules";
import { TextUpdateRule } from "./TextUpdateRule";


export class TextUpdateRules extends BaseWidgetRules {
	constructor(textUpdate: TextUpdate, widgetTdl: type_TextUpdate_tdl) {
		super(textUpdate, widgetTdl);
        this.initRules();
	}

    
	initRules = () => {
		for (let ii = 0; ii < this.getRulesTdl().length; ii++) {
            const newRule = new TextUpdateRule(ii, this);
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
		const newRule = new TextUpdateRule(this.getRulesTdl().length - 1, this);
        newRule.renewRuleComponent(true);
		this.getRules().push(newRule);
	};
}
