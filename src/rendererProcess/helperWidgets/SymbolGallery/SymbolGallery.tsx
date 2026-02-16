import ReactDOM from "react-dom/client";
import * as React from "react";
import { GlobalVariables } from "../../../common/GlobalVariables";
import { ElementRectangleButton, ElementRectangleButtonDefaultBackgroundColor, ElementRectangleButtonHighlightBackgroundColor } from "../SharedElements/RectangleButton";
import { DisplayWindowClient } from "../../windows/DisplayWindow/DisplayWindowClient";


/**
 * Symbol Gallery Modal Dialog
 * 
 * Provides a gallery UI for selecting symbol/image files from organized folders.
 * Features include:
 * - Tab-based page navigation (Chrome-like tabs)
 * - Image grid display with selection indicator (checkmark)
 * - Base64-encoded image support (SVG, PNG, JPG, etc.)
 * - Image name truncation with ellipsis for long names
 * - Select/Cancel buttons for dialog control
 * 
 * Each display window has one SymbolGallery instance that manages gallery state
 * and communicates with the main process via IPC to fetch gallery data.
 */
export class SymbolGallery {

    private readonly _id = "element-symbol-gallery";
    displayWindowClient: DisplayWindowClient;
    _holderWidgetKey: string = ""; // The widget key of the Symbol widget that opened this gallery
    _pageNames: string[] = []; // List of category/folder names (tabs)
    _pageImages: Record<string, string> = {}; // Maps image name to base64 data URI content
    _selectedPage: number = 0; // Currently selected page/tab index
    _selectedImageName: string = ""; // Currently selected image name
    _currentImage: string = "";

    forceUpdate = (input: any) => { }; // Callback to trigger re-render of main frame
    forceUpdateButtons = (input: any) => { }; // Callback to trigger re-render of buttons

    constructor(displayWindowClient: DisplayWindowClient) {
        this.displayWindowClient = displayWindowClient;
        this.startEventListeners();
    }

    /**
     * Start listening to keyboard events for closing the gallery via Escape key
     */
    startEventListeners = () => {
        window.addEventListener("keydown", this.removeElementOnEscKey)
    }

    /**
     * Stop listening to keyboard and mouse events
     */
    removeEventListeners = () => {
        window.removeEventListener("mousedown", this.removeElement)
        window.removeEventListener("keydown", this.removeElementOnEscKey)
    }

    /**
     * Create and display the symbol gallery modal dialog
     * @param selectCallback - Callback invoked when user selects an image: (symbolName, symbolContent) => void
     * @param holderWidgetKey - The widget key of the Symbol widget that owns this gallery
     */
    createElement = (selectCallback: (symbolName: string, symbolContent: string) => void, holderWidgetKey: string, currentImage: string) => {

        this.removeElement();

        this.setHolderWidgetKey(holderWidgetKey);

        this.setCurrentImage(currentImage);

        // Create full-screen transparent backdrop
        const newElement = document.createElement('div');
        newElement.id = this._id;

        newElement.style.position = "absolute";
        newElement.style.left = "0px";
        newElement.style.top = "0px";
        newElement.style.width = "100%";
        newElement.style.height = "100%";
        newElement.style.display = "inline-flex";
        newElement.style.alignItems = "flex-start";
        newElement.style.justifyContent = "center";

        // Render the React component tree into the backdrop
        ReactDOM.createRoot(newElement).render(
            <this._ElementFrame
                selectCallback={selectCallback}
            >
            </this._ElementFrame>
        );
        // Append to document body to display the modal
        document.body.appendChild(newElement);
    }

