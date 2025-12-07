import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { BaseWidgetRule } from "../../widgets/BaseWidget/BaseWidgetRule";
import { RuleComponent } from "./RuleComponent";
import { Collapsible } from "../../helperWidgets/ColorPicker/Collapsible";
import * as GlobalMethods from "../../../common/GlobalMethods";

export class RuleHighlightBackgroundColor extends RuleComponent {
	constructor(rule: BaseWidgetRule) {
		super(rule);
	}

	getWidgetValue = () => {
		const text = this.getRule().getRules().getMainWidget().getText();
		return text["highlightBackgroundColor"];
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
				eventName={"backgroundColor-color"}
			/>
		);
	};

	updatePropertyValue = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
		if (event) {
			event.preventDefault();
		}
		let oldVal = this.getRuleTdl()["propertyValue"];
		let newVal = GlobalMethods.rgbaArrayToRgbaStr(propertyValue as number[]);

		if (newVal === oldVal) {
			return;
		} else {
			this.getRuleTdl()["propertyValue"] = newVal;
		}

		if (this._forceUpdateElement !== undefined) {
			this._forceUpdateElement();
		}
		// the history for color is handled inside Collpsible
		// no need to flush widget
	};

	// no converion or evalution is needed
	evaluatePropertyValue = (input: string): { text: { highlightBackgroundColor?: string } } => {
		return {
			text: {
				highlightBackgroundColor: input,
			},
		};
	};
}
