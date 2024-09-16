import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { PvTable } from "./PvTable";
import { ElementRectangleButton } from "../../helperWidgets/SharedElements/RectangleButton";

export class PvTableSettings {
    _mainWidget: PvTable;
    constructor(pvTable: PvTable) {
        this._mainWidget = pvTable;
    }

    getMainWidget = () => {
        return this._mainWidget;
    };

    _Element = () => {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: "rgba(255,255,255,1)",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    // overflow: "scroll",
                }}
            >
                <div
                    style={{
                        width: "90%",
                        height: "90%",
                        left: "5%",
                        display: "inline-flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        position: "relative",
                    }}
                >
                    <this._ElementMacros></this._ElementMacros>
                    <this._ElementFieldNames></this._ElementFieldNames>
                    <this._ElementMultipleChannels></this._ElementMultipleChannels>
                    <ElementRectangleButton
                        handleClick={() => {
                            // macros do not need to update

                            if (this._updateChannelNames !== undefined) {
                                this._updateChannelNames();
                            }
                            if (this._updateFieldNames !== undefined) {
                                this._updateFieldNames();
                            }
                            // this.getMainWidget().setExpanedBaseChannelNames();
                            // this.getMainWidget().expandAndExtractChannelNames();
                            const mainWidget = this.getMainWidget();
                            mainWidget.processChannelNames()

                            g_widgets1.connectAllTcaChannels(true);

                            mainWidget.showSettings = false;
                            g_widgets1.addToForceUpdateWidgets(mainWidget.getWidgetKey());
                            g_flushWidgets();
                        }}
                    >
                        OK
                    </ElementRectangleButton>
                </div>
            </div>
        );
    };

    _updateChannelNames: (() => void) | undefined = undefined;

    getElement = () => {
        return <this._Element></this._Element>;
    };

    _ElementMultipleChannels = () => {
        const [channelNamesStr, setChannelNamesStr] = React.useState(`${this.getMainWidget().getChannelNamesLevel5()}`.replaceAll(",", "\n"));

        const updateChannelNames = () => {
            const oldBaseChannelNames = this.getMainWidget().getChannelNamesLevel5();

            const channelNames = channelNamesStr.split(/[,|\t|\n|\s]+/);
            for (let oldChannelName of oldBaseChannelNames) {
                if (!channelNames.includes(oldChannelName)) {
                    g_widgets1.removeTcaChannel(oldChannelName, this.getMainWidget().getWidgetKey());
                }
            }
            this.getMainWidget().getChannelNamesLevel5().length = 0;
            for (let channelName of channelNames) {
                if (channelName.trim() !== "") {
                    this.getMainWidget().getChannelNamesLevel5().push(channelName.trim());
                }
            }
        };

        this._updateChannelNames = updateChannelNames;

        return (
            <div
                style={{
                    width: "80%",
                    // height: "80%",
                    marginTop: "20px",
                }}
            >
                <div style={{ width: "100%" }}>
                    <h2>Channels</h2>
                    <p> Put one or more channel names in box below. Channel names can be separated by comma, space, or new line.</p>
                </div>

                <form
                    spellCheck={false}
                    style={{
                        width: "100%",
                        // height: "100%",
                        // marginTop: "20px",
                    }}
                >
                    <textarea
                        style={{
                            width: "95%",
                            // height: "100%",
                            height: 200,
                            padding: "5px",
                            margin: "0px",
                            resize: "none",
                            fontSize: this.getMainWidget().getStyle()["fontSize"],
                        }}
                        onChange={(event: any) => {
                            event.preventDefault();
                            setChannelNamesStr(event.target.value);
                        }}
                        value={channelNamesStr}
                    ></textarea>
                </form>
            </div>
        );
    };

    _updateFieldNames: any = undefined;

    _ElementFieldNames = () => {
        const [fieldNamesStr, setFieldNamessStr] = React.useState(`${this.getMainWidget().getFieldlNames()}`.replaceAll(",", "\n"));

        const updateFieldNames = () => {
            const oldFieldNames = this.getMainWidget().getFieldlNames();

            const fieldNames = fieldNamesStr.split(/[,|\t|\n|\s]+/);
            // for (let oldFieldName of oldFieldNames) {
            // 	if (!fieldNames.includes(oldFieldName)) {
            // 		g_widgets1.removeTcaChannel(oldChannelName, this.getMainWidget().getWidgetKey());
            // 	}
            // }
            this.getMainWidget().getFieldlNames().length = 0;
            for (let fieldName of fieldNames) {
                if (fieldName.trim() !== "") {
                    this.getMainWidget().getFieldlNames().push(fieldName);
                }
            }
        };

        this._updateFieldNames = updateFieldNames;

        return (
            <div
                style={{
                    width: "80%",
                    // height: "80%",
                    marginTop: "20px",
                }}
            >
                <div style={{ width: "100%" }}>
                    <h2>Fields</h2>
                    <p> Put one or more fields in box below. They can be separated by comma, space, or new line.</p>
                </div>

                <form
                    spellCheck={false}
                    style={{
                        width: "100%",
                        // height: "100%",
                        // marginTop: "20px",
                    }}
                >
                    <textarea
                        style={{
                            width: "95%",
                            // height: "100%",
                            height: 200,
                            padding: "5px",
                            margin: "0px",
                            resize: "none",
                            fontSize: this.getMainWidget().getStyle()["fontSize"],
                        }}
                        onChange={(event: any) => {
                            event.preventDefault();
                            setFieldNamessStr(event.target.value);
                        }}
                        value={fieldNamesStr}
                    ></textarea>
                </form>
            </div>
        );
    };

    _ElementMacros = () => {
        const macrosRaw = this.getMainWidget().getMacros();

        const [, forceUpdate] = React.useState({});

        const elementAddRef = React.useRef<any>(null);

        return (
            <div
                style={{
                    position: "relative",
                    width: "80%",
                    display: "inline-flex",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    alignItems: "center",
                }}
            >
                <div style={{ width: "100%" }}>
                    <h2>Macros</h2>
                </div>
                <table
                    style={{
                        marginTop: 20,
                        padding: 0,
                        borderSpacing: 0,
                        width: "100%",
                        height: "80%",
                    }}
                >
                    <tbody>
                        <tr
                            style={{
                                backgroundColor: "rgba(230,230,230,1)",
                                height: 20,
                            }}
                        >
                            <td style={{ width: "40%" }}>Name</td>
                            <td
                                style={{
                                    borderLeft: "1px solid #dddddd",
                                    width: "50%",
                                    fontWeight: "bold",
                                }}
                            >
                                <b>Value</b>
                            </td>
                            <td
                                style={{
                                    width: "10%",
                                }}
                            >
                                <div
                                    onClick={() => {
                                        const newMacroIndex = macrosRaw.length;
                                        macrosRaw.push([`name-${newMacroIndex}`, "newValue"]);
                                        // g_widgets1.updateSidebar(true);
                                        forceUpdate({});
                                    }}
                                >
                                    <img
                                        ref={elementAddRef}
                                        src={`../../../webpack/resources/webpages/add-symbol.svg`}
                                        style={{
                                            width: this.getMainWidget().getStyle()["fontSize"],
                                            opacity: 0.25,
                                        }}
                                        onMouseOver={() => {
                                            if (elementAddRef.current !== null) {
                                                elementAddRef.current.style["cursor"] = "pointer";
                                                elementAddRef.current.style["opacity"] = 1;
                                            }
                                        }}
                                        onMouseLeave={() => {
                                            if (elementAddRef.current !== null) {
                                                elementAddRef.current.style["opacity"] = 0.25;
                                            }
                                        }}
                                    ></img>
                                </div>
                            </td>
                        </tr>
                        {macrosRaw.map((item: [string, string], index: number) => {
                            return <this._ElementMacro macroIndex={index} key={`${item}-${index}`}></this._ElementMacro>;
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    _ElementMacro = ({ macroIndex }: any) => {
        const macroRaw = this.getMainWidget().getMacros()[macroIndex];

        const [name, setName] = React.useState(macroRaw[0]);
        const [value, setValue] = React.useState(macroRaw[1]);

        const elementNameRef = React.useRef<any>(null);
        const elementValueRef = React.useRef<any>(null);
        const elementDeleteRef = React.useRef<any>(null);

        return (
            <tr
                style={{
                    backgroundColor: macroIndex % 2 === 0 ? "white" : "rgba(230,230,230,1)",
                    height: 20,
                }}
            >
                <td
                    style={{
                        width: "40%",
                    }}
                >
                    <form
                        onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                            event.preventDefault();
                            macroRaw[0] = name;

                            // const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
                            // history.registerAction();

                            // g_widgets1.addToForceUpdateWidgets(this.getMainWidget().getWidgetKey());
                            // g_widgets1.addToForceUpdateWidgets("GroupSelection2");

                            // g_flushWidgets();
                        }}
                    // style={{ ...this._macroFormStyle }}
                    >
                        <input
                            ref={elementNameRef}
                            style={{
                                backgroundColor: "rgba(0,0,0,0)",
                                padding: 0,
                                border: "none",
                                outline: "none",
                                fontSize: this.getMainWidget().getStyle()["fontSize"],
                            }}
                            type="text"
                            value={name}
                            placeholder={"name"}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                event.preventDefault();
                                setName(event.target.value);
                            }}
                            onBlur={(event: any) => {
                                event.preventDefault();
                                if (elementNameRef.current !== null) {
                                    elementNameRef.current.style["color"] = "black";
                                }

                                if (macroRaw[0] !== name) {
                                    setName(macroRaw[0]);
                                }
                            }}
                            onMouseOver={(event: any) => {
                                event.preventDefault();
                                if (elementNameRef.current !== null) {
                                    elementNameRef.current.style["cursor"] = "pointer";
                                    elementNameRef.current.style["color"] = "red";
                                }
                            }}
                            onMouseLeave={(event: any) => {
                                event.preventDefault();
                                if (elementNameRef.current !== null) {
                                    const isFocused = document.activeElement === elementNameRef.current;
                                    if (isFocused === false) {
                                        elementNameRef.current.style["cursor"] = "default";
                                        elementNameRef.current.style["color"] = "black";
                                    }
                                }
                            }}
                        />
                    </form>
                </td>
                <td
                    style={{
                        borderLeft: "1px solid #dddddd",
                        width: "50%",
                    }}
                >
                    <form
                        onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                            event.preventDefault();
                            macroRaw[1] = value;

                            // const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
                            // history.registerAction();

                            // g_widgets1.addToForceUpdateWidgets(this.getMainWidget().getWidgetKey());
                            // g_widgets1.addToForceUpdateWidgets("GroupSelection2");

                            // g_flushWidgets();
                        }}
                    // style={{ ...this._macroFormStyle, paddingLeft: 3 }}
                    >
                        <input
                            ref={elementValueRef}
                            style={{
                                backgroundColor: "rgba(0,0,0,0)",
                                padding: 0,
                                border: "none",
                                outline: "none",
                                fontSize: this.getMainWidget().getStyle()["fontSize"],
                            }}
                            type="text"
                            value={value}
                            placeholder={"value"}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                event.preventDefault();
                                setValue(event.target.value);
                            }}
                            onBlur={(event: any) => {
                                event.preventDefault();
                                if (elementValueRef.current !== null) {
                                    elementValueRef.current.style["color"] = "black";
                                }
                                if (macroRaw[1] !== value) {
                                    setValue(macroRaw[1]);
                                }
                            }}
                            onMouseOver={(event: any) => {
                                event.preventDefault();
                                if (elementValueRef.current !== null) {
                                    elementValueRef.current.style["cursor"] = "pointer";
                                    elementValueRef.current.style["color"] = "red";
                                }
                            }}
                            onMouseLeave={(event: any) => {
                                event.preventDefault();
                                if (elementValueRef.current !== null) {
                                    const isFocused = document.activeElement === elementValueRef.current;
                                    if (isFocused === false) {
                                        elementValueRef.current.style["cursor"] = "default";
                                        elementValueRef.current.style["color"] = "black";
                                    }
                                }
                            }}
                        />
                    </form>
                </td>
                <td
                    style={{
                        width: "10%",
                    }}
                >
                    <div
                        onClick={() => {
                            // const macrosRaw = this.getTdl()["externalMacros"];
                            const macrosRaw = this.getMainWidget().getMacros();
                            macrosRaw.splice(macroIndex, 1);
                            g_widgets1.updateSidebar(true);
                        }}
                    >
                        <img
                            ref={elementDeleteRef}
                            src={`../../../webpack/resources/webpages/delete-symbol.svg`}
                            style={{
                                width: this.getMainWidget().getStyle()["fontSize"],
                                opacity: 0.25,
                            }}
                            onMouseOver={() => {
                                if (elementDeleteRef.current !== null) {
                                    elementDeleteRef.current.style["cursor"] = "pointer";
                                    elementDeleteRef.current.style["opacity"] = 1;
                                }
                            }}
                            onMouseLeave={() => {
                                if (elementDeleteRef.current !== null) {
                                    elementDeleteRef.current.style["opacity"] = 0.25;
                                }
                            }}
                        ></img>
                    </div>
                </td>
            </tr>
        );
    };
}
