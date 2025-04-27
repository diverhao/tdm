import { TextUpdate } from "../widgets/TextUpdate/TextUpdate";
import { Help } from "../widgets/Help/Help";
import { Terminal } from "../widgets/Terminal/Terminal";
import { ChannelGraph } from "../widgets/ChannelGraph/ChannelGraph";
import { Calculator } from "../widgets/Calculator/Calculator";
import { Canvas } from "../helperWidgets/Canvas/Canvas";
import { g_flushWidgets } from "../helperWidgets/Root/Root";
import { GroupSelection2 } from "../helperWidgets/GroupSelection/GroupSelection2";
import { MouseSelectionRegion } from "../helperWidgets/MouseSelectionRegion/MouseSelectionRegion";
import {
    Channel_DBR_TYPES,
    GlobalVariables,
    g_widgets1,
    Channel_ACCESS_RIGHTS,
    getMouseEventClientX,
    getMouseEventClientY,
    calcSidebarWidth,
    getWindowVerticalScrollBarWidth,
} from "./GlobalVariables";
import { type_dbrData } from "./GlobalVariables";
import { v4 as uuidv4 } from "uuid";
import { ReadWriteIos } from "../channel/ReadWriteIos";
import { ChannelSeverity, TcaChannel } from "../channel/TcaChannel";
import { Root } from "../helperWidgets/Root/Root";
import { insertToMap } from "./GlobalMethods";
import * as GlobalMethods from "../global/GlobalMethods";
import { Probe } from "../widgets/Probe/Probe";
import { DataViewer } from "../widgets/DataViewer/DataViewer";
import { Talhk } from "../widgets/Talhk/Talhk";
import { XYPlot } from "../widgets/XYPlot/XYPlot";
import { PvTable } from "../widgets/PvTable/PvTable";
import { TextEntry } from "../widgets/TextEntry/TextEntry";
import { ScaledSlider } from "../widgets/ScaledSlider/ScaledSlider";
import { Spinner } from "../widgets/Spinner/Spinner";
import { ThumbWheel } from "../widgets/ThumbWheel/ThumbWheel";
import { ChoiceButton } from "../widgets/ChoiceButton/ChoiceButton";
import { CheckBox } from "../widgets/CheckBox/CheckBox";
import { SlideButton } from "../widgets/SlideButton/SlideButton";
import { BooleanButton } from "../widgets/BooleanButton/BooleanButton";
import { RadioButton } from "../widgets/RadioButton/RadioButton";
import { ComboBox } from "../widgets/ComboBox/ComboBox";
import { BinaryImage } from "../widgets/BinaryImage/BinaryImage";
import { Table } from "../widgets/Table/Table";
import { Polyline } from "../widgets/Polyline/Polyline";
import { Arc } from "../widgets/Arc/Arc";
import { Rectangle } from "../widgets/Rectangle/Rectangle";
import { Media } from "../widgets/Media/Media";
import { Symbol } from "../widgets/Symbol/Symbol";
import { TextSymbol } from "../widgets/TextSymbol/TextSymbol";
import { LED } from "../widgets/LED/LED";
import { LEDMultiState } from "../widgets/LEDMultiState/LEDMultiState";
import { ByteMonitor } from "../widgets/ByteMonitor/ByteMonitor";
import { BaseWidget } from "../widgets/BaseWidget/BaseWidget";
import { ProfilesViewer } from "../widgets/ProfilesViewer/ProfilesViewer";
import { LogViewer } from "../widgets/LogViewer/LogViewer";
import { TdlViewer } from "../widgets/TdlViewer/TdlViewer";
import { TextEditor } from "../widgets/TextEditor/TextEditor";
import { CaSnooper } from "../widgets/CaSnooper/CaSnooper";
import { Casw } from "../widgets/Casw/Casw";
import { FileConverter } from "../widgets/FileConverter/FileConverter";
import { Meter } from "../widgets/Meter/Meter";
import { Tank } from "../widgets/Tank/Tank";
import { Thermometer } from "../widgets/Thermometer/Thermometer";
import { Label } from "../widgets/Label/Label";
import { EmbeddedDisplay } from "../widgets/EmbeddedDisplay/EmbeddedDisplay";
import { Group } from "../widgets/Group/Group";
import { PvMonitor } from "../widgets/PvMonitor/PvMonitor";
import { ActionButton } from "../widgets/ActionButton/ActionButton";
import { type_LocalChannel_data } from "../../mainProcess/channel/LocalChannelAgent";
import path, { dirname } from "path";
import { Log } from "../../mainProcess/log/Log";
import { SidebarWidgetsList } from "../helperWidgets/SidebarComponents/SidebarWidgetsList";

/**
 * Widget object types union: 3 special types + BaseWidget.
 * Regular widgets should extend from BaseWidget.
 */
export type type_widget = Canvas | MouseSelectionRegion | GroupSelection2 | BaseWidget;

/**
 * Widget type names union. Must be updated upon adding a new type.
 */
export type type_widgetType =
    | "Canvas"
    | "MouseSelectionRegion"
    | "GroupSelection2"
    | "DataViewer"
    | "Talhk"
    | "XYPlot"
    | "Probe"
    | "PvTable"
    | "TextEntry"
    | "ScaledSlider"
    | "Spinner"
    | "ThumbWheel"
    | "ChoiceButton"
    | "CheckBox"
    | "SlideButton"
    | "BooleanButton"
    | "RadioButton"
    | "ComboBox"
    | "BinaryImage"
    | "Table"
    | "TextUpdate"
    | "Help"
    | "Terminal"
    | "ChannelGraph"
    | "Calculator"
    | "ProfilesViewer"
    | "LogViewer"
    | "TdlViewer"
    | "TextEditor"
    | "CaSnooper"
    | "Casw"
    | "FileConverter"
    | "Polyline"
    | "Arc"
    | "Rectangle"
    | "Media"
    | "Symbol"
    | "TextSymbol"
    | "LED"
    | "LEDMultiState"
    | "ByteMonitor"
    | "Meter"
    | "Tank"
    | "Thermometer"
    | "Label"
    | "EmbeddedDisplay"
    | "Group"
    | "PvMonitor"
    | "ActionButton";

/**
 * Widget's z direction
 */
export type type_zDirection = "forward" | "backward" | "front" | "back";

export enum rendererWindowStatus {
    creatingWidget,
    selectingWidget,
    movingWidget,
    resizingWidget,
    editing,
    operating,
    resizingWidgetA,
    resizingWidgetB,
    resizingWidgetC,
    resizingWidgetD,
    resizingWidgetE,
    resizingWidgetF,
    resizingWidgetG,
    resizingWidgetH,
}

/**
 * Singleton class that represents all widgets <br>
 *
 */
export class Widgets {
    /**
     * A map that contains all widgets, including BaseWidget, Canvas, MouseSelectionRegion, and
     * GroupSelection2. Map key is the widget key, value is the widget object.
     * When the widget is selected, i.e. moved to the GroupSelection2, the value becomes `null`.
     * @type {map<string, type_widget>}
     */
    _widgets: Map<string, type_widget | undefined> = new Map();

    private _rendererWindowStatus: rendererWindowStatus;

    /**
     * Contains the widgets that should use the memoed React element when the
     * &lt;Root /&gt; element is re-rendered upon g_flushWidgets() is invoked.
     * It is emptied after g_flushWidgets().
     */
    private _forceUpdateWidgets: Set<string> = new Set();

    // private readonly _windowId;

    _root: Root;

    // ipcRenderer: any;

    private _tcaChannels: Record<string, TcaChannel> = {};

    private _sidebarWidgetKey: string = "Canvas";
    _readWriteIos: ReadWriteIos = ReadWriteIos.getInstance();

    // [left, top]
    // for pasting widgets
    _contextMenuCursorPosition: [number, number] = [0, 0];

    private _channelNamePeekDivId: string = "";
    _status: "expanded" | "collapsed" = "collapsed";
    _sidebarWidgetsList: SidebarWidgetsList;


    constructor(
        tdl: Record<string, any>,
        // initialMode: rendererWindowStatus.editing | rendererWindowStatus.operating,
        // externalMacros: [string, string][],
        // externalReplaceMacros: boolean,
        root: Root
    ) {
        /**
         * Unique ID for this display window. Cannot be changed.
         * @type {string}
         */
        // this._windowId = windowId;

        /**
         * Represent the root React element of this display window. All widgets are this element's children.
         * Its children elements are mapped from Widgets._widgets.
         * @type {Object<Root>}
         */
        this._root = root;

        /**
         * Renderer window status, enum
         * @type {enum}
         */
        this._rendererWindowStatus = root.getInitialMode();

        /**
         * The communication tool between the renderer process and the main process.
         * It is ipcRenderer when we use Electron.js; it is WebSocket send() when we use WebSocket.
         * @type {any}
         */
        // this.ipcRenderer = root.ipcRenderer;

        // Sometimes the Canvas may not in the tdl file
        let widgetTdl = tdl["Canvas"];
        if (widgetTdl === undefined) {
            widgetTdl = this.initWidgetTdl("Canvas");
        }

        // Canvas holds the macros
        Log.debug("Start to create widget objects");

        // create other widgets
        for (let widgetKey in tdl) {
            const widgetTdl = tdl[widgetKey];
            this.createWidget(widgetTdl, false);
        }
        // create last widget GroupSelection2, it is always at last
        this.createWidget(this.initWidgetTdl("GroupSelection2"), true);
        Log.debug("Finished creating all widget objects");

        this._sidebarWidgetsList = new SidebarWidgetsList();
    }

    // -------------------- display window status ----------------------

    /**
     * Getter for _rendererWindowStatus
     */
    getRendererWindowStatus = (): rendererWindowStatus => {
        return this._rendererWindowStatus;
    };

    getRendererWindowStatusStr = (): string => {
        return rendererWindowStatus[this._rendererWindowStatus] as string;
    };

    /**
     * Setter for _rendererWindowStatus
     */
    setRendererWindowStatus = (status: rendererWindowStatus): void => {
        this._rendererWindowStatus = status;
    };

    /**
     * If the display window is being edited
     */
    isEditing = (): boolean => {
        return this._rendererWindowStatus !== rendererWindowStatus.operating;
    };

    // --------------------- create/remove/get widget(s) --------------------

    /**
     * Create default JSON object for a widget
     * @param {type_widgetType} widgetType
     * @param {number} x widget coordinate x, default 0
     * @param {number} y widget coordinate y, default 0
     * @param {number} width widget width, default 0
     * @param {number} height widget height, default 0
     * @returns {Record<string, any>} the JSON object of the widget
     * @throws {Error<string>} when there is no such a widget type name
     * @todo Return a more precise type
     */
    initWidgetTdl = (widgetType: type_widgetType, x: number = 0, y: number = 0, width: number = 0, height: number = 0): Record<string, any> => {
        let tdl: Record<string, any> = {};
        switch (widgetType) {
            case "MouseSelectionRegion":
                tdl = MouseSelectionRegion.generateDefaultTdl();
                tdl.style.left = x;
                tdl.style.top = y;
                break;
            case "TextUpdate":
                tdl = TextUpdate.generateDefaultTdl("TextUpdate");
                tdl.style.left = x;
                tdl.style.top = y;
                tdl.style.width = width;
                tdl.style.height = height;
                break;
            case "Help":
                tdl = Help.generateDefaultTdl("Help");
                tdl.style.left = x;
                tdl.style.top = y;
                tdl.style.width = width;
                tdl.style.height = height;
                break;
            case "Terminal":
                tdl = Terminal.generateDefaultTdl("Terminal");
                tdl.style.left = x;
                tdl.style.top = y;
                tdl.style.width = width;
                tdl.style.height = height;
                break;
            case "Calculator":
                tdl = Calculator.generateDefaultTdl("Calculator");
                tdl.style.left = x;
                tdl.style.top = y;
                tdl.style.width = width;
                tdl.style.height = height;
                break;
            case "TextEntry":
                tdl = TextEntry.generateDefaultTdl("TextEntry");
                tdl.style.left = x;
                tdl.style.top = y;
                tdl.style.width = width;
                tdl.style.height = height;
                break;
            case "ScaledSlider":
                tdl = ScaledSlider.generateDefaultTdl("ScaledSlider");
                tdl.style.left = x;
                tdl.style.top = y;
                tdl.style.width = width;
                tdl.style.height = height;
                break;
            case "Spinner":
                tdl = Spinner.generateDefaultTdl("Spinner");
                tdl.style.left = x;
                tdl.style.top = y;
                tdl.style.width = width;
                tdl.style.height = height;
                break;
            case "ThumbWheel":
                tdl = ThumbWheel.generateDefaultTdl("ThumbWheel");
                tdl.style.left = x;
                tdl.style.top = y;
                tdl.style.width = width;
                tdl.style.height = height;
                break;
            case "ChoiceButton":
                tdl = ChoiceButton.generateDefaultTdl("ChoiceButton");
                tdl.style.left = x;
                tdl.style.top = y;
                tdl.style.width = width;
                tdl.style.height = height;
                break;
            case "CheckBox":
                tdl = CheckBox.generateDefaultTdl("CheckBox");
                tdl.style.left = x;
                tdl.style.top = y;
                tdl.style.width = width;
                tdl.style.height = height;
                break;
            case "SlideButton":
                tdl = SlideButton.generateDefaultTdl("SlideButton");
                tdl.style.left = x;
                tdl.style.top = y;
                tdl.style.width = width;
                tdl.style.height = height;
                break;
            case "BooleanButton":
                tdl = BooleanButton.generateDefaultTdl("BooleanButton");
                tdl.style.left = x;
                tdl.style.top = y;
                tdl.style.width = width;
                tdl.style.height = height;
                break;
            case "RadioButton":
                tdl = RadioButton.generateDefaultTdl("RadioButton");
                tdl.style.left = x;
                tdl.style.top = y;
                tdl.style.width = width;
                tdl.style.height = height;
                break;
            case "ComboBox":
                tdl = ComboBox.generateDefaultTdl("ComboBox");
                tdl.style.left = x;
                tdl.style.top = y;
                tdl.style.width = width;
                tdl.style.height = height;
                break;
            case "BinaryImage":
                tdl = BinaryImage.generateDefaultTdl("BinaryImage");
                tdl.style.left = x;
                tdl.style.top = y;
                tdl.style.width = width;
                tdl.style.height = height;
                break;
            case "Table":
                tdl = Table.generateDefaultTdl("Table");
                tdl.style.left = x;
                tdl.style.top = y;
                tdl.style.width = width;
                tdl.style.height = height;
                break;
            case "Polyline":
                tdl = Polyline.generateDefaultTdl("Polyline");
                tdl.style.left = x;
                tdl.style.top = y;
                tdl.style.width = width;
                tdl.style.height = height;
                break;
            case "Arc":
                tdl = Arc.generateDefaultTdl("Arc");
                tdl.style.left = x;
                tdl.style.top = y;
                tdl.style.width = width;
                tdl.style.height = height;
                break;
            case "Rectangle":
                tdl = Rectangle.generateDefaultTdl("Rectangle");
                tdl.style.left = x;
                tdl.style.top = y;
                tdl.style.width = width;
                tdl.style.height = height;
                break;
            case "Media":
                tdl = Media.generateDefaultTdl("Media");
                tdl.style.left = x;
                tdl.style.top = y;
                tdl.style.width = width;
                tdl.style.height = height;
                break;
            case "Symbol":
                tdl = Symbol.generateDefaultTdl("Symbol");
                tdl.style.left = x;
                tdl.style.top = y;
                tdl.style.width = width;
                tdl.style.height = height;
                break;
            case "TextSymbol":
                tdl = TextSymbol.generateDefaultTdl("TextSymbol");
                tdl.style.left = x;
                tdl.style.top = y;
                tdl.style.width = width;
                tdl.style.height = height;
                break;
            case "LED":
                tdl = LED.generateDefaultTdl("LED");
                tdl.style.left = x;
                tdl.style.top = y;
                tdl.style.width = width;
                tdl.style.height = height;
                break;
            case "LEDMultiState":
                tdl = LEDMultiState.generateDefaultTdl("LEDMultiState");
                tdl.style.left = x;
                tdl.style.top = y;
                tdl.style.width = width;
                tdl.style.height = height;
                break;
            case "ByteMonitor":
                tdl = ByteMonitor.generateDefaultTdl("ByteMonitor");
                tdl.style.left = x;
                tdl.style.top = y;
                tdl.style.width = width;
                tdl.style.height = height;
                break;
            case "Meter":
                tdl = Meter.generateDefaultTdl("Meter");
                tdl.style.left = x;
                tdl.style.top = y;
                tdl.style.width = width;
                tdl.style.height = height;
                break;
            case "Tank":
                tdl = Tank.generateDefaultTdl("Tank");
                tdl.style.left = x;
                tdl.style.top = y;
                tdl.style.width = width;
                tdl.style.height = height;
                break;
            case "PvMonitor":
                tdl = PvMonitor.generateDefaultTdl("PvMonitor");
                tdl.style.left = x;
                tdl.style.top = y;
                tdl.style.width = width;
                tdl.style.height = height;
                break;
            case "Thermometer":
                tdl = Thermometer.generateDefaultTdl("Thermometer");
                tdl.style.left = x;
                tdl.style.top = y;
                tdl.style.width = width;
                tdl.style.height = height;
                break;
            case "Label":
                tdl = Label.generateDefaultTdl("Label");
                tdl.style.left = x;
                tdl.style.top = y;
                tdl.style.width = width;
                tdl.style.height = height;
                break;
            case "EmbeddedDisplay":
                tdl = EmbeddedDisplay.generateDefaultTdl("EmbeddedDisplay");
                tdl.style.left = x;
                tdl.style.top = y;
                tdl.style.width = width;
                tdl.style.height = height;
                break;
            case "Group":
                tdl = Group.generateDefaultTdl("Group");
                tdl.style.left = x;
                tdl.style.top = y;
                tdl.style.width = width;
                tdl.style.height = height;
                break;
            case "ActionButton":
                tdl = ActionButton.generateDefaultTdl("ActionButton");
                tdl.style.left = x;
                tdl.style.top = y;
                tdl.style.width = width;
                tdl.style.height = height;
                break;
            case "Probe":
                tdl = Probe.generateDefaultTdl("Probe");
                tdl.style.left = x;
                tdl.style.top = y;
                tdl.style.width = width;
                tdl.style.height = height;
                break;
            case "DataViewer":
                tdl = DataViewer.generateDefaultTdl("DataViewer");
                tdl.style.left = x;
                tdl.style.top = y;
                tdl.style.width = width;
                tdl.style.height = height;
                break;
            case "XYPlot":
                tdl = XYPlot.generateDefaultTdl("XYPlot");
                tdl.style.left = x;
                tdl.style.top = y;
                tdl.style.width = width;
                tdl.style.height = height;
                break;
            case "ChannelGraph":
                tdl = ChannelGraph.generateDefaultTdl("ChannelGraph");
                tdl.style.left = x;
                tdl.style.top = y;
                tdl.style.width = width;
                tdl.style.height = height;
                break;
            case "PvTable":
                tdl = PvTable.generateDefaultTdl("PvTable");
                tdl.style.left = x;
                tdl.style.top = y;
                tdl.style.width = width;
                tdl.style.height = height;
                break;
            case "Canvas":
                tdl = Canvas.generateDefaultTdl();
                break;
            case "GroupSelection2":
                tdl = GroupSelection2.generateDefaultTdl();
                break;
            default:
                const errorMsg = `Wrong widget type: ${widgetType} in Widgets.initWidgetTdl()`;
                throw new Error(errorMsg);
        }
        return tdl;
    };

