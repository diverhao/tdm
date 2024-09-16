import * as React from "react";
import { BaseWidgetSidebar } from "../../widgets/BaseWidget/BaseWidgetSidebar";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { SidebarComponent } from "./SidebarComponent";
import { Polyline } from "../../widgets/Polyline/Polyline";
import { Log } from "../../global/Log";
import { ElementButton, ElementMacroInput, ElementMacroTd, ElementMacroTr } from "../SharedElements/MacrosTable";

/**
 * Represents the X component in sidebar. <br>
 *
 * It provides: (1) the JSX element, (2) the method to udpate the widget from sidebar, and (3) the method to
 * update this sidebar component from widget.
 */
export class SidebarPolylinePointsTable extends SidebarComponent {
	constructor(sidebar: BaseWidgetSidebar) {
		super(sidebar);
	}

	// _Element = () => {
	// 	const [lineWidth, setLineWidth] = React.useState<number>(parseInt(this.getText().lineWidth));

	// 	return (

	// 		<form
	// 			onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.updateWidget(event, lineWidth)}
	// 			style={this.getFormStyle()}
	// 		>
	// 			<div>Width:</div>
	// 			<input
	//                 // the same with as dropdown menu in SidebarLineStyle, which is an <input /> element with 70% width
	// 				style={{...this.getInputStyle(), width: "65.6%"}}
	// 				type="number"
	// 				name="lineWidth"
	// 				value={lineWidth}
	// 				onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
	// 					const newVal = event.target.value;
	// 					setLineWidth(parseInt(newVal));
	// 				}}
	// 				// must use enter to change the value
	// 				onBlur={(event: any) => {
	// 					if (parseInt(this.getText()["lineWidth"]) !== lineWidth) {
	// 						setLineWidth(parseInt(this.getText()["lineWidth"]));
	// 					}
	// 				}}
	// 			/>
	// 		</form>
	// 	);
	// };

