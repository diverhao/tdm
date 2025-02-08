import { SidebarLEDItems } from "./SidebarLEDItems";
import * as React from "react";
import { LED } from "../../widgets/LED/LED";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../Root/Root";
import { Collapsible } from "../ColorPicker/Collapsible";
import * as GlobalMethods from "../../global/GlobalMethods";
import {Log} from "../../../mainProcess/log/Log";
import { ElementButton } from "../SharedElements/MacrosTable";

export class SidebarLEDItem {
	_items: SidebarLEDItems;
	_index: number;
	StyledButton = ElementButton;
	_BlockBody: any;
	constructor(items: SidebarLEDItems, index: number) {
		this._items = items;
		this._index = index;
		// this.StyledButton = this.getItems().StyledButton;
		this._BlockBody = this.getItems()._BlockBody;
	}

	getMainWidget = () => {
		return this.getItems().getMainWidget() as LED;
	};

	_Element = () => {
		const mainWidget = this.getMainWidget();
		const [itemName, setItemName] = React.useState(mainWidget.getItemNames()[this.getIndex()]);
		const [itemValue, setItemValue] = React.useState(`${mainWidget.getItemValues()[this.getIndex()]}`);
		// const [itemColor, setItemColor] = React.useState();

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
						</this.StyledButton>
						<this.StyledButton
							onClick={(event: any) => {
								this.updateWidgetRemoveItem(event);
							}}
						>
							<img
								src="../../../mainProcess/resources/webpages/delete-symbol.svg"
								style={{
									width: "50%",
									height: "50%",
								}}
							></img>
						</this.StyledButton> */}
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
					<form
						onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
							this.updateWidgetValue(event, itemValue);
						}}
						style={{ ...this.getFormStyle() }}
					>
						<div>Value:</div>
						<input
							style={{ ...this.getInputStyle(), color: mainWidget.getText()["useChannelItems"] ? "rgba(175, 175, 175, 1)" : "inherit" }}
							type="string"
							name="item-value"
							value={itemValue}
							readOnly={mainWidget.getText()["useChannelItems"] === true ? true : false}
							onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
								const newVal = event.target.value;
								setItemValue(newVal);
							}}
							// must use enter to change the value
							onBlur={(event: any) => {
								const orig = `${mainWidget.getItemValues()[this.getIndex()]}`;
								if (orig !== itemValue) {
									setItemValue(orig);
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
						rgbColorStr={`${mainWidget.getItemColors()[this.getIndex()]}`}
						updateFromSidebar={(
							event: any,
							propertyName: string,
							propertyValue: number | string | number[] | string[] | boolean | undefined
						) => {
							this.updateWidgetColor(event, propertyValue);
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

	updateWidgetValue = (event: any, propertyValue: string | number | boolean | number[] | string[] | undefined) => {
		if (event) {
			event.preventDefault();
		}

		const mainWidget = this.getMainWidget();
		const oldVal = `${mainWidget.getItemValues()[this.getIndex()]}`;
		if (propertyValue === oldVal) {
			return;
		} else {
			if (typeof mainWidget.getItemValues()[this.getIndex()] === "number") {
				try {
					mainWidget.getItemValues()[this.getIndex()] = parseFloat(`${propertyValue}`);
				} catch (e) {
					Log.error(e);
				}
			} else {
				mainWidget.getItemValues()[this.getIndex()] = `${propertyValue}`;
			}
		}

		const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
		history.registerAction();

		g_widgets1.addToForceUpdateWidgets(mainWidget.getWidgetKey());
		g_widgets1.addToForceUpdateWidgets("GroupSelection2");

		g_flushWidgets();
	};

	updateWidgetColor = (event: any, propertyValue: string | number | boolean | number[] | string[] | undefined) => {
		if (event) {
			event.preventDefault();
		}

		const mainWidget = this.getMainWidget();
        const newVal = GlobalMethods.rgbaArrayToRgbaStr(propertyValue as number[]);
        const oldVal = `${mainWidget.getItemColors()[this.getIndex()]}`;
		if (newVal === oldVal) {
			return;
		} else {
			mainWidget.getItemColors()[this.getIndex()] = newVal;
		}

		const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
		history.registerAction();

		g_widgets1.addToForceUpdateWidgets(mainWidget.getWidgetKey());
		g_widgets1.addToForceUpdateWidgets("GroupSelection2");

		g_flushWidgets();
	};

	updateWidgetMoveUpItem = (event: any) => {
		if (event) {
			event.preventDefault();
		}
		const mainWidget = this.getMainWidget();

		if (this.getIndex() === 0) {
			return;
		}

		const thisIndex = this.getIndex();

		const itemName = mainWidget.getItemNames()[thisIndex];
		mainWidget.getItemNames().splice(thisIndex, 1);
		mainWidget.getItemNames().splice(thisIndex - 1, 0, itemName);

		const itemValue = mainWidget.getItemValues()[thisIndex];
		mainWidget.getItemValues().splice(thisIndex, 1);
		mainWidget.getItemValues().splice(thisIndex - 1, 0, itemValue);

		const member = this.getItems().getMembers()[thisIndex];
		const member2 = this.getItems().getMembers()[thisIndex - 1];

		member.setIndex(thisIndex - 1);
		member2.setIndex(thisIndex);

		this.getItems().getMembers().splice(thisIndex, 1);
		this.getItems()
			.getMembers()
			.splice(thisIndex - 1, 0, member);

		this.getItems()._forceUpdate();

		const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
		history.registerAction();

		g_widgets1.addToForceUpdateWidgets(mainWidget.getWidgetKey());
		g_widgets1.addToForceUpdateWidgets("GroupSelection2");

		g_flushWidgets();
	};

	updateWidgetMoveDownItem = (event: any) => {
		if (event) {
			event.preventDefault();
		}
		const mainWidget = this.getMainWidget();

		if (this.getIndex() >= mainWidget.getItemNames().length - 1) {
			return;
		}

		const thisIndex = this.getIndex();

		const itemName = mainWidget.getItemNames()[thisIndex];
		mainWidget.getItemNames().splice(thisIndex, 1);
		mainWidget.getItemNames().splice(thisIndex + 1, 0, itemName);

		const itemValue = mainWidget.getItemValues()[thisIndex];
		mainWidget.getItemValues().splice(thisIndex, 1);
		mainWidget.getItemValues().splice(thisIndex + 1, 0, itemValue);

		const member = this.getItems().getMembers()[thisIndex];
		const member2 = this.getItems().getMembers()[thisIndex + 1];

		member.setIndex(thisIndex + 1);
		member2.setIndex(thisIndex);

		this.getItems().getMembers().splice(thisIndex, 1);
		this.getItems()
			.getMembers()
			.splice(thisIndex + 1, 0, member);

		this.getItems()._forceUpdate();

		const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
		history.registerAction();

		g_widgets1.addToForceUpdateWidgets(mainWidget.getWidgetKey());
		g_widgets1.addToForceUpdateWidgets("GroupSelection2");

		g_flushWidgets();
	};

	updateWidgetRemoveItem = (event: any) => {
		if (event) {
			event.preventDefault();
		}
		const mainWidget = this.getMainWidget();
		if (mainWidget.getItemNames().length <= 2 && mainWidget.getWidgetKey().includes("LED")) {
			return;
		}

		const thisIndex = this.getIndex();

		mainWidget.getItemNames().splice(thisIndex, 1);

		mainWidget.getItemValues().splice(thisIndex, 1);

		this.getItems().getMembers().splice(thisIndex, 1);
		for (let ii = thisIndex; ii < mainWidget.getItemNames().length; ii++) {
			const item = this.getItems().getMembers()[ii];
			item.setIndex(ii);
		}

		this.getItems()._forceUpdate();

		const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
		history.registerAction();

		g_widgets1.addToForceUpdateWidgets(mainWidget.getWidgetKey());
		g_widgets1.addToForceUpdateWidgets("GroupSelection2");

		g_flushWidgets();
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
