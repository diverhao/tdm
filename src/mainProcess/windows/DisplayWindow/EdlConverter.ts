import { v4 as uuidv4 } from "uuid";
// import { rgbaStrToRgbaArray, rgbaArrayToRgbaStr } from "./GlobalMethods/GlobalMethods";
import { rgbaArrayToRgbaStr } from "../../../common/GlobalMethods";
import { CanvasHelper } from "../../../rendererProcess/helperWidgets/Canvas/CanvasHelper";
import { TextUpdateHelper } from "../../file/widgetConverters/TextUpdate/TextUpdateHelper";
import { RectangleHelper } from "../../file/widgetConverters/Rectangle/RectangleHelper";
import { LabelHelper } from "../../file/widgetConverters/Label/LabelHelper";
import { BooleanButtonHelper } from "../../file/widgetConverters/BooleanButton/BooleanButtonHelper";
import { TextEntryHelper } from "../../file/widgetConverters/TextEntry/TextEntryHelper";
import { ByteMonitorHelper } from "../../file/widgetConverters/ByteMonitor/ByteMonitorHelper";
import { PolylineHelper } from "../../file/widgetConverters/Polyline/PolylineHelper";
import { ActionButtonHelper } from "../../file/widgetConverters/ActionButton/ActionButtonHelper";
import { ArcHelper } from "../../file/widgetConverters/Arc/ArcHelper";
import { TankHelper } from "../../file/widgetConverters/Tank/TankHelper";
import { ComboBoxHelper } from "../../file/widgetConverters/ComboBox/ComboBoxHelper";
import { EdmSymbolHelper } from "../../file/widgetConverters/EdmSymbol/EdmSymbolHelper";
import { EmbeddedDisplayHelper } from "../../file/widgetConverters/EmbeddedDisplay/EmbeddedDisplayHelper";
import { ChoiceButtonHelper } from "../../file/widgetConverters/ChoiceButton/ChoiceButtonHelper";
import { RadioButtonHelper } from "../../file/widgetConverters/RadioButton/RadioButtonHelper";
import { MediaHelper } from "../../file/widgetConverters/Media/MediaHelper";
import { ScaledSliderHelper } from "../../file/widgetConverters/ScaledSlider/ScaledSliderHelper";
import { XYPlotHelper } from "../../file/widgetConverters/XYPlot/XYPlotHelper";
import { Log } from "../../../common/Log";
import { LEDHelper } from "../../file/widgetConverters/LED/LEDHelper";
import path from "path";

export class EdlConverter {

    static parseEdl = (
        edlJSON: Record<string, any>,
        tdl: Record<string, any>,
        inGroup: boolean = false,
        edlFileName: string | undefined = undefined,
        convertEdlSufffix: boolean = false
    ) => {

        for (let widgetKey of Object.keys(edlJSON)) {
            Log.info("-1", "converting ", widgetKey);
            const widgetEdlJSON = edlJSON[widgetKey];
            if (widgetKey === "ScreenProperties") {
                tdl["Canvas"] = CanvasHelper.convertEdlToTdl(widgetEdlJSON);
                //! verify they are the same thing
            } else if (widgetKey.startsWith("Text Update") || widgetKey.startsWith("Textupdate")) {
                const widgetTdl = TextUpdateHelper.convertEdlToTdl(widgetEdlJSON, "Text Update");
                const newWidgetKey = widgetTdl["widgetKey"];
                tdl[newWidgetKey] = widgetTdl;
            } else if (widgetKey.startsWith("Reg Text Update") || widgetKey.startsWith("RegTextupdate")) {
                tdl[widgetKey] = TextUpdateHelper.convertEdlToTdl(widgetEdlJSON, "Reg Text Update");
            } else if (widgetKey.includes("Text Control")) {
                if (widgetEdlJSON["editable"] === "true") {
                    // to TextEntry
                    tdl[widgetKey] = TextEntryHelper.convertEdlToTdl_TextControl(widgetEdlJSON);
                } else {
                    // to TextUpdate
                    tdl[widgetKey] = TextUpdateHelper.convertEdlToTdl_TextControl(widgetEdlJSON);
                }
            } else if (widgetKey.includes("Static Text") || widgetKey.includes("Text w. Reg. Exp.")) {
                tdl[widgetKey] = LabelHelper.convertEdlToTdl(widgetEdlJSON);
            } else if (widgetKey.includes("Rectangle")) {
                tdl[widgetKey] = RectangleHelper.convertEdlToTdl(widgetEdlJSON);
            } else if (widgetKey.startsWith("Button")) {
                tdl[widgetKey] = BooleanButtonHelper.convertEdlToTdl(widgetEdlJSON, "Button");
            } else if (widgetKey.startsWith("LED")) {
                // edm does not have this widget, this is from 
                const widgetTdl = LEDHelper.convertEdlToTdl_Button(widgetEdlJSON, "Button");
                if (widgetTdl !== undefined) {
                    tdl[widgetKey] = widgetTdl;
                }
            } else if (widgetKey.startsWith("Message Button")) {
                tdl[widgetKey] = BooleanButtonHelper.convertEdlToTdl(widgetEdlJSON, "Message Button");
            } else if (widgetKey.includes("Text Entry") || widgetKey.startsWith("Textentry")) {
                tdl[widgetKey] = TextEntryHelper.convertEdlToTdl(widgetEdlJSON);
            } else if (widgetKey.includes("Byte")) {
                tdl[widgetKey] = ByteMonitorHelper.convertEdlToTdl(widgetEdlJSON);
            } else if (widgetKey.includes("Group")) {
                EdlConverter.convertEdlGroup(edlJSON[widgetKey], tdl, widgetKey, edlFileName, convertEdlSufffix);
            } else if (widgetKey.includes("Lines")) {
                const widgetJson = PolylineHelper.convertEdlToTdl(edlJSON[widgetKey]);
                if (widgetJson !== undefined) {
                    tdl[widgetKey] = widgetJson;
                }
            } else if (widgetKey.includes("Shell Command")) {
                tdl[widgetKey] = ActionButtonHelper.convertEdlToTdl_ShellCommand(edlJSON[widgetKey], convertEdlSufffix);
            } else if (widgetKey.includes("Exit Button")) {
                tdl[widgetKey] = ActionButtonHelper.convertEdlToTdl_ExitButton(edlJSON[widgetKey]);
            } else if (widgetKey.includes("Related Display")) {
                tdl[widgetKey] = ActionButtonHelper.convertEdlToTdl_RelatedDisplay(edlJSON[widgetKey], convertEdlSufffix);
            } else if (widgetKey.includes("Circle")) {
                tdl[widgetKey] = ArcHelper.convertEdlToTdl(edlJSON[widgetKey], "Circle");
            } else if (widgetKey.includes("Arc")) {
                tdl[widgetKey] = ArcHelper.convertEdlToTdl(edlJSON[widgetKey], "Arc");
            } else if (widgetKey.includes("Text Monitor")) {
                const widgetTdl = TextUpdateHelper.convertEdlToTdl_TextControl(edlJSON[widgetKey], "Text Monitor");
                const newWidgetKey = widgetTdl["widgetKey"];
                tdl[newWidgetKey] = widgetTdl;
            } else if (widgetKey.includes("Bar")) {
                tdl[widgetKey] = TankHelper.convertEdlToTdl(edlJSON[widgetKey]);
            } else if (widgetKey.includes("Menu Button")) {
                tdl[widgetKey] = ComboBoxHelper.convertEdlToTdl(edlJSON[widgetKey]);
            } else if (widgetKey.includes("Menu Mux")) {
                tdl[widgetKey] = ComboBoxHelper.convertEdlToTdl_Menu_Mux(edlJSON[widgetKey]);
            } else if (widgetKey.includes("Choice Button")) {
                tdl[widgetKey] = ChoiceButtonHelper.convertEdlToTdl(edlJSON[widgetKey]);
            } else if (widgetKey.includes("Radio Box")) {
                tdl[widgetKey] = RadioButtonHelper.convertEdlToTdl(edlJSON[widgetKey]);
            } else if (widgetKey.includes("GIF Image") || widgetKey.includes("PNG Image")) {
                tdl[widgetKey] = MediaHelper.convertEdlToTdl(edlJSON[widgetKey]);
            } else if (widgetKey.includes("Motif Slider") || widgetKey.startsWith("Slider")) {
                tdl[widgetKey] = ScaledSliderHelper.convertEdlToTdl(edlJSON[widgetKey]);
            } else if (widgetKey.includes("X-Y Graph")) {
                tdl[widgetKey] = XYPlotHelper.convertEdlToTdl(edlJSON[widgetKey]);
            } else if (widgetKey.startsWith("Symbol")) {
                const symbolTdl = EdmSymbolHelper.convertEdlToTdl(edlJSON[widgetKey], edlFileName);
                for (let widgetTdl of symbolTdl) {
                    const widgetKey = widgetTdl["widgetKey"];
                    tdl[widgetKey] = widgetTdl;
                }
            } else if (widgetKey.includes("Embedded Window")) {
                tdl[widgetKey] = EmbeddedDisplayHelper.convertEdlToTdl(edlJSON[widgetKey], convertEdlSufffix);
            } else {
                Log.error("-1", "Unknown widget key", widgetKey);
            }
        }
        if (!inGroup) {
            this.combinActionButtons(tdl);
        }
    };

    static combinActionButtons = (tdl: Record<string, any>) => {
        const indices: number[] = [];
        for (let ii = 0; ii < Object.values(tdl).length; ii++) {
            const widgetTdl = Object.values(tdl)[ii];
            if (
                widgetTdl["widgetKey"].includes("ActionButton") &&
                (typeof widgetTdl["text"]["swapButtons"] === "boolean" || typeof widgetTdl["text"]["button3Popup"] === "boolean")
            ) {
                indices.push(ii);
            }
        }

        let toBeDeletedIndices: number[] = [];

        for (let ii = indices.length - 1; ii >= 0; ii--) {
            if (toBeDeletedIndices.includes(indices[ii])) {
                // already to be deleted, skip it
                continue;
            }

            const index = indices[ii];
            const widgetTdl = Object.values(tdl)[index];

            const left1 = widgetTdl["style"]["left"];
            const right1 = left1 + widgetTdl["style"]["width"];
            const top1 = widgetTdl["style"]["top"];
            const bottom1 = top1 + widgetTdl["style"]["height"];
            const swapButtons1 = widgetTdl["text"]["swapButtons"] || widgetTdl["text"]["button3Popup"];
            // ActionButtonWidgetTdl = widgetTdl;
            const toBeDeletedIndex = this.combinActionButtons2(tdl, indices, ii, left1, right1, top1, bottom1, swapButtons1, toBeDeletedIndices);
            // console.log("to be deleted", toBeDeletedIndex);
            if (toBeDeletedIndex !== -1) {
                toBeDeletedIndices.push(toBeDeletedIndex);
            }
        }

        toBeDeletedIndices.sort(function (a, b) {
            return a - b;
        });
        for (let ii = toBeDeletedIndices.length - 1; ii >= 0; ii--) {
            const toBeDeletedIndex = toBeDeletedIndices[ii];
            delete tdl[Object.keys(tdl)[toBeDeletedIndex]];
        }
    };

    static combinActionButtons2 = (
        tdl: Record<string, any>,
        indices: number[],
        ii: number,
        left1: number,
        right1: number,
        top1: number,
        bottom1: number,
        swapButtons1: boolean,
        toBeDeletedIndices: number[]
    ) => {
        for (let jj = ii - 1; jj >= 0; jj--) {
            const index = indices[jj];
            const widgetTdl2 = Object.values(tdl)[index];

            const left2 = widgetTdl2["style"]["left"];
            const right2 = left2 + widgetTdl2["style"]["width"];
            const top2 = widgetTdl2["style"]["top"];
            const bottom2 = top2 + widgetTdl2["style"]["height"];
            const swapButtons2 = widgetTdl2["text"]["swapButtons"] || widgetTdl2["text"]["button3Popup"];

            // determine overlap: >= 3 pixels

            const width1 = Math.abs(right1 - left1);
            const width2 = Math.abs(right2 - left2);
            const width0 = Math.max(left1, left2, right1, right2) - Math.min(left1, left2, right1, right2);
            const height1 = Math.abs(top1 - bottom1);
            const height2 = Math.abs(top2 - bottom2);
            const height0 = Math.max(bottom1, top1, bottom2, top2) - Math.min(bottom1, top1, bottom2, top2);

            let overlap = false;
            if (width0 + 2 < width1 + width2 && height0 + 2 < height1 + height2) {
                overlap = true;
            }

            if (
                // !((right2 < left1 && left2 < left1) || (right2 > right1 && left2 > right1)) &&
                // !((bottom2 < top1 && top2 < top1) || (bottom2 > bottom1 && top2 > bottom1)) &&
                overlap &&
                swapButtons2 !== swapButtons1 &&
                !toBeDeletedIndices.includes(index)
            ) {
                // overlap
                const widgetTdl1 = Object.values(tdl)[indices[ii]];
                widgetTdl1["actions"].push(...widgetTdl2["actions"]);
                widgetTdl2["actions"].length = 0;
                // in case the top widget is invisible but the bottom widget is visible
                if (widgetTdl2["text"]["invisibleInOperation"] === false) {
                    widgetTdl1["text"]["invisibleInOperation"] = false;
                }
                // delete tdl[Object.keys(tdl)[ii]];
                return index;
            }
        }
        return -1;
    };

    static convertEdlGroup = (
        edlJSON: Record<string, any>,
        tdl: Record<string, any>,
        groupName: string,
        edlFileName: string | undefined = undefined,
        convertEdlSuffix: boolean = false
    ) => {
        const startingIndex = Object.keys(tdl).length;
        const groupVisibilityRules = edlJSON["GroupVisibilityRules"];
        EdlConverter.parseEdl(edlJSON, tdl, true, edlFileName, convertEdlSuffix);
        const endingIndex = Object.keys(tdl).length;
        const widgetTdls = Object.values(tdl);
        // push the group visibility rules to all widgets inside this group, including the widgets
        // inside the subgroups
        for (let ii = startingIndex; ii < endingIndex; ii++) {
            const widgetTdl = widgetTdls[ii];
            widgetTdl["groupNames"].push(groupName);
            widgetTdl["rules"].push(...groupVisibilityRules);
        }
        Log.debug("-1", "group ends");
    };

