import * as React from "react";
import { DisplayWindowClient } from "./DisplayWindowClient";
import { g_widgets1 } from "../../../rendererProcess/global/GlobalVariables";
import { Log } from "../../../mainProcess/log/Log";
import ReactDOM from 'react-dom/client';


type MenuItem =
    | {
        label: string;
        accelerator?: string;
        role?: string;
        click?: () => void;
        submenu?: MenuItem[];
    }
    | {
        type: string;
        label?: string;
    };

/**
 * The class for invoking the context menu. It is on renderer process. <br>
 * 
 * In desktop mode, it sends the "show-context-menu" command to main process, calling the electron.js based 
 * context menu. This context menu is handled in class ContextMenuDesktop <br>
 * 
 * In web mode, it creates a div element in the renderer process. <br>
 * 
 */
export class ContextMenu {
    private _displayWindowClient: DisplayWindowClient;
    // private _Element: HTMLDivElement | undefined = undefined;
    private _template: MenuItem[] = [];
    private _templates: Record<string, MenuItem[]> = {};
    _widgetKeys: string[] = [];

    constructor(displayWindowClient: DisplayWindowClient) {
        this._displayWindowClient = displayWindowClient;

        this._templates["editing_Canvas"] = this._template_editing_Canvas;
        this._templates["editing_Widget"] = this._template_editing_Widget;
        this._templates["operating_Canvas"] = this._template_operating_Canvas;
        this._templates["operating_Widget"] = this._template_operating_Widget;

        // this._Element = document.createElement("div");
        // this.initElement();
        // this.hideElement();
        // // insert after "root"
        // document.body.appendChild(this.getElement());
    }

    getDisplayWindowClient = () => {
        return this._displayWindowClient;
    };

    contextMenuOptions: Record<string, any> = {};

    /**
     * Show context menu after clicking the right button
     * 
     * In desktop and ssh-client mode, show the electron.js rendered context menu
     * 
     * In web mode, use a customized context menu
     */
    show = (widgetKey: string, [x, y]: [number, number], options: Record<string, any> = {}) => {
        const element = document.createElement("div");
        // this._Element = document.createElement("div");
        // this.initElement(element);
        // this.hideElement();
        // insert after "root"

        this.contextMenuOptions = options;

        const windowStatus = g_widgets1.getRendererWindowStatusStr();
        const windowId = this.getDisplayWindowClient().getWindowId();
        const mainProcessMode = this.getDisplayWindowClient().getMainProcessMode();
        if (widgetKey === "Canvas") {
            if (mainProcessMode === "desktop" || mainProcessMode === "ssh-client") {
                this.getDisplayWindowClient().getIpcManager().sendFromRendererProcess("show-context-menu", windowStatus, windowId, ["Canvas"], options);
            } else {
                this._widgetKeys = ["Canvas"];
                this.showElement(element, [x, y]);

            }
        } else {
            if (g_widgets1.isEditing()) {
                const selectedWidgetKeys = g_widgets1.getSelectedWidgetKeys();
                if (mainProcessMode === "desktop" || mainProcessMode === "ssh-client") {
                    this.getDisplayWindowClient()
                        .getIpcManager()
                        .sendFromRendererProcess("show-context-menu", windowStatus, windowId, selectedWidgetKeys, options);
                } else {
                    this._widgetKeys = selectedWidgetKeys;
                    this.showElement(element, [x, y]);
                }
            } else {
                if (mainProcessMode === "desktop" || mainProcessMode === "ssh-client") {
                    this.getDisplayWindowClient().getIpcManager().sendFromRendererProcess("show-context-menu", windowStatus, windowId, [widgetKey], options);
                } else {
                    this._widgetKeys = [widgetKey];
                    this.showElement(element, [x, y]);
                }
            }
        }
    };

    _ElementContextMenu = () => {
        return (
            <div style={{
                backgroundColor: "rgba(90, 90, 90, 1)",
                // backdropFilter: "blur(40px)",
                borderRadius: "7px",
                color: "rgba(235,235,235,1)",
                fontFamily: "TDM Default",
                fontSize: 13,
                paddingLeft: 4,
                paddingRight: 4,
                paddingTop: 6,
                paddingBottom: 6,
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "center",
                border: "1px solid rgba(150, 150, 150, 1)",
                outline: "0.5px solid rgba(0, 0, 0, 1)",
                userSelect: "none",
            }}>
                {
                    this.getTemplate().map((menuItem: MenuItem, index: number) => {
                        return (
                            <this._ElementMenuItem key={menuItem["label"] + `-${index}`} menuItem={menuItem}></this._ElementMenuItem>
                        )
                    })
                }
            </div>
        );
    }


    _ElementSubMenu = ({ submenu, show }: any) => {
        return (
            <div style={{
                position: "absolute",
                width: "auto",
                height: "auto",
                top: 0,
                left: `calc(100% - 0px)`,
                backgroundColor: "rgba(90, 90, 90, 1)",
                backdropFilter: "blur(40px)",
                borderRadius: "7px",
                color: "rgba(235,235,235,1)",
                fontFamily: "TDM Default",
                fontSize: 13,
                paddingLeft: 4,
                paddingRight: 4,
                paddingTop: 6,
                paddingBottom: 6,
                display: show ? "inline-flex" : "none",
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "center",
                border: "1px solid rgba(150, 150, 150, 1)",
                outline: "0.5px solid rgba(0, 0, 0, 1)",
                userSelect: "none",
            }}>
                {
                    submenu.map((menuItem: MenuItem) => {
                        return (
                            <this._ElementMenuItem menuItem={menuItem}>
                            </this._ElementMenuItem>
                        )
                    })

                }
            </div>
        );
    }

