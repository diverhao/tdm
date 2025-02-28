import * as React from "react";
import { BaseWidgetSidebar } from "../../widgets/BaseWidget/BaseWidgetSidebar";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { SidebarComponent } from "./SidebarComponent";
import { PvTable } from "../../widgets/PvTable/PvTable";

/**
 * Represents the X component in sidebar. <br>
 *
 * It provides: (1) the JSX element, (2) the method to udpate the widget from sidebar, and (3) the method to
 * update this sidebar component from widget.
 */
export class SidebarPvTableProperties extends SidebarComponent {
    constructor(sidebar: BaseWidgetSidebar) {
        super(sidebar);
    }

    _Element = () => {
        const [propertyNamesStr, setPropertyNamesStr] = React.useState<string>(`${(this.getMainWidget() as PvTable).getStrippedFieldNames()}`);

        return (
            <form
                spellCheck={false}
                onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.updateWidget(event, propertyNamesStr)}
                style={this.getFormStyle()}
            >
                <this._ElementInputLabel
                    value={propertyNamesStr}
                    setValue={setPropertyNamesStr}
                    readableText={"PV Table properites"}
                    updater={(newValue: string) => { this.updateWidget(undefined, newValue) }}
                >
                    Properties:
                </this._ElementInputLabel>
                <input
                    style={{ ...this.getInputStyle() }}
                    type="text"
                    name="propertyName"
                    value={propertyNamesStr}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        event.preventDefault();
                        setPropertyNamesStr(event.target.value);
                    }}
                    // must use enter to change the value
                    onBlur={(event: any) => {
                        const orig = `${(this.getMainWidget() as PvTable).getStrippedFieldNames()}`;
                        if (orig !== propertyNamesStr) {
                            setPropertyNamesStr(orig);
                            // setChanneNameColor(GlobalMethods.validateChannelName(orig) ? "black" : "red");
                        }
                    }}
                />
            </form>
        );
    };

    updateWidget = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        event?.preventDefault();

        const mainWidget = this.getMainWidget() as PvTable;

        const newVal = propertyValue as string;
        const newVals1 = newVal.split(",");
        const newPropertyNames: string[] = [];
        for (let propertyName of newVals1) {
            if (propertyName.trim() !== "") {
                newPropertyNames.push(propertyName.trim());
            }
        }
        mainWidget.setFieldNames(newPropertyNames);
        // mainWidget.addDefaultFieldNames();

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };
}
