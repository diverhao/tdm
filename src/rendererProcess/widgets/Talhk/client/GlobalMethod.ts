import { SEVERITES } from "./MainPage";



export const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export const replaceObjectField = (object: Record<string, any>, oldFieldName: string, newFieldName: string, newFieldValue: any) => {
    const newObject: Record<string, any> = {};
    for (const key of Object.keys(object)) {
        if (key === oldFieldName) {
            newObject[newFieldName] = newFieldValue;
        } else {
            newObject[key] = object[key];
        }
    }

    // Copy properties back to the original object
    Object.keys(object).forEach(k => delete object[k]);
    Object.assign(object, newObject);
}



export const calcSeverityColor = (severity: SEVERITES) => {
    if (severity === SEVERITES.NO_ALARM) {
        return ("rgb(0, 128, 0)");
    } else if (severity === SEVERITES.MINOR) {
        return ("rgba(255,128,0,1)");
    } else if (severity === SEVERITES.MAJOR) {
        return ("rgba(255,0,0,1)");
    } else if (severity === SEVERITES.INVALID) {
        return ("rgba(255,0,255,1)");
    } else if (severity === SEVERITES.NOT_CONNECTED) {
        return ("rgba(200,0,200,1)");
    } else {
        return ("rgba(255,0,255,1)");
    }
}

export const speakText = (text: string) => {
    // const text = "Hello! I'm speaking this text out loud.";
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = 1.3;
    speechSynthesis.speak(utterance);
}


export const convertEpochTimeToString = (msSince1970UTC: number) => {
    const timezoneOffsetMs = new Date().getTimezoneOffset() * 60 * 1000;
    let dateStr = new Date(msSince1970UTC - timezoneOffsetMs).toISOString().replace("T", " ").replace("Z", "");
    return dateStr;
};
