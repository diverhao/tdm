import { SidebarActionItems } from "./SidebarActionItems";
import * as React from "react";
import { ActionButton } from "../../widgets/ActionButton/ActionButton";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../Root/Root";
import { type_action_opendisplay_tdl } from "../../widgets/ActionButton/ActionButton";
import { ElementMacroTd, ElementMacroTr, ElementMacroInput, ElementMacrosTable } from "../SharedElements/MacrosTable";
import { ElementButton } from "../SharedElements/MacrosTable";
import { ElementRectangleButton } from "../SharedElements/RectangleButton";
import path from "path";
import { Canvas } from "../Canvas/Canvas";
import { BaseWidget } from "../../widgets/BaseWidget/BaseWidget";

export class SidebarActionOpenDisplayItem {
    _items: SidebarActionItems;
    _index: number;
    StyledButton = ElementButton;
    _BlockBody: any;
    ElementInputLabel: any;
    constructor(items: SidebarActionItems, index: number) {
        this._items = items;
        this._index = index;
        // this.StyledButton = this.getItems().StyledButton;
        this._BlockBody = this.getItems()._BlockBody;
        this.ElementInputLabel = this.getItems()._ElementInputLabel
    }

    getMainWidget = () => {
        return this.getItems().getMainWidget() as ActionButton;
    };

    getTdl = () => {
        const mainWidget = this.getMainWidget();
        return mainWidget.getActions()[this.getIndex()] as type_action_opendisplay_tdl;
    };
    _updateFromWidget = (newTdlFileName: string) => { };

