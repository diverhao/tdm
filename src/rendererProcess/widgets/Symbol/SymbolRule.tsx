import { SymbolRules } from "./SymbolRules";
import { BaseWidgetRule } from "../BaseWidget/BaseWidgetRule";

export class SymbolRule extends BaseWidgetRule {
	constructor(index: number, rules: SymbolRules) {
		super(index, rules);
        

		this._ruleComponentTypesMap = {
			X: "RuleX",
			Y: "RuleY",
			Width: "RuleWidth",
			Height: "RuleHeight",
			Angle: "RuleAngle",
			"Background Color": "RuleBackgroundColor",
			// // "Line Width": "RuleLineWidth",
			// // "Line Color": "RuleLineColor",
			// // "Line Style": "RuleLineStyle",
			// // "Fill": "RulePolylineFill",
			// // "Fill Color": "RuleFillColor",
			// // "Corner Width": "RuleRectangleCornerWidth",
			// // "Corner Height": "RuleRectangleCornerHeight",
			"Text Color": "RuleColor",
			"Font Size": "RuleFontSize",
			"Border Width": "RuleBorderWidth",
			"Border Color": "RuleBorderColor",
			"Picture Opacity": "RulePictureOpacity",
			"Pic Stretch to Fit": "RulePictureStretchToFit",
			"Default File Name": "RuleMediaDefaultFileName",
			// "Horizontal Align": "RuleXAlign",
			// "Vertical Align": "RuleYAlign",
			// // // // // // "Box Width": "RuleSlideButtonBoxWidth",
			"Wrap Word": "RuleWrapWord",
			// // // "Text": "RuleText",
			"Show Unit": "RuleShowUnit",
            "Show Channel Value": "RuleShowPvValue",
			// // // // // "Highlight BG Color": "RuleHighlightBackgroundColor",
			// // // // // // "Use Channel Items": "RuleChoiceButtonUseChannelItems",
			// // // // // // // // "Selected BG Color": "RuleChoiceButtonSelectedBackgroundColor",
			// // // // // // // // "Unselected BG Color": "RuleChoiceButtonUnselectedBackgroundColor",
			// // // // // // // // // "Use Pictures": "RuleBooleanButtonUsePictures",
			// // // // // // // // // "Show LED": "RuleBooleanButtonShowLED",
			// // // // // // // // // Bit: "RuleLEDBit",
			"Alarm Border": "RuleAlarmBorder",
			// // // // // // // // "Button BG Color": "RuleProgressBarBackgroundColor",
			// // // // // // // // // "Fallback Color": "RuleLEDFallbackColor",
			"Invisible in Operation": "RuleInvisibleInOperation",
		};

		this.addRuleComponentTypes(Object.keys(this.getRuleComponentTypesMap()));

		this.renewRuleComponent(false);
	}
}
