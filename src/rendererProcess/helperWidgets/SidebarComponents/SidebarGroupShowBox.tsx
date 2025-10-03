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
export class SidebarGroupShowBox extends SidebarComponent {
	constructor(sidebar: BaseWidgetSidebar) {
		super(sidebar);
	}

	_Element = () => {
		const [showBox, setShowBox] = React.useState<boolean>(this.getMainWidget().getText()["showBox"]);

		return (
			<this._BlockBody>
				<form onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.updateWidget(event, showBox)} style={this.getFormStyle()}>
					<div>Show Box:</div>
					<input
						type="checkbox"
						checked={showBox}
						onChange={(event: any) => {
							this.updateWidget(event, !showBox);
							setShowBox((prevVal: boolean) => {
								return !prevVal;
							});
						}}
					/>
				</form>
			</this._BlockBody>
		);
	};

	updateWidget = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
		// do not preventDefault()

		const oldVal = this.getText()["showBox"];
		if (propertyValue === oldVal) {
			return;
		} else {
			this.getText()["showBox"] = propertyValue;
		}

		const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
		history.registerAction();

		g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
		g_widgets1.addToForceUpdateWidgets("GroupSelection2");

		g_flushWidgets();
	};
}
