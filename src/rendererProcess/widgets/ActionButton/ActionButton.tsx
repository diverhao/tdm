import * as GlobalMethods from "../../../common/GlobalMethods";
import { GlobalVariables } from "../../../common/GlobalVariables";
import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { ActionButtonSidebar } from "./ActionButtonSidebar";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { ActionButtonRules } from "./ActionButtonRules";
import path from "path";
import { Canvas } from "../../helperWidgets/Canvas/Canvas";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { Log } from "../../../common/Log";

export type type_action_opendisplay_tdl = {
    type: "OpenDisplay";
    label: string;
    fileName: string;
    // user-provided external macros, the child display must take it
    externalMacros: [string, string][];
    // if the child macros should take the parent's macros
    useParentMacros: boolean;
    // if open the display in same window
    openInSameWindow: boolean;
};

export type type_action_writepv_tdl = {
    type: "WritePV";
    label: string;
    channelName: string;
    channelValue: string;
    confirmOnWrite: boolean;
    confirmOnWriteUsePassword: boolean;
    confirmOnWritePassword: string,
};

export type type_action_executescript_tdl = {
    type: "ExecuteScript";
    label: string;
    fileName: string;
};

export type type_action_executecommand_tdl = {
    type: "ExecuteCommand";
    label: string;
    command: string;
    confirmOnWrite: boolean;
    confirmOnWriteUsePassword: boolean;
    confirmOnWritePassword: string,
};

export type type_action_openwebpage_tdl = {
    type: "OpenWebPage";
    label: string;
    url: string;
};

export type type_action_closedisplaywindow = {
    type: "CloseDisplayWindow";
    label: string;
    quitTDM: boolean;
};

export type type_actions_tdl = (
    | type_action_opendisplay_tdl
    | type_action_writepv_tdl
    | type_action_executecommand_tdl
    | type_action_executescript_tdl
    | type_action_openwebpage_tdl
    | type_action_closedisplaywindow
)[];

export type type_ActionButton_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
    actions: type_actions_tdl;
};

export class ActionButton extends BaseWidget {

    _rules: ActionButtonRules;

    // the <select /> component costs huge amount of resources during rendering
    // each such component takes about 2 ms to render, which is one order of magnitude 
    // more than a regular component. That means if a display has 500 such components,
    // it may cost 1 second to render them, which is unacceptable.
    // In here we delay the render of <select /> components until all widgets are rendered
    setDropDownActivated: (value: any) => void = (value: any) => { };

    _actions: type_actions_tdl;
    constructor(widgetTdl: type_ActionButton_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this.setReadWriteType("write");

        this._rules = new ActionButtonRules(this, widgetTdl);

        this._actions = JSON.parse(JSON.stringify(widgetTdl.actions));
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

        return (
            <ErrorBoundary style={{ ...this.getStyle(), backgroundColor: "rgba(0,0,0,0)" }} widgetKey={this.getWidgetKey()}>
                <>
                    <this._ElementBody></this._ElementBody>
                    {this.showSidebar() ? this._sidebar?.getElement() : null}
                </>
            </ErrorBoundary>
        );
    };

    // Text area and resizers
    _ElementBodyRaw = (): React.JSX.Element => {
        return (
            // always update the div below no matter the TextUpdateBody is .memo or not
            // TextUpdateResizer does not update if it is .memo
            <div style={{ ...this.getElementBodyRawStyle(), borderRadius: this.getAllText()["appearance"] === "traditional" ? 0 : 3, overflow: "visible" }}>
                <this._ElementArea></this._ElementArea>
                {this.showResizers() ? <this._ElementResizer /> : null}
            </div>
        );
    };

