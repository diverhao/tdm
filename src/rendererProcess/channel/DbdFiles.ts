import { type_dbd, type_dbd_menus } from "../../common/types/type_dbd";

export class DbdFiles {
	private _recordTypes: type_dbd = {};
	private _menus: type_dbd_menus = {};
	constructor(recordTypes: type_dbd, menus: type_dbd_menus) {

        this._recordTypes = recordTypes;
		this._menus = menus;
	}

	// get field names of a record type, excluding the DBF_NOACCESS fields
	getRecordTypeFieldNames = (recrodType: string, type: "all" | "readable" = "readable"): string[] => {
		const result: string[] = [];
		const data = this.getRecordTypes()[recrodType];
		if (data !== undefined) {
			for (let field of data["fields"]) {
				if (field["TYPE"] !== "DBF_NOACCESS") {
					result.push(field["NAME"]);
				}
			}
		}
		return result;
	};


    getRecordTypeInLinkFieldNames = (recordType: string) => {
		const result: string[] = [];
		const data = this.getRecordTypes()[recordType];
		if (data !== undefined) {
			for (let field of data["fields"]) {
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
			for (let field of data["fields"]) {
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
			for (let field of data["fields"]) {
				if (field["TYPE"] === "DBF_FWDLINK") {
					result.push(field["NAME"]);
				}
			}
		}
		return result;
    }

	// get all choices of a menu
	getMenuChoices = (menu: string): string[] => {
		const result: string[] = [];
		const data = this.getMenus()[menu];
		if (data !== undefined) {
			for (let choice of data["choices"]) {
				result.push(choice["choiceContent"]);
			}
		}
		return result;
	};

    // get the menu for each field in a record type, if this field is not a DBF_MENU type, the corresponding value is undefined
	getRecordTypeFieldMenus = (recrodType: string, type: "all" | "readable" = "readable"): (undefined | string[])[] => {
		const result: (undefined | string[])[] = [];
		const data = this.getRecordTypes()[recrodType];
		if (data !== undefined) {
			for (let field of data["fields"]) {
				if (field["TYPE"] === "DBF_MENU") {
					const menuName = field["menu"];
					if (menuName !== undefined) {
						const choices = this.getMenuChoices(menuName);
						result.push(choices);
					} else {
						result.push(undefined);
					}
				} else if (field["TYPE"] === "DBF_NOACCESS") {
					// do nothing
				} else {
					result.push(undefined);
				}
			}
		}
		return result;
	};


    // get the default value for each field of a record type, the default value is either a number or (empty) string
	getRecordTypeFieldDefaultValues = (recrodType: string, type: "all" | "readable" = "readable"): (number | string)[] => {
		const result: (number | string)[] = [];
		const data = this.getRecordTypes()[recrodType];
		if (data !== undefined) {
			for (let field of data["fields"]) {
				if (type === "readable") {
					if (field["TYPE"] === "DBF_MENU") {
						const menuName = field["menu"];
						if (menuName !== undefined) {
							const choices = this.getMenuChoices(menuName);
							if (choices.length > 0) {
								result.push(choices[0]);
							} else {
								result.push("");
							}
						} else {
							result.push("");
						}
					} else if (["DBF_FWDLINK", "DBF_INLINK", "DBF_OUTLINK", "DBF_DEVICE", "DBF_STRING"].includes(field["TYPE"])) {
						// string
						result.push("");
					} else if (field["TYPE"] === "DBF_NOACCESS") {
						// do nothing
					} else {
						// number
						result.push(0);
					}
				}
			}
		}
		return result;
	};

    // get a list where each element indicates if the field in a record type is link or not
    // a link may be "DBF_INLINK", "DBF_OUTLINK" or "DBF_FWDLINK"
	getRecordTypeFieldIsLink = (recrodType: string, type: "all" | "readable" = "readable"): boolean[] => {
		const result: boolean[] = [];
		const data = this.getRecordTypes()[recrodType];
		if (data !== undefined) {
			for (let field of data["fields"]) {
				if (field["TYPE"].includes("LINK")) {
					result.push(true);
				} else if (field["TYPE"] === "DBF_NOACCESS") {
					// do nothing
				} else {
					// number
					result.push(false);
				}
			}
		}
		return result;
	};

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
