import { BaseWidgetRules } from "./BaseWidgetRules";
import * as React from "react";
import { ElementButton } from "../../helperWidgets/SharedElements/MacrosTable";
import { RuleComponent } from "../../helperWidgets/RuleComponents/RuleComponent";
import { g_widgets1, getBasePath } from "../../global/GlobalVariables";
import { Canvas } from "../../helperWidgets/Canvas/Canvas";
import { evaluate } from "mathjs";
import { GlobalVariables } from "../../../common/GlobalVariables";
import { RuleAngle } from "../../helperWidgets/RuleComponents/RuleAngle";
import { RuleEmbeddedDisplaySelectTabIndex } from "../../helperWidgets/RuleComponents/RuleEmbeddedDisplaySelectTabIndex";
import { BaseWidget } from "./BaseWidget";
import { Log } from "../../../common/Log";
import { RuleInputComponent } from "../../helperWidgets/RuleComponents/RuleInputComponent";
import { RuleColorComponent } from "../../helperWidgets/RuleComponents/RuleColorComponent";
import { RuleChoicesComponent } from "../../helperWidgets/RuleComponents/RuleChoicesComponent";
import { RuleCheckBoxComponent } from "../../helperWidgets/RuleComponents/RuleCheckBoxComponent";
import { FontsData } from "../../global/FontsData";

export type type_rule_tdl = {
    boolExpression: string;
    propertyName: string;
    // ! alwasy string, it may contain PV name, must be converted to the corresponding value: number, boolean or others
    propertyValue: string | undefined;
    id: string;
};

export abstract class BaseWidgetRule {
    _rules: BaseWidgetRules;
    _index: number;
    _ruleComponent: RuleComponent | undefined;
    /**
     * Types of rules in this BaseWidgetRule.
     */
    _ruleComponentTypes: string[] = [];
    _ruleComponentTypesMap: Record<string, string> = {};

    // bool expression
    _channelNamesInBoolExpression: string[] = [];
    _expandedChannelNamesInBoolExpression: string[] = [];
    _channelNameIndicesInBoolExpression: number[] = [];
    _boolExpressionArray: (string | number)[] = [];
    // property value
    _channelNamesInPropertyValue: string[] = [];
    _expandedChannelNamesInPropertyValue: string[] = [];
    _channelNameIndicesInPropertyValue: number[] = [];
    _propertyValueArray: (string | number)[] = [];

    constructor(index: number, baseWidgetRules: BaseWidgetRules) {
        this._rules = baseWidgetRules;
        this._index = index;

        // all rule component types, remove the un-needed types in sub-class using this.removeRuleComponentTypes()
        this._ruleComponentTypes = [];
    }

    // --------------------------- rule component ------------------------