    _ElementMenuItem = ({ menuItem, }: any) => {
        const refElement = React.useRef<any>(null);
        const [showSubMenu, setShowSubMenu] = React.useState(false);

        const label = menuItem["label"];
        const handleClick = menuItem["click"];
        const submenu = menuItem["submenu"];
        const type = menuItem["type"];

        if (label !== undefined) {
            return (
                <div
                    ref={refElement}
                    style={{
                        paddingTop: 3.5,
                        paddingBottom: 3.5,
                        paddingLeft: 9,
                        paddingRight: 9,
                        borderRadius: 4,
                        boxSizing: "border-box",
                        width: "100%",
                        cursor: "default",
                        position: "relative",
                        whiteSpace: "nowrap",
                        display: "inline-flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        userSelect: "none",
                    }}
                    onMouseEnter={() => {
                        if (refElement.current !== null) {
                            refElement.current.style["backgroundColor"] = "rgba(104, 145, 229, 1)";
                            setShowSubMenu(true);
                        }
                    }}
                    onMouseLeave={() => {
                        if (refElement.current !== null) {
                            refElement.current.style["backgroundColor"] = "rgba(60, 135, 210, 0)";
                            setShowSubMenu(false);
                        }
                    }}
                    onClick={(event: any) => {
                        event.stopPropagation();
                        event.preventDefault();
                        if (handleClick !== undefined) {
                            handleClick();
                            // hide the context menu after click
                            this.hideElement();
                        }
                    }}
                    onMouseDown={(event: any) => {
                        event?.preventDefault();
                    }}
                >
                    {submenu !== undefined ?
                        <>
                            <div>
                                {label}
                            </div>
                            <div style={{
                                width: 80
                            }}>
                            </div>
                            <div>
                                <img src="../../../webpack/resources/webpages/arrowRight-thin-white.svg" width="9px" height="9px">
                                </img>
                            </div>
                        </>
                        :
                        label}
                    {submenu !== undefined ?
                        <this._ElementSubMenu submenu={submenu} show={showSubMenu}></this._ElementSubMenu>
                        : null}
                </div>
            )
        } else if (type === "separator") {
            return (
                <div style={{
                    width: "100%",
                    height: 10,
                    display: "flex",
                    justifyContent: 'center',
                    alignItems: "center",
                    userSelect: "none",
                }}>
                    <hr style={{
                        width: "100%",
                        border: "0.5px solid rgba(130, 130, 130, 1)"
                    }}></hr>
                </div>
            )
        } else {
            return null;
        }
    }

    hideElement = () => {
        // hiding the context menu is carried out in mouse down event handler in Canvas and Widgets before any other actions 
        // it cannot be done in window, if so, the DisplayWindowClient.showContextMenu() may be invoked earlier than hideElement()
        // which causes the context menu cannot be shown
        try {
            // document.body.removeEl(this._Element);
            document.getElementById("context-menu")?.remove();
        } catch (e) {
            Log.error(e)
        }
    };

    showElement = (element: HTMLDivElement, [x, y]: [number, number]) => {
        element.id = "context-menu";
        element.style["position"] = "absolute";
        element.style["left"] = `${x}px`;
        element.style["top"] = `${y}px`;
        element.style["width"] = "auto";
        element.style["height"] = "auto";
        element.style["visibility"] = "visible";
        document.body.appendChild(element);
        const root = ReactDOM.createRoot(element);
        root.render(<this._ElementContextMenu></this._ElementContextMenu>)
    };

    // getTemplate = () => {
    //     return this._template;
    // };

    // setTemplate = (newTemplate: MenuItem[]) => {
    //     this._template = newTemplate;
    // };


    getTempaltes = () => {
        return this._templates;
    };




    // this.contextMenuOptions = options;

    // const windowStatus = ;
    // const windowId = this.getDisplayWindowClient().getWindowId();
    // const mainProcessMode = this.getDisplayWindowClient().getMainProcessMode();
    // if (widgetKey === "Canvas") {
    //     if (mainProcessMode === "desktop" || mainProcessMode === "ssh-client") {
    //         this.getDisplayWindowClient().getIpcManager().sendFromRendererProcess("show-context-menu", windowStatus, windowId, ["Canvas"], options);


