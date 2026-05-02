import { SidebarEmbeddedDisplayItems } from "./SidebarEmbeddedDisplayItems";
import * as React from "react";
import { EmbeddedDisplay } from "../../widgets/EmbeddedDisplay/EmbeddedDisplay";
import { g_widgets1, getBasePath } from "../../global/GlobalVariables";
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

    getDisplay = () => {
        return this.getMainWidget().getDisplay(this.getIndex());
    };

    _Element = () => {
        const mainWidget = this.getMainWidget();
        const currentDisplay = this.getDisplay();
        const [itemName, setItemName] = React.useState(currentDisplay?.name ?? "");
        const [tdlFileName, setTdlFileName] = React.useState(`${currentDisplay?.tdlFileName ?? ""}`);
        // const [macro, setMacro] = React.useState(`${mainWidget.getMacros()[this.getIndex()]}`);

        this._updateFromWidget = (newTdlFileName: string) => {
            const display = this.getDisplay();
            if (display === undefined) {
                return;
            }
            // for runtime
            display.tdlFileName = newTdlFileName;
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
                                onClick={(event) => {
                                    const mainWidget = this.getMainWidget();
                                    mainWidget.openChildTdlFile(this.getIndex());
                                }}
                            >
                                <img
                                    src={`${getBasePath()}/webpack/resources/webpages/view-file-symbol.svg`}
                                    style={{
                                        width: "75%",
                                        height: "75%",
                                    }}
                                ></img>
                            </this.StyledButton>
                        }

                        <this.StyledButton
                            onClick={(event) => {
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
                                src={`${getBasePath()}/webpack/resources/webpages/open-file-symbol.svg`}
                                style={{
                                    width: "75%",
                                    height: "75%",
                                }}
                            ></img>
                        </this.StyledButton>

                        <this.StyledButton
                            onClick={(event) => {
                                this.updateWidgetMoveUpItem(event);
                            }}
                        >
                            &#8593;{" "}
                        </this.StyledButton>
                        <this.StyledButton
                            onClick={(event) => {
                                this.updateWidgetMoveDownItem(event);
                            }}
                        >
                            &#8595;{" "}
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
                            onBlur={(event) => {
                                const orig = this.getDisplay()?.name ?? "";
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
                            onBlur={(event) => {
                                const orig = `${this.getDisplay()?.tdlFileName ?? ""}`;
                                if (orig !== tdlFileName) {
                                    setTdlFileName(orig);
                                }
                            }}
                        />
                    </form>
                </div>
                {this.getDisplay()?.isWebpage === true ? null : <this._ElementMacros></this._ElementMacros>}
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
                        macrosData={this.getDisplay()?.macros ?? []}
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

    updateWidgetName = (event: React.SyntheticEvent | null | undefined, propertyValue: string | number | boolean | number[] | string[] | undefined) => {
        if (event) {
            event.preventDefault();
        }

        const mainWidget = this.getMainWidget();
        const display = this.getDisplay();
        if (display === undefined) {
            return;
        }
        const oldVal = display.name;
        if (propertyValue === oldVal) {
            return;
        } else {
            display.name = `${propertyValue}`;
        }

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(mainWidget.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };

    updateWidgetTdlFileName = (event: React.SyntheticEvent | null | undefined, propertyValue: string | number | boolean | number[] | string[] | undefined) => {
        if (event) {
            event.preventDefault();
        }

        const mainWidget = this.getMainWidget();
        const display = this.getDisplay();
        if (display === undefined) {
            return;
        }
        const oldVal = `${display.tdlFileName}`;
        if (propertyValue === oldVal) {
            return;
        } else {
            display.tdlFileName = `${propertyValue}`;
        }

        // if (this.getDisplay()?.isWebpage === true) {
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

    updateWidgetMoveDownItem = (event: React.SyntheticEvent | null | undefined) => {
        if (event) {
            event.preventDefault();
        }
        const mainWidget = this.getMainWidget();

        if (this.getIndex() >= mainWidget.getDisplays().length - 1) {
            return;
        }

        const thisIndex = this.getIndex();

        const display = mainWidget.getDisplays()[thisIndex];
        mainWidget.getDisplays().splice(thisIndex, 1);
        mainWidget.getDisplays().splice(thisIndex + 1, 0, display);

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

    updateWidgetMoveUpItem = (event: React.SyntheticEvent | null | undefined) => {
        if (event) {
            event.preventDefault();
        }
        const mainWidget = this.getMainWidget();

        if (this.getIndex() === 0) {
            return;
        }

        const thisIndex = this.getIndex();

        const display = mainWidget.getDisplays()[thisIndex];
        mainWidget.getDisplays().splice(thisIndex, 1);
        mainWidget.getDisplays().splice(thisIndex - 1, 0, display);

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

    updateWidgetRemoveItem = (event: React.SyntheticEvent | null | undefined) => {
        if (event) {
            event.preventDefault();
        }
        const mainWidget = this.getMainWidget();
        if (mainWidget.getDisplays().length <= 1 && mainWidget.getWidgetKey().includes("EmbeddedDisplay")) {
            return;
        }

        const thisIndex = this.getIndex();

        mainWidget.getDisplays().splice(thisIndex, 1);
        this.getItems().getMembers().splice(thisIndex, 1);

        // mainWidget.updateEmbeddedDisplayRemoveTab(thisIndex);

        // the indices are updatd in main process in above "remove-tab" event
        // the tab #0 is selected in main process, without using the "select-tab" event
        for (let ii = thisIndex; ii < mainWidget.getDisplays().length; ii++) {
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
        return <this._Element key={`${mainWidget.getDisplay(this.getIndex())?.name ?? ""}-${this.getIndex()}`}></this._Element>;
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
