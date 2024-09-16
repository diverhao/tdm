import * as React from "react";
import { BaseWidgetSidebar } from "../../widgets/BaseWidget/BaseWidgetSidebar";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { SidebarComponent } from "./SidebarComponent";

/**
 * Represents the X component in sidebar. <br>
 *
 * It provides: (1) the JSX element, (2) the method to udpate the widget from sidebar, and (3) the method to
 * update this sidebar component from widget.
 */
export class SidebarWidgetAppearance extends SidebarComponent {
    constructor(sidebar: BaseWidgetSidebar) {
        super(sidebar);
    }

    _Element = () => {
        const [appearance, setAppearance] = React.useState(this.getText()["appearance"]);

        return (
            <form style={{ ...this.getFormStyle(), transition: "all .1s ease-in", width: "100%" }}>
                {/* "Appearance" is too long */}
                <div>Style:</div>
                <select
                    style={{ ...this.getInputStyle(), fontFamily: "inherit" }}
                    onChange={(event: any) => {
                        this.updateWidget(event, event.target.value);
                    }}
                >
                    <option selected={appearance === "traditional"}>{`Traditional`}</option>
                    <option selected={appearance === "contemporaray"}>{`Contemporary`}</option>
                </select>
            </form>
        );
    };

    updateWidget = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        event.preventDefault();

        const oldVal = this.getText()["appearance"];
        if (propertyValue === oldVal) {
            return;
        } else {
            this.getText()["appearance"] = `${propertyValue}`.toLowerCase();
        }

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };
}
