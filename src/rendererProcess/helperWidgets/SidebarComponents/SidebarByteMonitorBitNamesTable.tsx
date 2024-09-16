import * as React from "react";
import { BaseWidgetSidebar } from "../../widgets/BaseWidget/BaseWidgetSidebar";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { SidebarComponent } from "./SidebarComponent";
import { GlobalVariables } from "../../global/GlobalVariables";
import { ByteMonitor } from "../../widgets/ByteMonitor/ByteMonitor";
import { ElementMacroInput, ElementButton, ElementMacroTd, ElementMacroTr } from "../SharedElements/MacrosTable";

/**
 * Represents the X component in sidebar. <br>
 *
 * It provides: (1) the JSX element, (2) the method to udpate the widget from sidebar, and (3) the method to
 * update this sidebar component from widget.
 */
export class SidebarByteMonitorBitNamesTable extends SidebarComponent {
	constructor(sidebar: BaseWidgetSidebar) {
		super(sidebar);
	}

	_forceUpdate: any;
	_Element = () => {
		const mainWidget = this.getMainWidget() as ByteMonitor;
		const [, forceUpdate] = React.useState({});
		this._forceUpdate = () => {
			forceUpdate({});
		};
		return (
			<>
				<this._BlockTitle>
					<div style={{ display: "inline-flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
						<div>
							<b>Labels</b>
						</div>
						<ElementButton
							onClick={(event: any) => {
                                this.updateWidgetAppendNewBitName(event);
							}}
						>
							<img
								src={`../../../webpack/resources/webpages/add-symbol.svg`}
								style={{
									width: "50%",
									height: "50%",
								}}
							></img>
						</ElementButton>
					</div>
				</this._BlockTitle>
				<this._BlockBody>
					<div
						style={{
							display: "inline-block",
						}}
					>
						<table
							style={{
								margin: 0,
								padding: 0,
								borderSpacing: 0,
							}}
						>
							<tbody>
								<ElementMacroTr index={0}>
									<ElementMacroTd>
										<b>Index</b>
									</ElementMacroTd>
									<ElementMacroTd
										style={{
											borderLeft: "1px solid #dddddd",
											paddingLeft: 3,
										}}
									>
										<b>Label</b>
									</ElementMacroTd>
								</ElementMacroTr>
								{mainWidget.getBitNames().map((bitName: string, index: number) => {
									return (
										<ElementMacroTr key={`${bitName}-${index}`} index={index+1}>
											<ElementMacroTd>
												<div>{index}</div>
											</ElementMacroTd>
											<ElementMacroTd>
												<this._ElementBitName
													index={index}
												></this._ElementBitName>
											</ElementMacroTd>
											<ElementMacroTd>
												<div
													style={{
														display: "inline-flex",
														flexDirection: "row",
													}}
												>
													<ElementButton
														onClick={(event: any) => {
															this.updateWidgetMoveUpBitName(event, index);
														}}
													>
														&#8593;
													</ElementButton>
													<ElementButton
														onClick={(event: any) => {
															this.updateWidgetMoveDownBitName(event, index);
														}}
													>
														&#8595;
													</ElementButton>
													<ElementButton
														onClick={(event: any) => {
															this.updateWidgetRemoveBitName(event, index);
														}}
													>
														<img
															src={`../../../webpack/resources/webpages/delete-symbol.svg`}
															style={{
																width: "50%",
																height: "50%",
															}}
														></img>
													</ElementButton>
												</div>
											</ElementMacroTd>
										</ElementMacroTr>
									);
								})}
							</tbody>
						</table>
					</div>
				</this._BlockBody>
			</>
		);
	};

	_ElementBitName = ({ dataArray, index, direction }: any) => {
        const mainWidget = this.getMainWidget() as ByteMonitor;
		const [bitName, setBitName] = React.useState(mainWidget.getBitNames()[index]);

		return (
			<form
				onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.updateWidgetBitName(event, bitName, index)}
				style={this._macroFormStyle}
			>
				<ElementMacroInput
					type="string"
					value={` ${bitName}`}
					placeholder={""}
					onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
						event.preventDefault();
						setBitName(event.target.value);
					}}
					onBlur={(event: any) => {
						event.preventDefault();
						if (mainWidget.getBitNames()[index] !== bitName) {
							setBitName(mainWidget.getBitNames()[index]);
						}
					}}
				/>
			</form>
		);
	};


	updateWidgetMoveDownBitName = (event: any, index: number) => {
		if (event) {
			event.preventDefault();
		}

		const mainWidget = this.getMainWidget() as ByteMonitor;

		const bitNames = mainWidget.getBitNames();

		if (index >= bitNames.length - 1) {
			return;
		}
		const tmp = bitNames[index];
		bitNames[index] = bitNames[index + 1];
		bitNames[index + 1] = tmp;

		// add to history
		const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
		history.registerAction();
		this._forceUpdate();

		g_widgets1.updateSidebar(true);

		// flush this widget
		g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
		g_widgets1.addToForceUpdateWidgets("GroupSelection2");

		g_flushWidgets();
	};


	updateWidgetMoveUpBitName = (event: any, index: number) => {
		if (event) {
			event.preventDefault();
		}

		const mainWidget = this.getMainWidget() as ByteMonitor;

		const bitNames = mainWidget.getBitNames();

		if (index <= 0) {
			return;
		}
		const tmp = bitNames[index];
		bitNames[index] = bitNames[index - 1];
		bitNames[index - 1] = tmp;

		// add to history
		const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
		history.registerAction();
		this._forceUpdate();

		g_widgets1.updateSidebar(true);

		// flush this widget
		g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
		g_widgets1.addToForceUpdateWidgets("GroupSelection2");

		g_flushWidgets();
	};

	updateWidgetAppendNewBitName = (event: any) => {
		if (event) {
			event.preventDefault();
		}

		const mainWidget = this.getMainWidget() as ByteMonitor;

		const bitNames = mainWidget.getBitNames();
        bitNames.push(`value`);

		// add to history
		const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
		history.registerAction();
		this._forceUpdate();

		g_widgets1.updateSidebar(true);

		// flush this widget
		g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
		g_widgets1.addToForceUpdateWidgets("GroupSelection2");

		g_flushWidgets();
	};

	updateWidgetRemoveBitName = (event: any, index: number) => {
		if (event) {
			event.preventDefault();
		}


		const mainWidget = this.getMainWidget() as ByteMonitor;

		const bitNames = mainWidget.getBitNames();
        bitNames.splice(index, 1);

		// add to history
		const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
		history.registerAction();
		this._forceUpdate();

		g_widgets1.updateSidebar(true);

		// flush this widget
		g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
		g_widgets1.addToForceUpdateWidgets("GroupSelection2");

		g_flushWidgets();
	};

	// change 2 things for each direction: this.getStyle()["width"], this.getPointsRelativeX()
	// flush widget
	// updateWidgetRemovePoint = () => {
	// 	const width = this.getStyle()["width"];
	// 	const height = this.getStyle()["height"];
	// 	const pointRelativeX = this.getPointsRelativeX()[this.getPointsRelativeX().length - 1];
	// 	const pointRelativeY = this.getPointsRelativeY()[this.getPointsRelativeY().length - 1];
	// 	this.getPointsRelativeX().splice(this.getPointsRelativeX().length - 1, 1);
	// 	this.getPointsRelativeY().splice(this.getPointsRelativeY().length - 1, 1);

	// 	console.log(pointRelativeX);

	// 	if (pointRelativeX >= 0.999999) {
	// 		let newWidth = width * Math.max(...this.getPointsRelativeX());
	// 		if (newWidth < 5) {
	// 			newWidth = 5;
	// 		}
	// 		this.getStyle()["width"] = newWidth;
	// 		const ratio = width / newWidth;
	// 		for (let ii = 0; ii < this.getPointsRelativeX().length; ii++) {
	// 			this.getPointsRelativeX()[ii] = this.getPointsRelativeX()[ii] * ratio;
	// 		}
	// 	}

	// 	if (pointRelativeX <= 0.000001) {
	// 		let newWidth = width * (1 - Math.min(...this.getPointsRelativeX()));
	// 		if (newWidth < 5) {
	// 			newWidth = 5;
	// 		}

	// 		const newLeft = this.getStyle()["left"] + Math.min(...this.getPointsRelativeX()) * width;
	// 		this.getStyle()["width"] = newWidth;
	// 		this.getStyle()["left"] = newLeft;
	// 		const minRelativeX = Math.min(...this.getPointsRelativeX());
	// 		for (let ii = 0; ii < this.getPointsRelativeX().length; ii++) {
	// 			this.getPointsRelativeX()[ii] = ((this.getPointsRelativeX()[ii] - minRelativeX) * width) / newWidth;
	// 		}
	// 	}

	// 	if (pointRelativeY >= 0.999999) {
	// 		let newHeight = height * Math.max(...this.getPointsRelativeY());
	// 		if (newHeight < 5) {
	// 			newHeight = 5;
	// 		}

	// 		this.getStyle()["height"] = newHeight;
	// 		const ratio = height / newHeight;
	// 		for (let ii = 0; ii < this.getPointsRelativeY().length; ii++) {
	// 			this.getPointsRelativeY()[ii] = this.getPointsRelativeY()[ii] * ratio;
	// 		}
	// 	}

	// 	if (pointRelativeY <= 0.000001) {
	// 		console.log("we are 0");
	// 		let newHeight = height * (1 - Math.min(...this.getPointsRelativeY()));
	// 		if (newHeight < 5) {
	// 			newHeight = 5;
	// 		}
	// 		const newTop = this.getStyle()["top"] + Math.min(...this.getPointsRelativeY()) * height;
	// 		this.getStyle()["height"] = newHeight;
	// 		this.getStyle()["top"] = newTop;
	// 		const minRelativeY = Math.min(...this.getPointsRelativeY());

	// 		for (let ii = 0; ii < this.getPointsRelativeY().length; ii++) {
	// 			this.getPointsRelativeY()[ii] = ((this.getPointsRelativeY()[ii] - minRelativeY) * height) / newHeight;
	// 		}
	// 	}
	// 	// flush this widget
	// 	g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
	// 	g_widgets1.addToForceUpdateWidgets("GroupSelection2");

	// 	g_flushWidgets();
	// };

	updateWidgetCoordinate2 = (event: any, propertyValue: number, dataArray: number[], index: number, size: number) => {
		event.preventDefault();

		const oldVal = dataArray[index] * size;
		if (propertyValue === oldVal) {
			return;
		} else {
			dataArray[index] = propertyValue / size;
		}

		const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
		history.registerAction();

		g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
		g_widgets1.addToForceUpdateWidgets("GroupSelection2");

		g_flushWidgets();
	};

	updateWidget = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
		event.preventDefault();

		const oldVal = this.getText()["lineWidth"];
		if (propertyValue === oldVal) {
			return;
		} else {
			this.getText()["lineWidth"] = propertyValue;
		}

		const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
		history.registerAction();

		g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
		g_widgets1.addToForceUpdateWidgets("GroupSelection2");

		g_flushWidgets();
	};

	updateWidgetBitName = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined, index: number) => {
		event.preventDefault();

        const mainWidget = this.getMainWidget() as ByteMonitor;
		const oldVal = mainWidget.getBitNames()[index];
		if (propertyValue === oldVal) {
			return;
		} else {
			mainWidget.getBitNames()[index] = `${propertyValue}`;
		}

		const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
		history.registerAction();

		g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
		g_widgets1.addToForceUpdateWidgets("GroupSelection2");

		g_flushWidgets();
	};


	private _macroFormStyle: Record<string, any> = {
		display: "inline-flex",
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginTop: 2,
		marginBottom: 2,
		width: "95%",
	};
}
