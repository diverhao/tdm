import * as React from "react";
import { Help } from "../Help";
import { LINK, IMG, ARTICLE, P, H1, H2, H3, SLIDESHOW, LI } from "../Elements"

export const ConfigureWebServer = (widget: Help, linkPath: string) => {
    return <Element widget={widget} linkPath={linkPath}></Element>
}

const Element = ({ widget, linkPath }: any) => {
    const registry = React.useRef<Record<string, string[]>>({});

    return (<ARTICLE registry={registry} linkPath={linkPath} title={"Configure Web Server"}>

        <H2 registry={registry}>Configure server</H2>

        <H2 registry={registry}>Start server</H2>

        <P>
        TDM allows to run as a web server in the background, providing service to monitor the EPICS channels. 
        The server is started using the below command:
        </P>

        <code>
            ./TDM --main-process-mode web --http-server-port 3001
        </code>

        <P>
        where <code>./TDM</code> is the binary of the program. In here, we start the server in the <code>web</code> mode,
        with the port 3001. The default port is 3000. There is no GUI window pop up in the <code>web</code> mode. The
        program runs in the command line. User can visit the website through the web browser by typing
        </P>

        <code>
            https://server-name.org:3001
        </code>

        In the operation, TDM has 2 types of display windows: main window and display window. The main window is
        a centralizaed location for the current profile. The display window is for monitoring
        and controlling.

        <H2 registry={registry}>Main window</H2>

        <P>
            The main window comes with more than one dozen buttons on the upper area. Some of them are
            tools for a convenient operation. Others are for the operation.
        </P>

        <P>
            The bottom area shows the thumbnails of the opened dispaly windows. It provides a quick overview
            of the current display windows on top of the operating system window manager. You can click each
            thumbnail to bring up the window, or mid-click it to close the window.
        </P>

        <P>
            The main window is not required to be opened all the time. You can close it and reopen it
            from the display window. TDM quits when the last visible window, main window or display window,
            is closed.
        </P>

        <H2 registry={registry}>Display window</H2>

        <P>
            There are 2 modes for a display window: operating mode and editing mode. In here
            we will introduce the operating mode. For editing mode, please refer to
            the <LINK widget={widget} to={"/edit"}>Edit</LINK> chapter.
            In operating mode, the Channel Access client in the main process connects and monitors
            the EPICS PVs and update the values on the window, in short, the display window is "alive".
        </P>

        <P>
            All the operations for this window can be found in right click context menu.
            Depending on where you click the right button and the display's property,
            the contex menu is slightly different.
            You can get a copy of the PV name by clicking the <code>Copy PV Names</code> over
            the widget. Another way is mid-clicking the widget, which peeks and copies the
            PV name of this widget (the best feature of <LINK link={"https://github.com/gnartohl/edm"}>EDM</LINK>).
        </P>

        <IMG src={"resources/help/operation-01.png"} width={"33%"}></IMG>

        <P>
            Most options in this menu are intuitive. One of them is the <code>Duplicate Display</code>,
            it creates a duplicate of the current display. The duplicate is not related to the original one,
            it is not saved on the hard drive. You can modify it without worrying about accidentally
            modifying the orignal one. It is also useful if the original display is not editable but we want
            to inspect the display.
        </P>

        <P>
            The <code>Copy All PV Values</code> or <code>Copy</code> copies the all the available values associated
            to these PVs as a JSON text:
        </P>

        <code>&#123;</code>
        <code>"val1": &#123; </code>
        <code>&nbsp;&nbsp;&nbsp;&nbsp;"value": 314, </code>
        <code>&nbsp;&nbsp;&nbsp;&nbsp;"severity": 1, </code>
        <code>&nbsp;&nbsp;&nbsp;&nbsp;"status": 4, </code>
        <code>&nbsp;&nbsp;&nbsp;&nbsp;"precision": 0, </code>
        <code>&nbsp;&nbsp;&nbsp;&nbsp;"padding": 1, </code>
        <code>&nbsp;&nbsp;&nbsp;&nbsp;"units": "km", </code>
        <code>&nbsp;&nbsp;&nbsp;&nbsp;"upper_display_limit": 20, </code>
        <code>&nbsp;&nbsp;&nbsp;&nbsp;"lower_display_limit": 2, </code>
        <code>&nbsp;&nbsp;&nbsp;&nbsp;"upper_alarm_limit": 500, </code>
        <code>&nbsp;&nbsp;&nbsp;&nbsp;"upper_warning_limit": 50, </code>
        <code>&nbsp;&nbsp;&nbsp;&nbsp;"lower_warning_limit": null, </code>
        <code>&nbsp;&nbsp;&nbsp;&nbsp;"lower_alarm_limit": null, </code>
        <code>&nbsp;&nbsp;&nbsp;&nbsp;"secondsSinceEpoch": 1089405458, </code>
        <code>&nbsp;&nbsp;&nbsp;&nbsp;"nanoSeconds": 416439000, </code>
        <code>&nbsp;&nbsp;&nbsp;&nbsp;"DBR_TYPE": 27, </code>
        <code>&nbsp;&nbsp;&nbsp;&nbsp;"valueCount": 1, </code>
        <code>&nbsp;&nbsp;&nbsp;&nbsp;"serverAddress": "10.159.199.43:5064", </code>
        <code>&nbsp;&nbsp;&nbsp;&nbsp;"accessRight": "READ_WRITE" </code>
        <code>&nbsp;&nbsp;&nbsp;&nbsp;&#125;, </code>
        <code>"val7": &#123; </code>
        <code>&nbsp;&nbsp;&nbsp;&nbsp;"value": 565, </code>
        <code>&nbsp;&nbsp;&nbsp;&nbsp;"severity": 0, </code>
        <code>&nbsp;&nbsp;&nbsp;&nbsp;"status": 0, </code>
        <code>&nbsp;&nbsp;&nbsp;&nbsp;"precision": 0, </code>
        <code>&nbsp;&nbsp;&nbsp;&nbsp;"padding": 524, </code>
        <code>&nbsp;&nbsp;&nbsp;&nbsp;"units": "km", </code>
        <code>&nbsp;&nbsp;&nbsp;&nbsp;"upper_display_limit": 20, </code>
        <code>&nbsp;&nbsp;&nbsp;&nbsp;"lower_display_limit": 2, </code>
        <code>&nbsp;&nbsp;&nbsp;&nbsp;"upper_alarm_limit": null, </code>
        <code>&nbsp;&nbsp;&nbsp;&nbsp;"upper_warning_limit": null, </code>
        <code>&nbsp;&nbsp;&nbsp;&nbsp;"lower_warning_limit": null, </code>
        <code>&nbsp;&nbsp;&nbsp;&nbsp;"lower_alarm_limit": null, </code>
        <code>&nbsp;&nbsp;&nbsp;&nbsp;"secondsSinceEpoch": 1089405458, </code>
        <code>&nbsp;&nbsp;&nbsp;&nbsp;"nanoSeconds": 47485000, </code>
        <code>&nbsp;&nbsp;&nbsp;&nbsp;"DBR_TYPE": 27, </code>
        <code>&nbsp;&nbsp;&nbsp;&nbsp;"valueCount": 1, </code>
        <code>&nbsp;&nbsp;&nbsp;&nbsp;"serverAddress": "127.0.0.1:5064", </code>
        <code>&nbsp;&nbsp;&nbsp;&nbsp;"accessRight": "READ_WRITE" </code>
        <code>&nbsp;&nbsp;&nbsp;&nbsp;&#125;</code>
        <code>&#125;</code>

        <H2 registry={registry}>Limitations</H2>

        <P>
            TDM may be monitoring many PVs. Everytime a new value arrives, the Channel Access
            client runs a callback sending the new data from main process to renderer processes.
            However, a new value may arrive at any time, in this way, the IPC mechanism may suffer
            from a traffic with large amount of size packages. To reduce the IPC traffic, TDM
            uses a 10 Hz scheduler to periodically send all the new values in past 0.1 second
            from main process to renderer processes as a whole.
            In this way, the load on the main process is more predictable and managable.
            The down side is in the worst case the value shown on the display window is 0.1 second
            behind the actual arrival time, and some <code>.1 second</code> scan PVs may be skipped.
            Since the EPICS CA data package comes with its own
            timestamp, the time for the PV is still correct.
        </P>


    </ARTICLE>)
};
