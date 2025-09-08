import websocket
import rel
import json
import uuid
import sys
import io
import base64


class WsPvClient:

    def __init__(self):
        try:
            self.port = int(sys.argv[1])
            self.displayWindowId = sys.argv[2]
            self.dataTmp = []
            self.getChannels = {}
            self.monitorChannels = {}
            self.dataTmpMax = 10000
            self.connected = False
            websocket.enableTrace(False)
            self.ws = websocket.WebSocketApp(
                "ws://127.0.0.1:" + str(self.port),
                on_message=lambda ws, msg: self.on_message(ws, msg),
                on_error=lambda ws, msg: self.on_error(ws, msg),
                on_close=lambda ws: self.on_close(ws),
                on_open=lambda ws: self.on_open(ws))
        except:
            self.log("error", "Error in input")

    def on_message(self, ws, messageRaw):
        message = json.loads(messageRaw)
        # print("--------------- message --------------")
        # print(json.dumps(message, indent=4))
        # print("--------------------------------------")

        if "command" in message.keys():
            command = message["command"]
            # -------------- GET ------------------
            if command == "GET":
                channelName = self.stripChannelName(message["channelName"])
                if channelName in self.getChannels.keys():
                    getChannel = self.getChannels[channelName]
                    if "id" in message.keys():
                        id = message["id"]
                        if id in getChannel.keys():
                            req = getChannel[id]
                            callback = req["callback"]
                            if callback != "":
                                message["channelName"] = channelName
                                callback(message)
                del self.getChannels[channelName]
            # -------------- MONITOR ------------------
            elif command == "MONITOR":
                if "dbrDataObj" not in message.keys():
                    self.log("error", "No data from MONITOR")
                    return
                dbrDataObj = message["dbrDataObj"]
                for channelNameRaw in dbrDataObj.keys():
                    channelName = self.stripChannelName(channelNameRaw)
                    if channelName in self.monitorChannels.keys():
                        callback = self.monitorChannels[channelName][
                            "callback"]
                        if callback != "":
                            data = dbrDataObj[channelNameRaw]
                            data["channelName"] = channelName
                            callback(data)

    def on_error(self, ws, error):
        self.log("error", str(error))

    def on_close(self, ws, close_status_code, close_msg):
        self.connected = False
        self.log("info", "### closed ###")

    def on_open(self, ws):
        self.log("info", "Opened connection")
        self.connected = True
        ii = 0
        for data in self.dataTmp:
            # self.ws.recv()
            if self.connected:
                self.sendData(data)
            else:
                del self.dataTmp[0:ii]
                break
            ii = ii + 1

    def monitor(self, channelName, callback=""):
        if channelName in self.monitorChannels.keys():
            self.log("error", "There is already montior for", channelName)
            return
        # get a value and invoke callback first
        self.get(channelName, 1, callback)
        # register callback function for this channel
        self.monitorChannels[channelName] = {"callback": callback}
        data = {
            "channelName": self.parseChannelName(channelName),
            "command": "MONITOR",
            "displayWindowId": self.displayWindowId,
        }
        self.sendData(data)

    # type = "fatal" | "error" | "warn" | "info" | "debug" | "trace"
    # args = string
    def log(self, type, args):
        data = {
            "type": type,
            "args": args
        }
        self.sendData(data)

    def get(self, channelName, timeout=1, callback=""):
        id = str(uuid.uuid4())
        if channelName not in self.getChannels.keys():
            self.getChannels[channelName] = {}
        self.getChannels[channelName][id] = {"callback": callback}
        data = {
            "channelName": self.parseChannelName(channelName),
            "command": "GET",
            "displayWindowId": self.displayWindowId,
            "id": id,
            "timeout": timeout,
        }
        self.sendData(data)

    def put(self, channelName, value):
        # having a force update is dangerous in programming, it may cause
        # infinite loop. The .PROC is only for GUI
        # forceProc = False
        # if ".PROC" in channelName:
        #     channelName = channelName.replace(".PROC", "")
        #     forceProc = True
        
        data = {
            "channelName": self.parseChannelName(channelName),
            "command": "PUT",
            "displayWindowId": self.displayWindowId,
            "value": value,
        }
        # if forceProc == True:
        #     data["PROC"] = True
        
        self.sendData(data)

    def sendData(self, data):
        if self.connected:
            self.ws.send(json.dumps(data))
        else:
            self.dataTmp.append(data)
            if len(self.dataTmp) > self.dataTmpMax:
                self.dataTmp.pop(0)

    def run(self):
        self.ws.run_forever(dispatcher=rel, reconnect=5)
        rel.signal(2, rel.abort)  # Keyboard Interrupt
        rel.dispatch()

    def parseChannelName(self, channelName):
        if channelName.startswith("loc://"):
            return channelName + "@window_" + self.displayWindowId
        else:
            return channelName
        
    def stripChannelName(self, channelName):
        if channelName.startswith("loc://"):
            channelNameArray = channelName.split("@")
            return channelNameArray[0]
        else:
            return channelName

    @staticmethod
    def serializePlt(plt):
        # Save the plot to a bytes buffer
        buf = io.BytesIO()
        plt.savefig(buf, format='png')
        buf.seek(0)  # Move to the beginning of the BytesIO buffer
        # Encode the bytes buffer to Base64
        img_base64 = base64.b64encode(buf.getvalue()).decode('utf-8')
        return img_base64

