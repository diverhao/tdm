import { LEDMultiState, type_LEDMultiState_tdl } from "./LEDMultiState";
import { BaseWidgetRules } from "../BaseWidget/BaseWidgetRules";
import { LEDMultiStateRule } from "./LEDMultiStateRule";


export class LEDMultiStateRules extends BaseWidgetRules {
	constructor(mainWidget: LEDMultiState, widgetTdl: type_LEDMultiState_tdl) {
		super(mainWidget, widgetTdl);
        this.initRules();
	}

    
	initRules = () => {
		for (let ii = 0; ii < this.getRulesTdl().length; ii++) {
            const newRule = new LEDMultiStateRule(ii, this);
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
		const newRule = new LEDMultiStateRule(this.getRulesTdl().length - 1, this);
        newRule.renewRuleComponent(true);
		this.getRules().push(newRule);
	};
}
