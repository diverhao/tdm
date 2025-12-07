import { SidebarEmbeddedDisplayItems } from "./SidebarEmbeddedDisplayItems";
import * as React from "react";
import { EmbeddedDisplay } from "../../widgets/EmbeddedDisplay/EmbeddedDisplay";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../Root/Root";
import { ElementButton, ElementMacrosTable } from "../SharedElements/MacrosTable";
import { ElementMacroInput, ElementMacroTd, ElementMacroTr } from "../SharedElements/MacrosTable";
import path from "path";
import { BaseWidget } from "../../widgets/BaseWidget/BaseWidget";

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

                        {this.isValidDisplayFile(tdlFileName) === false ? null :
                            <this.StyledButton
                                onClick={(event: any) => {
                                    const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
                                    const displayWindowId = displayWindowClient.getWindowId();
                                    const mainWidget = this.getMainWidget();

                                    const allMacros = mainWidget.getAllMacros();
                                    const itemMacros = mainWidget.getItemMacros()[this.getIndex()];
                                    const macros = [...itemMacros, ...allMacros];

                                    let tdlFileName = mainWidget.getTdlFileNames()[this.getIndex()];
                                    // the tdl file name is expanded based on the macros for this EmbeddedDisplay widget
                                    // the itemMacros is for the child tdl 
                                    tdlFileName = BaseWidget.expandChannelName(tdlFileName, allMacros);

                                    let currentTdlFolder = path.dirname(g_widgets1.getRoot().getDisplayWindowClient().getTdlFileName());

                                    // if this EmbeddedDisplay is inside another EmbeddedDisplay
                                    // use the parent EmbeddedDisplay's path
                                    if (mainWidget.getEmbeddedDisplayWidgetKey() !== "") {
                                        const parentWidget = g_widgets1.getWidget(mainWidget.getEmbeddedDisplayWidgetKey());
                                        if (parentWidget instanceof EmbeddedDisplay) {
                                            const parentFullTdlFileName = parentWidget.getFullTdlFileName();
                                            if (parentFullTdlFileName !== "") {
                                                currentTdlFolder = path.dirname(parentFullTdlFileName);
                                            }
                                        }
                                    }

                                    displayWindowClient.getIpcManager().sendFromRendererProcess("open-tdl-file", {
                                        options: {
                                            // tdl?: type_tdl;
                                            tdlFileNames: [tdlFileName],
                                            mode: "operating",
                                            editable: true,
                                            macros: macros,
                                            replaceMacros: true,
                                            currentTdlFolder: currentTdlFolder,
                                            windowId: displayWindowId,
                                            // sendContentsToWindow?: boolean;
                                        }
                                    });
                                }}
                            >
                                <img
                                    src={`../../../webpack/resources/webpages/view-file-symbol.svg`}
                                    style={{
                                        width: "75%",
                                        height: "75%",
                                    }}
                                ></img>
                            </this.StyledButton>
                        }

                        <this.StyledButton
                            onClick={(event: any) => {
                                const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
                                const displayWindowId = displayWindowClient.getWindowId();
                                displayWindowClient.getIpcManager().sendFromRendererProcess("select-a-file", {
                                    options: {
                                        displayWindowId: displayWindowId,
                                        widgetKey: this.getMainWidget().getWidgetKey(),
                                        itemIndex: this.getIndex(),
                                        filterType: "tdl",
                                    }
                                });
                            }}
                        >
                            <img
                                src={`../../../webpack/resources/webpages/open-file-symbol.svg`}
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

    isValidDisplayFile = (tdlFileName: string) => {
        if (tdlFileName.endsWith(".edl") || tdlFileName.endsWith(".tdl") || tdlFileName.endsWith(".bob")) {
            return true;
        } else {
            return false;
        }
    }

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
