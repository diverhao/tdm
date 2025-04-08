import * as React from "react";
import { BaseWidgetSidebar } from "../../widgets/BaseWidget/BaseWidgetSidebar";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { SidebarComponent } from "./SidebarComponent";
import * as GlobalMethods from "../../global/GlobalMethods"
import { Table } from "../../widgets/Table/Table";
import { ElementRectangleButton } from "../SharedElements/RectangleButton";

/**
 * Represents the X component in sidebar. <br>
 * 
 * It provides: (1) the JSX element, (2) the method to udpate the widget from sidebar, and (3) the method to 
 * update this sidebar component from widget.
 */
export class SidebarTableRowsConfig extends SidebarComponent {
    constructor(sidebar: BaseWidgetSidebar) {
        super(sidebar);
    }

    _Element = () => {

        return (
            <div style={{
                width: "100%",
            }}>
                <ElementRectangleButton
                    handleMouseDown={(event: any) => {
                        const mainWidget = this.getSidebar().getMainWidget();
                        if (mainWidget instanceof Table) {
                            // mainWidget.showRowsConfigPage();
                            const largeInput = this.getSidebar().getSidebarLargeInput();
                            largeInput.createTextareaElement(
                                mainWidget.serializeMacros(),
                                "Macros for each line in Table widget",
                                `Each row in below input box represents a row in the Table. The macros should be in form of SYS=RNG, SUBSYS=BPM`,
                                (macrosStr: string) => {
                                    const macros = mainWidget.deserializeMacros(macrosStr);
                                    mainWidget.setMacros(macros);
                                    this.updateWidget(undefined);
                                }
                            )
                        }
                    }}
                >
                    Configure
                </ElementRectangleButton>
            </div>
        );
    };

    updateWidget = (event: any) => {
        event?.preventDefault();

        // const oldVal = this.getStyle()["width"];
        // if (propertyValue === oldVal) {
        // 	return;
        // }
        // else {
        //     this.getStyle()["width"] = propertyValue;
        // }

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };
}
