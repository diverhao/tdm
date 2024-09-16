import * as React from "react";
import { BaseWidgetRule } from "../../widgets/BaseWidget/BaseWidgetRule";
import { RuleComponent } from "./RuleComponent";
import * as mathjs from "mathjs";
import { g_widgets1 } from "../../global/GlobalVariables";

export class RuleX extends RuleComponent {
	constructor(rule: BaseWidgetRule) {
		super(rule);
	}

	getWidgetValue = () => {
		const style = this.getRule().getRules().getMainWidget().getStyle();
		return style["left"];
	};

	ElementPropertyValue = () => {
		const [left, setLeft] = React.useState(`${this.getRule().getPropertyValue()}`);

		return (
			<form
				onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                    this.updatePropertyValue(event, left);
                }}
				style={this.getRule().getFormStyle()}
			>
				<div>value is</div>
				<input
					style={this.getRule().getInputStyle()}
					type="text"
					name="left"
					value={left}
					onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
						setLeft(event.target.value);
					}}
					// must use enter to change the value
					onBlur={(event: any) => {
						if (`${this.getRuleTdl()["propertyValue"]}` !== `${left}`) {
							setLeft(`${this.getRuleTdl()["propertyValue"]}`);
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

	evaluatePropertyValue = (input: string): { style: { left?: number } } => {
		try {
			const result = mathjs.evaluate(input);
			if (typeof result !== "number") {
				return { style: {} };
			} else {
				return {
					style: {
						left: result,
					},
				};
			}
		} catch (e) {
			return { style: {} };
		}
	};
}
