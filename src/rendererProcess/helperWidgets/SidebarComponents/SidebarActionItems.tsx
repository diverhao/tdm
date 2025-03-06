import { SidebarComponent } from "./SidebarComponent";
import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../Root/Root";
import { ElementButton } from "../SharedElements/MacrosTable";
import { BaseWidgetSidebar } from "../../widgets/BaseWidget/BaseWidgetSidebar";
import {
    ActionButton,
    type_action_openwebpage_tdl,
    type_action_opendisplay_tdl,
    type_action_writepv_tdl,
    type_action_executecommand_tdl,
    type_action_closedisplaywindow,
} from "../../widgets/ActionButton/ActionButton";
import { SidebarActionOpenDisplayItem } from "./SidebarActionOpenDisplayItem";
import { SidebarActionWritePvItem } from "./SidebarActionWritePvItem";
import { SidebarActionOpenWebpageItem } from "./SidebarActionOpenWebpageItem";
import { SidebarActionExecuteCommandItem } from "./SidebarActionExecuteCommandItem";
import { ActionButtonSidebar } from "../../widgets/ActionButton/ActionButtonSidebar";
import { SidebarActionCloseDisplayWindowItem } from "./SidebarActionCloseDisplayWindowItem";

export class SidebarActionItems extends SidebarComponent {
    //todo: more types
    _members: (SidebarActionOpenDisplayItem | SidebarActionWritePvItem | SidebarActionOpenWebpageItem | SidebarActionExecuteCommandItem | SidebarActionCloseDisplayWindowItem)[] = [];
    _forceUpdate: any;

    constructor(sidebar: BaseWidgetSidebar) {
        super(sidebar);
        const mainWidget = this.getMainWidget() as ActionButton;
        for (let ii = 0; ii < mainWidget.getActions().length; ii++) {
            // todo: more types
            const actionTdl = mainWidget.getActions()[ii];
            const type = actionTdl["type"];
            if (type === "OpenDisplay") {
                this._members.push(new SidebarActionOpenDisplayItem(this, ii));
            } else if (type === "WritePV") {
                this._members.push(new SidebarActionWritePvItem(this, ii));
            } else if (type === "OpenWebPage") {
                this._members.push(new SidebarActionOpenWebpageItem(this, ii));
            } else if (type === "ExecuteCommand") {
                this._members.push(new SidebarActionExecuteCommandItem(this, ii));
            } else if (type === "CloseDisplayWindow") {
                this._members.push(new SidebarActionCloseDisplayWindowItem(this, ii));
            } else {
                //todo
            }
        }
    }

