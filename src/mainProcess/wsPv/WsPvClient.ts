import WebSocket from "ws";
import { v4 as uuidv4 } from "uuid";

type type_workerData = {
    displayWindowId: string,
    port: number, // wsPv server port
    script: string,
};

export class WsPvClient {
    ws: WebSocket;
    workerData: type_workerData;
    GETtimeout: number = 1000; // ms
    // commands buffer
    dataTmp: any[] = [];
    displayWindowId: string;
    dataTmpMax: number = 10000;
    monitorChannels: Record<
        string, // channel name
        {
            callback: ((dbrData: Record<string, any>) => void) | undefined;
        }
    > = {};
    /**
    {val1: {
        aaa-1111-22222: {
            callback: ...,
        },
        112-bbb-fff-ggg: {
            callback: ...,
        },

    }}
     */
    getChannels: Record<
        string, // channel name
        Record<
            string, // id
            {
                callback: ((dbrData: Record<string, any>) => void) | undefined;
            }
        >
    > = {};

    constructor(workerData: type_workerData) {
        this.workerData = workerData;
        this.displayWindowId = workerData["displayWindowId"];

        // create WebSocket client object, it causes "connection" event on server
        this.ws = new WebSocket(`ws://localhost:${workerData["port"]}`);
        this.ws.on("close", () => {
            this.log("info", "Closing WebSocket PV server socket");
        });

        this.ws.on("error", (err: Error) => {
            this.log("error", err);
        });

        // received on connection established with server
        // all monitor/get/put must start from here
        this.ws.on("open", () => {
            for (let ii = 0; ii < this.dataTmp.length; ii++) {
                const data = this.dataTmp[ii];
                // in case the connection is interrupted during this for loop
                if (this.ws.readyState === 1) {
                    this.ws.send(JSON.stringify(data));
                } else {
                    this.dataTmp.splice(0, ii);
                    break;
                }
            }
        });

        this.ws.on("message", (rawData: WebSocket.RawData) => {
            const data = JSON.parse(rawData.toString());
            // console.log(data)
            const command = data["command"];
            this.log("debug", "--------------- message --------------")
            this.log("debug", JSON.stringify(data, null, 4))
            this.log("debug", "--------------------------------------")


            if (command === "MONITOR") {
                const dbrDataObj = data["dbrDataObj"];
                if (dbrDataObj === undefined) {
                    this.log("error", "No data from MONITOR");
                    return;
                }
                for (let channelNameRaw of Object.keys(dbrDataObj)) {
                    const channelName = this.stripChannelName(channelNameRaw);
                    if (Object.keys(this.monitorChannels).includes(channelName)) {
                        const callback = this.monitorChannels[channelName]["callback"];
                        if (callback !== undefined) {
                            callback(dbrDataObj[channelNameRaw]);
                        }
                    }
                }
            } else if (command === "GET") {
                const channelName = this.stripChannelName(data["channelName"]);
                const id = data["id"];
                const getChannel = this.getChannels[channelName];
                if (getChannel !== undefined && id !== undefined) {
                    const req = getChannel[id];
                    if (req !== undefined) {
                        const callback = req["callback"];
                        if (callback !== undefined) {
                            callback(data);
                        }
                    }
                }
                delete this.getChannels[channelName];
            } else {
                // console.log("wrong data", data);
            }
        });
    }

    // PUT
    put = (channelName: string, value: any) => {
        const data: Record<string, any> = {
            channelName: this.parseChannelName(channelName),
            command: "PUT",
            displayWindowId: this.workerData["displayWindowId"],
            value: value,
        };
        this.sendData(data);
    };

    // LOG
    log = (type: "fatal" | "error" | "warn" | "info" | "debug" | "trace", ...args: any) => {
        const data: Record<string, any> = {
            command: "LOG",
            type: type,
            args: `${args}`,
        };
        this.sendData(data);
    };

    sendData = (data: Record<string, any>) => {
        if (this.ws.readyState === 1) {
            this.ws.send(JSON.stringify(data));
        } else {
            this.dataTmp.push(data);
            if (this.dataTmp.length > this.dataTmpMax) {
                this.dataTmp.splice(0, 1);
            }
        }
    };

    // send out GET
    // after timeout we obtain a {value: undefined}, which must be handled by callback
    // if the CA channel does not exist, the main process returns immediately, it won't try to establish a CA connection with IOC
    get = (channelName: string, timeout: number = 1, callback: ((dbrData: Record<string, any>) => void) | undefined) => {
        const id = uuidv4();
        if (this.getChannels[channelName] === undefined) {
            this.getChannels[channelName] = {};
        }

        this.getChannels[channelName][id] = {
            callback: callback,
        };

        const data: Record<string, any> = {
            channelName: this.parseChannelName(channelName),
            command: "GET",
            displayWindowId: this.workerData.displayWindowId,
            id: id,
            timeout: timeout,
        };
        this.sendData(data);
    };

    // register MONITOR
    monitor = (channelName: string, callback: (dbrData: Record<string, any>) => void | undefined) => {
        // only the first monitor request is honored
        if (Object.keys(this.monitorChannels).includes(channelName)) {
            this.log("error", "Monitor", channelName, "already exists, ignore this monitor request");
            return;
        }
        this.get(channelName, 1, callback);
        this.monitorChannels[channelName] = {
            callback: callback,
        };
        let data: Record<string, any> = {
            channelName: this.parseChannelName(channelName),
            command: "MONITOR",
            displayWindowId: this.workerData["displayWindowId"],
        };
        this.sendData(data);
    };
    stripChannelName = (channelName: string) => {
        if (channelName.startsWith("loc://")) {
            return channelName.split("@")[0];
        } else {
            return channelName;
        }
    }
    parseChannelName = (channelName: string) => {
        if (channelName.startsWith("loc://")) {
            return `${channelName}@window_${this.displayWindowId}`;
        } else {
            return channelName;
        }
    }
}
