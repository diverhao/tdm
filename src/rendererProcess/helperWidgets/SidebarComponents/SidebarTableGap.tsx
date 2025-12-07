import * as React from "react";
import { BaseWidgetSidebar } from "../../widgets/BaseWidget/BaseWidgetSidebar";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { SidebarComponent } from "./SidebarComponent";
import * as GlobalMethods from "../../../common/GlobalMethods"

/**
 * Represents the X component in sidebar. <br>
 * 
 * It provides: (1) the JSX element, (2) the method to udpate the widget from sidebar, and (3) the method to 
 * update this sidebar component from widget.
 */
export class SidebarTableGap extends SidebarComponent {
    constructor(sidebar: BaseWidgetSidebar) {
        super(sidebar);
    }

    _Element = () => {
        const [gap, setGap] = React.useState<string>(`${this.getText().gap}`);

        return (
            <form
                onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.updateWidget(event, gap)}
                style={this.getFormStyle()}
            >
                <div>Gap:</div>
                <input
                    style={this.getInputStyle()}
                    type="text"
                    name="gap"
                    value={gap}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        setGap(event.target.value);
                    }}
                    // must use enter to change the value
                    onBlur={(event: any) => {
                        if (gap !== `${this.getText()["gap"]}`) {
                            setGap(`${this.getText()["gap"]}`);
                        }
                    }}
                />
            </form>
        );
    };

    updateWidget = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        event.preventDefault();

        const oldValStr = `${this.getText()["gap"]}`;
        if (propertyValue === oldValStr) {
            return;
        } else {
            if (typeof propertyValue !== "string") {
                return;
            }
            const newVal = parseInt(propertyValue);
            if (isNaN(newVal)) {
                return;
            }
            this.getText()["gap"] = newVal;
        }

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };
}
