import { BaseWidgetRules } from "./BaseWidgetRules";
import * as React from "react";
import { ElementButton } from "../../helperWidgets/SharedElements/MacrosTable";
import { RuleComponent } from "../../helperWidgets/RuleComponents/RuleComponent";
import { RuleX } from "../../helperWidgets/RuleComponents/RuleX";
import { RuleY } from "../../helperWidgets/RuleComponents/RuleY";
import { RuleBackgroundColor } from "../../helperWidgets/RuleComponents/RuleBackgroundColor";
import { g_widgets1 } from "../../global/GlobalVariables";
import { Canvas } from "../../helperWidgets/Canvas/Canvas";
import * as mathjs from "mathjs";
import { GlobalVariables } from "../../global/GlobalVariables";
import { RuleWidth } from "../../helperWidgets/RuleComponents/RuleWidth";
import { RuleColor } from "../../helperWidgets/RuleComponents/RuleColor";
import { RuleBorderColor } from "../../helperWidgets/RuleComponents/RuleBorderColor";
import { RuleBorderWidth } from "../../helperWidgets/RuleComponents/RuleBorderWidth";
import { RuleInvisibleInOperation } from "../../helperWidgets/RuleComponents/RuleInvisibleInOperation";
import { RuleLineWidth } from "../../helperWidgets/RuleComponents/RuleLineWidth";
import { RuleFillColor } from "../../helperWidgets/RuleComponents/RuleFillColor";
import { RuleLineColor } from "../../helperWidgets/RuleComponents/RuleLineColor";
import { RuleHeight } from "../../helperWidgets/RuleComponents/RuleHeight";
import { RuleAngle } from "../../helperWidgets/RuleComponents/RuleAngle";
import { RuleLineStyle } from "../../helperWidgets/RuleComponents/RuleLineStyle";
import { RuleShowArrowHead } from "../../helperWidgets/RuleComponents/RuleShowArrowHead";
import { RuleShowArrowTail } from "../../helperWidgets/RuleComponents/RuleShowArrowTail";
import { RulePolylineSmootherize } from "../../helperWidgets/RuleComponents/RulePolylineSmootherize";
import { RulePolylineFill } from "../../helperWidgets/RuleComponents/RulePolylineFill";
import { RulePolylineClosed } from "../../helperWidgets/RuleComponents/RulePolylineClosed";
import { RulePolylineArrowLength } from "../../helperWidgets/RuleComponents/RulePolylineArrowLength";
import { RulePolylineArrowWidth } from "../../helperWidgets/RuleComponents/RulePolylineArrowWidth";
import { RuleFontSize } from "../../helperWidgets/RuleComponents/RuleFontSize";
import { RuleText } from "../../helperWidgets/RuleComponents/RuleText";
import { RuleWrapWord } from "../../helperWidgets/RuleComponents/RuleWrapWord";
import { RuleAlarmBorder } from "../../helperWidgets/RuleComponents/RuleAlarmBorder";
import { RuleArcAngleStart } from "../../helperWidgets/RuleComponents/RuleArcAngleStart";
import { RuleArcAngleRange } from "../../helperWidgets/RuleComponents/RuleArcAngleRange";
import { RuleArcShowRadius } from "../../helperWidgets/RuleComponents/RuleArcShowRadius";
import { RuleXAlign } from "../../helperWidgets/RuleComponents/RuleXAlign";
import { RuleYAlign } from "../../helperWidgets/RuleComponents/RuleYAlign";
import { RuleSlideButtonBoxWidth } from "../../helperWidgets/RuleComponents/RuleSlideButtonBoxWidth";
import { RuleShowUnit } from "../../helperWidgets/RuleComponents/RuleShowUnit";
import { RuleChoiceButtonUseChannelItems } from "../../helperWidgets/RuleComponents/RuleChoiceButtonUseChannelItems";
import { RuleBooleanButtonUsePictures } from "../../helperWidgets/RuleComponents/RuleBooleanButtonUsePictures";
import { RuleBooleanButtonShowLED } from "../../helperWidgets/RuleComponents/RuleBooleanButtonShowLED";
import { RuleLEDBit } from "../../helperWidgets/RuleComponents/RuleLEDBit";
import { RuleLEDFallbackColor } from "../../helperWidgets/RuleComponents/RuleLEDFallbackColor";
import { RuleChoiceButtonUnselectedBackgroundColor } from "../../helperWidgets/RuleComponents/RuleChoiceButtonUnselectedBackgroundColor";
import { RuleChoiceButtonSelectedBackgroundColor } from "../../helperWidgets/RuleComponents/RuleChoiceButtonSelectedBackgroundColor";
import { RuleCheckBoxSize } from "../../helperWidgets/RuleComponents/RuleCheckBoxSize";
import { RuleSlideButtonBoxRatio } from "../../helperWidgets/RuleComponents/RuleSlideButtonBoxRatio";
import { RuleProgressBarBackgroundColor } from "../../helperWidgets/RuleComponents/RuleProgressBarBackgroundColor";
import { RuleHighlightBackgroundColor } from "../../helperWidgets/RuleComponents/RuleHighlightBackgroundColor";
import { RuleMaxPvValue } from "../../helperWidgets/RuleComponents/RuleMaxPvValue";
import { RuleMinPvValue } from "../../helperWidgets/RuleComponents/RuleMinPvValue";
import { RuleUsePvLimits } from "../../helperWidgets/RuleComponents/RuleUsePvLimits";
import { RuleSliderBlockWidth } from "../../helperWidgets/RuleComponents/RuleScaledSliderSliderBlockWidth";
import { RuleDirection } from "../../helperWidgets/RuleComponents/RuleDirection";
import { RuleShowPvValue } from "../../helperWidgets/RuleComponents/RuleShowPvValue";
import { RuleStepSize } from "../../helperWidgets/RuleComponents/RuleStepSize";
import { RuleUseLogScale } from "../../helperWidgets/RuleComponents/RuleUseLogScale";
import { RuleInvalidSeverityColor } from "../../helperWidgets/RuleComponents/RuleInvalidSeverityColor";
import { RuleMajorSeverityColor } from "../../helperWidgets/RuleComponents/RuleMajorSeverityColor";
import { RuleMinorSeverityColor } from "../../helperWidgets/RuleComponents/RuleMinorSeverityColor";
import { RuleMeterAngleRange } from "../../helperWidgets/RuleComponents/RuleMeterAngleRange";
import { RuleMeterDialColor } from "../../helperWidgets/RuleComponents/RuleMeterDialColor";
import { RuleMeterDialPercentage } from "../../helperWidgets/RuleComponents/RuleMeterDialPercentage";
import { RuleMeterDialThickness } from "../../helperWidgets/RuleComponents/RuleMeterDialThickness";
import { RuleMeterPointerColor } from "../../helperWidgets/RuleComponents/RuleMeterPointerColor";
import { RuleMeterPointerLengthPercentage } from "../../helperWidgets/RuleComponents/RuleMeterPointerLengthPercentage";
import { RuleMeterPointerThickness } from "../../helperWidgets/RuleComponents/RuleMeterPointerThickness";
import { RuleMeterLabelPositionPercentage } from "../../helperWidgets/RuleComponents/RuleMeterLabelPositionPercentage";
import { RuleMeterDialFontColor } from "../../helperWidgets/RuleComponents/RuleMeterDialFontColor";
import { RuleMeterDialFontSize } from "../../helperWidgets/RuleComponents/RuleMeterDialFontSize";
import { RuleTankShowLabels } from "../../helperWidgets/RuleComponents/RuleTankShowLabels";
import { RuleThermometerBulbDiameter } from "../../helperWidgets/RuleComponents/RuleThermometerBulbDiameter";
import { RuleThermometerTubeWidth } from "../../helperWidgets/RuleComponents/RuleThermometerTubeWidth";
import { RuleThermometerWallThickness } from "../../helperWidgets/RuleComponents/RuleThermometerWallThickness";
import { RuleThermometerWallColor } from "../../helperWidgets/RuleComponents/RuleThermometerWallColor";
import { RuleLEDShape } from "../../helperWidgets/RuleComponents/RuleLEDShape";
import { RuleLEDMultiStateFallbackText } from "../../helperWidgets/RuleComponents/RuleLEDMultiStateFallbackText";
import { RuleByteMonitorBitStart } from "../../helperWidgets/RuleComponents/RuleByteMonitorBitStart";
import { RuleByteMonitorBitLength } from "../../helperWidgets/RuleComponents/RuleByteMonitorBitLength";
import { RuleByteMonitorSequence } from "../../helperWidgets/RuleComponents/RuleByteMonitorSequence";
import { RuleRectangleCornerWidth } from "../../helperWidgets/RuleComponents/RuleRectangleCornerWidth";
import { RuleRectangleCornerHeight } from "../../helperWidgets/RuleComponents/RuleRectangleCornerHeight";
import { RulePictureOpacity } from "../../helperWidgets/RuleComponents/RulePictureOpacity";
import { RulePictureStretchToFit } from "../../helperWidgets/RuleComponents/RulePictureStretchToFit";
import { RuleMediaDefaultFileName } from "../../helperWidgets/RuleComponents/RuleMediaDefaultFileName";
import { RuleBooleanButtonOnColor } from "../../helperWidgets/RuleComponents/RuleBooleanButtonOnColor";
import { RuleBooleanButtonOffColor } from "../../helperWidgets/RuleComponents/RuleBooleanButtonOffColor";
import { RuleOutlineColor } from "../../helperWidgets/RuleComponents/RuleOutlineColor";
import { RuleOutlineStyle } from "../../helperWidgets/RuleComponents/RuleOutlineStyle";
import { RuleOutlineWidth } from "../../helperWidgets/RuleComponents/RuleOutlineWidth";
import { RuleEmbeddedDisplaySelectTabIndex } from "../../helperWidgets/RuleComponents/RuleEmbeddedDisplaySelectTabIndex";
import { BaseWidget } from "./BaseWidget";
import { Log } from "../../../mainProcess/log/Log";

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
                return new RuleX(rule);
            },
            RuleY: () => {
                return new RuleY(rule);
            },
            RuleWidth: () => {
                return new RuleWidth(rule);
            },
            RuleHeight: () => {
                return new RuleHeight(rule);
            },
            RuleAngle: () => {
                return new RuleAngle(rule);
            },
            RuleBackgroundColor: () => {
                return new RuleBackgroundColor(rule);
            },
            RuleColor: () => {
                return new RuleColor(rule);
            },
            RuleBorderColor: () => {
                return new RuleBorderColor(rule);
            },
            RuleBorderWidth: () => {
                return new RuleBorderWidth(rule);
            },
            RuleLineWidth: () => {
                return new RuleLineWidth(rule);
            },
            RuleLineColor: () => {
                return new RuleLineColor(rule);
            },

            RuleLineStyle: () => {
                return new RuleLineStyle(rule);
            },
            RuleShowArrowHead: () => {
                return new RuleShowArrowHead(rule);
            },
            RuleShowArrowTail: () => {
                return new RuleShowArrowTail(rule);
            },
            RuleFillColor: () => {
                return new RuleFillColor(rule);
            },
            RuleInvisibleInOperation: () => {
                return new RuleInvisibleInOperation(rule);
            },
            RulePolylineSmootherize: () => {
                return new RulePolylineSmootherize(rule);
            },
            RulePolylineFill: () => {
                return new RulePolylineFill(rule);
            },
            RulePolylineClosed: () => {
                return new RulePolylineClosed(rule);
            },
            RulePolylineArrowLength: () => {
                return new RulePolylineArrowLength(rule);
            },
            RulePolylineArrowWidth: () => {
                return new RulePolylineArrowWidth(rule);
            },
            RuleFontSize: () => {
                return new RuleFontSize(rule);
            },
            RuleText: () => {
                return new RuleText(rule);
            },
            RuleWrapWord: () => {
                return new RuleWrapWord(rule);
            },
            RuleAlarmBorder: () => {
                return new RuleAlarmBorder(rule);
            },
            RuleArcAngleStart: () => {
                return new RuleArcAngleStart(rule);
            },
            RuleArcAngleRange: () => {
                return new RuleArcAngleRange(rule);
            },
            RuleArcShowRadius: () => {
                return new RuleArcShowRadius(rule);
            },
            RuleXAlign: () => {
                return new RuleXAlign(rule);
            },
            RuleYAlign: () => {
                return new RuleYAlign(rule);
            },
            RuleSlideButtonBoxWidth: () => {
                return new RuleSlideButtonBoxWidth(rule);
            },
            RuleShowUnit: () => {
                return new RuleShowUnit(rule);
            },
            RuleChoiceButtonUseChannelItems: () => {
                return new RuleChoiceButtonUseChannelItems(rule);
            },
            RuleBooleanButtonUsePictures: () => {
                return new RuleBooleanButtonUsePictures(rule);
            },
            RuleBooleanButtonShowLED: () => {
                return new RuleBooleanButtonShowLED(rule);
            },
            RuleLEDBit: () => {
                return new RuleLEDBit(rule);
            },
            RuleLEDFallbackColor: () => {
                return new RuleLEDFallbackColor(rule);
            },
            RuleChoiceButtonUnselectedBackgroundColor: () => {
                return new RuleChoiceButtonUnselectedBackgroundColor(rule);
            },
            RuleChoiceButtonSelectedBackgroundColor: () => {
                return new RuleChoiceButtonSelectedBackgroundColor(rule);
            },
            RuleCheckBoxSize: () => {
                return new RuleCheckBoxSize(rule);
            },
            RuleSlideButtonBoxRatio: () => {
                return new RuleSlideButtonBoxRatio(rule);
            },
            RuleProgressBarBackgroundColor: () => {
                return new RuleProgressBarBackgroundColor(rule);
            },
            RuleHighlightBackgroundColor: () => {
                return new RuleHighlightBackgroundColor(rule);
            },
            RuleMaxPvValue: () => {
                return new RuleMaxPvValue(rule);
            },
            RuleMinPvValue: () => {
                return new RuleMinPvValue(rule);
            },
            RuleUsePvLimits: () => {
                return new RuleUsePvLimits(rule);
            },
            RuleSliderBlockWidth: () => {
                return new RuleSliderBlockWidth(rule);
            },
            RuleDirection: () => {
                return new RuleDirection(rule);
            },
            RuleShowPvValue: () => {
                return new RuleShowPvValue(rule);
            },
            RuleStepSize: () => {
                return new RuleStepSize(rule);
            },
            RuleUseLogScale: () => {
                return new RuleUseLogScale(rule);
            },
            RuleInvalidSeverityColor: () => {
                return new RuleInvalidSeverityColor(rule);
            },
            RuleMajorSeverityColor: () => {
                return new RuleMajorSeverityColor(rule);
            },
            RuleMinorSeverityColor: () => {
                return new RuleMinorSeverityColor(rule);
            },
            RuleMeterAngleRange: () => {
                return new RuleMeterAngleRange(rule);
            },
            RuleMeterDialColor: () => {
                return new RuleMeterDialColor(rule);
            },
            RuleMeterDialPercentage: () => {
                return new RuleMeterDialPercentage(rule);
            },
            RuleMeterDialThickness: () => {
                return new RuleMeterDialThickness(rule);
            },
            RuleMeterPointerColor: () => {
                return new RuleMeterPointerColor(rule);
            },
            RuleMeterPointerLengthPercentage: () => {
                return new RuleMeterPointerLengthPercentage(rule);
            },
            RuleMeterPointerThickness: () => {
                return new RuleMeterPointerThickness(rule);
            },
            RuleMeterLabelPositionPercentage: () => {
                return new RuleMeterLabelPositionPercentage(rule);
            },
            RuleMeterDialFontColor: () => {
                return new RuleMeterDialFontColor(rule);
            },
            RuleMeterDialFontSize: () => {
                return new RuleMeterDialFontSize(rule);
            },
            RuleTankShowLabels: () => {
                return new RuleTankShowLabels(rule);
            },
            RuleThermometerBulbDiameter: () => {
                return new RuleThermometerBulbDiameter(rule);
            },
            RuleThermometerTubeWidth: () => {
                return new RuleThermometerTubeWidth(rule);
            },
            RuleThermometerWallThickness: () => {
                return new RuleThermometerWallThickness(rule);
            },
            RuleThermometerWallColor: () => {
                return new RuleThermometerWallColor(rule);
            },
            RuleLEDShape: () => {
                return new RuleLEDShape(rule);
            },
            RuleLEDMultiStateFallbackText: () => {
                return new RuleLEDMultiStateFallbackText(rule);
            },
            RuleByteMonitorBitStart: () => {
                return new RuleByteMonitorBitStart(rule);
            },
            RuleByteMonitorBitLength: () => {
                return new RuleByteMonitorBitLength(rule);
            },
            RuleByteMonitorSequence: () => {
                return new RuleByteMonitorSequence(rule);
            },
            RuleRectangleCornerWidth: () => {
                return new RuleRectangleCornerWidth(rule);
            },
            RuleRectangleCornerHeight: () => {
                return new RuleRectangleCornerHeight(rule);
            },
            RulePictureOpacity: () => {
                return new RulePictureOpacity(rule);
            },
            RulePictureStretchToFit: () => {
                return new RulePictureStretchToFit(rule);
            },
            RuleMediaDefaultFileName: () => {
                return new RuleMediaDefaultFileName(rule);
            },
            RuleBooleanButtonOnColor: () => {
                return new RuleBooleanButtonOnColor(rule);
            },
            RuleBooleanButtonOffColor: () => {
                return new RuleBooleanButtonOffColor(rule);
            },
            RuleOutlineColor: () => {
                return new RuleOutlineColor(rule);
            },
            RuleOutlineStyle: () => {
                return new RuleOutlineStyle(rule);
            },
            RuleOutlineWidth: () => {
                return new RuleOutlineWidth(rule);
            },
            RuleEmbeddedDisplaySelectTabIndex: () => {
                return new RuleEmbeddedDisplaySelectTabIndex(rule);
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
    setRuleComponent = (newRuleComponent: RuleX) => {
        this._ruleComponent = newRuleComponent;
    };

    // removeRuleComponentTypes = (ruleComponentTypesToBeRemoved: string[]) => {
    //     for (let ii = 0; ii < ruleComponentTypesToBeRemoved.length; ii++) {
    //         const ruleComponentTypeToBeRemoved = ruleComponentTypesToBeRemoved[ii];
    //         const index = this.getRuleComponentTypes().indexOf(ruleComponentTypeToBeRemoved);
    //         if (index > -1) {
    //             this.getRuleComponentTypes().splice(index, 1);
    //         }
    //     }
    // }

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
            const result = mathjs.evaluate(tmp.join(""));
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

        console.log("channelNames =========================", channelNames, tmp)
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
        const macros = canvas.getAllMacros();

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
        const macros = canvas.getAllMacros();

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
                    src={`../../../mainProcess/resources/webpages/delete-symbol.svg`}
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
                    onChange={(event: any) => {
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

    getElement = (): JSX.Element => {
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
