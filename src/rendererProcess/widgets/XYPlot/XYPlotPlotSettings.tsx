import * as React from "react";
import { GlobalVariables } from "../../../common/GlobalVariables";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { ElementRectangleButton } from "../../helperWidgets/SharedElements/RectangleButton";
import { type_yAxis } from "./XYPlotPlot";

/**
 * Settings panel UI for XYPlot.
 *
 * Extracted from XYPlotPlot to reduce file size.
 * All access to plot state goes through `this.plot` (the XYPlotPlot instance).
 */
export class XYPlotPlotSettings {
    // XYPlotPlot instance, typed as any to avoid circular import
    plot: any;

    constructor(plot: any) {
        this.plot = plot;
    }

    getElementSettings = () => {
        if (g_widgets1.isEditing()) {
            return null;
        } else {
            return <this._ElementSettings></this._ElementSettings>;
        }
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
                onMouseEnter={() => {
                    if (elementRef.current !== null) {
                        elementRef.current.style["backgroundColor"] = "rgba(230, 230, 230, 1)";
                    }
                }}
                onMouseLeave={() => {
                    if (elementRef.current !== null) {
                        elementRef.current.style["backgroundColor"] = "rgba(230, 230, 230, 0)";
                    }
                }}
            >
                {children}
            </div>
        )
    }

    _ElementSettingCell = ({ children, width }: any) => {
        return (<div
            style={{
                width: width,
                display: "inline-flex",
                flexDirection: "row",
                justifyContent: 'flex-start',
                alignItems: "center",
                height: "100%",
            }}
        >
            {children}
        </div>)
    }

    _ElementSettings = () => {
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

                <this._ElementSettingLine>
                    <this._ElementSettingsSectionHead>
                        X Axis
                    </this._ElementSettingsSectionHead>
                </this._ElementSettingLine>
                <this._ElementSettingsXValMin></this._ElementSettingsXValMin>
                <this._ElementSettingsXValMax></this._ElementSettingsXValMax>
                <this._ElementSettingsXAutoScale></this._ElementSettingsXAutoScale>
                <this._ElementSettingsXShowGrid></this._ElementSettingsXShowGrid>
                <this._ElementSettingsXNumGrids></this._ElementSettingsXNumGrids>
                {/* y axes */}
                {this.plot.yAxes.map((yAxis: type_yAxis, yIndex: number) => {
                    return (
                        <>
                            <this._ElementSettingLine>
                                <this._ElementSettingsSectionHead>
                                    Trace {this.plot.convertLatexSourceToDiv(yAxis["label"])}
                                </this._ElementSettingsSectionHead>
                            </this._ElementSettingLine>

                            <this._ElementSettingsYValMin key={`${yAxis["label"]}-${yIndex}-min`} yIndex={yIndex}></this._ElementSettingsYValMin>
                            <this._ElementSettingsYValMax key={`${yAxis["label"]}-${yIndex}-max`} yIndex={yIndex}></this._ElementSettingsYValMax>
                            <this._ElementSettingsYAutoScale
                                key={`${yAxis["label"]}-${yIndex}-autoscale`}
                                yIndex={yIndex}
                            ></this._ElementSettingsYAutoScale>
                            <this._ElementSettingsYShowGrid
                                key={`${yAxis["label"]}-${yIndex}-autoscale`}
                                yIndex={yIndex}
                            ></this._ElementSettingsYShowGrid>
                            <this._ElementSettingsYNumGrids
                                key={`${yAxis["label"]}-${yIndex}-numgrids`}
                                yIndex={yIndex}
                            ></this._ElementSettingsYNumGrids>
                            <this._ElementSettingsYHideTrace
                                key={`${yAxis["label"]}-${yIndex}-hidetrace`}
                                yIndex={yIndex}
                            ></this._ElementSettingsYHideTrace>
                        </>
                    );
                })}
                {/* <this._ElementSettingLine> */}
                <this._ElementSettingsOKButton></this._ElementSettingsOKButton>
                {/* </this._ElementSettingLine> */}
            </div>
        );
    };

    _styleInput = {
        width: "55%",
        border: "solid 1px rgba(0,0,0,0)",
        outline: "none",
        borderRadius: 0,
        backgroundColor: "rgba(255, 255, 255, 0)",
        // padding: 0,
        // margin: 0,
    };

    _ElementSettingsOKButton = () => {
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
                        this.plot.getMainWidget().showSettings = false;
                        g_widgets1.addToForceUpdateWidgets(this.plot.getMainWidget().getWidgetKey());
                        g_widgets1.addToForceUpdateWidgets("GroupSelection2");
                        g_flushWidgets();
                    }
                    }>
                    OK
                </ElementRectangleButton>
            </div >

        )
    }

    _ElementSettingsSectionHead = ({ children }: any) => {
        return (
            <div style={{
                backgroundColor: "rgba(210, 210, 210, 1)",
                width: "100%",
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",
                boxSizing: "border-box",
                paddingTop: 5,
                paddingBottom: 5,
            }}>
                <b>{children}</b>
            </div>

        )
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

    _ElementSettingsXValMin = () => {
        // always string
        const [valMin, setValMin] = React.useState(`${this.plot.xAxis["valMin"]}`);
        const elementRefInput = React.useRef<any>(null);
        return (
            <this._ElementSettingLine>
                <this._ElementSettingCell width={"30%"}>
                    Min:
                </this._ElementSettingCell>
                <this._ElementSettingCell width={"70%"}>
                    <form
                        spellCheck={false}
                        onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                            event.preventDefault();
                            const orig = this.plot.xAxis["valMin"];
                            const valMinNum = parseFloat(valMin);
                            if (!isNaN(valMinNum)) {
                                this.plot.xAxis["valMin"] = valMinNum;
                                setValMin(`${valMinNum}`);
                                g_widgets1.addToForceUpdateWidgets(this.plot.getMainWidget().getWidgetKey());
                                g_widgets1.addToForceUpdateWidgets("GroupSelection2");
                                g_flushWidgets();
                            } else {
                                setValMin(`${orig}`);
                            }
                        }}
                    >
                        <this._ElementInput
                            value={valMin}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                const newVal = event.target.value;
                                setValMin(newVal);
                            }}
                            onBlur={(event: any) => {
                                const orig = `${this.plot.xAxis["valMin"]}`;
                                if (orig !== valMin) {
                                    setValMin(orig);
                                }
                            }}
                        ></this._ElementInput>
                    </form>
                </this._ElementSettingCell>

            </this._ElementSettingLine>
        );
    };

    _ElementSettingsXValMax = () => {
        // always string
        const [valMax, setValMax] = React.useState(`${this.plot.xAxis["valMax"]}`);
        const elementRefInput = React.useRef<any>(null);
        return (
            <this._ElementSettingLine>
                <this._ElementSettingCell width={"30%"}>
                    Max:
                </this._ElementSettingCell>
                <this._ElementSettingCell width={"70%"}>
                    <form
                        spellCheck={false}
                        onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                            event.preventDefault();
                            const orig = this.plot.xAxis["valMax"];
                            const valMaxNum = parseFloat(valMax);
                            if (!isNaN(valMaxNum)) {
                                this.plot.xAxis["valMax"] = valMaxNum;
                                setValMax(`${valMaxNum}`);
                                g_widgets1.addToForceUpdateWidgets(this.plot.getMainWidget().getWidgetKey());
                                g_widgets1.addToForceUpdateWidgets("GroupSelection2");
                                g_flushWidgets();
                            } else {
                                setValMax(`${orig}`);
                            }
                        }}
                    >
                        <this._ElementInput
                            value={valMax}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                const newVal = event.target.value;
                                setValMax(newVal);
                            }}
                            onBlur={(event: any) => {
                                const orig = `${this.plot.xAxis["valMax"]}`;
                                if (orig !== valMax) {
                                    setValMax(orig);
                                }
                            }}
                        ></this._ElementInput>
                    </form>
                </this._ElementSettingCell>

            </this._ElementSettingLine>
        );
    };

    _ElementSettingsXAutoScale = () => {
        // boolean
        const [autoScale, setAutoScale] = React.useState<boolean>(this.plot.xAxis["autoScale"]);
        return (
            <this._ElementSettingLine>
                <this._ElementSettingCell width={"30%"}>
                    Auto scale:
                </this._ElementSettingCell>
                <this._ElementSettingCell width={"70%"}>
                    <form
                        spellCheck={false}
                        onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                            this.plot.xAxis["autoScale"] = autoScale;

                            g_widgets1.addToForceUpdateWidgets(this.plot.getMainWidget().getWidgetKey());
                            g_widgets1.addToForceUpdateWidgets("GroupSelection2");

                            g_flushWidgets();
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={autoScale}
                            onChange={(event: any) => {
                                this.plot.xAxis["autoScale"] = !autoScale;

                                g_widgets1.addToForceUpdateWidgets(this.plot.getMainWidget().getWidgetKey());
                                g_widgets1.addToForceUpdateWidgets("GroupSelection2");

                                g_flushWidgets();
                                setAutoScale((prevVal: boolean) => {
                                    return !prevVal;
                                });
                            }}
                        />
                    </form>
                </this._ElementSettingCell>

            </this._ElementSettingLine>
        );
    };

    _ElementSettingsYValMin = ({ yIndex }: any) => {
        // always string
        const [valMin, setValMin] = React.useState(`${this.plot.yAxes[yIndex]["valMin"]}`);
        const elementRefInput = React.useRef<any>(null);
        return (
            <this._ElementSettingLine>
                <this._ElementSettingCell width={"30%"}>
                    Min:
                </this._ElementSettingCell>
                <this._ElementSettingCell width={"70%"}>
                    <form
                        spellCheck={false}
                        onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                            event.preventDefault();
                            const orig = this.plot.yAxes[yIndex]["valMin"];
                            const valMinNum = parseFloat(valMin);
                            if (!isNaN(valMinNum)) {
                                this.plot.yAxes[yIndex]["valMin"] = valMinNum;
                                setValMin(`${valMinNum}`);
                                g_widgets1.addToForceUpdateWidgets(this.plot.getMainWidget().getWidgetKey());
                                g_widgets1.addToForceUpdateWidgets("GroupSelection2");
                                g_flushWidgets();
                            } else {
                                setValMin(`${orig}`);
                            }
                        }}
                    >
                        <this._ElementInput
                            value={valMin}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                const newVal = event.target.value;
                                setValMin(newVal);
                            }}
                            onBlur={(event: any) => {
                                const orig = `${this.plot.yAxes[yIndex]["valMin"]}`;
                                if (orig !== valMin) {
                                    setValMin(orig);
                                }
                            }}
                        ></this._ElementInput>
                    </form>
                </this._ElementSettingCell>

            </this._ElementSettingLine>
        );
    };

    _ElementSettingsYValMax = ({ yIndex }: any) => {
        // always string
        const [valMax, setValMax] = React.useState(`${this.plot.yAxes[yIndex]["valMax"]}`);
        const elementRefInput = React.useRef<any>(null);
        return (
            <this._ElementSettingLine>
                <this._ElementSettingCell width={"30%"}>
                    Max:
                </this._ElementSettingCell>
                <this._ElementSettingCell width={"70%"}>
                    <form
                        spellCheck={false}
                        onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                            event.preventDefault();
                            const orig = this.plot.yAxes[yIndex]["valMax"];
                            const valMaxNum = parseFloat(valMax);
                            if (!isNaN(valMaxNum)) {
                                this.plot.yAxes[yIndex]["valMax"] = valMaxNum;
                                setValMax(`${valMaxNum}`);
                                g_widgets1.addToForceUpdateWidgets(this.plot.getMainWidget().getWidgetKey());
                                g_widgets1.addToForceUpdateWidgets("GroupSelection2");
                                g_flushWidgets();
                            } else {
                                setValMax(`${orig}`);
                            }
                        }}
                    >
                        <this._ElementInput
                            value={valMax}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                const newVal = event.target.value;
                                setValMax(newVal);
                            }}
                            onBlur={(event: any) => {
                                const orig = `${this.plot.yAxes[yIndex]["valMax"]}`;
                                if (orig !== valMax) {
                                    setValMax(orig);
                                }
                            }}
                        ></this._ElementInput>
                    </form>
                </this._ElementSettingCell>

            </this._ElementSettingLine>
        );
    };

    _ElementSettingsYAutoScale = ({ yIndex }: any) => {
        // boolean
        const [autoScale, setAutoScale] = React.useState<boolean>(this.plot.yAxes[yIndex]["autoScale"]);
        return (
            <this._ElementSettingLine>
                <this._ElementSettingCell width={"30%"}>
                    Auto scale:
                </this._ElementSettingCell>
                <this._ElementSettingCell width={"70%"}>
                    <form
                        spellCheck={false}
                        onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                            this.plot.yAxes[yIndex]["autoScale"] = autoScale;

                            g_widgets1.addToForceUpdateWidgets(this.plot.getMainWidget().getWidgetKey());
                            g_widgets1.addToForceUpdateWidgets("GroupSelection2");

                            g_flushWidgets();
                        }}
                    // style={{ ...(this._styleForm as any) }}
                    >
                        <input
                            type="checkbox"
                            checked={autoScale}
                            onChange={(event: any) => {
                                this.plot.yAxes[yIndex]["autoScale"] = !autoScale;

                                g_widgets1.addToForceUpdateWidgets(this.plot.getMainWidget().getWidgetKey());
                                g_widgets1.addToForceUpdateWidgets("GroupSelection2");

                                g_flushWidgets();
                                setAutoScale((prevVal: boolean) => {
                                    return !prevVal;
                                });
                            }}
                        />
                    </form>
                </this._ElementSettingCell>

            </this._ElementSettingLine>
        );
    };

    _ElementSettingsXShowGrid = () => {
        // boolean
        const [showGrid, setShowGrid] = React.useState<boolean>(this.plot.xAxis["showGrid"]);
        return (
            <this._ElementSettingLine>
                <this._ElementSettingCell width={"30%"}>
                    Show grids:
                </this._ElementSettingCell>
                <this._ElementSettingCell width={"70%"}>
                    <form
                        spellCheck={false}
                        onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                            this.plot.xAxis["showGrid"] = showGrid;

                            g_widgets1.addToForceUpdateWidgets(this.plot.getMainWidget().getWidgetKey());
                            g_widgets1.addToForceUpdateWidgets("GroupSelection2");

                            g_flushWidgets();
                        }}
                    // style={{ ...(this._styleForm as any) }}
                    >
                        <input
                            type="checkbox"
                            // uncheck if there are more than one traces
                            checked={showGrid}
                            // greg out when there are more than one traces
                            onChange={(event: any) => {
                                this.plot.xAxis["showGrid"] = !showGrid;

                                g_widgets1.addToForceUpdateWidgets(this.plot.getMainWidget().getWidgetKey());
                                g_widgets1.addToForceUpdateWidgets("GroupSelection2");

                                g_flushWidgets();
                                setShowGrid((prevVal: boolean) => {
                                    return !prevVal;
                                });
                            }}
                        />
                    </form>
                </this._ElementSettingCell>

            </this._ElementSettingLine>
        );
    };

    _ElementSettingsYShowGrid = ({ yIndex }: any) => {
        // boolean
        const [showGrid, setShowGrid] = React.useState<boolean>(this.plot.yAxes[yIndex]["showGrid"]);
        return (
            <this._ElementSettingLine>
                <this._ElementSettingCell width={"30%"}>
                    Show grids:
                </this._ElementSettingCell>
                <this._ElementSettingCell width={"70%"}>
                    <form
                        spellCheck={false}
                        onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                            this.plot.yAxes[yIndex]["showGrid"] = showGrid;

                            g_widgets1.addToForceUpdateWidgets(this.plot.getMainWidget().getWidgetKey());
                            g_widgets1.addToForceUpdateWidgets("GroupSelection2");

                            g_flushWidgets();
                        }}
                    // style={{ ...(this._styleForm as any) }}
                    >
                        <input
                            type="checkbox"
                            checked={showGrid}
                            onChange={(event: any) => {
                                this.plot.yAxes[yIndex]["showGrid"] = !showGrid;

                                g_widgets1.addToForceUpdateWidgets(this.plot.getMainWidget().getWidgetKey());
                                g_widgets1.addToForceUpdateWidgets("GroupSelection2");

                                g_flushWidgets();
                                setShowGrid((prevVal: boolean) => {
                                    return !prevVal;
                                });
                            }}
                        />
                    </form>
                </this._ElementSettingCell>

            </this._ElementSettingLine>
        );
    };

    _ElementSettingsYHideTrace = ({ yIndex }: any) => {
        // boolean
        const [hideTrace, setHideTrace] = React.useState<boolean>(this.plot.getTraceHidden(yIndex));
        return (
            <this._ElementSettingLine>
                <this._ElementSettingCell width={"30%"}>
                    Show trace:
                </this._ElementSettingCell>
                <this._ElementSettingCell width={"70%"}>
                    <form
                        spellCheck={false}
                        onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                            this.plot.setTraceHidden(yIndex, hideTrace);

                            g_widgets1.addToForceUpdateWidgets(this.plot.getMainWidget().getWidgetKey());
                            g_widgets1.addToForceUpdateWidgets("GroupSelection2");

                            g_flushWidgets();
                        }}
                    // style={{ ...(this._styleForm as any) }}
                    >
                        <input
                            type="checkbox"
                            checked={hideTrace}
                            onChange={(event: any) => {
                                this.plot.setTraceHidden(yIndex, !hideTrace);

                                g_widgets1.addToForceUpdateWidgets(this.plot.getMainWidget().getWidgetKey());
                                g_widgets1.addToForceUpdateWidgets("GroupSelection2");

                                g_flushWidgets();
                                setHideTrace((prevVal: boolean) => {
                                    return !prevVal;
                                });
                            }}
                        />
                    </form>
                </this._ElementSettingCell>

            </this._ElementSettingLine>
        );
    };

    _ElementSettingsXNumGrids = () => {
        // always string
        const [numGrids, setNumGrids] = React.useState(`${this.plot.xAxis["numGrids"]}`);
        const elementRefInput = React.useRef<any>(null);
        return (
            <this._ElementSettingLine>
                <this._ElementSettingCell width={"30%"}>
                    Number of grids:
                </this._ElementSettingCell>
                <this._ElementSettingCell width={"70%"}>
                    <form
                        spellCheck={false}
                        onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                            event.preventDefault();
                            const orig = this.plot.xAxis["numGrids"];
                            const numGridsNum = parseInt(numGrids);
                            if (!isNaN(numGridsNum)) {
                                this.plot.xAxis["numGrids"] = numGridsNum;
                                setNumGrids(`${numGridsNum}`);
                                g_widgets1.addToForceUpdateWidgets(this.plot.getMainWidget().getWidgetKey());
                                g_widgets1.addToForceUpdateWidgets("GroupSelection2");
                                g_flushWidgets();
                            } else {
                                setNumGrids(`${orig}`);
                            }
                        }}
                    >
                        <this._ElementInput
                            value={numGrids}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                const newVal = event.target.value;
                                setNumGrids(newVal);
                            }}
                            onBlur={(event: any) => {
                                const orig = `${this.plot.xAxis["numGrids"]}`;
                                if (orig !== numGrids) {
                                    setNumGrids(orig);
                                }
                            }}
                        ></this._ElementInput>
                    </form>
                </this._ElementSettingCell>

            </this._ElementSettingLine>
        );
    };

    _ElementSettingsYNumGrids = ({ yIndex }: any) => {
        // always string
        const [numGrids, setNumGrids] = React.useState(`${this.plot.yAxes[yIndex]["numGrids"]}`);
        const elementRefInput = React.useRef<any>(null);
        return (
            <this._ElementSettingLine>
                <this._ElementSettingCell width={"30%"}>
                    Number of grids:
                </this._ElementSettingCell>
                <this._ElementSettingCell width={"70%"}>
                    <form
                        spellCheck={false}
                        onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                            event.preventDefault();
                            const orig = this.plot.yAxes[yIndex]["numGrids"];
                            const numGridsNum = parseInt(numGrids);
                            if (!isNaN(numGridsNum)) {
                                this.plot.yAxes[yIndex]["numGrids"] = numGridsNum;
                                setNumGrids(`${numGridsNum}`);
                                g_widgets1.addToForceUpdateWidgets(this.plot.getMainWidget().getWidgetKey());
                                g_widgets1.addToForceUpdateWidgets("GroupSelection2");
                                g_flushWidgets();
                            } else {
                                setNumGrids(`${orig}`);
                            }
                        }}
                    >
                        <this._ElementInput
                            value={numGrids}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                const newVal = event.target.value;
                                setNumGrids(newVal);
                            }}
                            onBlur={(event: any) => {
                                const orig = `${this.plot.yAxes[yIndex]["numGrids"]}`;
                                if (orig !== numGrids) {
                                    setNumGrids(orig);
                                }
                            }}
                        ></this._ElementInput>
                    </form>
                </this._ElementSettingCell>

            </this._ElementSettingLine>
        );
    };
}
