import * as GlobalMethods from "../../../common/GlobalMethods";
import { Channel_ACCESS_RIGHTS, GlobalVariables } from "../../../common/GlobalVariables";
import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { BooleanButtonSidebar } from "./BooleanButtonSidebar";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { BooleanButtonRules } from "./BooleanButtonRules";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { Log } from "../../../common/Log";
import { deepMerge } from "../../../common/GlobalMethods";

export type type_BooleanButton_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
    // Boolean Button specific
    itemNames: string[];
    itemColors: string[];
    itemValues: number[];
};

export class BooleanButton extends BaseWidget {

    _rules: BooleanButtonRules;
    _itemNames: string[];
    _itemColors: string[];
    _itemValues: number[];

    // used for indicating if the mouse button is down
    buttonPressed: boolean = false;
    forceUpdateButton = (input: any) => { };

    constructor(widgetTdl: type_BooleanButton_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this.setReadWriteType("write");


        const defaultTdl = this.generateDefaultTdl();
        this._itemNames = deepMerge(widgetTdl.itemNames, defaultTdl.itemNames);
        this._itemColors = deepMerge(widgetTdl.itemColors, defaultTdl.itemColors);
        this._itemValues = deepMerge(widgetTdl.itemValues, defaultTdl.itemValues);
        // ensure the same number of states
        const numStates = 2;
        this._itemNames.splice(numStates);
        this._itemColors.splice(numStates);
        this._itemValues.splice(numStates);

        this._rules = new BooleanButtonRules(this, widgetTdl);
    }

    // ------------------------------ elements ---------------------------------

    _ElementRaw = () => {

        // guard the widget from double rendering
        this.widgetBeingRendered = true;
        React.useEffect(() => {
            this.widgetBeingRendered = false;
        });
        g_widgets1.removeFromForceUpdateWidgets(this.getWidgetKey());

        this.updateAllStyleAndText();

        return (
            <ErrorBoundary style={this.getStyle()} widgetKey={this.getWidgetKey()}>
                <div style={this.getElementBodyRawStyle()}>
                    <this._ElementArea></this._ElementArea>
                    {this.showResizers() ? <this._ElementResizer /> : null}
                </div>
                {this.showSidebar() ? this.getSidebar()?.getElement() : null}
            </ErrorBoundary>
        );
    };

    _ElementAreaRaw = ({ }: any): React.JSX.Element => {
        const allText = this.getAllText();
        const whiteSpace = allText.wrapWord ? "normal" : "pre";
        const outline = this._getElementAreaRawOutlineStyle();
        const backgroundColor = this._getElementAreaRawBackgroundStyle();

        return (
            <div
                style={{
                    display: "inline-flex",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    userSelect: "none",
                    overflow: "visible",
                    whiteSpace: whiteSpace,
                    outline: outline,
                    backgroundColor: backgroundColor,
                }}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                <this._ElementBooleanButton></this._ElementBooleanButton>
            </div>
        );
    };

    _Element = React.memo(this._ElementRaw, () => this._useMemoedElement());
    _ElementArea = React.memo(this._ElementAreaRaw, () => this._useMemoedElement());

    _ElementBooleanButton = () => {
        const elementRef = React.useRef<any>(null);
        const [, forceUpdate] = React.useState({});
        this.forceUpdateButton = forceUpdate;

        // styles
        const allText = this.getAllText();
        const allStyle = this.getAllStyle();
        const showLED = allText["showLED"];
        const width = allStyle["width"];
        const height = allStyle["height"];

        // LED circle
        const alignItems = allText["verticalAlign"];
        const justifyContent = allText["horizontalAlign"];
        const ledCircleDiameter = Math.min(width, height) * 0.5;

        // color and text
        const itemColor = this.calcItemColor();
        const itemText = this.calcItemText();
        const buttonColor = showLED === true ? "rgba(0,0,0,0)" : itemColor;
        const ledColor = showLED === true ? itemColor : "rgba(0,0,0,0)";


        // 3D shadow
        let threeDStyle = {};
        if (this.buttonPressed) {
            // force change when mouse down
            threeDStyle = this.get3dButtonStyle(this.buttonPressed);
            this.buttonPressed = false;
        } else {
            // use PV value
            const itemIndex = this.calcItemIndex();
            if (itemIndex === 0) {
                threeDStyle = this.get3dButtonStyle(false);
            } else {
                threeDStyle = this.get3dButtonStyle(true);
            }
        }

        return (
            <div
                ref={elementRef}
                // 3D shadow, background color
                style={{
                    display: "inline-flex",
                    alignItems: alignItems,
                    justifyContent: justifyContent,
                    backgroundColor: buttonColor,
                    ...threeDStyle,
                }}
                onMouseDown={(event: any) => { this.handleMouseActionOnButton(event, "down") }}
                onMouseUp={(event: any) => { this.handleMouseActionOnButton(event, "up") }}
                // do not use onMouseOver, which also applies to the children elements
                onMouseEnter={(event: any) => this.hanldeMouseEnterWriteWidget(event, elementRef)}
                // do not use onMouseOut
                onMouseLeave={(event: any) => this.handleMouseLeaveWriteWidget(event, elementRef)}
            >
                <div
                    style={{
                        width: ledCircleDiameter,
                        height: ledCircleDiameter,
                        display: "inline-flex",
                        borderRadius: ledCircleDiameter / 2,
                        backgroundColor: ledColor,
                        border: "solid 1px rgba(30,30,30,1)",
                        opacity: showLED === true ? 1 : 0,
                    }}
                ></div>
                &nbsp;
                {itemText}
            </div>
        );
    };