    static readArray = (startingLine: number, fileLines: string[]) => {
        let ii = startingLine;
        const array: string[] = [];
        while (true) {
            const line = fileLines[ii].trim();
            if (line === "") {
                ii++;
                continue;
            } else if (line === "}") {
                return {
                    array: array,
                    endingLine: ii,
                };
            }

            array.push(line);
            ii++;
        }
    };

    static readWidget = (startingLine: number, fileLines: string[]) => {
        const widgetJSON: Record<string, any> = {};
        // let widgetType = "";
        // let widgetTdl: Record<string, string | string[]> = {};
        let ii = startingLine + 1;
        while (true) {
            const line = fileLines[ii].trim();

            if (line === "endObjectProperties" || line === "endScreenProperties") {
                return {
                    widgetJSON: widgetJSON,
                    endingLine: ii,
                };
            }

            const lineArray = line.split(" ");
            const propertyName = lineArray[0];
            lineArray.splice(0, 1);
            let propertyValue: string | string[] = lineArray.join(" ");

            // special property value type
            if (propertyValue === "") {
                // boolean
                propertyValue = "true";
            } else if (propertyValue === "{") {
                // array
                ii++;
                const { array, endingLine } = this.readArray(ii, fileLines);
                ii = endingLine;
                propertyValue = array;
            }

            ii++;
            widgetJSON[propertyName] = propertyValue;
        }
    };

    static readGroup = (startingLine: number, fileLines: string[]) => {
        let ii = startingLine + 1;
        let groupStartingLine = -1;
        let groupEndingLine = -1;
        let endingLine = -1;
        let tmp = false;
        let result: Record<string, any> = {};
        let groupVisibilityRules: Record<string, any>[] = [];
        while (true) {
            const line = fileLines[ii].trim();
            if (line === "beginGroup") {
                if (tmp === false) {
                    tmp = true;
                    groupStartingLine = ii + 1;
                }
            } else if (line === "endGroup") {
                groupEndingLine = ii + 1;
            } else if (line == "endObjectProperties" && groupEndingLine !== -1) {
                endingLine = ii;
                break;
            } else if (/^# \(.*\)$/.test(line)) {
                const widgetType = line.substring(3, line.length - 1);
                if (widgetType === "Group") {
                    // read non-subgroup part before this subgroup
                    const partialResult = this.convertEdltoJSON(fileLines, groupStartingLine, ii);
                    result = { ...result, ...partialResult };
                    // read subgroup
                    const { widgetJSON, endingLine } = this.readGroup(ii + 1, fileLines);
                    const subGroupWidgetId = `Group_${uuidv4()}`;
                    result[subGroupWidgetId] = widgetJSON;
                    // reset the starting line and ii
                    ii = endingLine;
                    groupStartingLine = endingLine + 1;
                }
            }
            ii++;
        }
        // read the regular widgets inside this group, or the rest of the widgets after the last subgroup
        const partialResult = this.convertEdltoJSON(fileLines, groupStartingLine, groupEndingLine);
        result = { ...result, ...partialResult };
        // calculate the visibility rules of the group
        groupVisibilityRules = [...groupVisibilityRules, ...this.readGroupVisibilityRules(groupEndingLine + 1, endingLine, fileLines)];

        return {
            widgetJSON: { ...result, GroupVisibilityRules: groupVisibilityRules },
            endingLine: endingLine,
        };
    };


    static readGroupVisibilityRules = (startingLine: number, endingLine: number, fileLines: string[]) => {
        let visPv = "";
        let visMin: string | undefined = undefined;
        let visMax: string | undefined = undefined;
        let visInvert: string | undefined = undefined;
        for (let ii = startingLine; ii < endingLine; ii++) {
            const line = fileLines[ii];
            if (line.trim() === "") {
                continue;
            }
            let propertyName = "";
            let propertyValue = "";
            const lineArray = line.split(" ");
            const propertyNameRaw = lineArray[0];
            const propertyValueRaw = lineArray.splice(1, lineArray.length).join(" ");
            if (propertyNameRaw !== undefined) {
                propertyName = propertyNameRaw.replaceAll(`"`, "").trim();
            }
            if (propertyValueRaw !== undefined) {
                propertyValue = propertyValueRaw.replaceAll(`"`, "").trim();
            }
            if (propertyName === "visPv") {
                visPv = EdlConverter.convertEdlPv(propertyValue, true);
            } else if (propertyName === "visMin") {
                visMin = propertyValue;
            } else if (propertyName === "visMax") {
                visMax = propertyValue;
            } else if (propertyName === "visInvert") {
                visInvert = "true";
            }
        }

        if (visPv !== "") {
            return this.convertEdlVisPv(visPv, visMin, visMax, visInvert, false, true);
        } else {
            return [];
        }
    };

    static convertEdltoJSON = (fileLines: string[], startingLine: number, endingLine: number = -1) => {
        const edlJSON: Record<string, any> = {};
        let widgetKey = "";
        if (endingLine === -1) {
            endingLine = fileLines.length;
        }

        for (let ii = startingLine; ii < endingLine; ii++) {
            const line = fileLines[ii].trim();
            if (line === "") {
                continue;
            }

            if (line === "beginScreenProperties") {
                // start of screen properties
                widgetKey = "ScreenProperties";
                const { widgetJSON, endingLine } = this.readWidget(ii, fileLines);
                edlJSON[widgetKey] = widgetJSON;
                ii = endingLine;
            } else if (/^# \(.*\)$/.test(line)) {
                // # (Text Monitor)
                const widgetType = line.substring(3, line.length - 1);
                if (widgetType === "Group") {
                    widgetKey = `${line.substring(3, line.length - 1)}_${uuidv4()}`;
                    const { widgetJSON, endingLine } = this.readGroup(ii, fileLines);
                    edlJSON[widgetKey] = widgetJSON;
                    ii = endingLine;
                } else if (widgetType === "Button") {
                    const { widgetJSON, endingLine } = this.readWidget(ii, fileLines);

                    if (widgetJSON["indicatorPv"] !== undefined) {
                        // create an additional LED widget in edlJSON if the indicatorPv exists for edl Button
                        // edl does not have a native LED widget
                        widgetKey = `LED_${uuidv4()}`;
                        edlJSON[widgetKey] = JSON.parse(JSON.stringify(widgetJSON));
                        widgetJSON["invisible"] = "true"; // hide the next BooleanButton widget
                    }

                    widgetKey = `${line.substring(3, line.length - 1)}_${uuidv4()}`;
                    edlJSON[widgetKey] = widgetJSON;

                    ii = endingLine;

                } else {
                    widgetKey = `${line.substring(3, line.length - 1)}_${uuidv4()}`;
                    const { widgetJSON, endingLine } = this.readWidget(ii, fileLines);
                    edlJSON[widgetKey] = widgetJSON;
                    ii = endingLine;
                }
            }
        }

        return edlJSON;
    };

    // ------------------------------------- colors -----------------------------------------

    // SNS color map, 8 bit
    static colorMap256: Record<string, number[]> = {
        "0": [255, 255, 255],
        "1": [236, 236, 236],
        "2": [218, 218, 218],
        "3": [200, 200, 200],
        "4": [187, 187, 187],
        "5": [174, 174, 174],
        "6": [158, 158, 158],
        "7": [145, 145, 145],
        "8": [133, 133, 133],
        "9": [120, 120, 120],
        "10": [105, 105, 105],
        "11": [90, 90, 90],
        "12": [70, 70, 70],
        "13": [45, 45, 45],
        "14": [0, 0, 0],
        "15": [0, 255, 0],
        "16": [0, 224, 0],
        "17": [0, 192, 0],
        "18": [0, 160, 0],
        "19": [0, 128, 0],
        "20": [255, 0, 0],
        "21": [224, 0, 0],
        "22": [192, 0, 0],
        "23": [160, 0, 0],
        "24": [128, 0, 0],
        "25": [0, 0, 255],
        "26": [0, 0, 224],
        "27": [0, 0, 192],
        "28": [0, 0, 160],
        "29": [0, 0, 128],
        "30": [0, 255, 255],
        "31": [0, 224, 224],
        "32": [0, 192, 192],
        "33": [0, 160, 160],
        "34": [0, 128, 128],
        "35": [255, 255, 0],
        "36": [224, 224, 0],
        "37": [192, 192, 0],
        "38": [160, 160, 0],
        "39": [128, 128, 0],
        "40": [255, 176, 96],
        "41": [224, 154, 84],
        "42": [192, 132, 72],
        "43": [160, 110, 60],
        "44": [128, 88, 48],
        "45": [255, 0, 255],
        "46": [192, 0, 192],
        "47": [128, 0, 128],
        "48": [45, 45, 45],
        "49": [218, 218, 218],
        "50": [205, 219, 204],
        "51": [184, 197, 183],
        "52": [165, 177, 164],
        "53": [224, 247, 176],
        "54": [201, 222, 158],
        "55": [244, 218, 168],
        "56": [183, 164, 126],
        "57": [122, 109, 84],
        "58": [180, 248, 214],
        "59": [161, 223, 192],
        "60": [193, 217, 216],
        "61": [173, 195, 194],
        "62": [155, 175, 174],
        "63": [175, 217, 248],
        "64": [157, 195, 223],
        "65": [204, 201, 220],
        "66": [183, 180, 197],
        "67": [164, 161, 177],
        "68": [221, 195, 250],
        "69": [198, 175, 224],
        "70": [220, 201, 220],
        "71": [197, 180, 197],
        "72": [177, 161, 177],
        "73": [250, 234, 235],
        "74": [224, 175, 211],
        "75": [255, 150, 168],
        "76": [192, 113, 126],
        "77": [128, 75, 84],
        "78": [254, 142, 0],
        "79": [254, 142, 0],
        "107": [236, 236, 236],
        "108": [145, 145, 145],
        "109": [90, 90, 90],
        "110": [70, 70, 70],
        "111": [45, 45, 45],
        "112": [0, 0, 0],
        "113": [0, 224, 0],
        "114": [0, 160, 0],
        "115": [0, 128, 0],
        "116": [224, 0, 0],
        "117": [160, 0, 0],
        "118": [128, 0, 0],
        "119": [0, 0, 224],
        "120": [0, 0, 192],
        "121": [0, 0, 160],
        "122": [0, 0, 128],
        "123": [224, 224, 0],
        "124": [160, 160, 0],
        "125": [128, 128, 0],
        "126": [255, 0, 0],
        "127": [192, 0, 0],
        "128": [0, 255, 0],
        "129": [0, 192, 0],
        "130": [0, 0, 255],
        "131": [255, 255, 0],
        "132": [192, 192, 0],
        "133": [255, 255, 255],
        "134": [158, 158, 158],
        "135": [105, 105, 105],
        "136": [255, 0, 0],
        "140": [0, 255, 0],
        "142": [192, 0, 192],
        "160": [0, 0, 255],
        "164": [255, 255, 0],
    };

