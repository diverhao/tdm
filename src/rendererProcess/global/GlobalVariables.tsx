import { Widgets } from "./Widgets";

// a mockup is used to silence TypeScript
export let g_widgets1: Widgets = undefined; // g_widgets1_mockup;

export const g_setWidgets1 = (widgets: Widgets) => {
    g_widgets1 = widgets;
};
