import ReactDOM from "react-dom/client";
import * as React from "react";
import { BaseWidgetSidebar } from "./BaseWidgetSidebar";
import { ElementRectangleButton } from "../../helperWidgets/SharedElements/RectangleButton";
import { SidebarComponent } from "../../helperWidgets/SidebarComponents/SidebarComponent";
import { g_widgets1, GlobalVariables } from "../../global/GlobalVariables";

export class SidebarLargeInput {
    value: string = "";
    setValue: any;
    readableText: string = "";
    updater: any = undefined;
    readonly id: string = "sidebar-large-input";

    constructor() {
    }

    createElement = (value: string, setValue: any, readableText: string, updater: any) => {
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

        ReactDOM.createRoot(newElement).render(<this._Element></this._Element>);
        document.body.appendChild(newElement);
    }

    _Element = () => {
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
                    height: "70%",
                    backgroundColor: "rgba(20,20,20,1)",
                    color: "rgba(210,210,210,1)",
                }}>
                    <h2>
                        Set value for <span style={{ color: "yellow" }}>{this.readableText}</span>
                    </h2>
                    <p style={{ fontSize: 13, marginTop: 0 }}>
                        Hit Enter to confirm the input.
                    </p>
                    <form
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
                            this.value = localValue;
                            this.setValue(localValue);
                            this.updater(localValue);
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
                            // must use enter to change the value
                            onBlur={(event: any) => {
                                // const orig = this.getMainWidget().getChannelNames()[0];
                                const orig = this.getValue();
                                console.log("blur:", orig, localValue)
                                if (orig !== localValue) {
                                    setLocalValue(orig);
                                }
                            }}
                        />
                    </form>
                    <ElementRectangleButton
                        handleClick={() => {
                            this.removeElement();
                        }}
                    >
                        Close
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

    removeElementOnEscKey = (event: KeyboardEvent) => {
        if (event.key === "Escape" || event.key === "Esc") {
            this.removeElement();
        }
    }


}