import { Promises, type_promise_entry } from "../../channel/Promises";

interface type_terminal_io extends type_promise_entry {
	command: string;
    callback: any;
}

// used only by Context, singleton
export class TerminalIos extends Promises {
	registry: Record<string, type_terminal_io> = {};
	// the most recent id
	private id: number = 0;
	private constructor() {
		super();
	}

	public static instance: TerminalIos;

	public static getInstance = () => {
		if (TerminalIos.instance) {
			return this.instance;
		} else {
			return new TerminalIos();
		}
	};

	// timeoutSeconds is measured in seconds
	addIo(command: string, timeoutSeconds: number | undefined = undefined, callback: any = undefined) {
		const id = this.obtainAnId();
		this.addPromise(this.id.toString(), timeoutSeconds ?? 0, {
			command: command,
			callback: callback,
		});
		return id;
	}

	private obtainAnId = (): number => {
		let id = this.id + 1;
		while (!this.validateId(id)) {
			if (id === 4294967295) {
				id = 0;
			} else {
				id++;
			}
		}
		this.id = id;
		return id;
	};

	private validateId = (id: number): boolean => {
		if (this.getIo(id) !== undefined) {
			return false;
		}
		if (id >= 4294967295 || id < 0) {
			return false;
		}
		return true;
	};

	// public getEnv = (
	// 	envName: string = ""
	// ): string | number | string[] | number[] | Record<string, string | number | string[] | number[]> | undefined => {
	// 	return Environment.getInstance().getEnv(envName);
	// };

	// --------------- promise --------------

	getIo = (id: number) => {
		return this.getPromiseEntry(id.toString());
	};

	getAllIos = () => {
		return this.registry;
	};

	getIoPromise = (id: number) => {
		return this.getPromise(id.toString());
	};

	// -------------- resolve ---------------

	getIoResolveFunc = (id: number) => {
		return this.getResolveFunc(id.toString());
	};

	resolveIo = (id: number, result: any) => {
        // before resolve()
        const callback = this.getCallback(id);
		this.resolve(id.toString(), result);
        // run callback
        if (callback !== undefined) {
            callback();
        }
	};

    // --------------- callback ------------

    getCallback = (id: number): any => {
        if (this.registry[id.toString()] === undefined) {
            return undefined;
        }
        return this.registry[id.toString()].callback;
    }

	// --------------- reject --------------


	getIoRejectFunc = (id: number) => {
		return this.getRejectFunc(id.toString());
	};

	rejectAllIos = () => {
		this.rejectAll();
	};

	rejectIo = (id: number, reason: string = "") => {
		this.reject(id.toString(), reason);
	};
}
