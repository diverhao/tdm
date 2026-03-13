import { type_fileType } from "../IpcEventArgType";


export const fileDialogOptionsByType: Record<type_fileType, { filters: { name: string, extensions: string[] }[], defaultFileName: string, defaultExtension: string, displayText: string }> = {
    "tdl": {
        filters: [{ name: "tdl", extensions: ["tdl", "json", "bob", "edl", "stp"] }],
        defaultFileName: "untitled.tdl",
        defaultExtension: ".tdl",
        displayText: "Open TDL file",
    },
    "data-viewer": {
        filters: [{ name: "json", extensions: ["json"] }],
        defaultFileName: "data.json",
        defaultExtension: ".json",
        displayText: "Open JSON file",
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