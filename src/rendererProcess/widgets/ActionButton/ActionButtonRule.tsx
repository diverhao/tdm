import { ActionButtonRules } from "./ActionButtonRules";
import { BaseWidgetRule } from "../BaseWidget/BaseWidgetRule";

export class ActionButtonRule extends BaseWidgetRule {
	constructor(index: number, rules: ActionButtonRules) {
		super(index, rules);

        // widget-specific rule type name vs global rule type name
		this._ruleComponentTypesMap = {
			X: "RuleX",
			Y: "RuleY",
			Width: "RuleWidth",
			Height: "RuleHeight",
			Angle: "RuleAngle",
			"Border Color": "RuleBorderColor",
			"Border Width": "RuleBorderWidth",
            "Background Color": "RuleBackgroundColor",
            "Horizontal Align": "RuleXAlign",
            "Text Color": "RuleColor",
            "Font Size": "RuleFontSize",
            "Text": "RuleText",
            "Wrap Word": "RuleWrapWord",
            "Alarm Border": "RuleAlarmBorder",
			"Invisible in Operation": "RuleInvisibleInOperation",
		};

		this.addRuleComponentTypes(Object.keys(this.getRuleComponentTypesMap()));
		this.renewRuleComponent(false);
	}
}
