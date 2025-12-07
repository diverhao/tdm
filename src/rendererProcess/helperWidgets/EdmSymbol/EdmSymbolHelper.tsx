// import { BobPropertyConverter } from "../../../mainProcess/windows/DisplayWindow/BobPropertyConverter";
import { type_rules_tdl, BaseWidgetHelper } from "../../widgets/BaseWidget/BaseWidgetHelper";
// import * as GlobalMethods from "../../../common/GlobalMethods";
import * as fs from "fs";
import { EdlConverter } from "../../../mainProcess/windows/DisplayWindow/EdlConverter";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { GlobalVariables } from "../../global/GlobalVariables";


export type type_Label_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
};

// export type type_TextUpdate_tdl = {
// 	type: string;
// 	widgetKey: string;
// 	key: string;
// 	style: Record<string, any>;
// 	text: Record<string, any>;
// 	channelNames: string[];
// 	groupNames: string[];
// 	rules: type_rules_tdl;
// };

export class EdmSymbolHelper extends BaseWidgetHelper {
    static _defaultTdl: type_Label_tdl = {
        type: "Label",
        widgetKey: "",
        key: "",
        style: {
            // basics
            position: "absolute",
            display: "inline-flex",
            // dimensions
            left: 100,
            top: 100,
            width: 100,
            height: 100,
            backgroundColor: "rgba(255,255,255,0)",
            // angle
            transform: "rotate(0deg)",
            // border
            borderStyle: "solid",
            borderWidth: 0,
            borderColor: "rgba(0, 0, 0, 1)",
            // font
            color: "rgba(0,0,0,1)",
            fontFamily: GlobalVariables.defaultFontFamily,
            fontSize: GlobalVariables.defaultFontSize,
            fontStyle: GlobalVariables.defaultFontStyle,
            fontWeight: GlobalVariables.defaultFontWeight,
            // shows when the widget is selected
            outlineStyle: "none",
            outlineWidth: 1,
            outlineColor: "black",
        },
        text: {
            // text contents
            text: "Labe Text",
            // text align
            horizontalAlign: "flex-start",
            verticalAlign: "flex-start",
            wrapWord: false,
            alarmBorder: true,
            invisibleInOperation: false,
        },
        channelNames: [],
        groupNames: [],
        rules: [],
    };

    // not getDefaultTdl(), always generate a new key
    static generateDefaultTdl = (type: string): Record<string, any> => {
        const result = super.generateDefaultTdl(type);
        result.style = JSON.parse(JSON.stringify(this._defaultTdl.style));
        result.text = JSON.parse(JSON.stringify(this._defaultTdl.text));
        result.channelNames = JSON.parse(JSON.stringify(this._defaultTdl.channelNames));
        result.groupNames = JSON.parse(JSON.stringify(this._defaultTdl.groupNames));
        return result;
    };

    static interceptSymbolFileJSON = (
        symbolFileJSON: Record<string, any>,
        parentColorPv: string | undefined,
        parentFillColor: string,
        parentLineColor: string
    ) => {
        for (let key of Object.keys(symbolFileJSON)) {
            if (key.startsWith("Group_")) {
                const groupWidget = symbolFileJSON[key];
                for (let key2 of Object.keys(groupWidget)) {
                    const obj2 = groupWidget[key2];
                    if (!(key2.startsWith("Group_") && obj2["invisible"].includes("true"))) {
                        if (parentColorPv === undefined) {
                            delete obj2["alarmPv"];
                        } else {
                            obj2["alarmPv"] = parentColorPv;
                        }
                        obj2["fillColor"] = parentFillColor;
                        obj2["lineColor"] = parentLineColor;
                    }
                }
            }
        }
    };

