import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { SidebarXYPlotYAxes } from "./SidebarXYPlotYAxes";
import { XYPlot } from "../../widgets/XYPlot/XYPlot";
import { Collapsible } from "../ColorPicker/Collapsible";
import * as GlobalMethods from "../../global/GlobalMethods";

/**
 * Represents the channel names component in sidebar. <br>
 *
 * It is different from the SidebarChannelName. This one accepts multiple PV names, separated by commas.
 *
 * It provides: (1) the JSX element, (2) the method to udpate the widget from sidebar, and (3) the method to
 * update this sidebar component from widget.
 */
export class SidebarXYPlotYAxis {
    yIndex: number;
    yAxes: SidebarXYPlotYAxes;
    hideContents: boolean = false;
    ElementInputLabel: any;

    constructor(sidebarXYPlotYAxes: SidebarXYPlotYAxes, yIndex: number) {
        this.yAxes = sidebarXYPlotYAxes;
        this.yIndex = yIndex;
        this.ElementInputLabel = this.yAxes._ElementInputLabel
    }

    getMainWidget = () => {
        return this.yAxes.getMainWidget() as XYPlot;
    };

    getPlot = () => {
        return this.getMainWidget().getPlot();
    };
    getPlotYAxes = () => {
        return this.getPlot().yAxes;
    };

    _Element = () => {
        return (
            <div
                style={{
                    width: "100%",
                    display: "inline-flex",
                    flexDirection: "column",
                    marginTop: 5,
                }}
            >
                <this._ElementTitle></this._ElementTitle>
                {this.hideContents ? null : <>
                    <this._ElementLabel></this._ElementLabel>
                    <this._ElementXChannelName></this._ElementXChannelName>
                    <this._ElementYChannelName></this._ElementYChannelName>
                    <this._ElementYValMin></this._ElementYValMin>
                    <this._ElementYValMax></this._ElementYValMax>
                    <this._ElementAutoScale></this._ElementAutoScale>
                    <this._ElementScale></this._ElementScale>
                    <this._ElementShowGrid></this._ElementShowGrid>
                    <this._ElementNumGrids></this._ElementNumGrids>
                    <this._ElementLineWidth></this._ElementLineWidth>
                    <this._ElementLineColor></this._ElementLineColor>
                    <this._ElementLineStyle></this._ElementLineStyle>
                    <this._ElementPointType></this._ElementPointType>
                    <this._ElementPointSize></this._ElementPointSize>
                </>
                }
            </div>
        );
    };

    _ElementTitle = () => {
        return (
            <div
                style={{
                    ...(this._styleForm as any),
                    width: "100%",
                    backgroundColor: "rgba(200, 200, 200, 1)",
                }}
            >
                <div>
                    <b>{`Trace #${this.yIndex}`}</b>
                </div>
                <div style={{
                    display: "inline-flex",
                    flexDirection: "row",
                }}>
                    <this._ElementRemoveYAxis></this._ElementRemoveYAxis>
                    <this._ElementHideContents></this._ElementHideContents>
                </div>
            </div>
        );
    };


