import * as React from "react";
import { ScaledSlider } from "./ScaledSlider";
import { BaseWidgetSidebar } from "../BaseWidget/BaseWidgetSidebar";
import { SidebarScaledSliderNumTickIntervals } from "../../helperWidgets/SidebarComponents/SidebarScaledSliderNumTickIntervals";
import { SidebarTankShowLabels } from "../../helperWidgets/SidebarComponents/SidebarTankShowLabels";
import { SidebarScaledSliderCompactScale } from "../../helperWidgets/SidebarComponents/SidebarScaledSliderCompactScale";
import { SidebarScaledSliderSliderBarBackgroundColor } from "../../helperWidgets/SidebarComponents/SidebarScaledSliderSliderBarBackgroundColor"
import { SidebarScaledSliderSliderBarBackgroundColor1 } from "../../helperWidgets/SidebarComponents/SidebarScaledSliderSliderBarBackgroundColor1"
import {Log} from "../../../mainProcess/log/Log";
import { calcSidebarWidth, g_widgets1 } from "../../global/GlobalVariables";

export class ScaledSliderSidebar extends BaseWidgetSidebar {
    _sidebarScaledSliderNumTickIntervals: SidebarScaledSliderNumTickIntervals;
    _sidebarTankShowLabels: SidebarTankShowLabels;
    _sidebarScaledSliderCompactScale: SidebarScaledSliderCompactScale;
    _sidebarScaledSliderSliderBarBackgroundColor: SidebarScaledSliderSliderBarBackgroundColor;
    _sidebarScaledSliderSliderBarBackgroundColor1: SidebarScaledSliderSliderBarBackgroundColor1;

    constructor(scaledSlider: ScaledSlider) {
        super(scaledSlider);
        this._sidebarScaledSliderNumTickIntervals = new SidebarScaledSliderNumTickIntervals(this);
        this._sidebarTankShowLabels = new SidebarTankShowLabels(this);
        this._sidebarScaledSliderCompactScale = new SidebarScaledSliderCompactScale(this);
        this._sidebarScaledSliderSliderBarBackgroundColor = new SidebarScaledSliderSliderBarBackgroundColor(this);
        this._sidebarScaledSliderSliderBarBackgroundColor1 = new SidebarScaledSliderSliderBarBackgroundColor1(this);
    }

    getSidebarTankShowLabels = () => {
        return this._sidebarTankShowLabels;
    }

    getSidebarScaledSliderNumTickIntervals = () => {
        return this._sidebarScaledSliderNumTickIntervals;
    }

    getSidebarScaledSliderCompactScale = () => {
        return this._sidebarScaledSliderCompactScale;
    }

    getSidebarScaledSliderSliderBarBackgroundColor = () => {
        return this._sidebarScaledSliderSliderBarBackgroundColor;
    }

    getSidebarScaledSliderSliderBarBackgroundColor1 = () => {
        return this._sidebarScaledSliderSliderBarBackgroundColor1;
    }

    // ------------------------------------- elements --------------------------------------
    // mockup definition to let TypeScript stop complaining
    updateFromWidget = (event: any, propertyName: string, propertyValue: number | string | number[] | string[] | boolean): void => { };

    // override
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
                <h3>Scaled Slider</h3>
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
                    {this.getSidebarNumberScale().getElement()}
                    {this.getSidebarNumberFormat().getElement()}
                    {this.getSidebarAlarmText().getElement()}
                    {this.getSidebarAlarmFill().getElement()}
                    {this.getSidebarAlarmBackground().getElement()}
                    {this.getSidebarAlarmBorder().getElement()}
                    {this.getSidebarAlarmLevel().getElement()}
                </this._BlockBody>
                <this._HorizontalLine />
                {/* ---------------- ticks -------------------------- */}
                <this._BlockTitle>
                    <b>Ticks</b>
                </this._BlockTitle>
                <this._BlockBody>
                    {this.getSidebarScaledSliderNumTickIntervals().getElement()}
                    {this.getSidebarScaledSliderCompactScale().getElement()}
                    {this.getSidebarTankShowLabels().getElement()}
                    {this.getSidebarMaxPvValue().getElement()}
                    {this.getSidebarMinPvValue().getElement()}
                    {this.getSidebarUsePvLimits().getElement()}
                    {this.getSidebarWidgetAppearance().getElement()}
                </this._BlockBody>
                <this._HorizontalLine />
                {/* ---------------- value -------------------------- */}
                <this._BlockTitle>
                    <b>Value</b>
                </this._BlockTitle>
                <this._BlockBody>
                    {this.getSidebarShowPvValue().getElement()}
                    {this.getSidebarStepSize().getElement()}
                    {this.getSidebarShowUnit().getElement()}
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
                {/* ----------------------- fill area --------------------------- */}
                <this._BlockTitle>
                    <b>Fill</b>
                </this._BlockTitle>
                <this._BlockBody>
                    {/* color */}
                    {this.getSidebarFillColor().getElement()}
                </this._BlockBody>
                <this._HorizontalLine />
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

    // ------------------------- style -------------------------

    // defined in super class
    // _style
    // _inputStyle
    // _formStyle
}