    static convertEdlToTdl = (edl: Record<string, string>, parentEdlFileName: string | undefined) => {
        console.log("\n------------", `Parsing Symbol`, "------------------\n");
        // const tdl = this.generateDefaultTdl("TextUpdate") as type_TextUpdate_tdl;
        // all properties for this widget
        const tdls: Record<string, any> = {};

        const propertyNames: string[] = [
            "beginObjectProperties", // not in tdm
            "major", // not in tdm
            "minor", // not in tdm
            "release", // not in tdm
            "x",
            "y",
            "w",
            "h",
            "file",
            "numStates", // not in tdm
            "minValues",
            "maxValues",
            "controlPvs",
            "colorPv",
            "numPvs", // not in tdm
            "useOriginalColors",
            "fgColor",
            "bgColor",
            "truthTable", // ! not in tdm, what do they do?
            "andMask",
            "xorMask",
            "shiftCount",
            "orientation", // rotateCW, rotateCCW, flipV, flipH
            "endObjectProperties", // not in tdm
        ];

        // create an empty background
        const labelWidgetTdl = this.generateDefaultTdl("Label") as type_Label_tdl;
        labelWidgetTdl["text"]["invisibleInOperation"] = false;
        labelWidgetTdl["text"]["text"] = " ";
        labelWidgetTdl["text"]["alarmBorder"] = false;

        // x is not the top-left corner coordinate, it is the coordinate before CW/CCW rotation
        let x = parseInt(edl["x"]);
        let y = parseInt(edl["y"]);
        const w = parseInt(edl["w"]);
        const h = parseInt(edl["h"]);
        if (edl["orientation"] !== undefined) {
            x = x + (w - h) / 2;
            y = y - (w - h) / 2;
        }
        labelWidgetTdl["style"]["left"] = x;
        labelWidgetTdl["style"]["top"] = y;
        labelWidgetTdl["style"]["width"] = w;
        labelWidgetTdl["style"]["height"] = h;


        const parseTable = (tableName: "andMask" | "xorMask" | "shiftCount") => {
            const result: number[] = [];
            let tableRaw = edl[tableName];
            if (tableRaw === undefined) {
                return result
            }
            for (let valueRaw of tableRaw) {
                const index = parseInt(valueRaw.replaceAll(`"`, "").split(" ")[0]);
                const value = parseInt(valueRaw.replaceAll(`"`, "").split(" ")[1]);
                result[index] = value;
            }
            // the "undefined" values are treated as 0 later
            return result;
        }
        const andMasks = parseTable("andMask");
        const xorMasks = parseTable("xorMask");
        const shiftCounts = parseTable("shiftCount");


        // controls PVs
        const parseControlPvs = () => {
            const result: string[] = [];
            let tableRaw = edl["controlPvs"];
            if (tableRaw === undefined) {
                return result;
            }
            for (let valueRaw of tableRaw) {
                const index = parseInt(valueRaw.replaceAll(`"`, "").split(" ")[0]);
                let value = valueRaw.replaceAll(`"`, "").split(" ")[1].replaceAll(" ", "");
                if (value !== "") {
                    result[index] = value;
                }
            }
            return result;
        }
        const controlPvs = parseControlPvs();

        // symbol visibility expression
        const calcVisibilityExpression = () => {
            let result = "";

            for (let ii = 0; ii < controlPvs.length; ii++) {
                const controlPv = controlPvs[ii];
                if (controlPv !== undefined) {
                    let andMask = andMasks[ii];
                    let xorMask = xorMasks[ii];
                    let shiftCount = shiftCounts[ii];
                    if (andMask === undefined || isNaN(andMask)) {
                        andMask = 0;
                    }
                    if (xorMask === undefined || isNaN(xorMask)) {
                        xorMask = 0;
                    }
                    if (shiftCount === undefined || isNaN(shiftCount)) {
                        shiftCount = 0;
                    }
                    let resultii = "";
                    if (edl["truthTable"] !== undefined) {
                        resultii = `(([${controlPv}] == 0? 0: 1) << ${ii})`;
                        if (result === "") {
                            result = result + resultii;
                        } else {
                            result = result + "+" + resultii;
                        }
                    } else {
                        if (andMask === 0 && xorMask === 0 && shiftCount === 0) {
                            resultii = `[${controlPv}]`;
                        } else {
                            if (andMask !== 0) {
                                resultii = "(" + `[${controlPv}] & ${andMask}` + ")";
                            } else {
                                resultii = `[${controlPv}]`;
                            }
                            resultii = "(" + `${resultii} ^| ${xorMask}` + ")";
                            if (shiftCount < 0) {
                                resultii = "(" + `${resultii} >> ${shiftCount}` + ")";
                            } else {
                                resultii = "(" + `${resultii} << ${shiftCount}` + ")";
                            }
                        }
                        if (result === "") {
                            result = result + resultii;
                        } else {
                            result = result + " | " + resultii;
                        }
                    }
                }
            }

            return "(" + result + ")";
        }
        const visibilityExpression = calcVisibilityExpression();

        // color pv
        let colorPv = undefined;
        const colorPvRaw = edl["colorPv"];
        if (colorPvRaw !== undefined) {
            colorPv = colorPvRaw.replaceAll(`"`, "");
        } else {
        }

        // if any of controlPv's value is not available, show border alarm
        let controlPvUndefineExpr = "";
        for (let controlPv of controlPvs) {
            if (controlPv !== "" && controlPv !== undefined) {
                labelWidgetTdl["channelNames"].push(`${controlPv}`);
                if (controlPvUndefineExpr === "") {
                    controlPvUndefineExpr = `([${controlPv}] == undefined)`;
                } else {
                    controlPvUndefineExpr = controlPvUndefineExpr + ` or ([${controlPv}] == undefined)`;
                }
            }
        }
        labelWidgetTdl["rules"].push({
            boolExpression: controlPvUndefineExpr,
            propertyName: "Alarm Border",
            propertyValue: "true",
            id: uuidv4(),
        });

        // read symbol file
        let symbolFileName = edl["file"].replaceAll(`"`, "");
        if (parentEdlFileName !== undefined && !path.isAbsolute(symbolFileName)) {
            symbolFileName = path.join(path.dirname(parentEdlFileName), symbolFileName);
        }

        let symbolTdl: Record<string, any> = {};
        try {
            const symbolFileContents = fs.readFileSync(symbolFileName, "utf-8");

            const symbolFileContentsLines = symbolFileContents.split(/\r?\n/);
            const symbolFileJSON = EdlConverter.convertEdltoJSON(symbolFileContentsLines, 0);

            // override colors in symbols using new colors
            if (edl["useOriginalColors"] === undefined) {
                this.interceptSymbolFileJSON(symbolFileJSON, edl["colorPv"], edl["bgColor"], edl["fgColor"]);
            }
            EdlConverter.parseEdl(symbolFileJSON, symbolTdl);
            delete symbolTdl["Canvas"];
        } catch (e) {
            console.log("Failed to read symbol file", symbolFileName);
            return [];
        }

        const symbolGroups: Record<string, Record<string, any>[]> = {};
        for (let widgetTdl of Object.values(symbolTdl)) {
            const groupNames = widgetTdl["groupNames"];
            if (groupNames !== undefined) {
                const groupName = widgetTdl["groupNames"][0];
                if (groupName !== undefined) {
                    if (symbolGroups[groupName] === undefined) {
                        symbolGroups[groupName] = [];
                    }
                    symbolGroups[groupName].push(widgetTdl);
                }
            }
        }

        // sort groups according to geometric sequence
        const sortFun = (symbolGroup1: Record<string, any>[], symbolGroup2: Record<string, any>[]) => {
            let symbolGroup1Dimension = [0, 0, 0, 0];
            for (let jj = 0; jj < symbolGroup1.length; jj++) {
                const widgetTdl = symbolGroup1[jj];
                if ((widgetTdl["widgetKey"] as string).startsWith("Rectangle") && widgetTdl["text"]["invisibleInOperation"] === true) {
                    symbolGroup1Dimension = [
                        widgetTdl["style"]["left"],
                        widgetTdl["style"]["top"],
                        widgetTdl["style"]["width"],
                        widgetTdl["style"]["height"],
                    ];
                    break;
                }
            }
            let symbolGroup2Dimension = [0, 0, 0, 0];
            for (let jj = 0; jj < symbolGroup2.length; jj++) {
                const widgetTdl = symbolGroup2[jj];
                if ((widgetTdl["widgetKey"] as string).startsWith("Rectangle") && widgetTdl["text"]["invisibleInOperation"] === true) {
                    symbolGroup2Dimension = [
                        widgetTdl["style"]["left"],
                        widgetTdl["style"]["top"],
                        widgetTdl["style"]["width"],
                        widgetTdl["style"]["height"],
                    ];
                    break;
                }
            }
            return symbolGroup1Dimension[0] - symbolGroup2Dimension[0];
        };

        const symbolGroupsArray = Object.values(symbolGroups);
        symbolGroupsArray.sort(sortFun);

        // update dimensions: x, y, width, height for all widgets
        let maxW = 0;
        let maxH = 0;
        for (let symbolGroup of symbolGroupsArray) {
            for (let widgetTdl of symbolGroup) {
                if ((widgetTdl["widgetKey"] as string).startsWith("Rectangle") && widgetTdl["text"]["invisibleInOperation"] === true) {
                    maxW = Math.max(maxW, widgetTdl["style"]["width"]);
                    maxH = Math.max(maxH, widgetTdl["style"]["height"]);
                }
            }
        }

        // const symbolGroupDimensions : Record<string, any> = {};
        // resize the symbol widgets
        for (let symbolGroup of symbolGroupsArray) {
            let symbolGroupDimension = [0, 0, 1, 1];
            for (let widgetTdl of symbolGroup) {
                if ((widgetTdl["widgetKey"] as string).startsWith("Rectangle") && widgetTdl["text"]["invisibleInOperation"] === true) {
                    const oldWidth = symbolGroupDimension[2];
                    const oldHeight = symbolGroupDimension[3];
                    const width = widgetTdl["style"]["width"];
                    const height = widgetTdl["style"]["height"];
                    if (width >= oldWidth && height >= oldHeight) {
                        symbolGroupDimension = [
                            widgetTdl["style"]["left"],
                            widgetTdl["style"]["top"],
                            widgetTdl["style"]["width"],
                            widgetTdl["style"]["height"],
                        ];
                    }
                    // const groupName = widgetTdl["groupNames"][0];
                    // symbolGroupDimensions[groupName] = symbolGroupDimension;
                    // break;
                }
            }
            for (let widgetTdl of symbolGroup) {
                widgetTdl["style"]["left"] = x + ((widgetTdl["style"]["left"] - symbolGroupDimension[0]) * w) / maxW;
                widgetTdl["style"]["top"] = y + ((widgetTdl["style"]["top"] - symbolGroupDimension[1]) * h) / maxH;
                widgetTdl["style"]["width"] = (widgetTdl["style"]["width"] / maxW) * w;
                widgetTdl["style"]["height"] = (widgetTdl["style"]["height"] / maxH) * h;
                // scale polyline points
                // console.log(widgetTdl["widgetKey"]);
                if ((widgetTdl["widgetKey"] as string).startsWith("Polyline")) {
                    for (let ii = 0; ii < widgetTdl["pointsX"].length; ii++) {
                        widgetTdl["pointsX"][ii] = (widgetTdl["pointsX"][ii] * w) / maxW;
                    }
                    for (let ii = 0; ii < widgetTdl["pointsY"].length; ii++) {
                        widgetTdl["pointsY"][ii] = (widgetTdl["pointsY"][ii] * h) / maxH;
                    }
                }
            }
        }
        // console.log(JSON.stringify(symbolGroupsArray, null, 4));

        // -------------------------- min and max values --------------------------
        const minValuesRaw = edl["minValues"];
        const minValues: number[] = [];
        if (minValuesRaw !== undefined) {
            for (let ii = 0; ii < minValuesRaw.length; ii++) {
                const valueRaw = minValuesRaw[ii];
                if (valueRaw !== undefined) {
                    const indexStrRaw = valueRaw.split(" ")[0];
                    const valueStrRaw = valueRaw.split(" ")[1];

                    if (indexStrRaw !== undefined && valueStrRaw !== undefined) {
                        let index = EdlConverter.convertEdlNumber(indexStrRaw);
                        minValues[index] = EdlConverter.convertEdlNumber(valueStrRaw);
                    }
                }
            }
        }

        const maxValuesRaw = edl["maxValues"];
        const maxValues: number[] = [];
        if (maxValuesRaw !== undefined) {
            for (let ii = 0; ii < maxValuesRaw.length; ii++) {
                const valueRaw = maxValuesRaw[ii];
                if (valueRaw !== undefined) {
                    const indexStrRaw = valueRaw.split(" ")[0];
                    const valueStrRaw = valueRaw.split(" ")[1];
                    if (indexStrRaw !== undefined && valueStrRaw !== undefined) {
                        let index = EdlConverter.convertEdlNumber(indexStrRaw);
                        maxValues[index] = EdlConverter.convertEdlNumber(valueStrRaw);
                    }
                }
            }
        }

        const valuesLength = Math.max(maxValues.length, minValues.length);
        while (minValues.length !== valuesLength) {
            minValues.push(0);
        }
        while (maxValues.length !== valuesLength) {
            maxValues.push(0);
        }

        for (let ii = 0; ii < minValues.length; ii++) {
            if (minValues[ii] === undefined) {
                minValues[ii] = 0;
            }
            if (maxValues[ii] === undefined) {
                maxValues[ii] = 0;
            }
        }
        // ------------------------

        // console.log(minValues, maxValues, controlPv);

        let fallbackCondition = "false";
        for (let ii = 0; ii < minValues.length; ii++) {
            if (fallbackCondition === "") {
                fallbackCondition = `(${visibilityExpression} >= ${minValues[ii]} and ${visibilityExpression} < ${maxValues[ii]})`;
            } else {
                fallbackCondition = `${fallbackCondition} or (${visibilityExpression} >= ${minValues[ii]} and ${visibilityExpression} < ${maxValues[ii]})`;
            }
        }
        fallbackCondition = `not (${fallbackCondition})`;
        const result: Record<string, any>[] = [labelWidgetTdl];

        if (visibilityExpression === "") {
            // always show symbol #1, if #1 does not exist, show nothing
            const symbolGroup = symbolGroupsArray[1];
            if (symbolGroup !== undefined) {
                for (let ii = 0; ii < symbolGroup.length; ii++) {
                    const widgetTdl = symbolGroup[ii];
                    if (!widgetTdl["widgetKey"].includes("Rectangle") || widgetTdl["text"]["invisibleInOperation"] !== true) {
                        // only push the contents
                        result.push(widgetTdl);
                    } else {
                        // do not push the virtual rectangle
                    }
                }
            }
        } else if (visibilityExpression !== "") {
            // (1) hide all symbols by default
            // (2) show the symbol that satisfies the condition
            // (3) if no condition is satisfied, or the controlPv is not available at runtime, show the 0th symbol
            for (let ii = 0; ii < symbolGroupsArray.length; ii++) {
                const symbolGroup = symbolGroupsArray[ii];
                for (let widgetTdl of symbolGroup) {
                    if (!widgetTdl["widgetKey"].includes("Rectangle") || widgetTdl["text"]["invisibleInOperation"] !== true) {
                        // (1)
                        widgetTdl["text"]["invisibleInOperation"] = true;

                        // (2)
                        // add conditions when (1) the controlPv is defined in edm,
                        // and (2) there is a value pair for this symbol
                        if (minValues[ii] !== undefined && visibilityExpression !== "") {
                            widgetTdl["rules"].push({
                                boolExpression: `${visibilityExpression} >= ${minValues[ii]} and ${visibilityExpression} < ${maxValues[ii]}`,
                                propertyName: "Invisible in Operation",
                                propertyValue: "false",
                                id: uuidv4(),
                            });
                        }
                    }
                    result.push(widgetTdl);
                }
            }

            // (3)
            const fallbackGroupNumber = 0;
            if (symbolGroupsArray[fallbackGroupNumber] !== undefined) {
                for (let widgetTdl of symbolGroupsArray[fallbackGroupNumber]) {
                    if (widgetTdl["widgetKey"].includes("Rectangle") && widgetTdl["style"]["left"] === x && widgetTdl["style"]["top"] === y && widgetTdl["style"]["width"] === w && widgetTdl["style"]["height"] === h) {
                        continue;
                    }
                    widgetTdl["rules"].push({
                        boolExpression: fallbackCondition,
                        propertyName: "Invisible in Operation",
                        propertyValue: "false",
                        id: uuidv4(),
                    });
                    widgetTdl["rules"].push({
                        boolExpression: controlPvUndefineExpr,
                        propertyName: "Invisible in Operation",
                        propertyValue: "false",
                        id: uuidv4(),
                    });
                }
                // }
            }
        }

        // set orientation
        if (edl["orientation"] !== undefined) {
            let angle = "rotate(0deg)";
            if (edl["orientation"].includes("rotateCW")) {
                angle = "rotate(90deg)";
            } else if (edl["orientation"].includes("rotateCCW")) {
                angle = "rotate(270deg)";
            } else if (edl["orientation"].includes("FlipH")) {
                angle = "scaleX(-1)";
            } else if (edl["orientation"].includes("FlipV")) {
                angle = "scaleY(-1)";
            }

            // skip the first widget, it is the "Label" widget showing alarm border
            for (let ii = 1; ii < result.length; ii++) {
                let widgetTdl = result[ii];
                widgetTdl["style"]["transform"] = angle;
                const x1 = widgetTdl["style"]["left"];
                const y1 = widgetTdl["style"]["top"];
                const w1 = widgetTdl["style"]["width"];
                const h1 = widgetTdl["style"]["height"];
                if (edl["orientation"].includes("rotateCW")) {
                    widgetTdl["style"]["left"] = x + h - (y1 - y) - h1 - (w1 - h1) / 2;
                    widgetTdl["style"]["top"] = y + x1 - x + (w1 - h1) / 2;
                } else if (edl["orientation"].includes("rotateCCW")) {
                    widgetTdl["style"]["left"] = x + y1 - y - (w1 - h1) / 2;
                    widgetTdl["style"]["top"] = y + w - (x1 - x) - w1 + (w1 - h1) / 2;
                } else if (edl["orientation"].includes("FlipH")) {
                    widgetTdl["style"]["left"] = 2 * x + w - x1 - w1;
                    // widgetTdl["style"]["top"] = y + w - (x1 - x) - w1 + (w1 - h1) / 2;
                } else if (edl["orientation"].includes("FlipV")) {
                    widgetTdl["style"]["top"] = 2 * y + h - y1 - h1;
                }
            }
        }

        return result;
    };
}
