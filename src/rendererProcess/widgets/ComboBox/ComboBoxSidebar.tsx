import * as React from "react";
import { ComboBox } from "./ComboBox";
import { BaseWidgetSidebar } from "../BaseWidget/BaseWidgetSidebar";
// import { SidebarChoiceButtonItems } from "../../helperWidgets/SidebarComponents/SidebarChoiceButtonItems";
// import { SidebarChoiceButtonSelectedBackgroundColor } from "../../helperWidgets/SidebarComponents/SidebarChoiceButtonSelectedBackgroundColor";
// import { SidebarChoiceButtonUnselectedBackgroundColor } from "../../helperWidgets/SidebarComponents/SidebarChoiceButtonUnselectedBackgroundColor";
// import { SidebarChoiceButtonUseChannelItems } from "../../helperWidgets/SidebarComponents/SidebarChoiceButtonUseChannelItems";
// import { SidebarLEDBit } from "../../helperWidgets/SidebarComponents/SidebarLEDBit";
// import { SidebarCheckBoxSize } from "../../helperWidgets/SidebarComponents/SidebarCheckBoxSize";
// import { SidebarCheckBoxText } from "../../helperWidgets/SidebarComponents/SidebarCheckBoxText";
// import { SidebarSlideButtonBoxWidth } from "../../helperWidgets/SidebarComponents/SidebarSlideButtonBoxWidth";
// import { SidebarSlideButtonBoxRatio } from "../../helperWidgets/SidebarComponents/SidebarSlideButtonBoxRatio";
// import { SidebarBooleanButtonItems } from "../../helperWidgets/SidebarComponents/SidebarBooleanButtonItems";
import { SidebarChoiceButtonUseChannelItems } from "../../helperWidgets/SidebarComponents/SidebarChoiceButtonUseChannelItems";
// import { SidebarBooleanButtonUsePictures } from "../../helperWidgets/SidebarComponents/SidebarBooleanButtonUsePictures";
// import { SidebarRadioButtonItems } from "../../helperWidgets/SidebarComponents/SidebarRadioButtonItems";
// import { SidebarProgressBarBackgroundColor } from "../../helperWidgets/SidebarComponents/SidebarProgressbarBackgroundColor";
import { SidebarChoiceButtonItems } from "../../helperWidgets/SidebarComponents/SidebarChoiceButtonItems";
import { Log } from "../../global/Log";
import { calcSidebarWidth, g_widgets1 } from "../../global/GlobalVariables";

export class ComboBoxSidebar extends BaseWidgetSidebar {
    // _sidebarChoiceButtonItems: SidebarChoiceButtonItems;
    // _sidebarChoiceButtonSelectedBackgroundColor: SidebarChoiceButtonSelectedBackgroundColor;
    // _sidebarChoiceButtonUnselectedBackgroundColor: SidebarChoiceButtonUnselectedBackgroundColor;
    // _sidebarChoiceButtonUseChannelItems: SidebarChoiceButtonUseChannelItems;
    // _sidebarLEDBit: SidebarLEDBit;
    // _sidebarCheckBoxSize: SidebarCheckBoxSize;
    // _sidebarCheckBoxText: SidebarCheckBoxText;
    // _sidebarSlideButtonBoxWidth: SidebarSlideButtonBoxWidth;
    // _sidebarSlideButtonBoxRatio: SidebarSlideButtonBoxRatio;
    // _sidebarBooleanButtonItems: SidebarBooleanButtonItems;
    _sidebarChoiceButtonUseChannelItems: SidebarChoiceButtonUseChannelItems;
    // _sidebarBooleanButtonUsePictures: SidebarBooleanButtonUsePictures;
    // _sidebarRadioButtonItems: SidebarRadioButtonItems;
    // _sidebarProgressBarBackgroundColor: SidebarProgressBarBackgroundColor;
    _sidebarChoiceButtonItems: SidebarChoiceButtonItems;

    // beingUpdatedItemIndex: number = -1;