    static colorMap256B: Record<string, number[]> = {
        "Disconn/Invalid": [255, 255, 255],
        "Top Shadow": [236, 236, 236],
        "grey-1": [236, 236, 236],
        "grey-2": [218, 218, 218],
        "GLOBAL canvas": [200, 200, 200],
        "grey-4": [187, 187, 187],
        "Wid-alt/Anno-sec": [174, 174, 174],
        "GLOBAL title": [158, 158, 158],
        x2: [145, 145, 145],
        "GLOBAL help": [120, 120, 120],
        "Wid-bg/Anno-pri": [105, 105, 105],
        "Bottom Shadow": [90, 90, 90],
        "grey-6": [70, 70, 70],
        x4: [45, 45, 45],
        black: [0, 0, 0],
        "Monitor: NORMAL": [0, 255, 0],
        "green-1": [0, 224, 0],
        "Monitor: alt": [0, 192, 0],
        "green-3": [0, 160, 0],
        "green-4": [0, 128, 0],
        "Monitor: MAJOR": [255, 0, 0],
        "red-1": [224, 0, 0],
        "Mon: MAJOR/unack": [192, 0, 0],
        "red-3": [160, 0, 0],
        "red-4": [128, 0, 0],
        Controller: [0, 0, 255],
        "blue-1": [0, 0, 224],
        "blue-2": [0, 0, 192],
        "blue-3": [0, 0, 160],
        "blue-4": [0, 0, 128],
        "Controller/alt": [0, 255, 255],
        "cyan-31": [0, 224, 224],
        "cyan-32": [0, 192, 192],
        "cyan-33": [0, 160, 160],
        "cyan-34": [0, 128, 128],
        "Monitor: MINOR": [255, 255, 0],
        "yellow-1": [224, 224, 0],
        "Mon: MINOR/unack": [192, 192, 0],
        "yellow-3": [160, 160, 0],
        "yellow-4": [128, 128, 0],
        "Shell/reldsp-alt": [255, 176, 96],
        "orange-41": [224, 154, 84],
        "orange-42": [192, 132, 72],
        "brown-43": [160, 110, 60],
        "Related display": [128, 88, 48],
        "Exit/Quit/Kill": [255, 0, 255],
        "purple-46": [192, 0, 192],
        "purple-47": [128, 0, 128],
        "wid-fg-neu": [45, 45, 45],
        "wid-bg-neu": [218, 218, 218],
        "LINAC canvas": [205, 219, 204],
        "LINAC title": [184, 197, 183],
        "LINAC help": [165, 177, 164],
        "VAC title": [224, 247, 176],
        "VAC help": [201, 222, 158],
        "FE canvas": [244, 218, 168],
        "FE title": [183, 164, 126],
        "FE help": [122, 109, 84],
        "COOL title": [180, 248, 214],
        "COOL help": [161, 223, 192],
        "RING canvas": [193, 217, 216],
        "RING title": [173, 195, 194],
        "RING help": [155, 175, 174],
        "CRYO title": [175, 217, 248],
        "CRYO help": [157, 195, 223],
        "TARGET canvas": [204, 201, 220],
        "TARGET title": [183, 180, 197],
        "TARGET help": [164, 161, 177],
        "RF title": [221, 195, 250],
        "RF help": [198, 175, 224],
        "CF canvas": [220, 201, 220],
        "CF title": [197, 180, 197],
        "CF help": [177, 161, 177],
        "UNSS title": [250, 234, 235],
        "UNSS help": [224, 175, 211],
        "UNMS canvas": [255, 150, 168],
        "UNMS title": [192, 113, 126],
        "UNMS help": [128, 75, 84],
        red: [255, 0, 0],
        "red-2": [192, 0, 0],
        green: [0, 255, 0],
        "green-2": [0, 192, 0],
        blue: [0, 0, 255],
        yellow: [255, 255, 0],
        "yellow-2": [192, 192, 0],
        white: [255, 255, 255],
        "grey-3": [158, 158, 158],
        "grey-5": [105, 105, 105],
        "grey-7": [145, 145, 145],
        "grey-8": [133, 133, 133],
        "grey-11": [90, 90, 90],
        "grey-12": [70, 70, 70],
        "grey-13": [45, 45, 45],
        "black-14": [0, 0, 0],
        "green-16": [0, 224, 0],
        "green-18": [0, 160, 0],
        "green-19": [0, 128, 0],
        "red-21": [224, 0, 0],
        "red-23": [160, 0, 0],
        "red-24": [128, 0, 0],
        "blue-26": [0, 0, 224],
        "blue-27": [0, 0, 192],
        "blue-28": [0, 0, 160],
        "blue-29": [0, 0, 128],
        "yellow-36": [224, 224, 0],
        "yellow-38": [160, 160, 0],
        "yellow-39": [128, 128, 0],
        "brt-orange": [254, 142, 0],
        "blinking orange": [254, 142, 0],
        "blinking red": [255, 0, 0],
        "blinking green": [0, 255, 0],
        "blinking purple": [192, 0, 192],
        "blinking blue": [0, 0, 255],
        "blinking yellow": [255, 255, 0],
    };
    /**
     * Ruled-colors at SNS EDM
     */
    static ruledColors: Record<string, Record<string, [number, number, number]>> = {
        "80": {
            "$channel     >=-0.5 and $channel  <0.5 ": [0, 255, 0],
            "$channel     >=0.5  and $channel  <1.5 ": [255, 255, 0],
            "$channel     >=1.5  and $channel  <=2.5 ": [255, 0, 0],
            "$channel     >2.5  ": [128, 0, 128],
        },
        "81": {
            "$channel     >=-0.5 and $channel  <0.5 ": [128, 0, 0],
            "$channel     >=0.5  and $channel  <=1.5 ": [255, 0, 0],
        },
        "82": {
            "$channel     >=-0.5 and $channel  <0.5 ": [0, 128, 0],
            "$channel     >=0.5  and $channel  <=1.5 ": [0, 255, 0],
        },
        "83": {
            "$channel     >=-0.5 and $channel  <0.5 ": [255, 0, 0],
            "$channel     >=0.5  and $channel  <=1.5 ": [0, 255, 0],
        },
        "84": {
            "$channel     >=-0.5 and $channel  <0.5 ": [0, 255, 0],
            "$channel     >=0.5  and $channel  <=1.5 ": [255, 0, 0],
        },
        "85": {
            "$channel     >=-0.5 and $channel  <0.5 ": [183, 164, 126],
            "$channel     >=0.5  and $channel  <=1.5 ": [0, 255, 0],
        },
        "86": {
            "$channel     >=-0.5 and $channel  <0.5 ": [0, 255, 0],
            "$channel     >=0.5  and $channel  <=1.5 ": [183, 164, 126],
        },
        "87": {
            "$channel     >=-0.5 and $channel  <0.5  ": [183, 164, 126],
            "$channel     >=1.5  and $channel  <2.5  ": [255, 255, 0],
            "$channel     >=2.5  and $channel  <=3.5 ": [0, 255, 0],
        },
        "88": {
            "$channel     >=-0.5 and $channel  <0.5 ": [255, 255, 0],
            "$channel     >=0.5  and $channel  <1.5 ": [183, 164, 126],
            "$channel     >=1.5  and $channel  <2.5 ": [0, 255, 0],
            "$channel     >=2.5  and $channel  <=3.5 ": [255, 0, 0],
        },
        "89": {
            "$channel     >=-0.5 and $channel  <0.5 ": [255, 255, 0],
            "$channel     >=0.5  and $channel  <1.5 ": [0, 255, 0],
            "$channel     >=1.5  and $channel  <2.5 ": [183, 164, 126],
            "$channel     >=2.5  and $channel  <=3.5 ": [255, 0, 0],
        },
        "90": {
            "$channel     >=-0.5 and $channel  <0.5 ": [255, 255, 0],
            "$channel     >=0.5  and $channel  <1.5 ": [174, 174, 174],
            "$channel     >=1.5  and $channel  <2.5 ": [0, 255, 0],
            "$channel     >=2.5  and $channel  <=3.5 ": [255, 0, 0],
        },
        "91": {
            "$channel     >=-0.5 and $channel  <0.5 ": [174, 174, 174],
            "$channel     >=0.5  and $channel  <1.5 ": [255, 0, 0],
            "$channel     >=1.5  and $channel  <2.5 ": [0, 255, 0],
            "$channel     >=2.5  and $channel  <=3.5 ": [255, 255, 0],
        },
        "92": {
            "$channel     >=-0.5 and $channel  <0.5 ": [174, 174, 174],
            "$channel     >=0.5  and $channel  <=1.5 ": [0, 255, 0],
        },
        "93": {
            "$channel     >=-0.5 and $channel  <0.5 ": [174, 174, 174],
            "$channel     >=0.5  and $channel  <1.5 ": [255, 0, 0],
            "$channel     >=1.5  and $channel  <=2.5 ": [0, 255, 0],
        },
        "94": {
            "$channel     >=-0.5 and $channel  <0.5 ": [255, 0, 0],
            "$channel     >=0.5  and $channel  <1.5 ": [255, 255, 0],
            "$channel     >=1.5  and $channel  <=2.5 ": [0, 255, 0],
        },
        "95": {
            "$channel     >=-0.5 and $channel  <0.5 ": [255, 0, 0],
            "$channel     >=0.5  and $channel  <1.5 ": [255, 255, 0],
            "$channel     >=1.5  and $channel  <2.5 ": [0, 255, 0],
            "$channel     >=2.5  and $channel  <=3.5 ": [0, 0, 255],
        },
        "96": {
            "$channel     >=-0.5 and $channel  <0.5 ": [255, 0, 0],
            "$channel     >=0.5  and $channel  <1.5  ": [255, 176, 96],
            "$channel     >=1.5  and $channel  <2.5 ": [255, 255, 0],
            "$channel     >=2.5  and $channel  <3.5 ": [0, 255, 0],
            "$channel     >=3.5  and $channel  <=4.5 ": [0, 0, 255],
        },
        "97": {
            "$channel     >=-0.5 and $channel  <0.5 ": [255, 0, 0],
            "$channel     >=0.5  and $channel  <1.5  ": [255, 176, 96],
            "$channel     >=1.5  and $channel  <2.5 ": [255, 255, 0],
            "$channel     >=2.5  and $channel  <3.5 ": [0, 255, 0],
            "$channel     >=3.5  and $channel  <4.5  ": [0, 0, 255],
            "$channel     >=4.5  and $channel  <=5.5 ": [255, 0, 255],
        },
        "98": {
            "$channel     >=-0.5 and $channel  <0.5 ": [0, 255, 0],
            "$channel     >=1.5  and $channel  <=2.5 ": [0, 128, 0],
        },
        "99": {
            "$channel     >=1.5  and $channel  <=2.5 ": [160, 110, 60],
            "$channel     >=0.5  and $channel  <1.5  ": [255, 176, 96],
        },
        "100": {
            "$channel     >=0.5  and $channel  <1.5  ": [160, 0, 0],
            "$channel     >=1.5  and $channel  <=2.5 ": [255, 0, 0],
        },
        "101": {
            "$channel     >=-0.5 and $channel  <0.5 ": [174, 174, 174],
            "$channel     >=0.5  and $channel  <=1.5 ": [0, 255, 0],
        },
        "102": {
            "$channel     >=-0.5 and $channel  <0.5 ": [174, 174, 174],
            "$channel     >=0.5  and $channel  <=1.5 ": [255, 255, 0],
        },
        "103": {
            "$channel     >=-0.5 and $channel  <0.5 ": [174, 174, 174],
            "$channel     >=0.5  and $channel  <=1.5 ": [255, 0, 0],
        },
        "104": {
            "$channel     >=-0.5 and $channel  <0.5 ": [0, 255, 0],
            "$channel     >=0.5  and $channel  <=1.5 ": [174, 174, 174],
        },
        "105": {
            "$channel     >=-0.5 and $channel  <0.5 ": [255, 255, 0],
            "$channel     >=0.5  and $channel  <=1.5 ": [174, 174, 174],
        },
        "106": {
            "$channel     >=-0.5 and $channel  <0.5 ": [255, 0, 0],
            "$channel     >=0.5  and $channel  <=1.5 ": [174, 174, 174],
        },
        "137": {
            "$channel      >=-0.5 and $channel  <0.5     ": [174, 174, 174],
            "$channel      >=0.5  and $channel  <=1.5    ": [255, 0, 0],
        },
        "138": {
            "$channel      >=-0.5 and $channel  <0.5    ": [255, 255, 0],
            "$channel      >=0.5  and $channel  <1.5    ": [0, 255, 0],
        },
        "139": {
            "$channel      >=-0.5 and $channel  <0.5     ": [0, 255, 0],
            "$channel      >=0.5  and $channel  <=1.5    ": [255, 0, 0],
        },
        "141": {
            "$channel      >=-0.5 and $channel  <0.5     ": [174, 174, 174],
            "$channel      >=0.5  and $channel  <=1.5    ": [0, 255, 0],
        },
        "143": {
            "$channel      >=-0.5 and $channel  <0.5     ": [255, 150, 168],
            "$channel      >=0.5  and $channel  <=1.5    ": [192, 0, 192],
        },
        "144": {
            "$channel     >=-0.5 and $channel  <0.5 ": [255, 0, 0],
            "$channel     >=0.5  and $channel  <=1.5 ": [0, 255, 0],
            "$channel     >=1.5  and $channel  <2.5 ": [255, 255, 0],
        },
        "145": {
            "$channel     >=-0.5 and $channel  <0.5 ": [174, 174, 174],
            "$channel     >=0.5  and $channel  <1.5 ": [255, 0, 0],
            "$channel     >=1.5  and $channel  <2.5 ": [0, 255, 0],
            "$channel     >=2.5  and $channel  <=3.5 ": [224, 175, 211],
            "$channel     >=3.5  and $channel  <=4.5 ": [0, 224, 224],
        },
        "146": {
            "$channel     >=-0.5 and $channel  <0.5 ": [255, 0, 0],
            "$channel     >=0.5  and $channel  <=1.5 ": [0, 255, 0],
        },
        "147": {
            "$channel     >=-0.5 and $channel  <0.5        ": [0, 0, 0],
            "$channel     >=0.5  and $channel  <1.5        ": [254, 142, 0],
            "$channel     >=1.5  and $channel  <2.5        ": [254, 142, 0],
            "$channel     >=2.5  and $channel  <3.5        ": [192, 132, 72],
        },
        "148": {
            "$channel     =1 ": [255, 255, 0],
            // "$channel     default ": [0, 0, 0],
            "$channel  != 1": [0, 0, 0],
        },
        "149": {
            "$channel     =1 ": [255, 0, 0],
            // "$channel     default ": [0, 255, 0],
            "$channel  != 1 ": [0, 255, 0],
        },
        "150": {
            "$channel     =0 ": [0, 255, 0],
            // "$channel     default ": [174, 174, 174],
            "$channel != 0 ": [174, 174, 174],
        },
        "151": {
            "$channel     =1 ": [0, 255, 0],
            // "$channel     default ": [174, 174, 174],
            "$channel != 1 ": [174, 174, 174],
        },
        "152": {
            "$channel     =2 ": [0, 255, 0],
            // "$channel     default ": [174, 174, 174],
            "$channel != 2 ": [174, 174, 174],
        },
        "153": {
            "$channel     =3 ": [0, 255, 0],
            // "$channel     default ": [174, 174, 174],
            "$channel != 3 ": [174, 174, 174],
        },
        "154": {
            "$channel     >=-0.5 and $channel  <0.5 ": [255, 0, 0],
            "$channel     >=0.5  and $channel  <=1.5 ": [0, 255, 0],
        },
        "155": {
            "$channel     >=-0.5 and $channel  <0.5 ": [255, 255, 0],
            "$channel     >=0.5  and $channel  <=1.5 ": [0, 255, 0],
        },
        "156": {
            "$channel     >=-0.5 and $channel  <0.5 ": [174, 174, 174],
            "$channel     >=0.5  and $channel  <=1.5 ": [0, 255, 0],
        },
        "157": {
            "$channel     >=-0.5 and $channel  <0.5 ": [174, 174, 174],
            "$channel     >=0.5  and $channel  <=1.5 ": [255, 0, 0],
        },
        "158": {
            "$channel     >=-0.5 and $channel  <0.5 ": [174, 174, 174],
            "$channel     >=0.5  and $channel  <=1.5 ": [255, 255, 0],
        },
        "159": {
            "$channel     >=-0.5 and $channel  <0.5 ": [0, 255, 0],
            "$channel     >=0.5  and $channel  <=1.5 ": [255, 0, 0],
        },
        "161": {
            "$channel      >=-0.5 and $channel  <0.5     ": [174, 174, 174],
            "$channel      >=0.5  and $channel  <=1.5    ": [0, 0, 255],
        },
        "162": {
            "$channel      >=-0.5 and $channel  <0.5    ": [0, 255, 0],
            "$channel      >=0.5  and $channel  <1.5    ": [255, 255, 0],
        },
        "163": {
            "$channel      >=-0.5 and $channel  <0.5     ": [255, 255, 255],
            "$channel      >=0.5  and $channel  <1.5     ": [255, 255, 0],
            "$channel      >=1.5  and $channel  <2.5     ": [255, 0, 0],
            "$channel      >=2.5  and $channel  <3.5     ": [0, 255, 0],
        },
        "165": {
            "$channel      >=-0.5 and $channel  <0.5    ": [236, 236, 236],
            "$channel      >=0.5  and $channel  <1.5    ": [0, 0, 0],
        },
        "166": {
            "$channel     >=-0.5 and $channel  <0.5 ": [0, 255, 0],
            "$channel     >=0.5  and $channel  <1.5 ": [255, 255, 0],
            "$channel     >5.5  ": [255, 0, 0],
            "$channel     >=2.5 and $channel  <3.5 ": [255, 255, 255],
            "$channel     >=3.5  and $channel  <4.5 ": [158, 158, 158],
            "$channel     >=4.5  and $channel  <=5.5 ": [70, 70, 70],
        },
        "167": {
            "$channel     >=-0.5 and $channel  <0.5 ": [0, 255, 0],
            "$channel     >=0.5  and $channel  <1.5 ": [224, 175, 211],
            "$channel     >=1.5  and $channel  <2.5 ": [255, 0, 0],
            "$channel     >=2.5  and $channel  <=3.5 ": [174, 174, 174],
        },
        "168": {
            "$channel     >=0.5 and $channel  <1.5 ": [0, 255, 0],
            "$channel     >=1.5 and $channel  <2.5 ": [255, 255, 0],
            "$channel     >=2.5 and $channel  <=3.5  ": [255, 0, 0],
        },
    };

