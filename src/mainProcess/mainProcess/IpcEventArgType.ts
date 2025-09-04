import { Channel_DBR_TYPES, type_dbrData } from "../../rendererProcess/global/GlobalVariables";
import { type_args } from "../arg/ArgParser";
import { type_LocalChannel_data } from "../channel/LocalChannelAgent";
import { type_tdl } from "../file/FileReader";



export type IpcEventArgType = {

    "new-tdm-process": {

    },

    "quit-tdm-process": {
        confirmToQuit?: boolean
    }

    "websocket-ipc-connected": {
        processId: string,
        windowId: string,
    },

    "profile-selected": {
        selectedProfileName: string;
        args?: type_args;
        httpResponse?: any;
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

    },


    "duplicate-display": {
        options: {
            tdl: type_tdl;
            mode: "operating" | "editing";
            externalMacros: [string, string][];
        },
        httpResponse?: any
    },

    "create-blank-display-window": {
        displayWindowId: string,
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
            tdlStr?: string; // for web mode only, the web mode reads contents of the file (.tdl or .db), but it cannot parse the file contents in browser
            tdlFileNames?: string[];
            mode: "editing" | "operating";
            editable: boolean;
            // external macros: user-provided and parent display macros
            macros: [string, string][];
            replaceMacros: boolean;
            currentTdlFolder?: string;
            windowId?: string;
            postCommand?: string;
            sendContentsToWindow?: boolean; // whether to send the file contents back to the display window, for Channel Graph window
        },
        httpResponse?: any
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
        httpResponse?: any
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

    "save-text-file":
    {
        displayWindowId: string,
        widgetKey: string,
        fileName: string, // if "", it is "save as"
        fileContents: string,
    }

};

