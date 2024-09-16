import * as React from "react";
import { BaseWidgetRule } from "../../widgets/BaseWidget/BaseWidgetRule";
import { RuleComponent } from "./RuleComponent";
import * as mathjs from "mathjs";
import { g_widgets1 } from "../../global/GlobalVariables";

export class RuleY extends RuleComponent {
	constructor(rule: BaseWidgetRule) {
		super(rule);
	}

	getWidgetValue = () => {
		const style = this.getRule().getRules().getMainWidget().getStyle();
		return style["top"];
	};

	ElementPropertyValue = () => {
		const [top, setTop] = React.useState(`${this.getRuleTdl()["propertyValue"]}`);

		return (
			<form
				onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                    this.updatePropertyValue(event, top);
                }}
				style={this.getRule().getFormStyle()}
			>
				<div>value is</div>
				<input
					style={this.getRule().getInputStyle()}
					type="text"
					name="top"
					value={top}
					onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
						setTop(event.target.value);
					}}
					// must use enter to change the value
					onBlur={(event: any) => {
						if (`${this.getRuleTdl()["propertyValue"]}` !== `${top}`) {
							setTop(`${this.getRuleTdl()["propertyValue"]}`);
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
	evaluatePropertyValue = (input: string): { style: { top?: number } } => {
		try {
			const result = mathjs.evaluate(input);
			if (typeof result !== "number") {
				return { style: {} };
			} else {
				return {
					style: {
						top: result,
					},
				};
			}
		} catch (e) {
			return { style: {} };
		}
	};
}
