import * as React from "react";
import { DataViewerPlot, settingsIndexChoices } from "./DataViewerPlot";
import { type_DataViewer_yAxis } from "../../../common/types/type_widget_tdl";
import { DataViewer } from "./DataViewer";
import { GlobalVariables } from "../../../common/GlobalVariables";
import { g_widgets1 } from "../../global/GlobalVariables";
import { ElementRectangleButton } from "../../helperWidgets/SharedElements/RectangleButton";
import { SidebarNumberInput } from "../../helperWidgets/SidebarComponents/SidebarNumberInput";
import { SidebarCheckBox } from "../../helperWidgets/SidebarComponents/SidebarCheckBox";
import { SidebarStringChoices } from "../../helperWidgets/SidebarComponents/SidebarStringChoices";
import { SidebarColor } from "../../helperWidgets/SidebarComponents/SidebarColor";

export class DataViewerTraceSetting {
    private readonly _mainWidget: DataViewer;
    private readonly _index: number;
    constructor(mainWidget: DataViewer, index: number = 0) {
        this._mainWidget = mainWidget;
        this._index = index;
    }

    getElement = () => {
        const yAxis = this.getMainWidget().getPlot().yAxes[this.getMainWidget().getSettingsIndex()];
        if (yAxis === undefined) {
            return null;
        } else {
            return <this._Element yAxis={yAxis}></this._Element>
        }
    }

    _Element = React.memo(({ yAxis }: { yAxis: type_DataViewer_yAxis }) => this._ElementRaw({ yAxis }));
    _ElementRaw = ({ yAxis }: { yAxis: type_DataViewer_yAxis }) => {

        const sidebar = this.getMainWidget().getSidebar();
        if (sidebar === undefined) {
            return null;
        }

        const extraStyle = {
            backgroundColor: "rgba(255,255,255,1)",
        }
        const valMinComponent = new SidebarNumberInput(sidebar, yAxis, "valMin", "Min", false, extraStyle);
        const valMaxComponent = new SidebarNumberInput(sidebar, yAxis, "valMax", "Max", false, extraStyle);
        const lineWidthComponent = new SidebarNumberInput(sidebar, yAxis, "lineWidth", "Line width", false, extraStyle);
        const bufferSizeComponent = new SidebarNumberInput(sidebar, yAxis, "bufferSize", "Buffer size", false, extraStyle);
        const showComponent = new SidebarCheckBox(sidebar, yAxis, "show", "Show");
        const yScaleComponent = new SidebarStringChoices(sidebar, yAxis, "displayScale", "Y scale", {
            Linear: "Linear",
            Log10: "Log10",
        }, extraStyle);
        const lineColorComponent = new SidebarColor(sidebar, yAxis, "lineColor", "Line color");

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
                    {Math.random()}
                    {valMinComponent.getElement()}
                    {valMaxComponent.getElement()}
                    {lineWidthComponent.getElement()}
                    {lineColorComponent.getElement()}
                    {bufferSizeComponent.getElement()}
                    {showComponent.getElement()}
                    {yScaleComponent.getElement()}
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
        )
    };

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


    _ElementChannelNameInput = () => {
        const index = this.getPlot().getMainWidget().getSettingsIndex();
        const elementRefChannelNameInput = React.useRef<HTMLInputElement>(null);
        const channelName = this.getChannelNames()[index];
        const [channelNameInput, setChannelNameInput] = React.useState(channelName);

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
                        const orig = this.getChannelNames()[index];
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

    getMainWidget = () => {
        return this._mainWidget;
    }

    getPlot = () => {
        return this.getMainWidget().getPlot();
    }

    getChannelNames = () => {
        return this.getPlot().getMainWidget().getChannelNames();
    }

    getIndex = () => {
        return this._index;
    }
}