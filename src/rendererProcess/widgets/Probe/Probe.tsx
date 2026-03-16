import * as GlobalMethods from "../../../common/GlobalMethods";
import * as React from "react";
import { Channel_ACCESS_RIGHTS } from "../../../common/GlobalVariables";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { ProbeSidebar } from "./ProbeSidebar";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { DbdFiles } from "../../channel/DbdFiles";
import { TcaChannel } from "../../channel/TcaChannel";
import { ElementRectangleButton, ElementRectangleButtonDefaultBackgroundColor, ElementRectangleButtonDefaultTextColor } from "../../helperWidgets/SharedElements/RectangleButton";
import { Log } from "../../../common/Log";
import { ElementJsonViewer } from "../../helperWidgets/SharedElements/JsonViewer";
import { mergePvaTypeAndData } from "../../../common/GlobalMethods";
import { type_Probe_tdl, defaultProbeTdl } from "../../../common/types/type_widget_tdl";
import { type_dbd, type_dbd_menus } from "../../../common/types/type_dbd";
import { Table } from "../../helperWidgets/Table/Table";

export class Probe extends BaseWidget {

    private _dbdFiles: DbdFiles = new DbdFiles({}, {});
    private readonly _channelNamesLevel5: string[] = [];
    private readonly _basicInfoData: Record<string, string> = {};

    _Table: Table;
    _Line: ({ children, additionalStyle, lineIndex, selectable }: any) => React.JSX.Element;
    _Cell: ({ children, columnIndex, additionalStyle }: any) => React.JSX.Element;

    constructor(widgetTdl: type_Probe_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this.setReadWriteType("write");

        // 3 columns
        this._Table = new Table([150, 400, 50], this);
        this._Line = this._Table.getElementTableLine();
        this._Cell = this._Table.getElementTableCell();

        this._sidebar = new ProbeSidebar(this);


        // single-window DataViewer does not use "100%" for width or height
        // it needs explicit dimension for proper plotting of traces
        // when the window is resized
        this.registerUtilityWindowResizeCallback((event: UIEvent) => {
            g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
            g_flushWidgets();
        })
    }

    // ------------------------------ elements ---------------------------------

    _ElementRaw = () => {
        // guard the widget from double rendering
        this.widgetBeingRendered = true;
        React.useEffect(() => {
            this.widgetBeingRendered = false;
        });
        g_widgets1.removeFromForceUpdateWidgets(this.getWidgetKey());

        this.updateAllStyleAndText();

        return (
            <ErrorBoundary style={this.getStyle()} widgetKey={this.getWidgetKey()}>
                <div style={this.getElementBodyRawStyle()}>
                    <this._ElementArea></this._ElementArea>
                    {this.showResizers() ? <this._ElementResizer /> : null}
                </div>
                {this.showSidebar() ? this.getSidebar()?.getElement() : null}
            </ErrorBoundary>
        );
    };

    _ElementAreaRaw = (): React.JSX.Element => {
        this.extractBasicInfo();

        const padding = g_widgets1.getRoot().getDisplayWindowClient().getIsUtilityWindow() ? 15 : 0;

        return (
            <div
                style={{
                    display: "inline-flex",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    userSelect: "none",
                    flexDirection: "column",
                    paddingBottom: 0,
                    overflowX: "hidden",
                    overflowY: "auto",
                    padding: padding,
                    boxSizing: "border-box",
                }}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                <this._ElementProbe />
            </div>
        );
    };

    _Element = React.memo(this._ElementRaw, () => this._useMemoedElement());
    _ElementArea = React.memo(this._ElementAreaRaw, () => this._useMemoedElement());

    _ElementProbe = () => {

        if (g_widgets1.isEditing() === true) {
            return (
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
                    <div>
                        <b>Probe&nbsp;&nbsp;</b>
                    </div>
                </div>
            );
        }

        const [filterValue, setFilterValue] = React.useState("");

        return (
            <div>
                <this._ElementTitle />
                <this._ElementBasics></this._ElementBasics>
                <this._ElementPvaData />
                <this._ElementFieldsTitle />
                <this._ElementFilter filterValue={filterValue} setFilterValue={setFilterValue} />
                <this._ElementFields filterValue={filterValue} />
                <this._ElementCopyAllButton />
            </div>
        )
    }

