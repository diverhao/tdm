import * as React from "react";
import { Link } from "react-router-dom";
import { Help } from "./Help";
import { HashLink } from "react-router-hash-link";
import { exp } from "mathjs";

/**
 * Shared elements used by Help widget
*/

export const LINK = ({ link, to, widget, children }: any) => {
    const elementRef = React.useRef<any>(null)
    if (to === undefined) {
        return (
            <span>
                {" "}
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
                {" "}
            </span>
        )
    } else {
        return (
            <span>
                {" "}

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
                {" "}
            </span>

        )
    }
}

export const H1 = ({ children, marginTop }: any) => {
    return (<p style={{
        fontSize: 35,
        marginBottom: 20,
        marginTop: marginTop === undefined ? "default" : marginTop,
        color: "rgba(0,0,0,1)",
        fontWeight: 500,
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
        color: "rgba(0,0,0,1)",
        fontWeight: 500,
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
        color: "rgba(0,0,0,1)",
        fontWeight: 500,
    }}
        id={children}
    >
        {children}
    </p>)
}

export const P = ({ children }: any) => {
    return <p
        style={{
            lineHeight: 1.6,
            whiteSpace: "normal",
            marginTop: 8,
            marginBottom: 8,
            color: "rgba(20,20,20,1)",
            fontWeight: 300,
        }}
    >
        {children}
    </p>
}

export const IMG = ({ children, src, width }: any) => {
    return (
        <div style={{
            display: "inline-flex",
            justifyContent: 'flex-start',
            alignItems: "center",
            width: "100%",
            marginTop: 20,
            marginBottom: 20,
        }}>
            <img width={width === undefined ? "70%" : width} src={src} style={{
                borderRadius: 5,
                overflow: "hidden",
                border: "solid 1px rgba(200,200,200,1)",
                boxSizing: "border-box",
            }}>{children}</img>
        </div>
    )
}

export const LI = ({ children }: any) => {
    return (
        <li style={{
            lineHeight: 1.6,
            color: "rgba(20,20,20,1)",
            fontWeight: 300,
        }}>{children}</li>
    )
}

export const CODE = ({ children }: any) => {
    console.log("CODE", children);
    const lines: string[] = [];
    if (typeof children === "string") {
        children.split("\n").forEach((line: string, index: number) => {
            if (line.trim() !== "") {
                lines.push(line);
            }
        });
    }

    const elementCopyRef = React.useRef<any>(null);
    const [copyText, setCopyText] = React.useState("Copy");

    return (
        <div style={{
            fontFamily: "monospace",
            padding: 10,
            paddingTop: 5,
            paddingBottom: 5,
            border: "1px solid #ccc",
            borderRadius: 5,
            marginTop: 10,
            marginBottom: 10,
            width: "100%",
            display: "inline-flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            boxSizing: "border-box",
        }}>
            <div style={{
                display: "inline-flex",
                flexDirection: "column",
                width: "100%",
                margin: 0,
                padding: 0,
            }}>

                {lines.map((line: string, index: number) => {
                    return (
                        <pre style={{
                            marginTop: 3,
                            marginBottom: 3,
                        }} key={index}>
                            {line}
                        </pre>
                    )
                })}
            </div>

            <div
                ref={elementCopyRef}
                style={{
                    backgroundColor: "rgba(240,240,240,1)",
                    height: "100%",
                    display: "inline-flex",
                    justifyContent: "flex-start",
                    alignItems: "flex-end",
                    marginTop: 0,
                    marginBottom: 0,
                    padding: 3,
                    paddingLeft: 8,
                    paddingRight: 8,
                    borderRadius: 3,
                    fontFamily: "Inter, sans-serif",
                    cursor: "pointer",
                    fontSize: 12,
                }}
                onMouseEnter={() => {
                    if (elementCopyRef.current !== null) {
                        elementCopyRef.current.style["backgroundColor"] = "rgba(200,200,200,1)";
                    }
                }}
                onMouseLeave={() => {
                    if (elementCopyRef.current !== null) {
                        elementCopyRef.current.style["backgroundColor"] = "rgba(240,240,240,1)";
                    }
                }}
                onClick={() => {
                    if (elementCopyRef.current !== null) {
                        navigator.clipboard.writeText(lines.join("\n")).then(() => {
                            setCopyText("Copied");
                            setTimeout(() => {
                                setCopyText("Copy");
                            }, 1000);
                        });
                    }
                }}
            >
                {copyText}
            </div>
        </div >
    )
}

