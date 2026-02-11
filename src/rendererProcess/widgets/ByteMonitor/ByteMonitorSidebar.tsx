import * as React from "react";
import { ByteMonitor } from "./ByteMonitor";
import { BaseWidgetSidebar } from "../BaseWidget/BaseWidgetSidebar";
import { SidebarPictureStretchToFit } from "../../helperWidgets/SidebarComponents/SidebarPictureStretchToFit";
import { SidebarPictureOpacity } from "../../helperWidgets/SidebarComponents/SidebarPictureOpacity";
import { SidebarLEDFallbackColor } from "../../helperWidgets/SidebarComponents/SidebarLEDFallbackColor";
import { SidebarLEDShape } from "../../helperWidgets/SidebarComponents/SidebarLEDShape";
import { SidebarByteMonitorBitStart } from "../../helperWidgets/SidebarComponents/SidebarByteMonitorBitStart";
import { SidebarByteMonitorBitLength } from "../../helperWidgets/SidebarComponents/SidebarByteMonitorBitLength";
import { SidebarByteMonitorBitValueColors } from "../../helperWidgets/SidebarComponents/SidebarByteMonitorBitValueColors";
import { SidebarByteMonitorBitNamesTable } from "../../helperWidgets/SidebarComponents/SidebarByteMonitorBitNamesTable";
import { SidebarByteMonitorSequence } from "../../helperWidgets/SidebarComponents/SidebarByteMonitorSequence";
import {Log} from "../../../common/Log";
import { g_widgets1 } from "../../global/GlobalVariables";
import { calcSidebarWidth } from "../../../common/GlobalVariables";

export class ByteMonitorSidebar extends BaseWidgetSidebar {
    _sidebarPictureStretchToFit: SidebarPictureStretchToFit;
    _sidebarPictureOpacity: SidebarPictureOpacity;
    _sidebarLEDFallbackColor: SidebarLEDFallbackColor;
    _sidebarLEDShape: SidebarLEDShape;
    _sidebarByteMonitorBitStart: SidebarByteMonitorBitStart;
    _sidebarByteMonitorBitLength: SidebarByteMonitorBitLength;
    _sidebarByteMonitorBitValueColors: SidebarByteMonitorBitValueColors;
    _sidebarByteMonitorBitNamesTable: SidebarByteMonitorBitNamesTable;
    _sidebarByteMonitorSequence: SidebarByteMonitorSequence;

    constructor(byteMonitor: ByteMonitor) {
        super(byteMonitor);
        this._sidebarPictureStretchToFit = new SidebarPictureStretchToFit(this);
        this._sidebarPictureOpacity = new SidebarPictureOpacity(this);
        this._sidebarLEDFallbackColor = new SidebarLEDFallbackColor(this);
        this._sidebarLEDShape = new SidebarLEDShape(this);
        this._sidebarByteMonitorBitStart = new SidebarByteMonitorBitStart(this);
        this._sidebarByteMonitorBitLength = new SidebarByteMonitorBitLength(this);
        this._sidebarByteMonitorBitValueColors = new SidebarByteMonitorBitValueColors(this);
        this._sidebarByteMonitorBitNamesTable = new SidebarByteMonitorBitNamesTable(this);
        this._sidebarByteMonitorSequence = new SidebarByteMonitorSequence(this);
    }

    getSidebarPictureStretchToFit = () => {
        return this._sidebarPictureStretchToFit;
    };

    getSidebarPictureOpacity = () => {
        return this._sidebarPictureOpacity;
    };

    getSidebarLEDFallbackColor = () => {
        return this._sidebarLEDFallbackColor;
    };

    getSidebarLEDShape = () => {
        return this._sidebarLEDShape;
    };

    getSidebarByteMonitorBitStart = () => {
        return this._sidebarByteMonitorBitStart;
    };

    getSidebarByteMonitorBitLength = () => {
        return this._sidebarByteMonitorBitLength;
    };

    getSidebarByteMonitorBitValueColors = () => {
        return this._sidebarByteMonitorBitValueColors;
    };

    getSidebarByteMonitorBitNamesTable = () => {
        return this._sidebarByteMonitorBitNamesTable;
    };

    getSidebarByteMonitorSequence = () => {
        return this._sidebarByteMonitorSequence;
    };

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
                <h3>Byte Monitor</h3>
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
                    {this.getSidebarInvisibleInOperation().getElement()}
                </this._BlockBody>
                <this._HorizontalLine />
                {/* ---------------- line -------------------------- */}
                <this._BlockTitle>
                    <b>Line</b>
                </this._BlockTitle>
                <this._BlockBody>
                    {this.getSidebarLineWidth().getElement()}
                    {this.getSidebarLineColor().getElement()}
                </this._BlockBody>
                <this._HorizontalLine />
                {/* ------------------ appearance ---------------------- */}
                <this._BlockTitle>
                    <b>Appearance</b>
                </this._BlockTitle>
                <this._BlockBody>
                    {this.getSidebarDirection().getElement()}
                    {this.getSidebarByteMonitorSequence().getElement()}
                    {this.getSidebarLEDShape().getElement()}
                    {this.getSidebarLEDFallbackColor().getElement()}
                </this._BlockBody>
                <this._HorizontalLine />
                {/* --------------------------- items -------------------------- */}
                <this._BlockTitle>
                    <b>Bits</b>
                </this._BlockTitle>
                {this.getSidebarByteMonitorBitStart().getElement()}
                {this.getSidebarByteMonitorBitLength().getElement()}
                {this.getSidebarByteMonitorBitValueColors().getElement()}
                <this._HorizontalLine />
                {this.getSidebarByteMonitorBitNamesTable().getElement()}
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
