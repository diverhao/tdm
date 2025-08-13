import * as React from "react";
import { BaseWidgetSidebar } from "../../widgets/BaseWidget/BaseWidgetSidebar";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { SidebarComponent } from "./SidebarComponent";
import { FontsData } from "../../global/FontsData";
import { Image } from "../../widgets/Image/Image";

/**
 * Represents the X component in sidebar. <br>
 *
 * It provides: (1) the JSX element, (2) the method to udpate the widget from sidebar, and (3) the method to
 * update this sidebar component from widget.
 */
export class SidebarImageColorMap extends SidebarComponent {
    constructor(sidebar: BaseWidgetSidebar) {
        super(sidebar);
    }

    _Element = ({ hideText }: any) => {
        
        const [colorMap, setColorMap] = React.useState(this.getText()["colorMap"]);
        return (
            <form style={{ ...this.getFormStyle(), transition: "all .1s ease-in", width: "100%" }}>
                {hideText === true ? null : <div>Style:</div>}
                <select
                    style={{
                        width: "8em",
                        outline: "none",
                        border: "1px solid black",
                    }}
                    id="myDropdown"
                    value={colorMap}
                    onChange={(event: any) => {
                        setColorMap(event.target.value);
                        this.updateWidget(event, event.target.value);
                    }}

                >
                    {Object.keys((this.getMainWidget() as Image).colorMapFunctions).map((key, index) => {
                        return (
                            <option value={key}>
                                {key.toUpperCase()}
                            </option>
                        )
                    })}
                </select>

            </form>
        );
    };

    updateWidget = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        event.preventDefault();

        const oldVal = this.getText()["colorMap"];
        if (propertyValue === oldVal) {
            return;
        } else {
            this.getText()["colorMap"] = propertyValue;
        }

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };
}