	_forceUpdate: any;
	_Element = () => {
		const mainWidget = this.getMainWidget() as Polyline;
		const [, forceUpdate] = React.useState({});
		this._forceUpdate = () => {
			forceUpdate({});
		};
		return (
			<>
				<this._BlockTitle>
					<div style={{ display: "inline-flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
						<div>
							<b>Points</b>
						</div>
						<ElementButton
							onClick={(event: any) => {
								event.preventDefault();
								const newX =
									10 +
									mainWidget.getPointsRelativeX()[mainWidget.getPointsRelativeX().length - 1] * mainWidget.getStyle()["width"] +
									mainWidget.getStyle()["left"];
								const newY =
									10 +
									mainWidget.getPointsRelativeY()[mainWidget.getPointsRelativeY().length - 1] * mainWidget.getStyle()["height"] +
									mainWidget.getStyle()["top"];
								mainWidget.updateWidgetAddPoint(newX, newY, true);
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
							// display: showContents ? "inline-block" : "none",
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
								<ElementMacroTr>
									<ElementMacroTd>
										<b>X</b>
									</ElementMacroTd>
									<ElementMacroTd
										style={{
											borderLeft: "1px solid #dddddd",
											paddingLeft: 3,
										}}
									>
										<b>Y</b>
									</ElementMacroTd>
								</ElementMacroTr>
								{mainWidget.getPointsRelativeX().map((pointRelativeX: number, index: number) => {
									const pointRelativeY = mainWidget.getPointsRelativeY()[index];
									return (
										<ElementMacroTr key={`${this.getWidgetKey()}-macros-${index}`}>
											<ElementMacroTd>
												<this._ElementCoordinate
													key={`x-${index}-${pointRelativeX}-${pointRelativeY}`}
													dataArray={mainWidget.getPointsRelativeX()}
													index={index}
													direction={"x"}
												></this._ElementCoordinate>
											</ElementMacroTd>
											<ElementMacroTd>
												<this._ElementCoordinate
													key={`y-${index}-${pointRelativeX}-${pointRelativeY}`}
													dataArray={mainWidget.getPointsRelativeY()}
													index={index}
													direction={"y"}
												></this._ElementCoordinate>
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
															this.updateWidgetMoveUpPoint(event, index);
														}}
													>
														&#8593;
													</ElementButton>
													<ElementButton
														onClick={(event: any) => {
															this.updateWidgetMoveDownPoint(event, index);
														}}
													>
														&#8595;
													</ElementButton>
													<ElementButton
														onClick={() => {
															if (mainWidget.getPointsRelativeX().length <= 2) {
																return;
															}
															mainWidget.updateWidgetRemovePoint(index, true);
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

	_ElementCoordinate = ({ dataArray, index, direction }: any) => {
		const sizeStr = direction === "x" ? "width" : "height";
		const size = this.getMainWidget().getStyle()[sizeStr];

		React.useEffect(() => {
			setVal(dataArray[index] * size);
		}, [size]);

		const [val, setVal] = React.useState(dataArray[index] * size);
		return (
			<form
				onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.updateWidgetCoordinate(event, val, dataArray, index, direction)}
				style={this._macroFormStyle}
			>
				<ElementMacroInput
					step="any"
					type="number"
					value={val}
					placeholder={"value"}
					onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
						event.preventDefault();
						try {
							setVal(parseInt(event.target.value));
						} catch (e) {
							Log.error(e);
						}
					}}
					onBlur={(event: any) => {
						event.preventDefault();
						if (dataArray[index] * size !== val) {
							setVal(dataArray[index] * size);
						}
					}}
				/>
			</form>
		);
	};

	// change 2 things for each direction: this.getStyle()["width"], this.getPointsRelativeX()
	// flush widget event: any, propertyValue: number, dataArray: number[], index: number, size: number
	updateWidgetCoordinate = (event: any, newValue: number, dataArray: number[], index: number, direction: "x" | "y", doFlush: boolean = true) => {
		if (event) {
			event.preventDefault();
		}

		const sizeStr = direction === "x" ? "width" : "height";
		const positionStr = direction === "x" ? "left" : "top";
		const size = this.getMainWidget().getStyle()[sizeStr];

		const oldValue = dataArray[index] * size;
		// dataArray.splice(index, 1);

		const dataArray2: number[] = [];

		for (let ii = 0; ii < dataArray.length; ii++) {
			if (ii === index) {
				dataArray2.push(newValue);
			} else {
				dataArray2.push(dataArray[ii] * size);
			}
		}


		const min = Math.min(...dataArray2);
		const max = Math.max(...dataArray2);
		const newPosition = this.getStyle()[positionStr] + min;
        // minimum size is 5 px
		const newSize = Math.max(max, 5);
		this.getStyle()[positionStr] = newPosition;
		this.getStyle()[sizeStr] = newSize;

		for (let ii = 0; ii < dataArray.length; ii++) {
			dataArray[ii] = (dataArray2[ii] - min) / newSize;
		}

		if (doFlush) {
			// add to history
			const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
			history.registerAction();

			g_widgets1.updateSidebar(true);

			// flush this widget
			g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
			g_widgets1.addToForceUpdateWidgets("GroupSelection2");

			g_flushWidgets();
		}
	};

	updateWidgetMoveUpPoint = (event: any, index: number) => {
		if (event) {
			event.preventDefault();
		}

		if (index === 0) {
			return;
		}

		const mainWidget = this.getMainWidget() as Polyline;
		const width = mainWidget.getStyle()["width"];
		const height = mainWidget.getStyle()["height"];

		const xTmp = mainWidget.getPointsRelativeX()[index];
		mainWidget.getPointsRelativeX()[index] = mainWidget.getPointsRelativeX()[index - 1];
        mainWidget.getPointsRelativeX()[index - 1] = xTmp;

        const yTmp = mainWidget.getPointsRelativeY()[index];
		mainWidget.getPointsRelativeY()[index] = mainWidget.getPointsRelativeY()[index - 1];
        mainWidget.getPointsRelativeY()[index - 1] = yTmp;


		// const x1 = mainWidget.getPointsRelativeX()[index - 1] * width;
		// const y1 = mainWidget.getPointsRelativeY()[index - 1] * height;
		// const x2 = mainWidget.getPointsRelativeX()[index] * width;
		// const y2 = mainWidget.getPointsRelativeY()[index] * height;

		// this.updateWidgetCoordinate(event, x2, mainWidget.getPointsRelativeX(), index - 1, "x", false);
		// this.updateWidgetCoordinate(event, y2, mainWidget.getPointsRelativeY(), index - 1, "y", false);
		// this.updateWidgetCoordinate(event, x1, mainWidget.getPointsRelativeX(), index, "x", false);
		// this.updateWidgetCoordinate(event, y1, mainWidget.getPointsRelativeY(), index, "y", false);

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

	updateWidgetMoveDownPoint = (event: any, index: number) => {
		if (event) {
			event.preventDefault();
		}

		const mainWidget = this.getMainWidget() as Polyline;
		if (index >= mainWidget.getPointsRelativeX().length - 1) {
			return;
		}

		const width = mainWidget.getStyle()["width"];
		const height = mainWidget.getStyle()["height"];


		const xTmp = mainWidget.getPointsRelativeX()[index];
		mainWidget.getPointsRelativeX()[index] = mainWidget.getPointsRelativeX()[index + 1];
        mainWidget.getPointsRelativeX()[index + 1] = xTmp;

        const yTmp = mainWidget.getPointsRelativeY()[index];
		mainWidget.getPointsRelativeY()[index] = mainWidget.getPointsRelativeY()[index + 1];
        mainWidget.getPointsRelativeY()[index + 1] = yTmp;


		// const x1 = mainWidget.getPointsRelativeX()[index] * width;
		// const y1 = mainWidget.getPointsRelativeY()[index] * height;
		// const x2 = mainWidget.getPointsRelativeX()[index + 1] * width;
		// const y2 = mainWidget.getPointsRelativeY()[index + 1] * height;

		// this.updateWidgetCoordinate(event, x2, mainWidget.getPointsRelativeX(), index, "x", false);
		// this.updateWidgetCoordinate(event, y2, mainWidget.getPointsRelativeY(), index, "y", false);
		// this.updateWidgetCoordinate(event, x1, mainWidget.getPointsRelativeX(), index + 1, "x", false);
		// this.updateWidgetCoordinate(event, y1, mainWidget.getPointsRelativeY(), index + 1, "y", false);

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

	private _macroFormStyle: Record<string, any> = {
		display: "inline-flex",
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginTop: 2,
		marginBottom: 2,
		width: "95%",
	};

	private _macroLineStyle: Record<string, any> = {
		display: "inline-flex",
		position: "relative",
		flexDirection: "Row",
		width: "100%",
		justifyContent: "space-between",
		alignItems: "center",
		marginTop: 2,
		marginBottom: 2,
	};
}
