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
import { DataViewerHelper } from "../../../rendererProcess/widgets/DataViewer/DataViewerHelper";
import { ImageHelper } from "../../../rendererProcess/widgets/Image/ImageHelper";
import { XYPlotHelper } from "../../../rendererProcess/widgets/XYPlot/XYPlotHelper";
import { EmbeddedDisplayHelper } from "../../../rendererProcess/widgets/EmbeddedDisplay/EmbeddedDisplayHelper";
import { GroupHelper } from "../../../rendererProcess/widgets/Group/GroupHelper";
import { TableHelper } from "../../../rendererProcess/widgets/Table/TableHelper";
import { UtilityWindow } from "../UtilityWindow/UtilityWindow";

export class BobPropertyConverter {
    constructor() { }

    static hasWidget = (bob: Record<string, any>): boolean => {
        return Object.keys(bob).includes("widget");
    };

    static parsePlt = async (bobJson: Record<string, any>, tdl: Record<string, any>) => {
        console.log("...", bobJson);
        const canvasWidgetTdl = UtilityWindow.creatUtilityBlankTdl("DataViewer")["Canvas"];
        tdl["Canvas"] = canvasWidgetTdl;

        const databrowserData = bobJson["databrowser"];
        const widgetTdl = DataViewerHelper.convertBobToTdl_databrowser(databrowserData);
        const widgetKey = widgetTdl["widgetKey"];

        widgetTdl.text.singleWidget = true; // make it 100% width and height
        widgetTdl.style.boxSizing = "border-box";
        widgetTdl.style.padding = 5;

        tdl[widgetKey] = widgetTdl;
    }

