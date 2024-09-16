import { SidebarComponent } from "./SidebarComponent";
import * as React from "react";
import { ChoiceButton } from "../../widgets/ChoiceButton/ChoiceButton";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../Root/Root";
import { SidebarChoiceButtonItem } from "./SidebarChoiceButtonItem";
import { BaseWidgetSidebar } from "../../widgets/BaseWidget/BaseWidgetSidebar";
import { ElementButton } from "../SharedElements/MacrosTable";

export class SidebarChoiceButtonItems extends SidebarComponent {
	_members: SidebarChoiceButtonItem[] = [];
	_forceUpdate: any;

	constructor(sidebar: BaseWidgetSidebar) {
		super(sidebar);
		const mainWidget = this.getMainWidget() as ChoiceButton;
		for (let ii = 0; ii < mainWidget.getItemLabels().length; ii++) {
			this._members.push(new SidebarChoiceButtonItem(this, ii));
		}
	}

	_Element = () => {
		const [, forceUpdate] = React.useState({});

		this._forceUpdate = () => {
			forceUpdate({});
		};

		return (
			<>
				<this._BlockTitle>
					<div
						style={{
							display: "inline-flex",
							flexDirection: "row",
							justifyContent: "space-between",
                            width: "100%"
						}}
					>
						<b>Items {`(${this.getMembers().length})`}</b>


						<ElementButton
							onClick={(event: any) => {
                                this.updateWidgetAppendItem(event);
							}}
						>
							<img
								src={`../../../webpack/resources/webpages/add-symbol.svg`}
								style={{
									width: "60%",
									height: "60%",
								}}
							></img>
						</ElementButton>

					</div>
				</this._BlockTitle>
				<this._BlockBody>
					<div
						style={{
							display: "inline-flex",
							flexDirection: "column",
							position: "relative",
						}}
					>
						{this.getMembers().map((member: SidebarChoiceButtonItem, index: number) => {
							return member.getElement();
						})}
					</div>
				</this._BlockBody>
			</>
		);
	};

    _BlockTitle = this.getSidebar()._BlockTitle;
    _BlockBody = this.getSidebar()._BlockBody;

	updateWidgetAppendItem = (event: any) => {
		if (event) {
			event.preventDefault();
		}
		const mainWidget = this.getMainWidget() as ChoiceButton;

		const newIndex = mainWidget.getItemLabels().length;
		mainWidget.getItemLabels().push(`Label ${newIndex}`);
		mainWidget.getItemValues().push(newIndex);
		this.getMembers().push(new SidebarChoiceButtonItem(this, newIndex));

		this._forceUpdate();

		const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
		history.registerAction();

		g_widgets1.addToForceUpdateWidgets(mainWidget.getWidgetKey());
		g_widgets1.addToForceUpdateWidgets("GroupSelection2");

		g_flushWidgets();
	};

	// no need to update widget from this sidebar component
	updateWidget = (event: any, propertyValue: string | number | boolean | number[] | string[] | undefined) => {};

	getMembers = () => {
		return this._members;
	};
}
