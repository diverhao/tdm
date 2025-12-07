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
export class SidebarThermometerWallThickness extends SidebarComponent {
	constructor(sidebar: BaseWidgetSidebar) {
		super(sidebar);
	}

    _forceUpdate: any;

	_Element = () => {
		const [wallThickness, setWallThickness] = React.useState<number>(parseInt(this.getText()["wallThickness"]));

        this._forceUpdate = () => {
            setWallThickness(parseInt(this.getText()["wallThickness"]));
        }

		return (
			<form onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.updateWidget(event, wallThickness)} style={this.getFormStyle()}>
				<div>Wall Thick</div>
				<input
					// the same with as dropdown menu in SidebarLineStyle, which is an <input /> element with 70% width
					style={{ ...this.getInputStyle(), width: "50%"}}
					type="number"
					name="wallThickness"
					value={wallThickness}
					onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
						const newVal = event.target.value;
						setWallThickness(parseInt(newVal));
					}}
					// must use enter to change the value
					onBlur={(event: any) => {
						if (parseInt(this.getText()["wallThickness"]) !== wallThickness) {
							setWallThickness(parseInt(this.getText()["wallThickness"]));
						}
					}}
				/>
			</form>
		);
	};

	updateWidget = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
		event.preventDefault();

		const oldVal = this.getText()["wallThickness"];
		if (propertyValue === oldVal) {
			return;
		} else {
			this.getText()["wallThickness"] = Math.min(propertyValue as number, this.getText()["tubeWidth"] - 6);
            this._forceUpdate();
		}

		const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
		history.registerAction();

		g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
		g_widgets1.addToForceUpdateWidgets("GroupSelection2");

		g_flushWidgets();
	};
}
