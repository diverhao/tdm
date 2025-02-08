import * as React from "react";
import { Thermometer } from "./Thermometer";
import { BaseWidgetSidebar } from "../BaseWidget/BaseWidgetSidebar";

import { SidebarProgressBarBackgroundColor } from "../../helperWidgets/SidebarComponents/SidebarProgressbarBackgroundColor";
import { SidebarTankShowLabels } from "../../helperWidgets/SidebarComponents/SidebarTankShowLabels";
import { SidebarThermometerBulbDiameter } from "../../helperWidgets/SidebarComponents/SidebarThermometerBulbDiameter";
import { SidebarThermometerTubeWidth } from "../../helperWidgets/SidebarComponents/SidebarThermometerTubeWidth";
import { SidebarScaledSliderNumTickIntervals } from "../../helperWidgets/SidebarComponents/SidebarScaledSliderNumTickIntervals";
import { SidebarScaledSliderCompactScale } from "../../helperWidgets/SidebarComponents/SidebarScaledSliderCompactScale";
import { SidebarDisplayScale } from "../../helperWidgets/SidebarComponents/SidebarDisplayScale";
import {Log} from "../../../mainProcess/log/Log";
import { calcSidebarWidth, g_widgets1 } from "../../global/GlobalVariables";

export class ThermometerSidebar extends BaseWidgetSidebar {
    _sidebarProgressBarBackgroundColor: SidebarProgressBarBackgroundColor;
    _sidebarTankShowLabels: SidebarTankShowLabels;
    _sidebarThermometerBulbDiameter: SidebarThermometerBulbDiameter;
    _sidebarThermometerTubeWidth: SidebarThermometerTubeWidth;
    _sidebarScaledSliderNumTickIntervals: SidebarScaledSliderNumTickIntervals;
    _sidebarScaledSliderCompactScale: SidebarScaledSliderCompactScale;
    _sidebarDisplayScale: SidebarDisplayScale;

    constructor(thermometer: Thermometer) {
        super(thermometer);
        this._sidebarProgressBarBackgroundColor = new SidebarProgressBarBackgroundColor(this);
        this._sidebarTankShowLabels = new SidebarTankShowLabels(this);
        this._sidebarThermometerBulbDiameter = new SidebarThermometerBulbDiameter(this);
        this._sidebarThermometerTubeWidth = new SidebarThermometerTubeWidth(this);
        this._sidebarScaledSliderNumTickIntervals = new SidebarScaledSliderNumTickIntervals(this);
        this._sidebarScaledSliderCompactScale = new SidebarScaledSliderCompactScale(this);
        this._sidebarDisplayScale = new SidebarDisplayScale(this);
    }

    // ------------------------------------- elements --------------------------------------
    // mockup definition to let TypeScript stop complaining
    updateFromWidget = (event: any, propertyName: string, propertyValue: number | string | number[] | string[] | boolean): void => { };

    _Element = (): JSX.Element => {
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

        // formally defined in main widget, actually defined in sidebar, invoked from main widget
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
                <h3>Tank</h3>
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
                {/* ---------------- channel -------------------------- */}
                <this._BlockTitle>
                    <b>Channel</b>
                </this._BlockTitle>
                <this._BlockBody>
                    {this.getSidebarChannelName().getElement()}
                    {this.getSidebarInvisibleInOperation().getElement()}
                    {this.getSidebarNumberFormat().getElement()}
                </this._BlockBody>
                <this._HorizontalLine />
                {/* ---------------- font -------------------------- */}
                <this._BlockTitle>
                    <b>Font</b>
                </this._BlockTitle>
                <this._BlockBody>
                    {/* {this.getSidebarShowUnit().getElement()} */}
                    {/* {this.getSidebarNumberScale().getElement()} */}
                    {this.getSidebarFontFamily().getElement()}
                    {this.getSidebarFontSize().getElement()}
                    {this.getSidebarFontStyle().getElement()}
                    {this.getSidebarFontWeight().getElement()}
                    {this.getSidebarTextColor().getElement()}
                </this._BlockBody>
                <this._HorizontalLine />
                {/* ---------------- background -------------------------- */}
                <this._BlockTitle>
                    <b>Background</b>
                </this._BlockTitle>
                <this._BlockBody>
                    {/* color */}
                    {this.getSidebarBackgroundColor().getElement()}
                </this._BlockBody>
                <this._HorizontalLine />
                {/* ---------------- container -------------------------- */}
                <this._BlockTitle>
                    <b>Container</b>
                </this._BlockTitle>
                <this._BlockBody>
                    {this.getSidebarProgressBarBackgroundColor().getElement()}
                    {this.getSidebarThermometerTubeWidth().getElement()}
                    {this.getSidebarThermometerBulbDiameter().getElement()}
                </this._BlockBody>
                <this._HorizontalLine />
                {/* ---------------- mercury -------------------------- */}
                <this._BlockTitle>
                    <b>Mercury</b>
                </this._BlockTitle>
                <this._BlockBody>
                    {this.getSidebarFillColor().getElement()}
                    {this.getSidebarFillColorMinor().getElement()}
                    {this.getSidebarFillColorMajor().getElement()}
                    {this.getSidebarFillColorInvalid().getElement()}
                </this._BlockBody>
                <this._HorizontalLine />

                {/* ---------------- ticks -------------------- */}
                <this._BlockTitle>
                    <b>Ticks</b>
                </this._BlockTitle>
                <this._BlockBody>
                    {this.getSidebarScaledSliderNumTickIntervals().getElement()}
                    {this.getSidebarScaledSliderCompactScale().getElement()}
                    {this.getSidebarTankShowLabels().getElement()}
                    {this.getSidebarMinPvValue().getElement()}
                    {this.getSidebarMaxPvValue().getElement()}
                    {this.getSidebarUsePvLimits().getElement()}
                    {this.getSidebarDisplayScale().getElement()}
                </this._BlockBody>
                <this._HorizontalLine />
                {/* ---------------- border -------------------------- */}
                <this._BlockTitle>
                    <b>Border</b>
                </this._BlockTitle>
                <this._BlockBody>
                    {this.getSidebarBorderWidth().getElement()}
                    {this.getSidebarBorderColor().getElement()}
                    {this.getSidebarAlarmBorder().getElement()}
                </this._BlockBody>{" "}
                <this._HorizontalLine />
                {/* ------------------------- rules ---------------------------- */}
                {this.getMainWidget().getRules()?.getElement()}
                <this._HorizontalLine />
                {/* ------------------------- widgets list ---------------------------- */}
                {this.getSidebarWidgetsList().getElement()}
                <this._HorizontalLine />
            </div>
        );
    };

    // defined in super class
    // getElement()
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

    getSidebarProgressBarBackgroundColor = () => {
        return this._sidebarProgressBarBackgroundColor;
    };

    getSidebarTankShowLabels = () => {
        return this._sidebarTankShowLabels;
    };

    getSidebarThermometerBulbDiameter = () => {
        return this._sidebarThermometerBulbDiameter;
    };

    getSidebarThermometerTubeWidth = () => {
        return this._sidebarThermometerTubeWidth;
    };

    getSidebarScaledSliderNumTickIntervals = () => {
        return this._sidebarScaledSliderNumTickIntervals;
    }

    getSidebarScaledSliderCompactScale = () => {
        return this._sidebarScaledSliderCompactScale;
    }

    getSidebarDisplayScale = () => {
        return this._sidebarDisplayScale;
    }

    // ------------------------- style -------------------------

    // defined in super class
    // _style
    // _inputStyle
    // _formStyle
}
