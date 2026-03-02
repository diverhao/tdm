import { DataViewer } from "./DataViewer";
import {settingsIndexChoices} from "./DataViewerPlot"
import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { GlobalVariables } from "../../../common/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { CollapsibleWithoutTitle } from "../../helperWidgets/ColorPicker/Collapsible";
import { Log } from "../../../common/Log";
import * as GlobalMethods from "../../../common/GlobalMethods";
import { ElementRectangleButton } from "../../helperWidgets/SharedElements/RectangleButton";

export class DataViewerMainSettings {
    _mainWidget: DataViewer;
    constructor(mainWidget: DataViewer) {
        this._mainWidget = mainWidget;
    }

    _Element = () => {
        const index = this.getPlot().getMainWidget().getSettingsIndex();

        if (index !== settingsIndexChoices.MAIN) {
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
                    <div
                        style={{
                            display: "inline-flex",
                            padding: 5,
                            fontWeight: "bold",
                            alignItems: "center",
                            flexDirection: "row",
                        }}
                    >
                        Appearance
                    </div>
                    <this._ElementBackgroundColor></this._ElementBackgroundColor>
                    <this._ElementPeriod></this._ElementPeriod>
                    <this._ElementZoomFactor></this._ElementZoomFactor>
                    <this._ElementFontFamily></this._ElementFontFamily>
                    <this._ElementFontSize></this._ElementFontSize>
                    <this._ElementFontWeight></this._ElementFontWeight>
                    <this._ElementFontStyle></this._ElementFontStyle>
                </div>
                <this._ElementSettingsOKButton></this._ElementSettingsOKButton>
            </div>
        )
    }

    _ElementBackgroundColor = () => {
        const [showCollapsible, setShowCollapsible] = React.useState<boolean>(false);
        const elementRefBackgroundColor = React.useRef<HTMLDivElement>(null);

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
                    Background color
                </div>
                <div
                    style={{
                        display: "inline-flex",
                        flexGrow: 1
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
                                updateFromSidebar={(_event: React.SyntheticEvent | null | undefined, propertyName: string, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
                                    this.updateBackgroundColor(undefined, propertyValue);
                                }}

                                title={" "}
                                eventName={`background-color`}
                            />
                        </div>
                    ) : null}

                </div>
            </div>
        )
    }



    /**
     * one numeric value
     */
    _ElementPeriod = () => {
        // always string
        const mainWidget = this.getMainWidget();
        const text = mainWidget.getAllText();
        const [value, setValue] = React.useState(`${text["updatePeriod"]}`);

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
                    Update period
                </div>
                <form
                    style={{
                        display: "inline-flex",
                        flexGrow: 1,
                    }}
                    spellCheck={false}
                    onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                        event.preventDefault();
                        const orig = text["updatePeriod"];
                        const valueNum = parseFloat(value);
                        if (!isNaN(valueNum)) {
                            (text["updatePeriod"] as any) = valueNum;

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
                            const orig = `${text["updatePeriod"]}`;
                            if (orig !== value) {
                                setValue(orig);
                            }
                        }}
                    ></input>
                </form>
            </div>


        );
    };


    _ElementZoomFactor = () => {
        const [zoomFactor, setZoomFactor] = React.useState(`${this.getMainWidget().getText()["axisZoomFactor"]}`);
        const rawFactors = ["1.1", "1.25", "1.5", "1.75", "2"];
        const factors = React.useRef<string[]>(rawFactors.includes(zoomFactor) ? rawFactors : [zoomFactor, ...rawFactors]);
        const text = this.getMainWidget().getText();
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
                    Mouse wheel zoom factor
                </div>
                <form
                    style={{
                        display: "inline-flex",
                        flexGrow: 1,
                    }}
                    onSubmit={(event) => {
                        event.preventDefault();
                    }}
                >
                    <select
                        value={zoomFactor}
                        onChange={(event) => {
                            const newFactor = event.target.value;
                            setZoomFactor(newFactor);
                            text["axisZoomFactor"] = parseFloat(newFactor);
                        }}
                    >
                        {factors.current.map((factor: string, index: number) => {
                            return (
                                <option value={factor}>
                                    {factor}
                                </option>
                            )
                        })}
                    </select>
                </form>
            </div>
        )
    }


    _ElementFontFamily = () => {
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
                    Font family
                </div>
                <div
                    style={{
                        display: "inline-flex",
                        flexGrow: 1,
                    }}

                >
                    {this.getSidebar()?.getSidebarFontFamily().getElement(true)}
                </div>
            </div>
        )
    }

    _ElementFontSize = () => {
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
                    Font size
                </div>
                <div
                    style={{
                        display: "inline-flex",
                        flexGrow: 1,
                    }}

                >
                    {this.getSidebar()?.getSidebarFontSize().getElement(true)}
                </div>
            </div>
        )
    }

    _ElementFontWeight = () => {
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
                    Font weight
                </div>
                <div
                    style={{
                        display: "inline-flex",
                        flexGrow: 1,
                    }}

                >
                    {this.getSidebar()?.getSidebarFontWeight().getElement(true)}
                </div>
            </div>
        )
    }

    _ElementFontStyle = () => {
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
                    Font style
                </div>
                <div
                    style={{
                        display: "inline-flex",
                        flexGrow: 1,
                    }}

                >
                    {this.getSidebar()?.getSidebarFontStyle().getElement(true)}
                </div>
            </div>
        )
    }

    _ElementSettingsOKButton = () => {
        return (
            <ElementRectangleButton
                marginTop={10}
                marginBottom={10}
                handleClick={() => {
                    this.getMainWidget().setSettingsIndex(settingsIndexChoices.NONE);
                    this.updatePlot();
                }}
            >
                OK
            </ElementRectangleButton>
        )
    }


    // ----------------- getters and helper functions ----------------------

    getMainWidget = () => {
        return this._mainWidget;
    };

    getElement = () => {
        return <this._Element></this._Element>;
    };

    getSidebar = () => {
        return this.getMainWidget().getSidebar();
    };

    updatePlot = (doFlush: boolean = true) => {
        this.getMainWidget().updatePlot(doFlush);
    };

    getChannelNames = () => {
        return this.getMainWidget().getChannelNames();
    };

    getPlot = () => {
        return this.getMainWidget().getPlot();
    };




    updateBackgroundColor = (event: React.SyntheticEvent | undefined, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
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
}
