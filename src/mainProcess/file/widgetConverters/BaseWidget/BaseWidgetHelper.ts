import { BobPropertyConverter } from "../../../windows/DisplayWindow/BobPropertyConverter";
import { v4 as uuidv4 } from "uuid";

type type_rule_tdl = {
	boolExpression: string;
	propertyName: string;
	propertyValue: string | undefined;
	id: string;
};

export type type_rules_tdl = type_rule_tdl[];

export type type_BaseWidget_tdl = {
	type: string;
	widgetKey: string;
	key: string;
	style: Record<string, any>;
	text: Record<string, any>;
	channelNames: string[];
	groupNames: string[];
	rules: type_rules_tdl;
};

export abstract class BaseWidgetHelper {
	static _defaultTdl: type_BaseWidget_tdl = {
		type: "",
		widgetKey: "",
		key: "",
		style: {},
		text: {},
		channelNames: [],
		groupNames: [],
		rules: [],
	};

	static generateDefaultTdl = (type: string): Record<string, any> => {
		const result = JSON.parse(JSON.stringify(this._defaultTdl));
		const widgetKey = type + "_" + uuidv4();
		result.widgetKey = widgetKey;
		result.key = widgetKey;
		result.type = type;
		return result;
	};
}
