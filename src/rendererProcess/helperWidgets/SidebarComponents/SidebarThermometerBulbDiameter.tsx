import * as React from "react";
import { BaseWidgetSidebar } from "../../widgets/BaseWidget/BaseWidgetSidebar";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { SidebarComponent } from "./SidebarComponent";
import * as GlobalMethods from "../../../common/GlobalMethods";

/**
 * Represents the X component in sidebar. <br>
 *
 * It provides: (1) the JSX element, (2) the method to udpate the widget from sidebar, and (3) the method to
 * update this sidebar component from widget.
 */
export class SidebarThermometerBulbDiameter extends SidebarComponent {
	constructor(sidebar: BaseWidgetSidebar) {
		super(sidebar);
	}

    _forceUpdate: any;

	_Element = () => {
		const [bulbDiameter, setBulbDiameter] = React.useState<number>(parseInt(this.getText()["bulbDiameter"]));

        this._forceUpdate = () => {
            setBulbDiameter(parseInt(this.getText()["bulbDiameter"]));
        }

		return (
			<form onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.updateWidget(event, bulbDiameter)} style={this.getFormStyle()}>
				<div>Bulb Size</div>
				<input
					// the same with as dropdown menu in SidebarLineStyle, which is an <input /> element with 70% width
					style={{ ...this.getInputStyle(), width: "50%",}}
					type="number"
					name="bulbDiameter"
					value={bulbDiameter}
					onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
						const newVal = event.target.value;
						setBulbDiameter(parseInt(newVal));
					}}
					// must use enter to change the value
					onBlur={(event: any) => {
						if (parseInt(this.getText()["bulbDiameter"]) !== bulbDiameter) {
							setBulbDiameter(parseInt(this.getText()["bulbDiameter"]));
						}
					}}
				/>
			</form>
		);
	};

	updateWidget = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
		event.preventDefault();

		const oldVal = this.getText()["bulbDiameter"];
		if (propertyValue === oldVal) {
			return;
		} else {
			this.getText()["bulbDiameter"] = Math.max(propertyValue as number, Math.ceil(this.getText()["tubeWidth"] + 5));
            this._forceUpdate();
		}

		const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
		history.registerAction();

		g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
		g_widgets1.addToForceUpdateWidgets("GroupSelection2");

		g_flushWidgets();
	};
}
