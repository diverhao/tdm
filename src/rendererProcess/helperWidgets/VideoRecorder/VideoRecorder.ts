import { v4 as uuidv4 } from "uuid";
import { DisplayWindowClient } from "../../../mainProcess/windows/DisplayWindow/DisplayWindowClient";
import path from "path";
import { g_widgets1, GlobalVariables } from "../../global/GlobalVariables";
import { Log } from "../../../common/Log";
import { getCurrentDateTimeStr } from "../../../common/GlobalMethods";

export class VideoRecorder {
    private _sourceId: string = "";
    blobs: Blob[] = [];
    status: "recording" | "stop" = "stop";
    recorder: MediaRecorder | undefined;
    divId: string = "";
    counterInterval: undefined | NodeJS.Timeout;
    _displayWindowClient: DisplayWindowClient;

    constructor(displayWindowClient: DisplayWindowClient) {
        this._displayWindowClient = displayWindowClient;
    }

    getDisplayWindowClient = () => {
        return this._displayWindowClient;
    }

    getSourceId = () => {
        return this._sourceId;
    };

    setSourceId = (newId: string) => {
        this._sourceId = newId;
    };

    start = async (folder: string) => {
        if (this.status === "recording" || this.recorder !== undefined) {
            Log.error("Already recording, start failed");
            return;
        }
        try {
            Log.info("start recording");
            this.status = "recording";
            const stream = await (navigator.mediaDevices as any).getUserMedia({
                audio: false,
                video: {
                    mandatory: {
                        chromeMediaSource: "desktop",
                        chromeMediaSourceId: this.getSourceId(),
                        // minWidth: 1280,
                        // maxWidth: 1280,
                        // minHeight: 720,
                        // maxHeight: 720,
                    },
                },
            });
            // record the data, save to blobs
            this.recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
            this.recorder.addEventListener("dataavailable", (event: BlobEvent) => {
                this.blobs.push(event.data);
            });
            this.recorder.addEventListener("stop", (event: Event) => {
                Log.info("Video recording stopped");
                this.status = "stop";
                this.recorder = undefined;
                this.save(this.blobs, folder);
            });
            this.recorder.start();

            // show a red disk on top-left
            const recordingSignDiv = document.createElement("div");
            this.divId = uuidv4();
            recordingSignDiv.id = this.divId;
            recordingSignDiv.style["position"] = "absolute";
            recordingSignDiv.style["top"] = "10px";
            recordingSignDiv.style["left"] = "10px";
            recordingSignDiv.style["width"] = "30px";
            recordingSignDiv.style["height"] = "30px";
            recordingSignDiv.style["display"] = "inline-flex";
            recordingSignDiv.style["justifyContent"] = "center";
            recordingSignDiv.style["alignItems"] = "center";
            recordingSignDiv.style["backgroundColor"] = "red";
            recordingSignDiv.style["borderRadius"] = "50%";
            recordingSignDiv.style["border"] = "solid 3px white";
            recordingSignDiv.style["color"] = "white";
            recordingSignDiv.style["fontFamily"] = GlobalVariables.defaultFontFamily;
            recordingSignDiv.style["fontSize"] = `${GlobalVariables.defaultFontSize}px`;
            recordingSignDiv.style["fontStyle"] = GlobalVariables.defaultFontStyle;
            recordingSignDiv.style["fontWeight"] = GlobalVariables.defaultFontWeight;
            recordingSignDiv.addEventListener("click", (event: any) => {
                Log.info("stop recording");
                this.stop();
            });

            let count = 0;
            recordingSignDiv.innerText = `${count}`;
            this.counterInterval = setInterval(() => {
                count++;
                recordingSignDiv.innerText = `${count}`;
            }, 1000)
            recordingSignDiv.addEventListener("mouseover", (event: any) => {
                recordingSignDiv.style["cursor"] = "pointer";
                recordingSignDiv.style["outline"] = "solid 3px red";
            });
            recordingSignDiv.addEventListener("mouseleave", (event: any) => {
                recordingSignDiv.style["cursor"] = "default";
                recordingSignDiv.style["outline"] = "none";
            });
            document.body.append(recordingSignDiv);
        } catch (e) {
            Log.error(e);
            this.recorder = undefined;
            this.status = "stop";
            this.blobs.length = 0;
        }
    };

    stop = () => {
        const recordingSignDiv = document.getElementById(this.divId);
        if (recordingSignDiv !== null) {
            document.body.removeChild(recordingSignDiv);
        }
        clearInterval(this.counterInterval);
        this.recorder?.stop();
    };

    // folder already checked: exist and writable
    save = async (blobs: Blob[], folder: string) => {
        const videoFileName = path.join(folder, "TDM-video-clip-" + getCurrentDateTimeStr(true) +`.webm`);
        if (blobs.length >= 1) {
            const a = await blobs[0].arrayBuffer();
            const buf = Buffer.from(a);

            g_widgets1.getRoot().getDisplayWindowClient().getIpcManager().sendFromRendererProcess("save-video-file", {
                displayWindowId: g_widgets1.getRoot().getDisplayWindowClient().getWindowId(),
                fileName: videoFileName,
                fileContents: buf.toString("base64"), // send base64 data
            })
        } else {
            this.getDisplayWindowClient().getPrompt().createElement(
                "dialog-message-box",
                {
                    messageType: "error",
                    humanReadableMessages: ["Failed to record video."],
                    rawMessages: [],
                    buttons: undefined,
                }
            )
        }
        this.blobs.length = 0;

    }
}