    _ElementTitle = () => {
        const [channelName, setChannelName] = React.useState(this.getChannelNames()[0]);

        // channel name hint
        const inputElementRef = React.useRef<HTMLInputElement>(null);
        const formElementRef = React.useRef<HTMLFormElement>(null);
        const [showChannelNameHint, setShowChannelNameHint] = React.useState(false);
        const ChannelNameHintElement = g_widgets1.getRoot().getDisplayWindowClient().getChannelNameHint()._Element;
        const [channelNameHintElementDimension, setChannelNameHintElementDimension] = React.useState({ width: 0, maxHeight: 0, left: 0, top: 0 });
        const [channelNameHintData, setChannelNameHintData] = React.useState<string[]>([]);
        const selectHint = (channelName: string) => {
            this.newProbe(channelName);
            setChannelName(channelName);
            setShowChannelNameHint(false)
        }

        return (
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
                <div>
                    <b>Probe&nbsp;for&nbsp;</b>
                </div>
                <div
                    style={{
                        flexGrow: 1,
                    }}
                >
                    <form
                        ref={formElementRef}
                        onSubmit={(event) => {
                            event.preventDefault();
                            this.newProbe(channelName);
                            (event.currentTarget.elements[0] as HTMLInputElement).blur();
                            setShowChannelNameHint(false);
                        }}
                        style={{
                            fontSize: 25,
                            backgroundColor: "rgba(255,255,0,0)",
                            width: "100%",
                            fontFamily: "bold",
                        }}
                    >
                        <this._ElementPvInput
                            ref={inputElementRef}
                            type="text"
                            name="channelName"
                            placeholder="PV Name"
                            value={channelName}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                const newVal = event.target.value;
                                setChannelName(newVal);

                                // send query for channel name if there are more than 1 character input
                                if (newVal.trim().length >= 2) {
                                    const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
                                    const queryStr = displayWindowClient.generateChannelLookupQuery(newVal);
                                    if (queryStr !== "") {
                                        fetch(queryStr)
                                            .then(res => res.json())
                                            .then((data: any) => {
                                                if (Object.keys(data).length > 0 && formElementRef.current !== null) {
                                                    const recForm = formElementRef.current.getBoundingClientRect();
                                                    setChannelNameHintElementDimension({
                                                        left: 0,
                                                        top: recForm.height + 5,
                                                        width: recForm.width - 5,
                                                        maxHeight: 400,
                                                    })
                                                    setChannelNameHintData(Object.keys(data));
                                                    setShowChannelNameHint(true);
                                                } else {
                                                    setChannelNameHintData(data);
                                                    setShowChannelNameHint(false);
                                                }
                                            })
                                    }
                                }

                            }}
                            onBlur={() => {
                                setShowChannelNameHint(false);
                                setChannelNameHintData([]);

                                const orig = this.getChannelNames()[0];
                                console.log("orig", orig, channelName)
                                if (orig !== channelName) {
                                    if (orig === undefined) {
                                        setChannelName(orig);
                                    } else {
                                        setChannelName(orig);
                                    }
                                }
                            }}
                            onFocus={() => {
                                inputElementRef.current?.select();
                            }}
                        />
                        <ChannelNameHintElement
                            show={showChannelNameHint}
                            additionalStyle={channelNameHintElementDimension}
                            channelNames={channelNameHintData}
                            selectHint={selectHint}
                        ></ChannelNameHintElement>

