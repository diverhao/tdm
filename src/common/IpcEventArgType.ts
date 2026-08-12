/**
 * This file can be imported by both main and renderer process.
 */

import { Channel_DBR_TYPES, type_dbrData, type_pva_value } from "./EpicsTcaLib";
import { type_LocalChannel_data } from "./GlobalVariables";
import { type_tdl } from "./GlobalVariables";
import { type_fileType } from "./types/type_Files";
import { type_macros_tdl } from "./types/type_widget_tdl";


/**
 * Input argument types for command line.
 * 
 * It is the return type of `ArgParser.parseArgs()`.
 * 
 * For "--attach" option, nominally it is port number of opener websocket, > 0
 * 
 */
export type type_args = {
    macros: type_macros_tdl;
    settings: string;
    profile: string;
    alsoOpenDefaults: boolean;
    fileNames: string[];
    // internal use only:
    // -1 means open in a new TDM instance
    // -2 means we are trying to open a tdl file from file manager
    attach: number;
    flexibleAttach: boolean;
    cwd: string;
    mainProcessMode: "desktop" | "web";
    httpServerPort: number;
    httpServerBasePath: string;
    site: string;
};

export type type_about_info = {
    "Authors": string[],
    "Organizations": string[],
    "Electron": string[],
    "Version": string[],
    "Operating System": string[],
    "License": string[],
    "Chromium": string[],
    "Node.js": string[],
    "V8": string[],
    "Build Date": string[],
}

export type type_folder_content = type_single_file_folder[];


export type type_single_file_folder = {
    name: string, // only the name for regular file/folder, absolute path for bookmark
    type: "file" | "folder",
    size: number,
    timeModified: number,
};

export type type_logData = {
    widgetKey: string,
    timeMsSinceEpoch: number,
    profileName: string,
    type: "fatal" | "error" | "warn" | "info" | "debug" | "trace",
    args: any[],
}


export enum PVA_STATUS_TYPE {
    OK = 0,
    WARNING = 1,
    ERROR = 2,
    FATAL = 3,
    OKOK = 255
}

export type type_pva_status = {
    type: PVA_STATUS_TYPE;
    message?: string;
    callTree?: string;
};


export type type_DialogMessageBoxButton = { text: string, handleClick?: undefined | ((dialogInputText?: string) => void) };
export type type_DialogInputBoxButton = type_DialogMessageBoxButton;

export type type_DialogMessageBox = {
    command?: string,
    messageType: "error" | "warning" | "info", // symbol
    humanReadableMessages: string[], // each string has a new line
    rawMessages: string[], // computer generated messages
    buttons?: type_DialogMessageBoxButton[],
    attachment?: any,
};

export type type_DialogInputBox = {
    command: string,
    humanReadableMessages: string[], // each string has a new line
    buttons?: type_DialogInputBoxButton[],
    defaultInputText: string,
    attachment?: any,
};


/**
 * Input argument types for IPC messages sent from a DisplayWindow renderer to
 * the main process.
 */
