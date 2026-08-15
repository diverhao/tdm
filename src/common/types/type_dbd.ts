
// ----------------------- dbd -------------------------

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
export type type_dbd_field = {
    TYPE: string;
    NAME: string;
    [key: string]: string | undefined; // not actively used, but keep the info
};

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
export type type_dbd_record = {
    name: string;
    fields: Record<string, type_dbd_field>;
};

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
export type type_dbd = Record<string, type_dbd_record>;

// ----------------------- menu -------------------------

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
export type type_dbd_menu_choice = {
    choiceName: string;
    choiceContent: string;
};

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
export type type_dbd_menu = {
    name: string;
    choices: type_dbd_menu_choice[];
};

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
export type type_dbd_menus = Record<string, type_dbd_menu>;
