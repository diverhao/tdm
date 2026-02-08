import * as React from "react";
import { MouseEvent } from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { GroupSelection2 } from "../../helperWidgets/GroupSelection/GroupSelection2";
import { FileBrowserSidebar } from "./FileBrowserSidebar";
import * as GlobalMethods from "../../../common/GlobalMethods";
import { BaseWidget } from "../BaseWidget/BaseWidget";

import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
// import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary"
import { Log } from "../../../common/Log";
import path from "path";
import { ElementRectangleButton } from "../Talhk/client/RectangleButton";
import { type_folder_content, type_single_file_folder } from "../../../common/IpcEventArgType";
import { GlobalVariables } from "../../../common/GlobalVariables";


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


enum type_sorting_method {
    time_ascending,
    time_decending,
    name_ascending,
    name_decending,
    size_ascending,
    size_decending,
}

export class FileBrowser extends BaseWidget {

    _folderContent: type_folder_content = [];
    readonly _modal: boolean;

    forceUpdate = (input: any) => { };
    forceUpdateButtons = (input: any) => { };
    onlyShowTdmFiles: boolean = true;
    setThumbnail: (input: any) => void = (input) => { };
    setFolderPathInput: (input: any) => void = (input) => { };
    oldFolderPath: string = "";
    filterText: string = "";

    private _sortingMethod: type_sorting_method = type_sorting_method.name_ascending;

    _selectedItem: type_single_file_folder = {
        name: "", // only the name
        type: "file",
        size: -1,
        timeModified: -1,
    };

    getSelectedItem = () => { return this._selectedItem };

    setSelectedItem = (newItem: type_single_file_folder) => { this._selectedItem = newItem };

    getSortingMethod = () => {
        return this._sortingMethod;
    }

    setSortingMethod = (newMethod: type_sorting_method) => {
        this._sortingMethod = newMethod;
    }

