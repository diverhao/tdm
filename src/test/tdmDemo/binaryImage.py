# general python libs
import sys
import os
import numpy as np
import matplotlib.pyplot as plt
from IPython.display import display, clear_output
import numpy as np

# TDM lib
# the path is `TDM package/resources/app.asar.unpacked/dist/mainProcess/wsPv`
base_path = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.join(base_path, "../../mainProcess/wsPv"))
import WsPvClient

wsPvClient = WsPvClient.WsPvClient()

def updatePlot(data):
    # PV value
    value = data["value"]
    # plot, but do not show
    clear_output(wait=True)
    plt.figure()
    # plot 100 random numbers
    randomNum = np.random.randint(low=0, high=value, size=100)
    plt.plot(randomNum)
    # take a screenshot of the image and save to a base64 string
    imgStr = wsPvClient.serializePlt(plt)
    # close the figure
    plt.close()
    # write base64 image to a virtual PV, the Binary Image widget displays this PV
    # this PV is a essentially a very long string that represents an image
    wsPvClient.put("loc://img1", imgStr)

# monitor this PV, whenever its value is changed, the function `updatePlot` is invoked
wsPvClient.monitor("tdm:demo:02", updatePlot)

# don't forget to run it
wsPvClient.run()
