
// Take input from [0, n] and return it as [0, 1]
export function bound01(n: number, max: number) {

    let n1 = Math.min(max, Math.max(0, n));

    if ((Math.abs(n1 - max) < 0.000001)) {
        return 1;
    }

    return (n1 % max) / max;
}

export function rgb2hsv(rgb: [number, number, number, number]): [number, number, number, number] {

    let r: number = bound01(rgb[0], 255);
    let g: number = bound01(rgb[1], 255);
    let b: number = bound01(rgb[2], 255);

    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h = 0, s, v = max;

    var d = max - min;
    s = max === 0 ? 0 : d / max;

    if (max == min) {
        h = 0; // achromatic
    }
    else {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return ([h * 360, s * 100, v * 100, rgb[3]]);
}


export function hsv2rgb(hsv: [number, number, number, number]): [number, number, number, number] {

    let h1: number = bound01(hsv[0], 360) * 6;
    let s1: number = bound01(hsv[1], 100);
    let v1: number = bound01(hsv[2], 100);

    let i: number = Math.floor(h1);
    let f: number = h1 - i;
    let p: number = v1 * (1 - s1);
    let q: number = v1 * (1 - f * s1);
    let t: number = v1 * (1 - (1 - f) * s1);
    let mod: number = i % 6;
    let r: number = [v1, q, p, p, t, v1][mod];
    let g: number = [t, v1, v1, q, p, p][mod];
    let b: number = [p, p, t, v1, v1, q][mod];

    // return ([r * 255, g * 255, b * 255]);
    return ([Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), hsv[3]]);
}


export function pad2(c: string) {
    return c.length == 1 ? '0' + c : '' + c;
}


export function rgb2hex(rgb: [number, number, number, number]) {

    var hex = [
        pad2(Math.round(rgb[0]).toString(16)),
        pad2(Math.round(rgb[1]).toString(16)),
        pad2(Math.round(rgb[2]).toString(16))
    ];
    return ("#" + hex.join(""));
}

// 
export function hex2rgb(hex: string, a: number) {
    let r = parseInt(`${hex.charAt(1)}${hex.charAt(2)}`, 16);
    let g = parseInt(`${hex.charAt(3)}${hex.charAt(4)}`, 16);
    let b = parseInt(`${hex.charAt(5)}${hex.charAt(6)}`, 16);
    return ([r, g, b, a]);
}
