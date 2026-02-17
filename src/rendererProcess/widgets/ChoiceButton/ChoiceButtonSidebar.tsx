import * as React from "react";
import { ChoiceButton } from "./ChoiceButton";
import { BaseWidgetSidebar } from "../BaseWidget/BaseWidgetSidebar";
import { SidebarChoiceButtonSelectedBackgroundColor } from "../../helperWidgets/SidebarComponents/SidebarChoiceButtonSelectedBackgroundColor";
import { SidebarChoiceButtonUnselectedBackgroundColor } from "../../helperWidgets/SidebarComponents/SidebarChoiceButtonUnselectedBackgroundColor";
import { SidebarChoiceButtonUseChannelItems } from "../../helperWidgets/SidebarComponents/SidebarChoiceButtonUseChannelItems";
import { Log } from "../../../common/Log";
import { g_widgets1 } from "../../global/GlobalVariables";
import { calcSidebarWidth } from "../../../common/GlobalVariables";
import { SidebarLEDMultiStateItems } from "../../helperWidgets/SidebarComponents/SidebarLEDMultiStateItems";

export class ChoiceButtonSidebar extends BaseWidgetSidebar {
    _sidebarChoiceButtonSelectedBackgroundColor: SidebarChoiceButtonSelectedBackgroundColor;
    _sidebarChoiceButtonUnselectedBackgroundColor: SidebarChoiceButtonUnselectedBackgroundColor;
    _sidebarChoiceButtonUseChannelItems: SidebarChoiceButtonUseChannelItems;
    _sidebarLEDMultiStateItems: SidebarLEDMultiStateItems;

    constructor(choiceButton: ChoiceButton) {
        super(choiceButton);
        this._sidebarChoiceButtonSelectedBackgroundColor = new SidebarChoiceButtonSelectedBackgroundColor(this);
        this._sidebarChoiceButtonUnselectedBackgroundColor = new SidebarChoiceButtonUnselectedBackgroundColor(this);
        this._sidebarChoiceButtonUseChannelItems = new SidebarChoiceButtonUseChannelItems(this);
        this._sidebarLEDMultiStateItems = new SidebarLEDMultiStateItems(this);
    }

    getSidebarChoiceButtonUnselectedBackgroundColor = () => {
        return this._sidebarChoiceButtonUnselectedBackgroundColor;
    };

    getSidebarChoiceButtonSelectedBackgroundColor = () => {
        return this._sidebarChoiceButtonSelectedBackgroundColor;
    };

    getSidebarChoiceButtonUseChannelItems = () => {
        return this._sidebarChoiceButtonUseChannelItems;
    };


    getSidebarLEDMultiStateItems = () => {
        return this._sidebarLEDMultiStateItems;
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
                <h3>Choice Button</h3>
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
                    {this.getSidebarShowUnit().getElement()}
                    {this.getSidebarAlarmText().getElement()}
                    {this.getSidebarAlarmBackground().getElement()}
                    {this.getSidebarAlarmBorder().getElement()}
                    {this.getSidebarAlarmLevel().getElement()}
                </this._BlockBody>
                <this._HorizontalLine />
                {/* --------------------------- items -------------------------- */}
                {this.getSidebarLEDMultiStateItems().getElement()}
                {this.getSidebarChoiceButtonUseChannelItems().getElement()}
                <this._HorizontalLine />
                {/* ---------------- background -------------------------- */}
                <this._BlockTitle>
                    <b>Background</b>
                </this._BlockTitle>
                <this._BlockBody>
                    {/* color */}
                    {this.getSidebarChoiceButtonSelectedBackgroundColor().getElement()}
                    {this.getSidebarChoiceButtonUnselectedBackgroundColor().getElement()}
                    {this.getSidebarInvisibleInOperation().getElement()}
                    {this.getSidebarDirection().getElement()}
                    {this.getSidebarWidgetAppearance().getElement()}
                </this._BlockBody>
                <this._HorizontalLine />
                {/* ---------------- text -------------------------- */}
                <this._BlockTitle>
                    <b>Text</b>
                </this._BlockTitle>
                <this._BlockBody>
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
