import * as React from "react";
import { BaseWidgetSidebar } from "../../widgets/BaseWidget/BaseWidgetSidebar";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { SidebarComponent } from "./SidebarComponent";
import * as GlobalMethods from "../../global/GlobalMethods"

/**
 * Represents the X component in sidebar. <br>
 *
 * It provides: (1) the JSX element, (2) the method to udpate the widget from sidebar, and (3) the method to
 * update this sidebar component from widget.
 */
export class SidebarDirection extends SidebarComponent {
	constructor(sidebar: BaseWidgetSidebar) {
		super(sidebar);
	}

	_Element = () => {

		return (
			<form style={{ ...this.getFormStyle(), transition: "all .1s ease-in" }}>
				<div>Direction:</div>
				<select
					style={{...this.getInputStyle(), width: "60%"}}
					onChange={(event: any) => {
                        this.updateWidget(event, event.target.value);
					}}
					defaultValue={this.getMainWidget().getText()["direction"]}
				>
					<option value="horizontal">Horizontal</option>
					<option value="vertical">Vertical</option>
				</select>
			</form>
		);
	};

	updateWidget = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        event.preventDefault();
        
		const oldVal = this.getText()["direction"];
		if (propertyValue === oldVal) {
			return;
		} else {
			this.getText()["direction"] = propertyValue;
		}

        const tmp = this.getStyle()["width"];
        this.getStyle()["width"] = this.getStyle()["height"];
        this.getStyle()["height"] = tmp;

        g_widgets1.updateSidebar(true);

		const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
		history.registerAction();

		g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
		g_widgets1.addToForceUpdateWidgets("GroupSelection2");

		g_flushWidgets();
	};
}
