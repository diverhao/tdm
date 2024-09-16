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
export class SidebarDisplayScale extends SidebarComponent {
    constructor(sidebar: BaseWidgetSidebar) {
        super(sidebar);
    }

    _Element = () => {
        return (
            <form
                onSubmit={(event: React.FormEvent<HTMLFormElement>) => event.preventDefault()}
                style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                }}
            >
                <div>Scale:</div>
                <select
                    style={{ fontFamily: "inherit", width: "60%" }}
                    onChange={(event: any) => {
                        this.updateWidget(event, event.target.value);
                    }}
                >
                    <option selected>{"Linear"}</option>
                    <option selected={this.getMainWidget().getAllText()["displayScale"] === "Log10"}>{"Log10"}</option>
                </select>
            </form>
        );
    };


    updateWidget = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        // do not preventDefault()

        const oldVal = this.getText()["displayScale"];
        if (propertyValue === oldVal) {
            return;
        } else {
            this.getText()["displayScale"] = propertyValue;
        }

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };
}
