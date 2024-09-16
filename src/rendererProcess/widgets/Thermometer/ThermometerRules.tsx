import { Thermometer, type_Thermometer_tdl } from "./Thermometer";
import { BaseWidgetRules } from "../BaseWidget/BaseWidgetRules";
import { ThermometerRule } from "./ThermometerRule";


export class ThermometerRules extends BaseWidgetRules {
	constructor(mainWidget: Thermometer, widgetTdl: type_Thermometer_tdl) {
		super(mainWidget, widgetTdl);
        this.initRules();
	}

    
	initRules = () => {
		for (let ii = 0; ii < this.getRulesTdl().length; ii++) {
            const newRule = new ThermometerRule(ii, this);
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
		const newRule = new ThermometerRule(this.getRulesTdl().length - 1, this);
        newRule.renewRuleComponent(true);
		this.getRules().push(newRule);
	};
}
