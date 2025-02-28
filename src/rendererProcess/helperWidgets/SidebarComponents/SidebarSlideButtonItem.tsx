// import { SidebarBooleanButtonItems } from "./SidebarBooleanButtonItems";
import * as React from "react";
import { Symbol } from "../../widgets/Symbol/Symbol";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../Root/Root";
// import { BooleanButtonSidebar } from "../../widgets/BooleanButton/BooleanButtonSidebar";
// import { BooleanButton } from "../../widgets/BooleanButton/BooleanButton";
import { Collapsible } from "../ColorPicker/Collapsible";
import * as GlobalMethods from "../../global/GlobalMethods";
import { SlideButton } from "../../widgets/SlideButton/SlideButton";
import { SidebarSlideButtonItems } from "./SidebarSlideButtonItems";
import { ElementButton } from "../SharedElements/MacrosTable";

export class SidebarSlideButtonItem {
	_items: SidebarSlideButtonItems;
	_index: number;
	StyledButton = ElementButton;
	_BlockBody: any;
    ElementInputLabel: any;
	constructor(items: SidebarSlideButtonItems, index: number) {
		this._items = items;
		this._index = index;
		// this.StyledButton = this.getItems().StyledButton;
		this._BlockBody = this.getItems()._BlockBody;
        this.ElementInputLabel = this.getItems()._ElementInputLabel
	}

	getMainWidget = () => {
		return this.getItems().getMainWidget() as SlideButton;
	};
	_updateFromWidget = (newFileName: string) => {};

