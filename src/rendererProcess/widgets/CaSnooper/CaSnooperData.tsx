import { CaSnooper } from "./CaSnooper";


export class CaSnooperData {
    private _caSnooper: CaSnooper;
    constructor(caSnooper: CaSnooper) {
        this._caSnooper = caSnooper;
    }


    getCaSnooper = () => {
        return this._caSnooper;
    }
}