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
export class SidebarUsePvLimits extends SidebarComponent {
	constructor(sidebar: BaseWidgetSidebar) {
		super(sidebar);
	}

	_Element = () => {
		const [usePvLimits, setUsePvLimits] = React.useState<boolean>(this.getMainWidget().getText()["usePvLimits"]);

		return (
			<form onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.updateWidget(event, usePvLimits)} style={this.getFormStyle()}>
				<div>Use PV Limits:</div>
				<input
					type="checkbox"
					checked={usePvLimits}
					onChange={(event: any) => {
						this.updateWidget(event, !usePvLimits);
						setUsePvLimits((prevVal: boolean) => {
							return !prevVal;
						});
					}}
				/>
			</form>
		);
	};

	updateWidget = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        // do not preventDefault()

		const oldVal = this.getText()["usePvLimits"];
		if (propertyValue === oldVal) {
			return;
		} else {
			this.getText()["usePvLimits"] = propertyValue;
		}

		const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
		history.registerAction();

		g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
		g_widgets1.addToForceUpdateWidgets("GroupSelection2");

		g_flushWidgets();
	};
}