	_Element = () => {
		const mainWidget = this.getMainWidget();
		const [itemLabel, setItemLabel] = React.useState(mainWidget.getItemLabels()[this.getIndex()]);
		const [itemValue, setItemValue] = React.useState(`${mainWidget.getItemValues()[this.getIndex()]}`);
		// const [itemColor, setItemColor] = React.useState(`${mainWidget.getItemColors()[this.getIndex()]}`);
		// const [itemPicture, setItemPicture] = React.useState(`${mainWidget.getItemPictures()[this.getIndex()]}`);

		// invoked when we select the picture using dialog
		this._updateFromWidget = (newPicture: string) => {
			// mainWidget.getItemPictures()[this.getIndex()] = newPicture;
			// setItemPicture(newPicture);
			// const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
			// history.registerAction();
			// g_widgets1.addToForceUpdateWidgets(mainWidget.getWidgetKey());
			// g_widgets1.addToForceUpdateWidgets("GroupSelection2");
			// g_flushWidgets();
		};

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
					<div
						style={{
							display: "inline-flex",
							flexDirection: "row",
							justifyContent: "center",
							alignItems: "center",
						}}
					>
						{/* <div
							style={{
								display: "inline-flex",
								flexDirection: "row",
								justifyContent: "center",
								alignItems: "center",
							}}
							onClick={() => {
								// to get the file name
								const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
								const displayWindowId = displayWindowClient.getWindowId();
								displayWindowClient.getIpcManager().sendFromRendererProcess("select-a-file", {
									displayWindowId: displayWindowId,
									widgetKey: this.getMainWidget().getWidgetKey(),
                                    filterType: "picture",
									itemIndex: this.getIndex(),
								});
							}}
						>
							<img
								src="../../../mainProcess/resources/webpages/open-file-symbol.svg"
								style={{
									width: 20,
									height: 15,
									objectFit: "scale-down",
								}}
							></img>
						</div> */}

						{/* <this.StyledButton
							onClick={(event: any) => {
								// this.updateWidgetMoveUpItem(event);
							}}
						>
							&#11105;{" "}
						</this.StyledButton> */}
						{/* <this.StyledButton
							onClick={(event: any) => {
								// this.updateWidgetMoveDownItem(event);
							}}
						>
							&#11107;{" "}
						</this.StyledButton> */}
						{/* <this.StyledButton
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
							this.updateWidgetLabel(event, itemLabel);
						}}
						style={{ ...this.getFormStyle() }}
					>
                        <this.ElementInputLabel
                            value={itemLabel}
                            setValue={setItemLabel}
                            readableText={"Slide Button item label"}
                            updater={(newValue: string) => { this.updateWidgetLabel(undefined, newValue) }}
                        >
                            Label:
                        </this.ElementInputLabel>
						<input
							style={{ ...this.getInputStyle(), color: mainWidget.getText()["useChannelItems"] ? "rgba(175, 175, 175, 1)" : "inherit" }}
							type="string"
							name="item-name"
							value={itemLabel}
							readOnly={mainWidget.getText()["useChannelItems"] === true  ? true : false}
							onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
								const newVal = event.target.value;
								setItemLabel(newVal);
							}}
							// must use enter to change the value
							onBlur={(event: any) => {
								const orig = mainWidget.getItemLabels()[this.getIndex()];
								if (orig !== itemLabel) {
									setItemLabel(orig);
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
							style={{ ...this.getInputStyle(), color: (mainWidget.getText()["useChannelItems"]) ? "rgba(175, 175, 175, 1)" : "inherit" }}
							type="string"
							name="item-value"
							// value={itemValue}
							// value={mainWidget.getText()["bit"] > -1 ? this.getIndex(): itemValue}
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
				{/* <div
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
							this.updateWidgetPicture(event, itemValue);
						}}
						style={{ ...this.getFormStyle() }}
					>
						<div>Picture:</div>
						<input
							style={{ ...this.getInputStyle(), color: mainWidget.getText()["useChannelItems"] ? "rgba(175, 175, 175, 1)" : "inherit" }}
							type="string"
							name="item-picture"
							value={itemPicture}
							readOnly={mainWidget.getText()["useChannelItems"] === true ? true : false}
							onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
								const newVal = event.target.value;
								setItemPicture(newVal);
							}}
							// must use enter to change the value
							onBlur={(event: any) => {
								const orig = `${mainWidget.getItemPictures()[this.getIndex()]}`;
								if (orig !== itemPicture) {
									setItemPicture(orig);
								}
							}}
						/>
					</form>
				</div> */}
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
						rgbColorStr={this.getMainWidget().getItemColors()[this.getIndex()]}
						updateFromSidebar={(
							event: any,
							propertyName: string,
							propertyValue: number | string | number[] | string[] | boolean | undefined
						) => {
							this.updateWidgetColor(event, propertyValue);
						}}
						title={"Color"}
						eventName={"color"}
					/>
				</div>
			</this._BlockBody>
		);
	};

	updateWidgetColor = (event: any, propertyValue: string | number | boolean | number[] | string[] | undefined) => {
		if (event) {
			event.preventDefault();
		}

		const mainWidget = this.getMainWidget();

		const newVal = GlobalMethods.rgbaArrayToRgbaStr(propertyValue as number[]);
		const oldVal = mainWidget.getItemColors()[this.getIndex()];

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

	// updateWidgetPicture = (event: any, propertyValue: string | number | boolean | number[] | string[] | undefined) => {
	// 	if (event) {
	// 		event.preventDefault();
	// 	}

	// 	const mainWidget = this.getMainWidget();
	// 	const oldVal = mainWidget.getItemPictures()[this.getIndex()];
	// 	if (propertyValue === oldVal) {
	// 		return;
	// 	} else {
	// 		mainWidget.getItemPictures()[this.getIndex()] = `${propertyValue}`;
	// 	}

	// 	const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
	// 	history.registerAction();

	// 	g_widgets1.addToForceUpdateWidgets(mainWidget.getWidgetKey());
	// 	g_widgets1.addToForceUpdateWidgets("GroupSelection2");

	// 	g_flushWidgets();
	// };

	updateWidgetLabel = (event: any, propertyValue: string | number | boolean | number[] | string[] | undefined) => {
		if (event) {
			event.preventDefault();
		}

		const mainWidget = this.getMainWidget();
		const oldVal = mainWidget.getItemLabels()[this.getIndex()];
		if (propertyValue === oldVal) {
			return;
		} else {
			mainWidget.getItemLabels()[this.getIndex()] = `${propertyValue}`;
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
			mainWidget.getItemValues()[this.getIndex()] = parseFloat(`${propertyValue}`);
		}

		const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
		history.registerAction();

		g_widgets1.addToForceUpdateWidgets(mainWidget.getWidgetKey());
		g_widgets1.addToForceUpdateWidgets("GroupSelection2");

		g_flushWidgets();
	};

	// --------------------------- getters -----------------------------

	getElement = () => {
		const mainWidget = this.getMainWidget();
		return <this._Element key={`${mainWidget.getItemLabels()[this.getIndex()]}-${this.getIndex()}`}></this._Element>;
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
