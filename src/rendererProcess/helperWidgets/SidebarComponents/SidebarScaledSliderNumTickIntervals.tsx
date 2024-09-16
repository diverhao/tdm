import * as React from "react";
import { BaseWidgetSidebar } from "../../widgets/BaseWidget/BaseWidgetSidebar";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { SidebarComponent } from "./SidebarComponent";
import { Log } from "../../global/Log";

/**
 * Represents the X component in sidebar. <br>
 * 
 * It provides: (1) the JSX element, (2) the method to udpate the widget from sidebar, and (3) the method to 
 * update this sidebar component from widget.
 */
export class SidebarScaledSliderNumTickIntervals extends SidebarComponent {
    constructor(sidebar: BaseWidgetSidebar) {
        super(sidebar);
    }

    _Element = () => {
        const [numTickIntervals, setNumTickIntervals] = React.useState<string>(`${this.getText()["numTickIntervals"]}`);

        return (
            <form
                onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.updateWidget(event, numTickIntervals)}
                style={this.getFormStyle()}
            >
                <div># intervals:</div>
                <input
                    style={{
                        ...this.getInputStyle(),
                        color: this.getText()["compactScale"] === true ? "rgba(100, 100, 100, 1)" : "rgba(0,0,0,1)",
                        width: "50%",
                    }}
                    type="text"
                    name="numTickIntervals"
                    value={numTickIntervals}
                    readOnly={this.getText()["compactScale"] === true ? true : false}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        const newVal = event.target.value;
                        setNumTickIntervals(newVal);
                    }}
                    // must use enter to change the value
                    onBlur={(event: any) => {
                        if (`${this.getText()["numTickIntervals"]}` !== numTickIntervals) {
                            setNumTickIntervals(`${this.getText()["numTickIntervals"]}`);
                        }
                    }}
                />
            </form>
        );
    };

    updateWidget = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        event.preventDefault();

        const oldVal = `${this.getText()["numTickIntervals"]}`;
        if (propertyValue === oldVal) {
            return;
        }
        else {
            const value = parseInt(`${propertyValue}`);
            if (!isNaN(value)) {
                this.getText()["numTickIntervals"] = value;
            } else {
                Log.error("Number of tick intervals cannot be converted to number");
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
