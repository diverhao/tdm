import * as React from "react";
import { Collapsible } from "../../helperWidgets/ColorPicker/Collapsible";
import { DataViewer } from "./DataViewer";
import { BaseWidgetSidebar } from "../BaseWidget/BaseWidgetSidebar";
import { SidebarDataViewerChannelNames } from "../../helperWidgets/SidebarComponents/SidebarDataViewerChannelNames";
import { Log } from "../../../common/Log";
import { g_widgets1 } from "../../global/GlobalVariables";
import { calcSidebarWidth } from "../../../common/GlobalVariables";
import { SidebarStringChoices } from "../../helperWidgets/SidebarComponents/SidebarStringChoices";
import { FontsData } from "../../global/FontsData";
import { SidebarNumberChoices } from "../../helperWidgets/SidebarComponents/SidebarNumberChoices";
import { SidebarNumberInput } from "../../helperWidgets/SidebarComponents/SidebarNumberInput";
import { SidebarColor } from "../../helperWidgets/SidebarComponents/SidebarColor";

export class DataViewerSidebar extends BaseWidgetSidebar {
    _sidebarDataViewerChannelNames: SidebarDataViewerChannelNames;
    private _sidebarFontFamily_setting_page;
    private _sidebarFontSize_setting_page;
    private _sidebarFontStyle_setting_page;
    private _sidebarFontWeight_setting_page;
    private _sidebarPeriod_setting_page;
    private _sidebarMouseWheelZoomFactor_setting_page;
    private _sidebarBackgroundColor_setting_page;

    constructor(dataViewer: DataViewer) {
        super(dataViewer);
        this._sidebarDataViewerChannelNames = new SidebarDataViewerChannelNames(this);
        const style = this.getMainWidget().getStyle();
        const text = this.getMainWidget().getText();
        const extraStyle = {
            backgroundColor: "rgba(255,255,255,1)",
            width: "40%",
            marginTop: 4,
            marginBottom: 4,
        };

        this._sidebarFontFamily_setting_page = new SidebarStringChoices(this, style, "fontFamily", "Font family", {
            "TDM Fonts": Object.fromEntries(Object.keys(FontsData.g_fonts).map((k) => [k, k])),
            "OS fonts (not recommended)": Object.fromEntries(FontsData.g_localFonts.map((k) => [k, k])),
        }, extraStyle);
        this._sidebarFontSize_setting_page = new SidebarNumberChoices(this, style, "fontSize", "Font size",
            Object.fromEntries(FontsData.g_fontSizes.map((n) => [`${n}`, n])), extraStyle
        );
        this._sidebarFontStyle_setting_page = new SidebarStringChoices(this, style, "fontStyle", "Font style", {
            "normal": "normal",
            "italic": "italic",
        }, extraStyle);
        this._sidebarFontWeight_setting_page = new SidebarStringChoices(this, style, "fontWeight", "Font weight", {
            "normal": "normal",
            "bold": "bold",
        }, extraStyle);
        this._sidebarPeriod_setting_page = new SidebarNumberInput(this, text, "updatePeriod", "Update period [s]", false,
            { ...extraStyle, width: "37.8%" }
        );
        this._sidebarMouseWheelZoomFactor_setting_page = new SidebarNumberChoices(this, text, "axisZoomFactor", "Scroll zoom factor",
            {
                "1.1": 1.1,
                "1.25": 1.25,
                "1.5": 1.5,
                "1.75": 1.75,
                "2.0": 2.0,
            },
            extraStyle
        );
        this._sidebarBackgroundColor_setting_page = new SidebarColor(this, style, "backgroundColor", "Background color");
    }

    getSidebarDataViewerChannelNames = () => {
        return this._sidebarDataViewerChannelNames;
    };

    getSidebarFontWeight_setting_page = () => {
        return this._sidebarFontWeight_setting_page;
    }

    getSidebarFontFamily_setting_page = () => {
        return this._sidebarFontFamily_setting_page;
    }

    getSidebarFontSize_setting_page = () => {
        return this._sidebarFontSize_setting_page;
    }

    getSidebarFontStyle_setting_page = () => {
        return this._sidebarFontStyle_setting_page;
    }

    getSidebarPeriod_setting_page = () => {
        return this._sidebarPeriod_setting_page;
    }

    getSidebarMouseWheelZoomFactor_setting_page = () => {
        return this._sidebarMouseWheelZoomFactor_setting_page;
    }

