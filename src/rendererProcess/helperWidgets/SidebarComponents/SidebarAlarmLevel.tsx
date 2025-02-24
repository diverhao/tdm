import * as React from "react";
import { BaseWidgetSidebar } from "../../widgets/BaseWidget/BaseWidgetSidebar";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { SidebarComponent } from "./SidebarComponent";
import * as GlobalMethods from "../../global/GlobalMethods";
import { FontsData } from "../../global/FontsData";

/**
 * Represents the X component in sidebar. <br>
 *
 * It provides: (1) the JSX element, (2) the method to udpate the widget from sidebar, and (3) the method to
 * update this sidebar component from widget.
 */
export class SidebarAlarmLevel extends SidebarComponent {
    constructor(sidebar: BaseWidgetSidebar) {
        super(sidebar);
    }

    _Element = () => {

        const alarmLevel = this.getText()["alarmLevel"];

        return (
            <form style={{ ...this.getFormStyle(), transition: "all .1s ease-in", width: "100%" }}>
                Alarm level:
                <select
                    style={{ ...this.getInputStyle(), fontFamily: "inherit", width: "50%" }}
                    onChange={(event: any) => {
                        this.updateWidget(event, event.target.value);
                    }}
                    // defaultValue={"MINOR"}
                >
                    <option selected={alarmLevel === "MINOR"} value={"MINOR"}>&ge; MINOR</option>
                    <option selected={alarmLevel === "MAJOR"} value={"MAJOR"}>&ge; MAJOR</option>
                    <option selected={alarmLevel === "INVALID"} value={"INVALID"}>= INVALID</option>
                </select>
            </form>
        );
    };

    updateWidget = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        event.preventDefault();

        const oldVal = this.getText()["alarmLevel"];
        if (propertyValue === oldVal) {
            return;
        } else {
            this.getText()["alarmLevel"] = propertyValue;
        }

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };
}