export type IpcDispWinToMainProc = {

    /** Also used by `IpcMainWinToMainProc`. */
    "input-file-path": {
        windowId: string,
        fileName: string,
    }

    "get-symbol-gallery": {
        page: number,
        displayWindowId: string;
        widgetKey: string;
        update?: boolean
    }


    "load-db-file-contents": {
        dbFileName?: string;
        displayWindowId: string;
        widgetKey: string;
    };

    /** Also used by `IpcMainWinToMainProc`. */
    "quit-tdm-process": {
        confirmToQuit: boolean
    }

    "websocket-ipc-connected-on-display-window": {
        processId: string,
        windowId: string,
        reconnect: boolean,
    },

    "bring-up-main-window": {

    }

    /** Also used by `IpcMainWinToMainProc`. */
    "focus-window": {
        displayWindowId: string
    },

    /** Also used by `IpcMainWinToMainProc`. */
    "close-window": {
        displayWindowId: string
    },

    "set-window-title": {
        windowId: string,
        newTitle: string,
        modified?: " [Modified]" | ""
    },

    "window-will-be-closed-user-select": {
        displayWindowId: string;
        widgetKey: string;
        select: "save" | "don't save" | "cancel";
        fileName: string;
        fileContent: string;
        dataType: type_fileType;
    },

    "duplicate-display": {
        options: {
            tdl: type_tdl;
            mode: "operating" | "editing";
            externalMacros: type_macros_tdl;
            windowId: string,
        },
    },

    /** Also used by `IpcMainWinToMainProc`. */
    "create-blank-display-window": {
        windowId: string,
    },

    "zoom-window": {
        displayWindowId: string,
        zoomDirection: "in" | "out"
    },

    "move-window": {
        displayWindowId: string,
        dx: number,
        dy: number
    },

    "set-window-always-on-top": {
        displayWindowId: string,
        state: boolean
    },

    /** Also used by `IpcMainWinToMainProc`. */
    "open-tdl-file": {
        options: {
            tdl?: type_tdl;
            // tdlStr?: string; // for web mode only, the web mode reads contents of the file (.tdl or .db), but it cannot parse the file contents in browser
            tdlFileNames?: string[];
            mode: "editing" | "operating";
            editable: boolean;
            // external macros: user-provided and parent display macros
            macros: type_macros_tdl;
            replaceMacros: boolean;
            currentTdlFolder?: string;
            windowId: string;
            sendContentsToWindow?: boolean; // whether to send the file contents back to the display window, for Channel Graph window
        },
    },

    "reload-tdl-file": {
        displayWindowId: string;
        tdlFileName: string;
        mode: "editing" | "operating";
        editable: boolean;
        externalMacros: type_macros_tdl;
        replaceMacros: boolean;
    },

    "save-tdl-file": {
        windowId: string,
        tdl: type_tdl,
        tdlFileName1: string,
    },

    "save-data-to-file": {
        displayWindowId: string,
        // this data must be serializable, e.g. a regular object
        data: any,
        preferredFileTypes: string[],
        fileName: string,
    },

    "new-tdl-rendered": {
        displayWindowId: string,
        windowName: string,
        tdlFileName: string,
        mode: string
    },

    "window-attached-script": {
        displayWindowId: string;
        action: "run" | "terminate";
        script: string
    },

    "tca-get": {
        channelName: string,
        displayWindowId: string,
        widgetKey?: string,
        ioId: number,
        ioTimeout?: number,
        dbrType?: Channel_DBR_TYPES
        useInterval: boolean
    },

    "tca-get-meta": {
        channelName: string,
        displayWindowId: string,
        widgetKey?: string,
        ioId: number,
        timeout?: number
    },

    "fetch-pva-type": {
        channelName: string,
        displayWindowId: string,
        widgetKey?: string,
        ioId: number,
        timeout?: number
    },

    "tca-put": {
        channelName: string,
        displayWindowId: string,
        dbrData: type_dbrData | type_LocalChannel_data,
        ioTimeout: number, // second
        pvaValueField: string,
        ioId?: number,
        waitNotify?: boolean,
    },

    "tca-monitor": {
        displayWindowId: string,
        channelName: string
    },

    "tca-destroy": {
        displayWindowId: string,
        channelName: string
    },

    "show-context-menu": {
        mode: string,
        displayWindowId: string,
        widgetKeys: string[],
        options?: Record<string, any>
    },

    "show-context-menu-sidebar": {
        mode: string,
        displayWindowId: string,
        widgetKeys: string[],
        options?: Record<string, any>
    },

    /** Also used by `IpcMainWinToMainProc`. */
    "create-utility-display-window": {
        utilityType: "Probe" | "PvTable" | "DataViewer" | "ProfilesViewer" | "LogViewer" | "TdlViewer" | "TextEditor" | "Terminal" | "Calculator" | "ChannelGraph" | "CaSnooper" | "Casw" | "Help" | "PvMonitor" | "FileConverter" | "Talhk" | "FileBrowser" | "SeqGraph",
        utilityOptions: Record<string, any>,
        windowId: string
    },


    "processes-info": {
        displayWindowId: string,
        widgetKey: string,
        withThumbnail: boolean
    },

    "epics-stats": {
        displayWindowId: string,
        widgetKey: string,
    },

    "ca-snooper-command": {
        command: "start" | "stop";
        displayWindowId: string;
        widgetKey: string;
    },

    "request-epics-dbd": {
        displayWindowId: string;
        widgetKey: string;
    },

    "ca-sw-command": {
        command: "start" | "stop";
        displayWindowId: string;
        widgetKey: string;
    },

    "fetch-folder-content": {
        displayWindowId: string,
        widgetKey: string,
        folderPath: string,
    },

    "file-browser-command": {
        displayWindowId: string,
        widgetKey: string,
        command: "change-item-name" | "create-tdl-file" | "create-folder",
        folder?: string,
        oldName?: string,
        newName?: string,
        fullFileName?: string,
        fullFolderName?: string
    },

    "fetch-thumbnail": {
        displayWindowId: string,
        widgetKey: string,
        tdlFileName: string
    },

    "select-a-file": {
        options: Record<string, any>,
        fileName1?: string
    },

    /** Also used by `IpcMainWinToMainProc`. */
    "open-webpage": {
        url: string
    },

    "execute-command": {
        displayWindowId: string,
        command: string,
    },

    "terminal-command": {
        displayWindowId: string,
        // bounce back
        widgetKey: string,
        ioId: number,
        // command 
        command: "os.homedir" | "os.userInfo" | "fs.readdir" | "fs.stat" | "fs.isDirectory",
        args: any[],
    },

    "take-screenshot": {
        displayWindowId: string,
        destination: "file" | "clipboard" | "folder",
    },

    "print-display-window": {
        displayWindowId: string,
    },

    "request-archive-data": {
        displayWindowId: string,
        widgetKey: string,
        channelName: string,
        startTime: number, // ms since epoch // string, // "2024-01-01 01:23:45", no ms
        endTime: number, // string,
    },

    "register-log-viewer": {

    }

    "file-converter-command": {
        command: "start",
        src: string,
        dest: string,
        depth: number,
        displayWindowId: string,
        widgetKey: string,
    } |
    {
        command: "stop",
        displayWindowId: string,
    },

    "save-video-file": {
        displayWindowId: string,
        fileName: string,
        fileContents: string, // base64 data
    },

    "save-text-file": {
        displayWindowId: string,
        widgetKey: string,
        fileName: string, // if "", it is "save as"
        fileContents: string,
    },

    "get-media-content": {
        fullFileName: string,
        widgetKey: string,
        displayWindowId: string,
    },

    "ping": {
        displayWindowId: string,
        id: string,
        time: number,
    },

    "read-embedded-display-tdl": {
        displayWindowId: string,
        widgetKey: string,
        tdlFileName: string,
        currentTdlFolder: string,
        macros: type_macros_tdl,
        widgetWidth: number,
        widgetHeight: number,
        resize: "none" | "crop" | "fit",
    },

    "open-text-file": {
        displayWindowId: string,
        widgetKey: string,
        fileName: string,
        fileContent: string,
        manualOpen: boolean,
        openNewWindow: boolean,
    }

};

