import * as React from "react";
import { Help } from "../Help";
import { LINK, IMG, ARTICLE, P, H1, H2, H3, SLIDESHOW, LI } from "../Elements"

export const Overview = (widget: Help, linkPath: string) => {
    return <Element widget={widget} linkPath={linkPath}></Element>
}

const Element = ({ widget, linkPath }: any) => {
    const registry = React.useRef<Record<string, string[]>>({});

    return (<ARTICLE registry={registry} linkPath={linkPath} title={"Overview"}>

        <P>TDM is a display manager for <LINK link={"https://epics-controls.org/"}>EPICS </LINK>
            control system. It runs on x86- or ARM-based computer with Windows, MacOS, or
            Linux operating system. Using this software, you can create, edit, and run graphical user interfaces
            to monitor and control EPICS channels (process values).</P>
        <P>
            In TDM, EPICS channels are monitored and controlled through various widgets displayed in the display windows.
            This software offers great flexibility, allowing you to arrange these widgets on a window using simple drag-and-drop
            mouse actions. For managing complex control systems, you can open multiple windows simultaneously.
            In TDM, the graphical user interface is described by a JSON-style file type, <code>.tdl</code>.
            While it is possible to edit the <code>tdl</code> files as plain text, it is
            recommended to use TDM for editing these file for consistency and compatibility.
        </P>
        <P>
            At the top level, users can create and run multiple profiles.
            Each profile defines its own EPICS environments and site-specific variables, operating independently.
            These profiles are stored in JSON-format files. TDM provides a GUI tool to browse and modify these profiles easily.
        </P>

        <P>
            Benefited from the technical choice, each display window in TDM runs as an independent process. This approach leverages
            multi-core architect on modern computer, enchancing both performance and robustness of the software.
        </P>

        <P>
            TDM offers a variety of tools for convenient operation. For example, <LINK widget={widget} to={"/Probe"}>Probe</LINK> provides
            detailed information about the PV. The <LINK widget={widget} to={"/DataViewer"}>Data Viewer</LINK> tool displays data history effectively.
            Additionally, the <LINK widget={widget} to={"/CaSnooper"}>CA Snooper</LINK>  is a GUI tool for  shows information for multiple PVs in a tabular format.
        </P>

        <P>Advanced features, such as <LINK widget={widget} to={"/Rules"}>Rules</LINK> and <LINK widget={widget} to={"/PythonScript"}>Script</LINK>, enables post-process
            the data and control the widget behaviors at runtime. Additionally, <LINK widget={widget} to={"/LocalPv"}>Local PV</LINK> allows
            users to create local variables to assist data manipulation.
        </P>

        <P>TDM can directly open <LINK widget={widget} link={"https://github.com/gnartohl/edm"}>Extensive Display Manager</LINK> (EDM)
            files (<code>.edl</code>), preserving the looks and functionalities of the original screen.
            The <code>.edl</code> files are converted to TDM format files on-the-fly. This process may take from a fraction of second to tens of seconds,
            depending on the complexity of the <code>.edl</code> file. Additionally, TDM provides a standalone tool for converting multiple <code>.edl</code> to <code>.tdl</code> files.</P>

        <H2 registry={registry}>TDM at a Glance</H2>
        {/* EDM screen */}
        <SLIDESHOW
            images={["../../resources/help/usage-example-01.png",
                `../../resources/help/usage-example-02.png`,
                `../../resources/help/usage-example-03.gif`,
                `../../resources/help/usage-example-04.gif`,
                `../../resources/help/usage-example-05.gif`,
                `../../resources/help/usage-example-06.png`,
                `../../resources/help/usage-example-07.gif`,
                `../../resources/help/usage-example-08.png`,
            ]}
            titles={["Main window",
                "Graphical editor for TDM profile",
                "Open a profile",
                "Create widgets",
                "Probe",
                "EDM screen",
                "Local PV and Python script",
                "Thumbnails of all TDM windows",
            ]}
            texts={["The main window allows you to choose different profiles. Each profle is a self contained EPICS environment",
                "Using the graphical editor, you can modify the profile settings.",
                "Open a profile that has a default window. You can run or edit this window.",
                "Create a Text Update widget and a Text Entry widget to monitor and control EPICS channel.",
                "You can inspect all fiels of an EPICS channel using Probe.",
                "A comparison between native EDM screen (top) and the TDM-rendered EDM screen (bottom).",
                "The combination of Local PV and Python script can post-process and present the data in a more convenient way.",
                "All TDM windows are displayed as thumbnails in the main window, using which you can quickly access to all of them by clicking the thumbnail. Tip: use the mid-click to close the window."
            ]}
        >
        </SLIDESHOW>



        <H2 registry={registry}>Developers</H2>
        <ul>
            <LI>Hao Hao, Oak Ridge National Laboratory, haoh@ornl.gov</LI>
            <LI>Bixiao Zhao, Knox County Schools, zhao.bixiao@gmail.com</LI>
        </ul>
        <H2 registry={registry}>License</H2>
        <P>This software is distributed in <LINK link={"https://opensource.org/license/mit/"}>MIT license</LINK>.</P>

    </ARTICLE>)
};
