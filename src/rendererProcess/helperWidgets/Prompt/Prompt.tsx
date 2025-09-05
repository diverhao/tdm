import ReactDOM from "react-dom/client";
import * as React from "react";
import { GlobalVariables, g_widgets1 } from "../../global/GlobalVariables";
import { ElementRectangleButton } from "../SharedElements/RectangleButton";
import { Log } from "../../../mainProcess/log/Log";
import { type_DialogInputBox, type_DialogMessageBox, type_DialogMessageBoxButton } from "../../../mainProcess/mainProcess/IpcEventArgType";



/**
 * Customized prompt for all modes. The electron.js does not support native prompt. <br>
 * 
 * Each display window has one such class.
 */
export abstract class Prompt {

    private readonly _id = "element-prompt";
    private _nameElementMap: Record<string, ({ args }: any) => React.JSX.Element> = {}
    dialogInputBoxText = "";

    getDialogInputBoxText = () => {
        return this.dialogInputBoxText;
    }

    setDialogInputBoxText = (newText: string) => {
        this.dialogInputBoxText = newText;
    }

    constructor() {
        this.startEventListeners();
        // it has special format, cannot be used by dialog-message-box
        this.getNameElementMap()["about-tdm"] = this._ElementAboutTdm;
        this.getNameElementMap()["dialog-message-box"] = this._ElementDialogMessageBox;
        this.getNameElementMap()["dialog-input-box"] = this._ElementDialogInputBox;
    }

    startEventListeners = () => {
        // // escape key to remove this element
        window.addEventListener("keydown", this.removeElementOnEscKey)

        // // when we use the wrapper element's mousedown event, we cannot
        // // stop propagation this event in prompt box
        // window.addEventListener("mousedown", this.removeElement)
    }

    /**
     * If we remove these event listeners, the prompt won't disappear when we click blank area or 
     * press Esc key. 
     */
    removeEventListeners = () => {
        window.removeEventListener("mousedown", this.removeElement)
        window.removeEventListener("keydown", this.removeElementOnEscKey)
    }

    createElement = (name: string, ...args: any[]) => {

        this.removeElement();

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
        const FunctionalElement = this.getNameElementMap()[name];
        if (FunctionalElement !== undefined) {
            ReactDOM.createRoot(newElement).render(<FunctionalElement args={args}></FunctionalElement>);
            // append wrapper element
            document.body.appendChild(newElement);
        } else {
            this.removeElement();
        }
    }

    // --------------------------- general elements -----------------------

    _ElementBackground = ({ children }: any) => {
        return (<div
            style={{
                width: "80%",
                backgroundColor: "rgba(40, 40, 40, 1)",
                borderRadius: 4,
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "column",
                animation: "fadeIn 5s",
                color: "rgba(200, 200, 200, 1)",
                padding: 10,
                fontFamily: GlobalVariables.defaultFontFamily,
                fontSize: GlobalVariables.defaultFontSize,
                fontStyle: GlobalVariables.defaultFontStyle,
                fontWeight: GlobalVariables.defaultFontWeight,
                position: "fixed",
                margin: 20,
                border: "solid 1px white",
            }}
            onMouseDown={(event: React.MouseEvent) => {
            }
            }
        >
            {children}
        </div >)
    }

    _ElementForm = ({ children, handleSubmit, widthPercent }: any) => {
        return (
            <form
                style={{
                    width: `${widthPercent}%`,
                    display: "inline-flex",
                    justifyContent: "center",
                    alignItems: "center",
                    margin: 0,
                }}
                onSubmit={handleSubmit}
            >
                {children}
            </form>

        )

    }

    _ElementInput = ({ autoFocus, value, handleChange, type }: any) => {
        return (
            <input
                style={{
                    width: "100%",
                    margin: 5,
                    border: "solid 1px rgba(0, 80, 200, 1)",
                    borderRadius: 0,
                    outline: "none",
                    color: "rgba(200, 200, 200, 1)",
                    backgroundColor: "rgba(60, 60, 60, 1)",
                    padding: 5,
                }}
                autoFocus={autoFocus}
                onChange={handleChange}
                value={value}
                type={type === undefined ? "text" : type}
            >
            </input>
        )
    }

    // ---------------------------- elements ------------------------------


