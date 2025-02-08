import { DataViewer } from "./DataViewer";
import * as React from "react";
import { GlobalVariables, g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { CollapsibleWithoutTitle } from "../../helperWidgets/ColorPicker/Collapsible";
import { DataViewerSidebar } from "./DataViewerSidebar";
import {Log} from "../../../mainProcess/log/Log";
import * as GlobalMethods from "../../global/GlobalMethods";
import { ElementRectangleButton } from "../../helperWidgets/SharedElements/RectangleButton";

export class DataViewerSettings {
    _mainWidget: DataViewer;
    constructor(mainWidget: DataViewer) {
        this._mainWidget = mainWidget;
    }

    getMainWidget = () => {
        return this._mainWidget;
    };

    getElement = () => {
        return <this._Element></this._Element>;
    };

    getSidebar = () => {
        return this.getMainWidget().getSidebar();
    };

    updatePlot = (useNewestTime: boolean = false, doFlush: boolean = true) => {
        this.getMainWidget().updatePlot(useNewestTime, doFlush);
    };

    getChannelNames = () => {
        return this.getMainWidget().getChannelNames();
    };

    getPlot = () => {
        return this.getMainWidget().getPlot();
    };


    _ElementSettingLine = ({ children }: any) => {
        const elementRef = React.useRef<any>(null);
        return (
            <div
                ref={elementRef}
                style={{
                    width: "100%",
                    display: "inline-flex",
                    flexDirection: "row",
                    justifyContent: 'flex-start',
                    alignItems: "center",
                }}
            // onMouseEnter={() => {
            //     if (elementRef.current !== null) {
            //         elementRef.current.style["backgroundColor"] = "rgba(230, 230, 230, 1)";
            //     }
            // }}
            // onMouseLeave={() => {
            //     if (elementRef.current !== null) {
            //         elementRef.current.style["backgroundColor"] = "rgba(230, 230, 230, 0)";
            //     }
            // }}
            >
                {children}
            </div>
        )
    }

    _ElementSettingCell = ({ children, width, additionalStyle }: any) => {
        return (<div
            style={{
                width: width,
                display: "inline-flex",
                flexDirection: "row",
                justifyContent: 'flex-start',
                alignItems: "center",
                height: "100%",
                ...additionalStyle
            }}
        >
            {children}
        </div>)
    }

    _ElementSettingsSectionHead = ({ children }: any) => {
        return (
            <div style={{
                // backgroundColor: "rgba(235, 235, 235, 1)",
                width: "100%",
                display: "inline-flex",
                justifyContent: "flex-start",
                alignItems: "center",
                boxSizing: "border-box",
                paddingTop: 10,
                paddingBottom: 10,
                position: "relative",
            }}>
                {children}
            </div>
        )
    }


    _ElementSettingsChannelsHeader = ({ children }: any) => {
        return (
            <div style={{
                // backgroundColor: "rgba(210, 210, 210, 1)",
                width: "100%",
                display: "inline-flex",
                justifyContent: "flex-start",
                alignItems: "center",
                boxSizing: "border-box",
                paddingTop: 5,
                paddingBottom: 5,
                position: "relative",
            }}>
                {children}
            </div>
        )
    }

    _styleInput = {
        width: "55%",
        border: "solid 1px rgba(0,0,0,0)",
        outline: "none",
        borderRadius: 0,
        backgroundColor: "rgba(255, 255, 255, 0)",
        // padding: 0,
        // margin: 0,
    };

    _ElementBackgroundColor = () => {
        const [showCollapsible, setShowCollapsible] = React.useState<boolean>(false);
        const elementRefBackgroundColor = React.useRef<any>(null);
        return (
            <this._ElementSettingLine>
                <this._ElementSettingCell width={"30%"} additionalStyle={{
                    alignItems: "flex-start",
                }}>
                    Background:
                </this._ElementSettingCell>
                <this._ElementSettingCell width={"70%"}>
                    <div
                        style={{
                            position: "relative",
                            width: "100%",
                            justifyContent: "flex-start",
                            alignItems: "flex-start",
                            display: "inline-flex",
                            flexDirection: "column",
                        }}
                    >
                        <div
                            ref={elementRefBackgroundColor}
                            style={{
                                height: 12,
                                aspectRatio: "1/1",
                                borderRadius: 2,
                                border: "solid 1px rgba(200, 200, 200, 1)",
                                backgroundColor: this.getMainWidget().getStyle()["backgroundColor"],
                                position: "relative",
                            }}
                            onMouseDown={() => {
                                setShowCollapsible(!showCollapsible);
                            }}
                            onMouseEnter={() => {
                                if (elementRefBackgroundColor.current !== null) {
                                    elementRefBackgroundColor.current.style["cursor"] = "pointer";
                                }
                            }}
                            onMouseLeave={() => {
                                if (elementRefBackgroundColor.current !== null) {
                                    elementRefBackgroundColor.current.style["cursor"] = "default";
                                }
                            }}
                        ></div>

                        {showCollapsible === true ? (
                            <div
                                style={{
                                    position: "relative",
                                    width: "200px",
                                }}
                            >
                                <CollapsibleWithoutTitle
                                    rgbColorStr={this.getMainWidget().getStyle()["backgroundColor"]}
                                    updateFromSidebar={(event: any, propertyName: string, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
                                        this.updateBackgroundColor(event, propertyValue);
                                    }}

                                    title={" "}
                                    eventName={`background-color`}
                                />
                            </div>
                        ) : null}

                        {/* {this.getSidebar()?.getSidebarBackgroundColor().getElement(true)} */}
                    </div>
                </this._ElementSettingCell>
            </this._ElementSettingLine>

        )
    }


    updateBackgroundColor = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        // no event

        const newVal = GlobalMethods.rgbaArrayToRgbaStr(propertyValue as number[]);
        const oldVal = this.getMainWidget().getStyle()["backgroundColor"];
        if (newVal === oldVal) {
            return;
        } else {
            this.getMainWidget().getStyle()["backgroundColor"] = newVal;
        }

        // the history is handled inside Collapsible

        g_widgets1.addToForceUpdateWidgets(this.getMainWidget().getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };

    _ElementPeriod = () => {
        const elementRefInput = React.useRef<any>(null);
        const [period, setPeriod] = React.useState(`${this.getMainWidget().getAllText()["updatePeriod"]}`);

        return (
            <this._ElementSettingLine>
                <this._ElementSettingCell width={"30%"}>
                    Update period [s]:
                </this._ElementSettingCell>
                <this._ElementSettingCell width={"70%"}>
                    <form
                        // style={this.getFormStyle()}
                        onSubmit={(event: any) => {
                            event.preventDefault();
                            let periodNum = parseFloat(period);
                            const orig = this.getMainWidget().getAllText()["updatePeriod"];
                            if (!isNaN(periodNum)) {
                                periodNum = Math.min(Math.max(periodNum, 0.1), 3600);
                                setPeriod(`${periodNum}`);
                                this.getMainWidget().getText()["updatePeriod"] = periodNum;
                                this.updatePlot();
                                this.getMainWidget().restartUpdateInterval();
                            } else {
                                setPeriod(`${orig}`);
                            }
                        }}
                    >
                        <this._ElementInput
                            value={period}
                            onChange={(event: any) => {
                                event.preventDefault();
                                setPeriod(event.target.value);
                            }}
                            onBlur={(event: any) => {
                                const orig = this.getMainWidget().getAllText()["updatePeriod"];
                                if (`${orig}` !== period) {
                                    setPeriod(`${orig}`);
                                }
                            }}

                        ></this._ElementInput>
                    </form>
                </this._ElementSettingCell>
            </this._ElementSettingLine>
        )
    }

    _ElementFontFamily = () => {
        return (
            <this._ElementSettingLine>
                <this._ElementSettingCell width={"30%"}>
                    Font family:
                </this._ElementSettingCell>
                <this._ElementSettingCell width={"200px"}>
                    {/* hide text */}
                    {this.getSidebar()?.getSidebarFontFamily().getElement(true)}

                </this._ElementSettingCell>
            </this._ElementSettingLine>
        )
    }
    _ElementFontSize = () => {
        return (
            <this._ElementSettingLine>
                <this._ElementSettingCell width={"30%"}>
                    Font size:
                </this._ElementSettingCell>
                <this._ElementSettingCell width={"200px"}>
                    {/* hide text */}
                    {this.getSidebar()?.getSidebarFontSize().getElement(true)}

                </this._ElementSettingCell>
            </this._ElementSettingLine>
        )
    }

    _ElementFontStyle = () => {
        return (
            <this._ElementSettingLine>
                <this._ElementSettingCell width={"30%"}>
                    Font style:
                </this._ElementSettingCell>
                <this._ElementSettingCell width={"200px"}>
                    {this.getSidebar()?.getSidebarFontStyle().getElement(true)}
                </this._ElementSettingCell>
            </this._ElementSettingLine>
        )
    }

    _ElementFontWeight = () => {
        return (
            <this._ElementSettingLine>
                <this._ElementSettingCell width={"30%"}>
                    Font weight:
                </this._ElementSettingCell>
                <this._ElementSettingCell width={"200px"}>
                    {this.getSidebar()?.getSidebarFontWeight().getElement(true)}

                </this._ElementSettingCell>
            </this._ElementSettingLine>
        )
    }

    _ElementSettingsOKButton = () => {
        const elementOKRef = React.useRef<any>(null);
        return (
            <div style={{
                display: "inline-flex",
                width: "100%",
                justifyContent: "center",
                alignItems: "center",
            }}>
                <ElementRectangleButton
                    marginTop={10}
                    marginBottom={10}
                    handleClick={() => {
                        this.getMainWidget().showSettingsPage = false;
                        this.updatePlot();
                    }}
                >
                    OK
                </ElementRectangleButton>
            </div>
        )
    }

    _ElementTraceControl = ({ index }: any) => {
        return (
            <div style={{
                width: "100%",
                height: "100%",
                display: "inline-flex",
                justifyContent: "flex-sart",
                alignItems: "center",
                flexDirection: "row",
                position: "absolute",
                marginBottom: 25,
                marginTop: 20,
            }}>
                <this._ElementSmallButton
                    onMouseDown={(event: any) => {
                        (this.getMainWidget().getSidebar() as DataViewerSidebar)
                            .getSidebarDataViewerChannelNames()
                            .updateWidgetMoveUpTrace(event, index);
                    }}
                >
                    &#8593;
                </this._ElementSmallButton>
                <this._ElementSmallButton
                    onMouseDown={(event: any) => {
                        (this.getMainWidget().getSidebar() as DataViewerSidebar)
                            .getSidebarDataViewerChannelNames()
                            .updateWidgetMoveDownTrace(event, index);
                    }}
                >
                    &#8595;
                </this._ElementSmallButton>
                <this._ElementSmallButton
                    onMouseDown={(event: any) => {
                        this.getPlot().removeTrace(index, true);
                    }}
                >
                    <img
                        style={{
                            width: 12,
                            height: 12,
                        }}
                        src={`../../../webpack/resources/webpages/delete-symbol.svg`}
                    ></img>
                </this._ElementSmallButton>
            </div>
        )
    }

    _ElementChannelSection = ({ index }: any) => {
        const yAxis = this.getPlot().yAxes[index];
        const elementRefLineColor = React.useRef<any>(null);
        const channelName = this.getChannelNames()[index];
        const [yAxisValMin, setYAxisValMin] = React.useState<string>(yAxis.valMin.toString());
        const [yAxisValMax, setYAxisValMax] = React.useState<string>(yAxis.valMax.toString());
        const [channelNameInput, setChannelNameInput] = React.useState(channelName);

        React.useEffect(() => {
            setYAxisValMin(yAxis.valMin.toString());
        }, [yAxis.valMin]);

        React.useEffect(() => {
            setYAxisValMax(yAxis.valMax.toString());
        }, [yAxis.valMax]);

        const [showTrace, setShowTrace] = React.useState<boolean>(yAxis["show"]);
        const [showCollapsible, setShowCollapsible] = React.useState<boolean>(false);
        const [lineWidth, setLineWidth] = React.useState<string>(`${yAxis["lineWidth"]}`);
        const [bufferSize, setBufferSize] = React.useState<string>(`${yAxis["bufferSize"]}`);

        return (
            <>
                <this._ElementSettingsSectionHead>
                    {/* <div
                        style={{
                            display: "inline-flex",
                            flexDirection: "row",
                            width: "100%",
                            height: "100%",
                            fontFamily: "inherit",
                            fontStyle: "inherit",
                            fontSize: "inherit",
                            fontWeight: "inherit",
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        {channelName.trim() === "" ? <>&nbsp;</> : channelName}
                    </div> */}
                    {/* move up, move down, remove the trace */}
                    <this._ElementTraceControl index={index}></this._ElementTraceControl>
                </this._ElementSettingsSectionHead>
                {/* ----------------------------- */}
                <this._ElementSettingLine>
                    <this._ElementSettingCell width={"30%"}>
                        Channel name:
                    </this._ElementSettingCell>
                    <this._ElementSettingCell width={"70%"}>
                        <form
                            style={{
                                width: "100%",
                            }}
                            // style={this.getFormStyle()}
                            onSubmit={(event: any) => {
                                event.preventDefault();
                                this.getPlot().removeTrace(index, false);
                                this.getPlot().insertTrace(index, channelNameInput, true);
                                // connect channel
                                this.updatePlot();
                                // update plot, do not wait the periodic update
                                setTimeout(() => {
                                    this.updatePlot();
                                }, 500);
                            }}
                        >
                            <this._ElementInput
                                value={channelNameInput}
                                onChange={
                                    (event: any) => {
                                        setChannelNameInput(event.target.value);
                                    }
                                }
                                onBlur={(event: any) => {
                                    const orig = channelName;
                                    if (orig !== channelNameInput) {
                                        setChannelNameInput(orig);
                                    }
                                }}
                            ></this._ElementInput>
                        </form>
                    </this._ElementSettingCell>
                </this._ElementSettingLine>
                {/* ----------------------------- */}
                <this._ElementSettingLine>
                    <this._ElementSettingCell width={"30%"}>
                        Min Y:
                    </this._ElementSettingCell>
                    <this._ElementSettingCell width={"70%"}>
                        <form
                            onSubmit={(event: any) => {
                                event.preventDefault();
                                const yAxisValMinNum = parseFloat(yAxisValMin);
                                const orig = yAxis.valMin;
                                if (!isNaN(yAxisValMinNum)) {
                                    yAxis.valMin = yAxisValMinNum;
                                    setYAxisValMin(`${yAxisValMinNum}`);
                                    this.updatePlot();
                                } else {
                                    setYAxisValMin(orig.toString());
                                }
                            }}
                        >
                            <this._ElementInput
                                value={yAxisValMin}
                                onChange={(event: any) => {
                                    event.preventDefault();
                                    setYAxisValMin(event.target.value);
                                }}
                                onBlur={(event: any) => {
                                    const orig = yAxis.valMin;
                                    if (orig !== parseFloat(yAxisValMin)) {
                                        setYAxisValMin(orig.toString());
                                    }
                                }}
                            ></this._ElementInput>
                        </form>
                    </this._ElementSettingCell>
                </this._ElementSettingLine>
                {/* ----------------------------- */}
                <this._ElementSettingLine>
                    <this._ElementSettingCell width={"30%"}>
                        Max Y:
                    </this._ElementSettingCell>
                    <this._ElementSettingCell width={"70%"}>
                        <form
                            onSubmit={(event: any) => {
                                event.preventDefault();
                                const yAxisValMaxNum = parseFloat(yAxisValMax);
                                const orig = yAxis.valMax;
                                if (!isNaN(yAxisValMaxNum)) {
                                    yAxis.valMax = yAxisValMaxNum;
                                    setYAxisValMax(`${yAxisValMaxNum}`);
                                    this.updatePlot();
                                } else {
                                    setYAxisValMax(orig.toString());
                                }
                            }}
                        >
                            <this._ElementInput
                                value={yAxisValMax}
                                onChange={(event: any) => {
                                    event.preventDefault();
                                    setYAxisValMax(event.target.value);
                                }}
                                onBlur={(event: any) => {
                                    const orig = yAxis.valMax;
                                    if (orig !== parseFloat(yAxisValMax)) {
                                        setYAxisValMax(orig.toString());
                                    }
                                }}
                            ></this._ElementInput>
                        </form>
                    </this._ElementSettingCell>
                </this._ElementSettingLine>
                {/* ----------------------------- */}
                <this._ElementSettingLine>
                    <this._ElementSettingCell width={"30%"}>
                        Line width:
                    </this._ElementSettingCell>
                    <this._ElementSettingCell width={"70%"}>
                        <form
                            onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                                event.preventDefault();
                                const lineWidthInt = parseInt(lineWidth);
                                const orig = yAxis["lineWidth"];
                                if (!isNaN(lineWidthInt)) {
                                    setLineWidth(`${lineWidthInt}`);
                                    (this.getMainWidget().getSidebar() as DataViewerSidebar)
                                        .getSidebarDataViewerChannelNames()
                                        .updateWidgetLineWidth(event, index, lineWidthInt);
                                } else {
                                    setLineWidth(`${orig}`);
                                }
                            }}
                        >
                            <this._ElementInput
                                value={lineWidth}
                                onChange={(event: any) => {
                                    setLineWidth(event.target.value);
                                }}
                                onBlur={(event: any) => {
                                    const orig = yAxis["lineWidth"];
                                    if (`${orig}` !== lineWidth) {
                                        setLineWidth(`${orig}`);
                                    }
                                }}
                            ></this._ElementInput>
                        </form>
                    </this._ElementSettingCell>
                </this._ElementSettingLine>
                {/* ----------------------------- */}
                <this._ElementSettingLine>
                    <this._ElementSettingCell width={"30%"} additionalStyle={{
                        alignItems: "flex-start",
                    }}>
                        Line color:
                    </this._ElementSettingCell>
                    <this._ElementSettingCell width={"70%"} additionalStyle={{
                        flexDirection: "column",
                        justifyContent: "flex-start",
                        alignItems: "flex-start",
                    }}>
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
                                        // this.updateFromSidebar
                                        (this.getMainWidget().getSidebar() as DataViewerSidebar).getSidebarDataViewerChannelNames().updateWidgetLineColor
                                    }
                                    title={" "}
                                    eventName={`line-color-${index}`}
                                />
                            </div>
                        ) : null}
                    </this._ElementSettingCell>
                </this._ElementSettingLine>
                {/* ----------------------------- */}
                <this._ElementSettingLine>
                    <this._ElementSettingCell width={"30%"}>
                        Buffer size:
                    </this._ElementSettingCell>
                    <this._ElementSettingCell width={"70%"}>
                        <form
                            onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                                event.preventDefault();
                                const bufferSizeInt = parseInt(bufferSize);
                                const orig = yAxis["bufferSize"];
                                if (!isNaN(bufferSizeInt)) {
                                    setBufferSize(`${bufferSizeInt}`);
                                    this.updateWidgetBufferSize(event, index, bufferSizeInt);
                                } else {
                                    setBufferSize(`${orig}`);
                                }
                            }}
                        >
                            <this._ElementInput
                                value={bufferSize}
                                onChange={(event: any) => {
                                    setBufferSize(event.target.value);
                                }}
                                onBlur={(event: any) => {
                                    const orig = yAxis["bufferSize"];
                                    if (`${orig}` !== bufferSize) {
                                        setBufferSize(`${orig}`);
                                    }
                                }}
                            ></this._ElementInput>
                        </form>
                    </this._ElementSettingCell>
                </this._ElementSettingLine>
                {/* ------------------------------- */}
                <this._ElementSettingLine>
                    <this._ElementSettingCell width={"30%"}>
                        Scale:
                    </this._ElementSettingCell>
                    <this._ElementSettingCell width={"70%"}>
                        <form
                            onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                                event.preventDefault();
                            }}
                        >
                            <select
                                style={{ width: "140px" }}
                                onChange={(event: any) => {
                                    this.updateScale(event, index);
                                }}
                            >
                                <option selected>{"Linear"}</option>
                                <option selected={this.getMainWidget().getPlot().yAxes[index]["displayScale"] === "Log10"}>{"Log10"}</option>
                            </select>

                        </form>
                    </this._ElementSettingCell>
                </this._ElementSettingLine>
                {/* ----------------------------- */}
                <this._ElementSettingLine>
                    <this._ElementSettingCell width={"30%"}>
                        Show trace:
                    </this._ElementSettingCell>
                    <this._ElementSettingCell width={"70%"}>
                        <form
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "flex-start",
                                width: "100%",
                                height: "100%",
                                padding: "0px",
                                margin: "0px",
                            }}
                        >
                            <input
                                style={{
                                    margin: 0,
                                    // height: "100%",
                                    // same as color indicator, hard coded 15px
                                    height: "12px",
                                    aspectRatio: "1/1",
                                }}
                                type="checkbox"
                                checked={showTrace}
                                onChange={(event: any) => {
                                    (this.getMainWidget().getSidebar() as DataViewerSidebar)
                                        .getSidebarDataViewerChannelNames()
                                        .updateWidgetShowTrace(event, index, !showTrace);

                                    // this.updateFromSidebar(event, `show-trace-${index}`, !showTrace);
                                    setShowTrace((prevVal: boolean) => {
                                        return !showTrace;
                                    });
                                }}
                            />
                        </form>
                    </this._ElementSettingCell>
                </this._ElementSettingLine>
                {/* ---------- horizontal line ------------------- */}
                <div style={{
                    width: "100%",
                    minHeight: 1,
                    maxHeight: 1,
                    backgroundColor: "rgba(200,200,200,1)",
                    marginTop: 10,
                    marginBottom: 10,
                }}></div>
            </>
        )
    }

    _Element = () => {
        return (
            <div
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: "100%",
                    height: "100%",
                    backgroundColor: "white",
                    overflowY: "scroll",
                    padding: 15,
                    display: "inline-flex",
                    justifyContent: "flex-start",
                    alignItems: "flex-start",
                    boxSizing: "border-box",
                    flexDirection: "column",
                    border: "solid 1px rgba(0,0,0,1)",
                    // always use default fonts
                    fontFamily: GlobalVariables.defaultFontFamily,
                    fontSize: GlobalVariables.defaultFontSize,
                    fontStyle: GlobalVariables.defaultFontStyle,
                    fontWeight: GlobalVariables.defaultFontWeight,
                }}
            >
                <div style={{
                    width: "100%",
                    minHeight: 3,
                    maxHeight: 3,
                    marginTop: 10,
                    backgroundColor: "rgba(180,180,180,1)",
                }}></div>
                <this._ElementSettingsChannelsHeader><h3>Appearance</h3></this._ElementSettingsChannelsHeader>
                <this._ElementBackgroundColor></this._ElementBackgroundColor>

                <this._ElementPeriod></this._ElementPeriod>
                <this._ElementFontFamily></this._ElementFontFamily>
                <this._ElementFontSize></this._ElementFontSize>
                <this._ElementFontStyle></this._ElementFontStyle>
                <this._ElementFontWeight></this._ElementFontWeight>
                {/* ---------------------- channel table ------------------- */}
                <div style={{
                    width: "100%",
                    minHeight: 3,
                    maxHeight: 3,
                    marginTop: 20,
                    backgroundColor: "rgba(180,180,180,1)",
                }}></div>

                <this._ElementSettingsChannelsHeader><h3>Channels</h3></this._ElementSettingsChannelsHeader>
                <div style={{
                    width: "100%",
                    minHeight: 1,
                    maxHeight: 1,
                    backgroundColor: "rgba(200,200,200,1)",
                    marginTop: 0,
                    marginBottom: 10,
                }}></div>
                {this.getChannelNames().map((channelName: string, index: number) => {
                    return <this._ElementChannelSection key={`setting-line-${channelName}-${index}`} index={index} />;
                })}
                <this._ElementAddTrace></this._ElementAddTrace>
                <this._ElementSettingsOKButton></this._ElementSettingsOKButton>
            </div>
        );
    };

    _ElementAddTrace = () => {
        return (
            <div style={{
                width: "100%",
                display: "inline-flex",
                justifyContent: "flex-start",
                alignItems: "center",
                boxSizing: "border-box",
                marginTop: 10,
            }}>
                <this._ElementSmallButton
                    onMouseDown={(event: any) => {
                        this.getPlot().insertTrace(this.getChannelNames().length, "");
                    }}
                >
                    <img
                        style={{
                            width: 12,
                            height: 12,
                        }}
                        src={`../../../webpack/resources/webpages/add-symbol.svg`}
                    ></img>
                </this._ElementSmallButton>
            </div>
        )

    }


    _ElementSmallButton = ({ children, onMouseDown }: any) => {
        const elementRef = React.useRef<any>(null);
        return <div
            ref={elementRef}
            style={{
                aspectRatio: "1/1",
                borderRadius: 2,
                display: "inline-flex",
                alignItems: "center",
                opacity: 0.2,
                justifyContent: "center",
                userSelect: "none",
            }}
            onMouseDown={(event: any) => {
                onMouseDown(event);
            }}
            onMouseEnter={(event: any) => {
                if (elementRef.current !== null) {
                    elementRef.current.style["cursor"] = "pointer";
                    elementRef.current.style["opacity"] = 0.5;
                }
            }}
            onMouseLeave={(event: any) => {
                if (elementRef.current !== null) {
                    elementRef.current.style["cursor"] = "default";
                    elementRef.current.style["opacity"] = 0.2;
                }
            }}
        >
            {children}
        </div>
    }


    _ElementInput = ({ children, value, onChange, onBlur, onFocus }: any) => {
        const elementRef = React.useRef<any>(null);
        return (
            <input
                ref={elementRef}
                style={{
                    backgroundColor: 'rgba(0, 0, 0, 0)',
                    width: "100%",
                    height: "100%",
                    padding: 0,
                    margin: 0,
                    /* explicit inherits */
                    fontSize: "inherit",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    boxSizing: "border-box",
                    border: "solid 1px rgba(0,0,0,0)",
                    borderRadius: 0,
                    outline: "none",
                }}
                value={value}
                type={"text"}
                onChange={(event: any) => {
                    event.preventDefault();
                    if (onChange !== undefined) {
                        onChange(event);
                    }
                }}
                onBlur={(event: any) => {
                    event.preventDefault();
                    if (onBlur !== undefined) {
                        onBlur(event);
                    }
                    if (elementRef.current !== null) {
                        elementRef.current.style["border"] = "solid 1px rgba(0,0,0,0)";
                        elementRef.current.style["backgroundColor"] = "rgba(255,255,255,0)";
                    }
                }}
                onFocus={(event: any) => {
                    event.preventDefault();
                    if (onFocus !== undefined) {
                        onFocus(event);
                    }
                    if (elementRef.current !== null) {
                        elementRef.current.style["border"] = "solid 1px rgba(0,0,0,1)";
                        elementRef.current.style["backgroundColor"] = "rgba(255,255,255,1)";
                    }
                }}
                onMouseEnter={() => {
                    if (elementRef.current !== null) {
                        elementRef.current.style["border"] = "solid 1px rgba(0,0,0,1)";
                        elementRef.current.style["backgroundColor"] = "rgba(255,255,255,1)";
                    }
                }}
                onMouseLeave={() => {
                    if (elementRef.current !== null && document.activeElement !== elementRef.current) {
                        elementRef.current.style["border"] = "solid 1px rgba(0,0,0,0)";
                        elementRef.current.style["backgroundColor"] = "rgba(255,255,255,0)";
                    }
                }}
            >
                {children}
            </input>
        )
    }


    updateScale = (event: any, index: number) => {
        event.preventDefault();

        const mainWidget = this.getMainWidget() as DataViewer;
        const yAxis = mainWidget.getYAxes()[index];
        if (yAxis === undefined) {
            return;
        }
        yAxis["displayScale"] = event.target.value;

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(this.getMainWidget().getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();

    }

    //todo: finish it
    updateWidgetBufferSize = (event: any, index: number, size: number) => {
        event.preventDefault();

        const mainWidget = this.getMainWidget();
        // mainWidget.getPlot().moveDownTrace(index);

        // const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        // history.registerAction();

        // g_widgets1.addToForceUpdateWidgets(this.getMainWidget().getWidgetKey());
        // g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        // g_flushWidgets();
    };
}
