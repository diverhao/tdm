import { RadioButtonRules } from "./RadioButtonRules";
import { BaseWidgetRule } from "../BaseWidget/BaseWidgetRule";

export class RadioButtonRule extends BaseWidgetRule {
	constructor(index: number, rules: RadioButtonRules) {
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
			"Box Width": "RuleSlideButtonBoxWidth",
			"Wrap Word": "RuleWrapWord",
			// // "Show Unit": "RuleShowUnit",
			"Use Channel Items": "RuleChoiceButtonUseChannelItems",
            // // "Selected BG Color": "RuleChoiceButtonSelectedBackgroundColor",
            // // "Unselected BG Color": "RuleChoiceButtonUnselectedBackgroundColor",
			// // // "Use Pictures": "RuleBooleanButtonUsePictures",
			// // // "Show LED": "RuleBooleanButtonShowLED",
			// // // Bit: "RuleLEDBit",
			"Alarm Border": "RuleAlarmBorder",
            // // "Button BG Color": "RuleProgressBarBackgroundColor",
			// // // "Fallback Color": "RuleLEDFallbackColor",
			"Invisible in Operation": "RuleInvisibleInOperation",
		};

		this.addRuleComponentTypes(Object.keys(this.getRuleComponentTypesMap()));
		this.renewRuleComponent(false);
	}
}
