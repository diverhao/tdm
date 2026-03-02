import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { GlobalVariables, calcSidebarWidth } from "../../../common/GlobalVariables";
import { BaseWidget } from "./BaseWidget";
import { FontsData } from "../../global/FontsData";

// specialized
import { SidebarAngle } from "../../helperWidgets/SidebarComponents/SidebarAngle";
import { SidebarChannelName } from "../../helperWidgets/SidebarComponents/SidebarChannelName";
import { SidebarChannelNames } from "../../helperWidgets/SidebarComponents/SidebarChannelNames";
import { SidebarLargeInput } from "./SidebarLargeInput";

// generic 
import { SidebarStringInput } from "../../helperWidgets/SidebarComponents/SidebarStringInput";
import { SidebarStringChoices } from "../../helperWidgets/SidebarComponents/SidebarStringChoices";
import { SidebarNumberInput } from "../../helperWidgets/SidebarComponents/SidebarNumberInput";
import { SidebarNumberChoices } from "../../helperWidgets/SidebarComponents/SidebarNumberChoices";
import { SidebarCheckBox } from "../../helperWidgets/SidebarComponents/SidebarCheckBox";
import { SidebarColor } from "../../helperWidgets/SidebarComponents/SidebarColor";

export abstract class BaseWidgetSidebar {
    private _sidebarX;
    private _sidebarY;
    private _sidebarWidth;
    private _sidebarHeight;
    private _sidebarAngle;
    private _sidebarChannelName;
    private _sidebarShowUnit;
    private _sidebarAlarmBorder;
    private _sidebarXAlign;
    private _sidebarYAlign;
    private _sidebarWrapWord;
    private _sidebarBorderWidth;
    private _sidebarBackgroundColor;
    private _sidebarTextColor;
    private _sidebarBorderColor;
    private _sidebarFontFamily;
    private _sidebarFontSize;
    private _sidebarFontStyle;
    private _sidebarFontWeight;
    private _sidebarHighlightBackgroundColor;
    private _sidebarOverflowVisible;
    private _sidebarChannelNames;
    private _sidebarLineWidth;
    private _sidebarLineStyle;
    private _sidebarLineColor;
    private _sidebarUsePvLimits;
    private _sidebarUseLogScale;
    private _sidebarMinPvValue;
    private _sidebarMaxPvValue;
    private _sidebarDirection;
    private _sidebarFillColor;
    private _sidebarFillColorMajor;
    private _sidebarFillColorMinor;
    private _sidebarFillColorInvalid;
    private _sidebarMajorSeverityColor;
    private _sidebarMinorSeverityColor;
    private _sidebarInvalidSeverityColor;
    private _sidebarShowPvValue;
    private _sidebarStepSize;
    private _sidebarText;
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
    private _sidebarAlarmPointer;
    private _sidebarAlarmDial;
    private _sidebarTankAlarmContainer;
    private _sidebarTankContainerColor;
    private _sidebarLineShowArrowHead;
    private _sidebarLineShowArrowTail;
    private _sidebarLineArrowLength;
    private _sidebarLineArrowWidth;
    private _sidebarConfirmOnWrite;
    private _sidebarConfirmOnWriteUsePassword;
    private _sidebarConfirmOnWritePasword;
    private _sidebarLargeInput: SidebarLargeInput;

    _widgetKey: string;
    _mainWidget: BaseWidget;
    // assigned inside _Element
    abstract updateFromWidget: (event: React.SyntheticEvent | undefined, propertyName: string, propertyValue: number | string | number[] | string[] | boolean) => void;

