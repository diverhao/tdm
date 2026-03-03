import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { ElementRectangleButton } from "../../helperWidgets/SharedElements/RectangleButton";
import { XYPlotPlot } from "./XYPlotPlot";
import { SidebarNumberInput } from "../../helperWidgets/SidebarComponents/SidebarNumberInput";
import { SidebarCheckBox } from "../../helperWidgets/SidebarComponents/SidebarCheckBox";

export class XYPlotPlotSettings {
    private _plot: XYPlotPlot;
    private _xAxisComponents: (SidebarNumberInput | SidebarCheckBox)[] = [];
    private _yAxesComponents: (SidebarNumberInput | SidebarCheckBox)[][] = [];

    constructor(plot: XYPlotPlot) {
        this._plot = plot;
    }


    createComponents = () => {
        const yAxes = this.getPlot().yAxes;
        const xAxis = this.getPlot().xAxis;
        const sidebar = this.getPlot().getMainWidget().getSidebar();
        if (sidebar === undefined) {
            return;
        }
        const extraStyle = {
            backgroundColor: "rgba(255,255,255,1)",
            marginTop: 5,
            marginBottom: 5,
            width: "40%",
        }
        this._xAxisComponents = [
            new SidebarNumberInput(sidebar, xAxis, "valMin", "Min", false, extraStyle),
            new SidebarNumberInput(sidebar, xAxis, "valMax", "Max", false, extraStyle),
            new SidebarCheckBox(sidebar, xAxis, "showGrid", "Show grid"),
            new SidebarNumberInput(sidebar, xAxis, "numGrids", "# of grids", false, extraStyle),
        ];

        this._yAxesComponents = [];
        for (const yAxis of yAxes) {
            const yAxisComponents = [
                new SidebarNumberInput(sidebar, yAxis, "valMin", "Min", false, extraStyle),
                new SidebarNumberInput(sidebar, yAxis, "valMax", "Max", false, extraStyle),
                new SidebarCheckBox(sidebar, yAxis, "showGrid", "Show grid"),
                new SidebarNumberInput(sidebar, yAxis, "numGrids", "# of grids", false, extraStyle),
                new SidebarCheckBox(sidebar, yAxis, "autoScale", "Auto scale"),
            ];
            this._yAxesComponents.push(yAxisComponents);
        }

    }

    _Element = () => {
        if (g_widgets1.isEditing()) {
            return null;
        }


        console.log("this.getXAxisComponents()", this.getXAxisComponents())

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
                }}
            >
                <div
                    style={{
                        display: "inline-flex",
                        width: "90%",
                        backgroundColor: "rgba(230,230,230,1)",
                        borderRadius: 10,
                        boxSizing: "border-box",
                        flexDirection: "column",
                        alignItems: "center",
                        padding: 10,
                        marginBottom: 10,
                    }}
                >
                    <div
                        style={{
                            display: "inline-flex",
                            width: "40%",
                            boxSizing: "border-box",
                            flexDirection: "column",
                        }}
                    >
                        <b>{"X axis"}</b>
                        {this.getXAxisComponents().map((component: SidebarNumberInput | SidebarCheckBox, index: number) => {
                            return (
                                component.getElement()
                            )
                        })}
                    </div>
                </div>

                {this.getYAxesComponents().map((yAxisComponents: (SidebarNumberInput | SidebarCheckBox)[], index: number) => {
                    const yAxis = this.getPlot().yAxes[index];
                    return (
                        <div
                            style={{
                                display: "inline-flex",
                                width: "90%",
                                backgroundColor: "rgba(230,230,230,1)",
                                borderRadius: 10,
                                boxSizing: "border-box",
                                flexDirection: "column",
                                alignItems: "center",
                                padding: 10,
                            }}
                        >
                            <div
                                style={{
                                    display: "inline-flex",
                                    width: "40%",
                                    boxSizing: "border-box",
                                    flexDirection: "column",
                                }}
                            >

                                <b>
                                    Trace {this.getPlot().convertLatexSourceToDiv(yAxis.label)}
                                </b>
                                {yAxisComponents.map((component: SidebarNumberInput | SidebarCheckBox, index: number) => {
                                    return (
                                        component.getElement()
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}

                <this._ElementOKButton></this._ElementOKButton>
            </div>
        );
    };

    _ElementOKButton = () => {
        return (
            <ElementRectangleButton
                marginTop={10}
                marginBottom={10}
                handleClick={() => {
                    const plot = this.getPlot();
                    const yAxes = plot.yAxes;
                    plot.getMainWidget().showSettings = false;
                    for (let ii = 0; ii < yAxes.length; ii++) {
                        plot.updateTicksInfo(ii);
                    }

                    g_widgets1.addToForceUpdateWidgets(this.getPlot().getMainWidget().getWidgetKey());
                    g_widgets1.addToForceUpdateWidgets("GroupSelection2");
                    g_flushWidgets();
                }
                }>
                OK
            </ElementRectangleButton>
        )
    }

    // -------------------- methods -----------------------

    getPlot = () => {
        return this._plot;
    }


    getElementSettings = () => {
        return <this._Element></this._Element>;
    };


    getXAxisComponents = () => {
        return this._xAxisComponents;
    }

    getYAxesComponents = () => {
        return this._yAxesComponents;
    }
}
