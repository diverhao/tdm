import { Polyline, type_Polyline_tdl } from "./Polyline";
import { BaseWidgetRules } from "../BaseWidget/BaseWidgetRules";
import { PolylineRule } from "./PolylineRule";

export class PolylineRules extends BaseWidgetRules {
	constructor(mainWidget: Polyline, widgetTdl: type_Polyline_tdl) {
		super(mainWidget, widgetTdl);
        this.initRules();
	}

    
	initRules = () => {
		for (let ii = 0; ii < this.getRulesTdl().length; ii++) {
            const newRule = new PolylineRule(ii, this);
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
		const newRule = new PolylineRule(this.getRulesTdl().length - 1, this);
        newRule.renewRuleComponent(true);
		this.getRules().push(newRule);
	};
}
