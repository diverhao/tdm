import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { GlobalVariables, calcSidebarWidth } from "../../../common/GlobalVariables";
import { BaseWidget } from "./BaseWidget";

import { SidebarX } from "../../helperWidgets/SidebarComponents/SidebarX";
import { SidebarY } from "../../helperWidgets/SidebarComponents/SidebarY";
import { SidebarWidth } from "../../helperWidgets/SidebarComponents/SidebarWidth";
import { SidebarHeight } from "../../helperWidgets/SidebarComponents/SidebarHeight";
import { SidebarAngle } from "../../helperWidgets/SidebarComponents/SidebarAngle";
import { SidebarChannelName } from "../../helperWidgets/SidebarComponents/SidebarChannelName";
import { SidebarShowUnit } from "../../helperWidgets/SidebarComponents/SidebarShowUnit";
import { SidebarAlarmBorder } from "../../helperWidgets/SidebarComponents/SidebarAlarmBorder";
import { SidebarXAlign } from "../../helperWidgets/SidebarComponents/SidebarXAlign";
import { SidebarYAlign } from "../../helperWidgets/SidebarComponents/SidebarYAlign";
import { SidebarWrapWord } from "../../helperWidgets/SidebarComponents/SidebarWrapWord";
import { SidebarBorderWidth } from "../../helperWidgets/SidebarComponents/SidebarBorderWidth";
import { SidebarBackgroundColor } from "../../helperWidgets/SidebarComponents/SidebarBackgroundColor";
import { SidebarTextColor } from "../../helperWidgets/SidebarComponents/SidebarTextColor";
import { SidebarBorderColor } from "../../helperWidgets/SidebarComponents/SidebarBorderColor";
import { SidebarFontFamily } from "../../helperWidgets/SidebarComponents/SidebarFontFamily";
import { SidebarFontSize } from "../../helperWidgets/SidebarComponents/SidebarFontSize";
import { SidebarFontStyle } from "../../helperWidgets/SidebarComponents/SidebarFontStyle";
import { SidebarFontWeight } from "../../helperWidgets/SidebarComponents/SidebarFontWeight";
import { SidebarHighlightBackgroundColor } from "../../helperWidgets/SidebarComponents/SidebarHighlightBackgroundColor";
import { SidebarOverflowVisible } from "../../helperWidgets/SidebarComponents/SidebarOverflowVisible";
import { SidebarChannelNames } from "../../helperWidgets/SidebarComponents/SidebarChannelNames";
import { SidebarLineWidth } from "../../helperWidgets/SidebarComponents/SidebarLineWidth";
import { SidebarLineStyle } from "../../helperWidgets/SidebarComponents/SidebarLineStyle";
import { SidebarLineArrowStyle } from "../../helperWidgets/SidebarComponents/SidebarLineArrowStyle";
import { SidebarLineColor } from "../../helperWidgets/SidebarComponents/SidebarLineColor";
import { SidebarUsePvLimits } from "../../helperWidgets/SidebarComponents/SidebarUsePvLimits";
import { SidebarUseLogScale } from "../../helperWidgets/SidebarComponents/SidebarUseLogScale";
import { SidebarMinPvValue } from "../../helperWidgets/SidebarComponents/SidebarMinPvValue";
import { SidebarMaxPvValue } from "../../helperWidgets/SidebarComponents/SidebarMaxPvValue";
import { SidebarDirection } from "../../helperWidgets/SidebarComponents/SidebarDirection";
import { SidebarFillColor } from "../../helperWidgets/SidebarComponents/SidebarFillColor";
import { SidebarFillColorMajor } from "../../helperWidgets/SidebarComponents/SidebarFillColorMajor";
import { SidebarFillColorMinor } from "../../helperWidgets/SidebarComponents/SidebarFillColorMinor";
import { SidebarFillColorInvalid } from "../../helperWidgets/SidebarComponents/SidebarFillColorInvalid";
import { SidebarMajorSeverityColor } from "../../helperWidgets/SidebarComponents/SidebarMajorSeverityColor";
import { SidebarMinorSeverityColor } from "../../helperWidgets/SidebarComponents/SidebarMinorSeverityColor";
import { SidebarInvalidSeverityColor } from "../../helperWidgets/SidebarComponents/SidebarInvalidSeverityColor";
import { SidebarShowPvValue } from "../../helperWidgets/SidebarComponents/SidebarShowPvValue";
import { SidebarStepSize } from "../../helperWidgets/SidebarComponents/SidebarStepSize";
import { SidebarText } from "../../helperWidgets/SidebarComponents/SidebarText";
import { SidebarInvisibleInOperation } from "../../helperWidgets/SidebarComponents/SidebarInvisibleInOperation";
import { SidebarNumberScale } from "../../helperWidgets/SidebarComponents/SidebarNumberScale";
import { SidebarNumberFormat } from "../../helperWidgets/SidebarComponents/SidebarNumberFormat";
import { SidebarShowLegend } from "../../helperWidgets/SidebarComponents/SidebarShowLegend";
import { SidebarWidgetAppearance } from "../../helperWidgets/SidebarComponents/SidebarWidgetAppearance"
import { SidebarAlarmLevel } from "../../helperWidgets/SidebarComponents/SidebarAlarmLevel";
import { SidebarAlarmBackground } from "../../helperWidgets/SidebarComponents/SidebarAlarmBackground";
import { SidebarAlarmShape } from "../../helperWidgets/SidebarComponents/SidebarAlarmShape";
import { SidebarAlarmText } from "../../helperWidgets/SidebarComponents/SidebarAlarmText";
import { SidebarAlarmFill } from "../../helperWidgets/SidebarComponents/SidebarAlarmFill";
import { SidebarAlarmDial } from "../../helperWidgets/SidebarComponents/SidebarAlarmDial";
import { SidebarAlarmPointer } from "../../helperWidgets/SidebarComponents/SidebarAlarmPointer";
import { SidebarTankAlarmContainer } from "../../helperWidgets/SidebarComponents/SidebarTankAlarmContainer";
import { SidebarTankContainerColor } from "../../helperWidgets/SidebarComponents/SidebarTankContainerColor";
import { SidebarWriteConfirmation } from "../../helperWidgets/SidebarComponents/SidebarWriteConfirmation";
import { SidebarLargeInput } from "./SidebarLargeInput";

