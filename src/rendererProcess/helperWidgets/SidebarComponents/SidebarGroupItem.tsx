// import { SidebarLEDMultiStateItems } from "./SidebarLEDMultiStateItems";
import { SidebarGroupItems } from "./SidebarGroupItems";
import * as React from "react";
import { Group } from "../../widgets/Group/Group";
// import { LED } from "../../widgets/LED/LED";
import { g_widgets1, getBasePath } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../Root/Root";
import { Collapsible } from "../ColorPicker/Collapsible";
import * as GlobalMethods from "../../../common/GlobalMethods";
import { ElementButton } from "../SharedElements/MacrosTable";

export class SidebarGroupItem {
    _items: SidebarGroupItems;
    _index: number;
    StyledButton = ElementButton;
    _BlockBody: any;
    ElementInputLabel: any;
    constructor(items: SidebarGroupItems, index: number) {
        this._items = items;
        this._index = index;
        // this.StyledButton = this.getItems().StyledButton;
        this._BlockBody = this.getItems()._BlockBody;
        this.ElementInputLabel = this.getItems()._ElementInputLabel
    }

    getMainWidget = () => {
        return this.getItems().getMainWidget() as Group;
    };

    _Element = () => {
        const mainWidget = this.getMainWidget();
        const [itemName, setItemName] = React.useState(mainWidget.getItems()[this.getIndex()].getName());

        return (
            <this._BlockBody>
                <div
                    style={{
                        display: "inline-flex",
                        flexDirection: "row",
                        width: "100%",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <b>{`# ${this.getIndex()}`}</b>
                    <div>
                        <this.StyledButton
							onClick={(event) => {
								this.updateWidgetMoveUpItem(event);
							}}
						>
							&#11105;{" "}
						</this.StyledButton>
						<this.StyledButton
							onClick={(event) => {
								this.updateWidgetMoveDownItem(event);
							}}
						>
							&#11107;{" "}
						</this.StyledButton>
                        <this.StyledButton
                            onClick={(event) => {
                                this.updateWidgetRemoveItem(event);
                            }}
                        >
                            <img
                                src={`${getBasePath()}/webpack/resources/webpages/delete-symbol.svg`}
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
                            this.updateWidgetName(event, itemName);
                        }}
                        style={{ ...this.getFormStyle() }}
                    >
                        <this.ElementInputLabel
                            value={itemName}
                            setValue={setItemName}
                            readableText={"Group name"}
                            updater={(newValue: string) => { this.updateWidgetName(undefined, newValue) }}
                        >
                            Name:
                        </this.ElementInputLabel>

                        <input
                            style={{ ...this.getInputStyle(), color: mainWidget.getText()["useChannelItems"] ? "rgba(175, 175, 175, 1)" : "inherit" }}
                            type="string"
                            name="item-name"
                            value={itemName}
                            readOnly={mainWidget.getText()["useChannelItems"] === true ? true : false}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                const newVal = event.target.value;
                                setItemName(newVal);
                            }}
                            // must use enter to change the value
                            onBlur={(event) => {
                                const item = mainWidget.getItems()[this.getIndex()];
                                const orig = item.getName();
                                if (orig !== itemName) {
                                    setItemName(orig);
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
                    <Collapsible
                        rgbColorStr={`${mainWidget.getItems()[this.getIndex()].getBackgroundColor()}`}
                        updateFromSidebar={(
                            event: React.SyntheticEvent | null | undefined,
                            propertyName: string,
                            propertyValue: number | string | number[] | string[] | boolean | undefined
                        ) => {
                            this.updateWidgetBackgroundColor(event, propertyValue);
                        }}
                        title={"Color"}
                        eventName={"item-color"}
                    />
                </div>
            </this._BlockBody>
        );
    };
    updateWidgetName = (event: React.SyntheticEvent | null | undefined, propertyValue: string | number | boolean | number[] | string[] | undefined) => {
        if (event) {
            event.preventDefault();
        }

        const mainWidget = this.getMainWidget();
        const oldVal = mainWidget.getItems()[this.getIndex()].getName();
        if (propertyValue === oldVal) {
            return;
        } else {
            mainWidget.getItems()[this.getIndex()].setName(`${propertyValue}`);
        }

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(mainWidget.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };

    updateWidgetBackgroundColor = (event: React.SyntheticEvent | null | undefined, propertyValue: string | number | boolean | number[] | string[] | undefined) => {
        if (event) {
            event.preventDefault();
        }

        const mainWidget = this.getMainWidget();
        const newVal = GlobalMethods.rgbaArrayToRgbaStr(propertyValue as number[]);
        const oldVal = `${mainWidget.getItems()[this.getIndex()].getBackgroundColor()}`;
        if (newVal === oldVal) {
            return;
        } else {
            mainWidget.getItems()[this.getIndex()].setBackgroundColor(newVal);
        }

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(mainWidget.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };

    // maybe enable them

    updateWidgetMoveUpItem = (event: any) => {
    	if (event) {
    		event.preventDefault();
    	}
    	const mainWidget = this.getMainWidget();

    	if (this.getIndex() === 0) {
    		return;
    	}

        const newIndex = this.getIndex() - 1;
        const item = mainWidget.getItems()[this.getIndex()];
        mainWidget.moveItem(item, newIndex);

    	const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
    	history.registerAction();

    	g_widgets1.addToForceUpdateWidgets(mainWidget.getWidgetKey());
    	g_widgets1.addToForceUpdateWidgets("GroupSelection2");

    	g_flushWidgets();
    };

    updateWidgetMoveDownItem = (event: any) => {
    	if (event) {
    		event.preventDefault();
    	}
    	const mainWidget = this.getMainWidget();

    	if (this.getIndex() === mainWidget.getItems().length - 1) {
    		return;
    	}

        const newIndex = this.getIndex() + 1;
        const item = mainWidget.getItems()[this.getIndex()];
        mainWidget.moveItem(item, newIndex);

    	const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
    	history.registerAction();

    	g_widgets1.addToForceUpdateWidgets(mainWidget.getWidgetKey());
    	g_widgets1.addToForceUpdateWidgets("GroupSelection2");

    	g_flushWidgets();
    };


    updateWidgetRemoveItem = (event: React.SyntheticEvent | null | undefined) => {
        if (event) {
            event.preventDefault();
        }
        const mainWidget = this.getMainWidget();
        if (!(mainWidget instanceof Group)) {
            return;
        }

        const index = this.getIndex();
        mainWidget.removeItem(index);

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(mainWidget.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();

    };

    // --------------------------- getters -----------------------------

    getElement = () => {
        const mainWidget = this.getMainWidget();
        return <this._Element key={`${mainWidget.getItems()[this.getIndex()].getName()}-${this.getIndex()}`}></this._Element>;
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
}