    constructor(comboBox: ComboBox) {
        super(comboBox);
        // this._sidebarChoiceButtonItems = new SidebarChoiceButtonItems(this);
        // this._sidebarChoiceButtonSelectedBackgroundColor = new SidebarChoiceButtonSelectedBackgroundColor(this);
        // this._sidebarChoiceButtonUnselectedBackgroundColor = new SidebarChoiceButtonUnselectedBackgroundColor(this);
        // this._sidebarChoiceButtonUseChannelItems = new SidebarChoiceButtonUseChannelItems(this);
        // this._sidebarLEDBit = new SidebarLEDBit(this);
        // this._sidebarCheckBoxSize = new SidebarCheckBoxSize(this);
        // this._sidebarCheckBoxText = new SidebarCheckBoxText(this);
        // this._sidebarSlideButtonBoxWidth = new SidebarSlideButtonBoxWidth(this);
        // this._sidebarSlideButtonBoxRatio = new SidebarSlideButtonBoxRatio(this);
        // this._sidebarBooleanButtonItems = new SidebarBooleanButtonItems(this);
        this._sidebarChoiceButtonUseChannelItems = new SidebarChoiceButtonUseChannelItems(this);
        // this._sidebarBooleanButtonUsePictures = new SidebarBooleanButtonUsePictures(this);
        // this._sidebarRadioButtonItems = new SidebarRadioButtonItems(this);
        // this._sidebarProgressBarBackgroundColor = new SidebarProgressBarBackgroundColor(this);
        this._sidebarChoiceButtonItems = new SidebarChoiceButtonItems(this);
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

    // getSidebarLEDBit = () => {
    // 	return this._sidebarLEDBit;
    // };

    // getSidebarCheckBoxSize = () => {
    //     return this._sidebarCheckBoxSize;
    // }

    // getSidebarCheckBoxText = () => {
    // 	return this._sidebarCheckBoxText;
    // };

    // getSidebarSlideButtonBoxWidth = () => {
    // 	return this._sidebarSlideButtonBoxWidth;
    // };

    // getSidebarSlideButtonBoxRatio = () => {
    // 	return this._sidebarSlideButtonBoxRatio;
    // };

    // getSidebarBooleanButtonItems = () => {
    // 	return this._sidebarBooleanButtonItems;
    // };

    getSidebarChoiceButtonUseChannelItems = () => {
        return this._sidebarChoiceButtonUseChannelItems;
    };

    // getSidebarBooleanButtonUsePictures = () => {
    //     return this._sidebarBooleanButtonUsePictures;
    // }

    // getSidebarRadioButtonItems = () => {
    // 	return this._sidebarRadioButtonItems;
    // };

    // getSidebarProgressBarBackgroundColor = () => {
    // 	return this._sidebarProgressBarBackgroundColor;
    // };

    // setBeingUpdatedItemIndex = (newIndex: number) => {
    // 	this.beingUpdatedItemIndex = newIndex;
    // };

    getSidebarChoiceButtonItems = () => {
        return this._sidebarChoiceButtonItems;
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
                    // case "select-a-file":
                    // 	this.getSidebarBooleanButtonItems().getUpdateFromWidget()(propertyValue as string);
                    // 	break;

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
                <h3>Combo Box</h3>
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
                    {/* {this.getSidebarChoiceButtonSelectedBackgroundColor().getElement()}
					{this.getSidebarChoiceButtonUnselectedBackgroundColor().getElement()} */}
                </this._BlockBody>
                {/* <this._BlockBody>{this.getSidebarHighlightBackgroundColor().getElement()}</this._BlockBody> */}
                <this._HorizontalLine />
                {/* ----------------- Box ---------------------------- */}
                {/* <this._BlockTitle> */}
                {/* <b>Box</b> */}
                {/* </this._BlockTitle> */}
                {/* <this._BlockBody> */}
                {/* {this.getSidebarSlideButtonBoxWidth().getElement()} */}
                {/* {this.getSidebarProgressBarBackgroundColor().getElement()} */}
                {/* {this.getSidebarSlideButtonBoxRatio().getElement()} */}
                {/* {this.getSidebarLEDBit().getElement()} */}
                {/* </this._BlockBody> */}
                {/* <this._HorizontalLine /> */}
                {/* ---------------- text -------------------------- */}
                <this._BlockTitle>
                    <b>Text</b>
                </this._BlockTitle>
                <this._BlockBody>
                    {/* {this.getSidebarCheckBoxText().getElement()} */}
                    {/* {this.getSidebarWrapWord().getElement()} */}
                    {this.getSidebarXAlign().getElement()}
                    {/* todo {this.getSidebarYAlign().getElement()} */}
                    {this.getSidebarTextColor().getElement()}
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
                <this._BlockBody></this._BlockBody>
                {/* {this.getSidebarBooleanButtonItems().getElement()} */}
                {/* {this.getSidebarRadioButtonItems().getElement()} */}
                {this.getSidebarChoiceButtonItems().getElement()}
                {this.getSidebarChoiceButtonUseChannelItems().getElement()}
                {/* {this.getSidebarBooleanButtonUsePictures().getElement()} */}
                {/* {this.getSidebarChoiceButtonItems().getElement()} */}
                {/* {this.getSidebarChoiceButtonUseChannelItems().getElement()} */}
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
