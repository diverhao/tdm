import * as React from "react";
import { Channel_ACCESS_RIGHTS, g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { type_dbrData } from "../../global/GlobalVariables";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { ProbeSidebar } from "./ProbeSidebar";
import { Channel_DBR_TYPES } from "../../global/GlobalVariables";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { Canvas } from "../../helperWidgets/Canvas/Canvas";
import { DbdFiles } from "../../channel/DbdFiles";
import { GlobalVariables } from "../../global/GlobalVariables";
import { TcaChannel } from "../../channel/TcaChannel";
import { v4 as uuidv4 } from "uuid";
import { ElementRectangleButton, ElementRectangleButtonDefaultBackgroundColor, ElementRectangleButtonDefaultTextColor } from "../../helperWidgets/SharedElements/RectangleButton";
import { Log } from "../../global/Log";

export type type_Probe_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
    recordTypes: Record<string, any>;
    menus: Record<string, any>;
};

export class Probe extends BaseWidget {
    _dbdFiles: DbdFiles;
    rtyp: string = "";

    // static data for a particular RTYP
    fieldNames: string[] = [];
    fieldMenus: (undefined | string[])[] = [];
    fieldDefaultValues: (string | number)[] = [];
    fieldIsLink: boolean[] = [];
    readonly rtypWaitingName: string = uuidv4();

    private _mappedDbrData: Record<string, any> = {};

    private _dbrDataMapping: Record<string, string> = {
        Value: "value",
        "Value Count": "valueCount",
        Severity: "severity",
        Access: "accessRight",
        Unit: "units",
        "DBR Type": "DBR_TYPE",
        Precision: "precision",
        "Display Upper Limit": "upper_display_limit",
        "Display Lower Limit": "lower_display_limit",
        "Control Upper Limit": "upper_warning_limit",
        "Control Lower Limit": "lower_warning_limit",
        Time: "secondsSinceEpoch",
        "Server Address": "serverAddress",
    };

    _channelNamesLevel5: string[] = [];
    getChannelNamesLevel5 = () => {
        return this._channelNamesLevel5;
    }

    constructor(widgetTdl: type_Probe_tdl) {
        super(widgetTdl);

        this.setStyle({ ...Probe._defaultTdl.style, ...widgetTdl.style });
        this.setText({ ...Probe._defaultTdl.text, ...widgetTdl.text });
        this._dbdFiles = new DbdFiles(JSON.parse(JSON.stringify(widgetTdl.recordTypes)), JSON.parse(JSON.stringify(widgetTdl.menus)));
        // assign the sidebar
        this._sidebar = new ProbeSidebar(this);
    }

    processChannelNames = (): void => {
        super.processChannelNames();
        this.getChannelNamesLevel5().length = 0;
        const baseChannelName = this.getChannelNamesLevel4()[0];
        if (baseChannelName !== undefined) {
            this.getChannelNamesLevel5().push(baseChannelName);
            for (let fieldName of this.fieldNames) {
                this.getChannelNamesLevel5().push(`${baseChannelName}.${fieldName}`);
            }
        }
    }

    getDbrData = () => {
        const channelName = this.getChannelNames()[0];
        if (channelName === undefined) {
            return {} as type_dbrData;
        }
        try {
            // this.mapDbrData();
            return this._mappedDbrData;
        } catch (e) {
            Log.error(e);
            return {} as type_dbrData;
        }
    };

    /**
     * Executed when we submit a new probe
     * 
     * (1) destroy the TcaChannels from this widget, this widget's .channelNames is updated at this step
     * (2) empty this._channelNames
     * (3) expand channel name, create TcaChannel for the new channel, then obtain the meta data and monitor
     *     this channel
     * (4) flush widgets
     */
    newProbe = (newChannelName: string) => {
        // (1)
        // we are still trying to connect the channel
        if (this.rtyp === this.rtypWaitingName) {
            try {
                const rtypChannelName = this.getChannelNamesLevel5()[0];
                const oldTcaChannel = g_widgets1.getTcaChannel(rtypChannelName + ".RTYP");
                oldTcaChannel.destroy(this.getWidgetKey());
            } catch (e) { }
        }
        for (let oldChannelNameLevel5 of this.getChannelNamesLevel5()) {
            try {
                const oldTcaChannel = g_widgets1.getTcaChannel(oldChannelNameLevel5);
                oldTcaChannel.destroy(this.getWidgetKey());
            } catch (e) { }
        }
        // (2)
        this.getChannelNamesLevel0()[0] = newChannelName;
        // (3)
        this.processChannelNames();
        const channelName = this.getChannelNames()[0];
        if (channelName !== undefined) {
            const tcaChannel = g_widgets1.createTcaChannel(channelName, this.getWidgetKey());
            if (tcaChannel !== undefined) {
                tcaChannel.getMeta(undefined);
                tcaChannel.monitor();
            }
        }
        this.destroyFieldChannels();
        this.getRTYP();
        // (4)
        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");
        g_flushWidgets();
    };

