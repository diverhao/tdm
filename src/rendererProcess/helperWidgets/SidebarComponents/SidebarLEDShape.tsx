import * as React from "react";
import { BaseWidgetSidebar } from "../../widgets/BaseWidget/BaseWidgetSidebar";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { SidebarComponent } from "./SidebarComponent";
import * as GlobalMethods from "../../../common/GlobalMethods";
import { ByteMonitorSidebar } from "../../widgets/ByteMonitor/ByteMonitorSidebar";

/**
 * Represents the X component in sidebar. <br>
 *
 * It provides: (1) the JSX element, (2) the method to udpate the widget from sidebar, and (3) the method to
 * update this sidebar component from widget.
 */
export class SidebarLEDShape extends SidebarComponent {
	constructor(sidebar: BaseWidgetSidebar) {
		super(sidebar);
	}

	_Element = () => {

        const width = this.getSidebar() instanceof ByteMonitorSidebar? "60%": this.getInputStyle()["width"];

		return (
			<form style={{ ...this.getFormStyle(), transition: "all .1s ease-in" }}>
				<div>Shape:</div>
				<select
					style={{...this.getInputStyle(), width: width}}
					onChange={(event: any) => {
                        this.updateWidget(event, event.target.value);
					}}
					defaultValue={this.getMainWidget().getText()["shape"]}
				>
					<option value="round">Round</option>
					<option value="square">Square</option>
				</select>
			</form>
		);
	};

	updateWidget = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        event.preventDefault();
        
		const oldVal = this.getText()["shape"];
		if (propertyValue === oldVal) {
			return;
		} else {
			this.getText()["shape"] = propertyValue;
		}

		const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
		history.registerAction();

		g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
		g_widgets1.addToForceUpdateWidgets("GroupSelection2");

		g_flushWidgets();
	};
}
