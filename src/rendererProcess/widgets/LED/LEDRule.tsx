import { LEDRules } from "./LEDRules";
import { BaseWidgetRule } from "../BaseWidget/BaseWidgetRule";

export class LEDRule extends BaseWidgetRule {
	constructor(index: number, rules: LEDRules) {
		super(index, rules);

		const a = {
			style: {
				// basics
				// position: "absolute",
				// display: "inline-flex",
				// dimensions
				// left: 0,
				// top: 0,
				// width: 100,
				// height: 100,
				// backgroundColor: "rgba(240, 240, 240, 0.2)",
				// angle
				// transform: "rotate(0deg)",
				// font
				// color: "rgba(0,0,0,1)",
				// fontFamily: GlobalVariables.defaultFontFamily,
				// fontSize: GlobalVariables.defaultFontSize,
				// fontStyle: GlobalVariables.defaultFontStyle,
				// fontWeight: GlobalVariables.defaultFontWeight,
				// border, it is different from the "alarmBorder" below
				// borderStyle: "solid",
				// borderWidth: 0,
				// borderColor: "rgba(0, 0, 0, 1)",
				// shows when the widget is selected
				// outlineStyle: "none",
				// outlineWidth: 1,
				// outlineColor: "black",
			},
			text: {
				// text styles
				// horizontalAlign: "flex-start",
				// verticalAlign: "flex-start",
				// wrapWord: true,
				// showUnit: false,
				// alarmBorder: true,
				// LED line style, not the border/outline line
				// lineWidth: 2,
				// lineStyle: "solid",
				// lineColor: "rgba(50, 50, 50, 0.698)",
				// round or square
				// shape: "round",
				// use channel value
				// bit: -1,
				// if the value is not valid
				// fallbackColor: "rgba(255,0,255,1)",
				// use channel's value and label, only valid for EPICS enum channels
				// that has "strings" property
				// useChannelItems: false,
				// invisibleInOperation: false,
			},
		};

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
			// // // // // // "Box Width": "RuleSlideButtonBoxWidth",
			"Wrap Word": "RuleWrapWord",
			"Show Unit": "RuleShowUnit",
			// "Use Channel Limit": "RuleUsePvLimits",
			// "Min Channel Value": "RuleMinPvValue",
			// "Max Channel Value": "RuleMaxPvValue",
			// "Use Log Scale": "RuleUseLogScale",
			// "Show Channel Value": "RuleShowPvValue",
			// // // "Angle Range": "RuleMeterAngleRange",
			// // // "Dial Color": "RuleMeterDialColor",
			// "Dial Height [%]": "RuleMeterDialPercentage",
			// // // "Dial Thickness": "RuleMeterDialThickness",
			// // // "Pointer Color": "RuleMeterPointerColor",
			// // // "Pointer Length [%]": "RuleMeterPointerLengthPercentage",
			// // // "Pointer Thickness": "RuleMeterPointerThickness",
			// "Label Position [%]": "RuleMeterLabelPositionPercentage",
			// "Dial Font Color": "RuleMeterDialFontColor",
			// "Dial Font Size": "RuleMeterDialFontSize",
			// Direction: "RuleDirection",
			// "Mercury Color": "RuleFillColor",
			// "Tube Color": "RuleProgressBarBackgroundColor",
			// ShowLabels: "RuleTankShowLabels",
			// "Bulb Diameter":"RuleThermometerBulbDiameter",
			// "Tube Width": "RuleThermometerTubeWidth",
			// "Wall Thick": "RuleThermometerWallThickness",
			// "Wall Color": "RuleThermometerWallColor",
			// // // // // "Highlight BG Color": "RuleHighlightBackgroundColor",
			"Use Channel Items": "RuleChoiceButtonUseChannelItems",
            "Line Width": "RuleLineWidth",
            "Line Color": "RuleLineColor",
            "Bit": "RuleLEDBit",
            "Shape": "RuleLEDShape",
			// // // // // // // // "Selected BG Color": "RuleChoiceButtonSelectedBackgroundColor",
			// // // // // // // // "Unselected BG Color": "RuleChoiceButtonUnselectedBackgroundColor",
			// // // // // // // // // "Use Pictures": "RuleBooleanButtonUsePictures",
			// // // // // // // // // "Show LED": "RuleBooleanButtonShowLED",
			// // // // // // // // // Bit: "RuleLEDBit",
			"Alarm Border": "RuleAlarmBorder",
			// // // // // // // // "Button BG Color": "RuleProgressBarBackgroundColor",
			"Fallback Color": "RuleLEDFallbackColor",
			"Invisible in Operation": "RuleInvisibleInOperation",
		};

		this.addRuleComponentTypes(Object.keys(this.getRuleComponentTypesMap()));

		this.renewRuleComponent(false);
	}
}
