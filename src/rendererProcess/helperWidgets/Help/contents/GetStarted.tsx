import * as React from "react";
import { Help } from "../Help";
import { LINK, IMG, ARTICLE, P, H1, H2, H3, SLIDESHOW, LI } from "../Elements"

export const GetStarted = (widget: Help, linkPath: string) => {
    return <Element widget={widget} linkPath={linkPath}></Element>
}

const Element = ({ widget, linkPath }: any) => {
    const registry = React.useRef<Record<string, string[]>>({});

    return (<ARTICLE registry={registry} linkPath={linkPath} title={"Get Started"}>

        <H2 registry={registry}>TDM can be a website</H2>

        <P>
            TDM is available both as a desktop application and as a web service application.
            If your system administrator has set up a TDM web server on your control network,
            the simplest way to use TDM is to visit the provided website in your web browser.
            If not, ask them to deploy one.
        </P>

        <P>
            The TDM web service can provide most functionalities that a desktop version can offer.
            However, there are some limitations compared to the desktop application. For example,
            there are more restrictions on modifying the TDM files on a web server; 
            you cannot run a Python script attached to a TDM display.
            To gain the full full functionality of TDM, you need to install the desktop version.
            Below is a tutorial on how to use the desktop version of TDM.
        </P>

        <H2 registry={registry}>Download</H2>

        <P>
            You can download the binaries for different platforms
            from <b><LINK link={"https://github.com/diverhao/tdm/releases"}>Github</LINK></b>. TDM is built as portable software on Windows, Linux and MacOS
            for both ARM and x86-64 platforms. It provides the binaries for the following platforms:
        </P>

        <LI>
            Windows for Intel/AMD CPU: <code>win-unpacked.zip</code>
        </LI>
        <LI>
            Windows for ARM CPU: <code>win-arm64-unpacked.zip</code>
        </LI>
        <LI>
            MacOS Intel CPU: <code>TDM-25.4.8.dmg</code>
        </LI>
        <LI>
            MacOS M-series CPU: <code>TDM-25.4.8-arm64.dmg</code>
        </LI>
        <LI>
            Linux Intel/AMD CPU: <code>linux-unpacked.zip</code>
        </LI>
        <LI>
            Linux ARM CPU: <code>linux-arm64-unpacked.zip</code>
        </LI>

        <P>
            The binaries are typically published every month. Please check the Github website periodically for the latest version.
        </P>

        <H2 registry={registry}>Install and run</H2>

        <P>
            The TDM binaries are distributed as portable software, then simply unzip the downloaded file to any folder on your hard to finish the installation.
            All necessary dependencies, including the EPICS Channel Access client, are bundled within the package.
            You do not need to install any additional third-party programs or libraries to run TDM.
        </P>

        <P>
            For <b>MacOS</b>, double-click the <code>.dmg</code> file to mount it. In the window that appears,
            drag the <code>TDM.app</code> icon into the <code>/Applications</code> folder.
            Once copied, you can launch TDM by double-clicking <code>TDM.app</code> in the <code>/Applications</code> folder.
            Alternatively, you can start the software by running command <code>/Applications/TDM.app/Contents/MacOS/TDM</code> in the terminal.
        </P>

        <P>
            For <b>Windows</b>, you can unzip the <code>.zip</code> file to any folder, e.g. <code>C:\Program Files\TDM</code>. Then double click the <code>TDM.exe</code> file to run the software.
        </P>

        <P>
            For <b>Linux</b>, you can unzip the <code>.zip</code> file to any folder, and run the <code>./tdm</code> command in terminal or double click the <code>tdm</code> file in file browser
            to start the software.
        </P>

        You are expected to see a window like below:

        <IMG src={"resources/help/getStarted-00.png"}></IMG>


        <H2 registry={registry}>How to use</H2>

        <H3 registry={registry}>Create and edit a profile</H3>

        <P>
            After launching TDM, you can create a new Profile by clicking the <code>+</code> button.
            To view or edit this Profile, click the 3-dot button in the top-right corner of the profile block.
        </P>

        <P>
            In the Profile editor, you can rename the Profile by editing the text box in the top-left corner
            (remember to hit enter to confirm the change).
            TDM provides a set of pre-defined categories and entries required for operation.
            One of the most important settings is the <code>EPICS_CA_ADDR_LIST</code> entry,
            found under the <code>EPICS CA Settings</code> category. This environment variable can be defined in three places:
            the Channel Access client default, the operating system environment, and within TDM itself.
            In TDM, the value you set will override the others. As shown in the figure below,
            you can easily add, delete, or modify the hosts in the <code>EPICS_CA_ADDR_LIST</code> entry for your Profile.
        </P>

        <IMG src={"resources/help/getStarted-01.gif"}></IMG>

        <H3 registry={registry}>Create and run your first display</H3>

        <P>
            After the Profile is configured, we can run the TDM under this profile by clicking the profile block.
        </P>

        <IMG src={"resources/help/getStarted-03.png"}></IMG>


        <P>
            The window displayed here is the TDM Main Window, which serves as the central hub for managing your TDM instance.
            All window management features and tools are accessible directly through clearly labeled
            buttons—there are no dropdown menus or hidden options.
            This streamlined design ensures that all available functions are easy to find and operate,
            making navigation straightforward for users of any experience level.
        </P>

        <P>
            You can create a new display by clicking the <code>Create new display</code> button.
        </P>

        <P>
            There are 2 modes for a Display Window: editing mode and operating mode.
            In editing mode, you can create and modify the widgets on the display;
            in operate mode, the widgets are running and updating the values.
            A newly created display window is initially in editing mode, as shown below:
        </P>

        <IMG src={"resources/help/empty-display-window-editing.png"}></IMG>

        <P>
            The empty area on the left is called Canvas, the narrower area on the right is called
            sidebar. The Canvas is the background of the display, we can create widgets on it. The sidebar contains
            all the options for the window, Canvas and widgets.
        </P>

        <P>
            All the operations on the display window are integrated in the right click context menu.
            This includes creating, editing, and deleting widgets, as well as configuring the display settings.
            To create a widget, right click on the Canvas and choose the widget from
            one of the categories: <code>Create Static Widget</code>, <code>Create Monitor Widget</code>,
            <code>Create Control Widget</code>, and <code>Create Complex Widget</code>.
        </P>

        <P>
            One of the most commonly used widgets in a display manager is the <code>Text Update</code>.
            This widget monitors a PV (Process Variable) and displays its value in a rectangular block.
            To create a <code>Text Update</code> widget, right-click on the Canvas, select <code>Create Monitor Widget</code>, and
            then choose <code>Text Update</code>.
            The mouse cursor will change to a crosshair.
            Hold down the left mouse button to draw the desired area, then release it to place the widget.
            To configure the widget, click on the widget to
            open its sidebar.
            In the <code>Channel</code> input box of <code>Text Update</code> sidebar,
            after entering the PV name (e.g. <code>val7</code>), press the <b><code>Enter</code></b> key to confirm your input.
            This is a consistent requirement for all input boxes in TDM, ensuring that your
            changes are properly registered and applied throughout the application.
            You can further customize the widget by adjusting its position, size, alarm settings, text properties, background color, and more.
            Advanced features such as <code>Rules</code>for dynamic appearance changes will be introduced later.
        </P>

        <P>
            We are still in the <b><code>Editing</code></b> mode. To run the display window,
            right-click on the Canvas and select <code>Execute Display</code>.
            After that, the display window switches to <b><code>Operating</code></b> mode,
            where the sidebar disappears and the values start to update (assuming you already have an EPICS IOC running with
            this PV).
        </P>

        <P>
            The above operations are shown below:
        </P>

        <IMG src={"resources/help/getStarted-04.gif"}></IMG>

        <P>
            The display can be switched back to the <code>Editing</code> mode by right
            clicking the Canvas and select <code>Edit Display</code>.
        </P>

        <P>
            To control the PVs, we can use the <code>Control</code> widgets. The simplest and most commonly used control widget is the <code>Text Entry</code>.
            The creation of a <code>Text Entry</code> widget is similar to that of the <code>Text Update</code> widget.
            Right-click on the Canvas, select <code>Create Control Widget</code>, and then choose <code>Text Entry</code>.
            After the mouse cursor changes to a crosshair, Hold down the left mouse button to draw the desired area, then release it to place the widget.
            In the sidebar of the <code>Text Entry</code> widget, enter the PV name (e.g. <code>val7</code>) to be controlled
            in the <code>Channel</code> input box and press <b><code>Enter</code></b> to confirm.
        </P>

        <P>
            Once the <code>Text Entry</code> widget is created, switch the display window to <code>Operating</code> mode
            by right-clicking the Canvas and selecting <code>Execute Display</code> from the context menu.
            The sidebar will disappear, and the <code>Text Entry</code> widget will now display the current PV value.
            To change the PV, simply enter a new value in the widget and press <b><code>Enter</code></b>.
            The value will be sent to the EPICS IOC, and the PV will be updated in real time.
        </P>

        <P>
            The above operations are shown below:
        </P>

        <IMG src={"resources/help/getStarted-02.gif"}></IMG>

        <H2 registry={registry}>Widgets</H2>

        <P>
            TDM offers over 30 types of widgets, providing a comprehensive set of features for visualizing and controlling
            EPICS data in various formats.
            These widgets are organized into four categories:
        </P>


        <ul>
            <li>
                <P>
                    Static widgets. These widgets are used for displaying static content such as shapes, images, or fixed text.
                    They do not update automatically with EPICS PV changes and are ideal for adding labels, annotations, or decorative elements to the display.
                    For example, the <LINK widget={widget} to={"/StaticWidgets/Label"}>Label</LINK> widget can show static text or LaTeX-formatted formulas,
                    while the <LINK widget={widget} to={"/StaticWidgets/Media"}>Media</LINK> widget supports displaying images, PDF files, and local or remote video files.
                </P>
            </li>
            <li>
                <P>
                    Monitor widgets. These widgets are designed to visualize EPICS PV values in a variety of forms.
                    For example, the <LINK widget={widget} to={"/MonitorWidgets/TextUpdate"}>Text Update</LINK> widget
                    displays the current value as text within a rectangular block.
                    The <LINK widget={widget} to={"/MonitorWidgets/Tank"}>Tank</LINK> widget represents
                    the value as the fill level of a water tank, providing an intuitive visual cue.
                    The <LINK widget={widget} to={"/MonitorWidgets/LED"}>LED</LINK> widget offers a simple way
                    to monitor binary or status values, lighting up to indicate changes.
                </P>
            </li>
            <li>
                <P>
                    Control widgets. These widgets allow users to interact with and modify PV (Process Variable) values using various graphical controls.
                    The most basic example is the <LINK widget={widget} to={"/ControlWidgets/TextEntry"}>Text Entry</LINK>, which lets users input and set values directly.
                    For more intuitive adjustments, the <LINK widget={widget} to={"/ControlWidgets/ScaledSlider"}>Scaled Slider</LINK> enables
                    users to change values by dragging a slider.
                    Control widgets are essential for real-time operation and provide flexible ways to manage process variables within your display.
                </P>
            </li>
            <li>
                <P>
                    Complex widgets. These widgets are designed for advanced operations that often involve multiple PVs, displays, or steps of logic.
                    Complex widgets enable users to implement sophisticated workflows and interactions within TDM.
                    For example, the <LINK widget={widget} to={"/ComplexWidgets/ActionButton"}>Action Button</LINK> can
                    perform a variety of actions, such as opening another display window, launching a web page, or executing a command or
                    shell script with a single click.
                    The <LINK widget={widget} to={"/ComplexWidgets/DataViewer"}>Data Viewer</LINK> allows you to
                    visualize time series data for a PV.
                    If TDM is configured to be able to connect an Archiver, you can view both live and historical data together for comprehensive analysis.
                </P>
            </li>
        </ul>

        <P>
            Creating these widgets follows the same process as described for <code>Text Update</code> and <code>Text Entry</code> above.
            Each widget's sidebar contains configuration options,
            including common settings such as position, size, background color, text properties, and alarm settings.
            Additionally, every widget provides its own specific options, which are detailed in their respective chapters throughout
            this documentation.
        </P>


        <H2 registry={registry}>Tools</H2>

        <P>
            TDM includes a range of built-in tools designed to streamline your workflow and improve productivity.
            You can access all available tools directly from the Main Window for quick and convenient use.
            These tools are designed to assist with various tasks, such as monitoring PVs, managing displays, and configuring settings.
            Some of the key tools include:
        </P>

        {/* Figures for tools: PV Table, CA Snooper, DataViewer, Probe, ChannelGraph, Seq Graph, CASW, Profile and runtime info, File Converter */}

        <SLIDESHOW
            width={"90%"}
            images={["resources/help/getStarted-pvtable.png",
                `resources/help/getStarted-casnooper.png`,
                `resources/help/getStarted-dataviewer.png`,
                `resources/help/getStarted-probe.png`,
                `resources/help/getStarted-channelgraph.png`,
                `resources/help/getStarted-seqgraph.png`,
                `resources/help/getStarted-casw.png`,
                `resources/help/getStarted-profile-runtime-info.png`,
                `resources/help/getStarted-file-converter.png`,
            ]}
            titles={[
                "PV Table",
                "CA Snooper",
                "Data Viewer",
                "Probe",
                "Channel Graph",
                "Seq Graph",
                "Channel Access Server Watcher",
                "Profiles and Runtime Info",
                "File Converter",
            ]}
            texts={[
                `A table that shows many PVs at a time, allowing you to add, remove, and organize PVs or their fields in a tabular format for easy viewing and management.
                Invoking it from a operating display window will automatically add the PVs in the display to the table.`,
                `It listens to Channel Access name search requests in the network, in particular, the UDP traffice on port 5064 for any packets that 
                has a 0x0006 header.`,
                "It shows the time-series data for multiple PVs. If the TDM is configured with an EPICS Archiver, it can show historical data.",
                "It lists the detailed information about the PV, including its value, source, and all its field values.",
                "An interactive GUI tool for visualizing relationships between channels. You can expand the relationships by clicking each nodes.",
                "A GUI State Machine running in the TDM. It uses the SNL-like language to define the state machine logic. Each node represents a state, and the edges represent the transitions.",
                "It shows the all the EPICS Channel Access Server beacons in the network, i.e. the UDP packets on port 5065 that has a 0x000d header.",
                "It shows the profiles in this TDM, and other runtime information, such as the EPICS CA settings, opened windows, CPU usage, and network status for this TDM instance.",
                "A GUI tool for converting one or multiple .edl files to the TDM .tdl format.",
            ]}
        >
        </SLIDESHOW>



        <H2 registry={registry}>Advanced features</H2>

        <P>
            TDM provides some advanced features to enhance the flexibility and control of the EPICS PVs and the TDM displays.
        </P>

        <P>
            TDM displays support <b><code>Rules</code></b>, which allow you to dynamically change the appearance or behavior of widgets based on PV values or other conditions.
            For example, you can automatically change a widget's color, visibility, or text when a PV exceeds a threshold or matches a specific value.
            This enables you to build interactive and responsive displays that visually highlight important changes or states in your system.
            The <LINK widget={widget} to={"/AdvancedTopics/Rules"}>Rules</LINK> feature is explained in detail in its dedicated chapter.
        </P>

        <P>
            You can attach a <b><code>Python Script</code></b> to any TDM display to process data and dynamically control EPICS PV values.
            TDM offers a set of <LINK widget={widget} to={"/AdvancedTopics/PythonScript"}>Python functions</LINK> for
            reading, monitoring, and writing PVs directly from your script.
            In addition to these TDM-specific functions, you have access to all standard Python libraries
            installed on your system, as the script runs using your local Python interpreter.
            The Python script executes automatically whenever the display is running.
            By combining scripting with <b><code>Virtual PVs</code></b>         (using the <code>loc://</code> or <code>glb://</code> prefixes),
            you can define local variables and implement custom logic or workflows tailored to your needs.
            For details, please refer to the chapter on <LINK widget={widget} to={"/AdvancedTopics/LocalPv"}>Virtual PVs</LINK>.
        </P>

        <P>
            Updated August 2, 2025 by HH.
        </P>

    </ARTICLE>)
};
