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
export class SidebarThermometerTubeWidth extends SidebarComponent {
	constructor(sidebar: BaseWidgetSidebar) {
		super(sidebar);
	}

	_forceUpdate: any;

	_Element = () => {
		const [tubeWidth, setTubeWidth] = React.useState<number>(parseInt(this.getText()["tubeWidth"]));

		this._forceUpdate = () => {
			setTubeWidth(parseInt(this.getText()["tubeWidth"]));
		};

		return (
			<form onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.updateWidget(event, tubeWidth)} style={this.getFormStyle()}>
				<div>Tube Width</div>
				<input
					// the same with as dropdown menu in SidebarLineStyle, which is an <input /> element with 70% width
					style={{ ...this.getInputStyle(), width: "50%" }}
					type="number"
					name="tubeWidth"
					value={tubeWidth}
					onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
						const newVal = event.target.value;
						setTubeWidth(parseInt(newVal));
					}}
					// must use enter to change the value
					onBlur={(event: any) => {
						if (parseInt(this.getText()["tubeWidth"]) !== tubeWidth) {
							setTubeWidth(parseInt(this.getText()["tubeWidth"]));
						}
					}}
				/>
			</form>
		);
	};

	updateWidget = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
		event.preventDefault();

		const oldVal = this.getText()["tubeWidth"];
		if (propertyValue === oldVal) {
			return;
		} else {
			this.getText()["tubeWidth"] = Math.min(
				Math.max(propertyValue as number, 6 + this.getText()["wallThickness"]),
				Math.ceil(this.getText()["bulbDiameter"] - 5)
			);
			// this.getText()["tubeWidth"] = Math.max(propertyValue as number, 6+this.getText()["wallThickness"]);
			this._forceUpdate();
		}

		const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
		history.registerAction();

		g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
		g_widgets1.addToForceUpdateWidgets("GroupSelection2");

		g_flushWidgets();
	};
}
