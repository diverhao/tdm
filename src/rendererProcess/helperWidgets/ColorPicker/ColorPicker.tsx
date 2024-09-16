import * as React from "react";
import { HexInput,  } from "./HexInput";
import { RGBInput,  } from "./RGBInput";
import { HSVPicker,  } from "./HSVPicker";
import { OpacityPicker } from "./OpacityPicker";
import { PresetColors } from "./PresetColors";

// ---------------------- functions -----------------------

export const getElementAbsolutePosition = (elementRef: React.MutableRefObject<any>) => {
	if (elementRef.current) {
		return {
			left: elementRef.current.getBoundingClientRect().left,
			top: elementRef.current.getBoundingClientRect().top,
			width: elementRef.current?.clientWidth + 2,
			height: elementRef.current?.clientHeight,
		};
	} else {
		return {
			left: 0,
			top: 0,
			width: 3.1415926,
			height: 0,
		};
	}
};

export const hsv2xxy = (
	hsv: [number, number, number, number],
	pickerSize: number,
	elementRef: React.MutableRefObject<any>
): [number, number, number, number] => {
	let hue = hsv[0];
	let sat = hsv[1];
	let val = hsv[2];
	const hueX = Math.round(pickerSize / 2 + (hue / 360) * (getElementAbsolutePosition(elementRef).width - pickerSize));
	const satX = Math.round((sat / 100) * getElementAbsolutePosition(elementRef).width);
	const valY = Math.round((1 - val / 100) * getElementAbsolutePosition(elementRef).width);
	return [hueX, satX, valY, hsv[3]];
};

export const xxy2hsv = (
	xxy: [number, number, number, number],
	pickerSize: number,
	elementRef: React.MutableRefObject<any>
): [number, number, number, number] => {
	let hueX = xxy[0];
	let satX = xxy[1];
	let valY = xxy[2];
	let hue = (360 * (hueX - pickerSize / 2)) / (getElementAbsolutePosition(elementRef).width - pickerSize);
	let sat = (100 * satX) / getElementAbsolutePosition(elementRef).width;
	let val = 100 * (1 - valY / getElementAbsolutePosition(elementRef).width);
	return [hue, sat, val, xxy[3]];
};

export const opacity2x = (opacity: number, pickerSize: number, elementRef: React.MutableRefObject<any>): number => {
	const opacityX = Math.round(pickerSize / 2 + (opacity / 100) * (getElementAbsolutePosition(elementRef).width - pickerSize));
	return opacityX;
};

export const x2opacity = (x: number, pickerSize: number, elementRef: React.MutableRefObject<any>): number => {
	let opacity = Math.round((100 * (x - pickerSize / 2)) / (getElementAbsolutePosition(elementRef).width - pickerSize));
	return opacity;
};

// --------------------- component ------------------------------

// it takes rgb array
const ColorPickerRaw = ({ rgbColor, handleColorUpdate }: any) => {
	// rgb
	const [rgb4HSVPicker, setRgb4HSVPicker] = React.useState(rgbColor);
	const [rgb4RGBInput, setRgb4RGBInput] = React.useState(rgbColor);
	const [rgb4HexInput, setRgb4HexInput] = React.useState(rgbColor);
	const [rgb4OpacityPicker, setRgb4OpacityPicker] = React.useState(rgbColor);
	const [rgb4PresetColors, setRgb4PresetColors] = React.useState(rgbColor);

	// update other color pickers
	const handleColorUpdateHsvPicker = (newRgb: [number, number, number, number]) => {
		setRgb4RGBInput([...newRgb]);
		setRgb4HexInput([...newRgb]);
		setRgb4OpacityPicker([...newRgb]);
        setRgb4PresetColors([...newRgb]);
		handleColorUpdate([...newRgb]);
	};

	const handleColorUpdateRGBInput = (newRgb: [number, number, number, number]) => {
		setRgb4HSVPicker([...newRgb]);
		setRgb4HexInput([...newRgb]);
		setRgb4OpacityPicker([...newRgb]);
        setRgb4PresetColors([...newRgb]);
		handleColorUpdate([...newRgb]);
	};
	const handleColorUpdateHexInput = (newRgb: [number, number, number, number]) => {
		setRgb4HSVPicker([...newRgb]);
		setRgb4RGBInput([...newRgb]);
		setRgb4OpacityPicker([...newRgb]);
        setRgb4PresetColors([...newRgb]);
		handleColorUpdate([...newRgb]);
	};

	const handleColorUpdateOpacityPicker = (newRgb: [number, number, number, number]) => {
		setRgb4HSVPicker([...newRgb]);
		setRgb4HexInput([...newRgb]);
		setRgb4RGBInput([...newRgb]);
        setRgb4PresetColors([...newRgb]);
		handleColorUpdate([...newRgb]);
	};

    const handleColorUpdatePresetColors = (newRgb: [number, number, number, number]) => {
		setRgb4HSVPicker([...newRgb]);
		setRgb4HexInput([...newRgb]);
		setRgb4RGBInput([...newRgb]);
		setRgb4OpacityPicker([...newRgb]);
		handleColorUpdate([...newRgb]);
	};

	return (
		<div
			style={{
				width: "100%",
				display: "inline-flex",
				flexDirection: "column",
				position: "relative",
			}}
		>
			<HSVPicker rgb={rgb4HSVPicker} handleColorUpdate={handleColorUpdateHsvPicker}></HSVPicker>

			<RGBInput style={{}} rgb={rgb4RGBInput} handleColorUpdate={handleColorUpdateRGBInput}></RGBInput>

			<HexInput rgb={rgb4HexInput} handleColorUpdate={handleColorUpdateHexInput}></HexInput>

			<div>Opacity</div>
			<OpacityPicker rgb={rgb4OpacityPicker} handleColorUpdate={handleColorUpdateOpacityPicker}></OpacityPicker>

			<PresetColors
				rgb={rgb4PresetColors}
				handleColorUpdate={handleColorUpdatePresetColors}
			/>
		</div>
	);
};

export const ColorPicker = React.memo(ColorPickerRaw);
