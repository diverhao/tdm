import * as React from "react";
import { BaseWidgetSidebar } from "../../widgets/BaseWidget/BaseWidgetSidebar";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { SidebarComponent } from "./SidebarComponent";
import { ElementButton, ElementSmallButton } from "../SharedElements/MacrosTable";
import { DataViewerSidebar } from "../../widgets/DataViewer/DataViewerSidebar";
import { DataViewer } from "../../widgets/DataViewer/DataViewer";
import { Collapsible } from "../ColorPicker/Collapsible";
import * as GlobalMethods from "../../../common/GlobalMethods";
import { Log } from "../../../common/Log";

/**
 * Represents the channel names component in sidebar. <br>
 *
 * It is different from the SidebarChannelName. This one accepts multiple PV names, separated by commas.
 *
 * It provides: (1) the JSX element, (2) the method to udpate the widget from sidebar, and (3) the method to
 * update this sidebar component from widget.
 */
export class SidebarDataViewerChannelNames extends SidebarComponent {
    constructor(sidebar: BaseWidgetSidebar) {
        super(sidebar);
    }

    _Element = () => {
        const mainWidget = this.getMainWidget() as DataViewer;
        return (
            <>
                <this._BlockTitle>
                    <b>
                        <b>{`Channels (${mainWidget.getChannelNames().length})`}</b>
                    </b>
                </this._BlockTitle>
                <div>Set up the channel names in the widget at operating mode.</div>
            </>
        );
    };
    _BlockTitle = ({ children }: any) => {
        return (
            <div
                style={{
                    marginTop: 2,
                    marginBottom: 2,
                    width: "100%",
                    display: "inline-flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                {children}
            </div>
        );
    };

    // --------------------------- updaters -------------------------

    updateWidget = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => { };

}
