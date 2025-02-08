import { DisplayWindowClient } from "../../mainProcess/windows/DisplayWindow/DisplayWindowClient";
import { type_tdl } from "../../mainProcess/file/FileReader";
import {Log} from "../../mainProcess/log/Log";

export class ActionHistory {
	private _tdls: type_tdl[] = [];
	private _displayWindowClient: DisplayWindowClient;
	private _currentTdlIndex = -1;

	constructor(displayWindowClient: DisplayWindowClient) {
		this._displayWindowClient = displayWindowClient;
	}

	// -------------------- tdl -----------------------------

	private _modified: boolean = false;

	/**
	 * Register an undoable action at next index. All actions after the current index are cleared.
	 */
	registerAction = (isInit: boolean = false) => {
        const oldModified = this.getModified();
        if (isInit) {
            this.setModified(false);
        } else {
            this.setModified(true);
        }
        if (oldModified !== this.getModified()) {
            this.getDisplayWindowClient().updateWindowTitle();
        }

        this._currentTdlIndex++;
		this.getTdls().splice(this.getCurrentTdlIndex());
		const newTdl = this.getDisplayWindowClient().generateTdl() as type_tdl;
		this.getTdls().push(newTdl);
		Log.info("Register action ...");
	};

	unpopTdl = (): type_tdl | undefined => {
		this._currentTdlIndex++;
		if (this.getCurrentTdl() === undefined) {
			this._currentTdlIndex--;
			return undefined;
		} else {
			return this.getCurrentTdl();
		}
	};

	popTdl = (): type_tdl | undefined => {
		this._currentTdlIndex--;
		if (this.getCurrentTdl() === undefined) {
			this._currentTdlIndex++;
			return undefined;
		} else {
			return this.getCurrentTdl();
		}
	};

	clearHistory = () => {
		this._currentTdlIndex = -1;
	};

	// ---------------------- getters --------------------------

	getDisplayWindowClient = () => {
		return this._displayWindowClient;
	};

	getTdls = () => {
		return this._tdls;
	};

	getCurrentTdlIndex = () => {
		return this._currentTdlIndex;
	};

	getCurrentTdl = () => {
		return this.getTdls()[this.getCurrentTdlIndex()];
	};

	getModified = () => {
		return this._modified;
	};

	setModified = (newStatus: boolean) => {
		this._modified = newStatus;
	};
}
