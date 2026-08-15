import { type_dbd_field, type_dbd_menus, type_dbd_record, type_dbd_records } from "./types/type_dbd";

/**
 * Represents the parsed contents of the bundled EPICS Base DBD files.
 *
 * The class stores two sets of data:
 *  - record-type definitions
 *  - menu definitions
 *
 * It provides methods for looking up records, fields, link fields, menu choices,
 * and field defaults.
 *
 * This class is shared by the main and renderer processes. The main process owns
 * one instance, and each Probe or ChannelGraph utility window owns another.
 *
 * In the main process, the file reader reads the DBD files bundled with the
 * software and uses their parsed definitions to create a `Dbd` instance.
 *
 * In the renderer process, a utility window requests DBD information from the
 * main process when needed. The main process then sends a copy of the definitions
 * to that renderer process.
 */
export class Dbd {
    private _records: type_dbd_records = {};
    private _menus: type_dbd_menus = {};
    constructor(records: type_dbd_records, menus: type_dbd_menus) {
        this._records = records;
        this._menus = menus;
    }

    // ---------------- DBF_LINK field names getters -----------------------

    /**
     * Returns the input-link field names defined by an EPICS record type.
     *
     * @param recordName The record type name, such as `ai` or `calc`.
     * @returns Names of fields whose type is `DBF_INLINK`, or an empty array
     * if the record type is not found or has no input-link fields.
     */
    getRecordInLinkFieldNames = (recordName: string): string[] => {
        const result: string[] = [];
        const data = this.getRecords()[recordName];
        if (data !== undefined) {
            for (let field of Object.values(data["fields"])) {
                if (field["TYPE"] === "DBF_INLINK") {
                    result.push(field["NAME"]);
                }
            }
        }
        return result;
    }

    /**
     * Returns the output-link field names defined by an EPICS record type.
     *
     * @param recordName The record type name, such as `ai` or `calc`.
     * @returns Names of fields whose type is `DBF_OUTLINK`, or an empty array
     * if the record type is not found or has no output-link fields.
     */
    getRecordOutLinkFieldNames = (recordName: string): string[] => {
        const result: string[] = [];
        const data = this.getRecords()[recordName];
        if (data !== undefined) {
            for (let field of Object.values(data["fields"])) {
                if (field["TYPE"] === "DBF_OUTLINK") {
                    result.push(field["NAME"]);
                }
            }
        }
        return result;
    }

    /**
     * Returns the forward-link field names defined by an EPICS record type.
     *
     * @param recordName The record type name, such as `ai` or `calc`.
     * @returns Names of fields whose type is `DBF_FWDLINK`, or an empty array
     * if the record type is not found or has no forward-link fields.
     */
    getRecordFwdLinkFieldNames = (recordName: string): string[] => {
        const result: string[] = [];
        const data = this.getRecords()[recordName];
        if (data !== undefined) {
            for (let field of Object.values(data["fields"])) {
                if (field["TYPE"] === "DBF_FWDLINK") {
                    result.push(field["NAME"]);
                }
            }
        }
        return result;
    }


    // ------------------ record getters -------------------

    /**
     * Returns an EPICS record definition by name.
     *
     * @param recordName The record type name, such as `ai` or `calc`.
     * @returns The matching record definition, or `undefined` if it is not found.
     */
    getRecord = (recordName: string): type_dbd_record | undefined => {
        return this.getRecords()[recordName];
    }

    // ------------------ field getters -------------------

    /**
     * Returns the field names defined by an EPICS record type.
     *
     * @param recordName The record type name, such as `ai` or `calc`.
     * @returns The record's field names, or an empty array if the record is not found.
     */
    getFieldNames = (recordName: string) => {
        const record = this.getRecord(recordName);
        if (record === undefined) {
            return [];
        };
        const fields = record["fields"];
        if (fields === undefined) {
            return [];
        } else {
            return Object.keys(fields);
        }
    }

    /**
     * Returns a field definition from an EPICS record type.
     *
     * @param recordName The record type name, such as `ai` or `calc`.
     * @param fieldName The field name, such as `VAL` or `INP`.
     * @returns The matching field definition, or `undefined` if it is not found.
     */
    getField = (recordName: string, fieldName: string): type_dbd_field | undefined => {
        const record = this.getRecord(recordName);
        if (record === undefined) {
            return undefined;
        }
        const fields = record["fields"];
        return fields[fieldName];
    }

