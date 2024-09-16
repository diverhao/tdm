import * as React from "react";
import { BaseWidgetSidebar } from "../../widgets/BaseWidget/BaseWidgetSidebar";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { SidebarComponent } from "./SidebarComponent";
import { FontsData } from "../../global/FontsData";


/**
 * Represents the X component in sidebar. <br>
 *
 * It provides: (1) the JSX element, (2) the method to udpate the widget from sidebar, and (3) the method to
 * update this sidebar component from widget.
 */
export class SidebarFontWeight extends SidebarComponent {
    constructor(sidebar: BaseWidgetSidebar) {
        super(sidebar);
    }

    _Element = ({ hideText }: any) => {

        const fontWeights: string[] = FontsData.g_fontWeights;
        const allFontFamiles = FontsData.getAllFontFamilies();

        return (

            <form style={{ ...this.getFormStyle(), transition: "all .1s ease-in", width: "100%"  }}>
                {hideText === true ? null : <div>Weight:</div>}
                <select
                    style={{ ...this.getInputStyle(), fontFamily: "inherit" }}
                    onChange={(event: any) => {
                        this.updateWidget(event, event.target.value);
                    }}
                >
                    {fontWeights.map((fontWeight: string, index: number) => {
                        let selected = false;
                        if (!allFontFamiles.includes(this.getStyle()["fontWeight"]) && index === 0) {
                            selected = true;
                        }
                        if (this.getStyle()["fontWeight"] === fontWeight) {
                            selected = true;
                        }
                        return <option selected={selected}>{fontWeight}</option>;
                    })}
                </select>
            </form>

        );
    };

    updateWidget = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        event.preventDefault();

        const oldVal = this.getStyle()["fontWeight"];
        if (propertyValue === oldVal) {
            return;
        } else {
            this.getStyle()["fontWeight"] = propertyValue;
        }

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };
}
