import * as GlobalMethods from "../../../common/GlobalMethods";
import * as React from "react";
import { Compartment, EditorState } from "@codemirror/state";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { EditorView, keymap } from "@codemirror/view";
import { defaultHighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { json } from "@codemirror/lang-json";
import { python } from "@codemirror/lang-python";
import { g_widgets1 } from "../../global/GlobalVariables";
import { GlobalVariables } from "../../../common/GlobalVariables";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { Canvas } from "../../helperWidgets/Canvas/Canvas";
import { ElementRectangleButton } from "../../helperWidgets/SharedElements/RectangleButton";
import path from "path";
import { defaultTextEditorTdl, type_TextEditor_tdl } from "../../../common/types/type_widget_tdl";

/**
 * tdl comes with text["fileName"] and text["fileContent"]
 * 
 * if fileName is an empty string, then skip trying to read the file,
 * honor the fileContent, no matter if it is empty or not; 
 * 
 * if fileName is not empty, ignore the fileContent, try to read the file
 * 
 */

export class TextEditor extends BaseWidget {
    private setFileContent: any;
    setFileNameState: any;

    // private setFileWritableState: React.Dispatch<React.SetStateAction<boolean>> | undefined;
    // private fileWritable: boolean = false;

    // private _fileContent: string = "";
    private _fileName: string = "";

    // 2.5 MB text file contains more than 2.5 million characters.
    // Above this threshold, keep the editor in read-only mode.
    private fileLimit: number = 2.5 * 1024 * 1024;

    constructor(widgetTdl: type_TextEditor_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this.setReadWriteType("write");

        this._fileName = widgetTdl.text["fileName"];
        // if (this._fileName === "") {
        // this._fileContent = widgetTdl.text["fileContent"]
        // }

        // this.fileWritable = widgetTdl.text["fileName"] === "";
    }

    // ------------------------------ elements ---------------------------------

    // concretize abstract method
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

    getFileContent = () => {return ""};

    getLanguageExtension = (fileName: string) => {
        const extension = path.extname(fileName).toLowerCase();
        if (extension === ".json") {
            return json();
        }
        if (extension === ".py") {
            return python();
        }
        return [];
    };

    _ElementAreaRaw = (): React.JSX.Element => {
        // const initialFileName = this.getFileName();
        // const initialFileContents = initialFileName === "" ? this.getText()["fileContent"] : "";

        const [fileContent, setFileContent] = React.useState(this.getText()["fileName"] === "" ? this.getText()["fileContent"] : "");
        this.setFileContent = setFileContent;
        this.getFileContent = () => {return fileContent};

        const [fileName, setFileName] = React.useState(this.getFileName());
        this.setFileNameState = setFileName;

        // const [fileWritable, setFileWritable] = React.useState(this.fileWritable);
        const editorContainerRef = React.useRef<HTMLDivElement>(null);
        const editorViewRef = React.useRef<EditorView | null>(null);
        const languageCompartment = React.useRef(new Compartment()).current;
        // const fileContentRef = React.useRef(fileContent);
        const suppressEditorChangeRef = React.useRef(false);
        // this.setFileContent = setFileContent;
        // this.setFileNameState = setFileName;
        // this.setFileWritableState = setFileWritable;
        // const isEditorReadOnly = !(fileWritable && fileContents.length <= this.fileLimit);

        // request file content if the file name is not empty
        React.useEffect(() => {
            if (this.getFileName() === "") {
                return;
            }
            const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
            displayWindowClient.getIpcManager().sendFromRendererProcess("open-text-file-in-text-editor", {
                displayWindowId: displayWindowClient.getWindowId(),
                widgetKey: this.getWidgetKey(),
                fileName: this.getFileName(),
                manualOpen: false,
                openNewWindow: false,
            });
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
                        history(),
                        keymap.of([...defaultKeymap, ...historyKeymap]),
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
                            // if (this.getFileName() === "") {
                            //     this.getText()["fileContent"] = newFileContents;
                            // }
                            // this.currentFileContents = newFileContents;
                            // this.setWindowName(this.getFileName(), true, newFileContents);
                            // this.setModified(true);
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
                    <div style={{ marginTop: 10 }}>
                        {fileContent.length > this.fileLimit ? <div style={{ color: "rgba(255,0,0,1)" }}>The file is larger than 2.5 MB, you can only view it. This editor is designed for casual editing.</div> : ""}
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
            <ElementRectangleButton marginRight={10} handleClick={this.openFile}>
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
     * Invoked upon the "text-file-contents" event 
     */
    loadFileContents = (result: {
        fileName: string,
        fileContents: string
        readable: boolean,
        writable: boolean,
    }) => {
        // this.currentFileContents = result["fileContents"];
        // this.setModified(false);
        // this.setWritable(result["writable"]);
        // this.setFileName(result["fileName"], false, result["fileContents"]);
        this.setFileName(result["fileName"]);
        if (this.setFileNameState !== undefined) {
            this.setFileNameState(result["fileName"]);
        }
        if (this.setFileContent !== undefined) {
            this.setFileContent(result["fileContents"]);
        }
        // if (this.setFileNameState !== undefined) {
        // this.setFileNameState(this.getFileName());
        // }
    }


    openFile = () => {
        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
        if (displayWindowClient.getMainProcessMode() === "web") {
            displayWindowClient.openTextFileInTextEditorInWebMode(this);
            return;
        }
        displayWindowClient.getIpcManager().sendFromRendererProcess("open-text-file-in-text-editor", {
            displayWindowId: displayWindowClient.getWindowId(),
            widgetKey: this.getWidgetKey(),
            fileName: "",
            manualOpen: true,
            openNewWindow: false,
        });
    }

    saveFile = () => {
        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
        displayWindowClient.getIpcManager().sendFromRendererProcess("save-text-file", {
            displayWindowId: displayWindowClient.getWindowId(),
            widgetKey: this.getWidgetKey(),
            fileName: this.getFileName(),
            fileContents: this.getFileContent(),
        });
    }

    saveFileAs = () => {
        // todo
        // const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
        // if (displayWindowClient.getMainProcessMode() === "web") {
        //     const blob = new Blob([this.getFileContents()], { type: "text/text" });
        //     const relativePath = path.basename(this.getFileName());
        //     displayWindowClient.downloadData(blob, relativePath, "Save Text File", "text/text", []);
        //     return;
        // }
        // displayWindowClient.getIpcManager().sendFromRendererProcess("save-text-file", {
        //     displayWindowId: displayWindowClient.getWindowId(),
        //     widgetKey: this.getWidgetKey(),
        //     fileName: "",
        //     fileContents: this.getFileContents(),
        // });
    }

    // setFileName = (newFileName: string, modified: boolean = false, fileContents: string = this.currentFileContents) => {
    //     this.getText()["fileName"] = newFileName;
    //     this.getText()["fileContent"] = newFileName === "" ? fileContents : "";
    //     // update window title
    //     this.setWindowName(newFileName, modified, fileContents);
    // }

    setWindowName = (newFileName: string, modified: boolean = false, fileContents: string) => {
        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
        const canvas = g_widgets1.getWidget("Canvas");
        if (canvas instanceof Canvas) {
            let oldWindowName = canvas.getWindowName();
            let newWindowName = "";
            const writable = this.getWritable(fileContents);
            if (newFileName === "") {
                newWindowName = "TDM Text Editor -- [Empty file name]";
            } else {
                if (modified) {
                    if (writable === false) {
                        newWindowName = "TDM Text Editor -- " + newFileName + " [Read Only]" + " [Modified]";
                    } else {
                        newWindowName = "TDM Text Editor -- " + newFileName + " [Modified]";
                    }
                } else {
                    if (writable === false) {
                        newWindowName = "TDM Text Editor -- " + newFileName + " [Read Only]";
                    } else {
                        newWindowName = "TDM Text Editor -- " + newFileName;
                    }
                }
            }
            if (newWindowName !== oldWindowName) {
                canvas.setWindowName(newWindowName);
                displayWindowClient.updateWindowTitle();
            }
        }
    }

    getModified = () => {
        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
        return displayWindowClient.getTextEditorModified();
    }

    setModified = (newState: boolean) => {
        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
        displayWindowClient.setTextEditorModified(newState);
    }

    getWritable = (fileContents: string) => {
        // return this.fileWritable === true && fileContents.length <= this.fileLimit;
        // todo
        return true;
    }

    setWritable = (writable: boolean) => {
        // this.fileWritable = writable;
        // if (this.setFileWritableState !== undefined) {
        //     this.setFileWritableState(writable);
        // }
        // this.setWindowName(this.getFileName(), this.getModified());
    }

    // -------------------- getters and setters ---------------------

    // getFileContent = () => {
    //     return this._fileContent;
    // }

    // setFileContent = (newContent: string) => {
    //     this._fileContent = newContent;
    // }

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

    generateDefaultTdl: () => any = TextEditor.generateDefaultTdl;

    getTdlCopy(newKey: boolean = true): Record<string, any> {
        const result = super.getTdlCopy(newKey);
        // todo
        // result["text"]["fileContent"] = result["text"]["fileName"] === "" ? this.getFileContents() : "";
        return result;
    }

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