    // args: array of input arguments, Record<string, string | string[]>
    _ElementAboutTdm = ({ args }: any) => {
        const info = args[0]["info"];

        return (<this._ElementBackground>
            <div style={{
                display: "inline-flex",
                justifyContent: "center",
            }}>
                <img src={"../../resources/webpages/tdm-logo.svg"} width="50px" height="50px"></img>
            </div>
            <h2>TDM</h2>
            <div style={{
                display: "inline-flex",
                justifyContent: "center",
                flexDirection: "column",
                width: "90%"
            }}>
                {Object.keys(info).map((key: string, index: number) => {
                    const values = info[key];
                    return <div style={{
                        width: "100%",
                        display: "inline-flex",
                        flexDirection: "column",
                    }}>
                        <div style={{
                            width: "100%",
                            display: "inline-flex",
                            flexDirection: "row",
                            margin: 3,
                        }}>
                            <div style={{ width: "48%", display: "inline-flex", justifyContent: "flex-end" }}>
                                {key}:
                            </div>
                            <div style={{ width: "2%" }}>
                                &nbsp;
                            </div>
                            <div style={{ width: "48%", display: "inline-flex", flexDirection: "column" }}>
                                {values.map((value: string) => {
                                    return <div>{value}</div>
                                })}
                            </div>
                        </div>
                    </div>
                })}
            </div>
            <div style={{
                display: "inline-flex",
                width: "100%",
                flexDirection: 'row',
                alignItems: "cener",
                justifyContent: "center",
                margin: 15,
                userSelect: "none",
            }}>
                <ElementRectangleButton
                    handleClick={async (event: React.MouseEvent) => {
                        event.preventDefault();
                        try {
                            await navigator.clipboard.writeText(JSON.stringify(info, null, 4));
                        } catch (e) {
                            console.log(e);
                        }
                        this.removeElement();
                    }}
                >
                    Copy
                </ElementRectangleButton>
                &nbsp; &nbsp; &nbsp; &nbsp;
                <ElementRectangleButton
                    handleClick={(event: React.MouseEvent) => {
                        event.preventDefault();
                        this.removeElement();
                    }}
                >
                    OK
                </ElementRectangleButton>
            </div>
        </this._ElementBackground>)

    }

    /** 
     * emulate the dialog.showMessageBox() in electron.js
     * 
     * there are one or more selects: OK, Cancel, Open Anyway, Quit, ...
     * 
     * each button should come with a callback, if there is no callback,
     * 
     * then this button is simply an ackowledgement button
     * 
     * args: 
     * 
     * {
     *     messageType: "error" | "warning" | "info", // symbol
     *     humanReadableMessages: string[], // each string has a new line
     *     rawMessages: string[], // computer generated messages
     *     buttons: ({text: string, handleClick: (() => void) | undefined}[]) | undefined
     * }
     */

    _ElementDialogMessageBox = ({ args }: any) => {
        const info: type_DialogMessageBox = args[0];
        const messageType = info["messageType"];
        const humanReadablemessages = info["humanReadableMessages"];
        const rawMessages = info["rawMessages"];
        let buttons = info["buttons"];
        if (buttons === undefined) {
            buttons = [];
        }
        Log.debug("buttons", buttons)

        return (<this._ElementBackground>
            {/* header */}
            <div>
                <img src="../../resources/webpages/tdm-logo.svg" height="30px"></img>
            </div>
            <div style={{
                fontSize: 30,
                color: "rgba(150, 150, 150, 1)",
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",
                height: 50,
            }}>
                <span
                    style={{
                        color: messageType === "error" ? "red" : messageType === "warning" ? "yellow" : "rgba(150,150,150,1)",
                    }}
                >
                    {messageType.toUpperCase()}
                </span>
            </div>
            {/* human readable info */}
            <div style={{
                display: "inline-flex",
                flexDirection: "column",
            }}>
                {humanReadablemessages.map((message: string) => {
                    return <div style={{ height: 20, display: "inline-flex", justifyContent: 'center', alignItems: "center" }}>{message}</div>
                })}
            </div>
            &nbsp;
            {/* computer generated info */}
            <div style={{
                display: "inline-flex",
                flexDirection: "column",
            }}>
                {rawMessages.map((message: string) => {
                    return <div style={{ height: 20, display: "inline-flex", justifyContent: 'center', alignItems: "center" }}>{message}</div>
                })}
            </div>
            &nbsp;
            {/* only one OK button, if buttons entry is undefined or empty */}
            {buttons.length === 0 ?
                <div style={{
                    display: "inline-flex",
                    width: "100%",
                    flexDirection: 'row',
                    alignItems: "cener",
                    justifyContent: "center",
                    margin: 5,
                    userSelect: "none",
                }}>
                    <ElementRectangleButton
                        handleClick={(event: React.MouseEvent) => {
                            event.preventDefault();
                            this.removeElement();
                        }}
                    >
                        OK
                    </ElementRectangleButton>
                </div> :
                <div style={{
                    display: "inline-flex",
                    width: "100%",
                    flexDirection: 'row',
                    alignItems: "cener",
                    justifyContent: "center",
                    margin: 5,
                    userSelect: "none",
                }}>
                    {buttons.map((button: type_DialogMessageBoxButton) => {
                        const text = button["text"];
                        const handleClick = button["handleClick"];
                        return <ElementRectangleButton
                            additionalStyle={{
                                marginLeft: 5,
                                marginRight: 5,
                            }}
                            handleClick={(event: React.MouseEvent) => {
                                event.preventDefault();
                                this.removeElement();
                                if (handleClick !== undefined) {
                                    handleClick();
                                }
                            }}
                        >
                            {text}
                        </ElementRectangleButton>
                    })}
                </div>
            }

        </this._ElementBackground>)

    }

