
import { getTypeCheckError } from "./type_checker";
import { InferType, Mutable, TypeSchema, typeSchemaAdditionalProperties } from "./type_schema";

// ----------------------- dbd -------------------------

export const type_dbd_field_schema = {
    TYPE: "string",
    NAME: "string",
    [typeSchemaAdditionalProperties]: ["string", "undefined"],
} as const satisfies TypeSchema;

/**
 * Describes one field in an EPICS record definition. `TYPE` and `NAME`
 * identify the field; additional string properties preserve its DBD metadata.
 * It contains required string `TYPE` and `NAME` properties, plus optional
 * string metadata properties keyed by name.
 *
 * @example
 * {
 *     TYPE: "DBF_STRING",
 *     NAME: "DESC",
 *     prompt: "Descriptor",
 *     promptgroup: "10 - Common",
 *     size: "41"
 * }
 */
export type type_dbd_field = Mutable<InferType<typeof type_dbd_field_schema>>;

export const type_dbd_record_schema = {
    name: "string",
    fields: { dictionaryOf: type_dbd_field_schema },
} as const satisfies TypeSchema;

/**
 * Defines one EPICS record type. Its fields are keyed by field name for direct
 * lookup. It contains a string `name` and a `fields` dictionary whose values
 * are `type_dbd_field` objects.
 *
 * @example
 * {
 *     name: "ai",
 *     fields: {
 *         NAME: {
 *             TYPE: "DBF_STRING",
 *             NAME: "NAME",
 *             prompt: "Record Name",
 *             special: "SPC_NOMOD",
 *             size: "61"
 *         },
 *         DESC: {
 *             TYPE: "DBF_STRING",
 *             NAME: "DESC",
 *             prompt: "Descriptor",
 *             promptgroup: "10 - Common",
 *             size: "41"
 *         }
 *     }
 * }
 */
export type type_dbd_record = Mutable<InferType<typeof type_dbd_record_schema>>;

export const type_dbd_records_schema = {
    dictionaryOf: type_dbd_record_schema,
} as const satisfies TypeSchema;

/**
 * Maps EPICS record type names to definitions extracted from EPICS Base DBD
 * files. It is a dictionary with record type names as keys and
 * `type_dbd_record` objects as values.
 *
 * @example
 * {
 *     "aSub": {
 *         "name": "aSub",
 *         "fields": {
 *             "NAME": {
 *                 "TYPE": "DBF_STRING",
 *                 "NAME": "NAME",
 *                 "prompt": "Record Name",
 *                 "special": "SPC_NOMOD",
 *                 "size": "61"
 *             },
 *             "DESC": {
 *                 "TYPE": "DBF_STRING",
 *                 "NAME": "DESC",
 *                 "prompt": "Descriptor",
 *                 "promptgroup": "10 - Common",
 *                 "size": "41"
 *             }
 *         }
 *     },
 *     "ai": {
 *         "name": "ai",
 *         "fields": {
 *             "NAME": {
 *                 "TYPE": "DBF_STRING",
 *                 "NAME": "NAME",
 *                 "prompt": "Record Name",
 *                 "special": "SPC_NOMOD",
 *                 "size": "61"
 *             },
 *             "DESC": {
 *                 "TYPE": "DBF_STRING",
 *                 "NAME": "DESC",
 *                 "prompt": "Descriptor",
 *                 "promptgroup": "10 - Common",
 *                 "size": "41"
 *             }
 *         }
 *     }
 * }
 */
export type type_dbd_records = Mutable<InferType<typeof type_dbd_records_schema>>;

// ----------------------- menu -------------------------

export const type_dbd_menu_choice_schema = {
    choiceName: "string",
    choiceContent: "string",
} as const satisfies TypeSchema;