    getSidebarBackgroundColor_setting_page = () => {
        return this._sidebarBackgroundColor_setting_page;
    }

    _showChannelNames: boolean = false;

    // ------------------------------------- elements --------------------------------------
    // mockup definition to let TypeScript stop complaining
    updateFromWidget = (event: React.SyntheticEvent | undefined, propertyName: string, propertyValue: number | string | number[] | string[] | boolean): void => { };

    // override
    _Element = (): React.JSX.Element => {
        // when we move the widget out of vertical range, the sidebar width is not calculated correctly due to the asynchronous 
        // calculation of window size, 
        // check the window vertical scrollbar width one more time to have a correct sidebar width
        const [sidebarWidthUpdater, setSidebarWidthUpdater] = React.useState<number>(calcSidebarWidth());
        React.useEffect(() => {
            if (sidebarWidthUpdater !== calcSidebarWidth()) {
                setSidebarWidthUpdater(calcSidebarWidth());
                g_widgets1.updateSidebar(true);
            }
        })

        // defined in sidebar, invoked from main widget
        const _updateFromWidget = React.useCallback(
            (event: React.SyntheticEvent | undefined, propertyName: string, propertyValue: number | string | number[] | string[] | boolean): void => {
                switch (propertyName) {
                    case "left":
                        this.getSidebarX().getUpdateFromWidget()(propertyValue as number);
                        break;
                    case "top":
                        this.getSidebarY().getUpdateFromWidget()(propertyValue as number);
                        break;
                    case "width":
                        this.getSidebarWidth().getUpdateFromWidget()(propertyValue as number);
                        break;
                    case "height":
                        this.getSidebarHeight().getUpdateFromWidget()(propertyValue as number);
                        break;
                    default:
                        Log.error("Unknown property from sidebar: ", propertyName);
                }
            },
            []
        );
        // update every time
        this.updateFromWidget = _updateFromWidget;

        return (
            <div style={{ ...this.getStyle() }}
                onMouseDown={this.handleMouseDown}
            >
                <h3>Data Viewer</h3>
                {/* ---------------- positions -------------------------- */}
                <this._BlockTitle>
                    <b>Position</b>
                </this._BlockTitle>
                <this._BlockBody>
                    {this.getSidebarX().getElement()}
                    {this.getSidebarY().getElement()}
                    {this.getSidebarWidth().getElement()}
                    {this.getSidebarHeight().getElement()}
                    {this.getSidebarAngle().getElement()}
                </this._BlockBody>
                <this._HorizontalLine />
                {/* --------------------- background color ------------------ */}
                <this._BlockTitle>
                    <b>Background</b>
                </this._BlockTitle>
                <this._BlockBody>{this.getSidebarBackgroundColor().getElement()}</this._BlockBody>
                <this._HorizontalLine />
                {/* ---------------- channel -------------------------- */}
                {this.getSidebarDataViewerChannelNames().getElement()}
                <this._HorizontalLine />
                {/* ---------------- text -------------------------- */}
                {/* ----------------------- font --------------------------- */}
                <this._BlockTitle>
                    <b>Font</b>
                </this._BlockTitle>
                <this._BlockBody>
                    {this.getSidebarFontFamily().getElement()}
                    {this.getSidebarFontSize().getElement()}
                    {this.getSidebarFontStyle().getElement()}
                    {this.getSidebarFontWeight().getElement()}
                </this._BlockBody>
                <this._HorizontalLine />
                {/* ---------------- border -------------------------- */}
                <this._BlockTitle>
                    <b>Border</b>
                </this._BlockTitle>
                <this._BlockBody>
                    {this.getSidebarOverflowVisible().getElement()}
                    {this.getSidebarBorderWidth().getElement()}
                    {this.getSidebarBorderColor().getElement()}
                </this._BlockBody>{" "}
                <this._HorizontalLine />
                {/* ------------------------- widgets list ---------------------------- */}
                {this.getSidebarWidgetsList().getElement()}
                <this._HorizontalLine />
            </div>
        );
    };

    // defined in super class
    // _HorizontalLine()
    // _BlockBody()
    // _BlockTitle()

    // ---------------------- getters --------------------------

    // defined in super class
    // getWidgetKey()
    // getMainWidget()
    // getUpdateFromSidebar()
    // getStyle()
    // getFormStyle()
    // getInputStyle()

    // ------------------------- style -------------------------

    // defined in super class
    // _style
    // _inputStyle
    // _formStyle
}
