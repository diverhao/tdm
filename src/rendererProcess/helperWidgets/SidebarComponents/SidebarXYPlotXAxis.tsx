import * as React from "react";
import { BaseWidgetSidebar } from "../../widgets/BaseWidget/BaseWidgetSidebar";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { SidebarComponent } from "./SidebarComponent";
import { PvTable } from "../../widgets/PvTable/PvTable";
import { SidebarXYPlotYAxes } from "./SidebarXYPlotYAxes";
import { XYPlot } from "../../widgets/XYPlot/XYPlot";
import { Collapsible } from "../ColorPicker/Collapsible";
import * as GlobalMethods from "../../../common/GlobalMethods";
import { XYPlotSidebar } from "../../widgets/XYPlot/XYPlotSidebar";

import { SidebarXYPlotYAxis } from "./SidebarXYPlotYAxis";
/**
 * Represents the channel names component in sidebar. <br>
 *
 * It is different from the SidebarChannelName. This one accepts multiple PV names, separated by commas.
 *
 * It provides: (1) the JSX element, (2) the method to udpate the widget from sidebar, and (3) the method to
 * update this sidebar component from widget.
 */
export class SidebarXYPlotXAxis extends SidebarComponent {
    hideContents: boolean = false;
    constructor(sidebar: BaseWidgetSidebar) {
        super(sidebar);
        // this.yAxes = sidebarXYPlotYAxes;
        // this.yIndex = yIndex;
    }

    updateWidget = (event: any, propertyValue: string | number | boolean | number[] | string[] | undefined) => { };

    getPlot = () => {
        return (this.getMainWidget() as XYPlot).getPlot();
    };
    getPlotXAxis = () => {
        return this.getPlot().xAxis;
    };

