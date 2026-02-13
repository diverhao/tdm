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

export type type_BooleanButton_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
};

export class BooleanButton extends BaseWidget {
    channelItemsUpdated: boolean = false;

    _rules: BooleanButtonRules;
    buttonPressed: boolean = false;
    forceUpdateButton = (input: any) => { };

    constructor(widgetTdl: type_BooleanButton_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this.setReadWriteType("write");

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

        const calcLedFullSize = () => {
            return Math.min(this.getAllStyle()["width"], this.getAllStyle()["height"]) * 0.5;
        }

        const ledFullSize = calcLedFullSize();


        // --------- styles --------------
        const allText = this.getAllText();
        const allStyle = this.getAllStyle();
        const showLED = allText["showLED"];

        const itemColor = this.calcItemColor();
        const buttonColor = showLED === true ? "rgba(0,0,0,0)" : itemColor;
        const ledColor = showLED === true ? itemColor : "rgba(0,0,0,0)";


        let threeDStyle = {};
        if (this.buttonPressed) {
            // force change when mouse down
            threeDStyle = this.get3dButtonStyle(this.buttonPressed);
            this.buttonPressed = false;
        } else {
            // use PV value
            const itemIndex = this.calcItemIndex([allText['offValue'], allText['onValue']]);
            if (itemIndex === 0) {
                threeDStyle = this.get3dButtonStyle(false);
            } else {
                threeDStyle = this.get3dButtonStyle(true);
            }
        }

        // location of LED inside the Boolean Button widget
        const alignItems = allText["verticalAlign"];
        const justifyContent = allText["horizontalAlign"];

        return (
            <div
                ref={elementRef}
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
                        position: "relative",
                        display: "inline-flex",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {showLED === true ? (
                        <div
                            style={{
                                width: ledFullSize,
                                height: ledFullSize,
                                display: "inline-flex",
                                borderRadius: ledFullSize / 2,
                                backgroundColor: ledColor,
                                border: "solid 1px rgba(30,30,30,1)",
                            }}
                        ></div>
                    ) : null}

                    <div>&nbsp;{this.calcItemText()}</div>
                </div>
            </div>
        );
    };

    // -------------------- helper functions ----------------

    /**
     * Similar to LED.calcItemText()
     * 
     * find the text that corresponds to the channel value
     * 
     * the text may be defined by user or from the channel
     */
    calcItemText = (): string => {

        const allText = this.getAllText();
        const useChannelItems = allText["useChannelItems"];
        const itemNames = [allText["offLabel"], allText["onLabel"]];
        const itemValues = [allText["offValue"], allText["onValue"]];

        if (g_widgets1.isEditing()) {
            if (useChannelItems) {
                return "";
            } else {
                return itemNames.join("|");
            }
        }

        const index = this.calcItemIndex(itemValues);
        if (typeof (index) === "number") {
            if (useChannelItems === true) {
                try {
                    // find enum choices
                    const channelName = this.getChannelNames()[0];
                    const channel = g_widgets1.getTcaChannel(channelName);
                    const strs = channel.getEnumChoices();
                    const numberOfStringsUsed = channel.getNumerOfStringsUsed();
                    if (typeof (numberOfStringsUsed) === "number" && index < numberOfStringsUsed && strs.length >= numberOfStringsUsed) {
                        return strs[index];
                    }
                } catch (e) {
                    Log.error(e);
                }
            } else {
                return itemNames[index];
            }
        }
        return allText["fallbackText"];
    };


    /**
     * Similar to LED.calcItemColor()
     * 
     * find the color that corresponds to the channel value
     */
    calcItemColor = (): string => {
        const allText = this.getAllText();
        const itemValues = [allText["offValue"], allText["onValue"]];
        const itemColors = [allText["offColor"], allText["onColor"]]
        const index = this.calcItemIndex(itemValues);

        if (index !== undefined) {
            const color = itemColors[index];
            if (GlobalMethods.isValidRgbaColor(color)) {
                return color;
            }
        }
        return this.getAllText()["fallbackColor"];
    };

    /**
     * when the mouse is down on the button, do something
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
        } else {
            this.buttonPressed = false;
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
                // if we want to use the itemLabels and itemValues from channel
                useChannelItems: false,
                // use picture instead of colors
                usePictures: false,
                showLED: true,
                // which bit to show, -1 means using the channel value
                bit: 0,
                alarmBorder: true,
                // toggle/push and reset/push no reset/push nothing and set/
                // Toggle/Push/Push (inverted)
                mode: "Toggle",
                // when the channel is not connected
                fallbackColor: "rgba(255,0,255,1)",
                fallbackText: "Wrong State",
                // becomes not visible in operation mode, but still clickable
                invisibleInOperation: false,
                // items, each category has 2 items
                onLabel: "On",
                offLabel: "Off",
                onValue: 1,
                offValue: 0,
                onColor: "rgba(60, 255, 60, 1)",
                offColor: "rgba(60, 100, 60, 1)",
                onPicture: "", // not implemented yet
                offPicture: "",
                // "contemporary" | "traditional"
                appearance: "traditional",
                confirmOnWrite: false,
                confirmOnWriteUsePassword: false,
                confirmOnWritePassword: "",
            },
            channelNames: [],
            groupNames: [],
            rules: [],
        };
        defaultTdl["widgetKey"] = GlobalMethods.generateWidgetKey(defaultTdl["type"]);
        return JSON.parse(JSON.stringify(defaultTdl));
    };

    generateDefaultTdl: () => any = BooleanButton.generateDefaultTdl;

    // -------------------------- sidebar ---------------------------
    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new BooleanButtonSidebar(this);
        }
    }
}
