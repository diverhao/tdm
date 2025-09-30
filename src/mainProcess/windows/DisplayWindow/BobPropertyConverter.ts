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
import { TankHelper } from "../../../rendererProcess/widgets/Tank/TankHelper";
import { SymbolHelper } from "../../../rendererProcess/widgets/Symbol/SymbolHelper";
import { TextSymbolHelper } from "../../../rendererProcess/widgets/TextSymbol/TextSymbolHelper";
import { ThermometerHelper } from "../../../rendererProcess/widgets/Thermometer/ThermometerHelper";
import { CheckBoxHelper } from "../../../rendererProcess/widgets/CheckBox/CheckBoxHelper";
import { ChoiceButtonHelper } from "../../../rendererProcess/widgets/ChoiceButton/ChoiceButtonHelper";
import { ComboBoxHelper } from "../../../rendererProcess/widgets/ComboBox/ComboBoxHelper";
import { RadioButtonHelper } from "../../../rendererProcess/widgets/RadioButton/RadioButtonHelper";
import { ScaledSliderHelper } from "../../../rendererProcess/widgets/ScaledSlider/ScaledSliderHelper";
import { SlideButtonHelper } from "../../../rendererProcess/widgets/SlideButton/SlideButtonHelper";
import { SpinnerHelper } from "../../../rendererProcess/widgets/Spinner/SpinnerHelper";

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
            console.log("bob widget tyep <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<", bobWidgetType)
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
            } else if (bobWidgetType === "meter") {
                const widgetTdl = MeterHelper.convertBobToTdl(bobWidgetJson);
                const widgetKey = widgetTdl["widgetKey"];
                tdl[widgetKey] = widgetTdl;
            } else if (bobWidgetType === "tank") {
                const widgetTdl = TankHelper.convertBobToTdl(bobWidgetJson, "tank");
                const widgetKey = widgetTdl["widgetKey"];
                tdl[widgetKey] = widgetTdl;
            } else if (bobWidgetType === "progressbar") {
                const widgetTdl = TankHelper.convertBobToTdl(bobWidgetJson, "progressbar");
                const widgetKey = widgetTdl["widgetKey"];
                tdl[widgetKey] = widgetTdl;
            } else if (bobWidgetType === "symbol") {
                const widgetTdl = SymbolHelper.convertBobToTdl(bobWidgetJson);
                const widgetKey = widgetTdl["widgetKey"];
                tdl[widgetKey] = widgetTdl;
            } else if (bobWidgetType === "text-symbol") {
                const widgetTdl = TextSymbolHelper.convertBobToTdl(bobWidgetJson);
                const widgetKey = widgetTdl["widgetKey"];
                tdl[widgetKey] = widgetTdl;
            } else if (bobWidgetType === "textupdate") {
                const widgetTdl = TextUpdateHelper.convertBobToTdl(bobWidgetJson);
                const widgetKey = widgetTdl["widgetKey"];
                tdl[widgetKey] = widgetTdl;
            } else if (bobWidgetType === "thermometer") {
                const widgetTdl = ThermometerHelper.convertBobToTdl(bobWidgetJson);
                const widgetKey = widgetTdl["widgetKey"];
                tdl[widgetKey] = widgetTdl;
            } else if (bobWidgetType === "action_button") {
                const widgetTdl = ActionButtonHelper.convertBobToTdl(bobWidgetJson);
                const widgetKey = widgetTdl["widgetKey"];
                tdl[widgetKey] = widgetTdl;
            } else if (bobWidgetType === "bool_button") {
                const widgetTdl = BooleanButtonHelper.convertBobToTdl(bobWidgetJson);
                const widgetKey = widgetTdl["widgetKey"];
                tdl[widgetKey] = widgetTdl;
            } else if (bobWidgetType === "checkbox") {
                const widgetTdl = CheckBoxHelper.convertBobToTdl(bobWidgetJson);
                const widgetKey = widgetTdl["widgetKey"];
                tdl[widgetKey] = widgetTdl;
            } else if (bobWidgetType === "choice") {
                const widgetTdl = ChoiceButtonHelper.convertBobToTdl(bobWidgetJson);
                const widgetKey = widgetTdl["widgetKey"];
                tdl[widgetKey] = widgetTdl;
            } else if (bobWidgetType === "combo") {
                const widgetTdl = ComboBoxHelper.convertBobToTdl(bobWidgetJson);
                const widgetKey = widgetTdl["widgetKey"];
                tdl[widgetKey] = widgetTdl;
            } else if (bobWidgetType === "radio") {
                const widgetTdl = RadioButtonHelper.convertBobToTdl(bobWidgetJson);
                const widgetKey = widgetTdl["widgetKey"];
                tdl[widgetKey] = widgetTdl;
            } else if (bobWidgetType === "scaledslider") {
                const widgetTdl = ScaledSliderHelper.convertBobToTdl(bobWidgetJson);
                const widgetKey = widgetTdl["widgetKey"];
                tdl[widgetKey] = widgetTdl;
            } else if (bobWidgetType === "slide_button") {
                const widgetTdl = SlideButtonHelper.convertBobToTdl(bobWidgetJson);
                const widgetKey = widgetTdl["widgetKey"];
                tdl[widgetKey] = widgetTdl;
            } else if (bobWidgetType === "spinner") {
                const widgetTdl = SpinnerHelper.convertBobToTdl(bobWidgetJson);
                const widgetKey = widgetTdl["widgetKey"];
                tdl[widgetKey] = widgetTdl;
            } else if (bobWidgetType === "textentry") {
                const widgetTdl = TextEntryHelper.convertBobToTdl(bobWidgetJson);
                const widgetKey = widgetTdl["widgetKey"];
                tdl[widgetKey] = widgetTdl;
            } else {
                Log.info("Skip converting widget", bobWidgetType);
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
     *     [
     *         "1"
     *     ]
     * to "push and reset"
     */
    static convertBobBoolenButtonMode = (propertyValue: any) => {
        const numVal = this.convertBobNum(propertyValue);
        if (numVal === 0) {
            return "toggle";
        } else if (numVal === 1) {
            return "push and reset";
        } else if (numVal === 2) {
            // TDM does not have this mode, it can be realized by setting onValue/offValue to 0/1
            return "push and reset (inverted)";
        } else {
            return "toggle";
        }
    }

    // ------------------------- actions ---------------------------
    /**
     * Convert
     * 
     * [
     *   {
     *      action: [
     *                 ... each action
     *              ]
     *   }
     * ]
     * 
     * to each-action[]
     * 
     */
    static convertBobActions = (propertyValue: any) => {
        const result: any[] = [];
        // array of actions
        const actionsData = propertyValue[0]["action"];
        for (const actionData of actionsData) {
            const type = actionData["$"]["type"];
            if (type === "open_display") {
                result.push(this.convertBobAction_open_display(actionData));
            } else if (type === "write_pv") {
                result.push(this.convertBobAction_write_pv(actionData));
            } else if (type === "command") {
                result.push(this.convertBobAction_command(actionData));
            } else if (type === "open_webpage") {
                result.push(this.convertBobAction_open_webpage(actionData));
            }
        }
        return result;
    }

    /**
     * Convert 
     * 
     * {
     *      "$": {
     *          "type": "open_display"
     *      },
     *      "description"?: [
     *          "Open Display 111"
     *      ],
     *      "file": [
     *          "abc.tdl"
     *      ],
     *      "macros"?: [
     *          {
     *              "a": [
     *                  "b"
     *              ],
     *              "c": [
     *                  "d"
     *              ]
     *          }
     *      ],
     *      "target": [
     *          "tab"
     *      ],
     *      "name"?: [
     *          "def"
     *      ]
     * }
     * 
     * to {    type: "OpenDisplay",
     *         label: "Open Display 111",
     *         fileName: "abc.tdl",
     *         externalMacros: [["a", "b"], ["c", "d"]];
     *         useParentMacros: true;
     *         openInSameWindow: false;
     *    }
     */
    static convertBobAction_open_display = (
        propertyValue: {
            "$": {
                "type": "open_display"
            },
            description?: string[],
            file: string[],
            macros?: Record<string, string[]>[],
            target: string[], // "tab", "replace", "window"
            name?: string[], // pane, I don't know what is it
        }
    ) => {
        let label = "";
        if (propertyValue["description"] !== undefined) {
            label = this.convertBobString(propertyValue["description"]);
        }
        let externalMacros: [string, string][] = [];
        if (propertyValue["macros"] !== undefined) {
            externalMacros = this.convertBobMacros(propertyValue["macros"]);
        }
        let openInSameWindow = false;
        if (propertyValue["target"] !== undefined) {
            const targetStr = this.convertBobString(propertyValue["target"]);
            if (targetStr === "replace") {
                openInSameWindow = true;
            }
        }

        const fileName = this.convertBobString(propertyValue["file"]);

        return {
            type: "OpenDisplay",
            label: label,
            fileName: fileName,
            externalMacros: externalMacros,
            useParentMacros: true,
            openInSameWindow: false,
        }
    }


    /**
     * From 
     * 
     *  {
     *       "$": {
     *           "type": "write_pv"
     *       },
     *       "description": [
     *           "Write PV 111"
     *       ],
     *       "pv_name": [
     *           "val1"
     *       ],
     *       "value": [
     *           "0"
     *       ]
     *   }
     * 
     * to {
     *       type: "WritePV",
     *       label: "Write PV 111",
     *       channelName: "val1",
     *       channelValue: "0",
     *       confirmOnWrite: false,
     *       confirmOnWriteUsePassword: false,
     *       confirmOnWritePassword: "",
     *   }
     * 
     * The password will be assigned later
     */
    static convertBobAction_write_pv = (
        propertyValue: {
            "$": {
                "type": "write_pv"
            },
            description?: string[],
            pv_name: string[],
            value: string[],
        }
    ) => {
        let label = "";
        if (propertyValue["description"] !== undefined) {
            label = this.convertBobString(propertyValue["description"]);
        }
        const channelName = this.convertBobString(propertyValue["pv_name"]);
        const channelValue = this.convertBobString(propertyValue["value"]);

        return {
            type: "WritePV",
            label: label,
            channelName: channelName,
            channelValue: channelValue,
            confirmOnWrite: false,
            confirmOnWriteUsePassword: false,
            confirmOnWritePassword: "",
        }
    }


    /**
     * From 
     *  {
     *      "$": {
     *          "type": "command"
     *      },
     *      "description": [
     *          "Execute Command 111"
     *      ],
     *      "command": [
     *          "abcd"
     *      ]
     *  }
     * to 
     *   {
     *       type: "ExecuteCommand",
     *       label: "Execute Command 111",
     *       command: "abcd",
     *       confirmOnWrite: false,
     *       confirmOnWriteUsePassword: false,
     *       confirmOnWritePassword: "",
     *    }
     */
    static convertBobAction_command = (
        propertyValue: {
            "$": {
                "type": "command"
            },
            description?: string[],
            command: string[],
        }
    ) => {
        let label = "";
        if (propertyValue["description"] !== undefined) {
            label = this.convertBobString(propertyValue["description"]);
        }
        const command = this.convertBobString(propertyValue["command"]);

        return {
            type: "ExecuteCommand",
            label: label,
            command: command,
            confirmOnWrite: false,
            confirmOnWriteUsePassword: false,
            confirmOnWritePassword: "",
        }
    }

    /**
     * From 
     * 
     *     {
     *         "$": {
     *             "type": "open_webpage"
     *         },
     *         "description": [
     *             "Open Web Page 111"
     *         ],
     *         "url": [
     *             "abc"
     *         ]
     *     }
     * to {
     *       type: "OpenWebPage",
     *       label: "Open Web Page 111",
     *       url: "abc",
     *    } 
     */
    static convertBobAction_open_webpage = (
        propertyValue: {
            "$": {
                "type": "open_webpage"
            },
            description?: string[],
            url: string[],
        }
    ) => {
        let label = "";
        if (propertyValue["description"] !== undefined) {
            label = this.convertBobString(propertyValue["description"]);
        }
        const url = this.convertBobString(propertyValue["url"]);

        return {
            type: "OpenWebPage",
            label: label,
            url: url,
        }
    }


    // -------------------- basic conversions ----------------------

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
        propertyValue: Record<string, string[]>[],
        label: string,
    ) => {
        try {
            const data = propertyValue[0][label];
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
     * 
     * We must also change the width, height, top and left of the widget
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

    /**
     * From
     *            [
     *                "55"
     *            ]
     * to "rotate(55deg)""
     */
    static convertBobAngleNum = (propertyValue: string[]) => {
        const numValue = this.convertBobNum(propertyValue);
        return `rotate(${numValue}deg)`
    }


    /**
     * from 
     *     [
     *         "1"
     *     ]
     * to "decimal"
     */
    static convertBobDigitFormat = (propertyValue: string[]) => {
        const numValue = this.convertBobNum(propertyValue);
        if (numValue === 0) {
            return "default";
        } else if (numValue === 1) {
            return "decimal";
        } else if (numValue === 2) {
            return "exponential";
        } else if (numValue === 4) {
            return "hexadecimal";
        } else if (numValue === 6) {
            return "string";
        } else {
            return "default";
        }
    }

    // ------------------------------------------------------


}
