/**
 * 
 * 
 * {
 *     "aSub": {
 *         "name": "aSub",
 *         "fields": [
 *             {
 *                 "TYPE": "DBF_STRING",
 *                 "NAME": "NAME",
 *                 "prompt": "Record Name",
 *                 "special": "SPC_NOMOD",
 *                 "size": "61"
 *             },
 *             {
 *                 "TYPE": "DBF_STRING",
 *                 "NAME": "DESC",
 *                 "prompt": "Descriptor",
 *                 "promptgroup": "10 - Common",
 *                 "size": "41"
 *             }
 *         ]
 *     },
 *     "ai": {
 *         "name": "ai",
 *         "fields": [
 *             {
 *                 "TYPE": "DBF_STRING",
 *                 "NAME": "NAME",
 *                 "prompt": "Record Name",
 *                 "special": "SPC_NOMOD",
 *                 "size": "61"
 *             },
 *             {
 *                 "TYPE": "DBF_STRING",
 *                 "NAME": "DESC",
 *                 "prompt": "Descriptor",
 *                 "promptgroup": "10 - Common",
 *                 "size": "41"
 *             }
 *         ]
 *     }
 * }
 * 
 */

import { TypeSchema, InferType, Mutable } from "./type_schema";

export const type_dbd_field_schema = {
    TYPE: "string",
    NAME: "string",
} as const satisfies TypeSchema;

export type type_dbd_field = {
    TYPE: string;
    NAME: string;
    [key: string]: string | undefined;
};

export const type_dbd_record_schema = {
    name: "string",
    fields: { dictionaryOf: type_dbd_field_schema },
} as const satisfies TypeSchema;

export type type_dbd_record = {
    name: string;
    fields: Record<string, type_dbd_field>;
};

// top-level is a dictionary keyed by record type name (e.g. "aSub", "ai")
export const type_dbd_schema = { dictionaryOf: type_dbd_record_schema } as const;
export type type_dbd = Record<string, type_dbd_record>;

/**
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
 *  
 */

export const type_dbd_menu_choice_schema = {
    choiceName: "string",
    choiceContent: "string",
} as const satisfies TypeSchema;

export type type_dbd_menu_choice = {
    choiceName: string;
    choiceContent: string;
};

export const type_dbd_menu_schema = {
    name: "string",
    choices: { arrayOf: type_dbd_menu_choice_schema },
} as const satisfies TypeSchema;

export type type_dbd_menu = {
    name: string;
    choices: type_dbd_menu_choice[];
};

// top-level is a dictionary keyed by menu name (e.g. "aSubLFLG", "aSubEFLG")
export const type_dbd_menus_schema = { dictionaryOf: type_dbd_menu_schema } as const;
export type type_dbd_menus = Record<string, type_dbd_menu>;