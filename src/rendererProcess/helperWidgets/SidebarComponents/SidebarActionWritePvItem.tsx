import { SidebarActionItems } from "./SidebarActionItems";
import * as React from "react";
import { ActionButton } from "../../widgets/ActionButton/ActionButton";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../Root/Root";
import { type_action_writepv_tdl } from "../../widgets/ActionButton/ActionButton";
import { ElementButton } from "../SharedElements/MacrosTable";

export class SidebarActionWritePvItem {
	_items: SidebarActionItems;
	_index: number;
	StyledButton = ElementButton;
	_BlockBody: any;
    ElementInputLabel: any;
	constructor(items: SidebarActionItems, index: number) {
		this._items = items;
		this._index = index;
		// this.StyledButton = this.getItems().StyledButton;
		this._BlockBody = this.getItems()._BlockBody;
        this.ElementInputLabel = this.getItems()._ElementInputLabel
	}

	getMainWidget = () => {
		return this.getItems().getMainWidget() as ActionButton;
	};

	getTdl = () => {
		const mainWidget = this.getMainWidget();
		return mainWidget.getActions()[this.getIndex()] as type_action_writepv_tdl;
	};

	_Element = () => {
		// const mainWidget = this.getMainWidget();
		const [label, setLabel] = React.useState(this.getTdl()["label"]);
		const [channelName, setChannelName] = React.useState(this.getTdl()["channelName"]);
		const [channelValue, setChannelValue] = React.useState(`${this.getTdl()["channelValue"]}`);

		return (
			<this._BlockBody>
				<div
					style={{
						display: "inline-flex",
						flexDirection: "row",
						width: "100%",
						justifyContent: "space-between",
						alignItems: "center",
                        backgroundColor: "rgba(240,240,240,1)",
					}}
				>
					<b>{`#${this.getIndex()} Write PV`}</b>
					<div>
						<this.StyledButton
							onClick={(event: any) => {
								this.getItems().updateWidgetMoveUpAction(event, this.getIndex());
							}}
						>
							&#8593;{" "}
						</this.StyledButton>
						<this.StyledButton
							onClick={(event: any) => {
								this.getItems().updateWidgetMoveDownAction(event, this.getIndex());
							}}
						>
							&#8595;{" "}
						</this.StyledButton>
						<this.StyledButton
							onClick={(event: any) => {
								this.getItems().updateWidgetRemoveAction(event, this.getIndex());
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
							this.updateWidgetLabel(event, label);
						}}
						style={{ ...this.getFormStyle(), width: "100%" }}
					>
                        <this.ElementInputLabel
                            value={label}
                            setValue={setLabel}
                            readableText={"Write PV label"}
                            updater={(newValue: string) => this.updateWidgetLabel(undefined, newValue)}
                        >
                            Label:
                        </this.ElementInputLabel>
						<input
							style={{ ...this.getInputStyle() }}
							type="string"
							name="item-label"
							value={label}
							onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
								const newVal = event.target.value;
								setLabel(newVal);
							}}
							// must use enter to change the value
							onBlur={(event: any) => {
								const orig = this.getTdl()["label"];
								if (orig !== label) {
									setLabel(orig);
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
							this.updateWidgetChannelName(event, channelName);
						}}
						style={{ ...this.getFormStyle(), width: "100%" }}
					>
                        <this.ElementInputLabel
                            value={channelName}
                            setValue={setChannelName}
                            readableText={"Write PV channel name"}
                            updater={(newValue: string) => this.updateWidgetChannelName(undefined, newValue)}
                        >
                            Name:
                        </this.ElementInputLabel>
						<input
							style={{ ...this.getInputStyle() }}
							type="string"
							name="item-channel-name"
							value={channelName}
							onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
								const newVal = event.target.value;
								setChannelName(newVal);
							}}
							// must use enter to change the value
							onBlur={(event: any) => {
								const orig = this.getTdl()["channelName"];
								if (orig !== channelName) {
									setChannelName(orig);
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
							this.updateWidgetChannelValue(event, channelValue);
						}}
						style={{ ...this.getFormStyle(), width: "100%" }}
					>
                        <this.ElementInputLabel
                            value={`${channelValue}`}
                            setValue={setChannelValue}
                            readableText={"Write PV channel value"}
                            updater={(newValue: string) => this.updateWidgetChannelValue(undefined, newValue)}
                        >
                            Value:
                        </this.ElementInputLabel>
						<input
							style={{ ...this.getInputStyle() }}
							type="string"
							name="item-channel-value"
							value={`${channelValue}`}
							onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
								const newVal = event.target.value;
								setChannelValue(newVal);
							}}
							// must use enter to change the value
							onBlur={(event: any) => {
								const orig = `${this.getTdl()["channelValue"]}`;
								if (orig !== channelValue) {
									setChannelValue(orig);
								}
							}}
						/>
					</form>
				</div>
                <this._HorizontalLine></this._HorizontalLine>
			</this._BlockBody>
		);
	};


	updateWidgetLabel = (event: any, propertyValue: string | number | boolean | number[] | string[] | undefined) => {
		if (event) {
			event.preventDefault();
		}

		const mainWidget = this.getMainWidget();
		const oldVal = this.getTdl()["label"];
		if (propertyValue === oldVal) {
			return;
		} else {
			this.getTdl()["label"] = `${propertyValue}`;
		}

		const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
		history.registerAction();

		g_widgets1.addToForceUpdateWidgets(mainWidget.getWidgetKey());
		g_widgets1.addToForceUpdateWidgets("GroupSelection2");

		g_flushWidgets();
	};

	updateWidgetChannelName = (event: any, propertyValue: string | number | boolean | number[] | string[] | undefined) => {
		if (event) {
			event.preventDefault();
		}

		const mainWidget = this.getMainWidget();
		const oldVal = this.getTdl()["channelName"];
		if (propertyValue === oldVal) {
			return;
		} else {
			this.getTdl()["channelName"] = `${propertyValue}`;
		}

		const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
		history.registerAction();

		g_widgets1.addToForceUpdateWidgets(mainWidget.getWidgetKey());
		g_widgets1.addToForceUpdateWidgets("GroupSelection2");

		g_flushWidgets();
	};

	updateWidgetChannelValue = (event: any, propertyValue: string | number | boolean | number[] | string[] | undefined) => {
		if (event) {
			event.preventDefault();
		}

		const mainWidget = this.getMainWidget();
		const oldVal = `${this.getTdl()["channelValue"]}`;
		if (propertyValue === oldVal) {
			return;
		} else {
            // dbrData fed to TcaChannel.put() is always string type
            // it is parased by TcaChannel.parseInput()
			this.getTdl()["channelValue"] = `${propertyValue}`;
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
		return <this._Element key={`${this.getTdl()["label"]}-${this.getIndex()}`}></this._Element>;
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

	// -------------------------- styled components ----------------------------


	_HorizontalLine = () => {
		return <div>&nbsp;</div>;
	};

}
