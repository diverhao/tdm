import { MainProcess } from "./MainProcess";
import dgram from "dgram";
import { Log } from "../../common/Log";
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
export class CaSnooperServer {
    epicsCaServerPort: number = 5064;
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
    stopCaSnooperServer = (displayWindowId: string, forceClose: boolean = false) => {
        const index = this.getDisplayWindowIds().indexOf(displayWindowId);
        if (index !== -1) {
            this.getDisplayWindowIds().splice(index, 1);
        }
        if (this.getDisplayWindowIds().length === 0 || forceClose === true) {
            Log.info("0", "close snooper server ---------------------------- ")
            this.closeServer();
        } else {
            Log.error("0", "not close snooper server ---------------------------- ")
        }
    }

    constructor(mainProcess: MainProcess, displayWindowId: string) {
        this._mainProcess = mainProcess;
        const selectedProfile = mainProcess.getProfiles().getSelectedProfile();
        let errMsg = "";
        if (selectedProfile !== undefined) {
            const context = this.getMainProcess().getChannelAgentsManager().getContext();
            if (context !== undefined) {
                const port = context.getEnv("EPICS_CA_SERVER_PORT");
                if (typeof port === "number" ) {
                    this.epicsCaServerPort = port;
                    this.addDisplayWindowId(displayWindowId);
                    return;
                } else {
                    errMsg = "EPICS_CA_SERVER_PORT " + `${port}` + " cannot be used.";
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
                info: {
                // command?: string | undefined,
                messageType: "error", // | "warning" | "info", // symbol
                humanReadableMessages: [`Failed to start CA snooper service`], // each string has a new line
                rawMessages: [errMsg], // computer generated messages
                // buttons?: type_DialogMessageBoxButton[] | undefined,
                // attachment?: any,
                }
            })
        }

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
            const dataCount = message.readUInt16BE(offset + CA_MSG_HEADER_OFFSETS.dataCount)
            const parameter1 = message.readUInt32BE(offset + CA_MSG_HEADER_OFFSETS.parameter1)
            const parameter2 = message.readUInt32BE(offset + CA_MSG_HEADER_OFFSETS.parameter2)
            let payload = "";
            if (payloadSize > 0) {
                payload = message.toString("utf-8", offset + 16, offset + 16 + payloadSize).replace(/\x00+$/, '');
            }
            // CA_PROTO_SEARCH
            if (command === 6) {
                result.push(
                    {
                        msSinceEpoch: Date.now(),
                        ip: rinfo.address,
                        port: rinfo.port,
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

    createServer = () => {
        // muse reuse address
        this.udpServer = dgram.createSocket({ type: 'udp4', reuseAddr: true });

        this.udpServer.on('error', (err) => {
            Log.error("0", `Server error:\n${err.stack}`);
            this.udpServer?.close();
        });

        this.udpServer.on("close", () => {
            Log.info("0", "udp server closed");
        })

        this.udpServer.on('message', (msg: Buffer, rinfo: dgram.RemoteInfo) => {
            Log.debug("0", `Server received: ${msg} from ${rinfo.address}:${rinfo.port}`);
            Log.debug("0", "raw message", msg, rinfo)
            const data = this.decodeCaUdpMessage(msg, rinfo);
            for (let displayWindowId of this.getDisplayWindowIds()) {
                const displayWindowAgent = this.getMainProcess().getWindowAgentsManager().getAgent(displayWindowId);
                if (displayWindowAgent instanceof DisplayWindowAgent) {
                    displayWindowAgent.sendFromMainProcess("ca-snooper-data", {
                        data: data,
                    });
                } else {
                    // there is no display window agent, the window may have been closed!
                    this.stopCaSnooperServer(displayWindowId);
                }
            }
        });

        this.udpServer.on('listening', () => {
            const address = this.udpServer?.address();
            if (address !== undefined) {
                Log.info("0", `Server listening ${address.address}:${address.port}`);
            }
        });
        this.udpServer.bind(this.epicsCaServerPort);
    }
    closeServer = () => {
        try {
            this.udpServer?.close();
        } catch (e) {
            Log.error("0", e);
        }
    }

    // getMainProcessId = () => {
    //     return this.getMainProcess().getProcessId();
    // }

}