    /**
     * Contains all rule types
     *
     * Obtain a function that creates a rule type object. <br>
     *
     * The name of each property matches with its name of SidebarXXX, e.g. "RuleBackgroundColor" has
     * a "BackgroundColor" name below, and the corresponding sidebar component is "SidebarBackgroundColor"
     */
    static createRuleComponent = (rule: BaseWidgetRule): Record<string, () => any> => {
        const ruleComponents = {
            RuleX: () => {
                // return new RuleX(rule);
                return new RuleInputComponent(rule, "style", "left", "number");
            },
            RuleY: () => {
                // return new RuleY(rule);
                return new RuleInputComponent(rule, "style", "top", "number");
            },
            RuleWidth: () => {
                // return new RuleWidth(rule);
                return new RuleInputComponent(rule, "style", "width", "number");
            },
            RuleHeight: () => {
                // return new RuleHeight(rule);
                return new RuleInputComponent(rule, "style", "height", "number");
            },
            RuleAngle: () => {
                return new RuleAngle(rule);
            },
            RuleBackgroundColor: () => {
                // return new RuleBackgroundColor(rule);
                return new RuleColorComponent(rule, "style", "backgroundColor");
            },
            RuleColor: () => {
                // return new RuleColor(rule);
                return new RuleColorComponent(rule, "style", "color");
            },
            RuleBorderColor: () => {
                // return new RuleBorderColor(rule);
                return new RuleColorComponent(rule, "style", "borderColor");
            },
            RuleBorderWidth: () => {
                // return new RuleBorderWidth(rule);
                return new RuleInputComponent(rule, "style", "borderWidth", "number");
            },
            RuleLineWidth: () => {
                // return new RuleLineWidth(rule);
                return new RuleInputComponent(rule, "text", "lineWidth", "number");
            },
            RuleLineColor: () => {
                // return new RuleLineColor(rule);
                return new RuleColorComponent(rule, "text", "lineColor");
            },
            RuleLineStyle: () => {
                // return new RuleLineStyle(rule);
                return new RuleChoicesComponent(rule, "text", "lineStyle", "string",
                    {
                        Solid: "solid",
                        Dashed: "dashed",
                        Dotted: "dotted",
                        "Dash Dot": "dash-dot",
                        "Dash Dot Dot": "dash-dot-dot"
                    }
                )
            },
            RuleShowArrowHead: () => {
                // return new RuleShowArrowHead(rule);
                return new RuleCheckBoxComponent(rule, "text", "showArrowHead");
            },
            RuleShowArrowTail: () => {
                // return new RuleShowArrowTail(rule);
                return new RuleCheckBoxComponent(rule, "text", "showArrowTail");
            },
            RuleFillColor: () => {
                // return new RuleFillColor(rule);
                return new RuleColorComponent(rule, "text", "fillColor");
            },
            RuleInvisibleInOperation: () => {
                // return new RuleInvisibleInOperation(rule);
                return new RuleCheckBoxComponent(rule, "text", "invisibleInOperation");
            },
            RulePolylineSmootherize: () => {
                // return new RulePolylineSmootherize(rule);
                return new RuleCheckBoxComponent(rule, "text", "smootherize");
            },
            RulePolylineFill: () => {
                // return new RulePolylineFill(rule);
                return new RuleCheckBoxComponent(rule, "text", "fill");
            },
            RulePolylineClosed: () => {
                // return new RulePolylineClosed(rule);
                return new RuleCheckBoxComponent(rule, "text", "closed");
            },
            RulePolylineArrowLength: () => {
                // return new RulePolylineArrowLength(rule);
                return new RuleInputComponent(rule, "text", "arrowLength", "number");
            },
            RulePolylineArrowWidth: () => {
                // return new RulePolylineArrowWidth(rule);
                return new RuleInputComponent(rule, "text", "arrowWidth", "number");
            },
            RuleFontSize: () => {
                // return new RuleFontSize(rule);
                return new RuleChoicesComponent(rule, "style", "fontSize", "number", Object.fromEntries(FontsData.g_fontSizes.map((n) => [`${n}`, `${n}`])))
            },
            RuleText: () => {
                // return new RuleText(rule);
                return new RuleInputComponent(rule, "text", "text", "string");
            },
            RuleWrapWord: () => {
                // return new RuleWrapWord(rule);
                return new RuleCheckBoxComponent(rule, "text", "wrapWord");
            },
            RuleAlarmBorder: () => {
                // return new RuleAlarmBorder(rule);
                return new RuleCheckBoxComponent(rule, "text", "alarmBorder");
            },
            RuleArcAngleStart: () => {
                // return new RuleArcAngleStart(rule);
                return new RuleInputComponent(rule, "text", "angleStart", "number");
            },
            RuleArcAngleRange: () => {
                // return new RuleArcAngleRange(rule);
                return new RuleInputComponent(rule, "text", "angleRange", "number");
            },
            RuleArcShowRadius: () => {
                // return new RuleArcShowRadius(rule);
                return new RuleChoicesComponent(rule, "text", "showRadius", "string",
                    {
                        None: "none",
                        Radius: "radius",
                        Secant: "secant",
                    }
                )
            },
            RuleXAlign: () => {
                // return new RuleXAlign(rule);
                return new RuleChoicesComponent(rule, "text", "horizontalAlign", "string",
                    {
                        Left: "flex-start",
                        Center: "center",
                        Right: "flex-end",
                    }
                )
            },
            RuleYAlign: () => {
                // return new RuleYAlign(rule);
                return new RuleChoicesComponent(rule, "text", "verticalAlign", "string",
                    {
                        Top: "flex-start",
                        Middle: "center",
                        Bottom: "flex-end",
                    }
                )
            },
            RuleSlideButtonBoxWidth: () => {
                // return new RuleSlideButtonBoxWidth(rule);
                return new RuleInputComponent(rule, "text", "boxWidth", "number");
            },
            RuleShowUnit: () => {
                // return new RuleShowUnit(rule);
                return new RuleCheckBoxComponent(rule, "text", "showUnit");
            },
            RuleChoiceButtonUseChannelItems: () => {
                // return new RuleChoiceButtonUseChannelItems(rule);
                return new RuleCheckBoxComponent(rule, "text", "useChannelItems");
            },
            RuleBooleanButtonUsePictures: () => {
                // return new RuleBooleanButtonUsePictures(rule);
                return new RuleCheckBoxComponent(rule, "text", "usePictures");
            },
            RuleBooleanButtonShowLED: () => {
                // return new RuleBooleanButtonShowLED(rule);
                return new RuleCheckBoxComponent(rule, "text", "showLED");
            },
            RuleLEDBit: () => {
                // return new RuleLEDBit(rule);
                return new RuleInputComponent(rule, "text", "bit", "number");
            },
            RuleLEDFallbackColor: () => {
                // return new RuleLEDFallbackColor(rule);
                return new RuleColorComponent(rule, "text", "fallbackColor");
            },
            RuleChoiceButtonUnselectedBackgroundColor: () => {
                // return new RuleChoiceButtonUnselectedBackgroundColor(rule);
                return new RuleColorComponent(rule, "text", "unselectedBackgroundColor");
            },
            RuleChoiceButtonSelectedBackgroundColor: () => {
                // return new RuleChoiceButtonSelectedBackgroundColor(rule);
                return new RuleColorComponent(rule, "text", "selectedBackgroundColor");
            },
            RuleCheckBoxSize: () => {
                // return new RuleCheckBoxSize(rule);
                return new RuleInputComponent(rule, "text", "size", "number");
            },
            RuleSlideButtonBoxRatio: () => {
                // return new RuleSlideButtonBoxRatio(rule);
                return new RuleInputComponent(rule, "text", "boxRatio", "number");
            },
            RuleProgressBarBackgroundColor: () => {
                // return new RuleProgressBarBackgroundColor(rule);
                return new RuleColorComponent(rule, "text", "backgroundColor");
            },
            RuleHighlightBackgroundColor: () => {
                // return new RuleHighlightBackgroundColor(rule);
                return new RuleColorComponent(rule, "text", "highlightBackgroundColor");
            },
            RuleMaxPvValue: () => {
                // return new RuleMaxPvValue(rule);
                return new RuleInputComponent(rule, "text", "maxPvValue", "number");
            },
            RuleMinPvValue: () => {
                // return new RuleMinPvValue(rule);
                return new RuleInputComponent(rule, "text", "minPvValue", "number");
            },
            RuleUsePvLimits: () => {
                // return new RuleUsePvLimits(rule);
                return new RuleCheckBoxComponent(rule, "text", "usePvLimits");
            },
            RuleSliderBlockWidth: () => {
                // return new RuleSliderBlockWidth(rule);
                return new RuleInputComponent(rule, "text", "sliderBlockWidth", "number");
            },
            RuleDirection: () => {
                // return new RuleDirection(rule);
                return new RuleChoicesComponent(rule, "text", "direction", "string",
                    {
                        Horizontal: "horizontal",
                        Vertical: "vertical",
                    }
                )
            },
            RuleShowPvValue: () => {
                // return new RuleShowPvValue(rule);
                return new RuleCheckBoxComponent(rule, "text", "showPvValue");
            },
            RuleStepSize: () => {
                // return new RuleStepSize(rule);
                return new RuleInputComponent(rule, "text", "stepSize", "number");
            },
            RuleUseLogScale: () => {
                // return new RuleUseLogScale(rule);
                return new RuleCheckBoxComponent(rule, "text", "useLogScale");
            },
            RuleInvalidSeverityColor: () => {
                // return new RuleInvalidSeverityColor(rule);
                return new RuleColorComponent(rule, "text", "invalidSeverityColor");
            },
            RuleMajorSeverityColor: () => {
                // return new RuleMajorSeverityColor(rule);
                return new RuleColorComponent(rule, "text", "majorSeverityColor");
            },
            RuleMinorSeverityColor: () => {
                // return new RuleMinorSeverityColor(rule);
                return new RuleColorComponent(rule, "text", "minorSeverityColor");
            },
            RuleMeterAngleRange: () => {
                // return new RuleMeterAngleRange(rule);
                return new RuleInputComponent(rule, "text", "angleRange", "number");
            },
            RuleMeterDialColor: () => {
                // return new RuleMeterDialColor(rule);
                return new RuleColorComponent(rule, "text", "dialColor");
            },
            RuleMeterDialPercentage: () => {
                // return new RuleMeterDialPercentage(rule);
                return new RuleInputComponent(rule, "text", "dialPercentage", "number");
            },
            RuleMeterDialThickness: () => {
                // return new RuleMeterDialThickness(rule);
                return new RuleInputComponent(rule, "text", "dialThickness", "number");
            },
            RuleMeterPointerColor: () => {
                // return new RuleMeterPointerColor(rule);
                return new RuleColorComponent(rule, "text", "pointerColor");
            },
            RuleMeterPointerLengthPercentage: () => {
                // return new RuleMeterPointerLengthPercentage(rule);
                return new RuleInputComponent(rule, "text", "pointerLengthPercentage", "number");
            },
            RuleMeterPointerThickness: () => {
                // return new RuleMeterPointerThickness(rule);
                return new RuleInputComponent(rule, "text", "pointerThickness", "number");
            },
            RuleMeterLabelPositionPercentage: () => {
                // return new RuleMeterLabelPositionPercentage(rule);
                return new RuleInputComponent(rule, "text", "labelPositionPercentage", "number");
            },
            RuleMeterDialFontColor: () => {
                // return new RuleMeterDialFontColor(rule);
                return new RuleColorComponent(rule, "text", "dialFontColor");
            },
            RuleMeterDialFontSize: () => {
                // return new RuleMeterDialFontSize(rule);
                return new RuleChoicesComponent(rule, "text", "dialFontSize", "number", Object.fromEntries(FontsData.g_fontSizes.map((n) => [`${n}`, `${n}`])))
            },
            RuleTankShowLabels: () => {
                // return new RuleTankShowLabels(rule);
                return new RuleCheckBoxComponent(rule, "text", "showLabels");
            },
            RuleThermometerBulbDiameter: () => {
                // return new RuleThermometerBulbDiameter(rule);
                return new RuleInputComponent(rule, "text", "bulbDiameter", "number");
            },
            RuleThermometerTubeWidth: () => {
                // return new RuleThermometerTubeWidth(rule);
                return new RuleInputComponent(rule, "text", "tubeWidth", "number");
            },
            RuleThermometerWallThickness: () => {
                // return new RuleThermometerWallThickness(rule);
                return new RuleInputComponent(rule, "text", "wallThickness", "number");
            },
            RuleThermometerWallColor: () => {
                // return new RuleThermometerWallColor(rule);
                return new RuleColorComponent(rule, "text", "wallColor");
            },
            RuleLEDShape: () => {
                // return new RuleLEDShape(rule);
                return new RuleChoicesComponent(rule, "text", "dialFontSize", "number",
                    {
                        Round: "round",
                        Square: "square",
                    }
                )
            },
            RuleLEDMultiStateFallbackText: () => {
                // return new RuleLEDMultiStateFallbackText(rule);
                return new RuleInputComponent(rule, "text", "fallbackText", "string");
            },
            RuleByteMonitorBitStart: () => {
                // return new RuleByteMonitorBitStart(rule);
                return new RuleInputComponent(rule, "text", "bitStart", "number");
            },
            RuleByteMonitorBitLength: () => {
                // return new RuleByteMonitorBitLength(rule);
                return new RuleInputComponent(rule, "text", "bitLength", "number");
            },
            RuleByteMonitorSequence: () => {
                // return new RuleByteMonitorSequence(rule);
                return new RuleChoicesComponent(rule, "text", "sequence", "string",
                    {
                        Positive: "positive",
                        Reverse: "reverse",
                    }
                )
            },
            RuleRectangleCornerWidth: () => {
                // return new RuleRectangleCornerWidth(rule);
                return new RuleInputComponent(rule, "text", "cornerWidth", "number");
            },
            RuleRectangleCornerHeight: () => {
                // return new RuleRectangleCornerHeight(rule);
                return new RuleInputComponent(rule, "text", "cornerHeight", "number");
            },
            RulePictureOpacity: () => {
                // return new RulePictureOpacity(rule);
                return new RuleInputComponent(rule, "text", "opacity", "number");
            },
            RulePictureStretchToFit: () => {
                // return new RulePictureStretchToFit(rule);
                return new RuleCheckBoxComponent(rule, "text", "stretchToFit");
            },
            RuleMediaDefaultFileName: () => {
                // return new RuleMediaDefaultFileName(rule);
                return new RuleInputComponent(rule, "text", "fileName", "string");
            },
            RuleBooleanButtonOnColor: () => {
                // return new RuleBooleanButtonOnColor(rule);
                return new RuleColorComponent(rule, "text", "onColor");
            },
            RuleBooleanButtonOffColor: () => {
                // return new RuleBooleanButtonOffColor(rule);
                return new RuleColorComponent(rule, "text", "offColor");
            },
            RuleOutlineColor: () => {
                // return new RuleOutlineColor(rule);
                return new RuleColorComponent(rule, "style", "outlineColor");
            },
            RuleOutlineStyle: () => {
                // return new RuleOutlineStyle(rule);
                return new RuleChoicesComponent(rule, "style", "outlineStyle", "string",
                    {
                        Solid: "solid",
                        None: "none",
                    }
                )
            },
            RuleOutlineWidth: () => {
                // return new RuleOutlineWidth(rule);
                return new RuleInputComponent(rule, "style", "outlineWidth", "number");
            },
            RuleEmbeddedDisplaySelectTabIndex: () => {
                return new RuleEmbeddedDisplaySelectTabIndex(rule);
            },
            RuleImageXmin: () => {
                // return new RuleImageXmin(rule);
                return new RuleInputComponent(rule, "text", "xMin", "number");
            },
        };
        return ruleComponents;
    };

