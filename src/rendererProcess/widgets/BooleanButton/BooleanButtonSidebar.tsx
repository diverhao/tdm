import * as React from "react";
import { BooleanButton } from "./BooleanButton";
import { BaseWidgetSidebar } from "../BaseWidget/BaseWidgetSidebar";
// import { SidebarChoiceButtonItems } from "../../helperWidgets/SidebarComponents/SidebarChoiceButtonItems";
// import { SidebarChoiceButtonSelectedBackgroundColor } from "../../helperWidgets/SidebarComponents/SidebarChoiceButtonSelectedBackgroundColor";
// import { SidebarChoiceButtonUnselectedBackgroundColor } from "../../helperWidgets/SidebarComponents/SidebarChoiceButtonUnselectedBackgroundColor";
// import { SidebarChoiceButtonUseChannelItems } from "../../helperWidgets/SidebarComponents/SidebarChoiceButtonUseChannelItems";
import { SidebarLEDBit } from "../../helperWidgets/SidebarComponents/SidebarLEDBit";
// import { SidebarCheckBoxSize } from "../../helperWidgets/SidebarComponents/SidebarCheckBoxSize";
// import { SidebarCheckBoxText } from "../../helperWidgets/SidebarComponents/SidebarCheckBoxText";
import { SidebarSlideButtonBoxWidth } from "../../helperWidgets/SidebarComponents/SidebarSlideButtonBoxWidth";
// import { SidebarSlideButtonBoxRatio } from "../../helperWidgets/SidebarComponents/SidebarSlideButtonBoxRatio";
// import { SidebarBooleanButtonItems } from "../../helperWidgets/SidebarComponents/SidebarBooleanButtonItems";
import { SidebarChoiceButtonUseChannelItems } from "../../helperWidgets/SidebarComponents/SidebarChoiceButtonUseChannelItems";
import { SidebarBooleanButtonUsePictures } from "../../helperWidgets/SidebarComponents/SidebarBooleanButtonUsePictures";
import { SidebarBooleanButtonShowLED } from "../../helperWidgets/SidebarComponents/SidebarBooleanButtonShowLED";
import { SidebarLEDFallbackColor } from "../../helperWidgets/SidebarComponents/SidebarLEDFallbackColor";
import { SidebarBooleanButtonOnColor } from "../../helperWidgets/SidebarComponents/SidebarBooleanButtonOnColor";
import { SidebarBooleanButtonOffColor } from "../../helperWidgets/SidebarComponents/SidebarBooleanButtonOffColor";
import { SidebarBooleanButtonOnValue } from "../../helperWidgets/SidebarComponents/SidebarBooleanButtonOnValue";
import { SidebarBooleanButtonOffValue } from "../../helperWidgets/SidebarComponents/SidebarBooleanButtonOffValue";
import { SidebarBooleanButtonOnLabel } from "../../helperWidgets/SidebarComponents/SidebarBooleanButtonOnLabel";
import { SidebarBooleanButtonOffLabel } from "../../helperWidgets/SidebarComponents/SidebarBooleanButtonOffLabel";
import { SidebarBooleanButtonMode } from "../../helperWidgets/SidebarComponents/SidebarBooleanButtonMode";
import {Log} from "../../../common/Log";
import { calcSidebarWidth, g_widgets1 } from "../../global/GlobalVariables";

