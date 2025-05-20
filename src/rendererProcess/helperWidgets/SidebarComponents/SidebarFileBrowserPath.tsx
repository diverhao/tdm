import * as React from "react";
import { BaseWidgetSidebar } from "../../widgets/BaseWidget/BaseWidgetSidebar";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { SidebarComponent } from "./SidebarComponent";
import * as GlobalMethods from "../../global/GlobalMethods"

/**
 * Represents the X component in sidebar. <br>
 *
 * It provides: (1) the JSX element, (2) the method to udpate the widget from sidebar, and (3) the method to
 * update this sidebar component from widget.
 */
export class SidebarFileBrowserPath extends SidebarComponent {
	constructor(sidebar: BaseWidgetSidebar) {
		super(sidebar);
	}

	_Element = () => {
		const [path, setPath] = React.useState<string>(this.getText()["path"]);

        return (
			<form
				onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
					this.updateWidget(event, path);
				}}
				style={this.getFormStyle()}
			>
                <this._ElementInputLabel
                    value={path}
                    setValue={setPath}
                    readableText={"Path"}
                    updater={(newValue: string) => { this.updateWidget(undefined, newValue) }}
                >
                    Path:
                </this._ElementInputLabel>
				<input
					style={{ ...this.getInputStyle(), width: "65.6%"  }}
					type="string"
					name="text"
					value={path}
					onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
						const newVal = event.target.value;
						setPath(newVal);
					}}
					// must use enter to change the value
					onBlur={(event: any) => {
						const orig = this.getText()["path"];
						if (orig !== path) {
							setPath(orig);
						}
					}}
				/>
			</form>
		);
	};

	updateWidget = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
		event?.preventDefault();

		const oldVal = this.getText()["path"];

		if (propertyValue === oldVal) {
			return;
		} else {
			this.getText()["path"] = propertyValue;
		}

		const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
		history.registerAction();

		g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
		g_widgets1.addToForceUpdateWidgets("GroupSelection2");

		g_flushWidgets();
	};
}
