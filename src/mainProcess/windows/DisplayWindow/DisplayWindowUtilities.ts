import { BrowserWindow, Menu, dialog, clipboard, screen, desktopCapturer } from "electron";
import * as fs from "fs";
import * as path from "path";
import { homedir } from "os";
import pidusage from "pidusage";
import { generateAboutInfo, getCurrentDateTimeStr } from "../../global/GlobalMethods";
import { Log } from "../../../common/Log";
import { ContextMenuDesktop } from "./ContextMenuDesktop";
import { DisplayWindowAgent } from "./DisplayWindowAgent";
import { IpcEventArgType2 } from "../../../common/IpcEventArgType";
import { v4 as uuidv4 } from "uuid";

type type_DialogShowMessageBoxInfo = IpcEventArgType2["dialog-show-message-box"]["info"];
type type_DialogShowMessageBoxExtraInfo = Omit<Partial<type_DialogShowMessageBoxInfo>, "messageType" | "humanReadableMessages" | "rawMessages">;

export class DisplayWindowUtilities {

    private readonly _displayWindowAgent: DisplayWindowAgent;
    private readonly _contextMenu: ContextMenuDesktop;
    private _takeThumbnailInterval: NodeJS.Timeout | undefined = undefined;
    private _thumbnail = "";

    constructor(displayWindowAgent: DisplayWindowAgent) {
        this._displayWindowAgent = displayWindowAgent;
        this._contextMenu = new ContextMenuDesktop(displayWindowAgent);
    }

    // ---------------------- IPC ----------------------

    showNotification = (info: type_DialogShowMessageBoxInfo): void => {
        this.getDisplayWindowAgent().sendFromMainProcess("dialog-show-message-box", {
            info: info,
        });
    };

    showError = (
        humanReadableMessages: string[],
        rawMessages: string[] = [],
        extraInfo: type_DialogShowMessageBoxExtraInfo = {},
    ): void => {
        this.showNotification({
            ...extraInfo,
            messageType: "error",
            humanReadableMessages,
            rawMessages,
        });
    };

    showInfo = (
        humanReadableMessages: string[],
        rawMessages: string[] = [],
        extraInfo: type_DialogShowMessageBoxExtraInfo = {},
    ): void => {
        this.showNotification({
            ...extraInfo,
            messageType: "info",
            humanReadableMessages,
            rawMessages,
        });
    };

    showWarning = (
        humanReadableMessages: string[],
        rawMessages: string[] = [],
        extraInfo: type_DialogShowMessageBoxExtraInfo = {},
    ): void => {
        this.showNotification({
            ...extraInfo,
            messageType: "warning",
            humanReadableMessages,
            rawMessages,
        });
    };

    // --------------------- context menu --------------

    showContextMenu = (mode: string, widgetKeys: string[], options: Record<string, any>) => {
        const contextMenuTemplate = this.getContextMenu().getTemplate(mode, widgetKeys, options);
        if (contextMenuTemplate !== undefined) {
            const menu = Menu.buildFromTemplate(contextMenuTemplate);
            menu.popup();
        } else {
            Log.error("0", "Cannot show context menu");
        }
    };

    showContextMenuSidebar = (mode: string, widgetKeys: string[], options: Record<string, any>) => {
        const hasSelection = options["hasSelection"];
        let contextMenuTemplate = [
            {
                label: "Copy",
                accelerator: "CmdOrCtrl+c",
                role: "copy" as any,
                enabled: hasSelection,
            },
            {
                label: "Cut",
                accelerator: "CmdOrCtrl+x",
                role: "cut" as any,
                enabled: hasSelection,
            },
            {
                label: "Paste",
                accelerator: "CmdOrCtrl+v",
                role: "paste" as any,
            },
        ];
        if (process.platform === "darwin" && !hasSelection) {
            contextMenuTemplate = [
                {
                    label: "Paste",
                    accelerator: "CmdOrCtrl+v",
                    role: "paste" as any,
                },
            ];
        }
        if (contextMenuTemplate !== undefined) {
            const menu = Menu.buildFromTemplate(contextMenuTemplate);
            menu.popup();
        } else {
            Log.error("0", "Cannot show context menu");
        }
    };

    getContextMenu = () => {
        return this._contextMenu;
    };

    // --------------------- utilities ----------------

