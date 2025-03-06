import { v4 as uuidv4 } from "uuid";
import { type_action_opendisplay_tdl } from "../../../rendererProcess/widgets/ActionButton/ActionButton";
import { type_action_writepv_tdl } from "../../../rendererProcess/widgets/ActionButton/ActionButton";
import { type_action_executescript_tdl } from "../../../rendererProcess/widgets/ActionButton/ActionButton";
import { type_action_executecommand_tdl } from "../../../rendererProcess/widgets/ActionButton/ActionButton";
import { type_action_openwebpage_tdl } from "../../../rendererProcess/widgets/ActionButton/ActionButton";
import { type_actions_tdl } from "../../../rendererProcess/widgets/ActionButton/ActionButton";

import { CanvasHelper } from "../../../rendererProcess/helperWidgets/Canvas/CanvasHelper";
import { ActionButtonHelper } from "../../../rendererProcess/widgets/ActionButton/ActionButtonHelper";
import { ArcHelper } from "../../../rendererProcess/widgets/Arc/ArcHelper";
import { BooleanButtonHelper } from "../../../rendererProcess/widgets/BooleanButton/BooleanButtonHelper";
import { ByteMonitorHelper } from "../../../rendererProcess/widgets/ByteMonitor/ByteMonitorHelper";
// import { CheckBoxHelper } from "../../../rendererProcess/widgets/CheckBox/CheckBoxHelper";
// import { ChoiceButtonHelper } from "../../../rendererProcess/widgets/ChoiceButton/ChoiceButtonHelper";
// import { ComboBoxHelper } from "../../../rendererProcess/widgets/ComboBox/ComboBoxHelper";
// import { DataViewerHelper } from "../../../rendererProcess/widgets/DataViewer/DataViewerHelper";
// import { EmbeddedDisplayHelper } from "../../../rendererProcess/widgets/EmbeddedDisplay/EmbeddedDisplayHelper";
// import { GroupHelper } from "../../../rendererProcess/widgets/Group/GroupHelper";
import { LEDHelper } from "../../../rendererProcess/widgets/LED/LEDHelper";
import { LEDMultiStateHelper } from "../../../rendererProcess/widgets/LEDMultiState/LEDMultiStateHelper";
import { LabelHelper } from "../../../rendererProcess/widgets/Label/LabelHelper";
import { MeterHelper } from "../../../rendererProcess/widgets/Meter/MeterHelper";
import { MediaHelper } from "../../../rendererProcess/widgets/Media/MediaHelper";
import { PolylineHelper } from "../../../rendererProcess/widgets/Polyline/PolylineHelper";
// import { ProbeHelper } from "../../../rendererProcess/widgets/Probe/ProbeHelper";
// import { ProfilesViewerHelper } from "../../../rendererProcess/widgets/ProfilesViewer/ProfilesViewerHelper";
// import { ProgressBarHelper } from "../../../rendererProcess/widgets/Progressbar/ProgressBarHelper";
// import { PvTableHelper } from "../../../rendererProcess/widgets/PvTable/PvTableHelper";
// import { RadioButtonHelper } from "../../../rendererProcess/widgets/RadioButton/RadioButtonHelper";
import { RectangleHelper } from "../../../rendererProcess/widgets/Rectangle/RectangleHelper";
// import { ScaledSliderHelper } from "../../../rendererProcess/widgets/ScaledSlider/ScaledSliderHelper";
// import { SlideButtonHelper } from "../../../rendererProcess/widgets/SlideButton/SlideButtonHelper";
// import { SpinnerHelper } from "../../../rendererProcess/widgets/Spinner/SpinnerHelper";
// import { SymbolHelper } from "../../../rendererProcess/widgets/Symbol/SymbolHelper";
// import { TankHelper } from "../../../rendererProcess/widgets/Tank/TankHelper";
// import { TdlViewerHelper } from "../../../rendererProcess/widgets/TdlViewer/TdlViewerHelper";
import { TextEntryHelper } from "../../../rendererProcess/widgets/TextEntry/TextEntryHelper";
// import { TextSymbolHelper } from "../../../rendererProcess/widgets/TextSymbol/TextSymbolHelper";
import { TextUpdateHelper } from "../../../rendererProcess/widgets/TextUpdate/TextUpdateHelper";
// import { ThermometerHelper } from "../../../rendererProcess/widgets/Thermometer/ThermometerHelper";
// import { ThumbWheelHelper } from "../../../rendererProcess/widgets/ThumbWheel/ThumbWheelHelper";
import { Log } from "../../log/Log";