/**
 * Input argument types for IPC messages sent from the MainWindow renderer to
 * the main process.
 *
 * Payloads for events sent by both window types are defined in
 * `IpcDispWinToMainProc` and referenced here.
 */
export type IpcMainWinToMainProc = {
    "new-tdm-process": {},

    "input-file-path": IpcDispWinToMainProc["input-file-path"],

    "quit-tdm-process": IpcDispWinToMainProc["quit-tdm-process"],

    "websocket-ipc-connected-on-main-window": {
        processId: string,
        windowId: string,
        reconnect: boolean,
    },

    "profile-selected": {
        selectedProfileName: string;
        args?: type_args;
        openDefaultDisplayWindows?: boolean;
    },

    "focus-window": IpcDispWinToMainProc["focus-window"],

    "close-window": IpcDispWinToMainProc["close-window"],

    "open-default-display-windows": {
        windowId: string,
    },

    "create-blank-display-window": IpcDispWinToMainProc["create-blank-display-window"],

    "open-tdl-file": IpcDispWinToMainProc["open-tdl-file"],

    "main-window-show-context-menu": {
        menu: ("copy" | "cut" | "paste")[]
    },

    "create-utility-display-window": IpcDispWinToMainProc["create-utility-display-window"],

    "open-profiles": {
        profilesFileName1?: string
    },

    "save-profiles": {
        modifiedProfiles: Record<string, any>,
        filePath1?: string
    },

    "save-profiles-as": {
        modifiedProfiles: Record<string, any>,
        filePath1?: string
    },

    "open-webpage": IpcDispWinToMainProc["open-webpage"],
};


