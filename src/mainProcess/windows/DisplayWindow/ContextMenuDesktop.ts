import { DisplayWindowAgent } from "./DisplayWindowAgent";
import { Log } from "../../../common/Log";

/**
 * Singleton class representing the context menu in desktop mode and ssh-client mode.<br>
 *
 * It is a main process class. The methods in it are trigger by the mouse down event on display window via IPC message. <br>
 * 
 * The context menu in web mode is handled in ContextMenuDesktop class.
 */
export class ContextMenuDesktop {
    private _displayWindowAgent: DisplayWindowAgent;
    // private _templates: Record<string, (Electron.MenuItem | Electron.MenuItemConstructorOptions)[]> = {};
    private _templates: Record<string, (Electron.MenuItem | Electron.MenuItemConstructorOptions)[]> = {};
    private _widgetKeys: string[] = [];
    constructor(displayWindwoAgent: DisplayWindowAgent) {
        this._displayWindowAgent = displayWindwoAgent;

        if (this._displayWindowAgent.isEditable() === false) {
            this._template_operating_Canvas.shift();
            this._template_operating_Widget.shift();
        }

        // context menu templates
        this._templates["editing_Canvas"] = this._template_editing_Canvas;
        this._templates["editing_Widget"] = this._template_editing_Widget;
        this._templates["operating_Canvas"] = this._template_operating_Canvas;
        this._templates["operating_Widget"] = this._template_operating_Widget;
    }
    getDisplayWindowAgent = () => {
        return this._displayWindowAgent;
    };
    getWindowAgentsManager = () => {
        return this.getDisplayWindowAgent().getWindowAgentsManager();
    };

    updateEditable = () => {
        if (this._displayWindowAgent.isEditable() === false) {
            if (this._template_operating_Canvas[0]["label"] === "Edit Display") {
                this._template_operating_Canvas.shift();
                this._template_operating_Widget.shift();
            }
        } else {
            if (this._template_operating_Canvas[0]["label"] !== "Edit Display") {
                this._template_operating_Canvas.unshift(
                    {
                        label: "Edit Display",
                        accelerator: "CmdOrCtrl+e",
                        click: () => {
                            this._displayWindowAgent.sendFromMainProcess("context-menu-command",
                                {
                                    command: "edit-display"
                                }
                            );
                        },
                    },
                );
                this._template_operating_Widget.unshift(
                    {
                        label: "Edit Display",
                        accelerator: "CmdOrCtrl+e",
                        click: () => {
                            this._displayWindowAgent.sendFromMainProcess("context-menu-command",
                                {
                                    command: "edit-display"
                                }
                            );
                        },
                    },
                );
            }
        }
    }

    updateReloadable = () => {
        if (this._displayWindowAgent.isReloadable() === false) {
            for (let ii = 0; ii < this._template_operating_Canvas.length; ii++) {
                const entry = this._template_operating_Canvas[ii];
                if (entry["label"] === "Reload Display") {
                    this._template_operating_Canvas.splice(ii, 1);
                    break;
                }
            }
            for (let ii = 0; ii < this._template_operating_Widget.length; ii++) {
                const entry = this._template_operating_Widget[ii];
                if (entry["label"] === "Reload Display") {
                    this._template_operating_Widget.splice(ii, 1);
                    break;
                }
            }
        }
    }

    getTempaltes = () => {
        // update zoom factor
        for (let template of Object.values(this._templates)) {
            for (const item of template) {
                if (item["label"]?.startsWith("Zoom")) {
                    item["label"] = `Zoom (${Math.round(this.getDisplayWindowAgent().getZoomFactor() * 100)}%)`;
                }
            }
        }
        return this._templates;
    };


