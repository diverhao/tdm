# ------------------ Load TDM API ----------------
import sys
import os
import numpy as np
# replace the path with
sys.path.append(os.path.abspath("/Users/1h7/projects/tdm/src/mainProcess/wsPv"))
import WsPvClient
wsPvClient = WsPvClient.WsPvClient()
# ------------------------------------------------
# Load libs for plot
import matplotlib.pyplot as plt
from IPython.display import display, clear_output
import numpy as np
# ------------- Example 1: plot ------------------

# Function is invoked every time when channel has a new value.
# Input argument "data" is a dictionary, with a key named "value".
# It is the new value of the channel. It could be a number,
# string, number array, or string array.
def updatePlot(data):
    # the new value of channel
    value = data["value"]
    # plot, but do not show
    clear_output(wait=True)
    plt.figure()
    randomNum = np.random.randint(low=0, high=value, size=100)
    plt.plot(randomNum)
    # capture the image: convert plt to a base64 image, which basically 
    # is a long string
    html_img = wsPvClient.serializePlt(plt)
    plt.close()
    # write image to the local channel, which is shown in a Binary Image
    # on the TDM display window
    wsPvClient.put("loc://img1", html_img)

# Monitor the channel "val7". Whenever the value of "val7" is updated,
# function "updatePlot" is invoked. A dictionary that contains the new value
# of this channel is the input argument of "updatePlot"
wsPvClient.monitor("val17", updatePlot)

# -------------- Example 2: process the data ------------------
# We monitor channel "val0", add a constant offset to its value.
# Then write the new value to a local channel "loc://val0_offset"

# def dataOffset(data):
#     value = data["value"]
#     client.put("loc://val7_offset", value + 42)

# client.monitor("val7", dataOffset)

# -------------- Example 3: process the data ------------------
# We monitor channels "val1" and "val2", add them together and 
# write the new value to a local channel "loc://val1_val2_sum"


# val0_value = 0
# val1_value = 0

# def dataSum(data):
#     global val0_value
#     global val1_value
#     value = data["value"]
#     channelName = data["channelName"]
#     if (channelName == "val0"):
#         val0_value = value
#     elif (channelName == "val15"):
#         val1_value = value
#     wsPvClient.put("loc://val0_val1_sum", value)

# wsPvClient.monitor("val15", dataSum)
# wsPvClient.wsMonitor("val1", dataSum)


# --------------- Example 4: generate random array --------------------

# def generateArray(data):
#     random_integers = np.random.randint(low=0, high=100, size=100)
#     wsPvClient.put("loc://val0_array", random_integers.tolist())
#     random_integers = np.random.randint(low=0, high=100, size=100)
#     wsPvClient.put("loc://val1_array", random_integers.tolist())
# wsPvClient.monitor("val15", generateArray)


# don't forget to run it
wsPvClient.run()
