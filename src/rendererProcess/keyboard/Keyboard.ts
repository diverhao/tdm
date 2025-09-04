import { DisplayWindowClient } from "../../mainProcess/windows/DisplayWindow/DisplayWindowClient";
import { g_widgets1 } from "../global/GlobalVariables";
import { BaseWidget } from "../widgets/BaseWidget/BaseWidget";
import { rendererWindowStatus } from "../global/Widgets";
import { Log } from "../../mainProcess/log/Log";

export class Keyboard {
    private _displayWindowClient: DisplayWindowClient;

    private _metaDown: boolean = false;
    private _shiftDown: boolean = false;
    private _ctrlDown: boolean = false;
    private _altDown: boolean = false;

    constructor(displayWindowClient: DisplayWindowClient) {
        this._displayWindowClient = displayWindowClient;
    }

    getDisplayWindowClient = () => {
        return this._displayWindowClient;
    };
    setDisplayWindowClient = (newClient: DisplayWindowClient) => {
        this._displayWindowClient = newClient;
    };

    startToListen = () => {
        window.addEventListener("keydown", this.handleKeyDown);
        window.addEventListener("keyup", this.handleKeyUp);
    };


    handleKeyDown = (event: any) => {
        Log.debug("keydown", event.key);

        if (!this.useShortcuts()) {
            return;
        }

        switch (event.key) {
            case "Escape":
                this.on_Escape_down();
                break;
            case "Meta":
                this.setMetaDown(true);
                break;
            case "Alt":
                this.setAltDown(true);
                break;
            case "Shift":
                this.setShiftDown(true);
                break;
            case "Ctrl":
                this.setCtrlDown(true);
                break;
            case "c":
                this.on_c_down();
                break;
            case "x":
                this.on_x_down();
                break;
            case "ArrowRight":
                if (g_widgets1 !== undefined && g_widgets1.isEditing() === true) {
                    const numberOfWidgetsSelected = g_widgets1.getGroupSelection2().getWidgets().size;
                    if (numberOfWidgetsSelected > 0) {
                        // prevent the scrollbar rolling, only move the widget if there is widget selected
                        event.preventDefault();
                    }
                }
                this.on_ArrowRight_down();
                break;
            case "ArrowLeft":
                if (g_widgets1 !== undefined && g_widgets1.isEditing() === true) {
                    const numberOfWidgetsSelected = g_widgets1.getGroupSelection2().getWidgets().size;
                    if (numberOfWidgetsSelected > 0) {
                        // prevent the scrollbar rolling, only move the widget if there is widget selected
                        event.preventDefault();
                    }
                }
                this.on_ArrowLeft_down();
                break;
            case "ArrowUp":
                if (g_widgets1 !== undefined && g_widgets1.isEditing() === true) {
                    const numberOfWidgetsSelected = g_widgets1.getGroupSelection2().getWidgets().size;
                    if (numberOfWidgetsSelected > 0) {
                        // prevent the scrollbar rolling, only move the widget if there is widget selected
                        event.preventDefault();
                    }
                }
                this.on_ArrowUp_down();
                break;
            case "ArrowDown":
                if (g_widgets1 !== undefined && g_widgets1.isEditing() === true) {
                    const numberOfWidgetsSelected = g_widgets1.getGroupSelection2().getWidgets().size;
                    if (numberOfWidgetsSelected > 0) {
                        // prevent the scrollbar rolling, only move the widget if there is widget selected
                        event.preventDefault();
                    }
                }
                this.on_ArrowDown_down();
                break;
            case "v":
                this.on_v_down();
                break;
            case "a":
                this.on_a_down();
                break;
            case "Backspace":
                this.on_Backspace_down();
                break;
            case "Delete":
                this.on_Delete_down();
                break;
            case "g":
                this.on_g_down();
                break;
            case "z":
                this.on_z_down();
                break;
            case "d":
                this.on_d_down();
                break;
            case "u":
                this.on_u_down();
                break;
            case "s":
                this.on_s_down();
                break;
            case "o":
                this.on_o_down();
                break;
            case "n":
                this.on_n_down();
                break;
            case "e":
                this.on_e_down();
                break;
            case "r":
                this.on_r_down();
                break;
            case "t":
                this.on_t_down();
                break;
            default:
                break;
        }
    };
    handleKeyUp = (event: any) => {
        Log.debug("keyup", event.key);
        if (!this.useShortcuts()) {
            return;
        }

        switch (event.key) {
            case "Meta":
                this.setMetaDown(false);
                break;
            case "Alt":
                this.setAltDown(false);
                break;
            case "Shift":
                this.setShiftDown(false);
                break;
            case "Ctrl":
                this.setCtrlDown(false);
                break;
            // keypress event is deprecated, we use keyup to emulate it
            case "F1":
                this.on_F1_press();
                break;
            case "F2":
                this.on_F2_press();
                break;
            case "F3":
                this.on_F3_press();
                break;
            case "F4":
                this.on_F4_press();
                break;
            case "F5":
                this.on_F5_press();
                break;
            case "F6":
                this.on_F6_press();
                break;
            case "F7":
                this.on_F7_press();
                break;
            case "F8":
                this.on_F8_press();
                break;
            default:
                break;
        }
    };