export class BooleanButtonSidebar extends BaseWidgetSidebar {
    // _sidebarChoiceButtonItems: SidebarChoiceButtonItems;
    // _sidebarChoiceButtonSelectedBackgroundColor: SidebarChoiceButtonSelectedBackgroundColor;
    // _sidebarChoiceButtonUnselectedBackgroundColor: SidebarChoiceButtonUnselectedBackgroundColor;
    // _sidebarChoiceButtonUseChannelItems: SidebarChoiceButtonUseChannelItems;
    _sidebarLEDBit: SidebarLEDBit;
    // _sidebarCheckBoxSize: SidebarCheckBoxSize;
    // _sidebarCheckBoxText: SidebarCheckBoxText;
    _sidebarSlideButtonBoxWidth: SidebarSlideButtonBoxWidth;
    // _sidebarSlideButtonBoxRatio: SidebarSlideButtonBoxRatio;
    // _sidebarBooleanButtonItems: SidebarBooleanButtonItems;
    _sidebarChoiceButtonUseChannelItems: SidebarChoiceButtonUseChannelItems;
    _sidebarBooleanButtonUsePictures: SidebarBooleanButtonUsePictures;
    _sidebarBooleanButtonShowLED: SidebarBooleanButtonShowLED;
    _sidebarLEDFallbackColor: SidebarLEDFallbackColor;
    _sidebarBooleanButtonOnColor: SidebarBooleanButtonOnColor;
    _sidebarBooleanButtonOffColor: SidebarBooleanButtonOffColor;
    _sidebarBooleanButtonOnValue: SidebarBooleanButtonOnValue;
    _sidebarBooleanButtonOffValue: SidebarBooleanButtonOffValue;
    _sidebarBooleanButtonOnLabel: SidebarBooleanButtonOnLabel;
    _sidebarBooleanButtonOffLabel: SidebarBooleanButtonOffLabel;
    _sidebarBooleanButtonMode: SidebarBooleanButtonMode;

    beingUpdatedItemIndex: number = -1;

    constructor(booleanButton: BooleanButton) {
        super(booleanButton);
        // this._sidebarChoiceButtonItems = new SidebarChoiceButtonItems(this);
        // this._sidebarChoiceButtonSelectedBackgroundColor = new SidebarChoiceButtonSelectedBackgroundColor(this);
        // this._sidebarChoiceButtonUnselectedBackgroundColor = new SidebarChoiceButtonUnselectedBackgroundColor(this);
        // this._sidebarChoiceButtonUseChannelItems = new SidebarChoiceButtonUseChannelItems(this);
        this._sidebarLEDBit = new SidebarLEDBit(this);
        // this._sidebarCheckBoxSize = new SidebarCheckBoxSize(this);
        // this._sidebarCheckBoxText = new SidebarCheckBoxText(this);
        this._sidebarSlideButtonBoxWidth = new SidebarSlideButtonBoxWidth(this);
        // this._sidebarSlideButtonBoxRatio = new SidebarSlideButtonBoxRatio(this);
        // this._sidebarBooleanButtonItems = new SidebarBooleanButtonItems(this);
        this._sidebarChoiceButtonUseChannelItems = new SidebarChoiceButtonUseChannelItems(this);
        this._sidebarBooleanButtonUsePictures = new SidebarBooleanButtonUsePictures(this);
        this._sidebarBooleanButtonShowLED = new SidebarBooleanButtonShowLED(this);
        this._sidebarLEDFallbackColor = new SidebarLEDFallbackColor(this);
        this._sidebarBooleanButtonOnColor = new SidebarBooleanButtonOnColor(this);
        this._sidebarBooleanButtonOffColor = new SidebarBooleanButtonOffColor(this);
        this._sidebarBooleanButtonOnValue = new SidebarBooleanButtonOnValue(this);
        this._sidebarBooleanButtonOffValue = new SidebarBooleanButtonOffValue(this);
        this._sidebarBooleanButtonOnLabel = new SidebarBooleanButtonOnLabel(this);
        this._sidebarBooleanButtonOffLabel = new SidebarBooleanButtonOffLabel(this);
        this._sidebarBooleanButtonMode = new SidebarBooleanButtonMode(this);
    }
    // getSidebarChoiceButtonUnselectedBackgroundColor = () => {
    // 	return this._sidebarChoiceButtonUnselectedBackgroundColor;
    // };

    // getSidebarChoiceButtonSelectedBackgroundColor = () => {
    // 	return this._sidebarChoiceButtonSelectedBackgroundColor;
    // };

    // getSidebarChoiceButtonUseChannelItems = () => {
    // 	return this._sidebarChoiceButtonUseChannelItems;
    // };

    getSidebarLEDBit = () => {
        return this._sidebarLEDBit;
    };