export abstract class BaseWidgetSidebar {
    private _sidebarX: SidebarX;
    private _sidebarY: SidebarY;
    private _sidebarWidth: SidebarWidth;
    private _sidebarHeight: SidebarHeight;
    private _sidebarAngle: SidebarAngle;
    private _sidebarChannelName: SidebarChannelName;
    private _sidebarShowUnit: SidebarShowUnit;
    private _sidebarAlarmBorder: SidebarAlarmBorder;
    private _sidebarXAlign: SidebarXAlign;
    private _sidebarYAlign: SidebarYAlign;
    private _sidebarWrapWord: SidebarWrapWord;
    private _sidebarBorderWidth: SidebarBorderWidth;
    private _sidebarBackgroundColor: SidebarBackgroundColor;
    private _sidebarTextColor: SidebarTextColor;
    private _sidebarBorderColor: SidebarBorderColor;
    private _sidebarFontFamily: SidebarFontFamily;
    private _sidebarFontSize: SidebarFontSize;
    private _sidebarFontStyle: SidebarFontStyle;
    private _sidebarFontWeight: SidebarFontWeight;
    private _sidebarHighlightBackgroundColor: SidebarHighlightBackgroundColor;
    private _sidebarOverflowVisible: SidebarOverflowVisible;
    private _sidebarChannelNames: SidebarChannelNames;
    private _sidebarLineWidth: SidebarLineWidth;
    private _sidebarLineStyle: SidebarLineStyle;
    private _sidebarLineArrowStyle: SidebarLineArrowStyle;
    private _sidebarLineColor: SidebarLineColor;
    private _sidebarUsePvLimits: SidebarUsePvLimits;
    private _sidebarUseLogScale: SidebarUseLogScale;
    private _sidebarMinPvValue: SidebarMinPvValue;
    private _sidebarMaxPvValue: SidebarMaxPvValue;
    private _sidebarDirection: SidebarDirection;
    private _sidebarFillColor: SidebarFillColor;
    private _sidebarFillColorMajor: SidebarFillColorMajor;
    private _sidebarFillColorMinor: SidebarFillColorMinor;
    private _sidebarFillColorInvalid: SidebarFillColorInvalid;
    private _sidebarMajorSeverityColor: SidebarMajorSeverityColor;
    private _sidebarMinorSeverityColor: SidebarMinorSeverityColor;
    private _sidebarInvalidSeverityColor: SidebarInvalidSeverityColor;
    private _sidebarShowPvValue: SidebarShowPvValue;
    private _sidebarStepSize: SidebarStepSize;
    private _sidebarText: SidebarText;
    private _sidebarInvisibleInOperation;
    private _sidebarNumberScale;
    private _sidebarNumberFormat;
    private _sidebarShowLegend;
    private _sidebarWidgetAppearance;
    private _sidebarAlarmLevel;
    private _sidebarAlarmBackground;
    private _sidebarAlarmShape;
    private _sidebarAlarmText;
    private _sidebarAlarmFill;
    private _sidebarAlarmPointer: SidebarAlarmPointer;
    private _sidebarAlarmDial: SidebarAlarmDial;
    private _sidebarTankAlarmContainer: SidebarTankAlarmContainer;
    private _sidebarTankContainerColor: SidebarTankContainerColor
    private _sidebarWriteConfirmation: SidebarWriteConfirmation;


