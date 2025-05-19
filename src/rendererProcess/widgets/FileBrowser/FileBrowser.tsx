import * as React from "react";
import { MouseEvent } from "react";
import { GlobalVariables, g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { GroupSelection2 } from "../../helperWidgets/GroupSelection/GroupSelection2";
import { FileBrowserSidebar } from "./FileBrowserSidebar";
import * as GlobalMethods from "../../global/GlobalMethods";
import { BaseWidget } from "../BaseWidget/BaseWidget";

import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
// import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary"
import { Log } from "../../../mainProcess/log/Log";
import path from "path";


export type type_FileBrowser_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
};

export type type_folder_content = type_single_file_folder[];


export type type_single_file_folder = {
    name: string, // only the name
    type: "file" | "folder",
    size: number,
    timeModified: number,
};

export class FileBrowser extends BaseWidget {
    // level-1 properties in tdl file
    // _type: string;
    // _widgetKey: string;
    // _style: Record<string, any>;
    // _text: Record<string, any>;
    // _channelNames: string[];
    // _groupNames: string[] = undefined;

    // sidebar
    // private _sidebar: TextUpdateSidebar;

    // tmp methods
    // private _tmp_mouseMoveOnResizerListener: any = undefined;
    // private _tmp_mouseUpOnResizerListener: any = undefined;

    // widget-specific channels, these channels are only used by this widget
    // private _tcaChannels: TcaChannel[];

    // used for the situation of shift key pressed + mouse down on a selected widget,
    // so that when the mouse is up, the widget is de-selected
    // its value is changed in 3 places: this.select2(), this._handleMouseMove() and this._handleMouseUp()
    // private _readyToDeselect: boolean = false;

    // _rules: TextUpdateRules;

    _folderPath: string = "";
    _folderContent: type_folder_content = [];


    forceUpdate = (input: any) => { };
    onlyShowTdmFiles: boolean = true;
    setThumbnail: (input: any) => void = (input) => { };
    setFolderPathInput: (input: any) => void = (input) => { };
    oldFolderPath: string = "";
    filterText: string = "";

