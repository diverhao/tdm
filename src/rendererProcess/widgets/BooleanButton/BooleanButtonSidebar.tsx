import * as React from "react";
import { BooleanButton } from "./BooleanButton";
import { BaseWidgetSidebar } from "../BaseWidget/BaseWidgetSidebar";
import { SidebarNumberInput } from "../../helperWidgets/SidebarComponents/SidebarNumberInput";
import { SidebarCheckBox } from "../../helperWidgets/SidebarComponents/SidebarCheckBox";
import { SidebarColor } from "../../helperWidgets/SidebarComponents/SidebarColor";
import { SidebarStringChoices } from "../../helperWidgets/SidebarComponents/SidebarStringChoices";
import { SidebarDiscreteStateItems } from "../../helperWidgets/SidebarComponents/SidebarDiscreteStateItems";
import { Log } from "../../../common/Log";
import { g_widgets1 } from "../../global/GlobalVariables";
import { calcSidebarWidth } from "../../../common/GlobalVariables";
import { SidebarStringInput } from "../../helperWidgets/SidebarComponents/SidebarStringInput";

export class BooleanButtonSidebar extends BaseWidgetSidebar {
    _sidebarLEDBit;
    _sidebarSlideButtonBoxWidth;
    _sidebarChoiceButtonUseChannelItems;
    _sidebarBooleanButtonUsePictures;
    _sidebarBooleanButtonShowLED;
    _sidebarLEDFallbackColor;
    _sidebarBooleanButtonMode;
    _sidebarDiscreteStateItems: SidebarDiscreteStateItems;
    _sidebarLEDMultiStateFallbackText;

    useItemColor: boolean = true;
    variableItems: boolean = false;

    beingUpdatedItemIndex: number = -1;

    constructor(booleanButton: BooleanButton) {
        super(booleanButton);
        const text = this.getMainWidget().getText();
        this._sidebarLEDBit = new SidebarNumberInput(this, text, "bit", "Bit");
        this._sidebarSlideButtonBoxWidth = new SidebarNumberInput(this, text, "boxWidth", "Box width");
        this._sidebarChoiceButtonUseChannelItems = new SidebarCheckBox(this, text, "useChannelItems", "Use channel items");
        this._sidebarBooleanButtonUsePictures = new SidebarCheckBox(this, text, "usePictures", "Use pictures");
        this._sidebarBooleanButtonShowLED = new SidebarCheckBox(this, text, "showLED", "Show LED");
        this._sidebarLEDFallbackColor = new SidebarColor(this, text, "fallbackColor", "Fallback color");
        this._sidebarBooleanButtonMode = new SidebarStringChoices(this, text, "mode", "Mode", {Toggle: "Toggle", Push: "Push", "Push (inverted)": "Push (inverted)"});
        this._sidebarDiscreteStateItems = new SidebarDiscreteStateItems(this);
        this._sidebarLEDMultiStateFallbackText = new SidebarStringInput(this, text, "fallbackText", "Text");
    }

    getSidebarLEDBit = () => {
        return this._sidebarLEDBit;
    };

    getSidebarSlideButtonBoxWidth = () => {
        return this._sidebarSlideButtonBoxWidth;
    };

    getSidebarChoiceButtonUseChannelItems = () => {
        return this._sidebarChoiceButtonUseChannelItems;
    };

    getSidebarBooleanButtonUsePictures = () => {
        return this._sidebarBooleanButtonUsePictures;
    }

    setBeingUpdatedItemIndex = (newIndex: number) => {
        this.beingUpdatedItemIndex = newIndex;
    };

    getSidebarBooleanButtonShowLED = () => {
        return this._sidebarBooleanButtonShowLED;
    }

    getSidebarLEDFallbackColor = () => {
        return this._sidebarLEDFallbackColor;
    }

    getSidebarBooleanButtonMode = () => {
        return this._sidebarBooleanButtonMode;
    }

    getSidebarDiscreteStateItems = () => {
        return this._sidebarDiscreteStateItems;
    }

    getSidebarLEDMultiStateFallbackText = () => {
        return this._sidebarLEDMultiStateFallbackText;
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
                    case "select-a-file":
                        // this.getSidebarBooleanButtonItems().getUpdateFromWidget()(propertyValue as string);
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
                onMouseDown={this.handleMouseDown}>
                <h3>Boolean Button</h3>
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
                    {this.getSidebarWidgetAppearance().getElement()}
                </this._BlockBody>
                <this._HorizontalLine />
                {/* ----------------- Box ---------------------------- */}
                <this._BlockTitle>
                    <b>LED Indicator</b>
                </this._BlockTitle>
                <this._BlockBody>
                    {this.getSidebarLEDBit().getElement()}
                    {this.getSidebarBooleanButtonShowLED().getElement()}
                    {this.getSidebarLEDFallbackColor().getElement()}
                    {this.getSidebarLEDMultiStateFallbackText().getElement()}
                    {this.getSidebarBooleanButtonMode().getElement()}
                </this._BlockBody>
                <this._HorizontalLine />

                {/* --------------------------- items -------------------------- */}
                {this.getSidebarDiscreteStateItems().getElement()}
                {this.getSidebarChoiceButtonUseChannelItems().getElement()}
                {this.getSidebarBooleanButtonUsePictures().getElement()}
                <this._HorizontalLine />
                {/* ---------------- text -------------------------- */}
                <this._BlockTitle>
                    <b>Text</b>
                </this._BlockTitle>
                <this._BlockBody>
                    {/* {this.getSidebarCheckBoxText().getElement()} */}
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
