import { ThumbWheelRules } from "./ThumbWheelRules";
import { BaseWidgetRule } from "../BaseWidget/BaseWidgetRule";

export class ThumbWheelRule extends BaseWidgetRule {
	constructor(index: number, rules: ThumbWheelRules) {
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
			// // // "Box Width": "RuleSlideButtonBoxWidth",
			"Wrap Word": "RuleWrapWord",
			"Show Unit": "RuleShowUnit",
			// "Min Channel Value": "RuleMinPvValue",
			// "Max Channel Value": "RuleMaxPvValue",
			// "Use Channel Limits": "RuleUsePvLimits",
			// "Slider Width": "RuleSliderBlockWidth",
			// Direction: "RuleDirection",
			// "Show Channel Value": "RuleShowPvValue",
			"Step Size": "RuleStepSize",
			// // "Highlight BG Color": "RuleHighlightBackgroundColor",
			// // // "Use Channel Items": "RuleChoiceButtonUseChannelItems",
			// // // // // "Selected BG Color": "RuleChoiceButtonSelectedBackgroundColor",
			// // // // // "Unselected BG Color": "RuleChoiceButtonUnselectedBackgroundColor",
			// // // // // // "Use Pictures": "RuleBooleanButtonUsePictures",
			// // // // // // "Show LED": "RuleBooleanButtonShowLED",
			// // // // // // Bit: "RuleLEDBit",
			"Alarm Border": "RuleAlarmBorder",
			// // // // // "Button BG Color": "RuleProgressBarBackgroundColor",
			// // // // // // "Fallback Color": "RuleLEDFallbackColor",
			"Invisible in Operation": "RuleInvisibleInOperation",
		};
		this.addRuleComponentTypes(Object.keys(this.getRuleComponentTypesMap()));

		this.renewRuleComponent(false);
	}
}