    // ---------------- on_key_down ------------------
    // Meta + c, copy widgets
    // Meta + x, cut widgets
    // Meta + v, paste widgets
    // Meta + d, duplicate widgets
    // Meta + g, group widgets
    // meta + u, ungroup widgets
    // Meta + z, undo <--
    // Meta + y, redo <--
    // Meta + a, select all widgets
    // Meta + s, save tdl
    // Meta + Shift + s, save tdl as
    // Meta + o, open tdl file
    // Meta + n, create new blank display
    // Meta + p, print 
    // Meta + e, edit display
    // Meta + r, reload display
    // Meta + u, duplicate display
    // Meta + t, toggle title
    // ArrowUp, move the widgets up by 1 pixel
    // ArrowDown, move the widgets down by 1 pixel
    // ArrowLeft, move the widgets left by 1 pixel
    // ArrowRight, move the widgets right by 1 pixel
    // Meta + ArrowUp, move the bottom edge up by 1 pixel
    // Meta + ArrowDown, move the bottom edge down by 1 pixel
    // Meta + ArrowLeft, move the right edge left by 1 pixel
    // Meta + ArrowRight, move the right edge right by 1 pixel
    // Shift + ArrowUp, move the top edge up by 1 pixel
    // Shift + ArrowDown, move the top edge down by 1 pixel
    // Shift + ArrowLeft, move the left edge left by 1 pixel
    // Shift + ArrowRight, move the left edge right by 1 pixel
    // delete, delete the selected widgets
    // backspace, delete the selected widgets

    on_c_down = () => {
        if (this.onlyMetaDown()) {
            g_widgets1.copySelectedWidgets();
        }
    };
    on_t_down = () => {
        if (this.onlyMetaDown()) {
            g_widgets1.getRoot().getDisplayWindowClient().toggleWindowTitle();
        }
    }

    on_x_down = () => {
        if (this.onlyMetaDown()) {
            g_widgets1.copySelectedWidgets();
            g_widgets1.removeSelectedWidgets(true);
            const history = this.getDisplayWindowClient().getActionHistory();
            history.registerAction();
        }
    };

    on_v_down = () => {
        if (this.onlyMetaDown()) {
            g_widgets1.pasteSelectedWidgets(true);
            const history = this.getDisplayWindowClient().getActionHistory();
            history.registerAction();
        }
    };

    on_e_down = () => {
        if (this.onlyMetaDown()) {
            if (g_widgets1.isEditing()) {
                g_widgets1.setMode(rendererWindowStatus.operating, true, true);
            } else {
                const editable = g_widgets1.getRoot().getEditable();
                if (editable) {
                    g_widgets1.setMode(rendererWindowStatus.editing, true, true);
                } else {
                    // not editable
                }
            }
        }
    }

    on_r_down = () => {
        if (this.onlyMetaDown()) {
            g_widgets1.loadTdlFile();
        }
    }

    on_a_down = () => {
        if (this.onlyMetaDown()) {
            g_widgets1.selectAllWidgets(true);
        }
    };

    on_Backspace_down = () => {
        if (this.noModifierKeyDown()) {
            g_widgets1.removeSelectedWidgets(true);
            const history = this.getDisplayWindowClient().getActionHistory();
            history.registerAction();
        }
    };

    on_Delete_down = () => {
        if (this.noModifierKeyDown()) {
            g_widgets1.removeSelectedWidgets(true);
            const history = this.getDisplayWindowClient().getActionHistory();
            history.registerAction();
        }
    };

    on_g_down = () => {
        if (this.onlyMetaDown()) {
            g_widgets1.groupSelectedWidgets();
            const history = this.getDisplayWindowClient().getActionHistory();
            history.registerAction();
        }
    };

    on_u_down = () => {
        if (this.onlyMetaDown()) {
            g_widgets1.ungroupSelectedWidgets();
            const history = this.getDisplayWindowClient().getActionHistory();
            history.registerAction();
        }
    };