    _Element = () => {
        const [, forceUpdate] = React.useState({});

        const [createAction, setCreateAction] = React.useState<"OpenDisplay" | "ExecuteCommand" | "OpenWebpage" | "WritePV" | "CloseDisplayWindow">("OpenDisplay");

        this._forceUpdate = () => {
            forceUpdate({});
        };

        this._updateFromWidget = (propertyValue: string) => {
            const sidebar = this.getSidebar() as ActionButtonSidebar;
            const beingUpdatedItemIndex = sidebar.beingUpdatedItemIndex;
            const member = this.getMembers()[beingUpdatedItemIndex];
            if (member !== undefined && member instanceof SidebarActionOpenDisplayItem) {
                member._updateFromWidget(propertyValue);
            }
        }

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
                        <b>Actions {`(${this.getMembers().length})`}</b>
                    </div>
                </this._BlockTitle>
                <this._BlockBody>
                    <div
                        style={{
                            display: "inline-flex",
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <ElementButton
                            onClick={(event: any) => {
                                this.updateWidgetAppendItem(event, createAction);
                            }}
                        >
                            <img
                                src={`../../../webpack/resources/webpages/add-symbol.svg`}
                                style={{
                                    width: "60%",
                                    height: "60%",
                                }}
                            ></img>
                        </ElementButton>

                        <select
                            style={{
                                width: "74%"
                            }}
                            defaultValue={"OpenDisplay"}
                            onChange={(event: any) => {
                                event?.preventDefault();
                                setCreateAction(event.target.value);
                            }}
                        >
                            <option value="OpenDisplay"> Open Display</option>
                            <option value="ExecuteCommand"> Execute Command</option>
                            <option value="OpenWebpage"> Open Webpage</option>
                            <option value="WritePV"> Write PV</option>
                            <option value="CloseDisplayWindow"> Close Window</option>
                        </select>
                    </div>
                    <this._HorizontalLine></this._HorizontalLine>
                    <div
                        style={{
                            display: "inline-flex",
                            flexDirection: "column",
                            position: "relative",
                        }}
                    >
                        {this.getMembers().map(
                            (
                                member:
                                    | SidebarActionOpenDisplayItem
                                    | SidebarActionWritePvItem
                                    | SidebarActionOpenWebpageItem
                                    | SidebarActionExecuteCommandItem
                                    | SidebarActionCloseDisplayWindowItem,
                                index: number
                            ) => {
                                return member.getElement();
                            }
                        )}
                    </div>
                </this._BlockBody>
            </>
        );
    };

    _BlockTitle = this.getSidebar()._BlockTitle;
    _BlockBody = this.getSidebar()._BlockBody;

    updateWidgetAppendItem = (event: any, type: "OpenDisplay" | "WritePV" | "OpenWebpage" | "ExecuteCommand" | "CloseDisplayWindow") => {
        if (event) {
            event.preventDefault();
        }
        const mainWidget = this.getMainWidget() as ActionButton;
        if (type === "OpenDisplay") {
            //todo: more generic
            const newActionTdl: type_action_opendisplay_tdl = {
                type: "OpenDisplay",
                label: "Open Display",
                fileName: "",
                externalMacros: [],
                useParentMacros: false,
                openInSameWindow: false,
            };

            mainWidget.getActions().push(newActionTdl);
            const newIndex = mainWidget.getActions().length - 1;
            this.getMembers().push(new SidebarActionOpenDisplayItem(this, newIndex));
        } else if (type === "WritePV") {
            const newActionTdl: type_action_writepv_tdl = {
                type: "WritePV",
                label: "Write PV",
                channelName: "val5",
                channelValue: "37",
                confirmOnWrite: false,
                confirmOnWriteUsePassword: false,
                confirmOnWritePassword: "",
            };

            mainWidget.getActions().push(newActionTdl);
            const newIndex = mainWidget.getActions().length - 1;
            this.getMembers().push(new SidebarActionWritePvItem(this, newIndex));
        } else if (type === "OpenWebpage") {
            const newActionTdl: type_action_openwebpage_tdl = {
                type: "OpenWebPage",
                label: "Open Webpage",
                url: "https://www.google.com",
            };

            mainWidget.getActions().push(newActionTdl);
            const newIndex = mainWidget.getActions().length - 1;
            this.getMembers().push(new SidebarActionOpenWebpageItem(this, newIndex));
        } else if (type === "ExecuteCommand") {
            const newActionTdl: type_action_executecommand_tdl = {
                type: "ExecuteCommand",
                label: "Execute Command",
                command: "pwd",
                confirmOnWrite: false,
                confirmOnWriteUsePassword: false,
                confirmOnWritePassword: "",
            };

            mainWidget.getActions().push(newActionTdl);
            const newIndex = mainWidget.getActions().length - 1;
            this.getMembers().push(new SidebarActionExecuteCommandItem(this, newIndex));
        } else if (type === "CloseDisplayWindow") {
            const newActionTdl: type_action_closedisplaywindow = {
                type: "CloseDisplayWindow",
                label: "Close Window",
                quitTDM: false,
            };

            mainWidget.getActions().push(newActionTdl);
            const newIndex = mainWidget.getActions().length - 1;
            this.getMembers().push(new SidebarActionCloseDisplayWindowItem(this, newIndex));
        }

        this._forceUpdate();

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(mainWidget.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };

    updateWidgetRemoveAction = (event: any, thisIndex: number) => {
        if (event) {
            event.preventDefault();
        }

        const mainWidget = this.getMainWidget() as ActionButton;

        mainWidget.getActions().splice(thisIndex, 1);

        this.getMembers().splice(thisIndex, 1);

        for (let indexTmp = thisIndex; indexTmp < mainWidget.getActions().length; indexTmp++) {
            const member = this.getMembers()[indexTmp];
            member.setIndex(indexTmp);
        }

        g_widgets1.updateSidebar(true);

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(mainWidget.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };

    updateWidgetMoveUpAction = (event: any, thisIndex: number) => {
        if (event) {
            event.preventDefault();
        }
        const mainWidget = this.getMainWidget() as ActionButton;

        if (thisIndex === 0) {
            return;
        }

        const tmp = mainWidget.getActions()[thisIndex];
        mainWidget.getActions()[thisIndex] = mainWidget.getActions()[thisIndex - 1];
        mainWidget.getActions()[thisIndex - 1] = tmp;

        const member = this.getMembers()[thisIndex];
        const member2 = this.getMembers()[thisIndex - 1];

        member.setIndex(thisIndex - 1);
        member2.setIndex(thisIndex);

        this.getMembers().splice(thisIndex, 1);
        this.getMembers().splice(thisIndex - 1, 0, member);

        this._forceUpdate();

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(mainWidget.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };

    updateWidgetMoveDownAction = (event: any, thisIndex: number) => {
        if (event) {
            event.preventDefault();
        }
        const mainWidget = this.getMainWidget() as ActionButton;

        if (thisIndex >= this.getMembers().length - 1) {
            return;
        }

        const tmp = mainWidget.getActions()[thisIndex];
        mainWidget.getActions()[thisIndex] = mainWidget.getActions()[thisIndex + 1];
        mainWidget.getActions()[thisIndex + 1] = tmp;

        const member = this.getMembers()[thisIndex];
        const member2 = this.getMembers()[thisIndex + 1];

        member.setIndex(thisIndex + 1);
        member2.setIndex(thisIndex);

        this.getMembers().splice(thisIndex, 1);
        this.getMembers().splice(thisIndex + 1, 0, member);

        this._forceUpdate();

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(mainWidget.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };

    // no need to update widget from this sidebar component
    updateWidget = (event: any, propertyValue: string | number | boolean | number[] | string[] | undefined) => { };

    getMembers = () => {
        return this._members;
    };
}
