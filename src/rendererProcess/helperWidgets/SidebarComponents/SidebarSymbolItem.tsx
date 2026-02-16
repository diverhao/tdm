import { SidebarSymbolItems } from "./SidebarSymbolItems";
import * as React from "react";
import { Symbol } from "../../widgets/Symbol/Symbol";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../Root/Root";
import { SymbolSidebar } from "../../widgets/Symbol/SymbolSidebar";
import { Log } from "../../../common/Log";
import { ElementButton } from "../SharedElements/MacrosTable";

export class SidebarSymbolItem {
    _items: SidebarSymbolItems;
    _index: number;
    StyledButton = ElementButton;
    _BlockBody: any;
    ElementInputLabel: any;
    constructor(items: SidebarSymbolItems, index: number) {
        this._items = items;
        this._index = index;
        // this.StyledButton = this.getItems().StyledButton;
        this._BlockBody = this.getItems()._BlockBody;
        this.ElementInputLabel = this.getItems()._ElementInputLabel
    }

    getMainWidget = () => {
        return this.getItems().getMainWidget() as Symbol | Symbol;
    };
    _updateFromWidget = (newFileName: string) => { };

    _Element = () => {
        const mainWidget = this.getMainWidget();
        const [itemName, setItemName] = React.useState(mainWidget.getItemNames()[this.getIndex()]);
        const [itemValue, setItemValue] = React.useState(`${mainWidget.getItemValues()[this.getIndex()]}`);

        this._updateFromWidget = (newFileName: string) => {
            mainWidget.getItemNames()[this.getIndex()] = newFileName;
            setItemName(newFileName);

            const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
            history.registerAction();

            g_widgets1.addToForceUpdateWidgets(mainWidget.getWidgetKey());
            g_widgets1.addToForceUpdateWidgets("GroupSelection2");

            g_flushWidgets();
        };

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
                    <div
                        style={{
                            display: "inline-flex",
                            flexDirection: "row",
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        {/* select image from gallery */}
                        <div
                            onClick={() => {
                                const mainWidget = this.getMainWidget();
                                const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient()
                                const symbolGallery = displayWindowClient.getSymbolGallery();
                                const fileName = mainWidget.getAllText()["fileName"];
                                symbolGallery.createElement(
                                    // callback function when we click Select button
                                    (
                                        symbolName: string,
                                        symbolContent: string
                                    ) => {
                                        console.log(symbolName, symbolContent, this.getMainWidget().getWidgetKey());
                                        this.updateWidgetName(undefined, symbolContent);
                                    },
                                    mainWidget.getWidgetKey(),
                                    fileName,
                                )
                            }}
                            style={{
                                display: "inline-flex",
                                flexDirection: "row",
                                justifyContent: "center",
                                alignItems: "center",
                            }}
                        >
                            <img
                                src={`../../../webpack/resources/webpages/gallery.svg`}
                                style={{
                                    width: 20,
                                    height: 15,
                                    objectFit: "scale-down",
                                }}
                            ></img>
                        </div>

                        {/* select image from file */}
                        <div
                            style={{
                                display: "inline-flex",
                                flexDirection: "row",
                                justifyContent: "center",
                                alignItems: "center",
                            }}
                            onClick={() => {
                                // get the file name
                                const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
                                const displayWindowId = displayWindowClient.getWindowId();
                                displayWindowClient.getIpcManager().sendFromRendererProcess("select-a-file", {
                                    options: {
                                        displayWindowId: displayWindowId,
                                        widgetKey: this.getMainWidget().getWidgetKey(),
                                        filterType: "picture",
                                        itemIndex: this.getIndex(),
                                    }
                                });
                            }}
                        >
                            <img
                                src={`../../../webpack/resources/webpages/open-file-symbol.svg`}
                                style={{
                                    width: 20,
                                    height: 15,
                                    objectFit: "scale-down",
                                }}
                            ></img>
                        </div>

                        <this.StyledButton
                            onClick={(event: any) => {
                                this.updateWidgetMoveUpItem(event);
                            }}
                        >
                            &#8593;{" "}
                        </this.StyledButton>
                        <this.StyledButton
                            onClick={(event: any) => {
                                this.updateWidgetMoveDownItem(event);
                            }}
                        >
                            &#8595;{" "}
                        </this.StyledButton>
                        <this.StyledButton
                            onClick={(event: any) => {
                                this.updateWidgetRemoveItem(event);
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
                            this.updateWidgetName(event, itemName);
                        }}
                        style={{ ...this.getFormStyle() }}
                    >
                        <this.ElementInputLabel
                            value={itemName}
                            setValue={setItemName}
                            readableText={"Symbol item name"}
                            updater={(newValue: string) => { this.updateWidgetName(undefined, newValue) }}
                        >
                            Name:
                        </this.ElementInputLabel>
                        <input
                            style={{
                                ...this.getInputStyle(),
                                // color: g_widgets1.getRoot().getDisplayWindowClient().getMainProcessMode() === "web" ? "rgba(175, 175, 175, 1)" : mainWidget.getText()["useChannelItems"] ? "rgba(175, 175, 175, 1)" : "inherit"
                            }
                            }
                            type="string"
                            name="item-name"
                            value={itemName}
                            // readOnly={g_widgets1.getRoot().getDisplayWindowClient().getMainProcessMode() === "web" ? true : mainWidget.getText()["useChannelItems"] === true ? true : false}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                const newVal = event.target.value;
                                setItemName(newVal);
                            }}
                            // must use enter to change the value
                            onBlur={(event: any) => {
                                const orig = mainWidget.getItemNames()[this.getIndex()];
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
                    <form
                        onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                            this.updateWidgetValue(event, itemValue);
                        }}
                        style={{ ...this.getFormStyle() }}
                    >
                        <div>Value:</div>
                        <input
                            style={{ ...this.getInputStyle(), color: mainWidget.getText()["useChannelItems"] ? "rgba(175, 175, 175, 1)" : "inherit" }}
                            type="string"
                            name="item-value"
                            value={itemValue}
                            readOnly={mainWidget.getText()["useChannelItems"] === true ? true : false}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                const newVal = event.target.value;
                                setItemValue(newVal);
                            }}
                            // must use enter to change the value
                            onBlur={(event: any) => {
                                const orig = `${mainWidget.getItemValues()[this.getIndex()]}`;
                                if (orig !== itemValue) {
                                    setItemValue(orig);
                                }
                            }}
                        />
                    </form>
                </div>
            </this._BlockBody>
        );
    };
    updateWidgetName = (event: any, propertyValue: string | number | boolean | number[] | string[] | undefined) => {
        if (event) {
            event.preventDefault();
        }

        const mainWidget = this.getMainWidget();
        const oldVal = mainWidget.getItemNames()[this.getIndex()];
        if (propertyValue === oldVal) {
            return;
        } else {
            mainWidget.getItemNames()[this.getIndex()] = `${propertyValue}`;
        }

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(mainWidget.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };

    updateWidgetValue = (event: any, propertyValue: string | number | boolean | number[] | string[] | undefined) => {
        if (event) {
            event.preventDefault();
        }

        const mainWidget = this.getMainWidget();
        const oldVal = `${mainWidget.getItemValues()[this.getIndex()]}`;
        if (propertyValue === oldVal) {
            return;
        } else {
            if (typeof mainWidget.getItemValues()[this.getIndex()] === "number") {
                try {
                    mainWidget.getItemValues()[this.getIndex()] = parseFloat(`${propertyValue}`);
                } catch (e) {
                    Log.error(e);
                }
            }
            // else {
            //     mainWidget.getItemValues()[this.getIndex()] = `${propertyValue}`;
            // }
        }

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(mainWidget.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };

    updateWidgetMoveUpItem = (event: any) => {
        if (event) {
            event.preventDefault();
        }
        const mainWidget = this.getMainWidget();

        if (this.getIndex() === 0) {
            return;
        }

        const thisIndex = this.getIndex();

        const itemName = mainWidget.getItemNames()[thisIndex];
        mainWidget.getItemNames().splice(thisIndex, 1);
        mainWidget.getItemNames().splice(thisIndex - 1, 0, itemName);

        const itemValue = mainWidget.getItemValues()[thisIndex];
        mainWidget.getItemValues().splice(thisIndex, 1);
        mainWidget.getItemValues().splice(thisIndex - 1, 0, itemValue);

        const member = this.getItems().getMembers()[thisIndex];
        const member2 = this.getItems().getMembers()[thisIndex - 1];

        member.setIndex(thisIndex - 1);
        member2.setIndex(thisIndex);

        this.getItems().getMembers().splice(thisIndex, 1);
        this.getItems()
            .getMembers()
            .splice(thisIndex - 1, 0, member);

        this.getItems()._forceUpdate();

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

        if (this.getIndex() >= mainWidget.getItemNames().length - 1) {
            return;
        }

        const thisIndex = this.getIndex();

        const itemName = mainWidget.getItemNames()[thisIndex];
        mainWidget.getItemNames().splice(thisIndex, 1);
        mainWidget.getItemNames().splice(thisIndex + 1, 0, itemName);

        const itemValue = mainWidget.getItemValues()[thisIndex];
        mainWidget.getItemValues().splice(thisIndex, 1);
        mainWidget.getItemValues().splice(thisIndex + 1, 0, itemValue);

        const member = this.getItems().getMembers()[thisIndex];
        const member2 = this.getItems().getMembers()[thisIndex + 1];

        member.setIndex(thisIndex + 1);
        member2.setIndex(thisIndex);

        this.getItems().getMembers().splice(thisIndex, 1);
        this.getItems()
            .getMembers()
            .splice(thisIndex + 1, 0, member);

        this.getItems()._forceUpdate();

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(mainWidget.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };

    updateWidgetRemoveItem = (event: any) => {
        if (event) {
            event.preventDefault();
        }
        const mainWidget = this.getMainWidget();
        if (mainWidget.getItemNames().length <= 1 && mainWidget.getWidgetKey().includes("Symbol")) {
            return;
        }

        const thisIndex = this.getIndex();

        mainWidget.getItemNames().splice(thisIndex, 1);

        mainWidget.getItemValues().splice(thisIndex, 1);

        this.getItems().getMembers().splice(thisIndex, 1);
        for (let ii = thisIndex; ii < mainWidget.getItemNames().length; ii++) {
            const item = this.getItems().getMembers()[ii];
            item.setIndex(ii);
        }

        this.getItems()._forceUpdate();

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(mainWidget.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };

    // --------------------------- getters -----------------------------

    getElement = () => {
        const mainWidget = this.getMainWidget();
        return <this._Element key={`${mainWidget.getItemNames()[this.getIndex()]}-${this.getIndex()}`}></this._Element>;
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