    _Element = () => {
        return (
            <>
                <this._BlockTitle>
                    <b>Traces</b>
                    <this._ElementAddYAxis></this._ElementAddYAxis>
                </this._BlockTitle>

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
                        <this._ElementXValMin></this._ElementXValMin>
                        <this._ElementXValMax></this._ElementXValMax>
                        <this._ElementAutoScale></this._ElementAutoScale>
                        <this._ElementShowGrid></this._ElementShowGrid>
                        <this._ElementNumGrids></this._ElementNumGrids>
                    </>
                    }
                </div>
            </>
        );
    };

    _ElementTitle = () => {
        return (
            <div
                style={{
                    ...(this._styleForm as any),
                    backgroundColor: "rgba(200, 200, 200, 1)",
                    width: "100%",

                }}
            >
                <b>{`x Axis`}</b>
                <this._ElementHideContents></this._ElementHideContents>
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

    _ElementAddYAxis = () => {
        const elementRef = React.useRef<any>(null);
        return (
            <div
                style={{
                    opacity: 0.25,
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
                    const newYIndex = (this.getSidebar() as XYPlotSidebar).getYAxes().length;

                    // add channel name pair
                    this.getMainWidget().getChannelNamesLevel0().push("");
                    this.getMainWidget().getChannelNamesLevel0().push("");
                    // remove yaxis in main widget
                    const defaultYAxis = (this.getMainWidget() as XYPlot).getPlot().generateDefaultYAxis(newYIndex);
                    (this.getMainWidget() as XYPlot).getPlot().yAxes.push(defaultYAxis);
                    // update xy data
                    (this.getMainWidget() as XYPlot).getPlot().initXY();
                    // remove axis in SidebarXYPlotYAxes
                    (this.getSidebar() as XYPlotSidebar)
                        .getYAxes()
                        .push(new SidebarXYPlotYAxis((this.getSidebar() as XYPlotSidebar).getSidebarXYPlotYAxes(), newYIndex));
                    // no need to update SidebarXYPlotYAxis yIndex
                    // add to history
                    const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
                    history.registerAction();
                    // update widget
                    g_widgets1.addToForceUpdateWidgets(this.getMainWidget().getWidgetKey());
                    g_widgets1.addToForceUpdateWidgets("GroupSelection2");

                    g_flushWidgets();
                }}
            >
                <img src={`../../../webpack/resources/webpages/add-symbol.svg`} width="12px"></img>
            </div>
        );
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

    _ElementLabel = () => {
        const [label, setLabel] = React.useState(this.getPlotXAxis()["label"]);
        return (
            <form
                spellCheck={false}
                onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.updateWidgetLabel(event, label)}
                style={{ ...(this._styleForm as any) }}
            >
                <this._ElementInputLabel
                    value={label}
                    setValue={setLabel}
                    readableText={"X Axis label"}
                    updater={(newValue: string) => { this.updateWidgetLabel(undefined, newValue) }}
                >
                    Label:
                </this._ElementInputLabel>
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
                        const orig = this.getPlotXAxis()["label"];
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

        this.getPlotXAxis()["label"] = `${propertyValue}`;
        // ! shall we do it?
        // mainWidget.setExpanedBaseChannelNames();
        // mainWidget.expandAndExtractChannelNames();

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(this.getMainWidget().getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };

    _ElementAutoScale = () => {
        const [autoScale, setAutoScale] = React.useState<boolean>(this.getPlotXAxis()["autoScale"]);

        return (
            <form
                onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.updateWidgetAutoScale(event, autoScale)}
                style={{ ...(this._styleForm as any) }}
            >
                <div>Auto scale:</div>
                <input
                    type="checkbox"
                    // uncheck if there are more than one traces
                    // checked={this.getMainWidget().getChannelNamesLevel0().length > 2 ? false : autoScale}
                    checked={autoScale}
                    // greg out when there are more than one traces
                    // disabled={this.getMainWidget().getChannelNamesLevel0().length > 2 ? true : false}
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

        const oldVal = this.getPlotXAxis()["autoScale"];
        if (propertyValue === oldVal) {
            return;
        } else {
            if (typeof propertyValue === "boolean") {
                this.getPlotXAxis()["autoScale"] = propertyValue;
            }
        }

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(this.getMainWidget().getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };


    _ElementShowGrid = () => {
        const [showGrid, setShowGrid] = React.useState<boolean>(this.getPlotXAxis()["showGrid"]);

        return (
            <form
                onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.updateWidgetShowGrid(event, showGrid)}
                style={{ ...(this._styleForm as any) }}
            >
                <div>Show grid:</div>
                <input
                    type="checkbox"
                    // uncheck if there are more than one traces
                    checked={showGrid}
                    // greg out when there are more than one traces
                    // disabled={this.getMainWidget().getChannelNamesLevel0().length > 2 ? true : false}
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

        const oldVal = this.getPlotXAxis()["showGrid"];
        if (propertyValue === oldVal) {
            return;
        } else {
            if (typeof propertyValue === "boolean") {
                this.getPlotXAxis()["showGrid"] = propertyValue;
            }
        }

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(this.getMainWidget().getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };


    _ElementNumGrids = () => {
        // always string
        const [numGrids, setNumGrids] = React.useState(`${this.getPlotXAxis()["numGrids"]}`);
        return (
            <form
                spellCheck={false}
                onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.updateWidgetNumGrids(event, numGrids)}
                style={{ ...(this._styleForm as any) }}
            >
                <div>Grid #:</div>
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
                        const orig = `${this.getPlotXAxis()["numGrids"]}`;
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

        // mainWidget.getUnprocessedChannelNames()[index] = `${propertyValue}`;
        const oldValue = `${this.getPlotXAxis()["numGrids"]}`;
        if (oldValue === propertyValue) {
            return;
        }

        if (typeof propertyValue === "string") {
            this.getPlotXAxis()["numGrids"] = parseInt(propertyValue);
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


    _ElementXValMin = () => {
        // always string
        const [valMin, setValMin] = React.useState(`${this.getPlotXAxis()["valMin"]}`);
        return (
            <form
                spellCheck={false}
                onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.updateWidgetXValMin(event, valMin)}
                style={{ ...(this._styleForm as any) }}
            >
                <div>X Val Min:</div>
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
                        const orig = `${this.getPlotXAxis()["valMin"]}`;
                        if (orig !== valMin) {
                            setValMin(orig);
                        }
                    }}
                />
            </form>
        );
    };

    _ElementXValMax = () => {
        // always string
        const [valMax, setValMax] = React.useState(`${this.getPlotXAxis()["valMax"]}`);
        return (
            <form
                spellCheck={false}
                onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.updateWidgetXValMax(event, valMax)}
                style={{ ...(this._styleForm as any) }}
            >
                <div>X Val Max:</div>
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
                        const orig = `${this.getPlotXAxis()["valMax"]}`;
                        if (orig !== valMax) {
                            setValMax(orig);
                        }
                    }}
                />
            </form>
        );
    };

    updateWidgetXValMin = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        event.preventDefault();
        const mainWidget = this.getMainWidget();

        // const index = this.yIndex * 2;

        // mainWidget.getUnprocessedChannelNames()[index] = `${propertyValue}`;
        const oldValue = `${this.getPlotXAxis()["valMin"]}`;
        if (oldValue === propertyValue) {
            return;
        }

        if (typeof propertyValue === "string") {
            this.getPlotXAxis()["valMin"] = parseFloat(propertyValue);
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

    updateWidgetXValMax = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        event.preventDefault();
        const mainWidget = this.getMainWidget();

        // const index = this.yIndex * 2;

        // mainWidget.getUnprocessedChannelNames()[index] = `${propertyValue}`;
        const oldValue = `${this.getPlotXAxis()["valMax"]}`;
        if (oldValue === propertyValue) {
            return;
        }

        if (typeof propertyValue === "string") {
            this.getPlotXAxis()["valMax"] = parseFloat(propertyValue);
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
}
