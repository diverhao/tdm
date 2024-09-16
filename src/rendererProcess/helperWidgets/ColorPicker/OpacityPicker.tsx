import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";

import { getElementAbsolutePosition, opacity2x, x2opacity } from "./ColorPicker";

const OpacityPickerRaw = ({ handleColorUpdate, rgb, getParentAbsolutePosition }: any) => {

	// rgb is a 4-number array, rgba
	const [rgbColor, setRgbColor] = React.useState(rgb);

	React.useEffect(() => {
		setRgbColor([...rgb]);
	}, [rgb]);

	return (
		<div
			style={{
				position: "relative",
				display: "inline-block",
				width: "100%",
				aspectRatio: "12/1",
				marginTop: 3,
				marginBottom: 3,
			}}
		>
			<_OpacityBg />
			<_OpacityPicker rgb={rgbColor} handleColorUpdate={handleColorUpdate} />
		</div>
	);
};

export const OpacityPicker = React.memo(OpacityPickerRaw);

const _OpacityBg = () => {
	const opacityStyleBG2 = `.opacity-style-bg2 { background: repeating-conic-gradient(#c0c0c0 0% 25%, transparent 0% 50%) 50% / 20px 20px}`;

	return (
		<div
			style={{
				position: "absolute",
				height: "100%",
				width: "100%",
				borderRadius: 2,
				display: "inline-block",
			}}
			className={"opacity-style-bg2"}
		>
			<style>{opacityStyleBG2}</style>
		</div>
	);
};

const _OpacityPicker = ({ handleColorUpdate, rgb }: any) => {
	const posRef = React.useRef(null);
	// fixed size
	const pickerSize = 10;
	const [x, setX] = React.useState(opacity2x(rgb[3], pickerSize, posRef));

	React.useEffect(() => {
		setX(opacity2x(rgb[3], pickerSize, posRef));
	}, [rgb]);

	React.useEffect(() => {
		// getBoundingClientRect() is not consistent upon first-time rendering
		setTimeout(() => {
			setX(opacity2x(opacity2x(rgb[3], pickerSize, posRef), pickerSize, posRef));
		}, 0);
	}, []);

	const handleMouseMove = (event: any) => {
		event.preventDefault();
		// calculate the coordinates first
		let opacityX = x;
		if (event.clientX > getElementAbsolutePosition(posRef).left + getElementAbsolutePosition(posRef).width - pickerSize / 2) {
			opacityX = getElementAbsolutePosition(posRef).width - pickerSize / 2;
		} else if (event.clientX < getElementAbsolutePosition(posRef).left + pickerSize / 2) {
			opacityX = pickerSize / 2;
		} else {
			opacityX = event.clientX - getElementAbsolutePosition(posRef).left;
		}

		setX(opacityX);
		// do not use x
		handleColorUpdate([rgb[0], rgb[1], rgb[2], x2opacity(opacityX, pickerSize, posRef)]);
	};

	const handleMouseDown = (event: any): void => {
		event.preventDefault();

		let opacityX = x;
		opacityX = Math.max(
			Math.min(event.clientX - getElementAbsolutePosition(posRef).left, getElementAbsolutePosition(posRef).width - pickerSize / 2),
			pickerSize / 2
		);
		setX(opacityX);
		// do not use x
		handleColorUpdate([rgb[0], rgb[1], rgb[2], x2opacity(opacityX, pickerSize, posRef)]);

		window.addEventListener("mousemove", handleMouseMove);
		window.addEventListener("mouseup", handleMouseUp);
	};

	const handleMouseUp = (event: any) => {
		event.preventDefault();
		window.removeEventListener("mousemove", handleMouseMove);
		window.removeEventListener("mouseup", handleMouseUp);
        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();
	};
	const opacityStyle2 = `.opacity-style-2 {background: linear-gradient(to right, rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0), rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 1))}`;

	return (
		<div
			ref={posRef}
			style={{
				position: "absolute",
				height: "100%",
				width: "100%",
				borderRadius: 2,
				display: "inline-block",
			}}
			className={"opacity-style-2"}
			onMouseDown={handleMouseDown}
		>
			<style>{opacityStyle2}</style>
			<div
				style={{
					left: x - pickerSize / 2,
					top: 0,
					width: pickerSize,
					height: "100%",
					borderRadius: 2,
					backgroundColor: "white",
					position: "absolute",
					display: "inline-block",
					borderStyle: "solid",
					borderWidth: "1px",
					borderColor: "black",
					boxSizing: "border-box",
				}}
			></div>
		</div>
	);
};
