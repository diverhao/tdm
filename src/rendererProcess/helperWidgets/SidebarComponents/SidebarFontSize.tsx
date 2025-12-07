import * as React from "react";
import { BaseWidgetSidebar } from "../../widgets/BaseWidget/BaseWidgetSidebar";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { SidebarComponent } from "./SidebarComponent";
import * as GlobalMethods from "../../../common/GlobalMethods";
import { FontsData } from "../../global/FontsData";

/**
 * Represents the X component in sidebar. <br>
 *
 * It provides: (1) the JSX element, (2) the method to udpate the widget from sidebar, and (3) the method to
 * update this sidebar component from widget.
 */
export class SidebarFontSize extends SidebarComponent {
	constructor(sidebar: BaseWidgetSidebar) {
		super(sidebar);
	}

	findNearestNumberIndex = (numbers: number[], number: number): number => {
		if (numbers.includes(number)) {
			return numbers.indexOf(number);
		}
		let index = 0;
		let smallestNumber = 1000000;
		for (let ii = 0; ii < numbers.length; ii++) {
			if (Math.abs(number - numbers[ii]) < smallestNumber) {
				index = ii;
                smallestNumber = Math.abs(number - numbers[ii]);
			}
		}
		return index;
	};

	findSelectedOptionIndex = () => {
		if (typeof this.getStyle()["fontSize"] === "number") {
            return this.findNearestNumberIndex(FontsData.g_fontSizes, this.getStyle()["fontSize"]);
		} else {
			return FontsData.g_fontSizes.indexOf(14);
		}
	};

	_Element = ({hideText}: any) => {
		// const fontSizes: number[] = g_fontSizes;
        const selectedIndex = this.findSelectedOptionIndex();

		return (
			<form style={{ ...this.getFormStyle(), transition: "all .1s ease-in", width: "100%" }}>
                {hideText === true ? null : <div>Size:</div>}
				<select
					style={{...this.getInputStyle(), fontFamily: "inherit"}}
					onChange={(event: any) => {
						this.updateWidget(event, parseInt(event.target.value));
					}}
				>
					{FontsData.g_fontSizes.map((fontSize: number, index: number) => {
						// let selected = false;
						// if (!fontSizes.includes(this.getStyle()["fontSize"]) && index === 0) {
						// 	if (typeof this.getStyle()["fontSize"] === "number") {
						// 		const nearestIndex = this.findNearestNumberIndex(fontSizes, this.getStyle()["fontSize"]);
						// 		if (index === nearestIndex) {
						// 			selected = true;
						// 		}
						// 	} else {
						// 		selected = true;
						// 	}
						// }
						// if (this.getStyle()["fontSize"] === fontSize) {
						// 	selected = true;
						// }

						return <option selected={index === selectedIndex}>{fontSize}</option>;
					})}
				</select>
			</form>
		);
	};

	updateWidget = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
		event.preventDefault();

		const oldVal = this.getStyle()["fontSize"];
		if (propertyValue === oldVal) {
			return;
		} else {
			this.getStyle()["fontSize"] = propertyValue;
		}

		const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
		history.registerAction();

		g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
		g_widgets1.addToForceUpdateWidgets("GroupSelection2");

		g_flushWidgets();
	};
}
