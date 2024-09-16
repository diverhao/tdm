import * as React from "react";
import ReactDOM from "react-dom/client";

import { MainWindowProfileEditPage } from "../../../rendererProcess/mainWindow/MainWindowProfileEditPage";
import { MainWindowStartupPage } from "../../../rendererProcess/mainWindow/MainWindowStartupPage";
import { MainWindowProfileRunPage } from "../../../rendererProcess/mainWindow/MainWindowProfileRunPage";
import { IpcManagerOnMainWindow } from "./IpcManagerOnMainWindow";
import { FontsData } from "../../../rendererProcess/global/FontsData";
import { PromptOnMainWindow } from "../../../rendererProcess/helperWidgets/Prompt/PromptOnMainWindow";
// import * as path from "path";

/**
 * Represent one main window on renderer process. <br>
 *
 * This class is instantiated by `startMainWindowClient.js` invoked from `MainWindow.html`. <br>
 *
 * There is at most one main window. Unlike the `DisplayWindowClient`, which contains a `Root` object
 * represting the display contents, we simply define the main window contents inside this class. <br>
 *
 * 3 pages are shown in the main window: startup page, profiles editor, and profile run page.
 */
export class MainWindowClient {

    forceUpdate: any;
    /**
     * Profiles is obtained from the main process via the "main-window-created" event after the main window GUI is created.
     */
    private _profiles: Record<string, Record<string, any>> = {};
    private _profilesFileName: string = "";
    private _selectedProfileName: string = "";
    private _windowId: string = "";

    private _profileEditPage: MainWindowProfileEditPage | undefined = undefined;
    private _startupPage: MainWindowStartupPage | undefined = undefined;
    _profileRunPage: MainWindowProfileRunPage | undefined = undefined;

    private readonly _ipcManager: IpcManagerOnMainWindow;
    // ipcRenderer: any;
    private _processId: string = "";

    private _editingProfileName: string = "";

    _wsOpenerPort: number = -1;

    status: "start" | "edit" | "run" = "start";

    _hostname: string = "localhost";

    _prompt: PromptOnMainWindow;

    constructor(mainWindowId: string, ipcServerPort: number, hostname: string | undefined = undefined) {
        this._loadCustomFonts();
        this._windowId = mainWindowId;
        this.setProcessId(mainWindowId);

        if (hostname === undefined) {
            this._hostname = "localhost";
        } else {
            this._hostname = hostname;
        }

        this._prompt = new PromptOnMainWindow(this);

        this._ipcManager = new IpcManagerOnMainWindow(this, ipcServerPort);
        this.getIpcManager().startToListen();
        this.getIpcManager().startToListenDragAndDrop();
        window.addEventListener("mousedown", this.handleMouseDown)
    }
    // ------------------------- mouse button events --------------------------

    handleMouseDown = (event: MouseEvent) => {
        // right button down: context menu
        if (event.button === 2) {
            const menu = [];
            // if an <input /> element, show 
            if (event.target instanceof HTMLInputElement && document.activeElement instanceof HTMLInputElement) {
                menu.push("paste");
                const windowSelection = window.getSelection();
                if (windowSelection !== null && windowSelection.toString().length > 0) {
                    menu.unshift("cut");
                    menu.unshift("copy");
                }
            } else {
                const windowSelection = window.getSelection()
                if (windowSelection !== null && windowSelection.toString().length > 0) {
                    menu.unshift("copy");
                }
            }
            if (menu.length > 0) {
                this.getIpcManager().sendFromRendererProcess("main-window-show-context-menu", menu);
            }
        }
    }

    // ------------------------- profile and profiles -------------------------

    getProfilesFileName = () => {
        return this._profilesFileName;
    };

    setProfilesFileName = (newName: string) => {
        this._profilesFileName = newName;
    };

    getSelectedProfileName = () => {
        return this._selectedProfileName;
    };

    setSelectedProfileName = (newName: string) => {
        this._selectedProfileName = newName;
    };

    getSelectedProfile = () => {
        return this._profiles[this._selectedProfileName];
    };

