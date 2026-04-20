import * as React from "react";
import { DisplayWindowClient } from "./DisplayWindowClient";
import { g_widgets1 } from "../../../rendererProcess/global/GlobalVariables";
import { Log } from "../../../common/Log";
import ReactDOM from 'react-dom/client';
import { createPortal } from "react-dom";
import { GlobalVariables } from "../../../common/GlobalVariables";


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

    _getMenuTheme = () => {
        const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;

        if (isDarkMode) {
            return {
                backgroundColor: "rgba(20, 20, 20, 0.65)",
                color: "rgba(252, 252, 253, 0.98)",
                border: "2px solid rgba(100, 100, 100, 0.0)",
                outline: "0.5px solid rgba(50, 50, 50, 0.8)",
                separatorColor: "rgba(255, 255, 255, 0.15)",
                hoverBackgroundColor: "rgba(10, 132, 255, 0.96)",
                hoverColor: "rgba(255, 255, 255, 1)",
                boxShadow: "0 18px 44px rgba(0, 0, 0, 0.34), 0 4px 12px rgba(0, 0, 0, 0.24)",
                backdropFilter: "blur(4px) saturate(110%)",
                WebkitBackdropFilter: "blur(4px) saturate(110%)",
                fontFamily: GlobalVariables.defaultFontFamily,
                fontSize: 13.5,
                fontWeight: 500,
                borderRadius: 10,
                menuPaddingX: 5,
                menuPaddingY: 5,
                itemPaddingX: 11,
                itemPaddingY: 3,
                itemMinHeight: 24,
                itemBorderRadius: 6,
                separatorInset: 24,
                separatorHeight: 12,
                submenuOffsetX: -3,
                submenuOffsetY: -8,
                submenuIndicatorWidth: 16,
            };
        }

        return {
            backgroundColor: "rgba(240, 240, 240, 0.68)", /* Translucent white */
            outline: "0.5px solid rgba(70, 70, 70, 0.3)",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)", /* Soft shadow */
            color: "rgba(18, 18, 20, 0.98)",
            border: "0.5px solid rgba(230, 230, 230, 0.72)",
            separatorColor: "rgba(60, 60, 67, 0.16)",
            hoverBackgroundColor: "rgba(92, 161, 255, 1)",
            hoverColor: "rgba(255, 255, 255, 1)",
            backdropFilter: "blur(4px) saturate(110%)",
            WebkitBackdropFilter: "blur(4px) saturate(110%)",
            fontFamily: GlobalVariables.defaultFontFamily,
            fontSize: 13.5,
            fontWeight: 500,
            borderRadius: 10,
            menuPaddingX: 5,
            menuPaddingY: 5,
            itemPaddingX: 11,
            itemPaddingY: 3,
            itemMinHeight: 24,
            itemBorderRadius: 6,
            separatorInset: 24,
            separatorHeight: 12,
            submenuOffsetX: -3,
            submenuOffsetY: -8,
            submenuIndicatorWidth: 16,
        };
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
                this.getDisplayWindowClient().getIpcManager().sendFromRendererProcess("show-context-menu",
                    {
                        mode: windowStatus,
                        displayWindowId: windowId,
                        widgetKeys: ["Canvas"],
                        options: options
                    }
                );
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
                        .sendFromRendererProcess("show-context-menu",
                            {
                                mode: windowStatus,
                                displayWindowId: windowId,
                                widgetKeys: selectedWidgetKeys,
                                options: options,
                            }
                        );
                } else {
                    this._widgetKeys = selectedWidgetKeys;
                    this.showElement(element, [x, y]);
                }
            } else {
                if (mainProcessMode === "desktop" || mainProcessMode === "ssh-client") {
                    this.getDisplayWindowClient().getIpcManager().sendFromRendererProcess("show-context-menu",
                        {
                            mode: windowStatus,
                            displayWindowId: windowId,
                            widgetKeys: [widgetKey],
                            options: options
                        }
                    );
                } else {
                    this._widgetKeys = [widgetKey];
                    this.showElement(element, [x, y]);
                }
            }
        }
    };

    _ElementContextMenu = () => {
        const menuTheme = this._getMenuTheme();

        return (
            <>
                <div style={{
                    backgroundColor: menuTheme.backgroundColor,
                    color: menuTheme.color,
                    border: menuTheme.border,
                    outline: menuTheme.outline,
                    borderRadius: menuTheme.borderRadius,
                    backdropFilter: menuTheme.backdropFilter,
                    WebkitBackdropFilter: menuTheme.WebkitBackdropFilter,
                    boxShadow: menuTheme.boxShadow,
                    fontFamily: menuTheme.fontFamily,
                    fontSize: menuTheme.fontSize,
                    fontWeight: menuTheme.fontWeight,
                    paddingLeft: menuTheme.menuPaddingX,
                    paddingRight: menuTheme.menuPaddingX,
                    paddingTop: menuTheme.menuPaddingY,
                    paddingBottom: menuTheme.menuPaddingY,
                    display: "inline-flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    justifyContent: "center",
                    userSelect: "none",
                    boxSizing: "border-box",
                    minWidth: 240,
                    WebkitFontSmoothing: "antialiased",
                }}>
                    {
                        this.getTemplate().map((menuItem: MenuItem, index: number) => {
                            return (
                                <this._ElementMenuItem key={menuItem["label"] + `-${index}`} menuItem={menuItem}></this._ElementMenuItem>
                            )
                        })
                    }
                </div>
                <div id="context-menu-submenu-root"></div>
            </>
        );
    }


    _ElementSubMenu = ({ submenu, show, anchorRect, onMouseEnter, onMouseLeave }: any) => {
        const menuTheme = this._getMenuTheme();
        const portalContainer = document.getElementById("context-menu-submenu-root");

        if (show !== true || anchorRect === null || portalContainer === null) {
            return null;
        }

        return createPortal((
            <div style={{
                position: "fixed",
                width: "auto",
                height: "auto",
                top: anchorRect.top + menuTheme.submenuOffsetY,
                left: anchorRect.right + menuTheme.submenuOffsetX,
                backgroundColor: menuTheme.backgroundColor,
                backdropFilter: menuTheme.backdropFilter,
                WebkitBackdropFilter: menuTheme.WebkitBackdropFilter,
                borderRadius: menuTheme.borderRadius,
                color: menuTheme.color,
                fontFamily: menuTheme.fontFamily,
                fontSize: menuTheme.fontSize,
                fontWeight: menuTheme.fontWeight,
                paddingLeft: menuTheme.menuPaddingX,
                paddingRight: menuTheme.menuPaddingX,
                paddingTop: menuTheme.menuPaddingY,
                paddingBottom: menuTheme.menuPaddingY,
                display: show ? "inline-flex" : "none",
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "center",
                border: menuTheme.border,
                outline: menuTheme.outline,
                boxShadow: menuTheme.boxShadow,
                userSelect: "none",
                boxSizing: "border-box",
                minWidth: 220,
                WebkitFontSmoothing: "antialiased",
                zIndex: 1,
            }}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
            >
                {
                    submenu.map((menuItem: MenuItem) => {
                        return (
                            <this._ElementMenuItem menuItem={menuItem}>
                            </this._ElementMenuItem>
                        )
                    })

                }
            </div>
        ), portalContainer);
    }

    _ElementMenuItem = ({ menuItem, }: any) => {
        const menuTheme = this._getMenuTheme();
        const refElement = React.useRef<HTMLDivElement>(null);
        const [showSubMenu, setShowSubMenu] = React.useState(false);
        const [submenuAnchorRect, setSubmenuAnchorRect] = React.useState<DOMRect | null>(null);
        const closeSubMenuTimerRef = React.useRef<number | null>(null);

        const label = menuItem["label"];
        const handleClick = menuItem["click"];
        const submenu = menuItem["submenu"];
        const type = menuItem["type"];

        React.useEffect(() => {
            return () => {
                if (closeSubMenuTimerRef.current !== null) {
                    window.clearTimeout(closeSubMenuTimerRef.current);
                }
            };
        }, []);

        const clearCloseSubMenuTimer = () => {
            if (closeSubMenuTimerRef.current !== null) {
                window.clearTimeout(closeSubMenuTimerRef.current);
                closeSubMenuTimerRef.current = null;
            }
        };

        const setHoverStyle = () => {
            if (refElement.current !== null) {
                refElement.current.style["backgroundColor"] = menuTheme.hoverBackgroundColor;
                refElement.current.style["color"] = menuTheme.hoverColor;
            }
        };

        const clearHoverStyle = () => {
            if (refElement.current !== null) {
                refElement.current.style["backgroundColor"] = "rgba(60, 135, 210, 0)";
                refElement.current.style["color"] = menuTheme.color;
            }
        };

        const openSubMenu = () => {
            clearCloseSubMenuTimer();
            setHoverStyle();
            if (refElement.current !== null) {
                setSubmenuAnchorRect(refElement.current.getBoundingClientRect());
            }
            setShowSubMenu(true);
        };

        const closeSubMenu = () => {
            clearCloseSubMenuTimer();
            clearHoverStyle();
            setShowSubMenu(false);
        };

        const scheduleCloseSubMenu = () => {
            clearCloseSubMenuTimer();
            closeSubMenuTimerRef.current = window.setTimeout(() => {
                closeSubMenu();
            }, 120);
        };

        if (label !== undefined) {
            return (
                <div
                    ref={refElement}
                    style={{
                        paddingTop: menuTheme.itemPaddingY,
                        paddingBottom: menuTheme.itemPaddingY,
                        paddingLeft: menuTheme.itemPaddingX,
                        paddingRight: menuTheme.itemPaddingX,
                        borderRadius: menuTheme.itemBorderRadius,
                        boxSizing: "border-box",
                        width: "100%",
                        cursor: "default",
                        position: "relative",
                        whiteSpace: "nowrap",
                        display: "inline-flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        userSelect: "none",
                        color: menuTheme.color,
                        minHeight: menuTheme.itemMinHeight,
                    }}
                    onMouseEnter={() => {
                        if (submenu !== undefined) {
                            openSubMenu();
                        } else {
                            setHoverStyle();
                        }
                    }}
                    onMouseLeave={() => {
                        if (submenu !== undefined) {
                            scheduleCloseSubMenu();
                        } else {
                            clearHoverStyle();
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
                            <div style={{
                                flex: 1,
                                paddingRight: 14,
                            }}>
                                {label}
                            </div>
                            <div style={{
                                width: menuTheme.submenuIndicatorWidth,
                                display: "inline-flex",
                                justifyContent: "center",
                                alignItems: "center",
                                flexShrink: 0,
                            }}>
                                <div style={{
                                    width: 7,
                                    height: 7,
                                    borderTop: "1.75px solid currentColor",
                                    borderRight: "1.75px solid currentColor",
                                    transform: "rotate(45deg)",
                                    boxSizing: "border-box",
                                }}>
                                </div>
                            </div>
                        </>
                        :
                        label}
                    {submenu !== undefined ?
                        <this._ElementSubMenu
                            submenu={submenu}
                            show={showSubMenu}
                            anchorRect={submenuAnchorRect}
                            onMouseEnter={() => {
                                clearCloseSubMenuTimer();
                                setHoverStyle();
                            }}
                            onMouseLeave={() => {
                                scheduleCloseSubMenu();
                            }}
                        ></this._ElementSubMenu>
                        : null}
                </div>
            )
        } else if (type === "separator") {
            return (
                <div style={{
                    width: "100%",
                    height: menuTheme.separatorHeight,
                    display: "flex",
                    justifyContent: 'center',
                    alignItems: "center",
                    userSelect: "none",
                    paddingLeft: menuTheme.separatorInset,
                    paddingRight: menuTheme.separatorInset,
                    boxSizing: "border-box",
                }}>
                    <hr style={{
                        width: "100%",
                        margin: 0,
                        border: "none",
                        borderTop: `0.5px solid ${menuTheme.separatorColor}`
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
                                    Log.error(e);
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
                        this.getDisplayWindowClient().getIpcManager().handleWidgetSpecificAction(undefined, { widgetKey: widgetKey, actionName: "open-settings" });
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
                            this.getDisplayWindowClient().getIpcManager().handleWidgetSpecificAction(undefined, { widgetKey: widgetKey, actionName: text });
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
                        this.getDisplayWindowClient().getIpcManager().handleWidgetSpecificAction(undefined, { widgetKey: widgetKey, actionName: "copy-terminal-text" });
                    },
                },
                {
                    label: "Paste",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleWidgetSpecificAction(undefined, { widgetKey: widgetKey, actionName: "paste-terminal-text" });
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
                                Log.error(e);
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
                            this.getDisplayWindowClient().getIpcManager().handleWidgetSpecificAction(undefined, { widgetKey: widgetKey, actionName: "clear-graph" });
                        },
                    },
                    {
                        label: "Graph settings",
                        click: () => {
                            this.getDisplayWindowClient().getIpcManager().handleWidgetSpecificAction(undefined, { widgetKey: widgetKey, actionName: "open-graph-settings" });
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
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "execute-display", subcommand: undefined });
            },
        },
        {
            label: "Save Display (to Server)",
            accelerator: "CmdOrCtrl+s",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "save-display", subcommand: undefined });
            },
        },
        {
            label: "Save Display (to Server) As",
            accelerator: "CmdOrCtrl+s",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "save-display-as", subcommand: undefined });
            },
        },
        {
            label: "Download Display (to Local)",
            accelerator: "CmdOrCtrl+Shift+s",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "download-display", subcommand: undefined });
            },
        },

        {
            label: "Duplicate Display",
            accelerator: "CmdOrCtrl+d",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "duplicate-display", subcommand: undefined });
            },
        },
        {
            label: "Reload Display",
            accelerator: "CmdOrCtrl+r",
            click: () => {
                g_widgets1.reloadTdlFile();
                // this.getDisplayWindowClient().reloadDisplay();
                // this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "reload-display", undefined);
            },
        },
        {
            label: "Show Display Contents",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "show-tdl-file-contents", subcommand: undefined });
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
            label: "Open Display (on Server)",
            accelerator: "CmdOrCtrl+o",
            click: () => {
                this.getDisplayWindowClient().getDisplayWindowFile().openServerTdlFileInWebMode();
            },
        },
        {
            label: "Open Display (on Local)",
            accelerator: "CmdOrCtrl+o",
            click: () => {
                this.getDisplayWindowClient().getDisplayWindowFile().openLocalTdlFileInWebMode();
            },
        },
        {
            label: "Browse Display on Server",
            click: () => {
                // this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", "file-browser", ["", true]);
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "file-browser", subcommand: ["", false] });
            },
        },
        {
            label: "Create New Display",
            accelerator: "CmdOrCtrl+n",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().sendFromRendererProcess("create-blank-display-window",
                    {
                        windowId: this.getDisplayWindowClient().getWindowId(),
                    }
                );
            },
        },

        { type: "separator" },
        {
            label: "Create Static Widget",
            submenu: [
                {
                    label: "Label",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "create-widget", subcommand: "label" });
                    },
                },

                {
                    label: "Polyline",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "create-widget", subcommand: "polyline" });
                    },
                },
                {
                    label: "Arc",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "create-widget", subcommand: "arc" });
                    },
                },
                {
                    label: "Rectangle",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "create-widget", subcommand: "rectangle" });
                    },
                },
                {
                    label: "Media",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "create-widget", subcommand: "media" });
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
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "create-widget", subcommand: "text-update" });
                    },
                },
                {
                    label: "Meter",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "create-widget", subcommand: "meter" });
                    },
                },
                {
                    label: "Tank",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "create-widget", subcommand: "tank" });
                    },
                },
                {
                    label: "Thermometer",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "create-widget", subcommand: "thermometer" });
                    },
                },
                { type: "separator" },

                {
                    label: "LED",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "create-widget", subcommand: "led" });
                    },
                },
                {
                    label: "LED (Multi State)",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "create-widget", subcommand: "led-multi-state" });
                    },
                },
                {
                    label: "Byte Monitor",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "create-widget", subcommand: "byte-monitor" });
                    },
                },
                { type: "separator" },
                {
                    label: "Symbol",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "create-widget", subcommand: "symbol" });
                    },
                },
                {
                    label: "Text Symbol",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "create-widget", subcommand: "text-symbol" });
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
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "create-widget", subcommand: "text-entry" });
                    },
                },
                {
                    label: "Scaled Slider",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "create-widget", subcommand: "scaled-slider" });
                    },
                },
                {
                    label: "Spinner",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "create-widget", subcommand: "spinner" });
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
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "create-widget", subcommand: "boolean-button" });
                    },
                },
                {
                    label: "Slide Button",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "create-widget", subcommand: "slide-button" });
                    },
                },
                {
                    label: "Check Box",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "create-widget", subcommand: "check-box" });
                    },
                },
                { type: "separator" },
                {
                    label: "Choice Button",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "create-widget", subcommand: "choice-button" });
                    },
                },
                {
                    label: "Combo Box",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "create-widget", subcommand: "combo-box" });
                    },
                },
                {
                    label: "Radio Button",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "create-widget", subcommand: "radio-button" });
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
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "create-widget", subcommand: "action-button" });
                    },
                },

                {
                    label: "Embedded Display",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "create-widget", subcommand: "embedded-display" });
                    },
                },
                {
                    label: "Table",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "create-widget", subcommand: "table" });
                    },
                },
                {
                    label: "Repeater",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "create-widget", subcommand: "repeater" });
                    },
                },
                {
                    label: "Group",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "create-widget", subcommand: "group" });
                    },
                },
                {
                    label: "Binary Image",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "create-widget", subcommand: "binary-image" });
                    },
                },
                {
                    label: "Image",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "create-widget", subcommand: "image" });
                    },
                },

                { type: "separator" },

                {
                    label: "Probe",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "create-widget", subcommand: "probe" });
                    },
                },
                {
                    label: "PV Monitor",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "create-widget", subcommand: "pv-monitor" });
                    },
                },
                {
                    label: "Data Viewer",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "create-widget", subcommand: "data-viewer" });
                    },
                },
                {
                    label: "XY Plot",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "create-widget", subcommand: "xy-plot" });
                    },
                },
                {
                    label: "PV Table",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "create-widget", subcommand: "pv-table" });
                    },
                },
                {
                    label: "PV Monitor",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "create-widget", subcommand: "pv-monitor" });
                    },
                },
                {
                    label: "Calculator",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "create-widget", subcommand: "calculator" });
                    },
                },
                {
                    label: "Channel Graph",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "create-widget", subcommand: "channel-graph" });
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
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "undo", subcommand: undefined });
            },
        },
        {
            label: "Redo",
            accelerator: "CmdOrCtrl+y",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "redo", subcommand: undefined });
            },
        },
        {
            label: "Paste Widgets",
            accelerator: "CmdOrCtrl+v",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "paste-widgets", subcommand: undefined });
            },
        },
        {
            label: "Select All Widgets",
            accelerator: "CmdOrCtrl+a",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "select-all-widgets", subcommand: undefined });
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
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "toggle-title", subcommand: undefined });
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
                        this.getDisplayWindowClient().getDisplayWindowFile().downloadScreenshot();
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
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "help", subcommand: [] });
            },
        },

    ];
    private _template_editing_Widget: MenuItem[] = [
        {
            label: "Copy Widgets",
            accelerator: "CmdOrCtrl+c",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "copy-widgets", subcommand: undefined });
            },
        },
        {
            label: "Cut Widgets",
            accelerator: "CmdOrCtrl+x",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "cut-widgets", subcommand: undefined });
            },
        },
        {
            label: "Paste Widgets",
            accelerator: "CmdOrCtrl+v",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "paste-widgets", subcommand: undefined });
            },
        },
        {
            label: "Delete Widgets",
            accelerator: "delete",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "delete-widgets", subcommand: undefined });
            },
        },
        {
            label: "Duplicate Widgets",
            accelerator: "CmdOrCtrl+d",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "duplicate-widgets", subcommand: undefined });
            },
        },
        { type: "separator" },
        {
            label: "Group Widgets",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "group-widgets", subcommand: undefined });
            },
        },
        {
            label: "Ungroup Widgets",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "ungroup-widgets", subcommand: undefined });
            },
        },
        { type: "separator" },
        {
            label: "Bring/Send Widgets to",
            submenu: [
                {
                    label: "Bring to Front",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "bring-widget-to", subcommand: "front" });
                    },
                },
                {
                    label: "Send to Back",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "bring-widget-to", subcommand: "back" });
                    },
                },
                {
                    label: "Bring Forward",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "bring-widget-to", subcommand: "forward" });
                    },
                },
                {
                    label: "Send Backward",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "bring-widget-to", subcommand: "backward" });
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
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "align-widgets", subcommand: "left" });
                    },
                },
                {
                    label: "Center",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "align-widgets", subcommand: "center" });
                    },
                },
                {
                    label: "Right",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "align-widgets", subcommand: "right" });
                    },
                },
                {
                    label: "Top",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "align-widgets", subcommand: "top" });
                    },
                },
                {
                    label: "Middle",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "align-widgets", subcommand: "middle" });
                    },
                },
                {
                    label: "Bottom",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "align-widgets", subcommand: "bottom" });
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
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "distribute-widgets", subcommand: "left" });
                    },
                },
                {
                    label: "according to Center",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "distribute-widgets", subcommand: "center" });
                    },
                },
                {
                    label: "according to Right",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "distribute-widgets", subcommand: "right" });
                    },
                },
                {
                    label: "according to Top",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "distribute-widgets", subcommand: "top" });
                    },
                },
                {
                    label: "according to Middle",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "distribute-widgets", subcommand: "middle" });
                    },
                },
                {
                    label: "according to Bottom",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "distribute-widgets", subcommand: "bottom" });
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
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "match-widgets-size", subcommand: "width" });
                    },
                },
                {
                    label: "to Average Height",
                    click: () => {
                        this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "match-widgets-size", subcommand: "height" });
                    },
                },
            ],
        },
        { type: "separator" },
        {
            label: "Help",
            accelerator: "F1",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "help", subcommand: [] });
            },
        },
    ];

    private _template_operating_Canvas: MenuItem[] = [
        {
            label: "Edit Display",
            accelerator: "CmdOrCtrl+e",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "edit-display", subcommand: undefined });
            },
        },
        {
            label: "Save Display (to Server) As",
            accelerator: "CmdOrCtrl+s",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "save-display-as", subcommand: undefined });
            },
        },
        {
            label: "Download Display (to Local)",
            accelerator: "CmdOrCtrl+Shift+s",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "download-display", subcommand: undefined });
            },
        },
        {
            label: "Duplicate Display",
            accelerator: "CmdOrCtrl+d",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "duplicate-display", subcommand: undefined });
            },
        },
        {
            label: "Reload Display",
            accelerator: "CmdOrCtrl+r",
            click: () => {
                // this.getDisplayWindowClient().reloadDisplay();
                g_widgets1.reloadTdlFile();
                // this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "reload-display", undefined);
            },
        },
        {
            label: "Show Display Contents",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "show-tdl-file-contents", subcommand: undefined });
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
            label: "Open Display (on Server)",
            accelerator: "CmdOrCtrl+o",
            click: () => {
                this.getDisplayWindowClient().getDisplayWindowFile().openServerTdlFileInWebMode();

            },
        },
        {
            label: "Open Display (on Local)",
            accelerator: "CmdOrCtrl+o",
            click: () => {
                this.getDisplayWindowClient().getDisplayWindowFile().openLocalTdlFileInWebMode();

            },
        },
        {
            label: "Browse Displays on Server",
            click: () => {
                // this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", "file-browser", ["", true]);
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "file-browser", subcommand: ["", false] });
            },
        },

        {
            label: "Create New Display",
            accelerator: "CmdOrCtrl+n",
            click: () => {

                this.getDisplayWindowClient().getIpcManager().sendFromRendererProcess("create-blank-display-window",
                    {
                        windowId: this.getDisplayWindowClient().getWindowId(),
                    }
                );
            },
        },

        { type: "separator" },
        {
            label: "Copy All PV Names",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "copy-all-pv-names", subcommand: undefined });
            },
        },
        {
            label: "Copy All PV Values",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "copy-all-pv-values", subcommand: undefined });
            },
        },
        { type: "separator" },
        {
            label: "Probe",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "probe", subcommand: [""] });
            },
        },
        {
            label: "PV Table",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "pv-table", subcommand: undefined });
            },
        },
        {
            label: "PV Monitor",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "pv-monitor", subcommand: [""] });
            },
        },
        {
            label: "Data Viewer",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "data-viewer", subcommand: [] });
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
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "calculator", subcommand: undefined });
            },
        },
        {
            label: "Channel Graph",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "channel-graph", subcommand: undefined });
            },
        },
        { type: "separator" },
        {
            label: "Toggle Title",
            accelerator: "CmdOrCtrl+t",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "toggle-title", subcommand: undefined });
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
                        this.getDisplayWindowClient().getDisplayWindowFile().downloadScreenshot();
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
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "help", subcommand: [] });
            },
        },
    ];

    private _template_operating_Widget: MenuItem[] = [
        {
            label: "Edit Display",
            accelerator: "CmdOrCtrl+e",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "edit-display", subcommand: undefined });
            },
        },
        {
            label: "Save Display (to Server) As",
            accelerator: "CmdOrCtrl+s",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "save-display-as", subcommand: undefined });
            },
        },
        {
            label: "Download Display (to Local)",
            accelerator: "CmdOrCtrl+Shift+s",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "download-display", subcommand: undefined });
            },
        },
        {
            label: "Duplicate Display",
            accelerator: "CmdOrCtrl+d",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "duplicate-display", subcommand: undefined });
            },
        },
        {
            label: "Reload Display",
            accelerator: "CmdOrCtrl+r",
            click: () => {
                // this.getDisplayWindowClient().reloadDisplay();
                g_widgets1.reloadTdlFile();
                // this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, "reload-display", undefined);
            },
        },
        {
            label: "Show Display Contents",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "show-tdl-file-contents", subcommand: undefined });
            },
        },
        { type: "separator" },
        {
            label: "Open Display (on Server)",
            accelerator: "CmdOrCtrl+o",
            click: () => {
                this.getDisplayWindowClient().getDisplayWindowFile().openServerTdlFileInWebMode();
            },
        },
        {
            label: "Open Display (on Local)",
            accelerator: "CmdOrCtrl+o",
            click: () => {
                this.getDisplayWindowClient().getDisplayWindowFile().openLocalTdlFileInWebMode();
            },
        },
        {
            label: "Browse Displays on Server",
            click: () => {
                // this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", "file-browser", ["", true]);
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "file-browser", subcommand: ["", false] });
            },
        },
        {
            label: "Create New Display",
            accelerator: "CmdOrCtrl+n",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().sendFromRendererProcess("create-blank-display-window",
                    {
                        windowId: this.getDisplayWindowClient().getWindowId(),
                    }
                );
            },
        },

        { type: "separator" },
        {
            label: "Copy PV Names",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "copy-widget-pv-names", subcommand: this._widgetKeys });
            },
        },
        {
            label: "Copy PV Values",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "copy-widget-pv-values", subcommand: this._widgetKeys });
            },
        },
        { type: "separator" },
        {
            label: "Probe",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "probe", subcommand: this._widgetKeys });
            },
        },
        {
            label: "PV Table",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "pv-table", subcommand: this._widgetKeys });
            },
        },
        {
            label: "PV Monitor",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "pv-monitor", subcommand: this._widgetKeys });
            },
        },
        {
            label: "Data Viewer",
            click: () => {
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "data-viewer", subcommand: this._widgetKeys });
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
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "calculator", subcommand: undefined });
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
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "toggle-title", subcommand: undefined });
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
                        this.getDisplayWindowClient().getDisplayWindowFile().downloadScreenshot();
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
                this.getDisplayWindowClient().getIpcManager().handleContextMenuCommand(undefined, { command: "help", subcommand: [] });
            },
        },
    ];

    getWidgetKeys = () => {
        return this._widgetKeys;
    }

}
