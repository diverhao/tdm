import { getMouseEventClientY, GlobalVariables } from "../../global/GlobalVariables";
import * as React from "react";
// import { MouseEvent } from "react";
import { getMouseEventClientX, g_widgets1 } from "../../global/GlobalVariables";
import * as GlobalMethods from "../../global/GlobalMethods";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { PvTableSidebar } from "./PvTableSidebar";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { rendererWindowStatus, Widgets } from "../../global/Widgets";
import { ChannelSeverity } from "../../channel/TcaChannel";
import { PvTableSettings } from "./PvTableSettings";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { Table } from "../../helperWidgets/Table/Table";
import { AlarmOutlineStyle } from "../BaseWidget/BaseWidget";
import { ElementDropDownMenu } from "../../helperWidgets/SharedElements/DropDownMenu";
import { ElementRectangleButton } from "../../helperWidgets/SharedElements/RectangleButton";
import { Log } from "../../global/Log";

export type type_PvTable_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    groupNames: string[];
    rules: type_rules_tdl;
    macros: [string, string][];
    channelNames: string[];
    fieldNames: string[];
};



export class PvTable extends BaseWidget {
    // -------------------------------------------

    // these fields do not do the channel name expansion, they are not part of .FIELD
    // the SEVR/TIME/UNITS are all from Channel Access meta data, not from a PV, i.e. val0.TIME
    // the val0.VAL is acquired anyway
    // excludedFieldNames = ["VAL", "SEVR", "TIME", "UNITS"];
    excludedFieldNames: string[] = [];
    _fieldNames: string[] = [];

    _tmp_resizingColumn: boolean = false;
    _tmp_columnWidth = 0;
    _tmp_initX = 0;
    lineHeight: number;

    _ElementTableCell: ({ children, columnIndex, additionalStyle }: any) => React.JSX.Element;
    _ElementTableLine: ({ children, additionalStyle, lineIndex }: any) => React.JSX.Element;
    _ElementTableHeaderResizer: ({ columnIndex }: any) => React.JSX.Element;
    _ElementTableLineMemo: React.MemoExoticComponent<(input: any) => React.JSX.Element>;

    /**
     * the base channel names: the rows. It should not contain dot (.)
     * 
     * The _channelNamesLevel0 is the channel names expanded with fields, it is derived from
     * _channelNamesLevel5 and this.fieldNames. When we save the tdl, the _channelNamesLevel5
     * is used.
     */
    _channelNamesLevel5: string[] = [];

    getFieldlNames = () => {
        return this._fieldNames;
    };

    setFieldNames = (newNames: string[]) => {
        this._fieldNames = newNames;
    };

    getStrippedFieldNames = (): string[] => {
        const result: string[] = [];
        for (let fieldName of this.getFieldlNames()) {
            if (!this.excludedFieldNames.includes(fieldName)) {
                result.push(fieldName);
            }
        }
        return result;
    };

    _macros: [string, string][] = [];

    setMacros = (newMacros: [string, string][]) => {
        this._macros = newMacros;
    };

    getMacros = () => {
        return this._macros;
    };

    _settings: PvTableSettings;
    showSettings: boolean = false;

    _table: Table;



    constructor(widgetTdl: type_PvTable_tdl) {
        super(widgetTdl);
        for (let channelNameLevel5 of widgetTdl.channelNames) {
            this.getChannelNamesLevel5().push(channelNameLevel5);
        }

        this.setStyle({ ...PvTable._defaultTdl.style, ...widgetTdl.style });
        this.setText({ ...PvTable._defaultTdl.text, ...widgetTdl.text });
        this.setMacros(JSON.parse(JSON.stringify(widgetTdl.macros)));
        this.setFieldNames(JSON.parse(JSON.stringify(widgetTdl.fieldNames)));
        // this.addDefaultFieldNames();

        this._settings = new PvTableSettings(this);

        // assign the sidebar
        this._sidebar = new PvTableSidebar(this);

        this.lineHeight = GlobalVariables.defaultFontSize * 1.5;

        window.addEventListener("mousedown", this.removeTableHeaderOptionsMenu)
        window.addEventListener("mousedown", this.removeTableLineOptionsMenu)

        this._table = new Table(this.initColumnWidths(), this);

        this._ElementTableCell = this.getTable().getElementTableCell();
        this._ElementTableLine = this.getTable().getElementTableLine();
        this._ElementTableHeaderResizer = this.getTable().getElementTableHeaderResizer();
        this._ElementTableLineMemo = this.getTable().getElementTableLineMemo();
    }

    initColumnWidths = () => {
        const result: number[] = [];
        result.push(GlobalVariables.defaultFontSize * 10);
        result.push(GlobalVariables.defaultFontSize * 10);
        for (let ii = 0; ii < this.getFieldlNames().length; ii++) {
            result.push(GlobalVariables.defaultFontSize * 10);
        }
        return result;
    }


    getTable = () => {
        return this._table;
    }

    getSettings = () => {
        return this._settings;
    };