    constructor(widgetTdl: type_FileBrowser_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this.setReadWriteType("read");


        this._modal = widgetTdl["text"]["modal"];

        window.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
            }
        }, { passive: false });

        window.addEventListener("mousedown", (event) => {

            const renameButton = document.getElementById("element-rename-item");
            if (event.target === renameButton) {
                return;
            }
            if (this.getItemNameBeingEdited() === true) {
                this.setItemNameBeingEdited(false);
                this.forceUpdate({});
            }
        })
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
            <ErrorBoundary style={this.getStyle()} widgetKey={this.getWidgetKey()}>
                <>
                    <this._ElementBody></this._ElementBody>
                    {this.showSidebar() ? this._sidebar?.getElement() : null}
                </>
            </ErrorBoundary>
        );
    };



    getElementFallbackFunction = () => {
        return this._ElementFallback;
    }

    // Text area and resizers
    _ElementBodyRaw = (): React.JSX.Element => {
        return (
            // always update the div below no matter the TextUpdateBody is .memo or not
            // TextUpdateResizer does not update if it is .memo
            <div style={{ ...this.getElementBodyRawStyle(), overflow: "hidden", }}>
                <this._ElementArea></this._ElementArea>
                {this.showResizers() ? <this._ElementResizer /> : null}
            </div>
        );
    };

    // only shows the text, all other style properties are held by upper level _ElementBodyRaw
    _ElementAreaRaw = ({ }: any): React.JSX.Element => {
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
                const bookmarks = this.getBookmarks();
                if (bookmarks.length === 0) {
                    // if bookmarks is empty, use the path of first default tdl file
                    // if there is no default tdl file, use the HOME folder
                    this.fetchFolderContent();
                } else {
                    // bookmarks is not empty
                    this.updateFolderContent(bookmarks);
                    this.getText()["path"] = "bookmarks-ABCD";
                    this.setFolderPath("bookmarks-ABCD"); // magic word
                }
            }
        }, [])


        return (
            <div
                ref={elementRef}
                style={{
                    backgroundColor: "rgba(255, 255, 255, 1)",
                    // overflow: "scroll",
                    width: "100%",
                    height: "100%",
                    paddingTop: 30,
                    paddingLeft: 30,
                    paddingBottom: 30,
                    paddingRight: 30,
                    display: "inline-flex",
                    justifyContent: "space-between",
                    flexDirection: "column",
                    boxSizing: "border-box",
                    overflow: "hidden",
                }}
            >
                <div style={{
                    display: "inline-flex",
                    flexDirection: "column",
                    width: "100%",
                    flexShrink: 1,
                    overflow: "hidden",
                    maxHeight: "100%",
                    // overflowY: "scroll",
                }}>
                    <this._ElementHeader></this._ElementHeader>
                    <div style={{
                        display: "inline-flex",
                        flexDirection: "row",
                        width: "100%",
                        flexShrink: 1,
                        // overflow: "auto",
                        maxHeight: "100%",
                        overflowY: "auto",
                        overflowX: "hidden",
                    }}>
                        <this._ElementTable></this._ElementTable>
                        <this._ElementThumbnail parentElementRef={elementRef}></this._ElementThumbnail>
                    </div>
                </div>
                <this._ElementWindowOperations></this._ElementWindowOperations>
            </div>
        )
    }

    _ElementTable = () => {

        const [, forceUpdate] = React.useState({});

        this.sortFolderContent();

        return (
            <div style={{
                overflow: "auto",
                // maxHeight: "100%",
                width: "65%",
                backgroundColor: "rgba(0, 200, 200, 0)",
            }}>
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
                            if (name === this.getSelectedItem()["name"]) {
                                selectedItemIndex = ii;
                                break;
                            }
                        }

                        if (event.key === "Enter" && this.getItemNameBeingEdited() === false) {
                            // same as double click on table row
                            const element = this.getFolderContent()[selectedItemIndex];
                            this.handleDoubleClickOnItem(element);
                            return;
                        } else if (event.key === "ArrowDown") {
                            for (let ii = selectedItemIndex + 1; ii < this.getFolderContent().length; ii++) {
                                const nextElement = this.getFolderContent()[ii];
                                const name = nextElement["name"];
                                // the element is a tdl file or a folder
                                if (this.onlyShowTdmFiles === true) {
                                    if (name.endsWith(".tdl") || name.endsWith(".bob") || nextElement["type"] === "folder") {
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
                                this.setThumbnail("../../../webpack/resources/webpages/blank.svg");
                                return;
                            } else {
                                for (let ii = selectedItemIndex - 1; ii >= 0; ii--) {
                                    const prevElement = this.getFolderContent()[ii];
                                    const name = prevElement["name"];
                                    // the element is a tdl file or a folder
                                    if (this.onlyShowTdmFiles === true) {
                                        if (name.endsWith(".tdl") || name.endsWith(".bob") || prevElement["type"] === "folder") {
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
                            this.setSelectedItem(element);
                            forceUpdate({});
                            this.forceUpdateButtons({});
                            if (element["name"].endsWith(".tdl") || element["name"].endsWith(".bob")) {
                                // wait for the new thumbnail
                                this.setThumbnail("../../../webpack/resources/webpages/blank.svg");
                                this.fetchThumbnail(element["name"]);
                            } else if (element["type"] === "folder") {
                                this.setThumbnail("../../../webpack/resources/webpages/blank.svg");
                                // this.setThumbnail("../../resources/webpages/open-file-symbol.svg");
                            } else {
                                this.setThumbnail("../../../webpack/resources/webpages/blank.svg");
                                // this.setThumbnail("../../resources/webpages/copy-symbol.svg");
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
                                display: "inline-flex",
                                justifyContent: 'center',
                                alignItems: "center",
                            }}
                                onMouseDown={(event: any) => {
                                    event.preventDefault();
                                    if (this.getSortingMethod() === type_sorting_method.name_ascending) {
                                        this.setSortingMethod(type_sorting_method.name_decending);
                                    } else {
                                        this.setSortingMethod(type_sorting_method.name_ascending);
                                    }
                                    this.forceUpdate({});
                                }}
                            >
                                Name &nbsp;
                                {this.getSortingMethod() === type_sorting_method.name_ascending ?
                                    <img src={"../../../webpack/resources/webpages/arrowUp-thin.svg"} style={{ width: GlobalVariables.defaultFontSize * 0.6 }}></img>
                                    :
                                    this.getSortingMethod() === type_sorting_method.name_decending ?
                                        <img src={"../../../webpack/resources/webpages/arrowDown-thin.svg"} style={{ width: GlobalVariables.defaultFontSize * 0.6 }}></img>
                                        :
                                        null
                                }
                            </th>
                            {this.getFolderPath() === "bookmarks-ABCD" ? null :
                                <>
                                    <th style={{
                                        paddingTop: 3,
                                        paddingBottom: 3,
                                        paddingLeft: 4,
                                        paddingRight: 4,
                                    }}
                                        onMouseDown={(event: any) => {
                                            event.preventDefault();
                                            if (this.getSortingMethod() === type_sorting_method.time_ascending) {
                                                this.setSortingMethod(type_sorting_method.time_decending);
                                            } else {
                                                this.setSortingMethod(type_sorting_method.time_ascending);
                                            }
                                            this.forceUpdate({});
                                        }}

                                    >
                                        Date Modified &nbsp;
                                        {this.getSortingMethod() === type_sorting_method.time_ascending ?
                                            <img src={"../../../webpack/resources/webpages/arrowUp-thin.svg"} style={{ width: GlobalVariables.defaultFontSize * 0.6 }}></img>
                                            :
                                            this.getSortingMethod() === type_sorting_method.time_decending ?
                                                <img src={"../../../webpack/resources/webpages/arrowDown-thin.svg"} style={{ width: GlobalVariables.defaultFontSize * 0.6 }}></img>
                                                :
                                                null
                                        }
                                    </th>
                                    <th style={{
                                        paddingTop: 3,
                                        paddingBottom: 3,
                                        paddingLeft: 4,
                                        paddingRight: 4,
                                    }}
                                        onMouseDown={(event: any) => {
                                            event.preventDefault();
                                            if (this.getSortingMethod() === type_sorting_method.size_ascending) {
                                                this.setSortingMethod(type_sorting_method.size_decending);
                                            } else {
                                                this.setSortingMethod(type_sorting_method.size_ascending);
                                            }
                                            this.forceUpdate({});
                                        }}
                                    >
                                        Size &nbsp;
                                        {this.getSortingMethod() === type_sorting_method.size_ascending ?
                                            <img src={"../../../webpack/resources/webpages/arrowUp-thin.svg"} style={{ width: GlobalVariables.defaultFontSize * 0.6 }}></img>
                                            :
                                            this.getSortingMethod() === type_sorting_method.size_decending ?
                                                <img src={"../../../webpack/resources/webpages/arrowDown-thin.svg"} style={{ width: GlobalVariables.defaultFontSize * 0.6 }}></img>
                                                :
                                                null
                                        }
                                    </th>
                                    <th style={{
                                        paddingTop: 3,
                                        paddingBottom: 3,
                                        paddingLeft: 4,
                                        paddingRight: 4,
                                    }}>
                                        Kind
                                    </th>
                                </>
                            }
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
                                const isSelected = this.getSelectedItem()["name"] === element["name"] ? true : false;
                                return (
                                    <this._ElementTableRow
                                        element={element}
                                        key={element["name"]}
                                        isSelected={isSelected}
                                        forceUpdateTable={forceUpdate}
                                        index={index}
                                    >
                                    </this._ElementTableRow>
                                )
                            }
                        })}
                    </tbody>
                </table>
            </div>
        )
    }

    setFilterText = (input: any) => { }

    _ElementFilter = () => {
        const [filterText, setFilterText] = React.useState("");

        this.setFilterText = setFilterText;

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
                flexShrink: 0,
            }}>
                <div style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    marginBottom: 10,
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
                    marginBottom: 5,
                    width: "100%",
                }}>
                    <this._ElementFilter></this._ElementFilter>
                    <this._ElementBookmarks></this._ElementBookmarks>
                    {/* <this._ElementRefreshFolder></this._ElementRefreshFolder> */}
                    {/* <this._ElementGoToParentFolder></this._ElementGoToParentFolder> */}
                    {/* <this._ElementRenameItem></this._ElementRenameItem> */}
                    {/* <this._ElementCreateTdlFile></this._ElementCreateTdlFile> */}
                    {/* <this._ElementCreateFolder></this._ElementCreateFolder> */}
                    <this._ElementOnlyShowTdmFiles></this._ElementOnlyShowTdmFiles>
                </div>
                <div style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    marginBottom: 5,
                    width: "100%",
                }}>
                    {/* <this._ElementFilter></this._ElementFilter> */}
                    {/* <this._ElementBookmarks></this._ElementBookmarks> */}
                    <this._ElementRefreshFolder></this._ElementRefreshFolder>
                    <this._ElementGoToParentFolder></this._ElementGoToParentFolder>
                    <this._ElementRenameItem></this._ElementRenameItem>
                    <this._ElementCreateTdlFile></this._ElementCreateTdlFile>
                    <this._ElementCreateFolder></this._ElementCreateFolder>
                    {/* <this._ElementOnlyShowTdmFiles></this._ElementOnlyShowTdmFiles> */}
                </div>
            </div>
        )
    }

    _ElementWindowOperations = () => {
        const [, forceUpdate] = React.useState({});
        this.forceUpdateButtons = forceUpdate;

        if (this.getModal() === true) {
            return (
                <div style={{
                    bottom: 10,
                    maxHeight: "100%",
                    flexShrink: 0,
                    boxSizing: "border-box",
                    overflow: "auto",
                    // marginBottom: 50,
                }}>
                    {/* close the modal window */}
                    <ElementRectangleButton
                        handleMouseDown={(event: any) => {
                            const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
                            const ipcManager = displayWindowClient.getIpcManager();
                            const displayWindowId = displayWindowClient.getWindowId();
                            ipcManager.sendFromRendererProcess("close-window", {
                                displayWindowId: displayWindowId
                            });
                        }}
                    >
                        Cancel
                    </ElementRectangleButton>

                    &nbsp;&nbsp;

                    {/* open button */}
                    <ElementRectangleButton
                        defaultBackgroundColor={this.getSelectedItem()["name"] === "" ? "rgba(180, 180, 180, 1)" : "rgba(65, 115, 183, 1)"}
                        highlightBackgroundColor={this.getSelectedItem()["name"] === "" ? "rgba(180, 180, 180, 1)" : "rgba(65, 115, 183, 0.8)"}
                        handleMouseDown={(event: any) => {
                            const selectedItem = this.getSelectedItem();
                            if (selectedItem["name"] !== "") { // one item is selected
                                // open file or folder
                                this.handleDoubleClickOnItem(selectedItem);
                            } else {
                                // do nothing
                            }
                        }}
                    >
                        Open
                    </ElementRectangleButton>
                </div>
            )
        } else {
            return null;
        }
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
                    this.setThumbnail("../../../webpack/resources/webpages/blank.svg");
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
                    value={folderPath.replace("-ABCD", "")}
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

    _ElementHeaderTemplate = ({ onMouseDown, text, id }: { onMouseDown: (event: any) => void, text: string, id: string }) => {
        const elementRef = React.useRef<any>(null);
        return (
            <div
                ref={elementRef}
                onMouseDown={onMouseDown}
                style={{
                    fontSize: GlobalVariables.defaultFontSize * 1,
                    cursor: this.getFolderPath() === "bookmarks-ABCD" ? "default" : "pointer",
                    marginRight: 10,
                    opacity: this.getFolderPath() === "bookmarks-ABCD" ? 0 : 1,
                    backgroundColor: "rgba(200, 200, 200, 0)",
                    padding: 5,
                    paddingLeft: 8,
                    paddingRight: 8,
                    borderRadius: 4,
                }}
                id={id}
                onMouseEnter={() => {
                    if (elementRef.current !== null && this.getFolderPath() !== "bookmarks-ABCD") {
                        elementRef.current.style["opacity"] = 0.8;
                        elementRef.current.style.backgroundColor = "rgba(200, 200, 200, 1)";
                    }
                }}
                onMouseLeave={() => {
                    if (elementRef.current !== null && this.getFolderPath() !== "bookmarks-ABCD") {
                        elementRef.current.style["opacity"] = 1;
                        elementRef.current.style.backgroundColor = "rgba(200, 200, 200, 0)";
                    }
                }}
            >
                {text}
            </div>
        )
    }


    _ElementGoToParentFolder = () => {
        return (
            <this._ElementHeaderTemplate
                onMouseDown={
                    () => {
                        if (this.getFolderPath() === "bookmarks-ABCD") {
                            return;
                        } else {
                            // in web mode, if the path 
                            const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
                            const ipcManager = displayWindowClient.getIpcManager();
                            const displayWindowId = displayWindowClient.getWindowId();
                            const newFolderPath = path.dirname(this.getFolderPath());
                            this.setFolderPath(newFolderPath);
                            this.setSelectedItem({
                                "name": "",
                                "size": -1,
                                "timeModified": -1,
                                "type": "file",
                            })
                            this.forceUpdateButtons({});
                            this.fetchFolderContent();
                            this.setThumbnail("../../../webpack/resources/webpages/blank.svg");
                        }
                    }
                }
                text={"Up"}
                id={"Up"}
            ></this._ElementHeaderTemplate>
        )
    }

    _ElementRenameItem = () => {
        return (
            <this._ElementHeaderTemplate
                onMouseDown={
                    () => {
                        if (this.getFolderPath() === "bookmarks-ABCD") {
                            return;
                        } else {
                            // changes the item name to an input box
                            this.changeSelectedItemName();
                        }
                    }
                }
                text={"Rename"}
                id={"element-rename-item"}
            ></this._ElementHeaderTemplate>
        )
    }

    _ElementCreateTdlFile = () => {
        return (
            <this._ElementHeaderTemplate
                onMouseDown={
                    () => {
                        if (this.getFolderPath() === "bookmarks-ABCD") {
                            return;
                        } else {
                            this.createTdlFile();
                        }
                    }}
                text={"Create TDL File"}
                id={"Create TDL File"}
            ></this._ElementHeaderTemplate>
        )
    }

    _ElementCreateFolder = () => {
        return (
            <this._ElementHeaderTemplate
                onMouseDown={
                    () => {
                        if (this.getFolderPath() === "bookmarks-ABCD") {
                            return;
                        } else {
                            this.createFolder();
                        }
                    }
                }
                text={"Create Folder"}
                id={"Create Folder"}
            ></this._ElementHeaderTemplate>
        )
    }


    _ElementRefreshFolder = () => {
        return (
            <this._ElementHeaderTemplate
                onMouseDown={
                    () => {
                        if (this.getFolderPath() === "bookmarks-ABCD") {
                            // do nothing
                        } else {
                            const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
                            this.setFolderPath(this.getFolderPath());
                            this.fetchFolderContent();
                            this.setThumbnail("../../../webpack/resources/webpages/blank.svg");
                        }
                    }
                }
                text={"Refresh"}
                id={"Refresh"}
            ></this._ElementHeaderTemplate>
        )
    }

    _ElementBookmarks = () => {
        return (
            <this._ElementHeaderTemplate
                onMouseDown={
                    () => {
                        const bookmarks = this.getBookmarks();
                        this.updateFolderContent(bookmarks);
                        this.getText()["path"] = "bookmarks-ABCD";
                        this.setFolderPath("bookmarks-ABCD"); // magic word
                        this.setThumbnail("../../../webpack/resources/webpages/blank.svg");
                    }
                }
                text={"Bookmarks"}
                id={"Bookmarks"}
            ></this._ElementHeaderTemplate>
        )
    }



    _ElementTableRow = ({ element, index, isSelected, forceUpdateTable }: { element: type_single_file_folder, index: number, isSelected: boolean, forceUpdateTable: any }) => {
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
                    if (element["name"] !== this.getSelectedItem()["name"]) {
                        this.setSelectedItem(element);
                        this.forceUpdateButtons({});
                        forceUpdateTable({});
                        if (element["name"].endsWith(".tdl") || element["name"].endsWith(".bob")) {
                            // wait for the new thumbnail
                            this.setThumbnail("../../../webpack/resources/webpages/blank.svg");
                            this.fetchThumbnail(element["name"]);
                        } else if (element["type"] === "folder") {
                            this.setThumbnail("../../../webpack/resources/webpages/blank.svg");
                            // this.setThumbnail("../../resources/webpages/open-file-symbol.svg");
                        } else {
                            this.setThumbnail("../../../webpack/resources/webpages/blank.svg");
                            // this.setThumbnail("../../resources/webpages/copy-symbol.svg");
                        }
                    }
                }}

                onDoubleClick={() => {
                    this.handleDoubleClickOnItem(element);
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
                            <img src="../../../webpack/resources/webpages/folder-symbol.svg"
                                style={{ width: GlobalVariables.defaultFontSize, height: GlobalVariables.defaultFontSize, opacity: 1, }}
                            >
                            </img>
                            &nbsp;
                            {/* {element["name"]} */}
                            <this._ElementItemName name={element["name"]} ></this._ElementItemName>
                        </div>
                        :
                        element["name"].endsWith(".tdl") || element["name"].endsWith(".bob") ?
                            <div style={{
                                display: "inline-flex",
                                justifyContent: "flex-start",
                                alignItems: "center",
                                padding: 0,
                                textOverflow: "ellipsis",
                                maxWidth: "100%",
                                overflow: "hidden",
                            }}>
                                <img src="../../../webpack/resources/webpages/tdm-logo-large-fill.png"
                                    style={{ width: GlobalVariables.defaultFontSize, height: GlobalVariables.defaultFontSize }}
                                >
                                </img>
                                &nbsp;
                                <this._ElementItemName name={element["name"]} ></this._ElementItemName>
                                {/* {element["name"]} */}
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
                                <img src="../../../webpack/resources/webpages/document-symbol.svg"
                                    style={{ width: GlobalVariables.defaultFontSize, height: GlobalVariables.defaultFontSize }}
                                >
                                </img>
                                &nbsp;
                                {/* {element["name"]} */}
                                <this._ElementItemName name={element["name"]}></this._ElementItemName>
                            </div>
                    }
                    {/* {element["name"]} */}
                </td>
                {this.getFolderPath() === "bookmarks-ABCD" ? null :
                    <>
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
                    </>
                }
            </tr>
        )
    }

    _ElementItemName = ({ name }: { name: string }) => {
        const editing = this.getItemNameBeingEdited() === true && this.getSelectedItem()["name"] === name;
        const [name1, setName1] = React.useState(name);
        if (name === "Untitled-1.tdl") {
            console.log(editing, name)
        }
        if (editing === true) {
            return (
                <form
                    style={{
                        width: "100%",
                    }}
                    onSubmit={(event: any) => {
                        event.stopPropagation();
                        event.preventDefault();
                        if (name !== name1) {
                            this.setItemNameBeingEdited(false);
                            // tell main process this change
                            const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
                            const ipcManager = displayWindowClient.getIpcManager();
                            ipcManager.sendFromRendererProcess("file-browser-command", {
                                displayWindowId: displayWindowClient.getWindowId(),
                                widgetKey: this.getWidgetKey(),
                                command: "change-item-name",
                                folder: this.getFolderPath(),
                                oldName: name,
                                newName: name1,
                            })
                        }


                    }}
                    onMouseDown={(event: any) => {
                        // do not let the window capture this event, it will set the editing name to false
                        event.stopPropagation();
                    }}
                    onDoubleClick={(event: any) => {
                        event.stopPropagation();
                    }}
                >
                    <input
                        style={{
                            outline: "none",
                            border: "none",
                            padding: 0,
                            fontSize: GlobalVariables.defaultFontSize,
                            fontFamily: GlobalVariables.defaultFontFamily,
                            width: "100%",
                        }}
                        spellCheck={false}
                        value={name1}
                        onChange={(event: any) => {
                            setName1(event.target.value);
                        }}
                    >
                    </input>
                </form>
            )
        }
        return (
            <div style={{
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
            }}>
                {name}
            </div>
        )
    }

    private _itemNameBeingEdited: boolean = false;

    getItemNameBeingEdited = () => {
        return this._itemNameBeingEdited;
    }

    setItemNameBeingEdited = (state: boolean) => {
        this._itemNameBeingEdited = state;
    }

    changeSelectedItemName = () => {
        const selectedItem = this.getSelectedItem();
        if (selectedItem !== undefined && selectedItem.name !== "") {
            // modify text in renderer process
            this.setItemNameBeingEdited(true);
            this.forceUpdate({});
            // send command to main process after confirming the change, i.e. hit Enter key
            // in main process: try to change name, if succeeded, send OK message, nothing need to be done on client; 
            //                                      if failed, send NOT_OK message and re-read folder, client change things back;
        }
    }

    createTdlFile = () => {
        // go over the files/folders, find a non-existing Untitled file name
        let fileName = "Untitled-1.tdl";
        const existingIndices: number[] = [];
        for (const item of this.getFolderContent()) {
            if (item.name.startsWith("Untitled-") && item.name.endsWith(".tdl")) {
                const indexStr = item.name.replace("Untitled-", "").replace(".tdl", "");
                const index = parseInt(indexStr);
                if (typeof index === "number") {
                    existingIndices.push(index);
                }
            }
        }

        for (let index = 1; index < existingIndices.length + 2; index++) {
            if (!existingIndices.includes(index)) {
                fileName = `Untitled-${index}.tdl`;
                break;
            }
        }
        // tell main process to create this file
        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
        const ipcManager = displayWindowClient.getIpcManager();
        ipcManager.sendFromRendererProcess("file-browser-command", {
            displayWindowId: displayWindowClient.getWindowId(),
            widgetKey: this.getWidgetKey(),
            command: "create-tdl-file",
            fullFileName: path.join(this.getFolderPath(), fileName),
        })
        // after the file is successfully created, main process tell renderer process
        // renderer process 
    }


    createFolder = () => {
        // go over the files/folders, find a non-existing Untitled file name
        let folderName = "Untitled-Folder-1";
        const existingIndices: number[] = [];
        for (const item of this.getFolderContent()) {
            if (item.name.startsWith("Untitled-Folder-")) {
                const indexStr = item.name.replace("Untitled-Folder-", "");
                const index = parseInt(indexStr);
                if (typeof index === "number") {
                    existingIndices.push(index);
                }
            }
        }

        for (let index = 1; index < existingIndices.length + 2; index++) {
            if (!existingIndices.includes(index)) {
                folderName = `Untitled-Folder-${index}`;
                break;
            }
        }
        // tell main process to create this file
        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
        const ipcManager = displayWindowClient.getIpcManager();
        ipcManager.sendFromRendererProcess("file-browser-command", {
            displayWindowId: displayWindowClient.getWindowId(),
            widgetKey: this.getWidgetKey(),
            command: "create-folder",
            fullFolderName: path.join(this.getFolderPath(), folderName),
        })
        // after the file is successfully created, main process tell renderer process
        // renderer process 
    }


    handleDoubleClickOnItem = (element: type_single_file_folder) => {
        if (element["type"] === "folder") {
            let newFolderPath = path.join(this.getFolderPath(), element["name"]);
            if (path.isAbsolute(element['name'])) {
                newFolderPath = element["name"];
            }
            this.setFolderPath(newFolderPath);
            this.setSelectedItem({ name: "", timeModified: -1, size: -1, type: "file" });
            this.setThumbnail("../../../webpack/resources/webpages/blank.svg")
            // clear filter
            this.setFilterText("");
            this.filterText = "";
            this.fetchFolderContent();
        } else if (element["type"] = "file") {
            let fullTdlFileName = path.join(this.getFolderPath(), element["name"]);
            if (path.isAbsolute(element['name'])) {
                fullTdlFileName = element["name"];
            }
            if (fullTdlFileName.endsWith(".tdl") || fullTdlFileName.endsWith(".bob") || fullTdlFileName.endsWith(".edl") || fullTdlFileName.endsWith(".db") || fullTdlFileName.endsWith(".template")) {
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
                    options: {
                        tdlFileNames: [fullTdlFileName],
                        mode: mode as "operating" | "editing",
                        editable: editable,
                        macros: [],
                        replaceMacros: false,
                        currentTdlFolder: this.getFolderPath(),
                        // openInSameWindow: false,
                        windowId: displayWindowId,
                    }
                })


                // close the modal window
                if (this.getModal() === true) {
                    const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
                    const ipcManager = displayWindowClient.getIpcManager();
                    const displayWindowId = displayWindowClient.getWindowId();
                    ipcManager.sendFromRendererProcess("close-window", {
                        displayWindowId: displayWindowId
                    });
                }
            }
        }
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
        const [thumbnail, setThumbnail] = React.useState("../../../webpack/resources/webpages/blank.svg");
        this.setThumbnail = setThumbnail;
        const elementRef = React.useRef<any>(null);

        return (
            <div
                ref={elementRef}
                style={{
                    display: "inline-flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: "35%",
                    overflow: "hidden",
                    backgroundColor: "rgba(200, 200, 0, 0)",
                }}>
                <img src={thumbnail} style={{
                    width: "atuo",
                    height: "auto",
                    maxWidth: "95%",
                    maxHeight: "95%",
                    objectFit: "contain",
                    borderRadius: 5,
                    border: thumbnail === "../../../webpack/resources/webpages/blank.svg" ? "none" : "solid 1px rgba(150, 150, 150, 1)",
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

        // if in web mode, only the folders and its sub-folders that are explicited defined
        // in bookmarks can be fetched
        if (displayWindowClient.getMainProcessMode() === "web") {
            let allowToVisit = false;
            const folderPath = this.getFolderPath();
            const bookmarks = this.getBookmarks();
            for (const bookmark of bookmarks) {
                const bookmarkFolder = bookmark["name"];
                if (typeof folderPath === "string" && folderPath.includes(bookmarkFolder)) {
                    allowToVisit = true;
                    break;
                }
            }
            if (allowToVisit === false) {
                displayWindowClient.getIpcManager().handleDialogShowMessageBox(undefined,
                    {
                        info: {
                            messageType: "error", // | "warning" | "info";
                            humanReadableMessages: [`You are not allowed to visit ${folderPath}.`],
                            rawMessages: [],
                            buttons: [],
                        }
                    }
                );
                // change folderPath back
                this.setFolderPath(this.oldFolderPath)
                return;
            }
        }

        ipcManager.sendFromRendererProcess("fetch-folder-content", {
            displayWindowId: displayWindowId,
            widgetKey: this.getWidgetKey(),
            folderPath: this.getFolderPath(),
        })

    }

    fetchThumbnail = (fileName: string) => {
        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
        if (displayWindowClient.getMainProcessMode() === "web") {
            return;
        } else {
            if (fileName.endsWith(".tdl") || fileName.endsWith(".bob")) {
                let tdlFileName = path.join(this.getFolderPath(), fileName);
                if (this.getFolderPath() === "bookmarks-ABCD" || path.isAbsolute(fileName)) {
                    tdlFileName = fileName;
                }

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
            } else if (fileName.endsWith(".bob")) {
                return "CSS Phoebus Display File";
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
    // showSidebar()
    // showResizers()
    // _useMemoedElement()
    // hasChannel()
    // isInGroup()
    // isSelected()
    // _getElementAreaRawOutlineStyle()

    // only for TextUpdate and TextEntry
    // they are suitable to display array data in various formats,
    // other types of widgets, such as Meter, Spinner, Tanks, ProgressBar, Thermometer, ScaledSlider are not for array data
    _getChannelValue = (raw: boolean = false) => {
        return 0;
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
        return this.getText()["path"];
    }

    getFolderContent = () => {
        return this._folderContent;
    }

    setFolderPath = (newPath: string, updateInput: boolean = true) => {
        this.oldFolderPath = this.getFolderPath();
        this.getText()["path"] = newPath;
        if (updateInput === true) {
            this.setFolderPathInput(newPath);
        }
    }

    setFolderContent = (newContent: type_folder_content) => {
        this._folderContent = newContent;
    }

    getModal = () => {
        return this._modal;
    }

    getBookmarks = (): type_single_file_folder[] => {
        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
        let bookmarks = displayWindowClient.getProfileEntry("EPICS Custom Environment", "File Browser Bookmarks");

        if (Array.isArray(bookmarks)) {
            const result: type_single_file_folder[] = [];
            for (const [path, writePermission] of bookmarks) {
                let type: "folder" | "file" = "folder";
                if (path.includes(".")) {
                    type = "file";
                }
                result.push(
                    {
                        name: path,
                        type: type,
                        size: 0,
                        timeModified: 0
                    }
                )
            }
            return result;
        } else {
            return [];
        }

    }

    sortFolderContent = () => {
        const folderContent = this.getFolderContent();

        if (this.getSortingMethod() === type_sorting_method.name_ascending) {
            folderContent.sort((a, b) => { return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1 })
        } else if (this.getSortingMethod() === type_sorting_method.name_decending) {
            folderContent.sort((a, b) => { return a.name.toLowerCase() > b.name.toLowerCase() ? -1 : 1 })
        } else if (this.getSortingMethod() === type_sorting_method.time_ascending) {
            folderContent.sort((a, b) => { return a.timeModified - b.timeModified })
        } else if (this.getSortingMethod() === type_sorting_method.time_decending) {
            folderContent.sort((a, b) => { return -a.timeModified + b.timeModified })
        } else if (this.getSortingMethod() === type_sorting_method.size_ascending) {
            folderContent.sort((a, b) => { return a.size - b.size })
        } else if (this.getSortingMethod() === type_sorting_method.size_decending) {
            folderContent.sort((a, b) => { return b.size - a.size })
        } else {
            // do nothing
        }
    }

    // -------------------------- tdl -------------------------------

    static generateDefaultTdl = (): Record<string, any> => {

        const defaultTdl: type_FileBrowser_tdl = {
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
                modal: false,
            },
            channelNames: [],
            groupNames: [],
            rules: [],
        };
        defaultTdl["widgetKey"] = GlobalMethods.generateWidgetKey(defaultTdl["type"]);
        return JSON.parse(JSON.stringify(defaultTdl));
    };

    generateDefaultTdl: () => any = FileBrowser.generateDefaultTdl;

    // static method for generating a widget tdl with external PV name
    static generateWidgetTdl = (utilityOptions: Record<string, any>): type_FileBrowser_tdl => {
        const result = this.generateDefaultTdl();
        // result.channelNames = utilityOptions.channelNames as string[];
        result["style"]["left"] = 0;
        result["style"]["top"] = 0;
        result["text"]["path"] = utilityOptions['path'];
        result["text"]["modal"] = utilityOptions['modal'];

        return result as type_FileBrowser_tdl;
    };

    // --------------------- sidebar --------------------------
    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new FileBrowserSidebar(this);
        }
    }
    jobsAsOperatingModeBegins() {
        super.jobsAsOperatingModeBegins();
        // this.fetchFolderContent();
    }

}
