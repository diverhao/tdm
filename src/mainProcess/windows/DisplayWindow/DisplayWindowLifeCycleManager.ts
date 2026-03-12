import { BrowserWindow } from "electron";
import { IpcEventArgType } from "../../../common/IpcEventArgType";
import { IpcManagerOnMainProcess } from "../../mainProcess/IpcManagerOnMainProcess";
import { DisplayWindowAgent } from "../../windows/DisplayWindow/DisplayWindowAgent";
import { showDisplayWindowError } from "../../ipc/WindowMessageBox";
import { Log } from "../../../common/Log";

/**
 *
 *  [User clicks window close button]
 *                 |
 *                 v
 *       [BrowserWindow emits "close"]
 *                 |
 *                 v
 * [Main process sends "window-will-be-closed" to renderer]
 *                 |
 *                 v
 *  [Renderer checks: any side effects needed (save data)?]
 *           /                          \
 *         No                            Yes
 *         |                              |
 *         v                              v
 * [Send "window-will-be-closed-   [Show save prompt immediately:
 *  user-select" with                 Save / Don't Save / Cancel]
 *  select="don't save"]                      |
 *         |                                  |
 *         v                                  v
 *  [Main closes window]        +--------------------------------------+
 *                              | Save: send "window-will-be-closed-   |
 *                              | user-select" with                    |
 *                              | select="save" + fileName +           |
 *                              | fileContent + dataType               |
 *                              +--------------------------------------+
 *                              | Don't Save: send same event with     |
 *                              | select="don't save"                  |
 *                              +--------------------------------------+
 *                              | Cancel: send same event with         |
 *                              | select="cancel"                      |
 *                              +--------------------------------------+
 */
export class DisplayWindowLifeCycleManager {

    private _displayWindowAgent: DisplayWindowAgent;
    private _readyToClose = false;

    constructor(displayWindowAgent: DisplayWindowAgent) {
        this._displayWindowAgent = displayWindowAgent;
    }

    isReadyToClose = () => {
        return this._readyToClose;
    };

    setReadyToClose = (readyToClose: boolean) => {
        this._readyToClose = readyToClose;
    };

    close = () => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        const browserWindow = displayWindowAgent.getBrowserWindow();

