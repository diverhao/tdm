import * as React from "react";
import { BaseWidgetRule } from "../../widgets/BaseWidget/BaseWidgetRule";
import { RuleComponent } from "./RuleComponent";
import { Collapsible } from "../../helperWidgets/ColorPicker/Collapsible";
import * as GlobalMethods from "../../../common/GlobalMethods";

export class RuleBorderColor extends RuleComponent {
	constructor(rule: BaseWidgetRule) {
		super(rule);
	}

	getWidgetValue = () => {
		const style = this.getRule().getRules().getMainWidget().getStyle();
		return style["borderColor"];
	};

	ElementPropertyValue = () => {
        const [, forceUpdate] = React.useState({});
		this._forceUpdateElement = () => {
			forceUpdate({});
		};

		return (
			<Collapsible
				rgbColorStr={this.getRuleTdl()["propertyValue"]}
				updateFromSidebar={(event: any, propertyName: string, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
					this.updatePropertyValue(event, propertyValue);
				}}
				title={"is"}
				eventName={"border-color"}
			/>
		);
	};

	updatePropertyValue = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
		if (event) {
			event.preventDefault();
		}
		const ruleTdl = this.getRuleTdl();
		let newVal = undefined;
		let oldVal = undefined;
		newVal = GlobalMethods.rgbaArrayToRgbaStr(propertyValue as number[]);
		oldVal = ruleTdl["propertyValue"];
		if (newVal === oldVal) {
			return;
		} else {
			ruleTdl["propertyValue"] = newVal;
		}
        
		if (this._forceUpdateElement !== undefined) {
			this._forceUpdateElement();
		}

		// the history for color is handled inside Collpsible
        // no need to flush widget
	};

	evaluatePropertyValue = (input: string): { style: { borderColor?: string } } => {
		return {
			style: {
				borderColor: input,
			},
		};
	};
}
