import { ByteMonitorRules } from "./ByteMonitorRules";
import { BaseWidgetRule } from "../BaseWidget/BaseWidgetRule";

export class ByteMonitorRule extends BaseWidgetRule {
	constructor(index: number, rules: ByteMonitorRules) {
		super(index, rules);

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
			// // "Horizontal Align": "RuleXAlign",
			// // "Vertical Align": "RuleYAlign",
			// // // // // // // "Box Width": "RuleSlideButtonBoxWidth",
			"Wrap Word": "RuleWrapWord",
			"Show Unit": "RuleShowUnit",
			// // "Use Channel Limit": "RuleUsePvLimits",
			// // "Min Channel Value": "RuleMinPvValue",
			// // "Max Channel Value": "RuleMaxPvValue",
			// // "Use Log Scale": "RuleUseLogScale",
			// // "Show Channel Value": "RuleShowPvValue",
			// // // // "Angle Range": "RuleMeterAngleRange",
			// // // // "Dial Color": "RuleMeterDialColor",
			// // "Dial Height [%]": "RuleMeterDialPercentage",
			// // // // "Dial Thickness": "RuleMeterDialThickness",
			// // // // "Pointer Color": "RuleMeterPointerColor",
			// // // // "Pointer Length [%]": "RuleMeterPointerLengthPercentage",
			// // // // "Pointer Thickness": "RuleMeterPointerThickness",
			// // "Label Position [%]": "RuleMeterLabelPositionPercentage",
			// // "Dial Font Color": "RuleMeterDialFontColor",
			// // "Dial Font Size": "RuleMeterDialFontSize",
			Direction: "RuleDirection",
			// // "Mercury Color": "RuleFillColor",
			// // "Tube Color": "RuleProgressBarBackgroundColor",
			// // ShowLabels: "RuleTankShowLabels",
			// // "Bulb Diameter":"RuleThermometerBulbDiameter",
			// // "Tube Width": "RuleThermometerTubeWidth",
			// // "Wall Thick": "RuleThermometerWallThickness",
			// // "Wall Color": "RuleThermometerWallColor",
			// // // // // // "Highlight BG Color": "RuleHighlightBackgroundColor",
			// "Use Channel Items": "RuleChoiceButtonUseChannelItems",
			"Line Width": "RuleLineWidth",
			"Line Color": "RuleLineColor",
			// "Bit": "RuleLEDBit",
			"Shape": "RuleLEDShape",
            "Bit Start": "RuleByteMonitorBitStart",
            "Bit Length": "RuleByteMonitorBitLength",
            "Sequence": "RuleByteMonitorSequence",
			// // // // // // // // // "Selected BG Color": "RuleChoiceButtonSelectedBackgroundColor",
			// // // // // // // // // "Unselected BG Color": "RuleChoiceButtonUnselectedBackgroundColor",
			// // // // // // // // // // "Use Pictures": "RuleBooleanButtonUsePictures",
			// // // // // // // // // // "Show LED": "RuleBooleanButtonShowLED",
			// // // // // // // // // // Bit: "RuleLEDBit",
			"Alarm Border": "RuleAlarmBorder",
			// // // // // // // // // "Button BG Color": "RuleProgressBarBackgroundColor",
			"Fallback Color": "RuleLEDFallbackColor",
			"Invisible in Operation": "RuleInvisibleInOperation",
		};

		this.addRuleComponentTypes(Object.keys(this.getRuleComponentTypesMap()));

		this.renewRuleComponent(false);
	}
}