    private _sidebarLargeInput: SidebarLargeInput;

    _widgetKey: string;
    _mainWidget: BaseWidget;
    // assigned inside _Element
    abstract updateFromWidget: (event: any, propertyName: string, propertyValue: number | string | number[] | string[] | boolean) => void;

    constructor(baseWidget: BaseWidget) {
        this._mainWidget = baseWidget;
        this._widgetKey = this._mainWidget.getWidgetKey() + "-sidebar";
        // components, some of them may not be used
        this._sidebarX = new SidebarX(this);
        this._sidebarY = new SidebarY(this);
        this._sidebarWidth = new SidebarWidth(this);
        this._sidebarHeight = new SidebarHeight(this);
        this._sidebarAngle = new SidebarAngle(this);
        this._sidebarChannelName = new SidebarChannelName(this);
        this._sidebarAlarmBorder = new SidebarAlarmBorder(this);
        this._sidebarShowUnit = new SidebarShowUnit(this);
        this._sidebarXAlign = new SidebarXAlign(this);
        this._sidebarYAlign = new SidebarYAlign(this);
        this._sidebarWrapWord = new SidebarWrapWord(this);
        this._sidebarBorderWidth = new SidebarBorderWidth(this);
        this._sidebarBackgroundColor = new SidebarBackgroundColor(this);
        this._sidebarTextColor = new SidebarTextColor(this);
        this._sidebarBorderColor = new SidebarBorderColor(this);
        this._sidebarFontFamily = new SidebarFontFamily(this);
        this._sidebarFontSize = new SidebarFontSize(this);
        this._sidebarFontStyle = new SidebarFontStyle(this);
        this._sidebarFontWeight = new SidebarFontWeight(this);
        this._sidebarHighlightBackgroundColor = new SidebarHighlightBackgroundColor(this);
        this._sidebarOverflowVisible = new SidebarOverflowVisible(this);
        this._sidebarChannelNames = new SidebarChannelNames(this);
        this._sidebarLineWidth = new SidebarLineWidth(this);
        this._sidebarLineStyle = new SidebarLineStyle(this);
        this._sidebarLineArrowStyle = new SidebarLineArrowStyle(this);
        this._sidebarLineColor = new SidebarLineColor(this);
        this._sidebarUsePvLimits = new SidebarUsePvLimits(this);
        this._sidebarUseLogScale = new SidebarUseLogScale(this);
        this._sidebarMinPvValue = new SidebarMinPvValue(this);
        this._sidebarMaxPvValue = new SidebarMaxPvValue(this);
        this._sidebarDirection = new SidebarDirection(this);
        this._sidebarFillColor = new SidebarFillColor(this);
        this._sidebarFillColorMajor = new SidebarFillColorMajor(this);
        this._sidebarFillColorMinor = new SidebarFillColorMinor(this);
        this._sidebarFillColorInvalid = new SidebarFillColorInvalid(this);
        this._sidebarMajorSeverityColor = new SidebarMajorSeverityColor(this);
        this._sidebarMinorSeverityColor = new SidebarMinorSeverityColor(this);
        this._sidebarInvalidSeverityColor = new SidebarInvalidSeverityColor(this);
        this._sidebarShowPvValue = new SidebarShowPvValue(this);
        this._sidebarStepSize = new SidebarStepSize(this);
        this._sidebarText = new SidebarText(this);
        this._sidebarInvisibleInOperation = new SidebarInvisibleInOperation(this);
        this._sidebarNumberScale = new SidebarNumberScale(this);
        this._sidebarNumberFormat = new SidebarNumberFormat(this);
        this._sidebarShowLegend = new SidebarShowLegend(this);
        this._sidebarWidgetAppearance = new SidebarWidgetAppearance(this);
        this._sidebarAlarmLevel = new SidebarAlarmLevel(this);
        this._sidebarAlarmBackground = new SidebarAlarmBackground(this);
        this._sidebarAlarmShape = new SidebarAlarmShape(this);
        this._sidebarAlarmText = new SidebarAlarmText(this);
        this._sidebarAlarmFill = new SidebarAlarmFill(this);
        this._sidebarAlarmPointer = new SidebarAlarmPointer(this);
        this._sidebarAlarmDial = new SidebarAlarmDial(this);
        this._sidebarTankAlarmContainer = new SidebarTankAlarmContainer(this);
        this._sidebarTankContainerColor = new SidebarTankContainerColor(this);
        this._sidebarWriteConfirmation = new SidebarWriteConfirmation(this);

        this._sidebarLargeInput = new SidebarLargeInput();
    }

