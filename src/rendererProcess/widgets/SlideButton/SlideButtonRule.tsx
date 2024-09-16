import { SlideButtonRules } from "./SlideButtonRules";
import { BaseWidgetRule } from "../BaseWidget/BaseWidgetRule";

export class SlideButtonRule extends BaseWidgetRule {
	constructor(index: number, rules: SlideButtonRules) {
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
			//! "Horizontal Align": "RuleXAlign",
			//! "Vertical Align": "RuleYAlign",
			//! "Wrap Word": "RuleWrapWord",
			"Show Unit": "RuleShowUnit",
			"Label": "RuleText",
            "Use Channel Items": "RuleChoiceButtonUseChannelItems",
            "Selected BG Color": "RuleChoiceButtonSelectedBackgroundColor",
            "Unselected BG Color": "RuleChoiceButtonUnselectedBackgroundColor",
            "Box Width": "RuleSlideButtonBoxWidth",
            "Box Ratio": "RuleSlideButtonBoxRatio",
			"Bit": "RuleLEDBit",
			"Alarm Border": "RuleAlarmBorder",
            "Fallback Color": "RuleLEDFallbackColor",
			"Invisible in Operation": "RuleInvisibleInOperation",
		};

		this.addRuleComponentTypes(Object.keys(this.getRuleComponentTypesMap()));
		this.renewRuleComponent(false);
	}
}
