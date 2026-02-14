/**
 * This file can be imported by both main and renderer process.
 */

import { Channel_DBR_TYPES, type_dbrData } from "./GlobalVariables";
import { type_LocalChannel_data } from "./GlobalVariables";
import { type_tdl } from "./GlobalVariables";


/**
 * Input argument types for command line.
 * 
 * It is the return type of `ArgParser.parseArgs()`.
 * 
 * For "--attach" option, nominally it is port number of opener websocket, > 0
 * 
 */
export type type_args = {
    macros: [string, string][];
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
    mainProcessMode: "desktop" | "web" | "ssh-server" | "ssh-client"; // "ssh-client" mode process can only be created inside the program
    httpServerPort: number;
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
    // messageType: "save" | "warning" | "info", // symbol
    humanReadableMessages: string[], // each string has a new line
    buttons?: type_DialogInputBoxButton[],
    defaultInputText: string,
    attachment?: any,
};


/**
 * Input argument types for IPC event handlers in main process.
 * Data is sent from Display Window (not Main Window) to main process.
 * 
 * For the event handler in main process, it is used like
 * `handlerWebSocketIpcConnected(event: any, options: IpcEventArgType["websocket-ipc-connected])`
 * 
 * For event sender in renderer process, it is used like
 * `sendFromRendererProcess("websocket-ipc-connected", {processId: "0", windowId: "0-1"})`
 * where the `options` argument is checked and enforced by TypeScript. 
 * The `sendFromRendererProcess()` function uses the `IpcEventArgType` for type check.
 * 
 */
