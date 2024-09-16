import { BaseWidget, type_BaseWidget_tdl } from "../../widgets/BaseWidget/BaseWidget";
import * as React from "react";
import { v4 as uuidv4 } from "uuid";
import { type_rule_tdl } from "./BaseWidgetRule";
import { BaseWidgetRule } from "./BaseWidgetRule";
import { ElementButton } from "../../helperWidgets/SharedElements/MacrosTable";

export type type_rules_tdl = type_rule_tdl[];

export abstract class BaseWidgetRules {
	_mainWidget: BaseWidget;
	_rulesTdl: type_rules_tdl;
	_rules: BaseWidgetRule[] = [];
	_channelNames: string[] = [];
	_forceUpdate: any;
    _showContents: boolean = false;

	constructor(baseWidget: BaseWidget, widgetTdl: type_BaseWidget_tdl) {
		this._mainWidget = baseWidget;
		this._rulesTdl = widgetTdl["rules"];
	}

	removeRule = (index: number) => {
		this.getRulesTdl().splice(index, 1);
		this.getRules().splice(index, 1);
		for (let ii = index; ii < this.getRules().length; ii++) {
			this.getRules()[ii].setIndex(ii);
		}
		this._forceUpdate();
	};

	activate = () => {
		for (let rule of this.getRules()) {
			rule.parseBoolExpression();
			rule.parsePropertyValue();
		}
	};

	deactivate = () => {
		for (let rule of this.getRules()) {
			rule.resetStuff();
		}
	};

	moveUpRule = (index: number) => {
		if (index === 0) {
			return;
		} else {
			// move up tdl
			const rulesTdl = this.getRulesTdl();
			const tmp = rulesTdl[index];
			rulesTdl[index] = rulesTdl[index - 1];
			rulesTdl[index - 1] = tmp;
			// move up rule
			const rules = this.getRules();
			const tmp2 = rules[index];
			rules[index] = rules[index - 1];
			rules[index - 1] = tmp2;
			rules[index].setIndex(index);
			rules[index - 1].setIndex(index - 1);
			this._forceUpdate();
		}
	};

	moveDownRule = (index: number) => {
		if (index >= this.getRulesTdl().length - 1) {
			return;
		} else {
			// move down tdl
			const rulesTdl = this.getRulesTdl();
			const tmp = rulesTdl[index];
			rulesTdl[index] = rulesTdl[index + 1];
			rulesTdl[index + 1] = tmp;
			// move down rule
			const rules = this.getRules();
			const tmp2 = rules[index];
			rules[index] = rules[index + 1];
			rules[index + 1] = tmp2;
			rules[index].setIndex(index);
			rules[index + 1].setIndex(index + 1);
			this._forceUpdate();
		}
	};

	abstract addRule: () => void;
	abstract initRules: () => void;

	_Element = () => {
		const [, forceUpdate] = React.useState({});
		this._forceUpdate = () => {
			forceUpdate({});
		};

		const [showContents, setShowContents] = React.useState(this._showContents);

		return (
			<>
				<this._BlockTitle>
					<b>Rules ({this.getRules().length})</b>
					<div
						style={{
							display: "inline-flex",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<ElementButton
							onClick={() => {
								this.addRule();
                                this._showContents = true;
								setShowContents(true);
								forceUpdate({});
							}}
						>
							<img
								src={`../../../webpack/resources/webpages/add-symbol.svg`}
								style={{
									width: "60%",
									height: "60%",
								}}
							></img>
						</ElementButton>
						<ElementButton
                            style={{
                                fontSize: 18,
                            }}
							onClick={() => {
                                this._showContents = !showContents;
								setShowContents(!showContents);
							}}
						>
                            {showContents ? <>&#9663;</> : <>&#9657;</>}
						</ElementButton>
					</div>
				</this._BlockTitle>
				{showContents ? this.ElementBody() : null}
			</>
		);
	};
    
	ElementBody = () => {
		return (
			<this._BlockBody>
				{this.getRules().map((rule: BaseWidgetRule, index: number) => {
					return rule.getElement();
				})}
			</this._BlockBody>
		);
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

	_BlockTitle = ({ children }: any) => {
		return (
			<div
				style={{
					marginTop: 2,
					marginBottom: 2,
					width: "100%",
					display: "inline-flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				{children}
			</div>
		);
	};
	getRulesTdl = (): type_rules_tdl => {
		return this._rulesTdl;
	};

	getElement = () => {
		return <this._Element></this._Element>;
	};

	getMainWidget = () => {
		return this._mainWidget;
	};

	getValues = (): { style: Record<string, any>; text: Record<string, any> } => {
		let style = {};
		let text = {};
		for (let rule of this.getRules()) {
			const value = rule.getValue();
			if (value === undefined) {
				continue;
			}
			if (value["style"] !== undefined) {
				style = { ...style, ...value["style"] };
			} else if (value["text"] !== undefined) {
				text = { ...text, ...value["text"] };
			}
		}
		return {
			style: style,
			text: text,
		};
	};

	generateNewRuleTdl = (): type_rule_tdl => {
		return {
			id: uuidv4(),
			boolExpression: "true",
			propertyName: "X",
			propertyValue: "42",
		};
	};

	/**
	 * Get raw channel names in the rules. <br>
	 *
	 * The channel name must be enclosed in square bracket in bool expression.
	 */
	getRawChannelNames = (): string[] => {
		const result: string[] = [];
		for (let rule of this.getRules()) {
			const tmp = rule.getRawChannelNames();
			result.push(...tmp);
		}
		const resultSet = new Set(result);
		return [...resultSet];
	};

	getExpandedChannelNames = (): string[] => {
		let result: string[] = [];
		for (let rule of this.getRules()) {
			result = [...result, ...rule.getExpandedChannelNames()];
		}
		const tmp = new Set(result);
		return [...tmp];
	};

	getRules = () => {
		return this._rules;
	};
}
