import * as GlobalMethods from "../../../common/GlobalMethods";
import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { ActionButtonSidebar } from "./ActionButtonSidebar";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { BaseWidgetRules } from "../BaseWidget/BaseWidgetRules";
import { ActionButtonRule } from "./ActionButtonRule";
import path from "path";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { Log } from "../../../common/Log";
import {
    type_ActionButton_tdl,
    type_actions_tdl,
    type_action_opendisplay_tdl,
    type_action_writepv_tdl,
    type_action_executecommand_tdl,
    type_action_executescript_tdl,
    type_action_openwebpage_tdl,
    type_action_closedisplaywindow,
    defaultActionButtonTdl,
} from "../../../common/types/type_widget_tdl";

export class ActionButton extends BaseWidget {

    _rules: BaseWidgetRules;

    // the <select /> component costs huge amount of resources during rendering
    // each such component takes about 2 ms to render, which is one order of magnitude 
    // more than a regular component. That means if a display has 500 such components,
    // it may cost 1 second to render them, which is unacceptable.
    // In here we delay the render of <select /> components until all widgets are rendered
    setDropDownActivated: React.Dispatch<React.SetStateAction<boolean>> = (value: React.SetStateAction<boolean>) => { };

    _actions: type_actions_tdl;
    constructor(widgetTdl: type_ActionButton_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this.setReadWriteType("write");

        this._rules = new BaseWidgetRules(this, widgetTdl, ActionButtonRule);

        this._actions = structuredClone(widgetTdl.actions);
    }


    // ------------------------------ elements ---------------------------------

    // Body + sidebar
    _ElementRaw = () => {
        // guard the widget from double rendering
        this.widgetBeingRendered = true;
        React.useEffect(() => {
            this.widgetBeingRendered = false;
        });
        g_widgets1.removeFromForceUpdateWidgets(this.getWidgetKey());

        this.updateAllStyleAndText();

        // in contemporary style, the button has round corners
        const borderRadius = this.getAllText()["appearance"] === "traditional" ? 0 : 3;

        return (
            <ErrorBoundary style={this.getStyle()} widgetKey={this.getWidgetKey()}>
                <div style={{ ...this.getElementBodyRawStyle(), borderRadius: borderRadius }}>
                    <this._ElementArea></this._ElementArea>
                    {this.showResizers() ? <this._ElementResizer /> : null}
                </div>
                {this.showSidebar() ? this._sidebar?.getElement() : null}
            </ErrorBoundary>
        );
    };

    _ElementAreaRaw = (): React.JSX.Element => {

        const allText = this.getAllText();

        const whiteSpace = allText.wrapWord ? "normal" : "pre";
        const justifyContent = allText.horizontalAlign;
        const alignItems = allText.verticalAlign;
        const outline = this._getElementAreaRawOutlineStyle();
        const color = this._getElementAreaRawTextStyle();
        const borderRadius = this.getAllText()["appearance"] === "traditional" ? 0 : 3;
        const backgroundColor = this._getElementAreaRawBackgroundStyle();

        return (
            <div
                style={{
                    display: "inline-flex",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    userSelect: "none",
                    overflow: "visible",
                    whiteSpace: whiteSpace,
                    justifyContent: justifyContent,
                    alignItems: alignItems,
                    outline: outline,
                    color: color,
                    borderRadius: borderRadius,
                    backgroundColor: backgroundColor,
                }}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                <this._ElementActionButton></this._ElementActionButton>
            </div>
        );
    };

    _Element = React.memo(this._ElementRaw, () => this._useMemoedElement());
    _ElementArea = React.memo(this._ElementAreaRaw, () => this._useMemoedElement());

    /**
     * If there is 0 action, show getAllText()["text"]. Click does not have any response. <br>
     *
     * If there is 1 action, show this action's name. Click the button will execute this action. <br>
     *
     * If there are more than 1 action, show getAllText()["text"]. Click the button will show the dropdown menu, after clicking the
     * dropdown menu item, the action is executed, and the button continue showing getAllText()["text"] <br>
     */

