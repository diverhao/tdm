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
export class SidebarImageXmin extends SidebarComponent {
    constructor(sidebar: BaseWidgetSidebar) {
        super(sidebar);
    }

    _Element = () => {
        const [xMin, setXmin] = React.useState<string>(`${this.getText().xMin}`);

        return (
            <form
                onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.updateWidget(event, xMin)}
                style={this.getFormStyle()}
            >
                <div style={{whiteSpace: "nowrap"}}>X min.:</div>
                <input
                    style={{...this.getInputStyle(), width: "60%"}}
                    type="text"
                    name="xMin"
                    value={xMin}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        const newVal = event.target.value;
                        setXmin(newVal);
                    }}
                    // must use enter to change the value
                    onBlur={(event: any) => {
                        if (xMin !== `${this.getText().xMin}`) {
                            setXmin(`${this.getText().xMin}`)
                        }
                    }}
                />
            </form>
        );
    };

    updateWidget = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        event.preventDefault();

        const oldVal = this.getText()["xMin"];
        if (propertyValue === `${oldVal}`) {
            return;
        }
        else {
            const newValue = parseInt(`${propertyValue}`);
            if (!isNaN(newValue)) {
                this.getText()["xMin"] = newValue;
            } else {
                return;
            }

        }

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };
}
