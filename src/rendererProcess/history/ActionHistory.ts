import { DisplayWindowClient } from "../windows/DisplayWindow/DisplayWindowClient";
import { type_tdl } from "../../common/GlobalVariables";
import { Log } from "../../common/Log";

/**
 * Describes what changed for a single widget between two history entries.
 * - `before === null`: the widget was newly added in this action (did not exist before).
 * - `after  === null`: the widget was deleted in this action.
 * - both non-null:     the widget was modified.
 */
type WidgetPatch = {
	widgetKey: string;
	before: Record<string, any> | null;
	after: Record<string, any> | null;
};

export class ActionHistory {
	private _displayWindowClient: DisplayWindowClient;
	private _modified = false;

	/**
	 * Per-action patch sets.
	 * `_patchSets[0]` is always empty — it is the baseline sentinel.
	 * `_patchSets[i]` for i ≥ 1 holds the widget diffs going from state i-1 → state i.
	 */
	private _patchSets: WidgetPatch[][] = [];

	/** Current position within `_patchSets`. -1 when history is empty. */
	private _currentIndex = -1;

	/**
	 * The fully-materialized TDL at `_currentIndex`.
	 * Updated incrementally on every undo/redo so reconstruction is
	 * O(changed widgets) rather than O(all widgets).
	 */
	private _currentMaterialized: type_tdl | undefined = undefined;

	constructor(displayWindowClient: DisplayWindowClient) {
		this._displayWindowClient = displayWindowClient;
	}

	// -------------------- tdl -----------------------------

	/**
	 * Register an undoable action. Diffs the current display TDL against the
	 * previous snapshot and stores only the changed widgets, rather than a full
	 * deep-clone of the entire display on every edit.
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

		// Truncate the redo stack (all entries after current position)
		this._patchSets.splice(this._currentIndex + 1);
		this._currentIndex++;

		const newTdl = this.getDisplayWindowClient().getDisplayWindowFile().generateTdl() as type_tdl;

		if (this._currentMaterialized === undefined) {
			// Baseline: no previous state to diff against — push empty sentinel
			this._patchSets.push([]);
		} else {
			const patches: WidgetPatch[] = [];
			const prevKeys = new Set(Object.keys(this._currentMaterialized));
			const newKeys = new Set(Object.keys(newTdl));

			for (const key of newKeys) {
				if (!prevKeys.has(key)) {
					// Widget was added
					patches.push({ widgetKey: key, before: null, after: newTdl[key] });
				} else if (
					JSON.stringify(newTdl[key]) !==
					JSON.stringify(this._currentMaterialized[key])
				) {
					// Widget was modified
					patches.push({
						widgetKey: key,
						before: this._currentMaterialized[key],
						after: newTdl[key],
					});
				}
			}
			for (const key of prevKeys) {
				if (!newKeys.has(key)) {
					// Widget was deleted
					patches.push({
						widgetKey: key,
						before: this._currentMaterialized[key],
						after: null,
					});
				}
			}

			this._patchSets.push(patches);
			Log.info(
				`Register action ... ${patches.length} widget(s) changed, history depth: ${this._currentIndex + 1}`
			);
		}

		this._currentMaterialized = newTdl;
	};

	/**
	 * Undo: reconstruct and return the previous TDL by applying inverse patches.
	 * Returns `undefined` when already at the initial state.
	 */
	popTdl = (): type_tdl | undefined => {
		if (this._currentIndex <= 0 || this._currentMaterialized === undefined) {
			return undefined;
		}

		// Shallow-copy the current materialized TDL, then revert changed widgets
		const prevTdl = { ...this._currentMaterialized } as type_tdl;
		for (const patch of this._patchSets[this._currentIndex]) {
			if (patch.before === null) {
				// Widget was added in this action → remove it to go back
				delete (prevTdl as Record<string, any>)[patch.widgetKey];
			} else {
				// Widget was modified or deleted → restore the before state
				(prevTdl as Record<string, any>)[patch.widgetKey] = patch.before;
			}
		}

		this._currentIndex--;
		this._currentMaterialized = prevTdl;
		return prevTdl;
	};

	/**
	 * Redo: reconstruct and return the next TDL by re-applying forward patches.
	 * Returns `undefined` when already at the latest state.
	 */
	unpopTdl = (): type_tdl | undefined => {
		if (
			this._currentIndex >= this._patchSets.length - 1 ||
			this._currentMaterialized === undefined
		) {
			return undefined;
		}

		this._currentIndex++;
		const nextTdl = { ...this._currentMaterialized } as type_tdl;
		for (const patch of this._patchSets[this._currentIndex]) {
			if (patch.after === null) {
				// Widget was deleted in this action → remove it
				delete (nextTdl as Record<string, any>)[patch.widgetKey];
			} else {
				// Widget added or modified → apply the after state
				(nextTdl as Record<string, any>)[patch.widgetKey] = patch.after;
			}
		}

		this._currentMaterialized = nextTdl;
		return nextTdl;
	};

	clearHistory = () => {
		this._currentIndex = -1;
		this._patchSets = [];
		this._currentMaterialized = undefined;
	};

	// ---------------------- getters --------------------------

	getDisplayWindowClient = () => {
		return this._displayWindowClient;
	};

	getCurrentTdlIndex = () => {
		return this._currentIndex;
	};

	getModified = () => {
		return this._modified;
	};

	setModified = (newStatus: boolean) => {
		this._modified = newStatus;
	};
}