    /** Invoked when the rule type is changed on the sidebar, i.e. when we select a new type,
     * or adding a new rule. The tdl property name should have been updated. <br>
     *
     * (1) create a new rule component according to the tdl, replace the old rule component <br>
     *
     * (2) update property value in ruleTdl <br>
     *
     * @param {boolean} useWidgetValue - If true, it gets the widget's current value and use it in rule;
     * if false, it will get the value from rult tdl.
     */
    renewRuleComponent = (useWidgetValue: boolean = false) => {
        let newRuleComponent: any;
        let widgetValue: any;

        // internal type name: e.g. "backgroundColor"
        const ruleType = this.getPropertyName();

        // human readable name: e.g. "Background Color"
        // if (!BaseWidgetRule.translateTypes(this.getRuleComponentTypes()).includes(ruleType)) {
        if (!this.getRuleComponentTypes().includes(ruleType)) {
            return;
        } else {
            // convert human-readable type name to internal type name
            const internalRuleType = this.mapRuleComponentType(ruleType);
            if (BaseWidgetRule.createRuleComponent(this)[internalRuleType] !== undefined) {
                newRuleComponent = BaseWidgetRule.createRuleComponent(this)[internalRuleType]();
            } else {
                Log.error("Error! No creation function for", ruleType);
                return;
            }
            // when we create a new rule, use widget's current value
            if (useWidgetValue) {
                widgetValue = newRuleComponent.getWidgetValue();
                // newRuleComponent.updateRuleTdl(undefined, widgetValue);
                this.setPropertyValue(widgetValue);
            }
            this.setRuleComponent(newRuleComponent);
        }
    };