    on_d_down = () => {
        if (this.onlyMetaDown()) {
            if (g_widgets1.isEditing()) {
                g_widgets1.duplicateSelectedWidgets(true);
                const history = this.getDisplayWindowClient().getActionHistory();
                history.registerAction();
            } else {
                g_widgets1.duplicateDisplay();
            }
        }
    };

    on_s_down = () => {
        if (this.onlyMetaDown()) {
            const tdlFileName = this.getDisplayWindowClient().getTdlFileName();
            this.getDisplayWindowClient().saveTdl(tdlFileName);
        } else if (this.getMetaDown() === true && this.getShiftDown() === true && this.getCtrlDown() === false && this.getAltDown() === false) {
            this.getDisplayWindowClient().saveTdl("");
        }
    };

    on_o_down = () => {
        if (this.onlyMetaDown()) {
            if (g_widgets1 !== undefined) {
                const windowStatus = g_widgets1.getRendererWindowStatus();
                this.getDisplayWindowClient().manualOpenTdl(windowStatus);
            }
        }
    };

    on_z_down = () => {
        if (this.onlyMetaDown()) {
            if (g_widgets1 !== undefined) {
                const displayWindowClient = this.getDisplayWindowClient();
                displayWindowClient.undo();
            }
        }
    };

    on_n_down = () => {
        if (this.onlyMetaDown()) {
            if (g_widgets1 !== undefined) {
                const ipcManager = this.getDisplayWindowClient().getIpcManager();
                const displayWindowId = this.getDisplayWindowClient().getWindowId();
                ipcManager.sendFromRendererProcess("create-blank-display-window", {
                    displayWindowId: displayWindowId,
                })
            }
        }
    };

    on_p_down = () => {
        if (this.onlyMetaDown()) {
            if (g_widgets1 !== undefined) {
                const ipcManager = this.getDisplayWindowClient().getIpcManager();
                const displayWindowId = this.getDisplayWindowClient().getWindowId();
                ipcManager.sendFromRendererProcess("print-display-window", {
                    displayWindowId: displayWindowId,
                })
            }
        }
    };

    on_ArrowRight_down = () => {
        let changed = false;
        if (this.noModifierKeyDown()) {
            const selectedWidgetKeys = g_widgets1.getSelectedWidgetKeys();
            if (selectedWidgetKeys.length > 0) {
                g_widgets1.moveWidgetsInXY(selectedWidgetKeys, 1, 0, true);
                changed = true;
            }
        } else if (this.onlyMetaDown()) {
            const selectedWidgetKeys = g_widgets1.getSelectedWidgetKeys();
            if (selectedWidgetKeys.length === 1) {
                const widget = g_widgets1.getWidget2(selectedWidgetKeys[0]);
                if (widget !== undefined && widget instanceof BaseWidget) {
                    const left = widget.getStyle().left;
                    const top = widget.getStyle().top;
                    const width = widget.getStyle().width + 1;
                    const height = widget.getStyle().height;
                    widget.resize(left, top, width, height, false);
                    g_widgets1.updateSidebar(true);
                    changed = true;
                }
            }
        } else if (this.onlyShiftDown()) {
            const selectedWidgetKeys = g_widgets1.getSelectedWidgetKeys();
            if (selectedWidgetKeys.length === 1) {
                const widget = g_widgets1.getWidget2(selectedWidgetKeys[0]);
                if (widget !== undefined && widget instanceof BaseWidget) {
                    const left = widget.getStyle().left + 1;
                    const top = widget.getStyle().top;
                    const width = widget.getStyle().width - 1;
                    const height = widget.getStyle().height;
                    widget.resize(left, top, width, height, false);
                    g_widgets1.updateSidebar(true);
                    changed = true;
                }
            }
        }
        if (changed) {
            const history = this.getDisplayWindowClient().getActionHistory();
            history.registerAction();
        }
    };

