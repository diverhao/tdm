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
export class SidebarPvMonitorMaxLineNum extends SidebarComponent {
	constructor(sidebar: BaseWidgetSidebar) {
		super(sidebar);
	}

	_Element = () => {
		const [maxLineNum, setMaxLineNum] = React.useState<number>(parseFloat(this.getText()["maxLineNum"]));

		return (
			<form onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.updateWidget(event, maxLineNum)} style={this.getFormStyle()}>
				<div>Max. Lines:</div>
				<input
					// the same with as dropdown menu in SidebarLineStyle, which is an <input /> element with 70% width
					style={{ ...this.getInputStyle(), width: "65.6%", color: this.getText()["usePvLimits"]? "rgba(150, 150, 150, 1)": "black" }}
					type="number"
					name="maxLineNum"
					value={maxLineNum}
                    step="any"
					onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
						const newVal = event.target.value;
						setMaxLineNum(parseFloat(newVal));
					}}
					readOnly={this.getText()["usePvLimits"] ? true : false}
					// must use enter to change the value
					onBlur={(event: any) => {
						if (parseFloat(this.getText()["maxLineNum"]) !== maxLineNum) {
							setMaxLineNum(parseFloat(this.getText()["maxLineNum"]));
						}
					}}
				/>
			</form>
		);
	};

	updateWidget = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
		event.preventDefault();

		const oldVal = this.getText()["maxLineNum"];
		if (propertyValue === oldVal) {
			return;
		} else {
			this.getText()["maxLineNum"] = propertyValue;
		}

		const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
		history.registerAction();

		g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
		g_widgets1.addToForceUpdateWidgets("GroupSelection2");

		g_flushWidgets();
	};
}
