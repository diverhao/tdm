import * as React from "react";
import { CheckBox } from "./CheckBox";
import { BaseWidgetSidebar } from "../BaseWidget/BaseWidgetSidebar";
import { SidebarCheckBox } from "../../helperWidgets/SidebarComponents/SidebarCheckBox";
import { SidebarNumberInput } from "../../helperWidgets/SidebarComponents/SidebarNumberInput";
import { Log } from "../../../common/Log";
import { g_widgets1 } from "../../global/GlobalVariables";
import { calcSidebarWidth } from "../../../common/GlobalVariables";
import { SidebarDiscreteStateItems } from "../../helperWidgets/SidebarComponents/SidebarDiscreteStateItems";
import { SidebarColor } from "../../helperWidgets/SidebarComponents/SidebarColor";
import { SidebarStringInput } from "../../helperWidgets/SidebarComponents/SidebarStringInput";

export class CheckBoxSidebar extends BaseWidgetSidebar {
    _sidebarChoiceButtonUseChannelItems;
    _sidebarLEDBit;
    _sidebarCheckBoxSize;
    _sidebarTankShowLabels;
    _sidebarDiscreteStateItems: SidebarDiscreteStateItems;
    _sidebarLEDFallbackColor;
    _sidebarLEDMultiStateFallbackText;

    useItemColor: boolean = true;
    variableItems: boolean = false;


    constructor(checkBox: CheckBox) {
        super(checkBox);
        const text = this.getMainWidget().getText();
        this._sidebarChoiceButtonUseChannelItems = new SidebarCheckBox(this, text, "useChannelItems", "Use channel items");
        this._sidebarLEDBit = new SidebarNumberInput(this, text, "bit", "Bit");
        this._sidebarCheckBoxSize = new SidebarNumberInput(this, text, "size", "Size");
        this._sidebarTankShowLabels = new SidebarCheckBox(this, text, "showLabels", "Show labels");
        this._sidebarDiscreteStateItems = new SidebarDiscreteStateItems(this);
        this._sidebarLEDFallbackColor = new SidebarColor(this, text, "fallbackColor", "Fallback color");
        this._sidebarLEDMultiStateFallbackText = new SidebarStringInput(this, text, "fallbackText", "Text");
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
                <this._BlockTitle>
                    <b>Change confirmation</b>
                </this._BlockTitle>
                <this._BlockBody>
                    {this.getSidebarConfirmOnWrite().getElement()}
                    {this.getSidebarConfirmOnWriteUsePassword().getElement()}
                    {this.getSidebarConfirmOnWritePasword().getElement()}
                </this._BlockBody>

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