    // ------------------------------------- elements --------------------------------------

    abstract _Element: () => React.JSX.Element;

    getElement = (): React.JSX.Element | null => {
        return <this._Element key={this._widgetKey}></this._Element>;
    };

    _HorizontalLine = () => {
        return <div>&nbsp;</div>;
    };

    _BlockBody = ({ children }: any) => {
        return (
            <div
                style={{
                    display: "inline-flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    marginTop: 2,
                    marginBottom: 2,
                    width: "100%",
                }}
            >
                {" "}
                {children}
            </div>
        );
    };

    _BlockTitle = ({ children }: any) => {
        return (
            <div
                style={{
                    marginTop: 2,
                    marginBottom: 2,
                    width: "100%",
                }}
            >
                {children}
            </div>
        );
    };

    // ----------------------- mouse events --------------------
    /**
     * Right click button on side bar: copy/paste/cut
     */
    handleMouseDown = (event: React.MouseEvent) => {

        const activeElement = document.activeElement;

        if (event.button === 2 && g_widgets1.isEditing() && activeElement instanceof HTMLInputElement) {
            const hasSelection = window.getSelection() === null ? false : window.getSelection()?.toString() !== "";
            g_widgets1.getRoot().getDisplayWindowClient().getIpcManager().sendFromRendererProcess(
                "show-context-menu-sidebar",
                {
                    mode: g_widgets1.isEditing() ? "editing" : "operating",
                    displayWindowId: g_widgets1.getRoot().getDisplayWindowClient().getWindowId(),
                    widgetKeys: [],
                    options: { hasSelection: hasSelection },
                }
            )
        }
    }


    // ---------------------- getters --------------------------

    getWidgetKey = (): string => {
        return this._widgetKey;
    };

    getMainWidget = (): BaseWidget => {
        return this._mainWidget;
    };

    getUpdateFromSidebar = () => {
        return this._mainWidget.updateFromSidebar;
    };

    getStyle = () => {
        return { ...this._style, width: calcSidebarWidth() };
    };

    getFormStyle = () => {
        return this._formStyle;
    };

    getInputStyle = () => {
        return this._inputStyle;
    };

    getSidebarX = () => {
        return this._sidebarX;
    };

    getSidebarY = () => {
        return this._sidebarY;
    };

    getSidebarWidth = () => {
        return this._sidebarWidth;
    };

    getSidebarHeight = () => {
        return this._sidebarHeight;
    };
    getSidebarAngle = () => {
        return this._sidebarAngle;
    };
    getSidebarChannelName = () => {
        return this._sidebarChannelName;
    };

    getSidebarShowUnit = () => {
        return this._sidebarShowUnit;
    };

    getSidebarAlarmBorder = () => {
        return this._sidebarAlarmBorder;
    };

    getSidebarXAlign = () => {
        return this._sidebarXAlign;
    };

    getSidebarYAlign = () => {
        return this._sidebarYAlign;
    };

    getSidebarWrapWord = () => {
        return this._sidebarWrapWord;
    };

    getSidebarBorderWidth = () => {
        return this._sidebarBorderWidth;
    };

    getSidebarBackgroundColor = () => {
        return this._sidebarBackgroundColor;
    };

    getSidebarTextColor = () => {
        return this._sidebarTextColor;
    };

    getSidebarBorderColor = () => {
        return this._sidebarBorderColor;
    };

    getSidebarFontFamily = () => {
        return this._sidebarFontFamily;
    };

    getSidebarFontSize = () => {
        return this._sidebarFontSize;
    };

    getSidebarFontStyle = () => {
        return this._sidebarFontStyle;
    };

    getSidebarFontWeight = () => {
        return this._sidebarFontWeight;
    };

    getSidebarHighlightBackgroundColor = () => {
        return this._sidebarHighlightBackgroundColor;
    };

    getSidebarOverflowVisible = () => {
        return this._sidebarOverflowVisible;
    };

    getSidebarChannelNames = () => {
        return this._sidebarChannelNames;
    };

