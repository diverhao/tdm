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
export class SidebarNumberScale extends SidebarComponent {
	constructor(sidebar: BaseWidgetSidebar) {
        super(sidebar);
	}

	_Element = () => {
		const [scale, setScale] = React.useState<number>(parseInt(this.getText()["scale"]));

		this._updateFromWidget = (propertyValue: number) => {
			setScale(propertyValue);
		};

		return (
			<form
				onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.updateWidget(event, scale)}
				style={this.getFormStyle()}
			>
				<div>Scale:</div>
				<input
					style={{...this.getInputStyle(), width: "66%"}}
					type="number"
					name="left"
                    min={0}
					value={scale}
					onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
						const newVal = event.target.value;
						setScale(parseInt(newVal));
					}}
					// must use enter to change the value
					onBlur={(event: any) => {
						if (parseInt(this.getText()["scale"]) !== scale) {
							setScale(parseInt(this.getText()["scale"]));
						}
					}}
				/>
			</form>
		);
	};

	updateWidget = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
		event.preventDefault();

		const oldVal = this.getText()["scale"];
		if (propertyValue === oldVal) {
			return;
		}
        else {
            this.getText()["scale"] = propertyValue;
        }

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

		g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
		g_widgets1.addToForceUpdateWidgets("GroupSelection2");

		g_flushWidgets();
	};
}
