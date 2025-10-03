import * as React from "react";
import { BaseWidgetSidebar } from "../../widgets/BaseWidget/BaseWidgetSidebar";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { SidebarComponent } from "./SidebarComponent";
import * as GlobalMethods from "../../global/GlobalMethods";
import { FontsData } from "../../global/FontsData";

/**
 * Represents the X component in sidebar. <br>
 *
 * It provides: (1) the JSX element, (2) the method to udpate the widget from sidebar, and (3) the method to
 * update this sidebar component from widget.
 */
export class SidebarEmbeddedDisplayResize extends SidebarComponent {
	constructor(sidebar: BaseWidgetSidebar) {
		super(sidebar);
	}

	_Element = ({hideText}: any) => {
        const [resize, setResize] = React.useState(this.getText()["resize"]);

		return (
			<form style={{ ...this.getFormStyle(), transition: "all .1s ease-in", width: "100%" }}>
                {hideText === true ? null : <div>Match:</div>}
				<select
					style={{...this.getInputStyle(), fontFamily: "inherit"}}
					onChange={(event: any) => {
                        setResize(event.target.value);
						this.updateWidget(event, event.target.value);
					}}
                    value={resize}
				>
                    <option value="none">None</option>
                    <option value="fit">Fit content into widget</option>
                    <option value="crop">Crop content</option>
				</select>
			</form>
		);
	};

	updateWidget = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
		event.preventDefault();

		const oldVal = this.getText()["resize"];
		if (propertyValue === oldVal) {
			return;
		} else {
			this.getText()["resize"] = propertyValue;
		}

		const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
		history.registerAction();

		g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
		g_widgets1.addToForceUpdateWidgets("GroupSelection2");

		g_flushWidgets();
	};
}
