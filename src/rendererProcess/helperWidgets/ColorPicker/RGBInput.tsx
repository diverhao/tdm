import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";

const RGBInputRaw = ({ rgb, handleColorUpdate }: any) => {
	const [rgbColor, setRgbColor] = React.useState([...rgb]);

	const rgbColorValidVals = React.useRef([...rgb]);

	React.useEffect(() => {
		let red = Math.round(rgb[0]);
		let green = Math.round(rgb[1]);
		let blue = Math.round(rgb[2]);
		let opacity = rgb[3];
		setRgbColor([red, green, blue, opacity]);
	}, [rgb]);

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>, colorType: string) => {
		let red = rgbColor[0];
		let green = rgbColor[1];
		let blue = rgbColor[2];
		let opacity = rgbColor[3];

		let parsed: number = parseInt(event.target.value);

		if (isNaN(parsed)) {
			parsed = 0;
		}

		if (parsed >= 0 && parsed <= 255) {
			let tmp = [red, green, blue, opacity];
			if (colorType === "red") {
				tmp = [parsed, green, blue, opacity];
			} else if (colorType === "green") {
				tmp = [red, parsed, blue, opacity];
			} else if (colorType === "blue") {
				tmp = [red, green, parsed, opacity];
			} else if (colorType === "opacity") {
				if (parsed <= 100) {
					tmp = [red, green, blue, parsed];
				}
			}
			setRgbColor(tmp);
			if (parsed !== 0) {
				rgbColorValidVals.current = [...tmp];
			}
			handleColorUpdate(rgbColorValidVals.current);
            const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
            history.registerAction();
    
		}
	};

	const _divStyle: Record<string, any> = {
		display: "inline-flex",
		flexDirection: "column",
		justifyContent: "center",
		alignItems: "center",
		width: "22%",
	};

	const _inputStyle: Record<string, any> = {
		width: "100%",
		textAlign: "center",
		boxSizing: "border-box",
	};

	return (
		<div
			style={{
				display: "inline-flex",
				justifyContent: "space-between",
				alignItems: "center",
				width: "100%",
				flexDirection: "row",
				marginTop: 3,
				marginBottom: 3,
			}}
		>
			<div style={_divStyle}>
				<input value={rgbColor[0]} type="text" style={_inputStyle} onChange={(event) => handleChange(event, "red")}></input>R{" "}
			</div>
			<div style={_divStyle}>
				<input value={rgbColor[1]} type="text" style={_inputStyle} onChange={(event) => handleChange(event, "green")}></input>G{" "}
			</div>
			<div style={_divStyle}>
				<input value={rgbColor[2]} type="text" style={_inputStyle} onChange={(event) => handleChange(event, "blue")}></input>B{" "}
			</div>
			<div style={_divStyle}>
				<input value={rgbColor[3]} type="text" style={_inputStyle} onChange={(event) => handleChange(event, "opacity")}></input>A{" "}
			</div>
		</div>
	);
};

export const RGBInput = React.memo(RGBInputRaw);
