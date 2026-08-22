import { type_log_levels } from "./Log";

export type { type_tdl } from "./types/type_widget_tdl";

// --------------------- Log ----------------------

export let logLevel: type_log_levels = type_log_levels.debug;

export const setLogLevel = (newLogLevel: type_log_levels) => {
    logLevel = newLogLevel;
}

// --------------- font and color -----------------------

// font, should sync with main window one in mainWindow/
export const defaultFontSize: number = 14;
export const defaultFontFamily: string = "TDM Default";
export const defaultFontStyle: string = "normal";
export const defaultFontWeight: string = "normal";
export const defaultMonoFontFamily: string = "Courier Prime";

export const presetColors: Record<string, [number, number, number, number]> = {};
export const colorSumChange: number = 690;
