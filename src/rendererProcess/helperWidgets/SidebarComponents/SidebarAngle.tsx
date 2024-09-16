import * as React from "react";
import { BaseWidgetSidebar } from "../../widgets/BaseWidget/BaseWidgetSidebar";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { SidebarComponent } from "./SidebarComponent";
import * as GlobalMethods from "../../global/GlobalMethods";

/**
 * Represents the X component in sidebar. <br>
 *
 * It provides: (1) the JSX element, (2) the method to udpate the widget from sidebar, and (3) the method to
 * update this sidebar component from widget.
 */
export class SidebarAngle extends SidebarComponent {
	moving: boolean = false;
	initialAngle: number = 0;
	constructor(sidebar: BaseWidgetSidebar) {
		super(sidebar);
	}

	_Element = () => {
		const [angle, setAngle] = React.useState<number>(GlobalMethods.parseIntAngle(this.getStyle().transform));

		this._updateFromWidget = (propertyValue: number) => {
			setAngle(propertyValue);
		};

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
				const valueMax = 360;
				const relativeX = x - element.x;
				// const relativeLeft = Math.min(Math.max(relativeX, blockWidth / 2), barWidth - blockWidth / 2) - blockWidth / 2;
				const blockLeft = Math.min(Math.max(relativeX, blockWidth / 2), barWidth - blockWidth / 2) - blockWidth / 2;
				const value = valueMin + (blockLeft / (barWidth - blockWidth)) * (valueMax - valueMin);
				return [(Math.round((value * 360) / (valueMax - valueMin)) * (valueMax - valueMin)) / 360, blockLeft];
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
				const valueMax = 360;
				const blockLeft =
					((barWidth - blockWidth) * (GlobalMethods.parseIntAngle(this.getStyle().transform) - valueMin)) / (valueMax - valueMin);
				setBlockLeft(blockLeft);
			}
		});

		const handleMouseDown = (event: React.MouseEvent) => {
			this.initialAngle = angle;
			const x = event.clientX;
			const [value, blockLeft] = calcParameters(x);
			this.moving = true;
			window.addEventListener("mousemove", handleMouseMoving);
			window.addEventListener("mouseup", handleMouseUp);
			setBlockLeft(blockLeft);
			setAngle(value);
			// do not record history
			this.updateWidget(undefined, value);
		};

		const handleMouseMoving = (event: MouseEvent) => {
			if (this.moving) {
				const x = event.clientX;
				const [value, blockLeft] = calcParameters(x);
				setBlockLeft(blockLeft);
				setAngle(value);
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
			if (this.initialAngle !== angle) {
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
				<form onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.updateWidget(event, angle)} style={this.getFormStyle()}>
					<div>Angle:</div>
					<input
						style={this.getInputStyle()}
						type="number"
						name="angle"
						value={angle}
						min="0"
						max="360"
						onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
							const newVal = event.target.value;
							setAngle(Math.min(Math.max(parseInt(newVal), 0), 360));
						}}
						// must use enter to change the value
						onBlur={(event: any) => {
							const orig = GlobalMethods.parseIntAngle(this.getMainWidget().getStyle().transform);
							if (orig !== angle) {
								setAngle(orig);
							}
						}}
					/>
				</form>

				<div style={{ display: "inline-flex", justifyContent: "flex-end", width: "100%" }}>
					<div
						ref={elementRef}
						style={{
							width: "74%",
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
								display: "inline-flex",
								flexDirection: "row",
								justifyContent: "space-between",
								alignItems: "center",
								border: "solid 1px rgba(0,0,0,1)",
								width: "100%",
								height: "80%",
								borderRadius: "2px",
								fontSize: "10px",
							}}
						>
							<div>0&deg;</div>
							<div>180&deg;</div>
							<div>360&deg;</div>
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

		const oldValStr = this.getStyle()["transform"];
		const newValStr = GlobalMethods.insertIntAngle(propertyValue as number, oldValStr);

		if (oldValStr === newValStr) {
			return;
		} else {
			this.getStyle()["transform"] = newValStr;
		}

		g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
		g_widgets1.addToForceUpdateWidgets("GroupSelection2");

		g_flushWidgets();
	};
}