/**
 * Input argument types for IPC event handlers in DisplayWindow
 * Data is sent from Main Process to Display Window
 */
export type IpcMainProcToDispWin = {
    "context-menu-command": {
        command: string,
        subcommand?: string | string[] | [string, boolean]
    },

    "get-symbol-gallery-reply": {
        displayWindowId: string,
        widgetKey: string,
        pageNames: string[],
        page: number,
        pageImages: Record<string, string>,
    }

    "load-db-file-contents-reply": {
        dbFileName: string;
        displayWindowId: string;
        widgetKey: string;
        dbFileContents: Record<string, any>[];
    }

    "new-channel-data": {
        newDbrData: Record<string, type_pva_value | type_pva_value[] | type_dbrData | type_dbrData[] | type_LocalChannel_data | undefined>
    },

    "new-archive-data": {
        displayWindowId: string,
        widgetKey: string,
        channelName: string,
        startTime: number, // ms since epoch // "2024-01-01 01:23:45", no ms
        endTime: number,
        archiveData: [number[], number[]],
    },

    "new-tdl": {
        newTdl: type_tdl;
        tdlFileName: string; // full name, or ""
        initialModeStr: "editing" | "operating";
        editable: boolean;
        externalMacros: type_macros_tdl;
        useExternalMacros: boolean;
        utilityType?: "Probe" | "PvTable" | "DataViewer" | "ProfilesViewer" | "LogViewer" | "TdlViewer" | "TextEditor" | "Terminal" | "Calculator" | "ChannelGraph" | "Help" | "Casw" | "PvMonitor" | "CaSnooper" | "FileConverter" | "Talhk" | "FileBrowser" | "SeqGraph";
        utilityOptions?: Record<string, any>;
    },

    "selected-profile-contents": {
        contents: Record<string, any>
    },

    "tca-get-result": {
        ioId: number,
        widgetKey?: string,
        newDbrData: type_dbrData | type_pva_value
    },

    "tca-put-result": {
        channelName: string,
        displayWindowId: string,
        ioId: number,
        waitNotify: boolean,
        status?: number | type_pva_status, // undefined if the CA operation fails, the IO ID for synchronous version (waitNotify = false), the ECA status code for asynchronous version (waitNotify = true). PVA always returns a Status
    },

    "fetch-pva-type-reply": {
        channelName: string,
        widgetKey?: string,
        fullPvaType: any,
        ioId: number
    },

    "dialog-show-message-box": {
        info: type_DialogMessageBox
    },


    "dialog-show-input-box": {
        info: type_DialogInputBox,
    },

    "tdl-file-saved": {
        newTdlFileName: string
    },

    "select-a-file-reply": {
        options: Record<string, any>,
        fileName: string
    },

    "widget-specific-action": {
        widgetKey: string,
        actionName: string
    },

    "local-font-names": {
        localFontNames: string[]
    },

    "start-record-video": {
        sourceId: string,
        folder: string
    },

    "window-will-be-closed": {

    },

    "request-epics-dbd-reply": {
        widgetKey: string;
        menus: Record<string, any>,
        recordTypes: Record<string, any>,
    },

    "show-about-tdm": {
        info: type_about_info
    },

    "terminal-command-result": {
        widgetKey: string,
        ioId: number,
        command: string,
        result: any[],
    },

    "processes-info-reply": {
        widgetKey: string,
        processesInfo: {
            "Type": string;
            "Window ID": string;
            "Visible": string;
            "TDL file name": string;
            "Window name": string;
            "Editable": string;
            "Uptime [second]": number;
            "Process ID": number;
            "CPU usage [%]": number;
            "Memory usage [MB]": number;
            "Thumbnail": string;
        }[];
    },

    "epics-stats-reply": {
        widgetKey: string,
        epicsStats: {
            udp: Record<string, any>,
            tcp: Record<string, Record<string, any>>,
        };
    },

    "ca-snooper-data": {
        data: {
            msSinceEpoch: number,
            channelName: string,
            ip: string, // source IP address
            port: number, // source port
        }[],
    },

    "ca-sw-data": {
        data: {
            msSinceEpoch: number,
            channelName: string,
            ip: string, // source IP address
            port: number, // source port
        }[],
    },

    "text-file-contents": {
        displayWindowId: string,
        widgetKey: string
        fileName: string,
        fileContent: string,
        readable: boolean,
        writable: boolean,
    },

    "update-text-editor-file-name": {
        displayWindowId: string,
        widgetKey: string,
        fileName: string
    },

    "update-text-editor-modified-status": {
        displayWindowId: string,
        widgetKey: string,
    },

    "new-log": {
        data: type_logData
    },

    "file-converter-command-reply": {
        type: "one-file-conversion-started" | "one-file-conversion-finished" | "all-file-conversion-finished",
        widgetKey: string,
        srcFileName?: string,
        destFileName?: string,
        status: "success" | "converting" | "failed",
        timeDurationMs?: number, // ms
        numWidgetsOrig?: number, // number of widgets in edl file
        numWidgetsTdl?: number, // number of widgets in tdl file
    },

    "fetch-folder-content-reply": {
        widgetKey: string,
        folderContent: type_folder_content,
        success?: boolean, // false if failed, otherwise success
    },

    "file-browser-command-reply": {
        displayWindowId: string,
        widgetKey: string,
        command: "change-item-name" | "create-tdl-file" | "create-folder",
        folder?: string,
        oldName?: string,
        newName?: string,
        fullFileName?: string,
        success: boolean,
    },

    "fetch-thumbnail-reply": {
        widgetKey: string,
        tdlFileName: string,
        image: string,
    },

    "site-info": {
        site: string
    },

    "open-display-window-in-web-browser": {
        displayWindowId: string,
    },

    "get-media-content-reply": {
        displayWindowId: string,
        widgetKey: string,
        content: string,
    },

    "pong": {
        displayWindowId: string,
        id: string,
        time: number,
    },

    "read-embedded-display-tdl-reply": {
        displayWindowId: string,
        widgetKey: string,
        macros: type_macros_tdl,
        fullTdlFileName?: string,
        tdl?: type_tdl,
        widgetWidth: number,
        widgetHeight: number,
        resize: "none" | "crop" | "fit",
        tdlFileName: string,
    },

    "bounce-back": {
        eventName: string,
        data: any,
    },
}

/**
 * Input argument types for IPC event handlers in MainWindow
 */

export type IpcMainProcToMainWin = {
    "after-main-window-gui-created": {
        profiles: Record<string, any>,
        profilesFileName: string,
        envDefault: Record<string, any>,
        envOs: Record<string, any>,
        logFileName: string,
        site: string
    },

    "after-profile-selected": {
        profileName: string
    },

    "new-thumbnail": {
        data: Record<
            string,
            {
                image: string;
                windowName?: string;
                tdlFileName?: string;
            } | undefined | null
        >
    },

    "update-ws-opener-port": {
        newPort: number
    },

    "cmd-line-selected-profile": {
        cmdLineSelectedProfile: string,
        args: type_args
    },

    // no prompt on main window, placeholder
    "show-prompt": {
        data: {
            type: "",
        } & Record<string, any>
    },

    "show-about-tdm": {
        info: type_about_info
    },
    "dialog-show-message-box": {
        info: type_DialogMessageBox
    },

    "dialog-show-input-box": {
        info: type_DialogInputBox,
    },

    "log-file-name": {
        logFileName: string
    },

}
