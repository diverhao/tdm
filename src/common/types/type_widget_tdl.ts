import { getTypeCheckError } from "../GlobalMethods";
import { GlobalVariables } from "../GlobalVariables";
import { TypeSchema, InferType, Mutable } from "./type_schema";

// Re-export schema infra so existing consumers don't break
export { TypeSchema, FieldType, PrimitiveFieldType, ArrayOfSchema, ArrayOfUnionSchema, TupleSchema, ArrayOfTupleSchema, LiteralUnionSchema, DictionaryOfSchema, InferType, Mutable } from "./type_schema";

export type type_utilityWindowType =
    "Probe" | "PvTable" | "DataViewer" | "ProfilesViewer" | "LogViewer" | "TdlViewer" | "TextEditor" |
    "Terminal" | "Calculator" | "ChannelGraph" | "CaSnooper" | "Casw" | "PvMonitor" | "Help" |
    "FileConverter" | "Talhk" | "FileBrowser" | "SeqGraph";

// ======================== Widget Style Schema ========================

export const type_style_tdl_schema = {
    position: "string",
    display: "string",
    left: "number",
    top: "number",
    width: "number",
    height: "number",
    backgroundColor: "string",
    transform: "string",
    borderStyle: "string",
    borderWidth: "number",
    borderColor: "string",
    color: "string",
    fontFamily: "string",
    fontSize: "number",
    fontStyle: "string",
    fontWeight: "string",
    outlineStyle: "string",
    outlineWidth: "number",
    outlineColor: "string",
    boxSizing: "string",
} as const satisfies TypeSchema;

export type type_style_tdl = Mutable<InferType<typeof type_style_tdl_schema>>;

// ======================== Widget Rule Schema ========================

export const type_rule_tdl_schema = {
    boolExpression: "string",
    propertyName: "string",
    propertyValue: ["string", "undefined"],
    id: "string",
} as const satisfies TypeSchema;

export type type_rule_tdl = InferType<typeof type_rule_tdl_schema>;

export const type_rules_tdl_schema = { arrayOf: type_rule_tdl_schema } as const;
export type type_rules_tdl = InferType<typeof type_rules_tdl_schema>;

// ======================== Macro Schema ========================

export const type_macro_tdl_schema = { tuple: ["string", "string"] } as const;
export type type_macro_tdl = [string, string];

export const type_macros_tdl_schema = { arrayOfTuple: ["string", "string"] } as const;
export type type_macros_tdl = type_macro_tdl[];

// ======================== Scale Schema ========================

export const type_scale_tdl_schema = { literalUnion: ["Linear", "Log10"] } as const;
export type type_scale_tdl = typeof type_scale_tdl_schema["literalUnion"][number];

// ======================== Label TDL Schema ========================

export const type_Label_text_tdl_schema = {
    text: "string",
    horizontalAlign: "string",
    verticalAlign: "string",
    wrapWord: "boolean",
    invisibleInOperation: "boolean",
    alarmBorder: "boolean",
    alarmBackground: "boolean",
    alarmText: "boolean",
    alarmLevel: "string",
} as const satisfies TypeSchema;

export const type_Label_tdl_schema = {
    type: "string",
    widgetKey: "string",
    key: "string",
    style: type_style_tdl_schema,
    text: type_Label_text_tdl_schema,
    channelNames: "string[]",
    groupNames: "string[]",
    rules: { arrayOf: type_rule_tdl_schema },
} as const satisfies TypeSchema;

export type type_Label_text_tdl = Mutable<InferType<typeof type_Label_text_tdl_schema>>;
export type type_Label_tdl = Mutable<InferType<typeof type_Label_tdl_schema>>;

export const defaultLabelTdl: type_Label_tdl = {
    type: "Label",
    widgetKey: "",
    key: "",
    style: {
        position: "absolute",
        display: "inline-flex",
        left: 100,
        top: 100,
        width: 100,
        height: 100,
        backgroundColor: "rgba(255,255,255,0)",
        transform: "rotate(0deg)",
        borderStyle: "solid",
        borderWidth: 0,
        borderColor: "rgba(0, 0, 0, 1)",
        color: "rgba(0,0,0,1)",
        fontFamily: GlobalVariables.defaultFontFamily,
        fontSize: GlobalVariables.defaultFontSize,
        fontStyle: GlobalVariables.defaultFontStyle,
        fontWeight: GlobalVariables.defaultFontWeight,
        outlineStyle: "none",
        outlineWidth: 1,
        outlineColor: "black",
        boxSizing: "content-box",
    },
    text: {
        text: "Label text",
        horizontalAlign: "flex-start",
        verticalAlign: "flex-start",
        wrapWord: false,
        invisibleInOperation: false,
        alarmBorder: false,
        alarmBackground: false,
        alarmText: false,
        alarmLevel: "MINOR",
    },
    channelNames: [],
    groupNames: [],
    rules: [],
};

// ======================== EmbeddedDisplay TDL Schema ========================

export const type_EmbeddedDisplay_text_tdl_schema = {
    horizontalAlign: "string",
    verticalAlign: "string",
    wrapWord: "boolean",
    showUnit: "boolean",
    alarmBorder: "boolean",
    useParentMacros: "boolean",
    useExternalMacros: "boolean",
    tabPosition: "string",
    tabWidth: "number",
    tabHeight: "number",
    tabSelectedColor: "string",
    tabDefaultColor: "string",
    showTab: "boolean",
    isWebpage: "boolean",
    resize: "string",
} as const satisfies TypeSchema;

export const type_EmbeddedDisplay_display_tdl_schema = {
    tdlFileName: "string",
    name: "string",
    macros: type_macros_tdl_schema,
    isWebpage: "boolean",
} as const satisfies TypeSchema;

export const type_EmbeddedDisplay_tdl_schema = {
    type: "string",
    widgetKey: "string",
    key: "string",
    style: type_style_tdl_schema,
    text: type_EmbeddedDisplay_text_tdl_schema,
    channelNames: "string[]",
    groupNames: "string[]",
    rules: { arrayOf: type_rule_tdl_schema },
    displays: { arrayOf: type_EmbeddedDisplay_display_tdl_schema },
} as const satisfies TypeSchema;

export type type_EmbeddedDisplay_text_tdl = Mutable<InferType<typeof type_EmbeddedDisplay_text_tdl_schema>>;
export type type_EmbeddedDisplay_display_tdl = Omit<Mutable<InferType<typeof type_EmbeddedDisplay_display_tdl_schema>>, "macros"> & {
    macros: type_macros_tdl;
};
export type type_EmbeddedDisplay_tdl = Omit<Mutable<InferType<typeof type_EmbeddedDisplay_tdl_schema>>, "displays"> & {
    displays: type_EmbeddedDisplay_display_tdl[];
};

export const defaultEmbeddedDisplayTdl: type_EmbeddedDisplay_tdl = {
    type: "EmbeddedDisplay",
    widgetKey: "",
    key: "",
    style: {
        position: "absolute",
        display: "inline-flex",
        left: 100,
        top: 100,
        width: 150,
        height: 80,
        backgroundColor: "rgba(240, 240, 240, 1)",
        transform: "rotate(0deg)",
        borderStyle: "solid",
        borderWidth: 0,
        borderColor: "rgba(180, 180, 180, 1)",
        color: "rgba(0,0,0,1)",
        fontFamily: GlobalVariables.defaultFontFamily,
        fontSize: GlobalVariables.defaultFontSize,
        fontStyle: GlobalVariables.defaultFontStyle,
        fontWeight: GlobalVariables.defaultFontWeight,
        outlineStyle: "none",
        outlineWidth: 1,
        outlineColor: "black",
        boxSizing: "content-box",
    },
    text: {
        horizontalAlign: "flex-start",
        verticalAlign: "flex-start",
        wrapWord: true,
        showUnit: false,
        alarmBorder: false,
        useParentMacros: false,
        useExternalMacros: false,
        tabPosition: "top",
        tabWidth: 100,
        tabHeight: 20,
        tabSelectedColor: "rgba(180,180,180,1)",
        tabDefaultColor: "rgba(220,220,220,1)",
        showTab: true,
        isWebpage: false,
        resize: "none",
    },
    channelNames: [],
    groupNames: [],
    rules: [],
    displays: [],
};

// ======================== Group TDL Schema ========================

export const type_Group_style_tdl_schema = {
    position: "string",
    display: "string",
    left: "number",
    top: "number",
    width: "number",
    height: "number",
    backgroundColor: "string",
    transform: "string",
    borderStyle: "string",
    borderWidth: "number",
    borderColor: "string",
    color: "string",
    fontFamily: "string",
    fontSize: "number",
    fontStyle: "string",
    fontWeight: "string",
    outlineStyle: "string",
    outlineWidth: "number",
    outlineColor: "string",
    boxSizing: ["string", "undefined"],
} as const satisfies TypeSchema;

export const type_Group_text_tdl_schema = {
    horizontalAlign: "string",
    verticalAlign: "string",
    wrapWord: "boolean",
    showUnit: "boolean",
    alarmBorder: "boolean",
    selectedGroup: "number",
    tabPosition: "string",
    tabWidth: "number",
    tabHeight: "number",
    tabSelectedColor: "string",
    tabDefaultColor: "string",
    showTab: "boolean",
    showBox: "boolean",
} as const satisfies TypeSchema;

export const type_Group_item_tdl_schema = {
    name: "string",
    backgroundColor: "string",
    widgetKeys: "string[]",
} as const satisfies TypeSchema;

export const type_Group_tdl_schema = {
    type: "string",
    widgetKey: "string",
    key: "string",
    style: type_Group_style_tdl_schema,
    text: type_Group_text_tdl_schema,
    channelNames: "string[]",
    groupNames: "string[]",
    rules: { arrayOf: type_rule_tdl_schema },
    items: { arrayOf: type_Group_item_tdl_schema },
} as const satisfies TypeSchema;

export type type_Group_style_tdl = Mutable<InferType<typeof type_Group_style_tdl_schema>>;
export type type_Group_text_tdl = Mutable<InferType<typeof type_Group_text_tdl_schema>>;
export type type_Group_item_tdl = Mutable<InferType<typeof type_Group_item_tdl_schema>>;
export type type_Group_tdl = Omit<Mutable<InferType<typeof type_Group_tdl_schema>>, "items"> & {
    items: type_Group_item_tdl[];
};

export const defaultGroupTdl: type_Group_tdl = {
    type: "Group",
    widgetKey: "",
    key: "",
    style: {
        position: "absolute",
        display: "inline-flex",
        backgroundColor: "rgba(240, 240, 240, 0)",
        left: 100,
        top: 100,
        width: 150,
        height: 80,
        outlineStyle: "none",
        outlineWidth: 1,
        outlineColor: "black",
        transform: "rotate(0deg)",
        color: "rgba(0,0,0,1)",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "rgba(0, 0, 0, 1)",
        fontFamily: GlobalVariables.defaultFontFamily,
        fontSize: GlobalVariables.defaultFontSize,
        fontStyle: GlobalVariables.defaultFontStyle,
        fontWeight: GlobalVariables.defaultFontWeight,
        boxSizing: undefined,
    },
    text: {
        horizontalAlign: "flex-start",
        verticalAlign: "flex-start",
        wrapWord: true,
        showUnit: false,
        alarmBorder: true,
        selectedGroup: 0,
        tabPosition: "top",
        tabWidth: 100,
        tabHeight: 20,
        tabSelectedColor: "rgba(180,180,180,1)",
        tabDefaultColor: "rgba(220,220,220,1)",
        showTab: true,
        showBox: false,
    },
    channelNames: [],
    groupNames: [],
    rules: [],
    items: [{
        name: "Group-1",
        backgroundColor: "rgba(255,255,255,1)",
        widgetKeys: [],
    }],
};

// ======================== Repeater TDL Schema ========================

export const type_Repeater_style_tdl_schema = {
    position: "string",
    display: "string",
    left: "number",
    top: "number",
    width: "number",
    height: "number",
    backgroundColor: "string",
    transform: "string",
    borderStyle: "string",
    borderWidth: "number",
    borderColor: "string",
    color: "string",
    fontFamily: "string",
    fontSize: "number",
    fontStyle: "string",
    fontWeight: "string",
    outlineStyle: "string",
    outlineWidth: "number",
    outlineColor: "string",
    boxSizing: ["string", "undefined"],
} as const satisfies TypeSchema;

export const type_Repeater_text_tdl_schema = {
    horizontalAlign: "string",
    verticalAlign: "string",
    wrapWord: "boolean",
    showUnit: "boolean",
    alarmBorder: "boolean",
    selectedGroup: "number",
    tabPosition: "string",
    tabWidth: "number",
    tabHeight: "number",
    tabSelectedColor: "string",
    tabDefaultColor: "string",
    showTab: "boolean",
    gap: "number",
    useParentMacros: ["boolean", "undefined"],
} as const satisfies TypeSchema;

export const type_Repeater_widget_tdl_schema = {
    widgetKey: "string",
    macro: type_macros_tdl_schema,
} as const satisfies TypeSchema;

export const type_Repeater_tdl_schema = {
    type: "string",
    widgetKey: "string",
    key: "string",
    style: type_Repeater_style_tdl_schema,
    text: type_Repeater_text_tdl_schema,
    channelNames: "string[]",
    groupNames: "string[]",
    rules: { arrayOf: type_rule_tdl_schema },
    widgets: { arrayOf: type_Repeater_widget_tdl_schema },
} as const satisfies TypeSchema;

export type type_Repeater_style_tdl = Mutable<InferType<typeof type_Repeater_style_tdl_schema>>;
export type type_Repeater_text_tdl = Mutable<InferType<typeof type_Repeater_text_tdl_schema>>;
export type type_Repeater_widget = Omit<Mutable<InferType<typeof type_Repeater_widget_tdl_schema>>, "macro"> & {
    macro: type_macros_tdl;
};
export type type_Repeater_tdl = Omit<Mutable<InferType<typeof type_Repeater_tdl_schema>>, "widgets"> & {
    widgets: type_Repeater_widget[];
};

export const defaultRepeaterTdl: type_Repeater_tdl = {
    type: "Repeater",
    widgetKey: "",
    key: "",
    style: {
        position: "absolute",
        display: "inline-flex",
        backgroundColor: "rgba(240, 240, 240, 0)",
        left: 100,
        top: 100,
        width: 150,
        height: 80,
        outlineStyle: "none",
        outlineWidth: 1,
        outlineColor: "black",
        transform: "rotate(0deg)",
        color: "rgba(0,0,0,1)",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "rgba(0, 0, 0, 1)",
        fontFamily: GlobalVariables.defaultFontFamily,
        fontSize: GlobalVariables.defaultFontSize,
        fontStyle: GlobalVariables.defaultFontStyle,
        fontWeight: GlobalVariables.defaultFontWeight,
        boxSizing: undefined,
    },
    text: {
        horizontalAlign: "flex-start",
        verticalAlign: "flex-start",
        wrapWord: true,
        showUnit: false,
        alarmBorder: true,
        selectedGroup: 0,
        tabPosition: "top",
        tabWidth: 100,
        tabHeight: 20,
        tabSelectedColor: "rgba(180,180,180,1)",
        tabDefaultColor: "rgba(220,220,220,1)",
        showTab: true,
        gap: 5,
        useParentMacros: undefined,
    },
    channelNames: [],
    groupNames: [],
    rules: [],
    widgets: [],
};

// ======================== Polyline TDL Schema ========================

export const type_Polyline_text_tdl_schema = {
    lineWidth: "number",
    lineStyle: "string",
    lineColor: "string",
    arrowLength: "number",
    arrowWidth: "number",
    showArrowHead: "boolean",
    showArrowTail: "boolean",
    smootherize: "boolean",
    fill: "boolean",
    closed: "boolean",
    fillColor: "string",
    invisibleInOperation: "boolean",
    alarmBorder: "boolean",
    alarmFill: "boolean",
    alarmBackground: "boolean",
    alarmText: "boolean",
    alarmLevel: "string",
} as const satisfies TypeSchema;

export const type_Polyline_tdl_schema = {
    type: "string",
    widgetKey: "string",
    key: "string",
    style: type_style_tdl_schema,
    text: type_Polyline_text_tdl_schema,
    channelNames: "string[]",
    groupNames: "string[]",
    rules: { arrayOf: type_rule_tdl_schema },
    pointsX: "number[]",
    pointsY: "number[]",
} as const satisfies TypeSchema;

export type type_Polyline_text_tdl = Mutable<InferType<typeof type_Polyline_text_tdl_schema>>;
export type type_Polyline_tdl = Mutable<InferType<typeof type_Polyline_tdl_schema>>;

export const defaultPolylineTdl: type_Polyline_tdl = {
    type: "Polyline",
    widgetKey: "",
    key: "",
    style: {
        position: "absolute",
        display: "inline-flex",
        left: 0,
        top: 0,
        width: 100,
        height: 100,
        backgroundColor: "rgba(0,0,0,0)",
        transform: "rotate(0deg)",
        borderStyle: "solid",
        borderWidth: 0,
        borderColor: "rgba(0, 0, 0, 1)",
        color: "rgba(0,0,255,1)",
        fontFamily: GlobalVariables.defaultFontFamily,
        fontSize: GlobalVariables.defaultFontSize,
        fontStyle: GlobalVariables.defaultFontStyle,
        fontWeight: GlobalVariables.defaultFontWeight,
        outlineStyle: "none",
        outlineWidth: 1,
        outlineColor: "black",
        boxSizing: "content-box",
    },
    text: {
        lineWidth: 3,
        lineStyle: "solid",
        lineColor: "rgba(0,0,255,1)",
        arrowLength: 6,
        arrowWidth: 3,
        showArrowHead: false,
        showArrowTail: false,
        smootherize: false,
        fill: false,
        closed: false,
        fillColor: "rgba(50,50,255,1)",
        invisibleInOperation: false,
        alarmBorder: false,
        alarmFill: false,
        alarmBackground: false,
        alarmText: false,
        alarmLevel: "MINOR",
    },
    channelNames: [],
    groupNames: [],
    rules: [],
    pointsX: [],
    pointsY: [],
};

// ======================== Rectangle TDL Schema ========================