    // getSidebarCheckBoxSize = () => {
    //     return this._sidebarCheckBoxSize;
    // }

    // getSidebarCheckBoxText = () => {
    // 	return this._sidebarCheckBoxText;
    // };

    getSidebarSlideButtonBoxWidth = () => {
        return this._sidebarSlideButtonBoxWidth;
    };

    // getSidebarSlideButtonBoxRatio = () => {
    // 	return this._sidebarSlideButtonBoxRatio;
    // };

    // getSidebarBooleanButtonItems = () => {
    // 	return this._sidebarBooleanButtonItems;
    // };

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

    getSidebarBooleanButtonOnColor = () => {
        return this._sidebarBooleanButtonOnColor;
    }

    getSidebarBooleanButtonOffColor = () => {
        return this._sidebarBooleanButtonOffColor;
    }

    getSidebarBooleanButtonOnValue = () => {
        return this._sidebarBooleanButtonOnValue;
    }
    getSidebarBooleanButtonOffValue = () => {
        return this._sidebarBooleanButtonOffValue;
    }
    getSidebarBooleanButtonOnLabel = () => {
        return this._sidebarBooleanButtonOnLabel;
    }
    getSidebarBooleanButtonOffLabel = () => {
        return this._sidebarBooleanButtonOffLabel;
    }

    getSidebarBooleanButtonMode = () => {
        return this._sidebarBooleanButtonMode;
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
                    {/* {this.getSidebarShowUnit().getElement()} */}
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
                {/* <this._BlockBody>{this.getSidebarHighlightBackgroundColor().getElement()}</this._BlockBody> */}
                <this._HorizontalLine />
                {/* ----------------- Box ---------------------------- */}
                <this._BlockTitle>
                    <b>LED Indicator</b>
                </this._BlockTitle>
                <this._BlockBody>
                    {/* {this.getSidebarSlideButtonBoxWidth().getElement()} */}
                    {/* {this.getSidebarSlideButtonBoxRatio().getElement()} */}
                    {this.getSidebarLEDBit().getElement()}
                    {this.getSidebarBooleanButtonShowLED().getElement()}
                    {this.getSidebarLEDFallbackColor().getElement()}
                    {this.getSidebarBooleanButtonMode().getElement()}
                </this._BlockBody>
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
                    {/* {this.getSidebarXAlign().getElement()} */}
                    {/* todo: {this.getSidebarYAlign().getElement()} */}
                    {/* todo: {this.getSidebarWrapWord().getElement()} */}
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
                {/* --------------------------- items -------------------------- */}
                {/* <this._BlockBody></this._BlockBody> {this.getSidebarBooleanButtonItems().getElement()} */}
                <this._BlockTitle>
                    <b>On</b>
                </this._BlockTitle>
                <this._BlockBody>
                    {this.getSidebarBooleanButtonOnLabel().getElement()}
                    {this.getSidebarBooleanButtonOnValue().getElement()}
                    {this.getSidebarBooleanButtonOnColor().getElement()}
                </this._BlockBody>
                <this._HorizontalLine />
                <this._BlockTitle>
                    <b>Off</b>
                </this._BlockTitle>
                <this._BlockBody>
                    {this.getSidebarBooleanButtonOffLabel().getElement()}
                    {this.getSidebarBooleanButtonOffValue().getElement()}
                    {this.getSidebarBooleanButtonOffColor().getElement()}
                </this._BlockBody>
                <this._HorizontalLine />
                {this.getSidebarChoiceButtonUseChannelItems().getElement()}
                {this.getSidebarBooleanButtonUsePictures().getElement()}
                {/* {this.getSidebarChoiceButtonItems().getElement()} */}
                {/* {this.getSidebarChoiceButtonUseChannelItems().getElement()} */}
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

    // getSidebarChoiceButtonItems = () => {
    // 	return this._sidebarChoiceButtonItems;
    // };

    // ------------------------- style -------------------------

    // defined in super class
    // _style
    // _inputStyle
    // _formStyle
}
