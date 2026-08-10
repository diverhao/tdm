import { epicsUnixDt } from "./GlobalVariables";

export class EpicsDate {
    readonly date: Date;
    private constructor(epicsTimeMs: number) {
        const unixTimeMs = epicsTimeMs + epicsUnixDt;
        this.date = new Date(unixTimeMs);
    }

    static fromUnixTimeMs = (unixTimeMs: number): EpicsDate => {
        const epicsTimeMs = unixTimeMs - epicsUnixDt;
        return new EpicsDate(epicsTimeMs);
    }

    static fromEpicsTimeMs = (epicsTimeMs: number): EpicsDate => {
        return new EpicsDate(epicsTimeMs);
    }

    static fromNow = () => {
        return new EpicsDate(Date.now());
    }

    toString = () => {
        let date = this.date;
        // the Date.getXxx() gives the local time, not the UTC time
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
        // Construct the formatted date string
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
    }

    toStringAsFileName = () => {
        return this.toString().replaceAll(" ", "_").replaceAll(":", "-").replaceAll(".", "_");
    }

    // Get milliseconds since the Unix epoch.
    getUnixTimeMs = () => {
        return this.date.getTime();
    }

    // Get milliseconds since the EPICS epoch.
    getEpicsTimeMs = () => {
        return this.date.getTime() - epicsUnixDt;
    }
}
