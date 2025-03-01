import * as React from "react";
import { BaseWidgetSidebar } from "../../widgets/BaseWidget/BaseWidgetSidebar";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { SidebarComponent } from "./SidebarComponent";
import { GlobalVariables } from "../../global/GlobalVariables";
import { ByteMonitor } from "../../widgets/ByteMonitor/ByteMonitor";
import { ElementMacroInput, ElementButton, ElementMacroTd, ElementMacroTr, ElementMacrosTableSingleColumnData } from "../SharedElements/MacrosTable";

/**
 * Represents the X component in sidebar. <br>
 *
 * It provides: (1) the JSX element, (2) the method to udpate the widget from sidebar, and (3) the method to
 * update this sidebar component from widget.
 */
export class SidebarByteMonitorBitNamesTable extends SidebarComponent {
    constructor(sidebar: BaseWidgetSidebar) {
        super(sidebar);
    }

    _forceUpdate: any;
    _Element = () => {
        const mainWidget = this.getMainWidget() as ByteMonitor;
        const [, forceUpdate] = React.useState({});
        this._forceUpdate = () => {
            forceUpdate({});
        };
        return (
            <>
                <this._BlockTitle>
                    <div style={{ display: "inline-flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                        <div>
                            <b>Bit names</b>
                        </div>
                    </div>
                </this._BlockTitle>
                <this._BlockBody>
                    <div
                        style={{
                            display: "inline-block",
                        }}
                    >
                        <ElementMacrosTableSingleColumnData
                            headlineName1={"Bit #"}
                            headlineName2={"Bit name"}
                            macrosData={mainWidget.getBitNames()}
                            widgetKey={this.getWidgetKey()}
                        >
                        </ElementMacrosTableSingleColumnData>
                    </div>
                </this._BlockBody >
            </>
        );
    };
    
    updateWidget = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        event.preventDefault();

        // const oldVal = this.getText()["lineWidth"];
        // if (propertyValue === oldVal) {
        //     return;
        // } else {
        //     this.getText()["lineWidth"] = propertyValue;
        // }

        // const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        // history.registerAction();

        // g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        // g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        // g_flushWidgets();
    };

}