    /**
     * Main frame component: contains page tabs, image grid, and action buttons
     * Initializes IPC request for gallery data on mount
     */
    _ElementFrame = ({ selectCallback }: any) => {

        const [, forceUpdate] = React.useState({});
        // Store the state setter so class methods can trigger re-renders
        this.forceUpdate = forceUpdate;

        // On mount: request gallery data from main process for initial page (page 0)
        React.useEffect(() => {
            const ipcManager = this.displayWindowClient.getIpcManager();
            const displayWindowId = this.displayWindowClient.getWindowId();
            ipcManager.sendFromRendererProcess("get-symbol-gallery", {
                page: 0,
                displayWindowId: displayWindowId,
                widgetKey: this.getHolderWidgetKey(),
            })
        }, [])

        return (
            <div
                style={{
                    display: "flex",
                    width: "100%",
                    height: "100%",
                    backgroundColor: "rgba(255,255,255,1)",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-start",
                }}
            >
                <this._ElementTitle></this._ElementTitle>
                {/* Tab bar with page/folder names */}
                <this._ElementPageNames></this._ElementPageNames>
                {/* Grid of images for current page */}
                <this._ElementPageImages></this._ElementPageImages>
                {/* Select and Close buttons */}
                <this._ElementButtons selectCallback={selectCallback}></this._ElementButtons>
            </div>
        )
    }

    _ElementTitle = () => {
        return (
            <div
                style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 10,
                    // gap: 40,
                    position: "relative",
                    width: "90%",
                }}
            >
                {/* Title and description on the left */}
                <div
                    style={{
                        display: "inline-flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <div
                        style={{
                            fontSize: GlobalVariables.defaultFontSize * 2,
                            marginBottom: 10,
                            fontWeight: "600",
                        }}
                    >
                        Symbol Gallery
                    </div>
                    <div
                        style={{
                            opacity: 0.5,
                            fontSize: GlobalVariables.defaultFontSize * 0.9,
                            width: "60%",
                            textAlign: "center",
                            lineHeight: "1.4",
                        }}
                    >
                        Select from built-in and custom symbols. Your selection will be embedded into the TDM display for maximum portability.
                        You can add your own symbol galleries in TDM settings.
                        Constraints: 50 kB per symbol file, 300 symbols maximum per folder.
                    </div>
                </div>
                {/* Current image on the right */}
                <this._ElementCurrentImage></this._ElementCurrentImage>
            </div>
        )
    }

