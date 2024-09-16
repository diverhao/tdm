import { ByteMonitor, type_ByteMonitor_tdl } from "./ByteMonitor";
import { BaseWidgetRules } from "../BaseWidget/BaseWidgetRules";
import { ByteMonitorRule } from "./ByteMonitorRule";


export class ByteMonitorRules extends BaseWidgetRules {
	constructor(mainWidget: ByteMonitor, widgetTdl: type_ByteMonitor_tdl) {
		super(mainWidget, widgetTdl);
        this.initRules();
	}

    
	initRules = () => {
		for (let ii = 0; ii < this.getRulesTdl().length; ii++) {
            const newRule = new ByteMonitorRule(ii, this);
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
		const newRule = new ByteMonitorRule(this.getRulesTdl().length - 1, this);
        newRule.renewRuleComponent(true);
		this.getRules().push(newRule);
	};
}
