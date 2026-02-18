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
export class SidebarLEDBit extends SidebarComponent {
    constructor(sidebar: BaseWidgetSidebar) {
        super(sidebar);
    }
    
    _Element = () => {
        const [bit, setBit] = React.useState<string>(`${this.getText()["bit"]}`);

        return (
            <form onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                const bitNum = parseInt(bit);
                if (isNaN(bitNum)) {
                    setBit(`${this.getText()["bit"]}`);
                } else {
                    this.updateWidget(event, bitNum);
                }
            }
            }
                style={this.getFormStyle()}
            >
                <div>Bit:</div>
                <input
                    style={this.getInputStyle()}
                    type="text"
                    name="left"
                    value={bit}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        const newVal = event.target.value;
                        setBit(newVal);
                    }}
                    // must use enter to change the value
                    onBlur={(event: any) => {
                        if (parseInt(bit) !== this.getText()["bit"]) {
                            setBit(`${this.getText()["bit"]}`);
                        }
                    }}
                />
            </form>
        );
    };

    updateWidget = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        event.preventDefault();

        const oldVal = this.getText()["bit"];
        if (propertyValue === oldVal) {
            return;
        } else {
            this.getText()["bit"] = propertyValue;
        }

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };
}