    getRTYP = async () => {
        if (this.rtyp !== "" || this.rtyp === this.rtypWaitingName) {
            Log.debug("RTYP already obtained or waiting");
            return;
        }
        // level-4 channel name
        const channelNameLevel4 = this.getChannelNamesLevel4()[0];
        // if this is an EPICS field channel, e.g. val1.SEVR, no rtype
        if (channelNameLevel4 === undefined) {
            this.rtyp = "";
            return;
        } else if (channelNameLevel4.includes(".")) {
            this.rtyp = "";
            return;
        }

        const rtypChannelName = `${channelNameLevel4}.RTYP`;
        let rtypTcaChannel: TcaChannel | undefined = undefined;
        try {
            rtypTcaChannel = g_widgets1.getTcaChannel(rtypChannelName);
        } catch (e) {
            rtypTcaChannel = g_widgets1.createTcaChannel(rtypChannelName, this.getWidgetKey());
        }
        if (rtypTcaChannel !== undefined) {
            this.rtyp = this.rtypWaitingName;
            await rtypTcaChannel.getMeta(this.getWidgetKey());
            const dbrData = await rtypTcaChannel.get(this.getWidgetKey(), 1, undefined, false);
            if ((dbrData !== undefined) && dbrData["value"] !== undefined) {
                const rtyp = dbrData["value"];
                if (rtyp !== undefined && this.rtyp === this.rtypWaitingName) {
                    this.rtyp = `${rtyp}`;
                    this.connectFieldChannels();
                    return;
                }
            } else {
                // GET timeout, reconnect
                this.rtyp = "";
                this.mapDbrData();
            }
        }
    };

    // (1) update this._channelNames, append field channel name
    // (2) create field channels, get meta and monitor
    // (3) update
    connectFieldChannels = () => {
        const recordType = this.getDbdFiles().getRecordTypes()[this.rtyp];
        if (recordType !== undefined) {
            this.fieldNames = this.getDbdFiles().getRecordTypeFieldNames(this.rtyp);
            this.fieldMenus = this.getDbdFiles().getRecordTypeFieldMenus(this.rtyp);
            this.fieldDefaultValues = this.getDbdFiles().getRecordTypeFieldDefaultValues(this.rtyp);
            this.fieldIsLink = this.getDbdFiles().getRecordTypeFieldIsLink(this.rtyp);

            this.processChannelNames();
            for (const channelNameLevel5 of this.getChannelNamesLevel5()) {
                try {
                    const fieldTcaChannel = g_widgets1.getTcaChannel(channelNameLevel5);
                    // trigger the data so that the
                    fieldTcaChannel.getMeta(this.getWidgetKey());
                    fieldTcaChannel.get(this.getWidgetKey(), 1, undefined, true);
                    fieldTcaChannel.monitor();
                } catch (e) {
                    const fieldTcaChannel = g_widgets1.createTcaChannel(channelNameLevel5, this.getWidgetKey());
                    if (fieldTcaChannel !== undefined) {
                        fieldTcaChannel.getMeta(this.getWidgetKey());
                        fieldTcaChannel.get(this.getWidgetKey(), 1, undefined, true);
                        // fieldTcaChannel.getMeta(undefined);
                        fieldTcaChannel.monitor();
                    }
                }
            }
        }
    };

    destroyFieldChannels = () => {
        this.rtyp = "";
        const canvas = g_widgets1.getWidget2("Canvas") as Canvas;
        const recordType = this.getDbdFiles().getRecordTypes()[this.rtyp];
        if (recordType !== undefined) {
            for (const channelNameLevel5 of this.getChannelNamesLevel5()) {
                try {
                    const fieldTcaChannel = g_widgets1.getTcaChannel(channelNameLevel5);
                    fieldTcaChannel.destroy(this.getWidgetKey());
                } catch (e) {
                }
            }
        }
        this.fieldMenus = [];
        this.fieldNames = [];
        this.fieldDefaultValues = [];
        this.fieldIsLink = [];
    };

