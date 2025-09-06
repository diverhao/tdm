import * as React from "react";
import { Image } from "./Image";
import { BaseWidgetSidebar } from "../BaseWidget/BaseWidgetSidebar";
import { calcSidebarWidth, g_widgets1 } from "../../global/GlobalVariables";
import {Log} from "../../../mainProcess/log/Log";
import { SidebarImageXmin } from "../../helperWidgets/SidebarComponents/SidebarImageXmin";
import { SidebarImageXmax } from "../../helperWidgets/SidebarComponents/SidebarImageXmax";
import { SidebarImageYmin } from "../../helperWidgets/SidebarComponents/SidebarImageYmin";
import { SidebarImageYmax } from "../../helperWidgets/SidebarComponents/SidebarImageYmax";
import { SidebarImageAutoXY } from "../../helperWidgets/SidebarComponents/SidebarImageAutoXY";
import { SidebarImageZmin } from "../../helperWidgets/SidebarComponents/SidebarImageZmin";
import { SidebarImageZmax } from "../../helperWidgets/SidebarComponents/SidebarImageZmax";
import { SidebarImageAutoZ } from "../../helperWidgets/SidebarComponents/SidebarImageAutoZ";
import { SidebarImageColorMap } from "../../helperWidgets/SidebarComponents/SidebarImageColorMap";
import {SidebarImageRegionsOfInterest} from "../../helperWidgets/SidebarComponents/SidebarImageRegionsOfInterest";

export class ImageSidebar extends BaseWidgetSidebar {
    sidebarImageXmin: SidebarImageXmin;
    sidebarImageXmax: SidebarImageXmax;
    sidebarImageYmin: SidebarImageYmin;
    sidebarImageYmax: SidebarImageYmax;
    sidebarImageAutoXY: SidebarImageAutoXY;
    sidebarImageZmin: SidebarImageZmin;
    sidebarImageZmax: SidebarImageZmax;
    sidebarImageAutoZ: SidebarImageAutoZ;
    sidebarImageColorMap: SidebarImageColorMap
    sidebarImageRegionsOfInterest: SidebarImageRegionsOfInterest;
    constructor(image: Image) {
        super(image);
        this.sidebarImageXmin = new SidebarImageXmin(this);
        this.sidebarImageXmax = new SidebarImageXmax(this);
        this.sidebarImageYmin = new SidebarImageYmin(this);
        this.sidebarImageYmax = new SidebarImageYmax(this);
        this.sidebarImageAutoXY = new SidebarImageAutoXY(this);
        this.sidebarImageZmin = new SidebarImageZmin(this);
        this.sidebarImageZmax = new SidebarImageZmax(this);
        this.sidebarImageAutoZ = new SidebarImageAutoZ(this);
        this.sidebarImageColorMap = new SidebarImageColorMap(this);
        this.sidebarImageRegionsOfInterest = new SidebarImageRegionsOfInterest(this);
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
                <h3>Image</h3>
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
                    {/* {this.getSidebarAlarmText().getElement()} */}
                    {/* {this.getSidebarAlarmBackground().getElement()} */}
                    {this.getSidebarAlarmBorder().getElement()}
                    {this.getSidebarAlarmLevel().getElement()}
                    {/* {this.getSidebarNumberScale().getElement()} */}
                    {/* {this.getSidebarNumberFormat().getElement()} */}
                </this._BlockBody>
                <this._HorizontalLine />
                {/* ---------------- xy area -------------------------- */}
                <this._BlockTitle>
                    <b>XY Area</b>
                </this._BlockTitle>
                <this._BlockBody>
                    {/* color */}
                    {this.getSidebarImageAutoXY().getElement()}
                    {this.getSidebarImageXmin().getElement()}
                    {this.getSidebarImageXmax().getElement()}
                    {this.getSidebarImageYmin().getElement()}
                    {this.getSidebarImageYmax().getElement()}
                    
                </this._BlockBody>
                <this._HorizontalLine />
                {/* ---------------- color map -------------------------- */}
                <this._BlockTitle>
                    <b>Color Map</b>
                </this._BlockTitle>
                <this._BlockBody>
                    {/* color map */}
                    {this.getSidebarImageColorMap().getElement()}
                    {this.getSidebarImageAutoZ().getElement()}
                    {this.getSidebarImageZmin().getElement()}
                    {this.getSidebarImageZmax().getElement()}
                    
                </this._BlockBody>
                <this._HorizontalLine />
                {/* ---------------- regions of interest -------------------------- */}
                <this._BlockBody>
                    {this.getSidebarImageRegionsOfInterest().getElement()}
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
                {/* ---------------- text -------------------------- */}
                <this._BlockTitle>
                    <b>Text</b>
                </this._BlockTitle>
                <this._BlockBody>
                    {/* color */}
                    {this.getSidebarTextColor().getElement()}
                    {/* {this.getSidebarXAlign().getElement()} */}
                    {/* {this.getSidebarYAlign().getElement()} */}
                    {/* {this.getSidebarWrapWord().getElement()} */}
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
                {/* ------------------------- rules ---------------------------- */}
                {this.getMainWidget().getRules()?.getElement()}
                <this._HorizontalLine />
                {/* ------------------------- widgets list ---------------------------- */}
                {this.getSidebarWidgetsList().getElement()}
                <this._HorizontalLine />
            </div>
        );
    };

    getSidebarImageXmin = () => {
        return this.sidebarImageXmin;
    }

    getSidebarImageXmax = () => {
        return this.sidebarImageXmax;
    }

    getSidebarImageYmin = () => {
        return this.sidebarImageYmin;
    }

    getSidebarImageYmax = () => {
        return this.sidebarImageYmax;
    }

    getSidebarImageAutoXY = () => {
        return this.sidebarImageAutoXY;
    }

    getSidebarImageZmin = () => {
        return this.sidebarImageZmin;
    }

    getSidebarImageZmax = () => {
        return this.sidebarImageZmax;
    }

    getSidebarImageAutoZ = () => {
        return this.sidebarImageAutoZ;
    }

    getSidebarImageColorMap = () => {
        return this.sidebarImageColorMap;
    }

    getSidebarImageRegionsOfInterest = () => {
        return this.sidebarImageRegionsOfInterest;
    }

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
