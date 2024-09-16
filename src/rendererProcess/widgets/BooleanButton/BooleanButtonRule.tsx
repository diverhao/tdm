import { BooleanButtonRules } from "./BooleanButtonRules";
import { BaseWidgetRule } from "../BaseWidget/BaseWidgetRule";

export class BooleanButtonRule extends BaseWidgetRule {
	constructor(index: number, rules: BooleanButtonRules) {
		super(index, rules);


		// widget-specific rule type name vs global rule type name
		this._ruleComponentTypesMap = {
			X: "RuleX",
			Y: "RuleY",
			Width: "RuleWidth",
			Height: "RuleHeight",
			Angle: "RuleAngle",
			// "Border Color": "RuleBorderColor",
			// "Border Width": "RuleBorderWidth",
			"Background Color": "RuleBackgroundColor",
            "Text Color": "RuleColor",
            "Font Size": "RuleFontSize",
            "Border Width": "RuleBorderWidth",
            "Border Color": "RuleBorderColor",
            "Horizontal Align": "RuleXAlign",
            "Vertical Align": "RuleYAlign",
            "Box Width": "RuleSlideButtonBoxWidth",
            "Wrap Word": "RuleWrapWord",
            "Show Unit": "RuleShowUnit",
            "Use Channel Items": "RuleChoiceButtonUseChannelItems",
            "Use Pictures": "RuleBooleanButtonUsePictures",
            "Show LED": "RuleBooleanButtonShowLED",
            "Bit": "RuleLEDBit",
            "Alarm Border": "RuleAlarmBorder",
            "Fallback Color": "RuleLEDFallbackColor",
            "On Color": "RuleBooleanButtonOnColor",
            "Off Color": "RuleBooleanButtonOffColor",
            "Outline Color": "RuleOutlineColor",
            "Outline Width": "RuleOutlineWidth",
            "Outline Style": "RuleOutlineStyle",
			// "Line Color": "RuleColor",
			// "Line Width": "RuleLineWidth",
			// "Line Style": "RuleLineStyle",
			// "Fill Color": "RuleFillColor",
			// Fill: "RulePolylineFill",
			// "Show Arrow Head": "RuleShowArrowHead",
			// "Show Arrow Tail": "RuleShowArrowTail",
			// "Arrow Length": "RulePolylineArrowLength",
			// "Arrow Width": "RulePolylineArrowWidth",
			// "Angle Start": "RuleArcAngleStart",
			// "Angle Range": "RuleArcAngleRange",
			// "Show Radius": "RuleArcShowRadius",
			"Invisible in Operation": "RuleInvisibleInOperation",
		};

		this.addRuleComponentTypes(Object.keys(this.getRuleComponentTypesMap()));
		this.renewRuleComponent(false);
	}
}
