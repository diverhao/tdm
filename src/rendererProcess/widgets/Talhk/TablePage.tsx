import * as React from "react";
import { ALARM_STATUS, MainPage, SEVERITES } from "./MainPage";
import { Table } from "./Table";
import { calcSeverityColor, convertEpochTimeToString, speakText } from "./GlobalMethod";
import { ElementRectangleButton } from "./RectangleButton";

enum type_sorting_item {
    "name",
    "description",
    "alarm_time",
    "severity",
    "alarm_status",
    "severity_when_alarmed",
    "alarm_status_when_alarmed",
}

enum type_sorting_direction {
    "ascending",
    "decending",
    "none"
}

export class TablePage {

    _forceUpdate: (input: any) => void = () => { };
    private _editing: boolean = false;
    private _mainPage: MainPage;

    expandingAll: boolean = true;
    // onlyShowAlarmingPvs: boolean = false;
    setEngineName = (name: string) => { };

    setHint: any = (hint: string) => { };
    // showOperations: boolean = true;
    forceUpdateElements: string[] = [];
    // showConfigMiniPage: boolean = false;

    selectedPathStr = "";
    mouseOnPathStr = "";
    unAcknowledgedPvs: string[] = [];
    acknowledgedPvs: string[] = [];

    sortingItem: type_sorting_item = type_sorting_item.name;
    sortingDirection: type_sorting_direction = type_sorting_direction.none;

    private _table: Table;

    _ElementTableLine: ({ children, additionalStyle, lineIndex, selectable }: any) => React.JSX.Element;
    _ElementTableCell: ({ children, columnIndex, additionalStyle }: any) => React.JSX.Element;
    _ElementTableHeaderResizer: ({ columnIndex }: any) => React.JSX.Element;
    _ElementOpenDisplaysRunCommands: ({ pathStr, show }: { pathStr: string, show: boolean }) => React.JSX.Element | null;
    _ElementModifyButton: (input: { imgSrc: string, handleClick: () => void, hint: string, setHint: (hint: string) => void }) => React.JSX.Element;

    constructor(mainPage: MainPage) {
        this._mainPage = mainPage;
        const baseFontSize = this._mainPage.baseFontSize;
        this._table = new Table([
            baseFontSize * 0.8 * "Action".length, // Action
            baseFontSize * 0.8 * 20, // pv name
            baseFontSize * 0.8 * 20, // description
            baseFontSize * 0.6 * "2025-04-25 20:26:24.123".length,
            baseFontSize * 0.8 * "PV Severity".length,
            baseFontSize * 0.8 * "PV Status".length,
            baseFontSize * 0.8 * "Severity when alarmed".length,
            baseFontSize * 0.8 * "Status when alarmed".length,
            baseFontSize * 0.8 * "Value when alarmed".length,
            baseFontSize * 0.8 * "Value now".length,
        ], this);
        this._ElementTableLine = this._table.getElementTableLine();
        this._ElementTableCell = this._table.getElementTableCell();
        this._ElementTableHeaderResizer = this._table.getElementTableHeaderResizer();
        this._ElementOpenDisplaysRunCommands = this._mainPage._ElementOpenDisplaysRunCommands;
        this._ElementModifyButton = this._mainPage._ElementModifyButton;
    }


    _Element = () => {
        const [, forceUpdate] = React.useState({});
        this._forceUpdate = forceUpdate;
        console.log("re-rendering Element")

        React.useEffect(() => {
            this.removeForceUpdateElement("/");
            this.expandingAll = false;
        })

        if (Object.keys(this.getMainPage().getData([])).length === 0) {
            return (
                <div>
                    Empty configuration.
                </div>
            )
        }

        return (
            <div style={{
                display: "inline-flex",
                flexDirection: "column",
                fontFamily: this.getMainPage().baseFontFamily,
                fontSize: this.getMainPage().baseFontSize,
                width: "100%",
                boxSizing: "border-box",
                padding: 20,
            }}>
                <div style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    paddingLeft: 20,
                }}>
                    <this._ElementEngineName></this._ElementEngineName>

                    {/* switch view -- Tree, Area, and Table */}
                    <this._ElementSwitchView></this._ElementSwitchView>

                </div>

                {/* header */}
                <this._ElementHeaders></this._ElementHeaders>

                {/* table for un-acknowledged PVs */}
                <this._ElementTableArea
                    pathStrs={this.unAcknowledgedPvs}
                    title={"Un-acknowledged PV"}
                >
                </this._ElementTableArea>

                {/* table for acknowledged PVs */}
                <this._ElementTableArea
                    pathStrs={this.acknowledgedPvs}
                    title={"Acknowledged PV"}
                >
                </this._ElementTableArea>

                {/* configuration page */}
                {this.getMainPage().getConfigPage().getElement()}