    constructor(baseWidget: BaseWidget) {
        this._mainWidget = baseWidget;
        this._widgetKey = this._mainWidget.getWidgetKey() + "-sidebar";
        const text = this.getMainWidget().getText();
        const style = this.getMainWidget().getStyle()
        this._sidebarX = new SidebarNumberInput(this, style, "left", "X", true);
        this._sidebarY = new SidebarNumberInput(this, style, "top", "Y", true);
        this._sidebarWidth = new SidebarNumberInput(this, style, "width", "Width", true);
        this._sidebarHeight = new SidebarNumberInput(this, style, "height", "Height", true);
        // todo
        this._sidebarAngle = new SidebarAngle(this);
        // todo
        this._sidebarChannelName = new SidebarChannelName(this);
        this._sidebarAlarmBorder = new SidebarCheckBox(this, text, "alarmBorder", "Alarm border");
        this._sidebarShowUnit = new SidebarCheckBox(this, text, "showUnit", "Show unit");
        this._sidebarXAlign = new SidebarStringChoices(this, text, "horizontalAlign", "X align", { Left: "flex-start", Center: "center", Right: "flex-end" });
        this._sidebarYAlign = new SidebarStringChoices(this, text, "verticalAlign", "Y align", { Top: "flex-start", Middle: "center", Bottom: "flex-end" });
        this._sidebarWrapWord = new SidebarCheckBox(this, text, "wrapWord", "Wrap word");
        this._sidebarBorderWidth = new SidebarNumberInput(this, style, "borderWidth", "Width");
        this._sidebarBackgroundColor = new SidebarColor(this, style, "backgroundColor", "Color");
        this._sidebarTextColor = new SidebarColor(this, style, "color", "Color");
        this._sidebarBorderColor = new SidebarColor(this, style, "borderColor", "Color");
        this._sidebarFontFamily = new SidebarStringChoices(this, style, "fontFamily", "Family", {
            "TDM Fonts": Object.fromEntries(Object.keys(FontsData.g_fonts).map((k) => [k, k])),
            "OS fonts (not recommended)": Object.fromEntries(FontsData.g_localFonts.map((k) => [k, k])),
        });
        this._sidebarFontSize = new SidebarNumberChoices(this, style, "fontSize", "Size", Object.fromEntries(FontsData.g_fontSizes.map((n) => [`${n}`, n])));
        this._sidebarFontStyle = new SidebarStringChoices(this, style, "fontStyle", "Style", {
            "normal": "normal",
            "italic": "italic",
        });
        this._sidebarFontWeight = new SidebarStringChoices(this, style, "fontWeight", "Weight", {
            "normal": "normal",
            "bold": "bold",
        });
        this._sidebarHighlightBackgroundColor = new SidebarColor(this, text, "highlightBackgroundColor", "Highlight color");
        this._sidebarOverflowVisible = new SidebarCheckBox(this, text, "overflowVisible", "Overflow visible");
        // todo
        this._sidebarChannelNames = new SidebarChannelNames(this);
        this._sidebarLineWidth = new SidebarNumberInput(this, text, "lineWidth", "Width");
        this._sidebarLineStyle = new SidebarStringChoices(this, text, "lineStyle", "Style", {
            Solid: "solid",
            Dashed: "dashed",
            Dotted: "dotted",
            "Dash Dot": "dash-dot",
            "Dash Dot Dot": "dash-dot-dot",
        });
        this._sidebarLineShowArrowHead = new SidebarCheckBox(this, text, "showArrowHead", "Show head");
        this._sidebarLineShowArrowTail = new SidebarCheckBox(this, text, "showArrowTail", "Show tail");
        this._sidebarLineArrowLength = new SidebarNumberInput(this, text, "arrowLength", "Length");
        this._sidebarLineArrowWidth = new SidebarNumberInput(this, text, "arrowWidth", "Width");
        this._sidebarLineColor = new SidebarColor(this, text, "lineColor", "Color");
        this._sidebarUsePvLimits = new SidebarCheckBox(this, text, "usePvLimits", "Use PV limits");
        this._sidebarUseLogScale = new SidebarCheckBox(this, text, "useLogScale", "Use Log scale");
        this._sidebarMinPvValue = new SidebarNumberInput(this, text, "minPvValue", "Min");
        this._sidebarMaxPvValue = new SidebarNumberInput(this, text, "maxPvValue", "Max");
        this._sidebarDirection = new SidebarStringChoices(this, text, "direction", "Direction", {
            Horizontal: "horizontal",
            Vertical: "vertical",
        });
        this._sidebarFillColor = new SidebarColor(this, text, "fillColor", "Color");
        this._sidebarFillColorMajor = new SidebarColor(this, text, "fillColorMajor", "Color MAJOR");
        this._sidebarFillColorMinor = new SidebarColor(this, text, "fillColorMinor", "Color MINOR");
        this._sidebarFillColorInvalid = new SidebarColor(this, text, "fillColorInvalid", "Color INVALID");
        this._sidebarMajorSeverityColor = new SidebarColor(this, text, "majorSeverityColor", "MAJOR severity color");
        this._sidebarMinorSeverityColor = new SidebarColor(this, text, "minorSeverityColor", "MINOR severity color");
        this._sidebarInvalidSeverityColor = new SidebarColor(this, text, "invalidSeverityColor", "INVALID severity color");
        this._sidebarShowPvValue = new SidebarCheckBox(this, text, "showPvValue", "Show channel value");
        this._sidebarStepSize = new SidebarNumberInput(this, style, "stepSize", "Step size");
        this._sidebarText = new SidebarStringInput(this, text, "text", "Text");
        this._sidebarInvisibleInOperation = new SidebarCheckBox(this, text, "invisibleInOperation", "Invisible in operation");
        this._sidebarNumberScale = new SidebarNumberInput(this, text, "scale", "Scale");
        this._sidebarNumberFormat = new SidebarStringChoices(this, text, "format", "Format", {
            Default: "default",
            Decimal: "decimal",
            Exponential: "exponential",
            Hexadecimal: "hexadecimal",
            String: "string",
        });
        this._sidebarShowLegend = new SidebarCheckBox(this, text, "showLegend", "Show legend");
        this._sidebarWidgetAppearance = new SidebarStringChoices(this, text, "appearance", "Style", {
            Traditional: "traditional",
            Contemporary: "contemporary",
        });
        this._sidebarAlarmLevel = new SidebarStringChoices(this, text, "alarmLevel", "Alarm level", {
            ">= MINOR": "MINOR",
            ">= MAJOR": "MAJOR",
            "= INVALID": "INVALID",
        });
        this._sidebarAlarmBackground = new SidebarCheckBox(this, text, "alarmBackground", "Alarm background");
        this._sidebarAlarmShape = new SidebarCheckBox(this, text, "alarmShape", "Alarm shape");
        this._sidebarAlarmText = new SidebarCheckBox(this, text, "alarmText", "Alarm text");
        this._sidebarAlarmFill = new SidebarCheckBox(this, text, "alarmFill", "Alarm fill");
        this._sidebarAlarmPointer = new SidebarCheckBox(this, text, "alarmPointer", "Alarm pointer");
        this._sidebarAlarmDial = new SidebarCheckBox(this, text, "alarmDial", "Alarm dial");
        this._sidebarTankAlarmContainer = new SidebarCheckBox(this, text, "alarmContainer", "Alarm container");
        this._sidebarTankContainerColor = new SidebarColor(this, text, "containerColor", "Container color");
        this._sidebarConfirmOnWrite = new SidebarCheckBox(this, text, "confirmOnWrite", "Confirm change");
        this._sidebarConfirmOnWriteUsePassword = new SidebarCheckBox(this, text, "confirmOnWriteUsePassword", "Use password");
        this._sidebarConfirmOnWritePasword = new SidebarStringInput(this, text, "confirmOnWritePassword", "Password");

        // special input, full screen for long string
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

    // getSidebarLineArrowStyle = () => {
    //     return this._sidebarLineArrowStyle;
    // };

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

    getSidebarLargeInput = () => {
        return this._sidebarLargeInput;
    }

    getSidebarLineShowArrowHead = () => {
        return this._sidebarLineShowArrowHead;
    }

    getSidebarLineShowArrowTail = () => {
        return this._sidebarLineShowArrowTail;
    }

    getSidebarLineArrowLength = () => {
        return this._sidebarLineArrowLength;
    }

    getSidebarLineArrowWidth = () => {
        return this._sidebarLineArrowWidth;
    }


    getSidebarConfirmOnWrite = () => {
        return this._sidebarConfirmOnWrite;
    }

    getSidebarConfirmOnWriteUsePassword = () => {
        return this._sidebarConfirmOnWriteUsePassword;
    }

    getSidebarConfirmOnWritePasword = () => {
        return this._sidebarConfirmOnWritePasword;
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