    // -------------------- helper functions ----------------

    /**
     * when the mouse is down or up on the button, do something
     */
    handleMouseActionOnButton = (event: any, direction: "down" | "up") => {
        event.preventDefault();
        // left button only
        if (event.button !== 0) {
            return;
        }
        // do nothing during editing
        if (g_widgets1.isEditing()) {
            return;
        }
        // write permission
        if (this._getChannelAccessRight() < Channel_ACCESS_RIGHTS.READ_WRITE) {
            return;
        }

        if (direction === "down") {
            this.buttonPressed = true;
        }

        const allText = this.getAllText();
        const onValue = allText["onValue"];
        const offValue = allText["offValue"];
        const buttonMode = allText["mode"];
        let targetValue = allText["onValue"];

        let currentValue = this._getChannelValue(true);
        if (typeof currentValue !== "number") {
            return;
        }
        if (currentValue !== offValue) {
            currentValue = onValue;
        }

        if (buttonMode === "Toggle") {
            if (direction === "down") {
                if (currentValue === onValue) {
                    targetValue = offValue;
                } else {
                    targetValue = onValue;
                }
            } else {
                this.forceUpdateButton({});
                return;
            }
        } else if (buttonMode === "Push") {
            if (direction === "down") {
                targetValue = onValue;
            } else {
                targetValue = offValue;
            }
        } else if (buttonMode === "Push (inverted)") {
            if (direction === "down") {
                targetValue = offValue;
            } else {
                targetValue = onValue;
            }
        } else {
            return;
        }

        const channelName = this.getChannelNames()[0];
        this.putChannelValue(channelName, targetValue);
        this.forceUpdateButton({});
    };


    handleSelectAFile = (options: Record<string, any>, fileName: string) => {
        const itemIndex = options["itemIndex"];
        const sidebar = this.getSidebar();
        if (typeof itemIndex === "number" && sidebar !== undefined) {
            (sidebar as BooleanButtonSidebar).setBeingUpdatedItemIndex(itemIndex);
            sidebar.updateFromWidget(undefined, "select-a-file", fileName);
        }
    };


    // -------------------------- tdl -------------------------------

    static generateDefaultTdl = () => {

        const defaultTdl: type_BooleanButton_tdl = {
            type: "BooleanButton",
            widgetKey: "", // "key" is a reserved keyword
            key: "",
            style: {
                // basics
                position: "absolute",
                display: "inline-flex",
                // dimensions
                left: 0,
                top: 0,
                width: 100,
                height: 100,
                backgroundColor: "rgba(210, 210, 210, 1)",
                // angle
                transform: "rotate(0deg)",
                // font
                color: "rgba(0,0,0,1)",
                fontFamily: GlobalVariables.defaultFontFamily,
                fontSize: GlobalVariables.defaultFontSize,
                fontStyle: GlobalVariables.defaultFontStyle,
                fontWeight: GlobalVariables.defaultFontWeight,
                // border, it is different from the "alarmBorder" below
                borderStyle: "solid",
                borderWidth: 0,
                borderColor: "rgba(0, 0, 0, 1)",
                // shows when the widget is selected
                outlineStyle: "none",
                outlineWidth: 1,
                outlineColor: "rgba(0,0,0,1)",
            },
            text: {
                // the LED indicator or picture position and size
                horizontalAlign: "center",
                verticalAlign: "center",
                // text styles
                wrapWord: false,
                showUnit: false,
                // use picture instead of colors
                usePictures: false,
                showLED: true,
                alarmBorder: true,
                // Toggle/Push/Push (inverted)
                mode: "Toggle",
                // becomes not visible in operation mode, but still clickable
                invisibleInOperation: false,
                onPicture: "", // not implemented yet
                offPicture: "",
                // "contemporary" | "traditional"
                appearance: "traditional",
                confirmOnWrite: false,
                confirmOnWriteUsePassword: false,
                confirmOnWritePassword: "",
                // discrete states
                bit: 0,
                useChannelItems: false,
                fallbackColor: "rgba(255,0,255,1)",
                fallbackText: "Wrong state",
            },
            channelNames: [],
            groupNames: [],
            rules: [],
            // discrete states
            itemNames: ["False", "True"],
            itemColors: ["rgba(60, 100, 60, 1)", "rgba(0, 255, 0, 1)"],
            itemValues: [0, 1],

        };
        defaultTdl["widgetKey"] = GlobalMethods.generateWidgetKey(defaultTdl["type"]);
        return JSON.parse(JSON.stringify(defaultTdl));
    };

    generateDefaultTdl: () => any = BooleanButton.generateDefaultTdl;

    // overload
    getTdlCopy(newKey: boolean = true): Record<string, any> {
        const result = super.getTdlCopy(newKey);
        result["itemColors"] = JSON.parse(JSON.stringify(this.getItemColors()));
        result["itemNames"] = JSON.parse(JSON.stringify(this.getItemNames()));
        result["itemValues"] = JSON.parse(JSON.stringify(this.getItemValues()));
        return result;
    }
    // --------------------- getters -------------------------

    // override
    getItemNames() {
        return this._itemNames;
    };
    getItemColors() {
        return this._itemColors;
    };
    getItemValues() {
        return this._itemValues;
    };

    // -------------------------- sidebar ---------------------------
    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new BooleanButtonSidebar(this);
        }
    }
}
