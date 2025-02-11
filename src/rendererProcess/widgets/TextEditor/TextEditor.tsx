import * as React from "react";
import { GlobalVariables, g_widgets1 } from "../../global/GlobalVariables";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { Canvas } from "../../helperWidgets/Canvas/Canvas";
import { ElementRectangleButton } from "../../helperWidgets/SharedElements/RectangleButton";
import path from "path";

// fix up everytime the <code> is re-rendered, the .js file is compressed, it is modified to export Prism
// we add module.exports = Prism; to the end of the file
const Prism1 = require("../../../mainProcess/resources/js/prism.js");

export type type_TextEditor_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
};

export class TextEditor extends BaseWidget {
    // private _fileName: string = "";
    // private _fileContents: string = "";
    private setFileContentsState: any;
    setFileNameState: any;
    // 2.5 MB text file contains more than 2.5 million characters, it is considered large
    // when the text is larger than this number, disable the <textarea>
    private fileLimit: number = 2.5 * 1024 * 1024;
    updateHighlightArea: any;
    constructor(widgetTdl: type_TextEditor_tdl) {
        super(widgetTdl);

        this.setStyle({ ...TextEditor._defaultTdl.style, ...widgetTdl.style });
        this.setText({ ...TextEditor._defaultTdl.text, ...widgetTdl.text });

        // assign the sidebar
        // this._sidebar = new ProfilesViewerSidebar(this);

        // dynamically load css and js
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = '../../../webpack/resources/css/prism.css'; // Make sure the path is correct relative to your HTML file
        document.head.appendChild(css);
        const js = document.createElement('script');
        js.src = '../../../webpack/resources/js/prism.js';
        // js.type = 'text/javascript';
        js.type = 'module';
        document.head.appendChild(js);

        window.addEventListener("resize", (event: any) => {
            if (this.updateHighlightArea !== undefined) {
                this.updateHighlightArea();
            }
        })
    }

    // ------------------------- event ---------------------------------
    // concretize abstract method
    // empty
    updateFromSidebar = (event: any, propertyName: string, propertyValue: number | string | number[] | string[] | boolean | undefined) => { };

    // defined in super class
    // _handleMouseDown()
    // _handleMouseMove()
    // _handleMouseUp()
    // _handleMouseDownOnResizer()
    // _handleMouseMoveOnResizer()
    // _handleMouseUpOnResizer()
    // _handleMouseDoubleClick()

    // ----------------------------- geometric operations ----------------------------

    // defined in super class
    // simpleSelect()
    // selectGroup()
    // select()
    // simpleDeSelect()
    // deselectGroup()
    // deSelect()
    // move()
    // resize()

    // ------------------------------ group ------------------------------------

    // defined in super class
    // addToGroup()
    // removeFromGroup()

    // ------------------------------ elements ---------------------------------

    // concretize abstract method
    _ElementRaw = () => {
        this.setAllStyle({ ...this.getStyle(), ...this.getRulesStyle() });
        this.setAllText({ ...this.getText(), ...this.getRulesText() });

        // must do it for every widget
        g_widgets1.removeFromForceUpdateWidgets(this.getWidgetKey());
        this.renderChildWidgets = true;
        React.useEffect(() => {
            this.renderChildWidgets = false;
        });

        return (
            <ErrorBoundary style={{ ...this.getStyle(), boxSizing: "border-box" }} widgetKey={this.getWidgetKey()}>
                <>
                    <this._ElementBody></this._ElementBody>
                </>
            </ErrorBoundary>
        );
    };

    _ElementBodyRaw = (): JSX.Element => {
        return (
            <div
                style={{
                    ...this.getElementBodyRawStyle(),
                    overflow: "hidden",
                }
                }
            >
                <this._ElementArea></this._ElementArea>
            </div>
        );
    };


