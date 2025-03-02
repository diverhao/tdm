import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { ElementRectangleButton, ElementRectangleButtonDefaultBackgroundColor } from "../../helperWidgets/SharedElements/RectangleButton";

export type type_TdlViewer_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
};

export class TdlViewer extends BaseWidget {
    constructor(widgetTdl: type_TdlViewer_tdl) {
        super(widgetTdl);

        this.setStyle({ ...TdlViewer._defaultTdl.style, ...widgetTdl.style });
        this.setText({ ...TdlViewer._defaultTdl.text, ...widgetTdl.text });

        // assign the sidebar
        // this._sidebar = new ProfilesViewerSidebar(this);

        // dynamically load css and js
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = '../../../webpack/resources/css/prism.css'; // Make sure the path is correct relative to your HTML file
        document.head.appendChild(css);
        const js = document.createElement('script');
        js.src = '../../../webpack/resources/js/prism.js';
        js.type = 'text/javascript';
        document.head.appendChild(js);
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
                }
                }
            >
                <this._ElementArea></this._ElementArea>
            </div>
        );
    };


    // only shows the text, all other style properties are held by upper level _ElementBodyRaw
    _ElementAreaRaw = ({ }: any): JSX.Element => {
        // "macros", "script", "tdl-file-contents"
        const [selection, setSelection] = React.useState("tdl-file-contents");
        return (
            <div
                style={{
                    boxSizing: "border-box",
                    padding: 40,
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <div style={{
                    display: "inline-flex",
                    flexDirection: "row",
                }}
                >
                    <ElementRectangleButton
                        defaultBackgroundColor={selection === "tdl-file-contents" ? ElementRectangleButtonDefaultBackgroundColor : "grey"}
                        marginRight={10}
                        handleClick={
                            () => {
                                setSelection("tdl-file-contents");
                            }
                        }
                    >
                        TDL File
                    </ElementRectangleButton>
                    <ElementRectangleButton
                        defaultBackgroundColor={selection === "macros" ? ElementRectangleButtonDefaultBackgroundColor : "grey"}
                        marginRight={10}
                        handleClick={
                            () => {
                                setSelection("macros");
                            }
                        }
                    >
                        Macros
                    </ElementRectangleButton>
                    <ElementRectangleButton
                        defaultBackgroundColor={selection === "script" ? ElementRectangleButtonDefaultBackgroundColor : "grey"}
                        marginRight={10}
                        handleClick={
                            () => {
                                setSelection("script");
                            }
                        }
                    >
                        Script
                    </ElementRectangleButton>
                </div>
                <div style={{

                }}>
                </div>
                <this._ElementMacros show={selection === "macros"}></this._ElementMacros>
                <this._ElementScript show={selection === "script"}></this._ElementScript>
                <this._ElementTdlFileContents show={selection === "tdl-file-contents"}></this._ElementTdlFileContents>
            </div >
        );
    };


    _ElementTdlFileContents = ({ show }: any) => {
        const elementRef = React.useRef<any>(null);
        return (
            <div style={{
                display: show === true ? "inline-flex" : "none",
                boxSizing: "border-box",
                paddingTop: 20,
                flexDirection: "column",
            }}>
                <div>
                    <hr></hr>
                </div>
                <div>
                    <div>{this.getText()["tdlFileName"]}</div>
                    <ElementRectangleButton
                        defaultBackgroundColor={"grey"}
                        handleClick={() => {
                            const tdlFileName = this.getText()["tdlFileName"];
                            const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
                            const externalMacros = this.getText()["externalMacros"];
                            displayWindowClient.getIpcManager().sendFromRendererProcess("open-tdl-file", {
                                tdlFileNames: [tdlFileName],
                                mode: "operating",
                                editable: true,
                                macros: externalMacros,
                                replaceMacros: false, // not used
                                currentTdlFolder: "",
                                openInSameWindow: false,
                                windowId: displayWindowClient.getWindowId(),
                            })
                        }}
                    >
                        Open
                    </ElementRectangleButton>
                </div>
                <div>
                    <hr></hr>
                </div>
                <div>
                    <ElementRectangleButton
                        defaultBackgroundColor={"grey"}
                        handleClick={() => {
                            const tdl = this.getText()["tdl"];
                            if (tdl !== undefined) {
                                navigator.clipboard.writeText(JSON.stringify(tdl, null, 4));
                            }
                        }}
                    >
                        Copy
                    </ElementRectangleButton>
                </div>

                <code className="language-javascript" style={{
                    whiteSpace: "pre",
                }}>
                    {
                        JSON.stringify(this.getText()["tdl"], null, 4)
                    }
                </code>
            </div>
        )
    }


    _ElementScript = ({ show }: any) => {
        const scriptFullFileName = this.getText()["scriptFullFileName"];
        const elementRef = React.useRef<any>(null);
        const elemenEditRef = React.useRef<any>(null);
        return <div
            style={{
                display: show === true ? "inline-flex" : "none",
                boxSizing: "border-box",
                paddingTop: 20,
                whiteSpace: "pre-wrap",
                flexDirection: "column",
            }}
        >
            <div
                style={{
                    color: "rgba(100, 100,100, 1)",
                }}
            >
                This file is executed in a separate thread. It could be either a Python or JavaScript code. It is defined in the Canvas.
            </div>
            <div>
                <hr />
            </div>
            <div>
                {scriptFullFileName}
            </div>
            <div>
                <hr />
            </div>
            <div>
                <ElementRectangleButton
                    marginTop={10}
                    marginBottom={10}
                    marginRight={10}
                    defaultBackgroundColor={"grey"}
                    handleClick={() => {
                        const scriptFileContents = this.getText()["scriptFileContents"];
                        if (scriptFileContents !== undefined) {
                            // navigator.clipboard.writeText(JSON.stringify(scriptFileContents));
                            navigator.clipboard.writeText(scriptFileContents);
                        }
                    }}
                >
                    Copy
                </ElementRectangleButton>
                <ElementRectangleButton
                    marginTop={10}
                    marginBottom={10}
                    defaultBackgroundColor={"grey"}
                    handleClick={() => {
                        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
                        g_widgets1.openTextEditorWindow({
                            displayWindowId: displayWindowClient.getWindowId(), // for showing the error message
                            widgetKey: this.getWidgetKey(),
                            fileName: scriptFullFileName, // practically the only info that we need, because we are going to open it in a new window
                            manualOpen: false,  // do not show dialog
                            openNewWindow: true, // open in new TextEditor window
                        })
                    }}
                >
                    Open in Text Editor
                </ElementRectangleButton>

            </div>

            <code
                className={`${scriptFullFileName}`.endsWith("js") ? "language-javascript" : `${scriptFullFileName}`.endsWith("py") ? "language-python" : ""}
                style={{
                    whiteSpace: "pre",
                }}>
                {this.getText()["scriptFileContents"]}
            </code>
        </div>;
    }

    _ElementMacros = ({ show }: any) => {
        return (
            <div
                style={{
                    display: show === true ? "" : "none",
                    boxSizing: "border-box",
                    paddingTop: 20,

                }}
            >
                <table
                    style={{
                        boxSizing: "border-box",
                        borderCollapse: "collapse",
                        width: "80%",
                    }}
                >
                    <tr>
                        <th
                            style={{
                                border: "1px solid #dddddd",
                                textAlign: "left",
                                padding: "8px",
                            }}
                        >
                            Name
                        </th>
                        <th
                            style={{
                                border: "1px solid #dddddd",
                                textAlign: "left",
                                padding: "8px",
                            }}
                        >
                            Value
                        </th>
                    </tr>
                    {this.getText()["externalMacros"].map((nameValue: [string, string], index: number) => {
                        const name = nameValue[0];
                        const value = nameValue[1];
                        return (
                            <tr
                                style={{
                                    backgroundColor: index % 2 === 0 ? "#dddddd" : "white",
                                }}
                            >
                                <td
                                    style={{
                                        border: "1px solid #dddddd",
                                        textAlign: "left",
                                        padding: "8px",
                                        boxSizing: "border-box",
                                    }}
                                >
                                    {name}
                                </td>
                                <td
                                    style={{
                                        border: "1px solid #dddddd",
                                        textAlign: "left",
                                        padding: "8px",
                                        boxSizing: "border-box",
                                    }}
                                >
                                    {value}
                                </td>
                            </tr>
                        );
                    })}
                </table>
            </div>
        );
    };

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

    // ----------------------- styles -----------------------

    // defined in super class

    // _resizerStyle
    // _resizerStyles
    // StyledToolTipText
    // StyledToolTip

    // -------------------------- tdl -------------------------------

    // override BaseWidget
    static _defaultTdl: type_TdlViewer_tdl = {
        type: "TdlViewer",
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
        text: {},
        channelNames: [],
        groupNames: [],
        rules: [],
    };

    // override
    static generateDefaultTdl = (type: string) => {
        // defines type, widgetKey, and key
        const result = super.generateDefaultTdl(type) as type_TdlViewer_tdl;
        result.style = JSON.parse(JSON.stringify(this._defaultTdl.style));
        result.text = JSON.parse(JSON.stringify(this._defaultTdl.text));
        result.channelNames = JSON.parse(JSON.stringify(this._defaultTdl.channelNames));
        result.groupNames = JSON.parse(JSON.stringify(this._defaultTdl.groupNames));
        return result;
    };

    // static method for generating a widget tdl with external PV name
    static generateWidgetTdl = (utilityOptions: Record<string, any>): type_TdlViewer_tdl => {
        const result = this.generateDefaultTdl("TdlViewer");
        result.text["tdl"] = utilityOptions["tdl"] as Record<string, any>;
        result.text["externalMacros"] = utilityOptions["externalMacros"];
        result.text["tdlFileName"] = utilityOptions["tdlFileName"];
        result.text["scriptFileContents"] = utilityOptions["scriptFileContents"];
        result.text["scriptFullFileName"] = utilityOptions["scriptFullFileName"];
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