    mapRuleComponentType = (ruleSpecificType: string) => {
        return this.getRuleComponentTypesMap()[ruleSpecificType];
    };

    getRuleComponent = () => {
        return this._ruleComponent;
    };
    setRuleComponent = (newRuleComponent: RuleComponent) => {
        this._ruleComponent = newRuleComponent;
    };

    addRuleComponentTypes = (newRuleComponentTypes: string[]) => {
        this.getRuleComponentTypes().push(...newRuleComponentTypes);
    };

    // ------------------ internal data operations ---------------------------

    resetStuff = () => {
        this._channelNamesInBoolExpression = [];
        this._channelNameIndicesInBoolExpression = [];
        this._expandedChannelNamesInBoolExpression = [];
        this._boolExpressionArray = [];

        this._channelNamesInPropertyValue = [];
        this._channelNameIndicesInPropertyValue = [];
        this._expandedChannelNamesInPropertyValue = [];
        this._propertyValueArray = [];
    };

    /**
     * Break the string to array of strings and numbers. The sub-string inside square brackets are parsed as
     * PV names. <br>
     *
     * For example. `sin([val1]) > 99 * [val2]` is broken into an array [`sin(`, 0, `) > 99 * `, 1], where the pv names are
     * [`val1`, `val2`]; the indices are [1, 3], which means the `val1` is at index 1 and `val2` is at index 3 in the array. <br>
     */
    parseString = (str: string) => {
        let inside = false;
        let pvName = "";
        let rest = "";
        let pvNames: string[] = [];
        let result: (string | number)[] = [];
        let indices: number[] = [];
        let bracketCount = 0;

        for (let ii = 0; ii < str.length; ii++) {
            const c = str[ii];
            if (c === "[") {
                bracketCount++;
                inside = true;
                if (rest !== "") {
                    result.push(rest);
                    rest = "";
                }
                continue;
            } else if (c === "]") {
                bracketCount--;
                inside = false;
                pvNames.push(pvName);
                pvName = "";
                result.push(pvNames.length - 1);
                indices.push(result.length - 1);
                continue;
            } else {
                if (inside) {
                    pvName = `${pvName}${c}`;
                } else {
                    rest = `${rest}${c}`;
                }
            }
        }
        // unbalanced pv names
        if (bracketCount !== 0) {
            return {
                pvNames: [],
                result: [],
                indices: [],
            };
        }
        result.push(rest);
        return {
            pvNames: pvNames,
            result: result,
            indices: indices,
        };
    };

