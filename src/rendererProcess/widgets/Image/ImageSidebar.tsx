import * as React from "react";
import { Image } from "./Image";
import { BaseWidgetSidebar } from "../BaseWidget/BaseWidgetSidebar";
import { g_widgets1 } from "../../global/GlobalVariables";
import { calcSidebarWidth } from "../../../common/GlobalVariables";
import { Log } from "../../../common/Log";
import { SidebarImageRegionsOfInterest } from "../../helperWidgets/SidebarComponents/SidebarImageRegionsOfInterest";
import { SidebarNumberInput } from "../../helperWidgets/SidebarComponents/SidebarNumberInput";
import { SidebarCheckBox } from "../../helperWidgets/SidebarComponents/SidebarCheckBox";
import { SidebarStringChoices } from "../../helperWidgets/SidebarComponents/SidebarStringChoices";
import { colorMapFunctions } from "./ImageColorMapData";
import { SidebarStringInput } from "../../helperWidgets/SidebarComponents/SidebarStringInput";

export class ImageSidebar extends BaseWidgetSidebar {
    sidebarImageXmin;
    sidebarImageXmax;
    sidebarImageYmin;
    sidebarImageYmax;
    sidebarImageAutoXY;
    sidebarImageZmin;
    sidebarImageZmax;
    sidebarImageAutoZ;
    sidebarImageColorMap;
    sidebarImageXLabel;
    sidebarImageYLabel
    sidebarImageRegionsOfInterest: SidebarImageRegionsOfInterest;
    constructor(image: Image) {
        super(image);
        const text = this.getMainWidget().getText();
        this.sidebarImageXmin = new SidebarNumberInput(this, text, "xMin", "X min");
        this.sidebarImageXmax = new SidebarNumberInput(this, text, "xMax", "X max");
        this.sidebarImageYmin = new SidebarNumberInput(this, text, "yMin", "Y min");
        this.sidebarImageYmax = new SidebarNumberInput(this, text, "yMax", "Y max");
        this.sidebarImageAutoXY = new SidebarCheckBox(this, text, "initialAutoXY", "XY auto range");
        this.sidebarImageZmin = new SidebarNumberInput(this, text, "zMin", "Z min");
        this.sidebarImageZmax = new SidebarNumberInput(this, text, "zMax", "Z max");
        this.sidebarImageAutoZ = new SidebarCheckBox(this, text, "autoZ", "Auto range");
        this.sidebarImageXLabel = new SidebarStringInput(this, text, "xLabel", "X label");
        this.sidebarImageYLabel = new SidebarStringInput(this, text, "yLabel", "Y label");
        this.sidebarImageColorMap = new SidebarStringChoices(this, text, "colorMap", "Style", 
            Object.fromEntries(Object.keys(colorMapFunctions).map((s) => [s.toUpperCase(), s]))
        )
        this.sidebarImageRegionsOfInterest = new SidebarImageRegionsOfInterest(this);
    }

    // ------------------------------------- elements --------------------------------------
    // mockup definition to let TypeScript stop complaining
    updateFromWidget = (event: React.SyntheticEvent | undefined, propertyName: string, propertyValue: number | string | number[] | string[] | boolean): void => { };

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
                    {this.getSidebarAlarmBorder().getElement()}
                    {this.getSidebarAlarmLevel().getElement()}
                </this._BlockBody>
                <this._HorizontalLine />
                {/* ---------------- xy area -------------------------- */}
                <this._BlockTitle>
                    <b>XY Area</b>
                </this._BlockTitle>
                <this._BlockBody>
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
                    {this.getSidebarBackgroundColor().getElement()}
                    {this.getSidebarInvisibleInOperation().getElement()}
                </this._BlockBody>
                <this._HorizontalLine />
                {/* ---------------- text -------------------------- */}
                <this._BlockTitle>
                    <b>Text</b>
                </this._BlockTitle>
                <this._BlockBody>
                    {this.getSidebarImageXLabel().getElement()}
                    {this.getSidebarImageYLabel().getElement()}
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
                {/* ------------------------- rules ---------------------------- */}
                {/* no rule in Image widget */}
                {/* {this.getMainWidget().getRules()?.getElement()} */}
                {/* <this._HorizontalLine /> */}
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

    getSidebarImageXLabel = () => {
        return this.sidebarImageXLabel;
    }

    getSidebarImageYLabel = () => {
        return this.sidebarImageYLabel;
    }

}