    // getTemplate = (mode: string, widgetKeys: string[], options: Record<string, any>) => {
    getTemplate = () => {

        if (g_widgets1 !== undefined) {
            if (g_widgets1.getRoot().getEditable() === false) {
                const firstOption = this._template_operating_Canvas[0];
                const label = firstOption["label"];
                if (firstOption !== undefined && label !== undefined && label.includes("Edit")) {
                    this._template_operating_Canvas.shift();
                    this._template_operating_Widget.shift();
                }
            }
        }


        let mode = g_widgets1.getRendererWindowStatusStr();
        const widgetKeys = this._widgetKeys;
        const options = this.contextMenuOptions;


        // disable context menu for DataViewer at operating mode
        // if (mode === "operating" && this._widgetKeys.length === 1 && this._widgetKeys[0].includes("DataViewer")) {
        //     return undefined;
        // }

        // const templates = this.getTempaltes();

        if (mode !== "operating") {
            mode = "editing";
        }

        // if (mode === "operating") {
        //     if (this.getDisplayWindowAgent().isEditable() === true) {
        //         if(this._template_operating_Canvas.includes(this.templateItemEditDisplay) === false) {
        //             this._template_operating_Canvas.unshift(this.templateItemEditDisplay);
        //             this._template_operating_Widget.unshift(this.templateItemEditDisplay);
        //         }
        //     }
        //     else {

        //     }
        // } else if (mode === "editing") {
        //     // do nothing
        // }

        let location = "Widget";
        if (widgetKeys[0] === "Canvas") {
            location = "Canvas";
        }

        let widgetSpecificItems = undefined;
        if (widgetKeys.length === 1 && mode === "operating") {
            widgetSpecificItems = this.resolveWidgetSpecificItems(widgetKeys[0], options);
        }

        const name = `${mode}_${location}`;

        if (widgetSpecificItems === undefined) {
            return this.getTempaltes()[name];
        } else {
            return [...(widgetSpecificItems as MenuItem[]), ...this.getTempaltes()[name]];
        }
    };

    removeItems = (itemNames: string[]) => {
        for (let ii = this._template_operating_Widget.length - 1; ii >= 0; ii--) {
            const entry = this._template_operating_Widget[ii];
            for (let itemName of itemNames) {
                if ((entry["label"] === itemName)) {
                    this._template_operating_Widget.splice(ii, 1);
                }
            }
        }
    }

