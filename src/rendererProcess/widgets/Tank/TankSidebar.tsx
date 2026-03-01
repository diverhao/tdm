import * as React from "react";
import { Tank } from "./Tank";
import { BaseWidgetSidebar } from "../BaseWidget/BaseWidgetSidebar";

import { SidebarColor } from "../../helperWidgets/SidebarComponents/SidebarColor";
import { SidebarNumberInput } from "../../helperWidgets/SidebarComponents/SidebarNumberInput";
// import { SidebarScaledSliderShowScale } from "../../helperWidgets/SidebarComponents/SidebarScaledSliderShowScale";
import { Log } from "../../../common/Log";
import { g_widgets1 } from "../../global/GlobalVariables";
import { calcSidebarWidth } from "../../../common/GlobalVariables";
import { SidebarStringChoices } from "../../helperWidgets/SidebarComponents/SidebarStringChoices";
import { SidebarCheckBox } from "../../helperWidgets/SidebarComponents/SidebarCheckBox";

export class TankSidebar extends BaseWidgetSidebar {
    _sidebarProgressBarBackgroundColor;
    _sidebarScaledSliderNumTickIntervals;
    _sidebarTankShowLabels;
    _sidebarScaledSliderCompactScale;
    _sidebarTankScalePosition;
    _sidebarTankShowScaleInnerLabel;
    _sidebarDisplayScale;

    constructor(tank: Tank) {
        super(tank);
        const text = this.getMainWidget().getText();
        this._sidebarProgressBarBackgroundColor = new SidebarColor(this, text, "backgroundColor", "Background color");
        this._sidebarScaledSliderNumTickIntervals = new SidebarNumberInput(this, text, "numTickIntervals", "# intervals");
        this._sidebarTankShowLabels = new SidebarCheckBox(this, text, "showLabels", "Show labels");
        this._sidebarScaledSliderCompactScale = new SidebarCheckBox(this, text, "compactScale", "Compact scale");
        this._sidebarTankScalePosition = new SidebarStringChoices(this, text, "scalePosition", "Scale position", 
            {
                Left: "left",
                Right: "right",
            }
        )
        this._sidebarTankShowScaleInnerLabel = new SidebarCheckBox(this, text, "showScaleInnerLabel", "Show inner labels");
        this._sidebarDisplayScale = new SidebarStringChoices(this, text, "displayScale", "Scale", {Linear: "Linear", Log10: "Log10"});
    }

    // ------------------------------------- elements --------------------------------------
    // mockup definition to let TypeScript stop complaining
    updateFromWidget = (event: any, propertyName: string, propertyValue: number | string | number[] | string[] | boolean): void => { };

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
                    {this.getSidebarAlarmText().getElement()}
                    {this.getSidebarAlarmFill().getElement()}
                    {this.getSidebarTankAlarmContainer().getElement()}
                    {this.getSidebarAlarmBackground().getElement()}
                    {this.getSidebarAlarmBorder().getElement()}
                    {this.getSidebarAlarmLevel().getElement()}
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
                    {this.getSidebarTankContainerColor().getElement()}
                </this._BlockBody>
                <this._HorizontalLine />
                {/* ---------------- water -------------------------- */}
                <this._BlockTitle>
                    <b>Water</b>
                </this._BlockTitle>
                <this._BlockBody>
                    {this.getSidebarFillColor().getElement()}
                </this._BlockBody>
                <this._HorizontalLine />
                {/* ---------------- ticks -------------------- */}
                <this._BlockTitle>
                    <b>Ticks</b>
                </this._BlockTitle>
                <this._BlockBody>
                    {this.getSidebarTankShowLabels().getElement()}
                    {this.getSidebarScaledSliderCompactScale().getElement()}
                    {this.getSidebarTankScalePosition().getElement()}
                    {this.getSidebarScaledSliderNumTickIntervals().getElement()}
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

    // ---------------------- getters --------------------------


    getSidebarProgressBarBackgroundColor = () => {
        return this._sidebarProgressBarBackgroundColor;
    };


    getSidebarScaledSliderNumTickIntervals = () => {
        return this._sidebarScaledSliderNumTickIntervals;
    }

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
}