    _ElementHideContents = () => {
        const elementRef = React.useRef<any>(null);
        const [hideContents, setHideContents] = React.useState(false);
        return (
            <div
                style={{
                    opacity: 0.25,
                    marginRight: 5,
                }}
                ref={elementRef}
                onMouseEnter={() => {
                    if (elementRef.current !== null) {
                        elementRef.current.style["cursor"] = "pointer";
                        elementRef.current.style["opacity"] = 1;
                    }
                }}
                onMouseLeave={() => {
                    if (elementRef.current !== null) {
                        elementRef.current.style["cursor"] = "default";
                        elementRef.current.style["opacity"] = 0.25;
                    }
                }}
                onClick={(event: React.MouseEvent) => {

                    this.hideContents = !hideContents;
                    setHideContents(!hideContents);
                    // update widget
                    g_widgets1.addToForceUpdateWidgets(this.getMainWidget().getWidgetKey());
                    g_widgets1.addToForceUpdateWidgets("GroupSelection2");

                    g_flushWidgets();
                }}
            >
                {hideContents ?
                    <img src={`../../../webpack/resources/webpages/arrowDown-thin.svg`} width="12px"></img>
                    :
                    <img src={`../../../webpack/resources/webpages/arrowUp-thin.svg`} width="12px"></img>
                }
            </div>
        );
    };
    _ElementRemoveYAxis = () => {
        const elementRef = React.useRef<any>(null);
        return (
            <div
                style={{
                    opacity: 0.25,
                    marginRight: 8,
                }}
                ref={elementRef}
                onMouseEnter={() => {
                    if (elementRef.current !== null) {
                        elementRef.current.style["cursor"] = "pointer";
                        elementRef.current.style["opacity"] = 1;
                    }
                }}
                onMouseLeave={() => {
                    if (elementRef.current !== null) {
                        elementRef.current.style["cursor"] = "default";
                        elementRef.current.style["opacity"] = 0.25;
                    }
                }}
                onClick={(event: React.MouseEvent) => {
                    const index0 = this.yIndex * 2;
                    const index1 = this.yIndex * 2 + 1;
                    // remove channel name pair
                    this.getMainWidget().getChannelNamesLevel0().splice(index0, 2);
                    // remove yaxis in main widget
                    this.getPlotYAxes().splice(index0, 1);
                    // update xy data
                    (this.getMainWidget() as XYPlot).getPlot().initXY();
                    // remove axis in SidebarXYPlotYAxes
                    this.yAxes.yAxes.splice(this.yIndex, 1);
                    // update SidebarXYPlotYAxis yIndex
                    for (let ii = this.yIndex; ii < this.yAxes.yAxes.length; ii++) {
                        const yAxis = this.yAxes.yAxes[ii];
                        yAxis.yIndex = ii;
                    }
                    // add to history
                    const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
                    history.registerAction();
                    // update widget
                    g_widgets1.addToForceUpdateWidgets(this.getMainWidget().getWidgetKey());
                    g_widgets1.addToForceUpdateWidgets("GroupSelection2");

                    g_flushWidgets();
                }}
            >
                <img src={`../../../webpack/resources/webpages/delete-symbol.svg`} width="12px"></img>
            </div>
        );
    };

