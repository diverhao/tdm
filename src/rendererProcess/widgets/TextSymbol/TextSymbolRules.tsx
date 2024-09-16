import {TextSymbol, type_TextSymbol_tdl} from "./TextSymbol"
import { BaseWidgetRules } from "../BaseWidget/BaseWidgetRules";
import { TextSymbolRule } from "./TextSymbolRule";

export class TextSymbolRules extends BaseWidgetRules {
	constructor(mainWidget: TextSymbol, widgetTdl: type_TextSymbol_tdl) {
		super(mainWidget, widgetTdl);
        this.initRules();
	}

    
	initRules = () => {
		for (let ii = 0; ii < this.getRulesTdl().length; ii++) {
            const newRule = new TextSymbolRule(ii, this);
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
		const newRule = new TextSymbolRule(this.getRulesTdl().length - 1, this);
        newRule.renewRuleComponent(true);
		this.getRules().push(newRule);
	};
}
