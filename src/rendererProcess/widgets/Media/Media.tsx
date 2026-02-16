import HLS from 'hls.js';
import * as GlobalMethods from "../../../common/GlobalMethods";
import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { MediaRules } from "./MediaRules";
import { MediaSidebar } from "./MediaSidebar";
import * as path from "path";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { Log } from "../../../common/Log";
import { resolvePath } from "react-router-dom";

export type type_Media_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
};

export class Media extends BaseWidget {

    _rules: MediaRules;

    /**
     * in Desktop mode, the `src` or `data` for image or pdf is from text["fileName"], it could be 
     * a relative/absolute/http file name, or a data uri
     * 
     * in Web mode, the `src` or `data` is from _base64Content, because we may need to fetch
     * the image everytime the widget is re-rendered, we use _oldFileName (hence the this.fileNameChanged()) 
     * to indicate if the file name has been modified
     */
    private _base64Content: string = "";
    private _oldFileName: string = "";

    constructor(widgetTdl: type_Media_tdl) {
        super(widgetTdl);
        this.initStyle(widgetTdl);
        this.initText(widgetTdl);
        this.setReadWriteType("read");

        this._rules = new MediaRules(this, widgetTdl);
    }


    // ------------------------------ elements ---------------------------------

    _ElementRaw = () => {
        // guard the widget from double rendering
        this.widgetBeingRendered = true;
        React.useEffect(() => {
            this.widgetBeingRendered = false;
        });
        g_widgets1.removeFromForceUpdateWidgets(this.getWidgetKey());

        this.updateAllStyleAndText();

        return (
            <ErrorBoundary style={this.getStyle()} widgetKey={this.getWidgetKey()}>
                <div style={this.getElementBodyRawStyle()}>
                    <this._ElementArea></this._ElementArea>
                    {this.showResizers() ? <this._ElementResizer /> : null}
                </div>
                {this.showSidebar() ? this._sidebar?.getElement() : null}
            </ErrorBoundary>
        );
    };

    _ElementAreaRaw = ({ }: any): React.JSX.Element => {
        const allText = this.getAllText();
        const whiteSpace = allText.wrapWord ? "normal" : "pre";
        const justifyContent = allText.horizontalAlign;
        const alignItems = allText.verticalAlign;
        const outline = this._getElementAreaRawOutlineStyle();
        const backgroundColor = this._getElementAreaRawBackgroundStyle();

        return (
            <div
                style={{
                    display: "inline-flex",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    userSelect: "none",
                    position: "absolute",
                    overflow: "visible",
                    whiteSpace: whiteSpace,
                    justifyContent: justifyContent,
                    alignItems: alignItems,
                    outline: outline,
                    backgroundColor: backgroundColor,
                }}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                {this._ElementMedia()}
            </div>
        );
    };

    _Element = React.memo(this._ElementRaw, () => this._useMemoedElement());
    _ElementArea = React.memo(this._ElementAreaRaw, () => this._useMemoedElement());

    _ElementMedia = () => {
        const allText = this.getAllText();
        const fileName = allText["fileName"];
        const mainProcessMode = g_widgets1.getRoot().getDisplayWindowClient().getMainProcessMode();

        // fetch the file from server 
        if (mainProcessMode === "web" || mainProcessMode === "ssh-client") {
            this.fetchMediaContent();
        }
        const mediaType = this.getMediaType(fileName);

        if (mediaType === "image") {
            return <this._ElementImage></this._ElementImage>;
        } else if (g_widgets1.isEditing()) {
            // a mask for all types below in editing mode
            return <this._ElementEditing text={fileName}></this._ElementEditing>
        } else if (mediaType === "pdf") {
            return <this._ElementPdf></this._ElementPdf>;
        } else if (mediaType === "video-local-file") {
            return <this._ElementVideoLocalFile></this._ElementVideoLocalFile>;
        } else if (mediaType === "video-mjpeg") {
            return <this._ElementVideoMJPEG></this._ElementVideoMJPEG>;
        } else if (mediaType === "video-hls") {
            return <this._ElementVideoHLS></this._ElementVideoHLS>;
        } else if (mediaType === "video-rtsp") {
            return <this._ElementError></this._ElementError>;
        } else if (mediaType === "video-remote-stream") {
            return <this._ElementVideoRemoteStream></this._ElementVideoRemoteStream>;
        } else {
            return <this._ElementError></this._ElementError>
        }
    };

