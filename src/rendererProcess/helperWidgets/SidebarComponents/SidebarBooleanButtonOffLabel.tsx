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
export class SidebarBooleanButtonOffLabel extends SidebarComponent {
    constructor(sidebar: BaseWidgetSidebar) {
        super(sidebar);
    }

    _Element = () => {
        const [offLabel, setOffLabel] = React.useState<string>(this.getText()["offLabel"]);

        return (
            <form
                onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                    this.updateWidget(event, offLabel);
                }}
                style={this.getFormStyle()}
            >
                <this._ElementInputLabel
                    value={`${offLabel}`}
                    setValue={setOffLabel}
                    readableText={"Off Label value"}
                    updater={(newValue: string) => this.updateWidget(undefined, newValue)}
                >
                    Label:
                </this._ElementInputLabel>
                <input
                    style={{ ...this.getInputStyle(), width: "60%" }}
                    type="string"
                    name="offLabel"
                    value={offLabel}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        const newVal = event.target.value;
                        setOffLabel(newVal);
                    }}
                    // must use enter to change the value
                    onBlur={(event: any) => {
                        const orig = this.getText()["offLabel"];
                        if (orig !== offLabel) {
                            setOffLabel(orig);
                        }
                    }}
                />
            </form>
        );
    };

    updateWidget = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        event.preventDefault();

        const oldVal = this.getText()["offLabel"];

        if (propertyValue === oldVal) {
            return;
        } else {
            this.getText()["offLabel"] = propertyValue;
        }

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };
}
