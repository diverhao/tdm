import * as React from "react";
import { Help } from "../Help";
import { LINK, IMG, ARTICLE, P, H1, H2, H3, SLIDESHOW } from "../Elements"

export const Dummy = (widget: Help, linkPath: string) => {
    return <Element widget={widget} linkPath={linkPath}></Element>
}

const Element = ({ widget, linkPath }: any) => {
    const registry = React.useRef<Record<string, string[]>>({});
    return (
        <ARTICLE registry={registry} linkPath={linkPath} title={"Work In Progress"}>
            <P>
                Please allow us more time to finish this documentation.
            </P>
        </ARTICLE>
    )

};

