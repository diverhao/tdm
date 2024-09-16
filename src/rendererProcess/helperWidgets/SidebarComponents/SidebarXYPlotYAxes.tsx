import * as React from "react";
import { BaseWidgetSidebar } from "../../widgets/BaseWidget/BaseWidgetSidebar";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { SidebarComponent } from "./SidebarComponent";
import { PvTable } from "../../widgets/PvTable/PvTable";
import { XYPlot } from "../../widgets/XYPlot/XYPlot";
import { type_yAxis } from "../../widgets/XYPlot/XYPlotPlot";
import { SidebarXYPlotYAxis } from "./SidebarXYPlotYAxis";

/**
 * Represents the channel names component in sidebar. <br>
 *
 * It is different from the SidebarChannelName. This one accepts multiple PV names, separated by commas.
 *
 * It provides: (1) the JSX element, (2) the method to udpate the widget from sidebar, and (3) the method to
 * update this sidebar component from widget.
 */
export class SidebarXYPlotYAxes extends SidebarComponent {
	yAxes: SidebarXYPlotYAxis[] = [];

	constructor(sidebar: BaseWidgetSidebar) {
		super(sidebar);
		const mainWidget = this.getMainWidget() as XYPlot;
		for (let ii = 0; ii < mainWidget.getYAxes().length; ii = ii + 1) {
            // yIndex
			this.yAxes.push(new SidebarXYPlotYAxis(this, ii));
		}
	}

	_Element = () => {
		const mainWidget = this.getMainWidget() as XYPlot;

		return (
			<div style={{
                display: "inline-flex",
                width: "100%",
                flexDirection: "column",
            }}>
				{this.yAxes.map((sidebarXYPlotYAxis: SidebarXYPlotYAxis, yIndex: number) => {
                    const channelName = this.getMainWidget().getChannelNamesLevel0()[2 * yIndex + 1];
					return <sidebarXYPlotYAxis._Element key={`${channelName}-${yIndex}`}></sidebarXYPlotYAxis._Element>;
				})}
			</div>
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