export class BobPropertyConverter {
    constructor() { }

    static hasWidget = (bob: Record<string, any>): boolean => {
        return Object.keys(bob).includes("widget");
    };

    static parseBob = (bob: Record<string, any>, result: Record<string, any>) => {
        let tdl: Record<string, any> = {};

        // top level
        if (!Object.keys(bob).includes("type")) {
            tdl = CanvasHelper.convertBobToTdl(bob);
            result[tdl["widgetKey"]] = tdl;
        } else {
            const type = bob["type"];

            switch (type) {
                case "rectangle":
                    tdl = RectangleHelper.convertBobToTdl(bob);
                    result[tdl["widgetKey"]] = tdl;
                    break;
                case "label":
                    tdl = LabelHelper.convertBobToTdl(bob);
                    result[tdl["widgetKey"]] = tdl;
                    break;
                case "action_button":
                    tdl = ActionButtonHelper.convertBobToTdl(bob);
                    result[tdl["widgetKey"]] = tdl;
                    break;
                case "textupdate":
                    tdl = TextUpdateHelper.convertBobToTdl(bob);
                    result[tdl["widgetKey"]] = tdl;
                    break;
                case "byte_monitor":
                    tdl = ByteMonitorHelper.convertBobToTdl(bob);
                    result[tdl["widgetKey"]] = tdl;
                    break;
                case "polyline":
                    tdl = PolylineHelper.convertBobToTdl(bob, "polyline");
                    result[tdl["widgetKey"]] = tdl;
                    break;
                case "polygon":
                    tdl = PolylineHelper.convertBobToTdl(bob, "polygon");
                    result[tdl["widgetKey"]] = tdl;
                    break;
                case "textentry":
                    tdl = TextEntryHelper.convertBobToTdl(bob);
                    result[tdl["widgetKey"]] = tdl;
                    break;
                case "bool_button":
                    tdl = BooleanButtonHelper.convertBobToTdl(bob);
                    result[tdl["widgetKey"]] = tdl;
                    break;
                case "arc":
                    tdl = ArcHelper.convertBobToTdl(bob, "arc");
                    result[tdl["widgetKey"]] = tdl;
                    break;
                case "ellipse":
                    tdl = ArcHelper.convertBobToTdl(bob, "ellipse");
                    result[tdl["widgetKey"]] = tdl;
                    break;
                case "picture":
                    tdl = MediaHelper.convertBobToTdl(bob);
                    result[tdl["widgetKey"]] = tdl;
                    break;
                case "led":
                    tdl = LEDHelper.convertBobToTdl(bob);
                    result[tdl["widgetKey"]] = tdl;
                    break;
                case "multi_state_led":
                    tdl = LEDMultiStateHelper.convertBobToTdl(bob);
                    result[tdl["widgetKey"]] = tdl;
                    break;
                case "meter":
                    tdl = MeterHelper.convertBobToTdl(bob);
                    result[tdl["widgetKey"]] = tdl;
                    break;
                case "group":
                    break;
                default:
                    Log.error("-1", "I don't recognize type", type);
                    return;
            }
        }

        // "group" or "display"
        if (this.hasWidget(bob)) {
            let startingPoint = Object.keys(result).length;
            let groupLeft = 0;
            let groupTop = 0;
            let groupId = "";

            if (bob["type"] === "group") {
                Log.info("-1", `------------------- parsing "group" ----------------`);
                startingPoint = Object.keys(result).length;
                if (bob["x"] !== undefined) {
                    groupLeft = parseInt(bob["x"]);
                }
                if (bob["y"] !== undefined) {
                    groupTop = parseInt(bob["y"]);
                }
                groupId = `Group_${uuidv4()}`;
            }

            const widget = bob["widget"];
            if (Array.isArray(widget)) {
                for (let widgetMember of widget) {
                    Log.info("-1", "parsing widget array");
                    this.parseBob(widgetMember, result);
                }
            } else {
                this.parseBob(widget, result);
            }

            if (bob["type"] === "group") {
                for (let index = startingPoint; index < Object.keys(result).length; index++) {
                    const newWidget = Object.values(result)[index];
                    newWidget["style"]["left"] = newWidget["style"]["left"] + groupLeft;
                    newWidget["style"]["top"] = newWidget["style"]["top"] + groupTop;
                    newWidget["groupNames"].push(groupId);
                }
            }
        }
    };
    /**
     * Assume transparent is "false" by default. If the default transparent is "true", like in Label,
     * we must determine the input argument for transparent before calling this function.
     */
    static convertBobColor = (
        propertyValue: {
            color: {
                red: string;
                green: string;
                blue: string;
                alpha?: string;
            } & Record<string, any>;
        },
        transparent: "true" | "false" | undefined
    ) => {
        const red = propertyValue["color"]["red"];
        const green = propertyValue["color"]["green"];
        const blue = propertyValue["color"]["blue"];
        let alpha = `1`;
        const alphaBob = propertyValue["color"]["alpha"];
        if (alphaBob !== undefined) {
            alpha = `${parseInt(alphaBob) / 255}`;
        }
        if (transparent === "true") {
            alpha = `0`;
        } else if (transparent === "false") {
            alpha = "1";
        } else {
            // do nothing
        }
        const rgbaColor = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
        return rgbaColor;
    };

