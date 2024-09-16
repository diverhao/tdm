import { Tank, type_Tank_tdl } from "./Tank";
import { BaseWidgetRules } from "../BaseWidget/BaseWidgetRules";
import { TankRule } from "./TankRule";


export class TankRules extends BaseWidgetRules {
	constructor(mainWidget: Tank, widgetTdl: type_Tank_tdl) {
		super(mainWidget, widgetTdl);
        this.initRules();
	}

    
	initRules = () => {
		for (let ii = 0; ii < this.getRulesTdl().length; ii++) {
            const newRule = new TankRule(ii, this);
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
		const newRule = new TankRule(this.getRulesTdl().length - 1, this);
        newRule.renewRuleComponent(true);
		this.getRules().push(newRule);
	};
}