export const type_Rectangle_text_tdl_schema = {
    lineWidth: "number",
    lineColor: "string",
    lineStyle: "string",
    fillColor: "string",
    fill: "boolean",
    cornerWidth: "number",
    cornerHeight: "number",
    invisibleInOperation: "boolean",
    alarmBorder: "boolean",
    alarmShape: "boolean",
    alarmFill: "boolean",
    alarmBackground: "boolean",
    alarmLevel: "string",
} as const satisfies TypeSchema;

export const type_Rectangle_tdl_schema = {
    type: "string",
    widgetKey: "string",
    key: "string",
    style: type_style_tdl_schema,
    text: type_Rectangle_text_tdl_schema,
    channelNames: "string[]",
    groupNames: "string[]",
    rules: { arrayOf: type_rule_tdl_schema },
} as const satisfies TypeSchema;

export type type_Rectangle_text_tdl = Mutable<InferType<typeof type_Rectangle_text_tdl_schema>>;
export type type_Rectangle_tdl = Mutable<InferType<typeof type_Rectangle_tdl_schema>>;

export const defaultRectangleTdl: type_Rectangle_tdl = {
    type: "Rectangle",
    widgetKey: "",
    key: "",
    style: {
        position: "absolute",
        display: "inline-flex",
        left: 100,
        top: 100,
        width: 100,
        height: 100,
        backgroundColor: "rgba(0, 0, 0, 0)",
        transform: "rotate(0deg)",
        borderStyle: "solid",
        borderWidth: 0,
        borderColor: "rgba(0, 0, 0, 1)",
        color: "rgba(0,0,0,1)",
        fontFamily: GlobalVariables.defaultFontFamily,
        fontSize: GlobalVariables.defaultFontSize,
        fontStyle: GlobalVariables.defaultFontStyle,
        fontWeight: GlobalVariables.defaultFontWeight,
        outlineStyle: "none",
        outlineWidth: 1,
        outlineColor: "black",
        boxSizing: "content-box",
    },
    text: {
        lineWidth: 3,
        lineColor: "rgba(0, 0, 255, 1)",
        lineStyle: "solid",
        fillColor: "rgba(30, 144,255,1)",
        fill: true,
        cornerWidth: 0,
        cornerHeight: 0,
        invisibleInOperation: false,
        alarmBorder: false,
        alarmShape: false,
        alarmFill: false,
        alarmBackground: false,
        alarmLevel: "MINOR",
    },
    channelNames: [],
    groupNames: [],
    rules: [],
};

// ======================== Arc TDL Schema ========================

export const type_Arc_text_tdl_schema = {
    lineWidth: "number",
    lineStyle: "string",
    lineColor: "string",
    fillColor: "string",
    fill: "boolean",
    angleStart: "number",
    angleRange: "number",
    showRadius: "string",
    showArrowTail: "boolean",
    showArrowHead: "boolean",
    arrowLength: "number",
    arrowWidth: "number",
    invisibleInOperation: "boolean",
    alarmBorder: "boolean",
    alarmShape: "boolean",
    alarmFill: "boolean",
    alarmBackground: "boolean",
    alarmLevel: "string",
} as const satisfies TypeSchema;

export const type_Arc_tdl_schema = {
    type: "string",
    widgetKey: "string",
    key: "string",
    style: type_style_tdl_schema,
    text: type_Arc_text_tdl_schema,
    channelNames: "string[]",
    groupNames: "string[]",
    rules: { arrayOf: type_rule_tdl_schema },
} as const satisfies TypeSchema;

export type type_Arc_text_tdl = Mutable<InferType<typeof type_Arc_text_tdl_schema>>;
export type type_Arc_tdl = Mutable<InferType<typeof type_Arc_tdl_schema>>;

export const defaultArcTdl: type_Arc_tdl = {
    type: "Arc",
    widgetKey: "",
    key: "",
    style: {
        position: "absolute",
        display: "inline-flex",
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        backgroundColor: "rgba(255, 255, 255, 0)",
        transform: "rotate(0deg)",
        borderStyle: "solid",
        borderWidth: 0,
        borderColor: "rgba(255, 0, 0, 1)",
        color: "rgba(0,0,255,1)",
        fontFamily: GlobalVariables.defaultFontFamily,
        fontSize: GlobalVariables.defaultFontSize,
        fontStyle: GlobalVariables.defaultFontStyle,
        fontWeight: GlobalVariables.defaultFontWeight,
        outlineStyle: "none",
        outlineWidth: 1,
        outlineColor: "black",
        boxSizing: "content-box",
    },
    text: {
        lineWidth: 3,
        lineStyle: "solid",
        lineColor: "rgba(0,0,255,1)",
        fillColor: "rgba(30, 144, 255, 1)",
        fill: true,
        angleStart: 0,
        angleRange: 135,
        showRadius: "radius",
        showArrowTail: false,
        showArrowHead: false,
        arrowLength: 6,
        arrowWidth: 6,
        invisibleInOperation: false,
        alarmBorder: true,
        alarmShape: false,
        alarmFill: false,
        alarmBackground: false,
        alarmLevel: "MINOR",
    },
    channelNames: [],
    groupNames: [],
    rules: [],
};

// ======================== Tank TDL Schema ========================

export const type_Tank_text_tdl_schema = {
    usePvLimits: "boolean",
    minPvValue: "number",
    maxPvValue: "number",
    useLogScale: "boolean",
    fillColor: "string",
    containerColor: "string",
    showLabels: "boolean",
    invisibleInOperation: "boolean",
    format: "string",
    numTickIntervals: "number",
    compactScale: "boolean",
    scalePosition: "string",
    displayScale: type_scale_tdl_schema,
    alarmContainer: "boolean",
    alarmFill: "boolean",
    alarmText: "boolean",
    alarmBorder: "boolean",
    alarmBackground: "boolean",
    alarmLevel: "string",
} as const satisfies TypeSchema;

export const type_Tank_tdl_schema = {
    type: "string",
    widgetKey: "string",
    key: "string",
    style: type_style_tdl_schema,
    text: type_Tank_text_tdl_schema,
    channelNames: "string[]",
    groupNames: "string[]",
    rules: { arrayOf: type_rule_tdl_schema },
} as const satisfies TypeSchema;

export type type_Tank_text_tdl = Omit<Mutable<InferType<typeof type_Tank_text_tdl_schema>>, "displayScale"> & { displayScale: type_scale_tdl };
export type type_Tank_tdl = Mutable<InferType<typeof type_Tank_tdl_schema>>;

export const defaultTankTdl: type_Tank_tdl = {
    type: "Tank",
    widgetKey: "",
    key: "",
    style: {
        position: "absolute",
        display: "inline-flex",
        left: 100,
        top: 100,
        width: 100,
        height: 100,
        backgroundColor: "rgba(240, 240, 240, 1)",
        transform: "rotate(0deg)",
        borderStyle: "solid",
        borderWidth: 0,
        borderColor: "rgba(0, 0, 0, 1)",
        color: "rgba(0,0,0,1)",
        fontFamily: GlobalVariables.defaultFontFamily,
        fontSize: GlobalVariables.defaultFontSize,
        fontStyle: GlobalVariables.defaultFontStyle,
        fontWeight: GlobalVariables.defaultFontWeight,
        outlineStyle: "none",
        outlineWidth: 1,
        outlineColor: "black",
        boxSizing: "content-box",
    },
    text: {
        usePvLimits: false,
        minPvValue: 0,
        maxPvValue: 100,
        useLogScale: false,
        fillColor: "rgba(0,200,0,1)",
        containerColor: "rgba(210,210,210,1)",
        showLabels: true,
        invisibleInOperation: false,
        format: "default",
        numTickIntervals: 5,
        compactScale: false,
        scalePosition: "right",
        displayScale: "Linear",
        alarmContainer: false,
        alarmFill: false,
        alarmText: false,
        alarmBorder: true,
        alarmBackground: false,
        alarmLevel: "MINOR",
    },
    channelNames: [],
    groupNames: [],
    rules: [],
};

// ======================== Meter TDL Schema ========================

export const type_Meter_style_tdl_schema = {
    position: "string",
    display: "string",
    left: "number",
    top: "number",
    width: "number",
    height: "number",
    backgroundColor: "string",
    transform: "string",
    borderStyle: "string",
    borderWidth: "number",
    borderColor: "string",
    color: "string",
    fontFamily: "string",
    fontSize: "number",
    fontStyle: "string",
    fontWeight: "string",
    outlineStyle: "string",
    outlineWidth: "number",
    outlineColor: "string",
    boxSizing: ["string", "undefined"],
} as const satisfies TypeSchema;

export const type_Meter_text_tdl_schema = {
    showPvValue: "boolean",
    horizontalAlign: "string",
    verticalAlign: "string",
    wrapWord: "boolean",
    showUnit: "boolean",
    usePvLimits: "boolean",
    minPvValue: "number",
    maxPvValue: "number",
    useLogScale: "boolean",
    angleRange: "number",
    dialColor: "string",
    dialPercentage: "number",
    dialThickness: "number",
    pointerColor: "string",
    pointerLengthPercentage: "number",
    pointerThickness: "number",
    labelPositionPercentage: "number",
    invisibleInOperation: "boolean",
    format: "string",
    scale: "number",
    numTickIntervals: "number",
    alarmText: "boolean",
    alarmPointer: "boolean",
    alarmDial: "boolean",
    alarmBackground: "boolean",
    alarmBorder: "boolean",
    alarmLevel: "string",
} as const satisfies TypeSchema;

export const type_Meter_tdl_schema = {
    type: "string",
    widgetKey: "string",
    key: "string",
    style: type_Meter_style_tdl_schema,
    text: type_Meter_text_tdl_schema,
    channelNames: "string[]",
    groupNames: "string[]",
    rules: { arrayOf: type_rule_tdl_schema },
} as const satisfies TypeSchema;

export type type_Meter_style_tdl = Mutable<InferType<typeof type_Meter_style_tdl_schema>>;
export type type_Meter_text_tdl = Mutable<InferType<typeof type_Meter_text_tdl_schema>>;
export type type_Meter_tdl = Mutable<InferType<typeof type_Meter_tdl_schema>>;

export const defaultMeterTdl: type_Meter_tdl = {
    type: "Meter",
    widgetKey: "",
    key: "",
    style: {
        position: "absolute",
        display: "inline-flex",
        left: 0,
        top: 0,
        width: 100,
        height: 100,
        backgroundColor: "rgba(255, 255, 255, 1)",
        transform: "rotate(0deg)",
        color: "rgba(0,0,0,1)",
        fontFamily: GlobalVariables.defaultFontFamily,
        fontSize: GlobalVariables.defaultFontSize,
        fontStyle: GlobalVariables.defaultFontStyle,
        fontWeight: GlobalVariables.defaultFontWeight,
        borderStyle: "solid",
        borderWidth: 0,
        borderColor: "rgba(0, 0, 0, 1)",
        outlineStyle: "none",
        outlineWidth: 1,
        outlineColor: "black",
        boxSizing: undefined,
    },
    text: {
        showPvValue: true,
        horizontalAlign: "flex-start",
        verticalAlign: "flex-start",
        wrapWord: false,
        showUnit: true,
        usePvLimits: true,
        minPvValue: 0,
        maxPvValue: 100,
        useLogScale: false,
        angleRange: 275,
        dialColor: "rgba(0,0,0,1)",
        dialPercentage: 90,
        dialThickness: 5,
        pointerColor: "rgba(0,200,0,1)",
        pointerLengthPercentage: 75,
        pointerThickness: 5,
        labelPositionPercentage: 85,
        invisibleInOperation: false,
        format: "default",
        scale: 0,
        numTickIntervals: 5,
        alarmText: false,
        alarmPointer: false,
        alarmDial: false,
        alarmBackground: false,
        alarmBorder: true,
        alarmLevel: "MINOR",
    },
    channelNames: [],
    groupNames: [],
    rules: [],
};

// ======================== Thermometer TDL Schema ========================

export const type_Thermometer_style_tdl_schema = {
    position: "string",
    display: "string",
    backgroundColor: "string",
    left: "number",
    top: "number",
    width: "number",
    height: "number",
    outlineStyle: "string",
    outlineWidth: "number",
    outlineColor: "string",
    transform: "string",
    color: "string",
    borderStyle: "string",
    borderWidth: "number",
    borderColor: "string",
    fontFamily: "string",
    fontSize: "number",
    fontStyle: "string",
    fontWeight: "string",
    boxSizing: ["string", "undefined"],
} as const satisfies TypeSchema;

export const type_Thermometer_text_tdl_schema = {
    wrapWord: "boolean",
    showUnit: "boolean",
    usePvLimits: "boolean",
    minPvValue: "number",
    maxPvValue: "number",
    useLogScale: "boolean",
    fillColor: "string",
    containerColor: "string",
    showLabels: "boolean",
    bulbDiameter: "number",
    tubeWidth: "number",
    invisibleInOperation: "boolean",
    format: "string",
    scale: "number",
    numTickIntervals: "number",
    compactScale: "boolean",
    displayScale: type_scale_tdl_schema,
    alarmContainer: "boolean",
    alarmFill: "boolean",
    alarmText: "boolean",
    alarmBorder: "boolean",
    alarmBackground: "boolean",
    alarmLevel: "string",
} as const satisfies TypeSchema;

export const type_Thermometer_tdl_schema = {
    type: "string",
    widgetKey: "string",
    key: "string",
    style: type_Thermometer_style_tdl_schema,
    text: type_Thermometer_text_tdl_schema,
    channelNames: "string[]",
    groupNames: "string[]",
    rules: { arrayOf: type_rule_tdl_schema },
} as const satisfies TypeSchema;

export type type_Thermometer_style_tdl = Mutable<InferType<typeof type_Thermometer_style_tdl_schema>>;
export type type_Thermometer_text_tdl = Omit<Mutable<InferType<typeof type_Thermometer_text_tdl_schema>>, "displayScale"> & {
    displayScale: type_scale_tdl;
};
export type type_Thermometer_tdl = Omit<Mutable<InferType<typeof type_Thermometer_tdl_schema>>, "text"> & {
    text: type_Thermometer_text_tdl;
};

export const defaultThermometerTdl: type_Thermometer_tdl = {
    type: "Thermometer",
    widgetKey: "",
    key: "",
    style: {
        position: "absolute",
        display: "inline-flex",
        backgroundColor: "rgba(240, 240, 240, 1)",
        left: 100,
        top: 100,
        width: 150,
        height: 80,
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
        boxSizing: undefined,
    },
    text: {
        wrapWord: false,
        showUnit: true,
        usePvLimits: false,
        minPvValue: 0,
        maxPvValue: 100,
        useLogScale: false,
        fillColor: "rgba(60,255,60,1)",
        containerColor: "rgba(210,210,210,1)",
        showLabels: true,
        bulbDiameter: 30,
        tubeWidth: 15,
        invisibleInOperation: false,
        format: "default",
        scale: 0,
        numTickIntervals: 5,
        compactScale: false,
        displayScale: "Linear",
        alarmContainer: false,
        alarmFill: false,
        alarmText: false,
        alarmBorder: true,
        alarmBackground: false,
        alarmLevel: "MINOR",
    },
    channelNames: [],
    groupNames: [],
    rules: [],
};

// ======================== Spinner TDL Schema ========================

export const type_Spinner_style_tdl_schema = {
    position: "string",
    display: "string",
    backgroundColor: "string",
    left: "number",
    top: "number",
    width: "number",
    height: "number",
    outlineStyle: "string",
    outlineWidth: "number",
    outlineColor: "string",
    transform: "string",
    color: "string",
    borderStyle: "string",
    borderWidth: "number",
    borderColor: "string",
    fontFamily: "string",
    fontSize: "number",
    fontStyle: "string",
    fontWeight: "string",
    boxSizing: ["string", "undefined"],
} as const satisfies TypeSchema;

export const type_Spinner_text_tdl_schema = {
    horizontalAlign: "string",
    verticalAlign: "string",
    wrapWord: "boolean",
    showUnit: "boolean",
    stepSize: "number",
    invisibleInOperation: "boolean",
    format: "string",
    scale: "number",
    alarmBorder: "boolean",
    alarmText: "boolean",
    alarmBackground: "boolean",
    alarmLevel: "string",
    confirmOnWrite: "boolean",
    confirmOnWriteUsePassword: "boolean",
    confirmOnWritePassword: "string",
    highlightBackgroundColor: ["string", "undefined"],
} as const satisfies TypeSchema;

export const type_Spinner_tdl_schema = {
    type: "string",
    widgetKey: "string",
    key: "string",
    style: type_Spinner_style_tdl_schema,
    text: type_Spinner_text_tdl_schema,
    channelNames: "string[]",
    groupNames: "string[]",
    rules: { arrayOf: type_rule_tdl_schema },
} as const satisfies TypeSchema;

export type type_Spinner_style_tdl = Mutable<InferType<typeof type_Spinner_style_tdl_schema>>;
export type type_Spinner_text_tdl = Mutable<InferType<typeof type_Spinner_text_tdl_schema>>;
export type type_Spinner_tdl = Mutable<InferType<typeof type_Spinner_tdl_schema>>;

export const defaultSpinnerTdl: type_Spinner_tdl = {
    type: "Spinner",
    widgetKey: "",
    key: "",
    style: {
        position: "absolute",
        display: "inline-flex",
        backgroundColor: "rgba(128, 255, 255, 1)",
        left: 100,
        top: 100,
        width: 150,
        height: 80,
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
        boxSizing: undefined,
    },
    text: {
        horizontalAlign: "flex-start",
        verticalAlign: "flex-start",
        wrapWord: false,
        showUnit: true,
        stepSize: 1,
        invisibleInOperation: false,
        format: "default",
        scale: 0,
        alarmBorder: true,
        alarmText: false,
        alarmBackground: false,
        alarmLevel: "MINOR",
        confirmOnWrite: false,
        confirmOnWriteUsePassword: false,
        confirmOnWritePassword: "",
        highlightBackgroundColor: undefined,
    },
    channelNames: [],
    groupNames: [],
    rules: [],
};

// ======================== ThumbWheel TDL Schema ========================

