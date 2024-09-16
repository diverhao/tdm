import { ScaledSlider, type_ScaledSlider_tdl } from "./ScaledSlider";
import { BaseWidgetRules } from "../BaseWidget/BaseWidgetRules";
import { ScaledSliderRule } from "./ScaledSliderRule";


export class ScaledSliderRules extends BaseWidgetRules {
	constructor(textUpdate: ScaledSlider, widgetTdl: type_ScaledSlider_tdl) {
		super(textUpdate, widgetTdl);
        this.initRules();
	}

    
	initRules = () => {
		for (let ii = 0; ii < this.getRulesTdl().length; ii++) {
            const newRule = new ScaledSliderRule(ii, this);
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
		const newRule = new ScaledSliderRule(this.getRulesTdl().length - 1, this);
        newRule.renewRuleComponent(true);
		this.getRules().push(newRule);
	};
}
