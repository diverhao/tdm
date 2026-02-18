import * as React from "react";
import { CheckBox } from "./CheckBox";
import { BaseWidgetSidebar } from "../BaseWidget/BaseWidgetSidebar";
import { SidebarChoiceButtonUseChannelItems } from "../../helperWidgets/SidebarComponents/SidebarChoiceButtonUseChannelItems";
import { SidebarLEDBit } from "../../helperWidgets/SidebarComponents/SidebarLEDBit";
import { SidebarCheckBoxSize } from "../../helperWidgets/SidebarComponents/SidebarCheckBoxSize";
import { SidebarBooleanButtonOnLabel } from "../../helperWidgets/SidebarComponents/SidebarBooleanButtonOnLabel";
import { SidebarBooleanButtonOffLabel } from "../../helperWidgets/SidebarComponents/SidebarBooleanButtonOffLabel";
import { SidebarBooleanButtonOnValue } from "../../helperWidgets/SidebarComponents/SidebarBooleanButtonOnValue";
import { SidebarBooleanButtonOffValue } from "../../helperWidgets/SidebarComponents/SidebarBooleanButtonOffValue";
import { Log } from "../../../common/Log";
import { g_widgets1 } from "../../global/GlobalVariables";
import { calcSidebarWidth } from "../../../common/GlobalVariables";
import { SidebarDiscreteStateItems } from "../../helperWidgets/SidebarComponents/SidebarDiscreteStateItems";
import { SidebarTankShowLabels } from "../../helperWidgets/SidebarComponents/SidebarTankShowLabels";
import { SidebarLEDFallbackColor } from "../../helperWidgets/SidebarComponents/SidebarLEDFallbackColor";
import { SidebarLEDMultiStateFallbackText } from "../../helperWidgets/SidebarComponents/SidebarLEDMultiStateFallbackText";

export class CheckBoxSidebar extends BaseWidgetSidebar {
    _sidebarChoiceButtonUseChannelItems: SidebarChoiceButtonUseChannelItems;
    _sidebarLEDBit: SidebarLEDBit;
    _sidebarCheckBoxSize: SidebarCheckBoxSize;
    _sidebarBooleanButtonOnLabel: SidebarBooleanButtonOnLabel;
    _sidebarBooleanButtonOffLabel: SidebarBooleanButtonOffLabel;
    _sidebarBooleanButtonOnValue: SidebarBooleanButtonOnValue;
    _sidebarBooleanButtonOffValue: SidebarBooleanButtonOffValue;
    _sidebarTankShowLabels: SidebarTankShowLabels;
    _sidebarDiscreteStateItems: SidebarDiscreteStateItems;
    _sidebarLEDFallbackColor: SidebarLEDFallbackColor;
    _sidebarLEDMultiStateFallbackText: SidebarLEDMultiStateFallbackText;

    useItemColor: boolean = true;
    variableItems: boolean = false;


    constructor(checkBox: CheckBox) {
        super(checkBox);
        this._sidebarChoiceButtonUseChannelItems = new SidebarChoiceButtonUseChannelItems(this);
        this._sidebarLEDBit = new SidebarLEDBit(this);
        this._sidebarCheckBoxSize = new SidebarCheckBoxSize(this);
        this._sidebarBooleanButtonOnLabel = new SidebarBooleanButtonOnLabel(this);
        this._sidebarBooleanButtonOffLabel = new SidebarBooleanButtonOffLabel(this);
        this._sidebarBooleanButtonOnValue = new SidebarBooleanButtonOnValue(this);
        this._sidebarBooleanButtonOffValue = new SidebarBooleanButtonOffValue(this);
        this._sidebarTankShowLabels = new SidebarTankShowLabels(this);
        this._sidebarDiscreteStateItems = new SidebarDiscreteStateItems(this);
        this._sidebarLEDFallbackColor = new SidebarLEDFallbackColor(this);
        this._sidebarLEDMultiStateFallbackText = new SidebarLEDMultiStateFallbackText(this);
    }

    getSidebarChoiceButtonUseChannelItems = () => {
        return this._sidebarChoiceButtonUseChannelItems;
    };

    getSidebarLEDBit = () => {
        return this._sidebarLEDBit;
    };

    getSidebarCheckBoxSize = () => {
        return this._sidebarCheckBoxSize;
    };

    getSidebarBooleanButtonOnLabel = () => {
        return this._sidebarBooleanButtonOnLabel;
    };
    getSidebarBooleanButtonOffLabel = () => {
        return this._sidebarBooleanButtonOffLabel;
    };
    getSidebarBooleanButtonOnValue = () => {
        return this._sidebarBooleanButtonOnValue;
    };
    getSidebarBooleanButtonOffValue = () => {
        return this._sidebarBooleanButtonOffValue;
    };

    getSidebarDiscreteStateItems = () => {
        return this._sidebarDiscreteStateItems;
    }

    getSidebarTankShowLabels = () => {
        return this._sidebarTankShowLabels;
    }

    getSidebarLEDMultiStateFallbackText = () => {
        return this._sidebarLEDMultiStateFallbackText;
    }

    getSidebarLEDFallbackColor = () => {
        return this._sidebarLEDFallbackColor;
    }


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
                <h3>Check Box</h3>
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
                    {this.getSidebarAlarmBorder().getElement()}
                    {this.getSidebarLEDBit().getElement()}
                </this._BlockBody>
                <this._HorizontalLine />
                {/* --------------------------- items -------------------------- */}
                {this.getSidebarDiscreteStateItems().getElement()}
                {this.getSidebarChoiceButtonUseChannelItems().getElement()}
                <this._HorizontalLine />
                {/* ------------------ fallback ---------------------- */}
                <this._BlockTitle>
                    <b>Fallback</b>
                </this._BlockTitle>
                <this._BlockBody>
                    {this.getSidebarLEDFallbackColor().getElement()}
                    {this.getSidebarLEDMultiStateFallbackText().getElement()}
                </this._BlockBody>
                <this._HorizontalLine />
                {/* ---------------- background -------------------------- */}
                <this._BlockTitle>
                    <b>Background</b>
                </this._BlockTitle>
                <this._BlockBody>
                    {/* color */}
                    {this.getSidebarBackgroundColor().getElement()}
                    {this.getSidebarInvisibleInOperation().getElement()}
                </this._BlockBody>
                <this._HorizontalLine />
                {/* ----------------- Box ---------------------------- */}
                <this._BlockTitle>
                    <b>Box</b>
                </this._BlockTitle>
                <this._BlockBody>
                    {this.getSidebarCheckBoxSize().getElement()}
                    {this.getSidebarTankShowLabels().getElement()}
                </this._BlockBody>
                <this._HorizontalLine />
                {/* ---------------- text -------------------------- */}
                <this._BlockTitle>
                    <b>Text</b>
                </this._BlockTitle>
                <this._BlockBody>
                    {this.getSidebarText().getElement()}
                    {this.getSidebarWrapWord().getElement()}
                    {this.getSidebarXAlign().getElement()}
                    {this.getSidebarYAlign().getElement()}
                    {this.getSidebarTextColor().getElement()}
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
                {/* ---------------- confirm on write -------------------- */}
                {this.getSidebarWriteConfirmation().getElement()}
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

}
