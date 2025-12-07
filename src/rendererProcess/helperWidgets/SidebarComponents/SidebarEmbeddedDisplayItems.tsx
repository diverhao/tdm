import { SidebarComponent } from "./SidebarComponent";
import * as React from "react";
// import { ChoiceButtonSidebar } from "../../widgets/ChoiceButton/ChoiceButtonSidebar";
// import { LEDSidebar } from "../../widgets/LED/LEDSidebar";
import { EmbeddedDisplay } from "../../widgets/EmbeddedDisplay/EmbeddedDisplay";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../Root/Root";
import { SidebarEmbeddedDisplayItem } from "./SidebarEmbeddedDisplayItem";
import { BaseWidgetSidebar } from "../../widgets/BaseWidget/BaseWidgetSidebar";
import path from "path";
import { ElementButton } from "../SharedElements/MacrosTable";
import { EmbeddedDisplaySidebar } from "../../widgets/EmbeddedDisplay/EmbeddedDisplaySidebar";

export class SidebarEmbeddedDisplayItems extends SidebarComponent {
	_members: SidebarEmbeddedDisplayItem[] = [];
	_forceUpdate: any;

	constructor(sidebar: BaseWidgetSidebar) {
		super(sidebar);
		const mainWidget = this.getMainWidget() as EmbeddedDisplay;
		for (let ii = 0; ii < mainWidget.getTdlFileNames().length; ii++) {
			this._members.push(new SidebarEmbeddedDisplayItem(this, ii));
		}
	}

	_Element = () => {
		const [, forceUpdate] = React.useState({});

		this._forceUpdate = () => {
			forceUpdate({});
		};

        this._updateFromWidget = (propertyValue: string) => {
            const sidebar = this.getSidebar() as EmbeddedDisplaySidebar;
            const beingUpdatedItemIndex = sidebar.beingUpdatedItemIndex;
            const member = this.getMembers()[beingUpdatedItemIndex];
            if (member !== undefined && member instanceof SidebarEmbeddedDisplayItem) {
                member._updateFromWidget(propertyValue);
            }
        }

		return (
			<>
				<this._BlockTitle>
					<div
						style={{
							display: "inline-flex",
							flexDirection: "row",
							justifyContent: "space-between",
							width: "100%",
						}}
					>
						<b>Displays {`(${this.getMembers().length})`}</b>

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
						<ElementButton
							onClick={(event: any) => {
								this.updateWidgetAppendItem(event, true);
							}}
						>
							<img
								src={`../../../webpack/resources/webpages/add-symbol.svg`}
								style={{
									width: "60%",
									height: "60%",
								}}
							></img>
							<img
								src={`../../../webpack/resources/webpages/web-symbol.svg`}
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
						{this.getMembers().map((member: SidebarEmbeddedDisplayItem, index: number) => {
							return member.getElement();
						})}
					</div>
				</this._BlockBody>
			</>
		);
	};

	_BlockTitle = this.getSidebar()._BlockTitle;
	_BlockBody = this.getSidebar()._BlockBody;

	updateWidgetAppendItem = (event: any, isWebpage: boolean = false) => {
		if (event) {
			event.preventDefault();
		}
		const mainWidget = this.getMainWidget() as EmbeddedDisplay;

		const newIndex = mainWidget.getItemNames().length;
		mainWidget.getItemNames().push(`Display-${newIndex}`);
        // todo
		mainWidget.getItemMacros().push([["A","a"]]);
        // tdl file name or URL
		mainWidget.getTdlFileNames().push(isWebpage? path.join("../../../webpack/resources/tdls/blank.html"):  mainWidget.getDefaultTdlFileName());

        mainWidget.getItemIsWebpage().push(isWebpage);

        this.getMembers().push(new SidebarEmbeddedDisplayItem(this, newIndex));

        // mainWidget.addEmbeddedDisplay(newIndex, isWebpage);
        mainWidget.selectTab(newIndex);

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
