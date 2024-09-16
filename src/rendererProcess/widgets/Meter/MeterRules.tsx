import { Meter, type_Meter_tdl } from "./Meter";
import { BaseWidgetRules } from "../BaseWidget/BaseWidgetRules";
import { MeterRule } from "./MeterRule";


export class MeterRules extends BaseWidgetRules {
	constructor(mainWidget: Meter, widgetTdl: type_Meter_tdl) {
		super(mainWidget, widgetTdl);
        this.initRules();
	}

    
	initRules = () => {
		for (let ii = 0; ii < this.getRulesTdl().length; ii++) {
            const newRule = new MeterRule(ii, this);
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
		const newRule = new MeterRule(this.getRulesTdl().length - 1, this);
        newRule.renewRuleComponent(true);
		this.getRules().push(newRule);
	};
}