    _ElementAutoScale = () => {
        const [autoScale, setAutoScale] = React.useState<boolean>(this.getPlotYAxes()[this.yIndex]["autoScale"]);

        return (
            <form
                onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.updateWidgetAutoScale(event, autoScale)}
                style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                }}
            >
                <div>Auto scale:</div>
                <input
                    type="checkbox"
                    checked={autoScale}
                    onChange={(event: any) => {
                        this.updateWidgetAutoScale(event, !autoScale);
                        setAutoScale((prevVal: boolean) => {
                            return !prevVal;
                        });
                    }}
                />
            </form>
        );
    };

    updateWidgetAutoScale = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        // do not preventDefault()

        const oldVal = this.getPlotYAxes()[this.yIndex]["autoScale"];
        if (propertyValue === oldVal) {
            return;
        } else {
            if (typeof propertyValue === "boolean") {
                this.getPlotYAxes()[this.yIndex]["autoScale"] = propertyValue;
            }
        }

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(this.getMainWidget().getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };


    _ElementScale = () => {
        return (
            <form
                onSubmit={(event: React.FormEvent<HTMLFormElement>) => event.preventDefault()}
                style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                }}
            >
                <div>Scale:</div>
                <select
                    style={{ fontFamily: "inherit", width: "60%" }}
                    onChange={(event: any) => {
                        this.updateScale(event, this.yIndex);
                    }}
                >
                    <option selected>{"Linear"}</option>
                    <option selected={this.getMainWidget().getPlot().yAxes[this.yIndex]["displayScale"] === "Log10"}>{"Log10"}</option>
                </select>

            </form>
        );
    };

    updateScale = (event: any, index: number) => {
        event.preventDefault();

        const mainWidget = this.getMainWidget() as XYPlot;
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


    _ElementShowGrid = () => {
        const [showGrid, setShowGrid] = React.useState<boolean>(this.getPlotYAxes()[this.yIndex]["showGrid"]);

        return (
            <form
                onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.updateWidgetShowGrid(event, showGrid)}
                style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                }}
            >
                <div>Show grid:</div>
                <input
                    type="checkbox"
                    checked={showGrid}
                    onChange={(event: any) => {
                        this.updateWidgetShowGrid(event, !showGrid);
                        setShowGrid((prevVal: boolean) => {
                            return !prevVal;
                        });
                    }}
                />
            </form>
        );
    };

    updateWidgetShowGrid = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        // do not preventDefault()

        const oldVal = this.getPlotYAxes()[this.yIndex]["showGrid"];
        if (propertyValue === oldVal) {
            return;
        } else {
            if (typeof propertyValue === "boolean") {
                this.getPlotYAxes()[this.yIndex]["showGrid"] = propertyValue;
            }
        }

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(this.getMainWidget().getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };

    _styleInput = {
        width: "55%",
    };

    _styleForm = {
        display: "inline-flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        marginTop: 2,
        marginBottom: 2,
    };

    _ElementXChannelName = () => {
        const [channelName, setChannelName] = React.useState(this.getMainWidget().getChannelNamesLevel0()[this.yIndex * 2]);
        return (
            <form
                spellCheck={false}
                onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.updateWidgetXChannelName(event, channelName)}
                style={{ ...(this._styleForm as any) }}
            >
                <this.ElementInputLabel
                    value={channelName}
                    setValue={setChannelName}
                    readableText={"X Axis channel name"}
                    updater={(newValue: string) => { this.updateWidgetXChannelName(undefined, newValue) }}
                >
                    X Channel
                </this.ElementInputLabel>
                <input
                    style={{ ...this._styleInput }}
                    type="text"
                    name="channelName"
                    value={channelName}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        const newVal = event.target.value;
                        setChannelName(newVal);
                    }}
                    // must use enter to change the value
                    onBlur={(event: any) => {
                        const orig = this.getMainWidget().getChannelNamesLevel0()[this.yIndex * 2];
                        if (orig !== channelName) {
                            setChannelName(orig);
                        }
                    }}
                />
            </form>
        );
    };

    _ElementLabel = () => {
        const [label, setLabel] = React.useState(this.getPlotYAxes()[this.yIndex]["label"]);
        return (
            <form
                spellCheck={false}
                onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.updateWidgetLabel(event, label)}
                style={{ ...(this._styleForm as any) }}
            >
                <this.ElementInputLabel
                    value={label}
                    setValue={setLabel}
                    readableText={"Y Axis label"}
                    updater={(newValue: string) => { this.updateWidgetLabel(undefined, newValue) }}
                >
                    Label:
                </this.ElementInputLabel>
                <input
                    style={{ ...this._styleInput }}
                    type="text"
                    name="label"
                    value={label}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        const newVal = event.target.value;
                        setLabel(newVal);
                    }}
                    // must use enter to change the value
                    onBlur={(event: any) => {
                        const orig = this.getPlotYAxes()[this.yIndex]["label"];
                        if (orig !== label) {
                            setLabel(orig);
                        }
                    }}
                />
            </form>
        );
    };

    updateWidgetLabel = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        event?.preventDefault();

        this.getPlotYAxes()[this.yIndex]["label"] = `${propertyValue}`;
        // ! shall we do it?
        // mainWidget.setExpanedBaseChannelNames();
        // mainWidget.expandAndExtractChannelNames();

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(this.getMainWidget().getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };

    _ElementYChannelName = () => {
        const [channelName, setChannelName] = React.useState(this.getMainWidget().getChannelNamesLevel0()[this.yIndex * 2 + 1]);
        return (
            <form
                spellCheck={false}
                onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.updateWidgetYChannelName(event, channelName)}
                style={{ ...(this._styleForm as any) }}
            >
                <this.ElementInputLabel
                    value={channelName}
                    setValue={setChannelName}
                    readableText={"Y Axis channel name"}
                    updater={(newValue: string) => { this.updateWidgetYChannelName(undefined, newValue) }}
                >
                    Y Channel:
                </this.ElementInputLabel>
                <input
                    style={{ ...this._styleInput }}
                    type="text"
                    name="channelName"
                    value={channelName}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        const newVal = event.target.value;
                        setChannelName(newVal);
                    }}
                    // must use enter to change the value
                    onBlur={(event: any) => {
                        const orig = this.getMainWidget().getChannelNamesLevel0()[this.yIndex * 2 + 1];
                        if (orig !== channelName) {
                            setChannelName(orig);
                        }
                    }}
                />
            </form>
        );
    };

    _ElementLineWidth = () => {
        // always string
        const [lineWidth, setLineWidth] = React.useState(`${this.getPlotYAxes()[this.yIndex]["lineWidth"]}`);
        return (
            <form
                spellCheck={false}
                onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.updateWidgetLineWidth(event, lineWidth)}
                style={{ ...(this._styleForm as any) }}
            >
                <div>Line width:</div>
                <input
                    style={{ ...this._styleInput }}
                    type="text"
                    name="lineWidth"
                    value={lineWidth}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        const newVal = event.target.value;
                        setLineWidth(newVal);
                    }}
                    // must use enter to change the value
                    onBlur={(event: any) => {
                        const orig = `${this.getPlotYAxes()[this.yIndex]["lineWidth"]}`;
                        if (orig !== lineWidth) {
                            setLineWidth(orig);
                        }
                    }}
                />
            </form>
        );
    };

    updateWidgetLineWidth = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        event.preventDefault();
        const mainWidget = this.getMainWidget();

        // const index = this.yIndex * 2;

        // mainWidget.getChannelNamesLevel0()[index] = `${propertyValue}`;
        const oldValue = `${this.getPlotYAxes()[this.yIndex]["lineWidth"]}`;
        if (oldValue === propertyValue) {
            return;
        }

        if (typeof propertyValue === "string") {
            this.getPlotYAxes()[this.yIndex]["lineWidth"] = parseFloat(propertyValue);
        }

        // ! shall we do it?
        // mainWidget.setExpanedBaseChannelNames();
        // mainWidget.expandAndExtractChannelNames();

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(this.getMainWidget().getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };

    _ElementYValMin = () => {
        // always string
        const [valMin, setValMin] = React.useState(`${this.getPlotYAxes()[this.yIndex]["valMin"]}`);
        return (
            <form
                spellCheck={false}
                onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.updateWidgetYValMin(event, valMin)}
                style={{ ...(this._styleForm as any) }}
            >
                <div>Y min</div>
                <input
                    style={{ ...this._styleInput }}
                    type="text"
                    name="valMin"
                    value={valMin}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        const newVal = event.target.value;
                        setValMin(newVal);
                    }}
                    // must use enter to change the value
                    onBlur={(event: any) => {
                        const orig = `${this.getPlotYAxes()[this.yIndex]["valMin"]}`;
                        if (orig !== valMin) {
                            setValMin(orig);
                        }
                    }}
                />
            </form>
        );
    };

    _ElementYValMax = () => {
        // always string
        const [valMax, setValMax] = React.useState(`${this.getPlotYAxes()[this.yIndex]["valMax"]}`);
        return (
            <form
                spellCheck={false}
                onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.updateWidgetYValMax(event, valMax)}
                style={{ ...(this._styleForm as any) }}
            >
                <div>Y max:</div>
                <input
                    style={{ ...this._styleInput }}
                    type="text"
                    name="valMax"
                    value={valMax}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        const newVal = event.target.value;
                        setValMax(newVal);
                    }}
                    // must use enter to change the value
                    onBlur={(event: any) => {
                        const orig = `${this.getPlotYAxes()[this.yIndex]["valMax"]}`;
                        if (orig !== valMax) {
                            setValMax(orig);
                        }
                    }}
                />
            </form>
        );
    };

    updateWidgetYValMin = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        event.preventDefault();
        const mainWidget = this.getMainWidget();

        // const index = this.yIndex * 2;

        // mainWidget.getChannelNamesLevel0()[index] = `${propertyValue}`;
        const oldValue = `${this.getPlotYAxes()[this.yIndex]["valMin"]}`;
        if (oldValue === propertyValue) {
            return;
        }

        if (typeof propertyValue === "string") {
            this.getPlotYAxes()[this.yIndex]["valMin"] = parseFloat(propertyValue);
        }

        // ! shall we do it?
        // mainWidget.setExpanedBaseChannelNames();
        // mainWidget.expandAndExtractChannelNames();

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(this.getMainWidget().getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };

    updateWidgetYValMax = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        event.preventDefault();
        const mainWidget = this.getMainWidget();

        // const index = this.yIndex * 2;

        // mainWidget.getChannelNamesLevel0()[index] = `${propertyValue}`;
        const oldValue = `${this.getPlotYAxes()[this.yIndex]["valMax"]}`;
        if (oldValue === propertyValue) {
            return;
        }

        if (typeof propertyValue === "string") {
            this.getPlotYAxes()[this.yIndex]["valMax"] = parseFloat(propertyValue);
        }

        // ! shall we do it?
        // mainWidget.setExpanedBaseChannelNames();
        // mainWidget.expandAndExtractChannelNames();

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(this.getMainWidget().getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };

    _ElementLineColor = () => {
        return (
            <Collapsible
                rgbColorStr={this.getPlotYAxes()[this.yIndex]["lineColor"]}
                updateFromSidebar={(event: any, propertyName: string, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
                    this.updateWidgetLineColor(event, propertyValue);
                }}
                title={"Line color"}
                eventName={"text-color"}
            />
        );
    };

    updateWidgetLineColor = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        // no event

        const newVal = GlobalMethods.rgbaArrayToRgbaStr(propertyValue as number[]);
        const oldVal = this.getPlotYAxes()[this.yIndex]["lineColor"];
        if (newVal === oldVal) {
            return;
        } else {
            this.getPlotYAxes()[this.yIndex]["lineColor"] = newVal;
        }

        // the history is handled inside Collapsible

        g_widgets1.addToForceUpdateWidgets(this.getMainWidget().getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };

    updateWidgetXChannelName = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        event?.preventDefault();
        const mainWidget = this.getMainWidget();

        const index = this.yIndex * 2;
        mainWidget.getChannelNamesLevel0()[index] = `${propertyValue}`;
        // ! shall we do it?
        // mainWidget.setExpanedBaseChannelNames();
        // mainWidget.expandAndExtractChannelNames();

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(this.getMainWidget().getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };

    updateWidgetYChannelName = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        event?.preventDefault();
        const mainWidget = this.getMainWidget();

        const index = this.yIndex * 2 + 1;
        mainWidget.getChannelNamesLevel0()[index] = `${propertyValue}`;
        // ! shall we do it?
        // mainWidget.setExpanedBaseChannelNames();
        // mainWidget.expandAndExtractChannelNames();

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(this.getMainWidget().getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };

    _ElementPointSize = () => {
        // always string
        const [pointSize, setPointSize] = React.useState(`${this.getPlotYAxes()[this.yIndex]["pointSize"]}`);
        return (
            <form
                spellCheck={false}
                onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.updateWidgetPointSize(event, pointSize)}
                style={{ ...(this._styleForm as any) }}
            >
                <div>Point size</div>
                <input
                    style={{ ...this._styleInput }}
                    type="text"
                    name="pointSize"
                    value={pointSize}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        const newVal = event.target.value;
                        setPointSize(newVal);
                    }}
                    // must use enter to change the value
                    onBlur={(event: any) => {
                        const orig = `${this.getPlotYAxes()[this.yIndex]["pointSize"]}`;
                        if (orig !== pointSize) {
                            setPointSize(orig);
                        }
                    }}
                />
            </form>
        );
    };


    updateWidgetPointSize = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        event.preventDefault();
        const mainWidget = this.getMainWidget();

        // const index = this.yIndex * 2;

        // mainWidget.getChannelNamesLevel0()[index] = `${propertyValue}`;
        const oldValue = `${this.getPlotYAxes()[this.yIndex]["pointSize"]}`;
        if (oldValue === propertyValue) {
            return;
        }

        if (typeof propertyValue === "string") {
            this.getPlotYAxes()[this.yIndex]["pointSize"] = parseFloat(propertyValue);
        }

        // ! shall we do it?
        // mainWidget.setExpanedBaseChannelNames();
        // mainWidget.expandAndExtractChannelNames();

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(this.getMainWidget().getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };


    _ElementNumGrids = () => {
        // always string
        const [numGrids, setNumGrids] = React.useState(`${this.getPlotYAxes()[this.yIndex]["numGrids"]}`);
        return (
            <form
                spellCheck={false}
                onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.updateWidgetNumGrids(event, numGrids)}
                style={{ ...(this._styleForm as any) }}
            >
                <div>Grid #</div>
                <input
                    style={{ ...this._styleInput }}
                    type="text"
                    name="numGrids"
                    value={numGrids}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        const newVal = event.target.value;
                        setNumGrids(newVal);
                    }}
                    // must use enter to change the value
                    onBlur={(event: any) => {
                        const orig = `${this.getPlotYAxes()[this.yIndex]["numGrids"]}`;
                        if (orig !== numGrids) {
                            setNumGrids(orig);
                        }
                    }}
                />
            </form>
        );
    };


    updateWidgetNumGrids = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        event.preventDefault();
        const mainWidget = this.getMainWidget();

        // const index = this.yIndex * 2;

        // mainWidget.getChannelNamesLevel0()[index] = `${propertyValue}`;
        const oldValue = `${this.getPlotYAxes()[this.yIndex]["numGrids"]}`;
        if (oldValue === propertyValue) {
            return;
        }

        if (typeof propertyValue === "string") {
            this.getPlotYAxes()[this.yIndex]["numGrids"] = parseInt(propertyValue);
        }

        // ! shall we do it?
        // mainWidget.setExpanedBaseChannelNames();
        // mainWidget.expandAndExtractChannelNames();

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(this.getMainWidget().getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };


    _ElementPointType = () => {

        return (
            <form style={{ ...this._styleForm as any }}>
                <div>Point type</div>
                <select
                    style={{ ...this._styleInput, width: "59%" }}
                    onChange={(event: any) => {
                        this.updateWidgetPointType(event, event.target.value);
                    }}
                    defaultValue={this.getPlotYAxes()[this.yIndex]["pointType"]}
                >
                    <option value="none">None</option>
                    <option value="circle">Circle</option>
                    <option value="square">Square</option>
                    <option value="diamond">Diamond</option>
                    <option value="x">X</option>
                    <option value="triangle">Triangle</option>
                    <option value="asterisk">Asterisk</option>
                </select>
            </form>
        );
    };
    _ElementLineStyle = () => {

        return (
            <form style={{ ...this._styleForm as any }}>
                <div>Line Style</div>
                <select
                    style={{ ...this._styleInput, width: "59%" }}
                    onChange={(event: any) => {
                        this.updateWidgetLineStyle(event, event.target.value);
                    }}
                    defaultValue={this.getPlotYAxes()[this.yIndex]["lineStyle"]}
                >
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                    {/* <option value="dash-dot">Dash Dot</option>
                    <option value="dash-dot-dot">Dash Dot Dot</option> */}
                    <option value="none">None</option>
                </select>
            </form>
        );
    };

    updateWidgetPointType = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        event.preventDefault();

        const oldVal = this.getPlotYAxes()[this.yIndex]["pointType"];
        if (propertyValue === oldVal) {
            return;
        } else {
            this.getPlotYAxes()[this.yIndex]["pointType"] = `${propertyValue}`;
        }

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(this.getMainWidget().getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };
    updateWidgetLineStyle = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        event.preventDefault();

        const oldVal = this.getPlotYAxes()[this.yIndex]["lineStyle"];
        if (propertyValue === oldVal) {
            return;
        } else {
            this.getPlotYAxes()[this.yIndex]["lineStyle"] = `${propertyValue}`;
        }

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(this.getMainWidget().getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };

}