    _Element = () => {
        // const mainWidget = this.getMainWidget();
        const [label, setLabel] = React.useState(this.getTdl()["label"]);
        const [fileName, setFileName] = React.useState(this.getTdl()["fileName"]);

        this._updateFromWidget = (newTdlFileName: string) => {
            this.getTdl()["fileName"] = newTdlFileName;

            setFileName(newTdlFileName);

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
                        whiteSpace: "nowrap",
                        overflow: "visible",
                        backgroundColor: "rgba(240,240,240,1)",
                    }}
                >
                    <div
                        style={{
                            display: "inline-flex",
                            width: "20%",
                            overflow: "visible",
                        }}
                    >
                        <b>{`#${this.getIndex()}`}</b>&nbsp;
                        <b
                            style={{
                                cursor: "pointer",
                            }}
                            onClick={() => {
                                // to get the file name
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
                        >{`Open Display`}</b>
                    </div>
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <this.StyledButton
                            onClick={(event: any) => {
                                this.getItems().updateWidgetMoveUpAction(event, this.getIndex());
                            }}
                        >
                            &#8593;{" "}
                        </this.StyledButton>
                        <this.StyledButton
                            onClick={(event: any) => {
                                this.getItems().updateWidgetMoveDownAction(event, this.getIndex());
                            }}
                        >
                            &#8595;{" "}
                        </this.StyledButton>
                        <this.StyledButton
                            onClick={(event: any) => {
                                this.getItems().updateWidgetRemoveAction(event, this.getIndex());
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
                        {/* <div
							style={{
								display: "inline-flex",
								flexDirection: "row",
								justifyContent: "center",
								alignItems: "center",
							}}
							onClick={() => {
								// to get the file name
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
								src="../../../webpack/resources/webpages/open-file-symbol.svg"
								style={{
									width: 20,
									height: 15,
									objectFit: "scale-down",
								}}
							></img>
						</div> */}
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
                            this.updateWidgetLabel(event, label);
                        }}
                        style={{ ...this.getFormStyle(), width: "100%" }}
                    >
                        <this.ElementInputLabel
                            value={label}
                            setValue={setLabel}
                            readableText={"Open Display label"}
                            updater={(newValue: string) => { this.updateWidgetLabel(undefined, newValue) }}
                        >
                            Label:
                        </this.ElementInputLabel>

                        <input
                            style={{ ...this.getInputStyle() }}
                            type="string"
                            name="item-label"
                            value={label}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                const newVal = event.target.value;
                                setLabel(newVal);
                            }}
                            // must use enter to change the value
                            onBlur={(event: any) => {
                                const orig = this.getTdl()["label"];
                                if (orig !== label) {
                                    setLabel(orig);
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
                            this.updateWidgetFileName(event, fileName);
                        }}
                        style={{ ...this.getFormStyle(), width: "100%" }}
                    >
                        <this.ElementInputLabel
                            value={fileName}
                            setValue={setFileName}
                            readableText={"Open Display file"}
                            updater={(newValue: string) => { this.updateWidgetFileName(undefined, newValue) }}
                        >
                            File:
                        </this.ElementInputLabel>

                        <input
                            style={{ ...this.getInputStyle() }}
                            type="string"
                            name="item-file-name"
                            value={fileName}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                const newVal = event.target.value;
                                setFileName(newVal);
                            }}
                            // must use enter to change the value
                            onBlur={(event: any) => {
                                const orig = this.getTdl()["fileName"];
                                if (orig !== fileName) {
                                    setFileName(orig);
                                }
                            }}
                        />
                    </form>
                </div>
                <this._ElementExternalMacros></this._ElementExternalMacros>
                <this._ElementUseParentMacros></this._ElementUseParentMacros>
                <this._ElementTryToOpen></this._ElementTryToOpen>
                <this._ElementOpenInSameWindow></this._ElementOpenInSameWindow>

                <this._HorizontalLine />
            </this._BlockBody>
        );
    };


    _ElementTryToOpen = () => {
        const index = this.getIndex();
        const mainWidget = this.getMainWidget();

        // similar to ActionButton.openDisplay() method
        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
        const currentTdlFileName = displayWindowClient.getTdlFileName();
        const currentTdlFolder = path.dirname(currentTdlFileName);


        const displayConfig = mainWidget.getActions()[index] as type_action_opendisplay_tdl;
        let tdlFileName = displayConfig["fileName"];

        let externalMacros = [...displayConfig["externalMacros"]]
        if (displayConfig["useParentMacros"]) {
            const parentMacros = mainWidget.getAllMacros();
            externalMacros = [...externalMacros, ...parentMacros];
        }

        tdlFileName = BaseWidget.expandChannelName(tdlFileName, externalMacros)

        return (
            <div
                style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 3,
                }}
            >
                <div>
                    Try to open:
                </div>
                <this.StyledButton
                    onClick={() => {
                        const ipcManager = g_widgets1.getRoot().getDisplayWindowClient().getIpcManager();
                        ipcManager.sendFromRendererProcess("open-tdl-file", {
                            options: {
                                tdlFileNames: [tdlFileName],
                                mode: "editing",
                                editable: true,
                                macros: externalMacros,
                                replaceMacros: true, // not used
                                currentTdlFolder: currentTdlFolder,
                                // openInSameWindow: false,
                                windowId: g_widgets1.getRoot().getDisplayWindowClient().getWindowId(),
                            }
                        });

                    }}
                >
                    <img
                        src={`../../../webpack/resources/webpages/open-link-symbol.svg`}
                        style={{
                            width: "60%",
                            height: "60%",
                        }}
                    ></img>
                </this.StyledButton>
            </div>
        )
    }

    private _ElementExternalMacros = () => {
        return (
            <>
                <div style={this._macroLineStyle}>
                    <div>Macros</div>
                </div>
                <div>
                    <ElementMacrosTable
                        headlineName1={"Name"}
                        headlineName2={"Value"}
                        macrosData={this.getTdl()["externalMacros"]}
                    >
                    </ElementMacrosTable>
                </div>
            </>
        );
    };


    _ElementUseParentMacros = () => {
        const [useParentMacros, setUseParentMacros] = React.useState(this.getTdl()["useParentMacros"]);

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

                        const oldVal = this.getTdl()["useParentMacros"];
                        const propertyValue = !useParentMacros;
                        if (propertyValue === oldVal) {
                            return;
                        } else {
                            this.getTdl()["useParentMacros"] = propertyValue;
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

    _ElementOpenInSameWindow = () => {
        const [openInSameWindow, setOpenInSameWindow] = React.useState(this.getTdl()["openInSameWindow"]);

        return (
            <form
                style={{
                    display: "inline-flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            // onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.updateWidget(event, invisibleInOperation)} style={this.getFormStyle()}
            >
                <div>Open in same window:</div>
                <input
                    type="checkbox"
                    checked={openInSameWindow}
                    onChange={(event: any) => {
                        // do not preventDefault()

                        const oldVal = this.getTdl()["openInSameWindow"];
                        const propertyValue = !openInSameWindow;
                        if (propertyValue === oldVal) {
                            return;
                        } else {
                            this.getTdl()["openInSameWindow"] = propertyValue;
                        }

                        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
                        history.registerAction();

                        g_widgets1.addToForceUpdateWidgets(this.getMainWidget().getWidgetKey());
                        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

                        g_flushWidgets();

                        setOpenInSameWindow((prevVal: boolean) => {
                            return !prevVal;
                        });
                    }}
                />
            </form>
        );
    };

    updateWidgetLabel = (event: any, propertyValue: string | number | boolean | number[] | string[] | undefined) => {
        if (event) {
            event.preventDefault();
        }

        const mainWidget = this.getMainWidget();
        const oldVal = this.getTdl()["label"];
        if (propertyValue === oldVal) {
            return;
        } else {
            this.getTdl()["label"] = `${propertyValue}`;
        }

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(mainWidget.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };

    updateWidgetFileName = (event: any, propertyValue: string | number | boolean | number[] | string[] | undefined) => {
        if (event) {
            event.preventDefault();
        }

        const mainWidget = this.getMainWidget();
        const oldVal = this.getTdl()["fileName"];
        if (propertyValue === oldVal) {
            return;
        } else {
            this.getTdl()["fileName"] = `${propertyValue}`;
        }

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(mainWidget.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };

    // --------------------------- getters -----------------------------

    getElement = () => {
        const mainWidget = this.getMainWidget();
        return <this._Element key={`${this.getTdl()["label"]}-${this.getIndex()}`}></this._Element>;
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

    // -------------------------- styled components ----------------------------

    private _macroFormStyle: Record<string, any> = {
        display: "inline-flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 2,
        marginBottom: 2,
        width: "95%",
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

    // _StyledMacroInput = styled.input<any>`
    // 	width: 100%;
    // 	padding: 0;
    // 	margin: 0;
    // 	border: 0;
    // 	outline: none;
    // 	background-color: rgba(0, 0, 0, 0);
    // 	&:hover {
    // 		/* background-color: rgba(245, 245, 245, 1); */
    // 		cursor: pointer;
    // 	}
    // 	&:focus {
    // 		/* background-color: lightgrey; */
    // 		color: blue;
    // 	}
    // 	&::placeholder {
    // 		color: rgba(200, 200, 200, 1);
    // 	}
    // `;

    _HorizontalLine = () => {
        return <div>&nbsp;</div>;
    };

}
