import { PolylineRules } from "./PolylineRules";
import { BaseWidgetRule } from "../BaseWidget/BaseWidgetRule";

export class PolylineRule extends BaseWidgetRule {
	constructor(index: number, rules: PolylineRules) {
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
			"Line Width": "RuleLineWidth",
			"Line Color": "RuleLineColor",
			"Line Style": "RuleLineStyle",
			"Show Arrow Head": "RuleShowArrowHead",
			"Show Arrow Tail": "RuleShowArrowTail",
			"Fill Color": "RuleFillColor",
			"Invisible in Operation": "RuleInvisibleInOperation",
            "Smootherize": "RulePolylineSmootherize",
            "Fill": "RulePolylineFill",
            "Closed": "RulePolylineClosed",
            "Arrow Length": "RulePolylineArrowLength",
            "Arrow Width": "RulePolylineArrowWidth",
            "Alarm Border": "RuleAlarmBorder",
		};

		this.addRuleComponentTypes(Object.keys(this.getRuleComponentTypesMap()));
		this.renewRuleComponent(false);
	}
}