export const type_ThumbWheel_style_tdl_schema = {
    position: "string",
    display: "string",
    backgroundColor: "string",
    left: "number",
    top: "number",
    width: "number",
    height: "number",
    outlineStyle: "string",
    outlineWidth: "number",
    outlineColor: "string",
    transform: "string",
    color: "string",
    borderStyle: "string",
    borderWidth: "number",
    borderColor: "string",
    fontFamily: "string",
    fontSize: "number",
    fontStyle: "string",
    fontWeight: "string",
    boxSizing: ["string", "undefined"],
} as const satisfies TypeSchema;

export const type_ThumbWheel_text_tdl_schema = {
    horizontalAlign: "string",
    verticalAlign: "string",
    wrapWord: "boolean",
    showUnit: "boolean",
    alarmBorder: "boolean",
    stepSize: "number",
    invisibleInOperation: "boolean",
    highlightBackgroundColor: ["string", "undefined"],
} as const satisfies TypeSchema;

export const type_ThumbWheel_tdl_schema = {
    type: "string",
    widgetKey: "string",
    key: "string",
    style: type_ThumbWheel_style_tdl_schema,
    text: type_ThumbWheel_text_tdl_schema,
    channelNames: "string[]",
    groupNames: "string[]",
    rules: { arrayOf: type_rule_tdl_schema },
} as const satisfies TypeSchema;

export type type_ThumbWheel_style_tdl = Mutable<InferType<typeof type_ThumbWheel_style_tdl_schema>>;
export type type_ThumbWheel_text_tdl = Mutable<InferType<typeof type_ThumbWheel_text_tdl_schema>>;
export type type_ThumbWheel_tdl = Mutable<InferType<typeof type_ThumbWheel_tdl_schema>>;

export const defaultThumbWheelTdl: type_ThumbWheel_tdl = {
    type: "ThumbWheel",
    widgetKey: "",
    key: "",
    style: {
        position: "absolute",
        display: "inline-flex",
        backgroundColor: "rgba(128, 255, 255, 1)",
        left: 100,
        top: 100,
        width: 150,
        height: 80,
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
        boxSizing: undefined,
    },
    text: {
        horizontalAlign: "flex-start",
        verticalAlign: "flex-start",
        wrapWord: false,
        showUnit: true,
        alarmBorder: true,
        stepSize: 1,
        invisibleInOperation: false,
        highlightBackgroundColor: undefined,
    },
    channelNames: [],
    groupNames: [],
    rules: [],
};

// ======================== LED TDL Schema ========================

export const type_LED_text_tdl_schema = {
    wrapWord: "boolean",
    showUnit: "boolean",
    alarmBorder: "boolean",
    lineWidth: "number",
    lineStyle: "string",
    lineColor: "string",
    shape: "string",
    invisibleInOperation: "boolean",
    bit: "number",
    useChannelItems: "boolean",
    fallbackColor: "string",
    fallbackText: "string",
} as const satisfies TypeSchema;

export const type_LED_tdl_schema = {
    type: "string",
    widgetKey: "string",
    key: "string",
    style: type_style_tdl_schema,
    text: type_LED_text_tdl_schema,
    channelNames: "string[]",
    groupNames: "string[]",
    rules: { arrayOf: type_rule_tdl_schema },
    itemNames: "string[]",
    itemColors: "string[]",
    itemValues: "number[]",
} as const satisfies TypeSchema;

export type type_LED_text_tdl = Mutable<InferType<typeof type_LED_text_tdl_schema>>;
export type type_LED_tdl = Mutable<InferType<typeof type_LED_tdl_schema>>;

export const defaultLEDTdl: type_LED_tdl = {
    type: "LED",
    widgetKey: "",
    key: "",
    style: {
        position: "absolute",
        display: "inline-flex",
        left: 0,
        top: 0,
        width: 100,
        height: 100,
        backgroundColor: "rgba(240, 240, 240, 0)",
        transform: "rotate(0deg)",
        color: "rgba(0,0,0,1)",
        fontFamily: GlobalVariables.defaultFontFamily,
        fontSize: GlobalVariables.defaultFontSize,
        fontStyle: GlobalVariables.defaultFontStyle,
        fontWeight: GlobalVariables.defaultFontWeight,
        borderStyle: "solid",
        borderWidth: 0,
        borderColor: "rgba(0, 0, 0, 1)",
        outlineStyle: "none",
        outlineWidth: 1,
        outlineColor: "black",
        boxSizing: "content-box",
    },
    text: {
        wrapWord: false,
        showUnit: false,
        alarmBorder: true,
        lineWidth: 2,
        lineStyle: "solid",
        lineColor: "rgba(50, 50, 50, 0.698)",
        shape: "round",
        invisibleInOperation: false,
        bit: 0,
        useChannelItems: true,
        fallbackColor: "rgba(255,0,255,1)",
        fallbackText: "Wrong State",
    },
    channelNames: [],
    groupNames: [],
    rules: [],
    itemNames: ["ZERO", "ONE"],
    itemColors: ["rgba(60, 100, 60, 1)", "rgba(0, 255, 0, 1)"],
    itemValues: [0, 1],
};

// ======================== LEDMultiState TDL Schema ========================

export const type_LEDMultiState_text_tdl_schema = {
    horizontalAlign: "string",
    verticalAlign: "string",
    wrapWord: "boolean",
    showUnit: "boolean",
    alarmBorder: "boolean",
    lineWidth: "number",
    lineStyle: "string",
    lineColor: "string",
    shape: "string",
    invisibleInOperation: "boolean",
    bit: "number",
    useChannelItems: "boolean",
    fallbackColor: "string",
    fallbackText: "string",
} as const satisfies TypeSchema;

export const type_LEDMultiState_tdl_schema = {
    type: "string",
    widgetKey: "string",
    key: "string",
    style: type_style_tdl_schema,
    text: type_LEDMultiState_text_tdl_schema,
    channelNames: "string[]",
    groupNames: "string[]",
    rules: { arrayOf: type_rule_tdl_schema },
    itemNames: "string[]",
    itemColors: "string[]",
    itemValues: "number[]",
} as const satisfies TypeSchema;

export type type_LEDMultiState_text_tdl = Mutable<InferType<typeof type_LEDMultiState_text_tdl_schema>>;
export type type_LEDMultiState_tdl = Mutable<InferType<typeof type_LEDMultiState_tdl_schema>>;

export const defaultLEDMultiStateTdl: type_LEDMultiState_tdl = {
    type: "LEDMultiState",
    widgetKey: "",
    key: "",
    style: {
        position: "absolute",
        display: "inline-flex",
        left: 0,
        top: 0,
        width: 100,
        height: 100,
        backgroundColor: "rgba(0, 0, 0, 0)",
        transform: "rotate(0deg)",
        color: "rgba(0,0,0,1)",
        fontFamily: GlobalVariables.defaultFontFamily,
        fontSize: GlobalVariables.defaultFontSize,
        fontStyle: GlobalVariables.defaultFontStyle,
        fontWeight: GlobalVariables.defaultFontWeight,
        borderStyle: "solid",
        borderWidth: 0,
        borderColor: "rgba(0, 0, 0, 1)",
        outlineStyle: "none",
        outlineWidth: 1,
        outlineColor: "black",
        boxSizing: "content-box",
    },
    text: {
        horizontalAlign: "flex-start",
        verticalAlign: "flex-start",
        wrapWord: false,
        showUnit: false,
        alarmBorder: true,
        lineWidth: 2,
        lineStyle: "solid",
        lineColor: "rgba(50, 50, 50, 0.698)",
        shape: "round",
        invisibleInOperation: false,
        bit: -1,
        useChannelItems: false,
        fallbackColor: "rgba(255,0,255,1)",
        fallbackText: "Wrong State",
    },
    channelNames: [],
    groupNames: [],
    rules: [],
    itemNames: ["ZERO", "ONE"],
    itemColors: ["rgba(60, 100, 60, 1)", "rgba(0, 255, 0, 1)"],
    itemValues: [0, 1],
};

// ======================== ByteMonitor TDL Schema ========================

export const type_ByteMonitor_text_tdl_schema = {
    horizontalAlign: "string",
    verticalAlign: "string",
    wrapWord: "boolean",
    showUnit: "boolean",
    alarmBorder: "boolean",
    lineWidth: "number",
    lineStyle: "string",
    lineColor: "string",
    shape: "string",
    bitStart: "number",
    bitLength: "number",
    direction: "string",
    sequence: "string",
    fallbackColor: "string",
    invisibleInOperation: "boolean",
} as const satisfies TypeSchema;

export const type_ByteMonitor_tdl_schema = {
    type: "string",
    widgetKey: "string",
    key: "string",
    style: type_style_tdl_schema,
    text: type_ByteMonitor_text_tdl_schema,
    channelNames: "string[]",
    groupNames: "string[]",
    rules: { arrayOf: type_rule_tdl_schema },
    bitNames: "string[]",
    itemColors: "string[]",
} as const satisfies TypeSchema;

export type type_ByteMonitor_text_tdl = Mutable<InferType<typeof type_ByteMonitor_text_tdl_schema>>;
export type type_ByteMonitor_tdl = Mutable<InferType<typeof type_ByteMonitor_tdl_schema>>;

export const defaultByteMonitorTdl: type_ByteMonitor_tdl = {
    type: "ByteMonitor",
    widgetKey: "",
    key: "",
    style: {
        position: "absolute",
        display: "inline-flex",
        left: 100,
        top: 100,
        width: 100,
        height: 100,
        backgroundColor: "rgba(0, 0, 0, 0)",
        transform: "rotate(0deg)",
        color: "rgba(0,0,0,1)",
        fontFamily: GlobalVariables.defaultFontFamily,
        fontSize: GlobalVariables.defaultFontSize,
        fontStyle: GlobalVariables.defaultFontStyle,
        fontWeight: GlobalVariables.defaultFontWeight,
        borderStyle: "solid",
        borderWidth: 0,
        borderColor: "rgba(0, 0, 0, 1)",
        outlineStyle: "none",
        outlineWidth: 1,
        outlineColor: "black",
        boxSizing: "content-box",
    },
    text: {
        horizontalAlign: "flex-start",
        verticalAlign: "flex-start",
        wrapWord: false,
        showUnit: false,
        alarmBorder: true,
        lineWidth: 2,
        lineStyle: "solid",
        lineColor: "rgba(0, 0, 0, 1)",
        shape: "round",
        bitStart: 0,
        bitLength: 8,
        direction: "horizontal",
        sequence: "positive",
        fallbackColor: "rgba(255,0,255,1)",
        invisibleInOperation: false,
    },
    channelNames: [],
    groupNames: [],
    rules: [],
    bitNames: [],
    itemColors: ["rgba(60, 100, 60, 1)", "rgba(60, 255, 60, 1)"],
};

// ======================== Symbol TDL Schema ========================

export const type_Symbol_text_tdl_schema = {
    horizontalAlign: "string",
    verticalAlign: "string",
    wrapWord: "boolean",
    showUnit: "boolean",
    fileName: "string",
    opacity: "number",
    stretchToFit: "boolean",
    showPvValue: "boolean",
    invisibleInOperation: "boolean",
    alarmBorder: "boolean",
    alarmBackground: "boolean",
    alarmLevel: "string",
} as const satisfies TypeSchema;

export const type_Symbol_tdl_schema = {
    type: "string",
    widgetKey: "string",
    key: "string",
    style: type_style_tdl_schema,
    text: type_Symbol_text_tdl_schema,
    channelNames: "string[]",
    groupNames: "string[]",
    rules: { arrayOf: type_rule_tdl_schema },
    itemNames: "string[]",
    itemValues: "number[]",
} as const satisfies TypeSchema;

export type type_Symbol_text_tdl = Mutable<InferType<typeof type_Symbol_text_tdl_schema>>;
export type type_Symbol_tdl = Mutable<InferType<typeof type_Symbol_tdl_schema>>;

export const defaultSymbolTdl: type_Symbol_tdl = {
    type: "Symbol",
    widgetKey: "",
    key: "",
    style: {
        position: "absolute",
        display: "inline-flex",
        backgroundColor: "rgba(240, 240, 240, 0.2)",
        left: 100,
        top: 100,
        width: 150,
        height: 80,
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
        boxSizing: "content-box",
    },
    text: {
        horizontalAlign: "flex-start",
        verticalAlign: "flex-start",
        wrapWord: false,
        showUnit: false,
        fileName: "../../../webpack/resources/webpages/tdm-logo.svg",
        opacity: 1,
        stretchToFit: false,
        showPvValue: false,
        invisibleInOperation: false,
        alarmBorder: true,
        alarmBackground: false,
        alarmLevel: "MINOR",
    },
    channelNames: [],
    groupNames: [],
    rules: [],
    itemNames: [],
    itemValues: [],
};

// ======================== TextSymbol TDL Schema ========================

export const type_TextSymbol_text_tdl_schema = {
    horizontalAlign: "string",
    verticalAlign: "string",
    wrapWord: "boolean",
    showUnit: "boolean",
    invisibleInOperation: "boolean",
    alarmBorder: "boolean",
    alarmBackground: "boolean",
    alarmText: "boolean",
    alarmLevel: "string",
    text: "string",
    showPvValue: "boolean",
    bit: "number",
    useChannelItems: "boolean",
    fallbackColor: "string",
    fallbackText: "string",
} as const satisfies TypeSchema;

export const type_TextSymbol_tdl_schema = {
    type: "string",
    widgetKey: "string",
    key: "string",
    style: type_style_tdl_schema,
    text: type_TextSymbol_text_tdl_schema,
    channelNames: "string[]",
    groupNames: "string[]",
    rules: { arrayOf: type_rule_tdl_schema },
    itemNames: "string[]",
    itemValues: "number[]",
    itemColors: "string[]",
} as const satisfies TypeSchema;

export type type_TextSymbol_text_tdl = Mutable<InferType<typeof type_TextSymbol_text_tdl_schema>>;
export type type_TextSymbol_tdl = Mutable<InferType<typeof type_TextSymbol_tdl_schema>>;

export const defaultTextSymbolTdl: type_TextSymbol_tdl = {
    type: "TextSymbol",
    widgetKey: "",
    key: "",
    style: {
        position: "absolute",
        display: "inline-flex",
        backgroundColor: "rgba(240, 240, 240, 0.2)",
        left: 100,
        top: 100,
        width: 150,
        height: 80,
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
        boxSizing: "content-box",
    },
    text: {
        horizontalAlign: "flex-start",
        verticalAlign: "flex-start",
        wrapWord: false,
        showUnit: false,
        invisibleInOperation: false,
        alarmBorder: true,
        alarmBackground: false,
        alarmText: false,
        alarmLevel: "MINOR",
        text: "",
        showPvValue: false,
        bit: -1,
        useChannelItems: false,
        fallbackColor: "rgba(255,0,255,0)",
        fallbackText: "Wrong State",
    },
    channelNames: [],
    groupNames: [],
    rules: [],
    itemNames: ["ZERO", "ONE"],
    itemValues: [0, 1],
    itemColors: ["rgba(60, 100, 60, 0)", "rgba(0, 255, 0, 0)"],
};

// ======================== TextUpdate TDL Schema ========================

export const type_TextUpdate_text_tdl_schema = {
    horizontalAlign: "string",
    verticalAlign: "string",
    wrapWord: "boolean",
    showUnit: "boolean",
    invisibleInOperation: "boolean",
    format: "string",
    scale: "number",
    alarmBorder: "boolean",
    alarmText: "boolean",
    alarmBackground: "boolean",
    alarmLevel: "string",
} as const satisfies TypeSchema;

export const type_TextUpdate_tdl_schema = {
    type: "string",
    widgetKey: "string",
    key: "string",
    style: type_style_tdl_schema,
    text: type_TextUpdate_text_tdl_schema,
    channelNames: "string[]",
    groupNames: "string[]",
    rules: { arrayOf: type_rule_tdl_schema },
} as const satisfies TypeSchema;

export type type_TextUpdate_text_tdl = Mutable<InferType<typeof type_TextUpdate_text_tdl_schema>>;
export type type_TextUpdate_tdl = Mutable<InferType<typeof type_TextUpdate_tdl_schema>>;

export const defaultTextUpdateTdl: type_TextUpdate_tdl = {
    type: "TextUpdate",
    widgetKey: "",
    key: "",
    style: {
        position: "absolute",
        display: "inline-flex",
        left: 100,
        top: 100,
        width: 100,
        height: 100,
        backgroundColor: "rgba(240, 240, 240, 1)",
        transform: "rotate(0deg)",
        borderStyle: "solid",
        borderWidth: 0,
        borderColor: "rgba(0, 0, 0, 1)",
        color: "rgba(0,0,0,1)",
        fontFamily: GlobalVariables.defaultFontFamily,
        fontSize: GlobalVariables.defaultFontSize,
        fontStyle: GlobalVariables.defaultFontStyle,
        fontWeight: GlobalVariables.defaultFontWeight,
        outlineStyle: "none",
        outlineWidth: 1,
        outlineColor: "black",
        boxSizing: "content-box",
    },
    text: {
        horizontalAlign: "flex-start",
        verticalAlign: "flex-start",
        wrapWord: false,
        showUnit: true,
        invisibleInOperation: false,
        format: "default",
        scale: 0,
        alarmBorder: true,
        alarmText: false,
        alarmBackground: false,
        alarmLevel: "MINOR",
    },
    channelNames: [],
    groupNames: [],
    rules: [],
};

// ======================== TextEntry TDL Schema ========================

export const type_TextEntry_text_tdl_schema = {
    horizontalAlign: "string",
    verticalAlign: "string",
    wrapWord: "boolean",
    showUnit: "boolean",
    highlightBackgroundColor: "string",
    invisibleInOperation: "boolean",
    format: "string",
    scale: "number",
    appearance: "string",
    alarmBorder: "boolean",
    alarmText: "boolean",
    alarmBackground: "boolean",
    alarmLevel: "string",
    confirmOnWrite: "boolean",
    confirmOnWriteUsePassword: "boolean",
    confirmOnWritePassword: "string",
} as const satisfies TypeSchema;

