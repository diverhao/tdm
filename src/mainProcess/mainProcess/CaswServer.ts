import { MainProcess } from "./MainProcess";
import dgram from "dgram";
import { Log } from "../log/Log";
import { DisplayWindowAgent } from "../windows/DisplayWindow/DisplayWindowAgent";

type type_CaUdpMessage = {
    command: number,
    payloadSize: number,
    dataType: number,
    dataCount: number,
    parameter1: number,
    parameter2: number,
    payload: string,
}

type type_CaProtoSearchData = {
    msSinceEpoch: number,
    channelName: string,
    ip: string, // source IP address
    port: number, // source port
}

const CA_MSG_HEADER_OFFSETS: Record<string, number> = {
    command: 0,
    payloadSize: 2,
    dataType: 4,
    dataCount: 6,
    parameter1: 8,
    parameter2: 12,
};

/**
 * This object is attached to a display window. It is part of a DisplayWindowAgent. 
 */
export class CaswServer {
    epicsCaRepeaterPort: number = 5065;
    udpServer: dgram.Socket | undefined = undefined;
    _displayWindowIds: string[] = [];
    _mainProcess: MainProcess;

    getMainProcess = () => {
        return this._mainProcess;
    }
    getDisplayWindowIds = () => {
        return this._displayWindowIds;
    }
    addDisplayWindowId = (displayWindowId: string) => {
        if (!this.getDisplayWindowIds().includes(displayWindowId)) {
            this.getDisplayWindowIds().push(displayWindowId);
        }
    }
    stopCaswServer = (displayWindowId: string, forceClose: boolean = false) => {
        const index = this.getDisplayWindowIds().indexOf(displayWindowId);
        if (index !== -1) {
            this.getDisplayWindowIds().splice(index, 1);
        }
        if (this.getDisplayWindowIds().length === 0 || forceClose === true) {
            Log.info(this.getMainProcess().getProcessId(), "------------------- close CASW server ---------------------------- ")
            this.closeServer();
        } else {
            Log.info(this.getMainProcess().getProcessId(), "-------------------- not close CASW server ---------------------------- ")
        }
    }

    constructor(mainProcess: MainProcess, displayWindowId: string) {
        this._mainProcess = mainProcess;
        const selectedProfile = mainProcess.getProfiles().getSelectedProfile();
        // if (selectedProfile !== undefined) {
        //     const epicsCaRepeaterPort = selectedProfile.getEntry("EPICS CA Settings", "EPICS_CA_REPEATER_PORT");
        //     if (epicsCaRepeaterPort !== undefined) {
        //         this.epicsCaRepeaterPort = epicsCaRepeaterPort;
        //     }
        // }
        // this.addDisplayWindowId(displayWindowId);

        let errMsg = "";
        if (selectedProfile !== undefined) {
            const context = this.getMainProcess().getChannelAgentsManager().getContext();
            if (context !== undefined) {
                const port = context.getEnv("EPICS_CA_REPEATER_PORT");
                if (typeof port === "number" ) {
                    this.epicsCaRepeaterPort = port;
                    this.addDisplayWindowId(displayWindowId);
                    return;
                } else {
                    errMsg = "EPICS_CA_REPEATER_PORT " + `${port}` + " cannot be used.";
                }

            } else {
                errMsg = "EPICS Context not created."
            }
        } else {
            errMsg = "Profile not selected."
        }
        // failed to start the CA snooper server
        const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(displayWindowId);

        if (displayWindowAgent instanceof DisplayWindowAgent) {

            displayWindowAgent.sendFromMainProcess("dialog-show-message-box", {
                // command?: string | undefined,
                messageType: "error", // | "warning" | "info", // symbol
                humanReadableMessages: [`Failed to start CA snooper service`], // each string has a new line
                rawMessages: [errMsg], // computer generated messages
                // buttons?: type_DialogMessageBoxButton[] | undefined,
                // attachment?: any,

            })
        }


    }


    ipInt2String(ip: number): string {
        let d = `${ip % 256}`;
        for (var i = 3; i > 0; i--) {
            ip = Math.floor(ip / 256);
            d = `${ip % 256}.${d}`;
        }
        return d;
    }

