import ReactDOM from "react-dom/client";
import { MainWindowClient, mainWindowState } from "./MainWindowClient";
import { MainWindowProfileRunPage } from "../../../rendererProcess/mainWindow/MainWindowProfileRunPage";
import { Log } from "../../log/Log";
import { MainWindowProfileEditPage } from "../../../rendererProcess/mainWindow/MainWindowProfileEditPage";
import { MainWindowStartupPage } from "../../../rendererProcess/mainWindow/MainWindowStartupPage";
import { IpcEventArgType, IpcEventArgType3, type_DialogInputBox, type_DialogMessageBox } from "../../mainProcess/IpcEventArgType";

/**
 * Manage IPC messages sent from main process for main window. <br>
 *
 * This IPC manager is for `MainWindowClient` object.
 */
export class IpcManagerOnMainWindow {
    private _mainWindowClient: MainWindowClient;
    ipcServerPort: number = -1;
    wsClient: WebSocket | undefined;
    // object that stores the callback functions for events
    eventListeners: Record<string, (evnet: any, ...args: any) => any> = {};

    constructor(mainWindowClient: MainWindowClient, ipcServerPort: number) {
        this._mainWindowClient = mainWindowClient;
        this.ipcServerPort = ipcServerPort;
        this.connectIpcServer();
    }

    /**
     * Connect ipc server after we receive the port number from main process via electron IPC mechanism
     */
    connectIpcServer = () => {
        if (this.getIpcServerPort() === -1) {
            return;
        }

        let serverAddress = `ws://localhost:${this.getIpcServerPort()}`
        if (this.getMainWindowClient().getMainProcessMode() === "web") {
            const host = window.location.host.split(":")[0];
            serverAddress = `ws://${host}:${this.getIpcServerPort()}`;
        }

        const client = new WebSocket(serverAddress);

        client.onopen = () => {
            Log.info("Connected to IPC server on port", this.getIpcServerPort());
            this.wsClient = client;

            this.wsClient.send(
                JSON.stringify({
                    processId: this.getMainWindowClient().getProcessId(),
                    windowId: this.getMainWindowClient().getWindowId(),
                    eventName: "websocket-ipc-connected",
                    data: [{
                        processId: this.getMainWindowClient().getProcessId(),
                        windowId: this.getMainWindowClient().getWindowId(),
                    }],
                })
            );
        };

        client.onmessage = (event: any) => {
            const messageBuffer = event.data;
            const message = JSON.parse(messageBuffer.toString());
            this.replaceNullWithUndefined(message);
            Log.debug("received IPC message", messageBuffer.toString(), message);
            this.handleMessage(message);
        };

        client.onerror = (event: any) => {
            const message = event.data;
            Log.debug("IPC error happens", message);
        };
    };


    replaceNullWithUndefined = (obj: Record<string, any>) => {
        if (obj && typeof obj === "object" && !Array.isArray(obj)) {
            for (const key in obj) {
                if (obj[key] === null) {
                    obj[key] = undefined;
                } else if (typeof obj[key] === "object") {
                    this.replaceNullWithUndefined(obj[key]);
                }
            }
        }
    }

    handleMessage = (message: { processId: number; windowId: string; eventName: string; data: any[] }) => {
        const processId = message["processId"];
        const eventName = message["eventName"];
        const windowId = message["windowId"];

        // find callback for this event
        const callback = this.eventListeners[eventName];
        if (callback !== undefined) {
            // invoke callback
            const data = message["data"];
            callback(undefined, ...data);
        }
    };


    ipcRenderer = {
        // strip off the processId
        on: (channel: string, callback: (event: any, ...args: any) => any) => {
            this.eventListeners[channel] = callback;
        },
    };

    getIpcRenderer = () => {
        return this.ipcRenderer;
    };

    getMainWindowClient = (): MainWindowClient => {
        return this._mainWindowClient;
    };


    sendFromRendererProcess = <T extends keyof IpcEventArgType>(
        channelName: T,
        data: IpcEventArgType[T]
    ): void => {
        Log.debug("send message to IPC server", channelName);
        const processId = this.getMainWindowClient().getProcessId();
        if (processId !== "") {
            if (this.wsClient !== undefined) {
                this.wsClient.send(
                    JSON.stringify({
                        processId: processId,
                        windowId: this.getMainWindowClient().getWindowId(),
                        eventName: channelName,
                        data: [data], // Wrap in array to match your existing format
                    })
                );
            }
        } else {
            console.log("This main window does not have a process Id yet.");
        }
    };

    /**
     * Start to listen to events from main process.
     */
    startToListen = () => {
        this.ipcRenderer.on("after-main-window-gui-created", this._handleAfterMainWindowGuiCreated);
        this.ipcRenderer.on("after-profile-selected", this._handleAfterProfileSelected);
        this.ipcRenderer.on("new-thumbnail", this._handleNewThumbnail);
        this.ipcRenderer.on("update-ws-opener-port", this._handleUpdateWsOpenerPort);
        this.ipcRenderer.on("cmd-line-selected-profile", this._handleCmdLineSelectedProfile);
        this.ipcRenderer.on("show-prompt", this._handleShowPrompt);
        this.ipcRenderer.on("show-about-tdm", this.handleShowAboutTdm)
        this.ipcRenderer.on("dialog-show-message-box", this.handleDialogShowMessageBox);
        this.ipcRenderer.on("dialog-show-input-box", this.handleDialogShowInputBox);
        this.ipcRenderer.on("window-will-be-closed", this.handleWindowWillBeClosed);
        this.ipcRenderer.on("log-file-name", this.handleLogFileName);
    };


