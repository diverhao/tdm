import { GlobalVariables } from "../GlobalVariables";
import { TypeSchema, InferType, Mutable } from "./type_schema";

// Re-export schema infra so existing consumers don't break
export { TypeSchema, FieldType, PrimitiveFieldType, ArrayOfSchema, ArrayOfUnionSchema, TupleSchema, ArrayOfTupleSchema, LiteralUnionSchema, InferType, Mutable } from "./type_schema";

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
    itemValues: "number[]",
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
        backgroundColor: "rgba(255,255,255,1)",
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
