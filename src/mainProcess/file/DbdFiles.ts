import fs from "fs";
import path from "path";
import { FileReader } from "./FileReader";

export class DbdFiles {
	private _recordTypes: Record<string, any> = {};
	private _menus: Record<string, Record<string, any>> = {};
	constructor() {
		this.readAllDbdFiles();
	}

	readAllDbdFiles = () => {
		// this folder contains *Record.dbd, dbCommon.dbd, and menu*.dbd from EPICS base 7.0.4.1
		const dbdDir = path.join(__dirname, "../../common/resources/dbd/");
		const fileNames = fs.readdirSync(dbdDir);
		for (let fileNameRaw of fileNames) {
			const fileName = path.join(dbdDir, fileNameRaw);
			if (fileName.endsWith(".dbd")) {
				// only read *Record.dbd and menu*.dbd
				if (fileName.includes("Record") || path.basename(fileName).startsWith("menu")) {
					const result = FileReader.readRecordTypeDbdFile(fileName);
					for (let menu of result["menus"]) {
						const name = menu["name"];
						this.getMenus()[name] = menu;
					}
					for (let recordType of result["recordTypes"]) {
						const name = recordType["name"];
						this.getRecordTypes()[name] = recordType;
					}
				}
			}
		}
	};

	getRecordTypes = () => {
		return this._recordTypes;
	};
	getMenus = () => {
		return this._menus;
	};
}
