import {Symbol, type_Symbol_tdl} from "./Symbol"
import { BaseWidgetRules } from "../BaseWidget/BaseWidgetRules";
import { SymbolRule } from "./SymbolRule";

export class SymbolRules extends BaseWidgetRules {
	constructor(mainWidget: Symbol, widgetTdl: type_Symbol_tdl) {
		super(mainWidget, widgetTdl);
        this.initRules();
	}

    
	initRules = () => {
		for (let ii = 0; ii < this.getRulesTdl().length; ii++) {
            const newRule = new SymbolRule(ii, this);
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
		const newRule = new SymbolRule(this.getRulesTdl().length - 1, this);
        newRule.renewRuleComponent(true);
		this.getRules().push(newRule);
	};
}