    _ElementImage = () => {

        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
        const mainProcessMode = displayWindowClient.getMainProcessMode();

        const allText = this.getAllText();
        const allStyle = this.getAllStyle();
        const stretchToFit = allText["stretchToFit"];
        const width = allStyle["width"];
        const height = allStyle["height"];
        const opacity = allText["opacity"];
        const objectFit = stretchToFit ? "fill" : "contain";

        const fileName = allText["fileName"];
        const fullFileName = displayWindowClient.resolvePath(fileName);
        const src = mainProcessMode === "ssh-client" || mainProcessMode === "web" ? this.getBase64Content() : fullFileName;
        return (
            <img
                src={src}
                style={{
                    objectFit: objectFit,
                    opacity: opacity,
                }}
                alt="..."
                width={width}
                height={height}
            ></img>
        );
    };

    _ElementEditing = ({ text }: { text: string }) => {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    backgroundColor: "rgba(0,0,0,0)",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                }}
            >
                {text}
            </div>
        )
    }
    _ElementPdf = () => {

        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
        const mainProcessMode = displayWindowClient.getMainProcessMode();

        const allText = this.getAllText();

        const fileName = allText["fileName"];
        const fullFileName = displayWindowClient.resolvePath(fileName);

        const data = mainProcessMode === "ssh-client" || mainProcessMode === "web" ? this.getBase64Content() : fullFileName;
        return (
            <object
                data={data}
                type="application/pdf"
                width="100%"
                height="100%"
            >
                <p>Unable to display PDF file.</p>
            </object>
        );
    };

    /**
     * local video file
     * 
     * supports local .mp4, .ogg, .webm, .mp3, .mov
     * 
     *  not supported: .avi, .wmv
     */
    _ElementVideoLocalFile = () => {

        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
        const allText = this.getAllText();
        const fileName = allText["fileName"];
        const src = displayWindowClient.resolvePath(fileName);

        return (
            <video preload="none" width="100%" height="100%" controls>
                <source src={src} type="video/mp4"></source>
            </video>
        );
    };

    _ElementVideoRemoteStream = () => {
        return (
            <iframe
                width="100%"
                height="100%"
                src={this.getAllText()["fileName"]}
                // frameBorder="0"
                // allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                // allowFullScreen
                // title="Embedded video"
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                }}
            />

        )
    };


    // MJPEG video stream (Axis, Hikvision cameras)
    _ElementVideoMJPEG = () => {
        const allText = this.getAllText();
        const fileName = allText["fileName"];

        return (
            <img
                src={fileName}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                }}
                alt="Video camera"
            />
        );
    };

    // HLS video stream
    _ElementVideoHLS = () => {
        const videoRef = React.useRef<HTMLVideoElement>(null);
        const allText = this.getAllText();
        const fileName = allText["fileName"];

        React.useEffect(() => {
            if (!videoRef.current) return;

            // HLS.js setup
            if (HLS.isSupported()) {
                const hls = new HLS({
                    debug: false,
                    enableWorker: true,
                });

                hls.loadSource(fileName);
                hls.attachMedia(videoRef.current);

                hls.on(HLS.Events.MANIFEST_PARSED, () => {
                    // console.log("HLS manifest loaded");
                    // Optional: auto-play
                    // videoRef.current?.play();
                });

                hls.on(HLS.Events.ERROR, (event, data) => {
                    if (data.fatal) {
                        // console.error("HLS fatal error:", data);
                    }
                });

                // Cleanup
                return () => {
                    hls.destroy();
                };
            } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
                // Fallback for Safari
                videoRef.current.src = fileName;
            }
            return;
        }, [fileName]);

        return (
            <video
                ref={videoRef}
                controls
                width="100%"
                height="100%"
                style={{ width: '100%', height: '100%' }}
            />
        );
    };

    _ElementError = () => {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: "red",
                }}
            >
                Error
            </div>
        )
    }


    // -------------------- helper functions ----------------

    getMediaType = (fileName: string): "image" | "pdf" | "video-local-file" | "video-remote-stream" | "video-mjpeg" | "video-rtsp" | "video-hls" | undefined => {
        const imageTypes = ["jpg", "jpeg", "bmp", "png", "gif"];
        const pdfTypes = ["pdf"];
        const localVideoFileTypes = ["mp4", "ogg", "webm", "mp3", "mov", "mkv"];

        const fileNameArray = fileName.split(".");
        const fileType = fileNameArray[fileNameArray.length - 1].toLowerCase();

        if (imageTypes.includes(fileType)) {
            return "image";
        } else if (GlobalMethods.isImageDataUri(fileName)) {
            return "image";
        } else if (pdfTypes.includes(fileType)) {
            return "pdf";
        } else if (localVideoFileTypes.includes(fileType)) {
            return "video-local-file";
        }

        // Remote streams
        if (fileName.substring(0, 4) === "http") {
            // MJPEG stream (camera stream)
            if (fileName.includes('.mjpeg') || fileName.includes('.mjpg') || fileName.includes(':8081')) {
                return "video-mjpeg";
            }
            // HLS stream
            else if (fileName.includes('.m3u8')) {
                return "video-hls";
            }
            // RTSP stream (would need conversion)
            else if (fileName.includes('rtsp://')) {
                return "video-rtsp";
            }
            // YouTube, Vimeo, etc.
            else if (fileName.includes('youtube') || fileName.includes('vimeo')) {
                return "video-remote-stream";
            }
            // fallback
            else {
                return "video-remote-stream";
            }
        } else if (fileName.substring(0, 5) === "rtsp:") {
            return "video-rtsp";
        }

        return undefined;
    };

    /**
     * Fetch image or pdf file content from server
     * 
     * invoked only in web mode
     * 
     * the file name might be
     *  - data uri, data:xxx
     *  - relative path, ../abc.jpg
     *  - absolute path, /abc.jpg
     *  - http/https path, https://abc.org/abc.jpg
     */
    fetchMediaContent = () => {
        const allText = this.getAllText();
        const fileName = allText["fileName"];
        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
        const mainProcessMode = displayWindowClient.getMainProcessMode();

        if (mainProcessMode === "desktop") {
            return;
        }

        // in web mode, we proceed to fetch the file content only if the file name is changed, 
        // it will save quite some network traffic
        if (!this.fileNameChanged()) {
            return;
        } else {
            this.setOldFileName(fileName);
        }

        // http..., web browser can directly use it
        if (GlobalMethods.isRemotePath(fileName)) {
            this.setBase64Content(fileName);
            return;
        }

        // data:xxx, web browser can directly use it
        if (GlobalMethods.isDataUri(fileName)) {
            this.setBase64Content(fileName);
            return;
        }

        // full image path, /home/ics/xxx.jpg
        const fullFileName = displayWindowClient.resolvePath(fileName);

        // if the file name indicates that is it not an image or pdf file
        const mediaType = this.getMediaType(fileName);
        if (mediaType !== "image" && mediaType !== "pdf") {
            this.setBase64Content("");
            g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
            g_widgets1.addToForceUpdateWidgets("GroupSelection2");
            g_flushWidgets();
            return;
        }


        // if the file name is a file name

        if (mainProcessMode === "web") {
            g_widgets1.getRoot().getDisplayWindowClient().getIpcManager().sendFromRendererProcess("get-media-content", {
                fullFileName: fullFileName,
                widgetKey: this.getWidgetKey(),
                displayWindowId: g_widgets1.getRoot().getDisplayWindowClient().getWindowId(),
            })
        } else if ((g_widgets1.getRoot().getDisplayWindowClient().getMainProcessMode() === "ssh-client")) {
            //todo: what is this? get-ssh-file does not exist on main process
            // Log.info("try to obtain file from ssh host")
            // g_widgets1.getRoot().getDisplayWindowClient().getIpcManager().sendFromRendererProcess("get-ssh-file", {
            //     displayWindowId: g_widgets1.getRoot().getDisplayWindowClient().getWindowId(),
            //     widgetKey: this.getWidgetKey(),
            //     fullFileName: fullFileName,
            // })
        }
    }

    /**
     * todo: do we really need it?
     */
    updateFileContents = (contents: string) => {
        const base64Content = this.getBase64Content();
        const fileName = this.getAllText()["fileName"];
        const mediaType = this.getMediaType(fileName);
        if (base64Content !== `data:image/png;base64,${contents}` && base64Content !== `data:image/svg+xml;utf8,${encodeURIComponent(contents)}` && base64Content !== `data:application/pdf;base64, ${encodeURI(contents)}`) {
            if (mediaType === "image") {
                this.setBase64Content(`data:image/png;base64,${contents}`);
            } else if (this.getMediaType(fileName) === "pdf") {
                this.setBase64Content(`data:application/pdf;base64, ${encodeURI(contents)}`);
            } else {
                this.setBase64Content("");
            }
            g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
            g_widgets1.addToForceUpdateWidgets("GroupSelection2");
            g_flushWidgets();
        } else {
            Log.debug("image is the same, do not update");
        }
    }


    handleSelectAFile = (options: Record<string, any>, fileName: string) => {
        this.getSidebar()?.updateFromWidget(undefined, "select-a-file", fileName);
    };

    /**
     * truncate the file name
     */
    trucateText = (text: string) => {
        return text.substring(0, 120);
    }

    fileNameChanged = () => {
        const allText = this.getAllText();
        return this._oldFileName !== allText["fileName"];
    }

    getBase64Content = () => {
        const mainProcessMode = g_widgets1.getRoot().getDisplayWindowClient().getMainProcessMode();
        if (mainProcessMode === "desktop") {
            return "";
        } else {
            return this._base64Content;
        }
    }

    setBase64Content = (newContent: string) => {
        return this._base64Content = newContent;
    }

    getOldFileName = () => {
        return this._oldFileName;
    }

    setOldFileName = (fileName: string) => {
        this._oldFileName = fileName;
    }


    // -------------------------- tdl -------------------------------

    static generateDefaultTdl = (): Record<string, any> => {

        const defaultTdl: type_Media_tdl = {
            type: "Media",
            widgetKey: "", // "key" is a reserved keyword
            key: "",
            style: {
                // basics
                position: "absolute",
                display: "inline-flex",
                // dimensions
                left: 0,
                top: 0,
                width: 100,
                height: 100,
                backgroundColor: "rgba(0, 0, 0, 0)",
                transform: "rotate(0deg)",
                color: "rgba(0,0,0,1)",
                // border, it is different from the "alarmBorder" below
                borderStyle: "solid",
                borderWidth: 0,
                borderColor: "rgba(0, 0, 0, 1)",
                // shows when the widget is selected
                outlineStyle: "none",
                outlineWidth: 1,
                outlineColor: "black",
            },
            text: {
                // media file name, could be picture types, pdf, or video type
                fileName: "../../../webpack/resources/webpages/tdm-logo.svg",
                // opacity
                opacity: 1,
                // for picture
                stretchToFit: false,
                invisibleInOperation: false,
                // actually "alarm outline"
                alarmBorder: true,
                alarmBackground: false,
                alarmLevel: "MINOR",
            },
            channelNames: [],
            groupNames: [],
            rules: [],
        };
        defaultTdl["widgetKey"] = GlobalMethods.generateWidgetKey(defaultTdl["type"]);
        return JSON.parse(JSON.stringify(defaultTdl));
    };

    generateDefaultTdl: () => any = Media.generateDefaultTdl;

    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new MediaSidebar(this);
        }
    };

    jobsAsOperatingModeBegins() {
        const text = this.getText();
        const fileName = text["fileName"];
        const fileType = this.getMediaType(fileName);
        if (fileType === "image") {
            this.setReadWriteType("read");
        } else {
            this.setReadWriteType("write");
        }
        super.jobsAsEditingModeBegins();
    }

}
