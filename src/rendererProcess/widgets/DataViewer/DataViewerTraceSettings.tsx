import * as React from "react";
import { ElementRectangleButton } from "../Talhk/client/RectangleButton";
import { DataViewer } from "./DataViewer";
import {settingsIndexChoices} from "./DataViewerPlot"
import { Log } from "../../../common/Log";
import * as GlobalMethods from "../../../common/GlobalMethods";
import { DataViewerPlot } from "./DataViewerPlot";
import { type_DataViewer_yAxis } from "../../../common/types/type_widget_tdl";
import { CollapsibleWithoutTitle } from "../../helperWidgets/ColorPicker/Collapsible";
import { g_widgets1 } from "../../global/GlobalVariables";
import { GlobalVariables } from "../../../common/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";

export class DataViewerTraceSettings {
    _plot: DataViewerPlot;
    constructor(mainWidget: DataViewer) {
        this._plot = mainWidget.getPlot();
    }

    _Element = () => {
        const index = this.getPlot().getMainWidget().getSettingsIndex();
        const yAxis = this.getPlot().getSelectedYAxis();

        if (yAxis === undefined) {
            return null;
        }

        if (index === settingsIndexChoices.NONE || index === settingsIndexChoices.MAIN) {
            return null;
        }

        const channelName = this.getChannelNames()[index];

        if (channelName === undefined) {
            return null;
        }



        return (
            <div
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: "100%",
                    height: "100%",
                    backgroundColor: "white",
                    overflowY: "auto",
                    padding: 15,
                    display: "inline-flex",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    boxSizing: "border-box",
                    flexDirection: "column",
                    border: "solid 1px rgba(0,0,0,1)",
                    fontSize: GlobalVariables.defaultFontSize,
                    fontFamily: GlobalVariables.defaultFontFamily,
                    fontStyle: GlobalVariables.defaultFontStyle,
                    fontWeight: GlobalVariables.defaultFontWeight,
                }}
            >
                <div
                    style={{
                        display: "inline-flex",
                        flexDirection: "column",
                        justifyContent: "flex-start",
                        alignItems: "flex-start",
                        width: "90%",
                        boxSizing: "border-box",
                        borderRadius: 10,
                        backgroundColor: "rgba(230, 230, 230, 1)",
                        padding: 10,
                        marginBottom: 10,
                    }}
                >
                    <this._ElementChannelNameInput></this._ElementChannelNameInput>
                    <this._ElementNumVal
                        axisData={yAxis}
                        fieldName={"valMin"}
                    ></this._ElementNumVal>
                    <this._ElementNumVal
                        axisData={yAxis}
                        fieldName={"valMax"}
                    ></this._ElementNumVal>
                    <this._ElementNumVal
                        axisData={yAxis}
                        fieldName={"lineWidth"}
                    ></this._ElementNumVal>
                    <this._ElementNumVal
                        axisData={yAxis}
                        fieldName={"bufferSize"}
                    ></this._ElementNumVal>
                    <this._ElementBoolVal
                        axisData={yAxis}
                        fieldName={"show"}
                    ></this._ElementBoolVal>
                    <this._ElementYScale></this._ElementYScale>
                    <this._ElementLineColor></this._ElementLineColor>
                </div>

