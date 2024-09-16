import * as React from "react";
import { BaseWidgetSidebar } from "../../widgets/BaseWidget/BaseWidgetSidebar";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { SidebarComponent } from "./SidebarComponent";
import * as GlobalMethods from "../../global/GlobalMethods";

/**
 * Represents the X component in sidebar. <br>
 *
 * It provides: (1) the JSX element, (2) the method to udpate the widget from sidebar, and (3) the method to
 * update this sidebar component from widget.
 */
export class SidebarSlideButtonBoxRatio extends SidebarComponent {
	constructor(sidebar: BaseWidgetSidebar) {
		super(sidebar);
	}

	_Element = () => {
		const [boxRatio, setBoxRatio] = React.useState<number>(parseInt(this.getText()["boxRatio"]));

		return (
			<form onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.updateWidget(event, boxRatio)} style={this.getFormStyle()}>
				<div>Ratio</div>
				<input
					// the same with as dropdown menu in SidebarLineStyle, which is an <input /> element with 70% width
					style={{ ...this.getInputStyle() }}
					type="number"
					name="boxRatio"
					value={boxRatio}
					onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
						const newVal = event.target.value;
						setBoxRatio(parseInt(newVal));
					}}
					// must use enter to change the value
					onBlur={(event: any) => {
						if (parseInt(this.getText()["boxRatio"]) !== boxRatio) {
							setBoxRatio(parseInt(this.getText()["boxRatio"]));
						}
					}}
				/>
			</form>
		);
	};

	updateWidget = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
		event.preventDefault();

		const oldVal = this.getText()["boxRatio"];
		if (propertyValue === oldVal) {
			return;
		} else {
            this.getText()["boxRatio"] = Math.max(propertyValue as number, 2);
		}

		const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
		history.registerAction();

		g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
		g_widgets1.addToForceUpdateWidgets("GroupSelection2");

		g_flushWidgets();
	};
}
