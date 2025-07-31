import * as React from "react";
import { Help } from "../Help";
import { LINK, IMG, ARTICLE, P, H1, H2, H3, SLIDESHOW } from "../Elements"
import { GlobalVariables } from "../../../global/GlobalVariables";

export const GetStarted = (widget: Help, linkPath: string) => {
    return <Element widget={widget} linkPath={linkPath}></Element>
}

const Element = ({ widget, linkPath }: any) => {
    const registry = React.useRef<Record<string, string[]>>({});

    return (<ARTICLE registry={registry} linkPath={linkPath} title={"Get Started"}>

        <H2 registry={registry}>Download</H2>

        <P>
            You can download the binaries for different platforms
            from <LINK link={"https://controlssoftware.sns.ornl.gov"}>SNS software website</LINK>. TDM provides software on Windows, Linux and MacOS
            for both ARM and x86-64 platforms.
        </P>

        <H2 registry={registry}>Install</H2>

        <P>
            TDM includes a Node interpreter, there is no need to install Node separately.
            All the dependent libraries, including the EPICS Channel Access client, are packaged in the binary (folder).
            There is no need to install any additional third-party programs or libraries.
            The TDM is a portable software, you can place the code anywhere on your hard drive.
        </P>


        <H2 registry={registry}>Start</H2>
        <P>
            For MacOS, you can open the software by clicking the <code>.app</code> file. If you want to
            open multiple TDM instances, you need to directly run the binary inside <code>.app</code> file, i.e.
        </P>

        <code>/Applications/TDM.app/Contents/MacOS/TDM</code>

        <P>
            where we assume the <code>.app</code> file is located in <code>/Applications</code> folder.
        </P>

        <P>
            For Windows, you can open the software by clicking the <code>.exe</code> file.
        </P>

        <P>
            For Linux, enter the TDM folder from terminal, then run <code>./tdm</code> command to open TDM.
        </P>

        <P>
            You can also open a 
        </P>

        <H2 registry={registry}>How to use</H2>

        <P>
            In this section we will introduce how to use TDM in daily operation and development. It only scratches the
            surface of this software. For detailed information, please refer to the corresponding topic in this documentation.
        </P>

        <H3 registry={registry}>Create and modify your profile</H3>

        <P>
            Once started, there is a profile Get Started. It is a profile that has minimum configuration
            for the user to further config. You can play with this profile, or click the <code>+</code> button
            on the right to add a new profile.
        </P>
        <P>
            You can edit the profile by clicking the 3-dot sign on top-right corner of the
            profile block and choose <code>Edit</code>, as shown below:
        </P>

        <IMG src={"resources/help/getStarted-01.gif"}></IMG>

        <P>
            In the editing page,
            the <code>EPICS Environment</code> category includes the EPICS-related configurations.
            You can add, delete, and modify the configurations defined
            in <LINK link={"https://epics.anl.gov/EpicsDocumentation/AppDevManuals/ChannelAccess/cadoc_4.htm"}>EPICS Environment Variables</LINK>.
            For example, the below figure shows how to add new server to <code>EPICS_CA_ADDR_LIST</code>,
            and add/modify the <code>EPICS_CA_CONN_TMO</code>.
        </P>

        <IMG src={"resources/help/getStarted-02.gif"}></IMG>

        <P>
            Another commonly used profile category is the <code>EPICS Custom Environment</code>. It includes
            the TDM related information for operation. For example, the <code>Default TDL Files</code> is
            a list of file names. These files are automatically opened when this profile is selected.
            The <code>Default Search Paths</code> defines the search paths for the TDL files. <code>Default Mode</code> is
            could be either <code>operating</code> or <code>editing</code>. The default TDL files
            will be in these modes when they are first opened. There are more such configurations.
        </P>

        <H3 registry={registry}>Create your display</H3>

        <P>
            After the profile is set up, we can run the TDM that is configured as this profile.
            There is no TDL file opened for this profile. Below is what you will see
            after choosing the <code>Get Started</code> profile.
        </P>

        <IMG src={"resources/help/getStarted-03.png"}></IMG>

        <P>
            This screen is called main window. It is the management window for the current TDM instance.
            There are more than a dozen buttons in this window. You can click the <code>Create new display</code> button
            to create a new display.
        </P>

        <P>
            The new window shows an empty area called Canvas on the left and a narrower area, called
            sidebar, on the right. The Canvas is the background of the display, the sidebar has
            all the options for the display, including for Canvas and widgets.
        </P>

        <P>
            It is straightforward to set up the Canvas. The width and  height can be set manually
            in the input boxes. They can also be set by resizing the window. The macros table
            has 2 columns: one for the macro name (without the <code>${ }</code> or <code>$()</code> sign),
            one for the value.
        </P>

        <P>
            Next, let us create two widgets that monitor and control a PV.
            In TDM, all the operations are handled in right click context menu.
            To create the monitor widget, we right click on Canvas, choose <code>Create Monitor Widget</code> and
            <code>Text Update</code>. The mouse cursor becomes cross-hair shape. Then hold down the
            left mouse button to draw an area, then release the button.
            We can use a similar way to create a <code>Text Entry</code> widget to control the PV.
            On the sidebar of each widget, we can set the PV name to monitor or control.
        </P>

        <P>
            We are still in <code>Editing</code> mode, we can run the display window by
            right click and choose <code>Execute Display</code>. After that,
            the display window switched to <code>Operating</code> mode, the sidebar
            disappears, and the values start to update. We can change the PV value by
            typing in the <code>Text Entry</code> and press <code>Enter</code> key.
        </P>

        <P>
            The above operations are shown below:
        </P>

        <IMG src={"resources/help/getStarted-04.gif"}></IMG>

        <P>
            We can always switch back to the <code>Editing</code> mode by right
            clicking the Canvas and select <code>Edit Display</code>.
        </P>

        <H3 registry={registry}>Operate</H3>

        <P>
            In <code>Operating</code> mode, the control and monitor of the PVs are
            intuitive. As mentioned above, (almost) all the operations on the display window
            are integrated in the right click context menu. One exception is you can
            mid-click the widget to peek and copy the PV name.
        </P>

        <H3 registry={registry}>Various widgets</H3>
        <P>
            TDM has more than 30 types of widgets. They provide rich features for visualzing and
            controlling the EPICS data in different forms. They are categorized into 4 types:
        </P>

        <ul>
            <li>
                <P>
                    Static widgets. They are for static objects, like <LINK widget={widget} to={"/Label"}>Label</LINK> shows
                    a static text or a LaTeX format formula;
                    the <LINK widget={widget} to={"/Media"}>Media</LINK> widget can display picture, pdf file, or local/remote video files.
                </P>
            </li>
            <li>
                <P>
                    Monitor widgets. They display the PV values for an EPICS or Local channel.
                    For example, <LINK widget={widget} to={"/TextUpdate"}>Text Update</LINK> simply shows the value in a
                    rectangle block; <LINK widget={widget} to={"/Tank"}>Tank</LINK> shows the data in form of a water
                    tank; <LINK widget={widget} to={"/LED"}>LED</LINK> is a convenient tool to inspect the
                    bit values in the PV.
                </P>

            </li>
            <li>
                <P>
                    Control widgets. They are for controlling the PVs. The simplest one is the  <LINK widget={widget} to={"/TextEntry"}>Text Entry</LINK>, where
                    the user directly inputs and set the value. Using  <LINK widget={widget} to={"/ScaledSlider"}>Scaled Slider</LINK>, we can
                    change the value by sliding or clicking the widget.
                </P>
            </li>
            <li>
                <P>
                    Complex widgets. They are for complex operations. For example, the <LINK widget={widget} to={"/ActionButton"}>Action Button</LINK> can
                    do various jobs. We can use it to open another display window, or a web page. We can also execute a command (e.g. shell script)
                    by clicking it. Using <LINK widget={widget} to={"/DataViewer"}>Data Viewer</LINK>, we can view the time series data for a PV. If TDM is configured
                    with an Archiver, the archived data can be displayed together with the live ones.
                </P>
            </li>
        </ul>

        <P>
            You can use these different types of widgets to build the display window, showing and controlling the device.
        </P>

        <H3 registry={registry}>Post-process data</H3>

        <P>
            TDM provides several advanced features to post-process data. One of them is the computed PV.
        </P>

        <IMG src={"resources/help/getStarted-05.gif"}></IMG>

        <P>
            In a computed PV, the value of an EPICS PV is evaluted in square brackets, i.e. <code>[val7]</code>. We can
            treat <code>[val7]</code> as a number, then apply the corresponding mathematical operation, like <code>[val7] * 3</code>.
            The computed PV follows the syntax of <LINK link={"https://mathjs.org/docs/index.html"}>math.js</LINK>, it
            support most commonly used mathematical opeations. For example,  <code>sqrt(abs(sin([val7] * 3) - 2.8))</code> and <code>sin([val7]) &lt; 0 ? 1 : -1</code>.
        </P>

        <P>
            In TDM, each display can run a standalone Python or Node script for data post-processing.
            The Python binary path is set in the profile. Please refer to <LINK widget={widget} to={"/PythonScript"}></LINK> or  <LINK widget={widget} to={"/JavaScriptScript"}></LINK> for
            details. Here we present a simple example that doubles the value of an EPICS PV.
            Assume there is an EPICS PV <code>val7</code>, we can use a Python script to double
            its value and shown as a Local PV, <code>loc://val7_double</code>. First, create
            a Python script with following contents:
        </P>

        <code># Load libs</code>
        <code>import sys</code>
        <code>import os</code>
        <code>sys.path.append(os.path.abspath("/Applications/TDM.app/Contents/Resources/app.asar.unpacked/dist/mainProcess/wsPv/WsPvClient.py"))</code>
        <code>import WsPvClient</code>
        <code></code>
        <code># create client</code>
        <code>client = WsPvClient.WsPvClient()</code>
        <code></code>
        <code># callback when new value arrives</code>
        <code>def doubleValue(data):</code>
        <code>&nbsp;&nbsp;&nbsp;&nbsp;value = data["value"]</code>
        <code>&nbsp;&nbsp;&nbsp;&nbsp;client.put("loc://val7_double", value * 2)</code>
        <code></code>
        <code># monitor the EPICS channel and double it</code>
        <code>client.monitor("val7", doubleValue)</code>
        <code></code>
        <code># run the program</code>
        <code>client.run()</code>


        <P>
            TDM provides a Text Editor to edit simple text files. You can click the Text Editor button
            on the main window to open it. Or click the <img src={"resources/webpages/modify-symbol.svg"} width={`${GlobalVariables.defaultFontSize}px`}></img> symbol
            to open the existing or create a new Python script.
        </P>

        <P>
            In above code, the long path <code>/Applications/TDM.app/.../WsPvClient.py</code> is the API file
            for the communication between TDM and Python.
        </P>

        <H3 registry={registry}>Change widget apperance at runtime</H3>

        <P>
            Most of the time, the widget should only update the value displayed on the screen. Sometimes we may need
            the widget changing its appearance to draw attention. For example, when the PV is in MAJOR severity,
            we want to alert the operator by showing a red border. This can be done in the widget's <code>Alarm Border</code> option.
            In TDM, more complicated appearance change can be realized by the <code>rules</code>.
        </P>

        <P>
            We can define one or more rules, where for each rule there are 3 components: <code>condition</code>, <code>property</code>, and <code>value</code>.
            We can interprete them as: when <code>condition</code> is true, the <code>property</code> becomes <code>value</code>.
            The <code>condition</code> must be evaluated as true or false, e.g. <code>[val7] &ge; 0</code>, <code>[val7] == 38</code>, or <code>true</code>.
            If a <code>condtion</code> is not valid, the rule is not applied.
            Note numerical 0 or 1 is not considered as a valid <code>condition</code>.
        </P>

        <P>
            Below shows an example that when <code>val7</code> is an even number, the widget width is changed shorter, and when <code>val7</code> is
            divisible by 3, the background color becomes red. We use 2
            computed PVs <code>[val7] % 2 == 0</code> and <code>[val7] % 3 == 0</code> for the these rules.
        </P>

        <IMG src={"resources/help/getStarted-06.gif"}></IMG>

        <H3 registry={registry}>Tools</H3>

        <P>
            TDM provides several tools to help managing the software and the data. For example, the <code>CA Snooper</code> is used for detecting new 
            Channel Access name search requests. You can find this tool from the main window.
        </P>

        <IMG src={"resources/help/getStarted-07.png"}></IMG>

        <P>
            The <code>PV Table</code> can be used to monitor multiple channels at a time. 
            There are several ways to add new channels to it:
        </P>

        <IMG src={"resources/help/getStarted-08.gif"}></IMG>

        <P>
            or, you can directly open a <code>.db</code> file to load all its channels.
        </P>

        <IMG src={"resources/help/getStarted-09.gif"}></IMG>


    </ARTICLE>)
};