    /**
     * Parse bool expression to internal data structures. <br>
     *
     * Invoked when the display window is set to operating mode.
     *
     */
    parseBoolExpression = () => {
        const boolExpression = this.getBoolExpression();
        if (boolExpression === undefined) {
            return;
        }
        const result = this.parseString(boolExpression);
        this._channelNamesInBoolExpression = result.pvNames;
        this.expandChannelNamesInBoolExpression();
        this._boolExpressionArray = result.result;
        this._channelNameIndicesInBoolExpression = result.indices;
    };

    /**
     * Expand the bool expression. Extract and expand the PV names. <br>
     *
     * Invoked when the display is changed to operation.
     */
    parsePropertyValue = () => {
        const propertyValue = this.getPropertyValue();
        if (propertyValue === undefined) {
            return;
        }
        const result = this.parseString(`${propertyValue}`);

        this._channelNamesInPropertyValue = result.pvNames;
        this.expandChannelNamesInPropertyValue();
        this._propertyValueArray = result.result;
        this._channelNameIndicesInPropertyValue = result.indices;
    };

    /**
     * Evaluate bool expression <br>
     *
     * @returns {boolean}
     */
    evaluateBoolExpression = (): boolean => {
        if (g_widgets1.isEditing()) {
            return false;
        }
        const tmp: any[] = [...this.getBoolExpressionArray()];
        const channelNames = this.getExpandedChannelNamesInBoolExpression();
        for (let index = 0; index < channelNames.length; index++) {
            let channelName = channelNames[index];
            // in some cases channelName is just a number
            if (!isNaN(parseFloat(channelName))) {
                tmp[this._channelNameIndicesInBoolExpression[index]] = `${parseFloat(channelName)}`;
                continue;
            }
            try {
                const value = g_widgets1.getChannelValue(channelName, true);
                tmp[this._channelNameIndicesInBoolExpression[index]] = `${value}`;
            } catch (e) {
                Log.error(e);
                return false;
            }
        }
        try {
            const result = evaluate(tmp.join(""));
            if (typeof result !== "boolean") {
                return false;
            } else {
                return result;
            }
        } catch (e) {
            return false;
        }
    };

