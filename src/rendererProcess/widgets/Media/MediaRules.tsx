import {Media, type_Media_tdl} from "./Media"
import { BaseWidgetRules } from "../BaseWidget/BaseWidgetRules";
import { MediaRule } from "./MediaRule";

export class MediaRules extends BaseWidgetRules {
	constructor(mainWidget: Media, widgetTdl: type_Media_tdl) {
		super(mainWidget, widgetTdl);
        this.initRules();
	}

    
	initRules = () => {
		for (let ii = 0; ii < this.getRulesTdl().length; ii++) {
            const newRule = new MediaRule(ii, this);
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
		const newRule = new MediaRule(this.getRulesTdl().length - 1, this);
        newRule.renewRuleComponent(true);
		this.getRules().push(newRule);
	};
}