    static isRuledColor = (indexStr: string) => {
        if (Object.keys(this.ruledColors).includes(indexStr)) {
            return true;
        } else {
            return false;
        }
    };

    static getDefaultColorStrOfRuledColor = (indexStr: string) => {
        const dynamicColorRule = this.ruledColors[indexStr];
        if (dynamicColorRule !== undefined) {
            const rgbaArray = Object.values(dynamicColorRule)[0];
            if (rgbaArray !== undefined) {
                return rgbaArrayToRgbaStr([...rgbaArray, 100]);
            } else {
                return `rgba(0,0,0,1)`;
            }
        } else {
            return `rgba(0,0,0,1)`;
        }
    };

    /**
     * Convert the edm color to rgba color. <br>
     *
     * If the input color is a ruled-color: if all last 3 input arguments are defined, the rules in ruled-color are honored,
     * several rules are created, the default color in the ruled-color is returned. <br>
     *
     * If the input color is a ruled-color: if any in the last 3 input argument are undefined, the rules in the ruled-color are not honored,
     * it only returns the default color in ruled-color, without creating any rule. <br>
     *
     * If the input color is a simple color, it returns the corresponding simply color, without creating any rule.
     *
     * @param {string}, color, the edm color, e.g. "index 167" <br>
     *
     * @param {string | undefined}, ctrlPv, if this is a ruled-color, the ctrlPv defines the bool expression
     *
     * @param {string | undefined}, tdlRulePropertyName, the property name in the TDM rule, e.g. "Background Color" or "Text Color" <br>
     *
     * @param {Record<string, any>}, tdl, the widget's tdl
     */