    static convertBobFont = (propertyValue: {
        font: {
            family: string;
            style: "REGULAR" | "BOLD" | "BOLD_ITALIC" | "ITALIC";
            size: string;
        } & Record<string, any>;
    }) => {
        const fontSize = parseInt(propertyValue["font"]["size"]);
        const fontFamily = propertyValue["font"]["family"];
        let fontWeight = "normal";
        let fontStyle = "normal";
        const fontStyleBob = propertyValue["font"]["style"];
        if (fontStyleBob === "REGULAR") {
            fontWeight = "normal";
            fontStyle = "normal";
        } else if (fontStyleBob === "BOLD") {
            fontWeight = "bold";
            fontStyle = "normal";
        } else if (fontStyleBob === "BOLD_ITALIC") {
            fontWeight = "bold";
            fontStyle = "italic";
        } else if (fontStyleBob === "ITALIC") {
            fontWeight = "normal";
            fontStyle = "italic";
        }

        return {
            fontSize: fontSize,
            fontWeight: fontWeight,
            fontStyle: fontStyle,
            fontFamily: fontFamily,
        };
    };

    static convertBobRotationStep = (propertyValue: string, left: number, top: number, width: number, height: number) => {
        const rotation_steps = ["rotate(0deg)", "rotate(270deg)", "rotate(180deg)", "rotate(90deg)"];
        const transform = rotation_steps[parseInt(propertyValue)];
        let newLeft = left;
        let newTop = top;
        let newWidth = width;
        let newHeight = height;
        if (parseInt(propertyValue) === 1) {
            newLeft = newLeft + width / 2 - height / 2;
            newTop = newTop + height / 2 - width / 2;
            newWidth = height;
            newHeight = width;
        } else if (parseInt(propertyValue) === 3) {
            newLeft = newLeft + width / 2 - height / 2;
            newTop = newTop + height / 2 - width / 2;
            newWidth = height;
            newHeight = width;
        }
        return {
            newLeft: newLeft,
            newTop: newTop,
            newWidth: newWidth,
            newHeight: newHeight,
            transform: transform,
        };
    };

    static convertBobWrapWords = (propertyValue: "true" | "false") => {
        if (propertyValue === "true") {
            return true;
        } else if (propertyValue === "false") {
            return false;
        } else {
            return true;
        }
    };

    static convertBobMacros = (propertyValue: Record<string, string>) => {
        const result: [string, string][] = [];
        for (let macroName of Object.keys(propertyValue)) {
            const macroValue = propertyValue[macroName];
            result.push([macroName, macroValue]);
        }
        return result;
    };

    /**
     *
     */
    static convertBobLEDStates = (propertyValue: Record<string, any>) => {
        const states = propertyValue["state"];
        const values: number[] = [];
        const labels: string[] = [];
        const colors: string[] = [];
        if (!Array.isArray(states)) {
            const value = parseFloat(states["value"]);
            let label = states["label"];
            if (typeof label !== "string") {
                label = "";
            }
            const color = this.convertBobColor(states["color"], undefined);
            values.push(value);
            labels.push(label);
            colors.push(color);
        } else {
            for (let state of states) {
                const value = parseFloat(state["value"]);
                let label = state["label"];
                if (typeof label !== "string") {
                    label = "";
                }
                const color = this.convertBobColor(state["color"], undefined);
                values.push(value);
                labels.push(label);
                colors.push(color);
            }
        }

        return {
            itemNames: labels,
            itemColors: colors,
            itemValues: values,
        };
    };