                {/* info page */}
                {(() => {
                    if (this.getMainPage().showInfoPage === true) {
                        const ElementInfoPage = this.getMainPage()._ElementInfoPage;
                        const data = this.getMainPage().infoPageData;
                        const type = data['type'];
                        const messages = data['messages'];
                        return <ElementInfoPage type={type} messages={messages} ></ElementInfoPage>
                    } else {
                        return null;
                    }
                })()}

            </div>
        )
    }

    _ElementTableArea = ({ title, pathStrs }: { title: string, pathStrs: string[] }) => {

        const [filterText, setFilterText] = React.useState("");

        const [, forceUpdate] = React.useState({});

        return (
            <div
                style={{
                    display: "inline-flex",
                    flexDirection: "column",
                    marginBottom: 20,
                    justifyContent: "center",
                    alignItems: "flex-start",
                }}
            >
                {/* un-acknowledged PVs table title */}
                <div
                    style={{
                        marginLeft: 20,
                        marginBottom: 15,
                        // fontSize: this.getMainPage().baseFontSize * 1.5,
                        fontSize: "1.8em",
                        display: "inline-flex",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: 'center',
                    }}
                >
                    {title}{Object.keys(pathStrs).length > 1 ? "s" : "    "}
                    &nbsp;
                    <div
                        style={{
                            border: "solid 1.5px rgba(0,0,0,1)",
                            borderRadius: 3,
                            padding: 2,
                            boxSizing: "border-box",
                            fontSize: this.getMainPage().baseFontSize * 1.5 - 6,
                            marginRight: 15,
                        }}
                    >
                        {Object.keys(pathStrs).length} PV{Object.keys(pathStrs).length > 1 ? "s" : "    "}
                    </div>

                    {/* filter -- description and pv name */}
                    <this._ElementTableFilter
                        filterText={filterText}
                        setFilterText={setFilterText}
                        forceUpdateTable={forceUpdate}
                    >
                    </this._ElementTableFilter>
                </div>

                {/* (un-)acknowledged PVs table */}
                <this._ElementPvsTable
                    pathStrs={pathStrs}
                    filterText={filterText}
                ></this._ElementPvsTable>
            </div>
        )
    }

    _ElementSwitchView = () => {
        return (
            <select
                value={"TablePage"}
                onChange={(event: any) => {
                    if (event.target.value === "TablePage") {
                        return;
                    } else {
                        this.getMainPage().switchView(event.target.value);
                    }
                }}
                style={{
                    fontSize: "2em",
                    outline: "none",
                    border: "none",
                    fontWeight: "bold",
                    fontFamily: this.getMainPage().baseFontFamily,
                }}
            >
                <option value="TreePage">Tree </option>
                <option value="TablePage">Table </option>
                <option value="AreaPage">Area </option>
            </select>
        )
    }
    getElement = () => {
        return (
            <this._Element></this._Element>
        )
    }

    _ElementTableFilter = ({ filterText, setFilterText, forceUpdateTable }:
        {
            filterText: string,
            setFilterText: React.Dispatch<React.SetStateAction<string>>,
            forceUpdateTable: React.Dispatch<React.SetStateAction<{}>>
        }) => {
        return (
            <form
                onSubmit={(event: any) => {
                    event.preventDefault();
                }}
                style={{
                    display: "inline-flex",
                    justifyContent: "flex-start",
                    alignItems: "center",
                }}
            >
                <input
                    value={filterText}
                    placeholder="Filter PV name, description, severity, or status."
                    onChange={(event: any) => {
                        event.preventDefault();
                        setFilterText(event.target.value);
                        forceUpdateTable({});
                    }}
                    style={{
                        outline: "none",
                        borderRadius: 0,
                        border: "solid 1px rgba(80,80,80,1)",
                        width: this.getMainPage().baseFontSize * 22,
                        fontFamily: this.getMainPage().baseFontFamily,
                        fontSize: this.getMainPage().baseFontSize,
                    }}
                >
                </input>
            </form>
        )
    }

    sortPvName = (pathStrs: string[]) => {
        if (this.sortingDirection === type_sorting_direction.ascending) {
            this.sortingDirection = type_sorting_direction.decending;
        } else {
            this.sortingDirection = type_sorting_direction.ascending;
        }
        pathStrs.sort((a: string, b: string) => {
            const nameA = JSON.parse(a)[JSON.parse(a).length - 1];
            const nameB = JSON.parse(b)[JSON.parse(b).length - 1];
            const strA = nameA;
            const strB = nameB;

            if (strA === strB) {
                return 0;
            }
            if (this.sortingDirection === type_sorting_direction.ascending) {
                if (strA > strB) {
                    return 1;
                }
                if (strA < strB) {
                    return -1;
                }
            } else {
                if (strA > strB) {
                    return -1;
                }
                if (strA < strB) {
                    return 1;
                }

            }
            return 0;
        })
    }

    sortDescription = (pathStrs: string[]) => {

        if (this.sortingDirection === type_sorting_direction.ascending) {
            this.sortingDirection = type_sorting_direction.decending;
        } else {
            this.sortingDirection = type_sorting_direction.ascending;
        }
        pathStrs.sort((a: string, b: string) => {

            const pathA = JSON.parse(a);
            const pathB = JSON.parse(b);
            const dataA = this.getMainPage().getData(pathA);
            const dataB = this.getMainPage().getData(pathB);
            const valueA = dataA["description"];
            const valueB = dataB["description"];

            if (valueA === valueB) {
                return 0;
            }
            if (this.sortingDirection === type_sorting_direction.ascending) {
                if (valueA > valueB) {
                    return 1;
                }
                if (valueA < valueB) {
                    return -1;
                }
            } else {
                if (valueA > valueB) {
                    return -1;
                }
                if (valueA < valueB) {
                    return 1;
                }

            }
            return 0;
        })
    }

    sortAlarmTime = (pathStrs: string[]) => {
        this.sortStatusProp(pathStrs, "time_when_alarmed");
    }

    sortSeverity = (pathStrs: string[]) => {
        this.sortStatusProp(pathStrs, "severity");
    }

    sortAlarmStatus = (pathStrs: string[]) => {
        this.sortStatusProp(pathStrs, "alarm_status");
    }

    sortSeverityWhenAlarmed = (pathStrs: string[]) => {
        this.sortStatusProp(pathStrs, "severity_when_alarmed");
    }

    sortAlarmStatusWhenAlarmed = (pathStrs: string[]) => {
        this.sortStatusProp(pathStrs, "alarm_status_when_alarmed");
    }

    sortStatusProp = (pathStrs: string[], propertyName: "description" | "time_when_alarmed" | "severity" | "severity_when_alarmed" | "alarm_status" | "alarm_status_when_alarmed" | "value") => {

        if (this.sortingDirection === type_sorting_direction.ascending) {
            this.sortingDirection = type_sorting_direction.decending;
        } else {
            this.sortingDirection = type_sorting_direction.ascending;
        }
        pathStrs.sort((a: string, b: string) => {

            const pathA = JSON.parse(a);
            const pathB = JSON.parse(b);
            const dataA = this.getMainPage().getData(pathA);
            const dataB = this.getMainPage().getData(pathB);
            const valueA = dataA["status"][propertyName]; // could be number or string
            const valueB = dataB["status"][propertyName];

            if (valueA === valueB) {
                return 0;
            }
            if (this.sortingDirection === type_sorting_direction.ascending) {
                if (valueA > valueB) {
                    return 1;
                }
                if (valueA < valueB) {
                    return -1;
                }
            } else {
                if (valueA > valueB) {
                    return -1;
                }
                if (valueA < valueB) {
                    return 1;
                }

            }
            return 0;
        })
    }



    _ElementPvsTable = ({ pathStrs, filterText }: { pathStrs: string[], filterText: string }) => {

        this.getTable().updateForceUpdateTableFunc(() => this._forceUpdate({}));

        return (
            <div
                style={{
                    paddingLeft: 20,
                    fontSize: this.getMainPage().baseFontSize,
                    fontFamily: this.getMainPage().baseFontFamily,
                    display: "inline-flex",
                    flexDirection: "column",
                }}
            >

                {/* header line */}
                <this._ElementTableLine
                    key={`header-line`}
                    lineIndex={-1}
                    selectable={true}
                    additionalStyle={{
                        fontWeight: "bolder",
                        height: this.getMainPage().baseFontSize * 3.5,
                        minHeight: this.getMainPage().baseFontSize * 3.5,
                        maxHeight: this.getMainPage().baseFontSize * 3.5,

                    }}
                >
                    <this._ElementTableCell
                        columnIndex={0}
                        additionalStyle={{ justifyContent: "space-between" }}
                    >
                        {"Action"}
                        <this._ElementTableHeaderResizer
                            columnIndex={0}
                        ></this._ElementTableHeaderResizer>
                    </this._ElementTableCell>

                    {/* pv name */}
                    <this._ElementTableCell
                        columnIndex={1}
                        additionalStyle={{ justifyContent: "space-between" }}
                    >
                        <div
                            style={{
                                display: "inline-flex",
                                flexDirection: "row",
                                justifyContent: "flex-start",
                                alignItems: "center",
                                cursor: "pointer"
                            }}
                            onClick={() => {
                                this.sortingItem = type_sorting_item.name;
                                this.sortPvName(pathStrs);
                                this._forceUpdate({});
                            }}
                        >
                            PV Name &nbsp;
                            <img
                                src={this.getMainPage().resourcePath + "arrowDown-thin.svg"}
                                style={{
                                    width: this.getMainPage().baseFontSize * 0.8,
                                    height: this.getMainPage().baseFontSize * 0.8,
                                    display: this.sortingItem === type_sorting_item.name && this.sortingDirection === type_sorting_direction.ascending ? "inline-flex" : "none",
                                }}
                            >
                            </img>
                            <img
                                src={this.getMainPage().resourcePath + "arrowUp-thin.svg"}
                                style={{
                                    width: this.getMainPage().baseFontSize * 0.8,
                                    height: this.getMainPage().baseFontSize * 0.8,
                                    display: this.sortingItem === type_sorting_item.name && this.sortingDirection === type_sorting_direction.decending ? "inline-flex" : "none",
                                }}
                            >
                            </img>
                        </div>

                        <this._ElementTableHeaderResizer
                            columnIndex={1}
                        ></this._ElementTableHeaderResizer>
                    </this._ElementTableCell>

                    {/* description */}
                    <this._ElementTableCell
                        columnIndex={2}
                        additionalStyle={{ justifyContent: "space-between" }}
                    >
                        <div
                            style={{
                                display: "inline-flex",
                                flexDirection: "row",
                                justifyContent: "flex-start",
                                alignItems: "center",
                                cursor: "pointer"
                            }}
                            onClick={() => {
                                this.sortingItem = type_sorting_item.description;
                                this.sortDescription(pathStrs);
                                this._forceUpdate({});
                            }}
                        >
                            Description &nbsp;
                            <img
                                src={this.getMainPage().resourcePath + "arrowDown-thin.svg"}
                                style={{
                                    width: this.getMainPage().baseFontSize * 0.8,
                                    height: this.getMainPage().baseFontSize * 0.8,
                                    display: this.sortingItem === type_sorting_item.description && this.sortingDirection === type_sorting_direction.ascending ? "inline-flex" : "none",
                                }}
                            >
                            </img>
                            <img
                                src={this.getMainPage().resourcePath + "arrowUp-thin.svg"}
                                style={{
                                    width: this.getMainPage().baseFontSize * 0.8,
                                    height: this.getMainPage().baseFontSize * 0.8,
                                    display: this.sortingItem === type_sorting_item.description && this.sortingDirection === type_sorting_direction.decending ? "inline-flex" : "none",
                                }}
                            >
                            </img>
                        </div>
                        <this._ElementTableHeaderResizer
                            columnIndex={2}
                        ></this._ElementTableHeaderResizer>
                    </this._ElementTableCell>

                    {/* alarm time */}
                    <this._ElementTableCell
                        columnIndex={3}
                        additionalStyle={{ justifyContent: "space-between" }}
                    >
                        <div
                            style={{
                                display: "inline-flex",
                                flexDirection: "row",
                                justifyContent: "flex-start",
                                alignItems: "center",
                                cursor: "pointer"
                            }}
                            onClick={() => {
                                this.sortingItem = type_sorting_item.alarm_time;
                                this.sortAlarmTime(pathStrs);
                                this._forceUpdate({});
                            }}
                        >

                            <div
                                style={{
                                    display: "inline-flex",
                                    flexDirection: "column",
                                }}
                            >
                                <div
                                    style={{
                                        marginBottom: 5,
                                    }}
                                >
                                    Time
                                </div>
                                <div>
                                    when alarmed
                                </div>
                            </div>

                            <img
                                src={this.getMainPage().resourcePath + "arrowDown-thin.svg"}
                                style={{
                                    width: this.getMainPage().baseFontSize * 0.8,
                                    height: this.getMainPage().baseFontSize * 0.8,
                                    display: this.sortingItem === type_sorting_item.alarm_time && this.sortingDirection === type_sorting_direction.ascending ? "inline-flex" : "none",
                                }}
                            >
                            </img>
                            <img
                                src={this.getMainPage().resourcePath + "arrowUp-thin.svg"}
                                style={{
                                    width: this.getMainPage().baseFontSize * 0.8,
                                    height: this.getMainPage().baseFontSize * 0.8,
                                    display: this.sortingItem === type_sorting_item.alarm_time && this.sortingDirection === type_sorting_direction.decending ? "inline-flex" : "none",
                                }}
                            >
                            </img>
                        </div>
                        <this._ElementTableHeaderResizer
                            columnIndex={3}
                        ></this._ElementTableHeaderResizer>
                    </this._ElementTableCell>

                    {/* severity */}
                    <this._ElementTableCell
                        columnIndex={4}
                        additionalStyle={{ justifyContent: "space-between" }}
                    >
                        <div
                            style={{
                                display: "inline-flex",
                                flexDirection: "row",
                                justifyContent: "flex-start",
                                alignItems: "center",
                                cursor: "pointer"
                            }}
                            onClick={() => {
                                this.sortingItem = type_sorting_item.severity;
                                this.sortSeverity(pathStrs);
                                this._forceUpdate({});
                            }}
                        >

                            <div
                                style={{
                                    display: "inline-flex",
                                    flexDirection: "column",
                                }}
                            >
                                <div
                                    style={{
                                        marginBottom: 5,
                                    }}
                                >
                                    PV Severity
                                </div>
                                <div>
                                    now
                                </div>
                            </div>

                            <img
                                src={this.getMainPage().resourcePath + "arrowDown-thin.svg"}
                                style={{
                                    width: this.getMainPage().baseFontSize * 0.8,
                                    height: this.getMainPage().baseFontSize * 0.8,
                                    display: this.sortingItem === type_sorting_item.severity && this.sortingDirection === type_sorting_direction.ascending ? "inline-flex" : "none",
                                }}
                            >
                            </img>
                            <img
                                src={this.getMainPage().resourcePath + "arrowUp-thin.svg"}
                                style={{
                                    width: this.getMainPage().baseFontSize * 0.8,
                                    height: this.getMainPage().baseFontSize * 0.8,
                                    display: this.sortingItem === type_sorting_item.severity && this.sortingDirection === type_sorting_direction.decending ? "inline-flex" : "none",
                                }}
                            >
                            </img>
                        </div>
                        <this._ElementTableHeaderResizer
                            columnIndex={4}
                        ></this._ElementTableHeaderResizer>
                    </this._ElementTableCell>

                    {/* status */}
                    <this._ElementTableCell
                        columnIndex={5}
                        additionalStyle={{ justifyContent: "space-between" }}
                    >
                        <div
                            style={{
                                display: "inline-flex",
                                flexDirection: "row",
                                justifyContent: "flex-start",
                                alignItems: "center",
                                cursor: "pointer"
                            }}
                            onClick={() => {
                                this.sortingItem = type_sorting_item.alarm_status;
                                this.sortAlarmStatus(pathStrs);
                                this._forceUpdate({});
                            }}
                        >

                            <div
                                style={{
                                    display: "inline-flex",
                                    flexDirection: "column",
                                }}
                            >
                                <div
                                    style={{
                                        marginBottom: 5,
                                    }}
                                >
                                    PV Status
                                </div>
                                <div>
                                    now
                                </div>
                            </div>

                            <img
                                src={this.getMainPage().resourcePath + "arrowDown-thin.svg"}
                                style={{
                                    width: this.getMainPage().baseFontSize * 0.8,
                                    height: this.getMainPage().baseFontSize * 0.8,
                                    display: this.sortingItem === type_sorting_item.alarm_status && this.sortingDirection === type_sorting_direction.ascending ? "inline-flex" : "none",
                                }}
                            >
                            </img>
                            <img
                                src={this.getMainPage().resourcePath + "arrowUp-thin.svg"}
                                style={{
                                    width: this.getMainPage().baseFontSize * 0.8,
                                    height: this.getMainPage().baseFontSize * 0.8,
                                    display: this.sortingItem === type_sorting_item.alarm_status && this.sortingDirection === type_sorting_direction.decending ? "inline-flex" : "none",
                                }}
                            >
                            </img>
                        </div>
                        <this._ElementTableHeaderResizer
                            columnIndex={5}
                        ></this._ElementTableHeaderResizer>
                    </this._ElementTableCell>

                    {/* severity when alarmed */}
                    <this._ElementTableCell
                        columnIndex={6}
                        additionalStyle={{ justifyContent: "space-between" }}
                    >
                        <div
                            style={{
                                display: "inline-flex",
                                flexDirection: "row",
                                justifyContent: "flex-start",
                                alignItems: "center",
                                cursor: "pointer"
                            }}
                            onClick={() => {
                                this.sortingItem = type_sorting_item.severity_when_alarmed;
                                this.sortSeverityWhenAlarmed(pathStrs);
                                this._forceUpdate({});
                            }}
                        >
                            <div
                                style={{
                                    display: "inline-flex",
                                    flexDirection: "column",
                                }}
                            >
                                <div
                                    style={{
                                        marginBottom: 5,
                                    }}
                                >
                                    PV Severity
                                </div>
                                <div>
                                    when alarmed &nbsp;
                                </div>

                            </div>

                            <img
                                src={this.getMainPage().resourcePath + "arrowDown-thin.svg"}
                                style={{
                                    width: this.getMainPage().baseFontSize * 0.8,
                                    height: this.getMainPage().baseFontSize * 0.8,
                                    display: this.sortingItem === type_sorting_item.severity_when_alarmed && this.sortingDirection === type_sorting_direction.ascending ? "inline-flex" : "none",
                                }}
                            >
                            </img>
                            <img
                                src={this.getMainPage().resourcePath + "arrowUp-thin.svg"}
                                style={{
                                    width: this.getMainPage().baseFontSize * 0.8,
                                    height: this.getMainPage().baseFontSize * 0.8,
                                    display: this.sortingItem === type_sorting_item.severity_when_alarmed && this.sortingDirection === type_sorting_direction.decending ? "inline-flex" : "none",
                                }}
                            >
                            </img>
                        </div>
                        <this._ElementTableHeaderResizer
                            columnIndex={6}
                        ></this._ElementTableHeaderResizer>
                    </this._ElementTableCell>

                    {/* alarm status when alarmed */}
                    <this._ElementTableCell
                        columnIndex={7}
                        additionalStyle={{ justifyContent: "space-between" }}
                    >
                        <div
                            style={{
                                display: "inline-flex",
                                flexDirection: "row",
                                justifyContent: "flex-start",
                                alignItems: "center",
                                cursor: "pointer"
                            }}
                            onClick={() => {
                                this.sortingItem = type_sorting_item.alarm_status_when_alarmed;
                                this.sortAlarmStatusWhenAlarmed(pathStrs);
                                this._forceUpdate({});
                            }}
                        >

                            <div
                                style={{
                                    display: "inline-flex",
                                    flexDirection: "column",
                                }}
                            >
                                <div
                                    style={{
                                        marginBottom: 5,
                                    }}
                                >
                                    PV Status
                                </div>
                                <div>
                                    when alarmed
                                </div>
                            </div>
                            <img
                                src={this.getMainPage().resourcePath + "arrowDown-thin.svg"}
                                style={{
                                    width: this.getMainPage().baseFontSize * 0.8,
                                    height: this.getMainPage().baseFontSize * 0.8,
                                    display: this.sortingItem === type_sorting_item.alarm_status_when_alarmed && this.sortingDirection === type_sorting_direction.ascending ? "inline-flex" : "none",
                                }}
                            >
                            </img>
                            <img
                                src={this.getMainPage().resourcePath + "arrowUp-thin.svg"}
                                style={{
                                    width: this.getMainPage().baseFontSize * 0.8,
                                    height: this.getMainPage().baseFontSize * 0.8,
                                    display: this.sortingItem === type_sorting_item.alarm_status_when_alarmed && this.sortingDirection === type_sorting_direction.decending ? "inline-flex" : "none",
                                }}
                            >
                            </img>
                        </div>
                        <this._ElementTableHeaderResizer
                            columnIndex={7}
                        ></this._ElementTableHeaderResizer>
                    </this._ElementTableCell>


                    {/* value when alarmed */}
                    <this._ElementTableCell
                        columnIndex={8}
                        additionalStyle={{ justifyContent: "space-between" }}
                    >

                        <div
                            style={{
                                display: "inline-flex",
                                flexDirection: "column",
                            }}
                        >
                            <div
                                style={{
                                    marginBottom: 5,
                                }}
                            >
                                PV Value
                            </div>
                            <div>
                                when alarmed
                            </div>
                        </div>
                        <this._ElementTableHeaderResizer
                            columnIndex={8}
                        ></this._ElementTableHeaderResizer>
                    </this._ElementTableCell>

                    {/* value */}
                    <this._ElementTableCell
                        columnIndex={9}
                        additionalStyle={{ justifyContent: "space-between" }}
                    >

                        <div
                            style={{
                                display: "inline-flex",
                                flexDirection: "column",
                            }}
                        >
                            <div
                                style={{
                                    marginBottom: 5,
                                }}
                            >
                                PV Value
                            </div>
                            <div>
                                now
                            </div>
                        </div>
                        <this._ElementTableHeaderResizer
                            columnIndex={9}
                        ></this._ElementTableHeaderResizer>
                    </this._ElementTableCell>


                </this._ElementTableLine>

                {/* each (un-)acknowledged pv */}
                {pathStrs.map((pathStr: string, index: number) => {
                    const path = JSON.parse(pathStr);
                    const pvName = path[path.length - 1] as string;
                    const pvData = this.getMainPage().getData(path);
                    const status = pvData["status"];
                    const description = pvData["description"] as string;
                    const severity = SEVERITES[status["severity"]];
                    const alarmStatus = ALARM_STATUS[status["alarm_status"]];
                    console.log("===============", pathStr, pvName, filterText.toLowerCase())
                    if (pvName.toLowerCase().includes(filterText.toLowerCase()) === false
                        && description.toLowerCase().includes(filterText.toLowerCase()) === false
                        && severity.toLowerCase().includes(filterText.toLowerCase()) === false
                        && alarmStatus.toLowerCase().includes(filterText.toLowerCase()) === false
                    ) {
                        return null;
                    }
                    console.log("ok")
                    return (
                        <this._ElementTableLine
                            key={pathStr + `-${index}` + `${description}` + `${status["value"]}`}
                            lineIndex={index}
                            selectable={true}
                        >
                            {/* actions */}
                            <this._ElementTableCell
                                columnIndex={0}
                            >
                                <this._ElementOpenDisplaysRunCommands
                                    pathStr={pathStr}
                                    show={true}
                                ></this._ElementOpenDisplaysRunCommands>

                                {this.getEditing() === true ?
                                    <this._ElementModifyButton
                                        imgSrc={this.getMainPage().resourcePath + "settings.svg"}
                                        handleClick={() => {
                                            this.getMainPage().getConfigPage().showingConfigPage = pathStr;
                                            this._forceUpdate({});
                                        }}
                                        hint={""}
                                        setHint={() => { }}
                                    >
                                    </this._ElementModifyButton>
                                    :
                                    null
                                }

                            </this._ElementTableCell>

                            {/* pv name */}
                            <this._ElementTableCell
                                columnIndex={1}
                            >
                                {pvName}
                            </this._ElementTableCell>

                            {/* description */}
                            <this._ElementTableCell
                                columnIndex={2}
                            >
                                {description}
                            </this._ElementTableCell>

                            {/* alarm time */}
                            <this._ElementTableCell
                                columnIndex={3}
                            >
                                {convertEpochTimeToString(status["time_when_alarmed"])}
                            </this._ElementTableCell>

                            {/* pv current severity */}
                            <this._ElementTableCell
                                columnIndex={4}
                                additionalStyle={{
                                    color: calcSeverityColor(status["severity"])
                                }}
                            >
                                {severity}
                            </this._ElementTableCell>

                            {/* pv current status */}
                            <this._ElementTableCell
                                columnIndex={5}
                            >
                                {alarmStatus}
                            </this._ElementTableCell>

                            {/* pv severity when alarm sounded */}
                            <this._ElementTableCell
                                columnIndex={6}
                                additionalStyle={{
                                    color: calcSeverityColor(status["severity_when_alarmed"])
                                }}
                            >
                                {SEVERITES[status["severity_when_alarmed"]]}
                            </this._ElementTableCell>

                            {/* pv status when alarm sounded */}
                            <this._ElementTableCell
                                columnIndex={7}
                            >
                                {ALARM_STATUS[status["alarm_status_when_alarmed"]]}
                            </this._ElementTableCell>

                            {/* pv value when alarm sounded */}
                            <this._ElementTableCell
                                columnIndex={8}
                            >
                                {status["value_when_alarmed"]}
                            </this._ElementTableCell>

                            {/* pv value now */}
                            <this._ElementTableCell
                                columnIndex={9}
                            >
                                {status["value"]}
                            </this._ElementTableCell>

                        </this._ElementTableLine>
                    )
                })}
            </div>
        )
    }

    _ElementHeaders = () => {
        return (
            <div
                style={{
                    display: "inline-flex",
                    flexDirection: "column",
                    marginLeft: 20,
                    marginBottom: 10,
                }}
            >
                {/* row 1 */}
                <div
                    style={{
                        display: "inline-flex",
                        flexDirection: "row",
                        justifyContent: "flex-start",
                        alignItems: 'center',
                        marginBottom: 15,
                    }}
                >


                    {/* show edit options */}
                    <form
                        onSubmit={(event: any) => {
                            event.preventDefault();
                        }}
                        style={{
                            display: "inline-flex",
                            flexDirection: "row",
                            justifyContent: "flex-start",
                            alignItems: 'center',
                            marginRight: 20,
                        }}
                    >
                        Show edit options:
                        <input
                            type={"checkbox"}
                            style={{
                                fontFamily: this.getMainPage().baseFontFamily,
                                width: this.getMainPage().baseFontSize,
                                height: this.getMainPage().baseFontSize,
                            }}
                            checked={this.getEditing()}
                            onChange={(event: any) => {
                                if (this.getEditing() === false) {
                                    this.setEditing(true);
                                    this.addToForceUpdateElement("/");
                                    this._forceUpdate({});

                                } else {
                                    this.setEditing(false);
                                    this.addToForceUpdateElement("/");
                                    this._forceUpdate({});
                                }
                            }}
                        >
                        </input>
                    </form>


                    {/* font size */}
                    <div style={{
                        display: "inline-flex",
                        flexDirection: "row",
                        justifyContent: "flex-start",
                        alignItems: 'center',
                        marginRight: 20,
                    }}>
                        Font size:&nbsp;
                        <select
                            onChange={(event: any) => {
                                this.getMainPage().baseFontSize = parseInt(event.target.value);
                                // setFontSize(this.getMainPage().baseFontSize);
                                this.getMainPage().getConfigPage().styleInputBox["fontSize"] = this.getMainPage().baseFontSize;
                                this.addToForceUpdateElement("/");
                                this._forceUpdate({});
                            }}
                            value={`${this.getMainPage().baseFontSize}`}
                            style={{
                                fontSize: this.getMainPage().baseFontSize,
                                outline: "none",
                                border: "1px solid rgba(0,0,0,1)",
                                borderRadius: 0,
                            }}
                        >
                            <option value="10">10</option>
                            <option value="12">12</option>
                            <option value="14">14</option>
                            <option value="18">18</option>
                            <option value="22">22</option>
                            <option value="26">26</option>
                            <option value="34">34</option>
                            <option value="44">44</option>
                        </select>
                    </div>


                    {/* Test speak text */}
                    <ElementRectangleButton
                        handleMouseDown={(event: any) => {
                            speakText("Alarm, this is a test.")
                        }}
                        marginRight={20}
                        fontSize={this.getMainPage().baseFontSize}
                        paddingTop={2}
                        paddingBottom={2}
                        paddingLeft={3}
                        paddingRight={3}
                        defaultTextColor={"rgba(0,0,0,1)"}
                        defaultBackgroundColor={"rgba(0,0,0,0)"}
                        highlightTextColor={"rgba(0,0,0,1)"}
                        highlightBackgroundColor={"rgba(200,200,200,1)"}
                        borderRadius={3}
                        additionalStyle={{
                            border: "solid 1px rgba(0,0,0,1)",
                        }}
                    >
                        Test talk
                    </ElementRectangleButton>

                    {/* hint */}
                    {/* <this._ElementHint></this._ElementHint> */}

                </div>
            </div>
        )
    }


    handleNewData = () => {
        this.unAcknowledgedPvs = this.obtainUnAcknowledgedPvs(JSON.stringify([]), this.getMainPage().getData([]));;
        this.acknowledgedPvs = this.obtainAcknowledgedPvs(JSON.stringify([]), this.getMainPage().getData([]));;
        this._forceUpdate({});
    }

    /**
     * PVs that are (1) in alarm state, and (2) not acknowledged
     */
    obtainUnAcknowledgedPvs = (pathStr: string, data: Record<string, any>) => {

        let result: string[] = [];
        for (const [fieldName, fieldValue] of Object.entries(data)) {
            // subsystems, the current level is system
            const subsystemsData = fieldValue["subsystems"];
            if (typeof subsystemsData === "object") {
                const subsystemsPathStr = JSON.stringify([...JSON.parse(pathStr), fieldName, "subsystems"]);
                const tmp = this.obtainUnAcknowledgedPvs(subsystemsPathStr, subsystemsData as Record<string, any>);
                result = [...result, ...tmp];
            }
            // pvs, the current level is system or subsystem
            const pvsData = fieldValue["pvs"];
            if (pvsData !== undefined && typeof pvsData === "object") {
                for (const [pvName, pvData] of Object.entries(pvsData)) {
                    console.log(pvName)
                    if (pvName !== "status" && typeof pvData === "object") {
                        const status = (pvData as any)["status"];

                        const severity = status["severity_when_alarmed"];
                        const acknowledged = status["acknowledged"];
                        if (typeof severity === "number" && typeof acknowledged === "boolean") {
                            if (severity > SEVERITES.NO_ALARM && acknowledged === false) {
                                const pvPathStr = JSON.stringify([...JSON.parse(pathStr), fieldName, "pvs", pvName]);
                                result.push(pvPathStr);
                            }
                        }

                    }
                }
            }
        }
        return result;
    }


    obtainAcknowledgedPvs = (pathStr: string, data: Record<string, any>) => {

        let result: string[] = [];
        for (const [fieldName, fieldValue] of Object.entries(data)) {
            // subsystems, the current level is system
            const subsystemsData = fieldValue["subsystems"];
            if (typeof subsystemsData === "object") {
                const subsystemsPathStr = JSON.stringify([...JSON.parse(pathStr), fieldName, "subsystems"]);
                const tmp = this.obtainAcknowledgedPvs(subsystemsPathStr, subsystemsData as Record<string, any>);
                result = [...result, ...tmp];
            }
            // pvs, the current level is system or subsystem
            const pvsData = fieldValue["pvs"];
            if (pvsData !== undefined && typeof pvsData === "object") {
                for (const [pvName, pvData] of Object.entries(pvsData)) {
                    console.log(pvName)
                    if (pvName !== "status" && typeof pvData === "object") {
                        const status = (pvData as any)["status"];

                        const severity = status["severity_when_alarmed"];
                        const acknowledged = status["acknowledged"];
                        if (typeof severity === "number" && typeof acknowledged === "boolean") {
                            if (severity > SEVERITES.NO_ALARM && acknowledged === true) {
                                const pvPathStr = JSON.stringify([...JSON.parse(pathStr), fieldName, "pvs", pvName]);
                                result.push(pvPathStr);
                            }
                        }

                    }
                }
            }
        }
        return result;
    }

    _ElementEngineName = () => {
        const [engineName, setEngineName] = React.useState("");
        this.setEngineName = setEngineName;

        React.useEffect(() => {
            this.getMainPage().requestEngineName();
        }, [])
        return (
            <h1>
                {engineName}
            </h1>
        )
    }

    updateChannelValues = (newChannelValues: Record<string, any>) => {
        for (const [pathStr, channelValue] of Object.entries(newChannelValues)) {
            const path = JSON.parse(pathStr);
            const data = this.getMainPage().getData(path);
            data["status"]["value"] = channelValue;
        }
        this._forceUpdate({});
    }

    getMainPage = () => {
        return this._mainPage;
    }

    addToForceUpdateElement = (pathStr: string) => {
        this.forceUpdateElements.push(pathStr);
    }

    clearForceUpdateElements = () => {
        this.forceUpdateElements.length = 0;
    }

    removeForceUpdateElement = (pathStr: string) => {
        // find the first one
        const index = this.forceUpdateElements.indexOf(pathStr);
        if (index >= 0) {
            this.forceUpdateElements.splice(index, 1);
        }
    }

    getTable = () => {
        return this._table;
    }

    getEditing = () => {
        return this._editing;
    }

    setEditing = (newEditing: boolean) => {
        this._editing = newEditing;
    }

}