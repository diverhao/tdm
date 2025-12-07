import * as React from "react";
import { BaseWidgetSidebar } from "../../widgets/BaseWidget/BaseWidgetSidebar";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { SidebarComponent } from "./SidebarComponent";
import * as GlobalMethods from "../../../common/GlobalMethods"
import { ActionButtonSidebar } from "../../widgets/ActionButton/ActionButtonSidebar";
import { ActionButton } from "../../widgets/ActionButton/ActionButton";

/**
 * Represents the X component in sidebar. <br>
 * 
 * It provides: (1) the JSX element, (2) the method to udpate the widget from sidebar, and (3) the method to 
 * update this sidebar component from widget.
 */
export class SidebarWriteConfirmation extends SidebarComponent {
    constructor(sidebar: BaseWidgetSidebar) {
        super(sidebar);
    }

    _Element = () => {
        const [confirmOnWrite, setConfirmOnWrite] = React.useState<boolean>(this.getText()["confirmOnWrite"]);
        // const [confirmOnWriteMessage, setConfirmOnWriteMessage] = React.useState<boolean>(this.getText()["confirmOnWriteMessage"]);
        const [confirmOnWriteUsePassword, setConfirmOnWriteUsePassword] = React.useState<boolean>(this.getText()["confirmOnWriteUsePassword"]);
        const [confirmOnWritePassword, setConfirmOnWritePassword] = React.useState<string>(this.getText()["confirmOnWritePassword"]);

        return (
            <>
                <this._BlockTitle>
                    <div
                        style={{
                            display: "inline-flex",
                            flexDirection: "row",
                            justifyContent: "space-between",
                            width: "100%",
                        }}
                    >
                        <b>Change confirmation</b>
                    </div>
                </this._BlockTitle>
                <this._BlockBody>
                    <div
                        style={{
                            display: "inline-flex",
                            flexDirection: "column",
                            position: "relative",
                        }}
                    >
                        <form style={{ ...this.getFormStyle(), transition: "all .1s ease-in" }}>
                            <div>Confirm change:</div>
                            <input
                                type="checkbox"
                                checked={confirmOnWrite}
                                onChange={(event: any) => {
                                    this.updateWidget(event, !confirmOnWrite);
                                    setConfirmOnWrite((prevVal: boolean) => {
                                        return !prevVal;
                                    });
                                }}
                            />
                        </form>

                        <form style={{
                            ...this.getFormStyle(), transition: "all .1s ease-in",

                            display: confirmOnWrite === true ? "inline-flex" : "none",
                        }}>
                            <div>Use password:</div>
                            <input
                                type="checkbox"
                                checked={confirmOnWriteUsePassword}
                                onChange={(event: any) => {
                                    this.updateWidgetUsePassword(event, !confirmOnWriteUsePassword);
                                    setConfirmOnWriteUsePassword((prevVal: boolean) => {
                                        return !prevVal;
                                    });
                                }}
                            />
                        </form>


                        <form
                            onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.updateWidgetPassword(event, confirmOnWritePassword)}
                            style={{
                                ...this.getFormStyle(),
                                display: confirmOnWrite === true && confirmOnWriteUsePassword === true ? "inline-flex" : "none",
                            }}
                        >
                            <div>Pasword:</div>
                            <input
                                style={this.getInputStyle()}
                                type="text"
                                name="password"
                                value={confirmOnWritePassword}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                    const newVal = event.target.value;
                                    setConfirmOnWritePassword(newVal);
                                }}
                                // must use enter to change the value
                                onBlur={(event: any) => {
                                    if (this.getText()["confirmOnWritePassword"] !== confirmOnWritePassword) {
                                        setConfirmOnWritePassword(this.getText()["confirmOnWritePassword"]);
                                    }
                                }}
                            />
                        </form>

                    </div>
                </this._BlockBody>
            </>
        );
    };

    updateWidget = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        // do not prevent default
        // event?.preventDefault();

        const oldVal = this.getText()["confirmOnWrite"];
        if (propertyValue === oldVal) {
            return;
        }
        else {
            this.getText()["confirmOnWrite"] = propertyValue;
        }

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };

    updateWidgetUsePassword = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        // do not prevent default for checkbox
        // event.preventDefault();

        const oldVal = this.getText()["confirmOnWriteUsePassword"];
        if (propertyValue === oldVal) {
            return;
        }
        else {
            this.getText()["confirmOnWriteUsePassword"] = propertyValue;
        }

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };

    updateWidgetPassword = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        event.preventDefault();

        const oldVal = this.getText()["confirmOnWritePassword"];
        if (propertyValue === oldVal) {
            return;
        }
        else {
            this.getText()["confirmOnWritePassword"] = propertyValue;
        }

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };
}
