/**
 * This file can be imported by both main and renderer process.
 */

import { type_pva_status } from "epics-tca";
import { Channel_DBR_TYPES, type_dbrData, type_pva_value } from "../EpicsTcaLib";
import { type_LocalChannel_data } from "../GlobalVariables";
import { type_tdl } from "../GlobalVariables";
import { Log } from "../Log";
import { type_macros_tdl, verifyTdl } from "./type_widget_tdl";

/**
 * Input argument types for command line.
 * 
 * It is the return type of `ArgParser.parseArgs()`.
 * 
 * For "--attach" option, nominally it is port number of opener websocket, > 0
 * 
 */
export type type_input_args = {
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

export type type_DialogMessageBoxButton = { text: string, handleClick?: undefined | ((dialogInputText?: string) => void) };
type type_DialogInputBoxButton = type_DialogMessageBoxButton;

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


// ======================== IPC runtime schema ========================

type type_IpcValidationError = {
    path: string;
    expected: string;
    received: string;
    value: unknown;
};

type type_IpcValueSchema<T = unknown> = {
    kind: "string" | "number" | "boolean" | "literal" | "optional" | "array" | "tuple" | "record" | "object" | "union" | "custom" | "unknown";
    expected: string;
    values?: readonly unknown[];
    item?: type_IpcValueSchema;
    items?: readonly type_IpcValueSchema[];
    fields?: Readonly<Record<string, type_IpcValueSchema>>;
    alternatives?: readonly type_IpcValueSchema[];
    allowUnknownFields?: boolean;
    validator?: (value: unknown) => boolean;
    /** Compile-time-only carrier for the value represented by this schema. */
    readonly __type?: T;
};

type InferIpcValueSchema<S extends type_IpcValueSchema<any>> =
    S extends type_IpcValueSchema<infer T> ? T : never;

type type_IpcOptionalValueSchema<T> = type_IpcValueSchema<T | undefined> & {
    kind: "optional";
};

type IpcOptionalFieldKeys<F extends Readonly<Record<string, type_IpcValueSchema<any>>>> = {
    [K in keyof F]-?: F[K] extends type_IpcOptionalValueSchema<any> ? K : never;
}[keyof F];

type InferIpcObjectFields<F extends Readonly<Record<string, type_IpcValueSchema<any>>>> =
    keyof F extends never
    ? Record<string, never>
    : {
        [K in Exclude<keyof F, IpcOptionalFieldKeys<F>>]: InferIpcValueSchema<F[K]>;
    } & {
        [K in IpcOptionalFieldKeys<F>]?: InferIpcValueSchema<F[K]>;
    };

type InferIpcEventMap<R extends Readonly<Record<string, type_IpcValueSchema<any>>>> = {
    [K in keyof R]: InferIpcValueSchema<R[K]>;
};

const ipcString = (): type_IpcValueSchema<string> => ({ kind: "string", expected: "string" });
const ipcNumber = (): type_IpcValueSchema<number> => ({ kind: "number", expected: "finite number" });
const ipcBoolean = (): type_IpcValueSchema<boolean> => ({ kind: "boolean", expected: "boolean" });

const ipcLiteral = <const T extends readonly (string | number | boolean | null)[]>(...values: T): type_IpcValueSchema<T[number]> => ({
    kind: "literal",
    expected: values.map((value) => JSON.stringify(value)).join(" | "),
    values: values,
});

const ipcOptional = <T>(item: type_IpcValueSchema<T>): type_IpcOptionalValueSchema<T> => ({
    kind: "optional",
    expected: `${item.expected} | undefined`,
    item: item,
});

const ipcArray = <S extends type_IpcValueSchema<any>>(item: S): type_IpcValueSchema<InferIpcValueSchema<S>[]> => ({
    kind: "array",
    expected: `Array<${item.expected}>`,
    item: item,
});

const ipcTuple = <const S extends readonly type_IpcValueSchema<any>[]>(items: S): type_IpcValueSchema<{
    -readonly [K in keyof S]: InferIpcValueSchema<S[K]>;
}> => ({
    kind: "tuple",
    expected: `[${items.map((item) => item.expected).join(", ")}]`,
    items: items,
});

const ipcRecord = <S extends type_IpcValueSchema<any>>(item: S): type_IpcValueSchema<Record<string, InferIpcValueSchema<S>>> => ({
    kind: "record",
    expected: `Record<string, ${item.expected}>`,
    item: item,
});

const ipcObject = <const F extends Readonly<Record<string, type_IpcValueSchema<any>>>>(
    fields: F,
    allowUnknownFields: boolean = false,
): type_IpcValueSchema<InferIpcObjectFields<F>> => ({
    kind: "object",
    expected: `object {${Object.keys(fields).join(", ")}}`,
    fields: fields,
    allowUnknownFields: allowUnknownFields,
});

const ipcUnion = <const S extends readonly type_IpcValueSchema<any>[]>(...alternatives: S): type_IpcValueSchema<InferIpcValueSchema<S[number]>> => ({
    kind: "union",
    expected: alternatives.map((alternative) => alternative.expected).join(" | "),
    alternatives: alternatives,
});

const ipcCustom = <T>(expected: string, validator: (value: unknown) => boolean): type_IpcValueSchema<T> => ({
    kind: "custom",
    expected: expected,
    validator: validator,
});

/**
 * Explicit escape hatch for fields currently declared as `any` or for complex
 * imported library values that do not yet have their own runtime schema.
 */
const ipcUnknown = <T = unknown>(expected: string = "any value"): type_IpcValueSchema<T> => ({
    kind: "unknown",
    expected: expected,
});

const describeIpcValue = (value: unknown): string => {
    if (value === null) {
        return "null";
    }
    if (Array.isArray(value)) {
        return "array";
    }
    if (value === undefined) {
        return "undefined";
    }
    return typeof value;
};

const createIpcValidationError = (path: string, schema: type_IpcValueSchema, value: unknown): type_IpcValidationError => ({
    path: path === "" ? "(root)" : path,
    expected: schema.expected,
    received: describeIpcValue(value),
    value: value,
});

const getIpcValueValidationError = (
    value: unknown,
    schema: type_IpcValueSchema,
    path: string = "",
): type_IpcValidationError | undefined => {
    switch (schema.kind) {
        case "unknown":
            return undefined;
        case "string":
            return typeof value === "string" ? undefined : createIpcValidationError(path, schema, value);
        case "number":
            return typeof value === "number" && Number.isFinite(value) ? undefined : createIpcValidationError(path, schema, value);
        case "boolean":
            return typeof value === "boolean" ? undefined : createIpcValidationError(path, schema, value);
        case "literal":
            return schema.values?.some((allowedValue) => Object.is(allowedValue, value)) === true
                ? undefined
                : createIpcValidationError(path, schema, value);
        case "optional":
            return value === undefined
                ? undefined
                : getIpcValueValidationError(value, schema.item!, path);
        case "array": {
            if (!Array.isArray(value)) {
                return createIpcValidationError(path, schema, value);
            }
            for (let index = 0; index < value.length; index++) {
                const error = getIpcValueValidationError(value[index], schema.item!, `${path}[${index}]`);
                if (error !== undefined) {
                    return error;
                }
            }
            return undefined;
        }
        case "tuple": {
            if (!Array.isArray(value) || value.length !== schema.items?.length) {
                return createIpcValidationError(path, schema, value);
            }
            for (let index = 0; index < value.length; index++) {
                const error = getIpcValueValidationError(value[index], schema.items![index], `${path}[${index}]`);
                if (error !== undefined) {
                    return error;
                }
            }
            return undefined;
        }
        case "record": {
            if (typeof value !== "object" || value === null || Array.isArray(value)) {
                return createIpcValidationError(path, schema, value);
            }
            for (const [key, item] of Object.entries(value)) {
                const error = getIpcValueValidationError(item, schema.item!, path === "" ? key : `${path}.${key}`);
                if (error !== undefined) {
                    return error;
                }
            }
            return undefined;
        }
        case "object": {
            if (typeof value !== "object" || value === null || Array.isArray(value)) {
                return createIpcValidationError(path, schema, value);
            }
            const record = value as Record<string, unknown>;
            const fields = schema.fields ?? {};
            for (const [key, fieldSchema] of Object.entries(fields)) {
                const error = getIpcValueValidationError(record[key], fieldSchema, path === "" ? key : `${path}.${key}`);
                if (error !== undefined) {
                    return error;
                }
            }
            if (schema.allowUnknownFields !== true) {
                for (const key of Object.keys(record)) {
                    if (!Object.prototype.hasOwnProperty.call(fields, key)) {
                        return {
                            path: path === "" ? key : `${path}.${key}`,
                            expected: "no additional field",
                            received: describeIpcValue(record[key]),
                            value: record[key],
                        };
                    }
                }
            }
            return undefined;
        }
        case "union": {
            const alternatives = schema.alternatives ?? [];
            return alternatives.some((alternative) => getIpcValueValidationError(value, alternative, path) === undefined)
                ? undefined
                : createIpcValidationError(path, schema, value);
        }
        case "custom":
            try {
                return schema.validator?.(value) === true ? undefined : createIpcValidationError(path, schema, value);
            } catch {
                return createIpcValidationError(path, schema, value);
            }
    }
};


// ================= Renderer-to-main IPC schema registries =================

const ipcAnyRecord = (): type_IpcValueSchema<Record<string, any>> => ipcRecord(ipcUnknown<any>("JSON-compatible value"));
const ipcAnyArray = (): type_IpcValueSchema<any[]> => ipcArray(ipcUnknown<any>("JSON-compatible value"));

const ipcMacrosSchema: type_IpcValueSchema<type_macros_tdl> = ipcArray(
    ipcTuple([ipcString(), ipcString()])
);

const ipcTdlSchema: type_IpcValueSchema<type_tdl> = ipcCustom<type_tdl>("valid TDL", (value) => {
    try {
        // do not verify TDL here, let the Widget do it
        // verifyTdl(value);
        return true;
    } catch(e) {
        Log.error(e);
        return false;
    }
});

const ipcInputArgsSchema: type_IpcValueSchema<type_input_args> = ipcObject({
    macros: ipcMacrosSchema,
    settings: ipcString(),
    profile: ipcString(),
    alsoOpenDefaults: ipcBoolean(),
    fileNames: ipcArray(ipcString()),
    attach: ipcNumber(),
    flexibleAttach: ipcBoolean(),
    cwd: ipcString(),
    mainProcessMode: ipcLiteral("desktop", "web"),
    httpServerPort: ipcNumber(),
    httpServerBasePath: ipcString(),
    site: ipcString(),
});

const ipcInputFilePathSchema = ipcObject({
    windowId: ipcString(),
    fileName: ipcString(),
});

const ipcQuitTdmProcessSchema = ipcObject({
    confirmToQuit: ipcBoolean(),
});

const ipcFocusWindowSchema = ipcObject({
    displayWindowId: ipcString(),
});

const ipcCloseWindowSchema = ipcObject({
    displayWindowId: ipcString(),
});

const ipcCreateBlankDisplayWindowSchema = ipcObject({
    windowId: ipcString(),
});

const ipcOpenTdlFileSchema = ipcObject({
    tdl: ipcOptional(ipcTdlSchema),
    tdlFileNames: ipcOptional(ipcArray(ipcString())),
    mode: ipcLiteral("editing", "operating"),
    editable: ipcBoolean(),
    macros: ipcMacrosSchema,
    replaceMacros: ipcBoolean(),
    currentTdlFolder: ipcOptional(ipcString()),
    windowId: ipcString(),
    sendContentsToWindow: ipcOptional(ipcBoolean()),
});

const ipcCreateUtilityDisplayWindowSchema = ipcObject({
    utilityType: ipcLiteral(
        "Probe", "PvTable", "DataViewer", "ProfilesViewer", "LogViewer", "TdlViewer", "TextEditor", "Terminal",
        "Calculator", "ChannelGraph", "CaSnooper", "Casw", "Help", "PvMonitor", "FileConverter", "Talhk",
        "FileBrowser", "SeqGraph"
    ),
    utilityOptions: ipcAnyRecord(),
    windowId: ipcString(),
});

const ipcOpenWebpageSchema = ipcObject({
    url: ipcString(),
});

const IpcDispWinToMainProcSchema = {
    "input-file-path": ipcInputFilePathSchema,
    "get-symbol-gallery": ipcObject({
        page: ipcNumber(),
        displayWindowId: ipcString(),
        widgetKey: ipcString(),
        update: ipcOptional(ipcBoolean()),
    }),
    "load-db-file-contents": ipcObject({
        dbFileName: ipcOptional(ipcString()),
        displayWindowId: ipcString(),
        widgetKey: ipcString(),
    }),
    "quit-tdm-process": ipcQuitTdmProcessSchema,
    "websocket-ipc-connected-on-display-window": ipcObject({
        processId: ipcString(),
        windowId: ipcString(),
        reconnect: ipcBoolean(),
    }),
    "bring-up-main-window": ipcObject({}),
    "focus-window": ipcFocusWindowSchema,
    "close-window": ipcCloseWindowSchema,
    "set-window-title": ipcObject({
        windowId: ipcString(),
        newTitle: ipcString(),
        modified: ipcOptional(ipcLiteral(" [Modified]", "")),
    }),
    "window-will-be-closed-user-select": ipcObject({
        displayWindowId: ipcString(),
        widgetKey: ipcString(),
        select: ipcLiteral("save", "don't save", "cancel"),
        fileName: ipcString(),
        fileContent: ipcString(),
        dataType: ipcLiteral("tdl", "db", "data-viewer", "text", "media", "script", "file-converter", "picture"),
    }),
    "duplicate-display": ipcObject({
        options: ipcObject({
            tdl: ipcTdlSchema,
            mode: ipcLiteral("operating", "editing"),
            externalMacros: ipcMacrosSchema,
            windowId: ipcString(),
        }),
    }),
    "create-blank-display-window": ipcCreateBlankDisplayWindowSchema,
    "zoom-window": ipcObject({
        displayWindowId: ipcString(),
        zoomDirection: ipcLiteral("in", "out"),
    }),
    "move-window": ipcObject({
        displayWindowId: ipcString(),
        dx: ipcNumber(),
        dy: ipcNumber(),
    }),
    "set-window-always-on-top": ipcObject({
        displayWindowId: ipcString(),
        state: ipcBoolean(),
    }),
    "open-tdl-file": ipcOpenTdlFileSchema,
    "open-display-from-tdl": ipcObject({
        tdl: ipcOptional(ipcTdlSchema),
        mode: ipcLiteral("editing", "operating"),
        editable: ipcBoolean(),
        macros: ipcMacrosSchema,
        replaceMacros: ipcBoolean(),
        windowId: ipcString(),
        sendContentsToWindow: ipcOptional(ipcBoolean()),
    }),
    "reload-tdl-file": ipcObject({
        displayWindowId: ipcString(),
        tdlFileName: ipcString(),
        mode: ipcLiteral("editing", "operating"),
        editable: ipcBoolean(),
        externalMacros: ipcMacrosSchema,
        replaceMacros: ipcBoolean(),
    }),
    "save-tdl-file": ipcObject({
        windowId: ipcString(),
        tdl: ipcTdlSchema,
        tdlFileName1: ipcString(),
    }),
    "save-data-to-file": ipcObject({
        displayWindowId: ipcString(),
        data: ipcUnknown<any>("JSON-compatible value"),
        preferredFileTypes: ipcArray(ipcString()),
        fileName: ipcString(),
    }),
    "new-tdl-rendered": ipcObject({
        displayWindowId: ipcString(),
        windowName: ipcString(),
        tdlFileName: ipcString(),
        mode: ipcString(),
    }),
    "window-attached-script": ipcObject({
        displayWindowId: ipcString(),
        action: ipcLiteral("run", "terminate"),
        script: ipcString(),
    }),
    "tca-get": ipcObject({
        channelName: ipcString(),
        displayWindowId: ipcString(),
        widgetKey: ipcOptional(ipcString()),
        ioId: ipcNumber(),
        ioTimeout: ipcOptional(ipcNumber()),
        dbrType: ipcOptional(ipcUnknown<Channel_DBR_TYPES>("Channel_DBR_TYPES")),
        useInterval: ipcBoolean(),
    }),
    "tca-get-meta": ipcObject({
        channelName: ipcString(),
        displayWindowId: ipcString(),
        widgetKey: ipcOptional(ipcString()),
        ioId: ipcNumber(),
        timeout: ipcOptional(ipcNumber()),
    }),
    "fetch-pva-type": ipcObject({
        channelName: ipcString(),
        displayWindowId: ipcString(),
        widgetKey: ipcOptional(ipcString()),
        ioId: ipcNumber(),
        timeout: ipcOptional(ipcNumber()),
    }),
    "tca-put": ipcObject({
        channelName: ipcString(),
        displayWindowId: ipcString(),
        dbrData: ipcUnknown<type_dbrData | type_LocalChannel_data>("DBR or local-channel data"),
        ioTimeout: ipcNumber(),
        pvaValueField: ipcString(),
        ioId: ipcOptional(ipcNumber()),
        waitNotify: ipcOptional(ipcBoolean()),
    }),
    "tca-monitor": ipcObject({
        displayWindowId: ipcString(),
        channelName: ipcString(),
    }),
    "tca-destroy": ipcObject({
        displayWindowId: ipcString(),
        channelName: ipcString(),
    }),
    "show-context-menu": ipcObject({
        mode: ipcString(),
        displayWindowId: ipcString(),
        widgetKeys: ipcArray(ipcString()),
        options: ipcOptional(ipcAnyRecord()),
    }),
    "show-context-menu-sidebar": ipcObject({
        mode: ipcString(),
        displayWindowId: ipcString(),
        widgetKeys: ipcArray(ipcString()),
        options: ipcOptional(ipcAnyRecord()),
    }),
    "create-utility-display-window": ipcCreateUtilityDisplayWindowSchema,
    "processes-info": ipcObject({
        displayWindowId: ipcString(),
        widgetKey: ipcString(),
        withThumbnail: ipcBoolean(),
    }),
    "epics-stats": ipcObject({
        displayWindowId: ipcString(),
        widgetKey: ipcString(),
    }),
    "ca-snooper-command": ipcObject({
        command: ipcLiteral("start", "stop"),
        displayWindowId: ipcString(),
        widgetKey: ipcString(),
    }),
    "request-epics-dbd": ipcObject({
        displayWindowId: ipcString(),
        widgetKey: ipcString(),
    }),
    "ca-sw-command": ipcObject({
        command: ipcLiteral("start", "stop"),
        displayWindowId: ipcString(),
        widgetKey: ipcString(),
    }),
    "fetch-folder-content": ipcObject({
        displayWindowId: ipcString(),
        widgetKey: ipcString(),
        folderPath: ipcString(),
    }),
    "file-browser-command": ipcObject({
        displayWindowId: ipcString(),
        widgetKey: ipcString(),
        command: ipcLiteral("change-item-name", "create-tdl-file", "create-folder"),
        folder: ipcOptional(ipcString()),
        oldName: ipcOptional(ipcString()),
        newName: ipcOptional(ipcString()),
        fullFileName: ipcOptional(ipcString()),
        fullFolderName: ipcOptional(ipcString()),
    }),
    "fetch-thumbnail": ipcObject({
        displayWindowId: ipcString(),
        widgetKey: ipcString(),
        tdlFileName: ipcString(),
    }),
    "select-a-file": ipcObject({
        options: ipcAnyRecord(),
        fileName1: ipcOptional(ipcString()),
    }),
    "open-webpage": ipcOpenWebpageSchema,
    "execute-command": ipcObject({
        displayWindowId: ipcString(),
        command: ipcString(),
    }),
    "terminal-command": ipcObject({
        displayWindowId: ipcString(),
        widgetKey: ipcString(),
        ioId: ipcNumber(),
        command: ipcLiteral("os.homedir", "os.userInfo", "fs.readdir", "fs.stat", "fs.isDirectory"),
        args: ipcAnyArray(),
    }),
    "take-screenshot": ipcObject({
        displayWindowId: ipcString(),
        destination: ipcLiteral("file", "clipboard", "folder"),
    }),
    "print-display-window": ipcObject({
        displayWindowId: ipcString(),
    }),
    "request-archive-data": ipcObject({
        displayWindowId: ipcString(),
        widgetKey: ipcString(),
        channelName: ipcString(),
        startTime: ipcNumber(),
        endTime: ipcNumber(),
    }),
    "register-log-viewer": ipcObject({
        displayWindowId: ipcString(),
        widgetKey: ipcString(),
    }),
    "file-converter-command": ipcUnion(
        ipcObject({
            command: ipcLiteral("start"),
            src: ipcString(),
            dest: ipcString(),
            depth: ipcNumber(),
            displayWindowId: ipcString(),
            widgetKey: ipcString(),
        }),
        ipcObject({
            command: ipcLiteral("stop"),
            displayWindowId: ipcString(),
        })
    ),
    "save-video-file": ipcObject({
        displayWindowId: ipcString(),
        fileName: ipcString(),
        fileContents: ipcString(),
    }),
    "save-text-file": ipcObject({
        displayWindowId: ipcString(),
        widgetKey: ipcString(),
        fileName: ipcString(),
        fileContents: ipcString(),
    }),
    "get-media-content": ipcObject({
        fullFileName: ipcString(),
        widgetKey: ipcString(),
        displayWindowId: ipcString(),
    }),
    "ping": ipcObject({
        displayWindowId: ipcString(),
        id: ipcString(),
        time: ipcNumber(),
    }),
    "read-embedded-display-tdl": ipcObject({
        displayWindowId: ipcString(),
        widgetKey: ipcString(),
        tdlFileName: ipcString(),
        currentTdlFolder: ipcString(),
        macros: ipcMacrosSchema,
        widgetWidth: ipcNumber(),
        widgetHeight: ipcNumber(),
        resize: ipcLiteral("none", "crop", "fit"),
    }),
    "open-text-file": ipcObject({
        displayWindowId: ipcString(),
        widgetKey: ipcString(),
        fileName: ipcString(),
        fileContent: ipcString(),
        manualOpen: ipcBoolean(),
        openNewWindow: ipcBoolean(),
    }),
} as const satisfies Readonly<Record<string, type_IpcValueSchema<any>>>;

const IpcMainWinToMainProcSchema = {
    "new-tdm-process": ipcObject({}),
    "input-file-path": ipcInputFilePathSchema,
    "quit-tdm-process": ipcQuitTdmProcessSchema,
    "websocket-ipc-connected-on-main-window": ipcObject({
        processId: ipcString(),
        windowId: ipcString(),
        reconnect: ipcBoolean(),
    }),
    "profile-selected": ipcObject({
        selectedProfileName: ipcString(),
        args: ipcOptional(ipcInputArgsSchema),
        openDefaultDisplayWindows: ipcOptional(ipcBoolean()),
    }),
    "focus-window": ipcFocusWindowSchema,
    "close-window": ipcCloseWindowSchema,
    "open-default-display-windows": ipcObject({
        windowId: ipcString(),
    }),
    "create-blank-display-window": ipcCreateBlankDisplayWindowSchema,
    "open-tdl-file": ipcOpenTdlFileSchema,
    "main-window-show-context-menu": ipcObject({
        menu: ipcArray(ipcLiteral("copy", "cut", "paste")),
    }),
    "create-utility-display-window": ipcCreateUtilityDisplayWindowSchema,
    "open-profiles": ipcObject({
        profilesFileName1: ipcOptional(ipcString()),
    }),
    "save-profiles": ipcObject({
        modifiedProfiles: ipcAnyRecord(),
        filePath1: ipcOptional(ipcString()),
    }),
    "save-profiles-as": ipcObject({
        modifiedProfiles: ipcAnyRecord(),
        filePath1: ipcOptional(ipcString()),
    }),
    "open-webpage": ipcOpenWebpageSchema,
} as const satisfies Readonly<Record<string, type_IpcValueSchema<any>>>;

// ================= Main-to-renderer IPC schema registries =================

const ipcAboutInfoSchema: type_IpcValueSchema<type_about_info> = ipcObject({
    Authors: ipcArray(ipcString()),
    Organizations: ipcArray(ipcString()),
    Electron: ipcArray(ipcString()),
    Version: ipcArray(ipcString()),
    "Operating System": ipcArray(ipcString()),
    License: ipcArray(ipcString()),
    Chromium: ipcArray(ipcString()),
    "Node.js": ipcArray(ipcString()),
    V8: ipcArray(ipcString()),
    "Build Date": ipcArray(ipcString()),
});

const ipcDialogMessageBoxButtonSchema: type_IpcValueSchema<type_DialogMessageBoxButton> = ipcObject({
    text: ipcString(),
    handleClick: ipcOptional(ipcCustom<(dialogInputText?: string) => void>(
        "function",
        (value) => typeof value === "function",
    )),
});

const ipcDialogMessageBoxSchema: type_IpcValueSchema<type_DialogMessageBox> = ipcObject({
    command: ipcOptional(ipcString()),
    messageType: ipcLiteral("error", "warning", "info"),
    humanReadableMessages: ipcArray(ipcString()),
    rawMessages: ipcArray(ipcString()),
    buttons: ipcOptional(ipcArray(ipcDialogMessageBoxButtonSchema)),
    attachment: ipcOptional(ipcUnknown<any>()),
});

const ipcDialogInputBoxSchema: type_IpcValueSchema<type_DialogInputBox> = ipcObject({
    command: ipcString(),
    humanReadableMessages: ipcArray(ipcString()),
    buttons: ipcOptional(ipcArray(ipcDialogMessageBoxButtonSchema)),
    defaultInputText: ipcString(),
    attachment: ipcOptional(ipcUnknown<any>()),
});

const ipcLogDataSchema: type_IpcValueSchema<type_logData> = ipcObject({
    widgetKey: ipcString(),
    timeMsSinceEpoch: ipcNumber(),
    profileName: ipcString(),
    type: ipcLiteral("fatal", "error", "warn", "info", "debug", "trace"),
    args: ipcAnyArray(),
});

const ipcFolderContentSchema: type_IpcValueSchema<type_folder_content> = ipcArray(ipcObject({
    name: ipcString(),
    type: ipcLiteral("file", "folder"),
    size: ipcNumber(),
    timeModified: ipcNumber(),
}));

const ipcDiagnosticDataSchema = ipcArray(ipcObject({
    msSinceEpoch: ipcNumber(),
    channelName: ipcString(),
    ip: ipcString(),
    port: ipcNumber(),
}));

const ipcMainWindowPromptDataSchema: type_IpcValueSchema<{ type: "" } & Record<string, any>> = ipcObject({
    type: ipcLiteral(""),
}, true);

const IpcMainProcToDispWinSchema = {
    "context-menu-command": ipcObject({
        command: ipcString(),
        subcommand: ipcOptional(ipcUnion(
            ipcString(),
            ipcArray(ipcString()),
            ipcTuple([ipcString(), ipcBoolean()]),
        )),
    }),
    "get-symbol-gallery-reply": ipcObject({
        displayWindowId: ipcString(),
        widgetKey: ipcString(),
        pageNames: ipcArray(ipcString()),
        page: ipcNumber(),
        pageImages: ipcRecord(ipcString()),
    }),
    "load-db-file-contents-reply": ipcObject({
        dbFileName: ipcString(),
        displayWindowId: ipcString(),
        widgetKey: ipcString(),
        dbFileContents: ipcArray(ipcAnyRecord()),
    }),
    "new-channel-data": ipcObject({
        newDbrData: ipcRecord(ipcUnknown<
            type_pva_value | type_pva_value[] | type_dbrData | type_dbrData[] | type_LocalChannel_data | undefined
        >("EPICS or local-channel data")),
    }),
    "new-archive-data": ipcObject({
        displayWindowId: ipcString(),
        widgetKey: ipcString(),
        channelName: ipcString(),
        startTime: ipcNumber(),
        endTime: ipcNumber(),
        archiveData: ipcTuple([ipcArray(ipcNumber()), ipcArray(ipcNumber())]),
    }),
    "new-tdl": ipcObject({
        newTdl: ipcTdlSchema,
        tdlFileName: ipcString(),
        initialModeStr: ipcLiteral("editing", "operating"),
        editable: ipcBoolean(),
        externalMacros: ipcMacrosSchema,
        useExternalMacros: ipcBoolean(),
        utilityType: ipcOptional(ipcLiteral(
            "Probe", "PvTable", "DataViewer", "ProfilesViewer", "LogViewer", "TdlViewer", "TextEditor", "Terminal",
            "Calculator", "ChannelGraph", "Help", "Casw", "PvMonitor", "CaSnooper", "FileConverter", "Talhk",
            "FileBrowser", "SeqGraph"
        )),
        utilityOptions: ipcOptional(ipcAnyRecord()),
    }),
    "selected-profile-contents": ipcObject({
        contents: ipcAnyRecord(),
    }),
    "tca-get-result": ipcObject({
        ioId: ipcNumber(),
        widgetKey: ipcOptional(ipcString()),
        newDbrData: ipcUnknown<type_dbrData | type_pva_value>("DBR or PVA data"),
    }),
    "tca-put-result": ipcObject({
        channelName: ipcString(),
        displayWindowId: ipcString(),
        ioId: ipcNumber(),
        waitNotify: ipcBoolean(),
        status: ipcOptional(ipcUnion(ipcNumber(), ipcUnknown<type_pva_status>("PVA status"))),
    }),
    "fetch-pva-type-reply": ipcObject({
        channelName: ipcString(),
        widgetKey: ipcOptional(ipcString()),
        fullPvaType: ipcUnknown<any>(),
        ioId: ipcNumber(),
    }),
    "dialog-show-message-box": ipcObject({
        info: ipcDialogMessageBoxSchema,
    }),
    "dialog-show-input-box": ipcObject({
        info: ipcDialogInputBoxSchema,
    }),
    "tdl-file-saved": ipcObject({
        newTdlFileName: ipcString(),
    }),
    "select-a-file-reply": ipcObject({
        options: ipcAnyRecord(),
        fileName: ipcString(),
    }),
    "widget-specific-action": ipcObject({
        widgetKey: ipcString(),
        actionName: ipcString(),
    }),
    "local-font-names": ipcObject({
        localFontNames: ipcArray(ipcString()),
    }),
    "start-record-video": ipcObject({
        sourceId: ipcString(),
        folder: ipcString(),
    }),
    "window-will-be-closed": ipcObject({}),
    "request-epics-dbd-reply": ipcObject({
        widgetKey: ipcString(),
        menus: ipcAnyRecord(),
        recordTypes: ipcAnyRecord(),
    }),
    "show-about-tdm": ipcObject({
        info: ipcAboutInfoSchema,
    }),
    "terminal-command-result": ipcObject({
        widgetKey: ipcString(),
        ioId: ipcNumber(),
        command: ipcString(),
        result: ipcAnyArray(),
    }),
    "processes-info-reply": ipcObject({
        widgetKey: ipcString(),
        processesInfo: ipcArray(ipcObject({
            Type: ipcString(),
            "Window ID": ipcString(),
            Visible: ipcString(),
            "TDL file name": ipcString(),
            "Window name": ipcString(),
            Editable: ipcString(),
            "Uptime [second]": ipcNumber(),
            "Process ID": ipcNumber(),
            "CPU usage [%]": ipcNumber(),
            "Memory usage [MB]": ipcNumber(),
            Thumbnail: ipcString(),
        })),
    }),
    "epics-stats-reply": ipcObject({
        widgetKey: ipcString(),
        epicsStats: ipcObject({
            udp: ipcAnyRecord(),
            tcp: ipcRecord(ipcAnyRecord()),
        }),
    }),
    "ca-snooper-data": ipcObject({
        data: ipcDiagnosticDataSchema,
    }),
    "ca-sw-data": ipcObject({
        data: ipcDiagnosticDataSchema,
    }),
    "text-file-contents": ipcObject({
        displayWindowId: ipcString(),
        widgetKey: ipcString(),
        fileName: ipcString(),
        fileContent: ipcString(),
        readable: ipcBoolean(),
        writable: ipcBoolean(),
    }),
    "update-text-editor-file-name": ipcObject({
        displayWindowId: ipcString(),
        widgetKey: ipcString(),
        fileName: ipcString(),
    }),
    "update-text-editor-modified-status": ipcObject({
        displayWindowId: ipcString(),
        widgetKey: ipcString(),
    }),
    "new-log": ipcObject({
        data: ipcLogDataSchema,
    }),
    "file-converter-command-reply": ipcObject({
        type: ipcLiteral("one-file-conversion-started", "one-file-conversion-finished", "all-file-conversion-finished"),
        widgetKey: ipcString(),
        srcFileName: ipcOptional(ipcString()),
        destFileName: ipcOptional(ipcString()),
        status: ipcLiteral("success", "converting", "failed"),
        timeDurationMs: ipcOptional(ipcNumber()),
        numWidgetsOrig: ipcOptional(ipcNumber()),
        numWidgetsTdl: ipcOptional(ipcNumber()),
    }),
    "fetch-folder-content-reply": ipcObject({
        widgetKey: ipcString(),
        folderContent: ipcFolderContentSchema,
        success: ipcOptional(ipcBoolean()),
    }),
    "file-browser-command-reply": ipcObject({
        displayWindowId: ipcString(),
        widgetKey: ipcString(),
        command: ipcLiteral("change-item-name", "create-tdl-file", "create-folder"),
        folder: ipcOptional(ipcString()),
        oldName: ipcOptional(ipcString()),
        newName: ipcOptional(ipcString()),
        fullFileName: ipcOptional(ipcString()),
        success: ipcBoolean(),
    }),
    "fetch-thumbnail-reply": ipcObject({
        widgetKey: ipcString(),
        tdlFileName: ipcString(),
        image: ipcString(),
    }),
    "site-info": ipcObject({
        site: ipcString(),
    }),
    "open-display-window-in-web-browser": ipcObject({
        displayWindowId: ipcString(),
    }),
    "get-media-content-reply": ipcObject({
        displayWindowId: ipcString(),
        widgetKey: ipcString(),
        content: ipcString(),
    }),
    "pong": ipcObject({
        displayWindowId: ipcString(),
        id: ipcString(),
        time: ipcNumber(),
    }),
    "read-embedded-display-tdl-reply": ipcObject({
        displayWindowId: ipcString(),
        widgetKey: ipcString(),
        macros: ipcMacrosSchema,
        fullTdlFileName: ipcOptional(ipcString()),
        tdl: ipcOptional(ipcTdlSchema),
        widgetWidth: ipcNumber(),
        widgetHeight: ipcNumber(),
        resize: ipcLiteral("none", "crop", "fit"),
        tdlFileName: ipcString(),
    }),
    "bounce-back": ipcObject({
        eventName: ipcString(),
        data: ipcUnknown<any>(),
    }),
} as const satisfies Readonly<Record<string, type_IpcValueSchema<any>>>;

const IpcMainProcToMainWinSchema = {
    "after-main-window-gui-created": ipcObject({
        profiles: ipcAnyRecord(),
        profilesFileName: ipcString(),
        envDefault: ipcAnyRecord(),
        envOs: ipcAnyRecord(),
        logFileName: ipcString(),
        site: ipcString(),
    }),
    "after-profile-selected": ipcObject({
        profileName: ipcString(),
    }),
    "new-thumbnail": ipcObject({
        data: ipcRecord(ipcUnion(
            ipcOptional(ipcObject({
                image: ipcString(),
                windowName: ipcOptional(ipcString()),
                tdlFileName: ipcOptional(ipcString()),
            })),
            ipcLiteral(null),
        )),
    }),
    "update-ws-opener-port": ipcObject({
        newPort: ipcNumber(),
    }),
    "cmd-line-selected-profile": ipcObject({
        cmdLineSelectedProfile: ipcString(),
        args: ipcInputArgsSchema,
    }),
    "show-prompt": ipcObject({
        data: ipcMainWindowPromptDataSchema,
    }),
    "show-about-tdm": ipcObject({
        info: ipcAboutInfoSchema,
    }),
    "dialog-show-message-box": ipcObject({
        info: ipcDialogMessageBoxSchema,
    }),
    "dialog-show-input-box": ipcObject({
        info: ipcDialogInputBoxSchema,
    }),
    "log-file-name": ipcObject({
        logFileName: ipcString(),
    }),
} as const satisfies Readonly<Record<string, type_IpcValueSchema<any>>>;


const hasOwnIpcEvent = (registry: Record<string, type_IpcValueSchema>, eventName: unknown): eventName is string => (
    typeof eventName === "string" && Object.prototype.hasOwnProperty.call(registry, eventName)
);

function getIpcDispWinToMainProcValidationError<K extends keyof IpcDispWinToMainProc>(
    eventName: K,
    data: unknown,
): type_IpcValidationError | undefined {
    return getIpcValueValidationError(data, IpcDispWinToMainProcSchema[eventName], String(eventName));
}

function getIpcMainWinToMainProcValidationError<K extends keyof IpcMainWinToMainProc>(
    eventName: K,
    data: unknown,
): type_IpcValidationError | undefined {
    return getIpcValueValidationError(data, IpcMainWinToMainProcSchema[eventName], String(eventName));
}

function getIpcMainProcToDispWinValidationError<K extends keyof IpcMainProcToDispWin>(
    eventName: K,
    data: unknown,
): type_IpcValidationError | undefined {
    return getIpcValueValidationError(data, IpcMainProcToDispWinSchema[eventName], String(eventName));
}

function getIpcMainProcToMainWinValidationError<K extends keyof IpcMainProcToMainWin>(
    eventName: K,
    data: unknown,
): type_IpcValidationError | undefined {
    return getIpcValueValidationError(data, IpcMainProcToMainWinSchema[eventName], String(eventName));
}

// ----------------------- exported API ---------------------

/**
 * Compile-time payload types inferred from the DisplayWindow-to-main-process
 * runtime schemas above. The schema registry is the single source of truth.
 */
export type IpcDispWinToMainProc = InferIpcEventMap<typeof IpcDispWinToMainProcSchema>;

/**
 * Compile-time payload types inferred from the MainWindow-to-main-process
 * runtime schemas above. Shared events reuse the same schema objects.
 */
export type IpcMainWinToMainProc = InferIpcEventMap<typeof IpcMainWinToMainProcSchema>;

/**
 * Compile-time payload types inferred from the main-process-to-DisplayWindow
 * runtime schemas above. The schema registry is the single source of truth.
 */
export type IpcMainProcToDispWin = InferIpcEventMap<typeof IpcMainProcToDispWinSchema>;

/**
 * Compile-time payload types inferred from the main-process-to-MainWindow
 * runtime schemas above. Shared events reuse the same schema objects.
 */
export type IpcMainProcToMainWin = InferIpcEventMap<typeof IpcMainProcToMainWinSchema>;

export const isIpcDispWinToMainProcEventName = (eventName: unknown): eventName is keyof IpcDispWinToMainProc => (
    hasOwnIpcEvent(IpcDispWinToMainProcSchema, eventName)
);

export const isIpcMainWinToMainProcEventName = (eventName: unknown): eventName is keyof IpcMainWinToMainProc => (
    hasOwnIpcEvent(IpcMainWinToMainProcSchema, eventName)
);

export const isIpcMainProcToDispWinEventName = (eventName: unknown): eventName is keyof IpcMainProcToDispWin => (
    hasOwnIpcEvent(IpcMainProcToDispWinSchema, eventName)
);

export const isIpcMainProcToMainWinEventName = (eventName: unknown): eventName is keyof IpcMainProcToMainWin => (
    hasOwnIpcEvent(IpcMainProcToMainWinSchema, eventName)
);

export function verifyIpcDispWinToMainProcEvent<K extends keyof IpcDispWinToMainProc>(
    eventName: K,
    data: unknown,
): asserts data is IpcDispWinToMainProc[K] {
    const error = getIpcDispWinToMainProcValidationError(eventName, data);
    if (error !== undefined) {
        throw new Error(
            `IPC event ${JSON.stringify(eventName)} verification failed at ${JSON.stringify(error.path)}: ` +
            `expected ${error.expected}, got ${error.received}.`
        );
    }
}

export function verifyIpcMainWinToMainProcEvent<K extends keyof IpcMainWinToMainProc>(
    eventName: K,
    data: unknown,
): asserts data is IpcMainWinToMainProc[K] {
    const error = getIpcMainWinToMainProcValidationError(eventName, data);
    if (error !== undefined) {
        throw new Error(
            `IPC event ${JSON.stringify(eventName)} verification failed at ${JSON.stringify(error.path)}: ` +
            `expected ${error.expected}, got ${error.received}.`
        );
    }
}

export function verifyIpcMainProcToDispWinEvent<K extends keyof IpcMainProcToDispWin>(
    eventName: K,
    data: unknown,
): asserts data is IpcMainProcToDispWin[K] {
    const error = getIpcMainProcToDispWinValidationError(eventName, data);
    if (error !== undefined) {
        throw new Error(
            `IPC event ${JSON.stringify(eventName)} verification failed at ${JSON.stringify(error.path)}: ` +
            `expected ${error.expected}, got ${error.received}.`
        );
    }
}

export function verifyIpcMainProcToMainWinEvent<K extends keyof IpcMainProcToMainWin>(
    eventName: K,
    data: unknown,
): asserts data is IpcMainProcToMainWin[K] {
    const error = getIpcMainProcToMainWinValidationError(eventName, data);
    if (error !== undefined) {
        throw new Error(
            `IPC event ${JSON.stringify(eventName)} verification failed at ${JSON.stringify(error.path)}: ` +
            `expected ${error.expected}, got ${error.received}.`
        );
    }
}