    /**
     * Evaluate the property value expression
     *
     * If the returned result is "undefined", this rule's value will be ignored. Depending on the rule's type,
     * it may return a style or text for the widget.
     */
    evaluatePropertyValue = (): { style?: Record<string, any>; text?: Record<string, any> } | undefined => {
        if (g_widgets1.isEditing()) {
            return undefined;
        }
        const tmp: any[] = [...this.getPropertyValueArray()];
        const channelNames = this.getExpandedChannelNamesInPropertyValue();

        for (let index = 0; index < channelNames.length; index++) {
            const channelName = channelNames[index];
            try {
                // const tcaChannel = g_widgets1.getTcaChannel(channelName);
                // const dbrData = tcaChannel.getDbrData();
                // const value = dbrData["value"];
                // const value = tcaChannel.getValue(true);
                const value = g_widgets1.getChannelValue(channelName, true);
                if (value === undefined) {
                    return undefined;
                }
                tmp[this._channelNameIndicesInPropertyValue[index]] = `${value}`;
            } catch (e) {
                Log.error(e);
                return undefined;
            }
        }
        try {
            // the result's type must be correct for this property
            // e.g. the "left" property must be a number
            const result = this.getRuleComponent()?.evaluatePropertyValue(tmp.join(""));
            return result;
        } catch (e) {
            return undefined;
        }
    };

