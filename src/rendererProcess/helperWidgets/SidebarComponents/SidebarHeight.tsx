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
export class SidebarHeight extends SidebarComponent {
	constructor(sidebar: BaseWidgetSidebar) {
        super(sidebar);
	}

	_Element = () => {
		const [height, setHeight] = React.useState<number>(parseInt(this.getStyle().height));

		this._updateFromWidget = (propertyValue: number) => {
			setHeight(propertyValue);
		};

		return (
			<form
				onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.updateWidget(event, height)}
				style={this.getFormStyle()}
			>
				<div>Height:</div>
				<input
					style={this.getInputStyle()}
					type="number"
					name="height"
					value={height}
					onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
						const newVal = event.target.value;
						setHeight(parseInt(newVal));
					}}
					// must use enter to change the value
					onBlur={(event: any) => {
						if (parseInt(this.getStyle().height) !== height) {
							setHeight(parseInt(this.getStyle().height));
						}
					}}
				/>
			</form>
		);
	};

	updateWidget = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
		event.preventDefault();

		const oldVal = this.getStyle()["height"];
		if (propertyValue === oldVal) {
			return;
		}
        else {
            this.getStyle()["height"] = propertyValue;
        }

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

		g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
		g_widgets1.addToForceUpdateWidgets("GroupSelection2");

		g_flushWidgets();
	};
}