export const type_TextEntry_tdl_schema = {
    type: "string",
    widgetKey: "string",
    key: "string",
    style: type_style_tdl_schema,
    text: type_TextEntry_text_tdl_schema,
    channelNames: "string[]",
    groupNames: "string[]",
    rules: { arrayOf: type_rule_tdl_schema },
} as const satisfies TypeSchema;

export type type_TextEntry_text_tdl = Mutable<InferType<typeof type_TextEntry_text_tdl_schema>>;
export type type_TextEntry_tdl = Mutable<InferType<typeof type_TextEntry_tdl_schema>>;

export const defaultTextEntryTdl: type_TextEntry_tdl = {
    type: "TextEntry",
    widgetKey: "",
    key: "",
    style: {
        position: "absolute",
        display: "inline-flex",
        left: 0,
        top: 0,
        width: 100,
        height: 100,
        backgroundColor: "rgba(128, 255, 255, 1)",
        transform: "rotate(0deg)",
        borderStyle: "solid",
        borderWidth: 0,
        borderColor: "rgba(0, 0, 0, 1)",
        color: "rgba(0,0,0,1)",
        fontFamily: GlobalVariables.defaultFontFamily,
        fontSize: GlobalVariables.defaultFontSize,
        fontStyle: GlobalVariables.defaultFontStyle,
        fontWeight: GlobalVariables.defaultFontWeight,
        outlineStyle: "none",
        outlineWidth: 1,
        outlineColor: "black",
        boxSizing: "content-box",
    },
    text: {
        horizontalAlign: "flex-start",
        verticalAlign: "center",
        wrapWord: false,
        showUnit: true,
        highlightBackgroundColor: "rgba(255, 255, 0, 1)",
        invisibleInOperation: false,
        format: "default",
        scale: 0,
        appearance: "contemporary",
        alarmBorder: true,
        alarmText: false,
        alarmBackground: false,
        alarmLevel: "MINOR",
        confirmOnWrite: false,
        confirmOnWriteUsePassword: false,
        confirmOnWritePassword: "",
    },
    channelNames: [],
    groupNames: [],
    rules: [],
};

// ======================== Table TDL Schema ========================

export const type_Table_style_tdl_schema = {
    position: "string",
    display: "string",
    left: "number",
    top: "number",
    width: "number",
    height: "number",
    backgroundColor: "string",
    transform: "string",
    borderStyle: "string",
    borderWidth: "number",
    borderColor: "string",
    color: "string",
    fontFamily: "string",
    fontSize: "number",
    fontStyle: "string",
    fontWeight: "string",
    outlineStyle: "string",
    outlineWidth: "number",
    outlineColor: "string",
    boxSizing: ["string", "undefined"],
} as const satisfies TypeSchema;

export const type_Table_text_tdl_schema = {
    horizontalAlign: "string",
    verticalAlign: "string",
    wrapWord: "boolean",
    showUnit: "boolean",
    invisibleInOperation: "boolean",
    format: "string",
    scale: "number",
    alarmBorder: "boolean",
    alarmText: "boolean",
    alarmBackground: "boolean",
    alarmLevel: "string",
} as const satisfies TypeSchema;

export const type_Table_tdl_schema = {
    type: "string",
    widgetKey: "string",
    key: "string",
    style: type_Table_style_tdl_schema,
    text: type_Table_text_tdl_schema,
    channelNames: "string[]",
    groupNames: "string[]",
    rules: { arrayOf: type_rule_tdl_schema },
} as const satisfies TypeSchema;

export type type_Table_style_tdl = Mutable<InferType<typeof type_Table_style_tdl_schema>>;
export type type_Table_text_tdl = Mutable<InferType<typeof type_Table_text_tdl_schema>>;
export type type_Table_tdl = Mutable<InferType<typeof type_Table_tdl_schema>>;

export const defaultTableTdl: type_Table_tdl = {
    type: "Table",
    widgetKey: "",
    key: "",
    style: {
        position: "absolute",
        display: "inline-flex",
        left: 100,
        top: 100,
        width: 100,
        height: 100,
        backgroundColor: "rgba(240, 240, 240, 1)",
        transform: "rotate(0deg)",
        borderStyle: "solid",
        borderWidth: 0,
        borderColor: "rgba(0, 0, 0, 1)",
        color: "rgba(0,0,0,1)",
        fontFamily: GlobalVariables.defaultFontFamily,
        fontSize: GlobalVariables.defaultFontSize,
        fontStyle: GlobalVariables.defaultFontStyle,
        fontWeight: GlobalVariables.defaultFontWeight,
        outlineStyle: "none",
        outlineWidth: 1,
        outlineColor: "black",
        boxSizing: undefined,
    },
    text: {
        horizontalAlign: "flex-start",
        verticalAlign: "flex-start",
        wrapWord: false,
        showUnit: true,
        invisibleInOperation: false,
        format: "default",
        scale: 0,
        alarmBorder: true,
        alarmText: false,
        alarmBackground: false,
        alarmLevel: "MINOR",
    },
    channelNames: [],
    groupNames: [],
    rules: [],
};

// ======================== ScaledSlider TDL Schema ========================

export const type_ScaledSlider_text_tdl_schema = {
    showUnit: "boolean",
    minPvValue: "number",
    maxPvValue: "number",
    usePvLimits: "boolean",
    numTickIntervals: "number",
    showPvValue: "boolean",
    showLabels: "boolean",
    stepSize: "number",
    invisibleInOperation: "boolean",
    format: "string",
    scale: "number",
    compactScale: "boolean",
    appearance: "string",
    fillColor: "string",
    alarmBorder: "boolean",
    alarmText: "boolean",
    alarmFill: "boolean",
    alarmBackground: "boolean",
    alarmLevel: "string",
} as const satisfies TypeSchema;

export const type_ScaledSlider_tdl_schema = {
    type: "string",
    widgetKey: "string",
    key: "string",
    style: type_style_tdl_schema,
    text: type_ScaledSlider_text_tdl_schema,
    channelNames: "string[]",
    groupNames: "string[]",
    rules: { arrayOf: type_rule_tdl_schema },
} as const satisfies TypeSchema;

export type type_ScaledSlider_text_tdl = Mutable<InferType<typeof type_ScaledSlider_text_tdl_schema>>;
export type type_ScaledSlider_tdl = Mutable<InferType<typeof type_ScaledSlider_tdl_schema>>;

export const defaultScaledSliderTdl: type_ScaledSlider_tdl = {
    type: "ScaledSlider",
    widgetKey: "",
    key: "",
    style: {
        position: "absolute",
        display: "inline-flex",
        backgroundColor: "rgba(255, 255, 255, 1)",
        left: 100,
        top: 100,
        width: 150,
        height: 80,
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
        boxSizing: "content-box",
    },
    text: {
        showUnit: true,
        minPvValue: 0,
        maxPvValue: 100,
        usePvLimits: false,
        numTickIntervals: 5,
        showPvValue: true,
        showLabels: true,
        stepSize: 1,
        invisibleInOperation: false,
        format: "default",
        scale: 0,
        compactScale: false,
        appearance: "traditional",
        fillColor: "rgba(180, 180, 180, 1)",
        alarmBorder: true,
        alarmText: false,
        alarmFill: false,
        alarmBackground: false,
        alarmLevel: "MINOR",
    },
    channelNames: [],
    groupNames: [],
    rules: [],
};

// ======================== BooleanButton TDL Schema ========================

export const type_BooleanButton_text_tdl_schema = {
    horizontalAlign: "string",
    verticalAlign: "string",
    wrapWord: "boolean",
    showUnit: "boolean",
    usePictures: "boolean",
    showLED: "boolean",
    alarmBorder: "boolean",
    mode: "string",
    invisibleInOperation: "boolean",
    onPicture: "string",
    offPicture: "string",
    appearance: "string",
    confirmOnWrite: "boolean",
    confirmOnWriteUsePassword: "boolean",
    confirmOnWritePassword: "string",
    bit: "number",
    useChannelItems: "boolean",
    fallbackColor: "string",
    fallbackText: "string",
} as const satisfies TypeSchema;

export const type_BooleanButton_tdl_schema = {
    type: "string",
    widgetKey: "string",
    key: "string",
    style: type_style_tdl_schema,
    text: type_BooleanButton_text_tdl_schema,
    channelNames: "string[]",
    groupNames: "string[]",
    rules: { arrayOf: type_rule_tdl_schema },
    itemNames: "string[]",
    itemColors: "string[]",
    itemValues: { arrayOf: ["number", "string"] },
} as const satisfies TypeSchema;

export type type_BooleanButton_text_tdl = Mutable<InferType<typeof type_BooleanButton_text_tdl_schema>>;
export type type_BooleanButton_tdl = Mutable<InferType<typeof type_BooleanButton_tdl_schema>>;

export const defaultBooleanButtonTdl: type_BooleanButton_tdl = {
    type: "BooleanButton",
    widgetKey: "",
    key: "",
    style: {
        position: "absolute",
        display: "inline-flex",
        left: 0,
        top: 0,
        width: 100,
        height: 100,
        backgroundColor: "rgba(210, 210, 210, 1)",
        transform: "rotate(0deg)",
        color: "rgba(0,0,0,1)",
        fontFamily: GlobalVariables.defaultFontFamily,
        fontSize: GlobalVariables.defaultFontSize,
        fontStyle: GlobalVariables.defaultFontStyle,
        fontWeight: GlobalVariables.defaultFontWeight,
        borderStyle: "solid",
        borderWidth: 0,
        borderColor: "rgba(0, 0, 0, 1)",
        outlineStyle: "none",
        outlineWidth: 1,
        outlineColor: "rgba(0,0,0,1)",
        boxSizing: "content-box",
    },
    text: {
        horizontalAlign: "center",
        verticalAlign: "center",
        wrapWord: false,
        showUnit: false,
        usePictures: false,
        showLED: true,
        alarmBorder: true,
        mode: "Toggle",
        invisibleInOperation: false,
        onPicture: "",
        offPicture: "",
        appearance: "traditional",
        confirmOnWrite: false,
        confirmOnWriteUsePassword: false,
        confirmOnWritePassword: "",
        bit: 0,
        useChannelItems: true,
        fallbackColor: "rgba(255,0,255,1)",
        fallbackText: "Wrong State",
    },
    channelNames: [],
    groupNames: [],
    rules: [],
    itemNames: ["ZERO", "ONE"],
    itemColors: ["rgba(60, 100, 60, 1)", "rgba(0, 255, 0, 1)"],
    itemValues: [0, 1],
};

// ======================== CheckBox TDL Schema ========================

export const type_CheckBox_text_tdl_schema = {
    horizontalAlign: "string",
    verticalAlign: "string",
    wrapWord: "boolean",
    showUnit: "boolean",
    alarmBorder: "boolean",
    size: "number",
    text: "string",
    invisibleInOperation: "boolean",
    confirmOnWrite: "boolean",
    confirmOnWriteUsePassword: "boolean",
    confirmOnWritePassword: "string",
    showLabels: "boolean",
    bit: "number",
    useChannelItems: "boolean",
    fallbackColor: "string",
    fallbackText: "string",
} as const satisfies TypeSchema;

export const type_CheckBox_tdl_schema = {
    type: "string",
    widgetKey: "string",
    key: "string",
    style: type_style_tdl_schema,
    text: type_CheckBox_text_tdl_schema,
    channelNames: "string[]",
    groupNames: "string[]",
    rules: { arrayOf: type_rule_tdl_schema },
    itemNames: "string[]",
    itemColors: "string[]",
    itemValues: "number[]",
} as const satisfies TypeSchema;

export type type_CheckBox_text_tdl = Mutable<InferType<typeof type_CheckBox_text_tdl_schema>>;
export type type_CheckBox_tdl = Mutable<InferType<typeof type_CheckBox_tdl_schema>>;

export const defaultCheckBoxTdl: type_CheckBox_tdl = {
    type: "CheckBox",
    widgetKey: "",
    key: "",
    style: {
        position: "absolute",
        display: "inline-flex",
        left: 0,
        top: 0,
        width: 100,
        height: 100,
        backgroundColor: "rgba(128, 255, 255, 0)",
        transform: "rotate(0deg)",
        color: "rgba(0,0,0,1)",
        fontFamily: GlobalVariables.defaultFontFamily,
        fontSize: GlobalVariables.defaultFontSize,
        fontStyle: GlobalVariables.defaultFontStyle,
        fontWeight: GlobalVariables.defaultFontWeight,
        borderStyle: "solid",
        borderWidth: 0,
        borderColor: "rgba(0, 0, 0, 1)",
        outlineStyle: "none",
        outlineWidth: 1,
        outlineColor: "black",
        boxSizing: "content-box",
    },
    text: {
        horizontalAlign: "flex-start",
        verticalAlign: "flex-start",
        wrapWord: false,
        showUnit: false,
        alarmBorder: true,
        size: 12,
        text: "Label",
        invisibleInOperation: false,
        confirmOnWrite: false,
        confirmOnWriteUsePassword: false,
        confirmOnWritePassword: "",
        showLabels: true,
        bit: 0,
        useChannelItems: true,
        fallbackColor: "rgba(255,0,255,0)",
        fallbackText: "Wrong State",
    },
    channelNames: [],
    groupNames: [],
    rules: [],
    itemNames: ["ZERO", "ONE"],
    itemColors: ["rgba(60, 100, 60, 0)", "rgba(0, 255, 0, 0)"],
    itemValues: [0, 1],
};

// ======================== SlideButton TDL Schema ========================

export const type_SlideButton_text_tdl_schema = {
    horizontalAlign: "string",
    verticalAlign: "string",
    wrapWord: "boolean",
    showUnit: "boolean",
    alarmBorder: "boolean",
    boxWidth: "number",
    text: "string",
    invisibleInOperation: "boolean",
    confirmOnWrite: "boolean",
    confirmOnWriteUsePassword: "boolean",
    confirmOnWritePassword: "string",
    bit: "number",
    useChannelItems: "boolean",
    fallbackColor: "string",
    fallbackText: "string",
} as const satisfies TypeSchema;

export const type_SlideButton_tdl_schema = {
    type: "string",
    widgetKey: "string",
    key: "string",
    style: type_style_tdl_schema,
    text: type_SlideButton_text_tdl_schema,
    channelNames: "string[]",
    groupNames: "string[]",
    rules: { arrayOf: type_rule_tdl_schema },
    itemNames: "string[]",
    itemColors: "string[]",
    itemValues: "number[]",
} as const satisfies TypeSchema;

export type type_SlideButton_text_tdl = Mutable<InferType<typeof type_SlideButton_text_tdl_schema>>;
export type type_SlideButton_tdl = Mutable<InferType<typeof type_SlideButton_tdl_schema>>;

export const defaultSlideButtonTdl: type_SlideButton_tdl = {
    type: "SlideButton",
    widgetKey: "",
    key: "",
    style: {
        position: "absolute",
        display: "inline-flex",
        backgroundColor: "rgba(128, 255, 255, 0)",
        left: 100,
        top: 100,
        width: 150,
        height: 80,
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
        boxSizing: "content-box",
    },
    text: {
        horizontalAlign: "flex-start",
        verticalAlign: "flex-start",
        wrapWord: false,
        showUnit: false,
        alarmBorder: true,
        boxWidth: 100,
        text: "Label",
        invisibleInOperation: false,
        confirmOnWrite: false,
        confirmOnWriteUsePassword: false,
        confirmOnWritePassword: "",
        bit: 0,
        useChannelItems: true,
        fallbackColor: "rgba(255,0,255,1)",
        fallbackText: "Wrong State",
    },
    channelNames: [],
    groupNames: [],
    rules: [],
    itemNames: ["ZERO", "ONE"],
    itemColors: ["rgba(60, 100, 60, 1)", "rgba(0, 255, 0, 1)"],
    itemValues: [0, 1],
};

// ======================== ChoiceButton TDL Schema ========================

export const type_ChoiceButton_text_tdl_schema = {
    horizontalAlign: "string",
    verticalAlign: "string",
    wrapWord: "boolean",
    showUnit: "boolean",
    alarmBorder: "boolean",
    selectedBackgroundColor: "string",
    unselectedBackgroundColor: "string",
    invisibleInOperation: "boolean",
    direction: "string",
    appearance: "string",
    alarmText: "boolean",
    alarmBackground: "boolean",
    alarmLevel: "string",
    confirmOnWrite: "boolean",
    confirmOnWriteUsePassword: "boolean",
    confirmOnWritePassword: "string",
    bit: "number",
    useChannelItems: "boolean",
    fallbackColor: "string",
    fallbackText: "string",
} as const satisfies TypeSchema;

export const type_ChoiceButton_tdl_schema = {
    type: "string",
    widgetKey: "string",
    key: "string",
    style: type_style_tdl_schema,
    text: type_ChoiceButton_text_tdl_schema,
    channelNames: "string[]",
    groupNames: "string[]",
    rules: { arrayOf: type_rule_tdl_schema },
    itemNames: "string[]",
    itemColors: "string[]",
    itemValues: "number[]",
} as const satisfies TypeSchema;

export type type_ChoiceButton_text_tdl = Mutable<InferType<typeof type_ChoiceButton_text_tdl_schema>>;
export type type_ChoiceButton_tdl = Mutable<InferType<typeof type_ChoiceButton_tdl_schema>>;

export const defaultChoiceButtonTdl: type_ChoiceButton_tdl = {
    type: "ChoiceButton",
    widgetKey: "",
    key: "",
    style: {
        position: "absolute",
        display: "inline-flex",
        left: 0,
        top: 0,
        width: 100,
        height: 100,
        backgroundColor: "rgba(128, 255, 255, 0)",
        transform: "rotate(0deg)",
        color: "rgba(0,0,0,1)",
        fontFamily: GlobalVariables.defaultFontFamily,
        fontSize: GlobalVariables.defaultFontSize,
        fontStyle: GlobalVariables.defaultFontStyle,
        fontWeight: GlobalVariables.defaultFontWeight,
        borderStyle: "solid",
        borderWidth: 0,
        borderColor: "rgba(0, 0, 0, 1)",
        outlineStyle: "none",
        outlineWidth: 1,
        outlineColor: "black",
        boxSizing: "content-box",
    },
    text: {
        horizontalAlign: "flex-start",
        verticalAlign: "flex-start",
        wrapWord: false,
        showUnit: false,
        alarmBorder: true,
        selectedBackgroundColor: "rgba(218, 218, 218, 1)",
        unselectedBackgroundColor: "rgba(200, 200, 200, 1)",
        invisibleInOperation: false,
        direction: "horizontal",
        appearance: "traditional",
        alarmText: false,
        alarmBackground: false,
        alarmLevel: "MINOR",
        confirmOnWrite: false,
        confirmOnWriteUsePassword: false,
        confirmOnWritePassword: "",
        bit: -1,
        useChannelItems: true,
        fallbackColor: "rgba(255,0,255,1)",
        fallbackText: "Wrong State",
    },
    channelNames: [],
    groupNames: [],
    rules: [],
    itemNames: ["ZERO", "ONE"],
    itemColors: ["rgba(60, 100, 60, 1)", "rgba(0, 255, 0, 1)"],
    itemValues: [0, 1],
};

