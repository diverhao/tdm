import { SidebarActionItems } from "./SidebarActionItems";
import * as React from "react";
import { ActionButton } from "../../widgets/ActionButton/ActionButton";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../Root/Root";
import { type_action_closedisplaywindow } from "../../widgets/ActionButton/ActionButton";
import { ElementButton } from "../SharedElements/MacrosTable";

export class SidebarActionCloseDisplayWindowItem {
    _items: SidebarActionItems;
    _index: number;
    StyledButton = ElementButton;
    _BlockBody: any;
    constructor(items: SidebarActionItems, index: number) {
        this._items = items;
        this._index = index;
        // this.StyledButton = this.getItems().StyledButton;
        this._BlockBody = this.getItems()._BlockBody;
    }

    getMainWidget = () => {
        return this.getItems().getMainWidget() as ActionButton;
    };

    getTdl = () => {
        const mainWidget = this.getMainWidget();
        return mainWidget.getActions()[this.getIndex()] as type_action_closedisplaywindow;
    };

    _Element = () => {
        // const mainWidget = this.getMainWidget();
        const [label, setLabel] = React.useState(this.getTdl()["label"]);
        // const [command, setCommand] = React.useState(this.getTdl()["command"]);

        return (
            <this._BlockBody>
                <div
                    style={{
                        display: "inline-flex",
                        flexDirection: "row",
                        width: "100%",
                        justifyContent: "space-between",
                        alignItems: "center",
                        backgroundColor: "rgba(240,240,240,1)",
                    }}
                >
                    <b>{`#${this.getIndex()} Close Window`}</b>
                    <div>
                        <this.StyledButton
                            onClick={(event: any) => {
                                this.getItems().updateWidgetMoveUpAction(event, this.getIndex());
                            }}
                        >
                            &#8593;
                        </this.StyledButton>
                        <this.StyledButton
                            onClick={(event: any) => {
                                this.getItems().updateWidgetMoveDownAction(event, this.getIndex());
                            }}
                        >
                            &#8595;
                        </this.StyledButton>
                        <this.StyledButton
                            onClick={(event: any) => {
                                this.getItems().updateWidgetRemoveAction(event, this.getIndex());
                            }}
                        >
                            <img
                                src={`../../../webpack/resources/webpages/delete-symbol.svg`}
                                style={{
                                    width: "50%",
                                    height: "50%",
                                }}
                            ></img>
                        </this.StyledButton>
                    </div>
                </div>

                <div
                    style={{
                        display: "inline-flex",
                        flexDirection: "row",
                        width: "100%",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >

                    <form
                        onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                            this.updateWidgetLabel(event, label);
                        }}
                        style={{ ...this.getFormStyle(), width: "100%" }}
                    >
                        <div>Label:</div>
                        <input
                            style={{ ...this.getInputStyle() }}
                            type="string"
                            name="item-label"
                            value={label}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                const newVal = event.target.value;
                                setLabel(newVal);
                            }}
                            // must use enter to change the value
                            onBlur={(event: any) => {
                                const orig = this.getTdl()["label"];
                                if (orig !== label) {
                                    setLabel(orig);
                                }
                            }}
                        />
                    </form>
                </div>
                <this._ElementExitProgram></this._ElementExitProgram>
                <this._HorizontalLine></this._HorizontalLine>
            </this._BlockBody>
        );
    };

	_ElementExitProgram = () => {
		const [exitProgram, setExitProgram] = React.useState(this.getTdl()["quitTDM"]);

		return (
			<form
				style={{
					display: "inline-flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
				// onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.updateWidget(event, invisibleInOperation)} style={this.getFormStyle()}
			>
				<div>Quit TDM:</div>
				<input
					type="checkbox"
					checked={exitProgram}
					onChange={(event: any) => {
						// do not preventDefault()

                        const oldVal = this.getTdl()["quitTDM"];
						const propertyValue = !exitProgram;
						if (propertyValue === oldVal) {
							return;
						} else {
                            this.getTdl()["quitTDM"] = propertyValue;
						}

						const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
						history.registerAction();

						g_widgets1.addToForceUpdateWidgets(this.getMainWidget().getWidgetKey());
						g_widgets1.addToForceUpdateWidgets("GroupSelection2");

						g_flushWidgets();

                        setExitProgram((prevVal: boolean) => {
                            return !prevVal;
						});
					}}
				/>
			</form>
		);
	};
    updateWidgetLabel = (event: any, propertyValue: string | number | boolean | number[] | string[] | undefined) => {
        if (event) {
            event.preventDefault();
        }

        const mainWidget = this.getMainWidget();
        const oldVal = this.getTdl()["label"];
        if (propertyValue === oldVal) {
            return;
        } else {
            this.getTdl()["label"] = `${propertyValue}`;
        }

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(mainWidget.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };

    // updateWidgetCommand = (event: any, propertyValue: string | number | boolean | number[] | string[] | undefined) => {
    // 	if (event) {
    // 		event.preventDefault();
    // 	}

    // 	const mainWidget = this.getMainWidget();
    // 	const oldVal = this.getTdl()["command"];
    // 	if (propertyValue === oldVal) {
    // 		return;
    // 	} else {
    // 		this.getTdl()["command"] = `${propertyValue}`;
    // 	}

    // 	const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
    // 	history.registerAction();

    // 	g_widgets1.addToForceUpdateWidgets(mainWidget.getWidgetKey());
    // 	g_widgets1.addToForceUpdateWidgets("GroupSelection2");

    // 	g_flushWidgets();
    // };

    // --------------------------- getters -----------------------------

    getElement = () => {
        const mainWidget = this.getMainWidget();
        return <this._Element key={`${this.getTdl()["label"]}-${this.getIndex()}`}></this._Element>;
    };

    getIndex = () => {
        return this._index;
    };

    getItems = () => {
        return this._items;
    };

    setIndex = (newIndex: number) => {
        this._index = newIndex;
    };

    getFormStyle = () => {
        return this.getItems().getFormStyle();
    };
    getInputStyle = () => {
        return this.getItems().getInputStyle();
    };

    // -------------------------- styled components ----------------------------

    _HorizontalLine = () => {
        return <div>&nbsp;</div>;
    };
}
