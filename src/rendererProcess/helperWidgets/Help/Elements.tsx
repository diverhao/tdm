import * as React from "react";
import { Link } from "react-router-dom";
import { Help } from "./Help";
import { HashLink } from "react-router-hash-link";

/**
 * Shared elements used by Help widget
*/

export const LINK = ({ link, to, widget, children }: any) => {
    const elementRef = React.useRef<any>(null)
    if (to === undefined) {
        return (
            <a
                style={{
                    color: "rgba(0,120,15,1)",
                    textDecoration: "none",
                }}
                ref={elementRef}
                href={link}
                target={"_blank"}
                onMouseEnter={() => {
                    if (elementRef.current !== null) {
                        elementRef.current.style["textDecoration"] = "underline";
                    }
                }}
                onMouseLeave={() => {
                    if (elementRef.current !== null) {
                        elementRef.current.style["textDecoration"] = "none";
                    }
                }}
            >
                {children}
            </a>
        )
    } else {
        return (
            <Link
                style={{
                    color: "rgba(0,120,15,1)",
                    textDecoration: "none",
                }}
                ref={elementRef}
                to={to}
                onMouseEnter={() => {
                    if (elementRef.current !== null) {
                        elementRef.current.style["textDecoration"] = "underline";
                    }
                }}
                onMouseLeave={() => {
                    if (elementRef.current !== null) {
                        elementRef.current.style["textDecoration"] = "none";
                    }
                }}

                onClick={() => {
                    if (widget instanceof Help) {

                        widget.selectedLinkPath = to;
                        widget.selectedChapter = "";
                        widget.expandedChapter = "";
                        // find new selected and expanded chapter
                        for (let content of widget.data) {
                            if ("articleName" in content) {
                                const article = content;
                                const articleName = article["articleName"];
                                const linkPath = article["linkPath"];
                                const element = article["element"];
                                if (linkPath === to) {

                                }
                            } else if ("chapterName" in content) {
                                const chapter = content;
                                const chapterName = chapter["chapterName"];
                                const articles = chapter["articles"];
                                for (let article of articles) {
                                    const articleName = article["articleName"];
                                    const linkPath = article["linkPath"];
                                    const element = article["element"];
                                    if (linkPath === to) {
                                        widget.selectedChapter = chapterName;
                                        widget.expandedChapter = chapterName;
                                        break;
                                    }
                                }
                            }
                        }
                        if (widget.forceUpdate !== undefined) {
                            widget.forceUpdate({});
                        }

                    } else {
                    }
                }}
            >
                {children}
            </Link>
        )
    }
}

export const H1 = ({ children, marginTop }: any) => {
    return (<p style={{
        fontSize: 35,
        marginBottom: 20,
        marginTop: marginTop === undefined ? "default" : marginTop,
    }}>{children}</p>)
}

export const H2 = ({ children, marginTop, registry }: any) => {
    // register 
    if (registry !== undefined) {
        registry.current[`${children}`] = [];
    }
    return (<p style={{
        fontSize: 25,
        marginBottom: 10,
        marginTop: marginTop === undefined ? "default" : marginTop,
        scrollMarginTop: 55, // top banner height + 5
    }}
        id={children}>
        {children}
    </p>)
}

export const H3 = ({ children, marginTop, registry }: any) => {
    // register 
    if (registry !== undefined) {
        const parentH2 = Object.keys(registry.current)[Object.keys(registry.current).length - 1];
        if (parentH2 !== undefined) {
            registry.current[parentH2].push(`${children}`);
        }
    }
    return (<p style={{
        fontSize: 20,
        marginBottom: 5,
        marginTop: marginTop === undefined ? "default" : marginTop,
        scrollMarginTop: 55, // top banner height + 5

    }}
        id={children}
    >
        {children}
    </p>)
}

export const P = ({ children }: any) => {
    return <p style={{ lineHeight: 1.6, whiteSpace: "normal", marginTop: 8, marginBottom: 8 }}>{children}</p>
}

export const IMG = ({ children, src, width }: any) => {
    return (
        <div style={{
            display: "inline-flex",
            justifyContent: 'center',
            alignItems: "center",
            width: "100%",
        }}>
            <img width={width === undefined ? "90%" : width} src={src} style={{
                borderRadius: 3,
                overflow: "hidden",

            }}>{children}</img>
        </div>
    )
}

