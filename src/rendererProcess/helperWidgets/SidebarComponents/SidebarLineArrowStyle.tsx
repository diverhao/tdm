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
export class SidebarLineArrowStyle extends SidebarComponent {
	constructor(sidebar: BaseWidgetSidebar) {
		super(sidebar);
	}

	_Element = () => {
		const [showArrowHead, setShowArrowHead] = React.useState<boolean>(this.getMainWidget().getText()["showArrowHead"]);
		const [showArrowTail, setShowArrowTail] = React.useState<boolean>(this.getMainWidget().getText()["showArrowTail"]);
		const [arrowLength, setArrowLength] = React.useState<number>(this.getMainWidget().getText()["arrowLength"]);
		const [arrowWidth, setArrowWidth] = React.useState<number>(this.getMainWidget().getText()["arrowWidth"]);

		return (
			<>
				<this._BlockTitle>
					<b>Arrow</b>
				</this._BlockTitle>
				<this._BlockBody>
					<form
						onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.updateWidgetShowArrowHead(event, showArrowHead)}
						style={this.getFormStyle()}
					>
						<div>Show Arrow Head:</div>
						<input
							type="checkbox"
							checked={showArrowHead}
							onChange={(event: any) => {
								this.updateWidgetShowArrowHead(event, !showArrowHead);
								setShowArrowHead((prevVal: boolean) => {
									return !prevVal;
								});
							}}
						/>
					</form>
					<form
						onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.updateWidgetShowArrowTail(event, showArrowTail)}
						style={this.getFormStyle()}
					>
						<div>Show Arrow Tail:</div>
						<input
							type="checkbox"
							checked={showArrowTail}
							onChange={(event: any) => {
								this.updateWidgetShowArrowTail(event, !showArrowTail);
								setShowArrowTail((prevVal: boolean) => {
									return !prevVal;
								});
							}}
						/>
					</form>
					<form
						onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.updateWidgetArrowLength(event, arrowLength)}
						style={this.getFormStyle()}
					>
						<div>Length:</div>
						<input
							style={{...this.getInputStyle(), width: "65.6%"}}
							type="number"
							name="arrow-length"
							value={arrowLength}
							onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
								const newVal = event.target.value;
								setArrowLength(parseInt(newVal));
							}}
							// must use enter to change the value
							onBlur={(event: any) => {
								if (parseInt(this.getText()["arrowLength"]) !== arrowLength) {
									setArrowLength(parseInt(this.getText()["arrowLength"]));
								}
							}}
						/>
					</form>
					<form
						onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.updateWidgetArrowWidth(event, arrowWidth)}
						style={this.getFormStyle()}
					>
						<div>Width:</div>
						<input
							style={{...this.getInputStyle(), width: "65.6%"}}
							type="number"
							name="arrow-width"
							value={arrowWidth}
							onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
								const newVal = event.target.value;
								setArrowWidth(parseInt(newVal));
							}}
							// must use enter to change the value
							onBlur={(event: any) => {
								if (parseInt(this.getText()["arrowWidth"]) !== arrowWidth) {
									setArrowWidth(parseInt(this.getText()["arrowWidth"]));
								}
							}}
						/>
					</form>
				</this._BlockBody>
				<this._HorizontalLine></this._HorizontalLine>
			</>
		);
	};

	updateWidget = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
		// do not preventDefault()
		// const oldVal = this.getText()["useChannelItems"];
		// if (propertyValue === oldVal) {
		// 	return;
		// } else {
		// 	this.getText()["useChannelItems"] = propertyValue;
		// }
		// const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
		// history.registerAction();
		// g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
		// g_widgets1.addToForceUpdateWidgets("GroupSelection2");
		// g_flushWidgets();
	};

	updateWidgetShowArrowHead = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
		// do not preventDefault()

		const oldVal = this.getText()["showArrowHead"];
		if (propertyValue === oldVal) {
			return;
		} else {
			this.getText()["showArrowHead"] = propertyValue;
		}

		const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
		history.registerAction();

		g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
		g_widgets1.addToForceUpdateWidgets("GroupSelection2");

		g_flushWidgets();
	};

	updateWidgetShowArrowTail = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
		// do not preventDefault()

		const oldVal = this.getText()["showArrowTail"];
		if (propertyValue === oldVal) {
			return;
		} else {
			this.getText()["showArrowTail"] = propertyValue;
		}

		const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
		history.registerAction();

		g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
		g_widgets1.addToForceUpdateWidgets("GroupSelection2");

		g_flushWidgets();
	};

	updateWidgetArrowLength = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
		event.preventDefault();

		const oldVal = this.getText()["arrowLength"];
		if (propertyValue === oldVal) {
			return;
		} else {
			this.getText()["arrowLength"] = propertyValue;
		}

		const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
		history.registerAction();

		g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
		g_widgets1.addToForceUpdateWidgets("GroupSelection2");

		g_flushWidgets();
	};

	updateWidgetArrowWidth = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
		event.preventDefault();

		const oldVal = this.getText()["arrowWidth"];
		if (propertyValue === oldVal) {
			return;
		} else {
			this.getText()["arrowWidth"] = propertyValue;
		}

		const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
		history.registerAction();

		g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
		g_widgets1.addToForceUpdateWidgets("GroupSelection2");

		g_flushWidgets();
	};
}
