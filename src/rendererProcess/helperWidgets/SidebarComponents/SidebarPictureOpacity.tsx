import * as React from "react";
import { BaseWidgetSidebar } from "../../widgets/BaseWidget/BaseWidgetSidebar";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { SidebarComponent } from "./SidebarComponent";

/**
 * Represents the X component in sidebar. <br>
 *
 * It provides: (1) the JSX element, (2) the method to udpate the wxidget from sidebar, and (3) the method to
 * update this sidebar component from widget.
 */
export class SidebarPictureOpacity extends SidebarComponent {
	moving: boolean = false;
	initialOpacity: number = 0;

	constructor(sidebar: BaseWidgetSidebar) {
		super(sidebar);
	}

	calcRelativeMousePosition = (mouseX: number) => {
		let result = 0;
		return result;
	};

	_handleMouseMove = (event: React.MouseEvent) => {
		const x = event.clientX;
		const y = event.clientY;
	};

	_handleMouseUp = (event: React.MouseEvent) => {
		const x = event.clientX;
		const y = event.clientY;
	};

	_Element = () => {
		const [opacity, setOpacity] = React.useState<number>(parseFloat(this.getText()["opacity"]));
		const elementRef = React.useRef(null);
		const [blockLeft, setBlockLeft] = React.useState(0);

		const calcParameters = (x: number) => {
			const elementRefCurrent = elementRef.current;
			if (elementRefCurrent !== null) {
				// an object with following properties
				// bottom: 335.25
				// height: 15
				// left: 1295
				// right: 1480
				// top: 320.25
				// width: 185
				// x: 1295
				// y: 320.25
				const element = (elementRefCurrent as any).getBoundingClientRect();
				const barWidth = element.width;

				const blockWidth = 10;
				const valueMin = 0;
				const valueMax = 1;
				const relativeX = x - element.x;
				// const relativeLeft = Math.min(Math.max(relativeX, blockWidth / 2), barWidth - blockWidth / 2) - blockWidth / 2;
				const blockLeft = Math.min(Math.max(relativeX, blockWidth / 2), barWidth - blockWidth / 2) - blockWidth / 2;
				const value = valueMin + (blockLeft / (barWidth - blockWidth)) * (valueMax - valueMin);
				return [(Math.round((value * 100) / (valueMax - valueMin)) * (valueMax - valueMin)) / 100, blockLeft];
			} else {
				return [0, 0];
			}
		};

		// render again to correctly position the moving block
		React.useEffect(() => {
			const elementRefCurrent = elementRef.current;
			if (elementRefCurrent !== null) {
				const element = (elementRefCurrent as any).getBoundingClientRect();
				const barWidth = element.width;

				const blockWidth = 10;
				const valueMin = 0;
				const valueMax = 1;
				const blockLeft = ((barWidth - blockWidth) * (parseFloat(this.getText()["opacity"]) - valueMin)) / (valueMax - valueMin);
				setBlockLeft(blockLeft);
			}
		});

		const handleMouseDown = (event: React.MouseEvent) => {
			this.initialOpacity = opacity;
			const x = event.clientX;
			const [value, blockLeft] = calcParameters(x);
			this.moving = true;
			window.addEventListener("mousemove", handleMouseMoving);
			window.addEventListener("mouseup", handleMouseUp);
			setBlockLeft(blockLeft);
			setOpacity(value);
			// do not record history
			this.updateWidget(undefined, value);
		};

		const handleMouseMoving = (event: MouseEvent) => {
			if (this.moving) {
				const x = event.clientX;
				const [value, blockLeft] = calcParameters(x);
				setBlockLeft(blockLeft);
				setOpacity(value);
				// do not record history
				this.updateWidget(undefined, value);
			}
		};

		const handleMouseUp = () => {
			this.moving = false;
			// remove all event handlers
			window.removeEventListener("mousemove", handleMouseMoving);
			window.removeEventListener("mouseup", handleMouseUp);
			// record history
			if (this.initialOpacity !== opacity) {
				const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
				history.registerAction();
			}
		};

		return (
			<div
				style={{
					display: "inline-flex",
					justifyContent: "flex-end",
					flexDirection: "column",
				}}
			>
				<form onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.updateWidget(event, opacity)} style={this.getFormStyle()}>
					<div>Opacity:</div>
					<input
						// the same with as dropdown menu in SidebarLineStyle, which is an <input /> element with 70% width
						style={{ ...this.getInputStyle(), width: "65.6%" }}
						type="number"
						name="opacity"
						value={opacity}
						step="any"
						onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
							const newVal = event.target.value;
							// from 0 to 1
							setOpacity(Math.min(Math.max(parseFloat(newVal), 0), 1));
						}}
						// must use enter to change the value
						onBlur={(event: any) => {
							if (parseFloat(this.getText()["opacity"]) !== opacity) {
								setOpacity(parseFloat(this.getText()["opacity"]));
							}
						}}
					/>
				</form>
				<div style={{ display: "inline-flex", justifyContent: "flex-end", width: "100%" }}>
					<div
						ref={elementRef}
						style={{
							width: "70%",
							height: "15px",
							display: "inline-flex",
							position: "relative",
							justifyContent: "center",
							alignItems: "center",
						}}
						onMouseDown={(event: React.MouseEvent) => handleMouseDown(event)}
					>
						<div
							style={{
								border: "solid 1px rgba(0,0,0,1)",
								width: "100%",
								height: "80%",
								borderRadius: "2px",
							}}
						>
							{" "}
							<img
								src={`../../../webpack/resources/webpages/opacity-bar.png`}
								style={{
									width: "100%",
									height: "100%",
									objectFit: "fill",
								}}
							></img>
						</div>
						<div
							style={{
								position: "absolute",
								width: "10px",
								height: "100%",
								border: "solid",
								borderWidth: "1px",
								borderColor: "black",
								left: blockLeft,
								top: "-1px",
								borderRadius: "2px",
								backgroundColor: "white",
							}}
						></div>
					</div>
				</div>
			</div>
		);
	};

	updateWidget = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
		if (event) {
			event.preventDefault();
		}

		const oldVal = this.getText()["opacity"];
		if (propertyValue === oldVal) {
			return;
		} else {
			this.getText()["opacity"] = propertyValue;
		}

		g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
		g_widgets1.addToForceUpdateWidgets("GroupSelection2");

		g_flushWidgets();
	};
}
