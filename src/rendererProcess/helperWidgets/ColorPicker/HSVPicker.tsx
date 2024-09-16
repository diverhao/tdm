import * as React from "react";
import { rgb2hsv, hsv2rgb } from "./Helper";
import { getElementAbsolutePosition, hsv2xxy, xxy2hsv } from "./ColorPicker";
import { g_widgets1 } from "../../global/GlobalVariables";



const HSVPickerRaw = ({ handleColorUpdate, rgb }: any) => {
	const [hsv, setHsv] = React.useState(rgb2hsv(rgb));

	React.useEffect(() => {
		setHsv(rgb2hsv(rgb));
	}, [rgb]);

	return (
		<>
			{/* saturate and light picker */}
			<div
				style={{
					position: "relative",
					display: "inline-block",
					width: "100%",
					aspectRatio: "1/1",
                    marginTop: 3,
                    marginBottom: 3,
    
				}}
			>
				{/* saturation and lightness pickers */}
				<_SatLitBg hsv={hsv} />
				<_SatLitPicker hsv={hsv} handleColorUpdate={handleColorUpdate} setHsv={setHsv} />
			</div>

			{/* hue picker */}
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
				<_HueBg />
				<_HuePicker hsv={hsv} handleColorUpdate={handleColorUpdate} setHsv={setHsv} />
			</div>
		</>
	);
};

export const HSVPicker = React.memo(HSVPickerRaw);

const _SatLitBg = ({ hsv }: any) => {
	const satLitBgStyle: string = `
    .saturation-white {
      background: linear-gradient(to right, #fff, rgba(255,255,255,0));
    }
    .saturation-black {
      background: linear-gradient(to top, #000, rgba(0,0,0,0));
    }`;

	return (
		<>
			{/* color */}
			<div
				style={{
					position: "absolute",
					width: "100%",
					height: "100%",
					background: `hsl(${hsv[0]}, 100%, 50%)`,
					opacity: 1,
				}}
			>
				{" "}
				<style>{satLitBgStyle}</style>{" "}
			</div>
			{/* white background */}
			<div
				style={{
					position: "absolute",
					width: "100%",
					height: "100%",

					opacity: 1,
				}}
				className="saturation-white"
			></div>
			{/* black background */}
			<div
				style={{
					position: "absolute",
					width: "100%",
					height: "100%",
					opacity: 1,
				}}
				className="saturation-black"
			></div>
		</>
	);
};

const _SatLitPicker = ({ hsv, handleColorUpdate, setHsv}: any) => {
	const posRef = React.useRef(null);
	const pickerSize = 14;
	const [xxy, setXxy] = React.useState(hsv2xxy(hsv, pickerSize, posRef));

    React.useEffect(() => {
        setXxy(hsv2xxy(hsv, pickerSize, posRef));
    }, [hsv])

	React.useEffect(() => {
		// getBoundingClientRect() is not consistent upon first-time rendering
		setTimeout(() => {
			setXxy(hsv2xxy(hsv, pickerSize, posRef));
		}, 0);
	}, []);

	const handleMouseDown = (event: any): void => {
		event.preventDefault();

		let hueX = xxy[0];
		let satX = xxy[1];
		let valY = xxy[2];
		let opacity = xxy[3];

		satX = Math.max(Math.min(event.clientX - getElementAbsolutePosition(posRef).left, getElementAbsolutePosition(posRef).width), 0);
		valY = Math.max(Math.min(event.clientY - getElementAbsolutePosition(posRef).top, getElementAbsolutePosition(posRef).width), 0);

        handleColorUpdate(hsv2rgb(xxy2hsv([hueX, satX, valY, opacity], pickerSize, posRef)));

		setXxy([hueX, satX, valY, opacity]);
        setHsv(xxy2hsv([hueX, satX, valY, opacity], pickerSize, posRef));

		window.addEventListener("mousemove", handleMouseMove);
		window.addEventListener("mouseup", handleMouseUp);
	};

	const handleMouseMove = (event: any) => {
		event.preventDefault();

		// calculate the coordinates first
		let hueX = xxy[0];
		let satX = xxy[1];

		if (event.clientX > getElementAbsolutePosition(posRef).left + getElementAbsolutePosition(posRef).width) {
			satX = getElementAbsolutePosition(posRef).width;
		} else if (event.clientX < getElementAbsolutePosition(posRef).left) {
			satX = 0;
		} else {
			satX = event.clientX - getElementAbsolutePosition(posRef).left;
		}

		let valY = xxy[2];
		if (event.clientY > getElementAbsolutePosition(posRef).top + getElementAbsolutePosition(posRef).width) {
			valY = getElementAbsolutePosition(posRef).width;
		} else if (event.clientY < getElementAbsolutePosition(posRef).top) {
			valY = 0;
		} else {
			valY = event.clientY - getElementAbsolutePosition(posRef).top;
		}

		let opacity = xxy[3];

		setXxy([hueX, satX, valY, opacity]);
        setHsv(xxy2hsv([hueX, satX, valY, opacity], pickerSize, posRef));

        handleColorUpdate(hsv2rgb(xxy2hsv([hueX, satX, valY, opacity], pickerSize, posRef)));

	};

	const handleMouseUp = (event: any) => {
		event.preventDefault();
		window.removeEventListener("mousemove", handleMouseMove);
		window.removeEventListener("mouseup", handleMouseUp);
        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();
	};

	return (
		<div
			style={{
				position: "absolute",
				width: "100%",
				height: "100%",
				backgroundColor: "rgba(255, 0, 0, 0)",
                overflow: "hidden"
			}}
			onMouseDown={handleMouseDown}
			ref={posRef}
		>
			<div
				style={{
					position: "absolute",
					left: xxy[1] - pickerSize / 2,
					top: xxy[2] - pickerSize / 2,
					width: pickerSize,
					height: pickerSize,
					backgroundColor: "transparent",
					borderRadius: "50%",
					borderWidth: 2,
					borderColor: "white",
					borderStyle: "solid",
					opacity: 1,
                    boxSizing: "border-box"
				}}
			>
				{" "}
			</div>
		</div>
	);
};

