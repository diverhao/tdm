import * as React from "react";
import { BaseWidgetSidebar } from "../../widgets/BaseWidget/BaseWidgetSidebar";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { SidebarComponent } from "./SidebarComponent";
import * as GlobalMethods from "../../../common/GlobalMethods"
import { Repeater } from "../../widgets/Repeater/Repeater";
import { ElementRectangleButton } from "../SharedElements/RectangleButton";
import { type_macros_tdl } from "../../../common/types/type_widget_tdl";
import { Macros } from "../../../common/Macros";

/**
 * Represents the X component in sidebar. <br>
 * 
 * It provides: (1) the JSX element, (2) the method to udpate the widget from sidebar, and (3) the method to 
 * update this sidebar component from widget.
 */
export class SidebarRepeaterRowsConfig extends SidebarComponent {
    constructor(sidebar: BaseWidgetSidebar) {
        super(sidebar);
    }

    _Element = () => {

        return (
            <div style={{
                width: "100%",
            }}>
                <ElementRectangleButton
                    handleMouseDown={(event) => {
                        const mainWidget = this.getSidebar().getMainWidget();
                        if (mainWidget instanceof Repeater) {
                            // mainWidget.showRowsConfigPage();
                            const largeInput = this.getSidebar().getSidebarLargeInput();

                            // [Macro1, Macro2] --> "SYS=RNG, SUBSYS=BPM\n SYS=BST, SUBSYS=BLM"
                            let widgetsMacrosStr: string = "";
                            for (const widgetMacros of mainWidget.getWidgetsMacros()) {
                                const widgetMacrosStr = widgetMacros.getStr();
                                widgetsMacrosStr = widgetsMacrosStr + widgetMacrosStr + "\n";
                            }
                            if (widgetsMacrosStr.endsWith("\n")) {
                                widgetsMacrosStr = widgetsMacrosStr.substring(0, widgetsMacrosStr.length - 1);
                            }

                            largeInput.createTextareaElement(
                                widgetsMacrosStr,
                                "Macros for each line in Repeater widget",
                                `Each row in below input box represents a row in the Repeater. The macros should be in form of SYS=RNG, SUBSYS=BPM`,
                                (macrosStr: string) => {
                                    // "SYS=RNG, SUBSYS=BPM\n SYS=BST, SUBSYS=BLM" --> [Macros1, Macros2]
                                    const macrosStrLines = macrosStr.split("\n");
                                    const widgetsMacros: Macros[] = [];

                                    for (const widgetMacrosStr of macrosStrLines) {
                                        const widgetMacros = Macros.fromStr(widgetMacrosStr);
                                        widgetsMacros.push(widgetMacros);
                                    }
                                    mainWidget.setWidgetsMacros(widgetsMacros);
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

    updateWidget = (event: React.SyntheticEvent | null | undefined) => {
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
