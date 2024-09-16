import * as React from "react";
import { BaseWidgetSidebar } from "../../widgets/BaseWidget/BaseWidgetSidebar";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { SidebarComponent } from "./SidebarComponent";
import * as GlobalMethods from "../../global/GlobalMethods";
import { FontsData } from "../../global/FontsData";

/**
 * Represents the X component in sidebar. <br>
 *
 * It provides: (1) the JSX element, (2) the method to udpate the widget from sidebar, and (3) the method to
 * update this sidebar component from widget.
 */
export class SidebarFontStyle extends SidebarComponent {
    constructor(sidebar: BaseWidgetSidebar) {
        super(sidebar);
    }

    _Element = ({ hideText }: any) => {
        const fontSyles: string[] = ["normal", "italic"];
        const allFontFamilies = FontsData.getAllFontFamilies();

        return (
            <form style={{ ...this.getFormStyle(), transition: "all .1s ease-in", width: "100%" }}>
                {hideText === true ? null : <div>Style:</div>}
                <select
                    style={{ ...this.getInputStyle(), fontFamily: "inherit" }}
                    onChange={(event: any) => {
                        this.updateWidget(event, event.target.value);
                    }}
                >
                    {fontSyles.map((fontStyle: string, index: number) => {
                        let selected = false;
                        if (!allFontFamilies.includes(this.getStyle()["fontStyle"]) && index === 0) {
                            selected = true;
                        }
                        if (this.getStyle()["fontStyle"] === fontStyle) {
                            selected = true;
                        }

                        return <option selected={selected}>{fontStyle}</option>;
                    })}
                </select>
            </form>

        );
    };

    updateWidget = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        event.preventDefault();

        const oldVal = this.getStyle()["fontStyle"];
        if (propertyValue === oldVal) {
            return;
        } else {
            this.getStyle()["fontStyle"] = propertyValue;
        }

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };
}