// ======================== ComboBox TDL Schema ========================

export const type_ComboBox_text_tdl_schema = {
    horizontalAlign: "string",
    alarmBorder: "boolean",
    invisibleInOperation: "boolean",
    alarmText: "boolean",
    alarmBackground: "boolean",
    alarmLevel: "string",
    confirmOnWrite: "boolean",
    confirmOnWriteUsePassword: "boolean",
    confirmOnWritePassword: "string",
    bit: "number",
    useChannelItems: "boolean",
    fallbackColor: "string",
    fallbackText: "string",
} as const satisfies TypeSchema;

export const type_ComboBox_tdl_schema = {
    type: "string",
    widgetKey: "string",
    key: "string",
    style: type_style_tdl_schema,
    text: type_ComboBox_text_tdl_schema,
    channelNames: "string[]",
    groupNames: "string[]",
    rules: { arrayOf: type_rule_tdl_schema },
    itemNames: "string[]",
    itemColors: "string[]",
    itemValues: "number[]",
} as const satisfies TypeSchema;

export type type_ComboBox_text_tdl = Mutable<InferType<typeof type_ComboBox_text_tdl_schema>>;
export type type_ComboBox_tdl = Mutable<InferType<typeof type_ComboBox_tdl_schema>>;

export const defaultComboBoxTdl: type_ComboBox_tdl = {
    type: "ComboBox",
    widgetKey: "",
    key: "",
    style: {
        position: "absolute",
        display: "inline-flex",
        left: 100,
        top: 100,
        width: 150,
        height: 80,
        backgroundColor: "rgba(210, 210, 210, 1)",
        transform: "rotate(0deg)",
        borderStyle: "solid",
        borderWidth: 0,
        borderColor: "rgba(0, 0, 0, 1)",
        color: "rgba(0,0,0,1)",
        fontFamily: GlobalVariables.defaultFontFamily,
        fontSize: GlobalVariables.defaultFontSize,
        fontStyle: GlobalVariables.defaultFontStyle,
        fontWeight: GlobalVariables.defaultFontWeight,
        outlineStyle: "none",
        outlineWidth: 1,
        outlineColor: "black",
        boxSizing: "content-box",
    },
    text: {
        horizontalAlign: "center",
        alarmBorder: true,
        invisibleInOperation: false,
        alarmText: false,
        alarmBackground: false,
        alarmLevel: "MINOR",
        confirmOnWrite: false,
        confirmOnWriteUsePassword: false,
        confirmOnWritePassword: "",
        bit: -1,
        useChannelItems: true,
        fallbackColor: "rgba(255,0,255,1)",
        fallbackText: "Wrong State",
    },
    channelNames: [],
    groupNames: [],
    rules: [],
    itemNames: ["ZERO", "ONE"],
    itemColors: ["rgba(60, 100, 60, 1)", "rgba(0, 255, 0, 1)"],
    itemValues: [0, 1],
};

// ======================== RadioButton TDL Schema ========================

export const type_RadioButton_text_tdl_schema = {
    horizontalAlign: "string",
    verticalAlign: "string",
    wrapWord: "boolean",
    alarmBorder: "boolean",
    boxWidth: "number",
    invisibleInOperation: "boolean",
    alarmText: "boolean",
    alarmBackground: "boolean",
    alarmLevel: "string",
    confirmOnWrite: "boolean",
    confirmOnWriteUsePassword: "boolean",
    confirmOnWritePassword: "string",
    direction: "string",
    bit: "number",
    useChannelItems: "boolean",
    fallbackColor: "string",
    fallbackText: "string",
} as const satisfies TypeSchema;

export const type_RadioButton_tdl_schema = {
    type: "string",
    widgetKey: "string",
    key: "string",
    style: type_style_tdl_schema,
    text: type_RadioButton_text_tdl_schema,
    channelNames: "string[]",
    groupNames: "string[]",
    rules: { arrayOf: type_rule_tdl_schema },
    itemNames: "string[]",
    itemColors: "string[]",
    itemValues: "number[]",
} as const satisfies TypeSchema;

export type type_RadioButton_text_tdl = Mutable<InferType<typeof type_RadioButton_text_tdl_schema>>;
export type type_RadioButton_tdl = Mutable<InferType<typeof type_RadioButton_tdl_schema>>;

export const defaultRadioButtonTdl: type_RadioButton_tdl = {
    type: "RadioButton",
    widgetKey: "",
    key: "",
    style: {
        position: "absolute",
        display: "inline-flex",
        backgroundColor: "rgba(128, 255, 255, 0)",
        left: 100,
        top: 100,
        width: 150,
        height: 80,
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
        boxSizing: "content-box",
    },
    text: {
        horizontalAlign: "flex-start",
        verticalAlign: "flex-start",
        wrapWord: false,
        alarmBorder: true,
        boxWidth: 13,
        invisibleInOperation: false,
        alarmText: false,
        alarmBackground: false,
        alarmLevel: "MINOR",
        confirmOnWrite: false,
        confirmOnWriteUsePassword: false,
        confirmOnWritePassword: "",
        direction: "vertical",
        bit: -1,
        useChannelItems: true,
        fallbackColor: "rgba(255,0,255,0)",
        fallbackText: "Wrong state",
    },
    channelNames: [],
    groupNames: [],
    rules: [],
    itemNames: ["ZERO", "ONE"],
    itemColors: ["rgba(60, 100, 60, 0)", "rgba(0, 255, 0, 0)"],
    itemValues: [0, 1],
};

// ======================== ActionButton TDL Schema ========================

export const type_action_opendisplay_tdl_schema = {
    type: "string",
    label: "string",
    fileName: "string",
    externalMacros: type_macros_tdl_schema,
    useParentMacros: "boolean",
    openInSameWindow: "boolean",
} as const satisfies TypeSchema;

export const type_action_writepv_tdl_schema = {
    type: "string",
    label: "string",
    channelName: "string",
    channelValue: "string",
    confirmOnWrite: "boolean",
    confirmOnWriteUsePassword: "boolean",
    confirmOnWritePassword: "string",
} as const satisfies TypeSchema;

export const type_action_executescript_tdl_schema = {
    type: "string",
    label: "string",
    fileName: "string",
} as const satisfies TypeSchema;

export const type_action_executecommand_tdl_schema = {
    type: "string",
    label: "string",
    command: "string",
    confirmOnWrite: "boolean",
    confirmOnWriteUsePassword: "boolean",
    confirmOnWritePassword: "string",
} as const satisfies TypeSchema;

export const type_action_openwebpage_tdl_schema = {
    type: "string",
    label: "string",
    url: "string",
} as const satisfies TypeSchema;

export const type_action_closedisplaywindow_schema = {
    type: "string",
    label: "string",
    quitTDM: "boolean",
} as const satisfies TypeSchema;

// --- Action Types (Mutable) ---
export type type_action_opendisplay_tdl = Omit<Mutable<InferType<typeof type_action_opendisplay_tdl_schema>>, "externalMacros"> & { externalMacros: type_macros_tdl };
export type type_action_writepv_tdl = Mutable<InferType<typeof type_action_writepv_tdl_schema>>;
export type type_action_executescript_tdl = Mutable<InferType<typeof type_action_executescript_tdl_schema>>;
export type type_action_executecommand_tdl = Mutable<InferType<typeof type_action_executecommand_tdl_schema>>;
export type type_action_openwebpage_tdl = Mutable<InferType<typeof type_action_openwebpage_tdl_schema>>;
export type type_action_closedisplaywindow = Mutable<InferType<typeof type_action_closedisplaywindow_schema>>;

// --- Union Schema and Type ---
export type type_action_tdl =
    | type_action_opendisplay_tdl
    | type_action_writepv_tdl
    | type_action_executescript_tdl
    | type_action_executecommand_tdl
    | type_action_openwebpage_tdl
    | type_action_closedisplaywindow;

export type type_actions_tdl = type_action_tdl[];

export const type_ActionButton_tdl_schema = {
    type: "string",
    widgetKey: "string",
    key: "string",
    style: type_style_tdl_schema,
    text: {
        text: "string",
        appearance: "string",
        horizontalAlign: "string",
        verticalAlign: "string",
        wrapWord: "boolean",
        invisibleInOperation: "boolean",
        alarmBorder: "boolean",
        alarmBackground: "boolean",
        alarmText: "boolean",
        alarmLevel: "string",
    },
    channelNames: "string[]",
    groupNames: "string[]",
    rules: { arrayOf: type_rule_tdl_schema },
    actions: {
        arrayOfUnion: [
            type_action_opendisplay_tdl_schema,
            type_action_writepv_tdl_schema,
            type_action_executescript_tdl_schema,
            type_action_executecommand_tdl_schema,
            type_action_openwebpage_tdl_schema,
            type_action_closedisplaywindow_schema,
        ]
    },
} as const satisfies TypeSchema;

export type type_ActionButton_tdl = Omit<Mutable<InferType<typeof type_ActionButton_tdl_schema>>, "actions"> & { actions: type_actions_tdl };

// --- Default ActionButton TDL ---
export const defaultActionButtonTdl: type_ActionButton_tdl = {
    type: "ActionButton",
    widgetKey: "",
    key: "",
    style: {
        position: "absolute",
        display: "inline-flex",
        left: 100,
        top: 100,
        width: 120,
        height: 40,
        backgroundColor: "rgba(210, 210, 210,1)",
        transform: "rotate(0deg)",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "rgba(0, 0, 0, 1)",
        color: "rgba(0,0,0,1)",
        fontFamily: GlobalVariables.defaultFontFamily,
        fontSize: GlobalVariables.defaultFontSize,
        fontStyle: GlobalVariables.defaultFontStyle,
        fontWeight: GlobalVariables.defaultFontWeight,
        outlineStyle: "none",
        outlineWidth: 1,
        outlineColor: "black",
        boxSizing: "content-box",
    },
    text: {
        text: "Action Button",
        appearance: "traditional",
        horizontalAlign: "center",
        verticalAlign: "center",
        wrapWord: false,
        invisibleInOperation: false,
        alarmBorder: false,
        alarmBackground: false,
        alarmText: false,
        alarmLevel: "MINOR",
    },
    channelNames: [],
    groupNames: [],
    rules: [],
    actions: [],
};
// ======================== Media TDL Schema ========================

export const type_Media_text_tdl_schema = {
    fileName: "string",
    opacity: "number",
    stretchToFit: "boolean",
    invisibleInOperation: "boolean",
    alarmBorder: "boolean",
    alarmBackground: "boolean",
    alarmLevel: "string",
} as const satisfies TypeSchema;

export const type_Media_tdl_schema = {
    type: "string",
    widgetKey: "string",
    key: "string",
    style: type_style_tdl_schema,
    text: type_Media_text_tdl_schema,
    channelNames: "string[]",
    groupNames: "string[]",
    rules: { arrayOf: type_rule_tdl_schema },
} as const satisfies TypeSchema;

export type type_Media_text_tdl = Mutable<InferType<typeof type_Media_text_tdl_schema>>;
export type type_Media_tdl = Mutable<InferType<typeof type_Media_tdl_schema>>;

export const defaultMediaTdl: type_Media_tdl = {
    type: "Media",
    widgetKey: "",
    key: "",
    style: {
        position: "absolute",
        display: "inline-flex",
        left: 0,
        top: 0,
        width: 100,
        height: 100,
        backgroundColor: "rgba(0, 0, 0, 0)",
        transform: "rotate(0deg)",
        color: "rgba(0,0,0,1)",
        borderStyle: "solid",
        borderWidth: 0,
        borderColor: "rgba(0, 0, 0, 1)",
        fontFamily: GlobalVariables.defaultFontFamily,
        fontSize: GlobalVariables.defaultFontSize,
        fontStyle: GlobalVariables.defaultFontStyle,
        fontWeight: GlobalVariables.defaultFontWeight,
        outlineStyle: "none",
        outlineWidth: 1,
        outlineColor: "black",
        boxSizing: "content-box",
    },
    text: {
        fileName: "../../../webpack/resources/webpages/tdm-logo.svg",
        opacity: 1,
        stretchToFit: false,
        invisibleInOperation: false,
        alarmBorder: true,
        alarmBackground: false,
        alarmLevel: "MINOR",
    },
    channelNames: [],
    groupNames: [],
    rules: [],
};

// ======================== DataViewer TDL Schema ========================

export const type_DataViewer_text_tdl_schema = {
    wrapWord: "boolean",
    showUnit: "boolean",
    alarmBorder: "boolean",
    highlightBackgroundColor: "string",
    overflowVisible: "boolean",
    singleWidget: "boolean",
    title: "string",
    updatePeriod: "number",
    axisZoomFactor: "number",
} as const satisfies TypeSchema;

export const type_DataViewer_ticksInfo_schema = {
    scale: type_scale_tdl_schema,
    xValMin: "number",
    xValMax: "number",
    yValMin: "number",
    yValMax: "number",
    xLength: "number",
    yLength: "number",
    numXgrid: "number",
    numYgrid: "number",
    xTickValMin: "number",
    xTickValMax: "number",
    xTickValues: "number[]",
    xTickPositions: "number[]",
    yTickValues: "number[]",
    yTickPositions: "number[]",
    xTickUnit: "string",
} as const satisfies TypeSchema;

export type type_DataViewer_ticksInfo = Mutable<InferType<typeof type_DataViewer_ticksInfo_schema>>;

export const type_DataViewer_yAxis_schema = {
    label: "string",
    valMin: "number",
    valMax: "number",
    lineWidth: "number",
    lineColor: "string",
    show: "boolean",
    bufferSize: "number",
    displayScale: type_scale_tdl_schema,
    xData: "number[]",
    yData: "number[]",
    ticksInfo: type_DataViewer_ticksInfo_schema,
} as const satisfies TypeSchema;

export type type_DataViewer_yAxis = Omit<Mutable<InferType<typeof type_DataViewer_yAxis_schema>>, "displayScale"> & {
    displayScale: type_scale_tdl;
    ticksInfo: type_DataViewer_ticksInfo;
};

export const type_DataViewer_tdl_schema = {
    type: "string",
    widgetKey: "string",
    key: "string",
    style: type_style_tdl_schema,
    text: type_DataViewer_text_tdl_schema,
    channelNames: "string[]",
    groupNames: "string[]",
    rules: { arrayOf: type_rule_tdl_schema },
    yAxes: { arrayOf: type_DataViewer_yAxis_schema },
} as const satisfies TypeSchema;

export type type_DataViewer_text_tdl = Mutable<InferType<typeof type_DataViewer_text_tdl_schema>>;
export type type_DataViewer_tdl = Omit<Mutable<InferType<typeof type_DataViewer_tdl_schema>>, "yAxes"> & {
    yAxes: type_DataViewer_yAxis[];
};

export const defaultDataViewerTicksInfo: type_DataViewer_ticksInfo = {
    scale: "Linear",
    xValMin: 0,
    xValMax: 0,
    yValMin: 0,
    yValMax: 0,
    xLength: 0,
    yLength: 0,
    numXgrid: 0,
    numYgrid: 0,
    xTickValMin: -10,
    xTickValMax: 0,
    xTickValues: [],
    xTickPositions: [],
    yTickValues: [],
    yTickPositions: [],
    xTickUnit: "",
};

export const defaultDataViewerYAxis: type_DataViewer_yAxis = {
    label: "",
    valMin: 0,
    valMax: 10,
    lineWidth: 2,
    lineColor: "rgba(0,0,0,1)",
    show: true,
    bufferSize: 50000,
    displayScale: "Linear",
    xData: [],
    yData: [],
    ticksInfo: structuredClone(defaultDataViewerTicksInfo),
};

export const defaultDataViewerTdl: type_DataViewer_tdl = {
    type: "DataViewer",
    widgetKey: "",
    key: "",
    style: {
        position: "absolute",
        display: "inline-flex",
        backgroundColor: "rgba(255, 255, 255, 1)",
        left: 0,
        top: 0,
        width: 500,
        height: 300,
        outlineStyle: "none",
        outlineWidth: 1,
        outlineColor: "black",
        transform: "rotate(0deg)",
        color: "rgba(0,0,0,1)",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "rgba(0, 0, 0, 1)",
        fontFamily: GlobalVariables.defaultFontFamily,
        fontSize: GlobalVariables.defaultFontSize,
        fontStyle: GlobalVariables.defaultFontStyle,
        fontWeight: GlobalVariables.defaultFontWeight,
        boxSizing: "content-box",
    },
    text: {
        wrapWord: true,
        showUnit: false,
        alarmBorder: true,
        highlightBackgroundColor: "rgba(255, 255, 0, 1)",
        overflowVisible: true,
        singleWidget: false,
        title: "Title",
        updatePeriod: 1,
        axisZoomFactor: 1.25,
    },
    channelNames: [],
    groupNames: [],
    rules: [],
    yAxes: [],
};

// ======================== ProfilesViewer TDL Schema ========================

export const type_ProfilesViewer_style_tdl_schema = {
    position: "string",
    display: "string",
    backgroundColor: "string",
    left: "number",
    top: "number",
    width: ["number", "string"],
    height: ["number", "string"],
    boxSizing: ["string", "undefined"],
    overflow: ["string", "undefined"],
    outlineStyle: "string",
    transform: "string",
    color: "string",
    borderStyle: "string",
    borderWidth: "number",
    borderColor: "string",
} as const satisfies TypeSchema;

