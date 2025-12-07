import * as React from "react";
import { XYPlot } from "./XYPlot";
import { BaseWidgetSidebar } from "../BaseWidget/BaseWidgetSidebar";
import { SidebarDataViewerChannelNames } from "../../helperWidgets/SidebarComponents/SidebarDataViewerChannelNames";
import { SidebarXYPlotYAxes } from "../../helperWidgets/SidebarComponents/SidebarXYPlotYAxes";
import { SidebarXYPlotXAxis } from "../../helperWidgets/SidebarComponents/SidebarXYPlotXAxis";
import {Log} from "../../../common/Log";
import { calcSidebarWidth, g_widgets1 } from "../../global/GlobalVariables";

export class XYPlotSidebar extends BaseWidgetSidebar {
    _sidebarDataViewerChannelNames: SidebarDataViewerChannelNames;
    _sidebarXYPlotYAxes: SidebarXYPlotYAxes;
    _sidebarXYPlotXAxis: SidebarXYPlotXAxis;
    constructor(dataViewer: XYPlot) {
        super(dataViewer);
        this._sidebarDataViewerChannelNames = new SidebarDataViewerChannelNames(this);
        this._sidebarXYPlotYAxes = new SidebarXYPlotYAxes(this);
        this._sidebarXYPlotXAxis = new SidebarXYPlotXAxis(this);
    }

    getYAxes = () => {
        return this.getSidebarXYPlotYAxes().yAxes;
    };

    getSidebarDataViewerChannelNames = () => {
        return this._sidebarDataViewerChannelNames;
    };

    getSidebarXYPlotYAxes = () => {
        return this._sidebarXYPlotYAxes;
    };

    getSidebarXYPlotXAxis = () => {
        return this._sidebarXYPlotXAxis;
    };

    _showChannelNames: boolean = false;

    // ------------------------------------- elements --------------------------------------
    // mockup definition to let TypeScript stop complaining
    updateFromWidget = (event: any, propertyName: string, propertyValue: number | string | number[] | string[] | boolean): void => { };

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
            (event: any, propertyName: string, propertyValue: number | string | number[] | string[] | boolean): void => {
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
                <h3>XY Plot</h3>
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
                <this._BlockBody>
                    {this.getSidebarBackgroundColor().getElement()}
                    {this.getSidebarShowLegend().getElement()}
                </this._BlockBody>
                <this._HorizontalLine />
                {/* ---------------- channel -------------------------- */}
                {this.getSidebarXYPlotXAxis().getElement()}
                {this.getSidebarXYPlotYAxes().getElement()}
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
                    {this.getSidebarTextColor().getElement()}
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
