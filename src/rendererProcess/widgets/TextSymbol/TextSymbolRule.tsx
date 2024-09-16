import { TextSymbolRules } from "./TextSymbolRules";
import { BaseWidgetRule } from "../BaseWidget/BaseWidgetRule";

export class TextSymbolRule extends BaseWidgetRule {
	constructor(index: number, rules: TextSymbolRules) {
		super(index, rules);
        
        const a = {
            style: {
                // position: "absolute",
                // display: "inline-block",
                // backgroundColor: "rgba(240, 240, 240, 0.2)",
                // left: 100,
                // top: 100,
                // width: 150,
                // height: 80,
                // outlineStyle: "none",
                // outlineWidth: 1,
                // outlineColor: "black",
                // transform: "rotate(0deg)",
                // color: "rgba(0,0,0,1)",
                // borderStyle: "solid",
                // borderWidth: 0,
                // borderColor: "rgba(255, 0, 0, 1)",
                // fontFamily: GlobalVariables.defaultFontFamily,
                // fontSize: GlobalVariables.defaultFontSize,
                // fontStyle: GlobalVariables.defaultFontStyle,
                // fontWeight: GlobalVariables.defaultFontWeight,
            },
            // the ElementBody style
            text: {
                // horizontalAlign: "flex-start",
                // verticalAlign: "flex-start",
                // wrapWord: true,
                // showUnit: false,
                // alarmBorder: true,
                // opacity: 1,
                // invisibleInOperation: false,
            },
        }

		this._ruleComponentTypesMap = {
			X: "RuleX",
			Y: "RuleY",
			Width: "RuleWidth",
			Height: "RuleHeight",
			Angle: "RuleAngle",
			"Background Color": "RuleBackgroundColor",
			// // // "Line Width": "RuleLineWidth",
			// // // "Line Color": "RuleLineColor",
			// // // "Line Style": "RuleLineStyle",
			// // // "Fill": "RulePolylineFill",
			// // // "Fill Color": "RuleFillColor",
			// // // "Corner Width": "RuleRectangleCornerWidth",
			// // // "Corner Height": "RuleRectangleCornerHeight",
			"Text Color": "RuleColor",
			"Font Size": "RuleFontSize",
			"Border Width": "RuleBorderWidth",
			"Border Color": "RuleBorderColor",
			// "Picture Opacity": "RulePictureOpacity",
			// "Pic Stretch to Fit": "RulePictureStretchToFit",
			// "Default File Name": "RuleMediaDefaultFileName",
			"Horizontal Align": "RuleXAlign",
			"Vertical Align": "RuleYAlign",
			// // // // // // // "Box Width": "RuleSlideButtonBoxWidth",
			"Wrap Word": "RuleWrapWord",
			// // // // "Text": "RuleText",
			"Show Unit": "RuleShowUnit",
            // "Show Channel Value": "RuleShowPvValue",
			// // // // // // "Highlight BG Color": "RuleHighlightBackgroundColor",
			// // // // // // // "Use Channel Items": "RuleChoiceButtonUseChannelItems",
			// // // // // // // // // "Selected BG Color": "RuleChoiceButtonSelectedBackgroundColor",
			// // // // // // // // // "Unselected BG Color": "RuleChoiceButtonUnselectedBackgroundColor",
			// // // // // // // // // // "Use Pictures": "RuleBooleanButtonUsePictures",
			// // // // // // // // // // "Show LED": "RuleBooleanButtonShowLED",
			// // // // // // // // // // Bit: "RuleLEDBit",
			"Alarm Border": "RuleAlarmBorder",
			// // // // // // // // // "Button BG Color": "RuleProgressBarBackgroundColor",
			// // // // // // // // // // "Fallback Color": "RuleLEDFallbackColor",
			"Invisible in Operation": "RuleInvisibleInOperation",
		};

		this.addRuleComponentTypes(Object.keys(this.getRuleComponentTypesMap()));

		this.renewRuleComponent(false);
	}
}