export const LI = ({ children }: any) => {
    return (
        <li style={{
            lineHeight: 1.6
        }}>{children}</li>
    )
}

export const SLIDESHOW = ({ images, titles, texts }: any) => {
    const [imageIndex, setImageIndex] = React.useState(0);
    return (
        <div style={{
            width: "100%",
            aspectRatio: "2/1",
            position: "relative",
            // border: "solid 1px blue",
            display: "inline-flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            backgroundColor: "rgba(230, 230, 230, 1)",
            padding: 20,
            boxSizing: "border-box",
            fontWeight: "lighter",
        }}>
            <div style={{
                borderRadius: 3,
                overflow: "hidden",
            }}>
                <img width="100%" style={{
                    objectFit: "contain",
                }} src={images[imageIndex]}>
                </img>

            </div>
            <div style={{
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "column",
                width: "70%",
            }}>
                <div style={{
                    marginTop: 25,
                    marginBottom: 10,
                    textAlign: "center",
                    fontSize: 20,
                }}>
                    <b>{titles[imageIndex]}</b>
                </div>
                <div style={{
                    marginBottom: 25,
                    textAlign: "center",
                    lineHeight: 1.6,
                }}>
                    {texts[imageIndex]}
                </div>
                <div style={{
                    display: "inline-flex",
                    flexDirection: "row"
                }}>
                    {images.map((image: string, index: number) => {
                        return (
                            <div
                                key={image + `-${index}`}
                                style={{
                                    display: "inline-flex",
                                    cursor: "pointer",
                                }}
                                onClick={() => {
                                    setImageIndex(index)
                                }}
                            >
                                {index !== imageIndex ? <>&#9723;</> : <>&#9724;</>}
                            </div>)
                    })}
                </div>
            </div>
        </div>
    )
}

export const HASHLINK = ({ linkPath, text }: any) => {
    const elementRef = React.useRef<any>(null);
    return (
        <HashLink
            ref={elementRef}
            style={{
                color: "rgba(0,0,0,0.5)",
                textDecoration: "none",
            }}
            to={`${linkPath}#${text}`}
            onMouseEnter={
                () => {
                    if (elementRef.current !== null) {
                        elementRef.current.style["color"] = `rgba(0,0,0,1)`;
                    }
                }
            }
            onMouseLeave={
                () => {
                    if (elementRef.current !== null) {
                        elementRef.current.style["color"] = `rgba(0,0,0,0.5)`;
                    }
                }
            }
        >{text}
        </HashLink>
    )
}

export const ARTICLE = ({ children, registry, title, linkPath }: any) => {
    const [, forceUpdate] = React.useState({});
    React.useEffect(() => {
        forceUpdate({});
    }, [])
    return (
        <div style={{
            // fontWeight: "lighter",
            display: "inline-flex",
            width: "100%",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "flex-start",
            paddingLeft: 40,
            boxSizing: "border-box",
            // overflow: "auto",
            // height: "50%"
            marginBottom: 30,
        }}>
            {/* dummy spaces for articles that are not wide enough */}
            <div style={{
                userSelect: "none",
                backgroundColor: "rgba(0,0,0,0)",
                color: "rgba(0,0,0,0)",
            }}>
                ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
            </div>

            <H1 marginTop={0}>{title}</H1>
            {registry !== undefined ?
                <ul style={{
                    paddingLeft: 0,
                    listStyleType: "none",
                    lineHeight: 1.5,
                }}>
                    {Object.keys(registry.current).map((titleH2: string) => {
                        return (
                            <li>
                                <HASHLINK text={titleH2} linkPath={linkPath}></HASHLINK>
                                <ul style={{
                                    paddingLeft: 15,
                                    listStyleType: "none",
                                }}>
                                    {registry.current[titleH2].map((titleH3: string) => {
                                        return (
                                            <li>
                                                <HASHLINK text={titleH3} linkPath={linkPath}></HASHLINK>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </li>
                        )
                    })}
                </ul> : null}

            {children}

            <div style={{
                width: "100%",
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "column",
                color: "rgba(0,0,0,0.5)",
            }}>
                <div style={{
                    width: "100%",
                }}>
                    <hr />
                </div>
                Copyright &copy; 2024, the TDM contributors.
            </div>
        </div>
    )

}
