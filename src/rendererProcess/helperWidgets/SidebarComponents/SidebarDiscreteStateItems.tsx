import { SidebarComponent } from "./SidebarComponent";
import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../Root/Root";
import { SidebarDiscreteStateItem } from "./SidebarDiscreteStateItem";
import { ElementButton } from "../SharedElements/MacrosTable";
import { BaseWidgetSidebar } from "../../widgets/BaseWidget/BaseWidgetSidebar";
import { DiscreteStateWidget } from "../../global/Widgets";

export class SidebarDiscreteStateItems extends SidebarComponent {
    _members: SidebarDiscreteStateItem[] = [];
    _forceUpdate: any;

    constructor(sidebar: BaseWidgetSidebar) {
        super(sidebar);
        const mainWidget = this.getMainWidget() as DiscreteStateWidget;
        for (let ii = 0; ii < mainWidget.getItemNames().length; ii++) {
            this._members.push(new SidebarDiscreteStateItem(this, ii));
        }
    }

    _Element = () => {
        const [, forceUpdate] = React.useState({});

        this._forceUpdate = () => {
            forceUpdate({});
        };
        const variableItems = (this.getMainWidget().getSidebar() as any).variableItems;

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
                        {variableItems === true ?
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
                            : null}
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
                        {this.getMembers().map((member: SidebarDiscreteStateItem, index: number) => {
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
        const mainWidget = this.getMainWidget() as DiscreteStateWidget;

        const newIndex = mainWidget.getItemNames().length;
        mainWidget.getItemNames().push(`item-${newIndex}`);
        mainWidget.getItemValues().push(newIndex);
        mainWidget.getItemColors().push("rgba(0,0,255,1)");
        this.getMembers().push(new SidebarDiscreteStateItem(this, newIndex));

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
