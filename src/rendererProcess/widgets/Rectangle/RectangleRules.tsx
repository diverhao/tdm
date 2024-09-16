import {Rectangle, type_Rectangle_tdl} from "./Rectangle"
import { BaseWidgetRules } from "../BaseWidget/BaseWidgetRules";
import { RectangleRule } from "./RectangleRule";

export class RectangleRules extends BaseWidgetRules {
	constructor(mainWidget: Rectangle, widgetTdl: type_Rectangle_tdl) {
		super(mainWidget, widgetTdl);
        this.initRules();
	}

    
	initRules = () => {
		for (let ii = 0; ii < this.getRulesTdl().length; ii++) {
            const newRule = new RectangleRule(ii, this);
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
		const newRule = new RectangleRule(this.getRulesTdl().length - 1, this);
        newRule.renewRuleComponent(true);
		this.getRules().push(newRule);
	};
}
