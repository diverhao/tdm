import * as React from "react";
import { BaseWidgetRule } from "../../widgets/BaseWidget/BaseWidgetRule";
import { RuleComponent } from "./RuleComponent";
import * as mathjs from "mathjs";
import { g_widgets1 } from "../../global/GlobalVariables";

export class RuleInvisibleInOperation extends RuleComponent {
	constructor(rule: BaseWidgetRule) {
		super(rule);
	}

	getWidgetValue = () => {
		const text = this.getRule().getRules().getMainWidget().getText();
		return text["invisibleInOperation"];
	};

	ElementPropertyValue = () => {
		// "true" or "false"
		const [invisibleInOperation, setInvisibleInOperation] = React.useState(`${this.getRule().getPropertyValue()}`);

		return (
			<form style={this.getRule().getFormStyle()}>
				<div>is</div>
				<input
					type="checkbox"
					checked={mathjs.evaluate(invisibleInOperation)}
					onChange={(event: any) => {
						if (invisibleInOperation === "true") {
							this.updatePropertyValue(event, "false");
							setInvisibleInOperation("false");
						} else {
							this.updatePropertyValue(event, "true");
							setInvisibleInOperation("true");
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

	evaluatePropertyValue = (input: string): { text: { invisibleInOperation?: boolean } } => {
		try {
			// input is string "true" or "false"
			const result = mathjs.evaluate(input);
			if (typeof result !== "boolean") {
				return { text: {} };
			} else {
				return {
					text: {
						// boolean true or false
						invisibleInOperation: result,
					},
				};
			}
		} catch (e) {
			return { text: {} };
		}
	};
}