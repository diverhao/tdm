import * as React from "react";
import { BaseWidgetSidebar } from "../../widgets/BaseWidget/BaseWidgetSidebar";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { SidebarComponent } from "./SidebarComponent";

/**
 * Represents the X component in sidebar. <br>
 *
 * It provides: (1) the JSX element, (2) the method to udpate the widget from sidebar, and (3) the method to
 * update this sidebar component from widget.
 */
export class SidebarMeterDialPercentage extends SidebarComponent {
	constructor(sidebar: BaseWidgetSidebar) {
		super(sidebar);
	}

    _forceUpdate: any;

	_Element = () => {
		const [dialPercentage, setDialPercentage] = React.useState<number>(parseInt(this.getText()["dialPercentage"]));

        this._forceUpdate = () => {
            setDialPercentage(parseInt(this.getText()["dialPercentage"]));
        }

		return (
			<form onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.updateWidget(event, dialPercentage)} style={this.getFormStyle()}>
				<div>Height [%] </div>
				<input
					// the same with as dropdown menu in SidebarLineStyle, which is an <input /> element with 70% width
					style={{ ...this.getInputStyle(), width: "60%"}}
					type="number"
					name="dialPercentage"
					value={dialPercentage}
					onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
						const newVal = event.target.value;
						setDialPercentage(parseInt(newVal));
					}}
					// must use enter to change the value
					onBlur={(event: any) => {
						if (parseInt(this.getText()["dialPercentage"]) !== dialPercentage) {
							setDialPercentage(parseInt(this.getText()["dialPercentage"]));
						}
					}}
				/>
			</form>
		);
	};

	updateWidget = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
		event.preventDefault();

		const oldVal = this.getText()["dialPercentage"];
		if (propertyValue === oldVal) {
			return;
		} else {
            let newValue = Math.max(Math.min(propertyValue as number, 100), 10);
			this.getText()["dialPercentage"] = newValue;
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
