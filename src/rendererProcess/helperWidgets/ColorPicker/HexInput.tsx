import * as React from 'react'
import {rgb2hex, hex2rgb} from "./Helper"
import { g_widgets1 } from '../../global/GlobalVariables';

const HexInputRaw = ({ rgb, handleColorUpdate }: any) => {
    // string starting with "#"
    const [hex, setHex] = React.useState(rgb2hex(rgb));

    React.useEffect(() => {
        setHex(rgb2hex(rgb));
    }, [rgb]);

    let style: Record<string, any> = {
        width: "100%",
        display: "inline-block",
        marginTop: 3,
        marginBottom: 3,
    }

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setHex(event.target.value);
        // if hex is valid
        if (/^#[0-9A-F]{6}$/i.test(event.target.value)) {
            handleColorUpdate(hex2rgb(event.target.value, rgb[3]));
            const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
            history.registerAction();
    
        }
    }

    return (
        <div style={style}>
            Hex: <input value={hex} onChange={(event) => handleChange(event)} spellCheck="false" style={{ width: "50%" }}></input>
        </div>
    )
}

export const HexInput = React.memo(HexInputRaw);