    // only shows the text, all other style properties are held by upper level _ElementBodyRaw
    _ElementAreaRaw = ({ }: any): React.JSX.Element => {
        return (
            // <div
            <div
                style={{
                    display: "inline-flex",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    userSelect: "none",
                    overflow: "visible",
                    whiteSpace: this.getAllText().wrapWord ? "normal" : "pre",
                    justifyContent: this.getAllText().horizontalAlign,
                    alignItems: this.getAllText().verticalAlign,
                    fontFamily: this.getAllStyle().fontFamily,
                    fontSize: this.getAllStyle().fontSize,
                    fontStyle: this.getAllStyle().fontStyle,
                    fontWeight: this.getAllStyle().fontWeight,
                    outline: this._getElementAreaRawOutlineStyle(),
                    color: this._getElementAreaRawTextStyle(),
                    borderRadius: this.getAllText()["appearance"] === "traditional" ? 0 : 3,
                    backgroundColor: this.getAllText()["invisibleInOperation"] ? "rgba(0,0,0,0)" : this._getElementAreaRawBackgroundStyle(),
                }}
                // title={"tooltip"}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                <this._ElementActionButton></this._ElementActionButton>
            </div>
        );
    };

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
        const elementRef = React.useRef<any>(null);
        const selectRef = React.useRef<any>(null);
        const [dropDownActivated, setDropDownActivated] = React.useState(false);
        this.setDropDownActivated = setDropDownActivated;

        const shadowWidth = 2;
        const calcWidth = () => {
            const width = this.getAllStyle()["width"];
            if (this.getAllText()["appearance"] === "traditional") {
                return width - 2 * shadowWidth;
            } else {
                return width;
            }
        }
        const calcHeight = () => {
            const height = this.getAllStyle()["height"];
            if (this.getAllText()["appearance"] === "traditional") {
                return height - 2 * shadowWidth;
            } else {
                return height;
            }
        }

        const highlightColor = (this.getAllText()["invisibleInOperation"] === true && g_widgets1.isEditing() === false) ? "rgba(0,0,0,0)" : "rgba(255,255,255,1)";
        const shadowColor = (this.getAllText()["invisibleInOperation"] === true && g_widgets1.isEditing() === false) ? "rgba(0,0,0,0)" : "rgba(100,100,100,1)";

        const calcBorderBottomRight = () => {
            if (this.getAllText()["appearance"] === "traditional") {
                return `solid ${shadowWidth}px ${shadowColor}`;
            } else {
                return "none";
            }
        }

        const calcBorderTopLeft = () => {
            if (this.getAllText()["appearance"] === "traditional") {
                return `solid ${shadowWidth}px ${highlightColor}`;
            } else {
                return "none";
            }
        }