    // only shows the text, all other style properties are held by upper level _ElementBodyRaw
    _ElementAreaRaw = ({ }: any): JSX.Element => {
        // run once when the display window is first created
        React.useEffect(() => {
            const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
            displayWindowClient.getIpcManager().sendFromRendererProcess("open-text-file-in-text-editor", {
                displayWindowId: displayWindowClient.getWindowId(),
                widgetKey: this.getWidgetKey(),
                fileName: this.getFileName(),
                // executed this display window is opened, try to automatically read and open the file
                // if the file name is empty, i.e. "", this file can definitely not be opened, then do nothing
                // if the file name is not empty, try to open the file
                manualOpen: false,
            })
        }, [])

        // highlight <code /> every time it renders
        React.useEffect(() => {
            if (elementCodeRef.current !== null) {
                if (fileContents.length <= this.fileLimit) {
                    const data = calcReducedFileContents()["contents"];
                    elementCodeRef.current.textContent = data + ((data.charCodeAt(data.length - 1) === 10 || data.charCodeAt(data.length - 1) === 13) ? " " : "");
                    Prism1.highlightElement(elementCodeRef.current);
                } else {
                    const data = fileContents;
                    elementCodeRef.current.textContent = data + ((data.charCodeAt(data.length - 1) === 10 || data.charCodeAt(data.length - 1) === 13) ? " " : "");
                    Prism1.highlightElement(elementCodeRef.current);
                }
            }
        })

        const [fileContents, setFileContents] = React.useState("");
        const [fileName, setFileName] = React.useState(this.getFileName());
        const [reducedFileContents, setReducedFileContents] = React.useState("");
        const elementCodeRef = React.useRef<any>(null);
        const elementTextAreaRef = React.useRef<any>(null);
        const elementCodeWrapperRef = React.useRef<any>(null);
        this.setFileContentsState = setFileContents;
        this.setFileNameState = setFileName;
        this.getFileContents = () => {
            return fileContents;
        }
        const calcReducedFileContents = () => {
            if (this.getFileContents().length >= this.fileLimit) {
                return {
                    scrollTop: 3.1415926,
                    displayHeight: -1,
                    contents: ""
                };
            }
            if (elementTextAreaRef.current !== null) {
                const lines = this.getFileContents().split("\n");
                const sizes = elementTextAreaRef.current.getBoundingClientRect();
                const boxHeight = sizes["height"];
                const lineHeight = parseFloat(window.getComputedStyle(elementCodeRef.current)["lineHeight"]);
                // pixel
                const scrollTop = elementTextAreaRef.current.scrollTop;
                const scrollTopLines = Math.floor(Math.abs(scrollTop) / lineHeight);
                const displayLines = Math.ceil(boxHeight / lineHeight);
                const resultArray: string[] = [];
                for (let ii = scrollTopLines; ii <= scrollTopLines + displayLines; ii++) {
                    if (lines[ii] !== undefined) {
                        resultArray.push(lines[ii]);
                    }
                }
                const result = resultArray.join("\n");
                return {
                    scrollTop: scrollTop % lineHeight,
                    displayHeight: displayLines * lineHeight,
                    contents: result,
                };
            } else {
                return {
                    scrollTop: 3.1415926,
                    displayHeight: -1,
                    contents: this.getFileContents()
                }
            }
        }

        const updateHighlightArea = () => {
            if (this.getFileContents().length >= this.fileLimit) {
                return;
            }
            const reducedFileContentsData = calcReducedFileContents();
            if (elementCodeRef.current !== null && elementCodeWrapperRef.current !== null) {
                elementCodeWrapperRef.current.scrollTop = reducedFileContentsData["scrollTop"];
                setReducedFileContents(reducedFileContentsData["contents"]);
            }
        }

        this.updateHighlightArea = updateHighlightArea;
        const mainProcessMode = g_widgets1.getRoot().getDisplayWindowClient().getMainProcessMode();

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
                        <ElementRectangleButton
                            marginRight={10}
                            handleClick={() => {
                                if (mainProcessMode === "web") {
                                    g_widgets1.getRoot().getDisplayWindowClient().openTextFileInTextEditorInWebMode(this);
                                } else {
                                    const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
                                    displayWindowClient.getIpcManager().sendFromRendererProcess("open-text-file-in-text-editor", {
                                        displayWindowId: displayWindowClient.getWindowId(),
                                        widgetKey: this.getWidgetKey(),
                                        fileName: "",
                                        manualOpen: true,
                                    })
                                }
                            }}>
                            {mainProcessMode === "web" ? "Open file on this computer" : "Open File"}
                        </ElementRectangleButton>
                        <ElementRectangleButton
                            additionalStyle={{
                                display: mainProcessMode === "web" ? "none" : "inline-flex",
                            }}
                            marginRight={10}
                            handleClick={() => {
                                const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
                                displayWindowClient.getIpcManager().sendFromRendererProcess("save-text-file", {
                                    displayWindowId: displayWindowClient.getWindowId(),
                                    widgetKey: this.getWidgetKey(),
                                    fileName: this.getFileName(), // if it is "", do the "save as"
                                    fileContents: this.getFileContents(),
                                })
                            }}>
                            Save File
                        </ElementRectangleButton>
                        <ElementRectangleButton
                            marginRight={10}
                            handleClick={() => {
                                if (mainProcessMode === "web") {
                                    const blob = new Blob([this.getFileContents()], { type: 'text/text' });
                                    const relativePath = path.basename(this.getFileName());
                                    g_widgets1.getRoot().getDisplayWindowClient().downloadData(blob, relativePath, "Save Text File", "text/text", []);
                                } else {
                                    const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
                                    displayWindowClient.getIpcManager().sendFromRendererProcess("save-text-file", {
                                        displayWindowId: displayWindowClient.getWindowId(),
                                        widgetKey: this.getWidgetKey(),
                                        fileName: "", // if it is "", do the "save as"
                                        fileContents: this.getFileContents(),
                                    })
                                }
                            }}>
                            {mainProcessMode === "web" ? "Save file to this computer" : "Save File As"}
                        </ElementRectangleButton>
                    </div>
                </div>
                <div style={{
                    paddingLeft: 30,
                    // paddingTop: 15,
                    boxSizing: "border-box",
                    fontSize: GlobalVariables.defaultFontSize * 1,
                }}>
                    <div>
                        {fileName === "" ? "[Empty file name]" : (fileName + (this.getWritable() === true ? "" : " [Read Only]"))}
                    </div>
                    <div style={{ marginTop: 10 }}>
                        {fileContents.length > this.fileLimit ? <div style={{ color: "rgba(255,0,0,1)" }}>The file is larger than 2.5 MB, you can only view it. This editor is designed for casual editing.</div> : ""}
                    </div>
                </div>
                <div style={{
                    width: "100%",
                    minHeight: 3,
                    maxHeight: 3,
                    backgroundColor: "rgba(200,200,200,1)",
                    marginBottom: 10,
                    marginTop: 10,
                }}>
                </div>
                <div style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    overflowX: "scroll",
                    overflowY: "scroll",
                    overflow: "hidden",
                    paddingLeft: 30,
                    paddingTop: 0,
                    boxSizing: "border-box",
                }}>
                    <div style={{
                        overflowX: "scroll",
                        overflowY: "scroll",
                        position: "relative",
                        // width: fileContents.length > this.fileLimit ? 0 : "100%",
                        width: "100%",
                        height: "100%",
                        // visibility: fileContents.length > this.fileLimit ? "hidden" : "visible",
                    }}
                        ref={elementCodeWrapperRef}
                    >
                        <code
                            className={this.determineSyntaxHighlighterClassName()}
                            ref={elementCodeRef}
                            style={{
                                width: "100%",
                                height: "100%",
                                whiteSpace: "pre",
                                backgroundColor: "rgba(0,255,0,0)",
                            }}>
                            {
                                fileContents.length > this.fileLimit ? fileContents : reducedFileContents + ((reducedFileContents.charCodeAt(reducedFileContents.length - 1) === 10 || reducedFileContents.charCodeAt(reducedFileContents.length - 1) === 13) ? " " : "")
                            }
                        </code>
                    </div>
                    {fileContents.length > this.fileLimit ? null :
                        <textarea
                            ref={elementTextAreaRef}
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 30,
                                right: 0,
                                width: "calc(100% - 30px)",
                                height: "100%",
                                overflowY: "scroll",
                                overflowX: "scroll",
                                fontFamily: "Consolas,Monaco,'Andale Mono','Ubuntu Mono',monospace",
                                fontSize: "1em",
                                fontWeight: 700,
                                color: fileContents.length > this.fileLimit ? "rgba(0,0,0,1)" : "rgba(255, 0, 0, 0)",
                                // color: "rgba(255, 0, 0, 1)",
                                lineHeight: 1.5,
                                border: "none",
                                outline: "none",
                                padding: 0,
                                caretColor: "rgba(0,0,0,1)",
                                whiteSpace: "pre",
                                backgroundColor: "rgba(255,0,0,0)",
                                resize: "none",
                            }}
                            spellCheck={false}
                            value={fileContents}
                            onChange={(event: any) => {
                                event.preventDefault();
                                this.setWindowName(this.getFileName(), true);
                                this.setModified(true);
                                setFileContents((prevFileContents: string) => {
                                    return event.target.value;
                                });
                                setReducedFileContents(calcReducedFileContents()["contents"])
                            }}
                            onScroll={(event: any) => {
                                let scrollTop = 0;
                                let scrollLeft = 0;
                                if (elementTextAreaRef.current !== null && elementCodeRef.current !== null) {
                                    // get <textarea>'s scrollTop
                                    scrollTop = elementTextAreaRef.current.scrollTop;
                                    scrollLeft = elementTextAreaRef.current.scrollLeft;
                                    // set <code>'s scrollTop
                                    updateHighlightArea();
                                    elementCodeWrapperRef.current.scrollLeft = scrollLeft;
                                }
                            }}
                        >
                        </textarea>
                    }
                </div>
            </div>
        );
    };

    determineSyntaxHighlighterClassName = () => {
        const fileName = `${this.getFileName()}`;
        if (fileName.endsWith(".py")) {
            return "language-python";
        } else if (fileName.endsWith(".js") || fileName.endsWith(".ts")) {
            return "language-javascript";
        } else if (fileName.endsWith(".sh") || fileName.endsWith(".cmd")) { // st.cmd
            return "language-bash";
        } else if (fileName.endsWith(".java")) {
            return "language-java";
        } else if (fileName.endsWith(".pl")) {
            return "language-perl";
        } else if (fileName.endsWith(".json") || fileName.endsWith(".tdl")) {
            return "language-json";
        } else if (fileName.endsWith(".db") || fileName.endsWith(".template") || fileName.endsWith(".substitutions") || fileName.endsWith(".dbd")) {
            return "language-julia";
        } else if (fileName.endsWith(".svg")) {
            return "language-svg";
        } else if (fileName.endsWith(".ini")) {
            return "language-ini";
        } else if (fileName.endsWith(".xml") || fileName.endsWith(".bob") || fileName.endsWith(".opi")) {
            return "language-xml";
        } else if (fileName.endsWith(".html")) {
            return "language-html";
        } else if (fileName.endsWith(".css")) {
            return "language-css";
        } else if (fileName.endsWith(".c") || fileName.endsWith(".cc") || fileName.endsWith(".cpp") || fileName.endsWith(".h")) {
            return "language-clike";
        } else if (fileName.endsWith(".toml")) {
            return "language-toml";
        } else if (fileName.endsWith(".sql")) {
            return "language-sql";
        } else if (fileName.endsWith(".tex")) {
            return "language-latex";
        } else if (fileName.endsWith(".ps1")) {
            return "language-powershell";
        } else if (fileName.endsWith(".md")) {
            return "language-markdown";
        } else if (fileName.includes("Makefile") || fileName.includes("configure/CONFIG") || fileName.includes("configure/RULES") || fileName.includes("configure/RELEASE") || fileName.includes("envPaths")) {
            return "language-makefile";
        } else {
            return "language-plain";
        }
    }

    /**
     * Invoked upon the "text-file-contents" event 
     */
    loadFileContents = (result: {
        fileName: string,
        fileContents: string
        readable: boolean,
        writable: boolean,
    }) => {
        // this.setFileContents(result["fileContents"]);
        this.setFileName(result["fileName"]);
        this.setWritable(result["writable"]);
        if (this.setFileContentsState !== undefined) {
            this.setFileContentsState(result["fileContents"]);
        }
        if (this.setFileNameState !== undefined) {
            this.setFileNameState(this.getFileName());
        }
        this.setWindowName(result["fileName"], false);
        this.setModified(false);
    }


    // concretize abstract method
    _Element = React.memo(this._ElementRaw, () => this._useMemoedElement());
    _ElementArea = React.memo(this._ElementAreaRaw, () => this._useMemoedElement());
    _ElementBody = React.memo(this._ElementBodyRaw, () => this._useMemoedElement());

    // defined in super class
    // getElement()
    // getSidebarElement()

    // -------------------- helper functions ----------------

    // defined in super class
    // _showSidebar()
    // _showResizers()
    // _useMemoedElement()
    // hasChannel()
    // isInGroup()
    // isSelected()
    // _getElementAreaRawOutlineStyle()

    _getChannelValue = () => {
        return this._getFirstChannelValue();
    };
    _getChannelSeverity = () => {
        return this._getFirstChannelSeverity();
    };
    _getChannelUnit = () => {
        return this._getFirstChannelUnit();
    };

    getFileName = () => {
        return this.getAllText()["fileName"];
    }

    // getFileContents = () => {
    //     return this.getAllText()["fileContents"];
    // }
    getFileContents = () => {
        return "";
    }

    setFileName = (newFileName: string, modified: boolean = false) => {
        this.getText()["fileName"] = newFileName;
        // update window title
        this.setWindowName(newFileName, modified);
    }

    setWindowName = (newFileName: string, modified: boolean = false) => {
        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
        const canvas = g_widgets1.getWidget("Canvas");
        if (canvas instanceof Canvas) {
            let oldWindowName = canvas.getWindowName();
            let newWindowName = "";
            if (newFileName === "") {
                newWindowName = "TDM Text Editor -- [Empty file name]";
            } else {
                if (modified) {
                    if (this.getWritable() === false) {
                        newWindowName = "TDM Text Editor -- " + newFileName + " [Read Only]" + " [Modified]";
                    } else {
                        newWindowName = "TDM Text Editor -- " + newFileName + " [Modified]";
                    }
                } else {
                    if (this.getWritable() === false) {
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


    // setFileContents = (newContents: string) => {
    //     this.getText()["fileContents"] = newContents;
    // }

    getWritable = () => {
        return this.getAllText()["writable"];
    }

    setWritable = (writable: boolean) => {
        this.getText()["writable"] = writable;
    }



    // ----------------------- styles -----------------------

    // defined in super class

    // _resizerStyle
    // _resizerStyles
    // StyledToolTipText
    // StyledToolTip

    // -------------------------- tdl -------------------------------

    // override BaseWidget
    static _defaultTdl: type_TextEditor_tdl = {
        type: "TextEditor",
        widgetKey: "", // "key" is a reserved keyword
        key: "",
        // the style for outmost div
        // these properties are explicitly defined in style because they are
        // (1) different from default CSS settings, or
        // (2) they may be modified
        style: {
            position: "absolute",
            display: "inline-block",
            backgroundColor: "rgba(255, 255,255, 1)",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            boxSizing: "border-box",
            overflow: "scroll",
            outlineStyle: "none",
            // outlineWidth: 1,
            // outlineColor: "black",
            transform: "rotate(0deg)",
            color: "rgba(0,0,0,1)",
            borderStyle: "solid",
            borderWidth: 0,
            borderColor: "rgba(255, 0, 0, 1)",
        },
        // the ElementBody style
        text: {
            fileName: "",
            // fileContents: "",
            writable: false,
        },
        channelNames: [],
        groupNames: [],
        rules: [],
    };

    // override
    static generateDefaultTdl = (type: string) => {
        // defines type, widgetKey, and key
        const result = super.generateDefaultTdl(type) as type_TextEditor_tdl;
        result.style = JSON.parse(JSON.stringify(this._defaultTdl.style));
        result.text = JSON.parse(JSON.stringify(this._defaultTdl.text));
        result.channelNames = JSON.parse(JSON.stringify(this._defaultTdl.channelNames));
        result.groupNames = JSON.parse(JSON.stringify(this._defaultTdl.groupNames));
        return result;
    };

    // static method for generating a widget tdl with external PV name
    static generateWidgetTdl = (utilityOptions: Record<string, any>): type_TextEditor_tdl => {
        const result = this.generateDefaultTdl("TextEditor");
        result.text["fileName"] = utilityOptions["fileName"];
        return result;
    };

    // getTdlCopy()

    // --------------------- getters -------------------------

    // defined in super class
    // getType()
    // getWidgetKey()
    // getStyle()
    // getText()
    // getSidebar()
    // getGroupName()
    // getGroupNames()
    // getupdateFromWidget()
    // getResizerStyle()
    // getResizerStyles()

    // ---------------------- setters -------------------------

    // ---------------------- channels ------------------------

    // defined in super class

    // getChannelNames()
    // expandChannelNames()
    // getExpandedChannelNames()
    // setExpandedChannelNames()
    // expandChannelNameMacro()

    // ------------------------ z direction --------------------------

    // defined in super class
    // moveInZ()
    // -------------------------- sidebar ---------------------------
    createSidebar = () => {
    }
}