    /**
     * Create a widget object from JSON object.
     * @param {Record<string, any>} widgetTdlRaw The JSON object.
     * @param {boolean} doFlush If we want to flush the newly created widget.
     * @returns {type_widget} Object for the widget, e.g. TextUpdate, Canvas
     * @throws {Error<string>} when there is no matched widget type from the JSON object.
     * @todo check input JSON object
     */
    createWidget = (widgetTdlRaw: Record<string, any>, doFlush: boolean): type_widget => {
        // make a copy, do not use original
        const widgetTdl = JSON.parse(JSON.stringify(widgetTdlRaw));
        const widgetKey: string = widgetTdl.widgetKey;
        const widgetType: string = widgetTdl.type;
        let widget: any = null;
        switch (widgetType) {
            case "TextUpdate": {
                widget = new TextUpdate(widgetTdl);
                break;
            }
            case "Help": {
                widget = new Help(widgetTdl);
                break;
            }
            case "Terminal": {
                widget = new Terminal(widgetTdl);
                break;
            }
            case "Calculator": {
                widget = new Calculator(widgetTdl);
                break;
            }
            case "TextEntry": {
                widget = new TextEntry(widgetTdl);
                break;
            }
            case "ScaledSlider": {
                widget = new ScaledSlider(widgetTdl);
                break;
            }
            case "Spinner": {
                widget = new Spinner(widgetTdl);
                break;
            }
            case "ThumbWheel": {
                widget = new ThumbWheel(widgetTdl);
                break;
            }
            case "ChoiceButton": {
                widget = new ChoiceButton(widgetTdl);
                break;
            }
            case "CheckBox": {
                widget = new CheckBox(widgetTdl);
                break;
            }
            case "SlideButton": {
                widget = new SlideButton(widgetTdl);
                break;
            }
            case "BooleanButton": {
                widget = new BooleanButton(widgetTdl);
                break;
            }
            case "RadioButton": {
                widget = new RadioButton(widgetTdl);
                break;
            }
            case "ComboBox": {
                widget = new ComboBox(widgetTdl);
                break;
            }
            case "BinaryImage": {
                widget = new BinaryImage(widgetTdl);
                break;
            }
            case "Table": {
                widget = new Table(widgetTdl);
                break;
            }
            case "Polyline": {
                widget = new Polyline(widgetTdl);
                break;
            }
            case "Arc": {
                widget = new Arc(widgetTdl);
                break;
            }
            case "Rectangle": {
                widget = new Rectangle(widgetTdl);
                break;
            }
            case "Media": {
                widget = new Media(widgetTdl);
                break;
            }
            case "LED": {
                widget = new LED(widgetTdl);
                break;
            }
            case "LEDMultiState": {
                widget = new LEDMultiState(widgetTdl);
                break;
            }
            case "ByteMonitor": {
                widget = new ByteMonitor(widgetTdl);
                break;
            }
            case "Meter": {
                widget = new Meter(widgetTdl);
                break;
            }
            case "Tank": {
                widget = new Tank(widgetTdl);
                break;
            }
            case "PvMonitor": {
                widget = new PvMonitor(widgetTdl);
                break;
            }
            case "Thermometer": {
                widget = new Thermometer(widgetTdl);
                break;
            }
            case "Label": {
                widget = new Label(widgetTdl);
                break;
            }
            case "EmbeddedDisplay": {
                widget = new EmbeddedDisplay(widgetTdl);
                break;
            }
            case "Group": {
                widget = new Group(widgetTdl);
                break;
            }
            case "ActionButton": {
                widget = new ActionButton(widgetTdl);
                break;
            }
            case "Symbol": {
                widget = new Symbol(widgetTdl);
                break;
            }
            case "TextSymbol": {
                widget = new TextSymbol(widgetTdl);
                break;
            }
            case "Canvas": {
                widget = new Canvas(widgetTdl);
                break;
            }
            case "MouseSelectionRegion": {
                widget = new MouseSelectionRegion(widgetTdl);
                break;
            }
            case "GroupSelection2": {
                widget = new GroupSelection2(widgetTdl);
                break;
            }
            case "Probe": {
                widget = new Probe(widgetTdl);
                break;
            }
            case "DataViewer": {
                widget = new DataViewer(widgetTdl);
                break;
            }
            case "Talhk": {
                widget = new Talhk(widgetTdl);
                break;
            }
            case "XYPlot": {
                widget = new XYPlot(widgetTdl);
                break;
            }
            case "ChannelGraph": {
                widget = new ChannelGraph(widgetTdl);
                break;
            }
            case "PvTable": {
                widget = new PvTable(widgetTdl);
                break;
            }
            case "ProfilesViewer": {
                widget = new ProfilesViewer(widgetTdl);
                break;
            }
            case "LogViewer": {
                widget = new LogViewer(widgetTdl);
                break;
            }
            case "TdlViewer": {
                widget = new TdlViewer(widgetTdl);
                break;
            }
            case "TextEditor": {
                widget = new TextEditor(widgetTdl);
                break;
            }
            case "CaSnooper": {
                widget = new CaSnooper(widgetTdl);
                break;
            }
            case "Casw": {
                widget = new Casw(widgetTdl);
                break;
            }
            case "FileConverter": {
                widget = new FileConverter(widgetTdl);
                break;
            }
            default: {
                const errorMsg = `Wrong widget type: ${widgetType} in Widgets.createWidget()`;
                throw new Error(errorMsg);
            }
        }
        // these are speical widgets
        if (
            (this.hasWidget("Canvas") && widgetKey === "Canvas") ||
            (this.hasWidget("MouseSelectionRegion") && widgetKey === "MouseSelectionRegion") ||
            (this.hasWidget("GroupSelection2") && widgetKey === "GroupSelection2")
        ) {
            // do not re-create these speical widgets
        } else {
            if (this.hasWidget("GroupSelection2")) {
                // add new widget after the display window is initialized
                insertToMap(this._widgets, this._widgets.size - 1, widgetKey, widget);
            } else {
                // display window is initializing
                this._widgets.set(widgetKey, widget);
            }
        }

        this.addToForceUpdateWidgets(widgetKey);
        if (doFlush) {
            if (g_flushWidgets !== undefined) {
                g_flushWidgets();
            }
        }

        return widget;
    };

    /**
     * Remove a widget from this display window via the widget key. If the widget key does not match
     * any widget key in the display window, do nothing <br>
     * (1) deselect all widgets, so that this widget is migrated from GroupSelection2 to g_widgets <br>
     * (2) let this widget to be flushed <br>
     * (3) delete the entry in this._widgets <br>
     * (4) delete the entry in GroupSelection2, the widget might in there too <br>
     * (5) update sidebar <br>
     * @param {string} widgetKey The widgetKey that will be removed
     * @param {boolean} deselectAllWidgets If we want to deselect all widgets during this process. Set to false when we remove MouseSelectionRegion
     * @param {boolean} doFlush If we want to flush the widgets
     * @returns {void}
     */
    removeWidget = (widgetKey: string, deselectAllWidgets: boolean, doFlush: boolean): void => {
        if (!this.hasWidget(widgetKey)) {
            return;
        }

        // (0) special case: embedded display widget
        if (widgetKey.includes("Group_")) {
            try {
                const widget = this.getWidget2(widgetKey);
                if (widget instanceof Group) {
                    widget.removeGroupMembers();
                }
            } catch (e) {
                Log.error(e);
            }
        }

        // (0.5) remove all intervals and timeouts


        // (1)
        if (deselectAllWidgets) {
            this.deselectAllWidgets(false);
        }
        // (2)
        this.addToForceUpdateWidgets(widgetKey);
        // (3)
        this._widgets.delete(widgetKey);
        // (4)
        const group: GroupSelection2 = this.getGroupSelection2();
        group.getWidgets().delete(widgetKey);
        // (5)
        g_widgets1.updateSidebar(doFlush);
    };

    /**
     * Remove widget MouseSelectionRegion, flush widgets
     */
    removeMouseSelectionRegion = () => {
        this.removeWidget("MouseSelectionRegion", false, true);
    };

    /**
     * Remove all widgets, including Canvas, GroupSelection2 and MouseSelectionRegion. Basically empty the Widget._widgets map. Used when we load/reload the tdl file. <br>
     * (1) deselect all widgets, and flush <br>
     * (2) add everyone, including Canvas, GroupSelection2, and others, to forceUpdateWidgets() <br>
     * (3) clear this._widgets <br>
     * (4) flush <br>
     */
    removeAllWidgetsHard = (doFlush: boolean) => {
        // (1)
        this.deselectAllWidgets(true);
        // (2)
        const widgetKeys = this.getWidgets().keys();
        for (let widgetKey of widgetKeys) {
            // do not add
            // this.addToForceUpdateWidgets(widgetKey);
        }
        // (3)
        this.getWidgets().clear();
        // (4)
        if (doFlush) {
            g_flushWidgets();
        }
    };

    /**
     * If there is such a widget
     * @param {string} widgetKey
     * @returns {boolean}
     */
    hasWidget = (widgetKey: string): boolean => {
        if ([...this.getWidgets().keys()].includes(widgetKey)) {
            return true;
        }
        return false;
    };

    getGroupSelection2 = (): GroupSelection2 => {
        if (this._widgets.get("GroupSelection2") === undefined) {
            // it always exists
            throw new Error("GroupSelection2 does not exist.");
        }
        return this._widgets.get("GroupSelection2") as any as GroupSelection2;
    };

    /**
     * Get Widgets._widgets <br>
     * Note: the entry's value is null if this widget is selected (moved to GroupSelection2)
     */
    getWidgets = (): Map<string, type_widget | undefined> => {
        return this._widgets;
    };

    /**
     * Get the widget object via its widgetKey, no matter if the widget is selected or not. <br>
     * @param {string} widgetKey the widget key
     * @returns {type_widget} the widget object, e.g.
     * @throws {Error} when there is no such a widget
     */
    getWidget2 = (widgetKey: string): type_widget => {
        let widget = this._widgets.get(widgetKey);
        if (widget !== undefined) {
            return widget;
        } else {
            const group = this.getGroupSelection2();
            widget = group.getWidget(widgetKey);
            if (widget !== undefined) {
                return widget;
            } else {
                const errMsg = `Cannot find widget ${widgetKey}`;
                throw new Error(errMsg);
            }
        }
    };

    /**
     * Get Widgets._widgets <br>
     * Note: the entry value might be null when the widget is selected, i.e. in GroupSelection2
     */
    getWidget = (widgetKey: string): type_widget | undefined => {
        return this._widgets.get(widgetKey);
    };

