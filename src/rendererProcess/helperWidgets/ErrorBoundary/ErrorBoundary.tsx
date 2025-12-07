import { GlobalVariables } from "../../../common/GlobalVariables";
import { Component } from "react";
import * as React from "react";

interface Props {
	children?: React.ReactNode;
	widgetKey: string;
	style: Record<string, string>;
}

interface State {
	hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
	constructor(props: any) {
		super(props);
		this.state = { hasError: false };
	}
	public state: State = {
		hasError: false,
	};

	public static getDerivedStateFromError(_: Error): State {
		return { hasError: true };
	}

	public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error("Uncaught error:", error, errorInfo);
	}

	_ElementFallback = ({ style, widgetKey }: any) => {
		let left = 0;
		let top = 0;
		let width = 100;
		let height = 100;
		if (style !== undefined) {
			left = style["left"];
			top = style["top"];
			width = style["width"];
			height = style["height"];
		}
		return (
			<div
				style={{
					position: "absolute",
					display: "inline-flex",
					alignItems: "flex-start",
					justifyContent: "flex-start",
					// dimensions
					left: left,
					top: top,
					width: width,
					height: height,
					backgroundColor: "rgba(255, 255, 0, 1)",
					// angle
					transform: "rotate(0deg)",
					// border, it is different from the "alarmBorder" below,
					borderStyle: "solid",
					borderWidth: 1,
					borderColor: "rgba(255, 0, 0, 1)",
					// font
					color: "rgba(255,0,0,1)",
					fontFamily: GlobalVariables.defaultFontFamily,
					fontSize: GlobalVariables.defaultFontSize,
					fontStyle: GlobalVariables.defaultFontStyle,
					fontWeight: GlobalVariables.defaultFontWeight,
					// shows when the widget is selected
					outlineStyle: "none",
					outlineWidth: 1,
					outlineColor: "black",
				}}
			>
				TDM internal error on widget {`${widgetKey}`}.
			</div>
		);
	};

	public render() {
		if (this.state.hasError) {
			return <this._ElementFallback style={this.props.style} widgetKey={this.props.widgetKey}></this._ElementFallback>;
		}
		return this.props.children;
	}
}

// export default ErrorBoundary;
