import { ScaledSliderRules } from "./ScaledSliderRules";
import { BaseWidgetRule } from "../BaseWidget/BaseWidgetRule";

export class ScaledSliderRule extends BaseWidgetRule {
	constructor(index: number, rules: ScaledSliderRules) {
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
			// "Horizontal Align": "RuleXAlign",
			// "Vertical Align": "RuleYAlign",
			// // "Box Width": "RuleSlideButtonBoxWidth",
			// "Wrap Word": "RuleWrapWord",
			"Show Unit": "RuleShowUnit",
            "Min Channel Value": "RuleMinPvValue",
            "Max Channel Value": "RuleMaxPvValue",
            "Use Channel Limits": "RuleUsePvLimits",
            // "Slider Width": "RuleSliderBlockWidth",
            // "Direction": "RuleDirection",
            "Show Channel Value": "RuleShowPvValue",
            "Step Size": "RuleStepSize",
            "Outline Color": "RuleOutlineColor",
            "Outline Width": "RuleOutlineWidth",
            "Outline Style": "RuleOutlineStyle",
            // "Highlight BG Color": "RuleHighlightBackgroundColor",
			// // "Use Channel Items": "RuleChoiceButtonUseChannelItems",
			// // // // "Selected BG Color": "RuleChoiceButtonSelectedBackgroundColor",
			// // // // "Unselected BG Color": "RuleChoiceButtonUnselectedBackgroundColor",
			// // // // // "Use Pictures": "RuleBooleanButtonUsePictures",
			// // // // // "Show LED": "RuleBooleanButtonShowLED",
			// // // // // Bit: "RuleLEDBit",
			"Alarm Border": "RuleAlarmBorder",
			// // // // "Button BG Color": "RuleProgressBarBackgroundColor",
			// // // // // "Fallback Color": "RuleLEDFallbackColor",
			"Invisible in Operation": "RuleInvisibleInOperation",
		};
		this.addRuleComponentTypes(Object.keys(this.getRuleComponentTypesMap()));

		this.renewRuleComponent(false);
	}
}
