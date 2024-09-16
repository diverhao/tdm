import { CheckBoxRules } from "./CheckBoxRules";
import { BaseWidgetRule } from "../BaseWidget/BaseWidgetRule";

export class CheckBoxRule extends BaseWidgetRule {
	constructor(index: number, rules: CheckBoxRules) {
		super(index, rules);

        // widget-specific rule type name vs global rule type name
		this._ruleComponentTypesMap = {
			X: "RuleX",
			Y: "RuleY",
			Width: "RuleWidth",
			Height: "RuleHeight",
			Angle: "RuleAngle",
			"Background Color": "RuleBackgroundColor",
            "Text Color": "RuleColor",
            "Font Size": "RuleFontSize",
            "Border Width": "RuleBorderWidth",
            "Border Color": "RuleBorderColor",
            "Horizontal Align": "RuleXAlign",
            "Vertical Align": "RuleYAlign",
            "Wrap Word": "RuleWrapWord",
            "Show Unit": "RuleShowUnit",
            "Label": "RuleText",
            "Box Size": "RuleCheckBoxSize",
            "Bit": "RuleLEDBit",
            "Alarm Border": "RuleAlarmBorder",
			"Invisible in Operation": "RuleInvisibleInOperation",
		};

		this.addRuleComponentTypes(Object.keys(this.getRuleComponentTypesMap()));
		this.renewRuleComponent(false);
	}
}
