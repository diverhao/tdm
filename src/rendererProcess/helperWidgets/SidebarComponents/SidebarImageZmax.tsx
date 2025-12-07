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
export class SidebarImageZmax extends SidebarComponent {
    constructor(sidebar: BaseWidgetSidebar) {
        super(sidebar);
    }

    _Element = () => {
        const [zMax, setZmax] = React.useState<string>(`${this.getText().zMax}`);

        return (
            <form
                onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.updateWidget(event, zMax)}
                style={this.getFormStyle()}
            >
                <div style={{whiteSpace: "nowrap"}}>Max.: </div>
                <input
                    style={{...this.getInputStyle(), width: "60%"}}
                    type="text"
                    name="zMax"
                    value={zMax}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        const newVal = event.target.value;
                        setZmax(newVal);
                    }}
                    // must use enter to change the value
                    onBlur={(event: any) => {
                        if (zMax !== `${this.getText().zMax}`) {
                            setZmax(`${this.getText().zMax}`)
                        }
                    }}
                />
            </form>
        );
    };

    updateWidget = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        event.preventDefault();

        const oldVal = this.getText()["zMax"];
        if (propertyValue === `${oldVal}`) {
            return;
        }
        else {
            const newValue = parseInt(`${propertyValue}`);
            if (!isNaN(newValue)) {
                this.getText()["zMax"] = newValue;
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
