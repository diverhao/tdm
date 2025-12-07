import * as React from "react";
import { BaseWidgetRule } from "../../widgets/BaseWidget/BaseWidgetRule";
import { RuleComponent } from "./RuleComponent";
import * as mathjs from "mathjs";
import * as GlobalMethods from "../../../common/GlobalMethods";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";

export class RuleAngle extends RuleComponent {
	constructor(rule: BaseWidgetRule) {
		super(rule);
	}

	getWidgetValue = () => {
		const style = this.getRule().getRules().getMainWidget().getStyle();
		return style["transform"];
	};

	ElementPropertyValue = () => {
		const [angle, setAngle] = React.useState(GlobalMethods.parseIntAngle(`${this.getRule().getPropertyValue()}`));

		return (
			<form
				onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                    this.updatePropertyValue(event, angle);
				}}
				style={this.getRule().getFormStyle()}
			>
				<div>value is</div>
				<input
					style={this.getRule().getInputStyle()}
					type="text"
					name="left"
					value={`${angle}`}
					onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
						const newVal = event.target.value;
						setAngle(Math.min(Math.max(parseInt(newVal), 0), 360));
					}}
					// must use enter to change the value
					onBlur={(event: any) => {
						const orig = GlobalMethods.parseIntAngle(`${this.getRuleTdl()["propertyValue"]}`);
						if (orig !== angle) {
							setAngle(orig);
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
		const newValStr = GlobalMethods.insertIntAngle(propertyValue as number, oldValStr);

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

	evaluatePropertyValue = (input: string): { style: { transform?: string } } => {
		try {
			// const result = mathjs.evaluate(input);
			const result = input;
			if (typeof result !== "string") {
				return { style: {} };
			} else {
				return {
					style: {
						transform: result,
					},
				};
			}
		} catch (e) {
			return { style: {} };
		}
	};
}
