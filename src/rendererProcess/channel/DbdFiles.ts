import { type_dbd, type_dbd_field, type_dbd_menus, type_dbd_record } from "../../common/types/type_dbd";

export class DbdFiles {
    private _recordTypes: type_dbd = {};
    private _menus: type_dbd_menus = {};
    constructor(recordTypes: type_dbd, menus: type_dbd_menus) {
        this._recordTypes = recordTypes;
        this._menus = menus;
    }

    getRecordTypeInLinkFieldNames = (recordType: string) => {
        const result: string[] = [];
        const data = this.getRecordTypes()[recordType];
        if (data !== undefined) {
            for (let field of Object.values(data["fields"])) {
                if (field["TYPE"] === "DBF_INLINK") {
                    result.push(field["NAME"]);
                }
            }
        }
        return result;
    }

    getRecordTypeOutLinkFieldNames = (recordType: string) => {
        const result: string[] = [];
        const data = this.getRecordTypes()[recordType];
        if (data !== undefined) {
            for (let field of Object.values(data["fields"])) {
                if (field["TYPE"] === "DBF_OUTLINK") {
                    result.push(field["NAME"]);
                }
            }
        }
        return result;
    }

    getRecordTypeFwdLinkFieldNames = (recordType: string) => {
        const result: string[] = [];
        const data = this.getRecordTypes()[recordType];
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

    getRecordType = (recordTypeName: string): type_dbd_record | undefined => {
        return this.getRecordTypes()[recordTypeName];
    }

    // ------------------ field getters -------------------

    getFieldNames = (recordTypeName: string) => {
        const recordType = this.getRecordType(recordTypeName);
        if (recordType === undefined) {
            return [];
        };
        const fields = recordType["fields"];
        if (fields === undefined) {
            return [];
        } else {
            return Object.keys(fields);
        }
    }

    getField = (recordTypeName: string, fieldName: string): type_dbd_field | undefined => {
        const recordType = this.getRecordType(recordTypeName);
        if (recordType === undefined) {
            return undefined;
        }
        const fields = recordType["fields"];
        return fields[fieldName];
    }

    getFieldType = (recordTypeName: string, fieldName: string): string => {
        const field = this.getField(recordTypeName, fieldName);
        if (field !== undefined) {
            return field["TYPE"];
        } else {
            return "";
        }
    }

    getFieldMenu = (recordTypeName: string, fieldName: string): string[] => {
        const field = this.getField(recordTypeName, fieldName);
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

    getFieldDefaultValue = (recordTypeName: string, fieldName: string) => {
        const field = this.getField(recordTypeName, fieldName);
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

    fieldIsLink = (recordTypeName: string, fieldName: string) => {
        const field = this.getField(recordTypeName, fieldName);
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
    getRecordTypes = () => {
        return this._recordTypes;
    };
    getMenus = () => {
        return this._menus;
    };

    setRecordTypes = (newTypes: type_dbd) => {
        this._recordTypes = newTypes;
    };
    setMenus = (newMenus: type_dbd_menus) => {
        this._menus = newMenus;
    };
    
}
