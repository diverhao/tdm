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
export class SidebarAlarmFill extends SidebarComponent {
	constructor(sidebar: BaseWidgetSidebar) {
		super(sidebar);
	}

	_Element = () => {
        let tmp = false;
        if (this.getMainWidget().getText().alarmFill !== undefined) {
            tmp = this.getMainWidget().getText().alarmFill;
        }
		const [alarmFill, setAlarmFill] = React.useState<boolean>(tmp);

		return (
			<form onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.updateWidget(event, alarmFill)} style={this.getFormStyle()}>
				<div>Alarm fill:</div>
				<input
					type="checkbox"
					checked={alarmFill}
					onChange={(event: any) => {
						this.updateWidget(event, !alarmFill);
						setAlarmFill((prevVal: boolean) => {
							return !prevVal;
						});
					}}
				/>
			</form>
		);
	};

	updateWidget = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        // do not preventDefault()

		const oldVal = this.getText()["alarmFill"];
		if (propertyValue === oldVal) {
			return;
		} else {
			this.getText()["alarmFill"] = propertyValue;
		}

		const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
		history.registerAction();

		g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
		g_widgets1.addToForceUpdateWidgets("GroupSelection2");

		g_flushWidgets();
	};
}