    /**
     * Drag and drop one or more tdl files to the DisplayWindow to open the files. <br>
     *
     * New windows inherit the parent window's macros.
     */
    startToListenDragAndDrop = () => {
        document.addEventListener("drop", (event: any) => {
            event.preventDefault();

            // do not listen to drag and drop in ssh-client mode
            if (this.getMainWindowClient().getMainProcessMode() === "ssh-client") {
                return;
            }

            event.stopPropagation();
            if (this.getMainWindowClient().getSelectedProfileName() === "") {
                // if no profile is selected, let the profile button handle the event
            } else {
                // profile is selected
                const tdlFileNames: string[] = [];
                for (const file of event.dataTransfer.files) {
                    // full name
                    const tdlFileName = file.path;
                    tdlFileNames.push(tdlFileName);
                }
                this.sendFromRendererProcess("open-tdl-file", {
                    options: {
                        tdlFileNames: tdlFileNames,
                        mode: "operating",
                        // manually opened, always editable
                        editable: true,
                        // use parent window's macros
                        macros: [],
                        replaceMacros: true,
                        // currentTdlFolder?: string;
                        windowId: this.getMainWindowClient().getWindowId(),
                    }
                });
            }
        });

        document.addEventListener("dragover", (e) => {
            e.preventDefault();
            e.stopPropagation();
        });

        document.addEventListener("dragenter", (event) => {
            Log.debug("File is in the Drop Space");
        });

        document.addEventListener("dragleave", (event) => {
            Log.debug("File has left the Drop Space");
        });
    };

    _handleCmdLineSelectedProfile = (event: any, data: IpcEventArgType3["cmd-line-selected-profile"]) => {
        const { cmdLineSelectedProfile, args } = data;
        this.getMainWindowClient().getIpcManager().sendFromRendererProcess("profile-selected",

            {
                selectedProfileName: cmdLineSelectedProfile,
                args: args,
            }
        );
    };

    _handleUpdateWsOpenerPort = (event: any, data: IpcEventArgType3["update-ws-opener-port"]) => {
        const { newPort } = data;
        this.getMainWindowClient().setWsOpenerPort(newPort);
        this.getMainWindowClient().getProfileRunPage()?.forceUpdateWsOpenerPort();
    };

    _handleNewThumbnail = (event: any, info: IpcEventArgType3["new-thumbnail"]) => {
        const { data } = info;
        Log.info("handle new thumbnail=========", data)
        const profileRunPage = this.getMainWindowClient().getProfileRunPage();
        if (profileRunPage !== undefined) {
            profileRunPage.updateThumbnailGallery(data);
        }
    };

    /**
     * After the main window GUI is created, the profiles and its file name are sent from main process. This function
     * is also invoked when the Profiles is changed. <br>
     */
    private _handleAfterMainWindowGuiCreated = (event: any, data: IpcEventArgType3["after-main-window-gui-created"]) => {
        const { envDefault, envOs, profiles, profilesFileName, logFileName, site } = data;

        const mainWindowClient = this.getMainWindowClient();
        // in editing page, we need the env default and env os
        mainWindowClient.setEnvDefault(envDefault);
        mainWindowClient.setEnvOs(envOs);
        mainWindowClient.setProfiles(profiles);
        mainWindowClient.setProfilesFileName(profilesFileName);
        mainWindowClient.setProfileEditPage(new MainWindowProfileEditPage(mainWindowClient));
        mainWindowClient.setStartupPage(new MainWindowStartupPage(mainWindowClient));
        mainWindowClient.setLogFileName(logFileName);
        mainWindowClient.setSite(site);
        const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
        root.render(mainWindowClient.getElement());

    };

    /**
     * After the profile selected. The main process already prepared the EPICS context.
     */
    private _handleAfterProfileSelected = (event: any, data: IpcEventArgType3["after-profile-selected"]) => {
        const { profileName } = data;
        this.getMainWindowClient().setSelectedProfileName(profileName);
        this.getMainWindowClient().setProfileRunPage(new MainWindowProfileRunPage(this.getMainWindowClient()));
        this.getMainWindowClient().setState(mainWindowState.run);
        if (this.getMainWindowClient().forceUpdate !== undefined) {
            this.getMainWindowClient().forceUpdate({});
        }
    };

    /**
     * For dedicated messages/interaction
     * 
     * error, info, and warning are handled by diag-show-message-box event
     */
    private _handleShowPrompt = (event: any, info: IpcEventArgType3["show-prompt"]) => {
        const { data } = info;
        Log.debug("Show prompt of", data);
        const startupPage = this.getMainWindowClient().getStartupPage();
        if (startupPage !== undefined) {
            this.getMainWindowClient().getPrompt().createElement(data["type"], data)
        } else {
            console.log("Cannot find startup page");
        }
    }

