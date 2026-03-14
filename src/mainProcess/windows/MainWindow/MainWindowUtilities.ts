import { BrowserWindow, Menu } from "electron";
import pidusage from "pidusage";
import { IpcEventArgType3 } from "../../../common/IpcEventArgType";
import { Log } from "../../../common/Log";
import { generateAboutInfo } from "../../global/GlobalMethods";
import { MainWindowAgent } from "./MainWindowAgent";

type type_DialogShowMessageBoxInfo = IpcEventArgType3["dialog-show-message-box"]["info"];
type type_DialogShowMessageBoxExtraInfo = Omit<Partial<type_DialogShowMessageBoxInfo>, "messageType" | "humanReadableMessages" | "rawMessages">;
type type_DialogShowInputBoxInfo = IpcEventArgType3["dialog-show-input-box"]["info"];

export class MainWindowUtilities {
    private readonly _mainWindowAgent: MainWindowAgent;

    constructor(mainWindowAgent: MainWindowAgent) {
        this._mainWindowAgent = mainWindowAgent;
    }

    generateWindowTitle = () => {
        const mainWindowAgent = this.getMainWindowAgent();
        let windowTitle = "TDM Main Window";

        let hostname = mainWindowAgent.getWindowAgentsManager().getMainProcess().getSshClient()?.getServerIP();
        if (hostname === undefined) {
            hostname = "";
        } else {
            hostname = `${hostname}:`;
        }

        windowTitle = hostname + windowTitle;

        const selectedProfile = mainWindowAgent.getWindowAgentsManager().getMainProcess().getProfiles().getSelectedProfile();
        if (selectedProfile !== undefined) {
            windowTitle = `${windowTitle} -- ${selectedProfile.getName()}`;
        }

        return windowTitle;
    };

    showContextMenu = (menu: ("copy" | "cut" | "paste")[]) => {
        const mainWindowAgent = this.getMainWindowAgent();
        if (mainWindowAgent.getWindowAgentsManager().getMainProcess().getMainProcessMode() === "ssh-server") {
            return;
        }

        const contextMenuTemplate: (Electron.MenuItem | Electron.MenuItemConstructorOptions)[] = [];
        if (menu.includes("copy")) {
            contextMenuTemplate.push({
                label: "Copy",
                accelerator: "CmdOrCtrl+c",
                role: "copy",
            });
        }
        if (menu.includes("cut")) {
            contextMenuTemplate.push({
                label: "Cut",
                accelerator: "CmdOrCtrl+x",
                role: "cut",
            });
        }
        if (menu.includes("paste")) {
            contextMenuTemplate.push({
                label: "Paste",
                accelerator: "CmdOrCtrl+v",
                role: "paste",
            });
        }
        const contextMenu = Menu.buildFromTemplate(contextMenuTemplate);
        contextMenu.popup();
    };

    showNotification = (info: type_DialogShowMessageBoxInfo): void => {
        this.getMainWindowAgent().sendFromMainProcess("dialog-show-message-box", {
            info: info,
        });
    };

    showInputBox = (info: type_DialogShowInputBoxInfo): void => {
        this.getMainWindowAgent().sendFromMainProcess("dialog-show-input-box", {
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

    showAboutTdm = () => {
        const mainWindowAgent = this.getMainWindowAgent();
        if (mainWindowAgent.getWindowAgentsManager().getMainProcess().getMainProcessMode() === "desktop") {
            mainWindowAgent.sendFromMainProcess("show-about-tdm", {
                info: generateAboutInfo(),
            });
        }
    };

    setTitle = (newTitle: string) => {
        const browserWindow = this.getMainWindowAgent().getBrowserWindow();
        if (browserWindow !== undefined) {
            browserWindow.setTitle(newTitle);
        }
    };

    getTitle = () => {
        const browserWindow = this.getMainWindowAgent().getBrowserWindow();
        if (browserWindow !== undefined) {
            return browserWindow.getTitle();
        }
        return "";
    };

    getWindowName = () => {
        return "Main Window";
    };

    getTdlFileName = () => {
        return this.getWindowName();
    };

    takeThumbnail = async () => {
        let thumbnail = "";
        try {
            const browserWindow = this.getMainWindowAgent().getBrowserWindow();
            if (browserWindow instanceof BrowserWindow) {
                const webContents = browserWindow.webContents;
                thumbnail = await new Promise<string>((resolve) => {
                    webContents.capturePage().then((image: Electron.NativeImage) => {
                        const size = image.getSize();
                        const resizedImage = size.height > size.width
                            ? image.resize({ height: 100 })
                            : image.resize({ width: 100 });
                        const imageBuffer = resizedImage.toPNG();
                        const imageBase64 = imageBuffer.toString("base64");
                        resolve(`data:image/png;base64,${imageBase64}`);
                    });
                });
            }
        } catch (e) {
            Log.error(e);
        }
        return thumbnail;
    };

    getProcessInfo = async (withThumbnail: boolean) => {
        const mainWindowAgent = this.getMainWindowAgent();
        const webContents = mainWindowAgent.getWebContents();
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
                "CPU usage [%]": number;
                "Memory usage [MB]": number;
                "Uptime [s]": number;
            }>((resolve) => {
                pidusage(pid, (err: any, stats: any) => {
                    if (err) {
                        resolve({
                            "CPU usage [%]": -1,
                            "Memory usage [MB]": -1,
                            "Uptime [s]": -1,
                        });
                        return;
                    }
                    resolve({
                        "CPU usage [%]": stats["cpu"],
                        "Memory usage [MB]": Math.round(stats["memory"] / 1024 / 1024),
                        "Uptime [s]": Math.round(stats["elapsed"] / 1000),
                    });
                });
            });
        }

        let thumbnail = "";
        if (withThumbnail === true) {
            thumbnail = await this.takeThumbnail();
        }

        return {
            "Type": "Main Window",
            "Window ID": mainWindowAgent.getId(),
            "Visible": "Yes",
            "TDL file name": "Not available",
            "Window name": this.generateWindowTitle(),
            "Editable": "No",
            "Uptime [second]": usage["Uptime [s]"],
            "Process ID": pid,
            "CPU usage [%]": usage["CPU usage [%]"],
            "Memory usage [MB]": usage["Memory usage [MB]"],
            "Thumbnail": thumbnail,
            "Script": "",
            "Script PID": "N/A",
        };
    };

    getMainWindowAgent = () => {
        return this._mainWindowAgent;
    };
}