    /**
     * Update profiles from a file. <br>
     *
     * The whole main window page is re-created and re-rendered.
     */
    updateProfilesFromFile = (newProfiles: Record<string, any>, newProfilesFileName: string) => {
        this.setProfiles(newProfiles);
        this.setProfilesFileName(newProfilesFileName);
        this.setProfileEditPage(new MainWindowProfileEditPage(this));
        this.setStartupPage(new MainWindowStartupPage(this));
        const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
        root.render(this.getElement());
    };

    // ------------------------ Element ------------------------------
    private _Element = () => {
        const [, forceUpdate] = React.useState({});
        this.forceUpdate = forceUpdate;
        return (
            <>
                {this.getStatus() === "start"
                    ? this.getStartupPage()?.getElement()
                    : this.getStatus() === "edit"
                        ? this.getProfileEditPage()?.getElement(this.getEditingProfileName())
                        : this.getProfileRunPage()?.getElement()}
            </>
        );
    };
    getElement = (): JSX.Element => {
        return <this._Element></this._Element>;
    };

    // --------------------------- custom fonts ------------------------------------
    private _loadCustomFonts = () => {
        for (let font of Object.values(FontsData.g_fonts)) {
            console.log(font)
            for (let fontFace of Object.values(font)) {
                fontFace.load().then(() => {
                    document.fonts.add(fontFace);
                }).catch((reason: any) => {
                    console.log(reason)
                });
            }
        }
    };


    // ----------------------- error page -----------------------------------

    private _ErrorPage = ({ reason }: any) => {
        return <div>Error: {reason}</div>;
    };

    getErrorPage = (reason: string) => {
        return <this._ErrorPage reason={reason}></this._ErrorPage>;
    };

    // -------------------------- getters and setters -----------------------

    getWindowId = (): string => {
        return this._windowId;
    };

    getProfiles = (): Record<string, any> => {
        return this._profiles;
    };
    setProfiles = (newProfiles: Record<string, any>) => {
        this._profiles = JSON.parse(JSON.stringify(newProfiles));
    };
    getProfileEditPage = () => {
        return this._profileEditPage;
    };
    setProfileEditPage = (newPage: MainWindowProfileEditPage) => {
        this._profileEditPage = newPage;
    };
    getStartupPage = () => {
        return this._startupPage;
    };
    setStartupPage = (newPage: MainWindowStartupPage) => {
        this._startupPage = newPage;
    };
    getProfileRunPage = () => {
        return this._profileRunPage;
    };
    setProfileRunPage = (newPage: MainWindowProfileRunPage) => {
        this._profileRunPage = newPage;
    };
    saveProfiles = () => {
        this.getIpcManager().sendFromRendererProcess("save-profiles", this.getProfiles());
    };
    getProcessId = () => {
        return this._processId;
    };
    setProcessId = (newId: string) => {
        this._processId = newId;
    };

    setWsOpenerPort = (newPort: number) => {
        this._wsOpenerPort = newPort;
    };

    getWsOpenerPort = () => {
        return this._wsOpenerPort;
    };

    getStatus = () => {
        return this.status;
    };

    setStatus = (newStatus: "edit" | "run" | "start") => {
        this.status = newStatus;
    };

    getIpcManager = () => {
        return this._ipcManager;
    };
    setEditingProfileName = (newName: string) => {
        this._editingProfileName = newName;
    };

    getEditingProfileName = () => {
        return this._editingProfileName;
    };

    // getMainProcessMode = (): "desktop" | "web" | "ssh-client" => {
    //     const userAgent = navigator.userAgent.toLowerCase();
    //     if (userAgent.indexOf(' electron/') > -1) {
    //         return "desktop"
    //     } else {
    //         return "web"
    //     }
    // }

    getMainProcessMode = (): "desktop" | "web" | "ssh-client" => {
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.indexOf(' electron/') > -1) {
            console.log("=================================", this.getHostname())
            if (this.getHostname() === "localhost") {
                return "desktop"
            } else {
                return "ssh-client";
            }
        } else {
            return "web"
        }
    }

    getHostname = () => {
        return this._hostname;
    }

    getPrompt = () => {
        return this._prompt;
    }
}


(window as any).MainWindowClientClass = MainWindowClient;