    handleDialogShowMessageBox = (event: any, data: IpcEventArgType3["dialog-show-message-box"]) => {
        const { info } = data;
        const command = info["command"];
        if (command === undefined) {
        } else if (command === "hide") {
            this.getMainWindowClient().getPrompt().removeElement();
        } else if (command === "quit-tdm-process-confirm") {
            const buttons = info["buttons"];
            if (buttons !== undefined && buttons.length >= 1) {
                buttons[0]["handleClick"] = () => {
                    this.sendFromRendererProcess("quit-tdm-process", {
                        confirmToQuit: true
                    });
                };
            }
        } else if (command === "ssh-connection-waiting") {
            const buttons = info["buttons"];
            const attachment = info["attachment"];
            if (buttons !== undefined && buttons.length == 1 && attachment !== undefined) {
                const prompt = this.getMainWindowClient().getPrompt();
                const sshMainProcessId = attachment["sshMainProcessId"];
                buttons[0]["handleClick"] = () => {
                    this.getMainWindowClient().getIpcManager().sendFromRendererProcess("cancel-ssh-connection", {
                        sshMainProcessId: `${sshMainProcessId}`,
                    })
                    prompt.startEventListeners();
                    prompt.removeElement();
                };
            }
        }
        this.getMainWindowClient().getPrompt().createElement("dialog-message-box", info);
        Log.debug("dialog-message-box, info", info);
    };

    handleDialogShowInputBox = (event: any, data: IpcEventArgType3["dialog-show-input-box"]) => {
        const { info } = data;
        const command = info["command"];
        const prompt = this.getMainWindowClient().getPrompt();
        if (command === "open-profiles") {
            const buttons = info["buttons"];
            // OK, Cancel
            if (buttons !== undefined && buttons.length === 2) {
                buttons[0]["handleClick"] = () => {
                    const fileName = prompt.getDialogInputBoxText();
                    if (fileName !== "") {
                        this.sendFromRendererProcess("open-profiles",
                            {
                                profilesFileName1: fileName
                            }
                        );
                    }
                };
                buttons[1]["handleClick"] = () => {
                    // this.sendFromRendererProcess("quit-tdm-process", true);
                };
            }
        } else if (command === "hide") {
            this.getMainWindowClient().getPrompt().removeElement();
        } else if (command === "save-profiles-as") {
            const buttons = info["buttons"];
            const attachment = info["attachment"];
            // OK, Cancel
            if (buttons !== undefined && buttons.length === 2) {
                buttons[0]["handleClick"] = () => {
                    const filePath = prompt.getDialogInputBoxText();
                    if (filePath !== "") {
                        attachment["filePath1"] = filePath;
                        this.sendFromRendererProcess("save-profiles-as",
                            {
                                modifiedProfiles: attachment["modifiedProfiles"],
                                filePath1: attachment["filePath1"],

                            }
                        );
                    }
                };
                buttons[1]["handleClick"] = () => {
                };
            }

        } else if (command === "open-tdl-file") {
            const buttons = info["buttons"];
            const attachment = info["attachment"];
            // OK, Cancel
            if (buttons !== undefined && buttons.length === 2) {
                buttons[0]["handleClick"] = () => {
                    const tdlFileName = prompt.getDialogInputBoxText();
                    if (tdlFileName !== "") {
                        attachment["tdlFileNames"] = [tdlFileName];
                        this.sendFromRendererProcess("open-tdl-file",
                            attachment
                        );
                    }
                };
                buttons[1]["handleClick"] = () => {
                    // this.sendFromRendererProcess("quit-tdm-process", true);
                };
            }
        }
        this.getMainWindowClient().getPrompt().createElement("dialog-input-box", info);
    };


    getEventListeners = () => {
        return this.eventListeners;
    };
    getIpcServerPort = () => {
        return this.ipcServerPort;
    };
    setIpcServerPort = (newPort: number) => {
        this.ipcServerPort = newPort;
    };


    handleShowAboutTdm = (event: any, info: IpcEventArgType3["show-about-tdm"]) => {
        this.getMainWindowClient().getPrompt().createElement("about-tdm", info);
    }

    handleWindowWillBeClosed = (event: any, option: {}) => {
        const mainWindowId = this.getMainWindowClient().getWindowId();
        this.sendFromRendererProcess("main-window-will-be-closed", {
            mainWindowId: mainWindowId,
            close: true,
        });
    };

    /**
     * The log file that is being actively used, it is determined by the 
     * log file property in profiles (not profile) and the accessibility of this file
     * 
     * If the log file defined in profiles is not writable, then the logFileName is ""
     */
    handleLogFileName = (event: any, data: IpcEventArgType3["log-file-name"]) => {
        const { logFileName } = data;
        this.getMainWindowClient().setLogFileName(logFileName);
        // force update startup page, it contains the log file name
        if (this.getMainWindowClient().getState() === mainWindowState.start) {
            this.getMainWindowClient().getStartupPage()?.forceUpdate();
        }
    }
}
