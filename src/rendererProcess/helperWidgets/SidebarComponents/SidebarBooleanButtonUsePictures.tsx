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
export class SidebarBooleanButtonUsePictures extends SidebarComponent {
    constructor(sidebar: BaseWidgetSidebar) {
        super(sidebar);
    }

    _Element = () => {
        const [usePictures, setUsePictures] = React.useState<boolean>(this.getMainWidget().getText()["usePictures"]);

        return (
            <this._BlockBody>
                <form onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.updateWidget(event, usePictures)} style={this.getFormStyle()}>
                    <div>Use Pictures:</div>
                    <input
                        type="checkbox"
                        checked={usePictures}
                        onChange={(event: any) => {
                            this.updateWidget(event, !usePictures);
                            setUsePictures((prevVal: boolean) => {
                                return !prevVal;
                            });
                        }}
                    />
                </form>
            </this._BlockBody>
        );
    };

    updateWidget = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        // do not preventDefault()

        const oldVal = this.getText()["usePictures"];
        if (propertyValue === oldVal) {
            return;
        } else {
            this.getText()["usePictures"] = propertyValue;
        }

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };
}
