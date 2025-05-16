# general python libs
import sys
import os
import numpy as np

# TDM lib
# the path is `TDM package/resources/app.asar.unpacked/dist/mainProcess/wsPv`
base_path = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.join(base_path, "../../mainProcess/wsPv"))
import WsPvClient

wsPvClient = WsPvClient.WsPvClient()

val0_value = 0
val1_value = 0

def sumAndProd(data):
    global val0_value
    global val1_value
    # PV name
    channelName = data["channelName"]
    # PV value
    value = data["value"]
    if (channelName == "loc://localPv9"):
        val0_value = value
    elif (channelName == "tdm:demo:02"):
        val1_value = value
    # assign the sum to a virtual PV `loc://sum`
    wsPvClient.put("loc://sum", val0_value + val1_value)
    # assign the product to a real PV `tdm:demo:07`
    wsPvClient.put("tdm:demo:07", val0_value * val1_value )

# monitor 2 PVs, whenever their values are changed, the function `sumAndProd` is invoked
wsPvClient.monitor("tdm:demo:02", sumAndProd)
wsPvClient.monitor("loc://localPv9", sumAndProd)

# don't forget to run it
wsPvClient.run()