export const type_ProfilesViewer_text_tdl_schema = {} as const satisfies TypeSchema;

export const type_ProfilesViewer_tdl_schema = {
    type: "string",
    widgetKey: "string",
    key: "string",
    style: type_ProfilesViewer_style_tdl_schema,
    text: type_ProfilesViewer_text_tdl_schema,
    channelNames: "string[]",
    groupNames: "string[]",
    rules: { arrayOf: type_rule_tdl_schema },
} as const satisfies TypeSchema;

export type type_ProfilesViewer_style_tdl = Mutable<InferType<typeof type_ProfilesViewer_style_tdl_schema>>;
export type type_ProfilesViewer_text_tdl = Record<string, any>;
export type type_ProfilesViewer_tdl = Omit<Mutable<InferType<typeof type_ProfilesViewer_tdl_schema>>, "text"> & {
    text: type_ProfilesViewer_text_tdl;
};

export const defaultProfilesViewerTdl: type_ProfilesViewer_tdl = {
    type: "ProfilesViewer",
    widgetKey: "",
    key: "",
    style: {
        position: "absolute",
        display: "inline-flex",
        backgroundColor: "rgba(255, 255,255, 1)",
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        overflow: "scroll",
        outlineStyle: "none",
        transform: "rotate(0deg)",
        color: "rgba(0,0,0,1)",
        borderStyle: "solid",
        borderWidth: 0,
        borderColor: "rgba(255, 0, 0, 1)",
    },
    text: {},
    channelNames: [],
    groupNames: [],
    rules: [],
};

// ======================== TdlViewer TDL Schema ========================

export const type_TdlViewer_style_tdl_schema = {
    position: "string",
    display: "string",
    backgroundColor: "string",
    left: "number",
    top: "number",
    width: ["number", "string"],
    height: ["number", "string"],
    boxSizing: ["string", "undefined"],
    overflow: ["string", "undefined"],
    outlineStyle: "string",
    transform: "string",
    color: "string",
    borderStyle: "string",
    borderWidth: "number",
    borderColor: "string",
} as const satisfies TypeSchema;

export const type_TdlViewer_text_tdl_schema = {} as const satisfies TypeSchema;

export const type_TdlViewer_tdl_schema = {
    type: "string",
    widgetKey: "string",
    key: "string",
    style: type_TdlViewer_style_tdl_schema,
    text: type_TdlViewer_text_tdl_schema,
    channelNames: "string[]",
    groupNames: "string[]",
    rules: { arrayOf: type_rule_tdl_schema },
} as const satisfies TypeSchema;

export type type_TdlViewer_style_tdl = Mutable<InferType<typeof type_TdlViewer_style_tdl_schema>>;
export type type_TdlViewer_text_tdl = Record<string, any>;
export type type_TdlViewer_tdl = Omit<Mutable<InferType<typeof type_TdlViewer_tdl_schema>>, "text"> & {
    text: type_TdlViewer_text_tdl;
};

export const defaultTdlViewerTdl: type_TdlViewer_tdl = {
    type: "TdlViewer",
    widgetKey: "",
    key: "",
    style: {
        position: "absolute",
        display: "inline-flex",
        backgroundColor: "rgba(255, 255,255, 1)",
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        overflow: "scroll",
        outlineStyle: "none",
        transform: "rotate(0deg)",
        color: "rgba(0,0,0,1)",
        borderStyle: "solid",
        borderWidth: 0,
        borderColor: "rgba(255, 0, 0, 1)",
    },
    text: {},
    channelNames: [],
    groupNames: [],
    rules: [],
};

// ======================== Terminal TDL Schema ========================

export const type_Terminal_style_tdl_schema = {
    position: "string",
    display: "string",
    left: "number",
    top: "number",
    width: ["number", "string"],
    height: ["number", "string"],
    backgroundColor: "string",
    transform: "string",
    borderStyle: "string",
    borderWidth: "number",
    borderColor: "string",
    color: "string",
    fontFamily: "string",
    fontSize: "number",
    fontStyle: "string",
    fontWeight: "string",
    outlineStyle: "string",
    outlineWidth: "number",
    outlineColor: "string",
    boxSizing: ["string", "undefined"],
} as const satisfies TypeSchema;

export const type_Terminal_text_tdl_schema = {
    horizontalAlign: "string",
    verticalAlign: "string",
    wrapWord: "boolean",
    showUnit: "boolean",
    alarmBorder: "boolean",
    invisibleInOperation: "boolean",
    format: "string",
    scale: "number",
} as const satisfies TypeSchema;

export const type_Terminal_tdl_schema = {
    type: "string",
    widgetKey: "string",
    key: "string",
    style: type_Terminal_style_tdl_schema,
    text: type_Terminal_text_tdl_schema,
    channelNames: "string[]",
    groupNames: "string[]",
    rules: { arrayOf: type_rule_tdl_schema },
} as const satisfies TypeSchema;

export type type_Terminal_style_tdl = Mutable<InferType<typeof type_Terminal_style_tdl_schema>>;
export type type_Terminal_text_tdl = Mutable<InferType<typeof type_Terminal_text_tdl_schema>>;
export type type_Terminal_tdl = Mutable<InferType<typeof type_Terminal_tdl_schema>>;

export const defaultTerminalTdl: type_Terminal_tdl = {
    type: "Terminal",
    widgetKey: "",
    key: "",
    style: {
        position: "absolute",
        display: "inline-flex",
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(240, 240, 240, 1)",
        transform: "rotate(0deg)",
        borderStyle: "solid",
        borderWidth: 0,
        borderColor: "rgba(0, 0, 0, 1)",
        color: "rgba(0,0,0,1)",
        fontFamily: "Courier Prime",
        fontSize: 14,
        fontStyle: "normal",
        fontWeight: "normal",
        outlineStyle: "none",
        outlineWidth: 1,
        outlineColor: "black",
        boxSizing: undefined,
    },
    text: {
        horizontalAlign: "flex-start",
        verticalAlign: "flex-start",
        wrapWord: false,
        showUnit: true,
        alarmBorder: true,
        invisibleInOperation: false,
        format: "default",
        scale: 0,
    },
    channelNames: [],
    groupNames: [],
    rules: [],
};

// ======================== SeqGraph TDL Schema ========================

export const type_SeqGraph_style_tdl_schema = {
    position: "string",
    display: "string",
    left: "number",
    top: "number",
    width: ["number", "string"],
    height: ["number", "string"],
    backgroundColor: "string",
    transform: "string",
    borderStyle: "string",
    borderWidth: "number",
    borderColor: "string",
    color: "string",
    fontFamily: "string",
    fontSize: "number",
    fontStyle: "string",
    fontWeight: "string",
    outlineStyle: "string",
    outlineWidth: "number",
    outlineColor: "string",
    boxSizing: ["string", "undefined"],
} as const satisfies TypeSchema;

export const type_SeqGraph_text_tdl_schema = {
    horizontalAlign: "string",
    verticalAlign: "string",
    wrapWord: "boolean",
    showUnit: "boolean",
    alarmBorder: "boolean",
    invisibleInOperation: "boolean",
    format: "string",
    scale: "number",
    seqContent: "string",
    seqFileContent: ["string", "undefined"],
} as const satisfies TypeSchema;

export const type_SeqGraph_tdl_schema = {
    type: "string",
    widgetKey: "string",
    key: "string",
    style: type_SeqGraph_style_tdl_schema,
    text: type_SeqGraph_text_tdl_schema,
    channelNames: "string[]",
    groupNames: "string[]",
    rules: { arrayOf: type_rule_tdl_schema },
    macros: type_macros_tdl_schema,
} as const satisfies TypeSchema;

export type type_SeqGraph_style_tdl = Mutable<InferType<typeof type_SeqGraph_style_tdl_schema>>;
export type type_SeqGraph_text_tdl = Mutable<InferType<typeof type_SeqGraph_text_tdl_schema>>;
export type type_SeqGraph_tdl = Omit<Mutable<InferType<typeof type_SeqGraph_tdl_schema>>, "macros"> & {
    macros: type_macros_tdl;
};

export const defaultSeqGraphTdl: type_SeqGraph_tdl = {
    type: "SeqGraph",
    widgetKey: "",
    key: "",
    style: {
        position: "absolute",
        display: "inline-flex",
        left: 0,
        top: 0,
        width: 500,
        height: 500,
        backgroundColor: "rgba(255, 255, 255, 1)",
        transform: "rotate(0deg)",
        borderStyle: "solid",
        borderWidth: 0,
        borderColor: "rgba(0, 0, 0, 1)",
        color: "rgba(0,0,0,1)",
        fontFamily: GlobalVariables.defaultFontFamily,
        fontSize: GlobalVariables.defaultFontSize,
        fontStyle: GlobalVariables.defaultFontStyle,
        fontWeight: GlobalVariables.defaultFontWeight,
        outlineStyle: "none",
        outlineWidth: 1,
        outlineColor: "black",
        boxSizing: undefined,
    },
    text: {
        horizontalAlign: "flex-start",
        verticalAlign: "flex-start",
        wrapWord: false,
        showUnit: true,
        alarmBorder: true,
        invisibleInOperation: false,
        format: "default",
        scale: 0,
        seqContent: "",
        seqFileContent: undefined,
    },
    channelNames: [],
    groupNames: [],
    rules: [],
    macros: [],
};

// ======================== XYPlot TDL Schema ========================

export const type_XYPlot_ticksInfo_schema = {
    scale: type_scale_tdl_schema,
    xValMin: "number",
    xValMax: "number",
    yValMin: "number",
    yValMax: "number",
    xLength: "number",
    yLength: "number",
    numXgrid: "number",
    numYgrid: "number",
    xTickValues: "number[]",
    xTickPositions: "number[]",
    yTickValues: "number[]",
    yTickPositions: "number[]",
} as const satisfies TypeSchema;

export type type_XYPlot_ticksInfo = Mutable<InferType<typeof type_XYPlot_ticksInfo_schema>>;

export const type_XYPlot_xAxis_schema = {
    label: "string",
    autoScale: "boolean",
    valMin: "number",
    valMax: "number",
    showGrid: "boolean",
    numGrids: "number",
} as const satisfies TypeSchema;

export type type_XYPlot_xAxis = Mutable<InferType<typeof type_XYPlot_xAxis_schema>>;

export const type_XYPlot_yAxis_schema = {
    label: "string",
    valMin: "number",
    valMax: "number",
    lineWidth: "number",
    lineColor: "string",
    lineStyle: "string",
    pointType: "string",
    pointSize: "number",
    showGrid: "boolean",
    autoScale: "boolean",
    numGrids: "number",
    displayScale: type_scale_tdl_schema,
    xData: "number[]",
    yData: "number[]",
    ticksInfo: type_XYPlot_ticksInfo_schema,
} as const satisfies TypeSchema;

export type type_XYPlot_yAxis = Omit<Mutable<InferType<typeof type_XYPlot_yAxis_schema>>, "displayScale"> & {
    displayScale: type_scale_tdl;
    ticksInfo: type_XYPlot_ticksInfo;
};

export const type_XYPlot_text_tdl_schema = {
    showLegend: "boolean",
    showFrame: "boolean",
    invisibleInOperation: "boolean",
} as const satisfies TypeSchema;

export const type_XYPlot_tdl_schema = {
    type: "string",
    widgetKey: "string",
    key: "string",
    style: type_style_tdl_schema,
    text: type_XYPlot_text_tdl_schema,
    channelNames: "string[]",
    groupNames: "string[]",
    rules: { arrayOf: type_rule_tdl_schema },
    xAxis: type_XYPlot_xAxis_schema,
    yAxes: { arrayOf: type_XYPlot_yAxis_schema },
} as const satisfies TypeSchema;

export type type_XYPlot_text_tdl = Mutable<InferType<typeof type_XYPlot_text_tdl_schema>>;
export type type_XYPlot_tdl = Omit<Mutable<InferType<typeof type_XYPlot_tdl_schema>>, "xAxis" | "yAxes"> & {
    xAxis: type_XYPlot_xAxis;
    yAxes: type_XYPlot_yAxis[];
};

export const defaultXYPlotTicksInfo: type_XYPlot_ticksInfo = {
    scale: "Linear",
    xValMin: 0,
    xValMax: 0,
    yValMin: 0,
    yValMax: 0,
    xLength: 0,
    yLength: 0,
    numXgrid: 0,
    numYgrid: 0,
    xTickValues: [],
    xTickPositions: [],
    yTickValues: [],
    yTickPositions: [],
};

export const defaultXYPlotYAxis: type_XYPlot_yAxis = {
    label: `y`,
    valMin: 0,
    valMax: 100,
    lineWidth: 2,
    lineColor: "rgba(0,0,0,1)",
    autoScale: false,
    lineStyle: "solid",
    pointType: "none",
    pointSize: 5,
    showGrid: true,
    numGrids: 5,
    displayScale: "Linear",
    // runtime data
    xData: [],
    yData: [],
    ticksInfo: structuredClone(defaultXYPlotTicksInfo),
}

export const defaultXYPlotTdl: type_XYPlot_tdl = {
    type: "XYPlot",
    widgetKey: "",
    key: "",
    style: {
        position: "absolute",
        display: "inline-flex",
        backgroundColor: "rgba(255, 255, 255, 1)",
        left: 0,
        top: 0,
        width: 500,
        height: 300,
        outlineStyle: "none",
        outlineWidth: 1,
        outlineColor: "black",
        transform: "rotate(0deg)",
        color: "rgba(0,0,0,1)",
        borderStyle: "solid",
        borderWidth: 0,
        borderColor: "rgba(0, 0, 0, 1)",
        fontFamily: GlobalVariables.defaultFontFamily,
        fontSize: GlobalVariables.defaultFontSize,
        fontStyle: GlobalVariables.defaultFontStyle,
        fontWeight: GlobalVariables.defaultFontWeight,
        boxSizing: "content-box",
    },
    text: {
        showLegend: false,
        showFrame: true,
        invisibleInOperation: false,
    },
    channelNames: [],
    groupNames: [],
    rules: [],
    xAxis: {
        label: "x",
        autoScale: false,
        valMin: 0,
        valMax: 100,
        showGrid: true,
        numGrids: 10,
    },
    yAxes: [],
};

// ======================== Probe TDL Schema ========================

export const type_Probe_text_tdl_schema = {
    horizontalAlign: "string",
    verticalAlign: "string",
    wrapWord: "boolean",
    showUnit: "boolean",
    alarmBorder: "boolean",
    highlightBackgroundColor: "string",
    overflowVisible: "boolean",
} as const satisfies TypeSchema;

export const type_Probe_tdl_schema = {
    type: "string",
    widgetKey: "string",
    key: "string",
    style: type_style_tdl_schema,
    text: type_Probe_text_tdl_schema,
    channelNames: "string[]",
    groupNames: "string[]",
    rules: { arrayOf: type_rule_tdl_schema },
} as const satisfies TypeSchema;

export type type_Probe_text_tdl = Mutable<InferType<typeof type_Probe_text_tdl_schema>>;
export type type_Probe_tdl = Mutable<InferType<typeof type_Probe_tdl_schema>>;

export const defaultProbeTdl: type_Probe_tdl = {
    type: "Probe",
    widgetKey: "",
    key: "",
    style: {
        position: "absolute",
        display: "inline-flex",
        backgroundColor: "rgba(255, 255, 255, 1)",
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
        boxSizing: "content-box",
    },
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
};

// ======================== PvTable TDL Schema ========================

export const type_PvTable_style_tdl_schema = {
    position: "string",
    display: "string",
    backgroundColor: "string",
    left: "number",
    top: "number",
    width: ["number", "string"],
    height: ["number", "string"],
    boxSizing: ["string", "undefined"],
    padding: ["string", "number", "undefined"],
    outlineStyle: "string",
    outlineWidth: "number",
    outlineColor: "string",
    transform: "string",
    color: "string",
    borderStyle: "string",
    borderWidth: "number",
    borderColor: "string",
    fontFamily: "string",
    fontSize: "number",
    fontStyle: "string",
    fontWeight: "string",
} as const satisfies TypeSchema;

export const type_PvTable_text_tdl_schema = {
    horizontalAlign: "string",
    verticalAlign: "string",
    wrapWord: "boolean",
    showUnit: "boolean",
    alarmBorder: "boolean",
    highlightBackgroundColor: "string",
    overflowVisible: "boolean",
    channelPropertyNames: "string[]",
} as const satisfies TypeSchema;

export const type_PvTable_tdl_schema = {
    type: "string",
    widgetKey: "string",
    key: "string",
    style: type_PvTable_style_tdl_schema,
    text: type_PvTable_text_tdl_schema,
    channelNames: "string[]",
    groupNames: "string[]",
    rules: { arrayOf: type_rule_tdl_schema },
    macros: type_macros_tdl_schema,
    fieldNames: "string[]",
    channelValues: { arrayOf: ["number", "undefined"] },
    channelSelects: "boolean[]",
} as const satisfies TypeSchema;

export type type_PvTable_style_tdl = Mutable<InferType<typeof type_PvTable_style_tdl_schema>>;
export type type_PvTable_text_tdl = Mutable<InferType<typeof type_PvTable_text_tdl_schema>>;
export type type_PvTable_tdl = Omit<Mutable<InferType<typeof type_PvTable_tdl_schema>>, "macros"> & {
    macros: type_macros_tdl;
};

