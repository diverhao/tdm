import * as React from "react";
import { Meter } from "./Meter";
import { BaseWidgetSidebar } from "../BaseWidget/BaseWidgetSidebar";
import { SidebarProgressBarBackgroundColor } from "../../helperWidgets/SidebarComponents/SidebarProgressbarBackgroundColor";
import { SidebarMeterAngleRange } from "../../helperWidgets/SidebarComponents/SidebarMeterAngleRange";
import { SidebarMeterPointerColor } from "../../helperWidgets/SidebarComponents/SidebarMeterPointerColor";
import { SidebarMeterDialColor } from "../../helperWidgets/SidebarComponents/SidebarMeterDialColor";
import { SidebarMeterDialThickness } from "../../helperWidgets/SidebarComponents/SidebarMeterDialThickness";
import { SidebarMeterDialPercentage } from "../../helperWidgets/SidebarComponents/SidebarMeterDialPercentage";
import { SidebarMeterPointerThickness } from "../../helperWidgets/SidebarComponents/SidebarMeterPointerThickness";
import { SidebarMeterDialLabelPositionPercentage } from "../../helperWidgets/SidebarComponents/SidebarMeterLabelPositionPercentage";
import { SidebarMeterPointerLengthPercentage } from "../../helperWidgets/SidebarComponents/SidebarMeterPointerLengthPercentage";
import { SidebarScaledSliderNumTickIntervals } from "../../helperWidgets/SidebarComponents/SidebarScaledSliderNumTickIntervals";

import {Log} from "../../../mainProcess/log/Log";
import { calcSidebarWidth, g_widgets1 } from "../../global/GlobalVariables";

export class MeterSidebar extends BaseWidgetSidebar {
    _sidebarProgressBarBackgroundColor: SidebarProgressBarBackgroundColor;
    _sidebarMeterAngleRange: SidebarMeterAngleRange;
    _sidebarMeterPointerColor: SidebarMeterPointerColor;
    _sidebarMeterDialColor: SidebarMeterDialColor;
    _sidebarMeterDialThickness: SidebarMeterDialThickness;
    _sidebarMeterDialPercentage: SidebarMeterDialPercentage;
    _sidebarMeterPointerThickness: SidebarMeterPointerThickness;
    _sidebarMeterDialLabelPositionPercentage: SidebarMeterDialLabelPositionPercentage;
    _sidebarMeterPointerLengthPercentage: SidebarMeterPointerLengthPercentage;
    _sidebarScaledSliderNumTickIntervals: SidebarScaledSliderNumTickIntervals;

