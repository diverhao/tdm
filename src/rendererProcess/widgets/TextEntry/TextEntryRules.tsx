import { TextEntry, type_TextEntry_tdl } from "./TextEntry";
import { BaseWidgetRules } from "../BaseWidget/BaseWidgetRules";
import { TextEntryRule } from "./TextEntryRule";


export class TextEntryRules extends BaseWidgetRules {
	constructor(textUpdate: TextEntry, widgetTdl: type_TextEntry_tdl) {
		super(textUpdate, widgetTdl);
        this.initRules();
	}

    
	initRules = () => {
		for (let ii = 0; ii < this.getRulesTdl().length; ii++) {
            const newRule = new TextEntryRule(ii, this);
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
		const newRule = new TextEntryRule(this.getRulesTdl().length - 1, this);
        newRule.renewRuleComponent(true);
		this.getRules().push(newRule);
	};
}
