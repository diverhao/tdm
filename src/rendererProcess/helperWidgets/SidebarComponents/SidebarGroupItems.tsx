import { SidebarComponent } from "./SidebarComponent";
import * as React from "react";
import { SidebarGroupItem } from "./SidebarGroupItem";
import { Group } from "../../widgets/Group/Group";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../Root/Root";
import { ElementButton } from "../SharedElements/MacrosTable";
import { BaseWidgetSidebar } from "../../widgets/BaseWidget/BaseWidgetSidebar";

export class SidebarGroupItems extends SidebarComponent {
    _members: SidebarGroupItem[] = [];
    _forceUpdate: any;

    constructor(sidebar: BaseWidgetSidebar) {
        super(sidebar);
        const mainWidget = this.getMainWidget() as Group;
        for (let ii = 0; ii < mainWidget.getItemNames().length; ii++) {
            this._members.push(new SidebarGroupItem(this, ii));
        }
    }

    _Element = () => {
        const [, forceUpdate] = React.useState({});

        this._forceUpdate = () => {
            forceUpdate({});
        };

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
                        <b>Items {`(${this.getMembers().length})`}</b>

                        <ElementButton
                            onClick={(event: any) => {
                                this.updateWidgetAppendItem(event);
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
                        {this.getMembers().map((member: SidebarGroupItem, index: number) => {
                            return member.getElement();
                        })}
                    </div>
                </this._BlockBody>
            </>
        );
    };


    _BlockTitle = this.getSidebar()._BlockTitle;
    _BlockBody = this.getSidebar()._BlockBody;

    updateWidgetAppendItem = (event: any) => {
        if (event) {
            event.preventDefault();
        }
        const mainWidget = this.getMainWidget() as Group;

        const newIndex = mainWidget.getItemNames().length;

        mainWidget.getItemNames().push(`item-${newIndex}`);
        mainWidget.getItemBackgroundColors().push("rgba(255,255,255,1)");
        mainWidget.getWidgetKeys().push([])

        mainWidget.updateGroup(newIndex);
        mainWidget.selectGroup(newIndex, true);


        this.getMembers().push(new SidebarGroupItem(this, newIndex));

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