    printToPdf = async () => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        const browserWindow = displayWindowAgent.getBrowserWindow();
        if (!(browserWindow instanceof BrowserWindow)) {
            return;
        }

        try {
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                    reject("time out after 1 s");
                }, 1000);
            });
            const pdfContentsBufferPromise = browserWindow.webContents.printToPDF({ printBackground: true, pageSize: "Letter" });
            const pdfContentsBuffer = await Promise.race([timeoutPromise, pdfContentsBufferPromise]);

            if (pdfContentsBuffer instanceof Buffer) {
                const pdfFileName = dialog.showSaveDialogSync({ title: "save pdf file", filters: [{ name: "pdf", extensions: ["pdf"] }] });
                if (pdfFileName === undefined) {
                    Log.debug("0", "pdf file not selected.");
                    return;
                }
                fs.writeFile(pdfFileName, pdfContentsBuffer as Uint8Array, (err) => {
                    if (err) {
                        this.showError([`Failed saving pdf as ${pdfFileName}`], [err.toString()]);
                    }
                });
            }
        } catch (e) {
            Log.error("0", e);
        }
    };

    print = () => {
        const browserWindow = this.getDisplayWindowAgent().getBrowserWindow();
        if (browserWindow === undefined) {
            Log.error("0", "Browser window does not exist");
            return;
        }
        browserWindow.webContents.print({
            printBackground: true,
            color: true,
        });
    };

    showAboutTdm = () => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        if (displayWindowAgent.getWindowAgentsManager().getMainProcess().getMainProcessMode() === "desktop") {
            displayWindowAgent.sendFromMainProcess("show-about-tdm",
                {
                    info: generateAboutInfo()
                }
            );
        }
    };

    getZoomFactor = (): number => {
        const browserWindow = this.getDisplayWindowAgent().getBrowserWindow();
        if (browserWindow instanceof BrowserWindow) {
            return browserWindow.webContents.getZoomFactor();
        }
        return 1;
    };

    setZoomFactor = (level: number) => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        const browserWindow = displayWindowAgent.getBrowserWindow();
        if (browserWindow instanceof BrowserWindow) {
            Log.debug("0", displayWindowAgent.getId());
            browserWindow.webContents.setZoomFactor(level);
        }
    };

    takeScreenshot = () => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        const browserWindow = displayWindowAgent.getBrowserWindow();
        if (browserWindow === undefined) {
            Log.error("0", "Browser window does not exist");
            return;
        }
        const webContents = browserWindow.webContents;
        webContents.capturePage().then((image: Electron.NativeImage) => {
            const imageFileName = dialog.showSaveDialogSync({
                title: "save image",
                filters: [{ name: "Image Files", extensions: ["png"] }],
            });
            if (imageFileName === undefined) {
                Log.debug("0", "Image file not selected, image not saved");
                return;
            }
            fs.writeFile(imageFileName, image.toPNG() as Uint8Array, (err) => {
                if (err) {
                    this.showError([`Failed saving screenshot to folder ${imageFileName}`], [err.toString()]);
                }
            });
        });
    };

    takeScreenshotToFolder = () => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        const browserWindow = displayWindowAgent.getBrowserWindow();
        if (browserWindow === undefined) {
            Log.error("0", "Browser window does not exist");
            return;
        }
        let saveFolder = homedir();
        const webContents = browserWindow.webContents;
        webContents.capturePage().then((image: Electron.NativeImage) => {
            const selectedProfile = displayWindowAgent.getWindowAgentsManager().getMainProcess().getProfiles().getSelectedProfile();
            if (selectedProfile !== undefined) {
                try {
                    const saveFolderTmp = selectedProfile.getEntry("EPICS Custom Environment", "Video Saving Folder");
                    if (saveFolderTmp === undefined) {
                        throw new Error("Cannot find Video Saving Folder setting");
                    }
                    if (fs.existsSync(saveFolderTmp)) {
                        fs.accessSync(saveFolderTmp, fs.constants.W_OK);
                        saveFolder = saveFolderTmp;
                    }
                } catch (e) {
                    Log.error("0", e);
                }
            }

            const imageFileName = path.join(saveFolder, "TDM-screenshot-" + getCurrentDateTimeStr(true) + ".png");
            fs.writeFile(imageFileName, image.toPNG() as Uint8Array, (err) => {
                if (err) {
                    this.showError([`Failed saving screenshot to folder ${saveFolder}`], [err.toString()]);
                } else {
                    Log.info("Save screenshot to", imageFileName);
                }
            });
        }).catch((err: any) => {
            Log.error("0", err);
            this.showError([`Failed saving screenshot to folder ${saveFolder}`], [err.toString()]);
        });
    };

    takeScreenshotToClipboard = () => {
        const browserWindow = this.getDisplayWindowAgent().getBrowserWindow();
        if (browserWindow === undefined) {
            Log.error("0", "Browser window does not exist");
            return;
        }
        browserWindow.webContents.capturePage().then((image: Electron.NativeImage) => {
            clipboard.writeImage(image);
        });
    };

    startRecordVideo = () => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        let saveFolder = homedir();
        const selectedProfile = displayWindowAgent.getWindowAgentsManager().getMainProcess().getProfiles().getSelectedProfile();
        if (selectedProfile !== undefined) {
            try {
                const saveFolderTmp = selectedProfile.getEntry("EPICS Custom Environment", "Video Saving Folder");
                if (saveFolderTmp === undefined) {
                    throw new Error("Cannot find Video Saving Folder setting");
                }
                if (fs.existsSync(saveFolderTmp)) {
                    fs.accessSync(saveFolderTmp, fs.constants.W_OK);
                    saveFolder = saveFolderTmp;
                }
            } catch (e) {
                Log.error("0", e);
            }
        }

        const browserWindow = displayWindowAgent.getBrowserWindow();
        if (browserWindow instanceof BrowserWindow) {
            const windowTitle = browserWindow.getTitle();
            desktopCapturer.getSources({ types: ["window"] }).then(async (sources: Electron.DesktopCapturerSource[]) => {
                for (const source of sources) {
                    Log.debug("0", source.name);
                    if (source.name === windowTitle) {
                        displayWindowAgent.sendFromMainProcess("start-record-video",
                            {
                                sourceId: source.id,
                                folder: saveFolder
                            }
                        );
                        break;
                    }
                }
            });
        }
    };

    getProcessInfo = async (withThumbnail: boolean) => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        const visible = (displayWindowAgent.getWindowAgentsManager().preloadedDisplayWindowAgent === displayWindowAgent) ? "No" : "Yes";

        const webContents = displayWindowAgent.getWebContents();
        let pid = -1;
        if (webContents !== undefined) {
            pid = webContents.getOSProcessId();
        }

        let usage = {
            "CPU usage [%]": -1,
            "Memory usage [MB]": -1,
            "Uptime [s]": -1,
        };
        if (pid !== -1) {
            usage = await new Promise<{
                "CPU usage [%]": number,
                "Memory usage [MB]": number,
                "Uptime [s]": number,
            }>((resolve) => {
                pidusage(pid, (err: any, stats: any) => {
                    if (err) {
                        resolve({
                            "CPU usage [%]": -1,
                            "Memory usage [MB]": -1,
                            "Uptime [s]": -1,
                        });
                    } else {
                        resolve({
                            "CPU usage [%]": stats["cpu"],
                            "Memory usage [MB]": Math.round(stats["memory"] / 1024 / 1024),
                            "Uptime [s]": Math.round(stats["elapsed"] / 1000),
                        });
                    }
                });
            });
        }

        return {
            "Type": "Display Window",
            "Window ID": displayWindowAgent.getId(),
            "Visible": visible,
            "TDL file name": displayWindowAgent.getTdlFileName(),
            "Window name": displayWindowAgent.getWindowName(),
            "Editable": displayWindowAgent.isEditable() === true ? "Yes" : "No",
            "Uptime [second]": usage["Uptime [s]"],
            "Process ID": pid,
            "CPU usage [%]": usage["CPU usage [%]"],
            "Memory usage [MB]": usage["Memory usage [MB]"],
            "Thumbnail": withThumbnail ? displayWindowAgent.getThumbnail() : "",
            "Script": displayWindowAgent.getDisplayWindowAttachedScript().getWindowAttachedScriptName(),
            "Script PID": displayWindowAgent.getDisplayWindowAttachedScript().getWindowAttachedScriptPid() === undefined ? "N/A" : `${displayWindowAgent.getDisplayWindowAttachedScript().getWindowAttachedScriptPid()}`,
        };
    };

    // --------------------- window lifecycle ---------

    handleWindowClosed = () => {
        this.stopThumbnailInterval();
        this.removeThumbnail(this.getDisplayWindowAgent().getId());
    };

    // --------------------- thumbnail ----------------

    updateThumbnail = (
        displayWindowId: string,
        imageBase64: string | undefined,
        windowName: string | undefined = undefined,
        tdlFileName: string | undefined = undefined
    ) => {
        const displayWindowAgent = this.getDisplayWindowAgent();
        const mainWindowAgent = displayWindowAgent.getWindowAgentsManager().getMainWindowAgent();
        const result: Record<string, { image: string; windowName?: string; tdlFileName?: string; } | null> = {};

        if (imageBase64 !== undefined) {
            this._thumbnail = imageBase64;
            const data: { image: string; windowName?: string; tdlFileName?: string; } = { image: imageBase64 };
            result[displayWindowId] = data;
            if (windowName !== undefined) {
                data["windowName"] = windowName;
            }
            if (windowName !== undefined) {
                data["tdlFileName"] = tdlFileName;
            }
        } else {
            this._thumbnail = "";
            result[displayWindowId] = null;
        }

        if (mainWindowAgent !== undefined && displayWindowAgent.hiddenWindow === false) {
            mainWindowAgent.sendFromMainProcess("new-thumbnail",
                {
                    data: result
                }
            );
        } else {
            Log.error("0", "Main window not ready");
        }
    };

    removeThumbnail = (displayWindowId: string) => {
        this.updateThumbnail(displayWindowId, undefined);
    };

    getThumbnail = () => {
        return this._thumbnail;
    };

    takeThumbnail = async (windowName: string | undefined = undefined, tdlFileName: string | undefined = undefined) => {
        try {
            const displayWindowAgent = this.getDisplayWindowAgent();
            const browserWindow = displayWindowAgent.getBrowserWindow();
            if (browserWindow instanceof BrowserWindow) {
                const webContents = browserWindow.webContents;
                const image: Electron.NativeImage = await webContents.capturePage();
                const size = image.getSize();
                let resizedImage: Electron.NativeImage = image;

                if (displayWindowAgent.hiddenWindow === true) {
                    const bounds = browserWindow.getBounds();
                    const display = screen.getDisplayMatching(bounds);
                    const factor = display.scaleFactor;

                    resizedImage = resizedImage.crop({
                        x: 0,
                        y: 0,
                        width: size.width - 200 * factor,
                        height: size.height,
                    });
                }

                const maxSize = displayWindowAgent.getForFileBrowserWindowId() === "" ? 100 : 800;
                if (size.height > maxSize || size.width > maxSize) {
                    if (size.height > size.width) {
                        resizedImage = resizedImage.resize({
                            height: maxSize
                        });
                    } else {
                        resizedImage = resizedImage.resize({
                            width: maxSize,
                        });
                    }
                }
                const imageBuffer = resizedImage.toPNG();
                const imageBase64 = imageBuffer.toString("base64");
                const displayWindowId = displayWindowAgent.getId();
                if (displayWindowAgent.getDisplayWindowLifeCycleManager().isReadyToClose() === false) {
                    this.updateThumbnail(displayWindowId, `data:image/png;base64,${imageBase64}`, windowName, tdlFileName);
                }
            }
        } catch (e) {
            Log.error("0", e);
        }
    };

    startThumbnailInterval = () => {
        this.stopThumbnailInterval();
        const displayWindowAgent = this.getDisplayWindowAgent();
        this._takeThumbnailInterval = setInterval(() => {
            displayWindowAgent.takeThumbnail();
        }, 5000);
    };

    stopThumbnailInterval = () => {
        clearInterval(this._takeThumbnailInterval);
        this._takeThumbnailInterval = undefined;
    };

    // --------------------- managers ------------------

    getDisplayWindowAgent = () => {
        return this._displayWindowAgent;
    };

    // --------------------- hash ----------------------

    /**
     * Calculate hash for a display window based on file name and macros.<br>
     *
     * If the file name is "", the hash is a random uuid. <br>
     *
     * When the file name or macros changes, recalculate the hash.
     */
    static calcHash = (fullTdlFileName: string, macros: [string, string][]) => {
        if (fullTdlFileName === "") {
            return uuidv4();
        } else {
            return fullTdlFileName + JSON.stringify(macros);
        }
    };

}
