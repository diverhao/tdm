import { SidebarActionItems } from "./SidebarActionItems";
import * as React from "react";
import { ActionButton } from "../../widgets/ActionButton/ActionButton";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../Root/Root";
import { type_action_executecommand_tdl } from "../../widgets/ActionButton/ActionButton";
import { ElementButton } from "../SharedElements/MacrosTable";

export class SidebarActionExecuteCommandItem {
    _items: SidebarActionItems;
    _index: number;
    StyledButton = ElementButton;
    _BlockBody: any;
    ElementInputLabel: any;
    constructor(items: SidebarActionItems, index: number) {
        this._items = items;
        this._index = index;
        // this.StyledButton = this.getItems().StyledButton;
        this._BlockBody = this.getItems()._BlockBody;
        this.ElementInputLabel = this.getItems()._ElementInputLabel
    }

    getMainWidget = () => {
        return this.getItems().getMainWidget() as ActionButton;
    };

    getTdl = () => {
        const mainWidget = this.getMainWidget();
        return mainWidget.getActions()[this.getIndex()] as type_action_executecommand_tdl;
    };

    _Element = () => {
        // const mainWidget = this.getMainWidget();
        const [label, setLabel] = React.useState(this.getTdl()["label"]);
        const [command, setCommand] = React.useState(this.getTdl()["command"]);

        return (
            <this._BlockBody>
                <div
                    style={{
                        display: "inline-flex",
                        flexDirection: "row",
                        width: "100%",
                        justifyContent: "space-between",
                        alignItems: "center",
                        backgroundColor: "rgba(240,240,240,1)",
                    }}
                >
                    <b>{`#${this.getIndex()} Execute Cmd`}</b>
                    <div>
                        <this.StyledButton
                            onClick={(event: any) => {
                                this.getItems().updateWidgetMoveUpAction(event, this.getIndex());
                            }}
                        >
                            &#8593;
                        </this.StyledButton>
                        <this.StyledButton
                            onClick={(event: any) => {
                                this.getItems().updateWidgetMoveDownAction(event, this.getIndex());
                            }}
                        >
                            &#8595;
                        </this.StyledButton>
                        <this.StyledButton
                            onClick={(event: any) => {
                                this.getItems().updateWidgetRemoveAction(event, this.getIndex());
                            }}
                        >
                            <img
                                src={`../../../webpack/resources/webpages/delete-symbol.svg`}
                                style={{
                                    width: "50%",
                                    height: "50%",
                                }}
                            ></img>
                        </this.StyledButton>
                    </div>
                </div>

                <div
                    style={{
                        display: "inline-flex",
                        flexDirection: "row",
                        width: "100%",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <form
                        onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                            this.updateWidgetLabel(event, label);
                        }}
                        style={{ ...this.getFormStyle(), width: "100%" }}
                    >

                        <this.ElementInputLabel
                            value={label}
                            setValue={setLabel}
                            readableText={"Execute Command label"}
                            updater={(newValue: string) => {this.updateWidgetLabel(undefined, newValue)}}
                        >
                            Label:
                        </this.ElementInputLabel>
                        <input
                            style={{ ...this.getInputStyle() }}
                            type="string"
                            name="item-label"
                            value={label}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                const newVal = event.target.value;
                                setLabel(newVal);
                            }}
                            // must use enter to change the value
                            onBlur={(event: any) => {
                                const orig = this.getTdl()["label"];
                                if (orig !== label) {
                                    setLabel(orig);
                                }
                            }}
                        />
                    </form>
                </div>
                <div
                    style={{
                        display: "inline-flex",
                        flexDirection: "row",
                        width: "100%",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <form
                        onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                            this.updateWidgetCommand(event, command);
                        }}
                        style={{ ...this.getFormStyle(), width: "100%" }}
                    >
                        <this.ElementInputLabel
                            value={command}
                            setValue={setCommand}
                            readableText={"Execute Command command"}
                            updater={(newValue: string) => {this.updateWidgetCommand(undefined, newValue)}}
                        >
                            Cmd:
                        </this.ElementInputLabel>
                        <input
                            style={{ ...this.getInputStyle() }}
                            type="string"
                            name="item-command"
                            value={command}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                const newVal = event.target.value;
                                setCommand(newVal);
                            }}
                            // must use enter to change the value
                            onBlur={(event: any) => {
                                const orig = this.getTdl()["command"];
                                if (orig !== command) {
                                    setCommand(orig);
                                }
                            }}
                        />
                    </form>
                </div>
                <this._ElementConfirmOnWrite></this._ElementConfirmOnWrite>
                <this._HorizontalLine></this._HorizontalLine>
            </this._BlockBody>
        );
    };


    _ElementConfirmOnWrite = () => {
        const [confirmOnWrite, setConfirmOnWrite] = React.useState<boolean>(this.getTdl()["confirmOnWrite"]);
        // const [confirmOnWriteMessage, setConfirmOnWriteMessage] = React.useState<boolean>(this.getTdl()["confirmOnWriteMessage"]);
        const [confirmOnWriteUsePassword, setConfirmOnWriteUsePassword] = React.useState<boolean>(this.getTdl()["confirmOnWriteUsePassword"]);
        const [confirmOnWritePassword, setConfirmOnWritePassword] = React.useState<string>(this.getTdl()["confirmOnWritePassword"]);

        return (
            <>
                <div
                    style={{
                        display: "inline-flex",
                        flexDirection: "column",
                        position: "relative",
                    }}
                >
                    <form style={{ ...this.getFormStyle(), transition: "all .1s ease-in" }}>
                        <div>Confirm execute:</div>
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
                                if (this.getTdl()["confirmOnWritePassword"] !== confirmOnWritePassword) {
                                    setConfirmOnWritePassword(this.getTdl()["confirmOnWritePassword"]);
                                }
                            }}
                        />
                    </form>
                </div>
            </>
        );
    };

    updateWidget = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        // do not prevent default
        // event?.preventDefault();

        const oldVal = this.getTdl()["confirmOnWrite"];
        if (propertyValue === oldVal) {
            return;
        }
        else {
            this.getTdl()["confirmOnWrite"] = propertyValue as boolean;
        }

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        const mainWidget = this.getMainWidget();
        g_widgets1.addToForceUpdateWidgets(mainWidget.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };

    updateWidgetUsePassword = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        // do not prevent default for checkbox
        // event.preventDefault();

        const oldVal = this.getTdl()["confirmOnWriteUsePassword"];
        if (propertyValue === oldVal) {
            return;
        }
        else {
            this.getTdl()["confirmOnWriteUsePassword"] = propertyValue as boolean;
        }

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        const mainWidget = this.getMainWidget();
        g_widgets1.addToForceUpdateWidgets(mainWidget.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };

    updateWidgetPassword = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        event.preventDefault();

        const oldVal = this.getTdl()["confirmOnWritePassword"];
        if (propertyValue === oldVal) {
            return;
        }
        else {
            this.getTdl()["confirmOnWritePassword"] = propertyValue as string;
        }

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        const mainWidget = this.getMainWidget();
        g_widgets1.addToForceUpdateWidgets(mainWidget.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };


    updateWidgetLabel = (event: any, propertyValue: string | number | boolean | number[] | string[] | undefined) => {
        if (event) {
            event.preventDefault();
        }

        const mainWidget = this.getMainWidget();
        const oldVal = this.getTdl()["label"];
        if (propertyValue === oldVal) {
            return;
        } else {
            this.getTdl()["label"] = `${propertyValue}`;
        }

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(mainWidget.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };

    updateWidgetCommand = (event: any, propertyValue: string | number | boolean | number[] | string[] | undefined) => {
        if (event) {
            event.preventDefault();
        }

        const mainWidget = this.getMainWidget();
        const oldVal = this.getTdl()["command"];
        if (propertyValue === oldVal) {
            return;
        } else {
            this.getTdl()["command"] = `${propertyValue}`;
        }

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(mainWidget.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };

    // --------------------------- getters -----------------------------

    getElement = () => {
        const mainWidget = this.getMainWidget();
        return <this._Element key={`${this.getTdl()["label"]}-${this.getIndex()}`}></this._Element>;
    };

    getIndex = () => {
        return this._index;
    };

    getItems = () => {
        return this._items;
    };

    setIndex = (newIndex: number) => {
        this._index = newIndex;
    };

    getFormStyle = () => {
        return this.getItems().getFormStyle();
    };
    getInputStyle = () => {
        return this.getItems().getInputStyle();
    };

    // -------------------------- styled components ----------------------------

    _HorizontalLine = () => {
        return <div>&nbsp;</div>;
    };
}
