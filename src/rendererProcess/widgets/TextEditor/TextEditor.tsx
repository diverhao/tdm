import * as GlobalMethods from "../../../common/GlobalMethods";
import * as React from "react";
import { Compartment, EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { StreamLanguage, defaultHighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { c, cpp } from "@codemirror/legacy-modes/mode/clike";
import { javascript, json, typescript } from "@codemirror/legacy-modes/mode/javascript";
import { julia } from "@codemirror/legacy-modes/mode/julia";
import { python } from "@codemirror/legacy-modes/mode/python";
import { rust } from "@codemirror/legacy-modes/mode/rust";
import { shell } from "@codemirror/legacy-modes/mode/shell";
import { xml } from "@codemirror/legacy-modes/mode/xml";
import { g_widgets1 } from "../../global/GlobalVariables";
import { GlobalVariables } from "../../../common/GlobalVariables";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { Canvas } from "../../helperWidgets/Canvas/Canvas";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { ElementRectangleButton } from "../../helperWidgets/SharedElements/RectangleButton";
import path from "path";
import { defaultTextEditorTdl, type_TextEditor_tdl } from "../../../common/types/type_widget_tdl";

const textEditorLanguageExtensions: Record<string, any> = {
    ".py": StreamLanguage.define(python),
    ".js": StreamLanguage.define(javascript),
    ".jsx": StreamLanguage.define(javascript),
    ".mjs": StreamLanguage.define(javascript),
    ".cjs": StreamLanguage.define(javascript),
    ".tdl": StreamLanguage.define(json),
    ".ts": StreamLanguage.define(typescript),
    ".tsx": StreamLanguage.define(typescript),
    ".mts": StreamLanguage.define(typescript),
    ".cts": StreamLanguage.define(typescript),
    ".sh": StreamLanguage.define(shell),
    ".bash": StreamLanguage.define(shell),
    ".zsh": StreamLanguage.define(shell),
    ".c": StreamLanguage.define(c),
    ".h": StreamLanguage.define(c),
    ".db": StreamLanguage.define(julia),
    ".cpp": StreamLanguage.define(cpp),
    ".cc": StreamLanguage.define(cpp),
    ".cxx": StreamLanguage.define(cpp),
    ".hpp": StreamLanguage.define(cpp),
    ".hh": StreamLanguage.define(cpp),
    ".hxx": StreamLanguage.define(cpp),
    ".bob": StreamLanguage.define(xml),
    ".plt": StreamLanguage.define(xml),
    ".rs": StreamLanguage.define(rust),
};

/**
 * TextEditor widget.
 *
 * Startup source of content:
 * - If `text.fileName` is non-empty, TextEditor loads file content from main process.
 * - If `text.fileName` is empty, TextEditor uses `text.fileContent` as initial content.
 *
 * During runtime, this widget:
 * - manages open/save/save-as IPC requests,
 * - tracks modified state for close confirmation,
 * - updates window title with file name and modified marker.
 */

export class TextEditor extends BaseWidget {
    private setFileContent: any;
    setFileNameState: any;

    private _fileName: string = "";
    private _modified: boolean = false;
    getFileContent = () => { return "" };

    constructor(widgetTdl: type_TextEditor_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this.setReadWriteType("write");

        this._fileName = widgetTdl.text["fileName"];

        this.registerUtilityWindowResizeCallback((_event: UIEvent) => {
            g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
            g_flushWidgets();
        });
    }

    // ------------------------------ elements ---------------------------------

    _ElementRaw = () => {
        // guard the widget from double rendering
        this.widgetBeingRendered = true;
        React.useEffect(() => {
            this.widgetBeingRendered = false;
        });
        g_widgets1.removeFromForceUpdateWidgets(this.getWidgetKey());

        this.updateAllStyleAndText();


        return (
            <ErrorBoundary style={{ ...this.getStyle(), boxSizing: "border-box" }} widgetKey={this.getWidgetKey()}>
                <div
                    style={{
                        ...this.getElementBodyRawStyle(),
                        overflow: "hidden",
                    }
                    }
                >
                    <this._ElementArea></this._ElementArea>
                </div>
            </ErrorBoundary>
        );
    };



    _ElementAreaRaw = (): React.JSX.Element => {
        const [fileContent, setFileContent] = React.useState(this.getText()["fileName"]);
        this.setFileContent = setFileContent;
        this.getFileContent = () => { return fileContent };

        const [fileName, setFileName] = React.useState(this.getFileName());
        this.setFileNameState = setFileName;

        const editorContainerRef = React.useRef<HTMLDivElement>(null);
        const editorViewRef = React.useRef<EditorView | null>(null);
        const languageCompartment = React.useRef(new Compartment()).current;
        const suppressEditorChangeRef = React.useRef(false);

        // request file content if the file name is not empty
        React.useEffect(() => {
            if (this.getFileName() === "") {
                return;
            }
            this.initFileContent();
        }, []);

        // create the editor element, it will be attached under element editorContainerRef.current
        React.useEffect(() => {
            if (editorContainerRef.current === null) {
                return;
            }

            editorViewRef.current = new EditorView({
                state: EditorState.create({
                    // doc: fileContentsRef.current,
                    // initial content displayed
                    doc: fileContent,
                    extensions: [
                        syntaxHighlighting(defaultHighlightStyle),
                        languageCompartment.of(this.getLanguageExtension(fileName)),
                        // user edit callback function
                        // it is also invoked when the content is changed programtically, however
                        // the suppressEditorChangeRef.current guards the change, preventing
                        // the editor to doubly update
                        EditorView.updateListener.of((update) => {
                            // if document is not change, or when the program is automatically updating the content
                            // stop here
                            if (!update.docChanged || suppressEditorChangeRef.current) {
                                return;
                            }
                            const newFileContents = update.state.doc.toString();
                            this.setModified(true);
                            this.upateWindowTitle(this.getFileName());
                            setFileContent(newFileContents);
                        }),
                        EditorView.theme({
                            "&": {
                                height: "100%",
                                fontSize: `${GlobalVariables.defaultFontSize}px`,
                                backgroundColor: "rgba(255, 255, 255, 1)",
                            },
                            ".cm-scroller": {
                                overflow: "auto",
                                fontFamily: "Consolas,Monaco,'Andale Mono','Ubuntu Mono',monospace",
                                lineHeight: "1.5",
                            },
                            ".cm-content": {
                                padding: "0",
                                caretColor: "rgba(0,0,0,1)",
                            },
                            ".cm-line": {
                                padding: "0",
                            },
                            "&.cm-focused": {
                                outline: "none",
                            },
                            ".cm-selectionBackground, ::selection": {
                                backgroundColor: "rgba(173, 214, 255, 0.45)",
                            },
                        }),
                    ],
                }),
                parent: editorContainerRef.current,
            });

            return () => {
                editorViewRef.current?.destroy();
                editorViewRef.current = null;
            };
        }, []);

        // programtically change the file content: e.g. when the file content is read
        // this is triggered by this.setFileContent(...)
        React.useEffect(() => {
            const editorView = editorViewRef.current;
            if (editorView === null) {
                return;
            }

            const currentDoc = editorView.state.doc.toString();
            if (currentDoc === fileContent) {
                return;
            }

            suppressEditorChangeRef.current = true;
            editorView.dispatch({
                changes: {
                    from: 0,
                    to: currentDoc.length,
                    insert: fileContent,
                },
            });
            suppressEditorChangeRef.current = false;
        }, [fileContent]);

        React.useEffect(() => {
            const editorView = editorViewRef.current;
            if (editorView === null) {
                return;
            }

            editorView.dispatch({
                effects: languageCompartment.reconfigure(this.getLanguageExtension(fileName)),
            });
        }, [fileName, languageCompartment]);

        return (
            <div
                style={{
                    boxSizing: "border-box",
                    padding: 0,
                    display: "flex",
                    flexDirection: "column",
                    width: "100%",
                    height: "100%",
                }}
            >
                {/* editor title, open/save/save as buttons */}
                <div style={{
                    paddingLeft: 30,
                    paddingTop: 15,
                    boxSizing: "border-box",
                    display: "inline-flex",
                    width: "calc(100% - 30px)",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}>
                    <h2>TDM Text Editor</h2>
                    <div style={{
                        display: "inline-flex",
                        flexDirection: "row",
                        paddingTop: 0,
                        paddingRight: 0,
                        boxSizing: "border-box",
                    }}>
                        <this.TextEditorOpenFileButton />
                        <this.TextEditorSaveFileButton />
                        <this.TextEditorSaveFileAsButton />
                    </div>
                </div>
                {/* file name */}
                <div style={{
                    paddingLeft: 30,
                    boxSizing: "border-box",
                    fontSize: GlobalVariables.defaultFontSize * 1,
                }}>
                    <div>
                        {fileName === "" ? "[Empty file name]" : fileName}
                    </div>
                </div>
                {/* separator line */}
                <div style={{
                    width: "100%",
                    minHeight: 3,
                    maxHeight: 3,
                    backgroundColor: "rgba(200,200,200,1)",
                    marginBottom: 10,
                    marginTop: 10,
                }}>
                </div>
                {/* file content */}
                <div style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                    paddingLeft: 30,
                    paddingTop: 0,
                    boxSizing: "border-box",
                }}>
                    <div style={{
                        width: "100%",
                        height: "100%",
                        minHeight: 0,
                    }}
                        ref={editorContainerRef}
                    />
                </div>
            </div>
        );
    };

    _Element = React.memo(this._ElementRaw, () => this._useMemoedElement());
    _ElementArea = React.memo(this._ElementAreaRaw, () => this._useMemoedElement());


    TextEditorOpenFileButton = () => {
        const mainProcessMode = g_widgets1.getRoot().getDisplayWindowClient().getMainProcessMode();
        return (
            <ElementRectangleButton marginRight={10} handleClick={() => {
                this.openTextFile();
            }}>
                {mainProcessMode === "web" ? "Open file on this computer" : "Open File"}
            </ElementRectangleButton>
        );
    };

    TextEditorSaveFileButton = () => {
        const mainProcessMode = g_widgets1.getRoot().getDisplayWindowClient().getMainProcessMode();
        return (
            <ElementRectangleButton
                additionalStyle={{
                    display: mainProcessMode === "web" ? "none" : "inline-flex",
                }}
                marginRight={10}
                handleClick={this.saveFile}
            >
                Save File
            </ElementRectangleButton>
        );
    };

    TextEditorSaveFileAsButton = () => {
        const mainProcessMode = g_widgets1.getRoot().getDisplayWindowClient().getMainProcessMode();
        return (
            <ElementRectangleButton marginRight={10} handleClick={this.saveFileAs}>
                {mainProcessMode === "web" ? "Save file to this computer" : "Save File As"}
            </ElementRectangleButton>
        );
    };

    // -------------------- helpers ----------------

    /**
     * Initialize editor content from the current file name.
     *
     * This runs when TextEditor starts with a non-empty file name. In desktop/ssh mode,
     * it requests file content from main process; in web mode, it delegates to the web
     * open-file flow. The reply is handled by `updateFileContents`.
     */
    initFileContent = () => {
        const fileName = this.getFileName();
        if (fileName === "") {
            return;
        }

        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
        if (displayWindowClient.getMainProcessMode() === "web") {
            displayWindowClient.openTextFileInTextEditorInWebMode(this);
            return;
        }

        displayWindowClient.getIpcManager().sendFromRendererProcess("open-text-file", {
            displayWindowId: displayWindowClient.getWindowId(),
            widgetKey: this.getWidgetKey(),
            fileName: fileName,
            fileContent: "",
            manualOpen: false,
            openNewWindow: false,
        });
    }
    /**
     * Apply file name/content returned by the open-file IPC response.
     *
     * This updates local editor state, clears modified status, and refreshes window title.
     */
    updateFileContents = (result: {
        fileName: string,
        fileContent: string
        readable: boolean,
        writable: boolean,
    }) => {
        const fileName = result["fileName"];
        this.setFileName(fileName);
        if (this.setFileNameState !== undefined) {
            this.setFileNameState(fileName);
        }
        if (this.setFileContent !== undefined) {
            this.setFileContent(result["fileContent"]);
        }
        this.setModified(false);
        this.upateWindowTitle(fileName);
    }

    /**
     * Update file name after a successful save/save-as operation.
     *
     * This resets modified status, updates title, and re-renders filename UI.
     */
    updateFileName = (newFileName: string) => {
        this.setFileName(newFileName);
        this.setModified(false);
        this.upateWindowTitle(newFileName);
        // re-render
        if (this.setFileNameState !== undefined) {
            this.setFileNameState(newFileName);
        }
    }


    /**
     * Open file action from toolbar.
     *
     * Prompts user to select a file (desktop/ssh) or uses the web picker (web mode).
     * If current editor already has file name/content, request opening in a new TextEditor
     * window to preserve existing unsaved content.
     */
    openTextFile = () => {

        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
        if (displayWindowClient.getMainProcessMode() === "web") {
            displayWindowClient.openTextFileInTextEditorInWebMode(this);
            return;
        }

        let openNewWindow = false;
        if (this.getFileName() !== "" || this.getFileContent() !== "") {
            openNewWindow = true;
        }

        displayWindowClient.getIpcManager().sendFromRendererProcess("open-text-file", {
            displayWindowId: displayWindowClient.getWindowId(),
            widgetKey: this.getWidgetKey(),
            fileName: "",
            fileContent: "",
            manualOpen: true,
            openNewWindow: openNewWindow,
        });
    }


    /**
     * Save current editor content to the current file path.
     *
     * If no file path is set, main process treats this as save-as flow.
     */
    saveFile = () => {
        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
        displayWindowClient.getIpcManager().sendFromRendererProcess("save-text-file", {
            displayWindowId: displayWindowClient.getWindowId(),
            widgetKey: this.getWidgetKey(),
            fileName: this.getFileName(),
            fileContents: this.getFileContent(),
        });
    }

    /**
     * Save current editor content to a new file path.
     *
     * In web mode this downloads a file to the browser client. In desktop/ssh mode,
     * this triggers save-as in main process by sending an empty file name.
     */
    saveFileAs = () => {
        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
        if (displayWindowClient.getMainProcessMode() === "web") {
            const blob = new Blob([this.getFileContent()], { type: "text/text" });
            const relativePath = path.basename(this.getFileName());
            displayWindowClient.downloadData(blob, relativePath, "Save Text File", "text/text", []);
            return;
        }
        displayWindowClient.getIpcManager().sendFromRendererProcess("save-text-file", {
            displayWindowId: displayWindowClient.getWindowId(),
            widgetKey: this.getWidgetKey(),
            fileName: "",
            fileContents: this.getFileContent(),
        });
    }


    /**
     * Recompute and apply the utility window title for TextEditor.
     *
     * Title format:
     * `TDM Text Editor -- <fileNameOrPlaceholder> [Modified]`
     * where `[Modified]` is included only when `this.getModified()` is true.
     */
    upateWindowTitle = (newFileName: string) => {
        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
        const canvas = g_widgets1.getWidget("Canvas");
        if (!(canvas instanceof Canvas)) {
            return;
        }

        let fileNameSection = "";
        let modifiedSection = "";
        if (newFileName === "") {
            fileNameSection = "[Empty file name]";
        } else {
            fileNameSection = newFileName;
        }
        if (this.getModified() === true) {
            modifiedSection = "[Modified]";
        }

        let oldWindowName = canvas.getWindowName();
        let newWindowName = "TDM Text Editor -- " + fileNameSection + " " + modifiedSection;
        if (newWindowName !== oldWindowName) {
            canvas.setWindowName(newWindowName);
            displayWindowClient.updateWindowTitle();
        }
    }


    getLanguageExtension = (fileName: string) => {
        const extension = path.extname(fileName).toLowerCase();
        return textEditorLanguageExtensions[extension] ?? [];
    };


    // -------------------- getters and setters ---------------------



    getModified = () => {
        return this._modified;
    }

    setModified = (newState: boolean) => {
        this._modified = newState;
    }

    getFileName = () => {
        return this._fileName;
    }

    setFileName = (newName: string) => {
        this._fileName = newName;
    }



    // -------------------------- tdl -------------------------------

    static generateDefaultTdl = () => {
        const defaultTdl: type_TextEditor_tdl = structuredClone(defaultTextEditorTdl);
        defaultTdl["widgetKey"] = GlobalMethods.generateWidgetKey(defaultTdl["type"]);
        return defaultTdl;
    };

    getTdlCopy(newKey: boolean = true): Record<string, any> {
        const result = super.getTdlCopy(newKey);
        // do not save fileContent
        result.text["fileContent"] = "";
        return result;
    }

    generateDefaultTdl: () => any = TextEditor.generateDefaultTdl;

    static generateWidgetTdl = (utilityOptions: Record<string, any>): type_TextEditor_tdl => {
        const result = this.generateDefaultTdl();
        result.text["fileName"] = utilityOptions["fileName"];
        result.text["fileContent"] = utilityOptions["fileContent"] ?? "";
        return result;
    };

    // -------------------------- sidebar ---------------------------
    createSidebar = () => {
    }
}
