import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { ElementRectangleButton } from "../../helperWidgets/SharedElements/RectangleButton";
import { type_XYPlot_xAxis as type_xAxis, type_XYPlot_yAxis as type_yAxis } from "../../../common/types/type_widget_tdl";
import { XYPlotPlot } from "./XYPlotPlot";

export class XYPlotPlotSettings {
    private _plot: XYPlotPlot;

    constructor(plot: XYPlotPlot) {
        this._plot = plot;
    }

    _Element = () => {
        if (g_widgets1.isEditing()) {
            return null;
        }

        const yAxes = this.getPlot().yAxes;
        const xAxis = this.getPlot().xAxis;

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
                    alignItems: "center",
                    boxSizing: "border-box",
                    flexDirection: "column",
                    border: "solid 1px rgba(0,0,0,1)",
                }}
            >
                <this._ElementAxis
                    axisData={xAxis}
                    isXaxis={true}
                ></this._ElementAxis>
                {yAxes.map((yAxis: type_yAxis, yIndex: number) => {
                    return (
                        <this._ElementAxis
                            key={`${yIndex}`}
                            axisData={yAxis}
                            isXaxis={false}
                        ></this._ElementAxis>
                    )
                })}
                <this._ElementOKButton></this._ElementOKButton>
            </div>
        );
    };

    /**
     * one axis, either x-axis or y-axis
     */
    _ElementAxis = ({ axisData, isXaxis }: { axisData: type_xAxis | type_yAxis, isXaxis: boolean }) => {

        const axisType = (axisData as any)["xData"] === undefined ? "x" : "y";
        const data = axisType === "x" ? axisData as type_xAxis : axisData as type_yAxis;
        const label = data["label"];
        const plot = this.getPlot();

        return (
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
                {/* label */}
                <div
                    style={{
                        display: "inline-flex",
                        padding: 5,
                        fontWeight: "bold",
                        alignItems: "center",
                        flexDirection: "row",
                    }}
                >
                    {axisType === "x" ? "" : "Trace"} &nbsp;
                    {plot.convertLatexSourceToDiv(label)}
                </div>
                {/* min */}
                <this._ElementNumVal
                    axisData={data}
                    fieldName={"valMin"}
                ></this._ElementNumVal>
                {/* max */}
                <this._ElementNumVal
                    axisData={data}
                    fieldName={"valMax"}
                ></this._ElementNumVal>
                {/* show grid */}
                <this._ElementBoolVal
                    axisData={data}
                    fieldName={"showGrid"}
                ></this._ElementBoolVal>
                {/* number of grids */}
                <this._ElementNumVal
                    axisData={data}
                    fieldName={"numGrids"}
                ></this._ElementNumVal>
                {/* auto scale */}
                {isXaxis === true ? null :
                    <this._ElementBoolVal
                        axisData={data}
                        fieldName={"autoScale"}
                    ></this._ElementBoolVal>
                }
            </div>
        )
    }

    /**
     * one numeric value
     */
    _ElementNumVal = ({ axisData, fieldName }: { axisData: type_xAxis | type_yAxis, fieldName: keyof (type_xAxis | type_yAxis) }) => {
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
                        if (!isNaN(valueNum)) {
                            (axisData[fieldName] as any) = valueNum;

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

    /**
     * one boolean value
     */
    _ElementBoolVal = ({ axisData, fieldName }: { axisData: type_xAxis | type_yAxis, fieldName: keyof (type_xAxis | type_yAxis) }) => {
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

}