    static parseBob = async (bobJson: Record<string, any>, tdl: Record<string, any>, fullTdlFileName: string, convertBobSuffix: boolean = false) => {
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
                const widgetTdl = ActionButtonHelper.convertBobToTdl(bobWidgetJson, convertBobSuffix);
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
                const widgetTdl = ScaledSliderHelper.convertBobToTdl(bobWidgetJson, "scaledslider");
                const widgetKey = widgetTdl["widgetKey"];
                tdl[widgetKey] = widgetTdl;
            } else if (bobWidgetType === "scrollbar") {
                const widgetTdl = ScaledSliderHelper.convertBobToTdl(bobWidgetJson, "scrollbar");
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
            } else if (bobWidgetType === "stripchart") {
                const widgetTdl = await DataViewerHelper.convertBobToTdl(bobWidgetJson, "stripchart", fullTdlFileName);
                const widgetKey = widgetTdl["widgetKey"];
                tdl[widgetKey] = widgetTdl;
            } else if (bobWidgetType === "databrowser") {
                const widgetTdl = await DataViewerHelper.convertBobToTdl(bobWidgetJson, "databrowser", fullTdlFileName);
                const widgetKey = widgetTdl["widgetKey"];
                tdl[widgetKey] = widgetTdl;
            } else if (bobWidgetType === "image") {
                const widgetTdl = ImageHelper.convertBobToTdl(bobWidgetJson);
                const widgetKey = widgetTdl["widgetKey"];
                tdl[widgetKey] = widgetTdl;
            } else if (bobWidgetType === "xyplot") {
                const widgetTdl = XYPlotHelper.convertBobToTdl(bobWidgetJson);
                const widgetKey = widgetTdl["widgetKey"];
                tdl[widgetKey] = widgetTdl;
            } else if (bobWidgetType === "embedded") {
                const widgetTdl = EmbeddedDisplayHelper.convertBobToTdl(bobWidgetJson, "embedded", convertBobSuffix);
                const widgetKey = widgetTdl["widgetKey"];
                tdl[widgetKey] = widgetTdl;
            } else if (bobWidgetType === "webbrowser") {
                const widgetTdl = EmbeddedDisplayHelper.convertBobToTdl(bobWidgetJson, "webbrowser", convertBobSuffix);
                const widgetKey = widgetTdl["widgetKey"];
                tdl[widgetKey] = widgetTdl;
            } else if (bobWidgetType === "navtabs") {
                const widgetTdl = EmbeddedDisplayHelper.convertBobToTdl(bobWidgetJson, "navtabs", convertBobSuffix);
                const widgetKey = widgetTdl["widgetKey"];
                tdl[widgetKey] = widgetTdl;
            } else if (bobWidgetType === "group") {
                const widgetsTdl = await GroupHelper.convertBobToTdl(bobWidgetJson, "group");
                for (const [widgetKey, widgetTdl] of Object.entries(widgetsTdl)) {
                    tdl[widgetKey] = widgetTdl;
                }
            } else if (bobWidgetType === "tabs") {
                const widgetsTdl = await GroupHelper.convertBobToTdl(bobWidgetJson, "tabs");
                for (const [widgetKey, widgetTdl] of Object.entries(widgetsTdl)) {
                    tdl[widgetKey] = widgetTdl;
                }
            } else if (bobWidgetType === "template") {
                const widgetsTdl = await TableHelper.convertBobToTdl(bobWidgetJson, fullTdlFileName);
                for (const [widgetKey, widgetTdl] of Object.entries(widgetsTdl)) {
                    tdl[widgetKey] = widgetTdl;
                }
            } else {
                Log.info("Skip converting widget", bobWidgetType);
            }
        }

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
    static convertBobActions = (propertyValue: any, convertBobSuffix: boolean) => {
        const result: any[] = [];
        // array of actions
        if (typeof propertyValue[0] !== "object") {
            return result;
        }
        const actionsData = propertyValue[0]["action"];
        for (const actionData of actionsData) {
            const type = actionData["$"]["type"];
            if (type === "open_display") {
                result.push(this.convertBobAction_open_display(actionData, convertBobSuffix));
            } else if (type === "write_pv") {
                result.push(this.convertBobAction_write_pv(actionData));
            } else if (type === "command") {
                result.push(this.convertBobAction_command(actionData));
            } else if (type === "open_webpage") {
                result.push(this.convertBobAction_open_webpage(actionData));
            } else if (type === "execute") { // execute script, not in tdm
                result.push(this.convertBobAction_execute(actionData));
            } else if (type === "open_file") { // open file, not in tdm
                result.push(this.convertBobAction_open_file(actionData));
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
        },
        convertBobSuffix: boolean
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

        let fileName = this.convertBobString(propertyValue["file"]);

        if (convertBobSuffix === true) {
            fileName = fileName.replaceAll(".bob", ".tdl").replaceAll(".plt", ".tdl");
        }

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


    /**
     * Convert
     * 
     *     {
     *         "$": {
     *             "type": "execute"
     *         },
     *         "description": [
     *             "Execute Script"
     *         ],
     *         "script": [
     *             {
     *                 "$": {
     *                     "file": "EmbeddedPy"
     *                 },
     *                 "text": [
     *                     "# Embedded python script\nfrom org.csstudio.display.builder.runtime.script import PVUtil, ScriptUtil\nprint 'Hello'\n# widget.setPropertyValue('text', PVUtil.getString(pvs[0]))"
     *                 ]
     *             }
     *         ]
     *     }
     * 
     * to an invalid ExecuteCommand
     */
    static convertBobAction_execute = (
        propertyValue: any
    ) => {
        const desc = this.convertBobString(propertyValue["description"]);
        return {
            type: "ExecuteCommand",
            label: `${desc} (Execute Script) not available`,
            command: "",
            confirmOnWrite: false,
            confirmOnWriteUsePassword: false,
            confirmOnWritePassword: "",
        }
    }

    /**
     * Convert
     * 
     *     {
     *         "$": {
     *             "type": "open_file"
     *         },
     *         "description": [
     *             "Open File"
     *         ],
     *         "file": [
     *             "abc"
     *         ]
     *     }
     * 
     * to an invalid ExecuteCommand
     */
    static convertBobAction_open_file = (
        propertyValue: any
    ) => {

        const desc = this.convertBobString(propertyValue["description"]);
        return {
            type: "ExecuteCommand",
            label: `${desc} (Open File) not available`,
            command: "",
            confirmOnWrite: false,
            confirmOnWriteUsePassword: false,
            confirmOnWritePassword: "",
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
        if (data !== undefined && typeof data !== "string") {
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

    // -------------------- stripchart ----------------------------------


    /**
     * Convert 
     * 
     *  [
     *       {
     *           "trace": [
     *               {
     *                   "name": [
     *                       "$(traces[0].y_pv)"
     *                   ],
     *                   "y_pv": [
     *                       "val1"
     *                   ],
     *                   "axis": [
     *                       "0"
     *                   ],
     *                   "trace_type": [
     *                       "2"
     *                   ],
     *                   "color": [
     *                       {
     *                           "color": [
     *                               {
     *                                   "$": {
     *                                       "red": "0",
     *                                       "green": "0",
     *                                       "blue": "255"
     *                                   }
     *                               }
     *                           ]
     *                       }
     *                   ],
     *                   "line_width": [
     *                       "2"
     *                   ],
     *                   "point_type": [
     *                       "0"
     *                   ],
     *                   "point_size": [
     *                       "10"
     *                   ],
     *                   "visible": [
     *                       "true"
     *                   ]
     *               }
     *           ]
     *       }
     *   ]
     * 
     * to
     *     {
     *          "label": "val1",
     *          "valMin": -100.10000000000001,
     *          "valMax": 1101.1,
     *          "lineWidth": 2,
     *          "lineColor": "rgba(0,0,255,1)",
     *          "ticks": [
     *              0,
     *              200,
     *              400,
     *              600,
     *              800,
     *              1000
     *          ],
     *          "ticksText": [
     *              0,
     *              200,
     *              400,
     *              600,
     *              800,
     *              1000
     *          ],
     *          "show": true,
     *          "bufferSize": 50000,
     *          "displayScale": "Linear"
     *      }
     */
    static convertBobStripchartTraces = (
        propertyValue: {
            trace: {
                name: string[],
                y_pv: string[],
                axis: string[],
                trace_type: string[],
                color: { color: { "$": { name?: string, red: string, green: string, blue: string, alpha?: string } }[] }[],
                line_width: string[],
                point_type: string[],
                point_size: string[],
                visible: ("true" | "false")[],
            }[]
        }[]
    ) => {
        const tracesData = propertyValue[0]["trace"];
        const result: any[] = [];
        for (const traceData of tracesData) {
            const label = this.convertBobString(traceData["y_pv"]);
            const lineWidth = this.convertBobNum(traceData["line_width"]);
            const lineColor = this.convertBobColor(traceData["color"]);
            const show = this.convertBobBoolean(traceData["visible"]);
            const axis = this.convertBobNum(traceData["axis"]);
            result.push(
                {
                    "label": label,
                    "valMin": -100.10000000000001, // will be determined in axis
                    "valMax": 1101.1, // will be determined in axis
                    "lineWidth": lineWidth,
                    "lineColor": lineColor,
                    "ticks": [  // will be determined in axis
                        0,
                        200,
                        400,
                        600,
                        800,
                        1000
                    ],
                    "ticksText": [  // will be determined in axis
                        0,
                        200,
                        400,
                        600,
                        800,
                        1000
                    ],
                    "show": show,
                    "bufferSize": 50000,
                    "displayScale": "Linear", // will be determined in axis
                    "axis": axis, // additional data, will be removed later
                }
            )
        }
        return result;
    }

    /**
     * Convert
     * 
     *          [
     *              {
     *                  "y_axis": [
     *                      {
     *                          "title": [
     *                              "Y"
     *                          ],
     *                          "autoscale": [
     *                              "false"
     *                          ],
     *                          "log_scale": [
     *                              "false"
     *                          ],
     *                          "minimum": [
     *                              "22.0"
     *                          ],
     *                          "maximum": [
     *                              "100.0"
     *                          ],
     *                          "show_grid": [
     *                              "false"
     *                          ],
     *                          "visible": [
     *                              "true"
     *                          ],
     *                          "color": [
     *                              {
     *                                  "color": [
     *                                      {
     *                                          "$": {
     *                                              "name": "Text",
     *                                              "red": "0",
     *                                              "green": "0",
     *                                              "blue": "0"
     *                                          }
     *                                      }
     *                                  ]
     *                              }
     *                          ]
     *                      }
     *                  ]
     *              }
     *          ]
     * to {
     *       valMin: 22.0,
     *       valMax: 100.0,
     *       displayScale: "linear"
     *    }
     */

    static convertBobStripchartYAxes = (
        propertyValue: {
            y_axis: {
                title: string[],
                autoscale: string[],
                log_scale: ("true" | "false")[],
                minimum: string[],
                maximum: string[],
                show_grid: string[],
                visible: string[],
                color: any
            }[]
        }[]
    ) => {
        const result: { valMin: number, valMax: number, displayScale: "Log10" | "Linear", ticks: number[], ticksText: number[] }[] = [];
        const axesData = propertyValue[0]["y_axis"];
        for (const axisData of axesData) {
            const valMin = this.convertBobNum(axisData["minimum"]);
            const valMax = this.convertBobNum(axisData["maximum"]);
            const displayScale = this.convertBobBoolean(axisData["log_scale"]) === true ? "Log10" : "Linear";
            const ticks = this.calcTicksAndLabel(valMin, valMax);
            result.push({
                valMin: valMin,
                valMax: valMax,
                displayScale: displayScale,
                ticks: ticks,
                ticksText: ticks,
            })
        }
        return result;
    }

    /**
     * Convert 
     * 
     *  [
     *        {
     *            "y_axis": [
     *                {
     *                    "title": [
     *                        "abc"
     *                    ],
     *                    "autoscale": [
     *                        "true"
     *                    ],
     *                    "log_scale": [
     *                        "true"
     *                    ],
     *                    "minimum": [
     *                        "22.0"
     *                    ],
     *                    "maximum": [
     *                        "33.0"
     *                    ],
     *                    "show_grid": [
     *                        "true"
     *                    ],
     *                    "title_font": [
     *                        {
     *                            "font": [
     *                                {
     *                                    "$": {
     *                                        "family": "Liberation Serif",
     *                                        "style": "BOLD",
     *                                        "size": "14.0"
     *                                    }
     *                                }
     *                            ]
     *                        }
     *                    ],
     *                    "scale_font": [
     *                        {
     *                            "font": [
     *                                {
     *                                    "$": {
     *                                        "family": "Libian SC",
     *                                        "style": "REGULAR",
     *                                        "size": "14.0"
     *                                    }
     *                                }
     *                            ]
     *                        }
     *                    ],
     *                    "on_right": [
     *                        "true"
     *                    ],
     *                    "visible": [
     *                        "false"
     *                    ],
     *                    "color": [
     *                        {
     *                            "color": [
     *                                {
     *                                    "$": {
     *                                        "name": "Grid",
     *                                        "red": "128",
     *                                        "green": "128",
     *                                        "blue": "128"
     *                                    }
     *                                }
     *                            ]
     *                        }
     *                    ]
     *                }
     *            ]
     *        }
     *    ]
     * 
     * to {
     *        valMin: 22.0,
     *        valMax: 33.0,
     *        ticks: [],
     *        ticksText: [],
     *        autoScale: true,
     *        showGrid: true,
     *        displayScale: "Log10",
     *    }
     */
    static convertBobXYPlotYAxes = (
        propertyValue: {
            y_axis: {
                title: string[],
                autoscale: ("true" | "false")[],
                log_scale: ("true" | "false")[],
                minimum: string[],
                maximum: string[],
                show_grid: ("true" | "false")[],
                title_font: any,
                scale_font: any,
                on_right: string[],
                visible: string[],
                color: any,
            }[]
        }[]
    ) => {
        const yAxesData = propertyValue[0]["y_axis"];
        const result: Record<string, any>[] = [];
        for (const yAxisData of yAxesData) {
            const yAxis: Record<string, any> = {};
            yAxis["valMin"] = this.convertBobNum(yAxisData["minimum"]);
            yAxis["valMax"] = this.convertBobNum(yAxisData["maximum"]);
            yAxis["ticks"] = this.calcTicksAndLabel(yAxis["valMin"], yAxis["valMax"]);
            yAxis["ticksText"] = yAxis["ticks"];
            yAxis["autoScale"] = this.convertBobBoolean(yAxisData["autoscale"]);
            yAxis["showGrid"] = this.convertBobBoolean(yAxisData["show_grid"]);
            yAxis["displayScale"] = this.convertBobBoolean(yAxisData["log_scale"]) === true ? "Log10" : "Linear";
            result.push(yAxis);
        }
        return result;
    }

    /**
     * Convert 
     * 
     *   [
     *        {
     *            "trace": [
     *                {
     *                    "name": [
     *                        "$(traces[0].y_pv)"
     *                    ],
     *                    "x_pv": [
     *                        "ab"
     *                    ],
     *                    "y_pv": [
     *                        "cd"
     *                    ],
     *                    "err_pv": [
     *                        "ef"
     *                    ],
     *                    "axis": [
     *                        "0"
     *                    ],
     *                    "trace_type": [
     *                        "2"
     *                    ],
     *                    "color": [
     *                        {
     *                            "color": [
     *                                {
     *                                    "$": {
     *                                        "name": "INVALID",
     *                                        "red": "255",
     *                                        "green": "0",
     *                                        "blue": "255"
     *                                    }
     *                                }
     *                            ]
     *                        }
     *                    ],
     *                    "line_width": [
     *                        "3"
     *                    ],
     *                    "line_style": [
     *                        "1"
     *                    ],
     *                    "point_type": [
     *                        "1"
     *                    ],
     *                    "point_size": [
     *                        "22"
     *                    ],
     *                    "visible": [
     *                        "false"
     *                    ]
     *                }
     *            ]
     *        }
     *    ]
     * 
     * to {
     *       label: "cd";
     *       xPv: "ab", // will be removed
     *       yPv: "cd", // will be removed
     *       valMin: 0, // determined later
     *       valMax: 10, // determined later
     *       lineWidth: 3,
     *       lineColor: "rgba(255, 0, 255, 1)",
     *       ticks: []; // determined later
     *       ticksText: [], // determined later
     *       autoScale: false, // determined later
     *       lineStyle: "dashed",
     *       pointType: "square",
     *       pointSize: 22,
     *       showGrid: true,
     *       numGrids: 5, 
     *       displayScale: "Linear", // determined later
     *    }
     */
    static convertBobXYPlotTraces = (
        propertyValue: {
            trace: {
                name: string[],
                x_pv: string[],
                y_pv: string[],
                err_pv: string[],
                axis: string[],
                trace_type: string[],
                color: any,
                line_width: string[],
                line_style: string[],
                point_type: string[],
                point_size: string[],
                visible: ("true" | "false")[],
            }[]
        }[]
    ) => {
        const tracesData = propertyValue[0]["trace"];
        const result: any[] = [];
        for (const traceData of tracesData) {
            const label = this.convertBobString(traceData["y_pv"]);
            const xPv = this.convertBobString(traceData["x_pv"]);
            const yPv = this.convertBobString(traceData["y_pv"]);
            const axis = this.convertBobNum(traceData["axis"]);
            const valMin = 0;
            const valMax = 0;
            const lineWidth = this.convertBobNum(traceData["line_width"]);
            const lineColor = this.convertBobColor(traceData["color"]);
            const ticks: number[] = [];
            const ticksText: (number | string)[] = [];
            const autoScale = false;
            const lineStyle = this.convertBobLineStyle(traceData["line_style"]);
            const pointType = this.convertBobPointType(traceData["point_type"]);
            const pointSize = this.convertBobNum(traceData["point_size"]);
            const showGrid = true;
            const numGrids = 5;
            const displayScale = "Linear";
            result.push({
                label: label,
                xPv: xPv,  // will be removed
                yPv: yPv,  // will be removed
                axis: axis, // will be removed
                valMin: valMin, // determined later
                valMax: valMax, // determined later
                lineWidth: lineWidth,
                lineColor: lineColor,
                ticks: ticks, // determined later
                ticksText: ticksText, // determined later
                autoScale: autoScale, // determined later
                lineStyle: lineStyle,
                pointType: pointType,
                pointSize: pointSize,
                showGrid: showGrid, // determined later
                numGrids: numGrids,
                displayScale: displayScale, // determined later
            })
        }
        return result;
    }

    /**
     * Convert ["1"] to "square"
     */
    static convertBobPointType = (
        propertyValue: string[],
    ) => {
        const numVal = this.convertBobNum(propertyValue);
        if (numVal === 0) {
            return "none";
        } else if (numVal === 1) {
            return "square";
        } else if (numVal === 2) {
            return "circle";
        } else if (numVal === 3) {
            return "diamond";
        } else if (numVal === 4) {
            return "x";
        } else if (numVal === 5) {
            return "triangle";
        } else {
            return "none";
        }
    }

    static calcTicksAndLabel = (valMin: number, valMax: number) => {

        const ticks: number[] = [];
        const ticksText: (number | string)[] = [];

        const yAxisInterval0 = (valMax - valMin) / 5;
        const yAxisInterval = parseFloat(yAxisInterval0.toExponential(0));

        for (let val = Math.ceil(valMin / yAxisInterval); val < Math.ceil(valMax / yAxisInterval); val = val + 1) {
            ticks.push(val * yAxisInterval);
            ticksText.push(val * yAxisInterval);
        }
        return ticks;
    };


    /**
     * Convert 
     *           [
     *               {
     *                   "name": [
     *                       "JET"
     *                   ]
     *               }
     *           ]
     * 
     * to "jet"
     */
    static convertBobColorMap = (
        propertyValue: { name: string[] }[]
    ) => {
        const str = propertyValue[0]["name"][0];
        if (str === "JET") {
            return "jet"
        } else if (str === "GRAY") {
            return "gray";
        } else if (str === "SPECTRUM") {
            return "spectral";
        } else if (str === "HOT") {
            return "hot";
        } else if (str === "COOL") {
            return "cool";
        } else if (str === "SHADED") { // not in tdm
            return "viridis";
        } else if (str === "MAGMA") {
            return "magma";
        } else {
            return "viridis";
        }
    }


    /**
     * Convert 
     *           [
     *               {
     *                   "title": [
     *                       "X1"
     *                   ],
     *                   "autoscale": [
     *                       "true"
     *                   ],
     *                   "log_scale": [
     *                       "true"
     *                   ],
     *                   "minimum": [
     *                       "5.0"
     *                   ],
     *                   "maximum": [
     *                       "55.0"
     *                   ],
     *                   "show_grid": [
     *                       "true"
     *                   ],
     *                   "title_font": [
     *                       {
     *                           "font": [
     *                               {
     *                                   "$": {
     *                                       "family": "Liberation Serif",
     *                                       "style": "BOLD",
     *                                       "size": "14.0"
     *                                   }
     *                               }
     *                           ]
     *                       }
     *                   ],
     *                   "scale_font": [
     *                       {
     *                           "font": [
     *                               {
     *                                   "$": {
     *                                       "family": "LingWai TC",
     *                                       "style": "REGULAR",
     *                                       "size": "14.0"
     *                                   }
     *                               }
     *                           ]
     *                       }
     *                   ],
     *                   "visible": [
     *                       "true"
     *                   ]
     *               }
     *           ]
     * 
     * to  {
     *         label: "X1",
     *         valMin: 5.0,
     *         valMax: 55.0,
     *         ticks: [], // auto generate
     *         ticksText: [], // auto generate
     *         autoScale: true,
     *         showGrid: true,
     *         numGrids: 5,
     *     }
     */
    static convertBobXYPlotXAxis = (
        propertyValue: {
            title: string[],
            autoscale: ("true" | "false")[],
            log_scale: string[],
            minimum: string[],
            maximum: string[],
            show_grid: ("true" | "false")[],
            title_font: any,
            scale_font: any,
            visible: string[],
        }[]
    ) => {
        const data = propertyValue[0];
        const label = this.convertBobString(data["title"]);
        const valMin = this.convertBobNum(data["minimum"]);
        const valMax = this.convertBobNum(data["maximum"]);
        const ticks = this.calcTicksAndLabel(valMin, valMax);
        const ticksText = ticks;
        const autoScale = this.convertBobBoolean(data["autoscale"]);
        const showGrid = this.convertBobBoolean(data["show_grid"]);
        const numGrids = 5;
        return {
            label: label,
            valMin: valMin,
            valMax: valMax,
            ticks: ticks,
            ticksText: ticksText,
            autoScale: autoScale,
            showGrid: showGrid,
            numGrids: numGrids,
        }
    }

    /**
     * Convert ["1"] to "fit"
     */
    static convertBobEmbeddedDisplayResize = (
        propertyValue: string[]
    ) => {
        const numVal = this.convertBobNum(propertyValue);
        if (numVal === 0) {
            return "none";
        } else if (numVal === 1) {
            return "fit";
        } else if (numVal === 2) {
            return "fit";
        } else if (numVal === 3) {
            return "fit";
        } else if (numVal === 4) {
            return "crop";
        } else {
            return "fit";
        }
    }

    /**
     * Convert 
     *           [
     *               {
     *                   "$": {
     *                       "type": "label",
     *                       "version": "2.0.0"
     *                   },
     *                   "name": [
     *                       "Label"
     *                   ],
     *                   "x": [
     *                       "27"
     *                   ],
     *                   "y": [
     *                       "27"
     *                   ],
     *                   "width": [
     *                       "180"
     *                   ],
     *                   "height": [
     *                       "120"
     *                   ],
     *                   "background_color": [
     *                       {
     *                           "color": [
     *                               {
     *                                   "$": {
     *                                       "name": "INVALID",
     *                                       "red": "255",
     *                                       "green": "0",
     *                                       "blue": "255"
     *                                   }
     *                               }
     *                           ]
     *                       }
     *                   ],
     *                   "transparent": [
     *                       "false"
     *                   ]
     *               }
     *           ]
     * 
     * to a tdl-like json file
     * 
     */

    static convertBobGroupWidgets = async (
        propertyValue: any[]
    ) => {
        const tdl: Record<string, any> = {};
        await this.parseBob({ widget: propertyValue }, tdl, "");
        delete tdl["Canvas"];
        return tdl;
    }


    /**
     * Convert ["1"] to true or false
     * 
     * The true/false is for tdl["text"]["showBox"]
     */
    static convertBobGroupStyle = (
        propertyValue: string[]
    ) => {
        const numVal = this.convertBobNum(propertyValue);
        if (numVal === 3) {
            return false;
        } else {
            return true;
        }
    }

    /**
     * Convert 
     * 
     *    [
     *          {
     *              "tab": [
     *                  {
     *                      "name": [
     *                          "Tab 1"
     *                      ],
     *                      "children": [
     *                          "\n        "
     *                      ]
     *                  },
     *                  {
     *                      "name": [
     *                          "Tab 2"
     *                      ],
     *                      "children": [
     *                          {
     *                              "widget": [
     *                                  {
     *                                      "$": {
     *                                          "type": "text-symbol",
     *                                          "version": "2.0.0"
     *                                      },
     *                                      "name": [
     *                                          "Text Symbol_1"
     *                                      ],
     *                                      "x": [
     *                                          "118"
     *                                      ],
     *                                      "y": [
     *                                          "89"
     *                                      ],
     *                                      "width": [
     *                                          "135"
     *                                      ],
     *                                      "height": [
     *                                          "60"
     *                                      ]
     *                                  }
     *                              ]
     *                          }
     *                      ]
     *                  }
     *              ]
     *          }
     *      ]
     * to {itemNames: ["Tab 1"], widgets: [widgetTdl, ...]}
     */
    static convertBobTabsTabs = async (
        propertyValue: {
            tab: {
                name: string[],
                children: { widget: Record<string, any>[] }[]
            }[]
        }[]
    ) => {
        const tabsData = propertyValue[0]['tab'];
        const result: { itemNames: string[], widgetKeys: string[][], widgetsTdl: Record<string, any> } = {
            itemNames: [], // ["tab-1", "tab-2"]
            widgetsTdl: {}, // list of widget tdls
            widgetKeys: [], // [["TextUpdate-xxx", "TextUpdate-xxx"], ["TextUpdate-xxx", "TextUpdate-xxx"]]
        };
        for (const tabData of tabsData) {
            const tabResult = await this.convertBobTabsTab(tabData);
            result["itemNames"].push(tabResult["itemName"]);
            result["widgetsTdl"] = { ...result["widgetsTdl"], ...tabResult["widgetsTdl"] };
            result["widgetKeys"].push(tabResult["widgetKeys"]);
        }
        return result;
    }

    static convertBobTabsTab = async (
        tabData: {
            name: string[],
            children: { widget: Record<string, any>[] }[]
        }
    ) => {
        try {
            const itemName = this.convertBobString(tabData["name"]);
            const widgetsData = tabData["children"][0]["widget"];
            const widgetsTdl = await this.convertBobGroupWidgets(widgetsData)
            return {
                itemName: itemName,
                widgetsTdl: widgetsTdl,
                widgetKeys: Object.keys(widgetsTdl),
            }
        } catch (e) {
            return {
                itemName: "",
                widgetsTdl: {},
                widgetKeys: [],
            }
        }
    }


    /**
     * From 
     * 
     *      [
     *           {
     *               "tab": [
     *                   {
     *                       "name": [
     *                           "Tab 1"
     *                       ],
     *                       "file": [
     *                           "abc"
     *                       ],
     *                       "macros": [
     *                           {
     *                               "a": [
     *                                   "b"
     *                               ],
     *                               "c": [
     *                                   "d"
     *                               ]
     *                           }
     *                       ],
     *                       "group_name": [
     *                           ""
     *                       ]
     *                   },
     *                   {
     *                       "name": [
     *                           "Tab 2"
     *                       ],
     *                       "file": [
     *                           "def"
     *                       ],
     *                       "macros": [
     *                           "\n        "
     *                       ],
     *                       "group_name": [
     *                           ""
     *                       ]
     *                   }
     *               ]
     *           }
     *       ]
     * 
     */
    static convertBobNavTabsTabs = (
        propertyValue: {
            tab: {
                name: string[],
                file: string[],
                group_name: string[],
                macros: Record<string, string[]>[]
            }[]
        }[]
    ) => {
        const tabsData = propertyValue[0]['tab'];
        const result: { itemNames: string[], tdlFileNames: string[], itemMacros: [string, string][][] } = {
            itemNames: [], // ["tab-1", "tab-2"]
            tdlFileNames: [], // ["file1.tdl", "file2.tdl"]
            itemMacros: [], // [[["A", "Ring"], ["B", "Linac"]], [["A", "Ring"], ["B", "Linac"]]]
        };
        for (const tabData of tabsData) {
            result["itemNames"].push(this.convertBobString(tabData["name"]));
            result["tdlFileNames"].push(this.convertBobString(tabData["file"]));
            result["itemMacros"].push(this.convertBobMacros(tabData["macros"]));
        }
        return result;
    }

    /**
     * Convert 
     * 
     * [
     *      {
     *          "instance": [
     *              {
     *                  "macros": [
     *                      {
     *                          "a": [
     *                              "b"
     *                          ],
     *                          "c": [
     *                              "c"
     *                          ]
     *                      }
     *                  ]
     *              },
     *              {
     *                  "macros": [
     *                      {
     *                          "aa": [
     *                              "bb"
     *                          ],
     *                          "cc": [
     *                              "cc"
     *                          ]
     *                      }
     *                  ]
     *              }
     *          ]
     *      }
     *  ]
     * 
     * to [[["a", "b"], ["c", "d"]], [["aa", "bb"], ["cc", "dd"]]]
     */
    static convertBobTemplateInstances = (
        propertyValue: { instance: { macros: Record<string, string[]>[] }[] }[]
    ) => {
        const instancesData = propertyValue[0]["instance"];
        const result: [string, string][][] = [];
        for (const instanceData of instancesData) {
            const macorsData = instanceData["macros"];
            result.push(this.convertBobMacros(macorsData));
        }
        return result;
    }


    /**
     * Convert 
     * 
     *   [
     *       {
     *           "axis": [
     *               {
     *                   "visible": [
     *                       "true"
     *                   ],
     *                   "name": [
     *                       "Value 1"
     *                   ],
     *                   "use_axis_name": [
     *                       "false"
     *                   ],
     *                   "use_trace_names": [
     *                       "true"
     *                   ],
     *                   "right": [
     *                       "false"
     *                   ],
     *                   "color": [
     *                       {
     *                           "red": [
     *                               "0"
     *                           ],
     *                           "green": [
     *                               "0"
     *                           ],
     *                           "blue": [
     *                               "0"
     *                           ]
     *                       }
     *                   ],
     *                   "min": [
     *                       "336.5"
     *                   ],
     *                   "max": [
     *                       "342.5"
     *                   ],
     *                   "grid": [
     *                       "false"
     *                   ],
     *                   "autoscale": [
     *                       "false"
     *                   ],
     *                   "log_scale": [
     *                       "false"
     *                   ]
     *               }
     *           ]
     *       },
     *       ...
     *   ]
     * 
     * to an array of type_yAxis subset in DataViewer, 
     *   {
     *       valMin: number,
     *       valMax: number,
     *       ticks: number[],
     *       ticksText: number[],
     *       show: boolean,
     *       displayScale: "Log10" | "Linear",
     *   }[]
     */
    static convertBobDataBrowserAxes = (
        propertyValue: {
            axis: {
                visible: ("true" | "false")[],
                name: string[],
                use_axis_name: ("true" | "false")[],
                use_trace_names: ("true" | "false")[],
                right: ("true" | "false")[],
                color: { red: string, green: string, blue: string }[],
                min: string[],
                max: string[],
                grid: ("true" | "false")[],
                autoscale: ("true" | "false")[],
                log_scale: ("true" | "false")[],
            }[]
        }[]
    ) => {
        const result: {
            valMin: number,
            valMax: number,
            ticks: number[],
            ticksText: number[],
            show: boolean,
            displayScale: "Log10" | "Linear",
        }[] = [];

        for (const axisData of propertyValue[0]["axis"]) {

            // label: string;
            const valMin = this.convertBobNum(axisData["min"]);
            const valMax = this.convertBobNum(axisData["max"]);
            // lineWidth: number;
            // lineColor: string;
            const ticks = this.calcTicksAndLabel(valMin, valMax);
            const ticksText = ticks;
            const show = this.convertBobBoolean(axisData["visible"]);
            // bufferSize: number;
            const displayScale = this.convertBobBoolean(axisData["log_scale"]) === true ? "Log10" : "Linear";
            // a subset of type_yAxis in DataViewer
            result.push(
                {
                    valMin,
                    valMax,
                    ticks,
                    ticksText,
                    show,
                    displayScale,
                }
            )
        }
        return result;
    }

    /**
     * Convert
     * 
     *.  [
     *       {
     *           "pv": [
     *               {
     *                   "display_name": [
     *                       "aaa"
     *                   ],
     *                   "visible": [
     *                       "true"
     *                   ],
     *                   "name": [
     *                       "val1"
     *                   ],
     *                   "axis": [
     *                       "0"
     *                   ],
     *                   "color": [
     *                       {
     *                           "red": [
     *                               "255"
     *                           ],
     *                           "green": [
     *                               "0"
     *                           ],
     *                           "blue": [
     *                               "0"
     *                           ]
     *                       }
     *                   ],
     *                   "trace_type": [
     *                       "AREA"
     *                   ],
     *                   "linewidth": [
     *                       "2"
     *                   ],
     *                   "line_style": [
     *                       "SOLID"
     *                   ],
     *                   "point_type": [
     *                       "NONE"
     *                   ],
     *                   "point_size": [
     *                       "2"
     *                   ],
     *                   "waveform_index": [
     *                       "0"
     *                   ],
     *                   "period": [
     *                       "0.0"
     *                   ],
     *                   "ring_size": [
     *                       "5000"
     *                   ],
     *                   "request": [
     *                       "OPTIMIZED"
     *                   ],
     *                   "archive": [
     *                       {
     *                           "name": [
     *                               "Accelerator"
     *                           ],
     *                           "url": [
     *                               "jdbc:oracle:thin:@(DESCRIPTION=(LOAD_BALANCE=OFF)(FAILOVER=ON)(ADDRESS=(PROTOCOL=TCP)(HOST=snsappa.sns.ornl.gov)(PORT=1610))(ADDRESS=(PROTOCOL=TCP)(HOST=snsappb.sns.ornl.gov)(PORT=1610))(CONNECT_DATA=(SERVICE_NAME=prod_controls)))"
     *                           ],
     *                           "key": [
     *                               "1"
     *                           ]
     *                       },
     *                       {
     *                           "name": [
     *                               "Instruments"
     *                           ],
     *                           "url": [
     *                               "jdbc:oracle:thin:@snsoroda-scan.sns.gov:1521/scprod_controls"
     *                           ],
     *                           "key": [
     *                               "2"
     *                           ]
     *                       }
     *                   ]
     *               }
     *           ]
     *       }
     *   ]
     */
    static convertBobDataBrowserPvlist = (
        propertyValue: {
            pv: {
                display_name: string[],
                visible: string[],
                name: string[],
                axis: string[],
                color: { red: string[], green: string[], blue: string[] }[],
                trace_type: string[],
                linewidth: string[],
                line_style: string[],
                point_type: string[],
                point_size: string[],
                waveform_index: string[],
                period: string[],
                ring_size: string[],
                request: string[],
                archive: { name: string[], url: string[], key: string[] }[],
            }[]
        }[]
    ) => {
        // a subset of type_yAxis in DataViewer
        const result: {
            label: string,
            lineWidth: number,
            lineColor: string,
            bufferSize: number,
            axisIndex: number, // additional data, will be removed
            channelName: string, // additional data, will be removed
        }[] = [];

        const pvsData = propertyValue[0]["pv"];
        for (const pvData of pvsData) {
            const label = this.convertBobString(pvData["display_name"]);
            const lineWidth = this.convertBobNum(pvData["linewidth"]);

            const redValue = this.convertBobNum(pvData["color"][0]["red"]);
            const greenValue = this.convertBobNum(pvData["color"][0]["green"]);
            const blueValue = this.convertBobNum(pvData["color"][0]["blue"]);
            const lineColor = `rgba(${redValue}, ${greenValue}, ${blueValue}, 1)`;
            const bufferSize = this.convertBobNum(pvData["ring_size"]);

            const axisIndex = this.convertBobNum(pvData["axis"]);
            const channelName = this.convertBobString(pvData["name"]);
            result.push({
                label, lineWidth, lineColor, bufferSize, axisIndex, channelName
            })
        }
        return result;
    }



}
