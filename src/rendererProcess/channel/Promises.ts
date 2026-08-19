import { Log } from "../../common/Log";

export type type_promise_entry = {
    resolveFunc: any; // resolve function
    rejectFunc: any;
    promise: Promise<any>;
    creationTime: number; // Promise creation timestamp in milliseconds
    startTime: number; // countdown start time
    timeoutSeconds: number; // maximum wait time after the Promise is retrieved, 0 means no timeout
    timerHandle: ReturnType<typeof setTimeout> | undefined;
};

/**
 * Manages named, pending asynchronous operations as a registry of Promise entries.
 *
 * Each entry stores a Promise together with its resolve and reject functions, timing data,
 * and any operation-specific properties supplied by a derived class. 
 * 
 * A configured timeout starts when `getPromise()` first returns the Promise. Resolving or rejecting the operation
 * clears its timeout and removes its entry from the registry.
 *
 * To use this class, derive a class that exposes operation-specific methods which:
 *
 * 1. call `addPromise()` with a unique name before dispatching an asynchronous request;
 *    there is an optional startToCountdown to start the timer if there is a timeout
 * 2. return `getPromise()` to code waiting for the result; and
 * 3. call `resolve()` or `reject()` when the request completes or fails.
 */
export class Promises {
    registry: Record<string, Required<type_promise_entry>> = {};

    constructor() {
    }


    /**
     * Adds a named Promise and its associated metadata to the registry.
     *
     * @param name Unique name used to access the Promise entry.
     * @param customProps Additional operation-specific properties stored in the entry.
     * @param timeoutSeconds timeout in seconds, starting when `getPromise()` first retrieves the Promise.
     *                       0 s means never time out   
     * @returns `true` when the Promise is added, or `false` when the name already exists.
     */
    protected addPromise = (name: string, timeoutSeconds: number, customProps: Record<string, any> = {}): boolean => {

        const existingPromise = this.getPromise(name, false);
        if (existingPromise !== undefined) {
            Log.error(`Cannot add Promise "${name}": the name already exists in the registry.`);
            return false;
        }

        let resolveFunc: any = undefined;
        let rejectFunc: any = undefined;

        // create the Promise object and assign the resolve/reject functions
        let promise = new Promise<any>((resolve, reject) => {
            resolveFunc = resolve;
            rejectFunc = reject;
        });

        // register the Promise
        this.registry[name] = {
            ...customProps,
            resolveFunc: resolveFunc,
            rejectFunc: rejectFunc,
            promise: promise,
            creationTime: Date.now(),
            startTime: 0,
            timeoutSeconds: timeoutSeconds < 0 ? 0 : timeoutSeconds,
            timerHandle: undefined,
        };
        this.dummyAwait(name);
        return true;
    };

    /**
     * If the Promise is never await, rejecting it will cause an error thrown.
     * To prevent this, we have a dummy await that does nothing.
     */
    private dummyAwait = async (name: string) => {
        try {
            // do not start countdown
            await this.getPromise(name, false);
        } catch (e) {
            Log.error(`Promise ${name} is rejected in dummyAwait(). ${e}`);
        }
    };

    // ---------------- timeout -------------------

    /**
     * Get the timeout handler, i.e. the object returned by setTimeout() function. 
     */
    protected getPromiseTimerHandle = (name: string): ReturnType<typeof setTimeout> | undefined => {
        return this.registry[name]?.timerHandle;
    };

    // ---------------- promise -------------------

    /**
     * Get the promise entry from the registry from the entry name.
     */
    protected getPromiseEntry = (name: string): Required<type_promise_entry> | undefined => {
        return this.registry[name];
    };

    /**
     * Get the Promise object according to the name.
     *
     * If `undefined` is returned, no pending Promise exists under `name`: it was
     * either never registered or has already settled. Callers may treat this as
     * a completed operation that requires no waiting or further action.
     *
     * A start-to-countdown input argument is also available if the Promise was
     * configured with a timeout option. If the provided start-to-countdown bit is true,
     * the Promise starts to countdown, and the Promise get rejected if the time is up.
     */
    protected getPromise = (name: string, startToCountdown: boolean = true): Promise<any> | undefined => {
        const entry = this.registry[name];
        if (entry !== undefined) {
            if (entry.timeoutSeconds > 0 && startToCountdown && entry.timerHandle === undefined) {
                entry.startTime = Date.now();
                entry.timerHandle = setTimeout(() => {
                    this.reject(name, `Promise ${name} timeout [${entry.timeoutSeconds} s]`);
                }, entry.timeoutSeconds * 1000);
            }
        }
        return this.registry[name]?.promise;
    };


    // ---------------- resolve -------------------

    /**
     * Get the resolve function for a named promise entry
     */
    protected getResolveFunc = (name: string) => {
        return this.registry[name]?.resolveFunc;
    };

    /**
     * Resolve a named promise entry
     *  - clear the timeout timer
     *  - resolve the Promise object, capture the thrown error if there is one
     *  - remove the promise entry from registry
     */
    protected resolve = (name: string, result: any) => {
        const resolveFunc = this.getResolveFunc(name); // might be undefined
        const timerHandle = this.getPromiseTimerHandle(name); // it's ok to be undefined
        clearTimeout(timerHandle);
        try {
            if (resolveFunc !== undefined) {
                resolveFunc(result);
            }
            delete this.registry[name];
        } catch (e) {
            Log.error(e);
        }
    };

    // ---------------- reject -------------------

    /**
     * Get the reject function for a named promise entry
     */
    protected getRejectFunc = (name: string): any => {
        return this.registry[name]?.rejectFunc;
    };

    /**
     * Reject a named promise entry
     *  - clear the timeout timer
     *  - reject the Promise object, capture the thrown error if there is one
     *    The `await Promise` will throw an error from the invocation of rejectFunc()
     *    User should wrap the await inside a try-catch to prevent program crash
     *  - remove the promise entry from registry
     */
    protected reject = (name: string, reason: string = "") => {
        const rejectFunc = this.getRejectFunc(name);
        const timerHandle = this.getPromiseTimerHandle(name);
        clearTimeout(timerHandle);
        try {
            // may be "undefined"
            if (rejectFunc !== undefined) {
                rejectFunc(`Promise ${name} is rejected. Reason: ${reason}`);
            }
        } catch (e) {
            Log.error(`Rejecting Promise ${name} error:`);
            Log.error(e);
        }
        delete this.registry[name];
    };

    /**
     * Reject all promise entries in the registry
     */
    protected rejectAll = () => {
        for (let name in this.registry) {
            this.reject(name, "all promises are rejected.");
        }
    };
}
