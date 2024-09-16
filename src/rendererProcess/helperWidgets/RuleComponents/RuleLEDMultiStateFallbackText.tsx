import * as React from "react";
import { BaseWidgetRule } from "../../widgets/BaseWidget/BaseWidgetRule";
import { RuleComponent } from "./RuleComponent";
import * as mathjs from "mathjs";
import { g_widgets1 } from "../../global/GlobalVariables";

export class RuleLEDMultiStateFallbackText extends RuleComponent {
	constructor(rule: BaseWidgetRule) {
		super(rule);
	}

	getWidgetValue = () => {
		const text = this.getRule().getRules().getMainWidget().getText();
		return text["fallbackText"];
	};

	ElementPropertyValue = () => {
		// property value in rule always a string
		const [fallbackText, setFallbackText] = React.useState(`${this.getRule().getPropertyValue()}`);

		return (
			<form
				onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
					this.updatePropertyValue(event, fallbackText);
				}}
				style={this.getRule().getFormStyle()}
			>
				<div>value is</div>
				<input
					style={this.getRule().getInputStyle()}
					type="text"
					name="fallbackText"
					value={fallbackText}
					onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
						setFallbackText(event.target.value);
					}}
					// must use enter to change the value
					onBlur={(event: any) => {
						if (`${this.getRuleTdl()["propertyValue"]}` !== `${fallbackText}`) {
							setFallbackText(`${this.getRuleTdl()["propertyValue"]}`);
						}
					}}
				/>
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

	evaluatePropertyValue = (input: string): { text: { fallbackText?: string } } => {
		try {
			const result = `${input}`;
			// const result = mathjs.evaluate(input);
			if (typeof result !== "string") {
				return { text: {} };
			} else {
				return {
					text: {
						fallbackText: result,
					},
				};
			}
		} catch (e) {
			return { text: {} };
		}
	};
}