export type IpcEventArgType = {

    "new-tdm-process": {

    },

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

    "quit-tdm-process": {
        confirmToQuit?: boolean
    }

    "websocket-ipc-connected-on-display-window": {
        processId: string,
        windowId: string,
        reconnect: boolean,
    },

    "websocket-ipc-connected-on-main-window": {
        processId: string,
        windowId: string,
        reconnect: boolean,
    },

    "profile-selected": {
        selectedProfileName: string;
        args?: type_args;
        openDefaultDisplayWindows?: boolean;
    };

    "bring-up-main-window": {

    }

    "focus-window": {
        displayWindowId: string
    },

    "close-window": {
        displayWindowId: string
    },

    "set-window-title": {
        windowId: string,
        newTitle: string,
        modified?: " [Modified]" | ""
    },

    "window-will-be-closed": {
        displayWindowId: string;
        close: boolean;
        tdlFileName?: string;
        tdl?: type_tdl;
        // try to save the contents if we are closing a TextEditor utility window
        textEditorFileName?: string;
        textEditorContents?: string;
        dataViewerData?: Record<string, Record<string, number[] | string[]>>;
        widgetKey?: string;
        saveConfirmation?: "Save" | "Don't Save" | "Cancel",
    },

    "main-window-will-be-closed": {
        mainWindowId: string,
        close: boolean,
    },

    "open-default-display-windows": {
        windowId: string,
    },


    "duplicate-display": {
        options: {
            tdl: type_tdl;
            mode: "operating" | "editing";
            externalMacros: [string, string][];
            windowId: string,
        },
    },

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

    "open-tdl-file": {
        options: {
            tdl?: type_tdl;
            // tdlStr?: string; // for web mode only, the web mode reads contents of the file (.tdl or .db), but it cannot parse the file contents in browser
            tdlFileNames?: string[];
            mode: "editing" | "operating";
            editable: boolean;
            // external macros: user-provided and parent display macros
            macros: [string, string][];
            replaceMacros: boolean;
            currentTdlFolder?: string;
            windowId: string;
            sendContentsToWindow?: boolean; // whether to send the file contents back to the display window, for Channel Graph window
        },
    },

    "load-tdl-file": {
        displayWindowId: string;
        tdlFileName: string;
        mode: "editing" | "operating";
        editable: boolean;
        externalMacros: [string, string][];
        replaceMacros: boolean;
        currentTdlFolder?: string;
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
        fileName?: string,
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

    "main-window-show-context-menu": {
        menu: ("copy" | "cut" | "paste")[]
    },

    "create-utility-display-window": {
        utilityType: "Probe" | "PvTable" | "DataViewer" | "ProfilesViewer" | "LogViewer" | "TdlViewer" | "TextEditor" | "Terminal" | "Calculator" | "ChannelGraph" | "CaSnooper" | "Casw" | "Help" | "PvMonitor" | "FileConverter" | "Talhk" | "FileBrowser" | "SeqGraph",
        utilityOptions: Record<string, any>,
        windowId: string
    },


    "data-viewer-export-data": {
        displayWindowId: string,
        data: Record<
            string,
            {
                Time: string[];
                Data: number[];
            }
        >,
        fileName1?: string
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

    "select-a-file": {
        options: Record<string, any>,
        fileName1?: string
    },

    "obtain-iframe-uuid": {
        displayWindowId: string;
        widgetKey: string;
        mode: "editing" | "operating";
        tdl?: type_tdl,
        tdlFileName: string;
        macros: [string, string][];
        currentTdlFolder: string;
        replaceMacros: boolean;
    },

    "close-iframe-display": {
        displayWindowId: string;

    },

    "switch-iframe-display-tab": {
        displayWindowId: string;
        widgetKey: string;
        mode: "editing" | "operating";
        tdlFileName: string;
        macros: [string, string][];
        currentTdlFolder: string;
        // old iframe display id
        iframeDisplayId: string;

    },

    "open-webpage": {
        url: string
    },

    "execute-command": {
        displayWindowId: string,
        command: string,
    },

    "ssh-password-prompt-result": {
        password: string,
        sshMainProcessId: string,
    },

    "cancel-ssh-connection": {
        sshMainProcessId: string,
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

    "unregister-log-viewer": {

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
    },

    "save-video-file": {
        displayWindowId: string,
        fileName: string,
        fileContents: string, // base64 data
    },

    "open-text-file-in-text-editor": {
        displayWindowId: string,
        widgetKey: string,
        fileName: string, // when "", do not open anything, when not "", open whatever we have
        manualOpen: boolean, // use dialog to open, valid only when fileName is empty (""), if true, open the dialog to choose file, if false, open whatever we have
        openNewWindow: boolean, // open in new TextEditor window, without using the dialog
        largeFileConfirmOpen?: "Yes" | "No", // if the file is large, confirm to open it
        fileContents?: string, // if undefined, open the above file, if a string, show the string
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
        macros: [string, string][],
        widgetWidth: number,
        widgetHeight: number,
        resize: "none" | "crop" | "fit",
    },

    "update-profiles": {
        windowId: string
    }

};


/**
 * Input argument types for IPC event handlers in DisplayWindow
 * Data is sent from Main Process to Display Window
 */
export type IpcEventArgType2 = {
    "context-menu-command": {
        command: string,
        subcommand?: string | string[] | [string, boolean]
    },

    "get-symbol-gallery": {
        displayWindowId: string,
        widgetKey: string,
        pageNames: string[],
        page: number,
        pageImages: Record<string, string>,
    }

    "load-db-file-contents": {
        dbFileName: string;
        displayWindowId: string;
        widgetKey: string;
        dbFileContents: Record<string, any>[];
    }

    "new-channel-data": {
        newDbrData: Record<string, type_dbrData | type_dbrData[] | type_LocalChannel_data | undefined>
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
        externalMacros: [string, string][];
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
        newDbrData: type_dbrData
    },

    "tca-put-result": {
        channelName: string,
        displayWindowId: string,
        ioId: number,
        waitNotify: boolean,
        status?: number | type_pva_status, // undefined if the CA operation fails, the IO ID for synchronous version (waitNotify = false), the ECA status code for asynchronous version (waitNotify = true). PVA always returns a Status
    },

    "fetch-pva-type": {
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

    "select-a-file": {
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

    "obtained-iframe-uuid": {
        widgetKey: string;
        iframeDisplayId: string;
        tdlBackgroundColor: string;
        tdlCanvasWidth: number | string;
        tdlCanvasHeight: number | string;
    },

    "request-epics-dbd": {
        widgetKey: string;
        menus: Record<string, any>,
        recordTypes: Record<string, any>,
    },

    "ssh-file-contents": {
        displayWindowId: string,
        widgetKey: string,
        fullFileName: string,
        fileContents: string,
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

    "processes-info": {
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

    "epics-stats": {
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
        fileContents: string,
        readable: boolean,
        writable: boolean,
    },

    "save-text-file-status": {
        displayWindowId: string,
        widgetKey: string,
        status: "success" | "fail",
        fileName: string
    },

    "new-log": {
        data: type_logData
    },

    "file-converter-command": {
        type: "one-file-conversion-started" | "one-file-conversion-finished" | "all-file-conversion-finished",
        widgetKey: string,
        srcFileName?: string,
        destFileName?: string,
        status: "success" | "converting" | "failed",
        timeDurationMs?: number, // ms
        numWidgetsOrig?: number, // number of widgets in edl file
        numWidgetsTdl?: number, // number of widgets in tdl file
    },

    "fetch-folder-content": {
        widgetKey: string,
        folderContent: type_folder_content,
        success?: boolean, // false if failed, otherwise success
    },

    "file-browser-command": {
        displayWindowId: string,
        widgetKey: string,
        command: "change-item-name" | "create-tdl-file" | "create-folder",
        folder?: string,
        oldName?: string,
        newName?: string,
        fullFileName?: string,
        success: boolean,
    },

    "fetch-thumbnail": {
        widgetKey: string,
        tdlFileName: string,
        image: string,
    },

    "site-info": {
        site: string
    },

    "display-window-id-for-open-tdl-file": {
        displayWindowId: string,
    },

    "get-media-content": {
        displayWindowId: string,
        widgetKey: string,
        content: string,
    },

    "pong": {
        displayWindowId: string,
        id: string,
        time: number,
    },

    "read-embedded-display-tdl": {
        displayWindowId: string,
        widgetKey: string,
        macros: [string, string][],
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

    "update-profiles": {
        windowId: string,
        profilesJson: Record<string, any>,
        profilesFullFileName: string,
    }
}

/**
 * Input argument types for IPC event handlers in MainWindow
 */

export type IpcEventArgType3 = {
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

    "show-prompt": {
        data: {
            type: "ssh-password-input" | "ssh-connection-waiting",
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

    "window-will-be-closed": {

    },

    "log-file-name": {
        logFileName: string
    },

    "update-profiles": {
        windowId: string,
        profilesJson: Record<string, any>,
        profilesFullFileName: string,
    },

    "bounce-back": {
        eventName: string,
        data: any,
    },

}