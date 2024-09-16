import * as React from "react";
import { BaseWidgetRule } from "../../widgets/BaseWidget/BaseWidgetRule";
import { RuleComponent } from "./RuleComponent";
import * as mathjs from "mathjs";
import { g_widgets1 } from "../../global/GlobalVariables";

export class RuleOutlineStyle extends RuleComponent {
	constructor(rule: BaseWidgetRule) {
		super(rule);
	}

	getWidgetValue = () => {
		const style = this.getRule().getRules().getMainWidget().getStyle();
		return style["outlineStyle"];
	};

	ElementPropertyValue = () => {
		return (
			<form style={{ ...this.getFormStyle(), transition: "all .1s ease-in" }}>
				<div>is:</div>
				<select
					style={{ ...this.getInputStyle() }}
					onChange={(event: any) => {
						this.updatePropertyValue(event, event.target.value);
					}}
					defaultValue={`${this.getRule().getPropertyValue()}`}
				>
					<option value="none">Solid</option>
					<option value="solid">Solid</option>
				</select>
			</form>
		);
	};

	updatePropertyValue = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
		if (event) {
			event.preventDefault();
		}

		const oldValStr = `${this.getRule().getPropertyValue()}`;
		const newValStr = `${propertyValue}`;

		if (oldValStr === newValStr) {
			return;
		} else {
			this.getRule().setPropertyValue(newValStr);
		}

		// history
		const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
		history.registerAction();

		// no need to flush widget
	};

	evaluatePropertyValue = (input: string): { style: { outlineStyle?: string } } => {
		try {
			const result = input;
			if (typeof result !== "string") {
				return { style: {} };
			} else {
				return {
					style: {
						outlineStyle: result,
					},
				};
			}
		} catch (e) {
			return { style: {} };
		}
	};
}