    on_ArrowLeft_down = () => {
        let changed = false;
        if (this.noModifierKeyDown()) {
            const selectedWidgetKeys = g_widgets1.getSelectedWidgetKeys();
            if (selectedWidgetKeys.length > 0) {
                g_widgets1.moveWidgetsInXY(selectedWidgetKeys, -1, 0, true);
                changed = true;
            }
        } else if (this.onlyMetaDown()) {
            const selectedWidgetKeys = g_widgets1.getSelectedWidgetKeys();
            if (selectedWidgetKeys.length === 1) {
                const widget = g_widgets1.getWidget2(selectedWidgetKeys[0]);
                if (widget !== undefined && widget instanceof BaseWidget) {
                    const left = widget.getStyle().left;
                    const top = widget.getStyle().top;
                    const width = widget.getStyle().width - 1;
                    const height = widget.getStyle().height;
                    widget.resize(left, top, width, height, false);
                    g_widgets1.updateSidebar(true);
                    changed = true;
                }
            }
        } else if (this.onlyShiftDown()) {
            const selectedWidgetKeys = g_widgets1.getSelectedWidgetKeys();
            if (selectedWidgetKeys.length === 1) {
                const widget = g_widgets1.getWidget2(selectedWidgetKeys[0]);
                if (widget !== undefined && widget instanceof BaseWidget) {
                    const left = widget.getStyle().left - 1;
                    const top = widget.getStyle().top;
                    const width = widget.getStyle().width + 1;
                    const height = widget.getStyle().height;
                    widget.resize(left, top, width, height, false);
                    g_widgets1.updateSidebar(true);
                    changed = true;
                }
            }
        }
        if (changed) {
            const history = this.getDisplayWindowClient().getActionHistory();
            history.registerAction();
        }
    };

    on_ArrowUp_down = () => {
        let changed: boolean = false;
        if (this.noModifierKeyDown()) {
            const selectedWidgetKeys = g_widgets1.getSelectedWidgetKeys();
            if (selectedWidgetKeys.length > 0) {
                g_widgets1.moveWidgetsInXY(selectedWidgetKeys, 0, -1, true);
                changed = true;
            }
        } else if (this.onlyMetaDown()) {
            const selectedWidgetKeys = g_widgets1.getSelectedWidgetKeys();
            if (selectedWidgetKeys.length === 1) {
                const widget = g_widgets1.getWidget2(selectedWidgetKeys[0]);
                if (widget !== undefined && widget instanceof BaseWidget) {
                    const left = widget.getStyle().left;
                    const top = widget.getStyle().top;
                    const width = widget.getStyle().width;
                    const height = widget.getStyle().height - 1;
                    widget.resize(left, top, width, height, false);
                    g_widgets1.updateSidebar(true);
                    changed = true;
                }
            }
        } else if (this.onlyShiftDown()) {
            const selectedWidgetKeys = g_widgets1.getSelectedWidgetKeys();
            if (selectedWidgetKeys.length === 1) {
                const widget = g_widgets1.getWidget2(selectedWidgetKeys[0]);
                if (widget !== undefined && widget instanceof BaseWidget) {
                    const left = widget.getStyle().left;
                    const top = widget.getStyle().top - 1;
                    const width = widget.getStyle().width;
                    const height = widget.getStyle().height + 1;
                    widget.resize(left, top, width, height, false);
                    g_widgets1.updateSidebar(true);
                    changed = true;
                }
            }
        }
        if (changed) {
            const history = this.getDisplayWindowClient().getActionHistory();
            history.registerAction();
        }
    };
    on_ArrowDown_down = () => {
        let changed = false;
        if (this.noModifierKeyDown()) {
            const selectedWidgetKeys = g_widgets1.getSelectedWidgetKeys();
            if (selectedWidgetKeys.length > 0) {
                g_widgets1.moveWidgetsInXY(selectedWidgetKeys, 0, 1, true);
                changed = true;
            }
        } else if (this.onlyMetaDown()) {
            const selectedWidgetKeys = g_widgets1.getSelectedWidgetKeys();
            if (selectedWidgetKeys.length === 1) {
                const widget = g_widgets1.getWidget2(selectedWidgetKeys[0]);
                if (widget !== undefined && widget instanceof BaseWidget) {
                    const left = widget.getStyle().left;
                    const top = widget.getStyle().top;
                    const width = widget.getStyle().width;
                    const height = widget.getStyle().height + 1;
                    widget.resize(left, top, width, height, false);
                    g_widgets1.updateSidebar(true);
                    changed = true;
                }
            }
        } else if (this.onlyShiftDown()) {
            const selectedWidgetKeys = g_widgets1.getSelectedWidgetKeys();
            if (selectedWidgetKeys.length === 1) {
                const widget = g_widgets1.getWidget2(selectedWidgetKeys[0]);
                if (widget !== undefined && widget instanceof BaseWidget) {
                    const left = widget.getStyle().left;
                    const top = widget.getStyle().top + 1;
                    const width = widget.getStyle().width;
                    const height = widget.getStyle().height - 1;
                    widget.resize(left, top, width, height, false);
                    g_widgets1.updateSidebar(true);
                    changed = true;
                }
            }
        }
        if (changed) {
            const history = this.getDisplayWindowClient().getActionHistory();
            history.registerAction();
        }
    };