    /**
     * Get all widget objects
     * @returns {Map<string, type_widget>} a map, key: string = widget key, value: type_widget = widget object
     */
    getWidgets2 = (): Map<string, type_widget> => {
        const result = new Map<string, type_widget>();
        for (let widgetKey of this._widgets.keys()) {
            const widget = this.getWidget2(widgetKey);
            if (widget !== undefined) {
                result.set(widgetKey, widget);
            }
        }
        return result;
    };

    // ----------------------- move widgets in x/y direction --------------------------

    moveWidgetsInXY = (widgetKeys: string[], dx: number, dy: number, doFlush: boolean) => {
        for (let widgetKey of widgetKeys) {
            const widget = this.getWidget2(widgetKey);
            if (widget === undefined || !(widget instanceof BaseWidget)) {
                continue;
            } else {
                widget.move(dx, dy, false);
            }
        }
        this.addToForceUpdateWidgets("GroupSelection2");
        this.updateSidebar(doFlush);
    };

    // ----------------------- move widgets in z direction ----------------------------

    /**
     * Move multiple widgets in Z direction, keep their relative Z positions
     * @param {string[]} widgetKeys
     * @param {type_zDirection} direction Move to this direction
     * @param {boolean} doFlush If we want to flush
     * @returns {void}
     * @throws {Error<string>} when there exists a widget that is being moved is not a BaseWidget
     */
    moveWidgetsInZ = (widgetKeys: string[], direction: type_zDirection, doFlush: boolean): void => {
        let widgetKeysSorted: string[] = [];
        const allWidgetKeys = this.getWidgets().keys();
        for (let widgetKey of allWidgetKeys) {
            if (widgetKeys.includes(widgetKey)) {
                widgetKeysSorted.push(widgetKey);
            }
        }

        // reverse the order for insertion
        if (direction === "forward" || direction === "back") {
            widgetKeysSorted.reverse();
        }

        for (let widgetKey of widgetKeysSorted) {
            const widget = this.getWidget2(widgetKey);
            if (widget instanceof BaseWidget) {
                // do not flush
                widget.moveInZ(direction, false);
                this.addToForceUpdateWidgets(widgetKey);
            } else {
                const errMsg = `Widget ${widgetKey} is not a BaseWidget. Only BaseWidget can be moved.`;
                throw new Error(errMsg);
            }
        }
        if (doFlush) {
            g_flushWidgets();
        }
    };

    /**
     * Move selected widgets in Z direction, keep their relative Z positions
     */
    moveSelectedWidgetsInZ = (direction: type_zDirection, doFlush: boolean) => {
        const group = this.getGroupSelection2();
        const widgetKeys = [...group.getWidgets().keys()];
        this.moveWidgetsInZ(widgetKeys, direction, doFlush);
    };

    // ----------------------- sidebar --------------------------

    /**
     * Update sidebar based on the current status <br>
     * If no widget is selected, show Canvas sidebar <br>
     * If one widget is selected, show this widget's sidebar <br>
     * If multiple widgets are selected, show GroupSelection2 sidebar <br>
     */
    updateSidebar = (doFlush: boolean) => {
        if (this.isEditing()) {
            const group = this.getGroupSelection2();
            group.calcAndSetSidebar(doFlush);
        }
    };

    // ------------------------- force update widgets ------------------------------

    /**
     * Get the Set of force update widget keys
     */
    getForceUpdateWidgets = (): Set<string> => {
        return this._forceUpdateWidgets;
    };

    clearForceUpdateWidgets = (): void => {
        this._forceUpdateWidgets.clear();
    };

    removeFromForceUpdateWidgets = (widgetKey: string): void => {
        this._forceUpdateWidgets.delete(widgetKey);
    };

    addToForceUpdateWidgets = (widgetKey: string): void => {
        this._forceUpdateWidgets.add(widgetKey);
    };

    // -------------------- select/deselect all widgets ---------------------

    /**
     * Deselect all widgets <br>
     * (1) update selected widgets' style and move all selected widget objects from GroupSelection2._widgets back to g_widgets1._widgets <br>
     * (2) update sidebar <br>
     * (3) flush
     * @param {boolean} flush If we want to flush the display
     * @throws {Error<string>} when a widget that was selected is not BaseWidget
     */
    deselectAllWidgets = (flush: boolean): void => {
        // (1)
        const group = this.getGroupSelection2();

        for (let widget of group.getWidgets().values()) {
            if (widget instanceof BaseWidget) {
                widget.simpleDeselect(true);
            } else {
                const errMsg = `Widget cannot be selected/deselected.`;
                throw new Error(errMsg);
            }
        }
        // (2)
        g_widgets1.updateSidebar(false);
        this.addToForceUpdateWidgets("GroupSelection2");
        // (3)
        if (flush) {
            g_flushWidgets();
        }
    };

    /**
     * Get widget keys of selected widgets
     * @returns {string[]}
     */
    getSelectedWidgetKeys = (): string[] => {
        const group = this.getGroupSelection2();
        return [...group.getWidgets().keys()];
    };

    /**
     * Select all widgets in this display. Only BaseWidget can be selected. <br>
     *
     * The sidebar is updated.
     */
    selectAllWidgets = (doFlush: boolean) => {
        for (let [, widget] of this.getWidgets2()) {
            if (widget instanceof BaseWidget) {
                widget.simpleSelect(false);
            }
        }
        this.updateSidebar(false);
        // all widgets are in GroupSelection2, only need to update this widget
        this.addToForceUpdateWidgets("GroupSelection2");
        if (doFlush) {
            g_flushWidgets();
        }
    };

    // ----------------------------- create widge from mouse ---------------------------------
    // Create widget from mouse
    // todo: horizontal and vertical lines:
    //       https://stackoverflow.com/questions/58673089/vertical-and-horizontal-lines-that-always-intersect-mouse-cursor

    // temporary functions
    private _tmp_handleMouseDownOnCreatingWidget: any;
    private _tmp_handleMouseClickOnCreatingWidget: any;
    private _tmp_handleMouseDoubleClickOnCreatingWidget: any;
    private _tmp_handleMouseMoveOnCreatingWidget: any;
    private _tmp_handleMouseUpOnCreatingWidget: any;
    private _tmp_handleEscKeyOnCreatingWidget: any;

    /**
     * Create a widget using mouse.
     *
     * (1) deselect all widgets
     *
     * (2) change renderer window status to "creatingWidget". The mouse-down event is ignored on widgets and cavas
     *
     * (3) change mouse cursor style to "crosshair"
     *
     * (4) add mouse-down event listener
     * @param {type_widgetType} widgetType Type of a widget, a string
     */
    createWidgetFromMouse = (widgetType: type_widgetType) => {
        // (1)
        this.deselectAllWidgets(true);
        // (2)
        this.setRendererWindowStatus(rendererWindowStatus.creatingWidget);
        // (3)
        document.body.style.cursor = "crosshair";
        // (4)
        if (widgetType === "Polyline") {
            this._tmp_handleMouseClickOnCreatingWidget = (event: any) => {
                this._handleMouseClickOnCreatingPolylineWidget(event, widgetType);
            };
            window.addEventListener("click", this._tmp_handleMouseClickOnCreatingWidget);
        } else {
            this._tmp_handleMouseDownOnCreatingWidget = (event: any) => {
                this._handleMouseDownOnCreatingWidget(event, widgetType);
            };
            window.addEventListener("mousedown", this._tmp_handleMouseDownOnCreatingWidget);
        }
    };

    /**
     * Handler for mouse down event in creatingWidget mode: create a widget in mouse selection region <br>
     *
     * (1) record the cusor position, it is the origin <br>
     *
     * (2) create widget: size = 0, (x, y) = mouse position <br>
     *
     * (3) select this widget, so that the sidebar can be correctly shown <br>
     *
     * (4) start to listen to mouse-move and mouse-up events. <br>
     *
     * (5) listen to Escape key down event, when this key is pressed, cancel the widget creation <br>
     */
    private _handleMouseDownOnCreatingWidget = (event: any, widgetType: type_widgetType) => {
        // cancel if any other mouse button down, undo the above createWidgetFromMouse() function
        if (event.button !== 0) {
            this.setRendererWindowStatus(rendererWindowStatus.editing);
            document.body.style.cursor = "default";
            window.removeEventListener("mousedown", this._tmp_handleMouseDownOnCreatingWidget);
            return;
        }

        // handled by this._handleMouseClickOnCreatingWidget()
        if (widgetType === "Polyline") {
            return;
        }

        // (1)
        // const cursorX = event.clientX;
        // const cursorY = event.clientY;
        const cursorX = getMouseEventClientX(event);
        const cursorY = getMouseEventClientY(event);
        // (2)
        const widgetTdl = this.initWidgetTdl(widgetType, cursorX, cursorY, 0, 0);
        const widget = this.createWidget(widgetTdl, false);

        if (!(widget instanceof BaseWidget)) {
            const errMsg = `Only BaseWidget can be created in mouse`;
            throw new Error(errMsg);
        } else {
            widget.createSidebar();
        }
        // (3)
        widget.simpleSelect(true);
        // (4)
        this._tmp_handleMouseMoveOnCreatingWidget = (event: any) => this._handleMouseMoveOnCreatingWidget(event, widget, cursorX, cursorY);
        this._tmp_handleMouseUpOnCreatingWidget = (event: any) => this._handleMouseUpOnCreatingWidget(event, widget);
        window.addEventListener("mousemove", this._tmp_handleMouseMoveOnCreatingWidget);
        window.addEventListener("mouseup", this._tmp_handleMouseUpOnCreatingWidget);

        // (5)
        this._tmp_handleEscKeyOnCreatingWidget = (e: any) => {
            if (e.key == "Escape") {
                // (1) cancel all events, reset renderer window status, restore mouse cursor shape
                this._tmp_handleMouseUpOnCreatingWidget(undefined);
                // (2) delete this widget with flush
                const widgetKey = widget.getWidgetKey();
                this.removeWidget(widgetKey, true, true);
            }
        };
        window.addEventListener("keydown", this._tmp_handleEscKeyOnCreatingWidget);
    };

    /**
     * Handler when mouse moves upon widget creation. Because we pass local values to this function,
     * we have to assign this function to another function defined in this._handleMouseDonwOnCreatingWidget() <br>
     *
     * (1) resize the widget. We can resize the widget to any direction. <br>
     *
     * (2) update sidebar <br>
     *
     * @param {BaseWidget} widget The widget that is being created
     * @param {number} cursorX0 The initial cursor X value when we create the widget
     * @param {number} cursorY0 The initial cursor Y value when we create the widget
     */
    private _handleMouseMoveOnCreatingWidget = (event: any, widget: BaseWidget, cursorX0: number, cursorY0: number) => {
        // const cursorX = event.clientX;
        // const cursorY = event.clientY;
        const cursorX = getMouseEventClientX(event);
        const cursorY = getMouseEventClientY(event);
        // (1)
        if (cursorX > cursorX0 && cursorY > cursorY0) {
            // resize "E"
            widget.resize(cursorX0, cursorY0, cursorX - cursorX0, cursorY - cursorY0, true);
        } else if (cursorX > cursorX0 && cursorY < cursorY0) {
            // resize "C"
            widget.resize(cursorX0, cursorY, cursorX - cursorX0, cursorY0 - cursorY, true);
        } else if (cursorX < cursorX0 && cursorY > cursorY0) {
            // resize "G"
            widget.resize(cursorX, cursorY0, cursorX0 - cursorX, cursorY - cursorY0, true);
        } else if (cursorX < cursorX0 && cursorY < cursorY0) {
            // resize "A"
            widget.resize(cursorX, cursorY, cursorX0 - cursorX, cursorY0 - cursorY, true);
        } else {
            // do nothing
        }
        // (3)
        g_widgets1.updateSidebar(true);
    };

    /**
     * Handler for mouse up event when we create a widget <br>
     *
     * (1) if widget size in any direction is smaller than grid size (default 10) or min width (default 10) <br>
     *
     * (2) snap to grids: move, then resize <br>
     *
     * (3) change renderer window status to "editing" <br>
     *
     * (4) change back mouse cursor shape <br>
     *
     * (5) remove mouse-down, mouse-move and mouse-up event listeners <br>
     *
     * (6) remove Escape key down event listener <br>
     *
     */
    private _handleMouseUpOnCreatingWidget = (event: any, widget: BaseWidget) => {
        const canvas = this.getWidget2("Canvas");

        let xGridSize = 10;
        let yGridSize = 10;
        if (canvas instanceof Canvas) {
            xGridSize = canvas.getXGridSize();
            yGridSize = canvas.getYGridSize();
        }

        // (1)
        const width = widget.getStyle().width;
        const height = widget.getStyle().height;
        widget.getStyle().width = Math.max(width, GlobalVariables.widgetMinWidth, xGridSize);
        widget.getStyle().height = Math.max(height, GlobalVariables.widgetMinHeight, yGridSize);

        // (2)
        widget.getStyle().left = Math.round(widget.getStyle().left / xGridSize) * xGridSize;
        widget.getStyle().top = Math.round(widget.getStyle().top / yGridSize) * yGridSize;
        widget.getStyle().width = Math.round(widget.getStyle().width / xGridSize) * xGridSize;
        widget.getStyle().height = Math.round(widget.getStyle().height / yGridSize) * yGridSize;
        this.updateSidebar(true);

        // (3)
        this.setRendererWindowStatus(rendererWindowStatus.editing);
        // (4)
        document.body.style.cursor = "default";
        // (5)
        window.removeEventListener("mousedown", this._tmp_handleMouseDownOnCreatingWidget);
        window.removeEventListener("mousemove", this._tmp_handleMouseMoveOnCreatingWidget);
        window.removeEventListener("mouseup", this._tmp_handleMouseUpOnCreatingWidget);
        // (6)
        window.removeEventListener("keydown", this._tmp_handleEscKeyOnCreatingWidget);
    };

    // -------------- Polyline widget creation ---------------

    _tmp_polylineWidget: undefined | Polyline;

