import * as React from "react";
import { BaseWidgetSidebar } from "../../widgets/BaseWidget/BaseWidgetSidebar";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { SidebarComponent } from "./SidebarComponent";
import { PvTable } from "../../widgets/PvTable/PvTable";

/**
 * Represents the channel names component in sidebar. <br>
 * 
 * It is different from the SidebarChannelName. This one accepts multiple PV names, separated by commas.
 *
 * It provides: (1) the JSX element, (2) the method to udpate the widget from sidebar, and (3) the method to
 * update this sidebar component from widget.
 */
export class SidebarChannelNames extends SidebarComponent {
	constructor(sidebar: BaseWidgetSidebar) {
		super(sidebar);
	}

	_Element = () => {
		const mainWidget = this.getMainWidget();
		const [channelNamesStr, setChannelNamesStr] = React.useState<string>(
			// `${mainWidget instanceof PvTable ? mainWidget.getChannelNamesRefined() : ""}`
			`${(mainWidget as PvTable).getChannelNamesLevel0()}`
		);

		return (
			<form
				spellCheck={false}
				onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.updateWidget(event, channelNamesStr)}
				style={this.getFormStyle()}
			>
				<div>Name:</div>
				<input
					style={{ ...this.getInputStyle() }}
					type="text"
					name="channelName"
					value={channelNamesStr}
					onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
						const newVal = event.target.value;
						setChannelNamesStr(newVal);
					}}
					// must use enter to change the value
					onBlur={(event: any) => {
						const mainWidget = this.getMainWidget();
						// if (mainWidget instanceof PvTable) {
						const orig = `${(mainWidget as PvTable).getChannelNamesLevel0()}`;
						if (orig !== channelNamesStr) {
							setChannelNamesStr(orig);
						}
						// }
					}}
				/>
			</form>
		);
	};

	updateWidget = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
		event.preventDefault();
		const mainWidget = this.getMainWidget() as PvTable;

		const newVal = propertyValue as string;
		const newVals = newVal.split(",");
		const newChannelNames: string[] = [];
		for (let channelName of newVals) {
			if (channelName.trim() !== "" && !channelName.includes(".")) {
				newChannelNames.push(channelName.trim());
			}
		}
		mainWidget.setChannelNamesLevel0(newChannelNames);
        mainWidget.processChannelNames();
		// mainWidget.setUnprocessedChannelNames(newChannelNames);
        // mainWidget.setExpanedBaseChannelNames();
        // mainWidget.expandAndExtractChannelNames();

		const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
		history.registerAction();

		g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
		g_widgets1.addToForceUpdateWidgets("GroupSelection2");

		g_flushWidgets();
	};
}