        if (browserWindow instanceof BrowserWindow) {
            browserWindow.close();
        } else {
            Log.error("0", `Error: cannot close window ${displayWindowAgent.getId()}`);
        }
    };

    /**
     * when a window is closed, normally just close it.
     * 
     * However, for some special windows, there are more need to be done: which is save the data.
     * 
     * These windows are
     *  - TextEditor utility window
    *  - DataViewer utility window
     *  - modified display window
     */
    handleWindowWillBeClosedUserSelect = (data: IpcEventArgType["window-will-be-closed-user-select"]) => {
        const {
            displayWindowId,
            widgetKey,
            select,
            fileName,
            fileContent,
            dataType,
        } = data;




        const displayWindowAgent = this.getDisplayWindowAgent();
        if (!(displayWindowAgent instanceof DisplayWindowAgent)) {
            Log.error("0", `Cannot handle "window-will-be-closed": invalid displayWindowAgent for displayWindowId=${displayWindowId}`);
            return
        }
        if (select === "don't save") {
            // close immediately
            this.closeBrowserWindow();
            return;
        }

        if (select === "cancel") {
            this.setReadyToClose(false);
            return;
        }

        const browserWindow = displayWindowAgent.getBrowserWindow();
        const windowAgentsManager = displayWindowAgent.getWindowAgentsManager();
        const mainProcessMode = windowAgentsManager.getMainProcess().getMainProcessMode();
        const isRegularDisplayWindow = mainProcessMode === "ssh-server"
            ? windowAgentsManager.preloadedDisplayWindowAgent !== displayWindowAgent
            : browserWindow instanceof BrowserWindow && windowAgentsManager.preloadedDisplayWindowAgent !== displayWindowAgent;

        if (!isRegularDisplayWindow) {
            Log.error("You are trying to close a non-regular window", displayWindowId);
            return;
        }

        const displayWindowFile = displayWindowAgent.getDisplayWindowFile();
        if (mainProcessMode === "desktop") {
            const failedReason = displayWindowFile.saveFileInDesktopMode(dataType, fileName, fileContent);
            if (failedReason === "") {
                this.closeBrowserWindow();
            } else {
                showDisplayWindowError(displayWindowAgent, [failedReason]);
                Log.error("0", failedReason);
                this.setReadyToClose(false);
            }
            return;
        } else if (mainProcessMode === "web") {
            const failedReason = "Cannot save file in web mode";
            showDisplayWindowError(displayWindowAgent, [failedReason]);
            Log.error("0", failedReason, displayWindowId);
            this.setReadyToClose(false);
            return;
        } else if (mainProcessMode === "ssh-server") {
            const result = displayWindowFile.saveFileInSshServerMode(data);
            if (result === "") {
                this.closeBrowserWindow();
            } else if (result !== "prompted") {
                showDisplayWindowError(displayWindowAgent, [result]);
                Log.error("0", result);
                this.setReadyToClose(false);
            }
            return;
        } else {
            Log.error("0", `Unexpected main process mode while closing display window: ${mainProcessMode}`, displayWindowId);
        }

        // if (
        //     mainProcessMode === "ssh-server" ||
        //     isRegularDisplayWindow === true
        // ) {
        //     // desktop mode and ssh-client mode 
        //     // 

        //     // explitly tell to close this window, regardless the current state
        //     if (saveConfirmation === "Save") {
        //         // TextEditor utility window has unsaved contents
        //         if (textEditorFileName !== undefined
        //             && displayWindowId !== undefined
        //             && widgetKey !== undefined
        //             && textEditorContents) {
        //             const saveSuccess = ipcManager.getTextEditorHandlers().handleSaveTextFile("", {
        //                 displayWindowId: displayWindowId,
        //                 widgetKey: widgetKey,
        //                 fileContents: textEditorContents,
        //                 fileName: textEditorFileName,
        //             });
        //             if (saveSuccess) {
        //                 this.closeBrowserWindow(displayWindowAgent);
        //             } else {
        //                 // failed to save, restore state
        //                 displayWindowAgent.readyToClose = false;
        //             }
        //         } else if (widgetKey !== undefined && widgetKey.startsWith("DataViewer") && dataViewerData !== undefined) {
        //             // save DataViewer data
        //             // const displayWindowAgent = ipcManager.getMainProcess().getWindowAgentsManager().getAgent(displayWindowId);

        //             let fileName = "";

        //             if (browserWindow instanceof BrowserWindow) {
        //                 if (ipcManager.getMainProcess().getMainProcessMode() === "desktop") {
        //                     fileName = dialog.showSaveDialogSync(browserWindow, {
        //                         title: "Select a file to save to",
        //                         filters: [
        //                             {
        //                                 name: "json",
        //                                 extensions: ["json"],
        //                             },
        //                         ],
        //                     });
        //                 } else if (ipcManager.getMainProcess().getMainProcessMode() === "ssh-server") {
        //                     // todo
        //                     // displayWindowAgent.sendFromMainProcess("dialog-show-input-box",
        //                     //     {
        //                     //         command: "data-viewer-export-data",
        //                     //         humanReadableMessages: ["Save file to"], // each string has a new line
        //                     //         buttons: [
        //                     //             {
        //                     //                 text: "OK",
        //                     //             },
        //                     //             {
        //                     //                 text: "Cancel",
        //                     //             }
        //                     //         ],
        //                     //         defaultInputText: "",
        //                     //         attachment: {
        //                     //             displayWindowId: displayWindowId,
        //                     //             data: data,
        //                     //             fileName1: fileName1,
        //                     //         }
        //                     //     }
        //                     // );
        //                     // return;
        //                 }
        //             }
        //             try {
        //                 fs.writeFileSync(fileName, JSON.stringify(dataViewerData, null, 4));
        //                 Log.debug("0", "Successfully saved DataViewer data to", fileName);
        //                 this.closeBrowserWindow(displayWindowAgent);
        //             } catch (e) {
        //                 // if Cancel or error, do not close the window
        //                 Log.error("0", `Cannot save DataViewer data to file ${fileName}`);
        //                 displayWindowAgent.readyToClose = false;

        //                 // displayWindowAgent.sendFromMainProcess("dialog-show-message-box", {
        //                 //     // command?: string | undefined,
        //                 //     messageType: "error", // | "warning" | "info", // symbol
        //                 //     humanReadableMessages: [`Cannot save DataViewer data to file ${fileName}`], // each string has a new line
        //                 //     rawMessages: [`${e}`], // computer generated messages
        //                 //     // buttons?: type_DialogMessageBoxButton[] | undefined,
        //                 //     // attachment?: any,
        //                 // })
        //             }
        //             return;
        //         } else {
        //             // any other types of window
        //             let tdlFileName: string | undefined = initialTdlFileName;
        //             // Save as: it is an in-memory display
        //             if (tdlFileName === "") {
        //                 if (ipcManager.getMainProcess().getMainProcessMode() === "desktop") {

        //                     // a in-memory display, save as
        //                     tdlFileName = dialog.showSaveDialogSync({
        //                         title: "Save",
        //                         defaultPath: path.dirname(tdlFileName),
        //                         filters: [{ name: "tdl", extensions: ["tdl", "json"] }],
        //                     });
        //                 } else if (ipcManager.getMainProcess().getMainProcessMode() === "ssh-server") {
        //                     displayWindowAgent.sendFromMainProcess("dialog-show-input-box",
        //                         {
        //                             info:
        //                             {
        //                                 command: "window-will-be-closed",
        //                                 humanReadableMessages: ["Save diaplay to"], // each string has a new line
        //                                 buttons: [
        //                                     {
        //                                         text: "OK",
        //                                     },
        //                                     {
        //                                         text: "Cancel",
        //                                     }
        //                                 ],
        //                                 defaultInputText: "",
        //                                 attachment: data,
        //                             }
        //                         }
        //                     );
        //                     return;
        //                 }
        //             }
        //             if (tdlFileName !== undefined) {
        //                 // save file
        //                 fs.writeFile(tdlFileName, JSON.stringify(tdl, null, 4), (err) => {
        //                     if (err) {
        //                         // error when saving file, do not close the window
        //                         Log.error("0", err);
        //                         showDisplayWindowError(displayWindowAgent, [`Error saving file ${tdlFileName}`], [`${err}`]);
        //                         displayWindowAgent.readyToClose = false;
        //                     } else {
        //                         // update tdlFileName on client side, absolute path
        //                         displayWindowAgent.sendFromMainProcess("tdl-file-saved",
        //                             {
        //                                 newTdlFileName: tdlFileName
        //                             }
        //                         );
        //                         this.closeBrowserWindow(displayWindowAgent);

        //                     }
        //                 });
        //             } else {
        //                 // cancel the file saving dialog, do not close the window
        //                 displayWindowAgent.readyToClose = false;
        //             }
        //         }
        //     } else if (saveConfirmation === "Don't Save") {
        //         // Don't Save
        //         this.closeBrowserWindow(displayWindowAgent);
        //         return;
        //     } else if (saveConfirmation === "Cancel") {
        //         // Cancel
        //         displayWindowAgent.readyToClose = false;
        //         return;
        //     } else {
        //         showDisplayWindowWarning(
        //             displayWindowAgent,
        //             widgetKey !== undefined && widgetKey.startsWith("DataViewer_")
        //                 ? [`Do you want to save the data? They will be lost if you don't save them.`]
        //                 : [`Do you want to save the changes you made? Your changes will be lost if you don't save them.`],
        //             [],
        //             {
        //                 command: "window-will-be-closed-confirm",
        //                 buttons: [
        //                     {
        //                         text: "Save",
        //                     },
        //                     {
        //                         text: "Don't Save",
        //                     },
        //                     {
        //                         text: "Cancel",
        //                     }
        //                 ],
        //                 // on render window, this is modified and sent back
        //                 // the saveConfirmation is changed from undefined to
        //                 // "Save", "Don't Save", or "Cancel"
        //                 attachment: data,
        //             }
        //         );
        //         return;

        //     }
        // } else if (browserWindow === undefined) {
        //     // // ssh-server mode
        //     // fs.writeFileSync("/Users/haohao/tdm.log", `window will be closed ===================== B ${displayWindowAgent.getId()}\n`, { flag: "a" });
        //     // // DisplayWindowAgent.browserWindow is undefined, we are in ssh-server mode 
        //     // const sshServer = ipcManager.getMainProcess().getMainProcesses().getIpcManager().getSshServer();
        //     // if (sshServer !== undefined) {
        //     //     sshServer.sendToTcpClient(JSON.stringify(
        //     //         {
        //     //             command: "close-webcontents-in-ssh",
        //     //             data: {
        //     //                 mainProcessId: ipcManager.getMainProcess().getWindowAgentsManager().getMainProcess().getProcessId(),
        //     //                 displayWindowId: data["displayWindowId"],
        //     //             }
        //     //         }
        //     //     ))
        //     // }
        // }

    };

    closeBrowserWindow = () => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        const mainProcessMode = displayWindowAgent.getWindowAgentsManager().getMainProcess().getMainProcessMode();

        // the DisplayWindowAgent.handleWindowClosed() won't e called
        displayWindowAgent.getDisplayWindowLifeCycleManager().setReadyToClose(true);
        const displayWindowId = displayWindowAgent.getId();
        if (mainProcessMode === "desktop") {
            this.closeBrowserWindowInDesktopMode();
        } else if (mainProcessMode === "ssh-server") {
            this.closeBrowserWindowInSshServerMode();
        } else {
            Log.error("0", `Cannot close browser window: unsupported main process mode ${mainProcessMode} for displayWindowId=${displayWindowId}`);
        }
    }

    closeBrowserWindowInDesktopMode = () => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        const browserWindow = displayWindowAgent.getBrowserWindow();
        const displayWindowId = displayWindowAgent.getId();

        if (browserWindow !== undefined) {
            browserWindow.webContents.close();
        } else {
            Log.error("0", `Cannot close browser window in desktop mode: browserWindow is undefined for displayWindowId=${displayWindowId}`);
        }
    }

    closeBrowserWindowInSshServerMode = () => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        const mainProcessMode = displayWindowAgent.getWindowAgentsManager().getMainProcess().getMainProcessMode();
        const ipcManager = displayWindowAgent.getWindowAgentsManager().getMainProcess().getIpcManager();
        const displayWindowId = displayWindowAgent.getId();
        // (1) clean up the local stuff
        displayWindowAgent.handleWindowClosed();
        // (2) tell the ssh-client to close the window
        const sshServer = ipcManager.getMainProcess().getIpcManager().getSshServer();
        // fs.writeFileSync("/Users/haohao/tdm.log", `window will be closed, tell the ssh-client to close window =====================\n`, { flag: "a" });
        if (sshServer !== undefined) {
            // this is a tcp command, not websocket
            // fs.writeFileSync("/Users/haohao/tdm.log", `window will be closed, tell the ssh-client to close window B =====================\n`, { flag: "a" });
            sshServer.sendToTcpClient(JSON.stringify(
                {
                    command: "close-browser-window",
                    data: {
                        mainProcessId: "0",
                        displayWindowId: displayWindowId,
                    }
                }
            ))
        } else {
            Log.error("0", `Cannot close browser window in ssh-server mode: sshServer is undefined for displayWindowId=${displayWindowId}`);
        }
    }



    // close browser window in desktop mode or ssh-server mode

    getDisplayWindowAgent = () => {
        return this._displayWindowAgent;
    }

}
