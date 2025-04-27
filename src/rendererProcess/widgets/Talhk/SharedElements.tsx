import * as React from "react";
import { mainPage } from "./MainPage";

export const ElementModifyButton = ({ imgSrc, handleClick, hint, setHint }: { imgSrc: string, handleClick: () => void, hint: string, setHint: (hint: string) => void }) => {
    const imgRef = React.useRef<any>(null);

    return (
        <img
            ref={imgRef}
            src={imgSrc}
            style={{
                width: mainPage?.baseFontSize,
                height: mainPage?.baseFontSize,
                cursor: "pointer",
                opacity: 0.2,
                marginLeft: 3,

            }}
            onClick={() => {
                handleClick();
            }}
            onMouseEnter={() => {
                if (imgRef.current !== null) {
                    imgRef.current.style["opacity"] = 1;
                    imgRef.current.style["outline"] = 'solid 2px blue';
                    // imgRef.current.style["filter"] = 'invert(100%)';
                    // imgRef.current.style["backgroundColor"] = 'rgba(255,255,255,1)';
                }
                setHint(hint)
            }}


            onMouseLeave={() => {
                if (imgRef.current !== null) {
                    imgRef.current.style["opacity"] = 0.2;
                    imgRef.current.style["outline"] = 'none';
                    // imgRef.current.style["filter"] = '';
                    // imgRef.current.style["backgroundColor"] = 'rgba(0,0,0,0)';
                }
                setHint("")
            }}
        >
        </img>
    )
}
