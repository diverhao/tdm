import { ComboBox } from "./ComboBox";
import { BaseWidgetRules } from "../BaseWidget/BaseWidgetRules";
import { ComboBoxRule } from "./ComboBoxRule";
import { type_ComboBox_tdl } from "../../../common/types/type_widget_tdl";


export class ComboBoxRules extends BaseWidgetRules {
	constructor(booleanButton: ComboBox, widgetTdl: type_ComboBox_tdl) {
		super(booleanButton, widgetTdl);
        this.initRules();
	}

    
	initRules = () => {
		for (let ii = 0; ii < this.getRulesTdl().length; ii++) {
            const newRule = new ComboBoxRule(ii, this);
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
		const newRule = new ComboBoxRule(this.getRulesTdl().length - 1, this);
        newRule.renewRuleComponent(true);
		this.getRules().push(newRule);
	};
}
