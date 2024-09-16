import { Promises, type_promise } from "../../channel/Promises";

interface type_terminal_io extends type_promise {
	command: string;
    callback: any;
}

// used only by Context, singleton
export class TerminalIos extends Promises {
	queue: Record<string, type_terminal_io> = {};
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

	// timeout = second
	appendIo(command: string, timeout: number | undefined = undefined, callback: any = undefined) {
		const id = this.obtainAnId();
        this.appendPromise(this.id.toString(), {
			command: command,
            callback: callback,
		}, timeout);
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
		return this.getPromiseWrapper(id.toString());
	};

	getAllIos = () => {
		return this.queue;
	};

	getIoPromise = (id: number) => {
		return this.getPromise(id.toString());
	};

	// -------------- resolve ---------------

	getIoResolveFunc = (id: number) => {
		return this.getResolveFunc(id.toString());
	};

	resolveIo = (id: number, result: any) => {
        // before the resolvePromise()
        const callback = this.getCallback(id);
		this.resolvePromise(id.toString(), result);
        // run callback
        if (callback !== undefined) {
            callback();
        }
	};

    // --------------- callback ------------

    getCallback = (id: number): any => {
        if (this.queue[id.toString()] === undefined) {
            return undefined;
        }
        return this.queue[id.toString()].callback;
    }

	// --------------- reject --------------

	getIoAllRejectFunc = () => {
		return this.getAllRejectFuncs();
	};

	getIoRejectFunc = (id: number) => {
		return this.getRejectFunc(id.toString());
	};

	rejectAllIos = () => {
		this.rejectAllPromises();
	};

	rejectIo = (id: number, reason: string = "") => {
		this.rejectPromise(id.toString(), reason);
	};
}