        const calcOutline = () => {
            if (this.getAllText()["appearance"] === "traditional") {
                return "solid 1px rgba(100, 100, 100, 0.5)";
            } else {
                return "none";
            }
        }

        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "inline-flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    justifyContent: "center",
                    // position: "relative",
                    // overflow: "visible",
                    // textOverflow: "hidden",
                }}
            >
                {/* <this._StyledSelectionBox> */}
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        backgroundColor: `rgba(0, 0, 0, 0)`,
                        // overflow: `visible`,
                    }}
                >
                    <div
                        ref={elementRef}
                        style={{
                            width: "100%",
                            height: "100%",
                            display: "inline-flex",
                            textIndent: this.getActions().length > 1 ? "4px" : "0px",
                            justifyContent: this.getActions().length > 1 ? "flex-start" : "center",
                            alignItems: "center",
                            backgroundColor: `rgba(0, 0, 0, 0)`,
                            outline: "none",
                            border: "none",
                            // overflow: "visible",
                            // textOverflow: "hidden",

                            // outline: calcOutline(),
                            // borderRight: calcBorderBottomRight(),
                            // borderBottom: calcBorderBottomRight(),
                            // borderLeft: calcBorderTopLeft(),
                            // borderTop: calcBorderTopLeft(),

                        }}
                        // outline is not affected by opacity of the ElementBody
                        onMouseEnter={(event: any) => {
                            if (!g_widgets1.isEditing()) {
                                if (elementRef.current !== null) {
                                    console.log("okokok")
                                    elementRef.current.style["outlineStyle"] = "solid";
                                    elementRef.current.style["outlineWidth"] = "3px";
                                    elementRef.current.style["outlineColor"] = "rgba(105,105,105,1)";
                                    elementRef.current.style["cursor"] = "pointer";
                                }
                            }
                        }}
                        onMouseLeave={(event: any) => {
                            if (!g_widgets1.isEditing()) {
                                if (elementRef.current !== null) {
                                    elementRef.current.style["outlineStyle"] = this.getAllStyle()["outlineStyle"];
                                    elementRef.current.style["outlineWidth"] = this.getAllStyle()["outlineWidth"];
                                    elementRef.current.style["outlineColor"] = this.getAllStyle()["outlineColor"];
                                    elementRef.current.style["cursor"] = "default";
                                }
                            }
                        }}
                    >
                        {this.getActions().length > 1 ? (
                            <>
                                {/* label */}
                                <div
                                    style={{
                                        opacity: this.getAllText()["invisibleInOperation"] === true && g_widgets1.isEditing() === false ? 0 : 1,
                                        outlineStyle: "none",
                                        outlineWidth: 0,
                                        outlineColor: "rgba(0,0,0,0)",
                                        display: "inline-flex",
                                        width: "100%",
                                        height: "100%",
                                        justifyContent: this.getAllText()["horizontalAlign"],
                                        alignItems: "center",
                                        fontSize: this.getAllStyle()["fontSize"],
                                        fontFamily: this.getAllStyle()["fontFamily"],
                                        fontWeight: this.getAllStyle()["fontWeight"],
                                        fontStyle: this.getAllStyle()["fontStyle"],
                                        backgroundColor: "rgba(0,0,0,0)",
                                    }}
                                >
                                    {this.getButtonText()}
                                    {this.getText()["appearance"] === "contemporary" ?
                                        <>
                                            &nbsp;
                                            <img src="../../../webpack/resources/webpages/arrowDown-thin.svg"
                                                style={{
                                                    width: this.getAllStyle()["fontSize"] * 0.7,
                                                    height: this.getAllStyle()["fontSize"] * 0.7,
                                                }}
                                            ></img>
                                        </>
                                        :
                                        null
                                    }
                                </div>
                                {dropDownActivated === true ?
                                    <select
                                        ref={selectRef}
                                        style={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            outline: calcOutline(),
                                            borderRight: calcBorderBottomRight(),
                                            borderBottom: calcBorderBottomRight(),
                                            borderLeft: calcBorderTopLeft(),
                                            borderTop: calcBorderTopLeft(),
                                            // the <select /> is different from <div />
                                            // its "width" and "height" is the sum of border and body
                                            // while the "width" and "height" in <div /> is the body's dimensions, its border is not counted in "width" or "height"
                                            width: "100%",
                                            height: "100%",
                                            backgroundColor: "rgba(0,0,0,0)",
                                            // outline: "none",
                                            // borderRadius: this.getAllText()["appearance"] === "traditional" ? 0 : 10,
                                            // do not show dropdown arrow
                                            MozAppearance: "none",
                                            WebkitAppearance: "none",
                                            opacity: this.getAllText()["invisibleInOperation"] === true && g_widgets1.isEditing() === false ? 0 : 1,
                                            overflow: "hidden",
                                            textAlignLast:
                                                this.getAllText()["horizontalAlign"] === "flex-start"
                                                    ? "left"
                                                    : this.getAllText()["horizontalAlign"] === "flex-end"
                                                        ? "right"
                                                        : "center",
                                        }}
                                        onChange={(event: any) => {
                                            // setShowDropDown(false);
                                            if (g_widgets1.isEditing()) {
                                                return;
                                            }
                                            const index = parseInt(event.target.value);
                                            if (index === -1) {
                                                return;
                                            }
                                            const tdl = this.getActions()[index];
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
                                                //todo: ExecuteScript
                                            }
                                            if (selectRef.current !== null) {
                                                selectRef.current.value = "-1";
                                            }
                                        }}
                                        defaultValue={"-1"}
                                    >
                                        <option
                                            style={{
                                                // width: "100%",
                                                width: calcWidth(),
                                                height: calcHeight(),
                                            }}
                                            // it hides the option, causing the <select> to choose the next option, does not help
                                            // hidden
                                            disabled
                                            value={`-1`}
                                        ></option>
                                        {this.getActions().map(
                                            (
                                                action:
                                                    | type_action_executecommand_tdl
                                                    | type_action_opendisplay_tdl
                                                    | type_action_openwebpage_tdl
                                                    | type_action_writepv_tdl
                                                    | type_action_executescript_tdl
                                                    | type_action_closedisplaywindow,
                                                index: number
                                            ) => {
                                                return (
                                                    <option
                                                        style={{
                                                            width: calcWidth(),
                                                            height: calcHeight(),
                                                            // width: "100%",
                                                        }}
                                                        key={`${action["type"]}-${action["label"]}-${index}`}
                                                        value={`${index}`}
                                                    >
                                                        {action["label"]}&nbsp;
                                                    </option>
                                                );
                                            }
                                        )}
                                    </select>
                                    :
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            opacity: this.getAllText()["invisibleInOperation"] === true && g_widgets1.isEditing() === false ? 0 : 1,
                                            outline: calcOutline(),
                                            borderRight: calcBorderBottomRight(),
                                            borderBottom: calcBorderBottomRight(),
                                            borderLeft: calcBorderTopLeft(),
                                            borderTop: calcBorderTopLeft(),
                                            display: "inline-flex",
                                            width: calcWidth(),
                                            height: calcHeight(),
                                            justifyContent: this.getAllText()["horizontalAlign"],
                                            alignItems: this.getAllText()["verticalAlign"],
                                            overflow: "hidden",
                                        }}>
                                    </div>
                                }
                            </>
                        ) : (
                            <div
                                style={{
                                    opacity: this.getAllText()["invisibleInOperation"] === true && g_widgets1.isEditing() === false ? 0 : 1,
                                    // outlineStyle: "none",
                                    // outlineWidth: 0,
                                    // outlineColor: "rgba(255,0,0,1)",
                                    // outline: this.getAllText()["appearance"] === "traditional" ? "solid 1px rgba(100, 100, 100, 0.5)" : "none",
                                    outline: calcOutline(),
                                    borderRight: calcBorderBottomRight(),
                                    borderBottom: calcBorderBottomRight(),
                                    borderLeft: calcBorderTopLeft(),
                                    borderTop: calcBorderTopLeft(),
                                    display: "inline-flex",
                                    // width: "100%",
                                    // height: "100%",
                                    width: calcWidth(),
                                    height: calcHeight(),
                                    justifyContent: this.getAllText()["horizontalAlign"],
                                    alignItems: this.getAllText()["verticalAlign"],
                                    overflow: "hidden",
                                }}
                                onMouseDown={(event: React.MouseEvent) => {
                                    event.preventDefault();
                                    // left button only
                                    if (g_widgets1.isEditing() || event.button !== 0) {
                                        return;
                                    }
                                    if (this.getActions().length === 0) {
                                        return;
                                    }
                                    const index = 0;
                                    const tdl = this.getActions()[index];
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
                                        //todo: ExecuteScript
                                    }
                                }}
                            >
                                {this.getButtonText()}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    getButtonText = () => {
        const rawText = this.getAllText()["text"];
        const macros = this.getAllMacros();
        // "\\n" is "\n"
        const result = BaseWidget.expandChannelName(rawText, macros, true).replaceAll("\\n", "\n");
        return result;
    }

    handleSelectAFile = (options: Record<string, any>, fileName: string) => {
        const itemIndex = options["itemIndex"];
        const sidebar = this.getSidebar();
        if (typeof itemIndex === "number" && sidebar !== undefined) {
            (sidebar as ActionButtonSidebar).setBeingUpdatedItemIndex(itemIndex);
            sidebar.updateFromWidget(undefined, "select-a-file", fileName);
        }
    };

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
                        // openInSameWindow: openInSameWindow,
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

        try {
            // we need this line
            const channel = g_widgets1.getTcaChannel(channelName);
            const displayWindowId = g_widgets1.getRoot().getDisplayWindowClient().getWindowId();
            // channel.put(displayWindowId, { value: channelValue }, 1);
            this.putChannelValue(channelName, channelValue, this.getActions()[index]);
        } catch (e) {
            const channel = g_widgets1.createTcaChannel(channelName, this.getWidgetKey());
            if (channel !== undefined) {
                const displayWindowId = g_widgets1.getRoot().getDisplayWindowClient().getWindowId();
                await channel.getMeta(this.getWidgetKey(), 1);
                // channel.put(displayWindowId, { value: channelValue }, 1);
                this.putChannelValue(channelName, channelValue, this.getActions()[index]);
                // no need to manually destroy the channel, the client will check on it
                // channel.destroy(this.getWidgetKey());
            }
        }
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

    _Element = React.memo(this._ElementRaw, () => this._useMemoedElement());
    _ElementArea = React.memo(this._ElementAreaRaw, () => this._useMemoedElement());
    _ElementBody = React.memo(this._ElementBodyRaw, () => this._useMemoedElement());

    // defined in super class
    // getElement()
    // getSidebarElement()
    // _ElementResizerRaw
    // _ElementResizer

    // -------------------- helper functions ----------------

    // defined in super class
    // showSidebar()
    // showResizers()
    // _useMemoedElement()
    // hasChannel()
    // isInGroup()
    // isSelected()
    // _getElementAreaRawOutlineStyle()

    _getChannelValue = () => {
        const value = this._getFirstChannelValue();
        if (value === undefined) {
            return "";
        } else {
            return value;
        }
    };

    _getChannelSeverity = () => {
        return this._getFirstChannelSeverity();
    };

    _getChannelUnit = () => {
        const unit = this._getFirstChannelUnit();
        if (unit === undefined) {
            return "";
        } else {
            return unit;
        }
    };

    // ----------------------- styles -----------------------

    // defined in super class
    // _resizerStyle
    // _resizerStyles
    // StyledToolTipText
    // StyledToolTip

    // -------------------------- tdl -------------------------------

    static generateDefaultTdl = (): Record<string, any> => {
        const defaultTdl: type_ActionButton_tdl = {
            type: "ActionButton",
            widgetKey: "", // "key" is a reserved keyword
            key: "",
            style: {
                // basics
                position: "absolute",
                display: "inline-flex",
                // dimensions
                left: 100,
                top: 100,
                width: 100,
                height: 100,
                backgroundColor: "rgba(210, 210, 210, 1)",
                // border, not related to the below alarmBorder
                borderStyle: "solid",
                borderWidth: 0,
                borderColor: "rgba(0, 0, 0, 1)",
                // font
                color: "rgba(0,0,0,1)",
                fontFamily: GlobalVariables.defaultFontFamily,
                fontSize: GlobalVariables.defaultFontSize,
                fontStyle: GlobalVariables.defaultFontStyle,
                fontWeight: GlobalVariables.defaultFontWeight,
                // angle
                transform: "rotate(0deg)",
                // shows when the widget is selected
                outlineStyle: "none",
                outlineWidth: 1,
                outlineColor: "black",
            },
            text: {
                wrapWord: false,
                horizontalAlign: "center",
                verticalAlign: "center",
                // actually alarmOutline
                alarmBorder: true,
                text: "Action Button",
                // becomes not visible in operation mode, but still clickable
                invisibleInOperation: false,
                // "contemporary" | "traditional"
                appearance: "traditional",
                alarmText: false,
                alarmBackground: false,
                alarmLevel: "MINOR",
            },
            channelNames: [],
            groupNames: [],
            rules: [],
            actions: [],
        };
        defaultTdl["widgetKey"] = GlobalMethods.generateWidgetKey(defaultTdl["type"]);
        return JSON.parse(JSON.stringify(defaultTdl));
    };

    generateDefaultTdl = ActionButton.generateDefaultTdl;

    // defined in super class
    // getTdlCopy()
    getTdlCopy(newKey: boolean = true) {
        const result = super.getTdlCopy(newKey);
        result["actions"] = JSON.parse(JSON.stringify(this.getActions()));
        return result;
    }

    // --------------------- getters -------------------------

    // defined in super class
    // getType()
    // getWidgetKey()
    // getStyle()
    // getText()
    // getSidebar()
    // getGroupName()
    // getGroupNames()
    // getUpdateFromWidget()
    // getResizerStyle()
    // getResizerStyles()
    // getRules()

    getActions = () => {
        return this._actions;
    };

    // ---------------------- setters -------------------------

    // ---------------------- channels ------------------------

    // defined in super class
    // getChannelNames()
    // expandChannelNames()
    // getExpandedChannelNames()
    // setExpandedChannelNames()
    // expandChannelNameMacro()

    // ------------------------ z direction --------------------------

    // defined in super class
    // moveInZ()
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