    _ElementDialogInputBox = ({ args }: any) => {
        const info: type_DialogInputBox = args[0];
        // const messageType = info["messageType"];
        const humanReadablemessages = info["humanReadableMessages"];
        const defaultInputText = info["defaultInputText"];
        // const rawMessages = info["rawMessages"];
        let buttons = info["buttons"];
        if (buttons === undefined) {
            buttons = [];
        }
        // Log.debug("buttons", buttons)

        const refInput = React.useRef<any>(null);
        const [inputText, setInputText] = React.useState(defaultInputText);

        return (<this._ElementBackground>
            {/* header */}
            <div>
                <img src="../../resources/webpages/tdm-logo.svg" height="30px"></img>
            </div>
            {/* human readable info */}
            <div style={{
                display: "inline-flex",
                flexDirection: "column",
            }}>
                {humanReadablemessages.map((message: string) => {
                    return <div style={{ height: 20, display: "inline-flex", justifyContent: 'center', alignItems: "center" }}>{message}</div>
                })}
            </div>
            &nbsp;
            <div style={{
                display: "inline-flex",
                flexDirection: "column",
                width: "70%",
            }}>
                <form
                    style={{
                        width: "100%",
                    }}
                    onSubmit={(event: any) => { event?.preventDefault() }}>
                    <this._ElementInput
                        value={inputText}
                        handleChange={(event: any) => {
                            setInputText(event.target.value);
                            this.setDialogInputBoxText(event.target.value);
                        }}
                        autoFocus={true}
                        type={"text"}
                    >
                    </this._ElementInput>
                </form>
            </div>
            {/* only one OK button, if buttons entry is undefined or empty */}
            <div style={{
                display: "inline-flex",
                width: "100%",
                flexDirection: 'row',
                alignItems: "cener",
                justifyContent: "center",
                margin: 5,
                userSelect: "none",
            }}>
                {buttons.map((button: type_DialogMessageBoxButton) => {
                    const text = button["text"];
                    const handleClick = button["handleClick"];
                    return <ElementRectangleButton
                        additionalStyle={{
                            marginLeft: 5,
                            marginRight: 5,
                        }}
                        handleClick={(event: React.MouseEvent) => {
                            event.preventDefault();
                            this.removeElement();
                            if (handleClick !== undefined) {
                                handleClick(this.getDialogInputBoxText());
                            }
                            // clear the input text
                            this.setDialogInputBoxText("");
                        }}
                    >
                        {text}
                    </ElementRectangleButton>
                })}
            </div>
        </this._ElementBackground>)

    }
    // ------------------------ methods -----------------------------------

    removeElement = () => {
        const oldElement = document.getElementById(this._id);
        if (oldElement !== null) {
            document.body.removeChild(oldElement);
        }
    }

    removeElementOnEscKey = (event: KeyboardEvent) => {
        if (event.key === "Escape" || event.key === "Esc") {
            this.removeElement();
        }
    }


    getNameElementMap = () => {
        return this._nameElementMap;
    }

    getId = () => {
        return this._id;
    }

    // abstract getWindowClient(): DisplayWindowClient | MainWindowClient;
}
