import * as React from "react";
import { BaseWidgetSidebar } from "../../widgets/BaseWidget/BaseWidgetSidebar";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { SidebarComponent } from "./SidebarComponent";
import * as GlobalMethods from "../../global/GlobalMethods";

/**
 * Represents the X component in sidebar. <br>
 *
 * It provides: (1) the JSX element, (2) the method to udpate the widget from sidebar, and (3) the method to
 * update this sidebar component from widget.
 */
export class SidebarMeterPointerLengthPercentage extends SidebarComponent {
	constructor(sidebar: BaseWidgetSidebar) {
		super(sidebar);
	}

	_forceUpdate: any = undefined;

	_Element = () => {
		const [pointerLengthPercentage, setPointerLengthPercentage] = React.useState<number>(parseInt(this.getText()["pointerLengthPercentage"]));

        this._forceUpdate = () => {
            setPointerLengthPercentage(parseInt(this.getText()["pointerLengthPercentage"]));
        }

		return (
			<form onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.updateWidget(event, pointerLengthPercentage)} style={this.getFormStyle()}>
				<div>Size [%]</div>
				<input
					// the same with as dropdown menu in SidebarLineStyle, which is an <input /> element with 70% width
					style={{ ...this.getInputStyle(), width: "65.6%", }}
					type="number"
					name="pointerLengthPercentage"
					value={pointerLengthPercentage}
					onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
						const newVal = event.target.value;
						setPointerLengthPercentage(parseInt(newVal));
					}}
					// must use enter to change the value
					onBlur={(event: any) => {
						if (parseInt(this.getText()["pointerLengthPercentage"]) !== pointerLengthPercentage) {
							setPointerLengthPercentage(parseInt(this.getText()["pointerLengthPercentage"]));
						}
					}}
				/>
			</form>
		);
	};

	updateWidget = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
		event.preventDefault();

		const oldVal = this.getText()["pointerLengthPercentage"];
		if (propertyValue === oldVal) {
			return;
		} else {
			let newValue = Math.max(Math.min(propertyValue as number, 100), 20);
			this.getText()["pointerLengthPercentage"] = newValue;
            if (this._forceUpdate) {
                this._forceUpdate();
            }
		}

		const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
		history.registerAction();

		g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
		g_widgets1.addToForceUpdateWidgets("GroupSelection2");

		g_flushWidgets();
	};
}