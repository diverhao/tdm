// import { SidebarLEDMultiStateItems } from "./SidebarLEDMultiStateItems";
import { SidebarGroupItems } from "./SidebarGroupItems";
import * as React from "react";
import { Group } from "../../widgets/Group/Group";
// import { LED } from "../../widgets/LED/LED";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../Root/Root";
import { Collapsible } from "../ColorPicker/Collapsible";
import * as GlobalMethods from "../../global/GlobalMethods";
import { ElementButton } from "../SharedElements/MacrosTable";

export class SidebarGroupItem {
	_items: SidebarGroupItems;
	_index: number;
	StyledButton = ElementButton;
	_BlockBody: any;
	constructor(items: SidebarGroupItems, index: number) {
		this._items = items;
		this._index = index;
		// this.StyledButton = this.getItems().StyledButton;
		this._BlockBody = this.getItems()._BlockBody;
	}

	getMainWidget = () => {
		return this.getItems().getMainWidget() as Group;
	};

	_Element = () => {
		const mainWidget = this.getMainWidget();
		const [itemName, setItemName] = React.useState(mainWidget.getItemNames()[this.getIndex()]);

		return (
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
					<b>{`# ${this.getIndex()}`}</b>
					<div>
						{/* <this.StyledButton
							onClick={(event: any) => {
								this.updateWidgetMoveUpItem(event);
							}}
						>
							&#11105;{" "}
						</this.StyledButton>
						<this.StyledButton
							onClick={(event: any) => {
								this.updateWidgetMoveDownItem(event);
							}}
						>
							&#11107;{" "}
						</this.StyledButton> */}
						{mainWidget.getSelectedGroup() === this.getIndex() ? (
							<this.StyledButton
								onClick={(event: any) => {
									this.updateWidgetRemoveItem(event);
								}}
							>
								<img
									src={`../../../webpack/resources/webpages/delete-symbol.svg`}
									style={{
										width: "50%",
										height: "50%",
									}}
								></img>
							</this.StyledButton>
						) : null}
					</div>
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
					<form
						onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
							this.updateWidgetName(event, itemName);
						}}
						style={{ ...this.getFormStyle() }}
					>
						<div>Name:</div>
						<input
							style={{ ...this.getInputStyle(), color: mainWidget.getText()["useChannelItems"] ? "rgba(175, 175, 175, 1)" : "inherit" }}
							type="string"
							name="item-name"
							value={itemName}
							readOnly={mainWidget.getText()["useChannelItems"] === true ? true : false}
							onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
								const newVal = event.target.value;
								setItemName(newVal);
							}}
							// must use enter to change the value
							onBlur={(event: any) => {
								const orig = mainWidget.getItemNames()[this.getIndex()];
								if (orig !== itemName) {
									setItemName(orig);
								}
							}}
						/>
					</form>
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
						rgbColorStr={`${mainWidget.getItemBackgroundColors()[this.getIndex()]}`}
						updateFromSidebar={(
							event: any,
							propertyName: string,
							propertyValue: number | string | number[] | string[] | boolean | undefined
						) => {
							this.updateWidgetBackgroundColor(event, propertyValue);
						}}
						title={"Color"}
						eventName={"item-color"}
					/>
				</div>
			</this._BlockBody>
		);
	};
	updateWidgetName = (event: any, propertyValue: string | number | boolean | number[] | string[] | undefined) => {
		if (event) {
			event.preventDefault();
		}

		const mainWidget = this.getMainWidget();
		const oldVal = mainWidget.getItemNames()[this.getIndex()];
		if (propertyValue === oldVal) {
			return;
		} else {
			mainWidget.getItemNames()[this.getIndex()] = `${propertyValue}`;
		}

		const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
		history.registerAction();

		g_widgets1.addToForceUpdateWidgets(mainWidget.getWidgetKey());
		g_widgets1.addToForceUpdateWidgets("GroupSelection2");

		g_flushWidgets();
	};

	updateWidgetBackgroundColor = (event: any, propertyValue: string | number | boolean | number[] | string[] | undefined) => {
		if (event) {
			event.preventDefault();
		}

		const mainWidget = this.getMainWidget();
		const newVal = GlobalMethods.rgbaArrayToRgbaStr(propertyValue as number[]);
		const oldVal = `${mainWidget.getItemBackgroundColors()[this.getIndex()]}`;
		if (newVal === oldVal) {
			return;
		} else {
			mainWidget.getItemBackgroundColors()[this.getIndex()] = newVal;
		}

		const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
		history.registerAction();

		g_widgets1.addToForceUpdateWidgets(mainWidget.getWidgetKey());
		g_widgets1.addToForceUpdateWidgets("GroupSelection2");

		g_flushWidgets();
	};

	// maybe enable them

	// updateWidgetMoveUpItem = (event: any) => {
	// 	if (event) {
	// 		event.preventDefault();
	// 	}
	// 	const mainWidget = this.getMainWidget();

	// 	if (this.getIndex() === 0) {
	// 		return;
	// 	}

	// 	const thisIndex = this.getIndex();

	// 	const itemName = mainWidget.getItemNames()[thisIndex];
	// 	mainWidget.getItemNames().splice(thisIndex, 1);
	// 	mainWidget.getItemNames().splice(thisIndex - 1, 0, itemName);

	// 	const itemBackgroundColor = mainWidget.getItemBackgroundColors()[thisIndex];
	// 	mainWidget.getItemBackgroundColors().splice(thisIndex, 1);
	// 	mainWidget.getItemBackgroundColors().splice(thisIndex - 1, 0, itemBackgroundColor);

	// 	const itemWidgetKeys = mainWidget.getWidgetKeys()[thisIndex];
	// 	mainWidget.getWidgetKeys().splice(thisIndex, 1);
	// 	mainWidget.getWidgetKeys().splice(thisIndex - 1, 0, itemWidgetKeys);

	// 	mainWidget.updateGroup(thisIndex);
	// 	mainWidget.selectGroup(thisIndex, true);
	// 	mainWidget.updateGroup(thisIndex - 1);
	// 	mainWidget.selectGroup(thisIndex - 1, true);

	// 	const member = this.getItems().getMembers()[thisIndex];
	// 	const member2 = this.getItems().getMembers()[thisIndex - 1];

	// 	member.setIndex(thisIndex - 1);
	// 	member2.setIndex(thisIndex);

	// 	this.getItems().getMembers().splice(thisIndex, 1);
	// 	this.getItems()
	// 		.getMembers()
	// 		.splice(thisIndex - 1, 0, member);

	// 	this.getItems()._forceUpdate();

	// 	const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
	// 	history.registerAction();

	// 	g_widgets1.addToForceUpdateWidgets(mainWidget.getWidgetKey());
	// 	g_widgets1.addToForceUpdateWidgets("GroupSelection2");

	// 	g_flushWidgets();
	// };

	// updateWidgetMoveDownItem = (event: any) => {
	// 	if (event) {
	// 		event.preventDefault();
	// 	}
	// 	const mainWidget = this.getMainWidget();

	// 	if (this.getIndex() >= mainWidget.getItemNames().length - 1) {
	// 		return;
	// 	}

	// 	const thisIndex = this.getIndex();

	// 	const itemName = mainWidget.getItemNames()[thisIndex];
	// 	mainWidget.getItemNames().splice(thisIndex, 1);
	// 	mainWidget.getItemNames().splice(thisIndex + 1, 0, itemName);

	// 	const itemBackgroundColor = mainWidget.getItemBackgroundColors()[thisIndex];
	// 	mainWidget.getItemBackgroundColors().splice(thisIndex, 1);
	// 	mainWidget.getItemBackgroundColors().splice(thisIndex + 1, 0, itemBackgroundColor);

	// 	const itemWidgetKeys = mainWidget.getWidgetKeys()[thisIndex];
	// 	mainWidget.getWidgetKeys().splice(thisIndex, 1);
	// 	mainWidget.getWidgetKeys().splice(thisIndex + 1, 0, itemWidgetKeys);

	// 	mainWidget.updateGroup(thisIndex);
	// 	mainWidget.selectGroup(thisIndex, true);

	// 	mainWidget.updateGroup(thisIndex + 1);
	// 	mainWidget.selectGroup(thisIndex + 1, true);

	// 	const member = this.getItems().getMembers()[thisIndex];
	// 	const member2 = this.getItems().getMembers()[thisIndex + 1];

	// 	member.setIndex(thisIndex + 1);
	// 	member2.setIndex(thisIndex);

	// 	this.getItems().getMembers().splice(thisIndex, 1);
	// 	this.getItems()
	// 		.getMembers()
	// 		.splice(thisIndex + 1, 0, member);

	// 	this.getItems()._forceUpdate();

	// 	const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
	// 	history.registerAction();

	// 	g_widgets1.addToForceUpdateWidgets(mainWidget.getWidgetKey());
	// 	g_widgets1.addToForceUpdateWidgets("GroupSelection2");

	// 	g_flushWidgets();
	// };

	updateWidgetRemoveItem = (event: any) => {
		if (event) {
			event.preventDefault();
		}
		const mainWidget = this.getMainWidget();
		if (mainWidget.getItemNames().length <= 1 && mainWidget.getWidgetKey().includes("Group")) {
			return;
		}

		// console.log("==++++>", mainWidget.getItemBackgroundColors(), mainWidget.getWidgetKeys(), mainWidget.getAllWidgetKeys())
		const thisIndex = this.getIndex();

		mainWidget.getItemNames().splice(thisIndex, 1);

		mainWidget.getItemBackgroundColors().splice(thisIndex, 1);

		// remove all widgets
		for (let widgetKey of mainWidget.getWidgetKeys()[thisIndex]) {
			g_widgets1.removeWidget(widgetKey, true, false);
		}
		g_widgets1.updateSidebar(false);

		mainWidget.getWidgetKeys().splice(thisIndex, 1);

		this.getItems().getMembers().splice(thisIndex, 1);
		for (let ii = thisIndex; ii < mainWidget.getItemNames().length; ii++) {
			const item = this.getItems().getMembers()[ii];
			item.setIndex(ii);
		}

		this.getItems()._forceUpdate();

		// focus to new Group tab
		const newIndex = Math.max(thisIndex - 1, 0);
		mainWidget.updateGroup(newIndex);
		mainWidget.selectGroup(newIndex, true);

		const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
		history.registerAction();

		g_widgets1.addToForceUpdateWidgets(mainWidget.getWidgetKey());
		g_widgets1.addToForceUpdateWidgets("GroupSelection2");

		g_flushWidgets();

		// console.log("===>", mainWidget.getItemBackgroundColors(), mainWidget.getWidgetKeys(), mainWidget.getAllWidgetKeys())
	};

	// --------------------------- getters -----------------------------

	getElement = () => {
		const mainWidget = this.getMainWidget();
		return <this._Element key={`${mainWidget.getItemNames()[this.getIndex()]}-${this.getIndex()}`}></this._Element>;
	};

	getIndex = () => {
		return this._index;
	};

	getItems = () => {
		return this._items;
	};

	setIndex = (newIndex: number) => {
		this._index = newIndex;
	};

	getFormStyle = () => {
		return this.getItems().getFormStyle();
	};
	getInputStyle = () => {
		return this.getItems().getInputStyle();
	};
}
