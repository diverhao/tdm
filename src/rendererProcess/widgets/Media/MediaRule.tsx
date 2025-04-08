import { MediaRules } from "./MediaRules";
import { BaseWidgetRule } from "../BaseWidget/BaseWidgetRule";

export class MediaRule extends BaseWidgetRule {
	constructor(index: number, rules: MediaRules) {
		super(index, rules);
		const a = {
			style: {
                // basics
                // position: "absolute",
                // display: "inline-flex",
                // // dimensions
                // left: 0,
                // top: 0,
                // width: 100,
                // height: 100,
                // backgroundColor: "rgba(0, 0, 0, 0)",
                // transform: "rotate(0deg)",
                // color: "rgba(0,0,0,1)",
                // border, it is different from the "alarmBorder" below
                // borderStyle: "solid",
                // borderWidth: 0,
                // borderColor: "rgba(0, 0, 0, 1)",
                // // shows when the widget is selected
                // outlineStyle: "none",
                // outlineWidth: 1,
                // outlineColor: "black",
            },
            text: {
                // actually "alarm outline"
                // alarmBorder: true,
                // media file name, could be picture types, pdf, or video type
                // fileName: "../../../mainProcess/resources/webpages/tdm-logo.svg",
                // opacity
                // opacity: 1,
                // for picture
                // stretchToFit: false,
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
			// "Line Width": "RuleLineWidth",
			// "Line Color": "RuleLineColor",
			// "Line Style": "RuleLineStyle",
			// "Fill": "RulePolylineFill",
			// "Fill Color": "RuleFillColor",
			// "Corner Width": "RuleRectangleCornerWidth",
			// "Corner Height": "RuleRectangleCornerHeight",
			"Text Color": "RuleColor",
			// // "Font Size": "RuleFontSize",
			"Border Width": "RuleBorderWidth",
			"Border Color": "RuleBorderColor",
            "Picture Opacity": "RulePictureOpacity",
            "Pic Stretch to Fit": "RulePictureStretchToFit",
            "Default File Name": "RuleMediaDefaultFileName",
			// // "Horizontal Align": "RuleXAlign",
			// // "Vertical Align": "RuleYAlign",
			// // // // // "Box Width": "RuleSlideButtonBoxWidth",
			// // "Wrap Word": "RuleWrapWord",
			// // "Text": "RuleText",
			// // // "Show Unit": "RuleShowUnit",
			// // // // "Highlight BG Color": "RuleHighlightBackgroundColor",
			// // // // // "Use Channel Items": "RuleChoiceButtonUseChannelItems",
			// // // // // // // "Selected BG Color": "RuleChoiceButtonSelectedBackgroundColor",
			// // // // // // // "Unselected BG Color": "RuleChoiceButtonUnselectedBackgroundColor",
			// // // // // // // // "Use Pictures": "RuleBooleanButtonUsePictures",
			// // // // // // // // "Show LED": "RuleBooleanButtonShowLED",
			// // // // // // // // Bit: "RuleLEDBit",
			"Alarm Border": "RuleAlarmBorder",
			// // // // // // // "Button BG Color": "RuleProgressBarBackgroundColor",
			// // // // // // // // "Fallback Color": "RuleLEDFallbackColor",
			"Invisible in Operation": "RuleInvisibleInOperation",
		};

		this.addRuleComponentTypes(Object.keys(this.getRuleComponentTypesMap()));

		this.renewRuleComponent(false);
	}
}
