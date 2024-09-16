import { SidebarComponent } from "./SidebarComponent";
import * as React from "react";
import { SymbolSidebar } from "../../widgets/Symbol/SymbolSidebar";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../Root/Root";
import { SidebarSymbolItem } from "./SidebarSymbolItem";
import { Symbol } from "../../widgets/Symbol/Symbol";
import { ElementButton } from "../SharedElements/MacrosTable";

export class SidebarSymbolItems extends SidebarComponent {
	_members: SidebarSymbolItem[] = [];
	_forceUpdate: any;

	constructor(sidebar: SymbolSidebar) {
		super(sidebar);
		const mainWidget = this.getMainWidget() as Symbol;
		for (let ii = 0; ii < mainWidget.getItemNames().length; ii++) {
			this._members.push(new SidebarSymbolItem(this, ii));
		}
	}

	_Element = () => {
		const [, forceUpdate] = React.useState({});

		this._forceUpdate = () => {
			forceUpdate({});
		};

        this._updateFromWidget = (propertyValue: string) => {
            const sidebar = this.getSidebar() as SymbolSidebar;
            const beingUpdatedItemIndex = sidebar.beingUpdatedItemIndex;
            const member = this.getMembers()[beingUpdatedItemIndex];
            if (member !== undefined) {
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
                            width: "100%"
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
						{this.getMembers().map((member: SidebarSymbolItem, index: number) => {
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
		const mainWidget = this.getMainWidget() as Symbol;

		const newIndex = mainWidget.getItemNames().length;
		mainWidget.getItemNames().push(`item-${newIndex}`);
		mainWidget.getItemValues().push(newIndex);
		this.getMembers().push(new SidebarSymbolItem(this, newIndex));

		this._forceUpdate();

		const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
		history.registerAction();

		g_widgets1.addToForceUpdateWidgets(mainWidget.getWidgetKey());
		g_widgets1.addToForceUpdateWidgets("GroupSelection2");

		g_flushWidgets();
	};

	// no need to update widget from this sidebar component
	updateWidget = (event: any, propertyValue: string | number | boolean | number[] | string[] | undefined) => {};

	getMembers = () => {
		return this._members;
	};
}