/**
 * Describes one choice in an EPICS DBD menu. `choiceName` is the symbolic DBD
 * identifier, and `choiceContent` is its corresponding string value.
 * It contains the two string properties `choiceName` and `choiceContent`.
 *
 * @example
 * {
 *     choiceName: "aSubLFLG_IGNORE",
 *     choiceContent: "IGNORE"
 * }
 */
export type type_dbd_menu_choice = Mutable<InferType<typeof type_dbd_menu_choice_schema>>;

export const type_dbd_menu_schema = {
    name: "string",
    choices: { arrayOf: type_dbd_menu_choice_schema },
} as const satisfies TypeSchema;

/**
 * Defines one EPICS DBD menu and its ordered choices. It contains a string
 * `name` and a `choices` array of `type_dbd_menu_choice` objects.
 *
 * @example
 * {
 *     name: "aSubLFLG",
 *     choices: [
 *         {
 *             choiceName: "aSubLFLG_IGNORE",
 *             choiceContent: "IGNORE"
 *         },
 *         {
 *             choiceName: "aSubLFLG_READ",
 *             choiceContent: "READ"
 *         }
 *     ]
 * }
 */
export type type_dbd_menu = Mutable<InferType<typeof type_dbd_menu_schema>>;

export const type_dbd_menus_schema = {
    dictionaryOf: type_dbd_menu_schema,
} as const satisfies TypeSchema;

/**
 * Maps EPICS menu names to definitions extracted from EPICS Base DBD files.
 * It is a dictionary with menu names as keys and `type_dbd_menu` objects as
 * values.
 *
 * @example
 * {
 *     "aSubLFLG": {
 *         "name": "aSubLFLG",
 *         "choices": [
 *             {
 *                 "choiceName": "aSubLFLG_IGNORE",
 *                 "choiceContent": "IGNORE"
 *             },
 *             {
 *                 "choiceName": "aSubLFLG_READ",
 *                 "choiceContent": "READ"
 *             }
 *         ]
 *     },
 *     "aSubEFLG": {
 *         "name": "aSubEFLG",
 *         "choices": [
 *             {
 *                 "choiceName": "aSubEFLG_NEVER",
 *                 "choiceContent": "NEVER"
 *             },
 *             {
 *                 "choiceName": "aSubEFLG_ON_CHANGE",
 *                 "choiceContent": "ON CHANGE"
 *             },
 *             {
 *                 "choiceName": "aSubEFLG_ALWAYS",
 *                 "choiceContent": "ALWAYS"
 *             }
 *         ]
 *     }
 * }
 */
export type type_dbd_menus = Mutable<InferType<typeof type_dbd_menus_schema>>;

// ----------------------- verification -------------------------

const verifyWithDbdSchema = (value: unknown, schema: TypeSchema, label: string): void => {
    const error = getTypeCheckError(value, schema);
    if (error !== undefined) {
        throw new Error(
            `${label} verification failed at "${error.path}": expected ${error.expected}, ` +
            `got ${error.received} (${error.valuePreview}).`
        );
    }
};

/**
 * Throws if `value` is not a valid EPICS record definition.
 */
export function verifyDbdRecord(value: unknown): asserts value is type_dbd_record {
    verifyWithDbdSchema(value, type_dbd_record_schema, "DBD record");
}

/**
 * Throws if `value` is not a dictionary of valid EPICS record definitions.
 */
export function verifyDbdRecords(value: unknown): asserts value is type_dbd_records {
    verifyWithDbdSchema(value, type_dbd_records_schema, "DBD record definitions");
}

/**
 * Throws if `value` is not a valid EPICS menu definition.
 */
export function verifyDbdMenu(value: unknown): asserts value is type_dbd_menu {
    verifyWithDbdSchema(value, type_dbd_menu_schema, "DBD menu");
}

/**
 * Throws if `value` is not a dictionary of valid EPICS menu definitions.
 */
export function verifyDbdMenus(value: unknown): asserts value is type_dbd_menus {
    verifyWithDbdSchema(value, type_dbd_menus_schema, "DBD menus");
}
