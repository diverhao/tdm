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
export class SidebarTankScalePosition extends SidebarComponent {
    constructor(sidebar: BaseWidgetSidebar) {
        super(sidebar);
    }

    _Element = () => {
        const [scalePosition, setScalePosition] = React.useState(this.getText()["scalePosition"]);

        return (
            <form style={{ ...this.getFormStyle(), transition: "all .1s ease-in", width: "100%" }}>
                <div>Scale position:</div>
                <select
                    style={{ ...this.getInputStyle(), fontFamily: "inherit" }}
                    onChange={(event: any) => {
                        this.updateWidget(event, event.target.value);
                    }}
                >
                    <option selected={scalePosition === "left"}>{`Left`}</option>
                    <option selected={scalePosition === "right"}>{`Right`}</option>
                </select>
            </form>
        );
    };

    updateWidget = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        event.preventDefault();

        const oldVal = this.getText()["scalePosition"];
        if (propertyValue === oldVal) {
            return;
        } else {
            this.getText()["scalePosition"] = `${propertyValue}`.toLowerCase();
        }

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };
}