    // convert value (number | string | number[] | string[]) to string
    // a number[], e.g. [1.2, 3.4, 5.6] is converted to string "1.2,3.4,5.6"
    mapDbrData = () => {
        this.getRTYP();

        const result: Record<string, any> = {};
        const channelNameLevel4 = this.getChannelNamesLevel4()[0];
        if (channelNameLevel4 === undefined) {
            return {};
        }
        try {
            const tcaChannel = g_widgets1.getTcaChannel(channelNameLevel4);

            const dbrData = tcaChannel.getDbrData();
            result["Name"] = channelNameLevel4;
            for (let key of Object.keys(this._dbrDataMapping)) {
                const key1 = this._dbrDataMapping[key];
                if (dbrData[key1] === undefined) {
                    // don't show it
                } else {
                    let value = dbrData[key1];
                    if (key === "DBR Type") {
                        value = Channel_DBR_TYPES[value] as string;
                        if (value.includes("ENUM")) {
                            const strings = dbrData["strings"] as string[];
                            if (strings !== undefined) {
                                const numStringUsed = dbrData["number_of_string_used"];
                                result["Number of Enums"] = `${numStringUsed}`;
                                for (let ii = 0; ii < numStringUsed; ii++) {
                                    result[`Enum ${ii}`] = strings[ii];
                                }
                            }
                        }
                    } else if (key === "Severity") {
                        value = tcaChannel.getSeverityStr();
                    } else if (key === "Time") {
                        const us0 = Date.UTC(90, 0, 1, 0, 0, 0, 0);
                        let us = value * 1000 + dbrData["nanoSeconds"] * 1e-6;
                        let dateStr = new Date(us + us0).toString();
                        let dateStr1 = dateStr.replace(" GMT", `.${dbrData["nanoSeconds"] * 1e-3} GMT`);
                        let dateStr1Split = dateStr1.split(" ");
                        value = `${dateStr1Split[1]} ${dateStr1Split[2]} ${dateStr1Split[3]} ${dateStr1Split[4]}`;
                    }
                    result[key] = `${value}`;
                }
            }
        } catch (e) {
            return {};
        }

        return result;
    };

    // ------------------------- event ---------------------------------
    // concretize abstract method
    updateFromSidebar = (event: any, propertyName: string, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        //todo: remove this method
    };

    // defined in super class
    // _handleMouseDown()
    // _handleMouseMove()
    // _handleMouseUp()
    // _handleMouseDownOnResizer()
    // _handleMouseMoveOnResizer()
    // _handleMouseUpOnResizer()
    // _handleMouseDoubleClick()

    // ----------------------------- geometric operations ----------------------------

    // defined in super class
    // simpleSelect()
    // selectGroup()
    // select()
    // simpleDeSelect()
    // deselectGroup()
    // deSelect()
    // move()
    // resize()

    // ------------------------------ group ------------------------------------

    // defined in super class
    // addToGroup()
    // removeFromGroup()

    // ------------------------------ elements ---------------------------------

    // concretize abstract method
    _ElementRaw = () => {
        // must do it for every widget
        g_widgets1.removeFromForceUpdateWidgets(this.getWidgetKey());
        this.renderChildWidgets = true;
        React.useEffect(() => {
            this.renderChildWidgets = false;
        });

        return (
            <ErrorBoundary style={this.getStyle()} widgetKey={this.getWidgetKey()}>
                <>
                    <this._ElementBody></this._ElementBody>
                    {this._showSidebar() ? this.getSidebar()?.getElement() : null}
                </>
            </ErrorBoundary>
        );
    };

    _ElementBodyRaw = (): JSX.Element => {
        return (
            <div style={{ ...this.getElementBodyRawStyle(), overflowX: "hidden" }}>
                <this._ElementArea></this._ElementArea>
                {this._showResizers() ? <this._ElementResizer /> : null}
            </div>
        );
    };