    getValue = (): Record<string, any> | undefined => {
        if (g_widgets1.isEditing()) {
            return undefined;
        }
        if (this.evaluateBoolExpression()) {
            return this.evaluatePropertyValue();
        } else {
            return undefined;
        }
    };

    getBoolExpressionArray = () => {
        return this._boolExpressionArray;
    };
    getPropertyValueArray = () => {
        return this._propertyValueArray;
    };

    // --------------------- channels --------------------------------
    getRawChannelNames = () => {
        const result: string[] = [];
        // .SEVR is converted to its original channel name in main process
        for (let channelName of this._channelNamesInBoolExpression) {
            result.push(channelName);
        }
        for (let channelName of this._channelNamesInPropertyValue) {
            result.push(channelName);
        }
        return result;
    };

    getRawChannelNamesInBoolExpression = () => {
        return this._channelNamesInBoolExpression;
    };

    getRawChannelNamesInPropertyValue = () => {
        return this._channelNamesInPropertyValue;
    };

    getExpandedChannelNames = () => {
        return [...this._expandedChannelNamesInBoolExpression, ...this._expandedChannelNamesInPropertyValue];
    };

    getExpandedChannelNamesInBoolExpression = () => {
        return this._expandedChannelNamesInBoolExpression;
    };

    getExpandedChannelNamesInPropertyValue = () => {
        return this._expandedChannelNamesInPropertyValue;
    };

    getChannelNames = () => {
        if (g_widgets1.isEditing()) {
            return this.getRawChannelNames();
        } else {
            return this.getExpandedChannelNames();
        }
    };

    expandChannelNamesInBoolExpression = (): void => {
        const result: string[] = [];
        const widget = this.getRules().getMainWidget();
        const canvas = g_widgets1.getWidget2("Canvas");
        if (!(canvas instanceof Canvas)) {
            const errMsg = "No Canvas widget";
            throw new Error(errMsg);
        }
        // const macros = canvas.getAllMacros();
        const macros = widget.getAllMacros();

        for (const rawChannelName of this.getRawChannelNamesInBoolExpression()) {
            // result.push(widget.expandChannelName(rawChannelName, macros));
            result.push(BaseWidget.expandChannelName(rawChannelName, macros, true));
        }
        this._expandedChannelNamesInBoolExpression = result;
    };

    expandChannelNamesInPropertyValue = (): void => {
        const result: string[] = [];
        const widget = this.getRules().getMainWidget();
        const canvas = g_widgets1.getWidget2("Canvas");
        if (!(canvas instanceof Canvas)) {
            const errMsg = "No Canvas widget";
            throw new Error(errMsg);
        }
        // const macros = canvas.getAllMacros();
        const macros = widget.getAllMacros();

        for (const rawChannelName of this.getRawChannelNamesInPropertyValue()) {
            // result.push(widget.expandChannelName(rawChannelName, macros));
            result.push(BaseWidget.expandChannelName(rawChannelName, macros, true));
        }
        this._expandedChannelNamesInPropertyValue = result;
    };

    // ---------------------- Elements -----------------------

    ElementRemoveRule = () => {
        return (
            <ElementButton
                onClick={() => {
                    this.getRules().removeRule(this.getIndex());
                }}
            >
                <img
                    src={`${getBasePath()}/webpack/resources/webpages/delete-symbol.svg`}
                    style={{
                        width: "50%",
                        height: "50%",
                    }}
                ></img>
            </ElementButton>
        );
    };

    ElementMoveUpRule = () => {
        return (
            <ElementButton
                onClick={() => {
                    this.getRules().moveUpRule(this.getIndex());
                }}
            >
                &#8593;
            </ElementButton>
        );
    };

