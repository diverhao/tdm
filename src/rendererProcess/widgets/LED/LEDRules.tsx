import { LED, type_LED_tdl } from "./LED";
import { BaseWidgetRules } from "../BaseWidget/BaseWidgetRules";
import { LEDRule } from "./LEDRule";


export class LEDRules extends BaseWidgetRules {
	constructor(mainWidget: LED, widgetTdl: type_LED_tdl) {
		super(mainWidget, widgetTdl);
        this.initRules();
	}

    
	initRules = () => {
		for (let ii = 0; ii < this.getRulesTdl().length; ii++) {
            const newRule = new LEDRule(ii, this);
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
		const newRule = new LEDRule(this.getRulesTdl().length - 1, this);
        newRule.renewRuleComponent(true);
		this.getRules().push(newRule);
	};
}
