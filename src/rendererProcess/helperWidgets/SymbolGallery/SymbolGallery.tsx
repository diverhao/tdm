import ReactDOM from "react-dom/client";
import * as React from "react";
import { GlobalVariables } from "../../../common/GlobalVariables";
import { ElementRectangleButton } from "../SharedElements/RectangleButton";
import { Log } from "../../../common/Log";
import { type_DialogInputBox, type_DialogMessageBox, type_DialogMessageBoxButton } from "../../../common/IpcEventArgType";
import { TdmLogo } from "../../global/Images";
import { DisplayWindowClient } from "../../windows/DisplayWindow/DisplayWindowClient";
import { BaseWidget } from "../../widgets/BaseWidget/BaseWidget";



/**
 * Customized prompt for all modes. The electron.js does not support native prompt. <br>
 * 
 * Each display window has one such class.
 */
export class SymbolGallery {

    private readonly _id = "element-symbol-gallery";
    displayWindowClient: DisplayWindowClient;
    _holderWidgetKey: string = "";
    _pageNames: string[] = [];
    _pageImages: Record<string, string> = {};
    forceUpdate = (input: any) => { console.log("force update???") };

    constructor(displayWindowClient: DisplayWindowClient) {
        this.displayWindowClient = displayWindowClient;
        this.startEventListeners();
    }

    startEventListeners = () => {
        window.addEventListener("keydown", this.removeElementOnEscKey)
    }

    /**
     * If we remove these event listeners, the prompt won't disappear when we click blank area or 
     * press Esc key. 
     */
    removeEventListeners = () => {
        window.removeEventListener("mousedown", this.removeElement)
        window.removeEventListener("keydown", this.removeElementOnEscKey)
    }

    createElement = (selectCallback: (symbolName: string, symbolContent: string) => void, holderWidgetKey: string) => {

        this.removeElement();

        this.setHolderWidgetKey(holderWidgetKey);

        // transparent backdrop
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

        // let the wrapper div include the contents
        ReactDOM.createRoot(newElement).render(
            <this._ElementFrame
                selectCallback={selectCallback}
            >
            </this._ElementFrame>
        );
        // append wrapper element
        document.body.appendChild(newElement);
    }

    /**
     * Frame for symbol gallery, contains `Select` and `Cancel` buttons
     */
    _ElementFrame = ({ selectCallback }: any) => {

        const [, forceUpdate] = React.useState({});
        // Update the state when class instance data changes
        this.forceUpdate = forceUpdate;

        React.useEffect(() => {
            const ipcManager = this.displayWindowClient.getIpcManager();
            const displayWindowId = this.displayWindowClient.getWindowId();
            ipcManager.sendFromRendererProcess("get-symbol-gallery", {
                page: 1,
                displayWindowId: displayWindowId,
                widgetKey: this.getHolderWidgetKey(),
            })
        }, [])

        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: "rgba(255,255,255,1)",
                }}
            >
                <this._ElementPageNames></this._ElementPageNames>
                <this._ElementPageImages></this._ElementPageImages>

                <ElementRectangleButton
                    handleMouseDown={(event: any) => {
                        selectCallback({
                            symbolName: "ABC",
                            symbolContent: "DEF",
                        });
                        this.removeElement();
                    }}
                >
                    Select
                </ElementRectangleButton>
                <ElementRectangleButton
                    handleMouseDown={(event: any) => {
                        this.removeElement();
                    }}
                >
                    Cancel
                </ElementRectangleButton>
            </div>
        )
    }

    _ElementPageNames = (props: any) => {
        // const pageNames = props.pageNames || this.getPageNames();
        const pageNames = this.getPageNames();
        return (
            <div>
                {
                    pageNames.map((pageName: string, index: number) => {
                        return (
                            <ElementRectangleButton
                                key={index}
                                handleMouseDown={(event: any) => {
                                    // select this page
                                }}
                            >
                                {pageName}
                            </ElementRectangleButton>

                        )
                    })
                }
            </div>
        )
    }

    _ElementPageImages = (props: any) => {
        const pageImages = this.getPageImages();
        
        return (
            <div style={{
                display: "inline-flex",
                padding: 16,
            }}>
                {
                    Object.entries(pageImages).map(([imageName, imageContent]: [string, string], index: number) => {
                        console.log(imageContent)
                        return (
                            <div
                                key={index}
                                style={{
                                    display: "inline-flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                }}
                            >
                                <img
                                    src={imageContent}
                                    style={{
                                        width: 100,
                                        height: 100,
                                        objectFit: "contain",
                                        border: "1px solid #ddd",
                                        borderRadius: "4px",
                                        backgroundColor: "#f9f9f9",
                                    }}
                                    onError={(e) => {
                                        // Fallback for broken images
                                        (e.target as HTMLImageElement).style.display = "none";
                                    }}
                                />
                                <div style={{
                                    fontSize: "12px",
                                    color: "#333",
                                    textAlign: "center",
                                    wordBreak: "break-word",
                                    maxWidth: "100%",
                                }}>
                                    {imageName}
                                </div>
                            </div>
                        )
                    })
                }
            </div>
        )
    }

    // ------------------------ methods -----------------------------------

    removeElement = () => {
        const oldElement = document.getElementById(this._id);
        if (oldElement !== null) {
            document.body.removeChild(oldElement);
        }
        this.setHolderWidgetKey("");
    }

    removeElementOnEscKey = (event: KeyboardEvent) => {
        if (event.key === "Escape" || event.key === "Esc") {
            this.removeElement();
        }
    }

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

    getId = () => {
        return this._id;
    }
}