    // ------------------------- event ---------------------------------
    // concretize abstract method
    updateFromSidebar = (event: any, propertyName: string, propertyValue: number | string | number[] | string[] | boolean | undefined) => { };

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
        // if (this.getExpandedBaseChannelNames().length === 0) {
        // this function uses g_widgets1. It cannot be invoked in constructor
        // this.setExpanedBaseChannelNames();
        // }

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
    }; // ----------------------------------------

    /**
     * Prevent clicking buttons in the widget in editing mode
     */
    _ElementMask = () => {
        return (
            <div style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: "100%",
                height: "100%",
                backgroundColor: "rgba(255,0,255,0)",
            }}>

            </div>
        )
    }

    _ElementBodyRaw = (): JSX.Element => {
        return (
            <div style={{ ...this.getElementBodyRawStyle(), overflow: "scroll" }}>
                <this._ElementArea></this._ElementArea>
                {/* <this._BulkAddChannelsPage></this._BulkAddChannelsPage> */}
                {/* <this._ElementSettings></this._ElementSettings> */}
                {this._showResizers() ? <this._ElementResizer /> : null}
            </div>
        );
    };

    // toBeUpdatedIndex: number[] = [];

    // only shows the text, all other style properties are held by upper level _ElementBodyRaw
    _ElementAreaRaw = ({ }: any): JSX.Element => {
        return (
            <div
                style={{
                    display: "inline-flex",
                    position: "relative",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    userSelect: "none",
                    // different from regular widget
                    // overflow: this.getText().overflowVisible ? "visible" : "hidden",
                    // overflow: "scroll",
                    // overflow: "scroll",
                    // overflow: "scroll",
                    flexDirection: "column",
                    // fontSize: "30px",
                    // fontFamily: this.getText().fontFamily,
                    fontSize: `${this.getStyle().fontSize}px`,
                    // fontStyle: this.getText().fontStyle,
                    // contentVisibility: "hidden"
                    // padding: "20px",
                }}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                {this.showSettings === true ? this.getSettings().getElement() : <this._ElementPvTable></this._ElementPvTable>}
                {g_widgets1.isEditing() ? <this._ElementMask></this._ElementMask> : null}

            </div>
        );
    };

    forceUpdateTable: any = undefined;


    calcTableWidth = () => {
        let result = 0;
        for (let width of this.getTable().columnWidths) {
            result = result + width;
        }
        return result;
    }


    // <this._ElementTableHeaderOptionsButton key={`${fieldName}-${index}-optionsButton`} columnIndex={index + 2}></this._ElementTableHeaderOptionsButton>

    _ElementTableHeaderOptionsMenu = ({ columnIndex }: any) => {
        return (
            <div style={{
                backgroundColor: "rgba(0,0,0,0)",
                display: "inline-flex",
                flexDirection: "column",
                borderRadius: 5,
                fontFamily: GlobalVariables.defaultFontFamily,
                fontSize: GlobalVariables.defaultFontSize,
                fontStyle: GlobalVariables.defaultFontStyle,
                fontWeight: GlobalVariables.defaultFontWeight,
                overflow: "hidden",
            }}
            >
                <ElementDropDownMenu
                    callbacks={{
                        "Add new field to left": () => {
                            const fieldName = "";
                            this.getFieldlNames().splice(columnIndex - 2, 0, fieldName);
                            // no need to connect/re-connect all channels
                            this.forceUpdateTable();
                        },
                        "Add new field to right": () => {
                            const fieldName = "";
                            this.getFieldlNames().splice(columnIndex - 1, 0, fieldName);
                            // no need to connect/re-connect all channels
                            this.forceUpdateTable();
                        },
                        "Remove field": () => {
                            this.getFieldlNames().splice(columnIndex - 2, 1);
                            this.processChannelNames();
                            // re-connect all channels (we are lazy)
                            g_widgets1.connectAllTcaChannels(true);
                            this.forceUpdateTable();
                        },
                        "Move to left": () => {
                            if (columnIndex - 2 > 0) {
                                const fieldNameLeft = this.getFieldlNames()[columnIndex - 3];
                                this.getFieldlNames().splice(columnIndex - 3, 1);
                                this.getFieldlNames().splice(columnIndex - 2, 0, fieldNameLeft);
                                this.forceUpdateTable();
                            }
                        },
                        "Move to right": () => {
                            if (columnIndex - 2 < this.getFieldlNames().length - 1) {
                                const fieldNameRight = this.getFieldlNames()[columnIndex - 1];
                                this.getFieldlNames().splice(columnIndex - 1, 1);
                                this.getFieldlNames().splice(columnIndex - 2, 0, fieldNameRight);
                                this.forceUpdateTable();
                            }
                        },
                        "Rename field": () => {
                            this.modifyingColumnIndex = columnIndex;
                            this.forceUpdateTable();
                        },
                    }}
                >
                </ElementDropDownMenu>
            </div>
        )
    }

    _ElementTableLineOptionsMenu = ({ x, y, channelNameIndex }: any) => {
        return (
            <div style={{
                backgroundColor: "rgba(0,0,0,0)",
                display: "inline-flex",
                flexDirection: "column",
                borderRadius: 5,
                fontFamily: GlobalVariables.defaultFontFamily,
                fontSize: GlobalVariables.defaultFontSize,
                fontStyle: GlobalVariables.defaultFontStyle,
                fontWeight: GlobalVariables.defaultFontWeight,
                overflow: "hidden",
            }}
            >
                <ElementDropDownMenu
                    callbacks={{
                        "Add new channel above": () => {
                            this.getChannelNamesLevel5().splice(channelNameIndex, 0, "");
                            this.forceUpdateTable();
                        },
                        "Add new channel below": () => {
                            this.getChannelNamesLevel5().splice(channelNameIndex + 1, 0, "");
                            this.modifyingRowIndex = channelNameIndex + 2;
                            this.forceUpdateTable();
                        },
                        "Remove channel": () => {
                            // delete the channels
                            const deletedBaseChannelName = this.getChannelNamesLevel5()[channelNameIndex];
                            this.getChannelNamesLevel5().splice(channelNameIndex, 1);

                            // this.setExpanedBaseChannelNames();
                            // this.expandAndExtractChannelNames();
                            this.processChannelNames()

                            for (let fieldName of this.getFieldlNames()) {
                                try {
                                    g_widgets1.removeTcaChannel(`${deletedBaseChannelName}.${fieldName}`, this.getWidgetKey());
                                } catch (e) {
                                    Log.error(e);
                                }
                            }
                            try {
                                g_widgets1.removeTcaChannel(`${deletedBaseChannelName}`, this.getWidgetKey());
                            } catch (e) {
                                Log.error(e);
                            }
                            this.forceUpdateTable();
                        },
                        "Move up": () => {
                            if (channelNameIndex >= 1) {
                                const tmp1 = this.getChannelNamesLevel5()[channelNameIndex];
                                const tmp2 = this.getChannelNamesLevel5()[channelNameIndex - 1];
                                this.getChannelNamesLevel5()[channelNameIndex] = tmp2;
                                this.getChannelNamesLevel5()[channelNameIndex - 1] = tmp1;
                                // this.setExpanedBaseChannelNames();
                                this.forceUpdateTable();
                            }
                        },
                        "Move down": () => {
                            if (channelNameIndex < this.getChannelNamesLevel5().length - 1) {
                                const tmp1 = this.getChannelNamesLevel5()[channelNameIndex];
                                const tmp2 = this.getChannelNamesLevel5()[channelNameIndex + 1];
                                this.getChannelNamesLevel5()[channelNameIndex] = tmp2;
                                this.getChannelNamesLevel5()[channelNameIndex + 1] = tmp1;
                                // this.setExpanedBaseChannelNames();
                                this.forceUpdateTable();
                            }
                        },
                        "Rename channel": () => {
                            // not channelNameIndex
                            this.modifyingRowIndex = channelNameIndex + 1;
                            // re-render _ElementTableLineChannelName
                            this.forceUpdateTable();
                        },
                        "Probe": () => {
                            // level 5 channel name is level 0 channel name without field
                            const channelNameLevel5 = this.getChannelNamesLevel5()[channelNameIndex];
                            const channelNameLevel4 = BaseWidget.channelNameLevel0to4(channelNameLevel5);
                            g_widgets1.openProbeWindow([], channelNameLevel4);
                        },
                        "Copy data": () => {
                            // level 5 channel name is level 0 channel name without field
                            const channelNameLevel5 = this.getChannelNamesLevel5()[channelNameIndex];
                            const channelNameLevel4 = BaseWidget.channelNameLevel0to4(channelNameLevel5);
                            try {
                                const tcaChannel = g_widgets1.getTcaChannel(channelNameLevel4);
                                const dbrData = tcaChannel.getDbrData();
                                dbrData["channelName"] = channelNameLevel4;
                                navigator.clipboard.writeText(JSON.stringify(dbrData));
                            } catch (e) {
                                Log.error(e);
                            }
                        }
                    }}
                >
                </ElementDropDownMenu>
            </div>
        )
    }

    modifyingColumnIndex = -1;
    modifyingRowIndex = -1;


    removeTableHeaderOptionsMenu = () => {
        const oldElement = document.getElementById("table-header-options-menu");
        if (oldElement !== null) {
            document.body.removeChild(oldElement);
        }
    }


    removeTableLineOptionsMenu = () => {
        const oldElement = document.getElementById("table-line-options-menu");
        if (oldElement !== null) {
            document.body.removeChild(oldElement);
        }
    }

    _ElementTableLineChannelName = ({ rowIndex }: any) => {
        // a level-5 channel name
        const [channelName, setChannelName] = React.useState<string>(this.getChannelNamesLevel5()[rowIndex - 1]);
        const elementRefInput = React.useRef<any>(null);
        if (this.modifyingRowIndex === rowIndex) {
            return (
                <div
                    style={{
                        width: "100%",
                    }}
                    onMouseDown={(event: any) => {
                        if (event.button === 1) {
                            event.preventDefault();
                            // this <div /> element is removed in DisplayWindowClient mouseup event
                            g_widgets1.createChannelNamePeekDiv(getMouseEventClientX(event), getMouseEventClientY(event), channelName);
                        }
                    }}

                >
                    <form
                        onSubmit={(event: any) => {
                            // event.preventDefault();
                            this.modifyingRowIndex = -1;

                            event.preventDefault();

                            // level 5 channel name is basically level 0 without field name
                            const oldChannelNameLevel5 = this.getChannelNamesLevel5()[rowIndex - 1];
                            const oldChannelNameLevel4 = BaseWidget.channelNameLevel0to4(oldChannelNameLevel5, this.getMacros());

                            this.getChannelNamesLevel5()[rowIndex - 1] = channelName;

                            try {
                                for (let fieldName of this.getFieldlNames()) {
                                    g_widgets1.removeTcaChannel(`${oldChannelNameLevel4}.${fieldName}`, this.getWidgetKey());
                                }
                                g_widgets1.removeTcaChannel(`${oldChannelNameLevel4}`, this.getWidgetKey());
                            } catch (e) {
                                Log.error(e);
                            }

                            // connect new channel
                            this.processChannelNames();
                            g_widgets1.connectAllTcaChannels(true);
                            this.forceUpdateTable();

                        }}
                        style={{
                            width: "100%",
                        }}
                    >
                        <input
                            ref={elementRefInput}
                            value={channelName}
                            autoFocus={true}
                            spellCheck={false}
                            style={{
                                padding: 0,
                                boxSizing: "border-box",
                                outline: "none",
                                width: "100%",
                                // border: "solid 1px rgba(0,0,0,1)",
                                border: "solid 1px rgba(255,0,0,1)",
                                borderRadius: 0,
                                fontSize: GlobalVariables.defaultFontSize,
                                fontFamily: GlobalVariables.defaultFontFamily,
                                fontStyle: GlobalVariables.defaultFontStyle,
                                fontWeight: GlobalVariables.defaultFontWeight,
                                // outline: "solid 1px rgba(255, 0, 0, 1)",
                                userSelect: "auto",
                            }}
                            onChange={(event: any) => {
                                event.preventDefault();
                                setChannelName(event.target.value);
                            }}
                            // readOnly={!(this.modifyingColumnIndex === columnIndex)}
                            onBlur={(event: any) => {
                                event.preventDefault();
                                if (elementRefInput.current !== null) {
                                    elementRefInput.current.style["border"] = "solid 1px rgba(255,0,0,0)";
                                }
                                setChannelName(this.getChannelNamesLevel5()[rowIndex - 1]);
                                this.modifyingRowIndex = -1;
                                this.forceUpdateTable();
                            }}
                            onFocus={(event: any) => {
                                event.preventDefault();
                                if (elementRefInput.current !== null) {
                                    // elementRefInput.current.style["border"] = "solid 1px rgba(255,0,0,1)";
                                }
                            }}
                        >
                        </input>
                    </form>
                </div>
            )
        } else {
            return <div
                style={{
                    width: "100%",
                    height: "100%",
                    border: "solid 1px rgba(255,0,0,0)",
                    display: "inline-flex",
                    alignItems: 'center',
                    justifyContent: "flex-start",
                    overflow: "hidden",
                }}
                onDoubleClick={() => {
                    this.modifyingRowIndex = rowIndex;
                    this.forceUpdateTable();
                }}
                onMouseDown={(event: any) => {
                    if (event.button === 1) {
                        event.preventDefault();
                        // this <div /> element is removed in DisplayWindowClient mouseup event
                        g_widgets1.createChannelNamePeekDiv(getMouseEventClientX(event), getMouseEventClientY(event), channelName);
                    }
                }}

            >
                {channelName}
            </div>

        }
    }

    getChannelNamesLevel5 = () => {
        return this._channelNamesLevel5;
    }

    processChannelNames(): void {
        // update channelNamesLevel0 from channelNamesLevel5 and fieldNames
        this.getChannelNamesLevel0().length = 0;
        for (const channelNameLevel5 of this.getChannelNamesLevel5()) {
            if (channelNameLevel5.includes(".")) {
                this.getChannelNamesLevel0().push(channelNameLevel5);
            } else {
                // all fields
                for (const fieldName of this.getFieldlNames()) {
                    // regular field names: we create channel val1.SEVR, val1.CALC
                    // special field names: we do not create channel val1.units or val1.value,
                    // instead, we use the channel val1's dbr data for them, as implemented in this.getChannelValue()
                    if (!(fieldName === "units" || fieldName === "value" || fieldName === "time" || fieldName === "severity")) {
                        this.getChannelNamesLevel0().push(`${channelNameLevel5}.${fieldName}`);
                    }
                }
                // channel without any field, e.g. val1
                this.getChannelNamesLevel0().push(channelNameLevel5);
            }
        }
        super.processChannelNames(this.getMacros(), false);
    }

    _ElementTableHeaderFieldName = ({ columnIndex }: any) => {
        const [fieldName, setFieldName] = React.useState<string>(this.getFieldlNames()[columnIndex - 2]);
        const elementRefInput = React.useRef<any>(null);

        if (this.modifyingColumnIndex === columnIndex) {
            return <div>
                <form
                    onSubmit={(event: any) => {
                        event.preventDefault();
                        this.getFieldlNames()[columnIndex - 2] = fieldName;
                        this.modifyingColumnIndex = -1;
                        this.processChannelNames();
                        // we are lazy
                        g_widgets1.connectAllTcaChannels(true);
                        this.forceUpdateTable();
                    }}
                    style={{
                        width: "100%",

                    }}
                >
                    <input
                        ref={elementRefInput}
                        value={fieldName}
                        autoFocus={true}
                        spellCheck={false}
                        style={{
                            padding: 0,
                            boxSizing: "border-box",
                            outline: "none",
                            width: "100%",
                            // border: "solid 1px rgba(0,0,0,1)",
                            border: "solid 1px rgba(255,0,0,1)",
                            borderRadius: 0,
                            fontSize: GlobalVariables.defaultFontSize,
                            fontFamily: GlobalVariables.defaultFontFamily,
                            fontStyle: GlobalVariables.defaultFontStyle,
                            fontWeight: GlobalVariables.defaultFontWeight,
                            // outline: "solid 1px rgba(255, 0, 0, 1)",
                        }}
                        onChange={(event: any) => {
                            event.preventDefault();
                            setFieldName(event.target.value);
                        }}
                        // readOnly={!(this.modifyingColumnIndex === columnIndex)}
                        onBlur={(event: any) => {
                            event.preventDefault();
                            if (elementRefInput.current !== null) {
                                elementRefInput.current.style["border"] = "solid 1px rgba(255,0,0,0)";
                            }
                            setFieldName(this.getFieldlNames()[columnIndex - 2]);
                            this.modifyingColumnIndex = -1;
                            this.forceUpdateTable();
                        }}
                        onFocus={(event: any) => {
                            event.preventDefault();
                            if (elementRefInput.current !== null) {
                                // elementRefInput.current.style["border"] = "solid 1px rgba(255,0,0,1)";
                            }
                        }}
                    >
                    </input>
                </form>
            </div>

        } else {
            return <div
                style={{
                    width: "100%",
                    height: "100%",
                    border: "solid 1px rgba(255,0,0,0)",
                    display: "inline-flex",
                    alignItems: 'center',
                    justifyContent: "flex-start",
                }}
                onDoubleClick={() => {
                    this.modifyingColumnIndex = columnIndex;
                    this.forceUpdateTable();
                }}
            >
                {fieldName}
            </div>

        }
    }

    lastTimeUpdated: number = 0;

    filterStrings: string[] = [];

    filterShownChannelIndices: number[] = [];

    _ElementHeader = () => {
        const [strings, setStrings] = React.useState(this.filterStrings.join(" "));
        const buttonAddRef = React.useRef<any>(null);
        const buttonSettingsRef = React.useRef<any>(null);
        const buttonCopyAllDataRef = React.useRef<any>(null);
        return (
            <div style={{
                width: "100%",
                display: "inline-flex",
                flexDirection: "row",
                justifyContent: "flex-start",
                alignItems: "center",
                paddingLeft: 10,
                marginBottom: 10,
            }}>
                <div style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    marginRight: 10,
                }}>
                    Filter:
                </div>
                <form onSubmit={(event: any) => {
                    event?.preventDefault();
                }}>
                    < input
                        value={strings}
                        spellCheck={false}
                        onChange={(event: any) => {
                            const rawString = event.target.value;
                            setStrings(rawString);
                            this.filterStrings = `${rawString}`.split(/\s+/);
                            // "" is splitted to [""], which is not I want
                            if (rawString === "") {
                                this.filterStrings = [];
                            }
                            this.filterShownChannelIndices = [];

                            const channelNames = this.getChannelNamesLevel5();
                            let index = 0;
                            for (let channelName of channelNames) {
                                let show = false;
                                for (let filterString of this.filterStrings) {
                                    if (filterString !== "" && channelName.toLocaleLowerCase().includes(filterString.toLocaleLowerCase())) {
                                        show = true;
                                        break;
                                    }
                                }
                                if (show === true) {
                                    this.filterShownChannelIndices.push(index);
                                }
                                index++;
                            }

                            if (this.forceUpdateTable !== undefined) {
                                this.forceUpdateTable();
                            }
                        }
                        }
                    >
                    </input >
                </form>
                <ElementRectangleButton
                    marginLeft={10}
                    handleClick={() => {
                        this.getChannelNamesLevel5().splice(0, 0, "");
                        this.modifyingRowIndex = 1;
                        this.forceUpdateTable();
                    }}
                >
                    Add channel
                </ElementRectangleButton>
                <ElementRectangleButton
                    marginLeft={10}
                    handleClick={() => {
                        this.showSettings = true;
                        this.forceUpdateTable();
                        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
                        g_widgets1.addToForceUpdateWidgets("GroupSelection2");
                        g_flushWidgets();
                    }}
                >
                    Settings
                </ElementRectangleButton>
                <ElementRectangleButton
                    marginLeft={10}
                    handleClick={() => {
                        const result: Record<string, any> = {};
                        for (let channelNameLevel5 of this.getChannelNamesLevel5()) {
                            const channelNameLevel4 = BaseWidget.channelNameLevel0to4(channelNameLevel5);
                            if (!channelNameLevel4.includes(".")) {
                                try {
                                    const tcaChannel = g_widgets1.getTcaChannel(channelNameLevel4);
                                    const dbrData = tcaChannel.getDbrData();
                                    result[channelNameLevel4] = dbrData;
                                } catch (e) {
                                    Log.error(e);
                                }
                            }
                        }
                        navigator.clipboard.writeText(JSON.stringify(result));
                    }}
                >
                    Copy all data
                </ElementRectangleButton>
            </div>
        )
    }

    _ElementPvTable = () => {
        const [, forceUpdate] = React.useState({});

        const tableRef = React.useRef<any>(null);

        this.forceUpdateTable = () => {
            forceUpdate({});
        }

        React.useEffect(() => {
            // in case no channel is updated in a long while, force the table to refresh
            setInterval(() => {
                if (this.forceUpdateTable !== undefined && Date.now() - this.lastTimeUpdated > 110) {
                    this.forceUpdateTable();
                }
            }, 100)
        }, [])

        this.lastTimeUpdated = Date.now();

        this.getTable().updateForceUpdateTableFunc(this.forceUpdateTable);

        if (!g_widgets1.isEditing()) {
            this.getTable().toBeUpdatedLineIndices = [...this.getTable().forceUpdatedRows];
        }

        if (!g_widgets1.isEditing() && tableRef.current !== null) {
            const scrollTop = tableRef.current.getBoundingClientRect()["top"] * -1 + this.getAllStyle()["top"];
            const visibleHeight = tableRef.current.clientHeight;
            if (scrollTop !== undefined && visibleHeight !== undefined) {
                const iStart = Math.floor(scrollTop / this.lineHeight);
                const iEnd = Math.ceil((scrollTop + visibleHeight) / this.lineHeight);
                this.getTable().toBeUpdatedLineIndices.push(...Array.from({ length: iEnd - iStart + 1 }, (_, index) => iStart + index));
            }
        }

        return (
            <div
                ref={tableRef}
                style={{
                    width: this.calcTableWidth(),
                    height: "100%",
                    fontFamily: GlobalVariables.defaultFontFamily,
                    fontSize: GlobalVariables.defaultFontSize,
                    fontWeight: GlobalVariables.defaultFontWeight,
                    fontStyle: GlobalVariables.defaultFontStyle,
                    display: 'inline-flex',
                    flexDirection: "column",
                    flexWrap: "nowrap",
                    justifyContent: "flex-start",
                    alignItems: 'center',
                    // overflow: "scroll",
                }}>
                <this._ElementHeader></this._ElementHeader>
                {/* header line */}
                <this._ElementTableLine selectable={false}>
                    <div style={{
                        width: 3,
                        height: "100%",
                        boxSizing: "border-box",
                    }}>
                    </div>

                    {/* PV name */}
                    <this._ElementTableCell columnIndex={0} additionalStyle={{ justifyContent: "space-between" }}>
                        {/* content */}
                        Name
                        {/* no options */}
                        {/* resizer */}
                        <this._ElementTableHeaderResizer columnIndex={0}></this._ElementTableHeaderResizer>
                    </this._ElementTableCell>
                    {/* PV value */}
                    <this._ElementTableCell columnIndex={1} additionalStyle={{ justifyContent: "space-between" }}>
                        set value
                        {/* no options */}
                        {/* resizer */}
                        <this._ElementTableHeaderResizer columnIndex={1}></this._ElementTableHeaderResizer>

                    </this._ElementTableCell>
                    {/* PV fields  */}
                    {this.getFieldlNames().map((fieldName: string, index: number) => {
                        return (
                            <this._ElementTableCell
                                key={`${fieldName}-${index}`}
                                columnIndex={index + 2}
                                additionalStyle={{ justifyContent: "space-between" }}
                            >
                                {/* field name, with Input */}
                                <this._ElementTableHeaderFieldName key={`${fieldName}-${index}-fieldName`} columnIndex={index + 2}></this._ElementTableHeaderFieldName>
                                {/* options */}
                                <this._ElementTableHeaderOptionsMenu key={`${fieldName}-${index}-optionsButton`} columnIndex={index + 2}></this._ElementTableHeaderOptionsMenu>
                                {/* resizer */}
                                <this._ElementTableHeaderResizer key={`${fieldName}-${index}-resizer`} columnIndex={index + 2}></this._ElementTableHeaderResizer>

                            </this._ElementTableCell>
                        );
                    })}
                </this._ElementTableLine>
                {/* content lines */}
                {
                    this.getChannelNamesLevel5().map((channelNameLevel5: string, channelNameIndex: number) => {
                        let channelNameIndexTmp = -5;
                        if (this.filterShownChannelIndices.length > 0) {
                            const abc = this.filterShownChannelIndices.indexOf(channelNameIndex)
                            if (abc !== -1) {
                                channelNameIndexTmp = abc;
                            }
                        } else {
                            if (this.filterStrings.length === 0) {
                                channelNameIndexTmp = channelNameIndex;
                            }
                        }
                        const shownInFilter = this.filterShownChannelIndices.length === 0 ? this.filterStrings.length === 0 ? true : false : this.filterShownChannelIndices.includes(channelNameIndex);
                        const shownInWindow = this.getTable().toBeUpdatedLineIndices.includes(channelNameIndexTmp);


                        // lazy rendering
                        if (!shownInFilter) {
                            return null;
                        } else {
                            if (shownInWindow) {
                                // level 5 channel name is basically level 0 without field name
                                const channelNameLevel4 = BaseWidget.channelNameLevel0to4(channelNameLevel5, this.getMacros());
                                let severity = ChannelSeverity.INVALID;
                                try {
                                    const channel = g_widgets1.getTcaChannel(channelNameLevel5);
                                    severity = channel.getDbrData()["severity"]; // not SEVR
                                } catch (e) {
                                    severity = ChannelSeverity.INVALID;
                                }
                                return (
                                    <this._ElementTableLineMemo
                                        key={`${channelNameLevel4}-${channelNameIndex}`}
                                        lineIndex={channelNameIndexTmp}
                                        selectable={false}
                                        additionalStyle={{
                                        }}
                                    >
                                        <div style={{
                                            width: 3,
                                            height: "100%",
                                            boxSizing: "border-box",
                                            borderLeft: AlarmOutlineStyle[severity]
                                        }}>

                                        </div>
                                        {/* PV name */}
                                        <this._ElementTableCell columnIndex={0} AdditionalStyle={{ justifyContent: "space-between" }}>
                                            <this._ElementTableLineChannelName key={`${channelNameLevel4}-${channelNameIndex}-channelName`} rowIndex={channelNameIndex + 1}></this._ElementTableLineChannelName>
                                            {/* <this._ElementTableLineOptionsButton channelNameIndex={channelNameIndex}></this._ElementTableLineOptionsButton> */}
                                            <this._ElementTableLineOptionsMenu channelNameIndex={channelNameIndex}></this._ElementTableLineOptionsMenu>
                                        </this._ElementTableCell>
                                        {/* PV value set */}
                                        <this._ElementTableCell columnIndex={1}>
                                            <this._ElementChannelValueInputDiv channelNameLevel4={channelNameLevel4} fieldName={"value"}></this._ElementChannelValueInputDiv>
                                        </this._ElementTableCell>
                                        {/* PV fields  */}
                                        {this.getFieldlNames().map((fieldName: string, index: number) => {
                                            let channelValue: string | number | string[] | number[] | undefined = 'undefined';
                                            if (this.getTable().toBeUpdatedLineIndices.includes(channelNameIndexTmp)) {
                                                channelValue = this.getChannelValue(channelNameLevel4, fieldName);
                                            }
                                            return (
                                                <this._ElementTableCell
                                                    key={`${fieldName}-${index}`}
                                                    columnIndex={index + 2}
                                                >
                                                    {channelValue}
                                                </this._ElementTableCell>
                                            );
                                        })}
                                    </this._ElementTableLineMemo>
                                );
                            }
                            else {
                                return <this._ElementTableLineMemo
                                    key={`${channelNameLevel5}-${channelNameIndex}`}
                                    lineIndex={channelNameIndexTmp}
                                >
                                </this._ElementTableLineMemo>;

                            }
                        }
                    })
                }
            </div >
        )

    };


    _ElementChannelValueInputDiv = ({ channelNameLevel4, fieldName }: any) => {
        // always string type
        const [value, setValue] = React.useState(`${this.getChannelValue(channelNameLevel4, fieldName)}`);
        const elementRef = React.useRef<any>(null);
        const currentValue = this.getChannelValue(channelNameLevel4, fieldName);
        if (fieldName === "" || channelNameLevel4 === "") {
            return null;
        } else {

            return (
                <form
                    style={{
                        width: "100%",
                        height: "100%",
                    }}
                    onSubmit={(event: any) => {
                        event.preventDefault();
                        try {
                            const tcaChannel = g_widgets1.getTcaChannel(channelNameLevel4);
                            // if user includes the unit, the put() is able to parseInt() or praseFloat() the text before unit
                            const displayWindowId = g_widgets1.getRoot().getDisplayWindowClient().getWindowId();
                            tcaChannel.put(displayWindowId, { value: value }, 1);
                        } catch (e) {
                            Log.error(e);
                        }

                        elementRef.current?.blur();
                    }}
                >
                    <input
                        style={{
                            backgroundColor: "rgba(0,0,0,0)",
                            padding: 0,
                            border: "solid 1px rgba(0,0,0,0)",
                            outline: "none",
                            boxSizing: "border-box",
                            width: "100%",
                            height: "100%",
                        }}
                        onMouseOver={() => {
                            if (elementRef.current !== null) {
                                elementRef.current.style["border"] = "solid 1px rgba(0,0,0,1)";
                            }
                        }}
                        onMouseLeave={() => {
                            if (elementRef.current !== null) {
                                if (document.activeElement !== elementRef.current) {
                                    elementRef.current.style["border"] = "solid 1px rgba(0,0,0,0)";
                                }
                            }
                        }}
                        ref={elementRef}
                        type="text"
                        value={(document.activeElement === elementRef.current ? value : currentValue) as (string | number | readonly string[] | undefined)}
                        onChange={(event: any) => {
                            event.preventDefault();
                            setValue(event.target.value);
                        }}
                        onFocus={(event: any) => {
                            event.preventDefault();
                            setValue(`${this.getChannelValue(channelNameLevel4, fieldName)}`);
                            if (elementRef.current !== null) {
                                elementRef.current.style["border"] = "solid 1px rgba(0,0,0,1)";
                            }
                        }}
                        onBlur={(event: any) => {
                            event.preventDefault();
                            if (elementRef.current !== null) {
                                elementRef.current.style["border"] = "solid 1px rgba(0,0,0,0)";
                            }
                        }}
                        // why it cannot be focused
                        onClick={(event: any) => {
                            if (elementRef.current !== null) {
                                elementRef.current.focus()
                            }
                        }}
                    ></input>
                </form>
            );
        }
    };

    getChannelValue = (baseChannelName: string, fieldName: string) => {
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return `${baseChannelName}.${fieldName}`;
        }
        // val1.SEVR
        if (baseChannelName.includes(".")) {
            // val1.SEVR has "value", "units" and "time", all other fields are ignored
            if (fieldName === "value") {
                // val1.SEVR.value === (val1.SEVR).dbrData("value")
                return g_widgets1.getChannelValue(baseChannelName);
            } else {
                try {
                    const tcaChannel = g_widgets1.getTcaChannel(baseChannelName);
                    const dbrData = tcaChannel.getDbrData();
                    if (fieldName === "units") {
                        // val1.SEVR.units === (val1.SEVR).dbrData["units"]
                        return dbrData["units"];
                    } else if (fieldName === "severity") {
                        // val1.SEVR.severity === (val1.SEVR).dbrData["severity"]
                        return ChannelSeverity[dbrData["severity"]];
                    } else if (fieldName === "time") {
                        // val1.SEVR.time === (val1.SEVR).dbrData["timeStamp"]
                        const s = dbrData["secondsSinceEpoch"];
                        const ns = dbrData["nanoSeconds"];
                        if (s !== undefined && ns !== undefined) {
                            return GlobalMethods.converEpicsTimeStampToString(s * 1000 + ns / 1e6);
                        } else {
                            return undefined;
                        }
                    } else {
                        // val1.SEVR.RTYP === undefined
                        return undefined;
                    }
                } catch (e) {
                    Log.error(e);
                    return undefined;
                }
            }
        } else // val1
        {
            if (fieldName === "value") {
                // val1.value === val1.dbrData("value")
                return g_widgets1.getChannelValue(baseChannelName);
            } else {
                try {
                    const tcaChannel = g_widgets1.getTcaChannel(baseChannelName);
                    const dbrData = tcaChannel.getDbrData();
                    if (fieldName === "units") {
                        // val1.units === val1.dbrData["units"]
                        return dbrData["units"];
                    } else if (fieldName === "severity") {
                        // val1.severity === val1.dbrData["severity"]
                        return ChannelSeverity[dbrData["severity"]];
                    } else if (fieldName === "time") {
                        // val1.time === val1.dbrData["timeStamp"]
                        const s = dbrData["secondsSinceEpoch"];
                        const ns = dbrData["nanoSeconds"];
                        if (s !== undefined && ns !== undefined) {
                            return GlobalMethods.converEpicsTimeStampToString(s * 1000 + ns / 1e6);
                        } else {
                            return undefined;
                        }
                    }
                    // val1.SEVR === (val1.SEVR).dbrData["SEVR"]
                    return g_widgets1.getChannelValue(`${baseChannelName}.${fieldName}`);
                } catch (e) {
                    Log.error(e);
                    return undefined;
                }
            }
        }
    };

    // override
    getTdlCopy = (newKey: boolean = true): Record<string, any> => {
        const result = super.getTdlCopy(newKey);
        // result.fieldNames = this.getStrippedFieldNames();
        result.fieldNames = this.getFieldlNames();
        result.macros = JSON.parse(JSON.stringify(this.getMacros()));
        result.channelNames = JSON.parse(JSON.stringify(this.getChannelNamesLevel5()));
        return result;
    };

    // concretize abstract method
    _Element = React.memo(this._ElementRaw, () => this._useMemoedElement());
    _ElementArea = React.memo(this._ElementAreaRaw, () => this._useMemoedElement());
    _ElementBody = React.memo(this._ElementBodyRaw, () => this._useMemoedElement());

    // _Element = React.memo(this._ElementRaw, () => false);
    // _ElementArea = React.memo(this._ElementAreaRaw, () => true);
    // _ElementBody = React.memo(this._ElementBodyRaw, () => true);

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

    // -------------------------- tdl -------------------------------

    // override BaseWidget
    static _defaultTdl: type_PvTable_tdl = {
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
            channelPropertyNames: [],
        },
        channelNames: [],
        groupNames: [],
        rules: [],
        macros: [],
        // fieldNames: ["VAL", "RTYP", "SEVR", "TIME", "UNITS"],
        fieldNames: ["value", "RTYP", "severity", "time", "units"],
    };

    // override
    static generateDefaultTdl = (type: string) => {
        // defines type, widgetKey, and key
        const result = super.generateDefaultTdl(type) as type_PvTable_tdl;
        result.style = JSON.parse(JSON.stringify(this._defaultTdl.style));
        result.text = JSON.parse(JSON.stringify(this._defaultTdl.text));
        result.channelNames = JSON.parse(JSON.stringify(this._defaultTdl.channelNames));
        result.groupNames = JSON.parse(JSON.stringify(this._defaultTdl.groupNames));
        result.macros = JSON.parse(JSON.stringify(this._defaultTdl.macros));
        result.fieldNames = JSON.parse(JSON.stringify(this._defaultTdl.fieldNames));
        return result;
    };

    // static method for generating a widget tdl with external PV name
    // not the
    static generateWidgetTdl = (utilityOptions: Record<string, any>): type_PvTable_tdl => {
        const result = this.generateDefaultTdl("PvTable");
        result.channelNames = utilityOptions.channelNames as string[];
        return result;
    };

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
    // -------------------------- sidebar ---------------------------
    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new PvTableSidebar(this);
        }
    }
}