    private _handleMouseClickOnCreatingPolylineWidget = (event: any, widgetType: type_widgetType) => {
        // handled by this._handleMouseDownOnCreatingWidget()
        if (widgetType !== "Polyline") {
            return;
        }
        // cancel if any other mouse button down, undo the above createWidgetFromMouse() function
        if (event.button !== 0) {
            this.setRendererWindowStatus(rendererWindowStatus.editing);
            document.body.style.cursor = "default";
            if (this._tmp_polylineWidget !== undefined) {
                const widgetKey = this._tmp_polylineWidget.getWidgetKey();
                this.removeWidget(widgetKey, true, true);
            }

            window.removeEventListener("click", this._tmp_handleMouseClickOnCreatingWidget);
            window.removeEventListener("mousemove", this._tmp_handleMouseMoveOnCreatingWidget);
            window.removeEventListener("dblclick", this._tmp_handleMouseDoubleClickOnCreatingWidget);
            window.removeEventListener("keydown", this._tmp_handleEscKeyOnCreatingWidget);
            return;
        }

        // (1)
        // const cursorX = event.clientX;
        // const cursorY = event.clientY;
        const cursorX = getMouseEventClientX(event);
        const cursorY = getMouseEventClientY(event);
        // (2)
        if (this._tmp_polylineWidget === undefined) {
            // this.polylineWidgetCreated = true;
            const widgetTdl = this.initWidgetTdl(widgetType, cursorX, cursorY, 0, 0);
            const widget = this.createWidget(widgetTdl, false);
            this._tmp_polylineWidget = widget as Polyline;
            if (!(widget instanceof BaseWidget)) {
                const errMsg = `Only BaseWidget can be created in mouse`;
                throw new Error(errMsg);
            } else {
                widget.createSidebar();
            }
            // do not select this object
            // widget.simpleSelect(true);
            // (3)
            // (4)
            this._tmp_handleMouseMoveOnCreatingWidget = (event: any) =>
                this._handleMouseMoveOnCreatingPolylineWidget(event, widget, cursorX, cursorY);
            this._tmp_handleMouseDoubleClickOnCreatingWidget = (event: any) => this._handleMouseDoubleClickOnCreatingPolylineWidget(event, widget);
            window.addEventListener("mousemove", this._tmp_handleMouseMoveOnCreatingWidget);
            window.addEventListener("dblclick", this._tmp_handleMouseDoubleClickOnCreatingWidget);
        }
        if (this._tmp_polylineWidget !== undefined) {
            if (this._tmp_polylineWidget.getPointsRelativeX().length <= 1) {
                this._tmp_polylineWidget.updateWidgetAddPoint(cursorX, cursorY);
            }
            this._tmp_polylineWidget.updateWidgetAddPoint(cursorX, cursorY);
        }

        // (5)
        // cannot use "if (this._tmp_polylineWidget === undefined)" because this._tmp_polylineWidget is already created
        // and this step has to be done after the this._tmp_handleMouseDoubleClickOnCreatingWidget is created
        // however, it requires the this._tmp_polylineWidget object. So, we remove the Esc keydown event then add it
        // to avoid multiple Esc keydown event listeners
        window.removeEventListener("keydown", this._tmp_handleEscKeyOnCreatingWidget);
        this._tmp_handleEscKeyOnCreatingWidget = (e: any) => {
            if (e.key == "Escape") {
                // (1) cancel all events, reset renderer window status, restore mouse cursor shape
                this._tmp_handleMouseDoubleClickOnCreatingWidget(undefined, this._tmp_polylineWidget);
                // (2) delete this widget with flush
                // if (this._tmp_polylineWidget !== undefined) {
                // 	const widgetKey = this._tmp_polylineWidget.getWidgetKey();
                // 	this.removeWidget(widgetKey, true, true);
                // }
            }
        };
        window.addEventListener("keydown", this._tmp_handleEscKeyOnCreatingWidget);
    };

    // create a virtual point, and flush this widget
    private _handleMouseMoveOnCreatingPolylineWidget = (event: any, widget: BaseWidget, cursorX0: number, cursorY0: number) => {
        // const cursorX = event.clientX;
        // const cursorY = event.clientY;
        const cursorX = getMouseEventClientX(event);
        const cursorY = getMouseEventClientY(event);
        (widget as Polyline).updateWidgetRemovePoint();
        (widget as Polyline).updateWidgetAddPoint(cursorX, cursorY);
        g_widgets1.updateSidebar(true);
    };

    /**
     * When event is "undefined", we are canceling the creation of this Polyline widget
     */
    private _handleMouseDoubleClickOnCreatingPolylineWidget = (event: any, widget: BaseWidget) => {
        if (widget.getType() !== "Polyline") {
            return;
        }

        if (event !== undefined) {
            // (1)
            // const cursorX = event.clientX;
            // const cursorY = event.clientY;
            const cursorX = getMouseEventClientX(event);
            const cursorY = getMouseEventClientY(event);
            // move
            (widget as Polyline).updateWidgetRemovePoint();
            // single click
            (widget as Polyline).updateWidgetRemovePoint();
            // single click
            (widget as Polyline).updateWidgetRemovePoint();
            (widget as Polyline).updateWidgetAddPoint(cursorX, cursorY);

            if ((widget as Polyline).getPointsRelativeX().length < 2) {
                // remove it
                this.removeWidget(widget.getWidgetKey(), true, true);
            }

            widget.simpleSelect(true);
        }
        this.updateSidebar(true);

        // we are canceling the creation of this widget: destroy the newly created data
        if (event === undefined) {
            if (this._tmp_polylineWidget !== undefined) {
                const widgetKey = this._tmp_polylineWidget.getWidgetKey();
                this.removeWidget(widgetKey, true, true);
            }
        }
        this._tmp_polylineWidget = undefined;

        // (2)
        this.setRendererWindowStatus(rendererWindowStatus.editing);
        // (3)
        document.body.style.cursor = "default";
        // (4)
        window.removeEventListener("click", this._tmp_handleMouseClickOnCreatingWidget);
        window.removeEventListener("mousemove", this._tmp_handleMouseMoveOnCreatingWidget);
        window.removeEventListener("dblclick", this._tmp_handleMouseDoubleClickOnCreatingWidget);
        // (5)
        window.removeEventListener("keydown", this._tmp_handleEscKeyOnCreatingWidget);
    };

    // ----------------------------------- renderer window status/mode -----------------------------------

    /**
     * Set renderer window status. The window must be switched between "operating" and "editing" modes.<br>
     *
     * (1) deselect all widgets
     *
     * (2) destroy all channels hard no matter what mode we are changing to.
     *     The Channels in main process are also destroyed if no other window is using them.
     *     The channel-widget relationship may have changed since last time operating. <br>
     *
     * (3) set renderer window to new status. <br>
     *
     * (4) adjust window size according to Canvas size, the sidebar will be hidden <br>
     *
     * (5) activate rules for each widget, it must be done before connecting channels <br>
     *
     * (6) if we are changing to "operating" mode, re-create all TcaChannel objects and tell main process to monitor all channels <br>
     *
     * (7) flush all widgets <br>
     *
     * (8) run window attached script <br>
     *
     * @param {rendererWindowStatus} newMode New renderer window status
     * @param {boolean} doFlush If we want to flush widgets
     */
    setMode = (newMode: rendererWindowStatus.operating | rendererWindowStatus.editing, doFlush: boolean, destroyAllTcaChannels: boolean) => {
        if (newMode === this.getRendererWindowStatus() && !doFlush) {
            return;
        }
        const oldMode = this.getRendererWindowStatus();

        // (1)
        this.deselectAllWidgets(false);
        // (2)
        // ! all the tcaChannels should be destroyed only when we manually switch between operating and editing modes
        // ! all other cases, e.g. update-tdl event should not do the destroy all TcaChannels, because prior this event,
        // ! there should be no active Tca Channels
        if (destroyAllTcaChannels) {
            this.destroyAllTcaChannels();
        }

        // (3)
        this.setRendererWindowStatus(newMode);
        // (4)
        const canvas = this.getWidget2("Canvas");
        if (!(canvas instanceof Canvas)) {
            const errMsg = "There is no Canvas widget";
            throw new Error(errMsg);
        }
        let width = canvas.getStyle().width;
        let height = canvas.getStyle().height;
        if (newMode === rendererWindowStatus.editing) {
            // width = canvas.getStyle().width + calcSidebarTotalWidth();
            width = canvas.getStyle().width + calcSidebarWidth() + getWindowVerticalScrollBarWidth();
        }
        let dx = window.outerWidth - window.innerWidth;
        let dy = window.outerHeight - window.innerHeight;

        // if (process.platform === "darwin") {
        //     // do nothing
        // } else if (process.platform === "linux") {
        //     dx = 0;
        //     dy = 0;
        // } else if (process.platform === "win32") {
        //     dx = 0;
        //     dy = 0;
        // } else {
        //     dx = 0;
        //     dy = 0;
        //     Log.error(`Window resizing error: we only support "linux", "win32", and "darwin"`);
        // }

        window.resizeTo(width + dx, height + dy);

        // the dynamically added widgets changes the array (set) of the widget keys
        for (const widgetKey of JSON.parse(JSON.stringify([...this.getWidgets().keys()]))) {
            // (5)
            const widget = this.getWidget2(widgetKey);
            if (widget instanceof BaseWidget) {
                if (newMode === rendererWindowStatus.operating) {
                    widget.jobsAsOperatingModeBegins();
                } else {
                    widget.jobsAsEditingModeBegins();
                }
                widget.setMode(newMode, oldMode);
            }
            this.addToForceUpdateWidgets(widgetKey);
        }
        // (6)

        if (newMode === rendererWindowStatus.operating) {
            this.connectAllTcaChannels();
            this.hideTableTemplateWidgets();
        } else if (newMode === rendererWindowStatus.editing) {
            this.showTableTemplateWidgets();
        }
        this.addToForceUpdateWidgets("GroupSelection2");
        // (7)
        if (doFlush) {
            g_flushWidgets();
        }
        // (8) if there is a script
        if (newMode === rendererWindowStatus.operating) {
            this.runWindowAttachedScript();
        } else {
            this.terminateWindowAttachedScript();
        }
    };

    // ----------------------- Table widget ------------------------------

    // the template widgets inside a Table should be hidden/shown in operating/editing mode

    _tableTemplateWidgets: string[] = [];

    getTableTemplateWidgets = () => {
        return this._tableTemplateWidgets;
    }

    clearTableTemplateWidgets = () => {
        this._tableTemplateWidgets.length = 0;
    }

    hideTableTemplateWidgets = () => {
        for (const widgetKey of this.getTableTemplateWidgets()) {
            const widget = this.getWidget2(widgetKey);
            if (widget instanceof BaseWidget) {
                widget.getStyle()["display"] = "none";
                console.log("+++++++++++++++++++++++ hide", widgetKey)
                this.addToForceUpdateWidgets(widgetKey);
            }
        }
        // this.clearTableTemplateWidgets();
    }


    showTableTemplateWidgets = () => {
        for (const widgetKey of this.getTableTemplateWidgets()) {
            const widget = this.getWidget2(widgetKey);
            if (widget instanceof BaseWidget) {
                widget.getStyle()["display"] = "inline-flex";
                this.addToForceUpdateWidgets(widgetKey);
            }
        }
        this.clearTableTemplateWidgets();
    }



    // ----------------------------- window attached script ---------------------

    runWindowAttachedScript = () => {
        this.windowAttachedScriptAction("run");
    };
    terminateWindowAttachedScript = () => {
        this.windowAttachedScriptAction("terminate");
    };

    windowAttachedScriptAction = (action: "run" | "terminate") => {
        const canvas = this.getWidget2("Canvas");
        if (!(canvas instanceof Canvas)) {
            Log.error("Error: cannot find Canvas");
            return;
        }
        let script = canvas.getScript();

        if (script === undefined || !(script.endsWith(".py") || script.endsWith(".js"))) {
            Log.error("Window attached script", script, "must be a .js or .py file.");
            return;
        }
        if (!path.isAbsolute(script)) {
            const tdlFileName = this.getRoot().getDisplayWindowClient().getTdlFileName();
            const dirName = path.dirname(tdlFileName);
            script = path.join(dirName, script);
        }
        this.getRoot().getDisplayWindowClient().getIpcManager().sendFromRendererProcess("window-attached-script", {
            displayWindowId: this.getRoot().getDisplayWindowClient().getWindowId(),
            action: action,
            script: script,
        });
    };

    // --------------------------------- channel --------------------------------

    /**
     * Destroy all TcaChannel objects.
     */
    destroyAllTcaChannels = () => {
        for (let tcaChannel of Object.values(this.getTcaChannels())) {
            // destroy this channel from all widgets
            tcaChannel.destroy(undefined);
        }
    };

    /**
     * Connect all TcaChannels on this window. All previous TcaChannel objects should have been destroyed, which can
     * be done via this.destroyAllTcaChannels(). <br>
     *
     * (1) create TcaChannel objects for all channels (they were destroyed), and resolve widgetKeys for each channel
     *     replace meta data in local channels if necessary <br>
     *
     * (2) for each channel, get Gr data (units, limits, ...), never timeout
     *     if channel does not exist in main process, create it <br>
     *
     * (3) start to monitor, a monitor never destroys the channel
     *
     */
    connectAllTcaChannels = (reconnect: boolean = false) => {
        // there should be no TcaChannel
        if (Object.keys(this.getTcaChannels()).length > 0 && reconnect === false) {
            Log.info("There should be no channel connection on this window for connectAllTcaChannels().")
            return;
        }
        // (1)
        for (let [, widget] of this.getWidgets2()) {
            if (widget instanceof BaseWidget) {
                for (let channelNameLevel3 of widget.getChannelNamesLevel3()) {
                    Log.debug("connect all tca channels", channelNameLevel3)
                    this.createTcaChannel(channelNameLevel3, widget.getWidgetKey());
                }
            }
        }
        for (let tcaChannel of Object.values(this.getTcaChannels())) {
            // (2)
            // level 4 channel name
            const channelName = tcaChannel.getChannelName();
            if (TcaChannel.checkChannelName(channelName) === "local" || TcaChannel.checkChannelName(channelName) === "global") {
                // if the initial dbr data is different from default, put init values
                const displayWindowClient = this.getRoot().getDisplayWindowClient();
                const displayWindowId = displayWindowClient.getWindowId();
                // the meta data is extracted in TcaChannel constructor
                tcaChannel.put(displayWindowId, tcaChannel.getDbrData(), 1);
            }
            tcaChannel.getMeta(undefined);
            // (3)
            console.log("start to monitor XXX ========================")
            tcaChannel.monitor();
        }
    };

    // raw channel name, ABCD, loc://ABCD, loc://ABCD<string>("this is it"), loc://ABCD<string>("this is ${SYS}3"), ${SYS}1, loc://${SYS}1
    // expanded channel name, ABCD, loc://ABCD, loc://ABCD<string>("this is it"), loc://ABCD<string>("this is val3"), val1, loc://val1
    // extracted channel name, ABCD, loc://ABCD, loc://ABCD, loc://ABCD, val1, loc://val1
    // channel name

    /**
     * Create a TcaChannel object from a widget. A TcaChannel must be created by a widget, so that
     * the relationship between a widget and a TcaChannel can be established. In this way, a TcaChannel must be
     * attached to one or more widgets.  <br>
     *
     * This function creates the data for EPICS channels, in both renderer process and main process.
     * The network connection is not set up in here. The connection is established when we invoke TcaChannel.get() or
     * TcaChannel.monitor() the channel. <br>
     *
     * If this TcaChannel already exists, we only establish the relationship with the widget. <br>
     *
     * (1) create TcaChannel instance, add it to the list
     *     if there is already one, use the existing one <br>
     *
     * (2) add widgetKey to TcaChannel, do it every time when this function is invoked
     * no real connection yet, <br>
     *
     * @param {string} fullChannelName: the level-3 channel name: macro/windowId expanded, meta ketp, e.g. "val1", "loc://abc", "loc://abc<number>(88)"
     */
    createTcaChannel = (channelNameLevel3: string, widgetKey: string): TcaChannel | undefined => {
        // the name without meta data
        const channelNameLevel4 = BaseWidget.channelNameLevel3to4(channelNameLevel3);
        // (1)
        let tcaChannel = undefined;
        if (!TcaChannel.validateChannelName(channelNameLevel4)) {
            return tcaChannel;
        }
        try {
            tcaChannel = this.getTcaChannel(channelNameLevel4);
            // if this local channel name contains meta data, replace it
            if (TcaChannel.checkChannelName(channelNameLevel4) === "local" || TcaChannel.checkChannelName(channelNameLevel4) === "global") {
                tcaChannel.updateLocalChannelInitialValue(channelNameLevel3);
            }
        } catch (e) {
            tcaChannel = new TcaChannel(channelNameLevel4);
            if (TcaChannel.checkChannelName(channelNameLevel4) === undefined) {
                // an illegal channel name, do not create this channel, do nothing
                return undefined;
            } else if (TcaChannel.checkChannelName(channelNameLevel4) === "local" || TcaChannel.checkChannelName(channelNameLevel4) === "global") {
                tcaChannel.updateLocalChannelInitialValue(channelNameLevel3);
            }
            this._tcaChannels[channelNameLevel4] = tcaChannel;
        }
        // (2)
        tcaChannel.addWidgetKey(widgetKey);
        return tcaChannel;
    };