    // only shows the text, all other style properties are held by upper level _ElementBodyRaw
    _ElementAreaRaw = ({ }: any): JSX.Element => {
        this._mappedDbrData = this.mapDbrData();

        // const [value, setValue] = React.useState(this._getChannelValue());
        // const isFocused = React.useRef<boolean>(false);
        const [channelName, setChannelName] = React.useState(this.getChannelNames()[0]);
        const channelNameInputRef: React.RefObject<null | HTMLInputElement> = React.useRef(null);
        const filterElementRef = React.useRef<any>(null);
        const [filterValue, setFilterValue] = React.useState("");

        React.useEffect(() => {
            setChannelName(`${this.getChannelNames()[0]}`);
        }, [this.getChannelNames()[0]]);

        return (
            <div
                style={{
                    display: "inline-flex",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    userSelect: "none",
                    // different from regular widget
                    // overflow: this.getText().overflowVisible ? "visible" : "hidden",
                    flexDirection: "column",
                    // whiteSpace: this.getText().wrapWord ? "pre-line" : "nowrap",
                    // justifyContent: this.getText().horizontalAlign,
                    // alignItems: this.getText().verticalAlign,
                    // fontFamily: this.getText().fontFamily,
                    fontSize: this.getText().fontSize,
                    fontStyle: this.getText().fontStyle,
                    // outline: this._getElementAreaRawOutlineStyle(),
                    paddingBottom: 20,
                }}
                // title={"tooltip"}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                <div
                    style={{
                        position: "relative",
                        display: "inline-flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                        fontSize: 25,
                    }}
                >
                    <div style={{}}>
                        <b>Probe&nbsp;for&nbsp;</b>
                    </div>
                    <div
                        style={{
                            flexGrow: 1,
                        }}
                    >
                        <form
                            onSubmit={(event: any) => {
                                event.preventDefault();
                                this.newProbe(channelName);
                                (event.currentTarget.elements[0] as HTMLInputElement).blur();
                            }}
                            style={{
                                fontSize: 25,
                                backgroundColor: "rgba(255,255,0,0)",
                                width: "100%",
                                fontFamily: "bold",
                            }}
                        >
                            <this.ElementPvInput
                                ref={channelNameInputRef}
                                type="text"
                                name="channelName"
                                placeholder="PV Name"
                                value={channelName}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => setChannelName(event.target.value)}
                                // must use enter to change the value
                                onBlur={(event: any) => {
                                    const orig = this.getChannelNames()[0];
                                    if (orig !== channelName) {
                                        setChannelName(orig);
                                    }
                                }}
                                onFocus={() => {
                                    channelNameInputRef.current?.select();
                                }}
                            />
                        </form>
                    </div>
                </div>
                <div>
                    <h3>Basics</h3>
                </div>
                <table
                    style={{
                        outline: this._getElementAreaRawOutlineStyle(),
                    }}
                >
                    <tbody>
                        <tr style={{
                            backgroundColor: "rgba(245,245,245,1)",
                        }}>
                            <th
                                style={{
                                    width: "1%",
                                    whiteSpace: "nowrap",
                                    paddingRight: "10px",
                                    textAlign: "left",
                                }}
                            >
                                Property
                            </th>
                            <th
                                style={{
                                    paddingLeft: "10px",
                                    textAlign: "left",
                                }}
                            >
                                Value
                            </th>
                        </tr>

                        {Object.keys(this.getDbrData()).map((property: string, index: number) => {
                            const dbrData = this.getDbrData();
                            if (Object.keys(dbrData).length !== 0) {
                                const value = dbrData[property];
                                if (property === "Value") {
                                    return (
                                        <>
                                            <this.TableLineWithInput index={index} property={property} value={value}></this.TableLineWithInput>
                                            <this.TableLine index={index} property={property} value={value}></this.TableLine>
                                        </>
                                    );
                                }
                                return <this.TableLine index={index} property={property} value={value}></this.TableLine>;
                            } else {
                                return null;
                            }
                        })}
                        {this.rtyp === "" || this.rtyp === this.rtypWaitingName ? null : <this.TableLine index={-1} property={"RTYP"} value={this.rtyp}></this.TableLine>}
                    </tbody>
                </table>
                <div>
                    <h3>Fields</h3>
                </div>
                <div>
                    <span style={{ color: "grey" }}>GREY</span>: field is not writable
                </div>
                <div>
                    <span style={{ color: "green" }}>GREEN</span>: menu-type field, the value can be changed by selecting from the drop-down menu
                </div>
                <div>
                    <span style={{ color: "blue" }}>BLUE</span>: link-type field, clicking the blue text will open a new Probe window for the linked
                    PV
                </div>
                <div>
                    <span style={{ color: "red" }}>RED</span>: field value is different from its default value
                </div>
                <div>&nbsp;</div>
                <div>
                    Filter:
                    <input
                        ref={filterElementRef}
                        style={{
                            borderRadius: 0,
                            outline: "none",
                            border: "solid 1px rgba(0,0,0,1)",
                            marginLeft: 5,
                            fontSize: this.getAllStyle()["fontSize"],
                        }}
                        type="text"
                        onChange={(event: any) => {
                            event.preventDefault();
                            const newValue = event.target.value;
                            setFilterValue(newValue);
                        }}
                        value={filterValue}
                    ></input>
                </div>
                <div>&nbsp;</div>
                <table
                    style={{
                        outline: this._getElementAreaRawOutlineStyle(),
                    }}
                // backgroundColor={this.getStyle().backgroundColor}
                >
                    <tbody>
                        {this.rtyp === ""
                            ? null
                            : this.fieldNames.map((fieldName: string, index: number) => {
                                const filterValueArray = filterValue.trim().split(" ");
                                let filterMatch = false;
                                for (let filterValueElement of filterValueArray) {
                                    filterMatch = filterMatch || fieldName.includes(filterValueElement.trim().toUpperCase());
                                }
                                if (!filterMatch) {
                                    return null;
                                }
                                const channelName = `${this.getChannelNamesLevel4()[0]}.${fieldName}`;
                                const property = fieldName;
                                const value = g_widgets1.getChannelValue(channelName);
                                if (value !== undefined) {
                                    const fieldMenu = this.fieldMenus[index];
                                    const fieldDefaultValue = this.fieldDefaultValues[index];
                                    const fieldIsLink = this.fieldIsLink[index];
                                    if (fieldMenu !== undefined) {
                                        // it is a menu
                                        let choice = value;
                                        if (typeof value === "number") {
                                            choice = fieldMenu[value];
                                        }
                                        return (
                                            <this.TableLineField
                                                index={index}
                                                property={property}
                                                value={choice}
                                                defaultValue={fieldDefaultValue}
                                                isLink={fieldIsLink}
                                                isMenu={true}
                                                channelName={channelName}
                                                fieldMenu={fieldMenu}
                                            ></this.TableLineField>
                                        );
                                        // }
                                    }
                                    return (
                                        <this.TableLineField
                                            index={index}
                                            property={property}
                                            value={value}
                                            defaultValue={fieldDefaultValue}
                                            isLink={fieldIsLink}
                                            isMenu={false}
                                            channelName={channelName}
                                            fieldMenu={[]}
                                        ></this.TableLineField>
                                    );
                                } else {
                                    return null;
                                }
                            })}
                    </tbody>
                </table>
                <div
                    style={{
                        paddingBottom: 20,
                        marginTop: 10,
                    }}
                >
                    <ElementRectangleButton
                        handleClick={(event: any) => {
                            const result = JSON.parse(JSON.stringify(this._mappedDbrData));
                            for (let fieldName of this.fieldNames) {
                                const channelName = `${this.getChannelNamesLevel4()[0]}.${fieldName}`;
                                const value = g_widgets1.getChannelValue(channelName);
                                result[fieldName] = value;
                            }

                            navigator.clipboard.writeText(JSON.stringify(result));
                        }}
                    >
                        Copy All
                    </ElementRectangleButton>
                </div>
            </div>
        );
    };

    // concretize abstract method
    _Element = React.memo(this._ElementRaw, () => this._useMemoedElement());
    _ElementArea = React.memo(this._ElementAreaRaw, () => this._useMemoedElement());
    _ElementBody = React.memo(this._ElementBodyRaw, () => this._useMemoedElement());

    // defined in super class
    // getElement()
    // getSidebarElement()

    // -------------------- helper functions ----------------

    // defined in super class
    // _showSidebar()
    // _showResizers()
    // _useMemoedElement()
    // hasChannel()
    // isInGroup()
    // isSelected()
    // _getElementAreaRawOutlineStyle()

    _getChannelValue = () => {
        return this._getFirstChannelValue();
    };
    _getChannelSeverity = () => {
        return this._getFirstChannelSeverity();
    };
    _getChannelUnit = () => {
        return this._getFirstChannelUnit();
    };

    // ----------------------- styles -----------------------

    // defined in super class

    // _resizerStyle
    // _resizerStyles
    // StyledToolTipText
    // StyledToolTip


    ElementPvInput = ({ additionalStyle, type, name, placeholder, onChange, value, onBlue, onFocus }: any) => {
        const refElement = React.useRef<any>(null);
        return (
            <input
                ref={refElement}
                spellCheck={false}
                style={{
                    fontSize: 25,
                    backgroundColor: "rgba(0, 0, 0, 0)",
                    border: "none",
                    outline: "none",
                    width: "100%",
                    fontWeight: "bold",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    ...additionalStyle
                }}
                value={value}
                onFocus={(event: any) => {
                    event.preventDefault();
                    if (refElement.current !== null) {
                        refElement.current.style["color"] = "red";
                    }
                }}
                onBlur={(event: any) => {
                    event.preventDefault();
                    if (refElement.current !== null) {
                        refElement.current.style["color"] = "#937878";
                    }
                }}
                onMouseEnter={() => {
                    if (refElement.current !== null) {
                        refElement.current.style["color"] = "rgba(255, 0, 0, 1)";
                    }
                }}
                onMouseLeave={() => {
                    if (refElement.current !== null && document.activeElement !== refElement.current) {
                        refElement.current.style["color"] = "rgba(0, 0, 0, 1)";
                    }
                }}
                onChange={onChange}
            >
            </input>
        )
    };

    _StyledInputInLine = ({ additionalStyle, value, isEditing, textAlign, type, name, onFocus, onChange, onBlue }: any) => {
        const refElement = React.useRef<any>(null);
        return (
            <input
                ref={refElement}
                spellCheck={false}
                style={{
                    backgroundColor: "rgba(0, 0, 0, 0)",
                    border: "none",
                    width: "100%",
                    height: "100%",
                    padding: 0,
                    margin: 0,
                    fontSize: 14,
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                }}
                value={value}
                onFocus={(event: any) => {
                    event.preventDefault();
                    if (refElement.current !== null) {
                        refElement.current.style["color"] = "red";
                    }
                }}
                onBlur={(event: any) => {
                    event.preventDefault();
                    if (refElement.current !== null) {
                        refElement.current.style["color"] = "rgba(0,0,0,1)";
                    }
                }}
                onMouseEnter={() => {
                    if (refElement.current !== null) {
                        refElement.current.style["color"] = "rgba(255, 0, 0, 1)";
                    }
                }}
                onMouseLeave={() => {
                    if (refElement.current !== null) {
                        refElement.current.style["color"] = "rgba(0, 0, 0, 1)";
                    }
                }}
                onChange={onChange}
            >
            </input>
        )
    };

    private TableLineWithInput = ({ index, property, value }: any) => {
        return (
            <tr key={`table-${index}`}

                style={{
                    backgroundColor: index % 2 === 1 ? "rgba(245, 245, 245, 1)" : "rgba(245, 245, 245, 0)"
                }}
            >
                <td
                    style={{
                        width: "1%",
                        whiteSpace: "nowrap",
                        paddingRight: "10px",
                    }}
                >
                    {property}
                </td>
                <td
                    style={{
                        paddingLeft: "10px",
                    }}
                >
                    <this._ValueInputForm valueRaw={`${this.getDbrData().Value}`}></this._ValueInputForm>
                </td>
                <td></td>
            </tr>
        );
    };

    private TableLine = ({ index, property, value }: any) => {
        return (
            <tr key={`table-${index}`}
                style={{
                    backgroundColor: index % 2 === 1 ? "rgba(245, 245, 245, 1)" : "rgba(245, 245, 245, 0)"
                }}

            >
                <td
                    style={{
                        width: "1%",
                        whiteSpace: "nowrap",
                        paddingRight: "10px",
                    }}
                >
                    {property}
                </td>
                <td
                    style={{
                        paddingLeft: "10px",
                    }}
                >
                    {value}
                </td>
                <td
                    style={{
                        width: "1%",
                        whiteSpace: "nowrap",
                        textAlign: "right",
                    }}
                >
                    <ElementRectangleButton
                        paddingLeft={3}
                        paddingRight={3}
                        paddingTop={1}
                        paddingBottom={1}
                        defaultBackgroundColor={"rgba(0,0,0,0)"}
                        defaultTextColor={"rgba(0,0,0,0)"}
                        highlightBackgroundColor={ElementRectangleButtonDefaultBackgroundColor}
                        highlightTextColor={ElementRectangleButtonDefaultTextColor}
                        handleClick={(event: any) => {
                            const value = Object.values(this.getDbrData())[index];
                            navigator.clipboard.writeText(`${value}`);
                        }}
                    >
                        Copy
                    </ElementRectangleButton>
                </td>
            </tr>
        );
    };

    private TableLineField = ({ index, property, value, defaultValue, isLink, isMenu, channelName, fieldMenu }: any) => {
        const valueElementRef = React.useRef<any>(null);
        const nameElementRef = React.useRef<any>(null);
        // always a string
        const [inputValue, setInputValue] = React.useState(`${value}`);

        React.useEffect(() => {
            setInputValue(`${value}`);
        }, [value]);

        let accessRight = Channel_ACCESS_RIGHTS.READ_WRITE;
        try {
            const tcaChannel = g_widgets1.getTcaChannel(channelName);
            if (tcaChannel.getAccessRight() !== Channel_ACCESS_RIGHTS.READ_WRITE) {
                accessRight = Channel_ACCESS_RIGHTS.NO_ACCESS;
            }
        } catch (e) {
            Log.error(e);
            accessRight = Channel_ACCESS_RIGHTS.NO_ACCESS;
        }

        return (
            <tr key={`table-${index}`}
                style={{
                    backgroundColor: index % 2 === 0 ? "rgba(245, 245, 245, 1)" : "rgba(245, 245, 245, 0)",
                }}
            >
                <td
                    ref={nameElementRef}
                    style={{
                        width: "1%",
                        whiteSpace: "nowrap",
                        paddingRight: "10px",
                        color: isLink
                            ? "rgba(0,0,255,1)"
                            : isMenu
                                ? "rgba(0, 120, 50, 1)"
                                : accessRight !== Channel_ACCESS_RIGHTS.READ_WRITE
                                    ? "rgba(150, 150, 150, 1)"
                                    : "rgba(0,0,0,1)",
                    }}
                    onMouseEnter={() => {
                        if (!isLink) {
                            return;
                        } else {
                            if (nameElementRef.current !== null) {
                                nameElementRef.current.style["cursor"] = "pointer";
                            }
                        }
                    }}
                    onMouseLeave={() => {
                        if (!isLink) {
                            return;
                        } else {
                            if (nameElementRef.current !== null) {
                                nameElementRef.current.style["cursor"] = "default";
                            }
                        }
                    }}
                    onClick={() => {
                        if (isLink && typeof value === "string" && value !== "") {
                            // g_widgets1.openProbeWindow([this.getWidgetKey()]);
                            // directly use the IPC, not the openProbeWindow function
                            const channelName = value.split(" ")[0];
                            const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
                            const mainProcessMode = displayWindowClient.getMainProcessMode();
                            if (mainProcessMode === "web") {
                                g_widgets1.openProbeWindow([], channelName);
                            } else {
                                g_widgets1
                                    .getRoot()
                                    .getDisplayWindowClient()
                                    .getIpcManager()
                                    .sendFromRendererProcess("create-utility-display-window", "Probe", { channelNames: [channelName] });
                            }
                        }
                    }}
                >
                    {property}
                </td>
                <td
                    style={{
                        paddingLeft: "10px",
                    }}
                >
                    {fieldMenu.length === 0 ? (
                        <div>
                            {/* {inputValue} */}
                            <form
                                onSubmit={(event: any) => {
                                    event.preventDefault();
                                    try {
                                        const tcaChannel = g_widgets1.getTcaChannel(channelName);
                                        tcaChannel.put(g_widgets1.getRoot().getDisplayWindowClient().getWindowId(), { value: inputValue }, 1);
                                    } catch (e) {
                                        Log.error(e);
                                    }
                                    setInputValue(`${value}`);
                                }}
                            >
                                <input
                                    ref={valueElementRef}
                                    onMouseEnter={() => {
                                        if (valueElementRef.current !== null && accessRight !== Channel_ACCESS_RIGHTS.READ_WRITE) {
                                            valueElementRef.current.style["cursor"] = "not-allowed";
                                        }
                                    }}
                                    onMouseLeave={() => {
                                        if (valueElementRef.current !== null) {
                                            valueElementRef.current.style["cursor"] = "default";
                                        }
                                    }}
                                    style={{
                                        outline: "none",
                                        border: "none",
                                        padding: 0,
                                        margin: 0,
                                        backgroundColor: "rgba(0,0,0,0)",
                                        fontSize: this.getAllStyle()["fontSize"],
                                        width: "90%",
                                        color: value === defaultValue ? "black" : "red",
                                    }}
                                    type="text"
                                    onChange={(event: any) => {
                                        event.preventDefault();
                                        setInputValue(event.target.value);
                                    }}
                                    readOnly={accessRight === Channel_ACCESS_RIGHTS.READ_WRITE ? false : true}
                                    value={inputValue}
                                ></input>
                            </form>
                        </div>
                    ) : (
                        <div>
                            <select
                                style={{
                                    fontSize: this.getAllStyle()["fontSize"],
                                    padding: 0,
                                    margin: 0,
                                    border: "none",
                                    outline: "none",
                                    backgroundColor: "rgba(0,0,0,0)",
                                    color: value === defaultValue ? "black" : "red",
                                    textIndent: 0,
                                    WebkitAppearance: "none",
                                    MozAppearance: "none",
                                    appearance: "none",
                                }}
                                onChange={(event: any) => {
                                    // do not change the selection until the new data arrives
                                    event.preventDefault();
                                    try {
                                        const tcaChannel = g_widgets1.getTcaChannel(channelName);
                                        const newValue = event.target.value;
                                        tcaChannel.put(g_widgets1.getRoot().getDisplayWindowClient().getWindowId(), { value: newValue }, 1);
                                    } catch (e) {
                                        Log.error(e);
                                    }
                                }}
                                // use "value={...}", do not use "select=true/false" in <option/>
                                value={`${value}`}
                            >
                                {fieldMenu.map((item: string, menuIndex: number) => {
                                    return <option>{item}</option>;
                                })}
                            </select>
                        </div>
                    )}
                </td>
                <td
                    style={{
                        width: "1%",
                        whiteSpace: "nowrap",
                        textAlign: "right",
                    }}
                >
                    <ElementRectangleButton
                        defaultBackgroundColor={"rgba(0,0,0,0)"}
                        defaultTextColor={"rgba(0,0,0,0)"}
                        paddingLeft={3}
                        paddingRight={3}
                        paddingTop={1}
                        paddingBottom={1}
                        highlightBackgroundColor={ElementRectangleButtonDefaultBackgroundColor}
                        highlightTextColor={ElementRectangleButtonDefaultTextColor}
                        handleClick={(event: any) => {
                            // const value = Object.values(this.getDbrData())[index];
                            // const channelName = `${this._channelNames[0]}.${fieldName}`;
                            const value = g_widgets1.getChannelValue(channelName);
                            navigator.clipboard.writeText(JSON.stringify(value));
                        }}
                    >
                        Copy
                    </ElementRectangleButton>
                </td>
            </tr>
        );
    };

    private _ValueInputForm = ({ valueRaw }: { valueRaw: string | number | string[] | number[] }) => {
        const [value, setValue] = React.useState(`${valueRaw}`);
        const isFocused = React.useRef<boolean>(false);
        const keyRef: React.RefObject<null | HTMLInputElement> = React.useRef(null);

        React.useEffect(() => {
            setValue((oldValue: string) => {
                if (isFocused.current) {
                    return oldValue;
                } else {
                    return `${valueRaw}`;
                }
            });
        }, [valueRaw]);

        const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();

            (event.currentTarget.elements[0] as HTMLInputElement).blur();
            try {
                const tcaChannel = g_widgets1.getTcaChannel(this.getChannelNames()[0]);
                // if user includes the unit, the put() should be able to parseInt() or praseFloat()
                // the text before unit
                const displayWindowId = g_widgets1.getRoot().getDisplayWindowClient().getWindowId();
                tcaChannel.put(displayWindowId, { value: value }, 1);
            } catch (e) {
                const errMsg = `Channel ${this.getChannelNames()} cannot be found`;
                Log.error(errMsg);
                Log.error(e);
            }
        };

        // press escape key to blur input box
        React.useEffect(() => {
            const blurOnEscapeKey = (event: any) => {
                if (event.key === "Escape") {
                    keyRef.current?.blur();
                }
            };
            document.addEventListener("keydown", blurOnEscapeKey);
            return () => {
                document.removeEventListener("keydown", blurOnEscapeKey);
            };
        }, []);

        return (
            <form onSubmit={handleSubmit} style={{ width: "100%", height: "100%" }}>
                <this._StyledInputInLine
                    ref={keyRef}
                    isEditing={g_widgets1.isEditing()}
                    textAlign={
                        this.getText().horizontalAlign === "flex-start" ? "left" : this.getText().horizontalAlign === "center" ? "center" : "right"
                    }
                    highlightBackgroundColor={this.getText().highlightBackgroundColor}
                    type="text"
                    name="value"
                    value={value}
                    onFocus={() => {
                        isFocused.current = true;
                        keyRef.current?.select();
                    }}
                    onChange={(event: any) => {
                        event.preventDefault();
                        setValue(event.target.value);
                    }}
                    onBlur={(event: any) => {
                        isFocused.current = false;
                        setValue(`${valueRaw}`);
                    }}
                />
            </form>
        );
    };
    // -------------------------- tdl -------------------------------

    // override BaseWidget
    static _defaultTdl: type_Probe_tdl = {
        type: "Probe",
        widgetKey: "", // "key" is a reserved keyword
        key: "",
        // the style for outmost div
        // these properties are explicitly defined in style because they are
        // (1) different from default CSS settings, or
        // (2) they may be modified
        style: {
            position: "absolute",
            display: "inline-block",
            backgroundColor: "rgba(255, 255,255, 1)",
            left: 0,
            top: 0,
            width: 500,
            height: 500,
            outlineStyle: "none",
            outlineWidth: 1,
            outlineColor: "black",
            transform: "rotate(0deg)",
            color: "rgba(0,0,0,1)",
            borderStyle: "solid",
            borderWidth: 0,
            borderColor: "rgba(255, 0, 0, 1)",
            fontFamily: GlobalVariables.defaultFontFamily,
            fontSize: GlobalVariables.defaultFontSize,
            fontStyle: GlobalVariables.defaultFontStyle,
            fontWeight: GlobalVariables.defaultFontWeight,
        },
        // the ElementBody style
        text: {
            horizontalAlign: "flex-start",
            verticalAlign: "flex-start",
            wrapWord: true,
            showUnit: false,
            alarmBorder: true,
            highlightBackgroundColor: "rgba(255, 255, 0, 1)",
            overflowVisible: true,
        },
        channelNames: [],
        groupNames: [],
        rules: [],
        // recordTypesFieldNames: {},
        // recordTypesMenus: {},
        recordTypes: {},
        menus: {},
    };

    // override
    static generateDefaultTdl = (type: string) => {
        // defines type, widgetKey, and key
        const result = super.generateDefaultTdl(type) as type_Probe_tdl;
        result.style = JSON.parse(JSON.stringify(this._defaultTdl.style));
        result.text = JSON.parse(JSON.stringify(this._defaultTdl.text));
        result.channelNames = JSON.parse(JSON.stringify(this._defaultTdl.channelNames));
        result.groupNames = JSON.parse(JSON.stringify(this._defaultTdl.groupNames));
        // result.recordTypesFieldNames = JSON.parse(JSON.stringify(this._defaultTdl.recordTypesFieldNames));
        // result.recordTypesMenus = JSON.parse(JSON.stringify(this._defaultTdl.recordTypesMenus));
        result.recordTypes = JSON.parse(JSON.stringify(this._defaultTdl.recordTypes));
        result.menus = JSON.parse(JSON.stringify(this._defaultTdl.menus));
        return result;
    };

    // static method for generating a widget tdl with external PV name
    static generateWidgetTdl = (utilityOptions: Record<string, any>): type_Probe_tdl => {
        const result = this.generateDefaultTdl("Probe");
        result.channelNames = utilityOptions.channelNames as string[];
        result.recordTypes = utilityOptions.recordTypes as Record<string, any>;
        result.menus = utilityOptions.menus as Record<string, any>;
        return result;
    };

    // getTdlCopy()

    // --------------------- getters -------------------------

    // defined in super class
    // getType()
    // getWidgetKey()
    // getStyle()
    // getText()
    // getSidebar()
    // getGroupName()
    // getGroupNames()
    // getupdateFromWidget()
    // getResizerStyle()
    // getResizerStyles()

    // ---------------------- setters -------------------------

    // ---------------------- channels ------------------------

    // defined in super class

    // getChannelNames()
    // expandChannelNames()
    // getExpandedChannelNames()
    // setExpandedChannelNames()
    // expandChannelNameMacro()

    // ------------------------ z direction --------------------------

    // defined in super class
    // moveInZ()

    // ------------------ dbd files ----------------------------------
    getDbdFiles = () => {
        return this._dbdFiles;
    };
    // -------------------------- sidebar ---------------------------
    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new ProbeSidebar(this);
        }
    }
}
