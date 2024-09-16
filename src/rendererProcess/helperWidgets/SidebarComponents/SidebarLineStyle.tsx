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
export class SidebarLineStyle extends SidebarComponent {
	constructor(sidebar: BaseWidgetSidebar) {
		super(sidebar);
	}

	_Element = () => {

		return (
			<form style={{ ...this.getFormStyle(), transition: "all .1s ease-in" }}>
				<div>Style:</div>
				<select
					style={{...this.getInputStyle()}}
					onChange={(event: any) => {
                        this.updateWidget(event, event.target.value);
					}}
					defaultValue={this.getMainWidget().getText()["lineStyle"]}
				>
					<option value="solid">Solid</option>
					<option value="dashed">Dashed</option>
					<option value="dotted">Dotted</option>
					<option value="dash-dot">Dash Dot</option>
					<option value="dash-dot-dot">Dash Dot Dot</option>
				</select>
			</form>
		);
	};

	updateWidget = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        event.preventDefault();
        
		const oldVal = this.getText()["lineStyle"];
		if (propertyValue === oldVal) {
			return;
		} else {
			this.getText()["lineStyle"] = propertyValue;
		}

		const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
		history.registerAction();

		g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
		g_widgets1.addToForceUpdateWidgets("GroupSelection2");

		g_flushWidgets();
	};
}
