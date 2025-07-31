import * as React from "react";
import { Help } from "../Help";
import { LINK, IMG, ARTICLE, P, H1, H2, H3, SLIDESHOW, LI } from "../Elements"

export const TechnicalOverview = (widget: Help, linkPath: string) => {
    return <Element widget={widget} linkPath={linkPath}></Element>
}

const Element = ({ widget, linkPath }: any) => {
    const registry = React.useRef<Record<string, string[]>>({});

    return (<ARTICLE registry={registry} linkPath={linkPath} title={"Technical Overview"}>
      
        <P>TDM is based on a technical stack of the web technologies. 
            The contents displayed on each window is essentially a webpage. 
            Its main developing language is  <LINK link={"https://www.typescriptlang.org/"}>TypeScript</LINK>, 
        a superset of the JavaScript with type definition. The webpage is constructed using a JSX technology, the <LINK link={"https://react.dev/"}> React</LINK>. The desktop GUI interface is based on 
        <LINK link={"https://www.electronjs.org/"}> Electron</LINK>, which is a "desktop" version 
        of <LINK link={"https://www.chromium.org/chromium-projects/"}>Chromium</LINK> on which the programs
        can use local resources such as hard drive and network interfaces. 
        Technically TDM runs on any platform that can Chromium. This technology 
        stack ensures a cross-platform compatibility of the TDM, which has significantly reduced the 
        development effort and gaurantees the consistency of looks for the screens across various 
        platforms.
        </P>

        <P>
            TDM comes with a Electron-based Node interpreter. There is no third party software or library needed to run TDM.
        </P>

        <P>
        TDM currently only supports the EPICS Channel Access (CA) protocol. It uses  <LINK link={"https://indico.fnal.gov/event/58280/contributions/264787/"}>epics-tca</LINK>  as 
        the CA client. This library is sololy written in TypeScipt, which saves the effort of setting up the environment for the CA client on different platforms.
        </P>


        <H2 registry={registry}>Build</H2>

        TDM can be built and run on different platforms, including Windows, Linux and MacOS.

        <H3 registry={registry}>Node Package Manager (npm)</H3>
        
        <P>
        To build TDM from source code, you need to set up the Node development environment first. It is recommended to use <LINK link={"https://www.npmjs.com/"}>npm</LINK>. 
        Please following this <LINK link={"https://docs.npmjs.com/downloading-and-installing-node-js-and-npm"}>instruction</LINK> to install Node and npm.
        </P>

        <H3  registry={registry}>TypeScript Compiler (tsc)</H3>
        <P>
            <code>tsc</code> is required to transpile the TypeScript code to JavaScript. We can install it using npm:
        </P>

        <code>
            npm install -g typescript
        </code>

        <P>
        The <code>-g</code> option means this software is installed to a globally available location. After this step, we should be 
        able to run <code>tsc</code> command.
        </P>

        <H3  registry={registry}>Download and Compile TDM</H3>
        <P>
        Download the TDM source code:
        </P>

        <code>git clone https://code-int.ornl.gov/1h7/tdm.git</code>

        <P>
            All the source code are in <code>src</code> folder. Most code are TypeScript files with suffix <code>ts</code> or <code>tsx</code>. 
            We should download the dependent libraries to compile TDM. On the top level folder of TDM, run
        </P>

        <code>npm i</code>
        <code>npm i -D</code>

        <P>
        The first command installs the necessary libraries for building and running TDM in development environment. 
        The second command is optional, it installs the tools for developing, building and packaging the software.
        All the dependent libraries are installed to the <code>node_modules</code> folder.
        </P>

        <P>
        Next, we transpile the TypeScript code to JavaScript code. On the top level folder of TDM, run
        </P>

        <code>
            tsc
        </code>

        <P>
        To improve the performance of the software, we bundle more than 400 JavaScript files into one file using <LINK link={"https://webpack.js.org/"}>webpack</LINK>.
        </P>

        <code>
            npm run build
        </code>

        <P>
            Now we can run TDM:
        </P>

        <code>
            npm start
        </code>

        <H3  registry={registry}>Packaging</H3>
        <P>
        Electron has the corss compilation capability on various host operating systems. 
        We can package TDM to standalone and portable software that run on different platforms from one host.
        </P>

        <P>
            This command generates the MacOS application for different targets:
        </P>

        <code>
        npm run build-mac
        </code>

        <code>
        npm run build-windows
        </code>

        <code>
        npm run build-linux
        </code>

        <P>
            Or run <code>npm run build-all</code> to build all the above targets. 
            You can find the software for different platforms in <code>out</code> folder.
        </P>


        <H2  registry={registry}>Architect</H2>

        <IMG src={"resources/help/architect.png"}></IMG>

        <P>
            TDM is based on Electron to build the desktop application. As shown in the above figure, there is one main process and multiple renderer processes
            in an TDM instance. The main process handles the logic behind the scene: realizes the Channel Access protocol, processes
            data, manages and communicate with renderer processes, reads and writes files, hosts the Local PV server, manage profiles, etc.
            Each renderer process corresponds to a window seen by the user. The renderer process loads an html file and display it in the 
            GUI window. The html file contains the elements and JavaScript programs for the users to interface and interact. 
        </P>
        <P>
            Each main process or renderer process runs in a separate operating system process. Instead of using the Electron's native inter-process communication (IPC) 
            mechanism, a WebSocket-based layer is created to realize the IPC. In this way, 
            the TDM can expand its functionalities by adopting the current IPC architect.
        </P>

    </ARTICLE>)
};
