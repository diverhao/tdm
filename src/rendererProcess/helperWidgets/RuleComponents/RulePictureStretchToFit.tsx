import * as React from "react";
import { BaseWidgetRule } from "../../widgets/BaseWidget/BaseWidgetRule";
import { RuleComponent } from "./RuleComponent";
import * as mathjs from "mathjs";
import { g_widgets1 } from "../../global/GlobalVariables";

export class RulePictureStretchToFit extends RuleComponent {
	constructor(rule: BaseWidgetRule) {
		super(rule);
	}

	getWidgetValue = () => {
		const text = this.getRule().getRules().getMainWidget().getText();
		return text["stretchToFit"];
	};

	ElementPropertyValue = () => {
		// "true" or "false"
		const [stretchToFit, setStretchToFit] = React.useState(`${this.getRule().getPropertyValue()}`);

		return (
			<form style={this.getRule().getFormStyle()}>
				<div>is</div>
				<input
					type="checkbox"
					checked={mathjs.evaluate(stretchToFit)}
					onChange={(event: any) => {
						if (stretchToFit === "true") {
							this.updatePropertyValue(event, "false");
							setStretchToFit("false");
						} else {
							this.updatePropertyValue(event, "true");
							setStretchToFit("true");
						}
					}}
				/>
			</form>
		);
	};

	updatePropertyValue = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
		if (event) {
            // do not prevent default
			// event.preventDefault();
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

	evaluatePropertyValue = (input: string): { text: { stretchToFit?: boolean } } => {
		try {
			// input is string "true" or "false"
			const result = mathjs.evaluate(input);
			if (typeof result !== "boolean") {
				return { text: {} };
			} else {
				return {
					text: {
						// boolean true or false
						stretchToFit: result,
					},
				};
			}
		} catch (e) {
			return { text: {} };
		}
	};
}
