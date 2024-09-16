import { EmbeddedDisplayRules } from "./EmbeddedDisplayRules";
import { BaseWidgetRule } from "../BaseWidget/BaseWidgetRule";

export class EmbeddedDisplayRule extends BaseWidgetRule {
	constructor(index: number, rules: EmbeddedDisplayRules) {
		super(index, rules);
        

        this._ruleComponentTypesMap = {
			X: "RuleX",
			Y: "RuleY",
			Width: "RuleWidth",
			Height: "RuleHeight",
			Angle: "RuleAngle",
            "Select Tab Index": "RuleEmbeddedDisplaySelectTabIndex"

			// "Background Color": "RuleBackgroundColor",
			// "Text Color": "RuleColor",
			// "Font Size": "RuleFontSize",
			// "Border Width": "RuleBorderWidth",
			// "Border Color": "RuleBorderColor",
			// "Horizontal Align": "RuleXAlign",
			// "Vertical Align": "RuleYAlign",
			// // "Box Width": "RuleSlideButtonBoxWidth",
			// "Wrap Word": "RuleWrapWord",
			// "Show Unit": "RuleShowUnit",
            // "Highlight BG Color": "RuleHighlightBackgroundColor",
			// // "Use Channel Items": "RuleChoiceButtonUseChannelItems",
			// // // // "Selected BG Color": "RuleChoiceButtonSelectedBackgroundColor",
			// // // // "Unselected BG Color": "RuleChoiceButtonUnselectedBackgroundColor",
			// // // // // "Use Pictures": "RuleBooleanButtonUsePictures",
			// // // // // "Show LED": "RuleBooleanButtonShowLED",
			// // // // // Bit: "RuleLEDBit",
			// "Alarm Border": "RuleAlarmBorder",
			// // // // "Button BG Color": "RuleProgressBarBackgroundColor",
			// // // // // "Fallback Color": "RuleLEDFallbackColor",
			// "Invisible in Operation": "RuleInvisibleInOperation",
		};

        this.addRuleComponentTypes(Object.keys(this.getRuleComponentTypesMap()));

		this.renewRuleComponent(false);
	}
}