    constructor(widgetTdl: type_FileBrowser_tdl) {
        super(widgetTdl);
        this.setReadWriteType("read");

        this.setStyle({ ...FileBrowser._defaultTdl.style, ...widgetTdl.style });
        this.setText({ ...FileBrowser._defaultTdl.text, ...widgetTdl.text });
        this._folderPath = widgetTdl["text"]["path"];

        // this._rules = new FileBrowser(this, widgetTdl);

        // this._sidebar = new TextUpdateSidebar(this);

        window.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                console.log('Global prevent:', event.key);
            }
        }, { passive: false });

    }

    // ------------------------- event ---------------------------------

    // defined in widget, invoked in sidebar
    // (1) determine which tdl property should be updated
    // (2) calculate new value
    // (3) assign new value
    // (4) add this widget as well as "GroupSelection2" to g_widgets1.forceUpdateWidgets
    // (5) flush
    updateFromSidebar = (event: any, propertyName: string, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        // todo: remove this method
    };

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

    // element = <> body (area + resizer) + sidebar </>

    // Body + sidebar
    _ElementRaw = () => {
        this.setRulesStyle({});
        this.setRulesText({});
        const rulesValues = this.getRules()?.getValues();
        if (rulesValues !== undefined) {
            this.setRulesStyle(rulesValues["style"]);
            this.setRulesText(rulesValues["text"]);
        }
        this.setAllStyle({ ...this.getStyle(), ...this.getRulesStyle() });
        this.setAllText({ ...this.getText(), ...this.getRulesText() });

        // must do it for every widget
        g_widgets1.removeFromForceUpdateWidgets(this.getWidgetKey());
        this.renderChildWidgets = true;
        React.useEffect(() => {
            this.renderChildWidgets = false;
        });

        return (
            <ErrorBoundary style={this.getStyle()} widgetKey={this.getWidgetKey()}>
                <>
                    <this._ElementBody></this._ElementBody>
                    {this._showSidebar() ? this._sidebar?.getElement() : null}
                </>
            </ErrorBoundary>
        );
    };



    getElementFallbackFunction = () => {
        return this._ElementFallback;
    }

    // Text area and resizers
    _ElementBodyRaw = (): JSX.Element => {
        return (
            // always update the div below no matter the TextUpdateBody is .memo or not
            // TextUpdateResizer does not update if it is .memo
            <div style={{ ...this.getElementBodyRawStyle(), overflow: "hidden", }}>
                <this._ElementArea></this._ElementArea>
                {this._showResizers() ? <this._ElementResizer /> : null}
            </div>
        );
    };

    // only shows the text, all other style properties are held by upper level _ElementBodyRaw
    _ElementAreaRaw = ({ }: any): JSX.Element => {
        const allStyle = this.getAllStyle();
        const allText = this.getAllText();
        let style: React.CSSProperties = {};

        style = {
            display: "inline-flex",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            userSelect: "none",
            // overflow: "show",
            whiteSpace: this.getAllText().wrapWord ? "normal" : "pre",
            justifyContent: this.getAllText().horizontalAlign,
            alignItems: this.getAllText().verticalAlign,
            fontFamily: this.getAllStyle().fontFamily,
            fontSize: this.getAllStyle().fontSize,
            fontStyle: this.getAllStyle().fontStyle,
            fontWeight: this.getAllStyle().fontWeight,
            outline: this._getElementAreaRawOutlineStyle(),
            color: this._getElementAreaRawTextStyle(),
            // backgroundColor: this.getAllText()["invisibleInOperation"] ? "rgba(0,0,0,0)" : this._getElementAreaRawBackgroundStyle(),
            backgroundColor: "rgba(255, 0, 0, 0)",
            overflow: "hidden",
            pointerEvents: "auto",
        }

        return (
            <div
                style={style}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                <this._ElementFileBrowser></this._ElementFileBrowser>
            </div>
        );
    };

    _ElementFileBrowser = () => {
        const [, forceUpdate] = React.useState({});
        const elementRef = React.useRef<any>(null);

        this.forceUpdate = forceUpdate;
        React.useEffect(() => {
            if (g_widgets1.isEditing()) {
                return;
            } else {
                this.fetchFolderContent();
            }
        }, [])
        return (
            <div
                ref={elementRef}
                style={{
                    backgroundColor: "rgba(255, 255, 255, 1)",
                    overflow: "auto",
                    width: "100%",
                    height: "100%",
                    paddingTop: 30,
                    paddingLeft: 30,
                    paddingBottom: 30,
                    paddingRight: 30,
                    display: "inline-flex",
                    flexDirection: "column",
                }}>
                <this._ElementHeader></this._ElementHeader>
                <div style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    width: "100%",
                }}>
                    <this._ElementTable></this._ElementTable>
                    <this._ElementThumbnail parentElementRef={elementRef}></this._ElementThumbnail>
                </div>
            </div>
        )
    }

    _ElementTable = () => {
        const [selectedItem, setSelectedItem] = React.useState("");

        return (
            <table
                tabIndex={0} // Make the table focusable
                style={{
                    borderCollapse: "collapse",
                    tableLayout: "fixed",
                    marginBottom: 50,
                    outline: "none",
                }}
                onKeyDown={(event: React.KeyboardEvent) => {
                    if (event.key !== "ArrowUp" && event.key !== "ArrowDown" && event.key !== "Enter") {
                        return;
                    }

                    let toBeSelectedItemIndex = -1;

                    let selectedItemIndex = -1;
                    for (let ii = 0; ii < this.getFolderContent().length; ii++) {
                        const element = this.getFolderContent()[ii];
                        const name = element["name"];
                        if (name === selectedItem) {
                            selectedItemIndex = ii;
                            break;
                        }
                    }

                    if (event.key === "Enter") {
                        // same as double click on table row
                        const element = this.getFolderContent()[selectedItemIndex];
                        if (element["type"] === "folder") {
                            const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
                            const ipcManager = displayWindowClient.getIpcManager();
                            const displayWindowId = displayWindowClient.getWindowId();
                            const newFolderPath = path.join(this.getFolderPath(), element["name"]);
                            this.setFolderPath(newFolderPath);
                            this.setThumbnail("../../../mainProcess/resources/webpages/blank.svg")
                            this.fetchFolderContent();

                        } else if (element["type"] = "file") {
                            const fullTdlFileName = path.join(this.getFolderPath(), element["name"]);
                            if (fullTdlFileName.endsWith(".tdl") || fullTdlFileName.endsWith(".edl") || fullTdlFileName.endsWith(".db") || fullTdlFileName.endsWith(".tempate")) {
                                const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
                                const ipcManager = displayWindowClient.getIpcManager();
                                const displayWindowId = displayWindowClient.getWindowId();
                                const editableRaw = displayWindowClient.getProfileEntry("EPICS Custom Environment", "Manually Opened TDL Editable");

                                let editable = true;
                                if (editableRaw === undefined) {
                                    editable = false;
                                } else if (typeof editableRaw === "string" && editableRaw.toLowerCase() === "no") {
                                    editable = false;
                                } else if (typeof editableRaw === "string" && editableRaw.toLowerCase() === "yes") {
                                    editable = true;
                                } else {
                                    editable = false;
                                }
                                const modeRaw = displayWindowClient.getProfileEntry("EPICS Custom Environment", "Manually Opened TDL Mode");
                                let mode = "operating";
                                if (modeRaw === undefined) {
                                    mode = "operating";
                                } else if (typeof modeRaw === "string" && modeRaw.toLowerCase() === "operating") {
                                    mode = "operating";
                                } else if (typeof modeRaw === "string" && modeRaw.toLowerCase() === "editing") {
                                    mode = "editing"
                                } else {
                                    mode = "operating";
                                }

                                ipcManager.sendFromRendererProcess("open-tdl-file", {
                                    tdlFileNames: [fullTdlFileName],
                                    mode: mode,
                                    editable: editable,
                                    macros: [],
                                    replaceMacros: false,
                                    currentTdlFolder: this.getFolderPath(),
                                    openInSameWindow: false,
                                    windowId: displayWindowId,
                                })
                            }
                        }
                        return;
                    } else if (event.key === "ArrowDown") {
                        for (let ii = selectedItemIndex + 1; ii < this.getFolderContent().length; ii++) {
                            const nextElement = this.getFolderContent()[ii];
                            const name = nextElement["name"];
                            // the element is a tdl file or a folder
                            if (this.onlyShowTdmFiles === true) {
                                if (name.endsWith(".tdl") || nextElement["type"] === "folder") {
                                    if (name.toLowerCase().includes(this.filterText.toLowerCase())) {
                                        toBeSelectedItemIndex = ii;
                                        break;
                                    }
                                } else {
                                    // skip
                                }
                            } else {
                                if (name.toLowerCase().includes(this.filterText.toLowerCase())) {
                                    toBeSelectedItemIndex = ii;
                                    break;
                                }
                            }
                        }
                    } else if (event.key === "ArrowUp") {
                        if (event.altKey === true || event.metaKey === true) {
                            // go up one level, same as the go to parent folder
                            const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
                            const ipcManager = displayWindowClient.getIpcManager();
                            const displayWindowId = displayWindowClient.getWindowId();
                            const newFolderPath = path.dirname(this.getFolderPath());
                            this.setFolderPath(newFolderPath);
                            this.fetchFolderContent();
                            this.setThumbnail("../../../mainProcess/resources/webpages/blank.svg");
                            return;
                        } else {
                            for (let ii = selectedItemIndex - 1; ii >= 0; ii--) {
                                const prevElement = this.getFolderContent()[ii];
                                const name = prevElement["name"];
                                // the element is a tdl file or a folder
                                if (this.onlyShowTdmFiles === true) {
                                    if (name.endsWith(".tdl") || prevElement["type"] === "folder") {
                                        if (name.toLowerCase().includes(this.filterText.toLowerCase())) {
                                            toBeSelectedItemIndex = ii;
                                            break;
                                        }
                                    } else {
                                        // skip
                                    }
                                } else {
                                    if (name.toLowerCase().includes(this.filterText.toLowerCase())) {
                                        toBeSelectedItemIndex = ii;
                                        break;
                                    }
                                }
                            }
                        }
                    }


                    if (toBeSelectedItemIndex > this.getFolderContent().length - 1 || toBeSelectedItemIndex < 0) {
                        return;
                    } else {
                        // same as onMouseDown for table row
                        const element = this.getFolderContent()[toBeSelectedItemIndex];
                        setSelectedItem(element["name"]);
                        if (element["name"].endsWith(".tdl")) {
                            // wait for the new thumbnail
                            this.setThumbnail("../../../mainProcess/resources/webpages/blank.svg");
                            this.fetchThumbnail(element["name"]);
                        } else if (element["type"] === "folder") {
                            this.setThumbnail("../../../mainProcess/resources/webpages/blank.svg");
                            // this.setThumbnail("../../../mainProcess/resources/webpages/open-file-symbol.svg");
                        } else {
                            this.setThumbnail("../../../mainProcess/resources/webpages/blank.svg");
                            // this.setThumbnail("../../../mainProcess/resources/webpages/copy-symbol.svg");
                        }

                    }

                }}

            >
                <thead>
                    <tr style={{ textAlign: "left", backgroundColor: "rgba(220, 220, 220, 1)" }}>
                        <th style={{
                            paddingTop: 3,
                            paddingBottom: 3,
                            paddingLeft: 4,
                            paddingRight: 4,
                            maxWidth: '50em',
                        }}>
                            Name
                        </th>
                        <th style={{
                            paddingTop: 3,
                            paddingBottom: 3,
                            paddingLeft: 4,
                            paddingRight: 4,
                        }}>
                            Date Modified
                        </th>
                        <th style={{
                            paddingTop: 3,
                            paddingBottom: 3,
                            paddingLeft: 4,
                            paddingRight: 4,
                        }}>
                            Size
                        </th>
                        <th style={{
                            paddingTop: 3,
                            paddingBottom: 3,
                            paddingLeft: 4,
                            paddingRight: 4,
                        }}>
                            Kind
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {this.getFolderContent().map((element: type_single_file_folder, index: number) => {

                        const fileType = this.getFileType(element["name"], element["type"]);
                        if (fileType === "File" && this.onlyShowTdmFiles === true) {
                            return null;
                        } else if (!element["name"].toLowerCase().includes(this.filterText.toLowerCase())) {
                            return null;
                        } else {
                            const isSelected = selectedItem === element["name"] ? true : false;
                            return (
                                <this._ElementTableRow
                                    element={element}
                                    key={element["name"]}
                                    isSelected={isSelected}
                                    selectedItem={selectedItem}
                                    setSelectedItem={setSelectedItem}
                                    index={index}
                                >
                                </this._ElementTableRow>
                            )
                        }
                    })}
                </tbody>
            </table>
        )
    }

    _ElementFilter = () => {
        const [filterText, setFilterText] = React.useState("");
        return (
            <form onSubmit={(event: any) => { event.preventDefault() }}
                style={{
                    marginRight: 15,
                }}
            >
                Filter: &nbsp;
                <input
                    type="text"
                    value={filterText}
                    onChange={(event: any) => {
                        setFilterText(event.target.value);
                        this.filterText = event.target.value;
                        this.forceUpdate({});
                    }}
                    style={{
                        outline: "none",
                        borderRadius: 0,
                        border: "solid 1px rgba(100, 100, 100, 1)",
                    }}
                >
                </input>
            </form>
        )
    }

    _ElementHeader = () => {
        return (
            <div style={{
                display: "inline-flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "flex-start",
                width: "100%",
            }}>
                <div style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    marginBottom: 15,
                    width: "100%",
                }}>
                    <div style={{ fontSize: 30 }}>
                        File Browser for &nbsp;
                    </div>
                    <this._ElementFolderPath></this._ElementFolderPath>
                </div>
                <div style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    marginBottom: 15,
                    width: "100%",
                }}>
                    <this._ElementFilter></this._ElementFilter>
                    <this._ElementGoToParentFolder></this._ElementGoToParentFolder>
                    <this._ElementRefreshFolder></this._ElementRefreshFolder>
                    <this._ElementOnlyShowTdmFiles></this._ElementOnlyShowTdmFiles>
                </div>
            </div>
        )
    }

    _ElementFolderPath = () => {
        const [folderPath, setFolderPath] = React.useState(this.getFolderPath());
        this.setFolderPathInput = setFolderPath;
        const elementRef = React.useRef<any>(null);
        return (
            <form
                onSubmit={(event: any) => {
                    event.preventDefault();
                    // like refresh, force fetch
                    this.setFolderPath(folderPath);
                    this.fetchFolderContent();
                    this.setThumbnail("../../../mainProcess/resources/webpages/blank.svg");
                }}
                style={{
                    width: "100%",
                    flexGrow: 1,
                }}
            >
                <input
                    ref={elementRef}
                    style={{
                        fontSize: 30,
                        width: "100%",
                        outline: "none",
                        border: "none",
                    }}
                    type={"text"}
                    value={folderPath}
                    onChange={(event: any) => {
                        event.preventDefault();
                        setFolderPath(event.target.value);
                    }}
                    spellCheck={false}
                    onMouseEnter={() => {
                        if (elementRef.current !== null) {
                            elementRef.current.style["color"] = "rgba(255,0,0,1)";
                        }
                    }}
                    onMouseLeave={() => {
                        if (document.activeElement !== elementRef.current) {
                            elementRef.current.style["color"] = "rgba(0,0,0,1)";
                        }
                    }}
                    onFocus={() => {
                        if (elementRef.current !== null) {
                            elementRef.current.style["color"] = "rgba(255,0,0,1)";
                        }
                    }}

                    onBlur={() => {
                        if (elementRef.current !== null) {
                            elementRef.current.style["color"] = "rgba(0,0,0,1)";
                        }
                    }}
                >
                </input>
            </form>
        )
    }

    _ElementGoToParentFolder = () => {
        const elementRef = React.useRef<any>(null);
        return (
            <div
                ref={elementRef}
                onMouseDown={() => {
                    const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
                    const ipcManager = displayWindowClient.getIpcManager();
                    const displayWindowId = displayWindowClient.getWindowId();
                    const newFolderPath = path.dirname(this.getFolderPath());
                    this.setFolderPath(newFolderPath);
                    this.fetchFolderContent();
                    this.setThumbnail("../../../mainProcess/resources/webpages/blank.svg");
                }}
                style={{
                    fontSize: GlobalVariables.defaultFontSize * 1.5,
                    cursor: "pointer",
                    marginRight: 10,
                }}
                onMouseEnter={() => {
                    if (elementRef.current !== null) {
                        elementRef.current.style["opacity"] = 0.8;
                    }
                }}
                onMouseLeave={() => {
                    if (elementRef.current !== null) {
                        elementRef.current.style["opacity"] = 1;
                    }
                }}
            >
                ⬆️
            </div>
        )
    }

    _ElementRefreshFolder = () => {
        const elementRef = React.useRef<any>(null);
        return (
            <div
                ref={elementRef}
                onMouseDown={() => {
                    const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
                    this.setFolderPath(this.getFolderPath());
                    this.fetchFolderContent();
                    this.setThumbnail("../../../mainProcess/resources/webpages/blank.svg");
                }}
                style={{
                    fontSize: GlobalVariables.defaultFontSize * 1.5,
                    cursor: "pointer",
                    marginRight: 10,
                }}
                onMouseEnter={() => {
                    if (elementRef.current !== null) {
                        elementRef.current.style["opacity"] = 0.8;
                    }
                }}
                onMouseLeave={() => {
                    if (elementRef.current !== null) {
                        elementRef.current.style["opacity"] = 1;
                    }
                }}
            >
                🔄
            </div>
        )
    }

    _ElementTableRow = ({ element, index, isSelected, setSelectedItem, selectedItem }: { element: type_single_file_folder, index: number, isSelected: boolean, setSelectedItem: any, selectedItem: string }) => {
        const elementRef = React.useRef<any>(null);

        return (
            <tr
                ref={elementRef}
                style={{
                    backgroundColor: isSelected === true ? "rgba(200, 200, 200, 1)" : index % 2 === 1 ? "rgba(220, 220, 220, 0)" : "rgba(220, 220, 220, 0)",
                    // border: "solid 1px red",
                    // borderRadius: 5,
                }}
                onMouseEnter={() => {
                    if (elementRef.current !== null) {
                        elementRef.current.style["backgroundColor"] = "rgba(200, 200, 200, 1)";
                    }
                }}
                onMouseLeave={() => {
                    if (elementRef.current !== null) {
                        elementRef.current.style["backgroundColor"] = isSelected === true ? "rgba(200, 200, 200, 1)" : index % 2 === 1 ? "rgba(220, 220, 220, 0)" : "rgba(220, 220, 220, 0)";
                    }
                }}

                onMouseDown={() => {
                    if (element["name"] !== selectedItem) {
                        setSelectedItem(element["name"]);
                        if (element["name"].endsWith(".tdl")) {
                            // wait for the new thumbnail
                            this.setThumbnail("../../../mainProcess/resources/webpages/blank.svg");
                            this.fetchThumbnail(element["name"]);
                        } else if (element["type"] === "folder") {
                            this.setThumbnail("../../../mainProcess/resources/webpages/blank.svg");
                            // this.setThumbnail("../../../mainProcess/resources/webpages/open-file-symbol.svg");
                        } else {
                            this.setThumbnail("../../../mainProcess/resources/webpages/blank.svg");
                            // this.setThumbnail("../../../mainProcess/resources/webpages/copy-symbol.svg");
                        }
                    }
                }}

                onDoubleClick={() => {
                    if (element["type"] === "folder") {
                        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
                        const ipcManager = displayWindowClient.getIpcManager();
                        const displayWindowId = displayWindowClient.getWindowId();
                        const newFolderPath = path.join(this.getFolderPath(), element["name"]);
                        this.setFolderPath(newFolderPath);
                        this.setThumbnail("../../../mainProcess/resources/webpages/blank.svg")
                        this.fetchFolderContent();

                    } else if (element["type"] = "file") {
                        const fullTdlFileName = path.join(this.getFolderPath(), element["name"]);
                        if (fullTdlFileName.endsWith(".tdl") || fullTdlFileName.endsWith(".edl") || fullTdlFileName.endsWith(".db") || fullTdlFileName.endsWith(".tempate")) {
                            const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
                            const ipcManager = displayWindowClient.getIpcManager();
                            const displayWindowId = displayWindowClient.getWindowId();
                            const editableRaw = displayWindowClient.getProfileEntry("EPICS Custom Environment", "Manually Opened TDL Editable");

                            let editable = true;
                            if (editableRaw === undefined) {
                                editable = false;
                            } else if (typeof editableRaw === "string" && editableRaw.toLowerCase() === "no") {
                                editable = false;
                            } else if (typeof editableRaw === "string" && editableRaw.toLowerCase() === "yes") {
                                editable = true;
                            } else {
                                editable = false;
                            }
                            const modeRaw = displayWindowClient.getProfileEntry("EPICS Custom Environment", "Manually Opened TDL Mode");
                            let mode = "operating";
                            if (modeRaw === undefined) {
                                mode = "operating";
                            } else if (typeof modeRaw === "string" && modeRaw.toLowerCase() === "operating") {
                                mode = "operating";
                            } else if (typeof modeRaw === "string" && modeRaw.toLowerCase() === "editing") {
                                mode = "editing"
                            } else {
                                mode = "operating";
                            }

                            ipcManager.sendFromRendererProcess("open-tdl-file", {
                                tdlFileNames: [fullTdlFileName],
                                mode: mode,
                                editable: editable,
                                macros: [],
                                replaceMacros: false,
                                currentTdlFolder: this.getFolderPath(),
                                openInSameWindow: false,
                                windowId: displayWindowId,
                            })
                        }
                    }
                }}
            >
                <td style={{
                    color: "rgba(0,0,0,1)",
                    paddingTop: 3,
                    paddingBottom: 3,
                    paddingLeft: 4,
                    paddingRight: 15,
                    maxWidth: '50em',
                    borderTopLeftRadius: 3,
                    borderBottomLeftRadius: 3,
                    opacity: this.getFileType(element["name"], element["type"]) === "File" ? 0.5 : 1,
                    // textOverflow: "ellipsis",
                }}>

                    {element["type"] === "folder" ?
                        <div style={{
                            display: "inline-flex",
                            justifyContent: "flex-start",
                            alignItems: "center",
                            padding: 0,
                            textOverflow: "ellipsis",
                            maxWidth: "100%",
                            overflow: "hidden",
                        }}>
                            <img src="../../../mainProcess/resources/webpages/folder-symbol.svg"
                                style={{ width: GlobalVariables.defaultFontSize, height: GlobalVariables.defaultFontSize, opacity: 1, }}
                            >
                            </img>
                            &nbsp;
                            {element["name"]}
                        </div>
                        :
                        element["name"].endsWith(".tdl") ?
                            <div style={{
                                display: "inline-flex",
                                justifyContent: "flex-start",
                                alignItems: "center",
                                padding: 0,
                                textOverflow: "ellipsis",
                                maxWidth: "100%",
                                overflow: "hidden",
                            }}>
                                <img src="../../../mainProcess/resources/webpages/tdm-logo-large-fill.png"
                                    style={{ width: GlobalVariables.defaultFontSize, height: GlobalVariables.defaultFontSize }}
                                >
                                </img>
                                &nbsp;
                                {element["name"]}
                            </div>
                            :
                            <div style={{
                                display: "inline-flex",
                                justifyContent: "flex-start",
                                alignItems: "center",
                                padding: 0,
                                textOverflow: "ellipsis",
                                maxWidth: "100%",
                                overflow: "hidden",
                            }}>
                                <img src="../../../mainProcess/resources/webpages/document-symbol.svg"
                                    style={{ width: GlobalVariables.defaultFontSize, height: GlobalVariables.defaultFontSize }}
                                >
                                </img>
                                &nbsp;
                                {element["name"]}
                            </div>
                    }
                    {/* {element["name"]} */}
                </td>
                <td style={{
                    paddingTop: 3,
                    paddingBottom: 3,
                    paddingLeft: 4,
                    paddingRight: 15,
                }}>
                    {GlobalMethods.convertEpochTimeToString(element["timeModified"])}
                </td>
                <td style={{
                    paddingTop: 3,
                    paddingBottom: 3,
                    paddingLeft: 4,
                    paddingRight: 15,
                }}>
                    {this.getFileSize(element["size"])}
                </td>
                <td style={{
                    paddingTop: 3,
                    paddingBottom: 3,
                    paddingLeft: 4,
                    paddingRight: 4,
                    borderTopRightRadius: 3,
                    borderBottomRightRadius: 3,
                }}>
                    {this.getFileType(element["name"], element["type"])}
                </td>
            </tr>
        )
    }

    _ElementOnlyShowTdmFiles = () => {

        const [checked, setChecked] = React.useState(this.onlyShowTdmFiles);

        return (
            <form onSubmit={(event: any) => {
                event.preventDefault();
            }}
                style={{
                    display: "inline-flex",
                    justifyContent: "flex-start",
                    alignItems: "center",
                }}
            >
                Only show TDM related files:
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                        setChecked(!checked);
                        this.onlyShowTdmFiles = !this.onlyShowTdmFiles;
                        this.forceUpdate({});
                    }}
                >
                </input>
            </form>
        )
    }

    _ElementThumbnail = ({ parentElementRef }: any) => {
        const [thumbnail, setThumbnail] = React.useState("../../../mainProcess/resources/webpages/blank.svg");
        this.setThumbnail = setThumbnail;
        const elementRef = React.useRef<any>(null);

        const calcImagePosition = () => {
            if (elementRef.current !== null && parentElementRef.curent !== null) {
                const positionData = elementRef.current.getBoundingClientRect();
                console.log(positionData)
                const width = positionData["width"];
                const left = positionData["left"];
                const right = positionData["right"];
                const top = positionData["top"] + parentElementRef.current.scrollTop;// + window.scrollY;
                return [left + 30, top];
            } else {
                return [30, 30];
            }
        }

        return (
            <div
                ref={elementRef}
                style={{
                    display: "inline-flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: "100%",
                    flexGrow: 1,
                    overflow: "hidden",
                }}>
                <img src={thumbnail} style={{
                    maxWidth: 400,
                    maxHeight: 400,
                    borderRadius: 5,
                    position: "fixed",
                    left: calcImagePosition()[0],
                    top: calcImagePosition()[1],
                    border: thumbnail === "../../../mainProcess/resources/webpages/blank.svg" ? "none" : "solid 1px rgba(150, 150, 150, 1)",
                }}
                >
                </img>
            </div>
        )
    }


    updateThumbnail = (data: {
        widgetKey: string,
        tdlFileName: string,
        image: string,
    }) => {
        this.setThumbnail(data["image"]);
    }

    fetchFolderContent = () => {
        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
        const displayWindowId = displayWindowClient.getWindowId();
        const ipcManager = displayWindowClient.getIpcManager();
        ipcManager.sendFromRendererProcess("fetch-folder-content", {
            displayWindowId: displayWindowId,
            widgetKey: this.getWidgetKey(),
            folderPath: this.getFolderPath(),
        })
    }

    fetchThumbnail = (fileName: string) => {
        if (fileName.endsWith(".tdl")) {
            const tdlFileName = path.join(this.getFolderPath(), fileName);
            const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
            const displayWindowId = displayWindowClient.getWindowId();
            const ipcManager = displayWindowClient.getIpcManager();
            ipcManager.sendFromRendererProcess("fetch-thumbnail", {
                displayWindowId: displayWindowId,
                widgetKey: this.getWidgetKey(),
                tdlFileName: tdlFileName,
            })
        }
    }

    updateFolderContent = (folderContent: type_folder_content) => {
        this.setFolderContent(folderContent);
        this.forceUpdate({});
    }

    handleFetchFolderContentFailed = () => {
        // set the folder path back
        this.setFolderPath(this.oldFolderPath, false);
    }

    getFileType = (fileName: string, rawType: "file" | "folder") => {
        if (rawType === "folder") {
            return "Folder";
        } else {
            if (fileName.endsWith(".tdl")) {
                return "TDM Display File";
            } else if (fileName.endsWith(".db")) {
                return "EPICS Database File";
            } else if (fileName.endsWith(".template")) {
                return "EPICS Template File";
            } else if (fileName.endsWith(".edl")) {
                return "EDM Display File";
            } else if (fileName.endsWith("stp")) {
                return "StripTool File";
            } else {
                return "File";
            }
        }
    }

    getFileSize = (rawSize: number) => {
        if (rawSize < 1024) {
            return `${rawSize} Bytes`;
        } else if (rawSize >= 1024 && rawSize < 1024 * 1024) {
            return `${(rawSize / 1024).toFixed(1)} kB`;
        } else if (rawSize >= 1024 * 1024 && rawSize < 1024 * 1024 * 1024) {
            return `${(rawSize / 1024 / 1024).toFixed(1)} MB`;
        } else if (rawSize >= 1024 * 1024 * 1024) {
            return `${(rawSize / 1024 / 1024 / 1024).toFixed(1)} GB`;
        } else {
            return "?"
        }
    }

    /**
     * Nomrally we can display the channel value as `${this._getChannelValue()}`
     * However, for string type data, this produces a lot of "," if the data is an array
     */
    getChannelValueStrRepresentation = () => {
        const rawChannelValue = this._getChannelValue(false);

        if (Array.isArray(rawChannelValue)) {
            return '[' + rawChannelValue.join(",") + ']';
        }
        return rawChannelValue;
    }


    _Element = React.memo(this._ElementRaw, () => this._useMemoedElement());
    _ElementArea = React.memo(this._ElementAreaRaw, () => this._useMemoedElement());
    _ElementBody = React.memo(this._ElementBodyRaw, () => this._useMemoedElement());

    // defined in super class
    // getElement()
    // getSidebarElement()
    // _ElementResizerRaw
    // _ElementResizer

    // -------------------- helper functions ----------------

    // defined in super class
    // _showSidebar()
    // _showResizers()
    // _useMemoedElement()
    // hasChannel()
    // isInGroup()
    // isSelected()
    // _getElementAreaRawOutlineStyle()

    _parseChannelValueElement = (channelValueElement: number | string | boolean | undefined): string => {


        if (typeof channelValueElement === "number") {
            const scale = Math.max(this.getAllText()["scale"], 0);
            const format = this.getAllText()["format"];
            if (format === "decimal") {
                return channelValueElement.toFixed(scale);
            } else if (format === "default") {
                const channelName = this.getChannelNames()[0];
                const defaultScale = g_widgets1.getChannelPrecision(channelName);
                if (defaultScale !== undefined) {
                    return channelValueElement.toFixed(defaultScale);
                } else {
                    return channelValueElement.toFixed(scale);
                }
            } else if (format === "exponential") {
                return channelValueElement.toExponential(scale);
            } else if (format === "hexadecimal") {
                return `0x${channelValueElement.toString(16)}`;
            } else if (format === "string") {
                // use a number array to represent a string
                // MacOS ignores the non-displayable characters, but Linux shows rectangle for these characters
                if (channelValueElement >= 32 && channelValueElement <= 126) {
                    return `${String.fromCharCode(channelValueElement)}`;
                } else {
                    return "";
                }
            } else {
                return `${channelValueElement}`;
            }
        } else {
            if (g_widgets1.isEditing() === true) {
                return `${channelValueElement}`;
            } else {
                return `${channelValueElement}`;
            }

        }
    };

    // only for TextUpdate and TextEntry
    // they are suitable to display array data in various formats,
    // other types of widgets, such as Meter, Spinner, Tanks, ProgressBar, Thermometer, ScaledSlider are not for array data
    _getChannelValue = (raw: boolean = false) => {

        const channelValue = this.getChannelValueForMonitorWidget(raw);

        if (typeof channelValue === "number" || typeof channelValue === "string") {
            return this._parseChannelValueElement(channelValue);
        } else if (Array.isArray(channelValue)) {
            const result: any[] = [];
            for (let element of channelValue) {
                result.push(this._parseChannelValueElement(element));
            }
            if (this.getAllText()["format"] === "string" && typeof channelValue[0] === "number") {
                return result.join("");
            } else {
                return result;
            }
        } else {
            return channelValue;
        }
    };

    _getChannelSeverity = () => {
        return this._getFirstChannelSeverity();
    };

    _getChannelUnit = () => {
        const unit = this._getFirstChannelUnit();
        if (unit === undefined) {
            return "";
        } else {
            return unit;
        }
    };

    getFolderPath = () => {
        return this._folderPath;
    }

    getFolderContent = () => {
        return this._folderContent;
    }

    setFolderPath = (newPath: string, updateInput: boolean = true) => {
        this.oldFolderPath = this.getFolderPath();
        this._folderPath = newPath;
        if (updateInput === true) {
            this.setFolderPathInput(newPath);
        }
    }

    setFolderContent = (newContent: type_folder_content) => {
        this._folderContent = newContent;
    }

    // ----------------------- styles -----------------------

    // defined in super class
    // _resizerStyle
    // _resizerStyles
    // StyledToolTipText
    // StyledToolTip

    // -------------------------- tdl -------------------------------

    // properties when we create a new TextUpdate
    // the level 1 properties all have corresponding public or private variable in the widget

    static _defaultTdl: type_FileBrowser_tdl = {
        type: "FileBrowser",
        widgetKey: "", // "key" is a reserved keyword
        key: "",
        style: {
            // basics
            position: "absolute",
            display: "inline-flex",
            // dimensions
            left: 100,
            top: 100,
            width: 100,
            height: 100,
            backgroundColor: "rgba(240, 240, 240, 1)",
            // angle
            transform: "rotate(0deg)",
            // border, it is different from the "alarmBorder" below,
            borderStyle: "solid",
            borderWidth: 0,
            borderColor: "rgba(0, 0, 0, 1)",
            // font
            color: "rgba(0,0,0,1)",
            fontFamily: GlobalVariables.defaultFontFamily,
            fontSize: GlobalVariables.defaultFontSize,
            fontStyle: GlobalVariables.defaultFontStyle,
            fontWeight: GlobalVariables.defaultFontWeight,
            // shows when the widget is selected
            outlineStyle: "none",
            outlineWidth: 1,
            outlineColor: "black",
        },
        text: {
            // text
            horizontalAlign: "flex-start",
            verticalAlign: "flex-start",
            wrapWord: false,
            showUnit: true,
            invisibleInOperation: false,
            // default, decimal, exponential, hexadecimal
            format: "default",
            // scale, >= 0
            scale: 0,
            // actually "alarm outline"
            alarmBorder: true,
            alarmText: false,
            alarmBackground: false,
            alarmLevel: "MINOR",
            path: "",
            permission: "WRITE", // READ, WRITE
        },
        channelNames: [],
        groupNames: [],
        rules: [],
    };

    // not getDefaultTdl(), always generate a new key
    static generateDefaultTdl = (type: string): Record<string, any> => {
        const result = super.generateDefaultTdl(type);
        result.style = JSON.parse(JSON.stringify(this._defaultTdl.style));
        result.text = JSON.parse(JSON.stringify(this._defaultTdl.text));
        result.channelNames = JSON.parse(JSON.stringify(this._defaultTdl.channelNames));
        result.groupNames = JSON.parse(JSON.stringify(this._defaultTdl.groupNames));
        return result;
    };

    // static method for generating a widget tdl with external PV name
    static generateWidgetTdl = (utilityOptions: Record<string, any>): type_FileBrowser_tdl => {
        const result = this.generateDefaultTdl("FileBrowser");
        // result.channelNames = utilityOptions.channelNames as string[];
        result["style"]["left"] = 0;
        result["style"]["top"] = 0;
        result["text"]["path"] = utilityOptions['path'];

        // result.recordTypesFieldNames = utilityOptions.recordTypesFieldNames as Record<string, string[]>;
        // result.recordTypesMenus = utilityOptions.recordTypesMenus as Record<string, string[]>;
        // result.recordTypes = utilityOptions.recordTypes as Record<string, any>;
        // result.menus = utilityOptions.menus as Record<string, any>;
        return result as type_FileBrowser_tdl;
    };
    // defined in super class
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
    // getUpdateFromWidget()
    // getResizerStyle()
    // getResizerStyles()
    // getRules()

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

    // --------------------- sidebar --------------------------
    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new FileBrowserSidebar(this);
        }
    }
}
