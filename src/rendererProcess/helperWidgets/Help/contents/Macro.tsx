import * as React from "react";
import { Help } from "../Help";
import { LINK, IMG, ARTICLE, P, H1, H2, H3, SLIDESHOW, LI } from "../Elements"

export const Macro = (widget: Help, linkPath: string) => {
    return <Element widget={widget} linkPath={linkPath}></Element>
}

const Element = ({ widget, linkPath }: any) => {
    const registry = React.useRef<Record<string, string[]>>({});

    return (<ARTICLE registry={registry} linkPath={linkPath} title={"Macro"}>
        <P>
            Definition of macro. 
            Macro format.
            Places that macros are used: profile (only for default windows), Canvas, ActionButton.
            Macro inheritance: external &ge; Canvas. The external comes from profile, Action button
        </P>
    </ARTICLE>)
};