    constructor(meter: Meter) {
        super(meter);
        this._sidebarProgressBarBackgroundColor = new SidebarProgressBarBackgroundColor(this);
        this._sidebarMeterAngleRange = new SidebarMeterAngleRange(this);
        this._sidebarMeterPointerColor = new SidebarMeterPointerColor(this);
        this._sidebarMeterDialColor = new SidebarMeterDialColor(this);
        this._sidebarMeterDialThickness = new SidebarMeterDialThickness(this);
        this._sidebarMeterDialPercentage = new SidebarMeterDialPercentage(this);
        this._sidebarMeterPointerThickness = new SidebarMeterPointerThickness(this);
        this._sidebarMeterDialLabelPositionPercentage = new SidebarMeterDialLabelPositionPercentage(this);
        this._sidebarMeterPointerLengthPercentage = new SidebarMeterPointerLengthPercentage(this);
        this._sidebarScaledSliderNumTickIntervals = new SidebarScaledSliderNumTickIntervals(this);
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
                <h3>Meter</h3>
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
                    {this.getSidebarAlarmText().getElement()}
                    {this.getSidebarAlarmPointer().getElement()}
                    {this.getSidebarAlarmDial().getElement()}
                    {this.getSidebarAlarmBackground().getElement()}
                    {this.getSidebarAlarmBorder().getElement()}
                    {this.getSidebarAlarmLevel().getElement()}
                    {this.getSidebarInvisibleInOperation().getElement()}
                </this._BlockBody>
                <this._HorizontalLine />
                {/* ---------------- font -------------------------- */}
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
                {/* ---------------- value -------------------------- */}
                <this._BlockTitle>
                    <b>Value</b>
                </this._BlockTitle>
                <this._BlockBody>
                    {this.getSidebarShowPvValue().getElement()}
                    {this.getSidebarMinPvValue().getElement()}
                    {this.getSidebarMaxPvValue().getElement()}
                    {this.getSidebarUsePvLimits().getElement()}
                    {this.getSidebarShowUnit().getElement()}
                    {this.getSidebarNumberScale().getElement()}
                    {this.getSidebarNumberFormat().getElement()}
                </this._BlockBody>
                {/* ---------------- background -------------------------- */}
                <this._BlockTitle>
                    <b>Background</b>
                </this._BlockTitle>
                <this._BlockBody>
                    {/* color */}
                    {this.getSidebarBackgroundColor().getElement()}
                </this._BlockBody>
                <this._HorizontalLine />
                {/* ---------------- text -------------------------- */}
                {/* ----------------- dial ----------------------- */}
                <this._BlockTitle>
                    <b>Dial</b>
                </this._BlockTitle>
                <this._BlockBody>
                    {this.getSidebarMeterAngleRange().getElement()}
                    {this.getSidebarMeterDialPercentage().getElement()}
                    {this.getSidebarMeterDialThickness().getElement()}
                    {this.getSidebarMeterDialColor().getElement()}
                    {this.getSidebarMeterDialLabelPositionPercentage().getElement()}
                    {this.getSidebarScaledSliderNumTickIntervals().getElement()}

                </this._BlockBody>{" "}
                <this._HorizontalLine />
                {/* -------------------- pointer----------------------- */}
                <this._BlockTitle>
                    <b>Pointer</b>
                </this._BlockTitle>
                <this._BlockBody>
                    {this.getSidebarMeterPointerLengthPercentage().getElement()}
                    {this.getSidebarMeterPointerThickness().getElement()}
                    {this.getSidebarMeterPointerColor().getElement()}
                    {/* {this.getSidebarFillColorMinor().getElement()}
                    {this.getSidebarFillColorMajor().getElement()}
                    {this.getSidebarFillColorInvalid().getElement()} */}

                </this._BlockBody>
                <this._HorizontalLine />
                {/* ---------------- border -------------------------- */}
                <this._BlockTitle>
                    <b>Border</b>
                </this._BlockTitle>
                <this._BlockBody>
                    {this.getSidebarBorderWidth().getElement()}
                    {this.getSidebarBorderColor().getElement()}
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

    getSidebarMeterAngleRange = () => {
        return this._sidebarMeterAngleRange;
    };

    getSidebarMeterPointerColor = () => {
        return this._sidebarMeterPointerColor;
    };

    getSidebarMeterDialColor = () => {
        return this._sidebarMeterDialColor;
    };

    getSidebarMeterDialThickness = () => {
        return this._sidebarMeterDialThickness;
    };

    getSidebarMeterDialPercentage = () => {
        return this._sidebarMeterDialPercentage;
    };

    getSidebarMeterPointerThickness = () => {
        return this._sidebarMeterPointerThickness;
    };

    getSidebarMeterDialLabelPositionPercentage = () => {
        return this._sidebarMeterDialLabelPositionPercentage;
    };

    getSidebarMeterPointerLengthPercentage = () => {
        return this._sidebarMeterPointerLengthPercentage;
    };

    getSidebarScaledSliderNumTickIntervals = () => {
        return this._sidebarScaledSliderNumTickIntervals;
    }

    // ------------------------- style -------------------------

    // defined in super class
    // _style
    // _inputStyle
    // _formStyle
}