    _ElementActionButton = () => {
        // const [showDropDown, setShowDropDown] = React.useState(false);
        const elementRef = React.useRef<HTMLDivElement>(null);

        // 3D shadow
        const threeDStyle = this.get3dButtonStyle(false);

        const outline = this.calcOutline();

        return (
            <div
                ref={elementRef}
                style={{
                    display: "inline-flex",
                    flexDirection: "column",
                    alignItems: "center",
                    ...threeDStyle,
                    // override the threeDStyle width and height
                    width: "100%",
                    height: "100%",
                    outline: outline,
                    boxSizing: "border-box",
                }}
                // do not use onMouseOver, which also applies to the children elements
                onMouseEnter={(event: React.MouseEvent) => this.hanldeMouseEnterWriteWidget(event, elementRef)}
                // do not use onMouseOut
                onMouseLeave={(event: React.MouseEvent) => {
                    this.handleMouseLeaveWriteWidget(event, elementRef);
                    if (elementRef.current !== null) {
                        elementRef.current.style["outline"] = outline;
                    }
                }}
            >
                < this._ElementActionButtonText ></this._ElementActionButtonText>
                <this._ElementActionButtonMulti></this._ElementActionButtonMulti>
            </div>
        );
    };
    /** 
     * label text, 
     * 
     * (possible) dropdown arrow, and 
     * 
     * mousedown event handler for single action 
     */
    _ElementActionButtonText = () => {
        const allText = this.getAllText();
        const appearance = allText["appearance"];
        const numActions = this.getActions().length;
        const dropDownArrowDisplay = appearance === "contemporary" && numActions > 1 ? "inline-flex" : "none";
        const justifyContent = allText["horizontalAlign"];
        const alignItems = allText["verticalAlign"];

        // expand macros
        const rawText = this.getAllText()["text"];
        const macros = this.getAllMacros();
        // "\\n" is "\n"
        const buttonText = BaseWidget.expandChannelName(rawText, macros, true).replaceAll("\\n", "\n");

        return (
            <div
                style={{
                    outlineStyle: "none",
                    outlineWidth: 0,
                    outlineColor: "rgba(0,0,0,0)",
                    display: "inline-flex",
                    width: "100%",
                    height: "100%",
                    justifyContent: justifyContent,
                    alignItems: alignItems,
                    backgroundColor: "rgba(0,0,0,0)",
                }}
                onMouseDown={(event: React.MouseEvent) => {
                    if (numActions !== 1) {
                        return;
                    }
                    this.handleMouseDownOnSingleButton(event);
                }}
            >
                {/* text */}
                {buttonText}
                {/* dropdown arrow */}
                <img src="../../../webpack/resources/webpages/arrowDown-thin.svg"
                    style={{
                        width: this.getAllStyle()["fontSize"] * 0.7,
                        height: this.getAllStyle()["fontSize"] * 0.7,
                        marginLeft: 5,
                        display: dropDownArrowDisplay,
                    }}
                ></img>
            </div>

        )
    }

