import { SidebarEmbeddedDisplayItems } from "./SidebarEmbeddedDisplayItems";
import * as React from "react";
import { EmbeddedDisplay } from "../../widgets/EmbeddedDisplay/EmbeddedDisplay";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../Root/Root";
import { ElementButton, ElementMacrosTable } from "../SharedElements/MacrosTable";
import { ElementMacroInput, ElementMacroTd, ElementMacroTr } from "../SharedElements/MacrosTable";

export class SidebarEmbeddedDisplayItem {
    _items: SidebarEmbeddedDisplayItems;
    _index: number;
    StyledButton = ElementButton;
    _BlockBody: any;
    ElementInputLabel: any;
    _updateFromWidget = (newTdlFileName: string) => { };
    constructor(items: SidebarEmbeddedDisplayItems, index: number) {
        this._items = items;
        this._index = index;
        // this.StyledButton = this.getItems().StyledButton;
        this._BlockBody = this.getItems()._BlockBody;
        this.ElementInputLabel = this.getItems()._ElementInputLabel
    }

    getMainWidget = () => {
        return this.getItems().getMainWidget() as EmbeddedDisplay;
    };

    _Element = () => {
        const mainWidget = this.getMainWidget();
        const [itemName, setItemName] = React.useState(mainWidget.getItemNames()[this.getIndex()]);
        const [tdlFileName, setTdlFileName] = React.useState(`${mainWidget.getTdlFileNames()[this.getIndex()]}`);
        // const [macro, setMacro] = React.useState(`${mainWidget.getMacros()[this.getIndex()]}`);

        this._updateFromWidget = (newTdlFileName: string) => {

            const mainWidget = this.getMainWidget();
            // for runtime
            mainWidget.getTdlFileNames()[this.getIndex()] = newTdlFileName;
            setTdlFileName(newTdlFileName);

            const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
            history.registerAction();

            g_widgets1.addToForceUpdateWidgets(this.getMainWidget().getWidgetKey());
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
                    <div style={{
                        display: "inline-flex",
                        justifyContent: "center",
                        alignItems: "center",
                    }}>
                        <this.StyledButton
                            onClick={(event: any) => {
                                const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
                                const displayWindowId = displayWindowClient.getWindowId();
                                displayWindowClient.getIpcManager().sendFromRendererProcess("select-a-file", {
                                    displayWindowId: displayWindowId,
                                    widgetKey: this.getMainWidget().getWidgetKey(),
                                    itemIndex: this.getIndex(),
                                    filterType: "tdl",
                                });
                            }}
                        >
                            <img
                                src={`../../resources/webpages/open-file-symbol.svg`}
                                style={{
                                    width: "75%",
                                    height: "75%",
                                }}
                            ></img>
                        </this.StyledButton>

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
                                src={`../../resources/webpages/delete-symbol.svg`}
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
                        style={{ ...this.getFormStyle(), width: "100%" }}
                    >
                        <this.ElementInputLabel
                            value={itemName}
                            setValue={setItemName}
                            readableText={"Embedded Display name"}
                            updater={(newValue: string) => { this.updateWidgetName(undefined, newValue) }}
                        >
                            Name:
                        </this.ElementInputLabel>
                        <input
                            style={{ ...this.getInputStyle() }}
                            type="string"
                            name="item-name"
                            value={itemName}
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
                            this.updateWidgetTdlFileName(event, tdlFileName);
                        }}
                        style={{ ...this.getFormStyle(), width: "100%" }}
                    >
                        <this.ElementInputLabel
                            value={tdlFileName}
                            setValue={setTdlFileName}
                            readableText={"Embedded Display file"}
                            updater={(newValue: string) => { this.updateWidgetTdlFileName(undefined, newValue) }}
                        >
                            File:
                        </this.ElementInputLabel>
                        <input
                            style={{ ...this.getInputStyle() }}
                            type="string"
                            name="tdl-file-name"
                            value={tdlFileName}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                const newVal = event.target.value;
                                setTdlFileName(newVal);
                            }}
                            // must use enter to change the value
                            onBlur={(event: any) => {
                                const orig = `${mainWidget.getTdlFileNames()[this.getIndex()]}`;
                                if (orig !== tdlFileName) {
                                    setTdlFileName(orig);
                                }
                            }}
                        />
                    </form>
                </div>
                {mainWidget.getItemIsWebpage()[this.getIndex()] === true ? null : <this._ElementMacros></this._ElementMacros>}
                {mainWidget.getItemIsWebpage()[this.getIndex()] === true ? null : <this._ElementUseParentMacros></this._ElementUseParentMacros>}
                <div>&nbsp;</div>
            </this._BlockBody>
        );
    };

    private _ElementMacros = () => {
        return (
            <>
                <div style={this._macroLineStyle}>
                    <div>Macros</div>
                </div>
                <div>
                    <ElementMacrosTable
                        headlineName1={"Name"}
                        headlineName2={"Value"}
                        macrosData={this.getMainWidget().getItemMacros()[this.getIndex()]}
                    >
                    </ElementMacrosTable>
                </div>
            </>
        );
    };


    _ElementUseParentMacros = () => {
        const [useParentMacros, setUseParentMacros] = React.useState(this.getMainWidget().getText()["useParentMacros"]);

        return (
            <form
                style={{
                    display: "inline-flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            // onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.updateWidget(event, invisibleInOperation)} style={this.getFormStyle()}
            >
                <div>Use Parent Macros:</div>
                <input
                    type="checkbox"
                    checked={useParentMacros}
                    onChange={(event: any) => {
                        // do not preventDefault()

                        const oldVal = this.getMainWidget().getText()["useParentMacros"];
                        const propertyValue = !useParentMacros;
                        if (propertyValue === oldVal) {
                            return;
                        } else {
                            this.getMainWidget().getText()["useParentMacros"] = propertyValue;
                        }

                        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
                        history.registerAction();

                        g_widgets1.addToForceUpdateWidgets(this.getMainWidget().getWidgetKey());
                        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

                        g_flushWidgets();

                        setUseParentMacros((prevVal: boolean) => {
                            return !prevVal;
                        });
                    }}
                />
            </form>
        );
    };
    
    private _macroLineStyle: Record<string, any> = {
        display: "inline-flex",
        position: "relative",
        flexDirection: "Row",
        width: "100%",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 2,
        marginBottom: 2,
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

    updateWidgetTdlFileName = (event: any, propertyValue: string | number | boolean | number[] | string[] | undefined) => {
        if (event) {
            event.preventDefault();
        }

        const mainWidget = this.getMainWidget();
        const oldVal = `${mainWidget.getTdlFileNames()[this.getIndex()]}`;
        if (propertyValue === oldVal) {
            return;
        } else {
            mainWidget.getTdlFileNames()[this.getIndex()] = `${propertyValue}`;
        }

        // if (mainWidget.getItemIsWebpage()[this.getIndex()] === true) {
        // 	mainWidget.updateEmbeddedDisplayUrl(this.getIndex());
        // } else {
        // 	mainWidget.updateEmbeddedDisplayTdlFileName(this.getIndex());
        // }

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

        const tdlFileName = mainWidget.getTdlFileNames()[thisIndex];
        mainWidget.getTdlFileNames().splice(thisIndex, 1);
        mainWidget.getTdlFileNames().splice(thisIndex + 1, 0, tdlFileName);

        const macro = mainWidget.getItemMacros()[thisIndex];
        mainWidget.getItemMacros().splice(thisIndex, 1);
        mainWidget.getItemMacros().splice(thisIndex + 1, 0, macro);

        const isWebpage = mainWidget.getItemIsWebpage()[thisIndex];
        mainWidget.getItemIsWebpage().splice(thisIndex, 1);
        mainWidget.getItemIsWebpage().splice(thisIndex + 1, 0, isWebpage);

        const member = this.getItems().getMembers()[thisIndex];
        const member2 = this.getItems().getMembers()[thisIndex + 1];

        member.setIndex(thisIndex + 1);
        member2.setIndex(thisIndex);

        this.getItems().getMembers().splice(thisIndex, 1);
        this.getItems()
            .getMembers()
            .splice(thisIndex + 1, 0, member);

        // mainWidget.updateEmbeddedDisplayIndices([thisIndex, thisIndex + 1], [thisIndex + 1, thisIndex]);

        if (thisIndex === mainWidget.getSelectedTab()) {
            mainWidget.setSelectedTab(thisIndex + 1);
        } else if (thisIndex + 1 === mainWidget.getSelectedTab()) {
            mainWidget.setSelectedTab(thisIndex);
        }

        this.getItems()._forceUpdate();

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

        const tdlFileName = mainWidget.getTdlFileNames()[thisIndex];
        mainWidget.getTdlFileNames().splice(thisIndex, 1);
        mainWidget.getTdlFileNames().splice(thisIndex - 1, 0, tdlFileName);

        const macro = mainWidget.getItemMacros()[thisIndex];
        mainWidget.getItemMacros().splice(thisIndex, 1);
        mainWidget.getItemMacros().splice(thisIndex - 1, 0, macro);

        const isWebpage = mainWidget.getItemIsWebpage()[thisIndex];
        mainWidget.getItemIsWebpage().splice(thisIndex, 1);
        mainWidget.getItemIsWebpage().splice(thisIndex - 1, 0, isWebpage);

        const member = this.getItems().getMembers()[thisIndex];
        const member2 = this.getItems().getMembers()[thisIndex - 1];

        member.setIndex(thisIndex - 1);
        member2.setIndex(thisIndex);

        this.getItems().getMembers().splice(thisIndex, 1);
        this.getItems()
            .getMembers()
            .splice(thisIndex - 1, 0, member);

        // mainWidget.updateEmbeddedDisplayIndices([thisIndex, thisIndex - 1], [thisIndex - 1, thisIndex]);

        if (thisIndex === mainWidget.getSelectedTab()) {
            mainWidget.setSelectedTab(thisIndex - 1);
        } else if (thisIndex - 1 === mainWidget.getSelectedTab()) {
            mainWidget.setSelectedTab(thisIndex);
        }

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
        if (mainWidget.getItemNames().length <= 1 && mainWidget.getWidgetKey().includes("EmbeddedDisplay")) {
            return;
        }

        const thisIndex = this.getIndex();

        mainWidget.getItemNames().splice(thisIndex, 1);
        mainWidget.getTdlFileNames().splice(thisIndex, 1);
        mainWidget.getItemMacros().splice(thisIndex, 1);
        mainWidget.getItemIsWebpage().splice(thisIndex, 1);
        this.getItems().getMembers().splice(thisIndex, 1);

        // mainWidget.updateEmbeddedDisplayRemoveTab(thisIndex);

        // the indices are updatd in main process in above "remove-tab" event
        // the tab #0 is selected in main process, without using the "select-tab" event
        for (let ii = thisIndex; ii < mainWidget.getItemNames().length; ii++) {
            const item = this.getItems().getMembers()[ii];
            item.setIndex(ii);
        }

        mainWidget.setSelectedTab(0);

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