    ElementMoveDownRule = () => {
        return (
            <ElementButton
                onClick={() => {
                    this.getRules().moveDownRule(this.getIndex());
                }}
            >
                &#8595;
            </ElementButton>
        );
    };

    ElementSelectComponent = ({ forceUpdate }: any) => {
        return (
            <form style={{ ...this.getFormStyle() }}>
                <div>property</div>

                <select
                    style={{ ...this.getInputStyle(), paddingTop: 1, paddingBottom: 1, width: "69%" }}
                    onChange={(event) => {
                        event.preventDefault();
                        this.setPropertyName(event.target.value);
                        this.renewRuleComponent(true);
                        forceUpdate({});
                    }}
                >
                    {this.getRuleComponentTypes().map((name: string, index: number) => {
                        if (name === this.getRuleTdl()["propertyName"]) {
                            return (
                                <option key={`${name}-${index}`} selected>
                                    {name}
                                </option>
                            );
                        } else {
                            return <option key={`${name}-${index}`}>{name}</option>;
                        }
                    })}
                </select>
            </form>
        );
    };

    _Element = () => {
        const [, forceUpdate] = React.useState({});
        return (
            <this._BlockBody>
                <div style={{ position: "relative", display: "inline-flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div
                        style={{
                            fontWeight: "bold",
                        }}
                    >{`# ${this.getIndex() + 1}`}</div>
                    <div style={{ display: "inline-flex", alignItems: "center" }}>
                        <this.ElementRemoveRule></this.ElementRemoveRule>
                        <this.ElementMoveUpRule></this.ElementMoveUpRule>
                        <this.ElementMoveDownRule></this.ElementMoveDownRule>
                    </div>
                </div>

                {this.getRuleComponent()?.getElementBoolExpression()}
                <this.ElementSelectComponent forceUpdate={forceUpdate}></this.ElementSelectComponent>
                {this.getRuleComponent()?.getElementPropertyValue()}
            </this._BlockBody>
        );
    };

    getInputStyle = () => {
        return this._inputStyle;
    };

    _formStyle: Record<string, any> = {
        display: "inline-flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 2,
        marginBottom: 2,
    };

    _inputStyle: Record<string, any> = {
        width: "65%",
        fontFamily: GlobalVariables.defaultFontFamily,
        fontSize: GlobalVariables.defaultFontSize,
    };

    getFormStyle = () => {
        return this._formStyle;
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

    _HorizontalLine = () => {
        return <div>&nbsp;</div>;
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

    // ----------------------- getters and setters ----------------------------

    getRuleTdl = (): type_rule_tdl => {
        const rulesTdl = this.getRules().getRulesTdl();
        return rulesTdl[this._index];
    };

    getIndex = () => {
        return this._index;
    };

    setIndex = (newIndex: number) => {
        this._index = newIndex;
    };

    getRules = () => {
        return this._rules;
    };

    getElement = (): React.JSX.Element => {
        return <this._Element key={`${this.getPropertyName()}-${this.getIndex()}`}></this._Element>;
    };

    getRuleComponentTypes = () => {
        return this._ruleComponentTypes;
    };

    getRuleComponentTypesMap = () => {
        return this._ruleComponentTypesMap;
    };

    // ----------------------------- rule tdl ---------------------------

    getBoolExpression = (): string => {
        return this.getRuleTdl()["boolExpression"];
    };

    setBoolExpression = (newExpression: string) => {
        this.getRuleTdl()["boolExpression"] = newExpression;
    };

    getPropertyValue = () => {
        return this.getRuleTdl()["propertyValue"];
    };
    /**
     * Update property value in rule tdl
     */
    setPropertyValue = (propertyValue: string | undefined) => {
        let newVal = propertyValue;
        let oldVal = this.getRuleTdl()["propertyValue"];
        if (newVal === oldVal) {
            return;
        }
        this.getRuleTdl()["propertyValue"] = newVal;

        if (g_widgets1 !== undefined) {
            const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
            history.registerAction();
        }
    };

    getPropertyName = () => {
        return this.getRuleTdl()["propertyName"];
    };

    setPropertyName = (newType: string) => {
        this.getRuleTdl()["propertyName"] = newType;
    };
}