const _HueBg = () => {
	const hueStyle2 = `.hue-horizontal { background: linear-gradient(to right, #f00 0%, #ff0 17%, #0f0
        33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%);}`;

	return (
		<div
			className={"hue-horizontal"}
			style={{
				position: "absolute",
				display: "inline-block",
				width: "100%",
                height: "100%",
				backgroundColor: "rgba(0,0,255, 0.3)",
			}}
		>
			<style>{hueStyle2}</style>
		</div>
	);
};

const _HuePicker = ({ setHsv, hsv, handleColorUpdate}: any) => {
	const posRef = React.useRef(null);

    // fixed size
	const pickerSize = 10;
	const [xxy, setXxy] = React.useState(hsv2xxy(hsv, pickerSize, posRef));

    React.useEffect(() => {
        setXxy(hsv2xxy(hsv, pickerSize, posRef));
    }, [hsv])

	React.useEffect(() => {
		// getBoundingClientRect() is not consistent upon first-time rendering
		setTimeout(() => {
			setXxy(hsv2xxy(hsv, pickerSize, posRef));
		}, 0);
	}, []);

	const handleMouseMove = (event: any) => {
		event.preventDefault();

		let hueX = xxy[0];
		if (event.clientX > getElementAbsolutePosition(posRef).left + getElementAbsolutePosition(posRef).width - pickerSize / 2) {
			hueX = getElementAbsolutePosition(posRef).width - pickerSize / 2;
		} else if (event.clientX < getElementAbsolutePosition(posRef).left + pickerSize / 2) {
			hueX = pickerSize / 2;
		} else {
			hueX = event.clientX - getElementAbsolutePosition(posRef).left;
		}

		let satX = xxy[1];
		let valY = xxy[2];
		let opacity = xxy[3];
		setXxy([hueX, satX, valY, opacity]);

        setHsv(xxy2hsv([hueX, satX, valY, opacity], pickerSize, posRef));


        handleColorUpdate(hsv2rgb(xxy2hsv([hueX, satX, valY, opacity], pickerSize, posRef)));

	};

	const handleMouseDown = (event: any): void => {
		event.preventDefault();

		let hueX = xxy[0];
		let satX = xxy[1];
		let valY = xxy[2];
		let opacity = xxy[3];

		hueX = Math.max(
			Math.min(event.clientX - getElementAbsolutePosition(posRef).left, getElementAbsolutePosition(posRef).width - pickerSize / 2),
			pickerSize / 2
		);

		setXxy([hueX, satX, valY, opacity]);

        setHsv(xxy2hsv([hueX, satX, valY, opacity], pickerSize, posRef));

        handleColorUpdate(hsv2rgb(xxy2hsv([hueX, satX, valY, opacity], pickerSize, posRef)));

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

	return (
		<div
			ref={posRef}
			style={{
				position: "absolute",
				display: "inline-block",
				width: "100%",
                height: "100%",
				backgroundColor: "rgba(255,255,0, 0)",
			}}
			onMouseDown={handleMouseDown}
		>
			<div
				style={{
					position: "absolute",
					left: xxy[0] - pickerSize / 2,
					top: 0,
					height: "100%",
					width: pickerSize,
					backgroundColor: "white",
					borderRadius: "2px",
					borderWidth: "1px",
					borderColor: "black",
					borderStyle: "solid",
                    boxSizing: "border-box"
				}}
			>
				{" "}
			</div>
		</div>
	);
};