    getSidebarLineWidth = () => {
        return this._sidebarLineWidth;
    };

    getSidebarLineStyle = () => {
        return this._sidebarLineStyle;
    };

    getSidebarLineArrowStyle = () => {
        return this._sidebarLineArrowStyle;
    };

    getSidebarLineColor = () => {
        return this._sidebarLineColor;
    };

    getSidebarUsePvLimits = () => {
        return this._sidebarUsePvLimits;
    };

    getSidebarUseLogScale = () => {
        return this._sidebarUseLogScale;
    };

    getSidebarMinPvValue = () => {
        return this._sidebarMinPvValue;
    };

    getSidebarMaxPvValue = () => {
        return this._sidebarMaxPvValue;
    };

    getSidebarDirection = () => {
        return this._sidebarDirection;
    };

    getSidebarFillColor = () => {
        return this._sidebarFillColor;
    };

    getSidebarFillColorMajor = () => {
        return this._sidebarFillColorMajor;
    };

    getSidebarFillColorMinor = () => {
        return this._sidebarFillColorMinor;
    };

    getSidebarFillColorInvalid = () => {
        return this._sidebarFillColorInvalid;
    };

    getSidebarMajorSeverityColor = () => {
        return this._sidebarMajorSeverityColor;
    };

    getSidebarMinorSeverityColor = () => {
        return this._sidebarMinorSeverityColor;
    };

    getSidebarInvalidSeverityColor = () => {
        return this._sidebarInvalidSeverityColor;
    };

    getSidebarShowPvValue = () => {
        return this._sidebarShowPvValue;
    };

    getSidebarStepSize = () => {
        return this._sidebarStepSize;
    };

    getSidebarText = () => {
        return this._sidebarText;
    };

    getSidebarInvisibleInOperation = () => {
        return this._sidebarInvisibleInOperation;
    };

    getSidebarNumberScale = () => {
        return this._sidebarNumberScale;
    };

    getSidebarNumberFormat = () => {
        return this._sidebarNumberFormat;
    };

    getSidebarShowLegend = () => {
        return this._sidebarShowLegend;
    };

    getSidebarWidgetAppearance = () => {
        return this._sidebarWidgetAppearance;
    }

    getSidebarWidgetsList = () => {
        return g_widgets1.getSidebarWidgetsList();
    }

    getSidebarAlarmLevel = () => {
        return this._sidebarAlarmLevel;
    }

    getSidebarAlarmBackground = () => {
        return this._sidebarAlarmBackground;
    }

    getSidebarAlarmShape = () => {
        return this._sidebarAlarmShape;
    }

    getSidebarAlarmText = () => {
        return this._sidebarAlarmText;
    }

    getSidebarAlarmFill = () => {
        return this._sidebarAlarmFill;
    }

    getSidebarAlarmPointer = () => {
        return this._sidebarAlarmPointer;
    }

    getSidebarAlarmDial = () => {
        return this._sidebarAlarmDial;
    }

    getSidebarTankAlarmContainer = () => {
        return this._sidebarTankAlarmContainer;
    }

    getSidebarTankContainerColor = () => {
        return this._sidebarTankContainerColor;
    }

    getSidebarWriteConfirmation = () => {
        return this._sidebarWriteConfirmation;
    }

    getSidebarLargeInput = () => {
        return this._sidebarLargeInput;
    }

    // ------------------------- style -------------------------
    _style: Record<string, any> = {
        // inline-flex
        display: "inline-flex",
        justifyContent: "flex-start",
        alignItems: "flex-start",
        flexDirection: "column",
        // not "absolute"
        position: "fixed",
        // box model
        top: 0,
        right: 0,
        margin: 0,
        padding: GlobalVariables.sidebarBorderWidth,
        borderWidth: 0,
        // width: GlobalVariables.sidebarWidth,
        width: 100, // replace by calcSidebarWidth()
        height: "100%",
        overflowX: "hidden",
        overflowY: "scroll",
        userSelect: "none",
        // background color
        backgroundColor: "rgba(255,255,255,1)",
        // separator
        borderStyle: "solid",
        borderLeftWidth: GlobalVariables.sidebarBorderWidth,
        borderColor: "red",
        boxSizing: "border-box",
    };

    _inputStyle: Record<string, any> = {
        width: "70%",
        fontFamily: GlobalVariables.defaultFontFamily,
        fontSize: GlobalVariables.defaultFontSize,
    };

    _formStyle: Record<string, any> = {
        display: "inline-flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 2,
        marginBottom: 2,
    };
}
