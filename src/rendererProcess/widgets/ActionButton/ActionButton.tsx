import { GlobalVariables } from "../../global/GlobalVariables";
import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { ActionButtonSidebar } from "./ActionButtonSidebar";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { ActionButtonRules } from "./ActionButtonRules";
import path from "path";
import { Canvas } from "../../helperWidgets/Canvas/Canvas";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { Log } from "../../global/Log";

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
};

export type type_action_openwebpage_tdl = {
    type: "OpenWebPage";
    label: string;
    url: string;
};

export type type_actions_tdl = (
    | type_action_opendisplay_tdl
    | type_action_writepv_tdl
    | type_action_executecommand_tdl
    | type_action_executescript_tdl
    | type_action_openwebpage_tdl
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
    // level-1 properties in tdl file
    // _type: string;
    // _widgetKey: string;
    // _style: Record<string, any>;
    // _text: Record<string, any>;
    // _channelNames: string[];
    // _groupNames: string[] = undefined;

    // sidebar
    // private _sidebar: TextUpdateSidebar;

    // tmp methods
    // private _tmp_mouseMoveOnResizerListener: any = undefined;
    // private _tmp_mouseUpOnResizerListener: any = undefined;

    // widget-specific channels, these channels are only used by this widget
    // private _tcaChannels: TcaChannel[];

    // used for the situation of shift key pressed + mouse down on a selected widget,
    // so that when the mouse is up, the widget is de-selected
    // its value is changed in 3 places: this.select2(), this._handleMouseMove() and this._handleMouseUp()
    // private _readyToDeselect: boolean = false;

    _rules: ActionButtonRules;

    _actions: type_actions_tdl;
    constructor(widgetTdl: type_ActionButton_tdl) {
        super(widgetTdl);

        this.setStyle({ ...ActionButton._defaultTdl.style, ...widgetTdl.style });
        this.setText({ ...ActionButton._defaultTdl.text, ...widgetTdl.text });

        this._rules = new ActionButtonRules(this, widgetTdl);
        this._actions = JSON.parse(JSON.stringify(widgetTdl.actions));
        // this._sidebar = new ActionButtonSidebar(this);
    }

    // ------------------------- event ---------------------------------

    // defined in widget, invoked in sidebar
    // (1) determine which tdl property should be updated
    // (2) calculate new value
    // (3) assign new value
    // (4) add this widget as well as "GroupSelection2" to g_widgets1.forceUpdateWidgets
    // (5) flush
    updateFromSidebar = (event: any, propertyName: string, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        // todo: remove this method
    };

    // defined in super class
    // _handleMouseDown()
    // _handleMouseMove()
    // _handleMouseUp()
    // _handleMouseDownOnResizer()
    // _handleMouseMoveOnResizer()
    // _handleMouseUpOnResizer()
    // _handleMouseDoubleClick()

    // ----------------------------- geometric operations ----------------------------

    // defined in super class
    // simpleSelect()
    // selectGroup()
    // select()
    // simpleDeSelect()
    // deselectGroup()
    // deSelect()
    // move()
    // resize()

    // ------------------------------ group ------------------------------------

    // defined in super class
    // addToGroup()
    // removeFromGroup()

    // ------------------------------ elements ---------------------------------

    // element = <> body (area + resizer) + sidebar </>

    // Body + sidebar
    _ElementRaw = () => {
        this.setRulesStyle({});
        this.setRulesText({});
        const rulesValues = this.getRules()?.getValues();
        if (rulesValues !== undefined) {
            this.setRulesStyle(rulesValues["style"]);
            this.setRulesText(rulesValues["text"]);
        }

        // must do it for every widget
        g_widgets1.removeFromForceUpdateWidgets(this.getWidgetKey());
        this.renderChildWidgets = true;
        React.useEffect(() => {
            this.renderChildWidgets = false;
        });

        return (
            <ErrorBoundary style={this.getStyle()} widgetKey={this.getWidgetKey()}>
                <>
                    <this._ElementBody></this._ElementBody>
                    {this._showSidebar() ? this._sidebar?.getElement() : null}
                </>
            </ErrorBoundary>
        );
    };

    // Text area and resizers
    _ElementBodyRaw = (): JSX.Element => {
        return (
            // always update the div below no matter the TextUpdateBody is .memo or not
            // TextUpdateResizer does not update if it is .memo
            <div style={{ ...this.getElementBodyRawStyle(), borderRadius: this.getAllText()["appearance"] === "traditional" ? 0 : 2 }}>
                <this._ElementArea></this._ElementArea>
                {this._showResizers() ? <this._ElementResizer /> : null}
            </div>
        );
    };

    // only shows the text, all other style properties are held by upper level _ElementBodyRaw
    _ElementAreaRaw = ({ }: any): JSX.Element => {
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
                    overflow: "visible",
                    textOverflow: "hidden",
                }}
            >
                {/* <this._StyledSelectionBox> */}
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        backgroundColor: `rgba(0, 0, 0, 0)`,
                        overflow: `visible`,
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
                            overflow: "visible",
                            textOverflow: "hidden",
                        }}
                        // outline is not affected by opacity of the ElementBody
                        onMouseEnter={(event: any) => {
                            if (!g_widgets1.isEditing()) {
                                if (elementRef.current !== null) {
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
                                    {this.getAllText()["text"]}
                                </div>
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
                                        borderRadius: this.getAllText()["appearance"] === "traditional" ? 0 : 3,
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
                                                | type_action_executescript_tdl,
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
                                    alignItems: "center",
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
                                    } else {
                                        //todo: ExecuteScript
                                    }
                                }}
                            >
                                {this.getAllText()["text"]}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    handleSelectAFile = (options: Record<string, any>, fileName: string) => {
        const itemIndex = options["itemIndex"];
        const sidebar = this.getSidebar();
        if (typeof itemIndex === "number" && sidebar !== undefined) {
            (sidebar as ActionButtonSidebar).setBeingUpdatedItemIndex(itemIndex);
            sidebar.updateFromWidget(undefined, "select-a-file", fileName);
        }
    };

    /**
     * An external macro may be "S=${S1}", where "S1" is this display window's macro <br>
     * 
     * This function is the same as EmbeddedDisplay.expandItemMacros()
     */
    expandExternalMacros = (index: number) => {
        const tdl = this.getActions()[index] as type_action_opendisplay_tdl;
        const expandedExternalMacros: [string, string][] = [];
        const externalMacros = JSON.parse(JSON.stringify(tdl["externalMacros"])); // this is the user provided macros, will be used by the display
        if (externalMacros !== undefined) {
            const canvas = g_widgets1.getWidget2("Canvas");
            if (canvas instanceof Canvas) {
                const thisDisplayMacros = canvas.getAllMacros();
                for (let macro of externalMacros) {
                    expandedExternalMacros.push([macro[0], BaseWidget.expandChannelName(macro[1], thisDisplayMacros)]);
                }
            }
        }
        return expandedExternalMacros;
    }


    openDisplay = (index: number) => {
        const tdl = this.getActions()[index] as type_action_opendisplay_tdl;
        const tdlFileName = tdl["fileName"];
        // the display must be in "operating" mode to open another display
        const mode = "operating";
        const editable = g_widgets1.getRoot().getEditable();

        // macros come from 3 places: tdl itself, user provided, and parent display
        // the tdl["externalMacros"] are provided from the sidebar, they should have higher priority than
        // parent display macros, but they have lower priority than display-defined macros
        // make a copy from tdl["externalMacros"]
        // let externalMacros = JSON.parse(JSON.stringify(tdl["externalMacros"])); // this is the user provided macros, will be used by the display
        let externalMacros = this.expandExternalMacros(index);

        // if the value in tdl["externalMacros"] is in format ${} or $(), we should expand it
        const parentMacros = (g_widgets1.getWidget2("Canvas") as Canvas).getAllMacros(); // this is from the parent display
        // for (let externalMacro of externalMacros) {
        //     const valueRaw = externalMacro[1];
        //     if (valueRaw.trim().match(/^\$((\{[^}]+\})|\([^)]+\))/) !== null) {
        //         const value = valueRaw.trim().replace("$", "").replace("(", "").replace(")", "");
        //         // math this macro's value with its parent macor's name
        //         for (let parentMacro of parentMacros) {
        //             const parentMacroName = parentMacro[0];
        //             const parentMacroValue = parentMacro[1];
        //             if (parentMacroName === value) {
        //                 externalMacro[1] = parentMacroValue;
        //             }
        //         }
        //     }
        // }
        // ! In here, we get all macros of the parent display, including the parent display's own macros, and the macros
        // ! that come from other places
        if (tdl["useParentMacros"]) {
            externalMacros = [...externalMacros, ...parentMacros];
        }

        const replaceMacros = false;
        const ipcManager = g_widgets1.getRoot().getDisplayWindowClient().getIpcManager();

        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
        const currentTdlFileName = displayWindowClient.getTdlFileName();
        const currentTdlFolder = path.dirname(currentTdlFileName);
        const openInSameWindow = tdl["openInSameWindow"];

        if (openInSameWindow === true) {
            const displayWindowId = displayWindowClient.getWindowId();
            ipcManager.sendFromRendererProcess(
                "load-tdl-file", {
                displayWindowId: displayWindowId,
                tdlFileName: tdlFileName,
                mode: mode,
                editable: editable,
                externalMacros: externalMacros,
                replaceMacros: replaceMacros,
                currentTdlFolder: currentTdlFolder
            }
            );
        } else {
            if (g_widgets1.getRoot().getDisplayWindowClient().getMainProcessMode() === "desktop" || g_widgets1.getRoot().getDisplayWindowClient().getMainProcessMode() === "ssh-client") {
                ipcManager.sendFromRendererProcess("open-tdl-file", {
                    tdlFileNames: [tdlFileName],
                    mode: mode,
                    editable: editable,
                    macros: externalMacros,
                    replaceMacros: replaceMacros, // not used
                    currentTdlFolder: currentTdlFolder,
                    openInSameWindow: openInSameWindow,
                    windowId: g_widgets1.getRoot().getDisplayWindowClient().getWindowId(),
                });
            } else {
                // web mode
                const currentSite = `https://${window.location.host}/`;

                g_widgets1.getRoot().getDisplayWindowClient().getIpcManager().sendPostRequestCommand(
                    "open-tdl-file", {
                    tdlFileNames: [tdlFileName],
                    mode: mode,
                    editable: editable,
                    macros: externalMacros,
                    replaceMacros: replaceMacros, // not used
                    currentTdlFolder: currentTdlFolder,
                    openInSameWindow: openInSameWindow,
                    windowId: g_widgets1.getRoot().getDisplayWindowClient().getWindowId(),
                }).then((response: any) => {
                    // decode string
                    return response.json()
                }).then(data => {
                    const ipcServerPort = data["ipcServerPort"];
                    const displayWindowId = data["displayWindowId"];
                    // const href = `${currentSite}DisplayWindow.html?ipcServerPort=${ipcServerPort}&displayWindowId=${displayWindowId}`;
                    const href = `${currentSite}DisplayWindow.html?displayWindowId=${displayWindowId}`;
                    // open in new tab
                    window.open(href)
                    // open in current tab
                    // window.location.href = href;
                })

            }
        }
    };

    writePv = (index: number) => {
        const tdl = this.getActions()[index] as type_action_writepv_tdl;
        const channelName = tdl["channelName"];
        const channelValue = tdl["channelValue"];
        try {
            const channel = g_widgets1.getTcaChannel(channelName);
            const displayWindowId = g_widgets1.getRoot().getDisplayWindowClient().getWindowId();
            channel.put(displayWindowId, { value: channelValue }, 1);
        } catch (e) {
            const channel = g_widgets1.createTcaChannel(channelName, this.getWidgetKey());
            if (channel !== undefined) {
                const displayWindowId = g_widgets1.getRoot().getDisplayWindowClient().getWindowId();
                channel.put(displayWindowId, { value: channelValue }, 1);
                channel.destroy(this.getWidgetKey());
            }
        }
    };

    openWebpage = (index: number) => {
        const tdl = this.getActions()[index] as type_action_openwebpage_tdl;
        const url = tdl["url"];
        const ipcManager = g_widgets1.getRoot().getDisplayWindowClient().getIpcManager();
        ipcManager.sendFromRendererProcess("open-webpage", url);
    };

    executeCommand = (index: number) => {
        const tdl = this.getActions()[index] as type_action_executecommand_tdl;
        const command = tdl["command"];
        if (command === undefined || command === null || command.trim() === "") {
            Log.error("Cannot execute command", command);
            return;
        }
        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
        const ipcManager = displayWindowClient.getIpcManager();
        const displayWindowId = displayWindowClient.getWindowId();
        ipcManager.sendFromRendererProcess("execute-command", {
            displayWindowId: displayWindowId,
            command: command,
        })
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
    // _showSidebar()
    // _showResizers()
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

    // properties when we create a new TextUpdate
    // the level 1 properties all have corresponding public or private variable in the widget

    static _defaultTdl: type_ActionButton_tdl = {
        type: "ActionButton",
        widgetKey: "", // "key" is a reserved keyword
        key: "",
        style: {
            // basics
            position: "absolute",
            display: "inline-block",
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
            horizontalAlign: "left",
            // actually alarmOutline
            alarmBorder: true,
            text: "Action Button",
            // becomes not visible in operation mode, but still clickable
            invisibleInOperation: false,
            // "contemporary" | "traditional"
            appearance: "traditional",
        },
        channelNames: [],
        groupNames: [],
        rules: [],
        actions: [],
    };

    // not getDefaultTdl(), always generate a new key
    static generateDefaultTdl = (type: string): Record<string, any> => {
        const result = super.generateDefaultTdl(type);
        result.style = JSON.parse(JSON.stringify(this._defaultTdl.style));
        result.text = JSON.parse(JSON.stringify(this._defaultTdl.text));
        result.channelNames = JSON.parse(JSON.stringify(this._defaultTdl.channelNames));
        result.groupNames = JSON.parse(JSON.stringify(this._defaultTdl.groupNames));
        result.actions = JSON.parse(JSON.stringify(this._defaultTdl.actions));
        return result;
    };

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
}
