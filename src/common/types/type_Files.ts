
// types of files that we can open
export type type_fileType = "tdl" | "data-viewer" | "text" | "media" | "script" | "file-converter" | "picture";

export const isOfFileType = (value: unknown): value is type_fileType => typeof value === "string" && value in fileDialogOptionsByType;

export const fileDialogOptionsByType: Record<type_fileType, { filters: { name: string, extensions: string[] }[], defaultFileName: string, defaultExtension: string, displayText: string }> = {
    "tdl": {
        filters: [{ name: "tdl", extensions: ["tdl", "json", "bob", "edl", "stp"] }],
        defaultFileName: "untitled.tdl",
        defaultExtension: ".tdl",
        displayText: "Open TDL file",
    },
    "media": {
        filters: [{ name: "media", extensions: ["jpg", "jpeg", "png", "gif", "svg", "bmp", "pdf", "mp4", "ogg", "webm", "mp3", "mov"] }],
        defaultFileName: "data.jpg",
        defaultExtension: ".jpg",
        displayText: "Open media file",
    },
    "script": {
        filters: [{ name: "script", extensions: ["py", "js"] }],
        defaultFileName: "data.py",
        defaultExtension: ".py",
        displayText: "Open script file",
    },
    "file-converter": {
        filters: [{ name: "script", extensions: ["edl", "bob"] }],
        defaultFileName: "data.edl",
        defaultExtension: ".edl",
        displayText: "Open file converter file",
    },
    "data-viewer": {
        filters: [{ name: "json", extensions: ["json"] }],
        defaultFileName: "data.json",
        defaultExtension: ".json",
        displayText: "Open JSON file",
    },
    "picture": {
        filters: [{ name: "picture", extensions: ["jpg", "jpeg", "png", "gif", "svg", "bmp"] }],
        defaultFileName: "data.jpg",
        defaultExtension: ".jpg",
        displayText: "Open picture file",
    },
    "text": {
        filters: [
            { name: "text", extensions: ["txt"] },
            { name: "all", extensions: ["*"] },
        ],
        defaultFileName: "untitled.txt",
        defaultExtension: ".txt",
        displayText: "Open text file"
    },
};