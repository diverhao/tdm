import { DataViewer } from "./DataViewer";
import { settingsIndexChoices } from "./DataViewerPlot"
import * as React from "react";
import { GlobalVariables } from "../../../common/GlobalVariables";
import { ElementRectangleButton } from "../../helperWidgets/SharedElements/RectangleButton";
import { DataViewerSidebar } from "./DataViewerSidebar";

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
                    paddingTop: 30,
                    display: "inline-flex",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    boxSizing: "border-box",
                    flexDirection: "column",
                    border: "none",
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
                    <div style={{
                        width: "45%",
                    }}>
                        <div
                            style={{
                                width: "50%",
                                display: "inline-flex",
                                flexDirection: "row",
                            }}
                        >
                            {this.getSidebar()?.getSidebarBackgroundColor_setting_page().getElement(false)}
                        </div>
                        {this.getSidebar()?.getSidebarPeriod_setting_page().getElement(false)}
                        {this.getSidebar()?.getSidebarMouseWheelZoomFactor_setting_page().getElement(false)}
                        {this.getSidebar()?.getSidebarFontFamily_setting_page().getElement(false)}
                        {this.getSidebar()?.getSidebarFontSize_setting_page().getElement(false)}
                        {this.getSidebar()?.getSidebarFontWeight_setting_page().getElement(false)}
                        {this.getSidebar()?.getSidebarFontStyle_setting_page().getElement(false)}
                    </div>
                </div>
                <this._ElementSettingsOKButton></this._ElementSettingsOKButton>
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
        return this.getMainWidget().getSidebar() as DataViewerSidebar;
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
}
