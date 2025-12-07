import * as React from "react";
import { BaseWidgetSidebar } from "../../widgets/BaseWidget/BaseWidgetSidebar";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { SidebarComponent } from "./SidebarComponent";
import * as GlobalMethods from "../../../common/GlobalMethods";
import { CheckBox } from "../../widgets/CheckBox/CheckBox";
import { SlideButton } from "../../widgets/SlideButton/SlideButton";
import { BooleanButton } from "../../widgets/BooleanButton/BooleanButton";

/**
 * Represents the X component in sidebar. <br>
 *
 * It provides: (1) the JSX element, (2) the method to udpate the widget from sidebar, and (3) the method to
 * update this sidebar component from widget.
 */
export class SidebarLEDBit extends SidebarComponent {
	constructor(sidebar: BaseWidgetSidebar) {
		super(sidebar);
	}

	_setBit: any;

	_Element = () => {
		const [bit, setBit] = React.useState<number>(parseInt(this.getText()["bit"]));
		this._setBit = setBit;

		return (
			<form onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.updateWidget(event, bit)} style={this.getFormStyle()}>
				<div>Bit:</div>
				<input
					style={this.getInputStyle()}
					type="number"
					name="left"
					value={bit}
					onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
						const newVal = event.target.value;
						setBit(parseInt(newVal));
					}}
					// must use enter to change the value
					onBlur={(event: any) => {
						if (parseInt(this.getText()["bit"]) !== bit) {
							setBit(parseInt(this.getText()["bit"]));
						}
					}}
				/>
			</form>
		);
	};

	updateWidget = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
		event.preventDefault();

		const oldVal = this.getText()["bit"];
		let newVal = Math.max(propertyValue as number, 0);
        // In CheckBox and SlideButton, a negative bit means using the whole value
        if (this.getMainWidget() instanceof CheckBox || this.getMainWidget() instanceof SlideButton|| this.getMainWidget() instanceof BooleanButton) {
            newVal = propertyValue as number;
        }
		if (propertyValue === oldVal) {
			return;
		} else {
			this.getText()["bit"] = newVal;
			if (this._setBit) {
				this._setBit(newVal);
			}
		}

		const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
		history.registerAction();

		g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
		g_widgets1.addToForceUpdateWidgets("GroupSelection2");

		g_flushWidgets();
	};
}