                    </form>
                </div>
            </div>
        );
    };

    /**
     * React component for channel name input in title, it is part of _ElementTitle
     */
    _ElementPvInput = ({ additionalStyle, onChange, value, onBlur }: any) => {
        const refElement = React.useRef<HTMLInputElement>(null);
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
                onFocus={(event) => {
                    event.preventDefault();
                    if (refElement.current !== null) {
                        refElement.current.style["color"] = "red";
                    }
                }}
                onBlur={(event) => {
                    event.preventDefault();
                    if (refElement.current !== null) {
                        refElement.current.style["color"] = "rgba(0,0,0,1)";
                    }
                    onBlur();
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

    /**
     * Basics section of the Probe UI.
     *
     * Renders a three-column table (Property / Value / Copy) whose rows
     * are derived from {@link _basicInfoData} (populated by
     * {@link extractBasicInfo}).  The "Value" row embeds an editable
     * {@link _ElementValueInputForm} so the user can write to the channel;
     * every other row displays a read-only string with a per-row Copy
     * button.
     *
     * Two special action rows are appended at the bottom:
     * - {@link _ElementLineProcess} — force-processes the record.
     * - {@link _ElementLineRecordGeneration} — generates an EPICS `.db`
     *   record definition from live data.
     */
    _ElementBasics = () => {
        const basicInfoData = this.getBasicInfoData();

        return (
            <div>
                <div>
                    <h3>Basics</h3>
                </div>

                {/* header line */}
                <this._Line selectable={false}>
                    <this._Cell columnIndex={0}>
                        <b>Property</b>
                    </this._Cell>
                    <this._Cell columnIndex={1}>
                        <b>Value</b>
                    </this._Cell>
                    <this._Cell columnIndex={2}>
                    </this._Cell>
                </this._Line>

                {/* content lines */}
                {Object.entries(basicInfoData).map(([key, value]: [string, string], index: number) => {
                    return (
                        <this._Line key={`basics-${index}`} lineIndex={index} selectable={false}>
                            <this._Cell columnIndex={0}>
                                {key}
                            </this._Cell>
                            <this._Cell columnIndex={1}>
                                {key === "Value" ?
                                    <this._ElementValueInputForm />
                                    : value
                                }
                            </this._Cell>
                            <this._Cell columnIndex={2}>
                                <ElementRectangleButton
                                    paddingLeft={3}
                                    paddingRight={3}
                                    paddingTop={1}
                                    paddingBottom={1}
                                    defaultBackgroundColor={"rgba(0,0,0,0)"}
                                    defaultTextColor={"rgba(0,0,0,0)"}
                                    highlightBackgroundColor={ElementRectangleButtonDefaultBackgroundColor}
                                    highlightTextColor={ElementRectangleButtonDefaultTextColor}
                                    handleClick={() => {
                                        const val = Object.values(basicInfoData)[index];
                                        navigator.clipboard.writeText(`${val}`);
                                    }}
                                >
                                    Copy
                                </ElementRectangleButton>
                            </this._Cell>
                        </this._Line>
                    );
                })}
                <this._ElementLineProcess />
                <this._ElementLineRecordGeneration />
            </div>
        )
    }

    /**
     * Table row that lets the user force-process the current record.
     *
     * Clicking the highlighted "here" text writes `1` to the channel's
     * `.PROC` field via {@link TcaChannel.put}, which triggers the
     * record's processing routine on the IOC.
     *
     * Used inside {@link _ElementBasics}.
     */
    _ElementLineProcess = () => {
        const elementProcessRef = React.useRef<HTMLSpanElement>(null);
        return (
            <this._Line lineIndex={-1} selectable={false}>
                <this._Cell columnIndex={0}>
                    Process
                </this._Cell>
                <this._Cell columnIndex={1}>
                    <div
                        style={{
                            display: "inline-flex",
                        }}
                    >
                        Click<span ref={elementProcessRef}
                            style={{
                                cursor: "pointer",
                            }}
                            onClick={() => {
                                try {
                                    const channelName = this.getChannelNames()[0].split(".")[0];
                                    const tcaChannel = g_widgets1.getTcaChannel(channelName + ".PROC");
                                    const displayWindowId = g_widgets1.getRoot().getDisplayWindowClient().getWindowId();
                                    tcaChannel.put(displayWindowId, { value: 1 }, 1);
                                } catch (e) {
                                    const errMsg = `Channel ${this.getChannelNames()} cannot be found`;
                                    Log.error(errMsg);
                                    Log.error(e);
                                }
                            }}
                            onMouseEnter={() => {
                                if (elementProcessRef.current !== null) {
                                    elementProcessRef.current.style["outline"] = "solid 3px rgba(180, 180, 180, 1)";
                                }
                            }}
                            onMouseLeave={() => {
                                if (elementProcessRef.current !== null) {
                                    elementProcessRef.current.style["outline"] = "none";
                                }
                            }}
                        >&nbsp;here&nbsp;</span>to process this channel
                    </div>
                </this._Cell>
                <this._Cell columnIndex={2}>
                </this._Cell>
            </this._Line>
        );
    };

    /**
     * Table row that lets the user generate an EPICS `.db` record
     * definition from the live field values.
     *
     * Provides two clickable links:
     * - **"here"** (full) — calls {@link generateRecord} with all fields,
     *   unchanged fields are commented out.
     * - **"here"** (short) — calls {@link generateRecord} with
     *   `shortVersion = true`, omitting fields at their default values.
     *
     * The resulting text is opened in a new text-editor window. If the
     * record type cannot be determined, an error dialog is shown instead.
     *
     * Used inside {@link _ElementBasics}.
     */
    _ElementLineRecordGeneration = () => {
        const elementGenerateRecord = React.useRef<HTMLSpanElement>(null);
        const elementGenerateRecordShort = React.useRef<HTMLSpanElement>(null);
        return (
            <this._Line lineIndex={-1} selectable={false}>
                <this._Cell columnIndex={0}>
                    Record definition
                </this._Cell>
                <this._Cell columnIndex={1}>
                    <div
                        style={{
                            display: "inline-flex",
                        }}
                    >
                        Click<span ref={elementGenerateRecord}
                            style={{
                                cursor: "pointer",
                            }}
                            onClick={() => {
                                const record = this.generateRecord();
                                if (record.startsWith("# failed to")) {
                                    const ipcManager = g_widgets1.getRoot().getDisplayWindowClient().getIpcManager();
                                    ipcManager.handleDialogShowMessageBox(undefined, {
                                        info: {
                                            messageType: "error",
                                            humanReadableMessages: [`Failed to generate record for channel ${this.getChannelNames()[0]}`],
                                            rawMessages: ["Did not find the record type"],
                                        }
                                    })
                                    return;
                                }
                                const displayWindowId = g_widgets1.getRoot().getDisplayWindowClient().getWindowId();
                                g_widgets1.openTextEditorWindow({
                                    displayWindowId: displayWindowId,
                                    widgetKey: this.getWidgetKey(),
                                    fileName: "",
                                    manualOpen: false,
                                    openNewWindow: true,
                                    fileContent: record,
                                })
                            }}
                            onMouseEnter={() => {
                                if (elementGenerateRecord.current !== null) {
                                    elementGenerateRecord.current.style["outline"] = "solid 3px rgba(180, 180, 180, 1)";
                                }
                            }}
                            onMouseLeave={() => {
                                if (elementGenerateRecord.current !== null) {
                                    elementGenerateRecord.current.style["outline"] = "none";
                                }
                            }}
                        >&nbsp;here&nbsp;</span>to show the full record,
                        <span ref={elementGenerateRecordShort}
                            style={{
                                cursor: "pointer",
                            }}
                            onClick={() => {
                                const record = this.generateRecord(true);
                                if (record.startsWith("# failed to")) {
                                    const ipcManager = g_widgets1.getRoot().getDisplayWindowClient().getIpcManager();
                                    ipcManager.handleDialogShowMessageBox(undefined, {
                                        info: {
                                            messageType: "error",
                                            humanReadableMessages: [`Failed to generate record for channel ${this.getChannelNames()[0]}`],
                                            rawMessages: ["Did not find the record type"],
                                        }
                                    })
                                    return;
                                }
                                const displayWindowId = g_widgets1.getRoot().getDisplayWindowClient().getWindowId();
                                g_widgets1.openTextEditorWindow({
                                    displayWindowId: displayWindowId,
                                    widgetKey: this.getWidgetKey(),
                                    fileName: "",
                                    manualOpen: false,
                                    openNewWindow: true,
                                    fileContent: record,
                                })
                            }}
                            onMouseEnter={() => {
                                if (elementGenerateRecordShort.current !== null) {
                                    elementGenerateRecordShort.current.style["outline"] = "solid 3px rgba(180, 180, 180, 1)";
                                }
                            }}
                            onMouseLeave={() => {
                                if (elementGenerateRecordShort.current !== null) {
                                    elementGenerateRecordShort.current.style["outline"] = "none";
                                }
                            }}
                        >&nbsp;here&nbsp;</span>
                        for short version.
                    </div>
                </this._Cell>
                <this._Cell columnIndex={2}>
                </this._Cell>
            </this._Line>
        );
    };

    /**
     * Collapsible JSON tree showing the raw PV Access data.
     *
     * Only rendered when the current channel uses the `pva` protocol.
     * Returns `null` for Channel Access channels or when the channel
     * cannot be found.
     *
     * The PVA type and data are merged via {@link mergePvaTypeAndData}
     * and displayed using {@link ElementJsonViewer}.  The PVA structure
     * type name (e.g. `"epics:nt/NTScalar:1.0"`) is shown in the header.
     */
    _ElementPvaData = () => {
        let tcaChannel: undefined | TcaChannel = undefined;
        try {
            tcaChannel = g_widgets1.getTcaChannel(this.getChannelNames()[0]);
        } catch (e) {
            Log.error(e);
        }

        if (tcaChannel === undefined || tcaChannel.getProtocol() !== "pva") {
            return null;
        }

        const pvaData = tcaChannel.getDbrData();
        const pvaType = tcaChannel.getPvaType();
        let jsonDataAndType: any = {};
        let jsonTypeName = "";
        if (pvaData !== undefined && pvaType !== undefined) {
            try {
                const dataAndTypeFull = mergePvaTypeAndData(pvaType, "", pvaData);
                jsonTypeName = dataAndTypeFull["key"];
                jsonDataAndType = dataAndTypeFull["data"];
            } catch (e) {
                Log.error(e);
            }
        }

        return (
            <div>
                <h3>PV Access Raw Data {jsonTypeName === "" ? "" : "( " + jsonTypeName + ")"}</h3>
                {g_widgets1.getChannelProtocol(this.getChannelNames()[0]) === "pva" ?
                    <ElementJsonViewer json={jsonDataAndType} topLevel={true}></ElementJsonViewer>
                    : null
                }
            </div>
        );
    };

    /**
     * Header and colour legend for the Fields section.
     *
     * Displays the "Fields" heading followed by a legend explaining the
     * colour coding used in {@link _ElementFields}:
     *
     * - **Grey** — read-only field (no write access).
     * - **Green** — menu-type field (selectable drop-down).
     * - **Blue** — link-type field (click to open a new Probe).
     * - **Red** — value differs from its default.
     */
    _ElementFieldsTitle = () => {
        return (
            <>
                <div>
                    <h3>Fields</h3>
                </div>
                <div>
                    <span style={{ color: "rgba(150, 150, 150, 1)" }}>GREY</span>: field is not writable
                </div>
                <div>
                    <span style={{ color: "rgba(46, 180, 64, 1.0)" }}>GREEN</span>: menu-type field, the value can be changed by selecting from the drop-down menu
                </div>
                <div>
                    <span style={{ color: "rgba(0,0,255,1)" }}>BLUE</span>: link-type field, clicking the blue text will open a new Probe window for the linked
                    PV
                </div>
                <div>
                    <span style={{ color: "rgba(255,0,0,1)" }}>RED</span>: field value is different from its default value
                </div>
                <div>&nbsp;</div>
            </>
        );
    };

    /**
     * Text input for filtering the displayed record fields.
     *
     * The user can type one or more space-separated tokens; a field is
     * shown if its name contains any of the tokens (case-insensitive
     * match performed in {@link _ElementFields}).
     *
     * @param filterValue - The current filter string.
     * @param setFilterValue - State setter to update the filter string.
     */
    _ElementFilter = ({ filterValue, setFilterValue }: {
        filterValue: string,
        setFilterValue: React.Dispatch<React.SetStateAction<string>>,
    }) => {
        const filterElementRef = React.useRef<HTMLInputElement>(null);
        return (
            <>
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
                        onChange={(event) => {
                            event.preventDefault();
                            const newValue = event.target.value;
                            setFilterValue(newValue);
                        }}
                        value={filterValue}
                    ></input>
                </div>
                <div>&nbsp;</div>
            </>
        );
    };

    /**
     * List of all record fields for the current channel.
     *
     * Iterates over every field name returned by the DBD definition,
     * applies the space-separated filter from {@link _ElementFilter},
     * skips `DBF_NOACCESS` fields, and renders each remaining field as
     * an {@link _ElementTableLineField} row.
     *
     * Menu-type fields are rendered with a drop-down selector; link-type
     * fields are clickable and open a new Probe window for the linked PV.
     *
     * @param filterValue - The current filter string used to match field
     *   names (space-separated tokens, matched case-insensitively).
     */
    _ElementFields = ({ filterValue }: { filterValue: string }) => {
        const dbdFiles = this.getDbdFiles();
        return (
            <div>
                {
                    this.getFieldNames().map((fieldName: string, index: number) => {


                        const filterValueArray = filterValue.trim().split(" ");
                        let filterMatch = false;
                        for (let filterValueElement of filterValueArray) {
                            filterMatch = filterMatch || fieldName.includes(filterValueElement.trim().toUpperCase());
                        }

                        if (!filterMatch) {
                            return null;
                        }


                        // do not show DBF_NOACCESS channel
                        const rtyp = this.getRtyp();
                        const fieldType = dbdFiles.getFieldType(rtyp, fieldName);
                        if (fieldType === "DBF_NOACCESS" || fieldType === undefined) {
                            return null;
                        }
                        const channelName = `${this.getChannelNamesLevel4()[0]}.${fieldName}`;
                        const value = g_widgets1.getChannelValue(channelName);
                        if (value === undefined) {
                            return null;
                        }

                        const fieldMenu = dbdFiles.getFieldMenu(rtyp, fieldName);
                        const fieldDefaultValue = dbdFiles.getFieldDefaultValue(rtyp, fieldName);
                        const fieldIsLink = dbdFiles.fieldIsLink(rtyp, fieldName);

                        const isMenuField = fieldMenu.length > 0;
                        return (
                            <this._ElementTableLineField
                                index={index}
                                property={fieldName}
                                value={value}
                                defaultValue={fieldDefaultValue}
                                isLink={fieldIsLink}
                                isMenu={isMenuField}
                                channelName={channelName}
                                fieldMenu={fieldMenu}
                            ></this._ElementTableLineField>

                        )
                    })}
            </div>
        );
    };

    _ElementCopyAllButton = () => {
        return (
            <div
                style={{
                    paddingBottom: 20,
                    marginTop: 10,
                }}
            >
                <ElementRectangleButton
                    handleClick={(event) => {
                        const result: Record<string, string | number | string[] | number[] | undefined> = structuredClone(this.getBasicInfoData());
                        for (let fieldName of this.getFieldNames()) {
                            const channelName = `${this.getChannelNamesLevel4()[0]}.${fieldName}`;
                            // value may be undefined for NOACCESS type data, that's fine
                            const value = g_widgets1.getChannelValue(channelName);
                            result[fieldName] = value;
                        }
                        navigator.clipboard.writeText(JSON.stringify(result, null, 4));
                    }}
                >
                    Copy All
                </ElementRectangleButton>
            </div>
        );
    };


    /**
     * React component for 
     */
    _ElementTableLineField = ({ index, property, value, defaultValue, isLink, isMenu, channelName, fieldMenu }: any) => {
        console.log(channelName, value)
        const valueElementRef = React.useRef<HTMLInputElement>(null);
        const nameElementRef = React.useRef<HTMLDivElement>(null);
        // always a string
        const [inputValue, setInputValue] = React.useState(`${value}`);

        React.useEffect(() => {
            setInputValue(`${value}`);
        }, [value]);

        const accessRight = this._getChannelAccessRight();
        const canWrite = accessRight > Channel_ACCESS_RIGHTS.READ_ONLY;
        const fieldNameColor = isMenu ? "rgba(46, 180, 64, 1.0)" : isLink ? "rgba(0,0,255,1)" : "rgba(0,0,0,1)";
        const valueColor = value === defaultValue ? canWrite ? "rgba(0,0,0,1)" : "rgba(150, 150, 150, 1)" : "rgba(255,0,0,1)";

        return (
            <this._Line lineIndex={index} selectable={false}>
                <this._Cell columnIndex={0} additionalStyle={{
                    cursor: isLink ? "pointer" : "default",
                    color: fieldNameColor,
                }}>
                    <div
                        ref={nameElementRef}
                        onClick={() => {
                            if (isLink && typeof value === "string" && value !== "") {
                                const channelName = value.split(" ")[0];
                                const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
                                const displayWindowId = displayWindowClient.getWindowId();
                                const mainProcessMode = displayWindowClient.getMainProcessMode();
                                if (mainProcessMode === "web") {
                                    g_widgets1.openProbeWindow([], channelName);
                                } else {
                                    g_widgets1
                                        .getRoot()
                                        .getDisplayWindowClient()
                                        .getIpcManager()
                                        .sendFromRendererProcess("create-utility-display-window",
                                            {
                                                utilityType: "Probe",
                                                utilityOptions: { channelNames: [channelName] },
                                                windowId: displayWindowId,
                                            }
                                        );
                                }
                            }
                        }}
                    >
                        {property}
                    </div>
                </this._Cell>
                <this._Cell columnIndex={1}>
                    {!isMenu ? (
                        // input value
                        <form
                            onSubmit={(event) => {
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
                                    color: valueColor,
                                    cursor: accessRight === Channel_ACCESS_RIGHTS.READ_WRITE ? "default" : "not-allowed",
                                }}
                                type="text"
                                onChange={(event) => {
                                    event.preventDefault();
                                    setInputValue(event.target.value);
                                }}
                                readOnly={accessRight === Channel_ACCESS_RIGHTS.READ_WRITE ? false : true}
                                value={inputValue}
                            ></input>
                        </form>
                    ) : (
                        // menu choices
                        <select
                            style={{
                                fontSize: this.getAllStyle()["fontSize"],
                                padding: 0,
                                margin: 0,
                                border: "none",
                                outline: "none",
                                backgroundColor: "rgba(0,0,0,0)",
                                color: valueColor,
                                textIndent: 0,
                                WebkitAppearance: "none",
                                MozAppearance: "none",
                                appearance: "none",
                                cursor: accessRight === Channel_ACCESS_RIGHTS.READ_WRITE ? "default" : "not-allowed",
                            }}
                            disabled={accessRight === Channel_ACCESS_RIGHTS.READ_WRITE ? false : true}
                            onChange={(event) => {
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
                    )}
                </this._Cell>
                <this._Cell columnIndex={2}>
                    <ElementRectangleButton
                        defaultBackgroundColor={"rgba(0,0,0,0)"}
                        defaultTextColor={"rgba(0,0,0,0)"}
                        paddingLeft={3}
                        paddingRight={3}
                        paddingTop={1}
                        paddingBottom={1}
                        highlightBackgroundColor={ElementRectangleButtonDefaultBackgroundColor}
                        highlightTextColor={ElementRectangleButtonDefaultTextColor}
                        handleClick={(event) => {
                            const value = g_widgets1.getChannelValue(channelName);
                            navigator.clipboard.writeText(JSON.stringify(value, null, 4));
                        }}
                    >
                        Copy
                    </ElementRectangleButton>
                </this._Cell>
            </this._Line>
        );
    };

    _ElementValueInputForm = () => {

        const valueRaw = this.getChannelValueForMonitorWidget();

        const [value, setValue] = React.useState(`${valueRaw}`);
        const isFocused = React.useRef<boolean>(false);
        const keyRef = React.useRef<HTMLInputElement>(null);

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
            if (this._getChannelAccessRight() < 1.5) {
                return;
            }

            this.putChannelValue(this.getChannelNames()[0], value);
        };

        // press escape key to blur input box
        React.useEffect(() => {
            const blurOnEscapeKey = (event: KeyboardEvent) => {
                if (event.key === "Escape") {
                    keyRef.current?.blur();
                }
            };
            document.addEventListener("keydown", blurOnEscapeKey);
            return () => {
                document.removeEventListener("keydown", blurOnEscapeKey);
            };
        }, []);

        const accessRight = this._getChannelAccessRight();
        const cursor = accessRight === Channel_ACCESS_RIGHTS.READ_WRITE ? "text" : "not-allowed";
        const fontSize = this.getAllStyle()["fontSize"];
        const backgroundColor = this.getAllText()["highlightBackgroundColor"];

        return (
            <form
                onSubmit={handleSubmit}
                style={{
                    width: "100%",
                }}
            >
                <input
                    ref={keyRef}
                    style={{
                        outline: "none",
                        border: "none",
                        padding: 0,
                        margin: 0,
                        backgroundColor: "rgba(0,0,0,0)",
                        fontSize: fontSize,
                        width: "90%",
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        cursor: cursor,
                    }}
                    type="text"
                    name="value"
                    value={value}
                    readOnly={accessRight !== Channel_ACCESS_RIGHTS.READ_WRITE}
                    onFocus={(event) => {
                        isFocused.current = true;
                        keyRef.current?.select();
                        if (keyRef.current !== null) {
                            keyRef.current.style["backgroundColor"] = backgroundColor;
                        }
                    }}
                    onChange={(event) => {
                        event.preventDefault();
                        if (accessRight !== Channel_ACCESS_RIGHTS.READ_WRITE) {
                            return;
                        }
                        setValue(event.target.value);
                    }}
                    onBlur={(event) => {
                        isFocused.current = false;
                        setValue(`${this.getChannelValueForMonitorWidget()}`);
                        if (keyRef.current !== null) {
                            keyRef.current.style["backgroundColor"] = "rgba(0,0,0,0)";
                        }
                    }}
                />
            </form>
        );
    };

    // ---------------------------- helpers -------------------------

    /**
     * Generate an EPICS record database definition for the current channel
     * using live field values from the running IOC.
     *
     * The output is a multi-line string in `.db` format, e.g.
     * ```
     * record(ai, "CHANNEL:NAME") {
     *     field(DESC, "some description")    # default ""
     *     # field(SCAN, "Passive")
     * }
     * ```
     *
     * Fields whose value equals the default are commented out (full version)
     * or omitted entirely (short version). A comment is appended to each
     * non-default field showing its default value.
     *
     * Returns an error comment string if the channel has no record type.
     *
     * @param shortVersion - When `true`, only fields whose values differ from
     *   their defaults are included. When `false` (default), all fields are
     *   listed with unchanged ones commented out.
     * @returns The record definition string in EPICS `.db` format.
     */
    generateRecord = (shortVersion: boolean = false) => {
        const rtyp = this.getBasicInfoData()["Type"];
        if (rtyp === "" || (/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i).test(rtyp)) {
            const channelName = `${this.getChannelNamesLevel4()[0]}`;

            return (
                `# failed to generate record for ${channelName}. Reason: it does not have a record type.`
            );
        } else {
            const baseChannelName = this.getChannelNamesLevel4()[0];
            const result: string[] = [
                `# Generated by TDM Probe using live data at ${new Date(Date.now()).toLocaleString()}`,
                `# It includes ${shortVersion === true ? "changed" : "all"} fields of channel type "${rtyp}"`,
                `# The field line is ${shortVersion === true ? "not shown" : "commented"} if this field's value equals to its default`,
                `record(${rtyp}, "${baseChannelName}") {`];


            const dbdFiles = this.getDbdFiles();
            this.getFieldNames().map((fieldName: string, index: number) => {
                if (fieldName === "NAME") {
                    return;
                }

                const channelName = `${this.getChannelNamesLevel4()[0]}.${fieldName}`;
                const rtyp = this.getRtyp();
                const fieldDefaultValue = dbdFiles.getFieldDefaultValue(rtyp, fieldName);
                const value = g_widgets1.getChannelValue(channelName);
                if (value !== undefined) {

                    if (value === fieldDefaultValue) {
                        if (shortVersion === false) {
                            let line = `    # field(${fieldName}, "${value}")`;
                            result.push(line);
                        }

                    } else {
                        let line = `    field(${fieldName}, "${value}")`;
                        const numSpaces = Math.max(line.length, 40) - line.length + 1;
                        for (let ii = 0; ii < numSpaces; ii++) {
                            line = line + " ";
                        }
                        line = line + `# default ` + `"${fieldDefaultValue}"`

                        result.push(line);

                    }

                }
            })
            result.push("}");
            return result.join("\n");
        }
    }

    /**
     * Process channel names for the Probe widget.
     *
     * Extends the base class implementation by building the Level 5
     * channel name list (`_channelNamesLevel5`), which includes the base
     * channel name plus one entry per record field (e.g.
     * `"CHANNEL:NAME.DESC"`, `"CHANNEL:NAME.SCAN"`, …).
     *
     * Fields of type `DBF_NOACCESS` are skipped because attempting to
     * connect to them causes a Channel Access server error.
     *
     * @override
     */
    processChannelNames = (): void => {
        super.processChannelNames();

        const rtyp = this.getRtyp();
        if (rtyp === "") {
            return;
        }

        const dbdFiles = this.getDbdFiles();
        this.getChannelNamesLevel5().length = 0;
        const baseChannelName = this.getChannelNamesLevel4()[0];
        if (baseChannelName !== undefined) {
            this.getChannelNamesLevel5().push(baseChannelName);
            for (let fieldName of this.getFieldNames()) {
                // do not try to connect DBF_NOACCESS, it causes CA server error
                const fieldType = dbdFiles.getFieldType(rtyp, fieldName);
                if (fieldType === "DBF_NOACCESS" || fieldType === "") {
                    continue;
                }
                this.getChannelNamesLevel5().push(`${baseChannelName}.${fieldName}`);
            }
        }
    }

    /**
     * update the basic information
     */
    extractBasicInfo = (): void => {

        const channelNameLevel4 = this.getChannelNamesLevel4()[0];
        if (channelNameLevel4 === undefined) {
            return;
        }
        try {
            const tcaChannel = g_widgets1.getTcaChannel(channelNameLevel4);

            this.getBasicInfoData()["Value"] = `${tcaChannel.getValueForDisplay()}`;
            this.getBasicInfoData()["Value count"] = `${tcaChannel.getValueCount()}`;
            this.getBasicInfoData()["Severity"] = `${tcaChannel.getSeverityStr()}`;
            this.getBasicInfoData()["Alarm status"] = `${tcaChannel.getStatusStr()}`;
            this.getBasicInfoData()["Access right"] = `${tcaChannel.getAccessRightStr()}`;
            this.getBasicInfoData()["Unit"] = `${tcaChannel.getUnit()}`;
            this.getBasicInfoData()["DBR type"] = `${tcaChannel.getDbrType()}`;
            this.getBasicInfoData()["Precision"] = `${tcaChannel.getPrecision()}`;
            this.getBasicInfoData()["Alarm upper limit"] = `${tcaChannel.getUpperAlarmLimit()}`;
            this.getBasicInfoData()["Alarm lower limit"] = `${tcaChannel.getLowerAlarmLimit()}`;
            this.getBasicInfoData()["Display lower limit"] = `${tcaChannel.getLowerDisplayLimit()}`;
            this.getBasicInfoData()["Display upper limit"] = `${tcaChannel.getUpperDisplayLimit()}`;
            this.getBasicInfoData()["Display lower limit"] = `${tcaChannel.getLowerDisplayLimit()}`;
            this.getBasicInfoData()["Control upper limit"] = `${tcaChannel.getUpperWarningLimit()}`;
            this.getBasicInfoData()["Control lower limit"] = `${tcaChannel.getLowerWarningLimit()}`;
            this.getBasicInfoData()["Time"] = `${tcaChannel.getTimeStamp()}`;
            this.getBasicInfoData()["Server address"] = `${tcaChannel.getServerAddress()}`;
        } catch (e) {
            Log.error(e);
            return;
        }
    };

    /**
     * Handle the reply to the `"request-epics-dbd"` IPC message.
     *
     * Called once when the EPICS runtime becomes available. It initialises
     * the {@link DbdFiles} instance with the record-type and menu
     * definitions received from the main process, then kicks off a
     * {@link newProbe} call for the current channel (if any) when the
     * widget is in operating mode.
     *
     * In editing mode the DBD data is stored but no probe is started.
     *
     * @param result - The parsed DBD payload from the main process.
     * @param result.menus - Menu definitions keyed by menu name.
     * @param result.recordTypes - Record-type definitions keyed by record type name.
     */
    processDbd = (result: {
        menus: type_dbd_menus,
        recordTypes: type_dbd,
    }) => {
        this._dbdFiles = new DbdFiles(result["recordTypes"], result["menus"]);

        if (g_widgets1.isEditing()) {
            return;
        } else {
            const channelName = this.getChannelNames()[0];
            if (typeof channelName === "string" && channelName.trim() !== "") {
                this.newProbe(channelName);
            }
        }
    }

    /**
     * Start (or restart) a probe session for the given channel.
     *
     * This is the main entry point for inspecting a new PV. It tears down
     * any existing connections and sets up fresh ones for every field of
     * the target record. The steps are:
     *
     * 1. **Destroy** all existing {@link TcaChannel}s owned by this widget.
     * 2. **Clear** the cached basic-info data so stale values are not shown.
     * 3. **Update** the Level 0 channel name and run
     *    {@link processChannelNames} to derive higher-level names.
     * 4. **Fetch RTYP** — an asynchronous CA/PVA get that retrieves the
     *    record type (e.g. `"ai"`, `"bo"`). If the type cannot be
     *    determined the method returns early.
     * 5. **Re-process** channel names now that the record type (and
     *    therefore the field list) is known, populating the Level 5 names.
     * 6. **Connect** every field channel: create a {@link TcaChannel},
     *    fetch its metadata (or PVA type), perform an initial `get`, and
     *    start monitoring for updates.
     * 7. **Flush** the display so the UI re-renders with the new data.
     *
     * @param newChannelName - The PV / channel name to probe
     *   (e.g. `"LINAC:QUAD:BDES"`).
     */
    newProbe = async (newChannelName: string) => {
        // (1)
        g_widgets1.destroyAllTcaChannels();


        // (2)
        for (const key of Object.keys(this.getBasicInfoData())) {
            delete this.getBasicInfoData()[key];
        }

        // (3)
        this.getChannelNamesLevel0().length = 0;
        this.getChannelNamesLevel0()[0] = newChannelName;
        this.processChannelNames();

        // (4)
        const channelName = this.getChannelNames()[0];
        const rtyp = await this.fetchRTYP(channelName);
        this.getBasicInfoData()["Type"] = rtyp;
        if (rtyp === "undefined") {
            Log.error("Failed to create new probe: no RTYP value");
            return;
        }

        // (5)
        this.processChannelNames();

        // (6)
        const widgetKey = this.getWidgetKey();
        for (const channelNameLevel5 of this.getChannelNamesLevel5()) {
            const fieldTcaChannel = g_widgets1.createTcaChannel(channelNameLevel5, widgetKey);
            if (fieldTcaChannel === undefined) {
                continue;
            }
            if (fieldTcaChannel.getProtocol() === "pva") {
                fieldTcaChannel.fetchPvaType(widgetKey);
            } else {
                fieldTcaChannel.getMeta(widgetKey);
            }
            fieldTcaChannel.get(widgetKey, undefined, undefined, true);
            fieldTcaChannel.monitor();
        }

        // (7)
        g_widgets1.addToForceUpdateWidgets(widgetKey);
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");
        g_flushWidgets();

    };


    /**
     * Fetch the `RTYP` (record type) of a channel via Channel Access.
     *
     * Strips any field suffix from the channel name, appends `.RTYP`,
     * creates a temporary {@link TcaChannel}, and performs a synchronous
     * `get`. For example, given `"LINAC:QUAD:BDES.VAL"` it will query
     * `"LINAC:QUAD:BDES.RTYP"`.
     *
     * Also clears the cached {@link _basicInfoData} before the request so
     * that stale entries do not persist when switching channels.
     *
     * @param channelName - The fully-qualified channel name (may include a
     *   field suffix such as `.VAL`).
     * @returns The record type string (e.g. `"ai"`, `"bo"`), or
     *   `"undefined"` if the channel could not be reached or has no RTYP.
     */
    fetchRTYP = async (channelName: string): Promise<string> => {

        const rtypChannelName = channelName.split(".")[0] + ".RTYP";
        const tcaChannel = g_widgets1.createTcaChannel(rtypChannelName, this.getWidgetKey());
        if (tcaChannel === undefined) {
            Log.error("Failed to fetch RTYP for Probe");
            return "undefined";
        }
        const widgetKey = this.getWidgetKey();
        const rtypData = await tcaChannel.get(widgetKey, undefined, undefined, false);
        const rtyp = rtypData["value"];

        return `${rtyp}`;
    };

    // ------------------ getters -----------------------------


    getChannelNamesLevel5 = () => {
        return this._channelNamesLevel5;
    }

    getDbdFiles = () => {
        return this._dbdFiles;
    };

    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new ProbeSidebar(this);
        }
    }

    getBasicInfoData = () => {
        return this._basicInfoData;
    }

    getFieldNames = () => {
        const rtyp = this.getRtyp();
        if (typeof rtyp === "string") {
            const fieldNames = this.getDbdFiles().getFieldNames(rtyp);
            return fieldNames;
        } else {
            return [];
        }
    }

    getRtyp = () => {
        const rtyp = this.getBasicInfoData()["Type"];
        return rtyp;
    }

    // -------------------------- tdl -------------------------------

    static generateDefaultTdl = () => {

        const defaultTdl: type_Probe_tdl = structuredClone(defaultProbeTdl);

        defaultTdl["widgetKey"] = GlobalMethods.generateWidgetKey(defaultTdl["type"]);
        return defaultTdl;
    };

    generateDefaultTdl: () => type_Probe_tdl = Probe.generateDefaultTdl;

    // static method for generating TDL for utility window
    static generateWidgetTdl = (utilityOptions: Record<string, any>): type_Probe_tdl => {
        const result = this.generateDefaultTdl();
        result.channelNames = utilityOptions.channelNames as string[];
        return result;
    };

    // defined in super class
    getTdlCopy(newKey: boolean = true) {
        const result = super.getTdlCopy(newKey);
        return result;
    }

    // ------------------- jobs -------------------

    jobsAsEditingModeBegins(): void {
        super.jobsAsEditingModeBegins();
    }


    jobsAsOperatingModeBegins() {
        super.jobsAsEditingModeBegins();
        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
        const dbdAssigned = Object.keys(this.getDbdFiles().getRecordTypes()).length > 0;

        if (dbdAssigned) {
            if (this.getChannelNames().length > 0 && this.getChannelNames()[0].trim() !== "") {
                this.newProbe(this.getChannelNames()[0]);
            }
        } else {
            const ipcManager = displayWindowClient.getIpcManager();
            ipcManager.sendFromRendererProcess("request-epics-dbd", {
                displayWindowId: displayWindowClient.getWindowId(),
                widgetKey: this.getWidgetKey(),
            })
        }
    }
}
