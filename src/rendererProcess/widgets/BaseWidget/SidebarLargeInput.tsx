import ReactDOM from "react-dom/client";
import * as React from "react";
import { ElementRectangleButton } from "../../helperWidgets/SharedElements/RectangleButton";
import { GlobalVariables } from "../../global/GlobalVariables";

export class SidebarLargeInput {
    value: string = "";
    setValue: any;
    readableText: string = "";
    title: string = ""
    updater: any = undefined;

    readonly id: string = "sidebar-large-input";

    constructor() {
    }

    createElement = (value: string, setValue: any, readableText: string, updater: any, withOkButton: boolean = false) => {
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

        ReactDOM.createRoot(newElement).render(<this._Element withOkButton={withOkButton}></this._Element>);
        document.body.appendChild(newElement);
    }

    _Element = ({ withOkButton }: { withOkButton: boolean }) => {
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
                    borderRadius: 6,
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
                            if (withOkButton === true) {
                                // do nothing on submit
                                // do the change when click the OK button
                            } else {
                                this.value = localValue;
                                this.setValue(localValue);
                                this.updater(localValue);
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
                            if (withOkButton === true) {
                                this.value = localValue;
                                this.setValue(localValue);
                                this.updater(localValue);
                            }
                            this.removeElement();
                        }}
                    >
                        {withOkButton === true ? "OK" : "Close"}
                    </ElementRectangleButton>
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
                        onChange={(event: any) => {
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

    removeElementOnEscKey = (event: KeyboardEvent) => {
        if (event.key === "Escape" || event.key === "Esc") {
            this.removeElement();
        }
    }


}