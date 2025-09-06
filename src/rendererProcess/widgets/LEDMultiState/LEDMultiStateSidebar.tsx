import * as React from "react";
import { LEDMultiState } from "./LEDMultiState";
import { BaseWidgetSidebar } from "../BaseWidget/BaseWidgetSidebar";
import { SidebarPictureStretchToFit } from "../../helperWidgets/SidebarComponents/SidebarPictureStretchToFit";
import { SidebarPictureOpacity } from "../../helperWidgets/SidebarComponents/SidebarPictureOpacity";
import { SidebarLEDMultiStateItems } from "../../helperWidgets/SidebarComponents/SidebarLEDMultiStateItems";
import { SidebarLEDFallbackColor } from "../../helperWidgets/SidebarComponents/SidebarLEDFallbackColor";
import { SidebarLEDShape } from "../../helperWidgets/SidebarComponents/SidebarLEDShape";
import { SidebarLEDMultiStateFallbackText } from "../../helperWidgets/SidebarComponents/SidebarLEDMultiStateFallbackText";
import {Log} from "../../../mainProcess/log/Log";
import { calcSidebarWidth, g_widgets1 } from "../../global/GlobalVariables";
// import { SidebarChoiceButtonUseChannelItems } from "../../helperWidgets/SidebarComponents/SidebarChoiceButtonUseChannelItems";
// import { SidebarLEDBit } from "../../helperWidgets/SidebarComponents/SidebarLEDBit";

export class LEDMultiStateSidebar extends BaseWidgetSidebar {
    _sidebarPictureStretchToFit: SidebarPictureStretchToFit;
    _sidebarPictureOpacity: SidebarPictureOpacity;
    _sidebarLEDMultiStateItems: SidebarLEDMultiStateItems;
    _sidebarLEDFallbackColor: SidebarLEDFallbackColor;
    _sidebarLEDShape: SidebarLEDShape;
    _sidebarLEDMultiStateFallbackText: SidebarLEDMultiStateFallbackText;
    // _sidebarChoiceButtonUseChannelItems: SidebarChoiceButtonUseChannelItems;
    // _sidebarLEDBit: SidebarLEDBit;
    // _sidebarPolylineFill: SidebarPolylineFill;

    beingUpdatedItemIndex: number = -1;

    constructor(ledMultiState: LEDMultiState) {
        super(ledMultiState);
        this._sidebarPictureStretchToFit = new SidebarPictureStretchToFit(this);
        this._sidebarPictureOpacity = new SidebarPictureOpacity(this);
        this._sidebarLEDMultiStateItems = new SidebarLEDMultiStateItems(this);
        this._sidebarLEDFallbackColor = new SidebarLEDFallbackColor(this);
        this._sidebarLEDShape = new SidebarLEDShape(this);
        this._sidebarLEDMultiStateFallbackText = new SidebarLEDMultiStateFallbackText(this);
        // this._sidebarChoiceButtonUseChannelItems = new SidebarChoiceButtonUseChannelItems(this);
        // this._sidebarLEDBit = new SidebarLEDBit(this);
        // this._sidebarPolylineFill = new SidebarPolylineFill(this);
    }

    getSidebarPictureStretchToFit = () => {
        return this._sidebarPictureStretchToFit;
    };

    getSidebarPictureOpacity = () => {
        return this._sidebarPictureOpacity;
    };

    getSidebarLEDMultiStateItems = () => {
        return this._sidebarLEDMultiStateItems;
    }

    getSidebarLEDFallbackColor = () => {
        return this._sidebarLEDFallbackColor;
    }

    getSidebarLEDShape = () => {
        return this._sidebarLEDShape;
    }

    getSidebarLEDMultiStateFallbackText = () => {
        return this._sidebarLEDMultiStateFallbackText;
    }

    // getSidebarChoiceButtonUseChannelItems = () => {
    //     return this._sidebarChoiceButtonUseChannelItems;
    // }

