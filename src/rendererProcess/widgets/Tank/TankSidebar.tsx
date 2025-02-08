import * as React from "react";
import { Tank } from "./Tank";
import { BaseWidgetSidebar } from "../BaseWidget/BaseWidgetSidebar";

import { SidebarProgressBarBackgroundColor } from "../../helperWidgets/SidebarComponents/SidebarProgressbarBackgroundColor";
import { SidebarScaledSliderNumTickIntervals } from "../../helperWidgets/SidebarComponents/SidebarScaledSliderNumTickIntervals";
// import { SidebarScaledSliderShowScale } from "../../helperWidgets/SidebarComponents/SidebarScaledSliderShowScale";
import { SidebarTankShowLabels } from "../../helperWidgets/SidebarComponents/SidebarTankShowLabels";
import { SidebarScaledSliderCompactScale } from "../../helperWidgets/SidebarComponents/SidebarScaledSliderCompactScale";
import { SidebarTankScalePosition } from "../../helperWidgets/SidebarComponents/SidebarTankScalePosition";
import { SidebarTankShowScaleInnerLabel } from "../../helperWidgets/SidebarComponents/SidebarTankShowScaleInnerLabel";
import { SidebarDisplayScale } from "../../helperWidgets/SidebarComponents/SidebarDisplayScale";
import {Log} from "../../../mainProcess/log/Log";
import { calcSidebarWidth, g_widgets1 } from "../../global/GlobalVariables";

export class TankSidebar extends BaseWidgetSidebar {
    _sidebarProgressBarBackgroundColor: SidebarProgressBarBackgroundColor;
    _sidebarScaledSliderNumTickIntervals: SidebarScaledSliderNumTickIntervals;
    _sidebarTankShowLabels: SidebarTankShowLabels;
    // _sidebarScaledSliderShowScale: SidebarScaledSliderShowScale;
    _sidebarScaledSliderCompactScale: SidebarScaledSliderCompactScale;
    _sidebarTankScalePosition: SidebarTankScalePosition;
    _sidebarTankShowScaleInnerLabel: SidebarTankShowScaleInnerLabel;
    _sidebarDisplayScale: SidebarDisplayScale;

    constructor(tank: Tank) {
        super(tank);
        this._sidebarProgressBarBackgroundColor = new SidebarProgressBarBackgroundColor(this);
        this._sidebarScaledSliderNumTickIntervals = new SidebarScaledSliderNumTickIntervals(this);
        this._sidebarTankShowLabels = new SidebarTankShowLabels(this);
        // this._sidebarScaledSliderShowScale = new SidebarScaledSliderShowScale(this);
        this._sidebarScaledSliderCompactScale = new SidebarScaledSliderCompactScale(this);
        this._sidebarTankScalePosition = new SidebarTankScalePosition(this);
        this._sidebarTankShowScaleInnerLabel = new SidebarTankShowScaleInnerLabel(this);
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
                {/* ---------------- tank -------------------------- */}
                <this._BlockTitle>
                    <b>Tank</b>
                </this._BlockTitle>
                <this._BlockBody>
                    {this.getSidebarProgressBarBackgroundColor().getElement()}
                </this._BlockBody>
                <this._HorizontalLine />
                {/* ---------------- water -------------------------- */}
                <this._BlockTitle>
                    <b>Water</b>
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
                    {this.getSidebarTankShowScaleInnerLabel().getElement()}
                    {this.getSidebarTankScalePosition().getElement()}
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


    getSidebarScaledSliderNumTickIntervals = () => {
        return this._sidebarScaledSliderNumTickIntervals;
    }

    // getSidebarScaledSliderShowScale = () => {
    //     return this._sidebarScaledSliderShowScale;
    // }
    getSidebarTankShowLabels = () => {
        return this._sidebarTankShowLabels;
    }

    getSidebarScaledSliderCompactScale = () => {
        return this._sidebarScaledSliderCompactScale;
    }

    getSidebarTankScalePosition = () => {
        return this._sidebarTankScalePosition;
    }

    getSidebarTankShowScaleInnerLabel = () => {
        return this._sidebarTankShowScaleInnerLabel;
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