    resolveWidgetSpecificItems = (
        widgetKey: string,
        options: Record<string, any>,
        event: any = undefined,
    ): MenuItem[]
        | undefined => {

        let result: MenuItem[] = [];

        // remove items for utility window widgets
        if (widgetKey.includes("LogViewer")
            || widgetKey.includes("CaSnooper")
            || widgetKey.includes("Casw")
            || widgetKey.includes("Calculator")
            || widgetKey.includes("ProfilesViewer")
            || widgetKey.includes("Help")
            || widgetKey.includes("FileConverter")
            || widgetKey.includes("Terminal")) {
            // they have not state, the "Download Display" is removed
            this.removeItems(["Reload Display", "Download Display", "Duplicate Display", "Copy PV Names", "Copy PV Values"]);
        } else if (widgetKey.includes("PvMonitor")
            || widgetKey.includes("TextEditor")) {
            // they are stateful, we should be able to save them
            this.removeItems(["Reload Display", "Duplicate Display", "Copy PV Names", "Copy PV Values"]);
        }

        // <input /> or <textarea /> element, show copy/paste/cut/redo/undo if they are focused
        const inputElementFocused = options["inputElementFocused"];
        if (inputElementFocused !== undefined && inputElementFocused === true) {
            const selection = window.getSelection();
            const textSelected = selection === null ? false : selection.toString().length > 0 ? true : false;
            const selectedText = selection === null ? undefined : selection.toString();
            if (textSelected) {
                result.push(...[
                    {
                        label: "Copy",
                        role: "copy",
                        accelerator: "CmdOrCtrl+c",
                        click: () => {
                            if (selectedText !== undefined) {
                                try {
                                    navigator.clipboard.writeText(selectedText)
                                } catch (e) {
                                    console.log(e);
                                }
                            }
                        },
                    },
                    // javascript cannot invoke web browser API to do copy/paste/cut 
                    // {
                    //     label: "Paste",
                    //     role: "paste",
                    //     accelerator: "CmdOrCtrl+v",
                    //     click: () => {
                    //         // todo
                    //     },
                    // },
                    // {
                    //     label: "Cut",
                    //     role: "cut",
                    //     accelerator: "CmdOrCtrl+x",
                    //     click: () => {
                    //         // todo
                    //     },
                    // },
                    // {
                    //     label: "Undo",
                    //     role: "undo",
                    //     accelerator: "CmdOrCtrl+z",
                    //     click: () => {
                    //         // todo
                    //     },
                    // },
                    // {
                    //     label: "Redo",
                    //     role: "redo",
                    //     accelerator: "CmdOrCtrl+Shift+z",
                    //     click: () => {
                    //         // todo
                    //     },
                    // },
                    { type: "separator" },
                ])
            }
        }

        if (widgetKey.includes("ScaledSlider") || widgetKey.includes("Spinner")) {
            result.push(...[
                {
                    label: "Settings",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleWidgetSpecificAction(undefined, widgetKey, "open-settings");
                    },
                },
                { type: "separator" },
            ]);
        } else if (widgetKey.includes("LogViewer") || widgetKey.includes("PvMonitor") || widgetKey.includes("CaSnooper") || widgetKey.includes("Casw") || widgetKey.includes("FileConverter")) {
            // Table: save data, copy data, ...
            if (options["contextMenuTexts"] !== undefined) {
                const contextMenuTexts = options["contextMenuTexts"];
                for (let text of contextMenuTexts) {
                    result.push({
                        label: text,
                        click: () => {
                            this.getDisplayWindowClient().getIpcManager().handleWidgetSpecificAction(undefined, widgetKey, text);
                        }
                    })
                }
                result.push({ type: "separator" });
            }
        } else if (widgetKey.includes("Terminal")) {
            result.push(...[
                {
                    label: "Copy",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleWidgetSpecificAction(undefined, widgetKey, "copy-terminal-text");
                    },
                },
                {
                    label: "Paste",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleWidgetSpecificAction(undefined, widgetKey, "paste-terminal-text");
                    },
                },
                { type: "separator" },
            ]);
        } else if (widgetKey.includes("Help") || widgetKey.startsWith("TdlViewer") || widgetKey.startsWith("TextEditor") || widgetKey.startsWith("ProfilesViewer") || widgetKey.startsWith("LogViewer") || widgetKey.startsWith("CaSnooper") || widgetKey.startsWith("Casw")) {
            // non-input area of widgets, we want to copy the selected text
            // show only when there is text selected
            const textSelected = options["textSelected"];
            const selectedText = options["selectedText"];
            if (textSelected !== undefined && textSelected === true && typeof selectedText === "string") {
                result.push(...[
                    {
                        label: "Copy",
                        accelerator: "CmdOrCtrl+c",
                        role: "copy",
                        click: () => {
                            // web mode does not honor the "role" above
                            try {
                                navigator.clipboard.writeText(selectedText)
                            } catch (e) {
                                console.log(e);
                            }

                        },
                    },
                    { type: "separator" },
                ]);
            }
        } else if (widgetKey.includes("ChannelGraph")) {
            const showChannelGraphOptions = options["showChannelGraphOptions"];
            if (showChannelGraphOptions !== undefined && showChannelGraphOptions === true) {
                result.push(...[
                    {
                        label: "Clear graph",
                        click: () => {
                            this.getDisplayWindowClient().getIpcManager().handleWidgetSpecificAction(undefined, widgetKey, "clear-graph");
                        },
                    },
                    {
                        label: "Graph settings",
                        click: () => {
                            this.getDisplayWindowClient().getIpcManager().handleWidgetSpecificAction(undefined, widgetKey, "show-settings");
                        },
                    },
                    { type: "separator" },
                ]);
            }

        }

        return result;
    };



    private _template_editing_Canvas: MenuItem[] = [
        {
            label: "Execute Display",
            accelerator: "CmdOrCtrl+e",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "execute-display", undefined)
            },
        },
        {
            label: "Save Display on Server",
            accelerator: "CmdOrCtrl+s",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "save-display", undefined);
            },
        },
        {
            label: "Download Display",
            accelerator: "CmdOrCtrl+Shift+s",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "save-display-as", undefined);
            },
        },

        {
            label: "Duplicate Display",
            accelerator: "CmdOrCtrl+d",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "duplicate-display", undefined);
            },
        },
        {
            label: "Reload Display",
            accelerator: "CmdOrCtrl+r",
            click: () => {
                this.getDisplayWindowClient().reloadDisplay();
                // this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "reload-display", undefined);
            },
        },
        {
            label: "Show Display Contents",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "show-tdl-file-contents", undefined);
            },
        },
        // {
        //     label: "Open Text Editor",
        //     click: () => {
        //         this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", "open-text-editor");
        //     },
        // },

        { type: "separator" },
        {
            label: "Open Display",
            accelerator: "CmdOrCtrl+o",
            click: () => {
                this.getDisplayWindowClient().openTdlFileInWebMode();
            },
        },
        {
            label: "Browse Display on Server",
            click: () => {
                // this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", "file-browser", ["", true]);
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "file-browser", ["", false]);
            },
        },
        {
            label: "Create New Display",
            accelerator: "CmdOrCtrl+n",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "create-new-display-in-web-mode", undefined);
            },
        },

        { type: "separator" },
        {
            label: "Create Static Widget",
            submenu: [
                {
                    label: "Label",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "create-widget", "label");
                    },
                },

                {
                    label: "Polyline",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "create-widget", "polyline");
                    },
                },
                {
                    label: "Arc",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "create-widget", "arc");
                    },
                },
                {
                    label: "Rectangle",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "create-widget", "rectangle");
                    },
                },
                {
                    label: "Media",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "create-widget", "media");
                    },
                },
            ],
        },
        {
            label: "Create Monitor Widget",
            submenu: [
                {
                    label: "Text Update",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "create-widget", "text-update");
                    },
                },
                {
                    label: "Meter",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "create-widget", "meter");
                    },
                },
                {
                    label: "Tank",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "create-widget", "tank");
                    },
                },
                {
                    label: "Thermometer",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "create-widget", "thermometer");
                    },
                },
                { type: "separator" },

                {
                    label: "LED",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "create-widget", "led");
                    },
                },
                {
                    label: "LED (Multi State)",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "create-widget", "led-multiple-state");
                    },
                },
                {
                    label: "Byte Monitor",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "create-widget", "byte-monitor");
                    },
                },
                { type: "separator" },
                {
                    label: "Symbol",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "create-widget", "symbol");
                    },
                },
                {
                    label: "Text Symbol",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "create-widget", "text-symbol");
                    },
                },
            ],
        },
        {
            label: "Create Control Widget",
            submenu: [
                {
                    label: "Text Entry",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "create-widget", "text-entry");
                    },
                },
                {
                    label: "Scaled Slider",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "create-widget", "scaled-slider");
                    },
                },
                {
                    label: "Spinner",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "create-widget", "spinner");
                    },
                },
                // {
                //     label: "ThumbWheel",
                //     click: () => {
                //         this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "create-widget", "thumb-wheel");
                //     },
                // },

                { type: "separator" },

                {
                    label: "Boolean Button",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "create-widget", "boolean-button");
                    },
                },
                {
                    label: "Slide Button",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "create-widget", "slide-button");
                    },
                },
                {
                    label: "Check Box",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "create-widget", "check-box");
                    },
                },
                { type: "separator" },
                {
                    label: "Choice Button",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "create-widget", "choice-button");
                    },
                },
                {
                    label: "Combo Box",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "create-widget", "combo-box");
                    },
                },
                {
                    label: "Radio Button",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "create-widget", "radio-button");
                    },
                },
            ],
        },
        {
            label: "Create Complex Widget",
            submenu: [
                {
                    label: "Action Button",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "create-widget", "action-button");
                    },
                },

                {
                    label: "Embedded Display",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "create-widget", "embedded-display");
                    },
                },
                {
                    label: "Table",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "create-widget", "table");
                    },
                },
                {
                    label: "Group",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "create-widget", "group");
                    },
                },
                {
                    label: "Binary Image",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "create-widget", "binary-image");
                    },
                },

                { type: "separator" },

                {
                    label: "Probe",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "create-widget", "probe");
                    },
                },
                {
                    label: "PV Monitor",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "create-widget", "pv-monitor");
                    },
                },
                {
                    label: "Data Viewer",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "create-widget", "data-viewer");
                    },
                },
                {
                    label: "XY Plot",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "create-widget", "xy-plot");
                    },
                },
                {
                    label: "PV Table",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "create-widget", "pv-table");
                    },
                },
                {
                    label: "PV Monitor",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "create-widget", "pv-monitor");
                    },
                },
                {
                    label: "Calculator",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "create-widget", "calculator");
                    },
                },
                {
                    label: "Channel Graph",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "create-widget", "channel-graph");
                    },
                },
                // do not explicitly create Help widget
                // {
                //     label: "Help",
                //     click: () => {
                //         this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", "create-widget", "help");
                //     },
                // },
            ],
        },

        { type: "separator" },
        {
            label: "Undo",
            accelerator: "CmdOrCtrl+z",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "undo", undefined);
            },
        },
        {
            label: "Redo",
            accelerator: "CmdOrCtrl+y",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "redo", undefined);
            },
        },
        {
            label: "Paste Widgets",
            accelerator: "CmdOrCtrl+v",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "paste-widgets", undefined);
            },
        },
        {
            label: "Select All Widgets",
            accelerator: "CmdOrCtrl+a",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "select-all-widgets", undefined);
            },
        },
        // {
        //     label: "Edit Display Source File (todo)",
        //     click: () => {
        //         // todo:
        //         // this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", "execute-display");
        //     },
        // },

        { type: "separator" },

        {
            label: "Toggle Title",
            accelerator: "CmdOrCtrl+t",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "toggle-title", undefined);
            },
        },
        // {
        //     label: "Bring Up Main Winodw (to remove)",
        //     accelerator: "F2",
        //     click: () => {
        //         // this.getWindowAgentsManager().getMainProcess().getIpcManager().handleBringUpMainWindow();
        //     },
        // },
        // {
        //     label: "Zoom (to remove)",
        //     submenu: [
        //         {
        //             label: "500%",
        //             click: () => {
        //                 this.getDisplayWindowClient().zoomWindow(1.5);
        //                 // this.getDisplayWindowAgent().setZoomFactor(5);
        //             },
        //         },
        //         {
        //             label: "250%",
        //             click: () => {
        //                 // this.getDisplayWindowAgent().setZoomFactor(2.5);
        //             },
        //         },
        //         {
        //             label: "150%",
        //             click: () => {
        //                 // this.getDisplayWindowAgent().setZoomFactor(1.5);
        //             },
        //         },
        //         {
        //             label: "100%",
        //             click: () => {
        //                 // this.getDisplayWindowAgent().setZoomFactor(1);
        //             },
        //         },
        //         {
        //             label: "75%",
        //             click: () => {
        //                 // this.getDisplayWindowAgent().setZoomFactor(0.75);
        //             },
        //         },
        //         {
        //             label: "50%",
        //             click: () => {
        //                 // this.getDisplayWindowAgent().setZoomFactor(0.5);
        //             },
        //         },
        //         {
        //             label: "25%",
        //             click: () => {
        //                 // this.getDisplayWindowAgent().setZoomFactor(0.25);
        //             },
        //         },
        //     ],
        // },
        { type: "separator" },
        {
            label: "Take Screenshot",
            submenu: [
                {
                    label: "Save to Image File",
                    accelerator: "F7",
                    click: () => {
                        this.hideElement();
                        this.getDisplayWindowClient().downloadScreenshot();
                    },
                },
                {
                    label: "Copy to Clipboard as Image",
                    accelerator: "F6",
                    click: () => {
                        this.hideElement();
                        this.getDisplayWindowClient().takeScreenshot();
                    },
                },
                // {
                //     label: "Auto Save to Folder",
                //     accelerator: "F8",
                //     click: () => {
                //         // this.getDisplayWindowAgent().takeScreenshotToFolder();
                //     },
                // },
                // {
                //     label: "Save to pdf File",
                //     click: () => {
                //         // this.getDisplayWindowAgent().printToPdf();
                //     },
                // },
                // {
                //     label: "Start to record video",
                //     click: () => {
                //         // this.getDisplayWindowAgent().startRecordVideo();
                //     },
                // },
            ],
        },
        {
            label: "Print",
            accelerator: "CmdOrCtrl+p",
            click: () => {
                this.hideElement();
                this.getDisplayWindowClient().print();
            },
        },
        {
            label: "Help",
            accelerator: "F1",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "help", []);
            },
        },

    ];
    private _template_editing_Widget: MenuItem[] = [
        {
            label: "Copy Widgets",
            accelerator: "CmdOrCtrl+c",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "copy-widgets", undefined);
            },
        },
        {
            label: "Cut Widgets",
            accelerator: "CmdOrCtrl+x",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "cut-widgets", undefined);
            },
        },
        {
            label: "Paste Widgets",
            accelerator: "CmdOrCtrl+v",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "paste-widgets", undefined);
            },
        },
        {
            label: "Delete Widgets",
            accelerator: "delete",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "delete-widgets", undefined);
            },
        },
        {
            label: "Duplicate Widgets",
            accelerator: "CmdOrCtrl+d",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "duplicate-widgets", undefined);
            },
        },
        { type: "separator" },
        {
            label: "Group Widgets",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "group-widgets", undefined);
            },
        },
        {
            label: "Ungroup Widgets",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "ungroup-widgets", undefined);
            },
        },
        { type: "separator" },
        {
            label: "Bring/Send Widgets to",
            submenu: [
                {
                    label: "Bring to Front",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "bring-widget-to", "front");
                    },
                },
                {
                    label: "Send to Back",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "bring-widget-to", "back");
                    },
                },
                {
                    label: "Bring Forward",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "bring-widget-to", "forward");
                    },
                },
                {
                    label: "Send Backward",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "bring-widget-to", "backward");
                    },
                },
            ],
        },

        {
            label: "Align Widgets",
            submenu: [
                {
                    label: "Left",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "align-widgets", "left");
                    },
                },
                {
                    label: "Center",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "align-widgets", "center");
                    },
                },
                {
                    label: "Right",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "align-widgets", "right");
                    },
                },
                {
                    label: "Top",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "align-widgets", "top");
                    },
                },
                {
                    label: "Middle",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "align-widgets", "middle");
                    },
                },
                {
                    label: "Bottom",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "align-widgets", "bottom");
                    },
                },
            ],
        },
        {
            label: "Distribute Widgets",
            submenu: [
                {
                    label: "according to Left",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "distribute-widgets", "left");
                    },
                },
                {
                    label: "according to Center",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "distribute-widgets", "center");
                    },
                },
                {
                    label: "according to Right",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "distribute-widgets", "right");
                    },
                },
                {
                    label: "according to Top",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "distribute-widgets", "top");
                    },
                },
                {
                    label: "according to Middle",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "distribute-widgets", "middle");
                    },
                },
                {
                    label: "according to Bottom",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "distribute-widgets", "bottom");
                    },
                },
            ],
        },
        {
            label: "Match Widgets Size",
            submenu: [
                {
                    label: "to Average Width",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "match-widgets-size", "width");
                    },
                },
                {
                    label: "to Average Height",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "match-widgets-size", "height");
                    },
                },
            ],
        },
        { type: "separator" },
        {
            label: "Help",
            accelerator: "F1",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "help", []);
            },
        },
    ];

    private _template_operating_Canvas: MenuItem[] = [
        {
            label: "Edit Display",
            accelerator: "CmdOrCtrl+e",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "edit-display", undefined);
            },
        },
        {
            label: "Download Display",
            accelerator: "CmdOrCtrl+Shift+s",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "save-display-as", undefined);
            },
        },
        {
            label: "Duplicate Display",
            accelerator: "CmdOrCtrl+d",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "duplicate-display", undefined);
            },
        },
        {
            label: "Reload Display",
            accelerator: "CmdOrCtrl+r",
            click: () => {
                this.getDisplayWindowClient().reloadDisplay();
                // this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "reload-display", undefined);
            },
        },
        {
            label: "Show Display Contents",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "show-tdl-file-contents", undefined);
            },
        },
        // {
        //     label: "Open Text Editor",
        //     click: () => {
        //         this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", "open-text-editor");
        //     },
        // },

        { type: "separator" },
        {
            label: "Open Display",
            accelerator: "CmdOrCtrl+o",
            click: () => {
                this.getDisplayWindowClient().openTdlFileInWebMode();

            },
            // click: () => {
            //     // this.getDisplayWindowAgent().getWindowAgentsManager().handleOpenTdlFiles(undefined, undefined, "operating", true, [], false);
            //     this.getDisplayWindowAgent().getWindowAgentsManager().getMainProcess().getIpcManager().handleOpenTdlFiles(undefined, {
            //         tdlFileNames: undefined, // open dialog
            //         mode: "operating",
            //         editable: true,
            //         macros: [],
            //         replaceMacros: false,
            //         // currentTdlFolder?: string;
            //     });
            //     // .handleOpenTdlFiles(undefined, undefined, "operating", true, [], false);
            // },
        },
        {
            label: "Browse Displays on Server",
            click: () => {
                // this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", "file-browser", ["", true]);
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "file-browser", ["", false]);
            },
        },

        {
            label: "Create New Display",
            accelerator: "CmdOrCtrl+n",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "create-new-display-in-web-mode", undefined);
            },
        },

        { type: "separator" },
        {
            label: "Copy All PV Names",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "copy-all-pv-names", undefined);
            },
        },
        {
            label: "Copy All PV Values",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "copy-all-pv-values", undefined);
            },
        },
        { type: "separator" },
        {
            label: "Probe",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "probe", [""]);
            },
        },
        {
            label: "PV Table",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "pv-table", undefined);
            },
        },
        {
            label: "PV Monitor",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "pv-monitor", [""]);
            },
        },
        {
            label: "Data Viewer",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "data-viewer", []);
            },
        },
        // {
        //     label: "Terminal (todo)",
        //     click: () => {
        //         this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "terminal", undefined);
        //     },
        // },
        {
            label: "Calculator",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "calculator", undefined);
            },
        },
        {
            label: "Channel Graph",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "channel-graph", undefined);
            },
        },
        { type: "separator" },
        {
            label: "Toggle Title",
            accelerator: "CmdOrCtrl+t",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "toggle-title", undefined);
            },
        },
        // {
        //     label: "Bring Up Main Winodw (to remove)",
        //     accelerator: "F2",
        //     click: () => {
        //         // this.getWindowAgentsManager().getMainProcess().getIpcManager().handleBringUpMainWindow();
        //     },
        // },
        // {
        //     label: "Zoom (remove)",
        //     submenu: [
        //         {
        //             label: "200%",
        //             click: () => {
        //                 // this.getDisplayWindowClient().zoomWindow(2);
        //                 // this.getDisplayWindowAgent().setZoomFactor(2);
        //             },
        //         },
        //         {
        //             label: "150%",
        //             click: () => {
        //                 // this.getDisplayWindowAgent().setZoomFactor(1.5);
        //             },
        //         },
        //         {
        //             label: "125%",
        //             click: () => {
        //                 // this.getDisplayWindowAgent().setZoomFactor(1.25);
        //             },
        //         },
        //         {
        //             label: "100%",
        //             click: () => {
        //                 // this.getDisplayWindowAgent().setZoomFactor(1);
        //             },
        //         },
        //         {
        //             label: "75%",
        //             click: () => {
        //                 // this.getDisplayWindowAgent().setZoomFactor(0.75);
        //             },
        //         },
        //         {
        //             label: "50%",
        //             click: () => {
        //                 // this.getDisplayWindowAgent().setZoomFactor(0.5);
        //             },
        //         },
        //         {
        //             label: "25%",
        //             click: () => {
        //                 // this.getDisplayWindowAgent().setZoomFactor(0.25);
        //             },
        //         },
        //     ],
        // },
        { type: "separator" },
        {
            label: "Take Screenshot",
            submenu: [
                {
                    label: "Save to Image File",
                    accelerator: "F7",
                    click: () => {
                        this.hideElement();
                        this.getDisplayWindowClient().downloadScreenshot();
                    },
                },
                {
                    label: "Copy to Clipboard as Image",
                    accelerator: "F6",
                    click: () => {
                        this.hideElement();
                        this.getDisplayWindowClient().takeScreenshot();
                    },
                },
                // {
                //     label: "Auto Save to Folder",
                //     accelerator: "F8",
                //     click: () => {
                //         // this.getDisplayWindowAgent().takeScreenshotToFolder();
                //     },
                // },
                // {
                //     label: "Save to pdf File",
                //     click: () => {
                //         // this.getDisplayWindowAgent().printToPdf();
                //     },
                // },
                // {
                //     label: "Start to record video",
                //     click: () => {
                //         // this.getDisplayWindowAgent().startRecordVideo();
                //     },
                // },
            ],
        },
        {
            label: "Print",
            accelerator: "CmdOrCtrl+p",
            click: () => {
                this.hideElement();
                this.getDisplayWindowClient().print();
            },
        },
        {
            label: "Help",
            accelerator: "F1",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "help", []);
            },
        },
    ];

    private _template_operating_Widget: MenuItem[] = [
        {
            label: "Edit Display",
            accelerator: "CmdOrCtrl+e",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "edit-display", undefined);
            },
        },
        {
            label: "Download Display",
            accelerator: "CmdOrCtrl+Shift+s",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "save-display-as", undefined);
            },
        },
        {
            label: "Duplicate Display",
            accelerator: "CmdOrCtrl+d",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "duplicate-display", undefined);
            },
        },
        {
            label: "Reload Display",
            accelerator: "CmdOrCtrl+r",
            click: () => {
                this.getDisplayWindowClient().reloadDisplay();
                // this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "reload-display", undefined);
            },
        },
        {
            label: "Show Display Contents",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "show-tdl-file-contents", undefined);
            },
        },
        // {
        //     label: "Open Text Editor",
        //     click: () => {
        //         this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", "open-text-editor");
        //     },
        // },

        { type: "separator" },
        {
            label: "Open Display",
            accelerator: "CmdOrCtrl+o",
            click: () => {
                this.getDisplayWindowClient().openTdlFileInWebMode();
            },

            // click: () => {
            //     // this.getDisplayWindowAgent().getWindowAgentsManager().handleOpenTdlFiles(undefined, undefined, "operating", true, [], false);
            //     this.getDisplayWindowAgent().getWindowAgentsManager().getMainProcess().getIpcManager().handleOpenTdlFiles(undefined, {
            //         tdlFileNames: undefined, // open dialog
            //         mode: "operating",
            //         editable: true,
            //         macros: [],
            //         replaceMacros: false,
            //         // currentTdlFolder?: string;
            //         windowId: this.getDisplayWindowAgent().getId(),
            //     });
            //     // .handleOpenTdlFiles(undefined, undefined, "operating", true, [], false);
            // },
        },
        {
            label: "Browse Displays on Server",
            click: () => {
                // this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", "file-browser", ["", true]);
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "file-browser", ["", false]);
            },
        },
        {
            label: "Create New Display",
            accelerator: "CmdOrCtrl+n",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "create-new-display-in-web-mode", undefined);
            },
        },

        { type: "separator" },
        {
            label: "Copy PV Names",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "copy-widget-pv-names", this._widgetKeys);
            },
        },
        {
            label: "Copy PV Values",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "copy-widget-pv-values", this._widgetKeys);
            },
        },
        { type: "separator" },
        {
            label: "Probe",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "probe", this._widgetKeys);
            },
        },
        {
            label: "PV Table",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "pv-table", this._widgetKeys);
            },
        },
        {
            label: "PV Monitor",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "pv-monitor", this._widgetKeys);
            },
        },
        {
            label: "Data Viewer",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "data-viewer", this._widgetKeys);
            },
        },
        // {
        //     label: "Terminal (todo)",
        //     click: () => {
        //         // this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", "terminal");
        //     },
        // },
        {
            label: "Calculator",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "calculator", undefined);
            },
        },
        // {
        //     label: "Channel Graph",
        //     click: () => {
        //         this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", "channel-graph");
        //     },
        // },

        { type: "separator" },
        {
            label: "Toggle Title",
            accelerator: "CmdOrCtrl+t",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "toggle-title", undefined);
            },
        },
        // {
        //     label: "Bring Up Main Winodw (remove)",
        //     accelerator: "F2",
        //     click: () => {
        //         // todo: for ssh-client
        //         // this.getWindowAgentsManager().getMainProcess().getIpcManager().handleBringUpMainWindow();
        //     },
        // },
        // {
        //     label: "Zoom (todo)",
        //     submenu: [
        //         {
        //             label: "200%",
        //             click: () => {
        //                 // this.getDisplayWindowAgent().setZoomFactor(2);
        //             },
        //         },
        //         {
        //             label: "150%",
        //             click: () => {
        //                 // this.getDisplayWindowAgent().setZoomFactor(1.5);
        //             },
        //         },
        //         {
        //             label: "125%",
        //             click: () => {
        //                 // this.getDisplayWindowAgent().setZoomFactor(1.25);
        //             },
        //         },
        //         {
        //             label: "100%",
        //             click: () => {
        //                 // this.getDisplayWindowAgent().setZoomFactor(1);
        //             },
        //         },
        //         {
        //             label: "75%",
        //             click: () => {
        //                 // this.getDisplayWindowAgent().setZoomFactor(0.75);
        //             },
        //         },
        //         {
        //             label: "50%",
        //             click: () => {
        //                 // this.getDisplayWindowAgent().setZoomFactor(0.5);
        //             },
        //         },
        //         {
        //             label: "25%",
        //             click: () => {
        //                 // this.getDisplayWindowAgent().setZoomFactor(0.25);
        //             },
        //         },
        //     ],
        // },

        { type: "separator" },
        {
            label: "Take Screenshot",
            submenu: [
                {
                    label: "Save to Image File",
                    accelerator: "F7",
                    click: () => {
                        this.hideElement();
                        this.getDisplayWindowClient().downloadScreenshot();
                    },
                },
                {
                    label: "Copy to Clipboard as Image",
                    accelerator: "F6",
                    click: () => {
                        this.hideElement();
                        this.getDisplayWindowClient().takeScreenshot();
                    },
                },
                // {
                //     label: "Auto Save to Folder",
                //     accelerator: "F8",
                //     click: () => {
                //         // this.getDisplayWindowAgent().takeScreenshotToFolder();
                //     },
                // },
                // {
                //     label: "Save to pdf File",
                //     click: () => {
                //         // this.getDisplayWindowAgent().printToPdf();
                //     },
                // },
                // {
                //     label: "Start to record video",
                //     click: () => {
                //         // this.getDisplayWindowAgent().startRecordVideo();
                //     },
                // },
            ],
        },
        {
            label: "Print",
            accelerator: "CmdOrCtrl+p",
            click: () => {
                this.hideElement();
                this.getDisplayWindowClient().print();
            },
        },
        {
            label: "Help",
            accelerator: "F1",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "help", []);
            },
        },
    ];

    getWidgetKeys = () => {
        return this._widgetKeys;
    }

}
