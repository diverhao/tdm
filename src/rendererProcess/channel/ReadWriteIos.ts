import { Log } from "../../common/Log";
import { Promises, type_promise_entry } from "./Promises";
import { TcaChannel } from "./TcaChannel";

export enum IO_TYPE {
    READ = 0,
    WRITE = 1,
}

/**
 * Extends the promise entry in Promises, with additional properties such as TcaChannel, IO_TYPE,
 * and operation finishing callback.
 */
interface type_io extends type_promise_entry {
    channel: TcaChannel;
    type: IO_TYPE;
    callback: (() => void) | undefined; // callback function
}

/**
 * Manages pending asynchronous read and write operations for all `TcaChannel`
 * instances. Each operation is automatically assigned a unique numeric identifier 
 * and stored with its channel, I/O type, timeout, and optional completion callback.
 *
 * This singleton extends `Promises` to resolve or reject operations when their
 * Channel Access responses arrive, and to clean up operations that time out or
 * belong to a channel that is being closed.
 */
export class ReadWriteIos extends Promises {

    registry: Record<string, type_io> = {};

    // automatic increment ID for the IO operation
    private id: number = 0;
    public static instance: ReadWriteIos;

    // a singleton class, hide the constructor
    private constructor() {
        super();
    }

    // call static method to create or get the instance
    public static getInstance = () => {
        if (ReadWriteIos.instance) {
            return this.instance;
        } else {
            this.instance = new ReadWriteIos();
            return this.instance;
        }
    };

    // ------------------ IOs ------------------------

    /**
     * Registers a pending Channel Access read or write operation and its Promise.
     *
     * Used for CA read-notify, write-notify, and write commands. The generated identifier
     * associates a later response with this registry entry.
     *
     * @param channel Channel on which the operation is performed.
     * @param type Whether the operation reads or writes channel data.
     * @param timeoutSeconds Maximum wait time in seconds; `0` disables the timeout.
     * @param callback Optional function invoked after the operation resolves.
     * @returns Numeric identifier assigned to the registered operation.
     */
    addIo(channel: TcaChannel, type: IO_TYPE, timeoutSeconds: number, callback?: () => void) {
        // obtain a new unique ID
        const id = this.obtainAnId();

        // if this IO already exists, return the ID
        // this should not happen because IO ID is automatic incremental
        if (this.registry[id.toString()] !== undefined) {
            Log.error(`Cannot add read/write I/O ${id}: the ID already exists in the registry.`);
            return id;
        }

        // add promise entry
        this.addPromise(
            this.id.toString(),
            timeoutSeconds,
            // ReadWriteIos custom properties
            {
                channel: channel,
                type: type,
                callback: callback,
            }
        );
        return id;
    }

    // ----------------- id --------------

    /**
     * Returns the next available numeric identifier for an I/O operation.
     *
     * Identifiers increase sequentially and skip values that are still present
     * in the registry. After reaching `4294967294`, allocation wraps to `0` and
     * continues searching until it finds an unused valid identifier.
     *
     * @returns An unused identifier in the range `0` through `4294967294`.
     */
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
        const ioEntry = this.getPromiseEntry(id.toString());
        if (ioEntry !== undefined) {
            return false;
        }
        if (id >= 4294967295 || id < 0) {
            return false;
        }
        return true;
    };

    // --------------- promise --------------

    /**
     * Get the Promise object for the IO with provided ID
     */
    getIoPromise = (id: number): Promise<any> | undefined => {
        return this.getPromise(id.toString());
    };

    // -------------- resolve ---------------

    /**
     * Resolves a pending I/O operation with the supplied result and removes
     * the operation from the registry. Code awaiting the associated Promise
     * receives `result` as its fulfilled value.
     *
     * The optional completion callback is invoked synchronously after
     * `resolve()` returns and before any Promise reaction runs as a microtask.
     *
     * @param id Identifier of the I/O operation to resolve.
     * @param result Value used to fulfill the operation's Promise.
     */
    resolveIo = (id: number, result: any) => {
        // retrieve callback function before resolve()
        const ioEntry = this.registry[id.toString()];
        if (ioEntry === undefined) {
            return;
        }
        const callback = ioEntry.callback;

        this.resolve(id.toString(), result);
        // run callback
        if (callback !== undefined) {
            try {
                callback();
            } catch (e) {
                Log.error(`Callback error for ReadWriteIo ${id}`);
                Log.error(e);
            }
        }
    };

    // --------------- reject --------------

    /**
     * Reject all IOs for the provided TcaChannel
     */
    rejectChannelIos = (channel: TcaChannel) => {
        for (let [ioId, io] of Object.entries(this.registry)) {
            if (io.channel === channel) {
                this.reject(ioId, "Rejecting all IOs for channel" + channel.getChannelName());
            }
        }
    };

    /**
     * Reject an IO by the provided ID. The reason is 
     */
    rejectIo = (id: number, reason: string) => {
        this.reject(id.toString(), reason);
    };

}
