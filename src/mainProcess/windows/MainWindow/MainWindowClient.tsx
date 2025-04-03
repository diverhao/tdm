import * as React from "react";
import ReactDOM from "react-dom/client";

import { MainWindowProfileEditPage } from "../../../rendererProcess/mainWindow/MainWindowProfileEditPage";
import { MainWindowStartupPage } from "../../../rendererProcess/mainWindow/MainWindowStartupPage";
import { MainWindowProfileRunPage } from "../../../rendererProcess/mainWindow/MainWindowProfileRunPage";
import { IpcManagerOnMainWindow } from "./IpcManagerOnMainWindow";
import { FontsData } from "../../../rendererProcess/global/FontsData";
import { PromptOnMainWindow } from "../../../rendererProcess/helperWidgets/Prompt/PromptOnMainWindow";
import { Log } from "../../log/Log";


export enum mainWindowState {
    "start",
    "edit",
    "run",
}

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
    private _editingProfileName: string = "";


    // 3 pages: start, edit, and run
    private _profileEditPage: MainWindowProfileEditPage | undefined = undefined;
    private _startupPage: MainWindowStartupPage | undefined = undefined;
    private _profileRunPage: MainWindowProfileRunPage | undefined = undefined;

    private _logFileName: string = "";

    private readonly _ipcManager: IpcManagerOnMainWindow;
    private _processId: string = "";
    private _windowId: string = "";

    private _wsOpenerPort: number = -1;

    private _state: mainWindowState = mainWindowState.start;

    private _hostname: string = "localhost";

    private _prompt: PromptOnMainWindow;

    private _envDefault: Record<string, any> = {};
    private _envOs: Record<string, any> = {};

    constructor(mainWindowId: string, ipcServerPort: number, hostname: string | undefined = undefined) {
        this._loadCustomFonts();
        this._windowId = mainWindowId;
        this.setProcessId(mainWindowId);
        this._prompt = new PromptOnMainWindow(this);

        if (hostname !== undefined) {
            this._hostname = hostname;
        }

        this._ipcManager = new IpcManagerOnMainWindow(this, ipcServerPort);
        this.getIpcManager().startToListen();
        this.getIpcManager().startToListenDragAndDrop();

        window.addEventListener("mousedown", this.handleMouseDown)
    }

    // ------------------------- methods --------------------------

    /**
     * right button down event listener: invoke copy/cut/paste context menu
     */
    private handleMouseDown = (event: MouseEvent) => {
        if (event.button === 2) {
            Log.debug("Context menu invoked");
            const menu = [];
            // if an <input /> element, show paste
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
            } else {
                // don't show context menu
            }
        } else {
            // do nothing
        }
    }

    /**
     * load fonts that come with TDM, these fonts are guaranteed to be avaiable over different platforms
     */
    private _loadCustomFonts = () => {
        for (let font of Object.values(FontsData.g_fonts)) {
            for (let fontFace of Object.values(font)) {
                fontFace.load().then((ff) => {
                    Log.debug("Loading TDM local font --", ff.family);
                    document.fonts.add(fontFace);
                }).catch((reason: any) => {
                    Log.error(`${reason}`)
                });
            }
        }
    };

    // ------------------------ Element ------------------------------
    private _Element = () => {
        const [, forceUpdate] = React.useState({});
        this.forceUpdate = forceUpdate;
        return (
            <>
                {this.getState() === mainWindowState.start
                    ? this.getStartupPage()?.getElement()
                    : this.getState() === mainWindowState.edit
                        ? this.getProfileEditPage()?.getElement(this.getEditingProfileName())
                        : this.getProfileRunPage()?.getElement()}
            </>
        );
    };

    getElement = (): JSX.Element => {
        return <this._Element></this._Element>;
    };

    // -------------------------- getters and setters -----------------------

    getWindowId = (): string => {
        return this._windowId;
    };

    /**
     * Get the JSON format profiles
    */
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

    getState = () => {
        return this._state;
    };

    setState = (newState: mainWindowState) => {
        this._state = newState;
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

    /**
     * get the main process mode: desktop, web or ssh-client
     * 
     * if we are running in electron.js, it is desktop or ssh-client. 
     * 
     * if the host name is "localhost", then we are running in desktop mode, otherwise ssh-client mode
     */
    getMainProcessMode = (): "desktop" | "web" | "ssh-client" => {
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.indexOf(' electron/') > -1) {
            // electron.js based
            if (this.getHostname() === "localhost") {
                return "desktop"
            } else {
                return "ssh-client";
            }
        } else {
            // web based
            return "web"
        }
    }

    getHostname = () => {
        return this._hostname;
    }

    getPrompt = () => {
        return this._prompt;
    }

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

    getEnvDefault = () => {
        return this._envDefault;
    }

    getEnvOs = () => {
        return this._envOs;
    }

    setEnvDefault = (newEnv: Record<string, any>) => {
        this._envDefault = newEnv;
    }

    setEnvOs = (newEnv: Record<string, any>) => {
        this._envOs = newEnv;
    }

    getLogFileName = () => {
        return this._logFileName;
    }

    setLogFileName = (newName: string) => {
        this._logFileName = newName;
    }


}


(window as any).MainWindowClientClass = MainWindowClient;