                <div
                    style={{
                        display: "inline-flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        width: "90%",
                    }}>
                    <this._ElementRemoveTraceButton></this._ElementRemoveTraceButton>
                    <this._ElementOKButton></this._ElementOKButton>
                    <this._ElementFakeButton></this._ElementFakeButton>
                </div>
            </div>
        );
    };

    _ElementChannelNameInput = () => {
        const index = this.getPlot().getMainWidget().getSettingsIndex();
        const elementRefChannelNameInput = React.useRef<HTMLInputElement>(null);
        const channelName = this.getChannelNames()[index];
        const [channelNameInput, setChannelNameInput] = React.useState(channelName);
        // console.log("channel name Input", channelNameInput, "-->", channelName)
        // channel name hint
        const formElementRef = React.useRef<HTMLFormElement>(null);

        const [showChannelNameHint, setShowChannelNameHint] = React.useState(false);
        const ChannelNameHintElement = g_widgets1.getRoot().getDisplayWindowClient().getChannelNameHint()._Element;
        const [channelNameHintElementDimension, setChannelNameHintElementDimension] = React.useState({ width: 0, maxHeight: 0, left: 0, top: 0 });
        const [channelNameHintData, setChannelNameHintData] = React.useState<string[]>([]);

        const selectHint = (channelName: string) => {
            setChannelNameInput(channelName);
            setShowChannelNameHint(false)

            this.getPlot().renameTrace(index, channelName, true)
            setTimeout(() => {
                this.getPlot().updatePlot();
            }, 500);
        }

        return (
            <form
                ref={formElementRef}
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    fontSize: 25,
                    marginTop: 20,
                    marginBottom: 15,
                }}
                onSubmit={(event) => {
                    event.preventDefault();
                    setShowChannelNameHint(false);
                    this.getPlot().renameTrace(index, channelNameInput, true)
                    setTimeout(() => {
                        this.getPlot().updatePlot();
                    }, 5000);
                }}
            >
                <input
                    ref={elementRefChannelNameInput}
                    style={{
                        fontSize: 25,
                        width: "70%",
                        outline: "none",
                        border: "none",
                        borderRadius: 0,
                        padding: 5,
                        boxSizing: "border-box",
                    }}
                    spellCheck={false}
                    value={channelNameInput}
                    onChange={
                        (event: React.ChangeEvent<HTMLInputElement>) => {
                            const newVal = event.target.value;
                            setChannelNameInput(newVal);

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
                    }
                    onBlur={(event) => {
                        setShowChannelNameHint(false);
                        setChannelNameHintData([]);

                        if (elementRefChannelNameInput.current !== null) {
                            elementRefChannelNameInput.current.style["color"] = "rgba(0,0,0,1)";
                        }
                        const orig = channelName;
                        if (orig !== channelNameInput) {
                            setChannelNameInput(orig);
                        }
                    }}
                    placeholder="Channel Name"
                    onFocus={(event) => {
                        if (elementRefChannelNameInput.current !== null) {
                            elementRefChannelNameInput.current.style["color"] = "rgba(255,0,0,1)";
                        }
                    }}
                    onMouseEnter={(event) => {
                        if (elementRefChannelNameInput.current !== null) {
                            elementRefChannelNameInput.current.style["color"] = "rgba(255,0,0,1)";
                        }
                    }}
                    onMouseLeave={(event) => {
                        if (document.activeElement !== elementRefChannelNameInput.current &&
                            elementRefChannelNameInput.current !== null) {
                            elementRefChannelNameInput.current.style["color"] = "rgba(0,0,0,1)";
                        }
                    }}
                ></input>
                
                <ChannelNameHintElement
                    show={showChannelNameHint}
                    additionalStyle={channelNameHintElementDimension}
                    channelNames={channelNameHintData}
                    selectHint={selectHint}
                ></ChannelNameHintElement>

            </form>

        )
    }

    /**
     * one numeric value
     */
    _ElementNumVal = ({ axisData, fieldName }: { axisData: type_DataViewer_yAxis, fieldName: keyof (type_DataViewer_yAxis) }) => {
        // always string
        const [value, setValue] = React.useState(`${axisData[fieldName]}`);

        return (
            <div
                style={{
                    width: "80%",
                    boxSizing: "border-box",
                    display: "inline-flex",
                    flexDirection: "row",
                    padding: 5,
                }}
            >
                <div
                    style={{
                        width: "30%",
                    }}
                >
                    {fieldName}
                </div>
                <form
                    style={{
                        display: "inline-flex",
                        flexGrow: 1,
                    }}
                    spellCheck={false}
                    onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                        event.preventDefault();
                        const orig = axisData[fieldName];
                        const valueNum = parseFloat(value);
                        if (!isNaN(valueNum) && typeof axisData[fieldName] === "number") {
                            (axisData as unknown as Record<string, number>)[fieldName] = valueNum;

                            g_widgets1.addToForceUpdateWidgets(this.getPlot().getMainWidget().getWidgetKey());
                            g_widgets1.addToForceUpdateWidgets("GroupSelection2");
                            g_flushWidgets();
                        } else {
                            setValue(`${orig}`);
                        }
                    }}
                >
                    <input
                        style={{
                            outline: "none",
                            border: "none",
                            borderRadius: 0,
                            width: "50%",
                        }}
                        value={value}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                            const newVal = event.target.value;
                            setValue(newVal);
                        }}
                        onBlur={(event) => {
                            const orig = `${axisData[fieldName]}`;
                            if (orig !== value) {
                                setValue(orig);
                            }
                        }}
                    ></input>
                </form>
            </div>


        );
    };

    _ElementLineColor = () => {
        const [showCollapsible, setShowCollapsible] = React.useState(false);
        const elementRefLineColor = React.useRef<HTMLDivElement>(null);
        const index = this.getPlot().getMainWidget().getSettingsIndex();
        const yAxis = this.getPlot().getSelectedYAxis();

        if (yAxis === undefined) {
            return null;
        }

        return (
            <div
                style={{
                    width: "80%",
                    boxSizing: "border-box",
                    display: "inline-flex",
                    flexDirection: "row",
                    padding: 5,
                    alignItems: "center",
                }}
            >
                <div
                    style={{
                        width: "30%",
                    }}
                >
                    {"Line color"}
                </div>

                <div
                    ref={elementRefLineColor}
                    style={{
                        height: 12,
                        aspectRatio: "1/1",
                        borderRadius: 2,
                        border: "solid 1px rgba(200, 200, 200, 1)",
                        backgroundColor: yAxis["lineColor"],
                        position: "relative",
                    }}
                    onMouseDown={() => {
                        setShowCollapsible(!showCollapsible);
                    }}
                    onMouseEnter={() => {
                        if (elementRefLineColor.current !== null) {
                            elementRefLineColor.current.style["cursor"] = "pointer";
                        }
                    }}
                    onMouseLeave={() => {
                        if (elementRefLineColor.current !== null) {
                            elementRefLineColor.current.style["cursor"] = "default";
                        }
                    }}
                ></div>
                {showCollapsible === true ? (
                    <div
                        style={{
                            zIndex: 10000,
                            position: "relative",
                            width: "200px",
                            // height: "100px",
                        }}
                    >
                        <CollapsibleWithoutTitle
                            rgbColorStr={yAxis["lineColor"]}
                            updateFromSidebar={
                                // (this.getSidebar() as DataViewerSidebar).getSidebarDataViewerChannelNames().updateWidgetLineColor
                                (event: React.SyntheticEvent | undefined, propertyName: string, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
                                    if (event) {
                                        event.preventDefault();
                                    }

                                    const mainWidget = this.getPlot().getMainWidget() as DataViewer;

                                    const newVal = GlobalMethods.rgbaArrayToRgbaStr(propertyValue as number[]);
                                    const indexStr = propertyName.split("-")[2];
                                    if (indexStr !== undefined) {
                                        const index = parseInt(indexStr);
                                        const yAxis = mainWidget.getYAxes()[index];
                                        if (yAxis !== undefined) {
                                            yAxis["lineColor"] = newVal;
                                        }
                                    } else {
                                        Log.error("error");
                                        return;
                                    }
                                    // do not update plot, the OK button will do.
                                }
                            }
                            title={" "}
                            eventName={`line-color-${index}`}
                        />
                    </div>
                ) : null}
            </div>
        )
    }

    /**
     * one boolean value
     */
    _ElementBoolVal = ({ axisData, fieldName }: { axisData: type_DataViewer_yAxis, fieldName: keyof (type_DataViewer_yAxis) }) => {
        // boolean
        const [value, setValue] = React.useState<boolean>(axisData[fieldName] as boolean);

        return (
            <div
                style={{
                    width: "80%",
                    boxSizing: "border-box",
                    display: "inline-flex",
                    flexDirection: "row",
                    padding: 5,
                }}
            >
                <div
                    style={{
                        width: "30%",
                    }}
                >
                    {fieldName}
                </div>

                <form
                    style={{
                        display: "inline-flex",
                        flexGrow: 1,
                    }}
                    onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                        event.preventDefault();
                    }}
                >
                    <input
                        type="checkbox"
                        style={{
                            outline: "none",
                            border: "none",
                            borderRadius: 0,
                            margin: 0,
                        }}

                        checked={value}
                        onChange={(event) => {
                            (axisData[fieldName] as boolean) = !value;

                            g_widgets1.addToForceUpdateWidgets(this.getPlot().getMainWidget().getWidgetKey());
                            g_widgets1.addToForceUpdateWidgets("GroupSelection2");

                            g_flushWidgets();
                            setValue((prevVal: boolean) => {
                                return !prevVal;
                            });
                        }}
                    />
                </form>
            </div>


        );
    };

    _ElementYScale = () => {
        const index = this.getPlot().getMainWidget().getSettingsIndex();
        const yAxis = this.getPlot().getSelectedYAxis();

        if (yAxis === undefined) {
            return null;
        }

        return (
            <div
                style={{
                    width: "80%",
                    boxSizing: "border-box",
                    display: "inline-flex",
                    flexDirection: "row",
                    padding: 5,
                    border: "none",
                }}
            >
                <div
                    style={{
                        width: "30%",
                    }}
                >
                    {"Scale"}
                </div>

                <form
                    onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                        event.preventDefault();
                    }}
                >
                    <select
                        style={{
                            width: "140px",
                            padding: 0,
                            outline: "none",
                            borderRadius: 0,
                            border: "none",
                            fontSize: GlobalVariables.defaultFontSize,
                            fontFamily: GlobalVariables.defaultFontFamily,
                            fontStyle: GlobalVariables.defaultFontStyle,
                            fontWeight: GlobalVariables.defaultFontWeight,
                        }}
                        onChange={(event) => {
                            this.getPlot().updateTraceScale(index, event.target.value as "Linear" | "Log10");
                        }}
                    >
                        <option selected>{"Linear"}</option>
                        <option selected={this.getPlot().yAxes[index]["displayScale"] === "Log10"}>{"Log10"}</option>
                    </select>

                </form>
            </div>
        )
    }

    _ElementRemoveTraceButton = () => {
        const index = this.getPlot().getMainWidget().getSettingsIndex();
        return (
            <ElementRectangleButton
                defaultBackgroundColor={"rgba(255,0,0,1)"}
                highlightBackgroundColor={"rgba(255,0,0,0.8)"}
                marginTop={10}
                marginBottom={10}

                handleClick={() => {
                    this.getPlot().removeTrace(index);
                }}
            >
                Remove
            </ElementRectangleButton>

        )
    }

    _ElementOKButton = () => {
        return (
            <ElementRectangleButton
                marginTop={10}
                marginBottom={10}
                handleClick={() => {
                    this.getPlot().getMainWidget().setSettingsIndex(settingsIndexChoices.NONE);
                    this.getPlot().updatePlot();
                }}
            >
                OK
            </ElementRectangleButton>
        )
    }

    _ElementFakeButton = () => {
        return (
            <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
        )
    }

    getPlot = () => {
        return this._plot;
    }

    getChannelNames = () => {
        return this.getPlot().getMainWidget().getChannelNames();
    }


    getElement = () => {
        return <this._Element></this._Element>
    }

}