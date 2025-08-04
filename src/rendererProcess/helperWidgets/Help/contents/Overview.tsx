import * as React from "react";
import { Help } from "../Help";
import { LINK, IMG, ARTICLE, P, H1, H2, H3, SLIDESHOW, LI } from "../Elements"

export const Overview = (widget: Help, linkPath: string) => {
    return <Element widget={widget} linkPath={linkPath}></Element>
}

const Element = ({ widget, linkPath }: any) => {
    const registry = React.useRef<Record<string, string[]>>({});

    return (<ARTICLE registry={registry} linkPath={linkPath} title={"Overview"}>

        <P>
            TDM is a display manager for the <LINK link={"https://epics-controls.org/"}>EPICS</LINK> control system.
            It runs on x86 or ARM computers with Windows, macOS, or Linux operating systems.
            With TDM, you can create, edit, and operate graphical user interfaces to monitor and control EPICS channels (process variables).
            The software is designed for flexibility and ease of use, supporting both simple and complex control system configurations.
        </P>
        <P>
            In TDM, EPICS channels are monitored and controlled using a variety of widgets arranged within display windows.
            You can easily organize these widgets by dragging and dropping them to create intuitive layouts tailored to your needs.
            For complex control systems, multiple windows can be opened and managed simultaneously.
            The graphical user interface in TDM is defined by JSON-style <code>.tdl</code> files.
            Although these files can be edited as plain text, it is recommended to use TDM’s built-in editor to ensure consistency and compatibility.
        </P>
        <P>
            At the top level, users can create and manage multiple profiles,
            each representing a distinct EPICS environment with its own site-specific variables.
            Profiles are stored as JSON files and can be easily browsed or edited using TDM's built-in GUI tools.
            This enables seamless switching between environments such as development, testing, and production.
        </P>

        <P>
            Each display window in TDM operates as an independent process, taking advantage of modern multi-core architectures to improve both performance and reliability.
            This design allows TDM to handle large and complex control systems efficiently, ensuring that each window can operate without affecting the others.
            The TDM main window provides an overview of all open windows, allowing users to quickly access and manage them.
            This feature is particularly useful for systems with multiple display windows, as it simplifies navigation and enhances user experience.
        </P>

        <P>
            TDM offers a variety of tools to improve the efficiency of operation, enabling users to work more effectively with EPICS channels.
            One particular goal is to minimize the need for users to remember specific channel names,
            allowing them to focus on the task at hand rather than memorizing technical details.
            For example, <LINK widget={widget} to={"/Tools/Probe"}>Probe</LINK> provides
            detailed information about the PV. The <LINK widget={widget} to={"/Tools/DataViewer"}>Data Viewer</LINK> tool displays data history effectively.
            The <LINK widget={widget} to={"/Tools/ChannelGraph"}>Channel Graph</LINK> is a GUI tool for analyzing and visualizing relationships between channels.
        </P>

        <P>
            TDM includes advanced features to enhance flexibility and control.
            <LINK widget={widget} to={"/AdvancedTopics/Rules"}> Rules </LINK> and
            <LINK widget={widget} to={"/AdvancedTopics/PythonScript"}>Python Script</LINK> allow users to process data and dynamically control widget behavior at runtime.
            The <LINK widget={widget} to={"/AdvancedTopics/LocalPv"}>Local PV</LINK> feature lets you create local variables for custom data manipulation and workflow optimization.
        </P>
        <P>
            TDM can seamlessly open <LINK widget={widget} link={"https://github.com/gnartohl/edm"}>Extensive Display Manager</LINK> (EDM)
            files (<code>.edl</code>), preserving both the appearance and functionality of the original screens.
            <code>.edl</code> files are automatically converted to TDM format on-the-fly, with conversion times ranging from less than a second to several seconds depending on file complexity.
            For batch conversions, TDM also provides a standalone tool, <LINK widget={widget} to={"/Tools/FileConverter"}>File Converter</LINK>, to efficiently convert multiple <code>.edl</code> files to <code>.tdl</code> format.
        </P>

        <H2 registry={registry}>TDM at a Glance</H2>
        {/* EDM screen */}
        <SLIDESHOW
            width={"90%"}
            images={["resources/help/usage-example-01.png",
                `resources/help/usage-example-02.png`,
                `resources/help/usage-example-03.gif`,
                `resources/help/usage-example-04.gif`,
                `resources/help/usage-example-05.gif`,
                `resources/help/usage-example-06.png`,
                `resources/help/usage-example-07.gif`,
                `resources/help/usage-example-08.png`,
            ]}
            titles={[
                "Main window",
                "Graphical editor for TDM profile",
                "Open a profile",
                "Create widgets",
                "Probe",
                "EDM screen",
                "Local PV and Python script",
                "Thumbnails of all TDM windows",
            ]}
            texts={[
                "The main window allows you to choose different profiles. Each profile is a self contained EPICS environment",
                "Using the graphical editor, you can modify the profile.",
                "Open a profile that has a default window. You can run or edit this window.",
                "Create a Text Update widget and a Text Entry widget to monitor and control EPICS channel.",
                "You can inspect all fields of an EPICS channel using Probe.",
                "A comparison between native EDM screen (top) and the TDM-rendered EDM screen (bottom).",
                "The combination of Local PV and Python script can post-process and present the data in a more convenient way.",
                "All TDM windows are displayed as thumbnails in the main window, using which you can quickly access to all of them by clicking the thumbnail. Tip: use the mid-click to close the window."
            ]}
        >
        </SLIDESHOW>

        <H2 registry={registry}>Documentation</H2>

        <P>
            This document can be found by clicking the <code>Help</code> button in the TDM software. It is also
            available online at <LINK link={"https://diverhao.github.io/misc/tdm/help/HelpWindow.html"}>https://diverhao.github.io/misc/tdm/help/HelpWindow.html</LINK>.
        </P>

        <P>
            For enhanced support, you can use this documentation with an AI agent such as
            <LINK link={"https://chatbase.com"}>Chatbase</LINK> to ask questions about TDM.
            The source material for this documentation is available at
            <LINK link={"https://github.com/diverhao/misc/tree/main/tdm/help/doc_raw"}>https://github.com/diverhao/misc/tree/main/tdm/help/doc_raw</LINK>.
            You may upload these raw text files to create an AI agent dedicated for TDM.
            Below is an example of using Chatbase to interact with TDM documentation:
        </P>

        <IMG width={"50%"} src={"resources/help/tdm-chatbase.gif"}></IMG>

        <H2 registry={registry}>Developers</H2>
        <ul>
            <LI>Hao Hao, Oak Ridge National Laboratory, haoh@ornl.gov</LI>
            <LI>Bixiao Zhao, Knox County Schools, zhao.bixiao@gmail.com</LI>
        </ul>
        <H2 registry={registry}>License</H2>
        <P>This software is distributed in <LINK link={"https://opensource.org/license/mit/"}>MIT license</LINK>.</P>

    </ARTICLE>)
};