export const defaultPvTableTdl: type_PvTable_tdl = {
    type: "PvTable",
    widgetKey: "",
    key: "",
    style: {
        position: "absolute",
        display: "inline-flex",
        backgroundColor: "rgba(255, 255,255, 1)",
        left: 0,
        top: 0,
        width: 500,
        height: 500,
        boxSizing: undefined,
        padding: undefined,
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
    fieldNames: ["value", "RTYP", "severity", "time", "units"],
    channelValues: [],
    channelSelects: [],
};

// ======================== Calculator TDL Schema ========================

export const type_Calculator_text_tdl_schema = {
    horizontalAlign: "string",
    verticalAlign: "string",
    wrapWord: "boolean",
    showUnit: "boolean",
    alarmBorder: "boolean",
    invisibleInOperation: "boolean",
    format: "string",
    scale: "number",
} as const satisfies TypeSchema;

export const type_Calculator_tdl_schema = {
    type: "string",
    widgetKey: "string",
    key: "string",
    style: type_style_tdl_schema,
    text: type_Calculator_text_tdl_schema,
    channelNames: "string[]",
    groupNames: "string[]",
    rules: { arrayOf: type_rule_tdl_schema },
} as const satisfies TypeSchema;

export type type_Calculator_text_tdl = Mutable<InferType<typeof type_Calculator_text_tdl_schema>>;
export type type_Calculator_tdl = Mutable<InferType<typeof type_Calculator_tdl_schema>>;

export const defaultCalculatorTdl: type_Calculator_tdl = {
    type: "Calculator",
    widgetKey: "",
    key: "",
    style: {
        position: "absolute",
        display: "inline-flex",
        left: 0,
        top: 0,
        width: 500,
        height: 500,
        backgroundColor: "rgba(240, 240, 240, 1)",
        transform: "rotate(0deg)",
        borderStyle: "solid",
        borderWidth: 0,
        borderColor: "rgba(0, 0, 0, 1)",
        color: "rgba(0,0,0,1)",
        fontFamily: GlobalVariables.defaultFontFamily,
        fontSize: GlobalVariables.defaultFontSize,
        fontStyle: GlobalVariables.defaultFontStyle,
        fontWeight: GlobalVariables.defaultFontWeight,
        outlineStyle: "none",
        outlineWidth: 1,
        outlineColor: "black",
        boxSizing: "content-box",
    },
    text: {
        horizontalAlign: "flex-start",
        verticalAlign: "flex-start",
        wrapWord: false,
        showUnit: true,
        alarmBorder: true,
        invisibleInOperation: false,
        format: "default",
        scale: 0,
    },
    channelNames: [],
    groupNames: [],
    rules: [],
};

// ======================== ChannelGraph TDL Schema ========================

export const type_ChannelGraph_text_tdl_schema = {
    horizontalAlign: "string",
    verticalAlign: "string",
    wrapWord: "boolean",
    showUnit: "boolean",
    alarmBorder: "boolean",
    invisibleInOperation: "boolean",
    format: "string",
    scale: "number",
} as const satisfies TypeSchema;

export const type_ChannelGraph_tdl_schema = {
    type: "string",
    widgetKey: "string",
    key: "string",
    style: type_style_tdl_schema,
    text: type_ChannelGraph_text_tdl_schema,
    channelNames: "string[]",
    groupNames: "string[]",
    rules: { arrayOf: type_rule_tdl_schema },
} as const satisfies TypeSchema;

export type type_ChannelGraph_text_tdl = Mutable<InferType<typeof type_ChannelGraph_text_tdl_schema>>;
export type type_ChannelGraph_tdl = Mutable<InferType<typeof type_ChannelGraph_tdl_schema>>;

export const defaultChannelGraphTdl: type_ChannelGraph_tdl = {
    type: "ChannelGraph",
    widgetKey: "",
    key: "",
    style: {
        position: "absolute",
        display: "inline-flex",
        left: 0,
        top: 0,
        width: 500,
        height: 500,
        backgroundColor: "rgba(255, 255, 255, 1)",
        transform: "rotate(0deg)",
        borderStyle: "solid",
        borderWidth: 0,
        borderColor: "rgba(0, 0, 0, 1)",
        color: "rgba(0,0,0,1)",
        fontFamily: GlobalVariables.defaultFontFamily,
        fontSize: GlobalVariables.defaultFontSize,
        fontStyle: GlobalVariables.defaultFontStyle,
        fontWeight: GlobalVariables.defaultFontWeight,
        outlineStyle: "none",
        outlineWidth: 1,
        outlineColor: "black",
        boxSizing: "content-box",
    },
    text: {
        horizontalAlign: "flex-start",
        verticalAlign: "flex-start",
        wrapWord: false,
        showUnit: true,
        alarmBorder: true,
        invisibleInOperation: false,
        format: "default",
        scale: 0,
    },
    channelNames: [],
    groupNames: [],
    rules: [],
};

// ======================== CaSnooper TDL Schema ========================

export const type_CaSnooper_style_tdl_schema = {
    position: "string",
    display: "string",
    left: "number",
    top: "number",
    width: ["number", "string"],
    height: ["number", "string"],
    backgroundColor: "string",
    transform: "string",
    borderStyle: "string",
    borderWidth: "number",
    borderColor: "string",
    color: "string",
    fontFamily: "string",
    fontSize: "number",
    fontStyle: "string",
    fontWeight: "string",
    outlineStyle: "string",
    outlineWidth: "number",
    outlineColor: "string",
    boxSizing: "string",
    padding: ["string", "number", "undefined"],
} as const satisfies TypeSchema;

export const type_CaSnooper_text_tdl_schema = {
    horizontalAlign: "string",
    verticalAlign: "string",
    wrapWord: "boolean",
    showUnit: "boolean",
    alarmBorder: "boolean",
    highlightBackgroundColor: "string",
    overflowVisible: "boolean",
    channelPropertyNames: "string[]",
    EPICS_CA_SERVER_PORT: "number",
} as const satisfies TypeSchema;

export const type_CaSnooper_tdl_schema = {
    type: "string",
    widgetKey: "string",
    key: "string",
    style: type_CaSnooper_style_tdl_schema,
    text: type_CaSnooper_text_tdl_schema,
    channelNames: "string[]",
    groupNames: "string[]",
    rules: { arrayOf: type_rule_tdl_schema },
    macros: type_macros_tdl_schema,
} as const satisfies TypeSchema;

export type type_CaSnooper_style_tdl = Mutable<InferType<typeof type_CaSnooper_style_tdl_schema>>;
export type type_CaSnooper_text_tdl = Mutable<InferType<typeof type_CaSnooper_text_tdl_schema>>;
export type type_CaSnooper_tdl = Omit<Mutable<InferType<typeof type_CaSnooper_tdl_schema>>, "macros"> & {
    macros: type_macros_tdl;
};

export const defaultCaSnooperTdl: type_CaSnooper_tdl = {
    type: "CaSnooper",
    widgetKey: "",
    key: "",
    style: {
        position: "absolute",
        display: "inline-flex",
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
        boxSizing: "content-box",
        padding: undefined,
    },
    text: {
        horizontalAlign: "flex-start",
        verticalAlign: "flex-start",
        wrapWord: true,
        showUnit: false,
        alarmBorder: true,
        highlightBackgroundColor: "rgba(255, 255, 0, 1)",
        overflowVisible: true,
        channelPropertyNames: [],
        EPICS_CA_SERVER_PORT: 5064,
    },
    channelNames: [],
    groupNames: [],
    rules: [],
    macros: [],
};

// ======================== Casw TDL Schema ========================

export const type_Casw_style_tdl_schema = {
    position: "string",
    display: "string",
    left: "number",
    top: "number",
    width: ["number", "string"],
    height: ["number", "string"],
    backgroundColor: "string",
    transform: "string",
    borderStyle: "string",
    borderWidth: "number",
    borderColor: "string",
    color: "string",
    fontFamily: "string",
    fontSize: "number",
    fontStyle: "string",
    fontWeight: "string",
    outlineStyle: "string",
    outlineWidth: "number",
    outlineColor: "string",
    boxSizing: "string",
    padding: ["string", "number", "undefined"],
} as const satisfies TypeSchema;

export const type_Casw_text_tdl_schema = {
    horizontalAlign: "string",
    verticalAlign: "string",
    wrapWord: "boolean",
    showUnit: "boolean",
    alarmBorder: "boolean",
    highlightBackgroundColor: "string",
    overflowVisible: "boolean",
    channelPropertyNames: "string[]",
    EPICS_CA_REPEATER_PORT: "number",
} as const satisfies TypeSchema;

export const type_Casw_tdl_schema = {
    type: "string",
    widgetKey: "string",
    key: "string",
    style: type_Casw_style_tdl_schema,
    text: type_Casw_text_tdl_schema,
    channelNames: "string[]",
    groupNames: "string[]",
    rules: { arrayOf: type_rule_tdl_schema },
    macros: type_macros_tdl_schema,
} as const satisfies TypeSchema;

export type type_Casw_style_tdl = Mutable<InferType<typeof type_Casw_style_tdl_schema>>;
export type type_Casw_text_tdl = Mutable<InferType<typeof type_Casw_text_tdl_schema>>;
export type type_Casw_tdl = Omit<Mutable<InferType<typeof type_Casw_tdl_schema>>, "macros"> & {
    macros: type_macros_tdl;
};

export const defaultCaswTdl: type_Casw_tdl = {
    type: "Casw",
    widgetKey: "",
    key: "",
    style: {
        position: "absolute",
        display: "inline-flex",
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
        boxSizing: "content-box",
        padding: undefined,
    },
    text: {
        horizontalAlign: "flex-start",
        verticalAlign: "flex-start",
        wrapWord: true,
        showUnit: false,
        alarmBorder: true,
        highlightBackgroundColor: "rgba(255, 255, 0, 1)",
        overflowVisible: true,
        channelPropertyNames: [],
        EPICS_CA_REPEATER_PORT: 5065,
    },
    channelNames: [],
    groupNames: [],
    rules: [],
    macros: [],
};

// ======================== FileBrowser TDL Schema ========================

export const type_FileBrowser_style_tdl_schema = {
    position: "string",
    display: "string",
    left: "number",
    top: "number",
    width: ["number", "string"],
    height: ["number", "string"],
    backgroundColor: "string",
    transform: "string",
    borderStyle: "string",
    borderWidth: "number",
    borderColor: "string",
    color: "string",
    fontFamily: "string",
    fontSize: "number",
    fontStyle: "string",
    fontWeight: "string",
    outlineStyle: "string",
    outlineWidth: "number",
    outlineColor: "string",
} as const satisfies TypeSchema;

export const type_FileBrowser_text_tdl_schema = {
    horizontalAlign: "string",
    verticalAlign: "string",
    wrapWord: "boolean",
    showUnit: "boolean",
    invisibleInOperation: "boolean",
    format: "string",
    scale: "number",
    alarmBorder: "boolean",
    alarmText: "boolean",
    alarmBackground: "boolean",
    alarmLevel: "string",
    path: "string",
    permission: "string",
    modal: "boolean",
} as const satisfies TypeSchema;

export const type_FileBrowser_tdl_schema = {
    type: "string",
    widgetKey: "string",
    key: "string",
    style: type_FileBrowser_style_tdl_schema,
    text: type_FileBrowser_text_tdl_schema,
    channelNames: "string[]",
    groupNames: "string[]",
    rules: { arrayOf: type_rule_tdl_schema },
} as const satisfies TypeSchema;

export type type_FileBrowser_style_tdl = Mutable<InferType<typeof type_FileBrowser_style_tdl_schema>>;
export type type_FileBrowser_text_tdl = Mutable<InferType<typeof type_FileBrowser_text_tdl_schema>>;
export type type_FileBrowser_tdl = Mutable<InferType<typeof type_FileBrowser_tdl_schema>>;

export const defaultFileBrowserTdl: type_FileBrowser_tdl = {
    type: "FileBrowser",
    widgetKey: "",
    key: "",
    style: {
        position: "absolute",
        display: "inline-flex",
        left: 100,
        top: 100,
        width: 100,
        height: 100,
        backgroundColor: "rgba(240, 240, 240, 1)",
        transform: "rotate(0deg)",
        borderStyle: "solid",
        borderWidth: 0,
        borderColor: "rgba(0, 0, 0, 1)",
        color: "rgba(0,0,0,1)",
        fontFamily: GlobalVariables.defaultFontFamily,
        fontSize: GlobalVariables.defaultFontSize,
        fontStyle: GlobalVariables.defaultFontStyle,
        fontWeight: GlobalVariables.defaultFontWeight,
        outlineStyle: "none",
        outlineWidth: 1,
        outlineColor: "black",
    },
    text: {
        horizontalAlign: "flex-start",
        verticalAlign: "flex-start",
        wrapWord: false,
        showUnit: true,
        invisibleInOperation: false,
        format: "default",
        scale: 0,
        alarmBorder: true,
        alarmText: false,
        alarmBackground: false,
        alarmLevel: "MINOR",
        path: "",
        permission: "WRITE",
        modal: false,
    },
    channelNames: [],
    groupNames: [],
    rules: [],
};

// ======================== FileConverter TDL Schema ========================

export const type_FileConverter_style_tdl_schema = {
    position: "string",
    display: "string",
    left: "number",
    top: "number",
    width: ["number", "string"],
    height: ["number", "string"],
    backgroundColor: "string",
    transform: "string",
    borderStyle: "string",
    borderWidth: "number",
    borderColor: "string",
    color: "string",
    fontFamily: "string",
    fontSize: "number",
    fontStyle: "string",
    fontWeight: "string",
    outlineStyle: "string",
    outlineWidth: "number",
    outlineColor: "string",
    boxSizing: ["string", "undefined"],
    padding: ["string", "number", "undefined"],
} as const satisfies TypeSchema;

export const type_FileConverter_text_tdl_schema = {
    horizontalAlign: "string",
    verticalAlign: "string",
    wrapWord: "boolean",
    showUnit: "boolean",
    alarmBorder: "boolean",
    highlightBackgroundColor: "string",
    overflowVisible: "boolean",
    channelPropertyNames: "string[]",
    EPICS_CA_SERVER_PORT: "number",
} as const satisfies TypeSchema;

export const type_FileConverter_tdl_schema = {
    type: "string",
    widgetKey: "string",
    key: "string",
    style: type_FileConverter_style_tdl_schema,
    text: type_FileConverter_text_tdl_schema,
    channelNames: "string[]",
    groupNames: "string[]",
    rules: { arrayOf: type_rule_tdl_schema },
    macros: type_macros_tdl_schema,
} as const satisfies TypeSchema;

export type type_FileConverter_style_tdl = Mutable<InferType<typeof type_FileConverter_style_tdl_schema>>;
export type type_FileConverter_text_tdl = Mutable<InferType<typeof type_FileConverter_text_tdl_schema>>;
export type type_FileConverter_tdl = Omit<Mutable<InferType<typeof type_FileConverter_tdl_schema>>, "macros"> & {
    macros: type_macros_tdl;
};

export const defaultFileConverterTdl: type_FileConverter_tdl = {
    type: "FileConverter",
    widgetKey: "",
    key: "",
    style: {
        position: "absolute",
        display: "inline-flex",
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
        boxSizing: undefined,
        padding: undefined,
    },
    text: {
        horizontalAlign: "flex-start",
        verticalAlign: "flex-start",
        wrapWord: true,
        showUnit: false,
        alarmBorder: true,
        highlightBackgroundColor: "rgba(255, 255, 0, 1)",
        overflowVisible: true,
        channelPropertyNames: [],
        EPICS_CA_SERVER_PORT: 5064,
    },
    channelNames: [],
    groupNames: [],
    rules: [],
    macros: [],
};

// ======================== PvMonitor TDL Schema ========================

export const type_PvMonitor_style_tdl_schema = {
    position: "string",
    display: "string",
    left: "number",
    top: "number",
    width: ["number", "string"],
    height: ["number", "string"],
    backgroundColor: "string",
    transform: "string",
    borderStyle: "string",
    borderWidth: "number",
    borderColor: "string",
    color: "string",
    fontFamily: "string",
    fontSize: "number",
    fontStyle: "string",
    fontWeight: "string",
    outlineStyle: "string",
    outlineWidth: "number",
    outlineColor: "string",
    boxSizing: ["string", "undefined"],
    padding: ["string", "number", "undefined"],
    paddingRight: ["string", "number", "undefined"],
} as const satisfies TypeSchema;

export const type_PvMonitor_text_tdl_schema = {
    horizontalAlign: "string",
    verticalAlign: "string",
    wrapWord: "boolean",
    showUnit: "boolean",
    alarmBorder: "boolean",
    invisibleInOperation: "boolean",
    format: "string",
    scale: "number",
    maxLineNum: "number",
} as const satisfies TypeSchema;

export const type_PvMonitor_tdl_schema = {
    type: "string",
    widgetKey: "string",
    key: "string",
    style: type_PvMonitor_style_tdl_schema,
    text: type_PvMonitor_text_tdl_schema,
    channelNames: "string[]",
    groupNames: "string[]",
    rules: { arrayOf: type_rule_tdl_schema },
} as const satisfies TypeSchema;

export type type_PvMonitor_style_tdl = Mutable<InferType<typeof type_PvMonitor_style_tdl_schema>>;
export type type_PvMonitor_text_tdl = Mutable<InferType<typeof type_PvMonitor_text_tdl_schema>>;
export type type_PvMonitor_tdl = Mutable<InferType<typeof type_PvMonitor_tdl_schema>>;

export const defaultPvMonitorTdl: type_PvMonitor_tdl = {
    type: "PvMonitor",
    widgetKey: "",
    key: "",
    style: {
        position: "absolute",
        display: "inline-flex",
        left: 100,
        top: 100,
        width: 100,
        height: 100,
        backgroundColor: "rgba(255, 255, 255, 1)",
        transform: "rotate(0deg)",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "rgba(0, 0, 0, 1)",
        color: "rgba(0,0,0,1)",
        fontFamily: GlobalVariables.defaultFontFamily,
        fontSize: GlobalVariables.defaultFontSize,
        fontStyle: GlobalVariables.defaultFontStyle,
        fontWeight: GlobalVariables.defaultFontWeight,
        outlineStyle: "none",
        outlineWidth: 1,
        outlineColor: "black",
        boxSizing: undefined,
        padding: undefined,
        paddingRight: undefined,
    },
    text: {
        horizontalAlign: "flex-start",
        verticalAlign: "flex-start",
        wrapWord: false,
        showUnit: true,
        alarmBorder: false,
        invisibleInOperation: false,
        format: "default",
        scale: 0,
        maxLineNum: 5000,
    },
    channelNames: [],
    groupNames: [],
    rules: [],
};

// ======================== LogViewer TDL Schema ========================

export const type_LogViewer_style_tdl_schema = {
    position: "string",
    display: "string",
    left: "number",
    top: "number",
    width: ["number", "string"],
    height: ["number", "string"],
    backgroundColor: "string",
    transform: "string",
    borderStyle: "string",
    borderWidth: "number",
    borderColor: "string",
    color: "string",
    fontFamily: "string",
    fontSize: "number",
    fontStyle: "string",
    fontWeight: "string",
    outlineStyle: "string",
    outlineWidth: "number",
    outlineColor: "string",
    boxSizing: ["string", "undefined"],
    padding: ["string", "number", "undefined"],
    paddingRight: ["string", "number", "undefined"],
    overflow: ["string", "undefined"],
} as const satisfies TypeSchema;

export const type_LogViewer_text_tdl_schema = {
    maxLineNum: "number",
    alarmBorder: ["boolean", "undefined"],
    usePvLimits: ["boolean", "undefined"],
} as const satisfies TypeSchema;

export const type_LogViewer_tdl_schema = {
    type: "string",
    widgetKey: "string",
    key: "string",
    style: type_LogViewer_style_tdl_schema,
    text: type_LogViewer_text_tdl_schema,
    channelNames: "string[]",
    groupNames: "string[]",
    rules: { arrayOf: type_rule_tdl_schema },
} as const satisfies TypeSchema;

export type type_LogViewer_style_tdl = Mutable<InferType<typeof type_LogViewer_style_tdl_schema>>;
export type type_LogViewer_text_tdl = Mutable<InferType<typeof type_LogViewer_text_tdl_schema>>;
export type type_LogViewer_tdl = Mutable<InferType<typeof type_LogViewer_tdl_schema>>;

export const defaultLogViewerTdl: type_LogViewer_tdl = {
    type: "LogViewer",
    widgetKey: "",
    key: "",
    style: {
        position: "absolute",
        display: "inline-flex",
        left: 0,
        top: 0,
        width: 500,
        height: 500,
        backgroundColor: "rgba(255, 255, 255, 1)",
        transform: "rotate(0deg)",
        borderStyle: "solid",
        borderWidth: 0,
        borderColor: "rgba(0, 0, 0, 1)",
        color: "rgba(0,0,0,1)",
        fontFamily: GlobalVariables.defaultFontFamily,
        fontSize: GlobalVariables.defaultFontSize,
        fontStyle: GlobalVariables.defaultFontStyle,
        fontWeight: GlobalVariables.defaultFontWeight,
        outlineStyle: "none",
        outlineWidth: 1,
        outlineColor: "black",
        boxSizing: "border-box",
        padding: undefined,
        paddingRight: undefined,
        overflow: "scroll",
    },
    text: {
        maxLineNum: 5000,
        alarmBorder: undefined,
        usePvLimits: undefined,
    },
    channelNames: [],
    groupNames: [],
    rules: [],
};

// ======================== TextEditor TDL Schema ========================

export const type_TextEditor_text_tdl_schema = {
    fileName: "string",
    fileContent: "string",
} as const satisfies TypeSchema;

export const type_TextEditor_tdl_schema = {
    type: "string",
    widgetKey: "string",
    key: "string",
    style: type_style_tdl_schema,
    text: type_TextEditor_text_tdl_schema,
    channelNames: "string[]",
    groupNames: "string[]",
    rules: { arrayOf: type_rule_tdl_schema },
} as const satisfies TypeSchema;

export type type_TextEditor_text_tdl = Mutable<InferType<typeof type_TextEditor_text_tdl_schema>>;
export type type_TextEditor_tdl = Mutable<InferType<typeof type_TextEditor_tdl_schema>>;

export const defaultTextEditorTdl: type_TextEditor_tdl = {
    type: "TextEditor",
    widgetKey: "",
    key: "",
    style: {
        position: "absolute",
        display: "inline-flex",
        backgroundColor: "rgba(255, 255,255, 1)",
        left: 0,
        top: 0,
        width: 500,
        height: 500,
        boxSizing: "border-box",
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
    text: {
        fileName: "",
        fileContent: "",
    },
    channelNames: [],
    groupNames: [],
    rules: [],
};

// ======================== BinaryImage TDL Schema ========================

export const type_BinaryImage_text_tdl_schema = {
    horizontalAlign: "string",
    verticalAlign: "string",
    wrapWord: "boolean",
    alarmBorder: "boolean",
    invisibleInOperation: "boolean",
    stretchToFit: "boolean",
    opacity: "number",
} as const satisfies TypeSchema;

export const type_BinaryImage_tdl_schema = {
    type: "string",
    widgetKey: "string",
    key: "string",
    style: type_style_tdl_schema,
    text: type_BinaryImage_text_tdl_schema,
    channelNames: "string[]",
    groupNames: "string[]",
    rules: { arrayOf: type_rule_tdl_schema },
} as const satisfies TypeSchema;

export type type_BinaryImage_text_tdl = Mutable<InferType<typeof type_BinaryImage_text_tdl_schema>>;
export type type_BinaryImage_tdl = Mutable<InferType<typeof type_BinaryImage_tdl_schema>>;

export const defaultBinaryImageTdl: type_BinaryImage_tdl = {
    type: "BinaryImage",
    widgetKey: "",
    key: "",
    style: {
        position: "absolute",
        display: "inline-flex",
        left: 100,
        top: 100,
        width: 100,
        height: 100,
        backgroundColor: "rgba(240, 240, 240, 1)",
        transform: "rotate(0deg)",
        borderStyle: "solid",
        borderWidth: 0,
        borderColor: "rgba(0, 0, 0, 1)",
        color: "rgba(0,0,0,1)",
        fontFamily: GlobalVariables.defaultFontFamily,
        fontSize: GlobalVariables.defaultFontSize,
        fontStyle: GlobalVariables.defaultFontStyle,
        fontWeight: GlobalVariables.defaultFontWeight,
        outlineStyle: "none",
        outlineWidth: 1,
        outlineColor: "black",
        boxSizing: "content-box",
    },
    text: {
        horizontalAlign: "flex-start",
        verticalAlign: "flex-start",
        wrapWord: false,
        alarmBorder: true,
        invisibleInOperation: false,
        stretchToFit: false,
        opacity: 1,
    },
    channelNames: [],
    groupNames: [],
    rules: [],
};

// ======================== Image Widget ========================

export const type_Image_roi_schema = {
    xPv: "string",
    yPv: "string",
    widthPv: "string",
    heightPv: "string",
    color: "string",
} as const satisfies TypeSchema;

export type type_Image_roi = Mutable<InferType<typeof type_Image_roi_schema>>;

export const type_Image_text_tdl_schema = {
    horizontalAlign: "string",
    verticalAlign: "string",
    wrapWord: "boolean",
    showUnit: "boolean",
    invisibleInOperation: "boolean",
    format: "string",
    scale: "number",
    alarmBorder: "boolean",
    alarmText: "boolean",
    alarmBackground: "boolean",
    alarmLevel: "string",
    colorMap: "string",
    autoZ: "boolean",
    initialAutoXY: "boolean",
    zMin: "number",
    zMax: "number",
    xMin: "number",
    xMax: "number",
    yMin: "number",
    yMax: "number",
    xLabel: "string",
    yLabel: "string",
} as const satisfies TypeSchema;

export const type_Image_tdl_schema = {
    type: "string",
    widgetKey: "string",
    key: "string",
    style: type_style_tdl_schema,
    text: type_Image_text_tdl_schema,
    channelNames: "string[]",
    groupNames: "string[]",
    rules: { arrayOf: type_rule_tdl_schema },
    regionsOfInterest: { arrayOf: type_Image_roi_schema },
} as const satisfies TypeSchema;

export type type_Image_text_tdl = Mutable<InferType<typeof type_Image_text_tdl_schema>>;
export type type_Image_tdl = Mutable<InferType<typeof type_Image_tdl_schema>>;

export const defaultImageTdl: type_Image_tdl = {
    type: "Image",
    widgetKey: "",
    key: "",
    style: {
        position: "absolute",
        display: "inline-flex",
        left: 100,
        top: 100,
        width: 100,
        height: 100,
        backgroundColor: "rgba(255, 255, 255, 1)",
        transform: "rotate(0deg)",
        borderStyle: "solid",
        borderWidth: 0,
        borderColor: "rgba(0, 0, 0, 1)",
        color: "rgba(0,0,0,1)",
        fontFamily: GlobalVariables.defaultFontFamily,
        fontSize: GlobalVariables.defaultFontSize,
        fontStyle: GlobalVariables.defaultFontStyle,
        fontWeight: GlobalVariables.defaultFontWeight,
        outlineStyle: "none",
        outlineWidth: 1,
        outlineColor: "black",
        boxSizing: "content-box",
    },
    text: {
        horizontalAlign: "flex-start",
        verticalAlign: "flex-start",
        wrapWord: false,
        showUnit: true,
        invisibleInOperation: false,
        format: "default",
        scale: 0,
        alarmBorder: true,
        alarmText: false,
        alarmBackground: false,
        alarmLevel: "MINOR",
        colorMap: "parula",
        autoZ: true,
        initialAutoXY: true,
        zMin: 0,
        zMax: 100,
        xMin: 0,
        xMax: 255,
        yMin: 0,
        yMax: 255,
        xLabel: "X",
        yLabel: "Y",
    },
    channelNames: [],
    groupNames: [],
    rules: [],
    regionsOfInterest: [],
};

// ======================== ErrorBox TDL Schema ========================

export const type_ErrorBox_text_tdl_schema = {} as const satisfies TypeSchema;

export const type_ErrorBox_tdl_schema = {
    type: "string",
    widgetKey: "string",
    key: "string",
    style: type_style_tdl_schema,
    text: type_ErrorBox_text_tdl_schema,
    channelNames: "string[]",
    groupNames: "string[]",
    rules: { arrayOf: type_rule_tdl_schema },
    originalTdl: {},
} as const satisfies TypeSchema;

export type type_ErrorBox_text_tdl = Mutable<InferType<typeof type_ErrorBox_text_tdl_schema>>;
export type type_ErrorBox_tdl = Omit<Mutable<InferType<typeof type_ErrorBox_tdl_schema>>, "originalTdl"> & {
    originalTdl: Record<string, any>;
};

export const defaultErrorBoxTdl: type_ErrorBox_tdl = {
    type: "ErrorBox",
    widgetKey: "",
    key: "",
    style: {
        position: "absolute",
        display: "inline-flex",
        left: 100,
        top: 100,
        width: 100,
        height: 100,
        backgroundColor: "rgba(255,255,255,0)",
        transform: "rotate(0deg)",
        borderStyle: "solid",
        borderWidth: 0,
        borderColor: "rgba(0, 0, 0, 1)",
        color: "rgba(0,0,0,1)",
        fontFamily: GlobalVariables.defaultFontFamily,
        fontSize: GlobalVariables.defaultFontSize,
        fontStyle: GlobalVariables.defaultFontStyle,
        fontWeight: GlobalVariables.defaultFontWeight,
        outlineStyle: "none",
        outlineWidth: 1,
        outlineColor: "black",
        boxSizing: "content-box",
    },
    text: {},
    channelNames: [],
    groupNames: [],
    rules: [],
    originalTdl: {},
};


// ======================== Talhk TDL Schema ========================

export const type_Talhk_style_tdl_schema = {
    position: "string",
    display: "string",
    left: "number",
    top: "number",
    width: ["number", "string"],
    height: ["number", "string"],
    backgroundColor: "string",
    transform: "string",
    borderStyle: "string",
    borderWidth: "number",
    borderColor: "string",
    color: "string",
    fontFamily: "string",
    fontSize: "number",
    fontStyle: "string",
    fontWeight: "string",
    outlineStyle: "string",
    outlineWidth: "number",
    outlineColor: "string",
    boxSizing: ["string", "undefined"],
} as const satisfies TypeSchema;

export const type_Talhk_text_tdl_schema = {
    horizontalAlign: "string",
    verticalAlign: "string",
    wrapWord: "boolean",
    showUnit: "boolean",
    invisibleInOperation: "boolean",
    format: "string",
    scale: "number",
    alarmBorder: "boolean",
    alarmText: "boolean",
    alarmBackground: "boolean",
    alarmLevel: "string",
    serverAddress: "string",
} as const satisfies TypeSchema;

export const type_Talhk_tdl_schema = {
    type: "string",
    widgetKey: "string",
    key: "string",
    style: type_Talhk_style_tdl_schema,
    text: type_Talhk_text_tdl_schema,
    channelNames: "string[]",
    groupNames: "string[]",
    rules: { arrayOf: type_rule_tdl_schema },
} as const satisfies TypeSchema;

export type type_Talhk_style_tdl = Mutable<InferType<typeof type_Talhk_style_tdl_schema>>;
export type type_Talhk_text_tdl = Mutable<InferType<typeof type_Talhk_text_tdl_schema>>;
export type type_Talhk_tdl = Mutable<InferType<typeof type_Talhk_tdl_schema>>;

export const defaultTalhkTdl: type_Talhk_tdl = {
    type: "Talhk",
    widgetKey: "",
    key: "",
    style: {
        position: "absolute",
        display: "inline-flex",
        left: 0,
        top: 0,
        width: 100,
        height: 100,
        backgroundColor: "rgba(0, 0, 0, 0)",
        transform: "rotate(0deg)",
        borderStyle: "solid",
        borderWidth: 0,
        borderColor: "rgba(0, 0, 0, 1)",
        color: "rgba(0,0,0,1)",
        fontFamily: GlobalVariables.defaultFontFamily,
        fontSize: GlobalVariables.defaultFontSize,
        fontStyle: GlobalVariables.defaultFontStyle,
        fontWeight: GlobalVariables.defaultFontWeight,
        outlineStyle: "none",
        outlineWidth: 1,
        outlineColor: "black",
        boxSizing: "content-box",
    },
    text: {
        horizontalAlign: "flex-start",
        verticalAlign: "flex-start",
        wrapWord: false,
        showUnit: true,
        invisibleInOperation: false,
        format: "default",
        scale: 0,
        alarmBorder: true,
        alarmText: false,
        alarmBackground: false,
        alarmLevel: "MINOR",
        serverAddress: "",
    },
    channelNames: [],
    groupNames: [],
    rules: [],
};

export const type_widget_tdl_schema_registry = {
    ActionButton: type_ActionButton_tdl_schema,
    Arc: type_Arc_tdl_schema,
    BinaryImage: type_BinaryImage_tdl_schema,
    BooleanButton: type_BooleanButton_tdl_schema,
    ByteMonitor: type_ByteMonitor_tdl_schema,
    CaSnooper: type_CaSnooper_tdl_schema,
    Calculator: type_Calculator_tdl_schema,
    Casw: type_Casw_tdl_schema,
    ChannelGraph: type_ChannelGraph_tdl_schema,
    CheckBox: type_CheckBox_tdl_schema,
    ChoiceButton: type_ChoiceButton_tdl_schema,
    ComboBox: type_ComboBox_tdl_schema,
    DataViewer: type_DataViewer_tdl_schema,
    EmbeddedDisplay: type_EmbeddedDisplay_tdl_schema,
    ErrorBox: type_ErrorBox_tdl_schema,
    FileBrowser: type_FileBrowser_tdl_schema,
    FileConverter: type_FileConverter_tdl_schema,
    Group: type_Group_tdl_schema,
    Image: type_Image_tdl_schema,
    LED: type_LED_tdl_schema,
    LEDMultiState: type_LEDMultiState_tdl_schema,
    Label: type_Label_tdl_schema,
    LogViewer: type_LogViewer_tdl_schema,
    Media: type_Media_tdl_schema,
    Meter: type_Meter_tdl_schema,
    Polyline: type_Polyline_tdl_schema,
    Probe: type_Probe_tdl_schema,
    ProfilesViewer: type_ProfilesViewer_tdl_schema,
    PvMonitor: type_PvMonitor_tdl_schema,
    PvTable: type_PvTable_tdl_schema,
    RadioButton: type_RadioButton_tdl_schema,
    Rectangle: type_Rectangle_tdl_schema,
    Repeater: type_Repeater_tdl_schema,
    ScaledSlider: type_ScaledSlider_tdl_schema,
    SeqGraph: type_SeqGraph_tdl_schema,
    SlideButton: type_SlideButton_tdl_schema,
    Spinner: type_Spinner_tdl_schema,
    Symbol: type_Symbol_tdl_schema,
    Table: type_Table_tdl_schema,
    Talhk: type_Talhk_tdl_schema,
    Tank: type_Tank_tdl_schema,
    TdlViewer: type_TdlViewer_tdl_schema,
    Terminal: type_Terminal_tdl_schema,
    TextEditor: type_TextEditor_tdl_schema,
    TextEntry: type_TextEntry_tdl_schema,
    TextSymbol: type_TextSymbol_tdl_schema,
    TextUpdate: type_TextUpdate_tdl_schema,
    Thermometer: type_Thermometer_tdl_schema,
    ThumbWheel: type_ThumbWheel_tdl_schema,
    XYPlot: type_XYPlot_tdl_schema,
} as const satisfies Record<string, TypeSchema>;



/**
 * throw an error if verification fails
 */
export function verifyWidgetTdl(tdl: any): void {
    const widgetType = typeof tdl?.type === "string" ? tdl.type : undefined;
    const widgetKey = typeof tdl?.widgetKey === "string" ? tdl.widgetKey : undefined;
    const schema = widgetType === undefined ? undefined : type_widget_tdl_schema_registry[widgetType as keyof typeof type_widget_tdl_schema_registry];

    if (schema === undefined) {
        throw new Error(`No TDL schema registered for widget type ${JSON.stringify(widgetType)}.`);
    }

    const typeCheckError = getTypeCheckError(tdl, schema);
    if (typeCheckError !== undefined) {
        const widgetLabel = [
            widgetType === undefined ? undefined : `type ${JSON.stringify(widgetType)}`,
            widgetKey === undefined ? undefined : `widgetKey ${JSON.stringify(widgetKey)}`,
        ].filter((item): item is string => item !== undefined).join(", ");

        throw new Error(
            `TDL verification failed for ${widgetLabel || "widget"} at "${typeCheckError.path}": expected ${typeCheckError.expected}, got ${typeCheckError.received} (${typeCheckError.valuePreview}).`
        );
    }
}