    /**
     * Remove a TcaChannel and clean up its relationships with the widget.
     *
     * @param {string} channelName Name of the channel to be removed.
     * @param {string | undefined} widgetKey If string, the relationship between the TcaChannel and this widget is destroyed.
     *  If there is no more widget using this channel, then this TcaChannel object is destroyed.
     *  If undefined, the relationships between the TcaChannel and all widgets are destroyed, the TcaChannel is also destroyed.
     */
    removeTcaChannel = (channelName: string, widgetKey: string | undefined) => {
        try {
            let tcaChannel = this.getTcaChannel(channelName);
            tcaChannel.destroy(widgetKey);
        } catch (e) {
            // do nothing
        }
    };

    // ------------------------------- channel getters --------------------------

    /**
     * Get this._tcaChannels
     * @returns {Record<string, TcaChannel>}
     */
    getTcaChannels = (): Record<string, TcaChannel> => {
        return this._tcaChannels;
    };

    /**
     * Get the TcaChannel object according to the channel name <br>
     * @param {string} channeName
     * @returns {TcaChannel}
     * @throws {Error<string>} when the channel does not exist.
     */
    getTcaChannel = (channelName: string): TcaChannel => {
        const parsedChannelName = TcaChannel.checkChannelName(channelName);
        if (parsedChannelName === "ca" || parsedChannelName === "pva") {
            const tcaChannel = this._tcaChannels[channelName];
            if (tcaChannel !== undefined) {
                return tcaChannel;
            }
        } else if (parsedChannelName === "local" || parsedChannelName === "global") {
            const localChannelNameMeta = TcaChannel.extractNameAndMetaFromLocalChannelName(channelName);
            if (localChannelNameMeta !== undefined) {
                const locaChannelName = localChannelNameMeta["localChannelName"];
                const tcaChannel = this._tcaChannels[locaChannelName];
                if (tcaChannel !== undefined) {
                    return tcaChannel;
                }
            }
        }
        const errMsg = `Channel ${channelName} does not exist`;
        throw new Error(errMsg);
    };

    getTcaSubPvaChannels = (channelName: string): TcaChannel[] => {
        const parsedChannelName = TcaChannel.checkChannelName(channelName);
        // remove ".value"
        if (channelName.endsWith(".value")) {
            channelName = channelName.substring(0, channelName.length - 6);
        }
        const result: TcaChannel[] = [];
        if (parsedChannelName === "pva") {
            for (let tmp of Object.keys(this.getTcaChannels())) {
                if (tmp.includes(channelName)) {
                    result.push(this.getTcaChannels()[tmp]);
                }
            }
            if (result.length > 0) {
                return result;
            }
        }
        const errMsg = `Channel ${channelName} does not exist`;
        throw new Error(errMsg);
    };


    // value, severity, unit, dbr type, record type, time stamp, precision, enum choices
    // limits: upper_display_limit; lower_display_limit; upper_alarm_limit;
    //         upper_warning_limit; lower_warning_limit; lower_alarm_limit;
    // Most of them are in the DBR_GR data structure, which is the first data to be obtained, after
    // that the DBR_TIME is monitored.

    /**
     * Get TcaChannel's value. <br>
     *
     * @param {string} channelName
     * @returns {string | number | number[] | string[] | undefined} TcaChannel value.
     *
     * In editing mode, always return the channel name. <br>
     *
     * In operating mode, if TcaChannel object does not exist or channel not connected, return undefined. <br>
     */
    getChannelValue = (channelName: string, raw: boolean = false): string | number | number[] | string[] | undefined => {

        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return channelName;
        }

        const isSevrChannel = channelName.endsWith(".SEVR");

