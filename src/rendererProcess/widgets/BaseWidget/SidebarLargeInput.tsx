import ReactDOM from "react-dom/client";
import * as React from "react";
import { ElementRectangleButton } from "../../helperWidgets/SharedElements/RectangleButton";
import { g_widgets1 } from "../../global/GlobalVariables";
import { GlobalVariables, liquidGlassStyle, liquidGlassStyleDark } from "../../../common/GlobalVariables";
import { BaseWidget } from "./BaseWidget";
import { BaseWidgetSidebar } from "./BaseWidgetSidebar";
import { isDarkMode, rgbaStrToRgbaArray } from "../../../common/GlobalMethods";

export class SidebarLargeInput {
    value: string = "";
    setValue: any;
    readableText: string = "";
    title: string = ""
    updater: any = undefined;

    readonly id: string = "sidebar-large-input";

    constructor() {
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

    createElement = (
        value: string,
        setValue: any,
        readableText: string,
        updater: any,
        hitEnterAsOK: boolean = false,
        windowType: "DisplayWindow" | "MainWindow" = "DisplayWindow",
    ) => {
        this.removeElement();
        this.setValue = setValue;
        this.value = value;
        this.readableText = readableText;
        this.updater = updater;

        // transparent backdrop
        const newElement = document.createElement('div');
        newElement.id = this.getId();

        newElement.style.position = "absolute";
        newElement.style.left = "0px";
        newElement.style.top = "0px";
        newElement.style.width = "100%";
        newElement.style.height = "100%";
        newElement.style.display = "inline-flex";
        newElement.style.alignItems = "flex-start";
        newElement.style.justifyContent = "center";

        if (windowType === "DisplayWindow") {
            ReactDOM.createRoot(newElement).render(<this._Element hitEnterAsOK={hitEnterAsOK} ></this._Element>);
            document.body.appendChild(newElement);
        } else {
            ReactDOM.createRoot(newElement).render(<this._ElementForMainWindow hitEnterAsOK={hitEnterAsOK}></this._ElementForMainWindow>);
            document.body.appendChild(newElement);
        }
    }

    _Element = ({ hitEnterAsOK }: { hitEnterAsOK: boolean }) => {
        const [localValue, setLocalValue] = React.useState(this.getValue());

        // channel name hint
        const formElementRef = React.useRef<HTMLFormElement>(null);
        const inputElementRef = React.useRef<HTMLInputElement>(null);

        const [showChannelNameHint, setShowChannelNameHint] = React.useState(false);
        const ChannelNameHintElement = g_widgets1.getRoot().getDisplayWindowClient().getChannelNameHint()._Element;
        const [channelNameHintElementDimension, setChannelNameHintElementDimension] = React.useState({ width: 0, maxHeight: 0, left: 0, top: 0 });
        const [channelNameHintData, setChannelNameHintData] = React.useState<string[]>([]);

        const selectHint = (channelName: string) => {
            // (event.currentTarget.elements[0] as HTMLInputElement).blur();
            // setShowChannelNameHint(false);
            setLocalValue(channelName);
            setShowChannelNameHint(false)
        }

        React.useEffect(() => {
            inputElementRef.current?.focus();
            inputElementRef.current?.select();
        }, [])

        const backgroundStyle = this.getBackgroundStyle();

        return (
            <div style={{
                display: "inline-flex",
                width: "100%",
                height: "100%",
                backgroundColor: "rgba(0, 0, 0, 0)",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                // backdropFilter: "blur(10px)",
            }}>
                <div
                    style={{
                        display: "inline-flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "85%",
                        height: "70%",
                        // backgroundColor: "rgba(20,20,20,1)",
                        // liquid glass blur effect
                        boxSizing: "border-box",
                        // textShadow: `-0.5px -0.5px 0 white, 0.5px -0.5px 0 white, -0.5px 0.5px 0 white, 0.5px 0.5px 0 white`,
                        zIndex: 100,
                        // background: "rgba(255, 255, 255, 0.15)",
                        // backdropFilter: "blur(2px) saturate(180%)",
                        // border: "1px solid rgba(255, 255, 255, 0.8)",
                        borderRadius: "2rem",
                        // boxShadow: "0 8px 32px rgba(31, 38, 135, 0.2), inset 0 4px 20px rgba(255, 255, 255, 0.3)",
                        overflow: "hidden",
                        ...backgroundStyle
                    }}
                    onMouseDown={(event) => event.stopPropagation()}
                >
                    <h2>
                        Set value for <span>{this.readableText}</span>
                    </h2>
                    <form
                        ref={formElementRef}
                        style={{
                            width: "95%",
                            display: "inline-flex",
                            flexDirection: "column",
                            justifyContent: 'center',
                            alignItems: "center,",
                            marginTop: 10,
                            marginBottom: 10,
                        }}
                        onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                            event.preventDefault();
                            if (hitEnterAsOK === true) {
                                // as OK
                                this.value = localValue;
                                this.setValue(localValue);
                                this.updater(localValue);
                                this.removeElement();
                            }
                            // setShowChannelNameHint(false);
                        }}
                    >

                        <input
                            style={{
                                width: "100%",
                                paddingTop: 6,
                                paddingBottom: 3,
                                paddingLeft: 3,
                                paddingRight: 3,
                                fontSize: GlobalVariables.defaultFontSize * 1.2,
                                fontFamily: GlobalVariables.defaultMonoFontFamily,
                                outline: "none",
                                borderRadius: 0,
                                border: "none",
                            }}
                            ref={inputElementRef}
                            type="string"
                            spellCheck={false}
                            value={localValue}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                const newVal = event.target.value;
                                setLocalValue(newVal);

                                if (this.readableText === "Channel Name") {
                                    // send query for channel name if there are more than 1 character input
                                    if (newVal.trim().length >= 2) {
                                        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
                                        const queryStr = displayWindowClient.generateChannelLookupQuery(newVal);
                                        // console.log(queryStr)
                                        if (queryStr !== "") {
                                            fetch(queryStr)
                                                .then(res => res.json())
                                                .then((data: any) => {
                                                    if (Object.keys(data).length > 0 && formElementRef.current !== null) {

                                                        // const rectInput = inputElementRef.current.getBoundingClientRect();
                                                        const recForm = formElementRef.current.getBoundingClientRect();
                                                        setChannelNameHintElementDimension({
                                                            left: recForm.left, // rectInput.left, // - recForm.left,
                                                            top: recForm.top + recForm.height + 5, //rectInput.top - recForm.top + rectInput.height,
                                                            width: recForm.width - 5,
                                                            maxHeight: 200,
                                                        })
                                                        setChannelNameHintData(Object.keys(data));
                                                        setShowChannelNameHint(true);
                                                    } else {
                                                        setChannelNameHintData(data);
                                                        setShowChannelNameHint(false);
                                                    }
                                                })
                                        }
                                    }
                                }
                            }}
                        />

                        <ChannelNameHintElement
                            show={showChannelNameHint}
                            additionalStyle={channelNameHintElementDimension}
                            channelNames={channelNameHintData}
                            selectHint={selectHint}
                        ></ChannelNameHintElement>

                    </form>
                    <div style={{
                        display: "inline-flex",
                        flexDirection: "row",
                    }}>
                        <ElementRectangleButton
                            defaultTextColor={"white"}
                            highlightTextColor={"white"}
                            additionalStyle={{
                                textShadow: "none",
                                marginRight: 15,
                            }}

                            handleClick={() => {
                                this.value = localValue;
                                this.setValue(localValue);
                                this.updater(localValue);
                                this.removeElement();
                            }}
                        >
                            OK
                        </ElementRectangleButton>
                        <ElementRectangleButton
                            defaultTextColor={"white"}
                            highlightTextColor={"white"}
                            additionalStyle={{
                                textShadow: "none",
                            }}

                            handleClick={() => {
                                this.removeElement();
                            }}
                        >
                            Cancel
                        </ElementRectangleButton>
                    </div>
                </div>
            </div>
        )
    }

    /**
     * similar to _Element, but without channel name hint
     */
    _ElementForMainWindow = ({ hitEnterAsOK }: { hitEnterAsOK: boolean }) => {
        const [localValue, setLocalValue] = React.useState(this.getValue());

        // channel name hint
        const formElementRef = React.useRef<HTMLFormElement>(null);

        const backgroundStyle = this.getBackgroundStyle();

        return (
            <div style={{
                display: "inline-flex",
                width: "100%",
                height: "100%",
                // backgroundColor: "rgba(0, 0, 0, 0.2)",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                // backdropFilter: "blur(10px)",
            }}>
                <div style={{
                    display: "inline-flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "85%",
                    height: "70%",
                    // backgroundColor: "rgba(20,20,20,1)",
                    // color: "rgba(210,210,210,1)",
                    borderRadius: 6,
                    ...backgroundStyle
                }}>
                    <h2>
                        Set value for <span style={{ color: "blue" }}>{this.readableText}</span>
                    </h2>
                    <form
                        ref={formElementRef}
                        style={{
                            width: "95%",
                            display: "inline-flex",
                            flexDirection: "column",
                            justifyContent: 'center',
                            alignItems: "center,",
                            marginTop: 10,
                            marginBottom: 10,
                        }}
                        onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                            event.preventDefault();
                            if (hitEnterAsOK === true) {
                                this.value = localValue;
                                this.setValue(localValue);
                                this.updater(localValue);
                                this.removeElement();
                            }
                        }}
                    >

                        <input
                            style={{
                                width: "100%",
                                paddingTop: 6,
                                paddingBottom: 3,
                                paddingLeft: 3,
                                paddingRight: 3,
                                fontSize: GlobalVariables.defaultFontSize * 1.2,
                                fontFamily: GlobalVariables.defaultMonoFontFamily,
                                outline: "none",
                                borderRadius: 0,
                                border: "none",
                            }}
                            type="string"
                            spellCheck={false}
                            value={localValue}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                const newVal = event.target.value;
                                setLocalValue(newVal);
                            }}
                        />

                    </form>
                    <div style={{
                        display: 'inline-flex',
                        flexDirection: "row",
                    }}>
                        <ElementRectangleButton
                            additionalStyle={{
                                marginRight: 15,
                            }}
                            handleClick={() => {
                                this.value = localValue;
                                this.setValue(localValue);
                                this.updater(localValue);
                                this.removeElement();
                            }}
                        >
                            OK
                        </ElementRectangleButton>
                        <ElementRectangleButton
                            handleClick={() => {
                                this.removeElement();
                            }}
                        >
                            Cancel
                        </ElementRectangleButton>
                    </div>
                </div>
            </div>
        )
    }


    createTextareaElement = (value: string, title: string, readableText: string, updater: any) => {
        this.removeElement();

        this.title = title;
        this.value = value;
        this.readableText = readableText;
        this.updater = updater;

        // transparent backdrop
        const newElement = document.createElement('div');
        newElement.id = this.getId();

        newElement.style.position = "absolute";
        newElement.style.left = "0px";
        newElement.style.top = "0px";
        newElement.style.width = "100%";
        newElement.style.height = "100%";
        newElement.style.display = "inline-flex";
        newElement.style.alignItems = "flex-start";
        newElement.style.justifyContent = "center";

        ReactDOM.createRoot(newElement).render(<this._ElementTextarea></this._ElementTextarea>);
        document.body.appendChild(newElement);
    }


    _ElementTextarea = () => {
        const [localValue, setLocalValue] = React.useState(this.getValue());
        return (
            <div style={{
                display: "inline-flex",
                width: "100%",
                height: "100%",
                backgroundColor: "rgba(0, 0, 0, 0.2)",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(10px)",
            }}>
                <div style={{
                    display: "inline-flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "85%",
                    height: "80%",
                    backgroundColor: "rgba(20,20,20,1)",
                    color: "rgba(210,210,210,1)",
                    borderRadius: 6,
                }}>
                    <h2>
                        {this.title}
                    </h2>
                    <p style={{ fontSize: 13, marginTop: 0 }}>
                        {this.readableText}
                    </p>
                    <textarea
                        style={{
                            width: "90%",
                            // height: "80%",
                            outline: "none",
                            border: "none",
                            flexGrow: 1,
                            marginBottom: 20,
                        }}
                        value={localValue}
                        onChange={(event) => {
                            setLocalValue(event.target.value);
                        }}
                    >
                    </textarea>
                    <ElementRectangleButton
                        handleClick={() => {
                            this.value = localValue;

                            this.updater(localValue);
                            this.removeElement();
                        }}
                        additionalStyle={{
                            marginBottom: 20,
                        }}
                    >
                        OK
                    </ElementRectangleButton>
                </div>
            </div>
        )
    }

    // --------------- getters and setters ----------------------
    getId = () => {
        return this.id;
    }

    getValue = () => {
        return this.value;
    }

    removeElement = () => {
        const oldElement = document.getElementById(this.getId());
        if (oldElement !== null) {
            document.body.removeChild(oldElement);
            this.value = "";
            this.setValue = undefined;
            this.readableText = "";
            this.updater = undefined;
        }
    }

    getBackgroundStyle = () => {
        const canvas = g_widgets1.getWidget("Canvas");
        if (canvas?.getWidgetKey() === "Canvas") {
            const backgroundColor = canvas.getStyle()["backgroundColor"];
            if (typeof backgroundColor === "string") {
                const [r, g, b, a] = rgbaStrToRgbaArray(backgroundColor);
                if (typeof r === "number" && typeof g === "number" && typeof b === "number") {
                    if (r + g + b < 180) {
                        return liquidGlassStyle;
                    }
                }
            }
        }
        return liquidGlassStyleDark;
    }

    removeElementOnEscKey = (event: KeyboardEvent) => {
        if (event.key === "Escape" || event.key === "Esc") {
            this.removeElement();
        }
    }


}