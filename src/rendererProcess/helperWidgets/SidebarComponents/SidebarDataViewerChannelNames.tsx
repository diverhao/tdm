import * as React from "react";
import { BaseWidgetSidebar } from "../../widgets/BaseWidget/BaseWidgetSidebar";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { SidebarComponent } from "./SidebarComponent";
import { ElementButton, ElementSmallButton } from "../SharedElements/MacrosTable";
import { DataViewerSidebar } from "../../widgets/DataViewer/DataViewerSidebar";
import { DataViewer } from "../../widgets/DataViewer/DataViewer";
import { Collapsible } from "../ColorPicker/Collapsible";
import * as GlobalMethods from "../../global/GlobalMethods";
import {Log} from "../../../mainProcess/log/Log";

/**
 * Represents the channel names component in sidebar. <br>
 *
 * It is different from the SidebarChannelName. This one accepts multiple PV names, separated by commas.
 *
 * It provides: (1) the JSX element, (2) the method to udpate the widget from sidebar, and (3) the method to
 * update this sidebar component from widget.
 */
export class SidebarDataViewerChannelNames extends SidebarComponent {
    constructor(sidebar: BaseWidgetSidebar) {
        super(sidebar);
    }

    _Element = () => {
        const mainWidget = this.getMainWidget() as DataViewer;
        // const BlockTitle = this.getSidebar()._BlockTitle;
        // const StyledSmallButton = (this.getSidebar() as DataViewerSidebar)._StyledSmallButton;
        // const StyledButton = (this.getSidebar() as DataViewerSidebar)._StyledButton;
        // const TraceProperties = (this.getSidebar() as DataViewerSidebar)._TraceProperties;
        const [showContents, setShowContents] = React.useState((this.getSidebar() as DataViewerSidebar)._showChannelNames);
        return (
            <>
                <this._BlockTitle>
                    <b>
                        <b>{`Channels (${mainWidget.getChannelNames().length})`}</b>
                    </b>
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <ElementButton
                            onClick={() => {
                                (this.getSidebar() as DataViewerSidebar)._showChannelNames = true;
                                setShowContents(true);
                                this.updateWidgetAppendTrace(undefined, undefined);
                            }}
                        >
                            <img
                                src={`../../../webpack/resources/webpages/add-symbol.svg`}
                                style={{
                                    width: "60%",
                                    height: "60%",
                                }}
                            ></img>
                        </ElementButton>
                        <ElementButton
                            style={{
                                fontSize: 18,
                            }}
                            onClick={() => {
                                (this.getSidebar() as DataViewerSidebar)._showChannelNames = !showContents;
                                setShowContents(!showContents);
                            }}
                        >
                            {showContents ? <>&#9663;</> : <>&#9657;</>}
                        </ElementButton>
                    </div>
                </this._BlockTitle>
                {/* {showContents ? this.ElementBody() : null} */}

                {/* <BlockTitle>
					<div
						style={{
							display: "inline-flex",
							flexDirection: "row",
							justifyContent: "space-between",
							alignItems: "center",
							width: "100%",
						}}
					>
						<div>
                        <b>{`Channels (${mainWidget.getChannelNames().length})`}</b>
						</div>
						<div
							style={{
								display: "inline-flex",
								flexDirection: "row",
								justifyContent: "space-between",
								alignItems: "center",
								height: "100%",
							}}
						>
							<StyledSmallButton
								onMouseDown={(event: any) => {
									this.updateWidgetAppendTrace(event, undefined);
								}}
							>
								<img
									style={{
										width: 12,
										height: 12,
									}}
									src="../../../mainProcess/resources/webpages/add-symbol.svg"
								></img>
							</StyledSmallButton>
						</div>
					</div>
				</BlockTitle> */}
                {showContents
                    ? this.getMainWidget()
                        .getChannelNames()
                        .map((channelName: string, index: number) => {
                            return <this._TraceProperties key={`trace-properties-${channelName}-${index}`} index={index}></this._TraceProperties>;
                        })
                    : null}
            </>
        );
    };
    _BlockTitle = ({ children }: any) => {
        return (
            <div
                style={{
                    marginTop: 2,
                    marginBottom: 2,
                    width: "100%",
                    display: "inline-flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                {children}
            </div>
        );
    };

    _TraceProperties = ({ index }: any) => {
        const mainWidget = this.getMainWidget() as DataViewer;
        const BlockTitle = this.getSidebar()._BlockTitle;
        const BlockBody = this.getSidebar()._BlockBody;
        // const StyledSmallButton = (this.getSidebar() as DataViewerSidebar)._StyledSmallButton;

        const yAxis = (this.getMainWidget() as DataViewer).getYAxes()[index];
        const [channelName, setChannelName] = React.useState(this.getMainWidget().getChannelNames()[index]);
        const [lineWidth, setLineWidth] = React.useState(yAxis["lineWidth"]);
        const [showTrace, setShowTrace] = React.useState<boolean>(yAxis["show"]);

        const updateValue = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
            const newVal = event.target.value;
            switch (event.target.name) {
                case "channelName":
                    setChannelName(newVal);
                    break;
                case "lineWidth":
                    setLineWidth(parseInt(newVal));
                    break;
                //illegal values
                default:
                    Log.error("Sidebar illegal value");
                    throw new Error();
            }
        }, []);

        return (
            <>
                <BlockTitle>
                    <div
                        style={{
                            display: "inline-flex",
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                            width: "100%",
                        }}
                    >
                        <div>
                            <b>{`#${index + 1}`}</b>
                        </div>
                        <div
                            style={{
                                display: "inline-flex",
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center",
                                height: "100%",
                            }}
                        >
                            <ElementSmallButton
                                onMouseDown={(event: any) => {
                                    this.updateWidgetMoveUpTrace(event, index);
                                }}
                            >
                                &#8593;
                            </ElementSmallButton>{" "}
                            <ElementSmallButton
                                onMouseDown={(event: any) => {
                                    this.updateWidgetMoveDownTrace(event, index);
                                }}
                            >
                                &#8595;
                            </ElementSmallButton>{" "}
                            <ElementSmallButton
                                onMouseDown={(event: any) => {
                                    this.updateWidgetRemoveTrace(event, index);
                                }}
                            >
                                <img
                                    style={{
                                        width: 12,
                                        height: 12,
                                    }}
                                    src={`../../../webpack/resources/webpages/delete-symbol.svg`}
                                ></img>
                            </ElementSmallButton>
                        </div>
                    </div>
                </BlockTitle>

                <BlockBody>
                    <div
                        style={{
                            display: "inline-flex",
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                            width: "100%",
                        }}
                    >
                        <this._ElementInputLabel
                            value={channelName}
                            setValue={setChannelName}
                            readableText={"Channel Name"}
                            updater={(newValue: string) => { this.updateWidgetChannelName(undefined, index, newValue) }}
                        >
                            Name:
                        </this._ElementInputLabel>
                        <form
                            onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                                this.updateWidgetChannelName(event, index, channelName);
                            }}
                            style={{ ...this.getFormStyle(), width: "60%" }}
                        >
                            <input
                                style={{ ...this.getInputStyle(), width: "100%" }}
                                type="text"
                                spellCheck={false}
                                name="channelName"
                                value={channelName}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateValue(event)}
                                // must use enter to change the value
                                onBlur={(event: any) => {
                                    // const orig = this._mainWidget.getChannelNames()[0];
                                    const orig = `${mainWidget.getChannelNames()[index]}`;
                                    if (orig !== channelName) {
                                        setChannelName(orig);
                                    }
                                }}
                            />
                        </form>
                    </div>
                    <form
                        onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                            this.updateWidgetLineWidth(event, index, lineWidth);
                        }}
                        style={this.getFormStyle()}
                    >
                        <div
                            style={{
                                whiteSpace: "nowrap",
                            }}
                        >
                            Line Width:&nbsp;
                        </div>
                        <input
                            style={{ ...this.getInputStyle() }}
                            type="number"
                            spellCheck={false}
                            name="lineWidth"
                            value={lineWidth}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateValue(event)}
                            // must use enter to change the value
                            onBlur={(event: any) => {
                                const orig = yAxis["lineWidth"];
                                if (orig !== lineWidth) {
                                    setLineWidth(orig);
                                }
                            }}
                        />
                    </form>
                    {/* scale */}
                    <form style={this.getFormStyle()} onSubmit={(event: any) => {event.preventDefault()}}>
                        <div>Scale:</div>
                        <select
                            style={{ ...this.getInputStyle(), fontFamily: "inherit", width: "60%" }}
                            onChange={(event: any) => {
                                this.updateScale(event, index);
                            }}
                        >
                            <option selected>{"Linear"}</option>
                            <option selected={mainWidget.getPlot().yAxes[index]["displayScale"] === "Log10"}>{"Log10"}</option>
                        </select>

                    </form>

                    {/* show trace */}
                    <form style={this.getFormStyle()}>
                        <div>Show Trace:</div>
                        <input
                            style={{
                                margin: 0,
                                // height: "100%",
                                // same as color indicator, hard coded 15px
                                height: "15px",
                                aspectRatio: "1/1",
                            }}
                            type="checkbox"
                            checked={showTrace}
                            onChange={(event: any) => {
                                this.updateWidgetShowTrace(event, index, !showTrace);
                                setShowTrace((prevVal: boolean) => {
                                    return !showTrace;
                                });
                            }}
                        />
                    </form>

                    {/* color */}
                    <Collapsible
                        rgbColorStr={yAxis["lineColor"]}
                        updateFromSidebar={this.updateWidgetLineColor}
                        title={"Line Color"}
                        eventName={`line-color-${index}`}
                    />
                </BlockBody>
            </>
        );
    };

    // --------------------------- updaters -------------------------

    updateWidget = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => { };

    updateWidgetAppendTrace = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        event?.preventDefault();
        const mainWidget = this.getMainWidget() as DataViewer;
        mainWidget.getPlot().insertTrace(mainWidget.getChannelNames().length, "");

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };

    updateWidgetLineWidth = (event: any, index: number, newWidth: number) => {
        event.preventDefault();

        const mainWidget = this.getMainWidget() as DataViewer;
        const yAxis = mainWidget.getYAxes()[index];
        if (yAxis !== undefined) {
            yAxis["lineWidth"] = newWidth;
        }

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };

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

        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
       
    }

    updateWidgetRemoveTrace = (event: any, index: number) => {
        event.preventDefault();

        const mainWidget = this.getMainWidget() as DataViewer;
        mainWidget.getPlot().removeTrace(index);

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };

    updateWidgetMoveUpTrace = (event: any, index: number) => {
        event.preventDefault();

        const mainWidget = this.getMainWidget() as DataViewer;
        mainWidget.getPlot().moveUpTrace(index);

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };

    updateWidgetMoveDownTrace = (event: any, index: number) => {
        event.preventDefault();

        const mainWidget = this.getMainWidget() as DataViewer;
        mainWidget.getPlot().moveDownTrace(index);

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };

    updateWidgetInsertTrace = (event: any, index: number) => {
        event.preventDefault();

        const mainWidget = this.getMainWidget() as DataViewer;
        mainWidget.getPlot().insertTrace(index, "");

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };

    updateWidgetChannelName = (event: any, index: number, newName: string) => {
        event?.preventDefault();

        const mainWidget = this.getMainWidget() as DataViewer;
        mainWidget.getChannelNamesLevel0()[index] = newName;
        mainWidget.processChannelNames();
        // mainWidget.getRawChannelNames()[index] = newName;
        // mainWidget.expandAndExtractChannelNames();


        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };

    updateWidgetShowTrace = (event: any, index: number, showTrace: boolean) => {
        // no prevent default

        // const mainWidget = this.getMainWidget() as DataViewer;
        if (showTrace === true) {
            this.showTrace(index);
        } else {
            this.hideTrace(index);
        }

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };

    updateWidgetLineColor = (event: any, propertyName: string, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        if (event) {
            event.preventDefault();
        }

        const mainWidget = this.getMainWidget() as DataViewer;

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

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };


    // change this.data[index].visible
    hideTrace = (index: number) => {
        const yAxis = (this.getMainWidget() as DataViewer).getYAxes()[index];
        if (yAxis !== undefined) {
            yAxis.show = false;
        }
    };

    showTrace = (index: number) => {
        const yAxis = (this.getMainWidget() as DataViewer).getYAxes()[index];
        if (yAxis !== undefined) {
            yAxis.show = true;
        }
    };


}