    on_Escape_down = () => {
        if (g_widgets1 !== undefined && g_widgets1.isEditing() === true) {
            // the this.useShortcuts() ensures this function is invoked only when the <body /> is selected
            g_widgets1.deselectAllWidgets(true);
        }
    }

    // -------------------- F1 ... F12 press ----------------------

    /**
     * Help
     */
    on_F1_press = () => {
        if (this.noModifierKeyDown()) {
            const ipcManager = g_widgets1.getRoot().getDisplayWindowClient().getIpcManager();
            ipcManager.sendFromRendererProcess("create-utility-display-window", 
                {
                    utilityType: "Help", 
                    utilityOptions: {}
                }
            )
        }
    }

    /**
     * Bring up main window
     */
    on_F2_press = () => {
        if (this.noModifierKeyDown()) {
            const ipcManager = g_widgets1.getRoot().getDisplayWindowClient().getIpcManager();
            ipcManager.sendFromRendererProcess("bring-up-main-window", {})
        }
    }

    /**
     * place holder
     */
    on_F3_press = () => {
    }

    /**
     * place holder
     */
    on_F4_press = () => {
    }

    /**
     * place holder
     */
    on_F5_press = () => {
    }

    /**
     * Take screenshot to buffer
     */
    on_F6_press = () => {
        if (this.noModifierKeyDown()) {
            const ipcManager = g_widgets1.getRoot().getDisplayWindowClient().getIpcManager();
            const displayWindowId = g_widgets1.getRoot().getDisplayWindowClient().getWindowId();
            ipcManager.sendFromRendererProcess("take-screenshot", { displayWindowId: displayWindowId, destination: "clipboard" })
        }
    }

    /**
     * Take screenshot to file
     */
    on_F7_press = () => {
        if (this.noModifierKeyDown()) {
            const ipcManager = g_widgets1.getRoot().getDisplayWindowClient().getIpcManager();
            const displayWindowId = g_widgets1.getRoot().getDisplayWindowClient().getWindowId();
            ipcManager.sendFromRendererProcess("take-screenshot", { displayWindowId: displayWindowId, destination: "file" })
        }
    }

    /**
     * take screenshot to folder
     */
    on_F8_press = () => {
        if (this.noModifierKeyDown()) {
            const ipcManager = g_widgets1.getRoot().getDisplayWindowClient().getIpcManager();
            const displayWindowId = g_widgets1.getRoot().getDisplayWindowClient().getWindowId();
            ipcManager.sendFromRendererProcess("take-screenshot", { displayWindowId: displayWindowId, destination: "folder" })
        }
    }

    // ------------------- modifier key status ------------------

    onlyMetaDown = () => {
        if (this.getMetaDown() === true && this.getShiftDown() === false && this.getCtrlDown() === false && this.getAltDown() === false) {
            return true;
        }
        return false;
    };

    onlyControlDown = () => {
        if (this.getMetaDown() === false && this.getShiftDown() === false && this.getCtrlDown() === true && this.getAltDown() === false) {
            return true;
        }
        return false;
    };

    onlyShiftDown = () => {
        if (this.getMetaDown() === false && this.getShiftDown() === true && this.getCtrlDown() === false && this.getAltDown() === false) {
            return true;
        }
        return false;
    };

    onlyAltDown = () => {
        if (this.getMetaDown() === false && this.getShiftDown() === false && this.getCtrlDown() === false && this.getAltDown() === true) {
            return true;
        }
        return false;
    };

    noModifierKeyDown = () => {
        if (this.getMetaDown() === false && this.getShiftDown() === false && this.getCtrlDown() === false && this.getAltDown() === false) {
            return true;
        }
        return false;
    };

    // ----------------------- helpers --------------------------

    useShortcuts = (): boolean => {
        // use keyboard shortcuts defined in this class when the <body> ... </body> is active
        // otherwise, use default behavior
        if (document.activeElement?.tagName === "BODY") {
            return true;
        } else {
            return false;
        }
    };

    // ---------------------- getters and setters----------------
    getMetaDown = () => {
        return this._metaDown;
    };
    getShiftDown = () => {
        return this._shiftDown;
    };
    getCtrlDown = () => {
        return this._ctrlDown;
    };
    getAltDown = () => {
        return this._altDown;
    };
    setMetaDown = (newStatus: boolean) => {
        this._metaDown = newStatus;
    };
    setShiftDown = (newStatus: boolean) => {
        this._shiftDown = newStatus;
    };
    setAltDown = (newStatus: boolean) => {
        this._altDown = newStatus;
    };
    setCtrlDown = (newStatus: boolean) => {
        this._ctrlDown = newStatus;
    };
}