export const SLIDESHOW = ({ images, titles, texts, width }: any) => {
    const [imageIndex, setImageIndex] = React.useState(0);
    return (
        <div style={{
            width: width === undefined ? "70%" : width,
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
            borderRadius: 5,
            fontFamily: "Inter, sans-serif",
            fontSize: 16,
            fontWeight: 300,
            color: "rgba(20,20,20,1)",
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




const treeResult: Record<string, any> = {};

export const parseTree = (tree: string): any => {
    const lines = tree.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith("├── ") || line.startsWith("└── ") || line.startsWith("│   ")) {
            parseLine(lines, i, treeResult);
            break;
        }
    }
    return treeResult;
}

const findLastFolderContentOnLevel = (level: number, data: Record<string, any>) => {
    if (level === 0) {
        return data;
    }

    const lastElement = Object.values(data).reverse()[0];
    if (typeof lastElement === 'object') {
        return findLastFolderContentOnLevel(level - 1, lastElement);
    } else {
        return data;
    }
}

const parseLine = (lines: string[], lineNum: number, parentData: Record<string, any>): any => {
    const reg = /(│   |├── |└── |    )/g;

    let line = lines[lineNum];
    if (line.trim().endsWith("~")) {
        // skip lines that end with ~
        parseLine(lines, lineNum + 1, parentData);
        return;
    }
    const level = line.match(reg)?.length || 0;
    const name = line.replace(reg, "").trim();

    const nextLine = lines[lineNum + 1];
    if (nextLine === undefined || nextLine.trim() === "") {
        // reach the end of the tree
    }
    const nextLineLevel = nextLine?.match(reg)?.length || -1;
    const nextName = nextLine?.replace(reg, "").trim();
    // console.log(level, nextLineLevel, name, nextName);

    if (level === nextLineLevel) {
        // next line is a sibling file or sibling folder
        // they have the same parent
        // this line may be a file or empty folder
        // console.log("same level", name, nextName);
        parentData[name] = "";
        parseLine(lines, lineNum + 1, parentData);
    } else if (level < nextLineLevel) {
        // next line is a child, this line must be a folder
        parentData[name] = {};
        parseLine(lines, lineNum + 1, parentData[name]);
    } else if (level > nextLineLevel) {
        // next line is an uncle or aunt
        // this line may be a file or empty folder
        // we are reaching the end of a branch
        parentData[name] = "";
        if (nextLineLevel === -1) {
            // end of file, return
            return;
        } else {
            // we need to go back to find the next line's parent folder
            const parentLevel = nextLineLevel - 1;
            const parentFolder = findLastFolderContentOnLevel(parentLevel, treeResult);
            if (parentFolder === undefined) {
                console.error("Parent folder not found for level", parentLevel, "in", treeResult);
                return;
            }
            parseLine(lines, lineNum + 1, parentFolder);
        }
    }
}

export const TREEWRAP = ({ tree, sideNote }: any) => {
    return (
        <div style={{
            border: "solid 1px rgba(200,200,200,1)",
            borderRadius: 5,
            width: "100%",
            paddingTop: 10,
            paddingBottom: 10,
            boxSizing: "border-box",
        }}>
            <TREE tree={tree} sideNote={sideNote} prefix={""} />
        </div>
    )
}

export const TREE = ({ tree, sideNote, prefix }: { tree: Record<string, any>, sideNote: any, prefix: string }) => {

    return (
        <div
            style={{
                display: "inline-flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "flex-start",
                width: "100%",
                overflow: "hidden",
                transition: "maxHeight 1.2s ease",
                boxSizing: "border-box",
            }}
        >
            {Object.entries(tree).map(([key, value]: [string, any]) => {
                if (typeof value === 'object' && value !== null) {
                    // a folder
                    return (
                        <TREEFOLDER name={key} value={value} key={key} sideNote={sideNote} prefix={prefix}>
                        </TREEFOLDER>
                    );
                } else if (value === "") {
                    // a file or empty folder
                    return (
                        <div key={key} style={{ marginLeft: 30, padding: 0, display: "inline-flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start", backgroundColor: "rgba(240,240,240,0)", borderRadius: 3, boxSizing: "border-box", }}>
                            <TREENAME prefix={prefix} name={key} type={"file"} expanded={undefined} setExpanded={undefined} sideNote={sideNote} />
                        </div>
                    );
                } else {
                    // fallback case, should not happen
                    return (
                        <div key={key} style={{ marginLeft: 30 }}>
                            <span>{key}: {value}</span>
                        </div>
                    );
                }
            })}
        </div>
    )
}

const TREEFOLDER = ({ name, value, sideNote, prefix }: any) => {
    const [expanded, setExpanded] = React.useState(false);
    const contentRef = React.useRef<HTMLDivElement>(null);
    const [maxHeight, setMaxHeight] = React.useState(0);
    const calcTransitionDuration = () => {
        if (contentRef.current !== null) {
            const scrollHeight = contentRef.current.scrollHeight;
            return scrollHeight / 1500 * 4 + "s";
        }
        return "0.4s";
    }

    return (
        <div
            style={{
                marginLeft: 30,
                padding: 0,
                display: "inline-flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "flex-start",
                backgroundColor: "rgba(240,240,240,0)",
                borderRadius: 3,
                boxSizing: "border-box",
                transition: "background-color 1.2s ease",
            }}
        >
            <TREENAME prefix={prefix} name={name} type={"folder"} expanded={expanded} setExpanded={setExpanded} sideNote={sideNote} />
            <div
                ref={contentRef}
                style={{
                    // maxHeight: expanded ? 5000 : 0,
                    // height: calcTransitionDuration(),
                    opacity: 1,
                    overflow: "hidden",
                    // transition: `max-height ${calcTransitionDuration()} cubic-bezier(0.4, 0, 0.2, 1)`,

                    width: "100%",
                }}
            >
                {expanded ?
                    <TREE prefix={prefix + "/" + name} tree={value} sideNote={sideNote} />
                    : null}
            </div>
        </div>

    )
}

const TREENAME = ({ name, type, expanded, setExpanded, sideNote, prefix }: any) => {
    const [showSideNote, setShowSideNote] = React.useState(false);
    return (
        <span
            style={{
                cursor: type === "file" ? "default" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                // justifyContent: "center",
                gap: 5,
                padding: 5,
                boxSizing: "border-box",
            }}
            onMouseDown={() => {
                if (type === "file" || setExpanded === undefined) {
                    // do nothing
                    return;
                }
                setExpanded(!expanded);
            }}
            onMouseEnter={() => {
                if (sideNote[prefix + "/" + name] !== undefined && sideNote[prefix + "/" + name] !== "") {
                    setShowSideNote(true);
                }
            }}
            onMouseLeave={() => {
                setShowSideNote(false);
            }}
        >
            <img src={type === "folder" ? "resources/webpages/folder-symbol.svg" : "resources/webpages/document-symbol.svg"} height={"16px"}></img>
            {" "}
            {name}
            {showSideNote && sideNote[prefix + "/" + name] !== undefined && sideNote[prefix + "/" + name] !== "" ?
                <TREESIDENOTE text={sideNote[prefix + "/" + name]}></TREESIDENOTE>
                :
                null}
        </span>
    )
}

const TREESIDENOTE = ({ text }: any) => {
    if (text === undefined || text === "") {
        return null;
    }

    return (
        <div style={{
            // width: "100%",
            display: "inline-flex",
            // flexDirection: "column",
            // justifyContent: "flex-start",
            // alignItems: "flex-start",
            // paddingLeft: 20,
            // paddingRight: 20,
            boxSizing: "border-box",
            fontSize: 12,
            marginLeft: 30,
            color: "rgba(180,180,180,1)",
        }}>
            {text}
        </div>
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
            boxSizing: "border-box",
            paddingLeft: 20,
            marginBottom: 30,
            color: "rgba(50,50,50,1)",
            fontWeight: 300,
            fontFamily: "Inter, sans-serif",
        }}>
            {/* dummy spaces for articles that are not wide enough */}
            <div style={{
                userSelect: "none",
                height: 1,
                paddingLeft: 20,
                width: "100%",
                backgroundColor: "rgba(255,0,0,0)",
                color: "rgba(0,0,0,0)",
            }}>
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