    /**
     * We should see one or more CA_PROTO_SEARCH messages. They may be packaged in one UDP frame.
     */
    decodeCaUdpMessage = (message: Buffer, rinfo: dgram.RemoteInfo): type_CaProtoSearchData[] => {
        let offset = 0;
        const messageLength = message.length;
        const result: type_CaProtoSearchData[] = [];
        while (true) {
            const command = message.readUInt16BE(offset + CA_MSG_HEADER_OFFSETS.command)
            const payloadSize = message.readUInt16BE(offset + CA_MSG_HEADER_OFFSETS.payloadSize)
            const dataType = message.readUInt16BE(offset + CA_MSG_HEADER_OFFSETS.dataType)
            const caServerPort = message.readUInt16BE(offset + CA_MSG_HEADER_OFFSETS.dataCount)
            const parameter1 = message.readUInt32BE(offset + CA_MSG_HEADER_OFFSETS.parameter1)
            const parameter2 = message.readUInt32BE(offset + CA_MSG_HEADER_OFFSETS.parameter2)
            let payload = "";
            const ip = this.ipInt2String(parameter2);
            // if (payloadSize > 0) {
            //     payload = message.toString("utf-8", offset + 16, offset + 16 + payloadSize).replace(/\x00+$/, '');
            // }
            // CA_PROTO_RSRV_IS_UP
            if (command === 0x0d) {
                result.push(
                    {
                        msSinceEpoch: Date.now(),
                        ip: ip,
                        port: caServerPort,
                        channelName: payload,
                    }
                    // {
                    //     command: command,
                    //     payloadSize: payloadSize,
                    //     dataType: dataType,
                    //     dataCount: dataCount,
                    //     parameter1: parameter1,
                    //     parameter2: parameter2,
                    //     payload: payload,
                    // }
                )
            }

            const playloadPaddedSize = Math.ceil(payloadSize / 8) * 8;
            offset = offset + 16 + playloadPaddedSize;
            if (offset >= messageLength) {
                break;
            }
        }
        return result;
    }

    static ipString2Int(ip: string): number {
        return ip.split('.').reduce(function (ipInt, octet) { return (ipInt << 8) + parseInt(octet, 10) }, 0) >>> 0;
    }

    createServer = () => {
        // muse reuse address
        this.udpServer = dgram.createSocket({ type: 'udp4', reuseAddr: true });

        this.udpServer.on('error', (err) => {
            console.log(`Server error for casw:\n${err}`);
            this.udpServer?.close();
        });

        this.udpServer.on("close", () => {
            console.log("udp server closed");
        })

        this.udpServer.on('message', (msg: Buffer, rinfo: dgram.RemoteInfo) => {
            Log.debug(-1, `Server received: ${msg} from ${rinfo.address}:${rinfo.port}`);
            Log.debug(-1, "raw message", msg, rinfo)
            const data = this.decodeCaUdpMessage(msg, rinfo);
            for (let displayWindowId of this.getDisplayWindowIds()) {
                const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(displayWindowId);
                if (displayWindowAgent instanceof DisplayWindowAgent) {
                    displayWindowAgent.sendFromMainProcess("ca-sw-data", {
                        data: data,
                    });
                } else {
                    // there is no display window agent, the window may have been closed!
                    this.stopCaswServer(displayWindowId);
                }
            }
        });

        this.udpServer.on('listening', () => {
            const address = this.udpServer?.address();
            if (address !== undefined) {
                console.log(`Server listening ${address.address}:${address.port}`);
            }
            // register to CA repeater
            const message = Buffer.from([0x00, 0x18, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x7f, 0x00, 0x00, 0x01]);
            this.udpServer?.send(message, this.epicsCaRepeaterPort, "127.0.0.1");
        });
        // this.udpServer.bind(this.epicsCaRepeaterPort);
        // bind to any port
        this.udpServer.bind();
    }
    closeServer = () => {
        try {
            this.udpServer?.close();
        } catch (e) {
            console.log(e);
        }
    }

}