        try {
            const tcaChannel = this.getTcaChannel(channelName);
            let value = tcaChannel.getValue(raw);
            if (isSevrChannel === true && value === undefined) {
                // try the raw channel's dbrData["severity"]
                const rawTcaChannel = this.getTcaChannel(channelName.replaceAll(".SEVR", ""));
                value = rawTcaChannel.getDbrData()["severity"];
            }
            return value;
        } catch (e) {
            // Log.error(e);
            return undefined;
        }
    };

    /**
     * Get TcaChannel's severity
     * 
     * @param {string} channelName
     * 
     * @returns {ChannelSeverity} TcaChannel severity. In editing mode, severity is always NO_ALARM.
     * 
     * In operating mode, if TcaChannel object does not exist or the channel is not connected, returns INVALID.
     *
     */
    getChannelSeverity = (channelName: string): ChannelSeverity => {
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return ChannelSeverity.NO_ALARM;
        }
        try {
            const tcaChannel = this.getTcaChannel(channelName);
            let severity = tcaChannel.getSeverity();

            // in some cases, the IOC does not reply for GET request of xxx.SEVR
            // So, the channel xxx.SEVR has undefined value and undefined severity
            // in this case, try to get the raw channel's severity
            if (severity === ChannelSeverity.INVALID && channelName.endsWith(".SEVR")) {
                channelName = channelName.replaceAll(".SEVR", "");
                severity = this.getChannelSeverity(channelName);
            }


            return severity;
        } catch (e) {
            // Log.error(e);
            return ChannelSeverity.INVALID;
        }
    };

    /**
     * Get TcaChannel's DBR type
     * @param {string} channelName
     * @returns {Channel_DBR_TYPES | undefined} TcaChannel dbr type. In editing mode, dbr type is always undefined.
     * In operating mode, if TcaChannel object does not exist or the channel is not connected, returns undefined.
     *
     */
    getChannelDbrType = (channelName: string): Channel_DBR_TYPES | undefined => {
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return undefined;
        }
        try {
            const tcaChannel = this.getTcaChannel(channelName);
            return tcaChannel.getDbrType();
        } catch (e) {
            Log.error(e);
            return undefined;
        }
    };

    /**
     * Get TcaChannel's record type
     * @param {string} channelName
     * @returns {ChannelSeverity} TcaChannel record type. In editing mode, record type is always undefined.
     * In operating mode, if TcaChannel object does not exist or the channel is not connected, returns undefined.
     *
     */
    getChannelRTYP = (channelName: string): string | undefined => {
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return undefined;
        }
        try {
            const tcaChannel = this.getTcaChannel(channelName);
            return tcaChannel.getRTYP();
        } catch (e) {
            Log.error(e);
            return undefined;
        }
    };

    /**
     * Get TcaChannel's unit
     * @param {string} channelName
     * @returns {string} TcaChannel unit. In editing mode, unit is always "".
     * In operating mode, if TcaChannel object does not exist or the channel is not connected, returns "".
     *
     */
    getChannelUnit = (channelName: string): string => {
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return "";
        }
        try {
            const tcaChannel = this.getTcaChannel(channelName);
            return tcaChannel.getUnit();
        } catch (e) {
            // Log.error(e);
            return "";
        }
    };

    /**
     * Get TcaChannel's access right
     * @param {string} channelName
     * @returns {string} TcaChannel access right. In editing mode, unit is always "".
     * In operating mode, if TcaChannel object does not exist or the channel is not connected, returns "".
     *
     */
    getChannelAccessRight = (channelName: string): Channel_ACCESS_RIGHTS => {
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return Channel_ACCESS_RIGHTS.NOT_AVAILABLE;
        }
        try {
            const tcaChannel = this.getTcaChannel(channelName);
            return tcaChannel.getAccessRight();
        } catch (e) {
            Log.error(e);
            return Channel_ACCESS_RIGHTS.NOT_AVAILABLE;
        }
    };

    /**
     * Get TcaChannel's time stamp
     * @param {string} channelName
     * @returns {Date | undefined} TcaChannel time stamp. In editing mode, time stamp is always undefined.
     * In operating mode, if TcaChannel object does not exist or the channel is not connected, returns undefined.
     *
     */
    getChannelTimeStamp = (channelName: string): Date | undefined => {
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return undefined;
        }
        try {
            const tcaChannel = this.getTcaChannel(channelName);
            return tcaChannel.getTimeStamp();
        } catch (e) {
            Log.error(e);
            return undefined;
        }
    };

    /**
     * Get TcaChannel's upper display limit
     * @param {string} channelName
     * @returns {string | number | number[] | string[] | undefined} TcaChannel's upper display limit.
     * In editing mode, the limit is always undefined.
     * In operating mode, if TcaChannel object does not exist or the channel is not connected, returns undefined.
     *
     */
    getChannelUpperDisplayLimit = (channelName: string): string | number | number[] | string[] | undefined => {
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return undefined;
        }
        try {
            const tcaChannel = this.getTcaChannel(channelName);
            return tcaChannel.getUpperDisplayLimit();
        } catch (e) {
            Log.error(e);
            return undefined;
        }
    };

    /**
     * Get TcaChannel's lower display limit
     * @param {string} channelName
     * @returns {string | number | number[] | string[] | undefined} TcaChannel's lower display limit.
     * In editing mode, the limit is always undefined.
     * In operating mode, if TcaChannel object does not exist or the channel is not connected, returns undefined.
     *
     */
    getChannelLowerDisplayLimit = (channelName: string): string | number | number[] | string[] | undefined => {
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return undefined;
        }
        try {
            const tcaChannel = this.getTcaChannel(channelName);
            return tcaChannel.getLowerDisplayLimit();
        } catch (e) {
            Log.error(e);
            return undefined;
        }
    };

    /**
     * Get TcaChannel's upper alarm limit
     * @param {string} channelName
     * @returns {string | number | number[] | string[] | undefined} TcaChannel's upper alarm limit.
     * In editing mode, the limit is always undefined.
     * In operating mode, if TcaChannel object does not exist or the channel is not connected, returns undefined.
     *
     */
    getChannelUpperAlarmLimit = (channelName: string): string | number | number[] | string[] | undefined => {
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return undefined;
        }
        try {
            const tcaChannel = this.getTcaChannel(channelName);
            return tcaChannel.getUpperAlarmLimit();
        } catch (e) {
            Log.error(e);
            return undefined;
        }
    };

    /**
     * Get TcaChannel's lower alarm limit
     * @param {string} channelName
     * @returns {string | number | number[] | string[] | undefined} TcaChannel's lower alarm limit.
     * In editing mode, the limit is always undefined.
     * In operating mode, if TcaChannel object does not exist or the channel is not connected, returns undefined.
     *
     */
    getChannelLowerAlarmLimit = (channelName: string): string | number | number[] | string[] | undefined => {
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return undefined;
        }
        try {
            const tcaChannel = this.getTcaChannel(channelName);
            return tcaChannel.getLowerAlarmLimit();
        } catch (e) {
            Log.error(e);
            return undefined;
        }
    };

    /**
     * Get TcaChannel's upper warning limit
     * @param {string} channelName
     * @returns {string | number | number[] | string[] | undefined} TcaChannel's upper warning limit.
     * In editing mode, the limit is always undefined.
     * In operating mode, if TcaChannel object does not exist or the channel is not connected, returns undefined.
     *
     */
    getChannelUpperWarningLimit = (channelName: string): string | number | number[] | string[] | undefined => {
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return undefined;
        }
        try {
            const tcaChannel = this.getTcaChannel(channelName);
            return tcaChannel.getUpperWarningLimit();
        } catch (e) {
            Log.error(e);
            return undefined;
        }
    };

    /**
     * Get TcaChannel's lower warning limit
     * @param {string} channelName
     * @returns {string | number | number[] | string[] | undefined} TcaChannel's lower warning limit.
     * In editing mode, the limit is always undefined.
     * In operating mode, if TcaChannel object does not exist or the channel is not connected, returns undefined.
     *
     */
    getChannelLowerWarningLimit = (channelName: string): string | number | number[] | string[] | undefined => {
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return undefined;
        }
        try {
            const tcaChannel = this.getTcaChannel(channelName);
            return tcaChannel.getLowerWarningLimit();
        } catch (e) {
            Log.error(e);
            return undefined;
        }
    };

    /**
     * Get TcaChannel's status
     * @param {string} channelName
     * @returns {number | undefined} TcaChannel's status
     * In editing mode, the status is always undefined.
     * In operating mode, if TcaChannel object does not exist or the channel is not connected, returns undefined.
     *
     */
    getChannelStatus = (channelName: string): number | undefined => {
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return undefined;
        }
        try {
            const tcaChannel = this.getTcaChannel(channelName);
            return tcaChannel.getStatus();
        } catch (e) {
            Log.error(e);
            return undefined;
        }
    };

    /**
     * Get TcaChannel's precision
     * @param {string} channelName
     * @returns {number | undefined} TcaChannel's precision
     * In editing mode, the precision is always undefined.
     * In operating mode, if TcaChannel object does not exist or the channel is not connected, returns undefined.
     *
     */
    getChannelPrecision = (channelName: string): number | undefined => {
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return undefined;
        }
        try {
            const tcaChannel = this.getTcaChannel(channelName);
            return tcaChannel.getPrecision();
        } catch (e) {
            Log.error(e);
            return undefined;
        }
    };

    /**
     * Get TcaChannel's enum choices. This channel should be ENUM type.
     * @param {string} channelName
     * @returns {string[] | undefined} TcaChannel's precision
     * If channel type is not enum, return undefined.
     * In editing mode, the precision is always undefined.
     * In operating mode, if TcaChannel object does not exist or the channel is not connected, returns undefined.
     *
     */
    getChannelStrings = (channelName: string): string[] | undefined => {
        if (g_widgets1.getRendererWindowStatus() !== rendererWindowStatus.operating) {
            return undefined;
        }
        try {
            const tcaChannel = this.getTcaChannel(channelName);
            return tcaChannel.getStrings();
        } catch (e) {
            Log.error(e);
            return undefined;
        }
    };

    // ---------------------------- Probe and PvTable -----------------------------

    // invoked in the regular display window
    // (1) obtain the widget that the right click occurs
    // (2) obtain the channel names in this widget
    // (3) tell main process to create a Probe browser window
    // (4) if the widgetKeys is empty, the returned channelNames is empty
    openProbeWindow = (widgetKeys: string[] = [], channelName?: string) => {
        if (widgetKeys.length === 0 && channelName !== undefined) {
            let toBeOpenedChannelNames = [];
            if (channelName !== undefined) {
                toBeOpenedChannelNames.push(channelName);
            }
            // (3)
            if (this.getRoot().getDisplayWindowClient().getMainProcessMode() === "desktop" || this.getRoot().getDisplayWindowClient().getMainProcessMode() === "ssh-client") {
                this.getRoot()
                    .getDisplayWindowClient()
                    .getIpcManager()
                    .sendFromRendererProcess("create-utility-display-window", "Probe", { channelNames: toBeOpenedChannelNames });
            } else {
                // web mode
                const currentSite = `https://${window.location.host}/`;

                this.getRoot()
                    .getDisplayWindowClient()
                    .getIpcManager()
                    .sendPostRequestCommand("create-utility-display-window", {
                        utilityType: "Probe",
                        utilityOptions: { channelNames: toBeOpenedChannelNames },
                    })
                    .then((response: any) => {
                        // decode string
                        return response.json();
                    })
                    .then((data) => {
                        const ipcServerPort = data["ipcServerPort"];
                        const displayWindowId = data["displayWindowId"];
                        // window.open(`${currentSite}DisplayWindow.html?ipcServerPort=${ipcServerPort}&displayWindowId=${displayWindowId}`);
                        window.open(`${currentSite}DisplayWindow.html?displayWindowId=${displayWindowId}`);
                    });
            }
            return;
        }
        else {
            // (1)
            const widgetKey = widgetKeys[0];
            let widget = undefined;
            try {
                widget = this.getWidget2(widgetKey);
            } catch (e) {
                Log.error(e);
            }
            if (widget !== undefined && widget instanceof BaseWidget) {
                // (2)
                const channelNames = widget.getChannelNames();
                let channelName = channelNames[0];
                // it is a one-element string array
                let toBeOpenedChannelNames = [];
                if (channelName !== undefined) {
                    toBeOpenedChannelNames.push(channelName);
                }
                // (3)
                if (this.getRoot().getDisplayWindowClient().getMainProcessMode() === "desktop" || this.getRoot().getDisplayWindowClient().getMainProcessMode() === "ssh-client") {
                    this.getRoot()
                        .getDisplayWindowClient()
                        .getIpcManager()
                        .sendFromRendererProcess("create-utility-display-window", "Probe", { channelNames: toBeOpenedChannelNames });
                } else {
                    const currentSite = `https://${window.location.host}/`;

                    this.getRoot()
                        .getDisplayWindowClient()
                        .getIpcManager()
                        .sendPostRequestCommand("create-utility-display-window", {
                            utilityType: "Probe",
                            utilityOptions: { channelNames: toBeOpenedChannelNames },
                        })
                        .then((response: any) => {
                            // decode string
                            return response.json();
                        })
                        .then((data) => {
                            const ipcServerPort = data["ipcServerPort"];
                            const displayWindowId = data["displayWindowId"];
                            // window.open(`${currentSite}DisplayWindow.html?ipcServerPort=${ipcServerPort}&displayWindowId=${displayWindowId}`);
                            window.open(`${currentSite}DisplayWindow.html?displayWindowId=${displayWindowId}`);
                        });
                }
            } else {
                // (4)
                // this.getRoot()
                // 	.getDisplayWindowClient()
                // 	.getIpcManager()
                // 	.sendFromRendererProcess("create-utility-display-window", "Probe", { channelNames: [] });

                if (this.getRoot().getDisplayWindowClient().getMainProcessMode() === "desktop" || this.getRoot().getDisplayWindowClient().getMainProcessMode() === "ssh-client") {
                    this.getRoot()
                        .getDisplayWindowClient()
                        .getIpcManager()
                        .sendFromRendererProcess("create-utility-display-window", "Probe", { channelNames: [] });
                } else {
                    const currentSite = `https://${window.location.host}/`;

                    this.getRoot()
                        .getDisplayWindowClient()
                        .getIpcManager()
                        .sendPostRequestCommand("create-utility-display-window", {
                            utilityType: "Probe",
                            utilityOptions: { channelNames: [] },
                        })
                        .then((response: any) => {
                            // decode string
                            return response.json();
                        })
                        .then((data) => {
                            const ipcServerPort = data["ipcServerPort"];
                            const displayWindowId = data["displayWindowId"];
                            // window.open(`${currentSite}DisplayWindow.html?ipcServerPort=${ipcServerPort}&displayWindowId=${displayWindowId}`);
                            window.open(`${currentSite}DisplayWindow.html?displayWindowId=${displayWindowId}`);
                        });
                }
            }
        }
    };

    openPvMonitorWindow = (widgetKeys: string[]) => {
        // (1)
        const widgetKey = widgetKeys[0];
        let widget = undefined;
        try {
            widget = this.getWidget2(widgetKey);
        } catch (e) {
            Log.error(e);
        }
        if (widget !== undefined && widget instanceof BaseWidget) {
            // (2)
            const channelNames = widget.getChannelNames();
            let channelName = channelNames[0];
            // it is a one-element string array
            let toBeOpenedChannelNames = [];
            if (channelName !== undefined) {
                toBeOpenedChannelNames.push(channelName);
            }
            // (3)
            if (this.getRoot().getDisplayWindowClient().getMainProcessMode() === "desktop" || this.getRoot().getDisplayWindowClient().getMainProcessMode() === "ssh-client") {
                this.getRoot()
                    .getDisplayWindowClient()
                    .getIpcManager()
                    .sendFromRendererProcess("create-utility-display-window", "PvMonitor", { channelNames: toBeOpenedChannelNames });
            } else {
                const currentSite = `https://${window.location.host}/`;

                this.getRoot()
                    .getDisplayWindowClient()
                    .getIpcManager()
                    .sendPostRequestCommand("create-utility-display-window", {
                        utilityType: "PvMonitor",
                        utilityOptions: { channelNames: toBeOpenedChannelNames },
                    })
                    .then((response: any) => {
                        // decode string
                        return response.json();
                    })
                    .then((data) => {
                        const ipcServerPort = data["ipcServerPort"];
                        const displayWindowId = data["displayWindowId"];
                        // window.open(`${currentSite}DisplayWindow.html?ipcServerPort=${ipcServerPort}&displayWindowId=${displayWindowId}`);
                        window.open(`${currentSite}DisplayWindow.html?displayWindowId=${displayWindowId}`);
                    });
            }
        } else {
            // (4)
            // this.getRoot()
            // 	.getDisplayWindowClient()
            // 	.getIpcManager()
            // 	.sendFromRendererProcess("create-utility-display-window", "Probe", { channelNames: [] });

            if (this.getRoot().getDisplayWindowClient().getMainProcessMode() === "desktop" || this.getRoot().getDisplayWindowClient().getMainProcessMode() === "ssh-client") {
                this.getRoot()
                    .getDisplayWindowClient()
                    .getIpcManager()
                    .sendFromRendererProcess("create-utility-display-window", "PvMonitor", { channelNames: [] });
            } else {
                const currentSite = `https://${window.location.host}/`;

                this.getRoot()
                    .getDisplayWindowClient()
                    .getIpcManager()
                    .sendPostRequestCommand("create-utility-display-window", {
                        utilityType: "PvMonitor",
                        utilityOptions: { channelNames: [] },
                    })
                    .then((response: any) => {
                        // decode string
                        return response.json();
                    })
                    .then((data) => {
                        const ipcServerPort = data["ipcServerPort"];
                        const displayWindowId = data["displayWindowId"];
                        // window.open(`${currentSite}DisplayWindow.html?ipcServerPort=${ipcServerPort}&displayWindowId=${displayWindowId}`);
                        window.open(`${currentSite}DisplayWindow.html?displayWindowId=${displayWindowId}`);
                    });
            }
        }
    };

    // invoked in the regular display window
    // (1) obtain the widget that the right click occurs
    // (2) obtain the channel names in this widget
    // (3) tell main process to create a Probe browser window
    // (4) if the widgetKeys is empty, the returned channelNames is empty
    openPvTableWindow = (widgetKeys: string[] | null | undefined, inputChannelNames: string[] | undefined = undefined) => {

        let channelNames: string[] = [];
        if (inputChannelNames === undefined) {
            if (widgetKeys === null || widgetKeys === undefined) {
                for (let channelName of Object.keys(this.getTcaChannels())) {
                    channelNames.push(channelName);
                }
            } else {
                try {
                    // (1)
                    const widgetKey = widgetKeys[0];
                    if (widgetKey === undefined) {
                        const errMsg = `Input variable should be a string array`;
                        throw new Error(errMsg);
                    }
                    // (2)
                    const widget = this.getWidget2(widgetKey);
                    if (!(widget instanceof BaseWidget)) {
                        const errMsg = `We are probing a non-BaseWidget`;
                        throw new Error(errMsg);
                    }
                    channelNames = widget.getChannelNames();
                    const channelName = channelNames[0];
                    if (channelName !== undefined) {
                        // (3)
                        channelNames.push(channelName);
                    }
                } catch (e) {
                    Log.error(e);
                }
            }
        } else {
            channelNames = inputChannelNames;
        }

        if (this.getRoot().getDisplayWindowClient().getMainProcessMode() === "desktop" || this.getRoot().getDisplayWindowClient().getMainProcessMode() === "ssh-client") {
            this.getRoot()
                .getDisplayWindowClient()
                .getIpcManager()
                .sendFromRendererProcess("create-utility-display-window", "PvTable", { channelNames: [...new Set(channelNames)] });
        } else {
            const currentSite = `https://${window.location.host}/`;
            this.getRoot()
                .getDisplayWindowClient()
                .getIpcManager()
                .sendPostRequestCommand("create-utility-display-window", {
                    utilityType: "PvTable",
                    utilityOptions: { channelNames: [...new Set(channelNames)] },
                })
                .then((response: any) => {
                    // decode string
                    return response.json();
                })
                .then((data) => {
                    const ipcServerPort = data["ipcServerPort"];
                    const displayWindowId = data["displayWindowId"];
                    // window.open(`${currentSite}DisplayWindow.html?ipcServerPort=${ipcServerPort}&displayWindowId=${displayWindowId}`);
                    window.open(`${currentSite}DisplayWindow.html?displayWindowId=${displayWindowId}`);
                });
        }
    };

    // invoked in the regular display window
    // (1) obtain the widget that the right click occurs
    // (2) obtain the channel names in this widget
    // (3) tell main process to create a Probe browser window
    // (4) if the widgetKeys is empty, the returned channelNames is empty
    openDataViewerWindow = (widgetKeys: string[]) => {
        let channelNameArray: string[] = [];
        if (widgetKeys.length === 0) {
        } else {
            // (1)
            const widgetKey = widgetKeys[0];
            let widget = undefined;
            try {
                widget = this.getWidget2(widgetKey);
            } catch (e) {
                Log.error(e);
            }

            if (widget !== undefined && widget instanceof BaseWidget) {
                Log.debug("Create non-blank data viewer window");
                // (2)
                const channelNames = widget.getChannelNames();
                const channelName = channelNames[0];
                if (channelName !== undefined) {
                    // (3)
                    channelNameArray = [channelName];
                } else {
                }
            } else {
                // (4)
            }
        }

        if (this.getRoot().getDisplayWindowClient().getMainProcessMode() === "desktop" || this.getRoot().getDisplayWindowClient().getMainProcessMode() === "ssh-client") {
            this.getRoot()
                .getDisplayWindowClient()
                .getIpcManager()
                .sendFromRendererProcess("create-utility-display-window", "DataViewer", { channelNames: channelNameArray });
        } else {
            const currentSite = `https://${window.location.host}/`;
            this.getRoot()
                .getDisplayWindowClient()
                .getIpcManager()
                .sendPostRequestCommand("create-utility-display-window", {
                    utilityType: "DataViewer",
                    utilityOptions: { channelNames: channelNameArray },
                })
                .then((response: any) => {
                    // decode string
                    return response.json();
                })
                .then((data) => {
                    const ipcServerPort = data["ipcServerPort"];
                    const displayWindowId = data["displayWindowId"];
                    // window.open(`${currentSite}DisplayWindow.html?ipcServerPort=${ipcServerPort}&displayWindowId=${displayWindowId}`);
                    window.open(`${currentSite}DisplayWindow.html?displayWindowId=${displayWindowId}`);
                });
        }
    };


    // invoked in the regular display window
    // (1) obtain the widget that the right click occurs
    // (2) obtain the channel names in this widget
    // (3) tell main process to create a Probe browser window
    // (4) if the widgetKeys is empty, the returned channelNames is empty
    openTextEditorWindow = (options: {
        displayWindowId: string, // for showing the error message
        widgetKey: string,
        fileName: string, // practically the only info that we need, because we are going to open it in a new window
        manualOpen: boolean,  // do not show dialog
        openNewWindow: boolean, // open in new TextEditor window
        fileContents?: string,
    }) => {
        // in web mode, it reads the file on server, not the local computer
        if (this.getRoot().getDisplayWindowClient().getMainProcessMode() === "web") {
            const currentSite = `https://${window.location.host}/`;
            this.getRoot()
                .getDisplayWindowClient()
                .getIpcManager()
                .sendPostRequestCommand("create-utility-display-window", {
                    utilityType: "TextEditor",
                    utilityOptions: options,
                })
                .then((response: any) => {
                    // decode string
                    return response.json();
                })
                .then((data) => {
                    const ipcServerPort = data["ipcServerPort"];
                    const displayWindowId = data["displayWindowId"];
                    // window.open(`${currentSite}DisplayWindow.html?ipcServerPort=${ipcServerPort}&displayWindowId=${displayWindowId}`);
                    window.open(`${currentSite}DisplayWindow.html?displayWindowId=${displayWindowId}`);
                });
            return;
        } else if (this.getRoot().getDisplayWindowClient().getMainProcessMode() === "desktop" || this.getRoot().getDisplayWindowClient().getMainProcessMode() === "ssh-client") {
            this.getRoot()
                .getDisplayWindowClient()
                .getIpcManager()
                .sendFromRendererProcess("create-utility-display-window", "TextEditor", options);
        }
    };

    openTerminalWindow = () => {
        // this.getRoot().getDisplayWindowClient().getIpcManager().sendFromRendererProcess("create-utility-display-window", "Terminal", {});

        if (this.getRoot().getDisplayWindowClient().getMainProcessMode() === "desktop" || this.getRoot().getDisplayWindowClient().getMainProcessMode() === "ssh-client") {
            this.getRoot().getDisplayWindowClient().getIpcManager().sendFromRendererProcess("create-utility-display-window", "Terminal", {});
        } else {
            const currentSite = `https://${window.location.host}/`;
            this.getRoot()
                .getDisplayWindowClient()
                .getIpcManager()
                .sendPostRequestCommand("create-utility-display-window", {
                    utilityType: "Terminal",
                    utilityOptions: {},
                })
                .then((response: any) => {
                    // decode string
                    return response.json();
                })
                .then((data) => {
                    const ipcServerPort = data["ipcServerPort"];
                    const displayWindowId = data["displayWindowId"];
                    // window.open(`${currentSite}DisplayWindow.html?ipcServerPort=${ipcServerPort}&displayWindowId=${displayWindowId}`);
                    window.open(`${currentSite}DisplayWindow.html?displayWindowId=${displayWindowId}`);
                });
        }
    };

    /**
     * Try to get the channel name from widget. If the widget does not hold a channel, then use the provided channel name.
     */
    openChannelGraphWindow = (widgetKeys: string[] | undefined = undefined, channelName: string | undefined = undefined) => {
        if (channelName === undefined) {
            channelName = "";
        }

        let options = {};

        if (widgetKeys?.length === 0 || widgetKeys === undefined) {

        } else {
            const widgetKey = widgetKeys[0];
            let widget = undefined;
            try {
                widget = this.getWidget2(widgetKey);
            } catch (e) {
                Log.error(e);
            }
            if (widget !== undefined && widget instanceof BaseWidget) {
                const channelNames = widget.getChannelNames();
                channelName = channelNames[0];
            }
        }

        if (channelName !== "") {
            options = {
                channelNames: [channelName],
            }
        } else {
            options = {
                channelNames: [],
            }
        }


        if (this.getRoot().getDisplayWindowClient().getMainProcessMode() === "desktop" || this.getRoot().getDisplayWindowClient().getMainProcessMode() === "ssh-client") {
            this.getRoot().getDisplayWindowClient().getIpcManager().sendFromRendererProcess("create-utility-display-window", "ChannelGraph", options);
        } else {
            const currentSite = `https://${window.location.host}/`;
            this.getRoot()
                .getDisplayWindowClient()
                .getIpcManager()
                .sendPostRequestCommand("create-utility-display-window", {
                    utilityType: "ChannelGraph",
                    utilityOptions: options,
                })
                .then((response: any) => {
                    // decode string
                    return response.json();
                })
                .then((data) => {
                    const ipcServerPort = data["ipcServerPort"];
                    const displayWindowId = data["displayWindowId"];
                    // window.open(`${currentSite}DisplayWindow.html?ipcServerPort=${ipcServerPort}&displayWindowId=${displayWindowId}`);
                    window.open(`${currentSite}DisplayWindow.html?displayWindowId=${displayWindowId}`);
                });
        }

    };

    openCalculatorWindow = () => {
        // this.getRoot().getDisplayWindowClient().getIpcManager().sendFromRendererProcess("create-utility-display-window", "Calculator", {});
        if (this.getRoot().getDisplayWindowClient().getMainProcessMode() === "desktop" || this.getRoot().getDisplayWindowClient().getMainProcessMode() === "ssh-client") {
            this.getRoot().getDisplayWindowClient().getIpcManager().sendFromRendererProcess("create-utility-display-window", "Calculator", {});
        } else {
            const currentSite = `https://${window.location.host}/`;
            this.getRoot()
                .getDisplayWindowClient()
                .getIpcManager()
                .sendPostRequestCommand("create-utility-display-window", {
                    utilityType: "Calculator",
                    utilityOptions: {},
                })
                .then((response: any) => {
                    // decode string
                    return response.json();
                })
                .then((data) => {
                    const ipcServerPort = data["ipcServerPort"];
                    const displayWindowId = data["displayWindowId"];
                    // window.open(`${currentSite}DisplayWindow.html?ipcServerPort=${ipcServerPort}&displayWindowId=${displayWindowId}`);
                    window.open(`${currentSite}DisplayWindow.html?displayWindowId=${displayWindowId}`);
                });
        }
    };

    openHelpWindow = () => {
        // this.getRoot().getDisplayWindowClient().getIpcManager().sendFromRendererProcess("create-utility-display-window", "Calculator", {});
        if (this.getRoot().getDisplayWindowClient().getMainProcessMode() === "desktop" || this.getRoot().getDisplayWindowClient().getMainProcessMode() === "ssh-client") {
            this.getRoot().getDisplayWindowClient().getIpcManager().sendFromRendererProcess("create-utility-display-window", "Help", {});
        } else {
            const currentSite = `https://${window.location.host}/`;
            this.getRoot()
                .getDisplayWindowClient()
                .getIpcManager()
                .sendPostRequestCommand("create-utility-display-window", {
                    utilityType: "Help",
                    utilityOptions: {},
                })
                .then((response: any) => {
                    // decode string
                    return response.json();
                })
                .then((data) => {
                    const ipcServerPort = data["ipcServerPort"];
                    const displayWindowId = data["displayWindowId"];
                    // window.open(`${currentSite}DisplayWindow.html?ipcServerPort=${ipcServerPort}&displayWindowId=${displayWindowId}`);
                    window.open(`${currentSite}DisplayWindow.html?displayWindowId=${displayWindowId}`);
                });
        }
    };

    // ------------------------------- sidebar ---------------------------------

    /**
     * Set the widget key whose sidebar is shown. Invoked by GroupSelection2.calcAndSetSidebar().
     * Note: do not directly used to set the sidebar. Use GroupSelection2.calcAndSetSidebar() to set the sidebar.
     * @param {string} widgetKey
     * @param {boolean} doFlush
     */
    setSidebarWidgetKey = (widgetKey: string, doFlush: boolean): void => {
        this._sidebarWidgetKey = widgetKey;
        this.addToForceUpdateWidgets(widgetKey);
        if (doFlush) {
            g_flushWidgets();
        }
    };

    /**
     * Get the widget key whose sidebar is shown
     * @returns {string} The widget key of sidebar's main widget
     */
    getSidebarWidgetKey = (): string => {
        return this._sidebarWidgetKey;
    };

    // ----------------------- tdl ------------------------------

    // re-load this._tdlFileName for this display window
    // (1) destroy all channels, all its promises are rejected
    //     the listeners are all located in DisplayWindowClient, which is not affect by re-loading tdl file
    //     there is no setInterval()
    // (2) obtain meta data before removing all widgets
    // (3) remove all widgets hard, including Canvas and GroupSelection2, no flush to avoid white flash
    // (4) asks main process to read (not re-read per see) the tdl file, and send it
    //     mode, editable, external macros are all preserved
    loadTdlFile = () => {
        // (1)
        this.destroyAllTcaChannels();
        // (2)
        const windowId = this.getRoot().getDisplayWindowClient().getWindowId();
        const tdlFileName = this.getTdlFileName();
        const rendererWindowStatus = g_widgets1.isEditing() ? "editing" : "operating";
        const editable = this.getEditable();
        const externalMacros = JSON.parse(JSON.stringify(this.getRoot().getExternalMacros()));
        const externalReplaceMacros = this.getRoot().getUseExternalMacros();
        // (3)
        this.removeAllWidgetsHard(false);
        // (4)
        this.getRoot().getDisplayWindowClient().getIpcManager().sendFromRendererProcess("load-tdl-file", {
            displayWindowId: windowId,
            tdlFileName: tdlFileName,
            mode: rendererWindowStatus,
            editable: editable,
            externalMacros: externalMacros,
            replaceMacros: externalReplaceMacros,
        });
    };

    getTdlFileName = () => {
        return this.getRoot().getDisplayWindowClient().getTdlFileName();
    };

    // editable is stored in Root
    getEditable = () => {
        return this.getRoot().getEditable();
    };

    // external and internal macros are stored in Canvas
    // getExternalMacros = () => {
    // 	const canvas = this.getWidget2("Canvas") as Canvas;
    // 	return canvas.getExternalMacros();
    // };

    // whether to override the internal macros is stored in Canvas
    // getExternalReplaceMacros = () => {
    // 	const canvas = this.getWidget2("Canvas") as Canvas;
    // 	return canvas.getExternalReplaceMacros();
    // };

    duplicateDisplay = () => {
        const ipcManager = this.getRoot().getDisplayWindowClient().getIpcManager();

        if (this.getRoot().getDisplayWindowClient().getMainProcessMode() === "web") {
            const currentSite = `https://${window.location.host}/`;

            ipcManager
                .sendPostRequestCommand("duplicate-display", {
                    tdl: this.getRoot().getDisplayWindowClient().generateTdl(),
                    mode: this.isEditing() ? "editing" : "operating",
                    externalMacros: this.getRoot().getExternalMacros(),
                })
                .then((response: any) => {
                    // decode string
                    return response.json();
                })
                .then((data) => {
                    const ipcServerPort = data["ipcServerPort"];
                    const displayWindowId = data["displayWindowId"];
                    // window.open(`${currentSite}DisplayWindow.html?ipcServerPort=${ipcServerPort}&displayWindowId=${displayWindowId}`);
                    window.open(`${currentSite}DisplayWindow.html?displayWindowId=${displayWindowId}`);
                });
        } else {
            ipcManager.sendFromRendererProcess("duplicate-display", {
                tdl: this.getRoot().getDisplayWindowClient().generateTdl(),
                mode: this.isEditing() ? "editing" : "operating",
                externalMacros: this.getRoot().getExternalMacros(),
            });
        }
    };

    // ------------------------ IO -----------------------

    getReadWriteIos = (): ReadWriteIos => {
        return this._readWriteIos;
    };

    // -------------------- window title -----------------------

    // set this display window's title, invoked in Canvas
    //  (i) "new-tdl" event, DisplayWindowClient.handleNewTdl()
    //  (ii) right click: toggle window title
    // setWindowTitle = (newTitle: string) => {
    // 	this.getRoot().getDisplayWindowClient().getIpcManager().sendFromRendererProcess("set-window-title", this.getWindowId(), newTitle);
    // };

    // toggleWindowTitle = () => {
    // 	const tdlFileName = this.getRoot().getDisplayWindowClient().getTdlFileName();
    // 	const windowName = (this.getWidget2("Canvas") as Canvas).getWindowName();

    // 	if (this.getRoot().getDisplayWindowClient().getWindowTitleType() === "file-name") {
    // 		this.getRoot().getDisplayWindowClient().setWindowTitleType("window-name");
    // 		this.setWindowTitle(windowName);
    // 	} else {
    // 		this.getRoot().getDisplayWindowClient().setWindowTitleType("file-name");
    // 		this.setWindowTitle(tdlFileName);
    // 	}
    // };

    // ------------- group/copy/paste/cut/duplicate/remove selected widgets -----------

    // todo: under what condition we can group widgets
    groupSelectedWidgets = () => {
        const newGroupName = `group-${uuidv4()}`;
        const groupSelection2 = this.getWidget2("GroupSelection2") as GroupSelection2;
        for (let widget of [...groupSelection2.getWidgets().values()]) {
            if (widget instanceof BaseWidget) {
                widget.addToGroup(newGroupName);
            }
        }
        // no need to flush
    };

    // todo: under what condition we can ungroup widgets
    ungroupSelectedWidgets = () => {
        const groupSelection2 = this.getWidget2("GroupSelection2") as GroupSelection2;
        for (let widget of [...groupSelection2.getWidgets().values()]) {
            if (widget instanceof BaseWidget) {
                widget.removeFromGroup();
            }
        }
        // no need to flush
    };

    copySelectedWidgets = async () => {
        const result: Record<string, any>[] = [];
        for (let widgetKey of this.getSelectedWidgetKeys()) {
            const widget = this.getWidget2(widgetKey);
            if (widget instanceof BaseWidget) {
                const widgetTdl = widget.getTdlCopy(true);
                result.push(widgetTdl);
            }
        }
        try {
            await navigator.clipboard.writeText(JSON.stringify(result, null, 4));
        } catch (e) {
            console.log(e);
        }

    };

    // (1) copy selected widgets
    // (2) remove selected widgets and flush with GroupSelection2
    cutSelectedWidgets = (doFlush: boolean) => {
        // (1)
        this.copySelectedWidgets();
        // (2)
        this.addToForceUpdateWidgets("GroupSelection2");
        this.removeSelectedWidgets(true);
    };

    removeSelectedWidgets = (doFlush: boolean) => {
        const selectedWidgetKeys = this.getSelectedWidgetKeys();
        for (let widgetKey of selectedWidgetKeys) {
            this.removeWidget(widgetKey, true, false);
        }

        g_widgets1.updateSidebar(false);

        if (doFlush) {
            g_flushWidgets();
        }
    };

    // copy and paste, paste to (x+10, y+10)
    duplicateSelectedWidgets = (doFlush: boolean) => {
        this.copySelectedWidgets();
        this.pasteSelectedWidgets(false);
    };

    // (1) deselect all widgets
    // (2) read from clipboard
    // (3) calculate the selected widget's boundaries, it is an array of widgetTdls
    // (4) change key
    // (5) update each widget's coordinate according to the mouse position
    // (6) strip off the group
    // (7) create the widget without flush
    // (8) select the new widget, simple select
    // (9) calculate sidebar, flush widgets, together with GroupSelection2
    pasteSelectedWidgets = async (byMouse: boolean) => {
        // (1)
        this.deselectAllWidgets(false);
        // (2)
        try {
            const resultRaw = await navigator.clipboard.readText();
            // console.log()
            const result = JSON.parse(resultRaw);
            // (3)
            let xmin = 10000;
            let ymin = 10000;
            for (let widgetTdl of result) {
                xmin = Math.min(xmin, widgetTdl.style.left);
                ymin = Math.min(ymin, widgetTdl.style.top);
            }
            for (let widgetTdl of result) {
                // (4)
                const newWidgetKey = widgetTdl.type + "_" + GlobalMethods.generateNewWidgetKey();
                widgetTdl.key = newWidgetKey;
                widgetTdl.widgetKey = newWidgetKey;
                // (5)
                if (byMouse) {
                    widgetTdl.style.left = widgetTdl.style.left - xmin + this._contextMenuCursorPosition[0];
                    widgetTdl.style.top = widgetTdl.style.top - ymin + this._contextMenuCursorPosition[1];
                } else {
                    widgetTdl.style.top = widgetTdl.style.top + 10;
                    widgetTdl.style.left = widgetTdl.style.left + 10;
                }
                // (6)
                widgetTdl["groupNames"] = [];
                // (7)
                const widget = this.createWidget(widgetTdl, false);
                // (8)
                if (widget instanceof BaseWidget) {
                    widget.createSidebar();
                    widget.simpleSelect(false);
                }
            }
            // (9)
            this.addToForceUpdateWidgets("GroupSelection2");
            // (10)
            g_widgets1.updateSidebar(false);
            g_flushWidgets();
        } catch (e) {
            Log.error(e);
            try {
                const imageTypes = ["image/png", "image/jpg"];
                const clipboardItems = await navigator.clipboard.read();

                for (const clipboardItem of clipboardItems) {
                    for (const type of clipboardItem.types) {
                        const widgetTdl = this.initWidgetTdl("Media", 0, 0, 100, 100);

                        const blob = await clipboardItem.getType(type);
                        const dataType = blob.type;
                        if (imageTypes.includes(dataType)) {
                            const base64Prefix = `data:${dataType};base64,`;
                            widgetTdl["text"]["fileContents"] = `${base64Prefix}${GlobalMethods.arrayBufferToBase64(await blob.arrayBuffer())}`;
                            const widget = this.createWidget(widgetTdl, true);
                            if (widget instanceof BaseWidget) {
                                widget.createSidebar();
                            }
                        }
                    }
                }
            } catch (e) {
                Log.error(e);
            }
        }
    };

    copyDisplayContents = async () => {
        const result = this.getRoot().getDisplayWindowClient().generateTdl();
        try {
            await navigator.clipboard.writeText(JSON.stringify(result, null, 4));
        } catch (e) {
            console.log(e);
        }

    };

    copyWidgetChannelNames = async (widgetKeys: string[]) => {
        if (widgetKeys.length !== 1) {
            Log.error("Only one widgetKey allowed");
            return;
        }
        const widget = this.getWidget2(widgetKeys[0]);
        if (widget instanceof BaseWidget) {
            const channelNames = widget.getChannelNames();
            try {
                await navigator.clipboard.writeText(JSON.stringify(channelNames, null, 4));
            } catch (e) {
                console.log(e);
            }
        }
    };

    copyWidgetChannelValues = async (widgetKeys: string[]) => {
        if (widgetKeys.length !== 1) {
            Log.error("Only one widgetKey allowed");
            return;
        }
        const widget = this.getWidget2(widgetKeys[0]);
        if (widget instanceof BaseWidget) {
            const channelNames = widget.getChannelNames();
            const result: Record<string, type_dbrData | type_LocalChannel_data | { value: undefined }> = {};
            for (let channelName of channelNames) {
                try {
                    const tcaChannel = this.getTcaChannel(channelName);
                    result[channelName] = tcaChannel.getDbrData();
                } catch (e) {
                    result[channelName] = { value: undefined };
                }
            }
            try {
                await navigator.clipboard.writeText(JSON.stringify(result, null, 4));
            } catch (e) {
                console.log(e);
            }
        }
    };

    copyAllChannelValues = async () => {
        const result: Record<string, type_dbrData | type_LocalChannel_data> = {};
        for (let channelName of Object.keys(this.getTcaChannels())) {
            try {
                const tcaChannel = this.getTcaChannel(channelName);
                result[channelName] = tcaChannel.getDbrData();
            } catch (e) {
                result[channelName] = { value: undefined };
            }
        }
        try {
            await navigator.clipboard.writeText(JSON.stringify(result, null, 4));
        } catch (e) {
            console.log(e);
        }
    };

    copyAllChannelNames = async () => {
        try {
            await navigator.clipboard.writeText(JSON.stringify(Object.keys(this.getTcaChannels()), null, 4));
        } catch (e) {
            console.log(e);
        }
    };

    // ----------------- arrange selected widgets --------------------

    /**
     *
     */
    distributeSelectedWidgets = (direction: "left" | "center" | "right" | "top" | "middle" | "bottom", doFlush: boolean) => {
        const group = this.getWidget2("GroupSelection2") as GroupSelection2;
        let centerMin = 10000;
        let centerMax = -10000;
        let leftMin = 10000;
        let leftMax = -10000;
        let rightMin = 10000;
        let rightMax = -10000;
        let topMin = 10000;
        let topMax = -10000;
        let middleMin = 10000;
        let middleMax = -10000;
        let bottomMin = 10000;
        let bottomMax = -10000;

        let count = 0;

        for (const widget of [...group.getWidgets().values()]) {
            const left = widget.getStyle()["left"];
            const top = widget.getStyle()["top"];
            const right = widget.getStyle()["left"] + widget.getStyle()["width"];
            const bottom = widget.getStyle()["top"] + widget.getStyle()["height"];
            const center = (left + right) / 2;
            const middle = (top + bottom) / 2;
            leftMin = Math.min(leftMin, left);
            leftMax = Math.max(leftMax, left);
            centerMin = Math.min(centerMin, center);
            centerMax = Math.max(centerMax, center);
            rightMin = Math.min(rightMin, right);
            rightMax = Math.max(rightMax, right);
            topMin = Math.min(topMin, top);
            topMax = Math.max(topMax, top);
            middleMin = Math.min(middleMin, middle);
            middleMax = Math.max(middleMax, middle);
            bottomMin = Math.min(bottomMin, bottom);
            bottomMax = Math.max(bottomMax, bottom);
            count++;
        }

        if (count < 3) {
            Log.debug("Less than 3 widgets selected, no need to distribute.");
            return;
        }

        const dLeft = (leftMax - leftMin) / (count - 1);
        const dCenter = (centerMax - centerMin) / (count - 1);
        const dRight = (rightMax - rightMin) / (count - 1);
        const dTop = (topMax - topMin) / (count - 1);
        const dMiddle = (middleMax - middleMin) / (count - 1);
        const dBottom = (bottomMax - bottomMin) / (count - 1);

        if (direction === "left") {
            const sortedWidgets = [...group.getWidgets().values()].sort((a: BaseWidget, b: BaseWidget) => {
                const leftA = a.getStyle()["left"];
                const leftB = b.getStyle()["left"];
                return leftA - leftB;
            });
            for (let ii = 0; ii < sortedWidgets.length; ii++) {
                const widget = sortedWidgets[ii];
                widget.getStyle()["left"] = leftMin + dLeft * ii;
                this.addToForceUpdateWidgets(widget.getWidgetKey());
            }
        } else if (direction === "center") {
            const sortedWidgets = [...group.getWidgets().values()].sort((a: BaseWidget, b: BaseWidget) => {
                const centerA = a.getStyle()["left"] + a.getStyle()["width"] / 2;
                const centerB = b.getStyle()["left"] + b.getStyle()["width"] / 2;
                return centerA - centerB;
            });
            for (let ii = 0; ii < sortedWidgets.length; ii++) {
                const widget = sortedWidgets[ii];
                widget.getStyle()["left"] = centerMin + dCenter * ii - widget.getStyle()["width"] / 2;
                this.addToForceUpdateWidgets(widget.getWidgetKey());
            }
        } else if (direction === "right") {
            const sortedWidgets = [...group.getWidgets().values()].sort((a: BaseWidget, b: BaseWidget) => {
                const rightA = a.getStyle()["left"] + a.getStyle()["width"];
                const rightB = b.getStyle()["left"] + b.getStyle()["width"];
                return rightA - rightB;
            });
            for (let ii = 0; ii < sortedWidgets.length; ii++) {
                const widget = sortedWidgets[ii];
                widget.getStyle()["left"] = rightMin + dRight * ii - widget.getStyle()["width"];
                this.addToForceUpdateWidgets(widget.getWidgetKey());
            }
        } else if (direction === "top") {
            const sortedWidgets = [...group.getWidgets().values()].sort((a: BaseWidget, b: BaseWidget) => {
                const topA = a.getStyle()["top"];
                const topB = b.getStyle()["top"];
                return topA - topB;
            });
            for (let ii = 0; ii < sortedWidgets.length; ii++) {
                const widget = sortedWidgets[ii];
                widget.getStyle()["top"] = topMin + dTop * ii;
                this.addToForceUpdateWidgets(widget.getWidgetKey());
            }
        } else if (direction === "middle") {
            const sortedWidgets = [...group.getWidgets().values()].sort((a: BaseWidget, b: BaseWidget) => {
                const middleA = a.getStyle()["top"] + a.getStyle()["height"] / 2;
                const middleB = b.getStyle()["top"] + b.getStyle()["height"] / 2;
                return middleA - middleB;
            });
            for (let ii = 0; ii < sortedWidgets.length; ii++) {
                const widget = sortedWidgets[ii];
                widget.getStyle()["top"] = middleMin + dMiddle * ii - widget.getStyle()["height"] / 2;
                this.addToForceUpdateWidgets(widget.getWidgetKey());
            }
        } else if (direction === "bottom") {
            const sortedWidgets = [...group.getWidgets().values()].sort((a: BaseWidget, b: BaseWidget) => {
                const bottomA = a.getStyle()["top"] + a.getStyle()["height"];
                const bottomB = b.getStyle()["top"] + b.getStyle()["height"];
                return bottomA - bottomB;
            });
            for (let ii = 0; ii < sortedWidgets.length; ii++) {
                const widget = sortedWidgets[ii];
                widget.getStyle()["top"] = bottomMin + dBottom * ii - widget.getStyle()["height"];
                this.addToForceUpdateWidgets(widget.getWidgetKey());
            }
        }

        const history = this.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        group.calcAndSetSidebar(false);
        this.addToForceUpdateWidgets("GroupSelection2");
        if (doFlush) {
            g_flushWidgets();
        }
    };

    alignSelectedWidgets = (direction: "left" | "center" | "right" | "top" | "middle" | "bottom", doFlush: boolean) => {
        const group = this.getWidget2("GroupSelection2") as GroupSelection2;
        let left0 = 10000;
        let top0 = 10000;
        let right0 = -10000;
        let bottom0 = -10000;
        let center0 = 0;
        let middle0 = 0;

        let count = 0;
        // find dimensions
        for (const widget of [...group.getWidgets().values()]) {
            if (widget instanceof BaseWidget) {
                const left = widget.getStyle()["left"];
                const top = widget.getStyle()["top"];
                const right = widget.getStyle()["left"] + widget.getStyle()["width"];
                const bottom = widget.getStyle()["top"] + widget.getStyle()["height"];
                const center = (left + right) / 2;
                const middle = (top + bottom) / 2;
                left0 = Math.min(left0, left);
                top0 = Math.min(top0, top);
                right0 = Math.max(right0, right);
                bottom0 = Math.max(bottom0, bottom);
                center0 = center0 + center;
                middle0 = middle0 + middle;
                count++;
            }
        }

        if (count < 2) {
            Log.debug("Less than 2 widgets selected, no need to align.");
            return;
        }

        center0 = center0 / count;
        middle0 = middle0 / count;
        for (const widget of [...group.getWidgets().values()]) {
            if (widget instanceof BaseWidget) {
                if (direction === "left") {
                    widget.getStyle()["left"] = left0;
                } else if (direction === "center") {
                    widget.getStyle()["left"] = center0 - widget.getStyle()["width"] / 2;
                } else if (direction === "right") {
                    widget.getStyle()["left"] = right0 - widget.getStyle()["width"];
                } else if (direction === "top") {
                    widget.getStyle()["top"] = top0;
                } else if (direction === "middle") {
                    widget.getStyle()["top"] = middle0 - widget.getStyle()["height"] / 2;
                } else if (direction === "bottom") {
                    widget.getStyle()["top"] = bottom0 - widget.getStyle()["height"];
                }
            }
            this.addToForceUpdateWidgets(widget.getWidgetKey());
        }
        const history = this.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        group.calcAndSetSidebar(false);
        this.addToForceUpdateWidgets("GroupSelection2");
        if (doFlush) {
            g_flushWidgets();
        }
    };

    matchWidgetsSize = (direction: "width" | "height", doFlush: boolean) => {
        const group = this.getWidget2("GroupSelection2") as GroupSelection2;

        let width0 = 0;
        let height0 = 0;

        let count = 0;
        for (const widget of [...group.getWidgets().values()]) {
            if (widget instanceof BaseWidget) {
                width0 = width0 + widget.getStyle()["width"];
                height0 = height0 + widget.getStyle()["height"];
                count++;
            }
        }

        if (count < 2) {
            Log.debug("Less than 3 widgets selected, no need to align.");
            return;
        }

        const canvas = g_widgets1.getWidget2("Canvas") as Canvas;
        const xGridSize = canvas.getXGridSize();
        const yGridSize = canvas.getYGridSize();
        width0 = Math.round(width0 / count / xGridSize) * xGridSize;
        height0 = Math.round(height0 / count / yGridSize) * yGridSize;

        for (const widget of [...group.getWidgets().values()]) {
            if (widget instanceof BaseWidget) {
                if (direction === "width") {
                    widget.getStyle()["width"] = width0;
                } else if (direction === "height") {
                    widget.getStyle()["height"] = height0;
                }
            }
            this.addToForceUpdateWidgets(widget.getWidgetKey());
        }
        const history = this.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        group.calcAndSetSidebar(false);
        this.addToForceUpdateWidgets("GroupSelection2");
        if (doFlush) {
            g_flushWidgets();
        }
    };

    // ----------------------- getters ---------------------------

    // getWindowId = () => {
    // 	return this._windowId;
    // };
    getRoot = () => {
        return this._root;
    };

    getSidebarWidgetsList = () => {
        return this._sidebarWidgetsList;
    }

    // -----------------------------------------------------------
    // undo/redo

    // private _histories: EditorHistories = new EditorHistories();

    // getHistories = (): EditorHistories => {
    // 	return this._histories;
    // };

    // addToHistories = (widgetKeys: string[], indices: number[]) => {
    // 	this._histories.add(widgetKeys);
    // };

    // undo = () => {
    // 	this._histories.undo();
    // };

    // redo = () => {
    // 	this._histories.redo();
    // };

    getChannelNamePeekDivId = () => {
        return this._channelNamePeekDivId;
    };
    setChannelNamePeekDivId = (newId: string) => {
        this._channelNamePeekDivId = newId;
    };
    removeChannelNamePeekDiv = () => {
        const channelNamePeekDivId = this.getChannelNamePeekDivId();
        const channelNamePeekDiv = document.getElementById(channelNamePeekDivId);
        channelNamePeekDiv?.remove();
        this.setChannelNamePeekDivId("");

    }

    // same as the DisplayWindowClient mouse down event
    createChannelNamePeekDiv = async (x: number, y: number, channelName: string | string[]) => {
        const id = `channel-name-peek-div`;
        const left = x;
        const top = y;

        // remove the peek div if there is a residual one
        const oldChannelNamePeekDiv = document.getElementById(id);
        oldChannelNamePeekDiv?.remove();

        // define the Div
        if (channelName !== undefined) {
            const channelNamePeekDiv = document.createElement("div");
            if (Array.isArray(channelName)) {
                let str = "";
                for (let element of channelName) {
                    if (element.trim() !== "") {
                        str = str + element.trim() + "\n";
                    }
                }
                if (str.endsWith("\n")) {
                    str = str.slice(0, -1);
                }
                channelNamePeekDiv.innerText = `${str}`;
            } else {
                channelNamePeekDiv.innerText = `${channelName}`;
            }
            channelNamePeekDiv.setAttribute("id", id);
            g_widgets1.setChannelNamePeekDivId(id);
            channelNamePeekDiv.style.position = `absolute`;
            let width = channelNamePeekDiv.offsetWidth;
            let height = channelNamePeekDiv.offsetHeight;
            channelNamePeekDiv.style.fontFamily = `Courier Prime`;
            channelNamePeekDiv.style.padding = `3px`;
            channelNamePeekDiv.style.borderRadius = `2px`;
            channelNamePeekDiv.style.left = `${Math.max(left - width / 2, 0)}px`;
            channelNamePeekDiv.style.top = `${Math.max(top - height, 0)}px`;
            channelNamePeekDiv.style.color = `yellow`;
            // channelNamePeekDiv.style.outlineColor = `yellow`;
            channelNamePeekDiv.style.border = `solid 1px rgba(150, 150, 150, 1)`;
            channelNamePeekDiv.style.outline = `solid 0.5px black`;

            channelNamePeekDiv.style.backgroundColor = `rgba(50,50,50,1)`;
            channelNamePeekDiv.style.userSelect = `none`;
            document.body.appendChild(channelNamePeekDiv);
            width = channelNamePeekDiv.offsetWidth;
            height = channelNamePeekDiv.offsetHeight;
            channelNamePeekDiv.style.left = `${Math.max(left - width / 2, 0)}px`;
            channelNamePeekDiv.style.top = `${Math.max(top - height, 0)}px`;
            // copy channel name to clipboard
            try {
                await navigator.clipboard.writeText(`${channelName}`);
            } catch (e) {
                console.log(e);
            }
        }
    }
}
