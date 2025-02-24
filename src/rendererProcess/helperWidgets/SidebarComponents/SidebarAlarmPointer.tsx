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
export class SidebarAlarmPointer extends SidebarComponent {
	constructor(sidebar: BaseWidgetSidebar) {
		super(sidebar);
	}

	_Element = () => {
        let tmp = false;
        if (this.getMainWidget().getText().alarmPointer !== undefined) {
            tmp = this.getMainWidget().getText().alarmPointer;
        }
		const [alarmPointer, setalarmPointer] = React.useState<boolean>(tmp);

		return (
			<form onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.updateWidget(event, alarmPointer)} style={this.getFormStyle()}>
				<div>Alarm pointer:</div>
				<input
					type="checkbox"
					checked={alarmPointer}
					onChange={(event: any) => {
						this.updateWidget(event, !alarmPointer);
						setalarmPointer((prevVal: boolean) => {
							return !prevVal;
						});
					}}
				/>
			</form>
		);
	};

	updateWidget = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        // do not preventDefault()

		const oldVal = this.getText()["alarmPointer"];
		if (propertyValue === oldVal) {
			return;
		} else {
			this.getText()["alarmPointer"] = propertyValue;
		}

		const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
		history.registerAction();

		g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
		g_widgets1.addToForceUpdateWidgets("GroupSelection2");

		g_flushWidgets();
	};
}