    _ElementActionButtonMulti = () => {
        const selectRef = React.useRef<HTMLSelectElement>(null);
        const [dropDownActivated, setDropDownActivated] = React.useState(false);
        this.setDropDownActivated = setDropDownActivated;
        const numActions = this.getActions().length;

        if (numActions <= 1) {
            return null;
        }

        if (dropDownActivated === false) {
            return null;
        }

        return (
            <select
                ref={selectRef}
                defaultValue={"-1"}
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    outline: "none",
                    border: "none",
                    width: "100%",
                    height: "100%",
                    backgroundColor: "rgba(0,0,0,0)",
                    MozAppearance: "none",
                    WebkitAppearance: "none",
                    overflow: "hidden",
                }}
                onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                    this.handleChangeOnSelect(event);
                    // go back to empty option (value = -1) after executing the option
                    if (selectRef.current !== null) {
                        selectRef.current.value = "-1";
                    }
                }}
            >

                {/* empty option */}
                <option
                    disabled
                    value={`-1`}
                ></option>

                {/* actions */}
                {(
                    Array.isArray(this.getActions())
                        ? (this.getActions() as unknown as (
                            | type_action_executecommand_tdl
                            | type_action_opendisplay_tdl
                            | type_action_openwebpage_tdl
                            | type_action_writepv_tdl
                            | type_action_executescript_tdl
                            | type_action_closedisplaywindow
                        )[])
                        : []
                ).map(
                    (
                        action,
                        index: number
                    ) => {
                        return (
                            <option
                                key={`${action["type"]}-${action["label"]}-${index}`}
                                value={`${index}`}
                            >
                                {action["label"]}
                            </option>
                        );
                    }
                )}
            </select>

        )
    }

    // -------------------- helper functions ----------------

    handleMouseDownOnSingleButton = (event: React.MouseEvent) => {
        event.preventDefault();
        // left button only
        if (g_widgets1.isEditing() || event.button !== 0) {
            return;
        }
        this.executeAction(0);
    }

    handleChangeOnSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {

        if (g_widgets1.isEditing()) {
            return;
        }
        const index = parseInt(event.target.value);
        if (isNaN(index)) {
            return;
        }
        this.executeAction(index);
    }

    executeAction = (index: number) => {

        const tdl = this.getActions()[index];
        if (tdl === undefined) {
            return;
        }

        const type = tdl["type"];
        if (type === "OpenDisplay") {
            this.openDisplay(index);
        } else if (type === "WritePV") {
            this.writePv(index);
        } else if (type === "OpenWebPage") {
            this.openWebpage(index);
        } else if (type === "ExecuteCommand") {
            this.executeCommand(index);
        } else if (type === "CloseDisplayWindow") {
            this.closeDisplayWindow(index);
        } else {
            // do nothing
        }
    }


    openDisplay = (index: number) => {
        const displayConfig = this.getActions()[index] as type_action_opendisplay_tdl;
        let tdlFileName = displayConfig["fileName"];
        // the display must be in "operating" mode to open another display
        const mode = "operating";
        const editable = g_widgets1.getRoot().getEditable();

        // external macros is composed of 2 parts:
        // (1) macros defined by ActionButton widget for this display
        // (2) all macros that is held by this ActionButton widget
        let externalMacros = [...displayConfig["externalMacros"]]
        if (displayConfig["useParentMacros"]) {
            const parentMacros = this.getAllMacros();
            externalMacros = [...externalMacros, ...parentMacros];
        }

        // tdl file name may contain macros
        tdlFileName = BaseWidget.expandChannelName(tdlFileName, externalMacros)

        const ipcManager = g_widgets1.getRoot().getDisplayWindowClient().getIpcManager();

        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
        const currentTdlFileName = displayWindowClient.getTdlFileName();
        const currentTdlFolder = path.dirname(currentTdlFileName);
        const openInSameWindow = displayConfig["openInSameWindow"];

        if (openInSameWindow === true) {
            const displayWindowId = displayWindowClient.getWindowId();
            ipcManager.sendFromRendererProcess(
                "load-tdl-file", {
                displayWindowId: displayWindowId,
                tdlFileName: tdlFileName,
                mode: mode,
                editable: editable,
                externalMacros: externalMacros,
                replaceMacros: true,
                currentTdlFolder: currentTdlFolder
            }
            );
        } else {
            if (g_widgets1.getRoot().getDisplayWindowClient().getMainProcessMode() === "desktop" || g_widgets1.getRoot().getDisplayWindowClient().getMainProcessMode() === "ssh-client") {
                ipcManager.sendFromRendererProcess("open-tdl-file", {
                    options: {
                        tdlFileNames: [tdlFileName],
                        mode: mode,
                        editable: editable,
                        macros: externalMacros,
                        replaceMacros: true, // not used
                        currentTdlFolder: currentTdlFolder,
                        windowId: g_widgets1.getRoot().getDisplayWindowClient().getWindowId(),
                    }
                });
            } else {
                // web mode
                displayWindowClient.openTdlFileInWebMode(tdlFileName);
            }
        }
    };

    writePv = async (index: number) => {
        const tdl = this.getActions()[index] as type_action_writepv_tdl;
        const channelName = tdl["channelName"];
        const channelValue = tdl["channelValue"];
        this.putChannelValue(channelName, channelValue, this.getActions()[index]);
    };

    openWebpage = (index: number) => {
        const tdl = this.getActions()[index] as type_action_openwebpage_tdl;
        const url = tdl["url"];
        const ipcManager = g_widgets1.getRoot().getDisplayWindowClient().getIpcManager();
        ipcManager.sendFromRendererProcess("open-webpage", { url: url });
    };

    executeCommand = (index: number) => {
        const text = this.getActions()[index] as type_action_executecommand_tdl;
        const command = text["command"];
        if (command === undefined || command === null || command.trim() === "") {
            Log.error("Cannot execute command", command);
            return;
        }
        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
        const ipcManager = displayWindowClient.getIpcManager();
        const displayWindowId = displayWindowClient.getWindowId();



        // intercepted by confirm write
        if (text["confirmOnWrite"] === true) {
            const ipcManager = g_widgets1.getRoot().getDisplayWindowClient().getIpcManager();
            const humanReadableMessage1 = "You are about to execute command " + command;
            // requires password
            if (text["confirmOnWriteUsePassword"] === true) {
                const humanReadableMessage2 = "A password is required."
                const password = text["confirmOnWritePassword"];
                ipcManager.handleDialogShowInputBox(undefined,
                    {
                        info: {
                            command: "write-pv-confirmation-with-password",
                            humanReadableMessages: [humanReadableMessage1, humanReadableMessage2],
                            buttons: [
                                {
                                    text: "OK",
                                    handleClick: (dialogInputText?: string) => {
                                        if (dialogInputText !== password) {
                                            // password does not match
                                            ipcManager.handleDialogShowMessageBox(undefined,
                                                {
                                                    info: {
                                                        command: "write-pv-confirmation-wit-password-failed",
                                                        humanReadableMessages: ["Wrong password."],
                                                        buttons: [
                                                            {
                                                                text: "OK",
                                                                handleClick: () => {
                                                                },
                                                            },
                                                        ],
                                                        messageType: "error",
                                                        rawMessages: [],
                                                        attachment: undefined,
                                                    }
                                                }
                                            )

                                            return;
                                        }
                                        // password is correct, execute the command
                                        ipcManager.sendFromRendererProcess("execute-command", {
                                            displayWindowId: displayWindowId,
                                            command: command,
                                        })
                                    },
                                }
                            ],
                            defaultInputText: "",
                            attachment: undefined,
                        }
                    }
                )
            } else {
                // password not required, but need confirm
                const humanReadableMessage2 = "Are you sure to continue?"
                ipcManager.handleDialogShowMessageBox(undefined,
                    {
                        info: {
                            command: "write-pv-confirmation-without-password",
                            humanReadableMessages: [humanReadableMessage1, humanReadableMessage2],
                            buttons: [
                                {
                                    text: "Yes",
                                    handleClick: () => {

                                        ipcManager.sendFromRendererProcess("execute-command", {
                                            displayWindowId: displayWindowId,
                                            command: command,
                                        })
                                    },
                                },
                                {
                                    text: "No",
                                    handleClick: () => {
                                    },
                                }
                            ],
                            messageType: "info",
                            rawMessages: [],
                            attachment: undefined,
                        }
                    }
                )

            }
            return;
        }






        ipcManager.sendFromRendererProcess("execute-command", {
            displayWindowId: displayWindowId,
            command: command,
        })
    };

    closeDisplayWindow = (index: number) => {
        const tdl = this.getActions()[index] as type_action_closedisplaywindow;
        let quitTDM = tdl["quitTDM"];
        if (typeof quitTDM !== "boolean") {
            quitTDM = false;
        }

        if (quitTDM === true) {
            const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
            const ipcManager = displayWindowClient.getIpcManager();
            ipcManager.sendFromRendererProcess("quit-tdm-process", {});
        } else {
            const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
            const ipcManager = displayWindowClient.getIpcManager();
            const displayWindowId = displayWindowClient.getWindowId();
            ipcManager.sendFromRendererProcess("close-window", { displayWindowId: displayWindowId });
        }
    };


    handleSelectAFile = (options: Record<string, any>, fileName: string) => {
        const itemIndex = options["itemIndex"];
        const sidebar = this.getSidebar();
        if (typeof itemIndex === "number" && sidebar !== undefined) {
            (sidebar as ActionButtonSidebar).setBeingUpdatedItemIndex(itemIndex);
            sidebar.updateFromWidget(undefined, "select-a-file", fileName);
        }
    };

    calcOutline = () => {
        const allText = this.getAllText();
        const appearance = allText["appearance"];
        if (appearance === "traditional") {
            return "solid 1px rgba(100, 100, 100, 0.5)";
        } else {
            return "none";
        }
    }

    // -------------------------- tdl -------------------------------

    static generateDefaultTdl = (): type_ActionButton_tdl => {
        const widgetKey = GlobalMethods.generateWidgetKey(defaultActionButtonTdl.type);
        return structuredClone({
            ...defaultActionButtonTdl,
            widgetKey: widgetKey,
        });
    };

    generateDefaultTdl: () => any = ActionButton.generateDefaultTdl;

    getTdlCopy(newKey: boolean = true) {
        const result = super.getTdlCopy(newKey);
        result["actions"] = structuredClone(this.getActions());
        return result;
    }

    // --------------------- getters -------------------------

    getActions = () => {
        return this._actions;
    };

    // -------------------------- sidebar ---------------------------
    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new ActionButtonSidebar(this);
        }
    };

    jobsAsOperatingModeBegins() {
        super.jobsAsOperatingModeBegins();
        // for newly created widget, the dropdown can only be activated here
        setTimeout(() => {
            this.setDropDownActivated((oldValue: boolean) => {
                return true;
            })
        }, 50 + Math.random() * 150)
    }

}