    private _template_editing_Canvas: (Electron.MenuItem | Electron.MenuItemConstructorOptions)[] = [
        {
            label: "Execute Display",
            accelerator: "CmdOrCtrl+e",
            click: () => {
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command",
                    {
                        command: "execute-display"
                    }
                );
            },
        },
        {
            label: "Save Display",
            accelerator: "CmdOrCtrl+s",
            click: () => {
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command",
                    {
                        command: "save-display"
                    }
                );
            },
        },
        {
            label: "Save Display As",
            accelerator: "CmdOrCtrl+Shift+s",
            click: () => {
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command",
                    {
                        command: "save-display-as"
                    }
                );
            },
        },

        {
            label: "Duplicate Display",
            accelerator: "CmdOrCtrl+d",
            click: () => {
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command",
                    {
                        command: "duplicate-display"
                    }
                );
            },
        },
        {
            label: "Reload Display",
            accelerator: "CmdOrCtrl+r",
            click: () => {
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command",
                    {
                        command: "reload-display"
                    }
                );
            },
        },
        {
            label: "Show Display Contents",
            click: () => {
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command",
                    {
                        command: "show-tdl-file-contents"
                    }
                );
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
                const mainProcessMode = this.getDisplayWindowAgent().getWindowAgentsManager().getMainProcess().getMainProcessMode();
                const selectedProfile = this.getWindowAgentsManager().getMainProcess().getProfiles().getSelectedProfile();
                let editable = true;
                if (selectedProfile !== undefined) {
                    editable = selectedProfile.getManuallyOpenedTdlEditable()
                }
                if (mainProcessMode === "desktop") {
                    this.getDisplayWindowAgent().getWindowAgentsManager().getMainProcess().getIpcManager().handleOpenTdlFiles(undefined,
                        {
                            options: {
                                tdlFileNames: undefined, // open dialog
                                mode: editable === true ? "editing" : "operating",
                                editable: editable,
                                macros: [],
                                replaceMacros: false,
                                // currentTdlFolder?: string;
                                windowId: this.getDisplayWindowAgent().getId(),
                            }
                        }
                    );
                } else {
                    Log.error("0", "main process mode must be desktop");
                }
            },
        },
        {
            label: "Open Display with File Browser",
            click: () => {
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command",
                    {
                        command: "file-browser",
                        subcommand: ["", true]
                    }
                );
            },
        },
        {
            label: "Create New Display",
            accelerator: "CmdOrCtrl+n",
            click: () => {
                this.getDisplayWindowAgent().getWindowAgentsManager().createBlankDisplayWindow(this.getDisplayWindowAgent().getId());
            },
        },

        { type: "separator" },
        {
            label: "Create Static Widget",
            submenu: [
                {
                    label: "Label",
                    click: () => {
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command",
                            {
                                command: "create-widget",
                                subcommand: "label"
                            }
                        );
                    },
                },

                {
                    label: "Polyline",
                    click: () => {
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command",
                            {
                                command: "create-widget",
                                subcommand: "polyline"
                            }
                        );
                    },
                },
                {
                    label: "Arc",
                    click: () => {
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command",
                            {
                                command: "create-widget",
                                subcommand: "arc"
                            }
                        );
                    },
                },
                {
                    label: "Rectangle",
                    click: () => {
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command",
                            {
                                command: "create-widget",
                                subcommand: "rectangle"
                            }
                        );
                    },
                },
                {
                    label: "Media",
                    click: () => {
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command",
                            {
                                command: "create-widget",
                                subcommand: "media"
                            }
                        );
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
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command",
                            {
                                command: "create-widget",
                                subcommand: "text-update"
                            }
                        );
                    },
                },
                {
                    label: "Meter",
                    click: () => {
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command",
                            {
                                command: "create-widget",
                                subcommand: "meter"
                            }
                        );
                    },
                },
                {
                    label: "Tank",
                    click: () => {
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command",
                            {
                                command: "create-widget",
                                subcommand: "tank"
                            }
                        );
                    },
                },
                {
                    label: "Thermometer",
                    click: () => {
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command",
                            {
                                command: "create-widget",
                                subcommand: "thermometer"
                            }
                        );
                    },
                },
                { type: "separator" },

                {
                    label: "LED",
                    click: () => {
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command",
                            {
                                command: "create-widget",
                                subcommand: "led"
                            }
                        );
                    },
                },
                {
                    label: "LED (Multi State)",
                    click: () => {
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command",
                            {
                                command: "create-widget",
                                subcommand: "led-multi-state"
                            }
                        );
                    },
                },
                {
                    label: "Byte Monitor",
                    click: () => {
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command",
                            {
                                command: "create-widget",
                                subcommand: "byte-monitor"
                            }
                        );
                    },
                },
                { type: "separator" },
                {
                    label: "Symbol",
                    click: () => {
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command",
                            {
                                command: "create-widget",
                                subcommand: "symbol"
                            }
                        );
                    },
                },
                {
                    label: "Text Symbol",
                    click: () => {
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command",
                            {
                                command: "create-widget",
                                subcommand: "text-symbol"
                            }
                        );
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
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command",
                            {
                                command: "create-widget",
                                subcommand: "text-entry"
                            }
                        );
                    },
                },
                {
                    label: "Scaled Slider",
                    click: () => {
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command",
                            {
                                command: "create-widget",
                                subcommand: "scaled-slider"
                            }
                        );
                    },
                },
                {
                    label: "Spinner",
                    click: () => {
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command",
                            {
                                command: "create-widget",
                                subcommand: "spinner"
                            }
                        );
                    },
                },
                // {
                //     label: "ThumbWheel",
                //     click: () => {
                //         this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", "create-widget", "thumb-wheel");
                //     },
                // },

                { type: "separator" },

                {
                    label: "Boolean Button",
                    click: () => {
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command",
                            {
                                command: "create-widget",
                                subcommand: "boolean-button"
                            }
                        );
                    },
                },
                {
                    label: "Slide Button",
                    click: () => {
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command",
                            {
                                command: "create-widget",
                                subcommand: "slide-button"
                            }
                        );
                    },
                },
                {
                    label: "Check Box",
                    click: () => {
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command",
                            {
                                command: "create-widget",
                                subcommand: "check-box"
                            }
                        );
                    },
                },
                { type: "separator" },
                {
                    label: "Choice Button",
                    click: () => {
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command",
                            {
                                command: "create-widget",
                                subcommand: "choice-button"
                            }
                        );
                    },
                },
                {
                    label: "Combo Box",
                    click: () => {
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command",
                            {
                                command: "create-widget",
                                subcommand: "combo-box"
                            }
                        );
                    },
                },
                {
                    label: "Radio Button",
                    click: () => {
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command",
                            {
                                command: "create-widget",
                                subcommand: "radio-button"
                            }
                        );
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
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "create-widget", subcommand: "action-button" });
                    },
                },

                {
                    label: "Embedded Display",
                    click: () => {
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "create-widget", subcommand: "embedded-display" });
                    },
                },
                {
                    label: "Table",
                    click: () => {
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "create-widget", subcommand: "table" });
                    },
                },
                {
                    label: "Group",
                    click: () => {
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "create-widget", subcommand: "group" });
                    },
                },
                {
                    label: "Binary Image",
                    click: () => {
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "create-widget", subcommand: "binary-image" });
                    },
                },
                {
                    label: "Image",
                    click: () => {
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "create-widget", subcommand: "image" });
                    },
                },

                { type: "separator" },

                {
                    label: "Probe",
                    click: () => {
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "create-widget", subcommand: "probe" });
                    },
                },
                {
                    label: "Data Viewer",
                    click: () => {
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "create-widget", subcommand: "data-viewer" });
                    },
                },
                {
                    label: "PV Monitor",
                    click: () => {
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "create-widget", subcommand: "pv-monitor" });
                    },
                },
                {
                    label: "File Browser",
                    click: () => {
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "create-widget", subcommand: "file-browser" });
                    },
                },
                {
                    label: "XY Plot",
                    click: () => {
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "create-widget", subcommand: "xy-plot" });
                    },
                },
                {
                    label: "PV Table",
                    click: () => {
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "create-widget", subcommand: "pv-table" });
                    },
                },
                // {
                //     label: "Terminal",
                //     click: () => {
                //         this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", "create-widget", "terminal");
                //     },
                // },
                {
                    label: "Calculator",
                    click: () => {
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "create-widget", subcommand: "calculator" });
                    },
                },
                {
                    label: "Channel Graph",
                    click: () => {
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "create-widget", subcommand: "channel-graph" });
                    },
                },
                {
                    label: "Seq Graph",
                    click: () => {
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "create-widget", subcommand: "seq-graph" });
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
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "undo" });
            },
        },
        {
            label: "Redo",
            accelerator: "CmdOrCtrl+y",
            click: () => {
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "redo" });
            },
        },
        {
            label: "Paste Widgets",
            accelerator: "CmdOrCtrl+v",
            click: () => {
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "paste-widgets" });
            },
        },
        {
            label: "Select All Widgets",
            accelerator: "CmdOrCtrl+a",
            click: () => {
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "select-all-widgets" });
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
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "toggle-title" });
            },
        },
        {
            label: "Bring Up Main Winodw",
            accelerator: "F2",
            click: () => {
                const windowAgent = this.getDisplayWindowAgent();
                windowAgent.sendFromMainProcess("bounce-back", {
                    eventName: "bring-up-main-window",
                    data: []
                })
            },
        },
        {
            label: "Zoom",
            submenu: [
                {
                    label: "500%",
                    click: () => {
                        this.getDisplayWindowAgent().setZoomFactor(5);
                    },
                },
                {
                    label: "250%",
                    click: () => {
                        this.getDisplayWindowAgent().setZoomFactor(2.5);
                    },
                },
                {
                    label: "150%",
                    click: () => {
                        this.getDisplayWindowAgent().setZoomFactor(1.5);
                    },
                },
                {
                    label: "100%",
                    click: () => {
                        this.getDisplayWindowAgent().setZoomFactor(1);
                    },
                },
                {
                    label: "75%",
                    click: () => {
                        this.getDisplayWindowAgent().setZoomFactor(0.75);
                    },
                },
                {
                    label: "50%",
                    click: () => {
                        this.getDisplayWindowAgent().setZoomFactor(0.5);
                    },
                },
                {
                    label: "25%",
                    click: () => {
                        this.getDisplayWindowAgent().setZoomFactor(0.25);
                    },
                },
            ],
        },
        { type: "separator" },
        {
            label: "Take Screenshot",
            submenu: [
                {
                    label: "Save to Image File",
                    accelerator: "F7",
                    click: () => {
                        this.getDisplayWindowAgent().takeScreenshot();
                    },
                },
                {
                    label: "Copy Clipboard as Image",
                    accelerator: "F6",
                    click: () => {
                        this.getDisplayWindowAgent().takeScreenshotToClipboard();
                    },
                },
                {
                    label: "Auto Save to Folder",
                    accelerator: "F8",
                    click: () => {
                        this.getDisplayWindowAgent().takeScreenshotToFolder();
                    },
                },
                {
                    label: "Save to pdf File",
                    click: () => {
                        this.getDisplayWindowAgent().printToPdf();
                    },
                },
                {
                    label: "Start to record video",
                    click: () => {
                        this.getDisplayWindowAgent().startRecordVideo();
                    },
                },
            ],
        },
        {
            label: "Print",
            accelerator: "CmdOrCtrl+p",
            click: () => {
                this.getDisplayWindowAgent().print();
            },
        },
        {
            label: "Help",
            accelerator: "F1",
            click: () => {
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "help" });
            },
        },

    ];
    private _template_editing_Widget: (Electron.MenuItem | Electron.MenuItemConstructorOptions)[] = [
        {
            label: "Copy Widgets",
            accelerator: "CmdOrCtrl+c",
            click: () => {
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "copy-widgets" });
            },
        },
        {
            label: "Cut Widgets",
            accelerator: "CmdOrCtrl+x",
            click: () => {
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "cut-widgets" });
            },
        },
        {
            label: "Paste Widgets",
            accelerator: "CmdOrCtrl+v",
            click: () => {
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "paste-widgets" });
            },
        },
        {
            label: "Delete Widgets",
            accelerator: "delete",
            click: () => {
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "delete-widgets" });
            },
        },
        {
            label: "Duplicate Widgets",
            accelerator: "CmdOrCtrl+d",
            click: () => {
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "duplicate-widgets" });
            },
        },
        { type: "separator" },
        {
            label: "Group Widgets",
            click: () => {
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "group-widgets" });
            },
        },
        {
            label: "Ungroup Widgets",
            click: () => {
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "ungroup-widgets" });
            },
        },
        { type: "separator" },
        {
            label: "Bring/Send Widgets to",
            submenu: [
                {
                    label: "Bring to Front",
                    click: () => {
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "bring-widgets-to", subcommand: "front" });
                    },
                },
                {
                    label: "Send to Back",
                    click: () => {
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "bring-widgets-to", subcommand: "back" });
                    },
                },
                {
                    label: "Bring Forward",
                    click: () => {
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "bring-widgets-to", subcommand: "forward" });
                    },
                },
                {
                    label: "Send Backward",
                    click: () => {
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "bring-widgets-to", subcommand: "backward" });
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
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "align-widgets", subcommand: "left" });
                    },
                },
                {
                    label: "Center",
                    click: () => {
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "align-widgets", subcommand: "center" });
                    },
                },
                {
                    label: "Right",
                    click: () => {
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "align-widgets", subcommand: "right" });
                    },
                },
                {
                    label: "Top",
                    click: () => {
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "align-widgets", subcommand: "top" });
                    },
                },
                {
                    label: "Middle",
                    click: () => {
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "align-widgets", subcommand: "middle" });
                    },
                },
                {
                    label: "Bottom",
                    click: () => {
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "align-widgets", subcommand: "bottom" });
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
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "distribute-widgets", subcommand: "left" });
                    },
                },
                {
                    label: "according to Center",
                    click: () => {
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "distribute-widgets", subcommand: "center" });
                    },
                },
                {
                    label: "according to Right",
                    click: () => {
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "distribute-widgets", subcommand: "right" });
                    },
                },
                {
                    label: "according to Top",
                    click: () => {
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "distribute-widgets", subcommand: "top" });
                    },
                },
                {
                    label: "according to Middle",
                    click: () => {
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "distribute-widgets", subcommand: "middle" });
                    },
                },
                {
                    label: "according to Bottom",
                    click: () => {
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "distribute-widgets", subcommand: "bottom" });
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
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "match-widgets-size", subcommand: "width" });
                    },
                },
                {
                    label: "to Average Height",
                    click: () => {
                        this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "match-widgets-size", subcommand: "height" });
                    },
                },
            ],
        },
        { type: "separator" },
        {
            label: "Help",
            accelerator: "F1",
            click: () => {
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "help" });
            },
        },
    ];

    private _template_operating_Canvas: (Electron.MenuItem | Electron.MenuItemConstructorOptions)[] = [
        {
            label: "Edit Display",
            accelerator: "CmdOrCtrl+e",
            click: () => {
                this._displayWindowAgent.sendFromMainProcess("context-menu-command", { command: "edit-display" });
            },
        },
        {
            label: "Save Display As",
            accelerator: "CmdOrCtrl+Shift+s",
            click: () => {
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "save-display-as" });
            },
        },
        {
            label: "Duplicate Display",
            accelerator: "CmdOrCtrl+d",
            click: () => {
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "duplicate-display" });
            },
        },
        {
            label: "Reload Display",
            accelerator: "CmdOrCtrl+r",
            click: () => {
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "reload-display" });
            },
        },
        {
            label: "Show Display Contents",
            click: () => {
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "show-tdl-file-contents" });
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
                const mainProcessMode = this.getDisplayWindowAgent().getWindowAgentsManager().getMainProcess().getMainProcessMode();
                const selectedProfile = this.getWindowAgentsManager().getMainProcess().getProfiles().getSelectedProfile();
                let editable = true;
                if (selectedProfile !== undefined) {
                    editable = selectedProfile.getManuallyOpenedTdlEditable()
                }
                if (mainProcessMode === "desktop") {
                    this.getDisplayWindowAgent().getWindowAgentsManager().getMainProcess().getIpcManager().handleOpenTdlFiles(undefined,
                        {
                            options: {
                                tdlFileNames: undefined, // open dialog
                                mode: "operating",
                                editable: editable,
                                macros: [],
                                replaceMacros: false,
                                // currentTdlFolder?: string;
                                windowId: this.getDisplayWindowAgent().getId(),
                            }
                        }
                    );
                } else {
                    Log.error("0", "main process mode must be desktop");
                }
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
            label: "Open Display with File Browser",
            click: () => {
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "file-browser", subcommand: ["", true] });
            },
        },
        {
            label: "Create New Display",
            accelerator: "CmdOrCtrl+n",
            click: () => {
                // this.getDisplayWindowAgent().getWindowAgentsManager().createBlankDisplayWindow(this.getDisplayWindowAgent().getId());
                const windowAgent = this.getDisplayWindowAgent();
                windowAgent.sendFromMainProcess("bounce-back", {
                    eventName: "create-blank-display-window",
                    data: {
                        windowId: windowAgent.getId(),
                    }
                })
            },
        },

        { type: "separator" },
        {
            label: "Copy All PV Names",
            click: () => {
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "copy-all-pv-names" });
            },
        },
        {
            label: "Copy All PV Values",
            click: () => {
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "copy-all-pv-values" });
            },
        },
        { type: "separator" },
        {
            label: "Probe",
            click: () => {
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "probe", subcommand: [""] });
            },
        },
        {
            label: "PV Table",
            click: () => {
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "pv-table", subcommand: undefined });
            },
        },
        {
            label: "PV Monitor",
            click: () => {
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "pv-monitor", subcommand: [""] });
            },
        },
        {
            label: "Data Viewer",
            click: () => {
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "data-viewer", subcommand: [] });
            },
        },
        // {
        //     label: "Terminal",
        //     click: () => {
        //         this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", "terminal");
        //     },
        // },
        {
            label: "Calculator",
            click: () => {
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "calculator" });
            },
        },
        {
            label: "Channel Graph",
            click: () => {
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "channel-graph", subcommand: [""] });
            },
        },
        {
            label: "Seq Graph",
            click: () => {
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "seq-graph" });
            },
        },
        { type: "separator" },
        {
            label: "Toggle Title",
            accelerator: "CmdOrCtrl+t",
            click: () => {
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "toggle-title" });
            },
        },
        {
            label: "Bring Up Main Window",
            accelerator: "F2",
            click: () => {
                const windowAgent = this.getDisplayWindowAgent();
                windowAgent.sendFromMainProcess("bounce-back", {
                    eventName: "bring-up-main-window",
                    data: []
                })

            },
        },
        {
            label: "Zoom",
            submenu: [
                {
                    label: "200%",
                    click: () => {
                        this.getDisplayWindowAgent().setZoomFactor(2);
                    },
                },
                {
                    label: "150%",
                    click: () => {
                        this.getDisplayWindowAgent().setZoomFactor(1.5);
                    },
                },
                {
                    label: "125%",
                    click: () => {
                        this.getDisplayWindowAgent().setZoomFactor(1.25);
                    },
                },
                {
                    label: "100%",
                    click: () => {
                        this.getDisplayWindowAgent().setZoomFactor(1);
                    },
                },
                {
                    label: "75%",
                    click: () => {
                        this.getDisplayWindowAgent().setZoomFactor(0.75);
                    },
                },
                {
                    label: "50%",
                    click: () => {
                        this.getDisplayWindowAgent().setZoomFactor(0.5);
                    },
                },
                {
                    label: "25%",
                    click: () => {
                        this.getDisplayWindowAgent().setZoomFactor(0.25);
                    },
                },
            ],
        },
        { type: "separator" },
        {
            label: "Take Screenshot",
            submenu: [
                {
                    label: "Save to Image File",
                    accelerator: "F7",
                    click: () => {
                        this.getDisplayWindowAgent().takeScreenshot();
                    },
                },
                {
                    label: "Copy to Clipboard as Image",
                    accelerator: "F6",
                    click: () => {
                        this.getDisplayWindowAgent().takeScreenshotToClipboard();
                    },
                },
                {
                    label: "Auto Save to Folder",
                    accelerator: "F8",
                    click: () => {
                        this.getDisplayWindowAgent().takeScreenshotToFolder();
                    },
                },
                {
                    label: "Save to pdf File",
                    click: () => {
                        this.getDisplayWindowAgent().printToPdf();
                    },
                },
                {
                    label: "Start to record video",
                    click: () => {
                        this.getDisplayWindowAgent().startRecordVideo();
                    },
                },
            ],
        },
        {
            label: "Print",
            accelerator: "CmdOrCtrl+p",
            click: () => {
                this.getDisplayWindowAgent().print();
            },
        },
        {
            label: "Help",
            accelerator: "F1",
            click: () => {
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "help" });
            },
        },
    ];

    private _template_operating_Widget: (Electron.MenuItem | Electron.MenuItemConstructorOptions)[] = [
        {
            label: "Edit Display",
            accelerator: "CmdOrCtrl+e",
            click: () => {
                this._displayWindowAgent.sendFromMainProcess("context-menu-command", { command: "edit-display" });
            },
        },
        {
            label: "Save Display As",
            accelerator: "CmdOrCtrl+Shift+s",
            click: () => {
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "save-display-as" });
            },
        },
        {
            label: "Duplicate Display",
            accelerator: "CmdOrCtrl+d",
            click: () => {
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "duplicate-display" });
            },
        },
        {
            label: "Reload Display",
            accelerator: "CmdOrCtrl+r",
            click: () => {
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "reload-display" });
            },
        },
        {
            label: "Show Display Contents",
            click: () => {
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "show-tdl-file-contents" });
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
                const mainProcessMode = this.getDisplayWindowAgent().getWindowAgentsManager().getMainProcess().getMainProcessMode();
                const selectedProfile = this.getWindowAgentsManager().getMainProcess().getProfiles().getSelectedProfile();
                let editable = true;
                if (selectedProfile !== undefined) {
                    editable = selectedProfile.getManuallyOpenedTdlEditable()
                }
                if (mainProcessMode === "desktop") {
                    this.getDisplayWindowAgent().getWindowAgentsManager().getMainProcess().getIpcManager().handleOpenTdlFiles(undefined,
                        {
                            options: {
                                tdlFileNames: undefined, // open dialog
                                mode: "editing",
                                editable: editable,
                                macros: [],
                                replaceMacros: false,
                                // currentTdlFolder?: string;
                                windowId: this.getDisplayWindowAgent().getId(),
                            }
                        }
                    );
                } else {
                    Log.error("0", "main process mode must be desktop");
                }
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
            label: "Open Display with File Browser",
            click: () => {
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "file-browser", subcommand: ["", true] });
            },
        },
        {
            label: "Create New Display",
            accelerator: "CmdOrCtrl+n",
            click: () => {
                this.getDisplayWindowAgent().getWindowAgentsManager().createBlankDisplayWindow(this.getDisplayWindowAgent().getId());
            },
        },

        { type: "separator" },
        {
            label: "Copy PV Names",
            click: () => {
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "copy-widget-pv-names", subcommand: this._widgetKeys });
            },
        },
        {
            label: "Copy PV Values",
            click: () => {
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "copy-widget-pv-values", subcommand: this._widgetKeys });
            },
        },
        { type: "separator" },
        {
            label: "Probe",
            click: () => {
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "probe", subcommand: this._widgetKeys });
            },
        },
        {
            label: "PV Table",
            click: () => {
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "pv-table", subcommand: this._widgetKeys });
            },
        },
        {
            label: "PV Monitor",
            click: () => {
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "pv-monitor", subcommand: [""] });
            },
        },
        {
            label: "Data Viewer",
            click: () => {
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "data-viewer", subcommand: this._widgetKeys });
            },
        },
        // {
        //     label: "Terminal",
        //     click: () => {
        //         this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", "terminal");
        //     },
        // },
        {
            label: "Calculator",
            click: () => {
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "calculator" });
            },
        },
        {
            label: "Channel Graph",
            click: () => {
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "channel-graph", subcommand: this._widgetKeys });
            },
        },
        {
            label: "Seq Graph",
            click: () => {
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "seq-graph" });
            },
        },

        { type: "separator" },
        {
            label: "Toggle Title",
            accelerator: "CmdOrCtrl+t",
            click: () => {
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "toggle-title" });
            },
        },
        {
            label: "Bring Up Main Winodw",
            accelerator: "F2",
            click: () => {
                const windowAgent = this.getDisplayWindowAgent();
                windowAgent.sendFromMainProcess("bounce-back", {
                    eventName: "bring-up-main-window",
                    data: []
                })

            },
        },
        {
            label: "Zoom",
            submenu: [
                {
                    label: "200%",
                    click: () => {
                        this.getDisplayWindowAgent().setZoomFactor(2);
                    },
                },
                {
                    label: "150%",
                    click: () => {
                        this.getDisplayWindowAgent().setZoomFactor(1.5);
                    },
                },
                {
                    label: "125%",
                    click: () => {
                        this.getDisplayWindowAgent().setZoomFactor(1.25);
                    },
                },
                {
                    label: "100%",
                    click: () => {
                        this.getDisplayWindowAgent().setZoomFactor(1);
                    },
                },
                {
                    label: "75%",
                    click: () => {
                        this.getDisplayWindowAgent().setZoomFactor(0.75);
                    },
                },
                {
                    label: "50%",
                    click: () => {
                        this.getDisplayWindowAgent().setZoomFactor(0.5);
                    },
                },
                {
                    label: "25%",
                    click: () => {
                        this.getDisplayWindowAgent().setZoomFactor(0.25);
                    },
                },
            ],
        },

        { type: "separator" },
        {
            label: "Take Screenshot",
            submenu: [
                {
                    label: "Save to Image File",
                    accelerator: "F7",
                    click: () => {
                        this.getDisplayWindowAgent().takeScreenshot();
                    },
                },
                {
                    label: "Copy to Clipboard as Image",
                    accelerator: "F6",
                    click: () => {
                        this.getDisplayWindowAgent().takeScreenshotToClipboard();
                    },
                },
                {
                    label: "Auto Save to Folder",
                    accelerator: "F8",
                    click: () => {
                        this.getDisplayWindowAgent().takeScreenshotToFolder();
                    },
                },
                {
                    label: "Save to pdf File",
                    click: () => {
                        this.getDisplayWindowAgent().printToPdf();
                    },
                },
                {
                    label: "Start to record video",
                    click: () => {
                        this.getDisplayWindowAgent().startRecordVideo();
                    },
                },
            ],
        },
        {
            label: "Print",
            accelerator: "CmdOrCtrl+p",
            click: () => {
                this.getDisplayWindowAgent().print();
            },
        },
        {
            label: "Help",
            accelerator: "F1",
            click: () => {
                this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "help" });
            },
        },
    ];

    // widgetKeys: in editing mode: selected widgetKeys or "Canvas"
    //             in operating mode: the widgetKey that the right button is clicked on or "Canvas"
    getTemplate = (mode: string, widgetKeys: string[], options: Record<string, any>) => {
        this._widgetKeys.length = 0
        for (let widgetKey of widgetKeys) {
            this._widgetKeys.push(widgetKey);
        }

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

        if (this.getWindowAgentsManager().getMainProcess().getMainProcessMode() === "ssh-client") {
            this.removeItemsForAllMenus(["Open Display", "Open Display with File Browser"])
        }

        const name = `${mode}_${location}`;

        if (widgetSpecificItems === undefined) {
            return this.getTempaltes()[name];
        } else {
            return [...(widgetSpecificItems as Electron.MenuItemConstructorOptions[]), ...this.getTempaltes()[name]];
        }
    };

    removeItemsForWidget = (itemNames: string[]) => {
        for (let ii = this._template_operating_Widget.length - 1; ii >= 0; ii--) {
            const entry = this._template_operating_Widget[ii];
            for (let itemName of itemNames) {
                if ((entry["label"] === itemName)) {
                    this._template_operating_Widget.splice(ii, 1);
                }
            }
        }
    }

    removeItemsForAllMenus = (itemNames: string[]) => {
        for (let template of [this._template_editing_Canvas, this._template_editing_Widget, this._template_operating_Canvas, this._template_operating_Widget]) {
            for (let ii = template.length - 1; ii >= 0; ii--) {
                const entry = template[ii];
                for (let itemName of itemNames) {
                    if ((entry["label"] === itemName)) {
                        template.splice(ii, 1);
                    }
                }
            }
        }
    }

    resolveWidgetSpecificItems = (widgetKey: string, options: Record<string, any>): (Electron.MenuItem | Electron.MenuItemConstructorOptions)[] => {

        let result: (Electron.MenuItem | Electron.MenuItemConstructorOptions)[] = [];
        type type_role = ('undo' | 'redo' | 'cut' | 'copy' | 'paste' | 'pasteAndMatchStyle' | 'delete' | 'selectAll' | 'reload' | 'forceReload' | 'toggleDevTools' | 'resetZoom' | 'zoomIn' | 'zoomOut' | 'toggleSpellChecker' | 'togglefullscreen' | 'window' | 'minimize' | 'close' | 'help' | 'about' | 'services' | 'hide' | 'hideOthers' | 'unhide' | 'quit' | 'startSpeaking' | 'stopSpeaking' | 'zoom' | 'front' | 'appMenu' | 'fileMenu' | 'editMenu' | 'viewMenu' | 'shareMenu' | 'recentDocuments' | 'toggleTabBar' | 'selectNextTab' | 'selectPreviousTab' | 'showAllTabs' | 'mergeAllWindows' | 'clearRecentDocuments' | 'moveTabToNewWindow' | 'windowMenu');
        type type_type = ('normal' | 'separator' | 'submenu' | 'checkbox' | 'radio');


        // these utility windows should never be edited
        // if their editable bit in DisplayWindowAgent is true, then they should be able to "Save" in operating mode
        // The purpose of this "Save" is updating the settings 
        if (this.getDisplayWindowAgent().isUtilityWindow() &&
            (widgetKey.includes("DataViewer") || widgetKey.includes("Probe") || widgetKey.includes("ChannelGraph") || widgetKey.includes("PvTable") || widgetKey.includes("PvMonitor") || widgetKey.includes("SeqGraph"))
        ) {
            // these utility windows should never be editable
            this.removeItemsForWidget(["Edit Display"]);
            // add Save even in operating mode
            let alreadyHasSaveDisplay = false;
            for (const entry of this._template_operating_Widget) {
                if (entry.label === "Save Display") {
                    alreadyHasSaveDisplay = true;
                    break;
                }
            }

            if (alreadyHasSaveDisplay === false && this.getDisplayWindowAgent().isEditable()) {
                this._template_operating_Widget.unshift(
                    {
                        label: "Save Display",
                        accelerator: "CmdOrCtrl+s",
                        click: () => {
                            this.getDisplayWindowAgent().sendFromMainProcess("context-menu-command", { command: "save-display" });
                        },
                    },
                );
            }
        }

        // remove items for utility window widgets
        if (widgetKey.includes("LogViewer")
            || widgetKey.includes("CaSnooper")
            || widgetKey.includes("Casw")
            || widgetKey.includes("Calculator")
            || widgetKey.includes("ProfilesViewer")
            || widgetKey.includes("Help")
            || widgetKey.includes("FileConverter")
            || widgetKey.includes("Terminal")) {
            // they have not state, the "Save Display As" is removed
            this.removeItemsForWidget(["Reload Display", "Save Display As", "Duplicate Display", "Copy PV Names", "Copy PV Values"]);
        } else if (widgetKey.includes("PvMonitor")
            || widgetKey.includes("TextEditor")) {
            // they are stateful, we should be able to save them
            this.removeItemsForWidget(["Reload Display", "Duplicate Display", "Copy PV Names", "Copy PV Values"]);
        }

        // <input /> or <textarea /> element, show copy/paste/cut/redo/undo if they are focused
        const inputElementFocused = options["inputElementFocused"];
        if (inputElementFocused !== undefined && inputElementFocused === true) {
            result.push(...[
                {
                    label: "Copy",
                    role: "copy" as type_role,
                    accelerator: "CmdOrCtrl+c",
                    click: () => {
                    },
                },
                {
                    label: "Paste",
                    role: "paste" as type_role,
                    accelerator: "CmdOrCtrl+v",
                    click: () => {
                    },
                },
                {
                    label: "Cut",
                    role: "cut" as type_role,
                    accelerator: "CmdOrCtrl+x",
                    click: () => {
                    },
                },
                {
                    label: "Undo",
                    role: "undo" as type_role,
                    accelerator: "CmdOrCtrl+z",
                    click: () => {
                    },
                },
                {
                    label: "Redo",
                    role: "redo" as type_role,
                    accelerator: "CmdOrCtrl+Shift+z",
                    click: () => {
                    },
                },
                { type: "separator" as type_type },
            ])

        }

        if (widgetKey.includes("ScaledSlider") || widgetKey.includes("Spinner")) {
            result.push(...[
                {
                    label: "Settings",
                    click: () => {
                        this.getDisplayWindowAgent().sendFromMainProcess("widget-specific-action", { widgetKey: widgetKey, actionName: "open-settings" });
                    },
                },
                { type: "separator" as type_type },
            ]);
        } else if (options["contextMenuTexts"] !== undefined && (widgetKey.includes("LogViewer") || widgetKey.includes("PvMonitor") || widgetKey.includes("CaSnooper") || widgetKey.includes("Casw") || widgetKey.includes("FileConverter"))) {
            // Table: save data, copy data, ...
            if (options["contextMenuTexts"] !== undefined) {
                const contextMenuTexts = options["contextMenuTexts"];
                for (let text of contextMenuTexts) {
                    result.push({
                        label: text,
                        click: () => {
                            this.getDisplayWindowAgent().sendFromMainProcess("widget-specific-action", { widgetKey: widgetKey, actionName: text });
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
                        this.getDisplayWindowAgent().sendFromMainProcess("widget-specific-action", { widgetKey: widgetKey, actionName: "copy-terminal-text" });
                    },
                },
                {
                    label: "Paste",
                    click: () => {
                        this.getDisplayWindowAgent().sendFromMainProcess("widget-specific-action", { widgetKey: widgetKey, actionName: "paste-terminal-text" });
                    },
                },
                { type: "separator" as type_type },
            ]);
        } else if (widgetKey.includes("Help") || widgetKey.startsWith("TdlViewer") || widgetKey.startsWith("TextEditor") || widgetKey.startsWith("ProfilesViewer") || widgetKey.startsWith("LogViewer") || widgetKey.startsWith("CaSnooper") || widgetKey.startsWith("Casw") || widgetKey.startsWith("Canvas") || widgetKey.startsWith("SeqGraph")) {
            // non-input area of widgets, we want to copy the selected text
            // it does not conflict with the above Table data if (...), these two if are on different area in the widget
            // show only when there is text selected
            const textSelected = options["textSelected"];
            const selectedText = options["selectedText"];
            if (textSelected !== undefined && textSelected === true && typeof selectedText === "string") {
                result.push(...[
                    {
                        label: "Copy",
                        accelerator: "CmdOrCtrl+c",
                        role: "copy" as type_role,
                        click: () => {
                        },
                    },
                    { type: "separator" as type_type },
                ]);
            }
        } else if (widgetKey.includes("ChannelGraph")) {
            const showChannelGraphOptions = options["showChannelGraphOptions"];
            if (showChannelGraphOptions !== undefined && showChannelGraphOptions === true) {
                result.push(...[
                    {
                        label: "Clear graph",
                        click: () => {
                            this._displayWindowAgent.sendFromMainProcess("widget-specific-action", { widgetKey: widgetKey, actionName: "clear-graph" });
                        },
                    },
                    {
                        label: "Graph settings",
                        click: () => {
                            this._displayWindowAgent.sendFromMainProcess("widget-specific-action", { widgetKey: widgetKey, actionName: "show-settings" });
                        },
                    },
                    { type: "separator" as type_type },
                ]);
            }

        }
        return result;
    };

    // getMainProcessId = () => {
    //     return this.getDisplayWindowAgent().getWindowAgentsManager().getMainProcess().getProcessId();
    // }

    getWidgetKeys = () => {
        return this._widgetKeys;
    }
}
