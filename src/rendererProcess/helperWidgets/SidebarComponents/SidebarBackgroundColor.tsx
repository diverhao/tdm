import * as React from "react";
import { BaseWidgetSidebar } from "../../widgets/BaseWidget/BaseWidgetSidebar";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { SidebarComponent } from "./SidebarComponent";
import { Collapsible } from "../ColorPicker/Collapsible";
import * as GlobalMethods from "../../../common/GlobalMethods";

/**
 * Represents the X component in sidebar. <br>
 *
 * It provides: (1) the JSX element, (2) the method to udpate the widget from sidebar, and (3) the method to
 * update this sidebar component from widget.
 */
export class SidebarBackgroundColor extends SidebarComponent {
    constructor(sidebar: BaseWidgetSidebar) {
        super(sidebar);
    }

    _Element = ({ hideText }: any) => {
        return (
            <Collapsible
                rgbColorStr={this.getMainWidget().getStyle().backgroundColor}
                updateFromSidebar={(event: any, propertyName: string, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
                    this.updateWidget(event, propertyValue);
                }}
                title={hideText === true ? "" : "Color"}
                eventName={"background-color"}
            />
        );
    };

    updateWidget = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        // no event

        const newVal = GlobalMethods.rgbaArrayToRgbaStr(propertyValue as number[]);
        const oldVal = this.getStyle()["backgroundColor"];
        if (newVal === oldVal) {
            return;
        } else {
            this.getStyle()["backgroundColor"] = newVal;
        }

        // the history is handled inside Collapsible

        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };
}