    /**
     * Page tab bar: displays folder/category names as clickable tabs
     * Active tab is highlighted; clicking a tab loads that page's images
     */
    _ElementPageNames = () => {
        const pageNames = this.getPageNames();
        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "row",
                    marginTop: 10,
                    maxHeight: GlobalVariables.defaultFontSize * 2,
                    minHeight: GlobalVariables.defaultFontSize * 2,
                    maxWidth: "90%",
                    overflowX: "auto",
                    overflowY: "hidden",
                    scrollbarGutter: "stable",
                }}
            >
                {
                    pageNames.map((pageName: string, index: number) => {
                        return (
                            <this._ElementPageName
                                index={index}
                                pageName={pageName}
                            >
                            </this._ElementPageName>
                        )
                    })
                }
            </div>
        )
    }

    /**
     * Individual page tab: Chrome-like tab style with selection highlight
     * On click: fetches images for selected page via IPC
     */
    _ElementPageName = ({ index, pageName }: any) => {
        const selectedPage = this.getSelectedPage();
        const isSelected = index === selectedPage;

        return (
            <div
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isSelected ? "white" : "rgba(200, 200, 200, 0.5)",
                    color: isSelected ? "#333" : "#666",
                    borderTop: "1px solid #e0e0e0",
                    borderLeft: "1px solid #e0e0e0",
                    borderRight: "1px solid #e0e0e0",
                    borderTopLeftRadius: "8px",
                    borderTopRightRadius: "8px",
                    marginRight: 2,
                    paddingLeft: 8,
                    paddingRight: 8,
                    cursor: "pointer",
                    fontWeight: isSelected ? "600" : "400",
                    fontSize: "14px",
                    borderBottom: isSelected ? "none" : "1px solid #e0e0e0",
                    minWidth: "30px",
                    maxWidth: "150px",
                    flex: "0 1 auto",
                }}
                onMouseDown={(event: any) => {
                    if (isSelected) {
                        return;
                    }
                    // Request gallery data for this page from main process
                    const ipcManager = this.displayWindowClient.getIpcManager();
                    const displayWindowId = this.displayWindowClient.getWindowId();
                    ipcManager.sendFromRendererProcess("get-symbol-gallery", {
                        page: index,
                        displayWindowId: displayWindowId,
                        widgetKey: this.getHolderWidgetKey(),
                    })
                    // Deselect any previously selected image
                    this.setSelectedImageName("");
                }}
                onMouseEnter={(e) => {
                    if (!isSelected) {
                        (e.target as HTMLElement).style.backgroundColor = "rgba(220, 220, 220, 0.8)";
                    }
                }}
                onMouseLeave={(e) => {
                    if (!isSelected) {
                        (e.target as HTMLElement).style.backgroundColor = "rgba(200, 200, 200, 0.5)";
                    }
                }}
            >
                <span
                    style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        textAlign: "left",
                    }}
                >
                    {pageName}
                </span>
            </div>
        )
    }

    /**
     * Image grid container: displays all images for the current page
     * Supports scrolling if too many images to fit
     */
    _ElementPageImages = () => {
        const pageImages = this.getPageImages();
        const [, forceUpdate] = React.useState({});

        return (
            <div style={{
                display: "inline-flex",
                padding: 16,
                border: "solid 2px rgba(200, 200, 200, 1)",
                borderRadius: 6,
                width: "90%",
                maxHeight: "calc(100% - 150px)",
                flexWrap: "wrap",
                overflow: "auto",
                alignContent: "flex-start",
            }}>
                {
                    Object.entries(pageImages).map(([imageName, imageContent]: [string, string], index: number) => {
                        const selected = this.getSelectedImageName() === imageName;
                        console.log(selected)
                        return (
                            <this._ElementImage
                                key={`${imageName}-${index}`}
                                imageName={imageName}
                                imageContent={imageContent}
                                index={index}
                                selected={selected}
                                forceUpdateImages={forceUpdate}
                            ></this._ElementImage>
                        )
                    })
                }
            </div>
        )
    }

    /**
     * Individual image tile: displays image with name below
     * Shows green checkmark when selected; border highlights on hover
     * On click: toggles selection state
     */
    _ElementImage = ({ imageName, index, imageContent, selected, forceUpdateImages }: any) => {
        const border = selected ? "2px solid green" : "2px solid rgba(0,0,0,0)";

        return (

            <div
                key={index}
                style={{
                    display: "inline-flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: 5,
                }}
            >
                {/* Image container with checkmark overlay */}
                <div style={{
                    position: "relative",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    maxWidth: 80,
                    minWidth: 80,
                    maxHeight: 80,
                    minHeight: 80,
                    boxSizing: "border-box",

                }}
                    onMouseDown={(event: any) => {
                        event.preventDefault();
                        if (this.getSelectedImageName() === imageName) {
                            // Deselect the image
                            this.setSelectedImageName("");
                        } else {
                            // Select the image
                            this.setSelectedImageName(imageName);
                        }
                        this.forceUpdateButtons({});
                        forceUpdateImages({});
                    }}
                >
                    {/* Base64 encoded image (SVG, PNG, JPG, etc.) */}
                    <img
                        src={imageContent}
                        style={{
                            maxWidth: "100%",
                            maxHeight: "100%",
                            objectFit: "contain",
                            display: "block",
                            backgroundColor: "rgba(240, 240, 240, 1)",
                            border: border,
                            borderRadius: 4,
                            boxSizing: "border-box",
                        }}
                        onError={(e) => {
                            // Fallback for broken/invalid images
                            (e.target as HTMLImageElement).style.display = "none";
                        }}
                    />
                    {/* Green checkmark indicator for selected image */}
                    {selected ?
                        <div style={{
                            position: "absolute",
                            top: "4px",
                            right: "4px",
                            width: "24px",
                            height: "24px",
                            backgroundColor: "#4CAF50",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <polyline points="20 6 9 17 4 12" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        :
                        null
                    }

                </div>
                {/* Image name (truncated with ellipsis if too long) */}
                <div style={{
                    fontSize: 12,
                    marginTop: 5,
                    color: "#333",
                    textAlign: "center",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: 80,
                }}>
                    {imageName}
                </div>
            </div>
        )
    }


    _ElementCurrentImage = () => {

        return (
            <div
                style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: 5,
                    position: "absolute",
                    right: 0,
                    top: 0,
                }}
            >
                {/* Image container with checkmark overlay */}
                <div style={{
                    position: "relative",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    maxWidth: 80,
                    minWidth: 80,
                    maxHeight: 80,
                    minHeight: 80,
                    boxSizing: "border-box",

                }}
                >
                    {/* Base64 encoded image (SVG, PNG, JPG, etc.) */}
                    <img
                        src={this.getCurrentImage()}
                        style={{
                            maxWidth: "100%",
                            maxHeight: "100%",
                            objectFit: "contain",
                            display: "block",
                            backgroundColor: "rgba(240, 240, 240, 1)",
                            border: "none",
                            borderRadius: 4,
                            boxSizing: "border-box",
                        }}
                        onError={(e) => {
                            // Fallback for broken/invalid images
                            (e.target as HTMLImageElement).style.display = "none";
                        }}
                    />
                </div>
            </div>
        )
    }

    /**
     * Action buttons: "Select" (enabled only when image selected) and "Close"
     */
    _ElementButtons = ({ selectCallback }: any) => {
        const [, updateButtons] = React.useState({});
        this.forceUpdateButtons = updateButtons;
        const defaultBackgroundColor = this.getSelectedImageName() === "" ? "rgba(180, 180, 180, 1)" : ElementRectangleButtonDefaultBackgroundColor;
        const highlightBackgroundColor = this.getSelectedImageName() === "" ? "rgba(180, 180, 180, 1)" : ElementRectangleButtonHighlightBackgroundColor;
        return (
            <div
                style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    marginTop: 10,
                    marginBottom: 20,
                }}
            >
                {/* Select button: disabled (grayed out) if no image selected */}
                <ElementRectangleButton
                    defaultBackgroundColor={defaultBackgroundColor}
                    highlightBackgroundColor={highlightBackgroundColor}
                    handleMouseDown={(event: any) => {
                        const symbolName = this.getSelectedImageName();
                        if (symbolName === "") {
                            return;
                        }
                        const symbolContent = this.getPageImages()[symbolName];
                        if (symbolContent === undefined) {
                            return;
                        }
                        // Invoke callback with selected symbol name and content
                        selectCallback(symbolName, symbolContent);
                        this.removeElement();
                    }}
                >
                    Select
                </ElementRectangleButton>
                {/* Close button: closes gallery without selecting */}
                <ElementRectangleButton
                    marginLeft={20}
                    handleMouseDown={(event: any) => {
                        this.removeElement();
                    }}
                >
                    Close
                </ElementRectangleButton>
            </div>
        )
    }


    // ======================== Helper Methods ========================

    /**
     * Remove the gallery modal from DOM and reset state
     */
    removeElement = () => {
        const oldElement = document.getElementById(this._id);
        if (oldElement !== null) {
            document.body.removeChild(oldElement);
        }
        this.setHolderWidgetKey("");
        this.setPageImages({});
        this.setPageNames([]);
        this.setSelectedPage(0);

    }

    /**
     * Close gallery when Escape key is pressed
     */
    removeElementOnEscKey = (event: KeyboardEvent) => {
        if (event.key === "Escape" || event.key === "Esc") {
            this.removeElement();
        }
    }

    // ======================== Getters & Setters ========================

    getHolderWidgetKey = () => {
        return this._holderWidgetKey;
    }

    setHolderWidgetKey = (newKey: string) => {
        this._holderWidgetKey = newKey;
    }

    getPageNames = () => {
        return this._pageNames;
    }

    getPageImages = () => {
        return this._pageImages;
    }

    setPageNames = (newNames: string[]) => {
        this._pageNames = newNames;
    }

    setPageImages = (newImages: Record<string, string>) => {
        this._pageImages = newImages;
    }

    getSelectedPage = () => {
        return this._selectedPage;
    }

    setSelectedPage = (newPage: number) => {
        this._selectedPage = newPage;
    }

    getSelectedImageName = () => {
        return this._selectedImageName;
    }

    setSelectedImageName = (newName: string) => {
        this._selectedImageName = newName;
    }

    getCurrentImage = () => {
        return this._currentImage;
    }

    setCurrentImage = (img: string) => {
        this._currentImage = img;
    }

    getId = () => {
        return this._id;
    }
}
