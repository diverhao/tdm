import { type_dbd_field, type_dbd_menus, type_dbd_record, type_dbd_records } from "./types/type_dbd";

/**
 * Represents the parsed contents of the bundled EPICS Base DBD files.
 *
 * The class stores record-type and menu definitions, rather than raw file
 * contents, in dictionaries keyed by name. It provides lookups for records,
 * fields, link fields, menu choices, and field defaults, and is shared by the
 * main and renderer processes.
 */
export class Dbd {
    private _records: type_dbd_records = {};
    private _menus: type_dbd_menus = {};
    constructor(records: type_dbd_records, menus: type_dbd_menus) {
        this._records = records;
        this._menus = menus;
    }

    getRecordInLinkFieldNames = (record: string) => {
        const result: string[] = [];
        const data = this.getRecords()[record];
        if (data !== undefined) {
            for (let field of Object.values(data["fields"])) {
                if (field["TYPE"] === "DBF_INLINK") {
                    result.push(field["NAME"]);
                }
            }
        }
        return result;
    }

    getRecordOutLinkFieldNames = (record: string) => {
        const result: string[] = [];
        const data = this.getRecords()[record];
        if (data !== undefined) {
            for (let field of Object.values(data["fields"])) {
                if (field["TYPE"] === "DBF_OUTLINK") {
                    result.push(field["NAME"]);
                }
            }
        }
        return result;
    }

    getRecordFwdLinkFieldNames = (record: string) => {
        const result: string[] = [];
        const data = this.getRecords()[record];
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

    getRecord = (recordName: string): type_dbd_record | undefined => {
        return this.getRecords()[recordName];
    }

    // ------------------ field getters -------------------

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

    getField = (recordName: string, fieldName: string): type_dbd_field | undefined => {
        const record = this.getRecord(recordName);
        if (record === undefined) {
            return undefined;
        }
        const fields = record["fields"];
        return fields[fieldName];
    }

    getFieldType = (recordName: string, fieldName: string): string => {
        const field = this.getField(recordName, fieldName);
        if (field !== undefined) {
            return field["TYPE"];
        } else {
            return "";
        }
    }

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

    // get all choices of a menu
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