    /**
     * Returns the DBD data type of a record field.
     *
     * @param recordName The record type name, such as `ai` or `calc`.
     * @param fieldName The field name, such as `VAL` or `INP`.
     * @returns The field's `TYPE` value, or an empty string if the field is not found.
     */
    getFieldType = (recordName: string, fieldName: string): string => {
        const field = this.getField(recordName, fieldName);
        if (field !== undefined) {
            return field["TYPE"];
        } else {
            return "";
        }
    }

    /**
     * Returns the choices associated with a menu-valued record field.
     *
     * @param recordName The record type name, such as `bo` or `mbbi`.
     * @param fieldName The name of a `DBF_MENU` field.
     * @returns The menu's choice values, or an empty array if the field has no menu.
     */
    getFieldMenu = (recordName: string, fieldName: string): string[] => {
        const field = this.getField(recordName, fieldName);
        if (field === undefined) {
            return [];
        }
        const fieldType = field["TYPE"];
        const menuName = field["menu"];
        if (menuName !== undefined && fieldType === "DBF_MENU") {
            const choices = this.getMenuChoices(menuName);
            return choices;
        }
        return [];
    }

    /**
     * Returns the default value used when creating a record field value.
     *
     * @param recordName The record type name, such as `ai` or `bo`.
     * @param fieldName The field name, such as `VAL` or `ZNAM`.
     * @returns The first menu choice for a `DBF_MENU` field; otherwise, an empty string.
     */
    getFieldDefaultValue = (recordName: string, fieldName: string) => {
        const field = this.getField(recordName, fieldName);
        if (field === undefined) {
            return "";
        }
        const fieldType = field["TYPE"];
        if (fieldType === "DBF_MENU") {
            const menuName = field["menu"];
            if (menuName !== undefined) {
                const choices = this.getMenuChoices(menuName);
                if (choices.length > 0) {
                    return choices[0];
                } else {
                    return "";
                }
            } else {
                return "";
            }
        } else if (["DBF_FWDLINK", "DBF_INLINK", "DBF_OUTLINK", "DBF_DEVICE", "DBF_STRING"].includes(fieldType)) {
            // string
            return "";
        } else if (fieldType === "DBF_NOACCESS") {
            // do nothing
            return ""
        } else {
            // number
            return "";
        }
    }

    /**
     * Checks whether a record field contains an EPICS link.
     *
     * @param recordName The record type name, such as `ai` or `calc`.
     * @param fieldName The field name, such as `INP`, `OUT`, or `FLNK`.
     * @returns `true` for `DBF_INLINK`, `DBF_OUTLINK`, or `DBF_FWDLINK`; otherwise, `false`.
     */
    fieldIsLink = (recordName: string, fieldName: string) => {
        const field = this.getField(recordName, fieldName);
        if (field === undefined) {
            return false;
        }
        const fieldType = field["TYPE"];
        if (["DBF_FWDLINK", "DBF_INLINK", "DBF_OUTLINK"].includes(fieldType)) {
            // string
            return true;
        } else {
            return false;
        }
    }
    // ---------------- menu getters -------------------

    /**
     * Returns the display values defined by an EPICS menu.
     *
     * @param menuName The menu definition name, such as `menuYesNo`.
     * @returns The menu's choice values in declaration order, or an empty
     * array if the menu is not found.
     */
    getMenuChoices = (menuName: string): string[] => {
        const result: string[] = [];
        const menu = this.getMenus()[menuName];
        if (menu !== undefined) {
            for (let choice of menu["choices"]) {
                result.push(choice["choiceContent"]);
            }
        }
        return result;
    };

    // ----------------- getters ----------------------

    // getters and setters
    getRecords = () => {
        return this._records;
    };
    getMenus = () => {
        return this._menus;
    };

    setRecords = (newTypes: type_dbd_records) => {
        this._records = newTypes;
    };
    setMenus = (newMenus: type_dbd_menus) => {
        this._menus = newMenus;
    };
    
}
