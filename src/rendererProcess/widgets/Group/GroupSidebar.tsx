import * as React from "react";
import { Group } from "./Group";
import { BaseWidgetSidebar } from "../BaseWidget/BaseWidgetSidebar";
import { SidebarGroupItems } from "../../helperWidgets/SidebarComponents/SidebarGroupItems";
import { SidebarStringChoices } from "../../helperWidgets/SidebarComponents/SidebarStringChoices";
import { SidebarNumberInput } from "../../helperWidgets/SidebarComponents/SidebarNumberInput";
import { SidebarColor } from "../../helperWidgets/SidebarComponents/SidebarColor";
import { SidebarCheckBox } from "../../helperWidgets/SidebarComponents/SidebarCheckBox";
import { Log } from "../../../common/Log";
import { g_widgets1 } from "../../global/GlobalVariables";
import { calcSidebarWidth } from "../../../common/GlobalVariables";


export class GroupSidebar extends BaseWidgetSidebar {

    private _sidebarGroupItems: SidebarGroupItems;
    _sidebarEmbeddedDisplayTabPosition;
    _sidebarEmbeddedDisplayTabSelectedColor;
    _sidebarEmbeddedDisplayTabDefaultColor;
    _sidebarEmbeddedDisplayTabWidth;
    _sidebarEmbeddedDisplayTabHeight;
    _sidebarEmbeddedDisplayShowTab;
    _sidebarGroupShowBox;

    constructor(group: Group) {
        super(group);
        const text = this.getMainWidget().getText();
        this._sidebarGroupItems = new SidebarGroupItems(this);
        this._sidebarEmbeddedDisplayTabPosition = new SidebarStringChoices(this, text, "tabPostion", "Position", {top: "top", left: "left", bottom: "bottom", right: "right"});
        this._sidebarEmbeddedDisplayTabSelectedColor = new SidebarColor(this, text, "tabSelectedColor", "Selected color");
        this._sidebarEmbeddedDisplayTabDefaultColor = new SidebarColor(this, text, "tabDefaultColor", "Default color");
        this._sidebarEmbeddedDisplayTabWidth = new SidebarNumberInput(this, text, "tabWidth", "Width");
        this._sidebarEmbeddedDisplayTabHeight = new SidebarNumberInput(this, text, "tabHeight", "Height");
        this._sidebarEmbeddedDisplayShowTab = new SidebarCheckBox(this, text, "showTab", "Show tab");
        this._sidebarGroupShowBox = new SidebarCheckBox(this, text, "showBox", "Show box");
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
                <h3>Group</h3>
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
                {/* <this._BlockTitle> */}
                {/* <b>Channel</b> */}
                {/* </this._BlockTitle> */}
                {/* <this._BlockBody> */}
                {/* {this.getSidebarChannelName().getElement()} */}
                {/* {this.getSidebarShowUnit().getElement()} */}
                {/* {this.getSidebarAlarmBorder().getElement()} */}
                {/* </this._BlockBody> */}
                {/* <this._HorizontalLine /> */}
                {/* ---------------- background -------------------------- */}
                {/* <this._BlockTitle> */}
                {/* <b>Background</b> */}
                {/* </this._BlockTitle> */}
                {/* <this._BlockBody> */}
                {/* color */}
                {/* {this.getSidebarBackgroundColor().getElement()} */}
                {/* </this._BlockBody> */}
                {/* <this._HorizontalLine /> */}
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
                {/* ---------------------------- tab ------------------------ */}
                <this._BlockTitle>
                    <b>Tabs</b>
                </this._BlockTitle>
                <this._BlockBody>
                    {this.getSidebarEmbeddedDisplayTabPosition().getElement()}
                    {this.getSidebarEmbeddedDisplayTabDefaultColor().getElement()}
                    {this.getSidebarEmbeddedDisplayTabSelectedColor().getElement()}
                    {this.getSidebarEmbeddedDisplayTabWidth().getElement()}
                    {this.getSidebarEmbeddedDisplayTabHeight().getElement()}
                    {this.getSidebarEmbeddedDisplayShowTab().getElement()}
                    {this.getSidebarGroupShowBox().getElement()}
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
                {/* ---------------------- groups ---------------------- */}
                <this._BlockTitle>
                    <b>Groups</b>
                </this._BlockTitle>
                <this._BlockBody>
                    {this.getSidebarGroupItems().getElement()}
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

    getSidebarGroupItems = () => {
        return this._sidebarGroupItems;
    }

    getSidebarEmbeddedDisplayTabPosition = () => {
        return this._sidebarEmbeddedDisplayTabPosition;
    }

    getSidebarEmbeddedDisplayTabSelectedColor = () => {
        return this._sidebarEmbeddedDisplayTabSelectedColor;
    }

    getSidebarEmbeddedDisplayTabDefaultColor = () => {
        return this._sidebarEmbeddedDisplayTabDefaultColor;
    }

    getSidebarEmbeddedDisplayTabWidth = () => {
        return this._sidebarEmbeddedDisplayTabWidth;
    }
    getSidebarEmbeddedDisplayTabHeight = () => {
        return this._sidebarEmbeddedDisplayTabHeight;
    }

    getSidebarEmbeddedDisplayShowTab = () => {
        return this._sidebarEmbeddedDisplayShowTab;
    }

    getSidebarGroupShowBox = () => {
        return this._sidebarGroupShowBox;
    }
    // ------------------------- style -------------------------

    // defined in super class
    // _style
    // _inputStyle
    // _formStyle
}