    static convertEdlColor = (
        color: string,
        controlPv: string | undefined = undefined,
        tdlRulePropertyName: string | undefined = undefined,
        tdl: Record<string, any> | undefined = undefined
    ) => {
        const indexStr = color.split(" ")[1].replaceAll(`"`, "").trim();
        if (indexStr === undefined) {
            Log.error("-1", "color", color, "format wrong");
            return `rgba(0, 0, 0, 1)`;
        } else {
            if (this.isRuledColor(indexStr)) {
                const defaultColorStr = this.getDefaultColorStrOfRuledColor(indexStr);
                if (controlPv !== undefined && controlPv !== "" && tdlRulePropertyName !== undefined && tdl !== undefined) {
                    // rules
                    const dynamicColorRules = this.ruledColors[indexStr];
                    for (let ii = 0; ii < Object.keys(dynamicColorRules).length; ii++) {
                        const boolExpression = Object.keys(dynamicColorRules)[ii].replaceAll("$channel", `${this.generatePvExpression(controlPv.replaceAll(`"`, ""))}`);
                        const rgbArray = Object.values(dynamicColorRules)[ii];
                        if (rgbArray !== undefined) {
                            const propertyValue = rgbaArrayToRgbaStr([...rgbArray, 100]);
                            tdl["rules"].push({
                                boolExpression: boolExpression,
                                propertyName: tdlRulePropertyName,
                                propertyValue: propertyValue,
                                id: uuidv4(),
                            });
                        } else {
                            // do not create a rule
                        }
                    }
                } else {
                    // do not create a rule
                }
                return defaultColorStr;
            } else {
                const rgbArray = this.colorMap256[indexStr];
                if (rgbArray !== undefined) {
                    // const index = indexStr;
                    return rgbaArrayToRgbaStr([...rgbArray, 100]);
                } else {
                    Log.error("-1", "Color index", indexStr, "not found");
                    return `rgba(0, 0, 0, 1)`;
                }
            }
        }
    };

    // -------------------------------- font --------------------------------------
    static fontFamilyMap: Record<string, string> = {
        courier: "Courier Prime",
        helvetica: "Inter",
    };
    static fontWeightMap: Record<string, string> = {
        bold: "bold",
        medium: "normal",
    };

    static fontStyleMap: Record<string, string> = {
        r: "normal",
        i: "italic",
    };
    // courier-bold-i-8.0
    // helvetica-medium-r-12.0
    static convertEdlFont = (propertyValue: string) => {
        const propertyValueArray = propertyValue.replaceAll(`"`, "").split("-");

        let fontFamily = "Inter";
        let fontSize = 14;
        let fontStyle = "normal";
        let fontWeight = "normal";

        const edlFontFamily = propertyValueArray[0];
        const edlFontWeight = propertyValueArray[1];
        const edlFontStyle = propertyValueArray[2];
        const edlFontSize = propertyValueArray[3];

        if (edlFontFamily !== undefined) {
            if (this.fontFamilyMap[edlFontFamily] !== undefined) {
                fontFamily = this.fontFamilyMap[edlFontFamily];
            }
        }

        if (edlFontWeight !== undefined) {
            if (this.fontWeightMap[edlFontWeight] !== undefined) {
                fontWeight = this.fontWeightMap[edlFontWeight];
            }
        }
        if (edlFontStyle !== undefined) {
            if (this.fontStyleMap[edlFontStyle] !== undefined) {
                fontStyle = this.fontStyleMap[edlFontStyle];
            }
        }

        if (edlFontSize !== undefined) {
            fontSize = parseInt(edlFontSize);
        }
        return {
            fontFamily: fontFamily,
            fontWeight: fontWeight,
            fontStyle: fontStyle,
            fontSize: fontSize,
        };
    };

    static convertEdlFontAlign = (propertyValue: string) => {
        propertyValue = propertyValue.replaceAll(`"`, "");
        if (propertyValue === "left") {
            return "flex-start";
        } else if (propertyValue === "center") {
            return "center";
        } else if (propertyValue === "right") {
            return "flex-end";
        } else {
            return "flex-start";
        }
    };

    static convertEdlBoolean = (propertyValue: string) => {
        if (propertyValue === "true") {
            return true;
        } else {
            return false;
        }
    };

    static generatePvExpression = (pv: string) => {
        if (pv.includes("[")) {
            return "(" + pv + ")";
        } else {
            return "[" + pv + "]";
        }
    }

    static generatePvUndefinedExpression = (propertyValue: string) => {
        const fullPv = this.convertEdlPv(propertyValue, true);
        console.log("full PV", fullPv, propertyValue)
        // real pvs
        const pvList = this.extractPvsFromFullPv(fullPv);
        console.log("  pv List", pvList)
        let result = "";
        for (let pv of pvList) {
            if (pv.replaceAll('"', "").trim() === "" || pv.startsWith(".") === true) {
                continue;
            }
            if (result === "") {
                result = result + `[${pv}] == undefined`
            } else {
                result = result + ` or [${pv}] == undefined`
            }
        }
        if (result.trim() === "") {
            return "true";
        } else {
            return result;
        }
    }

    static convertEdlPv = (propertyValue: string | undefined, fullPv: boolean = true, virtualPvWitInitValue: boolean = false) => {

        if (propertyValue === undefined) {
            return "";
        } else {
            // CALC\ and LOC\ cannot be used at the same time, it is OK to do like below
            return this.convertEdlCalcChannelName(
                this.convertEdlLocalChannelName(propertyValue.replaceAll(`"`, "").replaceAll("PROXY\\\\", ""), virtualPvWitInitValue),
                fullPv
            );
        }
    };

    static convertEdlCalcChannelName = (channelName: string, fullPv: boolean) => {
        if (channelName.replaceAll(`"`, "").replaceAll('"', "").startsWith("CALC\\")) {
            let newChannelName = channelName.replaceAll(`'`, "").replaceAll('"', "").replaceAll("\\", "");
            // get expression string
            const expression = newChannelName.match(/{(.*?)}/);
            // get the string that contains all variables
            const newChannelNameSplits = newChannelName.split("}");
            newChannelNameSplits.splice(0, 1);
            let variablesStr = newChannelNameSplits.join("}").trim();
            if (variablesStr.startsWith("(")) {
                variablesStr = variablesStr.replace("(", "");
            }
            if (variablesStr.endsWith(")")) {
                variablesStr = variablesStr.slice(0, -1);
            }

            if (expression !== null && variablesStr !== null) {
                // const variablesArray = variablesStr[1].replaceAll("(", "").replaceAll(")", "").split(",");
                const variablesArray = variablesStr.split(",");
                let result = "";
                const expression1 = expression[1].replaceAll("{", "").replaceAll("}", "");
                for (let ii = 0; ii < expression1.length; ii++) {
                    const charCode = expression1.charCodeAt(ii);
                    if (charCode >= 65 && charCode < 65 + variablesArray.length) {
                        let pv = variablesArray[charCode - 65].trim();
                        let isConstant = true;
                        for (let ii = 0; ii < pv.length; ii++) {
                            if ((pv.charCodeAt(ii) >= 48 && pv.charCodeAt(ii) < 58) || pv.charCodeAt(ii) === 46) {
                            } else {
                                isConstant = false;
                                break;
                            }
                        }
                        if (isConstant) {
                            result = `${result}${pv}`;
                        } else {
                            result = `${result}[${pv}]`;
                        }
                    } else {
                        result = `${result}${expression1.charAt(ii)}`;
                    }
                }
                if (fullPv) {
                    // replace standalone = to ==, but keep >=, <= and ==
                    return result.replaceAll("&&", " and ").replaceAll("!", " not ").replaceAll("||", " or ").replaceAll(/(?<![><=!])=(?![=>])/g, "==");
                } else {
                    let res = result.match(/\[(.*?)\]/g);
                    // use the last channel name if the fullPv is false
                    if (res !== null && res.length > 0) {
                        return res[res.length - 1].replaceAll("[", "").replaceAll("]", "");
                    } else {
                        return result;
                    }
                }
            }
        }
        return channelName;
    };
    /**
     * Extract pv names from a boolean expression string, e.g. "[val1] / 2 + [val2]" --> ["val1", "val2"]
     */
    static extractPvsFromFullPv = (fullPv: string): string[] => {
        if (!fullPv.includes("[")) {
            return [fullPv];
        } else {
            const result: string[] = [];
            let res = fullPv.match(/\[(.*?)\]/g);
            if (res !== null) {
                for (let ii = 0; ii < res.length; ii++) {
                    const item = res[ii];
                    result.push(item.replaceAll("[", "").replaceAll("]", ""));
                }
            }
            return result;
        }
    }
    // static extractLastPvFromFullPv = (fullPv: string): string => {
    //     const pvs = this.extractPvsFromFullPv(fullPv);
    //     if (pvs.length >= 0) {
    //         return pvs[pvs.length - 1];
    //     } else {
    //         return "";
    //     }
    // }

    /**
     * LOC\$(!CCL)BLMWindow=i:0 -> LOC\CCLBLMWindow=i:0
     */
    static replaceLocalChannelMacro = (str: string) => {
        const macroMatch = str.match(/\$\(\!([a-zA-Z:0-9]+)\)/);
        if (macroMatch !== null) {
            const macro = macroMatch[1];
            if (macro !== undefined) {
                const expandedStr = str.replace(/\$\(\!([a-zA-Z:0-9_-]+)\)/, macro);
                return expandedStr;
            }
        }
        return str;
    }

    static convertEdlLocalChannelName = (channelName: string, virtualPvWitInitValue: boolean) => {
        if (channelName.replaceAll(`"`, "").replaceAll('"', "").startsWith("LOC\\")) {
            let newChannelName = channelName
                .replaceAll(`"`, "")
                .replaceAll('"', "")
                .replace("$(!W)", "$(DID)") // window-wide local pv
                .replace("$(!A)", "") // application-wide local pv
                .replace("$(!WZ)", "$(DID)")
                .replace("$(!Z)", "") // I don't know what is it
                .replace("$(!X)", "") // I don't know what is it
                .replace("$(!AZ)", "")
                .replace("$(!M)", "$(DID)")
                .replaceAll("\\x24\\x28\\x21[A-Z]{1}\\x29", "\\$(DID)")
                .replace("LOC\\\\", "loc://");
            newChannelName = this.replaceLocalChannelMacro(newChannelName);

            let newChannelNameArray = newChannelName.split("=");
            if (newChannelNameArray[1] !== undefined) {
                let part1 = newChannelNameArray[1].trim();
                if (part1.startsWith("s:")) {
                    part1 = part1.replace("s:", "<string>(");
                    part1 = `${part1})`;
                    // in case LOC\A=i:, which should be LOC\A=i:0
                    if (part1.endsWith("()")) {
                        part1 = part1.slice(0, part1.length - 1) + '"")';
                    }
                    // now part1 looks like <string>("") or <number>("ABC")
                    part1 = part1.replace(">(", '>="').replace("<string>", "").replace(")", '"');
                } else if (part1.startsWith("d:") || part1.startsWith("i:")) {
                    part1 = part1.replace("d:", "<number>(").replace("i:", "<number>(");
                    part1 = `${part1})`;
                    // in case LOC\A=i:, which should be LOC\A=i:0
                    if (part1.endsWith("()")) {
                        part1 = part1.slice(0, part1.length - 1) + "0)";
                    }
                    // now part1 looks like <number>(0) or <number>(3.7)
                    part1 = part1.replace(">(", ">=").replace("<number>", "").replace(")", "");
                } else if (part1.startsWith("e:")) {
                    part1 = part1.replace("e:", "<enum>(");
                    part1 = `${part1})`;
                    // now part1 looks like <enum>(0,zero,one,two) -> :["zero", "one", "two"] = 0
                    const part1Array = part1.split(",");
                    if (part1Array.length >= 2) {
                        part1 = `:[`;
                        for (let ii = 1; ii < part1Array.length; ii++) {
                            if (ii === part1Array.length - 1) {
                                part1 = part1 + '"' + part1Array[ii].replace(")", "") + '"';
                            } else {
                                part1 = part1 + '"' + part1Array[ii] + '"' + ",";
                            }
                        }
                        part1 = part1 + "] = ";
                        part1 = part1 + part1Array[0].replace("<enum>(", "");
                    }
                } else {
                    part1 = `(${part1})`;
                }
                newChannelNameArray[1] = part1;
            }
            let result = newChannelNameArray.join("");
            if (result.includes(`$(DID)`)) {
                result = result.replace(`$(DID)`, "");
                if (virtualPvWitInitValue === true) {
                    return result;
                } else {
                    const resultArray = result.split("=");
                    return resultArray[0].split(":[")[0];
                }
            } else {
                result = result.replace("loc://", "glb://");
                if (virtualPvWitInitValue === true) {
                    return result;
                } else {
                    const resultArray = result.split("=");
                    return resultArray[0].split(":[")[0];
                }
            }
        } else {
            return channelName;
        }
    };

    static convertEdlTextValue = (propertyValue: string[]) => {
        // convert SOH char to \n
        // convert "\\" to "\"
        return propertyValue.join("\n").replaceAll("\\\\", "__double_back_slashes__").replaceAll("\\", "").replaceAll(`"`, "").replace(/\x01/g, "\n").replaceAll("__double_back_slashes__", "\\");
    };

    static convertEdlLineStyle = (propertyValue: string) => {
        propertyValue = propertyValue.replaceAll(`"`, "");
        if (propertyValue === "dash") {
            return "dashed";
        } else {
            return "solid";
        }
    };

    static convertEdlEndian = (propertyValue: string) => {
        propertyValue = propertyValue.replaceAll(`"`, "");
        if (propertyValue === "little") {
            return "negative";
        } else {
            return "positive";
        }
    };

    static convertEdlArrows = (propertyValue: string) => {
        // [arrowTail, arrowHead]
        propertyValue = propertyValue.replaceAll(`"`, "");
        if (propertyValue === "from") {
            return [true, false];
        } else if (propertyValue === "to") {
            return [false, true];
        } else if (propertyValue === "both") {
            return [true, true];
        } else {
            return [false, false];
        }
    };

    // input: ["1 3.7", "2 5.5", "37 58"]
    static convertEdl2dArray = (propertyValue: string[]): [number[], number[]] => {
        const column1: number[] = [];
        const column2: number[] = [];
        try {
            for (let elementRowStr of propertyValue) {
                const elementRow = elementRowStr.split(" ");
                column1.push(parseFloat(elementRow[0]));
                column2.push(parseFloat(elementRow[1]));
            }
        } catch (e) {
            Log.error("-1", e);
            return [[], []];
        }
        return [column1, column2];
    };

    static convertEdlShellCommands = (labelsRaw: string[], commandsRaw: string[], convertEdlSuffix: boolean = true) => {
        const actions: Record<string, any>[] = [];
        for (let ii = 0; ii < labelsRaw.length; ii++) {
            const labelRaw = labelsRaw[ii];
            const commandRaw = commandsRaw[ii];
            const commandArray = commandRaw.split(" ");

            if (commandRaw.includes("StripTool ") && commandRaw.includes(".stp")) {
                // command to run StripTool to open a .stp file
                // should be converted to "open display"
                const action: Record<string, any> = { type: "OpenDisplay", externalMacros: [], useParentMacros: false, openInSameWindow: false };
                const labelArray = labelRaw.split(" ");
                labelArray.splice(0, 1);
                const label = labelArray.join(" ").replaceAll(`"`, "");
                action["label"] = label;
                // obtain .stp file name
                for (let item of commandArray) {
                    if (item.trim().replaceAll(`"`, "").endsWith(".stp")) {
                        if (convertEdlSuffix === true) {
                            action["fileName"] = item.trim().replaceAll(`"`, "").replace(".stp", ".tdl");
                        } else {
                            action["fileName"] = item.trim().replaceAll(`"`, "");
                        }

                        break;
                    }
                }
                actions.push(action);
            } else {
                // regular command
                const action: Record<string, any> = { type: "ExecuteCommand" };
                const labelArray = labelRaw.split(" ");
                labelArray.splice(0, 1);
                const label = labelArray.join(" ").replaceAll(`"`, "");
                commandArray.splice(0, 1);
                const command = commandArray.join(" ").replaceAll(`"`, "");
                action["label"] = label;
                action["command"] = command;
                actions.push(action);
            }
        }
        return actions;
    };

    static convertEdlExitButton = (exitProgramRaw: string | undefined) => {
        let quitTDM = false;

        if (exitProgramRaw !== undefined) {
            quitTDM = true;
        }

        const actions: Record<string, any>[] = [];
        const action: Record<string, any> = { type: "CloseDisplayWindow" };
        // const label = labelRaw.replaceAll(`"`, "").trim();
        // action["label"] = label;
        action["quitTDM"] = quitTDM;
        actions.push(action);
        return actions;
    };

    // "SYS=LINAC, SUBSYS=VAC" --> [["SYS", "LINAC"], ["SUBSYS", "VAC"]]
    static convertEdlMacros = (macrosRaw: string) => {
        // ["SYS=LINAC", "SUBSYS=VAC"]
        const macrosArray = macrosRaw.split(",");
        const macros: [string, string][] = [];

        for (let jj = 0; jj < macrosArray.length; jj++) {
            // "SYS=LINAC"
            const macroNameAndValue = macrosArray[jj].replaceAll('"', "").replaceAll("'", "").replaceAll(" ", "");
            // "SYS"
            const macroName = macroNameAndValue.split("=")[0];
            // "LINAC"
            const macroValue = macroNameAndValue.split("=")[1];
            if (macroName !== undefined && macroValue !== undefined) {
                macros.push([macroName, macroValue]);
            }
        }
        return macros;
    };

    static convertMenuMuxSymbolTag = (symbolTagsEdl: string[]) => {
        const result: string[] = [];
        for (let tagRaw of symbolTagsEdl) {
            let tagRawList = tagRaw.split(" ")
            const tag = tagRawList.splice(1).join(" ").replaceAll('"', "");
            result.push(tag);
        }
        return result;
    }

    static convertMenuMuxValue0 = (value0sEdl: string[]) => {
        const result: number[] = [];
        for (let value0Raw of value0sEdl) {
            let value0List = value0Raw.split(" ")
            const value0Str = value0List.splice(1).join(" ").replaceAll('"', "");
            if (!isNaN(parseFloat(value0Str))) {
                result.push(parseFloat(value0Str));
            } else {
                return [];
            }
        }
        return result;
    }

    static convertEdlRelatedDisplays = (labelsRaw: string[], fileNamesRaw: string[], externalMacrosRaws: string[], propagateMacrosRaws: string[]) => {
        const actions: Record<string, any>[] = [];
        // labels
        if (labelsRaw !== undefined) {
            for (let ii = 0; ii < labelsRaw.length; ii++) {
                const labelRaw = labelsRaw[ii];
                const labelRawArray = labelRaw.split(" ");
                const index = parseInt(labelRawArray[0]);
                labelRawArray.splice(0, 1);
                const label = labelRawArray.join(" ").replaceAll(`"`, "");

                let action = actions[index];
                if (action === undefined) {
                    action = { type: "OpenDisplay", label: "", fileName: "", externalMacros: [], useParentMacros: true };
                    actions[index] = action;
                }
                action["label"] = label;
            }
        }
        // fileNames
        if (fileNamesRaw !== undefined) {
            for (let ii = 0; ii < fileNamesRaw.length; ii++) {
                const fileNameRaw = fileNamesRaw[ii];
                const fileNameRawArray = fileNameRaw.split(" ");
                const index = parseInt(fileNameRawArray[0]);
                fileNameRawArray.splice(0, 1);
                const fileNameWithoutSuffix = fileNameRawArray.join(" ").replaceAll(`"`, "");
                let fileName = "";
                if (fileNameWithoutSuffix.endsWith(".edl")) {
                    // fileName = `${fileNameWithoutSuffix.substring(0, fileNameWithoutSuffix.length - 4)}.tdl`;
                    fileName = fileNameWithoutSuffix;
                } else {
                    // fileName = `${fileNameWithoutSuffix}.tdl`;
                    fileName = `${fileNameWithoutSuffix}.edl`;
                }

                let action = actions[index];
                if (action === undefined) {
                    action = { type: "OpenDisplay", label: "", fileName: "", externalMacros: [], useParentMacros: true };
                    actions[index] = action;
                }
                action["fileName"] = fileName;
            }
        }

        // macros
        if (propagateMacrosRaws !== undefined) {
            for (let ii = 0; ii < propagateMacrosRaws.length; ii++) {
                const propagateMacrosRaw = propagateMacrosRaws[ii];
                const propagateMacrosRawArray = propagateMacrosRaw.split(" ");
                const index = parseInt(propagateMacrosRawArray[0]);
                const propagateMacrosString = propagateMacrosRawArray[1];
                if (propagateMacrosString !== undefined) {
                    let action = actions[index];
                    if (action === undefined) {
                        action = { type: "OpenDisplay", label: "", fileName: "", externalMacros: [], useParentMacros: true };
                        actions[index] = action;
                    }
                    // action["useParentMacros"] = useParentMacrosString.replaceAll('"',"") === "0"? false : true;
                    // action["useParentMacros"] = propagateMacrosString.replaceAll('"',"") === "0"? true : false;
                    action["useParentMacros"] = true;
                }
            }
        }

        // external macros
        if (externalMacrosRaws !== undefined) {
            // externalMacrosRaws: ['0 "SYS=RNG"', '2 "SYS=LINAC, SUBSYS=VAC"']
            for (let ii = 0; ii < externalMacrosRaws.length; ii++) {
                // '2 "SYS=LINAC, SUBSYS=VAC"'
                const externalMacrosRaw = externalMacrosRaws[ii];
                // ["2", "SYS=LINAC, SUBSYS=VAC"]
                const externalMacrosRawArray = externalMacrosRaw.split(" ");
                // 2
                const index = parseInt(externalMacrosRawArray[0]);
                // "SYS=LINAC, SUBSYS=VAC"
                externalMacrosRawArray.splice(0, 1);
                const externalMacrosRawValue = externalMacrosRawArray.join(" ");
                if (externalMacrosRawValue === undefined) {
                    continue;
                }
                const externalMacros = this.convertEdlMacros(externalMacrosRawValue);

                let action = actions[index];
                if (action === undefined) {
                    action = { type: "OpenDisplay", label: "", fileName: "", externalMacros: [], useParentMacros: true };
                    actions[index] = action;
                }
                action["externalMacros"] = externalMacros;
            }
        }
        return actions;
    };

    // ------------------------------------ alarm stuff (mostly colors ) ---------------------------------------

    /**
     *  convert the fillAlarm to a rule. Several types. They change fill colors
     *
     * (type === 0) return [rule_MINOR, rule_MAJOR, rule_INVALID] <br>
     *
     * (type === 1) return [rule_NO_ALARM, rule_MINOR, rule_MAJOR, rule_INVALID]  <br>
     *
     * (type === 2) return [rule_NO_ALARM, rule_MINOR, rule_MAJOR, rule_INVALID, rule_UNDEFINED_to_NO_ALARM]  <br>
     *
     * (type === 3) return [rule_NO_ALARM, rule_MINOR, rule_MAJOR, rule_INVALID, rule_UNDEFINED_to_INVISIBLE]  <br>
     */
    static convertEdlColorAlarm = (channelNameRaw: string, type: number = 0, rulePropertyName: string) => {
        if (channelNameRaw === undefined) {
            return [];
        }
        const channelName = channelNameRaw.replaceAll(`"`, "");
        if (channelName.trim() === "") {
            return [];
        }
        const channelSevrityPv = `${channelName.split(".")[0]}.SEVR`;
        const sevrExpression = this.generatePvExpression(channelSevrityPv);
        const rule_NO_ALARM: Record<string, any> = {
            boolExpression: `${sevrExpression} > -0.5 and ${sevrExpression} < 0.5`,
            propertyName: rulePropertyName,
            propertyValue: "rgba(0, 255, 0, 1)",
            id: uuidv4(),
        };
        const rule_MINOR: Record<string, any> = {
            boolExpression: `${sevrExpression} > 0.5 and ${sevrExpression} < 1.5`,
            propertyName: rulePropertyName,
            propertyValue: "rgba(255, 255, 0, 1)",
            id: uuidv4(),
        };
        const rule_MAJOR: Record<string, any> = {
            boolExpression: `${sevrExpression} > 1.5 and ${sevrExpression} < 2.5`,
            propertyName: rulePropertyName,
            propertyValue: "rgba(255, 0, 0, 1)",
            id: uuidv4(),
        };
        const rule_INVALID: Record<string, any> = {
            boolExpression: `${sevrExpression} > 2.5 and ${sevrExpression} < 4.5`,
            propertyName: rulePropertyName,
            propertyValue: "rgba(255, 255, 255, 1)",
            id: uuidv4(),
        };
        const rule_UNDEFINED_to_NO_ALARM: Record<string, any> = {
            boolExpression: `${sevrExpression} > -0.5 and ${sevrExpression} < 0.5`,
            propertyName: rulePropertyName,
            propertyValue: "rgba(0, 255, 0, 1)",
            id: uuidv4(),
        };
        const rule_UNDEFINED_to_INVISIBLE: Record<string, any> = {
            boolExpression: `${sevrExpression} == undefined`,
            propertyName: "Invisible in Operation",
            propertyValue: "true",
            id: uuidv4(),
        };

        if (type === 0) {
            return [rule_MINOR, rule_MAJOR, rule_INVALID];
        } else if (type === 1) {
            return [rule_NO_ALARM, rule_MINOR, rule_MAJOR, rule_INVALID];
        } else if (type === 2) {
            return [rule_NO_ALARM, rule_MINOR, rule_MAJOR, rule_INVALID, rule_UNDEFINED_to_NO_ALARM];
        } else if (type === 3) {
            return [rule_NO_ALARM, rule_MINOR, rule_MAJOR, rule_INVALID, rule_UNDEFINED_to_INVISIBLE];
        } else {
            Log.error("-1", "wrong type for lineAlarm");
            return [];
        }
    };

    /**
     *  convert the fgAlarm to a rule. Several types. They change text color (not the border)
     *
     * (type === 0) return [rule_MINOR, rule_MAJOR, rule_INVALID] <br>
     *
     * (type === 1) return [rule_NO_ALARM, rule_MINOR, rule_MAJOR, rule_INVALID]  <br>
     *
     * (type === 2) return [rule_NO_ALARM, rule_MINOR, rule_MAJOR, rule_INVALID, rule_UNDEFINED_to_NO_ALARM]  <br>
     *
     * (type === 3) return [rule_NO_ALARM, rule_MINOR, rule_MAJOR, rule_INVALID, rule_UNDEFINED_to_INVISIBLE]  <br>
     */
    static convertEdlFgAlarm = (channelNameRaw: string, type: number = 0) => {
        if (channelNameRaw === undefined) {
            return [];
        }
        const channelName = channelNameRaw.replaceAll(`"`, "");
        const channelSevrityPv = `${channelName.split(".")[0]}.SEVR`;
        const sevrExpresson = this.generatePvExpression(channelSevrityPv);
        const rule_NO_ALARM: Record<string, any> = {
            boolExpression: `${sevrExpresson} > -0.5 and ${sevrExpresson} < 0.5`,
            propertyName: "Text Color",
            propertyValue: "rgba(0, 255, 0, 1)",
            id: uuidv4(),
        };
        const rule_MINOR: Record<string, any> = {
            boolExpression: `${sevrExpresson} > 0.5 and ${sevrExpresson} < 1.5`,
            propertyName: "Text Color",
            propertyValue: "rgba(255, 255, 0, 1)",
            id: uuidv4(),
        };
        const rule_MAJOR: Record<string, any> = {
            boolExpression: `${sevrExpresson} > 1.5 and ${sevrExpresson} < 2.5`,
            propertyName: "Text Color",
            propertyValue: "rgba(255, 0, 0, 1)",
            id: uuidv4(),
        };
        const rule_INVALID: Record<string, any> = {
            boolExpression: `${sevrExpresson} > 2.5 and ${sevrExpresson} < 4.5`,
            propertyName: "Text Color",
            propertyValue: "rgba(255, 255, 255, 1)",
            id: uuidv4(),
        };
        const rule_UNDEFINED_to_NO_ALARM: Record<string, any> = {
            boolExpression: `${sevrExpresson} == undefined`,
            propertyName: "Text Color",
            propertyValue: "rgba(0, 255, 0, 1)",
            id: uuidv4(),
        };
        const rule_UNDEFINED_to_INVISIBLE: Record<string, any> = {
            boolExpression: `${sevrExpresson} == undefined`,
            propertyName: "Invisible in Operation",
            propertyValue: "true",
            id: uuidv4(),
        };

        if (type === 0) {
            return [rule_MINOR, rule_MAJOR, rule_INVALID];
        } else if (type === 1) {
            return [rule_NO_ALARM, rule_MINOR, rule_MAJOR, rule_INVALID];
        } else if (type === 2) {
            return [rule_NO_ALARM, rule_MINOR, rule_MAJOR, rule_INVALID, rule_UNDEFINED_to_NO_ALARM];
        } else if (type === 3) {
            return [rule_NO_ALARM, rule_MINOR, rule_MAJOR, rule_INVALID, rule_UNDEFINED_to_INVISIBLE];
        } else {
            Log.error("-1", "wrong type for lineAlarm");
            return [];
        }
    };

    /**
     *  convert the lineAlarm to a rule. Several types. They change line color
     *
     * (type === 0) return [rule_MINOR, rule_MAJOR, rule_INVALID] <br>
     *
     * (type === 1) return [rule_NO_ALARM, rule_MINOR, rule_MAJOR, rule_INVALID]  <br>
     *
     * (type === 2) return [rule_NO_ALARM, rule_MINOR, rule_MAJOR, rule_INVALID, rule_UNDEFINED_to_NO_ALARM]  <br>
     *
     * (type === 3) return [rule_NO_ALARM, rule_MINOR, rule_MAJOR, rule_INVALID, rule_UNDEFINED_to_INVISIBLE]  <br>
     */
    static convertEdlLineAlarm = (channelNameRaw: string, type: number = 0) => {
        if (channelNameRaw === undefined) {
            return [];
        }
        const channelName = channelNameRaw.replaceAll(`"`, "");
        const channelSevrityPv = `${channelName.split(".")[0]}.SEVR`;
        const sevrExpresson = EdlConverter.generatePvExpression(channelSevrityPv);
        const rule_NO_ALARM: Record<string, any> = {
            boolExpression: `${sevrExpresson} > -0.5 and ${sevrExpresson} < 0.5`,
            propertyName: "Line Color",
            propertyValue: "rgba(0, 255, 0, 1)",
            id: uuidv4(),
        };
        const rule_MINOR: Record<string, any> = {
            boolExpression: `${sevrExpresson} > 0.5 and ${sevrExpresson} < 1.5`,
            propertyName: "Line Color",
            propertyValue: "rgba(255, 255, 0, 1)",
            id: uuidv4(),
        };
        const rule_MAJOR: Record<string, any> = {
            boolExpression: `${sevrExpresson} > 1.5 and ${sevrExpresson} < 2.5`,
            propertyName: "Line Color",
            propertyValue: "rgba(255, 0, 0, 1)",
            id: uuidv4(),
        };
        const rule_INVALID: Record<string, any> = {
            boolExpression: `${sevrExpresson} > 2.5 and ${sevrExpresson} < 4.5`,
            propertyName: "Line Color",
            propertyValue: "rgba(255, 255, 255, 1)",
            id: uuidv4(),
        };
        const rule_UNDEFINED_to_NO_ALARM: Record<string, any> = {
            boolExpression: `${sevrExpresson} == undefined`,
            propertyName: "Line Color",
            propertyValue: "rgba(0, 255, 0, 1)",
            id: uuidv4(),
        };
        const rule_UNDEFINED_to_INVISIBLE: Record<string, any> = {
            boolExpression: `${sevrExpresson} == undefined`,
            propertyName: "Invisible in Operation",
            propertyValue: "true",
            id: uuidv4(),
        };
        if (type === 0) {
            return [rule_MINOR, rule_MAJOR, rule_INVALID];
        } else if (type === 1) {
            return [rule_NO_ALARM, rule_MINOR, rule_MAJOR, rule_INVALID];
        } else if (type === 2) {
            return [rule_NO_ALARM, rule_MINOR, rule_MAJOR, rule_INVALID, rule_UNDEFINED_to_NO_ALARM];
        } else if (type === 3) {
            return [rule_NO_ALARM, rule_MINOR, rule_MAJOR, rule_INVALID, rule_UNDEFINED_to_INVISIBLE];
        } else {
            Log.error("-1", "wrong type for lineAlarm");
            return [];
        }
    };

    /**
     *  convert the fillAlarm to a rule. Several types. They change fill colors
     *
     * (type === 0) return [rule_MINOR, rule_MAJOR, rule_INVALID] <br>
     *
     * (type === 1) return [rule_NO_ALARM, rule_MINOR, rule_MAJOR, rule_INVALID]  <br>
     *
     * (type === 2) return [rule_NO_ALARM, rule_MINOR, rule_MAJOR, rule_INVALID, rule_UNDEFINED_to_NO_ALARM]  <br>
     *
     * (type === 3) return [rule_NO_ALARM, rule_MINOR, rule_MAJOR, rule_INVALID, rule_UNDEFINED_to_INVISIBLE]  <br>
     */
    static convertEdlFillAlarm = (channelNameRaw: string, type: number = 0) => {
        if (channelNameRaw === undefined) {
            return [];
        }
        const channelName = channelNameRaw.replaceAll(`"`, "");
        const channelSevrityPv = `${channelName.split(".")[0]}.SEVR`;
        const sevrExpression = EdlConverter.generatePvExpression(channelSevrityPv);
        const rule_NO_ALARM: Record<string, any> = {
            boolExpression: `${sevrExpression} > -0.5 and ${sevrExpression} < 0.5`,
            propertyName: "Fill Color",
            propertyValue: "rgba(0, 255, 0, 1)",
            id: uuidv4(),
        };
        const rule_MINOR: Record<string, any> = {
            boolExpression: `${sevrExpression} > 0.5 and ${sevrExpression} < 1.5`,
            propertyName: "Fill Color",
            propertyValue: "rgba(255, 255, 0, 1)",
            id: uuidv4(),
        };
        const rule_MAJOR: Record<string, any> = {
            boolExpression: `${sevrExpression} > 1.5 and ${sevrExpression} < 2.5`,
            propertyName: "Fill Color",
            propertyValue: "rgba(255, 0, 0, 1)",
            id: uuidv4(),
        };
        const rule_INVALID: Record<string, any> = {
            boolExpression: `${sevrExpression} > 2.5 and ${sevrExpression} < 4.5`,
            propertyName: "Fill Color",
            propertyValue: "rgba(255, 255, 255, 1)",
            id: uuidv4(),
        };
        const rule_UNDEFINED_to_NO_ALARM: Record<string, any> = {
            boolExpression: `${sevrExpression} > -0.5 and ${sevrExpression} < 0.5`,
            propertyName: "Fill Color",
            propertyValue: "rgba(0, 255, 0, 1)",
            id: uuidv4(),
        };
        const rule_UNDEFINED_to_INVISIBLE: Record<string, any> = {
            boolExpression: `${sevrExpression} == undefined`,
            propertyName: "Invisible in Operation",
            propertyValue: "true",
            id: uuidv4(),
        };

        if (type === 0) {
            return [rule_MINOR, rule_MAJOR, rule_INVALID];
        } else if (type === 1) {
            return [rule_NO_ALARM, rule_MINOR, rule_MAJOR, rule_INVALID];
        } else if (type === 2) {
            return [rule_NO_ALARM, rule_MINOR, rule_MAJOR, rule_INVALID, rule_UNDEFINED_to_NO_ALARM];
        } else if (type === 3) {
            return [rule_NO_ALARM, rule_MINOR, rule_MAJOR, rule_INVALID, rule_UNDEFINED_to_INVISIBLE];
        } else {
            Log.error("-1", "wrong type for lineAlarm");
            return [];
        }
    };

    /**
     *  convert the bgAlarm to a rule. Several types. They cange Background colors
     *
     * (type === 0) return [rule_MINOR, rule_MAJOR, rule_INVALID] <br>
     *
     * (type === 1) return [rule_NO_ALARM, rule_MINOR, rule_MAJOR, rule_INVALID]  <br>
     *
     * (type === 2) return [rule_NO_ALARM, rule_MINOR, rule_MAJOR, rule_INVALID, rule_UNDEFINED_to_NO_ALARM]  <br>
     *
     * (type === 3) return [rule_NO_ALARM, rule_MINOR, rule_MAJOR, rule_INVALID, rule_UNDEFINED_to_INVISIBLE]  <br>
     */
    static convertEdlBgAlarm = (channelNameRaw: string, type: number = 0) => {
        if (channelNameRaw === undefined) {
            return [];
        }
        const channelName = channelNameRaw.replaceAll(`"`, "");
        const channelSevrityPv = `${channelName.split(".")[0]}.SEVR`;
        const sevrExpression = EdlConverter.generatePvExpression(channelSevrityPv);
        const rule_NO_ALARM: Record<string, any> = {
            boolExpression: `${sevrExpression} > -0.5 and ${sevrExpression} < 0.5`,
            propertyName: "Background Color",
            propertyValue: "rgba(0, 255, 0, 1)",
            id: uuidv4(),
        };
        const rule_MINOR: Record<string, any> = {
            boolExpression: `${sevrExpression} > 0.5 and ${sevrExpression} < 1.5`,
            propertyName: "Background Color",
            propertyValue: "rgba(255, 255, 0, 1)",
            id: uuidv4(),
        };
        const rule_MAJOR: Record<string, any> = {
            boolExpression: `${sevrExpression} > 1.5 and ${sevrExpression} < 2.5`,
            propertyName: "Background Color",
            propertyValue: "rgba(255, 0, 0, 1)",
            id: uuidv4(),
        };
        const rule_INVALID: Record<string, any> = {
            boolExpression: `${sevrExpression} > 2.5 and ${sevrExpression} < 4.5`,
            propertyName: "Background Color",
            propertyValue: "rgba(255, 255, 255, 1)",
            id: uuidv4(),
        };
        const rule_UNDEFINED_to_NO_ALARM: Record<string, any> = {
            boolExpression: `${sevrExpression} == undefined`,
            propertyName: "Background Color",
            propertyValue: "rgba(0, 255, 0, 1)",
            id: uuidv4(),
        };
        const rule_UNDEFINED_to_INVISIBLE: Record<string, any> = {
            boolExpression: `${sevrExpression} == undefined`,
            propertyName: "Invisible in Operation",
            propertyValue: "true",
            id: uuidv4(),
        };

        if (type === 0) {
            return [rule_MINOR, rule_MAJOR, rule_INVALID];
        } else if (type === 1) {
            return [rule_NO_ALARM, rule_MINOR, rule_MAJOR, rule_INVALID];
        } else if (type === 2) {
            return [rule_NO_ALARM, rule_MINOR, rule_MAJOR, rule_INVALID, rule_UNDEFINED_to_NO_ALARM];
        } else if (type === 3) {
            return [rule_NO_ALARM, rule_MINOR, rule_MAJOR, rule_INVALID, rule_UNDEFINED_to_INVISIBLE];
        } else {
            Log.error("-1", "wrong type for lineAlarm");
            return [];
        }
    };

    /**
     *  convert the useAlarmBorder to a rule. Several types. They changes border colors <br>
     *
     * (type === 0) return [rule_MINOR, rule_MAJOR, rule_INVALID] <br>
     *
     * (type === 1) return [rule_NO_ALARM, rule_MINOR, rule_MAJOR, rule_INVALID]  <br>
     *
     * (type === 2) return [rule_NO_ALARM, rule_MINOR, rule_MAJOR, rule_INVALID, rule_UNDEFINED_to_NO_ALARM]  <br>
     *
     * (type === 3) return [rule_NO_ALARM, rule_MINOR, rule_MAJOR, rule_INVALID, rule_UNDEFINED_to_INVISIBLE]  <br>
     */
    static convertEdlBorderAlarm = (channelNameRaw: string, type: number = 0) => {
        if (channelNameRaw === undefined) {
            return [];
        }
        const channelName = channelNameRaw.replaceAll(`"`, "");
        const channelSevrityPv = `${channelName.split(".")[0]}.SEVR`;
        const sevrExpresson = this.generatePvExpression(channelSevrityPv);
        const rule_NO_ALARM: Record<string, any> = {
            boolExpression: `${sevrExpresson} > -0.5 and ${sevrExpresson} < 0.5`,
            propertyName: "Border Color",
            propertyValue: "rgba(0, 255, 0, 1)",
            id: uuidv4(),
        };
        const rule_MINOR: Record<string, any> = {
            boolExpression: `${sevrExpresson} > 0.5 and ${sevrExpresson} < 1.5`,
            propertyName: "Border Color",
            propertyValue: "rgba(255, 255, 0, 1)",
            id: uuidv4(),
        };
        const rule_MAJOR: Record<string, any> = {
            boolExpression: `${sevrExpresson} > 1.5 and ${sevrExpresson} < 2.5`,
            propertyName: "Border Color",
            propertyValue: "rgba(255, 0, 0, 1)",
            id: uuidv4(),
        };
        const rule_INVALID: Record<string, any> = {
            boolExpression: `${sevrExpresson} > 2.5 and ${sevrExpresson} < 4.5`,
            propertyName: "Border Color",
            propertyValue: "rgba(255, 255, 255, 1)",
            id: uuidv4(),
        };
        const rule_UNDEFINED_to_NO_ALARM: Record<string, any> = {
            boolExpression: `${sevrExpresson} == undefined`,
            propertyName: "Border Color",
            propertyValue: "rgba(0, 255, 0, 1)",
            id: uuidv4(),
        };
        const rule_UNDEFINED_to_INVISIBLE: Record<string, any> = {
            boolExpression: `${sevrExpresson} == undefined`,
            propertyName: "Invisible in Operation",
            propertyValue: "true",
            id: uuidv4(),
        };

        if (type === 0) {
            return [rule_MINOR, rule_MAJOR, rule_INVALID];
        } else if (type === 1) {
            return [rule_NO_ALARM, rule_MINOR, rule_MAJOR, rule_INVALID];
        } else if (type === 2) {
            return [rule_NO_ALARM, rule_MINOR, rule_MAJOR, rule_INVALID, rule_UNDEFINED_to_NO_ALARM];
        } else if (type === 3) {
            return [rule_NO_ALARM, rule_MINOR, rule_MAJOR, rule_INVALID, rule_UNDEFINED_to_INVISIBLE];
        } else {
            Log.error("-1", "wrong type for lineAlarm");
            return [];
        }
    };

    static convertEdlNumber = (edlNumber: string | undefined) => {
        if (edlNumber === undefined) {
            return 0;
        } else {
            if (isNaN(parseFloat(edlNumber.replaceAll(`"`, "")))) {
                return 0;
            } else {
                return parseFloat(edlNumber.replaceAll(`"`, ""));
            }
        }
    };

    static convertEdlVisPv = (visPv: string, visMin: string | undefined, visMax: string | undefined, visInvert: string | undefined, isStaticTextWidget: boolean = false, forGroup: boolean = false) => {
        const channelName = visPv.replaceAll(`"`, "");
        const result: Record<string, any>[] = [];

        // If any of the visMin or visMax is undefined, this widget should always be invisible, no matter if the visInvert is true or false
        // if (visMax === undefined || visMin === undefined && visPv !== undefined) {
        //     const rule = {
        //         boolExpression: `true`,
        //         propertyName: "Invisible in Operation",
        //         propertyValue: "true",
        //         id: uuidv4(),
        //     };
        //     result.push(rule);
        //     return result;
        // }

        // if visMin or visMax is undefined, the corresponding condition is ignored, 
        // which is equivalent to they are -infinity or +infinity

        let min = Number.NEGATIVE_INFINITY;
        let max = Number.POSITIVE_INFINITY;
        if (visMin !== undefined) {
            if (visMin === "-inf") {
                // -infinity
            } else {
                min = parseFloat(visMin.replaceAll(`"`, ""));
            }
        }

        if (visMax !== undefined) {
            if (visMax === "inf") {
                // infinity
            } else {
                max = parseFloat(visMax.replaceAll(`"`, ""));
            }
        }
        if (typeof visInvert === "string" && visInvert.replaceAll('"', "") === "true") {
            // default is showing the widget
            let rule: Record<string, any> = {
                boolExpression: `true`,
                propertyName: "Invisible in Operation",
                // propertyValue: forGroup === true? "true":"false",
                propertyValue: "false",
                id: uuidv4(),
            };
            result.push(rule);

            if (forGroup === true) {
                let baseChannelName = channelName;
                // if channel name is a .SEVR, then it is never "undefined", in the worst case it is 3 (INVALID).
                if (channelName.endsWith(".SEVR")) {
                    baseChannelName = channelName.replaceAll(".SEVR", "");
                }
                let rule: Record<string, any> = {
                    boolExpression: `${this.generatePvExpression(baseChannelName)} == undefined`,
                    propertyName: "Invisible in Operation",
                    propertyValue: "true", // for Group visibility only: its child widgets are invisible when the visPv is undefined
                    id: uuidv4(),
                };
                result.push(rule);
            }

            // then use the boolean condition to determine if we want to show the widget
            // if the below condition is false (e.g. channel value not in truth range, channel not available, or channel macros failed to expand),
            // the rule below is ignored, then according to the rule above, the widget is shown
            rule = {
                boolExpression: `${this.generatePvExpression(channelName)} >= ${min} and ${this.generatePvExpression(channelName)} < ${max} and ${this.generatePvExpression(channelName)} != undefined`,
                propertyName: "Invisible in Operation",
                propertyValue: "true",
                id: uuidv4(),
            };
            result.push(rule);
        } else {
            // default is hiding the widget
            let rule = {
                boolExpression: `true`,
                propertyName: "Invisible in Operation",
                propertyValue: "true",
                id: uuidv4(),
            };
            result.push(rule);
            // then use the boolean condition to determine if we want to show the widget
            rule = {
                boolExpression: `${this.generatePvExpression(channelName)} >= ${min} and ${this.generatePvExpression(channelName)} < ${max} and ${this.generatePvExpression(channelName)} != undefined`,
                propertyName: "Invisible in Operation",
                propertyValue: "false",
                id: uuidv4(),
            };
            result.push(rule);

            // for Static Text widget, if the visPv is undefined, show white text, this is the last one
            if (isStaticTextWidget) {
                rule = {
                    boolExpression: `${this.generatePvExpression(channelName)} == undefined`,
                    propertyName: "Invisible in Operation",
                    propertyValue: "false",
                    id: uuidv4(),
                };
                result.push(rule);
                rule = {
                    boolExpression: `${this.generatePvExpression(channelName)} == undefined`,
                    propertyName: "Text Color",
                    propertyValue: "rgba(255,255,255,1)",
                    id: uuidv4(),
                };
                result.push(rule);

            }

        }
        return result;
    };

    static convertEdlInvisible = (invisibleRaw: string) => {
        const invisible = invisibleRaw.replaceAll(`"`, "");
        if (invisible === "true") {
            let rule: Record<string, any> = {
                boolExpression: "true",
                propertyName: "Invisible in Operation",
                propertyValue: "true",
                id: uuidv4(),
            };
            return [rule];
        } else {
            let rule: Record<string, any> = {
                boolExpression: "true",
                propertyName: "Invisible in Operation",
                propertyValue: "false",
                id: uuidv4(),
            };
            return [rule];
        }
    };

    static convertEdlDisplayMode = (propertyValue: string) => {
        if (propertyValue.includes("decimal")) {
            return "decimal";
        } else if (propertyValue.includes("hex")) {
            return "hexadecimal";
        } else if (propertyValue.includes("default")) {
            return "default";
        } else if (propertyValue.includes("engineer")) {
            return "default";
        } else if (propertyValue.includes("exp")) {
            return "exponential";
        } else if (propertyValue.includes("exponential")) {
            return "exponential";
        } else if (propertyValue.includes("string")) {
            return "string";
        } else {
            return "default";
        }
    };

    static convertEdlPrecision = (propertyValue: string) => {
        console.log("precision ===================", propertyValue);
        const result = parseInt(propertyValue);
        if (!isNaN(result)) {
            if (result < 0) {
                return 0;
            } else {
                return result;
            }
        } else {
            return 0;
        }
    };

    static convertEdlXorY = (propertyValue: string, borderWidthRaw: string | undefined, subtract: boolean = false) => {
        if (borderWidthRaw === undefined) {
            return parseInt(propertyValue);
        } else {
            const borderWidth = parseInt(borderWidthRaw.replaceAll(`"`, ""));
            if (subtract) {
                const XorY = parseInt(propertyValue) - borderWidth / 2;
                return XorY;
            } else {
                const XorY = parseInt(propertyValue) + borderWidth / 2;
                return XorY;
            }
        }
    };

    static convertEdlWorH = (propertyValue: string, borderWidthRaw: string | undefined, subtract: boolean = false) => {
        if (borderWidthRaw === undefined) {
            return parseInt(propertyValue);
        } else {
            const borderWidth = parseInt(borderWidthRaw.replaceAll(`"`, ""));
            if (subtract) {
                const WorH = parseInt(propertyValue) + borderWidth;
                return WorH;
            } else {
                const WorH = parseInt(propertyValue) - borderWidth;
                return WorH;
            }
        }
    };

    // --------------------------- embedded window ------------------------
    static convertEdlEmbeddedWindowMenu = (
        displayFileName: string[],
        menuLabel: string[] | undefined,
        symbols: string[] | undefined,
        convertEdlSufffix: boolean
    ) => {
        const tdlFileNames: string[] = [];
        if (displayFileName !== undefined) {
            for (let fileNameRaw of displayFileName) {
                const fileNameStr = fileNameRaw.split(" ")[1];
                if (fileNameStr !== undefined) {
                    let fileName = fileNameStr.replaceAll(`"`, "");
                    if (convertEdlSufffix === true) {
                        if (fileName.endsWith(".edl")) {
                            fileName = `${fileName.substring(0, fileName.length - 4)}.tdl`;
                        } else {
                            fileName = `${fileName}.tdl`;
                        }
                        tdlFileNames.push(fileName.replaceAll(".edl", ".tdl"));
                    } else {
                        if (!fileName.endsWith(".edl")) {
                            tdlFileNames.push(fileName + ".edl");
                        } else {
                            tdlFileNames.push(fileName);
                        }

                    }
                }
            }
        }

        const itemNames: string[] = [];
        if (menuLabel !== undefined) {
            for (let menuLabelRaw of menuLabel) {
                const menuLabelStr = menuLabelRaw.split(" ")[1];
                if (menuLabelStr !== undefined) {
                    const label = menuLabelStr.replaceAll(`"`, "");
                    itemNames.push(label);
                }
            }
        }

        const itemMacros: [string, string][][] = [];
        if (symbols !== undefined) {
            // external macros
            // externalMacrosRaws: ['0 "SYS=RNG"', '2 "SYS=LINAC, SUBSYS=VAC"']
            for (let ii = 0; ii < symbols.length; ii++) {
                // '2 "SYS=LINAC, SUBSYS=VAC"'
                const externalMacrosRaw = symbols[ii];
                // ["2", "SYS=LINAC, SUBSYS=VAC"]
                const externalMacrosRawArray = externalMacrosRaw.split(" ");
                // 2
                const index = parseInt(externalMacrosRawArray[0]);
                // "SYS=LINAC, SUBSYS=VAC"
                externalMacrosRawArray.splice(0, 1);
                const externalMacrosRawValue = externalMacrosRawArray.join(" ");
                if (externalMacrosRawValue === undefined) {
                    continue;
                }
                const externalMacros = this.convertEdlMacros(externalMacrosRawValue);

                itemMacros[index] = externalMacros;
            }
        }

        const itemIsWebpage: boolean[] = [];
        for (let ii = 0; ii < Math.max(tdlFileNames.length, itemNames.length, itemMacros.length); ii++) {
            if (itemMacros[ii] === undefined || itemMacros[ii] === null) {
                itemMacros[ii] = [];
            }
            itemIsWebpage.push(false);
        }
        return {
            tdlFileNames: tdlFileNames,
            itemNames: itemNames,
            itemMacros: itemMacros,
            itemIsWebpage: itemIsWebpage,
        };
    };

    static convertEdlXYGraphXYPv = (pvType: "x" | "y", propertyValue: string[], edl: Record<string, any>, tdl: Record<string, any>) => {
        if (!Array.isArray(propertyValue)) {
            return;
        }
        for (let ii = 0; ii < propertyValue.length; ii++) {
            const channelNameRaw = propertyValue[ii];
            const channelNameArray = channelNameRaw.split(" ");

            if (channelNameArray[0] === undefined) {
                continue;
            }
            const yIndexRaw = channelNameArray[0].replaceAll(`"`, "");
            const yIndex = parseInt(yIndexRaw);
            if (isNaN(yIndex)) {
                continue;
            }

            if (channelNameArray[1] !== undefined) {
                const channelName = channelNameArray[1].replaceAll(`"`, "");
                if (tdl["yAxes"][yIndex] === undefined) {
                    tdl["yAxes"][yIndex] = XYPlotHelper.generateDefaultYAxis(ii);
                }
                if (pvType === "x") {
                    tdl["channelNames"][2 * yIndex] = channelName;
                } else if (pvType === "y") {
                    tdl["channelNames"][2 * yIndex + 1] = channelName;
                }
            }

            for (let ii = 0; ii < 2 * yIndex + 2; ii++) {
                if (tdl["channelNames"][ii] === undefined || tdl["channelNames"][ii] === null) {
                    tdl["channelNames"][ii] = "";
                }
            }
        }
    };

    static convertEdlXYGraphPlotColor = (propertyValue: string[], edl: Record<string, any>, tdl: Record<string, any>) => {
        if (!Array.isArray(propertyValue)) {
            return;
        }
        for (let ii = 0; ii < propertyValue.length; ii++) {
            const colorRaw = propertyValue[ii];
            const colorArray = colorRaw.split(" ");

            if (colorArray[0] === undefined) {
                continue;
            }
            const yIndexRaw = colorArray[0].replaceAll(`"`, "");
            const yIndex = parseInt(yIndexRaw);
            if (isNaN(yIndex)) {
                continue;
            }

            colorArray.splice(0, 1);
            const colorStr = colorArray.join(" ");
            const color = this.convertEdlColor(colorStr);

            if (tdl["yAxes"][yIndex] === undefined) {
                tdl["yAxes"][yIndex] = XYPlotHelper.generateDefaultYAxis(ii);
            }
            const yAxis = tdl["yAxes"][yIndex];
            yAxis["lineColor"] = color;
        }
    };

    static convertEdlXYGraphLineThickness = (propertyValue: string[], edl: Record<string, any>, tdl: Record<string, any>) => {
        if (!Array.isArray(propertyValue)) {
            return;
        }
        for (let ii = 0; ii < propertyValue.length; ii++) {
            const thicknessRaw = propertyValue[ii];
            const thicknessArray = thicknessRaw.split(" ");

            if (thicknessArray[0] === undefined) {
                continue;
            }
            const yIndexRaw = thicknessArray[0].replaceAll(`"`, "");
            const yIndex = parseInt(yIndexRaw);
            if (isNaN(yIndex)) {
                continue;
            }

            thicknessArray.splice(0, 1);
            const thicknessStr = thicknessArray.join(" ");
            const thickness = parseInt(thicknessStr);
            if (isNaN(thickness)) {
                continue;
            }

            if (tdl["yAxes"][yIndex] === undefined) {
                tdl["yAxes"][yIndex] = XYPlotHelper.generateDefaultYAxis(ii);
            }
            const yAxis = tdl["yAxes"][yIndex];
            yAxis["lineWidth"] = thickness;
        }
    };
    static convertEdlXYGraphLineStyle = (propertyValue: string[], edl: Record<string, any>, tdl: Record<string, any>) => {
        if (!Array.isArray(propertyValue)) {
            return;
        }
        for (let ii = 0; ii < propertyValue.length; ii++) {
            const styleRaw = propertyValue[ii];
            const styleArray = styleRaw.split(" ");

            if (styleArray[0] === undefined) {
                continue;
            }
            const yIndexRaw = styleArray[0].replaceAll(`"`, "");
            const yIndex = parseInt(yIndexRaw);
            if (isNaN(yIndex)) {
                continue;
            }

            styleArray.splice(0, 1);
            const styleStr = styleArray.join("").replaceAll(`"`, "");
            let style = "solid";
            if (styleStr === "dash") {
                style = "dashed";
            }

            if (tdl["yAxes"][yIndex] === undefined) {
                tdl["yAxes"][yIndex] = XYPlotHelper.generateDefaultYAxis(ii);
            }
            const yAxis = tdl["yAxes"][yIndex];
            yAxis["lineStyle"] = style;
        }
    };

    static convertEdlXYGraphPlotSymbolType = (propertyValue: string[], edl: Record<string, any>, tdl: Record<string, any>) => {
        if (!Array.isArray(propertyValue)) {
            return;
        }
        for (let ii = 0; ii < propertyValue.length; ii++) {
            const typeRaw = propertyValue[ii];
            const typeArray = typeRaw.split(" ");

            if (typeArray[0] === undefined) {
                continue;
            }
            const yIndexRaw = typeArray[0].replaceAll(`"`, "");
            const yIndex = parseInt(yIndexRaw);
            if (isNaN(yIndex)) {
                continue;
            }

            typeArray.splice(0, 1);
            const typeStr = typeArray.join("").replaceAll(`"`, "");
            let type = "none";
            if (typeStr === "circle") {
                type = "circle";
            } else if (typeStr === "square") {
                type = "square";
            } else if (typeStr === "diamond") {
                type = "diamond";
            }

            if (tdl["yAxes"][yIndex] === undefined) {
                tdl["yAxes"][yIndex] = XYPlotHelper.generateDefaultYAxis(ii);
            }
            const yAxis = tdl["yAxes"][yIndex];
            yAxis["pointType"] = type;
        }
    };

    static convertEdlXYGraphPlotStyle = (propertyValue: string[], edl: Record<string, any>, tdl: Record<string, any>) => {
        // if (!Array.isArray(propertyValue)) {
        // 	return;
        // }
        // for (let ii = 0; ii < propertyValue.length; ii++) {
        // 	const styleRaw = propertyValue[ii];
        // 	const styleArray = styleRaw.split(" ");
        // 	if (styleArray[0] === undefined) {
        // 		continue;
        // 	}
        // 	const yIndexRaw = styleArray[0].replaceAll(`"`, "");
        // 	const yIndex = parseInt(yIndexRaw);
        // 	if (isNaN(yIndex)) {
        // 		continue;
        // 	}
        // 	styleArray.splice(0, 1);
        // 	const styleStr = styleArray.join(" ").replaceAll(`"`, "");
        // 	let style = "none";
        // 	if (styleStr === "line") {
        // 		type = "circle";
        // 	} else if (typeStr === "square") {
        // 		type = "square";
        // 	} else if (typeStr === "diamond") {
        // 		type = "diamond";
        // 	}
        // 	if (tdl["yAxes"][yIndex] === undefined) {
        // 		tdl["yAxes"][yIndex] = XYPlotHelper.generateDefaultYAxis(ii);
        // 	}
        // 	const yAxis = tdl["yAxes"][yIndex];
        // 	yAxis["pointType"] = type;
        // }
    };

    static convertEdlXYGraphXYY2AxisSrc = (edl: Record<string, any>, tdl: Record<string, any>) => {
        const useY2AxisRaw = edl["useY2Axis"];
        const useY2Axis: number[] = [];

        if (useY2AxisRaw !== undefined) {
            for (let ii = 0; ii < useY2AxisRaw.length; ii++) {
                const useY2AxisRawElement = useY2AxisRaw[ii];
                const arr = useY2AxisRawElement.split(" ");
                if (arr[0] !== undefined) {
                    const yIndex = parseInt(arr[0]);
                    if (isNaN(yIndex)) {
                        continue;
                    }
                    useY2Axis.push(yIndex);
                }
            }
        }

        let xSrcRaw = edl["xAxisSrc"];
        if (xSrcRaw === undefined) {
            xSrcRaw = "fromPv";
        }
        let ySrcRaw = edl["yAxisSrc"];
        if (ySrcRaw === undefined) {
            ySrcRaw = "fromPv";
        }
        let y2SrcRaw = edl["y2AxisSrc"];
        if (y2SrcRaw === undefined) {
            y2SrcRaw = "fromPv";
        }

        // x
        const xAxis = tdl["xAxis"];
        if (xSrcRaw.includes("AutoScale")) {
            xAxis["autoScale"] = true;
        } else {
            xAxis["autoScale"] = false;
        }

        // y
        for (let ii = 0; ii < tdl["yAxes"].length; ii++) {
            const yAxis = tdl["yAxes"][ii];
            if (useY2Axis.includes(ii)) {
                if (y2SrcRaw.includes("AutoScale")) {
                    yAxis["autoScale"] = true;
                } else {
                    yAxis["autoScale"] = false;
                }
            } else {
                if (ySrcRaw.includes("AutoScale")) {
                    yAxis["autoScale"] = true;
                } else {
                    yAxis["autoScale"] = false;
                }
            }
        }
    };


    static convertEdlXYGraphXYY2AxisStyle = (edl: Record<string, any>, tdl: Record<string, any>) => {
        const useY2AxisRaw = edl["useY2Axis"];
        const useY2Axis: number[] = [];

        if (useY2AxisRaw !== undefined) {
            for (let ii = 0; ii < useY2AxisRaw.length; ii++) {
                const useY2AxisRawElement = useY2AxisRaw[ii];
                const arr = useY2AxisRawElement.split(" ");
                if (arr[0] !== undefined) {
                    const yIndex = parseInt(arr[0]);
                    if (isNaN(yIndex)) {
                        continue;
                    }
                    useY2Axis.push(yIndex);
                }
            }
        }

        let xStyleRaw = edl["xAxisStyle"];
        if (xStyleRaw === undefined) {
            xStyleRaw = "linear";
        }
        let yStyleRaw = edl["yAxisStyle"];
        if (yStyleRaw === undefined) {
            yStyleRaw = "linear";
        }
        let y2StyleRaw = edl["y2AxisStyle"];
        if (y2StyleRaw === undefined) {
            y2StyleRaw = "linear";
        }

        // disgard x, in tdl x is always linear
        // const xAxis = tdl["xAxis"];
        // if (xSrcRaw.includes("AutoScale")) {
        //     xAxis["autoScale"] = true;
        // } else {
        //     xAxis["autoScale"] = false;
        // }

        // y
        for (let ii = 0; ii < tdl["yAxes"].length; ii++) {
            const yAxis = tdl["yAxes"][ii];
            if (useY2Axis.includes(ii)) {
                if (y2StyleRaw.includes("log10")) {
                    yAxis["displayScale"] = "Log10";
                } else {
                    yAxis["displayScale"] = "Linear";
                }
            } else {
                if (yStyleRaw.includes("log10")) {
                    yAxis["displayScale"] = "Log10";
                } else {
                    yAxis["displayScale"] = "Linear";
                }
            }
        }
    };

    static convertEdlXYGraphYY2Label = (edl: Record<string, any>, tdl: Record<string, any>) => {
        const useY2AxisRaw = edl["useY2Axis"];
        const useY2Axis: number[] = [];
        if (useY2AxisRaw !== undefined) {
            for (let ii = 0; ii < useY2AxisRaw.length; ii++) {
                const useY2AxisRawElement = useY2AxisRaw[ii];
                const arr = useY2AxisRawElement.split(" ");
                if (arr[0] !== undefined) {
                    const yIndex = parseInt(arr[0]);
                    if (isNaN(yIndex)) {
                        continue;
                    }
                    useY2Axis.push(yIndex);
                }
            }
        }

        let yLabel = edl["yLabel"];
        if (yLabel === undefined) {
            yLabel = "";
        } else {
            yLabel = yLabel.replaceAll(`"`, "");
        }
        let y2Label = edl["y2Label"];
        if (y2Label === undefined) {
            y2Label = "";
        } else {
            y2Label = y2Label.replaceAll(`"`, "");
        }

        // y
        for (let ii = 0; ii < tdl["yAxes"].length; ii++) {
            const yAxis = tdl["yAxes"][ii];
            if (useY2Axis.includes(ii)) {
                yAxis["label"] = y2Label;
            } else {
                yAxis["label"] = yLabel;
            }
        }
    };

    static convertEdlXYGraphXYMinMaxVal = (edl: Record<string, any>, tdl: Record<string, any>) => {
        function convertEdlVal(name: string, defaultValue: number) {
            let raw = edl[name];
            let val = defaultValue;
            if (raw !== undefined) {
                val = parseFloat(raw.replaceAll(`"`, ""));
                if (isNaN(val)) {
                    val = 0;
                }
            }
            return val;
        }

        const valXmin = convertEdlVal("xMin", 0);
        const valXmax = convertEdlVal("xMax", 1);
        const valYmin = convertEdlVal("yMin", 0);
        const valYmax = convertEdlVal("yMax", 1);
        const valY2min = convertEdlVal("y2Min", 0);
        const valY2max = convertEdlVal("y2Max", 1);

        // x
        tdl["xAxis"]["valMin"] = valXmin;
        tdl["xAxis"]["valMax"] = valXmax;
        // y
        const useY2AxisRaw = edl["useY2Axis"];
        const useY2Axis: number[] = [];
        if (useY2AxisRaw !== undefined) {
            for (let ii = 0; ii < useY2AxisRaw.length; ii++) {
                const useY2AxisRawElement = useY2AxisRaw[ii];
                const arr = useY2AxisRawElement.split(" ");
                if (arr[0] !== undefined) {
                    const yIndex = parseInt(arr[0]);
                    if (isNaN(yIndex)) {
                        continue;
                    }
                    useY2Axis.push(yIndex);
                }
            }
        }
        for (let ii = 0; ii < tdl["yAxes"].length; ii++) {
            const yAxis = tdl["yAxes"][ii];
            if (useY2Axis.includes(ii)) {
                yAxis["valMin"] = valY2min;
                yAxis["valMax"] = valY2max;
            } else {
                yAxis["valMin"] = valYmin;
                yAxis["valMax"] = valYmax;
            }
        }
    };
}
