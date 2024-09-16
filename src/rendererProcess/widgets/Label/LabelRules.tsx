import { Label, type_Label_tdl } from "./Label";
import { BaseWidgetRules } from "../BaseWidget/BaseWidgetRules";
import { LabelRule } from "./LabelRule";


export class LabelRules extends BaseWidgetRules {
	constructor(textUpdate: Label, widgetTdl: type_Label_tdl) {
		super(textUpdate, widgetTdl);
        this.initRules();
	}

    
	initRules = () => {
		for (let ii = 0; ii < this.getRulesTdl().length; ii++) {
            const newRule = new LabelRule(ii, this);
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
		const newRule = new LabelRule(this.getRulesTdl().length - 1, this);
        newRule.renewRuleComponent(true);
		this.getRules().push(newRule);
	};
}