    // getSidebarLEDBit = () => {
    //     return this._sidebarLEDBit;
    // }

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
                <h3>LED (Multi State)</h3>
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
                    {/* {this.getSidebarLEDBit().getElement()} */}
                </this._BlockBody>
                <this._HorizontalLine />
                {/* ---------------- background -------------------------- */}
                <this._BlockTitle>
                    <b>Background</b>
                </this._BlockTitle>
                <this._BlockBody>
                    {/* color */}
                    {this.getSidebarBackgroundColor().getElement()}
                    {this.getSidebarLEDShape().getElement()}
                    {this.getSidebarInvisibleInOperation().getElement()}
                    {/* {this.getSidebarPictureStretchToFit().getElement()} */}
                    {/* {this.getSidebarPictureOpacity().getElement()} */}
                </this._BlockBody>
                <this._HorizontalLine />
                {/* ------------------- File -------------------------- */}
                {/* {this.getSidebarOpenFile().getElement()} */}
                {/* <this._HorizontalLine /> */}
                {/* ---------------- line -------------------------- */}
                <this._BlockTitle>
                    <b>Line</b>
                </this._BlockTitle>
                <this._BlockBody>
                    {/* {this.getSidebarArcShowRadius().getElement()} */}
                    {/* {this.getSidebarPolylineClosed().getElement()} */}
                    {this.getSidebarLineWidth().getElement()}
                    {/* {this.getSidebarLineStyle().getElement()} */}
                    {/* {this.getSidebarTextColor().getElement()} */}
                    {this.getSidebarLineColor().getElement()}
                </this._BlockBody>
                <this._HorizontalLine />
                {/* ---------------- filling -------------------------- */}
                {/* <this._BlockTitle> */}
                {/* <b>Filling</b> */}
                {/* </this._BlockTitle> */}
                {/* <this._BlockBody> */}
                {/* {this.getSidebarPolylineFill().getElement()} */}
                {/* {this.getSidebarPolylineFillColor().getElement()} */}
                {/* </this._BlockBody> */}
                {/* <this._HorizontalLine /> */}
                {/* ------------------ fallback color and text ---------------------- */}
                <this._BlockTitle>
                    <b>Fallback Color</b>
                </this._BlockTitle>
                <this._BlockBody>
                    {this.getSidebarLEDFallbackColor().getElement()}
                    {this.getSidebarLEDMultiStateFallbackText().getElement()}
                </this._BlockBody>
                <this._HorizontalLine />

                {/* ------------------- arrow ----------------------------- */}
                {/* {this.getSidebarLineArrowStyle().getElement()} */}
                {/* ---------------- points table -------------------------- */}
                {/* {this.getSidebarPolylinePointsTable().getElement()} */}
                {/* ---------------- angle -------------------------- */}
                {/* <this._BlockTitle> */}
                {/* <b>Angle</b> */}
                {/* </this._BlockTitle> */}
                {/* <this._BlockBody> */}
                {/* {this.getSidebarArcAngleStart().getElement()} */}
                {/* {this.getSidebarArcAngleRange().getElement()} */}
                {/* </this._BlockBody> */}
                {/* <this._HorizontalLine /> */}
                {/* ---------------- text -------------------------- */}
                {/* <this._BlockTitle>
					<b>Text</b>
				</this._BlockTitle>
				<this._BlockBody>
					{this.getSidebarTextColor().getElement()}
					{this.getSidebarXAlign().getElement()}
					{this.getSidebarYAlign().getElement()}
					{this.getSidebarWrapWord().getElement()}
				</this._BlockBody>
				<this._HorizontalLine /> */}
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
                {/* --------------------------- items -------------------------- */}
                {/* {this.getSidebarChoiceButtonItems().getElement()} */}
                {/* {this.getSidebarLEDItems().getElement()} */}
                {this.getSidebarLEDMultiStateItems().getElement()}
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

    // ------------------------- style -------------------------

    // defined in super class
    // _style
    // _inputStyle
    // _formStyle
}
