import * as React from "react";
import { GlobalVariables } from "../../global/GlobalVariables";
import { PresetColor } from "./PresetColor";

export const PresetColors = ({ rgb, handleColorUpdate }: any) => {
	const PresetColorList = GlobalVariables.presetColors;

	const matchPresetColor = (newColor: number[]) => {
		for (let ii in PresetColorList) {
			if (
				PresetColorList[ii][0] === newColor[0] &&
				PresetColorList[ii][1] === newColor[1] &&
				PresetColorList[ii][2] === newColor[2] &&
				PresetColorList[ii][3] === newColor[3]
			) {
				return ii;
			}
		}
		return "";
	};

	const [selectedColorName, setSelectedColorName] = React.useState(matchPresetColor(rgb));
	const [overedColorName, setOveredColorName] = React.useState("");

	React.useEffect(() => {
		setSelectedColorName(matchPresetColor(rgb));
	}, [rgb]);

	return (
		<div
			style={{
				position: "relative",
				display: "inline-block",
				width: "100%",
				marginTop: 3,
				marginBottom: 3,
			}}
		>
			<div>{overedColorName === "" ? selectedColorName : overedColorName} &nbsp;</div>
			<div
				style={{
					position: "relative",
					display: "inline-flex",
					justifyContent: "flex-start",
					alignItems: "center",
					flexWrap: "wrap",
					flexDirection: "row",
					width: "100%",
				}}
			>
				{Object.keys(PresetColorList).map((key, index) => {
					return (
						<PresetColor
							colorName={key}
							handleColorUpdate={handleColorUpdate}
							setOveredColorName={setOveredColorName}
							setSelectedColorName={setSelectedColorName}
							selectedColorName={selectedColorName}
						></PresetColor>
					);
				})}
			</div>
		</div>
	);
};
