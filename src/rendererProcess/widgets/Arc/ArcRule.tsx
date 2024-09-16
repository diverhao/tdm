import { ArcRules } from "./ArcRules";
import { BaseWidgetRule } from "../BaseWidget/BaseWidgetRule";

export class ArcRule extends BaseWidgetRule {
	constructor(index: number, rules: ArcRules) {
		super(index, rules);

        // widget-specific rule type name vs global rule type name
		this._ruleComponentTypesMap = {
			X: "RuleX",
			Y: "RuleY",
			Width: "RuleWidth",
			Height: "RuleHeight",
			Angle: "RuleAngle",
			"Border Color": "RuleBorderColor",
			"Border Width": "RuleBorderWidth",
            "Background Color": "RuleBackgroundColor",
            // we use style["color"] to control line color
            "Line Color": "RuleLineColor",
            "Line Width": "RuleLineWidth",
            "Line Style": "RuleLineStyle",
            "Fill Color": "RuleFillColor",
            "Fill": "RulePolylineFill",
            "Show Arrow Head": "RuleShowArrowHead",
            "Show Arrow Tail": "RuleShowArrowTail",
            "Arrow Length": "RulePolylineArrowLength",
            "Arrow Width": "RulePolylineArrowWidth",
            "Angle Start": "RuleArcAngleStart",
            "Angle Range": "RuleArcAngleRange",
            "Show Radius": "RuleArcShowRadius",
            "Alarm Border": "RuleAlarmBorder",

            // "Font Size": "RuleFontSize",
            // "Text": "RuleText",
            // "Wrap Word": "RuleWrapWord",
            // "Alarm Border": "RuleAlarmBorder",
			"Invisible in Operation": "RuleInvisibleInOperation",
		};

		this.addRuleComponentTypes(Object.keys(this.getRuleComponentTypesMap()));
		this.renewRuleComponent(false);
	}
}