    /**
     * When input is undefined, return false
     */
    static convertBobBoolean = (propertyValue: "true" | "false" | undefined) => {
        if (propertyValue === "true") {
            return true;
        } else if (propertyValue === "false") {
            return false;
        } else {
            return false;
        }
    };

    static convertBobAction = (
        propertyValue: Record<string, any>,
        defaultChannelName: string
    ):
        | type_action_opendisplay_tdl
        | type_action_writepv_tdl
        | type_action_executecommand_tdl
        | type_action_executescript_tdl
        | type_action_openwebpage_tdl
        | undefined => {
        let result: Record<string, any> = {};
        const type = propertyValue["type"];

        let file = propertyValue["file"];
        if (typeof file !== "string") {
            file = "";
        }

        const target = propertyValue["target"];
        let description = propertyValue["description"];
        if (typeof description !== "string") {
            description = "";
        }

        let pv_name = propertyValue["pv_name"];
        if (pv_name === "$(pv_name)") {
            pv_name = defaultChannelName;
        }

        let value = propertyValue["value"];
        if (typeof value !== "string") {
            value = "";
        }

        const text = propertyValue["text"];
        let command = propertyValue["command"];
        if (typeof command !== "string") {
            command = "";
        }
        let url = propertyValue["url"];
        if (typeof url !== "string") {
            url = "";
        }
        let macros = propertyValue["macros"];
        if (macros === undefined) {
            macros = [];
        }

        if (type === "open_display") {
            return {
                type: "OpenDisplay",
                label: description,
                fileName: file,
                externalMacros: this.convertBobMacros(macros),
                useParentMacros: true,
                openInSameWindow: false,
            };
        } else if (type === "write_pv") {
            return {
                type: "WritePV",
                label: description,
                channelName: pv_name,
                channelValue: value,
                confirmOnWrite: false,
                confirmOnWriteUsePassword: false,
                confirmOnWritePassword: "",

            };
        } else if (type === "execute") {
            // todo
            return {
                type: "ExecuteScript",
                label: description,
                fileName: "",
            };
        } else if (type === "command") {
            return {
                type: "ExecuteCommand",
                label: description,
                command: command,
                confirmOnWrite: false,
                confirmOnWriteUsePassword: false,
                confirmOnWritePassword: "",
            };
        } else if (type === "open_webpage") {
            return {
                type: "OpenWebPage",
                label: description,
                url: url,
            };
        } else {
            return undefined;
        }
    };

    static convertBobActions = (propertyValue: Record<string, any> | Record<string, any>[], defaultChannelName: string) => {
        let result: type_actions_tdl = [];
        if (!Array.isArray(propertyValue)) {
            const member = this.convertBobAction(propertyValue, defaultChannelName);
            if (member !== undefined) {
                result.push(member);
            }
        } else {
            for (let memberBob of propertyValue) {
                const member = this.convertBobAction(memberBob, defaultChannelName);
                if (member !== undefined) {
                    result.push(member);
                }
            }
        }
        return result;
    };

    static convertBobHorizontalAlign = (propertyValue: string) => {
        const horizontalAligns = ["flex-start", "center", "flex-end"];
        return horizontalAligns[parseInt(propertyValue)];
    };

    static convertBobVerticalAlign = (propertyValue: string) => {
        const verticalAligns = ["flex-start", "center", "flex-end"];
        return verticalAligns[parseInt(propertyValue)];
    };

    static convertBobArrows = (propertyValue: string) => {
        // [boolean, boolean] = [showArrowHead, showArrowTail]
        // head is the end of the line, tail is the beginning of the line
        const arrows = [
            [false, false],
            [false, true],
            [true, false],
            [true, true],
        ];
        return arrows[parseInt(propertyValue)];
    };

    static convertBobLineStyle = (propertyValue: string) => {
        const styles = ["solid", "dotted", "dashed", "dash-dot", "dash-dot-dot"];
        return styles[parseInt(propertyValue)];
    };

    static convertBobPolylinePoints = (propertyValue: Record<string, any>): [number[], number[]] => {
        const points = propertyValue["point"];
        const pointsX: number[] = [];
        const pointsY: number[] = [];
        if (!Array.isArray(points)) {
            pointsX.push(parseInt(points["x"]));
            pointsY.push(parseInt(points["y"]));
        } else {
            for (let point of points) {
                pointsX.push(parseInt(point["x"]));
                pointsY.push(parseInt(point["y"]));
            }
        }
        return [pointsX, pointsY];
    };
}
