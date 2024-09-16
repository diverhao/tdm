import * as React from "react";
import { BaseWidgetRule } from "../../widgets/BaseWidget/BaseWidgetRule";
import { RuleComponent } from "./RuleComponent";
import * as mathjs from "mathjs";
import { g_widgets1 } from "../../global/GlobalVariables";

export class RuleByteMonitorBitStart extends RuleComponent {
	constructor(rule: BaseWidgetRule) {
		super(rule);
	}

	getWidgetValue = () => {
		const text = this.getRule().getRules().getMainWidget().getText();
		return text["bitStart"];
	};

	ElementPropertyValue = () => {
        // property value in rule always a string
		const [bitStart, setBitStart] = React.useState(`${this.getRule().getPropertyValue()}`);

		return (
			<form
				onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                    this.updatePropertyValue(event, bitStart);
				}}
				style={this.getRule().getFormStyle()}
			>
				<div>value is</div>
				<input
					style={this.getRule().getInputStyle()}
					type="text"
					name="bitStart"
					value={bitStart}
					onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
						setBitStart(event.target.value);
					}}
					// must use enter to change the value
					onBlur={(event: any) => {
						if (`${this.getRuleTdl()["propertyValue"]}` !== `${bitStart}`) {
							setBitStart(`${this.getRuleTdl()["propertyValue"]}`);
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

	evaluatePropertyValue = (input: string): { text: { bitStart?: number } } => {
		try {
			const result = mathjs.evaluate(input);
			if (typeof result !== "number") {
				return { text: {} };
			} else {
				return {
					text: {
						bitStart: result,
					},
				};
			}
		} catch (e) {
			return { text: {} };
		}
	};
}
