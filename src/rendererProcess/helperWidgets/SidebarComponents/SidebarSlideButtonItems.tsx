import { SidebarComponent } from "./SidebarComponent";
import * as React from "react";
import { BaseWidgetSidebar } from "../../widgets/BaseWidget/BaseWidgetSidebar";
import { SlideButton } from "../../widgets/SlideButton/SlideButton";
import { SidebarSlideButtonItem } from "./SidebarSlideButtonItem";

export class SidebarSlideButtonItems extends SidebarComponent {
    _members: SidebarSlideButtonItem[] = [];
    _forceUpdate: any;

    constructor(sidebar: BaseWidgetSidebar) {
        super(sidebar);
        const mainWidget = this.getMainWidget() as SlideButton;
        for (let ii = 0; ii < mainWidget.getItemLabels().length; ii++) {
            this._members.push(new SidebarSlideButtonItem(this, ii));
        }
    }

    _Element = () => {
        const [, forceUpdate] = React.useState({});

        this._forceUpdate = () => {
            forceUpdate({});
        };

        // invoked when we select a picture file using dialog
        this._updateFromWidget = (propertyValue: string) => {
            // const sidebar = this.getSidebar() as SlideButtonSidebar;
            // const beingUpdatedItemIndex = sidebar.beingUpdatedItemIndex;
            // const member = this.getMembers()[beingUpdatedItemIndex];
            // if (member !== undefined) {
            //     member._updateFromWidget(propertyValue);
            // }
        }

        return (
            <>
                <this._BlockTitle>
                    <div
                        style={{
                            display: "inline-flex",
                            flexDirection: "row",
                            justifyContent: "space-between",
                            width: "100%"
                        }}
                    >
                        <b>Items {`(${this.getMembers().length})`}</b>


                        {/* <this.StyledButton
							onClick={(event: any) => {
                                this.updateWidgetAppendItem(event);
							}}
						>
							<img
								src="../../../mainProcess/resources/webpages/add-symbol.svg"
								style={{
									width: "60%",
									height: "60%",
								}}
							></img>
						</this.StyledButton> */}

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
                        {this.getMembers().map((member: SidebarSlideButtonItem, index: number) => {
                            return member.getElement();
                        })}
                    </div>
                </this._BlockBody>
            </>
        );
    };


    _BlockTitle = this.getSidebar()._BlockTitle;
    _BlockBody = this.getSidebar()._BlockBody;

    // updateWidgetAppendItem = (event: any) => {
    // 	if (event) {
    // 		event.preventDefault();
    // 	}
    // 	const mainWidget = this.getMainWidget() as BooleanButton;

    // 	const newIndex = mainWidget.getItemLabels().length;
    // 	mainWidget.getItemLabels().push(`item-${newIndex}`);
    // 	mainWidget.getItemValues().push(newIndex);
    // 	mainWidget.getItemColors().push(`rgba(255, 0, 255, 1)`);
    // 	mainWidget.getItemPictures().push("");

    // 	this.getMembers().push(new SidebarBooleanButtonItem(this, newIndex));

    // 	this._forceUpdate();

    // 	const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
    // 	history.registerAction();

    // 	g_widgets1.addToForceUpdateWidgets(mainWidget.getWidgetKey());
    // 	g_widgets1.addToForceUpdateWidgets("GroupSelection2");

    // 	g_flushWidgets();
    // };

    // no need to update widget from this sidebar component
    updateWidget = (event: any, propertyValue: string | number | boolean | number[] | string[] | undefined) => { };

    getMembers = () => {
        return this._members;
    };
}
