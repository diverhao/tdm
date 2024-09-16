import { BinaryImage, type_BinaryImage_tdl } from "./BinaryImage";
import { BaseWidgetRules } from "../BaseWidget/BaseWidgetRules";
import { BinaryImageRule } from "./BinaryImageRule";


export class BinaryImageRules extends BaseWidgetRules {
	constructor(binaryImage: BinaryImage, widgetTdl: type_BinaryImage_tdl) {
		super(binaryImage, widgetTdl);
        this.initRules();
	}

    
	initRules = () => {
		for (let ii = 0; ii < this.getRulesTdl().length; ii++) {
            const newRule = new BinaryImageRule(ii, this);
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
		const newRule = new BinaryImageRule(this.getRulesTdl().length - 1, this);
        newRule.renewRuleComponent(true);
		this.getRules().push(newRule);
	};
}
