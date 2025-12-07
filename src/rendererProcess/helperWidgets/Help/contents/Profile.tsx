import * as React from "react";
import { Help } from "../Help";
import { LINK, IMG, ARTICLE, P, H1, H2, H3, SLIDESHOW, CODE, LI } from "../Elements"

export const Profile = (widget: Help, linkPath: string) => {
    return <Element widget={widget} linkPath={linkPath}></Element>
}

const Element = ({ widget, linkPath }: any) => {
    const registry = React.useRef<Record<string, string[]>>({});

    return (<ARTICLE registry={registry} linkPath={linkPath} title={"Profile"}>

        <P>
            The Profile is introduced in TDM to simplify the management of EPICS-related and other environment variables.
            Within each profile, we define and manage these variables in a graphical user interface.
            Each profile contains a complete set of variables to run a TDM instance.
            For example, one profile can be used in the test environment, another
            profile can be used in the production environment.
            The user chooses to run the TDM instance under
            one of the profiles.
        </P>

        <P>
            Under the hood, all the TDM profiles are contained in one JSON file.
            By default, this file is located at <code>$(HOME)/.tdm/profiles.json</code>.
            In Linux and MacOS, <code>$(HOME)</code> is the home directory of the user, like
            <code>/home/john</code> or <code>/Users/john</code>; in Windows, it is like <code>C:\Users\john</code>.
            TDM will try to create an empty JSON file if it does not exist. You can also manually choose
            the profiles file from the startup page:


        </P>

        <IMG src={"resources/help/open-profiles-file.gif"} width={"99%"}></IMG>

        <H2 registry={registry}>Edit profile</H2>

        <P>
            The TDM profiles file file contains
            one or more profiles.
            It is in JSON format, which can be edited using any text editor.

            The profiles file is defined in a particular way so that it can be opened by the profile graphical editor interface
            provided by TDM.
            Inconsistent formatting or missing fields may cause the TDM fail to load or edit the profiles.
            Therefore, while it is possible, it is <b>not recommended</b> to manually
            edit this JSON file.
        </P>

        <P>
            TDM provides a graphical user interface to edit the profiles.
            You can access
            this tool by clicking the 3 vertical dots on each profile block, and choose <code>Edit</code>.
            The profile editor provides full access to the profile categories and their entries.
            You can add, modify, and delete both name and value of any item.
            TDM predefined several categories for the basic functionalities:
            <code>About</code>, <code>EPICS Environment</code>,  <code>EPICS Custom Environment</code>, and  <code>Preset Colors</code>.
            There are two data types that a user can use for a new entry: primitive data type and array data type.
            The primitive data type can hold number and string data; the array data type can hold
            array of numbers or strings.
        </P>

        <ul>
            <LI>
                <code>About</code>. It contains a simple description of the profile. You can add
                more information to it, like the profile name, version, usage, and maintainer.
            </LI>
            <LI>
                <code>EPICS CA Settings</code>. It contains the EPICS Channel Access settings.
                The entry names in this category are the same as the EPICS Environment variables.
                You can add, modify, and delete any entry in this category.
            </LI>
        </ul>
        <P>
            Technically you can remove any category or entry. The TDM still run properly with the default
            categories or entries not explicitly defined. However, it is strongly recommended not
            removing these defaults for a consistent configuration across multiple users and computers.
        </P>

        <P>
            If TDM integrates a new functionality that requires the user-specific configuration, e.g. the EPICS archive
            database, we can add a new category or entry for it. Then you can
            obtain the configuration values via the <code>Profile</code> API.
        </P>

        <H3 registry={registry}>EPICS environment</H3>

        <P>
            The Channale Access client in TDM uses the entries defined in <code>EPICS Environment</code> category to
            find, monitor, and control EPICS PVs. The entry names in this category should be
            a valid <LINK link={"https://epics.anl.gov/EpicsDocumentation/AppDevManuals/ChannelAccess/cadoc_4.htm"}>EPICS Environment Variables</LINK>.
        </P>

        <H3 registry={registry}>EPICS custom environment</H3>

        <P>
            The <code>EPICS Custom Environment</code> category is mostly for the operation of the TDM display windows.
            One important concept in this category is the default TDL files. They are the TDL files
            that are automatically opened upon we select to run a profile.
            You can define multiple such files.
            If a default TDL files entry is not an absolute path, TDM will search the Default Search Paths non-recursively
            for the file. In this category, you can also define other properties of the default TDL files,
            e.g. their display windows are editable or not, they are in operating or editing mode.
        </P>

        <H3 registry={registry}>Other categories</H3>

        <P>
            There is another category <code>Preset Colors</code>. It pre-defines a set of colors
            for users to use. You can use them in the any color platte.
        </P>


        <IMG src={"resources/help/Profile-01.png"} width={"26%"}></IMG>

        <H2 registry={registry}>Runtime profile</H2>

        <P>
            When a profile is selected, its Channel Access client loads the EPICS environment in the order of
            default EPICS value, operating system defined value, and the TDM-defined value. The later one
            overrides or prepend to the earlier values. For example,
            the <code>EPICS_CA_ADDR_LIST</code> has an empty default value in EPICS, the operating system
            defines <code>10.1.20.200, localhost</code>, the TDM defines <code>152.31.65.5</code>. Then the
            overall value is <code>152.31.65.5, 10.1.20.200, localhost</code>.
        </P>

        <P>
            Once the profile is running, you can find the profile and EPICS information from <code>Profile and runtime info</code> button
            on the main display.
        </P>

        <H2 registry={registry}>Run multiple profiles</H2>

        <P>
            The concept of profile allows us to separate the runtime for different environments. TDM allows
            us to run different or same profiles simultaneously in one instance. You can open a
            different profile (or process) by clicking the <code>New TDM process</code> on the
            main window of a already running process.
        </P>

    </ARTICLE>)
};
