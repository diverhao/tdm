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

    static parseBob = (bobJson: Record<string, any>, tdl: Record<string, any>) => {
        // let tdl: Record<string, any> = {};

        // go through all fields, parse Canvas
        // the '$' and 'widget' are ignored, all others are going to be part of Canvas
        const widgetTdl = CanvasHelper.convertBobToTdl(bobJson);
        const widgetKey = widgetTdl["widgetKey"];
        tdl[widgetKey] = widgetTdl;

        // parse all other widgets other than Canvas
        // Record<string, any>[], each record is a JSON representing a Bob widget
        const bobWidgetsJson = bobJson["widget"];
        for (const bobWidgetJson of bobWidgetsJson) {
            const bobWidgetType = bobWidgetJson["$"]["type"];
            if (bobWidgetType === "arc") {
                const widgetTdl = ArcHelper.convertBobToTdl(bobWidgetJson, "arc");
                const widgetKey = widgetTdl["widgetKey"];
                tdl[widgetKey] = widgetTdl;
            } else if (bobWidgetType === "ellipse") {
                const widgetTdl = ArcHelper.convertBobToTdl(bobWidgetJson, "ellipse");
                const widgetKey = widgetTdl["widgetKey"];
                tdl[widgetKey] = widgetTdl;
            } else if (bobWidgetType === "label") {
                const widgetTdl = LabelHelper.convertBobToTdl(bobWidgetJson);
                const widgetKey = widgetTdl["widgetKey"];
                tdl[widgetKey] = widgetTdl;
            } else if (bobWidgetType === "picture") {
                const widgetTdl = MediaHelper.convertBobToTdl(bobWidgetJson);
                const widgetKey = widgetTdl["widgetKey"];
                tdl[widgetKey] = widgetTdl;
            } else if (bobWidgetType === "polygon") {
                const widgetTdl = PolylineHelper.convertBobToTdl(bobWidgetJson, "polygon");
                const widgetKey = widgetTdl["widgetKey"];
                tdl[widgetKey] = widgetTdl;
            } else if (bobWidgetType === "polyline") {
                const widgetTdl = PolylineHelper.convertBobToTdl(bobWidgetJson, "polyline");
                const widgetKey = widgetTdl["widgetKey"];
                tdl[widgetKey] = widgetTdl;
            } else if (bobWidgetType === "rectangle") {
                const widgetTdl = RectangleHelper.convertBobToTdl(bobWidgetJson);
                const widgetKey = widgetTdl["widgetKey"];
                tdl[widgetKey] = widgetTdl;
            } else if (bobWidgetType === "byte_monitor") {
                const widgetTdl = ByteMonitorHelper.convertBobToTdl(bobWidgetJson);
                const widgetKey = widgetTdl["widgetKey"];
                tdl[widgetKey] = widgetTdl;
            } else if (bobWidgetType === "led") {
                const widgetTdl = LEDHelper.convertBobToTdl(bobWidgetJson);
                const widgetKey = widgetTdl["widgetKey"];
                tdl[widgetKey] = widgetTdl;
            } else if (bobWidgetType === "multi_state_led") {
                const widgetTdl = LEDMultiStateHelper.convertBobToTdl(bobWidgetJson);
                const widgetKey = widgetTdl["widgetKey"];
                tdl[widgetKey] = widgetTdl;
            } else {
                return;
            }
        }

        // "group" or "display"
        // if (this.hasWidget(bobJson)) {
        //     let startingPoint = Object.keys(result).length;
        //     let groupLeft = 0;
        //     let groupTop = 0;
        //     let groupId = "";

        //     if (bobJson["type"] === "group") {
        //         Log.info("-1", `------------------- parsing "group" ----------------`);
        //         startingPoint = Object.keys(result).length;
        //         if (bobJson["x"] !== undefined) {
        //             groupLeft = parseInt(bobJson["x"]);
        //         }
        //         if (bobJson["y"] !== undefined) {
        //             groupTop = parseInt(bobJson["y"]);
        //         }
        //         groupId = `Group_${uuidv4()}`;
        //     }

        //     const widget = bobJson["widget"];
        //     if (Array.isArray(widget)) {
        //         for (let widgetMember of widget) {
        //             Log.info("-1", "parsing widget array");
        //             this.parseBob(widgetMember, result);
        //         }
        //     } else {
        //         this.parseBob(widget, result);
        //     }

        //     if (bobJson["type"] === "group") {
        //         for (let index = startingPoint; index < Object.keys(result).length; index++) {
        //             const newWidget = Object.values(result)[index];
        //             newWidget["style"]["left"] = newWidget["style"]["left"] + groupLeft;
        //             newWidget["style"]["top"] = newWidget["style"]["top"] + groupTop;
        //             newWidget["groupNames"].push(groupId);
        //         }
        //     }
        // }
    };


    /**
     * From
     * 
     * [
     *      {
     *          "color": [
     *              {
     *                  "$": {
     *                      "name": "DISCONNECTED",
     *                      "red": "200",
     *                      "green": "0",
     *                      "blue": "200",
     *                      "alpha": "200"
     *                  }
     *              }
     *          ]
     *      }
     *  ]
     * 
     * to "rgba(200, 0, 200, 0.8)"
     */
    static convertBobColor = (
        propertyValue: {
            color: {
                "$": {
                    name?: string;
                    red: string,
                    green: string,
                    blue: string,
                    alpha?: string,
                } & Record<string, any>
            }[]
        }[]
    ) => {
        try {
            const data = propertyValue[0]["color"][0]["$"];
            const redStr = data["red"];
            const greenStr = data["green"];
            const blueStr = data["blue"];
            const alphaStr = data["alpha"];
            const red = parseInt(redStr);
            const green = parseInt(greenStr);
            const blue = parseInt(blueStr);
            let alpha = 1;
            if (alphaStr !== undefined) {
                alpha = parseInt(alphaStr) / 255;
            }
            return "rgba(" + red.toString() + ", " + green.toString() + ", " + blue.toString() + ", " + alpha.toString() + ")";

        } catch (e) {
            Log.error(e);
            return "rgba(0,0,0,0)";
        }
    };
    /**
     * Convert 
     * 
     *            [
     *                {
     *                    "state": [
     *                        {
     *                            "value": [
     *                                "0"
     *                            ],
     *                            "label": [
     *                                "State 1"
     *                            ],
     *                            "color": [
     *                                {
     *                                    "color": [
     *                                        {
     *                                            "$": {
     *                                                "name": "Off",
     *                                                "red": "60",
     *                                                "green": "100",
     *                                                "blue": "60"
     *                                            }
     *                                        }
     *                                    ]
     *                                }
     *                            ]
     *                        },
     *                        {
     *                            "value": [
     *                                "1"
     *                            ],
     *                            "label": [
     *                                "State 2"
     *                            ],
     *                            "color": [
     *                                {
     *                                    "color": [
     *                                        {
     *                                            "$": {
     *                                                "name": "On",
     *                                                "red": "0",
     *                                                "green": "255",
     *                                                "blue": "0"
     *                                            }
     *                                        }
     *                                    ]
     *                                }
     *                            ]
     *                        }
     *                    ]
     *                }
     *            ]
     * to {itemNames: ["State 1", "State 2"], itemValues: [0, 1], itemColors: ["rgba(60, 100, 60)", "rgba(0, 255, 0)"]}
     */
    static convertBobStates = (
        propertyValue: { state: { value: string[], label: string[], color: { color: { "$": { name?: string, red: string, green: string, blue: string, alpha?: string } }[] }[] }[] }[]
    ) => {
        const result: { itemNames: string[], itemValues: number[], itemColors: string[] } = {
            itemNames: [],
            itemValues: [],
            itemColors: [],
        };
        const statesData = propertyValue[0]["state"];
        for (const stateData of statesData) {
            const itemName = stateData["label"][0];
            result["itemNames"].push(itemName);
            const itemValue = parseFloat(stateData["value"][0]);
            result["itemValues"].push(itemValue);
            const itemColor = this.convertBobColor(stateData["color"]);
            result["itemColors"].push(itemColor);
        }

        return result;
    }


    /**
      * from 
      * 
      *     [
      *         "MPS Ops"
      *     ]
      * 
      * to "MPS Ops"
      */
    static convertBobString = (
        propertyValue: string[]
    ) => {
        if (propertyValue.length > 0) {
            return propertyValue[0];
        } else {
            return "";
        }
    };

    /**
     * From 
     * 
     *          [
     *              {
     *                  "text": [
     *                      "Label 0",
     *                      "Label 1"
     *                  ]
     *              }
     *          ]
     * to ["Label 0", "Label 1"]
     */
    static convertBobStrings = (
        propertyValue: { text: string[] }[]
    ) => {
        try {
            const data = propertyValue[0]["text"];
            return data;
        } catch (e) {
            Log.error(e);
            return [];
        }
    }

    /**
     * from 
     *     [
     *         "30"
     *     ]
     * to 30
     */
    static convertBobNum = (
        propertyValue: string[]
    ) => {
        try {
            if (propertyValue.length > 0) {
                return parseFloat(propertyValue[0]);
            } else {
                return 0;
            }
        } catch (e) {
            Log.error(e);
            return 0;
        }
    };
    /**
     * Convert 
     * 
     * [
     *     {
     *         "point": [
     *             {
     *                 "$": {
     *                     "x": "105.0",
     *                     "y": "0.0"
     *                 }
     *             },
     *             {
     *                 "$": {
     *                     "x": "270.0",
     *                     "y": "30.0"
     *                 }
     *             },
     *             {
     *                 "$": {
     *                     "x": "195.0",
     *                     "y": "195.0"
     *                 }
     *             }
     *         ]
     *     }
     * ]
     * 
     * to {pointsX: [105.0, 270.0, 195.0], pointsY: [0.0, 30.0, 195.0]}
     */
    static convertBobPoints = (propertyValue:
        { point: { "$": { x: string, y: string } }[] }[]
    ) => {
        try {
            const result: { pointsX: number[], pointsY: number[] } = { pointsX: [], pointsY: [] };
            const data = propertyValue[0]["point"];
            for (const point of data) {
                const x = parseInt(point["$"]["x"]);
                const y = parseInt(point["$"]["y"]);
                result['pointsX'].push(x);
                result['pointsY'].push(y);
            }
            return result;
        } catch (e) {
            return {
                pointsX: [],
                pointsY: [],
            }
        }
    }

    /**
     * From 
     * 
     *  [
     *      "false"
     *  ]
     * 
     * to false
     */
    static convertBobBoolean = (propertyValue:
        ("true" | "false")[]
    ) => {
        const booleanStr = propertyValue[0];
        if (booleanStr === "true") {
            return true;
        } else if (booleanStr === "false") {
            return false;
        } else {
            return false;
        }
    }

    /**
     * From 
     * [ "0" ]
     * to {showArrowHead: false, showArrowTail: false}
     */
    static convertBobArrows = (propertyValue: string[]) => {
        const numValue = this.convertBobNum(propertyValue);
        if (numValue === 0) {
            return {
                "showArrowHead": false,
                "showArrowTail": false,
            }
        } else if (numValue === 1) {
            return {
                "showArrowHead": false,
                "showArrowTail": true,
            }

        } else if (numValue === 2) {
            return {
                "showArrowHead": true,
                "showArrowTail": false,
            }

        } else if (numValue === 3) {
            return {
                "showArrowHead": true,
                "showArrowTail": true,
            }
        } else {
            return {
                "showArrowHead": false,
                "showArrowTail": false,
            }
        }
    }

    /**
     * Todo:
     * 
     *    [
     *        {
     *            "rule": [
     *                {
     *                    "$": {
     *                        "name": "abc",
     *                        "prop_id": "width",
     *                        "out_exp": "false"
     *                    },
     *                    "exp": [
     *                        {
     *                            "$": {
     *                                "bool_exp": "$(pv_name)"
     *                            },
     *                            "value": [
     *                                "1500"
     *                            ]
     *                        }
     *                    ],
     *                    "pv_name": [
     *                        "val1"
     *                    ]
     *                }
     *            ]
     *        }
     *    ]
     */
    static convertBobRules = (
        propertyValue: { rule: Record<string, any>[] }[]
    ) => {
        return [];
    }

    /**
     * From
     * 
     *    [
     *        {
     *            "P": [
     *                "ICS_MPS"
     *            ],
     *            "S": [
     *                "ICS_MPS:TrgCtl"
     *            ]
     *        }
     *    ]
     * 
     * to [["P", "ICS_MPS"], ["S", "ICS_MPS:TrgCtl"]]
     */
    static convertBobMacros = (
        propertyValue: Record<string, string[]>[]
    ) => {
        const result: [string, string][] = [];
        const data = propertyValue[0];
        if (data !== undefined) {
            for (const [key, val] of Object.entries(data)) {
                const val0 = val[0];
                if (typeof val0 === "string") {
                    result.push([key, val0]);
                }

            }
        }
        return result;
    };

    static convertBobLineStyle = (
        propertyValue: string[]
    ) => {
        const lineStyleNum = this.convertBobNum(propertyValue);
        if (lineStyleNum === 0) {
            // solid
            return "solid";
        } else if (lineStyleNum === 1) {
            // dash
            return "dashed"
        } else if (lineStyleNum === 2) {
            // dot
            return "dotted"
        } else if (lineStyleNum === 3) {
            // dash-dot
            return "dash-dot";
        } else if (lineStyleNum === 4) {
            // dash-dot-dot
            return "dash-dot-dot";
        } else {
            // solid
            return "solid";
        }
    }

    /**
     * From
     * 
     *           [
     *               {
     *                   "font": [
     *                       {
     *                           "$": {
     *                               "family": "Libian SC",
     *                               "style": "REGULAR",
     *                               "size": "14.0"
     *                           }
     *                       }
     *                   ]
     *               }
     *           ]
     * 
     * to {fontFamily: "Libian SC", fontStyle: "normal", fontWeight: "normal", fontSize: 14}
     */
    static convertBobFont = (propertyValue:
        { font: { "$": { family: string, style: "REGULAR" | "BOLD" | "BOLD_ITALIC" | "ITALIC", size: string } }[] }[]
    ) => {
        try {
            const data = propertyValue[0]["font"][0]["$"];
            const fontFamily = data["family"];
            const fontStyleRaw = data["style"];
            const fontSize = parseInt(data["size"]);
            let fontStyle = "normal";
            let fontWeight = "normal";
            if (fontStyleRaw === "REGULAR") {
            } else if (fontStyleRaw === "BOLD") {
                fontWeight = "bold";
            } else if (fontStyleRaw === "BOLD_ITALIC") {
                fontStyle = "italic";
                fontWeight = "bold";
            } else if (fontStyleRaw === "ITALIC") {
                fontStyle = "italic";
            }
            return {
                fontFamily: fontFamily,
                fontWeight: fontWeight,
                fontStyle: fontStyle,
                fontSize: fontSize,
            }
        } catch (e) {
            return {
                fontFamily: "TDM Default",
                fontSize: 14,
                fontWeight: "normal",
                fontStyle: "normal",
            }
        }
    }
    /**
     * From
     *            [
     *                "1"
     *            ]
     * to "flex-start"
     */
    static convertBobAlignment = (propertyValue: string[]) => {
        const numValue = this.convertBobNum(propertyValue);
        if (numValue === 0) {
            return "flex-start";
        } else if (numValue === 1) {
            return "center";
        } else if (numValue === 2) {
            return "flex-end";
        } else {
            return "flex-start";
        }
    }

    /**
     * From
     *            [
     *                "1"
     *            ]
     * to "rotate(90deg)""
     */
    static convertBobAngle = (propertyValue: string[]) => {
        const numValue = this.convertBobNum(propertyValue);
        if (numValue === 0) {
            return "rotate(0deg)";
        } else if (numValue === 1) {
            return "rotate(270deg)";
        } else if (numValue === 2) {
            return "rotate(180deg)";
        } else if (numValue === 3) {
            return "rotate(90deg)";
        } else {
            return "rotage(0deg)";
        }
    }

    // ------------------------------------------------------

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
}
