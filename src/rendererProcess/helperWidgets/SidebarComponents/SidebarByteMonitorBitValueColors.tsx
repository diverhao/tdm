import { SidebarComponent } from "./SidebarComponent";
import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../Root/Root";
import { BaseWidgetSidebar } from "../../widgets/BaseWidget/BaseWidgetSidebar";
import { ByteMonitor } from "../../widgets/ByteMonitor/ByteMonitor";
import { Collapsible } from "../ColorPicker/Collapsible";
import * as GlobalMethods from "../../../common/GlobalMethods";

export class SidebarByteMonitorBitValueColors extends SidebarComponent {
	// _members: SidebarByteMonitorBitValueColor[] = [];
	_forceUpdate: any;

	constructor(sidebar: BaseWidgetSidebar) {
		super(sidebar);
		// const mainWidget = this.getMainWidget() as ByteMonitor;
		// for (let ii = 0; ii < 2; ii++) {
		// this._members.push(new SidebarByteMonitorBitValueColor(this, ii));
		// }
	}

	_Element = () => {
        const mainWidget = this.getMainWidget() as ByteMonitor;
		const [, forceUpdate] = React.useState({});

		this._forceUpdate = () => {
			forceUpdate({});
		};

		return (
			<>
				{/* <this._BlockTitle>
					<div
						style={{
							display: "inline-flex",
							flexDirection: "row",
							justifyContent: "space-between",
							width: "100%",
						}}
					>
						<b>Bit Value Colors</b>
					</div>
				</this._BlockTitle> */}
				<this._BlockBody>
					<div
						style={{
							display: "inline-flex",
							flexDirection: "row",
							width: "100%",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<Collapsible
							rgbColorStr={`${mainWidget.getItemColors()[0]}`}
							updateFromSidebar={(
								event: any,
								propertyName: string,
								propertyValue: number | string | number[] | string[] | boolean | undefined
							) => {
								this.updateWidgetColor(event, propertyValue, 0);
							}}
							title={`Value 0 Color`}
							eventName={"value-0-color"}
						/>
					</div>
					<div
						style={{
							display: "inline-flex",
							flexDirection: "row",
							width: "100%",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<Collapsible
							rgbColorStr={`${mainWidget.getItemColors()[1]}`}
							updateFromSidebar={(
								event: any,
								propertyName: string,
								propertyValue: number | string | number[] | string[] | boolean | undefined
							) => {
								this.updateWidgetColor(event, propertyValue, 1);
							}}
							title={`Value 1 Color`}
							eventName={"value-1-color"}
						/>
					</div>
				</this._BlockBody>
			</>
		);
	};


	updateWidgetColor = (event: any, propertyValue: string | number | boolean | number[] | string[] | undefined, index: number) => {
		if (event) {
			event.preventDefault();
		}

		const mainWidget = this.getMainWidget() as ByteMonitor;
		const newVal = GlobalMethods.rgbaArrayToRgbaStr(propertyValue as number[]);
		const oldVal = `${mainWidget.getItemColors()[index]}`;
		if (newVal === oldVal) {
			return;
		} else {
			mainWidget.getItemColors()[index] = newVal;
		}

		const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
		history.registerAction();

		g_widgets1.addToForceUpdateWidgets(mainWidget.getWidgetKey());
		g_widgets1.addToForceUpdateWidgets("GroupSelection2");

		g_flushWidgets();
	};

	_BlockTitle = this.getSidebar()._BlockTitle;
	_BlockBody = this.getSidebar()._BlockBody;

	// no need to update widget from this sidebar component
	updateWidget = (event: any, propertyValue: string | number | boolean | number[] | string[] | undefined) => {};

}
